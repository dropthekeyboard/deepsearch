import { useEffect, useState } from 'react';

interface WorkerData<T> {
  data: T;
}

interface UseWebWorkerOptions {
  workerPath: URL;
  onMessage?: (data: any) => void;
  onError?: (error: ErrorEvent) => void;
}

const useWebWorker = <T, R>({ workerPath, onMessage, onError }: UseWebWorkerOptions) => {
  const [result, setResult] = useState<R | null>(null);
  const [error, setError] = useState<ErrorEvent | null>(null);

  useEffect(() => {
    const worker = new Worker(workerPath);

    const handleMessage = (event: MessageEvent<R>) => {
      setResult(event.data);
      onMessage && onMessage(event.data);
    };

    const handleError = (error: ErrorEvent) => {
      setError(error);
      onError && onError(error);
    };

    worker.onmessage = handleMessage;
    worker.onerror = handleError;

    return () => {
      worker.terminate();
    };
  }, [workerPath, onMessage, onError]);

  const postMessage = (data: T) => {
    const worker = new Worker(workerPath);
    worker.postMessage({ data });
  };

  return { result, error, postMessage };
};

export default useWebWorker;