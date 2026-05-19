export const STUDIENGANG_CONFIGS = [
  { id: 'informatik' as const, label: 'Informatik', code: 'i' },
  { id: 'marketing'  as const, label: 'Marketing',  code: 'm' },
] as const;

export type StudiengangEntry = (typeof STUDIENGANG_CONFIGS)[number];
export type Studiengang = StudiengangEntry['id'];

export type Jahrgang = 2022 | 2023 | 2024 | 2025;

export type Scope = {
  studiengang: Studiengang;
  jahrgang: Jahrgang;
};
