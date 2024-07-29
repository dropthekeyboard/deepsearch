import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useWorker } from "@/context/WorkerContext";
import { useAsyncTransition } from "@/hooks/use-async";
import useWebSearchResults from "@/hooks/use-web-search";
import { chopText, cleanText, createId, removePath, removeUrl } from "@/lib/utils";
import { VectorSearchAPI } from "@/lib/vector-search";
import { WebSearchResult } from "@/types";
import crypto from 'crypto';
import { format } from 'date-fns';
import { AlertCircle, Ban, Calendar, CheckCircle, Cloud, Loader2, Search } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { useVectorSearch } from "@/hooks/use-vector-search";
import { LoadingScreen } from "./loading";
import { fetchPlainTextContent } from "@/app/download/action";

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 100;
const MAX_LENGTH = 5000;
const MIN_LENGTH = 100;
const CONCURRENT_PROC_COUNT = 1;

interface SearchItemProps {
    data: WebSearchResult;
    ping?: boolean;
    pong?: () => void;
}

interface SearchResultBlockProps {
    results: WebSearchResult[];
    query: string;
}

function getUniqueId(veryLongJson: string): number {
    // Step 1: Create a hash of the JSON string
    const hash = crypto.createHash('sha256');
    hash.update(veryLongJson);
    const hexHash = hash.digest('hex');

    // Step 2: Convert the hash to a number
    // We'll use the first 13 characters (52 bits) to stay within safe integer range
    const hashSubset = hexHash.slice(0, 13);
    const uniqueNumber = parseInt(hashSubset, 16);

    // Step 3: Ensure the result is a positive integer within safe integer range
    return Math.abs(uniqueNumber) % Number.MAX_SAFE_INTEGER;
}


function SearchItemMin({ data }: SearchItemProps) {
    const { content } = data;

    const formatDate = (date: Date | null) => {
        if (!date) return 'N/A';
        return format(date, 'MMM d, yyyy');
    };

    return (
        <div className="flex flex-col p-4 mb-4 shadow-md rounded-lg hover:shadow-lg transition-shadow duration-300">
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="group">
                <h3 className="text-lg font-semibold group-hover:underline mb-1">{data.title}</h3>
                <p className="text-sm mb-2">{data.source}</p>
                <p className="text-sm mb-2">{data.description}</p>
            </a>

            {/* Dates display */}
            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Content: {formatDate(data.contentDate)}</span>
                </div>
                <div className="flex items-center">
                    <Search className="w-4 h-4 mr-1" />
                    <span>Searched: {formatDate(data.searchDate)}</span>
                </div>
            </div>
        </div>
    );
}


