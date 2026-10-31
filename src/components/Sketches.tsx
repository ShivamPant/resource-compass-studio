// Hand-drawn notebook sketches for the About story. Plain SVG run through a displacement filter
// so lines wobble like pencil. Everything is decorative; the story text carries the meaning.
import type { ReactNode } from "react";

const INK = "#2f3a35";
const GREEN = "#00693e";
const SKIN = "#f1d3b8";
const HAND = "'Caveat', 'Patrick Hand', cursive";

type Mood = "calm" | "confused" | "happy";

/** Shared filters. Render once per page. */
export function SketchDefs() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <defs>
        <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" />
        </filter>
        <filter id="wash" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
        </filter>
      </defs>
    </svg>
  );
}

function Frame({ children, label, w = 480, h = 300 }: { children: ReactNode; label: string; w?: number; h?: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="h-auto w-full" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function Hand({ x, y, size = 18, children, anchor = "middle", color = INK, rotate = 0 }: { x: number; y: number; size?: number; children: ReactNode; anchor?: "start" | "middle" | "end"; color?: string; rotate?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={HAND} fontSize={size} fill={color} stroke="none" transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>
      {children}
    </text>
  );
}

/** A thick arm with a pencil outline: ink stroke underneath, colour on top. */
function Arm({ d }: { d: string }) {
  return (
    <>
      <path d={d} strokeWidth={15} />
      <path d={d} stroke={GREEN} strokeWidth={11} />
    </>
  );
}

export function Student({ x, y, s = 1, mood }: { x: number; y: number; s?: number; mood: Mood }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#rough)">
      <path d="M-24 98 L-22 150 L-5 150 L0 112 L5 150 L22 150 L24 98 Z" fill="#5d6f92" />
      <ellipse cx={-14} cy={153} rx={12} ry={5} fill="#3b3b3b" />
      <ellipse cx={14} cy={153} rx={12} ry={5} fill="#3b3b3b" />
      <path d="M-24 18 Q-31 -32 0 -33 Q31 -32 24 18 Z" fill={GREEN} />
      <path d="M-30 24 Q-36 64 -28 100 L28 100 Q36 64 30 24 Q14 16 0 18 Q-14 16 -30 24 Z" fill={GREEN} />
      <text x={0} y={74} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={32} fill="#fff" stroke="none">
        D
      </text>
      <path d="M-6 22 L-8 40 M6 22 L8 40" stroke="#fff" strokeWidth={1.6} />
      <path d="M-16 88 Q0 82 16 88" />

      {mood === "calm" && (
        <>
          <Arm d="M-27 30 Q-40 60 -34 86" />
          <Arm d="M27 30 Q40 60 34 86" />
          <circle cx={-34} cy={89} r={6} fill={SKIN} />
          <circle cx={34} cy={89} r={6} fill={SKIN} />
        </>
      )}
      {mood === "confused" && (
        <>
          <Arm d="M-27 30 Q-54 2 -25 -17" />
          <circle cx={-23} cy={-19} r={6.5} fill={SKIN} />
          <Arm d="M27 30 Q52 60 24 52" />
          <rect x={6} y={28} width={20} height={30} rx={3} fill="#1f2a2a" />
          <rect x={9} y={32} width={14} height={20} rx={1} fill="#9fd3ff" stroke="none" />
          <circle cx={22} cy={52} r={6} fill={SKIN} />
          <path d="M26 -16 q4 6 0 9 q-4 -3 0 -9 Z" fill="#8cc8f0" strokeWidth={1.4} />
        </>
      )}
      {mood === "happy" && (
        <>
          <Arm d="M-27 30 Q-42 58 -24 66" />
          <rect x={-40} y={52} width={18} height={26} rx={3} fill="#1f2a2a" />
          <rect x={-37} y={55} width={12} height={18} rx={1} fill="#c9f2d8" stroke="none" />
          <Arm d="M27 30 Q50 10 40 -12" />
          <circle cx={40} cy={-15} r={6.5} fill={SKIN} />
          <path d="M40 -21 L41 -31" strokeWidth={4} />
        </>
      )}

      <circle r={20} fill={SKIN} />
      <path d="M-20 -4 Q-21 -25 0 -24 Q19 -25 20 -6 Q12 -16 2 -13 Q-8 -18 -20 -4 Z" fill="#2e2118" />
      {mood === "happy" ? (
        <>
          <path d="M-10 3 Q-7 -1 -4 3 M4 3 Q7 -1 10 3" />
          <path d="M-8 9 Q0 19 8 9 Z" fill="#8a3a3a" />
          <circle cx={-12} cy={9} r={3.5} fill="#f2a0a0" stroke="none" opacity={0.6} />
          <circle cx={12} cy={9} r={3.5} fill="#f2a0a0" stroke="none" opacity={0.6} />
        </>
      ) : (
        <>
          <circle cx={-7} cy={2} r={1.8} fill={INK} />
          <circle cx={7} cy={2} r={1.8} fill={INK} />
          {mood === "confused" ? (
            <>
              <path d="M-12 -6 L-3 -4 M3 -9 L12 -6" />
              <path d="M-6 12 Q-3 9 0 12 Q3 15 6 12" />
            </>
          ) : (
            <path d="M-5 11 Q0 14 5 11" />
          )}
        </>
      )}
    </g>
  );
}

/** Scalloped thought cloud with handwritten lines and trailing bubbles toward the thinker. */
export function Cloud({ cx, cy, rx, ry, lines, tail, size = 17 }: { cx: number; cy: number; rx: number; ry: number; lines: string[]; tail: [number, number][]; size?: number }) {
  const n = 11;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as const;
  });
  let d = `M${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    const r = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.6;
    d += ` A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  }
  return (
    <g filter="url(#rough)">
      <path d={`${d} Z`} fill="#fffdf6" />
      {tail.map(([tx, ty], i) => (
        <circle key={i} cx={tx} cy={ty} r={6 - i * 2} fill="#fffdf6" />
      ))}
      {lines.map((l, i) => (
        <Hand key={l} x={cx} y={cy + (i - (lines.length - 1) / 2) * (size + 2) + size / 3} size={size}>
          {l}
        </Hand>
      ))}
    </g>
  );
}

