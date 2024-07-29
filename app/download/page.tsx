"use client"
import { LoadingScreen } from "@/components/loading";
import { SearchResultBlock } from "@/components/search-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkerProvider } from "@/context/WorkerContext";
import { useAsyncTransition } from "@/hooks/use-async";
import { useVectorSearch } from "@/hooks/use-vector-search";
import { WebSearchResult } from "@/types";
import { XCircle } from "lucide-react";
import { ChangeEvent, useCallback, useState } from "react";
import { GetGoogleContent3, GetYcRecentStories } from "./action";

type Downloader = (query: string, count: number, periodInDays?: number) => Promise<WebSearchResult[] | Error>
const DownloadSources = [
    "google",
];
const Downloaders: { [key: string]: Downloader } = {
    "google": GetGoogleContent3,
    "hackernews": GetYcRecentStories
};

function Download() {
    const [results, setResults] = useState<{ [key: string]: WebSearchResult[] }>({});
    const [queries, setQueries] = useState<string[]>([]);
    const [query, setQuery] = useState<string>("");
    const [count, setCount] = useState(100);
    const [searchPeriod, setSearchPeriod] = useState<number>(7);
    const [downloading, startDownload] = useAsyncTransition();
    const { isLoading } = useVectorSearch();
    const onStart = useCallback(() => {
        setResults({});
        startDownload(async () => {
            for (const q in queries) {
                const qstr = queries[q];
                for (const source in DownloadSources) {
                    try {
                        const sname = DownloadSources[source]
                        const donwloader = Downloaders[sname];
                        const results = await donwloader(qstr, count, searchPeriod);
                        if (results instanceof Error) {
                            continue;
                        } else {
                            setResults(prev => {
                                return { ...prev, [qstr]: results };
                            });
                        }
                    } catch (e) {
                        console.log(`downloader for ${source} not exists`);
                    }
                }
            }
        })
    }, [queries, count, startDownload, searchPeriod]);

    const onPeriodChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { target } = e;
        setSearchPeriod(Number(target.value));
    }, []);

    const onQueryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { target: { value } } = e;
        setQuery(value);
    }, []);

    const onAddQuery = useCallback((e: any) => {
        setQueries(qs => [...qs, query]);
        setQuery("");
    }, [query]);

    const onDeleteQuery = useCallback((v: string) => {
        setQueries(queries => [...queries.filter(q => q !== v)])
    }, []);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="flex flex-col items-center p-24">
            <WorkerProvider>
                <div className="space-y-4 w-full max-w-md">
                    <div className="grid grid-cols-5 gap-4 items-center">
                        <Label htmlFor="date" className="col-span-1 text-right">PERIOD</Label>
                        <Input id="period" type="number" className="col-span-4" defaultValue={searchPeriod} onChange={onPeriodChange}></Input>
                    </div>
                    <div className="grid grid-cols-5 gap-4 items-center">
                        <Label htmlFor="count" className="col-span-1 text-right">NUMBER OF ITEM</Label>
                        <Input id="count" type="number" value={count} className="col-span-4" onChange={(e) => { setCount(Number(e.target.value)) }} />
                    </div>
                    <div className="grid grid-cols-5 gap-4 items-center">
                        <Label htmlFor="count" className="col-span-1 text-right">QUERY</Label>
                        <Input id="count" type="text" placeholder="Enter search query" className="col-span-3" value={query} onChange={onQueryChange} />
                        <Button className="col-span-1" onClick={onAddQuery}>ADD</Button>
                    </div>
                    {queries.map((query, id) => (
                        <div className="flex flex-row items-center border-solid border rounded-full pl-2 justify-between" key={id}>{query}
                            <Button onClick={() => onDeleteQuery(query)} variant={"ghost"} size={"icon"}><XCircle /></Button>
                        </div>
                    ))}
                    <Button disabled={downloading} type="submit" className="w-full" onClick={onStart}>Start</Button>
                    {Object.entries(results).map(([key, result]) => <SearchResultBlock key={key} query={key} results={result} />)}
                </div>
            </WorkerProvider>
        </div>
    );
}


export default function DownloadPage() {
    return (
        <WorkerProvider>
            <Download />
        </WorkerProvider>
    )
}