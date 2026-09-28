/* THE LAW, ON A DIAL — #316

   #312 and #313 found that the law is what ends a house that never leaves Capua: an inspector's fine in
   50 of 56 debt deaths, and the ban behind it; obeying the edicts cut bans from 7% to 1%. The heat that
   drives both was a word in the law panel ("you are being watched") and a number only in the settings'
   list of endings, and the two lines that matter were written nowhere a player manages the law: 45,
   past which the aedile's man calls with nothing to count, and 90, the ban's. Obeying the numbers
   edict meant finding the cheapest men one page at a time, and a gambit's card named the magistrate's
   mood but not the heat it adds.

     1  one expression: `lawWeek` moves the heat by `heatDrift` and rolls against `inspectOdds`, and
        `runGambit` adds `gamHeat`, the functions the dial and the card quote (#150's rule); and they
        give the documented values: +1.6 a week per edict broken, cooling 0.9 at nothing and 0.36 at
        ninety, 3% + 0.12% a point of heat while in breach, (heat - 45) x 0.16% past 45 without one
     2  `standDown`: the cheapest men by the game's own price, as many as the edict is over and never
        the last man that can be sold; the condemned are never listed; the women edict lists the women
     3  the sheet the dial lives in opens in a house's first week. It blanked the whole page before,
        reading last week's deltas before there was a last week.
     4  on screen: the dial's heat, both lines, the week's drift and his calls, the ban's terms, the
        fines, and the men to stand down; one is stood down through the roster's own confirm and sale,
        and the list shrinks by him */
import fs from "node:fs";
import path from "node:path";
import { found, clearAll, forge, settle, tab, ROOT } from "../harness.mjs";

export const name = "dial";
export const describe = "the law panel draws the heat and its two lines, and lists the men to stand down";

const openStand = async p => {
  await tab(p, "villa"); await p.waitForTimeout(300); await clearAll(p, 4);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>(x.innerText||"").trim().toUpperCase()==="THE HOUSE"); if(b) b.click(); });
  await p.waitForTimeout(350);
  await p.evaluate(()=>{ const h=[...document.querySelectorAll("button,[role=button],summary")].find(x=>/records & annals/i.test(x.innerText||"") && (x.innerText||"").length < 160); if(h) h.click(); });
  await p.waitForTimeout(300);
  const tile = await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>/Where Things Stand/i.test(x.innerText||"")); if(b) b.click(); return b ? (b.innerText||"").replace(/\s+/g," ") : null; });
  await settle(p); await p.waitForTimeout(300);
  return tile;
};

