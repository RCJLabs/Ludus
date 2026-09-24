/* THE TOUR/STAY HEADLINE, POOLED — #311

     node test/probes/pooled.mjs [houses a seed set] [weeks] [seed sets] [rope options as JSON]
     node test/probes/pooled.mjs 40 420 WAGON,SEEDB,SEEDC,SEEDD '{"court":false}'
     LUDUS_STALE_OK=1 PAGE=dist/draft.html node test/probes/pooled.mjs     # a draft built with --out=

   `lead.mjs`'s headline, over several seed sets at once, and with every figure given an interval. The
   README's rule — run three or four prefixes, and a figure that moves between them is not a finding —
   applied to the one measurement it was most needed for. #311's first verdict on Capua's ordinary games
   was read off one prefix of 40 houses: "staying houses end in debt more often", 13 -> 18. On 160 it
   is 35% -> 41%, inside its own interval.

   WHAT IT PRINTS, per arm (tour:true, then road:false):
     · every ending's share with its 95% interval. Read `closed` beside `alive`: the good ending fires
       only on an EMPTY yard (`!alive && freed >= 5`), so it counts houses that FINISH, and a house
       still running at the last week is not a failure. #311 found half the headline gap was that.
     · burials a house (median, and the mean with its interval) and per 100 weeks lived. The rate uses
       the ratio estimator over HOUSES; a binomial over weeks would be several times too narrow.
     · how often the fast-forward is open (#308), in all and on weeks at home.
     · median gold, which measures the reference player's spending more than the game's economy, and
       the median census rung.

   ITS BASELINE, v3.304.0, 4 x 40 houses x 420 weeks:
     tours   closed 68% ±7 · debt 3% ±2 · alive 15% ±6 · ruin 10% ±5 · 4.53 buried per 100 weeks lived
     stays   closed 18% ±6 · debt 12% ±5 · alive 48% ±8 · ruin 9% ±5 · banned 7% ±4 · 9.26 per 100 weeks
     fast-forward open on 8.4% of a staying house's weeks, and on 12.5% of a touring house's weeks at home
   and v3.303.0's, taken while the reference player answered the week's card LAST (#312), read staying
   houses' debt at 35% ±7 and their good ending at 10% ±5. Figures from before v3.304.0 overstate debt
   at home about threefold; compare like with like.

   Asking `runnable` each week does not move the play: this baseline reproduces the pooled run taken
   without it, ending for ending. `PAGE=` serves another build; the harness refuses a page older than
   the source unless LUDUS_STALE_OK is set, which is exactly the case for a draft built with --out=. */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 40), W = +(process.argv[3] || 420);
const SEEDS = (process.argv[4] || "WAGON,SEEDB,SEEDC,SEEDD").split(",");
const EXTRA = process.argv[5] ? JSON.parse(process.argv[5]) : {};
const PAGE = process.env.PAGE || "dist/test.html";
/* the option set `lead.mjs` and `wagons.mjs` play, so the three read the same houses */
const MOST = Object.assign({ court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true }, EXTRA);

const { server, port } = await serve({ page: PAGE });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST, SEEDS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","houseRecord"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const canRun = typeof A.runnable === "function";
  const arm = lever => { const houses = [];
    for(const S of SEEDS) for(let i=0;i<H;i++){
      const d = A.newGameState("Pl","clean",`${S}-${i}`);
      const opts = Object.assign({}, MOST, lever);
      let weeks = 0, played = 0, open = 0, home = 0, homeOpen = 0;
      for(let w=0; w<W && !d.over; w++){
        weeks++; try { R.lanista(d, opts); } catch(e){}
        if(d.over || !canRun) continue;
        /* the week the player would now face: is the fast-forward offered on it (#308)? */
        const n = A.runnable(d) >= 1 ? 1 : 0; played++; open += n;
        if(!d.city && !d.travel && !d.rome){ home++; homeOpen += n; }
      }
      const Rc = A.houseRecord(d);
      houses.push({ gold:Math.round(d.gold||0), buried:Rc.lost||0, weeks, played, open, home, homeOpen,
        rung:(d.rise && d.rise.rank)||0, end:d.over ? String(d.over.kind||d.over) : "alive" });
    }
    return houses; };
  return { canRun, tours: arm({ tour:true }), stays: arm({ road:false }) };
}, [H, W, MOST, SEEDS]);

