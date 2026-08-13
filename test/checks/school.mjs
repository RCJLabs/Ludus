/* THE SIX SCHOOLS OF THE HOUSE — LIVE, CORRECT, AND NEVER ONCE DECLARED.

   `DOCTRINES` holds six schools — scutum, parma, blood, craft, mercy, road — each with a price, a
   creed, faction moves and a table of multipliers that the fight engine and the week read through
   `docNum` and `docIs`. `declareDoctrine(d, key)` is a paid action on the villa tab.

   MEASURED: `d.doctrine` was non-null in **0 of roughly 5,000 house-weeks** across three sweeps,
   including one that hired the doctore, built all five rooms to level 4, hired the medicus and the
   armourer, swore 249 vows, claimed the census to rung 7 and made 22 imperial campaigns. Nothing in
   the game surfaces the choice, so a competent player never makes it. v2.93.0 adds the nudge.

   AND THE SYSTEM ITSELF IS SOUND, which had to be established BEFORE pointing players at it — a
   signpost to a broken feature is worse than no signpost. All six declare, all six charge their
   listed price, changing costs the new school's price × 1.8, every numeric field reads back through
   `docNum` exactly, `docIs` answers on the key, and every faction moves the way its table says.

   TWO FAULTS IN THE MEASUREMENT, BOTH MINE, both fixed here and worth keeping because they are the
   same fault twice:
     1. I tested `docIs(d, D.tag)` and got false for scutum, parma and road. `docIs` compares
        `d.doctrine.key`, not the tag — and blood, craft and mercy happen to have key === tag, so
        three passed and three "failed". A predicate tested through the wrong field looks like a
        broken feature in exactly the cases where the two names differ.
     2. I checked a HARDCODED list of multiplier names and reported "The Travelling School names no
        multipliers". It names four — `knownMult`, `strangeCut`, `travelCut`, `capuaDecay` — none of
        which were in my list. So this check DERIVES the field list from each doctrine's own entry,
        and cannot fall behind the data the way I did.

   THE CAREER COMPARISON IS GONE, NOT MERELY UNASSERTED — and saying so is the point of this
   paragraph, because in v3.12.0 an audit item was raised reading "the doctrine career comparison is
   still held to nothing", off the first line of this note and not the rest of it. There is no career
   arm in this check to hold to anything: v3.0.0 replaced it with the per-field pricing below, which IS
   asserted, at the one or four places each field is read. What follows is the history of why.

   It was twelve seeds run with no doctrine and then with craft, blood and mercy, printed and held to
   nothing, because a doctrine changes the trajectory of the house and so confounds any outcome
   measured over a career. `blood` promises purses ×1.18 and
   delivered 374d a bout against 530d with no doctrine, which reads like an inversion and is not one:
   it also adds 0.16 to the odds of sine missione, so the house fights deadlier cards, loses more men,
   and earns smaller purses at a lower tier.

   AND v3.0.0 FINISHED THE MEASUREMENT THIS NOTE ASKED FOR. Each field is read in exactly one or four
   places, so each can be priced at its own site with everything else held still:

     purse      14088  the bout's purse             injure     15565  the training week's injury risk
     missio     14020  the simCtx handed to the sim regard     15604  the weekly regard drift
     fameMult   14100  the bout's fame              knownMult   9464  renown gained down the coast
     strangeCut 14020  the missio penalty away      health     13302 +3  the lanista, per death
     train      15551  the training week            gear        8699  what a piece costs

   Measured, on one HELD card for the purse and one man on one stat for the training:
     blood  purse 1.18 → **1.179** · health 0.7 as a DIVISOR → **1.429** (1/0.7 = 1.4286)
     craft  train 1.12 → **1.1194** · injure 0.7 → 0.55, and 40 injuries against 22 over 1,800 weeks
            an arm carries an error of ±0.14 on that ratio, so it is consistent and n is too small to
            separate 0.55 from 0.7 · purse 0.9 → **0.968**
   So the multipliers are right where they are read, and the v2.93.0 inversion was entirely the career.

   TWO THINGS WORTH KEEPING FROM GETTING THERE. `craft`'s purse measured 0.968 against a listed 0.90
   because `facPurse` reads the factions, and craft moves front +20 / mob −14 — the school's own faction
   move gives back three quarters of the discount it advertises. Both halves are advertised; the note
   is what reads as a net figure and is not one. And `injure` first measured 1.00x and looked dead: my
   arm counted BOUT injuries and `docInjure` is read in the training week, and the arm before that set
   `regimen:"spar"` without pairing anybody, so `repairSpar` turned every week into post work and
   nothing was ever at risk at all. `train` first measured 1.002 because four men at 66 over forty
   weeks had capped out in both arms.

   AND THERE ARE TWO `blood`s, which is a trap this check now names. The DOCTRINE (`DOCTRINES.blood`,
   The Red School, purse 1.18) and the STAKES (`offer.stakes === "blood"`, first blood). Priced on one
   bout each at the same seeds, first blood pays 129d against a standard bout's 192d, kills nobody at
   all against 6.5%, and leaves a man hurt 1.0% of the time against 17.5%. That is the stakes. The
   audit item was about the school. */

