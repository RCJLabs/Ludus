/* WHICH SECTIONS ARE WORTH OPENING, AND WHICH HAVE NO WAY OF KNOWING — the navigation overhaul

   The plan is to reorganise the tabs by WHEN a thing is done rather than WHAT it is about, with the
   most-used sections first inside each phase. The second half needs a frequency, and this project
   has no players to watch — so the honest proxy is the game's own predicates.

   `SECT_LIVE` is a table of eleven keys, each a test for "is this section's opportunity live". Its
   own head already records the trap, from #101 seen for the third time: **availability alone is lit
   on 47 to 97% of weeks, which is wallpaper.** What actually opens a section is `sectFresh` — live
   AND young, where `secAge` counts the consecutive weeks an opportunity has stood unanswered and
   `SEC_FRESH` is three. So this counts BOTH, because the gap between them is the point: a section
   live 90% of weeks and fresh on 4% is a section that should never have been a standing panel.

   AND THE LARGER FINDING IS THE DENOMINATOR. `sweep` counts about thirty-two sections across the ten
   faces. `SECT_LIVE` has eleven keys. **The other twenty-odd have no liveness predicate at all** —
   nothing in the game knows whether they are worth opening this week, so a frequency-ordered design
   has no signal for them and would be sorting them by taste. Naming them is half the value here.

   It reads the game's own tables rather than reconstructing them: SECT_KEYS, sectLive, sectFresh and
   secAge all come off the handle. The audit's lesson was that a counter keeping its own books tests
   the bookkeeping — `d.poachedIn` was a field invented in a probe and could only ever return zero.

   Usage: node test/probes/sections.mjs [houses per prefix] [weeks] [seed]
*/
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420), SEED = process.argv[4] || "SEC";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const PRES = [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`];
  const KEYS = A.SECT_KEYS || [];
  const live = {}, fresh = {}, undef = {}, ageSum = {}, ageN = {};
  for(const k of KEYS){ live[k]=0; fresh[k]=0; undef[k]=0; ageSum[k]=0; ageN[k]=0; }
  let weeks = 0, houses = 0;

  for(const pre of PRES){
    for(let h=0; h<H; h++){
      const d = A.newGameState("Se"+h, "clean", `${pre}-${h}`, null);
      houses++;
      for(let w=0; w<W; w++){
        if(d.over) break;
        R.lanista(d);
        if(!d.lanista) break;
        weeks++;
        for(const k of KEYS){
          const L = A.sectLive(d, k);
          if(L === undefined){ undef[k]++; continue; }
          if(L){ live[k]++;
            const a = A.secAge(d, k);
            ageSum[k] += a; ageN[k]++; }
          if(A.sectFresh(d, k)) fresh[k]++;
        }
      }
    }
  }
  return { KEYS, live, fresh, undef, ageSum, ageN, weeks, houses,
           SEC_FRESH: A.SEC_FRESH != null ? A.SEC_FRESH : null };
}, [H, W, SEED]);

const { KEYS, live, fresh, weeks } = out;
console.log(`\nWHICH SECTIONS ARE WORTH OPENING`);
console.log(`${out.houses} houses over ${weeks} house-weeks · a section is FRESH when its opportunity is live and under ${out.SEC_FRESH} weeks old\n`);
console.log(`  section       live        fresh       the gap — how much of "available" is wallpaper`);
const rows = KEYS.map(k => ({ k, l: live[k]/weeks*100, f: fresh[k]/weeks*100,
  age: out.ageN[k] ? out.ageSum[k]/out.ageN[k] : null }))
  .sort((a,b) => b.f - a.f);
for(const r of rows)
  console.log(`  ${r.k.padEnd(12)} ${r.l.toFixed(1).padStart(6)}%     ${r.f.toFixed(1).padStart(6)}%`
    + `      ${r.l > 0 ? `${(r.l - r.f).toFixed(1)} points standing but stale` : "never live at all"}`
    + (r.age != null ? `  · mean age ${r.age.toFixed(1)}w` : ""));

const loud = rows.filter(r => r.f >= 10), quiet = rows.filter(r => r.f < 1);
console.log(`\n  fresh on 10% of weeks or more: ${loud.length ? loud.map(r=>`${r.k} (${r.f.toFixed(0)}%)`).join(" · ") : "none"}`);
console.log(`  fresh on under 1%:             ${quiet.length ? quiet.map(r=>`${r.k} (${r.f.toFixed(1)}%)`).join(" · ") : "none"}`);
console.log(`\n  — the first row is what a week-phase design should surface; the last is what should be`);
console.log(`    behind something, whatever the phase model turns out to be.`);
console.log(`\n  AND THE DENOMINATOR: \`sweep\` counts about 32 sections across the ten faces.`);
console.log(`  \`SECT_LIVE\` has ${KEYS.length}. The other ~${32 - KEYS.length} have no liveness predicate at all —`);
console.log(`  nothing in the game knows whether they are worth opening, so ordering them by`);
console.log(`  frequency is not available and any such ordering would be taste wearing a number.`);
console.log();

await browser.close();
server.close();
