"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAsyncTransition } from "@/hooks/use-async";
import { useVectorSearch } from "@/hooks/use-vector-search";
import useWebSearchResults from "@/hooks/use-web-search";
import { chopText, cleanText, removePath, removeUrl } from "@/lib/utils";
import { IndexedChunkData, WebSearchResult } from "@/types";
import crypto from 'crypto';
import { format } from 'date-fns';
import { AlertCircle, Ban, Calendar, CheckCircle, Cloud, Loader2, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 100;
const MAX_LENGTH = 5000;
const MIN_LENGTH = 100;

interface SearchItemProps {
    data: WebSearchResult;
    pong?: () => void;
    onDelete?: (id: string) => void;
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


function SearchItemMin({ data, onDelete }: SearchItemProps) {
    const { source, description, title, url, contentDate, searchDate, query, id } = data;
    const { deleteResult } = useWebSearchResults();

    const formatDate = (date: Date | null) => {
        if (!date) return 'N/A';
        return format(date, 'MMM d, yyyy');
    };

    const handleDelete = useCallback(async () => {
        try {
            await deleteResult(id);
            onDelete?.(id);
        } catch (e) {
            console.log("", e);
        }

    }, [deleteResult, id, onDelete]);

    return (
        <div className="flex flex-col pt-4 mb-4 shadow-md rounded-lg hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-row justify-between">
                <a href={url} target="_blank" rel="noopener noreferrer" className="group">
                    <div className="text-lg font-semibold group-hover:underline mb-1">{title}</div>
                </a>
                <Button onClick={handleDelete} variant={"ghost"} size={'icon'}><Trash2 className="w-6 h-6" /></Button>
            </div>
            <div className="text-sm mb-2">{source}</div>
            <ScrollArea className="text-sm mb-2 h-24">{description}</ScrollArea>
            {/* Dates display */}
            <div className="flex justify-between items-center text-xs mb-2">
                <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Content: {formatDate(contentDate)}</span>
                </div>
                <div className="flex flex-col space-y-2">
                    <div className="font-light text-xs">{`"${query}"`}</div>
                    <div className="flex items-center">
                        <Search className="w-4 h-4 mr-1" />
                        <span>Searched: {formatDate(searchDate)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

async function fetchPlainTextContentEF(url: string): Promise<string | null> {
    try {
        const params = new URLSearchParams({ url })
        const result = await fetch(`/api/down?${params.toString()}`, { method: 'GET' })
        if (result && result.ok) {
            const { content } = await result.json();
            return content || "";
        }
    } catch (e) {
        console.log(e);
    }
    return null;
}


function SearchItem({ data, pong }: SearchItemProps) {
    const [error, setError] = useState<any>();
    const [item, setItem] = useState<WebSearchResult | null>(null);
    const { add, embed, isLoading } = useVectorSearch();
    const [indexingProgress, setIndexingProgress] = useState(0);
    const { ready, getResultById, upsertResult } = useWebSearchResults();
    const [retrieving, startRetrieval] = useAsyncTransition();
    const [indexing, startIndexing] = useAsyncTransition();

    useEffect(() => {
        if (data && ready && !item) {
            getResultById(data.id).then(v => {
                if (v) {
                    console.log("hit:", v);
                    setItem(v);
                } else {
                    setItem(data);
                }
            })
            setItem(data);
        }
    }, [data, ready, getResultById, item]);

    useEffect(() => {

        if (item) {
            const { id } = item;
            if (id) {
                const upsertItem = async () => {
                    const existingItem = await getResultById(id)
                    if (!existingItem) {
                        await upsertResult(item);
                    } else if (existingItem !== item) {
                        await upsertResult(item);
                    } else {
                        console.log("not updated");
                    }
                };
                upsertItem();
            } else {
                console.log("no ID");
            }
        }
    }, [item, getResultById, upsertResult]);

    useEffect(() => {
        if (pong && !isLoading && item) {
            const { url, isRetrieved } = item;
            if (!isRetrieved && !retrieving) {
                startRetrieval(async () => {
                    try {
                        const content = await fetchPlainTextContentEF(url) || "";
                        setItem(prev => prev ? { ...prev, content, isRetrieved: true } : prev);
                    } catch (e) {
                        setItem(prev => prev ? { ...prev, content: "", isRetrieved: true } : prev);
                        setError(e);
                    }
                });
            }
        }
    }, [pong, isLoading, item, embed, add, retrieving, startRetrieval]);

    useEffect(() => {
        if (pong && !isLoading && item) {
            const { isIndexed, content, isRetrieved } = item;
            if (!isIndexed && !indexing && isRetrieved) {
                startIndexing(async () => {
                    if (content && content.length > 0) {
                        try {
                            const chunks = chopText(cleanText(removePath(removeUrl(content))), 4, 1)
                                .map(cleanText)
                                .filter(Boolean)
                                .filter(c => c.length < MAX_LENGTH)
                                .filter(c => c.length > MIN_LENGTH);
                            const totalChunks = chunks.length;
                            const chunkIds: number[] = [];

                            for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
                                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
                                const batch = chunks.slice(i, i + BATCH_SIZE);
                                await Promise.all(batch.map(async (chunk) => {
                                    const embedding = await embed(chunk);
                                    const { id: parentId, url, source } = item;
                                    const vobject: IndexedChunkData = { parentId, url, chunk, source };
                                    const name = JSON.stringify(vobject);
                                    const id = getUniqueId(name);
                                    chunkIds.push(id);
                                    await add({ id, name }, embedding);
                                }));
                                setIndexingProgress(Math.min(((i + BATCH_SIZE) / totalChunks) * 100, 100));
                            }
                            setItem(prev => prev ? { ...prev, isIndexed: true, chunks: chunkIds } : prev);
                        } catch (e) {
                            console.log("", e);
                            setError(e);
                        }
                    }
                });
            }
            // try retrieva the content

        }
    }, [pong, isLoading, item, embed, add, indexing, startIndexing]);

    const hasNoContent = useCallback(() => {

        return !retrieving && !error && item && item.isRetrieved && (item.content ? item.content.length === 0 : true);
    }, [retrieving, item, error])

    useEffect(() => {
        if (pong) {
            if (error) {
                pong();
            } else if (item) {
                console.log('pong');
                const { isIndexed, isRetrieved, content } = item;
                if (isRetrieved) {
                    if (content && content.length > 0) {
                        if (isIndexed) {
                            pong();
                        }
                    } else {
                        pong();
                    }

                }
            }
        }
    }, [error, pong, item]);


    const formatDate = (date: Date | null) => {
        if (!date) return 'N/A';
        return format(date, 'MMM d, yyyy');
    };

    return (
        <div className="flex flex-col p-4 mb-4 shadow-md rounded-lg hover:shadow-lg transition-shadow duration-300">
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="group">
                <div className="text-lg font-semibold group-hover:underline mb-1">{data.title}</div>
                <div className="text-sm mb-2">{data.source}</div>
            </a>
            <div className="text-sm mb-2">{data.description}</div>
            {/* Dates display */}
            <div className="flex justify-between items-center text-xs mb-2 font-light">
                <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Content: {formatDate(data.contentDate)}</span>
                </div>
                <div className="flex items-center">
                    <Search className="w-4 h-4 mr-1" />
                    <span>Searched: {formatDate(data.searchDate)}</span>
                </div>
            </div>
            {indexing ? (
                <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Indexing Progress</span>
                        <span className="text-sm font-medium">{Math.round(indexingProgress)}%</span>
                    </div>
                    <Progress value={indexingProgress} className="w-full" />
                </div>
            ) : (
                item && item.isIndexed && (
                    <div className="mt-2 flex items-center text-green-500">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm">Indexing Complete</span>
                    </div>
                )
            )}
            {/* Content fetching state and local sync indicator */}
            <div className="flex flex-row items-center justify-between">
                <div className="mt-2 flex items-center">
                    {retrieving && (
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
                    {hasNoContent() && (<div className="flex items-center text-gray-500">
                        <Ban className="w-4 h-4 mr-2" />
                        <span className="text-xs">No content</span>
                    </div>)}
                    {item && item.content && (
                        <div className="flex items-center text-green-500">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span className="text-xs">Loaded</span>
                        </div>
                    )}
                </div>
                {/* Local sync indicator */}
                <div className="flex items-center">
                    {item && item.isRetrieved && (
                        <div className="flex items-center text-blue-500 mr-2" title="Synced locally">
                            <Cloud className="w-4 h-4" />
                        </div>
                    )}
                    {indexing && (
                        <div className="flex items-center text-yellow-500" title="Indexing">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* Accordion for content display */}
            {item && item.content && (
                <Accordion type="single" collapsible className="w-full mt-2">
                    <AccordionItem value="content">
                        <AccordionTrigger>View Content</AccordionTrigger>
                        <AccordionContent>
                            <ScrollArea className="h-80 font-thin text-pretty">
                                {item.content}
                            </ScrollArea>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </div>
    );
}

function SearchResultBlock({ results, query, onProcessingComplete }: { results: WebSearchResult[], query: string, onProcessingComplete?: () => void }) {
    const [processingComplete, setProcessingComplete] = useState(false);
    const [processing, setProcessing] = useState(0);

    const handlePong = useCallback((index: number) => {
        console.log(`Item ${index} completed`);
        if (index < results.length) {
            setProcessing(index + 1);
        }
    }, [results]);

    useEffect(() => {
        if (processingComplete) {
            onProcessingComplete?.();
        }
    }, [processingComplete, onProcessingComplete]);

    useEffect(() => {
        setProcessingComplete(processing >= results.length);
    }, [processing, results]);

    const progressPercentage = (processing / results.length) * 100;

    return (
        <div className="max-w-3xl mx-auto p-4">
            <div className="text-2xl font-bold mb-4">Search Results for {query}</div>
            <div className="mb-4 text-sm">
                {results.length} results found
                {processingComplete
                    ? " (All items processed)"
                    : ` (${processing} of ${results.length} processed)`}
            </div>
            <Progress value={progressPercentage} className="mb-4" />
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="0">
                    <AccordionTrigger></AccordionTrigger>
                    <AccordionContent>
                        {results.map((item, index) => (
                            <SearchItem
                                key={index}
                                data={item}
                                pong={(processing === index) && onProcessingComplete ? () => handlePong(index) : undefined}
                            />
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

        </div>
    );
}

export { SearchItemMin, SearchResultBlock };

