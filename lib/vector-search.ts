import { initializeModel, SearchResult, EmbeddingIndex, getEmbedding } from "client-vector-search";
import { AsyncAPI, AsyncFunction, CachedObject } from "@/types";
import { VectorObject } from "@/hooks/use-client-vector-search";
import { db } from "./db";
import _ from "lodash";

const DB_NAME = "vector-db";

class InitializedModel {
    private initialized: boolean = false;
    private static instance: InitializedModel;
    private constructor() { }

    static getInstance(): Promise<InitializedModel> {
        if (!InitializedModel.instance) {
            InitializedModel.instance = new InitializedModel();
            return initializeModel().then(() => {
                InitializedModel.instance.initialized = true;
                return InitializedModel.instance;
            });
        }
        return Promise.resolve(InitializedModel.instance);
    }

    isInitialized() {
        return this.initialized;
    }
}

interface VectorObjectWithEmbedding extends VectorObject {
    embedding: number[];
}

class PersistVectorSearch {
    private static instance: PersistVectorSearch;
    private index: EmbeddingIndex | null = null;
    private objects: VectorObjectWithEmbedding[] = [];
    private static initializeModel: InitializedModel | null = null;
    private loadPromise: Promise<void> | null = null;
    private loaded: boolean = false;

    private constructor() { }

    private async load(): Promise<void> {
        if (this.loaded) {
            console.log("Already loaded, skipping.");
            return;
        }

        await db.vectorIndex.each(async (index) => {
            this.objects.push(index);
        });

        console.log('objects:', this.objects);
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
        const initializedModel = await InitializedModel.getInstance();
        PersistVectorSearch.initializeModel = initializedModel;

        if (!PersistVectorSearch.instance) {
            PersistVectorSearch.instance = new PersistVectorSearch();
        }

        const instance = PersistVectorSearch.instance;
        await instance.ensureLoad();
        return instance;
    }

    async add(object: VectorObject, embedding?: number[]): Promise<void> {
        await this.ensureLoad();
        if (!this.index) {
            throw new Error("Index is not initialized");
        }

        const embeddingValue = embedding || await getEmbedding(object.name);
        const obj = { ...object, embedding: embeddingValue };
        this.index.add(obj);
        this.objects.push(obj);
        await db.vectorIndex.put(obj);
    }

    async search(query: string | number[], topK?: number): Promise<SearchResult[]> {
        await this.ensureLoad();
        if (!this.index) {
            throw new Error("Index is not initialized");
        }

        const queryEmbedding = Array.isArray(query) ? query : await getEmbedding(query);
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
    return PersistVectorSearch.getInstance()
        .then(instance => ({
            search: instance.search.bind(instance),
            add: instance.add.bind(instance),
            embed: instance.embed.bind(instance),
            ensureLoad: instance.ensureLoad.bind(instance),
            isLoaded: instance.isLoaded.bind(instance)
        }));
}

export { getVectorSearch };
export type { VectorSearchAPI, VectorObjectWithEmbedding };