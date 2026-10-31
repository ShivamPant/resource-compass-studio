export type PickupShare = {
  /** Who can see it: only the driver the rider accepted. */
  with: string;
  phone: string;
  spot: string;
  coords?: { lat: number; lng: number; accuracy: number } | undefined;
  sharedAt: number;
};

export type RidePost = {
  id: string;
  kind: "need" | "offer";
  name: string;
  from: string;
  to: string;
  when: string;
  seats: number;
  note?: string | undefined;
  postedAt: number;
  mine?: boolean;
  /** Need posts: drivers who offered. Offer posts: riders who asked for a seat. */
  offers: string[];
  accepted?: string | undefined;
  share?: PickupShare | undefined;
  /** You offered to drive (need posts) or asked for a seat (offer posts). */
  responded?: boolean;
  reported?: boolean;
};

// Places a driver can find without a map pin, used when GPS is blocked or not wanted.
export const PICKUP_SPOTS = [
  "Collis Center porch",
  "Baker-Berry Library, main entrance",
  "Hopkins Center, Wheelock St side",
  "Hanover Inn front drive",
  "Thayer School, Cummings Hall",
  "Tuck Mall",
  "Robinson Hall steps",
  "Dartmouth Green, Wentworth St bus stop",
];

export const mapsLink = (c: { lat: number; lng: number }) => `https://maps.google.com/?q=${c.lat.toFixed(5)},${c.lng.toFixed(5)}`;

/** Loose US phone check: 10 digits, optional +1. */
export function validPhone(p: string) {
  const d = p.replace(/\D/g, "");
  return d.length === 10 || (d.length === 11 && d.startsWith("1"));
}

export function ago(ms: number, now: number) {
  const m = Math.max(0, Math.round((now - ms) / 60000));
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

// DEMO DATA: sample community posts.
export function seedPosts(now: number): RidePost[] {
  const min = (n: number) => now - n * 60000;
  return [
    { id: "p0", kind: "need", name: "You", mine: true, from: "Hanover", to: "DHMC, Lebanon", when: "Mon, 6:30 AM", seats: 1, note: "Early clinic shift, happy to chip in for gas.", postedAt: min(25), offers: ["Sam Ortiz '26", "Lena Park '25"] },
    { id: "p1", kind: "need", name: "Ava Chen '27", from: "Hanover", to: "Lebanon Hospital", when: "Fri, 8:30 AM", seats: 1, note: "9 AM appointment.", postedAt: min(12), offers: ["Sam Ortiz '26"] },
    { id: "p2", kind: "offer", name: "Diego Alvarez '28", from: "Hanover", to: "Boston Logan", when: "Sun, 1:00 PM", seats: 3, note: "Splitting gas. Room for one big suitcase each.", postedAt: min(60), offers: [] },
    { id: "p3", kind: "need", name: "Kofi Mensah '26", from: "Hanover", to: "White River Jct Amtrak", when: "Thu, 4:15 PM", seats: 2, postedAt: min(140), offers: [] },
    { id: "p4", kind: "offer", name: "Grace Liu, Tuck '27", from: "Hanover", to: "Manchester airport (MHT)", when: "Sat, 7:00 AM", seats: 2, postedAt: min(300), offers: ["Noah Brooks '27"] },
  ];
}
