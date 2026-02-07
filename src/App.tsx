import { Download, FilePlus, FileUp, Printer, RefreshCw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useRoadmapStore } from "./hooks/useRoadmapStore";
import { QUARTERS, STATUSES } from "./lib/types";
import type { AppState, Initiative, InitiativeStatus, Pillar, Quarter } from "./lib/types";
import { clampAllocation, isValidUrl } from "./lib/validators";
import { deserializeState, serializeState } from "./lib/serializers";

const statusOrder: InitiativeStatus[] = ["committed", "likely", "bet"];

const formatPct = (value: number) => `${Math.round(value)}%`;

const StatusBadge = ({ status }: { status: InitiativeStatus }) => {
  const colors: Record<InitiativeStatus, string> = {
    committed: "bg-emerald-500/20 text-emerald-200",
    likely: "bg-sky-500/20 text-sky-200",
    bet: "bg-amber-500/20 text-amber-200",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
    {children}
  </section>
);

const PillarSelect = ({
  pillars,
  value,
  onChange,
}: {
  pillars: Pillar[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <select
    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
    value={value}
    onChange={(event) => onChange(event.target.value)}
  >
    {pillars.map((pillar) => (
      <option key={pillar.id} value={pillar.id}>
        {pillar.name}
      </option>
    ))}
  </select>
);

const InitiativeCard = ({
  initiative,
  pillars,
  onChange,
  onDelete,
  onDuplicate,
}: {
  initiative: Initiative;
  pillars: Pillar[];
  onChange: (next: Partial<Initiative>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) => {
  const [tagInput, setTagInput] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const addTag = () => {
    if (!tagInput.trim()) return;
    onChange({ tags: Array.from(new Set([...initiative.tags, tagInput.trim()])) });
    setTagInput("");
  };

  const addLink = () => {
    if (!linkLabel.trim() || !linkUrl.trim() || !isValidUrl(linkUrl)) return;
    onChange({
      links: [...(initiative.links ?? []), { label: linkLabel.trim(), url: linkUrl.trim() }],
    });
    setLinkLabel("");
    setLinkUrl("");
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={initiative.status} />
          <input
            className="w-64 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm font-semibold"
            value={initiative.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
          {!initiative.title.trim() && (
            <span className="text-xs text-amber-300">Tittel kan ikke være tom.</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
            onClick={onDuplicate}
          >
            Duplicate
          </button>
          <button
            className="rounded-md border border-rose-500/60 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
            onClick={onDelete}
          >
            Slett
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-xs text-slate-400">Quarter</label>
          <select
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={initiative.quarter}
            onChange={(event) => onChange({ quarter: event.target.value as Quarter })}
          >
            {QUARTERS.map((quarter) => (
              <option key={quarter} value={quarter}>
                {quarter}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">Status</label>
          <select
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={initiative.status}
            onChange={(event) => onChange({ status: event.target.value as InitiativeStatus })}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">Pilar</label>
          <PillarSelect
            pillars={pillars}
            value={initiative.pillarId}
            onChange={(pillarId) => onChange({ pillarId })}
          />
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-slate-400">Owner</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={initiative.owner}
            onChange={(event) => onChange({ owner: event.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Allocation %</label>
          <input
            type="number"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={initiative.allocationPct}
            onChange={(event) => onChange({ allocationPct: clampAllocation(Number(event.target.value)) })}
          />
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-slate-400">Problem</label>
          <textarea
            className="mt-1 h-20 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={initiative.problem}
            onChange={(event) => onChange({ problem: event.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Outcome</label>
          <textarea
            className="mt-1 h-20 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={initiative.outcome}
            onChange={(event) => onChange({ outcome: event.target.value })}
          />
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-slate-400">Hypothesis</label>
          <textarea
            className="mt-1 h-16 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={initiative.hypothesis}
            onChange={(event) => onChange({ hypothesis: event.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Scope</label>
          <textarea
            className="mt-1 h-16 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={initiative.scope}
            onChange={(event) => onChange({ scope: event.target.value })}
          />
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-slate-400">Success metrics</label>
          <textarea
            className="mt-1 h-16 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={initiative.successMetrics}
            onChange={(event) => onChange({ successMetrics: event.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Dependencies</label>
          <textarea
            className="mt-1 h-16 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={initiative.dependencies}
            onChange={(event) => onChange({ dependencies: event.target.value })}
          />
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-slate-400">Risks</label>
          <textarea
            className="mt-1 h-16 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={initiative.risks}
            onChange={(event) => onChange({ risks: event.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Tags</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {initiative.tags.map((tag) => (
              <button
                key={tag}
                className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-200"
                onClick={() => onChange({ tags: initiative.tags.filter((item) => item !== tag) })}
              >
                {tag} ✕
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
            />
            <button
              className="rounded-md border border-slate-700 px-3 py-1 text-xs"
              onClick={addTag}
            >
              Legg til
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <label className="text-xs text-slate-400">Links</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {(initiative.links ?? []).map((link) => (
            <a
              key={`${link.label}-${link.url}`}
              className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-sky-200"
              href={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            placeholder="Label"
            value={linkLabel}
            onChange={(event) => setLinkLabel(event.target.value)}
          />
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            placeholder="https://..."
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
          />
          <button
            className="rounded-md border border-slate-700 px-3 py-1 text-xs"
            onClick={addLink}
          >
            Legg til lenke
          </button>
        </div>
        {linkUrl && !isValidUrl(linkUrl) && (
          <p className="mt-1 text-xs text-amber-300">URL må være http/https.</p>
        )}
      </div>
    </div>
  );
};

const ExecView = ({
  initiatives,
  quarterThemes,
  pillars,
}: {
  initiatives: Initiative[];
  quarterThemes: Record<Quarter, { theme: string; goals?: string }>;
  pillars: Pillar[];
}) => {
  const pillarLookup = useMemo(() => {
    return new Map(pillars.map((pillar) => [pillar.id, pillar.name]));
  }, [pillars]);

  return (
    <div className="space-y-6">
      {QUARTERS.map((quarter) => {
        const items = initiatives
          .filter((initiative) => initiative.quarter === quarter)
          .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))
          .slice(0, 6);
        return (
          <div key={quarter} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold">{quarter}</h4>
                <p className="text-sm text-slate-300">{quarterThemes[quarter]?.theme}</p>
              </div>
              <p className="text-xs text-slate-400">Topp {items.length} initiativer</p>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {items.map((initiative) => (
                <div
                  key={initiative.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-semibold">{initiative.title}</h5>
                    <StatusBadge status={initiative.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {pillarLookup.get(initiative.pillarId)} · {initiative.owner || "Ukjent"} ·{" "}
                    {initiative.allocationPct}%
                  </p>
                  <p className="mt-2 text-sm text-slate-200">{initiative.outcome}</p>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-sm text-slate-400">Ingen initiativer valgt.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SetupView = ({
  quarterThemes,
  onUpdate,
}: {
  quarterThemes: Record<Quarter, { theme: string; goals?: string }>;
  onUpdate: (quarter: Quarter, next: { theme: string; goals?: string }) => void;
}) => (
  <div className="space-y-4">
    {QUARTERS.map((quarter) => (
      <div key={quarter} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h4 className="text-lg font-semibold">{quarter}</h4>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Tema</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
              value={quarterThemes[quarter]?.theme ?? ""}
              onChange={(event) =>
                onUpdate(quarter, { ...quarterThemes[quarter], theme: event.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Goals</label>
            <textarea
              className="mt-1 h-20 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
              value={quarterThemes[quarter]?.goals ?? ""}
              onChange={(event) =>
                onUpdate(quarter, { ...quarterThemes[quarter], goals: event.target.value })
              }
            />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const TeamView = ({
  initiatives,
  pillars,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  initiatives: Initiative[];
  pillars: Pillar[];
  onUpdate: (id: string, next: Partial<Initiative>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) => (
  <div className="space-y-6">
    {QUARTERS.map((quarter) => (
      <div key={quarter} className="space-y-3">
        <h4 className="text-lg font-semibold">{quarter}</h4>
        <div className="space-y-3">
          {initiatives
            .filter((initiative) => initiative.quarter === quarter)
            .map((initiative) => (
              <InitiativeCard
                key={initiative.id}
                initiative={initiative}
                pillars={pillars}
                onChange={(next) => onUpdate(initiative.id, next)}
                onDelete={() => onDelete(initiative.id)}
                onDuplicate={() => onDuplicate(initiative.id)}
              />
            ))}
          {initiatives.filter((initiative) => initiative.quarter === quarter).length === 0 && (
            <p className="text-sm text-slate-400">Ingen initiativer i dette kvartalet.</p>
          )}
        </div>
      </div>
    ))}
  </div>
);

const FilterPanel = ({
  pillars,
  filters,
  onChange,
}: {
  pillars: Pillar[];
  filters: {
    search: string;
    quarters: Quarter[];
    statuses: InitiativeStatus[];
    pillars: string[];
  };
  onChange: (next: Partial<typeof filters>) => void;
}) => (
  <Section title="Filters">
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-400">Søk</label>
        <input
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
      </div>
      <div>
        <p className="text-xs text-slate-400">Kvartal</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUARTERS.map((quarter) => (
            <label key={quarter} className="flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={filters.quarters.includes(quarter)}
                onChange={(event) =>
                  onChange({
                    quarters: event.target.checked
                      ? [...filters.quarters, quarter]
                      : filters.quarters.filter((item) => item !== quarter),
                  })
                }
              />
              {quarter}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-400">Status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <label key={status} className="flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={filters.statuses.includes(status)}
                onChange={(event) =>
                  onChange({
                    statuses: event.target.checked
                      ? [...filters.statuses, status]
                      : filters.statuses.filter((item) => item !== status),
                  })
                }
              />
              {status}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-400">Pilarer</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {pillars.map((pillar) => (
            <label key={pillar.id} className="flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={filters.pillars.includes(pillar.id)}
                onChange={(event) =>
                  onChange({
                    pillars: event.target.checked
                      ? [...filters.pillars, pillar.id]
                      : filters.pillars.filter((item) => item !== pillar.id),
                  })
                }
              />
              {pillar.name}
            </label>
          ))}
        </div>
      </div>
    </div>
  </Section>
);

const FrameworkPanel = ({
  pillars,
  metrics,
  meta,
  northStar,
  capacity,
  onMetaChange,
  onNorthStarChange,
  onAddPillar,
  onUpdatePillar,
  onRemovePillar,
  onAddMetric,
  onUpdateMetric,
  onRemoveMetric,
  onCapacityChange,
}: {
  pillars: Pillar[];
  metrics: AppState["metrics"];
  meta: AppState["meta"];
  northStar: AppState["northStar"];
  capacity: AppState["capacityModel"];
  onMetaChange: (next: Partial<AppState["meta"]>) => void;
  onNorthStarChange: (next: Partial<AppState["northStar"]>) => void;
  onAddPillar: () => void;
  onUpdatePillar: (id: string, next: Partial<Pillar>) => void;
  onRemovePillar: (id: string) => void;
  onAddMetric: () => void;
  onUpdateMetric: (id: string, next: Partial<AppState["metrics"][number]>) => void;
  onRemoveMetric: (id: string) => void;
  onCapacityChange: (next: Partial<AppState["capacityModel"]>) => void;
}) => {
  const capacityTotal =
    capacity.productValuePct + capacity.platformPct + capacity.discoveryOpsPct;
  return (
    <div className="space-y-4">
      <Section title="Meta">
        <div className="grid gap-3">
          <label className="text-xs text-slate-400">År</label>
          <input
            type="number"
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={meta.year}
            onChange={(event) => onMetaChange({ year: Number(event.target.value) })}
          />
          <label className="text-xs text-slate-400">Produkt</label>
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={meta.productName}
            onChange={(event) => onMetaChange({ productName: event.target.value })}
          />
          <label className="text-xs text-slate-400">Selskap</label>
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={meta.companyName}
            onChange={(event) => onMetaChange({ companyName: event.target.value })}
          />
        </div>
      </Section>
      <Section title="North Star">
        <div className="grid gap-2">
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={northStar.name}
            onChange={(event) => onNorthStarChange({ name: event.target.value })}
          />
          <textarea
            className="h-20 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={northStar.description}
            onChange={(event) => onNorthStarChange({ description: event.target.value })}
          />
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            placeholder="Aha-definisjon"
            value={northStar.ahaDefinition ?? ""}
            onChange={(event) => onNorthStarChange({ ahaDefinition: event.target.value })}
          />
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            placeholder="Primary metric"
            value={northStar.primaryMetric ?? ""}
            onChange={(event) => onNorthStarChange({ primaryMetric: event.target.value })}
          />
        </div>
      </Section>
      <Section title="Pilarer">
        <div className="space-y-3">
          {pillars.map((pillar) => (
            <div key={pillar.id} className="rounded-md border border-slate-800 p-2">
              <input
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={pillar.name}
                onChange={(event) => onUpdatePillar(pillar.id, { name: event.target.value })}
              />
              <input
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                placeholder="Beskrivelse"
                value={pillar.description ?? ""}
                onChange={(event) => onUpdatePillar(pillar.id, { description: event.target.value })}
              />
              <div className="mt-2 flex justify-end">
                <button
                  className="rounded-md border border-rose-500/60 px-2 py-1 text-xs text-rose-200"
                  onClick={() => onRemovePillar(pillar.id)}
                >
                  Slett
                </button>
              </div>
            </div>
          ))}
          <button
            className="w-full rounded-md border border-slate-700 px-3 py-2 text-xs"
            onClick={onAddPillar}
          >
            Legg til pilar
          </button>
        </div>
      </Section>
      <Section title="KPI-er">
        <div className="space-y-3">
          {metrics.map((metric) => (
            <div key={metric.id} className="rounded-md border border-slate-800 p-2">
              <input
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                value={metric.name}
                onChange={(event) => onUpdateMetric(metric.id, { name: event.target.value })}
              />
              <input
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                placeholder="Definisjon"
                value={metric.definition}
                onChange={(event) => onUpdateMetric(metric.id, { definition: event.target.value })}
              />
              <input
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                placeholder="Target"
                value={metric.target}
                onChange={(event) => onUpdateMetric(metric.id, { target: event.target.value })}
              />
              <input
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                placeholder="Owner"
                value={metric.owner ?? ""}
                onChange={(event) => onUpdateMetric(metric.id, { owner: event.target.value })}
              />
              <div className="mt-2 flex justify-end">
                <button
                  className="rounded-md border border-rose-500/60 px-2 py-1 text-xs text-rose-200"
                  onClick={() => onRemoveMetric(metric.id)}
                >
                  Slett
                </button>
              </div>
            </div>
          ))}
          <button
            className="w-full rounded-md border border-slate-700 px-3 py-2 text-xs"
            onClick={onAddMetric}
          >
            Legg til KPI
          </button>
        </div>
      </Section>
      <Section title="Kapasitet">
        <div className="grid gap-3">
          <label className="text-xs text-slate-400">Product value %</label>
          <input
            type="number"
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={capacity.productValuePct}
            onChange={(event) =>
              onCapacityChange({ productValuePct: Number(event.target.value) })
            }
          />
          <label className="text-xs text-slate-400">Platform %</label>
          <input
            type="number"
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={capacity.platformPct}
            onChange={(event) => onCapacityChange({ platformPct: Number(event.target.value) })}
          />
          <label className="text-xs text-slate-400">Discovery/Ops %</label>
          <input
            type="number"
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={capacity.discoveryOpsPct}
            onChange={(event) =>
              onCapacityChange({ discoveryOpsPct: Number(event.target.value) })
            }
          />
          <p className={`text-xs ${capacityTotal === 100 ? "text-emerald-300" : "text-amber-300"}`}>
            Sum: {capacityTotal}% {capacityTotal === 100 ? "" : "(bør være 100%)"}
          </p>
        </div>
      </Section>
    </div>
  );
};

const AllocationSummary = ({
  allocationByQuarter,
  statusMix,
}: {
  allocationByQuarter: Record<Quarter, number>;
  statusMix: Record<InitiativeStatus, number>;
}) => {
  const totalInitiatives = Object.values(statusMix).reduce((sum, value) => sum + value, 0);
  return (
    <Section title="Allocation summary">
      <div className="space-y-2 text-sm text-slate-200">
        {QUARTERS.map((quarter) => (
          <div key={quarter} className="flex items-center justify-between">
            <span>{quarter}</span>
            <span
              className={allocationByQuarter[quarter] > 100 ? "text-amber-300" : "text-slate-200"}
            >
              {formatPct(allocationByQuarter[quarter])}
            </span>
          </div>
        ))}
        <div className="mt-3">
          <p className="text-xs text-slate-400">Status mix</p>
          {STATUSES.map((status) => (
            <div key={status} className="flex items-center justify-between">
              <span>{status}</span>
              <span>
                {totalInitiatives === 0
                  ? "0%"
                  : formatPct((statusMix[status] / totalInitiatives) * 100)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    className={`rounded-md px-3 py-1 text-sm ${
      active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60"
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

const App = () => {
  const {
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
  } = useRoadmapStore();
  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([serializeState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `roadmap-${state.meta.year}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const nextState = deserializeState(text);
      updateState(nextState);
      setToast("Roadmap importert");
    } catch {
      setToast("Ugyldig fil. Kontroller formatet.");
    }
  };

  const handleDeletePillar = (id: string) => {
    if (state.pillars.length <= 1) {
      setToast("Du må ha minst én pilar.");
      return;
    }
    const mode = window.prompt(
      "Slett pilar: skriv 'delete' for å slette initiativer eller 'move' for å flytte dem."
    );
    if (!mode || (mode !== "delete" && mode !== "move")) return;
    if (mode === "move") {
      const target = window.prompt("Oppgi ID for pilar du vil flytte til.");
      if (!target) return;
      removePillar(id, "move", target);
      return;
    }
    removePillar(id, "delete");
  };

  const sortedInitiatives = useMemo(() => {
    const list = [...filteredInitiatives];
    if (state.ui.sortMode === "status") {
      return list.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
    }
    if (state.ui.sortMode === "pillar") {
      return list.sort((a, b) => a.pillarId.localeCompare(b.pillarId));
    }
    if (state.ui.sortMode === "allocation") {
      return list.sort((a, b) => b.allocationPct - a.allocationPct);
    }
    if (state.ui.sortMode === "owner") {
      return list.sort((a, b) => a.owner.localeCompare(b.owner));
    }
    return list;
  }, [filteredInitiatives, state.ui.sortMode]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="no-print border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Roadmap Planner 2026</h1>
            <p className="text-xs text-slate-400">Outcome-first roadmap builder</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs"
              onClick={() => addInitiative("Q1")}
              disabled={state.pillars.length === 0}
            >
              <FilePlus size={14} />
              New initiative
            </button>
            <button
              className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs"
              onClick={handleExport}
            >
              <Download size={14} />
              Export
            </button>
            <button
              className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs"
              onClick={() => importRef.current?.click()}
            >
              <FileUp size={14} />
              Import
            </button>
            <button
              className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs"
              onClick={() => window.print()}
            >
              <Printer size={14} />
              Print
            </button>
            <button
              className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs"
              onClick={reset}
            >
              <RefreshCw size={14} />
              Reset
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImport(file);
              }}
            />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <FrameworkPanel
            pillars={state.pillars}
            metrics={state.metrics}
            meta={state.meta}
            northStar={state.northStar}
            capacity={state.capacityModel}
            onMetaChange={(next) => updateState({ meta: { ...state.meta, ...next } })}
            onNorthStarChange={(next) => updateState({ northStar: { ...state.northStar, ...next } })}
            onAddPillar={addPillar}
            onUpdatePillar={updatePillar}
            onRemovePillar={handleDeletePillar}
            onAddMetric={addMetric}
            onUpdateMetric={updateMetric}
            onRemoveMetric={removeMetric}
            onCapacityChange={(next) =>
              updateState({ capacityModel: { ...state.capacityModel, ...next } })
            }
          />
          <FilterPanel
            pillars={state.pillars}
            filters={state.filters}
            onChange={(next) => updateState({ filters: { ...state.filters, ...next } })}
          />
          <AllocationSummary allocationByQuarter={allocationByQuarter} statusMix={statusMix} />
        </aside>
        <main className="space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <TabButton
                active={state.ui.viewMode === "exec"}
                onClick={() => updateState({ ui: { ...state.ui, viewMode: "exec" } })}
              >
                Exec view
              </TabButton>
              <TabButton
                active={state.ui.viewMode === "team"}
                onClick={() => updateState({ ui: { ...state.ui, viewMode: "team" } })}
              >
                Team view
              </TabButton>
              <TabButton
                active={state.ui.viewMode === "setup"}
                onClick={() => updateState({ ui: { ...state.ui, viewMode: "setup" } })}
              >
                Setup
              </TabButton>
            </div>
            {state.ui.viewMode === "team" && (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>Sort:</span>
                <select
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
                  value={state.ui.sortMode}
                  onChange={(event) =>
                    updateState({ ui: { ...state.ui, sortMode: event.target.value as typeof state.ui.sortMode } })
                  }
                >
                  <option value="default">Default</option>
                  <option value="status">Status</option>
                  <option value="pillar">Pillar</option>
                  <option value="allocation">Allocation</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            )}
          </div>
          <div className="print-panel space-y-4">
            {state.ui.viewMode === "exec" && (
              <ExecView
                initiatives={sortedInitiatives}
                quarterThemes={state.quarterThemes}
                pillars={state.pillars}
              />
            )}
            {state.ui.viewMode === "team" && (
              <TeamView
                initiatives={sortedInitiatives}
                pillars={state.pillars}
                onUpdate={updateInitiative}
                onDelete={removeInitiative}
                onDuplicate={duplicateInitiative}
              />
            )}
            {state.ui.viewMode === "setup" && (
              <SetupView
                quarterThemes={state.quarterThemes}
                onUpdate={(quarter, next) =>
                  updateState({
                    quarterThemes: { ...state.quarterThemes, [quarter]: next },
                  })
                }
              />
            )}
          </div>
        </main>
      </div>
      {toast && (
        <div className="no-print fixed bottom-4 right-4 rounded-md bg-slate-900 px-4 py-2 text-sm text-slate-100 shadow-lg">
          {toast}
          <button className="ml-2 text-xs text-slate-400" onClick={() => setToast(null)}>
            Lukk
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
