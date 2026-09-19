import { describe, expect, it } from "vitest";
import { createFamily } from "../../src/domain/family";
import {
  acceptClaim,
  acceptHelper,
  issueClaimKey,
  issueHelperKey,
  issueViewKey,
} from "../../src/domain/invites";

const NOW = 1_000_000;
const DAY = 86_400_000;

describe("family keys", () => {
  it("adds a helper to the same family id", () => {
    const doc = createFamily("child", { name: "Давид" });
    const key = issueHelperKey(doc, "child", NOW, DAY);
    const next = acceptHelper(doc, key, "cousin", NOW + 10);
    expect(next.id).toBe(doc.id);
    expect(next.members).toContainEqual({ userId: "cousin", role: "helper" });
  });

  it("revokes the previous view key when a new one is issued", () => {
    const doc = createFamily("child", { name: "Давид" });
    const first = issueViewKey(doc, "child", NOW, []);
    const second = issueViewKey(doc, "child", NOW + 1, [first.next]);
    expect(second.revoked[0].token).toBe(first.next.token);
    expect(second.revoked[0].revokedAt).toBe(NOW + 1);
    expect(second.next.revokedAt).toBeNull();
  });

  it("claim yes assigns one owner; claim no leaves owner empty; view token cannot claim", () => {
    const doc = createFamily("child", { name: "Давид" });
    const claim = issueClaimKey(doc, "child", NOW, DAY);
    const refused = acceptClaim(doc, claim, "other", NOW, "no");
    expect(refused.doc.ownerUserId).toBeNull();
    const claim2 = issueClaimKey(doc, "child", NOW, DAY);
    const taken = acceptClaim(doc, claim2, "elder", NOW, "yes");
    expect(taken.doc.ownerUserId).toBe("elder");
    expect(taken.doc.graph.persons.find((p) => p.id === doc.rootPersonId)?.claimedUserId).toBe("elder");
    const view = issueViewKey(doc, "child", NOW, []).next;
    expect(() => acceptClaim(doc, view as never, "x", NOW, "yes")).toThrowError(/KEY_INVALID/);
    expect(() => acceptClaim(taken.doc, issueClaimKey(taken.doc, "child", NOW, DAY), "x", NOW, "yes")).toThrowError(
      /ALREADY_OWNED|CARD_TAKEN/
    );
  });

  it("rejects an expired helper key", () => {
    const doc = createFamily("child", { name: "Давид" });
    const key = issueHelperKey(doc, "child", NOW, 10);
    expect(() => acceptHelper(doc, key, "late", NOW + 11)).toThrowError(/KEY_INVALID/);
  });
});
