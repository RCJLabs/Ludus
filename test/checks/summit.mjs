/* Rome is the only real ending this game has, and nothing had ever driven it.

   `romeReady`, `offerRome` and the trip's own mechanics were all off the handle,
   so no check could reach the summit and no probe could complete a round trip. The
   v2.52.0 audit found two things behind that silence. The gate asked that a house
   had held the primacy and would take nothing else, so the three houses of eight
   that held the title were the three offered Rome and a house at fame 4,301 with
   ten feats never saw a letter. And the trip had no clock at all: a house that
   accepted and then declined the card it was given — half of imperial bouts are
   sine missione against men built at 92 to 99 — sat at Rome for ever, Capua frozen
   behind it, with no way home. An audit probe accepted three invitations and never
   once returned, which is how it was found.

   So this check walks the whole road. Both gates open it. The letter expires. The
   trip pays out when it is fought and lapses when it is not, and either way the
   house comes home — because the one thing that must never be true again is that
   a run can enter a state it cannot leave.

   v2.59.0 moved the census gate down a rung, because the fifth one had not admitted
   anybody: measured across twenty-four houses run four hundred weeks, every house that
   reached Known in Rome had already taken the primacy years earlier, so the second road
   led nowhere new. The fourth rung, Eques, does admit houses the sand never did. So the
   rung itself is asserted here from both sides — the rung above the gate opens it and
   the rung below does not — because a gate set one rung too high looks exactly like a
   gate that works. */

import { hasHandle } from "../harness.mjs";

