/* WHAT THE YARDSTICK CANNOT SEE — the chips

   `reach` counts an action as `button.btn` or `button.optrow`. It narrowed to those two because
   reading every <button> counted section SUMMARIES as actions, which was worse. But the game has a
   third control class, `chip`, and chips are two different things wearing one style: some switch a
   VIEW (the rack's style filter, the face switchers, which carry role=tab), and some change the
   HOUSE — `setDrill` picks what every man in the yard trains this week.

   That matters for phase E specifically. Folding a section costs a tap on everything inside it, and
   deciding to fold THE TRAINING SQUARE while blind to the control it exists for would be exactly
   the kind of decision this project keeps refusing to make. So: count them, print their labels, and
   say which face each is on. Labels are the raw material — a count alone cannot tell a filter from
   a lever, and I would rather read thirty labels than trust a classifier.
*/
import { serve, open, found, tab, clearAll } from "../harness.mjs";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p, errors } = await open(port);
await found(p, { seed:"REACH-1" });
for(let w=0; w<26; w++){ const ok = await p.evaluate(()=>{
    const b=[...document.querySelectorAll("button")].find(x=>/^end week$/i.test((x.innerText||"").trim()));
    if(b){ b.click(); return true; } return false; });
  if(!ok) break; await p.waitForTimeout(150); await clearAll(p, 3); }

const faces = () => p.evaluate(()=>[...document.querySelectorAll('div[role=tablist]')]
  .filter(d=>!d.closest('.modalwrap')&&!d.closest('.modal'))
  .flatMap(d=>[...d.querySelectorAll('button[role=tab]')]).map(b=>(b.innerText||"").trim()));

const rows = [];
for(const t of ["ludus","familia","arena","market","villa"]){
  await tab(p, t); await p.waitForTimeout(320); await clearAll(p, 6);
  await tab(p, t); await p.waitForTimeout(300);
  const fs = await faces(); const list = fs.length ? fs : [null];
  for(const f of list){
    if(f){ await p.evaluate(l=>{ const b=[...document.querySelectorAll('div[role=tablist] button[role=tab]')]
      .find(x=>(x.innerText||"").trim()===l); if(b) b.click(); }, f); await p.waitForTimeout(300); }
    const got = await p.evaluate(()=>{
      const all=[...document.querySelectorAll("details.sect")], was=all.map(d=>d.open);
      all.forEach(d=>d.open=true);
      const sc=document.querySelector(".scroll > div");
      const out=[...(sc||document).querySelectorAll("button.chip")]
        .filter(b=>b.getAttribute("role")!=="tab" && !b.closest(".modalwrap"))
        .map(b=>({ label:(b.innerText||"").replace(/\s+/g," ").trim().slice(0,26),
          sect:((b.closest("details.sect")||{}).querySelector?.("summary")||{}).innerText?.split("\n")[0].trim().slice(0,28)||"(none)" }));
      all.forEach((d,i)=>d.open=was[i]);
      return out; });
    for(const g of got) rows.push({ where: f ? `${t} · ${f}` : t, ...g });
  }
}
console.log(`\nWHAT THE YARDSTICK CANNOT SEE — ${rows.length} chips that are not face switchers\n`);
const by = {};
for(const r of rows){ const k=`${r.where} :: ${r.sect}`; (by[k]||(by[k]=[])).push(r.label); }
for(const [k,v] of Object.entries(by).sort((a,b)=>b[1].length-a[1].length))
  console.log(`  ${String(v.length).padStart(2)}  ${k}\n        ${v.join(" | ").slice(0,150)}`);
console.log(`\n  reach counts 44 actions; these ${rows.length} are none of them. ${errors.length} page errors\n`);
await browser.close(); server.close();
