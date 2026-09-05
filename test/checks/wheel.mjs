/* THE YEAR IS A WHEEL — second phase queue #255

   The year is eighteen weeks, four seasons, six festivals each carrying its engine, and everything
   dated; #215 drew the suns and nobody drew the calendar. `calendarRows` fed a modal list grouped by
   week — right for reading, wrong for seeing where in the year you stand. `YearWheel` is that list
   drawn: a spoke per week of the YEAR (the wheel is stable, the pointer moves), the seasons as a
   band shaded from `SCN_GRADE`, the festivals as marks with their engine's glyph, and every row the
   list shows as a pin on its spoke — one element per row, so this check can count them.

   FIVE ARMS, on a forged house with a booking, a levy, a waiting patron, a pact and a hurt man:
   1 · THE WHEEL IS THE YEAR — eighteen spokes, four seasons, one pointer on this week.
   2 · EVERY ROW THE LIST SHOWS IS A PIN, and every pin is a row: the counts are equal, the pins
       sit on the spoke of their week, and a row that falls on the same week next year is hollow.
   3 · THE FESTIVALS ARE ON THE BAND WITH THE RIGHT ENGINE — six marks, at CALENDAR's weeks, each
       glyph the engine its `forceMelee`/`forceHunt`/`rest` says, the great games marked as such.
   4 · A SPOKE OPENS ITS WEEK — tapping one lists exactly that spoke's rows, as the same CalRow the
       list uses, and those rows route: a row for the arena selects the Arena tab and shuts the
       calendar, which is what `goTo` already did from the list.
   5 · AND THE ROWS COUNT IS THE GAME'S — `calendarRows` is on the handle now, and the list, the
       pins and the function agree to the number. */
import { found, clearAll, forge, tab } from "../harness.mjs";

