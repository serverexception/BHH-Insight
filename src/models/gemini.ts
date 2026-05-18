import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const COMPANY = 'Google'
export const MODEL = "gemini-2.5-flash"

export const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
});

export const llm = new ChatGoogleGenerativeAI({
    model: MODEL,
    temperature: 0,
});
