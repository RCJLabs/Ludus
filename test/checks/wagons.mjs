/* WHAT THE ROAD COSTS THE MEN — #280

   (`wagons` was free in BOTH directories; checked before writing.)

   #268 refused to put content on the road because its risk note said that decides the ceiling
   question before anyone has decided it. Measured paired at v3.276.0 — same seeds to both arms,
   40 houses x 420 weeks, `tour:true` against `road:false` — the ceiling resolved the other way:

       median life  62w against 53w   ·  gold 404 against 111  ·  bouts 62 against 42
       men freed   165 against 46     ·  `closed` 10 of 40 against 0 of 40

   The road was not thin and underpaid; it was thin and WINNING, because eleven of the week's
   thirty-six cards are things that go wrong and skipping a question is skipping a problem. And
   nothing on the road touched the men: the same house standing away ran **regard +17.6, morale
   +17.0, defiance -12.0, unrest -2.8** against itself at home.

   `wagonWeek` prices it. Six arms, and the first two are the design, not the numbers:

     1 · it is keyed to weeks away from CAPUA, so moving town to town does NOT reset it. This is
         the property the whole thing turns on: `tour:true` breaks camp the same week and goes to
         the next town, which is exactly how a house dodges `welcomeOf` — a cost that reset on
         departure would be dodged by construction and measure as free.
     2 · the first `ROAD_FRESH` weeks are free, so a tour is untouched and an emigration bleeds.
     3 · past that, morale falls and defiance rises at the declared rates, exactly.
     4 · coming home clears it, and clears the line's once-per-departure latch with it.
     5 · it says so ONCE per departure, not every week of a fifty-week tour — #101's wallpaper rule.
     6 · AND IT DRAWS NO `R()`. A weekly cost that moved the stream would re-phase every seeded
         fixture in this suite; that is the arm that keeps the other two hundred honest. */
import { hasHandle } from "../harness.mjs";

