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
   because the one thing the block may never do is lie about the band.


   And the block is also where the rarest thing in the game stands. `paragonWeek` puts
   the man the whole town came to look at at the head of `d.market` and writes his name
   into `paragonSeen`, of which a house gets two in its life — and the three-weekly
   refresh ran fifty-six lines later in the same `endWeek` and began by throwing the
   stall away. Measured over twenty houses run four hundred weeks: five paragons
   generated, **one** ever standing there when the player looked. So the fire sale, which
   is the answer to him, was content almost nobody could reach, and the "it would be
   enough" branch of that screen had never once been true. */

import { hasHandle } from "../harness.mjs";

export const name = "stall";
export const describe = "the block follows the house, every band holds the truth, and the paragon survives it";

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
      /* ---- AND WHETHER THE MEN IT SOLD HAVE ACTUALLY LEFT, from v2.92.0 ----
         `sellTheHouse` sets `m.status = "sold"` and leaves the row in the roster, the way death and
         retirement do. "sold" was missing from `GONE`, so those men stayed `!isGone` for ever and
         `onTheBooks` went on counting them — measured at 7 for a stripped seven-man house with one
         man left. That number gates the only two things that matter to a house in exactly this
         position: `slaverAtTheGate` (the way back from an empty yard) and the `emptied` ending (the
         way out). Both are `onTheBooks(d) === 0`, so a stripped house could neither recover nor
         finish. Held here because this is the only check that strips a house. */
      R.fire = { quotedMen:q.menN, quotedTotal:q.total, raised:Math.round(d.gold-before),
        menBefore, menAfter:A.activeG(d).length, ranTotal:done ? done.total : null,
        onBooks:A.onTheBooks(d), sold:d.gladiators.filter(g=>g.status==="sold").length,
        soldIsGone:(A.GONE||[]).includes("sold") }; }

    /* ---- 6. THE PARAGON, WHO MUST SURVIVE THE BLOCK HE STANDS ON ---- */
    R.par = {};
    { /* a house that could plausibly get there: coin, steel on the racks, spare men */
      const rich = (seed, gold)=>{
        const d = A.newGameState("Pg","clean",seed,null);
        d.gold = gold; d.fame = 3000; d.week = 60;
        for(let i=0;i<5;i++){ const m = A.genGladiator(d, 74); m.id=d.nextId++; m.status="active";
          m.mine=true; m.kit=A.defaultKit(m.cls); m.wins=5; d.gladiators.push(m); }
        return d;
      };

      /* he is put on the block, then the block is refreshed under him */
      const d = rich("PGSURV", 9000);
      const g = A.makeParagon(d);
      d.market = [g, ...(d.market||[])];
      d.flags.paragonWeek = d.week;
      const there = !!A.paragonOf(d);
      A.makeMarket(d);                          /* the three-weekly sweep */
      const survivedRefresh = !!A.paragonOf(d) && A.paragonOf(d).id === g.id;
      A.marketWeek(d);
      const survivedWeek = !!A.paragonOf(d);
      /* and the whole of the week, which is where it actually went wrong */
      let survivedWeeks = 0;
      for(let w=0; w<3 && A.paragonOf(d); w++){ d.pendingEvent = null;
        try { A.endWeek(d); } catch(e){ break; }
        if(A.paragonOf(d)) survivedWeeks++; }
      R.par.stands = { there, survivedRefresh, survivedWeek, survivedWeeks,
        price:g.price, quality:+av(g).toFixed(1) };

      /* the three answers the screen has, driven against three houses */
      const answers = [];
      for(const [label, gold] of [["a house that can pay", 20000], ["a house that must strip itself", 7000], ["a house that cannot", 400]]){
        const e = rich("PGANS"+gold, gold);
        const p2 = A.makeParagon(e); p2.price = 9000;
        e.market = [p2, ...(e.market||[])];
        const L = A.liquidate(e, p2), reach = A.paragonReach(e, p2);
        answers.push({ label, gold, price:p2.price, fire:L.total, short:reach.short,
          canNow: e.gold >= p2.price, canAfter: e.gold + L.total >= p2.price });
      }
      R.par.answers = answers;

      /* the sighting gate: a house nowhere near him is not shown him, and does not
         spend one of the two he will ever be offered on a morning it can do nothing with */
      const gate = (gold)=>{
        const e = rich("PGGATE"+gold, gold);
        let rolls = 0, shown = 0;
        for(let w=0; w<400 && !A.paragonOf(e); w++){ rolls++;
          e.flags.paragonDone = 0; A.paragonWeek(e); if(A.paragonOf(e)) shown++; }
        return { gold, shown, names:(e.flags.paragonSeen||[]).length, rolls };
      };
      R.par.gate = { rich: gate(20000), poor: gate(150), reach:A.PARAGON_REACH };

      /* and he does not stay: three weeks, then somebody else has him */
      { const e = rich("PGGO", 400);
        const p3 = A.makeParagon(e); e.market = [p3, ...(e.market||[])]; e.flags.paragonWeek = e.week;
        let weeks = 0;
        for(let w=0; w<10 && A.paragonOf(e); w++){ weeks++; e.week++; A.paragonExpire(e); }
        R.par.gone = { weeks, left:!A.paragonOf(e), done:e.flags.paragonDone||0 }; }

      /* a wall, or a gap? `paragonDone` was checked before the cap of two, so the cap
         was dead code and no house was ever shown a second */
      { const e = rich("PGTWO", 20000);
        e.flags.paragonDone = e.week;                        /* one has already come and gone */
        let atOnce = 0, afterGap = 0;
        for(let i=0;i<80;i++){ A.paragonWeek(e); if(A.paragonOf(e)){ atOnce++; break; } }
        e.week += A.PARAGON_GAP + 1;
        for(let i=0;i<400 && !afterGap;i++){ A.paragonWeek(e); if(A.paragonOf(e)) afterGap++; }
        R.par.second = { atOnce, afterGap, gap:A.PARAGON_GAP, cap:A.PARAGONS.length }; }
    }

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
  const P = out.par;
  lines.push(`the paragon (${P.stands.price}d, mean ${P.stands.quality}): survived the refresh ${P.stands.survivedRefresh}, the market week ${P.stands.survivedWeek}, ${P.stands.survivedWeeks} whole weeks`);
  for(const a of P.answers)
    lines.push(`   ${a.label.padEnd(30)} ${String(a.gold).padStart(5)}d + ${String(a.fire).padStart(5)}d of house → ${a.canNow ? "pay it" : a.canAfter ? "TAKE THE HOUSE APART" : "not even then"}`);
  lines.push(`   shown to a house within ${Math.round(P.gate.reach*100)}% of him: ${P.gate.rich.shown} · to one nowhere near: ${P.gate.poor.shown} (and ${P.gate.poor.names} names spent)`);
  lines.push(`   he leaves after ${P.gone.weeks} weeks · a second one after the ${P.second.gap}-week gap: ${!!P.second.afterGap}, before it: ${!P.second.atOnce}`);

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

  /* ---- and the man the whole town came to look at is still there when it does ---- */
  if(!P.stands.there) fails.push("a paragon put on the block is not on the block");
  if(!P.stands.survivedRefresh)
    fails.push("the three-weekly refresh swept the paragon off the block — this is the v2.59.0 fault, and it costs the house one of the two it will ever be offered without a word on screen");
  if(!P.stands.survivedWeek) fails.push("marketWeek took the paragon off the block");
  if(P.stands.survivedWeeks < 2)
    fails.push(`the paragon lasted ${P.stands.survivedWeeks} whole weeks of play — he is advertised as three weeks to decide`);
  /* all three answers the screen has must be answers something can reach */
  const A3 = P.answers;
  if(!A3[0].canNow) fails.push(`a house with ${A3[0].gold}d cannot pay ${A3[0].price}d for him`);
  if(A3[1].canNow || !A3[1].canAfter)
    fails.push(`the middle answer is dead: a house with ${A3[1].gold}d and ${A3[1].fire}d of house to sell reads "${A3[1].canNow?"pay it":"not even then"}" — that branch of the screen has text written for it and no state that reaches it`);
  if(A3[2].canAfter) fails.push("a house with nothing can strip itself into a paragon — the refusal never fires");
  /* the sighting gate */
  if(!P.gate.rich.shown) fails.push("a house well within reach of a paragon is never shown one");
  if(P.gate.poor.shown) fails.push("a house nowhere near the price is shown a paragon it can do nothing about");
  if(P.gate.poor.names) fails.push(`${P.gate.poor.names} of the two paragons a house is ever offered were spent on a morning it could not act on`);
  /* he goes, and a house that lives long enough may see one more */
  if(!P.gone.left) fails.push(`the paragon is still on the block after ${P.gone.weeks} weeks — he is supposed to be bought by somebody else`);
  if(!P.gone.done) fails.push("a paragon left without recording that he had come and gone");
  if(P.second.atOnce) fails.push(`a second paragon appeared inside the ${P.second.gap}-week gap`);
  /* the stripped house's books */
  lines.push(`stripped: ${out.fire.menBefore} men → ${out.fire.menAfter} active, ${out.fire.sold} sold, `
    + `ON THE BOOKS ${out.fire.onBooks} — "sold" counts as gone: ${out.fire.soldIsGone}`);
  if(!out.fire.soldIsGone)
    fails.push(`"sold" is not in \`GONE\`, so a man sold by \`sellTheHouse\` is never \`isGone\` and `
      + `\`onTheBooks\` keeps counting him. That gates \`slaverAtTheGate\` and the \`emptied\` ending, `
      + `both on \`onTheBooks(d) === 0\` — so a house that has just sold everything to stay alive can `
      + `neither be offered the slaver nor ever finish`);
  else if(out.fire.onBooks !== out.fire.menAfter)
    fails.push(`a stripped house has ${out.fire.menAfter} men active but ${out.fire.onBooks} on the books — `
      + `the two should agree once every sold man is gone, and the gap is what blocked the slaver and `
      + `the \`emptied\` ending before v2.92.0`);

  if(!P.second.afterGap)
    fails.push(`no second paragon after ${P.second.gap} weeks — paragonDone is a wall again and the cap of two is dead code, so no house is ever shown more than one`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
