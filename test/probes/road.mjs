/* DOES THE REFERENCE PLAYER TOUR, OR IS IT STUCK ON THE COAST?

   #132 dissolved on a denominator: the primacy is offered on 54-75% of the Capua cards a qualifying
   house sees, and the reason a long run reads 3% of all open weeks is that 91% of a late house's
   games weeks are somewhere other than Capua. That was written up as a fact about the reference
   player's POLICY — "the reference lanista tours".

   Reading the code says it is not a policy at all:
     · `comeHome` has exactly ONE caller in the whole game, the UI button at ludus.jsx:18653.
       Nothing in any weekly phase ever sends a house back to Capua.
     · `R.lanista` has no travel step. It never calls `setOut` and it never calls `comeHome`.
     · Its only road out is the `bayCall` event, which the rope answers with choice 0 —
       "Take the road to <town>" — because the question step defaults to i=0.

   If that is right, the reference house leaves Capua the first time an editor asks for one of its
   men by name, and then stands in that town for the rest of its life. Which is the `reSignOffer`
   shape again: not a player who tours, a player who cannot come home.

   THIS PROBE ASSUMES NOTHING ABOUT WHY. It walks the same 10x420 the other probes walk and records,
   per house and per week, where the house physically is, when it moved, and where its games were.

   WHAT WOULD FALSIFY THE STUCK READING: houses with more than one departure, or any return at all,
   or a road share that does not climb monotonically once the first departure lands. A house that
   genuinely tours goes out and comes back; a stuck one has exactly one transition, ever. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const ARM = process.argv[4] || "on";     /* on | off — `off` is the stay-at-home control */
const out = await p.evaluate(([H,W,ARM])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const OPTS = ARM === "off" ? { road:false } : {};
  const houses = [];
  let weeks=0, atHome=0, onRoad=0, travelling=0;
  let cardWeeks=0, capuaCards=0, cityCards=0;
  let bayCallSeen=0, otherSetOut=0;
  const eventTally = {};
  for(let h=0;h<H;h++){
    const d = A.newGameState("Rd"+h,"clean",`ROAD-${h}`,null);
    const me = { name:"Rd"+h, weeks:0, out:0, back:0, firstOut:null, roadWeeks:0,
                 towns:{}, lastPlace:null, cardsHome:0, cardsAway:0, died:null };
    let prevCity = null;
    for(let w=0;w<W;w++){
      if(d.over) break;
      weeks++; me.weeks++;
      /* where the house physically is, before the week is played */
      if(d.travel){ travelling++; }
      else if(d.city){ onRoad++; me.roadWeeks++; me.towns[d.city] = (me.towns[d.city]||0)+1; }
      else atHome++;
      /* a transition is a fact about the state, not about who caused it */
      if(d.city !== prevCity){
        if(d.city){ me.out++; if(me.firstOut === null) me.firstOut = d.week; }
        else if(prevCity) me.back++;
        prevCity = d.city;
      }
      /* the card that is actually up this week — fresh only, because d.games persists */
      if(d.games && d.games.week === d.week){
        cardWeeks++;
        if(d.games.city){ cityCards++; me.cardsAway++; }
        else { capuaCards++; me.cardsHome++; }
      }
      /* what the week ASKED, before the rope answers it — bayCall is the only road out */
      const ev = d.pendingEvent;
      if(ev){ eventTally[ev.id] = (eventTally[ev.id]||0)+1;
              if(ev.id === "bayCall") bayCallSeen++; }
      R.lanista(d, OPTS);
    }
    me.died = d.over ? d.over.kind : "alive";
    me.lastPlace = d.city || (d.rome ? "ROME" : "Capua");
    houses.push(me);
  }
  return { weeks, atHome, onRoad, travelling, cardWeeks, capuaCards, cityCards,
           bayCallSeen, otherSetOut, houses, H, W,
           topEvents: Object.entries(eventTally).sort((a,b)=>b[1]-a[1]).slice(0,12),
           rope: R.say() };
}, [H,W,ARM]);
await browser.close(); server.close();
const pc = (n,d) => d ? `${(n/d*100).toFixed(0)}%` : "-";
console.log(`=== WHERE IS THE REFERENCE HOUSE STANDING? ===  [road ${ARM}]`);
console.log(`  ${out.weeks} house-weeks over ${out.H} houses x ${out.W} weeks\n`);
console.log(`  in Capua              ${out.atHome}  (${pc(out.atHome,out.weeks)})`);
console.log(`  in a coastal town     ${out.onRoad}  (${pc(out.onRoad,out.weeks)})`);
console.log(`  on the road between   ${out.travelling}  (${pc(out.travelling,out.weeks)})\n`);
console.log(`  games weeks with a card up   ${out.cardWeeks}`);
console.log(`    ...the card was Capua's    ${out.capuaCards}  (${pc(out.capuaCards,out.cardWeeks)})`);
console.log(`    ...the card was a town's   ${out.cityCards}  (${pc(out.cityCards,out.cardWeeks)})\n`);
console.log(`  the bayCall question was asked on ${out.bayCallSeen} weeks`);
console.log(`\n  PER HOUSE — a house that TOURS goes out and comes back; a STUCK one moves once:`);
console.log(`  house  weeks  departures  returns  first out  weeks away  ended        towns`);
for(const h of out.houses){
  const towns = Object.entries(h.towns).map(([k,v])=>`${k} ${v}w`).join(", ") || "-";
  console.log(`  ${h.name.padEnd(6)} ${String(h.weeks).padStart(5)}  ${String(h.out).padStart(10)}`
    + `  ${String(h.back).padStart(7)}  ${String(h.firstOut===null?"-":h.firstOut).padStart(9)}`
    + `  ${String(h.roadWeeks).padStart(10)}  ${h.died.padEnd(11)}  ${towns}`);
}
console.log(`\n  the twelve commonest questions asked, so a rare road is visible as rare:`);
for(const [k,v] of out.topEvents) console.log(`    ${k.padEnd(18)} ${v}`);
console.log(`\n  rope: ${out.rope}`);
