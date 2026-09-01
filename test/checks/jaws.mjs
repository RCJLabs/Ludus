/* THE WEEK A COMMITMENT MAKES IS SAID BEFORE THE COIN GOES DOWN — AND IT IS THE TRUE WEEK

   Audit item #207, and the bug found under it. The mid-game is where houses die — 8 of the
   survey's 11 deaths by year 4.3, most in debt — and it is where the weekly bill grows in STEPS:
   a doctore, a wing, the collegium, a medicus. Each button priced its step as a fee and an
   increment ("120d", "3d a man each week") and never as the week it makes. v3.156.0 put the
   `Jaws` line under all seven commitment controls: "The week becomes −Nd · the box then carries
   ~Mw", predicted by `billIf` — which asks `weeklyBill` ITSELF, handed a shallow copy with the
   one field the commitment would change. Never a second formula. #150's rule.

   AND THE BILL ITSELF WAS MISSING TWO SALARIES. The medicus and the armourer were paid in
   `staffWeek`, straight off the gold, and `weeklyBill` — the number behind the House face's
   Upkeep, the runway, `creditLine`, `merchantCarry`, and every reserve the reference player
   holds — never carried them. The doctore was in the bill all along: three hires, one counted.
   A staffed house read a rosier week than it lived. One charge now, in `ludusLedger`, of the
   same `staffWages` the bill quotes; this check's second arm exists so those wages can never
   fall back out.

   WHAT EACH ARM HOLDS:
   1 · PREDICTION vs DEED, per kind. On a clone: read `billIf`, do the real thing (`buildUp`,
       `hireDoctore`, `foundCollegium`, `hireStaffMember`, `hireFolk`, `beginWork` run to
       standing), read `weeklyBill`. Equal, to the denarius. A kind with no fixture is a FAILURE,
       not a skip — dark.mjs's precedent, pointed the other way: this check must be able to say
       it asked all six questions.
   2 · THE WAGES STAY IN THE BILL. Hire both staff on a clone: the bill must rise by exactly
       their two wages, and `staffWages` must say the same figure. (The charge itself moved from
       `staffWeek` to the ledger in the same release; the total leaving the box each week is
       unchanged by construction — the same wages, once — and cannot be compared against code
       that no longer exists, so this arm holds the bill and leaves the history to the ROADMAP.)
   3 · THE UI SAYS IT FROM THE SAME FUNCTION. The seven call sites render `billIf` through
       `Jaws`; scanned in the source, because a site hand-rolling its own arithmetic is exactly
       the drift #150 exists to stop. Plus one rendered assertion: the collegium's panel — the
       one commitment always on offer to a founded house — must show the figure `billIf` gives.

   `beginWork` is predicted AT STANDING (left:0), because the jaws it discloses are the upkeep of
   the finished stone; the check drives `left` to 0 rather than waiting years. */
import fs from "node:fs";
import path from "node:path";
import { found, clearAll, tab, installRope, ROOT } from "../harness.mjs";

export const name = "jaws";
export const describe = "every commitment says the week it makes, and the week it makes is true";
export const slow = true;   /* founds a house and reads one rendered panel */

