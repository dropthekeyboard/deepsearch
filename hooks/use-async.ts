import { useCallback, useState } from 'react';

type TransitionStartFunction = (asyncCallback: () => Promise<any>) => void;

function useAsyncTransition(): [boolean, TransitionStartFunction] {
    const [loading, setLoading] = useState(false);

    /**
     * Starts an asynchronous operation with synchronous state update for loading indicators.
     * @param asyncCallback A function that returns a Promise representing the async operation.
     */
    const startAsyncOperation = useCallback((asyncCallback: () => Promise<any>) => {
        setLoading(true);  // Synchronously set loading to true before starting the async operation.
        asyncCallback().finally(() => {
            setLoading(false); // Synchronously set loading to false when the async operation completes or fails.
        });
    }, []);

    return [loading, startAsyncOperation];
}

export { useAsyncTransition };

