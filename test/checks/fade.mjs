/* WHAT A HOUSE FORGETS IN A WEEK — #246 phase 5.

   (`fade` was free in both directories; checked before writing.)

   `rivalWeekly` forgot at a flat `1 x L.grudgeDecay` every week for ever — 0.960 a house-week
   measured, 74% of the whole grudge's outflow — so a blood feud faded at the rate of a slight and
   last week's bout faded at the rate of one from two years ago. `GRUDGE_HOLD` holds back 65% of
   that week's forgetting for `GRUDGE_FRESH` weeks after a card against the house.

   FIVE ARMS, and the last one is the item's own falsifier rather than a description of the code.

   1 · THE RULE IS CONNECTED, AND IT IS ONE CALL. `fadeRate` must BE the lanista's rate scaled by
       the hold, read off `LANISTAE` rather than from a number of this file's own — #150's rule
       applied to a constant: the arithmetic asserted here and the arithmetic the week runs are the
       same call. A rule that is inert reads exactly like a rule with no effect, and this project
       has shipped four of those (`stakes`, `preferStakes`, `entrance`, and `pick` written twice).
   2 · AND THE STATE MOVES BY IT. Two houses, one met and one not, stepped through a real week:
       the grudge each loses must equal what `fadeRate` says, not merely correlate with it.
   3 · AND THE WINDOW CLOSES. Fresh at `GRUDGE_FRESH - 1` weeks, cold at `GRUDGE_FRESH`. An
       always-open window is the same bug as a never-open one and neither shows in a mean.
   4 · AND A SAVE WRITTEN BEFORE THIS DECAYS AS IT ALWAYS DID. `metHouse.last` is the whole of the
       rule's state; a house without one is not fresh, and the game a player left is the game they
       come back to until the next card.
   5 · AND THE BAY IS HOTTER, WITHIN BOUNDS. The point of the phase is the hostile surface, so the
       check holds the measured outcome from BOTH sides: mass above `GRUDGE_SABOTAGE` must stay well
       clear of the 4.0% it sat at before the rule (a rule that stops working is a silent revert)
       and must not run away into a permanent siege, which is worse than doing nothing and is what
       an over-tuned hold would look like. The bars are wide because the arm is small; they exist to
       catch a rule that has come loose, not to pin a constant. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "fade";
export const describe = "a house you have just fought does not forget at the rate of one you have not";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"FADE-1" });
  await clearAll(p, 10);
  await installRope(p);

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","fadeRate","grudgeFresh","metLast","metHouse","lanistaOf",
                  "GRUDGE_FRESH","GRUDGE_HOLD","GRUDGE_SABOTAGE","rivalWeekly","houseOf"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const r = { FRESH:A.GRUDGE_FRESH, HOLD:A.GRUDGE_HOLD, GATE:A.GRUDGE_SABOTAGE, arms:{} };

    /* 1 · the rate itself, against `LANISTAE` rather than against a constant of this file's own */
    { const d = A.newGameState("Fade", "clean", "FADE-A");
      d.week = 100;
      const rows = [];
      for(const h of (d.rivals||[])){
        const rate = A.lanistaOf(h.name).grudgeDecay || 1;
        d.metHouse = d.metHouse || {};
        d.metHouse[h.name] = { met:1, seen:[], last:d.week };            /* met this week */
        const hot = A.fadeRate(d, h);
        d.metHouse[h.name].last = d.week - A.GRUDGE_FRESH;               /* the window just shut */
        const cold = A.fadeRate(d, h);
        delete d.metHouse[h.name];                                       /* never met at all */
        const never = A.fadeRate(d, h);
        rows.push({ name:h.name, rate, hot, cold, never });
      }
      r.arms.rate = rows; }

    /* 2 · and the state moves by exactly that, through a real week */
    { const rows = [];
      for(const met of [true, false]){
        const d = A.newGameState("Fade", "clean", "FADE-B");
        d.week = 200;
        d.metHouse = {};
        for(const h of (d.rivals||[])){
          h.grudge = 60;                                    /* well clear of the clamp at either end */
          if(met) d.metHouse[h.name] = { met:1, seen:[], last:d.week };
        }
        const want = (d.rivals||[]).map(h=>({ name:h.name, was:h.grudge, rate:A.fadeRate(d, h) }));
        A.rivalWeekly(d);
        for(const w of want){ const h = A.houseOf(d, w.name);
          rows.push({ met, name:w.name, was:w.was, now:Math.round((h.grudge||0)*1000)/1000,
            lost:Math.round((w.was - (h.grudge||0))*1000)/1000, want:Math.round(w.rate*1000)/1000 }); }
      }
      r.arms.step = rows; }

    /* 3 · the window's two edges */
    { const d = A.newGameState("Fade", "clean", "FADE-C");
      d.week = 300; d.metHouse = {};
      const h = (d.rivals||[])[0];
      const at = n => { d.metHouse[h.name] = { met:1, seen:[], last:d.week - n };
        return { since:n, fresh:A.grudgeFresh(d, h.name) }; };
      r.arms.window = [at(0), at(A.GRUDGE_FRESH-1), at(A.GRUDGE_FRESH), at(A.GRUDGE_FRESH+40)]; }

    /* 4 · a save from before the rule: `metHouse` written by the old code has no `last` */
    { const d = A.newGameState("Fade", "clean", "FADE-D");
      d.week = 90;
      const h = (d.rivals||[])[0];
      d.metHouse = { [h.name]: { met:9, beaten:3, lost:2, seen:["drink"] } };   /* the old shape, verbatim */
      r.arms.old = { last:A.metLast(d, h.name), fresh:A.grudgeFresh(d, h.name),
        rate:A.fadeRate(d, h), flat:A.lanistaOf(h.name).grudgeDecay || 1 };
      /* and it starts holding the moment a card is played */
      A.metHouse(d, h.name);
      r.arms.old.afterCard = { last:A.metLast(d, h.name), fresh:A.grudgeFresh(d, h.name), rate:A.fadeRate(d, h) }; }

    /* 5 · and the bay is hotter, measured the way the phase was decided */
    { let hw = 0, over = 0, weeks = 0, acts = 0, fresh = 0;
      const HOSTILE = ["poached","sabotage","thugs","bribedEditor","stolenSteel","courted","defected","whispers"];
      for(let i=0; i<28; i++){
        const d = A.newGameState("Fd"+i, "clean", `FADEDIST-${i}`);
        for(let w=0; w<340; w++){
          if(d.over) break;
          weeks++;
          try { R.lanista(d); } catch(e){ break; }
          const ev = d.pendingEvent && d.pendingEvent.id;
          if(ev && HOSTILE.includes(ev)) acts++;
          for(const h of (d.rivals||[])){ if(h.retired) continue;
            hw++; if((h.grudge||0) >= A.GRUDGE_SABOTAGE) over++;
            if(A.grudgeFresh(d, h.name)) fresh++; }
        }
      }
      r.arms.dist = { houseWeeks:hw, overPc: hw ? Math.round(1000*over/hw)/10 : 0,
        freshPc: hw ? Math.round(1000*fresh/hw)/10 : 0,
        weeks, acts, everyN: acts ? Math.round(weeks/acts) : null }; }
    return r;
  });
  if(out.why) return { pass:false, why:out.why, lines };

  const HOLD = out.HOLD, FRESH = out.FRESH;
  lines.push(`a card holds ${Math.round(HOLD*100)}% of the week's forgetting for ${FRESH} weeks`);

  /* 1 */
  for(const x of out.arms.rate){
    const wantHot = Math.round(x.rate * (1 - HOLD) * 1e6) / 1e6;
    lines.push(`  ${x.name}: rate ${x.rate} · met ${Math.round(x.hot*1000)/1000} · cold ${Math.round(x.cold*1000)/1000}`);
    if(Math.abs(x.hot - wantHot) > 1e-6)
      bad.push(`${x.name} decays at ${x.hot} the week after a card and \`grudgeDecay ${x.rate} × (1 − ${HOLD})\` is ${wantHot} — `
        + `\`fadeRate\` is not the lanista's own rate scaled by the hold, which is the one thing the constant means`);
    if(Math.abs(x.cold - x.rate) > 1e-6 || Math.abs(x.never - x.rate) > 1e-6)
      bad.push(`${x.name} decays at ${x.cold} outside the window and ${x.never} having never been met, against a rate of `
        + `${x.rate} — a house with nothing recent behind it must forget exactly as it always did`);
    if(!(x.hot < x.cold))
      bad.push(`${x.name} forgets no slower for having just been fought (${x.hot} against ${x.cold}) — the rule is not connected`);
  }
  /* 2 */
  for(const s of out.arms.step){
    if(Math.abs(s.lost - s.want) > 0.002)
      bad.push(`${s.name} lost ${s.lost} of its grudge across a real week and \`fadeRate\` said ${s.want} `
        + `(${s.met?"met this week":"not met"}) — the week is not running the rule this check just asserted`);
  }
  { const hot = out.arms.step.filter(s=>s.met), cold = out.arms.step.filter(s=>!s.met);
    const mh = hot.reduce((n,s)=>n+s.lost,0)/(hot.length||1), mc = cold.reduce((n,s)=>n+s.lost,0)/(cold.length||1);
    lines.push(`  through a real week from 60: met loses ${Math.round(mh*1000)/1000}, not met loses ${Math.round(mc*1000)/1000}`);
    if(!(mh < mc)) bad.push(`a house met this week lost as much grudge as one that was not (${mh} against ${mc})`); }
  /* 3 */
  { const w = out.arms.window;
    lines.push(`  the window: ${w.map(x=>`${x.since}wk ${x.fresh?"fresh":"cold"}`).join(" · ")}`);
    if(!w[0].fresh || !w[1].fresh)
      bad.push(`the window is shut inside \`GRUDGE_FRESH\` (${FRESH}) — at ${w.find(x=>!x.fresh).since} weeks it already reads cold`);
    if(w[2].fresh || w[3].fresh)
      bad.push(`the window is still open at ${FRESH} weeks and beyond — a hold that never lifts is a different rule from the one measured`); }
  /* 4 */
  { const o = out.arms.old;
    lines.push(`  a save from before the rule: last ${o.last === null ? "none" : o.last}, rate ${o.rate} against a flat ${o.flat}; after one card ${o.afterCard.fresh?"fresh":"still cold"}`);
    if(o.last !== null || o.fresh)
      bad.push(`a \`metHouse\` entry written before this rule reads as fresh — an old save must decay exactly as it did`);
    if(Math.abs(o.rate - o.flat) > 1e-6)
      bad.push(`an old save's house decays at ${o.rate} and its lanista's rate is ${o.flat} — the migration is not silent`);
    if(!o.afterCard.fresh || o.afterCard.last == null)
      bad.push(`one card against the house did not start the window — \`metHouse\` is not stamping \`last\``); }
  /* 5 */
  { const D = out.arms.dist;
    lines.push(`  ${D.houseWeeks} house-weeks: ${D.overPc}% above the sabotage gate (${out.GATE}), fresh on ${D.freshPc}%, `
      + `a hostile act every ${D.everyN} weeks`);
    if(D.overPc < 5.5)
      bad.push(`only ${D.overPc}% of house-weeks are above \`GRUDGE_SABOTAGE\` — the flat decay this phase replaced sat at 4.0% `
        + `and the rule measured 8.75%, so this is the rule having come loose rather than a retune`);
    if(D.overPc > 20)
      bad.push(`${D.overPc}% of house-weeks are above \`GRUDGE_SABOTAGE\` against a measured 8.75% — the hold has run away into a `
        + `permanent siege, which the phase's own note calls worse than doing nothing`);
    if(D.everyN != null && D.everyN < 12)
      bad.push(`a hostile act every ${D.everyN} weeks against a measured 21 — the bay is at war rather than hostile`);
    if(D.freshPc < 15 || D.freshPc > 80)
      bad.push(`the window is open on ${D.freshPc}% of house-weeks, measured at 45% — a window that is always or never open `
        + `produces a mean that looks fine and a rule that is not the one written`); }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the rule is the lanista's own rate scaled by the hold, the window opens on a card and shuts on time, and an old save is untouched`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
