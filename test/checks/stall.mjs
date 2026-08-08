/* THE BLOCK, WHICH NO CHECK COULD REFRESH.

   `makeMarket` was not on the handle, nor were the doctore's market, the staff
   market or `liquidate`. The only way to see a second stall was to drive three
   whole weeks, so nothing ever asked the block what it was offering under a given
   state — and the consequence is on the record twice. The v2.52.0 consolidation
   pass discarded an entire block battery that called `A.makeMarket`, found it
   undefined, and silently measured the founding stall five times over, reading
   flat where the truth is steep. And the steepness itself went unnoticed through
   v2.50.0, a release whose whole content was changing the number the block reads.

   So: the block follows the house's name, and that has to stay measurable. What
   this holds is the shape rather than the values, because the values are what a
   repricing is allowed to move — the stall must improve with acclaim, it must cost
   more as it improves, roughly a third of it must be carrying something hidden,
   and the four sellers must remain four different places to shop. And the seller's
   account must contain the truth: every band he quotes has to hold the real man,
   because the one thing the block may never do is lie about the band. */

import { hasHandle } from "../harness.mjs";

export const name = "stall";
export const describe = "the block follows the house, and every band holds the truth";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const av = f => (f.str+f.agi+f.end+f.tec+f.sho+f.dis)/6;
    const R = {};

    /* ---- 1. the stall against the house's name ---- */
    R.byName = [];
    for(const acc of [10, 40, 72, 95]){
      let n=0, sum=0, price=0, fine=0, flawed=0, best=0;
      for(let i=0;i<40;i++){
        const d = A.newGameState("St","clean","STALL"+acc+"_"+i,null);
        d.fame = 6000; d.acclaim = acc;
        A.makeMarket(d);                       /* the thing nothing could call */
        for(const m of (d.market||[])){
          const a = av(m); n++; sum+=a; price+=m.price; best=Math.max(best,a);
          if(a>=70) fine++;
          if(m.flaw) flawed++;
        }
      }
      R.byName.push({ acclaim:acc, men:n, meanStat:+(sum/n).toFixed(1), bestSeen:Math.round(best),
        finePct:+(100*fine/n).toFixed(1), flawedPct:+(100*flawed/n).toFixed(1),
        meanPrice:Math.round(price/n) });
    }

    /* ---- 2. the four sellers are four different places ---- */
    const per = {};
    for(let i=0;i<220;i++){
      const d = A.newGameState("Sl","clean","SELL"+i,null);
      d.fame = 3000; d.acclaim = 50;
      A.makeMarket(d);
      for(const m of (d.market||[])){
        if(!m.slaver) continue;
        const s = per[m.slaver] || (per[m.slaver] = { n:0, sum:0, price:0, flawed:0 });
        s.n++; s.sum += av(m); s.price += m.price; if(m.flaw) s.flawed++;
      }
    }
    R.sellers = Object.entries(per).map(([k,s])=>({ slaver:k, n:s.n,
      meanStat:+(s.sum/s.n).toFixed(1), meanPrice:Math.round(s.price/s.n),
      flawedPct:+(100*s.flawed/s.n).toFixed(1) })).sort((a,b)=>a.meanPrice-b.meanPrice);

    /* ---- 3. every band he quotes holds the real man ----
       Compared against the man as the PLAYER sees him, which is rounded. A flaw or a
       story multiplies a stat, so 83% of the block carries fractional numbers, and
       the first version of this compared 46.1 against a scouted band of [46,46] and
       reported a quarter of the block lying about itself. Measured: with rounding,
       whole-number failures were exactly zero and fractional ones 1,192 of 1,192. */
    let bands=0, held=0, widthSeller=0, widthDoc=0, widthScout=0;
    for(let i=0;i<160;i++){
      const d = A.newGameState("Bd","clean","BAND"+i,null);
      d.fame = 3000;
      A.makeMarket(d);
      for(const m of (d.market||[])){
        for(const k of A.STATS){
          const truth = Math.round(m[k]);
          for(const lvl of [0,1,2]){
            const b = A.bandOf(truth, lvl);
            if(b == null) continue;
            const lo = b.lo!=null ? b.lo : (Array.isArray(b) ? b[0] : null);
            const hi = b.hi!=null ? b.hi : (Array.isArray(b) ? b[1] : null);
            if(lo == null || hi == null) continue;
            bands++;
            if(truth >= lo && truth <= hi) held++;
            const w = hi - lo;
            if(lvl===0) widthSeller += w; else if(lvl===1) widthDoc += w; else widthScout += w;
          }
        }
      }
    }
    R.bands = { checked:bands, heldPct: bands ? +(100*held/bands).toFixed(1) : null,
      meanWidth: bands ? { seller:+(widthSeller/(bands/3)).toFixed(1),
        doctore:+(widthDoc/(bands/3)).toFixed(1), scouted:+(widthScout/(bands/3)).toFixed(1) } : null };

    /* ---- 4. and the other three markets answer at all ---- */
    { const d = A.newGameState("Mk","clean","MKTS",null);
      d.fame = 3000; d.gold = 9000;
      A.makeDoctoreMarket(d); A.makeStaffMarket(d);
      const sm = d.staffMarket || {};
      R.others = { doctores:(d.doctoreMarket||[]).length,
        staffKinds:Object.keys(sm).length,
        staffMen:Object.values(sm).reduce((n,v)=>n+((v&&v.length)||0),0) }; }

    /* ---- 5. liquidate quotes what the fire sale would raise ---- */
    { const d = A.newGameState("Lq","clean","LIQ",null);
      d.gold = 3000;
      for(let i=0;i<4;i++){ const m = A.genGladiator(d, 70); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); d.gladiators.push(m); }
      d.gear = { gladius:2, scutum:1 };
      const q = A.liquidate(d);
      const before = d.gold, menBefore = A.activeG(d).length;
      const done = A.sellTheHouse(d);
      R.fire = { quotedMen:q.menN, quotedTotal:q.total, raised:Math.round(d.gold-before),
        menBefore, menAfter:A.activeG(d).length, ranTotal:done ? done.total : null }; }

    return R;
  });

  const lines = [], fails = [];
  lines.push("the block against the house's name:");
  for(const r of out.byName)
    lines.push(`   acclaim ${String(r.acclaim).padStart(2)} → mean ${r.meanStat} · best ${r.bestSeen} · fine ${r.finePct}% · flawed ${r.flawedPct}% · ${r.meanPrice}d`);
  lines.push("the four who sell men:");
  for(const s of out.sellers)
    lines.push(`   ${s.slaver.padEnd(9)} ${String(s.meanPrice).padStart(4)}d · mean ${s.meanStat} · ${s.flawedPct}% carrying something`);
  lines.push(`${out.bands.checked} quoted bands, ${out.bands.heldPct}% of them holding the real man ` +
    `(widths: seller ±${(out.bands.meanWidth.seller/2).toFixed(0)}, doctore ±${(out.bands.meanWidth.doctore/2).toFixed(0)}, scouted ±${(out.bands.meanWidth.scouted/2).toFixed(0)})`);
  lines.push(`${out.others.doctores} doctores, ${out.others.staffMen} staff across ${out.others.staffKinds} trades`);
  lines.push(`the fire sale quoted ${out.fire.quotedTotal}d and raised ${out.fire.raised}d, leaving ${out.fire.menAfter} of ${out.fire.menBefore} men`);

  /* ---- the stall follows the name ---- */
  const lo = out.byName[0], hi = out.byName[out.byName.length-1];
  if(!(hi.meanStat > lo.meanStat + 4))
    fails.push(`the block reads mean ${lo.meanStat} at acclaim ${lo.acclaim} and ${hi.meanStat} at ${hi.acclaim} — it no longer follows the house's name`);
  if(!(hi.finePct > lo.finePct))
    fails.push(`fine men are no commoner at a famous house (${lo.finePct}% against ${hi.finePct}%)`);
  if(!(hi.meanPrice > lo.meanPrice))
    fails.push(`a better stall is not dearer — ${lo.meanPrice}d against ${hi.meanPrice}d`);
  for(const r of out.byName){
    if(!(r.flawedPct > 8 && r.flawedPct < 62))
      fails.push(`at acclaim ${r.acclaim}, ${r.flawedPct}% of the block is carrying something — about a third is the intent`);
  }
  /* ---- and the four remain four ---- */
  if(out.sellers.length < 4) fails.push(`only ${out.sellers.length} sellers ever appeared`);
  else {
    const cheap = out.sellers[0], dear = out.sellers[out.sellers.length-1];
    if(!(dear.meanPrice > cheap.meanPrice * 1.6))
      fails.push(`the dearest stall asks ${dear.meanPrice}d against the cheapest ${cheap.meanPrice}d — the four have collapsed into one`);
    if(!(cheap.flawedPct > dear.flawedPct))
      fails.push(`the cheap stall is no likelier to be hiding something (${cheap.flawedPct}% against ${dear.flawedPct}%) — that is the whole trade`);
  }
  /* ---- the band may be generous but it may not be false ---- */
  if(out.bands.checked < 100) fails.push(`only ${out.bands.checked} bands could be read — the account is not being quoted`);
  if(out.bands.heldPct !== null && out.bands.heldPct < 100)
    fails.push(`${(100-out.bands.heldPct).toFixed(1)}% of quoted bands do not contain the real man — the seller may flatter, never lie about the band`);
  if(out.bands.meanWidth && !(out.bands.meanWidth.seller > out.bands.meanWidth.doctore && out.bands.meanWidth.doctore >= out.bands.meanWidth.scouted))
    fails.push(`knowing more does not narrow the band: seller ${out.bands.meanWidth.seller}, doctore ${out.bands.meanWidth.doctore}, scouted ${out.bands.meanWidth.scouted}`);

  /* ---- and the other markets answer ---- */
  if(!(out.others.doctores > 0)) fails.push("the doctore's market came back empty");
  if(!(out.others.staffMen > 0)) fails.push("the staff market came back empty");

  /* ---- the fire sale quotes what it then does ---- */
  if(!(out.fire.quotedTotal > 0)) fails.push("liquidate quoted nothing for a house with men and steel");
  if(!(out.fire.raised > 0)) fails.push("selling the house raised nothing");
  if(out.fire.menAfter !== 1)
    fails.push(`the fire sale left ${out.fire.menAfter} men — it is supposed to leave exactly the one you keep`);
  if(Math.abs(out.fire.raised - out.fire.quotedTotal) > Math.max(60, out.fire.quotedTotal*0.2))
    fails.push(`liquidate quoted ${out.fire.quotedTotal}d and the sale raised ${out.fire.raised}d — the figure the player decides on is not the figure he gets`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
