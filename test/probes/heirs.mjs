/* THE SECOND GENERATION, AND WHETHER ANYBODY EVER REACHES IT

   The survey that generated the #207-#231 audit reports `succession: 0` — no house in 3,293 played
   weeks ever handed the ludus on. That counter is `sum(d.forebears.length)` and it has a real write
   site, so the zero is not the instrument's.

   THIS HAS BEEN FOUND ONCE BEFORE AND FIXED. The note at `lanistaWeek` line ~11730 records it in as
   many words: "was raised 0 times, 24 of 24 ended with an heir standing there unused and 11 of 24
   ended at `oldAge` itself. `succeed`, `takeUpTheHouse`, the forebear record and the whole second
   generation were unreachable in ordinary play, by arithmetic rather than by bad luck." The fix made
   RETIREMENT raise the same succession that death does, so there would be two doors instead of one.

   There are two doors and this asks whether either of them opens:

       retirement   L.age >= 62 && L.health >= 45 && d.heir && yearOf(d) >= 6 && R() < 0.06
       death        L.health <= 0, with an heir named

   And the arithmetic that prompted this: `makeLanista` starts him at `ri(34,46)`, so reaching 62
   takes 16 to 28 YEARS — 288 to 504 weeks at 18 a year — against a median house that dies around
   week 206. Health starts at `ri(78,92)`, mends +0.06 a week, and is eaten by age past 42, by unrest
   over 60, and by a rebellion at stage 2.

     1 · HOW OLD HE GETS, and how healthy, over a played campaign — the two gate terms, tracked.
     2 · WHICH DOOR EVER OPENS, and how many campaigns reach either.
     3 · AND WHETHER AN HEIR IS EVEN STANDING THERE when it does — `d.heir` must be named, which is
         the player's own act, so this runs an arm that names one the moment it can.

   Run: node test/probes/heirs.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 520);
const SEED = process.argv[4] || "HEIRS";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  /* THE SECOND ARM WAS INERT AND SAID SO. It named an heir the moment it could — and the rope
     already does that (an heir stood named on 3,073 of 3,075 weeks), so the two arms came back
     identical to the digit. Replaced with the question that actually decides a fix: if the lanista
     DOES reach the age, does the door open and does the handover work? He is started at 58. */
  const arm = (label, old) => {
    const rows = [];
    let succ = 0, retired = 0, died = 0, heirWeeks = 0, gateWeeks = 0, ageOK = 0, weeks = 0;
    for(let h=0; h<H; h++){
      const d = A.newGameState("Hr"+h, "capua", `${SEED}-${h}`);
      if(old && d.lanista) d.lanista.age = 58;
      const row = { h, endAge:0, peakAge:0, minHealth:100, endHealth:0, heir:null, succ:0, end:0 };
      for(let w=0; w<W && !d.over; w++){
        try { R.lanista(d, {}); } catch(e){ break; }
        weeks++;
        const L = d.lanista;
        if(L){ row.peakAge = Math.max(row.peakAge, L.age||0);
          row.minHealth = Math.min(row.minHealth, L.health==null?100:L.health);
          if((L.age||0) >= 62) ageOK++;
          if(d.heir){ heirWeeks++;
            if((L.age||0) >= 62 && (L.health||0) >= 45 && (Math.floor((d.week-1)/18)+1) >= 6) gateWeeks++; }
        }
        if(d.heir && !row.heir) row.heir = d.heir.kind;
        if((d.forebears||[]).length > row.succ){ row.succ = d.forebears.length; }
      }
      const L = d.lanista;
      row.endAge = L ? L.age : 0; row.endHealth = L ? Math.round(L.health) : 0; row.end = d.week;
      if(row.succ) succ++;
      rows.push(row);
    }
    return { label, rows, succ, weeks, heirWeeks, gateWeeks, ageOK };
  };
  return { arms: [arm("reference", false), arm("a lanista who starts at 58", true)],
    start: { age:"ri(34,46)", health:"ri(78,92)" } };
}, [H, W, SEED]);

const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length?v[Math.floor(v.length/2)]:0; };
for(const A2 of out.arms){
  const R2 = A2.rows, n = R2.length;
  console.log(`\n######## ARM: ${A2.label} (${n} houses x up to ${W} weeks, ${A2.weeks} played) ########`);
  console.log(`  the lanista's age at the end:  p50 ${med(R2.map(r=>r.endAge))} · max ${Math.max(...R2.map(r=>r.peakAge))} — the retirement door wants 62`);
  console.log(`  his lowest health ever:        p50 ${med(R2.map(r=>r.minHealth))} · min ${Math.min(...R2.map(r=>r.minHealth))} — the death door wants 0`);
  console.log(`  house lasted:                  p50 week ${med(R2.map(r=>r.end))} · max ${Math.max(...R2.map(r=>r.end))}`);
  console.log(`  weeks with an heir named:      ${A2.heirWeeks} of ${A2.weeks}  ·  weeks he was 62+: ${A2.ageOK}`);
  console.log(`  weeks the retirement gate's terms ALL held (bar the 6% roll): ${A2.gateWeeks}`);
  console.log(`    → expected retirements at 6%: ${(A2.gateWeeks*0.06).toFixed(2)}`);
  console.log(`  HOUSES THAT EVER SUCCEEDED:    ${A2.succ} of ${n}`);
  const kinds = {}; for(const r of R2) kinds[r.heir||"(none)"] = (kinds[r.heir||"(none)"]||0)+1;
  console.log(`  heirs named, by kind: ${Object.entries(kinds).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
}
console.log("");
await browser.close(); server.close();
