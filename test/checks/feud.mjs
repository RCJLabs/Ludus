/* A FEUD ENDS, AND IT ENDS ONCE

   Audit item #225: "A feud stood on 79% of all weeks; 22 declared and 6 ever won across 12 houses,
   and a new one re-declares soon after any resolution. Always-on and rarely-resolving reads as
   climate. Recommend feuds with shapes and true endings — ruin them, absorb them, marry into them
   — and a real quiet between feuds, so a declaration is news and a resolution is a chapter."

   THE HEADLINE IS RIGHT AND THE DIAGNOSIS BLAMES THE WRONG HALF. Measured over 2,822 weeks
   (`probes/feud.mjs`), a feud stood on 77.1% of them — the item's number. But the re-declaration
   was never the fault: `declareNemHouse` holds a 20-week cooldown and the measured quiet between
   feuds was a median of 23 weeks. THE FAULT IS THAT FEUDS DID NOT END.

     18 declared, and how they stopped:
       10  the player's house fell, feud still standing
        5  he sold up
        2  still running at the horizon
        1  you won the grudge match

   Not one ended by losing. `settleNemHouse(d,false)` wrote `n.stage = 2` and left `d.nemHouse`
   standing; a missed grudge match did the same. There was no way to LOSE a feud, only ways not to
   have won it yet — #222's fault, in a second arc, found the same way.

   SO IT NAMED ITS FINAL DAY OVER AND OVER: 179 grudge matches across 18 feuds, a MEDIAN OF SIX
   each and a maximum of 35, every one of them announced as "the one the season has been walking
   toward". Ninety of the 179 went unanswered and none of them ended anything. And the feud outlived
   the anger that started it: `declareNemHouse` wants `h.grudge >= 45`, and on 74.1% of feud-weeks
   the rival's grudge was UNDER 45, median 20, because his grudge decays while the feud's heat only
   climbs.

   AND THE ENDING THE ITEM ASKS FOR WAS ALREADY WRITTEN AND DID NOTHING. Both `resolveMatch` and
   `resolveDaughter` carry a "rival" branch — "a feud older than either of you is folded up and put
   away", "it will hold longer than any truce you could buy" — and both moved `h.grudge`, set
   `h.kin = true`, and never mentioned `d.nemHouse`. `h.kin` was written in three places and read
   in none.

   AFTER: 36.3% of weeks, 60 feuds in the same 2,684, a median life of 17 weeks against 93, and
   ONE grudge match per feud instead of six.

   AND THE BOUT ITSELF HAD TO BE MADE WINNABLE FIRST. `houseChampion` handed back the rival's star
   against your most FAMOUS man; the gap ran a median -26.3 stat points with a BEST CASE of +2.5,
   so no house in the sample was ever favoured in its own climax. That was survivable while a loss
   reset the feud; the moment a loss ends it, it is a scheduled defeat. It is a contest now —
   median -7.0, best +10.8 — and the reference player's record went from 1 win in 23 to 7 in 27.

   FIVE ARMS:
   1 · LOSING IT ENDS IT, and says so.
   2 · SO DOES NOT STANDING ON THE DAY.
   3 · AND SO DOES A WEDDING — the branch whose prose has promised it all along — and a house you
       are kin to is not declared at you again.
   4 · IT NAMES ITS DAY ONCE, over real play, and is not always on.
   5 · AND THE DAY IS A CONTEST, or arms 1 and 2 have only scheduled a defeat. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "feud";
export const describe = "a feud ends, and it ends once";
export const slow = true;   /* plays real houses to their feuds */

