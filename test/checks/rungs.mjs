/* THE TOP OF A CAREER, REACHABLE FROM A TEST — #252 phase 1.

   (`rungs` was free in both directories; checked before writing.)

   Until v3.227.0 nothing in this project had ever made a master. `canMaster`, `masterNeed` and
   `provedIt` — the gate's READERS — were on the handle; `makeMasterOf`, `startSecond` and
   `squareBout` — the VERBS — were not, and the rope had no button for any of them. So a census of
   the career ladder returned 0% at the top and would have been read as the game having nothing
   there. That is the fourth time this exact shape has been found (#219 rites, #220 court and lot,
   #221 the signature, #246 phase 1 `poachTarget`), and this check exists so it is the last.

   FOUR ARMS, all driven — a distribution floor cannot tell "the game cannot" from "the rope did
   not", and that distinction is the whole of this item.

   1 · THE LADDER CLOSES END TO END. A man built to clear all three of `MASTERY_GATE`'s terms must
       be `canMaster`, `makeMasterOf` must take, and `g.mastery` must be set. Then `canSecond` and
       `startSecond` on the same man. If any link is missing the top of the game is unreachable and
       every census of it is a statement about the test.
   2 · AND EACH TERM BINDS ON ITS OWN. Three men, each missing exactly one of wins, renown and the
       proof: none may be `canMaster`, and `masterNeed` must name the term that is missing. A gate
       that passes a man short of a term is worse than one nobody reaches.
   3 · AND THE PROOF WANTS A PEER THE YARD MAY NOT HAVE. `proveInSquare` requires the beaten man to
       be worth AT LEAST AS MUCH as the winner — and a man at twelve wins and fifty-five renown is
       by construction the most valuable man in his own house. Driven both ways: against a cheaper
       stablemate the proof must NOT take; against a dearer one it must. Measured over two runs of
       96 houses, a candidate had no eligible peer in the yard on **95.5% and 96.9%** of the weeks
       he wanted one — which is what #252 phase 2 has to answer, and it is the gate rather than the
       arithmetic the item guessed at.
   4 · AND THE CENSUS DOES NOT COLLAPSE. Floors only, set well under the measurement (6 wins
       13-15%, 12 wins 4-6% of every man who ever fought), because this arm exists to catch the
       ladder coming loose rather than to pin a constant. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "rungs";
export const describe = "a man can be made a master and given a second style, each gate term binds, and the proof wants a peer";

const W6_FLOOR = 7, W12_FLOOR = 1.5;   /* measured 13-15% and 4.2-6.1%; these catch a collapse */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"RUNGS-1" });
  await clearAll(p, 10);
  await installRope(p);

  const out = await p.evaluate(([W6, W12])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","MASTERY_GATE","SIG_GATE","canMaster","masterNeed","provedIt",
                  "makeMasterOf","canSecond","startSecond","secondFee","squareBout","gladValue","doSpar",
                  "activeG","CLASSES"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const MG = A.MASTERY_GATE;

    /* a house with two men, the first built to order */
    const yard = (opts) => {
      const o = opts || {};
      const d = A.newGameState("Ru", "clean", "RUNGSCHK");
      d.week = 200; d.gold = 20000;
      if(!d.doctore) d.doctore = { name:"Doctore", wage:40, weeks:60 };
      const men = A.activeG(d);
      const g = men[0];
      g.wins = o.wins == null ? MG.wins + 3 : o.wins;
      g.losses = 4; g.pfame = o.pfame == null ? MG.pfame + 20 : o.pfame;
      g.status = "active"; g.injury = null; g.learning = null; g.mastery = null; g.second = null;
      if(o.proved !== false) g.proved = { week:d.week-2, foe:"Somebody", worth:9999 };
      else g.proved = null;
      return { d, g, men };
    };

    const r = {};
    /* 1 · end to end */
    { const { d, g } = yard();
      r.can = !!A.canMaster(d, g);
      r.made = !!A.makeMasterOf(d, g.id);
      r.hasMastery = !!g.mastery;
      r.canSec = !!A.canSecond(d, g);
      const to = Object.keys(A.CLASSES).filter(c=>c !== g.cls)[0];
      r.secStarted = !!A.startSecond(d, g.id, to);
      r.secFee = A.secondFee(d, g); }

    /* 2 · each term binds on its own, and `masterNeed` names it */
    r.terms = {};
    for(const [k, o] of [["wins", {wins:MG.wins-1}], ["renown", {pfame:MG.pfame-1}], ["proof", {proved:false}]]){
      const { d, g } = yard(o);
      let need = []; try { need = A.masterNeed(d, g) || []; } catch(e){ need = ["threw"]; }
      r.terms[k] = { can:!!A.canMaster(d, g), need:need.join(" · ") };
    }

    /* 3 · the proof wants a peer */
    { const cheap = yard(); const c = cheap.men[1];
      if(c){ /* make the stablemate plainly cheaper */
        c.wins = 0; c.losses = 6; c.pfame = 0;
        A.STATS && A.STATS.forEach(s=>{ c[s] = Math.max(5, Math.round((c[s]||30) * 0.4)); }); }
      cheap.g.proved = null;
      r.peer = { mineValue:Math.round(A.gladValue(cheap.g)),
        cheapValue: c ? Math.round(A.gladValue(c)) : null };
      if(c){ A.squareBout(cheap.d, cheap.g.id, c.id);
        r.peer.provedByCheaper = !!A.provedIt(cheap.g); }

      /* ---- AND THE PEER HAS TO BE BEATABLE, WHICH THE FIRST CUT FORGOT ----
         `proveInSquare` wants the beaten man worth at least as much AND wants the candidate to WIN.
         Making the peer enormously better (all stats 95, forty wins, 5,213d against 1,226d) tests
         neither: the candidate simply loses, forty afternoons running, and the arm reported the
         game's one path to the third term as closed when it was the fixture that was wrong. The
         peer is the candidate's own equal plus one win — `gladValue` counts a win at 14d, so he is
         dearer by a hair and the afternoon is even, which is the band the gate actually describes. */
      const rich = yard(); const b = rich.men[1];
      rich.g.proved = null;
      if(b){ (A.STATS||[]).forEach(s=>{ b[s] = rich.g[s]; });
        b.potential = rich.g.potential; b.age = rich.g.age;
        b.losses = rich.g.losses; b.pfame = rich.g.pfame; b.wins = rich.g.wins||0;
        /* raise him a win at a time until the game's own price puts him at or above the candidate,
           rather than picking a number: `gladValue` reads a nick and an age as well as the wins,
           so "his equal plus one win" came out 14d SHORT and the gate correctly refused it */
        /* ---- AND THE MARGIN HAS TO CLEAR WHAT THE WIN ITSELF PAYS ----
           `doSpar` credits the winner `w.pfame += 4` BEFORE it calls `proveInSquare`, and
           `gladName` prices renown at 9d a point — so winning inflates the candidate by about 36d
           before the "was he worth as much as me" test is made. A peer dearer by 7d was dearer
           before the afternoon and cheaper by the time he was measured, and sixty bouts ran without
           one proof. The fixture clears that margin deliberately; the fact that it has to is
           reported to #252 phase 2 rather than papered over here. */
        for(let i=0; i<80 && A.gladValue(b) < A.gladValue(rich.g) + 120; i++) b.wins++; }
      r.peer.dearValue = b ? Math.round(A.gladValue(b)) : null;
      r.peer.dearIsDearer = !!(b && A.gladValue(b) >= A.gladValue(rich.g));
      r.peer.winPaysRenown = 4; r.peer.renownPrice = 9;
      /* he still has to WIN, so try until the square gives him one — a couple of afternoons */
      let got = false, ran = 0, whys = {};
      if(b) for(let i=0; i<60 && !got; i++){
        rich.d.flags = rich.d.flags || {}; rich.d.flags.squareWeek = 0;
        rich.d.pendingSpar = null; rich.d.pendingPrimacy = null; rich.d.over = null; rich.d.week += 1;
        rich.g.fatigue = 0; b.fatigue = 0; rich.g.injury = null; b.injury = null;
        rich.g.benched = false; b.benched = false;
        rich.g.status = "active"; b.status = "active";
        let why = null; try { why = A.squareWhy ? A.squareWhy(rich.d, rich.g, b) : null; } catch(e){ why = "threw"; }
        if(why){ whys[why] = (whys[why]||0)+1; continue; }
        /* ---- AND A SPAR THAT COMES BACK ASKING IS NOT A SPAR THAT HAPPENED ----
           `doSpar` can return `{crux:true, pending}` — the afternoon stops and waits for a word.
           `squareBout` hands that back unresolved, so a caller that ignores it has staged a bout
           that never finished and `proveInSquare` is never reached. Sixty of them ran that way
           before this line existed, and the arm read "the game refuses to prove anybody". The
           harness answers the same handshake at `R.answer`; this is that, inline. */
        let res = null; try { res = A.squareBout(rich.d, rich.g.id, b.id); } catch(e){ whys["threw:"+e.message] = 1; }
        let guard = 0;
        while(res && res.crux && guard++ < 4){
          const pd = res.pending; pd.beats = res.beats;
          try { res = A.doSpar(rich.d, pd.aid, pd.bid, pd, "run"); } catch(e){ break; }
        }
        if(res) ran++; else whys["returned null"] = (whys["returned null"]||0)+1;
        got = !!A.provedIt(rich.g);
      }
      r.peer.provedByDearer = got; r.peer.boutsRan = ran; r.peer.refusals = whys; }

    /* 4 · the census does not collapse */
    { let fought = 0, w6 = 0, w12 = 0;
      for(let h=0; h<10; h++){
        const d = A.newGameState("Rc"+h, "clean", `RUNGSCEN-${h}`);
        for(let w=0; w<300; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
        for(const g of (d.gladiators||[])){
          if(((g.wins||0)+(g.losses||0)) === 0) continue;
          fought++; if((g.wins||0) >= A.SIG_GATE.wins) w6++; if((g.wins||0) >= MG.wins) w12++; }
      }
      r.census = { fought, w6: fought ? Math.round(1000*w6/fought)/10 : 0,
        w12: fought ? Math.round(1000*w12/fought)/10 : 0, W6, W12 }; }
    return r;
  }, [W6_FLOOR, W12_FLOOR]);
  if(out.why) return { pass:false, why:out.why, lines };

  /* 1 */
  lines.push(`end to end: canMaster ${out.can} · made ${out.made} · mastery set ${out.hasMastery} · `
    + `canSecond ${out.canSec} · second started ${out.secStarted} (fee ${out.secFee}d)`);
  for(const [k, v] of [["canMaster", out.can], ["makeMasterOf took", out.made], ["g.mastery set", out.hasMastery],
                       ["canSecond", out.canSec], ["startSecond took", out.secStarted]])
    if(!v) bad.push(`a man built to clear every term of \`MASTERY_GATE\` — ${k} came back false. The top of a `
      + `career is unreachable from a test, which is how it read for four items before this one`);
  /* 2 */
  lines.push(`  each term alone: ${Object.entries(out.terms).map(([k,v])=>`${k} ${v.can?"PASSED":"held"} (${v.need||"nothing wanted"})`).join(" · ")}`);
  for(const [k, v] of Object.entries(out.terms)){
    if(v.can) bad.push(`a man one short on ${k} was still \`canMaster\` — the gate is not reading that term`);
    if(!v.need) bad.push(`\`masterNeed\` names nothing for a man short on ${k}, so the panel cannot tell him what he lacks`);
  }
  /* 3 */
  { const P = out.peer;
    lines.push(`  the proof wants a peer: he is worth ${P.mineValue}d — a cheaper man (${P.cheapValue}d) `
      + `${P.provedByCheaper ? "PROVED him" : "did not"}, a dearer one (${P.dearValue}d) ${P.provedByDearer ? "did" : "DID NOT"}`
      + ` — ${P.boutsRan} bouts ran${Object.keys(P.refusals||{}).length ? `, refused: ${JSON.stringify(P.refusals)}` : ""}`);
    if(P.provedByCheaper)
      bad.push(`beating a stablemate worth ${P.cheapValue}d proved a man worth ${P.mineValue}d — \`proveInSquare\` `
        + `requires the beaten man to be worth at least as much, and without that the gate is only "win once"`);
    if(!P.dearIsDearer)
      bad.push(`the fixture could not build a peer worth as much as the candidate (${P.dearValue}d against `
        + `${P.mineValue}d), so the second half of this arm tested nothing — an arm that cannot pass reads `
        + `exactly like a game that refuses`);
    else if(!P.provedByDearer)
      bad.push(`forty afternoons against a man worth ${P.dearValue}d never proved a man worth ${P.mineValue}d — `
        + `the one path to the third term does not close, and the mastery is unreachable in play`); }
  /* 4 */
  { const C = out.census;
    lines.push(`  census over ${C.fought} men who fought: ${C.w6}% at ${"six"} wins [floor ${C.W6}], ${C.w12}% at twelve [floor ${C.W12}]`);
    if(!C.fought) bad.push(`no man fought in the census arm, so its floors asserted nothing`);
    if(C.w6 < C.W6) bad.push(`only ${C.w6}% of men who fought reach six wins [floor ${C.W6}] — measured 13-15%; the ladder's bottom rung has come loose`);
    if(C.w12 < C.W12) bad.push(`only ${C.w12}% reach twelve wins [floor ${C.W12}] — measured 4.2-6.1%`); }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the ladder closes, every term binds, and the proof wants a man worth as much`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
