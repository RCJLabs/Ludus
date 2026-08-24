/* THE TRAINING SQUARE HOLDS ONE MAN. HOW MANY NEVER GET ON IT?

   #197 proposes naming TWO men to the doctore. Before widening a door, count who is already
   getting through it.

   `doc.pupil` is a single id. `doctoreWeek` returns on its second line unless it is set, and
   `docLesson` then rolls `doc.skill/340 * (fromHouse ? 1.5 : 1)` — about one week in five for a
   skilled house doctore. `DOC_LESSONS.potential` is **the only thing in the file that raises a
   living man's potential**, and #189 found the reference player had never named a pupil at all, so
   the whole table was unreachable by any measured policy. The `pupil` lever exists because of that
   and it round-robins, which is the widest a single slot can be driven.

   SO THIS RUNS THREE ARMS, and the third is the point:

       control   the reference player — nobody is ever named
       pupil     `pupil:true`, round-robin: the slot is never idle, every man takes his turn
       held      `pupil:"hold"`, the same slot parked on ONE man for his whole career — which is
                 what a player who has picked a favourite actually does

   FALSIFIES #197 if the round-robin arm already reaches most of the house: if a single slot rotated
   properly touches nearly every man, the bottleneck is the ROTATION being invisible rather than the
   slot being singular, and the item is a signpost like #202 rather than a second seat.
   It ALSO falsifies if `potential` is not scarce — the lesson has to be worth queueing for.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 8), W = +(process.argv[3] || 300);
const SEED = process.argv[4] || "SQUARE";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const ODDS = (src.match(/const odds = doc\.skill\/(\d+) \* \(doc\.fromHouse \? ([\d.]+) : 1\);/) || ["","?","?"]).slice(1);
const KEYS = [...(src.match(/const DOC_LESSONS = \{([\s\S]*?)\n\};/)||["",""])[1].matchAll(/^  ([a-z]+):\s*\{ weight:(\d+)/gm)].map(m=>[m[1],+m[2]]);
console.log(`docLesson's odds: skill/${ODDS[0]} x ${ODDS[1]} if the doctore came with the house`);
console.log(`DOC_LESSONS: ${KEYS.map(([k,w])=>`${k} w${w}`).join(" · ")}\n`);
if(!KEYS.length || ODDS[0]==="?") throw new Error("the odds or the table parsed EMPTY — fix the regex first");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const arm = async (opts) => inside(p, ([H, W, SEED, opts]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  R.reset();
  const T = { houses:0, weeks:0, men:0, docWeeks:0, occupied:0, lessons:0, byKind:{},
              taught:0, everTaught:0, potGain:0, potTop:[], turns:[], neverMen:0,
              /* the queue: men standing in a house that HAS a doctore and are not on the square */
              waiting:0, mwWithDoc:0, ties:0, bros:0, rivs:0,
              /* ---- TIES THE SQUARE ITSELF MADE ----
                 `d.ties` at the end of a house is confounded by how long the house lived, and the
                 two-seat arm's houses live longer — 1671 doctore-weeks against 1159 — so 24 ties
                 against 13 is not 1.85x of anything. These are counted off the lines the square
                 writes, which happen once each and cannot be inflated by a long life. */
              sqBro:0, sqRiv:0, sqHealed:0 };
  for(let h=0; h<H; h++){
    const d = A.newGameState("Square","clean",SEED+"-"+h, null); T.houses++;
    const seen = new Set(), got = new Set(), pot0 = new Map();
    let held = null;
    for(let w=0; w<W && !d.over; w++){
      /* the "held" arm parks the slot on one man and keeps it there for his whole career */
      if(opts.hold && d.doctore && !d.doctore.retrainTo){
        const live = x => x && x.status === "active" && !A.isGone(x);
        let man = held ? A.activeG(d).find(g=>g.id === held) : null;
        if(!live(man)){
          const av = g => A.STATS.reduce((s,k)=>s+(g[k]||0),0)/6;
          man = A.activeG(d).slice().sort((a,b)=>av(b)-av(a))[0];
          held = man ? man.id : null;
        }
        if(man && d.doctore.pupil !== man.id){
          if(d.doctore.pupil) { try { A.setPupilTo(d, d.doctore.pupil); } catch(e){} }
          try { A.setPupilTo(d, man.id); } catch(e){}
        }
      }
      for(const g of (d.gladiators||[])) if(g.status === "active" && pot0.get(g.id) == null) pot0.set(g.id, g.potential||0);
      /* ---- THE CHRONICLE IS `d.log`, IT UNSHIFTS, AND IT ROLLS ----
         `chron` puts the newest entry at index 0 and pops the tail at LOG_ROLL, so neither a name
         called `chronicle` nor a `slice(oldLength)` reads this week's lines: the first finds
         nothing at all and the second reads the OLDEST end, and once the log is full its length
         stops growing so it reads nothing forever. Walk down from the head to the entry that was
         the head before the week — object identity, which survives the roll. */
      const head0 = (d.log||[])[0] || null;
      R.lanista(d, Object.assign({}, opts, { hold:undefined }));
      T.weeks++;
      if(d.doctore){
        T.docWeeks++;
        if(d.doctore.pupil){ T.occupied++; got.add(d.doctore.pupil); }
        const act = A.activeG(d);
        T.mwWithDoc += act.length;
        T.waiting += act.filter(g=>g.id !== d.doctore.pupil).length;
      }
      /* the lessons, off the chronicle the game writes rather than a copy of the table */
      const fresh = [];
      for(const e of (d.log||[])){ if(e === head0) break; fresh.push(e); }
      for(const line of fresh){
        const t = (line && (line.text || line)) || "";
        if(/finds something nobody had looked for/.test(t)){ T.lessons++; T.byKind.potential = (T.byKind.potential||0)+1; }
        else if(/until it stops being a thing/.test(t)){ T.lessons++; T.byKind.trait = (T.byKind.trait||0)+1; }
        else if(/will now tell you exactly what/.test(t)){ T.lessons++; T.byKind.read = (T.byKind.read||0)+1; }
        else if(/takes the fight out of/.test(t)){ T.lessons++; T.byKind.steady = (T.byKind.steady||0)+1; }
        else if(/every morning until it gives back/.test(t)){ T.lessons++; T.byKind.mend = (T.byKind.mend||0)+1; }
        else if(/They have stopped pretending they do not like it/.test(t)) T.sqBro++;
        else if(/one of them is keeping score/.test(t)) T.sqRiv++;
        else if(/somewhere in it the thing between them ran out/.test(t)) T.sqHealed++;
      }
      for(const g of (d.gladiators||[])) if(!seen.has(g.id)){ seen.add(g.id); T.men++; }
    }
    for(const t of (d.ties||[])){ T.ties++; if(t.kind==="brother") T.bros++; else T.rivs++; }
    T.everTaught += got.size;
    T.neverMen += Math.max(0, seen.size - got.size);
    for(const g of (d.gladiators||[])){
      const p0 = pot0.get(g.id); if(p0 == null) continue;
      const gain = (g.potential||0) - p0;
      if(gain > 0) T.potGain += gain;
      T.potTop.push(g.potential||0);
    }
  }
  return { T, rope: R.say() };
}, [H, W, SEED, opts]);

