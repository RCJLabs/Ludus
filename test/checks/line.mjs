/* THE LINE OF THE HOUSE, WHICH NOTHING HAD EVER WALKED.

   The lanista's death used to stop the run; naming somebody makes it a handover
   instead, and there are four kinds of somebody with four different bargains — a
   son keeps 72% of the house's fame, a nephew brings 900 denarii of his own, the
   freed doctore costs the cells nothing and Capua a great deal, and a scion you
   raised in the yard keeps almost everything. `succeed` was on the handle and
   `nameHeir` was not, so the half that fires could never be reached by the half
   that arms it, and no check had ever driven a succession.

   The v2.53.0 audit measured what that hid. Across eight houses run four hundred
   weeks, an heir appeared in exactly the three that lived past week 360, all of
   them scions raised through the family arc — a child needs about fifteen game
   years to reach the toga — and `succeed` ran in play precisely never, because the
   old-and-well ending intercepts a lanista before his health reaches nothing. So
   the whole succession, and the three heirs a player names deliberately, rested on
   nothing at all.

   This walks it: who may be named and when, then each of the four kinds carried
   through a death and asserted against its own row in HEIRS — the fame kept, the
   standing kept, what the cells make of it, what he brings — and the things that
   must survive a handover, which is every man, every wing, and every debt. */

import { hasHandle } from "../harness.mjs";

