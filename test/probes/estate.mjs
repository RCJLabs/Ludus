/* WHAT DOES A GREAT HOUSE OWN THAT A NEW ONE DOES NOT?

   #131 says 97.7% of what a year-12 house is shown was available in week one, and that the fix is
   writing late content. That is a design decision, and the reason it has sat for two sessions is that
   "what should a great house be urgently asked for?" is a blank page. This probe is the raw material
   for filling it, and nothing more: it does NOT decide what to write.

   The question it answers is narrow and factual: taking the reference player to year 12, WHICH
   QUANTITIES ARE LARGE AND DISTINCTIVE THERE? A thing a great house has fifty of and a new house has
   none of is a thing the late game could plausibly be about. A thing both houses have three of is not.

   So: every quantity is measured in year 1-3 AND in year 12+, off the same houses, and sorted by the
   ratio. The ratio is the whole point — an absolute figure says a year-12 house has 8 rooms, which is
   only interesting once you know a week-one house has 0.

   WHAT THIS IS NOT. It is not a silence survey. #132 was that, and the lesson it paid for is that a
   system speaks through at least four channels (the agenda, SECT_MARK, a man's own ask, the arena
   card), so a probe that checks one of them reports whatever it expected to find. Nothing here claims
   anything is silent. It reports the SHAPE OF THE ESTATE and leaves the writing to a person.

   HOW IT COULD BE WRONG, since that is the standing hazard: a quantity that grows with the length of
   a run rather than with the house's success would look distinctive without being interesting — the
   count of men who ever died is the obvious one. Those are marked `time` in the table below, and they
   are printed rather than trusted. And a house that dies before year 12 contributes to the early
   column and not the late one, so the late column is a survivors' sample by construction; the count
   of contributing houses is printed for that reason. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const ARM = process.argv[4] || "on";
/* ---- THE ARM THAT DECIDES WHETHER THE LADDER IS THE GAME'S OR THE PLAYER'S ----
   The default lanista spends behind a 12-week reserve: it builds whenever `spare()` clears 6,000 and
   keeps the rites at 3,500 and 9,000. With a late bill near 364d that reserve is ~4,400, so it never
   banks the 15,000 the fifth rung asks — and reads "ready in every term but the coin" on 93% of late
   weeks while having held 25,249d at some point in its life. That is a fact about its spending, not
   about the ladder's pricing, and the two are only separable with a control. `miser` turns off the
   discretionary spends and asks how high the same house climbs. */
