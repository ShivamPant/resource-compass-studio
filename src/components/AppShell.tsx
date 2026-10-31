import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Bus, Compass, ShieldAlert, Map, Users, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { ReminderAlerts } from "@/components/ReminderAlerts";
import logo from "@/assets/dride-logo.png";

const TABS = [
  { to: "/bus", label: "Bus", icon: Bus },
  { to: "/ask", label: "Ask Naksha", icon: Compass },
  { to: "/trips", label: "Trips", icon: Map },
  { to: "/community", label: "Community", icon: Users },
  { to: "/about", label: "About", icon: BookOpen },
  { to: "/sos", label: "SOS", icon: ShieldAlert },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { online } = useStore();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 bg-header backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-6">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="D Ride" className="h-11 w-auto object-contain" />
          </Link>
          <nav>
            <ul className="flex items-center gap-0.5 sm:gap-1">
              {TABS.map(({ to, label, icon: Icon }) => {
                const active = path.startsWith(to);
                const sos = to === "/sos";
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold sm:px-3 ${
                        sos
                          ? "text-destructive ring-1 ring-destructive/40"
                          : active
                            ? "bg-card/80 text-primary shadow-sm ring-1 ring-primary/15"
                            : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                      <span className="hidden md:inline">{label}</span>
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

      <ReminderAlerts />

      {path === "/" || path === "/about" ? <main className="flex-1">{children}</main> : <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16 pt-8">{children}</main>}

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

const TAG_TONES = {
  green: "bg-secondary text-secondary-foreground",
  gold: "bg-gold text-gold-foreground",
  maple: "bg-maple/15 text-maple",
  sky: "bg-sky text-ai-foreground",
} as const;

export function Tag({ children, tone = "green" }: { children: ReactNode; tone?: keyof typeof TAG_TONES }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${TAG_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function PageTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-8 animate-rise">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-maple">{kicker}</p>
      <h1 className="mt-1 font-display text-4xl font-bold text-pine sm:text-5xl">{title}</h1>
      {sub && <p className="mt-2 max-w-xl text-muted-foreground">{sub}</p>}
    </div>
  );
}