const C = await arm({});
const P = await arm({ pupil:true });
/* ---- AND `hold` MUST NOT ALSO ASK THE ROPE TO ROTATE ----
   The first run passed `{ pupil:true, hold:true }`, so this probe parked the slot and then the
   rope's own round-robin renamed it on the same week, every week. The held arm came back
   BYTE-IDENTICAL to the round-robin — same lessons, same men, same potential — which is #136's
   signature for a lever that is not connected, and it is the third time this project has caught
   one that way. `hold` drives the slot itself; the rope is handed nothing. */
const D = await arm({ hold:true });
const T2 = await arm({ pupil:"two" });
await browser.close(); server.close();

const pc = (n,dd) => dd ? (n/dd*100).toFixed(1)+"%" : "-";
const q = (a,f)=>{ if(!a.length) return "-"; const z=[...a].sort((x,y)=>x-y); return z[Math.min(z.length-1,Math.floor(z.length*f))]; };
const row = (lab, den) => console.log(`     ${lab.padEnd(40)} `
  + [C,P,D,T2].map(X=>{ const v = den.get(X.T); return `${String(v[0]).padStart(6)}${(v[1]!=null?` ${pc(v[0],v[1])}`:"").padStart(8)}`; }).join("  "));

console.log(`=== ${C.T.houses} houses x ${W} weeks an arm · control ${C.T.weeks} house-weeks, round-robin ${P.T.weeks}, held ${D.T.weeks}\n`);
console.log(`${"".padEnd(40)} ${"control".padStart(13)}  ${"round-robin".padStart(13)}  ${"held on one".padStart(13)}  ${"TWO SEATS".padStart(13)}`);
row("weeks the house had a doctore", { get:T=>[T.docWeeks, T.weeks] });
row("weeks the SQUARE WAS OCCUPIED", { get:T=>[T.occupied, T.docWeeks] });
row("lessons taught", { get:T=>[T.lessons, T.docWeeks] });
row("men the house held", { get:T=>[T.men, null] });
row("men who ever stood on the square", { get:T=>[T.everTaught, T.men] });
row("men who NEVER did", { get:T=>[T.neverMen, T.men] });
row("man-weeks waiting (doctore, not pupil)", { get:T=>[T.waiting, T.mwWithDoc] });
row("potential added to living men", { get:T=>[T.potGain, null] });
console.log(`\n  which lessons: ${[C,P,D,T2].map((X,i)=>`${["control","robin","held","two"][i]} {${Object.entries(X.T.byKind).map(([k,v])=>`${k} ${v}`).join(" ")||"none"}}`).join(" · ")}`);
console.log(`  potential at the end: control p50 ${q(C.T.potTop,.5)}/p90 ${q(C.T.potTop,.9)} · robin p50 ${q(P.T.potTop,.5)}/p90 ${q(P.T.potTop,.9)} · held p50 ${q(D.T.potTop,.5)}/p90 ${q(D.T.potTop,.9)} · TWO p50 ${q(T2.T.potTop,.5)}/p90 ${q(T2.T.potTop,.9)}`);
console.log(`\n  control rope: ${C.rope}`);
console.log(`  robin   rope: ${P.rope}`);
console.log(`  held    rope: ${D.rope}`);
console.log(`  two     rope: ${T2.rope}`);
console.log(`\n  TIES THE SQUARE ITSELF MADE, per thousand weeks it was occupied by two men:`);
for(const [lab,X] of [["control",C],["round-robin",P],["held on one",D],["TWO SEATS",T2]]){
  const per = X.T.occupied ? (n)=>(n/X.T.occupied*1000).toFixed(1) : ()=>"-";
  console.log(`     ${lab.padEnd(16)} brother ${String(X.T.sqBro).padStart(3)} (${per(X.T.sqBro)}/kw) · rival ${String(X.T.sqRiv).padStart(3)} (${per(X.T.sqRiv)}/kw) · feuds it beat out ${X.T.sqHealed}`);
}
console.log(`  and the ties standing at the end, which a longer-lived house has more of either way: `
  + [["control",C],["robin",P],["held",D],["two",T2]].map(([l,X])=>`${l} ${X.T.ties} (${X.T.bros}b/${X.T.rivs}r)`).join(" · "));
const reach = P.T.men ? P.T.everTaught / P.T.men : 0;
console.log(`\n  >>> ${reach >= 0.8
  ? `A ROTATED SINGLE SLOT ALREADY REACHES ${pc(P.T.everTaught,P.T.men)} of the house. #197 SHRINKS to a signpost: the slot is not the bottleneck, the rotation being invisible is.`
  : `A rotated single slot reaches ${pc(P.T.everTaught,P.T.men)} of the house and a parked one ${pc(D.T.everTaught,D.T.men)}. ${pc(P.T.waiting,P.T.mwWithDoc)} of man-weeks under a doctore are spent waiting. #197 stands.`}`);
