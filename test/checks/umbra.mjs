/* A SILHOUETTE NEEDS A WALL BEHIND IT

   The game has been a shadow play since v3.138.0: the fighters are near-black masses and the
   backdrop is the light they are read against. That is a CONTRAST system, and nothing measured
   the contrast — so v3.138.0 and v3.139.0 both shipped green with the light aimed at the wrong
   height and the dimmest venue at **2.7:1**, which is a dark shape on a dark wall.

   `.v-pit` is 64% of every bout. The majority of fights in the game were unreadable, through two
   full releases, both of them 107/107.

   WHY NOTHING CAUGHT IT. `backdrop` proves every venue differs FROM THE OTHERS — it is a check
   about telling Puteoli from Capua, and it passes just as happily on nine equally unreadable
   walls. `palette` proves TEXT clears 4:1 on its ground, and exempts the venue backdrops by name
   because they are paintings. Between "these nine differ" and "the type is legible" sat the
   question neither asks: can a man be seen standing in front of this?

   WHAT IT MEASURES. Not the gradient's peak — the peak is wherever the author put it, and putting
   it in the wrong place is the exact bug this exists for. It measures at the height A MAN ACTUALLY
   IS, taken from the real CSS: `.arena`'s height, `.fig`'s offset, and the figure's own box, all
   read from the page rather than typed in here. Then the browser's own gradient interpolation
   resolves the wall's colour at his head and at the crowd row above him, and both go through WCAG
   relative luminance against the figure's own darkest and lightest values, which the game exports.

   THE BAR. 4.5:1 is the floor and it is deliberately low: a silhouette is not text, and a venue is
   allowed to be dim as long as a man in it still reads. The real spread is printed rather than
   asserted, the way `backdrop` prints its dE, so tuning the light does not turn this red. What
   turns it red is a wall that cannot hold a man.
*/
import { found, clearAll } from "../harness.mjs";

export const name = "umbra";
export const describe = "every venue can hold a silhouette, at the height a man actually stands";

const FLOOR = 4.5;
/* and a floor for the rest of him. A silhouette is not a head — the first cut of this measured
   only where the light was aimed, passed, and the men's torsos were at 1.5:1. */
const BODY_FLOOR = 3;

