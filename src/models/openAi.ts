import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";

export const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
    
});

export const llm: ChatOpenAI = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
});