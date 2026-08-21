/* IS THE PINNED HOUSE ANYBODY'S HOUSE? — the denominator under every figure in the overhaul

   `reach` pins REACH-1 so two builds diff cleanly, and it founds that house and clicks "end week"
   twenty-six times. It never buys a man, never hires a doctore, never spends a coin. Everything the
   overhaul has been scored on — 44 actions, 36 below the fold, 7,166px of section standing open —
   is measured on a house that has done nothing for half a year.

   That surfaced from a specific oddity: THE TRAINING SQUARE is 1,130px of panel that reach says
   carries no action at all. It is `{S.doctore ? <the doctore, his drill chips and two buttons> :
   <what a doctore is and who is available>}`, and the pinned house has no doctore, so the whole
   1,130px is the explaining branch. Deciding to fold a panel on that evidence would be deciding
   from a house nobody plays.

   So: the same seed, twice. One founded and left alone, which is what reach measures; one built by
   `newGameState` and driven twenty-six weeks by the rope — the reference player — then written into
   the save slot and reloaded so the real UI renders it. Same house, same rolls, the only difference
   being whether anybody played it. Both are read in ARRIVAL state, sections as they come.

   Usage: node test/probes/played.mjs [weeks]
*/
import { serve, open, found, tab, clearAll, installRope } from "../harness.mjs";
const W = +(process.argv[2] || 26);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p, errors } = await open(port);
await found(p, { seed:"REACH-1" });

const faces = () => p.evaluate(()=>[...document.querySelectorAll('div[role=tablist]')]
  .filter(d=>!d.closest('.modalwrap')&&!d.closest('.modal'))
  .flatMap(d=>[...d.querySelectorAll('button[role=tab]')]).map(b=>(b.innerText||"").trim()));

/* arrival geometry: sections as they come, plus the buttons that are reachable without opening one */
const readFace = () => p.evaluate(()=>{
  const sc = document.querySelector(".scroll > div");
  const secs = [...document.querySelectorAll("details.sect")].map(d=>({
    /* the FIRST line of a summary can be the agenda's mark — a bare "1" — so take the first line
       that actually has a letter in it, or the panel reports itself as a number */
    title: (((d.querySelector("summary")||{}).innerText||"").split("\n").map(x=>x.trim())
      .find(x=>/[a-z]/i.test(x)) || "(unnamed)").slice(0,30),
    h: Math.round(d.getBoundingClientRect().height), open: d.open }));
  const btns = [...(sc||document).querySelectorAll("button.btn, button.optrow")]
    .filter(b=>b.getAttribute("role")!=="tab" && !b.closest("summary") && !b.closest(".modalwrap")).length;
  const chips = [...(sc||document).querySelectorAll("button.chip")]
    .filter(b=>b.getAttribute("role")!=="tab" && !b.closest(".modalwrap")).length;
  return { faceH: sc ? Math.round(sc.getBoundingClientRect().height) : 0, secs, btns, chips };
});

/* FACES ARE MATCHED BY INDEX, NOT LABEL. A villa face chip wears the agenda's mark, so on a played
   house its text reads "1\nCOIN & COUNCIL" and on an idle one "COIN & COUNCIL" — matching on the
   label silently dropped the one face the two arms most needed to be compared on. The face count
   per tab is fixed by the source, so the index is the stable key and the label is only for print. */
const walk = async () => {
  const out = [];
  for(const t of ["ludus","familia","arena","market","villa"]){
    await tab(p, t); await p.waitForTimeout(320); await clearAll(p, 6);
    await tab(p, t); await p.waitForTimeout(280);
    const n = (await faces()).length;
    for(let fi = 0; fi < Math.max(1, n); fi++){
      let label = null;
      if(n){ label = await p.evaluate(i=>{ const b=[...document.querySelectorAll('div[role=tablist]')]
        .filter(d=>!d.closest('.modalwrap')&&!d.closest('.modal'))
        .flatMap(d=>[...d.querySelectorAll('button[role=tab]')])[i];
        if(!b) return null; b.click();
        return ((b.getAttribute("aria-label")||b.innerText||"").split(",")[0].replace(/\s+/g," ").replace(/^\d+\s*/,"").trim()); }, fi);
        await p.waitForTimeout(280); }
      out.push({ where: `${t}${label?` · ${label}`:""}`, key: `${t}#${fi}`, ...(await readFace()) });
    }
  }
  return out;
};

/* ---- ARM ONE: founded and left alone, which is what reach measures ---- */
for(let w=0; w<W; w++){ const ok = await p.evaluate(()=>{
    const b=[...document.querySelectorAll("button")].find(x=>/^end week$/i.test((x.innerText||"").trim()));
    if(b){ b.click(); return true; } return false; });
  if(!ok) break; await p.waitForTimeout(150); await clearAll(p, 3); }
