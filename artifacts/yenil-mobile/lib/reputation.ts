export type ReputationLevel = "yeni" | "ynamdyr" | "abrayli" | "altyn" | "elita";

export interface LevelInfo {
  id: ReputationLevel;
  label: string;
  labelTm: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  minScore: number;
  maxScore: number;
  description: string;
}

export const LEVELS: LevelInfo[] = [
  {
    id: "yeni",
    label: "Täze",
    labelTm: "Täze Agza",
    icon: "leaf-outline",
    color: "#64748b",
    bg: "rgba(100,116,139,0.12)",
    border: "rgba(100,116,139,0.3)",
    minScore: 0,
    maxScore: 19,
    description: "Ýaňy goşulan agza. Taryhyňyz entek ýeterlik däl.",
  },
  {
    id: "ynamdyr",
    label: "Ynamdyr",
    labelTm: "Ynamly Agza",
    icon: "shield-outline",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.12)",
    border: "rgba(37,99,235,0.3)",
    minScore: 20,
    maxScore: 44,
    description: "Ynamly agza. Siz birnäçe üstünlikli amallar geçirdiňiz.",
  },
  {
    id: "abrayli",
    label: "Abraýly",
    labelTm: "Abraýly Agza",
    icon: "shield-checkmark-outline",
    color: "#059669",
    bg: "rgba(5,150,105,0.12)",
    border: "rgba(5,150,105,0.3)",
    minScore: 45,
    maxScore: 69,
    description: "Abraýly agza. Yzygiderli oňyn taryhyňyz bar.",
  },
  {
    id: "altyn",
    label: "Altyn",
    labelTm: "Altyn Agza",
    icon: "star-outline",
    color: "#d97706",
    bg: "rgba(217,119,6,0.12)",
    border: "rgba(217,119,6,0.3)",
    minScore: 70,
    maxScore: 84,
    description: "Altyn derejedäki agza. Ajaýyp abraýyňyz bar.",
  },
  {
    id: "elita",
    label: "Elita",
    labelTm: "Elita Agza",
    icon: "trophy-outline",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.12)",
    border: "rgba(124,58,237,0.3)",
    minScore: 85,
    maxScore: 100,
    description: "Iň ýokary dereje. Ýeňil platformasynyň iň abraýly agzasy.",
  },
];

export function getLevel(score: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].minScore) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(score: number): LevelInfo | null {
  const current = getLevel(score);
  const idx = LEVELS.findIndex(l => l.id === current.id);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getProgressPercent(score: number): number {
  const current = getLevel(score);
  const next = getNextLevel(score);
  if (!next) return 100;
  const range = next.minScore - current.minScore;
  const progress = score - current.minScore;
  return Math.min(100, Math.round((progress / range) * 100));
}

export function getImprovementTips(score: number): Array<{ icon: string; text: string }> {
  const all = [
    { icon: "checkmark-circle-outline", text: "Sargyçlary wagtynda tamamlaň (+5 BP her sargyt üçin)" },
    { icon: "chatbubble-outline", text: "Soraglara jogap beriň we kömek ediň (+3 her jogap)" },
    { icon: "handshake-outline", text: "Başga agzalar bilen dogrylyk bilen işläň" },
    { icon: "document-text-outline", text: "Doly we dogry maglumat beriň" },
    { icon: "time-outline", text: "Wagt möhletlerini berjaý ediň" },
    { icon: "ban-outline", text: "Jedelli ýagdaýlardan gaça duruň (-15 her jedel)" },
  ];
  if (score < 20) return [all[0], all[2], all[3]];
  if (score < 45) return [all[0], all[1], all[4]];
  if (score < 70) return [all[1], all[4], all[5]];
  return [all[2], all[4], all[5]];
}

export function getWhyDescription(score: number): string {
  if (score < 20)
    return "Siziň hasabyňyz entek täze. Platformamyzda üstünlikli amallar geçireniňizde abraýyňyz ýokarlanar.";
  if (score < 45)
    return "Siziň birnäçe üstünlikli amalyňyz bar. Yzygiderli işjeňlik bilen abraýyňyz hasam ýokarlanar.";
  if (score < 70)
    return "Siz ynamly agza hökmünde tanalýarsyňyz. Gowy işleriňiz başgalara görelde bolýar.";
  if (score < 85)
    return "Siziň abraýyňyz gaty ýokary. Platformamyzyň iň işjeň we ygtybarly agzalarynyň birisiniz.";
  return "Siz platformamyzyň iň abraýly agzasy! Başgalara görelde bolýarsyňyz.";
}

export function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Az öň";
  if (minutes < 60) return `${minutes} min öň`;
  if (hours < 24) return `${hours} sag öň`;
  if (days < 30) return `${days} gün öň`;
  return new Date(isoString).toLocaleDateString();
}
