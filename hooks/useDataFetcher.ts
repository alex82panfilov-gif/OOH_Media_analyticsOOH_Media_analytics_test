// hooks/useDataFetcher.ts
import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

const DATA_PATH = 'storage_v1_9hf29sk'; // Константа пути

export const useDataFetcher = () => {
  const { userRole, setIsLoading, filters, setQueryResult } = useStore();
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!userRole) return;
    const worker = new Worker(new URL('../db.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type } = e.data;
      if (type === 'READY') worker.postMessage({ type: 'QUERY', payload: { filters } });
      if (type === 'QUERY_RESULT') setQueryResult(e.data);
    };

    const init = async () => {
      setIsLoading(true);
      try {
        // Загружаем манифест из секретной папки
        const response = await fetch(`/${DATA_PATH}/data-manifest.json`);
        const files = await response.json();
        
        if (files.length > 0) {
          // Передаем воркеру не только файлы, но и путь к ним
          worker.postMessage({ 
            type: 'LOAD_DATA', 
            payload: { files, basePath: DATA_PATH } 
          });
        } else {
          setIsLoading(false);
        }
      } catch (err) { 
        console.error("Failed to load manifest", err);
        setIsLoading(false); 
      }
    };

    init();
    return () => worker.terminate();
  }, [userRole]);

  useEffect(() => {
    if (workerRef.current && userRole) {
      setIsLoading(true);
      workerRef.current.postMessage({ type: 'QUERY', payload: { filters } });
    }
  }, [filters, userRole]);
};
