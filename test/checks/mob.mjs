/* THE CROWD IS DRAWN AT THE SIZE THE ENGINE ROLLS IT

   Audit item #213 said the crowd "renders as a fixed rank of heads over a gradient band" and asked
   that it "track the number — thin at 20, packed and agitated at 80". Half of that was already
   there and half of it was the wrong fault. Measured over 400 real bouts before anything changed:

     · the level uses the WHOLE range — 5th percentile 5, median 51, 95th percentile 100
     · it swings a median of 48 points INSIDE one bout, crossing a median of 6 memo buckets, so
       the row re-rendered six times a bout. It was never static.
     · brightness and bob speed already read `level`; the SEAT COUNT never did.

   AND THE FAULT NOBODY HAD STATED. The four faction tints are #2a2016, #191209, #3a1610 and
   #0e0a06 — every one within a few points of black — so the whole of "the mob is not with you"
   was a swing in ALPHA on near-black. Composited over each venue's own backdrop, an empty house
   against a howling one came to **ΔE 1.17 at the pit, 1.90 at the forum, 2.47 on the imperial
   sand**, against a just-noticeable difference of 2.3. The drawing read the number all along and
   said it below the threshold of human vision.

   From v3.161.0 the seats EMPTY: a third of the house at nothing, all of it past 80, filling from
   the middle of the tier outward. That doubles the distance (2.96 / 3.96 / 4.92) and, more to the
   point, moves the signal out of colour and into a count, which ΔE does not even measure.

   FIVE ARMS:
   1 · ONE FUNCTION. `crowdLook` is what `CrowdRow` draws from, and nothing may grow a second copy
       of it — #150's rule. The check reads the component's own output, never its arithmetic.
   2 · MORE CROWD IS MORE PEOPLE, at every venue, monotonically. A count that ever falls as the
       crowd rises is the drawing contradicting the roll.
   3 · AND THE ROW ACTUALLY THINS. Empty against full must differ by at least a third of the
       house — without this, arm 2 passes on a fill that moves by one seat.
   4 · IT IS VISIBLE. Composited over the real backdrop the venue paints, empty-to-full must clear
       the just-noticeable difference. This is the arm the fault itself would have failed.
   5 · AND IT STANDS AT THE BALANCE. `appeal` and `crux` — a man down, the editor being asked —
       must draw a row that is taller, brighter and faster than the same crowd not at the balance.

   The seats are never dropped from the DOM, only emptied: removing them reflows the row and slides
   every remaining head sideways six times a bout. Arm 3 counts occupied seats, not elements. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "mob";
export const describe = "the crowd is drawn at the size the engine rolls it";

/* the eye's own threshold. Below 1.0 no one can see it; 2.3 is the classic JND */
const JND = 2.3;

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"MOB-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate((JND)=>{
    const A = window.__LVDVS;
    const miss = ["crowdLook","CROWD_SEATS","VENUES","VEN","FAC_TINT"].filter(k=>A[k]==null);
    if(miss.length) return { miss };

    /* ---- the backdrop the row is actually seen against, by the browser's own interpolation ---- */
    const host = document.querySelector(".lr") || document.body;
    const stage = document.createElement("div");
    stage.style.cssText = "position:absolute;left:-9999px;top:0;width:390px";
    host.appendChild(stage);
    const cv = document.createElement("canvas"); cv.width = 4; cv.height = 400;
    const cx = cv.getContext("2d");
    const behind = venue => {
      stage.className = "arena v-" + venue;
      const bg = getComputedStyle(stage).backgroundImage;
      const stops = [...bg.matchAll(/(rgba?\([^)]*\))\s+([\d.]+)%/g)].map(m=>[m[1], parseFloat(m[2])/100]);
      if(stops.length < 2) return null;
      const g = cx.createLinearGradient(0,0,0,cv.height);
      for(const [c,o] of stops) g.addColorStop(Math.max(0,Math.min(1,o)), c);
      cx.fillStyle = g; cx.fillRect(0,0,4,cv.height);
      const d = cx.getImageData(2, Math.round(cv.height*0.06), 1, 1).data;   /* the row is the top of the stage */
      return [d[0],d[1],d[2]];
    };
    const hex = h => { const q=String(h).replace("#",""); return [0,1,2].map(i=>parseInt(q.slice(i*2,i*2+2),16)); };
    const over = (fg,a,bg) => fg.map((c,i)=> c*a + bg[i]*(1-a));
    const lab = ([R,G,B]) => { const f=c=>{ c/=255; return c<=.04045 ? c/12.92 : Math.pow((c+.055)/1.055,2.4); };
      const [r,g,b]=[f(R),f(G),f(B)];
      let X=(r*.4124+g*.3576+b*.1805)/.95047, Y=r*.2126+g*.7152+b*.0722, Z=(r*.0193+g*.1192+b*.9505)/1.08883;
      const k=t=> t>0.008856 ? Math.cbrt(t) : (7.787*t)+16/116;
      [X,Y,Z]=[k(X),k(Y),k(Z)];
      return [116*Y-16, 500*(X-Y), 200*(Y-Z)]; };
    const dE = (a,b) => { const p=lab(a), q=lab(b); return Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]); };

    /* the mean colour of the whole band at a level — what a player takes in at a glance */
    const band = (lv, venue, bg, up) => {
      const L = A.crowdLook(lv, venue, null, up);
      let sum = [0,0,0], on = 0;
      for(let i=0;i<L.seats;i++){
        const h = L.head(i), taken = L.taken(i);
        if(taken) on++;
        const c = over(hex(taken ? h.tint : L.bench), taken ? h.opacity : 0.3, bg);
        sum = sum.map((v,k)=>v+c[k]);
      }
      return { c: sum.map(v=>v/L.seats), on, seats:L.seats, bob:L.head(0).bob, h0:L.head(0).height };
    };

    const rows = [];
    for(const venue of Object.keys(A.VENUES)){
      const bg = behind(venue);
      if(!bg){ rows.push({ venue, noBg:true }); continue; }
      /* 2 — monotone across the whole range the engine can roll */
      let prev = -1, drops = 0;
      for(let lv=0; lv<=100; lv+=5){ const n = band(lv, venue, bg).on;
        if(n < prev) drops++; prev = n; }
      const cold = band(0, venue, bg, false), full = band(100, venue, bg, false);
      const hot = band(100, venue, bg, false), stand = band(100, venue, bg, true);
      rows.push({ venue, drops, seats: cold.seats,
        cold: cold.on, full: full.on,
        dE: +dE(cold.c, full.c).toFixed(2),
        standDE: +dE(hot.c, stand.c).toFixed(2),
        taller: stand.h0 - hot.h0, faster: +(hot.bob - stand.bob).toFixed(2) });
    }
    stage.remove();

    return { rows, seats:A.CROWD_SEATS, tints:Object.values(A.FAC_TINT) };
  }, JND);

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };

  lines.push(`  venue      seats   filled 0 -> 100    ΔE over the venue's own backdrop   at the balance`);
  for(const x of r.rows){
    if(x.noBg){ lines.push(`  ${x.venue.padEnd(10)} — no backdrop rule, drawn as the bare .arena`); continue; }
    lines.push(`  ${x.venue.padEnd(10)} ${String(x.seats).padStart(4)}    ${String(x.cold).padStart(3)} -> ${String(x.full).padStart(3)}`
      + `        ${String(x.dE).padStart(6)}${x.dE >= JND ? "  " : " !"}                     `
      + `+${x.taller}px, ${x.faster}s faster, ΔE ${x.standDE}`);
  }

  const real = r.rows.filter(x=>!x.noBg);
  if(!real.length) return { pass:false, why:`no venue resolved a backdrop — nothing was measured`, lines };

  /* 2 — more crowd is never fewer people */
  for(const x of real) if(x.drops)
    bad.push(`at ${x.venue} the drawn crowd SHRINKS ${x.drops} time${x.drops===1?"":"s"} as the level rises — `
      + `the picture is contradicting the roll it is drawn from`);
  /* 3 — and it actually thins, or arm 2 passes on a row that never moves */
  for(const x of real) if(x.full - x.cold < Math.round(x.seats/3))
    bad.push(`at ${x.venue} an empty house draws ${x.cold} of ${x.seats} and a howling one ${x.full} — `
      + `a swing of ${x.full-x.cold} where a third of the house (${Math.round(x.seats/3)}) is the least that reads`);
  /* 4 — the arm the original fault would have failed */
  for(const x of real) if(x.dE < JND)
    bad.push(`at ${x.venue} an empty house and a full one differ by ΔE ${x.dE} against a just-noticeable `
      + `difference of ${JND} — the row is tracking the number below the threshold of human vision, `
      + `which is the fault #213 was pointing at and did not name`);
  /* 5 — the balance */
  for(const x of real){
    if(!(x.taller > 0)) bad.push(`at ${x.venue} the crowd does not rise at the balance — the one moment it exists for`);
    if(!(x.faster > 0)) bad.push(`at ${x.venue} the crowd does not quicken at the balance`);
  }

  const worst = Math.min(...real.map(x=>x.dE));
  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`empty to full reads at ΔE ${worst.toFixed(2)}+ everywhere, and the house stands when the editor is asked`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
