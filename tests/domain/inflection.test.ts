import { describe, expect, it } from "vitest";
import { toDative, toGenitive } from "../../src/domain/inflection";

describe("name inflection", () => {
  it("inflects Давид in genitive and dative", () => {
    expect(toGenitive("Давид")).toBe("Давида");
    expect(toDative("Давид")).toBe("Давиду");
  });

  it("inflects typical female names ending in а/я", () => {
    expect(toGenitive("Сара")).toBe("Сары");
    expect(toDative("Сара")).toBe("Саре");
  });
});
