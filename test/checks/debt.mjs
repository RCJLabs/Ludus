/* THE COUNTDOWN IS THE SAME LENGTH WHATEVER YOU TAKE, AND THAT IS THE WHOLE TRAP

   Phase queue item #235 opened on a contradiction: ROADMAP told the player, under "The
   moneylenders", that debt is "entirely survivable if you pay it down — a few hundred a week clears
   it inside a month", while its own v3.50.0 note — written from `probes/fuse.mjs` — concluded "the
   loan is not a tool under any lender". Both were in the repository. Both cannot be true.

   THE FRESH BASELINE SAID THE PROBLEM IS STILL REAL AND LOCATED IT PRECISELY. 72 houses x 420w x 3
   seeds against current source: a house servicing Gratus, the cheapest lender, lives 143/108/125w
   against a control's 187/167/189w, and **83 of its 96 foreclosures land at a loan age of exactly
   43** — `patience + 30`, plus the tick. Not the balance. The clock. (Scaeva splits between the two,
   18 and 39; Murena, soft and clockless, is pure balance and never before age 25, which is
   ln4/ln1.058. Three lenders, three different deaths.)

   THE ITEM'S OWN FIX WAS MEASURED AND DOES NOT WORK. It proposed a longer hard clock for a borrower
   who had cleared that lender before. With the clock lifted entirely (`probes/standing.mjs`) the
   loans it kills were followed to see how long they would have needed: of 35/29/35 across three
   seeds, only 7/7/9 ever got back under principal at all, and a +44-week extension — more than
   doubling the clock — rescues a fifth. At the clock the median loan owes 1.87/1.35/2.08 times what
   it took and is still climbing. These houses are servicing the debt and the surplus is smaller
   than the interest; more weeks do not rescue a house that is losing ground.

   THE OTHER HALF OF THE SAME GATE WAS TRIED AND FAILED THE ITEM'S OWN FALSIFIER. Loosening
   `owes > principal` to twice principal, paired A/B on the same seeds: foreclosures 43/32/27 became
   41/28/26. Seven houses in 216, against a control seed spread of about 70 weeks on this
   instrument. The item said keep it only if the gain is clearly larger than that spread. Reverted.

   WHAT THE MEASUREMENT FOUND INSTEAD IS THAT THE ROPE HAD ONLY EVER BORROWED THE MAXIMUM. Every
   number in #163 came from a policy that asked for `99999` and took the lender's whole cap. Given a
   size lever and nothing else changed (72 x 420 x 3 seeds): the cap foreclosed 102 of 216 houses,
   700d foreclosed 73, 300d foreclosed 57 — 7.9% / 4.6% / 2.8% per loan, monotone in every seed.
   **The loan is not a fuse. Taking the maximum is.** ROADMAP's first passage was right and the
   changelog's conclusion was one policy generalised to a mechanism.

   And the panel was complicit, which is what this release changes: `loanFuse` is
   `ln4/ln(1+rate)` and never mentions the principal, so the screen printed the identical week
   number for 300d and for 1400d. The one lever the player actually has over his own survival was
   the one thing the borrowing panel did not talk about.

   FOUR ARMS:
   1 · THE COUNTDOWN REALLY IS SIZE-BLIND: `loanFuse` returns the same week for every principal, so
       the premise this release rests on is asserted rather than assumed.
   2 · AND THE MECHANISM UNDERNEATH IS NOT: run the game's own compounding forward against a fixed
       weekly repayment a house can actually make. The small loan clears; the large one diverges to
       the fuse. Deterministic arithmetic, no rope, no seeds — this is why the measured curve is
       monotone.
   3 · THE PANEL NOW PRICES EACH AMOUNT: every borrow button carries the weekly interest at that
       size, and it is the lender's own rate times that sum.
   4 · THE ESCALATION LADDER IS UNTOUCHED, AND IT IS DRIVEN RATHER THAN READ: warned at patience,
       the reputation hit at patience+8 gated on owing more than principal, the 70% man-seizure at
       patience+16, the 4x balance fuse, the hard clock at patience+30, and #163's own rescue clause
       — a house paid below principal is taken by neither the clock nor the reputation step. #235
       changed none of them, and a release that reports "we measured and left the mechanism alone"
       has to be able to prove the second half. The first draft of this arm read the ladder off
       `String(A.loanWeek)` and every assertion in it was vacuous, because the handle wraps each
       exported function in a call-counting proxy and hands back the wrapper's body. */
