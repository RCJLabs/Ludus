/* THE LAW IS ANSWERABLE AT HOME — #313

   #312 found that a house that never leaves Capua died of debt five times as often as one that tours,
   and that the difference was the law: an inspector's fine in 50 of the 56 staying houses' debt
   deaths, and the ban that heat ends in. Edicts, heat and the inspector are Capua's alone. #313 asked
   whether a CAREFUL player escapes them, and gave the reference player two opt-in levers to be one:

     comply:true     obeys the edicts the way the game checks them: sells down to the numbers cap
                     (cheapest first, never the last man) and sells the women under the women edict.
                     Buying needs no rule: the cells are full at the cap for everybody. The condemned
                     cannot be sold.
     fines:"read"    pays the inspector only when the card's own count (`fineRead`) says the house stands

   Measured on 160 staying houses an arm (`probes/pooled.mjs`, v3.305.0):

                         debt   banned   good ending   all failures
     as it plays          12%      7%          18%            34%
     fines:"read"          1%     16%          18%            30%    (the unpaid fine's heat finds the breach)
     comply                9%      1%          19%            27%    (gambit heat still brings the inspector)
     both                  2%      3%          23%            19%    touring houses as they play: 18%

   So the law's share is answerable by play: a careful player at home fails as rarely as one on the road.

     1  the levers do what they say, on forged houses: a roster over the numbers cap is sold down to it,
        and never past the last man that can be sold; the cells are full at the cap, which is why
        the lever needs no rule for buying; the women are sold under the women edict; a fine past the creditors'
        line is written down and one inside it is paid. Without the levers, none of it happens.
     2  the finding, on 40 staying houses of WAGON: law endings (debt and banned) under both levers at
        most CARE_MAX, and fewer than the reference player's on the same seeds. Measured per seed set
        of 40: careful 1-2, as it plays 5-10. The bar is a ceiling on "rare", not a balance figure. */
import { installRope } from "../harness.mjs";

export const name = "law";
export const describe = "a house that obeys the edicts and reads the fine before paying escapes Capua's law";
export const slow = true;   /* plays 80 houses of 420 weeks */

const CARE_MAX = 4;
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true };

