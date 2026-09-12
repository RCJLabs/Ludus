/* WHAT THE ROAD IS NOT, AND THE LIST THAT SAYS SO — #268

   (`camp` was free in BOTH directories; checked before writing. `probes/camp.mjs` is the
   instrument and shares the name on the usual convention.)

   ---- THE ITEM'S NUMBER, AND WHAT THE MEASUREMENT SAID ----
   #268: "the road has cards and nothing else — count the die: of the 36 drawn events, how many
   `make()` gates return null on `d.city`." Counted (`probes/camp.mjs`, each key asked four times
   off ONE saved stream position — at home, in a town, on the road between towns, and at Rome, so
   the only thing that differs is where the house is standing):

     ELEVEN refuse away.  TWENTY-FIVE fire at rates identical to the decimal.

   **The die is two thirds intact on the road, not empty.** And nothing in it tells a town from the
   road between towns from Rome: town, road and Rome are the same column in every row of that
   table. All eleven carry the same guard in the same place — the first line of `make` — which is
   why `awayFromCapua` now has a name and the eleven have a list.

   TWO OF THE ITEM'S FOUR HEADLINE NUMBERS ARE ROPE COUNTERS, not gates. `did.feast` 284 -> 12 is an
   action with NO city gate anywhere — not in `throwFeast`, not on its button; it works on the road
   and always did. `did.walk` 364 -> 8 is a real gate, and it is the bigger one the item did not
   name: `walkTheCells` is the only caller of `pickNight`, so its gate is the whole of the road's
   access to the five-card night deck.

   ---- SAMPLING CANNOT CLOSE THIS, AND THE SECOND ARM IS WHY ----
   Thirteen of the thirty-six were never eligible at home in any sampled state, so no paired test
   can classify them — and "8 of 23" with a denominator of 36 is the fault this audit keeps
   catching. So the question is asked of the code as well: `make` is handed a Proxy that records
   every top-level key it reads, and a body that never reads `city`, `travel` or `rome` in ANY
   sampled state cannot be home-only whatever its eligibility. The union over all samples is the
   answer, because an early `return null` can hide a later read.

   FIVE ARMS.
     1 · THE LIST IS THE BEHAVIOUR — every key in `EV_HOME` refuses away, every key outside it that
         was eligible at home was eligible away at the same rate. The list cannot drift from the
         guards without this going red, which is the whole reason it is allowed to be a list.
     2 · AND NOTHING ELSE EVEN ASKS — the Proxy, over all 36, covering the ones sampling cannot.
     3 · ONE BINARY, NOT A GEOGRAPHY — town, road and Rome agree on every key.
     4 · THE PANEL PRINTS THE TABLES' OWN NUMBERS — #150's rule; lift a guard and the figure falls.
     5 · AND IT IS ON THE SCREEN. */
import { hasHandle, found, clearAll, tab, settle } from "../harness.mjs";

export const name = "camp";
export const describe = "the road is two thirds of the die, the list of what it is not is the behaviour, and the panel counts it";

