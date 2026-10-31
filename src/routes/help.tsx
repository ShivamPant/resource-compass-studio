import { createFileRoute, redirect } from "@tanstack/react-router";

// Old name for the Community board; keep links that were already shared working.
export const Route = createFileRoute("/help")({
  beforeLoad: () => {
    throw redirect({ to: "/community", replace: true });
  },
});
