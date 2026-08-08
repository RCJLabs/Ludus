/* A scar is a mark on a body, and a mark needs somewhere to be.

   Every scar the sand leaves comes through addScar, which looks the place up in
   TARGETS and stores where it sits. One did not. The old wound a seller does not
   mention — the `wound` flaw on the block — pushed { part:"flank", big:false } and
   no coordinates at all, so the Fighter drew it as

     <path d="MNaN,NaN LNaN,NaN">

   on every screen that showed the man, for as long as you owned him.

   It shipped for a long time for two reasons worth remembering. The check that
   should have caught it never bought anybody, so it never had a flawed man to
   draw; and when it did finally fail, its message reported only the first thing
   wrong, so ten console errors sat underneath a line about houses and were never
   printed.

   This check asks the plain question instead: can any path the game can take
   produce a mark with nowhere to be.

   It also holds the OTHER kind of mark — the four parts a bout wears down — to the
   balance its thresholds were split for. Three of the six places a blow can land feed
   the arm and one feeds each of the others, so a flat threshold put the arm out in
   nearly every bout; MARK_NEED splits them (legs 24, arm 58, head 26, body 26) to even
   that up. #102 named arm=58 as a suspect for the arm going out too RARELY and never
   measured it. Measured: the arm lands in 37.9% of bouts against legs 40.3, head 40.6
   and body 35.1 — the balance the split was for — and dropping it to 26 puts it back to
   81.9%, the original fault. Mortality does not move with it at all (15.4 / 16.7 / 13.6
   / 17.6% across four thresholds; the standard error on a 15% rate at n=700 is 1.4pt).
   So the number is right, and this pins it, because it is the kind of constant that
   drifts silently the moment anything touches how a blow chooses its place. */

import { hasHandle } from "../harness.mjs";

