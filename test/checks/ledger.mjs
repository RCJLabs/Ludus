/* THE NUMBERS THAT DRIFTED BECAUSE NOTHING WAS WATCHING THEM.

   Two of this session's findings were the same fault twice: a payout that read
   fame uncapped while its counterweight capped, and a ruin line still asking the
   figure it asked when a week cost fifty denarii. Both had been wrong for many
   releases, and neither could have been caught by the suite — riseStipend,
   liturgy, weeklyBill, creditLine, workUpkeep and the whole rung table were on
   the handle and reached by nothing.

   So this check holds the shape of the standing economy rather than its values,
   because the values are exactly what a future repricing is allowed to move:

   - the stipend and the liturgy read the SAME censual fame. If one of them ever
     climbs past the other's ceiling again, a finished house prints money.
   - a finished, idle house must be under water. The sand pays for the stone.
   - the creditors' line follows the house's own bill, and still folds a house of
     three in a shed at the figure it always did.
   - the rungs climb: fame, favour and census all monotonic, no rung free. */

import { hasHandle } from "../harness.mjs";

export const name = "ledger";
export const describe = "standing pays on the census, and the stone is never free";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;

    /* a house at the top of everything: every rung, every wing, all nine works */
    const finished = (fame)=>{
      const d = A.newGameState("Led","clean","LEDGER"+fame,null);
      d.fame = fame; d.acclaim = 95; d.gold = 40000;
      d.rise = { rank: A.RISE_RANKS.length-1, standing:50 };
      d.patrons = [{ id:1, name:"P", rank:"senator", favor:80, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      d.buildings = { valetudinarium:3, balneae:3, carceres:3, armamentarium:3, palus:3 };
      for(const k of A.ALL_WORK_KEYS) d.works[k] = { left:0, began:1, paid:0, owed:0, idle:0 };
      return d;
    };

    /* 1. the two sides of standing, across the eras */
    const curve = [1500, 9000, 12000, 27000].map(f=>{
      const d = finished(f);
      return { fame:f, stipend:A.riseStipend(d), liturgy:A.liturgy(d),
        stone:A.workUpkeep(d), bill:A.weeklyBill(d) };
    });

    /* 2. and what a finished house nets with nobody on the sand */
    const idle = (()=>{
      const d = finished(20000);
      const before = d.gold; let weeks = 0;
      for(let w=0;w<18;w++){
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "rest");
        d.pendingEvent = null;
        try { A.endWeek(d); } catch(e){ break; }
        weeks++; if(d.over) break;
      }
      return { perWeek: Math.round((d.gold-before)/Math.max(1,weeks)), weeks };
    })();

    /* 3. the creditors' line, from a shed to a palace */
    const shed = A.newGameState("Shed","clean","LEDSHED",null);
    const shedLoan = A.newGameState("Loan","clean","LEDLOAN",null);
    shedLoan.loan = { lender:"gratus", amount:400, week:1 };
    const palace = finished(20000);
    const lines = { shed:A.creditLine(shed), shedBill:A.weeklyBill(shed),
      loan:A.creditLine(shedLoan), palace:A.creditLine(palace), palaceBill:A.weeklyBill(palace) };

    /* 4. all nine works are still worth more than everything else put together */
    const stoneTotal = A.ALL_WORK_KEYS.reduce((n,k)=>n + (A.WORKS[k]||A.MONUMENTS[k]).cost, 0);

    /* 5. the slide toward the line — heard, staged, and forgotten if it comes off.
          v2.48.0 took a house from a median 43 weeks to die of debt to 167, and
          nothing grew with it to hear: the three ruins of v1.10.0 each warn six
          weeks out, and debt warned not at all unless you held a lender's paper. */
    const slide = (label, mk)=>{
      const d = mk();
      const line = A.creditLine(d);
      const steps = [];
      for(const frac of [0.1, 0.4, 0.7, 0.9]){
        d.gold = Math.round(line * frac);
        A.weekReckoning(d);
        const item = A.agenda(d).find(x=>/under, and/.test(x.label||""));
        steps.push({ frac, gold:d.gold, stage:d.flags.debtStage||0,
          urgency: item ? item.urgency : null });
        if(d.over) d.over = null;
      }
      d.gold = 500; A.weekReckoning(d);
      return { label, line, steps, lapsed:(d.flags.debtStage||0) === 0,
        quietAgenda: !A.agenda(d).some(x=>/under, and/.test(x.label||"")) };
    };
    const slides = [
      slide("a house of three", ()=>A.newGameState("Sl1","clean","LED_S1",null)),
      slide("a finished house", ()=>finished(20000)),
    ];

    /* 6. the rungs */
    const rungs = A.RISE_RANKS.map((r,i)=>({ i, name:r.name, fame:r.fame||0,
      favor:r.favor||0, cost:r.cost||0, fee:i? A.riseFee(r) : 0 }));

    /* 7. ---- A CHARGE THAT OUTLIVED THE THING IT PAID FOR — #173 ----
          `collDues` read `d.collegium ? ... : 0` — whether the RECORD exists — where every other
          reader of the society asks `collOn`, whether it is still being paid for. `lapseCollegium`
          leaves the record, so the one button that calls it took every benefit away and kept
          billing, forever, with no way to re-found. Over 72 houses of 420 weeks pressing it the
          first week they held one, 114,663 of 115,272 denarii (99.5%) left the purse AFTER the
          press, a median 1,962d a house against a 180d fee.
          This is a SHAPE bar, which is what this check is for: whatever the dues are repriced to,
          a society that has lapsed must charge nothing and a society that is paid for must charge
          something. It is written against the panel's own promise, not against a number. */
    const soc = (()=>{
      const d = A.newGameState("Coll","clean","LEDCOLL",null);
      d.gold = 5000;
      const founded = A.foundCollegium(d);
      const men = A.activeG(d).length;
      const on  = { on:A.collOn(d), dues:A.collDues(d), bill:A.weeklyBill(d), soften:A.collSoften(d) };
      A.lapseCollegium(d, true);
      const off = { on:A.collOn(d), dues:A.collDues(d), bill:A.weeklyBill(d), soften:A.collSoften(d) };
      /* `weeklyBill` is the deterministic reader the ledger charges from — no RNG, no events, so
         the two states are comparable to the denarius. Driving `endWeek` instead would let the
         lapse's own morale and unrest changes move the week and the difference would not be the
         dues any more. */
      return { founded, men, on, off, fee:A.COLL_FEE, rate:A.COLL_DUES };
    })();

    return { curve, idle, lines, stoneTotal, rungs, slides, soc, censusTop: A.CENSUS_TOP || null };
  });

  const lines = [], fails = [];
  lines.push("standing's two sides, across the eras:");
  for(const c of out.curve)
    lines.push(`   fame ${String(c.fame).padStart(6)} → stipend ${String(c.stipend).padStart(5)}d · liturgy ${String(c.liturgy).padStart(4)}d · stone ${c.stone}d · the whole bill ${c.bill}d`);
  lines.push(`a finished house with nobody on the sand: ${out.idle.perWeek}d a week over ${out.idle.weeks} weeks`);
  lines.push(`the creditors carry a shed to ${out.lines.shed}d (bill ${out.lines.shedBill}d), ${out.lines.loan}d with paper out, a palace to ${out.lines.palace}d (bill ${out.lines.palaceBill}d)`);
  lines.push(`${out.rungs.length-1} rungs above lanista · ${out.stoneTotal.toLocaleString()} denarii of stone in all`);
  for(const s of out.slides)
    lines.push(`the slide, ${s.label} (line ${s.line}d): ` +
      s.steps.map(t=>`${t.gold}d→stage ${t.stage}${t.urgency?` (agenda ${t.urgency})`:""}`).join(" · ") +
      ` · ${s.lapsed ? "forgotten when it came off" : "STILL WARNING IN THE BLACK"}`);

  /* ---- the two sides read the same fame ---- */
  const top = out.curve[out.curve.length-1], mid = out.curve[1];   // 27,000 and 9,000
  if(top.stipend > mid.stipend + 2)
    fails.push(`the stipend climbs past the census — ${mid.stipend}d at fame 9,000 and ${top.stipend}d at 27,000, while the liturgy stops. This is the v2.43.0 fault returning.`);
  if(top.liturgy > mid.liturgy + 2)
    fails.push(`the liturgy climbs past the census where the stipend does not — the counterweight has outgrown the payout`);
  /* ---- and the sand pays for the stone ---- */
  if(out.idle.perWeek > 0)
    fails.push(`a finished house nets +${out.idle.perWeek}d a week doing nothing — the strongbox refills itself and the endgame has no floor`);
  if(out.idle.perWeek < -3000)
    fails.push(`a finished, idle house bleeds ${out.idle.perWeek}d a week — that is not a sink, that is a countdown`);
  /* ---- the creditors follow the house ---- */
  if(out.lines.shed !== -250) fails.push(`a house of three in a shed folds at ${out.lines.shed}d — the opening line has always been −250`);
  if(out.lines.loan !== -420) fails.push(`a shed carrying paper folds at ${out.lines.loan}d — it has always been −420`);
  if(!(out.lines.palace < out.lines.shed * 3))
    fails.push(`a palace is carried to ${out.lines.palace}d against a shed's ${out.lines.shed}d — the line does not follow the house's own bill`);
  /* ---- and the stone stays the largest thing in the game ----
     THE BAR WAS 300,000 AND IT DID ITS JOB. v3.196.0 cut the ladder to 96,000, and this line
     refused the build until the repricing was written down — which is exactly what "without a word"
     was there to demand, and the header above says the values are what a repricing is allowed to
     move. The word, then: measured over 192 campaigns (`probes/strongbox.mjs`), the old ladder
     produced 1 colossus, 1 endow, 0 arena and 0 capua, and seventeen of nineteen surviving houses
     peaked between 14,776 and 26,921 against a cheapest monument sitting 72,500 deep. The new bar
     is 80,000: still the largest thing a house can buy by a distance — four times the peak gold of
     a typical survivor — and low enough that the tier is climbed rather than admired. Upkeep did
     NOT move with it; the invariant above ("a finished, idle house must be under water") is what
     caught the first draft of that retune, which had cut upkeep too and put the idle house at
     +130d a week. */
  if(out.stoneTotal < 80000)
    fails.push(`the works and monuments come to ${out.stoneTotal} denarii — the late-game sink has been repriced downward without a word`);
  /* ---- the slide is heard, at every size of house ---- */
  for(const s of out.slides){
    const st = s.steps.map(t=>t.stage);
    if(st[0] !== 0) fails.push(`${s.label}: a house a tenth of the way down its line is already being warned`);
    if(!(st[1] >= 1 && st[2] >= 2 && st[3] >= 3))
      fails.push(`${s.label}: the slide does not escalate — stages ${st.join(",")} at a tenth, four tenths, seven tenths and nine tenths of the line`);
    const last = s.steps[s.steps.length-1];
    if(last.urgency !== 3)
      fails.push(`${s.label}: nine tenths of the way to ruin and the agenda calls it urgency ${last.urgency}`);
    if(s.steps[1].urgency == null)
      fails.push(`${s.label}: four tenths down and the agenda says nothing at all`);
    if(!s.lapsed) fails.push(`${s.label}: the warning did not lapse when the ledger came back`);
    if(!s.quietAgenda) fails.push(`${s.label}: the agenda still warns about debt for a house in the black`);
  }

  /* ---- the ladder is a ladder ---- */
  for(let i=2;i<out.rungs.length;i++){
    const a = out.rungs[i-1], b = out.rungs[i];
    if(b.fame < a.fame)   fails.push(`${b.name} asks less fame than ${a.name}`);
    if(b.favor < a.favor) fails.push(`${b.name} asks less favour than ${a.name}`);
    if(b.cost < a.cost)   fails.push(`${b.name} asks a smaller census than ${a.name}`);
    if(b.fee <= 0)        fails.push(`${b.name} is free to be received`);
  }

  /* ---- the burial society charges only while it is a burial society — #173 ---- */
  {
    const S = out.soc;
    lines.push(`the collegium on a house of ${S.men} at ${S.rate}d a man: paid up ${S.on.dues}d/wk`
      + ` (bill ${S.on.bill}d, soften ${S.on.soften}) → lapsed ${S.off.dues}d/wk`
      + ` (bill ${S.off.bill}d, soften ${S.off.soften})`);
    if(!S.founded) fails.push("could not found a collegium with 5,000 denarii in the box");
    if(!S.on.on)   fails.push("a freshly founded collegium does not read as on");
    if(S.on.dues <= 0)
      fails.push(`a paid-up collegium on ${S.men} men charges ${S.on.dues}d a week — the dues have stopped charging entirely`);
    if(S.off.on)   fails.push("a lapsed collegium still reads as on");
    if(S.off.dues !== 0)
      fails.push(`the button says "Stop the dues" and a lapsed collegium still charges ${S.off.dues}d a week (#173)`);
    if(S.off.bill >= S.on.bill)
      fails.push(`lapsing the collegium did not lower the weekly bill: ${S.on.bill}d → ${S.off.bill}d (#173)`);
    if(S.on.bill - S.off.bill !== S.on.dues)
      fails.push(`lapsing moved the bill by ${S.on.bill - S.off.bill}d where the dues are ${S.on.dues}d`
        + ` — the ledger and the reader disagree about what the society costs (#173)`);
    if(S.off.soften !== 1)
      fails.push(`a lapsed collegium still softens deaths (collSoften ${S.off.soften})`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
