/* EVERYTHING YOU DO WITH ANOTHER HOUSE'S MEN, AND NONE OF IT WAS EVER DRIVEN.

   The coverage sweep names the functions on the handle no check has ever called. Eleven of them
   were one system: watching a rival's fighter over his own wall, drilling one of yours against
   him, putting a word in his ear, buying him outright, calling him out, and paying his lanista
   off. That is not a corner of the game — measured over 780 house-weeks, **98.6% of the single
   offers on a Capuan card are against one of these named men**. It is who you fight.

   `scoutMan` · `setPrep` · `stopPrepFor` · `startCourt` · `courtCost` · `courtWeek` ·
   `buyFromHouse` · `nameHim` · `makePeace` · `houseOf` · `rateMan` · `gladValue`

   TWO HYPOTHESES, BOTH REFUTED, both written down because they are as useful as a fault:

   THE DRILL IS A TRAP. `prepFor` pays only when `offer.oppRef.fid` is the man drilled against,
   and the source says out loud that "it is a week a man does not get back if the bout never
   comes". Measured: the bout came for **21.1% of drills at a median of 3 weeks**, and 19.7%
   lapsed. One drill in five paying inside a month is a bet, not a trap.

   PREP_MAX IS UNREACHABLE. The first sweep watched a drill lapse at five weeks of six because
   the rival's man left his house's card in the sixth, and `prepLive` drops the drill when he
   does. Measured over 60 drills: **30 reached PREP_MAX, 50%**, median weeks reached 6, and the
   chron line that fires only at the top was written 15 times. A rival's man stays on his card
   a median of 21 weeks. The anecdote was an anecdote.

   So this check exists for coverage rather than for a bug, which is the honest reason: eleven
   functions the player meets constantly, and nothing watching any of them. What it holds is the
   shape of the bargain — the reading, its price, its staleness, the climb to the top of the
   scale, what the drill costs a man's own training, and that it pays against ONE man only. */

import { hasHandle } from "../harness.mjs";

