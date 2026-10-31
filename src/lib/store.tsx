import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { seedEvents, seedTrips, type CampusEvent, type Trip } from "@/lib/trips";
import { seedPosts, type RidePost } from "@/lib/rides";

export type { Trip } from "@/lib/trips";
export type Reminder = { id: string; routeId: string; departureAt: number; leadMin: number; source: "you" | "ai" };

type Ctx = {
  now: number;
  offsetMin: number;
  fastForward: (min: number) => void;
  resetClock: () => void;
  reminders: Reminder[];
  addReminder: (r: Omit<Reminder, "id">) => void;
  removeReminder: (id: string) => void;
  dismissed: string[];
  dismiss: (id: string) => void;
  trips: Trip[];
  addTrip: (t: Omit<Trip, "id">) => void;
  toggleJoin: (id: string) => void;
  /** Events the student registered for elsewhere; trips can carpool to them. */
  events: CampusEvent[];
  posts: RidePost[];
  addPost: (p: Omit<RidePost, "id" | "postedAt" | "offers">) => void;
  updatePost: (id: string, patch: Partial<RidePost>) => void;
  online: boolean;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [base, setBase] = useState(() => Date.now());
  const [offsetMin, setOffset] = useState(0);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [trips, setTrips] = useState<Trip[]>(() => seedTrips(Date.now()));
  const [events] = useState<CampusEvent[]>(() => seedEvents(Date.now()));
  const [posts, setPosts] = useState<RidePost[]>(() => seedPosts(Date.now()));
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setBase(Date.now()), 15000);
    const on = () => setOnline(navigator.onLine);
    on();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      now: base + offsetMin * 60000,
      offsetMin,
      fastForward: (m) => setOffset((o) => o + m),
      resetClock: () => {
        setOffset(0);
        setDismissed([]);
      },
      reminders,
      addReminder: (r) =>
        setReminders((rs) =>
          rs.some((x) => x.routeId === r.routeId && x.departureAt === r.departureAt)
            ? rs
            : [...rs, { ...r, id: `${r.routeId}-${r.departureAt}-${Date.now()}` }],
        ),
      removeReminder: (id) => setReminders((rs) => rs.filter((r) => r.id !== id)),
      dismissed,
      dismiss: (id) => setDismissed((d) => [...d, id]),
      trips,
      addTrip: (t) => setTrips((ts) => [{ ...t, id: `t${Date.now()}` }, ...ts]),
      toggleJoin: (id) =>
        setTrips((ts) =>
          ts.map((t) => {
            if (t.id !== id) return t;
            if (t.joined) return { ...t, joined: false, seatsTaken: t.seatsTaken - 1 };
            return t.seatsTaken < t.seatsTotal ? { ...t, joined: true, seatsTaken: t.seatsTaken + 1 } : t;
          }),
        ),
      events,
      posts,
      addPost: (p) => setPosts((ps) => [{ ...p, id: `p${Date.now()}`, postedAt: Date.now(), offers: [] }, ...ps]),
      updatePost: (id, patch) => setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      online,
    }),
    [base, offsetMin, reminders, dismissed, trips, events, posts, online],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

/** A reminder fires once the (demo) clock passes departure minus lead time. */
export function firingReminders(reminders: Reminder[], now: number, dismissed: string[]) {
  return reminders.filter(
    (r) => now >= r.departureAt - r.leadMin * 60000 && now < r.departureAt && !dismissed.includes(r.id),
  );
}
