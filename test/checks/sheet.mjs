/* THE MORNING REPORT AS A WORKSHEET — the week's list, worked from the list

   v3.99.0 turned the report from a flat column into three groups and gave some of its rows the
   deed itself. Measured over 320 played weeks and 2,269 rows before the change: 41% of rows
   already named a panel and opened it in place, 0.8% travelled to a face, and 58% landed the
   player on a bare tab — which since v3.98.0 folded every section means arriving at a page of
   shut drawers. Three promises come out of that, and each can rot quietly:

     GROUPED. Every row sits in exactly one group, and the groups are ordered due → worth doing →
       wanted. A flat list where a standing want carries the same weight as a debt falling due is
       how a list teaches you to stop reading it.
     ACTED. A row whose deed is ATOMIC carries that deed on the line. Pressing it must actually
       change the house and must take the row off the list — a verb that leaves its own row
       standing is a button that lies.
     CLOSED. The week's end says what is still unanswered, counting only what is DUE. Counting
       the whole agenda would print a number every morning and mean nothing by the second week.

   THE FIXTURE IS FORCED, ON PURPOSE. The deeds worth testing need a house in trouble — unrest
   high enough to want a feast and coin enough to throw one — and a founding has neither. The
   state is built through the handle and written to the slot, the way desk and report do it.
*/
import { found, clearAll, tab, slot, waitSaved } from "../harness.mjs";

export const name = "sheet";
export const describe = "the report groups the week, its deeds are real, and the week can be closed";

const openReport = async p => {
  await tab(p, "ludus"); await p.waitForTimeout(220);
  for(let i=0;i<3;i++){
    if(!await p.evaluate(()=>!!document.querySelector(".modalwrap"))) break;
    await p.keyboard.press("Escape"); await p.waitForTimeout(180);
  }
  await p.evaluate(()=>{ const b=document.querySelector(".reportbar"); if(b) b.click(); });
  await p.waitForTimeout(420);
};

/* what the sheet is showing, read as structure rather than as text */
const readSheet = p => p.evaluate(`(()=>{
  const w = [...document.querySelectorAll(".modalwrap")]
    .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
  if(!w) return null;
  const heads = [...w.querySelectorAll(".disp")]
    .map(d=>(d.innerText||"").trim())
    .filter(t=>/^(DUE|WORTH DOING|WHAT THE HOUSE STILL WANTS)$/.test(t));
  return {
    heads,
    rows: w.querySelectorAll("button.optrow").length,
    deeds: [...w.querySelectorAll("button.btn")]
      .map(b=>(b.innerText||"").trim())
      .filter(t=>t && !/^(close|×)$/i.test(t)),
    lead: (()=>{ const r = w.querySelector("button.optrow"); return r ? (r.innerText||"").split("\\n")[0].trim() : null; })(),
  };
})()`);

