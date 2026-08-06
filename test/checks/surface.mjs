/* The floor under the interface: nothing set smaller than the type scale's
   smallest step, and every control a thumb can actually hit.

   The numbers come from v2.19.0. Before it the tab bar was 9px, END WEEK was
   37px tall, and the crest palette was forty-five 30px swatches. Chips are held
   to 36 rather than 44 on purpose — a six-chip training row at 44 would be a
   third taller for nothing. */

import { found, endWeek, clearAll, tab } from "../harness.mjs";

export const name = "surface";
export const describe = "no type under the scale, no primary control under a thumb";
export const slow = true;   /* drives a real browser through the real screens */

const FLOOR_TEXT = 11.4;   /* --fs-micro is 11.5; allow for rounding */
const FLOOR_TAP  = 44;     /* buttons, rows, selects, the tab bar */
const FLOOR_CHIP = 36;     /* pills, deliberately denser */

export async function run({ p, errors }){
  await found(p);
  for(let w=0; w<12; w++){ if(!(await endWeek(p))) break; await clearAll(p); }
  await clearAll(p);

  const TABS = ["ludus","familia","arena","armory","market","villa"];
  const lines = [], bad = [];
  for(const t of TABS){
    await tab(p, t);
    await p.waitForTimeout(300);
    const m = await p.evaluate(({FT,FP,FC})=>{
      let small = 0, smallest = 99;
      for(const e of document.querySelectorAll("div,span,button,summary")){
        if(e.offsetParent === null || e.children.length) continue;
        if(!(e.innerText||"").trim()) continue;
        const fs = parseFloat(getComputedStyle(e).fontSize||"16");
        if(fs < FT){ small++; smallest = Math.min(smallest, fs); }
      }
      const btns = [...document.querySelectorAll("button")].filter(e=>e.offsetParent!==null);
      const tiny = [];
      for(const e of btns){
        const r = e.getBoundingClientRect();
        if(r.height === 0) continue;
        const chip = /\bchip\b|\btag\b/.test(e.className||"");
        const floor = chip ? FC : FP;
        if(r.height < floor) tiny.push({ t:(e.innerText||"").trim().slice(0,18) || "(unlabelled)",
          h:Math.round(r.height), chip });
      }
      return { small, smallest: smallest===99? null : smallest, btns: btns.length, tiny };
    }, { FT:FLOOR_TEXT, FP:FLOOR_TAP, FC:FLOOR_CHIP });

    lines.push(`${t.padEnd(8)} ${String(m.btns).padStart(3)} controls · ${m.tiny.length} under the floor · ${m.small} text under ${FLOOR_TEXT}px`);
    if(m.small) bad.push(`${t}: ${m.small} text nodes under ${FLOOR_TEXT}px (smallest ${m.smallest}px)`);
    for(const x of m.tiny.slice(0,4))
      bad.push(`${t}: "${x.t}" is ${x.h}px tall, floor is ${x.chip?FLOOR_CHIP:FLOOR_TAP}`);
  }
  if(errors.length) bad.push(`${errors.length} page errors`);
  return { pass: bad.length === 0, why: bad.slice(0,6).join("; ") || null, lines };
}
