/* THE SCENE — every room does what the drawing promises

   v3.89.0 drew the ludus: a cutaway where the yard, the square and the cells stopped being panels
   and became rooms. A drawing can rot in a way a panel cannot — a hotspot whose handler breaks
   still LOOKS tappable, and nothing renders wrong. So this walks the rooms the way `desk` walks the
   letters, on the same played pinned morning:

     the training square opens the square AS A DOCUMENT, unfolded, with NO "see it in the house" —
       a document opened from the scene has no elsewhere, the scene is the house
     the cells at night open the ear's panel the same way
     the shrine opens the temple WITH the footer, because the temple has a home on the villa
     a man in the yard opens his card
     the villa travels

   And the scene's callers are derived from the same agenda items the report rows carry, so the
   check asserts at least one badge on the pinned morning — a derivation that silently returns
   nothing is the dot-that-never-lights fault, invisible precisely when broken.
*/
import { found, tab, clearAll, installRope } from "../harness.mjs";

export const name = "scene";
export const describe = "every room in the drawn ludus does what it promises";

export async function run({ p, errors }){
  const lines = [], fails = [];
  await found(p, { seed:"REACH-1" });
  await installRope(p);
  await p.evaluate(()=>{ const A=window.__LVDVS,R=window.__ROPE;
    const d=A.newGameState("Reach","clean","REACH-1",null);
    for(let i=0;i<16;i++){ if(d.over) break; R.lanista(d); }
    let k=null; for(const q of Object.keys(localStorage)) if(/ludus-slot-\d/.test(q)) k=q;
    if(k) localStorage.setItem(k, JSON.stringify(d)); });
  await p.reload({ waitUntil:"domcontentloaded" }); await p.waitForTimeout(1100);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/take up the keys/i.test(x.innerText||"")); if(b) b.click(); });
  await p.waitForTimeout(1100); await clearAll(p, 8);
  await tab(p, "ludus"); await p.waitForTimeout(400); await clearAll(p, 6);
  await tab(p, "ludus"); await p.waitForTimeout(300);

  const hots = await p.evaluate(()=>[...document.querySelectorAll(".scn")]
    .map(x=>(x.getAttribute("aria-label")||"")));
  lines.push(`${hots.length} hotspots: ${hots.map(h=>h.split("—")[0].trim()).join(" · ")}`);
  if(hots.length < 6) fails.push(`only ${hots.length} hotspots in the scene — the drawing has lost rooms`);

  const badges = await p.evaluate(()=>{
    const svg = document.querySelector('svg[aria-label^="The ludus"]');
    return svg ? [...svg.querySelectorAll("circle")].filter(c=>["#c99a4b","#cf5a49"].includes(c.getAttribute("fill"))).length : -1; });
  lines.push(`${badges} caller badge${badges===1?"":"s"} standing in the scene`);
  if(badges < 1) fails.push("no caller badge in the scene on a morning the agenda raises seven items — the derivation is returning nothing, which is the dot that never lights");

  const tapScn = lab => p.evaluate(l=>{ const g=[...document.querySelectorAll(".scn")]
    .find(x=>(x.getAttribute("aria-label")||"").toLowerCase().includes(l)); if(!g) return false;
    g.dispatchEvent(new MouseEvent("click",{bubbles:true})); return true; }, lab);
  const modalState = () => p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")].pop();
    if(!w) return null; const dets=[...w.querySelectorAll("details")];
    return { title:((w.querySelector(".disp")||{}).innerText||"").slice(0,40), dets:dets.length,
      open:dets.filter(d=>d.open).length,
      seeIt: [...w.querySelectorAll("button")].some(b=>/see it in the house/i.test(b.innerText||"")) }; });
  const shut = () => p.evaluate(()=>{ const b=[...document.querySelectorAll(".modalwrap button")]
    .find(x=>/put it down|close/i.test(x.innerText||"")); if(b) b.click(); });

  for(const [lab, wantFooter, must] of [["training square", false, /training square/i],
                                        ["cells at night", false, /cells at night/i],
                                        ["shrine", true, /temple/i]]){
    if(!await tapScn(lab)){ fails.push(`no hotspot matching "${lab}"`); continue; }
    await p.waitForTimeout(400);
    const m = await modalState();
    if(!m){ fails.push(`tapping "${lab}" opened nothing`); continue; }
    lines.push(`   ${lab} -> "${m.title}" · ${m.open}/${m.dets} unfolded · footer ${m.seeIt?"shown":"hidden"}`);
    if(!must.test(m.title)) fails.push(`tapping "${lab}" opened "${m.title}"`);
    if(m.dets && m.open !== m.dets) fails.push(`"${lab}"'s document opened folded — ${m.open} of ${m.dets}`);
    if(m.seeIt !== wantFooter) fails.push(`"${lab}"'s footer is ${m.seeIt?"shown":"hidden"} and should be ${wantFooter?"shown":"hidden"} — a scene document has no elsewhere; a homed one does`);
    await shut(); await p.waitForTimeout(250);
  }

  const man = await p.evaluate(()=>{ const g=[...document.querySelectorAll(".scn")]
    .find(x=>/ the \w+$/i.test(x.getAttribute("aria-label")||"") && !/villa|gate|racks|shrine|square|cells/i.test(x.getAttribute("aria-label")||""));
    if(!g) return null; g.dispatchEvent(new MouseEvent("click",{bubbles:true}));
    return g.getAttribute("aria-label"); });
  await p.waitForTimeout(450);
  const card = await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")].pop();
    return w ? ((w.querySelector(".disp")||{}).innerText||"").slice(0,30) : null; });
  lines.push(`   a man (${man}) -> ${card || "NOTHING"}`);
  if(!man) fails.push("no man stands in the drawn yard on a house with a living roster");
  else if(!card || !card.split(",")[0] || !man.includes(card.split(",")[0].trim().split(" ")[0]))
    fails.push(`tapping ${man} opened "${card}" — not his card`);
  await shut(); await p.waitForTimeout(250);

  if(await tapScn("the villa")){ await p.waitForTimeout(450);
    const now = await p.evaluate(()=>{ const b=[...document.querySelectorAll(".tabbtn")].find(x=>x.className.includes("on")); return (b&&b.innerText.trim())||"?"; });
    lines.push(`   the villa -> ${now}`);
    if(!/villa/i.test(now)) fails.push(`tapping the villa landed on ${now}`);
  }

  /* ---- AND A FULL YARD, BECAUSE A TWO-MAN HOUSE CANNOT CATCH A COLLISION ----
     The first big house to look at the scene — year 15, eight men — found the names writing over
     each other: Boduognatas into Asmatokos into Vermina. The pinned morning carries two men and
     could never have shown it. So: a house driven to a full yard, and every name label's real
     BBox measured — no two labels on the same baseline may touch. */
  await installRope(p);   /* the reload above dropped it — the rope is per-page */
  await p.evaluate(()=>{ const A=window.__LVDVS,R=window.__ROPE;
    const d=A.newGameState("Full","clean","YARD-8",null);
    for(let i=0;i<40;i++){ if(d.over) break; R.lanista(d, { keep:8 }); }
    let k=null; for(const q of Object.keys(localStorage)) if(/ludus-slot-\d/.test(q)) k=q;
    if(k) localStorage.setItem(k, JSON.stringify(d)); });
  await p.reload({ waitUntil:"domcontentloaded" }); await p.waitForTimeout(1100);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/take up the keys/i.test(x.innerText||"")); if(b) b.click(); });
  await p.waitForTimeout(1100); await clearAll(p, 8);
  await tab(p, "ludus"); await p.waitForTimeout(400); await clearAll(p, 6);
  await tab(p, "ludus"); await p.waitForTimeout(300);
  const yard = await p.evaluate(()=>{
    const svg = document.querySelector('svg[aria-label^="The ludus"]'); if(!svg) return null;
    const names = [...svg.querySelectorAll("text")].filter(t=>{
      const g = t.closest(".scn"); return g && / the \w+$/i.test(g.getAttribute("aria-label")||""); });
    const boxes = names.map(t=>{ const b = t.getBBox(); return { t:(t.textContent||""), x:b.x, w:b.width, y:b.y }; });
    const clashes = [];
    for(let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++){
      const a=boxes[i], b=boxes[j];
      if(Math.abs(a.y-b.y) < 4 && a.x < b.x+b.w && b.x < a.x+a.w) clashes.push(`${a.t} / ${b.t}`);
    }
    return { men: names.length, clashes };
  });
  if(!yard) fails.push("no scene on the full-yard house");
  else {
    lines.push(`full yard: ${yard.men} name labels, ${yard.clashes.length} collisions${yard.clashes.length?` — ${yard.clashes.join(", ")}`:""}`);
    if(yard.men < 5) fails.push(`only ${yard.men} men drawn on a house driven to a full yard — the keep:8 fixture has drifted`);
    for(const c of yard.clashes) fails.push(`yard names collide: ${c}`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
