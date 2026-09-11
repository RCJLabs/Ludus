/* WHAT THE GATEKEEPER ACTUALLY SAYS, AND WHAT HE NEVER GETS ROUND TO — #265's verify-first.

     node test/probes/keeper.mjs 16 420 2      # houses, weeks, seed sets

   #265 was written on two numbers and both were wrong, which is the first thing this reports.
   **There are 35 lessons, not 53** — the item's figure came from `grep -c '^  { id:"'`, which counts
   every two-space table in the file and not `LESSONS`. And the item says the settings toggle
   "replays every one of the fifty-three from the beginning". It cannot. Here is why, and it is the
   real finding:

       const lessonFor = (d, tab) => LESSONS.find(l => {
         if(l.tab!==tab || (d.flags.learned||{})[l.id]) return false;
         try { if(l.done && l.done(d)) return false; } catch(e){}     <-- HERE
         ...

   **`done` is not a completion marker. It is a window-closer.** `loop` carries `done:d=>d.week>=4`,
   so the gatekeeper offers it on weeks 1-3 and never again — read or unread. 33 of the 35 carry a
   `done`; only `form` and `refusal` have none. So a lesson is not "shown once"; it is shown if you
   happen to be standing on the right tab inside its window, and otherwise it is gone. Clearing
   `flags.learned` — which is all "Ask the gatekeeper again" does — cannot reopen a window that has
   closed on the week count.

   SO THE THREE QUESTIONS ARE:
     OFFERED    walking every tab every week, which lessons does `lessonFor` ever return?
     MISSED     which close their window having never been offered on any tab-week?
     RECALLED   clear `flags.learned` at week 40, 120 and 300 — how many come back?

   THE WALK IS THE GENEROUS CASE AND THAT IS DELIBERATE. A real player is on one tab a week, not
   five. This asks `lessonFor(d, tab)` for every tab every week, so OFFERED is the upper bound on
   what any player could have been told — and anything MISSED here is missed for everybody. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SETS = +(process.argv[4] || 2);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, SETS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["LESSONS","lessonFor","lessonsRead","newGameState"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const TABS = [...new Set(A.LESSONS.map(l=>l.tab))];
  const ids = A.LESSONS.map(l=>l.id);
  const st = {}; for(const l of A.LESSONS) st[l.id] = { offered:0, houses:0, firstWeek:[], lastWeek:[], missed:0, tab:l.tab, hasDone:!!l.done, hasWhen:!!l.when, eligWeeks:0, eligHouses:0 };
  /* ---- GATE OR QUEUE, WHICH IS #262'S QUESTION IN A SECOND PLACE ----
     `lessonFor` returns the FIRST match on a tab, so a lesson can be eligible every week of a run
     and never be offered because another one on the same tab is always in front of it. Eligibility
     is the predicate alone — `!done(d) && (when(d) ?? true)` — evaluated per lesson per week with
     no queue in the way. A lesson never OFFERED but often ELIGIBLE is starved; one never eligible
     is dead content, and no amount of re-opening the panel would reach it. */
  const eligOf = (d, l) => {
    try { if(l.done && l.done(d)) return false; } catch(e){ return false; }
    if(!l.when) return true;
    try { return !!l.when(d); } catch(e){ return false; }
  };
  const recall = { 40:[], 120:[], 300:[] };
  let houses = 0, weeks = 0;

  /* ---- AND WHOSE HABITS CLOSE THE GATE, WHICH #260 MADE A QUESTION THAT MUST BE ASKED ----
     `armory` closes on `gearCond` being non-empty, `heir` on `d.heir` being set, `watch` on the
     book reaching four bouts. The reference rope buys gear in week one, names an heir the moment
     one exists and fights every week it can — so a lesson these three close may be dead content or
     may be the ROPE's own policy shutting a door on itself, and those are different findings. The
     second arm is a house that does none of the three: `heir:false, gear:false, bout:false`. It is
     a poor player and a legal one, and it is the control #260 spent nine releases learning to run. */
  const ARMS = [["ref", {}], ["novice", { heir:false, gear:false, bout:false }]];
  const armSt = {};
  for(const [nm] of ARMS){ armSt[nm] = {}; for(const l of A.LESSONS) armSt[nm][l.id] = { elig:0, houses:0 }; }
  for(const [nm, o] of ARMS) for(let i=0;i<H;i++){
    const d = A.newGameState("Kp","clean",`KEEPARM-${i}`);
    const here = {};
    for(let w=0;w<W;w++){
      if(d.over) break;
      for(const l of A.LESSONS) if(eligOf(d, l)){ armSt[nm][l.id].elig++; here[l.id] = 1; }
      try { R.lanista(d, o); } catch(e){ break; }
    }
    for(const id of ids) if(here[id]) armSt[nm][id].houses++;
  }

  for(let s=0;s<SETS;s++) for(let i=0;i<H;i++){
    const d = A.newGameState("Kp","clean",`KEEPER${s}-${i}`);
    houses++;
    const seenHere = {};          /* id -> {first, last} week it was offered in THIS house */
    const eligHere = {};          /* and which were ever ELIGIBLE here, queue or no queue */
    for(let w=0;w<W;w++){
      if(d.over) break;
      /* the generous walk: every tab, every week, before the week runs */
      for(const l of A.LESSONS) if(eligOf(d, l)){ st[l.id].eligWeeks++; eligHere[l.id] = 1; }
      for(const t of TABS){
        let l = null; try { l = A.lessonFor(d, t); } catch(e){}
        if(l){
          st[l.id].offered++;
          if(!seenHere[l.id]) seenHere[l.id] = { first:d.week, last:d.week };
          else seenHere[l.id].last = d.week;
          /* a player standing there would read it — mark it so the next one can surface */
          d.flags.learned = Object.assign({}, d.flags.learned, { [l.id]:1 });
        }
      }
      for(const k of [40,120,300]) if(d.week === k){
        const keep = d.flags.learned;
        d.flags.learned = {};
        let back = 0;
        for(const t of TABS){ let l=null; try{ l=A.lessonFor(d,t); }catch(e){}
          /* count everything that would come back, not just the first per tab */
          const tmp = {};
          while(l && !tmp[l.id]){ back++; tmp[l.id]=1;
            d.flags.learned = Object.assign({}, d.flags.learned, {[l.id]:1});
            try{ l = A.lessonFor(d,t); }catch(e){ l=null; } }
        }
        recall[k].push(back);
        d.flags.learned = keep;
      }
      try { R.lanista(d); } catch(e){ break; }
      weeks++;
    }
    for(const id of ids){
      if(seenHere[id]){ st[id].houses++; st[id].firstWeek.push(seenHere[id].first); st[id].lastWeek.push(seenHere[id].last); }
      else st[id].missed++;
      if(eligHere[id]) st[id].eligHouses++;
    }
  }
  return { st, ids, houses, weeks, recall, tabs:TABS, total:A.LESSONS.length, armSt, armH:H };
}, [H, W, SETS]);

