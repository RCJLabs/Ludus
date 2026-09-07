/* THE SECOND DECADE'S OWN TABLE — #248 phase 1.

   (`decade` was free in both directories; checked before writing.)

   `LATE` doubled in v3.226.0 — four one-shot events a house with a decade behind it can be offered
   became eight — and a table that doubles is a table whose contract is worth holding. `voice`
   already requires it to be REACHABLE from a test; nothing required its entries to WORK.

   FOUR ARMS.

   1 · EVERY ENTRY HAS THE SHAPE THE RAISER READS. `lateWeek` reads `need`, `w`, `title`, `text(d)`
       and `choices`; `EVENTS.late.run` reads `LATE[k].run(d, i)`. An entry missing any of them is a
       card that throws in front of a player who has played for ten years, which is the worst
       possible moment for it.
   2 · AND EVERY CHOICE RETURNS A LINE. `run(d, i)` for every index of `choices`, on a state deep
       enough to satisfy the entry — the return value IS what the player is shown, so an index that
       falls off the end returns undefined and the card goes blank. Each is run on its own copy, so
       one choice's effects cannot mask another's.
   3 · AND NO ENTRY IS UNREACHABLE. Each `need` must be satisfiable — a written event nobody can
       ever meet is the same as no event, and this table's whole purpose is content that arrives.
       Driven, on a state built to open the gate rather than a run that hopes to.
   4 · AND IT FIRES ONCE. `lateWeek` removes a key by writing it to `flags.lateSeen`; a key that
       could come round twice would be the one thing worse than never arriving.

   WHAT THIS CHECK DOES NOT HOLD, because the measurement says it cannot: the item's KPI. Every one
   of the eight gates opens in the run's SECOND quarter (years 6-10, weeks 108-180, against a
   quarter boundary of 105) and seven of the eight are consumed by the third. The KPI is a
   fourth-quarter novelty rate. One-shot content gated at year 6 cannot raise it however many
   entries the table has — see the note over `LATE` and ROADMAP v3.226.0. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "decade";
export const describe = "every LATE entry has the shape its raiser reads, every choice returns a line, and each arrives once";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"DECADE-1" });
  await clearAll(p, 10);
  await installRope(p);

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","LATE","LATE_KEYS","lateWeek","activeG","houseRecord"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const KEYS = A.LATE_KEYS;

    /* a house deep enough that every gate CAN open: ten years in, men on the sand, a long-serving
       doctore, fame, a bitter rival, a column of dead, and a yard that has outlived somebody */
    const deep = () => {
      const d = A.newGameState("De", "clean", "DECADECHK");
      d.week = 10 * 18 + 4;
      d.fame = 1400; d.gold = 6000;
      if(d.lanista){ d.lanista.age = 56; d.lanista.health = 70; }
      d.annals = [];
      for(let i=0; i<14; i++) d.annals.push({ name:"A man", wins:3, losses:2, kills:1, fate:"dead" });
      for(const h of (d.rivals||[])) h.grudge = 60;
      /* a dark house with a lineage, for `newcomer` */
      if((d.rivals||[]).length){ const h = d.rivals[d.rivals.length-1];
        h.retired = true; h.retiredAt = d.week - 20;
        h.lineage = { name:"An old man", house:h.name, fame:300 }; }
      if(!d.doctore) d.doctore = { name:"Doctore", wage:40, weeks:0 };
      d.doctore.weeks = 220;
      return d;
    };

    const shape = {}, ran = {}, reach = {}, once = {};
    for(const k of KEYS){
      const L = A.LATE[k];
      shape[k] = { need:typeof L.need === "function", w:typeof L.w === "number" && L.w > 0,
        title:typeof L.title === "string" && L.title.length > 0,
        text:typeof L.text === "function", choices:Array.isArray(L.choices) && L.choices.length > 0,
        run:typeof L.run === "function" };
      /* 3 · reachable */
      { const d = deep(); let ok = false; try { ok = !!L.need(d); } catch(e){ ok = false; }
        reach[k] = ok; }
      /* 1b · the text renders */
      { const d = deep(); let t = null; try { t = L.text(d); } catch(e){ t = null; }
        shape[k].textOut = typeof t === "string" && t.length > 20; }
      /* 2 · every choice returns a line, each on its own copy */
      ran[k] = (L.choices||[]).map((_, i)=>{ const d = deep();
        try { const r = L.run(d, i); return typeof r === "string" && r.length > 10 ? "ok" : `returned ${typeof r}`; }
        catch(e){ return `threw: ${e.message}`; } });
    }

    /* 5 · the forebear — driven, because 7-8% of houses ever have one and a run would not reach it */
    const fore = (()=>{
      const mk = (withMen) => {
        const d = A.newGameState("Fo", "clean", "FORECHK");
        d.week = 400;
        d.forebears = [{ name:"Aulus Varius", age:61, traits:[], from:20, to:360, gen:1,
          retired:false, wife:null, children:[] }];
        d.annals = A.activeG(d).map((g,i)=>({ id:g.id, name:g.name,
          joined: (withMen && i === 0) ? 200 : 380, left:null }));
        return d; };
      /* ---- READ THE LINE BY ITS WEEK, NOT BY THE LOG'S LENGTH ----
         `chron` UNSHIFTS: the newest entry is at the front. The first cut of this arm took
         `log.slice(before)` and so captured the log's OLDEST entry six times over — the scenario's
         own opening line — and reported "the forebear said the same thing every time". The game was
         doing exactly the right thing and the arm was reading the wrong end of the array. */
      const atWeek = (x, wk) => (x.log||[]).filter(l=>l && l.week === wk).map(l=>l.text);
      const said = [], offCadence = [];
      const d = mk(true);
      for(let w=1; w<=A.FORE_EVERY*8; w++){
        d.week = 360 + w; d.pendingEvent = null;
        A.foreWeek(d);
        const add = atWeek(d, d.week);
        if(w % A.FORE_EVERY === 0) said.push(...add); else offCadence.push(...add);
      }
      const e = mk(false), noMen = [];
      for(let w=1; w<=A.FORE_EVERY*8; w++){
        e.week = 360 + w; e.pendingEvent = null;
        A.foreWeek(e);
        noMen.push(...atWeek(e, e.week));
      }
      const n = A.newGameState("Fo", "clean", "FORECHK"); n.forebears = [];
      let none = 0;
      for(let w=0; w<A.FORE_EVERY*4; w++){ n.week = 400 + w; A.foreWeek(n); none += atWeek(n, n.week).length; }
      const g = mk(true); const rngBefore = A.rngGet ? A.rngGet() : null;
      for(let w=1; w<=A.FORE_EVERY*8; w++){ g.week = 360 + w; g.pendingEvent = null; A.foreWeek(g); }
      const rngAfter = A.rngGet ? A.rngGet() : null;
      return { said, offCadence, noMen, none, lines:A.FORE_LINES.length, every:A.FORE_EVERY,
        rngSame: rngBefore != null && rngBefore === rngAfter, rngRead: rngBefore != null };
    })();

    /* 4 · one-shot: force a key, then hammer `lateWeek` and see whether it comes round again */
    for(const k of KEYS){
      const d = deep();
      d.flags = d.flags || {}; d.flags.lateSeen = [k];
      let again = false;
      for(let i=0; i<800; i++){ d.pendingEvent = null;
        try { A.lateWeek(d); } catch(e){ break; }
        if(d.pendingEvent && d.pendingEvent.data && d.pendingEvent.data.k === k){ again = true; break; } }
      once[k] = !again;
    }
    return { keys:KEYS, shape, ran, reach, once, fore };
  });
  if(out.why) return { pass:false, why:out.why, lines };

  lines.push(`\`LATE\` carries ${out.keys.length} entries: ${out.keys.join(", ")}`);
  for(const k of out.keys){
    const S = out.shape[k];
    const missing = Object.entries(S).filter(([f,v])=>v !== true).map(([f])=>f);
    if(missing.length)
      bad.push(`\`LATE.${k}\` is missing or malformed: ${missing.join(", ")} — \`lateWeek\` reads every one of `
        + `these and a card that throws in front of a ten-year house is the worst possible moment for it`);
    const bads = (out.ran[k]||[]).map((r,i)=>r === "ok" ? null : `choice ${i} ${r}`).filter(Boolean);
    if(bads.length)
      bad.push(`\`LATE.${k}\` — ${bads.join("; ")}. The return value IS the line the player is shown`);
    if(!out.reach[k])
      bad.push(`\`LATE.${k}\`'s gate did not open on a house ten years in with fourteen buried, a doctore of `
        + `220 weeks, fame 1,400, a bitter rival and an outlived house — a written event nobody can meet `
        + `is the same as no event`);
    if(!out.once[k])
      bad.push(`\`LATE.${k}\` came round again with its key already in \`flags.lateSeen\` — these are one-shot `
        + `by construction and a repeat is worse than a no-show`);
  }
  lines.push(`  reachable: ${out.keys.filter(k=>out.reach[k]).length}/${out.keys.length} · `
    + `choices returning a line: ${out.keys.reduce((n,k)=>n+(out.ran[k]||[]).filter(r=>r==="ok").length,0)}`
    + `/${out.keys.reduce((n,k)=>n+(out.ran[k]||[]).length,0)} · one-shot: ${out.keys.filter(k=>out.once[k]).length}/${out.keys.length}`);

  /* 5 · the forebear */
  { const F = out.fore;
    if(!F){ bad.push(`the forebear arm returned nothing — it computed and was never reported, which is the `
      + `inert-arm shape this file already holds LATE against`); }
    else {
    const uniq = [...new Set(F.said)];
    lines.push(`  the forebear: ${F.said.length} lines on the ${F.every}-week cadence (${uniq.length} distinct `
      + `of ${F.lines} written), ${F.offCadence.length} off it, ${F.noMen.length} with nobody left who served `
      + `under him, ${F.none} in a house with no forebear${F.rngRead ? ` · stream ${F.rngSame ? "unmoved" : "MOVED"}` : ""}`);
    if(!F.said.length)
      bad.push(`\`foreWeek\` said nothing in eight cadences on a house with a forebear and a man who served `
        + `under him — the phase is a line of prose and this is whether it is there at all`);
    if(F.offCadence.length)
      bad.push(`${F.offCadence.length} lines landed OFF the ${F.every}-week cadence — it is about once a season, not whenever`);
    if(uniq.length < 2)
      bad.push(`the forebear said the same thing every time (${uniq.length} distinct line) — recurring content that `
        + `repeats itself is worse than one-shot content, which is the trap phase 1 fell into`);
    for(const t of [...F.said, ...F.noMen])
      if(/undefined|NaN|\[object/.test(String(t)))
        bad.push(`a forebear line rendered a hole: "${String(t).slice(0,90)}"`);
    if(F.noMen.length >= F.said.length)
      bad.push(`with nobody left who served under him the house still said as much (${F.noMen.length} against `
        + `${F.said.length}) — the lines that name a man drop out, and the men who knew him run out before the memory does`);
    if(F.none)
      bad.push(`a house with no forebear at all said ${F.none} things about one`);
    if(F.rngRead && !F.rngSame)
      bad.push(`\`foreWeek\` consumed the random stream — a new draw in the weekly path re-phases every seeded `
        + `fixture in this project, which is not a price a line of prose gets to charge`); } }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`all ${out.keys.length} arrive, all their choices answer, and none comes round twice`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
