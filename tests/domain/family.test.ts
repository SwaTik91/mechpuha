import { describe, expect, it } from "vitest";
import { createFamily } from "../../src/domain/family";

describe("createFamily", () => {
  it("puts the elder at the root and the creator as helper without an owner", () => {
    const doc = createFamily("user-child", { name: "Давид", surname: "Абрамов", birthPlace: "Москва" });
    expect(doc.ownerUserId).toBeNull();
    expect(doc.members).toEqual([{ userId: "user-child", role: "helper" }]);
    const root = doc.graph.persons.find((p) => p.id === doc.rootPersonId);
    expect(root).toMatchObject({ name: "Давид", surname: "Абрамов", birthPlace: "Москва", claimedUserId: null });
  });

  it("rejects a nameless elder", () => {
    expect(() => createFamily("user-child", { name: "  " })).toThrowError(/NAME_REQUIRED/);
  });
});
