/* THE CROWD IS A NUMBER. IS IT ALREADY A DEMAND?

   #200 proposes that some cards arrive with an appetite — a long one, a quick end — printed on the
   offer, paying if met and souring acclaim if flouted. Its own clause says to check first:

       whether the existing crowd modifiers already vary enough per card that an appetite would be
       a second dial saying the same thing.

   `VENUES` carries a flat `crowd` per venue and that is the ONLY per-card crowd input in the game.
   It is a constant chosen by `venueFor` off tier and festival — not a demand, and nothing about it
   can be met or flouted.

   SO THE QUESTION IS SHARPER THAN THE CLAUSE. Two things must be true for an appetite to be a new
   axis rather than a second name for the venue:

     1. the crowd a bout ENDS on must not be mostly the venue constant — if it is, the venue already
        is the dial and an appetite is a relabelling;
     2. the crowd must already respond to the SHAPE of a bout — how long it ran, whether a man died
        — so that asking for a shape in advance is a demand the engine can pay out on.

   If (2) fails the item is about the fight engine and not the offer. If (1) fails it is about the
   venue table. Measured off every bout the reference player actually takes, not a bench.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 300);
const SEED = process.argv[4] || "APPETITE";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const VEN = Object.fromEntries([...(src.match(/const VENUES = \{([\s\S]*?)\n\};/)||["",""])[1]
  .matchAll(/^  ([a-z]+):\s*\{ name:"([^"]+)", crowd:(-?\d+)/gm)].map(m=>[m[1], +m[3]]));
const KEYS = Object.keys(VEN);
console.log(`VENUES: ${KEYS.map(k=>`${k} ${VEN[k]>=0?"+":""}${VEN[k]}`).join(" · ")}`);
console.log(`the only per-card crowd input the game has spans ${Math.min(...Object.values(VEN))} to ${Math.max(...Object.values(VEN))}\n`);
if(!KEYS.length) throw new Error("VENUES parsed EMPTY — fix the regex first");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W, SEED]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  R.reset();
  for(let h=0; h<H; h++){
    const d = A.newGameState("Crowd","clean",SEED+"-"+h, null);
    for(let w=0; w<W && !d.over; w++) R.lanista(d);
  }
  return { rows: R.stats().boutLog || [], rope: R.say() };
}, [H, W, SEED]);
await browser.close(); server.close();

const rows = out.rows.filter(r=>r.crowd != null);
if(!rows.length){ console.log("NO BOUTS RECORDED — the rope's boutLog is empty"); process.exit(1); }
const mean = a => a.length ? a.reduce((n,x)=>n+x,0)/a.length : 0;
const sd = a => { if(a.length<2) return 0; const m = mean(a); return Math.sqrt(a.reduce((n,x)=>n+(x-m)*(x-m),0)/(a.length-1)); };
const q = (a,f)=>{ if(!a.length) return "-"; const z=[...a].sort((x,y)=>x-y); return z[Math.min(z.length-1,Math.floor(z.length*f))]; };
const all = rows.map(r=>r.crowd);
console.log(`=== ${rows.length} bouts across ${H} houses · crowd at the end: p10 ${q(all,.1)} · median ${q(all,.5)} · p90 ${q(all,.9)} · sd ${sd(all).toFixed(1)}\n`);

console.log(`  (1) BY VENUE — is the ending crowd just the constant back again?`);
const byV = {};
for(const r of rows){ (byV[r.venue||"?"] = byV[r.venue||"?"] || []).push(r.crowd); }
const pts = [];
for(const k of Object.keys(byV).sort((a,b)=>(VEN[a]??0)-(VEN[b]??0))){
  const a = byV[k];
  console.log(`     ${String(k).padEnd(9)} table ${String(VEN[k] ?? "?").padStart(4)}   bouts ${String(a.length).padStart(5)}   ended on  mean ${mean(a).toFixed(1).padStart(5)}  sd ${sd(a).toFixed(1).padStart(5)}  p10 ${String(q(a,.1)).padStart(3)} p90 ${String(q(a,.9)).padStart(3)}`);
  if(VEN[k] != null) for(const v of a) pts.push([VEN[k], v]);
}
/* how much of the spread the constant explains, on the game's own numbers */
const xs = pts.map(p=>p[0]), ys = pts.map(p=>p[1]);
const mx = mean(xs), my = mean(ys);
const cov = mean(pts.map(p=>(p[0]-mx)*(p[1]-my)));
const r2 = (cov / (sd(xs)*sd(ys) || 1)) ** 2;
console.log(`     the venue constant explains ${(r2*100).toFixed(1)}% of the variance in where a bout's crowd ends up.`);

