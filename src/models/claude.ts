import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

export const COMPANY = 'Anthropic'
export const MODEL = "claude-haiku-4-5"

export const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
});

export const llm = new ChatAnthropic({
    model: MODEL,
    temperature: 0,
});