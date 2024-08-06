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
            return result || null;
        } catch (err: any) {
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

    const deleteSearchWithScope = useCallback(async (deletionScope: 'all' | '7days' | '30days'): Promise<void> => {
        if (!db.isOpen()) {
            throw new Error('Database is not open');
        }

        const currentDate = new Date();
        let dateThreshold: Date | null = null;

        if (deletionScope === "7days") {
            dateThreshold = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (deletionScope === "30days") {
            dateThreshold = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        if (dateThreshold) {
            const oldResults = await db.webSearchResults
                .where('searchDate')
                .below(dateThreshold)
                .toArray();

            console.log(oldResults);

            const chunkIdsToDelete = oldResults.flatMap(result => result.chunks);

            await db.webSearchResults
                .where('searchDate')
                .below(dateThreshold)
                .delete();

            await db.vectorIndex
                .where('id')
                .anyOf(chunkIdsToDelete)
                .delete();
        } else {
            // Delete all data
            await db.vectorIndex.clear();
            await db.webSearchResults.clear();
        }
    }, []);

    return {
        ready,
        getResultById,
        upsertResult,
        deleteResult,
        deleteSearchWithScope,
    };
};

export default useWebSearchResults;