export async function run({ p }){
  const bad = [], lines = [];
  await installRope(p);

  const r = await p.evaluate(([MOST])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","lawOf","sellMan","genGladiator","fineRead","EVENTS","isGone","activeG"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function") return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };
    const alive = d => d.gladiators.filter(g=>!A.isGone(g));
    const house = (seed, men, law) => {
      const d = A.newGameState("Lw", "clean", seed, null);
      d.week = 40; d.gold = 50000; d.pendingEvent = null;
      d.gladiators = d.gladiators.filter(g=>!A.isGone(g)).slice(0, men);
      while(alive(d).length < men) d.gladiators.push(A.genGladiator(d, 55));
      const L = A.lawOf(d); Object.assign(L, law);
      return d; };
    const out = {};

    /* 1a · sold down to the cap, and the default leaves the yard alone */
    { const d = house("LAW-1", 8, { edicts:["numbers"], cap:5 });
      const did = R.lanista(d, { comply:true });
      const e = house("LAW-1", 8, { edicts:["numbers"], cap:5 });
      const didE = R.lanista(e, {});
      out.down = { sold:did["complied:numbers"] || 0, after:alive(d).length, cap:5, defSold:didE["complied:numbers"] || 0, defAfter:alive(e).length }; }
    /* 1b · never the last man that can be sold: four condemned and one free man, cap 4 */
    { const d = house("LAW-2", 5, { edicts:["numbers"], cap:4 });
      A.activeG(d).slice(0, 4).forEach(g=>{ g.damnatus = true; });
      const free = A.activeG(d).find(g=>!g.damnatus);
      const did = R.lanista(d, { comply:true });
      out.last = { sold:did["complied:numbers"] || 0, kept:!!free && !A.isGone(free) && d.gladiators.includes(free) }; }
    /* 1c · and the game already holds purchases at the cap: `cellsCap` reads the edict */
    { const d = house("LAW-3", 4, { edicts:["numbers"], cap:4 }), e = house("LAW-3", 3, { edicts:["numbers"], cap:4 });
      out.buy = { atCap:A.rosterFull(d), below:A.rosterFull(e), cells:A.cellsCap(d) }; }
    /* 1d · the women edict */
    { const d = house("LAW-4", 4, { edicts:["women"] });
      const her = A.activeG(d)[1]; her.sex = "f";
      const did = R.lanista(d, { comply:true });
      const e = house("LAW-4", 4, { edicts:["women"] }); const her2 = A.activeG(e)[1]; her2.sex = "f";
      R.lanista(e, {});
      out.women = { sold:did["complied:women"] || 0, gone:!d.gladiators.includes(her) || A.isGone(her),
        defKept:e.gladiators.includes(her2) && !A.isGone(her2) }; }
    /* 1e · the fine, read: the answer the rope gives, caught at the event */
    { const run0 = A.EVENTS.inspector.run; let seen = [];
      A.EVENTS.inspector.run = function(d, ev, i){ seen.push(i); return run0.call(this, d, ev, i); };
      const card = (d, pay) => { const fine = Math.round(d.gold - A.weeklyBill(d) - pay);
        return { id:"inspector", title:"He Did Not Send Word", text:"t", data:{ fine, breach:[] },
          choices:[`Pay the fine · ${fine}d`, `Buy the tablet · ${Math.round(fine*0.55)}d`, "Let him write it down"] }; };
      const at = (seed, opts, past) => { const d = house(seed, 4, { edicts:[] }); d.gold = 3000;
        const line = A.creditLine(d); d.pendingEvent = card(d, past ? line - 1500 : Math.round(line * 0.3));
        seen = []; R.lanista(d, opts); return seen[0]; };
      out.fine = { past:at("LAW-5", { fines:"read" }, true), inside:at("LAW-5", { fines:"read" }, false),
        defPast:at("LAW-5", {}, true) };
      A.EVENTS.inspector.run = run0; }

    /* 2 · the finding, on 40 staying houses of WAGON */
    const arm = extra => { let law = 0, fail = 0; const ends = {};
      for(let i=0;i<40;i++){
        const d = A.newGameState("Pl", "clean", `WAGON-${i}`);
        const opts = Object.assign({}, MOST, { road:false }, extra);
        for(let w=0; w<420 && !d.over; w++){ try { R.lanista(d, opts); } catch(e){} }
        const k = d.over ? String(d.over.kind || d.over) : "alive";
        ends[k] = (ends[k] || 0) + 1;
        if(k === "debt" || k === "banned") law++;
        if(k !== "alive" && k !== "closed") fail++;
      }
      return { law, fail, ends }; };
    out.ref = arm({}); out.care = arm({ comply:true, fines:"read" });
    return out;
  }, [MOST]);
  if(r.why) return { pass:false, why:r.why, lines };

  const { down, last, buy, women, fine, ref, care } = r;
  lines.push(`the numbers edict, cap ${down.cap}, eight men: comply sold ${down.sold} and kept ${down.after} · the default sold ${down.defSold} and kept ${down.defAfter}`);
  if(!(down.after <= down.cap)) bad.push(`comply left ${down.after} men under a cap of ${down.cap}`);
  if(down.sold < 1) bad.push("comply sold nobody under a numbers edict with the roster over the cap");
  if(down.defSold) bad.push("the reference player sold men for the law with the lever off");
  lines.push(`four condemned and one free man, cap 4: comply sold ${last.sold} · the free man kept: ${last.kept}`);
  if(last.sold || !last.kept) bad.push("comply sold the last man it could sell");
  lines.push(`the cells under a numbers cap of 4: ${buy.cells} places · full at four men: ${buy.atCap} · full at three: ${buy.below}`);
  if(buy.cells !== 4 || !buy.atCap || buy.below) bad.push("the cells no longer read the numbers edict, and `comply` has no rule of its own for buying — it relies on this");
  lines.push(`the women edict: comply sold ${women.sold}, and she is gone: ${women.gone} · the default kept her: ${women.defKept}`);
  if(!women.sold || !women.gone) bad.push("comply kept a woman under the women edict");
  if(!women.defKept) bad.push("the reference player sold a woman for the law with the lever off");
  lines.push(`the fine: fines:"read" answers ${fine.past} to one past the line and ${fine.inside} to one inside it · the default answers ${fine.defPast}`);
  if(fine.past !== 2) bad.push(`fines:"read" paid a fine past the creditors' line (answered ${fine.past})`);
  if(fine.inside !== 0) bad.push(`fines:"read" refused a fine the house could stand (answered ${fine.inside})`);
  if(fine.defPast !== 0) bad.push(`the reference player's default answer to the inspector changed (answered ${fine.defPast})`);
  lines.push(`40 staying houses of WAGON: law endings ${ref.law} as it plays, ${care.law} careful · all failures ${ref.fail} and ${care.fail}`);
  lines.push(`   as it plays ${JSON.stringify(ref.ends)} · careful ${JSON.stringify(care.ends)}  [measured per set of 40: careful 1-2, as it plays 5-10]`);
  if(!(care.law <= CARE_MAX)) bad.push(`a careful house at home met the law ${care.law} times in 40, over a ceiling of ${CARE_MAX} [measured 1-2]: the law is no longer answerable by play`);
  if(!(care.law < ref.law)) bad.push(`the careful house met the law ${care.law} times against ${ref.law} as it plays: obeying the law no longer helps`);

  return { pass: bad.length === 0, why: bad.slice(0, 3).join("; ") || null, lines };
}
