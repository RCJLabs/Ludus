/* WHAT HAS PASSED BETWEEN THE TWO OF YOU — audit item #249, phase 3.

   (`treat` was free in both directories; checked before writing.)

   `metHouse` is written on every card a rival's man appears on — `met`, and a `seen` list of which
   of `RIVAL_BEATS`' eight have happened between the houses — and it was **read by no panel at all**.
   The league row surfaces the record book's per-house line and `h.after` (both shipped earlier); the
   Treat sheet, which is the one screen that is ABOUT a single house, showed his men, his grudge word
   and a price, and nothing whatever about the years you had spent against him.

   THE BEATS ARE THE PART WITH NO OTHER HOME. Each of the eight fires once per house for ever — the
   table shared after the games, the respect that comes only from having beaten each other three
   times each, the loan, the warning, the offer, the bitterness, the years, the peace — and a rivalry
   that has produced four of them is a different thing from one that has produced none.

   THREE ARMS. Two off the table, one off the rendered sheet.

   1 · EVERY BEAT HAS A NAME. `BEAT_WORD` must cover every key in `RIVAL_BEATS`, or a beat that has
       genuinely happened is silently dropped from the line — the panel filters on the label table,
       so a missing entry looks exactly like a rivalry that never had that beat.
   2 · AND THEY ARE NOUNS, NOT VERBS. The eight do not share a subject: `warning` is HIM finding you
       before the card goes up, `loan` is HIM sending four hundred denarii, `offer` is HIM asking for
       one of your men. The first cut wrote them behind "You have …" and produced "You have drunk
       together, come to respect him, warned you, grown old together." A label starting with a past
       participle is that fault coming back.
   4 · AND IT SAYS WHETHER IT IS STILL FRESH. #246 phase 5 holds back 65% of a house's weekly
       forgetting for `GRUDGE_FRESH` weeks after a card against it, and that rule moves a number the
       player never sees. The line belongs on this panel — it is the one that exists to say what has
       passed between the two of you — and it has to say the same week count `metHouse.last` does,
       which is #150's rule applied to a sentence.
   3 · AND THE SHEET SHOWS THE RECORD. Opened on a house with a planted history: the card count and
       the win-loss, both from the record book — ONE source, which is #150's rule; the first cut took
       the count from `metHouse.met` and the record from the book and put two systems' counters on
       one line for a reader to subtract. And the beats, named. */
import { found, clearAll, installRope, tab, settle } from "../harness.mjs";

export const name = "treat";
export const describe = "the Treat sheet says what has passed between the two houses, and every beat has a name";