if(out.why){ console.log("PROBE COULD NOT RUN: " + out.why); }
else {
  const z = 1.96;
  const med = a => { const s = a.slice().sort((x,y)=>x-y); return s[s.length>>1]; };
  const sum = a => a.reduce((x,y)=>x+y, 0);
  const share = (hs, e) => { const n = hs.length, k = hs.filter(h=>h.end===e).length, q = k/n;
    return `${e} ${k}/${n} ${(q*100).toFixed(0)}% ±${(z*Math.sqrt(q*(1-q)/n)*100).toFixed(0)}`; };
  /* a rate over house-weeks is a ratio of two sums, and it is the HOUSE that varies, not the week:
     the ratio estimator's interval over houses. A binomial interval over the weeks would treat
     20,000 weeks of 160 houses as 20,000 independent draws and come out several times too narrow. */
  const ratio = (ys, xs) => { const n = ys.length, X = sum(xs), r = X ? sum(ys)/X : 0;
    if(!X || n < 2) return { r, e:0 };
    const s2 = ys.reduce((s,y,i)=>s + (y - r*xs[i])**2, 0) / (n-1);
    return { r, e: z*Math.sqrt(s2/n)/(X/n) }; };
  const mean = a => { const n = a.length, m = sum(a)/n;
    return { m, e: n > 1 ? z*Math.sqrt(a.reduce((s,x)=>s+(x-m)**2, 0)/(n-1))/Math.sqrt(n) : 0 }; };
  const FIRST = ["closed","debt","alive","ruin"];
  console.log(`POOLED — ${SEEDS.length} seed sets (${SEEDS.join(",")}) x ${H} = ${out.stays.length} houses an arm x ${W} weeks`);
  console.log(`  page ${PAGE} · rope extras ${JSON.stringify(EXTRA)} · every ± is a 95% interval`);
  for(const [tag, hs] of [["tours", out.tours], ["stays", out.stays]]){
    const n = k => hs.filter(h=>h.end===k).length;
    const kinds = FIRST.concat([...new Set(hs.map(h=>h.end))].filter(k=>!FIRST.includes(k)).sort((a,b)=>n(b)-n(a)));
    const b = mean(hs.map(h=>h.buried)), rate = ratio(hs.map(h=>h.buried), hs.map(h=>h.weeks));
    console.log(`  ${tag.toUpperCase()}`);
    console.log(`    ends          ${kinds.map(k=>share(hs,k)).join(" · ")}`);
    console.log(`    buried        median ${med(hs.map(h=>h.buried))} · mean ${b.m.toFixed(1)} ±${b.e.toFixed(1)} · ${(rate.r*100).toFixed(2)} ±${(rate.e*100).toFixed(2)} per 100 weeks lived`);
    console.log(`    lived         ${sum(hs.map(h=>h.weeks))} weeks in all · median gold ${med(hs.map(h=>h.gold))} · median rung ${med(hs.map(h=>h.rung))}`);
    if(out.canRun){
      const all = ratio(hs.map(h=>h.open), hs.map(h=>h.played)), home = ratio(hs.map(h=>h.homeOpen), hs.map(h=>h.home));
      console.log(`    fast-forward  open ${(all.r*100).toFixed(1)}% ±${(all.e*100).toFixed(1)} of weeks · at home ${(home.r*100).toFixed(1)}% ±${(home.e*100).toFixed(1)}`);
    }
  }
}
await browser.close(); server.close();
