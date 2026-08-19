/* IS THE LOAN A TOOL OR A FUSE — #163

   `dark` found `repay`'s gate open on 0 of 1,100 house-weeks: the reference player has never borrowed,
   so every measurement of `foreclosed` has been of a house that took the money and spent it. That one
   is deterministic — borrow Murena's cap (2,400 at 5.8% a week) against a gate of four times principal
   and ln4/ln1.058 is 24.6 weeks, so 22-24 houses of 24 foreclose at week 26 holding 9,825 owed with no
   variance between them at all. What that cannot say is whether the loan is a TOOL. A house that
   borrows when it is short and pays the debt down from surplus is a different house.

   THE ARM is a rope lever with no constant in it (`loan:"<lender>"`): borrow the week gold falls below
   `LAN.reserve(d)` — twelve weeks of obligations, the rope's own idea of having nothing — and repay
   everything above that reserve every week after.

   AND THE THING THE ARM EXISTS TO FIND, which a code read turns up and only a run can price:

       if(owes(d) > d.loan.principal * 4.0 || (L.hard && w >= L.patience + 30))

   A HARD lender forecloses on a CLOCK, not on a balance. `gratus` at week 42 of the loan, `scaeva` at
   38 — whatever is owed, however faithfully it has been serviced. Only clearing the loan outright
   escapes it, because `repay` deletes `d.loan` at zero. `murena` is the one soft lender and has no
   clock at all. So the three lenders are three different instruments and the probe runs all three
   against a control that never borrows.

   INSTRUMENT NOTES: the control runs first and shares the seeds; every arm prints its raw per-house
   row; and the WEEK OF THE LOAN is tracked separately from the week of the house, because "foreclosed
   at week 60" means nothing until you know the loan was 42 weeks old. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "FUSE";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const arms = [{ key:null, note:"never borrows — the control" }]
    .concat(A.LEND_KEYS.map(k=>({ key:k,
      note:`borrows from ${A.LENDERS[k].name} when short and repays from surplus`
        + ` (${Math.round(A.LENDERS[k].rate*100)}%/wk, cap ${A.LENDERS[k].cap}, patience ${A.LENDERS[k].patience}`
        + `${A.LENDERS[k].hard ? `, HARD — forecloses at ${A.LENDERS[k].patience+30} weeks of loan whatever is owed` : ", soft"})` })));
  const out = [];
  for(const arm of arms){
    const rows = [];
    for(let h=0; h<H; h++){
      const d = A.newGameState("Fs"+h, "clean", `${SEED}-${h}`, null);
      let took = 0, cleared = 0, paid = 0, loanWks = 0, peakOwed = 0, sold = 0;
      let openAt = null, lastLoanAge = 0;
      const hadLoan = () => !!d.loan;
      for(let w=0; w<W; w++){
        if(d.over) break;
        const was = hadLoan(), owedWas = A.owes(d), goldWas = d.gold;
        R.lanista(d, arm.key ? { loan:arm.key } : undefined);
        const now = hadLoan();
        if(!was && now){ took++; openAt = d.week; }
        if(was && !now && !d.over) cleared++;
        if(now){ loanWks++; peakOwed = Math.max(peakOwed, A.owes(d));
          lastLoanAge = A.loanWeeks(d); }
        if(was && now && A.owes(d) < owedWas && d.gold < goldWas) paid++;
        /* the lender helping himself to a man is its own event and the yard feels it */
        sold += [...(d.log||[])].filter(L=>(L.text||"").includes("against the debt")).length ? 0 : 0;
      }
      rows.push({ week:d.week, kind:d.over?d.over.kind:"alive", took, cleared, paid,
        loanWks, peakOwed:Math.round(peakOwed), openAt, loanAge:lastLoanAge,
        fame:Math.round(d.fame||0), rung:A.riseOf(d), men:A.activeG(d).length,
        gold:Math.round(d.gold), stillOwed:A.owes(d) });
    }
    out.push({ ...arm, rows });
  }
  return out;
}, [H, W, SEED]);

const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };
const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;
const tally = rows => { const t={}; for(const r of rows) t[r.kind]=(t[r.kind]||0)+1;
  return Object.entries(t).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · "); };

console.log(`\n  ${H} houses x ${W}w per arm · seed "${SEED}" · the control runs first and shares the seeds\n`);
const ctrl = out[0];
for(const a of out){
  console.log(`  ${(a.key||"NOBODY").toUpperCase()} — ${a.note}`);
  console.log(`    median life ${med(a.rows.map(r=>r.week))}w · ${tally(a.rows)}`);
  console.log(`    median fame ${med(a.rows.map(r=>r.fame))} · median rung ${med(a.rows.map(r=>r.rung))}`
    + ` · median men at the end ${med(a.rows.map(r=>r.men))}`);
  if(a.key){
    const borrowed = a.rows.filter(r=>r.took>0);
    const fc = a.rows.filter(r=>r.kind==="foreclosed");
    console.log(`    ${borrowed.length} of ${H} houses ever borrowed · ${a.rows.reduce((s,r)=>s+r.took,0)} loans taken`
      + ` · ${a.rows.reduce((s,r)=>s+r.cleared,0)} cleared outright · ${a.rows.reduce((s,r)=>s+r.paid,0)} weeks a payment was made`);
    console.log(`    weeks under a debt: ${a.rows.reduce((s,r)=>s+r.loanWks,0)} · peak owed, median ${med(borrowed.map(r=>r.peakOwed))} of a ${A_CAP(a.key)} cap`);
    if(fc.length)
      console.log(`    FORECLOSED ${fc.length} of ${H}: house week ${fc.map(r=>r.week).join(", ")}`
        + ` · the loan was ${fc.map(r=>r.loanAge).join(", ")} weeks old`);
    else console.log(`    foreclosed 0 of ${H}`);
    const dm = med(a.rows.map(r=>r.week)) - med(ctrl.rows.map(r=>r.week));
    console.log(`    against the control: median life ${dm>=0?"+":""}${dm}w · median fame `
      + `${med(a.rows.map(r=>r.fame)) - med(ctrl.rows.map(r=>r.fame))} · mean life `
      + `${(mean(a.rows.map(r=>r.week)) - mean(ctrl.rows.map(r=>r.week))).toFixed(1)}w`);
  }
  console.log(`    raw: ${a.rows.map(r=>`${r.week}/${r.kind}${r.took?`/L${r.took}`:""}`).join(" ")}`);
  console.log("");
}
function A_CAP(k){ return ({gratus:1400, murena:2400, scaeva:900})[k] || "?"; }

await browser.close(); server.close();