const HOUSES = 3, WEEKS = 130, STRIDE = 10;

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(([H, W, STRIDE])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["EVENTS","EV_DRAWN","EV_HOME","awayFromCapua","roadSays","NIGHT_KEYS","pickNight",
      "walkReady","throwFeast","rngGet","rngSet","newGameState","CITY_KEYS","cellsAwaySays"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const cp = x => JSON.parse(JSON.stringify(x));
    const KEYS = A.EV_DRAWN.slice(), TOWN = A.CITY_KEYS[0];

    const WHERE = {
      home: d => { d.city = null; d.travel = null; d.rome = null; },
      town: d => { d.city = TOWN; d.travel = null; d.rome = null; },
      road: d => { d.city = null; d.rome = null; d.travel = { to:TOWN, weeks:2, home:false }; },
      rome: d => { d.city = null; d.travel = null; d.rome = { travel:0, fought:0, won:0 }; },
    };
    const PLACES = Object.keys(WHERE);
    const row = {}; for(const k of KEYS){ row[k] = {}; for(const q of PLACES) row[k][q] = 0; }
    const consult = {}; for(const k of KEYS) consult[k] = { asks:false, enumerated:false };
    let samples = 0;

    for(let i=0;i<H;i++){
      const d = A.newGameState("Cp","clean",`CAMPCHK-${i}`);
      for(let w=0; w<W; w++){
        if(d.over) break;
        if(w % STRIDE === 0 && w >= STRIDE){
          const st0 = A.rngGet(); samples++;
          for(const k of KEYS){
            /* the Proxy ask, on a house that is at home so the guard is reached rather than
               short-circuited by something earlier in the body */
            const at = A.rngGet(), seen = new Set(); let enumerated = false;
            const base = cp(d); WHERE.home(base);
            const px = new Proxy(base, {
              get(t, key){ if(typeof key === "string") seen.add(key); return t[key]; },
              ownKeys(t){ enumerated = true; return Reflect.ownKeys(t); } });
            try { A.EVENTS[k].make(px); } catch(e){}
            if(seen.has("city") || seen.has("travel") || seen.has("rome")) consult[k].asks = true;
            if(enumerated) consult[k].enumerated = true;
            /* and the paired ask, four places off one position */
            for(const q of PLACES){
              A.rngSet(at);
              const e = cp(d); WHERE[q](e);
              let got = null; try { got = A.EVENTS[k].make(e); } catch(err){ got = null; }
              if(got) row[k][q]++;
            }
          }
          A.rngSet(st0);
        }
        try { R.lanista(d, {}); } catch(e){}
        try { A.endWeek(d); } catch(e){ break; }
      }
    }

    /* ---- the night deck's one door, and the feast that has none ---- */
    const doors = (()=>{
      const d = A.newGameState("Cp","clean","CAMPDOOR");
      d.gold = 40000; d.week = 40;
      for(let i=0;i<4;i++){ const m = A.genGladiator(d, 70); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.fatigue=0; m.lastFought=-9; d.gladiators.push(m); }
      d.lastFeast = -9; d.flags.walkWk = -99;
      const atHome = { walk:A.walkReady(d), night:!!A.pickNight(d), feast:null };
      const h = cp(d); atHome.feast = A.throwFeast(h) === true;
      const e = cp(d); e.city = TOWN;
      const away = { walk:A.walkReady(e), night:!!A.pickNight(e), feast:A.throwFeast(e) === true };
      return { atHome, away };
    })();

    return { KEYS, row, consult, samples, places:PLACES,
      declared:A.EV_HOME.slice(), drawn:A.EV_DRAWN.length, nights:A.NIGHT_KEYS.length,
      says:A.roadSays(), cellsSays:A.cellsAwaySays(), doors };
  }, [HOUSES, WEEKS, STRIDE]);

  if(out.why) return { pass:false, why:out.why, lines:[] };

  /* ---- 5. and it reaches the screen ---- */
  await found(p);
  await clearAll(p, 10);
  /* TWO FACES, BECAUSE THE TWO FACTS WENT TO THE TWO PLACES THEY ARE MET. The die's count is on the
     circuit panel, where a tour is chosen; the night deck is in the cells section, beside the walk
     that is its only door. `scroll` forced that split — both on the arena cost 26px of a face with
     16px of headroom — and it is the better arrangement, so the check reads both. */
  await tab(p, "arena"); await p.waitForTimeout(400); await clearAll(p, 8); await settle(p);
  await p.evaluate(()=>{ for(const d of document.querySelectorAll("details")) d.open = true; });
  await p.waitForTimeout(300);
  const screen = await p.evaluate(()=>{
    const body = (document.body.innerText||"").replace(/\s+/g," ");
    const m = /(\d+) of the week's (\d+) questions never come up/i.exec(body);
    return { hit:!!m, shut:m?+m[1]:null, drawn:m?+m[2]:null,
      tabs:[...document.querySelectorAll("button[role=tab]")].map(b=>b.getAttribute("aria-label")),
      sample: body.slice(0, 160) };
  });

  const lines = [], fails = [];
  const shutIn = q => out.KEYS.filter(k=>out.row[k].home > 0 && out.row[k][q] === 0);
  const liveHome = out.KEYS.filter(k=>out.row[k].home > 0);
  const asks = out.KEYS.filter(k=>out.consult[k].asks);

  lines.push(`${out.samples} paired asks per key over ${out.KEYS.length} drawn events`);
  lines.push(`declared EV_HOME (${out.declared.length}): ${out.declared.join(", ")}`);
  lines.push(`makes that ask where the house is (${asks.length}): ${asks.join(", ")}`);
  lines.push(`eligible at home in this sample: ${liveHome.length} · of those, shut in town ${shutIn("town").length}, ` +
    `on the road ${shutIn("road").length}, at Rome ${shutIn("rome").length}`);
  lines.push(`the night deck's door: at home walk ${out.doors.atHome.walk}, a night to turn up ${out.doors.atHome.night}, feast ${out.doors.atHome.feast}`);
  lines.push(`   in a town: walk ${out.doors.away.walk}, a night to turn up ${out.doors.away.night}, feast ${out.doors.away.feast}`);
  lines.push(`the circuit panel says: ${out.says}`);
  lines.push(`the cells section says, away: ${out.cellsSays}`);
  lines.push(screen.hit
    ? `on the screen (arena): ${screen.shut} of ${screen.drawn} questions`
    : `on the screen: NOT FOUND · tabs=${JSON.stringify(screen.tabs)} · "${screen.sample}"`);

  /* ---- 1. the list is the behaviour ---- */
  { const declared = new Set(out.declared);
    for(const k of out.declared){
      if(!out.KEYS.includes(k)) fails.push(`EV_HOME names "${k}", which the die does not draw at all`);
      else for(const q of ["town","road","rome"])
        if(out.row[k][q] > 0)
          fails.push(`EV_HOME declares "${k}" needs Capua and it fired ${out.row[k][q]} times with the house in the ${q} — the list and the guard have come apart`);
    }
    for(const k of out.KEYS){
      if(declared.has(k)) continue;
      if(out.row[k].home === 0) continue;                    /* arm 2 covers what sampling cannot */
      for(const q of ["town","road","rome"])
        if(out.row[k][q] !== out.row[k].home)
          fails.push(`"${k}" is not in EV_HOME but fired ${out.row[k].home} times at home against ${out.row[k][q]} in the ${q}, ` +
            `off the same stream position — either it has grown a location gate nobody declared, or the list is short`);
    }
    if(!out.declared.length) fails.push("EV_HOME is empty — the panel's figure is counting nothing"); }

  /* ---- 2. and nothing outside the list even asks ---- */
  for(const k of asks){
    if(out.consult[k].enumerated) continue;                  /* a whole-state read is not a gate */
    if(!out.declared.includes(k))
      fails.push(`"${k}"'s make() reads where the house is standing and it is not in EV_HOME — ` +
        `sampling cannot classify a card whose gate never opens, which is exactly what this arm is for`);
  }
  for(const k of out.declared)
    if(!out.consult[k].asks)
      fails.push(`EV_HOME names "${k}" but its make() never once read city, travel or rome in ${out.samples} states`);

  /* ---- 3. one binary, not a geography ---- */
  { const t = shutIn("town").join("|"), r = shutIn("road").join("|"), m = shutIn("rome").join("|");
    if(t !== r) fails.push(`the die tells a town from the road: shut in town [${t}] against [${r}] on the road`);
    if(t !== m) fails.push(`the die tells a town from Rome: shut in town [${t}] against [${m}] at Rome`); }

  /* ---- 4. the panel prints the tables' own numbers ---- */
  { for(const n of [out.declared.length, out.drawn])
      if(!new RegExp(`\\b${n}\\b`).test(out.says))
        fails.push(`\`roadSays\` does not carry ${n} — "${out.says}"`);
    if(!new RegExp(`\\b${out.nights}\\b`).test(out.cellsSays))
      fails.push(`\`cellsAwaySays\` does not carry the ${out.nights} in NIGHT_KEYS — "${out.cellsSays}"`);
    for(const [what, str] of [["roadSays", out.says], ["cellsAwaySays", out.cellsSays]])
      if(/\b0\b/.test(str)) fails.push(`\`${what}\` printed a zero: "${str}"`); }

  /* ---- the night deck has one door, and the feast is not it ---- */
  { const D = out.doors;
    if(!D.atHome.walk) fails.push("the fixture could not walk the cells at home, so the arm below proves nothing");
    else {
      if(D.away.walk) fails.push("walkReady is true with the house in a town — the road's gate on the night deck has moved");
      if(!D.atHome.night) fails.push("pickNight turned up nothing for a house of four at home — the deck the panel counts is not reachable");
    }
    if(!D.atHome.feast) fails.push("the fixture could not throw a feast at home");
    if(!D.away.feast)
      fails.push("the feast refused on the road — #268 measured it ungated in both `throwFeast` and its button, " +
        "and the line the cells section now prints (\"The tables travel with the familia\") is only true while that holds"); }

  /* ---- 5. on the screen ---- */
  if(!screen.hit)
    fails.push("the road panel's cost line is not on screen — `roadSays` is rendered nowhere a player can reach");
  else {
    if(screen.shut !== out.declared.length)
      fails.push(`the screen says ${screen.shut} cards shut against the ${out.declared.length} in EV_HOME`);
    if(screen.drawn !== out.drawn)
      fails.push(`the screen says ${screen.drawn} drawn events against the ${out.drawn} in EV_DRAWN`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
