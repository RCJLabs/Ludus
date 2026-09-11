/* WHERE THE MONEY IS MADE — #263's verify-first: the road, or the not-coming-back?

     node test/probes/capua.mjs 16 420 3      # houses, weeks, seed sets

   #260's sweep found `tour` — go on purpose to whichever town knows you least, never touch Capua —
   worth **8 of 8 paired seed sets richer, a median gold p50 of 11,283 against 181.** #263 asks the
   question that decides where a fix would go: is the money in the GOING, or in the NOT RETURNING?
   If it is the going, the town purses or `BAY_DECAY` are the lever. If it is the not returning,
   then Capua's own draw is what is underpriced and the fix belongs there instead.

   THAT IS ANSWERABLE WITHOUT A NEW POLICY, which is why no lever is added here. Split every week of
   every arm by WHERE THE HOUSE WAS STANDING and read the coin off that:

     · Capua weeks against away weeks INSIDE THE SAME HOUSE says whether Capua is underpriced. A
       reference house that earns far less on the weeks it is home is being told something by the
       game, whatever policy it runs.
     · the reference's away weeks against the TOURER's away weeks says whether the lever is
       freshness. Both are out of Capua; only one keeps moving to stay inside `STAY_FRESH`. If the
       tourer's away weeks are worth more than the reference's away weeks, `BAY_DECAY` and the
       welcome are doing it, not the town purses.

   THREE ARMS, so the floor is visible too:
     home    `road:false` — never leaves at all, the stay-at-home control
     ref     the reference: takes the invitations `bayCall` sends, comes home when the welcome wears
     tour    deliberate, and never comes back

   NET, NOT GROSS, AND THE NOTE IS HERE BECAUSE IT MATTERS. This reads the week's change in
   `d.gold`, which is income less whatever the house spent that week — so a house that is away and
   therefore not building or buying will look richer per week partly because it is not spending. The
   bout counts per location are reported beside the coin for exactly that reason: if the away weeks
   carry more coin AND more bouts, it is earnings; if they carry more coin and the same bouts, some
   of it is the house having nothing to spend on while it is on the road, which is a different
   finding and a much cheaper fix. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SETS = +(process.argv[4] || 3);
/* ---- AND TWO THRIFT ARMS, BECAUSE THE FIRST CUT COULD NOT TELL EARNING FROM SPENDING ----
   Capua read -13 to -40 denarii a week against a town's +250 to +496, and the header above had
   already written down why that might mean nothing: CAPUA IS WHERE THE SPENDING HAPPENS. A house
   on the road cannot build a room, hire a cook or throw a party, so it keeps its coin whether or
   not it earns any. The thrift arms buy nothing, build nothing, hire nobody and host nothing — the
   bill and the purses and nothing else — so the Capua-against-away gap inside them is earnings. */
const THRIFT = { buy:false, build:false, folk:false, staff:false, gear:false, party:false, doctore:false };
const ARMS = [["home",{road:false}], ["ref",{}], ["tour",{tour:true}],
  ["homeThr",Object.assign({road:false}, THRIFT)], ["refThr",Object.assign({}, THRIFT)],
  ["tourThr",Object.assign({tour:true}, THRIFT)], ["stayThr",Object.assign({stay:true}, THRIFT)]];

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, SETS, ARMS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","liquidate","welcomeOf","knownIn","CITY_KEYS"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const med = a => { if(!a.length) return 0; const s=a.slice().sort((x,y)=>x-y); return s[Math.floor(0.5*s.length)]; };
  const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;

  const arm = (o, seed) => {
    /* four places a week can be spent, and they are not the same question */
    const at = { capua:{ w:0, gold:0, bouts:0, wins:0 }, away:{ w:0, gold:0, bouts:0, wins:0 },
                 travel:{ w:0, gold:0, bouts:0, wins:0 }, rome:{ w:0, gold:0, bouts:0, wins:0 } };
    const endGold=[], endFame=[]; let weeks=0, setOuts=0, homes=0;
    for(let i=0;i<H;i++){
      const d = A.newGameState("Cp","clean",`${seed}-${i}`);
      for(let w=0;w<W;w++){
        if(d.over) break;
        /* where the house STOOD this week, read before the week runs — a week that ends somewhere
           else was still lived where it started, and `comeHome`/`setOut` fire inside it */
        const where = d.rome ? "rome" : d.travel ? "travel" : d.city ? "away" : "capua";
        const g0 = d.gold;
        let did=null; try{ did = R.lanista(d, o); }catch(e){ break; }
        weeks++;
        const b = at[where];
        b.w++; b.gold += d.gold - g0;
        if(did){ if(typeof did.bout === "number") b.bouts += did.bout;
          if(typeof did.won === "number") b.wins += did.won;
          if(typeof did.setOut === "number") setOuts += did.setOut;
          if(typeof did.cameHome === "number") homes += did.cameHome; }
      }
      endGold.push(Math.round(d.gold)); endFame.push(Math.round(d.fame||0));
    }
    return { at, weeks, setOuts, homes, goldP50:med(endGold), fameP50:med(endFame) };
  };

  const res = {};
  for(let s=0;s<SETS;s++) for(const [nm,o] of ARMS)
    (res[nm] = res[nm] || []).push(arm(o, `CAPUA${s}`));
  return { res, arms:ARMS.map(a=>a[0]) };
}, [H, W, SETS, ARMS]);

