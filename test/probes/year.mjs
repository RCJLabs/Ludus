/* #215 — CAN THE SAND HAVE FOUR SEASONS AND STILL BE READABLE?

   The item: "Winter, summer, festivals move purses, training, fatigue and healing — and the ludus
   is drawn in the same golden afternoon all year. The v3.145.0 machinery (`SCN_SAND`'s stop table
   with derived ink) makes a per-season grade cheap and safe."

   TRUE ON BOTH HALVES. The drawn ludus contains ZERO references to `seasonOf`, `CALENDAR` or
   anything else about the time of year — checked across the whole scene — and `SCN_SAND` is a
   single flat list of five stops. And the machinery really is there: `scnSandAt` interpolates the
   stops, `scnInk` picks whichever of the dark and lit inks wins contrast against the sand at that
   y, and `legible` composites the real stack and fails under 4.0:1.

   BUT THERE IS A CATCH THE ITEM DOES NOT MENTION, and it decides how this is built. `scnInk(y)`
   takes only a y. Threading a season through it means threading it through `scnSay` and `scnName`
   too — every label in the drawing, about twenty call sites, each one a chance to miss one and
   leave a label reading against the wrong ground. The alternative is to keep the ink
   SEASON-INDEPENDENT and choose, at each y, the ink that wins in the WORST season. That is a
   STRONGER guarantee than today's (which holds for one ground, not four) and touches nothing.

   IT IS ONLY AVAILABLE IF THE NUMBERS ALLOW IT, which is what this measures: for a candidate set
   of four graded tables, what is the worst contrast any label sees, in any season, if the ink is
   fixed per y across the year?

     node test/probes/year.mjs */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../harness.mjs";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");

