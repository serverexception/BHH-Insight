import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { createRetrievalChain } from "@langchain/classic/chains/retrieval";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
// @ts-ignore — deprecated but LangGraph is out of scope for this project
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "dotenv/config";
import { startChatLoop } from './cli_interaction';
import { RAG_CONFIG } from "./config";
import { readDocuments } from "./read_pdfs";
import type { Scope } from "./scoping";
import {
  FAMILIES,
  FAMILY_LABELS,
  JAHRGAENGE,
  runSetup,
  STUDIENGAENGE,
  STUDIENGANG_LABELS,
  type ModelFamily,
} from "./setup";
import { CliAdapter } from './ui/cli_adapter';
import { WebAdapter } from './ui/web_adapter';
import { loadOrBuildVectorStore } from "./vector_cache";

const SYSTEM_PROMPT = `
  Du bist 'BHH-Insight', ein hilfreicher KI-Assistent für Studierende der Beruflichen Hochschule Hamburg (BHH).
  Nutze AUSSCHLIESSLICH den folgenden Kontext aus den Uni-Dokumenten, um die Frage zu beantworten.
  Wenn die Antwort nicht im Kontext steht, sage höflich, dass du das basierend auf den vorliegenden Dokumenten nicht weißt. Erfinde keine Informationen.

  Kontext:
  {context}
`;


async function main() {
  console.log("📚 BHH-Insight\n");

  const useWeb = process.argv.includes("--web");
  let ui: CliAdapter | WebAdapter;
  let family: ModelFamily;
  let scope: Scope;

  if (useWeb) {
    const webUi = new WebAdapter();
    await webUi.start();
    ui = webUi;
    const result = await webUi.setupForm({
      familyLabels: FAMILY_LABELS,
      studiengangLabels: STUDIENGANG_LABELS,
      jahrgangLabels: JAHRGAENGE.map(String),
      defaults: { familyIdx: 0, studiengangIdx: 0, jahrgangIdx: 3 },
    });
    family = FAMILIES[result.familyIdx]!;
    scope = { studiengang: STUDIENGAENGE[result.studiengangIdx]!, jahrgang: JAHRGAENGE[result.jahrgangIdx]! };
  } else {
    ui = new CliAdapter();
    ({ family, scope } = await runSetup(ui));
  }

  ui.display("Lese Dokumente ein...");
  const { files, rawDocs } = await readDocuments(scope);
  ui.display(`✅ ${files.length} PDF(s) geladen. Text wird verarbeitet...`);

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: RAG_CONFIG.chunkSize,
    chunkOverlap: RAG_CONFIG.chunkOverlap,
  });
  const splitDocs = await textSplitter.splitDocuments(rawDocs);

  ui.display("Baue Vektordatenbank auf (ggf. aus Cache)...");
  const vectorStore = await loadOrBuildVectorStore(files, splitDocs, family.embeddings);
  const retriever = vectorStore.asRetriever({ k: RAG_CONFIG.retrievalK });

  // Chat-Historie wird direkt im Antwort-Prompt mitgegeben.
  // Der Retriever nutzt die aktuelle Frage — der LLM sieht den vollen Verlauf.
  const answerPrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
  ]);

  const questionAnswerChain = await createStuffDocumentsChain({ llm: family.llm, prompt: answerPrompt });
  const ragChain = await createRetrievalChain({
    retriever,
    combineDocsChain: questionAnswerChain,
  });

  // Konversations-Gedächtnis — eine History pro Session
  const messageHistory = new InMemoryChatMessageHistory();
  const chainWithHistory = new RunnableWithMessageHistory({
    runnable: ragChain,
    getMessageHistory: () => messageHistory,
    inputMessagesKey: "input",
    historyMessagesKey: "chat_history",
    outputMessagesKey: "answer",
  });

  ui.display("✅ Bereit! BHH-Insight erinnert sich an den bisherigen Gesprächsverlauf.\n");

  await startChatLoop(ui, chainWithHistory);
}

main().catch(console.error);
