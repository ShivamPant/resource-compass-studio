import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bell, Car, Check, Compass, Headphones, Mic, Square, Volume2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askAssistant, type Action } from "@/lib/assistant.functions";
import { isSafetyConcern } from "@/lib/safety";
import { answerLocally } from "@/lib/naksha-kb";
import { useStore } from "@/lib/store";
import { departures, fmtTime, getRoute, ROUTES } from "@/lib/schedule";
import { useVoice } from "@/hooks/use-voice";
import { AiChip } from "@/components/AppShell";
import { SosCard } from "@/components/SosCard";
import { cn } from "@/lib/utils";

export type Msg =
  | { role: "user"; content: string; voice?: boolean }
  | { role: "assistant"; content: string; action: Action; status?: "confirmed" | "declined" | "invalid"; byVoice?: boolean; source?: "kb" | "ai" }
  | { role: "note"; content: string }
  | { role: "sos" }
  | { role: "error"; content: string };

const SUGGESTIONS = ["When's the next bus to DHMC?", "Remind me before the coach to Logan", "I need a ride to Lebanon on Saturday", "I think I'm being followed"];

const GREETING = "Hi, I'm Naksha. Ask me when the next bus is, or tell me where you need to be. I'll draft reminders and ride requests, and nothing happens until you say yes.";

const FAILURES = {
  setup: "I can't reach my AI from this copy of the app, so I'm sticking to what I know: bus times, reminders and ride requests. Try “next bus to DHMC” or “remind me before the coach”.",
  busy: "Lots of people are asking me things right now. Give it a minute and try again.",
  unclear: "I couldn't come up with a good answer to that. Could you say it another way?",
  network: "I couldn't reach the server. Check your connection and try again.",
};

