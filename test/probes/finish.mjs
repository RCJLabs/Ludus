/* THE TWELVE WAYS TO BE FINISHED, AND WHICH OF THEM A HOUSE CAN ACTUALLY REACH — #147

   The source can set twelve `d.over.kind`s: debt, ruin, emptied, closed, foreclosed, lanistaDied,
   oldAge, rebellion, triumph, and the three RUINS gates banned, disgrace and ruined. #147 opened on
   a count taken over 60 houses of 420 weeks — ruin 26, debt 25, banned 2, emptied 1, rebellion 1,
   five alive — where two kinds carried 85% of outcomes and seven never appeared at all.

   FOUR OF THE TWELVE ARE ALREADY ANSWERED and this file does not re-litigate them: `test/checks/ends.mjs`
   drives `foreclosed` (reachable, 6 of 6 at week 44), holds `closed` on a hand-built ledger at five
   men freed, and records `oldAge` as a door you take by DECLINING the chair — a player who takes it
   sees the ending 0 times by design. Read that check before this probe; what is here is the part it
   does not cover, which is the three-term RUINS gates and the arms that go after each ending on
   purpose. Its whole job is to separate two things that a count cannot:

     a gate the game will not open however you play  —  a fault
     a door the reference player walks past          —  a policy, and not a fault at all

   THE DESIGN, and the three habits it is built out of:
   · CALL THE GAME'S OWN GATE, NEVER A COPY. `banned`, `disgrace` and `ruined` are three-term
     conjunctions; `nemesis` established that "it never fired" says nothing about WHICH term holds,
     so each gate is asked of `RUINS[k].need(d)` directly and its terms are counted separately
     beside it. If the split ever disagrees with the whole, believe the whole and fix the split.
   · AN ARM THAT DECLINES THE OTHER WAY. "The rope never triumphs" is a fact about the rope. Each
     pursued ending gets a policy that goes after it — the rudis and the block for `closed`, a
     lender for `foreclosed`, `romeReturn`'s second door for `triumph`, `endTheLine` for `oldAge` —
     and the base arm runs first on the same seeds so the pair is readable.
   · PRINT THE RAW MATERIAL. Every arm prints its per-house rows, because two findings on this
     project died for being read off 24 houses and one of them was a maximum. Run it on three or
     four seed prefixes before quoting anything.

   IT IS NAMED `finish` AND NOT `ends` ON PURPOSE. The first draft was called `ends`, on a misreading
   of the handle note above as pointing at a deleted PROBE; it points at the check, which is very much
   alive. Two files of the same name doing overlapping work in two directories is how a suite ends up
   with two answers to one question, which is the fault the check's own header was written about.

   ONE FAULT ALREADY PAID FOR, recorded so it is not repeated: the sibling probe `succ` reached for
   `A.WEEKS_PER_YEAR` to advance the lanista's age, that name is not on the handle, `x % undefined`
   is NaN, and twelve rows read "he never got to 62" while the real houses beside them were getting
   there in twenty-two of thirty. Anything this file borrows from `endWeek` is read back off the
   game — `yearOf`, `RUINS`, `rudisEligible` — and never rewritten here. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 900);
const SEED = process.argv[4] || "ENDS";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;

  /* the four pursued endings, each as the smallest deviation from the reference player that could
     reach it. Anything larger and the arm stops being a control on the rope's policy. */
  const ARMS = {
    base:   { note:"the reference player, unchanged" },
    mercy:  { note:"frees every man who earns the rudis, then sells whoever is left — `closed`",
      opts:{ free:true },
      each(d){
        /* `closed` wants an empty yard AND five freed. The rudis is the slow half; the block is the
           fast one, and `sellMan` takes anybody who is not damnatus. Only start emptying once the
           five are banked, or the house is sold out from under the men who would have earned it. */
        if(A.houseRecord(d).freed < 5) return;
        for(const g of A.activeG(d)) A.sellMan(d, g.id, null);
      } },
    lender: { note:"borrows the largest line on week one and never repays a denarius — `foreclosed`",
      each(d){
        if(!d.loan && !d.over && d.week <= 3) A.borrow(d, "murena", 99999);
      } },
    laurel: { note:"answers `romeReturn` with its second door — `triumph`",
      opts:{ answer:(ev)=> ev.id === "romeReturn" ? 1 : null } },
    line:   { note:"lays the house down the week a retirement is offered — `oldAge`",
      each(d){
        if(d.succession && d.succession.retire) A.endTheLine(d);
      } },
    alone:  { note:"never names an heir, so the lanista's death is the house's — `lanistaDied`",
      opts:{ heir:false } },
    blood:  { note:"every bout sine missione — the house `disgrace` is written about",
      opts:{ stakes:"sine" } },
    /* `stakes` is a REQUIREMENT — the rope takes no bout that is not sine, which is why `blood`
       lives 28 weeks and dies of ruin rather than of disgrace. `preferStakes` takes the death match
       when it is on the bill and fights anyway when it is not, which is a lanista with a taste for
       it rather than a man refusing to work. Whether a gate is reachable by a house that SURVIVES
       is a different question from whether it is reachable, and it is the one that matters. */
    hot:    { note:"takes the death match whenever it is on the bill, and fights anyway when it is not",
      opts:{ preferStakes:"sine" } },
  };

  const runArm = (name, arm) => {
    const rows = [];
    for(let h=0; h<H; h++){
      const d = A.newGameState("End"+h, "clean", `${SEED}-${h}`, null);
      /* gate telemetry: the three RUINS conjunctions, asked of the game and split by term */
      const gate = {}; for(const k of A.RUIN_KEYS) gate[k] = { whole:0, terms:{}, held:{}, oneShort:{} };
      const bump = (k,t) => { gate[k].terms[t] = (gate[k].terms[t]||0)+1; };
      /* ---- AND WHICH TERM IS THE ONE HOLDING ----
         `nemesis` is the model here: a count of the conjunction is useless for a fix, and so is a
         count of each term on its own, because terms that each hold for hundreds of weeks can still
         never hold TOGETHER. What names the repair is the week where all but one are satisfied. */
      const tally = (k, terms) => {
        const on = terms.filter(t=>t[1]);
        gate[k].held[on.length] = (gate[k].held[on.length]||0)+1;
        if(on.length === terms.length - 1){
          const miss = terms.find(t=>!t[1])[0];
          gate[k].oneShort[miss] = (gate[k].oneShort[miss]||0)+1;
        }
      };
      let freed = 0, loanPeak = 0, romeWks = 0, succ = 0, retire = 0, romeRet = 0;
      /* ---- HOW CLOSE, NOT HOW OFTEN ----
         A term that scores zero weeks tells you nothing about whether it missed by a point or was
         never in the same country. Every term the gates read gets its best value over the run as
         well as its count, and the two are printed together. */
      const X = { favorMin:999, frontMin:999, bloodMax:0, heatMax:0, finesMax:0, breachMax:0,
        edictMax:0, grudgeMax:0, fameMin:1e9, menMin:999, lanMin:999 };
      for(let w=0; w<W; w++){
        if(d.over) break;
        if(arm.each) arm.each(d);
        if(d.over) break;
        R.lanista(d, arm.opts);
        for(const k of A.RUIN_KEYS){
          let hit = false; try { hit = A.RUINS[k].need(d); } catch(e){}
          if(hit) gate[k].whole++;
        }
        /* the terms, one at a time — the whole above is the game's, these are this file's reading
           of the same clauses, and the two are printed together so a bad split shows up */
        const law = A.lawOf(d), br = A.inBreach(d).length;
        if(law.heat >= 90) bump("banned","heat>=90");
        if((law.edicts||[]).length >= 2) bump("banned","edicts>=2");
        if(br >= 2) bump("banned","inBreach>=2");
        if(law.fines > 0) bump("banned","fines>0");
        if(A.repOf(d,"blood") >= 88) bump("disgrace","blood>=88");
        if(d.favor <= 6) bump("disgrace","favor<=6");
        if(A.facOf(d,"front") <= 12) bump("disgrace","front<=12");
        const gr = Math.max(0, ...((d.rivals||[]).map(x=>x.grudge||0)));
        if(gr >= 95) bump("ruined","grudge>=95");
        if(d.fame < 120) bump("ruined","fame<120");
        const men = d.gladiators.filter(g=>!A.isGone(g)).length;
        if(men <= 2) bump("ruined","men<=2");
        tally("banned",  [["heat>=90",law.heat>=90], ["edicts>=2",(law.edicts||[]).length>=2],
                          ["inBreach>=2",br>=2], ["fines>0",law.fines>0]]);
        tally("disgrace",[["blood>=88",A.repOf(d,"blood")>=88], ["favor<=6",d.favor<=6],
                          ["front<=12",A.facOf(d,"front")<=12]]);
        tally("ruined",  [["grudge>=95",gr>=95], ["fame<120",(d.fame||0)<120], ["men<=2",men<=2]]);
        /* ---- THE COUNTERFACTUAL, WHICH IS THE ONLY PART THAT DECIDES ANYTHING ----
           "one term short for 259 weeks" is a finding; it is not yet an argument for a change.
           Both gates fail on the term that describes the CAUSE — a rival at the height of a feud,
           patrons who have given up on you — while the other terms describe the AFTERMATH, and the
           aftermath is what erases the cause: nobody keeps a grudge against a house with two men in
           it. So the reading to test is the high-water one — did this house EVER stand where the
           term asks, at any point before the week the rest of the gate came true. */
        X.grudgeEver = X.grudgeEver || gr >= 95;
        X.favorEver  = X.favorEver  || d.favor <= 6;
        if((d.fame||0) < 120 && men <= 2){ gate.ruined.aftermath = (gate.ruined.aftermath||0)+1;
          if(X.grudgeEver) gate.ruined.wouldPeak = (gate.ruined.wouldPeak||0)+1;
          /* what the gate's own prose says happened — "outbid you on the block for a year, took two
             of your men". `d.defected` is that, counted, and the grudge standing at the same moment
             is printed beside it so "the rival is not interested" can be told from "he is at 94". */
          gate.ruined.defAt = (gate.ruined.defAt||0) + ((d.defected||[]).length);
          gate.ruined.grAt = Math.max(gate.ruined.grAt||0, Math.round(gr)); }
        if(A.repOf(d,"blood") >= 88 && A.facOf(d,"front") <= 12){
          gate.disgrace.aftermath = (gate.disgrace.aftermath||0)+1;
          if(X.favorEver) gate.disgrace.wouldPeak = (gate.disgrace.wouldPeak||0)+1; }
        X.favorMin = Math.min(X.favorMin, Math.round(d.favor));
        X.frontMin = Math.min(X.frontMin, Math.round(A.facOf(d,"front")));
        X.bloodMax = Math.max(X.bloodMax, Math.round(A.repOf(d,"blood")));
        X.heatMax  = Math.max(X.heatMax,  Math.round(law.heat));
        X.finesMax = Math.max(X.finesMax, Math.round(law.fines));
        X.breachMax= Math.max(X.breachMax, br);
        X.edictMax = Math.max(X.edictMax, (law.edicts||[]).length);
        X.grudgeMax= Math.max(X.grudgeMax, Math.round(gr));
        X.fameMin  = Math.min(X.fameMin,  Math.round(d.fame||0));
        X.menMin   = Math.min(X.menMin,   men);
        if(d.lanista) X.lanMin = Math.min(X.lanMin, Math.round(d.lanista.health));
        /* ---- AND WHETHER THE THING THE ENDING IS ABOUT HAPPENS AT ALL ----
           `ruined`'s prose is a rival dismantling you: outbidding on the block for a year, taking
           two of your men. `d.defected` is the game's own record of a man leaving for another house
           and `d.poach` is the approach that precedes it, so if these are nought over every house in
           every arm the ending is not rare, it is about an event this game does not produce. */
        X.defMax  = Math.max(X.defMax||0, (d.defected||[]).length);
        if(d.poach) X.poachWks = (X.poachWks||0)+1;
        if(d.court) X.courtWks = (X.courtWks||0)+1;
        freed = A.houseRecord(d).freed;
        loanPeak = Math.max(loanPeak, A.owes(d));
        if(d.rome) romeWks++;
        if(d.pendingEvent && d.pendingEvent.id === "romeReturn") romeRet++;
        if(d.succession){ succ++; if(d.succession.retire) retire++; }
      }
      rows.push({ end:d.week, over:d.over?d.over.kind:"alive", gate, freed, X,
        loanPeak, romeWks, romeRet, succ, retire,
        rome:(d.flags&&d.flags.romeBouts)||0 });
    }
    return { name, note:arm.note, rows };
  };

  const arms = [];
  for(const [k,a] of Object.entries(ARMS)) arms.push(runArm(k, a));
  return { arms, ruinKeys:A.RUIN_KEYS };
}, [H, W, SEED]);