export const name = "wheel";
export const describe = "the year is drawn as a wheel, and every dated thing is a pin on its spoke";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"WHEEL-1" });
  await clearAll(p, 12);

  const planted = await forge(p, (A)=>{
    const d = A.newGameState("Wheel", "clean", "WHEEL-1");
    d.week = 7;                                   /* summer, week 7 of the year */
    const men = d.gladiators.filter(g=>g.status==="active");
    const g = men[0], h = men[1] || men[0];
    /* `addDeadline` is not on the handle; this is its shape — an id off nextId, pushed */
    const add = o => { d.deadlines = d.deadlines || []; o.id = d.nextId++; d.deadlines.push(o); };
    add({ kind:"booking", name:g.name, gid:g.id, festKey:"romani", festName:"the Ludi Romani",
      advance:120, balance:340, due:d.week + 7, met:false });
    add({ kind:"levy", amount:240, what:"the aqueduct on the Appian side", due:d.week + 3 });
    /* and one thing on the same week NEXT YEAR, so the hollow pin is exercised and not just allowed */
    add({ kind:"levy", amount:90, what:"the road to Nola", due:d.week + A.YEAR_WEEKS });
    if(d.patrons[0]) d.patrons[0].want = { kind:"blood", due:d.week + 5 };
    d.pact = { kind:"season", until:d.week + 9, need:6, done:2, editor:"Aulus Vibius" };
    if(h && h !== g) h.injury = { name:"A torn shoulder", weeks:4 };
    return { plant:d, week:d.week, men:men.length };
  });
  if(planted && planted.__forge) return { pass:false, why:`the fixture could not be planted: ${planted.__forge}`, lines };

  const opened = await p.evaluate(()=>{
    const b = [...document.querySelectorAll("button[aria-label]")].find(x=>/the year ahead/i.test(x.getAttribute("aria-label")||""));
    if(!b) return { why:"no door to the year on the masthead" };
    b.click(); return { why:null };
  });
  if(opened.why) return { pass:false, why:opened.why, lines };
  await p.waitForTimeout(320);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const svg = document.querySelector("svg[data-wheel]");
    if(!svg) return { why:"the calendar opened and there is no wheel in it" };
    const S = A.__state ? A.__state() : null;
    const q = sel => [...svg.querySelectorAll(sel)];
    /* the pins carry `data-spoke` too, so a spoke is the GROUP — the first draft counted 35 */
    const spokes = q("g[data-spoke]").length, seasons = q("[data-season]").map(x=>x.getAttribute("data-season"));
    const pointer = q("[data-pointer]");
    const pins = q("[data-pin]").map(x=>({ week:+x.getAttribute("data-week"), wrap:x.getAttribute("data-wrap")==="1",
      spoke: +x.getAttribute("data-spoke") }));
    const fests = q("[data-fest]").map(x=>({ key:x.getAttribute("data-fest"), engine:x.getAttribute("data-engine"), tier:+x.getAttribute("data-tier") }));
    const listRows = document.querySelectorAll('[data-calrow="list"]').length;
    /* the week the game is on, read off the pointer and off the modal's own header line */
    const head = (document.body.innerText||"").match(/week (\d+) — everything/);
    return { spokes, seasons, pointer: pointer.length, pointerWeek: pointer[0] ? +pointer[0].getAttribute("data-week") : null,
      pins, fests, listRows, headWeek: head ? +head[1] : null, YEAR_WEEKS: A.YEAR_WEEKS, CAL: A.CALENDAR.map(F=>({ key:F.key, w:F.w, tier:F.tier||0,
        engine: F.rest ? "rest" : F.forceMelee ? "melee" : F.forceHunt ? "hunt" : "single" })) };
  });
  if(r.why) return { pass:false, why:r.why, lines };

  /* 1 */
  const yw = ((planted.week - 1) % r.YEAR_WEEKS) + 1;
  lines.push(`1. ${r.spokes} spokes · seasons ${r.seasons.join("/")} · pointer x${r.pointer} on week ${r.pointerWeek} (the house is on week ${yw} of the year)`);
  if(r.spokes !== r.YEAR_WEEKS) bad.push(`arm 1: ${r.spokes} spokes for a year of ${r.YEAR_WEEKS} weeks`);
  if(r.seasons.length !== 4) bad.push(`arm 1: ${r.seasons.length} seasons drawn`);
  if(r.pointer !== 1 || r.pointerWeek !== yw) bad.push(`arm 1: the pointer is on week ${r.pointerWeek}, the house is on ${yw}`);

  /* 2 */
  const wrong = r.pins.filter(x=>((x.week - 1) % r.YEAR_WEEKS) + 1 !== x.spoke);
  const wraps = r.pins.filter(x=>x.wrap), late = r.pins.filter(x=>x.week >= planted.week + r.YEAR_WEEKS);
  lines.push(`2. ${r.pins.length} pins against ${r.listRows} rows in the list · ${wrong.length} on the wrong spoke · ${wraps.length} hollow for next year (${late.length} rows fall there)`);
  if(r.pins.length !== r.listRows) bad.push(`arm 2: ${r.pins.length} pins for ${r.listRows} rows — the wheel and the list disagree`);
  if(r.pins.length < 8) bad.push(`arm 2: only ${r.pins.length} pins — the fixture did not date enough things to test with`);
  if(wrong.length) bad.push(`arm 2: ${wrong.length} pin(s) drawn on a spoke that is not their week`);
  if(wraps.length !== late.length) bad.push(`arm 2: ${late.length} rows fall on next year's week and ${wraps.length} pins are hollow`);

  /* 3 */
  const missing = r.CAL.filter(F=>!r.fests.some(x=>x.key===F.key));
  const wrongEng = r.CAL.filter(F=>{ const x = r.fests.find(y=>y.key===F.key); return x && (x.engine !== F.engine || x.tier !== F.tier); });
  lines.push(`3. ${r.fests.length} festival marks: ${r.fests.map(x=>`${x.key}=${x.engine}${x.tier?"·great":""}`).join(", ")}`);
  if(r.fests.length !== r.CAL.length || missing.length) bad.push(`arm 3: ${r.fests.length} marks for ${r.CAL.length} festivals${missing.length?` (missing ${missing.map(F=>F.key).join(", ")})`:""}`);
  if(wrongEng.length) bad.push(`arm 3: the wrong engine on ${wrongEng.map(F=>F.key).join(", ")}`);

  /* 4 — tap the booking's spoke, read its rows, route through one */
  const bookWeek = planted.week + 7, bookSpoke = ((bookWeek - 1) % r.YEAR_WEEKS) + 1;
  const tapped = await p.evaluate((sp)=>{
    const svg = document.querySelector("svg[data-wheel]");
    const wedge = svg && svg.querySelector(`[data-spoke="${sp}"] [role=button]`);
    if(!wedge) return { why:`no tappable wedge on spoke ${sp}` };
    wedge.dispatchEvent(new MouseEvent("click", { bubbles:true }));
    return { why:null };
  }, bookSpoke);
  if(tapped.why) bad.push(`arm 4: ${tapped.why}`);
  else {
    await p.waitForTimeout(200);
    const seen = await p.evaluate((sp)=>{
      const rows = [...document.querySelectorAll('[data-calrow="spoke"]')].map(x=>(x.innerText||"").replace(/\n/g," | ").slice(0,70));
      const pinsOn = document.querySelectorAll(`svg[data-wheel] [data-pin][data-spoke="${sp}"]`).length;
      return { rows, pinsOn };
    }, bookSpoke);
    lines.push(`4. spoke ${bookSpoke} tapped: ${seen.rows.length} row(s) listed against ${seen.pinsOn} pin(s) — ${seen.rows.join(" / ")}`);
    if(seen.rows.length !== seen.pinsOn || !seen.rows.length) bad.push(`arm 4: the spoke lists ${seen.rows.length} rows and carries ${seen.pinsOn} pins`);
    if(!seen.rows.some(t=>/on the bill/i.test(t))) bad.push(`arm 4: the booking is not among the tapped spoke's rows`);
    const routed = await p.evaluate(()=>{
      const row = [...document.querySelectorAll('button[data-calrow="spoke"]')].find(x=>/on the bill/i.test(x.innerText||""));
      if(!row) return { why:"the booking row is not a button" };
      row.click(); return { why:null };
    });
    if(routed.why) bad.push(`arm 4: ${routed.why}`);
    else {
      await p.waitForTimeout(300);
      /* `[data-place]` is what the harness's own `tab()` treats as the authority on where the player is */
      const after = await p.evaluate(()=>({
        wheel: !!document.querySelector("svg[data-wheel]"),
        tabOn: (document.querySelector("[data-place]") || {}).getAttribute ? document.querySelector("[data-place]").getAttribute("data-place") : null }));
      lines.push(`4. after the tap: calendar ${after.wheel ? "still open" : "closed"}, tab "${after.tabOn}"`);
      if(after.wheel) bad.push(`arm 4: the calendar stayed open after routing`);
      if(!/arena/i.test(after.tabOn||"")) bad.push(`arm 4: routed to "${after.tabOn}", not the Arena`);
    }
  }

  /* 5 — the function, the list and the pins agree */
  const n = await p.evaluate(()=>{ const A = window.__LVDVS;
    if(typeof A.calendarRows !== "function") return { why:"calendarRows is not on the handle" };
    const keys = Object.keys(localStorage).filter(q=>/ludus-slot-\d/.test(q));
    let d = null; for(const k of keys){ try { const x = JSON.parse(localStorage.getItem(k)); if(x && x.flags && x.flags.__forge){ d = x; break; } } catch(e){} }
    if(!d) return { why:"the planted house is not in a slot" };
    return { rows: A.calendarRows(d, A.YEAR_WEEKS).length }; });
  if(n.why) bad.push(`arm 5: ${n.why}`);
  else { lines.push(`5. calendarRows says ${n.rows}; the list showed ${r.listRows}; the wheel pinned ${r.pins.length}`);
    if(n.rows !== r.pins.length) bad.push(`arm 5: calendarRows returns ${n.rows} rows and the wheel pinned ${r.pins.length}`); }

  return { pass: bad.length === 0 && !errors.length, why: bad[0] || null, lines };
}
