/* HOW MANY PLACES DOES A WEEK ACTUALLY TOUCH? — the question under re-tabbing

   Phase D was going to fold six tabs into five places grouped by the weekly loop. Two things say
   test that before building it. First, `reach` charges a FACE one more tap than a tab, so merging
   two tabs into one place with two faces makes everything on them one tap deeper — re-tabbing has a
   measurable cost before it has any benefit. Second, the source already carries a measurement from
   v2.9x: over 289 weeks of the reference player the agenda was never empty and its items spanned
   4.11 distinct tabs on a mean week. If a week's business genuinely lives in four places, five
   places is not fewer journeys, it is the same journeys with a chip row in the way.

   That figure is eighty releases old, so it is re-taken here, and with the thing phase D actually
   turns on: WHICH TABS COME UP TOGETHER. Merging two places is paid for if a player rarely wants
   both in the same week — the second face is then a place they were not going to visit anyway. It
   costs if they usually want both, because then every week buys an extra tap.

   Read off `agenda(d)`, which is the game's own answer to "what wants an answer and where", not a
   list reconstructed here. Sampled before the rope acts each week, so it is the state a player
   would arrive to.

   Usage: node test/probes/places.mjs [houses per prefix] [weeks]
*/
import { serve, open, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 20), W = +(process.argv[3] || 40);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await installRope(p);

const arm = async (gearOn) => p.evaluate(([H,W,gearOn])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const TABS = ["ludus","men","arena","market","villa"];
  const span = {}, pair = {}, solo = {}, hit = {};
  for(const t of TABS){ solo[t]=0; hit[t]=0; for(const u of TABS) pair[`${t}|${u}`]=0; }
  let weeks=0, empty=0, items=0, urgent={}; const lab={};
  for(const t of TABS) urgent[t]=0;
  for(const pre of ["PL-1","PL-2","PL-3"]){
    for(let h=0; h<H; h++){
      const d = A.newGameState("Pl"+h, "clean", `${pre}-${h}`, null);
      for(let w=0; w<W; w++){
        if(d.over) break;
        let list = []; try { list = A.agenda(d) || []; } catch(e){ list = []; }
        weeks++; items += list.length;
        const set = [...new Set(list.map(x=>x.tab).filter(t=>TABS.includes(t)))];
        if(!set.length) empty++;
        span[set.length] = (span[set.length]||0)+1;
        for(const t of set){ hit[t]++;
          for(const u of set) if(t!==u) pair[`${t}|${u}`]++; }
        if(set.length===1) solo[set[0]]++;
        for(const x of list) if(x.urgency>=3 && TABS.includes(x.tab)) urgent[x.tab]++;
        /* A LOW SHARE COULD MEAN TWO THINGS and they call for opposite answers: a tab nobody needs,
           or a tab the agenda has nothing to SAY about. So keep the labels per tab — if the armory
           is at 6.5% because only one line ever raises it, that is a gap in the agenda, not a fact
           about the armory. */
        for(const x of list) if(TABS.includes(x.tab)){
          /* group by `key`, the stable agenda identity #144 added, not by the label — labels are
             templated with a man's name and a price ("Themarsa is not buried properly"), so grouping
             on them counts one recurring item as a hundred different ones. Fall back to the label
             with names and numbers stripped, for any item that carries no key. */
          const k = `${x.tab}|${x.key || (x.label||"?").replace(/[A-Z][a-z]+|\d+/g,"·").slice(0,44)}`;
          lab[k] = (lab[k]||0)+1; }
        R.lanista(d, gearOn ? {} : { gear:false });
      }
    }
  }
  return { TABS, span, pair, solo, hit, weeks, empty, items, urgent, lab, houses:H*3 };
}, [H,W,gearOn]);

