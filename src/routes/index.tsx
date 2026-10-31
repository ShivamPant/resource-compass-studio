import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BellRing, Bus, Map, MessageCircle, ShieldCheck, Users } from "lucide-react";
import hero from "@/assets/hero-green.jpg";
import { useStore } from "@/lib/store";
import { departures, fmtTime, minsUntil } from "@/lib/schedule";
import { Tag } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "D Ride · Get around Hanover, together" },
      { name: "description", content: "Shuttle times, reminders, rides and trips for Dartmouth students, in one calm app." },
      { property: "og:title", content: "D Ride · Get around Hanover, together" },
      { property: "og:description", content: "Shuttle times, reminders, rides and trips for Dartmouth students." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { to: "/bus", icon: Bus, tag: "Live board", tone: "green", title: "Never miss the Juniper shuttle", body: "Big, honest departure times and a nudge when it's time to walk out the door." },
  { to: "/ask", icon: MessageCircle, tag: "Claude", tone: "sky", title: "Ask, then confirm", body: "Claude drafts reminders and ride requests. Nothing happens until you tap Confirm." },
  { to: "/trips", icon: Map, tag: "Outdoors", tone: "gold", title: "Trips without the spreadsheet", body: "Paste a trip email. Get a clean listing, with missing details left for a person to fill." },
  { to: "/help", icon: Users, tag: "Community", tone: "maple", title: "One place to find a seat", body: "Ride requests out of scattered Slack threads. You choose who you ride with." },
] as const;

function Landing() {
  const { now } = useStore();
  const next = departures(now, 3);

  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <img src={hero} alt="Autumn on a New England college green with a campus shuttle" width={1920} height={1088} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero" />
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-24 lg:grid-cols-[1.3fr_1fr] lg:py-32">
          <div className="animate-rise text-pine-foreground">
            <div className="flex flex-wrap gap-2">
              <Tag tone="gold">Made for Hanover</Tag>
              <Tag tone="green">AI assists · You decide</Tag>
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] sm:text-7xl">
              Get around Hanover,
              <span className="block italic text-gold">together.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg opacity-90">
              The shuttle, your rides and weekend trips in one calm place. Built by students who were tired of refreshing the bus tracker.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/bus" className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 font-bold text-gold-foreground shadow-lift lift">
                See the next bus <ArrowRight className="size-4" />
              </Link>
              <Link to="/ask" className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold ring-1 ring-pine-foreground/50 backdrop-blur">
                Ask D Ride
              </Link>
            </div>
          </div>

          <div className="animate-rise self-end rounded-3xl bg-card/95 p-6 shadow-lift backdrop-blur [animation-delay:150ms]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-pine">Summit on Juniper → The Green</p>
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground">
                <span className="size-2 rounded-full bg-maple animate-live" /> Demo timetable
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {next.map((d, i) => (
                <li key={d.id} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${i === 0 ? "bg-pine-card text-primary-foreground" : "bg-muted"}`}>
                  <span className="tnum text-xl font-extrabold">{fmtTime(d.at)}</span>
                  <span className="tnum text-sm font-semibold">{minsUntil(d.at, now)} min</span>
                </li>
              ))}
            </ul>
            <Link to="/bus" className="mt-4 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-primary ring-1 ring-border">
              <BellRing className="size-4" /> Remind me
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-maple">Everything in one app</p>
        <h2 className="mt-2 max-w-2xl font-display text-4xl font-bold text-pine">Four tabs instead of a tracker, Slack, and a spreadsheet.</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Link key={f.to} to={f.to} className="group animate-rise rounded-3xl bg-card p-7 ring-1 ring-border lift" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-pine-card text-primary-foreground">
                  <f.icon className="size-6" />
                </span>
                <Tag tone={f.tone}>{f.tag}</Tag>
              </div>
              <h3 className="mt-6 font-display text-2xl font-bold text-pine">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.body}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">
                Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-pine text-pine-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-2">
          <div>
            <Tag tone="gold">What must remain human</Tag>
            <h2 className="mt-4 font-display text-4xl font-bold">AI drafts. People decide.</h2>
            <p className="mt-4 max-w-md opacity-85">
              Claude saves you typing. It never accepts a ride, files a report, or handles an emergency. Those stay with you and real people.
            </p>
          </div>
          <ul className="grid gap-3">
            {[
              ["AI draft", "Reminders, ride requests and trip listings wait for your Confirm."],
              ["Human zone", "SOS, choosing a driver and reports never touch AI."],
              ["Safety first", "Words like \"followed\" skip the AI and show 911 instantly."],
            ].map(([t, b]) => (
              <li key={t} className="flex gap-4 rounded-2xl bg-pine-foreground/10 p-5">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold" />
                <div>
                  <p className="font-bold">{t}</p>
                  <p className="text-sm opacity-80">{b}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
