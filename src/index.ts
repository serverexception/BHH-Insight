import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { createRetrievalChain } from "@langchain/classic/chains/retrieval";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "dotenv/config";
import readline from "readline";

import { sendReadyMessageToUser as sendReadyMessageToUserAndKeepResponding } from './cli_interaction';
import * as OpenAI from './models/openAi';
import { readDocuments } from "./read_pdfs";


const CONFIG = {
  // Add model family here, needs {llm, embeddings}
  ...OpenAI,
  //
  systemPrompt: `
    Du bist 'BHH-Insight', ein hilfreicher KI-Assistent für Studierende der Beruflichen Hochschule Hamburg (BHH).
    Nutze AUSSCHLIESSLICH den folgenden Kontext aus den Uni-Dokumenten, um die Frage zu beantworten.
    Wenn die Antwort nicht im Kontext steht, sage höflich, dass du das basierend auf den vorliegenden Dokumenten nicht weißt. Erfinde keine Informationen.
    
    Kontext:
    {context}
  `
}

async function main() {
  console.log("📚 Starte BHH-Insight: Lese Dokumente ein...");

  const { files, rawDocs } = await readDocuments()

  console.log(`✅ ${files.length} PDF(s) geladen. Text wird verarbeitet...`);

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splitDocs = await textSplitter.splitDocuments(rawDocs);

  const embeddings = CONFIG.embeddings
  const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
  const retriever = vectorStore.asRetriever({ k: 4 });

  const llm = CONFIG.llm

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", CONFIG.systemPrompt],
    ["human", "{input}"],
  ]);

  const questionAnswerChain = await createStuffDocumentsChain({ llm, prompt });
  const ragChain = await createRetrievalChain({
    retriever,
    combineDocsChain: questionAnswerChain,
  });

  console.log("✅ Vektordatenbank aufgebaut. BHH-Insight ist bereit!\n");
  console.log("--------------------------------------------------");

  const cliInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  sendReadyMessageToUserAndKeepResponding(cliInterface, ragChain);
}

main().catch(console.error);