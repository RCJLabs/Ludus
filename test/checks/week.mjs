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
const MAX_STANDING = 0.34;
const MAX_FRESH_AGAIN = 0.20;  /* #144 — see the note at the bar */ // the share of weeks any ONE label may be in the shown block

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(([MAX_SHOWN, MAX_STANDING, MAX_FRESH_AGAIN])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const bad = [], lines = [];
    for(const fn of ["agendaRanked","agendaTop","agendaTick","agAge","agKey","agAgeBy","agWord","agendaCan","agendaGods","agendaSquare"])
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
      const inShown = {}, everSeen = {}, seenN = {}, freshN = {};
      for(let h=0; h<HOUSES; h++){
        const d = A.newGameState("Ws"+h, "clean", `WEEK-SHAPE-${h}`, null);
        for(let w=0; w<WEEKS; w++){
          if(d.over) break;
          const rank = A.agendaRanked(d).filter(a=>a.tab !== "men");
          const top = A.agendaTop(rank);
          weeks++; allSum += rank.length; shownSum += top.length;
          if(!top.length) emptyShown++;
          if(top.length >= 7) sevenShown++;
          /* ---- #144: BY IDENTITY, NOT BY SENTENCE ----
             This was keyed on `agKey(a.label)` and that is how the fault it exists to catch walked
             past it. The rope's line carries the venue, the venue rotates every PIT_MOVE=4 weeks, so
             one permanent item split itself into four labels at ~25% each — every one of them under
             this bar of 34%, while the ITEM sat in the shown block on 100.0% of the 1,493 weeks it
             appeared (12 houses x 320w). A bar on the sentence cannot see an item that changes its
             sentence. `agId` is the item's declared key where it has one. */
          for(const a of top){ const k = A.agId ? A.agId(a) : A.agKey(a.label);
            inShown[k] = (inShown[k]||0)+1; }
          /* ---- #144, THE GUARD THAT ACTUALLY CATCHES IT ----
             Grouping by identity is not enough: an item that SHOULD declare a key and does not falls
             back to its sentence and hides as several labels, each under the standing bar. The
             detectable signature of a rotating key is different — the item keeps reading NEW. A real
             item is new once and then ages; the rope's line read age 0 on 468 of the 1,493 weeks it
             appeared (31%) because its venue rotated every 4 weeks against an AG_FRESH of 3. */
          for(const a of rank){ const k = A.agId ? A.agId(a) : A.agKey(a.label);
            seenN[k] = (seenN[k]||0)+1; if((a.age||0) <= 0) freshN[k] = (freshN[k]||0)+1; }
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

      { const rows = Object.entries(seenN).filter(([,n])=>n >= 25)
          .map(([k,n])=>[k, (freshN[k]||0)/n, n]).sort((a,b)=>b[1]-a[1]).slice(0, 5);
        lines.push(`most often NEW AGAIN (of the weeks it is in the list): `
          + (rows.map(([k,r,n])=>`"${k}" ${(r*100).toFixed(0)}% of ${n}`).join(" · ") || "nothing"));
        /* healthy items read 3-5% here; the rope's rotating key read 31%. 20% sits clear of both. */
        const churn = rows.filter(([,r])=>r > MAX_FRESH_AGAIN);
        if(churn.length)
          bad.push(`${churn.map(([k,r,n])=>`"${k}" reads NEW on ${(r*100).toFixed(0)}% of the ${n} weeks it is in the list`).join("; ")} `
            + `[bar ${Math.round(MAX_FRESH_AGAIN*100)}%; healthy items read 3-5%]. An item is new once and then ages. `
            + `One that keeps coming back new has an identity that is rotating under it — #144: the rope's `
            + `line carried its venue, the venue moved every 4 weeks against an AG_FRESH of 3, and the item `
            + `sat in the shown block on 100% of the weeks it existed while hiding from the standing bar as `
            + `four labels of ~25% each. Give it a stable \`key\` in \`add()\``); }

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


    /* ================= 5. THE SIX UNDERNEATH THE CHURN BAR — #161 =================
       #161 listed `agAgeBy`, `agWord`, `agendaCan`, `agendaGods`, `agendaSquare` and `agendaTick` as
       dark and said outright that this might be a coverage artefact, because two of them ARE #144's
       repair and this check holds the churn RATE above them. **It was.** Driven over 12 played houses
       of 420 weeks and 12 more with the ledger held up, nothing under the rate was broken:

         the collapsed list drew 5,623 of 11,067 rows (50.8%), and the "and N things that have been
           waiting" button stood on 95.3% of weeks; with it pressed, `agWord`'s four bands split
           13.4 / 16.7 / 14.7 / 23.4 per cent of rows plus 9.2% urgent — every band reachable
         the pit line #144 fixed ages to 102 weeks now and is shown on 26.1% of the weeks it stands,
           against the 100.0% at an age never above 3 that #144 measured before the repair
         and the churn signature — an unurgent item shown on most of the weeks it stands — is carried
           only by the festival lines, which are NEW EVERY WEEK they appear: a Capuan card stands for
           exactly one week (weeks 14, 20, 21, 23, 26 on the first seed), so an age of 0 is the truth
           about them. A town's card, which does stand for several, ages 3 to 7.

       So this section closes the coverage rather than a fault: the three contributors must fire when
       the house can act and go quiet when it cannot, `agWord` must say four different things, and the
       identity underneath must survive a rotating sentence. */
    {
      const base = () => { const q = A.newGameState("Wf","clean","WEEK-SIX",null); q.week = 40; return q; };
      const fire = (fn, setup) => { const q = base(); setup(q); const got = [];
        try { A[fn](q, (urgency, tab, label, sub, key)=>got.push({ urgency, tab, label, sub, key })); }
        catch(e){ return { err:e.message }; }
        return got; };
      const say = r => Array.isArray(r) ? r.map(x=>`u${x.urgency} "${x.label}"`).join(" · ") : `THREW ${r.err}`;
      const must = (nm, r, want) => {
        if(!Array.isArray(r)){ bad.push(`\`${nm}\` threw: ${r.err}`); return; }
        if(want && !r.length) bad.push(`${nm}: ${want ? "it wanted saying" : ""} and the agenda said nothing`);
        if(!want && r.length) bad.push(`${nm}: nothing could be done about it and the agenda raised ${say(r)} anyway `
          + `— advice a house cannot act on is the \`agendaCan\` fault this project has already priced`);
      };
      must("a calm house", fire("agendaCan", q=>{ q.unrest = 0; q.gold = 90000; }), false);
      must("a house in uproar with nothing in the box", fire("agendaCan", q=>{ q.unrest = 60; q.gold = 0; }), false);
      const feast = fire("agendaCan", q=>{ q.unrest = 60; q.gold = 90000; });
      must("a house in uproar that can pay for a feast", feast, true);
      must("the same house, away down the bay", fire("agendaCan", q=>{ q.unrest = 60; q.gold = 90000; q.city = "pompeii"; }), false);

      must("a godless house", fire("agendaGods", q=>{ q.piety = 0; }), true);
      must("a house keeping its rites with nothing to spend", fire("agendaGods", q=>{ q.piety = 60; q.gold = 0; }), false);
      const altar = fire("agendaGods", q=>{ q.piety = 60; q.gold = 90000; q.lastOffering = -99;
        A.activeG(q).slice(0,2).forEach(g=>{ g.injury = { name:"a cut", weeks:3, care:"rest" }; }); });
      must("two men laid up and coin for the altar", altar, true);
      must("a godless house at Rome", fire("agendaGods", q=>{ q.piety = 0; q.rome = { travel:0, fought:0, won:0 }; }), false);

      must("no doctore and nobody in the square", fire("agendaSquare", q=>{ q.doctore = null; q.doctoreMarket = []; }), false);
      const sq = fire("agendaSquare", q=>{ q.doctore = null; q.gold = 90000;
        q.doctoreMarket = [{ name:"Ictus", fee:900, skill:70 }, { name:"Barca", fee:2200, skill:84 }]; });
      must("a doctore for sale and the coin to take him", sq, true);
      must("a doctore already hired", fire("agendaSquare", q=>{ q.doctore = { name:"Ictus", skill:70 };
        q.doctoreMarket = [{ name:"Barca", fee:2200, skill:84 }]; }), false);
      const offer = fire("agendaSquare", q=>{ q.doctore = null; q.doctoreOffer = { name:"Barca", fee:2200 }; });
      must("a doctore offering himself", offer, true);
      /* a house that cannot afford one is still TOLD what it would cost — the source's own rule is
         that advice must not go quiet exactly when it is needed */
      const poor = fire("agendaSquare", q=>{ q.doctore = null; q.gold = 100;
        q.doctoreMarket = [{ name:"Ictus", fee:900, skill:70 }]; });
      if(Array.isArray(poor) && !poor.length)
        bad.push(`a house with 100d and a doctore asking 900d is told nothing about the square. The line `
          + `exists to say what it would cost — "advice goes quiet exactly when it is needed" is the `
          + `fault \`agendaCan\` is named after`);
      if(Array.isArray(sq) && Array.isArray(offer) && sq.length && offer.length && !(offer[0].urgency > sq[0].urgency))
        bad.push(`a doctore who is offering himself is urgency ${offer[0].urgency} and one merely for sale is `
          + `${sq[0].urgency} — the one that will not wait must rank above the one that will`);
      lines.push(`   the contributors: a feast at ${say(feast)} · the altar at ${say(altar)} · the square at ${say(sq)}`);
      lines.push(`   and each goes quiet for a house that cannot act, and for one that is away`);

      const words = [0, 1, A.AG_FRESH, A.AG_FRESH+1, 11, 12, 40].map(a=>({ a, w:A.agWord(a) }));
      lines.push(`   agWord: ` + words.map(x=>`${x.a}→"${x.w}"`).join(" · "));
      const kinds = new Set(words.map(x=>x.w));
      if(kinds.size < 4)
        bad.push(`\`agWord\` says ${kinds.size} different things across ages 0 to 40 (${[...kinds].join(", ")}) — `
          + `it has four bands and the panel prints it on every unurgent row`);
      if(A.agWord(0) === A.agWord(1))
        bad.push(`\`agWord\` says the same thing for an item raised this morning and one a week old`);

      { const q = base(); q.week = 50;
        q.flags.agSeen = { "a stable key":44, [A.agKey("A thing with 3 men in it")]:40 };
        if(A.agAgeBy(q, "a stable key") !== 6)
          bad.push(`\`agAgeBy\` reads ${A.agAgeBy(q, "a stable key")} for a declared key first seen in week 44, read in week 50`);
        if(A.agAgeBy(q, A.agKey("A thing with 9 men in it")) !== 10)
          bad.push(`\`agAgeBy\` does not normalise the count out of a label: a thing first seen in week 40 reads `
            + `${A.agAgeBy(q, A.agKey("A thing with 9 men in it"))} in week 50`);
        if(A.agAgeBy(q, "never raised") !== 0)
          bad.push(`\`agAgeBy\` reads ${A.agAgeBy(q, "never raised")} for something the agenda has never raised`);
        if(A.agId({ key:"mine", label:"a sentence that rotates" }) !== "mine")
          bad.push("`agId` does not prefer a declared key over the sentence — that IS #144's repair"); }

      { const q = A.newGameState("Wt","clean","WEEK-TICK",null); q.week = 10;
        A.agendaTick(q);
        const first = Object.assign({}, q.flags.agSeen || {});
        const n0 = Object.keys(first).length;
        q.week = 15; A.agendaTick(q);
        const now = q.flags.agSeen || {};
        const kept = Object.entries(now).filter(([k,v])=>first[k] === v).length;
        const fresh = Object.entries(now).filter(([k,v])=>v === 15).length;
        lines.push(`   agendaTick: ${n0} keys stamped in week 10; five weeks on, ${Object.keys(now).length} stand — `
          + `${kept} keeping their first week and ${fresh} stamped anew`);
        if(!n0) bad.push("`agendaTick` stamped nothing at all for a founding house — the ages are counted off this");
        if(!kept) bad.push(`\`agendaTick\` re-stamped every key after five weeks, so nothing can ever age past 0 — `
          + `which is #144's fault applied to everything at once`);
        for(const [k,v] of Object.entries(now))
          if(first[k] != null && v !== first[k])
            bad.push(`\`agendaTick\` moved "${k}" from week ${first[k]} to ${v} while it was still being asked for`);
      }
    }
    return { bad, lines };
  }, [MAX_SHOWN, MAX_STANDING, MAX_FRESH_AGAIN]);

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
