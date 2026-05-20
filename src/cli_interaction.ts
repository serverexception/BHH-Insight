import readline from "readline";

type CompareChain = {
  label: string;
  chain: any;
  chunkSize: number;
};

const runCompare = async (compareChains: CompareChain[], question: string) => {
  console.log(`\n🔬 Vergleiche ${compareChains.length} Chunk-Konfigurationen für: "${question}"\n`);

  for (const { label, chain, chunkSize } of compareChains) {
    console.log(`${"=".repeat(60)}`);
    console.log(`📦 Chunk-Größe: ${label}`);
    console.log(`${"=".repeat(60)}`);

    const response = await chain.invoke({ input: question });

    const sourceDocs: any[] = response.context ?? [];
    console.log(`\n📄 Abgerufene Snippets (${sourceDocs.length} Chunks, je max. ${chunkSize} Zeichen):`);
    sourceDocs.forEach((doc, i) => {
      const preview = doc.pageContent.replace(/\s+/g, " ").trim().slice(0, 200);
      const charCount = doc.pageContent.length;
      console.log(`  [${i + 1}] (${charCount} Zeichen) "${preview}${charCount > 200 ? "…" : ""}"`);
    });

    console.log(`\n🤖 Antwort:`);
    console.log(`  ${response.answer.replace(/\n/g, "\n  ")}`);
    console.log();
  }

  console.log(`${"=".repeat(60)}\n`);
};

const onUserResponse = async (
  rl: readline.Interface,
  ragChain: any,
  compareChains: CompareChain[],
  question: string
) => {
  if (question.toLowerCase() === "exit" || question.toLowerCase() === "quit") {
    console.log("👋 Bis bald!");
    rl.close();
    return;
  }

  if (question.startsWith("/compare ")) {
    const actualQuestion = question.slice("/compare ".length).trim();
    if (!actualQuestion) {
      console.log("❌ Bitte eine Frage nach '/compare ' angeben.");
    } else {
      try {
        await runCompare(compareChains, actualQuestion);
      } catch (error) {
        console.error("❌ Fehler beim Vergleich:", error);
      }
    }
  } else {
    console.log("\n🤖 Denke nach...");
    try {
      const response = await ragChain.invoke({ input: question });
      console.log("\n================ ANTWORT ================");
      console.log(response.answer);
      console.log("=========================================\n");
    } catch (error) {
      console.error("❌ Fehler:", error);
    }
  }

  sendReadyMessageToUser(rl, ragChain, compareChains);
};

export const sendReadyMessageToUser = (
  rl: readline.Interface,
  ragChain: any,
  compareChains: CompareChain[]
) => {
  rl.question(
    "🧑‍🎓 Frage (oder '/compare <frage>' zum Vergleich, 'exit' zum Beenden): ",
    onUserResponse.bind(null, rl, ragChain, compareChains)
  );
};
