/* SHE WAS NEVER HIS WIFE — #257.

   (`matron` was free in BOTH directories; checked before writing, in checks and probes.)

   `HOUSEHOLD.wife` was called "The lanista's wife". `d.domus.wife` is somebody else — a woman the
   lanista marries at a median of week 22 through `resolveMatch`, with her own name and family, and
   since #243 three standing ties, a fever that can kill her and two conversations of her own.

   MEASURED (`probes/matron.mjs`, 16 x 420) before anything was touched:

     · the household slot is taken in **16 of 16 houses at week 19** — free, and before the
       matchmakers ever call;
     · **both women stand on 78.7% of played weeks**;
     · both names come out of `HH_NAMES`, so **311 of those 2,371 weeks showed the SAME NAME twice**,
       once as "the lanista's wife" in the household panel and once as "your wife" on the blood one;
     · `marryReady` asks only `!domusOf(d).wife`, so a house with her standing in it was told *"a man
       alone at the head of a ludus leaves nothing behind but a ledger"* on **88%** of the weeks the
       match was open, and **97.4%** in a house that never marries;
     · and she was worth MORE lanista health than the wife he married — 0.344 a week against 0.168.

   THE FIX IS THAT SHE IS NOT A WIFE, which is what every word of her own entry already said: here
   before the ludus, opinions about all of it, "she has always been here", free, and she never leaves
   — `householdWeek`'s quitting clause is gated past her. That is somebody who belongs to the VILLA,
   and it survives a succession, which a wife deliberately does not (`succeed` resets `d.domus` and
   leaves `d.household` alone). The KEY stays `wife` because it is saved state; `HH_FREE` is what the
   code says now.

   FIVE ARMS. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "matron";
export const describe = "the free household slot is not the lanista's wife, and the two women never share a name";

export async function run({ p }){
  const lines = [], bad = [];
  await found(p, { seed:"MAT-1" });
  await clearAll(p, 10);
  await installRope(p);

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["newGameState","HOUSEHOLD","HH_FREE","HH_KEYS","HH_NAMES","hireFolk","hasFolk",
                  "houseFolk","hhWage","hhSkill","householdWeek","domusOf","marryReady","matchEvent",
                  "resolveMatch","succeed","nameHeir","heirEligible"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const FREE = A.HH_FREE;

    let tick = 0;
    const mk = (o) => { o = o || {};
      const d = A.newGameState("Mat", "clean", `MAT-${tick++}`, null);
      d.week = 200; d.fame = 400; d.gold = 60000;
      if(o.folk !== false) for(const k of A.HH_KEYS) A.hireFolk(d, k);
      if(o.wed){ const dm = A.domusOf(d);
        dm.wife = { name:o.wed === true ? "Prima Vettia" : o.wed, family:"the Vettii",
          married:100, age:24, from:"merchant" }; }
      return d; };

    /* ---- 1: SHE IS NOT CALLED A WIFE ANYWHERE THE PLAYER READS ---- */
    const H = A.HOUSEHOLD[FREE];
    const said = [H.name, H.blurb, H.line || ""].join(" | ");
    const wifeish = /\bwife\b|\bmarried\b|\bwed\b/i.test(said);
    const other = A.HH_KEYS.filter(k=>k!==FREE).map(k=>A.HOUSEHOLD[k].name);

    /* ---- 2: AND THE TWO WOMEN NEVER SHARE A NAME ---- */
    const clash = (()=>{ let cards = 0, names = 0, hit = 0, pool = 0;
      for(let t=0;t<120;t++){ const d = mk();
        const have = new Set(Object.values(A.houseFolk(d)).map(f=>f.name));
        pool += have.size;
        const ev = A.matchEvent(d); if(!ev) continue;
        cards++;
        for(const c of (ev.data && ev.data.cands) || []){ names++; if(have.has(c.who)) hit++; } }
      return { cards, names, hit, pool, poolSize:(A.HH_NAMES||[]).length }; })();

    /* ---- 3: SHE IS FREE, SHE DOES NOT LEAVE, AND SHE BELONGS TO THE HOUSE ---- */
    const stays = (()=>{ const d = mk();
      const g0 = d.gold; const again = A.hireFolk(d, FREE);       /* already there: no second one */
      const fee = A.hhWage(d, FREE);
      /* a house coming apart: the others go, she does not */
      const bad = mk(); bad.unrest = 95; bad.gold = -400;
      for(const f of Object.values(A.houseFolk(bad))) f.weeks = 40;
      const before = Object.keys(A.houseFolk(bad)).length;
      for(let i=0;i<200;i++) try { A.householdWeek(bad); } catch(e){ break; }
      const after = Object.keys(A.houseFolk(bad));
      /* and a succession keeps her while it empties the domus */
      const suc = mk({ wed:true });
      suc.lanista.age = 60; suc.generation = 1;
      const kinds = A.heirEligible(suc) || [];
      const named = kinds.length ? A.nameHeir(suc, kinds[0]) : false;
      let took = false; try { took = A.succeed(suc); } catch(e){}
      return { again, fee, wage:A.HOUSEHOLD[FREE].wage, spent:g0 - d.gold,
        before, afterN:after.length, stillThere:after.includes(FREE), afterKeys:after.join("+"),
        named:!!named, took:!!took, gen:suc.generation,
        wifeAfter: !!A.domusOf(suc).wife, matronAfter: A.hasFolk(suc, FREE) }; })();

    /* ---- 4: AND THE MATCH IS NOT GATED ON HER, WHICH IS THE POINT ---- */
    const match = (()=>{ const withHer = mk(), without = mk({ folk:false });
      const bothWed = mk({ wed:true });
      return { withHer:A.marryReady(withHer), without:A.marryReady(without),
        wed:A.marryReady(bothWed), hasHer:A.hasFolk(withHer, FREE) }; })();

    /* ---- 5: AND THE MECHANIC IS UNTOUCHED ---- */
    const worth = (()=>{ const d = mk();
      const f = A.houseFolk(d)[FREE];
      d.lanista.health = 50;
      const before = d.lanista.health;
      A.HOUSEHOLD[FREE].good(d, f);
      return { skill:f.skill, gain:+(d.lanista.health - before).toFixed(4),
        want:+(0.35 * A.hhSkill(f)).toFixed(4) }; })();

    return { name:H.name, said, wifeish, other, clash, stays, match, worth, free:FREE };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };
  const { clash, stays, match, worth } = out;

  /* 1 */
  lines.push(`the free slot is "${out.name}" (key \`${out.free}\`, which is saved state) beside ${out.other.join(", ")}`);
  if(out.wifeish)
    bad.push(`the free household slot still calls itself a wife — "${out.said.slice(0,110)}" — and \`d.domus.wife\` is a different woman `
      + `standing on 78.7% of the same weeks, with her own name on the next panel`);
  if(/wife/i.test(out.name)) bad.push(`its displayed name is "${out.name}"`);

  /* 2 */
  lines.push(`${clash.cards} match cards, ${clash.names} candidate names against a household of ${Math.round(clash.pool/120)} out of ${clash.poolSize} — collisions ${clash.hit} [measured 311 of 2,371 both-standing weeks before the pools were split]`);
  if(!clash.cards) bad.push(`no match card was raised in 120 driven houses, so arm 2 is inert`);
  if(clash.hit > 0)
    bad.push(`${clash.hit} of ${clash.names} candidate wives were offered under a name already standing in the household — `
      + `both are drawn from \`HH_NAMES\`, and the same name on two panels of one screen is what this item was about`);

  /* 3 */
  lines.push(`free and permanent: fee ${stays.spent}d, wage ${stays.wage}d, a second hire returns ${stays.again} · a house at unrest 95 and −400d for 200 weeks kept ${stays.afterN} of ${stays.before} folk (${stays.afterKeys})`);
  if(stays.spent !== 0) bad.push(`taking her on cost ${stays.spent}d — she is the free one`);
  if(stays.again) bad.push(`\`hireFolk\` took her on a second time`);
  if(!stays.stillThere)
    bad.push(`she walked out of a house at unrest 95 and −400 denarii — \`householdWeek\`'s quitting clause is gated past her, `
      + `and "she has always been here" is the whole of what she is`);
  if(stays.afterN >= stays.before) bad.push(`nobody at all left a house at unrest 95 and −400d, so the arm proves nothing about her`);
  if(stays.took){
    lines.push(`   and a succession: generation ${stays.gen} · the domus wife after ${stays.wifeAfter} · the matron after ${stays.matronAfter}`);
    if(stays.wifeAfter) bad.push(`\`succeed\` handed the next man the dead man's wife — \`checks/domus.mjs\` holds that ground too`);
    if(!stays.matronAfter) bad.push(`\`succeed\` emptied the household of the woman who was here before any of them — she belongs to the villa, not the man, which is the whole reason she is not a wife`);
  } else lines.push(`   (the succession sub-test did not run: named ${stays.named}, took ${stays.took})`);

  /* 4 */
  lines.push(`the match: open with her in the household ${match.withHer} · without her ${match.without} · with a wife already ${match.wed}`);
  if(!(match.hasHer && match.withHer))
    bad.push(`\`marryReady\` is false for a house that has the matron (${match.withHer}) — she is not a wife and must not gate the marriage, `
      + `which is taken in 14 of 16 houses at a median of week 22`);
  if(match.wed) bad.push(`\`marryReady\` is true for a house that already has a wife`);

  /* 5 */
  lines.push(`the mechanic is untouched: skill ${worth.skill} gives ${worth.gain} lanista health a week, wanted ${worth.want} [measured p50 0.356 in play]`);
  if(Math.abs(worth.gain - worth.want) > 0.001)
    bad.push(`her weekly health is ${worth.gain} against the ${worth.want} \`0.35 * hhSkill\` sets — #257 renamed her and changed nothing about what she does`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
