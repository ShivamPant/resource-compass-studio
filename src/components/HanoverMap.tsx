// Flat 2D street map of central Hanover for the landing hero, drawn in-house (streets traced roughly
// from the real layout). Campus buildings are flat footprints. Bus routes stay quiet until one is
// hovered, here or in the "Leaving soon" card, then that route lights up in its colour. A live Blue
// bus (demo) blinks as it moves along its route.
import { useEffect, useState } from "react";
import { getRoute, ROUTES } from "@/lib/schedule";

type Pt = readonly [number, number];
const d = (p: Pt[]) => p.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
const poly = (p: Pt[]) => p.map(([x, y]) => `${x},${y}`).join(" ");

type Street = { name?: string; at?: Pt; angle?: number; path: Pt[] };

const MAJOR: Street[] = [
  { name: "W Wheelock St", at: [560, 594], angle: 6, path: [[0, 445], [300, 555], [500, 585], [780, 620], [950, 615]] },
  { name: "E Wheelock St", at: [1250, 548], angle: -20, path: [[950, 615], [1080, 595], [1200, 570], [1340, 515], [1520, 447], [1700, 385], [2000, 250]] },
  { name: "N Park St", at: [1488, 240], angle: 82, path: [[1440, 0], [1475, 120], [1520, 447]] },
  { name: "S Park St", at: [1572, 700], angle: 82, path: [[1520, 447], [1555, 600], [1590, 820], [1615, 1076]] },
  { name: "N Main St", at: [926, 260], angle: 90, path: [[938, 120], [940, 420], [950, 615]] },
  { name: "S Main St", at: [960, 800], angle: 94, path: [[950, 615], [945, 760], [930, 900], [915, 1076]] },
];

const MINOR: Street[] = [
  { name: "College St", at: [1090, 500], angle: 90, path: [[1078, 590], [1075, 300], [1100, 230], [1200, 140], [1300, 40], [1330, 0]] },
  { name: "Maynard St", at: [1120, 72], angle: 33, path: [[1015, 10], [1110, 65], [1210, 135]] },
  { name: "Webster Ave", at: [720, 158], angle: 17, path: [[520, 90], [780, 170], [938, 215]] },
  { name: "Tuck Mall", at: [870, 304], path: [[540, 318], [938, 312]] },
  { name: "Allen St", at: [700, 716], angle: -2, path: [[540, 742], [945, 722]] },
  { name: "Maple St", at: [640, 866], angle: 1, path: [[230, 870], [930, 882], [1230, 905]] },
  { name: "School St", at: [772, 790], angle: 90, path: [[780, 620], [780, 1076]] },
  { name: "West St", at: [494, 660], angle: 90, path: [[505, 590], [500, 700], [520, 820]] },
  { path: [[600, 700], [600, 830]] },
  { path: [[430, 650], [445, 850]] },
  { path: [[540, 940], [780, 935]] },
  { name: "Crosby St", at: [1238, 640], angle: 70, path: [[1220, 580], [1270, 700], [1290, 800]] },
  { path: [[1100, 770], [1100, 860]] },
  { name: "Lebanon St", at: [1360, 860], angle: 40, path: [[1060, 772], [1250, 772], [1440, 930], [1600, 1076]] },
  { name: "Valley Rd", at: [1640, 552], angle: -10, path: [[1555, 572], [1800, 520], [2000, 470]] },
  { path: [[1610, 30], [1690, 550]] },
  { name: "Park Way", at: [1560, 50], angle: -10, path: [[1450, 60], [1680, 15]] },
  { path: [[930, 940], [1040, 960]] },
  { path: [[830, 522], [940, 522]] },
  { path: [[1650, 560], [1620, 690]] },
];

const PARKS: Pt[][] = [
  [[950, 425], [1070, 425], [1070, 590], [952, 604]], // the Green
  [[560, 322], [790, 322], [790, 525], [562, 528]],
  [[1240, 20], [1440, 20], [1452, 200], [1340, 420], [1220, 420], [1232, 200]],
  [[1310, 660], [1430, 640], [1452, 820], [1340, 832]],
  [[1262, 560], [1310, 552], [1330, 630], [1280, 640]],
  [[1640, 700], [1740, 700], [1740, 732], [1642, 736]],
  [[1670, 890], [1800, 880], [1810, 1050], [1690, 1060]],
  [[1260, 960], [1310, 900], [1352, 950], [1300, 1012]],
];

const RIVER: Pt[] = [[180, 0], [470, 0], [330, 150], [225, 320], [165, 450], [145, 600], [150, 800], [215, 1076], [0, 1076], [0, 380], [60, 260], [110, 130]];
const DOWNTOWN: Pt[] = [[830, 640], [1020, 640], [1050, 780], [1060, 850], [950, 1000], [830, 980], [800, 780]];

