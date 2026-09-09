/* AND SHE HAS SOMETHING TO SAY — #243 phase 3.

   (`hers` was free in BOTH directories; checked before writing, in checks and probes.)

   "Two or three `ASKS`-shaped conversations with the mistress: a man she wants sold or spared, the
   household, the daughter's match (the son's upbringing is `raiseEvent` already)."

   MEASURED FIRST (`probes/mistress.mjs`, 16 x 420), because an ask is only worth writing if it has
   a subject to be about and a slot to be heard in:

     THE SLOT IS THERE. `askWeek` is the only conversation in the game and it is the men's — a house
     hears a median of TWO TO FOUR asks in its life, and its pool is non-empty on only **909 of
     3,491 weeks**. The channel is idle three weeks in four, so hers is not competing for a busy one.
     THE HOUSEHOLD IS THERE. Folk are hired in 16 of 16 houses, a median of four at once, standing
     3,219 weeks — cook 2,277w, nurse 2,555w, keeper 2,467w.
     AND THE DAUGHTER IS THERE, WHICH IS WHY HER THIRD ASK IS NOT BUILT. 18 girls across 11 of 16
     houses and 8 of them reached fifteen — this door opens, unlike phase 4's. It is already a card:
     `daughterEvent` IS the daughter's match and it fired on exactly those 8 girls. A second
     conversation about the same decision is two cards for one choice. Arm 7 holds that card, because
     a decline that rests on something existing has to check that it still does.

   SHE CANNOT BE IN `askPool`, which walks `activeG` and pairs every man with every conversation he
   fits. So her channel is `womanWeek` beside `askWeek` — the same shape (a gate, a cool, the unheard
   conversation first, one `pendingEvent`) for somebody who is not on the roster.

   MEASURED AFTER, on the same seeds, differing only in which door the rope takes:

     giving   11 asks (house 6, spare 5)   her mood p50 60, p90 74, max 86 - 2 men kept off the block
     refusing 15 asks (house 8, spare 7)   her mood p10 32, and p10 20 at the house's end

   THE FIRST DRAFT OF THIS HEADER CARRIED spare 7 / house 5 AND spare 11 / house 7, which was the
   measurement taken BEFORE arm 2 found the tie: with both conversations unheard a stable sort gave
   it to whichever was declared first, 24 of 24 from fresh. Those numbers are the bug's own footprint
   and are left here as that rather than deleted, because a header that reports a build which no
   longer exists is the fault this suite spends most of its time catching in the game.

   SEVEN ARMS. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "hers";
export const describe = "the mistress has two conversations of her own, and where she stands is worth something";

export async function run({ p }){
  const lines = [], bad = [];
  await found(p, { seed:"HERS-1" });
  await clearAll(p, 10);
  await installRope(p);

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["newGameState","domusOf","wifeOf","womanWeek","resolveHerAsk","HER_ASKS","HER_KEYS",
                  "HER_FROM","HER_RATE","HER_COOL","HER_MOOD","wifeMood","moveMood","wifeWarm","moodWord",
                  "mentorKid","herSpareMan","herFolk","askPool","hireFolk","daughterEvent","childAge",
                  "hasFolk","HH_KEYS","houseFolk","familyWeek","wifeWord","activeG","EVENTS"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const YW = A.WEEKS_PER_YEAR;

    let tick = 0;
    const mk = (o) => { o = o || {};
      const d = A.newGameState("Her", "clean", `HERS-${tick++}`, null);
      d.week = 200; d.fame = 400; d.gold = o.gold == null ? 40000 : o.gold;
      const dm = A.domusOf(d);
      if(!o.single) dm.wife = { name:"Prima Vettia", family:"the Vettii",
        married: o.married == null ? 100 : o.married, age:22, from:"merchant",
        mood: o.mood == null ? undefined : o.mood };
      if(o.folk) for(const k of A.HH_KEYS) A.hireFolk(d, k);
      if(o.kid){ const men = A.activeG(d);
        dm.children.push({ id:dm.nextKin++, name:"Lucius Minor", sex:o.kidSex||"m",
          born: d.week - YW*(o.kidAge == null ? 8 : o.kidAge), up:{palus:0,rhetor:0,box:0},
          mentorId: o.mentor && men[0] ? men[0].id : undefined,
          mentorName: o.mentor && men[0] ? men[0].name : undefined }); }
      return d; };
    /* ---- AND THE WEEK MUST BE ABLE TO STAND STILL ----
       The first cut of this always did `d.week++` between tries, which walks a house married two
       weeks ago straight past `HER_FROM` and a cooled house straight past `herTil` — so arm 6
       reported BOTH gates open on a build where both hold. `hold` keeps the clock where it is and
       spends the rolls instead, which is what a gate test actually wants. */
    const raise = (d, tries, hold) => { for(let i=0;i<(tries||4000) && !d.pendingEvent; i++){
        A.womanWeek(d); if(!d.pendingEvent && !hold) d.week++; }
      return d.pendingEvent || null; };

    /* ---- 1: THE CHANNEL IS HERS, AND IT IS NOT `askPool`'s ---- */
    const chan = (()=>{ const d = mk({ folk:true });
      const poolHasHer = A.askPool(d).some(x=>x.gid == null);
      const ev = raise(d);
      const single = mk({ single:true, folk:true }); const none = raise(single, 900);
      return { ev: ev ? { id:ev.id, title:ev.title, k:ev.data.k, choices:(ev.choices||[]).length } : null,
        poolHasHer, single: none ? none.id : null,
        registered: !!(A.EVENTS.herAsk && typeof A.EVENTS.herAsk.run === "function"),
        drawn: A.EVENTS.herAsk ? A.EVENTS.herAsk.make() : "missing" }; })();

    /* ---- 2: BOTH CONVERSATIONS FIRE, AND THE UNHEARD ONE COMES FIRST ---- */
    /* the week decides the tie between two unheard conversations, so the houses walk the weeks */
    const both = (()=>{ const seen = {};
      for(let t=0;t<24;t++){ const d = mk({ folk:true }); d.week = 200 + t;
        const ev = raise(d); if(ev) seen[ev.data.k] = (seen[ev.data.k]||0)+1; }
      const d = mk({ folk:true });
      A.domusOf(d).herLast = { spare: d.week - 5 };
      const second = raise(d);
      const d2 = mk({ folk:true });
      A.domusOf(d2).herLast = { house: d2.week - 5 };
      const third = raise(d2);
      return { seen, afterSpare: second ? second.data.k : null, afterHouse: third ? third.data.k : null }; })();

    /* ---- 3: `spare` REUSES `flags.noSell`, AND PICKS THE BOY'S MAN ---- */
    const spare = (()=>{ const d = mk({ kid:true, mentor:true });
      const kid = A.mentorKid(d), want = A.herSpareMan(d);
      const ev = raise(d); if(!ev || ev.data.k !== "spare") return { ran:false, k: ev ? ev.data.k : null };
      const before = (d.flags.noSell||[]).length;
      const said = A.resolveHerAsk(d, ev, 0);
      const after = (d.flags.noSell||[]).slice();
      const e2 = mk({ kid:true, mentor:true }); const ev2 = raise(e2);
      let noAfter = null, mood2 = null;
      if(ev2 && ev2.data.k === "spare"){ A.resolveHerAsk(e2, ev2, 1);
        noAfter = (e2.flags.noSell||[]).length; mood2 = A.wifeMood(e2); }
      const bare = mk();
      const a1 = A.herSpareMan(bare), a2 = A.herSpareMan(bare);
      return { ran:true, kidMentor: kid ? kid.mentorId : null, want: want ? want.id : null,
        before, after, said: /word/i.test(said), mood:A.wifeMood(d),
        noAfter, mood2, stable: !!(a1 && a2 && a1.id === a2.id),
        named: (ev.text||"").includes(want ? want.name : " "),
        boyNamed: kid ? (ev.text||"").includes(kid.name) : null }; })();

    /* ---- 4: `house` COSTS COIN, RAISES THEM, AND FALLS BACK WHEN YOU CANNOT PAY ---- */
    const house = (()=>{ const d = mk({ folk:true });
      A.domusOf(d).herLast = { spare: d.week - 5 };
      const ev = raise(d); if(!ev || ev.data.k !== "house") return { ran:false, k: ev ? ev.data.k : null };
      const fee = ev.data.ex.fee, g0 = d.gold;
      const sk0 = A.HH_KEYS.map(k=>A.houseFolk(d)[k]).filter(Boolean).map(f=>f.skill);
      const m0 = A.wifeMood(d);
      A.resolveHerAsk(d, ev, 0);
      const sk1 = A.HH_KEYS.map(k=>A.houseFolk(d)[k]).filter(Boolean).map(f=>f.skill);
      /* hired while solvent, then the box emptied — `hireFolk` charges a fee, so a house created
         poor hires only the free household `wife` slot and the ask is not even offered */
      const poor = mk({ folk:true });
      poor.gold = 3;
      A.domusOf(poor).herLast = { spare: poor.week - 5 };
      const ev2 = raise(poor);
      let pm0 = null, pm1 = null, pg = null;
      if(ev2 && ev2.data.k === "house"){ pm0 = A.wifeMood(poor); const pg0 = poor.gold;
        A.resolveHerAsk(poor, ev2, 0); pm1 = A.wifeMood(poor); pg = poor.gold - pg0; }
      const bare = mk(); const need = A.HER_ASKS.house.need(bare);
      return { ran:true, fee, spent: g0 - d.gold, sk0, sk1, m0, m1:A.wifeMood(d),
        pm0, pm1, pg, bareNeed:!!need, bareFolk:A.herFolk(bare).length }; })();

    /* ---- 5: THE MOOD MOVES BOTH WAYS, AND 1.0 IS WHERE SHE STARTS ---- */
    const mood = (()=>{ const d = mk();
      const start = A.wifeMood(d), warmStart = A.wifeWarm(d);
      A.moveMood(d, 25); const up = A.wifeMood(d), warmUp = A.wifeWarm(d);
      A.moveMood(d, -80); const down = A.wifeMood(d), warmDown = A.wifeWarm(d);
      A.moveMood(d, -80); const floor = A.wifeMood(d);
      A.moveMood(d, 500); const ceil = A.wifeMood(d);
      const single = mk({ single:true });
      return { start, warmStart:+warmStart.toFixed(3), up, warmUp:+warmUp.toFixed(3),
        down, warmDown:+warmDown.toFixed(3), floor, ceil,
        none:A.wifeMood(single), noneWarm:A.wifeWarm(single),
        /* off a FRESH house: `d` above has been walked to the ceiling, and reading the sheet from it
           compared `moodWord(HER_MOOD)` against a sheet written at 100 */
        word:A.moodWord(A.HER_MOOD), lowWord:A.moodWord(5), sheet:A.wifeWord(mk()) }; })();

    /* ---- 6: THE GATE — the wedding season, the cool, and no wife ---- */
    const gate = (()=>{ const fresh = mk({ married:198, folk:true });
      const early = raise(fresh, 3000, true);
      const cooled = mk({ folk:true }); A.domusOf(cooled).herTil = cooled.week + 50;
      const held = raise(cooled, 3000, true);
      const busy = mk({ folk:true }); busy.pendingEvent = { id:"hold" };
      A.womanWeek(busy);
      return { early: early ? early.id : null, held: held ? held.id : null,
        busy: busy.pendingEvent.id, from:A.HER_FROM, cool:A.HER_COOL }; })();

    /* ---- 7: AND THE THIRD ASK IS DECLINED BECAUSE THIS CARD IS THE THIRD ASK ---- */
    const girl = (()=>{ const d = mk({ kid:true, kidSex:"f", kidAge:15 });
      const c = A.domusOf(d).children[0];
      let ev = null; try { ev = A.daughterEvent(d, c); } catch(e){ return { threw:String(e.message||e).slice(0,60) }; }
      return { age:A.childAge(d,c), card: ev ? { id:ev.id, n:(ev.choices||[]).length } : null }; })();

    return { chan, both, spare, house, mood, gate, girl,
      K:{ from:A.HER_FROM, rate:A.HER_RATE, cool:A.HER_COOL, mood:A.HER_MOOD, keys:A.HER_KEYS } };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };
  const { chan, both, spare, house, mood, gate, girl, K } = out;

  /* 1 */
  lines.push(`the channel: "${chan.ev?chan.ev.title:"no card"}" (${chan.ev?chan.ev.id:"-"}, ${chan.ev?chan.ev.k:"-"}, ${chan.ev?chan.ev.choices:0} doors) · a house with no wife after 900 weeks: ${chan.single||"nothing"} · in askPool ${chan.poolHasHer} · the die can draw it ${chan.drawn}`);
  if(!chan.ev || chan.ev.id !== "herAsk") bad.push(`\`womanWeek\` raised ${chan.ev?chan.ev.id:"nothing"} over 4,000 weeks at a ${K.rate} rate`);
  if(chan.single) bad.push(`a house with no wife in it was asked something by her: ${chan.single}`);
  if(chan.poolHasHer) bad.push(`the mistress turned up in \`askPool\`, which walks \`activeG\` — she is not on the roster`);
  if(!chan.registered) bad.push(`\`EVENTS.herAsk\` has no \`run\`, so the card cannot be answered`);
  if(chan.drawn !== null) bad.push(`\`EVENTS.herAsk.make\` returned ${JSON.stringify(chan.drawn)} — it must return null so the week's die never draws her`);

  /* 2 */
  lines.push(`both conversations: ${Object.entries(both.seen).map(([k,n])=>`${k} ${n}`).join(" · ")||"none"} over 24 houses · after hearing spare she raises "${both.afterSpare}", after house "${both.afterHouse}"`);
  for(const k of K.keys) if(!both.seen[k]) bad.push(`\`${k}\` never came up in 24 houses — a conversation nobody hears is not a conversation`);
  if(both.afterSpare !== "house" || both.afterHouse !== "spare")
    bad.push(`the unheard conversation is not preferred: after spare she raised "${both.afterSpare}" and after house "${both.afterHouse}" — \`ASK_FRESH\`'s idea, without a second weighted draw`);

  /* 3 */
  if(!spare.ran) bad.push(`the spare arm raised "${spare.k}" instead — a house with a boy at a man's shoulder should hear about the man`);
  else {
    lines.push(`spare: she names ${spare.named?"the man `herSpareMan` picked":"SOMEBODY ELSE"}${spare.boyNamed===true?" and the boy at his shoulder":""} · noSell ${spare.before} to ${spare.after.length} · mood ${spare.mood} · refused: noSell ${spare.noAfter}, mood ${spare.mood2}`);
    if(spare.want !== spare.kidMentor) bad.push(`the boy's mentor is ${spare.kidMentor} and she asked about ${spare.want} — the man her child follows about is the one she would keep`);
    if(!(spare.after.length === spare.before + 1 && spare.after.includes(spare.want)))
      bad.push(`giving her your word did not put him on \`flags.noSell\` — the flag \`ASKS.brother\` already uses is the machinery this reuses`);
    if(!spare.named) bad.push(`the card does not name the man it is about`);
    if(spare.boyNamed === false) bad.push(`the card does not name the boy whose shoulder he stands at, which is the whole reason she is asking`);
    if(!(spare.mood > K.mood)) bad.push(`her mood after being given her word is ${spare.mood}, no better than the ${K.mood} she starts at`);
    if(!(spare.noAfter === 0)) bad.push(`promising nothing still put him on \`noSell\` (${spare.noAfter})`);
    if(!(spare.mood2 < K.mood)) bad.push(`her mood after being refused is ${spare.mood2}, no worse than the ${K.mood} she starts at`);
    if(!spare.stable) bad.push(`\`herSpareMan\` named a different man on two consecutive calls — the card and the answer must be about the same person`);
  }

  /* 4 */
  if(!house.ran) bad.push(`the house arm raised "${house.k}" instead, with spare already heard`);
  else {
    lines.push(`house: fee ${house.fee}d, taken ${house.spent}d · the folk go ${house.sk0.join("/")} to ${house.sk1.join("/")} · mood ${house.m0} to ${house.m1} · a house with 3d: charged ${house.pg}, mood ${house.pm0} to ${house.pm1} · a house with no folk is asked it ${house.bareNeed} (${house.bareFolk} hands)`);
    if(house.spent !== house.fee) bad.push(`the fee was ${house.fee} and ${house.spent} left the box`);
    if(!(house.sk1.every((v,i)=>v > house.sk0[i]))) bad.push(`paying them properly did not make them better at it: ${house.sk0.join("/")} to ${house.sk1.join("/")}`);
    if(!(house.m1 > house.m0)) bad.push(`her mood did not move for it: ${house.m0} to ${house.m1}`);
    if(house.pg !== 0) bad.push(`a house with three denarii was charged ${-house.pg} for it`);
    if(!(house.pm1 != null && house.pm1 < house.pm0)) bad.push(`meaning to and not managing it cost her nothing: ${house.pm0} to ${house.pm1}`);
    if(house.bareNeed) bad.push(`a house with ${house.bareFolk} hands in it was asked to pay them better`);
  }

  /* 5 */
  lines.push(`mood: starts ${mood.start} (warm ${mood.warmStart}) · +25 to ${mood.up} (${mood.warmUp}) · -80 to ${mood.down} (${mood.warmDown}) · floors at ${mood.floor}, ceils at ${mood.ceil} · no wife: ${mood.none}/${mood.noneWarm}`);
  lines.push(`   the sheet: "${(mood.sheet||"").slice(-64)}"`);
  if(mood.start !== K.mood) bad.push(`she starts at ${mood.start} against HER_MOOD ${K.mood}`);
  if(Math.abs(mood.warmStart - 1) > 0.001)
    bad.push(`\`wifeWarm\` is ${mood.warmStart} at the mood she starts on — it must be exactly 1 there, or every house that has never heard her ask for anything is silently re-tuned`);
  if(!(mood.warmUp > 1 && mood.warmDown < 1)) bad.push(`the warmth does not follow the mood: ${mood.warmUp} up, ${mood.warmDown} down`);
  if(!(mood.floor === 0 && mood.ceil === 100)) bad.push(`the mood is not clamped: floor ${mood.floor}, ceiling ${mood.ceil}`);
  if(!(mood.none === null && mood.noneWarm === 0)) bad.push(`a house with no wife reads mood ${mood.none} and warmth ${mood.noneWarm}`);
  if(!mood.sheet || !new RegExp(mood.word).test(mood.sheet)) bad.push(`the sheet does not say where she stands: "${mood.sheet}"`);
  if(mood.word === mood.lowWord) bad.push(`\`moodWord\` says the same thing at ${K.mood} and at 5`);

  /* 6 */
  lines.push(`the gate: two weeks married, 3,000 rolls at a standing clock to ${gate.early||"nothing"} (HER_FROM ${gate.from}) · cooled to ${gate.held||"nothing"} (HER_COOL ${gate.cool}) · a week with a question already up to ${gate.busy}`);
  if(gate.early) bad.push(`she asked in the wedding season — HER_FROM is ${gate.from} weeks and this fired at two`);
  if(gate.held) {}
  if(gate.held) bad.push(`she asked again inside the cool`);
  if(gate.busy !== "hold") bad.push(`\`womanWeek\` overwrote a question that was already up (${gate.busy})`);

  /* 7 */
  lines.push(`and the third ask, declined: a daughter of ${girl.age} still gets \`${girl.card?girl.card.id:"NOTHING"}\` with ${girl.card?girl.card.n:0} doors — that card IS the daughter's match`);
  if(girl.threw) bad.push(`\`daughterEvent\` threw: ${girl.threw}`);
  if(!girl.card || girl.card.id !== "daughter" || !(girl.card.n >= 2))
    bad.push(`a daughter of fifteen no longer raises \`daughterEvent\` — #243's third ask was declined BECAUSE that card is already the daughter's match, `
      + `measured firing on 8 of 8 girls who reached fifteen. If it has gone, the decline has to be re-read`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