// A spoken yes/no to a pending card is the student's own decision, parsed here, never by the model.
const YES = /^(yes|yeah|yep|yup|sure|confirm|confirmed|do it|go ahead|set it|please do|ok(ay)?)\b/i;
const NO = /^(no|nope|nah|not now|cancel|don't|do not|never mind|skip)\b/i;

export function AskChat({ variant = "page" }: { variant?: "page" | "landing" }) {
  const { now, addReminder, addPost, online } = useStore();
  const ask = useServerFn(askAssistant);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const handsFreeRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const landing = variant === "landing";

  const voice = useVoice((transcript) => void send(transcript, true));

  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);

  useEffect(() => {
    // Don't move the page on first render; on the landing page only the chat box scrolls.
    if (msgs.length === 0 && !voice.interim) return;
    if (landing) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    else endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs, busy, voice.interim, landing]);

  /** Say a reply when the turn came from voice, then keep listening in hands-free mode. */
  function reply(line: string, spoken: boolean) {
    if (!spoken && !handsFreeRef.current) return;
    voice.speak(line, () => {
      if (handsFreeRef.current) voice.start();
    });
  }

  function pendingIndex(list: Msg[]) {
    const i = list.length - 1;
    const m = list[i];
    return m && m.role === "assistant" && m.action && !m.status ? i : -1;
  }

  async function send(raw: string, fromVoice = false) {
    const content = raw.trim();
    if (!content || busy) return;
    voice.stop();
    setText("");
    const next: Msg[] = [...msgs, { role: "user", content, voice: fromVoice }];

    // Safety first: handled locally, instantly, without AI. Hands-free stops so the mic isn't left open.
    if (isSafetyConcern(content)) {
      setHandsFree(false);
      handsFreeRef.current = false;
      setMsgs([...next, { role: "sos" }]);
      if (fromVoice) voice.speak("This sounds serious. I've stopped so you can reach a person. Call 911, or Dartmouth Safety and Security, using the buttons on screen.");
      return;
    }

    const p = pendingIndex(msgs);
    if (p >= 0 && content.split(/\s+/).length <= 5 && (YES.test(content) || NO.test(content))) {
      const ok = YES.test(content);
      const said = decide(p, ok, next, true);
      reply(said, fromVoice);
      return;
    }

    // Common questions are answered straight from the timetable: instant, offline, no AI involved.
    const local = answerLocally(content, now);
    if (local) {
      setMsgs([...next, { role: "assistant", content: local.reply, action: local.action, source: "kb" }]);
      reply(local.reply, fromVoice);
      return;
    }

    if (!online) {
      setMsgs([...next, { role: "error", content: "You're offline, so I can only answer bus times, reminders and ride requests right now." }]);
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
          departures: ROUTES.map((r) => `${r.id} | ${r.name} | ${r.from} → ${r.to}: ${departures(now, 4, r).map((d) => fmtTime(d.at)).join(", ")}`),
          nowLabel: new Date(now).toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit" }),
        },
      });
      if (!res.ok) {
        const line = FAILURES[res.failure ?? "unclear"];
        setMsgs((m) => [...m, { role: "error", content: line }]);
        if (fromVoice || handsFreeRef.current) voice.speak(line);
        return;
      }
      setMsgs((m) => [...m, { role: "assistant", content: res.reply, action: res.action, source: "ai" }]);
      reply(res.reply, fromVoice);
    } catch {
      setMsgs((m) => [...m, { role: "error", content: FAILURES.network }]);
      if (fromVoice || handsFreeRef.current) voice.speak(FAILURES.network);
    } finally {
      setBusy(false);
      if (!fromVoice) inputRef.current?.focus({ preventScroll: true });
    }
  }

  /** Apply or decline a drafted action. Returns a sentence to say back. */
  function decide(i: number, ok: boolean, base: Msg[] = msgs, byVoice = false): string {
    const m = base[i];
    if (!m || m.role !== "assistant" || !m.action) return "";
    let status: "confirmed" | "declined" | "invalid" = ok ? "confirmed" : "declined";
    let said = ok ? "Done." : "Okay, I won't.";
    if (ok && m.action.type === "reminder") {
      const a = m.action;
      const route = getRoute(a.route);
      const dep = departures(now, 8, route).find((d) => fmtTime(d.at) === a.departure);
      if (dep) {
        addReminder({ routeId: route.id, departureAt: dep.at, leadMin: a.leadMinutes || 10, source: "ai" });
        said = `Done. I'll nudge you ${a.leadMinutes || 10} minutes before the ${a.departure} ${route.short}.`;
      } else {
        // The model proposed a time that isn't on the timetable. Refuse rather than guess.
        status = "invalid";
        said = `I couldn't find a ${a.departure} ${route.short} on the timetable, so I didn't set anything. Check the Bus tab for real times.`;
      }
    }
    if (ok && m.action.type === "ride_request") {
      const a = m.action;
      addPost({ kind: "need", name: "You", mine: true, from: "Hanover", to: a.destination, when: a.when, seats: Math.max(1, Number(a.seats) || 1) });
      said = `Posted to Community. When people offer, you choose who to ride with.`;
    }
    const updated = base.map((x, j) => (j === i && x.role === "assistant" ? { ...x, status, byVoice } : x));
    setMsgs(byVoice ? [...updated, { role: "note", content: said }] : updated);
    return said;
  }

  function toggleHandsFree() {
    if (handsFree) {
      setHandsFree(false);
      handsFreeRef.current = false;
      voice.stop();
      voice.stopSpeaking();
    } else {
      setHandsFree(true);
      handsFreeRef.current = true;
      voice.start();
    }
  }

  const shown = voice.listening ? voice.interim : text;
  const status = voice.listening ? "Listening…" : busy ? "Thinking…" : voice.speaking ? "Speaking…" : handsFree ? "Hands-free is on. Tap the mic to talk." : online ? "Here to help" : "Offline";

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", !landing && "rounded-3xl bg-card shadow-lift ring-1 ring-border")}>
      {!landing && (
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <NakshaAvatar active={voice.speaking || busy} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold leading-tight text-pine">Naksha</p>
            <p className="truncate text-xs text-muted-foreground" aria-live="polite">
              {status}
            </p>
          </div>
          {voice.supported && (
            <button
              onClick={toggleHandsFree}
              aria-pressed={handsFree}
              className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1", handsFree ? "bg-pine text-pine-foreground ring-pine" : "ring-border hover:bg-muted")}
            >
              <Headphones className="size-3.5" /> {handsFree ? "Hands-free on" : "Talk hands-free"}
            </button>
          )}
        </div>
      )}

      <div ref={listRef} className={cn("flex-1 space-y-4", landing ? "max-h-64 overflow-y-auto pr-1" : "px-5 py-5")}>
        {!landing && <NakshaBubble>{GREETING}</NakshaBubble>}
        {msgs.length === 0 && (
          <div className={cn("flex flex-wrap gap-2", !landing && "pl-11")}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className={cn(
                  "rounded-full text-left font-semibold text-pine ring-1 ring-border transition-colors hover:bg-secondary",
                  landing ? "bg-background/80 px-3 py-1.5 text-xs" : "bg-background px-3.5 py-2 text-sm",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => {
          if (m.role === "user")
            return (
              <div key={i} className="ml-auto flex max-w-[85%] flex-col items-end">
                <div className="rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">{m.content}</div>
                {m.voice && <span className="mt-1 text-[11px] text-muted-foreground">Heard by voice. Not right? Type it instead.</span>}
              </div>
            );
          if (m.role === "sos")
            return (
              <div key={i} className="space-y-2">
                <p className="text-sm">This sounds serious. I've stepped aside so you can reach a person right away.</p>
                <SosCard compact />
              </div>
            );
          if (m.role === "error")
            return (
              <p key={i} className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                {m.content}
              </p>
            );
          if (m.role === "note") return <NakshaBubble key={i}>{m.content}</NakshaBubble>;
          return (
            <div key={i} className="space-y-2">
              <NakshaBubble onPlay={() => voice.speak(m.content)}>{m.content}</NakshaBubble>
              {m.source === "kb" && <p className={cn("-mt-1 text-[11px] text-muted-foreground", !landing && "pl-11")}>From the D Ride timetable, no AI used</p>}
              {m.action && (
                <div className={cn(!landing && "pl-11")}>
                  <ConfirmCard action={m.action} status={m.status} byVoice={m.byVoice} fromKb={m.source === "kb"} onDecide={(ok) => decide(i, ok)} />
                </div>
              )}
            </div>
          );
        })}
        {voice.listening && (
          <div className="ml-auto flex max-w-[85%] items-center gap-2 rounded-2xl rounded-br-md bg-primary/10 px-4 py-2.5 text-pine">
            <Bars level={voice.level} />
            <span className="italic">{voice.interim || (voice.level > 0.08 ? "Hearing you…" : "Listening… start talking")}</span>
          </div>
        )}
        {busy && (
          <div className={cn("flex items-center gap-1.5 text-muted-foreground", !landing && "pl-11")} aria-label="Naksha is thinking">
            {[0, 150, 300].map((d) => (
              <span key={d} className="size-2 animate-bounce rounded-full bg-primary/50" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className={cn(!landing && "border-t px-4 pb-4 pt-3")}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(shown);
          }}
          className={cn("flex items-end gap-2 rounded-2xl p-2 ring-1 ring-border", landing ? "mt-4 bg-background/90 shadow-sm" : "bg-background")}
        >
          <button
            type="button"
            aria-label={voice.listening ? "Stop listening" : "Talk to Naksha"}
            aria-pressed={voice.listening}
            disabled={busy || !voice.supported}
            title={voice.supported ? (voice.listening ? "Stop listening" : "Talk to Naksha") : "Voice needs Chrome, Edge or Safari"}
            onClick={voice.toggle}
            className={cn(
              "relative grid size-11 shrink-0 place-items-center rounded-xl transition-colors disabled:opacity-40",
              voice.listening ? "bg-maple text-white" : "bg-secondary text-primary hover:bg-accent",
            )}
          >
            {voice.listening && <span className="absolute inset-0 animate-ping rounded-xl bg-maple/40" />}
            {voice.listening ? <Square className="relative size-4 fill-current" /> : <Mic className="size-5" />}
          </button>
          <textarea
            ref={inputRef}
            value={shown}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(shown);
              }
            }}
            readOnly={voice.listening}
            rows={1}
            aria-label="Message Naksha"
            placeholder={voice.listening ? "Listening… pause when you're done" : "Ask Naksha about a bus or a ride"}
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base outline-none"
          />
          {voice.speaking ? (
            <button type="button" aria-label="Stop speaking" onClick={voice.stopSpeaking} className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
              <Square className="size-4 fill-current" />
            </button>
          ) : (
            <button aria-label="Send" disabled={busy || !shown.trim()} className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40">
              <ArrowUp className="size-5" />
            </button>
          )}
        </form>
        {voice.error ? (
          <p className="mt-2 text-xs text-muted-foreground">{voice.error}</p>
        ) : (
          !landing && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Naksha looks things up and drafts. It can't accept rides, pick drivers, share your details or handle emergencies.
            </p>
          )
        )}
      </div>
    </div>
  );
}

