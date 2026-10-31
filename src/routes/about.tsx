import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { SceneConfused, SceneDecide, SceneMeet, SceneOneMap, SketchDefs } from "@/components/Sketches";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · D Ride" },
      { name: "description", content: "Why D Ride exists, who it's for, and where we drew the line between what AI does and what people decide." },
      { property: "og:title", content: "About · D Ride" },
      { property: "og:description", content: "Why D Ride exists, who it's for, and where we drew the line between what AI does and what people decide." },
    ],
  }),
  component: AboutPage,
});

/** Fade things in as they scroll into view. Shows everything immediately if observers aren't available. */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!("IntersectionObserver" in window)) return;
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset["reveal"] = "shown";
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

const BEATS: { scene: ReactNode; title: string; body: string; tilt: string }[] = [
  {
    scene: <SceneMeet />,
    title: "This is Sam.",
    body: "Sam is a '27 without a car. Hanover is small, but the places Sam needs to be aren't all in Hanover: DHMC, West Leb, Boston, home for break.",
    tilt: "-rotate-1",
  },
  {
    scene: <SceneConfused />,
    title: "Getting anywhere means five apps.",
    body: "The shuttle has its own tracker. Advance Transit has another. Rides get asked for in Slack threads that scroll away. Trips live in emails and spreadsheets. Sam spends more time searching than going.",
    tilt: "rotate-1",
  },
  {
    scene: <SceneOneMap />,
    title: "So we put it on one map.",
    body: "D Ride keeps bus times, trips and a ride board in one place. And there's Naksha, which means “map”: ask it like you'd ask a friend who knows the buses, out loud if your hands are full.",
    tilt: "-rotate-[0.6deg]",
  },
  {
    scene: <SceneDecide />,
    title: "Naksha finds. Sam decides.",
    body: "Naksha found the 8:40 and offered a reminder. Sam said yes. When Sam needs a ride, Sam picks the driver, and Sam decides whether to share a pickup spot and number.",
    tilt: "rotate-[0.8deg]",
  },
];

const FOR = ["First-years without a car", "Grad students at Summit on Juniper", "Geisel students on early DHMC shifts", "International students flying out of Logan", "Anyone new to the Upper Valley"];

const HELPS = [
  "Finding the next bus across four routes",
  "Turning a messy trip email into a listing, with gaps left blank",
  "Drafting a reminder or ride request from one sentence",
  "Answering out loud when your hands are full",
];
const HUMAN = [
  "Saying yes to anything that happens",
  "Choosing who you get in a car with",
  "Sharing your location and number, with one person",
  "Reporting someone. A student moderator reads it",
  "Emergencies. Safety words skip the AI and show 911",
];

const RISKS: { worry: string; answer: string; color: string; tilt: string }[] = [
  { worry: "Naksha mishears me", answer: "You see the words first. Nothing happens until you say yes or tap Confirm.", color: "bg-[#fff3a8]", tilt: "-rotate-2" },
  { worry: "Naksha makes up a bus time", answer: "A reminder only saves if that time is really on the timetable. Otherwise Naksha says so and sets nothing.", color: "bg-[#ffd6e0]", tilt: "rotate-1" },
  { worry: "The AI misreads a trip email", answer: "It only fills what the email says. Gaps are highlighted, and a person publishes.", color: "bg-[#d4ecff]", tilt: "-rotate-1" },
  { worry: "Someone is in danger", answer: "Words like “followed” or “unsafe” never reach the AI. 911 and Safety & Security (603-646-4000) show instantly.", color: "bg-[#ffd9b8]", tilt: "rotate-2" },
  { worry: "Sharing too much", answer: "Your pickup spot and number go to one driver you chose, only after you tap Share. Stop anytime.", color: "bg-[#d8f5d0]", tilt: "-rotate-1" },
  { worry: "A bad actor on the board", answer: "Reports go to a student moderator, not an algorithm.", color: "bg-[#fff3a8]", tilt: "rotate-1" },
  { worry: "No signal", answer: "Bus times still work offline. Naksha says it can't answer instead of guessing.", color: "bg-[#e6dcff]", tilt: "-rotate-2" },
];

