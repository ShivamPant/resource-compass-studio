import { createFileRoute } from "@tanstack/react-router";
import { Check, Hand } from "lucide-react";
import { AskChat } from "@/components/AskChat";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask Naksha · D Ride" },
      { name: "description", content: "Talk or type to Naksha about buses and rides. Naksha drafts, you decide." },
      { property: "og:title", content: "Ask Naksha · D Ride" },
      { property: "og:description", content: "Talk or type to Naksha about buses and rides. Naksha drafts, you decide." },
    ],
  }),
  component: AskPage,
});

const CAN = ["Find the next bus on any route", "Draft a reminder for you to approve", "Draft a ride request for Community", "Answer out loud, hands-free"];
const CANT = ["Accepting a ride and picking your driver", "Sharing your location or number", "Reporting someone", "Emergencies skip Naksha and go straight to 911"];

function AskPage() {
  return (
    <>
      <PageTitle kicker="Naksha means “map”" title="Ask Naksha" sub="Talk or type, the way you'd ask a friend who knows the buses. Naksha drafts things for you. You say yes before anything happens." />
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_17rem]">
        <div className="flex min-h-[calc(100vh-18rem)] flex-col">
          <AskChat />
        </div>
        <aside className="space-y-4 text-sm lg:sticky lg:top-24">
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <p className="font-semibold">Naksha can</p>
            <ul className="mt-2 space-y-1.5">
              {CAN.map((c) => (
                <li key={c} className="flex gap-2 text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-human/60 p-5">
            <p className="font-semibold text-human-foreground">Stays with you</p>
            <ul className="mt-2 space-y-1.5">
              {CANT.map((c) => (
                <li key={c} className="flex gap-2 text-human-foreground/90">
                  <Hand className="mt-0.5 size-4 shrink-0" /> {c}
                </li>
              ))}
            </ul>
          </div>
          <p className="px-1 text-xs text-muted-foreground">
            Voice uses your browser's speech engine. If Naksha mishears you, the words show up on screen first and nothing happens until you confirm.
          </p>
        </aside>
      </div>
    </>
  );
}
