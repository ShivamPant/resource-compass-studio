import { describe, expect, it } from "vitest";
import { isSafetyConcern } from "@/lib/safety";
import { firingReminders } from "@/lib/store";

describe("safety handoff", () => {
  it("flags being followed", () => expect(isSafetyConcern("I think I'm being followed")).toBe(true));
  it("ignores bus questions", () => expect(isSafetyConcern("When is the next bus?")).toBe(false));
});

describe("reminders", () => {
  const r = { id: "a", departureAt: 60 * 60000, leadMin: 10, source: "you" as const };
  it("does not fire before lead time", () => expect(firingReminders([r], 49 * 60000, [])).toHaveLength(0));
  it("fires within lead time", () => expect(firingReminders([r], 51 * 60000, [])).toHaveLength(1));
});
