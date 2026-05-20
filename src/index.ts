import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { createRetrievalChain } from "@langchain/classic/chains/retrieval";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "langchain";
import "dotenv/config";
import readline from "readline";
import { sendReadyMessageToUser } from './cli_interaction';
import { readDocuments } from "./read_pdfs";
import { loadOrBuildVectorStore } from "./vector_cache";

import * as Claude from './models/claude'
import * as OpenAI from './models/openAi'
import * as Gemini from './models/gemini'


const CONFIG = {
  // Add model family here, needs {llm, embeddings}
  // ...OpenAI
  ...Claude
  // ...Gemini
  //
  , systemPrompt: `
    Du bist 'BHH-Insight', ein hilfreicher KI-Assistent für Studierende der Beruflichen Hochschule Hamburg (BHH).
    Nutze AUSSCHLIESSLICH den folgenden Kontext aus den Uni-Dokumenten, um die Frage zu beantworten.
    Wenn die Antwort nicht im Kontext steht, sage höflich, dass du das basierend auf den vorliegenden Dokumenten nicht weißt. Erfinde keine Informationen.

    Kontext:
    {context}
  `
}

export type ChunkConfig = {
  label: string;
  chunkSize: number;
  chunkOverlap: number;
};

export const CHUNK_CONFIGS: ChunkConfig[] = [
  { label: "Klein  (200 / 0)",    chunkSize: 200,  chunkOverlap: 0   },
  { label: "Mittel (1000 / 200)", chunkSize: 1000, chunkOverlap: 200 },
  { label: "Groß   (3000 / 400)", chunkSize: 3000, chunkOverlap: 400 },
];

async function buildRagChain(files: string[], rawDocs: Document[], chunkSize: number, chunkOverlap: number) {
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap });
  const splitDocs = await splitter.splitDocuments(rawDocs);

  const vectorStore = await loadOrBuildVectorStore(files, splitDocs, CONFIG.embeddings, chunkSize, chunkOverlap);
  const retriever = vectorStore.asRetriever({ k: 4 });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", CONFIG.systemPrompt],
    ["human", "{input}"],
  ]);

  const questionAnswerChain = await createStuffDocumentsChain({ llm: CONFIG.llm, prompt });
  return createRetrievalChain({ retriever, combineDocsChain: questionAnswerChain });
}

async function main() {
  console.log("📚 Starte BHH-Insight. ");
  console.log("Anbieter: ", CONFIG.COMPANY)
  console.log("Model: ", CONFIG.MODEL)

  console.log("Lese Dokumente ein...")

  const { files, rawDocs } = await readDocuments()

  console.log(`✅ ${files.length} PDF(s) geladen. Text wird verarbeitet...`);

  // Default chain (Mittel)
  const defaultChain = await buildRagChain(files, rawDocs, 1000, 200);

  // Alle Vergleichs-Chains aufbauen (sequentiell, um Embedding-API nicht zu überlasten)
  const compareChains = [];
  for (const cfg of CHUNK_CONFIGS) {
    console.log(`⚙️  Baue Chain: ${cfg.label}...`);
    const chain = await buildRagChain(files, rawDocs, cfg.chunkSize, cfg.chunkOverlap);
    compareChains.push({ label: cfg.label, chain, chunkSize: cfg.chunkSize });
  }

  console.log("✅ Vektordatenbank aufgebaut. BHH-Insight ist bereit!\n");
  console.log("--------------------------------------------------");
  console.log("💡 Tipp: Starte eine Frage mit '/compare ' um Chunk-Größen zu vergleichen.");
  console.log("--------------------------------------------------\n");

  const cliInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  sendReadyMessageToUser(cliInterface, defaultChain, compareChains);
}

main().catch(console.error);
