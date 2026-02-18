import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB;
let conn: duckdb.AsyncDuckDBConnection;
let isInitialized = false;

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

// Помощник для превращения BigInt (который выдает DuckDB) в строку/число для JSON
const serialize = (obj: any) => {
  return JSON.parse(JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

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

self.onmessage = async (e) => {
  await initPromise;
  const { type, payload } = e.data;

  if (type === 'LOAD_DATA') {
    try {
      const { files, basePath } = payload; // Получаем basePath из хука

      for (const file of files) {
        await db.registerFileURL(
          file, 
          // Теперь URL формируется динамически с учетом секретной папки
          `${location.origin}/${basePath}/${file}`, 
          duckdb.DuckDBDataProtocol.HTTP, 
          false
        );
      }
      
      const fileListSql = files.map((f: string) => `'${f}'`).join(', ');

      // ОЧИСТКА ДАННЫХ И СОЗДАНИЕ VIEW
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
      console.error("DuckDB Load Error:", err);
    }
  }

  if (type === 'QUERY') {
    if (!isInitialized) return;

    try {
      const { filters } = payload;
      
      // Генератор условий WHERE
      const getWhere = (excludeKey: string | null = null) => {
        let clauses = ['1=1'];
        if (excludeKey !== 'city' && filters.city?.length) 
          clauses.push(`city IN (${filters.city.map((c: any) => `'${c}'`).join(',')})`);
        if (excludeKey !== 'year' && filters.year?.length) 
          clauses.push(`CAST(year AS VARCHAR) IN (${filters.year.map((y: any) => `'${y}'`).join(',')})`);
        if (excludeKey !== 'month' && filters.month?.length) 
          clauses.push(`month IN (${filters.month.map((m: any) => `'${m}'`).join(',')})`);
        if (excludeKey !== 'format' && filters.format?.length) 
          clauses.push(`format IN (${filters.format.map((f: any) => `'${f}'`).join(',')})`);
        if (excludeKey !== 'vendor' && filters.vendor?.length) 
          clauses.push(`vendor IN (${filters.vendor.map((v: any) => `'${v}'`).join(',')})`);
        return clauses.join(' AND ');
      };

      const mainWhere = getWhere(null);

      // --- 1. ГЛОБАЛЬНЫЕ КПИ (Точные расчеты) ---
      // Рассчитываем все показатели за один проход по базе
      const kpiRes = await conn.query(`
        SELECT 
          AVG(grp) as avgGrp,
          -- Считаем СУММУ всех OTS для каждого месяца отдельно, 
          -- а затем берем среднее значение между этими суммами (если выбрано несколько месяцев)
          (SELECT AVG(monthly_total) FROM (
             SELECT SUM(ots) as monthly_total 
             FROM ooh_data 
             WHERE ${mainWhere} 
             GROUP BY year, month
          )) as totalOts,
          -- Количество уникальных поверхностей (сторон) в выборке
          COUNT(DISTINCT address) as uniqueSurfaces
        FROM ooh_data
        WHERE ${mainWhere}
      `);

      // --- 2. ДАННЫЕ ДЛЯ КАРТЫ (Группировка по поверхности) ---
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

      // --- 3. ТРЕНДЫ (Динамика по месяцам) ---
      const trendRes = await conn.query(`
        SELECT month, year, AVG(grp) as avgGrp
        FROM ooh_data WHERE ${mainWhere}
        GROUP BY year, month ORDER BY year, month
      `);

      // --- 4. МАТРИЦА И ОТЧЕТЫ ---
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

      // --- 5. УМНЫЕ ФИЛЬТРЫ ---
      const optsRes = await conn.query(`
        SELECT 
          (SELECT list_sort(list(DISTINCT city)) FROM ooh_data WHERE ${getWhere('city')}) as cities,
          (SELECT list_sort(list(DISTINCT CAST(year AS VARCHAR))) FROM ooh_data WHERE ${getWhere('year')}) as years,
          (SELECT list_sort(list(DISTINCT month)) FROM ooh_data WHERE ${getWhere('month')}) as months,
          (SELECT list_sort(list(DISTINCT format)) FROM ooh_data WHERE ${getWhere('format')}) as formats,
          (SELECT list_sort(list(DISTINCT vendor)) FROM ooh_data WHERE ${getWhere('vendor')}) as vendors
      `);

      self.postMessage(serialize({
        type: 'QUERY_RESULT',
        kpis: kpiRes.toArray().map(r => r.toJSON())[0],
        mapData: mapRes.toArray().map(r => r.toJSON()),
        trendData: trendRes.toArray().map(r => r.toJSON()),
        matrixData: matrixRes.toArray().map(r => r.toJSON()),
        reportData: reportRes.toArray().map(r => r.toJSON()),
        options: optsRes.toArray().map(r => r.toJSON())[0]
      }));

    } catch (err) {
      console.error("DuckDB Query Error:", err);
    }
  }
};
