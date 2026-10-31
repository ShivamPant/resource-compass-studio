import { describe, expect, it } from "vitest";
import { answerLocally, routeFor } from "@/lib/naksha-kb";
import { departures, fmtTime, getRoute } from "@/lib/schedule";

const now = new Date(2026, 9, 31, 12, 5).getTime();

describe("Naksha's built-in answers", () => {
  it("maps places to the right route", () => {
    expect(routeFor("next bus to DHMC")?.id).toBe("blue");
    expect(routeFor("going to West Lebanon")?.id).toBe("orange");
    expect(routeFor("Target run")?.id).toBe("orange");
    expect(routeFor("flight out of Logan")?.id).toBe("coach");
    expect(routeFor("back to Summit")?.id).toBe("juniper");
  });

  it("answers the next bus with a real timetable time and offers a reminder", () => {
    const a = answerLocally("When's the next bus to DHMC?", now)!;
    const next = departures(now, 1, getRoute("blue"))[0]!;
    expect(a.action).toEqual({ type: "reminder", route: "blue", departure: fmtTime(next.at), leadMinutes: 10 });
    expect(a.reply).toMatch(/Blue/);
  });

  it("drafts a coach reminder and mentions the ticket", () => {
    const a = answerLocally("Remind me before the coach to Logan", now)!;
    expect(a.action?.type).toBe("reminder");
    expect(a.reply).toMatch(/dartmouthcoach\.com/);
  });

  it("picks the bus after next when asked", () => {
    const a = answerLocally("remind me for the blue after next", now)!;
    const second = departures(now, 2, getRoute("blue"))[1]!;
    expect(a.action).toMatchObject({ departure: fmtTime(second.at) });
  });

  it("drafts a ride request with destination and day", () => {
    const a = answerLocally("I need a ride to Lebanon on Saturday", now)!;
    expect(a.action).toEqual({ type: "ride_request", destination: "Lebanon", when: "saturday", seats: 1 });
  });

  it("keeps human decisions with the student", () => {
    expect(answerLocally("can you accept the ride for me", now)?.action).toBeNull();
    expect(answerLocally("share my location with the driver", now)?.reply).toMatch(/stays with you/);
  });

  it("leaves unknown places and open questions to the AI", () => {
    expect(answerLocally("how do I get to the Hop", now)).toBeNull();
    expect(answerLocally("what's a good place to study late?", now)).toBeNull();
  });
});