export async function run({ p, errors }){
  const bad = [], lines = [];
  await found(p, { seed:"UMBRA" });
  await clearAll(p);

  const out = await p.evaluate(`(()=>{
    const A = window.__LVDVS;
    if(!A || !A.UMBRA_BODY) return { err:"the game does not export its shadow ladder" };
    const host = document.querySelector(".lr");
    if(!host) return { err:"no .lr on the page — the tokens these rules read live there" };

    /* the stage and the man, both measured off the real stylesheet */
    const stage = document.createElement("div");
    stage.className = "arena";
    stage.style.cssText = "position:absolute;left:-9999px;top:0;width:390px";
    host.appendChild(stage);
    const fig = document.createElement("div");
    fig.className = "fig";
    fig.style.cssText = "width:" + A.FIG_W + "px;height:" + A.FIG_H + "px";
    stage.appendChild(fig);
    const sh = stage.getBoundingClientRect().height;
    const fr = fig.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const headPct = ((fr.top - sr.top) / sh) * 100;      /* the top of him */
    const footPct = ((fr.bottom - sr.top) / sh) * 100;
    /* the crowd row is its own rule and its own height */
    const crowd = document.createElement("div");
    crowd.className = "crowdrow"; stage.appendChild(crowd);
    const crowdPct = ((crowd.getBoundingClientRect().height * 0.62) / sh) * 100;

    /* the wall's colour at a given height, resolved by the browser's own interpolation */
    const cv = document.createElement("canvas");
    cv.width = 4; cv.height = Math.round(sh);
    const cx = cv.getContext("2d");
    const sample = (cls, pct) => {
      stage.className = "arena " + cls;
      const bg = getComputedStyle(stage).backgroundImage;
      const stops = [...bg.matchAll(/(rgba?\\([^)]*\\))\\s+([\\d.]+)%/g)].map(m=>[m[1], parseFloat(m[2])/100]);
      if(stops.length < 2) return null;
      const g = cx.createLinearGradient(0, 0, 0, cv.height);
      for(const [c, o] of stops) g.addColorStop(Math.max(0, Math.min(1, o)), c);
      cx.fillStyle = g; cx.fillRect(0, 0, 4, cv.height);
      const y = Math.max(0, Math.min(cv.height - 1, Math.round(cv.height * pct / 100)));
      const d = cx.getImageData(2, y, 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    const hex = h => { const q = String(h).replace("#",""); return [0,1,2].map(i=>parseInt(q.slice(i*2,i*2+2),16)); };
    const chan = c => { c/=255; return c<=.03928 ? c/12.92 : Math.pow((c+.055)/1.055, 2.4); };
    const lum = ([r,g,b]) => .2126*chan(r) + .7152*chan(g) + .0722*chan(b);
    const ratio = (a, b) => { const x = lum(a), y = lum(b);
      return (Math.max(x,y) + .05) / (Math.min(x,y) + .05); };

    /* the man's own values: his lightest part is what has to disappear into the dark, and his
       darkest is what the wall has to hold up */
    const lightest = hex(A.UMBRA_BODY), darkest = hex(A.UMBRA_DEEP);

    const KEYS = ["forum","pit","yard","field","amphi","imperial","harbour","bowl","greek"];
    const rows = [];
    for(const k of KEYS){
      const cls = k === "forum" ? "" : "v-" + k;
      const head = sample(cls, headPct + 6);          /* a hand's width below the crown */
      const mid  = sample(cls, (headPct + footPct) / 2);
      const up   = sample(cls, crowdPct);
      if(!head || !up){ rows.push({ k, dead:true }); continue; }
      rows.push({ k,
        head: ratio(head, lightest), body: ratio(mid, lightest), crowd: ratio(up, darkest) });
    }
    stage.remove();
    return { rows, headPct, footPct, crowdPct, stage:Math.round(sh),
             lightest:A.UMBRA_BODY, darkest:A.UMBRA_DEEP };
  })()`);

  if(out.err){ bad.push(out.err); }
  else {
    lines.push(`the stage is ${out.stage}px · a man's head is at ${out.headPct.toFixed(0)}% of it and his feet at ${out.footPct.toFixed(0)}% · the crowd row sits at ${out.crowdPct.toFixed(0)}%`);
    lines.push(`he is drawn between ${out.darkest} and ${out.lightest}, which is what the wall has to hold up`);
    lines.push(`${"venue".padEnd(10)} ${"at his head".padStart(12)} ${"at his body".padStart(12)} ${"crowd".padStart(8)}`);
    const dead = out.rows.filter(r=>r.dead).map(r=>r.k);
    if(dead.length) bad.push(`${dead.join(", ")} resolved to no gradient at all — either the rule is gone or the mount is outside the token scope`);
    for(const r of out.rows.filter(x=>!x.dead).sort((a,b)=>a.head-b.head)){
      const flag = r.head < FLOOR ? "  <-- cannot hold a man" : "";
      lines.push(`${r.k.padEnd(10)} ${(r.head.toFixed(1)+":1").padStart(12)} ${(r.body.toFixed(1)+":1").padStart(12)} ${(r.crowd.toFixed(1)+":1").padStart(8)}${flag}`);
      if(r.head < FLOOR)
        bad.push(`a man's head against .v-${r.k} is ${r.head.toFixed(1)}:1 — under the ${FLOOR}:1 a silhouette needs, so he is a dark shape on a dark wall`);
      if(r.body < BODY_FLOOR)
        bad.push(`.v-${r.k} holds his head at ${r.head.toFixed(1)}:1 and his BODY at ${r.body.toFixed(1)}:1 — the light peaks behind his crown and falls away behind his torso, so half of him is gone`);
      if(r.crowd < 2)
        bad.push(`the crowd row on .v-${r.k} is ${r.crowd.toFixed(1)}:1 against the darkest a head is drawn — there is nothing up there for them to be seen against`);
    }
    const w = out.rows.filter(x=>!x.dead).reduce((m,r)=>Math.min(m,r.head), 99);
    lines.push(`worst wall: ${w.toFixed(1)}:1 against a floor of ${FLOOR}:1`);
  }
  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push("every wall can hold a man, at his head and down his body, and the crowd reads on all nine");
  return { pass: bad.length === 0, why: bad.slice(0,4).join("; ") || null, lines };
}
