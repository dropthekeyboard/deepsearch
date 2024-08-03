import {
  initializeModel,
  SearchResult,
  EmbeddingIndex,
  getEmbedding,
} from "client-vector-search";
import { AsyncAPI, AsyncFunction, CachedObject } from "@/types";
import { VectorObject } from "@/hooks/use-client-vector-search";
import { db } from "./db";
import _ from "lodash";

class InitializedModel {
  private initialized: boolean = false;
  private static instancePromise: Promise<InitializedModel> | null = null;

  private constructor() {}

  static getInstance(): Promise<InitializedModel> {
    if (!InitializedModel.instancePromise) {
      InitializedModel.instancePromise = initializeModel().then(() => {
        const instance = new InitializedModel();
        instance.initialized = true;
        return instance;
      });
    }
    return InitializedModel.instancePromise;
  }

  isInitialized() {
    return this.initialized;
  }
}

interface VectorObjectWithEmbedding extends VectorObject {
  embedding: number[];
}

class PersistVectorSearch {
  private static instancePromise: Promise<PersistVectorSearch> | null = null;
  private index: EmbeddingIndex | null = null;
  private objects: VectorObjectWithEmbedding[] = [];
  private loadPromise: Promise<void> | null = null;
  private loaded: boolean = false;

  private constructor() {
    console.log("new instance");
  }

  private async load(): Promise<void> {
    if (this.loaded) {
      console.log("Already loaded, skipping.");
      return;
    }

    await db.vectorIndex.each(async (index) => {
      this.objects.push(index);
    });

    console.log("objects:", this.objects.length);
    this.index = new EmbeddingIndex(this.objects);
    this.objects = [];
    this.loaded = true;
  }

  async ensureLoad(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.load();
    }
    return this.loadPromise;
  }

  public static async getInstance(): Promise<PersistVectorSearch> {
    if (!PersistVectorSearch.instancePromise) {
      PersistVectorSearch.instancePromise = (async () => {
        await InitializedModel.getInstance();

        const instance = new PersistVectorSearch();
        await instance.ensureLoad();
        return instance;
      })();
    }

    return PersistVectorSearch.instancePromise;
  }

  async add(object: VectorObject, embedding?: number[]): Promise<void> {
    await this.ensureLoad();
    if (!this.index) {
      throw new Error("Index is not initialized");
    }

    const embeddingValue = embedding || (await getEmbedding(object.name));
    const obj = { ...object, embedding: embeddingValue };
    this.index.add(obj);
    this.objects.push(obj);
    await db.vectorIndex.put(obj);
  }

  async search(
    query: string | number[],
    topK?: number
  ): Promise<SearchResult[]> {
    await this.ensureLoad();
    if (!this.index) {
      throw new Error("Index is not initialized");
    }

    const queryEmbedding = Array.isArray(query)
      ? query
      : await getEmbedding(query);
    return this.index.search(queryEmbedding, { topK });
  }

  async embed(v: string): Promise<number[]> {
    await this.ensureLoad();
    return getEmbedding(v);
  }

  async isLoaded(): Promise<boolean> {
    return this.loaded;
  }
}

interface VectorSearchAPI extends AsyncAPI {
  search(query: string | number[], topK?: number): Promise<SearchResult[]>;
  add(object: VectorObject, embedding?: number[]): Promise<void>;
  embed(v: string): Promise<number[]>;
  ensureLoad(): Promise<void>;
  isLoaded(): Promise<boolean>;
}

function getVectorSearch(): Promise<VectorSearchAPI> {
  return PersistVectorSearch.getInstance().then((instance) => ({
    search: instance.search.bind(instance),
    add: instance.add.bind(instance),
    embed: instance.embed.bind(instance),
    ensureLoad: instance.ensureLoad.bind(instance),
    isLoaded: instance.isLoaded.bind(instance),
  }));
}

export { getVectorSearch };
export type { VectorSearchAPI, VectorObjectWithEmbedding };
