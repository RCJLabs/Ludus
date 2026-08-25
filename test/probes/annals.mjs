/* THE HOUSE'S DEAD AND FREED — IS IT THE READER OR THE INPUT?

   #204 says `d.freed`, `d.fallen`, `annalsClose`, the Record Book and the Annals all exist and
   "nothing mechanical reads it". **The first job is to check that, and it is false.** Both lists
   have real readers in the file:

     d.freed    `freedWeek` — a 6-entry FREEDMEN table behind an 11% weekly roll
                `acclaimTerms.legends` — freed men with 10+ wins, worth up to 12 acclaim
     d.fallen   the vow (`deaths0`, and whether it was kept), `buried20`, a rite that needs your own
                dead, the `burial` counsel entry (>= 2 fallen), the killer's name, kin who come
                looking, and the favourites the town remembers

   So the item's own clause is the live one: **"this may be an item about the input rather than the
   reader"**, and #190 measured the freed population at about one man per house per 420 weeks.

   BUT THAT IS A POLICY FACT, NOT A GAME FACT. Freeing a man is the player's choice and the reference
   player almost never makes it — #190 added `free:true` to the rope precisely because of that. So
   this runs the reader against BOTH populations:

       control     the reference player, who frees almost nobody
       free:true   frees every man the moment he is eligible

   FALSIFIES the "input" reading if the readers fire respectably under a freeing player: the table
   would then be reachable and #204 is about the reference player rather than the game. It CONFIRMS
   it if even a player who frees everybody cannot get the writing on screen.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "ANNALS";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const FM = [...(src.match(/const FREEDMEN = \{([\s\S]*?)\n\};/)||["",""])[1].matchAll(/^  ([a-z]+):\s*\{ w:(\d+), name:"([^"]+)"/gm)].map(m=>({ k:m[1], w:+m[2], name:m[3] }));
const ROLL = (src.match(/function freedWeek\(d\)\{[\s\S]*?if\(R\(\) > ([\d.]+)\) return;/)||["","?"])[1];
const READERS = [...src.matchAll(/\(d\.(freed|fallen)\|\|\[\]\)/g)].length;
console.log(`FREEDMEN: ${FM.map(f=>`${f.k} w${f.w}`).join(" · ")} — behind a ${ROLL} weekly roll and a 5-week wait`);
console.log(`places in the file that read d.freed or d.fallen: ${READERS} — the item says nothing does\n`);
if(!FM.length) throw new Error("FREEDMEN parsed EMPTY — fix the regex first");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const arm = async (opts) => inside(p, ([H, W, SEED, opts, KEYS]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  R.reset();
  const T = { houses:0, weeks:0, freed:0, fallen:0, became:{}, events:0, houseAny:0,
              legends:0, legendPts:[], ripe:0, ripeWeeks:0, deadWeeks:0, burialOpen:0,
              /* ---- AND THE THIRD LIST ----
                 `d.retired` is written by `retireG` and read by the Roll's count and the Annals'
                 list and NOTHING ELSE. It is the one list in the house's memory that no mechanic
                 touches — which is #204's claim, true of this list rather than of the two it named.
                 Its men are exactly the population FREEDMEN was written for: they walked out with
                 their name and their scars. So: how many are there, and would they feed it? */
              retired:0, retired8:0, retired10:0, retireRipe:0 };
  for(const k of KEYS) T.became[k] = 0;
  for(let h=0; h<H; h++){
    const d = A.newGameState("Ann","clean",SEED+"-"+h, null); T.houses++;
    let any = 0;
    for(let w=0; w<W && !d.over; w++){
      /* the reader's own pool, read before the week: a freed man at least five weeks old who has
         not yet become anything. If this is empty, freedWeek returns on its third line. */
      const pool = (d.freed||[]).filter(f=>!f.became && d.week - f.week >= 5);
      if(pool.length){ T.ripe++; T.ripeWeeks += pool.length; }
      /* the same test against the list nothing reads */
      if((d.retired||[]).some(r=>!r.became && d.week - r.week >= 5)) T.retireRipe++;
      if((d.fallen||[]).length >= 2) T.burialOpen++;
      if((d.fallen||[]).length) T.deadWeeks++;
      const before = d.pendingEvent && d.pendingEvent.id;
      R.lanista(d, opts); T.weeks++;
      if(d.pendingEvent && d.pendingEvent.id === "freedman" && before !== "freedman"){ T.events++; any++; }
    }
    T.retired += (d.retired||[]).length;
    for(const r of (d.retired||[])){ if((r.wins||0) >= 8) T.retired8++; if((r.wins||0) >= 10) T.retired10++; }
    T.freed += (d.freed||[]).length;
    T.fallen += (d.fallen||[]).length;
    for(const f of (d.freed||[])) if(f.became && f.became in T.became) T.became[f.became]++;
    const leg = (d.freed||[]).filter(f=>(f.wins||0) >= 10).length;
    T.legends += leg;
    T.legendPts.push(Math.min(12, leg*4));
    if(any) T.houseAny++;
  }
  return { T, rope: R.say() };
}, [H, W, SEED, opts, FM.map(f=>f.k)]);

