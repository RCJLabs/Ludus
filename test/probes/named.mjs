/* THE NAMED ENEMY, AND HOW HE ACTUALLY LEAVES — the nemesis-churn seam, asked as its own question

   `keep.mjs` counted the fighter-nemesis (`d.nemesis` — a man of another house the cells have named,
   NOT `d.nemHouse`, #134's arch-rival house) arriving and leaving 832 times over 13,678 house-weeks:
   once every 16 weeks, by far the most churning thing in the game. Nothing has asked whether that rate
   is right, and the rate on its own cannot say — what decides it is HOW an episode ends.

   The file gives a nemesis exactly one designed payoff: `nemesisSettled`, your man beating or killing
   him on the sand, worth +11/18 morale to every man, -4/7 unrest, +12/22 fame and a chronicle line. And
   one silent exit at ludus.jsx:10009 — `if(!still){ d.nemesis = null; return; }` — the moment the man
   is no longer on his own house's roster, the nemesis evaporates with NO line, NO payoff, nothing. Plus
   assorted clears (his house folds, you buy him, he dies elsewhere). So the question with a decision
   behind it: of the episodes a house lives through, how many end on the sand, and how many just
   evaporate? A named enemy who is mostly unmade by someone else's roster churn is not a named enemy.

   FIXED IN v3.28.0, and this probe now measures the repaired world (the quiet.mjs lesson: decide at
   writing time what a fault-probe should say once the fault is gone). Post-fix expectations, measured
   on two seeds: one episode per 47-60 weeks, sand 36-38%, told 32-38%, replaced 25-30%, silent 0-1%.
   A "replaced" ending is a hated man taking the title — a handover with its own chronicle line, split
   out below so the fix is not measured against a bar it should pass. If silent climbs back past a few
   percent, the lookup has regressed; the `named` CHECK holds the rule.

   ATTRIBUTION, and why it can be trusted:
   · the settled end is detected off the chronicle AT THE WEEK IT HAPPENS — `nemesisSettled`'s two
     lines verbatim ("is dead on your sand" / "was beaten in front of everyone"). The log rolls at
     LOG_ROLL, but this reads the head the same week the line was written, so the roll cannot eat it
     (the fires.mjs counter fault was counting a WHOLE RUN off the rolled log; this is not that).
   · the silent end is cross-checked against its own mechanism: at the vanish week the rival house is
     looked up and the fid searched — `still` recomputed, the game's own test. The two must agree with
     the residue of the other causes; all three columns are printed per episode in the raw sample.
   · durations carry censoring the keep.mjs way: an episode open when the house dies is printed as
     open, not counted as ended. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 72), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "NEMF";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const eps = [];                    /* every episode: since, end, cause, hated, house */
  let weeks = 0, hatedWeeks = 0, liveWeeks = 0, metOnCard = 0, cardWeeks = 0;
  for(let h=0; h<H; h++){
    const d = A.newGameState("Nf"+h, "clean", `${SEED}-${h}`, null);
    let cur = null;                  /* the running episode: {since, hated, house, fid, name} */
    for(let w=0; w<W; w++){
      if(d.over) break;
      R.lanista(d);
      weeks++;
      const n = d.nemesis;
      if(cur && (!n || n.fid !== cur.fid)){
        /* the episode ended this week (or was replaced by a hated one) — attribute it.
           The PLAYER-FACING split is the load-bearing one: did it end on the sand (the designed
           payoff), with a line in the chronicle naming him (he died elsewhere, was freed, left the
           circuit), or in silence — the panel simply empty next week. The mechanical columns are
           diagnostics for naming the silent channel and are printed, not summarised. */
        const wkLines = (d.log||[]).filter(L=>L.week>=d.week-1);
        const settled = wkLines.some(L=>L.text.includes("is dead on your sand") || L.text.includes("was beaten in front of everyone"));
        const told = wkLines.some(L=>L.text.includes(cur.name));
        const sameName = (d.rivals||[]).filter(x=>x.name===cur.house);
        const hh = sameName[0];
        const still = hh && !hh.retired && hh.fighters.some(f=>f.id===cur.fid);
        /* "replaced" is its own player-facing ending, split out after the #137 fix made it common:
           a hated man takes the title and the panel switches to a NEW named enemy with its own
           chronicle line. The player sees a handover, not an absence — conflating it with silence
           would fail the fix against a bar it should pass. */
        const cause = settled ? "sand" : told ? "told" : n ? "replaced" : "silent";
        const mech = !hh ? "houseGone" : hh.retired ? "houseRetired" : !still ? "offRoster" : "onRoster";
        eps.push({ h, since:cur.since, end:d.week, dur:d.week-cur.since, hated:cur.hated, cause, mech,
          dupHouses: sameName.length, away: hh ? (hh.away||0) : -1, war: !!d.war,
          name:cur.name, house:cur.house, replaced: !!n });
        /* the first run of this probe left `cur` standing after the push, so one finished episode
           was re-booked every week for the rest of the run — 8,057 "episodes" at one per 1.5 weeks
           against keep.mjs's one per 16. The raw sample table is what caught it: the same man, the
           same since-week, an end-week counting up by one. An episode is CLOSED here. */
        cur = null;
      }
      if(n && !cur) cur = { since:n.since, hated:n.hated, house:n.house, fid:n.fid, name:n.name };
      if(n){ liveWeeks++; if(n.hated) hatedWeeks++; cur.hated = n.hated;
        const offers = ((d.games||{}).offers)||[];
        if(offers.length){ cardWeeks++; if(offers.some(o=>o.opp && o.opp.name===n.name)) metOnCard++; }
      }
      if(d.over) break;
    }
    if(cur && d.nemesis && d.nemesis.fid===cur.fid)
      eps.push({ h, since:cur.since, end:null, dur:d.week-cur.since, hated:cur.hated, cause:"openAtDeath",
        name:cur.name, house:cur.house, replaced:false });
    if(cur && !d.nemesis) cur = null;
  }
  return { eps, weeks, hatedWeeks, liveWeeks, metOnCard, cardWeeks };
}, [H, W, SEED]);

