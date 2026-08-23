/* THE WOODEN SWORD: FOUR TERMS, A THREE-BOUT CAREER, AND WHETHER ANY POLICY CAN REACH IT

   `rudisEligible = !isAuctor(g) && g.wins >= 10 && g.pfame >= 180`, and `grantRudis` meets the
   `freedom` ambition on that plus `g.age < 30` — which is the line the man is given, *"To hold the
   rudis before he is thirty."* #190 measured the four terms over active man-weeks and found the
   record binding, not the age: `wins >= 10` is up on 1.5-2.8% of them, all four on 0.9-2.0%, and
   under an arm that frees every eligible man the week he qualifies, **24 men take the rudis across
   24 houses of 420 weeks and exactly one of them carried the ambition asking for it.**

   THIS PROBE EXISTS TO RUN THE FALSIFIER, NOT TO RE-CONFIRM THE ITEM. The clause written beside
   #190 is: *falsifies if a policy that protects one man — benching the rest, feeding him the card —
   gets him to ten wins reliably, in which case this is about the reference player spreading its
   bouts and not about the gate.* That policy did not exist; `bench` takes fixed ids and the roster
   turns over. The rope has a sticky `protect` lever now and the arm below is the falsifier itself.
   A number from the reference player alone cannot tell the two apart, which is the whole lesson of
   this directory: "the probe never did it" and "the game will not let you" look identical.

   THE CAREER IS MEASURED, NOT ASSUMED. Every man's final record is tallied, so "three bouts at the
   median" is re-derived here on the same run rather than quoted from the steel audit, and the
   distance from the median career to the gate is printed as a distribution rather than a headline.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "RUD";
const ARM  = process.argv[5] || "";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const EL = (src.match(/const rudisEligible = ([^;]*);/) || ["",""])[1];
const AGE = (src.match(/kind==="freedom" && (g\.age<\d+)/) || ["","(not found)"])[1];
console.log(`rudisEligible parsed: ${EL.trim()}`);
console.log(`and grantRudis meets the ambition on that plus: ${AGE}\n`);
if(!EL) throw new Error("rudisEligible parsed EMPTY — fix the regex before reading anything below");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W, SEED, ARM]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  const opts = ARM ? JSON.parse(ARM) : {};
  const T = {
    houses:0, weeks:0, men:0,
    /* the four terms over ACTIVE MAN-WEEKS — a man who clears three of them for a hundred weeks is
       a hundred chances the fourth never took, which a per-man count would hide */
    mw:0, t:{ wins:0, pfame:0, notAuctor:0, under30:0, eligible:0, all4:0 },
    /* and per man, once, so "how many men ever" is separable from "for how long" */
    everWins:0, everPfame:0, everEligible:0, everAll4:0,
    freed:0, freedAges:[], freedWins:[], wantFreedom:0, freedWanting:0, metFreedom:0,
    everWanted:0, brokeFreedom:0, despairFreedom:0, wantFate:{}, freedOver30:0, freedWantingOver30:0,
    wantAt:{}, wantPast30:0, menPast30:0, wantShortFame:0,
    /* the career, re-derived on this run rather than quoted */
    bouts:[], boutsDead:[], boutsAlive:[], winsAt:{}, fate:{},
    /* the protected man, if there is one */
    prot: { men:0, bouts:[], wins:[], best:0, reached10:0, reachedAll4:0, weeks:[], fates:{} },
  };
  const q = (a, f) => { if(!a.length) return 0; const s=[...a].sort((x,y)=>x-y);
    return s[Math.min(s.length-1, Math.floor(s.length*f))]; };

  for(let h=0; h<H; h++){
    const d = A.newGameState("Rudis","clean",SEED+"-"+h, null); T.houses++;
    const seen = new Set();
    for(let w=0; w<W && !d.over; w++){
      R.lanista(d, opts); T.weeks++;
      /* ---- MARK THE PROTECTED MAN THE WEEK HE IS PROTECTED ----
         The first cut of this read `d.__protectId` once, after the run, and so measured whoever
         happened to be current at week 420 — a fresh replacement with a median of 0 wins — and
         printed "best any protected man reached 0" while the arm was working. A sticky choice has
         to be recorded while it is being made. */
      if(opts.protect && d.__protectId != null){
        const c = (d.gladiators||[]).find(x=>x.id === d.__protectId);
        if(c){ if(!c.__wasProt){ c.__wasProt = 1; T.prot.order = (T.prot.order||0)+1; }
               c.__protWeeks = (c.__protWeeks||0)+1; }
      }
      for(const g of (d.gladiators||[])){
        if(!seen.has(g.id)){ seen.add(g.id); T.men++; }
        if(g.status !== "active" || A.isGone(g)) continue;
        T.mw++;
        const w10 = (g.wins||0) >= 10, pf = (g.pfame||0) >= 180, na = !g.auctor, u30 = (g.age||99) < 30;
        if(w10){ T.t.wins++; if(!g.__w10){ g.__w10 = 1; T.everWins++; } }
        if(pf){ T.t.pfame++; if(!g.__pf){ g.__pf = 1; T.everPfame++; } }
        if(na) T.t.notAuctor++;
        if(u30) T.t.under30++;
        let el = false; try { el = !!A.rudisEligible(g); } catch(e){}
        if(el){ T.t.eligible++; if(!g.__el){ g.__el = 1; T.everEligible++; } }
        if(el && u30){ T.t.all4++; if(!g.__a4){ g.__a4 = 1; T.everAll4++; } }
        /* ---- AND THE NUMBER HE ASKED FOR, WHICH NOTHING ON ANY SCREEN ANSWERS ----
           His ask is *"asks you for a number. Not a speech and not a promise — a number. How many
           more."* The game holds it — `10 - g.wins` — and shows it nowhere: `SECT.wants` prints the
           line and a state, the agenda row fires only once he is ALREADY eligible, and the feat's
           `near` counts men who have earned it rather than men approaching it. So this counts the
           man-weeks spent carrying the question, split by how far off the answer was. */
        if(g.ambition && g.ambition.kind === "freedom"){ T.wantFreedom++;
          const short = Math.max(0, 10 - (g.wins||0));
          T.wantAt[Math.min(10, short)] = (T.wantAt[Math.min(10, short)]||0)+1;
          if((g.age||0) >= 30){ T.wantPast30++; if(!g.__p30){ g.__p30 = 1; T.menPast30++; } }
          if((g.pfame||0) < 180) T.wantShortFame++;
        }
      }
    }
    /* ---- THE TERMINAL RECORD OF EVERYONE THE HOUSE EVER HELD ----
       `freedom` MET is counted HERE, over every man whatever his status, and not in the weekly
       sweep. The first cut counted it inside the sweep's `status !== "active"` guard — and
       `grantRudis` sets `status = "freed"` two lines before it fires `ambitionMet`, so the counter
       was structurally incapable of ever seeing one. It printed 0 and the 0 meant nothing. */
    for(const g of (d.gladiators||[])){
      if(g.ambition && g.ambition.kind === "freedom"){ T.everWanted++;
        if(g.ambition.met) T.metFreedom++;
        else if(g.ambition.broken) T.brokeFreedom++;
        else if(g.ambition.despair) T.despairFreedom++;
        T.wantFate[g.status] = (T.wantFate[g.status]||0)+1; }
      const n = (g.wins||0) + (g.losses||0);
      T.bouts.push(n);
      (g.status === "dead" ? T.boutsDead : T.boutsAlive).push(n);
      T.fate[g.status] = (T.fate[g.status]||0)+1;
      const b = Math.min(10, g.wins||0);
      T.winsAt[b] = (T.winsAt[b]||0)+1;
      if(g.status === "freed"){ T.freed++;
        T.freedAges.push(g.age||0); T.freedWins.push(g.wins||0);
        if((g.age||0) >= 30) T.freedOver30++;
        if(g.ambition && g.ambition.kind === "freedom"){ T.freedWanting++;
          /* the one term `grantRudis` adds on top of `rudisEligible`, counted where it bites */
          if((g.age||0) >= 30) T.freedWantingOver30++; } }
    }
    /* ---- AND THE ONE MAN THE PROTECT ARM FED, followed to whatever happened to him ---- */
    if(opts.protect){
      for(const g of (d.gladiators||[])){
        if(!g.__wasProt) continue;
        T.prot.men++;
        T.prot.weeks.push(g.__protWeeks||0);
        const n = (g.wins||0) + (g.losses||0);
        T.prot.bouts.push(n); T.prot.wins.push(g.wins||0);
        if((g.wins||0) > T.prot.best) T.prot.best = g.wins||0;
        if((g.wins||0) >= 10) T.prot.reached10++;
        if((g.wins||0) >= 10 && (g.pfame||0) >= 180 && !g.auctor && (g.age||99) < 30) T.prot.reachedAll4++;
        T.prot.fates[g.status] = (T.prot.fates[g.status]||0)+1;
      }
    }
  }
  T.q = { bouts:[q(T.bouts,.25), q(T.bouts,.5), q(T.bouts,.75), q(T.bouts,.9)],
          alive:[q(T.boutsAlive,.5), q(T.boutsAlive,.9)],
          dead:[q(T.boutsDead,.5), q(T.boutsDead,.9)],
          freedAge:q(T.freedAges,.5), freedWins:q(T.freedWins,.5),
          protBouts:[q(T.prot.bouts,.5), q(T.prot.bouts,.9)], protWins:[q(T.prot.wins,.5), q(T.prot.wins,.9)],
          protWeeks:[q(T.prot.weeks,.5), q(T.prot.weeks,.9)] };
  return { T, rope:R.say() };
}, [H, W, SEED, ARM]);

