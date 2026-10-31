// DEMO DATA: a generated timetable, not a live feed from the bus tracker.
export const ROUTE = {
  name: "Summit on Juniper Shuttle",
  from: "Summit on Juniper",
  to: "Dartmouth Green",
  walkMin: 4,
};

export type Departure = { id: string; at: number; stop: string; seatsNote: string };

const NOTES = ["Usually quiet", "Often full after 8:40", "Usually quiet", "Busy on weekdays"];

/** Departures every 20 minutes on the :03, :23, :43 past the hour. */
export function departures(now: number, count = 6): Departure[] {
  const d = new Date(now);
  d.setSeconds(0, 0);
  const out: Departure[] = [];
  const t = new Date(d);
  t.setMinutes(Math.floor(d.getMinutes() / 20) * 20 + 3);
  while (out.length < count) {
    if (t.getTime() > now) {
      out.push({
        id: String(t.getTime()),
        at: t.getTime(),
        stop: ROUTE.from,
        seatsNote: NOTES[out.length % NOTES.length] ?? "",
      });
    }
    t.setMinutes(t.getMinutes() + 20);
  }
  return out;
}

export function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function minsUntil(at: number, now: number) {
  return Math.max(0, Math.round((at - now) / 60000));
}
