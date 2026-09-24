/* THE FINE, COUNTED AGAINST THE BOX — #312

   `probes/under.mjs` lined up every house that died of debt on the week it went under. Of the 56
   houses that never left Capua and died that way, 50 had paid an inspector's fine that very week
   (median 3,077 denarii), and every one of those weeks would have closed above the creditors' line
   without it. The card is the first thing a player sees in the week, and the week is long enough to
   sell or borrow in, so the card now says what paying leaves, against the line, before the answer.

   THE PROPERTY: the card's count is the game's own arithmetic. It reads `weeklyBill` and
   `creditLine`, which are what the week's end charges and what the debt ending tests, so the
   verdicts are asserted against those functions and then against a played week, not against
   numbers copied into this file.

     1  three verdicts on one house: a fine the box can stand (ok), one that puts it under but inside
        the line (tight), one past it (not ok, naming exactly line - (gold - fine - bill) to raise),
        and the tablet judged by the same rule
     2  it is a READ: the house is identical after it, and it answers the inspector's card and no other
     3  a played week agrees: pay a fine past the line and end the week with nothing raised, and the
        creditors come; pay one well inside it, and they do not (three seeds)
     4  the card on screen: forged at the start of a week, the modal prints the count under its own
        heading and in the danger colour, and the doctore's count keeps its heading */
import { found, clearAll, forge, settle } from "../harness.mjs";

export const name = "fine";
export const describe = "the inspector's card says what paying the fine leaves against the creditors' line";

