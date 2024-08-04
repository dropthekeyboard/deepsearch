import Dexie, { Table } from 'dexie';
import {CachedObject, WebSearchResult} from "@/types";
import { VectorObjectWithEmbedding } from './vector-search';


export class LocalDatabase extends Dexie {
    cachedObjects!: Table<CachedObject<any>, string>; // Generic cache table
    webSearchResults!: Table<WebSearchResult, string>;
    vectorIndex!: Table<VectorObjectWithEmbedding, string>;

    constructor() {
        super('LocalDatabase');
        this.version(1).stores({
            cachedObjects: 'id, syncedAt', // Generic cache table schema
            webSearchResults: "id, isIndexed, isSaved, searchDate",
            vectorIndex: "id",
        });
    }
}

export const db = new LocalDatabase();
