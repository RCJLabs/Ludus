/* WHERE THE ROAD'S LEAD LIVES — #309

     node test/probes/lead.mjs [houses] [weeks] [seed prefix]

   Audit item 10 asked for content on the road: eleven of the thirty-six drawn events refuse to fire
   away. #268 refused it until someone decided whether the road needed a ceiling; #280 decided it —
   "the road was not thin and underpaid, it was thin and winning" — on the grounds that the eleven
   are "things that go wrong", and priced the road with `wagonWeek`. v3.283.0 re-took it: the road
   still won, harder. Nobody had located WHY. This is the instrument that did.

   THREE EXPLANATIONS REFUTED, one per section of #309's entry:
     · the eleven cards: measured every choice of each on a clone, most are WINDFALLS (the condemned
       and a fee, an invitation, a mentor, a purse); only `patronGone` and `roomFire` are bad
     · the rope's answers at home: the costly choice-0 answers buy delayed value — the omen's seal is
       a blessing, the funeral a warmer successor — and a "sensible" arm that skipped them ruined the
       staying houses (it also, through a label table that merged `omen`'s two variants, DEFIED every
       ill omen, which is the measurer's error and is recorded as one)
     · the purse multiplier: every town's set to 1, and NOTHING moved

   WHAT IT WAS, section 2 below: the same touring house, split by where it stood, fought 0.9 bouts a
   week everywhere — and in a town 93% of them were tier 3, the Primus, while two thirds of its Capua
   bouts were the Pits. Deaths per 100 bouts: Capua 9.1, a town 2.8. `cityTier` handed a known house
   Primus cards on three game-weeks in four; Capua holds them at its festivals.

   #309 holds the town's great games to the festivals. Measured with section 1, two seed sets:
     seeds WAGON   tours' median gold 12,061 -> 7,066 · stays 5,053 unchanged · 2.39x -> 1.40x
     seeds SEEDB   tours' median gold 12,741 -> 7,871 · stays 1,160 unchanged · 10.98x -> 6.79x
   Touring gold falls ~40% on both; the RATIO is not robust, because the staying median crosses
   into debt on some seed sets — read the two medians, not their quotient.

   AND WHAT IT DID NOT MOVE: the good ending (26 -> 27 against 6; 19 -> 20 against 5) and burials.
   That half is lethality, on Capua's side — section 2 shows the Pits killing ~10 men per 100 bouts
   against ~3 for a town's lower cards. It is the next item, and this probe is its baseline.

   #311: IT IS NOT LETHALITY. Picking the pit's likeliest win cut burials from a median 30 to 12 on 40
   houses, and Capua's ordinary games cut deaths per week of life 15% on 160; neither moved the good
   ending. `closed` fires only on an EMPTY yard, so the headline counts which houses finish. Read beside
   `alive`, the gap that is left is DEBT. `probes/pooled.mjs` prints both. */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 40), W = +(process.argv[3] || 420), SEEDP = process.argv[4] || "WAGON";
/* the option set `probes/wagons.mjs` plays, so the two read the same houses */
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true };

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST, SEEDP])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","houseRecord","doFight","doMelee","doPairFight","doVenatio"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  /* every finished bout, by where it was fought and its tier; a bout held on a crux counts when it ends */
  const byPlace = {};
  let ARM = "";
  for(const name of ["doFight","doMelee","doPairFight","doVenatio"]){
    const f = A[name];
    A[name] = function(d, who, offer, ...rest){
      const dead0 = (d.gladiators||[]).filter(g=>g.status==="dead").length;
      const r = f.call(this, d, who, offer, ...rest);
      if(r && r.pending) return r;
      const died = (d.gladiators||[]).filter(g=>g.status==="dead").length > dead0 ? 1 : 0;
      const where = (offer && offer.city) ? "town" : (d.rome ? "rome" : "capua");
      for(const k of [`${where}`, `${where} · tier ${offer ? offer.tier : "?"}`]){
        const T = ((byPlace[ARM] = byPlace[ARM] || {})[k] = byPlace[ARM][k] || { bouts:0, deaths:0 });
        T.bouts++; T.deaths += died;
      }
      return r;
    };
  }
  const arm = (lever, tag) => { ARM = tag; const houses = [];
    for(let i=0;i<H;i++){
      const d = A.newGameState("Ld","clean",`${SEEDP}-${i}`);
      const opts = Object.assign({}, MOST, lever);
      for(let w=0; w<W && !d.over; w++){ try { R.lanista(d, opts); } catch(e){} }
      const Rc = A.houseRecord(d);
      houses.push({ gold:Math.round(d.gold||0), buried:Rc.lost||0, end:d.over ? String(d.over.kind||d.over) : "alive" });
    }
    return houses; };
  return { tours: arm({ tour:true }, "TOURS"), stays: arm({ road:false }, "STAYS"), byPlace };
}, [H, W, MOST, SEEDP]);

if(out.why){ console.log("PROBE COULD NOT RUN: " + out.why); }
else {
  const med = a => { const s = a.slice().sort((x,y)=>x-y); return s[s.length>>1]; };
  const ends = hs => { const c = {}; hs.forEach(h=>c[h.end]=(c[h.end]||0)+1);
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k} ${n}`).join(" · "); };
  console.log(`WHERE THE ROAD'S LEAD LIVES — ${H} paired houses x ${W} weeks, seeds ${SEEDP}`);
  console.log(`1  the headline, tour:true against road:false`);
  console.log(`     median gold    tours ${med(out.tours.map(h=>h.gold))} · stays ${med(out.stays.map(h=>h.gold))}   (read the two, not their ratio)`);
  console.log(`     median buried  tours ${med(out.tours.map(h=>h.buried))} · stays ${med(out.stays.map(h=>h.buried))}`);
  console.log(`     tours end: ${ends(out.tours)}`);
  console.log(`     stays end: ${ends(out.stays)}`);
  console.log(`2  every finished bout, by where it was fought — deaths of the house's own men per 100`);
  for(const [armTag, T] of Object.entries(out.byPlace)){
    console.log(`   ${armTag}`);
    for(const k of Object.keys(T).sort()){ const x = T[k];
      console.log(`     ${k.padEnd(18)} ${String(x.bouts).padStart(6)} bouts · ${(x.deaths/x.bouts*100).toFixed(1).padStart(5)} per 100`); }
  }
}
await browser.close(); server.close();
