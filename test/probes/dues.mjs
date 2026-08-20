/* #173 — THE BURIAL SOCIETY, AND THE BUTTON THAT DOES NOT DO WHAT IT SAYS

   The item was opened on `lapseCollegium` being unreachable: 22 morale and 16 defiance off every man
   plus 14 unrest, one of the heaviest single losses in the file, with exactly one caller — a button —
   and 0 firings across 72 houses of 420 weeks. Its clause was *falsifies if the collegium is meant to
   be a thing you KEEP, in which case the loss should be deleted rather than reached.*

   Measuring it turned up something the item did not ask about, so this probe answers both.

   `collDues` is `d => d.collegium ? activeG(d).length * COLL_DUES : 0`. It keys off whether the
   record EXISTS, not off `collOn`, which is `d.collegium && !d.collegium.lapsed`. Lapsing sets
   `lapsed` and leaves the record. So pressing the button labelled **"Stop the dues"**:

       collOn        true  -> false      every benefit gone
       collSoften     0.5  -> 1          deaths cost full unrest and full lanista health again
       collBury         —  -> refuses    no more names on the stone
       collDues         9d ->        9d  THE DUES DO NOT STOP
       weeklyBill      39d ->       39d

   and the panel then prints *"The dues stopped in week N."* while the section note — which reads
   `collOn(S) ? collDues(S)+"d/wk" : "burial society"` — stops displaying the charge entirely. The
   money keeps leaving every week, the readout that would show it has switched itself off, and
   `foundCollegium` refuses to re-found (`if(d.collegium || ...) return false`), so it cannot be
   undone. It is a dominated press: strictly worse than not pressing, in every quantity, forever.

   THE INSTRUMENT NOTE THAT MATTERS. The first draft of this probe disabled the society by assigning
   `A.collOn = () => false` on the test handle. That is a SILENT NO-OP: the handle is an object of
   copied references and the engine calls the module-scope binding, so `weeklyBill` and `collSoften`
   came back unchanged and both arms would have been byte-identical — the same fault that shipped an
   inert `entrance` lever in #166. Verified before running rather than after. Every arm below drives
   the society through real player actions on the handle, which is the only thing the engine sees.

   THE ARMS, control first, same seeds:
     never    the button is never pressed — what a played house does today
     early    pressed the first week the house holds a society
     short    pressed the first week the purse will not cover the week's bill, which is the only
              moment the item's "reach it from inside the game" direction could ever fire

   Usage: node test/probes/dues.mjs [houses per prefix] [weeks] [seed]
*/
import { serve, open, needN, sayNeed } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420), SEED = process.argv[4] || "STN";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const PRES = [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`];

  const arm = (when) => {
    const rows = {};
    for(const pre of PRES){
      for(let h=0; h<H; h++){
        const id = `${pre}#${h}`;
        const d = A.newGameState("St"+h, "clean", id, null);
        let w = 0, held = 0, paid = 0, paidAfter = 0, pressedAt = null,
            unrest = 0, hot = 0, short = 0, shortHeld = 0, everHeld = 0, worst = 0;
        for(; w<W; w++){
          if(d.over) break;
          R.lanista(d);
          if(!d.lanista) break;
          if(d.collegium) everHeld = 1;
          unrest += d.unrest||0; if((d.unrest||0) >= 60) hot++;
          const bill = A.weeklyBill(d);
          if(d.gold < bill) short++;
          /* what is actually leaving the purse for the society this week */
          const du = A.collDues(d);
          if(du > 0){ paid += du; if(pressedAt != null) paidAfter += du;
            if(bill > 0) worst = Math.max(worst, du/bill*100); }
          if(A.collOn(d)){ held++; if(d.gold < bill) shortHeld++; }
          /* the press */
          if(pressedAt == null && A.collOn(d)){
            const go = when === "early" ? true
                     : when === "short" ? (d.gold < bill)
                     : false;
            if(go){ A.lapseCollegium(d, true); pressedAt = d.week; }
          }
        }
        rows[id] = { life:w, everHeld, held, paid, paidAfter, pressedAt,
          pressed: pressedAt != null ? 1 : 0,
          buried: (d.collegium && d.collegium.buried) || 0,
          unrest: w ? unrest/w : 0, hotPct: w ? hot/w*100 : 0,
          shortPct: w ? short/w*100 : 0, shortHeld, worst,
          gold: d.gold,
          end: d.over ? d.over.kind : "alive",
          revolt: d.over && d.over.kind === "revolt" ? 1 : 0,
          ruin:   d.over && d.over.kind === "ruin"   ? 1 : 0,
          debt:   d.over && d.over.kind === "debt"   ? 1 : 0,
          health: (d.lanista && d.lanista.health) || 0 };
      }
    }
    return rows;
  };

  const never = arm("never");   /* control FIRST */
  const early = arm("early");
  const shortA = arm("short");
  return { arms:[["never",never],["early",early],["short",shortA]], H, W, PRES,
           COLL_FEE: A.COLL_FEE, COLL_DUES: A.COLL_DUES };
}, [H, W, SEED]);