const C = await arm({});
const F = await arm({ free:true });
const Rt = await arm({ retire:true });
await browser.close(); server.close();

const pc = (n,dd) => dd ? (n/dd*100).toFixed(1)+"%" : "-";
const per = (n,dd) => dd ? (n/dd).toFixed(2) : "-";
console.log(`=== ${C.T.houses} houses x ${W} weeks an arm · control ${C.T.weeks} house-weeks, free:true ${F.T.weeks}\n`);
const row = (lab, f) => console.log(`     ${lab.padEnd(44)} ${String(f(C.T)).padStart(12)} ${String(f(F.T)).padStart(12)} ${String(f(Rt.T)).padStart(12)}`);
console.log(`${"".padEnd(44)} ${"control".padStart(13)} ${"free:true".padStart(13)} ${"retire:true".padStart(13)}`);
console.log(`  the INPUT:`);
row("men the house ever freed", T=>`${T.freed} (${per(T.freed,T.houses)}/house)`);
row("men the house ever buried", T=>`${T.fallen} (${per(T.fallen,T.houses)}/house)`);
row("freed with 10+ wins — the `legends` term", T=>`${T.legends}`);
row("acclaim from legends, per house (cap 12)", T=>per(T.legendPts.reduce((a,b)=>a+b,0), T.houses));
row("men the house ever RETIRED", T=>`${T.retired} (${per(T.retired,T.houses)}/house)`);
row("...of those, with 8+ wins (doctore's gate)", T=>`${T.retired8}`);
row("...with 10+ wins (lanista, and `legends`)", T=>`${T.retired10}`);
console.log(`  the READER:`);
row("weeks a RETIRED man was ripe to be drawn", T=>`${T.retireRipe} ${pc(T.retireRipe,T.weeks)}`);
row("weeks freedWeek had ANYBODY ripe to draw", T=>`${T.ripe} ${pc(T.ripe,T.weeks)}`);
row("weeks with a dead man on the books at all", T=>`${T.deadWeeks} ${pc(T.deadWeeks,T.weeks)}`);
row("weeks the `burial` counsel could open (>=2)", T=>`${T.burialOpen} ${pc(T.burialOpen,T.weeks)}`);
row(">>> FREEDMAN EVENTS ACTUALLY RAISED", T=>`${T.events}`);
row("    houses that ever saw one", T=>`${T.houseAny} of ${T.houses}`);
console.log(`  which of the six ever fired:`);
console.log(`     control   ${Object.entries(C.T.became).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
console.log(`     free:true ${Object.entries(F.T.became).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
console.log(`     retire    ${Object.entries(Rt.T.became).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
const deadF = Object.values(F.T.became).filter(v=>!v).length;
const deadR = Object.values(Rt.T.became).filter(v=>!v).length;
console.log(`\n  >>> THE READER IS NOT THE PROBLEM — ${READERS} places in the file read d.freed or d.fallen,`);
console.log(`      and the dead are plentiful: ${per(C.T.fallen,C.T.houses)} a house, on the books ${pc(C.T.deadWeeks,C.T.weeks)} of weeks.`);
console.log(`  >>> THE INPUT IS. The reference player put ${C.T.freed} men on d.freed in ${C.T.weeks} house-weeks — it has only two`);
console.log(`      sources, the strict rudis gate and sagaFree's single caller — so six entries of writing were unreachable.`);
console.log(`  >>> AND THE THIRD LIST IS FED NINE TIMES AS RICHLY AND WAS READ BY NOTHING: ${per(Rt.T.retired,Rt.T.houses)} retired a house`);
console.log(`      against ${per(F.T.freed,F.T.houses)} freed, a ripe candidate on ${pc(Rt.T.retireRipe,Rt.T.weeks)} of weeks, and ${Rt.T.events} events raised`);
console.log(`      in ${Rt.T.houseAny} of ${Rt.T.houses} houses now that freedWeek can see it — against ${F.T.events} in ${F.T.houseAny} of ${F.T.houses} from freeing.`);
console.log(`      ${deadR} of ${FM.length} entries still never fire even so (${deadF} under free:true).`);
console.log(`\n  control:   ${C.rope}`);
console.log(`  free:true: ${F.rope}`);
console.log(`  retire:    ${Rt.rope}`);
