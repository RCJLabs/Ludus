/* THE GRUDGE DOES NOTHING — #246 phase 1, the instrument.

   (`poach` is free in both directories; checked before writing, because v3.210.0 overwrote two
   files that were not.)

   `RIVAL_MOVES` is nine moves and every one of them is about the rival himself. Everything a rival
   does AT the player runs through four gates instead: `startPoach`, and the three `GRUDGE_*`
   thresholds behind sabotage, the bribed editor and the thugs. `probes/pace.mjs` measured the
   result over 3,133 weeks — a rival held grudge ≥ 35 on 107 of them, `poachTarget` returned a man
   on **0**, and 28 hostile acts landed in all, one every 112 weeks.

   The item's own verify-first is that the poach gate has TWO terms and nobody has read them apart:

       startPoach   a rival with `grudge >= GRUDGE_POACH`      ... AND ...
       poachTarget  a man with `defiance >= 45`, not an auctoratus, not `regardLoyal`

   and that the second one has to be read under a policy that does NOT keep the men sweet, because
   the reference player feasts at unrest 30 and the feast takes four points of defiance off every
   man in the yard. If `defiance >= 45` appears only with the feasts off, the gate is honest and the
   rope is merely careful; if under neither, the term is a wall. `dark.mjs`'s rule, for the fifth
   time in this queue.

   So, every week of every arm:
     1 · THE TWO TERMS APART — weeks with a grudged rival, weeks with a takeable man, weeks with
         both, and the poach actually started.
     2 · AND THE MAN-FILTER'S THREE CLAUSES APART — how many men fail on defiance, on the contract,
         on loyalty, and how many survive all three. A gate that never opens is one of these.
     3 · THE THREE OTHER GATES — sabotage at 26, the bribed editor at 38, the thugs at 44 — as
         grudge-weeks, so the whole hostile surface is one table.
     4 · UNDER THREE POLICIES — the reference player; one with the cells left alone (`cells:false`,
         which is where the rope's feast and its walk both live); and one that also refuses every
         bout, because a house that never fights makes no grudge at all and is the control.

     node test/probes/poach.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SEED = process.argv[4] || "POACH";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","activeG","poachTarget","regardLoyal","isAuctor","GRUDGE_POACH",
                "GRUDGE_SABOTAGE","GRUDGE_BRIBE","GRUDGE_THUGS"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const arm = (label, opts) => {
    const t = { label, weeks:0, grudged:0, takeable:0, both:0, started:0, defected:0,
      sab:0, bribe:0, thugs:0, maxGrudge:0, men:0,
      failDef:0, failAuctor:0, failLoyal:0, pass:0, bestDef:0, acts:{} };
    for(let h=0; h<H; h++){
      const d = A.newGameState("Po"+h, "clean", `${SEED}-${h}`);
      let hadPoach = false;
      for(let w=0; w<W; w++){
        if(d.over) break;
        t.weeks++;
        const riv = (d.rivals||[]).filter(x=>!x.retired);
        const gr = riv.reduce((m,x)=>Math.max(m, x.grudge||0), 0);
        if(gr > t.maxGrudge) t.maxGrudge = gr;
        if(riv.some(x=>x.grudge >= A.GRUDGE_POACH)) t.grudged++;
        if(riv.some(x=>x.grudge >= A.GRUDGE_SABOTAGE)) t.sab++;
        if(riv.some(x=>x.grudge >= A.GRUDGE_BRIBE)) t.bribe++;
        if(riv.some(x=>x.grudge >= A.GRUDGE_THUGS)) t.thugs++;
        /* 2 — the man filter, clause by clause, over every man in the yard */
        const act = A.activeG(d);
        for(const g of act){ t.men++;
          const dOK = (g.defiance||0) >= 45, aOK = !A.isAuctor(g), lOK = !A.regardLoyal(g);
          if((g.defiance||0) > t.bestDef) t.bestDef = Math.round(g.defiance||0);
          if(!dOK) t.failDef++;
          if(dOK && !aOK) t.failAuctor++;
          if(dOK && aOK && !lOK) t.failLoyal++;
          if(dOK && aOK && lOK) t.pass++;
        }
        let target = null;
        try { target = riv.length ? A.poachTarget(d, riv[0]) : null; } catch(e){}
        if(target) t.takeable++;
        if(target && riv.some(x=>x.grudge >= A.GRUDGE_POACH)) t.both++;
        if(d.poach && !hadPoach){ t.started++; hadPoach = true; }
        if(!d.poach) hadPoach = false;
        /* what actually landed, read off the question the week raised — the rope's own counters
           carry nothing hostile, so the first cut of this arm reported "nothing at all" three times
           and that was the arm, not the game */
        const HOSTILE = ["poached","sabotage","thugs","bribedEditor","stolenSteel","courted","defected","whispers"];
        let did = null; try { did = R.lanista(d, opts); } catch(e){ break; }
        const ev = d.pendingEvent && d.pendingEvent.id;
        if(ev && HOSTILE.includes(ev)) t.acts[ev] = (t.acts[ev] || 0) + 1;
        if(d.poach && d.poach.gid && !t.seen) t.seen = 1;
      }
    }
    return t;
  };
  return { arms: [
    arm("the reference player", {}),
    arm("cells left alone", { cells:false }),
    arm("cells alone, no bouts", { cells:false, bout:false }),
  ] };
}, [H, W, SEED]);
await browser.close(); server.close();
if(out.why){ console.log(out.why); process.exit(1); }

