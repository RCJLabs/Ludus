/* #212 — WHAT IN THE DRAWING KNOWS THE HOUSE GOT GREAT?

   The audit's screenshot pair showed a forged year-27 house — 21,000 fame, every wing at level 4 —
   rendering near-identical to week one. This asks it properly: render the SAME scene from a
   founding house and a great one and diff the actual SVG, element by element, so the answer is a
   list of what varies rather than an impression.

     node test/probes/stature.mjs */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port, { height: 1400 });
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(()=>{
  const A = window.__LVDVS, R = window.__ROPE;
  /* a founding house and a great one, both real states */
  const young = A.newGameState("STAT-Y");
  const old = A.newGameState("STAT-O");
  for(let w=0; w<40; w++){ if(old.over) break; try { R.lanista(old); } catch(e){ break; } }
  old.fame = 21000; old.gold = 40000; old.favor = 95; old.acclaim = 95; old.week = 27*18+4;
  old.buildings = { valetudinarium:4, armamentarium:4, palus:4, carceres:4, balneae:4 };
  old.works = {}; for(const k of (A.WORK_KEYS||[])) old.works[k] = { left:0, began:1, paid:1, owed:0, idle:0 };
  if(A.MONU_KEYS) for(const k of A.MONU_KEYS) old.works[k] = { left:0, began:1, paid:1, owed:0, idle:0 };
  old.rise = { rank:6, standing:90 };
  return {
    young: { fame:young.fame, wings:A.BKEYS.reduce((n,k)=>n+A.bLevel(young,k),0), works:0, men:A.activeG(young).length },
    old:   { fame:old.fame,   wings:A.BKEYS.reduce((n,k)=>n+A.bLevel(old,k),0),
             works:Object.keys(old.works).length, men:A.activeG(old).length, rise:A.riseOf(old) },
    plant: { young, old },
    /* CONTROLLED ARMS: one base house, one field moved at a time */
    arms: (()=>{
      const base = A.newGameState("STAT-B");
      for(let w=0; w<40; w++){ if(base.over) break; try { R.lanista(base); } catch(e){ break; } }
      const cp = () => JSON.parse(JSON.stringify(base));
      const noWings = cp(); noWings.buildings = {};
      const allWings = cp(); allWings.buildings = { valetudinarium:4, armamentarium:4, palus:4, carceres:4, balneae:4 };
      const noWorks = cp(); noWorks.works = {};
      const allWorks = cp(); allWorks.works = {};
      for(const k of (A.ALL_WORK_KEYS||[])) allWorks.works[k] = { left:0, began:1, paid:1, owed:0, idle:0 };
      const poor = cp(); poor.fame = 5;
      const famed = cp(); famed.fame = 21000;
      const one = {};
      for(const k of (A.ALL_WORK_KEYS||[])){ const s = cp(); s.works = { [k]:{ left:0, began:1, paid:1, owed:0, idle:0 } }; one["one_"+k] = s; }
      return { noWings, allWings, noWorks, allWorks, poor, famed, ...one,
        keys: A.ALL_WORK_KEYS || [], nWorks: Object.keys(allWorks.works).length };
    })(),
  };
});

/* render each state in the real app and read the drawing back */
const shot = async (state) => {
  await p.evaluate(s=>{
    for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)) localStorage.setItem(k, JSON.stringify(s));
  }, state);
  await p.reload({ waitUntil:"load" }); await p.waitForTimeout(1400);
  /* the founding screen stands in front until the slot is taken up */
  for(let i=0;i<8;i++){
    const hit = await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
      .find(x=>/take up the keys|view the end/i.test(x.innerText||"")); if(b){ b.click(); return true; } return false; });
    if(!hit) break; await p.waitForTimeout(700);
  }
  await clearAll(p, 14); await p.waitForTimeout(400);
  return p.evaluate(()=>{
    /* WHAT THE APP THINKS IT IS SHOWING — without this a "0 new elements" reading cannot be told
       apart from a plant that never took, which is the trap this project keeps falling into. */
    let live = null;
    try { for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
      const x = JSON.parse(localStorage.getItem(k));
      if(x && x.gladiators) live = { fame: Math.round(x.fame), wings: Object.values(x.buildings||{}).reduce((n,v)=>n+v,0),
        works: Object.keys(x.works||{}).length }; } } catch(e){}
    const svg = document.querySelector('svg[aria-label^="The ludus"]');
    if(!svg) return null;
    const el = [...svg.querySelectorAll("*")];
    const sig = el.map(n=>{
      const a = [...n.attributes].filter(x=>!/^data-/.test(x.name))
        .map(x=>`${x.name}=${x.value}`).sort().join(" ");
      return `${n.tagName}[${a}]` + (n.children.length ? "" : `>${(n.textContent||"").trim().slice(0,40)}`);
    });
    return { live, n: el.length, sig, texts: [...svg.querySelectorAll("text")].map(t=>(t.textContent||"").trim()) };
  });
};
const Y = await shot(out.plant.young), O = await shot(out.plant.old);
const pair = async (a,b,label) => {
  const A1 = await shot(out.arms[a]), B1 = await shot(out.arms[b]);
  if(!A1||!B1){ console.log(`${label}: no drawing`); return; }
  const sa = new Set(A1.sig), sb = new Set(B1.sig);
  const only = B1.sig.filter(x=>!sa.has(x));
  console.log(`\n${label}: ${A1.n} vs ${B1.n} elements · ${B1.sig.filter(x=>sa.has(x)).length} identical · ${only.length} new`);
  console.log(`     the save the app is reading: ${JSON.stringify(A1.live)} -> ${JSON.stringify(B1.live)}`);
  if(JSON.stringify(A1.live) === JSON.stringify(B1.live)) console.log("     !! THE PLANT DID NOT TAKE — this arm measured nothing");
  for(const x of only.slice(0,6)) console.log("     + " + x.slice(0,130));
};
if(!Y || !O) console.log("no drawing found");
else {
  const setY = new Set(Y.sig), setO = new Set(O.sig);
  const onlyY = Y.sig.filter(x=>!setO.has(x)), onlyO = O.sig.filter(x=>!setY.has(x));
  console.log(`elements: young ${Y.n} · great ${O.n}`);
  console.log(`identical elements: ${Y.sig.filter(x=>setO.has(x)).length}`);
  console.log(`\nONLY IN THE YOUNG HOUSE (${onlyY.length}):`);
  for(const x of onlyY.slice(0,14)) console.log("   " + x.slice(0,150));
  console.log(`\nONLY IN THE GREAT HOUSE (${onlyO.length}):`);
  for(const x of onlyO.slice(0,14)) console.log("   " + x.slice(0,150));
  console.log(`\nYOUNG TEXTS: ${JSON.stringify(Y.texts)}`);
  console.log(`\nGREAT TEXTS: ${JSON.stringify(O.texts)}`);
}
console.log(`\n---- CONTROLLED ARMS, one field moved at a time ----`);
await pair("noWings","allWings","0 wings -> 20 wing-levels");
await pair("noWorks","allWorks",`0 works -> ${out.arms.nWorks} standing`);
await pair("poor","famed","fame 5 -> fame 21,000");
console.log(`\n---- AND ONE WORK AT A TIME, against the same house with none ----`);
for(const k of out.arms.keys) await pair("noWorks","one_"+k, `only ${k}`);
await browser.close(); server.close();
