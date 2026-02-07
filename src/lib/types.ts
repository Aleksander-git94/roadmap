export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type InitiativeStatus = "committed" | "likely" | "bet";
export type Confidence = "low" | "medium" | "high";
export type Effort = "S" | "M" | "L" | "XL";

export interface Meta {
  year: number;
  productName: string;
  companyName: string;
  updatedAt: string;
}

export interface NorthStar {
  name: string;
  description: string;
  ahaDefinition?: string;
  primaryMetric?: string;
}

export interface Metric {
  id: string;
  name: string;
  definition: string;
  target: string;
  owner?: string;
}

export interface Pillar {
  id: string;
  name: string;
  description?: string;
  icon?: "rocket" | "repeat" | "coins" | "gauge" | "shield" | "layers";
}

export interface QuarterTheme {
  quarter: Quarter;
  theme: string;
  goals?: string;
}

export interface InitiativeLink {
  label: string;
  url: string;
}

export interface Initiative {
  id: string;
  title: string;
  quarter: Quarter;
  pillarId: string;
  status: InitiativeStatus;
  owner: string;
  problem: string;
  outcome: string;
  hypothesis: string;
  scope: string;
  successMetrics: string;
  dependencies: string;
  risks: string;
  confidence?: Confidence;
  effort?: Effort;
  allocationPct: number;
  tags: string[];
  links?: InitiativeLink[];
  createdAt: string;
  updatedAt: string;
}

export interface CapacityModel {
  productValuePct: number;
  platformPct: number;
  discoveryOpsPct: number;
}

export interface Filters {
  search: string;
  quarters: Quarter[];
  statuses: InitiativeStatus[];
  pillars: string[];
  owners: string[];
  tags: string[];
  showOnlyOverCapacity: boolean;
}

export interface UiState {
  viewMode: "exec" | "team" | "setup";
  sortMode: "default" | "status" | "pillar" | "allocation" | "owner";
}

export interface AppState {
  meta: Meta;
  northStar: NorthStar;
  metrics: Metric[];
  pillars: Pillar[];
  quarterThemes: Record<Quarter, QuarterTheme>;
  initiatives: Initiative[];
  capacityModel: CapacityModel;
  filters: Filters;
  ui: UiState;
}

export const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
export const STATUSES: InitiativeStatus[] = ["committed", "likely", "bet"];
