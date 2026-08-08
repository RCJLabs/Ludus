/* THE WAR, WHICH WORKED PERFECTLY AND HAD ONE DOOR.

   Four named stages over fifty-eight weeks, standing decay, a rising defiance floor because
   the men watched it done, a block that swings from ×1.25 to ×0.55, and four events of its
   own. Driven four times by forcing the Night of Fire and opening the gates, every run
   reached every stage, resolved on schedule and did all of it. There was never anything
   wrong with the arc.

   What was wrong is that `spartacusAtLarge` — the only flag `warWeek` reads — was written in
   exactly one place in twenty-three thousand lines: the "Open the gates" branch of
   `uprising`. So the entire subsystem was behind driving a rebellion to its last night and
   then choosing the branch that costs you the house — measured, **nine men to three**, plus
   thirty fame. Across 48 houses run four hundred weeks on a good policy the four war events
   fired **not once**.

   It arrives as news now as well: a rising somewhere else that got away, once in a run,
   after week 60. Measured after: 45% of houses that live past that gate see it, and 4 of the
   7 that reach week 250, breaking out between weeks 101 and 190 and always running out.

   So this holds both roads, the stage clock, and the one thing that must never be true of a
   fifty-eight week arc — that it can fail to end. That is the shape of the v2.53.0 fault
   where a house sat at Rome for ever, and a war is nine times longer than a trip. */

import { hasHandle } from "../harness.mjs";

