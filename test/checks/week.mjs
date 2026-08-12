/* WHAT THE WEEK IS ASKING FOR, AND WHERE IT SAYS SO.

   `agenda(d)` has known what wants an answer and which tab the answer is on since v2.57.0. It rendered
   inside a `Sect` called `This week` which the v3.1.0 tab anatomy MEASURED at **y=1565** on a founded
   house at a phone width — two screens down, after the gatekeeper's panel, the rivalry line, the banners
   and The Yard — and which opened itself only when something was urgency 3, so an ordinary week with
   five things on it was shut and read "5 things".

   BEFORE MOVING IT, THE FALSIFIER WAS MEASURED: 289 weeks of the reference player, `agenda(d)` read
   before he acted on it.

     weeks with nothing on the list          0 of 289          so a promoted block is never empty
     weeks with seven items or more        156 (54.0%)         so a flat list of seven is the wrong shape
     weeks with five or more               246 (85.1%)
     distinct tabs a week's items point at   4.11 mean         so a jump to the tab is worth having
     the section OPENED ITSELF on           218 (75.4%)        and stayed shut on 71 weeks that had work

   AND THE LIST WAS WALLPAPER. Five labels were lit on 41 to 62% of every week a house lives:

     There are men on the block             180 of 289   62%
     Nobody in this yard can teach          177          61%
     This house teaches no particular thing 151          52%   ← added in v2.93.0
     Nobody feeds this house, or nurses it  118          41%   ← added in v2.98.0
     N men have not been sworn in           118          41%

   That is #101's finding again — "lit most weeks, which makes it decoration" — and two of the five were
   added by this audit in the three releases before it was measured. So an item carries its AGE now, the
   list sorts by urgency and then by novelty, and only what is urgent or new is shown without asking. The
   rest is a count and a tap; it is not hidden, because it is still the reason a player eventually goes
   and buys a doctore.

   WHAT THIS HOLDS: the age arithmetic, the ranking, the shape of the shown block against the same
   campaign the figures above come from, and that the panel is on the screen at the TOP of the tab.
   WHAT WOULD FALSIFY the design: a shown block that is still seven items long most weeks, which would
   mean novelty is not selective enough and the fix moved the wallpaper rather than removing it. */

import { hasHandle } from "../harness.mjs";

export const name = "week";
export const describe = "the week's work is ranked by what is new, and the standing items are not the list";

