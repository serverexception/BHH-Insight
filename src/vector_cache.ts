import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import type { Embeddings } from "@langchain/core/embeddings";
import crypto from "crypto";
import fs from "fs";
import { Document } from "langchain";
import path from "path";

const CACHE_DIR = ".vector-cache";

type CacheEntry = {
  key: string;
  items: { content: string; embedding: number[]; metadata: Record<string, unknown> }[];
};

function cacheKey(files: string[], chunkSize: number, chunkOverlap: number): string {
  const fingerprint = files
    .sort()
    .map(f => {
      const fullPath = path.join("./data", f);
      return `${f}:${fs.statSync(fullPath).mtimeMs}`;
    })
    .join("|") + `|chunk:${chunkSize}:${chunkOverlap}`;
  return crypto.createHash("md5").update(fingerprint).digest("hex");
}

function cachePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

export async function loadOrBuildVectorStore(
  files: string[],
  splitDocs: Document<Record<string, unknown>>[],
  embeddings: Embeddings,
  chunkSize: number,
  chunkOverlap: number,
): Promise<MemoryVectorStore> {
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const key = cacheKey(files, chunkSize, chunkOverlap);
  const file = cachePath(key);

  if (fs.existsSync(file)) {
    console.log(`    💾 Cache-Treffer (${path.basename(file)})`);
    const cache: CacheEntry = JSON.parse(fs.readFileSync(file, "utf-8"));
    const store = new MemoryVectorStore(embeddings);
    await store.addVectors(
      cache.items.map(i => i.embedding),
      cache.items.map(i => new Document({ pageContent: i.content, metadata: i.metadata })),
    );
    return store;
  }

  const store = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);

  const raw = store as unknown as { memoryVectors: CacheEntry["items"] };
  const cache: CacheEntry = { key, items: raw.memoryVectors };
  fs.writeFileSync(file, JSON.stringify(cache));

  return store;
}