import { found, clearAll, installRope, forge, tab, settle } from "../harness.mjs";

export const name = "debt";
export const describe = "the loan's countdown is the same length whatever you take, and the panel now says what the size costs";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"DEBT-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];

    /* ---- 1. the countdown is size-blind ---- */
    let arm1 = null;
    { const rows = A.LEND_KEYS.map(k=>{ const M = A.LENDERS[k];
        return { k, name:M.name, rate:M.rate, cap:M.cap, hard:!!M.hard,
          fuse:A.loanFuse(M), clock:A.loanClock(M),
          derived: Math.ceil(Math.log(A.FUSE_MULT != null ? A.FUSE_MULT : 4) / Math.log(1 + M.rate)) }; });
      arm1 = { rows };
      for(const x of rows){
        if(x.fuse !== x.derived)
          bad.push(`${x.k}'s printed fuse ${x.fuse} is not ln4/ln(1+${x.rate}) = ${x.derived}`);
        if(x.hard && x.clock !== A.LENDERS[x.k].patience + 30)
          bad.push(`${x.k}'s clock reads ${x.clock}, not patience+30`);
        if(!x.hard && x.clock !== 0)
          bad.push(`the soft lender ${x.k} printed a clock of ${x.clock}`); } }

    /* ---- 2. and the mechanism underneath is not size-blind ---- */
    let arm2 = null;
    { /* The game's own compounding, run forward by hand against a fixed weekly repayment. No rope
         and no seeds: this is the arithmetic that makes the measured curve monotone, and it either
         holds or the finding this release is built on is wrong. */
      const M = A.LENDERS.gratus;
      const run = (principal, weekly) => { let owed = principal;
        for(let w = 1; w <= 200; w++){
          owed = owed * (1 + M.rate) - weekly;
          if(owed <= 0.5) return { end:"cleared", w };
          if(owed > principal * 4) return { end:"fuse", w };
        }
        return { end:"open", w:200, owed:Math.round(owed) }; };
      /* a repayment a real house makes: the measured median surplus above the rope's reserve is
         small, so this is deliberately modest */
      const WEEKLY = 40;
      const small = run(300, WEEKLY), mid = run(700, WEEKLY), big = run(M.cap, WEEKLY);
      /* and the break-even is the lender's own rate, which is what makes the size the lever */
      const breakEven = k => Math.round(k * M.rate);
      arm2 = { weekly:WEEKLY, small, mid, big, rate:M.rate, cap:M.cap,
        be300:breakEven(300), be700:breakEven(700), beCap:breakEven(M.cap) };
      if(small.end !== "cleared")
        bad.push(`300d against ${WEEKLY}d a week did not clear — it ended "${small.end}" at week ${small.w}`);
      if(big.end !== "fuse")
        bad.push(`the full cap against ${WEEKLY}d a week did not reach the fuse — it ended "${big.end}"`);
      if(!(arm2.be300 < WEEKLY && arm2.beCap > WEEKLY))
        bad.push(`the break-even does not straddle the repayment: 300d costs ${arm2.be300}d/wk and the cap ${arm2.beCap}d/wk against ${WEEKLY}d`);
      if(mid.end === "cleared" && big.end === "cleared")
        bad.push(`every size cleared — the compounding is not size-sensitive and the release's finding is wrong`); }

    /* ---- 4. the escalation ladder is exactly where it was ---- */
    let arm4 = null;
    { /* DRIVEN, not read. The test handle wraps every exported function in a call-counting proxy,
         so `String(A.loanWeek)` returns the wrapper's body and a regex over it matches nothing —
         the first draft of this arm asserted five things about the ladder and all five were vacuous
         against a build with the ladder fully intact. So each step is provoked on its own fixture
         and the effect is observed. */
      const M = A.LENDERS.gratus;
      const at = (age, owedMult, opts) => {
        const d = A.newGameState("Ladder", "clean", `LAD-${age}-${owedMult}`, null);
        for(let i=0;i<4;i++){ const g = A.genGladiator(d, 60); g.id = d.nextId++;
          g.status="active"; g.mine=true; d.gladiators.push(g); }
        d.week = 200; d.gold = 5000;
        d.loan = { who:"gratus", principal:1000, owed:1000*owedMult, taken:d.week-age, missed:0, warned:0 };
        if(opts && opts.missed != null) d.loan.missed = opts.missed;
        const men0 = A.activeG(d).length, fame0 = d.fame = 400;
        A.loanWeek(d);
        return { warned:!!(d.loan && d.loan.warned), missed:d.loan?d.loan.missed:null,
          men:A.activeG(d).length, men0, fame:Math.round(d.fame), fame0,
          over:d.over?d.over.kind:null, owed:A.owes(d) };
      };
      const quiet   = at(M.patience - 2, 1.1);
      const warned  = at(M.patience, 1.1);
      const rep     = at(M.patience + 8, 1.1);
      const repPaid = at(M.patience + 8, 0.5);          /* paid down under principal — not in default */
      const seize   = at(M.patience + 16, 1.1, { missed:1 });
      const clock   = at(M.patience + 30, 1.1, { missed:2 });
      const clockPaid = at(M.patience + 30, 0.5, { missed:2 });   /* #163's rescue clause */
      const balance = at(4, 4.2);
      arm4 = { patience:M.patience, quiet, warned, rep, repPaid, seize, clock, clockPaid, balance,
        mult:A.FUSE_MULT != null ? A.FUSE_MULT : 4 };
      if(quiet.warned)     bad.push(`the lender's man came to the gate before his patience ran out`);
      if(!warned.warned)   bad.push(`no warning at patience ${M.patience}`);
      if(rep.missed !== 1) bad.push(`no reputation hit at patience+8 (missed=${rep.missed})`);
      if(rep.fame >= rep.fame0) bad.push(`the reputation step cost no fame (${rep.fame0} -> ${rep.fame})`);
      if(repPaid.missed === 1) bad.push(`a house paid down UNDER principal still took the reputation hit — that gate is owes(d) > principal`);
      if(seize.missed !== 2)   bad.push(`no man taken against the debt at patience+16 (missed=${seize.missed})`);
      if(seize.men >= seize.men0) bad.push(`the seizure step took nobody (${seize.men0} -> ${seize.men} men)`);
      if(seize.owed >= 1000)   bad.push(`the seizure took a man and nothing came off the debt (${seize.owed}d)`);
      if(clock.over !== "foreclosed") bad.push(`the hard clock did not foreclose at patience+30 (ended "${clock.over}")`);
      if(clockPaid.over === "foreclosed")
        bad.push(`the clock foreclosed a house that had paid below principal — that is the #163 bug and it must stay fixed`);
      if(balance.over !== "foreclosed") bad.push(`owing ${arm4.mult}x principal did not foreclose`);
      if(arm4.mult !== 4) bad.push(`the balance fuse moved off 4x to ${arm4.mult}`); }

    return { bad, arm1, arm2, arm4 };
  });

  bad.push(...r.bad);
  lines.push(`the countdown, per lender — and it never mentions the principal:`);
  for(const x of r.arm1.rows)
    lines.push(`  ${x.name.padEnd(14)} ${(x.rate*100).toFixed(1)}%/wk · cap ${String(x.cap).padStart(4)}d · four times what you took by week ${x.fuse}${x.hard?` · and the house at ${x.clock} weeks regardless`:` · soft, no clock`}`);
  lines.push(`the same compounding against a flat ${r.arm2.weekly}d a week of repayment:`);
  lines.push(`  300d → ${r.arm2.small.end} at week ${r.arm2.small.w} · 700d → ${r.arm2.mid.end} at week ${r.arm2.mid.w} · ${r.arm2.cap}d → ${r.arm2.big.end} at week ${r.arm2.big.w}`);
  lines.push(`  because the interest alone is ${r.arm2.be300}d · ${r.arm2.be700}d · ${r.arm2.beCap}d a week — the repayment covers the first and not the last`);
  lines.push(`the ladder, driven step by step on Gratus (patience ${r.arm4.patience}):`);
  lines.push(`  quiet at ${r.arm4.patience-2}w · his man at the gate at ${r.arm4.patience}w · word round Capua at +8 (fame ${r.arm4.rep.fame0} → ${r.arm4.rep.fame})`);
  lines.push(`  and NOT at +8 for a house paid below principal (missed ${r.arm4.repPaid.missed}) — #163's own gate`);
  lines.push(`  a man taken at +16 (${r.arm4.seize.men0} → ${r.arm4.seize.men} men, ${1000-r.arm4.seize.owed}d off the debt) · the house at +30 (${r.arm4.clock.over})`);
  lines.push(`  and NOT at +30 for a house paid below principal (${r.arm4.clockPaid.over || "still standing"}) · ${r.arm4.mult}x the principal takes it whenever (${r.arm4.balance.over})`);

  /* ---- 3. the panel prices each amount ---- */
  await forge(p, (A) => {
    const d = A.newGameState("Debt", "clean", "DEBT-UI", null);
    d.gold = 2000; d.week = 30; d.loan = null;
    return { plant:d };
  });
  await tab(p, "villa");
  await p.evaluate(()=>{ const c = [...document.querySelectorAll("button[role=tab]")]
    .find(b => /coin & council/i.test((b.innerText||"") + " " + (b.getAttribute("aria-label")||"")));
    if(c) c.click(); });
  await settle(p);

  const ui = await p.evaluate(()=>{
    const blocks = [...document.querySelectorAll("*")].filter(el=>/moneylenders/i.test(el.textContent||"")
      && el.children.length < 60 && (el.textContent||"").length > 200);
    blocks.sort((a,b)=>a.textContent.length-b.textContent.length);
    const panel = blocks[0];
    if(!panel) return { found:false };
    const btns = [...panel.querySelectorAll("button")].map(b=>(b.textContent||"").replace(/\s+/g," ").trim())
      .filter(t=>/^\d+d/.test(t));
    return { found:true, btns, saysSize: /same length whatever you take/i.test(panel.textContent||""),
      txt:(panel.textContent||"").replace(/\s+/g," ").slice(0, 240) };
  });

  const rates = await p.evaluate(()=>{ const A = window.__LVDVS;
    return A.LEND_KEYS.map(k=>({ k, rate:A.LENDERS[k].rate, cap:A.LENDERS[k].cap })); });

  lines.push(`the panel's own buttons: ${ui.found ? ui.btns.join(" | ") : "THE MONEYLENDERS PANEL DID NOT RENDER"}`);
  if(!ui.found) bad.push(`the moneylenders panel did not render, so nothing here checked the screen`);
  else {
    if(!ui.btns.length) bad.push(`the panel offered no borrow buttons at all`);
    const priced = ui.btns.filter(t=>/\d+d a week/.test(t));
    if(priced.length !== ui.btns.length)
      bad.push(`${ui.btns.length - priced.length} of ${ui.btns.length} borrow buttons do not price the week — the size is the one lever the player has and the panel was silent about it`);
    /* and the number on the button is the lender's own rate times that sum */
    let wrong = 0;
    for(const t of ui.btns){
      const m = t.match(/^(\d+)d\s*(\d+)d a week/);   /* the two lines render with no space between them */
      if(!m){ wrong++; continue; }
      const v = +m[1], said = +m[2];
      const ok = rates.some(x=>Math.round(v * x.rate) === said);
      if(!ok) wrong++;
    }
    if(wrong) bad.push(`${wrong} borrow buttons quote a weekly cost that is not the lender's rate times the sum`);
    if(!ui.saysSize) bad.push(`the panel does not say the countdown is the same length whatever you take, which is the finding this release is for`);
  }

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
