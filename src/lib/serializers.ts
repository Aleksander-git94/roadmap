import type { AppState, Initiative, Pillar } from "./types";
import { sampleState } from "./sample";
import { QUARTERS } from "./types";

const hasMinimumShape = (data: Partial<AppState>) => {
  return Array.isArray(data.pillars) && Array.isArray(data.initiatives);
};

const ensureUnassignedPillar = (pillars: Pillar[]) => {
  const existing = pillars.find((pillar) => pillar.id === "unassigned");
  if (existing) return pillars;
  return [
    ...pillars,
    {
      id: "unassigned",
      name: "Unassigned",
      icon: "layers",
    },
  ];
};

const normalizeInitiatives = (initiatives: Initiative[], pillars: Pillar[]) => {
  const pillarIds = new Set(pillars.map((pillar) => pillar.id));
  return initiatives.map((initiative) => {
    if (!pillarIds.has(initiative.pillarId)) {
      return { ...initiative, pillarId: "unassigned" };
    }
    return initiative;
  });
};

export const serializeState = (state: AppState) => {
  return JSON.stringify(state, null, 2);
};

export const deserializeState = (raw: string): AppState => {
  const parsed = JSON.parse(raw) as Partial<AppState>;
  if (!hasMinimumShape(parsed)) {
    throw new Error("Invalid roadmap file");
  }

  const pillars = ensureUnassignedPillar(parsed.pillars ?? []);
  const initiatives = normalizeInitiatives(parsed.initiatives ?? [], pillars);

  const quarterThemes = parsed.quarterThemes ?? sampleState.quarterThemes;
  QUARTERS.forEach((quarter) => {
    if (!quarterThemes[quarter]) {
      quarterThemes[quarter] = sampleState.quarterThemes[quarter];
    }
  });

  return {
    ...sampleState,
    ...parsed,
    pillars,
    initiatives,
    quarterThemes,
  } as AppState;
};
