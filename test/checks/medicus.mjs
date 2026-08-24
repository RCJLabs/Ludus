/* THE INFIRMARY ROW SAID WHAT EACH CHOICE WAS, NOT WHAT IT WAS WORTH — #203

   The item asked for a fifth option: declare a hurt man fit, he takes the card. **That option is
   `through` and it has always been here** — `setCareOf(_,_,"through")` sets `g.status = "active"`
   and `canFight` has no injury term. Two more of its clauses miss as well: the row has FOUR options
   and not three, and "nobody outside knows" is already true because nothing outside reads
   `g.injury`. The proposal is declined and the measurement is the release.

   MEASURED (probes/medicus.mjs, four arms, 8 houses x 300 weeks each; scars and lasting hurts
   counted AS TAKEN per thousand hurt man-weeks, because the arms do not live the same length):

     arm           bouts/wk   scars/kHmw   lasting/kHmw   weeks to heal
     rest             0.958        303.5          62.33            1.1
     convalesce       0.960        214.3          48.63            1.3
     surgeon          0.948        309.5          76.22            1.1
     through          0.939        115.2          25.51            7.7

   `through` buys NOTHING — 0.939 bouts a week against 0.958 — while its houses ran 572 house-weeks
   against 1,392. And of 375 attempts to set the surgeon, 354 were refused for want of a
   valetudinarium and not one for want of coin.

   THE ASSERTION THIS CHECK EXISTS FOR: **the figures the panel prints are the figures the engine
   uses.** They are on `CARE` now, and the heal and lasting paths read their own constants a hundred
   lines apart. #150 is what happens when a panel keeps its own copy — 990 of 6,448 rows quoting a
   number the engine would not roll, and the worse one every time. Both are read off the source here
   and compared. */

import fs from "node:fs";
import path from "node:path";
import { found, tab, clearAll, forge, settle, waitSaved, ROOT } from "../harness.mjs";

export const name = "medicus";
export const describe = "the infirmary row says what each choice is worth, in the engine's own numbers";