const MISER = process.argv[5] === "miser";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([H,W,ARM,MISER])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const OPTS = Object.assign(ARM === "off" ? { road:false } : {},
    MISER ? { build:false, rites:false, party:false } : {});
  const YW = A.YEAR_WEEKS || 18;
  const n = v => typeof v === "number" && isFinite(v) ? v : 0;
  const len = v => Array.isArray(v) ? v.length : (v && typeof v === "object" ? Object.keys(v).length : 0);

  /* `kind` is a note to the reader, not a filter: `time` marks a quantity that grows with weeks
     survived rather than with how well the house is doing, and those are the ones a ratio flatters. */
  const Q = [
    ["gold",               d=>n(d.gold),                                   "coin"],
    ["fame",               d=>n(d.fame),                                   "coin"],
    ["acclaim",            d=>n(d.acclaim),                                "coin"],
    ["weekly bill",        d=>n(A.weeklyBill(d)),                          "coin"],
    ["men in the yard",    d=>len(A.activeG(d)),                           "house"],
    ["men on the books",   d=>len(d.gladiators),                           "house"],
    ["rooms held",         d=>len(d.buildings),                            "house"],
    ["room levels, total", d=>Object.values(d.buildings||{}).reduce((s,v)=>s+n(v&&v.lvl!=null?v.lvl:v),0), "house"],
    ["works built",        d=>len(d.works),                                "house"],
    ["household staff",    d=>len(d.household),                            "house"],
    ["kits owned",         d=>len(d.kits),                                 "house"],
    ["gear on the shelf",  d=>len(d.gearCond),                             "house"],
    ["pieces forged",      d=>len(d.forged),                               "time"],
    ["census rung",        d=>n((d.rise||{}).rank),                        "standing"],
    ["census standing",    d=>n((d.rise||{}).standing),                    "standing"],
    ["brand tier",         d=>n((d.brand||{}).tier),                       "standing"],
    ["brand earned",       d=>n((d.brand||{}).earned),                     "time"],
    ["piety",              d=>n(d.piety),                                  "standing"],
    ["honoured",           d=>n(d.honoured),                               "time"],
    ["unrest",             d=>n(d.unrest),                                 "house"],
    ["law heat",           d=>n((d.law||{}).heat),                         "standing"],
    ["edicts standing",    d=>len((d.law||{}).edicts),                     "standing"],
    ["patrons",            d=>len(A.patronsOf(d)),                         "standing"],
    ["patron favour, sum", d=>A.patronsOf(d).reduce((s,x)=>s+n(x.favor),0),"standing"],
    ["ties",               d=>len(d.ties),                                 "time"],
    ["arcs running",       d=>len(d.arcs),                                 "house"],
    ["towns known, total", d=>Object.values(d.known||{}).reduce((s,v)=>s+n(v),0), "time"],
    ["feats earned",       d=>len(d.feats),                                "time"],
    ["men buried",         d=>len(d.fallen),                               "time"],
    ["men freed",          d=>len(d.freed),                                "time"],
    ["men retired",        d=>len(d.retired),                              "time"],
    ["unburied dead",      d=>len(d.unburied),                             "house"],
    ["debts owed",         d=>len(d.owed),                                 "house"],
    ["deadlines",          d=>len(d.deadlines),                            "house"],
    ["generation",         d=>n(d.generation),                             "time"],
    ["children",           d=>len((d.domus||{}).children),                 "time"],
    ["lanista's years",    d=>n((d.lanista||{}).age),                      "time"],
    ["rivals met",         d=>len(d.metHouse),                             "time"],
    ["rival log",          d=>len(d.rivalLog),                             "time"],
    /* `d.book.bouts` and `d.book.lines` do not exist — `newBook` calls the count `n`. Reading them
       gave 0 in both eras while the rope reported 1,851 bouts, which is the shape of a probe fault
       and not of a game with no fights in it. */
    ["bouts in the book",  d=>n((d.book||{}).n),                          "time"],
    ["bouts won",          d=>n((d.book||{}).w),                          "time"],
    ["men killed by yours",d=>n((d.book||{}).killed),                     "time"],
  ];
  /* the switched-on systems, as a share of weeks in the era rather than a count */
  const SYS = [
    ["a doctore",      d=>!!d.doctore],       ["a medicus",   d=>!!d.medicus],
    ["an armourer",    d=>!!d.armourer],      ["a doctrine",  d=>!!d.doctrine],
    ["a blessing",     d=>!!d.blessing],      ["a vow",       d=>!!d.vow],
    ["the primacy",    d=>!!A.primusMine(d)], ["a nemesis",   d=>!!d.nemesis],
    ["the collegium",  d=>!!d.collegium],     ["a war",       d=>!!d.war],
    ["an heir named",  d=>!!d.heir],          ["a wife",      d=>!!(d.domus||{}).wife],
    ["at Rome",        d=>!!d.rome],          ["a loan",      d=>!!d.loan],
    ["the aedile",     d=>!!d.aedile],        ["an election", d=>!!d.election],
    ["a court case",   d=>!!d.court],         ["a saga",      d=>!!d.saga],
    ["the bay held",   d=>!!(d.bay||{}).holder], ["a name in Capua", d=>!!d.repName],
  ];

  /* ---- THE LADDER, MEASURED RATHER THAN INFERRED ----
     The table says a year-12 house sits on rung 4 with standing 100 and 3,610d, while rung 5 asks
     fame 600 (it has ~3,800) and 15,000d. That reads like a house permanently ready and permanently
     broke — but it is an inference off two medians, and the reference player also SPENDS hard behind
     a 12-week reserve, so "never has 15,000 at once" could be its policy rather than the game's
     pricing. So ask the game's own gate, week by week, which of the four terms is actually short. */
  const ladder = { lateWeeks:0, none:0, fameShort:0, favorShort:0, goldShort:0, notFull:0,
                   readyButBroke:0, shortfalls:[], topRung:0, peakGold:0, rungAtLate:{} };

  const early = Q.map(()=>[]), late = Q.map(()=>[]);
  const sysE = SYS.map(()=>0), sysL = SYS.map(()=>0);
  let eW = 0, lW = 0, lateHouses = 0, houses = 0, aliveAtWall = 0;
  const lateSamples = [];
  for(let h=0;h<H;h++){
    const d = A.newGameState("Es"+h,"clean",`EST-${h}`,null);
    houses++;
    let sawLate = false, grabbed = false;
    for(let w=0;w<W;w++){
      if(d.over) break;
      const yr = Math.floor((d.week-1)/YW) + 1;
      const isEarly = yr <= 3, isLate = yr >= 12;
      /* ---- SNAPSHOT A LIVING HOUSE, NOT A CORPSE ----
         The first version took this after the loop, which is the state at DEATH: three houses with
         0 men and gold at -2,910, reported as "at the wall". What a great house IS is what it looks
         like the week it becomes one, so it is taken on the first week of year 12, still playing. */
      if(yr >= 12 && !grabbed && lateSamples.length < 3){
        grabbed = true;
        lateSamples.push({ h, week:d.week, fame:Math.round(d.fame), gold:Math.round(d.gold),
          men:len(A.activeG(d)), rooms:len(d.buildings), rung:n((d.rise||{}).rank),
          patrons:len(A.patronsOf(d)), feats:len(d.feats), buried:len(d.fallen),
          bouts:n((d.book||{}).n), gen:n(d.generation), name:(d.repName||{}).key || "(unnamed)" });
      }
      if(isLate){
        ladder.lateWeeks++;
        let need = null; try{ need = A.riseNeed(d); }catch(e){}
        if(!need) ladder.none++;               /* no next rung — the top of the ladder */
        else {
          if(!need.fameOk)  ladder.fameShort++;
          if(!need.favorOk) ladder.favorShort++;
          if(!need.goldOk)  ladder.goldShort++;
          if(!need.full)    ladder.notFull++;
          if(need.full && need.fameOk && need.favorOk && !need.goldOk){
            ladder.readyButBroke++;
            if(ladder.shortfalls.length < 6)
              ladder.shortfalls.push({ rung:n((d.rise||{}).rank), cost:need.cost,
                gold:Math.round(d.gold), fame:Math.round(d.fame), needFame:need.fame });
          }
        }
        const rk = n((d.rise||{}).rank);
        ladder.rungAtLate[rk] = (ladder.rungAtLate[rk]||0)+1;
      }
      ladder.topRung = Math.max(ladder.topRung, n((d.rise||{}).rank));
      ladder.peakGold = Math.max(ladder.peakGold, n(d.gold));
      if(isEarly || isLate){
        const box = isLate ? late : early;
        for(let i=0;i<Q.length;i++){ let v=0; try{ v = Q[i][1](d) || 0; }catch(e){} box[i].push(v); }
        const sbox = isLate ? sysL : sysE;
        for(let i=0;i<SYS.length;i++){ let on=false; try{ on = !!SYS[i][1](d); }catch(e){} if(on) sbox[i]++; }
        if(isLate){ lW++; if(!sawLate){ sawLate = true; lateHouses++; } } else eW++;
      }
      R.lanista(d, OPTS);
    }
    if(!d.over) aliveAtWall++;

  }
  const med = a => { if(!a.length) return 0; const s=a.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
  const rows = Q.map((q,i)=>({ name:q[0], kind:q[2], e:med(early[i]), l:med(late[i]) }));
  const sys  = SYS.map((s,i)=>({ name:s[0], e: eW?sysE[i]/eW:0, l: lW?sysL[i]/lW:0 }));
  return { rows, sys, eW, lW, houses, lateHouses, aliveAtWall, lateSamples, ladder,
    ranks:(A.RISE_RANKS||[]).map(r=>({ name:r.name, fame:r.fame||0, cost:r.cost||0 })),
    YW, H, W, rope:R.say() };
}, [H,W,ARM,MISER]);
await browser.close(); server.close();

