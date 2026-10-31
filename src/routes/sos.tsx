import { createFileRoute } from "@tanstack/react-router";
import { SosCard } from "@/components/SosCard";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "SOS · D Ride" },
      { name: "description", content: "Call 911 or Dartmouth Safety & Security directly." },
      { property: "og:title", content: "SOS · D Ride" },
      { property: "og:description", content: "Call 911 or Dartmouth Safety & Security directly." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Emergency</h1>
      <SosCard />
      <p className="text-xs text-muted-foreground">
        This screen never uses AI. Nothing here is sent anywhere until you place the call yourself.
      </p>
    </div>
  ),
});
