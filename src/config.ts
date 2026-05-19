export const RAG_CONFIG = {
  chunkSize: 1000,
  chunkOverlap: 200,
  retrievalK: 4,
  cacheDir: ".vector-cache",
} as const;