const ON_CEIL = 0.62;      /* measured 36.3%; over 62% it is climate again, and it was 77.1% */
const MATCH_CEIL = 2.2;    /* measured 0.9 grudge matches a feud; it was 9.9 */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"FEUD-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","settleNemHouse","declareNemHouse","nemHouseWeek","weddingEndsFeud",
      "resolveMatch","resolveDaughter","domusOf","houseOf","activeG","STATS"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const clone = x => JSON.parse(JSON.stringify(x));
    const head = s => (s.log && s.log[0]) || null;
    const spoke = (s, was) => { const h = head(s);
      return !!h && h !== was && !!String(h.text||"").trim(); };

    /* a real house carried to a real feud */
    const build = t => {
      const d = A.newGameState("Feud", "clean", "FEUD-K"+t, null);
      for(let w=0; w<300 && !d.nemHouse; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
      return (d.nemHouse && !d.over) ? d : null;
    };
    let base = null;
    for(const t of ["A","B","C","D","E","F","G","H"]){ base = build(t); if(base) break; }
    if(!base) return { noFeud:true };
    const hn = base.nemHouse.house;

    /* 1 — losing it ends it */
    const lost = clone(base);
    { lost.nemHouse.stage = 3; const w0 = head(lost);
      try { A.settleNemHouse(lost, false); } catch(e){}
      var lostEnded = !lost.nemHouse, lostSpoke = spoke(lost, w0); }

    /* and winning still ends it, or arm 1 has only broken the good half */
    const won = clone(base);
    { won.nemHouse.stage = 3; const w0 = head(won);
      try { A.settleNemHouse(won, true); } catch(e){}
      var wonEnded = !won.nemHouse, wonSpoke = spoke(won, w0); }

    /* 2 — and not standing on the day ends it. The grudge match is a `challenge` deadline
       flagged `nem`; let its day pass and run the week that reads deadlines. */
    const cut = clone(base);
    let missEnded = null, missSpoke = null;
    { cut.nemHouse.stage = 2; cut.nemHouse.heat = 95;
      let issued = false;
      try { issued = A.issueGrudgeMatch(cut); } catch(e){}
      const dl = (cut.deadlines||[]).find(x=>x.kind==="challenge" && x.nem);
      if(dl){ dl.due = cut.week - 1; const w0 = head(cut);
        for(let i=0;i<2 && cut.nemHouse;i++){ try { R.lanista(cut); } catch(e){ break; } }
        missEnded = !cut.nemHouse; missSpoke = spoke(cut, w0); }
      var missIssued = !!dl && issued; }

    /* 3 — a wedding ends it, from both branches */
    const wife = clone(base);
    /* `resolveMatch` reads `data.cands`; `resolveDaughter` reads `data.opts`. The first cut of
       this arm passed `opts` to both, so the wife's branch took the "you let it lie" early return
       and the arm reported the game leaving the feud standing when it was the fixture that had. */
    try { A.resolveMatch(wife, { data:{ cands:[{ kind:"rival", house:hn, who:"Vettia", family:hn, dowry:0 }] } }, 0); } catch(e){}
    const kid = clone(base);
    { const dm = A.domusOf(kid); const cid = 9001;
      (dm.children = dm.children || []).push({ id:cid, name:"Vettia", sex:"f", born:kid.week-17*52, age:17 });
      try { A.resolveDaughter(kid, { data:{ cid, opts:[{ kind:"rival", house:hn }] } }, 0); } catch(e){} }
    /* and family is not declared at you again */
    const again = clone(base);
    { again.nemHouse = null; again.flags.nemCool = 0;
      (again.rivals||[]).forEach(x=>{ x.kin = true; x.grudge = 90; });
      for(let i=0;i<40 && !again.nemHouse;i++){ try { A.declareNemHouse(again); } catch(e){} } }

    /* 4 and 5 — over real play */
    let weeks = 0, onWeeks = 0, feuds = 0, matches = 0, ended = 0, stopped = 0;
    const gaps = [], gapAt = []; const named = [];
    const av = g => A.STATS.reduce((n,k)=>n+(g[k]||0),0)/6;
    for(let h=0; h<9; h++){
      const d = A.newGameState("Feud", "clean", "FEUD-R"+h, null);
      let cur = null, endedAt = null; const seen = new Set();
      for(let w=0; w<360; w++){
        if(d.over) break;
        try { R.lanista(d); } catch(e){ break; }
        weeks++;
        const n = d.nemHouse;
        if(n) onWeeks++;
        const dl = (d.deadlines||[]).find(x=>x.kind==="challenge" && x.nem);
        if(dl && !seen.has(dl.id)){ seen.add(dl.id); matches++;
          const mine = A.activeG(d).find(g=>g.id===dl.gid);
          const rh = A.houseOf(d, dl.house);
          const foe = rh && (rh.fighters||[]).find(f=>f.id===dl.fid);
          if(mine && foe) named.push(+(av(mine)-av(foe)).toFixed(1)); }
        if(n && (!cur || cur.since !== n.since)){
          if(endedAt != null) gaps.push(d.week - endedAt);
          cur = { since:n.since }; feuds++; }
        if(!n && cur){ ended++; endedAt = d.week; cur = null; }
      }
      if(cur) stopped++;
    }

    const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
      return { n:s.length, min:s[0], p50:s[Math.floor(s.length/2)], max:s[s.length-1] }; };
    return { hn, lostEnded, lostSpoke, wonEnded, wonSpoke, missIssued, missEnded, missSpoke,
      wifeEnded: !(wife.nemHouse && wife.nemHouse.house===hn),
      kidEnded: !(kid.nemHouse && kid.nemHouse.house===hn),
      kinDeclared: !!again.nemHouse,
      weeks, onWeeks, feuds, matches, ended, stopped, gap:q(gaps), named:q(named),
      perFeud: feuds ? +(matches/feuds).toFixed(2) : null,
      onPc: weeks ? +(onWeeks/weeks*100).toFixed(1) : 0 };
  });

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  if(r.noFeud) return { pass:false, why:`no house declared a feud in 300 weeks — nothing was measured`, lines };

  lines.push(`House ${r.hn} declared on a played house · losing it ends it ${r.lostEnded} (and says so ${r.lostSpoke})`
    + ` · winning still does ${r.wonEnded}`);
  lines.push(`  the day came and nobody stood: ended ${r.missEnded} · a line was written ${r.missSpoke}`);
  lines.push(`  a wedding folds it up — the wife's match ${r.wifeEnded} · the daughter's ${r.kidEnded}`
    + ` · and family is declared at again: ${r.kinDeclared}`);
  lines.push(`  over ${r.weeks} played weeks: a feud stood on ${r.onPc}% · ${r.feuds} declared, ${r.ended} ended`
    + ` · ${r.matches} grudge matches, ${r.perFeud} a feud`);
  lines.push(`  the quiet between them ${JSON.stringify(r.gap)} · the day's matchup ${JSON.stringify(r.named)}`);

  /* 1 — losing ends it */
  if(!r.lostEnded)
    bad.push(`losing the grudge match leaves the feud standing — it went back to stage 2 to demand the `
      + `same day again, which is why 18 feuds named 179 of them and only the player's house dying ever stopped one`);
  else if(!r.lostSpoke) bad.push(`the feud ended on a loss and the chronicle said nothing about it`);
  if(!r.wonEnded) bad.push(`winning the grudge match no longer ends the feud — arm 1 has broken the half that worked`);
  else if(!r.wonSpoke) bad.push(`the feud ended on a win and the chronicle said nothing about it`);
  /* 2 — and not standing */
  if(!r.missIssued)
    bad.push(`no grudge match could be issued on the fixture, so the arm that checks what happens when `
      + `nobody stands on the day measured nothing`);
  else if(!r.missEnded)
    bad.push(`the day came, nobody stood, and the feud is still on — he named it in front of Capua and `
      + `your house did not come, and there is nothing left for him to prove`);
  else if(!r.missSpoke) bad.push(`the day passed unanswered and the chronicle said nothing about it`);
  /* 3 — and a wedding */
  if(!r.wifeEnded)
    bad.push(`marrying a rival's daughter says "a feud older than either of you is folded up and put away" `
      + `and leaves \`d.nemHouse\` standing — the branch has promised this since it was written`);
  if(!r.kidEnded)
    bad.push(`marrying your daughter into the rival house says "it will hold longer than any truce you could `
      + `buy" and holds nothing — the feud is still on`);
  if(r.kinDeclared)
    bad.push(`a house you are kin to was declared your nemesis — \`h.kin\` is set by both wedding branches `
      + `and was read by nothing at all`);
  /* 4 — it names its day once, and is not always on */
  if(!r.feuds) bad.push(`no feud was declared over ${r.weeks} played weeks — arms 4 and 5 measured nothing`);
  else {
    if(r.onPc > ON_CEIL*100)
      bad.push(`a feud stood on ${r.onPc}% of ${r.weeks} weeks — it was 77.1% before v3.168.0 and `
        + `always-on is climate, not story`);
    if(r.perFeud > MATCH_CEIL)
      bad.push(`${r.matches} grudge matches across ${r.feuds} feuds — ${r.perFeud} each. Each one is announced `
        + `as "the one the season has been walking toward", and it was 9.9 a feud before v3.168.0`);
    if(!r.ended)
      bad.push(`not one of ${r.feuds} feuds ended inside ${r.weeks} weeks — which is #225 exactly`);
  }
  /* 5 — and the day is a contest */
  if(!r.named)
    bad.push(`no grudge match named a pair this run, so the arm that checks the matchup measured nothing`);
  /* ---- WHY THE BEST CASE IS ONLY ASSERTED ON A REAL SAMPLE ----
     "the house is sometimes favoured" is a claim about the distribution, and the first cut asserted
     it on whatever seven bouts this fixture happened to name — where the best draw was -1.3 against
     a measured best of +10.8 over 45. A bar that a correct build fails one run in three is noise
     wearing an assertion's clothes. The median carries the arm; the best case joins it once there
     are enough days named to mean anything. */
  else if(r.named.n >= 12 && r.named.max <= 0)
    bad.push(`your man was the weaker in all ${r.named.n} grudge matches (best ${r.named.max} stat points, `
      + `median ${r.named.p50}) — the bout the whole season walks toward is a scheduled defeat, and making `
      + `a loss final without making the day winnable is worse than leaving it a meter`);
  else if(r.named.p50 < -18)
    bad.push(`the grudge match is named on a median gap of ${r.named.p50} stat points — it was -26.3 before `
      + `v3.168.0, when \`houseChampion\` handed back the rival's star whoever it was matched against`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`it ends four ways, it names its day once, and the day is a fight`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
