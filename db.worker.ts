import * as duckdb from '@duckdb/duckdb-wasm';
import { z } from 'zod';
import { FilterState, KpiData, MapDataItem, MatrixDataItem, ReportDataItem, SmartOptions, TrendDataItem } from './types';

let db: duckdb.AsyncDuckDB;
let conn: duckdb.AsyncDuckDBConnection;
let isInitialized = false;
let latestRequestId = 0;

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

const serialize = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj, (_, value) => (
  typeof value === 'bigint' ? value.toString() : value
))) as T;

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

const queryWithFilters = async <T>(sql: string, params: string[] = []): Promise<T[]> => {
  const statement = await conn.prepare(sql);
  try {
    const result = await statement.query(...params);
    return result.toArray().map((r) => r.toJSON()) as T[];
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
          "Адрес в системе Admetrix" as address,
          "Город" as city,
          CAST("Год" AS INTEGER) as year,
          "Месяц" as month,
          "Продавец" as vendor,
          "Формат поверхности_2" as format,
          TRY_CAST(REPLACE(CAST("GRP (18+) в сутки" AS VARCHAR), ',', '.') AS DOUBLE) as grp,
          TRY_CAST(REPLACE(CAST("OTS (18+) тыс.чел. в сутки" AS VARCHAR), ',', '.') AS DOUBLE) as ots,
          TRY_CAST(REPLACE(CAST("Широта" AS VARCHAR), ',', '.') AS DOUBLE) as lat,
          TRY_CAST(REPLACE(CAST("Долгота" AS VARCHAR), ',', '.') AS DOUBLE) as lng
        FROM read_parquet([${fileListSql}]);
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

      const kpiRows = await queryWithFilters<KpiData>(`
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

      const mapRows = await queryWithFilters<MapDataItem>(`
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

      const trendRows = await queryWithFilters<TrendDataItem>(`
        SELECT month, year, AVG(grp) as avgGrp
        FROM ooh_data WHERE ${mainFilter.where}
        GROUP BY year, month ORDER BY year, month
      `, mainFilter.params);

      const matrixRows = await queryWithFilters<MatrixDataItem>(`
        SELECT city, format, AVG(grp) as avgGrp
        FROM ooh_data WHERE ${mainFilter.where}
        GROUP BY city, format
      `, mainFilter.params);

      const reportRows = await queryWithFilters<ReportDataItem>(`
        SELECT city, format, year, month, AVG(grp) as avgGrp, COUNT(*) as sideCount
        FROM ooh_data WHERE ${mainFilter.where}
        GROUP BY city, format, year, month
        ORDER BY city, year, month
      `, mainFilter.params);

      const optsRows = await queryWithFilters<SmartOptions>(`
        SELECT
          (SELECT list_sort(list(DISTINCT city)) FROM ooh_data WHERE ${cityOptsFilter.where}) as cities,
          (SELECT list_sort(list(DISTINCT CAST(year AS VARCHAR))) FROM ooh_data WHERE ${yearOptsFilter.where}) as years,
          (SELECT list_sort(list(DISTINCT month)) FROM ooh_data WHERE ${monthOptsFilter.where}) as months,
          (SELECT list_sort(list(DISTINCT format)) FROM ooh_data WHERE ${formatOptsFilter.where}) as formats,
          (SELECT list_sort(list(DISTINCT vendor)) FROM ooh_data WHERE ${vendorOptsFilter.where}) as vendors
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

      self.postMessage(serialize({
        type: 'QUERY_RESULT',
        requestId,
        kpis: (kpiRows[0] ?? { avgGrp: 0, totalOts: 0, uniqueSurfaces: 0 }) as KpiData,
        mapData: mapRows,
        trendData: trendRows,
        matrixData: matrixRows,
        reportData: reportRows,
        options: (optsRows[0] ?? { cities: [], years: [], months: [], formats: [], vendors: [] }) as SmartOptions,
      }));
    }
  } catch (err) {
    console.error('DuckDB Worker Error:', err);
    postError(err);
  }
};
