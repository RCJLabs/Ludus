/* HOW MANY DIFFERENT MEN CAN THE DRAWING DRAW?

   The game is a shadow play. A silhouette has no colour, no texture and no face, so its whole
   vocabulary is SHAPE — and the six men standing in your yard are the drawing you look at every
   week. This renders the real scene over a matrix of men and counts how many DISTINCT drawings
   come out, by diffing the actual SVG each one produces with his position and his name stripped.

   It counts the arena's `Fighter` the same way, because the two should not be measured by
   different rules. THAT SENTENCE WAS ASPIRATIONAL FOR FOUR RELEASES — the probe measured the yard
   and nothing else, and the header said otherwise, which is the instrument claiming coverage it
   does not have. v3.146.0 made it true.

   THE FIGHTER IS MEASURED ON HIS OWN CARD, not mid-bout, and that is the whole point. In the arena
   he carries seventeen poses, live wounds, wear and aim — bout state, which moves constantly and
   would drown any reading about the MAN. His card shows the same component at `pose="idle"` with
   `wounds={[]}`, captioned "as he takes the sand". Whatever the drawing says there is what it says
   about him rather than about the moment, and it is the only place the two figures can be compared
   on the same terms.
*/
import { serve, open, found, clearAll, forge, installRope, settle, tab } from "../harness.mjs";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"VOCAB" }); await clearAll(p); await installRope(p);

/* every axis a man actually carries, and how many values it has */
const AXES = await p.evaluate(`(()=>{ const A = window.__LVDVS;
  return { classes:Object.keys(A.CLASSES||{}), origins:Object.keys(A.ORIGINS||{}).length };
})()`);

/* ONE MAN PER HOUSE, so every variant is drawn in the same slot and position cannot differ.
   The first cut planted six at once and normalised by subtracting the first number in the key from
   every number in it — but a key mixes x with y and with stroke widths, so it "found" six distinct
   drawings on every axis including the ones that cannot matter. Six renders is slower and true. */
async function yardShapes(build, arg){
  await installRope(p);
  await forge(p, build, arg);
  await clearAll(p, 8);
  await tab(p, "ludus"); await p.waitForTimeout(360); await clearAll(p, 5);
  await tab(p, "ludus"); await p.waitForTimeout(360); await settle(p);
  return await p.evaluate(`(()=>{
    const svg = document.querySelector('svg[aria-label^="The ludus"]'); if(!svg) return [];
    /* a man in the yard is a pressable group whose label is "<name> the <class>" */
    const out = [];
    for(const g of svg.querySelectorAll('g[role="button"]')){
      const lab = g.getAttribute("aria-label") || "";
      if(!/ the /.test(lab) || /^The /.test(lab)) continue;
      /* strip his position and his name: what is left is the DRAWING */
      let d = [...g.querySelectorAll("circle,path,rect,ellipse,line")].map(e=>{
        const t = e.tagName;
        const num = a => { const v = e.getAttribute(a); return v==null ? "" : v; };
        let k = ["d","points","x1","y1","x2","y2","cx","cy","x","y"].map(num).join("|");
        /* translate to the man's own origin so two men in different slots compare equal */
        k = k.replace(/-?\\d+(\\.\\d+)?/g, (m)=>{ const n=parseFloat(m); return String(Math.round(n*10)/10); });
        return t+"#"+k+"#"+(e.getAttribute("fill")||"")+"#"+(e.getAttribute("stroke")||"")+"#"+(e.getAttribute("stroke-width")||e.getAttribute("strokeWidth")||"")+"#"+(e.getAttribute("opacity")||"");
      }).join("~");
      out.push({ lab, d });
    }
    return out;
  })()`);
}

const normalise = rows => rows.map(r=>r.d);   /* slot 0 every time; nothing to normalise */

/* ---- AND THE SAME QUESTION PUT TO THE ARENA'S OWN FIGURE ----
   To a man, through the roster, the way a player reaches one — then onto the KIT face of his card,
   which is where the drawn fighter lives. `arm` learned both of these the hard way and they are
   copied from it: the gatekeeper's note sits above the roster and its UNDERSTOOD is the first
   button on the page, and the card has five faces with the figure behind only one of them. */
const FIGHTER_SVG = 'svg[viewBox="0 0 128 146"]';
async function cardShape(build, arg){
  await installRope(p);
  await forge(p, build, arg);
  await clearAll(p, 8);
  await tab(p, "men"); await p.waitForTimeout(300);
  await clearAll(p, 6); await p.waitForTimeout(220);
  await p.evaluate(()=>{ const c = [...document.querySelectorAll("button.panel")][0]; if(c) c.click(); });
  await p.waitForTimeout(420);
  await p.evaluate(()=>{ const c = [...document.querySelectorAll(".modalwrap button.chip")]
    .find(b=>/^kit$/i.test((b.innerText||"").trim())); if(c) c.click(); });
  await p.waitForTimeout(360); await settle(p);
  return await p.evaluate(`(()=>{
    const svg = document.querySelector('${FIGHTER_SVG}'); if(!svg) return null;
    /* his sag is on the svg's own style and on no child, so a key built from child attributes
       alone reports fatigue as absent while it is working */
    const root = getComputedStyle(svg).transform;
    return root + "@@" + [...svg.querySelectorAll("circle,path,rect,ellipse,line,polygon,polyline")].map(e=>{
      const a = n => e.getAttribute(n) || "";
      return [e.tagName, a("d"), a("points"), a("cx"), a("cy"), a("x"), a("y"),
              a("x1"), a("y1"), a("x2"), a("y2"), a("r"), a("rx"), a("ry"),
              a("width"), a("height"), a("fill"), a("stroke"), a("stroke-width"),
              a("opacity"), a("transform")].join("|");
    }).join("~");
  })()`);
}

