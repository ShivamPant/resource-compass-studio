// Deterministic safety check. Runs in the browser BEFORE any AI call so that
// emergencies never wait on (or get interpreted by) a model.
const PATTERNS: RegExp[] = [
  /\bfollow(ed|ing)\b/i,
  /\bstalk(ed|ing|er)?\b/i,
  /\b(unsafe|scared|afraid|in danger|threaten(ed|ing)?)\b/i,
  /\b(assault(ed)?|attack(ed)?|harass(ed|ing|ment)?|grabbed)\b/i,
  /\b(emergency|help me|call 911|911)\b/i,
  /\b(hurt|bleeding|injured|overdose)\b/i,
];

export function isSafetyConcern(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}
