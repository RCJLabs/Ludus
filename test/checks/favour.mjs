/* CALLING IN A FAVOUR — #167

   Four ranks, one favour each, and `callFavour` was dark in every measurement this project ever
   took. `audit` found them held and READY on 6,555 to 6,823 patron-weeks of 18 houses; re-driven
   here, 38,714 of 50,917 patron-weeks of a played house have at least one of them standing ready,
   and the reference player called none, ever. That is #158's shape — a lever nobody pulls — and the
   item was opened with its own falsification: *falsifies if an arm that calls every favour the
   moment it is ready is not measurably better off.*

   IT IS NOT. It is measurably WORSE. 72 houses of 420 weeks an arm, two seed families, paired on
   the same seeds:

       called the moment it is ready   standing −21.2 and −18.2 (54 and 59 houses of 72 worse),
                                       weekly fame −166 and −179, census rung −0.6 both times, and
                                       the imperial runs nearly halve: 157 → 87 and 163 → 91
       called when there is something  weekly fame +188 and +537 (38u/31d and 45u/27d), 0.6 more
       for it to do                    men, 14 and 19 houses standing at 420 weeks against 11 and
                                       15, ruinous endings 30 → 18, at no cost in life

   So the clause fires and the conclusion it proposed — "the four are priced right and the silence
   costs nothing" — does not follow. The four are priced fine. What the panel never said is WHEN,
   and when is the difference between the best policy in the patron system and one that is worse
   than never calling at all. The cost is never the patron's favour; it is the HOUSE's standing,
   because `recomputeFavor` is a weighted mean and `d.favor` is what the census rung asks for, what
   the editor's box weighs and what `riseRomeCut` takes off Rome's bar.

   WHAT THIS CHECK HOLDS:
     1. Every rank's line names the figures its own `run` will use — the rival and the grudge, the
        denarii, the name taken, the fame given — so a player can tell a call worth making from one
        that is merely available.
     2. ONE SOURCE, with teeth: the amount the favour actually moves must land inside the band the
        line printed. `nobleStory` and `senatorName` are that source and the panel reads them.
     3. The line MOVES when there is something for the favour to do. A magistrate with a poach out
        against you must not read the same as one with nothing to clear.
     4. Each favour pays what its title says, and the cost lands on the house's standing.
     5. `favourReady` holds all three of its gates — the cost, the cooldown, and `can(d)`. */

import { hasHandle } from "../harness.mjs";

