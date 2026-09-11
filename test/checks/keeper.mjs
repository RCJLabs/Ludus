/* WHAT THE GATEKEEPER HAS ALREADY SAID — #265

   (`keeper` was free in BOTH directories; checked before writing, in checks and probes.)

   The item was written on two numbers and BOTH WERE WRONG, which is the first thing to record.
   **There are 35 lessons, not 53** — the figure came from `grep -c '^  { id:"'`, which counts every
   two-space table in the file and not `LESSONS`. And the item says the settings toggle "replays
   every one of the fifty-three from the beginning". It cannot, and the reason is the real finding:

       const lessonFor = (d, tab) => LESSONS.find(l => {
         if(l.tab!==tab || (d.flags.learned||{})[l.id]) return false;
         try { if(l.done && l.done(d)) return false; } catch(e){}     <-- a WINDOW, not a reading
         ...

   `done` closes on the state of the house whether or not anybody read anything — 33 of the 35 carry
   one — so clearing `flags.learned` cannot reopen a window that has shut. Measured
   (`probes/keeper.mjs`, 32 houses, 6,669 house-weeks, every tab walked every week): clearing it at
   week 40 brings back a median of **11 of 35**, at week 120 **7**, at week 300 **7**.

   ---- AND TWO OF THE THREE "DEAD" LESSONS WERE THE ROPE'S OWN HABIT ----
   Walking every tab every week, three lessons were never offered in any of 32 houses: `armory`,
   `heir`, `watch`. Publishing that as dead content is the mistake #260 spent nine releases teaching,
   so a second arm was run — `heir:false, gear:false, bout:false`, a poor player and a legal one:

     armory   16 eligible weeks under the reference, **144** under the novice — the rope buys gear
              in week one and `done:...gearCond` shuts it. Not dead. One week wide because of us.
     watch    **0** under the reference, **35** under the novice — it wants fewer than four bouts in
              the book AND a live offer standing, and the rope fights every week it can.
     heir     0 under both. This one is the gate: it wants a lanista at 48 or under 55 health with
              no heir named, and no house in either arm was ever in that state inside 420 weeks.
     venue    3 under the reference, 0 under the novice — open only BECAUSE the reference fights.

   WHAT THIS FILE HOLDS is the recall, which is what the item actually asked for: `lessonsTold`
   returns what the gatekeeper has said, in table order, and the Guidance group prints it
   re-openable. It adds no content and reaches nothing he never got to — that is #275's.

   THREE ARMS. */
import { installRope } from "../harness.mjs";

export const name = "keeper";
export const describe = "the gatekeeper can be asked again about anything he has already said, and his window is not his reading";

const HOUSES = 8, WEEKS = 200;
/* measured 11 / 7 / 7 of 35 over 32 houses; the bar is that recall is not the whole corpus and not
   nothing, which is the claim — not the particular median */
const RECALL_MAX = 30;

