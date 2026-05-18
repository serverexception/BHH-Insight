# BHH-Insight
Ein RAG-basiertes Assistenzsystem zur intelligenten Erschließung von Hochschuldokumenten.

# Projektstruktur
```yaml
root:
    data/            # PDFs here      
    src/
        index.ts     # main file
        read_pdfs.ts
        cli_interaction.ts
        models/     # Model Implementation per file
            claude.ts
            gemini.ts
            openAI.ts
```

In `src/` ist der Projektcode.
`index.ts` ist das Main-Script. 

In `src/models/` sind `openAi.ts`, `claude.ts` und `gemini.ts` als unterstützte Modelle.
Die Familie (OpenAI/Claude/Gemini) wählt man durch Anpassung der `CONFIG` in `src/index.ts`, feinere Anpassungen (Model) müssen in den `src/models/*`-files vorgenommen werden.

# API-Keys
Kopiere .env.example zu .env, und trage deine API-Keys ein.
Wenn für einen oder mehrere Services kein API-Key verwendbar ist, kann einfach ein anderes Model genutzt werden.

# Starten
Im Project root:
```ps
npm run start
```
oder 
```ps
pnpm start
```