/* WHAT THE OTHER HOUSES' MEN DID — #271

   (`wager` was free in BOTH directories; checked before writing.)

   ---- TWO OF THE ITEM'S THREE CITATIONS ARE WRONG ----
   #271: "The rope has `bet` and `betAgainst` ... and `checks/odds.mjs` holds the book."

   **`odds.mjs` does not hold the book.** It holds `winChance` — the arena panel's prediction against
   the sand — and its subject is which tactic the panel recommends. Nothing in it is about wagers.

   **And "the rival fighters are conjured per bout (`makeRivalFighter`) ... until #266's roster
   exists" is void twice over.** #266 was WITHDRAWN in v3.262.0 because the roster already exists.

   **What IS true is the first citation:** `bet` is own-bout only. The wager rides inside
   `doFight(d, p.gid, ...)`, `makeBet(g, opp)` is built in the arena panel off YOUR man, and
   `bet.against` is the FIX — betting against your own man — not a wager on a stranger.

   ---- AND THE CARD THE ITEM WANTED TO BET ON IS ALREADY THERE ----
   `probes/wager.mjs`, 300 weeks with the player booking NOTHING: **319 wins and 208 losses across
   147 distinct rival fighters, zero roster churn in the count.** The board resolves other men's
   bouts every week. Two sites do it and only one speaks:

       RIVAL_MOVES.won     46 of 531   ( 8.7%)  — writes a chronicle line naming the town
       rivalWeekly's roll 485 of 531   (91.3%)  — wrote NOTHING at all

   So a rival's record moved and the only way to know was to have read his sheet the week before and
   the week after. This release records it and puts it on his sheet.

   ---- NO WAGER, AND THE MEASUREMENT IS WHY ----
   A cold stranger wager returns **-20.5 denarii per hundred** (3,000 bouts, the book quoting 0.455
   against a realised 0.448 at a 12% vig). The player cannot have an edge, and that is structural:
   on his own bout his private information is the drilling `betChance` passes as 0; on a stranger's
   bout there is nothing he can know that the book cannot already see. That INVERTS the item's "coin
   from nothing" risk — a wager here is a button nobody should press.

   ---- AND THE FIELD NAME NEARLY COST A RELEASE ----
   The first cut wrote `h.form = h.form || []`. A rival house already HAS a `form`: a number seeded
   `ri(-12,12)` and carried weekly by `h.form = clamp(h.form*0.94 + dv, ...)`. An array there
   survives one line and then every rival's form is NaN, for ever, silently. The probe fell over it
   — "number -9 is not iterable" — and arm 2 below is that bug, held.

   FIVE ARMS. */
import { hasHandle, found, clearAll, installRope, tab, settle } from "../harness.mjs";

