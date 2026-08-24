/* THE TRAINING SQUARE HELD ONE MAN — #197

   `doc.pupil` was a single id, `doctoreWeek` returned on its second line unless it was set, and
   `DOC_LESSONS` — the only thing in the file that raises a LIVING man's potential — reached that
   one man and nobody else.

   MEASURED before it was widened (probes/square.mjs, 8 houses x 300 weeks an arm):

     control (the reference player)      0 of 249 men ever stood on the square
     round-robin, every week           133 of 203 · 65.5%   ·  80.9% of man-weeks waiting
     parked on one favourite           121 of 274 · 44.2%   ·  81.3% waiting
     TWO SEATS                         219 of 321 · 68.2%   ·  79.3% waiting

   AND THE SECOND SEAT IS NOT A THROUGHPUT UPGRADE. Reach moves 2.7 points and waiting 1.6; what
   keeps men off the square is that they die, not that the seat is taken, and the release says so.
   What it does do is manufacture ties on purpose — 43 brother, 31 rival and 13 feuds beaten out
   over 1,543 occupied weeks, against zero in every arm that cannot seat two — which v3.128.0 made
   legible and priced at 1.70x and 0.55x on the assist.

   THE ONE THING THIS CHECK EXISTS FOR ABOVE ALL: **the square must draw no random number unless a
   second man is named.** That is what lets a release that changes the weekly simulation still
   prove itself with a byte-identical `open.mjs`, and it is a property that a later edit can break
   silently — one stray `R()` above the branch and every seeded house in the project re-phases. It
   is asserted here on the game's own counter rather than trusted. */

import { found, tab, clearAll, forge, settle, waitSaved } from "../harness.mjs";

export const name = "square";
export const describe = "the doctore's square holds two, and costs nothing until it does";