const f = v => Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : (Math.round(v*10)/10).toString();
const ratio = (e,l) => e > 0 ? `${(l/e).toFixed(1)}x` : (l > 0 ? "new" : "-");
console.log(`=== WHAT A GREAT HOUSE OWNS ===  [road ${ARM}${MISER ? " · MISER: no rooms, no rites, no parties" : ""}]`);
console.log(`  ${out.houses} houses x up to ${out.W} weeks · ${out.lateHouses} reached year 12+ · `
  + `${out.aliveAtWall} alive at the wall`);
console.log(`  ${out.eW} week-samples in year 1-3 · ${out.lW} in year 12+ · a year is ${out.YW} weeks`);
console.log(`  THE LATE COLUMN IS A SURVIVORS' SAMPLE. Only houses that lived to year 12 are in it.\n`);
const sorted = out.rows.slice().sort((a,b)=>{
  const ra = a.e > 0 ? a.l/a.e : (a.l > 0 ? 1e6 : 0);
  const rb = b.e > 0 ? b.l/b.e : (b.l > 0 ? 1e6 : 0);
  return rb - ra;
});
console.log(`  QUANTITIES, median in each era, sorted by how much the late house has MORE of:`);
console.log(`    ${"".padEnd(22)} ${"yr 1-3".padStart(10)} ${"yr 12+".padStart(10)}   ratio   kind`);
for(const r of sorted)
  console.log(`    ${r.name.padEnd(22)} ${f(r.e).padStart(10)} ${f(r.l).padStart(10)}   `
    + `${ratio(r.e,r.l).padStart(6)}   ${r.kind}`);