type Landmark = { id: string; name: string; note: string; x: number; y: number; w: number; d: number; fill: string; stroke: string };

// Footprints sit where the buildings are on the real map.
const LANDMARKS: Landmark[] = [
  { id: "baker", name: "Baker-Berry Library", note: "The tower everyone navigates by", x: 958, y: 330, w: 110, d: 62, fill: "#e8c3a8", stroke: "#c4704b" },
  { id: "dhall", name: "Dartmouth Hall", note: "East side of the Green", x: 1092, y: 440, w: 42, d: 112, fill: "#ece8dc", stroke: "#9a9484" },
  { id: "inn", name: "Hanover Inn", note: "Dartmouth Coach stop", x: 958, y: 632, w: 54, d: 46, fill: "#efc9ae", stroke: "#c97b55" },
  { id: "hop", name: "Hopkins Center", note: "The Hop, arts and Courtyard Café", x: 1024, y: 630, w: 92, d: 58, fill: "#e8bfa9", stroke: "#b9654a" },
  { id: "thayer", name: "Thayer School", note: "Engineering", x: 430, y: 352, w: 92, d: 58, fill: "#c9d3dc", stroke: "#8d9aa6" },
  { id: "tuck", name: "Tuck School", note: "Business", x: 422, y: 212, w: 112, d: 54, fill: "#e4c2b3", stroke: "#a8634a" },
  { id: "field", name: "Memorial Field", note: "Football and the Homecoming bonfire", x: 1330, y: 692, w: 90, d: 26, fill: "#dfe3e8", stroke: "#9aa3ad" },
];

// Route lines follow the streets. Where routes share Wheelock St they're nudged apart so each stays visible.
const ROUTE_PATHS: Record<string, Pt[]> = {
  juniper: [[1440, -10], [1466, 120], [1506, 432], [1336, 502], [1196, 556], [1078, 582], [952, 602]],
  blue: [[952, 614], [1080, 595], [1200, 570], [1340, 515], [1520, 447], [1555, 600], [1590, 820], [1614, 1086]],
  orange: [[944, 612], [940, 760], [925, 900], [909, 1086]],
  coach: [[986, 626], [1082, 608], [1204, 583], [1345, 528], [1528, 460], [1704, 398], [2010, 262]],
};

const ENDS: Record<string, { at: Pt; text: string }> = {
  juniper: { at: [1442, 34], text: "↑ Summit on Juniper" },
  blue: { at: [1600, 1030], text: "DHMC, Lebanon ↓" },
  orange: { at: [915, 1030], text: "West Lebanon ↓" },
  coach: { at: [1555, 372], text: "I-89 to Boston Logan →" },
};

/** Routes that show a live bus marker (demo). Orange has none on purpose. */
const LIVE_IDS = ["blue", "juniper", "coach"];

type Stop = { name: string; at: Pt; routes: string[] };

const STOPS: Stop[] = [
  { name: "Dartmouth Green", at: [948, 606], routes: ["juniper", "blue", "orange"] },
  { name: "Hanover Inn (Dartmouth Coach)", at: [990, 628], routes: ["coach"] },
  { name: "E Wheelock at College St", at: [1080, 594], routes: ["juniper", "blue", "coach"] },
  { name: "E Wheelock at Park St", at: [1522, 450], routes: ["juniper", "blue", "coach"] },
  { name: "N Park St at Maynard", at: [1480, 200], routes: ["juniper"] },
  { name: "S Park St at Valley Rd", at: [1557, 590], routes: ["blue"] },
  { name: "Hanover High School", at: [1590, 830], routes: ["blue"] },
  { name: "S Main at Allen St", at: [943, 724], routes: ["orange"] },
  { name: "S Main at Maple St", at: [929, 884], routes: ["orange"] },
];

/** A flat building footprint: soft fill, crisp outline, gold when hovered. */
function Footprint({ l, on }: { l: Landmark; on: boolean }) {
  return (
    <g style={{ filter: on ? "drop-shadow(0 0 8px rgba(240,180,41,0.85))" : undefined, transition: "filter 200ms" }}>
      <rect x={l.x} y={l.y} width={l.w} height={l.d} rx={5} fill={l.fill} stroke={on ? "#f0b429" : l.stroke} strokeWidth={on ? 4 : 2.5} />
      <rect x={l.x + 8} y={l.y + 8} width={l.w - 16} height={l.d - 16} rx={3} fill="none" stroke={l.stroke} strokeOpacity={0.35} strokeWidth={1.5} />
    </g>
  );
}

