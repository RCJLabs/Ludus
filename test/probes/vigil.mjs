/* IS THE PLAYER TOLD? — #261's last question, and the half of it that is measurable.

     node test/probes/vigil.mjs 16 420 3      # houses, weeks, seed sets

   #261's design half asks whether SILENCE over your own dead should be answerable at all — whether
   `riteLapse` should charge what the pit charges, so that forgetting is never cheaper than saying
   it out loud. v3.253.0 established the mechanical ground: the reference player lets **377 of 387**
   marked men lapse, the rite is the brake on the rebellion arc (12.0%/8.0% of weeks down to
   1.3%/0.6%), and the free door buys nothing because the brake is the rite's unrest CREDIT.

   But charging for silence is only fair if silence is a CHOICE. If the row that asks never reaches
   the player, a charge on lapsing is a charge on not noticing a panel — and the good player is hit
   too, since even the burying policy lapses 29-42% of its dead for want of the coin. So: over the
   reference player's own weeks, how often is the rite row actually on the screen?

   WHAT THE PANEL SHOWS, taken from the game rather than re-derived: `agenda(S)`, the men's rows
   dropped (`a.tab !== "men"`), then `.slice(0, 7)` — the seven most urgent, sorted by urgency
   alone. The rite row is `villa:council:rites`, so it is not a men's row and it competes. Its
   urgency is **2 for the first four weeks of the window and 3 for the last two** (`left <= 2 ? 3 : 2`),
   which is #192's fix — before it, the row was shown for the first half of the window and gone for
   the second, "which is the opposite of what a deadline is for".

   AND URGENCY 2 IS NOT SAFE. The file's own measurement of the panel says an urgency-THREE row fell
   off the end on 0 of 2,382 weeks, and that is the claim `checks/attend.mjs` holds. It says nothing
   about urgency 2, and it also says urgency-2 rows **more than double across a run (2.11 -> 5.04)**
   against a panel that shows seven. So the four weeks where this row is urgency 2 are exactly where
   it could be cut, and that is what is counted here.

   THE READING MUST NOT MOVE THE STREAM. `agenda(d)` reads `deadlines`, `herOwn` and a dozen других
   derivations and may draw; it is bracketed with `rngGet`/`rngSet` on `probes/pace.mjs`'s
   precedent, the same way `probes/tail.mjs` brackets its eligibility sweep.

   PER MAN, NOT PER WEEK, is the figure that answers the question. A row seen on one week of six is
   enough for the player to have been told about that man; a row never seen in six is a man who went
   into the ground without the game ever asking. Both are reported. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SETS = +(process.argv[4] || 3);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, SETS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["agenda","unhonoured","RITE_WINDOW","rngGet","rngSet","newGameState"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const WIN = A.RITE_WINDOW;

  /* the panel's own selection, copied from the render at ludus.jsx:30697-30700 */
  const visible = (d) => {
    const st = A.rngGet();
    let rows = [];
    try { rows = A.agenda(d) || []; } catch(e){}
    A.rngSet(st);
    const all = rows.filter(a=>a.tab !== "men");
    return { seven: all.slice(0, 7), all, total: all.length };
  };

  const byLeft = {};            /* left -> { weeks, shown } */
  const men = {};               /* gid -> { seenWeeks, windowWeeks, everShown, everUrgent } */
  let weeks = 0, winWeeks = 0, shownWeeks = 0, panelFull = 0;
  const depth = [];             /* where in the sorted list the rite row sat */

  for(let s=0;s<SETS;s++) for(let i=0;i<H;i++){
    const d = A.newGameState("Vg","clean",`VIGIL${s}-${i}`);
    for(let w=0;w<W;w++){
      if(d.over) break;
      const open = (A.unhonoured(d)||[]).filter(m=>!m.done);
      if(open.length){
        const v = visible(d);
        if(v.total > 7) panelFull++;
        const rite = v.all.filter(a=>a.tab === "villa" && /not buried properly/.test(String(a.label||"")));
        const shownIdx = rite.map(a=>v.all.indexOf(a)).filter(x=>x >= 0);
        const anyShown = shownIdx.some(x=>x < 7);
        winWeeks++; if(anyShown) shownWeeks++;
        for(const x of shownIdx) depth.push(x);
        for(const m of open){
          const left = WIN - (d.week - m.week);
          const k = Math.max(0, Math.min(WIN, left));
          (byLeft[k] = byLeft[k] || { weeks:0, shown:0 });
          byLeft[k].weeks++;
          /* this man's OWN row, matched by name, and where it sat */
          const mine = v.all.find(a=>a.tab === "villa" && String(a.label||"").indexOf(m.name) === 0
            && /not buried properly/.test(String(a.label||"")));
          const idx = mine ? v.all.indexOf(mine) : -1;
          const on = idx >= 0 && idx < 7;
          if(on) byLeft[k].shown++;
          const rec = men[`${s}-${i}-${m.gid}`] = men[`${s}-${i}-${m.gid}`]
            || { win:0, shown:0, urgentShown:0, urgentWeeks:0 };
          rec.win++; if(on) rec.shown++;
          if(k <= 2){ rec.urgentWeeks++; if(on) rec.urgentShown++; }
        }
      }
      try { R.lanista(d); } catch(e){ break; }
      weeks++;
    }
  }
  const list = Object.values(men);
  return { weeks, winWeeks, shownWeeks, panelFull, byLeft, depth,
    menSeen: list.length,
    menEverShown: list.filter(m=>m.shown > 0).length,
    menNeverShown: list.filter(m=>m.shown === 0).length,
    menShownWhenUrgent: list.filter(m=>m.urgentShown > 0).length,
    menWithUrgentWeeks: list.filter(m=>m.urgentWeeks > 0).length };
}, [H, W, SETS]);

