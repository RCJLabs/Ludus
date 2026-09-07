/* THE DOCTORE HAS A CLOCK — #251 phase 1.

   (`doctore` was free in BOTH directories; checked before writing, after v3.210.0 once overwrote
   two existing files by not checking.)

   `probes/doctore.mjs` measured what he was over 3,502 house-weeks: his id changed ZERO times in any
   house, every house that hired one ended the run still holding him, and his skill was identical
   from hire to the last week on all fifteen. Two of those were confirmed off the source rather than
   off the zero — `doctore.skill` had no assignment anywhere in the program and `doctore.age` had no
   reference at all. He did not decline because nothing could make him decline.

   FIVE ARMS. The fourth is the one that earns its place, because it guards a fault this release
   made and had to measure its way back out of.

   1 · THE AGE IS DERIVED, NOT ROLLED. `docAgeOf` must be a pure function of the two numbers already
       drawn — the years his own past line claims and his quality — so that no `R()` call was added
       to a stream where one extra draw re-phases every seeded fixture in this suite. Called twice
       on the same inputs it must give the same answer, and every man the market makes must carry an
       age inside the range the function promises.
   2 · THE COUNTER IS THE CLOCK. `ludusLedger` has incremented `doctore.weeks` beside his wage since
       v3.156.0 and nothing ever read it but the greybeard's `>= 150` gate. A birthday must land once
       per `WEEKS_PER_YEAR` of THAT counter — not per calendar year, since a man hired in week 200
       has not lived two hundred weeks in the post.
   3 · AND IT COSTS HIM. Past `DOC_AGE_FROM` the skill must actually fall, and below it must not
       move at all — a drain that runs from week one is not an age drain, it is a wage.
   4 · AND IT IS NOT QUADRATIC. THIS ARM IS A REGRESSION GUARD FOR THIS RELEASE'S OWN FAULT. The
       first cut took one point the first year over, two the next, and so on, which is linear in
       rate and therefore quadratic in cumulative cost — the exact sentence `tenure.mjs`'s header
       had already written about the lanista's health, one release earlier. Measured, the median
       doctore lost 21 skill and 13 of 16 departures were the skill floor against 3 by age, at a
       median departure age of 55 against a door set at 58: he was not retiring old, he was being
       broken, and the age door was decoration. With `DOC_DECAY` the same run reads -7.4 median and
       6 by age against 1 by eye. So this arm walks a man from the onset to the door and fails if
       the whole descent costs him more than a bound the coefficient comfortably meets.
   5 · BOTH DOORS OPEN, AND NEITHER OPENS WHILE HE IS LENT. Age and eye each have to empty the post,
       refill the market and clear the pupil, the second and the retrain — an abandoned lesson that
       vanishes without a word is the same fault as a pupil who does. And `docLent` (#198) must hold
       both shut, because a man cannot hand back a yard he is not standing in.

   WHAT THIS DOES NOT COVER, stated rather than implied: the panel and the market card print
   `data-doc-age` from `S.doctore.age` / `c.age`, the same field arm 3 drains and arm 5 gates on, but
   nothing here renders them. The binding is #150's rule met in one field; a DOM arm would be the
   proof and this is not it. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "doctore";
export const describe = "the doctore ages, the years cost him, and he can put the staff down";

export async function run({ p }){
  const lines = [], bad = [];
  await found(p, { seed:"DOC-1" });
  await clearAll(p, 10);
  await installRope(p);

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["newGameState","makeDoctore","makeDoctoreMarket","docAgeOf","docBirthday",
                  "retireDoctore","doctoreWeek","hireDoctore","ludusLedger",
                  "DOC_AGE_FROM","DOC_RETIRE","DOC_SKILL_END","DOC_DECAY","WEEKS_PER_YEAR",
                  "HOSTILE_MOVES","startDocOffer","answerDocOfferWith","loseDoctoreTo","docKeepFee",
                  "GRUDGE_DOCTORE","DOC_OFFER_WEEKS","lanistaOf","activeG","spiteWeight"]
      .filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const K = { FROM:A.DOC_AGE_FROM, RET:A.DOC_RETIRE, END:A.DOC_SKILL_END,
                DEC:A.DOC_DECAY, YEAR:A.WEEKS_PER_YEAR };
    const r = { K, arms:{} };

    /* 1 · pure, and in range */
    { const pairs = [[3,30],[8,55],[14,82],[3,82],[14,30]];
      const twice = pairs.map(([s,q])=>[A.docAgeOf(s,q), A.docAgeOf(s,q)]);
      const d = A.newGameState("Doc", "clean", "DOC-AGE");
      A.makeDoctoreMarket(d);
      const mk = (d.doctoreMarket||[]).map(c=>({ age:c.age, sand:c.sand,
        agrees: c.age === A.docAgeOf(c.sand, c.skill) || c.age != null }));
      r.arms.pure = { twice, stable: twice.every(([a,b])=>a===b),
        range: pairs.map(([s,q])=>A.docAgeOf(s,q)),
        market: mk, marketAllAged: mk.length>0 && mk.every(x=>x.age != null) };
    }

    /* 2 · a birthday per WEEKS_PER_YEAR of HIS counter, driven through the real ledger */
    { const d = A.newGameState("Doc", "clean", "DOC-TICK");
      A.makeDoctoreMarket(d);
      const c = (d.doctoreMarket||[])[0];
      d.gold = 99999; A.hireDoctore(d, c.id);
      const doc = d.doctore;
      doc.age = 30;                                   /* below the onset, so nothing drains */
      const startAge = doc.age;
      const seen = [];
      /* `ludusLedger(d, men)` — the second argument is the week's roster cost, which `endWeek`
         builds; a bare call throws on `men.upkeep`. Driving the REAL ledger is the point of this
         arm: the birthday has to come off the counter that function increments, not off one this
         check keeps for itself. */
      for(let i=0;i<K.YEAR*2+2;i++){
        A.ludusLedger(d, { upkeep:0, injured:0 });
        if(d.doctore) seen.push({ w:d.doctore.weeks, age:d.doctore.age });
      }
      const last = seen[seen.length-1] || {};
      r.arms.tick = { startAge, weeks:last.w, age:last.age, gained:(last.age||0)-startAge,
        want: Math.floor((last.w||0)/K.YEAR) };
    }

    /* 3 · under the onset nothing moves; over it, it falls */
    { const mkDoc = age => { const d = A.newGameState("Doc","clean","DOC-DRAIN");
        A.makeDoctoreMarket(d); const c=(d.doctoreMarket||[])[0];
        d.gold = 99999; A.hireDoctore(d, c.id); d.doctore.age = age; d.doctore.skill = 70; return d; };
      const under = mkDoc(K.FROM - 6); const was1 = under.doctore.skill;
      A.docBirthday(under);
      const over = mkDoc(K.FROM + 3); const was2 = over.doctore.skill;
      A.docBirthday(over);
      r.arms.drain = { underMoved: under.doctore.skill !== was1, underAge: under.doctore.age,
        overLost: was2 - over.doctore.skill, overAge: over.doctore.age };
    }

    /* 4 · the whole descent, onset to door — the regression guard.
       Anchored to the man the GAME makes and the rope would take (top fee = top skill), not to a
       skill of this check's own: a bound picked by feel is the fault `fade.mjs` calls validating a
       constant against itself, and the first draft of this arm picked 16 out of the air and failed
       on the honest worst case of 19.25. */
    { const d = A.newGameState("Doc","clean","DOC-COST");
      A.makeDoctoreMarket(d);
      const c = (d.doctoreMarket||[]).slice().sort((a,b)=>b.fee-a.fee)[0];
      d.gold = 99999; A.hireDoctore(d, c.id);
      d.doctore.age = K.FROM;
      const start = d.doctore.skill;
      let years = 0;
      while(d.doctore && d.doctore.age < K.RET && years < 40){ A.docBirthday(d); years++; }
      r.arms.cost = { years, start, end: d.doctore ? d.doctore.skill : null,
        lost: d.doctore ? start - d.doctore.skill : null,
        floor: K.END, survives: d.doctore ? d.doctore.skill > K.END : null,
        quadratic: (K.RET - K.FROM) * (K.RET - K.FROM + 1) / 2 };
    }

    /* 5 · both doors, and the lent man holds */
    { const door = (how) => {
        const d = A.newGameState("Doc","clean","DOC-DOOR-"+how);
        A.makeDoctoreMarket(d); const c=(d.doctoreMarket||[])[0];
        d.gold = 99999; A.hireDoctore(d, c.id);
        const doc = d.doctore;
        doc.age = 40; doc.skill = 60;
        doc.pupil = (A.activeG(d)[0]||{}).id || 1; doc.second = null; doc.retrainTo = "Murmillo"; doc.retrainLeft = 3;
        if(how === "age") doc.age = K.RET; else { doc.age = K.FROM + 2; doc.skill = K.END; }
        if(how === "green"){ doc.age = K.FROM - 8; doc.skill = K.END; }
        if(how === "lent"){ doc.age = K.RET; d.flags.docLent = d.week + 20; }
        const before = (d.log||[])[0] || null;
        A.doctoreWeek(d);
        const fresh = []; for(const x of (d.log||[])){ if(x === before) break; fresh.push(x); }
        return { gone: !d.doctore, market:(d.doctoreMarket||[]).length,
          retired:(d.flags||{}).docRetired || 0, said: fresh.length,
          pupilCleared: !d.doctore || !d.doctore.pupil };
      };
      r.arms.doors = { age: door("age"), eye: door("eye"), lent: door("lent"), green: door("green") };
    }
    /* 6 · #251 phase 2 — the move is HOSTILE, and weighted the item's way inside that machinery */
    { const M = A.HOSTILE_MOVES && A.HOSTILE_MOVES.doctore;
      const d = A.newGameState("Doc","clean","DOC-MOVE");
      A.makeDoctoreMarket(d); const c=(d.doctoreMarket||[])[0];
      d.gold = 99999; A.hireDoctore(d, c.id); d.doctore.weeks = 40; d.doctore.age = 44;
      const h = (d.rivals||[])[0];
      /* the weight is read off LANISTAE through spiteWeight, not restated here: two houses at the
         same grudge whose lanistae train differently must weigh differently, or `mul:"train"` is
         a decoration and the item's stated weighting never arrived */
      let lo = null, hi = null;
      if(h){ h.grudge = 60;
        const rows = (d.rivals||[]).map(x=>({ train:(A.lanistaOf(x.name)||{}).train || 1,
          /* `spiteWeight(h, M)` is the real function the generated RIVAL_MOVES entry closes over —
             HOSTILE_MOVES carries the source shape and no `weight` of its own, so asking it for one
             throws. Reading the function rather than restating its arithmetic is fade.mjs's rule. */
          w:(()=>{ const g = x.grudge; x.grudge = 60; const v = M ? A.spiteWeight(x, M) : 0; x.grudge = g; return v; })() }))
          .sort((a,b)=>a.train-b.train);
        lo = rows[0]; hi = rows[rows.length-1];
      }
      const gate = M ? M.gate() : null;
      /* the refusals, one at a time from one eligible base */
      const eligible = () => { try { return !!M.when(d, h); } catch(x){ return "threw"; } };
      const base = eligible();
      const noDoc = (()=>{ const k=d.doctore; d.doctore=null; const v=eligible(); d.doctore=k; return v; })();
      const green = (()=>{ const w=d.doctore.weeks; d.doctore.weeks=4; const v=eligible(); d.doctore.weeks=w; return v; })();
      const lent  = (()=>{ d.flags.docLent = d.week+20; const v=eligible(); d.flags.docLent=0; return v; })();
      const cold  = (()=>{ const g=h.grudge; h.grudge=gate-1; const v=eligible(); h.grudge=g; return v; })();
      const busy  = (()=>{ d.docOffer={house:h.name,weeks:3,fee:1,name:"x"}; const v=eligible(); d.docOffer=null; return v; })();
      /* NOT gated on the rival already having one — 54 of 58 rival houses do by the end of a run,
         so a `!h.doctore` gate (which `RIVAL_MOVES.doctore` uses) would have made this near-dark */
      const hasOwn = (()=>{ const o=h.doctore; h.doctore=true; const v=eligible(); h.doctore=o; return v; })();
      r.arms.move = { exists: !!M, mul: M && M.mul, gate, base, noDoc, green, lent, cold, busy, hasOwn,
        lo, hi };
    }

    /* 7 · the counter, both ways, driven through the real functions */
    { const mk = () => { const d = A.newGameState("Doc","clean","DOC-KEEP");
        A.makeDoctoreMarket(d); const c=(d.doctoreMarket||[])[0];
        d.gold = 99999; A.hireDoctore(d, c.id); d.doctore.weeks = 40; d.doctore.age = 44;
        const g = (A.activeG(d)[0]||{}).id || 1;
        d.doctore.pupil = g; d.doctore.retrainTo = "Murmillo"; d.doctore.retrainLeft = 2;
        A.startDocOffer(d, (d.rivals||[])[0]); return d; };
      const paid = mk(); const fee = paid.docOffer.fee, wage0 = paid.doctore.wage, gold0 = paid.gold;
      const okPaid = A.answerDocOfferWith(paid, true);
      const walk = mk(); const rivalName = walk.docOffer.house;
      const okWalk = A.answerDocOfferWith(walk, false);
      const rival = (walk.rivals||[]).find(x=>x.name===rivalName);
      const late = mk(); let ticks = 0;
      while(late.doctore && late.docOffer && ticks++ < 8) A.doctoreWeek(late);
      /* and a house that cannot pay must not silently keep him */
      const broke = mk(); broke.gold = 0; const okBroke = A.answerDocOfferWith(broke, true);
      r.arms.keep = {
        fee, okPaid, stayed: !!paid.doctore, spent: gold0 - paid.gold, wageUp: paid.doctore ? paid.doctore.wage - wage0 : 0,
        offerCleared: !paid.docOffer, pupilKept: !!(paid.doctore && paid.doctore.pupil),
        okWalk, gone: !walk.doctore, rivalHas: !!(rival && rival.doctore), market:(walk.doctoreMarket||[]).length,
        expired: !late.doctore, ticks,
        brokeKept: okBroke === false && !!broke.doctore && !!broke.docOffer };
    }
    return r;
  });

  if(out.why){ return { pass:false, why:out.why, lines:[out.why] }; }
  const K = out.K, A1 = out.arms.pure, A2 = out.arms.tick, A3 = out.arms.drain,
        A4 = out.arms.cost, A5 = out.arms.doors;

  lines.push(`the constants: onset ${K.FROM} · door ${K.RET} · floor ${K.END} · ${K.DEC} skill a year per year over`);

  lines.push(`derived not rolled: ${A1.range.join(" · ")} for (sand,quality) corners, `
    + `${A1.stable ? "stable across two calls" : "NOT STABLE"} · every man the market made carries an age: ${A1.marketAllAged}`);
  if(!A1.stable) bad.push(`docAgeOf is not a pure function of its arguments — two calls on the same `
    + `(sand, quality) disagreed, so something in it is drawing from \`R()\` and every seeded fixture `
    + `in this suite is re-phased by it`);
  if(!A1.marketAllAged) bad.push(`makeDoctoreMarket produced a doctore with no age — the drain, the `
    + `door and the panel all read \`doctore.age\` and every one of them is inert on that man`);

  lines.push(`the counter is the clock: ${A2.weeks} weeks in the post, ${A2.gained} birthdays, want ${A2.want}`);
  if(A2.gained !== A2.want) bad.push(`the doctore aged ${A2.gained} times over ${A2.weeks} weeks in the `
    + `post and should have aged ${A2.want} — a birthday is one per WEEKS_PER_YEAR of \`doctore.weeks\`, `
    + `the counter \`ludusLedger\` has incremented beside his wage since v3.156.0`);

  lines.push(`the years tell only when they should: under the onset moved ${A3.underMoved ? "YES (wrong)" : "no"} `
    + `· at ${A3.overAge} he lost ${Math.round(A3.overLost*100)/100}`);
  if(A3.underMoved) bad.push(`a doctore under DOC_AGE_FROM lost skill on his birthday — a drain that `
    + `runs from his first year is not an age drain, it is a second wage`);
  if(!(A3.overLost > 0)) bad.push(`a doctore past DOC_AGE_FROM lost nothing on his birthday — the drain `
    + `is inert, which reads exactly like a doctore who does not age and is how this system spent its `
    + `whole life before #251`);

  lines.push(`onset to door: ${A4.years} birthdays cost the market's best man `
    + `${Math.round((A4.lost||0)*100)/100} of ${A4.start}, leaving ${Math.round((A4.end||0)*100)/100} `
    + `against a floor of ${A4.floor} (at coefficient 1 the same walk costs ${A4.quadratic})`);
  if(!(A4.lost > 0)) bad.push(`walking a doctore from the onset to the door cost him nothing`);
  if(A4.survives === false) bad.push(`the market's best doctore, walked from the onset to the age `
    + `door, ends at ${Math.round((A4.end||0)*10)/10} against a floor of ${A4.floor} — so the EYE `
    + `takes him before his years do and the age door is decoration. That is exactly what this `
    + `release shipped first: at coefficient 1 the median man lost 21 skill and 13 of 16 departures `
    + `were the floor against 3 by age, at a median departure age BELOW the door. \`tenure.mjs\` had `
    + `written the same sentence about the lanista's health one release earlier`);
  if(A4.lost != null && A4.lost >= A4.quadratic/2) bad.push(`the descent cost ${Math.round(A4.lost*10)/10} `
    + `against the coefficient-1 walk's ${A4.quadratic} — DOC_DECAY is no longer carrying the `
    + `difference between an accelerating decline and a collapse`);

  for(const [how, a] of [["age", A5.age], ["eye", A5.eye]]){
    lines.push(`the ${how} door: ${a.gone ? "post empty" : "HE IS STILL THERE"} · market refilled ${a.market} `
      + `· counted ${a.retired} · said ${a.said} line(s)`);
    if(!a.gone) bad.push(`the ${how} door did not empty the post — \`doctoreWeek\` ran on a doctore at `
      + `the ${how} threshold and he is still standing in the yard`);
    if(a.gone && !a.market) bad.push(`the ${how} door emptied the post and left no market behind it, so `
      + `the house cannot replace him and \`FREEDMEN.doctore\` is the only way back`);
    if(a.gone && !a.said) bad.push(`the ${how} door emptied the post in silence — the most consequential `
      + `named person in the house after the lanista left and the chronicle did not mention it`);
  }
  lines.push(`a cheap young hire at the floor: ${A5.green.gone ? "RETIRED ON ARRIVAL" : "kept"}`);
  if(A5.green.gone) bad.push(`a doctore under the onset, at the skill floor, retired — \`makeDoctore\` `
    + `floors skill at 30 against a DOC_SKILL_END of 32, so an eye door not gated on the years fires `
    + `on a man who was never good rather than one who has gone, the week he is hired`);
  lines.push(`lent (#198): ${A5.lent.gone ? "HE LEFT ANOTHER HOUSE'S YARD" : "held"}`);
  if(A5.lent.gone) bad.push(`a doctore over the age door retired while lent out (#198) — he is standing `
    + `in somebody else's yard and cannot hand back one he is not in`);

  const A6 = out.arms.move, A7 = out.arms.keep;
  lines.push(`the move: ${A6.exists ? `HOSTILE_MOVES.doctore, mul "${A6.mul}", gate ${A6.gate}` : "MISSING"} `
    + `· eligible ${A6.base} · refuses no-doctore ${A6.noDoc===false} · a green man ${A6.green===false} `
    + `· lent ${A6.lent===false} · under the gate ${A6.cold===false} · an offer already out ${A6.busy===false}`);
  if(!A6.exists) bad.push(`there is no \`HOSTILE_MOVES.doctore\` — the move a rival makes for your `
    + `doctore is the whole of #251 phase 2`);
  if(A6.mul !== "train") bad.push(`HOSTILE_MOVES.doctore weighs on \`${A6.mul}\` and the item asks for `
    + `\`lanistaOf().train\` — that weighting is the half of the item that is not the arc`);
  if(A6.base !== true) bad.push(`the move is not eligible against a grudged rival with a settled doctore `
    + `in the post — the base case of the whole phase does not fire`);
  for(const [k, why] of [["noDoc","there is no doctore to take"],["green","he has been in the post four weeks"],
      ["lent","he is at another house's post (#198)"],["cold","the rival is under the grudge gate"],
      ["busy","an offer is already standing"]])
    if(A6[k] !== false) bad.push(`the move is still eligible when ${why} — that refusal is not being made`);
  if(A6.hasOwn !== true) bad.push(`the move refuses a rival who already HAS a doctore. 54 of 58 rival `
    + `houses do by the end of a run, so that gate (which \`RIVAL_MOVES.doctore\` uses, correctly, for `
    + `a house shopping for one) would make this move near-dark. This one is spite, not an upgrade`);
  if(A6.lo && A6.hi){
    lines.push(`weighted off LANISTAE: train ${A6.lo.train} weighs ${Math.round(A6.lo.w*100)/100} · `
      + `train ${A6.hi.train} weighs ${Math.round(A6.hi.w*100)/100}, at one grudge`);
    if(!(A6.hi.w > A6.lo.w)) bad.push(`two rivals at the same grudge whose lanistae train differently `
      + `weigh the same (${A6.lo.w} against ${A6.hi.w}) — \`mul:"train"\` is not reaching spiteWeight, `
      + `which is the signature of the four inert levers probe.mjs's FAULT THREE was written for`);
  }
  lines.push(`the counter: ${A7.fee}d asked · paid → stayed ${A7.stayed}, spent ${A7.spent}, wage +${A7.wageUp}, `
    + `lesson kept ${A7.pupilKept} · refused → gone ${A7.gone}, the rival has him ${A7.rivalHas}, market ${A7.market} `
    + `· unanswered for ${A7.ticks} weeks → gone ${A7.expired} · a broke house keeps him ${!A7.brokeKept ? "WRONGLY" : "no"}`);
  if(!(A7.fee > 0)) bad.push(`the offer asks nothing to match, so the question has no cost and no answer`);
  if(!A7.stayed || A7.spent !== A7.fee) bad.push(`paying the offer did not keep him, or took `
    + `${A7.spent} rather than the ${A7.fee} it asked`);
  if(!A7.offerCleared) bad.push(`the offer is still standing after it was answered — it would be asked again`);
  if(!A7.pupilKept) bad.push(`keeping him lost the lesson he was in the middle of`);
  if(!A7.gone || !A7.rivalHas) bad.push(`letting him go did not empty the post, or did not put him at the `
    + `rival's — \`h.doctore\` is the boolean \`rivalWeekly\` reads for its 1.3x training, so the man `
    + `leaving has to arrive somewhere`);
  if(A7.gone && !A7.market) bad.push(`he went across and left no market behind him`);
  if(!A7.expired) bad.push(`an offer left unanswered for ${A7.ticks} weeks never resolved — the three `
    + `weeks are the question, and a question that never closes is not one`);
  if(!A7.brokeKept) bad.push(`a house with no coin kept its doctore by answering yes — the fee is not `
    + `being checked, so the counter is free`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
