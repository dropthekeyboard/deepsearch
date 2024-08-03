"use client"
import { ThemeToggleAction } from "./theme-toggle";

function AppBar() {
    return (
        <nav className="shadow-md">
            <div className="flex justify-between items-center h-12 p-4">
                <a href="/" className="text-xl font-bold">
                    Deep Search
                </a>
                <ThemeToggleAction/>
            </div>
        </nav>
    );
}

export { AppBar };