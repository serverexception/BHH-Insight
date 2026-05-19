import type { Runnable } from "@langchain/core/runnables";
import type { Document } from "@langchain/core/documents";
import path from "path";
import type { UIAdapter } from './ui/adapter';

type ChainInput = { input: string };
type ChainChunk = { answer?: string; context?: Document[] };

export async function startChatLoop(
  ui: UIAdapter,
  chain: Runnable<ChainInput, ChainChunk>,
): Promise<void> {
  while (true) {
    const question = await ui.askText("🧑‍🎓 Deine Frage an BHH-Insight (oder 'exit' zum Beenden): ");

    if (question.toLowerCase() === "exit" || question.toLowerCase() === "quit") {
      ui.display("👋 Bis bald!");
      ui.close();
      return;
    }

    ui.display("\n🤖 Denke nach...");

    try {
      const stream = await chain.stream({ input: question });

      let sources: string[] = [];
      let streaming = false;

      for await (const chunk of stream) {
        if (chunk.context) {
          sources = [...new Set(
            (chunk.context as Document[]).map(d => path.basename(d.metadata["source"] as string ?? ""))
          )].filter(Boolean);
        }
        if (chunk.answer) {
          if (!streaming) {
            ui.startAnswer();
            streaming = true;
          }
          ui.writeAnswerToken(chunk.answer);
        }
      }

      if (streaming) {
        ui.endAnswer(sources);
      }
    } catch (error) {
      console.error("❌ Fehler:", error);
    }
  }
}
