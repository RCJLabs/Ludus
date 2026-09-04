/* A YARD IN CAPUA REMEMBERS WHOSE IT WAS

   Phase queue item #240, "A Rival House Is a Family, Not a Slot". It asked for five phases and the
   verify-first it demanded refused four of them. What ships is the fifth, and it is the one the
   item's own opening sentence is actually about.

   THE DEFECT IS REAL AND IT IS ONE WORD LONG. A rival house leaves play through exactly two doors —
   `RIVAL_BEATS.end`, where he sells up fond of you and goes to a farm near Nola, and
   `settleNemHouse`'s decisive win, where you finish him — and both wrote `h.retired = true` and
   nothing else. `bayRefill` then sold the empty yard to a stranger who opened at `grudge: ri(0,12)`
   with no warmth and no reference to the identity it replaced. Eighteen weeks of a declared feud, a
   decade of drinking at the same table, and `weddingEndsFeud`'s `h.kin` — the flag that says a
   marriage folded this feud up for good — were all discarded the moment the man holding them walked.

   WHAT THE MEASUREMENT SAID (`probes/dynasty.mjs`, four cells over two seeds, 64 campaigns and
   12,551 played weeks), and it refuses the item's engine:

     A HOUSE LEAVES PLAY 0.58 TIMES PER MULTI-DECADE CAMPAIGN. 37 retirements in 64 campaigns —
     one every ~425 weeks — of which 32 came through the broken door and **5 through the fond one**.
     The item's own falsifier says an event that fires "only in single digits across an entire
     multi-decade campaign" does not earn the two engine phases. Behind the item's own guardrail
     roll ("a fraction of retirements, not a coin flip") a son would be met by about **one player in
     five, once**. The falsifier fires.

     AND PHASE 2 IS DEARER THAN THE ITEM PRICES IT. `lanistaOf(key)` is a bare-string lookup into a
     module constant, at **80 call sites**, with no `d` in scope at any of them. An `h.heir` override
     it could read means threading `d` through all eighty, or module-level mutable state — and the
     save is `JSON.stringify(d)`, so state parked in `LANISTAE` would vanish on reload and leak into
     the next game started in the same tab. The falsifier names that layer specifically.

     BUT THE HANDOVER ITSELF IS NOT WASTED, which the item does not ask and this decides. After a
     retirement the campaign runs a median **90 more weeks**, and the stranger who takes the yard is
     actually fought in **10 of 16** cases. The moment has an audience. It is only the dynasty that
     does not pay.

   SO THE SUCCESSION SHIPS AND THE DYNASTY DOES NOT. `closeHouse` stamps both doors with how the
   house ended and what the relationship was worth at the moment it shut; `bayRefill` reads it. The
   new lanista is still his own `LANISTAE` record — no heir, no override layer, no generated name —
   and what he inherits is a POSITION: he bought the yard of a man you broke and has heard the
   story, or he bought it from a friend of yours who put in a word. `kin` carries across.

   AND PHASE 5'S MIGRATION IS NOT NEEDED. A house retired before this release has no `lineage`, and
   the absence is the correct answer — arm 6 drives that case and requires a plain stranger.

   NINE ARMS. */
import { found, clearAll, installRope, forge, tab, settle } from "../harness.mjs";

