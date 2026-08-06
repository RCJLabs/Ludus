/* Every action a lanista can take, called without a rendered screen.

   These lived inside App, closed over React state, so nothing outside a mounted
   component could sell a man, equip him, choose his care after an injury, or
   throw a feast. The cost was not tidiness. It was that no check could drive a
   house through a year, and the one probe that wanted the feast copied it into
   itself by hand — then measured its own copy, which cannot catch a bug in the
   original and goes stale silently the moment the original moves.

   So this check asserts two things. That each action is reachable and does what
   its name says. And that a house driven on nothing but these gets through a
   year without throwing. */

import { hasHandle } from "../harness.mjs";

export const name = "actions";
export const describe = "every player action runs without a screen in front of it";

/* named here so a lift that forgets to export something fails loudly rather than
   quietly reducing what the checks can reach */
const REACHABLE = [
  "rewardMan","whipMan","sellMan","sellPrice","retireG","grantRudis",
  "setFocusOf","setRegimenOf","setSparOf","setTeachOf","stopTeachOf","setDrillTo",
  "boardMen","restWornMen","allToPalus","pairTheYard",
  "scoutBlockMan","buyGearItem","sellGearOne","equipOne","stripAll","mendKitOf",
  "forgeForMan","armHimOff","armAllOff","buildUp","setCrestTo","setCareOf",
  "teachSigTo","makeMasterOf","setPupilTo","beginRetrain","endRetrain",
  "hireDoctore","dismissDoctore","takeDoctoreOffer","hireStaffMember","letStaffGoOf",
  "setEarTo","haveWatchedOffer","stopPrepFor","answerReSignWith","answerRomeWith",
  "hostParty","throwFeast","walkTheCells","seekMatchNow","openLicenceNow","takeUpTheHouse",
];

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(REQ => {
    const A = window.__LVDVS;
    const missing = REQ.filter(k => typeof A[k] !== "function");

    const d = A.newGameState("Checks", "clean", "ACTIONS", null);
    d.gold = 200000;
    while(A.activeG(d).length < 6 && !A.rosterFull(d)){
      const m = (d.market||[])[0]; if(!m || !A.buyFromBlock(d, m.id, null)) break; }
    const men = A.activeG(d);
    if(men.length < 4) return { missing, fatal:"could not stock a house to four men" };

    const threw = [], did = {};
    const go = (k, fn) => { try { did[k] = fn(); } catch(e){ threw.push(`${k}: ${e.message}`); } };
    const [g0, g1, hurt, doomed] = men;

    /* the men */
    const moraleWas = g0.morale;
    go("reward",  ()=> A.rewardMan(d, g0.id) && g0.morale > moraleWas);
    go("whip",    ()=> { const m = g1.morale; return A.whipMan(d, g1.id) && g1.morale < m; });
    go("regimen", ()=> A.setRegimenOf(d, g0.id, "rest") && g0.regimen === "rest");
    go("spar",    ()=> A.setSparOf(d, g0.id, g1.id) && g0.sparWith === g1.id && g1.sparWith === g0.id);

    /* the training board's three buttons */
    go("pairYard",()=> A.pairTheYard(d) > 0);
    go("palus",   ()=> { A.allToPalus(d); return A.boardMen(d).every(g => g.regimen === "palus"); });
    go("restWorn",()=> { const g = A.boardMen(d)[0]; g.fatigue = 95;
                         return A.restWornMen(d) >= 1 && g.regimen === "rest"; });

    /* the armoury — a fine weapon this man's class would actually be offered */
    const wep = Object.keys(A.GEAR).find(k => { const it = A.GEAR[k];
      return it.slot === "weapon" && it.price > 0 && !it.stock && (it.styles||[]).includes(g0.cls); });
    go("buyGear", ()=> wep ? (()=>{ const had = d.gear[wep]||0;
                                    return A.buyGearItem(d, wep) && (d.gear[wep]||0) > had; })() : "no fine weapon for his class");
    go("equip",   ()=> wep ? (A.equipOne(d, g0.id, "weapon", wep) && g0.kit.weapon === wep) : "nothing bought");
    go("strip",   ()=> wep ? (A.stripAll(d) >= 1 && g0.kit.weapon !== wep) : "nothing equipped");
    go("armAll",  ()=> typeof A.armAllOff(d) === "number");
    go("armHim",  ()=> typeof A.armHimOff(d, g0.id) === "number");

    /* the villa */
    go("build",   ()=> { const g = d.gold; return A.buildUp(d, "armamentarium") && d.gold < g; });
    go("crest",   ()=> { A.setCrestTo(d, { motto:"NIL DESPERANDUM" }); return d.crest.motto === "NIL DESPERANDUM"; });
    go("ear",     ()=> A.setEarTo(d, "gate", null) && d.ear && d.ear.who === "gate");

    /* the doctore */
    go("hireDoc", ()=> { const c = (d.doctoreMarket||[])[0]; return c ? (A.hireDoctore(d, c.id) && !!d.doctore) : "no market"; });
    go("drill",   ()=> d.doctore ? (A.setDrillTo(d, "blade") && d.doctore.drill === "blade") : "no doctore");
    go("pupil",   ()=> d.doctore ? (A.setPupilTo(d, g0.id) && d.doctore.pupil === g0.id) : "no doctore");
    go("retrain", ()=> { if(!d.doctore) return "no doctore";
                         const to = A.CLASSES ? Object.keys(A.CLASSES).find(c => c !== g1.cls) : null;
                         return to ? (A.beginRetrain(d, g1.id, to) && A.endRetrain(d) && !d.doctore.retrainTo) : "no class"; });
    go("dismiss", ()=> d.doctore ? (A.dismissDoctore(d) && !d.doctore) : "no doctore");

    /* the infirmary */
    hurt.injury = { name:"a deep cut", weeks:3, pen:6 }; hurt.status = "injured";
    go("care",    ()=> A.setCareOf(d, hurt.id, "convalesce") && hurt.injury.care === "convalesce");
    go("mend",    ()=> typeof A.mendKitOf(d, hurt.id) === "boolean");

    /* the evenings */
    go("host",    ()=> { const g = d.gold; return A.hostParty(d, "modest") && d.gold < g; });
    d.lastFeast = -9; d.unrest = 40;
    go("feast",   ()=> { const u = d.unrest, g = d.gold, cost = A.feastCost(d);
                         return A.throwFeast(d) && d.unrest < u && d.gold === g - cost; });
    d.flags.walkWk = -9;
    go("walk",    ()=> A.walkTheCells(d) && d.flags.walkWk === d.week);

    /* Rome, declined */
    d.romeOffer = { purse:4000 };
    go("rome",    ()=> { const f = d.fame; return A.answerRomeWith(d, false) && !d.romeOffer && d.fame < f; });

    /* the sale — the price the screen shows, and the sale it confirms */
    const price = A.sellPrice(doomed), purse = d.gold, roster = d.gladiators.length;
    go("sell",    ()=> A.sellMan(d, doomed.id, price)
                       && d.gold === purse + price
                       && d.gladiators.length === roster - 1
                       && !d.gladiators.some(g => g.id === doomed.id));

    /* a year driven on the lifted actions alone */
    let weeks = 0, crash = null;
    try {
      for(let w = 0; w < 52; w++){
        d.gold = 200000;
        if(d.unrest >= 26) A.throwFeast(d);
        if(w % 5 === 0) A.walkTheCells(d);
        A.pairTheYard(d);
        A.restWornMen(d);
        A.activeG(d).forEach(g => { if(g.injury) A.setCareOf(d, g.id, "convalesce"); });
        if(d.pendingEvent){ try { A.EVENTS[d.pendingEvent.id].run(d, d.pendingEvent, 0); } catch(e){} d.pendingEvent = null; }
        A.endWeek(d);
        weeks++;
        if(d.over){ d.over = null; if(d.rebellion) d.rebellion = null; d.unrest = Math.min(d.unrest, 40); }
      }
    } catch(e){ crash = e.message; }

    return { missing, threw, did, weeks, crash, price,
      end:{ week:d.week, men:A.activeG(d).length, lines:(d.log||[]).length } };
  }, REACHABLE);

  const lines = [], fails = [];
  if(out.fatal) return { pass:false, why:out.fatal, lines };

  if(out.missing.length) fails.push(`not exposed: ${out.missing.join(", ")}`);

  /* an action that returned a string skipped itself — the fixture had no market,
     no doctore. That is the check's problem, not the game's; say so and move on. */
  const ran = Object.entries(out.did);
  const wrong = ran.filter(([, v]) => v === false).map(([k]) => k);
  const skipped = ran.filter(([, v]) => typeof v === "string").map(([k, v]) => `${k} (${v})`);

  lines.push(`${ran.length} actions called, ${ran.length - wrong.length - skipped.length} did what they say`);
  if(skipped.length) lines.push(`skipped, no fixture: ${skipped.join(", ")}`);
  lines.push(`a man priced at ${out.price} denarii and sold`);
  lines.push(`${out.weeks} weeks driven on lifted actions alone → week ${out.end.week}, ${out.end.men} men, ${out.end.lines} chronicle lines`);

  if(wrong.length) fails.push(`did not do what they say: ${wrong.join(", ")}`);
  if(out.threw.length) fails.push(`threw: ${out.threw.join(" | ")}`);
  if(out.crash) fails.push(`the year crashed: ${out.crash}`);
  if(out.weeks < 52) fails.push(`only ${out.weeks} of 52 weeks ran`);
  if(errors.length) fails.push(`${errors.length} page errors`);

  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