function AppIcon({ x, y, color, label, glyph, rotate = 0 }: { x: number; y: number; color: string; label: string; glyph: ReactNode; rotate?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} filter="url(#rough)">
      <rect x={-20} y={-20} width={40} height={40} rx={10} fill={color} />
      <g stroke="#fff" strokeWidth={2.4}>{glyph}</g>
      <Hand x={0} y={36} size={15}>
        {label}
      </Hand>
    </g>
  );
}

function Pine({ x, y, h = 70 }: { x: number; y: number; h?: number }) {
  const w = h * 0.45;
  return (
    <g filter="url(#rough)">
      <path d={`M${x} ${y - h} L${x - w * 0.6} ${y - h * 0.55} L${x - w * 0.3} ${y - h * 0.55} L${x - w} ${y - h * 0.12} L${x + w} ${y - h * 0.12} L${x + w * 0.3} ${y - h * 0.55} L${x + w * 0.6} ${y - h * 0.55} Z`} fill="#2f6b4f" />
      <path d={`M${x} ${y - h * 0.12} L${x} ${y}`} strokeWidth={4} />
    </g>
  );
}

/** Baker Library's tower, roughly. */
function Baker({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} filter="url(#rough)">
      <rect x={-70} y={-50} width={140} height={50} fill="#d9a184" />
      {[-50, -25, 25, 50].map((wx) => (
        <path key={wx} d={`M${wx - 7} -10 L${wx - 7} -30 Q${wx} -40 ${wx + 7} -30 L${wx + 7} -10 Z`} fill="#fff7e8" />
      ))}
      <rect x={-16} y={-110} width={32} height={60} fill="#fffaf0" />
      <path d="M-10 -78 Q0 -90 10 -78 L10 -60 L-10 -60 Z" fill="#cfe3f0" />
      <rect x={-11} y={-132} width={22} height={22} fill="#fffaf0" />
      <path d="M-11 -132 L0 -168 L11 -132" fill="#7f9c8c" />
      <path d="M0 -168 L0 -182 M-5 -178 L5 -178" />
      <path d="M-80 0 L80 0" />
    </g>
  );
}

