import {
  EmbeddingIndex,
  getEmbedding,
  initializeModel,
} from "client-vector-search";
import { useCallback, useEffect, useState } from "react";
import { useAsyncTransition } from "./use-async";

type VectorObject = {
  id: number;
  name: string;
};

type SearchResult = {
  id: number;
  name: string;
  similarity: number;
};

interface UseVectorSearchProps {
  initialObjects: VectorObject[];
}

const useClientVectorSearch = () => {
  const [ready, setReady] = useState<boolean>();
  const [initializing, startInitialize] = useAsyncTransition();

  useEffect(() => {
    if (!ready && !initializing) {
      startInitialize(async () => {
        try {
          await initializeModel();
          setReady(true);
        } catch (error) {
          console.error("Error initializing:", error);
        }
      });
    }

  }, [ready, initializing, startInitialize]);

  const newIndex = useCallback((initialObjects: { [key: string]: any }[]) => {
    if (ready) {
      return new EmbeddingIndex(initialObjects)
    } else {
      throw new Error("Model not initialized");
    }

  }, [ready]);

  return {
    ready,
    newIndex,
  }
}

const useVectorSearch = ({ initialObjects }: UseVectorSearchProps) => {
  const [index, setIndex] = useState<EmbeddingIndex | null>(null);
  const { ready, newIndex } = useClientVectorSearch();
  const [initializing, startInitialize] = useAsyncTransition();


  useEffect(() => {
    if (ready && !Boolean(index) && !initializing) {
      startInitialize(async () => {
        try {
          const objectsWithEmbeddings = await Promise.all(
            initialObjects.map(async (obj) => {
              const embedding = await getEmbedding(obj.name);
              return { ...obj, embedding };
            })
          );
          const index = newIndex(objectsWithEmbeddings);
          console.log("index", index);
          setIndex(index);
        } catch (error) {
          console.error("Error initializing:", error);
        }
      });
    }
  }, [ready, index, initializing, startInitialize, initialObjects, newIndex]);


  const search = useCallback(
    async (query: string, topK: number = 5): Promise<SearchResult[]> => {
      if (!ready) {
        throw new Error("Model not initialized");
      }

      if (!index) {
        throw new Error("Index not initialized");
      }

      try {
        const queryEmbedding = await getEmbedding(query);
        const results = await index.search(queryEmbedding, {
          topK,
        });
        return results.map(({ object, similarity }) => ({
          id: object.id,
          name: object.name,
          similarity,
        }));
      } catch (error) {
        console.error("Error during search:", error);
        throw new Error("Search failed");
      }
    },
    [index, ready]
  );

  const clearIndex = useCallback(async () => {
    if (!ready) {
      throw new Error("Model not initialized");
    }

    if (!index) {
      throw new Error("Index not initialized");
    }

    try {
      setIndex(null);
    } catch (error) {
      console.error("Error clearing index:", error);
      throw new Error("Failed to clear index");
    }
  }, [index, ready]);

  const addToIndex = useCallback(
    async (vo: VectorObject, customSentence?: string) => {
      if (index && ready) {
        const sentence = customSentence || vo.name;
        const objectToAdd = {
          id: vo.id,
          name: vo.name,
          embedding: await getEmbedding(sentence),
        };
        index.add(objectToAdd);
      }
    },
    [index, ready]
  );

  return {
    search,
    clearIndex,
    addToIndex,
    ready: Boolean(index),
  };
};

export type { SearchResult, VectorObject };
export default useVectorSearch;