function Label({ at, text, size = 15, angle = 0, color = "#6b7280", weight = 600 }: { at: Pt; text: string; size?: number; angle?: number; color?: string; weight?: number }) {
  return (
    <text x={at[0]} y={at[1]} fontSize={size} fontWeight={weight} fill={color} textAnchor="middle" stroke="#f6f4ef" strokeWidth={4} paintOrder="stroke" transform={angle ? `rotate(${angle} ${at[0]} ${at[1]})` : undefined} pointerEvents="none">
      {text}
    </text>
  );
}

export function HanoverMap({ active, onActive }: { active: string | null; onActive: (id: string | null) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const [stop, setStop] = useState<Stop | null>(null);
  // Random speed and starting point per bus, picked in the browser only so server and client markup match.
  const [live, setLive] = useState<Record<string, { dur: number; offset: number }> | null>(null);
  useEffect(() => {
    setLive(Object.fromEntries(LIVE_IDS.map((id) => {
      const dur = 40 + Math.random() * 40;
      return [id, { dur, offset: Math.random() * dur }];
    })));
  }, []);
  const hovered = LANDMARKS.find((l) => l.id === hover);

  return (
    <svg viewBox="380 0 1320 1076" preserveAspectRatio="xMidYMid meet" className="h-full w-full select-none" role="img" aria-label="Street map of central Hanover with bus routes, bus stops and campus landmarks">
      <rect x={0} y={0} width={2000} height={1076} fill="#f3f1ec" />
      <polygon points={poly(RIVER)} fill="#a9d8ef" />
      <polygon points={poly(DOWNTOWN)} fill="#f3e9d2" />
      {PARKS.map((p, i) => (
        <polygon key={i} points={poly(p)} fill="#cfe8cf" />
      ))}
      <path d={d([[950, 425], [1070, 590]])} stroke="#e6f3e6" strokeWidth={3} />
      <path d={d([[1070, 425], [952, 604]])} stroke="#e6f3e6" strokeWidth={3} />

      {MINOR.map((r, i) => (
        <path key={i} d={d(r.path)} stroke="#dde1e8" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
      {MAJOR.map((r, i) => (
        <g key={i}>
          <path d={d(r.path)} stroke="#a9b3c3" strokeWidth={19} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d={d(r.path)} stroke="#c3cad6" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      ))}
      {[...MINOR, ...MAJOR].map((r, i) => r.name && r.at && <Label key={`l${i}`} at={r.at} text={r.name} angle={r.angle ?? 0} size={14} />)}
      <Label at={[1006, 520]} text="The Green" color="#3f7a4e" size={15} />
      <Label at={[1335, 300]} text="College Park" color="#3f7a4e" size={14} />

      {ROUTES.map((r) => {
        const on = active === r.id;
        const dim = active != null && !on;
        const path = d(ROUTE_PATHS[r.id]!);
        return (
          <g key={r.id} style={{ opacity: on ? 1 : dim ? 0.08 : 0.42, transition: "opacity 220ms" }}>
            {on && <path d={path} stroke="#fff" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
            <path d={path} stroke={r.color} strokeWidth={on ? 10 : 6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d={path} stroke="transparent" strokeWidth={30} fill="none" className="cursor-pointer" onMouseEnter={() => onActive(r.id)} onMouseLeave={() => onActive(null)} />
          </g>
        );
      })}

      {LANDMARKS.map((l) => (
        <g key={l.id} className="cursor-pointer" onMouseEnter={() => setHover(l.id)} onMouseLeave={() => setHover(null)}>
          <Footprint l={l} on={hover === l.id} />
          <Label at={[l.x + l.w / 2, l.y + l.d + 22]} text={l.name} size={14} color="#3a3f47" weight={700} />
        </g>
      ))}

      {STOPS.map((s) => {
        const on = active != null && s.routes.includes(active);
        const dim = active != null && !on;
        const color = on && active ? getRoute(active).color : "#2f3a35";
        return (
          <g
            key={s.name}
            transform={`translate(${s.at[0]} ${s.at[1]})`}
            className="cursor-pointer"
            style={{ opacity: dim ? 0.35 : 1, transition: "opacity 200ms" }}
            onMouseEnter={() => setStop(s)}
            onMouseLeave={() => setStop(null)}
          >
            <circle r={on ? 15 : 12} fill="#fff" stroke={color} strokeWidth={4} />
            <rect x={-6} y={-5} width={12} height={9} rx={2} fill={color} />
            <rect x={-4} y={-3} width={8} height={3} fill="#fff" />
          </g>
        );
      })}

      {ROUTES.map((r) => {
        const e = ENDS[r.id]!;
        const on = active === r.id;
        return (
          <g key={`end-${r.id}`} style={{ opacity: on ? 1 : active ? 0.15 : 0.75, transition: "opacity 220ms" }} pointerEvents="none">
            <Tag at={e.at} text={e.text} color={r.color} strong={on} />
          </g>
        );
      })}

      {live &&
        ROUTES.filter((r) => live[r.id]).map((r) => (
          <LiveBus key={r.id} route={r.short} path={d(ROUTE_PATHS[r.id]!)} color={r.color} dim={active != null && active !== r.id} dur={live[r.id]!.dur} offset={live[r.id]!.offset} />
        ))}
      <YouAreHere at={[1002, 730]} />

      {stop && <Tooltip at={[stop.at[0], stop.at[1] - 22]} title={stop.name} sub={`Stop for ${stop.routes.map((id) => getRoute(id).short).join(", ")}`} />}
      {hovered && <Tooltip at={[hovered.x + hovered.w / 2, hovered.y - 8]} title={hovered.name} sub={hovered.note} />}
    </svg>
  );
}

/** Demo live bus: a blinking marker that tracks along the Blue route. */
function LiveBus({ route, path, color, dim, dur, offset }: { route: string; path: string; color: string; dim: boolean; dur: number; offset: number }) {
  return (
    <g style={{ opacity: dim ? 0.25 : 1, transition: "opacity 220ms" }} pointerEvents="none">
      <g>
        <animateMotion dur={`${dur.toFixed(1)}s`} begin={`-${offset.toFixed(1)}s`} repeatCount="indefinite" path={path} calcMode="linear" keyPoints="0;1;0" keyTimes="0;0.5;1" />
        <circle r={14} fill={color} opacity={0.3}>
          <animate attributeName="r" values="14;34;14" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.45;0;0.45" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle r={15} fill="#fff" stroke={color} strokeWidth={5} />
        <rect x={-7} y={-5.5} width={14} height={10} rx={2.5} fill={color} />
        <rect x={-5} y={-3.5} width={10} height={3.5} fill="#fff" />
        <circle cx={-3.5} cy={6.5} r={1.8} fill={color} />
        <circle cx={3.5} cy={6.5} r={1.8} fill={color} />
        <g transform="translate(0 -30)">
          <rect x={-(route.length * 9 + 74) / 2} y={-15} width={route.length * 9 + 74} height={30} rx={15} fill={color} />
          <circle cx={-(route.length * 9 + 74) / 2 + 17} cy={0} r={5} fill="#fff">
            <animate attributeName="opacity" values="1;0.15;1" dur="1s" repeatCount="indefinite" />
          </circle>
          <text x={14} y={5.5} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">
            LIVE · {route}
          </text>
        </g>
      </g>
    </g>
  );
}

/** "You are here" pin in the open space just south of the Hanover Inn. Static: no animation. */
function YouAreHere({ at }: { at: Pt }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]})`} pointerEvents="none">
      <circle r={26} fill="#1a73e8" opacity={0.16} />
      <circle r={12} fill="#1a73e8" stroke="#fff" strokeWidth={5} />
      <g transform="translate(0 20)">
        <path d="M-7 1 L0 -8 L7 1 Z" fill="#1a73e8" />
        <rect x={-58} y={0} width={116} height={30} rx={15} fill="#1a73e8" />
        <text x={0} y={21} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">
          You are here
        </text>
      </g>
    </g>
  );
}

function Tag({ at, text, color, strong }: { at: Pt; text: string; color: string; strong: boolean }) {
  const w = text.length * 9.6 + 28;
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <rect x={-w / 2} y={-18} width={w} height={34} rx={17} fill={strong ? color : "#fff"} stroke={color} strokeWidth={3} />
      <text x={0} y={5} textAnchor="middle" fontSize={16} fontWeight={800} fill={strong ? "#fff" : color}>
        {text}
      </text>
    </g>
  );
}

function Tooltip({ at, title, sub }: { at: Pt; title: string; sub: string }) {
  const w = Math.max(title.length * 10.5, sub.length * 8) + 32;
  return (
    <g transform={`translate(${at[0]} ${at[1]})`} pointerEvents="none">
      <rect x={-w / 2} y={-66} width={w} height={56} rx={12} fill="#fffdf6" stroke="#1f3a2e" strokeWidth={2} />
      <path d="M-8 -11 L0 0 L8 -11 Z" fill="#fffdf6" stroke="#1f3a2e" strokeWidth={2} strokeLinejoin="round" />
      <rect x={-9} y={-14} width={18} height={5} fill="#fffdf6" />
      <text x={0} y={-42} textAnchor="middle" fontSize={18} fontWeight={800} fill="#1f3a2e">
        {title}
      </text>
      <text x={0} y={-20} textAnchor="middle" fontSize={14} fill="#5b6660">
        {sub}
      </text>
    </g>
  );
}
