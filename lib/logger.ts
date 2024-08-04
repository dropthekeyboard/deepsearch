// logger.ts
// logger.ts
export function withLogging(fn: Function, fnName: string = 'Anonymous') {
    return async (...args: any[]) => {
      console.log(`${fnName} called with arguments: ${args.map(a => JSON.stringify(a)).join(', ')}`);
      return fn(...args);
    };
  }
  