/* HOW A HOUSE CAN END, AND THE TABLE THAT SAYS SO — #269

   (`epitaph` was free in BOTH directories; checked before writing. `probes/epitaph.mjs` is the
   instrument and shares the name on the usual convention.)

   ---- THREE OF THE ITEM'S NUMBERS WERE WRONG BEFORE ANYTHING WAS BUILT ----
   #269: "Grep the 53 lessons ... four never occur: `closed`, `emptied`, `banned`, `ruin`."

   **There are 35 lessons, not 53** — the same stale figure #265 corrected in the item that cited
   it, carried straight into this one.

   **And three of the four DO occur.** Two seed sets, 16 houses x 420 weeks an arm, every house run
   to its end:

     ref/A   ruin 7 · debt 7 · rebellion 1 · banned 1
     ref/B   debt 9 · rebellion 3 · ruin 3 · emptied 1
     most/A  debt 6 · ruin 5 · closed 3 · emptied 2
     most/B  ruin 9 · closed 3 · emptied 3 · debt 1

   `ruin` is the SECOND COMMONEST reference ending (10 of 32), `emptied` and `banned` both occur,
   and only `closed` is genuinely 0/32 for the reference. Under a complete player `closed` is 6 of
   32 — real, and a long way under the item's "9 and 11 of 16".

   **And `OVER_TEXT` has THIRTEEN entries while twelve are settable.** `romeFall` is written by
   nothing; `romeWeek`'s own comment says why ("Rome is a milestone, not the grave"). It is kept
   and pinned rather than cut — see the note over it.

   ---- WHAT IS FORESHADOWED, MEASURED RATHER THAN GREPPED ----
   A grep is wrong in both directions here: a lesson that says "free five men and there is nobody
   left" foreshadows `closed` without the string, and "the house is closed to him" carries the
   string and foreshadows nothing. `probes/epitaph.mjs` collects the corpora a player actually
   reads — 35 lessons, 19 feats, and 1,898 distinct agenda lines emitted over played weeks — and
   scores them under a deliberately LOOSE term filter. A loose filter OVER-reports, so a zero under
   one is a real zero: `foreclosed` and `disgrace` score zero everywhere. `triumph` is the
   well-signposted one (a feat, plus an agenda line counting the fame still short of Rome).

   And `OVER_TEXT` is referenced in exactly ONE place in the file — the end screen. Every word the
   game had written about how a house ends was read by a player who had already lost.

   FIVE ARMS. */
import { hasHandle, found, clearAll, settle } from "../harness.mjs";

export const name = "epitaph";
export const describe = "every ending has text, every text has an ending, and the nine that take a house are written down before they do";

