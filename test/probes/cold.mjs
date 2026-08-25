/* #206 — `TELLS.cold` CANNOT FIRE, AND WHAT IT WOULD TAKE TO MAKE IT

   `cold` reads `formOf(o) <= -30` and names the `press` plan. **`form` is only ever written on
   your own men** — `formShift` is called from the bout resolutions and `formWeek` walks
   `d.gladiators` — so `formOf(o)` is 0 for every opponent a player will ever meet. It is one of
   nine tells gating a choice the player pays to be able to make, and it is dead writing.

   THE ITEM NAMED TWO GAMES AND ONE THING TO CHECK FIRST.

   The two games: draw a personal form in `genOpponent`, which would RE-PHASE every seeded house in
   this project because it is a new RNG draw in the hot path; or have `cold` read the man's HOUSE
   form, which exists, is seeded at `ri(-12,12)`, is decayed weekly at `h.form*0.94 + dv`, and is
   already worded to the player by `houseFortune` as "in decline" and "struggling".

   The thing to check first was whether the opponent handed to `when()` carries any route to his
   house. He does not — but THE OFFER DOES. `pickRivalOpp` returns a `ref`, the card stores it as
   `oppRef:{house,fid}`, and it is `null` for a generated man. That null is the whole question,
   because the two pools of house names in this game ARE DISJOINT:

       RIVAL_SEED   Solonius, Vettius, Tullius                       — live, with form
       HOUSES       Ovidius, Calavius, Magnetius, Pelorus, ...       — flavour, no state at all

   A generated opponent is given one of the six ghosts. So the house reading can only ever reach
   the men who come out of a real house, and how many that is decides whether the repair is worth
   making. That is what this counts, on the offers a player is actually shown.

   AND IT COUNTS THE OVERLAP, which is the other half of whether this is worth anything. `cold` and
   `green` both name `press`. If cold only ever fires where green already does, the repair buys a
   different SENTENCE about the man and no new plan-coverage at all — worth knowing before, not
   after.

     node test/probes/cold.mjs 24 420 COLD
*/
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "COLD";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const o = { offers:0, fromHouse:0, ghost:0, ghostNames:{},
    coldNow:0,                     /* what the tell fires today */
    coldHouse:0,                   /* what it would fire reading the house */
    greenFires:0, bothFire:0, coldOnly:0,
    formHist:{}, houseSeen:{}, weeks:0, houses:0 };
  const band = f => f<=-45 ? "<=-45" : f<=-30 ? "-44..-30" : f<=-18 ? "-29..-18" : f<18 ? "-17..17" : f<45 ? "18..44" : ">=45";
  /* ---- AND THE THIRD READING, MODELLED OFFLINE BEFORE A LINE OF GAME CODE IS WRITTEN ----
     The item weighed two games: draw a personal form in `genOpponent` (a new RNG draw in the hot
     path, which re-phases every seeded house in the project) or read the house. There is a third
     it did not consider. A rival fighter ALREADY carries a moving record — `f.wins++` and
     `f.losses++` fire at four sites, when the houses fight each other and when they fight you — so
     his form can be MAINTAINED through outcomes that already happen. `formShift` is pure
     arithmetic; maintaining is not drawing, so it costs no RNG and re-phases nothing.

     This models it rather than asserting it: every rival fighter's (wins, losses) is snapshotted
     each week, diffed, and a form curve reconstructed with the player's own numbers — +18 a win,
     -22 a loss, and `formWeek`'s decay of `f*0.78 - sign(f)*3` on a quiet week. Whether that fires
     often enough is then a measurement and not a hope. */
  const simForm = new Map();      /* fighter id -> modelled form */
  const simRec  = new Map();      /* fighter id -> [wins, losses] last seen */
  const stepForm = rivals => {
    for(const hh of (rivals||[])) for(const f of (hh.fighters||[])){
      const was = simRec.get(f.id) || [f.wins||0, f.losses||0];
      const dw = (f.wins||0) - was[0], dl = (f.losses||0) - was[1];
      simRec.set(f.id, [f.wins||0, f.losses||0]);
      let v = simForm.get(f.id) || 0;
      if(dw || dl) v = Math.max(-100, Math.min(100, v + dw*18 - dl*22));
      else v = Math.abs(v) < 5 ? 0 : v*0.78 - Math.sign(v)*3;      /* formWeek, on a quiet week */
      simForm.set(f.id, v);
    } };

  for(let h=0; h<H; h++){
    const d = A.newGameState("C"+h, "clean", `${SEED}-${h}`, null);
    o.houses++;
    for(let w=0; w<W; w++){
      if(d.over) break;
      R.lanista(d);
      if(d.over) break;
      o.weeks++;
      stepForm(d.rivals);
      const offers = (d.games && d.games.offers) || [];
      for(const off of offers){
        const opp = off.opp; if(!opp) continue;
        o.offers++;
        /* what the tell does today */
        const nowCold = (A.formOf ? A.formOf(opp) : (opp.form||0)) <= -30;
        if(nowCold) o.coldNow++;
        const green = (opp.wins||0) <= 2;
        if(green) o.greenFires++;
        /* ---- AND A FOURTH READING: HIS OWN RECORD, WHICH ALREADY EXISTS AND ALREADY MOVES ----
           No new state, no new draw, nothing to maintain. `f.losses` is incremented at four sites
           and `pickRivalOpp` clones the fighter, so it arrives on the opp intact. If a man who has
           been losing is what "cold" means, this is the cheapest possible way to say it — and
           whether it fires is a measurement, not a hope. */
        const W = opp.wins||0, L = opp.losses||0;
        /* ---- AND `veteran`, WHICH THE NEW CHECK CAUGHT GOING THE OTHER WAY ----
           Its own note records a hand re-band from `wins>=9`, which "fired on practically everyone
           the bay ever put up". It now fires on 0.9%. The re-band swung out of one failure mode
           straight into the other and nothing was measuring either end. Both terms are counted
           separately so the binding one is visible rather than guessed at. */
        const sm = A.statMean ? A.statMean(opp) : 50;
        const endEdge = (opp.end||50) - sm;
        o.vet = o.vet || {};
        const wb = W>=14 ? "14+" : W>=11 ? "11-13" : W>=9 ? "9-10" : W>=6 ? "6-8" : W>=3 ? "3-5" : "0-2";
        o.vet[wb] = (o.vet[wb]||0) + 1;
        o.vetEnd = o.vetEnd || {};
        const eb = endEdge>=6 ? "6+" : endEdge>=3 ? "3-5" : endEdge>=1 ? "1-2" : endEdge>=-2 ? "-2..0" : "under -2";
        o.vetEnd[eb] = (o.vetEnd[eb]||0) + 1;
        for(const [nm, ww, ee] of [["14+ & end>=1",14,1],["11+ & end>=1",11,1],["9+ & end>=1",9,1],
                                   ["14+ only",14,-99],["11+ only",11,-99],["9+ & end>=3",9,3]])
          if(W>=ww && endEdge>=ee) o["vetTry_"+nm] = (o["vetTry_"+nm]||0) + 1;
        o.rec = o.rec || {}; const rb = L===0 ? "no losses" : L===1 ? "1" : L<=3 ? "2-3" : L<=6 ? "4-6" : "7+";
        o.rec[rb] = (o.rec[rb]||0) + 1;
        if(L >= 3 && L > W){ o.losing = (o.losing||0)+1; if(!green) o.losingOnly = (o.losingOnly||0)+1; }
        if(L >= 2 && L > W){ o.losing2 = (o.losing2||0)+1; if(!green) o.losing2Only = (o.losing2Only||0)+1; }
        /* and what it would do reading his house */
        const ref = off.oppRef;
        if(ref && ref.house){
          o.fromHouse++;
          o.houseSeen[ref.house] = (o.houseSeen[ref.house]||0) + 1;
          const hh = (d.rivals||[]).find(x=>x.name===ref.house);
          const f = hh ? (hh.form||0) : null;
          if(f != null){
            o.formHist[band(f)] = (o.formHist[band(f)]||0) + 1;
            if(f <= -30){ o.coldHouse++;
              if(green) o.bothFire++; else o.coldOnly++; }
          }
          /* and what a MAINTAINED personal form would have said about this exact man */
          if(ref.fid != null && simForm.has(ref.fid)){
            const pf = simForm.get(ref.fid);
            o.simSeen = (o.simSeen||0) + 1;
            o.simHist = o.simHist || {}; o.simHist[band(pf)] = (o.simHist[band(pf)]||0) + 1;
            if(pf <= -30){ o.simCold = (o.simCold||0) + 1; if(!green) o.simColdOnly = (o.simColdOnly||0) + 1; }
            if(pf <= -18) o.simCold18 = (o.simCold18||0) + 1;
          }
        } else {
          o.ghost++;
          if(opp.house) o.ghostNames[opp.house] = (o.ghostNames[opp.house]||0) + 1;
        }
      }
    }
  }
  return o;
}, [H, W, SEED]);

