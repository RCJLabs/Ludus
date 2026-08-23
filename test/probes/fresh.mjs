/* WHICH ROWS NEVER GROW OLD, AND WHICH ARE OLD THE WHOLE TIME?

   `agendaTop` is what the player sees before he asks for the rest:

       agendaTop = list.filter(a => a.urgency >= 3 || a.age <= AG_FRESH)      // AG_FRESH = 3

   so a row is on screen because it is URGENT or because it is NEW, and "new" is decided by
   `agId(a)` — the row's declared `key` if it has one, else its label with the digits knocked out.

   #144 found one row exempt from the whole system: the pit line's label carries a rotating proper
   noun, `agKey` normalises digits and nothing else, so the identity changed every four weeks and the
   age reset to 0 before it could ever pass the bar. Measured then: shown on 1,493 of 1,493 weeks,
   age never once above 3, while every other item read age>3 on 9,431 of 17,645 readings. It was
   fixed by giving that one row a stable `key`. NOBODY HAS EVER SWEPT FOR THE OTHERS.

   Two faults live at the two ends of the same scale and this counts both:

     PERMANENTLY FRESH   many readings, max age <= 3. The identity is rotating under it, so the
                         freshness bar never applies and the row is on screen for ever.
     PERMANENT FURNITURE many readings, never urgent, aged out on nearly all of them. The row is in
                         the list and almost never on the screen — content the player owns and is
                         not shown. (`silent.mjs` reports the bay named on 100% of its live weeks
                         and never urgent; whether that reaches the SCREEN is this column.)

   Every row is read straight off `agendaRanked`, which is the function the panel calls, and the
   distinct labels seen under one identity are printed — a rotating noun is visible as a label count
   far above 1 rather than having to be guessed at from the source.
*/
import { serve, open, found, clearAll, installRope, inside } from "../harness.mjs";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "FRESH";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W, SEED]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  const rows = {};           /* identity -> tally */
  let weeks = 0, readings = 0, shownTotal = 0, houses = 0, emptyTop = 0;
  const topSize = [];
  for(let h=0; h<H; h++){
    const d = A.newGameState("Fresh","clean",SEED+"-"+h, null); houses++;
    for(let w=0; w<W && !d.over; w++){
      R.lanista(d);
      let list = [];
      try { list = A.agendaRanked(d) || []; } catch(e){ continue; }
      weeks++;
      let shown = 0;
      for(const a of list){
        const id = A.agId(a);
        const t = rows[id] || (rows[id] = { id, n:0, maxAge:0, old:0, urgent:0, shown:0,
                                            labels:{}, urgSum:0, tabs:{}, byUrg:0, byFresh:0 });
        t.n++; readings++;
        const age = a.age || 0;
        if(age > t.maxAge) t.maxAge = age;
        if(age > 3) t.old++;
        if((a.urgency||0) >= 3) t.urgent++;
        t.urgSum += (a.urgency||0);
        if((a.urgency||0) >= 3 || age <= 3){ t.shown++; shown++;
          if((a.urgency||0) >= 3) t.byUrg++; else t.byFresh++; }
        t.labels[String(a.label||"")] = (t.labels[String(a.label||"")]||0)+1;
        if(a.tab) t.tabs[String(a.tab).split(":")[0]] = 1;
      }
      shownTotal += shown; topSize.push(shown);
      if(!shown) emptyTop++;
    }
  }
  return { rows, weeks, readings, shownTotal, houses, emptyTop,
           topSize: topSize.sort((a,b)=>a-b), rope:R.say() };
}, [H, W, SEED]);

await browser.close(); server.close();

const rows = Object.values(out.rows).sort((a,b)=>b.n - a.n);
const pct = (a,b) => b ? (a/b*100).toFixed(1) : "0.0";
const med = out.topSize.length ? out.topSize[Math.floor(out.topSize.length/2)] : 0;
console.log(`=== THE WEEK'S LIST, AGED — ${out.houses} houses, ${out.weeks} house-weeks, ${out.readings} row-readings`);
console.log(`  ${out.shownTotal} of ${out.readings} readings pass agendaTop (${pct(out.shownTotal,out.readings)}%) · median ${med} rows on screen a week · ${out.emptyTop} weeks with an EMPTY top\n`);
console.log(`  ${"identity".padEnd(50)} ${"seen".padStart(6)} ${"maxAge".padStart(7)} ${"age>3".padStart(7)} ${"urgent".padStart(7)} ${"shown".padStart(7)} labels`);
for(const t of rows){
  if(t.n < 40) continue;
  const nl = Object.keys(t.labels).length;
  console.log(`  ${t.id.slice(0,50).padEnd(50)} ${String(t.n).padStart(6)} ${String(t.maxAge).padStart(7)} ${pct(t.old,t.n).padStart(7)} ${pct(t.urgent,t.n).padStart(7)} ${pct(t.shown,t.n).padStart(7)} ${nl}`);
}
const U = rows.reduce((s,t)=>s+t.byUrg,0), F = rows.reduce((s,t)=>s+t.byFresh,0);
console.log(`\n  of the ${U+F} readings on screen, ${U} are there because they are URGENT and ${F} because they are NEW (${pct(F,U+F)}%)`);
const busy = rows.filter(t=>t.n >= 60);
const everFresh = busy.filter(t=>t.maxAge <= 3);
const furniture = busy.filter(t=>t.urgent === 0 && t.old/t.n > 0.9);
console.log(`\n=== PERMANENTLY FRESH — an identity that rotates under the row, so the freshness bar never applies`);
if(!everFresh.length) console.log("  none of the busy rows (>=60 readings). #144's fix is holding.");
for(const t of everFresh) console.log(`  ${t.id.slice(0,54).padEnd(54)} ${t.n} readings · max age ${t.maxAge} · shown ${pct(t.shown,t.n)}% · ${Object.keys(t.labels).length} distinct labels
      e.g. ${Object.keys(t.labels).slice(0,2).join("  |  ")}`);
console.log(`\n=== PERMANENT FURNITURE — never urgent, aged out of the screen on >90% of readings`);
if(!furniture.length) console.log("  none.");
for(const t of furniture) console.log(`  ${t.id.slice(0,54).padEnd(54)} ${t.n} readings · shown ${pct(t.shown,t.n)}% · mean urgency ${(t.urgSum/t.n).toFixed(2)} · tabs ${Object.keys(t.tabs).join(",")}`);
console.log(`\n  rope: ${out.rope}`);
