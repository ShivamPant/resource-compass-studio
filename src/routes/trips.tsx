import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { draftTrip, type TripDraft } from "@/lib/assistant.functions";
import { useStore } from "@/lib/store";
import { AiChip } from "@/components/AppShell";

export const Route = createFileRoute("/trips")({
  head: () => ({
    meta: [
      { title: "Trips · D Ride" },
      { name: "description", content: "Group trips, drafted from emails and reviewed by organizers." },
      { property: "og:title", content: "Trips · D Ride" },
      { property: "og:description", content: "Group trips, drafted from emails and reviewed by organizers." },
    ],
  }),
  component: TripsPage,
});

const EXAMPLE = `Hey all,

DOC is running a day trip to Mount Moosilauke next Saturday, Nov 14. We'll meet on the Robinson Hall steps. Van holds 12. Reply to this email to sign up.

Thanks,
Jordan Kim '26`;

const FIELDS: { key: keyof TripDraft; label: string }[] = [
  { key: "title", label: "Trip name" },
  { key: "date", label: "Date" },
  { key: "departTime", label: "Departure time" },
  { key: "meetingPoint", label: "Meeting point" },
  { key: "destination", label: "Destination" },
  { key: "seats", label: "Seats" },
  { key: "organizer", label: "Organizer" },
  { key: "cost", label: "Cost" },
];

function TripsPage() {
  const { trips, addTrip, online } = useStore();
  const run = useServerFn(draftTrip);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [draft, setDraft] = useState<Record<keyof TripDraft, string> | null>(null);

  async function makeDraft() {
    if (!online) return setState("error");
    setState("loading");
    try {
      const res = await run({ data: { email } });
      if (!res.ok || !res.draft) throw new Error();
      const d = res.draft;
      setDraft(Object.fromEntries(FIELDS.map((f) => [f.key, d[f.key] ?? ""])) as Record<keyof TripDraft, string>);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  const missing = draft ? FIELDS.filter((f) => !draft[f.key].trim()) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trips</h1>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <p className="font-semibold">Turn a trip email into a listing</p>
        <p className="text-sm text-muted-foreground">Paste the email. Claude fills only what it actually says.</p>
        <textarea
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          rows={5}
          aria-label="Trip email"
          placeholder="Paste a trip email"
          className="mt-3 w-full rounded-xl bg-muted p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-2 flex gap-2">
          <button onClick={() => setEmail(EXAMPLE)} className="rounded-lg px-3 py-2 text-sm text-primary ring-1 ring-border">
            Paste example email
          </button>
          <button
            onClick={makeDraft}
            disabled={email.trim().length < 10 || state === "loading"}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            {state === "loading" ? "Drafting…" : "Draft trip"}
          </button>
        </div>
        {state === "error" && (
          <p className="mt-2 text-sm text-destructive">
            {online ? "Couldn't draft this one. Try again, or fill it in by hand." : "You're offline. Drafting needs a connection."}
          </p>
        )}
      </section>

      {draft && (
        <section className="rounded-2xl bg-card p-4 ring-2 ring-ai">
          <AiChip />
          {missing.length > 0 && (
            <p className="mt-2 text-sm text-human-foreground">
              {missing.length} field{missing.length > 1 ? "s" : ""} not in the email. Left empty for you to fill.
            </p>
          )}
          <div className="mt-3 space-y-3">
            {FIELDS.map((f) => {
              const empty = !draft[f.key].trim();
              return (
                <label key={f.key} className="block">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {f.label} {empty && <span className="text-human-foreground">· Missing</span>}
                  </span>
                  <input
                    value={draft[f.key]}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                    placeholder="Not in email"
                    className={`mt-1 w-full rounded-lg px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring ${
                      empty ? "bg-human ring-1 ring-human-foreground/30" : "bg-muted"
                    }`}
                  />
                </label>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setDraft(null)} className="rounded-xl py-3 text-sm font-semibold ring-1 ring-border">
              Discard
            </button>
            <button
              disabled={missing.length > 0}
              onClick={() => {
                addTrip({ ...draft, title: draft.title });
                setDraft(null);
                setEmail("");
              }}
              className="rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              {missing.length ? "Fill all fields" : "Confirm & publish"}
            </button>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold">Upcoming</h2>
        {trips.length === 0 ? (
          <p className="rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">No trips yet. Paste an email to start one.</p>
        ) : (
          <ul className="space-y-3">
            {trips.map((t) => (
              <li key={t.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                <p className="font-bold">{t.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground tnum">
                  <CalendarDays className="size-4" /> {t.date} · {t.departTime}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" /> {t.meetingPoint} → {t.destination}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-4" /> {t.seats} · {t.cost} · {t.organizer}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