export const name = "dynasty";
export const describe = "a house that folds leaves a record, and the yard it leaves is not sold to a stranger who never heard of you";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"DYN-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    let tick = 0;

    /* a bay with a real relationship in it, about to lose a house */
    const seat = (how, opts) => {
      opts = opts || {};
      const d = A.newGameState("Bay", "capua", `DY-${tick++}`);
      d.week = 60; d.gold = 5000;
      const h = d.rivals[0];
      d.metHouse = { [h.name]: { met:31, beaten:4, lost:3, seen:[] } };
      h.warm = opts.warm == null ? 60 : opts.warm;
      h.grudge = opts.grudge == null ? 40 : opts.grudge;
      if(opts.kin) h.kin = true;
      return { d, h };
    };
    /* the refill waits a season on purpose; wind the clock until the yard changes hands */
    const refill = d => {
      const before = new Set(d.rivals.map(x=>x.name));
      for(let i=0; i<60; i++){ d.week++; A.bayRefill(d);
        const got = d.rivals.find(x=>!before.has(x.name));
        if(got) return { got, waited:i+1 }; }
      return { got:null, waited:60 };
    };
    const said = (d, rx) => (d.log||[]).slice(0, 8).some(L=>rx.test(L.text||""));

    /* ---- 1: both doors write a record, and closeHouse does not fire twice ---- */
    { for(const how of ["broken","fond"]){
        const { d, h } = seat(how);
        const rec = A.closeHouse(d, h, how);
        if(!rec) { bad.push(`closing a house the ${how} way wrote no record at all`); continue; }
        if(!h.retired) bad.push(`the ${how} door did not retire the house — the two callers depend on this`);
        if(h.endedAs !== how) bad.push(`the ${how} door stamped endedAs "${h.endedAs}"`);
        if(h.retiredAt !== d.week) bad.push(`the ${how} door did not stamp the week`);
        /* IDEMPOTENT ON PURPOSE: `settleNemHouse` can be reached with a house already folded, and a
           second stamp would overwrite the relationship with a colder one */
        const again = A.closeHouse(d, h, "fond");
        if(again) bad.push(`closing an already-folded house wrote a SECOND record — the first one's history is overwritten`);
        if(h.endedAs !== how) bad.push(`a second close changed how the house ended, from ${how} to ${h.endedAs}`);
      }
      lines.push(`both doors stamp, and neither stamps twice`);
    }

    /* ---- 1b: AND THE DOORS THEMSELVES, DRIVEN ----
       CAUGHT BY A SABOTAGE. The arm above calls `closeHouse` by hand, so cutting `RIVAL_BEATS.end`
       and `settleNemHouse` back to a bare `h.retired = true` — the exact pre-#240 shape, and the
       most likely way this regresses — passed it without a word. The record is worth nothing if the
       two places that end a house do not write it, so both are opened here for real. */
    { const { d, h } = seat("fond");
      try { A.RIVAL_BEATS.end.hit(d, h.name); } catch(e){ bad.push(`RIVAL_BEATS.end threw: ${String(e&&e.message||e).slice(0,90)}`); }
      if(!h.retired) bad.push(`RIVAL_BEATS.end no longer retires the house`);
      else if(!h.lineage) bad.push(`the FOND door retired the house and left no record — bayRefill will sell the yard to a stranger who never heard of him, which is this item's whole defect`);
      else if(h.lineage.endedAs !== "fond") bad.push(`the fond door stamped "${h.lineage.endedAs}"`);

      const { d:d2, h:h2 } = seat("broken");
      d2.nemHouse = { house:h2.name, stage:3, heat:60, hits:0, answered:2, since:d2.week-20 };
      if(!(A.nemEdge(d2) >= 1)) bad.push(`the feud fixture does not hold the upper hand (edge ${A.nemEdge(d2)}) — the decisive branch will not be reached`);
      try { A.settleNemHouse(d2, true); } catch(e){ bad.push(`settleNemHouse threw: ${String(e&&e.message||e).slice(0,90)}`); }
      if(!h2.retired) bad.push(`winning the feud outright no longer finishes the house`);
      else if(!h2.lineage) bad.push(`the BROKEN door retired the house and left no record — eighteen weeks of a declared feud are discarded again`);
      else if(h2.lineage.endedAs !== "broken") bad.push(`the broken door stamped "${h2.lineage.endedAs}"`);
      lines.push(`driven for real: RIVAL_BEATS.end → ${h.lineage ? h.lineage.endedAs : "(nothing)"} · settleNemHouse → ${h2.lineage ? h2.lineage.endedAs : "(nothing)"}`);
    }

    /* ---- 2: the record carries the relationship as it stood ---- */
    { const { d, h } = seat("broken", { kin:true });
      const rec = A.closeHouse(d, h, "broken");
      if(!rec){ bad.push("no record to read"); }
      else {
        if(rec.met !== 31) bad.push(`the record says ${rec.met} cards where the book says 31 — the history is not being read`);
        if(!(rec.warm >= 55 && rec.warm <= 65)) bad.push(`the record's warmth is ${rec.warm}, not the 60 it stood at`);
        if(rec.grudge !== 40) bad.push(`the record's grudge is ${rec.grudge}, not 40`);
        if(!rec.kin) bad.push(`the record dropped h.kin — a marriage that folded the feud is the one thing that most needs to survive the handover`);
        if(!rec.name || !/[A-Z]/.test(rec.name)) bad.push(`the record names nobody: "${rec.name}"`);
        lines.push(`the record: ${rec.name}, ${rec.met} cards, warm ${rec.warm}, grudge ${rec.grudge}`);
      } }

    /* ---- 3: lastDark finds the newest unsold yard, and forgets a sold one ---- */
    { const { d } = seat("broken");
      const [a, b] = [d.rivals[0], d.rivals[1]];
      A.closeHouse(d, a, "broken");
      d.week += 10;
      A.closeHouse(d, b, "fond");
      const first = A.lastDark(d);
      if(!first || first.name !== b.name) bad.push(`lastDark returned ${first && first.name} — it must be the most recent, which is ${b.name}`);
      b.lineage.sold = d.week;
      const second = A.lastDark(d);
      if(!second || second.name !== a.name) bad.push(`a yard already sold on is still being offered as the empty one`);
      a.lineage.sold = d.week;
      if(A.lastDark(d)) bad.push(`every yard is sold and lastDark still names one — the next refill would claim a history twice`);
      lines.push(`lastDark: newest first, and a sold yard is forgotten`);
    }

    /* ---- 4 + 5: the refill reads it, opens from it, and carries kin ---- */
    { const rows = [];
      for(const how of ["broken","fond"]){
        const { d, h } = seat(how, { kin:true });
        A.closeHouse(d, h, how);
        const { got, waited } = refill(d);
        if(!got){ bad.push(`no stranger ever took the yard after a ${how} ending — the bay is stuck`); continue; }
        if(!got.after) bad.push(`the house that bought a ${how}-ended yard knows nothing about it — h.after is unset, which is the whole defect again`);
        else if(got.after.endedAs !== how) bad.push(`the new house thinks the yard ended "${got.after.endedAs}", not "${how}"`);
        if(!h.lineage.sold) bad.push(`the yard was taken and never marked sold — the next refill would claim the same history`);
        if(!got.kin) bad.push(`h.kin did not survive the handover — a wedding that folded a feud reopens it the moment the yard changes hands`);
        if(!said(d, /yard he has bought/)) bad.push(`nothing in the chronicle says whose yard it was (${how})`);
        rows.push({ how, name:got.name, grudge:got.grudge, warm:got.warm||0, waited });
      }
      const B = rows.find(x=>x.how==="broken"), F = rows.find(x=>x.how==="fond");
      if(B && F){
        if(!(B.grudge > F.grudge)) bad.push(`a man who bought the yard of somebody you BROKE opens at grudge ${B.grudge} and one who bought it from a friend at ${F.grudge} — how the last man went makes no difference`);
        if(!(F.warm > B.warm)) bad.push(`the fond handover opens at warm ${F.warm} against the broken one's ${B.warm} — the letter from Nola buys nothing`);
        lines.push(`the handover: broken → grudge ${B.grudge}/warm ${B.warm} · fond → grudge ${F.grudge}/warm ${F.warm}`);
      } }

    /* ---- 6: AN OLD SAVE NEEDS NO MIGRATION ----
       #240's phase 5 wanted a `migrate()` step initialising the new fields on every house. It is
       not needed and this proves it: a house retired the way every build before this one retired
       them — a bare `h.retired = true`, no lineage — must produce a plain stranger, exactly as it
       always did, rather than a crash or a claimed inheritance. */
    { const d = A.newGameState("Old", "capua", `DY-old-${tick++}`);
      d.week = 60;
      d.rivals[0].retired = true;                 /* the pre-#240 shape, verbatim */
      let threw = null, got = null;
      try { got = refill(d).got; } catch(e){ threw = String(e && e.message || e).slice(0,120); }
      if(threw) bad.push(`an old save's folded house crashes the refill: ${threw}`);
      else if(!got) bad.push(`an old save's empty yard is never refilled at all`);
      else if(got.after) bad.push(`a house folded before this release handed down a history it never had`);
      else lines.push(`an old save: the yard is sold to a plain stranger, no migration needed`);
    }

    /* ---- 7: the bay still refills to its floor, and never twice to the same name ---- */
    { const { d, h } = seat("broken");
      A.closeHouse(d, h, "broken");
      const { got } = refill(d);
      if(A.liveRivals(d).length < A.BAY_FLOOR)
        bad.push(`the bay is at ${A.liveRivals(d).length} live houses against a floor of ${A.BAY_FLOOR}`);
      const names = d.rivals.map(x=>x.name);
      if(new Set(names).size !== names.length) bad.push(`the bay holds the same house name twice: ${names.join(", ")}`);
      if(got && !A.NEW_HOUSES.some(x=>x.key === got.name))
        bad.push(`the yard was sold to "${got.name}", who is not in NEW_HOUSES`);
      if(got && !A.LANISTAE[got.name])
        bad.push(`"${got.name}" has no entry in LANISTAE, so the panel would call him a fallback string`);
      lines.push(`the bay refills to ${A.liveRivals(d).length} (floor ${A.BAY_FLOOR}), pool of ${A.NEW_HOUSES.length}`);
    }

    /* ---- 8: and it survives a save ---- */
    { const { d, h } = seat("fond", { kin:true });
      A.closeHouse(d, h, "fond");
      const { got } = refill(d);
      const back = A.clone(d);
      const g2 = got && back.rivals.find(x=>x.name === got.name);
      if(got && (!g2 || !g2.after || g2.after.endedAs !== "fond"))
        bad.push(`the yard's history does not survive a save — a reload sells it to a stranger all over again`);
      const h2 = back.rivals.find(x=>x.name === h.name);
      if(!h2 || !h2.lineage || h2.lineage.endedAs !== "fond")
        bad.push(`the folded house's own record does not survive a save`);
    }

    return { bad, lines };
  });

  bad.push(...r.bad);
  lines.push(...r.lines);

  /* ---- 9: AND THE PANEL SAYS SO ----
     A record nothing renders is the same dead-state fault one layer up, and this project has
     shipped a button that was never wired and walked eight headless arms straight past it. */
  await forge(p, (A) => {
    const d = A.newGameState("Verres", "capua", "DYN-UI", null);
    d.week = 60; d.gold = 5000;
    const h = d.rivals[0];
    d.metHouse = { [h.name]: { met:31, beaten:4, lost:3, seen:[] } };
    h.warm = 60; h.grudge = 40;
    A.closeHouse(d, h, "broken");
    const before = new Set(d.rivals.map(x=>x.name));
    for(let i=0;i<60;i++){ d.week++; A.bayRefill(d);
      if(d.rivals.some(x=>!before.has(x.name))) break; }
    return { plant:d };
  });
  /* the bay table lives behind "The Houses" in the villa, not on a tab of its own — the first
     draft asked for tab("bay"), landed on the ludus, and reported the panel as missing */
  await tab(p, "villa");
  await settle(p);
  await p.evaluate(()=>{ const b = [...document.querySelectorAll("button")]
    .find(x=>/^The Houses/.test(x.textContent||"")); if(b) b.click(); });
  await settle(p);
  const ui = await p.evaluate(()=>{
    const t = document.body.innerText || "";
    return { yard: /yard — the one you emptied/i.test(t),
      folded: /Folded/.test(t), how: /you finished him/i.test(t),
      table: /THE LEAGUE OF CAPUA/i.test(t),
      place: (document.querySelector("[data-place]")||{}).getAttribute
        ? document.querySelector("[data-place]").getAttribute("data-place") : null };
  });
  lines.push(`through the screen (${ui.place}, table open ${ui.table}): the new house's row names the yard (${ui.yard}) · the folded line says how it went (${ui.how})`);
  if(!ui.table) bad.push("could not open the league table at all — the DOM arm cannot answer its own question");
  if(!ui.yard) bad.push("the bay panel does not say whose yard the new house holds — the record is written and never read, which is the defect this item was raised for");
  if(!ui.how) bad.push("the folded line does not say how the house went out");

  return { pass: bad.length === 0, why: bad.join(" · "), lines };
}
