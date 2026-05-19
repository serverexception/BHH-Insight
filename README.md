# BHH-Insight
Ein RAG-basiertes Assistenzsystem zur intelligenten Erschließung von Hochschuldokumenten der BHH.

---

## Projektstruktur
```
root/
├── data/                        # PDF-Dokumente (nicht versioniert)
├── src/
│   ├── index.ts                 # Einstiegspunkt, orchestriert alles
│   ├── read_pdfs.ts             # PDF-Laden mit optionalem Datei-Filter
│   ├── cli_interaction.ts       # Chat-Loop (UI-agnostisch via UIAdapter)
│   ├── setup.ts                 # Setup-Prompts (Family, Scope) via UIAdapter
│   ├── scoping.ts               # Scope-Typen + filterFiles()-Logik
│   ├── ui/
│   │   ├── adapter.ts           # UIAdapter-Interface
│   │   └── cli_adapter.ts       # CLI-Implementierung (readline)
│   └── models/
│       ├── openAi.ts            # OpenAI (gpt-4o-mini + text-embedding-3-small)
│       ├── claude.ts            # Anthropic Claude (claude-sonnet-4-6)
│       └── gemini.ts            # Google Gemini (gemini-2.5-flash)
├── .env.example
└── README.md
```

---

## Start

```ps
npm run start
# oder
pnpm start
```

Beim Start werden drei Setup-Fragen gestellt:

1. **Modellanbieter** — OpenAI / Anthropic Claude / Google Gemini
2. **Bereich** — BHH-weit oder Studiengang (aktuell: Informatik)
3. **Jahrgang** — 2022 / 2023 / 2024 / 2025 (nur bei Studiengang)

Danach werden nur die relevanten PDFs geladen und indiziert.

---

## API-Keys

Kopiere `.env.example` zu `.env` und trage deine Keys ein.
Nicht benötigte Keys können leer bleiben — einfach einen anderen Anbieter wählen.

```
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...
```

---

## Scoping (Dokumente)

Die Dokumente in `data/` sind keinem Unterordner zugeordnet — die Zuordnung erfolgt
per Regex in `src/scoping.ts`.

| Scope | Enthält |
|---|---|
| **BHH-weit** | Anträge, Satzungen, Handbücher, allgemeine Merkblätter |
| **Informatik + Jahrgang** | BHH-weit + StuPrO, Modulhandbuch, Studiengangspezifische Bestimmungen des gewählten Jahrgangs |

Neuen Studiengang hinzufügen: `Studiengang`-Typ in `scoping.ts` erweitern,
Patterns ergänzen, Label in `setup.ts` eintragen.

---

## UIAdapter

Setup und Chat-Loop sind transport-agnostisch — sie kommunizieren nur über das
`UIAdapter`-Interface (`src/ui/adapter.ts`):

```typescript
interface UIAdapter {
  askChoice(prompt: string, options: string[]): Promise<number>;
  askText(prompt: string): Promise<string>;
  display(message: string): void;
  close(): void;
}
```

Aktuell gibt es `CliAdapter` (readline). Eine GUI-Implementierung muss nur dieses
Interface erfüllen und kann in `src/index.ts` eingesteckt werden.

### Einfachste GUI-Option: Express + Browser

Ein lokaler Express-Server liefert eine HTML-Seite aus. `socket.io` (oder SSE)
überbrückt die async `ask*`-Aufrufe zwischen Server und Browser. Kein Build-Step nötig.

```
WebAdapter implements UIAdapter
    └─ kommuniziert über WebSocket mit dem Browser
```

---

## Modelle anpassen

Feines Tuning (anderes Modell, Temperatur, etc.) direkt in `src/models/*.ts`.
Die Familie wird zur Laufzeit per Setup-Prompt gewählt.
