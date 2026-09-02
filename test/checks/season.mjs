/* THE DRAWING KNOWS WHAT MONTH IT IS, AND IS STILL READABLE IN ALL FOUR

   Audit item #215: "Winter, summer, festivals move purses, training, fatigue and healing — and the
   ludus is drawn in the same golden afternoon all year. The v3.145.0 machinery (`SCN_SAND`'s stop
   table with derived ink) makes a per-season grade cheap and safe." TRUE on both halves. The whole
   scene contained ZERO references to `seasonOf`, `CALENDAR` or anything else about the time of
   year, while winter alone moves training 0.88, healing 1.35, the pits 0.45 and the crowd −7.

   WHAT THE ITEM DID NOT SAY IS WHAT MAKES IT SAFE. `scnInk(y)` takes only a y, so a season-aware
   ink means threading the season through `scnSay`, `scnName` and every label in the drawing —
   twenty call sites, each one a chance to leave a label reading against the wrong ground. The ink
   can stay season-blind ONLY IF no label ever wants a different ink in a different month, and
   measured (`probes/year.mjs`) an unweighted grade flips the ink on **8 of the 15 labels** and
   drops the worst to **3.02:1** against a bar of 4.0. Every flip comes from moving the DARK ENDS
   of the gradient — the haze at the top of the compound and the ground at the player's feet are
   what make pale ink win there.

   So the grade is weighted by where the light falls, fading to nothing by t=0.82 and at t=0: the
   sun changes what the sun lights. Measured that way, **zero flips, worst label 4.13:1**, and the
   ground still moves ΔE 11.0–13.1 at the sand's midpoint, five times the just-noticeable
   difference.

   `legible` already composites the real stack under every label and fails under 4.0:1 — but it
   plays ONE house and therefore sees ONE month. That is the gap this fills.

   FIVE ARMS:
   1 · FOUR SEASONS, FOUR GROUNDS. Each must differ from spring by more than the eye's own
       threshold, or the grade is arithmetic nobody can see.
   2 · AND READABLE IN EVERY ONE. Every label baseline in the drawing must clear 4.0:1 against the
       sand of every season — the arm `legible` cannot reach, because a check that plays one house
       sees one month.
   3 · THE INK NEVER FLIPS. No label may want dark ink in one month and pale in another. This is
       the invariant the whole design rests on: the moment it breaks, twenty call sites need the
       season threaded through them and nothing would say so.
   4 · THE DARK ENDS ARE THE SAME IN EVERY MONTH — the mechanism behind arm 3, asserted directly so
       a re-grade that breaks it fails HERE, naming the cause, rather than three releases later.
   5 · SATURNALIA LIGHTS THE LAMPS, and no ordinary week does. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "season";
export const describe = "the drawing knows what month it is, and is still readable in all four";

const BAR = 4.0;    /* the same bar `legible` and `palette` hold every other word in the app to */
const JND = 2.3;    /* the just-noticeable difference — under this, a season nobody can see */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"SEASON-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(([BAR, JND])=>{
    const A = window.__LVDVS;
    const miss = ["SCN_GRADE","SCN_KEYS","scnSandOf","scnSandAt","scnInk","seasonOf","SEASONS","festivalNow"]
      .filter(k=>A[k]==null);
    if(miss.length) return { miss };

    /* ---- EVERY LABEL THAT SITS ON THE SAND, AND ONLY THOSE ----
       Read off the rendered drawing rather than a list, so a new label joins the measurement by
       existing. But `text[font-family]` and not `text`: the scene also carries caller badges and
       the gate's "!" , and those sit on their OWN painted disc — a gold circle, a red one — not on
       the ground. Measuring them against the sand is measuring a stack they are not in, and the
       first cut of this check did exactly that and reported the badge count at y=238 as the
       tightest label in the drawing at 4.02:1. Their contrast is `legible`'s business, which
       composites the real stack under every glyph. `scnSay` and `scnName` are the two helpers that
       put a word on the ground, and both name a font family; nothing else in the scene does. */
    const svg = document.querySelector('svg[aria-label^="The ludus"]');
    const ys = svg ? [...new Set([...svg.querySelectorAll("text[font-family]")]
      .map(t=>Math.round(+t.getAttribute("y"))).filter(v=>v > 0))].sort((a,b)=>a-b) : [];

    const hex = h => [0,1,2].map(i=>parseInt(String(h).replace("#","").slice(i*2,i*2+2),16));
    const lum = c => { const f = v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
      return 0.2126*f(c[0]) + 0.7152*f(c[1]) + 0.0722*f(c[2]); };
    const ratio = (a,b) => { const x = lum(a), y = lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };
    const lab = ([R,G,B]) => { const f=c=>{ c/=255; return c<=.04045 ? c/12.92 : Math.pow((c+.055)/1.055,2.4); };
      const [r,g,b]=[f(R),f(G),f(B)];
      let X=(r*.4124+g*.3576+b*.1805)/.95047, Y=r*.2126+g*.7152+b*.0722, Z=(r*.0193+g*.1192+b*.9505)/1.08883;
      const q=t=> t>0.008856 ? Math.cbrt(t) : (7.787*t)+16/116;
      [X,Y,Z]=[q(X),q(Y),q(Z)];
      return [116*Y-16, 500*(X-Y), 200*(Y-Z)]; };
    const dE = (a,b) => { const x=lab(a), y=lab(b); return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2]); };

    const KEYS = A.SCN_KEYS;
    const mid = 108 + 612*0.5;
    const seasons = KEYS.map(k => ({ key:k,
      table: A.scnSandOf(k).map(s=>s[1]),
      move: +dE(A.scnSandAt(mid, "spring"), A.scnSandAt(mid, k)).toFixed(2) }));

    /* the ends of the gradient, which must not move — the mechanism arm 3 rests on */
    const ends = KEYS.map(k => ({ key:k, lo: A.scnSandOf(k)[0][1], hi: A.scnSandOf(k)[A.scnSandOf(k).length-1][1] }));

    /* every label, in every month */
    const labels = ys.map(y => {
      const ink = A.scnInk(y);
      const per = KEYS.map(k => ({ k,
        r: +ratio(hex(ink), A.scnSandAt(y, k)).toFixed(2),
        /* and which ink a season-AWARE rule would have chosen here */
        want: ratio(hex("#14100c"), A.scnSandAt(y, k)) >= ratio(hex("#f2e4bf"), A.scnSandAt(y, k)) ? "dark" : "lit" }));
      return { y, ink: ink === "#14100c" ? "dark" : "lit",
        lo: Math.min(...per.map(x=>x.r)), flip: new Set(per.map(x=>x.want)).size > 1, per };
    });

    /* and the lamps: which weeks of the year light them */
    const lampWeeks = [];
    for(let w=1; w<=18; w++){
      const f = A.festivalNow({ week:w });
      if(f && f.key === "saturnalia") lampWeeks.push(w);
    }
    return { seasons, ends, labels, ys: ys.length, lampWeeks,
      season1: A.seasonOf({ week:1 }).key, season17: A.seasonOf({ week:17 }).key };
  }, [BAR, JND]);

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  if(!r.ys) return { pass:false, why:`no labels found in the drawn ludus — nothing was measured`, lines };

  lines.push(`  season   the sand's five stops                              ΔE from spring`);
  for(const s of r.seasons) lines.push(`  ${s.key.padEnd(8)} ${s.table.join(" ")}   ${String(s.move).padStart(6)}`);
  const worst = Math.min(...r.labels.map(x=>x.lo));
  const flips = r.labels.filter(x=>x.flip);
  const tight = r.labels.slice().sort((a,b)=>a.lo-b.lo)[0];
  lines.push(`  ${r.ys} labels · worst contrast in any month ${worst.toFixed(2)}:1 (bar ${BAR}) · ink flips ${flips.length}`);
  lines.push(`    the tightest is y=${tight.y} in ${(tight.per.find(q=>q.r===tight.lo)||{}).k}, ${tight.ink} ink · `
    + tight.per.map(q=>`${q.k.slice(0,3)} ${q.r}`).join(" · "));
  lines.push(`  the lamps burn on week${r.lampWeeks.length===1?"":"s"} ${r.lampWeeks.join(", ")} of 18 — ${r.season17}`);

  /* 1 — four grounds, and each one visible */
  for(const s of r.seasons){
    if(s.key === "spring") continue;
    if(s.move < JND)
      bad.push(`${s.key} is ΔE ${s.move} from spring against a just-noticeable difference of ${JND} — `
        + `the grade is arithmetic nobody can see`);
  }
  /* 2 — and readable in every one */
  for(const x of r.labels) if(x.lo < BAR){
    const at = x.per.find(q=>q.r === x.lo) || x.per[0];
    bad.push(`the label at y=${x.y} reads at ${x.lo.toFixed(2)}:1 in ${at.k} against a bar of ${BAR} — `
      + `readable for part of the year and not the rest, which is the fault a season can introduce `
      + `and \`legible\` cannot see, because it plays one house and therefore one month`);
  }
  /* 3 — the ink never flips */
  if(flips.length)
    bad.push(`${flips.length} label(s) want different ink in different months (first at y=${flips[0].y}) — `
      + `\`scnInk\` takes only a y, so this cannot be honoured: either soften the grade or thread the `
      + `season through scnInk, scnSay and scnName, twenty call sites`);
  /* 4 — the mechanism, named where it breaks */
  const lo0 = r.ends[0].lo, hi0 = r.ends[0].hi;
  for(const e of r.ends) if(e.lo !== lo0 || e.hi !== hi0)
    bad.push(`${e.key} moves the ends of the gradient (${e.lo}/${e.hi} against spring's ${lo0}/${hi0}) — `
      + `the dark top and the near foreground are what make pale ink win there, and moving them is `
      + `what makes the ink flip`);
  /* 5 — the lamps */
  if(r.lampWeeks.length !== 1)
    bad.push(`the lamps burn on ${r.lampWeeks.length} weeks of the year — Saturnalia is one week`);
  if(r.season17 !== "winter")
    bad.push(`Saturnalia falls in ${r.season17} — the lamps and the pale ground are meant to be the same week`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`four grounds, no ink flips, and the worst label still reads at ${worst.toFixed(2)}:1`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
