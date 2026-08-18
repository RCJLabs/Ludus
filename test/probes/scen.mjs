/* THE FIVE FOUNDINGS, COMPARED ON ANYTHING AT ALL — the last seam from the v3.27.0 session

   Every long-run figure in this project is measured on `clean`. The other four openings have been
   driven only by `lessons`' opening scan, and never compared on an outcome. Whether they produce
   meaningfully different HOUSES is unmeasured — and two of them are the only states in the game that
   open certain doors on week one (`inherited` the staff room, `champion` the signature).

   INSTRUMENT NOTES, all three off this project's record:
   · the scenario keys come off the handle (`SC_KEYS`) — `newGameState` silently forgives a key it
     does not know and hands back `clean`, which cost `lessons` two releases of five-identical-arms.
     And every scenario row prints its own week-one men and coin, so five identical rows cannot be
     read past (the defence test/README.md names for exactly this fault).
   · lifespans here are era-spiked, not bell-curved (10…401 with a wall of early deaths), so the
     whole spread is printed and the median is not the claim. Between-batch spread dwarfed
     between-policy spread at n=20 once before; run this on several seeds before quoting ANY
     difference, and quote the sign only if it holds on all of them.
   · houses are compared at fixed horizons (alive at 90/180/300) and on best-of-run fame the way
     `policy` bars are, because a median over the dead answers a different question. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "SCEN";
/* ---- #139'S CLAUSE, WIDENED ----
   The finding "the opening tagged Fragile is the safest in the game" was measured on ONE policy —
   the reference player — and its clause asked whether the champion's edge belongs to the SCENARIO or
   to the rope's habit of fighting its best man every week. `bench` was named for that, but benching
   a one-man house means it cannot fight at all, which is a different scenario rather than a control.
   Running the same comparison under several POLICIES is the honest version: if champion is safest
   under all of them the safety is the opening's, and if it flips it was the rope's. */
const MODE = process.argv[5] || "default";
const MODES = {
  default: undefined,
  reckless: { stakes:"sine" },      /* every bout a death match — the legend is actually risked */
  neglect:  { cells:false },        /* never feasts, never walks the cells */
  bare:     { gear:false },         /* fights in house issue, which is how every figure before v3.17.0 was taken */
};
const OPTS = MODES[MODE];

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED,OPTS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const rows = [];
  for(const sc of A.SC_KEYS){
    const r = { sc, lives:[], fameBest:0, fameAtDeath:[], goldPeak:[], rungBest:0,
      alive90:0, alive180:0, alive300:0, men0:null, gold0:null, ends:{} };
    for(let h=0; h<H; h++){
      const d = A.newGameState("Sc"+h, sc, `${SEED}-${sc}-${h}`, null);
      if(r.men0==null){ r.men0 = A.activeG(d).length; r.gold0 = d.gold; }
      /* the blurb's own claim, tested: "Everything the house has is standing in one cell, and it
         can die on any given afternoon." So: when does the STARTING man die, and does the house die
         with him? A scenario whose legend dies and whose house carries on is not fragile. */
      const first = A.activeG(d)[0], firstId = first ? first.id : null;
      let legendGone = null;
      /* ---- #148: EACH TAG IS A CLAIM, AND FOUR OF THE FIVE ARE TESTABLE ----
         The item asks whether the 35-point survival spread is carried by what the player is told,
         and what he is told is one word each. Three of those words are not difficulty ratings at
         all, they are claims about a SHAPE, and each can be measured directly:
           "A closing window"  the starting four are a wasting asset — so when are they gone, and
                               does the house turn at that point?
           "Fragile"           everything is standing in one cell — so how long is that true?
           "Volatile"          the outcome is unusually uncertain — so is its spread the widest?
         `startIds` is every week-one man rather than only the first, because the founding-man row
         below answers the champion's claim and nothing answered the veterans'. */
      const startIds = A.activeG(d).map(g=>g.id);
      const startGone = new Array(startIds.length).fill(null);
      let allGoneWk = null, secondManWk = null;
      let fameBest = 0, goldPeak = d.gold, rung = 0;
      for(let w=0; w<W; w++){
        if(d.over) break;
        R.lanista(d, OPTS || undefined);
        if(legendGone == null && firstId != null){
          const g = (d.gladiators||[]).find(x=>x.id===firstId);
          if(!g || A.isGone(g)) legendGone = d.week;
        }
        startIds.forEach((id,i)=>{
          if(startGone[i] != null) return;
          const g = (d.gladiators||[]).find(x=>x.id===id);
          if(!g || A.isGone(g)) startGone[i] = d.week;
        });
        if(allGoneWk == null && startGone.every(x=>x != null)) allGoneWk = d.week;
        if(secondManWk == null && A.activeG(d).length >= 2) secondManWk = d.week;
        fameBest = Math.max(fameBest, d.fame||0);
        goldPeak = Math.max(goldPeak, d.gold||0);
        rung = Math.max(rung, A.riseOf(d)||0);
      }
      r.lives.push(d.week);
      /* THE LAST MAN GONE IS AN ORDER STATISTIC AND THE ROSTERS ARE DIFFERENT SIZES — six men
         take longer to lose than one for no reason but arithmetic. `typical` is the MEDIAN founding
         man's leaving week, which does not depend on how many there were, and it is the number the
         "closing window" claim should be read off. Both are printed. */
      const gw = startGone.map(x=>x==null ? d.week : x).sort((a,b)=>a-b);
      (r.founding = r.founding || []).push({ allGone:allGoneWk, lived:d.week,
        after: allGoneWk == null ? null : d.week - allGoneWk, second:secondManWk,
        typical: gw[Math.floor(gw.length/2)],
        n:startIds.length, wentAlone: secondManWk == null ? d.week : secondManWk - 1 });
      (r.legend = r.legend || []).push({ gone: legendGone, lived: d.week,
        after: legendGone == null ? null : d.week - legendGone });
      if(d.week>=90) r.alive90++; if(d.week>=180) r.alive180++; if(d.week>=300) r.alive300++;
      r.fameBest = Math.max(r.fameBest, Math.round(fameBest));
      r.fameAtDeath.push(Math.round(d.fame||0));
      r.goldPeak.push(Math.round(goldPeak));
      r.rungBest = Math.max(r.rungBest, rung);
      const k = d.over ? d.over.kind : "alive";
      r.ends[k] = (r.ends[k]||0)+1;
    }
    rows.push(r);
  }
  return rows;
}, [H, W, SEED, OPTS || null]);