export function NakshaAvatar({ active, size = "md" }: { active?: boolean; size?: "sm" | "md" }) {
  return (
    <span className={cn("relative grid shrink-0 place-items-center rounded-full bg-gold text-gold-foreground", size === "md" ? "size-10" : "size-8")}>
      {active && <span className="absolute inset-0 animate-ping rounded-full bg-gold/50" />}
      <Compass className={cn("relative", size === "md" ? "size-5" : "size-4")} />
    </span>
  );
}

function NakshaBubble({ children, onPlay }: { children: string; onPlay?: () => void }) {
  return (
    <div className="flex max-w-[92%] items-start gap-3">
      <NakshaAvatar size="sm" />
      <div className="rounded-2xl rounded-tl-md bg-secondary/70 px-4 py-2.5 leading-relaxed text-foreground">
        {children}
        {onPlay && (
          <button type="button" aria-label="Play reply aloud" onClick={onPlay} className="ml-1.5 inline-grid translate-y-0.5 place-items-center rounded-full p-0.5 text-muted-foreground hover:text-foreground">
            <Volume2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Live microphone level, so the student can see they're being heard. */
function Bars({ level }: { level: number }) {
  return (
    <span className="flex h-5 items-end gap-0.5" aria-hidden>
      {[0.55, 0.85, 1, 0.75, 0.5].map((k, i) => (
        <span key={i} className="w-1 rounded-full bg-maple transition-[height] duration-75" style={{ height: `${Math.max(18, Math.min(100, level * k * 140))}%` }} />
      ))}
    </span>
  );
}

function ConfirmCard({ action, status, byVoice, fromKb, onDecide }: { action: NonNullable<Action>; status?: string | undefined; byVoice?: boolean | undefined; fromKb?: boolean; onDecide: (ok: boolean) => void }) {
  const isReminder = action.type === "reminder";
  const route = isReminder ? getRoute(action.route) : null;
  return (
    <div className="max-w-md rounded-2xl bg-background p-4 ring-1 ring-border">
      {fromKb ? <AiChip>Draft from the timetable. Review before confirming</AiChip> : <AiChip />}
      <div className="mt-3 flex items-start gap-3">
        {isReminder ? <Bell className="mt-0.5 size-5 text-primary" /> : <Car className="mt-0.5 size-5 text-primary" />}
        <div>
          {action.type === "reminder" && route ? (
            <>
              <p className="font-semibold">
                Remind me for the {action.departure} {route.short}
              </p>
              <p className="text-sm text-muted-foreground">
                {action.leadMinutes || 10} min before, from {route.from} to {route.to}
              </p>
            </>
          ) : action.type === "ride_request" ? (
            <>
              <p className="font-semibold">Ask for a seat to {action.destination}</p>
              <p className="text-sm text-muted-foreground">
                {action.when} · {action.seats} seat{action.seats === 1 ? "" : "s"} · goes on the Community board
              </p>
            </>
          ) : null}
        </div>
      </div>
      {status === "confirmed" ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Check className="size-4" />
          {byVoice ? "You said yes." : "Confirmed."}{" "}
          {isReminder ? (
            <Link to="/bus" search={route ? { route: route.id } : {}} className="underline">
              See it on Bus
            </Link>
          ) : (
            <Link to="/community" className="underline">
              You pick your driver in Community
            </Link>
          )}
        </p>
      ) : status === "invalid" ? (
        <p className="mt-3 text-sm text-human-foreground">That time isn't on the timetable, so nothing was set.</p>
      ) : status === "declined" ? (
        <p className="mt-3 text-sm text-muted-foreground">Not added.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => onDecide(false)} className="rounded-xl py-2.5 text-sm font-semibold ring-1 ring-border">
              Not now
            </button>
            <button onClick={() => onDecide(true)} className="rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
              Confirm
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Or just say "yes" or "not now".</p>
        </>
      )}
    </div>
  );
}
