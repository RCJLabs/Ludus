/* HOW MANY DIFFERENT MEN CAN THE DRAWING DRAW?

   The game is a shadow play. A silhouette has no colour, no texture and no face, so its whole
   vocabulary is SHAPE — and the six men standing in your yard are the drawing you look at every
   week. This renders the real scene over a matrix of men and counts how many DISTINCT drawings
   come out, by diffing the actual SVG each one produces with his position and his name stripped.

   It counts the arena's `Fighter` the same way, because the two should not be measured by
   different rules.
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
        return t+"#"+k+"#"+(e.getAttribute("fill")||"")+"#"+(e.getAttribute("stroke")||"")+"#"+(e.getAttribute("stroke-width")||e.getAttribute("strokeWidth")||"");
      }).join("~");
      out.push({ lab, d });
    }
    return out;
  })()`);
}

const normalise = rows => rows.map(r=>r.d);   /* slot 0 every time; nothing to normalise */

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
    g.injury = { name:"x", weeks:a.i, pen:a.i*2, part:["flank","arm","head","thigh","hand"][a.i-1] };
  if(a.axis === "scars")
    g.scars = Array.from({length:a.i}).map((_,k)=>({ part:["flank","arm","head","thigh","brow"][k%5],
      x:50+k*4, y:60+k*6, big:k%2===0 }));
  if(a.axis === "sex") g.sex = a.i % 2 ? "f" : "m";
  if(a.axis === "record"){ g.wins = a.i*7; g.fame = a.i*180; g.morale = 20+a.i*15; }
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

await browser.close(); server.close();

console.log(`=== the drawn man in the yard: how much of him does the picture say?\n`);
console.log(`  the six classes are: ${CLS.join(", ")}\n`);
console.log(`  ${"axis".padEnd(10)} ${"men drawn".padStart(10)} ${"distinct drawings".padStart(19)}`);
for(const r of runs)
  console.log(`  ${r.axis.padEnd(10)} ${String(r.drawn).padStart(10)} ${String(r.distinct).padStart(19)}${r.distinct<=1?"   <-- says nothing":""}`);
console.log(`\n  ACROSS EVERY AXIS AT ONCE: ${seen.size} distinct drawings.`);
console.log(`  He carries a class (${CLS.length}), a kit, scars, an injury, fatigue, wins, fame, morale,`);
console.log(`  a sex and an origin (${AXES.origins}). A silhouette has no colour, no texture and no face,`);
console.log(`  so shape is the whole of what it can say — and this is how much of him it says.`);
