import { VectorObject } from "@/hooks/use-client-vector-search";
import useCache from "@/hooks/use-local-cache";
import { useVectorSearch } from "@/hooks/use-vector-search";
import { IndexedChunkData, WebSearchResult } from "@/types";
import { Label } from "@radix-ui/react-label";
import { SearchResult } from "client-vector-search";
import { Edit, MessageCircle, Save } from "lucide-react";
import React, { useCallback, useEffect, useState } from 'react';
import useSWR from "swr";
import ChatUI from "./chat";
import { SearchItemMin } from "./search-result";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { LoadingScreen } from "./loading";

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
    const [tempKey, setTempKey] = useState<string>("");
    const [context, setContext] = useState<string>("");
    const { ready, upsertItem, getItem } = useCache<string>({ ttl: -1 });
    const {isLoading: isVsLoading, search} = useVectorSearch();

    useEffect(() => {
        if (ready) {
            getItem('apikey').then((v) => {
                if (v) setKey(v);
            })
        }
    }, [ready, getItem]);

    const onSearchQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { target: { value } } = e;
        setSearchQuery(value);
    }, []);

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
        const searchResults = await search(query, 100);
        const srcChunksMap = new Map<string, RelevantSummaryItemProps>();
        searchResults.forEach((sr) => {
            const { name } = sr.object;
            const c: IndexedChunkData = JSON.parse(name);
            const { id } = c;
            if (id) {
                const record = srcChunksMap.get(id);
                if (record) {
                    srcChunksMap.set(id, { ...record, chunks: [...record.chunks, c], searchResults: [...record.searchResults, sr] });
                } else {
                    srcChunksMap.set(id, { source: { ...c }, chunks: [c], searchResults: [sr] })
                }
            }
        })
        return srcChunksMap;
    }, [search]);

    const { data, isLoading } = useSWR(searchQuery, async () => await fetchSearchResults(searchQuery), {dedupingInterval: 10000});
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

    if (isVsLoading) {
        return <LoadingScreen/>
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
            <div className="flex items-center space-x-4 mt-16">
                <Label className="font-semibold whitespace-nowrap">Search Query</Label>
                <Input className="flex-grow" value={searchQuery} onChange={onSearchQueryChange} placeholder="Enter your search query" />
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
