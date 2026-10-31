import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "anthropic/claude-sonnet-5" as const;

async function askClaude(system: string, messages: { role: "user" | "assistant"; content: string }[]) {
  const { generateMessage } = await import("@lovable.dev/ai-gateway");
  const res = await generateMessage({ model: MODEL, max_tokens: 800, system, messages });
  const text = res.content
    .map((b) => (b.type === "text" ? (b as { text: string }).text : ""))
    .join("");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in model output");
  return JSON.parse(match[0]) as Record<string, unknown>;
}

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      messages: z
        .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
        .min(1)
        .max(30),
      departures: z.array(z.string()).max(10),
      nowLabel: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const system = `You are the D Ride assistant for Dartmouth students. Plain, warm, brief (1-3 sentences). No exclamation marks, no emojis.
Current time: ${data.nowLabel}. Upcoming Summit on Juniper shuttle departures to Dartmouth Green (demo timetable): ${data.departures.join(", ")}.
You may PROPOSE actions; a human always confirms. You never accept rides, file reports, or contact anyone.
If the user wants a bus reminder, propose one with a departure from the list.
If the user wants a ride or seat, propose a ride request draft.
Respond ONLY with JSON: {"reply": string, "action": null | {"type":"reminder","departure": "<exact time from list>","leadMinutes": number} | {"type":"ride_request","destination": string,"when": string,"seats": number}}`;
    try {
      const out = await askClaude(system, data.messages);
      return { ok: true as const, reply: String(out["reply"] ?? ""), action: (out["action"] ?? null) as Action };
    } catch (e) {
      console.error(e);
      return { ok: false as const, reply: "", action: null };
    }
  });

export type Action =
  | null
  | { type: "reminder"; departure: string; leadMinutes: number }
  | { type: "ride_request"; destination: string; when: string; seats: number };

export type TripDraft = {
  title: string | null;
  date: string | null;
  departTime: string | null;
  meetingPoint: string | null;
  destination: string | null;
  seats: string | null;
  organizer: string | null;
  cost: string | null;
};

export const draftTrip = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().min(10).max(8000) }))
  .handler(async ({ data }) => {
    const system = `Extract a student trip from an email. Only use facts stated in the email. If a field is not explicitly stated, use null. Never guess.
Respond ONLY with JSON: {"title":string|null,"date":string|null,"departTime":string|null,"meetingPoint":string|null,"destination":string|null,"seats":string|null,"organizer":string|null,"cost":string|null}`;
    try {
      const out = await askClaude(system, [{ role: "user", content: data.email }]);
      const keys = ["title", "date", "departTime", "meetingPoint", "destination", "seats", "organizer", "cost"] as const;
      const draft = Object.fromEntries(
        keys.map((k) => [k, out[k] == null || out[k] === "" ? null : String(out[k])]),
      ) as TripDraft;
      return { ok: true as const, draft };
    } catch (e) {
      console.error(e);
      return { ok: false as const, draft: null };
    }
  });
