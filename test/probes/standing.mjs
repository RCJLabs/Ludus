/* HOW MUCH LONGER DOES A SERVICED LOAN ACTUALLY NEED? — #235's sizing question

   The fresh baseline (test/probes/fuse.mjs, 72 houses x 420w x 3 seeds, run against current source
   rather than the 130-commit-old numbers in the #163 note) says the item's premise still holds and
   says it more precisely than the brief did:

     control (never borrows)   median life 187 / 167 / 189w      fame 2642 / 2432 / 2534
     gratus  (cheapest, hard)  median life 143 / 108 / 125w      fame 1945 / 1668 / 1751
             foreclosed 28 / 31 / 37 of 72, and **83 of those 96 at a loan age of exactly 43**

   43 is `L.patience + 30`, plus the tick. So for the cheapest lender the killer is the CLOCK, not
   the balance — `owes(d) > principal*4.0` almost never fires under Gratus, because a house paying
   down from surplus never lets the balance run to four times what it took. It is still owing MORE
   THAN PRINCIPAL at week 43, which is the other half of the gate, and that is the whole item: the
   #163 rescue clause was written for exactly this house and almost never reaches it.

   (Scaeva splits, 18 and 39 — ln4/ln1.082 is 17.6, so the balance fuse and the clock both fire.
   Murena, soft and with no clock at all, is pure balance: no foreclosure before age 25, which is
   ln4/ln1.058. Three lenders, three different deaths, exactly as the probe's header claims.)

   SO THE SIZING QUESTION IS NARROW AND ANSWERABLE: for the loans the clock kills, how many more
   weeks would a house servicing it have needed to get `owes` back down to `principal` — the gate's
   own escape condition — and how many to clear it outright? That cannot be observed at all in the
   shipped game, because the house dies on the tick the question is being asked. So this probe runs
   with the clock lifted and watches the same loans keep going.

   GOOD_STANDING_EXTRA comes off THIS distribution. Picking it any other way is guessing.

   Run: node test/probes/standing.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 72), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "STAND";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const loans = [];        /* one row per loan that ever ran past the clock's own age */
  let taken = 0, cleared = 0;

  for(const who of ["gratus","scaeva"]){
    const L = A.LENDERS[who], clock = L.patience + 30;
    for(let h=0; h<H; h++){
      const d = A.newGameState("St"+h, "clean", `${SEED}-${who}-${h}`, null);
      let cur = null;
      for(let w=0; w<W; w++){
        if(d.over) break;
        const was = d.loan;
        R.lanista(d, { loan:who });
        if(!was && d.loan){ taken++;
          cur = { who, h, principal:d.loan.principal, took:d.week,
                  atClock:null, underAt:null, clearAt:null, peak:0 }; }
        if(d.loan && cur){
          const age = A.loanWeeks(d), o = A.owes(d), ratio = o / Math.max(1, cur.principal);
          cur.peak = Math.max(cur.peak, ratio);
          if(age === clock + 1 && cur.atClock == null) cur.atClock = +ratio.toFixed(2);
          /* AFTER the clock, not ever. A loan dips under principal at age 2 all the time — a big
             early repayment against one week of interest — and then climbs back over it. The gate
             is evaluated at the clock and only there, so the only number that sizes an extension is
             when it NEXT gets under, counting from the tick the house would have died on. The first
             draft of this probe measured the ever-case and reported "median age 2", i.e. an
             extension of zero weeks would rescue everybody, which is nonsense on its face. */
          if(age > clock && cur.underAt == null && cur.atClock != null && cur.atClock > 1
             && o <= cur.principal) cur.underAt = age;
        }
        if(was && !d.loan && cur){ cleared++; cur.clearAt = d.week - cur.took;
          if(cur.atClock != null) loans.push(cur); cur = null; }
      }
      if(cur && cur.atClock != null) loans.push(cur);
    }
  }
  return { loans, taken, cleared };
}, [H, W, SEED]);

const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : null; };
const pctl = (a,q) => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.min(v.length-1,Math.floor(v.length*q))] : null; };

console.log(`\n  the clock LIFTED, ${H} houses x ${W}w per lender · seed "${SEED}"`);
console.log(`  ${out.taken} loans taken, ${out.cleared} cleared outright\n`);

for(const who of ["gratus","scaeva"]){
  const rows = out.loans.filter(r=>r.who===who);
  if(!rows.length){ console.log(`  ${who.toUpperCase()} — no loan ever reached the clock\n`); continue; }
  const clock = who === "gratus" ? 43 : 39;
  console.log(`  ${who.toUpperCase()} — ${rows.length} loans were still open at the clock (age ${clock})`);
  const still = rows.filter(r=>r.atClock > 1);
  console.log(`    at the clock, owed / principal: median ${med(rows.map(r=>r.atClock))} · p25 ${pctl(rows.map(r=>r.atClock),0.25)} · p75 ${pctl(rows.map(r=>r.atClock),0.75)}`);
  console.log(`    ${still.length} of ${rows.length} (${(100*still.length/rows.length).toFixed(0)}%) still owed MORE than principal — the half of the gate that kills them`);
  const under = still.map(r=>r.underAt).filter(x=>x!=null);
  const never = still.length - under.length;
  console.log(`    of those ${still.length}: ${under.length} eventually got back under principal, ${never} never did`);
  if(under.length){
    const extra = under.map(a=>a-clock).filter(x=>x>0);
    console.log(`      the age they got under: median ${med(under)} · p75 ${pctl(under,0.75)} · p90 ${pctl(under,0.9)}`);
    console.log(`      SO THE EXTENSION NEEDED, past ${clock}: median +${med(extra)}w · p50 +${pctl(extra,0.5)} · p75 +${pctl(extra,0.75)} · p90 +${pctl(extra,0.9)}w`);
    const band = [4,8,12,16,20,26,34,44];
    console.log(`      what each candidate extension would rescue, of the ${still.length} loans the clock kills:`);
    for(const e of band){
      const saved = still.filter(r=>r.underAt != null && r.underAt <= clock + e).length;
      console.log(`        +${String(e).padStart(2)}w → ${String(saved).padStart(3)} of ${still.length} (${(100*saved/still.length).toFixed(0)}%)`);
    }
  }
  /* ---- AND THE LEVER THAT WOULD ACTUALLY WORK ----
     The extension table above says the clock is not what kills these houses. At the clock the median
     loan owes 1.87x what it took and is still climbing: the house is servicing the debt from surplus
     and the surplus is smaller than the interest. More weeks do not rescue a house that is losing
     ground, they only move the funeral. So the other half of the same gate is the one worth pricing
     — `owes(d) > d.loan.principal` — because that IS a threshold, and where it sits decides who
     dies. This is what each candidate escape multiple would spare, off the same loans. */
  console.log(`    what a LOOSER ESCAPE TEST would spare instead, off the same ${rows.length} loans at the clock:`);
  for(const m of [1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0]){
    const live = rows.filter(r=>r.atClock <= m).length;
    console.log(`      owed <= ${m.toFixed(2)}x principal → ${String(live).padStart(3)} of ${rows.length} survive the tick (${(100*live/rows.length).toFixed(0)}%)`
      + `${m===1 ? "   ← the gate as it ships" : ""}`);
  }
  const cl = rows.map(r=>r.clearAt).filter(x=>x!=null);
  console.log(`    and ${cl.length} of them cleared outright, at a loan age of median ${med(cl)}w (p90 ${pctl(cl,0.9)})`);
  console.log("");
}
await browser.close(); server.close();
