/* THE DRAWING KNOWS WHAT THE HOUSE HAS BUILT

   Audit item #212 — "the drawing does not know the house got great" — the first of the graphics
   recommendations, and the first item of this audit that measured TRUE on the first ask.
   Rendered a founding house against a house of 260 weeks with every wing at level 4, every great
   work standing and 21,000 fame, and diffed the drawn ludus element by element:

     0 -> 20 wing-levels ............ 9 new elements, ALL OF THEM PALUS POSTS
     0 -> 9 great works standing .... 0
     fame 5 -> fame 21,000 .......... 0

   Nine works. Between them 336,500 denarii — more than the rest of the game costs put together —
   and the surface that is supposed to BE the house drew the same picture on the week they were
   paid for as on the week the doors opened. Four of the five buildings drew nothing either.

   From v3.160.0 six of the nine stand in the drawing, each where the game's own text already put
   it: the spina down the middle of the training square, the baths beside it, the chapel as the
   shrine rebuilt in stone, the school's boys under the portico, the tomb on the road out, and the
   colossus on the far verge from it. `endow`, `arena` and `capua` are not drawn and this check
   does not ask them to be — an endowment is a fund rather than a building, and the two
   amphitheatres want a horizon this frame does not have (the villa fills the top band edge to
   edge, measured). Drawing them later passes this check unchanged.

   FOUR ARMS:
   1 · EACH OF THE SIX DRAWS. The work is planted ALONE on one played house and the drawing must
       gain elements — so a work that stops drawing names itself instead of hiding in an aggregate.
   2 · AND NOT BY ACCIDENT. Every arm is diffed against the SAME house with `works` empty, so a
       shape that was always on the screen cannot be counted as a thing the money bought.
   3 · THE COUNT. At least six of the nine must move the drawing. Without this arm the check passes
       on one surviving work, which is exactly the vacuity that let #212 stand: an aggregate that
       is non-zero says nothing about what is in it.
   4 · THE WHOLE LOT. Nine standing must add at least 40 elements over none — measured 51.

   The fixture is `forge`, which throws if the planted house does not survive the load. Measured
   while this was written: roughly one reload in four landed on the app's own founding week instead,
   and a run that compared a founding house against a founding house would report 0 new elements
   and call it a pass — the same fault the item itself was written from. */
import { found, tab, clearAll, installRope, forge } from "../harness.mjs";

export const name = "stature";
export const describe = "the drawing knows what the house has built";
export const slow = true;   /* one plant, one load and one reading per work */

/* what v3.160.0 draws, and what each was measured to add on the release it shipped in */
const DRAWN = { spina:6, baths:10, chapel:8, school:13, tomb:4, colossus:10 };
const FLOOR = 3;    /* a work that draws must add at least this much — under it, it is a smudge */
const ALL_MIN = 40; /* nine standing, against none. Measured 51 */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"STATURE-1" });
  await installRope(p);

  /* ---- ONE PLAYED HOUSE, AND EVERY ARM IS THAT HOUSE ----
     The men, the week, the market and the card all put shapes in the drawing, so two houses
     cannot be diffed against each other for this — the answer would be swamped by who is
     standing in the yard. One base is built here and every arm is it with `works` replaced. */
  const base = await forge(p, (A, R) => {
    const d = A.newGameState("Stature", "clean", "STATURE-1", null);
    for(let w=0; w<40; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
    if(d.over || !A.activeG(d).length) return { why:"the fixture house did not survive 40 weeks" };
    d.works = {};
    const cost = {}; for(const k of A.ALL_WORK_KEYS) cost[k] = ((A.workDef && A.workDef(k)) || {}).cost || 0;
    return { plant:d, snap:d, keys:A.ALL_WORK_KEYS, cost, week:d.week, men:A.activeG(d).length };
  });
  if(base.why) return { pass:false, why:base.why, lines };

  const read = async () => {
    await tab(p, "ludus"); await p.waitForTimeout(360); await clearAll(p, 6);
    await tab(p, "ludus"); await p.waitForTimeout(280);
    return p.evaluate(()=>{
      const svg = document.querySelector('svg[aria-label^="The ludus"]');
      if(!svg) return null;
      return [...svg.querySelectorAll("*")].map(n =>
        `${n.tagName}[${[...n.attributes].filter(x=>x.name!=="key").map(x=>`${x.name}=${x.value}`).sort().join(" ")}]`);
    });
  };

  const bare = await read();
  if(!bare) return { pass:false, why:"no drawn ludus on the ludus tab — there is nothing to measure", lines };
  lines.push(`a played house at week ${base.week} with ${base.men} men · ${bare.length} elements with nothing built`);
  const was = new Set(bare);

  /* one work at a time, then all of them */
  const plant = async (works) => {
    await forge(p, (A, R, arg) => { const d = arg.d; d.works = arg.w; return d; },
      { d: base.snap, w: works });
    return read();
  };
  const only = k => ({ [k]: { left:0, began:1, paid:1, owed:0, idle:0 } });

  const got = {};
  for(const k of base.keys){
    const sig = await plant(only(k));
    got[k] = sig ? sig.filter(x=>!was.has(x)).length : -1;
  }
  const every = {}; for(const k of base.keys) every[k] = { left:0, began:1, paid:1, owed:0, idle:0 };
  const allSig = await plant(every);
  const allNew = allSig ? allSig.filter(x=>!was.has(x)).length : -1;

  const drew = base.keys.filter(k=>got[k] >= FLOOR);
  lines.push(`  ${base.keys.map(k=>`${k} +${got[k]}`).join(" · ")}`);
  lines.push(`  ${drew.length} of ${base.keys.length} works mark the drawing · all nine standing adds ${allNew}`);

  /* 1 and 2 — each of the six draws, against the same house with nothing built */
  for(const [k, want] of Object.entries(DRAWN)){
    if(got[k] == null) bad.push(`\`${k}\` is not a work any more — this check is out of date with WORKS`);
    else if(got[k] < FLOOR)
      bad.push(`\`${k}\` standing adds ${got[k]} elements to the drawn ludus (it added ${want} at v3.160.0) — `
        + `the house paid ${(base.cost[k]||0).toLocaleString()} denarii for something nobody can see, `
        + `which is the whole of #212`);
  }
  /* 3 — and the count, or arm 1 passes on whatever happens to survive */
  if(drew.length < Object.keys(DRAWN).length)
    bad.push(`only ${drew.length} of the ${base.keys.length} great works move the drawing — six did at v3.160.0, `
      + `and a check that accepts fewer is an aggregate again`);
  /* 4 — the whole lot */
  if(allNew < ALL_MIN)
    bad.push(`a house with every great work standing draws ${allNew} elements a house with none does not — `
      + `it was 0 before v3.160.0 and 51 after, and under ${ALL_MIN} something has been taken out`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`every work the game says is on the ground is on the ground`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
