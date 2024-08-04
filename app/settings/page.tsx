"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAsyncTransition } from "@/hooks/use-async";
import useCache from "@/hooks/use-local-cache";
import { db } from "@/lib/db";
import { Edit, Loader2, Save, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function SettingPage() {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [tempKey, setTempKey] = useState<string>("");
    const [key, setKey] = useState<string>("");
    const { ready, upsertItem, getItem } = useCache<string>({ ttl: -1 });
    const [clearing, startClearing] = useAsyncTransition();
    const {toast} = useToast();


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
    }, [setKey, tempKey, ready, upsertItem]);

    const clearIndexed = useCallback(async () => {
        if (db.isOpen()) {
            startClearing(async () => {
                await db.vectorIndex.clear();
                await db.webSearchResults.clear();
                toast({description:'데이터 삭제 완료'});
            })
        }
    }, [db, startClearing]);

    return (
        <div className="flex flex-col items-center justify-center p-12 space-y-2">
            <div className="flex flex-col w-[50vw] border border-solid rounded-xl p-2 space-y-1">
                <a className="text-pretty" href="https://platform.openai.com/settings/profile?tab=api-keys">OPENAI API-KEY</a>
                <div className="flex flex-row items-center justify-center space-x-1 w-full">
                    {isEditing ? (
                        <div className="flex flex-row items-center w-full">
                            <Input
                                value={tempKey}
                                onChange={(e) => setTempKey(e.target.value)}
                                placeholder="Enter key"
                                className="flex-grow"
                            />
                            <Button className="flex-grow-0" onClick={handleSaveClick} size="icon">
                                <Save className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-row items-center w-full">
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
            <div className="flex flex-row items-center justify-between w-[50vw] p-2 border border-solid rounded-xl">
                Clear Indexed Content
                <Button onClick={clearIndexed} variant={'destructive'} size={'icon'} disabled={clearing}>
                    {clearing ? <Loader2 className="animate-spin"></Loader2> : <Trash2Icon className="w-4 h-4" />}
                </Button>
            </div>
        </div>
    );
}