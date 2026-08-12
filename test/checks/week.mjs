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
export const describe = "the week's work and the tabs' sections both open on what is NEW, not on what is merely available";

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

    /* ---- 4. AND THE SAME QUESTION FOR THE SECTIONS, from v3.5.0 ----
       Two of the five UI options wanted "open by default what is actionable" and "fold away what is not".
       Measured over 660 weeks of the reference player, BOTH ARE REFUTED BY THE SAME TABLE: ten of the
       eleven sections that carry a predicate are live on 35% of weeks or more, three of them on over 90%,
       and NOTHING is live on under 15%. So opening what is actionable opens almost everything and there
       is nothing to fold away.

         party 96.8% · temple 93.9% · aedile 91.5% · cells 68.6% · blood 67.0% · school 61.8%
         household 58.5% · watch 51.1% · collegium 48.9% · block 47.0% · square 26.8%

       "Can this be acted on" is nearly always yes — the altar is off cooldown, a party is affordable, an
       aedile is seated. That is #101 for the third time. What opens a section is `sectFresh`: live AND
       young, the same novelty test the agenda uses. Re-measured, a section opens itself on 9.2% of weeks
       against 64.7% if availability alone decided it, and no section exceeds 35%. */
    {
      const K = A.SECT_KEYS || [];
      if(!K.length || typeof A.sectFresh !== "function")
        bad.push(`\`SECT_KEYS\`/\`sectFresh\` are not on the handle — what opens a section cannot be driven`);
      else {
        /* the clock, hand-built */
        const d0 = A.newGameState("Wc","clean","WEEK-SEC",null);
        d0.week = 40; d0.flags = d0.flags || {}; d0.flags.secSeen = { temple: 34 };
        const age = A.secAge(d0, "temple"), none = A.secAge(d0, "block");
        lines.push(`a section's clock: first live in week 34, now 40 → ${age} weeks; never live → ${none}`);
        if(age !== 6) bad.push(`a section first live in week 34 reads ${age} weeks old in week 40`);
        if(none !== 0) bad.push(`a section never live reads ${none} weeks old and should read 0`);

        const HOUSES = 5, WEEKS = 160;
        let weeks = 0;
        const live = {}, fresh = {};
        for(const k of K){ live[k] = 0; fresh[k] = 0; }
        for(let h=0; h<HOUSES; h++){
          const d = A.newGameState("Wq"+h, "clean", `WEEK-SEC-${h}`, null);
          for(let w=0; w<WEEKS; w++){
            if(d.over) break;
            weeks++;
            for(const k of K){ if(A.sectLive(d,k)) live[k]++; if(A.sectFresh(d,k)) fresh[k]++; }
            R.lanista(d); d.pendingEvent = null;
            try { A.endWeek(d); } catch(e){ break; }
          }
        }
        const pcL = K.map(k=>live[k]/weeks*100), pcF = K.map(k=>fresh[k]/weeks*100);
        const meanL = pcL.reduce((a,b)=>a+b,0)/K.length, meanF = pcF.reduce((a,b)=>a+b,0)/K.length;
        const worst = K.map((k,i)=>[k, pcF[i]]).sort((a,b)=>b[1]-a[1])[0];
        lines.push(`${weeks} weeks: a section is LIVE on ${meanL.toFixed(1)}% of weeks on average and `
          + `OPENS ITSELF on ${meanF.toFixed(1)}% · the most eager is "${worst[0]}" at ${worst[1].toFixed(1)}%`);
        if(meanF > 25)
          bad.push(`a section opens itself on ${meanF.toFixed(1)}% of weeks on average [measured 9.2, bar 25] `
            + `against ${meanL.toFixed(1)}% if mere availability decided it. If the two numbers have `
            + `converged then \`sectFresh\` has stopped being a novelty test and every tab is opening `
            + `itself into one long scroll, which is what option 2 was refuted for proposing`);
        if(worst[1] > 40)
          bad.push(`"${worst[0]}" opens itself on ${worst[1].toFixed(1)}% of weeks [measured 30.8 at worst, `
            + `bar 40] — a section that opens itself most weeks is a section a player stops reading, `
            + `which is the #101 fault this whole mechanism exists to avoid`);
        if(meanL < 25)
          bad.push(`sections are live on only ${meanL.toFixed(1)}% of weeks on average [measured 64.7] — `
            + `the predicates have stopped seeing the opportunities they are meant to describe, and `
            + `nothing would ever open itself`);
      }
    }

    return { bad, lines };
  }, [MAX_SHOWN, MAX_STANDING]);

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