function SearchItem({ data, ping, pong }: SearchItemProps) {
    const [loadingContent, startLoadingContent] = useAsyncTransition();
    const [content, setContent] = useState<string>();
    const [error, setError] = useState<any>();
    const { ready, getResultById, upsertResult } = useWebSearchResults();
    const [savedData, setSavedData] = useState<WebSearchResult | null>(null);
    const [indexedData, setIndexedData] = useState<WebSearchResult | null>(null);
    const { add, embed } = useVectorSearch();
    const [indexingProgress, setIndexingProgress] = useState(0);
    const [isIndexing, setIsIndexing] = useState(false);

    const indexVectorSearch = useCallback(async () => {
        if (!savedData?.content || savedData.content.trim() === "") {
            console.log("Content is undefined or empty. Skipping indexing.");
            setIsIndexing(false);
            setIndexingProgress(100);
            pong?.();
            return;
        }
        if (savedData.isIndexed) {
            setIsIndexing(false);
            setIndexingProgress(100);
            setIndexedData(savedData);
            pong?.();
            return;
        }

        setIsIndexing(true);
        const chunks = chopText(cleanText(removePath(removeUrl(savedData.content))), 4, 1)
            .map(cleanText)
            .filter(Boolean)
            .filter(c => c.length < MAX_LENGTH)
            .filter(c => c.length > MIN_LENGTH);
        const totalChunks = chunks.length;

        for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            const batch = chunks.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (chunk) => {
                const embedding = await embed(chunk);
                const vobject = { ...savedData, chunk };
                const name = JSON.stringify(vobject);
                const id = getUniqueId(name);
                await add({ id, name }, embedding);
            }));
            setIndexingProgress(Math.min(((i + BATCH_SIZE) / totalChunks) * 100, 100));
        }
        setIndexedData({ ...savedData, isIndexed: true });
        setIsIndexing(false);
        pong?.();
    }, [savedData, add, embed, pong]);

    const saveContent = useCallback(async () => {
        let c;
        const id = createId(data);
        try {
            const saved = await getResultById(id);
            if (saved) {
                setContent(saved.content);
                setSavedData(saved);
            } else {
                console.log("download request :", data);
                c = await fetchPlainTextContent(data.url);
                if (c) {
                    setContent(c);
                }
                const toSave = { ...data, content: c, id };
                await upsertResult(toSave);
                setSavedData(toSave);
            }
        } catch (e) {
            setError(e);
        }
    }, [data, getResultById, upsertResult]);

    useEffect(() => {
        if (error) {
            pong?.();
        }
    }, [error, pong])

    useEffect(() => {
        if (ready && !savedData) {
            startLoadingContent(saveContent);
        }
    }, [ready, saveContent, startLoadingContent, savedData]);

    useEffect(() => {
        if (savedData && !isIndexing && ping && !indexedData) {
            indexVectorSearch().catch(console.error).then(() => {
                setSavedData(prev => prev ? { ...prev, isIndexed: true } : prev);
            });
        }
    }, [savedData, indexVectorSearch, isIndexing, ping, indexedData, pong]);

    useEffect(() => {
        if (indexedData) {
            upsertResult(indexedData);
        }
    }, [indexedData, upsertResult]);

    const formatDate = (date: Date | null) => {
        if (!date) return 'N/A';
        return format(date, 'MMM d, yyyy');
    };
    

    return (
        <div className="flex flex-col p-4 mb-4 shadow-md rounded-lg hover:shadow-lg transition-shadow duration-300">
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="group">
                <h3 className="text-lg font-semibold group-hover:underline mb-1">{data.title}</h3>
                <p className="text-sm mb-2">{data.source}</p>
                <p className="text-sm mb-2">{data.description}</p>
            </a>

            {/* Dates display */}
            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Content: {formatDate(data.contentDate)}</span>
                </div>
                <div className="flex items-center">
                    <Search className="w-4 h-4 mr-1" />
                    <span>Searched: {formatDate(data.searchDate)}</span>
                </div>
            </div>
            {isIndexing ? (
                <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Indexing Progress</span>
                        <span className="text-sm font-medium">{Math.round(indexingProgress)}%</span>
                    </div>
                    <Progress value={indexingProgress} className="w-full" />
                </div>
            ) : (
                indexedData && (
                    <div className="mt-2 flex items-center text-green-500">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm">Indexing Complete</span>
                    </div>
                )
            )}
            {/* Content fetching state and local sync indicator */}
            <div className="flex flex-row items-center justify-between">
                <div className="mt-2 flex items-center">
                    {loadingContent && (
                        <div className="flex items-center text-blue-500">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span className="text-xs">Loading</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center text-red-500">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span className="text-xs">Error</span>
                        </div>
                    )}
                    {!loadingContent && !error && content === undefined && (
                        <div className="flex items-center text-gray-500">
                            <Ban className="w-4 h-4 mr-2" />
                            <span className="text-xs">No content</span>
                        </div>
                    )}
                    {content && (
                        <div className="flex items-center text-green-500">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span className="text-xs">Loaded</span>
                        </div>
                    )}
                </div>
                {/* Local sync indicator */}
                <div className="flex items-center">
                    {savedData && (
                        <div className="flex items-center text-blue-500 mr-2" title="Synced locally">
                            <Cloud className="w-4 h-4" />
                        </div>
                    )}
                    {isIndexing && (
                        <div className="flex items-center text-yellow-500" title="Indexing">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* Accordion for content display */}
            {content && (
                <Accordion type="single" collapsible className="w-full mt-2">
                    <AccordionItem value="content">
                        <AccordionTrigger>View Content</AccordionTrigger>
                        <AccordionContent>
                            <ScrollArea className="h-80 font-thin text-pretty">
                                {content}
                            </ScrollArea>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </div>
    );
}

const MemoizedSearchItem = memo(SearchItem);
function SearchResultBlock({ results, query }: { results: WebSearchResult[], query: string }) {
    const [processingComplete, setProcessingComplete] = useState(false);
    const [processing, setProcessing] = useState(0);


    const handlePong = useCallback((index: number) => {
        console.log(`Item ${index} completed`);
        if(index < results.length) {
            if(processing === index) {
                setProcessing(index + 1);
            }
        } else {
            setProcessingComplete(true);
        }
    }, [results, processing]);


    const progressPercentage = (processing / results.length) * 100;

    return (
        <div className="max-w-3xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Search Results for {query}</h2>
            <p className="mb-4 text-sm">
                {results.length} results found
                {processingComplete
                    ? " (All items processed)"
                    : ` (${processing} of ${results.length} processed)`}
            </p>
            <Progress value={progressPercentage} className="mb-4" />
            {results.map((item, index) => (
                <MemoizedSearchItem
                    key={index}
                    data={item}
                    ping={processing === index}
                    pong={() => handlePong(index)}
                />
            ))}
        </div>
    );
}

export { SearchResultBlock, SearchItemMin };
