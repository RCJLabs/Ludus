/* THE PAIR CHOOSER WAS BLIND ON THE ONE AXIS THE PAIR ENGINE READS — #202

   Three things ride on WHICH two men you send out together and the chooser said none of them:

     the fight   `assistMult` gives brothers up to 1.70x on the assist and rivals as little as
                 0.55x. It is the largest modifier either man carries into that bout.
     an ambition `AMBITIONS.beside` is met in ONE place in the file, inside `doPairFight`, and only
                 when the tie is already `brother` — pairing two strangers can never meet it.
     a feud      a rival pair that wins turns brother 35% of the time. It is the only way in the
                 game to end a feud, and no player could aim at it.

   Measured before it was built (probes/beside.mjs, 8 houses x 300 weeks an arm): on the weeks a
   pair was on the bill, two of the fit men were already brothers 72.4% of the time — and the top
   two by stat, which is the order the chooser lists them in, WERE that pair only 25.3% of the time.

   THIS CHECK DRIVES THE REAL SCREEN, because the marks are writing and writing is only true where
   it is rendered. #196 shipped a pronoun fault into a table that its own model-level check passed:
   a woman was offered "Tell him no". So this forges the three relations, opens the arena, picks a
   man, and reads what the OTHER man's row actually says — including on a house of women.

   IT ALSO GUARDS THE TWO MARKS IT SWALLOWED. `rowMarks` took over the booking and the drilling
   lines when they moved out of App (which had no allowance left), and a table that silently stops
   printing an older mark is the failure mode of every consolidation in this project. */

import { found, tab, clearAll, forge, settle, click, waitSaved } from "../harness.mjs";

export const name = "beside";
export const describe = "the pair chooser says who is standing beside him";

const topWrap = `(()=>{ const ws=[...document.querySelectorAll(".modalwrap")]
  .map(w=>({z:+getComputedStyle(w).zIndex||50,w})).sort((a,b)=>b.z-a.z); return ws[0] && ws[0].w; })()`;

