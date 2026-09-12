/* THE BENCH THAT WAS BUILT AND NEVER REACHED — #270

   (`bench` was free in BOTH directories; checked before writing.)

   #270 proposed a new system: keep a freed or retired champion on as the house's own man. **It was
   already built.** `FREEDMEN.doctore` — "He comes back to teach" — makes a doctore whose skill is
   `40 + his own wins * 2.2`, charges no fee, flags him `fromHouse`, gives him a past line naming
   his wins under your colours, and moves every standing man +9 morale and +7 regard. That is the
   item's proposal, shipped, down to the Risk note's requirement that the man be YOURS.

   IT HAD NEVER ONCE HAPPENED. `probes/bench.mjs`, 16 houses x 1,893 weeks under a complete player:
   a freed or retired man was waiting in **68.4% of weeks**, and this outcome fired **0 times** —
   0 of the 25 freedman outcomes that did fire, and **0 of 16 houses**.

   A CONJUNCTION MUST BE SPLIT BY TERM BEFORE ANYTHING CAN BE FIXED. `need` was
   `!d.doctore && f.wins >= 8`, and of the 1,294 weeks a man was waiting:

       a waiting man had 8+ wins    986  (76.2%)
       the chair was EMPTY           53  ( 4.1%)
       both at once                   7  (0.4% of all weeks)

   The wins term was never holding it. A house that can afford a doctore has one, so the door asked
   for a coincidence. After the repair, two independent seed sets: **2 of 16 and 1 of 16 houses**
   put their own man in the chair. Rare, and rare by DESIGN now rather than by a shut door — `pick`
   over the waiting pool is uniform and only 30-37% of that pool ever had eight wins.

   ---- AND THE EVENT'S STUB DROPPED THE TWO FIELDS THE OUTCOMES READ ----
   `data.man` carried `{ name, wins, cls }`; the run bodies read `f.age` and `f.regardAt`. So:
     · `doctore` — "#251: his years are his own, not the market's" could never fire;
     · `lanista` — `const bitter = f.regardAt != null && f.regardAt < 45` was ALWAYS false, so a man
       freed grudgingly always set up his yard without a grudge, in an outcome that DOES fire.
   Both are driven directly here rather than waited for: a branch that needs a 0.4%-a-week event to
   fire is a branch no check should be hoping to catch.

   FIVE ARMS. */
import { hasHandle } from "../harness.mjs";

