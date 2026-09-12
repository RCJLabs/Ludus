/* WHAT THE YARD ACTUALLY BUYS — #273's verify-first, which the item calls the whole item.

     node test/probes/walls.mjs 24 520 [ref|most]

   #273: "What does `yard` actually buy? Read `EVENTS.yard.run` and every reader of what it sets.
   If it is a second facility with its own cells, the second house half-exists ... If it is a one-off
   purchase with no facility behind it, the item is the facility."

   ---- READ, AND IT IS THE SECOND ----
   `EVENTS.yard.run` delegates to `buyYard`, which buys a dead rival's LINEAGE and pushes his men
   into the cells you already have — `d.gladiators.push(g)` — capped by `rosterFull`, with whoever
   does not fit sold on at the gate for half `gladValue`. There is no facility, no second cells, no
   second roster. `offerYard`'s own comment says so in as many words: **"Phase 3 would be the second
   yard that holds them; without it they are sold on at the gate."**

   EVERY READER OF WHAT IT SETS, which is what the item asked for:

     d.flags.yardsTaken   LIVE — a new rival arrives warier (`grudge + ri(8,18)`, `watchful`) and
                          two chronicle lines name how many gates on the street are yours
     h.lineage.sold       LIVE — the offer gate, `lastDark`, and the newcomer's inheritance
     g.fromYard           WRITTEN ONCE, READ NOWHERE. One hit in the whole file.
     h.lineage.soldAt     WRITTEN ONCE, READ NOWHERE. One hit in the whole file.

   `fromYard` is the man's provenance — he walked up the hill from a house you finished, and the
   code has just docked him 22 morale and given him 20 defiance for it — and nothing ever mentions
   it again.

   ---- SO THE NUMBER THAT SIZES THE ITEM IS HOW MANY MEN DO NOT FIT ----
   That is exactly what a second yard would hold, and nothing has counted it. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 24), W = +(process.argv[3] || 520);
const POLICY = process.argv[4] || "ref";
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true, tour:true };
const NO_TOUR = Object.assign({}, MOST); delete NO_TOUR.tour;
const OPTS = Object.assign({ yard:true },
  POLICY === "most" ? MOST : POLICY === "home" ? NO_TOUR : {});

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, OPTS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","cellsCap","activeG","lastDark","yardPrice"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const buys = [], houses = [], offers = [];
  let weeks = 0, darkWeeks = 0, askedWeeks = 0;
  for(let i=0;i<H;i++){
    const d = A.newGameState("Wl","clean",`WALLS-${i}`);
    let taken = 0, before = 0, cap0 = 0, pend = null;
    for(let w=0; w<W; w++){
      if(d.over) break;
      weeks++;
      /* is there a dark yard standing unbought, and has it been offered */
      let dk = null; try { dk = A.lastDark(d); } catch(e){}
      if(dk) darkWeeks++;
      if(dk && dk.lineage && dk.lineage.asked) askedWeeks++;

      before = (d.gladiators||[]).filter(g=>!A.isGone || !A.isGone(g)).length;
      cap0 = A.cellsCap(d);
      pend = dk && dk.lineage ? { men:dk.lineage.men||0, worth:dk.lineage.worth||0,
        endedAs:dk.lineage.endedAs } : null;
      try { R.lanista(d, OPTS); } catch(e){}
      try { A.endWeek(d); } catch(e){ break; }
      /* SAMPLED AFTER `endWeek`, NOT BEFORE. `d.askYard` is set and cleared inside the same pass —
         its own comment says so — so a probe reading it at the top of the week sees nothing, which
         is what the first cut of this did: five offers counted and zero terms recorded. `endWeek`
         raises the question into `pendingEvent`, and that is what survives to be answered. */
      const pe = d.pendingEvent;
      if(pe && pe.id === "yard" && pe.data && pe.data.y){
        const y = pe.data.y;
        offers.push({ week:d.week, price:y.price, gold:Math.round(d.gold),
          favour:Math.round(d.favor), wants:y.favour, men:y.men||0,
          canPay:d.gold >= y.price, canStand:d.favor >= y.favour });
      }
      const now = (d.flags && d.flags.yardsTaken) || 0;
      if(now > taken){
        taken = now;
        const arrived = (d.gladiators||[]).filter(g=>g.fromYard).length;
        buys.push({ week:d.week, cap:cap0, rosterBefore:before,
          offered: pend ? pend.men : null, endedAs: pend ? pend.endedAs : null,
          carrying:arrived });
      }
    }
    houses.push({ taken, tagged:(d.gladiators||[]).filter(g=>g.fromYard).length,
      cap:A.cellsCap(d), over:d.over?d.over.kind:null, week:d.week });
  }
  return { buys, houses, weeks, darkWeeks, askedWeeks, offers };
}, [H, W, OPTS]);

