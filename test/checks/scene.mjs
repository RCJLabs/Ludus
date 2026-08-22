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
    .find(x=>{ const a=x.getAttribute("aria-label")||"";
      /* a man reads "Name the Class" with no em-dash; the yard DOOR reads "The yard \u2014 the
         familia", which also ends " the <word>" and was picked as a man once */
      return / the \w+$/i.test(a) && a.indexOf("\u2014") < 0 && !/villa|gate|racks|shrine|square|cells/i.test(a); });
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
    /* read the shell's own data-place — the tab bar this used to read is gone (v3.92.0) */
    const now = await p.evaluate(()=>{ const sh=document.querySelector("[data-place]"); return sh?sh.getAttribute("data-place"):"?"; });
    lines.push(`   the villa -> ${now}`);
    if(now!=="villa") fails.push(`tapping the villa landed on ${now}`);
    await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
      .find(x=>/back to the ludus/i.test(x.getAttribute("aria-label")||"")); if(b) b.click(); });
    await p.waitForTimeout(250);
  }

  /* ---- AND A FULL YARD, BECAUSE A TWO-MAN HOUSE CANNOT CATCH A COLLISION ----
     The first big house to look at the scene — year 15, eight men — found the names writing over
     each other: Boduognatas into Asmatokos into Vermina. The pinned morning carries two men and
     could never have shown it. So: a house driven to a full yard, and every name label's real
     BBox measured — no two labels on the same baseline may touch. */
  await installRope(p);   /* the reload above dropped it -- the rope is per-page */
  await p.evaluate(()=>{ const A=window.__LVDVS,R=window.__ROPE;
    const d=A.newGameState("Full","clean","YARD-8",null);
    for(let i=0;i<16;i++){ if(d.over) break; R.lanista(d); }
    /* THE ROPE CANNOT HOLD A BIG YARD. Its measured steady state is ~4.5 men (90 paired seeds,
       v3.82.0), so keep:8 for 40 weeks left SIX and keep:10 for 60 left FIVE -- the overflow
       branch never rendered and the collision assert passed green over a deliberately broken
       build, twice. So the fixture forges the yard: clone the sturdiest man up to nine, under the
       LONG names the bug was reported with. The scene only reads name, class and fatigue, and
       this check only reads the scene. */
    const base = A.activeG(d)[0];
    const names = ["Boduognatus","Diophantos","Asmatokos","Vercingetorix","Ambiorix"];
    /* ids may be strings, so Math.max over them is NaN and every clone shares it -- suffix the
       base id instead. And the save goes to EVERY slot: "take up the keys" resumes the ACTIVE
       slot while a find-first write can land in another, which is exactly how this fixture
       reported roster 5 with 2 drawn -- two different houses in one sentence. */
    names.forEach((nm,i)=>{
      if(d.gladiators.filter(g=>!g.dead&&!g.sold&&!g.freed&&!g.fled).length >= 9) return;
      const c = JSON.parse(JSON.stringify(base));
      c.id = String(base.id) + "-clone" + i; c.name = nm; c.nick = null; c.injury = null; c.fatigue = 20;
      d.gladiators.push(c);
    });
    for(const q of Object.keys(localStorage)) if(/ludus-slot-\d/.test(q)) localStorage.setItem(q, JSON.stringify(d)); });
  await p.reload({ waitUntil:"domcontentloaded" }); await p.waitForTimeout(1100);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/take up the keys/i.test(x.innerText||"")); if(b) b.click(); });
  await p.waitForTimeout(1100); await clearAll(p, 8);
  await tab(p, "ludus"); await p.waitForTimeout(400); await clearAll(p, 6);
  await tab(p, "ludus"); await p.waitForTimeout(300);
  const yard = await p.evaluate(()=>{
    const svg = document.querySelector('svg[aria-label^="The ludus"]'); if(!svg) return null;
    /* names against names AND every yard text against every FIGURE — the first version measured
       only name-vs-name and passed while "+5 more" sat on the sixth man's head */
    const manGs = [...svg.querySelectorAll(".scn")].filter(g=>{ const a=g.getAttribute("aria-label")||"";
      return / the \w+$/i.test(a) && a.indexOf("\u2014") < 0; });   /* "the armoury" ends the same way; men carry no em-dash */
    const names = manGs.flatMap(g=>[...g.querySelectorAll("text")]);
    const yardTexts = [...svg.querySelectorAll("text")].filter(t=>{
      const b=t.getBBox(); return b.y>370 && b.y<480 && !t.textContent.includes("YARD"); });
    const box = t=>{ const b=t.getBBox(); return { t:(t.textContent||""), x:b.x, w:b.width, y:b.y, h:b.height }; };
    const boxes = names.map(box), all = yardTexts.map(box);
    const figs = manGs.map(g=>{ const b=g.getBBox(); return { t:(g.getAttribute("aria-label")||"").split(" ")[0], x:b.x, w:b.width, y:b.y, h:b.height-16 }; });
    const clashes = [];
    for(let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++){
      const a=boxes[i], b=boxes[j];
      if(Math.abs(a.y-b.y) < 4 && a.x < b.x+b.w && b.x < a.x+a.w) clashes.push(`${a.t} / ${b.t}`);
    }
    for(const t of all) for(const f of figs){
      if(names.some(n=>n.textContent===t.t && Math.abs(box(names.find(n2=>n2.textContent===t.t)).x-t.x)<1)) continue;
      if(t.x < f.x+f.w && f.x < t.x+t.w && t.y < f.y+f.h && f.y < t.y+t.h) clashes.push(`"${t.t}" over ${f.t}'s figure`);
    }
    const roster = (()=>{ try { const d0 = JSON.parse(localStorage.getItem(
        Object.keys(localStorage).find(k=>/ludus-slot-\d/.test(k))));
      return d0.gladiators.filter(g=>!g.dead && !g.sold && !g.freed && !g.fled).length; } catch(e){ return -1; } })();
    const moreT = all.find(t=>/more$/.test(t.t)) || null;
    return { men: names.length, clashes, roster, more: moreT ? moreT.t : null };
  });
  if(!yard) fails.push("no scene on the full-yard house");
  else {
    lines.push(`full yard: roster ${yard.roster}, ${yard.men} drawn, more-label ${yard.more?`"${yard.more}"`:"absent"}, ${yard.clashes.length} collisions${yard.clashes.length?` : ${yard.clashes.join(", ")}`:""}`);
    if(yard.roster <= 6) fails.push(`the fixture yard holds ${yard.roster} men \u2014 the overflow branch has no subject and this check proves nothing about collisions; drive it harder`);
    if(yard.roster > 6 && !yard.more) fails.push(`roster ${yard.roster} but no "+N more" label rendered`);
    for(const c of yard.clashes) fails.push(`yard names collide: ${c}`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
