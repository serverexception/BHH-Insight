# BHH-Insight
Ein RAG-basiertes Assistenzsystem zur intelligenten Erschließung von Hochschuldokumenten der BHH.

---

## Projektstruktur
```
root/
├── data/
│   ├── bhh-weit/              # Immer geladen (Anträge, Satzungen, Handbücher …)
│   ├── informatik/
│   │   ├── allgemein/         # Jahrgangsübergreifende Informatik-Dokumente
│   │   ├── 2022/
│   │   ├── 2023/
│   │   ├── 2024/
│   │   └── 2025/
│   └── <studiengang>/         # Neuer Studiengang: gleiche Struktur anlegen
├── src/
│   ├── index.ts               # Einstiegspunkt, orchestriert alles
│   ├── read_pdfs.ts           # PDF-Laden anhand der Ordnerstruktur
│   ├── cli_interaction.ts     # Chat-Loop (UI-agnostisch via UIAdapter)
│   ├── setup.ts               # Setup-Logik + exportierte Konstanten
│   ├── scoping.ts             # Scope-Typen (Studiengang, Jahrgang)
│   ├── ui/
│   │   ├── adapter.ts         # UIAdapter-Interface
│   │   ├── cli_adapter.ts     # CLI-Implementierung (readline)
│   │   └── web_adapter.ts     # Web-Implementierung (Express + Socket.io)
│   │       └── public/
│   │           └── index.html # Browser-UI
│   └── models/
│       ├── openAi.ts          # OpenAI (gpt-4o-mini + text-embedding-3-small)
│       ├── claude.ts          # Anthropic Claude (claude-sonnet-4-6)
│       └── gemini.ts          # Google Gemini (gemini-2.5-flash)
├── .env.example
└── README.md
```

---

## Start

**CLI:**
```ps
pnpm start
```

Beim Start wird eine Zeile angezeigt mit den verfügbaren Codes und Defaults.
Einfach Enter drücken, um die Defaults zu übernehmen, oder Codes space-separated eingeben:

```
  Anbieter:    1=OpenAI · 2=Claude · 3=Gemini
  Studiengang: i22 i23 i24 i25 (Informatik) · m22 m23 m24 m25 (Marketing)
  Defaults:    1 i25

  > 2 i23       →  Claude · Informatik JG 2023
  > [Enter]     →  OpenAI · Informatik JG 2025
```

**Web-UI:**
```ps
pnpm start:web
```

Öffnet automatisch `http://localhost:3000`. Das Setup (Anbieter, Studiengang, Jahrgang)
erfolgt über ein Formular mit vorausgefüllten Defaults, danach Chat-Interface im Browser.

---

## API-Keys

Kopiere `.env.example` zu `.env` und trage deine Keys ein.

```
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...
```

### Welche Keys werden wirklich benötigt?

| Anbieter | LLM-Key | Embedding-Key |
|---|---|---|
| **OpenAI** | `OPENAI_API_KEY` | `OPENAI_API_KEY` (gleicher) |
| **Claude** | `ANTHROPIC_API_KEY` | `OPENAI_API_KEY` **oder** `GOOGLE_API_KEY` (einer reicht) |
| **Gemini** | `GOOGLE_API_KEY` | `GOOGLE_API_KEY` (gleicher) |

Da Anthropic keine eigene Embedding-API anbietet, erkennt BHH-Insight automatisch welcher Key vorhanden ist und wählt den passenden Embedding-Anbieter:
- `OPENAI_API_KEY` gesetzt → OpenAI `text-embedding-3-small`
- `GOOGLE_API_KEY` gesetzt → Google `text-embedding-004`
- Keiner gesetzt → Fehlermeldung beim Start

---

## Scoping (Dokumente)

Das Scoping erfolgt ausschließlich über die Ordnerstruktur in `data/`.
`read_pdfs.ts` lädt immer:

1. `data/bhh-weit/`: übergreifende BHH-Dokumente
2. `data/<studiengang>/allgemein/`: jahrgangsübergreifende Studiengangsdokumente
3. `data/<studiengang>/<jahrgang>/`: jahrgangsspezifische Dokumente

**Neuen Studiengang hinzufügen:**
1. Ordner `data/<studiengang>/allgemein/` und `data/<studiengang>/<jahrgang>/` anlegen, PDFs ablegen
2. Typ `Studiengang` in `src/scoping.ts` erweitern
3. Eintrag in `STUDIENGAENGE` + `STUDIENGANG_LABELS` in `src/setup.ts` ergänzen
4. CLI-Code (z.B. `m`) für den neuen Studiengang in `src/setup.ts` (`SG_CODE`) eintragen

---

## UIAdapter

Setup und Chat-Loop sind transport-agnostisch, da sie nur über das `UIAdapter`-Interface (`src/ui/adapter.ts`) kommunizieren:

```typescript
interface UIAdapter {
  askChoice(prompt: string, options: string[]): Promise<number>;
  askText(prompt: string): Promise<string>;
  display(message: string): void;
  displayAnswer(answer: string): void;
  close(): void;
}
```

| Implementierung | Beschreibung |
|---|---|
| `CliAdapter` | readline-basiert, für `pnpm start` |
| `WebAdapter` | Express + Socket.io, für `pnpm start:web`; hat zusätzlich `setupForm()` für das einseitige Browser-Formular |

Eine weitere UI-Implementierung (z.B. Electron, REST-API) muss nur `UIAdapter` erfüllen
und in `src/index.ts` eingesteckt werden.

---

## Modelle anpassen

Feines Tuning (anderes Modell, Temperatur, etc.) direkt in `src/models/*.ts`.
Die Familie wird zur Laufzeit per Setup gewählt.
