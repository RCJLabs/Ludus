/* WHAT DOES A MAN ACTUALLY HAVE WHEN HIS SENTENCE ENDS? — #238's verify-first

   The feature's own banner says a man condemned to the ludus who "survived his term earned the
   rudis out of it". `damnCheck` fires when the term clears, gives him +26 regard and +24 morale,
   and leaves `g.status` at "active". It adds no win and no point of renown. Actual freedom runs
   through `grantRudis`, gated on `rudisEligible` — 10 wins and 180 renown — which does not exempt
   a discharged damnatus from anything.

   And the two counters do not measure the same thing. A sentence is 10-18 BOUTS FOUGHT, win or
   lose. The rudis wants 10 WINS plus 180 renown. A man who loses one bout of a ten-bout term is
   already short the moment his paper is discharged.

   The item names two falsifiable outcomes and this decides between them:

     (a) if discharged damnati clear `rudisEligible` at a MATERIALLY HIGHER rate than ordinary
         bought men over an equivalent stretch — plausible, because the discharge bonus could be
         helping him survive to accumulate wins later — then the premise needs revisiting and a
         smaller fix, or none, may be right.
     (b) if they essentially never cross it either, that confirms the premise and hands the exact
         numbers — average wins and renown short, by win-rate band — needed to size a discount
         curve rather than guess one.

   So for every damnatus who reaches `damnLeft(g)<=0` ALIVE: his win rate over the sentence, his
   wins and renown at that moment against RUDIS_WINS/RUDIS_FAME, and how many further bouts he
   goes on to fight — and whether he ever clears the bar independently. Against, on the same
   houses, every ordinary man who ever fought.

   Run: node test/probes/served.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 500);
const SEED = process.argv[4] || "SERVED";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const served = [];        /* one row per damnatus who lived to be discharged */
  const ordinary = [];      /* every other man who ever fought */
  let arrived = 0, diedInTerm = 0, houses = 0, weeks = 0;
  const unfinished = {}, stillOwed = [], boutsGot = [];

  for(let h=0; h<H; h++){
    const d = A.newGameState("Sv"+h, "clean", `${SEED}-${h}`);
    houses++;
    const wasDamn = new Set();      /* everyone who ever arrived under a paper */
    const atDischarge = new Map();  /* gid -> snapshot the week the paper cleared */
    const everSeen = new Map();
    for(let w=0; w<W && !d.over; w++){
      /* who is under a paper right now, before the week runs */
      for(const g of (d.gladiators||[])){
        if(A.isDamn(g) && !wasDamn.has(g.id)){ wasDamn.add(g.id); arrived++; }
        everSeen.set(g.id, g);
      }
      const under = (d.gladiators||[]).filter(g=>A.isDamn(g)).map(g=>g.id);
      try { R.lanista(d, {}); } catch(e){ break; }
      weeks++;
      /* anybody who was under a paper and is not now, and is still alive, was discharged */
      for(const gid of under){
        const g = (d.gladiators||[]).find(x=>x.id===gid);
        if(!g || A.isDamn(g)) continue;
        if(g.status === "dead"){ continue; }
        if(atDischarge.has(gid)) continue;
        atDischarge.set(gid, { wins:g.wins||0, losses:g.losses||0, pfame:Math.round(g.pfame||0),
          week:d.week, age:g.age||0 });
      }
    }
    /* and what became of each of them by the end */
    for(const [gid, snap] of atDischarge){
      const g = everSeen.get(gid) || (d.gladiators||[]).find(x=>x.id===gid);
      if(!g) continue;
      const bouts = snap.wins + snap.losses;
      served.push({ rate: bouts ? +(snap.wins/bouts).toFixed(3) : 0,
        winsAt:snap.wins, fameAt:snap.pfame, boutsAt:bouts,
        winsShort: Math.max(0, A.RUDIS_WINS - snap.wins),
        fameShort: Math.max(0, A.RUDIS_FAME - snap.pfame),
        clearAt: snap.wins >= A.RUDIS_WINS && snap.pfame >= A.RUDIS_FAME,
        endWins:g.wins||0, endFame:Math.round(g.pfame||0),
        after: (g.wins||0)+(g.losses||0) - bouts,
        cleared: A.rudisEligible(g), fate:g.status });
    }
    for(const g of everSeen.values()){
      if(wasDamn.has(g.id)) continue;
      if(((g.wins||0)+(g.losses||0)) < 1) continue;
      ordinary.push({ wins:g.wins||0, fame:Math.round(g.pfame||0), bouts:(g.wins||0)+(g.losses||0),
        cleared: A.rudisEligible(g), fate:g.status });
    }
    /* WHAT ACTUALLY BECAME OF THE ONES WHO WERE NEVER DISCHARGED. "arrived minus discharged" is
       not "died" — it also holds every man still serving when the run stopped. The difference
       decides whether the sentence is lethal or simply longer than a career. */
    for(const gid of wasDamn){
      if(atDischarge.has(gid)) continue;
      const g = everSeen.get(gid) || (d.gladiators||[]).find(x=>x.id===gid);
      const k = !g ? "vanished" : A.isDamn(g) ? (g.status === "dead" ? "died under the paper" : "still serving")
        : g.status === "dead" ? "died" : g.status;
      unfinished[k] = (unfinished[k]||0) + 1;
      if(g && A.isDamn(g)) stillOwed.push(A.damnLeft(g));
      if(g) boutsGot.push((g.wins||0)+(g.losses||0));
    }
    diedInTerm += wasDamn.size - atDischarge.size;
  }
  return { served, ordinary, arrived, diedInTerm, houses, weeks, unfinished, stillOwed, boutsGot,
    RUDIS_WINS:A.RUDIS_WINS, RUDIS_FAME:A.RUDIS_FAME,
    crimes: A.CRIMES.map(c=>c.bouts) };
}, [H, W, SEED]);