const P = (s, w) => String(s).padEnd(w), N = (v, w) => String(v == null ? "—" : v).padStart(w);
const pc = (v, n) => n ? `${(100*v/n).toFixed(1)}%` : "—";
console.log(`\nTHE GRUDGE — ${H} houses x ${W} weeks, seed ${SEED}\n`);

console.log(`1 · THE POACH GATE'S TWO TERMS, APART`);
console.log(`  ${P("policy", 26)}${"weeks".padStart(7)}${"a grudged rival".padStart(17)}${"a takeable man".padStart(16)}${"both".padStart(8)}${"poach began".padStart(13)}`);
for(const t of out.arms)
  console.log(`  ${P(t.label, 26)}${N(t.weeks, 7)}${N(pc(t.grudged, t.weeks), 17)}${N(pc(t.takeable, t.weeks), 16)}`
    + `${N(pc(t.both, t.weeks), 8)}${N(t.started, 13)}`);

console.log(`\n2 · AND WHY NO MAN IS TAKEABLE — every man of every week, by the clause he fails`);
console.log(`  ${P("policy", 26)}${"men".padStart(9)}${"defiance < 45".padStart(15)}${"under contract".padStart(16)}${"loyal (regard 70+)".padStart(20)}${"takeable".padStart(10)}${"best defiance".padStart(15)}`);
for(const t of out.arms)
  console.log(`  ${P(t.label, 26)}${N(t.men, 9)}${N(pc(t.failDef, t.men), 15)}${N(pc(t.failAuctor, t.men), 16)}`
    + `${N(pc(t.failLoyal, t.men), 20)}${N(pc(t.pass, t.men), 10)}${N(t.bestDef, 15)}`);

console.log(`\n3 · THE WHOLE HOSTILE SURFACE, as grudge-weeks`);
console.log(`  ${P("policy", 26)}${"sabotage 26".padStart(14)}${"bribe 38".padStart(11)}${"poach 35".padStart(11)}${"thugs 44".padStart(11)}${"top grudge".padStart(12)}`);
for(const t of out.arms)
  console.log(`  ${P(t.label, 26)}${N(pc(t.sab, t.weeks), 14)}${N(pc(t.bribe, t.weeks), 11)}${N(pc(t.grudged, t.weeks), 11)}`
    + `${N(pc(t.thugs, t.weeks), 11)}${N(t.maxGrudge, 12)}`);

console.log(`\n4 · AND WHAT ACTUALLY LANDED`);
for(const t of out.arms)
  console.log(`  ${P(t.label, 26)} ` + (Object.entries(t.acts).map(([k,v])=>`${k} ${v}`).join(" · ") || "nothing at all"));
console.log(`\nJSON ${JSON.stringify(out.arms.map(t=>({ label:t.label, grudged:+pc(t.grudged,t.weeks).replace("%",""),
  takeable:+pc(t.takeable,t.weeks).replace("%",""), started:t.started, bestDef:t.bestDef })))}`);