export const name = "bench";
export const describe = "a freed champion can take the doctore's post whether or not the chair is filled, and the choice is the player's";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["FREEDMEN","FM_KEYS","freedWeek","EVENTS","newGameState","makeDoctore","activeG",
      "regardOf"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

    const house = (seed, over)=>{
      const d = A.newGameState("Bc","clean",seed,null);
      d.gold = 20000; d.week = 60;
      for(let i=0;i<4;i++){ const m = A.genGladiator(d, 70); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.fatigue=0; m.lastFought=-9; d.gladiators.push(m); }
      Object.assign(d, over||{});
      return d;
    };
    const champ = (over)=>Object.assign({ name:"Verax, the Gaul", week:20, wins:22, cls:"murmillo",
      age:29, regardAt:70 }, over||{});

    /* ---- 1. the gate, split by term, both ways round ---- */
    const D = A.FREEDMEN.doctore;
    const gate = {
      emptyChairGoodMan: D.need(house("BC1"), champ()),
      fullChairGoodMan:  D.need(house("BC2", { doctore:A.makeDoctore(house("BCX"), 55) }), champ()),
      emptyChairPoorMan: D.need(house("BC3"), champ({ wins:3 })),
      fullChairPoorMan:  D.need(house("BC4", { doctore:A.makeDoctore(house("BCY"), 55) }), champ({ wins:3 })),
    };

    /* ---- 2. the choice ---- */
    const empty = house("BC5"), full = house("BC6", { doctore:A.makeDoctore(house("BCZ"), 55) });
    const asks = { empty:D.ask(empty, champ()), full:D.ask(full, champ()) };

    /* seated: i = 0 */
    const seatH = house("BC7", { doctore:A.makeDoctore(house("BCW"), 55) });
    const hadName = seatH.doctore.name;
    const mor0 = A.activeG(seatH).reduce((s,g)=>s+g.morale,0)/A.activeG(seatH).length;
    const reg0 = A.activeG(seatH).reduce((s,g)=>s+A.regardOf(g),0)/A.activeG(seatH).length;
    const seatText = A.EVENTS.freedman.run(seatH, { data:{ k:"doctore", man:champ() } }, 0);
    const seated = { name:seatH.doctore.name, fromHouse:!!seatH.doctore.fromHouse,
      fee:seatH.doctore.fee, skill:seatH.doctore.skill, age:seatH.doctore.age,
      tag:seatH.doctore.tag, past:String(seatH.doctore.pastLine||""),
      morale:+(A.activeG(seatH).reduce((s,g)=>s+g.morale,0)/A.activeG(seatH).length - mor0).toFixed(1),
      regard:+(A.activeG(seatH).reduce((s,g)=>s+A.regardOf(g),0)/A.activeG(seatH).length - reg0).toFixed(1),
      text:String(seatText||""), hadName };

    /* declined: i = 1 */
    const keepH = house("BC8", { doctore:A.makeDoctore(house("BCV"), 55) });
    const keptName = keepH.doctore.name;
    const kreg0 = A.activeG(keepH).reduce((s,g)=>s+A.regardOf(g),0)/A.activeG(keepH).length;
    const keepText = A.EVENTS.freedman.run(keepH, { data:{ k:"doctore", man:champ() } }, 1);
    const kept = { name:keepH.doctore.name, same:keepH.doctore.name === keptName,
      fromHouse:!!keepH.doctore.fromHouse, text:String(keepText||""),
      regard:+(A.activeG(keepH).reduce((s,g)=>s+A.regardOf(g),0)/A.activeG(keepH).length - kreg0).toFixed(1) };

    /* ---- 3. the skill is HIS record, not the market's roll ---- */
    /* AVERAGED, AND THE RUNGS ARE UNDER THE CAP. `makeDoctore` adds `ri(-8,8)` to the quality it is
       handed, so a sixteen-point spread of noise sits on top of `wins * 2.2` — four more wins is
       8.8 points of signal against that, and a single draw at 12 wins came out BELOW a single draw
       at 8. That is the noise, not a fault, and an assertion that cannot tell them apart is worse
       than none. Twenty-five draws a rung, and the rungs stop at 19 because `40 + 20*2.2` is over
       the 82 ceiling and every rung above it reads the same clamp. */
    const skillOf = wins => { let sum = 0;
      for(let i=0;i<25;i++){ const h = house("BCS"+wins+"_"+i);
        A.EVENTS.freedman.run(h, { data:{ k:"doctore", man:champ({ wins }) } }, 0);
        sum += h.doctore.skill; }
      return +(sum/25).toFixed(1); };
    const ladder = [8, 13, 19].map(w=>({ wins:w, skill:skillOf(w) }));
    const capped = skillOf(40);

    /* ---- 4. the two fields the stub used to drop ---- */
    const ageH = house("BCA");
    A.EVENTS.freedman.run(ageH, { data:{ k:"doctore", man:champ({ age:41 }) } }, 0);
    const gotAge = ageH.doctore.age;

    const rivalOf = regardAt => { const h = house("BCR"+regardAt);
      h.rivals = []; 
      A.EVENTS.freedman.run(h, { data:{ k:"lanista", man:champ({ regardAt }) } }, 0);
      const r = (h.rivals||[]).filter(x=>x.freedFrom)[0] || null;
      return r ? { bitter:!!r.bitter, grudge:r.grudge } : null;
    };
    const bitterLow = rivalOf(30), bitterHigh = rivalOf(80);

    /* ---- 5. and the real event carries them ---- */
    let made = null;
    { const h = house("BCE");
      h.freed = [{ name:"Verax, the Gaul", week:10, wins:22, cls:"murmillo", regardAt:31 }];
      h.retired = [{ name:"Old Draco", week:10, age:38, wins:2, cls:"thraex", scars:5 }];
      for(let i=0;i<4000 && !h.pendingEvent; i++){ h.pendingEvent = null; A.freedWeek(h); }
      made = h.pendingEvent ? { keys:Object.keys(h.pendingEvent.data.man||{}),
        man:h.pendingEvent.data.man, choices:h.pendingEvent.choices } : null; }

    return { gate, asks, seated, kept, ladder, capped, gotAge, bitterLow, bitterHigh, made,
      keys:A.FM_KEYS.slice() };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };

  const lines = [], fails = [];
  const G = out.gate, S = out.seated, K = out.kept;
  lines.push(`the gate, split: empty chair + 22 wins ${G.emptyChairGoodMan} · FULL chair + 22 wins ${G.fullChairGoodMan} · ` +
    `empty chair + 3 wins ${G.emptyChairPoorMan} · full chair + 3 wins ${G.fullChairPoorMan}`);
  lines.push(`what he is asked: with no doctore ${JSON.stringify(out.asks.empty)} · with one ${JSON.stringify(out.asks.full)}`);
  lines.push(`seated over ${S.hadName}: ${S.name} · fromHouse ${S.fromHouse} · fee ${S.fee}d · skill ${S.skill} · age ${S.age} · "${S.tag}"`);
  lines.push(`   and the yard: morale ${S.morale >= 0 ? "+" : ""}${S.morale} · regard ${S.regard >= 0 ? "+" : ""}${S.regard}`);
  lines.push(`declined: ${K.name} kept ${K.same} · regard ${K.regard >= 0 ? "+" : ""}${K.regard}`);
  lines.push(`skill off his own record (25 draws a rung): ${out.ladder.map(l=>`${l.wins}w → ${l.skill}`).join(" · ")} · 40w → ${out.capped} (capped)`);
  lines.push(`his years are his own: a man of 41 became a doctore of ${out.gotAge}`);
  lines.push(`freed grudgingly (regard 30): ${JSON.stringify(out.bitterLow)} · freed well (80): ${JSON.stringify(out.bitterHigh)}`);
  lines.push(`the real event's man carries: ${out.made ? out.made.keys.join(", ") : "THE EVENT NEVER FIRED"}`);

  /* ---- 1. the chair no longer holds the door ---- */
  if(!G.emptyChairGoodMan) fails.push("a champion of 22 wins cannot take an EMPTY doctore's chair");
  if(!G.fullChairGoodMan)
    fails.push("a champion of 22 wins is refused while the chair is filled — this is #270's whole fault: " +
      "the term shut the door in 96% of the weeks a man was waiting, and the outcome fired 0 times in 1,893 weeks");
  if(G.emptyChairPoorMan || G.fullChairPoorMan)
    fails.push("a man of 3 wins was offered the doctore's post — the wins term is the one that should hold");

  /* ---- 2. the choice is real and it is honoured ---- */
  if(out.asks.full.length !== 2) fails.push(`with a doctore seated the player is offered ${out.asks.full.length} choices, not two`);
  else if(!out.asks.full.some(c=>/keep/i.test(c))) fails.push(`neither choice offers keeping the man you have: ${JSON.stringify(out.asks.full)}`);
  if(out.asks.empty.length !== 1) fails.push(`with no doctore there is nothing to weigh and the player is still asked ${out.asks.empty.length} ways`);
  if(!S.fromHouse) fails.push("the seated man is not flagged as the house's own");
  if(S.fee !== 0) fails.push(`the house's own man asks ${S.fee}d to take the post`);
  if(!/freed here/i.test(String(S.tag))) fails.push(`the seated man's tag does not say where he came from: "${S.tag}"`);
  if(!S.hadName || !new RegExp(S.hadName, "i").test(S.text))
    fails.push(`the man who lost the post (${S.hadName}) is not named in what the player is told: "${S.text}"`);
  if(!(S.morale > 0)) fails.push(`seating the house's own man moved the yard's morale ${S.morale}`);
  if(!(S.regard > 0)) fails.push(`seating the house's own man moved the yard's regard ${S.regard}`);

  if(!K.same) fails.push("declining still replaced the doctore");
  if(K.fromHouse) fails.push("declining left a `fromHouse` doctore in the chair");
  if(!(K.regard < 0))
    fails.push(`turning the champion away at the gate moved the yard's regard ${K.regard} — the block worked out what was ` +
      `being offered, and a refusal they can all see should cost something`);
  if(!/keep|fair/i.test(K.text)) fails.push(`the decline says nothing about the choice made: "${K.text}"`);

  /* ---- 3. the skill is his record ---- */
  { const L = out.ladder;
    for(let i=1;i<L.length;i++)
      if(!(L[i].skill > L[i-1].skill + 2))
        fails.push(`a man of ${L[i].wins} wins averages a doctore of ${L[i].skill} against ${L[i-1].skill} for ${L[i-1].wins} — ` +
          `the post is supposed to be worth what he did on the sand, and 25 draws a rung is enough to see ${(L[i].wins-L[i-1].wins)*2.2} points of it`);
    if(!(out.capped >= L[L.length-1].skill))
      fails.push(`a man of 40 wins averages ${out.capped} against ${L[L.length-1].skill} for 19 — the ceiling should not bite backwards`); }

  /* ---- 4. the two fields the stub dropped ---- */
  if(out.gotAge !== 41)
    fails.push(`a freed man of 41 became a doctore aged ${out.gotAge} — #251 put his own years on him and the event's ` +
      `\`data.man\` stub dropped \`age\`, so the line could never fire`);
  if(!out.bitterLow) fails.push("a freed man who set up on his own left no rival house behind him");
  else if(!out.bitterLow.bitter)
    fails.push(`a man freed at regard 30 set up his yard WITHOUT a grudge (${out.bitterLow.grudge}) — the stub dropped ` +
      `\`regardAt\`, so \`bitter\` was always false and the whole grudge branch was unreachable in an outcome that does fire`);
  if(out.bitterHigh && out.bitterHigh.bitter)
    fails.push(`a man freed at regard 80 set up his yard bitter — the term is supposed to separate them`);
  if(out.bitterLow && out.bitterHigh && !(out.bitterLow.grudge > out.bitterHigh.grudge))
    fails.push(`a grudging freedman's grudge is ${out.bitterLow.grudge} against ${out.bitterHigh.grudge} for a grateful one`);

  /* ---- 5. and the real event carries what the outcomes read ---- */
  if(!out.made) fails.push("`freedWeek` never raised an event in 4,000 tries with two men waiting");
  else {
    for(const k of ["age", "regardAt"])
      if(!(k in out.made.man))
        fails.push(`the event \`freedWeek\` actually builds does not carry \`${k}\` — the outcomes read it, ` +
          `and a stub that drops it is how two written branches became unreachable`);
    if(!Array.isArray(out.made.choices) || !out.made.choices.length)
      fails.push("the event was raised with no choices at all");
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