/* ---- AND WHETHER 6.5% IS A GAP OR GOOD PLAY ----
   The rope mends a piece the moment it is worn past a third and replaces it when it is bare, so on
   a house it plays the kit never gets bad enough for the agenda to mention. That would make "the
   armory is wanted 6.5% of weeks" a fact about the reference player, not about the game. Run again
   with its gear step off: if the armory's share climbs, the agenda sees gear perfectly well and the
   6.5% is competent play leaving nothing to say. If it stays flat, the agenda cannot see gear at
   all, and a player following it is never told a man is fighting in broken kit. */
const out = await arm(true);
const bare = await arm(false);

const T = out.TABS, W2 = out.weeks;
console.log(`\nHOW MANY PLACES DOES A WEEK ACTUALLY TOUCH?`);
console.log(`  ${out.houses} houses, ${W2} house-weeks, read off the game's own agenda\n`);
const mean = Object.entries(out.span).reduce((s,[k,v])=>s+ +k*v, 0) / W2;
console.log(`  the agenda is empty on ${out.empty} of ${W2} weeks (${(out.empty/W2*100).toFixed(1)}%), `
  + `mean ${(out.items/W2).toFixed(1)} items, spanning ${mean.toFixed(2)} tabs a week`);
console.log(`  weeks by how many tabs they touch:`);
for(const k of Object.keys(out.span).sort())
  console.log(`     ${k} tab${k==="1"?"":"s"}   ${String(out.span[k]).padStart(6)}  ${(out.span[k]/W2*100).toFixed(1)}%`);
console.log(`\n  how often each tab is wanted at all, and how often it is the ONLY one wanted:`);
for(const t of T) console.log(`     ${t.padEnd(8)} wanted ${(out.hit[t]/W2*100).toFixed(1)}% of weeks `
  + `· the only one ${(out.solo[t]/W2*100).toFixed(1)}% · carries something urgent ${(out.urgent[t]/W2).toFixed(2)} items a week`);
console.log(`\n  and how often two are wanted in the SAME week — a merge is paid for by a LOW number here:`);
const rows = [];
for(let i=0;i<T.length;i++) for(let j=i+1;j<T.length;j++)
  rows.push([T[i], T[j], out.pair[`${T[i]}|${T[j]}`]/W2*100]);
rows.sort((a,b)=>a[2]-b[2]);
for(const [a,b,v] of rows) console.log(`     ${`${a} + ${b}`.padEnd(20)} ${v.toFixed(1)}%`);
console.log(`\n  AND WHAT THE AGENDA ACTUALLY SAYS, per tab — the labels behind those shares:`);
for(const t of T){
  const mine = Object.entries(out.lab).filter(([k])=>k.startsWith(t+"|")).sort((a,b)=>b[1]-a[1]);
  console.log(`     ${t} — ${mine.length} distinct line${mine.length===1?"":"s"} ever raised`);
  for(const [k,v] of mine.slice(0,3))
    console.log(`         ${(v/W2*100).toFixed(1).padStart(5)}% of weeks  ${k.split("|").slice(1).join("|")}`);
}
console.log(`\n  AND WITH THE ROPE'S GEAR STEP OFF — does the agenda notice nobody is arming anyone?`);
console.log(`     ${"tab".padEnd(8)} ${"kept up".padStart(9)} ${"neglected".padStart(10)}   change`);
for(const t of T){
  const a = out.hit[t]/out.weeks*100, b = bare.hit[t]/bare.weeks*100;
  console.log(`     ${t.padEnd(8)} ${a.toFixed(1).padStart(8)}% ${b.toFixed(1).padStart(9)}%   ${(b-a>=0?"+":"")}${(b-a).toFixed(1)}`);
}
const ml = Object.entries(bare.lab).filter(([k])=>k.startsWith("armory|")).sort((a,b)=>b[1]-a[1]);
console.log(`     armory raises ${ml.length} distinct lines when nobody is arming anyone:`);
for(const [k,v] of ml.slice(0,4)) console.log(`         ${(v/bare.weeks*100).toFixed(1).padStart(5)}% of weeks  ${k.split("|").slice(1).join("|")}`);
console.log();
await browser.close(); server.close();
