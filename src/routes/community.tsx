import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Car, Clock, Flag, LocateFixed, Lock, MapPin, Minus, Phone, Plus, ShieldCheck, UserRound, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { ago, mapsLink, PICKUP_SPOTS, validPhone, type PickupShare, type RidePost } from "@/lib/rides";
import { fmtTime } from "@/lib/schedule";
import { DemoNote, HumanZone, PageTitle } from "@/components/AppShell";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community · D Ride" },
      { name: "description", content: "Ask the Dartmouth community for a ride, or offer the empty seats in your car." },
      { property: "og:title", content: "Community · D Ride" },
      { property: "og:description", content: "Ask the Dartmouth community for a ride, or offer the empty seats in your car." },
    ],
  }),
  component: CommunityPage,
});

const VIEWS = [
  { id: "all", label: "Everything" },
  { id: "need", label: "Need a ride" },
  { id: "offer", label: "Offering seats" },
  { id: "mine", label: "Yours" },
] as const;

const QUICK_TO = ["DHMC, Lebanon", "Boston Logan", "White River Jct Amtrak", "West Lebanon"];

function CommunityPage() {
  const { posts, now } = useStore();
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("all");
  const match = (p: RidePost, v: typeof view) => v === "all" || (v === "mine" ? !!p.mine : p.kind === v);
  const shown = posts.filter((p) => match(p, view));

  return (
    <>
      <PageTitle kicker="Community rides" title="Find a seat, offer a seat" sub="One board instead of scattered Slack ride threads. People choose who they ride with, and contact details are shared only when the rider says so." />
      <div className="grid items-start gap-8 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-4 lg:sticky lg:top-24">
          <Composer />
          <div className="rounded-2xl bg-human/60 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-human-foreground">
              <ShieldCheck className="size-4" /> How sharing works
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-human-foreground/90">
              <li>Drivers offer. You pick one.</li>
              <li>You choose to share your pickup spot and number with that driver only.</li>
              <li>Stop sharing anytime. Nothing is posted publicly.</li>
            </ol>
          </div>
        </div>

        <div>
          <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-card p-1 ring-1 ring-border" role="tablist">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold", view === v.id ? "bg-secondary text-primary" : "text-muted-foreground")}
              >
                {v.label}
                <span className="tnum text-xs opacity-70">{posts.filter((p) => match(p, v.id)).length}</span>
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nothing here yet. Post on the left and it shows up for everyone.</p>
          ) : (
            <ul className="space-y-4">
              {shown.map((p) => (
                <PostCard key={p.id} post={p} now={now} />
              ))}
            </ul>
          )}
          <DemoNote>Posts, offers and names are sample data for this demo. Nothing you share leaves this browser.</DemoNote>
        </div>
      </div>
    </>
  );
}

