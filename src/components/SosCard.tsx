import { Phone, MapPin } from "lucide-react";
import { HumanZone } from "@/components/AppShell";

export function SosCard({ compact }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-destructive bg-card p-5" role="alert">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-lg font-bold text-destructive">Get help now</p>
        <HumanZone />
      </div>
      {!compact && (
        <p className="mb-4 text-sm text-muted-foreground">
          Move toward a lit, public place if you can. These connect you to people, not an AI.
        </p>
      )}
      <div className="space-y-2">
        <a href="tel:911" className="flex items-center justify-center gap-2 rounded-xl bg-destructive py-4 text-lg font-bold text-destructive-foreground">
          <Phone className="size-5" /> Call 911
        </a>
        <a href="tel:16036464000" className="flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-destructive ring-2 ring-destructive">
          <Phone className="size-5" /> Safety & Security · 603-646-4000
        </a>
        <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" /> Nearest staffed building: Collis Center, open until 2 AM
        </p>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        D Ride is not monitored. Call 911 or Safety & Security for emergencies.
      </p>
    </div>
  );
}