export const name = "wager";
export const describe = "a rival's recent results are kept and shown, and the ledger does not tread on his form";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["newGameState","rivalWeekly","noteRivalBout","rivalForm","rivalFormWord",
      "RIVAL_FORM","endWeek"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

    const d = A.newGameState("Wg","clean","WAGERCHK");
    d.gold = 60000; d.week = 40;
    const formsAtStart = (d.rivals||[]).map(h=>h.form);

    let weeks = 0;
    for(let w=0; w<260 && !d.over; w++){ weeks++; try { A.endWeek(d); } catch(e){ break; } }

    const houses = (d.rivals||[]).map(h=>({ name:h.name, form:h.form,
      formOk: typeof h.form === "number" && isFinite(h.form),
      lately:A.rivalForm(h).length, word:A.rivalFormWord(h),
      loud:A.rivalForm(h).filter(x=>x.loud).length,
      rows:A.rivalForm(h).map(x=>({ won:!!x.won, name:String(x.name||""), w:x.w,
        wins:x.wins, losses:x.losses })) }));

    /* the word must count what the list says, not what it remembers */
    const made = (()=>{ const h = { name:"Fixture", fighters:[] };
      const g = { name:"Verax", wins:3, losses:1, nick:null };
      for(let i=0;i<4;i++) A.noteRivalBout({ week:100+i }, h, g, i < 3);
      return { word:A.rivalFormWord(h), n:A.rivalForm(h).length }; })();

    /* and the window is bounded */
    const capped = (()=>{ const h = { name:"Cap", fighters:[] };
      const g = { name:"Long", wins:1, losses:0, nick:null };
      for(let i=0;i<40;i++) A.noteRivalBout({ week:i }, h, g, true);
      return A.rivalForm(h).length; })();

    return { houses, formsAtStart, weeks, made, capped, cap:A.RIVAL_FORM,
      newest:(d.rivals||[]).map(h=>A.rivalForm(h)[0] || null) };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };

  const lines = [], fails = [];
  lines.push(`${out.weeks} weeks played with the player booking nothing:`);
  for(const h of out.houses)
    lines.push(`   ${h.name.padEnd(12)} form ${String(h.form).slice(0,6).padStart(6)} · ${h.lately} kept (${h.loud} loud) · ${h.word || "nothing yet"}`);
  lines.push(`the word counts the list: 3 of 4 wins → "${out.made.word}" over ${out.made.n} rows`);
  lines.push(`the window is bounded: 40 bouts → ${out.capped} kept (RIVAL_FORM ${out.cap})`);

  /* ---- 1. the ledger fills from play ---- */
  { const withAny = out.houses.filter(h=>h.lately > 0);
    if(!withAny.length)
      fails.push(`not one of ${out.houses.length} rival houses recorded a single result over ${out.weeks} weeks — ` +
        `the probe counted 527 bouts in 300, so an empty ledger means \`noteRivalBout\` is not being called`);
    for(const h of out.houses)
      for(const r of h.rows){
        if(!r.name) fails.push(`${h.name} recorded a result with no man's name on it`);
        if(!(r.wins >= 0 && r.losses >= 0)) fails.push(`${h.name} recorded a result with no record on it`);
      } }

  /* ---- 2. AND IT DOES NOT TREAD ON `form` — the bug that nearly shipped ---- */
  for(let i=0;i<out.houses.length;i++){
    const h = out.houses[i];
    if(!h.formOk)
      fails.push(`House ${h.name}'s \`form\` is ${JSON.stringify(h.form)} after ${out.weeks} weeks — it is a NUMBER ` +
        `carried by \`h.form = clamp(h.form*0.94 + dv, ...)\`, and the first cut of this release wrote an ARRAY ` +
        `into it, which turns every rival's form to NaN silently and for ever`);
    if(typeof out.formsAtStart[i] !== "number")
      fails.push(`House ${h.name} did not start with a numeric form, so the arm above proves nothing`);
  }

  /* ---- 3. the window is bounded and the newest is first ---- */
  if(out.capped !== out.cap)
    fails.push(`40 results left ${out.capped} on the sheet against a RIVAL_FORM of ${out.cap} — the save carries this`);
  for(const h of out.houses)
    if(h.lately > out.cap) fails.push(`${h.name} kept ${h.lately} results, past the ${out.cap} allowed`);
  for(const n of out.newest)
    if(n && !(n.w >= 0)) fails.push("the newest entry carries no week");

  /* ---- 4. the word counts the list ---- */
  if(!/3 of his last 4/.test(String(out.made.word)))
    fails.push(`three wins in four read "${out.made.word}" — the word is supposed to count the rows it is over`);
  { const h = out.houses.find(x=>x.lately > 0);
    if(h && h.word){
      const m = /(\d+) of his last (\d+)/.exec(h.word);
      if(!m) fails.push(`a played house's form word does not read as a count: "${h.word}"`);
      else {
        if(+m[2] !== h.lately) fails.push(`${h.name}'s word says ${m[2]} results against the ${h.lately} kept`);
        if(+m[1] !== h.rows.filter(r=>r.won).length)
          fails.push(`${h.name}'s word says ${m[1]} wins against the ${h.rows.filter(r=>r.won).length} in the list`);
      } } }

  /* ---- 5. and it reaches the sheet, for a house never met ---- */
  await found(p, { seed:"WAGER-1" });
  await clearAll(p, 10);
  await installRope(p);
  const res0 = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const d = A.newGameState("Wg", "clean", "WAGERSHEET");
    for(let w=0; w<140; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
    d.over = null; d.gold = Math.max(d.gold, 5000);
    const live = (d.rivals||[]).filter(x=>!x.retired && A.rivalForm(x).length)[0];
    if(!live) return null;
    /* NEVER MET, deliberately: the form is about bouts you were not in, so the sheet has to carry
       it before `book.house` has anything at all. */
    d.metHouse = {}; d.book = d.book || {}; d.book.house = {};
    const keys = Object.keys(localStorage).filter(q=>/ludus-slot-\d/.test(q));
    const b = JSON.stringify(d); for(const k of keys) localStorage.setItem(k, b);
    const st = window.storage; if(st && !st.__wagerShut){ const real = st.set.bind(st);
      st.set = (k,v)=>/ludus-slot-\d/.test(k)?Promise.resolve({key:k,value:v}):real(k,v); st.__wagerShut = true; }
    return { name:live.name, word:A.rivalFormWord(live), n:A.rivalForm(live).length };
  });

  let sheet = null;
  if(!res0) fails.push("the played house had no rival with any recorded result, so arm 5 measured nothing");
  else {
    await p.reload({ waitUntil:"domcontentloaded" });
    await p.waitForTimeout(1100);
    await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>/take up the keys/i.test(x.innerText||"")); if(b) b.click(); });
    await p.waitForTimeout(1100);
    await clearAll(p, 10);
    await tab(p, "villa"); await p.waitForTimeout(500); await clearAll(p, 8); await settle(p);
    await p.evaluate(()=>{ for(const d of document.querySelectorAll("details")) d.open = true; });
    await p.waitForTimeout(300);
    await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
      .find(x=>/^the houses(\n|$)/i.test((x.innerText||"").trim())); if(b) b.click(); });
    await p.waitForTimeout(900); await settle(p);
    await p.evaluate((house)=>{
      const btns = [...document.querySelectorAll("button")].filter(x=>/^treat$/i.test((x.innerText||"").trim()));
      const rx = new RegExp(house, "i");
      for(const b of btns){ let e=b;
        for(let i=0;i<5&&e;i++){ const s=(e.innerText||""); if(s.length>320) break;
          if(rx.test(s)){ b.click(); return true; } e=e.parentElement; } }
      return false; }, res0.name);
    await p.waitForTimeout(900); await settle(p);
    sheet = await p.evaluate(()=>{ const m=document.querySelector(".modal"); return m ? (m.innerText||"").replace(/\s+/g," ") : null; });
    lines.push(sheet ? `on the screen: House ${res0.name} (never met) — ${/his men, lately/i.test(sheet) ? `carries "His men, lately"` : "NO FORM BLOCK"}`
      : `on the screen: the sheet for House ${res0.name} did not open`);
    if(!sheet) fails.push(`the Treat sheet for House ${res0.name} did not open, so arm 5 measured nothing`);
    else {
      if(!/his men, lately/i.test(sheet))
        fails.push(`the sheet for a house never met carries no form block — the whole of this release is bouts ` +
          `you were NOT in, and gating it behind having met him puts it behind the one condition that makes it dull`);
      if(res0.word && !sheet.replace(/\s+/g," ").toLowerCase().includes(res0.word.toLowerCase()))
        fails.push(`the sheet does not carry the form word "${res0.word}"`);
    }
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
