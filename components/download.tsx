"use client"
import { GetGoogleContent3, GetYcRecentStories } from "@/app/action";
import { LoadingScreen } from "@/components/loading";
import { SearchResultBlock } from "@/components/search-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsyncTransition } from "@/hooks/use-async";
import { useVectorSearch } from "@/hooks/use-vector-search";
import { WebSearchResult } from "@/types";
import { XCircle } from "lucide-react";
import { ChangeEvent, useCallback, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useToast } from "./ui/use-toast";


type Downloader = (query: string, count: number, periodInDays?: number) => Promise<WebSearchResult[] | Error>
const DownloadSources = [
    "google",
];
const Downloaders: { [key: string]: Downloader } = {
    "google": GetGoogleContent3,
    "hackernews": GetYcRecentStories
};

function DownloadView() {
    const [results, setResults] = useState<{ [key: string]: WebSearchResult[] }>();
    const [queries, setQueries] = useState<string[]>([]);
    const [query, setQuery] = useState<string>("");
    const [count, setCount] = useState(100);
    const [searchPeriod, setSearchPeriod] = useState<number>(7);
    const [downloading, startDownload] = useAsyncTransition();
    const { isLoading } = useVectorSearch();
    const { toast } = useToast();
    console.log(results);
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

    const onPeriodChange = useCallback((v: number[]) => {
        setSearchPeriod(Number(v[0]));
    }, []);

    const onQueryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { target: { value } } = e;
        setQuery(value);
    }, []);

    const onAddQuery = useCallback((e: any) => {
        const trimmed = query.trim()
        if (trimmed.length > 0) {
            setQueries(qs => { 
                const lcased = trimmed.toLowerCase();
                if(qs.map(s => s.toLowerCase()).includes(lcased)) {
                    toast({
                        description: `${trimmed}는 이미 선택된 검색어입니다`,
                        variant:'destructive'
                    });
                    return qs;
                }
                setQuery("");
                return [...qs, trimmed]; 
            });
        } else {
            toast({
                description: "검색어를 입력하세요"
            })
        }
    }, [query, toast]);

    const onDeleteQuery = useCallback((v: string) => {
        setQueries(queries => [...queries.filter(q => q !== v)])
    }, []);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="w-full flex flex-col items-center pt-8">
            <div className="space-y-4 w-full max-w-md">
                <div className="flex flex-col items-start space-y-2">
                    <Label htmlFor="date" className="text-right">{`SEARCH PERIOD: ${searchPeriod} days`}</Label>
                    <Slider id="date" defaultValue={[searchPeriod]} max={30} min={1} step={1} onValueChange={onPeriodChange} />
                </div>
                <div className="flex flex-col items-start space-y-2">
                    <Label htmlFor="count" className="text-right">{`NUMBER OF ITEM: ${count}`}</Label>
                    <Slider id="count" defaultValue={[count]} max={100} min={10} step={1} onValueChange={v => setCount(v[0])} />
                </div>
                <div className="flex flex-col items-start space-y-2 w-full">
                    <Label htmlFor="q" className="text-right">QUERY</Label>
                    <div className="grid grid-cols-8 gap-4 w-full">
                        <Input id="q" type="text" placeholder="Enter search query" className="col-span-5" value={query} onChange={onQueryChange} />
                        <Button className="col-span-3" onClick={onAddQuery}>ADD</Button>
                    </div>
                </div>
                {queries.map((query, id) => (
                    <div className="flex flex-row items-center border-solid border rounded-full pl-2 justify-between" key={id}>{query}
                        <Button onClick={() => onDeleteQuery(query)} variant={"ghost"} size={"icon"}><XCircle /></Button>
                    </div>
                ))}
                <Button disabled={downloading} type="submit" className="w-full" onClick={onStart}>Start</Button>
                {results && Object.entries(results).map(([key, result]) => <SearchResultBlock key={key} query={key} results={result} />)}
            </div>
        </div>
    );
}

export { DownloadView };

