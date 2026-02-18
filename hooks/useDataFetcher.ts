import { tableFromIPC } from 'apache-arrow';
import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { QueryResult } from '../types';

const DATA_PATH = 'storage_v1_9hf29sk';
const FILTER_DEBOUNCE_MS = 300;

type WorkerReadyMessage = { type: 'READY' };
type WorkerErrorMessage = { type: 'ERROR'; message: string };
type WorkerArrowResult = {
  type: 'QUERY_RESULT_ARROW';
  requestId: number;
  kpis: ArrayBuffer;
  mapData: ArrayBuffer;
  trendData: ArrayBuffer;
  matrixData: ArrayBuffer;
  reportData: ArrayBuffer;
  options: ArrayBuffer;
};

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'bigint') {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)]),
    );
  }

  return value;
};

const parseArrowRows = <T,>(buffer: ArrayBuffer): T[] => {
  const table = tableFromIPC(new Uint8Array(buffer));
  return table.toArray().map((row) => sanitizeValue(row.toJSON()) as T);
};

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => String(item));
  }

  if (value && typeof value === 'object') {
    const indexedEntries = Object.entries(value as Record<string, unknown>)
      .filter(([key, item]) => /^\d+$/.test(key) && item !== null && item !== undefined)
      .sort(([left], [right]) => Number(left) - Number(right));

    if (indexedEntries.length > 0) {
      return indexedEntries.map(([, item]) => String(item));
    }
  }

  return [];
};

const normalizeOptions = (value: unknown): QueryResult['options'] => {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    cities: normalizeStringArray(source.cities),
    years: normalizeStringArray(source.years),
    months: normalizeStringArray(source.months),
    formats: normalizeStringArray(source.formats),
    vendors: normalizeStringArray(source.vendors),
  };
};

const parseArrowPayload = (payload: WorkerArrowResult): QueryResult => {
  const kpiRows = parseArrowRows<QueryResult['kpis']>(payload.kpis);
  const optionsRows = parseArrowRows<QueryResult['options']>(payload.options);

  return {
    type: 'QUERY_RESULT',
    requestId: payload.requestId,
    kpis: (kpiRows[0] ?? { avgGrp: 0, totalOts: 0, uniqueSurfaces: 0 }) as QueryResult['kpis'],
    mapData: parseArrowRows<QueryResult['mapData'][number]>(payload.mapData),
    trendData: parseArrowRows<QueryResult['trendData'][number]>(payload.trendData),
    matrixData: parseArrowRows<QueryResult['matrixData'][number]>(payload.matrixData),
    reportData: parseArrowRows<QueryResult['reportData'][number]>(payload.reportData),
    options: normalizeOptions(optionsRows[0]),
  };
};

export const useDataFetcher = () => {
  const { userRole, setIsLoading, filters, setQueryResult } = useStore();
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!userRole) return;

    const worker = new Worker(new URL('../db.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerReadyMessage | WorkerErrorMessage | WorkerArrowResult>) => {
      const { type } = e.data;

      if (type === 'READY') {
        requestIdRef.current += 1;
        worker.postMessage({ type: 'QUERY', payload: { filters, requestId: requestIdRef.current } });
        return;
      }

      if (type === 'ERROR') {
        console.error('Worker error:', e.data.message);
        setIsLoading(false);
        window.alert(`Ошибка загрузки данных: ${e.data.message}`);
        return;
      }

      if (type === 'QUERY_RESULT_ARROW') {
        if (e.data.requestId !== requestIdRef.current) {
          return;
        }

        const result = parseArrowPayload(e.data);
        setQueryResult(result);
      }
    };

    const init = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/${DATA_PATH}/data-manifest.json`);
        if (!response.ok) {
          throw new Error(`Не удалось загрузить data-manifest.json (${response.status})`);
        }

        const files = await response.json();

        if (files.length > 0) {
          worker.postMessage({
            type: 'LOAD_DATA',
            payload: { files, basePath: DATA_PATH },
          });
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load manifest', err);
        setIsLoading(false);
      }
    };

    init();
    return () => worker.terminate();
  }, [userRole]);

  useEffect(() => {
    if (!workerRef.current || !userRole) return;

    const timeoutId = window.setTimeout(() => {
      requestIdRef.current += 1;
      setIsLoading(true);
      workerRef.current?.postMessage({
        type: 'QUERY',
        payload: { filters, requestId: requestIdRef.current },
      });
    }, FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [filters, userRole, setIsLoading]);
};