const idle = await walk();
const idleState = await p.evaluate(()=>{ for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
  try{ const s=JSON.parse(localStorage.getItem(k)); if(s&&s.gladiators) return { week:s.week, gold:s.gold, fame:s.fame,
    men:(s.gladiators||[]).filter(g=>!g.dead&&!g.sold&&!g.freed).length, doctore:!!s.doctore, gear:Object.keys(s.gear||{}).length }; }catch(e){} }
  return null; });

/* ---- ARM TWO: the same seed, played by the reference player ---- */
await installRope(p);
const built = await p.evaluate(w=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const d = A.newGameState("Reach", "clean", "REACH-1", null);
  for(let i=0;i<w;i++){ if(d.over) break; R.lanista(d); }
  let key = null;
  for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)) key = k;
  if(!key) return { err:"no save slot to write into" };
  localStorage.setItem(key, JSON.stringify(d));
  return { week:d.week, gold:Math.round(d.gold), fame:Math.round(d.fame),
    men:A.activeG(d).length, doctore:!!d.doctore, gear:Object.keys(d.gear||{}).length, over:!!d.over };
}, W);
await p.reload({ waitUntil:"domcontentloaded" });
await p.waitForTimeout(1200);
await clearAll(p, 8);
/* WHAT IS ACTUALLY ON SCREEN AFTER THE RELOAD. The first run of this probe read 0px faces on the
   played arm with 0 page errors, which means the state loaded and the game did not render — so
   print the screen rather than guess at it. */
const screen = await p.evaluate(()=>({
  modals: [...document.querySelectorAll(".modalwrap")].length,
  heads: [...document.querySelectorAll("h1,h2,.disp")].map(x=>(x.innerText||"").trim()).filter(Boolean).slice(0,6),
  btns: [...document.querySelectorAll("button")].map(x=>(x.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean).slice(0,10),
  scrollH: (()=>{ const sc=document.querySelector(".scroll > div"); return sc?Math.round(sc.getBoundingClientRect().height):-1; })() }));
console.log("  after the reload:", JSON.stringify(screen).slice(0,340));
/* the save is there; the title screen offers it. Take up the keys. */
const resumed = await p.evaluate(()=>{
  const b=[...document.querySelectorAll("button")].find(x=>/take up the keys/i.test((x.innerText||"").trim()));
  if(!b) return false; b.click(); return true; });
if(!resumed) throw new Error("played arm: no `take up the keys` on the title screen — the save was not offered");
await p.waitForTimeout(1100); await clearAll(p, 8);
const lived = await walk();

const fmt = o => o ? `week ${o.week} · ${o.gold}d · fame ${o.fame} · ${o.men} men · doctore ${o.doctore?"yes":"no"} · ${o.gear} gear` : "(unreadable)";
console.log(`\nIS THE PINNED HOUSE ANYBODY'S HOUSE?\n`);
console.log(`  left alone : ${fmt(idleState)}`);
console.log(`  played     : ${fmt(built)}\n`);
const by = {};
for(const r of idle) by[r.key] = { idle:r, where:r.where };
for(const r of lived) (by[r.key] || (by[r.key]={ where:r.where })).lived = r;
console.log(`  ${"face".padEnd(26)} ${"arrival px".padStart(16)}   ${"open sects".padStart(11)}   ${"controls".padStart(12)}`);
for(const [k,v] of Object.entries(by)){
  const a=v.idle, b=v.lived; if(!a||!b) { console.log(`  ${v.where.padEnd(26)} (only one arm)`); continue; }
  const d=b.faceH-a.faceH;
  console.log(`  ${v.where.padEnd(26)} ${String(a.faceH).padStart(6)} → ${String(b.faceH).padStart(6)} ${(d>0?`+${d}`:`${d}`).padStart(6)}`
    + `   ${String(a.secs.filter(x=>x.open).length).padStart(4)} → ${String(b.secs.filter(x=>x.open).length).padStart(4)}`
    + `   ${String(a.btns+a.chips).padStart(5)} → ${String(b.btns+b.chips).padStart(5)}`);
}
const tot = o => o.reduce((s,x)=>s+x.faceH,0), ctl = o => o.reduce((s,x)=>s+x.btns+x.chips,0);
const openList = (o,tag) => { const all=o.flatMap(r=>r.secs.filter(x=>x.open).map(x=>({...x, where:r.where})))
    .sort((a,b)=>b.h-a.h);
  console.log(`\n  standing open, ${tag} — ${all.length} sections, ${all.reduce((s,x)=>s+x.h,0)}px:`);
  for(const x of all) console.log(`     ${String(x.h).padStart(5)}px  ${x.title.padEnd(30)} ${x.where}`); };
openList(idle, "left alone"); openList(lived, "played");
console.log(`\n  all faces: ${tot(idle)}px → ${tot(lived)}px · controls ${ctl(idle)} → ${ctl(lived)} · ${errors.length} page errors\n`);
await browser.close(); server.close();