export const name = "line";
export const describe = "the house outlives its lanista, four different ways";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const R = {};

    /* an established house: men, wings, a debt, a fame and a patron worth inheriting */
    const house = (over)=>{
      const d = A.newGameState("Line","clean","LINE",null);
      d.gold = 6000; d.fame = 4000;
      d.patrons = [{ id:1, name:"Magistrate", rank:"magistrate", favor:80, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      /* genGladiator, not genOpponent: the latter builds the other side of a card and
         carries no defiance, no regard and no record, and a roster stocked with it
         reads NaN out of the week's unrest. This check found that the hard way. */
      for(let i=0;i<3;i++){ const m = A.genGladiator(d, 76); m.id=d.nextId++; m.status="active"; m.mine=true;
        m.kit=A.defaultKit(m.cls); m.wins=6; m.pfame=60; d.gladiators.push(m); }
      d.buildings = { valetudinarium:2, balneae:2, carceres:1, armamentarium:2, palus:2 };
      d.lanista = Object.assign({}, d.lanista, { age:44, health:60 });
      Object.assign(d, over||{});
      return d;
    };

    /* ---- 1. who may be named, and when ---- */
    {
      const young = house(); young.lanista.age = 34;
      const old   = house();
      const withDoc = house(); withDoc.doctore = { name:"Oenomaus", skill:80, spec:"tec", wage:10, fee:0, fromHouse:true, weeks:20 };
      const hiredDoc = house(); hiredDoc.doctore = { name:"Hired", skill:70, spec:"str", wage:22, fee:500, fromHouse:false, weeks:5 };
      R.eligible = { young: A.heirEligible(young), old: A.heirEligible(old),
        freedDoctore: A.heirEligible(withDoc), hiredDoctore: A.heirEligible(hiredDoc) };
    }

    /* ---- 2. each kind, carried through a death ---- */
    const kinds = ["son","nephew","doctore","scion"];
    R.rows = [];
    for(const kind of kinds){
      const d = house();
      if(kind==="doctore") d.doctore = { name:"Oenomaus", skill:80, spec:"tec", wage:10, fee:0, fromHouse:true, weeks:20 };
      const named = A.nameHeir(d, kind);
      const heirName = d.heir ? d.heir.name : null;
      /* the numbers going in */
      const before = { fame:d.fame, favor:d.favor, gold:d.gold, unrest:d.unrest, gen:d.generation||1,
        men:A.activeG(d).length, wings:Object.keys(d.buildings||{}).length,
        lan:d.lanista.name, forebears:(d.forebears||[]).length };
      /* his health is spent — below nothing, because an ordinary quiet week puts a
         little back and exactly nought would survive it */
      d.lanista.health = -10;
      d.pendingEvent = null;
      try { A.endWeek(d); } catch(e){}
      const raised = !!d.succession;
      const overBefore = d.over ? d.over.kind : null;
      /* the numbers as they stand the moment before the handover — the week itself
         takes upkeep and decays standing, and reading them from before it measured
         the week rather than the succession */
      const at = { fame:d.fame, favor:d.favor, gold:d.gold, unrest:d.unrest,
        men:A.activeG(d).length, wings:Object.keys(d.buildings||{}).length };
      const took = A.takeUpTheHouse(d);
      const H = A.HEIRS[kind];
      R.rows.push({ kind, named, heirName, raised, overBefore, took,
        expectFame: Math.round(at.fame * H.fameKeep), gotFame: Math.round(d.fame),
        expectFavor: Math.round(at.favor * H.favorKeep), gotFavor: Math.round(d.favor),
        goldGain: Math.round(d.gold - at.gold), expectGold: H.gold,
        unrestWas: at.unrest, unrestNow: d.unrest, expectUnrest: H.unrest,
        gen: d.generation, expectGen: before.gen + 1,
        men: A.activeG(d).length, expectMen: at.men,
        wings: Object.keys(d.buildings||{}).length, expectWings: at.wings,
        newLan: d.lanista ? d.lanista.name : null, newAge: d.lanista ? d.lanista.age : null,
        traits: d.lanista ? (d.lanista.traits||[]).length : -1,
        heirCleared: d.heir == null, over: d.over ? d.over.kind : null,
        forebears: (d.forebears||[]).length });
    }

    /* ---- 3. and a house with nobody named simply ends ---- */
    {
      const d = house();
      d.lanista.health = -10;
      d.pendingEvent = null;
      try { A.endWeek(d); } catch(e){}
      R.nobody = { over: d.over ? d.over.kind : null, succession: !!d.succession };
    }
    return R;
  });

  const lines = [], fails = [];
  const e = out.eligible;
  lines.push(`may be named — at 34: ${e.young.join("/")} · at 44: ${e.old.join("/")} · with a freed doctore: ${e.freedDoctore.join("/")} · with a hired one: ${e.hiredDoctore.join("/")}`);
  for(const r of out.rows)
    lines.push(`  ${r.kind.padEnd(8)} fame ${r.gotFame}/${r.expectFame} · standing ${r.gotFavor}/${r.expectFavor} · ` +
      `${r.goldGain>=0?"+":""}${r.goldGain}d · unrest ${r.unrestWas}→${r.unrestNow} (HEIRS says ${r.expectUnrest>=0?"+":""}${r.expectUnrest}) · ` +
      `gen ${r.gen} · ${r.men} men, ${r.wings} wings · ${r.newLan} aged ${r.newAge}, ${r.traits} traits`);
  lines.push(`nobody named: the run ends as "${out.nobody.over}"`);

  /* ---- the gates on naming ---- */
  if(e.young.includes("son")) fails.push("a lanista of 34 may name a son — the age gate is open");
  if(!e.old.includes("son")) fails.push("a lanista of 44 may not name a son");
  if(!e.old.includes("nephew")) fails.push("nobody may name a nephew — that road is always supposed to be open");
  if(!e.freedDoctore.includes("doctore")) fails.push("a freed doctore of your own may not be named");
  if(e.hiredDoctore.includes("doctore")) fails.push("a hired doctore may be named heir — only your own freed men should be");

  /* ---- each kind's own bargain ---- */
  for(const r of out.rows){
    if(!r.named) fails.push(`${r.kind} could not be named`);
    if(!r.heirName) fails.push(`${r.kind} was named without a name`);
    if(!r.raised) fails.push(`${r.kind}: the lanista died with an heir named and no handover was raised`);
    if(r.overBefore) fails.push(`${r.kind}: the run ended ("${r.overBefore}") instead of passing to the heir`);
    if(!r.took) fails.push(`${r.kind}: takeUpTheHouse refused`);
    if(Math.abs(r.gotFame - r.expectFame) > 2)
      fails.push(`${r.kind} kept ${r.gotFame} fame where HEIRS says ${r.expectFame}`);
    if(Math.abs(r.gotFavor - r.expectFavor) > 2)
      fails.push(`${r.kind} kept ${r.gotFavor} standing where HEIRS says ${r.expectFavor}`);
    if(r.goldGain !== r.expectGold)
      fails.push(`${r.kind} brought ${r.goldGain}d where HEIRS says ${r.expectGold}d`);
    if(!Number.isFinite(r.unrestNow))
      fails.push(`${r.kind}: unrest came out of the handover as ${r.unrestNow} — the cells' temper is not a number any more`);
    else if(Math.abs((r.unrestNow - r.unrestWas) - r.expectUnrest) > 1.5 && r.unrestNow > 0 && r.unrestNow < 100)
      fails.push(`${r.kind}: unrest moved ${(r.unrestNow-r.unrestWas).toFixed(1)} where HEIRS says ${r.expectUnrest}`);
    if(r.gen !== r.expectGen) fails.push(`${r.kind}: the house is generation ${r.gen}, not ${r.expectGen}`);
    if(r.men !== r.expectMen) fails.push(`${r.kind}: ${r.expectMen} men went in and ${r.men} came out — a handover must not cost men`);
    if(r.wings !== r.expectWings) fails.push(`${r.kind}: the wings did not survive the handover`);
    if(!r.newLan) fails.push(`${r.kind}: no new lanista`);
    if(r.traits !== 0 && r.kind !== "scion")
      fails.push(`${r.kind} inherited ${r.traits} of the dead man's traits — a new lanista earns his own reputation`);
    if(!r.heirCleared) fails.push(`${r.kind}: the heir slot was not cleared, so the next death would hand the house to a ghost`);
    if(r.over) fails.push(`${r.kind}: the run is over ("${r.over}") after a successful handover`);
    if(r.forebears !== 1) fails.push(`${r.kind}: ${r.forebears} forebears recorded, expected the man who just died`);
  }
  /* ---- and no heir is still an ending ---- */
  if(out.nobody.succession) fails.push("a house with nobody named raised a handover anyway");
  if(out.nobody.over !== "lanistaDied") fails.push(`a house with nobody named ended as "${out.nobody.over}" rather than the lanista's death`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
