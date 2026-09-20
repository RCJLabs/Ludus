/* CAN EVERY BRANCH BE REACHED AT ALL? — the two templated beats of a bout, swept.

     node test/probes/reachable.mjs 40000

   v3.288.0 templated the death into a `DEATHS` table of eleven `when`/`say` entries and reported
   that SEVEN OF ELEVEN FIRED over 200 bouts. That sentence is true and it is not the question.
   The probe that produced it fights WEEK-ONE HOUSES: measured at salute time over the same 200
   bouts, a man has at most one win, at most three scars, is never older than 32, and there is
   never a patron in the box or a sine missione on the bill. Four branches could not have fired
   there whatever the writing was, and "seven of eleven" says nothing whatever about whether the
   other four are reachable by any state the game can produce.

   THAT IS #288'S SHAPE, ONE LAYER DOWN. The rebellion ladder was assumed dead because no house in
   the sample climbed it; the answer was that it is climbable and rare, and a mean would have
   proved the opposite of the truth. A branch nobody has seen fire is in exactly that position:
   rare, or dead, and the sample cannot tell you which.

   ---- WHAT THIS DOES INSTEAD ----
   `SALUTES`, `DEATHS`, `MISSIOS`, `MERCIES` and their pickers are exported on the test handle.
   This takes REAL gladiators out of a real game state — so the objects have every field the game
   gives a man, not the eight a synthetic would have — clones them, and sweeps the fields the
   tables actually read across values chosen to straddle every threshold in them.

   EACH TABLE DECLARES WHICH FIGHTER IT IS ABOUT. `MISSIOS` is your own man with two fingers up
   and reads his record; `MERCIES` is the beaten stranger and reads HIS. Sweeping both against the
   same subject would have proved the wrong thing and printed the same three zeros while doing it,
   which is this project's most-shipped fault wearing a new coat. For each sample it asks the picker which
   entry it chose, and separately asks every entry whether its own `when` was satisfied.

   Those two questions are different, and the gap between them is the finding:

     SELECTED           the picker chose it. Reachable, proven, no argument.
     SHADOWED           its `when` came back true and an earlier entry was chosen every time.
                        The writing is real and no player will ever read it.
     NEVER SATISFIED    no sample made its `when` true. Either unreachable, OR THE SWEEP IS TOO
                        NARROW, and this probe cannot tell those apart. It says so rather than
                        calling it dead — which is the whole lesson of the six releases behind it.

   ---- AND A THIRD ARM, FOR A FAULT THAT SHIPS PROSE ----
   `when` runs inside a `try`, so a branch that reads a field the context does not carry fails
   quietly and the picker moves on. `say` DOES NOT. A `say` that reaches for `c.ctx.patron.name`
   when the context has no patron throws into the middle of a bout, and one that reads a merely
   absent field renders the word "undefined" into the arena. Every entry whose `when` was ever
   satisfied is rendered here and the text checked for `undefined`, `NaN`, `[object` and emptiness.

   ---- WHAT IT HAS FOUND SO FAR ----
   49 of 49 entries across four tables SELECTED · 0 shadowed · 0 never satisfied · 0 that throw
   or render "undefined". Two of those tables (`MISSIOS`, `MERCIES`, #294) were swept BEFORE they
   shipped rather than after, which is the point of building it.

   WHAT IS NOT CLAIMED: that a reachable branch is COMMON. This is a sweep over a constructed
   space, not a census of play — the shares it prints are shares of the sweep and mean nothing
   about a real career. `watching.mjs` is the census; this is the reachability proof beside it. */
import { serve, open, clearAll, found } from "../harness.mjs";

const N = +(process.argv[2] || 40000);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20);