/* the bars sit a long way from the measured values, because this is a shape and not a threshold */
const MAX_SHOWN   = 5.0;   // mean items in the shown block; measured 7+ on 54% of weeks BEFORE the change
const MAX_STANDING = 0.34; // the share of weeks any ONE label may be in the shown block

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(([MAX_SHOWN, MAX_STANDING])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const bad = [], lines = [];
    for(const fn of ["agendaRanked","agendaTop","agendaTick","agAge","agKey"])
      if(typeof A[fn] !== "function") bad.push(`\`${fn}\` is not on the handle — the week's panel cannot be driven`);
    if(bad.length) return { bad, lines };

    /* ---- 1. THE AGE ARITHMETIC, on a hand-built ledger ---- */
    {
      const d = A.newGameState("Wk","clean","WEEK-AGE",null);
      d.week = 50; d.flags = d.flags || {};
      d.flags.agSeen = { [A.agKey("A thing with 3 men in it")]: 44 };
      const six = A.agAge(d, "A thing with 9 men in it");     /* the number is normalised away */
      const none = A.agAge(d, "Something never seen");
      lines.push(`the clock on an item: first seen week 44, now week 50 → ${six} weeks; never seen → ${none}`);
      if(six !== 6) bad.push(`an item first raised in week 44 reads ${six} weeks old in week 50 — \`agAge\` `
        + `is what decides whether a thing is news, and \`agKey\` has to normalise the count out of the label`);
      if(none !== 0) bad.push(`an item never seen before reads ${none} weeks old and should read 0`);
      if(A.agKey("N men have not been sworn in") === A.agKey("N men have not been fed"))
        bad.push(`\`agKey\` collapses two different labels to the same key — the ages would be shared`);
    }

    /* ---- 2. THE RANKING: urgent first, then newest ---- */
    {
      const d = A.newGameState("Wr","clean","WEEK-RANK",null);
      const ranked = A.agendaRanked(d);
      let slipped = 0;
      for(let i=1;i<ranked.length;i++){
        const a = ranked[i-1], b = ranked[i];
        if(b.urgency > a.urgency) slipped++;
        else if(b.urgency === a.urgency && b.age < a.age) slipped++;
      }
      lines.push(`a fresh house ranks ${ranked.length} things, ${slipped} of them out of order`);
      if(slipped) bad.push(`${slipped} items are out of order in \`agendaRanked\` — it sorts by urgency `
        + `and then by age, and a list that does not put the urgent thing first is the fault the panel `
        + `was moved to the top of the tab to fix`);
      if(ranked.some(a=>a.age == null))
        bad.push(`an item came back from \`agendaRanked\` with no age on it, so the panel cannot tell `
          + `news from furniture`);
    }

    /* ---- 3. AND THE SHAPE, over the same campaign the head's figures come from ---- */
    {
      const HOUSES = 6, WEEKS = 200;
      let weeks = 0, shownSum = 0, allSum = 0, emptyShown = 0, sevenShown = 0;
      const inShown = {}, everSeen = {};
      for(let h=0; h<HOUSES; h++){
        const d = A.newGameState("Ws"+h, "clean", `WEEK-SHAPE-${h}`, null);
        for(let w=0; w<WEEKS; w++){
          if(d.over) break;
          const rank = A.agendaRanked(d).filter(a=>a.tab !== "men");
          const top = A.agendaTop(rank);
          weeks++; allSum += rank.length; shownSum += top.length;
          if(!top.length) emptyShown++;
          if(top.length >= 7) sevenShown++;
          for(const a of top) inShown[A.agKey(a.label)] = (inShown[A.agKey(a.label)]||0)+1;
          for(const a of rank) everSeen[A.agKey(a.label)] = (everSeen[A.agKey(a.label)]||0)+1;
          R.lanista(d);
          d.pendingEvent = null;
          try { A.endWeek(d); } catch(e){ break; }
        }
      }
      const meanShown = weeks ? shownSum/weeks : 0, meanAll = weeks ? allSum/weeks : 0;
      lines.push(`${weeks} weeks of the reference player: the whole list averages ${meanAll.toFixed(1)} `
        + `things, the block SHOWN averages ${meanShown.toFixed(1)} · seven or more shown on `
        + `${(sevenShown/weeks*100).toFixed(1)}% of weeks · nothing new on ${(emptyShown/weeks*100).toFixed(1)}%`);
      if(meanShown > MAX_SHOWN)
        bad.push(`the block a player is shown without asking averages ${meanShown.toFixed(1)} items `
          + `[bar ${MAX_SHOWN}] against a whole list of ${meanAll.toFixed(1)}. Before v3.2.0 the list was `
          + `seven or more on 54% of weeks and five labels were lit on 41-62% of every week a house `
          + `lives — if the shown block is that long again then novelty has stopped selecting and the `
          + `wallpaper has simply moved to the top of the tab`);

      const worst = Object.entries(inShown).sort((a,b)=>b[1]-a[1]).slice(0, 6);
      lines.push(`most often in the shown block: ` + (worst.map(([k,n])=>`"${k}" ${(n/weeks*100).toFixed(0)}%`).join(" · ") || "nothing"));
      const over = worst.filter(([,n])=>n/weeks > MAX_STANDING);
      if(over.length)
        bad.push(`${over.map(([k,n])=>`"${k}" is in the shown block on ${(n/weeks*100).toFixed(0)}% of weeks`).join("; ")} `
          + `[bar ${Math.round(MAX_STANDING*100)}%]. That is the #101 fault: a line a player sees most `
          + `weeks is a line they stop reading, and then the one that matters is invisible among them`);

      /* the whole list is still allowed to be long — it is what the tap is for. Printed as the control. */
      const long = Object.entries(everSeen).sort((a,b)=>b[1]-a[1]).slice(0, 5);
      lines.push(`(and in the WHOLE list, which is a count and a tap: `
        + long.map(([k,n])=>`"${k}" ${(n/weeks*100).toFixed(0)}%`).join(" · ") + ")");
      if(!weeks) bad.push(`no week could be played at all — the reference player is not running`);
    }

    return { bad, lines };
  }, [MAX_SHOWN, MAX_STANDING]);

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
