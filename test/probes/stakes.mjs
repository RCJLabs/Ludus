/* #230 — WHICH PATH DROPS THE STAKES, AND WHETHER THE SAND HONOURS THE CARD

   The item: "The rope's own counters, kept since v3.116.0 precisely because refusals were legible
   and ignorable, report 14 of 1,849 bouts (0.8%) fought at stakes other than the ones asked for.
   Small, real, and exactly the class #150 exists for — the card promised one thing and the sand
   rolled another. This one is an investigation, not a design: one probe to find which path drops
   the stakes, then the fix."

   READ THE COUNTER BEFORE TRUSTING IT. `R.wrongStakes` increments on

       const got = pref ? offer.stakes === pref : null;

   which compares WHAT CARD WAS TAKEN against what was asked for. It says nothing whatever about
   whether the bout was fought at the stakes the card carried — so the sentence the item writes
   under it, "the card promised one thing and the sand rolled another", is not the thing that
   counter measures. It measures the rope taking a different card.

   AND TWO OF THE PATHS THAT DO THAT ARE WRITTEN DOWN AS DOING IT:

     `preferStakes` (which is what the old name `stakes:` means) filters the bill and, finding
       nothing, TAKES THE BILL ANYWAY. That is its documented contract against `wantStakes`, added
       in v3.0.0 because the strict reading put 4 of 5 houses into debt.
     the city card "does not take an order for stakes, so a caller that asked for one gets
       `gotWanted:false` rather than a bout quietly billed as what it wanted" — verbatim, in the
       harness, at the line that does it.

   And `makePitOffer` takes the stakes as an argument and sets `stakes` from it in both its
   branches, so the pit honours what it is handed, as the harness claims.

   So this probe asks two things the counter cannot. FIRST, attribute every mismatch to the path
   that produced it — the bill, the pit, the town, or Rome — under each of the three options, so
   "14 bouts at the wrong stakes" can be read as a sentence about a mechanism.

   SECOND, and this is the item's own words rather than its number: does the SAND honour the card?
   `spareOdds()` returns null when the stakes are `sine`, so a sine card cannot produce a sparing.
   That is a behavioural consequence of the field, and nothing in the suite has ever checked that
   the two agree.

     node test/probes/stakes.mjs 8 300 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 8), W = +(process.argv[3] || 300);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"STAKES" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","activeG"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  /* WHICH BRANCH HANDED THE CARD BACK, not where the house happened to be standing. The first cut
     labelled anything taken while `d.rome` was set as "Rome", and at Rome the imperial card IS the
     bill — there is no Rome-specific fallback, `takeBout` refuses outright there. So those were
     bill fallbacks wearing a location. */
  const pathOf = (d, offer) => offer.venue === "pit" ? "the pit"
    : d.city ? "the town" : d.rome ? "the bill (at Rome)" : "the bill";

  /* ---- 1. ATTRIBUTION, under each of the three options ---- */
  const arms = {};
  for(const [name, opt] of [["stakes", "stakes"], ["preferStakes", "preferStakes"], ["wantStakes", "wantStakes"]]){
    for(const want of ["sine", "standard", "blood"]){
      const key = `${name}:${want}`;
      const a = arms[key] = { asked:0, ran:0, refused:0, wrong:0, byPath:{}, gotStakes:{} };
      for(let h=0; h<H; h++){
        const d = A.newGameState("Stakes", "clean", "STK-"+h, null);
        for(let w=0; w<10; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
        for(let i=0; i<W; i++){
          if(d.over) break;
          a.asked++;
          let t = null;
          try { t = R.takeBout(d, { [opt]: want }); } catch(e){}
          if(!t || t.ran === false){ a.refused++; }
          else if(t.offer){
            a.ran++;
            a.gotStakes[t.offer.stakes] = (a.gotStakes[t.offer.stakes]||0) + 1;
            if(t.offer.stakes !== want){
              a.wrong++;
              const pth = pathOf(d, t.offer);
              a.byPath[pth] = (a.byPath[pth]||0) + 1;
            }
          }
          try { R.lanista(d); } catch(e){ break; }
        }
      }
    }
  }

  /* ---- 2. DOES THE SAND HONOUR THE CARD? ----
     `spareOdds()` is null at sine, so no sparing can be offered or taken. Every bout the rope runs
     is read for a `spared` beat and filed against the stakes the CARD carried. */
  const sand = {};
  for(let h=0; h<H; h++){
    const d = A.newGameState("Stakes", "clean", "SAND-"+h, null);
    for(let w=0; w<10; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
    for(let i=0; i<W*2; i++){
      if(d.over) break;
      let t = null;
      try { t = R.takeBout(d, {}); } catch(e){}
      if(t && t.ran !== false && t.offer && t.res){
        const st = t.offer.stakes || "?";
        const s = sand[st] = sand[st] || { n:0, spared:0, died:0, resStakes:{} };
        s.n++;
        const beats = [].concat((t.res && t.res.beats) || []);
        if(beats.some(b=>b && b.kind === "spared")) s.spared++;
        if(beats.some(b=>b && b.kind === "death")) s.died++;
        /* and whether the RESULT still says what the card said */
        const rs = t.res && t.res.stakes;
        if(rs != null) s.resStakes[rs] = (s.resStakes[rs]||0) + 1;
      }
      try { R.lanista(d); } catch(e){ break; }
    }
  }

  return { arms, sand };
}, [H,W]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  console.log(`WHICH PATH HANDS BACK A DIFFERENT CARD, by option and by asked-for stakes:\n`);
  console.log(`  ${"option:asked".padEnd(24)} ${"ran".padStart(5)} ${"refused".padStart(8)} ${"wrong".padStart(6)}   by path`);
  for(const [k,a] of Object.entries(out.arms)){
    const paths = Object.entries(a.byPath).sort((x,y)=>y[1]-x[1]).map(([p2,n])=>`${p2} ${n}`).join(" · ");
    console.log(`  ${k.padEnd(24)} ${String(a.ran).padStart(5)} ${String(a.refused).padStart(8)} ${String(a.wrong).padStart(6)}   ${paths || "—"}`);
  }
  console.log(`\nAND WHAT IT ACTUALLY FOUGHT, when it did not get what it asked for:`);
  for(const [k,a] of Object.entries(out.arms)){
    if(!a.wrong) continue;
    console.log(`  ${k.padEnd(24)} ${Object.entries(a.gotStakes).sort((x,y)=>y[1]-x[1]).map(([s,n])=>`${s} ${n}`).join(" · ")}`);
  }
  console.log(`\nDOES THE SAND HONOUR THE CARD? (spareOdds() is null at sine, so sine cannot spare)`);
  console.log(`  ${"the card said".padEnd(14)} ${"bouts".padStart(6)} ${"spared".padStart(7)} ${"died".padStart(6)}   what the RESULT says`);
  for(const [st, s] of Object.entries(out.sand).sort((a,b)=>b[1].n-a[1].n)){
    const rs = Object.entries(s.resStakes).map(([k,n])=>`${k} ${n}`).join(" · ");
    console.log(`  ${st.padEnd(14)} ${String(s.n).padStart(6)} ${String(s.spared).padStart(7)} ${String(s.died).padStart(6)}   ${rs || "—"}`);
  }
}
console.log("\n" + JSON.stringify(out));
await browser.close(); server.close();
