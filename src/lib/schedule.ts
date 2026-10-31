// DEMO DATA: generated timetables, not a live feed from any bus tracker.
export type Route = {
  id: string;
  name: string;
  short: string;
  from: string;
  to: string;
  walkMin: number;
  /** Minutes after midnight of the first run, the gap between runs, and the last run. */
  first: number;
  every: number;
  last: number;
  color: string;
  /** Routes that need a ticket link out to their operator's booking site. */
  bookUrl?: string;
};

export const ROUTES: Route[] = [
  { id: "juniper", name: "Summit on Juniper Shuttle", short: "Juniper", from: "Summit on Juniper", to: "Dartmouth Green", walkMin: 4, first: 7 * 60 + 3, every: 20, last: 23 * 60 + 43, color: "oklch(0.42 0.09 158)" },
  { id: "blue", name: "Advance Transit Blue", short: "Blue", from: "Dartmouth Green", to: "DHMC, Lebanon", walkMin: 6, first: 6 * 60 + 10, every: 30, last: 19 * 60 + 40, color: "oklch(0.5 0.13 250)" },
  { id: "orange", name: "Advance Transit Orange", short: "Orange", from: "Dartmouth Green", to: "West Lebanon Plaza", walkMin: 6, first: 6 * 60 + 25, every: 60, last: 18 * 60 + 25, color: "oklch(0.66 0.16 55)" },
  { id: "coach", name: "Dartmouth Coach", short: "Coach", from: "Hanover Inn", to: "Boston Logan", walkMin: 8, first: 5 * 60 + 30, every: 150, last: 20 * 60, color: "oklch(0.35 0.03 160)", bookUrl: "https://dartmouthcoach.com/" },
];

export const DEFAULT_ROUTE = ROUTES[0]!;

export function getRoute(id: string | undefined) {
  return ROUTES.find((r) => r.id === id) ?? DEFAULT_ROUTE;
}

export type Departure = { id: string; routeId: string; at: number; stop: string; seatsNote: string };

const NOTES = ["Usually quiet", "Often full", "Usually quiet", "Busy on weekdays"];

/** Upcoming departures for a route, rolling into tomorrow's service when today's is over. */
export function departures(now: number, count = 6, route: Route = DEFAULT_ROUTE): Departure[] {
  const out: Departure[] = [];
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  for (let d = 0; d < 3 && out.length < count; d++) {
    for (let m = route.first; m <= route.last && out.length < count; m += route.every) {
      const at = day.getTime() + d * 86400000 + m * 60000;
      if (at <= now) continue;
      out.push({ id: `${route.id}-${at}`, routeId: route.id, at, stop: route.from, seatsNote: NOTES[out.length % NOTES.length] ?? "" });
    }
  }
  return out;
}

export function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function minsUntil(at: number, now: number) {
  return Math.max(0, Math.round((at - now) / 60000));
}

/** "12 min" for soon departures, "2 h 5 min" for later ones. */
export function fmtWait(at: number, now: number) {
  const m = minsUntil(at, now);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}
