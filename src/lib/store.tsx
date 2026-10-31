import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Reminder = { id: string; departureAt: number; leadMin: number; source: "you" | "ai" };
export type Trip = {
  id: string;
  title: string;
  date: string;
  departTime: string;
  meetingPoint: string;
  destination: string;
  seats: string;
  organizer: string;
  cost: string;
};

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
  online: boolean;
};

const StoreCtx = createContext<Ctx | null>(null);

// DEMO DATA: seeded trips, not pulled from any real email list.
const SEED_TRIPS: Trip[] = [
  {
    id: "t1",
    title: "Moosilauke sunrise hike",
    date: "Sat, Nov 7",
    departTime: "5:15 AM",
    meetingPoint: "Robinson Hall steps",
    destination: "Mount Moosilauke",
    seats: "3 of 8 open",
    organizer: "Priya Raman '27",
    cost: "Free",
  },
  {
    id: "t2",
    title: "Lebanon Target run",
    date: "Sun, Nov 8",
    departTime: "2:00 PM",
    meetingPoint: "Collis porch",
    destination: "Target, West Lebanon",
    seats: "1 of 4 open",
    organizer: "Marcus Bell '26",
    cost: "$3 gas split",
  },
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [base, setBase] = useState(() => Date.now());
  const [offsetMin, setOffset] = useState(0);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [trips, setTrips] = useState<Trip[]>(SEED_TRIPS);
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
          rs.some((x) => x.departureAt === r.departureAt)
            ? rs
            : [...rs, { ...r, id: `${r.departureAt}-${Date.now()}` }],
        ),
      removeReminder: (id) => setReminders((rs) => rs.filter((r) => r.id !== id)),
      dismissed,
      dismiss: (id) => setDismissed((d) => [...d, id]),
      trips,
      addTrip: (t) => setTrips((ts) => [{ ...t, id: `t${Date.now()}` }, ...ts]),
      online,
    }),
    [base, offsetMin, reminders, dismissed, trips, online],
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