console.log(`\n  `+`SYSTEMS, share of the era's weeks the house had one, sorted by the gap:`);
for(const s of out.sys.slice().sort((a,b)=>(b.l-b.e)-(a.l-a.e)))
  console.log(`    ${s.name.padEnd(22)} ${(s.e*100).toFixed(0).padStart(4)}% -> ${(s.l*100).toFixed(0).padStart(4)}%`
    + `   ${s.l-s.e >= 0 ? "+" : ""}${((s.l-s.e)*100).toFixed(0)} points`);
console.log(`\n  three whole houses the WEEK THEY REACH YEAR 12, alive — a table of medians hides what a house IS:`);
for(const s of out.lateSamples)
  console.log(`    house ${s.h}: week ${s.week} · named "${s.name}" · fame ${f(s.fame)} · ${f(s.gold)}d · ${s.men} men`
    + ` · ${s.rooms} rooms · rung ${s.rung} · ${s.patrons} patrons · ${s.feats} feats · ${s.bouts} bouts`
    + ` · ${s.buried} buried · generation ${s.gen}`);
console.log(`\n  A ZERO IN BOTH COLUMNS IS THE REFERENCE PLAYER'S POLICY, NOT THE GAME'S CONTENT.`);
console.log(`  It never saves a kit, never builds a work or a monument, and \`free\` is opt-in, so kits,`);
console.log(`  works, freed and retired read 0 at both ends. Those are facts about the rope. Everything`);
console.log(`  else in the table is a fact about a house that played 420 weeks the way this suite plays.`);
const L = out.ladder;
const lp = v => L.lateWeeks ? `${Math.round(v/L.lateWeeks*100)}%` : "-";
console.log(`\n  THE CENSUS LADDER IN YEAR 12+, asked of the game's own gate (\`riseNeed\`) each week:`);
console.log(`    ${L.lateWeeks} late weeks · highest rung any house ever stood on ${L.topRung} of ${out.ranks.length-1}`
  + ` · most gold any house ever held at once ${Math.round(L.peakGold).toLocaleString()}d`);
console.log(`    at the top of the ladder, nothing left to claim   ${L.none}  (${lp(L.none)})`);
console.log(`    standing not yet full                             ${L.notFull}  (${lp(L.notFull)})`);
console.log(`    short of the FAME the next rung asks              ${L.fameShort}  (${lp(L.fameShort)})`);
console.log(`    short of the FAVOUR the next rung asks            ${L.favorShort}  (${lp(L.favorShort)})`);
console.log(`    short of the COIN the next rung asks              ${L.goldShort}  (${lp(L.goldShort)})`);
console.log(`    READY IN EVERY TERM BUT THE COIN                  ${L.readyButBroke}  (${lp(L.readyButBroke)})`);
console.log(`    weeks spent on each rung: ` + Object.entries(L.rungAtLate).sort((a,b)=>a[0]-b[0])
  .map(([k,v])=>`rung ${k}: ${v}`).join(" · "));
console.log(`    the ladder as priced: ` + out.ranks.map((r,i)=>`${i}:${r.name} (fame ${r.fame}, ${r.cost}d)`).join(" · "));
if(L.shortfalls.length){
  console.log(`    and the raw material, six weeks where it was ready and broke:`);
  for(const x of L.shortfalls)
    console.log(`      on rung ${x.rung}, next asks fame ${x.needFame} and ${x.cost.toLocaleString()}d`
      + ` — the house had fame ${x.fame.toLocaleString()} and ${x.gold.toLocaleString()}d`);
}
console.log(`\n  rope: ${out.rope}`);
