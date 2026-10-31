import { useCallback, useEffect, useRef, useState } from "react";
import {
  fixCampusTerms,
  getSpeechRecognitionCtor,
  pickBest,
  speak as speakAloud,
  stopSpeaking,
  type SpeechRecognitionLike,
} from "@/lib/speech";

// How long a pause ends the turn. Short enough to feel responsive, long enough for "um".
const SILENCE_MS = 1300;
const MAX_TURN_MS = 20000;

/** The browser's own English variant (en-IN, en-GB…) recognises that accent far better than en-US. */
function recognitionLang() {
  const lang = typeof navigator !== "undefined" ? navigator.language : "";
  return /^en-/i.test(lang) ? lang : "en-US";
}

/**
 * Push-to-talk speech recognition that keeps listening through short pauses and hands back
 * one cleaned-up transcript per turn. Also reports a live mic level and speaks replies.
 */
export function useVoice(onFinal: (transcript: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  const turn = useRef({ text: "", delivered: false, retried: false, retry: false });
  const silence = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cap = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const meter = useRef<{ stream: MediaStream; ctx: AudioContext; raf: number } | null>(null);
  onFinalRef.current = onFinal;

  const clearTimers = () => {
    clearTimeout(silence.current);
    clearTimeout(cap.current);
  };

  const stopMeter = () => {
    const m = meter.current;
    meter.current = null;
    if (!m) return;
    cancelAnimationFrame(m.raf);
    m.stream.getTracks().forEach((t) => t.stop());
    void m.ctx.close().catch(() => {});
    setLevel(0);
  };

  useEffect(() => {
    setSupported(!!getSpeechRecognitionCtor());
    return () => {
      clearTimers();
      recRef.current?.abort();
      recRef.current = null;
      stopMeter();
      stopSpeaking();
    };
  }, []);

  /** End the turn and hand over whatever was heard, exactly once. */
  const finish = useCallback(() => {
    clearTimers();
    const t = turn.current;
    recRef.current?.stop();
    recRef.current = null;
    stopMeter();
    setListening(false);
    setInterim("");
    if (t.delivered) return;
    t.delivered = true;
    const text = fixCampusTerms(t.text);
    if (text) onFinalRef.current(text);
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    turn.current.delivered = true;
    recRef.current?.abort();
    recRef.current = null;
    stopMeter();
    setListening(false);
    setInterim("");
  }, []);

  /** One recognition session. Called again once if Chrome's speech service drops. */
  const listen = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()!;
    const rec = new Ctor();
    rec.lang = recognitionLang();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    const before = turn.current.text ? `${turn.current.text} ` : "";
    rec.onresult = (ev) => {
      let finals = "";
      let live = "";
      for (let i = 0; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (!r) continue;
        if (r.isFinal) finals += `${pickBest(r)} `;
        else live += `${r[0]?.transcript ?? ""} `;
      }
      const text = `${before}${finals}${live}`.replace(/\s+/g, " ").trim();
      turn.current.text = text;
      setInterim(fixCampusTerms(text));
      clearTimeout(silence.current);
      silence.current = setTimeout(finish, SILENCE_MS);
    };
    rec.onerror = (ev) => {
      if (ev.error === "aborted") return;
      if (ev.error === "network" && !turn.current.retried) {
        turn.current.retried = true;
        turn.current.retry = true;
        return;
      }
      if (ev.error === "no-speech") setError("I didn't hear anything. Tap the mic and talk when you're ready.");
      else if (ev.error === "not-allowed" || ev.error === "service-not-allowed")
        setError("The microphone is blocked for this site. Click the mic or lock icon in the address bar, allow it, then try again.");
      else if (ev.error === "audio-capture") setError("No microphone was found. Check it's plugged in and selected in your system settings.");
      else if (ev.error === "network") setError("The browser's speech service couldn't be reached. Check your connection, or type instead.");
      else if (ev.error === "language-not-supported") setError("Voice isn't available for your browser language. You can type instead.");
      else setError("Voice input stopped. Try again, or type instead.");
    };
    // Chrome sometimes ends a session on its own; retry once after a dropped connection,
    // otherwise deliver what was heard rather than losing it.
    rec.onend = () => {
      if (recRef.current !== rec) return;
      if (turn.current.retry) {
        turn.current.retry = false;
        listen();
        return;
      }
      finish();
    };
    recRef.current = rec;
    rec.start();
  }, [finish]);

  const start = useCallback(async () => {
    if (!getSpeechRecognitionCtor()) {
      setError("Voice needs Chrome, Edge or Safari. You can still type.");
      return;
    }
    if (!window.isSecureContext) {
      setError("Voice only works on a secure address (https:// or localhost). Open the app that way, or type instead.");
      return;
    }
    clearTimers();
    recRef.current?.abort();
    recRef.current = null;
    stopMeter();
    stopSpeaking();
    setSpeaking(false);
    setError(null);
    setInterim("");
    turn.current = { text: "", delivered: false, retried: false, retry: false };
    setListening(true);

    // Ask for the mic explicitly: it gives clear errors, and powers the level meter
    // so the student can see they're being heard.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (turn.current.delivered) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += ((v - 128) / 128) ** 2;
        setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
        if (meter.current) meter.current.raf = requestAnimationFrame(tick);
      };
      meter.current = { stream, ctx, raf: requestAnimationFrame(tick) };
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setListening(false);
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "The microphone is blocked for this site. Click the mic or lock icon in the address bar, allow it, then try again."
          : name === "NotFoundError"
            ? "No microphone was found. Check it's plugged in and selected in your system settings."
            : name === "NotReadableError"
              ? "Another app is using the microphone. Close it and try again."
              : "Couldn't open the microphone. You can still type.",
      );
      return;
    }

    try {
      listen();
      cap.current = setTimeout(finish, MAX_TURN_MS);
    } catch {
      stopMeter();
      setListening(false);
      setError("Couldn't start voice input. Try again, or type instead.");
    }
  }, [finish, listen]);

  const toggle = useCallback(() => {
    if (listening) finish();
    else void start();
  }, [listening, start, finish]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    setSpeaking(true);
    speakAloud(text, () => {
      setSpeaking(false);
      onEnd?.();
    });
  }, []);

  const quiet = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
  }, []);

  return { supported, listening, speaking, interim, level, error, start, stop, toggle, speak, stopSpeaking: quiet };
}
