import readline from "readline";
import type { UIAdapter } from "./adapter";

export class CliAdapter implements UIAdapter {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private ask(question: string): Promise<string> {
    return new Promise(resolve => this.rl.question(question, resolve));
  }

  async askChoice(prompt: string, options: string[]): Promise<number> {
    this.display(prompt);
    options.forEach((opt, i) => this.display(`  [${i + 1}] ${opt}`));

    while (true) {
      const answer = (await this.ask(`Deine Wahl (1-${options.length}): `)).trim();
      const idx = parseInt(answer, 10) - 1;
      if (idx >= 0 && idx < options.length) return idx;
      this.display(`❌ Ungültige Eingabe. Bitte 1–${options.length} eingeben.`);
    }
  }

  async askText(prompt: string): Promise<string> {
    return (await this.ask(prompt)).trim();
  }

  display(message: string): void {
    console.log(message);
  }

  startAnswer(): void {
    console.log("\n================ ANTWORT ================");
  }

  writeAnswerToken(token: string): void {
    process.stdout.write(token);
  }

  endAnswer(sources: string[]): void {
    console.log();
    if (sources.length > 0) {
      console.log(`\n📄 Quellen: ${sources.join(", ")}`);
    }
    console.log("=========================================\n");
  }

  close(): void {
    this.rl.close();
  }
}