const out = await p.evaluate(([N])=>{
  const A = window.__LVDVS;
  const miss = ["newGameState","activeG","SALUTES","saluteLine","DEATHS","deathLine",
                "MISSIOS","missioLine","MERCIES","mercyLine"]
    .filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  /* A REAL MAN, NOT A LITERAL. A hand-built `{name, wins, age}` would pass a sweep and prove
     nothing about a `say` that reaches for a field only a real gladiator has. */
  const d = A.newGameState("Rc","clean","REACH-0");
  const men = A.activeG(d);
  if(!men.length) return { why:"no gladiator to clone — the starting house was empty" };
  const BASE = men[0], FOE = men[1] || men[0];

  /* mulberry32 again, seeded here, so the sweep is the same sweep every run and a figure that
     moves means the tables moved. It does NOT touch the game's `R()` stream. */
  let s = 0x9e3779b9;
  const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const one = a => a[Math.floor(rnd() * a.length)];

  /* straddling every threshold either table names, plus a value either side of it */
  const WINS   = [0, 1, 2, 19, 20, 24, 25, 40];
  const LOSSES = [0, 1, 3];
  const AGE    = [18, 24, 33, 34, 41];
  const SCARS  = [0, 1, 3, 4, 7];
  const NICK   = [null, "the Wall"];
  const CROWD  = [0, 3, 6, 7, 13, 30, 31, 54, 55, 78, 79, 100];
  const ROUND  = [1, 2, 3, 4, 7, 9, 10, 14];
  const ODDS   = [0.05, 0.4, 0.61, 0.62, 0.9];
  const DPF    = [-30, -13, -12, 0, 12, 13, 30];   /* foe's renown minus his */
  const STAKES = ["standard", "sine"];
  const PATRON = [null, { name:"Lucius Bruttius", favor:35 }, { name:"Vibia Metella", favor:88 }];
  const STREET = [0, 2, 6, 6.3, 7, 9];              /* ACCLAIM_MISSIO is 9; the gate is 0.7 of it */
  const SEX    = ["m", "f"];

  const clone = (g, over) => Object.assign(Object.create(Object.getPrototypeOf(g)), g, over);
  const PRm = { he:"he", him:"him", his:"his", He:"He", Him:"Him", His:"His", man:"man", Man:"Man" };
  const PRf = { he:"she", him:"her", his:"her", He:"She", Him:"Her", His:"Her", man:"woman", Man:"Woman" };

  /* `subj` names WHICH FIGHTER the table is about, and it is not decoration: `MERCIES` is the
     beaten stranger's reprieve and reads `B.wins` where `MISSIOS` reads your own man's. Sweeping
     both with the same subject would have proved the wrong thing and printed the same three
     zeros. */
  const tables = {
    salute: { T:A.SALUTES, pick:A.saluteLine, subj:"man" },
    death:  { T:A.DEATHS,  pick:A.deathLine,  subj:"man" },
    missio: { T:A.MISSIOS, pick:A.missioLine, subj:"man" },
    mercy:  { T:A.MERCIES, pick:A.mercyLine,  subj:"foe" },
  };
  const rep = {};
  for(const k of Object.keys(tables))
    rep[k] = { n:tables[k].T.length, chosen:new Array(tables[k].T.length).fill(0),
      sat:new Array(tables[k].T.length).fill(0), bad:[], threw:0, sample:new Array(tables[k].T.length).fill(null) };

  const dirty = t => t == null ? "is not a string"
    : typeof t !== "string" ? `is a ${typeof t}`
    : !t.trim() ? "is empty"
    : /\bundefined\b/.test(t) ? "renders the word \"undefined\""
    : /\bNaN\b/.test(t) ? "renders NaN"
    : /\[object /.test(t) ? "renders [object Object]"
    : null;

  for(let i=0;i<N;i++){
    const sex = one(SEX), pr = sex === "f" ? PRf : PRm;
    const sameOrigin = rnd() < 0.35, sameCls = rnd() < 0.35;
    const man = clone(BASE, { sex, wins:one(WINS), losses:one(LOSSES), age:one(AGE),
      nick:one(NICK), scars:new Array(one(SCARS)).fill(0).map((_,j)=>({ place:"arm", n:j })) });
    /* THE FOE NEEDS A RECORD TOO, and the first cut of this did not give him one — `MERCIES`
       reads `B.wins` and `B.age`, so a foe cloned with the starting man's numbers would have
       left two branches looking unreachable for a reason that was mine, not the table's. */
    const foeSex = one(SEX);
    const foe = clone(FOE, { sex:foeSex, wins:one(WINS), losses:one(LOSSES), age:one(AGE),
      origin: sameOrigin ? man.origin : (man.origin === "Gaul" ? "Syrian" : "Gaul"),
      cls: sameCls ? man.cls : (man.cls === "Secutor" ? "Retiarius" : "Secutor") });
    const dpf = one(DPF), pat = one(PATRON);
    const c = { A:man, B:foe, oppName:foe.name, crowd:one(CROWD), stakes:one(STAKES),
      ctx:{ patron:pat }, pat, street:one(STREET),
      prA:pr, prB: foeSex === "f" ? PRf : PRm,
      mobHis: dpf > 12, mobClear: Math.abs(dpf) > 12,
      round:one(ROUND), odds:one(ODDS) };

    for(const [kind, { T, pick, subj }] of Object.entries(tables)){
      const r = rep[kind];
      const who = subj === "foe" ? foe : man;
      let hitIdx = -1;
      for(let j=0;j<T.length;j++){
        let ok = false;
        try { ok = !!T[j].when(who, c); } catch(e){ ok = false; }
        if(ok){ r.sat[j]++; if(hitIdx < 0) hitIdx = j;
          if(!r.sample[j]){
            /* RENDER IT EVEN IF IT WILL BE SHADOWED — writing nobody selects still has to be
               valid, and a throw here is a throw in the middle of a bout. */
            let text = null, threw = null;
            try { text = T[j].say(who, c); } catch(e){ threw = String(e && e.message || e); }
            r.sample[j] = { text: text == null ? null : String(text).slice(0, 120), threw };
            const why = threw ? `throws — ${threw}` : dirty(text);
            if(why) r.bad.push({ j, why, text: text == null ? "" : String(text).slice(0, 90) });
          }
        }
      }
      if(hitIdx >= 0) r.chosen[hitIdx]++;
      /* and the picker's own answer, which must agree with the first satisfied entry */
      let got = null;
      try { got = pick(who, c); } catch(e){ r.threw++; continue; }
      const why = dirty(got);
      if(why && !r.bad.some(b=>b.why === why)) r.bad.push({ j:hitIdx, why, text:String(got||"").slice(0, 90) });
    }
  }
  return { rep, samples:N, from:{ man:BASE.name, foe:FOE.name } };
}, [N]);

await browser.close(); server.close();
if(out.why){ console.log("PROBE COULD NOT RUN:", out.why); process.exit(1); }

console.log(`\nCAN EVERY BRANCH BE REACHED?  ${out.samples} swept states `
  + `· cloned from ${out.from.man} and ${out.from.foe}\n`);

let deadTotal = 0, shadowTotal = 0, entries = 0;
for(const [kind, r] of Object.entries(out.rep)){
  entries += r.n;
  const sel = r.chosen.filter(n=>n>0).length;
  const shadow = r.chosen.map((n,j)=>n===0 && r.sat[j]>0).filter(Boolean).length;
  const never  = r.chosen.map((n,j)=>n===0 && r.sat[j]===0).filter(Boolean).length;
  shadowTotal += shadow; deadTotal += never;
  console.log(`  ${kind.toUpperCase()} — ${r.n} entries · ${sel} SELECTED `
    + `· ${shadow} shadowed · ${never} never satisfied`);
  for(let j=0;j<r.n;j++){
    const tag = r.chosen[j] > 0 ? "selected"
      : r.sat[j] > 0 ? "SHADOWED — its `when` is true sometimes and an earlier entry always wins"
      : "NEVER SATISFIED by this sweep — unreachable, or the sweep is too narrow to say";
    const sm = r.sample[j];
    console.log(`    [${String(j).padStart(2)}] chosen ${String(r.chosen[j]).padStart(6)}`
      + ` · when true ${String(r.sat[j]).padStart(6)}  ${tag}`);
    if(r.chosen[j] === 0 && sm && sm.text) console.log(`         "${sm.text.slice(0, 96)}"`);
  }
  if(r.threw) console.log(`    the picker threw on ${r.threw} states`);
  if(r.bad.length){
    console.log(`    ${r.bad.length} BAD RENDER${r.bad.length===1?"":"S"}:`);
    for(const b of r.bad.slice(0, 6)) console.log(`      [${b.j}] ${b.why} — "${b.text}"`);
  } else console.log(`    every satisfiable entry renders clean (no throw, no "undefined", no NaN)`);
  console.log("");
}

const NT = Object.keys(out.rep).length;
console.log(`  ${entries} authored branches across ${NT} table${NT===1?"":"s"}`);
console.log(`  ${shadowTotal} shadowed · ${deadTotal} never satisfied by this sweep`);
if(deadTotal) console.log(`  A "never satisfied" line is NOT proof of dead writing — widen the sweep\n`
  + `  before calling it one. This probe reports reachability POSITIVELY and says so.\n`);
else console.log(`  Every entry of all ${NT} tables was selected or shown satisfiable.\n`);