const seen = new Set();
const runs = [];
const CLS = AXES.classes;

/* one sweep per axis, six men at a time */
/* ONE builder, handed which axis and which step; it plants exactly one man */
const ONE = (A, R, a) => {
  const d = A.newGameState("V","clean","VOC-"+a.axis+"-"+a.i,null);
  d.gold = 40000; d.week = 40;
  /* newGameState SEEDS A FAMILIA. The first cut of this planted one man and then measured the
     yard's first slot, which was one of the starting men -- so every axis came back "1 distinct
     drawing", including injury, which plainly does draw. Same fault as the full-yard fixture in
     `scene` and the refusal count in #201: a planted population compared against an unplanted one. */
  d.gladiators = [];
  const g = A.genGladiator(d, 60);
  /* ONE AXIS AT A TIME. The first cut varied the class inside the `sex` sweep as well, and
     reported six distinct drawings for a two-valued axis — the class was doing the work. */
  g.cls = a.axis === "class" ? a.cls[a.i] : a.cls[0];
  g.kit = A.defaultKit(g.cls);
  g.status = "active"; g.fatigue = 0; g.injury = null; g.scars = []; g.sex = "m";
  if(a.axis === "fatigue") g.fatigue = [0,20,40,60,80,100][a.i];
  if(a.axis === "injury" && a.i > 0)
    /* real parts, through the game's own constructor. "head" is not a target the game has — every
       injury part comes from TARGETS, and the fighter looks its binding up in that same table, so
       sweeping "head" fell to the trunk fallback and collided with flank: five distinct drawings
       reported for a six-valued axis, and the axis was the instrument's fault, not the drawing's. */
    g.injury = A.injuryFor(["flank","arm","brow","thigh","hand"][a.i-1], false);
  /* likewise scars: `scarMark` is the one place a mark gets its coordinates, and hand-built ones
     with invented x/y measure a body the game never draws on */
  if(a.axis === "scars")
    g.scars = Array.from({length:a.i}).map((_,k)=>A.scarMark(["flank","arm","brow","thigh"][k%4], k%2===0));
  if(a.axis === "sex") g.sex = a.i % 2 ? "f" : "m";
  g.wins = 0; g.losses = 0; g.kills = 0; g.pfame = 0;
  if(a.axis === "record"){ g.wins = [0,1,2,4,7,14][a.i]; g.pfame = [0,12,40,90,180,300][a.i]; g.kills = [0,0,0,1,2,5][a.i]; }
  d.gladiators.push(g);
  return d;
};

for(const axis of ["class","fatigue","injury","scars","sex","record"]){
  const keys = [];
  for(let i=0;i<6;i++){
    const rows = await yardShapes(ONE, { axis, i, cls:CLS });
    if(rows.length) keys.push(rows[0].d);
  }
  const uniq = new Set(keys);
  runs.push({ axis, drawn:keys.length, distinct:uniq.size });
  for(const k of uniq) seen.add(k);
}

/* ---- AND NOW THE FIGHTER, over the same axes ---- */
const fRuns = [], fSeen = new Set();
let fBlind = 0;
for(const axis of ["class","fatigue","injury","scars","sex","record"]){
  const keys = [];
  for(let i=0;i<6;i++){
    const k = await cardShape(ONE, { axis, i, cls:CLS });
    if(k) keys.push(k); else fBlind++;
  }
  const uniq = new Set(keys);
  fRuns.push({ axis, drawn:keys.length, distinct:uniq.size });
  for(const k of uniq) fSeen.add(k);
}

await browser.close(); server.close();

console.log(`=== the drawn man in the yard: how much of him does the picture say?\n`);
console.log(`  the six classes are: ${CLS.join(", ")}\n`);
console.log(`  ${"axis".padEnd(10)} ${"men drawn".padStart(10)} ${"distinct drawings".padStart(19)}`);
for(const r of runs)
  console.log(`  ${r.axis.padEnd(10)} ${String(r.drawn).padStart(10)} ${String(r.distinct).padStart(19)}${r.distinct<=1?"   <-- says nothing":""}`);
console.log(`\n  ACROSS EVERY AXIS AT ONCE: ${seen.size} distinct drawings.`);
console.log(`\n=== and the ARENA'S OWN FIGHTER, on his card, at rest\n`);
if(fBlind) console.log(`  !! ${fBlind} renders drew no fighter at all — the card or its KIT face has moved\n`);
console.log(`  ${"axis".padEnd(10)} ${"men drawn".padStart(10)} ${"distinct drawings".padStart(19)}`);
for(const r of fRuns)
  console.log(`  ${r.axis.padEnd(10)} ${String(r.drawn).padStart(10)} ${String(r.distinct).padStart(19)}${r.distinct<=1?"   <-- says nothing":""}`);
console.log(`\n  ACROSS EVERY AXIS AT ONCE: ${fSeen.size} distinct drawings.`);
console.log(`  He carries a class (${CLS.length}), a kit, scars, an injury, fatigue, wins, renown, kills,`);
console.log(`  a sex and an origin (${AXES.origins}). A silhouette has no colour, no texture and no face,`);
console.log(`  so shape is the whole of what it can say — and this is how much of him it says.`);
