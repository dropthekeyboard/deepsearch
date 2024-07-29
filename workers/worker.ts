
import { hello } from "@/lib/hello";
import { getVectorSearch } from "@/lib/vector-search";
import { AsyncFunction, WorkerMessage } from "@/types";


const {add, save, search, embed, isLoaded, ensureLoad} = await getVectorSearch();

const API: Record<string, AsyncFunction> = {
    hello,
    add,
    search,
    embed,
    save,
    isLoaded,
    ensureLoad
}

// worker.ts
self.addEventListener('message', async (event: MessageEvent<WorkerMessage<AsyncFunction>>) => {
  const { fn, args, id } = event.data;
  try {
    const result = await API[fn](...args);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error });
  }
});
