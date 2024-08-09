import useSWRImmutable from "swr/immutable";

interface ClientConfig {
  maxIndexCount: number;
  indexingBatchSize: number,
  maxChunkLength: number,
  minChunkLength: number,
}

interface ClientConfigReturn {
  config: ClientConfig | null;
  error: any;
  isLoading: boolean;
}

function useClientConfig(): ClientConfigReturn {
  const { data, isLoading, error } = useSWRImmutable<ClientConfig>(
    "/configs",
    async () => {
      const res = await fetch("/configs");
      return await res.json();
    }
  );

  return {
    config: data || null,
    error,
    isLoading,
  };
}

export { useClientConfig };
