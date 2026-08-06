/* Open everything and see if anything throws. Every tab, every collapsible on it,
   every sheet behind the records section, the man's page, the arena wizard. This
   is the cheap net: it does not know what any screen should say, only that
   rendering it did not blow up. */

import { found, endWeek, clearAll, tab, click, top } from "../harness.mjs";

export const name = "sweep";
export const describe = "every tab, section and sheet renders without throwing";

export async function run({ p, errors }){
  await found(p);
  for(let w=0; w<16; w++){ if(!(await endWeek(p))) break; await clearAll(p); }
  await clearAll(p);

  const lines = [], visited = [];
  const TABS = ["ludus","familia","arena","armory","market","villa"];

  for(const t of TABS){
    await tab(p, t); await p.waitForTimeout(260);
    /* open every collapsible on the tab */
    const n = await p.evaluate(()=>{ const s=[...document.querySelectorAll("details.sect")];
      s.forEach(x=>{ x.open = true; }); return s.length; });
    await p.waitForTimeout(360);
    visited.push(`${t} (+${n} sections)`);
  }

  /* the sheets behind the records section on the ludus tab */
  await tab(p, "ludus"); await p.waitForTimeout(240);
  await p.evaluate(()=>{ const d=[...document.querySelectorAll("details.sect")]
    .find(x=>/records\s*&\s*annals/i.test((x.querySelector("summary")||{}).textContent||"")); if(d) d.open = true; });
  await p.waitForTimeout(300);
  const sheets = ["The Lanista","The Houses","The House","The Stands","What Capua Says",
    "Feats","The Record Book","The Annals","Roll of the House"];
  let opened = 0;
  for(const s of sheets){
    const hit = await p.evaluate(label=>{
      const b = [...document.querySelectorAll("button")].find(x=>x.innerText.trim().startsWith(label));
      if(b){ b.click(); return true; } return false; }, s);
    if(!hit) continue;
    await p.waitForTimeout(320);
    const t = await top(p);
    if(t) opened++;
    await clearAll(p, 6);
    await p.waitForTimeout(140);
    /* re-open the section, closing a sheet can collapse it */
    await p.evaluate(()=>{ const d=[...document.querySelectorAll("details.sect")]
      .find(x=>/records\s*&\s*annals/i.test((x.querySelector("summary")||{}).textContent||"")); if(d) d.open = true; });
    await p.waitForTimeout(120);
  }
  visited.push(`${opened} of ${sheets.length} record sheets`);

  /* a man's page, and the arena wizard as far as choosing a card */
  await tab(p, "familia"); await p.waitForTimeout(260);
  const man = await p.evaluate(()=>{ const b=[...document.querySelectorAll("button.panel")][0];
    if(b){ b.click(); return true; } return false; });
  if(man){ await p.waitForTimeout(420); visited.push("a man's page"); await clearAll(p, 8); }

  await tab(p, "arena"); await p.waitForTimeout(260);
  if(await click(p, /choose a bout/i)){
    await p.waitForTimeout(320); visited.push("the arena wizard");
    await clearAll(p, 8);
  }

  lines.push(`opened: ${visited.join(", ")}`);
  lines.push(errors.length ? `errors: ${errors.slice(0,4).join(" | ")}` : "errors: none");
  return { pass: errors.length === 0, why: errors.length ? `${errors.length} page errors` : null, lines };
}
