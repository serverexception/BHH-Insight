import type { UIAdapter } from './ui/adapter';

export async function startChatLoop(ui: UIAdapter, ragChain: any): Promise<void> {
  while (true) {
    const question = await ui.askText("🧑‍🎓 Deine Frage an BHH-Insight (oder 'exit' zum Beenden): ");

    if (question.toLowerCase() === "exit" || question.toLowerCase() === "quit") {
      ui.display("👋 Bis bald!");
      ui.close();
      return;
    }

    ui.display("\n🤖 Denke nach...");

    try {
      const response = await ragChain.invoke({ input: question });
      ui.displayAnswer(response.answer);
    } catch (error) {
      console.error("❌ Fehler:", error);
    }
  }
}
