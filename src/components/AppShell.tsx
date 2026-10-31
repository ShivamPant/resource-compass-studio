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
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-5 py-3 backdrop-blur">
        <img src={logo.url} alt="D Ride" className="h-8 w-auto" />
        <span className="text-xs text-muted-foreground">Dartmouth · Hanover</span>
      </header>

      {!online && (
        <div role="status" className="flex items-center gap-2 bg-muted px-5 py-2 text-xs text-muted-foreground">
          <WifiOff className="size-3.5" /> You're offline. Showing the last saved timetable.
        </div>
      )}

      {firing.map((r) => (
        <div
          key={r.id}
          role="alert"
          className="mx-4 mt-3 flex items-start gap-3 rounded-xl bg-primary p-4 text-primary-foreground shadow-lg animate-in slide-in-from-top-2"
        >
          <BellRing className="mt-0.5 size-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">
              Bus in {minsUntil(r.departureAt, now)} min. Time to head out.
            </p>
            <p className="text-sm opacity-85">
              {fmtTime(r.departureAt)} from {ROUTE.from}. {ROUTE.walkMin} min walk to the stop.
            </p>
          </div>
          <button aria-label="Dismiss reminder" onClick={() => dismiss(r.id)} className="opacity-80">
            <X className="size-4" />
          </button>
        </div>
      ))}

      <main className="flex-1 px-5 pb-28 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t bg-card">
        <ul className="grid grid-cols-5">
          {TABS.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            const sos = to === "/sos";
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium ${
                    sos ? "text-destructive" : active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
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
