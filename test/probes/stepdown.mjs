/* WHEN HAS A HOUSE PROVED ITSELF? — the gate for #318's early handover, measured before it is set.

   (`stepdown` was free in both directories; checked before writing.)

   A lanista may hand the house on only when he is 62, well, and has an heir of age, and a lanista
   starts at 34-46 with an eighteen-week year. So the retirement door opens 290-500 weeks in, and 57%
   of careful staying houses are still running at week 420 with no good way to finish. #318 opens
   the handover earlier, on merit. This measures what "merit" should mean, before any number is
   written into the game.

   Every candidate gate shares a STANDING CLAUSE, the house clear of trouble on the week it is asked:
   an heir named and of age, gold at or above zero, no lender's paper, no edict broken, no ruin
   warned, not abroad, no succession already open. The candidates differ in two terms: years at the
   head (yearsAtHead), and the census rung (riseOf), which is the game's own ladder of standing in
   Capua. The gate is read every week and never taken, so the houses play exactly as they would.

   What a good gate looks like: it opens for most houses still thriving at week 420, and opens late
   enough to be the reward for a long run rather than a door in year two. A house that later failed
   may have passed it while it was thriving. That is allowed, since stepping down while ahead is
   exactly the choice, so it is reported, not penalised.

   The row `game` is `canStepDown` itself, once the build has it: the candidates' clause plus a quiet
   cell block, read off the gate the player meets.

   node test/probes/stepdown.mjs [houses a seed = 40] [weeks = 420] [seeds] [extra rope options] */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 40), W = +(process.argv[3] || 420);
const SEEDS = (process.argv[4] || "WAGON,SEEDB,SEEDC,SEEDD").split(",");
const EXTRA = process.argv[5] ? JSON.parse(process.argv[5]) : { comply:true, fines:"read" };
const PAGE = process.env.PAGE || "dist/test.html";
/* pooled.mjs's option set, so the two read the same houses */
const MOST = Object.assign({ court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true }, EXTRA);
const YEARS = [6, 8, 10, 12], RUNGS = [2, 3, 4, 5];

const { server, port } = await serve({ page: PAGE });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST, SEEDS, YEARS, RUNGS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","houseRecord","heirOfAge","yearsAtHead","riseOf","inBreach","awayFromCapua"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const clear = d => !!(d.heir && A.heirOfAge(d) && (d.gold||0) >= 0 && !d.loan && !A.inBreach(d).length
    && !(d.flags && d.flags.ruinWarn && Object.keys(d.flags.ruinWarn).length) && !A.awayFromCapua(d) && !d.succession && !d.over);
  const arm = lever => { const houses = [];
    for(const S of SEEDS) for(let i=0;i<H;i++){
      const d = A.newGameState("Sd","clean",`${S}-${i}`);
      const opts = Object.assign({}, MOST, lever);
      const first = {}, open = {}; let weeks = 0, clearWk = 0, heirWk = null;
      for(let w=0; w<W && !d.over; w++){
        weeks++; try { R.lanista(d, opts); } catch(e){}
        if(d.over) break;
        if(heirWk == null && d.heir && A.heirOfAge(d)) heirWk = d.week;
        /* the gate as the game now holds it (#318), when this build has one */
        if(A.canStepDown && A.canStepDown(d)){ if(first.game == null) first.game = d.week; open.game = (open.game||0) + 1; }
        if(!clear(d)) continue;
        clearWk++;
        const y = A.yearsAtHead(d, d.lanista), r = A.riseOf(d);
        for(const Y of YEARS) for(const K of RUNGS){ const k = `${Y}y${K}r`;
          if(y >= Y && r >= K){ if(first[k] == null) first[k] = d.week; open[k] = (open[k]||0) + 1; } }
        for(const Y of YEARS){ const k = `${Y}y`; if(y >= Y){ if(first[k] == null) first[k] = d.week; open[k] = (open[k]||0) + 1; } }
      }
      const end = d.over ? String(d.over.kind||d.over) : "alive";
      houses.push({ end, weeks, clearWk, heirWk, first, open, gen:d.generation||1, rung:A.riseOf(d) });
    }
    return houses; };
  return { stays: arm({ road:false }), tours: arm({ tour:true }) };
}, [H, W, MOST, SEEDS, YEARS, RUNGS]);

if(out.why){ console.log("PROBE COULD NOT RUN: " + out.why); }
else {
  const FAIL = ["debt","ruin","emptied","banned","rebellion","disgrace","foreclosed","ruined","lanistaDied"];
  const cls = h => h.end === "alive" ? "alive" : FAIL.includes(h.end) ? "failed" : "good";
  const med = a => { if(!a.length) return "-"; const s = a.slice().sort((x,y)=>x-y); return s[s.length>>1]; };
  const pct = (k, n) => n ? `${Math.round(k/n*100)}%` : "-";
  console.log(`STEP DOWN — ${SEEDS.length} seeds x ${H} = ${out.stays.length} houses an arm x ${W} weeks · page ${PAGE} · extras ${JSON.stringify(EXTRA)}`);
  const keys = [...(out.stays.some(h=>h.first.game != null) ? ["game"] : []), ...YEARS.map(Y=>`${Y}y`), ...YEARS.flatMap(Y=>RUNGS.map(K=>`${Y}y${K}r`))];
  for(const [tag, hs] of [["stays", out.stays], ["tours", out.tours]]){
    const by = c => hs.filter(h=>cls(h) === c);
    const al = by("alive"), fa = by("failed"), go = by("good");
    console.log(`\n  ${tag.toUpperCase()} · alive at ${W}: ${al.length} · failed: ${fa.length} · good ending: ${go.length} · an heir of age by the end: ${hs.filter(h=>h.heirWk!=null).length} (median week ${med(hs.filter(h=>h.heirWk!=null).map(h=>h.heirWk))}) · clear of trouble on a median ${med(hs.map(h=>Math.round(h.clearWk/h.weeks*100)))}% of weeks`);
    console.log(`    gate            opens for: alive          failed (before it)   good    · first week, alive: median   · weeks open, alive: median`);
    for(const k of keys){
      const o = g => g.filter(h=>h.first[k] != null);
      console.log(`    ${k.padEnd(14)}  ${`${o(al).length}/${al.length} ${pct(o(al).length, al.length)}`.padEnd(15)} ${`${o(fa).length}/${fa.length} ${pct(o(fa).length, fa.length)}`.padEnd(20)} ${`${o(go).length}/${go.length}`.padEnd(7)} · ${String(med(o(al).map(h=>h.first[k]))).padEnd(24)} · ${med(o(al).map(h=>h.open[k]))}`);
    }
  }
}
await browser.close(); server.close();
