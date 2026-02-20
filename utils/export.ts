import { ReportDataItem } from '../types';

interface ExportWorkerSuccess {
  buffer: ArrayBuffer;
  fullFileName: string;
}

interface ExportWorkerFailure {
  error: string;
}

type ExportWorkerResponse = ExportWorkerSuccess | ExportWorkerFailure;

export const exportToExcel = async (data: ReportDataItem[], fileName: string = 'OOH_Aggregated_Report') => {
  if (!data || data.length === 0) return;

  const worker = new Worker(new URL('./export.worker.ts', import.meta.url), { type: 'module' });

  const response = await new Promise<ExportWorkerResponse>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<ExportWorkerResponse>) => resolve(event.data);
    worker.onerror = (error) => reject(error);
    worker.postMessage({ data, fileName });
  });

  worker.terminate();

  if ('error' in response) {
    throw new Error(response.error);
  }

  const blob = new Blob([response.buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = response.fullFileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
};