if(out.why){ console.log("HANDLE:", out.why); await browser.close(); server.close(); process.exit(1); }

const rp=(s,n)=>String(s).padStart(n);
console.log(`\nIS THE PLAYER TOLD? — ${H} houses x ${W} weeks x ${SETS} sets, ${out.weeks} house-weeks\n`);
console.log(`weeks with a man in the window: ${out.winWeeks} · the rite row was in the visible seven on ${out.shownWeeks} of them (${(100*out.shownWeeks/Math.max(1,out.winWeeks)).toFixed(1)}%)`);
console.log(`the panel overflowed (more than seven non-men rows) on ${out.panelFull} of those weeks (${(100*out.panelFull/Math.max(1,out.winWeeks)).toFixed(1)}%)\n`);

console.log(`BY WEEKS LEFT ON THE CLOCK  (urgency 3 at 2 or fewer, urgency 2 above)`);
console.log(`  ${rp("left",5)}${rp("weeks",8)}${rp("shown",8)}${rp("%",8)}`);
for(const k of Object.keys(out.byLeft).sort((a,b)=>b-a)){
  const r = out.byLeft[k];
  console.log(`  ${rp(k,5)}${rp(r.weeks,8)}${rp(r.shown,8)}${rp((100*r.shown/Math.max(1,r.weeks)).toFixed(1),8)}${k<=2?"   <- urgency 3":""}`);
}

console.log(`\nPER MAN — the figure the question turns on:`);
console.log(`  ${out.menSeen} men entered the window`);
console.log(`  ${out.menEverShown} had their own row in the visible seven at least once (${(100*out.menEverShown/Math.max(1,out.menSeen)).toFixed(1)}%)`);
console.log(`  ${out.menNeverShown} went into the ground without the panel ever naming them (${(100*out.menNeverShown/Math.max(1,out.menSeen)).toFixed(1)}%)`);
console.log(`  ${out.menShownWhenUrgent} of ${out.menWithUrgentWeeks} were shown on a week the row was urgency 3`);
if(out.depth.length){
  const s = out.depth.slice().sort((a,b)=>a-b);
  console.log(`\n  where the row sat in the sorted list: p50 ${s[Math.floor(s.length/2)]}, p90 ${s[Math.floor(0.9*s.length)]}, worst ${s[s.length-1]} (the panel cuts at 7)`);
}

await browser.close(); server.close();