export async function run({ p, errors }){
  await found(p, { seed:"JAWS-1" });
  await clearAll(p, 16);
  await installRope(p);

  const lines = [], bad = [];

  /* ---- arms 1 and 2, through the handle, on clones ---- */
  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["billIf","staffWages","weeklyBill","buildUp","hireDoctore","foundCollegium",
      "hireStaffMember","hireFolk","beginWork","newGameState","BKEYS","STAFF_KEYS"]
      .filter(k => A[k] == null);
    if(miss.length) return { miss };
    const clone = d => { try { return structuredClone(d); } catch(e){ return JSON.parse(JSON.stringify(d)); } };

    /* a house with fixtures for every kind: rooms for staff, coin for everything, markets stocked.
       Weeks are played only until the two markets fill — the fixtures must be the game's own. */
    const base = A.newGameState("JAWS-FIX");
    base.gold = 50000; base.fame = 3000;
    base.buildings = { valetudinarium:1, armamentarium:1, palus:1, carceres:1, balneae:1 };
    let guard = 0;
    while(((base.doctoreMarket||[]).length === 0 || Object.keys(base.staffMarket||{}).length === 0) && guard < 160){
      try { R.lanista(base, { buy:false, build:false, doctore:false, staff:false }); } catch(e){ break; }
      base.gold = 50000; guard++;
    }
    const rows = [], probs = [];
    const tryKind = (kind, argOf, act) => {
      const d = clone(base);
      const arg = argOf(d);
      if(arg === undefined){ probs.push(`${kind}: NO FIXTURE — the state never offered one, so this kind was not checked`); return; }
      const pred = A.billIf(d, kind, arg);
      const ok = act(d, arg);
      if(!ok){ probs.push(`${kind}: the real action refused on a state built to allow it`); return; }
      const real = A.weeklyBill(d);
      rows.push({ kind, pred, real });
      if(pred !== real) probs.push(`${kind}: the line under the button says −${pred}d and the week after actually doing it is −${real}d`);
    };
    tryKind("wing",      d => A.BKEYS.find(k => (d.buildings[k]||0) < 4), (d,k)=>A.buildUp(d,k));
    tryKind("doctore",   d => (d.doctoreMarket||[])[0], (d,c)=>A.hireDoctore(d, c.id) !== false);
    tryKind("collegium", d => null, d=>A.foundCollegium(d) !== false);
    tryKind("staff",     d => { const k = A.STAFF_KEYS.find(k=>(d.staffMarket[k]||[]).length);
        return k ? { kind:k, cand:d.staffMarket[k][0] } : undefined; },
      (d,a)=>A.hireStaffMember(d, a.kind, a.cand.id) !== false);
    tryKind("folk",      d => Object.keys(A.HOUSEHOLD||{motherRef:1}).find(k=>k!=="wife" && !(d.household||{})[k]) || "steward",
      (d,k)=>{ const ok = A.hireFolk ? A.hireFolk(d,k) !== false : false; return ok; });
    tryKind("work",      d => (A.ALL_WORK_KEYS||A.WORK_KEYS||[]).find(k=>{
        d.fame = 9000; return A.workOpen ? A.workOpen(d,k) : true; }),
      (d,k)=>{ const ok = A.beginWork(d,k) !== false; if(ok && d.works[k]) d.works[k].left = 0; return ok; });

    /* arm 2 — the wages stay in the bill, and the week's debit did not change size */
    const s1 = clone(base);
    const kinds = A.STAFF_KEYS.filter(k=>(s1.staffMarket[k]||[]).length);
    let wages = null;
    if(kinds.length){
      const before = A.weeklyBill(s1);
      let sum = 0;
      for(const k of kinds){ const c = s1.staffMarket[k][0]; if(A.hireStaffMember(s1,k,c.id) !== false) sum += c.wage; }
      const after = A.weeklyBill(s1);
      wages = { hired:kinds.length, sum, rose: after - before, inFn: A.staffWages(s1) };
    }
    return { rows, probs, wages };
  });

  if(r.miss){ return { pass:false, why:`the handle is missing ${r.miss.join(", ")} — nothing here can be checked`, lines }; }
  for(const row of r.rows) lines.push(`  ${row.kind.padEnd(10)} says −${row.pred}d · the deed makes −${row.real}d ${row.pred===row.real?"— same":""}`);
  for(const pb of r.probs) bad.push(pb);
  if(r.rows.length < 6) bad.push(`only ${r.rows.length} of 6 commitment kinds were driven — the rest of this check proves nothing about them`);
  if(!r.wages) bad.push(`no staff candidate ever appeared, so the two-wages arm measured nothing`);
  else {
    lines.push(`  staff: hired ${r.wages.hired}, wages ${r.wages.sum}d — the bill rose ${r.wages.rose}d, staffWages() says ${r.wages.inFn}d`);
    if(r.wages.rose !== r.wages.sum) bad.push(`hiring staff with ${r.wages.sum}d of wages moved the bill by ${r.wages.rose}d — the salaries are falling out of the bill again`);
    if(r.wages.inFn !== r.wages.sum) bad.push(`staffWages() reports ${r.wages.inFn}d against ${r.wages.sum}d hired`);
  }

  /* ---- arm 3a — every commitment call site renders billIf through Jaws, in the source ---- */
  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
  const sites = (src.match(/<Jaws /g) || []).length;
  lines.push(`  ${sites} Jaws lines in the source`);
  if(sites < 7)
    bad.push(`${sites} <Jaws> call sites in the source where 7 commitments exist (wings, doctore, collegium, `
      + `staff, household, and both works panels) — a commitment without the line prices its step and hides its week`);

  /* ---- arm 3b — one rendered figure: the collegium's line on a founded house ---- */
  await tab(p, "villa"); await p.waitForTimeout(380); await clearAll(p, 8);
  await p.evaluate(()=>{ const l=[...document.querySelectorAll('[role=tablist]')]
    .find(x=>/sections\s*$/i.test(x.getAttribute("aria-label")||""));
    const b=l && [...l.querySelectorAll("button[role=tab]")].find(x=>/coin/i.test(x.innerText||""));
    if(b) b.click(); });
  await p.waitForTimeout(420); await clearAll(p, 6);
  const ui = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const el = [...document.querySelectorAll("details")].find(x=>/collegium/i.test(x.innerText||""));
    if(!el) return { none:"no collegium section on the Coin & Council face" };
    el.open = true;
    const txt = (el.innerText||"").replace(/\s+/g," ");
    /* the same question the line answered: what does founding make the week? Read the live save. */
    let want = null;
    try { const keys = Object.keys(localStorage).filter(k=>/ludus-slot-\d/.test(k));
      for(const k of keys){ const s = JSON.parse(localStorage.getItem(k)); if(s && s.gladiators && !s.over){ want = A.billIf(s, "collegium"); break; } } } catch(e){}
    return { want, shown: /The week becomes −(\d+)d/.exec(txt) ? +/The week becomes −(\d+)d/.exec(txt)[1] : null,
      founded: /Paid up|Stop the dues/i.test(txt) };
  });
  if(ui.none) bad.push(`${ui.none} — the rendered arm measured nothing`);
  else if(ui.founded) lines.push(`  collegium already founded on this house — the rendered line legitimately absent`);
  else if(ui.shown == null) bad.push(`the collegium panel renders no "The week becomes −Nd" line — the Jaws line is not reaching the page`);
  else {
    lines.push(`  rendered: the collegium line says −${ui.shown}d, billIf on the live save says −${ui.want}d`);
    if(ui.want != null && ui.shown !== ui.want)
      bad.push(`the page says the week becomes −${ui.shown}d and billIf says −${ui.want}d — the line is not coming from the one function`);
  }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`every commitment says the true week, and the two wages are back in the bill`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