/* the constants, parsed rather than retyped — a probe that has drifted from the drawing says so */
const grab = re => { const m = src.match(re); if(!m) throw new Error("could not parse: " + re); return m[1]; };
const BASE = JSON.parse(grab(/const SCN_SAND = (\[\[[^;]*\]\]);/).replace(/'/g, '"'));
const SCN_TOP = +grab(/const SCN_TOP = (\d+)/), SCN_SPAN = +grab(/SCN_SPAN = (\d+)/);
const SCN_INK = grab(/const SCN_INK = "(#[0-9a-f]+)"/), SCN_LIT = grab(/SCN_LIT = "(#[0-9a-f]+)"/);
console.log(`SCN_SAND  ${JSON.stringify(BASE)}`);
console.log(`the sand runs y=${SCN_TOP} to ${SCN_TOP+SCN_SPAN} · inks ${SCN_INK} / ${SCN_LIT}\n`);

/* every y a label sits at, taken off the source so a new label joins the measurement by existing */
const ys = [...new Set([
  ...[...src.matchAll(/scnSay\(\s*[\d.]+\s*,\s*(\d+)/g)].map(m=>+m[1]),
  ...[...src.matchAll(/scnName\(\s*[\d.]+\s*,\s*(\d+)/g)].map(m=>+m[1]),
  ...[...src.matchAll(/<text x="\d+" y="(\d+)"[^>]*scnInk/g)].map(m=>+m[1]),
])].sort((a,b)=>a-b);
if(ys.length < 8) throw new Error(`only ${ys.length} label positions parsed — fix the regex first`);
console.log(`${ys.length} label baselines in the drawing: ${ys.join(" ")}\n`);

const hex = h => [0,1,2].map(i=>parseInt(h.replace("#","").slice(i*2,i*2+2),16));
const lum = c => { const f = v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
  return 0.2126*f(c[0]) + 0.7152*f(c[1]) + 0.0722*f(c[2]); };
const ratio = (a,b) => { const x = lum(a), y = lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };
const sandAt = (table, y) => {
  const t = Math.max(0, Math.min(1, (y - SCN_TOP) / SCN_SPAN));
  let lo = table[0], hi = table[table.length-1];
  for(let i=0;i<table.length-1;i++)
    if(t >= table[i][0] && t <= table[i+1][0]){ lo = table[i]; hi = table[i+1]; break; }
  const k = (hi[0]-lo[0]) ? (t-lo[0])/(hi[0]-lo[0]) : 0;
  const a = hex(lo[1]), b = hex(hi[1]);
  return [0,1,2].map(i => a[i]*(1-k) + b[i]*k);
};

/* ---- THE CANDIDATE GRADES ----
   Each is the base table's five stops moved, not a new set of colours: a season is the SAME ground
   under a different sun. The multipliers are per-channel so a season can be cooler or warmer as
   well as brighter or dimmer, which is the whole of what a low sun does.

   AND THE POLARITY IS THE CONSTRAINT, which the first cut got wrong. The drawing's ink rule is
   that the top and bottom of the gradient are DARK (pale ink wins there) and the middle is LIT
   (dark ink wins). A season that flattens that — a winter dimmed toward mid-tone, a summer that
   lifts the dark ends — makes labels change ink, and a label whose ink changes with the month is a
   label that has to be threaded through twenty call sites. A season must modulate WITHIN the
   polarity, not against it. A low winter sun on wet sand is pale, grey and FLAT-BRIGHT, not dark:
   that is the fix, and it is also what winter actually looks like. */
const SETS = {
  "first cut — winter dimmed": {
    spring: { mul:[1.00,1.00,1.00], add:[  0,  0,  0], say:"the base table" },
    summer: { mul:[1.10,1.06,0.86], add:[ 10,  6, -6], say:"bleached" },
    autumn: { mul:[1.02,0.93,0.80], add:[  8, -2, -6], say:"a low red sun" },
    winter: { mul:[0.80,0.83,0.96], add:[ -6, -2,  6], say:"dimmed and cold" },
  },
  "winter lifted and greyed": {
    spring: { mul:[1.00,1.00,1.00], add:[  0,  0,  0], say:"the base table — a mild dry morning" },
    summer: { mul:[1.09,1.05,0.84], add:[  8,  4, -5], say:"bleached, the blue burnt out of it" },
    autumn: { mul:[1.02,0.92,0.78], add:[  7, -2, -5], say:"a low sun, the ground gone red" },
    winter: { mul:[0.88,0.92,1.06], add:[ 14, 16, 20], say:"pale, grey and flat — wet sand under cloud" },
  },
  "the same, softened by a third": null,   /* filled below, from the row above */
};
/* ---- AND THE ONE THAT WORKS, BY CONSTRUCTION ----
   The ink flips because a season moves the DARK ENDS of the gradient — the top, where the compound
   stands in its own haze, and the near foreground. Those two are what make pale ink win there. So
   weight the grade by how much light falls on that part of the ground: full at the middle of the
   sand, nothing at either end. The sun changes what the sun lights; the shadow at the top of the
   drawing and the ground at the player's feet are the same in every month, which is also true.
   The polarity cannot flip because the ends never move. */
const WEIGHTS = {
  "sin":        t => Math.sin(Math.PI * t),
  "sin^2":      t => Math.pow(Math.sin(Math.PI * t), 2),
  "out by .82": t => (t <= 0 || t >= 0.82) ? 0 : Math.sin(Math.PI * t / 0.82),
  "out by .74": t => (t <= 0 || t >= 0.74) ? 0 : Math.sin(Math.PI * t / 0.74),
};
let WEIGHT = WEIGHTS["sin"];
{ const b = SETS["winter lifted and greyed"], soft = {};
  for(const k of Object.keys(b)) soft[k] = { mul: b[k].mul.map(v=>1+(v-1)/1.5),
    add: b[k].add.map(v=>v/1.5), say: b[k].say + ", softened" };
  SETS["the same, softened by a third"] = soft; }




const clamp255 = v => Math.max(0, Math.min(255, Math.round(v)));
const toHex = c => "#" + c.map(v=>clamp255(v).toString(16).padStart(2,"0")).join("");
/* a season is the base table's stops moved, per channel — the same ground under a different sun */
const table = (GRADE, key, weighted) => { const G = GRADE[key];
  return BASE.map(([at, h]) => { const w = weighted ? WEIGHT(at) : 1;
    return [at, toHex(hex(h).map((v,i)=>v*(1 + (G.mul[i]-1)*w) + G.add[i]*w))]; }); };

const lab = ([R,G,B]) => { const f=c=>{ c/=255; return c<=.04045 ? c/12.92 : Math.pow((c+.055)/1.055,2.4); };
  const [r,g,b]=[f(R),f(G),f(B)];
  let X=(r*.4124+g*.3576+b*.1805)/.95047, Y=r*.2126+g*.7152+b*.0722, Z=(r*.0193+g*.1192+b*.9505)/1.08883;
  const q=t=> t>0.008856 ? Math.cbrt(t) : (7.787*t)+16/116;
  [X,Y,Z]=[q(X),q(Y),q(Z)];
  return [116*Y-16, 500*(X-Y), 200*(Y-Z)]; };
const dE = (a,b) => { const p=lab(a), q=lab(b); return Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]); };
const mid = SCN_TOP + SCN_SPAN*0.5;

const tryGrade = (label, GRADE, loud) => {
  const KEYS = Object.keys(GRADE);
  const weighted = /where the light falls/.test(label);
  const tables = Object.fromEntries(KEYS.map(k=>[k, table(GRADE, k, weighted)]));
  let worst = 99, worstAt = null, flips = 0, seen = 99;
  const rows = [];
  for(const y of ys){
    const scores = ink => Math.min(...KEYS.map(k => ratio(hex(ink), sandAt(tables[k], y))));
    const pick = scores(SCN_INK) >= scores(SCN_LIT) ? SCN_INK : SCN_LIT;
    const per = KEYS.map(k => ratio(hex(SCN_INK), sandAt(tables[k], y)) >= ratio(hex(SCN_LIT), sandAt(tables[k], y)) ? "D" : "L");
    if(new Set(per).size > 1) flips++;
    const row = KEYS.map(k => ratio(hex(pick), sandAt(tables[k], y)));
    const lo = Math.min(...row);
    if(lo < worst){ worst = lo; worstAt = y; }
    rows.push({ y, pick, per, row, lo });
  }
  const moves = KEYS.filter(k=>k!=="spring").map(k=>dE(sandAt(tables.spring, mid), sandAt(tables[k], mid)));
  seen = Math.min(...moves);
  console.log(`\n=== ${label} ===`);
  for(const k of KEYS) console.log(`  ${k.padEnd(7)} ${tables[k].map(s=>s[1]).join(" ")}   ${GRADE[k].say}`);
  console.log(`  ground moves from spring, ΔE at the sand's midpoint: ${moves.map(v=>v.toFixed(1)).join(" · ")}  (2.3 = JND)`);
  if(loud){
    console.log(`     y     ink        ${KEYS.map(k=>k.slice(0,6).padStart(7)).join(" ")}`);
    for(const r of rows) console.log(`  ${String(r.y).padStart(4)}   ${r.pick === SCN_INK ? "dark" : "lit "} ${new Set(r.per).size>1?"*":" "}   `
      + r.row.map(v=>v.toFixed(2).padStart(7)).join(" ") + (r.lo < 4 ? "   << under 4.0" : ""));
  }
  console.log(`  worst label in any season: ${worst.toFixed(2)}:1 at y=${worstAt} (bar 4.0) · ink flips: ${flips} of ${ys.length}`);
  const ok = flips === 0 && worst >= 4.0 && seen >= 2.3;
  console.log(`  -> ${ok ? "ONE INK SERVES THE WHOLE YEAR — no call site changes, and the guarantee holds for four grounds instead of one."
    : "NOT USABLE as written: " + [flips?`${flips} ink flips`:null, worst<4?`worst ${worst.toFixed(2)} under the bar`:null,
       seen<2.3?`the smallest season move is only ΔE ${seen.toFixed(1)}`:null].filter(Boolean).join(", ")}`);
  return { ok, worst, flips, seen };
};

/* run every candidate */
const results = {};
for(const [label, G] of Object.entries(SETS)) results[label] = tryGrade(label, G, true);
/* and the weighted family, one row per falloff */
for(const [wname, fn] of Object.entries(WEIGHTS)){
  WEIGHT = fn;
  results[`graded only where the light falls · ${wname}`] =
    tryGrade(`graded only where the light falls · ${wname}`, SETS["winter lifted and greyed"], wname === "out by .74");
}

console.log(`\n---- THE ANSWER ----`);
const win = Object.entries(results).find(([,r])=>r.ok);
console.log(win
  ? `  "${win[0]}" clears every bar: no ink flips, worst label ${win[1].worst.toFixed(2)}:1, and the\n  smallest season move is ΔE ${win[1].seen.toFixed(1)}. Build it that way — the season moves the\n  ground and nothing else in the drawing has to know.`
  : `  none of the candidates clears every bar. The season has to be threaded through scnInk,\n  scnSay and scnName after all — about twenty call sites.`);