if(out.why){ console.log("HANDLE:", out.why); await browser.close(); server.close(); process.exit(1); }

const pad=(s,n)=>String(s).padEnd(n), rp=(s,n)=>String(s).padStart(n);
console.log(`\nWHERE THE MONEY IS MADE — ${H} houses x ${W} weeks x ${SETS} seed sets an arm\n`);

/* pool the per-set totals: weeks and coin both add, so the per-week figure is the pooled ratio */
const pool = nm => {
  const P = { capua:{w:0,gold:0,bouts:0,wins:0}, away:{w:0,gold:0,bouts:0,wins:0},
              travel:{w:0,gold:0,bouts:0,wins:0}, rome:{w:0,gold:0,bouts:0,wins:0} };
  let weeks=0, setOuts=0, homes=0;
  for(const r of out.res[nm]){ weeks += r.weeks; setOuts += r.setOuts; homes += r.homes;
    for(const k of Object.keys(P)) for(const f of ["w","gold","bouts","wins"]) P[k][f] += r.at[k][f]; }
  return { P, weeks, setOuts, homes };
};

console.log(`  ${pad("arm",6)}${pad("where",8)}${rp("weeks",7)}${rp("% of run",10)}${rp("d/week",9)}${rp("bouts/100w",12)}${rp("win%",7)}`);
for(const nm of out.arms){
  const { P, weeks } = pool(nm);
  for(const k of ["capua","away","travel","rome"]){
    const b = P[k]; if(!b.w) continue;
    console.log(`  ${pad(nm,6)}${pad(k,8)}${rp(b.w,7)}${rp((100*b.w/weeks).toFixed(1),10)}`
      + `${rp((b.gold/b.w).toFixed(1),9)}${rp((100*b.bouts/b.w).toFixed(1),12)}`
      + `${rp(b.bouts ? (100*b.wins/b.bouts).toFixed(0) : "—",7)}`);
  }
  const g = out.res[nm].map(r=>r.goldP50), f = out.res[nm].map(r=>r.fameP50);
  console.log(`  ${pad(nm,6)}${pad("—",8)} end gold p50 per set ${g.join(", ")} · fame p50 ${f.join(", ")} · setOut ${pool(nm).setOuts}, cameHome ${pool(nm).homes}\n`);
}

const cap = nm => { const b = pool(nm).P.capua; return b.w ? b.gold/b.w : 0; };
const awy = nm => { const b = pool(nm).P.away;  return b.w ? b.gold/b.w : 0; };
console.log(`THE TWO COMPARISONS #263 ASKS FOR:`);
console.log(`  is Capua underpriced?   the reference earns ${cap("ref").toFixed(1)}d a week standing in Capua against ${awy("ref").toFixed(1)}d standing in a town`);
console.log(`  is freshness the lever? the reference's away weeks are worth ${awy("ref").toFixed(1)}d, the tourer's ${awy("tour").toFixed(1)}d`);
console.log(`     and with the spending taken out:  ${awy("refThr").toFixed(1)}d against ${awy("tourThr").toFixed(1)}d — both are away, only one keeps moving`);
console.log(`\n  AND THE SAME HOUSE, HOME AGAINST AWAY, SPENDING NOTHING:`);
for(const nm of ["homeThr","refThr","tourThr","stayThr"]){
  const P = pool(nm).P, c = P.capua, a = P.away;
  const perB = b => b.bouts ? (b.gold/b.bouts).toFixed(0) : "—";
  console.log(`     ${pad(nm,8)} capua ${(c.w?c.gold/c.w:0).toFixed(1)}d/wk over ${(100*c.bouts/Math.max(1,c.w)).toFixed(0)} bouts a hundred weeks (${perB(c)}d a bout)`
    + `  ·  away ${(a.w?a.gold/a.w:0).toFixed(1)}d/wk over ${(100*a.bouts/Math.max(1,a.w)).toFixed(0)} (${perB(a)}d a bout)`);
}
console.log(`  and the floor:          a house that never leaves earns ${cap("home").toFixed(1)}d a week, all of it in Capua`);

await browser.close(); server.close();
