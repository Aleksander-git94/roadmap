import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppState, Initiative, InitiativeStatus, Pillar, Quarter } from "../lib/types";
import { QUARTERS, STATUSES } from "../lib/types";
import { sampleState } from "../lib/sample";
import { clampAllocation } from "../lib/validators";

const STORAGE_KEY = "roadmap-planner-2026";

const readState = (): AppState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return sampleState;
  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return sampleState;
  }
};

const now = () => new Date().toISOString();

export const useRoadmapStore = () => {
  const [state, setState] = useState<AppState>(readState);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      setToast("Kunne ikke lagre lokalt");
    }
  }, [state]);

  const updateState = useCallback((next: Partial<AppState>) => {
    setState((prev) => ({
      ...prev,
      ...next,
      meta: {
        ...prev.meta,
        ...(next.meta ?? {}),
        updatedAt: now(),
      },
    }));
  }, []);

  const updateInitiative = useCallback((id: string, next: Partial<Initiative>) => {
    setState((prev) => ({
      ...prev,
      initiatives: prev.initiatives.map((initiative) =>
        initiative.id === id
          ? {
              ...initiative,
              ...next,
              allocationPct:
                next.allocationPct !== undefined
                  ? clampAllocation(next.allocationPct)
                  : initiative.allocationPct,
              updatedAt: now(),
            }
          : initiative
      ),
      meta: {
        ...prev.meta,
        updatedAt: now(),
      },
    }));
  }, []);

  const addInitiative = useCallback((quarter: Quarter) => {
    setState((prev) => {
      if (prev.pillars.length === 0) return prev;
      const firstPillar = prev.pillars[0].id;
      const id = crypto.randomUUID();
      const newInitiative: Initiative = {
        id,
        title: "Nytt initiativ",
        quarter,
        pillarId: firstPillar,
        status: "likely",
        owner: "",
        problem: "",
        outcome: "",
        hypothesis: "",
        scope: "",
        successMetrics: "",
        dependencies: "",
        risks: "",
        allocationPct: 0,
        tags: [],
        createdAt: now(),
        updatedAt: now(),
      };
      return {
        ...prev,
        initiatives: [...prev.initiatives, newInitiative],
        meta: {
          ...prev.meta,
          updatedAt: now(),
        },
      };
    });
  }, []);

  const duplicateInitiative = useCallback((id: string) => {
    setState((prev) => {
      const original = prev.initiatives.find((initiative) => initiative.id === id);
      if (!original) return prev;
      const duplicate: Initiative = {
        ...original,
        id: crypto.randomUUID(),
        title: `${original.title} (copy)` ,
        createdAt: now(),
        updatedAt: now(),
      };
      return {
        ...prev,
        initiatives: [...prev.initiatives, duplicate],
        meta: {
          ...prev.meta,
          updatedAt: now(),
        },
      };
    });
  }, []);

  const removeInitiative = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      initiatives: prev.initiatives.filter((initiative) => initiative.id !== id),
      meta: {
        ...prev.meta,
        updatedAt: now(),
      },
    }));
  }, []);

  const addPillar = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pillars: [
        ...prev.pillars,
        {
          id: crypto.randomUUID(),
          name: "Ny pilar",
          description: "",
          icon: "layers",
        },
      ],
      meta: {
        ...prev.meta,
        updatedAt: now(),
      },
    }));
  }, []);

  const updatePillar = useCallback((id: string, next: Partial<Pillar>) => {
    setState((prev) => ({
      ...prev,
      pillars: prev.pillars.map((pillar) =>
        pillar.id === id ? { ...pillar, ...next } : pillar
      ),
      meta: {
        ...prev.meta,
        updatedAt: now(),
      },
    }));
  }, []);

  const removePillar = useCallback((id: string, mode: "delete" | "move", targetId?: string) => {
    setState((prev) => {
      const nextInitiatives = prev.initiatives.filter((initiative) => {
        if (initiative.pillarId !== id) return true;
        if (mode === "delete") return false;
        return true;
      });
      const reassigned =
        mode === "move" && targetId
          ? nextInitiatives.map((initiative) =>
              initiative.pillarId === id ? { ...initiative, pillarId: targetId } : initiative
            )
          : nextInitiatives;
      return {
        ...prev,
        pillars: prev.pillars.filter((pillar) => pillar.id !== id),
        initiatives: reassigned,
        meta: {
          ...prev.meta,
          updatedAt: now(),
        },
      };
    });
  }, []);

  const addMetric = useCallback(() => {
    setState((prev) => ({
      ...prev,
      metrics: [
        ...prev.metrics,
        {
          id: crypto.randomUUID(),
          name: "Ny KPI",
          definition: "",
          target: "",
          owner: "",
        },
      ],
      meta: {
        ...prev.meta,
        updatedAt: now(),
      },
    }));
  }, []);

  const updateMetric = useCallback((id: string, next: Partial<AppState["metrics"][number]>) => {
    setState((prev) => ({
      ...prev,
      metrics: prev.metrics.map((metric) => (metric.id === id ? { ...metric, ...next } : metric)),
      meta: {
        ...prev.meta,
        updatedAt: now(),
      },
    }));
  }, []);

  const removeMetric = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((metric) => metric.id !== id),
      meta: {
        ...prev.meta,
        updatedAt: now(),
      },
    }));
  }, []);

  const reset = useCallback(() => {
    setState(sampleState);
    setToast("Demo-state gjenopprettet");
  }, []);

  const filteredInitiatives = useMemo(() => {
    const search = state.filters.search.toLowerCase();
    return state.initiatives.filter((initiative) => {
      if (state.filters.quarters.length && !state.filters.quarters.includes(initiative.quarter)) {
        return false;
      }
      if (state.filters.statuses.length && !state.filters.statuses.includes(initiative.status)) {
        return false;
      }
      if (state.filters.pillars.length && !state.filters.pillars.includes(initiative.pillarId)) {
        return false;
      }
      if (search) {
        const haystack = [
          initiative.title,
          initiative.problem,
          initiative.outcome,
          initiative.owner,
          initiative.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [state.initiatives, state.filters]);

  const allocationByQuarter = useMemo(() => {
    return QUARTERS.reduce((acc, quarter) => {
      acc[quarter] = state.initiatives
        .filter((initiative) => initiative.quarter === quarter)
        .reduce((sum, initiative) => sum + initiative.allocationPct, 0);
      return acc;
    }, {} as Record<Quarter, number>);
  }, [state.initiatives]);

  const statusMix = useMemo(() => {
    const totals = STATUSES.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<InitiativeStatus, number>);
    state.initiatives.forEach((initiative) => {
      totals[initiative.status] += 1;
    });
    return totals;
  }, [state.initiatives]);

  return {
    state,
    toast,
    setToast,
    updateState,
    updateInitiative,
    addInitiative,
    duplicateInitiative,
    removeInitiative,
    addPillar,
    updatePillar,
    removePillar,
    addMetric,
    updateMetric,
    removeMetric,
    reset,
    filteredInitiatives,
    allocationByQuarter,
    statusMix,
  };
};
