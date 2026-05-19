import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import "dotenv/config";
import fs from "fs";
import { Document } from "langchain";
import path from "path";
import type { Scope } from "./scoping";

type DocumentReturns = {
  files: string[];
  rawDocs: Document<Record<string, unknown>>[];
};

export async function readDocuments(scope: Scope): Promise<DocumentReturns> {
  const dirs = [
    path.join("data", "bhh-weit"),
    path.join("data", scope.studiengang, "allgemein"),
    path.join("data", scope.studiengang, String(scope.jahrgang)),
  ];

  const files: string[] = [];
  const rawDocs: Document<Record<string, unknown>>[] = [];

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
    throw new Error(
      `Keine PDFs gefunden für Scope: ${scope.studiengang}/${scope.jahrgang}. ` +
      `Bitte PDFs in data/${scope.studiengang}/ ablegen.`
    );
  }

  return { files, rawDocs };
}
