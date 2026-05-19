export interface UIAdapter {
  askChoice(prompt: string, options: string[]): Promise<number>;
  askText(prompt: string): Promise<string>;
  display(message: string): void;
  displayAnswer(answer: string): void;
  close(): void;
}