export const name = "marks";
export const describe = "every scar the game can leave has somewhere to be";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const ok = sc => sc && Number.isFinite(sc.x) && Number.isFinite(sc.y);
    const bad = [];

    /* 1. every place a blow can land */
    const parts = A.TARGETS.map(t=>t[0]);
    const man = { scars:[], scarCap:{}, str:60, agi:60, end:60, tec:60, sho:60, dis:60 };
    for(const part of parts){ A.addScar(man, part, false); A.addScar(man, part, true); }
    A.addScar(man, "nowhere-at-all", false);   // and a place that does not exist
    for(const sc of man.scars) if(!ok(sc)) bad.push(`addScar(${sc.part}) → ${sc.x},${sc.y}`);

    /* 2. every flaw a seller can hide, applied to a real man off the block */
    const d = A.newGameState("Marks","clean","MARKS",null);
    const flawed = {};
    for(const key of Object.keys(A.FLAWS)){
      const g = A.genGladiator(d, 55);
      g.scars = g.scars || []; g.traits = g.traits || [];
      A.FLAWS[key].apply(g);
      flawed[key] = (g.scars||[]).length;
      for(const sc of (g.scars||[])) if(!ok(sc)) bad.push(`FLAWS.${key} → ${JSON.stringify(sc)}`);
    }

    /* 3. and a save that already carries a bad one comes back mended */
    const old = A.newGameState("Old","clean","OLD",null);
    old.ver = 17;
    old.gladiators[0].scars = [{ part:"flank", big:false }, { part:"brow", x:null, y:undefined, big:true }];
    const mended = A.migrate(JSON.parse(JSON.stringify(old)));
    const after = (mended.gladiators[0].scars||[]);
    const repaired = after.every(ok);
    if(!repaired) bad.push(`an old save still carries ${after.filter(sc=>!ok(sc)).length} mark(s) with nowhere to be`);

    /* 4. the whole live roster after a campaign, as a net */
    const e = A.newGameState("Long","clean","LONG",null);
    e.gold = 200000;
    while(A.activeG(e).length<6 && !A.rosterFull(e)){ const m=(e.market||[])[0]; if(!m||!A.buyFromBlock(e,m.id,null)) break; }
    const av = f => (f.str+f.agi+f.end+f.tec+f.sho+f.dis)/6;
    const fin=(fn,a,re)=>{ let x=fn(...a); if(x&&x.crux){const pd=x.pending;pd.beats=x.beats;x=fn(...re(pd));} return (x&&!x.crux)?x:null; };
    for(let w=0;w<60;w++){
      e.gold = 200000;
      while(A.activeG(e).length<6 && !A.rosterFull(e)){ const m=(e.market||[])[0]; if(!m||!A.buyFromBlock(e,m.id,null)) break; }
      const fit = A.activeG(e).filter(g=>!g.injury).sort((x,z)=>av(z)-av(x));
      if(fit.length){ const c=A.pitMen(e);
        const o=A.makePitOffer(e, fit[0], "standard", c.length?c[0].id:null);
        fin(A.doFight,[e,fit[0].id,o,"measured",null,null,null,"none"],pd=>[e,fit[0].id,o,"measured",null,pd,null,"none"]); }
      e.pendingEvent = null;
      try{ A.endWeek(e); }catch(err){ break; }
      if(e.over) e.over = null;
    }
    const live = (e.gladiators||[]).concat(e.market||[]).flatMap(g=>(g.scars||[]));
    const loose = live.filter(sc=>!ok(sc));
    if(loose.length) bad.push(`${loose.length} of ${live.length} marks on a played house have nowhere to be`);

    /* 5. THE FOUR PARTS A BOUT WEARS DOWN, held to the balance they were split for.
       MARK_NEED is read at bout time, so the arm can be swung inside one page load and
       nothing else about the build changes — the only cross-arm comparison this project's
       RNG allows. genGladiator's second argument is a QUALITY, not a tier: passing 0..3
       once built raw nobodies against proper arena men and produced a 0.4% win rate with
       my man carried out of 44% of bouts, which is a bout that does not happen. The tiers
       the arena bills are qualities 34/50/66/82, and a man is matched to the tier he is on. */
    const armRun = (arm) => {
      A.MARK_NEED.arm = arm;
      const f = A.newGameState("Arm","clean","MARK-ARM",null);
      const got = { legs:0, arm:0, head:0, body:0 };
      let n = 0, dead = 0, any = 0;
      for(let i=0;i<220;i++){
        const tier = i % 4;
        const g = A.genGladiator(f, [34,50,66,82][tier]);
        const b = A.genOpponent(tier);
        let r = null;
        try { r = A.simulateFight(g, b, "measured", "standard", {}, {}); } catch(err){ continue; }
        if(!r || r.crux) continue;
        n++; if(r.aDies) dead++;
        const said = new Set();
        for(const bt of (r.beats||[])) if(bt.mark) said.add(bt.mark);
        for(const k of said) got[k]++;
        if(said.size) any++;
      }
      const pc = k => n ? +(got[k]/n*100).toFixed(1) : 0;
      return { arm, n, dead:n?+(dead/n*100).toFixed(1):0, any:n?+(any/n*100).toFixed(1):0,
        rate:{ legs:pc("legs"), arm:pc("arm"), head:pc("head"), body:pc("body") } };
    };
    const NEED_WAS = { ...A.MARK_NEED };
    const shipped = armRun(NEED_WAS.arm);
    const flat = armRun(26);
    A.MARK_NEED.arm = NEED_WAS.arm;

    /* the shipped number must keep all four in one band — no part may be the story of
       every bout, and none may be so dear it never happens */
    for(const k of ["legs","arm","head","body"]){
      if(shipped.rate[k] > 62) bad.push(`the ${k} gives out in ${shipped.rate[k]}% of bouts — that is not a mark, that is the bout`);
      if(shipped.rate[k] < 14) bad.push(`the ${k} gives out in only ${shipped.rate[k]}% of bouts — its four multipliers are close to dead`);
    }
    /* and the split must be doing the work: flattening the arm has to bring the fault back,
       or the thresholds are decoration and something else is deciding this */
    if(!(flat.rate.arm > shipped.rate.arm + 15))
      bad.push(`arm at 26 lands ${flat.rate.arm}% against ${shipped.rate.arm}% at ${NEED_WAS.arm} — the split is not what is holding the arm back`);

    return { bad, parts:parts.length, flawed, scars:man.scars.length, campaign:live.length,
      repairedFrom:after.length, shipped, flat, need:NEED_WAS };
  });

  const lines = [];
  lines.push(`${out.scars} marks from ${out.parts} places a blow can land, plus one place that does not exist`);
  lines.push(`flaws applied: ${Object.entries(out.flawed).map(([k,n])=>`${k} (${n} scar${n===1?"":"s"})`).join(", ")}`);
  lines.push(`a ver-17 save carrying two broken marks came back with ${out.repairedFrom}, mended`);
  lines.push(`${out.campaign} marks across a house played sixty weeks`);
  const R = out.shipped.rate;
  lines.push(`the four parts, at legs ${out.need.legs} · arm ${out.need.arm} · head ${out.need.head} · body ${out.need.body}, over ${out.shipped.n} bouts:`);
  lines.push(`  legs ${R.legs}% · arm ${R.arm}% · head ${R.head}% · body ${R.body}% — one mark or more in ${out.shipped.any}%, my man carried out of ${out.shipped.dead}%`);
  lines.push(`  flatten the arm to 26 and it lands in ${out.flat.rate.arm}% — the fault the split was for — with mortality unmoved at ${out.flat.dead}%`);

  const fails = [...out.bad];
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,4).join("; ") || null, lines };
}
