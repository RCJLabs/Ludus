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
import { found, tab, clearAll, installRope , forge } from "../harness.mjs";

export const name = "scene";
export const describe = "every room in the drawn ludus does what it promises";

export async function run({ p, errors }){
  const lines = [], fails = [];
  await found(p, { seed:"REACH-1" });
  await installRope(p);
  await forge(p, (A, R) => {
    const d=A.newGameState("Reach","clean","REACH-1",null);
    for(let i=0;i<16;i++){ if(d.over) break; R.lanista(d); }
    return d; }); await clearAll(p, 8);
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

  /* ---- THE DRAWING MUST NOT KEEP ITS OWN NUMBERS ----
     The racks' caption read `Object.keys(S.gear).length` — the count of gear IDS the save has
     ever touched, zero-count entries included — while the armoury's panel read rackUsed(), which
     sums what is on the rack. Over 120 played weeks they disagreed in 115: the scene drew seven
     pieces standing where the racks held none. A number the drawing and a panel both report has
     to come from one place, and this asserts the drawn one against the handle's. */
  {
    const rack = await p.evaluate(()=>{
      const A = window.__LVDVS;
      const k = Object.keys(localStorage).find(q=>/ludus-slot-\d/.test(q));
      const d = JSON.parse(localStorage.getItem(k));
      const g = [...document.querySelectorAll(".scn")]
        .find(x=>(x.getAttribute("aria-label")||"").toLowerCase().startsWith("the racks"));
      return { drawn: g ? (g.textContent||"").replace(/\s+/g," ").trim() : null,
               used: A.rackUsed(d), cap: A.rackCap(d) };
    });
    lines.push(`the racks are drawn "${rack.drawn}" against rackUsed ${rack.used} of ${rack.cap}`);
    const said = rack.drawn && rack.drawn.match(/(\d+)\s+of\s+(\d+)/);
    if(rack.used === 0){
      if(!/bare/i.test(rack.drawn||"")) fails.push(`the racks hold nothing and the drawing says "${rack.drawn}"`);
    } else if(!said || +said[1] !== rack.used){
      fails.push(`the drawing says "${rack.drawn}" and the racks hold ${rack.used} — the scene is keeping a second number for the same rack`);
    }
  }

  const tapScn = lab => p.evaluate(l=>{ const g=[...document.querySelectorAll(".scn")]
    .find(x=>(x.getAttribute("aria-label")||"").toLowerCase().includes(l)); if(!g) return false;
    g.dispatchEvent(new MouseEvent("click",{bubbles:true})); return true; }, lab);
  const modalState = () => p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")].pop();
    if(!w) return null; const dets=[...w.querySelectorAll("details")];
    return { title:((w.querySelector(".disp")||{}).innerText||"").slice(0,40), dets:dets.length,
      open:dets.filter(d=>d.open).length,
      seeIt: [...w.querySelectorAll("button")].some(b=>/see it in the house/i.test(b.innerText||"")) }; });
  /* ---- THE MATCHER WAS A SUBSTRING AND A BUTTON GREW PROSE ----
     This read `/put it down|close/i.test(innerText)` — anywhere in the text, any button in the
     modal. It worked for as long as every button in this game carried a SHORT LABEL. v3.153.0 made
     the altar a ledger whose rows are buttons carrying a line of copy each, and Aesculapius's row
     says "wounds close faster". It sits above the real control in DOM order, so `shut` found it
     first, clicked it, SELECTED A GOD, and left the modal standing — after which the next tap in
     the drawn yard landed on a scene behind an open document and this check reported "tapping
     Firmus the Secutor opened The Temple". Nothing about the scene was broken.
     Anchored to the whole trimmed label now. The close control in this game says one of two
     things and both are exact; a button that merely CONTAINS the word close is body copy. */
  const shut = () => p.evaluate(()=>{ const b=[...document.querySelectorAll(".modalwrap button")]
    .find(x=>/^(put it down|close)$/i.test((x.innerText||"").trim())); if(b) b.click(); return !!b; });

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
  await forge(p, (A, R) => {
    const d=A.newGameState("Full","clean","YARD-8",null);
    for(let i=0;i<16;i++){ if(d.over) break; R.lanista(d); }
    /* THE ROPE CANNOT HOLD A BIG YARD. Its measured steady state is ~4.5 men (90 paired seeds,
       v3.82.0), so keep:8 for 40 weeks left SIX and keep:10 for 60 left FIVE -- the overflow
       branch never rendered and the collision assert passed green over a deliberately broken
       build, twice. So the fixture forges the yard: clone the sturdiest man up to nine, under the
       LONG names the bug was reported with. The scene only reads name, class and fatigue, and
       this check only reads the scene. */
    const base = A.activeG(d)[0];
    const names = ["Boduognatus","Diophantos","Asmatokos","Vercingetorix","Ambiorix",
                   "Astyanax","Kalliphon","Segomaros","Britomartus"];
    /* ids may be strings, so Math.max over them is NaN and every clone shares it -- suffix the
       base id instead. And the save goes to EVERY slot: "take up the keys" resumes the ACTIVE
       slot while a find-first write can land in another, which is exactly how this fixture
       reported roster 5 with 2 drawn -- two different houses in one sentence. */
    /* and the CEILING was the same dead filter, on the same fields that do not exist -- see the
       note over `roster` below. `d.gladiators` counts the buried, so a house that had lost four
       men over sixteen weeks read nine before a single clone was made, the loop added NOTHING,
       and the yard stood at five: under the overflow gate, with the check proving nothing. The
       scene's own census is the only number that can size this fixture, and the name list is
       long enough to fill the yard from a house of one. */
    names.forEach((nm,i)=>{
      if(A.activeG(d).length >= 9) return;
      const c = JSON.parse(JSON.stringify(base));
      c.id = String(base.id) + "-clone" + i; c.name = nm; c.nick = null; c.injury = null; c.fatigue = 20;
      d.gladiators.push(c);
    });
    /* forge() plants into EVERY slot — the lesson this fixture learned the hard way, now the
       helper's job rather than each caller's — and refuses to continue if it does not survive. */
    /* and NO doctore, so the square draws its other branch — see the note over judgeFit */
    d.doctore = null;
    return d; });
  await clearAll(p, 8);
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
    /* ---- THE DENOMINATOR WAS A FILTER ON FIELDS THAT DO NOT EXIST ----
       This read `!g.dead && !g.sold && !g.freed && !g.fled`. The game keeps a man's state in
       `g.status` — "dead", "freed", "escaped", "sold", "retired", "departed", the `GONE` list —
       and there is no `g.dead`, no `g.sold`, no `g.freed` and no `g.fled` anywhere in the file. So
       every term was `!undefined`, the filter was a NO-OP, and "roster" meant every man the house
       ever held INCLUDING THE BURIED. It was being compared against the men standing in the yard,
       which the scene draws from `activeG`. It passed only while the fixture had few dead: at
       roster 9 with 5 alive it demanded a "+N more" label for four men who are in the ground.
       The scene's own population is the only honest denominator, so it is asked for by name. */
    const roster = (()=>{ try { const d0 = JSON.parse(localStorage.getItem(
        Object.keys(localStorage).find(k=>/ludus-slot-\d/.test(k))));
      return (window.__LVDVS.activeG(d0)||[]).length; } catch(e){ return -1; } })();
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


  /* ---- AND THE WHOLE DRAWING, NOT JUST THE YARD ----
     The yard's collision test above was written when the yard was the only room with more than one
     text in it. The art pass gave the training square four palus posts and the "no doctore" line
     went straight through two of them — a fault the SHAPE COUNT could not see (it went 3 -> 13,
     which reads as an improvement) and the yard test does not look at. So: every text in the scene
     against every other text, every text against every palus post, and every text inside the
     viewBox. Geometry, from the browser's own getBBox. */
  const readFit = () => p.evaluate(`(()=>{
    const svg = document.querySelector('svg[aria-label^="The ludus"]'); if(!svg) return null;
    const vb = svg.getAttribute("viewBox").split(/\\s+/).map(Number);
    const texts = [...svg.querySelectorAll("text")].map(t=>{ const b=t.getBBox();
      return { say:(t.textContent||"").trim().slice(0,30),
               x1:b.x, y1:b.y, x2:b.x+b.width, y2:b.y+b.height }; });
    const hit = (a,b)=> a.x1<b.x2 && b.x1<a.x2 && a.y1<b.y2 && b.y1<a.y2;
    const over = [];
    for(let i=0;i<texts.length;i++) for(let j=i+1;j<texts.length;j++)
      if(hit(texts[i],texts[j])) over.push(texts[i].say + " >< " + texts[j].say);
    /* the palus posts, found by their own dimensions rather than a class the drawing does not carry */
    const posts = [...svg.querySelectorAll("rect")]
      .filter(r=>+r.getAttribute("width")===7 && +r.getAttribute("height")===66)
      .map(r=>({ x1:+r.getAttribute("x"), y1:+r.getAttribute("y"),
                 x2:+r.getAttribute("x")+7, y2:+r.getAttribute("y")+66 }));
    const onPost = [];
    for(const t of texts) for(const q of posts)
      if(hit(t,q)) onPost.push('"' + t.say + '" crosses the palus post at x=' + q.x1);
    const outside = texts.filter(t=>t.y2 > vb[3] + 1 || t.y1 < -1 || t.x1 < -1 || t.x2 > vb[2] + 1)
      .map(t=>t.say);
    return { n:texts.length, posts:posts.length, over, onPost, outside,
             lowest:Math.round(texts.reduce((m,t)=>Math.max(m,t.y2),0)), vbH:vb[3] };
  })()`);
  /* ---- AND IT HAS TO RUN ON BOTH BRANCHES OF THE SQUARE ----
     Written as a single read on the full-yard house, this passed with the collision deliberately
     restored: that house has a doctore, so the "no doctore — the drill only half takes" line —
     the one that was drawn through two posts — never rendered at all. A geometry test can only
     see the text that is on the page. The fixture above now forces `doctore = null` so this
     house draws that branch, and the rich house below carries a doctore and draws the other. */
  const judgeFit = (fit, whose) => {
    if(!fit){ fails.push(`no scene to measure the drawing on (${whose})`); return; }
    lines.push(`the whole drawing, ${whose}: ${fit.n} texts, ${fit.posts} palus posts · lowest text at ${fit.lowest} of ${fit.vbH} · ${fit.over.length} text collisions · ${fit.onPost.length} on a post · ${fit.outside.length} outside the frame`);
    for(const c of fit.over)    fails.push(`${whose}: two labels sit on top of each other: ${c}`);
    for(const c of fit.onPost)  fails.push(`${whose}: ${c} \u2014 the sentence is drawn through the drawing`);
    for(const c of fit.outside) fails.push(`${whose}: "${c}" falls outside the viewBox \u2014 it is drawn and it cannot be read`);
  };
  judgeFit(await readFit(), "no doctore");

  /* ---- EVERY ROOM MUST SAY SOMETHING ONLY THIS HOUSE KNOWS ----
     Measured before the art pass, with the agenda Badge excluded because that is shared machinery
     and not a room's own voice: rendering a founding beside a house of 260 weeks, five of eight
     rooms changed their words and three did not. The villa said "THE VILLA", the shrine said "the
     shrine", and the road said "THE ROAD — TO THE SAND", in that house and in every house — doors
     with a name painted on them, in a drawing whose whole point is that it reports.

     The trap on the other side is the FIXTURE, not the room: the first cut of this comparison set
     neither `rise` (the census rung is stored, not derived from fame) nor `piety` (which defaults
     to 30 in every house), and then blamed the villa and the shrine for saying the same thing
     twice. So the second house here is deliberately different in every axis a room reads. */
  const roomWords = () => p.evaluate(`(()=>{
    const svg = document.querySelector('svg[aria-label^="The ludus"]'); if(!svg) return null;
    /* A ROOM IS A GROUP YOU CAN PRESS, NOT EVERY GROUP IN THE DRAWING. This enumerated every
       direct g child and labelled an unlabelled one "the yard". The art pass added two groups of
       SCENERY - the wall courses and the courtyard colonnade - which are aria-hidden, carry no
       label and open nothing, and the count went 8 rooms to 10 with two phantom "yards" that of
       course said the same thing in both houses. The check was right to fail; it was counting the
       wrong things. (No backticks in here: this note lives inside a template literal, and the
       first one closed the string.)
       AND THE FALLBACK NAME BELOW IS NOT DEAD CODE. Filtering to groups that carry a label dropped
       the count to 7, because the YARD is a wrapper: its labelled hotspot is nested inside an
       unlabelled group that holds the men and their names. That wrapper is a room and the fallback
       is what names it. Only the hidden scenery is skipped. */
    return [...svg.querySelectorAll(":scope > g")]
      .filter(g=>g.getAttribute("aria-hidden") !== "true")
      .map(g=>({
      lab: g.getAttribute("aria-label") || "the yard",
      says: [...g.querySelectorAll("text")].filter(t=>!t.closest("[aria-hidden='true']"))
              .map(t=>(t.textContent||"").trim()).filter(Boolean).join(" | ") }));
  })()`);
  const poor = await roomWords();
  await forge(p, (A, R) => {
    const d = A.newGameState("Great","clean","YARD-8",null);
    d.gold = 90000; d.fame = 900; d.week = 260; d.unrest = 78;
    d.rise = { rank: 3 }; d.piety = 88; d.blessing = { god:"mars", until: d.week + 3 };
    while(d.gladiators.length < 9) d.gladiators.push(A.genGladiator(d, 70));
    d.doctore = { name:"Oppius Naso", skill:82, wage:60, drill:"blade", pupil:null };
    d.gear = {}; Object.keys(A.GEAR||{}).slice(0,14).forEach(k=>{ d.gear[k] = 1; });
    d.domus = { wife:{ name:"Caecilia", family:"Metella" }, children:[], nextKin:1 };
    /* and the BLOCK, or the gate matches by coincidence: the first run of this comparison failed
       on the gate because both houses happened to carry four men at 221d, which is not the gate
       being silent. A fixture that differs in every axis a room reads is the only one that can
       tell a silent room from a lucky one. */
    d.market = [];
    return d; });
  await clearAll(p, 8);
  await tab(p, "ludus"); await p.waitForTimeout(400); await clearAll(p, 6);
  await tab(p, "ludus"); await p.waitForTimeout(300);
  const rich = await roomWords();
  judgeFit(await readFit(), "with a doctore");
  if(!poor || !rich) fails.push("could not read the scene's rooms on both houses");
  else {
    const mute = [];
    for(let i=0;i<poor.length;i++){
      const a = poor[i], b = rich[i];
      if(b && a.says === b.says) mute.push(`${a.lab.split("\u2014")[0].trim()} ("${a.says || "no words at all"}")`);
    }
    lines.push(`rooms: ${poor.length} · silent in both houses: ${mute.length ? mute.join(", ") : "none"}`);
    for(const m of mute)
      fails.push(`${m} says the same thing for a founding as for a house of 260 weeks \u2014 it is a door with a name painted on it, not a room that reports`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