export async function run({ p, errors }){
  const lines = [], bad = [];

  /* 1 & 2 · the label table */
  const t = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["BEAT_WORD","RIVAL_BEATS","RB_KEYS"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    return { keys:A.RB_KEYS, words:A.BEAT_WORD };
  });
  if(t.why) return { pass:false, why:t.why, lines };

  const unnamed = t.keys.filter(k=>!t.words[k]);
  const extra = Object.keys(t.words).filter(k=>!t.keys.includes(k));
  lines.push(`${t.keys.length} beats in \`RIVAL_BEATS\`, ${Object.keys(t.words).length} named`);
  if(unnamed.length)
    bad.push(`${unnamed.join(", ")} ${unnamed.length===1?"has":"have"} no entry in \`BEAT_WORD\` — the panel `
      + `filters the seen list against that table, so a beat that genuinely happened is dropped and reads `
      + `exactly like a rivalry that never had it`);
  if(extra.length)
    bad.push(`\`BEAT_WORD\` names ${extra.join(", ")}, which \`RIVAL_BEATS\` no longer has — a label for a `
      + `beat that cannot fire is a sentence nobody will ever see, and it hides the one that can`);
  /* 2 — the eight do not share a subject, so a past participle cannot be right for all of them */
  const VERBY = /^(drunk|come|carried|warned|made|turned|grown|beaten|given|taken|sent|asked)\b/i;
  for(const k of Object.keys(t.words))
    if(VERBY.test(t.words[k]))
      bad.push(`the label for \`${k}\` is "${t.words[k]}", which reads as something YOU did — the eight beats `
        + `have different subjects (he warns you, he carries you, he asks for your man) and a verb frame `
        + `produced "You have … warned you …". They are things that have passed, and named as such`);

  /* 3 · the rendered sheet */
  await found(p, { seed:"TREAT-1" });
  await clearAll(p, 10);
  await installRope(p);
  const res0 = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const d = A.newGameState("Treat", "clean", "TREATCHK");
    for(let w=0; w<120; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
    /* ---- THE SAVE MUST BE A LIVING HOUSE, AND THAT WAS ASSUMED RATHER THAN ARRANGED ----
       Same silent dependency `faces` carried and for the same reason: this saves the state and
       RELOADS into it, and a dead house loads to the records screen where there is no rival sheet
       to open. Arm 3's subject is what a Treat sheet says about a house you have met twenty-one
       times; whether your own house outlived the meeting is not part of it. Cleared, and the
       ending is reported so the dependency is visible the next time the stream moves. */
    const died = d.over ? d.over.kind : null;
    d.over = null;
    d.gold = Math.max(d.gold, 5000);
    const live = (d.rivals||[]).filter(x=>!x.retired)[0];
    if(!live) return null;
    d.metHouse = d.metHouse || {};
    /* `last` and a grudge worth mentioning, for arm 4 — #246 phase 5's hold is invisible without a
       line, and a line nobody checks is the same as no line */
    d.metHouse[live.name] = { met:21, beaten:0, lost:0, seen:["drink","respect","warning","old"], last:d.week - 3 };
    live.grudge = 55;
    d.book = d.book || {}; d.book.house = d.book.house || {};
    d.book.house[live.name] = { n:21, w:12, d:0 };
    const keys = Object.keys(localStorage).filter(q=>/ludus-slot-\d/.test(q));
    const b = JSON.stringify(d); for(const k of keys) localStorage.setItem(k, b);
    const st = window.storage; if(st && !st.__treatShut){ const real = st.set.bind(st);
      st.set = (k,v)=>/ludus-slot-\d/.test(k)?Promise.resolve({key:k,value:v}):real(k,v); st.__treatShut = true; }
    return { name:live.name, died };
  });
  if(!res0) return { pass:false, why:"the played house has no live rival to treat with", lines };
  const want = res0.name;
  if(res0.died) lines.push(`the fixture: the played house ended in ${res0.died} inside its 120 weeks `
    + `and the ending was cleared — a dead save reloads to the records screen, where there is no `
    + `rival sheet to open, and arm 3 is about the sheet rather than about surviving`);

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
  const opened = await p.evaluate((house)=>{
    const btns = [...document.querySelectorAll("button")].filter(x=>/^treat$/i.test((x.innerText||"").trim()));
    const rx = new RegExp(house, "i");
    for(const b of btns){ let e=b;
      /* climb only while the ancestor is still row-sized — any higher and every button matches every name */
      for(let i=0;i<5&&e;i++){ const s=(e.innerText||""); if(s.length>320) break;
        if(rx.test(s)){ b.click(); return true; } e=e.parentElement; } }
    return false; }, want);
  await p.waitForTimeout(900); await settle(p);
  const sheet = await p.evaluate(()=>{ const m=document.querySelector(".modal"); return m ? (m.innerText||"").replace(/\s+/g," ") : null; });

  if(!opened || !sheet) bad.push(`the Treat sheet for House ${want} did not open, so arm 3 measured nothing`);
  else {
    lines.push(`  House ${want}'s sheet: ${sheet.slice(0, 150)}…`);
    if(!/21 cards against him/.test(sheet))
      bad.push(`the Treat sheet does not carry the record — it should read "21 cards against him" from the `
        + `record book, and reads: ${sheet.slice(0,110)}`);
    if(!/you 12–9/.test(sheet))
      bad.push(`the Treat sheet does not carry the win-loss ("you 12–9") — that and the card count both come `
        + `from \`book.house\`, one source, and if either is missing the panel is back to showing a grudge word`);
    if(!/Between you:/.test(sheet))
      bad.push(`the Treat sheet says nothing about the four beats planted on this rivalry — \`metHouse.seen\` `
        + `is the one thing on this panel no other screen carries, and without it the sheet is what it was`);
    for(const k of ["drink","respect","warning","old"])
      if(t.words[k] && !sheet.includes(t.words[k]))
        bad.push(`the beat \`${k}\` was planted on this rivalry and its name ("${t.words[k]}") is not on the sheet`);
    /* 4 · the freshness line, planted three weeks back with a grudge of 55 */
    const fresh = await p.evaluate(()=>{ const el = document.querySelector("[data-fresh]");
      return el ? { house:el.getAttribute("data-fresh"), text:(el.textContent||"").replace(/\s+/g," ").trim() } : null; });
    if(!fresh)
      bad.push(`House ${want} was fought three weeks ago with a grudge of 55 and the sheet says nothing about it — `
        + `#246 phase 5 holds back 65% of this house's weekly forgetting and a rule the player cannot see is half a rule`);
    else {
      lines.push(`  the hold is said: "${fresh.text}"`);
      if(fresh.house !== want) bad.push(`the freshness line is drawn for ${fresh.house} on ${want}'s sheet`);
      if(!/3 weeks ago/.test(fresh.text))
        bad.push(`the freshness line reads "${fresh.text}" and \`metHouse.last\` was stamped three weeks back — `
          + `the sentence and the number behind it have to be the same call (#150)`);
    }
  }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the record, the men watched, and everything that has passed between you`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