const pc = (a,b) => b ? `${(100*a/b).toFixed(1)}%` : "-";
const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : 0; };
const mean = a => a.length ? +(a.reduce((s,x)=>s+x,0)/a.length).toFixed(2) : 0;

console.log(`\n  ${out.houses} houses x ${W}w · ${out.weeks} played weeks · sentences run ${Math.min(...out.crimes)}-${Math.max(...out.crimes)} bouts`);
console.log(`  ${out.arrived} men arrived under a paper · ${out.served.length} lived to be discharged · ${out.diedInTerm} did not (${pc(out.diedInTerm,out.arrived)})`);
console.log(`  and what became of those: ${Object.entries(out.unfinished).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
console.log(`  bouts they actually got: median ${med(out.boutsGot)} against a sentence of ${Math.min(...out.crimes)}-${Math.max(...out.crimes)}`);
if(out.stillOwed.length) console.log(`  the ones still under the paper owed a median of ${med(out.stillOwed)} more bouts\n`); else console.log("");

if(!out.served.length) console.log("  nobody was ever discharged — nothing to size");
else {
  const S = out.served;
  console.log(`=== AT THE MOMENT THE PAPER CLEARS ===`);
  console.log(`  win rate over the sentence: median ${med(S.map(x=>x.rate))} · mean ${mean(S.map(x=>x.rate))}`);
  console.log(`  wins: median ${med(S.map(x=>x.winsAt))} against RUDIS_WINS ${out.RUDIS_WINS} · renown: median ${med(S.map(x=>x.fameAt))} against RUDIS_FAME ${out.RUDIS_FAME}`);
  console.log(`  short by, median: ${med(S.map(x=>x.winsShort))} wins and ${med(S.map(x=>x.fameShort))} renown`);
  console.log(`  cleared the bar AT discharge: ${S.filter(x=>x.clearAt).length} of ${S.length} (${pc(S.filter(x=>x.clearAt).length,S.length)})`);

  console.log(`\n=== BY HOW WELL HE SERVED ===`);
  const band = [[0,0.25,"lost most of them"],[0.25,0.45,"lost more than he won"],[0.45,0.6,"about even"],[0.6,1.01,"won most of them"]];
  for(const [lo,hi,name] of band){
    const b = S.filter(x=>x.rate>=lo && x.rate<hi);
    if(!b.length){ console.log(`  ${name.padEnd(22)} —`); continue; }
    console.log(`  ${name.padEnd(22)} n=${String(b.length).padStart(3)} · at discharge ${mean(b.map(x=>x.winsAt))} wins / ${mean(b.map(x=>x.fameAt))} renown`
      + ` · short ${mean(b.map(x=>x.winsShort))} wins, ${mean(b.map(x=>x.fameShort))} renown · ever freed by the bar ${pc(b.filter(x=>x.cleared).length,b.length)}`);
  }

  console.log(`\n=== AND WHAT BECAME OF HIM ===`);
  console.log(`  further bouts after discharge: median ${med(S.map(x=>x.after))} · mean ${mean(S.map(x=>x.after))}`);
  console.log(`  ever cleared rudisEligible independently: ${S.filter(x=>x.cleared).length} of ${S.length} (${pc(S.filter(x=>x.cleared).length,S.length)})`);
  const O = out.ordinary;
  console.log(`  the same bar, for the ${O.length} ordinary men who ever fought: ${O.filter(x=>x.cleared).length} (${pc(O.filter(x=>x.cleared).length,O.length)})`);
  console.log(`    [the code's own figure for every man who ever draws breath is 14.1%]`);
  console.log(`  fates: ${Object.entries(S.reduce((a,x)=>{a[x.fate]=(a[x.fate]||0)+1;return a;},{})).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
}
console.log("");
await browser.close(); server.close();
