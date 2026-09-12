/* A MAN'S OWN NAME IN A TOWN — #274

   (`following` was free in BOTH directories; checked before writing.)

   ---- THE ITEM SET ITS OWN FALSIFICATION CLAUSE AND IT RESOLVED THE OTHER WAY ----
   #274: "If a tourer fights evenly across the three towns, a per-town following is three numbers
   that move together and buys nothing over `pfame`; if it concentrates, the system has a place to
   live."

   `probes/following.mjs`, 16 houses x 420 weeks an arm. The touring HOUSE does fight evenly —
   **capua 24% · pompeii 26% · neapolis 27% · puteoli 23%** — and its MEN do not. Each man's town
   mix sits a median **0.47** in total variation from his own house's, against **0.14** for the same
   men re-drawn from that house's mix: **+0.33 over the sampling**, which is the only reading that
   means anything (a man with six bouts across four towns looks concentrated by chance). Under
   `stay` and under a house that never leaves, the same figure is +0.00 and +0.02 — there the men
   ARE their house, and the house's own `knownIn` already carries it.

   TWO OF THE ITEM'S CITATIONS ARE WRONG. `probes/capua.mjs` splits home against away and never by
   WHICH town, so the figure the clause turns on had never been measured at all. And the `tour`
   lever goes "to whichever of the three towns knows the house least" — it EQUALISES BY
   CONSTRUCTION, so reading an even split out of it would be reading the policy back out of itself.

   ---- WIRED TO ONE THING, DELIBERATELY ----
   A following is gained where he fights (`cityAfter`, the singles caller only) and bled where he is
   not (`bayWeek`, the house's own clock and rate), into a lower ceiling than a school's. It is read
   by exactly ONE roll: the editor's box in `missioScore`, beside `ctx.favor`, which is already the
   HOUSE's local standing away — the item's own sentence is that the missio away "reads the man's
   local name as well as the house's". Inside `MISSIO_CAP` with everything else, and 0 at Capua,
   where a man's name IS his renown.

   FIVE ARMS. */
import { hasHandle } from "../harness.mjs";

