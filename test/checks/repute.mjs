/* THE NAME CAPUA SETTLES ON, AND THE CAP THAT WAS SWITCHING IT OFF — #159

   `chair` holds that each of the four names is EARNABLE by a house that goes after it, over arms of
   ten houses that chase one deliberately. That is the right shape for "can it be got" and it cannot
   see the thing below it: what happens to a house that simply keeps playing.

   Four tallies, each fed by ordinary weeks, each clamped, all decaying together at REP_DECAY. A
   tally settles at `inflow / (1 − REP_DECAY)`, so with the clamp at 120 every kind a rounded house
   feeds at more than 1.8 a week ends up sitting on it. And then the arithmetic closes the system:

       with the other three at a cap C, the leader needs 3C·s/(1−s) to hold share s
       SETTLE 0.36 → 202.5      KEEP 0.30 → 154.3      and the cap was 120

   Both above the cap. So a house whose other three tallies saturate MUST lose its name, and can
   never win another — not unlikely, arithmetically. Measured over 30 houses of 420 weeks with the
   ledger held up (the long-lived arm, where saturation is reached):

       the town had no name for it at all       72.3% of 10,878 house-weeks
       it said "blood" or "show"                0 weeks
       it changed its mind                      0 times, while dropping a name 32
       `hard` earned                            0 houses of 60 across both arms
       `merciful` earned                        1 of 30

   No threshold moved. REP_CAP is derived from the decay now — the equilibrium of a house earning
   REP_CAP_RATE of one kind every week for ever — which puts it clear of anything ordinary play
   reaches (232.5 was the most any of thirty long-lived houses ever put on one kind with the cap
   lifted entirely). Paired on the same seeds, control first: the nameless share falls 72.3% → 18.4%
   with the ledger held up and 23.1% → 6.3% in ordinary play, median life 56 weeks either way, and
   `open`'s 60-house signature is identical because the cap cannot bind inside 26 weeks.

   WHAT THIS CHECK HOLDS:
     1. THE CAP MUST NOT BE THE THING SHAPING THE NAME. A house driven to equilibrium with a leader
        genuinely ahead of the pack must end up named. This is the bar that fails on the old cap.
     2. The derivation itself, so REP_CAP cannot drift back to a written-down number.
     3. All five constants bind — floor, settle, keep, take, and the drop when nobody replaces it.
     4. The readers agree: `repTotal`, `repShare`, `repShareOf`, `repLeader`, `addRep`'s bounds.
     5. Each of the four names carries its patron and its effects, and `repWeek` pays that patron. */

import { hasHandle } from "../harness.mjs";

