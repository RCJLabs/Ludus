/* DOES GOOD STANDING BUY SURVIVAL, AND ONLY SURVIVAL? — #235's phase 5 and its risk section

   `probes/fuse.mjs` found the problem and `probes/standing.mjs` sized the fix. This one checks the
   fix, and checks the thing the item is most afraid of.

   The item's falsifier: "paired seeds, same lender, first loan vs good-standing second loan, median
   life — not worth keeping unless the improvement is clearly larger than the [control's own seed
   spread]". The fresh control spread measured 187/167/189w, so the noise floor on this instrument
   is about 22w, not the 95/248/209 the #163 note recorded.

   The item's RISK, which matters more: "if the good-standing arm comes out ahead of a save-only
   rope on fame, rung, or gold — not just surviving as long as one — the constants have crossed from
   fuse to bank and need to shrink before shipping, not after." A tier that pays for itself
   economically makes disciplined borrowing the correct way to fund a purchase instead of a real
   trade-off. So this prints fame, rung and gold beside life and does not average them away.

   THREE ARMS ON SHARED SEEDS:
     NOBODY   never borrows — the control, and the thing good standing must not beat on money.
     SERVICE  borrows when short, services from surplus. The #163 policy, unchanged.
     SETTLE   the same, plus `payoff` — settles outright whenever what is owed still leaves a week's
              bill on the table. This is the only policy that reaches `d.flags.clearedWith` on
              purpose, and therefore the only one that ever borrows in good standing.

   and every LOAN is classified at the moment it is taken — stranger or good standing — so the
   paired comparison is per-loan, not per-house, and the two populations come out of the same run.

   Run: node test/probes/credit.mjs [houses] [weeks] [seed] [lender] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 72), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "CRED";
const WHO = process.argv[5] || "gratus";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED,WHO])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const arms = [
    { key:"nobody",  opts:{} },
    { key:"service", opts:{ loan:WHO } },
    { key:"settle",  opts:{ loan:WHO, payoff:true } },
    /* the size of the loan is a policy too, and ROADMAP's own claim is about a SMALL one */
    { key:"small300", opts:{ loan:WHO, loanSize:300 } },
    { key:"small700", opts:{ loan:WHO, loanSize:700 } },
  ];
  const res = [];
  for(const arm of arms){
    const rows = [], loans = [];
    for(let h=0; h<H; h++){
      const d = A.newGameState("Cr"+h, "clean", `${SEED}-${h}`, null);
      let cur = null;
      for(let w=0; w<W; w++){
        if(d.over) break;
        const was = d.loan;
        /* whether THIS loan is a good-standing one is decided the tick before it is taken */
        const standingBefore = !!(d.flags && d.flags.clearedWith && d.flags.clearedWith[WHO]);
        R.lanista(d, arm.opts);
        if(!was && d.loan){
          cur = { good: standingBefore, principal: d.loan.principal, took: d.week, end: null, age: 0 };
        }
        if(d.loan && cur) cur.age = A.loanWeeks(d);
        if(was && !d.loan && cur){ cur.end = "cleared"; loans.push(cur); cur = null; }
        if(d.over && cur){ cur.end = d.over.kind; loans.push(cur); cur = null; }
      }
      if(cur){ cur.end = d.over ? d.over.kind : "open"; loans.push(cur); }
      rows.push({ week:d.week, kind:d.over?d.over.kind:"alive", fame:Math.round(d.fame||0),
        rung:A.riseOf(d), gold:Math.round(d.gold), men:A.activeG(d).length,
        cleared: (d.flags&&d.flags.everBorrowed) ? 1 : 0 });
    }
    res.push({ key:arm.key, rows, loans });
  }
  return { res, cap:A.LENDERS[WHO].cap, who:WHO };
}, [H, W, SEED, WHO]);

const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : 0; };
const pc = (n,d) => d ? `${(100*n/d).toFixed(0)}%` : "-";

console.log(`\n  ${H} houses x ${W}w · seed "${SEED}" · lender ${out.who} · cap ${out.cap}d\n`);
const ctrl = out.res[0];
for(const a of out.res){
  const R = a.rows;
  console.log(`  ${a.key.toUpperCase().padEnd(8)} median life ${String(med(R.map(r=>r.week))).padStart(3)}w · fame ${String(med(R.map(r=>r.fame))).padStart(5)} · rung ${med(R.map(r=>r.rung))} · gold ${String(med(R.map(r=>r.gold))).padStart(6)}d · men ${med(R.map(r=>r.men))}`);
  console.log(`           foreclosed ${R.filter(r=>r.kind==="foreclosed").length} of ${H} · alive ${R.filter(r=>r.kind==="alive").length} · loans cleared, median per house ${med(R.map(r=>r.cleared))}`);
  if(a.key !== "nobody"){
    const dl = med(R.map(r=>r.week)) - med(ctrl.rows.map(r=>r.week));
    const df = med(R.map(r=>r.fame)) - med(ctrl.rows.map(r=>r.fame));
    const dg = med(R.map(r=>r.gold)) - med(ctrl.rows.map(r=>r.gold));
    console.log(`           against the control: life ${dl>=0?"+":""}${dl}w · fame ${df>=0?"+":""}${df} · gold ${dg>=0?"+":""}${dg}d`);
    const first = a.loans.filter(l=>!l.good), good = a.loans.filter(l=>l.good);
    const fc = ls => ls.filter(l=>l.end==="foreclosed").length;
    console.log(`           ${a.loans.length} loans: ${first.length} from a stranger (${fc(first)} foreclosed, ${pc(fc(first),first.length)})`
      + ` · ${good.length} in good standing (${fc(good)} foreclosed, ${pc(fc(good),good.length)})`);
    if(good.length) console.log(`             median principal ${med(first.map(l=>l.principal))}d vs ${med(good.map(l=>l.principal))}d · median loan age at the end ${med(first.map(l=>l.age))}w vs ${med(good.map(l=>l.age))}w`);
  }
  console.log("");
}
await browser.close(); server.close();
