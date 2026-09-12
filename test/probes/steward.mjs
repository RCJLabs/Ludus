/* WHO HANDS OVER, AND WHAT THE HOUSE SAYS ABOUT HIM AFTER — #272's verify-first.

     node test/probes/steward.mjs 24 520 [ref|most]

   #272: "The dynasty is playable only through death. `succeed` fires when the lanista dies or
   breaks; `oldAge` wants `age>=62 && health>=45 && d.heir` and #118 measured it UNREACHABLE."

   THAT IS THE #118-ERA STATE AND IT WAS FIXED. `lanistaWeek` carries a retirement branch —
   `L.age >= 62 && L.health >= 45 && d.heir && heirOfAge(d) && yearOf(d) >= 6 && R() < 0.06` —
   which raises `d.succession` with `retire:true`, and `succeed` reads it: "a handover from a living
   man is not a handover from a dead one, and the two say different things". `probes/widow.mjs`
   already measured the result — **fifteen handovers, fifteen of fifteen RETIREMENTS, median age 63**
   — so the door the item asks for is open and is in fact the ONLY one anybody walks through.

   SO THE QUESTION IS WHAT HAPPENS AFTERWARDS. `succeed`'s own chronicle says the retired man "keeps
   his rooms and the ledger, and comes down to the square when the mood takes him". #248 phase 2
   then gives the house six recurring lines about its old master on a fourteen-week cadence
   (`foreWeek`, `FORE_LINES`) — and **not one of the six reads `f.retired`.** They are all written
   for a dead man: "takes the news standing in the doorway", "has now served two masters", "still
   calls the place his yard". A house whose master is upstairs hears them anyway.

   This counts both: the split of handovers into retirements and deaths, and how many of those
   recurring lines land on a man who is still in the building. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 24), W = +(process.argv[3] || 520);
const POLICY = process.argv[4] || "ref";
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true, tour:true };
const OPTS = POLICY === "most" ? MOST : {};

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, OPTS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","FORE_EVERY","FORE_LINES","heirOfAge","LAN_AGE_FROM"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const hand = [], houses = [];
  let weeks = 0, ripeWeeks = 0, heirWeeks = 0, oldWeeks = 0;
  for(let i=0;i<H;i++){
    const d = A.newGameState("St","clean",`STEW-${i}`);
    let gen = 1;
    for(let w=0; w<W; w++){
      if(d.over) break;
      weeks++;
      /* THE ITEM'S SECOND QUESTION, split by term rather than counted whole: how often is there a
         named heir of age AND a lanista past LAN_AGE_FROM at the same time. */
      const L = d.lanista;
      const oldEnough = !!(L && L.age >= A.LAN_AGE_FROM);
      let ofAge = false; try { ofAge = !!(d.heir && A.heirOfAge(d)); } catch(e){}
      if(oldEnough) oldWeeks++;
      if(ofAge) heirWeeks++;
      if(oldEnough && ofAge) ripeWeeks++;
      try { R.lanista(d, OPTS); } catch(e){}
      try { A.endWeek(d); } catch(e){ break; }
      if((d.generation||1) > gen){
        gen = d.generation;
        const f = (d.forebears||[])[(d.forebears||[]).length-1];
        if(f) hand.push({ week:d.week, retired:!!f.retired, age:f.age, held:f.to - f.from });
      }
    }
    /* how many of the six recurring lines each forebear got, and of what kind. `foreWeek` fires on
       `since % FORE_EVERY === 0` for the LAST forebear only, and stops after the pool runs out. */
    const F = (d.forebears||[]);
    const last = F[F.length-1];
    const lines = last && last.to != null
      ? Math.max(0, Math.min(A.FORE_LINES.length, Math.floor((d.week - last.to) / A.FORE_EVERY)))
      : 0;
    houses.push({ fore:F.length, retired:last ? !!last.retired : null, lines,
      over:d.over ? d.over.kind : null, week:d.week });
  }
  return { hand, houses, weeks, ripeWeeks, heirWeeks, oldWeeks,
    every:A.FORE_EVERY, pool:A.FORE_LINES.length, lanFrom:A.LAN_AGE_FROM };
}, [H, W, OPTS]);

await browser.close(); server.close();
if(out.why){ console.log(out.why); process.exit(1); }

const pct = (n) => (100*n/Math.max(1,out.weeks)).toFixed(1);
console.log(`\n#272 — WHO HANDS OVER · ${H} houses x ${W} weeks under \`${POLICY}\` (${out.weeks} played)\n`);
console.log(`THE STATE THE DOOR NEEDS, split by term:`);
console.log(`   a lanista past ${out.lanFrom}          ${out.oldWeeks} weeks (${pct(out.oldWeeks)}%)`);
console.log(`   a named heir of age        ${out.heirWeeks} weeks (${pct(out.heirWeeks)}%)`);
console.log(`   BOTH at once               ${out.ripeWeeks} weeks (${pct(out.ripeWeeks)}%)\n`);

const ret = out.hand.filter(h=>h.retired).length, died = out.hand.length - ret;
console.log(`HANDOVERS: ${out.hand.length} across ${H} houses — ${ret} RETIRED, ${died} died.`);
if(out.hand.length){
  const ages = out.hand.map(h=>h.age).sort((a,b)=>a-b);
  console.log(`   age at handover p50 ${ages[Math.floor(ages.length/2)]} · weeks held p50 ` +
    `${out.hand.map(h=>h.held).sort((a,b)=>a-b)[Math.floor(out.hand.length/2)]}`);
}
const withFore = out.houses.filter(h=>h.fore > 0);
const retLines = withFore.filter(h=>h.retired).reduce((n,h)=>n+h.lines, 0);
const deadLines = withFore.filter(h=>!h.retired).reduce((n,h)=>n+h.lines, 0);
console.log(`\n${withFore.length} of ${H} houses ever carried a forebear.`);
console.log(`RECURRING LINES ABOUT THE OLD MASTER (every ${out.every}w, ${out.pool} of them):`);
console.log(`   ${retLines} landed on a man who is STILL IN THE BUILDING`);
console.log(`   ${deadLines} landed on a man who is dead`);
console.log(`   and not one of the ${out.pool} reads \`f.retired\`, so both sets read the same.`);
