// src/hooks/useBrowserLevel.ts

import { useState, useEffect, useCallback } from 'react';
import { BrowserLevel } from 'browser-level';

// Define types for the key and value
type KeyType = string;
type ValueType = any;  // Adjust this as per your specific type needs

const useBrowserLevel = (dbName: string) => {
  const [db, setDb] = useState<BrowserLevel<KeyType, ValueType> | null>(null);

  useEffect(() => {
    // Initialize the BrowserLevel database
    const initDb = async () => {
      const newDb = new BrowserLevel<KeyType, ValueType>(dbName, { valueEncoding: 'json' });
      setDb(newDb);
    };

    initDb();

    // Cleanup on unmount
    return () => {
      db?.close().catch(console.error);
    };
  }, [dbName]);

  // Method to put a value into the database
  const put = useCallback(async (key: KeyType, value: ValueType) => {
    if (db) {
      try {
        await db.put(key, value);
      } catch (error) {
        console.error(`Error putting value for key ${key}:`, error);
      }
    }
  }, [db]);

  // Method to get a value from the database
  const get = useCallback(async (key: KeyType): Promise<ValueType | undefined> => {
    if (db) {
      try {
        return await db.get(key);
      } catch (error) {
        console.error(`Error getting value for key ${key}:`, error);
        return undefined;
      }
    }
    return undefined;
  }, [db]);

  return { put, get };
};

export default useBrowserLevel;