const base = out.arms[0][1];
const ids = Object.keys(base);
const N = ids.length;
const T = (rows,k) => ids.reduce((a,id)=>a + ((rows[id] && rows[id][k]) || 0), 0);
const M = (rows,k) => { const v = ids.map(id=>rows[id] && rows[id][k]).filter(x=>x!=null);
  return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null; };

console.log(`\n#173 — THE BURIAL SOCIETY AND THE BUTTON THAT SAYS "STOP THE DUES"`);
console.log(`${N} houses of ${out.W} weeks an arm, ${out.PRES.length} seed prefixes, control first, paired house for house`);
console.log(`fee ${out.COLL_FEE}d, dues ${out.COLL_DUES}d a man a week. The rope has no collegium step —`);
console.log(`every society here was granted by the \`burial\` event, which asks on the men's behalf.\n`);

console.log(`  houses that ever held one              ${T(base,"everHeld")} of ${N}`);
console.log(`  house-weeks with the society WORKING   ${T(base,"held")}`);
console.log(`  men buried under the stone             ${T(base,"buried")}`);
{
  const w = ids.map(id=>base[id].worst).filter(x=>x>0).sort((a,b)=>a-b);
  console.log(`  dues as a share of the week's bill     mean ${(T(base,"paid")/Math.max(1,T(base,"held"))).toFixed(1)}d a week`
    + (w.length ? `, worst week any house saw ${w[w.length-1].toFixed(1)}% of the bill` : ``));
}

console.log(`\n  THE PRESS, AND WHAT IT COSTS AFTER IT`);
console.log(`  arm       pressed   dues paid   of that, paid AFTER the press   weeks held  buried`);
for(const [lbl,rows] of out.arms)
  console.log(`  ${lbl.padEnd(9)} ${String(T(rows,"pressed")).padStart(7)} ${String(T(rows,"paid")).padStart(11)}d `
    + `${String(T(rows,"paidAfter")).padStart(30)}d ${String(T(rows,"held")).padStart(11)} ${String(T(rows,"buried")).padStart(7)}`);
console.log(`  — "paid AFTER the press" is money leaving the purse of a player who has been told,`);
console.log(`    in the panel, that the dues stopped. On this build it should be large and nonzero.`);
{
  const pressed = ids.filter(id=>out.arms[1][1][id].pressed);
  if(pressed.length){
    const per = pressed.map(id=>out.arms[1][1][id].paidAfter).sort((a,b)=>a-b);
    console.log(`    per house that pressed early: median ${per[Math.floor(per.length/2)]}d, worst ${per[per.length-1]}d,`);
    console.log(`    against a founding fee of ${out.COLL_FEE}d.`);
  }
}

console.log(`\n  WAS PRESSING IT EVER RIGHT? — the quantities the society actually touches`);
console.log(`  arm       mean unrest   weeks over 60   revolt   ruin   debt   lanista health   gold at end`);
for(const [lbl,rows] of out.arms)
  console.log(`  ${lbl.padEnd(9)} ${(M(rows,"unrest")||0).toFixed(1).padStart(11)} ${(M(rows,"hotPct")||0).toFixed(1).padStart(14)}% `
    + `${String(T(rows,"revolt")).padStart(8)} ${String(T(rows,"ruin")).padStart(6)} ${String(T(rows,"debt")).padStart(6)} `
    + `${(M(rows,"health")||0).toFixed(1).padStart(16)} ${Math.round(M(rows,"gold")||0).toString().padStart(13)}`);

for(const [lbl,rows] of out.arms.slice(1)){
  console.log(`\n  ${lbl.toUpperCase()} against never pressing — and what ${N} houses can see`);
  for(const k of ["unrest","hotPct","health","gold","buried","life"]){
    const diffs = ids.map(id => { const a = rows[id][k], b = base[id][k];
      return (a==null||b==null) ? null : a-b; }).filter(x=>x!=null);
    const r = needN(diffs);
    if(r.mean != null) console.log(`    ${sayNeed(k, r)}`);
  }
}
console.log();

await browser.close();
server.close();
