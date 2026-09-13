/* WHAT THE ROAD COSTS THE MEN, WHICH IS CURRENTLY NOTHING — #268's ceiling question, priced.

     node test/probes/wagons.mjs 40 420

   #268 counted the road's content and refused to add any: eleven of the thirty-six drawn events
   refuse to fire away, `walkTheCells` is `pickNight`'s only caller so the five-card night deck is
   unreachable, and its risk note said content on the road decides the ceiling before anyone has
   decided it. It shipped the count into the circuit panel and stopped there.

   ---- THE CEILING QUESTION, ANSWERED THE OTHER WAY ----
   Measured paired, the same seeds to both arms, 40 houses x 420 weeks, `tour:true` against
   `road:false`:

       median life     62w   against  53w      (paired 10 wins, 4 losses, 26 ties)
       median gold     404   against  111
       median bouts     62   against   42
       men freed       165   against   46
       `closed`         10 of 40      against 0 of 40
       died of debt      5           against  11

   **The road is not thin and underpaid. It is thin and WINNING**, on every measure taken, while
   the house stands away 68.8% of weeks. A committed tourer sees eleven fewer questions a week and
   no night deck at all, and beats the house that stays by three and a half times the coin.

   So the fault is not that the road is starved of content. It is that skipping a question is
   skipping a PROBLEM: eleven of the week's cards are things that go wrong, and the road's
   "content loss" is a mechanical gain. Feeding the road would widen a gap; pricing it closes one.

   ---- AND NOTHING ON THE ROAD TOUCHES THE MEN ----
   Grepping every location guard in the file against morale, regard, defiance and unrest returns
   NOTHING. `awayFromCapua(d)` gates thirty-odd weekly phases and not one of them is a cost paid by
   the familia for living on wagons. The road's whole price is opportunity: the market, the doctore,
   the festivals, the primacy, the funeral games — and the walk, which the balance table calls the
   largest single lever in the game.

   THAT IS THE THING TO CHECK BEFORE PRICING ANYTHING. If a touring roster already degrades —
   through missing the walk, through fatigue, through the feast being the only lever left — then
   the cost exists and is merely too small, and the repair is a number. If it does not degrade at
   all, the cost is absent and the repair is a mechanism. This says which. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 40), W = +(process.argv[3] || 420);
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true };

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","endWeek","activeG","regardOf","CITY_KEYS"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const arm = (lever, tag)=>{
    /* weekly means over the whole arm, plus the same split by WHERE the house was standing */
    const acc = { home:{ n:0, reg:0, mor:0, def:0, unr:0, men:0 },
                  away:{ n:0, reg:0, mor:0, def:0, unr:0, men:0 } };
    let weeks = 0, deaths = 0, escapes = 0, refusals = 0, uprisings = 0;
    for(let i=0;i<H;i++){
      const d = A.newGameState("Wg","clean",`WAGON-${i}`);
      const opts = Object.assign({}, MOST, lever);
      let wasDead = 0, wasGone = 0;
      for(let w=0; w<W; w++){
        if(d.over) break;
        weeks++;
        const men = A.activeG(d);
        const where = (d.city || d.travel) ? "away" : "home";
        const b = acc[where];
        if(men.length){
          b.n++;
          b.reg += men.reduce((n,g)=>n + A.regardOf(g), 0) / men.length;
          b.mor += men.reduce((n,g)=>n + (g.morale==null?50:g.morale), 0) / men.length;
          b.def += men.reduce((n,g)=>n + (g.defiance||0), 0) / men.length;
          b.unr += (d.unrest||0);
          b.men += men.length;
        }
        refusals += men.filter(g=>g.refusing).length ? 1 : 0;
        try { R.lanista(d, opts); } catch(e){}
        try { A.endWeek(d); } catch(e){ break; }
        const dead = (d.gladiators||[]).filter(g=>g.status==="dead").length;
        const gone = (d.gladiators||[]).filter(g=>g.status==="escaped").length;
        deaths += Math.max(0, dead - wasDead); wasDead = dead;
        escapes += Math.max(0, gone - wasGone); wasGone = gone;
        if(d.over && String(d.over.kind||d.over) === "rebellion") uprisings++;
      }
    }
    const mean = b => b.n ? { reg:+(b.reg/b.n).toFixed(1), mor:+(b.mor/b.n).toFixed(1),
      def:+(b.def/b.n).toFixed(1), unr:+(b.unr/b.n).toFixed(1), men:+(b.men/b.n).toFixed(2), n:b.n } : null;
    return { tag, weeks, deaths, escapes, refusals, uprisings,
      home:mean(acc.home), away:mean(acc.away) };
  };

  return { tours: arm({ tour:true }, "TOURS"), stays: arm({ road:false }, "STAYS") };
}, [H, W, MOST]);

if(out.why){ console.log("PROBE COULD NOT RUN: " + out.why); }
else {
  const row = (label, m) => m
    ? `    ${label.padEnd(22)} regard ${String(m.reg).padStart(5)} · morale ${String(m.mor).padStart(5)}`
      + ` · defiance ${String(m.def).padStart(5)} · unrest ${String(m.unr).padStart(5)}`
      + ` · roster ${String(m.men).padStart(5)}   (${m.n} weeks)`
    : `    ${label.padEnd(22)} —`;
  console.log(`\n#280 — WHAT THE ROAD COSTS THE MEN`);
  console.log(`${H} houses x ${W} weeks an arm, same seeds to both\n`);
  for(const k of ["tours","stays"]){
    const a = out[k];
    console.log(`  ${a.tag} (${a.weeks} played weeks) · ${a.deaths} died · ${a.escapes} escaped `
      + `· ${a.refusals} weeks with a man refusing`);
    console.log(row("standing in Capua", a.home));
    console.log(row("standing away", a.away));
    console.log("");
  }
  const t = out.tours, s = out.stays;
  if(t.away && t.home){
    const d = (x) => (t.away[x] - t.home[x]).toFixed(1);
    console.log(`  the same house, away against at home: regard ${d("reg")} · morale ${d("mor")} `
      + `· defiance ${d("def")} · unrest ${d("unr")}`);
  }
  if(t.away && s.home){
    const d = (x) => (t.away[x] - s.home[x]).toFixed(1);
    console.log(`  a touring roster against a staying one: regard ${d("reg")} · morale ${d("mor")} `
      + `· defiance ${d("def")} · unrest ${d("unr")}\n`);
  }
}

await browser.close(); server.close();
