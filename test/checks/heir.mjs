/* THE SON IS A BOY, NOT A NAME DRAWN FROM A JAR

   Phase queue item #237. `heirEligible` already checked for a real, specific boy before offering
   "son" — `d.lanista.age>=40 && livingKids(d).some(c=>c.sex==="m" && childAge(d,c)>=SON_AGE)` — but
   `nameHeir(d,"son")` never consulted him: it drew a name from `PRAENOMINA`/`NOMINA`/`COGNOMINA`,
   the identical fabrication branch used for "nephew" — a kind for which no real candidate has ever
   existed in game state. `line.mjs` already holds the eligibility gate both ways round (#226) and
   carries each `HEIRS` kind through a death to check the payout, but its "each kind" loop calls
   `nameHeir` on a fresh, CHILDLESS house for every kind including "son" — so it has never once
   exercised the identity path with a real boy behind it, and would have passed unchanged through
   the bug this check exists to catch.

   `eligibleSons(d)` is the real candidate list now, oldest first; `nameHeir(d,"son",cid)` installs
   the actual boy — his mentor bond and up-bringing traits carried over the way `resolveToga`
   already does for "scion" — defaulting to the eldest eligible son when no `cid` is given, and
   falling back to a fabricated stranger only when no real candidate exists at all (the path
   `line.mjs`'s own childless fixture already exercises, held here too so it stays a deliberate
   fallback and not a silent regression).

   FIVE ARMS:
   1 · A SINGLE ELIGIBLE SON IS NAMED BY HIS OWN IDENTITY, not a stranger's — name, cid, traits and
       mentor bond carried from the real record `resolveRaise`/`raiseEvent` already built for him.
   2 · TWO ELIGIBLE SONS: naming one by cid gets that one; naming with no cid defaults to the elder.
   3 · A STALE CID DEGRADES TO THE DEFAULT, not to a fabricated name — a resolvable failure, not a
       silent one.
   4 · SUCCESSION CARRIES THE IDENTITY THROUGH: `succeed()` stamps `tookHouse` on the real matching
       child and fires the mentor bonus for a son exactly as it already does for a scion, without
       touching `HEIRS.son`'s own weaker numbers — the payout stays rougher than a patient toga,
       only the identity was wrong.
   5 · THE ONE REAL FALLBACK IS HELD: a childless-or-too-young house still gets a valid heir out of
       `nameHeir(d,"son")` — no crash, no null name — the same shape `line.mjs`'s own fixture uses. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "heir";
export const describe = "the named son is the real boy the house raised, not a stranger's name";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"HEIR-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];

    const house = (over) => {
      const d = A.newGameState("Heir", "clean", "HEIR", null);
      d.gold = 6000; d.fame = 4000;
      for(let i=0;i<3;i++){ const m = A.genGladiator(d, 76); m.id=d.nextId++; m.status="active"; m.mine=true;
        m.kit=A.defaultKit(m.cls); m.wins=6; m.pfame=60; d.gladiators.push(m); }
      d.lanista = Object.assign({}, d.lanista, { age:44, health:60 });
      Object.assign(d, over || {});
      return d;
    };
    const withKid = (d, id, ageYears, extra) => {
      const dm = A.domusOf(d);
      dm.wife = dm.wife || { name:"Vettia", family:"Vettius", married:1, age:30, from:"merchant" };
      dm.children.push(Object.assign({ id, name:`Boy${id}`, sex:"m",
        born: d.week - ageYears*A.YEAR_WEEKS, up:{palus:0,rhetor:0,box:0} }, extra || {}));
      return dm.children[dm.children.length-1];
    };

    /* ---- 1. one real son, named by his own identity ---- */
    let arm1 = null;
    { const d = house();
      const c = withKid(d, 501, 10, { up:{palus:0,rhetor:3,box:0}, mentorId:77, mentorName:"Vetus" });
      const elig = A.heirEligible(d);
      const sons = A.eligibleSons(d);
      A.nameHeir(d, "son");
      arm1 = { elig, sonsN: sons.length, sonId: sons[0] && sons[0].id,
        heirName: d.heir && d.heir.name, heirCid: d.heir && d.heir.cid,
        heirTraits: d.heir && d.heir.traits, heirMentor: d.heir && d.heir.mentorId,
        realName: c.name };
      if(!elig.includes("son")) bad.push(`a lanista of 44 with a real ten-year-old son is not offered "son": ${elig.join("/")}`);
      if(arm1.heirName !== c.name) bad.push(`nameHeir(d,"son") named "${arm1.heirName}" — the real boy is "${c.name}"`);
      if(arm1.heirCid !== c.id) bad.push(`the named heir carries cid ${arm1.heirCid}, not the real boy's id ${c.id}`);
      if(!(arm1.heirTraits && arm1.heirTraits.includes("respected")))
        bad.push(`the boy was raised toward "respected" (rhetor) and the named heir's traits are [${(arm1.heirTraits||[]).join(",")}]`);
      if(arm1.heirMentor !== 77) bad.push(`the boy's mentor bond (id 77) did not carry onto the named heir (got ${arm1.heirMentor})`); }

    /* ---- 2. two eligible sons: named by cid, and the no-cid default ---- */
    let arm2 = null;
    { const d = house();
      const elder = withKid(d, 601, 15, {});
      const younger = withKid(d, 602, 10, {});
      const sons = A.eligibleSons(d);
      const byCidElder = (()=>{ const dd = house(); withKid(dd, 601, 15, {}); withKid(dd, 602, 10, {});
        A.nameHeir(dd, "son", 601); return dd.heir; })();
      const byCidYounger = (()=>{ const dd = house(); withKid(dd, 601, 15, {}); withKid(dd, 602, 10, {});
        A.nameHeir(dd, "son", 602); return dd.heir; })();
      const byDefault = (()=>{ const dd = house(); withKid(dd, 601, 15, {}); withKid(dd, 602, 10, {});
        A.nameHeir(dd, "son"); return dd.heir; })();
      arm2 = { sonsN: sons.length, sonsOrder: sons.map(c=>c.id),
        byCidElder: byCidElder.name, byCidYounger: byCidYounger.name,
        byDefault: byDefault.name, elderName: elder.name, youngerName: younger.name };
      if(arm2.sonsN !== 2) bad.push(`two real sons produced ${arm2.sonsN} eligible candidates`);
      if(arm2.sonsOrder[0] !== 601) bad.push(`eligibleSons is not oldest-first: got order ${arm2.sonsOrder.join(",")}`);
      if(byCidElder.name !== elder.name) bad.push(`naming by the elder's cid (601) got "${byCidElder.name}", not "${elder.name}"`);
      if(byCidYounger.name !== younger.name) bad.push(`naming by the younger's cid (602) got "${byCidYounger.name}", not "${younger.name}"`);
      if(byDefault.name !== elder.name) bad.push(`naming "son" with no cid on two eligible boys got "${byDefault.name}", not the elder "${elder.name}"`); }

    /* ---- 3. a stale cid degrades to the default, not to a fabricated stranger ---- */
    let arm3 = null;
    { const d = house();
      const c = withKid(d, 701, 12, {});
      A.nameHeir(d, "son", 999999);
      arm3 = { heirName: d.heir && d.heir.name, heirCid: d.heir && d.heir.cid, realName: c.name };
      if(arm3.heirName !== c.name) bad.push(`a stale cid produced "${arm3.heirName}" instead of falling back to the real boy "${c.name}"`); }

    /* ---- 4. succession carries the identity through, and the payout stays son-scale ---- */
    let arm4 = null;
    { const d = house();
      const mentor = d.gladiators[0];
      const c = withKid(d, 801, 11, { mentorId:mentor.id, mentorName:mentor.name });
      const mentorBefore = { morale:mentor.morale, regard:A.regardOf(mentor) };
      A.nameHeir(d, "son");
      const heirName = d.heir.name;
      const fameBefore = d.fame;
      d.lanista.health = -10; d.pendingEvent = null;
      try { A.endWeek(d); } catch(e){}
      const weekAtSuccession = d.week;
      A.takeUpTheHouse(d);
      /* `succeed` stamps tookHouse on the OLD d.domus.children array before wiping d.domus for the
         new lanista, and only a bare count of that array survives into d.forebears — so the stamp
         has to be read off the same object reference `withKid` already handed back, not off a
         fresh domusOf(d) lookup after succession (which is the new, empty domus). */
      const mtrNow = A.activeG(d).find(g=>g.id===mentor.id);
      arm4 = { newLanName: d.lanista.name, expectName: heirName, tookHouse: c.tookHouse, weekAtSuccession,
        fame: d.fame, expectFame: Math.round(fameBefore * A.HEIRS.son.fameKeep),
        mentorMoraleUp: mtrNow ? mtrNow.morale > mentorBefore.morale : null,
        mentorRegardUp: mtrNow ? A.regardOf(mtrNow) > mentorBefore.regard : null };
      if(arm4.newLanName !== heirName) bad.push(`the new lanista is "${arm4.newLanName}", not the named heir "${heirName}"`);
      if(c.tookHouse !== weekAtSuccession) bad.push(`succession did not stamp tookHouse on the real son's own record (got ${c.tookHouse}, expected ${weekAtSuccession})`);
      if(Math.abs(arm4.fame - arm4.expectFame) > 1)
        bad.push(`a son heir kept ${arm4.fame} fame, HEIRS.son.fameKeep expects ${arm4.expectFame} — the son payout must stay son-scale, not scion-scale`);
      if(mtrNow && !(arm4.mentorMoraleUp && arm4.mentorRegardUp))
        bad.push(`the boy's own mentor (carried onto the heir in arm 1's shape) got no succession bonus — the mentor-bonus block should read d.heir.mentorId regardless of kind`); }

    /* ---- 5. the one real fallback: no son at all still yields a valid heir ---- */
    let arm5 = null;
    { const d = house();   /* no domus.children at all */
      const elig = A.heirEligible(d);
      const ok = A.nameHeir(d, "son");
      arm5 = { elig, ok, heirName: d.heir && d.heir.name, heirCid: d.heir && d.heir.cid };
      if(elig.includes("son")) bad.push(`a childless house is offered "son" in heirEligible`);
      if(!ok || !arm5.heirName) bad.push(`nameHeir(d,"son") on a childless house failed to produce any heir at all`);
      if(arm5.heirCid != null) bad.push(`a fabricated fallback heir carries a cid (${arm5.heirCid}) — it should point at nobody`); }

    return { bad, arm1, arm2, arm3, arm4, arm5 };
  });

  bad.push(...r.bad);

  lines.push(`arm 1 — one real son: eligible ${r.arm1.elig.join("/")} · named "${r.arm1.heirName}" `
    + `(the real boy is "${r.arm1.realName}") · cid ${r.arm1.heirCid} · traits [${(r.arm1.heirTraits||[]).join(",")}] `
    + `· mentor ${r.arm1.heirMentor}`);
  lines.push(`arm 2 — two sons, oldest ${r.arm2.sonsOrder.join(",")}: by elder's cid → "${r.arm2.byCidElder}" `
    + `· by younger's cid → "${r.arm2.byCidYounger}" · no cid (default) → "${r.arm2.byDefault}" `
    + `(elder is "${r.arm2.elderName}", younger is "${r.arm2.youngerName}")`);
  lines.push(`arm 3 — stale cid: named "${r.arm3.heirName}" (the real boy is "${r.arm3.realName}"), cid ${r.arm3.heirCid}`);
  lines.push(`arm 4 — succession: new lanista "${r.arm4.newLanName}" (named "${r.arm4.expectName}") `
    + `· tookHouse stamped week ${r.arm4.tookHouse} · fame ${r.arm4.fame}/${r.arm4.expectFame} (son-scale) `
    + `· mentor bonus: morale up ${r.arm4.mentorMoraleUp}, regard up ${r.arm4.mentorRegardUp}`);
  lines.push(`arm 5 — no son at all: eligible ${r.arm5.elig.join("/")} · nameHeir("son") still names `
    + `"${r.arm5.heirName}" with cid ${r.arm5.heirCid} (the deliberate fallback, not a crash)`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
