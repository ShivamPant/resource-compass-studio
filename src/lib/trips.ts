import { addDaysISO, daysUntil, timeToMin } from "@/lib/dates";

export type TripKind = "house" | "school" | "city" | "outdoors" | "weekend" | "errand";

export const KINDS: { id: TripKind; label: string; color: string }[] = [
  { id: "house", label: "House", color: "oklch(0.5 0.13 320)" },
  { id: "school", label: "School", color: "oklch(0.5 0.13 250)" },
  { id: "city", label: "Boston & NYC", color: "oklch(0.6 0.16 40)" },
  { id: "outdoors", label: "Outdoors", color: "oklch(0.45 0.1 150)" },
  { id: "weekend", label: "Weekend", color: "oklch(0.7 0.14 80)" },
  { id: "errand", label: "Errands", color: "oklch(0.55 0.03 250)" },
];

export const HOUSES = ["Allen", "East Wheelock", "McLaughlin", "North Park", "School", "South", "West"];
export const SCHOOLS = ["Thayer", "Tuck", "Geisel", "Guarini"];

/** Which sub-groups a category can be scoped to (house communities, graduate schools). */
export function groupsFor(kind: TripKind) {
  return kind === "house" ? HOUSES : kind === "school" ? SCHOOLS : [];
}

export function kindInfo(kind: TripKind) {
  return KINDS.find((k) => k.id === kind) ?? KINDS[0]!;
}

export type Trip = {
  id: string;
  title: string;
  kind: TripKind;
  group?: string | undefined;
  dateISO: string;
  departTime: string;
  meetingPoint: string;
  destination: string;
  seatsTotal: number;
  seatsTaken: number;
  organizer: string;
  cost: string;
  /** Set when the trip is a carpool to an event the student registered for. */
  eventId?: string | undefined;
  joined?: boolean;
};

export type CampusEvent = {
  id: string;
  title: string;
  host: string;
  dateISO: string;
  time: string;
  venue: string;
  city: string;
  kind: TripKind;
  group?: string;
};

export type TripFilter = {
  kind: TripKind | "all" | "going";
  group?: string | undefined;
  /** Only trips within this many days; null for any date. */
  within: number | null;
  openOnly: boolean;
  q: string;
  eventId?: string | undefined;
};

export const seatsLeft = (t: Trip) => Math.max(0, t.seatsTotal - t.seatsTaken);

export function filterTrips(trips: Trip[], f: TripFilter, now: number) {
  const q = f.q.trim().toLowerCase();
  return trips
    .filter((t) => {
      const d = daysUntil(t.dateISO, now);
      if (d < 0) return false;
      if (f.within != null && d > f.within) return false;
      if (f.kind === "going" && !t.joined) return false;
      if (f.kind !== "all" && f.kind !== "going" && t.kind !== f.kind) return false;
      if (f.group && t.group !== f.group) return false;
      if (f.eventId && t.eventId !== f.eventId) return false;
      if (f.openOnly && !t.joined && seatsLeft(t) === 0) return false;
      if (q && ![t.title, t.destination, t.meetingPoint, t.organizer, t.group ?? ""].join(" ").toLowerCase().includes(q))
        return false;
      return true;
    })
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || timeToMin(a.departTime) - timeToMin(b.departTime));
}

/** Pull the first number out of free text like "Van holds 12". */
export function parseSeats(text: string | null | undefined) {
  const m = text?.match(/\d+/);
  return m ? Number(m[0]) : 0;
}

// DEMO DATA: sample trips and events, dated relative to today so the board always has something upcoming.
export function seedEvents(now: number): CampusEvent[] {
  return [
    { id: "e-career", title: "Boston Career Fair", host: "Thayer · Center for Professional Development", dateISO: addDaysISO(13, now), time: "10:00 AM", venue: "Hynes Convention Center", city: "Boston", kind: "school", group: "Thayer" },
    { id: "e-tuck", title: "Tuck alumni networking night", host: "Tuck", dateISO: addDaysISO(6, now), time: "6:30 PM", venue: "Back Bay, Boston", city: "Boston", kind: "school", group: "Tuck" },
    { id: "e-hockey", title: "Dartmouth at Harvard, women's hockey", host: "Dartmouth Athletics", dateISO: addDaysISO(14, now), time: "3:00 PM", venue: "Bright-Landry Hockey Center", city: "Cambridge", kind: "weekend" },
  ];
}

