/* WHAT A PLAYED HOUSE EVER MEETS — the audit after nine releases

   `coverage` reads 103 of 475 exposed functions never called by a check, and 39 of those are named
   in no check AND no probe. Most of the 39 are readers. Three are whole systems with a written cost
   or a written offer, and for each of them the question is not "is the function reachable" — it is
   the one #166 and #167 turned out to be about: **does a played house ever meet it, and is the door
   the only door?**

   1 · THE WAR IN THE SOUTH. Fifty-eight weeks, four stages, its own market — and the file's own note
       says it once had exactly one door, the "open the gates" branch of `uprising`, which costs nine
       men and thirty fame, so across 48 houses of 400 weeks the four war events fired NOT ONCE. A
       second door was added: `warElsewhere`, at `WAR_AWAY_ODDS` a week from week `WAR_AWAY_AT`.
       Nobody has measured what that door is worth. It is arithmetic before it is a drive — a house
       that lives L weeks past 60 sees it with probability 1 − (1−p)^(L−60) — so the drive can be
       CHECKED against the arithmetic instead of merely reported, which is what an instrument is for.

   2 · `buyLot`, WHICH LIVES BEHIND IT. The legions selling captives in bulk: `d.powLot` is set on a
       market week at 70% while a war runs, and nowhere else. So its reach is the war's reach times
       the market's, and if the war is rare the lot is rarer. One caller, and it is a button.

   3 · `lapseCollegium`. Twenty-two morale and sixteen defiance off every man in the yard, plus
       fourteen unrest — one of the heaviest single losses written anywhere in the file — and it has
       exactly ONE caller: a button that says stop paying. Nothing in the game ever lapses it. So the
       question is whether a house is ever under enough pressure for that to be a real choice, which
       means measuring what the dues actually cost against what the week actually costs.

   4 · AND THE STAFF, who can leave. `staffWeek` gives the medicus and the armourer a 6% chance a
       week of quitting once `quitOn` is true, and a 2% chance of being bought away by a rival. Over
       hundreds of weeks that should be common. Nothing has ever counted it.

   EVERY FIGURE HERE IS A COUNT OR A SHARE, never a median life. v3.64.0's rule: a house's life varies
   by a standard deviation of 139 weeks, so anything priced in weeks lived at this sample is noise,
   and anything priced in "how many houses ever saw it" is not.

   Usage: node test/probes/meet.mjs [houses per prefix] [weeks] [seed]
*/
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420), SEED = process.argv[4] || "MEET";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const PRES = [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`];
  const rows = [];
  let dues = [], bills = [];

  for(const pre of PRES){
    for(let h=0; h<H; h++){
      const d = A.newGameState("Mt"+h, "clean", `${pre}-${h}`, null);
      let w = 0;
      const r = { id:`${pre}#${h}`, life:0, past60:0,
        war:0, warAway:0, warOwn:0, warAt:null, warWeeks:0, stages:{},
        lot:0, lotAfford:0, lotSpace:0,
        coll:0, collWeeks:0, collLapsed:0,
        med:0, medWeeks:0, arm:0, armWeeks:0, staffLost:0,
        duesShare:[], tail:[] };
      let hadWar = false, hadColl = false, hadMed = false, hadArm = false;
      let medOn = false, armOn = false;
      for(; w<W; w++){
        if(d.over) break;
        R.lanista(d);
        if(!d.lanista) break;
        if(d.week > 60) r.past60++;
        /* the war, both doors */
        if(d.war){
          r.warWeeks++;
          if(!hadWar){ hadWar = true; r.war = 1; r.warAt = d.week;
            if(d.flags && d.flags.warAway) r.warAway = 1; else r.warOwn = 1; }
          const st = A.warStage ? A.warStage(d) : null;
          if(st && st.name) r.stages[st.name] = (r.stages[st.name]||0) + 1;
        }
        /* the lot on the block, and whether it could be taken */
        if(d.powLot){
          r.lot++;
          const space = (A.cellsCap ? A.cellsCap(d) : 0) - d.gladiators.filter(x=>!A.isGone(x)).length;
          if(space > 0) r.lotSpace++;
          if(space > 0 && d.gold >= d.powLot.price) r.lotAfford++;
        }
        /* the burial society, and what it costs against the week */
        if(A.collOn && A.collOn(d)){
          r.collWeeks++; if(!hadColl){ hadColl = true; r.coll = 1; }
          const du = A.collDues ? A.collDues(d) : 0, bill = A.weeklyBill(d);
          if(bill > 0){ r.duesShare.push(du/bill*100); dues.push(du); bills.push(bill); }
        }
        if(d.collegium && d.collegium.lapsed) r.collLapsed = 1;
        /* the item's own clause: could dropping the dues ever have saved a house? Keep the last
           twenty weeks of gold, so a house that dies of the ledger can be asked how short it was. */
        r.tail.push(d.gold); if(r.tail.length > 21) r.tail.shift();
        /* the two who can walk out */
        if(d.medicus){ r.medWeeks++; if(!hadMed){ hadMed = true; r.med = 1; } }
        if(d.armourer){ r.armWeeks++; if(!hadArm){ hadArm = true; r.arm = 1; } }
        if(medOn && !d.medicus) r.staffLost++;
        if(armOn && !d.armourer) r.staffLost++;
        medOn = !!d.medicus; armOn = !!d.armourer;
      }
      r.life = w;
      r.end = d.over ? d.over.kind : "alive";
      /* how fast the money was going in the last twenty weeks it had */
      r.slope = r.tail.length > 1 ? (r.tail[r.tail.length-1] - r.tail[0]) / (r.tail.length-1) : null;
      r.endGold = r.tail.length ? r.tail[r.tail.length-1] : null;
      delete r.tail;
      r.duesMean = r.duesShare.length ? r.duesShare.reduce((a,b)=>a+b,0)/r.duesShare.length : null;
      delete r.duesShare;
      rows.push(r);
    }
  }
  return { rows, H, W, PRES,
    WAR_AWAY_ODDS: A.WAR_AWAY_ODDS != null ? A.WAR_AWAY_ODDS : null,
    WAR_AWAY_AT: A.WAR_AWAY_AT != null ? A.WAR_AWAY_AT : null,
    duesMean: dues.length ? dues.reduce((a,b)=>a+b,0)/dues.length : null,
    billMean: bills.length ? bills.reduce((a,b)=>a+b,0)/bills.length : null };
}, [H, W, SEED]);

