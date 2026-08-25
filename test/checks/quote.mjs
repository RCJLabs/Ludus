/* HE CAN AFFORD EXACTLY WHAT HE IS QUOTED, AND NOT A DENARIUS LESS

   The audit's last unmeasured item: eleven functions — `gearPrice`, `rudisCost`, `canAffordRudis`,
   `pitPurse`, `cityPurse`, `cityMissio`, `owedTotal`, `loanLender`, `canBorrow`, `lanVig`,
   `gladValue` — are every price the player is quoted, and no check asserted on one of them.

   THE USELESS VERSION OF THIS CHECK asks whether they return positive numbers. The useful one asks
   #150's question: is the number on the button the number that leaves the strongbox? A priced
   action carries THREE numbers, written in three different places —

     QUOTE   what the panel renders
     GUARD   what the affordability test compares gold against
     CHARGE  what is actually subtracted

   — and nothing held them to each other. Both faults that finds are real and both were live:

   `buyGearItem` guarded on `it.price`, the LIST price, and charged `gearPrice`, the price after the
   armamentarium, the armourer, the doctrine, the perk and the festival. Every multiplier is <= 1,
   so it was uniformly TOO STRICT — **140 of 210 item-and-level combinations refused a purchase the
   player could pay for**, the window reaching 3,990d on a 9,500d item. Its chronicle line then
   reported the list price while the discounted one had left the purse.

   `grantRudis` asked `rudisEligible` twenty lines AFTER taking the fee, writing "the manumission is
   written and paid for", clearing his plan and applying the favour loss. On a man who did not
   qualify: **206 denarii taken, granted false, still a slave.**

   SO THE CONTRACT IS ONE SENTENCE A PLAYER WOULD RECOGNISE, and it is tested in both directions
   because a guard can be wrong either way: set his gold to the quote and the action must go through
   and leave nothing; set it a denarius short and it must refuse and take nothing. A guard that is
   too strict fails the first, a guard that is too lax fails the second, and only running both can
   tell them apart.

   It drives the real mutators rather than re-deriving prices — a check that recomputes the price it
   is checking proves nothing about the code that charges it.
*/
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "quote";
export const describe = "he can afford exactly what he is quoted, and not a denarius less";

/* every armamentarium level, because the level is what moves the multiplier and a check run only at
   level 0 sees quote === list and passes on all 210 items while the game is broken at every other */
const LEVELS = [0, 1, 2, 3, 4];