export async function run({ p }){
  const lines = [], bad = [];
  await installRope(p);

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["LESSONS","lessonFor","lessonsTold","lessonsRead","newGameState"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const TABS = [...new Set(A.LESSONS.map(l=>l.tab))];
    const withDone = A.LESSONS.filter(l=>l.done).length;

    const houses = [];
    for(let i=0;i<H;i++){
      const d = A.newGameState("Kp","clean",`KEEPERCHK-${i}`);
      for(let w=0;w<W;w++){
        if(d.over) break;
        for(const t of TABS){
          let l = null; try { l = A.lessonFor(d, t); } catch(e){}
          if(l) d.flags.learned = Object.assign({}, d.flags.learned, { [l.id]:1 });
        }
        try { R.lanista(d); } catch(e){ break; }
      }
      const told = A.lessonsTold(d);
      const learned = Object.keys(d.flags.learned||{});
      /* and what clearing the flag would actually give back */
      const keep = d.flags.learned;
      d.flags.learned = {};
      let back = 0; const reachable = [];
      for(const t of TABS){ const tmp = {}; let l=null; try{ l=A.lessonFor(d,t); }catch(e){}
        while(l && !tmp[l.id]){ back++; tmp[l.id]=1; reachable.push(l.id);
          d.flags.learned = Object.assign({}, d.flags.learned, {[l.id]:1});
          try{ l=A.lessonFor(d,t); }catch(e){ l=null; } } }
      /* the mechanism, asserted directly: with NOTHING read, anything `lessonFor` can still reach
         must have an OPEN window. A lesson whose `done(d)` is true and that comes back anyway means
         `done` is no longer consulted — and that is the whole of why the toggle cannot replay. */
      const shutButOffered = reachable.filter(id=>{ const l = A.LESSONS.find(x=>x.id===id);
        try { return !!(l.done && l.done(d)); } catch(e){ return false; } });
      /* and the size of what it shuts: never read, and its window closed behind it */
      const shutUnread = A.LESSONS.filter(l=>{ if(keep[l.id]) return false;
        try { return !!(l.done && l.done(d)); } catch(e){ return false; } }).map(l=>l.id);
      d.flags.learned = keep;
      houses.push({ week:d.week, learned:learned.length, told:told.length, back,
        shutButOffered, shutUnread:shutUnread.length,
        ids: told.map(l=>l.id), order: told.map(l=>A.LESSONS.indexOf(l)),
        titled: told.every(l=>l.title && l.text) });
    }
    return { houses, total:A.LESSONS.length, withDone, tabs:TABS.length };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };
  const { houses, total, withDone } = r;
  const med = a => a.length ? a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)] : 0;

  /* 1 — the corpus is what it is, and the item's 53 was a miscount */
  lines.push(`${total} lessons across ${r.tabs} tabs, ${withDone} of them carrying a \`done\` window [the item said 53 — that was \`grep -c '^  { id:"'\` counting every table in the file]`);
  if(total < 20 || total > 60)
    bad.push(`LESSONS holds ${total} entries — the figures in #265 and in this file were taken at 35 and should be re-read`);

  /* 2 — everything read is recallable, in the table's own order */
  const toldEq = houses.filter(h=>h.told === h.learned).length;
  lines.push(`over ${houses.length} houses to week ${WEEKS}: read p50 ${med(houses.map(h=>h.learned))}, recallable p50 ${med(houses.map(h=>h.told))} — ${toldEq}/${houses.length} houses have every read lesson on the list`);
  for(const h of houses){
    if(h.told !== h.learned)
      bad.push(`a house read ${h.learned} lessons and \`lessonsTold\` returns ${h.told} — the recall list is not what the gatekeeper said, which is the one thing it is for`);
    if(!h.titled)
      bad.push(`a recalled lesson has no title or no text to show — the list would print a blank row`);
    const sorted = h.order.slice().sort((a,b)=>a-b);
    if(h.order.join(",") !== sorted.join(","))
      bad.push(`the recall list is out of the table's order — it should read in the order he says things, not the order they were read`);
  }

  /* ---- 3 — AND THE WINDOW IS NOT THE READING, ASSERTED ON THE MECHANISM ----
     The first cut of this arm put a bar on how many lessons come back when `flags.learned` is
     cleared, and IT COULD NOT FIRE: disabling the `done` test in `lessonFor` altogether left the
     check green, because `when` still gates most of the corpus and the count stayed under the bar.
     A bar on a number that a broken mechanism does not move is not a check. This asserts the
     mechanism instead — with nothing read, everything still reachable must have an OPEN window —
     and the same sabotage turns it red. */
  const back = houses.map(h=>h.back);
  lines.push(`clearing \`flags.learned\` at the end gives back p50 ${med(back)} of ${total} (min ${Math.min(...back)}, max ${Math.max(...back)}) [measured 11 at week 40, 7 at 120, 7 at 300 over 32 houses]`);
  lines.push(`   and p50 ${med(houses.map(h=>h.shutUnread))} lessons are shut UNREAD — their window closed on the house's state and no toggle reopens it`);
  for(const h of houses) if(h.shutButOffered.length){
    bad.push(`with nothing read, \`lessonFor\` still offered ${h.shutButOffered.join(", ")} — whose \`done\` is TRUE. `
      + `\`done\` is meant to be a window that closes on the house's state, and it is no longer being consulted; `
      + `#265's finding (that clearing \`flags.learned\` cannot replay what the window shut) rests on exactly this line`);
    break;
  }
  if(med(back) >= RECALL_MAX)
    bad.push(`clearing \`flags.learned\` gave back p50 ${med(back)} of ${total}, at or past ${RECALL_MAX} — recall has become the whole corpus, which the measured 7-11 says it is not`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