export async function run({ p, errors }){
  const fails = [], lines = [];
  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");

  /* ---- THE TABLE AGAINST THE ENGINE ---- */
  const healLine = src.match(/care==="surgeon" \? healSpeed\(d,g\)\*([\d.]+) : g\.injury\.care==="convalesce" \? healSpeed\(d,g\)\*([\d.]+)/);
  const graveLine = src.match(/const careMult = care==="surgeon" \? ([\d.]+) : care==="convalesce" \? ([\d.]+) : (\d+);/);
  const thruZero = /if\(g\.injury\.care === "through"\) return 0;/.test(src);
  if(!healLine) fails.push("could not read the heal multipliers out of the weekly sweep — the comparison below proves nothing");
  if(!graveLine) fails.push("could not read graveLasting's careMult — the comparison below proves nothing");
  lines.push(`the engine: heal surgeon x${healLine&&healLine[1]} · convalesce x${healLine&&healLine[2]} · through returns 0 (${thruZero})`);
  lines.push(`the engine: graveLasting surgeon x${graveLine&&graveLine[1]} · convalesce x${graveLine&&graveLine[2]} · everything else x${graveLine&&graveLine[3]}`);

  const table = await p.evaluate(()=>{
    const A = window.__LVDVS;
    if(!A.CARE || !A.careWhy) return null;
    return { keys:A.CARE_KEYS, rows:A.CARE_KEYS.map(k=>({ k, heal:A.CARE[k].heal, grave:A.CARE[k].grave,
      worth:A.CARE[k].worth, short:A.CARE[k].short, hard:!!A.CARE[k].hard })) };
  });
  if(!table) return { pass:false, why:"CARE or careWhy is not on the handle", lines };
  lines.push(`the table: ${table.rows.map(r=>`${r.k} heal x${r.heal} grave x${r.grave}`).join(" · ")}`);
  if(table.keys.length !== 4) fails.push(`CARE has ${table.keys.length} options — the item said three and the file said four; if it has changed again, the measurement behind this release is stale`);
  const byK = Object.fromEntries(table.rows.map(r=>[r.k, r]));
  if(healLine){
    if(byK.surgeon.heal !== +healLine[1]) fails.push(`the panel says the surgeon heals x${byK.surgeon.heal} and the engine uses x${healLine[1]}`);
    if(byK.convalesce.heal !== +healLine[2]) fails.push(`the panel says convalescence heals x${byK.convalesce.heal} and the engine uses x${healLine[2]}`);
  }
  if(graveLine){
    if(byK.surgeon.grave !== +graveLine[1]) fails.push(`the panel says the surgeon's lasting risk is x${byK.surgeon.grave} and graveLasting uses x${graveLine[1]}`);
    if(byK.convalesce.grave !== +graveLine[2]) fails.push(`the panel says convalescence is x${byK.convalesce.grave} and graveLasting uses x${graveLine[2]}`);
    if(byK.rest.grave !== +graveLine[3] || byK.through.grave !== +graveLine[3])
      fails.push(`rest and through carry the FULL lasting risk in graveLasting (x${graveLine[3]}) and the table says x${byK.rest.grave}/x${byK.through.grave}`);
  }
  if(thruZero && byK.through.heal !== 0) fails.push("a worked-through wound does not close at all in the engine, and the table says it heals");
  for(const r of table.rows) if(!r.worth || r.worth.length < 20)
    fails.push(`"${r.k}" carries no account of what it is worth — the row named four choices and priced none of them`);
  if(!byK.through.hard) fails.push("`through` is not marked as the hard one, and measured it buys no bouts at all");

  /* ---- AND THE OPTION #203 ASKED FOR, WHICH IS ALREADY BUILT ----
     If a later edit stops `through` making him fightable, the reason the fifth option was declined
     goes away, and this must say so rather than passing quietly. */
  const already = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Med","clean","MD-1",null);
    while(A.activeG(d).length < 2) d.gladiators.push(A.genGladiator(d, 60));
    const g = A.activeG(d)[0];
    g.injury = { name:"Gashed flank", weeks:4, pen:6, part:"flank" };
    g.status = "injured";
    const before = A.canFight(g);
    A.setCareOf(d, g.id, "through");
    return { before, after: A.canFight(g), status:g.status, care:g.injury && g.injury.care };
  });
  lines.push(`a hurt man: canFight ${already.before} → worked through → status "${already.status}", care "${already.care}", canFight ${already.after}`);
  if(already.before) fails.push("a hurt man on rest could already be sent out, which is not what the infirmary is for");
  if(!already.after)
    fails.push("`through` no longer makes a hurt man fightable — that is the option #203 asked to have added, and the reason it was declined has gone away");

  /* ---- THE DARK ROW SAYS WHY ---- */
  const why = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const mk = () => { const d = A.newGameState("Med","clean","MD-2",null);
      while(A.activeG(d).length < 2) d.gladiators.push(A.genGladiator(d, 60));
      const g = A.activeG(d)[0];
      g.injury = { name:"Gashed flank", weeks:4, pen:6, part:"flank" }; g.status = "injured";
      return { d, g }; };
    const noRoom = mk(); noRoom.d.buildings = {}; noRoom.d.gold = 50000;
    const noCoin = mk(); noCoin.d.buildings = { valetudinarium:2 }; noCoin.d.gold = 1;
    const fine   = mk(); fine.d.buildings = { valetudinarium:2 }; fine.d.gold = 50000;
    return { noRoom: A.careWhy(noRoom.d, noRoom.g, "surgeon"),
             noCoin: A.careWhy(noCoin.d, noCoin.g, "surgeon"),
             fine:   A.careWhy(fine.d, fine.g, "surgeon"),
             others: A.CARE_KEYS.filter(k=>k!=="surgeon").map(k=>A.careWhy(fine.d, fine.g, k)) };
  });
  lines.push(`why the surgeon is dark: no room → "${why.noRoom}" · no coin → "${why.noCoin}" · neither → ${why.fine}`);
  if(!why.noRoom || !/valetudinarium|medicus/i.test(why.noRoom))
    fails.push("a house with no medicus' room is not told that is the reason — and measured, that is 354 of 375 refusals");
  if(!why.noCoin || !/short/i.test(why.noCoin))
    fails.push("a house that cannot afford the fee is not told the shortfall");
  if(why.fine) fails.push(`a house that can do it is still told it cannot: "${why.fine}"`);
  if(why.others.some(Boolean)) fails.push("an option other than the surgeon was given a reason for being dark, and only the surgeon is ever gated");

  /* ================= THE REAL PANEL ================= */
  await found(p, { seed:"MD-S" });
  await clearAll(p, 8);
  const planted = await forge(p, (A) => {
    const d = A.newGameState("Med","clean","MD-S",null);
    d.gold = 400; d.week = 40; d.buildings = {};
    while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 62));
    const g = A.activeG(d)[0];
    g.injury = { name:"Gashed flank", weeks:5, pen:7, part:"flank", care:"rest" };
    g.status = "injured";
    return { plant:d, name:g.name };
  });
  await clearAll(p, 8);
  await tab(p, "men"); await p.waitForTimeout(350); await clearAll(p, 6);
  await tab(p, "men"); await p.waitForTimeout(330); await settle(p);
  const opened = await p.evaluate(nm=>{
    const b = [...document.querySelectorAll("button")].find(x=>(x.innerText||"").includes(nm));
    if(b) b.click(); return !!b;
  }, planted.name);
  if(!opened) return { pass:false, why:"could not open the hurt man's page", lines };
  await p.waitForTimeout(500);
  const onBody = await p.evaluate(()=>{
    const b = [...document.querySelectorAll("button[role=tab]")].find(x=>/^body/i.test((x.innerText||"").trim()));
    if(b) b.click(); return !!b;
  });
  if(!onBody) return { pass:false, why:"his page has no Body tab", lines };
  await p.waitForTimeout(550);
  /* the wound's NAME is on his roster card too, and the first match was that — the check read a
     roster row and reported the panel as saying nothing. Anchored on a label only the panel has. */
  const panel = await p.evaluate(()=>{
    const t = (document.body.innerText || "");
    const i = t.toUpperCase().indexOf("CONVALESCE");
    return i < 0 ? null : t.slice(Math.max(0, i - 120), i + 700).replace(/\n+/g, " · ");
  });
  lines.push(`the panel: ${panel ? panel.slice(0,260) : "NOT FOUND"}`);
  if(!panel) fails.push("the infirmary panel did not open on a hurt man's Body page");
  else {
    if(!/MEND|CONVALESCE|SURGEON|WORK ON/i.test(panel)) fails.push("the four choices are not on the panel");
    if(!/slow way|ordinary risk/i.test(panel)) fails.push("the panel does not say what the chosen care is worth");
    if(!/valetudinarium|needs medicus/i.test(panel))
      fails.push("a house with no medicus' room is not told why the surgeon is dark, on the screen");
  }

  await waitSaved(p);
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