export async function run({ p, errors }){
  const fails = [], lines = [];

  /* ---- THE SEATS ---- */
  const seats = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Square","clean","SQ-1",null);
    while(A.activeG(d).length < 4) d.gladiators.push(A.genGladiator(d, 60));
    const [a,b,c] = A.activeG(d);
    d.doctore = A.makeDoctore(d, 80);
    const on = () => A.squareMen(d);
    const out = [];
    A.setPupilTo(d, a.id); out.push(on().length);                    /* 1 */
    A.setPupilTo(d, b.id); out.push(on().length);                    /* 2 */
    const full = on().slice();
    A.setPupilTo(d, c.id); out.push(on().length);                    /* still 2 — c takes the second seat */
    const afterFull = on().slice();
    /* stepping the FIRST man off promotes the other, which is what the rope's round-robin
       depends on: clear, then name, and exactly one man is standing there */
    A.setPupilTo(d, d.doctore.pupil); out.push(on().length);         /* 1 */
    const promoted = d.doctore.pupil;
    A.setPupilTo(d, d.doctore.pupil); out.push(on().length);         /* 0 */
    return { out, full, afterFull, promoted, cId:c.id, aId:a.id, bId:b.id,
             emptied: d.doctore.pupil === null && d.doctore.second === null };
  });
  lines.push(`seating: ${seats.out.join(" → ")} men on the square as four names are pressed and two released`);
  if(seats.out.join(",") !== "1,2,2,1,0")
    fails.push(`the square seated ${seats.out.join(",")} where it should go 1,2,2,1,0 — a third name must take the second seat, not a third one`);
  if(!seats.afterFull.includes(seats.cId))
    fails.push("a name pressed on a full square did nothing — the newer man must take the second seat");
  if(seats.promoted !== seats.cId)
    fails.push("stepping the first man off did not promote the other into his place, which is what the rope's toggle depends on");
  if(!seats.emptied) fails.push("the square would not empty");

  /* ---- AND IT COSTS NOTHING UNTIL A SECOND MAN IS NAMED ----
     The whole byte-identical claim rests on this. Driven on the game's own RNG counter. */
  const quiet = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const mk = (second) => {
      const d = A.newGameState("Square","clean","SQ-2",null);
      while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 60));
      const [a,b] = A.activeG(d);
      d.doctore = Object.assign(A.makeDoctore(d, 80), { pupil:a.id, second: second ? b.id : null });
      return d;
    };
    /* ---- `rngGet` IS THE STATE, NOT A COUNTER ----
       The first cut of this subtracted two states and printed -2,463,401,483 draws. There is no
       draw counter to read, and `R` is not on the handle — so the property is stated as an
       IDENTITY between states reached from one seed, which is exact and needs nothing new:
         an empty square, and no doctore at all, must leave the seed exactly where they found it;
         one man on the square must consume exactly what `docLesson` consumes and not one more;
         two men must differ, or the paired week is not running. */
    const from = (fn) => { A.rngSet(12345); fn(); return A.rngGet(); };
    const empty = mk(false); empty.doctore.pupil = null;
    const noDoc = mk(false); noDoc.doctore = null;
    const one = mk(false), oneB = mk(false), two = mk(true);
    return {
      base:   12345,
      empty:  from(()=>A.doctoreWeek(empty)),
      noDoc:  from(()=>A.doctoreWeek(noDoc)),
      one:    from(()=>A.doctoreWeek(one)),
      lesson: from(()=>A.docLesson(oneB, oneB.gladiators.find(x=>x.id===oneB.doctore.pupil))),
      two:    from(()=>A.doctoreWeek(two)),
    };
  });
  lines.push(`the seed after one week, from 12345: empty square ${quiet.empty} · no doctore ${quiet.noDoc} · one man ${quiet.one} (docLesson alone: ${quiet.lesson}) · two men ${quiet.two}`);
  if(quiet.empty !== quiet.base) fails.push(`an EMPTY square moved the seed ${quiet.base} → ${quiet.empty} — every seeded house in the project re-phases`);
  if(quiet.noDoc !== quiet.base) fails.push(`a house with NO DOCTORE moved the seed — the square must cost nothing where there is none`);
  if(quiet.one !== quiet.lesson)
    fails.push(`one man on the square left the seed at ${quiet.one} where docLesson alone leaves it at ${quiet.lesson} — the second seat has leaked a draw into the single case, and open.mjs can never be byte-identical again`);
  if(quiet.two === quiet.one) fails.push("two men left the seed exactly where one man did — the paired week is not running");

  /* ---- THE PAIRED WEEK ---- */
  const paired = await p.evaluate(()=>{
    const A = window.__LVDVS;
    let bothTired = 0, oneTaught = 0, tied = 0, runs = 0, lessons = 0, tookA = 0, tookB = 0;
    for(let i=0;i<400;i++){
      const d = A.newGameState("Square","clean","SQ-P"+i,null);
      while(A.activeG(d).length < 2) d.gladiators.push(A.genGladiator(d, 60));
      const [a,b] = A.activeG(d);
      a.fatigue = 0; b.fatigue = 0; a.potential = 40; b.potential = 40;
      a.defiance = 30; b.defiance = 30; d.ties = [];
      d.doctore = Object.assign(A.makeDoctore(d, 99), { skill:99, fromHouse:true, pupil:a.id, second:b.id });
      const n0 = (d.log||[]).length;
      A.doctoreWeek(d); runs++;
      if(a.fatigue > 0 && b.fatigue > 0) bothTired++;
      const fresh = (d.log||[]).slice(0, Math.max(0, (d.log||[]).length - n0)).map(x=>x.text||"");
      if(fresh.some(t=>/nobody had looked for|stops being a thing|tell you exactly what|takes the fight out of|gives back a little/.test(t))) lessons++;
      if((d.ties||[]).length) tied++;
      /* exactly one of them may be taught in a week — throughput is unchanged by the second seat */
      const ga = d.gladiators.find(x=>x.id===a.id), gb = d.gladiators.find(x=>x.id===b.id);
      const upA = (ga.potential||0) > 40, upB = (gb.potential||0) > 40;
      if(upA && upB) oneTaught = -999;
      if(upA) tookA++; if(upB) tookB++;
    }
    return { runs, bothTired, lessons, tied, tookA, tookB, oneTaught };
  });
  lines.push(`400 paired weeks at a skill-99 house doctore: both men tired ${paired.bothTired} · a lesson taught ${paired.lessons} · a tie made ${paired.tied} · potential went to the first man ${paired.tookA} times and the second ${paired.tookB}`);
  if(paired.bothTired !== paired.runs) fails.push(`only ${paired.bothTired} of ${paired.runs} paired weeks tired BOTH men — the square is meant to be work for the pair`);
  if(!paired.lessons) fails.push("400 paired weeks under the best doctore in the game taught nothing");
  if(!paired.tied) fails.push("400 paired weeks made no tie at all — the second seat's whole purpose is that it manufactures one");
  if(paired.oneTaught === -999) fails.push("a single week raised BOTH men's potential — the second seat is meant to double exposure, not throughput");
  if(!paired.tookA || !paired.tookB)
    fails.push(`the week was taken by the same man every time (${paired.tookA} / ${paired.tookB}) — it is meant to be decided on the day, so a green man can have it off a made one`);

  /* ---- AND IT EMPTIES ITSELF ---- */
  const empties = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const mk = () => { const d = A.newGameState("Square","clean","SQ-3",null);
      while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 60));
      const [a,b] = A.activeG(d);
      d.doctore = Object.assign(A.makeDoctore(d, 80), { pupil:a.id, second:b.id });
      return { d, a, b }; };
    const dead = mk(); dead.b.status = "dead"; A.doctoreWeek(dead.d);
    const gone = mk(); gone.a.status = "sold"; A.doctoreWeek(gone.d);
    const re   = mk(); re.d.doctore.retrainTo = "Murmillo"; re.d.doctore.retrainLeft = 2; A.doctoreWeek(re.d);
    return { secondCleared: A.docSecond(dead.d) === null,
             promoted: dead.d.doctore.pupil === dead.a.id,
             firstGone: gone.d.doctore.pupil === gone.b.id && A.docSecond(gone.d) === null,
             retrainClears: A.docSecond(re.d) === null && re.d.doctore.pupil === re.a.id };
  });
  lines.push(`emptying: second man buried → cleared ${empties.secondCleared} · first man sold → the other stepped up ${empties.firstGone} · a retrain cleared the second seat ${empties.retrainClears}`);
  if(!empties.secondCleared) fails.push("a buried second man stayed on the square");
  if(!empties.firstGone) fails.push("the first man leaving did not promote the second into his place");
  if(!empties.retrainClears) fails.push("a retrain left a second man on the square — the doctore trains at nothing else until it is finished");

  /* ---- AND THE WORD ON THE MAN'S PAGE, all five of them ----
     The button is the only entrance to the square and it has to say which seat he would take, or
     a second man reads as replacing the first. Asserted at model level because it is a pure
     function of the house — the screen below proves the panel, which is the harder one. */
  const words = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Square","clean","SQ-W",null);
    while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 60));
    const [a,b,c] = A.activeG(d);
    d.doctore = A.makeDoctore(d, 70);
    const w = {};
    w.empty = A.squareWord(d, a);
    A.setPupilTo(d, a.id);
    w.onHim = A.squareWord(d, a); w.beside = A.squareWord(d, b);
    A.setPupilTo(d, b.id);
    w.second = A.squareWord(d, b); w.full = A.squareWord(d, c);
    d.doctore.retrainTo = "Murmillo"; d.doctore.retrainLeft = 2;
    w.retrain = A.squareWord(d, a); w.retrainOther = A.squareWord(d, c);
    return { w, names:{ a:a.name, b:b.name } };
  });
  lines.push(`the button says: empty "${words.w.empty}" · his "${words.w.onHim}" · beside "${words.w.beside}" · second "${words.w.second}" · full "${words.w.full}" · retrain "${words.w.retrain}"/"${words.w.retrainOther}"`);
  if(words.w.empty === words.w.beside)
    fails.push("the button says the same thing whether the square is empty or already holds a man — a second name reads as replacing the first");
  if(!String(words.w.beside).includes(words.names.a))
    fails.push(`the button does not name who he would be standing beside: "${words.w.beside}"`);
  if(!/second man/i.test(String(words.w.full)))
    fails.push(`on a full square the button does not warn that somebody is being displaced: "${words.w.full}"`);
  if(words.w.retrainOther !== null)
    fails.push(`the button offers the square during a retrain: "${words.w.retrainOther}" — the doctore trains at nothing else until it is finished`);

  /* ================= THE REAL SCREEN ================= */
  await found(p, { seed:"SQ-S" });
  await clearAll(p, 8);
  const planted = await forge(p, (A) => {
    const d = A.newGameState("Square","clean","SQ-S",null);
    d.gold = 30000; d.fame = 500; d.week = 40;
    while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 62));
    const men = A.activeG(d);
    men.forEach(g=>{ g.injury = null; g.fatigue = 4; g.status = "active"; });
    /* ---- THE FIXTURE'S DOCTORE HAS TO BE THE SHAPE THE GAME MAKES ----
       Hand-built as `{name, skill, wage, drill, pupil}` this crashed the whole App on render with
       "Cannot read properties of undefined (reading 'toLowerCase')" — `makeDoctore` also gives him
       an origin, a spec, a creed and a past, and the panel reads them. The failure looked exactly
       like "the square panel would not open", which is the wrong diagnosis of a fixture fault. */
    d.doctore = Object.assign(A.makeDoctore(d, 78),
      { name:"Oppius Naso", skill:78, fromHouse:true, pupil:men[0].id, second:men[1].id, retrainTo:null, retrainLeft:0 });
    d.ties = [ { a:men[0].id, b:men[1].id, kind:"rival", strength:48, since:1 } ];
    return { plant:d, names: men.slice(0,3).map(g=>g.name) };
  });
  await clearAll(p, 8);
  await tab(p, "ludus"); await p.waitForTimeout(340); await clearAll(p, 6);
  await tab(p, "ludus"); await p.waitForTimeout(320); await settle(p);
  /* the square is a hotspot in the drawn ludus, not a button — an SVG <g class="scn"> that takes a
     dispatched click. Looking for a <button> found nothing and read as "the panel would not open". */
  const said = await p.evaluate(()=>{
    const g = [...document.querySelectorAll(".scn")]
      .find(x=>(x.getAttribute("aria-label")||"").toLowerCase().includes("training square"));
    if(!g) return false;
    g.dispatchEvent(new MouseEvent("click",{bubbles:true}));
    return true;
  });
  if(!said) fails.push("no training-square hotspot in the drawn ludus");
  await p.waitForTimeout(650);
  const panel = await p.evaluate(()=>{
    const t = document.body.innerText || "";
    const i = t.search(/His week/i);
    return i < 0 ? null : t.slice(i, i + 420).replace(/\n+/g, " · ");
  });
  lines.push(`the square panel: ${panel ? panel.slice(0,240) : "NOT FOUND"}`);
  if(!panel) fails.push("the square panel would not open");
  else {
    const [n1, n2] = planted.names;
    if(!(panel.includes(n1) && panel.includes(n2)))
      fails.push(`the panel names only one of the two men standing on the square (wanted ${n1} and ${n2})`);
    if(!/set against each other/i.test(panel))
      fails.push("the panel does not say the two men are set against each other — it reads as one man with a spare");
    /* the loose version of this matched the word "close" anywhere in 420 characters of panel and
       would have passed with the tie line missing entirely — it is anchored to its own sentence */
    if(!/Between them already: (bad blood|hatred|friction|close|friendly|would die for him)\./i.test(panel))
      fails.push("the panel does not say what is already between the two men, which is the price of the second seat");
  }

  await waitSaved(p);
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
