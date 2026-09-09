/* WHAT THE MONEY ROW IS WORTH — #247a, and it is a ratio, not a rate.

   v3.207.0 measured the debt death; this holds what v3.208.0 did about it. The agenda's approach
   line used to speak whenever `runway < RUNWAY_WARN`, and measured over every house-week of two
   seeded sets of 32 houses x 420 weeks (`probes/cliff.mjs`) that was 1,535 and 1,348 weeks of
   alarm, right — the house died of debt inside ten weeks — 7.9% and 8.2% of the time. It fired for
   all 88 houses of v3.207.0's run, survivors included. A warning that every house hears always is
   not a warning.

   It speaks on EXPOSURE now: what is in the box against what an ordinary week of this house moves,
   or a runway already in blood. Measured the same way: 692 and 706 weeks, right 12.4% and 12.5%,
   every dying house still reached, seven and eight weeks of median warning.

   SIX ARMS — four seeded over 16 houses x 420 weeks under the reference player, one driven, and one
   over the OPENING, where #247's original phase 2 finally looked. That phase asked whether a young
   house could be warned earlier and the answer is that it is already warned better: over 512 houses
   the row scores 18.6-19.3% precision inside weeks <= 45 — higher than the 12.4% it manages over a
   whole run — and reaches 78-88% of the young debt deaths with nine weeks of lead, against four
   candidate earlier alarms that scored 4.8% to 9.3%. Arm 6 is the guard on that.

   Arm 5 is #247 PHASE 2. The row told a house under the line to "sell the paper, or sell a man" and
   never said what that would raise, while `liquidate` had computed exactly that figure all along.
   Measured (`probes/brink.mjs`, 85 debt deaths): at the week the final red run begins the house is
   short a median of 763d and 445d and could raise 2,666d and 1,451d, covering the gap in 81% of
   deaths. The row carries the figure now, and this holds it against `liquidate` on the same state —
   #150's rule — by PARSING THE ROW'S OWN TEXT, so what is asserted is what a player reads.

   1 · IT IS WORTH MORE THAN SHORTNESS. The row's precision against the precision of the bare
       `runway < RUNWAY_WARN` on the SAME run — a ratio, because the absolute rates move with the
       seed (7.9 and 8.2 on the two probe sets) and a ratio does not. Measured 1.57 and 1.52; the
       bar is 1.25, and the shipped-before behaviour scores exactly 1.00 by construction.
   2 · AND IT STILL REACHES ALMOST EVERY HOUSE THAT DIES OF IT. Precision bought by dropping houses
       is not precision. This arm asked for EVERY death by debt to have heard the row inside its
       last ten weeks, on the strength of the probe reaching 15 of 15 and 14 of 14 — where exposure
       alone (the sharper design, 17-18%) missed one and was not taken for that reason.

       THAT ABSOLUTE IS NOT TRUE, and it took v3.216.0 to find out, because at 16 houses this
       fixture yields about six deaths and a run with no miss was simply the likely outcome. Run at
       56 houses on two builds that differ by one line: **19 of 21 and 18 of 19** — the row reaches
       about 93% of them, and never did reach all. The two it missed died at weeks 241 and 226,
       while deaths at weeks 12, 25, 43 and 63 all heard it, so there is no early-death exclusion
       that would restore the absolute; the misses are simply houses the row did not speak for
       inside their last ten weeks.

       So: 56 houses, and a FLOOR of 80% rather than an absolute. And the honest character of this
       arm, measured rather than asserted: IT IS A COLLAPSE DETECTOR, NOT A DISCRIMINATOR. Cutting
       the runway alarm from `< RUNWAY_BAD` to `< 0` — a severe narrowing, and exactly the change
       this arm exists to catch, since a pickier row scores BETTER on arm 1 — takes reach only from
       90.5% to 76.2% at this n, and to 80.8% at 80 houses. The floor sits on top of that, so it
       catches that sabotage about half the time. It is not sharper than that and cannot be made so:
       a dying house reaches the row down two clauses, and the lead is no better a signal (10 weeks
       honest against 8 sabotaged) because `DEAD_IN` truncates it at ten by construction.

       ARM 1 IS WHAT HOLDS THIS DESIGN. It is a ratio for the reason stated there, and a row that
       bought precision by abandoning houses would have to keep clearing it. This arm's job is the
       narrower one of noticing if reach falls off a cliff, and 80% is where it does that without
       tripping on a quiet seed — at 21 deaths and a true miss rate near 7%, roughly one run in
       fifty by chance alone.
   3 · AND IT IS NOT A KLAXON. The row may speak on at most a fifth of all house-weeks. It spoke on
       21% before and about 11% now; a fifth is the line back to what it was.
   4 · THE SWING IS MEASURED AT ALL. `swingOf` reads the exponentially-weighted mean absolute weekly
       change, and its first draft read it off `weekDigest`'s `dl.gold` — which is what `endWeek`
       moved and not what the WEEK moved, so everything the player spends between weeks was
       invisible and the swing collapsed onto the bill. So: it must be positive on every house, and
       materially bigger than the bill at the median — measured 1.4x to 3x, because a real week
       carries the purses and everything the player spends. Stated as a ratio and not an equality:
       the first draft asked whether the swing EQUALLED the bill, and an exponentially-weighted mean
       of a bill that moves never equals the bill it is chasing, so the sabotage walked past it. */
