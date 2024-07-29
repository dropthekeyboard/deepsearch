import { AsyncAPI } from "@/types";
import { createWorkerAPI } from "@/workers/worker-proxy";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";


const WorkerContext = createContext<AsyncAPI>({});

const WorkerProvider = ({children}:{children: ReactNode}) => {
    const [workerApi, setWorkerApi] = useState<AsyncAPI>({} as AsyncAPI);
    useEffect(() => {
        const c = createWorkerAPI<AsyncAPI>();
        setWorkerApi(c);
    }, []);
    return (
        <WorkerContext.Provider value={workerApi}>
            {children}
        </WorkerContext.Provider>
    )
}

function useWorker<T extends AsyncAPI>(): T {
    const context = useContext<AsyncAPI>(WorkerContext);
    if(context === undefined) {
        throw new Error("");
    }
    return context as T;
}


export {WorkerProvider, useWorker };