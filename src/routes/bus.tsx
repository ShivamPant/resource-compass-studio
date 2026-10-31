import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, ExternalLink, FastForward, Footprints, RotateCcw, Ticket, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { departures, fmtTime, fmtWait, getRoute, minsUntil, ROUTES, type Route as BusRoute } from "@/lib/schedule";
import { notifState, requestNotif, type NotifState } from "@/lib/notify";
import { AiChip, DemoNote, PageTitle } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bus")({
  head: () => ({
    meta: [
      { title: "Bus · D Ride" },
      { name: "description", content: "Next shuttle, Advance Transit and coach departures around Hanover, with reminders." },
      { property: "og:title", content: "Bus · D Ride" },
      { property: "og:description", content: "Next shuttle, Advance Transit and coach departures around Hanover, with reminders." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { route?: string } => (typeof s["route"] === "string" ? { route: s["route"] } : {}),
  component: BusPage,
});

const LEADS = [5, 10, 15] as const;

function BusPage() {
  const { now, reminders, addReminder, removeReminder, fastForward, resetClock, offsetMin } = useStore();
  const { route: routeId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const route = getRoute(routeId);
  const [lead, setLead] = useState<number>(10);
  const deps = departures(now, 7, route);
  const next = deps[0]!;
  const reminderFor = (at: number) => reminders.find((r) => r.routeId === route.id && r.departureAt === at);
  const toggle = (at: number) => {
    const r = reminderFor(at);
    if (r) removeReminder(r.id);
    else addReminder({ routeId: route.id, departureAt: at, leadMin: lead, source: "you" });
  };
  const nextReminder = reminderFor(next.at);

  return (
    <>
      <PageTitle kicker="Buses around Hanover" title="Next departures" sub="Campus shuttle, Advance Transit and the coach to Boston. Times are a demo timetable, not live tracking." />

      <div role="radiogroup" aria-label="Route" className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
        {ROUTES.map((r) => {
          const on = r.id === route.id;
          const soonest = departures(now, 1, r)[0];
          const count = reminders.filter((x) => x.routeId === r.id && x.departureAt > now).length;
          return (
            <button
              key={r.id}
              role="radio"
              aria-checked={on}
              onClick={() => navigate({ search: { route: r.id }, replace: true })}
              className={cn(
                "relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left ring-1 transition-colors",
                on ? "bg-card ring-2 ring-primary" : "ring-border hover:bg-card",
              )}
            >
              <span className="size-2.5 rounded-full" style={{ background: r.color }} />
              <span>
                <span className="block text-sm font-bold">{r.short}</span>
                <span className="tnum block text-xs text-muted-foreground">{soonest ? fmtWait(soonest.at, now) : "No service"}</span>
              </span>
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground" aria-label={`${count} reminders`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl bg-pine-card text-primary-foreground shadow-lift">
            <div className="h-1.5" style={{ background: route.color }} />
            <div className="p-7">
              <p className="text-sm font-bold">{route.name}</p>
              <p className="text-sm opacity-75">
                {route.from} → {route.to}
              </p>

              {minsUntil(next.at, now) < 60 ? (
                <>
                  <p className="mt-6 text-sm opacity-80">Next bus in</p>
                  <p className="tnum text-7xl font-extrabold tracking-tight lg:text-8xl">
                    {minsUntil(next.at, now)}
                    <span className="ml-1 text-2xl font-semibold">min</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-6 text-sm opacity-80">Next bus at</p>
                  <p className="tnum text-7xl font-extrabold tracking-tight lg:text-8xl">{fmtTime(next.at)}</p>
                </>
              )}

              <Timeline route={route} at={next.at} now={now} lead={nextReminder?.leadMin ?? lead} />

              {route.bookUrl && (
                <a
                  href={route.bookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-base font-bold text-gold-foreground lift"
                >
                  <Ticket className="size-5" /> Book a seat on Dartmouth Coach <ExternalLink className="size-4" />
                </a>
              )}

              <div className={cn("flex flex-wrap items-center gap-3", route.bookUrl ? "mt-3" : "mt-6")}>
                {!nextReminder && (
                  <div role="radiogroup" aria-label="Remind me this many minutes before" className="flex rounded-xl bg-pine-foreground/10 p-1">
                    {LEADS.map((l) => (
                      <button
                        key={l}
                        role="radio"
                        aria-checked={lead === l}
                        onClick={() => setLead(l)}
                        className={cn("tnum rounded-lg px-3 py-2 text-sm font-semibold", lead === l ? "bg-pine-foreground text-pine" : "opacity-80")}
                      >
                        {l} min
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => toggle(next.at)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold",
                    nextReminder
                      ? "bg-pine-foreground/15 ring-1 ring-pine-foreground/40"
                      : route.bookUrl
                        ? "ring-1 ring-pine-foreground/50"
                        : "bg-gold text-gold-foreground",
                  )}
                >
                  {nextReminder ? <BellOff className="size-5" /> : <Bell className="size-5" />}
                  {nextReminder ? `Reminder set · ${nextReminder.leadMin} min before. Cancel` : `Remind me ${lead} min before`}
                </button>
              </div>
              {route.bookUrl && (
                <p className="mt-3 text-xs opacity-75">The coach needs a ticket. Booking and payment happen on dartmouthcoach.com, not in D Ride.</p>
              )}
            </div>
          </section>

          <YourReminders />
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold">Later {route.short} departures</h2>
            <ul className="divide-y rounded-3xl bg-card ring-1 ring-border">
              {deps.slice(1).map((d) => {
                const r = reminderFor(d.at);
                const quiet = d.seatsNote.includes("quiet");
                return (
                  <li key={d.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-24 shrink-0">
                      <p className="tnum whitespace-nowrap text-lg font-bold leading-tight">{fmtTime(d.at)}</p>
                      <p className="tnum text-xs text-muted-foreground">in {fmtWait(d.at, now)}</p>
                    </div>
                    <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <Footprints className="size-3.5" /> Leave by <span className="tnum font-semibold text-foreground">{fmtTime(d.at - route.walkMin * 60000)}</span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5">
                        <span className={cn("size-1.5 rounded-full", quiet ? "bg-primary" : "bg-maple")} /> {d.seatsNote}
                      </p>
                      {r?.source === "ai" && (
                        <div className="mt-1">
                          <AiChip>Set from Ask, confirmed by you</AiChip>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggle(d.at)}
                      aria-label={r ? `Cancel reminder for ${fmtTime(d.at)}` : `Remind me ${lead} min before ${fmtTime(d.at)}`}
                      aria-pressed={!!r}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold",
                        r ? "bg-secondary text-secondary-foreground" : "text-primary ring-1 ring-border hover:bg-muted",
                      )}
                    >
                      {r ? <BellRing className="size-4" /> : <Bell className="size-4" />}
                      <span className="tnum">{r ? `${r.leadMin} min` : "Remind"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-dashed p-4">
            <p className="text-sm font-semibold">Demo clock</p>
            <DemoNote>
              Timetable is sample data, not live tracking. Set a reminder, then skip ahead to watch it fire.
              {offsetMin > 0 && ` Clock is ${offsetMin} min ahead.`}
            </DemoNote>
            <div className="mt-3 flex flex-wrap gap-2">
              {[5, 10, 30].map((m) => (
                <button key={m} onClick={() => fastForward(m)} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground">
                  <FastForward className="size-4" /> +{m} min
                </button>
              ))}
              <button onClick={resetClock} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                <RotateCcw className="size-4" /> Reset
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/** Reminder → leave by → departs, with a marker for where "now" sits. */
function Timeline({ route, at, now, lead }: { route: BusRoute; at: number; now: number; lead: number }) {
  const stops = [
    { label: "Reminder", t: at - lead * 60000 },
    { label: "Leave by", t: at - route.walkMin * 60000 },
    { label: "Departs", t: at },
  ].sort((a, b) => a.t - b.t);
  const start = stops[0]!.t;
  const pct = Math.min(100, Math.max(0, ((now - start) / (at - start)) * 100));
  return (
    <div className="mt-6">
      <div className="relative h-1.5 rounded-full bg-pine-foreground/15">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gold transition-[width] duration-700" style={{ width: `${pct}%` }} />
        {stops.map((s) => (
          <span
            key={s.label}
            className={cn("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-pine", now >= s.t ? "bg-gold" : "bg-pine-foreground")}
            style={{ left: `${((s.t - start) / (at - start)) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 text-xs">
        {stops.map((s, i) => (
          <div key={s.label} className={cn(i === 1 && "text-center", i === 2 && "text-right")}>
            <p className="opacity-70">{s.label}</p>
            <p className="tnum text-sm font-bold">{fmtTime(s.t)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function YourReminders() {
  const { reminders, removeReminder, now } = useStore();
  const [perm, setPerm] = useState<NotifState>("unsupported");
  useEffect(() => setPerm(notifState()), []);
  const upcoming = reminders.filter((r) => r.departureAt > now).sort((a, b) => a.departureAt - b.departureAt);

  return (
    <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Your reminders</h2>
        {perm === "default" && (
          <button onClick={async () => setPerm(await requestNotif())} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-border hover:bg-muted">
            Also notify my phone
          </button>
        )}
        {perm === "granted" && <span className="text-xs text-muted-foreground">Phone notifications on</span>}
        {perm === "denied" && <span className="text-xs text-muted-foreground">Notifications blocked in browser settings</span>}
      </div>
      {upcoming.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">None yet. Tap Remind on any departure and D Ride will tell you when to head out.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {upcoming.map((r) => {
            const route = getRoute(r.routeId);
            const firesAt = r.departureAt - r.leadMin * 60000;
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5">
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: route.color }} />
                <div className="min-w-0 flex-1">
                  <p className="tnum text-sm font-semibold">
                    {route.short} · {fmtTime(r.departureAt)} <span className="font-normal text-muted-foreground">from {route.from}</span>
                  </p>
                  <p className="tnum text-xs text-muted-foreground">
                    {now >= firesAt ? "Alerting now" : `Alerts at ${fmtTime(firesAt)}, in ${fmtWait(firesAt, now)}`}
                  </p>
                </div>
                <button onClick={() => removeReminder(r.id)} aria-label={`Cancel ${route.short} ${fmtTime(r.departureAt)} reminder`} className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground">
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