import { found, clearAll, installRope } from "../harness.mjs";

const HOUSES = 56, WEEKS = 420, DEAD_IN = 10;
const REACH_FLOOR = 0.80;   /* measured 90.5% and 94.7% at this n — see arm 2's head for the bar */
const WORTH = 1.25;    /* the row must be this many times as precise as bare shortness */
const KLAXON = 0.20;   /* and must not speak on more of the year than this */
const SWING_OVER_BILL = 1.25;   /* a real week moves 1.4-3x the bill; one collapsed onto it reads 1 */

export const name = "cliff";
export const describe = "the money row speaks on exposure, is worth more than shortness, and still reaches every house that dies of it";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"CLIFF-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(([H, W, DEAD_IN])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","moneyRow","runway","RUNWAY_WARN","swingOf","exposed","weeklyBill",
                  "liquidate","creditLine",
                  /* arm 7 — #247's leftover, priced */
                  "bUpkeep","workUpkeep","liturgy","hhUpkeep","BKEYS","riseOf","HH_KEYS","hireFolk"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function") return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };
    let weeks = 0, said = 0, saidFatal = 0, short = 0, shortFatal = 0;
    const deaths = [], swings = [], floorRows = [];
    for(let h=0; h<H; h++){
      const d = A.newGameState("Cf"+h, "clean", `CLIFFCHK-${h}`);
      const mine = []; let lastRed = null;
      for(let w=0; w<W; w++){
        if(d.over) break;
        let row = null; try { row = A.moneyRow(d); } catch(e){}
        const rw = A.runway(d);
        mine.push({ week:d.week, said: !!row, short: rw != null && rw < A.RUNWAY_WARN });
        /* arm 7 keeps the LAST red week's floor, because that is the week a player would be
           standing at when the row tells him to do something */
        if(row){ const shed = (mut)=>{ const b = A.weeklyBill(d); const undo = mut();
            const a = A.weeklyBill(d); undo(); return Math.max(0, b - a); };
          lastRed = { week:d.week, bill:A.weeklyBill(d),
            lock: A.bUpkeep(d) + A.workUpkeep(d) + A.liturgy(d) + A.hhUpkeep(d),
            allB: shed(()=>{ const was = d.buildings; d.buildings = {}; return ()=>{ d.buildings = was; }; }),
            allW: shed(()=>{ const was = d.works; d.works = {}; return ()=>{ d.works = was; }; }),
            allH: shed(()=>{ const was = d.household; d.household = {}; return ()=>{ d.household = was; }; }),
            step: A.riseOf(d) > 0 ? shed(()=>{ const was = d.rise.rank; d.rise.rank = was - 1;
              return ()=>{ d.rise.rank = was; }; }) : 0,
            fund: Math.round(A.liquidate(d).total) }; }
        if(w === 200){ let sw = null; try { sw = A.swingOf(d); } catch(e){}
          swings.push({ h, swing:sw, bill:A.weeklyBill(d), gold:Math.round(d.gold) }); }
        try { R.lanista(d); } catch(e){ break; }
      }
      const kind = d.over ? d.over.kind : "survived";
      const fatalFrom = kind === "debt" ? d.week - DEAD_IN : null;
      for(const x of mine){ weeks++;
        const fatal = fatalFrom != null && x.week >= fatalFrom;
        if(x.said){ said++; if(fatal) saidFatal++; }
        if(x.short){ short++; if(fatal) shortFatal++; }
      }
      if(kind === "debt"){
        const heard = mine.filter(x=>x.said && x.week >= fatalFrom);
        deaths.push({ h, week:d.week, heard:heard.length, lead: heard.length ? d.week - heard[0].week : null });
        if(lastRed) floorRows.push(lastRed);
      }
    }
    /* 5 · the figure the row appends when the house is under, driven rather than waited for: a
       state put below the credit line with something spare to sell, and the same state with
       nothing. The row's own text is parsed for the number, so what is asserted is what a player
       would read, not what an internal call returns. */
    const figure = (()=>{
      const mk = (spare) => { const d = A.newGameState("Cf", "clean", "CLIFFFIG");
        d.week = 120;
        if(!spare){ d.gear = {}; d.owed = [];
          /* one man only: `liquidate` sells every man BUT one, so a house of one has no men to sell */
          d.gladiators = d.gladiators.filter(g=>g.status === "active").slice(0, 1); }
        d.gold = Math.round(A.creditLine(d) * 0.6);          /* under the line, inside DEBT_STAGE[0] */
        return d; };
      const d = mk(true), L = A.liquidate(d);
      const row = A.moneyRow(d);
      const num = row && row.sub ? (String(row.sub).match(/(\d+)d stands/) || [])[1] : null;
      const bare = mk(false), bareRow = A.moneyRow(bare), bareL = A.liquidate(bare);
      return { sub: row ? row.sub : "(no row at all)", key: row ? row.key : null,
        said: num == null ? null : +num, want: Math.round(L.total),
        steel:Math.round(L.steel), debt:Math.round(L.debt), men:Math.round(L.men),
        /* the negative arm, and it must not be allowed to skip itself: if stripping the house did
           not actually leave it with nothing to sell, `clean` used to come back null and the
           assertion below simply did not run — a guard that reads exactly like a passing test. The
           bare total is reported so an inert arm is visible, and asserted so it is a failure. */
        bareTotal: Math.round(bareL.total),
        clean: /stands in spare steel/.test(String((bareRow||{}).sub || "")),
        cleanSub: bareRow ? bareRow.sub : null };
    })();
    /* 6 · the opening window, on its own short runs — #247's original phase 2 measured the money
       row here at 18.6-19.3% precision and 78-88% reach against four candidate earlier alarms that
       scored 4.8-9.3%, so this is the guard on the thing that beat them. */
    const opening = (()=>{
      const OPEN_TO = 45, HORIZON = 12;
      let lit = 0, hit = 0, deaths = 0, reached = 0;
      /* 96 houses rather than 40: at 40 this arm saw six debt deaths, and a reach floor standing on
         six is a bar one death either way moves by sixteen points — which is the shape v3.224.0
         found in `asked` and `coffer` and had to widen after the fact. The window closes by week 60,
         so the houses are worth more than the weeks. */
      for(let h=0; h<96; h++){
        const d = A.newGameState("Cl"+h, "clean", `CLIFFOPEN-${h}`);
        const weeks = [];
        for(let w=0; w<75; w++){ if(d.over) break;
          if(d.week <= OPEN_TO){ let on = false; try { on = !!A.moneyRow(d); } catch(e){}
            if(on) weeks.push(d.week); }
          try { R.lanista(d); } catch(e){ break; } }
        const died = !!(d.over && d.over.kind === "debt" && d.week <= 60);
        lit += weeks.length;
        for(const w of weeks) if(died && d.week - w <= HORIZON && d.week >= w) hit++;
        if(died){ deaths++; if(weeks.length && d.week - weeks[weeks.length-1] <= HORIZON) reached++; }
      }
      return { lit, deaths, precision: lit ? Math.round(1000*hit/lit)/10 : 0,
        reached: deaths ? Math.round(1000*reached/deaths)/10 : 0, FLOOR:10, RFLOOR:50, MIN_DEATHS:8 };
    })();
    /* ---- 7 · #247's LEFTOVER, PRICED AND DECLINED ----
       v3.225.0 wrote down "a way to shed the locked floor (mothball a building, abandon a work,
       step down a rank)" and left it open. `probes/brink.mjs` prices each door now, over 128 houses
       and 52 debt deaths that reached the money row, and the answer is no:

         · WORKS HAVE NO SUBJECT AT ALL — 0 of 52 dying houses had ever finished one.
         · the doors are small: the best single building p50 21 a week, a rank step p50 57, the
           whole household p50 23, and EVERY locked line together p50 110 a week (p90 217).
         · and not one death changes. `wouldHaveSaved` reads 98.1% for every door — the same 98.1%
           the escapable bill and the fire-sale already reach without them. The one death nobody
           covers is not covered by every door together either.
         · nor does taking it EARLY help: from the first red week, a median of 98 weeks out, with
           the whole floor shed over all of them (p90 14,840d), the houses saved ONLY by the floor
           are 0 of 52 — because 52 of 52 were already covered without it.

       THE ARITHMETIC IS STOCK AGAINST FLOW, and this arm holds it ON THE REAL DYING HOUSES rather
       than a driven one. The first cut of this arm DID drive one — a starting roster at week 220
       wearing four rooms and a rank — and it inverted the inequality at a bill of 173d a week and a
       fire-sale of 532d, because that house is not built, it is a bare house in a costume. The
       population the finding is about is the one this check already plays to death.

       The gap is a stock (p50 1,190d) arriving in the five or six weeks the money row gives; the
       doors are a flow (p50 110 a week). If the flow ever outruns the sale, the door is worth
       building and #247's leftover should be re-read. */
    const floor = (()=>{
      if(!floorRows.length) return { n:0 };
      const med = (a)=>{ const x = a.slice().sort((p,q)=>p-q); return x[Math.floor(x.length/2)]; };
      const doors = floorRows.map(f=>f.allB + f.allW + f.allH + f.step);
      const over = doors.map(v=>v*6);
      return { n:floorRows.length, weeks:6,
        bill:med(floorRows.map(f=>f.bill)), lock:med(floorRows.map(f=>f.lock)),
        allB:med(floorRows.map(f=>f.allB)), allW:med(floorRows.map(f=>f.allW)),
        allH:med(floorRows.map(f=>f.allH)), step:med(floorRows.map(f=>f.step)),
        doors:med(doors), over:med(over), fund:med(floorRows.map(f=>f.fund)),
        beat: floorRows.filter((f,i)=>over[i] >= f.fund).length };
    })();
    return { weeks, said, saidFatal, short, shortFatal, deaths, swings, figure, opening, floor };
  }, [HOUSES, WEEKS, DEAD_IN]);

  if(r.why) return { pass:false, why:r.why, lines };
  if(!r.deaths.length)
    return { pass:false, why:`no house died of debt in ${r.weeks} weeks — the arm has nothing to measure`, lines };

  { const f = r.floor;
    if(!f.n) bad.push(`arm 7 saw no debt death that ever heard the money row, so #247's leftover is not being measured at all`);
    else {
      lines.push(`#247's leftover, on ${f.n} real debt deaths at their last red week: bill p50 ${f.bill}d/wk, locked ${f.lock}d `
        + `· doors — buildings ${f.allB}, works ${f.allW}, household ${f.allH}, a rank step ${f.step} = ${f.doors}d/wk`);
      lines.push(`   shed for all ${f.weeks} weeks the row gives: ${f.over}d against \`liquidate\`'s ${f.fund}d already on the table, `
        + `and the floor outruns the sale on ${f.beat} of ${f.n} `
        + `[measured over 52 deaths: every door saves 98.1%, which is what the fire-sale saves without them; taken early, 0 of 52 are saved ONLY by the floor]`);
      if(!(f.doors > 0)) bad.push(`every door in the locked floor priced at nought — \`weeklyBill\` has stopped reading the components`);
      if(!(f.over < f.fund))
        bad.push(`the whole locked floor shed for ${f.weeks} weeks is worth ${f.over}d against a fire-sale's ${f.fund}d — `
          + `the stock-against-flow arithmetic #247's leftover was declined on has inverted, and a door in the floor `
          + `should be re-read [measured: doors p50 110d a week against a gap of p50 1,190d arriving in five or six]`);
    }
  }

  const rowP = r.said ? r.saidFatal / r.said : 0;
  const shortP = r.short ? r.shortFatal / r.short : 0;
  const worth = shortP > 0 ? rowP / shortP : 0;
  lines.push(`${r.weeks} house-weeks, ${r.deaths.length} deaths by debt · the row spoke on ${r.said} `
    + `(${(100*r.said/r.weeks).toFixed(1)}% of weeks) and was right ${(100*rowP).toFixed(1)}% of the time`);
  lines.push(`  bare shortness (runway < ${"RUNWAY_WARN"}) would have spoken on ${r.short} `
    + `(${(100*r.short/r.weeks).toFixed(1)}%) and been right ${(100*shortP).toFixed(1)}% — the row is worth ${worth.toFixed(2)}x that`);

  /* 1 */
  if(worth < WORTH)
    bad.push(`the money row is only ${worth.toFixed(2)}x as precise as speaking on shortness alone `
      + `[bar ${WORTH}] — it spoke on ${r.said} weeks at ${(100*rowP).toFixed(1)}% against ${r.short} at `
      + `${(100*shortP).toFixed(1)}%. #247a's whole finding is that shortness is right eight times in a `
      + `hundred and fires for every house that ever lived; a row no better than that has gone back to it`);
  /* 2 */
  const deaf = r.deaths.filter(x=>!x.heard);
  const leads = r.deaths.filter(x=>x.lead != null).map(x=>x.lead).sort((a,b)=>a-b);
  lines.push(`  every death by debt heard it: ${r.deaths.length - deaf.length} of ${r.deaths.length} `
    + `[floor ${Math.round(REACH_FLOOR*100)}%, measured 90.5 and 94.7; the absolute this arm used to assert `
    + `is not true and passed for eight releases on six deaths a run, and see its head for how blunt it is], `
    + `median ${leads.length ? leads[Math.floor(leads.length/2)] : "—"} weeks of warning`);
  if(r.deaths.length && (r.deaths.length - deaf.length) / r.deaths.length < REACH_FLOOR)
    bad.push(`${deaf.length} of ${r.deaths.length} houses died of debt without the money row speaking `
      + `once in their last ${DEAD_IN} weeks — precision bought by dropping the houses it was written `
      + `for is not precision, which is why exposure alone was not taken`);
  /* 3 */
  if(r.said / r.weeks > KLAXON)
    bad.push(`the money row speaks on ${(100*r.said/r.weeks).toFixed(1)}% of all house-weeks `
      + `[bar ${Math.round(KLAXON*100)}%] — it is a klaxon again`);
  /* 4 */
  const flat = r.swings.filter(x=>x.swing == null || x.swing <= 0);
  const ratios = r.swings.filter(x=>x.swing > 0 && x.bill > 0).map(x=>x.swing / x.bill).sort((a,b)=>a-b);
  const midR = ratios.length ? ratios[Math.floor(ratios.length/2)] : 0;
  lines.push(`  the swing at week 200 on ${r.swings.length} houses: `
    + r.swings.slice(0, 4).map(x=>`${x.swing}d against a ${x.bill}d bill`).join(" · ")
    + ` — median ${midR.toFixed(2)}x the bill`);
  if(flat.length) bad.push(`${flat.length} houses had no swing at all by week 200 — \`swingWeek\` is not being run`);
  /* A RATIO, because equality was the wrong shape: the first draft asked whether the swing EQUALLED
     the bill, and an exponentially-weighted mean of a bill that moves never equals the bill it is
     chasing — the sabotage that fed `weeklyBill` straight into `swingWeek` passed it. What the
     measurement actually says is that a real week moves 1.4 to 3 times the bill, because it carries
     the purses and everything the player spends; a swing that has collapsed onto the bill reads 1. */
  if(ratios.length > 2 && midR < SWING_OVER_BILL)
    bad.push(`the swing is only ${midR.toFixed(2)}x the weekly bill at the median of ${ratios.length} `
      + `houses [bar ${SWING_OVER_BILL}] — it has collapsed onto the bill, which is what happens when it `
      + `is read off \`weekDigest\`'s \`dl.gold\`: that is what endWeek moved, not what the week did, `
      + `and everything the player buys between weeks is invisible to it`);

  /* 6 · AND IT IS AT ITS BEST ON THE YOUNG HOUSE, WHICH IS WHERE #247's LAST PHASE LOOKED */
  { const O = r.opening;
    lines.push(`  in the opening (weeks <= 45): lit ${O.lit} weeks, precision ${O.precision}% [floor ${O.FLOOR}], `
      + `reached ${O.reached}% of the young debt deaths [floor ${O.RFLOOR}] over ${O.deaths} of them`);
    if(O.deaths < O.MIN_DEATHS)
      bad.push(`only ${O.deaths} houses died of debt inside the opening [need ${O.MIN_DEATHS}] — the floors below `
        + `stand on too few deaths to mean anything, which is a fault in this arm rather than in the row`);
    else {
      if(O.precision < O.FLOOR)
        bad.push(`the money row's precision in the opening is ${O.precision}% [floor ${O.FLOOR}] — measured 18.6-19.3%, `
          + `which is BETTER than its 12.4% over a whole run. #247's last phase tried four earlier alarms against `
          + `this and every one scored 4.8-9.3%; if this falls, the thing that beat them is gone`);
      if(O.reached < O.RFLOOR)
        bad.push(`the row reached only ${O.reached}% of the debt deaths inside the opening [floor ${O.RFLOOR}] — `
          + `measured 78-88% with nine weeks of lead, and reach is the half that cannot be bought back by firing less`);
    } }

  /* 5 · AND WHEN IT IS UNDER, IT SAYS WHAT THE HOUSE COULD RAISE */
  { const F = r.figure;
    lines.push(`  under the line: "${F.sub}" — the row says ${F.said == null ? "no figure" : F.said + "d"}`
      + ` and \`liquidate\` computes ${F.want}d (steel ${F.steel} · paper ${F.debt} · men ${F.men});`
      + ` a stripped house liquidates for ${F.bareTotal}d and its row reads "${F.cleanSub}"`);
    if(F.want <= 0)
      bad.push(`the planted house has nothing to liquidate (${F.want}d), so this arm asserted nothing — `
        + `it needs spare steel or a second man to have anything to say`);
    else if(F.said == null)
      bad.push(`the money row says "${F.sub}" and never says what selling would raise, while \`liquidate\` `
        + `computes ${F.want}d on this very state — the row tells a player to sell a man without telling `
        + `him it would be enough, which is the whole of #247 phase 2`);
    else if(F.said !== F.want)
      bad.push(`the money row says ${F.said}d stands in spare steel and men and \`liquidate\` says ${F.want}d — `
        + `the number on the screen and the call behind it have to be the same call (#150)`);
    if(F.bareTotal !== 0)
      bad.push(`the stripped house still liquidates for ${F.bareTotal}d, so the negative half of this arm `
        + `tested nothing — an arm that cannot fail reads exactly like a passing one`);
    else if(F.clean)
      bad.push(`a house with nothing spare still had a figure appended ("${F.cleanSub}") — the line is for a `
        + `house that has something to sell, and 0d of remedy is not a remedy`); }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the row speaks on exposure, half as often and half again as well, and says what the house is sitting on`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
