import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Retrieve the initial value from local storage (if available) or use the provided initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage item ${key}:`, error);
      return initialValue;
    }
  });

  // Update local storage whenever storedValue changes
  useEffect(() => {
    
    try {
      if (storedValue === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error(`Error setting localStorage item ${key}:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
