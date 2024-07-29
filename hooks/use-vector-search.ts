import { useWorker } from '@/context/WorkerContext';
import { VectorSearchAPI } from '@/lib/vector-search';
import { SearchResult } from 'client-vector-search';
import { useCallback, useEffect, useState } from 'react';
import { VectorObject } from './use-client-vector-search';


interface UseVectorSearchResult {
    search: (query: string | number[], topK?: number) => Promise<SearchResult[]>;
    add: (object: VectorObject, embedding?: number[]) => Promise<void>;
    embed: (v: string) => Promise<number[]>;
    isLoading: boolean;
}

export function useVectorSearch(): UseVectorSearchResult {
    const { search, add, embed, isLoaded, ensureLoad } = useWorker<VectorSearchAPI>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const checkLoaded = async () => {
            try {
                const loaded = await isLoaded();
                if (loaded) {
                    setIsLoading(false);
                    clearInterval(intervalId);
                }
            } catch (error) {
                console.error('Failed to check if VectorSearch is loaded:', error);
            }
        };
        if (ensureLoad) {
            ensureLoad();
            // 즉시 한 번 체크
            checkLoaded();

            // 500ms 간격으로 폴링 시작
            intervalId = setInterval(checkLoaded, 500);
            // 컴포넌트가 언마운트되거나 isLoading이 false가 되면 폴링 중지
            return () => clearInterval(intervalId);
        }



    }, [isLoaded, ensureLoad]);

    const wrappedSearch = useCallback(async (query: string | number[], topK?: number) => {
        if (isLoading) {
            throw new Error('VectorSearch is still loading');
        }
        return search(query, topK);
    }, [isLoading, search]);

    const wrappedAdd = useCallback(async (object: VectorObject, embedding?: number[]) => {
        if (isLoading) {
            throw new Error('VectorSearch is still loading');
        }
        return add(object, embedding);
    }, [isLoading, add]);

    const wrappedEmbed = useCallback(async (v: string) => {
        if (isLoading) {
            throw new Error('VectorSearch is still loading');
        }
        return embed(v);
    }, [isLoading, embed]);

    return {
        search: wrappedSearch,
        add: wrappedAdd,
        embed: wrappedEmbed,
        isLoading
    };
}