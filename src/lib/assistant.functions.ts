import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "anthropic/claude-sonnet-5" as const;

type Failure = "setup" | "busy" | "unclear";

class AskError extends Error {
  constructor(readonly kind: Failure, message: string) {
    super(message);
  }
}

/**
 * One Claude call that must come back as JSON matching `schema`. Structured outputs guarantee the
 * shape, so there's no scraping JSON out of prose. Thinking is off: these are short, latency-sensitive
 * replies, and on Sonnet 5 thinking is otherwise on by default and spends the max_tokens budget.
 */
async function askClaude(system: string, messages: { role: "user" | "assistant"; content: string }[], schema: Record<string, unknown>) {
  const gw = await import("@lovable.dev/ai-gateway");
  let res;
  try {
    res = await gw.generateMessage({
      model: MODEL,
      max_tokens: 2000,
      thinking: { type: "disabled" },
      output_config: { format: { type: "json_schema", schema } },
      system,
      messages,
    });
  } catch (e) {
    if (e instanceof gw.AuthenticationError || e instanceof gw.ConfigurationError || e instanceof gw.PermissionDeniedError)
      throw new AskError("setup", String(e));
    if (e instanceof gw.RateLimitError || e instanceof gw.PaymentRequiredError) throw new AskError("busy", String(e));
    throw e;
  }
  if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens") throw new AskError("unclear", `stop_reason ${res.stop_reason}`);
  const text = res.content.map((b) => (b.type === "text" ? (b as { text: string }).text : "")).join("");
  return JSON.parse(text) as Record<string, unknown>;
}

function failure(e: unknown): Failure {
  console.error(e);
  return e instanceof AskError ? e.kind : "unclear";
}

// Flat schema: one object with every field present keeps structured outputs simple and robust.
const REPLY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "action_type", "route", "departure", "lead_minutes", "destination", "when", "seats"],
  properties: {
    reply: { type: "string", description: "What Naksha says. 1-2 short spoken sentences." },
    action_type: { type: "string", enum: ["none", "reminder", "ride_request"] },
    route: { type: "string", description: "Route id for a reminder (juniper, blue, orange, coach), else empty." },
    departure: { type: "string", description: "Departure time copied exactly from that route's list, e.g. \"8:40 AM\", else empty." },
    lead_minutes: { type: "integer", description: "Minutes before departure to remind, default 10, else 0." },
    destination: { type: "string", description: "Ride request destination, else empty." },
    when: { type: "string", description: "Ride request day and time in the student's words, else empty." },
    seats: { type: "integer", description: "Seats needed for a ride request, else 0." },
  },
} as const;

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      messages: z
        .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
        .min(1)
        .max(30),
      departures: z.array(z.string().max(400)).max(10),
      nowLabel: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const system = `You are Naksha ("map" in Hindi), the voice and chat guide inside D Ride, an app that helps Dartmouth students get around Hanover and the Upper Valley without a car.

How you talk: like a friendly upperclassman who knows the buses. Plain, warm and short. Your replies are often read aloud, so use one or two short sentences, no lists, no emojis, no exclamation marks. Say times the way people say them ("the 8:40"). Answer the question that was asked, directly, using the timetable below. If one detail is genuinely missing (where they're headed, which day), ask one short question rather than guessing. Small talk is fine; answer briefly and steer back to getting around.

Current time: ${data.nowLabel}.
Upcoming departures (demo timetable), one route per line as "id | name | from → to: times":
${data.departures.join("\n")}

Which route goes where:
- juniper: Summit on Juniper (grad housing on Lyme Rd) to Dartmouth Green, campus.
- blue: Dartmouth Green to DHMC in Lebanon (the hospital, Geisel clinical sites).
- orange: Dartmouth Green to West Lebanon Plaza (Target, Walmart, shopping).
- coach: Hanover Inn to Boston Logan airport (Dartmouth Coach; needs a ticket booked on dartmouthcoach.com).

What you can do: look up times, and PROPOSE a bus reminder or a ride request. The student confirms with a tap or by saying yes, so when you propose one, end your reply by asking, e.g. "Want me to set that?"
- Bus reminder: set action_type "reminder", the route id, and a departure copied exactly, character for character, from that route's list. Default lead_minutes to 10 unless they say otherwise.
- Ride or seat (somewhere the buses don't go, or they ask for a ride): set action_type "ride_request" with destination, when and seats. It goes on the Community board, where they choose their driver.
- Otherwise action_type is "none". Fill unused fields with "" or 0.
Only use times from the list. If they ask about a time or place the list doesn't cover, say you don't have it rather than inventing one.

What stays with the student: you never accept rides, pick drivers, share anyone's location or number, report anyone, or contact anyone. If asked, say kindly that part is theirs and point to the Community tab. If someone sounds unsafe, tell them to call 911 or Dartmouth Safety and Security at 603-646-4000.`;
    try {
      const out = await askClaude(system, data.messages, REPLY_SCHEMA);
      const type = out["action_type"];
      const action: Action =
        type === "reminder" && out["departure"]
          ? { type: "reminder", route: String(out["route"] ?? ""), departure: String(out["departure"]), leadMinutes: Number(out["lead_minutes"]) || 10 }
          : type === "ride_request" && out["destination"]
            ? { type: "ride_request", destination: String(out["destination"]), when: String(out["when"] ?? ""), seats: Number(out["seats"]) || 1 }
            : null;
      return { ok: true as const, reply: String(out["reply"] ?? ""), action, failure: null };
    } catch (e) {
      return { ok: false as const, reply: "", action: null, failure: failure(e) };
    }
  });

export type Action =
  | null
  | { type: "reminder"; route?: string; departure: string; leadMinutes: number }
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

const TRIP_KEYS = ["title", "date", "departTime", "meetingPoint", "destination", "seats", "organizer", "cost"] as const;

const TRIP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [...TRIP_KEYS],
  properties: Object.fromEntries(TRIP_KEYS.map((k) => [k, { type: ["string", "null"] }])),
};

export const draftTrip = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().min(10).max(8000) }))
  .handler(async ({ data }) => {
    const system = `Extract a student trip listing from an email. Only use facts the email states. If a field is not explicitly stated, use null. Never guess or infer missing details: a person fills them in.
Fields: title (short trip name), date (as written), departTime, meetingPoint, destination, seats (as written, e.g. "Van holds 12"), organizer (name as signed), cost.`;
    try {
      const out = await askClaude(system, [{ role: "user", content: data.email }], TRIP_SCHEMA);
      const draft = Object.fromEntries(TRIP_KEYS.map((k) => [k, out[k] == null || out[k] === "" ? null : String(out[k])])) as TripDraft;
      return { ok: true as const, draft, failure: null };
    } catch (e) {
      return { ok: false as const, draft: null, failure: failure(e) };
    }
  });