export const name = "repute";
export const describe = "the name Capua settles on survives a long campaign, and the cap does not decide it";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const mk = () => { const q = A.newGameState("Rp","clean","REPUTE",null); q.week = 10;
      q.rep = { blood:0, show:0, craft:0, mercy:0 }; q.repName = null; return q; };

    /* ---- 1. THE BAR THE OLD CAP FAILED: a long campaign must still have a name ----
       Driven through the game's own `addRep` and `repWeek`, week by week, at a steady inflow — a
       leader clearly ahead of three quiet kinds. Nothing here reconstructs the decay or the share;
       it feeds the functions and reads `repStyle`. */
    {
      const runTo = (lead, rest, weeks) => {
        const q = mk();
        for(let w=0; w<weeks; w++){
          A.addRep(q, "blood", lead);
          for(const k of ["show","craft","mercy"]) A.addRep(q, k, rest);
          q.week++; A.repWeek(q);
        }
        return { q, name:A.repStyle(q), share:+A.repShareOf(q,"blood").toFixed(3),
          rep:Object.fromEntries(A.REP_ORDER.map(k=>[k, +A.repOf(q,k).toFixed(1)])) };
      };
      const eq = 1 - A.REP_DECAY;
      for(const [lead, rest] of [[4, 2], [3, 1.5], [6, 2]]){
        const want = { lead:lead/eq, rest:rest/eq };
        const r = runTo(lead, rest, 500);
        lines.push(`a house earning ${lead} blood and ${rest} of each other, a week, for 500 weeks: `
          + `${A.REP_ORDER.map(k=>`${k} ${r.rep[k]}`).join(" · ")} · share ${r.share} → the town says `
          + `${r.name || "nothing in particular"}  (equilibrium would be ${want.lead.toFixed(0)}/${want.rest.toFixed(0)} uncapped)`);
        if(r.name !== "blood")
          bad.push(`a house that has earned ${lead} blood a week against ${rest} of everything else, for `
            + `five hundred weeks, is called "${r.name || "nothing in particular"}". Its share is ${r.share} `
            + `against a SETTLE of ${A.REP_SETTLE}. This is #159: with the other three sitting on the cap `
            + `the leader needs 3C·s/(1−s) = ${(3*A.REP_CAP*A.REP_SETTLE/(1-A.REP_SETTLE)).toFixed(1)} to be `
            + `named and ${(3*A.REP_CAP*A.REP_KEEP/(1-A.REP_KEEP)).toFixed(1)} to keep it, both past the cap `
            + `of ${A.REP_CAP} — so a house that keeps playing loses its name and can never win another`);
      }
      /* and the pack must not be sitting on the cap after a long campaign */
      const r = runTo(4, 2, 500);
      /* A TALLY HELD AT THE CAP SITS ONE WEEK'S DECAY BELOW IT, not on it: `repWeek` runs after
         `addRep`, so a clamped kind reads REP_CAP × REP_DECAY. The first draft of this bar tested
         `>= REP_CAP - 0.5` and read "0 of the four tallies are sitting on the cap of 120" on the
         very build the check was written to fail — a bar that could not see the thing beside it. */
      const held = A.REP_CAP * A.REP_DECAY - 0.5;
      const onCap = A.REP_ORDER.filter(k=>r.rep[k] >= held);
      lines.push(`after five hundred weeks, ${onCap.length} of the four tallies are held at the cap of ${A.REP_CAP} `
        + `(which reads ${(A.REP_CAP*A.REP_DECAY).toFixed(1)} after the week's decay)`);
      if(onCap.length >= 3)
        bad.push(`${onCap.length} of the four tallies sit on the cap of ${A.REP_CAP} after a long campaign `
          + `(${onCap.join(", ")}). A cap that binds three kinds makes the share arithmetic degenerate — `
          + `the leader's share tends to a quarter and no threshold above that can ever be met`);
    }

    /* ---- 2. THE CAP IS DERIVED, NOT WRITTEN DOWN ---- */
    {
      const want = Math.round(A.REP_CAP_RATE / (1 - A.REP_DECAY));
      lines.push(`the cap is ${A.REP_CAP} = ${A.REP_CAP_RATE} a week / (1 − ${A.REP_DECAY}), the equilibrium of a house doing nothing else`);
      if(A.REP_CAP !== want)
        bad.push(`REP_CAP is ${A.REP_CAP} against ${A.REP_CAP_RATE}/(1−${A.REP_DECAY}) = ${want} — the cap is the `
          + `equilibrium of a stated inflow on purpose, so that it bounds pathology and never shapes the name`);
      const needSettle = 3*A.REP_CAP*A.REP_SETTLE/(1-A.REP_SETTLE);
      lines.push(`with the other three on the cap the leader would need ${needSettle.toFixed(1)} to be named — `
        + `above the cap, which is why the cap must never bind three kinds at once`);
    }

    /* ---- 3. ALL FIVE CONSTANTS BIND ---- */
    {
      const at = rep => { const q = mk(); q.rep = { blood:0, show:0, craft:0, mercy:0, ...rep };
        q.repName = null; A.repSettle(q); return q; };
      const after = (first, then) => { const q = at(first); A.repSettle(q);
        q.rep = { blood:0, show:0, craft:0, mercy:0, ...then }; A.repSettle(q); return q; };
      const rows = [];
      const push = (nm, q, want) => { const got = A.repStyle(q);
        rows.push(`${nm.padEnd(50)} → ${got || "nothing in particular"}`);
        if(got !== want) bad.push(`${nm}: the town says "${got || "nothing in particular"}" and should say "${want || "nothing in particular"}"`); };
      push(`one point under the floor of ${A.REP_FLOOR}`, at({ blood:A.REP_FLOOR - 1 }), null);
      push(`exactly at the floor`,                        at({ blood:A.REP_FLOOR }), "blood");
      push(`loudest but under SETTLE ${A.REP_SETTLE}`,    at({ blood:30, show:29, craft:29, mercy:29 }), null);
      push(`loudest and half the tally`,                  at({ blood:60, show:20, craft:20, mercy:20 }), "blood");
      push(`held at 32% — under SETTLE, over KEEP ${A.REP_KEEP}`,
           after({ blood:60, show:20, craft:20, mercy:20 }, { blood:32, show:30, craft:19, mercy:19 }), "blood");
      push(`another gets clear of it`,
           after({ blood:60, show:20, craft:20, mercy:20 }, { blood:20, show:45, craft:18, mercy:17 }), "show");
      push(`it falls away and nobody replaces it`,
           after({ blood:60, show:20, craft:20, mercy:20 }, { blood:20, show:26, craft:26, mercy:26 }), null);
      push(`a challenger one point clear, under TAKE ${A.REP_TAKE}`,
           after({ blood:60, show:20, craft:20, mercy:20 }, { blood:37, show:38, craft:13, mercy:12 }), "blood");
      for(const r of rows) lines.push(`   ${r}`);
    }

    /* ---- 4. THE READERS AGREE WITH EACH OTHER ---- */
    {
      const q = mk(); q.rep = { blood:40, show:30, craft:20, mercy:10 };
      const tot = A.repTotal(q);
      if(tot !== 100) bad.push(`\`repTotal\` reads ${tot} for 40/30/20/10`);
      for(const k of A.REP_ORDER){
        if(Math.abs(A.repShare(q,k) - A.repOf(q,k)/tot) > 1e-9)
          bad.push(`\`repShare\` and \`repOf\`/\`repTotal\` disagree on ${k}`);
        if(Math.abs(A.repShareOf(q,k) - A.repShare(q,k)) > 1e-9)
          bad.push(`\`repShareOf\` and \`repShare\` are two names for one thing and disagree on ${k}`);
      }
      const L = A.repLeader(q);
      if(L.key !== "blood" || Math.abs(L.share - 0.4) > 1e-9)
        bad.push(`\`repLeader\` says ${L.key} at ${L.share} for 40/30/20/10`);
      const low = mk(); low.rep = { blood:A.REP_FLOOR - 1, show:0, craft:0, mercy:0 };
      if(A.repLeader(low).key !== null)
        bad.push(`\`repLeader\` names ${A.repLeader(low).key} for a house the town has not noticed (under the floor of ${A.REP_FLOOR})`);
      const c = mk(); A.addRep(c, "blood", A.REP_CAP * 3);
      if(A.repOf(c,"blood") !== A.REP_CAP) bad.push(`\`addRep\` does not clamp at REP_CAP: ${A.repOf(c,"blood")}`);
      A.addRep(c, "blood", -A.REP_CAP * 3);
      if(A.repOf(c,"blood") !== 0) bad.push(`\`addRep\` does not floor at nought: ${A.repOf(c,"blood")}`);
      const w = mk(); w.rep = { blood:100, show:0, craft:0, mercy:0 }; w.repName = null;
      A.repWeek(w);
      if(Math.abs(A.repOf(w,"blood") - 100*A.REP_DECAY) > 1e-6)
        bad.push(`\`repWeek\` decayed 100 to ${A.repOf(w,"blood")} against REP_DECAY ${A.REP_DECAY}`);
      lines.push(`the readers agree, \`addRep\` holds 0..${A.REP_CAP}, and a week decays a tally by ${((1-A.REP_DECAY)*100).toFixed(1)}%`);
    }

    /* ---- 5. EACH NAME CARRIES ITS PATRON AND ITS PRICE ---- */
    {
      for(const k of A.REP_ORDER){
        const K = A.REP_KINDS[k], E = (A.REP_EFFECTS||{})[k];
        if(!K || !K.name || !K.line || !K.patron) bad.push(`REP_KINDS.${k} is missing a name, a line or a patron`);
        if(!E || !E.length) bad.push(`REP_KINDS.${k} is a name with nothing listed under it — the panel prints REP_EFFECTS`);
      }
      /* and the week pays the patron the name courts */
      const q = mk(); q.rep = { blood:60, show:20, craft:20, mercy:20 }; q.repName = null;
      A.repSettle(q);
      const rank = A.REP_KINDS.blood.patron;
      const pt = A.patronsOf(q).find(x=>x.rank===rank);
      if(!pt) lines.push(`(no ${rank} on this house to pay — the patron term is not testable here)`);
      else { const was = pt.favor; A.repWeek(q);
        const now = (A.patronsOf(q).find(x=>x.rank===rank)||{}).favor;
        lines.push(`a butcher's ${rank} went ${was.toFixed(1)} → ${now.toFixed(1)} in one week`);
        if(!(now > was)) bad.push(`the town calls the house butchers and its ${rank} gained nothing`); }
      const u = mk(); u.rep = { blood:60, show:20, craft:20, mercy:20 }; u.repName = null; A.repSettle(u);
      const un0 = u.unrest; A.repWeek(u);
      if(!(u.unrest > un0)) bad.push(`a butcher's cells went ${un0} → ${u.unrest} — the blood name is supposed to cost unrest`);
      const m = mk(); m.rep = { mercy:60, show:20, craft:20, blood:20 }; m.repName = null; A.repSettle(m);
      const mu0 = m.unrest; A.repWeek(m);
      if(!(m.unrest < mu0)) bad.push(`a merciful house's cells went ${mu0} → ${m.unrest} — mercy is supposed to settle them`);
      lines.push(`the four names: ${A.REP_ORDER.map(k=>`${k} courts a ${A.REP_KINDS[k].patron} (${(A.REP_EFFECTS[k]||[]).length} effects)`).join(" · ")}`);
    }

    return { bad, lines };
  });

  out.lines.push(`MEASURED IN PLAY, recorded not barred: 30 houses x 420w on three seed prefixes, paired on `
    + `the same seeds with the control first. The town has no name for the house 23.1% of weeks in `
    + `ordinary play and 72.3% with the ledger held up under the old cap of 120; 6.3% and 18.4% under `
    + `the derived one. It said "blood" or "show" for nought weeks of 10,878 in the long-lived arm `
    + `either way — that is the reference player's policy and not the machinery, and \`chair\` shows a `
    + `house that chases \`show\` holding it 824 weeks of 917. \`merciful\` is earned by 21 of 30 played `
    + `houses and \`hard\` by none of sixty, which wants fifteen straight weeks of the blood name. `
    + `Median life 56 weeks either way, and \`open\`'s 60-house signature is identical. See the roadmap.`);

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
