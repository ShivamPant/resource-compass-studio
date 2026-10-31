import { describe, expect, it } from "vitest";
import { getSpeechRecognitionCtor, speechSynthesisSupported } from "@/lib/speech";

describe("speech helpers", () => {
  it("reports no recognition constructor in jsdom", () => {
    expect(getSpeechRecognitionCtor()).toBeNull();
  });

  it("does not throw when checking synthesis support", () => {
    expect(typeof speechSynthesisSupported()).toBe("boolean");
  });
});

describe("campus speech fixes", () => {
  it("repairs local names generic recognisers get wrong", async () => {
    const { fixCampusTerms } = await import("@/lib/speech");
    expect(fixCampusTerms("next bus to d h m c")).toBe("next bus to DHMC");
    expect(fixCampusTerms("ride from gisele to the hop")).toBe("ride from Geisel to the Hop");
    expect(fixCampusTerms("is the summit on jupiter shuttle late")).toBe("is the Summit on Juniper shuttle late");
  });

  it("prefers the alternative that mentions campus places", async () => {
    const { pickBest } = await import("@/lib/speech");
    const alts = [
      { transcript: "when is the next boss to lebanon", confidence: 0.6 },
      { transcript: "when is the next bus to lebanon", confidence: 0.55 },
    ];
    expect(pickBest(alts)).toBe("when is the next bus to lebanon");
  });
});