export function seedTrips(now: number): Trip[] {
  const day = (n: number) => addDaysISO(n, now);
  return [
    { id: "t1", title: "Ben & Jerry's factory tour", kind: "house", group: "North Park", dateISO: day(1), departTime: "1:00 PM", meetingPoint: "North Park house center", destination: "Waterbury, VT", seatsTotal: 7, seatsTaken: 4, organizer: "Priya Raman '27", cost: "Free, house-funded" },
    { id: "t2", title: "Lebanon Target run", kind: "errand", dateISO: day(1), departTime: "2:00 PM", meetingPoint: "Collis porch", destination: "Target, West Lebanon", seatsTotal: 4, seatsTaken: 3, organizer: "Marcus Bell '26", cost: "$3 gas split" },
    { id: "t3", title: "Early carpool to DHMC rotations", kind: "school", group: "Geisel", dateISO: day(2), departTime: "6:40 AM", meetingPoint: "Hanover Inn lot", destination: "DHMC, Lebanon", seatsTotal: 4, seatsTaken: 2, organizer: "Hannah Lee, Geisel '28", cost: "$2 gas split" },
    { id: "t4", title: "Drive down for the networking night", kind: "school", group: "Tuck", eventId: "e-tuck", dateISO: day(6), departTime: "2:30 PM", meetingPoint: "Tuck Mall", destination: "Back Bay, Boston", seatsTotal: 5, seatsTaken: 3, organizer: "Omar Haddad T'27", cost: "$15 gas and tolls" },
    { id: "t5", title: "Long weekend in New York", kind: "city", dateISO: day(6), departTime: "1:00 PM", meetingPoint: "Collis porch", destination: "Manhattan, NY", seatsTotal: 4, seatsTaken: 1, organizer: "Diego Alvarez '28", cost: "$40 gas and tolls" },
    { id: "t6", title: "Apple picking at Riverview Farm", kind: "house", group: "Allen", dateISO: day(7), departTime: "10:30 AM", meetingPoint: "Allen House lounge", destination: "Plainfield, NH", seatsTotal: 12, seatsTaken: 9, organizer: "Allen House council", cost: "Free" },
    { id: "t7", title: "Moosilauke sunrise hike", kind: "outdoors", dateISO: day(7), departTime: "5:15 AM", meetingPoint: "Robinson Hall steps", destination: "Mount Moosilauke", seatsTotal: 8, seatsTaken: 8, organizer: "DOC, Jordan Kim '26", cost: "Free" },
    { id: "t8", title: "Norwich farmers market and brunch", kind: "weekend", dateISO: day(7), departTime: "9:30 AM", meetingPoint: "Baker-Berry Library", destination: "Norwich, VT", seatsTotal: 3, seatsTaken: 1, organizer: "Lena Park '25", cost: "Free" },
    { id: "t9", title: "Thayer van to the career fair", kind: "school", group: "Thayer", eventId: "e-career", dateISO: day(13), departTime: "6:30 AM", meetingPoint: "Thayer School, Cummings Hall", destination: "Hynes Convention Center, Boston", seatsTotal: 12, seatsTaken: 7, organizer: "Thayer CPD", cost: "Free" },
    { id: "t10", title: "South House trip to Boston Symphony", kind: "house", group: "South", dateISO: day(9), departTime: "4:00 PM", meetingPoint: "South House", destination: "Symphony Hall, Boston", seatsTotal: 10, seatsTaken: 6, organizer: "South House council", cost: "$10, tickets included" },
  ];
}
