import * as duckdb from '@duckdb/duckdb-wasm';
import { tableToIPC } from 'apache-arrow';
import { z } from 'zod';
import { FilterState } from './types';

let db: duckdb.AsyncDuckDB;
let conn: duckdb.AsyncDuckDBConnection;
let isInitialized = false;
let latestRequestId = 0;
const OPTIONS_SEPARATOR = '\u001F';

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

const toTransferableBuffer = (bytes: Uint8Array): ArrayBuffer => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

async function initDB() {
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
  const worker_url = bundle.mainWorker!;
  const worker_code = `importScripts("${worker_url}");`;
  const blob = new Blob([worker_code], { type: 'text/javascript' });
  const blob_url = URL.createObjectURL(blob);
  const worker = new Worker(blob_url);

  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  URL.revokeObjectURL(blob_url);
  conn = await db.connect();
}

const initPromise = initDB();

const filterSchema = z.object({
  city: z.array(z.string().regex(/^[\p{L}\p{N} .,:;()\-_/+]+$/u)).max(200).optional(),
  year: z.array(z.string().regex(/^\d{4}$/)).max(50).optional(),
  month: z.array(z.string().regex(/^[\p{L}\p{N} .,:;()\-_/+]+$/u)).max(50).optional(),
  format: z.array(z.string().regex(/^[A-Z0-9]{1,12}$/)).max(50).optional(),
  vendor: z.array(z.string().regex(/^[\p{L}\p{N} .,:;()\-_/+]+$/u)).max(200).optional(),
});

const buildInClause = (column: string, values: string[]): string | null => {
  if (!values.length) return null;
  const placeholders = values.map(() => '?').join(', ');
  return `${column} IN (${placeholders})`;
};

const createWhere = (filters: Required<FilterState>, excludeKey: keyof FilterState | null = null) => {
  const clauses: string[] = ['1=1'];
  const params: string[] = [];

  if (excludeKey !== 'city' && filters.city.length) {
    const clause = buildInClause('city', filters.city);
    if (clause) {
      clauses.push(clause);
      params.push(...filters.city);
    }
  }

  if (excludeKey !== 'year' && filters.year.length) {
    const clause = buildInClause('CAST(year AS VARCHAR)', filters.year);
    if (clause) {
      clauses.push(clause);
      params.push(...filters.year);
    }
  }

  if (excludeKey !== 'month' && filters.month.length) {
    const clause = buildInClause('month', filters.month);
    if (clause) {
      clauses.push(clause);
      params.push(...filters.month);
    }
  }

  if (excludeKey !== 'format' && filters.format.length) {
    const clause = buildInClause('format', filters.format);
    if (clause) {
      clauses.push(clause);
      params.push(...filters.format);
    }
  }

  if (excludeKey !== 'vendor' && filters.vendor.length) {
    const clause = buildInClause('vendor', filters.vendor);
    if (clause) {
      clauses.push(clause);
      params.push(...filters.vendor);
    }
  }

  return { where: clauses.join(' AND '), params };
};

const queryArrowTable = async (sql: string, params: string[] = []) => {
  const statement = await conn.prepare(sql);
  try {
    return await statement.query(...params);
  } finally {
    await statement.close();
  }
};

type WorkerMessage =
  | { type: 'LOAD_DATA'; payload: { files: string[]; basePath: string } }
  | { type: 'QUERY'; payload: { filters: FilterState; requestId: number } };

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return 'Произошла неизвестная ошибка при обработке данных.';
};

