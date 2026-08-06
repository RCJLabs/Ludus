/* Can a new house still get off the ground? Three of them, twenty-six weeks each,
   taking whatever the arena offers. The oldest check there is, and the one that has
   caught the most: an economy change that quietly bankrupted every opening, a modal
   that trapped the week, a crash on the first death.

   It was five houses and thirty weeks and it took twelve minutes and outlived its
   own browser. Three and twenty-six sees the same things — the first winter, the
   first deaths, the first hard week — in a third of the time. If it needs to be
   longer, raise WEEKS rather than HOUSES; the weeks are where the game changes.

   ---- IT SPENT A LONG TIME PASSING DEAD HOUSES ----

   Two things were wrong with it and they hid each other.

   It never bought a man. It founded a house of three, fought every week for
   twenty-six weeks at about a quarter of bouts killing somebody, and never once
   went to the block. That is not a house being tested, it is a house being
   starved, and there is only one way it can end.

   And "standing" meant d.over had not been set. So a house with nobody left in
   the yard passed, as long as the game had not yet got round to saying so. The
   run before this was rewritten ended with one man, one man, and none — and was
   recorded as three of three surviving. When the third finally tipped into the
   emptied ending, the check reported a regression that measurement then showed
   did not exist: the same policy on the version before scored 8 of 12 against 9
   of 12 after, with deaths per bout at 24.7% and 23.4%.

   So it buys when the yard is thin and it can afford to, the way a lanista does,
   and standing now means it can still field somebody. */

import { found, endWeek, clearAll, tab, click, slot, waitSaved } from "../harness.mjs";

export const name = "survive";
export const describe = "three new houses live twenty-six weeks and still have men";

const HOUSES = 3;    /* enough to see a pattern; five took twelve minutes and outlived its browser */
const WEEKS  = 26;   /* past the first winter, the first deaths, the first hard week */
const KEEP   = 4;    /* the yard a lanista tries to hold; below it, he goes to the block */

export async function run({ p, errors }){
  const lines = [], runs = [];
  for(let r=0; r<HOUSES; r++){
    try {
      await found(p);
      let bought = 0;
      for(let w=0; w<WEEKS; w++){
        /* keep the yard up if the purse allows — men die here, and a lanista who
           never goes to the block is not playing, he is waiting */
        const now = await slot(p);
        if(now && (now.gladiators||[]).filter(g=>g.status!=="dead"&&g.status!=="gone"&&g.status!=="freed").length < KEEP){
          await tab(p, "market"); await p.waitForTimeout(300);
          if(await p.evaluate(()=>{
            const b = [...document.querySelectorAll("button")]
              .find(x=>/^(buy|take him|pay|meet it)/i.test((x.innerText||"").trim()) && !x.disabled);
            if(b){ b.click(); return true; } return false; })){ bought++; await p.waitForTimeout(500); await clearAll(p, 6); }
        }
        /* take a bout if one is going */
        await tab(p, "arena"); await p.waitForTimeout(170);
        if(await click(p, /choose a bout/i)){
          await p.waitForTimeout(260);
          await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")]
            .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
            const bs=w?[...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled):[];
            if(bs.length) bs[0].click(); });
          await p.waitForTimeout(240);
        }
        await clearAll(p);
        if(!(await endWeek(p))) break;
        await clearAll(p);
        const d = await slot(p);
        if(!d || d.over) break;
      }
      await waitSaved(p);
      const d = await slot(p);
      /* "men" must mean in the yard, not fit this week — a house whose whole roster is
         mending reads as empty otherwise, and that is the difference between a house
         having a bad month and a house being over. */
      runs.push(!d ? null : { week:d.week, gold:d.gold, fame:Math.round(d.fame), bought,
        yard:(d.gladiators||[]).filter(g=>g.status!=="dead" && g.status!=="gone" && g.status!=="freed").length,
        fit:(d.gladiators||[]).filter(g=>g.status==="active").length,
        bouts:(d.book&&d.book.n)||0, over:d.over ? (d.over.kind||"ended") : null });
    } catch(e){
      /* a house that takes the browser down with it is a finding, not a lost run */
      lines.push(`house ${r+1} could not be played to the end: ${e.message.split("\n")[0]}`);
      runs.push(null);
    }
  }
  const live = runs.filter(Boolean);
  for(const x of live)
    lines.push(`week ${String(x.week).padStart(2)} · gold ${String(x.gold).padStart(6)} · fame ${String(x.fame).padStart(4)} · ${x.yard} in the yard (${x.fit} fit) · ${x.bouts} bouts · ${x.bought} bought${x.over?` · ENDED: ${x.over}`:""}`);
  /* standing means it can still field somebody. The absence of an end-flag is not
     the same thing, and for a long time this check accepted it as if it were. */
  const standing = live.filter(x=>!x.over && x.yard > 0).length;
  lines.push(`${standing} of ${live.length} houses still standing after ${WEEKS} weeks, with men in the yard`);
  return {
    pass: live.length === HOUSES && standing >= 2 && errors.length === 0,
    why: live.length < HOUSES ? `${HOUSES - live.length} of ${HOUSES} houses produced no save at all`
       : standing < 2 ? `only ${standing} of ${HOUSES} houses came through ${WEEKS} weeks with a man left in the yard`
       : errors.length ? `${errors.length} page errors: ${errors.slice(0,2).join(" | ")}` : null,
    lines,
  };
}