export const name = "summit";
export const describe = "Rome can be reached by two roads, and always ends";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const R = {};

    /* a house Rome would plausibly want: fame past the bar, a senator who likes it,
       and men fit to travel — everything except the proof of itself */
    const contender = (over)=>{
      const d = A.newGameState("Sum","clean","SUMMIT",null);
      d.gold = 12000; d.fame = 4000;
      d.patrons = [{ id:1, name:"Senator", rank:"senator", favor:85, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      d.gladiators = [];
      for(let i=0;i<4;i++){ const m = A.genOpponent(3, 88); m.id=d.nextId++; m.status="active"; m.mine=true;
        m.kit=A.defaultKit(m.cls); m.wins=14; m.pfame=140; m.fatigue=0; m.lastFought=-9; d.gladiators.push(m); }
      Object.assign(d, over||{});
      return d;
    };

    /* ---- 1. the gate: neither proof, then each of the two ---- */
    const bare    = contender();
    const byTitle = contender({ flags: Object.assign({}, contender().flags, { primusHeld:1 }) });
    const byRank  = contender({ rise: { rank:A.ROME_RANK, standing:100 } });
    const oneShort= contender({ rise: { rank:A.ROME_RANK-1, standing:100 } });
    R.gate = { bar: A.romeBar(bare), rungAt:A.ROME_RANK,
      rungName: A.RISE_RANKS[A.ROME_RANK].name, belowName: A.RISE_RANKS[A.ROME_RANK-1].name,
      topRung: A.RISE_RANKS.length-1,
      unproved: A.romeReady(bare), byTitle: A.romeReady(byTitle), byRank: A.romeReady(byRank),
      provedTitle: A.romeProved(byTitle), provedRank: A.romeProved(byRank),
      provedBare: A.romeProved(bare), provedOneShort: A.romeProved(oneShort),
      /* and the census road must not be the last rung — a gate at the top of the ladder
         is reached only by houses that got there another way, which is what v2.53.0 did */
      belowTheTop: A.ROME_RANK < A.RISE_RANKS.length-1 };

    /* ---- 2. a trip fought through to the end pays and comes home ---- */
    {
      const d = byTitle;
      A.offerRome(d);
      const offered = !!d.romeOffer;
      A.answerRomeWith(d, true);
      const onRoad = !!d.rome, due = d.rome ? d.rome.due : null;
      let weeks = 0, fought = 0, home = null;
      for(let w=0; w<40 && d.rome && !d.over; w++){
        weeks++;
        const os = (d.games && d.games.offers) || [];
        for(const o of os){
          const g = A.activeG(d).find(x=>!x.injury && (x.lastFought==null || x.lastFought < d.week));
          if(!g) break;
          let r = A.doFight(d, g.id, o, "measured", null, null, null, "none");
          /* #116: to exhaustion, not one word */
          { let n=0; while(r && r.crux && n++<4){ const pd = r.pending; pd.beats = r.beats;
            r = A.doFight(d, g.id, o, "measured", null, pd, null, "none"); } }
          fought++;
        }
        d.pendingEvent = null;
        try { A.endWeek(d); } catch(e){ break; }
        if(d.pendingEvent && d.pendingEvent.id === "romeReturn")
          home = { won:d.pendingEvent.data.won, lapsed:!!d.pendingEvent.data.lapsed };
      }
      R.fought = { offered, onRoad, due, weeks, bouts:fought, stillThere:!!d.rome,
        pending: home, over: d.over ? d.over.kind : null, runs: (d.flags.romeRuns||0) };
    }

    /* ---- 3. and a trip nobody fights lapses and comes home anyway ---- */
    {
      const d = contender({ flags: Object.assign({}, contender().flags, { primusHeld:1 }) });
      A.offerRome(d);
      A.answerRomeWith(d, true);
      const due = d.rome ? d.rome.due : null;
      let weeks = 0, home = null, worstWeek = 0;
      for(let w=0; w<60 && d.rome && !d.over; w++){
        weeks++; d.pendingEvent = null;      // decline everything: never touch the card
        const f0 = d.fame;
        try { A.endWeek(d); } catch(e){ break; }
        worstWeek = Math.max(worstWeek, Math.round(f0 - d.fame));   // the week the places went
        if(d.pendingEvent && d.pendingEvent.id === "romeReturn")
          home = { won:d.pendingEvent.data.won, lapsed:!!d.pendingEvent.data.lapsed };
      }
      R.lapsed = { due, weeks, stillThere:!!d.rome, pending: home,
        fameLostOnTheWeek: worstWeek, runs:(d.flags.romeRuns||0),
        capuaBack: !d.rome && !d.travel && !d.city };
    }

    /* ---- 4. the letter itself still expires ---- */
    {
      const d = contender({ flags: Object.assign({}, contender().flags, { primusHeld:1 }) });
      A.offerRome(d);
      const dueWk = d.romeOffer ? d.romeOffer.due : null;
      let weeks = 0;
      for(let w=0; w<12 && d.romeOffer && !d.over; w++){ weeks++; d.pendingEvent = null;
        try { A.endWeek(d); } catch(e){ break; } }
      R.letter = { due:dueWk, weeks, gone:!d.romeOffer, declined:!!d.flags.romeDeclined };
    }
    return R;
  });

  const lines = [], fails = [];
  const g = out.gate;
  lines.push(`the bar stands at ${g.bar} fame · unproved ${g.unproved} · by the primacy ${g.byTitle} · by the census ${g.byRank}`);
  lines.push(`the census road opens at rung ${g.rungAt} of ${g.topRung}, ${g.rungName} — and ${g.belowName} below it is refused: ${!g.provedOneShort}`);
  lines.push(`fought through: ${out.fought.bouts} bouts over ${out.fought.weeks} weeks, home with ${out.fought.pending ? out.fought.pending.won+" won" : "NOTHING PENDING"}`);
  lines.push(`never fought: the place lapsed after ${out.lapsed.weeks} weeks, ${out.lapsed.fameLostOnTheWeek} fame gone on the week it went, Capua ${out.lapsed.capuaBack ? "reached again" : "STILL OUT OF REACH"}`);
  lines.push(`the letter went unanswered for ${out.letter.weeks} weeks and ${out.letter.gone ? "expired" : "IS STILL WAITING"}`);

  /* ---- both roads, and neither free ---- */
  if(g.unproved) fails.push("a house that has proved nothing is offered Rome — the gate does nothing");
  if(!g.byTitle) fails.push("a house that held the primacy is not offered Rome — the fighter's road is shut");
  if(!g.byRank) fails.push(`a house received as ${g.rungName} is not offered Rome — the census road is shut`);
  if(g.provedBare) fails.push("romeProved is true for a house with neither the title nor the rank");
  if(g.provedOneShort)
    fails.push(`${g.belowName} is enough to prove a house to Rome — the census road has slid a rung and the climb no longer costs anything`);
  if(!g.belowTheTop)
    fails.push(`the census road opens at the last rung of the ladder (${g.rungAt} of ${g.topRung}) — measured over 24 houses, every house that got there had taken the primacy years earlier, so a gate set there admits nobody new`);

  /* ---- a trip that is fought pays and ends ---- */
  if(!out.fought.offered) fails.push("offerRome did not produce a letter");
  if(!out.fought.onRoad) fails.push("accepting did not put the house on the road");
  if(out.fought.due == null) fails.push("the trip carries no due date — this is the state a run could not leave");
  if(out.fought.stillThere) fails.push(`the house fought ${out.fought.bouts} bouts and is still at Rome after ${out.fought.weeks} weeks`);
  if(!out.fought.pending) fails.push("a completed trip raised no homecoming");
  else if(out.fought.pending.lapsed) fails.push("a trip that was fought through came home marked lapsed");

  /* ---- and a trip that is not fought still ends ---- */
  if(out.lapsed.stillThere)
    fails.push(`a house that never touched the card is STILL at Rome after ${out.lapsed.weeks} weeks — the run has entered a state it cannot leave`);
  if(!out.lapsed.pending || !out.lapsed.pending.lapsed)
    fails.push("a lapsed trip did not come home marked lapsed");
  if(!out.lapsed.capuaBack) fails.push("a lapsed trip left the house out of reach of Capua");
  if(!(out.lapsed.fameLostOnTheWeek >= 14)) fails.push(`giving Rome's places away cost ${out.lapsed.fameLostOnTheWeek} fame — it is supposed to be felt`);
  if(!(out.lapsed.runs > 0)) fails.push("a lapsed trip was not counted as a visit — the bar will not rise for it");

  /* ---- the letter is still a deadline ---- */
  if(!out.letter.gone) fails.push("the invitation to Rome no longer expires");

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
