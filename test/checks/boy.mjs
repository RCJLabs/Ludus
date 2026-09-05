/* THE WILL YOU COULD NOT REWRITE

   `d.heir` has three write sites in the whole file — `nameHeir`, `succeed` (clearing it at a
   generation), and `resolveToga` — and `nameHeir` was reachable from exactly one place: two buttons
   on the lanista sheet, rendered inside `S.heir ? <the named panel> : <the buttons>`. So the card
   SHUT the moment anybody was named, and the card's own italic line pushes you to name somebody at
   once: "Name nobody and this house is sold off in pieces the morning after you die." Before there
   is a wife in the house — median week 31 — the only thing on offer is a nephew.

   MEASURED, `probes/boy.mjs`, 16 houses x 520 weeks: sixteen of sixteen named a nephew in WEEK TWO
   and fifteen of sixteen died with him standing. Their own sons were eligible at a median of week
   235 — `SON_AGE` 9 x `YEAR_WEEKS` 18 = 162 weeks past a birth that lands at a median of week 84 —
   by which time the card had been closed for two hundred and thirty weeks. #226 gave "son" a real
   boy behind it and #237 gave `nameHeir` his actual identity, mentor bond and upbringing traits
   carried over; a player who took the sensible early insurance could reach neither of them.

   `heirChoices(d)` is the card as a function of the save: one row per NAMABLE PERSON rather than
   per kind, with whoever already stands filtered out — by `cid` where there is one, so the boy who
   took the toga is not offered back to you as a worse version of himself. The card renders it in
   both branches now, and the panel showing who stands sits above it instead of replacing it.

   SEVEN ARMS:
   1 · THE LIST IS THE SAME PEOPLE `heirEligible` and `eligibleSons` already offer, with a row per
       boy — a house with two sons gets two rows, not one button called "A son".
   2 · THE DOOR REOPENS: a nephew named in week two does not close the son off. `nameHeir` replaces
       him, and the real boy's identity, cid and traits come with him the way #237 wrote them.
   3 · WHOEVER STANDS IS FILTERED OUT — the named nephew is not offered again, and after the toga
       the scion is not offered back as "son", which is the same boy at a worse `fameKeep`.
   4 · TWO SONS: naming one leaves the other on the card and takes the named one off it.
   5 · THE CHRONICLE SAYS A WILL WAS REWRITTEN, not that one was written — a name came off the
       paper and somebody is going to find out he is not the one any more.
   6 · THE VILLA TAB LIGHTS WHEN THE BOY TURNS NINE. `TAB_SIG.villa` reported "heir" forever once
       anybody was named, which was honest while the card shut and is deaf now that it reopens.
   7 · AND THE CARD ACTUALLY RENDERS THEM WITH AN HEIR STANDING. Arms 1-5 would all pass on a build
       where the JSX still reads `S.heir ? <panel> : <buttons>`, because that ternary is the whole
       defect and it is not a function of the save. This one opens the lanista sheet on a forged
       house that has both an heir and an eligible son, and reads the buttons. */
import { found, clearAll, forge, tab } from "../harness.mjs";

