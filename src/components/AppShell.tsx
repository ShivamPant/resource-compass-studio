import { Link, useRouterState } from "@tanstack/react-router";
import { Bus, MessageCircle, ShieldAlert, Map, Users, BellRing, WifiOff, X } from "lucide-react";
import type { ReactNode } from "react";
import { firingReminders, useStore } from "@/lib/store";
import { fmtTime, minsUntil, ROUTE } from "@/lib/schedule";
import logo from "@/assets/dride-logo.png.asset.json";

const TABS = [
  { to: "/", label: "Bus", icon: Bus },
  { to: "/ask", label: "Ask", icon: MessageCircle },
  { to: "/trips", label: "Trips", icon: Map },
  { to: "/help", label: "Help", icon: Users },
  { to: "/sos", label: "SOS", icon: ShieldAlert },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { reminders, now, dismissed, dismiss, online } = useStore();
  const firing = firingReminders(reminders, now, dismissed);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
          <Link to="/"><img src={logo.url} alt="D Ride" className="h-10 w-auto" /></Link>
          <nav>
            <ul className="flex items-center gap-1">
              {TABS.map(({ to, label, icon: Icon }) => {
                const active = to === "/" ? path === "/" : path.startsWith(to);
                const sos = to === "/sos";
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                        sos
                          ? "text-destructive ring-1 ring-destructive/40"
                          : active
                            ? "bg-secondary text-primary"
                            : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      {!online && (
        <div role="status" className="flex items-center justify-center gap-2 bg-muted px-6 py-2 text-xs text-muted-foreground">
          <WifiOff className="size-3.5" /> You're offline. Showing the last saved timetable.
        </div>
      )}

      <div className="mx-auto w-full max-w-6xl px-6">
        {firing.map((r) => (
          <div
            key={r.id}
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-xl bg-primary p-4 text-primary-foreground shadow-lg animate-in slide-in-from-top-2"
          >
            <BellRing className="mt-0.5 size-5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Bus in {minsUntil(r.departureAt, now)} min. Time to head out.</p>
              <p className="text-sm opacity-85">
                {fmtTime(r.departureAt)} from {ROUTE.from}. {ROUTE.walkMin} min walk to the stop.
              </p>
            </div>
            <button aria-label="Dismiss reminder" onClick={() => dismiss(r.id)} className="opacity-80">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16 pt-8">{children}</main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
          D Ride · Dartmouth, Hanover NH. D Ride is not monitored. Call 911 or Safety & Security for emergencies.
        </div>
      </footer>
    </div>
  );
}

export function AiChip({ children = "AI draft. Review before confirming" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ai px-2.5 py-0.5 text-[11px] font-semibold text-ai-foreground">
      {children}
    </span>
  );
}

export function HumanZone({ label = "Human zone: no AI here" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-human px-2.5 py-0.5 text-[11px] font-semibold text-human-foreground">
      {label}
    </span>
  );
}

export function DemoNote({ children }: { children: ReactNode }) {
  return <p className="text-[11px] text-muted-foreground">{children}</p>;
}
