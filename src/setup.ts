import * as Claude from './models/claude';
import * as Gemini from './models/gemini';
import * as OpenAI from './models/openAi';
import { STUDIENGANG_CONFIGS, type Jahrgang, type Scope } from './scoping';
import type { UIAdapter } from './ui/adapter';

export type ModelFamily = typeof OpenAI | typeof Claude | typeof Gemini;

export type SetupResult = {
  family: ModelFamily;
  scope: Scope;
};

export const FAMILIES: ModelFamily[] = [OpenAI, Claude, Gemini];
export const FAMILY_LABELS = [
  "OpenAI (gpt-4o-mini)",
  "Anthropic Claude (claude-sonnet-4-6)",
  "Google Gemini (gemini-2.5-flash)",
];

export const STUDIENGAENGE = STUDIENGANG_CONFIGS.map(s => s.id);
export const STUDIENGANG_LABELS = STUDIENGANG_CONFIGS.map(s => s.label);

export const JAHRGAENGE: Jahrgang[] = [2022, 2023, 2024, 2025];

const DEFAULTS = { familyIdx: 0, studiengangIdx: 0, jahrgangIdx: 3 };

const SG_CODE = Object.fromEntries(STUDIENGANG_CONFIGS.map(s => [s.code, s.id]));

function parseInput(raw: string): typeof DEFAULTS {
  const result = { ...DEFAULTS };
  for (const token of raw.trim().toLowerCase().split(/\s+/).filter(Boolean)) {
    if (/^[1-3]$/.test(token)) {
      result.familyIdx = parseInt(token) - 1;
      continue;
    }
    const m = token.match(/^([a-z])(2[2-5])$/);
    if (m && SG_CODE[m[1]!]) {
      const sg = SG_CODE[m[1]!]!;
      const year = parseInt('20' + m[2]) as Jahrgang;
      result.studiengangIdx = STUDIENGAENGE.indexOf(sg);
      result.jahrgangIdx = JAHRGAENGE.indexOf(year);
    }
  }
  return result;
}

export async function runSetup(ui: UIAdapter): Promise<SetupResult> {
  const sgCodes = STUDIENGANG_CONFIGS.map(s => `${s.code}22–${s.code}25 (${s.label})`).join(' · ');
  ui.display("  Anbieter:    1=OpenAI · 2=Claude · 3=Gemini");
  ui.display(`  Studiengang: ${sgCodes}`);
  ui.display("  Defaults:    1 i25\n");

  const raw = await ui.askText("  > ");
  const { familyIdx, studiengangIdx, jahrgangIdx } = parseInput(raw);

  const family = FAMILIES[familyIdx]!;
  const studiengang = STUDIENGAENGE[studiengangIdx]!;
  const jahrgang = JAHRGAENGE[jahrgangIdx]!;
  const scope: Scope = { studiengang, jahrgang };

  const sgLabel = STUDIENGANG_LABELS[studiengangIdx]!;
  ui.display(`\n  ✅ ${family.COMPANY} · ${sgLabel} · JG ${jahrgang}\n`);

  return { family, scope };
}
