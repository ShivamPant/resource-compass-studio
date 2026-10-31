// Naksha's built-in answers. Deterministic, instant and offline: common questions (including every
// suggestion chip) are answered from the timetable here, and only anything else goes to the AI.
// Like the AI, it only ever PROPOSES actions; the student still confirms.
import type { Action } from "@/lib/assistant.functions";
import { departures, fmtTime, fmtWait, getRoute, ROUTES, type Route } from "@/lib/schedule";

export type LocalAnswer = { reply: string; action: Action };

// Order matters: "west lebanon" must win over plain "lebanon".
const PLACES: [RegExp, string][] = [
  [/\b(west leb(anon)?|w\.? leb|target|walmart|kohl'?s|plaza|shopping|groceries|price ?chopper|orange)\b/, "orange"],
  [/\b(logan|boston|airport|coach|south station|bos)\b/, "coach"],
  [/\b(dhmc|hospital|medical cent(er|re)|dartmouth health|clinic|lebanon|blue)\b/, "blue"],
  [/\b(juniper|summit|lyme r(oa)?d|grad housing)\b/, "juniper"],
];

export function routeFor(text: string): Route | null {
  const t = text.toLowerCase();
  const hit = PLACES.find(([re]) => re.test(t));
  return hit ? getRoute(hit[1]) : null;
}

const spoken = (ms: number) => fmtTime(ms).replace(":00", "").replace(" AM", " a.m.").replace(" PM", " p.m.");

function whenPhrase(text: string) {
  const t = text.toLowerCase();
  const day = t.match(/\b(today|tonight|tomorrow|this weekend|(next |this )?(mon|tues|wednes|thurs|fri|satur|sun)day)\b/)?.[0];
  const time = t.match(/\b(\d{1,2}(:\d{2})?\s?(am|pm|a\.m\.|p\.m\.))|\b(morning|afternoon|evening|noon)\b/)?.[0];
  return [day, time].filter(Boolean).join(", ");
}

function destinationOf(text: string) {
  const m = text.match(/\b(?:to|for|towards)\s+(?:the\s+)?([a-z][a-z .'&-]*?)(?=\s+(?:on|at|this|next|tomorrow|today|tonight|around|by|in|from)\b|[?.!,]|$)/i);
  if (!m?.[1]) return "";
  const dest = m[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
  return /^(Go|Get|Be|Ride|Me|Get There)$/i.test(dest) ? "" : dest;
}

export function answerLocally(raw: string, now: number): LocalAnswer | null {
  const text = raw.trim();
  const t = text.toLowerCase();
  if (!t) return null;

  if (/^(hi|hey|hello|yo|good (morning|afternoon|evening))\b/.test(t) && t.split(/\s+/).length <= 4)
    return { reply: "Hey. Where are you headed? I can find the next bus or set you a reminder.", action: null };
  if (/^(thanks|thank you|thx|ty|cheers)\b/.test(t)) return { reply: "Anytime. Safe travels.", action: null };
  if (/\b(what can you do|how do(es)? (this|naksha) work|help me use|who are you)\b/.test(t))
    return {
      reply: "I know the Juniper shuttle, the Blue and Orange lines and the Dartmouth Coach. Ask when the next bus is, and I can draft a reminder or a ride request for you to confirm.",
      action: null,
    };

  // Things that stay with people. Naksha points the way instead of doing them.
  if (/\b(accept|choose|pick)\b.*\b(ride|driver)\b|\bshare my (location|number|phone)\b|\breport (someone|a (post|person|driver))\b/.test(t))
    return { reply: "That part stays with you. Open the Community tab to pick your driver or share pickup details, and only the person you choose sees them.", action: null };

  if (/\b(book|ticket|tickets|reserve|reservation)\b/.test(t) && /\b(coach|logan|boston|bus)\b/.test(t))
    return { reply: "Dartmouth Coach seats are booked on dartmouthcoach.com. The Bus tab has a Book button when you pick the Coach, and I can still set you a reminder.", action: null };

  const route = routeFor(t);
  const wantsReminder = /\b(remind|reminder|alert|notify|nudge|ping me|wake me)\b/.test(t);
  const wantsRide = /\b(ride|lift|carpool|seat|drive me|anyone driving|someone to drive)\b/.test(t) && !/\bbus\b/.test(t);
  const asksBus = /\b(bus|shuttle|coach|next|when|leave|leaving|depart|schedule|times?|how do i get|get to|go to)\b/.test(t);

  if (wantsRide) {
    const dest = destinationOf(text);
    if (!dest) return { reply: "Sure. Where do you need to go, and when?", action: null };
    const when = whenPhrase(text) || "soon";
    const seats = Number(t.match(/\b(\d)\s+(seats?|people|of us)\b/)?.[1] ?? 1);
    return {
      reply: `I can post that to the Community board: a seat to ${dest}, ${when}. People offer, and you choose who you ride with. Want me to post it?`,
      action: { type: "ride_request", destination: dest, when, seats },
    };
  }

  if (wantsReminder || asksBus) {
    if (!route) {
      // A place we don't map to a route: leave it to the AI rather than answer the wrong thing.
      if (destinationOf(text)) return null;
      const soonest = ROUTES.map((r) => ({ r, dep: departures(now, 1, r)[0] }))
        .filter((x) => x.dep)
        .sort((a, b) => a.dep!.at - b.dep!.at)[0];
      return {
        reply: soonest
          ? `Where are you headed? The next bus out is the ${soonest.r.short} to ${soonest.r.to} at ${spoken(soonest.dep!.at)}.`
          : "Where are you headed? I can check the Juniper, Blue, Orange or the Coach.",
        action: null,
      };
    }
    const deps = departures(now, 3, route);
    const pick = /\b(after next|the one after|second)\b/.test(t) ? deps[1] : deps[0];
    if (!pick) return { reply: `The ${route.short} isn't running any more today.`, action: null };
    const lead = Number(t.match(/\b(\d{1,2})\s*(min|minutes)\b/)?.[1] ?? 10);
    const action: Action = { type: "reminder", route: route.id, departure: fmtTime(pick.at), leadMinutes: lead };
    const coachNote = route.bookUrl ? " You'll need a ticket from dartmouthcoach.com." : "";
    if (wantsReminder)
      return {
        reply: `The ${spoken(pick.at)} ${route.short} leaves ${route.from} in ${fmtWait(pick.at, now)}. I can nudge you ${lead} minutes before.${coachNote} Want me to set that?`,
        action,
      };
    const after = deps[1] && pick === deps[0] ? ` After that, ${spoken(deps[1].at)}.` : "";
    return {
      reply: `The next ${route.short} to ${route.to} leaves ${route.from} at ${spoken(pick.at)}, in ${fmtWait(pick.at, now)}.${after}${coachNote} Want a reminder?`,
      action,
    };
  }

  return null;
}
