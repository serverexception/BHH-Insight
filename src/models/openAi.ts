import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";

export const COMPANY = 'OpenAI'
export const MODEL = "gpt-4o-mini"

export const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",

});

export const llm: ChatOpenAI = new ChatOpenAI({
    modelName: MODEL,
    temperature: 0,
});