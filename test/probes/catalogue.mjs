/* THE ACQUIRABLE CATALOGUE, COUNTED — the question ROADMAP said decides #131's direction

   `keep.mjs` measured that estate gains collapse ~88% between the early and late eras, and the open
   question on it was stated as a number nobody had taken: how many acquirable keys exist, when the
   median house holds them all, and what a late house has left on its list. That number decides whether
   #131's answer is "add late acquisitions" or "make the permanent tier losable".

   THE CATALOGUE is read off the game's own tables, not written out by hand (a hand-written list is the
   `lessons` scenario-key fault): room LEVELS (a level is a purchase, so 5 rooms x 4 levels), the works
   and monuments off ALL_WORK_KEYS, the feats off FEAT_KEYS, the three staff seats, the household roles
   off HH_KEYS, the doctrine, the collegium, the aedile, the heir, the wife, four patron slots, and the
   eight census rungs above the founding one. EXCLUDED on purpose: blessings and vows (they expire — an
   EPISODE by keep.mjs's own split), men (replaceable by purchase, counted apart everywhere else), and
   the earned word-scales (acclaim, fame tiers), which are not acquisitions.

   TWO THINGS THIS MUST NOT DO, both from this project's record:
   · read "exhausted" off a house that simply died — the last-new-acquisition week is censored by the
     death week, so the drought AFTER the last acquisition is reported next to the weeks lived, and the
     headline is quoted only off houses that lived past 300.
   · read "nothing left to buy" off a reference player who has no step for the thing — the rope's
     `build` step raises the five rooms and NEVER calls `beginWork` (grep: its only callers are the two
     villa buttons and the agenda line), so the works and monuments will read unheld in every house.
     That is a fact about the instrument as much as the game and the report says which is which: every
     remaining key is printed with whether the house could ever have PAID for it (peak gold over the
     whole life against the table price). */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 72), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "CAT";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;

  /* the catalogue, off the tables */
  const items = [];  /* { key, cost } — cost null where the game charges no single listed price */
  for(const k of Object.keys(A.BUILDINGS))
    A.BUILDINGS[k].cost.forEach((c,i)=>items.push({ key:`room:${k}@${i+1}`, cost:c }));
  for(const k of A.ALL_WORK_KEYS) items.push({ key:`work:${k}`, cost:(A.WORKS[k]||A.MONUMENTS[k]).cost });
  for(const k of A.FEAT_KEYS) items.push({ key:`feat:${k}`, cost:null });
  for(const k of ["doctore","medicus","armourer"]) items.push({ key:`staff:${k}`, cost:null });
  for(const k of A.HH_KEYS) items.push({ key:`hh:${k}`, cost:null });
  for(const k of ["doctrine","collegium","aedile","heir","wife"]) items.push({ key:k, cost:null });
  for(let n=1;n<=4;n++) items.push({ key:`patron@${n}`, cost:null });
  A.RISE_RANKS.forEach((r,i)=>{ if(i>0) items.push({ key:`census@${i}`, cost:r.cost||null }); });
  const KEYS = items.map(x=>x.key);
  const COST = Object.fromEntries(items.map(x=>[x.key, x.cost]));

  const heldNow = d => {
    const s = new Set();
    for(const k of Object.keys(A.BUILDINGS)){ const L = A.bLevel(d,k); for(let i=1;i<=L;i++) s.add(`room:${k}@${i}`); }
    for(const k of A.ALL_WORK_KEYS) if(A.workDone(d,k)) s.add(`work:${k}`);
    for(const k of Object.keys(d.feats||{})) s.add(`feat:${k}`);
    if(d.doctore) s.add("staff:doctore"); if(d.medicus) s.add("staff:medicus"); if(d.armourer) s.add("staff:armourer");
    for(const k of Object.keys(d.household||{})) s.add(`hh:${k}`);
    if(d.doctrine) s.add("doctrine"); if(d.collegium) s.add("collegium");
    if(d.aedile) s.add("aedile"); if(d.heir) s.add("heir"); if((d.domus||{}).wife) s.add("wife");
    const np = (A.patronsOf(d)||[]).length; for(let n=1;n<=Math.min(np,4);n++) s.add(`patron@${n}`);
    const rg = A.riseOf(d)||0; for(let i=1;i<=rg;i++) s.add(`census@${i}`);
    return s;
  };

  const houses = [];
  const neverHeldLate = {};             /* key -> count over houses that reached late */
  const firstWeeks = {};                /* key -> [weeks first held] */
  for(let h=0; h<H; h++){
    const d = A.newGameState("Ct"+h, "clean", `${SEED}-${h}`, null);
    const ever = new Map();             /* key -> week first held */
    let lastNew = 0, peakGold = d.gold;
    const newByEra = { early:0, mid:0, late:0 };
    for(let w=0; w<W; w++){
      if(d.over) break;
      R.lanista(d);
      if(d.over) break;
      if(d.gold > peakGold) peakGold = d.gold;
      const s = heldNow(d);
      for(const k of s) if(!ever.has(k)){
        ever.set(k, d.week); lastNew = d.week;
        newByEra[d.week < 90 ? "early" : d.week < 180 ? "mid" : "late"]++;
      }
    }
    const lived = d.week;
    const remaining = KEYS.filter(k=>!ever.has(k));
    const late = lived >= 180;
    if(late) for(const k of remaining) neverHeldLate[k] = (neverHeldLate[k]||0)+1;
    for(const [k,w] of ever) (firstWeeks[k] = firstWeeks[k] || []).push(w);
    houses.push({ h, lived, lastNew, drought: lived - lastNew, held: ever.size,
      remaining: remaining.length, peakGold: Math.round(peakGold), late, newByEra });
  }
  return { KEYS, COST, houses, neverHeldLate, nCat: KEYS.length,
    lateN: houses.filter(x=>x.late).length };
}, [H, W, SEED]);