await browser.close(); server.close();
const T = out.T, pc = (n,dd) => dd ? (n/dd*100).toFixed(1)+"%" : "-";
console.log(`=== ${T.houses} houses x ${W} weeks · ${T.weeks} house-weeks · ${T.men} men · ${T.mw} active man-weeks`);
console.log(`\n  the four terms, over ACTIVE MAN-WEEKS        and over MEN, once each`);
const row = (label, mw, men) => console.log(`     ${label.padEnd(22)} ${pc(mw,T.mw).padStart(7)}    ${men==null?"":`${String(men).padStart(5)} men  ${pc(men,T.men)}`}`);
row("wins >= 10", T.t.wins, T.everWins);
row("pfame >= 180", T.t.pfame, T.everPfame);
row("not an auctoratus", T.t.notAuctor, null);
row("age < 30", T.t.under30, null);
row("rudisEligible (3)", T.t.eligible, T.everEligible);
row("all four", T.t.all4, T.everAll4);

console.log(`\n  the career, re-derived on this run — bouts fought, whole life:`);
console.log(`     p25 ${T.q.bouts[0]} · median ${T.q.bouts[1]} · p75 ${T.q.bouts[2]} · p90 ${T.q.bouts[3]}`);
console.log(`     men who ended alive: median ${T.q.alive[0]}, p90 ${T.q.alive[1]}   ·   buried: median ${T.q.dead[0]}, p90 ${T.q.dead[1]}`);
console.log(`     where careers stop, by wins:`);
for(let i=0;i<=10;i++){ const n=T.winsAt[i]||0;
  console.log(`        ${i===10?"10+":String(i).padStart(2)} wins ${String(n).padStart(5)}  ${pc(n,T.men).padStart(6)}  ${"#".repeat(Math.round(n/Math.max(1,T.men)*120))}`); }