function Composer() {
  const { addPost } = useStore();
  const [kind, setKind] = useState<RidePost["kind"]>("need");
  const [from, setFrom] = useState("Hanover");
  const [to, setTo] = useState("");
  const [when, setWhen] = useState("");
  const [seats, setSeats] = useState(1);
  const [note, setNote] = useState("");
  const ready = from.trim() && to.trim() && when.trim();
  const input = "mt-1 w-full rounded-lg bg-muted px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        addPost({ kind, name: "You", mine: true, from: from.trim(), to: to.trim(), when: when.trim(), seats, note: note.trim() || undefined });
        setTo("");
        setWhen("");
        setNote("");
        setSeats(1);
      }}
      className="rounded-3xl bg-card p-5 ring-1 ring-border"
    >
      <div className="grid grid-cols-2 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Post type">
        {(["need", "offer"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={cn("flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold", kind === k && "bg-card shadow-sm")}
          >
            {k === "need" ? <UserRound className="size-4" /> : <Car className="size-4" />}
            {k === "need" ? "I need a ride" : "I'm driving"}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">From</span>
          <input value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">To</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Boston Logan" className={input} />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {QUICK_TO.map((q) => (
          <button key={q} type="button" onClick={() => setTo(q)} className="rounded-full px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-border hover:bg-muted">
            {q}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">When</span>
          <input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="Sun, 2:00 PM" className={input} />
        </label>
        <div>
          <span className="text-xs font-semibold text-muted-foreground">{kind === "need" ? "Seats needed" : "Seats free"}</span>
          <div className="mt-1 flex items-center rounded-lg bg-muted">
            <button type="button" aria-label="Fewer seats" onClick={() => setSeats(Math.max(1, seats - 1))} className="p-2.5">
              <Minus className="size-4" />
            </button>
            <span className="tnum w-6 text-center font-bold">{seats}</span>
            <button type="button" aria-label="More seats" onClick={() => setSeats(Math.min(7, seats + 1))} className="p-2.5">
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </div>
      <label className="mt-3 block">
        <span className="text-xs font-semibold text-muted-foreground">Note (optional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === "need" ? "Happy to split gas" : "Room for one suitcase each"} className={input} />
      </label>
      <button disabled={!ready} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40">
        {kind === "need" ? "Ask for a ride" : "Offer my seats"}
      </button>
    </form>
  );
}

function PostCard({ post: p, now }: { post: RidePost; now: number }) {
  const { updatePost } = useStore();
  const need = p.kind === "need";
  const first = p.name.split(" ")[0];

  return (
    <li className={cn("rounded-3xl bg-card p-5 ring-1", p.mine ? "ring-2 ring-primary/40" : "ring-border")}>
      <div className="flex items-center gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold", p.mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
          {p.mine ? "You" : p.name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{p.mine ? "Your post" : p.name}</p>
          <p className="text-xs text-muted-foreground">{ago(p.postedAt, now)}</p>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", need ? "bg-maple/15 text-maple" : "bg-secondary text-secondary-foreground")}>
          {need ? `Needs ${p.seats} seat${p.seats > 1 ? "s" : ""}` : `${p.seats} seat${p.seats > 1 ? "s" : ""} free`}
        </span>
      </div>

      <p className="mt-4 font-display text-xl font-bold text-pine">
        {p.from} <span className="text-muted-foreground">→</span> {p.to}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="size-3.5" /> {p.when}
      </p>
      {p.note && <p className="mt-2 text-sm">{p.note}</p>}

      <div className="mt-4">
        {p.mine ? (
          <MineActions post={p} />
        ) : p.responded ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            <span>
              {need
                ? `Offer sent. If ${first} picks you, their pickup spot and number appear here, but only if ${first} chooses to share them.`
                : `Seat requested. ${first} decides who rides.`}
            </span>
            <button onClick={() => updatePost(p.id, { responded: false })} className="font-semibold underline-offset-2 hover:underline">
              Undo
            </button>
          </div>
        ) : (
          <button onClick={() => updatePost(p.id, { responded: true })} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground sm:w-auto sm:px-5">
            {need ? <Car className="size-4" /> : <UserRound className="size-4" />}
            {need ? "I can drive" : "Request a seat"}
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" /> {p.offers.length} {need ? "driver" : "rider"}
          {p.offers.length === 1 ? "" : "s"} {need ? "offered" : "asked"}
        </span>
        {p.mine ? null : p.reported ? (
          <span className="text-xs text-muted-foreground">Reported. A student moderator will review.</span>
        ) : (
          <button onClick={() => updatePost(p.id, { reported: true })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Flag className="size-3.5" /> Report
          </button>
        )}
      </div>
    </li>
  );
}

function MineActions({ post: p }: { post: RidePost }) {
  const { updatePost } = useStore();
  const [sharing, setSharing] = useState(false);
  const need = p.kind === "need";

  if (p.offers.length === 0)
    return <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">{need ? "No drivers yet. You'll see offers here." : "No riders yet. Requests show up here."}</p>;

  if (!p.accepted)
    return (
      <div className="space-y-2">
        <HumanZone label={need ? "Human zone: you choose your driver" : "Human zone: you choose your riders"} />
        {p.offers.map((o) => (
          <div key={o} className="flex items-center justify-between rounded-xl bg-muted px-4 py-2.5">
            <span className="text-sm">
              <span className="font-semibold">{o}</span> {need ? "can drive" : "wants a seat"}
            </span>
            <button onClick={() => updatePost(p.id, { accepted: o })} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
              {need ? "Ride with them" : "Accept"}
            </button>
          </div>
        ))}
      </div>
    );

  const driver = p.accepted;
  const first = driver.split(" ")[0];
  if (!need) return <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">You accepted {driver}. They can share their pickup details with you from their side.</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm">
        Riding with <span className="font-semibold">{driver}</span>.{" "}
        {!p.share && (
          <button onClick={() => updatePost(p.id, { accepted: undefined })} className="text-muted-foreground underline-offset-2 hover:underline">
            Choose someone else
          </button>
        )}
      </p>
      {p.share ? (
        <SharedPanel share={p.share} onStop={() => updatePost(p.id, { share: undefined })} />
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-primary/30 p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" /> {first} can't see where you are or your number yet.
          </p>
          <button onClick={() => setSharing(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground">
            <MapPin className="size-4" /> Share pickup location & number with {first}
          </button>
        </div>
      )}
      <ShareDialog open={sharing} onOpenChange={setSharing} driver={driver} onShare={(share) => updatePost(p.id, { share })} />
    </div>
  );
}

function SharedPanel({ share, onStop }: { share: PickupShare; onStop: () => void }) {
  return (
    <div className="rounded-2xl bg-secondary p-4 text-secondary-foreground">
      <p className="flex items-center gap-2 text-sm font-bold">
        <ShieldCheck className="size-4" /> Shared with {share.with} only · {fmtTime(share.sharedAt)}
      </p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 opacity-70">Pickup</dt>
          <dd>
            {share.spot}
            {share.coords && (
              <>
                {" · "}
                <a href={mapsLink(share.coords)} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                  GPS pin (±{Math.round(share.coords.accuracy)} m)
                </a>
              </>
            )}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 opacity-70">Phone</dt>
          <dd className="tnum">{share.phone}</dd>
        </div>
      </dl>
      <button onClick={onStop} className="mt-3 rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-secondary-foreground/30 hover:bg-card">
        Stop sharing
      </button>
    </div>
  );
}

function ShareDialog({ open, onOpenChange, driver, onShare }: { open: boolean; onOpenChange: (o: boolean) => void; driver: string; onShare: (s: PickupShare) => void }) {
  const first = driver.split(" ")[0];
  const [spot, setSpot] = useState("");
  const [coords, setCoords] = useState<PickupShare["coords"]>();
  const [geo, setGeo] = useState<"idle" | "locating" | "error">("idle");
  const [geoMsg, setGeoMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [shareLoc, setShareLoc] = useState(true);
  const ok = spot && validPhone(phone) && (!shareLoc || coords);

  function locate() {
    if (!("geolocation" in navigator)) {
      setGeo("error");
      setGeoMsg("This browser can't share location. Pick a pickup spot instead.");
      return;
    }
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGeo("idle");
      },
      (err) => {
        setGeo("error");
        setShareLoc(false);
        setGeoMsg(err.code === 1 ? "Location permission was blocked, so only the pickup spot will be shared." : "Couldn't find your location, so only the pickup spot will be shared.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share pickup details with {first}?</DialogTitle>
          <DialogDescription>Only {driver} will see this. It isn't posted on the board, and you can stop sharing anytime.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Pickup spot</span>
            <select value={spot} onChange={(e) => setSpot(e.target.value)} className="mt-1 w-full rounded-lg bg-muted px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring">
              <option value="">Choose a place {first} can find…</option>
              {PICKUP_SPOTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>

          <div className="rounded-xl bg-muted p-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={shareLoc} onChange={(e) => setShareLoc(e.target.checked)} className="accent-[var(--primary)]" />
              Also share my exact location (GPS)
            </label>
            {shareLoc &&
              (coords ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <LocateFixed className="size-3.5 text-primary" /> Location found, accurate to about {Math.round(coords.accuracy)} m.{" "}
                  <a href={mapsLink(coords)} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
                    Check it
                  </a>
                </p>
              ) : (
                <button type="button" onClick={locate} disabled={geo === "locating"} className="mt-2 flex items-center gap-1.5 rounded-lg bg-card px-3 py-2 text-sm font-semibold text-primary ring-1 ring-border disabled:opacity-60">
                  <LocateFixed className="size-4" /> {geo === "locating" ? "Finding you…" : "Use my current location"}
                </button>
              ))}
            {geo === "error" && <p className="mt-2 text-xs text-human-foreground">{geoMsg}</p>}
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Your phone number</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg bg-muted px-3 focus-within:ring-2 focus-within:ring-ring">
              <Phone className="size-4 text-muted-foreground" />
              <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="603-555-0142" className="w-full bg-transparent py-2.5 text-base outline-none" />
            </div>
            {phone && !validPhone(phone) && <span className="mt-1 block text-xs text-destructive">Enter a 10-digit US number.</span>}
          </label>

          {ok && (
            <div className="rounded-xl border p-3 text-sm">
              <p className="text-xs font-semibold text-muted-foreground">What {first} will see</p>
              <p className="mt-1">
                Pickup at <b>{spot}</b>
                {shareLoc && coords ? " with a map pin" : ""}. Call or text <b className="tnum">{phone}</b>.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <button onClick={() => onOpenChange(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-border">
            Not now
          </button>
          <button
            disabled={!ok}
            onClick={() => {
              onShare({ with: driver, phone: phone.trim(), spot, coords: shareLoc ? coords : undefined, sharedAt: Date.now() });
              onOpenChange(false);
            }}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            Share with {first}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