const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };

console.log(`\n${H} houses x ${W}w · seed "${SEED}" · catalogue = ${out.nCat} acquirable keys`);
console.log(`(20 room levels · 9 works+monuments · feats · 3 staff · household · doctrine/collegium/aedile/heir/wife · 4 patron slots · 8 census rungs)\n`);

console.log(`  RAW, one row per house that reached the late era (>=180w) — the headline is read off these only:`);
console.log(`    house  lived  lastNew  drought  held/cat  remaining  peakGold`);
const late = out.houses.filter(x=>x.late);
for(const x of late)
  console.log(`    ${String(x.h).padStart(4)}  ${String(x.lived).padStart(5)}  ${String(x.lastNew).padStart(7)}  ${String(x.drought).padStart(7)}  ${String(x.held).padStart(4)}/${out.nCat}  ${String(x.remaining).padStart(9)}  ${String(x.peakGold).padStart(8)}`);
console.log(`\n  ${late.length} of ${out.houses.length} houses reached late · all houses' lifespans: ${out.houses.map(x=>x.lived).sort((a,b)=>a-b).join(" ")}`);

const l300 = out.houses.filter(x=>x.lived>=300);
console.log(`\n  houses alive past 300w: ${l300.length}`);
if(l300.length){
  console.log(`    last NEW catalogue item at median week ${med(l300.map(x=>x.lastNew))} (${l300.map(x=>x.lastNew).sort((a,b)=>a-b).join(" ")})`);
  console.log(`    final drought (weeks lived after the last new item): median ${med(l300.map(x=>x.drought))} (${l300.map(x=>x.drought).sort((a,b)=>a-b).join(" ")})`);
  console.log(`    held at death: median ${med(l300.map(x=>x.held))} of ${out.nCat} · remaining median ${med(l300.map(x=>x.remaining))}`);
}
const eras = ["early","mid","late"];
console.log(`\n  NEW catalogue items first held, by era, summed over all houses:`);
for(const e of eras)
  console.log(`    ${e.padEnd(6)} ${out.houses.reduce((s,x)=>s+x.newByEra[e],0)}`);

console.log(`\n  WHAT A LATE HOUSE NEVER HELD — key · how many of the ${out.lateN} late houses never held it · listed price`);
const rows = Object.entries(out.neverHeldLate).sort((a,b)=>b[1]-a[1]);
for(const [k,n] of rows)
  console.log(`    ${k.padEnd(24)} ${String(n).padStart(3)} of ${out.lateN}   ${out.COST[k] != null ? String(out.COST[k]).padStart(7)+"d" : "       -"}`);
console.log(`\n  peak gold over a late house's whole life: median ${med(late.map(x=>x.peakGold))} · max ${Math.max(...late.map(x=>x.peakGold))}`);

await browser.close(); server.close();
