import { describe, expect, it } from "vitest";
import { isValidHandNotation, normalizeHandNotation } from "./handNotation";

describe("normalizeHandNotation", () => {
  it("keeps suited classes canonical", () => {
    expect(normalizeHandNotation("AKs")).toBe("AKs");
  });

  it("keeps offsuit classes canonical", () => {
    expect(normalizeHandNotation("kjo")).toBe("KJo");
  });

  it("keeps pair classes canonical", () => {
    expect(normalizeHandNotation("qq")).toBe("QQ");
  });

  it("converts combo notation to suited class", () => {
    expect(normalizeHandNotation("AhKh")).toBe("AKs");
  });

  it("converts combo notation to offsuit class", () => {
    expect(normalizeHandNotation("KhJd")).toBe("KJo");
  });
});

describe("isValidHandNotation", () => {
  it("accepts canonical classes", () => {
    expect(isValidHandNotation("77")).toBe(true);
    expect(isValidHandNotation("AKs")).toBe(true);
    expect(isValidHandNotation("KJo")).toBe(true);
  });

  it("rejects invalid patterns", () => {
    expect(isValidHandNotation("AKx")).toBe(false);
    expect(isValidHandNotation("T2s7")).toBe(false);
  });
});

