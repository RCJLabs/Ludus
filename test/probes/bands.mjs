/* #212 — LOOK AT THE SHAPE YOU JUST DREW

   Every graphics item in this project has cost a cut of the work to the same fault: a shape that
   is in the DOM is not a shape that reads. v3.152.0 guessed seven crop boxes and three of them
   framed the wrong room. v3.160.0's baths came out as a cottage with a chimney and its colossus as
   a man cheering, and neither is visible in a diff — both are obvious in a second on screen.

   This shoots the drawn ludus, blown up, band by band, for a house that has built everything or
   nothing. Look at the pictures.

     node test/probes/bands.mjs /tmp/shots            a house with nothing built
     node test/probes/bands.mjs /tmp/shots all        every wing, every work standing

   IT REFUSES TO SHOOT A HOUSE IT DID NOT PLANT. Roughly one reload in four landed on the app's own
   founding week instead of the save being planted while #212 was measured, and a run that shot a founding house while
   reporting a great one is worse than no run — it is what let #212 stand for a hundred releases.
   The save the app is actually reading is printed, and a plant that did not take exits 3. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";
const SP = process.argv[2] || ".", ALL = process.argv[3] === "all";
const BANDS = { villa:[0,120], portico:[110,206], square:[200,330], yard:[330,470],
                block:[460,600], road:[600,720] };
const SEL = 'svg[aria-label^="The ludus"]';
const WIDE = 1100;   /* the drawing is 390 across; this is near 3x, which is where a shape is judged */

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port, { width: 1200, height: 1500 });
await found(p); await clearAll(p, 20); await installRope(p);

const st = await p.evaluate((ALL)=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const d = A.newGameState("Bands", "clean", "BANDS-1", null);
  for(let w=0; w<40; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
  d.works = {};
  if(ALL){
    for(const k of A.ALL_WORK_KEYS) d.works[k] = { left:0, began:1, paid:1, owed:0, idle:0 };
    d.buildings = {}; for(const k of A.BKEYS) d.buildings[k] = 4;
  }
  return d;
}, ALL);

let took = null;
for(let tries=0; tries<6 && !took; tries++){
  await p.evaluate(s=>{ for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)) localStorage.setItem(k, JSON.stringify(s)); }, st);
  await p.reload({ waitUntil:"load" }); await p.waitForTimeout(1400);
  for(let i=0;i<8;i++){ const hit = await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/take up the keys/i.test(x.innerText||"")); if(b){ b.click(); return true; } return false; });
    if(!hit) break; await p.waitForTimeout(700); }
  await clearAll(p, 14); await p.waitForTimeout(500);
  const live = await p.evaluate(()=>{ const k=Object.keys(localStorage).find(q=>/ludus-slot-\d/.test(q));
    const d=k?JSON.parse(localStorage.getItem(k)):null;
    return d ? { week:d.week, works:Object.keys(d.works||{}).length } : null; });
  if(live && live.week === st.week) took = live;
}
console.log("the save the app is reading:", JSON.stringify(took));
if(!took){ console.log("!! THE PLANT DID NOT TAKE — nothing shot"); await browser.close(); server.close(); process.exit(3); }

await p.evaluate(([sel,w])=>{ const s=document.querySelector(sel);
  s.style.width = w+"px"; s.style.maxWidth = "none";
  for(let e=s.parentElement; e && e!==document.body; e=e.parentElement){ e.style.overflow="visible"; e.style.maxWidth="none"; }
}, [SEL, WIDE]);
await p.waitForTimeout(400);

for(const [n,[y0,y1]] of Object.entries(BANDS)){
  await p.evaluate(sel=>{ document.querySelector(sel).scrollIntoView({ block:"start" }); }, SEL);
  await p.waitForTimeout(120);
  const a = await p.evaluate(([sel,y0])=>{ const b=document.querySelector(sel).getBoundingClientRect();
    return b.y + b.height*y0/720; }, [SEL,y0]);
  await p.evaluate(y=>window.scrollBy(0, y), Math.max(0, a - 30));
  await p.waitForTimeout(150);
  const q = await p.evaluate(([sel,y0,y1])=>{ const b=document.querySelector(sel).getBoundingClientRect();
    return { x:b.x, y:b.y + b.height*y0/720, w:b.width, h:b.height*(y1-y0)/720 }; }, [SEL,y0,y1]);
  const file = `${SP}/band-${n}${ALL?"-all":""}.png`;
  await p.screenshot({ path:file, clip:{ x:Math.max(0,q.x), y:Math.max(0,q.y),
    width:Math.min(q.w, 1200-Math.max(0,q.x)), height:q.h } });
  console.log(`  ${n.padEnd(8)} ${file}`);
}
await browser.close(); server.close();