/* the one entry with text and no door. Pinned by name so a SECOND orphan fails. */
const KNOWN_ORPHAN = ["romeFall"];
/* played toward, not suffered — deliberately absent from the list. See over END_DOORS. */
const NOT_LISTED = ["closed", "triumph", "oldAge"];

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["OVER_TEXT","END_DOORS","houseEnds","RUIN_NOTICE","RUINS","RUIN_KEYS",
      "newGameState","creditLine","EMPTY_LIMIT"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

    const house = (seed, over)=>{
      const d = A.newGameState("Ep","clean",seed,null);
      d.gold = 4000; d.week = 40; d.fame = 300;
      for(let i=0;i<3;i++){ const m = A.genGladiator(d, 70); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.fatigue=0; m.lastFought=-9; d.gladiators.push(m); }
      Object.assign(d, over||{});
      return d;
    };

    /* every title must render off a bare object — the list reads them from OVER_TEXT itself */
    const titles = {};
    for(const k of Object.keys(A.OVER_TEXT)){
      try { const t = A.OVER_TEXT[k]({}); titles[k] = t && t.title ? String(t.title) : null; }
      catch(e){ titles[k] = "THREW: " + e.message; }
    }

    const d = house("EPI_A");
    const rows = A.houseEnds(d);
    /* and the figures move with the house, which is what makes them the engine's and not prose */
    const poor = A.houseEnds(house("EPI_B", { gold: 90 }));
    const idle = A.houseEnds(house("EPI_C", { flags: Object.assign({}, d.flags, { idleYard: 9 }) }));

    return { overKeys:Object.keys(A.OVER_TEXT), titles,
      doors:A.END_DOORS.map(e=>e.kind), rows, poor, idle,
      notice:A.RUIN_NOTICE, ruinKeys:A.RUIN_KEYS.slice(),
      emptyLimit:A.EMPTY_LIMIT, line:A.creditLine(d) };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };

  /* ---- 5. and it is on the screen ---- */
  await found(p);
  await clearAll(p, 10);
  const screen = await p.evaluate(async ()=>{
    const open = [...document.querySelectorAll("button")]
      .find(b=>/settings|options/i.test(b.getAttribute("aria-label") || b.innerText || ""));
    if(open) open.click();
    await new Promise(r=>setTimeout(r, 400));
    for(const x of document.querySelectorAll("details")) x.open = true;
    await new Promise(r=>setTimeout(r, 250));
    const body = (document.body.innerText||"").replace(/\s+/g, " ");
    return { opened:!!open, hit:/how a house is lost/i.test(body), body };
  });
  await settle(p);

  const lines = [], fails = [];
  const settable = out.doors.slice();
  lines.push(`OVER_TEXT: ${out.overKeys.length} entries · END_DOORS: ${out.doors.length} — ${out.doors.join(", ")}`);
  lines.push(`the ${out.notice}-week notice is given by: ${out.ruinKeys.join(", ")}`);
  lines.push("what the list tells a house with 4,000d and three men:");
  for(const r of out.rows) lines.push(`   ${r.title.padEnd(26)} ${r.term} — ${r.at}${r.warned ? " [warned]" : ""}`);
  lines.push(`and with 90d in the box, the debt line reads: ${(out.poor.find(r=>r.kind==="debt")||{}).at}`);
  lines.push(`after 9 idle weeks, the empty line reads: ${(out.idle.find(r=>r.kind==="emptied")||{}).at}`);
  lines.push(screen.hit ? "on the screen: the settings carry How a house is lost"
    : `on the screen: NOT FOUND (settings ${screen.opened ? "opened" : "COULD NOT BE OPENED"})`);

  /* ---- 1. every text has a door, and every door has text ---- */
  { const orphans = out.overKeys.filter(k=>!settable.includes(k) && !NOT_LISTED.includes(k));
    const unexpected = orphans.filter(k=>!KNOWN_ORPHAN.includes(k));
    if(unexpected.length)
      fails.push(`${unexpected.join(", ")} has ending text that nothing can set — every \`d.over = {\` site in ` +
        `the file was enumerated for #269 and this is not among them. A paragraph no house can reach is dead ` +
        `content in a player-facing table; ${KNOWN_ORPHAN.join(", ")} is the one pinned exception and its reason is written over it`);
    for(const k of KNOWN_ORPHAN)
      if(!out.overKeys.includes(k))
        fails.push(`the pinned orphan "${k}" is gone from OVER_TEXT — if it was made reachable or cut, this pin should go with it`);
    for(const k of settable)
      if(!out.overKeys.includes(k))
        fails.push(`END_DOORS lists "${k}" and OVER_TEXT has no text for it — the end screen would render nothing`); }

  /* ---- 2. every title renders off a bare object ---- */
  for(const [k, t] of Object.entries(out.titles)){
    if(!t) fails.push(`OVER_TEXT.${k} has no title`);
    else if(/^THREW/.test(t))
      fails.push(`OVER_TEXT.${k} threw when asked for its title without an \`over\` object: ${t} — ` +
        `the settings list reads titles from this table rather than retyping them, so they have to survive a bare call`);
  }

  /* ---- 3. the list is the failures, and the played-toward ones are off it ---- */
  for(const k of NOT_LISTED)
    if(settable.includes(k))
      fails.push(`"${k}" is on the list of how a house is LOST — it is played toward, not suffered, and #269's ` +
        `risk note is that naming it makes it a goal`);
  if(out.doors.length < 8) fails.push(`only ${out.doors.length} doors listed — the nine ways a house is taken are the point`);
  for(const r of out.rows){
    if(!r.title || !r.term) fails.push(`the ${r.kind} row has no title or no term`);
    if(!r.at) fails.push(`the ${r.kind} row says what ends a house without saying where this one stands`);
  }

  /* ---- 4. the figures are the engine's own, not prose ---- */
  { const debt = out.rows.find(r=>r.kind==="debt") || {}, poor = out.poor.find(r=>r.kind==="debt") || {};
    /* NOT `\b`: the figure is printed as "-250d", and `\b250\b` cannot match a number with a digit
       boundary on one side and a letter on the other. Digit lookarounds are what this wants. */
    if(!new RegExp(`(?<![0-9])${Math.abs(out.line)}(?![0-9])`).test(String(debt.at)))
      fails.push(`the debt row does not carry \`creditLine\`'s own ${out.line} — "${debt.at}"`);
    if(debt.at === poor.at)
      fails.push(`the debt row reads the same at 4,000d and at 90d — it is prose, not the house's own figure`);
    const empt = out.rows.find(r=>r.kind==="emptied") || {}, idle = out.idle.find(r=>r.kind==="emptied") || {};
    if(!new RegExp(`(?<![0-9])${out.emptyLimit}(?![0-9])`).test(String(empt.term)))
      fails.push(`the emptied row does not carry \`EMPTY_LIMIT\` (${out.emptyLimit}) — "${empt.term}"`);
    if(empt.at === idle.at)
      fails.push(`the emptied row reads the same at 0 idle weeks and at 9 — it is not counting`);
    const warned = out.rows.filter(r=>r.warned).map(r=>r.kind).sort().join(",");
    if(warned !== out.ruinKeys.slice().sort().join(","))
      fails.push(`the rows marked "you are warned first" are [${warned}] against the RUINS table's [${out.ruinKeys.join(",")}]`); }

  /* ---- 5. on the screen ---- */
  if(!screen.hit)
    fails.push("the settings do not carry How a house is lost — the one surface this release adds is not reachable");
  else {
    const missing = out.rows.filter(r=>!new RegExp(r.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(screen.body));
    if(missing.length)
      fails.push(`the screen's list is missing ${missing.map(r=>r.kind).join(", ")}`);
    if(!new RegExp(`(?<![0-9])${out.notice}(?![0-9])`).test(screen.body))
      fails.push(`the screen does not say the ${out.notice} weeks' notice the RUINS three give`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
