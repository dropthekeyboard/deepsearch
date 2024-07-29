const LoadingScreen = () => {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xl font-semibold">Vector Search is initializing...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments. Please wait.</p>
            </div>
        </div>
    );
}

export {LoadingScreen};