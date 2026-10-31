import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bell, Car, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askAssistant, type Action } from "@/lib/assistant.functions";
import { isSafetyConcern } from "@/lib/safety";
import { useStore } from "@/lib/store";
import { departures, fmtTime } from "@/lib/schedule";
import { AiChip } from "@/components/AppShell";
import { SosCard } from "@/components/SosCard";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask · D Ride" },
      { name: "description", content: "Ask about buses and rides. AI drafts, you confirm." },
      { property: "og:title", content: "Ask · D Ride" },
      { property: "og:description", content: "Ask about buses and rides. AI drafts, you confirm." },
    ],
  }),
  component: AskPage,
});

type Msg =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; action: Action; status?: "confirmed" | "declined" }
  | { role: "sos" }
  | { role: "error"; content: string };

const SUGGESTIONS = [
  "Remind me before the bus after next",
  "I need a ride to Lebanon on Saturday",
  "I think I'm being followed",
];

function AskPage() {
  const { now, addReminder, online } = useStore();
  const ask = useServerFn(askAssistant);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!busy) inputRef.current?.focus();
  }, [msgs, busy]);

  async function send(raw: string) {
    const content = raw.trim();
    if (!content || busy) return;
    setText("");
    const next: Msg[] = [...msgs, { role: "user", content }];
    // Safety first: handled locally, instantly, without AI.
    if (isSafetyConcern(content)) {
      setMsgs([...next, { role: "sos" }]);
      return;
    }
    if (!online) {
      setMsgs([...next, { role: "error", content: "You're offline. The assistant needs a connection. Bus times still work." }]);
      return;
    }
    setMsgs(next);
    setBusy(true);
    const history = next
      .filter((m): m is Extract<Msg, { role: "user" | "assistant" }> => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await ask({
        data: {
          messages: history,
          departures: departures(now).map((d) => fmtTime(d.at)),
          nowLabel: new Date(now).toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit" }),
        },
      });
      if (!res.ok) throw new Error();
      setMsgs((m) => [...m, { role: "assistant", content: res.reply, action: res.action }]);
    } catch {
      setMsgs((m) => [...m, { role: "error", content: "The assistant didn't respond. Try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  }

  function decide(i: number, ok: boolean) {
    const m = msgs[i];
    if (!m || m.role !== "assistant" || !m.action) return;
    if (ok && m.action.type === "reminder") {
      const a = m.action;
      const dep = departures(now).find((d) => fmtTime(d.at) === a.departure);
      if (dep) addReminder({ departureAt: dep.at, leadMin: a.leadMinutes || 10, source: "ai" });
    }
    setMsgs((ms) => ms.map((x, j) => (j === i && x.role === "assistant" ? { ...x, status: ok ? "confirmed" : "declined" } : x)));
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-3xl flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Ask</h1>
        <p className="text-sm text-muted-foreground">Claude drafts. Nothing happens until you confirm.</p>
      </div>

      <div className="flex-1 space-y-4">
        {msgs.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Try asking</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="block w-full rounded-xl bg-card px-4 py-3 text-left text-sm ring-1 ring-border">
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => {
          if (m.role === "user")
            return (
              <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">
                {m.content}
              </div>
            );
          if (m.role === "sos")
            return (
              <div key={i} className="space-y-2">
                <p className="text-sm">This sounds serious. The assistant is paused so you can reach a person right away.</p>
                <SosCard compact />
              </div>
            );
          if (m.role === "error")
            return (
              <p key={i} className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                {m.content}
              </p>
            );
          return (
            <div key={i} className="space-y-2">
              <p className="max-w-[90%] leading-relaxed">{m.content}</p>
              {m.action && <ConfirmCard action={m.action} status={m.status} onDecide={(ok) => decide(i, ok)} />}
            </div>
          );
        })}
        {busy && <p className="animate-pulse text-sm text-muted-foreground">Thinking…</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="sticky bottom-4 mt-4 flex items-end gap-2 rounded-2xl bg-card p-2 shadow-sm ring-1 ring-border"
      >
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(text);
            }
          }}
          rows={1}
          aria-label="Message"
          placeholder="Ask about buses or rides"
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none"
        />
        <button aria-label="Send" disabled={busy || !text.trim()} className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40">
          <ArrowUp className="size-5" />
        </button>
      </form>
    </div>
  );
}

function ConfirmCard({ action, status, onDecide }: { action: NonNullable<Action>; status?: string; onDecide: (ok: boolean) => void }) {
  const isReminder = action.type === "reminder";
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <AiChip />
      <div className="mt-3 flex items-start gap-3">
        {isReminder ? <Bell className="mt-0.5 size-5 text-primary" /> : <Car className="mt-0.5 size-5 text-primary" />}
        <div>
          {action.type === "reminder" ? (
            <>
              <p className="font-semibold">Remind me for the {action.departure} bus</p>
              <p className="text-sm text-muted-foreground">{action.leadMinutes || 10} min before, Summit on Juniper</p>
            </>
          ) : (
            <>
              <p className="font-semibold">Request a seat to {action.destination}</p>
              <p className="text-sm text-muted-foreground">
                {action.when} · {action.seats} seat{action.seats === 1 ? "" : "s"} · posted to Help
              </p>
            </>
          )}
        </div>
      </div>
      {status === "confirmed" ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Check className="size-4" />
          {isReminder ? (
            <>Confirmed. <Link to="/" className="underline">See it on Bus</Link></>
          ) : (
            <>Posted. You choose who to ride with in <Link to="/help" className="underline">Help</Link>.</>
          )}
        </p>
      ) : status === "declined" ? (
        <p className="mt-3 text-sm text-muted-foreground">Not added.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => onDecide(false)} className="rounded-xl py-2.5 text-sm font-semibold ring-1 ring-border">
            Not now
          </button>
          <button onClick={() => onDecide(true)} className="rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
