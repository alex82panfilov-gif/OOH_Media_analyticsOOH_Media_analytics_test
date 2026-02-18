// hooks/useDataFetcher.ts
import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { FilterState, WorkerQueryResult } from '../types';

const DATA_PATH = 'storage_v1_9hf29sk';
const QUERY_DEBOUNCE_MS = 300;

export const useDataFetcher = () => {
  const { userRole, setIsLoading, filters, setQueryResult } = useStore();
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);

  const sendQuery = (currentFilters: FilterState) => {
    if (!workerRef.current || !userRole) return;

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    setIsLoading(true);
    workerRef.current.postMessage({
      type: 'QUERY',
      payload: { filters: currentFilters, requestId },
    });
  };

  useEffect(() => {
    if (!userRole) return;

    const worker = new Worker(new URL('../db.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerQueryResult | { type: 'READY' }>) => {
      const { type } = e.data;

      if (type === 'READY') {
        sendQuery(filters);
        return;
      }

      if (type === 'QUERY_RESULT') {
        if (e.data.requestId !== requestIdRef.current) return;
        setQueryResult(e.data);
      }
    };

    const init = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/${DATA_PATH}/data-manifest.json`);
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

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      worker.terminate();
      workerRef.current = null;
    };
  }, [userRole]);

  useEffect(() => {
    if (!workerRef.current || !userRole) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      sendQuery(filters);
    }, QUERY_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, userRole]);
};
