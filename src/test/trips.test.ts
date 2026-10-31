import { describe, expect, it } from "vitest";
import { filterTrips, parseSeats, seedTrips, type TripFilter } from "@/lib/trips";
import { addDaysISO, guessISO, timeToMin } from "@/lib/dates";
import { validPhone } from "@/lib/rides";
import { departures, getRoute } from "@/lib/schedule";

const now = new Date(2026, 9, 31, 12, 0).getTime();
const trips = seedTrips(now);
const all: TripFilter = { kind: "all", within: null, openOnly: false, q: "" };

describe("trip filters", () => {
  it("lists upcoming trips in date then time order", () => {
    const out = filterTrips(trips, all, now);
    expect(out).toHaveLength(trips.length);
    const keys = out.map((t) => `${t.dateISO} ${String(timeToMin(t.departTime)).padStart(4, "0")}`);
    expect(keys).toEqual([...keys].sort());
  });

  it("scopes to a house", () => {
    const out = filterTrips(trips, { ...all, kind: "house", group: "North Park" }, now);
    expect(out.map((t) => t.id)).toEqual(["t1"]);
  });

  it("finds carpools for a registered event", () => {
    expect(filterTrips(trips, { ...all, eventId: "e-tuck" }, now).every((t) => t.eventId === "e-tuck")).toBe(true);
  });

  it("hides full trips when open seats only", () => {
    expect(filterTrips(trips, { ...all, openOnly: true }, now).some((t) => t.id === "t7")).toBe(false);
  });

  it("drops past trips and respects the date window", () => {
    const past = { ...trips[0]!, id: "old", dateISO: addDaysISO(-1, now) };
    expect(filterTrips([past], all, now)).toHaveLength(0);
    expect(filterTrips(trips, { ...all, within: 2 }, now).every((t) => ["t1", "t2", "t3"].includes(t.id))).toBe(true);
  });

  it("searches destinations", () => {
    expect(filterTrips(trips, { ...all, q: "moosilauke" }, now).map((t) => t.id)).toEqual(["t7"]);
  });
});

describe("parsing helpers", () => {
  it("reads human dates from emails, or leaves them blank", () => {
    expect(guessISO("Saturday, Nov 14", now)).toBe("2026-11-14");
    expect(guessISO("sometime soon", now)).toBe("");
  });
  it("sorts times", () => expect(timeToMin("5:15 AM") < timeToMin("12:00 PM") && timeToMin("12 PM") < timeToMin("1:00 PM")).toBe(true));
  it("pulls seat counts out of text", () => expect(parseSeats("Van holds 12")).toBe(12));
  it("checks phone numbers", () => {
    expect(validPhone("(603) 555-0142")).toBe(true);
    expect(validPhone("555-0142")).toBe(false);
  });
});

describe("timetables", () => {
  it("rolls into tomorrow after the last coach", () => {
    const late = new Date(2026, 9, 31, 22, 0).getTime();
    const next = departures(late, 1, getRoute("coach"))[0]!;
    expect(new Date(next.at).getDate()).toBe(1);
  });
});
