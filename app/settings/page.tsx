"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAsyncTransition } from "@/hooks/use-async";
import useCache from "@/hooks/use-local-cache";
import { db } from "@/lib/db";
import { Edit, Loader2, Save, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function SettingPage() {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [tempKey, setTempKey] = useState<string>("");
    const [key, setKey] = useState<string>("");
    const { ready, upsertItem, getItem } = useCache<string>({ ttl: -1 });
    const [clearing, startClearing] = useAsyncTransition();
    const { toast } = useToast();
    const [deletionScope, setDeletionScope] = useState<"all" | "7days" | "30days">("all");

    useEffect(() => {
        if (ready) {
            getItem('apikey').then((v) => {
                if (v) setKey(v);
            })
        }
    }, [ready, getItem]);

    const handleEditClick = useCallback(() => {
        setTempKey(key);
        setIsEditing(true);
    }, [key]);

    const handleSaveClick = useCallback(() => {
        setKey(tempKey);
        setIsEditing(false);
        if (ready) {
            upsertItem('apikey', tempKey);
            toast({description:'API키가 저장되었습니다.'});
        }
    }, [setKey, tempKey, ready, upsertItem, toast]);

    const clearIndexed = useCallback(async () => {
        if (db.isOpen()) {
            startClearing(async () => {
                const currentDate = new Date();
                let dateThreshold: Date | null = null;

                if (deletionScope === "7days") {
                    dateThreshold = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                } else if (deletionScope === "30days") {
                    dateThreshold = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                }

                if (dateThreshold) {
                    const oldResults = await db.webSearchResults
                        .where('searchDate')
                        .below(dateThreshold)
                        .toArray();

                    console.log(oldResults);

                    const chunkIdsToDelete = oldResults.flatMap(result => result.chunks);

                    await db.webSearchResults
                        .where('searchDate')
                        .below(dateThreshold)
                        .delete();

                    await db.vectorIndex
                        .where('id')
                        .anyOf(chunkIdsToDelete)
                        .delete();
                } else {
                    // Delete all data
                    await db.vectorIndex.clear();
                    await db.webSearchResults.clear();
                }

                toast({description: `${deletionScope === "all" ? "모든" : deletionScope === "7days" ? "7일 이상" : "30일 이상"} 데이터 삭제 완료`});
            })
        }
    }, [startClearing, deletionScope, toast]);

    return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="flex flex-col w-[50vw] border border-solid rounded-xl p-4 space-y-2">
                <a className="text-pretty" href="https://platform.openai.com/settings/profile?tab=api-keys">OPENAI API-KEY</a>
                <div className="flex flex-row items-center justify-center space-x-2 w-full">
                    {isEditing ? (
                        <div className="flex flex-row items-center w-full space-x-2">
                            <Input
                                value={tempKey}
                                onChange={(e) => setTempKey(e.target.value)}
                                placeholder="Enter key"
                                className="flex-grow"
                            />
                            <Button onClick={handleSaveClick} size="icon">
                                <Save className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-row items-center w-full space-x-2">
                            <Input
                                value={key}
                                readOnly
                                disabled
                                className="flex-grow"
                            />
                            <Button onClick={handleEditClick} size="icon">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-col w-[50vw] border border-solid rounded-xl p-4 space-y-4">
                <h3 className="text-lg font-semibold">CLEAR INDEXED CONTENT</h3>
                <RadioGroup value={deletionScope} onValueChange={(value: string) => setDeletionScope(value as "all" | "7days" | "30days")}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all">전체 삭제</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="7days" id="7days" />
                        <Label htmlFor="7days">7일 이상 데이터 삭제</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="30days" id="30days" />
                        <Label htmlFor="30days">30일 이상 데이터 삭제</Label>
                    </div>
                </RadioGroup>
                <Button onClick={clearIndexed} variant={'destructive'} disabled={clearing} className="w-full">
                    {clearing ? <Loader2 className="animate-spin mr-2" /> : <Trash2Icon className="w-4 h-4 mr-2" />}
                    {clearing ? "삭제 중..." : "삭제하기"}
                </Button>
            </div>
        </div>
    );
}