export const name = "wall";
export const describe = "watching, drilling against, courting and buying another house's men";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], note = [];
    const S6 = ["str","agi","end","tec","sho","dis"];

    /* a house with coin, four men, and a rival whose card has somebody on it */
    const found = () => {
      const d = A.newGameState("W","clean","WALL-A",null);
      d.gold = 300000;
      while(A.activeG(d).length < 4 && !A.rosterFull(d)){
        const m=(d.market||[])[0]; if(!m) break; if(!A.buyFromBlock(d,m.id,null)) break; }
      const h = (d.rivals||[]).find(x=>!x.away && (x.fighters||[]).some(f=>!f.injury));
      const f = h && (h.fighters||[]).find(x=>!x.injury);
      return { d, h, f };
    };
    const base = found();
    if(!base.h || !base.f)
      return { bad:["no rival house had a fit man on its card in week one, so none of this could be driven"], note:[] };
    const HN = base.h.name, FID = base.f.id;
    /* every state below comes off ONE snapshot. The probe that wrote this check first kept a
       reference to their man across eight weeks of play and then went looking for him — a
       rival's fighter dies, retires and is sold on, which is why `prepLive` exists. */
    const SNAP = A.clone(base.d);
    const at = s => { const h = A.houseOf(s, HN);
      return { h, f: h && (h.fighters||[]).find(x=>x.id===FID) }; };

    /* ---- 1. THE WALL: what a reading costs, and that it can go off ---- */
    const w = A.clone(SNAP);
    const wf = at(w).f;
    if(A.scoutLive(w, wf)) bad.push(`a rival's man is already scouted in week one — nothing is bought by watching him`);
    const cost = A.scoutCost(w, wf);
    const gold0 = w.gold;
    const s1 = A.scoutMan(w, HN, FID);
    if(!s1 || !s1.ok) bad.push(`scoutMan would not watch a rival's fit man: ${(s1||{}).why}`);
    if(!A.scoutLive(w, at(w).f)) bad.push(`scoutMan reported ok and the reading is not live`);
    if(Math.round(gold0 - w.gold) !== Math.round(cost))
      bad.push(`watching him was quoted at ${cost}d and took ${Math.round(gold0 - w.gold)}d`);
    const s2 = A.scoutMan(w, HN, FID);
    if(s2 && s2.ok) bad.push(`he can be watched twice over, and the second one is paid for nothing`);
    const s3 = A.scoutMan(w, "House Of Nobody At All", FID);
    if(s3 && s3.ok) bad.push(`a house that does not exist will sell you a reading`);
    const broke = A.clone(SNAP); broke.gold = 1;
    const s4 = A.scoutMan(broke, HN, FID);
    if(s4 && s4.ok) bad.push(`a house with one denarius can pay ${cost} to have a man watched`);
    /* and the reading goes off, which is the whole reason a drill can lapse */
    const stale = A.clone(w); at(stale).f.seen = stale.week - (A.SCOUT_KEEPS + 1);
    if(A.scoutLive(stale, at(stale).f))
      bad.push(`a reading ${A.SCOUT_KEEPS + 1} weeks old is still live, and SCOUT_KEEPS is ${A.SCOUT_KEEPS}`);

    /* ---- 2. THE DRILL: its refusals, its climb, and what it costs his own work ---- */
    const g1 = A.activeG(w)[0], g2 = A.activeG(w)[1];
    const p1 = A.setPrep(w, g1.id, HN, FID);
    if(!p1 || !p1.ok) bad.push(`setPrep would not drill a man against a foe whose measure we hold: ${(p1||{}).why}`);
    if(!A.prepOf(g1)) bad.push(`setPrep reported ok and the man carries no drill`);
    const unwatched = (at(w).h.fighters||[]).find(x=>x.id!==FID && !A.scoutLive(w, x));
    if(unwatched){
      const r = A.setPrep(w, g2.id, HN, unwatched.id);
      if(r && r.ok) bad.push(`a man can be drilled against a foe nobody has ever watched — there is nothing to drill against but a rumour`);
    } else note.push("every man on their card was already scouted, so the rumour refusal could not be driven");
    const r3 = A.setPrep(w, 99999, HN, FID);
    if(r3 && r3.ok) bad.push(`setPrep will drill a man this house does not own`);

    /* the climb to the top of the scale, with the target held on his card and the reading kept
       fresh — if it cannot reach PREP_MAX under those conditions, the top of the edge is a
       number nobody will ever see */
    const climb = [];
    let reached = 0;
    const held = (()=>{ const f = at(w).f; return f ? JSON.parse(JSON.stringify(f)) : null; })();
    /* ---- THE TARGET IS HELD ON HIS CARD, AND THE FIXTURE FORGOT THE SECOND HALF OF THAT ----
       `prepLive` drops the drill when the man leaves the rival's roster OR the reading goes stale,
       and this loop only ever kept the reading fresh. The roster ages men out from 33 and sells,
       poaches and buries them besides, so the arm was asking "can a drill reach PREP_MAX" and
       measuring "did this particular rival happen to keep this particular man for six weeks" —
       which this file's own note puts at 50%. It went red in v3.168.0 on a release that touched no
       drill: a new `ri()` roll in the rival growth loop reordered the seeded stream and a different
       man aged off the card. Both halves of "held on his card" are held by hand now, the same way
       and for the same reason. */
    for(let k=0; k<A.PREP_MAX + 3; k++){
      const st = at(w);
      if(st.f){ st.f.seen = w.week; st.f.age = Math.min(st.f.age||24, 28); st.f.injury = null; }
      w.pendingEvent = null;
      try { A.endWeek(w); } catch(e){ climb.push("the week threw: "+(e.message||e)); break; }
      /* and if the world took him anyway, put him back — the arm is about the scale, not his luck */
      { const st2 = at(w);
        if(st2.h && !st2.f && held) st2.h.fighters.push(JSON.parse(JSON.stringify(held))); }
      const pr = A.prepOf(w.gladiators.find(x=>x.id===g1.id));
      climb.push(pr ? String(pr.weeks) : "lapsed");
      if(!pr) break;
      reached = pr.weeks;
      if(reached >= A.PREP_MAX) break;
    }
    if(reached < A.PREP_MAX)
      bad.push(`a drill on a man kept on his card with the reading kept fresh reached ${reached} of `
        + `PREP_MAX ${A.PREP_MAX} — the top of the edge, worth ${(A.PREP_MAX*0+14)}% power, cannot be had`);
    const gNow = w.gladiators.find(x=>x.id===g1.id);
    if(A.prepEdge(gNow) < 1 && reached >= A.PREP_MAX)
      bad.push(`he has drilled ${reached} weeks of ${A.PREP_MAX} and prepEdge is ${A.prepEdge(gNow)}`);

    /* the edge pays against ONE man, which is the entire bargain — asked AFTER the weeks are in,
       because a drill set this morning correctly carries nothing: `prepEdge` is weeks/PREP_MAX
       and the game's own word for a man at zero is "he has only just started" */
    const mkOffer = fid => ({ id:1, tier:1, stakes:"standard", purse:200, venue:"arena",
      opp:A.genOpponent(1, 55), oppRef:{ house:HN, fid } });
    const other = (at(w).h.fighters||[]).find(x=>x.id!==FID);
    if(gNow && A.prepOf(gNow)){
      if(A.prepFor(w, gNow, mkOffer(FID)) <= 0)
        bad.push(`after ${reached} weeks the drilled man brings no edge to the bout he was drilled for`);
      if(other && A.prepFor(w, gNow, mkOffer(other.id)) !== 0)
        bad.push(`the drill pays against a man it was not for — it is a general edge, not a reading`);
      if(A.prepFor(w, gNow, { id:2, tier:1, opp:A.genOpponent(1,55) }) !== 0)
        bad.push(`the drill pays against an opponent with no name at all`);
    } else bad.push(`the drill was gone before the edge could be asked about`);

    /* PREP_DRAG: his own work is worth less while he is on somebody else's habits. Two houses
       from one snapshot, same weeks, one drilling and one at the post — the direction is the
       assertion, not the size, because the size is a training-curve measurement */
    const drill = A.clone(SNAP), post = A.clone(SNAP);
    for(const s of [drill, post]){
      const f2 = at(s).f; if(f2) f2.seen = s.week;
      for(const g of A.activeG(s)) A.setRegimenOf(s, g.id, "palus");
    }
    const dg = A.activeG(drill)[0];
    A.setPrep(drill, dg.id, HN, FID);
    const sum = g => S6.reduce((n,k)=>n+(g[k]||0), 0);
    const was = { drill: sum(A.activeG(drill)[0]), post: sum(A.activeG(post)[0]) };
    for(let k=0;k<A.PREP_MAX;k++) for(const s of [drill, post]){
      const f2 = at(s).f; if(f2) f2.seen = s.week;
      for(const g of A.activeG(s)) if(!A.prepOf(g)) A.setRegimenOf(s, g.id, "palus");
      s.pendingEvent = null; try { A.endWeek(s); } catch(e){}
    }
    const now = { drill: sum(A.activeG(drill)[0]), post: sum(A.activeG(post)[0]) };
    const gain = { drill: now.drill - was.drill, post: now.post - was.post };
    if(gain.post > 0 && gain.drill > gain.post)
      bad.push(`a man drilling against somebody else's habits gained MORE of his own `
        + `(${gain.drill.toFixed(1)}) than a man at the post (${gain.post.toFixed(1)}) — PREP_DRAG is ${A.PREP_DRAG}`);

    /* ---- 3. A WORD IN HIS EAR ---- */
    const c = A.clone(SNAP); c.gold = 300000;
    const cf = at(c).f;
    const cc = A.courtCost(c, at(c).h, cf);
    if(!(cc > 0)) bad.push(`courting a man costs ${cc}`);
    const k1 = A.startCourt(c, HN, FID);
    if(!k1 || !k1.ok) bad.push(`startCourt would not begin: ${(k1||{}).why}`);
    if(!c.court) bad.push(`startCourt reported ok and there is no word in anybody's ear`);
    const otherC = (at(c).h.fighters||[]).find(x=>x.id!==FID);
    if(otherC){ const k2 = A.startCourt(c, HN, otherC.id);
      if(k2 && k2.ok) bad.push(`two of a rival's men can be courted at once, and the panel says one at a time`); }
    let courtWeeks = 0, came = false;
    for(let k=0; k<24 && c.court; k++){
      c.pendingEvent = null; courtWeeks++;
      try { A.endWeek(c); } catch(e){ bad.push(`the courting week threw: ${e.message||e}`); break; }
    }
    came = (c.gladiators||[]).some(x=>x.name===cf.name);
    if(c.court) bad.push(`a courting that began in week 1 was still running 24 weeks later`);
    /* it may be refused or he may be caught — what may not happen is it never resolving */
    note.push(`the courting ran ${courtWeeks} weeks and he ${came ? "came over" : "did not come"}`);

    /* ---- 4. BUYING HIM, CALLING HIM OUT, AND PAYING THE FEUD OFF ---- */
    const b = A.clone(SNAP); b.gold = 500000;
    let sold = null;
    for(const bf of (A.houseOf(b, HN).fighters||[])){
      const r = A.buyFromHouse(b, HN, bf.id);
      if(r && r.ok){ sold = bf.name; break; }
    }
    if(!sold) note.push("no man on their card would be sold at any price this week");
    else if(!(b.gladiators||[]).some(x=>x.name===sold))
      bad.push(`buyFromHouse took the money for ${sold} and he never arrived`);
    const poorB = A.clone(SNAP); poorB.gold = 1;
    const rb = A.buyFromHouse(poorB, HN, FID);
    if(rb && rb.ok) bad.push(`a house with one denarius bought a rival's fighter`);

    const n = A.clone(SNAP); n.gold = 500000; n.fame = 400;
    const nf = at(n).f;
    const rn = A.nameHim(n, HN, nf.id, A.activeG(n)[0].id);
    if(!rn) bad.push(`nameHim returned nothing at all`);
    else if(rn.ok && !(n.deadlines||[]).some(x=>x.kind==="challenge" && x.mine))
      bad.push(`the challenge was answered and nothing was put on the calendar`);
    else if(!rn.ok && !rn.refused && !rn.why)
      bad.push(`nameHim refused without saying why`);

    const pc = A.clone(SNAP); pc.gold = 500000;
    const ph = A.houseOf(pc, HN);
    ph.grudge = 0;
    const q1 = A.makePeace(pc, HN);
    if(q1 && q1.ok) bad.push(`a house with no grudge against you will take money to settle it`);
    ph.grudge = 70;
    const q2 = A.makePeace(pc, HN);
    if(!q2 || !q2.ok) bad.push(`a grudge of 70 could not be bought off: ${(q2||{}).why}`);
    else if(A.houseOf(pc, HN).grudge >= 70)
      bad.push(`peace was paid for and the grudge is still ${A.houseOf(pc, HN).grudge}`);

    return { bad, note,
      cost, climb, reached, PREP_MAX:A.PREP_MAX, PREP_DRAG:A.PREP_DRAG, SCOUT_KEEPS:A.SCOUT_KEEPS,
      gain, courtWeeks, came, sold, house:HN, foe:base.f.name,
      peace: q2 && q2.ok ? q2.price : null,
      challenge: rn && rn.ok ? { due:rn.due, purse:rn.purse, fee:rn.fee } : (rn||{}).why || null };
  });

  const lines = [];
  lines.push(`House ${out.house}, their man ${out.foe} — a reading costs ${out.cost}d and keeps ${out.SCOUT_KEEPS} weeks`);
  lines.push(`the drill: ${out.climb.join(" → ")} of PREP_MAX ${out.PREP_MAX}`
    + ` · it pays against that one man and nobody else`);
  lines.push(`what it costs his own work over ${out.PREP_MAX} weeks: `
    + `+${out.gain.drill.toFixed(1)} stat points drilling against +${out.gain.post.toFixed(1)} at the post (PREP_DRAG ${out.PREP_DRAG})`);
  lines.push(`a word in his ear: ${out.courtWeeks} weeks, and he ${out.came ? "came over" : "stayed"}`);
  lines.push(`bought outright: ${out.sold || "nobody would be sold"}`
    + ` · called out: ${typeof out.challenge === "object" && out.challenge ? `due week ${out.challenge.due} for ${out.challenge.purse}d` : out.challenge}`
    + ` · the feud bought off for ${out.peace}d`);
  for(const n of out.note) lines.push(`  ${n}`);

  const fails = [...out.bad];
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,4).join("; ") || null, lines };
}
