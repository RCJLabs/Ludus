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
    return { keys:KEYS, shape, ran, reach, once };
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

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`all ${out.keys.length} arrive, all their choices answer, and none comes round twice`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
