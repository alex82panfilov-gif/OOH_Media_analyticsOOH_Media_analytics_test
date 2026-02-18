import * as duckdb from '@duckdb/duckdb-wasm';
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

type WorkerMessage =
  | { type: 'LOAD_DATA'; payload: { files: string[]; basePath: string } }
  | { type: 'QUERY'; payload: { filters: FilterState; requestId: number } };

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  await initPromise;
  const { type, payload } = e.data;

  if (type === 'LOAD_DATA') {
    try {
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
    } catch (err) {
      console.error('DuckDB Load Error:', err);
    }
  }

  if (type === 'QUERY') {
    if (!isInitialized) return;

    try {
      const { filters, requestId } = payload;
      latestRequestId = Math.max(latestRequestId, requestId);

      const escapeSqlString = (value: string) => value.replace(/'/g, "''");

      const toSqlInList = (values: unknown[]) => values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => `'${escapeSqlString(value)}'`)
        .join(',');

      const getWhere = (excludeKey: keyof FilterState | null = null) => {
        const clauses = ['1=1'];

        if (excludeKey !== 'city' && filters.city?.length) {
          const cityList = toSqlInList(filters.city);
          if (cityList) clauses.push(`city IN (${cityList})`);
        }

        if (excludeKey !== 'year' && filters.year?.length) {
          const yearList = toSqlInList(filters.year);
          if (yearList) clauses.push(`CAST(year AS VARCHAR) IN (${yearList})`);
        }

        if (excludeKey !== 'month' && filters.month?.length) {
          const monthList = toSqlInList(filters.month);
          if (monthList) clauses.push(`month IN (${monthList})`);
        }

        if (excludeKey !== 'format' && filters.format?.length) {
          const formatList = toSqlInList(filters.format);
          if (formatList) clauses.push(`format IN (${formatList})`);
        }

        if (excludeKey !== 'vendor' && filters.vendor?.length) {
          const vendorList = toSqlInList(filters.vendor);
          if (vendorList) clauses.push(`vendor IN (${vendorList})`);
        }

        return clauses.join(' AND ');
      };

      const mainWhere = getWhere(null);

      const kpiRes = await conn.query(`
        SELECT
          AVG(grp) as avgGrp,
          (SELECT AVG(monthly_total) FROM (
             SELECT SUM(ots) as monthly_total
             FROM ooh_data
             WHERE ${mainWhere}
             GROUP BY year, month
          )) as totalOts,
          COUNT(DISTINCT address) as uniqueSurfaces
        FROM ooh_data
        WHERE ${mainWhere}
      `);

      const mapRes = await conn.query(`
        SELECT
          address, city, vendor, format,
          AVG(grp) as avgGrp,
          AVG(ots) as avgOts,
          MAX(lat) as lat,
          MAX(lng) as lng
        FROM ooh_data
        WHERE ${mainWhere}
        GROUP BY address, city, vendor, format
      `);

      const trendRes = await conn.query(`
        SELECT month, year, AVG(grp) as avgGrp
        FROM ooh_data WHERE ${mainWhere}
        GROUP BY year, month ORDER BY year, month
      `);

      const matrixRes = await conn.query(`
        SELECT city, format, AVG(grp) as avgGrp
        FROM ooh_data WHERE ${mainWhere}
        GROUP BY city, format
      `);

      const reportRes = await conn.query(`
        SELECT city, format, year, month, AVG(grp) as avgGrp, COUNT(*) as sideCount
        FROM ooh_data WHERE ${mainWhere}
        GROUP BY city, format, year, month
        ORDER BY city, year, month
      `);

      const optsRes = await conn.query(`
        SELECT
          (SELECT list_sort(list(DISTINCT city)) FROM ooh_data WHERE ${getWhere('city')}) as cities,
          (SELECT list_sort(list(DISTINCT CAST(year AS VARCHAR))) FROM ooh_data WHERE ${getWhere('year')}) as years,
          (SELECT list_sort(list(DISTINCT month)) FROM ooh_data WHERE ${getWhere('month')}) as months,
          (SELECT list_sort(list(DISTINCT format)) FROM ooh_data WHERE ${getWhere('format')}) as formats,
          (SELECT list_sort(list(DISTINCT vendor)) FROM ooh_data WHERE ${getWhere('vendor')}) as vendors
      `);

      if (requestId < latestRequestId) {
        return;
      }

      self.postMessage(serialize({
        type: 'QUERY_RESULT',
        requestId,
        kpis: (kpiRes.toArray().map((r) => r.toJSON())[0] ?? { avgGrp: 0, totalOts: 0, uniqueSurfaces: 0 }) as KpiData,
        mapData: mapRes.toArray().map((r) => r.toJSON()) as MapDataItem[],
        trendData: trendRes.toArray().map((r) => r.toJSON()) as TrendDataItem[],
        matrixData: matrixRes.toArray().map((r) => r.toJSON()) as MatrixDataItem[],
        reportData: reportRes.toArray().map((r) => r.toJSON()) as ReportDataItem[],
        options: (optsRes.toArray().map((r) => r.toJSON())[0] ?? { cities: [], years: [], months: [], formats: [], vendors: [] }) as SmartOptions,
      }));
    } catch (err) {
      console.error('DuckDB Query Error:', err);
    }
  }
};
