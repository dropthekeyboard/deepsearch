"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useCache from "@/hooks/use-local-cache";
import { Edit, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function SettingPage() {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [tempKey, setTempKey] = useState<string>("");
    const [key, setKey] = useState<string>("");
    const { ready, upsertItem, getItem } = useCache<string>({ ttl: -1 });

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
        }
    }, [setKey, tempKey, ready, upsertItem]);

    return (
        <div className="flex flex-col items-center justify-center p-12 w-full">
            <div className="flex flex-col w-[50vw] border border-solid rounded-l-xl p-2 space-y-1">
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
        </div>
    );
}