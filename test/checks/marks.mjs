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
   produce a mark with nowhere to be. */

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

    return { bad, parts:parts.length, flawed, scars:man.scars.length, campaign:live.length, repairedFrom:after.length };
  });

  const lines = [];
  lines.push(`${out.scars} marks from ${out.parts} places a blow can land, plus one place that does not exist`);
  lines.push(`flaws applied: ${Object.entries(out.flawed).map(([k,n])=>`${k} (${n} scar${n===1?"":"s"})`).join(", ")}`);
  lines.push(`a ver-17 save carrying two broken marks came back with ${out.repairedFrom}, mended`);
  lines.push(`${out.campaign} marks across a house played sixty weeks`);

  const fails = [...out.bad];
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,4).join("; ") || null, lines };
}
