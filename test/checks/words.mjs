/* WHAT A SCREEN SAYS WHEN A DOOR HAS SHUT, AND WHETHER IT IS TRUE.

   Three lines of copy, all found the same way: by asking what a panel says in the state a player is
   MOST likely to be standing in, rather than the state it was written for.

   1 · THE LETTER FROM ROME warned about two of the three things that are different about the imperial
       sand and not the third. It said half the bouts are sine missione and that your patrons have no
       reach in that city. It did not say that `stopAtCrux: !offer.imperial` makes the imperial card
       the only bout in the game that never stops for an order — 0.0% of imperial bouts reach the
       balance against 33-58% of ordinary ones. The bout's own beats DO say it, two lines in, which is
       after the wagons are loaded and three men are on the road. A warning that arrives once the
       decision is unmakeable is not a warning, so the letter now carries it.

   2 · THE BLOOD OF THE HOUSE told an old lanista to "climb a little higher". `marryReady` is
       `age < 56 && (rung >= 1 || fame >= 60)`, so above 55 no purse and no name will ever open it —
       the branch was advising work that could not possibly pay. The blood is shut at that age; the
       LINE is not, because `heirEligible` always offers a nephew, so that is where the copy points
       now. Under the bar and under 56 the panel names both gates and the figure it wants.

   3 · THE AEDILE is a box whose entire content is one sentence about his stance, and the summary
       line said only how many weeks he has left. It now carries the stance, which is the thing you
       would have opened it for. Its `live` predicate was already right; the note was the problem.

   All three are read off a real save loaded into a real browser, the same way `sweep` reads the vow:
   write the state into the slot, reload, take up the keys, look at the screen. A copy assertion
   written against the source file asserts that a string exists somewhere, which is not the claim. */

import { found, clearAll, tab, click, waitSaved } from "../harness.mjs";

export const name = "words";
export const describe = "the letter warns about all three things, and no shut door says climb";
export const slow = true;   /* real screens, four loads of a doctored save */

/* write into the live slot, then come back in through the front door.
   `keep` skips clearAll, which is not optional housekeeping here: clearAll clicks the LAST live
   button of the topmost overlay, and on the letter from Rome that button is "Capua is enough". The
   first draft of this check declined the invitation and then reported that the letter had never been
   raised — the probe was answering the question it had come to read. */
async function reload(p, mut, arg, keep){
  await p.evaluate(([fn, a])=>{
    for(const k of Object.keys(localStorage)){
      if(!/ludus-slot-\d/.test(k)) continue;
      let s = null;
      try { s = JSON.parse(localStorage.getItem(k)); } catch(e){}
      if(!s || !s.gladiators) continue;
      // eslint-disable-next-line no-new-func
      new Function("s", "a", fn)(s, a);
      localStorage.setItem(k, JSON.stringify(s));
    }
  }, [mut, arg === undefined ? null : arg]);
  await p.reload({ waitUntil:"domcontentloaded" });
  await p.waitForTimeout(1100);
  await click(p, /take up the keys/i);
  await p.waitForTimeout(1100);
  if(!keep) await clearAll(p, 14);
}

const face = (p, label) => p.evaluate(l=>{
  const b = [...document.querySelectorAll('[role=tablist] button[role=tab]')]
    .find(x=>new RegExp(l,"i").test((x.getAttribute("aria-label")||x.innerText||"").trim()));
  if(b){ b.click(); return true; } return false;
}, label);

/* a named section's summary line and its body, opened */
const sect = (p, title) => p.evaluate(t=>{
  const d = [...document.querySelectorAll("details.sect")].find(x=>{
    const s = x.querySelector("summary");
    return s && new RegExp(t,"i").test((s.innerText||"").split("\n")[0]);
  });
  if(!d) return null;
  const sum = d.querySelector("summary");
  const head = (sum.innerText||"").replace(/\s+/g," ").trim();
  d.open = true;
  const body = (d.innerText||"").replace(sum.innerText||"", "").replace(/\s+/g," ").trim();
  return { head, body };
}, title);