const postError = (err: unknown) => {
  const message = getErrorMessage(err);
  self.postMessage({ type: 'ERROR', message });
};

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  try {
    await initPromise;
    const { type, payload } = e.data;

    if (type === 'LOAD_DATA') {
      const { files, basePath } = payload;

      for (const file of files) {
        await db.registerFileURL(
          file,
          `${location.origin}/${basePath}/${file}`,
          duckdb.DuckDBDataProtocol.HTTP,
          false,
        );
      }

      const fileListSql = files.map((f) => `'${f}'`).join(', ');

      await conn.query(`
        CREATE OR REPLACE VIEW ooh_data AS
        SELECT
          src."Адрес в системе Admetrix" as address,
          src."Город" as city,
          COALESCE(
            TRY_CAST(src."Год" AS INTEGER),
            TRY_CAST(regexp_extract(src.filename, '(?i)(?:^|/)year=(\\d{4})(?:/|$)', 1) AS INTEGER),
            TRY_CAST(regexp_extract(src.filename, '(?i)(?:^|/)(\\d{4})(?:/|$)', 1) AS INTEGER)
          ) as year,
          COALESCE(
            NULLIF(CAST(src."Месяц" AS VARCHAR), ''),
            NULLIF(regexp_extract(src.filename, '(?i)(?:^|/)month=([^/]+)(?:/|$)', 1), '')
          ) as month,
          src."Продавец" as vendor,
          src."Формат поверхности_2" as format,
          TRY_CAST(REPLACE(CAST(src."GRP (18+) в сутки" AS VARCHAR), ',', '.') AS DOUBLE) as grp,
          TRY_CAST(REPLACE(CAST(src."OTS (18+) тыс.чел. в сутки" AS VARCHAR), ',', '.') AS DOUBLE) as ots,
          TRY_CAST(REPLACE(CAST(src."Широта" AS VARCHAR), ',', '.') AS DOUBLE) as lat,
          TRY_CAST(REPLACE(CAST(src."Долгота" AS VARCHAR), ',', '.') AS DOUBLE) as lng
        FROM read_parquet([${fileListSql}], hive_partitioning = true, union_by_name = true, filename = true) as src;
      `);

      isInitialized = true;
      self.postMessage({ type: 'READY' });
    }

    if (type === 'QUERY') {
      if (!isInitialized) return;

      const { filters, requestId } = payload;
      latestRequestId = Math.max(latestRequestId, requestId);

      const parsedFilters = filterSchema.safeParse(filters);
      if (!parsedFilters.success) {
        postError(new Error('Некорректные параметры фильтрации. Обновите фильтры и повторите запрос.'));
        return;
      }

      const safeFilters: Required<FilterState> = {
        city: parsedFilters.data.city ?? [],
        year: parsedFilters.data.year ?? [],
        month: parsedFilters.data.month ?? [],
        format: parsedFilters.data.format ?? [],
        vendor: parsedFilters.data.vendor ?? [],
      };

      const mainFilter = createWhere(safeFilters);
      const cityOptsFilter = createWhere(safeFilters, 'city');
      const yearOptsFilter = createWhere(safeFilters, 'year');
      const monthOptsFilter = createWhere(safeFilters, 'month');
      const formatOptsFilter = createWhere(safeFilters, 'format');
      const vendorOptsFilter = createWhere(safeFilters, 'vendor');

      const kpiTable = await queryArrowTable(`
        SELECT
          AVG(grp) as avgGrp,
          (SELECT AVG(monthly_total) FROM (
             SELECT SUM(ots) as monthly_total
             FROM ooh_data
             WHERE ${mainFilter.where}
             GROUP BY year, month
          )) as totalOts,
          COUNT(DISTINCT address) as uniqueSurfaces
        FROM ooh_data
        WHERE ${mainFilter.where}
      `, [...mainFilter.params, ...mainFilter.params]);

      const mapTable = await queryArrowTable(`
        SELECT
          address, city, vendor, format,
          AVG(grp) as avgGrp,
          AVG(ots) as avgOts,
          MAX(lat) as lat,
          MAX(lng) as lng
        FROM ooh_data
        WHERE ${mainFilter.where}
        GROUP BY address, city, vendor, format
      `, mainFilter.params);

      const trendTable = await queryArrowTable(`
        SELECT month, year, AVG(grp) as avgGrp
        FROM ooh_data WHERE ${mainFilter.where}
        GROUP BY year, month ORDER BY year, month
      `, mainFilter.params);

      const matrixTable = await queryArrowTable(`
        SELECT city, format, AVG(grp) as avgGrp
        FROM ooh_data WHERE ${mainFilter.where}
        GROUP BY city, format
      `, mainFilter.params);

      const reportTable = await queryArrowTable(`
        SELECT city, format, year, month, AVG(grp) as avgGrp, COUNT(*) as sideCount
        FROM ooh_data WHERE ${mainFilter.where}
        GROUP BY city, format, year, month
        ORDER BY city, year, month
      `, mainFilter.params);

      const optionsTable = await queryArrowTable(`
        SELECT
          (
            SELECT COALESCE(string_agg(city, '${OPTIONS_SEPARATOR}'), '')
            FROM (
              SELECT DISTINCT city FROM ooh_data WHERE ${cityOptsFilter.where} ORDER BY city
            )
          ) as cities,
          (
            SELECT COALESCE(string_agg(CAST(year AS VARCHAR), '${OPTIONS_SEPARATOR}'), '')
            FROM (
              SELECT DISTINCT year FROM ooh_data WHERE ${yearOptsFilter.where} ORDER BY year
            )
          ) as years,
          (
            SELECT COALESCE(string_agg(month, '${OPTIONS_SEPARATOR}'), '')
            FROM (
              SELECT DISTINCT month FROM ooh_data WHERE ${monthOptsFilter.where} ORDER BY month
            )
          ) as months,
          (
            SELECT COALESCE(string_agg(format, '${OPTIONS_SEPARATOR}'), '')
            FROM (
              SELECT DISTINCT format FROM ooh_data WHERE ${formatOptsFilter.where} ORDER BY format
            )
          ) as formats,
          (
            SELECT COALESCE(string_agg(vendor, '${OPTIONS_SEPARATOR}'), '')
            FROM (
              SELECT DISTINCT vendor FROM ooh_data WHERE ${vendorOptsFilter.where} ORDER BY vendor
            )
          ) as vendors
      `, [
        ...cityOptsFilter.params,
        ...yearOptsFilter.params,
        ...monthOptsFilter.params,
        ...formatOptsFilter.params,
        ...vendorOptsFilter.params,
      ]);

      if (requestId < latestRequestId) {
        return;
      }

      const kpis = toTransferableBuffer(tableToIPC(kpiTable, 'stream'));
      const mapData = toTransferableBuffer(tableToIPC(mapTable, 'stream'));
      const trendData = toTransferableBuffer(tableToIPC(trendTable, 'stream'));
      const matrixData = toTransferableBuffer(tableToIPC(matrixTable, 'stream'));
      const reportData = toTransferableBuffer(tableToIPC(reportTable, 'stream'));
      const options = toTransferableBuffer(tableToIPC(optionsTable, 'stream'));

      (self as { postMessage: (message: unknown, transfer: Transferable[]) => void }).postMessage({
        type: 'QUERY_RESULT_ARROW',
        requestId,
        kpis,
        mapData,
        trendData,
        matrixData,
        reportData,
        options,
      }, [kpis, mapData, trendData, matrixData, reportData, options]);
    }
  } catch (err) {
    console.error('DuckDB Worker Error:', err);
    postError(err);
  }
};
