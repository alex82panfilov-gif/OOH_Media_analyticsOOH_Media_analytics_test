import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { QueryResult } from '../types';

const DATA_PATH = 'storage_v1_9hf29sk';
const FILTER_DEBOUNCE_MS = 300;

export const useDataFetcher = () => {
  const { userRole, setIsLoading, filters, setQueryResult } = useStore();
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!userRole) return;

    const worker = new Worker(new URL('../db.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<QueryResult | { type: 'READY' } | { type: 'ERROR'; message: string }>) => {
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

      if (type === 'QUERY_RESULT') {
        if (e.data.requestId !== requestIdRef.current) {
          return;
        }
        setQueryResult(e.data);
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