function Leaves({ spots }: { spots: [number, number, number][] }) {
  return (
    <g filter="url(#rough)" strokeWidth={1.4}>
      {spots.map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y} q6 -8 12 0 q-6 8 -12 0 Z`} fill={i % 2 ? "#d9822b" : "#c0392b"} transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </g>
  );
}

function Bus({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`} filter="url(#rough)">
      <rect x={0} y={0} width={170} height={66} rx={12} fill="#3a6fb0" />
      {[14, 50, 86].map((wx) => (
        <rect key={wx} x={wx} y={10} width={28} height={22} rx={3} fill="#e8f3ff" />
      ))}
      <rect x={124} y={10} width={34} height={44} rx={3} fill="#e8f3ff" />
      <rect x={10} y={40} width={104} height={14} rx={3} fill="#1d3d66" stroke="none" />
      <Hand x={62} y={52} size={14} color="#ffe9a8">
        {label}
      </Hand>
      <circle cx={36} cy={68} r={11} fill="#333" />
      <circle cx={134} cy={68} r={11} fill="#333" />
    </g>
  );
}

function Arrow({ d, head }: { d: string; head: string }) {
  return (
    <g filter="url(#rough)" strokeWidth={2.4}>
      <path d={d} strokeDasharray="0" />
      <path d={head} />
    </g>
  );
}

export function SceneMeet() {
  return (
    <Frame label="Sketch: Sam, a Dartmouth student in a green D hoodie, stands on the Green in front of Baker Library's tower.">
      <path d="M10 262 Q120 252 240 260 T470 256" filter="url(#rough)" />
      <path d="M30 262 Q60 240 120 246 M300 258 Q360 244 440 252" stroke="#7fae7f" filter="url(#rough)" strokeWidth={6} opacity={0.5} />
      <Baker x={392} y={258} />
      <Pine x={60} y={258} h={92} />
      <Pine x={210} y={258} h={60} />
      <Leaves spots={[[100, 70, 20], [170, 40, -30], [250, 90, 60], [440, 60, 10], [30, 120, -20]]} />
      <Student x={140} y={100} s={0.95} mood="calm" />
      <Hand x={232} y={112} size={22} anchor="start">
        Sam, &apos;27
      </Hand>
      <Arrow d="M228 106 Q200 96 172 92" head="M180 84 L170 92 L181 99" />
      <Hand x={232} y={136} size={17} anchor="start" color="#5b6660">
        (no car, lots of places to be)
      </Hand>
    </Frame>
  );
}

export function SceneConfused() {
  return (
    <Frame label="Sketch: Sam looks confused at a phone, surrounded by app icons and thought clouds asking how to catch the Summit shuttle, which Advance Transit bus goes to DHMC, where the trip spreadsheet is, and who is driving to Logan." h={330}>
      <Student x={240} y={160} s={0.95} mood="confused" />
      <Cloud cx={92} cy={58} rx={82} ry={40} lines={["Is the Summit", "shuttle running??"]} tail={[[160, 104], [178, 120], [190, 132]]} />
      <Cloud cx={390} cy={56} rx={86} ry={40} lines={["Which AT bus", "goes to DHMC?"]} tail={[[318, 102], [298, 118], [284, 128]]} />
      <Cloud cx={80} cy={188} rx={74} ry={36} lines={["where's that trip", "spreadsheet…"]} tail={[[154, 176], [170, 168], [182, 162]]} size={16} />
      <Cloud cx={402} cy={190} rx={74} ry={36} lines={["who's driving", "to Logan Sun?"]} tail={[[330, 176], [314, 168], [302, 160]]} size={16} />
      <AppIcon x={52} y={276} color="#3a6fb0" label="AT app" rotate={-8} glyph={<Hand x={0} y={7} size={20} color="#fff">AT</Hand>} />
      <AppIcon x={130} y={290} color={GREEN} label="shuttle" rotate={6} glyph={<path d="M-11 -6 h22 v12 h-22 Z M-7 9 v2 M7 9 v2" />} />
      <AppIcon x={350} y={290} color="#4a154b" label="Slack" rotate={-5} glyph={<path d="M-5 -10 L-7 10 M5 -10 L3 10 M-10 -4 L10 -4 M-11 4 L9 4" />} />
      <AppIcon x={428} y={276} color="#1e7a45" label="Sheets" rotate={9} glyph={<path d="M-10 -10 h20 v20 h-20 Z M-10 0 h20 M0 -10 v20" />} />
      <AppIcon x={240} y={18} color="#c0392b" label="" rotate={4} glyph={<path d="M-10 -6 h20 v13 h-20 Z M-10 -6 L0 2 L10 -6" />} />
      <Hand x={292} y={150} size={34} color="#c0392b" rotate={12}>
        ?
      </Hand>
      <Hand x={184} y={152} size={28} color="#c0392b" rotate={-14}>
        ?
      </Hand>
    </Frame>
  );
}

