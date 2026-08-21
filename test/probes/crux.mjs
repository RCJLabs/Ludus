/* #180 — THE REFERENCE PLAYER PRESSES AT EVERY CRUX, AND NOTHING CHOSE THAT

   The audit opened #180 on the cloth never being thrown: `everCloth` is 0 across 72 houses and
   16,300 house-weeks, so the `owedLife → owedBack` arc is invisible to every measurement this
   project takes. Reading the harness to find where a mercy step would go turned up something larger.

   `lanista`'s bout step passes `choice: o.choice || "press"`. The reference player answers EVERY
   crux with the same word — front foot, "he hits harder and takes more doing it" — and has done in
   every figure this project has ever published. It never covers ("he wins less and lives more"),
   never picks the finish, and never throws the cloth. That is not a mercy gap. It is a POLICY that
   was never chosen: a lever with a constant behind it, which is the shape #158 found in the party
   schedule and #138 in the works step.

   THE LEVER IS CONNECTED, asked before anything was measured with it, because #166 shipped an inert
   one and four career arms came back byte-identical:

       default (press)   everCloth   0 · bouts 423 over 6 houses
       choice:"cloth"    everCloth 163 · bouts 230
       choice:"cover"    everCloth   0 · bouts 675

   Those bout counts are the reason this is a probe and not a one-line change: `cover` ran 60% more
   bouts than `press` over the same weeks, which can only mean its houses lived longer — and if that
   survives a paired run at a real sample, the reference player has been measuring the game from
   inside a policy that shortens its own life.

   WHAT IS MEASURED, and it is NOT median life: v3.64.0 established a house's life varies by a
   standard deviation of 139 weeks, so 72 houses cannot see a difference under 33. Deaths a bout is
   the quantity the crux touches directly and it is a share, so the same sample sees it comfortably.
   Bouts, wins and how the run ended are counts. `needN` prints what the sample can actually resolve.

   Usage: node test/probes/crux.mjs [houses per prefix] [weeks] [seed]
*/
import { serve, open, needN, sayNeed } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420), SEED = process.argv[4] || "CRX";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const PRES = [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`];

  const arm = (choice) => {
    const rows = {};
    let cur = null;
    const orig = A.doFight;
    /* count only FRESH calls: a crux RESUME re-enters doFight with `pending` set, and counting
       those as bouts read 3,198 as 6,777 in #166 */
    A.doFight = function(d, gid, offer, tactic, bet, pending){
      const fresh = !pending;
      const r = orig.apply(this, arguments);
      if(cur){ if(fresh) cur.bouts++; if(r && !r.__err && !r.crux && r.dead) cur.deaths++; }
      return r;
    };
    try {
      for(const pre of PRES){
        for(let h=0; h<H; h++){
          const id = `${pre}#${h}`;
          const d = A.newGameState("Cx"+h, "clean", id, null);
          cur = { bouts:0, deaths:0 };
          let w = 0;
          for(; w<W; w++){
            if(d.over) break;
            R.lanista(d, choice ? { choice } : undefined);
            if(!d.lanista) break;
          }
          rows[id] = { life:w, alive: w >= W ? 1 : 0,
            cloth: (d.flags && d.flags.everCloth) || 0,
            book: (d.book && d.book.n) || 0,
            bouts: cur.bouts, deaths: cur.deaths,
            deathRate: cur.bouts ? cur.deaths/cur.bouts*100 : null,
            men: A.activeG(d).length,
            fame: Math.round(d.fame||0),
            end: d.over ? d.over.kind : "alive",
            ruin: d.over && d.over.kind === "ruin" ? 1 : 0,
            debt: d.over && d.over.kind === "debt" ? 1 : 0 };
          cur = null;
        }
      }
    } finally { A.doFight = orig; cur = null; }
    return rows;
  };

  const arms = [];
  arms.push({ label:"press", rows: arm(null) });      /* control FIRST — today's default */
  arms.push({ label:"cover", rows: arm("cover") });
  arms.push({ label:"finish", rows: arm("finish") });
  arms.push({ label:"cloth", rows: arm("cloth") });
  return { arms, H, W, PRES };
}, [H, W, SEED]);

const base = out.arms[0].rows;
const ids = Object.keys(base);
const T = (rows,k) => ids.reduce((a,id)=>a + ((rows[id] && rows[id][k])||0), 0);
const M = (rows,k) => { const v = ids.map(id=>rows[id] && rows[id][k]).filter(x=>x!=null);
  return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null; };

console.log(`\n#180 — WHAT THE CRUX CHOICE IS WORTH, AND WHAT PRESSING HAS COST`);
console.log(`${ids.length} houses of ${out.W} weeks an arm, ${out.PRES.length} seed prefixes, control first, paired house for house`);
console.log(`"press" is today's default and is the control — every figure this project has published sits in that row\n`);
console.log(`  arm      bouts   deaths   deaths a bout   cloths   alive at ${out.W}w   ruin   debt   median life`);
for(const a of out.arms){
  const lives = ids.map(id=>a.rows[id].life).sort((x,y)=>x-y);
  console.log(`  ${a.label.padEnd(8)} ${String(T(a.rows,"bouts")).padStart(6)} ${String(T(a.rows,"deaths")).padStart(8)} `
    + `${(M(a.rows,"deathRate")||0).toFixed(2).padStart(14)}% ${String(T(a.rows,"cloth")).padStart(8)} `
    + `${String(T(a.rows,"alive")).padStart(13)} ${String(T(a.rows,"ruin")).padStart(6)} ${String(T(a.rows,"debt")).padStart(6)} `
    + `${String(lives[Math.floor(lives.length/2)]).padStart(12)}w`);
}
for(const a of out.arms.slice(1)){
  console.log(`\n  ${a.label.toUpperCase()} against pressing — and what ${ids.length} houses can actually see`);
  for(const k of ["deathRate","bouts","deaths","life","men","fame","alive"]){
    const diffs = ids.map(id => { const x = a.rows[id][k], y = base[id][k];
      return (x==null||y==null) ? null : x-y; }).filter(x=>x!=null);
    const r = needN(diffs);
    if(r.mean != null) console.log(`    ${sayNeed(k, r)}`);
  }
}
console.log();

await browser.close();
server.close();
