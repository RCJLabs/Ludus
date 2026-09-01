/* #213 — IS THE DRAWN CROWD ACTUALLY STATIC, AND OVER WHAT RANGE?

   The item says: "the crowd renders as a fixed rank of heads over a gradient band; the crowd meter
   lives as text below. Recommend the drawn crowd track the number — thin at 20, packed and agitated
   at 80 — using the eight venue backdrops that already exist to carry venue tier."

   READ FIRST, BECAUSE THE ITEM IS AT LEAST PARTLY WRONG. `CrowdRow` already takes `level`:

       const heads  = V.crowd <= -16 ? 14 : V.crowd <= -9 ? 20 : 30;   // by VENUE, not by level
       const dur    = 2.4 - (level/100)*1.5;                           // bob speed  <- level
       const bright = 0.25 + (level/100)*0.75;                         // opacity    <- level

   So brightness and agitation already track the number, and the venue already changes the count.
   What does NOT track it is HOW MANY heads there are — thin-at-20 is exactly the thing missing —
   and six of the nine venues share the same count of 30.

   AND THERE IS A SECOND GATE NOBODY WOULD FIND BY READING THE COMPONENT — its memo:

       (a,b) => Math.round(a.level/8) === Math.round(b.level/8) && a.venue === b.venue && ...

   The row only re-renders when the level crosses an 8-point bucket. So the question that decides
   this item is not "does the code read `level`" but:

     1 · WHAT RANGE does `crowd` actually take on a real bout? If it lives in 40-70, then
         "thin at 20, packed at 80" is asking the drawing for states the game never produces —
         which is how #208 died.
     2 · HOW MANY DISTINCT RENDERINGS does ONE bout produce? If a bout crosses one bucket, the
         row IS static for the length of the bout, whatever the source says, and the item is
         right for the reason it did not give.

     node test/probes/mob.mjs 10 40 */
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 10), B = +(process.argv[3] || 40);

/* the two numbers the component is built on, parsed off the source rather than retyped, so a
   probe that has fallen behind the component says so instead of reporting a stale truth */