export async function run({ p, errors }){
  const bad = [], lines = [];
  await found(p, { seed:"QUOTE" });
  await clearAll(p);
  await installRope(p);

  const out = await p.evaluate(([LEVELS])=>{
    const A = window.__LVDVS;
    if(!A.GEAR || !A.gearPrice || !A.buyGearItem) return { missing:true };
    const rows = [];
    const fresh = (tag, mut) => { const d = A.newGameState("Q","clean","QUOTE-"+tag,null);
      d.gold = 100000; if(mut) mut(d); return d; };

    for(const lvl of LEVELS){
      const arm = d => { d.buildings = d.buildings||{}; d.buildings.armamentarium = lvl; };
      for(const [id, it] of Object.entries(A.GEAR)){
        if(!it || !(it.price > 0)) continue;
        const quote = A.gearPrice(fresh("q", arm), it.price, it.slot);
        const atA = fresh("a", d=>{ arm(d); d.gold = quote; });
        const okA = A.buyGearItem(atA, id);
        const atB = fresh("b", d=>{ arm(d); d.gold = quote - 1; });
        const okB = A.buyGearItem(atB, id);
        rows.push({ what:`gear ${id} @arm${lvl}`, quote, list:it.price,
          gotAt:!!okA, leftAt:Math.round(atA.gold), gotShort:!!okB, leftShort:Math.round(atB.gold) });
      }
    }

    /* the rudis, and then the same call on a man who does not qualify */
    let inel = null;
    {
      const mk = (gold, ok) => { const d = fresh("r"); const g = d.gladiators.find(x=>x.status==="active");
        if(!g) return null;
        g.wins = ok ? 40 : 0; g.pfame = ok ? 400 : 0; g.auctor = null; d.gold = gold; return { d, g }; };
      const base = mk(100000, true);
      if(base){
        const quote = A.rudisCost(base.d, base.g);
        const a = mk(quote, true), b = mk(quote - 1, true);
        rows.push({ what:"the rudis", quote, list:quote,
          gotAt:!!A.grantRudis(a.d, a.g.id), leftAt:Math.round(a.d.gold),
          gotShort:!!A.grantRudis(b.d, b.g.id), leftShort:Math.round(b.d.gold) });
        const c = mk(100000, false), before = c.d.gold;
        const okC = A.grantRudis(c.d, c.g.id);
        inel = { granted:!!okC, took:Math.round(before - c.d.gold), status:c.g.status };
      }
    }
    /* ---- AND NO PRICE IS EVER NaN ----
       `gladValue` read `g.potential` and `g.age`, which `genGladiator` and `makeRivalFighter` set
       and `genOpponent` does not — so it returned NaN on an arena opponent, `rudisCost` inherited
       it, and `grantRudis`'s old guard `if(d.gold < fee)` is FALSE against NaN, so it fell through
       and set the treasury to NaN. Every price is handed a man from each of the three makers. */
    const nan = [];
    {
      const d0 = fresh("nan");
      const men = [];
      if(A.genGladiator) men.push(["genGladiator", A.genGladiator(d0, 60)]);
      if(A.genOpponent)  men.push(["genOpponent",  A.genOpponent(2, 78, d0)]);
      if(A.makeRivalFighter) men.push(["makeRivalFighter", A.makeRivalFighter(d0, "Solonius", 60)]);
      for(const [maker, m] of men){
        for(const [fn, call] of [["gladValue", ()=>A.gladValue(m)], ["rudisCost", ()=>A.rudisCost(d0, m)]]){
          let v; try { v = call(); } catch(e){ v = "threw: " + e.message; }
          if(typeof v !== "number" || !Number.isFinite(v)) nan.push({ maker, fn, v:String(v) });
        }
      }
    }
    /* and the loan, which is the same contract read from the other side */
    let loan = null;
    if(A.borrow && A.LENDERS){
      const who = Object.keys(A.LENDERS)[0];
      const d = fresh("l"); const g0 = d.gold;
      const first = A.borrow(d, who, 200);
      const gain = Math.round(d.gold - g0);
      const second = A.borrow(d, who, 200);          /* a second loan must be refused */
      loan = { first:!!first, gain, principal: d.loan ? Math.round(d.loan.principal) : null, second:!!second };
    }
    return { rows, inel, loan, nan };
  }, [LEVELS]);

  if(!out || out.missing) return { pass:false, why:"__LVDVS does not export the money handles", lines };
  const rows = out.rows;
  /* a run that priced nothing proves nothing */
  if(rows.length < 50)
    return { pass:false, lines, why:`only ${rows.length} priced actions could be reached — too few to hold anything to` };

  const strict = rows.filter(r => !r.gotAt || r.leftAt !== 0);
  const lax    = rows.filter(r => r.gotShort || r.leftShort !== r.quote - 1);
  lines.push(`${rows.length} priced actions, each at its own quote and a denarius under it`);
  lines.push(`  discounted below list: ${rows.filter(r=>r.quote < r.list).length} of them`);
  /* ONE ENTRY PER FAULT, NOT PER INSTANCE. The first cut pushed one `bad` per failing item and a
     single wrong guard on gear produced 280 of them, which crowded the rudis and the loan — the
     more serious findings, since those take the player's money — clean out of the reported reason.
     A check that finds three faults must say three things. */
  if(strict.length){
    const w = strict.reduce((m,r)=> (r.list - r.quote) > (m.list - m.quote) ? r : m, strict[0]);
    bad.push(`${strict.length} of ${rows.length} priced actions were refused with EXACTLY their own quote in `
      + `the strongbox — the guard is not testing the price on the button. Worst: "${w.what}" quoted `
      + `${w.quote} against a list price of ${w.list}, so a window ${w.list - w.quote}d wide is refused `
      + `to a player who can pay`);
    for(const r of strict.slice(0,2)) lines.push(`    refused at its quote: ${r.what} — quote ${r.quote}, list ${r.list}`);
  }
  if(lax.length){
    const w = lax[0];
    bad.push(`${lax.length} priced actions went through on a denarius LESS than their own quote — worst `
      + `"${w.what}", quoted ${w.quote} and bought on ${w.quote - 1}, which is how gold goes negative`);
  }
  if(strict.length) lines.push(`  ${strict.length} refused at their own quote`);
  if(lax.length) lines.push(`  ${lax.length} bought under their own quote`);

  if(out.inel){
    lines.push(`the rudis on a man who does not qualify: granted ${out.inel.granted}, `
      + `${out.inel.took}d taken, he is ${out.inel.status}`);
    if(!out.inel.granted && out.inel.took > 0)
      bad.push(`granting the rudis to a man who does not qualify took ${out.inel.took} denarii and left him `
        + `a slave — the eligibility question is being asked after the fee, so the player pays for nothing`);
    if(out.inel.granted)
      bad.push(`a man who does not qualify was freed anyway — rudisEligible is not gating grantRudis`);
  }
  if(out.nan){
    lines.push(`prices on a man from each maker: ${out.nan.length ? out.nan.length + " NOT FINITE" : "all finite"}`);
    for(const n of out.nan.slice(0,3))
      bad.push(`${n.fn} on a man from ${n.maker} returned ${n.v} — a price that is not a number reaches `
        + `\`d.gold -=\` through every guard, because every comparison against NaN is false, and sets `
        + `the treasury to NaN`);
  }
  if(out.loan){
    lines.push(`the loan: taken ${out.loan.first}, ${out.loan.gain}d in hand against a principal of `
      + `${out.loan.principal}, a second while it stands: ${out.loan.second}`);
    if(out.loan.first && out.loan.gain !== out.loan.principal)
      bad.push(`the lender counted out ${out.loan.gain} and booked a principal of ${out.loan.principal} — `
        + `the money that arrived is not the money that is owed`);
    if(out.loan.second) bad.push("a second loan was taken while the first still stands — canBorrow is not gating borrow");
  }
  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push("every price on a button is the price in the guard and the price out of the purse");
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
