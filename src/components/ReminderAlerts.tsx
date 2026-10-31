import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { BellRing, ExternalLink, Footprints, X } from "lucide-react";
import { firingReminders, useStore } from "@/lib/store";
import { departures, fmtTime, getRoute, minsUntil } from "@/lib/schedule";
import { sendNotif } from "@/lib/notify";

/** Floating "time to head out" cards for reminders whose lead window has started. */
export function ReminderAlerts() {
  const { reminders, now, dismissed, dismiss, addReminder } = useStore();
  const firing = firingReminders(reminders, now, dismissed);
  const notified = useRef(new Set<string>());

  useEffect(() => {
    for (const r of firing) {
      if (notified.current.has(r.id)) continue;
      notified.current.add(r.id);
      const route = getRoute(r.routeId);
      sendNotif(
        `${route.short} at ${fmtTime(r.departureAt)}: time to head out`,
        `${route.walkMin} min walk to ${route.from}. Leave by ${fmtTime(r.departureAt - route.walkMin * 60000)}.`,
        r.id,
      );
    }
  }, [firing]);

  if (firing.length === 0) return null;
  return (
    <div aria-live="assertive" className="fixed inset-x-3 bottom-3 z-40 space-y-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96">
      {firing.map((r) => {
        const route = getRoute(r.routeId);
        const leaveBy = r.departureAt - route.walkMin * 60000;
        const leaveNow = now >= leaveBy;
        const left = minsUntil(r.departureAt, now);
        const pct = Math.min(100, Math.max(0, (left / r.leadMin) * 100));
        const after = departures(r.departureAt, 1, route)[0];
        return (
          <div key={r.id} role="alert" className="overflow-hidden rounded-2xl bg-card shadow-lift ring-1 ring-border animate-in fade-in slide-in-from-bottom-4">
            <div className="flex gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: route.color }}>
                <BellRing className="size-5 animate-ring" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-snug">
                  {leaveNow ? `Leave now for the ${fmtTime(r.departureAt)} ${route.short}` : `${route.short} leaves in ${left} min`}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Footprints className="size-3.5 shrink-0" />
                  <span className="tnum">
                    {route.walkMin} min walk to {route.from}
                    {leaveNow ? "" : `. Leave by ${fmtTime(leaveBy)}`}
                  </span>
                </p>
              </div>
              <button aria-label="Dismiss reminder" onClick={() => dismiss(r.id)} className="self-start rounded-md p-1 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 px-4 pb-4">
              <button onClick={() => dismiss(r.id)} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
                On my way
              </button>
              {after && (
                <button
                  onClick={() => {
                    addReminder({ routeId: route.id, departureAt: after.at, leadMin: r.leadMin, source: "you" });
                    dismiss(r.id);
                  }}
                  className="tnum flex-1 rounded-xl py-2.5 text-sm font-semibold ring-1 ring-border hover:bg-muted"
                >
                  Take the {fmtTime(after.at)}
                </button>
              )}
              {route.bookUrl ? (
                <a href={route.bookUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-primary">
                  Need a ticket? Book on dartmouthcoach.com <ExternalLink className="size-3" />
                </a>
              ) : (
                <Link to="/bus" search={{ route: route.id }} className="w-full text-center text-xs font-semibold text-primary">
                  See {route.short} times
                </Link>
              )}
            </div>
            <div className="h-1 bg-muted">
              <div className="h-full transition-[width] duration-700" style={{ width: `${pct}%`, background: route.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
