import { describe, expect, it } from "vitest";
import { sampleState } from "../lib/sample";
import { deserializeState, serializeState } from "../lib/serializers";
import { clampAllocation } from "../lib/validators";

describe("serializers", () => {
  it("round-trips the roadmap state", () => {
    const raw = serializeState(sampleState);
    const parsed = deserializeState(raw);
    expect(parsed.meta.year).toBe(sampleState.meta.year);
    expect(parsed.pillars.length).toBeGreaterThan(0);
    expect(parsed.initiatives.length).toBeGreaterThan(0);
  });

  it("maps unknown pillars to unassigned", () => {
    const raw = JSON.stringify({
      ...sampleState,
      pillars: [sampleState.pillars[0]],
      initiatives: [{ ...sampleState.initiatives[0], pillarId: "missing" }],
    });
    const parsed = deserializeState(raw);
    expect(parsed.initiatives[0].pillarId).toBe("unassigned");
  });
});

describe("validators", () => {
  it("clamps allocation", () => {
    expect(clampAllocation(120)).toBe(100);
    expect(clampAllocation(-5)).toBe(0);
  });
});
