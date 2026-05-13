import "dotenv/config";
import fs from "fs";
import path from "path";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createRetrievalChain } from "@langchain/classic/chains/retrieval";
import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import readline from "readline";

async function main() {
  console.log("📚 Starte BHH-Insight: Lese Dokumente ein...");

  const dataDir = "./data";
  const rawDocs = [];

  if (!fs.existsSync(dataDir)) {
      console.error(`❌ Der Ordner '${dataDir}' existiert nicht. Bitte anlegen und PDFs hineinlegen!`);
      return;
  }

  const files = fs.readdirSync(dataDir).filter(file => file.endsWith(".pdf"));

  if (files.length === 0) {
    console.error(`❌ Keine PDFs im Ordner '${dataDir}' gefunden!`);
    return;
  }

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    rawDocs.push(...docs);
  }

  console.log(`✅ ${files.length} PDF(s) geladen. Text wird verarbeitet...`);

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splitDocs = await textSplitter.splitDocuments(rawDocs);

  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
  });
  const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
  const retriever = vectorStore.asRetriever({ k: 4 });

  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
  });

  const systemPrompt = `
    Du bist 'BHH-Insight', ein hilfreicher KI-Assistent für Studierende der Beruflichen Hochschule Hamburg (BHH).
    Nutze AUSSCHLIESSLICH den folgenden Kontext aus den Uni-Dokumenten, um die Frage zu beantworten.
    Wenn die Antwort nicht im Kontext steht, sage höflich, dass du das basierend auf den vorliegenden Dokumenten nicht weißt. Erfinde keine Informationen.
    
    Kontext:
    {context}
  `;

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    ["human", "{input}"],
  ]);

  const questionAnswerChain = await createStuffDocumentsChain({ llm, prompt });
  const ragChain = await createRetrievalChain({
    retriever,
    combineDocsChain: questionAnswerChain,
  });

  console.log("✅ Vektordatenbank aufgebaut. BHH-Insight ist bereit!\n");
  console.log("--------------------------------------------------");
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = () => {
    rl.question("🧑‍🎓 Deine Frage an BHH-Insight (oder 'exit' zum Beenden): ", async (question) => {
      if (question.toLowerCase() === "exit" || question.toLowerCase() === "quit") {
        console.log("👋 Bis bald!");
        rl.close();
        return;
      }

      console.log("\n🤖 Denke nach...");
      
      try {
        const response = await ragChain.invoke({ input: question });
        
        console.log("\n================ ANTWORT ================");
        console.log(response.answer);
        console.log("=========================================\n");
        
      } catch (error) {
        console.error("❌ Fehler:", error);
      }

      askQuestion(); 
    });
  };

  askQuestion();
}

main().catch(console.error);