const rows = out.rows, N = rows.length;
const sum = k => rows.reduce((a,r)=>a + (r[k]||0), 0);
const share = k => (sum(k)/N*100).toFixed(1);
const med = k => { const v = rows.map(r=>r[k]).filter(x=>x!=null).sort((a,b)=>a-b);
  return v.length ? v[Math.floor(v.length/2)] : null; };

console.log(`\nWHAT A PLAYED HOUSE EVER MEETS   —   ${N} houses of ${out.W} weeks on ${out.PRES.length} seed prefixes`);
console.log(`median life ${med("life")}w · ${sum("past60")} house-weeks past week 60\n`);

console.log(`1 · THE WAR IN THE SOUTH`);
console.log(`  houses that ever saw it            ${sum("war")} of ${N}  (${share("war")}%)`);
console.log(`    by its own gate (the uprising)   ${sum("warOwn")}`);
console.log(`    as news from elsewhere           ${sum("warAway")}`);
console.log(`  house-weeks with a war running     ${sum("warWeeks")} of ${rows.reduce((a,r)=>a+r.life,0)}`);
{
  const p = out.WAR_AWAY_ODDS, at = out.WAR_AWAY_AT;
  if(p != null){
    /* the arithmetic the drive has to agree with: each house rolls once a week past `at` */
    const expect = rows.reduce((a,r)=>a + (1 - Math.pow(1-p, Math.max(0, r.past60))), 0);
    console.log(`  ARITHMETIC: at ${p} a week from week ${at}, these houses' own lifespans predict`);
    console.log(`    ${expect.toFixed(1)} of ${N} (${(expect/N*100).toFixed(1)}%) — measured ${sum("warAway")} by that door`);
    console.log(`    ${Math.abs(expect - sum("warAway")) > 2.5*Math.sqrt(Math.max(expect,1))
      ? "THE DRIVE AND THE ARITHMETIC DISAGREE — one of them is wrong" : "the drive agrees with the arithmetic"}`);
  }
}
const stages = {};
for(const r of rows) for(const k of Object.keys(r.stages)) stages[k] = (stages[k]||0) + r.stages[k];
console.log(`  stages reached (house-weeks in each): ${Object.keys(stages).length
  ? Object.entries(stages).map(([k,v])=>`${k} ${v}`).join(" · ") : "none — no house was ever in one"}`);

console.log(`\n2 · THE LEGIONS SELLING IN BULK  (\`d.powLot\`, and \`buyLot\` behind it)`);
console.log(`  house-weeks with a lot on the block   ${sum("lot")}`);
console.log(`    of those, with a cell free          ${sum("lotSpace")}`);
console.log(`    and the coin to take it             ${sum("lotAfford")}`);
console.log(`  houses that ever saw one              ${rows.filter(r=>r.lot>0).length} of ${N}`);

console.log(`\n3 · THE BURIAL SOCIETY, AND THE ONE DOOR OUT OF IT`);
console.log(`  houses that ever held it        ${sum("coll")} of ${N}  (${share("coll")}%)`);
console.log(`  house-weeks holding it          ${sum("collWeeks")}`);
console.log(`  ever lapsed                     ${sum("collLapsed")} of ${N}   (nothing in the game lapses it — the only caller is a button)`);
console.log(`  the dues against the week's bill: ${out.duesMean == null ? "never held"
  : `${out.duesMean.toFixed(0)}d of ${out.billMean.toFixed(0)}d, ${(out.duesMean/out.billMean*100).toFixed(1)}% of it`}`);
{
  /* the clause: could dropping the dues ever have saved a house that died of the ledger? */
  const dead = rows.filter(r=>r.end === "debt" && r.slope != null);
  if(!dead.length) console.log(`  no house in this run died of the ledger, so the clause is untested`);
  else {
    const sl = dead.map(r=>r.slope).sort((a,b)=>a-b);
    const m = sl[Math.floor(sl.length/2)];
    const saved = dead.filter(r=>r.slope > -(out.duesMean||0)).length;
    console.log(`  the ${dead.length} houses that died of the ledger were losing a median ${(-m).toFixed(0)}d a week`);
    console.log(`    over their last twenty; the dues are ${(out.duesMean||0).toFixed(0)}d, so dropping them`);
    console.log(`    would have turned the tide for ${saved} of ${dead.length}`);
  }
}

console.log(`\n4 · THE TWO WHO CAN WALK OUT`);
console.log(`  houses that ever had a medicus  ${sum("med")} of ${N}  · an armourer ${sum("arm")} of ${N}`);
console.log(`  house-weeks held: medicus ${sum("medWeeks")} · armourer ${sum("armWeeks")}`);
console.log(`  times one of them left          ${sum("staffLost")}`);
console.log();

await browser.close();
server.close();