function AboutPage() {
  const ref = useReveal();
  return (
    <div ref={ref} className="bg-desk px-4 pb-16 pt-12 sm:px-6">
      <SketchDefs />
      <article className="paper relative mx-auto max-w-4xl rounded-sm px-6 pb-16 pt-12 shadow-[0_30px_60px_-30px_rgba(40,40,30,0.45)] sm:pl-24 sm:pr-14">
        <Holes />
        <p className="font-hand text-xl text-maple">a short story, in doodles</p>
        <h1 className="font-hand text-6xl font-bold leading-none text-pine sm:text-7xl">Why we made D Ride</h1>
        <svg viewBox="0 0 300 14" className="mt-1 h-3 w-64 text-gold" aria-hidden>
          <path d="M2 9 Q80 2 150 8 T298 6" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>

        <ol className="mt-12 space-y-16">
          {BEATS.map((b, i) => (
            <li key={b.title} data-reveal className={cn("grid items-center gap-6 md:grid-cols-[1.25fr_1fr]", i % 2 === 1 && "md:[&>*:first-child]:order-2")}>
              <figure className={cn("tape relative bg-white p-3 shadow-md", b.tilt)}>{b.scene}</figure>
              <div>
                <p className="font-hand text-2xl text-maple">{i + 1}.</p>
                <h2 className="font-hand text-4xl font-bold leading-tight text-pine">{b.title}</h2>
                <p className="mt-2 font-pen text-lg leading-8 text-[#2f3a35]">{b.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </article>

      <article className="paper relative mx-auto mt-10 max-w-4xl rounded-sm px-6 pb-16 pt-12 shadow-[0_30px_60px_-30px_rgba(40,40,30,0.45)] sm:pl-24 sm:pr-14">
        <Holes />
        <h2 className="font-hand text-5xl font-bold text-pine">Questions we kept asking ourselves</h2>

        <section data-reveal className="mt-10">
          <Q n="1">Who is this for, and why do they need it?</Q>
          <p className="mt-2 font-pen text-lg leading-8">
            Students who get around Hanover without a car. Getting anywhere depends on knowing which app, which thread, which email, and that knowledge
            sits with people who've been here a while. D Ride hands it to everyone on day one.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {FOR.map((f, i) => (
              <li key={f} className={cn("rounded-full border-2 border-dashed border-pine/40 px-4 py-1 font-pen text-base", i % 2 ? "rotate-1" : "-rotate-1")}>
                {f}
              </li>
            ))}
          </ul>
        </section>

        <section data-reveal className="mt-14">
          <Q n="2">Where does AI help, and where does it stay human?</Q>
          <div className="relative mt-5 grid gap-8 sm:grid-cols-2 sm:gap-12">
            <svg viewBox="0 0 10 300" preserveAspectRatio="none" className="absolute left-1/2 top-0 hidden h-full w-3 -translate-x-1/2 sm:block" aria-hidden>
              <path d="M5 0 Q2 60 6 120 T4 240 T5 300" stroke="#2f3a35" strokeWidth="2" fill="none" strokeDasharray="6 7" />
            </svg>
            <div>
              <p className="font-hand text-3xl font-bold text-[#3a6fb0]">Naksha helps with…</p>
              <p className="font-pen text-sm text-muted-foreground">things that are looking up and typing</p>
              <ul className="mt-3 space-y-2 font-pen text-lg">
                {HELPS.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="text-[#3a6fb0]">→</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-hand text-3xl font-bold text-maple">People decide…</p>
              <p className="font-pen text-sm text-muted-foreground">anything about trust, safety, or you</p>
              <ul className="mt-3 space-y-2 font-pen text-lg">
                {HUMAN.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="text-maple">✋</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section data-reveal className="mt-14">
          <Q n="3">What could go wrong, and what do we do about it?</Q>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {RISKS.map((r) => (
              <li key={r.worry} className={cn("p-5 shadow-[3px_6px_12px_-6px_rgba(0,0,0,0.35)]", r.color, r.tilt)}>
                <p className="font-hand text-2xl font-bold leading-tight">“{r.worry}”</p>
                <p className="mt-2 font-pen text-base leading-6">{r.answer}</p>
              </li>
            ))}
          </ul>
        </section>

        <section data-reveal className="mt-14">
          <Q n="4">Does it help people, or decide for them?</Q>
          <p className="mt-3 font-hand text-4xl font-bold leading-tight text-pine">
            Naksha never says yes for you.
          </p>
          <p className="mt-2 font-pen text-lg leading-8">
            It never accepts a ride, picks a driver, shares where you are, or files a report. It saves you the searching and the typing, then hands you
            the choice, with a Confirm button or a spoken “yes”.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/ask" className="inline-flex items-center gap-2 rounded-full bg-pine px-6 py-3 font-bold text-pine-foreground lift">
              Talk to Naksha <ArrowRight className="size-4" />
            </Link>
            <Link to="/bus" className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-pine ring-2 ring-pine/30">
              See the next bus
            </Link>
          </div>
        </section>
      </article>
    </div>
  );
}

function Q({ n, children }: { n: string; children: ReactNode }) {
  return (
    <h3 className="flex items-baseline gap-3 font-hand text-3xl font-bold text-[#2f3a35] sm:text-4xl">
      <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-maple text-2xl text-maple">{n}</span>
      {children}
    </h3>
  );
}

function Holes() {
  return (
    <div className="absolute inset-y-10 left-5 hidden flex-col justify-around sm:flex" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="size-5 rounded-full bg-desk shadow-[inset_0_2px_3px_rgba(0,0,0,0.25)]" />
      ))}
    </div>
  );
}
