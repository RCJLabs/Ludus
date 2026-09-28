/* WHAT THE EXCLUSIVE DOES — the measurement behind #320, taken before its rule is switched.

   (`pact` was free in both directories; checked before writing.)

   `PACTS.exclusive` promises "your men appear at no other editor's games in Capua for half a year",
   and `takePact` says "nobody else's games until it is done". What `makeGames` does instead is cut
   every Capua card to its first offer while the pact runs, whoever's that offer is: a booking with
   another editor, the house's own munus, anything. `pactBlocks` was written as the precise rule and
   nothing calls it; as written it could not work either, because no offer carries an editor.

   This follows every exclusive pact a careful house takes (#313's player, which answers "Give him
   your word" to every pact it is offered) and reports: how many are taken and kept, how long they
   run, how many Capua festival weeks fall inside one and how many offers those cards carry, how many
   bouts the house fights inside it, and how the house ends. Run it against a draft build of each
   candidate rule (`PAGE=` a build made with `--out=`, `LUDUS_STALE_OK=1`) to compare like with like.

   MEASURED, 160 houses an arm, 420 weeks, four seeds, #313's careful player:
                                        staying houses                        touring houses
     the cut (what shipped)             203 of 205 kept · ruin  9% · closed 23%   97 of 99 kept
     `pactBlocks` as written            12 of 187 kept  · ruin 17% · closed 12%   23 of 85 kept
     only the aedile's Ludi Romani      120 of 211 kept · ruin 17% · closed 19%   56 of 92 kept
   Inside a pact the cut leaves 1.00 offers a Capua card against 5.52 outside one. `pactBlocks` closed
   every card, because no offer carries an editor. The owner chose the cut, said plainly (#320).

   node test/probes/pact.mjs [houses a seed = 40] [weeks = 420] [seeds] [extra rope options as JSON] */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 40), W = +(process.argv[3] || 420);
const SEEDS = (process.argv[4] || "WAGON,SEEDB,SEEDC,SEEDD").split(",");
const EXTRA = process.argv[5] ? JSON.parse(process.argv[5]) : { comply:true, fines:"read" };
const PAGE = process.env.PAGE || "dist/test.html";
const MOST = Object.assign({ court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true }, EXTRA);

const { server, port } = await serve({ page: PAGE });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST, SEEDS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","houseRecord","lawOf"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const arm = lever => { const houses = [];
    for(const S of SEEDS) for(let i=0;i<H;i++){
      const d = A.newGameState("Pc","clean",`${S}-${i}`);
      const opts = Object.assign({}, MOST, lever);
      const h = { taken:0, kept:0, broke:0, weeks:0, fest:0, offersIn:0, offersOut:0, festOut:0, boutsIn:0, heatAtBreak:[], left:[] };
      let cur = null;
      for(let w=0; w<W && !d.over; w++){
        const pk = d.pact && d.pact.kind === "exclusive" ? d.pact : null;
        /* the card the week holds, in Capua, as the player meets it */
        const g = d.games;
        if(g && g.offers && !d.city && !d.travel && !d.rome && g.week === d.week){
          if(pk){ h.fest++; h.offersIn += g.offers.length; } else { h.festOut++; h.offersOut += g.offers.length; }
        }
        if(pk){ h.weeks++; if(!cur){ cur = { need:pk.need, done0:pk.done }; h.taken++; } }
        const kept0 = (d.flags && d.flags.pactsKept) || 0, broke0 = (d.flags && d.flags.pactsBroke) || 0, done0 = pk ? pk.done : 0;
        try { R.lanista(d, opts); } catch(e){}
        if(pk && d.pact === pk) h.boutsIn += Math.max(0, pk.done - done0);
        if(cur && !(d.pact && d.pact.kind === "exclusive")){
          const k1 = (d.flags && d.flags.pactsKept) || 0, b1 = (d.flags && d.flags.pactsBroke) || 0;
          if(k1 > kept0){ h.kept++; h.boutsIn += Math.max(0, pk ? pk.need - done0 : 0); }
          else if(b1 > broke0){ h.broke++; h.heatAtBreak.push(Math.round(A.lawOf(d).heat)); h.left.push(pk ? pk.need - pk.done : null); }
          cur = null;
        }
      }
      const Rc = A.houseRecord(d);
      houses.push(Object.assign(h, { end:d.over ? String(d.over.kind||d.over) : "alive", gold:Math.round(d.gold||0), fame:Math.round(d.fame||0), buried:Rc.lost||0 }));
    }
    return houses; };
  return { stays: arm({ road:false }), tours: arm({ tour:true }) };
}, [H, W, MOST, SEEDS]);

if(out.why){ console.log("PROBE COULD NOT RUN: " + out.why); }
else {
  const sum = a => a.reduce((x,y)=>x+y, 0), med = a => { if(!a.length) return "-"; const s = a.slice().sort((x,y)=>x-y); return s[s.length>>1]; };
  const z = 1.96, share = (hs, e) => { const n = hs.length, k = hs.filter(h=>h.end===e).length, q = k/n; return `${e} ${(q*100).toFixed(0)}% ±${(z*Math.sqrt(q*(1-q)/n)*100).toFixed(0)}`; };
  console.log(`PACT — ${SEEDS.length} seeds x ${H} = ${out.stays.length} houses an arm x ${W} weeks · page ${PAGE} · extras ${JSON.stringify(EXTRA)}`);
  for(const [tag, hs] of [["stays", out.stays], ["tours", out.tours]]){
    const taken = sum(hs.map(h=>h.taken)), kept = sum(hs.map(h=>h.kept)), broke = sum(hs.map(h=>h.broke));
    const fest = sum(hs.map(h=>h.fest)), oin = sum(hs.map(h=>h.offersIn)), fo = sum(hs.map(h=>h.festOut)), oout = sum(hs.map(h=>h.offersOut));
    const kinds = [...new Set(hs.map(h=>h.end))].sort((a,b)=>hs.filter(h=>h.end===b).length - hs.filter(h=>h.end===a).length);
    console.log(`  ${tag.toUpperCase()}`);
    console.log(`    exclusives    ${hs.filter(h=>h.taken).length} of ${hs.length} houses took one · ${taken} taken · ${kept} kept · ${broke} broken · still running at the end ${taken - kept - broke}`);
    console.log(`    inside one    ${sum(hs.map(h=>h.weeks))} weeks · ${fest} Capua cards, ${fest ? (oin/fest).toFixed(2) : "-"} offers a card (outside one: ${fo ? (oout/fo).toFixed(2) : "-"}) · ${sum(hs.map(h=>h.boutsIn))} bouts toward it`);
    if(broke) console.log(`    when broken   cards still owed: median ${med(hs.flatMap(h=>h.left).filter(x=>x!=null))} · heat after: median ${med(hs.flatMap(h=>h.heatAtBreak))}`);
    console.log(`    ends          ${kinds.map(k=>share(hs, k)).join(" · ")}`);
    console.log(`    at the end    median gold ${med(hs.map(h=>h.gold))} · fame ${med(hs.map(h=>h.fame))} · buried ${med(hs.map(h=>h.buried))}`);
  }
}
await browser.close(); server.close();
