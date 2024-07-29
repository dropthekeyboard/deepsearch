declare module 'levelgraph' {
  import { LevelUp } from 'level';

  interface Triple {
    subject: string;
    predicate: string;
    object: string;
    [key: string]: any;
  }

  interface SearchQuery {
    subject?: string | Variable;
    predicate?: string | Variable;
    object?: string | Variable;
    [key: string]: any;
  }

  interface Variable {
    '?': string;
  }

  interface Materialized {
    subject: Variable;
    predicate: string;
    object: Variable;
  }

  interface SearchOptions {
    limit?: number;
    offset?: number;
    filter?: (solution: any, callback: (err: Error | null, result?: any) => void) => void;
    materialized?: Materialized;
  }

  interface SearchResult {
    [key: string]: string;
  }

  interface LevelGraph {
    put(triple: Triple | Triple[], callback: (err: Error | null) => void): void;
    del(triple: Triple | Triple[], callback: (err: Error | null) => void): void;
    get(pattern: Partial<Triple>, callback: (err: Error | null, result: Triple[]) => void): void;
    search(pattern: SearchQuery[], options: SearchOptions, callback: (err: Error | null, result: SearchResult[]) => void): void;
    searchStream(pattern: SearchQuery[]): NodeJS.ReadableStream;
    getStream(pattern: Partial<Triple>): NodeJS.ReadableStream;
    v(variableName: string): Variable;
  }

  function levelgraph(db: LevelUp): LevelGraph;

  export = levelgraph;
  export type { LevelGraph, Triple, SearchQuery, Variable, Materialized, SearchOptions, SearchResult };
}