const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };

console.log(`\n  ${H} houses x up to ${W}w per arm · seed "${SEED}"\n`);
for(const arm of out.arms){
  const R = arm.rows;
  const ends = {}; for(const x of R) ends[x.over] = (ends[x.over]||0)+1;
  console.log(`  ${arm.name.toUpperCase()} — ${arm.note}`);
  console.log(`    median life ${med(R.map(x=>x.end))}w · endings: ${Object.entries(ends).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
  console.log(`    freed (median/max) ${med(R.map(x=>x.freed))}/${Math.max(...R.map(x=>x.freed))}`
    + ` · peak owed (median/max) ${med(R.map(x=>x.loanPeak))}/${Math.max(...R.map(x=>x.loanPeak))}`
    + ` · weeks at Rome (total) ${R.reduce((s,x)=>s+x.romeWks,0)}`
    + ` · romeReturn raised ${R.reduce((s,x)=>s+x.romeRet,0)}`
    + ` · succession weeks ${R.reduce((s,x)=>s+x.succ,0)} (retirement ${R.reduce((s,x)=>s+x.retire,0)})`);
  for(const k of out.ruinKeys){
    const whole = R.reduce((s,x)=>s+x.gate[k].whole,0);
    const terms = {};
    for(const x of R) for(const [t,n] of Object.entries(x.gate[k].terms)) terms[t] = (terms[t]||0)+n;
    const held = {}, one = {};
    for(const x of R){
      for(const [n,c] of Object.entries(x.gate[k].held)) held[n] = (held[n]||0)+c;
      for(const [t,c] of Object.entries(x.gate[k].oneShort)) one[t] = (one[t]||0)+c;
    }
    console.log(`    ${k.padEnd(9)} the game's own need(): ${String(whole).padStart(5)} weeks   |   terms: `
      + Object.entries(terms).map(([t,n])=>`${t} ${n}`).join(" · "));
    console.log(`    ${" ".padEnd(9)} weeks by terms held: ${Object.entries(held).sort().map(([n,c])=>`${n}:${c}`).join(" ")}`
      + `   |   one short, and the one missing: ${Object.entries(one).sort((a,b)=>b[1]-a[1]).map(([t,c])=>`${t} ${c}`).join(" · ") || "never one short"}`);
    if(k === "ruined" || k === "disgrace"){
      const aft = R.reduce((s,x)=>s+(x.gate[k].aftermath||0),0);
      const wld = R.reduce((s,x)=>s+(x.gate[k].wouldPeak||0),0);
      const hs  = R.filter(x=>(x.gate[k].wouldPeak||0) > 0).length;
      console.log(`    ${" ".padEnd(9)} the other terms alone: ${aft} weeks   |   and the cause had happened EARLIER on ${wld} of them, in ${hs} of ${R.length} houses`);
      if(k === "ruined"){
        const dh = R.filter(x=>(x.gate.ruined.defAt||0) > 0).length;
        const gb = Math.max(0, ...R.map(x=>x.gate.ruined.grAt||0));
        console.log(`    ${" ".padEnd(9)} on those weeks: men lost to a rival in ${dh} of ${R.length} houses · the angriest rival stood at ${gb} against the 95 asked`);
      }
    }
  }
  /* the best value any house in the arm ever got each term to, beside what the term asks for */
  const best = (f, dir) => dir < 0 ? Math.min(...R.map(x=>x.X[f])) : Math.max(...R.map(x=>x.X[f]));
  console.log(`    closest any house came, term by term:`);
  console.log(`      banned   heat>=90 best ${best("heatMax",1)} · edicts>=2 best ${best("edictMax",1)} · inBreach>=2 best ${best("breachMax",1)} · fines>0 best ${best("finesMax",1)}`);
  console.log(`      disgrace blood>=88 best ${best("bloodMax",1)} · favor<=6 best ${best("favorMin",-1)} · front<=12 best ${best("frontMin",-1)}`);
  console.log(`      ruined   grudge>=95 best ${best("grudgeMax",1)} · fame<120 best ${best("fameMin",-1)} · men<=2 best ${best("menMin",-1)}`);
  console.log(`      lanista  health<=0 best ${best("lanMin",-1)}`);
  console.log(`    the rival machinery, over the whole arm: men lost to another house ${R.reduce((s,x)=>s+(x.X.defMax||0),0)}`
    + ` (in ${R.filter(x=>(x.X.defMax||0)>0).length} of ${R.length} houses)`
    + ` · weeks with a man being talked to ${R.reduce((s,x)=>s+(x.X.poachWks||0),0)}`
    + ` · weeks courting one of theirs ${R.reduce((s,x)=>s+(x.X.courtWks||0),0)}`);
  console.log(`    raw (weeks lived · ending · freed · peak owed · Rome wks):`);
  console.log(`      ` + R.map(x=>`${x.end}/${x.over}${x.freed?`/f${x.freed}`:""}${x.loanPeak?`/d${x.loanPeak}`:""}${x.romeWks?`/R${x.romeWks}`:""}`).join("  "));
  console.log("");
}

await browser.close(); server.close();