await browser.close(); server.close();

const pc = (n, d) => d ? (n/d*100).toFixed(1) + "%" : "—";
console.log(`=== #206, over ${out.houses} houses and ${out.weeks.toLocaleString()} weeks\n`);
console.log(`  ${out.offers.toLocaleString()} offers shown to a player\n`);
console.log(`  TODAY:  cold fires ${out.coldNow} times  (${pc(out.coldNow, out.offers)})`);
console.log(`          green fires ${out.greenFires}  (${pc(out.greenFires, out.offers)})\n`);
console.log(`  where the man comes from:`);
console.log(`    a live house (oppRef set)   ${String(out.fromHouse).padStart(6)}  ${pc(out.fromHouse, out.offers)}`);
console.log(`    generated, a ghost house    ${String(out.ghost).padStart(6)}  ${pc(out.ghost, out.offers)}`);
console.log(`      ghosts by name: ${Object.entries(out.ghostNames).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ") || "none"}`);
console.log(`      live houses:    ${Object.entries(out.houseSeen).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ") || "none"}\n`);
console.log(`  his house's form when he is offered:`);
for(const b of ["<=-45","-44..-30","-29..-18","-17..17","18..44",">=45"])
  console.log(`    ${b.padEnd(9)} ${String(out.formHist[b]||0).padStart(6)}  ${pc(out.formHist[b]||0, out.fromHouse)}`);
