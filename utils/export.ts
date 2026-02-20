import { ReportDataItem } from '../types';

interface WorkerSuccessMessage {
  buffer: ArrayBuffer;
  fullFileName: string;
}

interface WorkerErrorMessage {
  error: string;
}

export const exportToExcel = (data: ReportDataItem[], fileName: string = 'OOH_Aggregated_Report'): Promise<void> => {
  if (!data || data.length === 0) return Promise.resolve();

  const worker = new Worker(new URL('../workers/export.worker.ts', import.meta.url), { type: 'module' });

  return new Promise((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<WorkerSuccessMessage | WorkerErrorMessage>) => {
      const payload = event.data;
      if ('error' in payload) {
        worker.terminate();
        reject(new Error(payload.error));
        return;
      }

      const blob = new Blob([payload.buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = payload.fullFileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);

      worker.terminate();
      resolve();
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };

    worker.postMessage({ data, fileName });
  });
};
