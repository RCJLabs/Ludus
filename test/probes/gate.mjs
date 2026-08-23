/* WHEN DOES A MAN BECOME ELIGIBLE FOR AN AMBITION HE COULD NOT HAVE BEEN GIVEN?

   `giveAmbition` filters the seven keys and draws one. Two of the filters are tests on the man's
   BODY and RECORD: `champion` needs `potential >= 62`, `revenge` needs `(g.scars||[]).length > 0`.
   Both are run exactly once, the week he is made — and a man off the block is unscarred and mostly
   unassessed, which is the one moment in his life he is least likely to pass either. #189 measured
   the result: `champion` 3.7% and `revenge` 2.9% of 1,789 ambitions given, against 18-20% each for
   the five ungated kinds.

   THIS MEASURES THE DOOR, NOT THE OUTCOME. "Tested once" is only a fault if men CROSS the gate
   afterwards, while they are still alive and have not yet said what they want. If almost nobody
   does, re-testing buys nothing and the fault is the creation gate itself, which is a different
   item. So this counts crossings and the state of the man at the moment he crosses.

   THE POOL IS SAMPLED WITH THE GAME'S OWN `giveAmbition`, NOT A COPY OF ITS FILTER. A probe that
   re-implements the predicate is a second implementation to keep in step, and `stock.mjs` was
   caught doing exactly that with `d.poachedIn`. Here the man is cloned and the real draw run on
   the clone until the keys stop being new: the set that comes back IS the pool the game would use.

   FALSIFIER: if men almost never cross either gate while active and silent, then eligibility being
   tested once costs nothing and #189 is about the creation gate rather than about the re-test.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "GATE";
const ARM  = process.argv[5] || "";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const FILTER = (src.match(/function giveAmbition\(d, g\)\{([\s\S]*?)\n\}/) || ["",""])[1];
const KEYS = [...(src.match(/const AMBITIONS = \{([\s\S]*?)\n\};/)||["",""])[1]
  .matchAll(/^  ([A-Za-z]+):\s*\{/gm)].map(m=>m[1]);
console.log(`AMBITIONS parsed: ${KEYS.length} [${KEYS.join(" ")}]`);
console.log(`giveAmbition's filter, as it stands:\n${FILTER.split("\n").slice(0,8).join("\n")}\n`);
if(!KEYS.length || !FILTER) throw new Error("AMBITIONS or giveAmbition parsed EMPTY — fix the regex first");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W, SEED, ARM, KEYS]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  const opts = ARM ? JSON.parse(ARM) : {};
  if(typeof A.giveAmbition !== "function")
    return { fatal:"giveAmbition is not on the handle — this probe cannot sample the pool" };

  /* the pool, sampled with the real draw on a throwaway clone. 90 draws over a pool of at most
     seven: the chance of missing a member is (6/7)^90, which is 1e-6. The clone is a shallow
     copy with the fields the filter reads, so nothing the draw writes touches the live man.

     AND THE SEED IS PUT BACK. `pick` is `a[Math.floor(R()*a.length)]` and `R()` advances one global
     counter, so ninety draws a week per man is a hundred thousand steps of the stream a played
     house never took — a different game, measured confidently. The first cut of this probe did
     exactly that and every figure it printed was off a perturbed sim. `rngGet`/`rngSet` are on the
     handle for this reason, and the SIG line below proves the sampling is invisible. */
  const poolOf = g => {
    const seed = A.rngGet();
    const seen = new Set();
    const dummy = { potential:g.potential, nick:g.nick, scars:g.scars, ambition:null };
    for(let i=0;i<90;i++){ A.giveAmbition(null, dummy); seen.add(dummy.ambition.kind); }
    A.rngSet(seed);
    return seen;
  };

  const T = {
    houses:0, weeks:0, men:0,
    poolAt: {}, given: {}, /* pool size at creation, and what he was given */
    /* the two gates, watched over every man's whole life */
    gate: { revenge:{ closedAt:0, opened:0, openedSilent:0, openedVoiced:0, openedDone:0,
                      week:[], age:[], alreadyHad:0 },
            champion:{ closedAt:0, opened:0, openedSilent:0, openedVoiced:0, openedDone:0,
                       week:[], age:[], alreadyHad:0 } },
    /* and the counterfactual: uniform-on-the-new-pool, applied at the crossing */
    would: {}, wouldN: 0,
    everScarred:0, everPot62:0, aliveAtEnd:0,
    /* ---- AND WHETHER THE THING THAT WOULD OPEN THE CHAMPION GATE EVER HAPPENS ----
       Zero crossings is a claim about `g.potential` never rising past 62 in a living man. The only
       lift in the file is `DOC_LESSONS.potential` (+2..4), behind `doctoreWeek`, behind a NAMED
       PUPIL — which the rope never named until the `pupil` lever. So the movement itself is
       counted, not just the crossing: a zero here and a zero above mean different things. */
    pot: { up:0, down:0, upBy:0, cross:0, pupilWeeks:0, hadDoctore:0, seenAt:{} },
    /* what a man's ambition state is when he first crosses anything */
    stateAt: {}, sig: [],
  };
  for(const k of KEYS){ T.given[k]=0; T.would[k]=0; }

  const GATES = { revenge:"revenge", champion:"champion" };

  for(let h=0; h<H; h++){
    const d = A.newGameState("Gate","clean",SEED+"-"+h, null); T.houses++;
    for(let w=0; w<W && !d.over; w++){
      const did = R.lanista(d, opts) || {}; T.weeks++;
      if(did.pupil) T.pot.pupilWeeks += did.pupil;
      if(d.doctore) T.pot.hadDoctore++;
      if(d.doctore && d.doctore.pupil) T.pot.seenAt.named = (T.pot.seenAt.named||0)+1;
      for(const g of (d.gladiators||[])){
        const a = g.ambition; if(!a) continue;
        /* first sighting: the pool he was actually drawn from, and what he got */
        if(!g.__pg){ g.__pg = 1; T.men++;
          const pool = poolOf(g);
          T.poolAt[pool.size] = (T.poolAt[pool.size]||0)+1;
          if(a.kind in T.given) T.given[a.kind]++;
          g.__pool = [...pool];
          for(const k of Object.keys(GATES)) if(!pool.has(k)) T.gate[k].closedAt++;
                                             else T.gate[k].alreadyHad++;
        }
        if(A.isGone(g)) continue;
        /* and every week after: has a gate that was shut when he arrived come open? */
        const now = poolOf(g);
        for(const k of Object.keys(GATES)){
          if(g["__op_"+k]) continue;
          if(g.__pool.includes(k) || !now.has(k)) continue;
          g["__op_"+k] = 1;
          const G = T.gate[k];
          G.opened++;
          const st = a.met ? "met" : a.broken ? "broken" : a.despair ? "despair"
            : (a.voiced||0)>=2 ? "pressed" : (a.voiced||0)>=1 ? "asked" : "silent";
          T.stateAt[st] = (T.stateAt[st]||0)+1;
          if(st === "silent") G.openedSilent++;
          else if(st === "asked" || st === "pressed") G.openedVoiced++;
          else G.openedDone++;
          if(G.week.length < 900){ G.week.push(w); G.age.push(g.age||0); }
          /* the exact correction that turns a uniform draw on the OLD pool into a uniform draw on
             the new one: with probability 1/|new pool| the new key takes it, else he keeps what he
             has. Counted here, applied nowhere — this is what a fix would cost the distribution. */
          if(st === "silent"){ T.wouldN++;
            if(Math.random() < 1/now.size) T.would[k]++; else if(a.kind in T.would) T.would[a.kind]++; }
        }
        if((g.scars||[]).length && !g.__sc){ g.__sc = 1; T.everScarred++; }
        if((g.potential||0) >= 62 && !g.__p62){ g.__p62 = 1; T.everPot62++; }
        const now62 = g.potential||0;
        if(g.__lastPot != null && now62 !== g.__lastPot){
          if(now62 > g.__lastPot){ T.pot.up++; T.pot.upBy += now62 - g.__lastPot;
            if(g.__lastPot < 62 && now62 >= 62) T.pot.cross++; }
          else T.pot.down++;
        }
        g.__lastPot = now62;
      }
    }
    for(const g of (d.gladiators||[])) if(!A.isGone(g)) T.aliveAtEnd++;
    T.sig.push(`${d.week}/${A.activeG(d).length}/${Math.round(d.gold)}/${d.over?d.over.kind:"up"}`);
  }
  /* ---- AND THE PROOF THAT THE SAMPLING IS INVISIBLE ----
     The same houses again with `poolOf` never called. If the save/restore round the ninety draws
     is right, the two signatures are BYTE-IDENTICAL; if it is wrong, they diverge in the first
     house. This is `open.mjs`'s method applied to the probe's own footprint rather than to a
     build, and it is the only thing that makes the numbers above quotable. */
  const bare = [];
  for(let h=0; h<H; h++){
    const d = A.newGameState("Gate","clean",SEED+"-"+h, null);
    for(let w=0; w<W && !d.over; w++) R.lanista(d, opts);
    bare.push(`${d.week}/${A.activeG(d).length}/${Math.round(d.gold)}/${d.over?d.over.kind:"up"}`);
  }
  T.bare = bare;
  return { T, rope:R.say() };
}, [H, W, SEED, ARM, KEYS]);