export function SceneOneMap() {
  return (
    <Frame label="Sketch: arrows carry the scattered apps into one phone showing D Ride with four tabs: Bus, Naksha, Trips and Community.">
      <AppIcon x={50} y={60} color="#3a6fb0" label="AT app" rotate={-8} glyph={<Hand x={0} y={7} size={20} color="#fff">AT</Hand>} />
      <AppIcon x={42} y={160} color="#4a154b" label="Slack" rotate={6} glyph={<path d="M-5 -10 L-7 10 M5 -10 L3 10 M-10 -4 L10 -4 M-11 4 L9 4" />} />
      <AppIcon x={58} y={252} color="#1e7a45" label="Sheets" rotate={-4} glyph={<path d="M-10 -10 h20 v20 h-20 Z M-10 0 h20 M0 -10 v20" />} />
      <Arrow d="M86 64 Q140 70 180 110" head="M170 112 L181 111 L180 100" />
      <Arrow d="M80 160 L176 158" head="M167 150 L177 158 L167 166" />
      <Arrow d="M94 248 Q140 240 180 206" head="M169 206 L181 205 L180 216" />
      <g filter="url(#rough)">
        <rect x={196} y={24} width={130} height={256} rx={20} fill="#1f2a2a" />
        <rect x={205} y={42} width={112} height={222} rx={8} fill="#f6f4ea" />
        <text x={261} y={76} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={26} fill={GREEN} stroke="none">
          D Ride
        </text>
        {[
          ["Bus", "#3a6fb0"],
          ["Naksha", "#e0b040"],
          ["Trips", "#c0392b"],
          ["Community", GREEN],
        ].map(([t, c], i) => (
          <g key={t}>
            <rect x={215} y={94 + i * 40} width={92} height={30} rx={8} fill="#fff" />
            <circle cx={230} cy={109 + i * 40} r={6} fill={c} stroke="none" />
            <Hand x={242} y={115 + i * 40} size={17} anchor="start">
              {t}
            </Hand>
          </g>
        ))}
      </g>
      <Hand x={350} y={110} size={22} anchor="start">
        one place.
      </Hand>
      <Hand x={350} y={140} size={22} anchor="start">
        one map.
      </Hand>
      <Hand x={350} y={184} size={16} anchor="start" color="#5b6660">
        (naksha = map)
      </Hand>
    </Frame>
  );
}

export function SceneDecide() {
  return (
    <Frame label="Sketch: Sam smiles and gives a thumbs up at the bus stop as the Blue bus to DHMC arrives. The phone says leave now; a note says Naksha found the bus and Sam chose.">
      <path d="M10 262 Q240 254 470 260" filter="url(#rough)" />
      <g filter="url(#rough)">
        <path d="M418 262 L418 150" strokeWidth={3} />
        <rect x={398} y={128} width={40} height={26} rx={4} fill="#fff" />
        <Hand x={418} y={147} size={15}>
          BUS
        </Hand>
      </g>
      <Bus x={210} y={176} label="Blue → DHMC" />
      <Student x={110} y={100} s={0.95} mood="happy" />
      <g filter="url(#rough)">
        <path d="M30 22 h170 a10 10 0 0 1 10 10 v34 a10 10 0 0 1 -10 10 h-110 l-16 16 l2 -16 h-46 a10 10 0 0 1 -10 -10 v-34 a10 10 0 0 1 10 -10 Z" fill="#fff6d6" />
      </g>
      <Hand x={115} y={46} size={18}>
        Leave now, the 8:40
      </Hand>
      <Hand x={115} y={66} size={18}>
        Blue is 6 min away
      </Hand>
      <Hand x={236} y={60} size={17} anchor="start" color={GREEN}>
        ✓ Naksha found the bus
      </Hand>
      <Hand x={236} y={86} size={17} anchor="start" color="#c0392b">
        ✓ Sam made the call
      </Hand>
    </Frame>
  );
}
