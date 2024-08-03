"use client"

import { VectorObject } from "@/hooks/use-client-vector-search";
import useCache from "@/hooks/use-local-cache";
import { useVectorSearch } from "@/hooks/use-vector-search";
import useWebSearchResults from "@/hooks/use-web-search";
import { IndexedChunkData, WebSearchResult } from "@/types";
import { Label } from "@radix-ui/react-label";
import { SearchResult } from "client-vector-search";
import { Edit, MessageCircle, Save } from "lucide-react";
import React, { useCallback, useEffect, useState } from 'react';
import useSWRImmutable from "swr/immutable";
import { encodingForModel } from "js-tiktoken";
import ChatUI from "./chat";
import { LoadingScreen } from "./loading";
import { SearchItemMin } from "./search-result";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Slider } from "./ui/slider";
import { useToast } from "./ui/use-toast";
import Markdown from "react-markdown";


const encoding = encodingForModel("gpt-4o")

function countTokens(text: string) {
    // Initialize the tokenizer
    const tokens = encoding.encode(text);
    return tokens.length
}

interface RelevantChunkItemProps {
    result: SearchResult;
}

function RelevantChunkItem({ result }: RelevantChunkItemProps) {
    const [data, setData] = useState<IndexedChunkData | null>(null);

    useEffect(() => {
        const object: VectorObject = result.object;
        const chunkMeta: IndexedChunkData = JSON.parse(object.name);
        setData(chunkMeta);
    }, [result]);

    return (
        <Card className="w-full transition-all hover:shadow-md">
            <CardContent className="p-4 flex items-center justify-between space-x-4">
                <Badge variant="secondary" className="shrink-0">
                    {result.similarity.toFixed(3)}
                </Badge>
                <p className="text-sm flex-grow line-clamp-2">{data?.chunk}</p>
                <span className="text-xs text-muted-foreground shrink-0">{data?.source}</span>
            </CardContent>
        </Card>
    );
}

interface RelevantSummaryItemProps {
    source: WebSearchResult,
    chunks: IndexedChunkData[];
    searchResults: SearchResult[];
}

