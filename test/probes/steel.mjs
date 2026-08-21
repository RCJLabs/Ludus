/* CAN THE ARMORY'S OWN AGENDA ITEM EVER FIRE? — following the 6.5%

   `places` found the armory is wanted on 6.5% of weeks against 60-88% for every other tab, and
   raises 4 distinct agenda lines against 15-22. Turning the rope's gear step off made it WORSE, 2.4%
   — with nothing bought there is no steel to wear out. So the test has to be a house that arms its
   men and then lets the steel go, which is what `mend:false` gives.

   And there is a candidate fault to check while looking. The guard reads

       (g.wear && g.wear[s] || 100) < 25

   and wear counts DOWN from 100. A piece worn to 0 — gone — takes the `|| 100` branch and reads as
   pristine, so the one state the line most wants to report is the one state it cannot see. Whether
   that matters depends on whether wear actually lands on 0 rather than passing through 1..24, which
   is a distribution, not an opinion: it is counted here rather than argued.

   Usage: node test/probes/steel.mjs [houses per prefix] [weeks]
*/
import { serve, open, installRope } from "../harness.mjs";
/* 120 WEEKS, NOT 40, AND THE FIRST RUN OF THIS PROBE PROVED WHY. At 40 weeks it saw 2,323
   house-weeks without one piece under 34 and read that as "the armory's agenda line is unreachable".
   Steel simply wears slowly: neglected for 120 weeks it reaches 1.03. A window too short to produce
   the state being looked for returns a clean zero and looks exactly like a finding. */
const H = +(process.argv[2] || 20), W = +(process.argv[3] || 120);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const band = { "0":0, "1-24":0, "25-33":0, "34-66":0, "67-100":0, none:0 };
  let weeks=0, asWritten=0, asMeant=0, wornPieces=0, armoryOnAgenda=0;
  for(const pre of ["ST-1","ST-2","ST-3"]){
    for(let h=0; h<H; h++){
      const d = A.newGameState("St"+h, "clean", `${pre}-${h}`, null);
      for(let w=0; w<W; w++){
        if(d.over) break;
        R.lanista(d, { mend:false, neglect:true });
        weeks++;
        let anyWritten=false, anyMeant=false;
        for(const g of A.activeG(d)){
          for(const s of A.SLOTS){
            const it = A.GEAR[g.kit && g.kit[s]];
            if(!A.wears(it)) { band.none++; continue; }
            wornPieces++;
            /* read wear through the game's own wearOf, not the raw field — the guard in agenda()
               uses the field and the rope uses the function, and a probe that picks one is testing
               its own guess about which is authoritative */
            const raw = A.wearOf(g, s);
            const v = (raw === undefined || raw === null || Number.isNaN(raw)) ? 100 : raw;
            band[v===0?"0":v<25?"1-24":v<34?"25-33":v<67?"34-66":"67-100"]++;
            if(((g.wear && g.wear[s]) || 100) < 25) anyWritten = true;   // the guard as it stands
            if(v < 25) anyMeant = true;                                   // treating 0 as 0
          }
        }
        if(anyWritten) asWritten++;
        if(anyMeant) asMeant++;
        let list=[]; try { list = A.agenda(d)||[]; } catch(e){}
        if(list.some(x=>x.tab==="armory")) armoryOnAgenda++;
      }
    }
  }
  return { band, weeks, asWritten, asMeant, wornPieces, armoryOnAgenda, houses:H*3 };
}, [H,W]);

const pc = n => `${(n/out.weeks*100).toFixed(1)}%`;
console.log(`\nCAN THE ARMORY'S OWN AGENDA ITEM EVER FIRE?`);
console.log(`  ${out.houses} houses arming their men and never mending — ${out.weeks} house-weeks, ${out.wornPieces} worn pieces seen\n`);
console.log(`  where a piece's wear actually sits:`);
for(const [k,v] of Object.entries(out.band))
  console.log(`     ${k.padEnd(8)} ${String(v).padStart(7)}  ${out.wornPieces?((v/(k==="none"?out.wornPieces+out.band.none:out.wornPieces))*100).toFixed(1):0}%`);
console.log(`\n  weeks where "steel is close to going" SHOULD be raised (wear under 25, 0 counted as 0): ${out.asMeant} (${pc(out.asMeant)})`);
console.log(`  weeks where the guard as written raises it  ((wear || 100) < 25)                       : ${out.asWritten} (${pc(out.asWritten)})`);
console.log(`  weeks with anything at all from the armory on the agenda                               : ${out.armoryOnAgenda} (${pc(out.armoryOnAgenda)})`);
console.log();
await browser.close(); server.close();
