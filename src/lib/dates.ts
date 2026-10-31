// Local-calendar date helpers. Trips use "YYYY-MM-DD" strings so a day never shifts with time zones.
const pad = (n: number) => String(n).padStart(2, "0");

export function isoDay(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDaysISO(n: number, from: number) {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return isoDay(d.getTime());
}

export function parseISO(iso: string) {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysUntil(iso: string, now: number) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((parseISO(iso).getTime() - today.getTime()) / 86400000);
}

export function fmtDay(iso: string) {
  return parseISO(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "Today", "Tomorrow", "Friday", or "Sat, Nov 14" beyond a week. */
export function relDay(iso: string, now: number) {
  const n = daysUntil(iso, now);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n > 1 && n < 7) return parseISO(iso).toLocaleDateString("en-US", { weekday: "long" });
  return fmtDay(iso);
}

/** Best-effort read of a human date like "Saturday, Nov 14". Empty string when unsure, so a person fills it. */
export function guessISO(text: string | null | undefined, now: number) {
  // Date.parse accepts almost anything ("soon 2026" is Jan 1), so insist on a month or a numeric date.
  if (!text || !/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\d{1,2}\/\d{1,2}/i.test(text)) return "";
  const year = new Date(now).getFullYear();
  const cleaned = text.replace(/^[a-z]+,?\s*/i, "").replace(/(\d)(st|nd|rd|th)\b/, "$1");
  const t = Date.parse(/\d{4}/.test(cleaned) ? cleaned : `${cleaned} ${year}`);
  return Number.isNaN(t) ? "" : isoDay(t);
}

/** "5:15 AM" -> minutes after midnight, for sorting. Unknown formats sort last. */
export function timeToMin(t: string) {
  const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return 24 * 60;
  let h = Number(m[1]);
  if (m[3]) h = (h % 12) + (/pm/i.test(m[3]) ? 12 : 0);
  return h * 60 + Number(m[2] ?? 0);
}