export const name = "following";
export const describe = "a man's name is built where he fights, bled where he is not, and read by the missio away";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["manFollow","manBestTown","MAN_FOLLOW_CAP","cityAfter","bayWeek","missioScore",
      "knownIn","BAY_DECAY","CITY_KEYS","newGameState","genGladiator","MISSIO_CAP"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const T = A.CITY_KEYS;

    const house = (seed)=>{
      const d = A.newGameState("Fo","clean",seed,null);
      d.gold = 40000; d.week = 60;
      d.gladiators = [];
      for(let i=0;i<3;i++){ const m = A.genGladiator(d, 70); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.fatigue=0; m.lastFought=-9; d.gladiators.push(m); }
      return d;
    };

    /* ---- 1. built where he fights, and only for the man who fought ---- */
    const d = house("FO_GAIN");
    const [a, b] = d.gladiators;
    const offer = { city:T[0], tier:1 };
    const sum = [];
    A.cityAfter(d, offer, { won:true, theirDead:false, spared:false, vigour:70, crowd:60 }, sum, [a]);
    const built = { him:A.manFollow(a, T[0]), other:A.manFollow(b, T[0]),
      house:A.knownIn(d, T[0]), elsewhere:A.manFollow(a, T[1]) };

    /* ---- 2. and bled where he is not ---- */
    d.city = T[1];                                  /* the house moves on */
    const was = A.manFollow(a, T[0]);
    A.bayWeek(d);
    const bled = { was, now:A.manFollow(a, T[0]), rate:A.BAY_DECAY,
      hereWas:A.manFollow(a, T[1]) };
    /* and it does not bleed in the town he is standing in */
    A.cityAfter(d, { city:T[1], tier:1 }, { won:true, theirDead:false, spared:false, vigour:70, crowd:60 }, [], [a]);
    const hereBefore = A.manFollow(a, T[1]);
    A.bayWeek(d);
    const here = { before:hereBefore, after:A.manFollow(a, T[1]) };

    /* ---- 3. the ceiling ---- */
    const capped = (()=>{ const e = house("FO_CAP"); const g = e.gladiators[0];
      for(let i=0;i<200;i++)
        A.cityAfter(e, { city:T[0], tier:1 }, { won:true, theirDead:true, spared:false, vigour:90, crowd:95 }, [], [g]);
      return { man:A.manFollow(g, T[0]), cap:A.MAN_FOLLOW_CAP, house:A.knownIn(e, T[0]) }; })();

    /* ---- 4. THE ONE ROLL THAT READS IT ---- */
    const ctx = { favor:30, fav:0, patron:null, man:0, day:0, street:0, tier:1,
      guarded:false, aedile:0, venue:0, doctrine:0, hostile:false, strange:0 };
    const man = { pfame:40, wins:9, losses:3, sho:40, heart:50, mods:{} };
    const score = t => A.missioScore(man, Object.assign({}, ctx, { hisTown:t }), 60, 50, 20, true);
    const missio = { none:score(0), some:score(20), full:score(A.MAN_FOLLOW_CAP), cap:A.MISSIO_CAP };
    /* AND THE CAP IS THE POINT, not a formality. `box` is `Math.min(MISSIO_CAP, ...)`, so a man
       already famous enough to fill it on `pfame` alone gains NOTHING from a local name — the
       following matters for the man Capua has not heard of, which is the one it is about. */
    const famous = { pfame:400, wins:40, losses:8, sho:40, heart:50, mods:{} };
    const fScore = t => A.missioScore(famous, Object.assign({}, ctx, { hisTown:t }), 60, 50, 20, true);
    const rich = { none:fScore(0), full:fScore(A.MAN_FOLLOW_CAP) };
    /* and it must not reach a bout that is not his own */
    const notHis = A.missioScore(man, Object.assign({}, ctx, { hisTown:A.MAN_FOLLOW_CAP }), 60, 50, 20, false);
    const notHisNone = A.missioScore(man, Object.assign({}, ctx, { hisTown:0 }), 60, 50, 20, false);

    /* ---- 5. the sheet's own pick ---- */
    const best = (()=>{ const e = house("FO_BEST"); const g = e.gladiators[0];
      g.known = {}; g.known[T[0]] = 9; g.known[T[1]] = 31; g.known[T[2]] = 2;
      return { pick:A.manBestTown(g), none:A.manBestTown(e.gladiators[1]) }; })();

    return { built, bled, here, capped, missio, rich, notHis, notHisNone, best, towns:T };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };

  const lines = [], fails = [];
  const B = out.built, D = out.bled, C = out.capped, M = out.missio;
  lines.push(`one bout at ${out.towns[0]}: he gains ${B.him}, the man beside him ${B.other}, the house ${B.house}, and he gains ${B.elsewhere} elsewhere`);
  lines.push(`the house moves on: ${D.was} → ${D.now} (bleeds ${D.rate}/wk) · and in the town he is standing in ${out.here.before} → ${out.here.after}`);
  lines.push(`200 bouts in one town: the man reaches ${C.man} of ${C.cap} (the house ${C.house} of 100)`);
  lines.push(`the missio, a man of 40 renown: no name ${M.none.toFixed(1)} · half ${M.some.toFixed(1)} · full ${M.full.toFixed(1)}`);
  lines.push(`   and a man of 400, whose box is already at the ${M.cap} cap: ${out.rich.none.toFixed(1)} → ${out.rich.full.toFixed(1)} (no change is the point)`);
  lines.push(`the sheet picks: ${JSON.stringify(out.best.pick)} · a man known nowhere → ${JSON.stringify(out.best.none)}`);

  /* ---- 1. built where he fights ---- */
  if(!(B.him > 0)) fails.push("a bout in a town built the man nothing at all");
  if(B.other !== 0)
    fails.push(`the man who did not fight gained ${B.other} — a following is his own, not the roster's`);
  if(B.elsewhere !== 0) fails.push(`a bout at ${out.towns[0]} built his name at ${out.towns[1]}`);
  if(!(B.house > 0)) fails.push("the house's own standing stopped being built when the man's was added");

  /* ---- 2. bled where he is not ---- */
  if(!(D.now < D.was)) fails.push(`his name at ${out.towns[0]} stood at ${D.now} after a week away from it`);
  if(Math.abs((D.was - D.now) - D.rate) > 0.001)
    fails.push(`his name bled ${(D.was - D.now).toFixed(2)} against the house's own ${D.rate} — same clock, same rate`);
  if(out.here.after !== out.here.before)
    fails.push(`his name bled in the town he is standing in: ${out.here.before} → ${out.here.after}`);

  /* ---- 3. the ceiling, lower than a school's ---- */
  if(C.man > C.cap) fails.push(`a man reached ${C.man}, past MAN_FOLLOW_CAP ${C.cap}`);
  if(!(C.man >= C.cap - 0.001)) fails.push(`200 bouts in one town left him at ${C.man}, short of the ${C.cap} ceiling`);
  if(!(C.cap < 100)) fails.push(`a man's ceiling is ${C.cap} — it is supposed to be lower than a house's 100`);

  /* ---- 4. THE ONE ROLL ---- */
  if(!(M.some > M.none)) fails.push(`a name in the town moved the missio box ${M.none} → ${M.some}, which is nothing`);
  if(!(M.full > M.some)) fails.push("the box does not keep rising with the name");
  /* the cap's own consequence: a man who already fills the box on renown gains nothing */
  if(out.rich.full !== out.rich.none)
    fails.push(`a man of 400 renown, whose box is already at the ${M.cap} ceiling on renown alone, moved ` +
      `${out.rich.none} → ${out.rich.full} on a local name — the following is for the man the town has ` +
      `not heard of, and \`Math.min(MISSIO_CAP, …)\` is what keeps it there`);
  if(out.notHis !== out.notHisNone)
    fails.push(`the OTHER man's roll moved with this man's following (${out.notHisNone} → ${out.notHis}) — ` +
      `\`own === false\` is the opponent's side of the box and his local name is not in it`);

  /* ---- 5. the sheet shows the one that differs ---- */
  { const b = out.best.pick;
    if(!b) fails.push("a man known 31 in one town and 9 in another has no best town");
    else {
      if(b.town !== out.towns[1]) fails.push(`the sheet picked ${b.town} over the ${out.towns[1]} he is best known in`);
      if(Math.abs(b.n - 31) > 0.001) fails.push(`the sheet reports ${b.n} where the man carries 31`);
    }
    if(out.best.none) fails.push(`a man known in no town at all reports ${JSON.stringify(out.best.none)}`); }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
