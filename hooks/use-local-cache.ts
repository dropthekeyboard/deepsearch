import { db } from "@/lib/db";
import Dexie from "dexie";
import { useCallback, useEffect, useState } from "react";
import { useAsyncTransition } from "./use-async";

interface CachedObject<T> {
  id: string;
  data: T;
  syncedAt?: number;
}

interface IDBCallbacks<T> {
  onPush?: (key: string, value: T) => Promise<boolean>;
  onPull?: (key: string) => Promise<T>;
}

interface IndexDBHookProps<T> {
  ttl?: number; // time to live in seconds
  callbacks?: IDBCallbacks<T>;
}

interface UseIndexedDBReturn<T> {
  ready: boolean;
  upsertItem: (key: string, value: T) => Promise<T>;
  getItem: (key: string) => Promise<T | undefined>;
  deleteItem: (key: string) => Promise<void>;
}

function useCache<T>(props?: IndexDBHookProps<T>): UseIndexedDBReturn<T> {
  const { ttl = -1, callbacks } = props ?? { ttl: -1 };
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

  const updateSyncedAt = useCallback(
    async (key: string) => {
      if (!ready) {
        return;
      }
      const cachedObject = await db.cachedObjects.get(key);
      if (cachedObject) {
        cachedObject.syncedAt = Date.now();
        await db.cachedObjects.put(cachedObject);
      }
    },
    [ready]
  );

  const upsertItem = useCallback(
    async (key: string, value: T) => {
      if (!ready) {
        throw Error("Database not initialized");
      }
      const container: CachedObject<T> = {
        id: key,
        data: value,
        syncedAt: Date.now(),
      };
      await db.cachedObjects.put(container);

      if (callbacks?.onPush) {
        setTimeout(async () => {
          try {
            const success = await callbacks.onPush?.(key, value);
            if (success) {
              await updateSyncedAt(key);
            }
          } catch (error) {
            console.warn(`Failed to push data for key ${key}:`, error);
          }
        }, 0);
      }

      return container.data;
    },
    [callbacks, ready, updateSyncedAt]
  );

  const getItem = useCallback(
    async (key: string): Promise<T | undefined> => {
      if (!ready) {
        return;
      }
      const result = await db.cachedObjects.get(key);
      // Adjusting the check for never expiring content when ttl is -1
      if (result) {
        if (
          ttl !== -1 &&
          (!result.syncedAt || Date.now() - result.syncedAt > ttl * 1000)
        ) {
          if (callbacks?.onPull) {
            setTimeout(async () => {
              try {
                const pulledData = await callbacks.onPull?.(key);
                if (pulledData) {
                  await upsertItem(key, pulledData);
                }
              } catch (error) {
                console.warn(`Failed to pull data for key ${key}:`, error);
              }
            }, 0);
          }
          return; // Return undefined if the data is stale (unless TTL is -1)
        }
      } else {
        if (callbacks?.onPull) {
          setTimeout(async () => {
            try {
              const pulledData = await callbacks.onPull?.(key);
              if (pulledData) {
                await upsertItem(key, pulledData);
              }
            } catch (error) {
              console.warn(`Failed to pull data for key ${key}:`, error);
            }
          }, 0);
        }
      }

      return result?.data;
    },
    [callbacks, ttl, upsertItem, ready]
  );

  const deleteItem = useCallback(
    async (key: string) => {
      if (!ready) {
        return;
      }
      await db.cachedObjects.delete(key);
    },
    [ready]
  );

  return {
    ready,
    upsertItem,
    getItem,
    deleteItem,
  };
}

export default useCache;
export {useCache};
