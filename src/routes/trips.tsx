import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, Check, Clock, MapPin, Plus, Search, Sparkles, X } from "lucide-react";
import { draftTrip } from "@/lib/assistant.functions";
import { useStore } from "@/lib/store";
import { fmtDay, guessISO, isoDay, relDay } from "@/lib/dates";
import {
  filterTrips,
  groupsFor,
  kindInfo,
  KINDS,
  parseSeats,
  seatsLeft,
  type CampusEvent,
  type Trip,
  type TripFilter,
  type TripKind,
} from "@/lib/trips";
import { AiChip, PageTitle } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trips")({
  head: () => ({
    meta: [
      { title: "Trips · D Ride" },
      { name: "description", content: "House outings, school carpools, weekend trips and rides to events you registered for." },
      { property: "og:title", content: "Trips · D Ride" },
      { property: "og:description", content: "House outings, school carpools, weekend trips and rides to events you registered for." },
    ],
  }),
  component: TripsPage,
});

const WHEN = [
  { label: "This week", days: 7 },
  { label: "Next 2 weeks", days: 14 },
  { label: "Anytime", days: null },
] as const;

const ALL: TripFilter = { kind: "all", within: null, openOnly: false, q: "" };

function TripsPage() {
  const { trips, events, now } = useStore();
  const [f, setF] = useState<TripFilter>(ALL);
  const [composer, setComposer] = useState<{ prefill?: Partial<Form> } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const shown = filterTrips(trips, f, now);
  const count = (kind: TripFilter["kind"]) => filterTrips(trips, { ...ALL, kind }, now).length;
  const byDay = shown.reduce<Record<string, Trip[]>>((acc, t) => ((acc[t.dateISO] ??= []).push(t), acc), {});
  const groups = f.kind !== "all" && f.kind !== "going" ? groupsFor(f.kind) : [];
  const activeEvent = events.find((e) => e.id === f.eventId);
  const filtered = JSON.stringify(f) !== JSON.stringify(ALL);

  function startCarpool(ev: CampusEvent) {
    setComposer({
      prefill: { title: `Carpool to ${ev.title}`, kind: ev.kind, group: ev.group ?? "", dateISO: ev.dateISO, destination: `${ev.venue}, ${ev.city}`, organizer: "You", eventId: ev.id },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle kicker="Trips & carpools" title="Where's everyone going?" sub="House outings, school carpools, weekends away, and rides to events you've signed up for." />
        {!composer && (
          <button onClick={() => setComposer({})} className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lift lift">
            <Plus className="size-4" /> Post a trip
          </button>
        )}
      </div>

      {composer && <Composer key={JSON.stringify(composer.prefill ?? {})} prefill={composer.prefill} onClose={() => setComposer(null)} />}

      <EventsStrip
        events={events}
        trips={trips}
        now={now}
        onSee={(id) => {
          setF({ ...ALL, eventId: id });
          listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onStart={startCarpool}
      />

      <div ref={listRef} className="scroll-mt-24 pt-10">
        <div className="space-y-3">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="Category">
            {(["all", ...KINDS.map((k) => k.id), "going"] as const).map((k) => {
              const on = f.kind === k;
              const label = k === "all" ? "All trips" : k === "going" ? "You're going" : kindInfo(k).label;
              return (
                <button
                  key={k}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setF({ ...f, kind: k, group: undefined })}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors",
                    on ? "bg-pine text-pine-foreground ring-pine" : "ring-border hover:bg-card",
                  )}
                >
                  {k !== "all" && k !== "going" && <span className="size-2 rounded-full" style={{ background: kindInfo(k).color }} />}
                  {k === "going" && <Check className="size-3.5" />}
                  {label}
                  <span className={cn("tnum text-xs", on ? "opacity-70" : "text-muted-foreground")}>{count(k)}</span>
                </button>
              );
            })}
          </div>

          {groups.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={f.kind === "house" ? "House" : "School"}>
              {["", ...groups].map((g) => (
                <button
                  key={g || "any"}
                  role="radio"
                  aria-checked={(f.group ?? "") === g}
                  onClick={() => setF({ ...f, group: g || undefined })}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold",
                    (f.group ?? "") === g ? "bg-secondary text-secondary-foreground ring-1 ring-primary/30" : "text-muted-foreground hover:bg-card",
                  )}
                >
                  {g || (f.kind === "house" ? "Every house" : "Every school")}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-48 flex-1 items-center gap-2 rounded-xl bg-card px-3 py-2 ring-1 ring-border focus-within:ring-2 focus-within:ring-ring">
              <Search className="size-4 text-muted-foreground" />
              <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Search Boston, Moosilauke, Tuck…" aria-label="Search trips" className="w-full bg-transparent text-sm outline-none" />
            </label>
            <div className="flex rounded-xl bg-card p-1 ring-1 ring-border" role="radiogroup" aria-label="When">
              {WHEN.map((w) => (
                <button
                  key={w.label}
                  role="radio"
                  aria-checked={f.within === w.days}
                  onClick={() => setF({ ...f, within: w.days })}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold", f.within === w.days ? "bg-secondary text-secondary-foreground" : "text-muted-foreground")}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-card px-3 py-2 text-xs font-semibold ring-1 ring-border">
              <input type="checkbox" checked={f.openOnly} onChange={(e) => setF({ ...f, openOnly: e.target.checked })} className="accent-[var(--primary)]" />
              Open seats only
            </label>
          </div>

          {(activeEvent || filtered) && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {activeEvent && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/30 px-3 py-1 font-semibold">
                  Carpools to {activeEvent.title}
                  <button aria-label="Clear event filter" onClick={() => setF({ ...f, eventId: undefined })}>
                    <X className="size-3.5" />
                  </button>
                </span>
              )}
              <span className="text-muted-foreground">
                {shown.length} trip{shown.length === 1 ? "" : "s"}
              </span>
              {filtered && (
                <button onClick={() => setF(ALL)} className="font-semibold text-primary underline-offset-2 hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed p-10 text-center">
            <p className="font-display text-xl font-bold text-pine">Nothing matches yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a wider date range, or start the trip yourself. Someone else is probably looking for it too.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={() => setF(ALL)} className="rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-border">Clear filters</button>
              <button
                onClick={() => (activeEvent ? startCarpool(activeEvent) : (setComposer({}), window.scrollTo({ top: 0, behavior: "smooth" })))}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                {activeEvent ? "Start a carpool" : "Post a trip"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {Object.entries(byDay).map(([day, list]) => (
              <section key={day} aria-label={fmtDay(day)}>
                <h2 className="mb-3 flex items-baseline gap-3 border-b pb-2">
                  <span className="font-display text-2xl font-bold text-pine">{relDay(day, now)}</span>
                  {relDay(day, now) !== fmtDay(day) && <span className="text-sm text-muted-foreground">{fmtDay(day)}</span>}
                </h2>
                <ul className="grid gap-4 md:grid-cols-2">
                  {list.map((t) => (
                    <TripCard key={t.id} trip={t} event={events.find((e) => e.id === t.eventId)} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EventsStrip({ events, trips, now, onSee, onStart }: { events: CampusEvent[]; trips: Trip[]; now: number; onSee: (id: string) => void; onStart: (e: CampusEvent) => void }) {
  return (
    <section className="rounded-3xl bg-pine p-6 text-pine-foreground">
      <div className="flex items-center gap-2">
        <CalendarCheck className="size-5 text-gold" />
        <h2 className="font-display text-2xl font-bold">Events you registered for</h2>
      </div>
      <p className="mt-1 text-sm opacity-80">Need to get there? Join a carpool someone already started, or start one.</p>
      <ul className="mt-5 grid gap-3 md:grid-cols-3">
        {events.map((ev) => {
          const pools = trips.filter((t) => t.eventId === ev.id);
          const open = pools.reduce((n, t) => n + seatsLeft(t), 0);
          const going = pools.find((t) => t.joined);
          return (
            <li key={ev.id} className="flex flex-col rounded-2xl bg-pine-foreground/10 p-4">
              <p className="tnum text-xs font-semibold text-gold">
                {relDay(ev.dateISO, now)} · {ev.time}
              </p>
              <p className="mt-1 font-bold leading-snug">{ev.title}</p>
              <p className="text-xs opacity-75">
                {ev.venue}, {ev.city}
              </p>
              <p className="mt-3 flex-1 text-sm">
                {going ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-gold">
                    <Check className="size-4" /> You have a seat
                  </span>
                ) : pools.length ? (
                  <>
                    {pools.length} carpool{pools.length > 1 ? "s" : ""} · <span className="tnum">{open}</span> seat{open === 1 ? "" : "s"} open
                  </>
                ) : (
                  <span className="opacity-80">No carpool yet</span>
                )}
              </p>
              <div className="mt-3 flex gap-2">
                {pools.length > 0 && (
                  <button onClick={() => onSee(ev.id)} className="flex-1 rounded-xl bg-gold py-2 text-sm font-bold text-gold-foreground">
                    See carpools
                  </button>
                )}
                <button onClick={() => onStart(ev)} className={cn("rounded-xl py-2 text-sm font-semibold ring-1 ring-pine-foreground/40", pools.length ? "px-3" : "flex-1")}>
                  {pools.length ? "Start one" : "Start a carpool"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TripCard({ trip: t, event }: { trip: Trip; event?: CampusEvent | undefined }) {
  const { toggleJoin } = useStore();
  const k = kindInfo(t.kind);
  const left = seatsLeft(t);
  const full = left === 0 && !t.joined;
  return (
    <li className={cn("flex overflow-hidden rounded-2xl bg-card ring-1 transition-shadow hover:shadow-lift", t.joined ? "ring-2 ring-primary" : "ring-border")}>
      <span className="w-1.5 shrink-0" style={{ background: k.color }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold" style={{ color: k.color }}>
              {t.group ? (t.kind === "house" ? `${t.group} House` : t.group) : k.label}
            </p>
            <h3 className="mt-0.5 font-display text-xl font-bold leading-snug text-pine">{t.title}</h3>
          </div>
          <p className="tnum flex shrink-0 items-center gap-1 text-sm font-bold">
            <Clock className="size-3.5 text-muted-foreground" /> {t.departTime}
          </p>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {t.meetingPoint} → <span className="font-semibold text-foreground">{t.destination}</span>
          </span>
        </p>
        {event && (
          <p className="mt-3 self-start rounded-md bg-gold/25 px-2 py-1 text-xs font-semibold text-gold-foreground">For {event.title}, which you registered for</p>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          <div className="text-xs text-muted-foreground">
            <SeatDots total={t.seatsTotal} taken={t.seatsTaken} />
            <p className="tnum mt-1.5">
              {left ? `${left} of ${t.seatsTotal} seats left` : "Full"} · {t.cost}
            </p>
            <p>{t.organizer}</p>
          </div>
          <button
            onClick={() => toggleJoin(t.id)}
            disabled={full}
            aria-pressed={!!t.joined}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed",
              t.joined ? "bg-secondary text-secondary-foreground" : full ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
            )}
          >
            {t.joined ? "You're in · Leave" : full ? "Full" : "Join"}
          </button>
        </div>
      </div>
    </li>
  );
}

function SeatDots({ total, taken }: { total: number; taken: number }) {
  return (
    <div className="flex flex-wrap gap-1" aria-hidden>
      {Array.from({ length: Math.min(total, 14) }, (_, i) => (
        <span key={i} className={cn("size-2.5 rounded-full", i < taken ? "bg-primary" : "ring-1 ring-inset ring-primary/40")} />
      ))}
    </div>
  );
}

type Form = {
  title: string;
  kind: TripKind | "";
  group: string;
  dateISO: string;
  departTime: string;
  meetingPoint: string;
  destination: string;
  seats: string;
  organizer: string;
  cost: string;
  eventId?: string | undefined;
};

const EMPTY: Form = { title: "", kind: "", group: "", dateISO: "", departTime: "", meetingPoint: "", destination: "", seats: "", organizer: "", cost: "" };

const TEXT_FIELDS: { key: keyof Omit<Form, "kind" | "group" | "eventId" | "dateISO">; label: string; placeholder: string }[] = [
  { key: "title", label: "Trip name", placeholder: "Apple picking at Riverview Farm" },
  { key: "departTime", label: "Leaves at", placeholder: "10:30 AM" },
  { key: "meetingPoint", label: "Meet at", placeholder: "Collis porch" },
  { key: "destination", label: "Going to", placeholder: "Plainfield, NH" },
  { key: "seats", label: "Seats", placeholder: "4" },
  { key: "organizer", label: "Organizer", placeholder: "Your name" },
  { key: "cost", label: "Cost", placeholder: "Free, or $5 gas split" },
];

const EXAMPLE = `Hey all,

DOC is running a day trip to Mount Moosilauke next Saturday, Nov 14. We'll meet on the Robinson Hall steps. Van holds 12. Reply to this email to sign up.

Thanks,
Jordan Kim '26`;

function Composer({ prefill, onClose }: { prefill?: Partial<Form> | undefined; onClose: () => void }) {
  const { addTrip, online, now, events } = useStore();
  const run = useServerFn(draftTrip);
  const [mode, setMode] = useState<"manual" | "email">("manual");
  const [form, setForm] = useState<Form>({ ...EMPTY, ...prefill });
  const [fromAi, setFromAi] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function makeDraft() {
    if (!online) return setState("error");
    setState("loading");
    try {
      const res = await run({ data: { email } });
      if (!res.ok || !res.draft) throw new Error();
      const d = res.draft;
      const seats = parseSeats(d.seats);
      setForm({
        ...form,
        title: d.title ?? "",
        dateISO: guessISO(d.date, now),
        departTime: d.departTime ?? "",
        meetingPoint: d.meetingPoint ?? "",
        destination: d.destination ?? "",
        seats: seats ? String(seats) : "",
        organizer: d.organizer ?? "",
        cost: d.cost ?? "",
      });
      setFromAi(true);
      setMode("manual");
      setState("idle");
    } catch {
      setState("error");
    }
  }

  const needsGroup = form.kind === "house" || form.kind === "school";
  const missing = [
    ...TEXT_FIELDS.filter((x) => !form[x.key].trim()).map((x) => x.label),
    ...(form.dateISO ? [] : ["Date"]),
    ...(form.kind ? [] : ["Category"]),
    ...(needsGroup && !form.group ? [form.kind === "house" ? "House" : "School"] : []),
    ...(form.seats && !(Number(form.seats) > 0) ? ["Seats must be a number"] : []),
  ];
  const event = events.find((e) => e.id === form.eventId);
  const field = "mt-1 w-full rounded-lg px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring";
  const missingCls = (empty: boolean) => (empty && fromAi ? "bg-human ring-1 ring-human-foreground/30" : "bg-muted");

  function publish() {
    if (missing.length || !form.kind) return;
    const mine = form.organizer.trim().toLowerCase() === "you";
    addTrip({
      title: form.title.trim(),
      kind: form.kind,
      group: needsGroup ? form.group : undefined,
      dateISO: form.dateISO,
      departTime: form.departTime.trim(),
      meetingPoint: form.meetingPoint.trim(),
      destination: form.destination.trim(),
      seatsTotal: Number(form.seats),
      seatsTaken: mine ? 1 : 0,
      joined: mine,
      organizer: form.organizer.trim(),
      cost: form.cost.trim(),
      eventId: form.eventId,
    });
    onClose();
  }

  return (
    <section className="mb-8 rounded-3xl bg-card p-6 shadow-lift ring-1 ring-border animate-rise">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-pine">{event ? `Start a carpool to ${event.title}` : "Post a trip"}</h2>
          <p className="text-sm text-muted-foreground">It shows up for everyone on the Trips board. People join with one tap.</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
          <X className="size-5" />
        </button>
      </div>

      {!event && (
        <div className="mt-4 inline-flex rounded-xl bg-muted p-1" role="tablist">
          <button role="tab" aria-selected={mode === "manual"} onClick={() => setMode("manual")} className={cn("rounded-lg px-4 py-2 text-sm font-semibold", mode === "manual" && "bg-card shadow-sm")}>
            Fill it in
          </button>
          <button role="tab" aria-selected={mode === "email"} onClick={() => setMode("email")} className={cn("inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold", mode === "email" && "bg-card shadow-sm")}>
            <Sparkles className="size-4" /> From an email
          </button>
        </div>
      )}

      {mode === "email" ? (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Paste a trip email from a house, club or listserv. Claude fills only what the email actually says. You check it before it goes up.</p>
          <textarea
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            rows={6}
            aria-label="Trip email"
            placeholder="Paste a trip email"
            className="mt-3 w-full rounded-xl bg-muted p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={() => setEmail(EXAMPLE)} className="rounded-lg px-3 py-2 text-sm text-primary ring-1 ring-border">
              Use example email
            </button>
            <button
              onClick={makeDraft}
              disabled={email.trim().length < 10 || state === "loading"}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              {state === "loading" ? "Drafting…" : "Draft the listing"}
            </button>
          </div>
          {state === "error" && (
            <p className="mt-2 text-sm text-destructive">{online ? "Couldn't draft this one. Try again, or fill it in by hand." : "You're offline. Drafting needs a connection."}</p>
          )}
        </div>
      ) : (
        <div className="mt-5">
          {fromAi && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <AiChip />
              <span className="text-sm text-human-foreground">Highlighted fields weren't in the email. Fill them in yourself.</span>
            </div>
          )}

          <fieldset>
            <legend className="text-xs font-semibold text-muted-foreground">Category {fromAi && <span className="text-human-foreground">· you pick this, the AI doesn't guess</span>}</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={form.kind === k.id}
                  onClick={() => setForm({ ...form, kind: k.id, group: k.id === form.kind ? form.group : "" })}
                  className={cn("flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1", form.kind === k.id ? "bg-pine text-pine-foreground ring-pine" : "ring-border")}
                >
                  <span className="size-2 rounded-full" style={{ background: k.color }} /> {k.label}
                </button>
              ))}
            </div>
          </fieldset>

          {needsGroup && (
            <label className="mt-4 block">
              <span className="text-xs font-semibold text-muted-foreground">{form.kind === "house" ? "House" : "School"}</span>
              <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} className={cn(field, "bg-muted")}>
                <option value="">Choose…</option>
                {groupsFor(form.kind as TripKind).map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {TEXT_FIELDS.slice(0, 1).map((x) => (
              <label key={x.key} className="block sm:col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">{x.label}</span>
                <input value={form[x.key]} onChange={(e) => setForm({ ...form, [x.key]: e.target.value })} placeholder={x.placeholder} className={cn(field, missingCls(!form[x.key].trim()))} />
              </label>
            ))}
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Date</span>
              <input type="date" min={isoDay(now)} value={form.dateISO} onChange={(e) => setForm({ ...form, dateISO: e.target.value })} className={cn(field, missingCls(!form.dateISO))} />
            </label>
            {TEXT_FIELDS.slice(1).map((x) => (
              <label key={x.key} className="block">
                <span className="text-xs font-semibold text-muted-foreground">{x.label}</span>
                <input
                  value={form[x.key]}
                  inputMode={x.key === "seats" ? "numeric" : undefined}
                  onChange={(e) => setForm({ ...form, [x.key]: e.target.value })}
                  placeholder={x.placeholder}
                  className={cn(field, missingCls(!form[x.key].trim()))}
                />
              </label>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs text-muted-foreground">{missing.length ? `Still needed: ${missing.join(", ")}` : "Looks good. Nothing goes up until you publish."}</p>
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-border">
                Cancel
              </button>
              <button onClick={publish} disabled={missing.length > 0} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">
                {fromAi ? "Confirm & publish" : "Publish trip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
