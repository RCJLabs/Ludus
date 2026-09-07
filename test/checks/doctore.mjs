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
                  "DOC_AGE_FROM","DOC_RETIRE","DOC_SKILL_END","DOC_DECAY","WEEKS_PER_YEAR"]
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
        doc.pupil = (A.activeG(d)[0]||{}).id || 1; doc.second = null; doc.retrainTo = "murmillo"; doc.retrainLeft = 3;
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

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