await browser.close(); server.close();
if(out.why){ console.log(out.why); process.exit(1); }

const pct = n => (100*n/Math.max(1,out.weeks)).toFixed(1);
console.log(`\n#273 — WHAT THE YARD BUYS · ${H} houses x ${W} weeks under \`${POLICY}\` + yard:true (${out.weeks} played)\n`);
console.log(`a dark yard stood unbought in ${out.darkWeeks} weeks (${pct(out.darkWeeks)}%), offered in ${out.askedWeeks} (${pct(out.askedWeeks)}%)`);
console.log(`yards TAKEN: ${out.buys.length} across ${H} houses (${out.houses.filter(h=>h.taken>0).length} houses bought one)\n`);
if(out.buys.length){
  console.log(`${"week".padStart(5)} ${"cap".padStart(4)} ${"roster".padStart(7)} ${"offered".padStart(8)} ${"room".padStart(5)}   ended as`);
  for(const b of out.buys){
    const room = Math.max(0, b.cap - b.rosterBefore);
    console.log(`${String(b.week).padStart(5)} ${String(b.cap).padStart(4)} ${String(b.rosterBefore).padStart(7)} ${String(b.offered).padStart(8)} ${String(room).padStart(5)}   ${b.endedAs||"?"} · ${b.carrying} arrived`);
  }
  const short = out.buys.filter(b=>b.offered != null && b.offered > Math.max(0, b.cap - b.rosterBefore));
  const spill = out.buys.reduce((n,b)=>n + Math.max(0, (b.offered||0) - Math.max(0, b.cap - b.rosterBefore)), 0);
  console.log(`\n${short.length} of ${out.buys.length} purchases had more men than room.`);
  console.log(`**${spill} men would have needed a second yard to hold them.**`);
}
const O = out.offers;
if(O.length){
  const pay = O.filter(x=>x.canPay).length, stand = O.filter(x=>x.canStand).length;
  const both = O.filter(x=>x.canPay && x.canStand).length;
  console.log(`\nTHE OFFER, SPLIT BY TERM — ${O.length} weeks with a letter standing:`);
  console.log(`   could PAY the price     ${pay} (${(100*pay/O.length).toFixed(0)}%)`);
  console.log(`   had the STANDING        ${stand} (${(100*stand/O.length).toFixed(0)}%)`);
  console.log(`   both at once            ${both} (${(100*both/O.length).toFixed(0)}%)`);
  const med = a => a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)];
  console.log(`   price p50 ${med(O.map(x=>x.price))}d against a purse of ${med(O.map(x=>x.gold))}d · ` +
    `standing ${med(O.map(x=>x.favour))} against the ${O[0].wants} it wants`);
}
const tagged = out.houses.reduce((n,h)=>n+h.tagged, 0);
console.log(`\n${tagged} men were still standing with a \`fromYard\` tag at the end of their runs —`);
console.log(`and \`fromYard\` has ONE hit in the whole source file, which is the write.`);
