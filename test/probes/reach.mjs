/* DOES THE THING I JUST SHIPPED EVER HAPPEN?

   v3.27.0 added the first loss a great house can suffer — a patron held for years dies. Every figure
   in that release is about whether the loss is CORRECT: the mean moves on the replacement, the gate
   is late, the last patron is safe, the 120-week gap holds. Not one of them is about whether a player
   ever sees it. `patron` builds the state by hand — it sets `lanista.age` to `PATRON_AGE + 5` and the
   week to `1 + PATRON_HELD` — so it would pass identically if the gate were unreachable in play.

   That is the standing hazard's shape exactly: content proved correct on a hand-built save and never
   once observed on a played one. `ends` measures 67-69% of houses dead inside 400 weeks, and the gate
   wants the lanista at 50 — `ri(34,46)` at the founding, +1 every YEAR_WEEKS=18 — so between 72 and
   288 weeks of survival, median about 180.

   So: play houses and COUNT. Not "can it fire" — `patron` answers that. How many houses live long
   enough, how many of those actually see it, and how many weeks of play stand between a new house and
   the first thing it can lose.

   ---- TWO INSTRUMENT NOTES, BOTH OF WHICH BIT AN EARLIER DRAFT ----
   · The chronicle is NOT a counter. `chron` unshifts into `d.log`, which rolls at LOG_ROLL and spills
     into a `d.kept` that is also capped, so counting death lines over 420 weeks undercounts silently
     and the undercount grows with the length of the run — the exact denominator fault the brief warns
     about. `d.flags.patronDied` is stamped by `run` every single time and never rolls.
   · `make` is a pure read — it returns an object or null and mutates nothing — so asking the gate its
     state every week costs the run nothing. `run` is the only mutator and only the rope calls it. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const rows = [];
  for(let h=0; h<H; h++){
    const d = A.newGameState("Rc"+h, "clean", `REACH-${h}`, null);
    const startAge = d.lanista ? d.lanista.age : null;
    let firstOpen = null, fired = null, deaths = 0, lastStamp = null, ageAt50 = null;
    for(let w=0; w<W; w++){
      if(d.over) break;
      if(ageAt50 == null && d.lanista && d.lanista.age >= A.PATRON_AGE) ageAt50 = d.week;
      if(firstOpen == null && A.EVENTS.patronGone.make(d)) firstOpen = d.week;
      R.lanista(d);
      const stamp = d.flags ? d.flags.patronDied : null;
      if(stamp != null && stamp !== lastStamp){
        deaths++; if(fired == null) fired = stamp; lastStamp = stamp;
      }
    }
    rows.push({ h, startAge, endAge: d.lanista ? d.lanista.age : null, ageAt50,
      lived: d.week, over: d.over ? d.over.kind : null, firstOpen, fired, deaths,
      patrons: A.patronsOf(d).length, favor: Math.round(d.favor||0), fame: Math.round(d.fame||0) });
  }
  return { rows, PATRON_AGE:A.PATRON_AGE, PATRON_HELD:A.PATRON_HELD,
    PATRON_GAP:A.PATRON_GAP, YW:A.YEAR_WEEKS || 18 };
}, [H, W]);

const R = out.rows;
const med = a => { const s=a.slice().sort((x,y)=>x-y); return s.length ? s[Math.floor(s.length/2)] : "-"; };
const rng = a => a.length ? `${Math.min(...a)}-${Math.max(...a)}` : "-";
const alive   = R.filter(r=>!r.over);
const reached = R.filter(r=>r.ageAt50 != null);
const opened  = R.filter(r=>r.firstOpen != null);
const saw     = R.filter(r=>r.fired != null);
const pc = n => `${Math.round(n/R.length*100)}%`;

console.log(`\n${H} houses x ${W}w of the reference player · PATRON_AGE ${out.PATRON_AGE}, held `
  + `${out.PATRON_HELD}w, gap ${out.PATRON_GAP}w, a year is ${out.YW}w\n`);
console.log(`  still up at ${W}w                 ${String(alive.length).padStart(2)} of ${R.length}  ${pc(alive.length)}`);
console.log(`  lanista ever reached ${out.PATRON_AGE}         ${String(reached.length).padStart(2)} of ${R.length}  ${pc(reached.length)}`
  + (reached.length ? `   at week ${med(reached.map(r=>r.ageAt50))} median (${rng(reached.map(r=>r.ageAt50))})` : ""));
console.log(`  the gate ever OPENED            ${String(opened.length).padStart(2)} of ${R.length}  ${pc(opened.length)}`
  + (opened.length ? `   at week ${med(opened.map(r=>r.firstOpen))} median (${rng(opened.map(r=>r.firstOpen))})` : ""));
console.log(`  a patron actually DIED          ${String(saw.length).padStart(2)} of ${R.length}  ${pc(saw.length)}`
  + (saw.length ? `   at week ${med(saw.map(r=>r.fired))} median (${rng(saw.map(r=>r.fired))})` : ""));
console.log(`  deaths per house that saw one   ${saw.length ? `${med(saw.map(r=>r.deaths))} median (${rng(saw.map(r=>r.deaths))})` : "-"}`);
console.log(`  weeks lived, all houses         ${med(R.map(r=>r.lived))} median (${rng(R.map(r=>r.lived))})\n`);

console.log(`  house  start  end  lived  ending           age50   gate    died  n  favour   fame`);
for(const r of R)
  console.log(`  ${String(r.h).padStart(4)}  ${String(r.startAge).padStart(5)}  ${String(r.endAge).padStart(3)}`
    + `  ${String(r.lived).padStart(5)}  ${String(r.over||"still up").padEnd(15)} `
    + `${String(r.ageAt50 ?? "-").padStart(5)}  ${String(r.firstOpen ?? "-").padStart(5)}`
    + `  ${String(r.fired ?? "-").padStart(6)} ${String(r.deaths).padStart(2)}`
    + `  ${String(r.favor).padStart(6)} ${String(r.fame).padStart(6)}`);

await browser.close(); server.close();
