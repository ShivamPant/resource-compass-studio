import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BellRing, Bus, Hand, Mic, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { departures, fmtTime, fmtWait, getRoute, ROUTES } from "@/lib/schedule";
import { Tag } from "@/components/AppShell";
import { HanoverMap } from "@/components/HanoverMap";
import { SceneConfused, SketchDefs } from "@/components/Sketches";
import { SplashIntro } from "@/components/SplashIntro";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "D Ride · Get around Hanover, together" },
      { name: "description", content: "Shuttle times, reminders, rides and trips for Dartmouth students, on one map." },
      { property: "og:title", content: "D Ride · Get around Hanover, together" },
      { property: "og:description", content: "Shuttle times, reminders, rides and trips for Dartmouth students." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { now } = useStore();
  const leaving = ROUTES.map((r) => ({ route: r, dep: departures(now, 1, r)[0] }))
    .filter((x): x is { route: typeof x.route; dep: NonNullable<typeof x.dep> } => !!x.dep)
    .sort((a, b) => a.dep.at - b.dep.at);
  const blue = departures(now, 1, getRoute("blue"))[0];
  const [active, setActive] = useState<string | null>(null);

  return (
    <div>
      <SplashIntro />
      <section className="relative isolate overflow-hidden bg-sky lg:min-h-[calc(100vh-4.5rem)]">
        <div className="mx-auto grid max-w-6xl px-6 pt-14 lg:pointer-events-none lg:min-h-[calc(100vh-4.5rem)] lg:grid-cols-[minmax(0,30rem)_1fr] lg:items-center lg:pt-0">
          <div className="relative z-10 animate-rise py-6 lg:pointer-events-auto lg:py-16">
            <div className="flex flex-wrap gap-2">
              <Tag tone="gold">Hanover, NH 03755</Tag>
              <Tag tone="green">By students, for students</Tag>
            </div>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] text-pine xl:text-6xl">
              Get around Hanover,
              <span className="block italic text-maple">together.</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-foreground/80">
              The shuttle, Advance Transit, the coach to Logan, your rides and weekend trips, on one map.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/bus" className="inline-flex items-center gap-2 rounded-full bg-pine px-6 py-3.5 font-bold text-pine-foreground shadow-lift lift">
                See the next bus <ArrowRight className="size-4" />
              </Link>
              <Link to="/ask" className="inline-flex items-center gap-2 rounded-full bg-card/70 px-6 py-3.5 font-semibold text-pine ring-1 ring-pine/25 backdrop-blur">
                <Mic className="size-4" /> Ask Naksha
              </Link>
            </div>

            <div className="mt-7 rounded-3xl bg-card/90 p-4 shadow-lift ring-1 ring-black/5 backdrop-blur [animation-delay:150ms]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-pine">Leaving soon</p>
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground">
                  <span className="size-2 rounded-full bg-maple animate-live" /> Demo timetable
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Point at a bus to see its route and stops on the map.</p>
              <ul className="mt-3 space-y-1">
                {leaving.map(({ route, dep }) => {
                  const on = active === route.id;
                  return (
                    <li key={route.id}>
                      <Link
                        to="/bus"
                        search={{ route: route.id }}
                        onMouseEnter={() => setActive(route.id)}
                        onMouseLeave={() => setActive(null)}
                        onFocus={() => setActive(route.id)}
                        onBlur={() => setActive(null)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-[background-color,transform] duration-200"
                        style={on ? { background: `color-mix(in oklch, ${route.color} 13%, white)`, transform: "translateX(4px)" } : undefined}
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-sm" style={{ background: route.color }}>
                          <Bus className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold">{route.short}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {route.from} → {route.to}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="tnum block font-extrabold leading-tight">{fmtTime(dep.at)}</span>
                          <span className="tnum block text-xs text-muted-foreground">{fmtWait(dep.at, now)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link to="/bus" className="mt-3 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-primary ring-1 ring-border hover:bg-muted">
                <BellRing className="size-4" /> Set a reminder
              </Link>
            </div>
          </div>
        </div>

        <div className="map-fade relative -mx-6 mt-6 h-[440px] sm:h-[560px] lg:absolute lg:inset-y-0 lg:right-0 lg:mx-0 lg:mt-0 lg:h-auto lg:w-[64%]">
          <HanoverMap active={active} onActive={setActive} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-display text-4xl font-bold leading-tight text-pine sm:text-5xl">A Saturday, four stops.</h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              No more switching between the bus tracker, three Slack ride threads and a trip spreadsheet. A normal Saturday looks like this.
            </p>
          </div>

          <ol className="relative">
            <span aria-hidden className="absolute bottom-6 left-[11px] top-2 w-0.5 bg-[repeating-linear-gradient(to_bottom,var(--color-border)_0_10px,transparent_10px_18px)]" />
            <Stop time="8:40 AM" to="/bus" label="Bus" title="Make the Blue to DHMC">
              <p>
                You're due at DHMC at 9:30. D Ride buzzes you ten minutes before the bus leaves the Green. No more refreshing a tracker in the hallway.
              </p>
              {blue && (
                <p className="tnum mt-3 inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm">
                  <span className="size-2 rounded-full" style={{ background: getRoute("blue").color }} />
                  Right now, the next Blue leaves at <b>{fmtTime(blue.at)}</b>
                </p>
              )}
            </Stop>
            <Stop time="11:15 AM" to="/ask" label="Naksha" title="Just say it out loud">
              <p>
                "Remind me before the coach to Logan." Naksha answers back, drafts the reminder, and asks if you want it. Say yes and it's set. Say no and it isn't.
              </p>
            </Stop>
            <Stop time="2:00 PM" to="/trips" label="Trips" title="North Park's Ben & Jerry's run">
              <p>
                House outings, Tuck and Thayer carpools, and weekends in Boston, all on one board you can filter. Signed up for the career fair? The carpools heading there are waiting under your events.
              </p>
            </Stop>
            <Stop time="6:30 PM" to="/community" label="Community" title="A seat to Boston on Sunday" last>
              <p>
                Post it once. People offer seats, and you choose who you ride with. Your pickup spot and number go to that one driver, and only when you tap Share.
              </p>
            </Stop>
          </ol>
        </div>
      </section>

      <section className="bg-desk px-4 py-20 sm:px-6">
        <SketchDefs />
        <Link to="/about" className="paper group mx-auto grid max-w-5xl items-center gap-8 rounded-sm p-8 shadow-[0_30px_60px_-30px_rgba(40,40,30,0.45)] transition-transform hover:-rotate-[0.4deg] sm:pl-24 md:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="font-hand text-xl text-maple">why we made this</p>
            <h2 className="font-hand text-5xl font-bold leading-none text-pine">Meet Sam. Sam has five apps and no car.</h2>
            <p className="mt-3 font-pen text-lg leading-8">
              A two-minute story, in doodles, about how getting around Hanover works today and what we changed.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 font-pen text-lg font-bold text-primary">
              Read Sam's story <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
          <div className="tape relative rotate-1 bg-white p-2 shadow-md">
            <SceneConfused />
          </div>
        </Link>
      </section>

      <section className="bg-pine text-pine-foreground">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-2xl font-display text-4xl font-bold sm:text-5xl">Where we drew the line.</h2>
          <p className="mt-4 max-w-xl opacity-85">
            Looking things up is a computer's job. Deciding who you trust, where you go and what you share is yours. So we split it down the middle.
          </p>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-pine-foreground/15 md:grid-cols-2">
            <div className="bg-pine p-8">
              <p className="flex items-center gap-2 text-sm font-bold text-gold">
                <Search className="size-4" /> Naksha does the legwork
              </p>
              <ul className="mt-5 space-y-4">
                {[
                  ["Finds the bus", "Next Blue to DHMC, the coach to Logan, all four routes at once."],
                  ["Writes the draft", "A reminder, a ride request, a trip listing from a messy email."],
                  ["Leaves gaps as gaps", "If the email didn't say when, the field stays empty for a person."],
                ].map(([t, b]) => (
                  <li key={t}>
                    <p className="font-bold">{t}</p>
                    <p className="text-sm opacity-75">{b}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-pine p-8">
              <p className="flex items-center gap-2 text-sm font-bold text-gold">
                <Hand className="size-4" /> You make the calls
              </p>
              <ul className="mt-5 space-y-4">
                {[
                  ["Say yes", "Nothing is set or posted until you tap Confirm or say yes."],
                  ["Pick your driver", "Offers come in. You choose who you get in a car with."],
                  ["Share on your terms", "Your pickup spot and number go to one driver, when you tap Share."],
                  ["Get a person, fast", "Say “followed” or “unsafe” and Naksha steps aside for 911 and Safety & Security."],
                ].map(([t, b]) => (
                  <li key={t}>
                    <p className="font-bold">{t}</p>
                    <p className="text-sm opacity-75">{b}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stop({ time, to, label, title, last, children }: { time: string; to: "/bus" | "/ask" | "/trips" | "/community"; label: string; title: string; last?: boolean; children: ReactNode }) {
  return (
    <li className={`relative grid grid-cols-[24px_1fr] gap-5 ${last ? "" : "pb-14"}`}>
      <span className="mt-1 size-6 rounded-full bg-background ring-[5px] ring-inset ring-primary" />
      <div>
        <p className="tnum text-sm text-muted-foreground">{time}</p>
        <h3 className="mt-1 font-display text-2xl font-bold text-pine">{title}</h3>
        <div className="mt-2 max-w-lg text-foreground/85">{children}</div>
        <Link to={to} className="group mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
          Open {label} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </li>
  );
}