console.log(`     fates: ${Object.entries(T.fate).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}`);

console.log(`\n  the rudis actually taken: ${T.freed} men  (median age ${T.q.freedAge}, median ${T.q.freedWins} wins)`);
console.log(`     of them, carrying the ambition that asks for it: ${T.freedWanting}`);
console.log(`     freed at 30 or over (so grantRudis' extra term bit): ${T.freedOver30} of ${T.freed}`
  + (T.freedWanting ? ` · of the ${T.freedWanting} who wanted it, ${T.freedWantingOver30} were over 30` : ""));
console.log(`\n  the \`freedom\` ambition itself — ${T.everWanted} men ever carried it, ${T.wantFreedom} active man-weeks:`);
console.log(`     MET ${T.metFreedom} · broken ${T.brokeFreedom} · despaired ${T.despairFreedom} · the rest still carrying it or gone with it`);
console.log(`     what became of the men who wanted it: ${Object.entries(T.wantFate).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
console.log(`\n  THE NUMBER HE ASKED FOR — active man-weeks carrying \`freedom\`, by how many wins short:`);
for(let i=10;i>=0;i--){ const n=T.wantAt[i]||0; if(!n && i!==0) continue;
  console.log(`     ${i===10?"10+":String(i).padStart(2)} wins short ${String(n).padStart(6)}  ${pc(n,T.wantFreedom).padStart(6)}  ${"#".repeat(Math.round(n/Math.max(1,T.wantFreedom)*90))}`); }
console.log(`     and ${T.wantPast30} of those man-weeks (${pc(T.wantPast30,T.wantFreedom)}), across ${T.menPast30} men, were spent by a man already PAST THIRTY —`);
console.log(`     carrying "to hold the rudis before he is thirty" with the door his own line names already shut.`);
console.log(`     ${pc(T.wantShortFame,T.wantFreedom)} of them were also short of pfame 180.`);

if(T.prot.men){
  console.log(`\n  === THE FALSIFIER: ${T.prot.men} protected men, one at a time, fed the whole card ===`);
  console.log(`     bouts   median ${T.q.protBouts[0]} · p90 ${T.q.protBouts[1]}      (the house at large: median ${T.q.bouts[1]})`);
  console.log(`     wins    median ${T.q.protWins[0]} · p90 ${T.q.protWins[1]} · best any protected man reached ${T.prot.best}`);
  console.log(`     reached ten wins        ${T.prot.reached10} of ${T.prot.men}  ${pc(T.prot.reached10,T.prot.men)}`);
  console.log(`     reached all four terms  ${T.prot.reachedAll4} of ${T.prot.men}  ${pc(T.prot.reachedAll4,T.prot.men)}`);
  console.log(`     weeks each held the card  median ${T.q.protWeeks[0]} · p90 ${T.q.protWeeks[1]}`);
  console.log(`     what became of them: ${Object.entries(T.prot.fates).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
  console.log(`\n     >>> #190 FALSIFIES if this is reliable. It is ${T.prot.reached10/Math.max(1,T.prot.men) >= 0.5
    ? "RELIABLE — the gate is reachable and the item is about the reference player spreading its bouts"
    : "NOT reliable — even a house that fights one man and nobody else cannot get him there"}.`);
}
console.log(`\n  rope: ${out.rope}`);