export async function run({ p, errors }){
  const lines = [], fails = [];
  await found(p, { seed:"SHEET" });
  await clearAll(p);

  /* ---- a house with the cells up and coin in the box, so a deed exists to press ---- */
  await p.evaluate(()=>{ const A = window.__LVDVS;
    const d = A.newGameState("Sheet","clean","SHEET",null);
    d.unrest = 72; d.gold = 6000;
    let k=null; for(const q of Object.keys(localStorage)) if(/ludus-slot-\d/.test(q)) k=q;
    if(k) localStorage.setItem(k, JSON.stringify(d)); });
  await p.reload({ waitUntil:"domcontentloaded" }); await p.waitForTimeout(1100);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/take up the keys/i.test(x.innerText||"")); if(b) b.click(); });
  await p.waitForTimeout(1100); await clearAll(p, 8);

  await openReport(p);
  const sh = await readSheet(p);
  if(!sh) return { pass:false, why:"the report sheet did not open", lines };

  lines.push(`groups: ${sh.heads.join(" → ") || "(none)"} · ${sh.rows} rows · deeds on the line: ${sh.deeds.join(" | ") || "(none)"}`);

  /* GROUPED — the heads that appear must be in the due → worth → wanted order */
  const ORDER = ["DUE", "WORTH DOING", "WHAT THE HOUSE STILL WANTS"];
  const rank = sh.heads.map(h=>ORDER.indexOf(h));
  if(rank.some((v,i)=> i && v < rank[i-1]))
    fails.push(`the groups are out of order: ${sh.heads.join(" → ")} — due must lead`);
  if(!sh.heads.length) fails.push("the sheet has no groups at all — it is a flat list again");
  if(!/week that was/i.test(sh.lead || ""))
    fails.push(`the sheet does not lead with the week that was (leads with "${sh.lead}")`);

  /* ACTED — the cells are at 72, so a deed must be offered, and pressing it must land */
  if(!sh.deeds.length){
    fails.push("no deed on any row, with the cells at 72 and 6,000d in the box — the row verbs are not reaching the sheet");
  } else {
    const before = await slot(p);
    const pressed = await p.evaluate(()=>{
      const w = [...document.querySelectorAll(".modalwrap")]
        .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
      const b = [...w.querySelectorAll("button.btn")]
        .find(x=>!x.disabled && /set the tables|go down to the block|take the rung/i.test(x.innerText||""));
      if(!b) return null; const t=(b.innerText||"").trim(); b.click(); return t;
    });
    await p.waitForTimeout(700); await clearAll(p, 6); await waitSaved(p);
    const after = await slot(p);
    lines.push(`pressed "${pressed}" · unrest ${before.unrest} → ${after.unrest} · gold ${Math.round(before.gold)} → ${Math.round(after.gold)}`);
    if(!pressed) fails.push("the deed on the row could not be pressed");
    else if(after.unrest >= before.unrest && Math.round(after.gold) === Math.round(before.gold))
      fails.push(`"${pressed}" changed nothing — a verb that does not move the house is a button that lies`);
  }

  /* CLOSED — the end-week button counts what is DUE and nothing else */
  for(let i=0;i<3;i++){
    if(!await p.evaluate(()=>!!document.querySelector(".modalwrap"))) break;
    await p.keyboard.press("Escape"); await p.waitForTimeout(180);
  }
  const close = await p.evaluate(`(()=>{
    const b = [...document.querySelectorAll("button")].find(x=>/^end week/i.test((x.innerText||"").trim()));
    const bar = document.querySelector(".reportbar");
    return { label: b ? (b.innerText||"").trim() : null,
             barCount: bar ? +(((bar.innerText||"").match(/(\\d+)\\s*$/)||[])[1] || 0) : null };
  })()`);
  const due = await p.evaluate(()=>(window.__LVDVS.agenda(JSON.parse(
    localStorage.getItem(Object.keys(localStorage).find(k=>/ludus-slot-\d/.test(k)))))||[])
    .filter(a=>a.urgency>=3).length);
  lines.push(`end week reads "${close.label}" · ${due} due · bar carries ${close.barCount}`);
  if(close.label == null) fails.push("no end-week button on the page");
  else {
    const said = +((close.label.match(/(\d+)\s+unanswered/i)||[])[1] || 0);
    if(said !== due)
      fails.push(`the week's close says ${said || "nothing"} unanswered against ${due} actually due — the count is not the agenda's`);
  }

  /* ---- AND THE COUNT ITSELF, WHICH IS ONLY TESTED WHEN SOMETHING IS ACTUALLY DUE ----
     The founding above happens to owe nothing this week, so the close read "End week" and the
     number went unexercised — the half most likely to rot. A levy falling due THIS week is an
     urgency-3 row by construction, so force one and read the button again. */
  await p.evaluate(()=>{ const A = window.__LVDVS;
    const d = A.newGameState("Due","clean","SHEET-DUE",null);
    d.unrest = 40; d.gold = 4000;
    d.deadlines = [{ id: 9001, kind:"levy", amount: 240, due: d.week }];
    let k=null; for(const q of Object.keys(localStorage)) if(/ludus-slot-\d/.test(q)) k=q;
    if(k) localStorage.setItem(k, JSON.stringify(d)); });
  await p.reload({ waitUntil:"domcontentloaded" }); await p.waitForTimeout(1100);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/take up the keys/i.test(x.innerText||"")); if(b) b.click(); });
  await p.waitForTimeout(1100); await clearAll(p, 8);
  for(let i=0;i<3;i++){
    if(!await p.evaluate(()=>!!document.querySelector(".modalwrap"))) break;
    await p.keyboard.press("Escape"); await p.waitForTimeout(180);
  }

  const due2 = await p.evaluate(()=>(window.__LVDVS.agenda(JSON.parse(
    localStorage.getItem(Object.keys(localStorage).find(k=>/ludus-slot-\d/.test(k)))))||[])
    .filter(a=>a.urgency>=3).length);
  const label2 = await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/^end week/i.test((x.innerText||"").trim())); return b ? (b.innerText||"").trim() : null; });
  lines.push(`with a levy due: end week reads "${label2}" · ${due2} due`);
  if(!due2) fails.push("the forced levy did not raise a due row — the fixture no longer bites");
  else {
    const said2 = +((String(label2).match(/(\d+)\s+unanswered/i)||[])[1] || 0);
    if(said2 !== due2)
      fails.push(`the week's close says ${said2 || "nothing"} unanswered against ${due2} due — the count is not the agenda's`);
  }
  /* and the sheet must now show a DUE group, first */
  await openReport(p);
  const sh2 = await readSheet(p);
  lines.push(`with a levy due: groups ${sh2 ? sh2.heads.join(" → ") : "(no sheet)"}`);
  /* ---- AND THE DATE MUST BE ON THE ROW ----
     111 of 735 agenda rows carried a horizon and every one carried it as PROSE. `when` makes it a
     field, so the row can print a clock and the group can be ordered by what falls first. A levy
     due this week must say so on its own line. */
  const clocks = await p.evaluate(`(()=>{
    const w = [...document.querySelectorAll(".modalwrap")]
      .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
    if(!w) return [];
    return [...w.querySelectorAll("span.tag")].map(t=>(t.innerText||"").trim())
      .filter(t=>/^(this week|next week|\\d+ weeks)$/i.test(t));
  })()`);
  lines.push(`clocks on the sheet: ${clocks.join(" · ") || "(none)"}`);
  if(!clocks.some(c=>/this week/i.test(c)))
    fails.push("a levy falls due this week and no row carries a clock saying so — the horizon is prose again");
  if(sh2 && sh2.heads[0] !== "DUE")
    fails.push(`something is due and the sheet leads with "${sh2.heads[0]||"nothing"}" — due must lead`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