import { hasHandle } from "../harness.mjs";

export const name = "school";
export const describe = "all six doctrines declare, charge, and are read back by the engine that uses them";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const KEYS = Object.keys(A.DOCTRINES || {});
    if(!KEYS.length) return { bad:["`DOCTRINES` is empty or not on the handle"], lines };

    /* the prose fields; everything else in an entry is mechanism and must be readable */
    const PROSE = new Set(["name","cost","tag","creed","body","note","likes","fac","gear","rep"]);

    for(const k of KEYS){
      const D = A.DOCTRINES[k];
      const d = A.newGameState("Sc", "clean", `SCHOOL-${k}`, null);
      d.gold = 50000;
      const fac0 = Object.assign({}, d.factions);
      const gold0 = d.gold;

      const took = A.declareDoctrine(d, k) === true;
      const paid = gold0 - d.gold;
      if(!took){ bad.push(`\`declareDoctrine\` refused "${k}" with 50,000d in the box`); continue; }
      if(paid !== D.cost)
        bad.push(`declaring "${k}" charged ${paid}d and its table says ${D.cost}d`);

      /* DERIVED, not hardcoded — see this check's head for why */
      const fields = Object.keys(D).filter(f => !PROSE.has(f) && typeof D[f] === "number");
      const readBack = fields.map(f => ({ f, want:D[f], got:A.docNum(d, f, null) }));
      const blind = readBack.filter(x => x.got !== x.want);
      if(blind.length)
        bad.push(`"${k}" declares ${blind.map(x=>`${x.f} ${x.want}`).join(", ")} and \`docNum\` reads `
          + `${blind.map(x=>String(x.got)).join(", ")} — the engine cannot see what the table promises`);

      /* `docIs` answers on the KEY. Asserting it on the tag is the fault this check documents. */
      if(A.docIs(d, k) !== true)
        bad.push(`\`docIs(d, "${k}")\` is false with "${k}" declared — every engine call that gates on `
          + `a school (\`docIs(d,"mercy")\` in the bout) reads this and would miss`);
      if(D.tag && D.tag !== k && A.docIs(d, D.tag) === true)
        bad.push(`\`docIs\` answers to the TAG "${D.tag}" as well as the key — it compares `
          + `\`d.doctrine.key\`, and if that has changed the two names are now interchangeable`);

      const facs = Object.entries(D.fac || {}).map(([f,n]) => {
        const moved = Math.round((d.factions[f]||0) - (fac0[f]||0));
        return { f, want:n, moved };
      });
      const stuck = facs.filter(x => x.moved === 0 || Math.sign(x.moved) !== Math.sign(x.want));
      if(stuck.length)
        bad.push(`"${k}" says it moves ${stuck.map(x=>`${x.f} by ${x.want}`).join(", ")} and the `
          + `factions went ${stuck.map(x=>x.moved).join(", ")}`);

      lines.push(`${D.name.padEnd(24)} ${String(D.cost).padStart(4)}d · ${fields.length} mechanical fields, all read back`
        + ` · docIs on the key: true` + (facs.length ? ` · factions ${facs.map(x=>`${x.f} ${x.moved>0?"+":""}${x.moved}`).join(" ")}` : " · no faction move"));

      /* and changing schools costs the NEW one's price times 1.8 */
      const alt = KEYS.find(x => x !== k);
      const g1 = d.gold;
      const swapped = A.declareDoctrine(d, alt) === true;
      const swapCost = g1 - d.gold;
      const wantSwap = Math.round(A.DOCTRINES[alt].cost * 1.8);
      if(!swapped) bad.push(`could not change from "${k}" to "${alt}" with ${g1}d in hand`);
      else if(swapCost !== wantSwap)
        bad.push(`changing from "${k}" to "${alt}" cost ${swapCost}d and 1.8x the new school's price is ${wantSwap}d`);
    }

    /* ---- AND THE REASON THIS CHECK EXISTS: does the week actually SAY so? ----
       This section was wrong twice before it was right, and the second time is worth more than the
       first. It began by grepping `String(A.agendaCan)` for the word "doctrine" — reading source text
       to find out what a program does, which is the same mistake as reading a comment to find out what
       a generator draws. Then it DROVE `agendaCan` and still saw nothing, because **`agendaCan` is not
       the agenda.** It is one of four contributors — `agendaCan`, `agendaSquare`, `agendaSchool`,
       `agendaGods` — and `agenda(d)` is the aggregator that calls them all and returns the list. A
       check that drives `agendaCan` alone sees a fragment of the week's advice and reports the rest as
       missing. (Worth knowing for #119, which measured the feast's offer through `agendaCan`.)
       So this drives `agenda(d)`, which is what the panel renders. */
    {
      const d = A.newGameState("Sa", "clean", "SCHOOL-AGENDA", null);
      d.week = 30; d.gold = 6000;                    /* past the opening, and able to pay for one */
      /* `agenda(d)` returns [{urgency, tab, label, sub}] — `label`, not `title` */
      const says = (st) => { try { return A.agenda(st) || []; }
        catch(e){ return [{ label:"THREW: " + e.message }]; } };

      const before = says(d);
      const hit = before.find(i => /teaches no particular thing/i.test(i.label || ""));
      lines.push(`a house at week 30 with 6,000d in the box is told about the school: ${hit ? "yes" : "NO"}`
        + (hit ? `  — "${hit.label}" · ${hit.sub}` : ""));
      if(!hit)
        bad.push(`the week's agenda never mentions the school of the house. Six doctrines, each with a `
          + `price and a table of multipliers the fight engine reads, and \`d.doctrine\` was non-null in `
          + `0 of ~5,000 measured house-weeks. A system a competent player never finds is not a choice`);

      /* and it must go quiet once a school is declared, or it becomes another standing item */
      A.declareDoctrine(d, KEYS[0]);
      const after = says(d);
      if(after.find(i => /teaches no particular thing/i.test(i.label || "")))
        bad.push(`the agenda still asks for a doctrine after one has been declared — that is a standing `
          + `item on the villa tab, which is the fault #101 spent a release measuring`);

      /* and it must NOT nag a house that cannot afford one */
      const poor = A.newGameState("Sp", "clean", "SCHOOL-POOR", null);
      poor.week = 30; poor.gold = 120;
      const pItems = says(poor);
      if(pItems.find(i => /teaches no particular thing/i.test(i.label || "")))
        bad.push(`a house with 120d is being asked to buy a 300d philosophy — advice that arrives when `
          + `it cannot be taken is the \`agendaCan\` fault #119 already priced`);
      lines.push(`a house with 120d is left alone about it: ${!pItems.find(i=>/teaches no particular/i.test(i.label||"")) ? "yes" : "NO"}`);
    }

    /* ---- AND WHAT THE TABLES ARE WORTH AT THEIR OWN CALL SITES, from v3.0.0 ----
       This is the measurement the note at the head of this check asked for and did not take. Each of
       the three cells holds everything but the school still, so the listed number is the only thing
       that can move the outcome. */
    {
      const R = window.__ROPE;
      const S = A.STATS;
      const declare = (seed, key) => { const d = A.newGameState("Sd","clean",seed,null);
        d.fame = 900; d.gold = 60000; d.week = 40;
        if(key) A.declareDoctrine(d, key);
        d.gold = 60000;                                  /* the fee out of the comparison */
        return d; };

      /* 1. THE PURSE, on a card held identical between the arms so `sineOdds` cannot act */
      const purseArm = (key, N) => {
        let ran = 0, purse = 0;
        for(let i=0;i<N;i++){
          const d = declare(`SCHOOL-P-${i}`, key);
          const g = A.clone(A.genGladiator(d, A.qForStat(74)));
          for(const k of S) g[k] = 74;
          g.kit = A.defaultKit(g.cls); g.morale = 70; g.pfame = 40; g.wins = 4; g.heart = 60;
          g.traits = []; g.status = "active"; g.injury = null; g.fatigue = 0; g.lastFought = -9;
          g.mine = true; g.id = d.nextId++;
          d.gladiators.push(g);
          const opp = A.clone(A.genOpponent(2, A.qForStat(74)));
          for(const k of S) opp[k] = 74;
          opp.kit = A.defaultKit(opp.cls); opp.morale = 70; opp.pfame = 40; opp.wins = 4;
          opp.heart = 60; opp.traits = [];
          const o = { id:d.nextId++, tier:2, festival:"a bench", opp, oppRef:null, rematch:false,
            grudgeM:false, stakes:"standard", purse:1000 };
          d.games = { festival:"a bench", offers:[o], week:d.week };
          const g0 = d.gold;
          const t = R.run(d, o, [g.id], { tactic:"measured", choice:"press" });
          if(!t.ran || !t.res) continue;
          ran++; purse += d.gold - g0;
        }
        return ran ? purse/ran : 0;
      };
      const P0 = purseArm(null, 90), PB = purseArm("blood", 90);
      const gotP = P0 ? PB/P0 : 0, wantP = A.DOCTRINES.blood ? A.DOCTRINES.blood.purse : 1;
      lines.push(`the purse on a HELD card: ${P0.toFixed(0)}d with no school, ${PB.toFixed(0)}d under `
        + `the Red School → ${gotP.toFixed(3)}x against a listed ${wantP}`);
      if(Math.abs(gotP - wantP)/wantP > 0.10)
        bad.push(`the Red School's purse measured ${gotP.toFixed(3)}x on a card held identical between `
          + `the arms and its table says ${wantP} [measured 1.179]. \`docPurse\` is one factor of `
          + `fourteen at line 14088 — if it has stopped reaching the purse then the only number this `
          + `school advertises is not being paid`);

      /* 2. THE TRAINING, one man on one stat from 30, well clear of any ceiling */
      const trainArm = (key, N) => {
        let gain = 0, n = 0;
        for(let i=0;i<N;i++){
          const d = declare(`SCHOOL-T-${i}`, key);
          const g = A.genGladiator(d, A.qForStat(40)); g.id = d.nextId++;
          g.status = "active"; g.mine = true; g.kit = A.defaultKit(g.cls);
          for(const k of S) g[k] = 30;
          g.potential = 80; g.age = 22; g.injury = null; g.fatigue = 0; g.lastFought = -9;
          g.regimen = "palus"; g.focus = "str"; g.traits = []; g.protege = null; g.shiftWeeks = 0;
          d.gladiators.push(g);
          const before = g.str;
          for(let w=0; w<12; w++){ d.pendingEvent = null; d.gold = 60000;
            try { A.endWeek(d); } catch(e){ break; }
            const G = (d.gladiators||[]).find(x=>x.id===g.id); if(!G) break;
            G.fatigue = 0; G.injury = null; G.status = "active"; G.regimen = "palus"; G.focus = "str"; }
          const G = (d.gladiators||[]).find(x=>x.id===g.id) || g;
          gain += G.str - before; n++;
        }
        return n ? gain/n : 0;
      };
      const T0 = trainArm(null, 24), TC = trainArm("craft", 24);
      const gotT = T0 ? TC/T0 : 0, wantT = A.DOCTRINES.craft ? A.DOCTRINES.craft.train : 1;
      lines.push(`twelve weeks of the palus on one stat: +${T0.toFixed(2)} with no school, `
        + `+${TC.toFixed(2)} under the Long Apprenticeship → ${gotT.toFixed(3)}x against a listed ${wantT}`);
      if(Math.abs(gotT - wantT)/wantT > 0.08)
        bad.push(`the Long Apprenticeship's training measured ${gotT.toFixed(3)}x on one man, one stat, `
          + `twelve weeks and no ceiling in sight, and its table says ${wantT} [measured 1.1194]. The `
          + `first version of this measurement read 1.002 because four men at 66 had capped out in both `
          + `arms — check the ceiling before believing a flat result`);

      /* 3. THE LANISTA, per death of one of his men — a DIVISOR, so 0.7 costs him 1/0.7 */
      const healthArm = (key, N) => {
        let lost = 0, deaths = 0;
        for(let i=0;i<N;i++){
          const d = declare(`SCHOOL-H-${i}`, key);
          if(!d.lanista) d.lanista = A.makeLanista(d);
          d.lanista.health = 80;
          const g = A.genGladiator(d, A.qForStat(40)); g.id = d.nextId++;
          g.status = "active"; g.mine = true; g.kit = A.defaultKit(g.cls);
          for(const k of S) g[k] = 34;
          g.injury = null; g.fatigue = 0; g.lastFought = -9; g.traits = [];
          d.gladiators.push(g);
          const opp = A.clone(A.genOpponent(3, A.qForStat(92)));
          for(const k of S) opp[k] = 92; opp.kit = A.kitFor(opp.cls, 3); opp.traits = [];
          const o = { id:d.nextId++, tier:3, festival:"a bench", opp, oppRef:null, rematch:false,
            grudgeM:false, stakes:"sine", purse:1000 };
          d.games = { festival:"a bench", offers:[o], week:d.week };
          const h0 = d.lanista.health;
          const t = R.run(d, o, [g.id], { tactic:"aggressive", choice:"press" });
          if(!t.ran) continue;
          const after = (d.gladiators||[]).find(x=>x.id===g.id);
          if(after && after.status === "dead"){ deaths++; lost += h0 - d.lanista.health; }
        }
        return { per: deaths ? lost/deaths : 0, deaths };
      };
      const H0 = healthArm(null, 40), HB = healthArm("blood", 40);
      const gotH = H0.per ? HB.per/H0.per : 0;
      const wantH = A.DOCTRINES.blood && A.DOCTRINES.blood.health ? 1/A.DOCTRINES.blood.health : 1;
      lines.push(`what a death of your own costs the lanista: ${H0.per.toFixed(2)} points with no `
        + `school over ${H0.deaths} deaths, ${HB.per.toFixed(2)} under the Red School over ${HB.deaths} `
        + `→ ${gotH.toFixed(3)}x against ${wantH.toFixed(3)} (the table lists 0.7 and it is a DIVISOR)`);
      if(!H0.deaths || !HB.deaths)
        bad.push(`no man died on a sine missione card at 34 against 92 in one of the arms `
          + `(${H0.deaths} and ${HB.deaths} of 40) — the health divisor cannot be measured without a death`);
      else if(Math.abs(gotH - wantH)/wantH > 0.12)
        bad.push(`the Red School's toll on the lanista measured ${gotH.toFixed(3)}x and 1/0.7 is `
          + `${wantH.toFixed(3)} [measured 1.429]. It is the one field in the six tables written as a `
          + `divisor, so a change of sign here reads as mercy when the school is the opposite`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