if(out.why){ console.log("HANDLE:", out.why); await browser.close(); server.close(); process.exit(1); }

const pad=(s,n)=>String(s).padEnd(n), rp=(s,n)=>String(s).padStart(n);
const med = a => a.length ? a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)] : null;
console.log(`\nTHE GATEKEEPER — ${out.total} lessons, ${out.houses} houses, ${out.weeks} house-weeks, every tab walked every week\n`);
console.log(`  ${pad("lesson",12)}${pad("tab",8)}${rp("offered",8)}${rp("eligible",9)}${rp("elig wks",9)}${rp("1st wk",8)}   verdict`);
const rows = out.ids.map(id=>({ id, ...out.st[id] })).sort((a,b)=>a.houses-b.houses);
for(const r of rows){
  const f = med(r.firstWeek);
  const v = r.eligHouses===0 ? "DEAD — its gate never opens"
    : r.houses===0 ? `STARVED — eligible in ${r.eligHouses}/${out.houses} houses and never once in front`
    : r.houses < r.eligHouses ? `behind another ${r.tab} lesson in ${r.eligHouses-r.houses}`
    : "";
  console.log(`  ${pad(r.id,12)}${pad(r.tab,8)}${rp(r.houses+"/"+out.houses,8)}${rp(r.eligHouses+"/"+out.houses,9)}`
    + `${rp(r.eligWeeks,9)}${rp(f==null?"—":f,8)}   ${v}`);
}
const dead = rows.filter(r=>r.eligHouses===0);
const starved = rows.filter(r=>r.houses===0 && r.eligHouses>0);
console.log(`\n  DEAD (gate never opens):     ${dead.length ? dead.map(r=>r.id).join(", ") : "none"}`);
console.log(`  STARVED (eligible, never in front): ${starved.length ? starved.map(r=>`${r.id} — eligible ${r.eligWeeks} weeks`).join(", ") : "none"}`);
const never = rows.filter(r=>r.houses===0);
const some  = rows.filter(r=>r.houses>0 && r.houses<out.houses);
console.log(`\n  ${never.length} lesson(s) NEVER offered in any house on any tab: ${never.map(r=>r.id).join(", ")||"none"}`);
console.log(`  ${some.length} offered in some houses but not all: ${some.map(r=>`${r.id} ${r.houses}/${out.houses}`).join(", ")||"none"}`);
console.log(`  ${rows.filter(r=>r.houses===out.houses).length} offered in every house`);

console.log(`\nIS THE GATE SHUT BY THE GAME OR BY THE ROPE?  (${out.armH} houses an arm; novice = heir:false, gear:false, bout:false)`);
console.log(`  ${pad("lesson",12)}${rp("ref houses",12)}${rp("ref weeks",11)}${rp("novice houses",15)}${rp("novice weeks",14)}   verdict`);
for(const id of ["armory","heir","watch","venue"]){
  const r = out.armSt.ref[id], n = out.armSt.novice[id];
  const v = r.houses===0 && n.houses===0 ? "shut for both — the gate itself"
    : r.houses===0 && n.houses>0 ? "THE ROPE'S OWN HABIT shut it, not the game"
    : r.houses>0 && n.houses===0 ? "open only to the reference player"
    : "open to both";
  console.log(`  ${pad(id,12)}${rp(r.houses+"/"+out.armH,12)}${rp(r.elig,11)}${rp(n.houses+"/"+out.armH,15)}${rp(n.elig,14)}   ${v}`);
}

console.log(`\nAND WHAT "ASK THE GATEKEEPER AGAIN" GIVES BACK — clearing flags.learned at a given week:`);
for(const k of [40,120,300]){
  const v = out.recall[k];
  if(!v.length){ console.log(`  week ${k}: no house reached it`); continue; }
  console.log(`  week ${pad(k,4)} ${v.length} houses · lessons that come back: p50 ${med(v)}, min ${Math.min(...v)}, max ${Math.max(...v)} of ${out.total}`);
}
await browser.close(); server.close();
