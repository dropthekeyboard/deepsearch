

interface ProgressEmitter {
    on(event: 'progress', listener: (progress: number) => void): this;
    on(event: 'complete', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
}

interface BackgroundTask {
    downloadAndIndex():  Promise<ProgressEmitter>
}

class SimpleProgressEmitter implements ProgressEmitter {
    private listeners: { [key: string]: Function[] } = {
        'progress': [],
        'complete': [],
        'error': []
    };

    on(event: 'progress', listener: (progress: number) => void): this;
    on(event: 'complete', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: string, listener: Function): this {
        if (event in this.listeners) {
            this.listeners[event].push(listener);
        }
        return this;
    }

    emit(event: string, ...args: any[]) {
        if (event in this.listeners) {
            this.listeners[event].forEach(listener => listener(...args));
        }
    }
}

class BackgroundTaskProcessor implements BackgroundTask {
    downloadAndIndex(): Promise<ProgressEmitter> {
        return new Promise((resolve) => {
            const emitter = new SimpleProgressEmitter();
            resolve(emitter);

            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                emitter.emit('progress', progress);

                if (progress >= 100) {
                    clearInterval(interval);
                    emitter.emit('complete');
                }
            }, 1000); // Emit progress every second
        });
    }
}

