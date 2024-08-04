"use client"
import { useSession } from "next-auth/react";
import { AccountBadge } from "./account";
import { ThemeToggleAction } from "./theme-toggle";

function AppBar() {
    const { status, data } = useSession();
    return (
        <nav className="shadow-md">
            <div className="flex justify-between items-center h-12 p-4">
                <a href="/" className="text-xl font-bold">
                    Deep Search
                </a>
                <div className="flex flex-row items-center space-x-1">
                    <ThemeToggleAction />
                    {status === 'authenticated' && <AccountBadge session={data} />}
                </div>


            </div>
        </nav>
    );
}

export { AppBar };