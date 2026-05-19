import { exec } from "child_process";
import express from "express";
import { createServer } from "http";
import path from "path";
import { Server, type Socket } from "socket.io";
import type { UIAdapter } from "./adapter";

export type SetupFormConfig = {
  familyLabels: string[];
  studiengangLabels: string[];
  jahrgangLabels: string[];
  defaults: { familyIdx: number; studiengangIdx: number; jahrgangIdx: number };
};

export type SetupFormResult = {
  familyIdx: number;
  studiengangIdx: number;
  jahrgangIdx: number;
};

const SEPARATOR_RE = /^[-=\s]*$/;

export class WebAdapter implements UIAdapter {
  private app = express();
  private httpServer = createServer(this.app);
  private io = new Server(this.httpServer);
  private socket: Socket | null = null;
  private port: number;

  constructor(port = 3000) {
    this.port = port;
    this.app.use(express.static(path.join(__dirname, "public")));
  }

  async start(): Promise<void> {
    return new Promise(resolve => {
      this.httpServer.listen(this.port, () => {
        const url = `http://localhost:${this.port}`;
        console.log(`🌐 BHH-Insight Web UI: ${url}`);
        const cmd = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
        exec(`${cmd} ${url}`);
      });

      this.io.once("connection", socket => {
        this.socket = socket;
        resolve();
      });
    });
  }

  private waitForResponse(): Promise<string> {
    return new Promise(resolve => {
      this.socket!.once("response", (value: string) => resolve(value));
    });
  }

  async askChoice(prompt: string, options: string[]): Promise<number> {
    this.socket!.emit("ask_choice", { prompt, options });
    const value = await this.waitForResponse();
    return parseInt(value, 10);
  }

  async askText(prompt: string): Promise<string> {
    this.socket!.emit("ask_text", { prompt });
    return this.waitForResponse();
  }

  display(message: string): void {
    const trimmed = message.trim();
    if (!trimmed || SEPARATOR_RE.test(trimmed)) return;
    this.socket?.emit("display", { message: trimmed });
  }

  startAnswer(): void {
    this.socket?.emit("answer_start");
  }

  writeAnswerToken(token: string): void {
    this.socket?.emit("answer_token", { token });
  }

  endAnswer(sources: string[]): void {
    this.socket?.emit("answer_end", { sources });
  }

  async setupForm(config: SetupFormConfig): Promise<SetupFormResult> {
    this.socket!.emit("setup_form", config);
    return new Promise(resolve => {
      this.socket!.once("setup_submit", resolve);
    });
  }

  close(): void {
    this.socket?.emit("close");
  }
}
