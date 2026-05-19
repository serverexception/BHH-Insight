import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const COMPANY = 'Google'
export const MODEL = "gemini-2.5-flash"

export const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
});

export const llm = new ChatGoogleGenerativeAI({
    model: MODEL,
    temperature: 0,
});