export const name = "war";
export const describe = "the war reaches a house that kept its gate shut, and always ends";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const R = {};

    const house = (seed, over)=>{
      const d = A.newGameState("Wr","clean",seed,null);
      d.gold = 40000; d.fame = 3000; d.week = 90; d.unrest = 10;
      d.patrons = [{ id:1, name:"Magistrate", rank:"magistrate", favor:75, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      for(let i=0;i<6;i++){ const m = A.genGladiator(d, 74); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.wins=5; m.defiance=8; m.morale=70;
        m.fatigue=0; m.lastFought=-9; d.gladiators.push(m); }
      Object.assign(d, over||{});
      return d;
    };
    const quiet = d => { d.pendingEvent = null;
      d.gold = Math.max(d.gold, 20000);
      for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "palus");
      try { A.endWeek(d); } catch(e){}
      if(d.over){ d.over = null; d.unrest = Math.min(d.unrest, 25); } };

    /* ---- 1. the road that was always there: your own gate ---- */
    { const d = house("WR_OWN");
      for(const g of A.activeG(d)){ g.defiance = 72; g.morale = 28; }
      const leader = A.activeG(d).reduce((m,g)=>g.defiance>m.defiance?g:m, A.activeG(d)[0]);
      d.rebellion = { stage:3, leaderId:leader.id };
      const ev = A.EVENTS.uprising.make(d);
      const men0 = A.activeG(d).length, fame0 = d.fame;
      let opened = false;
      if(ev){ const i = ev.data.keys.indexOf("open");
        if(i >= 0){ A.EVENTS.uprising.run(d, ev, i); opened = true; } }
      R.own = { raised:!!ev, opened, started:!!d.flags.spartacusAtLarge,
        who:d.flags.spartacusAtLarge || null, away:!!d.flags.warAway,
        menLost: men0 - A.activeG(d).length, fameLost: Math.round(fame0 - d.fame) }; }

    /* ---- 2. and the road that was not: it happened somewhere else ---- */
    { /* it does not come to a house in its first year, however many weeks are rolled */
      const young = house("WR_YOUNG"); young.week = 10;
      let earlyFired = 0;
      for(let i=0;i<4000;i++){ A.warElsewhere(young); if(young.flags.warAway){ earlyFired++; break; } }
      /* nor while the house's own cells are already brewing */
      const brewing = house("WR_BREW");
      brewing.rebellion = { stage:2, leaderId:A.activeG(brewing)[0].id };
      let brewFired = 0;
      for(let i=0;i<4000;i++){ A.warElsewhere(brewing); if(brewing.flags.warAway){ brewFired++; break; } }
      /* and to an established house it comes, once */
      const d = house("WR_AWAY");
      /* BEFORE the roll, not after. Read on the far side of the loop this said the news cost
         no fame and moved no defiance, because the war had already happened by the time the
         baseline was taken — the same fault the line check hit in v2.54.0. */
      const men0 = A.activeG(d).length, fame0 = d.fame;
      const defBefore = A.activeG(d).reduce((s,g)=>s+g.defiance,0)/Math.max(1,men0);
      let rolls = 0;
      for(let i=0;i<8000 && !d.flags.warAway; i++){ A.warElsewhere(d); rolls++; }
      const firstWho = d.flags.spartacusAtLarge;
      /* and never twice */
      for(let i=0;i<4000;i++) A.warElsewhere(d);
      R.away = { gate:A.WAR_AWAY_AT, odds:A.WAR_AWAY_ODDS, earlyFired, brewFired,
        fired:!!d.flags.warAway, rolls, who:firstWho || null,
        stillTheSame: d.flags.spartacusAtLarge === firstWho,
        menLost: men0 - A.activeG(d).length, fameLost: Math.round(fame0 - d.fame),
        defUp: +(A.activeG(d).reduce((s,g)=>s+g.defiance,0)/Math.max(1,A.activeG(d).length) - defBefore).toFixed(1) }; }

    /* ---- 3. the stage clock, driven week by week ---- */
    { const d = house("WR_RUN");
      for(let i=0;i<8000 && !d.flags.warAway; i++) A.warElsewhere(d);
      const seen = [], fav0 = d.favor;
      let last = -1, weeks = 0, blocked = 0;
      for(let w=0; w<80 && weeks < 75; w++){
        quiet(d); weeks++;
        while(A.activeG(d).length < 4){ const m = A.genGladiator(d, 70); m.id=d.nextId++;
          m.status="active"; m.mine=true; m.kit=A.defaultKit(m.cls); m.defiance=6;
          m.fatigue=0; m.lastFought=-9; d.gladiators.push(m); }
        const i = A.warIdx(d);
        if(d.war && i !== last){ last = i;
          seen.push({ at:d.war.weeks, idx:i, name:A.WAR[i].name,
            market:+A.warMarket(d).toFixed(2), floor:A.WAR[i].defFloor }); }
        if(d.war && d.war.done) blocked++;
      }
      R.run = { stages:seen, defined:A.WAR.map(x=>({ at:x.at, name:x.name })),
        weeks, warWeeks:d.war?d.war.weeks:null, done:d.war?!!d.war.done:null,
        favorFell: Math.round(fav0 - d.favor),
        quietAfter: blocked > 0,
        /* the defiance floor: the men watched it done */
        defiance: Math.round(A.activeG(d).reduce((s,g)=>s+g.defiance,0)/Math.max(1,A.activeG(d).length)) }; }

    /* ---- 4. and its events are gated on the stage they belong to ---- */
    { const d = house("WR_EV");
      for(let i=0;i<8000 && !d.flags.warAway; i++) A.warElsewhere(d);
      A.warWeek(d);                                        /* stage 0 */
      const roadEarly = !!A.EVENTS.theRoad.make(d);
      d.war.weeks = A.WAR[A.WAR.length-1].at + 1;          /* the road itself */
      const roadLate = !!A.EVENTS.theRoad.make(d);
      const taxAt = A.EVENTS.warTax.make(d) ? "yes" : "no";
      R.events = { roadEarly, roadLate, taxAt,
        keys: Object.keys(A.EVENTS).filter(k=>/^war/.test(k) || k==="theRoad") }; }

    return R;
  });

  const lines = [], fails = [];
  lines.push(`your own gate: the night raised ${out.own.raised}, opened ${out.own.opened} → "${out.own.who}" · it cost ${out.own.menLost} men and ${out.own.fameLost} fame`);
  lines.push(`news from elsewhere (from week ${out.away.gate}, ${(out.away.odds*100).toFixed(2)}% a week): fired after ${out.away.rolls} rolls → "${out.away.who}" · cost ${out.away.menLost} men, ${out.away.fameLost} fame, defiance +${out.away.defUp}`);
  lines.push(`   refused a house in week 10: ${!out.away.earlyFired} · refused one whose own cells are brewing: ${!out.away.brewFired} · never a second: ${out.away.stillTheSame}`);
  lines.push(`the stage clock over ${out.run.weeks} weeks — the table says ${out.run.defined.map(x=>`${x.at}:${x.name}`).join(" · ")}`);
  for(const s of out.run.stages)
    lines.push(`   week ${String(s.at).padStart(2)} → [${s.idx}] ${s.name.padEnd(20)} block ×${s.market} · defiance floor ${s.floor}`);
  lines.push(`   ran ${out.run.warWeeks} weeks, resolved ${out.run.done} · standing fell ${out.run.favorFell} · the cells sit at defiance ${out.run.defiance}`);
  lines.push(`its events: ${out.events.keys.join(", ")} · the road at stage 0: ${out.events.roadEarly} · at the last stage: ${out.events.roadLate}`);

  /* ---- both roads open it ---- */
  if(!out.own.raised) fails.push("a house with a stage-3 rebellion and a firebrand did not raise the Night of Fire");
  if(!out.own.started) fails.push("opening the gates did not start the war — this was the only door there has ever been");
  if(out.own.away) fails.push("opening your own gates was recorded as the war happening elsewhere");
  if(!(out.own.menLost >= 2)) fails.push(`opening the gates cost ${out.own.menLost} men — it is supposed to cost the house`);
  if(!(out.own.fameLost >= 10)) fails.push(`opening the gates cost ${out.own.fameLost} fame — Capua is supposed to call you weak for it`);
  if(!out.away.fired)
    fails.push(`the war never arrived from elsewhere in ${out.away.rolls} rolls — the subsystem is back behind one branch of one event, and across 48 houses that meant it fired not once`);
  if(out.away.earlyFired) fails.push(`the war came to a house in week 10 — the gate is week ${out.away.gate}`);
  if(out.away.brewFired) fails.push("the war arrived from elsewhere while the house's own cells were already rising — one rebellion at a time");
  if(!out.away.stillTheSame) fails.push("a second war started on top of the first");
  if(out.away.menLost !== 0) fails.push(`news from another house cost this one ${out.away.menLost} men — it is not your gate`);
  if(!(out.away.fameLost > 0 && out.away.fameLost < out.own.fameLost))
    fails.push(`the news cost ${out.away.fameLost} fame against ${out.own.fameLost} for your own gate — the whole trade is looked at differently, but not as differently as the house it walked out of`);
  if(!(out.away.defUp > 0)) fails.push("a rising that got away somewhere else left your own cells unmoved — the men are supposed to hear about it");

  /* ---- the stages arrive, in order, on their own clock ---- */
  { const seen = out.run.stages, def = out.run.defined;
    if(seen.length < def.length)
      fails.push(`${seen.length} of ${def.length} stages arrived in ${out.run.weeks} weeks — the arc does not run out`);
    for(let i=0;i<seen.length;i++){
      if(seen[i].idx !== i) fails.push(`stage ${i} arrived out of order (got ${seen[i].idx})`);
      if(seen[i].at < def[i].at) fails.push(`${def[i].name} arrived on war-week ${seen[i].at}, before the ${def[i].at} the table says`);
    }
    const mk = seen.map(s=>s.market);
    if(mk.length >= 3 && !(mk[1] > 1 && mk[mk.length-1] < 1))
      fails.push(`the block did not swing across the war (${mk.join(" → ")}) — a war is supposed to be a seller's market and then a buyer's`);
  }
  if(!out.run.done)
    fails.push(`the war had not resolved after ${out.run.weeks} weeks — a fifty-eight week arc that cannot end is the state a run cannot leave, and it is nine times longer than a trip to Rome`);
  if(!(out.run.favorFell > 0)) fails.push("fifty-eight weeks of war cost the house no standing at all");
  if(!(out.run.defiance > 8))
    fails.push(`the cells sit at defiance ${out.run.defiance} after watching it done — the rising floor is what the war does to a yard`);

  /* ---- and its events belong to their stages ---- */
  if(out.events.keys.length < 4) fails.push(`only ${out.events.keys.length} war events exist — there were four`);
  if(out.events.roadEarly) fails.push("the crucifixions are offered in the first week of the war");
  if(!out.events.roadLate) fails.push("the last stage of the war does not raise the road — the arc has no ending to see");

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
