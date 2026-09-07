/* WHAT KILLS A YOUNG HOUSE — #247's original phase 2, reopened by measurement.

   (`opening` was free in both directories; checked before writing.)

   #247 phase 1 retired this phase in one sentence: *"the opening does not discriminate — the era-one
   dead are not poorer at week 8 or 16 than the houses that live, on both sets."* v3.225.0 reopened
   it from a different direction. Splitting the debt deaths by whether the house carries any locked
   cost at all found two populations, near enough half and half:

     BARE  (no buildings, works, liturgy or household)   dies at week 25-41, short 287d, 416-526d
                                                          to its name, coverable 67.6%
     BUILT                                               dies at week 221-225, short ~1,850d, with
                                                          3,800-4,900d of sellable house, coverable 95%

   Both of those are true at once: being poor early does not PREDICT death, and a young house that
   tips over has nothing to sell. So the question phase 1 answered was "is it the gold", and the
   answer was no. The question it left is the one this asks: **then what is it?**

   THE METHOD IS A DISCRIMINANT, not a description. Every house is snapshotted at four checkpoints
   in its opening — weeks 8, 16, 24 and 32 — and then classified by what happened next: dead of debt
   before week 60, dead of something else, or still standing at 60. A quantity that separates the
   two groups at a checkpoint is a thing the game could warn about; one that does not is not the
   lever, however plausible it sounds. `gold` is carried as the CONTROL, because phase 1 has already
   measured it as flat and an instrument that cannot reproduce a known negative is not to be trusted
   on its positives.

   Short runs and many houses: the window in question closes by week 60, so 120 weeks is the whole
   of the question and the houses are worth more than the weeks.

     node test/probes/opening.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 256), W = +(process.argv[3] || 120), SEED = process.argv[4] || "OPEN";
const CUT = 60;
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED, CUT])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const NEED = ["newGameState","activeG","weeklyBill","liquidate","runway","gladValue","isGone","moneyRow","RUNWAY_WARN"];
  const miss = NEED.filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const MARKS = [8, 16, 24, 32];
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
    return { n:a.length, p25:at(.25), p50:at(.5), p75:at(.75) }; };

  /* the snapshot: every quantity a young house has that could plausibly separate it */
  const snap = (d, recentNet) => {
    const men = A.activeG(d);
    const fit = men.filter(g=>!g.injury && (g.fatigue||0) < 55);
    const best = men.reduce((m,g)=> (!m || A.gladValue(g) > A.gladValue(m)) ? g : m, null);
    let fund = 0; try { fund = A.liquidate(d).total; } catch(e){}
    let run = null; try { run = A.runway(d); } catch(e){}
    return {
      gold: Math.round(d.gold),                       /* the CONTROL — phase 1 says this is flat */
      men: men.length, fit: fit.length,
      injured: men.filter(g=>g.injury).length,
      bill: A.weeklyBill(d),
      net: Math.round(recentNet),
      fame: Math.round(d.fame||0),
      unrest: Math.round(d.unrest||0),
      buried: (d.annals||[]).filter(a=>["dead","beasts","revolt"].includes(a.fate)).length,
      wins: men.reduce((n,g)=>n+(g.wins||0),0),
      bouts: men.reduce((n,g)=>n+(g.wins||0)+(g.losses||0),0),
      fund: Math.round(fund),
      best: best ? Math.round(A.gladValue(best)) : 0,
      runway: run == null ? -99 : Math.round(run),
      doctore: d.doctore ? 1 : 0,
      /* ---- AND WHETHER THE GAME IS ALREADY SAYING SO ----
         A discriminant nobody is shown is an item; one the money row is already carrying is not.
         v3.225.0 measured the row reaching 88-94% of debt deaths a median of 5-6 weeks out — for a
         death at week 30 that is week 24. This asks whether it is lit at the checkpoint where the
         separation first appears, which is the difference between "warn earlier" and "nothing to
         build". */
      warned: (()=>{ try { return A.moneyRow(d) ? 1 : 0; } catch(e){ return 0; } })(),
    };
  };
  const KEYS = Object.keys(snap(A.newGameState("K","clean","K"), 0));

  /* ---- AND THE PART THAT DECIDES WHETHER ANYTHING GETS BUILT ----
     A discriminant is not a warning. #247a's whole shipped gain came from the money row firing
     LESS — precision 7.9% -> 12.4% — so an earlier alarm has to be judged the same way or it undoes
     that. Each candidate is evaluated exactly as `cliff.mjs` judges the incumbent: every week it is
     lit in the opening, was the house dead of debt within twelve weeks (precision), and of the
     houses that died, how many heard it at all (recall). `moneyRow` is run beside them on the same
     weeks as the control. */
  const CAND = {
    moneyRow:    d => { try { return !!A.moneyRow(d); } catch(e){ return false; } },
    thin:        d => A.activeG(d).length <= 3 && (A.runway(d) || 0) < 12,
    losing:      d => d.week >= 12 && A.activeG(d).reduce((n,g)=>n+(g.wins||0),0) <= 1,
    losingShort: d => d.week >= 12 && A.activeG(d).reduce((n,g)=>n+(g.wins||0),0) <= 1 && (A.runway(d) || 0) < 15,
    noAsset:     d => { const m = A.activeG(d); const b = m.reduce((x,g)=> Math.max(x, A.gladValue(g)), 0);
                        return b < 600 && (A.runway(d) || 0) < 15; },
  };
  const CK = Object.keys(CAND);
  const pr = {}; for(const k of CK) pr[k] = { lit:0, hit:0, reached:new Set(), firstLead:[] };
  const OPEN_TO = 45, HORIZON = 12;

  const groups = { debt:{}, other:{}, alive:{} };
  for(const g of Object.keys(groups)) for(const m of MARKS){ groups[g][m] = {}; for(const k of KEYS) groups[g][m][k] = []; }
  const counts = { debt:0, other:0, alive:0, kinds:{} };
  const deathWeeks = [];

  for(let hh=0; hh<H; hh++){
    const d = A.newGameState("Op"+hh, "clean", `${SEED}-${hh}`);
    const marks = {}, lit = {};
    let prevGold = d.gold; const netHist = [];
    for(let w=0; w<W; w++){
      if(d.over) break;
      const bill = A.weeklyBill(d);
      if(MARKS.includes(d.week)) marks[d.week] = snap(d, netHist.length ? netHist.slice(-8).reduce((s,x)=>s+x,0)/Math.min(8,netHist.length) : 0);
      if(d.week <= OPEN_TO){ for(const k of CK){ let on = false; try { on = !!CAND[k](d); } catch(e){}
        if(on) lit[k] = (lit[k]||[]).concat(d.week); } }
      try { R.lanista(d); } catch(e){ break; }
      netHist.push((d.gold - prevGold) + bill); prevGold = d.gold;
    }
    /* the class: what happened by week CUT */
    const kind = d.over ? d.over.kind : "alive";
    let cls;
    if(!d.over || d.week > CUT) cls = "alive";
    else if(kind === "debt") cls = "debt";
    else cls = "other";
    if(d.over && d.week <= CUT){ counts.kinds[kind] = (counts.kinds[kind]||0)+1; deathWeeks.push(d.week); }
    counts[cls]++;
    { const died = (cls === "debt"), dw = d.week;
      for(const k of CK){ const weeks = lit[k] || [];
        pr[k].lit += weeks.length;
        for(const w of weeks) if(died && dw - w <= HORIZON && dw >= w) pr[k].hit++;
        if(died && weeks.length && dw - weeks[weeks.length-1] <= HORIZON){
          pr[k].reached.add(hh); pr[k].firstLead.push(dw - weeks[0]); } } }
    for(const m of MARKS){ const s = marks[m]; if(!s) continue;
      for(const k of KEYS) groups[cls][m][k].push(s[k]); }
  }

  /* the separation: at each mark, each quantity's quartiles for the two groups that matter, and a
     rank statistic — the share of (dier, survivor) pairs where the survivor is higher. 50 is no
     separation at all; the further from 50, the more the quantity knows. */
  const sep = {};
  for(const m of MARKS){
    sep[m] = {};
    for(const k of KEYS){
      const A1 = groups.debt[m][k], B1 = groups.alive[m][k];
      if(!A1.length || !B1.length){ sep[m][k] = null; continue; }
      let hi = 0, tie = 0;
      for(const a of A1) for(const b of B1){ if(b > a) hi++; else if(b === a) tie++; }
      const auc = (hi + tie/2) / (A1.length * B1.length);
      sep[m][k] = { died:q(A1), lived:q(B1), auc:Math.round(auc*1000)/10 };
    }
  }
  return { houses:H, cut:CUT, marks:MARKS, counts, deathWeeks:q(deathWeeks), keys:KEYS, sep,
    RUNWAY_WARN:A.RUNWAY_WARN,
    alarms: Object.fromEntries(CK.map(k=>[k, {
      weeksLit:pr[k].lit,
      precision: pr[k].lit ? Math.round(1000*pr[k].hit/pr[k].lit)/10 : 0,
      reachedOfDebtDeaths: counts.debt ? Math.round(1000*pr[k].reached.size/counts.debt)/10 : 0,
      leadWeeks: q(pr[k].firstLead) }])),
    /* the share of each group already lit at each checkpoint — the number that decides the phase */
    warnedAt: Object.fromEntries(MARKS.map(m=>[m, {
      died: groups.debt[m].warned.length ? Math.round(1000*groups.debt[m].warned.reduce((s,x)=>s+x,0)/groups.debt[m].warned.length)/10 : null,
      lived: groups.alive[m].warned.length ? Math.round(1000*groups.alive[m].warned.reduce((s,x)=>s+x,0)/groups.alive[m].warned.length)/10 : null }])) };
}, [H,W,SEED,CUT]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
if(!out.counts.debt) console.log("!! no house died of debt before the cut — every separation below is empty");
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