export const name = "favour";
export const describe = "the four favours pay what they say, and the panel says when they are worth calling";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const RANKS = ["magistrate","merchant","noble","senator"];

    const miss = ["FAVOURS","callFavour","favourReady","favourWorth","nobleStory","senatorName","merchantCarry"]
      .filter(k => A[k] == null);
    if(miss.length) return { bad:[`the handle is missing ${miss.join(", ")}`], lines:[] };

    /* a house every rank will sit for: the noble and the senator arrive on fame, through the game's
       own `patronWeek`, so nothing here invents a patron */
    const house = (tag) => {
      const d = A.newGameState("Fv","clean","FAVOUR-"+tag,null);
      d.fame = 4000; d.gold = 40000; d.week = 80;
      for(let i=0;i<200 && A.patronsOf(d).length < 4;i++) A.patronWeek(d);
      A.patronsOf(d).forEach(x=>{ x.favor = 95; x.calledAt = null; });
      A.recomputeFavor(d);
      return d;
    };
    const of = (d, rank) => A.patronsOf(d).find(x=>x.rank === rank);

    const base = house("BASE");
    const held = A.patronsOf(base).map(x=>x.rank);
    lines.push(`a house at fame ${base.fame} seats ${held.join(", ")}`);
    for(const rk of RANKS) if(!of(base, rk))
      bad.push(`no ${rk} would sit for a house at fame ${base.fame} — this check cannot drive that favour`);

    /* ---- 1 & 3. WHAT THE LINE SAYS, AND THAT IT MOVES ---- */
    {
      for(const rk of RANKS){
        const pt = of(base, rk); if(!pt) continue;
        const said = A.favourWorth(base, pt);
        lines.push(`${rk.padEnd(11)} "${said}"`);
        if(!said || !/\d/.test(said))
          bad.push(`\`${rk}\`'s line names no figure at all — "${said}"`);
      }
      /* the magistrate's own `run` clears a poach and a soft nemesis; the line has to know it */
      const d = house("POACH");
      const top = (d.rivals||[]).slice().sort((a,b)=>(b.grudge||0)-(a.grudge||0))[0];
      const quiet = A.favourWorth(d, of(d, "magistrate"));
      d.poach = { house: top.name, gid: 0, weeks: 3 };
      const loud = A.favourWorth(d, of(d, "magistrate"));
      lines.push(`the magistrate with nothing to clear: "${quiet}"`);
      lines.push(`  ...and with a poach out against you: "${loud}"`);
      if(quiet === loud)
        bad.push(`the magistrate reads the same with a poach out as without one, and his favour calls `
          + `it off — which is the whole of #167: the panel never said WHEN`);
      if(!/poach|man he has out/i.test(loud))
        bad.push(`a poach is running and the magistrate's line does not mention it: "${loud}"`);
    }

    /* ---- 2. ONE SOURCE: what the line PROMISED is what the sand does ----
       The first version of this bar read the band off `nobleStory` and compared it to the roll,
       and passed when the panel was made to quote a band the roll can leave — because it never
       looked at the panel. It reads the two numbers OUT OF THE LINE THE PLAYER SEES now, which is
       the only comparison that closes the loop: what he read against what happened. */
    {
      const bandOf = (said, re) => { const m = String(said||"").match(re);
        return m ? [+m[1], +m[2]] : null; };
      for(let i=0;i<12;i++){
        const d = house("NOB"+i);
        const h = (d.rivals||[]).slice().sort((a,b)=>(b.fame||0)-(a.fame||0))[0];
        const pt = of(d, "noble"); if(!h || !pt) break;
        if(!A.favourReady(d, pt)) continue;
        const said = A.favourWorth(d, pt);
        const band = bandOf(said, /takes (\d+) to (\d+) off it/);
        if(!band){ bad.push(`the noble's line no longer names a band a player could read: "${said}"`); break; }
        const was = h.fame;
        A.callFavour(d, pt.id);
        const took = was - ((d.rivals||[]).find(x=>x.name===h.name)||{}).fame;
        if(!(took >= Math.min(...band) - 0.5 && took <= Math.max(...band) + 0.5)){
          bad.push(`the panel promised ${band[0]} to ${band[1]} off House ${h.name} and the story took `
            + `${Math.round(took)} — the line and the roll are two sources`);
          break;
        }
        if(i === 0) lines.push(`the noble's LINE promised ${band[0]}-${band[1]} off House ${h.name} at ${Math.round(was)}, and it took ${Math.round(took)}`);
      }
      for(let i=0;i<12;i++){
        const d = house("SEN"+i);
        const pt = of(d, "senator"); if(!pt) break;
        if(!A.favourReady(d, pt)) continue;
        const said = A.favourWorth(d, pt);
        const band = bandOf(said, /(\d+) to (\d+) of name/);
        if(!band){ bad.push(`the senator's line no longer names a band a player could read: "${said}"`); break; }
        const was = d.fame;
        A.callFavour(d, pt.id);
        const got = d.fame - was;
        if(!(got >= Math.min(...band) - 0.5 && got <= Math.max(...band) + 0.5)){
          bad.push(`the panel promised ${band[0]} to ${band[1]} of name and the word was worth `
            + `${Math.round(got)} — the line and the roll are two sources`);
          break;
        }
        if(!d.flags.romeEarly) bad.push(`the senator spoke and \`romeEarly\` was not set, so Rome's bar did not move`);
        if(i === 0) lines.push(`the senator's LINE promised ${band[0]}-${band[1]} of name, and it gave ${Math.round(got)}, with Rome's bar down 150`);
      }
      /* and the two bands the panel prints must be the game's own, not a second copy of them */
      const d = house("SRC");
      const h = (d.rivals||[]).slice().sort((a,b)=>(b.fame||0)-(a.fame||0))[0];
      const nb = bandOf(A.favourWorth(d, of(d,"noble")), /takes (\d+) to (\d+) off it/);
      const sb = bandOf(A.favourWorth(d, of(d,"senator")), /(\d+) to (\d+) of name/);
      if(h && nb && (nb[0] !== A.nobleStory(h,0,0) || nb[1] !== A.nobleStory(h,1,1)))
        bad.push(`the noble's line prints ${nb.join("-")} where \`nobleStory\` gives `
          + `${A.nobleStory(h,0,0)}-${A.nobleStory(h,1,1)} — the panel is carrying its own copy of the roll`);
      if(sb && (sb[0] !== A.senatorName(0) || sb[1] !== A.senatorName(1)))
        bad.push(`the senator's line prints ${sb.join("-")} where \`senatorName\` gives `
          + `${A.senatorName(0)}-${A.senatorName(1)} — the panel is carrying its own copy of the roll`);
    }

    /* ---- 4. EACH FAVOUR PAYS WHAT ITS TITLE SAYS, AND THE HOUSE PAYS FOR IT ---- */
    {
      const paid = [];
      for(const rk of RANKS){
        const d = house("PAY-"+rk);
        const pt = of(d, rk); if(!pt) continue;
        /* the magistrate wants a rival with a grudge; the noble wants one with a name */
        if(rk === "magistrate"){ const h = (d.rivals||[])[0]; if(h){ h.grudge = 80; h.warmth = 10; } }
        if(!A.favourReady(d, pt)){ bad.push(`\`${rk}\` would not come ready on a house that holds him at 95`); continue; }
        const beforeFavor = d.favor, beforePatron = pt.favor;
        const beforeGrudge = Math.max(...((d.rivals||[]).map(x=>x.grudge||0)), 0);
        const beforeFame = d.fame;
        const line = A.callFavour(d, pt.id);
        if(!line){ bad.push(`\`${rk}\` was ready and \`callFavour\` returned nothing`); continue; }
        const F = A.FAVOURS[rk];
        const now = A.patronsOf(d).find(x=>x.id === pt.id);
        if(Math.abs((beforePatron - F.cost) - now.favor) > 0.5)
          bad.push(`\`${rk}\` cost ${(beforePatron-now.favor).toFixed(1)} of his favour against a stated ${F.cost}`);
        if(!(d.favor < beforeFavor))
          bad.push(`\`${rk}\` was called and the house's standing did not move (${beforeFavor} → ${d.favor}) — `
            + `\`recomputeFavor\` is what makes this a trade rather than a gift`);
        if(rk === "magistrate"){
          const after = Math.max(...((d.rivals||[]).map(x=>x.grudge||0)), 0);
          if(!(after <= beforeGrudge - 50)) bad.push(`the magistrate had a word and the angriest grudge went ${beforeGrudge} → ${after}`);
        }
        if(rk === "merchant" && !(d.flags.underwritten >= 10))
          bad.push(`the merchant stood the house ${d.flags.underwritten} weeks against the ten he offers`);
        if(rk === "senator" && !(d.fame > beforeFame))
          bad.push(`the senator dropped the name in Rome and the house's fame did not move`);
        paid.push(`${rk} ${beforeFavor}→${d.favor}`);
      }
      lines.push(`the house's standing, before and after each call: ${paid.join(" · ")}`);
    }

    /* ---- 5. THE THREE GATES ---- */
    {
      const d = house("GATE");
      const pt = of(d, "merchant");                 /* never gated on the world, so cost and wait alone */
      const F = A.FAVOURS.merchant;
      pt.favor = F.cost - 1; A.recomputeFavor(d);
      if(A.favourReady(d, pt)) bad.push(`the merchant came ready at ${pt.favor} favour against a cost of ${F.cost}`);
      pt.favor = F.cost; A.recomputeFavor(d);
      if(!A.favourReady(d, pt)) bad.push(`the merchant would not come at exactly his ${F.cost}`);
      pt.favor = 95; pt.calledAt = d.week;
      if(A.favourReady(d, pt)) bad.push(`the merchant came ready the week after he was called, against a wait of ${F.wait}`);
      pt.calledAt = d.week - F.wait;
      if(!A.favourReady(d, pt)) bad.push(`the merchant would not come at exactly his ${F.wait}-week wait`);
      /* and the world gate: strip the rivals and the two that need one must shut */
      const e = house("GATE2"); e.rivals = [];
      for(const rk of ["magistrate","noble"]){
        const q = of(e, rk); if(!q) continue;
        if(A.favourReady(e, q)) bad.push(`\`${rk}\` came ready on a bay with no rival houses in it`);
      }
      lines.push(`the gates hold: cost, the ${F.wait}-week wait, and \`can(d)\` for the two that need a rival`);
    }

    return { bad, lines };
  });

  out.lines.push(`MEASURED, recorded not barred (test/probes/favour.mjs): 72 houses x 420 weeks an arm on `
    + `two seed families, control first, paired house for house. Calling every favour the moment it is `
    + `ready costs 21.2 and 18.2 points of the house's standing (54 and 59 houses of 72 worse), 166 and `
    + `179 of weekly mean fame, 0.6 of census rung, and takes the imperial runs from 157 to 87 and 163 `
    + `to 91. Calling each one only when there is something for it to do — a poach or a nemesis for the `
    + `magistrate, gold below the reserve for the merchant, a rival ahead of you for the noble, Rome `
    + `within the 150 for the senator — is worth +188 and +537 of weekly fame, 0.6 more men, 14 and 19 `
    + `houses standing at 420 weeks against 11 and 15, and takes ruinous endings from 30 to 18, at no `
    + `cost in life. The rope carries \`favours:true\` and \`favours:"wise"\` for both. See the roadmap.`);

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