const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };
const done = out.eps.filter(e=>e.end != null);
console.log(`\n${H} houses x ${W}w · seed "${SEED}" · ${out.eps.length} episodes over ${out.weeks} house-weeks (one per ${(out.weeks/Math.max(1,out.eps.length)).toFixed(1)}w)`);
console.log(`a nemesis stood in ${out.liveWeeks} weeks (${(out.liveWeeks/out.weeks*100).toFixed(0)}%), hated in ${out.hatedWeeks}`);
console.log(`while one stood and a card was up, he was ON the card ${out.metOnCard} of ${out.cardWeeks} card-weeks (${(out.metOnCard/Math.max(1,out.cardWeeks)*100).toFixed(0)}%)\n`);

console.log(`  HOW AN EPISODE ENDS, as the player sees it — the whole question:`);
const byCause = {};
for(const e of done) byCause[e.cause] = byCause[e.cause] || [];
for(const e of done) byCause[e.cause].push(e.dur);
for(const [c,v] of Object.entries(byCause).sort((a,b)=>b[1].length-a[1].length))
  console.log(`    ${c.padEnd(14)} ${String(v.length).padStart(4)} of ${done.length}  (${(v.length/done.length*100).toFixed(0)}%)   median ${med(v)}w, range ${Math.min(...v)}-${Math.max(...v)}w`);
const open_ = out.eps.filter(e=>e.end == null);
console.log(`    ${"openAtDeath".padEnd(14)} ${String(open_.length).padStart(4)} censored — not counted above`);

console.log(`\n  THE MECHANISM UNDER THE SILENT ONES — state at the vanish week, with diagnostics:`);
const sil = done.filter(e=>e.cause==="silent");
const byMech = {};
for(const e of sil) (byMech[e.mech] = byMech[e.mech] || []).push(e);
for(const [m,v] of Object.entries(byMech).sort((a,b)=>b[1].length-a[1].length))
  console.log(`    ${m.padEnd(13)} ${String(v.length).padStart(4)}   dupHouses>1: ${v.filter(x=>x.dupHouses>1).length} · away: ${v.filter(x=>x.away>0).length} · war: ${v.filter(x=>x.war).length} · replacedSameWk: ${v.filter(x=>x.replaced).length}`);

console.log(`\n  RAW SAMPLE, first 25 finished episodes — so the attribution can be read rather than trusted:`);
console.log(`    house  since  end   dur  hated  cause    mech          dup away  name / house`);
for(const e of done.slice(0,25))
  console.log(`    ${String(e.h).padStart(4)}  ${String(e.since).padStart(5)} ${String(e.end).padStart(5)} ${String(e.dur).padStart(4)}  ${String(!!e.hated).padEnd(5)}  ${e.cause.padEnd(7)}  ${e.mech.padEnd(12)}  ${String(e.dupHouses).padStart(3)} ${String(e.away).padStart(4)}  ${e.name} / ${e.house}`);

await browser.close(); server.close();
