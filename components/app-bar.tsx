"use client"
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { FileText, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Url } from "url";
import { AccountBadge } from "./account";
import Logo from "./logo";
import { ThemeToggleAction } from "./theme-toggle";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { useRouter } from "next/navigation";

function AppBar() {
    const { status, data } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleLinkClick = (href:string) => {
        setIsOpen(false);
        router.push(href);
    };

    return (
        <nav className="shadow-md">
            <div className="flex justify-between items-center h-12 p-4">
                <div className="flex flex-row">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant={"ghost"} size={"icon"}><HamburgerMenuIcon className="w-6 h-6" /></Button>
                        </SheetTrigger>
                        <SheetContent side={"left"}>
                            <SheetHeader>
                                <SheetTitle>MENU</SheetTitle>
                                <Button variant="ghost" className="w-full justify-start" onClick={() => handleLinkClick("/")}>
                                    <Search size={18} className="mr-2" />
                                    <span>Using Web Search</span>
                                </Button>
                                <Button variant="ghost" className="w-full justify-start" onClick={() => handleLinkClick("/files")}>
                                    <FileText size={18} className="mr-2" />
                                    <span>Using Files</span>
                                </Button>
                            </SheetHeader>
                            <SheetFooter>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                    <a href="/" className="text-xl font-bold flex flex-row items-center space-x-2">
                        Deep Search<Logo />
                    </a>
                </div>

                <div className="flex flex-row items-center space-x-1">
                    <ThemeToggleAction />
                    {status === 'authenticated' && <AccountBadge session={data} />}
                </div>
            </div>
        </nav>
    );
}
export { AppBar };