export const name = "boy";
export const describe = "a named heir can be replaced, and the son you raised is on the card";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"BOY-CHK" });
  await clearAll(p, 12);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["heirChoices","heirEligible","eligibleSons","nameHeir","domusOf","HEIRS","SON_AGE","YEAR_WEEKS","tabSig"]
      .filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const out = { arms:[], notes:[] };
    const say = (ok, why) => { out.arms.push({ ok, why }); };

    /* a house old enough for the age gate, with a wife in it and a week on the clock */
    const mk = () => { const d = A.newGameState("Boy", "clean", "BOY-CHK");
      d.week = 260; d.lanista.age = 46;
      A.domusOf(d).wife = { name:"Prima Vettia", family:"the Vettii", married:2, age:24, from:"merchant" };
      return d; };
    /* `heirTraitsFromUp` gives "respected" for a rhetor boy and "shrewd" for a box boy, and NOTHING
       for a palus one — the yard's mark is `palusRaised`, which `resolveToga` reads, not a trait.
       The first draft of arm 2 raised its boy at the palus and then asserted a trait, and failed on
       its own fixture. `up` is an argument now so the trait path is exercised deliberately. */
    const addSon = (d, nm, yrs, up) => { const dm = A.domusOf(d);
      const c = { id:dm.nextKin++, name:nm, sex:"m", born: d.week - yrs*A.YEAR_WEEKS,
        up: up || {palus:2,rhetor:0,box:0}, mentorId:null, mentorName:"Drusus the Thracian" };
      dm.children.push(c); return c; };
    const kinds = cs => cs.map(o=>o.cid ? `son:${o.cid}` : o.kind);

    /* ---- 1: the list is the people, one row each ---- */
    { const d = mk(); const a = addSon(d, "Lucius Minor", 11), b = addSon(d, "Gaius Minor", 10);
      const cs = A.heirChoices(d);
      const sons = cs.filter(o=>o.kind==="son");
      const el = A.eligibleSons(d);
      out.notes.push(`no heir: ${kinds(cs).join(", ")} (eligibleSons ${el.length}, heirEligible ${A.heirEligible(d).join("/")})`);
      say(sons.length === 2 && el.length === 2 && cs.some(o=>o.kind==="nephew")
          && sons.some(o=>o.cid===a.id) && sons.some(o=>o.cid===b.id)
          && sons.every(o=>typeof o.age === "number" && o.age >= A.SON_AGE),
        `a childless-of-age house with two eligible sons offers ${sons.length} son row(s) and `
        + `${cs.filter(o=>o.kind==="nephew").length} nephew; eligibleSons says ${el.length}`); }

    /* ---- 2: the door reopens, and the real boy comes through it ---- */
    { const d = mk(); const boy = addSon(d, "Lucius Minor", 11, {palus:0,rhetor:2,box:0});
      A.nameHeir(d, "nephew");
      const first = d.heir && d.heir.kind;
      const cs = A.heirChoices(d);
      const row = cs.find(o=>o.cid === boy.id);
      const ok1 = first === "nephew" && !!row;
      const done = row ? A.nameHeir(d, row.kind, row.cid) : false;
      const h = d.heir || {};
      out.notes.push(`named ${first} then ${h.kind} — ${h.name} (cid ${h.cid}, traits `
        + `${(h.traits||[]).join("+")||"none"}, mentor ${h.mentorName||"none"})`);
      say(ok1 && done && h.kind === "son" && h.cid === boy.id && h.name === boy.name
          && (h.traits||[]).join() === "respected" && h.mentorName === "Drusus the Thracian",
        `nephew first (${first}), the boy ${row ? "is" : "is NOT"} on the card after, and replacing gives `
        + `kind ${h.kind} / cid ${h.cid} / name ${h.name} / traits ${(h.traits||[]).join("+")||"none"} / `
        + `mentor ${h.mentorName||"none"}`); }

    /* ---- 3: whoever stands is filtered out, as son and as scion ---- */
    { const d = mk(); const boy = addSon(d, "Lucius Minor", 17);
      A.nameHeir(d, "nephew");
      const noNephew = !A.heirChoices(d).some(o=>o.kind === "nephew");
      A.nameHeir(d, "son", boy.id);
      const afterSon = A.heirChoices(d);
      const sonGone = !afterSon.some(o=>o.cid === boy.id), nephewBack = afterSon.some(o=>o.kind==="nephew");
      /* the toga writes a scion by cid; the same boy must not come back as the weaker kind */
      d.heir = { kind:"scion", name:boy.name, named:d.week, raised:true, cid:boy.id, traits:[] };
      const afterToga = A.heirChoices(d);
      const scionGone = !afterToga.some(o=>o.cid === boy.id);
      out.notes.push(`filtered: nephew-out ${noNephew}, son-out ${sonGone}, nephew-back ${nephewBack}, scion-out ${scionGone}`);
      say(noNephew && sonGone && nephewBack && scionGone,
        `standing nephew off the card ${noNephew}; standing son off it ${sonGone}; nephew back on ${nephewBack}; `
        + `the boy who took the toga offered back as "son" ${!scionGone}`); }

    /* ---- 4: two sons, one named ---- */
    { const d = mk(); const a = addSon(d, "Lucius Minor", 12), b = addSon(d, "Gaius Minor", 10);
      A.nameHeir(d, "son", b.id);
      const cs = A.heirChoices(d);
      const hasA = cs.some(o=>o.cid===a.id), hasB = cs.some(o=>o.cid===b.id);
      out.notes.push(`two sons, named ${d.heir.name}: card now ${kinds(cs).join(", ")}`);
      say(d.heir.cid === b.id && hasA && !hasB,
        `named the younger (cid ${d.heir.cid}); elder still on the card ${hasA}, named one still on it ${hasB}`); }

    /* ---- 5: the chronicle says a will was rewritten ---- */
    { const d = mk(); const boy = addSon(d, "Lucius Minor", 11);
      A.nameHeir(d, "nephew");
      const firstLine = (d.log[0] || {}).text || "";
      const nephewName = d.heir.name;
      A.nameHeir(d, "son", boy.id);
      const second = (d.log[0] || {}).text || "";
      out.notes.push(`replacement line: ${second.slice(0, 96)}`);
      say(second !== firstLine && second.includes(nephewName) && second.includes(boy.name)
          && !second.includes("It is a small piece of paper"),
        `the second naming ${second === firstLine ? "reuses the first line" : "is its own line"}; `
        + `names the man replaced ${second.includes(nephewName)}, names the new one ${second.includes(boy.name)}`); }

    /* ---- 6a: and the villa tab has to LIGHT for him ----
       `TAB_SIG.villa` read `d.heir ? "heir" : heirEligible(d).join("")`, which was honest while the
       card shut behind the first naming — once somebody stood there nothing could change again. With
       the card reopened, the boy turning nine is news the tab never reported. */
    { const d = mk(); const boy = addSon(d, "Lucius Minor", 8);   /* a year short of SON_AGE */
      A.nameHeir(d, "nephew");
      const before = A.tabSig(d, "villa");
      const quiet = A.tabSig(d, "villa") === before;
      boy.born -= A.YEAR_WEEKS;                                    /* he turns nine */
      const after = A.tabSig(d, "villa");
      out.notes.push(`villa sig with an heir standing: ${before.slice(0,58)} -> ${after.slice(0,58)}`);
      say(quiet && before !== after && A.eligibleSons(d).length === 1,
        `a standing heir and the boy turning nine: the signature ${before === after ? "does NOT move" : "moves"}, `
        + `and it is steady while nothing changes (${quiet})`); }

    return out;
  });

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  for(const n of r.notes) lines.push(n);
  r.arms.forEach((a, i)=>{ lines.push(`${i+1}. ${a.ok ? "held" : "FAILED"} — ${a.why}`);
    if(!a.ok) bad.push(`arm ${i+1}: ${a.why}`); });

  /* ---- 7: the card itself, with an heir standing ---- */
  const planted = await forge(p, (A)=>{
    const d = A.newGameState("Boy", "clean", "BOY-CARD");
    d.week = 260; d.lanista.age = 46;
    const dm = A.domusOf(d);
    dm.wife = { name:"Prima Vettia", family:"the Vettii", married:2, age:24, from:"merchant" };
    dm.children.push({ id:dm.nextKin++, name:"Lucius Minor", sex:"m", born: d.week - 11*A.YEAR_WEEKS,
      up:{palus:2,rhetor:0,box:0} });
    A.nameHeir(d, "nephew");
    return { plant:d, heir:d.heir.name, boy:"Lucius Minor" };
  });
  if(planted && planted.__forge) bad.push(`arm 7 could not be set up: ${planted.__forge}`);
  else {
    /* the records shelf sits at the FOOT of the villa's House face, not on the ludus tab — see the
       note above `SECT.annals`. Go there first, or the row is not on the page to click. */
    await tab(p, "villa");
    await p.waitForTimeout(260);
    const card = await p.evaluate(()=>{
      /* every drawer open, then the sheet, then read what it offers */
      document.querySelectorAll("details").forEach(x=>{ x.open = true; });
      const row = [...document.querySelectorAll("button.optrow")]
        .find(x=>/^\s*The Lanista/i.test((x.innerText||"").replace(/\n/g," ")));
      if(!row) return { why:"the records section had no Lanista row to open" };
      row.click();
      return { why:null };
    });
    if(card.why) bad.push(`arm 7: ${card.why}`);
    else {
      await p.waitForTimeout(320);
      const seen = await p.evaluate(()=>{
        /* innerText applies text-transform, and `.tag` uppercases — the first draft looked for
           "After you" and read "AFTER YOU", so it reported a sheet that had plainly opened as shut */
        const txt = (document.body.innerText || "").replace(/\n/g, " ");
        const after = /after you/i.test(txt) ? 1 : -1;
        const rows = [...document.querySelectorAll("button.optrow")]
          .map(x=>(x.innerText||"").replace(/\n/g," ").trim()).filter(Boolean);
        return { after: after >= 0, rows: rows.filter(t=>/keeps \d+% fame/.test(t)) };
      });
      const boyRow = seen.rows.find(t=>/Lucius Minor/.test(t));
      const nephewRow = seen.rows.find(t=>/^A nephew/.test(t));
      lines.push(`7. the sheet offers ${seen.rows.length} heir row(s) with an heir standing: `
        + seen.rows.map(t=>t.slice(0,44)).join(" | "));
      if(!seen.after) bad.push(`arm 7: the lanista sheet did not open — no "After you" on the page`);
      else if(!boyRow) bad.push(`arm 7: an heir stands and the son the house raised is NOT on the card — `
        + `this is the ternary the whole item is about, back again`);
      else if(nephewRow) bad.push(`arm 7: the standing nephew is offered again as an alternative to himself`);
      else lines.push(`7. held — the boy is offered and the standing nephew is not`);
    }
  }

  return { pass: bad.length === 0 && !errors.length, why: bad[0] || null, lines };
}
