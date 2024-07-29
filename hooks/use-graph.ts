import { useEffect, useState, useCallback } from "react";
import levelgraph, { LevelGraph } from "levelgraph";
import { BrowserLevel } from "browser-level";

interface Triple {
  subject: string;
  predicate: string;
  object: string;
  [key: string]: any;
}

interface SearchQuery {
  subject?: string | { "?": string };
  predicate?: string | { "?": string };
  object?: string | { "?": string };
}

interface UseLevelGraphProps {
  name: string;
}

const useLevelGraph = ({ name }: UseLevelGraphProps) => {
  const [db, setDb] = useState<LevelGraph | null>(null);

  useEffect(() => {
    const browserDb = new BrowserLevel(name, { valueEncoding: "json" });
    const graphDb = levelgraph(browserDb);
    setDb(graphDb);
  }, [name]);

  const putTriple = useCallback(
    async (triple: Triple): Promise<void> => {
      if (!db) {
        throw new Error("Database not initialized");
      }
      return new Promise((resolve, reject) => {
        db.put(triple, (err) => {
          if (err) {
            console.error("Error inserting triple:", err);
            reject(err);
          } else {
            console.log("Triple inserted successfully");
            resolve();
          }
        });
      });
    },
    [db]
  );

  const getTriples = useCallback(
    (pattern: Partial<Triple>): Promise<Triple[]> => {
      if (!db) {
        throw new Error("Database not initialized");
      }
      return new Promise((resolve, reject) => {
        db.get(pattern, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    },
    [db]
  );

  const searchTriples = useCallback(
    (pattern: SearchQuery[]): Promise<any[]> => {
      if (!db) {
        throw new Error("Database not initialized");
      }

      // Convert the pattern to include variables using db.v()
      const convertedPattern = pattern.map((query) => {
        const newQuery: any = {};
        if (query.subject) {
          newQuery.subject = typeof query.subject === "object" && query.subject["?"] ? db.v(query.subject["?"]) : query.subject;
        }
        if (query.predicate) {
          newQuery.predicate = typeof query.predicate === "object" && query.predicate["?"] ? db.v(query.predicate["?"]) : query.predicate;
        }
        if (query.object) {
          newQuery.object = typeof query.object === "object" && query.object["?"] ? db.v(query.object["?"]) : query.object;
        }
        return newQuery;
      });

      return new Promise((resolve, reject) => {
        db.search(convertedPattern, {}, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    },
    [db]
  );

  const serializeGraph = useCallback(
    async (subject: string): Promise<Triple[]> => {
      if (!db) {
        throw new Error("Database not initialized");
      }
      const triples = await getTriples({ subject });
      let relatedTriples = [...triples];

      for (let triple of triples) {
        try {
          const subTriples = await getTriples({ subject: triple.object });
          relatedTriples.push(...subTriples);
        } catch (error) {
          throw error; // Or handle more gracefully depending on your needs
        }
      }

      return relatedTriples;
    },
    [db, getTriples]
  );

  return {
    putTriple,
    getTriples,
    searchTriples,
    serializeGraph,
  };
};

export default useLevelGraph;
export type { Triple, SearchQuery };

