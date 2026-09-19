import { describe, expect, it } from "vitest";
import { createFamily } from "../../src/domain/family";
import { canDeleteFamily, canEdit, canRevokeView, canViewFull } from "../../src/domain/access";

describe("access", () => {
  it("hides the document from a stranger", () => {
    const doc = createFamily("child", { name: "Давид" });
    expect(canViewFull(doc, "stranger")).toBe(false);
    expect(canEdit(doc, "stranger")).toBe(false);
    expect(canViewFull(doc, "child")).toBe(true);
    expect(canEdit(doc, "child")).toBe(true);
    expect(canDeleteFamily(doc, "child")).toBe(false);
    expect(canRevokeView(doc, "child")).toBe(true);
  });

  it("after claim only the owner deletes", () => {
    const doc = {
      ...createFamily("child", { name: "Давид" }),
      ownerUserId: "elder",
      members: [
        { userId: "child", role: "helper" as const },
        { userId: "elder", role: "owner" as const },
      ],
    };
    expect(canEdit(doc, "child")).toBe(true);
    expect(canDeleteFamily(doc, "child")).toBe(false);
    expect(canDeleteFamily(doc, "elder")).toBe(true);
    expect(canRevokeView(doc, "child")).toBe(false);
    expect(canRevokeView(doc, "elder")).toBe(true);
  });
});