export async function run({ p, errors }){
  const fails = [], lines = [];

  const maths = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["fineRead","weeklyBill","creditLine","newGameState","EVENTS","endWeek"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const mk = seed => { const d = A.newGameState("Fn","clean",seed,null); d.week = 40; d.gold = 5000; return d; };
    const card = fine => ({ id:"inspector", title:"He Did Not Send Word", text:"t", data:{ fine, breach:[] },
      choices:[`Pay the fine · ${fine}d`, `Buy the tablet · ${Math.round(fine*0.55)}d`, "Let him write it down"] });
    const d = mk("FINE-1"), bill = A.weeklyBill(d), line = A.creditLine(d), G = d.gold;
    const at = pay => G - bill - pay;                /* the fine that leaves `pay` once the bill is met */
    const read = f => A.fineRead(d, card(f));
    const r = {
      bill, line, gold:G,
      stand: read(Math.round(at(3 * bill))),
      under: read(Math.round(at(Math.round(line / 2)))),
      past:  read(Math.round(at(line - 900))),
      pastF: Math.round(at(line - 900)),
    };
    /* 2 · a read, and only of this card */
    const before = JSON.stringify(d);
    A.fineRead(d, card(4000));
    r.same = JSON.stringify(d) === before;
    r.other = A.fineRead(d, { id:"edict", data:{ fine:4000 } });
    r.bare = A.fineRead(d, { id:"inspector" });
    /* 3 · the week agrees, on three seeds */
    r.weeks = ["FINE-2","FINE-3","FINE-4"].map(seed => {
      const out = {};
      for(const [tag, margin] of [["past", -1500], ["inside", 0.3]]){
        const h = mk(seed), b = A.weeklyBill(h), l = A.creditLine(h);
        const pay = tag === "past" ? l + margin : Math.round(l * margin);
        const fine = Math.round(h.gold - b - pay);
        const ev = card(fine), note = A.fineRead(h, ev);
        A.EVENTS.inspector.run(h, ev, 0);
        try { A.endWeek(h); } catch(e){ out[tag] = { threw:e.message }; continue; }
        out[tag] = { ok:note && note.ok, over:h.over ? String(h.over.kind || h.over) : null, gold:Math.round(h.gold), line:A.creditLine(h) };
      }
      return { seed, ...out };
    });
    return r;
  });
  if(maths.why) return { pass:false, why:maths.why, lines };
  const { bill, line, stand, under, past, pastF } = maths;
  lines.push(`the house: ${maths.gold} in the box, a bill of ${Math.round(bill)}, the creditors' line at ${line}`);
  for(const [tag, n] of [["stand", stand], ["under", under], ["past", past]])
    lines.push(`  ${tag.padEnd(5)} ${n ? `${n.ok ? (n.tight ? "tight" : "ok") : "PAST THE LINE"} · "${n.word.slice(0, 150)}"` : "NO NOTE"}`);
  if(!stand || !stand.ok || stand.tight) fails.push("a fine the box can stand is not read as one");
  if(!under || !under.ok || !under.tight) fails.push("a fine that puts the box under but inside the line is not read as tight");
  if(!past || past.ok) fails.push("a fine past the creditors' line is not read as one");
  else {
    const need = line - Math.round(maths.gold - pastF - bill);
    if(!new RegExp(`Raise ${need}\\b`).test(past.word)) fails.push(`the fine past the line does not name the ${need} to raise: "${past.word.slice(0,120)}"`);
    if(!/creditors come/.test(past.word)) fails.push("the fine past the line does not say what happens if nothing is raised");
    if(!/tablet/.test(past.word)) fails.push("the fine past the line says nothing of the tablet");
  }
  if(!maths.same) fails.push("reading the fine changed the house");
  if(maths.other) fails.push("the count answers a card that is not the inspector's");
  if(maths.bare) fails.push("the count answers an inspector's card with no fine on it");
  for(const w of maths.weeks){
    lines.push(`  a played week, ${w.seed}: past -> ${JSON.stringify(w.past)} · inside -> ${JSON.stringify(w.inside)}`);
    if(w.past.threw || w.inside.threw) { fails.push(`the week threw on ${w.seed}`); continue; }
    if(w.past.ok !== false || w.past.over !== "debt") fails.push(`${w.seed}: a fine read as past the line did not bring the creditors (${w.past.over || "the house stood"})`);
    if(w.inside.ok !== true || w.inside.over) fails.push(`${w.seed}: a fine read as inside the line ended the house (${w.inside.over})`);
  }

  /* ---- 4 · ON SCREEN ---- */
  const shown = {};
  for(const [tag, build] of [
    ["past", (A) => { const d = A.newGameState("Fn","clean","FINE-UI",null); d.week = 40; d.gold = 1200;
        const fine = Math.round(d.gold - A.weeklyBill(d) - A.creditLine(d) + 900);
        d.pendingEvent = { id:"inspector", title:"He Did Not Send Word", text:"A man from the aedile's office is standing in your yard.",
          choices:[`Pay the fine · ${fine}d`, `Buy the tablet · ${Math.round(fine*0.55)}d`, "Let him write it down"], data:{ fine, breach:[] } };
        return { plant:d }; }],
    ["doctore", (A) => { const d = A.newGameState("Fn","clean","FINE-UI",null); d.week = 40;
        d.pendingEvent = { id:"edict", title:"An Edict Is Read Out", text:"On the keeping of armed men.", choices:["Comply","Carry on and hope"],
          data:{ k:"numbers" }, note:{ ok:true, tight:false, word:"A count planted by the check." } };
        return { plant:d }; }],
    ["edict", (A) => { const d = A.newGameState("Fn","clean","FINE-UI",null); d.week = 40;
        d.pendingEvent = { id:"edict", title:"An Edict Is Read Out", text:"On the keeping of armed men.", choices:["Comply","Carry on and hope"], data:{ k:"numbers" } };
        return { plant:d }; }],
  ]){
    await found(p, { seed:"FINE-UI" });
    await clearAll(p, 6);
    await forge(p, build);
    await settle(p);
    shown[tag] = await p.evaluate(()=>{
      const t = (document.body.innerText || "");
      const up = t.toUpperCase();
      const box = up.indexOf("WHAT THE BOX CAN BEAR"), doc = up.indexOf("THE DOCTORE COUNTS IT OUT");
      const word = [...document.querySelectorAll(".modal div")].find(x=>/creditors' line/.test(x.innerText||"") && !x.children.length);
      return { card: /HE DID NOT SEND WORD|AN EDICT IS READ OUT/.test(up), box: box >= 0, doc: doc >= 0,
        text: box >= 0 ? t.slice(box, box + 260).replace(/\n+/g, " · ") : null,
        blood: word ? /var\(--blood\)/.test(word.getAttribute("style") || "") : null };
    });
  }
  lines.push(`on screen, a fine past the line: ${shown.past.text || "NO COUNT"}`);
  if(!shown.past.card) fails.push("the forged inspector's card did not come up");
  else {
    if(!shown.past.box) fails.push("the inspector's card on screen carries no count of the fine");
    if(shown.past.blood !== true) fails.push("the count of a fine past the line is not in the danger colour");
    if(shown.past.doc) fails.push("the fine's count is headed as the doctore's");
  }
  if(!shown.doctore.card || !shown.doctore.doc) fails.push("a card with its own count lost the doctore's heading");
  if(shown.doctore.box) fails.push("a card with its own count was headed as the fine's");
  if(shown.edict.box) fails.push("an edict's card carries the fine's count");

  if(errors && errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
