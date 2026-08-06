/* Buying a man works, end to end, through the screen a player actually uses.

   buyFromBlock was lifted out of a React closure so a harness could reach it —
   nothing outside the component could buy anybody, which is why every headless
   run starved by week thirty with its roster empty and its coin untouched. That
   is a live path holding a player's money, so it gets a check of its own. */

import { found, clearAll, tab, click, slot, waitSaved } from "../harness.mjs";

export const name = "block";
export const describe = "a man can still be bought, and the coin leaves the purse";

export async function run({ p, errors }){
  await found(p);
  const before = await slot(p);
  await tab(p, "market");
  await p.waitForTimeout(500);

  const pressed = await p.evaluate(()=>{
    const b = [...document.querySelectorAll("button")]
      .find(x=>/^(buy|take him|pay|outbid|meet it)/i.test((x.innerText||"").trim()) && !x.disabled);
    if(b){ b.click(); return (b.innerText||"").trim().slice(0,40); }
    return null;
  });
  await p.waitForTimeout(900);
  await clearAll(p, 8);
  await waitSaved(p);
  const after = await slot(p);

  const lines = [];
  if(!pressed) return { pass:false, why:"nothing on the block could be bought — no buy button on the market tab", lines };
  lines.push(`pressed: ${pressed}`);
  lines.push(`men ${before.gladiators.length} → ${after.gladiators.length} · gold ${before.gold} → ${after.gold}`);
  const said = (after.log||[])[0];
  if(said) lines.push(`chronicle: ${said.text.slice(0,72)}…`);

  const fails = [];
  if(after.gladiators.length <= before.gladiators.length) fails.push("no man joined the house");
  if(after.gold >= before.gold) fails.push("no coin left the purse");
  if(!/joins the ludus|signs for|is yours/i.test((said && said.text) || ""))
    fails.push("nothing was written in the chronicle about him");
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
