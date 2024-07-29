interface Content {
    id: string;
    source: string;
    url: string;
    title: string;
    content: string;
}

interface CachedObject<T> {
    id: string;
    data: T;
    syncedAt?: number;
}

type AsyncFunction<T extends any[] = any[], R = any> = (...args: T) => Promise<R>;

interface WorkerMessage<T extends AsyncFunction> {
  fn: string;
  args: Parameters<T>;
  id: string;
}

interface WorkerResponse<T extends AsyncFunction> {
  id: string;
  result?: Awaited<ReturnType<T>>;
  error?: Error;
}
type AsyncAPI = Record<string, AsyncFunction>;

interface WebSearchResult {
    id?: string;
    query: string;
    source: string;
    url: string;
    title: string;
    description: string;
    content?: string;
    contentDate: Date|null;
    searchDate: Date;
    isIndexed: boolean;
}

interface IndexedChunkData extends WebSearchResult {
  chunk: string;
}


export type {
    Content,
    AsyncFunction,
    WorkerMessage,
    IndexedChunkData,
    WorkerResponse,
    AsyncAPI,
    CachedObject,
    WebSearchResult
};