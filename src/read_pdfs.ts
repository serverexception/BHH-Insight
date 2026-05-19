import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import "dotenv/config";
import fs from "fs";
import { Document } from "langchain";
import path from "path";

type DocumentReturns = {
    files: string[],
    rawDocs: Document<Record<string, any>>[]
}

export async function readDocuments(fileFilter?: (file: string) => boolean): Promise<DocumentReturns> {
    const dataDir = "./data";
    const rawDocs = [];

    if (!fs.existsSync(dataDir)) {
        console.error(`❌ Der Ordner '${dataDir}' existiert nicht. Bitte anlegen und PDFs hineinlegen!`);
        return { files: ["Error"], rawDocs: [] }
    }

    const allFiles = fs.readdirSync(dataDir).filter(file => file.endsWith(".pdf"));
    const files = fileFilter ? allFiles.filter(fileFilter) : allFiles;

    if (files.length === 0) {
        console.error(`❌ Keine PDFs im Ordner '${dataDir}' gefunden!`);
        return { files: ["Error"], rawDocs: [] }
    }

    for (const file of files) {
        const filePath = path.join(dataDir, file);
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();
        rawDocs.push(...docs);
    }

    return { files, rawDocs }
}