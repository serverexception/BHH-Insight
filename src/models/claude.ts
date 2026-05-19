import { ChatAnthropic } from "@langchain/anthropic";
import type { Embeddings } from "@langchain/core/embeddings";

export const COMPANY = 'Anthropic'
export const MODEL = "claude-sonnet-4-6"

// Anthropic bietet keine eigene Embedding-API an.
// Es wird automatisch der erste verfügbare Key genutzt:
//   OPENAI_API_KEY  → OpenAI text-embedding-3-small
//   GOOGLE_API_KEY  → Google text-embedding-004
// Beide Keys müssen nicht gleichzeitig vorhanden sein.
function createEmbeddings(): Embeddings {
  if (process.env.OPENAI_API_KEY) {
    const { OpenAIEmbeddings } = require("@langchain/openai");
    return new OpenAIEmbeddings({ modelName: "text-embedding-3-small" });
  }
  if (process.env.GOOGLE_API_KEY) {
    const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
    return new GoogleGenerativeAIEmbeddings({ model: "text-embedding-004" });
  }
  throw new Error(
    "Claude benötigt OPENAI_API_KEY oder GOOGLE_API_KEY für Embeddings.\n" +
    "Bitte einen der Keys in der .env Datei eintragen."
  );
}

export const embeddings = createEmbeddings();

export const llm = new ChatAnthropic({
  model: MODEL,
  temperature: 0,
});