await browser.close(); server.close();
if(out.fatal){ console.log("FATAL: " + out.fatal); process.exit(1); }
const T = out.T;
const med = a => { if(!a.length) return "-"; const s=[...a].sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
const pc = (n,dd) => dd ? (n/dd*100).toFixed(1)+"%" : "-";

console.log(`=== ${T.houses} houses x ${W} weeks · ${T.weeks} house-weeks · ${T.men} men carrying an ambition`);
console.log(`\n  pool size the week he was made:`);
for(const [k,v] of Object.entries(T.poolAt).sort())
  console.log(`     ${k} keys${" ".repeat(4)}${String(v).padStart(6)}  ${pc(v,T.men)}`);
console.log(`\n  what he was given:`);
for(const [k,v] of Object.entries(T.given).sort((a,b)=>b[1]-a[1]))
  console.log(`     ${k.padEnd(10)} ${String(v).padStart(6)}  ${pc(v,T.men)}`);

for(const [k,G] of Object.entries(T.gate)){
  console.log(`\n  --- the ${k} gate ---`);
  console.log(`     shut the week he arrived        ${String(G.closedAt).padStart(6)}  ${pc(G.closedAt,T.men)} of men`);
  console.log(`     already open the week he arrived${String(G.alreadyHad).padStart(6)}  ${pc(G.alreadyHad,T.men)}`);
  console.log(`     OPENED later in his life        ${String(G.opened).padStart(6)}  ${pc(G.opened,G.closedAt)} of the men it was shut for`);
  console.log(`        and he had not yet spoken    ${String(G.openedSilent).padStart(6)}  ${pc(G.openedSilent,G.opened)} of crossings`);
  console.log(`        he had already asked/pressed ${String(G.openedVoiced).padStart(6)}  ${pc(G.openedVoiced,G.opened)}`);
  console.log(`        met/broken/despaired already ${String(G.openedDone).padStart(6)}  ${pc(G.openedDone,G.opened)}`);
  console.log(`     week of the house at crossing   median ${med(G.week)} · age median ${med(G.age)}`);
}
console.log(`\n  state at the moment of crossing: ${Object.entries(T.stateAt).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ") || "(none)"}`);
console.log(`\n  the doctore's square: ${T.pot.hadDoctore} of ${T.weeks} house-weeks had a doctore · ${T.pot.seenAt.named||0} had a NAMED PUPIL · the lever named one ${T.pot.pupilWeeks} times`);
console.log(`  potential moved in a living man: ${T.pot.up} rises (+${T.pot.upBy} total) · ${T.pot.down} falls · ${T.pot.cross} of the rises crossed 62 from below`);
console.log(`\n  men who ever carried a scar     ${T.everScarred}  ${pc(T.everScarred,T.men)}`);
console.log(`  men who ever reached potential 62 ${T.everPot62}  ${pc(T.everPot62,T.men)}`);
console.log(`\n  COUNTERFACTUAL — the distribution if a silent man were re-drawn on the new pool`);
console.log(`  (${T.wouldN} silent crossings; every other man keeps what he has, so only these move)`);
for(const [k,v] of Object.entries(T.would).sort((a,b)=>b[1]-a[1])) if(v)
  console.log(`     ${k.padEnd(10)} ${String(v).padStart(6)} of ${T.wouldN} silent crossings land here`);
const same = T.sig.join(" ") === (T.bare||[]).join(" ");
console.log(`\n  the same ${T.houses} houses driven again with the pool sampling OFF:`);
console.log(`     ${same ? "SIGNATURE IDENTICAL — the ninety draws a week put the seed back and the sim is the one a played house runs"
                        : "*** SIGNATURES DIFFER — the sampling is perturbing the game it measures; nothing above is quotable ***"}`);
if(!same){ console.log(`     sampled ${T.sig.join(" ")}`); console.log(`     bare    ${(T.bare||[]).join(" ")}`); }
console.log(`\n  rope: ${out.rope}`);