export async function run({ p, errors }){
  const fails = [], lines = [];

  /* ---- THE TABLE ITSELF, BEFORE ANY SCREEN ----
     Every entry must be reachable: an entry no fixture can raise is unreachable writing, which is
     what #188 found in `nokill` and `nobeast` (651 given, 0 ever met). */
  const table = await p.evaluate(()=>{
    const A = window.__LVDVS;
    if(!A.ROW_MARKS || !A.rowMarks) return null;
    return { keys: A.ROW_MARKS.map(m=>m.key), pair: A.ROW_MARKS.filter(m=>m.pair).map(m=>m.key) };
  });
  if(!table) return { pass:false, why:"ROW_MARKS or rowMarks is not on the handle", lines };
  lines.push(`the table: ${table.keys.length} marks [${table.keys.join(" ")}] · ${table.pair.length} of them need a man beside him [${table.pair.join(" ")}]`);
  for(const k of ["booked","prep","brother","feud","beside"])
    if(!table.keys.includes(k)) fails.push(`ROW_MARKS has lost the "${k}" mark`);

  /* ---- EVERY MARK RAISED ON A HOUSE BUILT FOR IT ----
     Model level first, so a failure on the screen below can be told apart from a mark that never
     fires at all. The relations are forged rather than played for: a brother tie at 62 forms in
     about one house-week in three and a rival at 55 rather less, and a check that waits for both
     is a check that measures the tie generator. */
  const raised = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Marks","clean","MARK-1",null);
    while(A.activeG(d).length < 4) d.gladiators.push(A.genGladiator(d, 60));
    const [a,b,c,e] = A.activeG(d);
    d.ties = [ { a:a.id, b:b.id, kind:"brother", strength:62, since:1 },
               { a:c.id, b:e.id, kind:"rival",   strength:55, since:1 } ];
    a.ambition = { kind:"beside", met:false, broken:false, voiced:1, since:1, promised:false, despair:false };
    const say = (g, mate, offer) => A.rowMarks(d, g, offer||null, mate||null).map(m=>m.key+": "+m.text);
    return {
      alone:   say(a, null),
      brother: say(a, b),
      feud:    say(c, e),
      /* and a man with the ambition paired with somebody he does NOT trust raises neither the
         brother mark nor the beside mark — the ambition is not met by any pairing */
      stranger: say(a, { id:"nobody", name:"Nobody" }),
      booked:  say(b, null, { bookedGid:b.id }),
      /* the other mark this table swallowed. `prepFor` wants a `prep` whose fid matches the
         offer's oppRef, and `prepEdge` wants weeks on it — forged, because playing a house until
         somebody has drilled for a named man measures the scouting, not the mark. */
      prep:    (()=>{ b.prep = { fid:"FOE-1", name:"Rutilus", house:"Another", cls:"Murmillo", weeks:3, since:1 };
                 return say(b, null, { oppRef:{ house:"Another", fid:"FOE-1" } }); })(),
      names: { a:a.name, b:b.name, c:c.name, e:e.name },
    };
  });
  lines.push(`with nobody beside him: ${raised.alone.length ? raised.alone.join(" | ") : "no marks"}`);
  lines.push(`brothers: ${raised.brother.join(" | ") || "NOTHING"}`);
  lines.push(`feud:     ${raised.feud.join(" | ") || "NOTHING"}`);
  lines.push(`booked:   ${raised.booked.join(" | ") || "NOTHING"}`);

  if(raised.alone.length) fails.push(`a man with nobody picked beside him raised ${raised.alone.length} pair marks — the mark is about the pairing and there is no pairing`);
  if(!raised.brother.some(x=>x.startsWith("brother:"))) fails.push("two forged brothers raised no brother mark");
  if(!raised.brother.some(x=>x.startsWith("beside:"))) fails.push("the man carrying `beside`, paired with his brother, was not told this is the thing he asked for");
  if(!raised.feud.some(x=>x.startsWith("feud:"))) fails.push("two forged rivals raised no feud mark");
  if(raised.stranger.length) fails.push(`pairing the ambition-carrier with a stranger raised ${raised.stranger.length} marks — \`beside\` cannot be met that way and the screen must not imply it can`);
  if(!raised.booked.some(x=>x.startsWith("booked:"))) fails.push("the booking mark did not survive the move out of App");
  lines.push(`drilled:  ${raised.prep.join(" | ") || "NOTHING"}`);
  if(!raised.prep.some(x=>x.startsWith("prep:"))) fails.push("the drilling mark did not survive the move out of App");

  /* the two men must be NAMED in the mark, or it is a label rather than a sentence about them */
  const bro = raised.brother.find(x=>x.startsWith("brother:")) || "";
  if(bro && !(bro.includes(raised.names.a) && bro.includes(raised.names.b)))
    fails.push(`the brother mark names neither man: "${bro.slice(0,80)}"`);

  /* ---- AND A HOUSE OF WOMEN, because `her()` is the only thing standing between this table and
     "He has drilled for this man" over a woman's name. */
  const fem = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Marks","clean","MARK-F",null);
    while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 60));
    A.activeG(d).forEach(g=>{ g.sex = "f"; });
    const [a,b] = A.activeG(d);
    d.ties = [ { a:a.id, b:b.id, kind:"brother", strength:62, since:1 } ];
    a.ambition = { kind:"beside", met:false, broken:false, voiced:1, since:1, promised:false, despair:false };
    return A.rowMarks(d, a, { bookedGid:a.id }, b).map(m=>m.text);
  });
  lines.push(`a house of women: ${fem.join(" | ") || "NOTHING"}`);
  for(const t of fem){
    const he = t.match(/\b(He|him|his|himself)\b/);
    if(he) fails.push(`a mark over a woman reads "${he[1]}": "${t.slice(0,90)}"`);
    if(/\ba man in her\b|\bman in her position\b/.test(t))
      fails.push(`a gendered noun the pronoun helper rewrote into nonsense: "${t.slice(0,90)}"`);
  }

  /* ================= AND NOW THE REAL SCREEN ================= */
  await found(p, { seed:"MARK-S" });
  await clearAll(p, 8);
  await forge(p, (A) => {
    const d = A.newGameState("Marks","clean","MARK-S",null);
    d.gold = 30000; d.fame = 900; d.week = 60;
    while(A.activeG(d).length < 4) d.gladiators.push(A.genGladiator(d, 68));
    const men = A.activeG(d);
    men.forEach(g=>{ g.injury = null; g.fatigue = 5; g.lastFought = 0; g.status = "active"; });
    d.ties = [ { a:men[0].id, b:men[1].id, kind:"brother", strength:66, since:1 } ];
    men[0].ambition = { kind:"beside", met:false, broken:false, voiced:1, since:1, promised:false, despair:false };
    /* the bill is forged too: `addPair` rolls at 0.60 behind a fame gate, and a check that plays
       weeks until a pair turns up is measuring `makeGames` rather than the chooser. But the WEEK
       has to be a games week or `makeGames` sets `d.games = null` and the arena has no bill at all
       — week 60 is a rest week on this calendar, which cost this fixture its first run. */
    let guard = 0;
    while(guard++ < 60){ A.makeGames(d); if(d.games && (d.games.offers||[]).length) break; d.week++; }
    if(!d.games) return { plant:d, names:[], why:"no games week in sixty" };
    const t1 = A.TIERS[1];
    d.games.offers = [{ id: d.nextId++, tier:1, festival: d.games.festival, pair:true,
      opps:[A.genOpponent(0, undefined, d), A.genOpponent(0, undefined, d)], oppRefs:[null,null],
      stakes:"standard", purse: Math.round(t1.purse[0]) }];
    d.games.offers.forEach(o=>{ if(!o.venue) o.venue = A.venueFor(d, o); if(!o.sky) o.sky = A.skyFor(d, o); });
    d.games.week = d.week;
    return { plant:d, names: men.slice(0,3).map(g=>g.name) };
  });
  await clearAll(p, 8);
  await tab(p, "arena"); await p.waitForTimeout(340);
  await clearAll(p, 6);
  await tab(p, "arena"); await p.waitForTimeout(320); await settle(p);
  if(!(await click(p, /choose a bout/i))) return { pass:false, why:"the arena would not open the wizard", lines };
  await p.waitForTimeout(750);

  const screen = await p.evaluate(`(()=>{
    const w = ${topWrap}; if(!w) return { why:"the wizard did not open" };
    const rows = [...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled);
    const pair = rows.find(x=>/pair|together|two of yours/i.test((x.innerText||"").replace(/\\n/g," ")));
    if(!pair) return { why:"no pair bout on the forged bill: " + rows.map(x=>(x.innerText||"").split("\\n")[0]).join(" / ").slice(0,120) };
    pair.click();
    return { why:null };
  })()`);
  if(screen.why) return { pass:false, why:screen.why, lines };
  await p.waitForTimeout(700);

  const before = await p.evaluate(`(()=>{
    const w = ${topWrap}; if(!w) return null;
    const rows = [...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled);
    return rows.map(r=>(r.innerText||"").replace(/\\n/g," · "));
  })()`);
  if(!before) return { pass:false, why:"the man-picker did not open", lines };
  lines.push(`the picker, nobody chosen: ${before.length} rows`);
  for(const r of before) lines.push(`     ${r.slice(0,96)}`);
  const marked = before.filter(r=>/✦/.test(r) && /came up together|do not speak|has been asking/.test(r));
  if(marked.length) fails.push(`${marked.length} pair marks on screen before anybody was chosen — there is nobody to be beside`);

  /* pick the first man and read the SECOND man's row */
  const after = await p.evaluate(`(()=>{
    const w = ${topWrap}; if(!w) return null;
    const rows = [...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled);
    if(rows.length < 2) return { rows:[], why:"fewer than two men fit for the pair" };
    rows[0].click();
    return { clicked:(rows[0].innerText||"").split("\\n")[0] };
  })()`);
  if(after && after.why) return { pass:false, why:after.why, lines };
  await p.waitForTimeout(450);
  const now = await p.evaluate(`(()=>{
    const w = ${topWrap}; if(!w) return null;
    return [...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled)
      .map(r=>(r.innerText||"").replace(/\\n/g," · "));
  })()`);
  lines.push(`after choosing ${after.clicked}:`);
  for(const r of (now||[])) lines.push(`     ${r.slice(0,110)}`);

  const brotherRow = (now||[]).find(r=>/came up together/.test(r));
  if(!brotherRow) fails.push("the brother's row on the real screen says nothing about the man already chosen — the mark renders in the model and not in the app");
  else lines.push(`     >>> the brother's row reads: "${(brotherRow.match(/[^·]*came up together[^·]*/)||[""])[0].trim().slice(0,100)}"`);

  /* ---- AND THE MARK THAT MATTERS MOST NEEDS BOTH MEN CHOSEN ----
     `mate(x)` is `pairSel.find(i=>i!==x.id)`, so the first man picked has no mate and his own row
     carries nothing — correctly. The `beside` mark lives on the row of the man who WANTS it, which
     means it cannot appear until the pair is complete. A check that clicks once and stops has not
     seen the sentence this release exists to print. */
  await p.evaluate(`(()=>{ const w = ${topWrap}; if(!w) return;
    const rows = [...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled);
    const bro = rows.find(r=>/came up together/.test(r.innerText||""));
    if(bro) bro.click(); })()`);
  await p.waitForTimeout(450);
  const both = await p.evaluate(`(()=>{
    const w = ${topWrap}; if(!w) return null;
    return [...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled)
      .map(r=>(r.innerText||"").replace(/\\n/g," · "));
  })()`);
  lines.push(`with both men chosen:`);
  for(const r of (both||[])) lines.push(`     ${r.slice(0,110)}`);
  const wantRow = (both||[]).find(r=>/has been asking for/.test(r));
  if(!wantRow) fails.push("with both men standing the chooser still does not say that this pairing is the thing one of them has been asking for — the `beside` mark does not reach the screen");
  else lines.push(`     >>> and: "${(wantRow.match(/[^·]*has been asking for[^·]*/)||[""])[0].trim().slice(0,110)}"`);

  await waitSaved(p);
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