export async function run({ p, errors }){
  const lines = [], fails = [];
  await found(p);
  await waitSaved(p);

  /* ---- 1 · THE LETTER ---- */
  await reload(p, `s.fame = Math.max(s.fame, 1200);
    s.romeOffer = { senator:"Quintus Lutatius Catulus", due: s.week + 4, run:1 };`, null, true);
  const letter = await p.evaluate(()=>{
    const w = [...document.querySelectorAll(".modalwrap")]
      .find(x=>/A LETTER FROM ROME/i.test(x.innerText||""));
    return w ? (w.innerText||"").replace(/\s+/g," ").trim() : null;
  });
  if(!letter){
    fails.push("the letter from Rome could not be raised — this check is not measuring anything");
    lines.push("THE LETTER: not raised");
  } else {
    const sine   = /sine missione/i.test(letter);
    const reach  = /no reach|owes you anything/i.test(letter);
    const silent = /order of yours|no word of yours|too big to shout over/i.test(letter);
    lines.push(`THE LETTER says: sine missione ${sine} · patrons have no reach ${reach} · no order reaches the sand ${silent}`);
    if(!sine)  fails.push("the letter no longer says half the imperial bouts are sine missione");
    if(!reach) fails.push("the letter no longer says your patrons have no reach in that city");
    if(!silent) fails.push("the letter does not say that no order of yours reaches the imperial sand — "
      + "stopAtCrux is off for imperial cards, so it is the only bout in the game you cannot coach, and "
      + "the bout's own beats only say so after the wagons are loaded");
  }

  /* ---- 2 · THE BLOOD, IN BOTH OF THE TWO WAYS IT CAN BE SHUT ---- */
  const blood = async (why, mut) => {
    await reload(p, mut);
    await tab(p, "villa");
    await p.waitForTimeout(320);
    await face(p, "The House");
    await p.waitForTimeout(320);
    const s = await sect(p, "the blood of the house");
    lines.push(`THE BLOOD (${why}): summary "${s ? s.head : "NOT ON THE SCREEN"}" / body "${s ? s.body.slice(0,150) : ""}"`);
    return s;
  };

  const old = await blood("a lanista of 60, no wife", `s.domus = { wife:null, children:[], nextKin:1 };
    if(s.lanista) s.lanista.age = 60;
    s.fame = Math.max(s.fame, 400); s.gold = Math.max(s.gold, 9000);`);
  if(!old) fails.push("the blood of the house is not on the villa's House face for a house with no wife");
  else {
    if(/climb/i.test(old.body))
      fails.push(`the blood of the house tells a lanista of 60 to climb: "${old.body.slice(0,110)}". marryReady `
        + `is false above 55 whatever the house is worth, so there is nothing to climb toward`);
    if(!/heir|nephew|outside/i.test(old.body))
      fails.push("a lanista too old to marry is told the blood is shut and not told the line is still open — "
        + "heirEligible always offers a nephew");
    if(!/too late|no match/i.test(old.head))
      fails.push(`the summary line for a shut door reads "${old.head}" — it does not say the door is shut, `
        + `so the box must be opened to learn that opening it was pointless`);
  }

  const young = await blood("a lanista of 40 under the bar", `s.domus = { wife:null, children:[], nextKin:1 };
    if(s.lanista) s.lanista.age = 40;
    s.fame = 12; s.rise = { rank:0, standing:0 };`);
  if(young){
    if(!/60/.test(young.body))
      fails.push(`the blood of the house asks a young lanista to climb and does not say how far: "${young.body.slice(0,110)}"`);
    if(!/\d/.test(young.head))
      fails.push(`the summary line "${young.head}" carries no figure, so the bar is only legible inside the box`);
  }

  /* ---- 3 · THE AEDILE ---- */
  for(const [why, mut, want] of [
    ["a friendly aedile", `s.aedile = { name:"Gaius Rufio", plat:"grain", friendly:true, hostile:false, until: s.week + 30 };
      s.fame = Math.max(s.fame, 400);`, /owes you/i],
    ["an aedile with no view", `s.aedile = { name:"Gaius Rufio", plat:"grain", friendly:false, hostile:false, until: s.week + 30 };
      s.fame = Math.max(s.fame, 400);`, /no view of you/i],
  ]){
    await reload(p, mut);
    await tab(p, "villa");
    await p.waitForTimeout(320);
    await face(p, "Coin");
    await p.waitForTimeout(320);
    const s = await sect(p, "the aedile");
    lines.push(`THE AEDILE (${why}): summary "${s ? s.head : "NOT ON THE SCREEN"}"`);
    if(!s) fails.push(`the aedile is not on the villa's Coin & Council face with ${why}`);
    else if(!want.test(s.head))
      fails.push(`the aedile's summary line reads "${s.head}" and does not carry his stance — the stance is `
        + `the whole of what the section says, so the box is one that must be opened to learn one word`);
  }

  /* ---- 4 · THE LADDER NAMES THE TERM THAT FAILED, AND THE METER SAYS WHICH WAY IT IS GOING ----
     `!need.full` was tested before every substantive gate, and `riseWeek` drains standing in exactly
     the case where fame or favour is short — so the button read "The town is not yet used to you" in
     98.7% of 1,256 measured weeks and in 84.7% of those the thing actually short was fame, favour or
     coin. It named a consequence and never a cause. Each gate is driven here from a state where it
     alone is the one missing, and the favour state must also name the lever, because favour is the
     first failing gate in 60-83% of weeks past year three and the panel never said where it comes
     from. `rise.standing` is set to 40 in all three so the meter is genuinely part-filled: a full
     meter would let the old ordering pass by accident.

     TWO THINGS THE FIRST DRAFT OF THIS GOT WRONG, both of them the probe and not the game:
       · the favour arm sat at rung 0, and rung 1 (Man of Means) wants `favor: 0` — so favour was met
         by definition and the arm was measuring nothing. It has to stand on a rung whose next one
         actually asks for favour, which is rung 1 upward.
       · it asserted the meter reads "cooling" in all three arms. `riseWeek` climbs whenever fame AND
         favour are met and knows nothing about coin, so with coin the only thing short the meter is
         genuinely filling and saying so is correct. `cool` is expected per-arm now. */
  const rungs = [
    ["fame is the one thing short", `s.rise = { rank:0, standing:40 };
      s.fame = 5; s.favor = 99; s.gold = 90000;
      (s.patrons||[]).forEach(x=>{ x.favor = 99; });`, /renown/i, null, true],
    ["favour is the one thing short", `s.rise = { rank:1, standing:40 };
      s.fame = 900; s.favor = 3; s.gold = 90000;
      (s.patrons||[]).forEach(x=>{ x.favor = 3; });`, /patrons hold you/i, /party|table/i, true],
    ["coin is the one thing short", `s.rise = { rank:2, standing:40 };
      s.fame = 4000; s.favor = 99; s.gold = 40;
      (s.patrons||[]).forEach(x=>{ x.favor = 99; });`, /census wants you worth/i, null, false],
  ];
  for(const [why, mut, wantBtn, wantLever, wantCool] of rungs){
    await reload(p, mut);
    await tab(p, "villa");
    await p.waitForTimeout(320);
    await face(p, "Standing");
    await p.waitForTimeout(320);
    const s = await sect(p, "your standing");
    if(!s){ fails.push(`Your Standing is not on the villa's Standing face when ${why}`); continue; }
    const btn = await p.evaluate(()=>{
      const d = [...document.querySelectorAll("details.sect")].find(x=>{
        const q = x.querySelector("summary"); return q && /your standing/i.test((q.innerText||"").split("\n")[0]); });
      if(!d) return null;
      const b = [...d.querySelectorAll("button")].pop();
      return b ? (b.innerText||"").replace(/\s+/g," ").trim() : null;
    });
    const cool = /cooling, not growing/i.test(s.body);
    lines.push(`THE LADDER (${why}): button "${btn}" · meter says ${cool ? "cooling" : "growing"}`);
    if(!btn || !wantBtn.test(btn))
      fails.push(`with ${why}, the ladder's button reads "${btn}" — it does not name the term that failed. `
        + `The old ordering tested !need.full first and blamed the meter in 98.7% of all weeks, 84.7% of `
        + `them wrongly`);
    if(wantCool && !cool)
      fails.push(`with ${why}, the standing meter still says the town is growing used to you — riseWeek `
        + `takes 2 off every week fame or favour is short, so it is draining, and the label read the same `
        + `either way in 77.1% of measured weeks`);
    if(!wantCool && cool)
      fails.push(`with ${why}, the standing meter says the town is cooling — but riseWeek reads only fame `
        + `and favour, both of which are met here, so the meter is filling and the label is now wrong in `
        + `the other direction`);
    if(wantLever && !wantLever.test(s.body))
      fails.push(`favour is what is holding the rung and the panel does not say where favour comes from. `
        + `Paired on the same seeds, a lanista who entertains reaches rung 2.70 against 1.50 and 218 weeks `
        + `at Rome against 31, and nothing in the game points at the lever`);
  }

  /* ---- 5 · AND THE PARTY'S ADVERTISED FIGURE IS THE ONE IT PAYS ----
     `hostParty` added PARTY[kind].favor to d.favor and then overwrote d.favor from the patrons in the
     same call. The table field is gone; `warm` is the per-patron bump, which is what the menu has
     always advertised, and one field rather than the same ladder written out in two places. */
  const party = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Party","clean","WORDS-P",null);
    d.fame = 900; d.gold = 60000;
    for(let w=0; w<40; w++){ d.week++; A.patronWeek(d); }
    const before = A.patronsOf(d).map(x=>x.favor), houseBefore = d.favor;
    A.hostParty(d, "decadent");
    const after = A.patronsOf(d).map(x=>x.favor);
    const gained = before.map((v,i)=>+(after[i]-v).toFixed(1));
    return { warm:A.PARTY.decadent.warm, hasOldField:"favor" in A.PARTY.decadent,
      gained, houseBefore, houseAfter:d.favor,
      mean:+(after.reduce((s,x)=>s+x,0)/Math.max(1,after.length)).toFixed(1) };
  });
  lines.push(`A DECADENT AFFAIR: table says +${party.warm} with every patron, patrons gained `
    + `${party.gained.join(", ")} · the house figure went ${party.houseBefore} -> ${party.houseAfter}, `
    + `which is the patrons' mean ${party.mean}`);
  if(party.hasOldField)
    fails.push("PARTY still carries a `favor` field — it was added to d.favor and overwritten by "
      + "recomputeFavor inside the same call, so it never once survived being read");
  if(!party.gained.every(g=>Math.abs(g - party.warm) < 0.01))
    fails.push(`a decadent affair advertises +${party.warm} with every patron and delivered `
      + `${party.gained.join(", ")} — the menu and hostParty read the same field now, so this can only `
      + `fail if the bump has been rewired`);
  if(Math.abs(party.houseAfter - party.mean) > 1)
    fails.push(`the house's favour figure (${party.houseAfter}) is not the patrons' mean (${party.mean}) `
      + `after a party — something is writing d.favor and surviving recomputeFavor`);

  /* ---- 6 · AND THE SUCCESSION SCREEN DOES NOT TELL A LIVING MAN HE IS DEAD ----
     Retirement raises the same `d.succession` a death does, so the one screen serves both. Before
     v3.8.0 it only ever served a death and opened "THE HOUSE GOES ON — X is dead at 66", which would
     have been said over a man who had just walked down to the square. It also has to offer the second
     door, because declining is the only route left to the `oldAge` ending. */
  for(const [why, mut, wantHead, wantWords, doors] of [
    ["he retired", `s.succession = { lan:"Aulus Vettius", age:66, heir:"Marcus Vettius",
      kind:"nephew", retire:true, years:9 };`, /THE LONG TENURE/i, /has been doing this for 9 years/i, 2],
    ["he died", `s.succession = { lan:"Aulus Vettius", age:51, heir:"Marcus Vettius",
      kind:"nephew" };`, /THE HOUSE GOES ON/i, /is dead at 51/i, 1],
  ]){
    await reload(p, mut, null, true);
    const m = await p.evaluate(()=>{
      const w = [...document.querySelectorAll(".modalwrap")]
        .find(x=>/THE HOUSE GOES ON|THE LONG TENURE/i.test(x.innerText||""));
      if(!w) return null;
      return { text:(w.innerText||"").replace(/\s+/g," ").trim(),
        buttons:[...w.querySelectorAll("button")].map(b=>(b.innerText||"").trim()).filter(Boolean) };
    });
    if(!m){ fails.push(`the succession screen was not raised when ${why}`); continue; }
    lines.push(`SUCCESSION (${why}): "${m.text.slice(0,90)}" · ${m.buttons.length} door${m.buttons.length===1?"":"s"}: ${m.buttons.join(" / ")}`);
    if(!wantHead.test(m.text))
      fails.push(`the succession screen headline is wrong when ${why}: "${m.text.slice(0,60)}"`);
    if(!wantWords.test(m.text))
      fails.push(`the succession screen does not say the right thing when ${why} — a handover from a `
        + `living man and one from a dead one are not the same event and this screen serves both`);
    if(m.buttons.length !== doors)
      fails.push(`the succession screen offers ${m.buttons.length} doors when ${why} and should offer `
        + `${doors}. A retirement is a choice — taking the chair or letting the line end with him, which `
        + `is the only route to \`oldAge\` — and a death is not`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