console.log(`\n  READING THE HOUSE: cold would fire ${out.coldHouse} times`
  + `  (${pc(out.coldHouse, out.offers)} of all offers, ${pc(out.coldHouse, out.fromHouse)} of the ones it can reach)`);
console.log(`    of those, green ALSO fires on ${out.bothFire} (${pc(out.bothFire, out.coldHouse)})`);
console.log(`    cold alone, saying something green does not: ${out.coldOnly} (${pc(out.coldOnly, out.offers)} of all offers)`);
console.log(`    at the game's OWN word for it — houseFortune says "struggling" at -18 — it would fire `
  + `${(out.formHist["-29..-18"]||0) + (out.formHist["-44..-30"]||0) + (out.formHist["<=-45"]||0)}`
  + `  (${pc((out.formHist["-29..-18"]||0)+(out.formHist["-44..-30"]||0)+(out.formHist["<=-45"]||0), out.offers)} of all offers)`);

console.log(`\n  READING A MAINTAINED PERSONAL FORM (modelled, no game code written):`);
console.log(`    ${(out.simSeen||0).toLocaleString()} offers where the man could be traced back to his own record`);
for(const b of ["<=-45","-44..-30","-29..-18","-17..17","18..44",">=45"])
  console.log(`    ${b.padEnd(9)} ${String((out.simHist||{})[b]||0).padStart(6)}  ${pc((out.simHist||{})[b]||0, out.simSeen||0)}`);
console.log(`    at -30 it fires ${out.simCold||0}  (${pc(out.simCold||0, out.offers)} of all offers)`);
console.log(`    at -18 it fires ${out.simCold18||0}  (${pc(out.simCold18||0, out.offers)} of all offers)`);
console.log(`    at -30, saying something green does not: ${out.simColdOnly||0}`);

console.log(`\n  READING HIS OWN RECORD — no new state at all:`);
console.log(`    losses on the men offered: ${Object.entries(out.rec||{}).sort().map(([k,v])=>`${k}: ${pc(v,out.offers)}`).join("  ")}`);
console.log(`    "3+ losses and more losses than wins" fires ${out.losing||0}  (${pc(out.losing||0, out.offers)})`
  + `  — of which green does NOT already fire: ${out.losingOnly||0} (${pc(out.losingOnly||0, out.offers)})`);
console.log(`    "2+ losses and more losses than wins" fires ${out.losing2||0}  (${pc(out.losing2||0, out.offers)})`
  + `  — green silent on ${out.losing2Only||0} (${pc(out.losing2Only||0, out.offers)})`);

console.log(`\n=== and \`veteran\`, which the tells check caught at the other end`);
console.log(`  wins on the men offered:     ${Object.entries(out.vet||{}).sort().map(([k,v])=>`${k}: ${pc(v,out.offers)}`).join("  ")}`);
console.log(`  end above his own mean:      ${Object.entries(out.vetEnd||{}).sort().map(([k,v])=>`${k}: ${pc(v,out.offers)}`).join("  ")}`);
console.log(`  candidate bands:`);
for(const k of Object.keys(out).filter(x=>x.startsWith("vetTry_")))
  console.log(`    ${k.slice(7).padEnd(14)} ${String(out[k]).padStart(5)}  ${pc(out[k], out.offers)}`);