function RelevantSummaryItem({ source, chunks, searchResults }: RelevantSummaryItemProps) {
    return (
        <Card className="w-full">
            <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-12 justify-between items-center">
                    <div className="col-span-11">
                        <SearchItemMin data={source} />
                    </div>
                    <div className="col-span-1 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Relevant Contents</p>
                        <p className="text-2xl font-bold">{chunks.length}</p>
                    </div>
                </div>
                <ScrollArea className="h-64">
                    <div className="space-y-2">
                        {searchResults.map((sr, index) => (
                            <RelevantChunkItem key={index} result={sr} />
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

function ResearchView() {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [key, setKey] = useState<string>("");
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [topK, setTopK] = useState<number>(50);
    const [tempKey, setTempKey] = useState<string>("");
    const [context, setContext] = useState<string>("");
    const [tokenCount, setTokenCount] = useState<number>();
    const { ready, upsertItem, getItem } = useCache<string>({ ttl: -1 });
    const { isLoading: isVsLoading, search } = useVectorSearch();
    const { getResultById } = useWebSearchResults();
    const { toast } = useToast();

    useEffect(() => {
        if (ready) {
            getItem('apikey').then((v) => {
                if (v) setKey(v);
            })
        }
    }, [ready, getItem]);

    useEffect(() => {
        setTokenCount(countTokens(context));
    }, [context]);

    useEffect(() => {
        if (tokenCount) {
            console.log("token count: ", tokenCount);
            if (!(key && key.length > 0)) {
                if (tokenCount > 7000) {
                    toast({
                        description: <Markdown>{`context information is too large for llama-3.1-8b (8K) : ${tokenCount} tokens. you can switch the model to **gpt-4o-mini** by entering the *[OpenAI API Key](https://platform.openai.com/settings/profile?tab=api-keys)*`}</Markdown>,
                        variant:'destructive',
                        title:'Too large information'
                    })
                    setTopK(prev => {
                        if (prev > 10) {
                            return prev - 10;
                        }
                        return prev;
                    })
                }
            }
        }
    }, [tokenCount]);


    const handleEditClick = useCallback(() => {
        setTempKey(key);
        setIsEditing(true);
    }, [key]);

    const handleSaveClick = useCallback(() => {
        setKey(tempKey);
        setIsEditing(false);
        if (ready) {
            upsertItem('apikey', tempKey);
        }
    }, [setKey, tempKey, ready, upsertItem]);

    const fetchSearchResults = useCallback(async (query: string) => {
        const searchResults = await search(query, topK);
        const srcChunksMap = new Map<string, RelevantSummaryItemProps>();
        for (const sr of searchResults) {
            const { name } = sr.object;
            const c: IndexedChunkData = JSON.parse(name);
            const { parentId } = c;
            if (parentId) {
                const record = srcChunksMap.get(parentId);
                if (record) {
                    srcChunksMap.set(parentId, { ...record, chunks: [...record.chunks, c], searchResults: [...record.searchResults, sr] });
                } else {
                    const source = await getResultById(parentId);
                    if (source) {
                        srcChunksMap.set(parentId, { source, chunks: [c], searchResults: [sr] })
                    } else {
                        console.log("invalid state");
                    }
                }
            }
        }
        return srcChunksMap;
    }, [search, getResultById]);

    const { data, isLoading } = useSWRImmutable(searchQuery && { searchQuery, topK }, async () => await fetchSearchResults(searchQuery));
    useEffect(() => {
        if (data && !isLoading) {
            // convert data into markdown table format
            // and call setContext() with it
            setContext(JSON.stringify(Array.from(data).map(([key, value]) => {
                const { source, chunks } = value;
                const { query, title, contentDate, description, source: informationSource, url } = source;
                const simplifiedChunks = chunks.map((chunk) => {
                    const { chunk: relevantParagraph } = chunk;
                    return relevantParagraph;
                });

                return { query, title, contentDate, description, url, informationSource, relevantParagraphs: simplifiedChunks }
            })));
        }
    }, [data, isLoading]);

    const onSearchQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { target: { value } } = e;
        setSearchQuery(value);
    }, []);

    if (isVsLoading) {
        return <LoadingScreen />
    }

    return (
        <main className="container mx-auto py-8 space-y-8">
            <div className="absolute top-16 left-8 flex items-center space-x-2">
                <div className="flex flex-col">
                    <a className="text-pretty" href="https://platform.openai.com/settings/profile?tab=api-keys">OPENAI API-KEY</a>
                    <div className="flex flex-row items-center justify-center space-x-1">
                        {isEditing ? (
                            <>
                                <Input
                                    value={tempKey}
                                    onChange={(e) => setTempKey(e.target.value)}
                                    placeholder="Enter key"
                                    className="w-40"
                                />
                                <Button onClick={handleSaveClick} size="icon">
                                    <Save className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Input
                                    value={key}
                                    readOnly
                                    disabled
                                    className="w-40"
                                />
                                <Button onClick={handleEditClick} size="icon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-start space-y-4 mt-16">
                <Label className="font-semibold whitespace-nowrap">SEMANTIC SEARCH QUERY</Label>
                <Input className="flex-grow" value={searchQuery} onChange={onSearchQueryChange} placeholder="Enter your search query" />
            </div>
            <div className="flex flex-col items-start space-y-4 mt-16">
                <Label className="font-semibold whitespace-nowrap">{`SEARCH COUNT (TopK): ${topK}`}</Label>
                <Slider value={[topK]} max={100} min={10} step={10} onValueChange={v => setTopK(v[0])} />
            </div>
            <div className="space-y-6">
                {isLoading ? (
                    <p className="text-center text-muted-foreground">Loading...</p>
                ) : data && Array.from(data.values()).length > 0 ? (
                    Array.from(data.values())
                        .sort((a, b) => b.chunks.length - a.chunks.length)
                        .map((source, index) => (
                            <RelevantSummaryItem
                                key={index}
                                source={source.source}
                                chunks={source.chunks}
                                searchResults={source.searchResults}
                            />
                        ))
                ) : (
                    <p className="text-center text-muted-foreground">No results found. Try a different search query.</p>
                )}
            </div>
            <Drawer>
                <DrawerTrigger asChild>
                    <Button
                        className="fixed bottom-8 right-8 rounded-full w-16 h-16 shadow-lg"
                        size="icon"
                    >
                        <MessageCircle className="h-6 w-6" />
                    </Button>
                </DrawerTrigger>
                <DrawerDescription></DrawerDescription>
                <DrawerContent className="items-center">
                    <DrawerHeader>
                        <DrawerTitle>Chat</DrawerTitle>
                    </DrawerHeader>
                    <ChatUI id={searchQuery} apiKey={key} context={context} />
                </DrawerContent>
            </Drawer>
        </main>
    );
}

export default ResearchView;
export { ResearchView };
