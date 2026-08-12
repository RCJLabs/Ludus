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

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
