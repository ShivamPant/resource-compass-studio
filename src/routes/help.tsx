import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flag } from "lucide-react";
import { HumanZone, DemoNote } from "@/components/AppShell";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help · D Ride" },
      { name: "description", content: "Ask the Dartmouth community for a ride or a seat." },
      { property: "og:title", content: "Help · D Ride" },
      { property: "og:description", content: "Ask the Dartmouth community for a ride or a seat." },
    ],
  }),
  component: HelpPage,
});

type Post = { id: string; name: string; text: string; when: string; offers: string[]; accepted?: string };

// DEMO DATA: sample community posts.
const SEED: Post[] = [
  { id: "p1", name: "Ava Chen '27", text: "Need a ride to Lebanon Hospital for a 9 AM appointment Friday.", when: "12 min ago", offers: ["Sam Ortiz '26", "Lena Park '25"] },
  { id: "p2", name: "Diego Alvarez '28", text: "Anyone driving to Boston Logan Sunday afternoon? Happy to split gas.", when: "1 hr ago", offers: [] },
];

function HelpPage() {
  const [posts, setPosts] = useState(SEED);
  const [text, setText] = useState("");
  const [reported, setReported] = useState<string[]>([]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ask the community</h1>
        <p className="text-sm text-muted-foreground">Replaces scattered Slack ride threads.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setPosts([{ id: `p${Date.now()}`, name: "You", text: text.trim(), when: "Just now", offers: [] }, ...posts]);
          setText("");
        }}
        className="rounded-2xl bg-card p-4 ring-1 ring-border"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          aria-label="Your request"
          placeholder="Where do you need to go, and when?"
          className="w-full resize-none rounded-xl bg-muted p-3 text-base outline-none focus:ring-2 focus:ring-ring"
        />
        <button disabled={!text.trim()} className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40">
          Request a seat
        </button>
      </form>

      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.when}</p>
            </div>
            <p className="mt-1">{p.text}</p>

            {p.offers.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No offers yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                <HumanZone label="Human zone: you choose your driver" />
                {p.offers.map((o) => (
                  <div key={o} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                    <span className="text-sm">{o} offered a seat</span>
                    {p.accepted === o ? (
                      <span className="text-sm font-semibold text-primary">Accepted</span>
                    ) : !p.accepted ? (
                      <button
                        onClick={() => setPosts(posts.map((x) => (x.id === p.id ? { ...x, accepted: o } : x)))}
                        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                      >
                        Accept
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <HumanZone label="Reports go to a person" />
              {reported.includes(p.id) ? (
                <span className="text-xs text-muted-foreground">Reported. A student moderator will review.</span>
              ) : (
                <button onClick={() => setReported([...reported, p.id])} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Flag className="size-3.5" /> Report
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <DemoNote>Posts and offers are sample data for this demo.</DemoNote>
    </div>
  );
}