const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const HEADS = (src.match(/const seats = ([^;]+);/) || src.match(/const heads = ([^;]+);/) || ["", "??"])[1].trim();
const MEMO  = (src.match(/\}, \(a,b\)=> Math\.round\(a\.level([^\n]+)/) || ["", "??"])[1].trim();
const BUCKET = +((MEMO.match(/\/(\d+)\)/) || ["", "8"])[1]);
console.log(`CrowdRow, as it stands:`);
console.log(`  seats = ${HEADS}`);
console.log(`  memo  = a.level${MEMO}`);
console.log(`  so the row re-renders only when the level crosses a ${BUCKET}-point bucket\n`);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"MOB" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,B,BUCKET])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","VENUES","VEN"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  const all = [], perBout = [], byVenue = {}, buckets = {};
  let bouts = 0, beats = 0, noCrowd = 0;

  for(let h=0; h<H; h++){
    const d = A.newGameState("Mob", "clean", "MOB-"+h, null);
    for(let w=0; w<12; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
    for(let i=0; i<B*3 && perBout.length < (h+1)*B; i++){
      if(d.over) break;
      let t; try { t = R.takeBout(d, { singlesOnly:true }); } catch(e){ t = null; }
      if(!t || t.ran === false){ try { R.lanista(d); } catch(e){ break; } continue; }
      const bs = (t.res && t.res.beats) || [];
      if(!bs.length) continue;
      bouts++;
      const lv = [];
      for(const b of bs){ beats++; if(b.crowd == null){ noCrowd++; continue; } lv.push(b.crowd); all.push(b.crowd); }
      if(!lv.length) continue;
      /* what the ROW actually draws: one rendering per bucket the bout crosses */
      const seen = new Set(lv.map(x=>Math.round(x/BUCKET)));
      const ven = (t.offer && t.offer.venue) || (t.res && t.res.venue) || "?";
      perBout.push({ n:lv.length, lo:Math.min(...lv), hi:Math.max(...lv), renders:seen.size, ven });
      byVenue[ven] = byVenue[ven] || { bouts:0, sum:0, lo:100, hi:0, renders:0 };
      const V = byVenue[ven];
      V.bouts++; V.sum += lv.reduce((n,x)=>n+x,0)/lv.length;
      V.lo = Math.min(V.lo, Math.min(...lv)); V.hi = Math.max(V.hi, Math.max(...lv));
      V.renders += seen.size;
      for(const x of lv){ const k = Math.floor(x/10)*10; buckets[k] = (buckets[k]||0)+1; }
    }
  }
  /* and what the component's own inputs would be at the extremes the game actually reaches */
  const q = a => { const s=a.slice().sort((x,y)=>x-y); const at = f=>s[Math.floor(f*(s.length-1))];
    return { n:s.length, min:s[0], p05:at(.05), p25:at(.25), p50:at(.5), p75:at(.75), p95:at(.95), max:s[s.length-1] }; };
  const heads = {};
  /* the row's OWN answer, not a copy of it — crowdLook is what the component draws from */
  for(const k of Object.keys(A.VENUES)){ const V = A.VEN(k);
    const cold = A.crowdLook(5, k, null), hot = A.crowdLook(95, k, null);
    heads[k] = { crowd:V.crowd, heads: cold.seats, cold: cold.filled, hot: hot.filled }; }
  return { bouts, beats, noCrowd, level:q(all), perBout, byVenue, buckets, heads,
    renders:q(perBout.map(x=>x.renders)), spread:q(perBout.map(x=>x.hi-x.lo)) };
}, [H,B,BUCKET]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  console.log(`${out.bouts} bouts · ${out.beats} beats · ${out.noCrowd} of them carried no crowd figure\n`);
  console.log(`THE LEVEL THE DRAWING IS GIVEN, over every beat of every bout:`);
  console.log("  " + JSON.stringify(out.level));
  console.log(`\n  by ten:`);
  for(const k of Object.keys(out.buckets).map(Number).sort((a,b)=>a-b))
    console.log(`   ${String(k).padStart(3)}-${String(k+9).padStart(3)}  ${"#".repeat(Math.round(out.buckets[k]/Math.max(1,out.beats)*160)).padEnd(42)} ${out.buckets[k]}`);

  console.log(`\nWHAT ONE BOUT SHOWS — distinct renderings of the row, at a ${BUCKET}-point bucket:`);
  console.log("  " + JSON.stringify(out.renders));
  console.log(`  the level's own spread within one bout: ${JSON.stringify(out.spread)}`);

  console.log(`\nBY VENUE — mean level, the range seen, and the heads the row draws there:`);
  console.log("  venue     bouts   mean   seen        heads   renders/bout");
  for(const [k,V] of Object.entries(out.byVenue).sort((a,b)=>b[1].bouts-a[1].bouts))
    console.log(`  ${k.padEnd(9)} ${String(V.bouts).padStart(5)}   ${(V.sum/V.bouts).toFixed(1).padStart(4)}   `
      + `${(V.lo+"-"+V.hi).padEnd(10)}  ${String((out.heads[k]||{}).heads ?? "?").padStart(5)}   ${(V.renders/V.bouts).toFixed(2)}`);

  console.log(`\nEVERY VENUE'S HEAD COUNT, whether a house fights there or not:`);
  const byN = {};
  for(const [k,v] of Object.entries(out.heads)){ (byN[v.heads] = byN[v.heads] || []).push(`${k}(${v.crowd})`); }
  for(const n of Object.keys(byN).sort((a,b)=>a-b)) console.log(`  ${String(n).padStart(2)} seats: ${byN[n].join(" ")}`);
  console.log(`\n  and how many of those seats are FILLED, cold (level 5) against hot (95):`);
  for(const [k,v] of Object.entries(out.heads))
    console.log(`    ${k.padEnd(9)} ${String(v.cold).padStart(2)} of ${v.heads}  ->  ${String(v.hot).padStart(2)} of ${v.heads}`);
}
console.log("\n" + JSON.stringify({ level:out.level, renders:out.renders, spread:out.spread }));

/* ---- AND THE HALF THAT DECIDES THE ITEM: IS ANY OF IT VISIBLE? ----
   The faction tints are #2a2016, #191209, #3a1610 and #0e0a06 — every one within a few points of
   black — and before v3.161.0 the whole of "the mob is not with you" was a swing in ALPHA on those.
   This composites the row's OWN head colour (from `crowdLook`, not a copy of its arithmetic) over
   the real backdrop the venue paints behind it, using the browser's own gradient interpolation —
   the method `umbra` and `paint` both use — and reports the distance a player could actually see.

   ΔE below about 1.0 is invisible to anyone; 2.3 is the classic "just noticeable difference". */
