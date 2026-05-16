import { describe, expect, it } from "vitest";
import { isPopulationDraftChart, isPopulationDraftText } from "@/local-study/provenance";

describe("population draft provenance helpers", () => {
  it("detects population-draft chart metadata for library badges", () => {
    expect(
      isPopulationDraftChart({
        description: "Population draft - review before approval. sourceType=population_constructed.",
      })
    ).toBe(true);
  });

  it("does not mark ordinary seed charts as population drafts", () => {
    expect(isPopulationDraftText("Migrated from reviewed typed seed rows.")).toBe(false);
  });
});
