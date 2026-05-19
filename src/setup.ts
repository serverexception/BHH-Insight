import * as Claude from './models/claude';
import * as Gemini from './models/gemini';
import * as OpenAI from './models/openAi';
import type { Jahrgang, Scope, Studiengang } from './scoping';
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

export const STUDIENGAENGE: Studiengang[] = ['informatik', 'marketing'];
export const STUDIENGANG_LABELS = ["Informatik", "Marketing"];

export const JAHRGAENGE: Jahrgang[] = [2022, 2023, 2024, 2025];

export async function runSetup(ui: UIAdapter): Promise<SetupResult> {
  ui.display("=== BHH-Insight Setup ===\n");

  const familyIdx = await ui.askChoice("Wähle einen Modellanbieter:", FAMILY_LABELS);
  const family = FAMILIES[familyIdx]!;

  const studiengangIdx = await ui.askChoice("\nWähle deinen Studiengang:", STUDIENGANG_LABELS);
  const studiengang = STUDIENGAENGE[studiengangIdx] as Studiengang;

  const jahrgangIdx = await ui.askChoice("\nWähle deinen Jahrgang:", JAHRGAENGE.map(String));
  const jahrgang = JAHRGAENGE[jahrgangIdx]!;

  const scope: Scope = { studiengang, jahrgang };

  ui.display("\n✅ Konfiguration:");
  ui.display(`   Anbieter:   ${family.COMPANY} (${family.MODEL})`);
  ui.display(`   Studiengang: ${studiengang.charAt(0).toUpperCase() + studiengang.slice(1)}`);
  ui.display(`   Jahrgang:   ${jahrgang}`);
  ui.display("--------------------------------------------------\n");

  return { family, scope };
}
