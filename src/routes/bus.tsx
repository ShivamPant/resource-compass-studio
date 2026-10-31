import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff, FastForward, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { departures, fmtTime, minsUntil, ROUTE } from "@/lib/schedule";
import { AiChip, DemoNote } from "@/components/AppShell";

export const Route = createFileRoute("/bus")({
  head: () => ({
    meta: [
      { title: "Bus · D Ride" },
      { name: "description", content: "Next Summit on Juniper shuttle departures with reminders." },
      { property: "og:title", content: "Bus · D Ride" },
      { property: "og:description", content: "Next Summit on Juniper shuttle departures with reminders." },
    ],
  }),
  component: BusPage,
});

const LEAD = 10;

function BusPage() {
  const { now, reminders, addReminder, removeReminder, fastForward, resetClock, offsetMin } = useStore();
  const deps = departures(now);
  const next = deps[0]!;
  const reminderFor = (at: number) => reminders.find((r) => r.departureAt === at);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <section className="lg:row-span-2">
        <p className="text-sm font-medium text-muted-foreground">{ROUTE.name}</p>
        <p className="text-sm text-muted-foreground">
          {ROUTE.from} → {ROUTE.to}
        </p>
        <div className="mt-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <p className="text-sm text-muted-foreground">Next bus in</p>
          <p className="tnum text-7xl font-extrabold lg:text-8xl tracking-tight text-primary">
            {minsUntil(next.at, now)}
            <span className="ml-1 text-2xl font-semibold">min</span>
          </p>
          <p className="tnum mt-1 text-base">
            Departs {fmtTime(next.at)} · {ROUTE.walkMin} min walk
          </p>
          <ReminderButton
            on={!!reminderFor(next.at)}
            onToggle={() => {
              const r = reminderFor(next.at);
              if (r) removeReminder(r.id);
              else addReminder({ departureAt: next.at, leadMin: LEAD, source: "you" });
            }}
            primary
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Later departures</h2>
        <ul className="divide-y rounded-2xl bg-card ring-1 ring-border">
          {deps.slice(1).map((d) => {
            const r = reminderFor(d.at);
            return (
              <li key={d.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="tnum text-lg font-bold">{fmtTime(d.at)}</p>
                  <p className="text-xs text-muted-foreground">
                    in {minsUntil(d.at, now)} min · {d.seatsNote}
                  </p>
                  {r?.source === "ai" && <div className="mt-1"><AiChip>Set from Ask, confirmed by you</AiChip></div>}
                </div>
                <ReminderButton
                  on={!!r}
                  onToggle={() =>
                    r ? removeReminder(r.id) : addReminder({ departureAt: d.at, leadMin: LEAD, source: "you" })
                  }
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-dashed p-4">
        <p className="text-sm font-semibold">Demo clock</p>
        <DemoNote>
          Timetable is sample data, not live tracking. Skip ahead to see a reminder fire.
          {offsetMin > 0 && ` Clock is ${offsetMin} min ahead.`}
        </DemoNote>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => fastForward(10)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground"
          >
            <FastForward className="size-4" /> Fast-forward 10 min
          </button>
          <button
            onClick={resetClock}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground"
          >
            <RotateCcw className="size-4" /> Reset
          </button>
        </div>
      </section>
    </div>
  );
}

function ReminderButton({ on, onToggle, primary }: { on: boolean; onToggle: () => void; primary?: boolean }) {
  if (primary)
    return (
      <button
        onClick={onToggle}
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold ${
          on ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
        }`}
      >
        {on ? <BellOff className="size-5" /> : <Bell className="size-5" />}
        {on ? `Reminder set · ${LEAD} min before` : "Remind me"}
      </button>
    );
  return (
    <button
      onClick={onToggle}
      aria-label={on ? "Cancel reminder" : "Remind me"}
      className={`rounded-lg px-3 py-2 text-sm font-semibold ${
        on ? "bg-secondary text-secondary-foreground" : "text-primary ring-1 ring-border"
      }`}
    >
      {on ? "Set" : "Remind me"}
    </button>
  );
}
