import { db } from '@/lib/db';
import { WebSearchResult } from '@/types';
import Dexie from 'dexie';
import { useState, useCallback, useEffect } from 'react';
import { useAsyncTransition } from './use-async';

const useWebSearchResults = () => {
    const [initializing, startInitialize] = useAsyncTransition();
    const [dexie, setDexie] = useState<Dexie | null>(null);
    const [ready, setReady] = useState<boolean>(false);

    useEffect(() => {
        startInitialize(async () => {
            setDexie(await db.open());
        });
    }, [startInitialize]);

    useEffect(() => {
        if (!initializing && dexie && !ready) {
            setReady(true);
        }
    }, [initializing, dexie, ready]);

    const getResultById = useCallback(async (id: string): Promise<WebSearchResult | null> => {
        try {
            const result = await db.webSearchResults.get(id);
            return result||null;
        } catch (err:any) {
            console.error(`Failed to fetch result: ${err.message}`);
            return null;
        }
    }, []);

    const upsertResult = useCallback(async (result: WebSearchResult): Promise<void> => {
        try {
            await db.webSearchResults.put(result);
        } catch (err: any) {
            console.error(`Failed to upsert result: ${err.message}`);
        }
    }, []);

    const deleteResult = useCallback(async (id: string): Promise<void> => {
        try {
            await db.webSearchResults.delete(id);
        } catch (err: any) {
            console.error(`Failed to delete result: ${err.message}`);
        }
    }, []);

    return {
        ready,
        getResultById,
        upsertResult,
        deleteResult,
    };
};

export default useWebSearchResults;