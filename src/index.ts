import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { createRetrievalChain } from "@langchain/classic/chains/retrieval";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "dotenv/config";
import { startChatLoop } from './cli_interaction';
import { readDocuments } from "./read_pdfs";
import type { Scope } from "./scoping";
import { filterFiles } from "./scoping";
import {
  FAMILIES,
  FAMILY_LABELS,
  JAHRGAENGE,
  STUDIENGAENGE,
  STUDIENGANG_LABELS,
  type ModelFamily,
  runSetup,
} from "./setup";
import { CliAdapter } from './ui/cli_adapter';
import { WebAdapter } from './ui/web_adapter';

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

  const CONFIG = { ...family, systemPrompt: SYSTEM_PROMPT };

  ui.display("Lese Dokumente ein...");

  const { files, rawDocs } = await readDocuments(file => filterFiles([file], scope).length > 0);

  ui.display(`✅ ${files.length} PDF(s) geladen. Text wird verarbeitet...`);

  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const splitDocs = await textSplitter.splitDocuments(rawDocs);

  const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, CONFIG.embeddings);
  const retriever = vectorStore.asRetriever({ k: 4 });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", CONFIG.systemPrompt],
    ["human", "{input}"],
  ]);

  const questionAnswerChain = await createStuffDocumentsChain({ llm: CONFIG.llm, prompt });
  const ragChain = await createRetrievalChain({ retriever, combineDocsChain: questionAnswerChain });

  ui.display("✅ Vektordatenbank aufgebaut. BHH-Insight ist bereit!\n");

  await startChatLoop(ui, ragChain);
}

main().catch(console.error);