const look = await p.evaluate(()=>{
  const A = window.__LVDVS;
  if(!A.crowdLook) return { miss:"crowdLook" };
  const host = document.querySelector(".lr") || document.body;
  const stage = document.createElement("div");
  stage.style.cssText = "position:absolute;left:-9999px;top:0;width:390px";
  host.appendChild(stage);
  const row = document.createElement("div"); row.className = "crowdrow"; stage.appendChild(row);
  const cv = document.createElement("canvas"); cv.width = 4; cv.height = 400;
  const cx = cv.getContext("2d");
  /* the backdrop colour at the height the crowd row sits at, for one venue */
  const behind = (venue) => {
    stage.className = "arena v-" + venue;
    const bg = getComputedStyle(stage).backgroundImage;
    const stops = [...bg.matchAll(/(rgba?\([^)]*\))\s+([\d.]+)%/g)].map(m=>[m[1], parseFloat(m[2])/100]);
    if(stops.length < 2) return [30,22,14];
    const g = cx.createLinearGradient(0,0,0,cv.height);
    for(const [c,o] of stops) g.addColorStop(Math.max(0,Math.min(1,o)), c);
    cx.fillStyle = g; cx.fillRect(0,0,4,cv.height);
    const d = cx.getImageData(2, Math.round(cv.height*0.06), 1, 1).data;   /* the row is the top 56 of ~360 */
    return [d[0],d[1],d[2]];
  };
  const hex = h => { const q=String(h).replace("#",""); return [0,1,2].map(i=>parseInt(q.slice(i*2,i*2+2),16)); };
  const over = (fg, a, bg) => fg.map((c,i)=> c*a + bg[i]*(1-a));
  /* CIE76 in Lab, which is the only distance that means anything to an eye */
  const lab = ([R,G,B]) => { const f=c=>{ c/=255; c = c<=.04045 ? c/12.92 : Math.pow((c+.055)/1.055,2.4); return c; };
    const [r,g,b]=[f(R),f(G),f(B)];
    let X=(r*.4124+g*.3576+b*.1805)/.95047, Y=r*.2126+g*.7152+b*.0722, Z=(r*.0193+g*.1192+b*.9505)/1.08883;
    const k=t=> t>0.008856 ? Math.cbrt(t) : (7.787*t)+16/116;
    [X,Y,Z]=[k(X),k(Y),k(Z)];
    return [116*Y-16, 500*(X-Y), 200*(Y-Z)]; };
  const dE = (a,b) => Math.hypot(...lab(a).map((v,i)=>v-lab(b)[i]));

  const rows = [];
  for(const venue of ["pit","forum","imperial"]){
    const bg = behind(venue);
    const at = (lv, up) => { const L = A.crowdLook(lv, venue, null, up);
      /* the mean head, composited: what the band as a whole looks like */
      let sum = [0,0,0], lit = 0;
      for(let i=0;i<L.seats;i++){ const h = L.head(i);
        const on = L.taken(i);
        const c = on ? over(hex(h.tint), h.opacity, bg) : over(hex(L.bench), 0.3, bg);
        sum = sum.map((v,k)=>v+c[k]); if(on) lit++; }
      return { c: sum.map(v=>v/L.seats), filled:lit, seats:L.seats, bob:L.head(0).bob }; };
    /* ---- THE CONTROL: WHAT THIS BAND LOOKED LIKE BEFORE v3.161.0 ----
       Every seat filled at every level, which is the one line the old component had. It is
       reproduced here as a CONTROL and nowhere else — without it "ΔE 4.9" is a number with
       nothing to be bigger than, and the release could not say what it bought. */
    const flat = (lv) => { const L = A.crowdLook(lv, venue, null, false);
      let sum = [0,0,0];
      for(let i=0;i<L.seats;i++){ const h = L.head(i);
        const c = over(hex(h.tint), h.opacity, bg); sum = sum.map((v,k)=>v+c[k]); }
      return sum.map(v=>v/L.seats); };
    const cold = at(5,false), warm = at(50,false), hot = at(95,false), stand = at(95,true);
    rows.push({ venue, bg,
      coldHot:  +dE(cold.c, hot.c).toFixed(2),
      coldWarm: +dE(cold.c, warm.c).toFixed(2),
      hotStand: +dE(hot.c, stand.c).toFixed(2),
      wasColdHot: +dE(flat(5), flat(95)).toFixed(2),
      wasColdWarm: +dE(flat(5), flat(50)).toFixed(2),
      seats: cold.seats, fCold: cold.filled, fHot: hot.filled,
      bobCold: cold.bob, bobHot: hot.bob, bobStand: stand.bob });
  }
  stage.remove();
  return { rows };
});

console.log(`\n---- WHAT THE EYE GETS, head colour composited over the venue's own backdrop ----`);
if(look.miss) console.log("  handle missing:", look.miss);
else {
  console.log(`  venue      seats  filled cold->hot    ΔE cold->hot      ΔE cold->mid     bob cold->hot->standing`);
  console.log(`                                     was  ->  now      was  ->  now`);
  for(const r of look.rows)
    console.log(`  ${r.venue.padEnd(10)} ${String(r.seats).padStart(4)}   ${String(r.fCold).padStart(4)} -> ${String(r.fHot).padStart(2)}`
      + `     ${String(r.wasColdHot).padStart(5)} -> ${String(r.coldHot).padStart(5)}    ${String(r.wasColdWarm).padStart(5)} -> ${String(r.coldWarm).padStart(5)}`
      + `     ${r.bobCold}s -> ${r.bobHot}s -> ${r.bobStand}s`);
  console.log(`\n  ΔE under 1.0 is invisible; 2.3 is the just-noticeable difference.`);
  console.log(`  the balance (standing) moves the band a further ΔE of ${look.rows.map(r=>r.hotStand).join(" · ")}`);
}
await browser.close(); server.close();
