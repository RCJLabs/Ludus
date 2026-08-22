/* ARMING A MAN WITHOUT LEAVING HIM — the racks, folded into the gladiator

   Assignment always lived on the man: his card opens the kit drawer. BUYING lived on a face of
   its own, and `reach` measured `familia · The Armoury` as a whole face carrying ONE action. The
   loop was: stand at the man, find he has nothing fit to carry, leave him, walk to the racks,
   buy, walk back, open the drawer again. v3.100.0 put the unbought pieces in the drawer, priced.

   THE ONE THING THAT MUST NOT ROT is that the press does BOTH. `mut` clones the current state out
   of a closure, so a handler that called buyGear() and then equip() would clone the same stale
   state twice and the second write would overwrite the first — the man armed and the coin never
   spent, or the coin spent and the man still in house issue. Both halves happen in one clone, and
   this check reads the save afterwards to prove it: the gold went down, the piece is on him, and
   the house owns it.
*/
import { found, clearAll, tab, slot, waitSaved } from "../harness.mjs";

export const name = "arm";
export const describe = "a man can be armed from his own card, and the coin and the steel both move";

export async function run({ p, errors }){
  const lines = [], fails = [];
  await found(p, { seed:"ARM" });
  await clearAll(p);

  /* coin enough that price is never the reason nothing happens */
  await p.evaluate(()=>{ const A = window.__LVDVS;
    const d = A.newGameState("Arm","clean","ARM",null);
    d.gold = 9000;
    let k=null; for(const q of Object.keys(localStorage)) if(/ludus-slot-\d/.test(q)) k=q;
    if(k) localStorage.setItem(k, JSON.stringify(d)); });
  await p.reload({ waitUntil:"domcontentloaded" }); await p.waitForTimeout(1100);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/take up the keys/i.test(x.innerText||"")); if(b) b.click(); });
  await p.waitForTimeout(1100); await clearAll(p, 8);

  /* to a man, through the yard, the way a player reaches one */
  if(!await tab(p, "men")) return { pass:false, why:"could not reach the familia", lines };
  await p.waitForTimeout(260);
  /* the gatekeeper's note sits above the roster and its UNDERSTOOD is the first button on the
     page — the first draft of this check pressed that and reported "no slot button on the card" */
  await clearAll(p, 6);
  await p.waitForTimeout(220);
  /* on the roster a man IS a button.panel (ludus.jsx: onClick={()=>setSelId(g.id)}) */
  const opened = await p.evaluate(()=>{
    const c = [...document.querySelectorAll("button.panel")][0];
    if(!c) return null; c.click();
    return (c.innerText||"").trim().split("\n")[0].slice(0,24);
  });
  await p.waitForTimeout(420);

  /* the card has faces of its own — RECORD, BODY, TRAINING, KIT, STANDING — and the slot
     buttons live behind KIT. The first draft looked for .selbtn on arrival and found none. */
  await p.evaluate(()=>{ const c=[...document.querySelectorAll(".modalwrap button.chip")]
    .find(b=>/^kit$/i.test((b.innerText||"").trim())); if(c) c.click(); });
  await p.waitForTimeout(320);

  /* his slots — the kit drawer's door */
  const drawer = await p.evaluate(()=>{
    const b = [...document.querySelectorAll("button.selbtn")][0];
    if(!b) return null; b.click(); return true;
  });
  await p.waitForTimeout(420);
  if(!drawer){
    lines.push(`opened "${opened}" but found no slot button on the card`);
    return { pass:false, why:"could not open the kit drawer from a man's card", lines };
  }

  const shape = await p.evaluate(`(()=>{
    const w = [...document.querySelectorAll(".modalwrap")]
      .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
    if(!w) return null;
    const head = [...w.querySelectorAll(".disp")].map(d=>(d.innerText||"").trim())
      .find(t=>/NOT ON THE RACKS/i.test(t));
    return { head: head || null,
             owned: w.querySelectorAll("button.optrow").length,
             buyable: w.querySelectorAll("details.entry").length };
  })()`);
  if(!shape) return { pass:false, why:"the kit drawer did not open", lines };
  lines.push(`the drawer holds ${shape.owned} the house can hand him and ${shape.buyable} it has not bought`);
  if(!shape.head || !shape.buyable)
    fails.push("the drawer offers nothing to buy — the racks are still a separate errand");

  /* ---- the press must move BOTH the coin and the steel ---- */
  const before = await slot(p);
  const bought = await p.evaluate(()=>{
    const w = [...document.querySelectorAll(".modalwrap")]
      .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
    const d = [...w.querySelectorAll("details.entry")][0];
    if(!d) return null;
    d.open = true;
    const name = ((d.querySelector(".entryname")||{}).innerText||"").trim();
    const b = [...d.querySelectorAll("button.btn")].find(x=>!x.disabled && /arm him/i.test(x.innerText||""));
    if(!b) return { name, pressed:false };
    b.click(); return { name, pressed:true };
  });
  await p.waitForTimeout(700); await clearAll(p, 5); await waitSaved(p);
  const after = await slot(p);

  if(!bought || !bought.pressed){
    fails.push(`no "arm him" press available on the first unbought piece${bought?` (${bought.name})`:""}`);
  } else {
    const spent = Math.round(before.gold) - Math.round(after.gold);
    /* is it actually on a man now? the kit of whoever wears it */
    const worn = await p.evaluate(()=>{
      const k = Object.keys(localStorage).find(q=>/ludus-slot-\d/.test(q));
      const d = JSON.parse(localStorage.getItem(k));
      const A = window.__LVDVS;
      for(const g of (d.gladiators||[])){
        for(const s of A.SLOTS){
          const id = g.kit && g.kit[s];
          if(id && A.GEAR[id] && !A.isBasic(id)) return { man:g.name, slot:s, piece:A.GEAR[id].name };
        }
      }
      return null;
    });
    lines.push(`pressed on "${bought.name}" · gold ${Math.round(before.gold)} → ${Math.round(after.gold)} (spent ${spent}) · worn: ${worn ? `${worn.piece} on ${worn.man} (${worn.slot})` : "nothing bought is on anybody"}`);
    if(spent <= 0) fails.push(`"${bought.name}" cost nothing — the buy half of the press did not land`);
    if(!worn) fails.push(`"${bought.name}" was bought and nobody is wearing it — the arm half of the press did not land, which is the stale-clone fault this was written for`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
