/* #208's decomposition — WHERE DO THE MEN ACTUALLY DIE? — and the answer that closed the item.

   The survey read the median career at one bout and zero wins. That figure was this project's own
   instrument artifact (see the note in survey.mjs): 470 fallen SUMMARIES, none carrying a wins
   field, each counted as a zero-bout career. Measured on the true fields, twice (16 and 32 houses
   x 420 weeks):

     · the dead man's median career is 4-5 bouts, p90 14-16 — not one
     · 88-90% of debut men survive their first bout; the second bout already IS the norm
     · the per-bout death hazard is FLAT, 10-15%, from bout 1 to bout 11 — experience buys no
       safety, which is matched risk, not a death-trap debut
     · the First Lessons' claim that famed men are far more likely to be spared is TRUE: hazard
       12.3% under fame 25, 8.5% at 25-99, 7.5% at 100-299 — a third off — and it saturates there
       (300+: 8.5% on 212 bouts; the 16-house arm's apparent reversal was noise)
     · ~9% of deaths are off the sand, mostly the infirmary the week after a wound

     node test/probes/debut.mjs 16 420

   Method: weekly snapshots per man. A death in a week where his bout count moved is a SAND death,
   at that bout number; a death in a week it did not is an OFF-SAND death. Dead-at-N is divided by
   men-who-reached-N for a per-bout hazard, so "most deaths are at bout one" cannot be an artifact
   of most careers being short.

   THE FIRST TWO RUNS OF THIS COUNTED ZERO DEATHS ACROSS 8,000 WEEKS — in a game whose survey
   buried 470 men — and the reason indicts the SURVEY too. A dead man does not leave
   `d.gladiators` and he does not carry `g.dead`: he stays in place with `status:"dead"`, and a
   SUMMARY — `{name, week}`, no wins, no losses — is pushed to `d.fallen`. This probe's first cut
   read `g.dead` (always undefined). And the survey's headline — "the median career is one bout,
   zero wins" — pushed a bouts figure for every fallen summary too, each reading `(g.wins||0)` off
   an object that has no wins field: 470 phantom zero-bout careers dragging the median down. The
   men below are `d.gladiators` only, each once, on `status`. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);
const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const men = new Map();   /* id -> { bouts, dead, sand, diedAtBout } */
  const sum = { houses:H, weeks:0, sandDeaths:0, offSand:0, aliveEnd:0,
    deadAt:{}, reached:{}, aliveBouts:[], offSandBouts:[], deadBouts:[], fameFought:{}, fameDied:{} };
  for(let h=0; h<H; h++){
    const d = A.newGameState("SURVEY-"+h);
    const seen = new Map();
    for(let w=0; w<W; w++){
      if(d.over) break;
      let before = new Map();
      for(const g of d.gladiators) if(g.status !== "dead")
        before.set(g.id, { bouts:(g.wins||0)+(g.losses||0), fame:g.pfame||0 });
      try { R.lanista(d); } catch(e){ break; }
      sum.weeks++;
      for(const g of d.gladiators){
        const b = before.get(g.id); if(!b) continue;
        const nb = (g.wins||0)+(g.losses||0);
        if(nb > b.bouts && g.status !== "dead"){ const fb = b.fame<25?"0-24":b.fame<100?"25-99":b.fame<300?"100-299":"300+";
          sum.fameFought[fb] = (sum.fameFought[fb]||0) + (nb - b.bouts); }
        if(g.status !== "dead") continue;
        const bouts = (g.wins||0)+(g.losses||0);
        const fought = bouts > b.bouts;
        if(fought){ sum.sandDeaths++; sum.deadAt[Math.min(bouts,12)] = (sum.deadAt[Math.min(bouts,12)]||0)+1; }
        if(fought){ const fb = b.fame<25?"0-24":b.fame<100?"25-99":b.fame<300?"100-299":"300+";
          sum.fameDied[fb] = (sum.fameDied[fb]||0)+1; }
        else { sum.offSand++; sum.offSandBouts.push(bouts);
          sum.offSandWhy = sum.offSandWhy || {}; const why = g.fateNote || g.cause || "unmarked";
          sum.offSandWhy[why] = (sum.offSandWhy[why]||0)+1; }
      }
    }
    for(const g of d.gladiators){
      const bouts = (g.wins||0)+(g.losses||0);
      if(g.status !== "dead"){ sum.aliveEnd++; sum.aliveBouts.push(bouts); }
      else sum.deadBouts.push(bouts);
      for(let n=1; n<=bouts; n++) sum.reached[n] = (sum.reached[n]||0)+1;
    }
  }
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    return { p50:s[Math.floor(.5*s.length)], p90:s[Math.floor(.9*s.length)], mean:Math.round(a.reduce((n,x)=>n+x,0)/a.length*10)/10 }; };
  sum.aliveBouts = q(sum.aliveBouts); sum.offSandBouts = q(sum.offSandBouts); sum.deadBouts = q(sum.deadBouts);
  /* hazard per bout number: died at their Nth bout / men who fought an Nth bout */
  sum.hazard = {};
  for(const n of Object.keys(sum.deadAt)) if(sum.reached[n]) sum.hazard[n] = +(sum.deadAt[n]/sum.reached[n]*100).toFixed(1);
  delete sum.hazard["12"];   /* deadAt bins 12+ together while reached does not — the ratio is meaningless */
  sum.fameHazard = {};
  for(const k of Object.keys(sum.fameFought)){
    const died = sum.fameDied[k]||0, fought = (sum.fameFought[k]||0) + died;
    if(fought >= 30) sum.fameHazard[k] = { fought, died, pc: +(died/fought*100).toFixed(1) };
  }
  return sum;
}, [H,W]);
console.log(JSON.stringify(out));
await browser.close(); server.close();