export async function run({ p, errors }){
  const fails = [], lines = [];

  /* ---- 1a · one expression, by the source ---- */
  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
  const body = nm => (src.match(new RegExp(`function ${nm}\\(d[^)]*\\)\\{([\\s\\S]*?)\\n\\}`)) || ["", ""])[1];
  const lw = body("lawWeek"), rg = body("runGambit");
  if(!/heatDrift\(d\)/.test(lw) || !/inspectOdds\(d\)/.test(lw)) fails.push("lawWeek no longer moves and rolls the heat through heatDrift and inspectOdds, which the dial quotes");
  if(/0\.0012|0\.0016|\*1\.6/.test(lw)) fails.push("lawWeek has grown its own heat arithmetic again, beside the dial's");
  if(!/gamHeat\(d, k\)/.test(rg) || /G\.heat\s*\*\s*0\.4/.test(rg)) fails.push("runGambit no longer adds the heat through gamHeat, which the card quotes");
  if((src.match(/gamHeatSay\(S,k\)/g) || []).length < 2) fails.push("the gambit card no longer quotes gamHeatSay on its row and its confirm");

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["heatDrift","inspectOdds","gamHeat","gamHeatSay","standDown","lawOf","newGameState","genGladiator","gladValue","activeG","isGone"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const alive = d => d.gladiators.filter(g=>!A.isGone(g));
    const house = (men, law) => { const d = A.newGameState("Dl", "clean", "DIAL-1", null); d.week = 40; d.pendingEvent = null;
      d.gladiators = d.gladiators.filter(g=>!A.isGone(g)).slice(0, men);
      while(alive(d).length < men) d.gladiators.push(A.genGladiator(d, 55));
      d.gladiators.forEach(g=>{ g.sex = "m"; g.damnatus = null; });
      Object.assign(A.lawOf(d), law); return d; };
    const x = {};
    { const d = house(4, { edicts:[], heat:0 }); x.cool0 = A.heatDrift(d); A.lawOf(d).heat = 90; x.cool90 = A.heatDrift(d);
      A.lawOf(d).heat = 44; x.call44 = A.inspectOdds(d); A.lawOf(d).heat = 100; x.call100 = A.inspectOdds(d); }
    { const d = house(8, { edicts:["numbers"], cap:5, heat:52 }); x.one = A.heatDrift(d); x.call52 = A.inspectOdds(d);
      A.activeG(d)[0].sex = "f"; A.lawOf(d).edicts = ["numbers","women"]; x.two = A.heatDrift(d); }
    /* 2 · who would go */
    { const d = house(8, { edicts:["numbers"], cap:5, heat:30 });
      const list = A.standDown(d)[0], cheap = A.activeG(d).slice().sort((a,b)=>A.gladValue(a)-A.gladValue(b)).slice(0,3).map(g=>g.id);
      x.down = { over:list && list.over, ids:list ? list.men.map(g=>g.id) : [], cheap }; }
    { const d = house(5, { edicts:["numbers"], cap:4, heat:30 }); A.activeG(d).slice(0,4).forEach(g=>{ g.damnatus = { bouts:99 }; });
      const list = A.standDown(d)[0]; x.last = { listed:list ? list.men.length : -1, damned:list ? list.men.some(g=>g.damnatus) : false }; }
    { const d = house(4, { edicts:["women"], women:true, heat:30 }); const her = A.activeG(d)[2]; her.sex = "f";
      const list = A.standDown(d)[0]; x.women = list ? { k:list.k, ids:list.men.map(g=>g.id), her:her.id } : null; }
    { const d = house(5, { edicts:["numbers"], cap:5, heat:30 }); x.within = A.standDown(d).length; }
    { const d = house(4, { edicts:[], heat:38 }); x.gam = A.gamHeatSay(d, "poach"); x.gamH = A.gamHeat(d, "poach"); }
    return x;
  });
  if(r.why) return { pass:false, why:r.why, lines };
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  lines.push(`the week's drift: +${r.one} one edict broken, +${r.two} two · cooling ${-r.cool0} at nothing, ${-r.cool90} at ninety`);
  lines.push(`his chance of calling: ${r.call52} at heat 52 in breach · ${r.call44} at 44 within the edicts · ${r.call100} at 100 within them`);
  if(!near(r.one, 1.6) || !near(r.two, 3.2)) fails.push(`the heat no longer climbs 1.6 a week per edict broken (${r.one}, ${r.two})`);
  if(!near(r.cool0, -0.9) || !near(r.cool90, -0.36)) fails.push(`the heat no longer cools 0.9 at nothing and 0.36 at ninety (${r.cool0}, ${r.cool90})`);
  if(!near(r.call52, 0.03 + 52*0.0012) || r.call44 !== 0 || !near(r.call100, 55*0.0016)) fails.push("the inspector's chance is no longer the documented one");
  lines.push(`the eight men against five: ${r.down.over} over, listed ${r.down.ids.length}, the cheapest three by the game's price: ${JSON.stringify(r.down.ids) === JSON.stringify(r.down.cheap)}`);
  if(r.down.over !== 3 || JSON.stringify(r.down.ids) !== JSON.stringify(r.down.cheap)) fails.push("the men to stand down are not the cheapest three by the game's own price");
  lines.push(`four condemned and one free man against four: listed ${r.last.listed}, a condemned man among them: ${r.last.damned}`);
  if(r.last.listed !== 0 || r.last.damned) fails.push("the list offers the last man that can be sold, or a condemned man");
  if(!r.women || r.women.k !== "women" || JSON.stringify(r.women.ids) !== JSON.stringify([r.women.her])) fails.push("the women edict does not list the woman on the roster");
  if(r.within !== 0) fails.push("a house within its edicts is offered men to stand down");
  lines.push(`a gambit's card: "${r.gam}"`);
  if(!/^\+3\.6 heat if it works, \+9 if not, and the law stands at 38$/.test(r.gam || "")) fails.push(`the gambit card's heat reads "${r.gam}"`);

  /* ---- 3 · the sheet in a house's first week ---- */
  await found(p, { seed:"DIAL-NEW" }); await clearAll(p, 8);
  const e0 = errors ? errors.length : 0;
  const tile0 = await openStand(p);
  const first = await p.evaluate(()=>({ open:!!document.querySelector(".modalwrap"), dial:!!document.querySelector("[data-lawdial]"), len:(document.body.innerText||"").length }));
  lines.push(`a house's first week: the tile ${tile0 ? "found" : "MISSING"} · the sheet opens: ${first.open} · the dial in it: ${first.dial} · page errors ${(errors ? errors.length : 0) - e0}`);
  if(!first.open || first.len < 200) fails.push("Where Things Stand does not open in a house's first week");
  if(!first.dial) fails.push("the dial is not in the law panel");

  /* ---- 4 · the dial on screen, and a man stood down ---- */
  await found(p, { seed:"DIAL-UI" }); await clearAll(p, 8);
  await forge(p, (A) => { const d = A.newGameState("Dl","clean","DIAL-UI",null); d.week = 40; d.pendingEvent = null; d.gold = 4000;
    while(d.gladiators.filter(g=>!A.isGone(g)).length < 8) d.gladiators.push(A.genGladiator(d, 55));
    d.gladiators.forEach(g=>{ g.damnatus = null; g.sex = "m"; });
    Object.assign(A.lawOf(d), { edicts:["numbers"], cap:5, heat:52, fines:420 });
    return { plant:d }; });
  await clearAll(p, 8);
  const tile = await openStand(p);
  lines.push(`the tile: "${tile}"`);
  if(!tile || !/the law at 52/.test(tile)) fails.push("the tile to Where Things Stand does not carry the law's heat");
  const dial = await p.evaluate(()=>{ const el = document.querySelector("[data-lawdial]"); return el ? el.innerText.replace(/\s*\n+\s*/g," · ") : null; });
  lines.push(`the dial: ${dial ? dial.slice(0, 330) : "NOT ON SCREEN"}`);
  const want = [/52 of 100/, /45: the aedile's man calls with nothing to count/, /90: the ban's line/, /it climbs 1\.6 a week/, /one week in 11/, /1 of the three holds/, /Paid in fines: 420d/, /stand down 3 to meet the numbers edict/i];
  if(!dial) fails.push("the dial is not on screen");
  else for(const w of want) if(!w.test(dial)) fails.push(`the dial does not say ${w}`);
  const bar = await p.evaluate(()=>{ const t = document.querySelector("[data-lawdial] [role=progressbar]"); return t ? +t.getAttribute("aria-valuenow") : null; });
  if(bar !== 52) fails.push(`the dial's bar reads ${bar}, not 52`);
  const asked = await p.evaluate(()=>{ const b = document.querySelector("[data-standdown=numbers] button"); if(b) b.click(); return b ? b.innerText.replace(/\s+/g," ") : null; });
  await p.waitForTimeout(400);
  const confirm = await p.evaluate(()=>{ const b = [...document.querySelectorAll("button")].find(x=>/^Take \d+ denarii$/i.test((x.innerText||"").trim())); if(b){ const t = b.innerText; b.click(); return t; } return null; });
  await settle(p); await p.waitForTimeout(400);
  const after = await p.evaluate(()=>{ const el = document.querySelector("[data-lawdial]"); return el ? el.innerText.replace(/\s*\n+\s*/g," · ") : null; });
  lines.push(`stood down: "${asked}" -> "${confirm}" -> ${after ? (after.match(/stand down \d+ to meet the numbers edict/i) || ["no list"])[0] : "NO DIAL"}`);
  if(!asked) fails.push("there is no man to stand down on screen");
  else if(!confirm) fails.push("standing a man down does not go through the roster's own confirm, with its price");
  else if(!after || !/stand down 2 to meet the numbers edict/i.test(after)) fails.push("after a man is stood down the list does not shrink by him");

  if(errors && errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
