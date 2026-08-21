/* THE WEAPON RACK, TAKEN APART — the largest single object in the game

   3,727px on an idle house and 2,942px on a played one: 85% of the armory's arrival height, and
   the armory has nothing else on it. So this is not a disclosure question — folding it empties the
   tab — and the two shapes an answer could take pull in opposite directions:

     fewer rows      show a short list and a way to see the rest. Keeps the buy button on every
                     visible row, so buying stays at one tap and reach's floor holds.
     shorter rows    move the flavour behind a tap. Also keeps the button, but costs the ability to
                     compare two pieces without opening both.

   Which is right depends on where the height actually is, and "a row is about 207px" was arithmetic
   — 3,727 divided by 18 — not a measurement. So this measures each row and each PART of a row, and
   prints them. It also counts how many of the listed pieces the house can actually afford, because
   a list where three of eighteen are buyable is a different problem from one where all eighteen are.

   Measured on a house the rope has played, not one left alone: the idle pinned house owns 3 pieces
   and 296 denarii, which would make every affordability figure here a fact about doing nothing.

   Usage: node test/probes/rack.mjs [weeks]
*/
import { serve, open, found, tab, clearAll, installRope } from "../harness.mjs";
const W = +(process.argv[2] || 16);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p, errors } = await open(port);
await found(p, { seed:"REACH-1" });
await installRope(p);
const built = await p.evaluate(w=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const d = A.newGameState("Reach", "clean", "REACH-1", null);
  for(let i=0;i<w;i++){ if(d.over) break; R.lanista(d); }
  let key = null; for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)) key = k;
  if(!key) return { err:"no save slot" };
  localStorage.setItem(key, JSON.stringify(d));
  return { week:d.week, gold:Math.round(d.gold), men:A.activeG(d).length, gear:Object.keys(d.gear||{}).length };
}, W);
await p.reload({ waitUntil:"domcontentloaded" });
await p.waitForTimeout(1100);
await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
  .find(x=>/take up the keys/i.test((x.innerText||"").trim())); if(b) b.click(); });
await p.waitForTimeout(1100); await clearAll(p, 8);
await tab(p, "armory"); await p.waitForTimeout(400); await clearAll(p, 6);
await tab(p, "armory"); await p.waitForTimeout(400);

/* a slot button's text is two lines — "WEAPON" then "5 owned, 1 idle" — so keep the first for the
   label and for matching, or every row of this table wears the house's inventory in its slot column */
const slots = await p.evaluate(()=>[...document.querySelectorAll("button.focusbtn")]
  .map(b=>((b.innerText||"").split("\n")[0]||"").trim()).filter(Boolean));
const pick = (sel, label) => p.evaluate(([sel,l])=>{ const b=[...document.querySelectorAll(sel)]
  .find(x=>(x.innerText||"").trim().toUpperCase().startsWith(l.toUpperCase())); if(b) b.click(); }, [sel,label]);

const shape = () => p.evaluate(()=>{
  const sect = document.querySelector("details.sect");
  if(!sect) return null;
  /* a row is a child div of the list that holds a buy/sell button or a price — take the ones with a
     dotted top border, which is what separates one piece from the next */
  const rows = [...sect.querySelectorAll("div")].filter(d=>/dotted/.test(d.style.borderTop||""));
  const parts = {};
  for(const r of rows) for(const c of r.children){
    const h = Math.round(c.getBoundingClientRect().height); if(!h) continue;
    /* "dim" covers two different things and lumping them hid the decision: `it.desc` is flavour,
       but the line under it names the styles the piece suits, which is the only functional reason to
       prefer one over another. Keep a sample of the text so the split can be read, not assumed. */
    const txt = (c.innerText||"").replace(/\s+/g," ").trim();
    const k = c.tagName === "BUTTON" ? "button (buy/order/sell)"
      : (c.className||"").includes("dim") ? (/^suits|^styles|style/i.test(txt) ? "dim — which styles it suits" : "dim — flavour")
      : (c.className||"").includes("flex") ? (/\d+d|costs nothing/i.test(txt) ? "flex — name and price" : "flex — tags") : (c.tagName.toLowerCase());
    if(!parts[k]) parts[k] = { n:0, px:0, eg:txt.slice(0,72) };
    const g = parts[k]; g.n++; g.px += h;
  }
  const buys = [...sect.querySelectorAll("button.btn")].filter(b=>/buy|order/i.test(b.innerText||""));
  const names = rows.map(r=>{ const t=(r.innerText||"").split("\n").map(x=>x.trim()).filter(Boolean);
    const price=(t.find(x=>/^\d+d$|^\d+d /.test(x))||t.find(x=>/\d+d/.test(x))||"").slice(0,14);
    return `${(t[0]||"?").slice(0,26).padEnd(28)} ${price}`; });
  return { names, sectH: Math.round(sect.getBoundingClientRect().height), rows: rows.length,
    rowH: rows.map(r=>Math.round(r.getBoundingClientRect().height)),
    parts, buyable: buys.filter(b=>!b.disabled).length, buyTotal: buys.length };
});

console.log(`\nTHE WEAPON RACK, TAKEN APART`);
console.log(`  house: week ${built.week} · ${built.gold}d · ${built.men} men · ${built.gear} pieces owned\n`);
console.log(`  ${"slot".padEnd(10)} ${"filter".padEnd(14)} ${"rows".padStart(5)} ${"section px".padStart(11)} ${"px/row".padStart(7)} ${"affordable".padStart(11)}`);
const FILTS = ["IN OUR STYLES", "EVERYTHING", "ON THE RACKS"];
let deflt = null;
for(const s of slots){
  await pick("button.focusbtn", s); await p.waitForTimeout(320);
  for(const f of FILTS){
    await pick("button.chip", f); await p.waitForTimeout(300);
    const r = await shape(); if(!r) continue;
    if(!deflt && f === FILTS[0]) deflt = { slot:s, ...r };
    console.log(`  ${s.padEnd(10)} ${f.toLowerCase().padEnd(14)} ${String(r.rows).padStart(5)} `
      + `${String(r.sectH).padStart(11)} ${String(r.rows?Math.round(r.sectH/r.rows):0).padStart(7)} `
      + `${`${r.buyable} of ${r.buyTotal}`.padStart(11)}`);
  }
}
if(deflt){
  console.log(`\n  WHERE A ROW'S HEIGHT GOES — ${deflt.slot}, in our styles, ${deflt.rows} rows:`);
  const tot = Object.values(deflt.parts).reduce((a,x)=>a+x.px,0);
  for(const [k,v] of Object.entries(deflt.parts).sort((a,b)=>b[1].px-a[1].px))
    console.log(`     ${String(v.px).padStart(5)}px  ${String(Math.round(v.px/tot*100)).padStart(3)}%  ${String(v.n).padStart(3)}x  ${k}\n            e.g. "${v.eg}"`);
  console.log(`\n  AND THE ORDER THEY COME IN:`);
  for(const r of deflt.names) console.log(`     ${r}`);
  const hs = deflt.rowH.slice().sort((a,b)=>a-b);
  console.log(`     row heights: min ${hs[0]} · median ${hs[Math.floor(hs.length/2)]} · max ${hs[hs.length-1]}`);
}
console.log(`\n  ${errors.length} page errors\n`);
await browser.close(); server.close();
