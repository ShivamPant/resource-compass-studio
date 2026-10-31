// Browser speech helpers. Recognition and playback use the browser's own engines; transcribed
// text still goes through the same safety check as typed messages before any AI call.

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export type SpeechAlternative = { transcript: string; confidence: number };

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<SpeechAlternative> & { isFinal: boolean }>;
};

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Local names generic speech models get wrong. Each entry: what it hears -> what was meant.
const CAMPUS_FIXES: [RegExp, string][] = [
  [/\b(d\.? ?h\.? ?m\.? ?c\.?|dhmc|d h m see|dee h m c)\b/gi, "DHMC"],
  [/\b(guy ?zel|gisele|geisel|giselle|gizelle)\b/gi, "Geisel"],
  [/\b(summit on (juniper|jupiter|junipero)|summit on june o?per)\b/gi, "Summit on Juniper"],
  [/\b(juniper|jupiter) shuttle\b/gi, "Juniper shuttle"],
  [/\b(thayer|thier|thayor) (school|engineering)\b/gi, "Thayer $2"],
  [/\b(advanced transit|advance transits)\b/gi, "Advance Transit"],
  [/\b(west lebanon|west leb)\b/gi, "West Lebanon"],
  [/\b(moose ?a? ?lock(ee|y|ie)|moosilauke|moose la key)\b/gi, "Moosilauke"],
  [/\b(dartmouth coach|dartmouth couch)\b/gi, "Dartmouth Coach"],
  [/\b(the hop|hop kins)\b/gi, "the Hop"],
];

const CAMPUS_WORDS = /\b(bus|shuttle|juniper|summit|dhmc|lebanon|hanover|logan|boston|coach|blue|orange|ride|remind|tuck|thayer|geisel|green|trip|seat)\b/gi;

export function fixCampusTerms(text: string) {
  return CAMPUS_FIXES.reduce((t, [re, to]) => t.replace(re, to), text).replace(/\s+/g, " ").trim();
}

/** Prefer the alternative that mentions the most campus words, then the most confident one. */
export function pickBest(alts: ArrayLike<SpeechAlternative>) {
  let best = "";
  let bestScore = -1;
  for (let i = 0; i < alts.length; i++) {
    const a = alts[i];
    if (!a) continue;
    const hits = fixCampusTerms(a.transcript).match(CAMPUS_WORDS)?.length ?? 0;
    const score = (a.confidence || 0.5) + hits * 0.15;
    if (score > bestScore) {
      best = a.transcript;
      bestScore = score;
    }
  }
  return best;
}

export function speechSynthesisSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let chosenVoice: SpeechSynthesisVoice | null | undefined;

// Natural-sounding English voices first; the default voice on many systems is robotic.
function pickVoice() {
  if (chosenVoice !== undefined) return chosenVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefs = [/natural/i, /google us english/i, /samantha/i, /aria|jenny|zira/i, /en-us/i];
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  chosenVoice = prefs.map((p) => english.find((v) => p.test(`${v.name} ${v.lang}`))).find(Boolean) ?? english[0] ?? null;
  return chosenVoice;
}

/** Speak text aloud. onEnd fires when playback finishes or fails, so callers can listen again. */
export function speak(text: string, onEnd?: () => void) {
  if (!speechSynthesisSupported() || !text.trim()) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text.trim());
  utter.lang = "en-US";
  utter.rate = 1.03;
  utter.pitch = 1;
  const voice = pickVoice();
  if (voice) utter.voice = voice;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onEnd?.();
  };
  utter.onend = finish;
  utter.onerror = finish;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (!speechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
}

if (speechSynthesisSupported()) {
  // Voices load asynchronously in Chrome; reset the cached pick once they arrive.
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    chosenVoice = undefined;
  });
}