const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };
console.log(`\n${H} houses x ${W}w per scenario · seed "${SEED}" · policy: ${MODE}\n`);
console.log(`  scenario    wk1 men/coin   med life   alive @90/@180/@300   best fame   med fame@end   med peak gold   best rung`);
for(const r of out){
  console.log(`  ${r.sc.padEnd(10)} ${String(r.men0).padStart(5)} / ${String(r.gold0).padEnd(6)} ${String(med(r.lives)).padStart(7)}   ${String(r.alive90).padStart(6)} /${String(r.alive180).padStart(4)} /${String(r.alive300).padStart(4)}   ${String(r.fameBest).padStart(9)}   ${String(med(r.fameAtDeath)).padStart(12)}   ${String(med(r.goldPeak)).padStart(13)}   ${String(r.rungBest).padStart(9)}`);
}
console.log(`\n  lifespans, whole spread — the median above is NOT the claim:`);
for(const r of out)
  console.log(`  ${r.sc.padEnd(10)} ${r.lives.sort((a,b)=>a-b).join(" ")}`);
console.log(`\n  THE FOUNDING MAN — "it can die on any given afternoon", tested:`);
console.log(`  scenario    his death wk (median)   houses that OUTLIVED him   weeks they went on`);
for(const r of out){
  const L = r.legend || [], died = L.filter(x=>x.gone != null);
  const outlived = died.filter(x=>x.after > 0);
  const medAfter = outlived.length ? med(outlived.map(x=>x.after)) : "-";
  console.log(`  ${r.sc.padEnd(10)} ${String(died.length ? med(died.map(x=>x.gone)) : "-").padStart(12)} (${died.length}/${L.length} died)`
    + `   ${String(outlived.length).padStart(10)} of ${died.length}`
    + `   ${String(medAfter).padStart(10)}w median`);
}

/* ---- #148: THE TAGS, TESTED ONE AT A TIME ----
   Printed, never asserted. The point is that "A closing window" and "Fragile" are claims about a
   trajectory rather than moods, so they can be true or false, and a count of survivors cannot tell
   you which. The spread is quoted as quartiles because a median hides the thing "Volatile" means. */
const q = (a,f) => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y);
  return v.length ? v[Math.min(v.length-1, Math.floor(v.length*f))] : "-"; };
console.log(`\n  THE FOUNDING ROSTER — "whatever you build, build it fast", tested:`);
console.log(`  scenario   wk1 men   TYPICAL man gone   last of them gone   houses that outlived them   weeks after`);
for(const r of out){
  const F = r.founding || [], done = F.filter(x=>x.allGone != null);
  const on = done.filter(x=>x.after > 0);
  console.log(`  ${r.sc.padEnd(10)} ${String(F[0]?F[0].n:"-").padStart(7)} ${String(q(F.map(x=>x.typical),0.5)).padStart(18)} ${String(done.length?q(done.map(x=>x.allGone),0.5):"-").padStart(19)}`
    + `   ${String(on.length).padStart(12)} of ${done.length}   ${String(on.length?q(on.map(x=>x.after),0.5):"-").padStart(9)}w median`);
}
console.log(`\n  "EVERYTHING THE HOUSE HAS IS STANDING IN ONE CELL" — how long that is true:`);
for(const r of out){
  const F = r.founding || [];
  console.log(`  ${r.sc.padEnd(10)} a second man in the yard by week ${String(q(F.map(x=>x.second),0.5)).padStart(4)} (median)`
    + ` · never got one in ${F.filter(x=>x.second==null).length} of ${F.length}`);
}
console.log(`\n  "VOLATILE" — the spread of lives, by quartile (a median cannot show this):`);
console.log(`  scenario    q1     med     q3     q3-q1   shortest   longest`);
for(const r of out){
  const L = r.lives;
  console.log(`  ${r.sc.padEnd(10)} ${String(q(L,0.25)).padStart(4)}  ${String(q(L,0.5)).padStart(5)}  ${String(q(L,0.75)).padStart(5)}  ${String(q(L,0.75)-q(L,0.25)).padStart(7)}   ${String(Math.min(...L)).padStart(8)}   ${String(Math.max(...L)).padStart(7)}`);
}

console.log(`\n  endings:`);
for(const r of out)
  console.log(`  ${r.sc.padEnd(10)} ${Object.entries(r.ends).map(([k,v])=>`${k} ${v}`).join(" · ")}`);

await browser.close(); server.close();
