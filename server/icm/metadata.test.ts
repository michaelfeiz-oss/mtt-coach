import { describe, expect, it } from "vitest";
import { parseIcmFilename } from "../../shared/icm";
import { extractIcmHtmlPreview } from "./metadata";

describe("ICM metadata helpers", () => {
  it("parses player count, positions, stacks, and category from filenames", () => {
    const parsed = parseIcmFilename("ICM4-utg75bb-hj45bb.html");

    expect(parsed).toMatchObject({
      packType: "ICM",
      playerCount: 4,
      heroPosition: "UTG",
      villainPosition: "HJ",
      heroStackBb: 75,
      villainStackBb: 45,
      primaryCategory: "BIG_STACK_ABUSE",
    });
  });

  it("parses action hints and blind-pressure tags", () => {
    const parsed = parseIcmFilename("ICM5-bb22bb-btn30bb-r.html");

    expect(parsed).toMatchObject({
      playerCount: 5,
      heroPosition: "BB",
      villainPosition: "BTN",
      actionHint: "raise",
      primaryCategory: "BB_PRESSURE",
    });
    expect(parsed?.tags).toContain("BTN_VS_BLINDS");
    expect(parsed?.tags).toContain("RESHOVE");
  });

  it("extracts a conservative preview from chart-like HTML", () => {
    const preview = extractIcmHtmlPreview(`
      <h6 id="selectedGroupTitle">ICM Ranges - BB 22bb vs BTN 30bb</h6>
      <a class="myButton" href="ICM5-bb22bb-btn30bb-r.html">spot</a>
      <td id="cid_AKs" class="cell s"><div class="weighted mdl-color--blue" data-weight="50"></div></td>
      <td id="cid_AQo" class="cell o"><div class="weighted mdl-color--amber" data-weight="25"></div></td>
    `);

    expect(preview.status).toBe("parsed_preview");
    expect(preview.groupTitle).toBe("ICM Ranges - BB 22bb vs BTN 30bb");
    expect(preview.tableHandCount).toBe(2);
    expect(preview.weightedComboCount).toBe(2);
    expect(preview.colorClassCounts).toEqual({ blue: 1, amber: 1 });
    expect(preview.linkedSpotCount).toBe(1);
  });
});