console.log(`\n  (2) BY SHAPE — does the crowd already answer what it was given?`);
const split = (label, f) => {
  const yes = rows.filter(f).map(r=>r.crowd), no = rows.filter(r=>!f(r)).map(r=>r.crowd);
  if(!yes.length || !no.length){ console.log(`     ${label.padEnd(28)} — one side is empty (${yes.length}/${no.length})`); return; }
  console.log(`     ${label.padEnd(28)} ${mean(yes).toFixed(1).padStart(5)} against ${mean(no).toFixed(1).padStart(5)}`
    + `   gap ${(mean(yes)-mean(no)>=0?"+":"")}${(mean(yes)-mean(no)).toFixed(1)}  (${yes.length} / ${no.length} bouts)`);
};
const med = q(rows.map(r=>r.beats),.5);
split(`a long bout (>${med} beats)`, r=>r.beats > med);
split("somebody died", r=>r.killed);
split("your man won", r=>r.win);
split("sine missione", r=>r.stakes === "sine");
console.log(`     beats per bout: p10 ${q(rows.map(r=>r.beats),.1)} · median ${med} · p90 ${q(rows.map(r=>r.beats),.9)}`);

const longGap = mean(rows.filter(r=>r.beats>med).map(r=>r.crowd)) - mean(rows.filter(r=>r.beats<=med).map(r=>r.crowd));
const deadGap = rows.some(r=>r.killed) ? mean(rows.filter(r=>r.killed).map(r=>r.crowd)) - mean(rows.filter(r=>!r.killed).map(r=>r.crowd)) : 0;
console.log(`\n  >>> (1) the venue constant explains ${(r2*100).toFixed(1)}% of it. ${r2 > 0.5
  ? "The venue IS the dial and an appetite would be a second name for it — #200 SHRINKS to the venue table."
  : "The venue is not the dial; where a bout ends up is mostly what happened in it."}`);
console.log(`  >>> (2) length moves the ending crowd by ${longGap.toFixed(1)} and a death by ${deadGap.toFixed(1)}. ${Math.abs(longGap) >= 3 || Math.abs(deadGap) >= 3
  ? "The crowd already answers the SHAPE of a bout, so an appetite has something real to pay out on."
  : "The crowd does NOT answer the shape of a bout — an appetite would have nothing to be met by, and #200 is about the fight engine rather than the offer."}`);
/* ---- AND WHAT EACH CANDIDATE APPETITE WOULD ACTUALLY BE MET BY ----
   A demand nobody can satisfy is a tax, and one everybody satisfies is a gift. These are the four
   the item's own wording suggests, read against the same bouts. */
console.log(`\n  (3) HOW OFTEN EACH CANDIDATE APPETITE WOULD BE MET, over these ${rows.length} bouts:`);
const cand = [
  ["a long one   (beats >= 24)", r=>r.beats >= 24],
  ["a quick end  (beats <= 14)", r=>r.beats <= 14],
  ["blood        (he dies)",     r=>r.killed],
  ["mercy        (he is spared)",r=>r.spared],
];
for(const [lab, f] of cand){
  const hit = rows.filter(f);
  const c = hit.map(r=>r.crowd);
  console.log(`     ${lab.padEnd(30)} met ${String(hit.length).padStart(5)} of ${rows.length}  ${(hit.length/rows.length*100).toFixed(1).padStart(5)}%`
    + `   · those bouts end on ${c.length?mean(c).toFixed(1):"-"} against the ${mean(all).toFixed(1)} overall`);
}
console.log(`\n  rope: ${out.rope}`);