export const name = "wagons";
export const describe = "the road wears on the familia, keyed to weeks away from Capua and not to which town";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["newGameState","endWeek","activeG","setOut","comeHome","wagonWeek","roadWeeks",
      "roadWear","ROAD_FRESH","ROAD_BITE","ROAD_EDGE","CITY_KEYS","rngGet","rngSet"]
      .filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

    /* a house standing in a town, without playing a single week through the die */
    const put = (town, weeksOut) => {
      const d = A.newGameState("Wg","clean",`WAGON-${town}-${weeksOut}`);
      d.gladiators.forEach(g=>{ if(g.status==="active"){ g.morale = 70; g.defiance = 30; } });
      d.flags.leftCapua = d.week;
      d.city = town; d.travel = null;
      d.week += weeksOut;
      return d;
    };
    const mean = (d, k) => { const m = A.activeG(d); return m.length
      ? m.reduce((n,g)=>n + (k === "morale" ? (g.morale==null?50:g.morale) : (g.defiance||0)), 0) / m.length
      : null; };

    /* ---- 1. moving town to town does not reset it ---- */
    const d1 = put(A.CITY_KEYS[0], 0);
    d1.week += 10;
    const beforeMove = A.roadWeeks(d1);
    A.setOut(d1, A.CITY_KEYS[1]);          /* break camp for the next town */
    d1.travel = null; d1.city = A.CITY_KEYS[1];
    const afterMove = A.roadWeeks(d1);

    /* and coming HOME does clear it */
    const d1b = put(A.CITY_KEYS[0], 12);
    A.comeHome(d1b);
    let guard = 0;
    while(d1b.travel && guard++ < 8){ try { A.endWeek(d1b); } catch(e){ break; } }
    const afterHome = A.roadWeeks(d1b);
    const flagGone = (d1b.flags||{}).leftCapua == null;

    /* ---- 2/3. free for ROAD_FRESH, then exact ---- */
    const bite = [];
    for(const out of [0, A.ROAD_FRESH, A.ROAD_FRESH + 1, A.ROAD_FRESH + 5]){
      const d = put(A.CITY_KEYS[0], out);
      const m0 = mean(d, "morale"), f0 = mean(d, "defiance");
      A.wagonWeek(d);
      bite.push({ out, wear:A.roadWear(d),
        dMor:+((mean(d,"morale") - m0).toFixed(3)),
        dDef:+((mean(d,"defiance") - f0).toFixed(3)) });
    }

    /* ---- 5. the line, once ---- */
    const d5 = put(A.CITY_KEYS[0], A.ROAD_FRESH + 2);
    const said = [];
    for(let i=0;i<6;i++){
      const n0 = (d5.log||[]).length;
      A.wagonWeek(d5);
      said.push((d5.log||[]).length - n0);
      d5.week++;
    }

    /* ---- 6. and it draws no R() ---- */
    const d6 = put(A.CITY_KEYS[0], A.ROAD_FRESH + 4);
    const st = A.rngGet();
    A.wagonWeek(d6);
    const after = A.rngGet();
    const drew = JSON.stringify(st) !== JSON.stringify(after);

    /* a house AT HOME pays nothing */
    const d7 = A.newGameState("Wg","clean","WAGON-HOME");
    d7.week += 40;
    const hm0 = mean(d7, "morale");
    A.wagonWeek(d7);
    const homeCost = +((mean(d7,"morale") - hm0).toFixed(3));

    return { beforeMove, afterMove, afterHome, flagGone, bite, said, drew, homeCost,
      FRESH:A.ROAD_FRESH, BITE:A.ROAD_BITE, EDGE:A.ROAD_EDGE };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };

  const lines = [], fails = [];

  lines.push(`1. town to town: ${out.beforeMove}w away before the move, ${out.afterMove}w after `
    + `— it does not reset · coming home: ${out.afterHome}w, flag cleared ${out.flagGone}`);
  if(out.afterMove < out.beforeMove)
    fails.push(`breaking camp for the next town reset the wear (${out.beforeMove}w -> ${out.afterMove}w) `
      + `— that is how \`welcomeOf\` is dodged, and a cost keyed that way is free to the tour policy`);
  if(out.afterHome !== 0 || !out.flagGone)
    fails.push(`coming home left ${out.afterHome}w of wear standing (flag cleared: ${out.flagGone})`);

  for(const b of out.bite)
    lines.push(`2. ${String(b.out).padStart(2)}w away (wear ${b.wear}): morale ${b.dMor >= 0 ? "+" : ""}${b.dMor} `
      + `· defiance ${b.dDef >= 0 ? "+" : ""}${b.dDef}`);
  const free = out.bite.filter(b=>b.out <= out.FRESH);
  for(const b of free) if(b.dMor !== 0 || b.dDef !== 0)
    fails.push(`${b.out} weeks out is inside the free ${out.FRESH} and still cost morale ${b.dMor}, defiance ${b.dDef}`);
  const paid = out.bite.filter(b=>b.out > out.FRESH);
  if(!paid.length) fails.push("no arm past the free window — the rates were never tested");
  for(const b of paid){
    if(Math.abs(b.dMor + out.BITE) > 0.02)
      fails.push(`${b.out}w out moved morale ${b.dMor}, and ROAD_BITE says ${-out.BITE}`);
    if(Math.abs(b.dDef - out.EDGE) > 0.02)
      fails.push(`${b.out}w out moved defiance ${b.dDef}, and ROAD_EDGE says ${out.EDGE}`);
  }

  lines.push(`4. a house standing in Capua for 40 weeks pays ${out.homeCost} morale`);
  if(out.homeCost !== 0) fails.push(`the wagons wore on a house that never left Capua (${out.homeCost})`);

  lines.push(`5. the line over six worn weeks: ${out.said.join(", ")} entries`);
  if(out.said[0] !== 1) fails.push(`the first worn week wrote ${out.said[0]} chronicle lines, not 1`);
  if(out.said.slice(1).some(n=>n !== 0))
    fails.push(`it spoke again on a later week (${out.said.join(", ")}) — a line every week of a `
      + `fifty-week tour is #101's wallpaper fault`);

  lines.push(`6. the die: ${out.drew ? "MOVED" : "untouched"} across a wagonWeek`);
  if(out.drew)
    fails.push(`\`wagonWeek\` drew from R() — a weekly cost on the stream re-phases every seeded `
      + `fixture in this suite`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
