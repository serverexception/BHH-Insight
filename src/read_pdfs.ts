import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import "dotenv/config";
import fs from "fs";
import { Document } from "langchain";
import path from "path";
import type { Scope } from "./scoping";

type DocumentReturns = {
  files: string[];
  rawDocs: Document<Record<string, any>>[];
};

export async function readDocuments(scope: Scope): Promise<DocumentReturns> {
  const dirs = [
    path.join("data", "bhh-weit"),
    path.join("data", scope.studiengang, "allgemein"),
    path.join("data", scope.studiengang, String(scope.jahrgang)),
  ];

  const files: string[] = [];
  const rawDocs: Document<Record<string, any>>[] = [];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const pdfs = fs.readdirSync(dir).filter(f => f.endsWith(".pdf"));
    for (const file of pdfs) {
      const filePath = path.join(dir, file);
      const docs = await new PDFLoader(filePath).load();
      rawDocs.push(...docs);
      files.push(filePath);
    }
  }

  if (files.length === 0) {
    console.error("❌ Keine PDFs gefunden für den gewählten Scope.");
    return { files: ["Error"], rawDocs: [] };
  }

  return { files, rawDocs };
}
