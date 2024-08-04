"use client"
import { signOutAction } from "@/app/lib/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { CiUser } from "react-icons/ci";


interface AccountBadgeProps {
    session: Session;
}
export function AccountBadge({ session }: AccountBadgeProps) {
    const { user } = session;
    const { push } = useRouter()
    const goToSetting = useCallback(() => {
        push('/settings');
    },[push]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={'ghost'} size={'icon'}>
                    <Avatar className="size-8">
                        {user?.image ? <AvatarImage src={user?.image} /> : <></>}
                        <AvatarFallback><CiUser/></AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-50">
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <form action={goToSetting}>
                            <button type="submit">Settings</button>
                        </form>
                    </DropdownMenuItem>
                    <form action={signOutAction}>
                        <DropdownMenuItem>
                            <button type="submit">Logout</button>
                        </DropdownMenuItem>
                    </form>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}