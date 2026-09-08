/* AND SHE HAS A LIFE — #243 phase 2.

   (`fever` was free in BOTH directories; checked before writing, in checks and probes.)

   `wife = null` was never written outside `succeed`'s domus reset. She could not sicken, die, or be
   widowed, and the widowed branch #226 wrote into `familyWeek` was reachable only through a
   succession — which is to say, only by handing the house to somebody else.

   MEASURED FIRST (`probes/mistress.mjs`, 16 x 420), because the shape a hazard should take is a
   fact about where she actually is:

     · there are wife-weeks to put one on — a median of 135 a house, p90 312;
     · but SHE IS YOUNG. Her age across those weeks reads p10 20, p50 26, p90 33, max 39, and in the
       reference arm she never once reaches forty. A hazard rising with age would never fire. What
       the game already has a moment for is CHILDBIRTH — a median of three births a house at a
       median of week 105 — and that is where the larger of the two hazards went.
     · and widowhood re-opens something real: he is under 56, `marryReady`'s own ceiling, on 89.7%
       of wife-weeks, and 11 of 16 houses have a living child at the end.

   THE FEVER IS A QUESTION, NOT A DIE ROLL, which is what "the `fever` shape" means: `EVENTS.fever`
   is a card with a price on one door and a consequence on the other. Measured on the SAME SEEDS,
   differing only in which door the rope takes:

     paid (the physician, choice 0)   the fever came 14x — SHE DIED IN 1 OF 16 HOUSES
     skimped (herbs and rest)         the fever came 12x — SHE DIED IN 4 OF 16

   and of the widowers, 2 of 3 and 3 of 4 married again, at a median of week 168 and 175. The
   widowed weeks split 164 with her people still counting his children as theirs and 32 with nothing
   of hers left in the house, which is the tie's half-life measured rather than asserted.

   SIX ARMS. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "fever";
export const describe = "she can sicken and die, what you answer moves the odds, and the empty slot re-opens the match";

export async function run({ p }){
  const lines = [], bad = [];
  await found(p, { seed:"FEV-1" });
  await clearAll(p, 10);
  await installRope(p);

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["newGameState","domusOf","wifeOf","wifeDies","wifeIllEvent","resolveWifeIll","kinTie",
                  "famTie","widowOf","wifeAgeNow","marryReady","slaverPrice","livingKids","makeStaff",
                  "WIFE_ILL_FROM","WIFE_ILL_RATE","WIFE_ILL_COOL","WIFE_ILL_DIE","WIFE_CHILDBED",
                  "WIFE_MOURN","WIFE_KIN_HALF","WIFE_BLOCK","EVENTS","bearChild","familyWeek"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const YW = A.WEEKS_PER_YEAR;

    let tick = 0;
    /* a married house, past the wedding season, with a moving seed — `newGameState` reseeds the one
       global R(), and a fixture that names the same seed replays the same roll every trial */
    const mk = (opt) => {
      const o = opt || {};
      const d = A.newGameState("Fev", "clean", `FEV-${tick++}`, null);
      d.week = 200; d.fame = 400; d.gold = o.gold == null ? 40000 : o.gold;
      const dm = A.domusOf(d);
      dm.wife = { name:"Prima Vettia", family:"the Vettii", married:100, age:22,
                  from:o.from || "merchant", house:o.house || null };
      if(o.kids) for(let i=0;i<o.kids;i++)
        dm.children.push({ id:dm.nextKin++, name:`Kin${i}`, sex:"m", born:130+i, up:{palus:0,rhetor:0,box:0} });
      if(o.medicus) d.medicus = A.makeStaff(d, "medicus", o.medicus);
      return d;
    };

    /* ---- 1: THE CARD, AND ITS DOORS ---- */
    const card = (()=>{ const a = A.wifeIllEvent(mk()), b = A.wifeIllEvent(mk({ medicus:70 }));
      const none = A.wifeIllEvent(A.newGameState("Fev","clean","FEV-bare",null));
      return { bare: a ? { n:a.choices.length, keys:a.data.keys, fee:a.data.fee, title:a.title } : null,
        withMed: b ? { n:b.choices.length, keys:b.data.keys, said:b.choices[1] } : null,
        noWife: none }; })();

    /* ---- 2: AND WHAT YOU ANSWER MOVES THE ODDS ---- */
    const N = 1000;
    const door = (which, opt) => { let died = 0, paid = 0;
      for(let t=0;t<N;t++){ const d = mk(opt); const ev = A.wifeIllEvent(d);
        const i = ev.data.keys.indexOf(which); if(i < 0) continue;
        const g0 = d.gold;
        A.resolveWifeIll(d, ev, i);
        if(!A.domusOf(d).wife) died++;
        if(d.gold < g0) paid++; }
      return { died, rate:+(died/N).toFixed(3), paid }; };
    /* ---- A SECOND SAMPLE, BECAUSE THE FIRST ONE IS THE SAME DRAWS EVERY RUN ----
       The physician's door read 0.052-0.058 against its constant of 0.040 on three runs, which
       looked like three samples agreeing and is not: `mk` names `FEV-<tick>` and `newGameState`
       reseeds the one global R() from the seed word, so every run of this check replays the SAME
       thousand rolls. It is one sample measured three times.

       A reseed artefact was the first suspicion — that a fixture rolling immediately after
       `newGameState` samples mulberry32's first output over a sequentially-hashed seed set rather
       than the stream. TESTED, AND IT WAS NOT THAT: burning four draws before the roll moved the
       physician to 0.054, the medicus to 0.065 and herbs-and-rest to 0.309, which is a different
       sample and not a correction. `tick` runs on across arms, so this second call draws a
       genuinely different thousand, and the two together are what the ordering is read on. */
    const odds = { physician:door("physician"), pass:door("pass"),
                   medicus:door("medicus", { medicus:70 }) };
    odds.physician2 = door("physician");

    /* ---- 3: AND YOU CANNOT BUY ODDS YOU CANNOT PAY FOR ---- */
    const broke = (()=>{ let died = 0, spent = 0, said = null;
      for(let t=0;t<N;t++){ const d = mk({ gold:5 }); const ev = A.wifeIllEvent(d);
        const g0 = d.gold; const line = A.resolveWifeIll(d, ev, 0);
        if(!A.domusOf(d).wife) died++;
        if(d.gold < g0) spent++;
        if(said == null) said = line; }
      return { rate:+(died/N).toFixed(3), spent, said }; })();

    /* ---- 4: THE DEATH EMPTIES THE SLOT, AND THE SLOT IS THE WHOLE POINT ---- */
    const gone = (()=>{ const d = mk({ kids:2 });
      const before = { ready:A.marryReady(d), wife:!!A.domusOf(d).wife };
      const ok = A.wifeDies(d, "fever");
      const dm = A.domusOf(d), wd = A.widowOf(d);
      const after = { ok:!!ok, wife:!!dm.wife, widowed:!!wd, name:wd?wd.name:null, age:wd?wd.age:null,
        how:wd?wd.how:null, ready:A.marryReady(d), cool:(d.flags.matchCool||0) - d.week,
        said:(d.log||[]).slice(0,3).some(x=>/is dead at/.test(x.text||"")) };
      /* and the children go on being raised, which is what #226 moved out of the wife branch */
      const kidsBefore = A.livingKids(d).length;
      let threw = null; try { for(let i=0;i<8;i++) A.familyWeek(d); } catch(e){ threw = String(e.message||e).slice(0,60); }
      return { before, after, threw, kidsAfter:A.livingKids(d).length, kidsBefore }; })();

    /* ---- 5: CHILDBED — the larger hazard, where the game already has the moment ---- */
    /* the first half is a SMOKE TEST, not a rate: `wifeDies` is called unconditionally, so 300 of
       300 is the only answer it can give. It exists to prove the two compose — a birth delivered and
       the mother taken in the same week — because the childbed line is the one that says both. The
       rate is the second half, driven through `familyWeek`, which is the only caller that rolls it. */
    const bed = (()=>{ let born = 0, died = 0, threw = null;
      for(let t=0;t<300;t++){ const d = mk();
        const dm = A.domusOf(d); dm.lastBorn = null;
        const k0 = dm.children.length;
        try { A.bearChild(d); } catch(e){ threw = String(e.message||e).slice(0,60); break; }
        if(dm.children.length > k0) born++;
        if(A.wifeDies(d, "childbed")) died++; }
      /* the RATE is driven through familyWeek, which is the only caller that rolls it */
      let fw = 0, fwDied = 0;
      for(let t=0;t<3000;t++){ const d = mk(); const dm = A.domusOf(d);
        dm.lastBorn = d.week - 40; dm.illTil = d.week + 9999;   /* the fever door held shut */
        const k0 = dm.children.length;
        try { A.familyWeek(d); } catch(e){}
        if(dm.children.length > k0){ fw++; if(!dm.wife) fwDied++; } }
      return { born, died, threw, fw, fwDied, rate: fw ? +(fwDied/fw).toFixed(3) : null }; })();

    /* ---- 6: AND HER PEOPLE KEEP HALF OF IT WHILE HER CHILDREN ARE IN THE HOUSE ---- */
    const tie = (()=>{
      const live = mk({ kids:2 }), half = mk({ kids:2 }), lapsed = mk({ kids:0 }), bare = A.newGameState("Fev","clean","FEV-bare2",null);
      const pLive = A.slaverPrice(live, "syrian");
      A.wifeDies(half, "fever"); A.wifeDies(lapsed, "fever");
      return { live:{ full:A.kinTie(live).full, price:+pLive.toFixed(4) },
        half:{ tie:!!A.kinTie(half), full:A.kinTie(half) ? A.kinTie(half).full : null,
               price:+A.slaverPrice(half,"syrian").toFixed(4), word:A.wifeWord(half) },
        lapsed:{ tie:!!A.kinTie(lapsed), price:+A.slaverPrice(lapsed,"syrian").toFixed(4), word:A.wifeWord(lapsed) },
        bare:+A.slaverPrice(bare,"syrian").toFixed(4) }; })();

    return { card, odds, broke, gone, bed, tie, N,
      K:{ die:A.WIFE_ILL_DIE, bed:A.WIFE_CHILDBED, mourn:A.WIFE_MOURN, half:A.WIFE_KIN_HALF,
          from:A.WIFE_ILL_FROM, rate:A.WIFE_ILL_RATE, cool:A.WIFE_ILL_COOL, block:A.WIFE_BLOCK } };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };
  const { card, odds, broke, gone, bed, tie, N, K } = out;

  /* 1 */
  lines.push(`the card "${card.bare?card.bare.title:"—"}": ${card.bare?card.bare.keys.join(" · "):"—"} · fee ${card.bare?card.bare.fee:"—"}d · with a medicus: ${card.withMed?card.withMed.keys.join(" · "):"—"}`);
  if(!card.bare || card.bare.keys.join() !== "physician,pass")
    bad.push(`a house with no medicus was offered ${card.bare?card.bare.keys.join("+"):"no card"} — the fever's own shape is a price on one door and a consequence on the other`);
  if(!card.withMed || card.withMed.keys.join() !== "physician,medicus,pass")
    bad.push(`a house WITH a medicus was offered ${card.withMed?card.withMed.keys.join("+"):"no card"} — the man you already pay should be a door`);
  if(card.noWife) bad.push(`\`wifeIllEvent\` raised a card for a house with no wife in it`);

  /* 2 */
  lines.push(`the doors over ${N} each: physician ${odds.physician.rate} (paid ${odds.physician.paid}) · medicus ${odds.medicus.rate} · herbs and rest ${odds.pass.rate} — the constants are ${K.die.physician}/${K.die.medicus}/${K.die.pass}`);
  lines.push(`   the physician's door on a second, disjoint thousand: ${odds.physician2.rate} (the first is the same draws every run — one sample, not three)`);
  const phys = (odds.physician.died + odds.physician2.died) / (2*N);
  if(!(phys < K.die.physician * 2.2))
    bad.push(`the physician's door left her dead on ${phys.toFixed(3)} of 2000 against the ${K.die.physician} its constant sets — `
      + `the door is not reading \`WIFE_ILL_DIE.physician\``);
  if(!(odds.physician.rate < odds.pass.rate - 0.1))
    bad.push(`the physician left her at ${odds.physician.rate} against ${odds.pass.rate} for herbs and rest — the card's price buys nothing, `
      + `and measured in play the same seeds gave 1 of 16 houses paid against 4 of 16 skimped`);
  if(!(odds.medicus.rate < odds.pass.rate && odds.medicus.rate > odds.physician.rate - 0.02))
    bad.push(`the house medicus read ${odds.medicus.rate} against ${odds.physician.rate} bought and ${odds.pass.rate} unbought — he should sit between them`);
  if(odds.physician.paid < N * 0.95) bad.push(`the physician was paid for only ${odds.physician.paid} of ${N} times`);
  if(odds.pass.paid > 0) bad.push(`herbs and rest cost coin ${odds.pass.paid} times`);

  /* 3 */
  lines.push(`a house with 5 denarii choosing the physician: ${broke.rate} dead, coin taken ${broke.spent}x — "${(broke.said||"").slice(0,72)}…"`);
  if(broke.spent > 0) bad.push(`a house that could not afford the rider was charged anyway, ${broke.spent} times`);
  if(!(broke.rate > odds.physician.rate + 0.08))
    bad.push(`a house that could not pay got ${broke.rate} against the physician's ${odds.physician.rate} — an unpayable door must fall back to the odds you actually took`);

  /* 4 */
  lines.push(`the death: slot empty ${!gone.after.wife} · widowed record ${gone.after.name} aged ${gone.after.age} of ${gone.after.how} · marryReady ${gone.before.ready} → ${gone.after.ready} · mourning ${gone.after.cool}w · chronicled ${gone.after.said}`);
  if(!gone.after.ok || gone.after.wife) bad.push(`\`wifeDies\` did not empty the wife slot — \`marryReady\` wants it EMPTY and nothing but a succession ever emptied it`);
  if(!gone.after.widowed || !gone.after.name) bad.push(`the widow is not on the record, so nothing downstream can name her`);
  if(gone.before.ready) bad.push(`\`marryReady\` was already true with a wife in the house — the arm proves nothing`);
  if(!gone.after.ready) bad.push(`the slot is empty and \`marryReady\` is still false — the whole of phase 2's second act is that it re-opens`);
  if(gone.after.cool !== K.mourn) bad.push(`the mourning is ${gone.after.cool} weeks against WIFE_MOURN ${K.mourn} — the matchmakers should not call the week after a funeral`);
  if(!gone.after.said) bad.push(`the chronicle said nothing the week she died`);
  if(gone.threw) bad.push(`\`familyWeek\` threw for a widower: ${gone.threw} — #226 moved the child loop OUT of the wife branch so this is exactly the path it protects`);
  if(gone.kidsAfter !== gone.kidsBefore) bad.push(`a widower's children went from ${gone.kidsBefore} to ${gone.kidsAfter} over eight weeks`);

  /* 5 */
  lines.push(`childbed: the two compose — ${bed.born}/300 births delivered and ${bed.died}/300 mothers taken by an unconditional call (a smoke test, not a rate)`);
  lines.push(`   the rate, through familyWeek, which is the only caller that rolls it: ${bed.fwDied} of ${bed.fw} births = ${bed.rate} against WIFE_CHILDBED ${K.bed}`);
  if(bed.threw) bad.push(`\`bearChild\` threw: ${bed.threw}`);
  if(bed.born !== 300 || bed.died !== 300) bad.push(`the smoke test delivered ${bed.born} of 300 births and took ${bed.died} of 300 mothers — an unconditional call should do both every time`);
  if(bed.fw < 60) bad.push(`only ${bed.fw} births came out of 3000 driven weeks — the childbed arm cannot see its own rate`);
  else if(!(bed.rate > K.bed * 0.4 && bed.rate < K.bed * 2.6))
    bad.push(`the childbed took her on ${bed.rate} of births against the ${K.bed} \`WIFE_CHILDBED\` sets — measured at a median of three births a house, `
      + `so this is the larger of the two hazards over a marriage and its rate has to be the one on the constant`);

  /* 6 */
  lines.push(`the tie: alive ${tie.live.full} at price ${tie.live.price} · widowed with her children ${tie.half.full} at ${tie.half.price} · nothing of hers left ${tie.lapsed.tie} at ${tie.lapsed.price} (a house that never married: ${tie.bare})`);
  if(!(tie.live.full === 1)) bad.push(`a living wife's tie reads ${tie.live.full}`);
  if(!tie.half.tie || tie.half.full !== K.half)
    bad.push(`a widower with her two children read ${tie.half.tie ? tie.half.full : "no tie at all"} against WIFE_KIN_HALF ${K.half} — her people do not forget the children`);
  if(!(tie.half.price > tie.live.price && tie.half.price < tie.bare))
    bad.push(`the block charged a widower ${tie.half.price}, against ${tie.live.price} with her alive and ${tie.bare} for a stranger — half a tie should sit between them`);
  if(tie.lapsed.tie) bad.push(`a widower with no children of hers still carries her family's tie`);
  if(!(Math.abs(tie.lapsed.price - tie.bare) < 0.0005))
    bad.push(`a widower with nothing of hers left pays ${tie.lapsed.price} against a stranger's ${tie.bare} — the tie should have lapsed entirely`);
  if(!tie.half.word || !/half/.test(tie.half.word)) bad.push(`the sheet says nothing about the halved tie: "${tie.half.word}"`);
  if(!tie.lapsed.word || !/no reason/.test(tie.lapsed.word)) bad.push(`the sheet says nothing about the lapsed tie: "${tie.lapsed.word}"`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
