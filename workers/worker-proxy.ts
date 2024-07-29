import { AsyncFunction, WorkerResponse, WorkerMessage } from "@/types";
import cuid2 from "@paralleldrive/cuid2";

class WorkerProxy {
  private worker: Worker;
  private callbacks: Map<
    string,
    (response: WorkerResponse<AsyncFunction>) => void
  >;

  constructor(worker: Worker|URL) {
    this.worker = worker instanceof URL? new Worker(worker):worker;
    this.callbacks = new Map();
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
  }

  private handleWorkerMessage(
    event: MessageEvent<WorkerResponse<AsyncFunction>>
  ) {
    const { id, result, error } = event.data;
    const callback = this.callbacks.get(id);
    if (callback) {
      callback({ id, result, error });
      this.callbacks.delete(id);
    }
  }

  call<T extends AsyncFunction>(
    fn: string,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      const id = cuid2.createId();
      this.callbacks.set(id, (response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result as ReturnType<T>);
        }
      });
      const message: WorkerMessage<T> = { fn, args, id };
      this.worker.postMessage(message);
    });
  }

  terminate() {
    this.worker.terminate();
  }
}

function createWorkerAPI<T extends Record<string, AsyncFunction>>(): T {
  let proxy: WorkerProxy;
  try {
    proxy = new WorkerProxy(new Worker(new URL("worker.ts", import.meta.url)));
  } catch (error) {
    console.error("Failed to create worker:", error);
    throw error;
  }

  return new Proxy({} as T, {
    get: (_, prop: string) => {
      return (...args: any[]) => proxy.call(prop, ...args);
    },
  });
}


export { createWorkerAPI };
