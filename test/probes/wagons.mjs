/* ---- RE-TAKEN AT v3.283.0. #280's DIRECTION HOLDS; EVERY NUMBER IT QUOTED WAS WRONG. ----
   This probe double-stepped the week until #285, AND it had stopped producing the paired outcome
   figures its own header quoted — so when the stepping fault was found there was nothing left to
   re-run. Both are fixed: the arm records life, gold, bouts, freed, buried and the ending again.

   Re-taken, 40 paired houses, WITH `wagonWeek`'s pricing already in place:

       median life     264  against  421     (tour 8W 23L 9T)
       median gold   12565  against 3946     (tour 29W 5L 6T)
       median bouts    242  against  386     (tour 9W 25L 6T)
       men freed       278  against  219     (tour 24W 10L 6T)
       men buried      452  against 1126     (tour 2W 32L 6T)
       `closed`      30 of 40       4 of 40

   THE SHORTER LIFE IS NOT A WORSE ONE. `closed` is the ending where enough men walk out free:
   thirty of forty touring houses REACH it and stop, while twenty-one of forty staying houses are
   simply still alive at the cap. The tourer finishes the game; the stayer keeps playing. Read that
   way the road wins harder than #280 thought — three times the coin, two fifths the burials, and
   the good ending seven times as often — and it wins with the pricing already applied. */
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
  const miss = ["newGameState","activeG","regardOf","CITY_KEYS","houseRecord"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const arm = (lever, tag)=>{
    /* weekly means over the whole arm, plus the same split by WHERE the house was standing */
    const acc = { home:{ n:0, reg:0, mor:0, def:0, unr:0, men:0 },
                  away:{ n:0, reg:0, mor:0, def:0, unr:0, men:0 } };
    let weeks = 0, deaths = 0, escapes = 0, refusals = 0, uprisings = 0;
    /* ---- AND THE OUTCOME PER HOUSE, WHICH THIS PROBE'S OWN HEADER QUOTED AND STOPPED TAKING ----
       #280's decision rested on "the road is winning" — median life, gold, bouts, freed and
       `closed` endings, paired. Those numbers are in the header above and the probe no longer
       produced them, so when #285 found the double-step there was nothing to re-run. Restored, and
       note what this now measures: the road WITH `wagonWeek`'s pricing already in it. */
    const houses = [];
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
        const dead = (d.gladiators||[]).filter(g=>g.status==="dead").length;
        const gone = (d.gladiators||[]).filter(g=>g.status==="escaped").length;
        deaths += Math.max(0, dead - wasDead); wasDead = dead;
        escapes += Math.max(0, gone - wasGone); wasGone = gone;
        if(d.over && String(d.over.kind||d.over) === "rebellion") uprisings++;
      }
      const Rc = A.houseRecord(d);
      houses.push({ life:d.week, gold:Math.round(d.gold||0), bouts:(d.book&&d.book.n)||0,
        freed:Rc.freed||0, buried:Rc.lost||0, end:d.over ? String(d.over.kind||d.over) : "alive" });
    }
    const mean = b => b.n ? { reg:+(b.reg/b.n).toFixed(1), mor:+(b.mor/b.n).toFixed(1),
      def:+(b.def/b.n).toFixed(1), unr:+(b.unr/b.n).toFixed(1), men:+(b.men/b.n).toFixed(2), n:b.n } : null;
    return { tag, weeks, deaths, escapes, refusals, uprisings, houses,
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

/* ---- THE HEADLINE #280 DECIDED ON, RE-TAKEN ----
   Paired: the same seed index is the same house in both arms, so a win is a win against ITSELF. */
{
  const t = out.tours, s = out.stays;
  if(t && s && t.houses && s.houses && t.houses.length === s.houses.length){
    const med = a => { const q=[...a].sort((x,y)=>x-y); return q.length ? q[Math.floor(q.length/2)] : 0; };
    const col = (arm,k) => arm.houses.map(h=>h[k]);
    const closed = arm => arm.houses.filter(h=>h.end === "closed").length;
    const pair = k => {
      let w=0,l=0,e=0;
      for(let i=0;i<t.houses.length;i++){
        const a=t.houses[i][k], b=s.houses[i][k];
        if(a>b) w++; else if(a<b) l++; else e++;
      }
      return `${w}W ${l}L ${e}T`;
    };
    const n = t.houses.length;
    console.log(`  THE HEADLINE, RE-TAKEN — tour:true against road:false, ${n} paired houses`);
    console.log(`    ${"".padEnd(12)} ${"tours".padStart(8)} ${"stays".padStart(8)}   paired (tour's record)`);
    for(const [label,k] of [["median life","life"],["median gold","gold"],["median bouts","bouts"],
                            ["men freed","freed"],["men buried","buried"]]){
      const a = k==="freed"||k==="buried"
        ? col(t,k).reduce((x,y)=>x+y,0) : med(col(t,k));
      const b = k==="freed"||k==="buried"
        ? col(s,k).reduce((x,y)=>x+y,0) : med(col(s,k));
      console.log(`    ${label.padEnd(12)} ${String(a).padStart(8)} ${String(b).padStart(8)}   ${pair(k)}`);
    }
    console.log(`    ${"`closed`".padEnd(12)} ${String(closed(t)).padStart(8)} ${String(closed(s)).padStart(8)}`);
    const ends = arm => { const m={}; for(const h of arm.houses) m[h.end]=(m[h.end]||0)+1;
      return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · "); };
    console.log(`    tours end: ${ends(t)}`);
    console.log(`    stays end: ${ends(s)}`);
    console.log(`\n    NOTE: this is the road WITH wagonWeek's pricing already applied (v3.276.0).`);
    console.log(`    A gap that survives the pricing is a gap the pricing did not close.\n`);
  }
}

await browser.close(); server.close();
