export type Studiengang = 'informatik' | 'marketing';
export type Jahrgang = 2022 | 2023 | 2024 | 2025;

export type Scope = {
  studiengang: Studiengang;
  jahrgang: Jahrgang;
};

const BHH_WEIT_PATTERNS: RegExp[] = [
  /^Antrag/i,
  /BHH-EBooks/i,
  /BIZ/i,
  /Berufungsordnung/i,
  /Eduroam/i,
  /Eidesstattliche/i,
  /Flyer/i,
  /Grundordnung/i,
  /Infoblatt_Kooperation/i,
  /Merkblatt_Abgaben/i,
  /Merkblatt_Nachteilsausgleich/i,
  /Mitgliedschaft/i,
  /Prüfungsunfähigkeit/i,
  /Satzung der Beruflichen/i,
  /Studierendenhandbuch/i,
  /WLAN/i,
  /Wohnen/i,
  /251110_Merkblatt/i,
];

export function filterFiles(files: string[], scope: Scope): string[] {
  return files.filter(file => {
    if (BHH_WEIT_PATTERNS.some(p => p.test(file))) return true;

    const { studiengang, jahrgang } = scope;

    if (studiengang === 'informatik') {
      if (/Informatik_Merkblatt/i.test(file)) return true;
      if (new RegExp(`StuPrO.*${jahrgang}`, 'i').test(file)) return true;
      if (new RegExp(`Modulhandbuch.*${jahrgang}`, 'i').test(file)) return true;
      if (new RegExp(`Studiengangspezifische.*${jahrgang}`, 'i').test(file)) return true;
      if (new RegExp(`Bachelorarbeit.*${jahrgang}`, 'i').test(file)) return true;
      if (new RegExp(`Phasenplanung.*${jahrgang}`, 'i').test(file)) return true;
    }

    return false;
  });
}
