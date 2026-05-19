export interface UIAdapter {
  askChoice(prompt: string, options: string[]): Promise<number>;
  askText(prompt: string): Promise<string>;
  display(message: string): void;
  /** Called once before streaming starts. */
  startAnswer(): void;
  /** Called for each streaming token. */
  writeAnswerToken(token: string): void;
  /** Called once when streaming is done. Shows source filenames. */
  endAnswer(sources: string[]): void;
  close(): void;
}
