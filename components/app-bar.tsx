import { ThemeToggleAction } from "./theme-toggle";

function AppBar() {
    return (
        <nav className="shadow-md">
            <div className="flex justify-evenly items-center h-12">
                <a href="/" className="text-xl font-bold">
                    Deep Search
                </a>
                <ThemeToggleAction/>
            </div>
        </nav>
    );
}

export { AppBar };