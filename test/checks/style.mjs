/* A MAN'S STYLE WAS RE-SPECIFIED EVERY SINGLE BOUT — #199

   `plan` was reset to "none" by both `spendOrders` and `goPick`, so it was chosen from scratch every
   time. `tactic` was one house-wide `useState` that survived between bouts and was never saved, so
   it silently reverted to "measured" on every reload — a standing order the game forgot whenever the
   page did.

   THE MEASUREMENT DECIDED THE DESIGN, and it went against the item as filed. `TACTIC` is four fixed
   trades with no right answer, so a standing setting can only be a preference. `PLANS` is a BET:
   `planEffect` returns `PLAN_READ.right` (pow 1.027) when a tell of the opponent's names that plan,
   and `PLAN_READ.wrong` (pow 0.970) otherwise. Over 1,347 named opponents a played house met
   (probes/style.mjs): press right 22.7%, crowd 17.7%, wait 16.3%, outlast 8.0%, reach 4.4% —
   **every fixed plan is a standing loss**, the best of them worth -1.71% power a bout against
   `none`'s nothing.

   So the man carries a standing TACTIC and no standing plan, and the plan grid pre-fills only from
   a reading that has actually been paid for. This check pins that reasoning to the numbers it rests
   on: if `PLAN_READ.wrong` ever stops being a penalty, the design changes and this says so. */

import fs from "node:fs";
import path from "node:path";
import { found, tab, clearAll, forge, settle, waitSaved, ROOT } from "../harness.mjs";

export const name = "style";
export const describe = "a man fights his own way unless you say otherwise, and it survives the reload";

export async function run({ p, errors }){
  const fails = [], lines = [];

  /* ---- THE PREMISE, AGAINST THE SOURCE ----
     The whole design rests on a plan being a wager and a tactic being a dial. */
  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
  const read = (src.match(/const PLAN_READ = \{[\s\S]*?wrong:\s*\{ pow:([\d.]+)/)||["","?"])[1];
  const rightPow = (src.match(/const PLAN_READ = \{[\s\S]*?right:\s*\{ pow:([\d.]+)/)||["","?"])[1];
  lines.push(`PLAN_READ: a matching plan is pow ${rightPow}, a wrong one pow ${read}`);
  if(read === "?" || rightPow === "?") fails.push("PLAN_READ did not parse — the premise cannot be checked");
  else if(!(+read < 1))
    fails.push(`a wrong plan is pow ${read}, which is not a penalty — a plan is no longer a bet, and the reason this release gives the man no standing plan has gone away`);

  /* ---- THE STANDING STYLE ---- */
  const derived = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Style","clean","STY-1",null);
    const seen = {}, twice = [];
    for(let i=0;i<400;i++){
      const g = A.genGladiator(d, 40 + (i % 55));
      const k = A.styleFrom(g);
      seen[k] = (seen[k]||0)+1;
      if(A.styleFrom(g) !== k) twice.push(g.name);      /* it must be a read, not a draw */
    }
    /* an old save has no g.style at all */
    const g0 = A.genGladiator(d, 60); delete g0.style;
    const before = A.styleOf(g0);
    d.gladiators.push(g0);
    const set = A.setStyle(d, g0.id, "defensive");
    const after = A.styleOf(d.gladiators.find(x=>x.id===g0.id));
    const bad = A.setStyle(d, g0.id, "sprinting");
    return { seen, twice: twice.length, before, set, after, bad, keys:A.STYLE_KEYS };
  });
  lines.push(`400 men, styles derived from their own stats: ${Object.entries(derived.seen).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
  lines.push(`an old save with no style reads "${derived.before}"; set to defensive → "${derived.after}"; a nonsense style refused ${derived.bad === false}`);
  if(derived.twice) fails.push(`${derived.twice} men gave two different styles from the same stats — it is drawing rather than reading, and every seeded house in the project re-phases`);
  const used = Object.keys(derived.seen);
  for(const k of derived.keys) if(!used.includes(k))
    fails.push(`no man in 400 was ever "${k}" — a style nobody can have is unreachable writing`);
  if(!derived.before) fails.push("a man with no stored style has no style at all — old saves would break");
  if(derived.after !== "defensive") fails.push(`setting a style did not take: read back "${derived.after}"`);
  if(derived.bad !== false) fails.push("a style outside the table was accepted");

  /* ---- AND THE PLAN, WHICH GETS NO DEFAULT ON PURPOSE ---- */
  const sugg = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Style","clean","STY-2",null);
    while(A.activeG(d).length < 2) d.gladiators.push(A.genGladiator(d, 60));
    const g = A.activeG(d)[0];
    /* a green man is `green` → press, and it is the commonest tell on the bill */
    const opp = A.genOpponent(1, undefined, d); opp.wins = 0;
    const blind = { id:1, opp, tier:1, stakes:"standard" };
    const watched = { id:2, opp, tier:1, stakes:"standard", watched:["green"] };
    /* ---- A MAN WITH NO TELL IS NOT A FLAT MAN ----
       `seamOf` is deliberate about this — "a man with no shape at all still has a habit, and it is
       his" — so a fixture with all six stats equal gets a seam off a NAME HASH with dev 0, and
       `dev>=0` makes every `high` tell true. The flat man fired `quick` and this check called it a
       bug in the pre-fill. A genuinely tell-less opponent is one whose seam points the way no tell
       reads: strength as his clear WEAKNESS (only `strong` reads str, and only when it is high),
       with a record between the green and the veteran bands and no form. */
    const dull = A.genOpponent(1, undefined, d);
    dull.wins = 8; dull.losses = 4; dull.form = 0;
    dull.str = 30; dull.agi = 55; dull.end = 55; dull.tec = 55; dull.sho = 55; dull.dis = 55;
    const dullOffer = { id:3, opp:dull, tier:1, stakes:"standard", watched:["nothing"] };
    return { blind: A.suggestedPlan(d, g, blind), watched: A.suggestedPlan(d, g, watched),
             dull: A.suggestedPlan(d, g, dullOffer), none: A.suggestedPlan(d, g, null) };
  });
  lines.push(`the plan the panel starts on: unwatched "${sugg.blind}" · watched with a tell "${sugg.watched}" · watched with none "${sugg.dull}" · no offer "${sugg.none}"`);
  if(sugg.blind !== "none")
    fails.push(`an UNWATCHED opponent pre-filled the plan "${sugg.blind}" — every fixed plan measured as a standing loss, so a guess the player did not pay for must not be made for him`);
  if(sugg.watched === "none")
    fails.push("a watched opponent carrying a tell pre-filled nothing — the whole point of paying to watch him");
  if(sugg.dull !== "none") fails.push(`a watched opponent whose seam no tell reads pre-filled "${sugg.dull}" — there is nothing there to have read`);
  if(sugg.none !== "none") fails.push("a missing offer did not come back as no plan");

  /* ================= THE REAL SCREEN, AND THE RELOAD ================= */
  await found(p, { seed:"STY-S" });
  await clearAll(p, 8);
  const planted = await forge(p, (A) => {
    const d = A.newGameState("Style","clean","STY-S",null);
    d.gold = 20000; d.fame = 300; d.week = 40;
    while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 62));
    const men = A.activeG(d);
    men.forEach(g=>{ g.injury = null; g.fatigue = 3; g.lastFought = 0; delete g.style; });
    /* a man whose own temper is NOT defensive, so setting it to defensive is visibly a choice */
    men[0].sho = 20; men[0].dis = 20; men[0].str = 80; men[0].agi = 70; men[0].end = 40; men[0].tec = 40;
    return { plant:d, name: men[0].name, born: A.styleFrom(men[0]) };
  });
  lines.push(`the man on screen: ${planted.name}, whose own temper is "${planted.born}"`);
  await clearAll(p, 8);
  await tab(p, "men"); await p.waitForTimeout(350); await clearAll(p, 6);
  await tab(p, "men"); await p.waitForTimeout(330); await settle(p);
  const opened = await p.evaluate(nm=>{
    const b = [...document.querySelectorAll("button")].find(x=>(x.innerText||"").includes(nm));
    if(b) b.click(); return !!b;
  }, planted.name);
  if(!opened) return { pass:false, why:"could not open the man's page", lines };
  await p.waitForTimeout(500);
  const panel = await p.evaluate(()=>{
    const t = document.body.innerText || "";
    const i = t.search(/How he fights when you do not say/i);
    return i < 0 ? null : t.slice(i, i + 340).replace(/\n+/g, " · ");
  });
  lines.push(`his page: ${panel ? panel.slice(0,220) : "NO STANDING-STYLE CONTROL"}`);
  if(!panel) fails.push("the man's page carries no standing-style control — the choice has nowhere to live but the arena");
  else {
    const set = await p.evaluate(()=>{
      const bs = [...document.querySelectorAll("button")].filter(x=>/^Defensive$/i.test((x.innerText||"").trim()));
      if(!bs.length) return false; bs[bs.length-1].click(); return true;
    });
    if(!set) fails.push("no Defensive chip on his page");
    await p.waitForTimeout(400);
    await waitSaved(p);
    /* ---- THE DEFECT THIS RELEASE FIXES: the standing order used to be a useState ---- */
    await p.reload({ waitUntil:"domcontentloaded" });
    await p.waitForTimeout(900);
    await clearAll(p, 8);
    const kept = await p.evaluate(()=>{
      const A = window.__LVDVS;
      try {
        const k = Object.keys(localStorage).find(x=>/ludus-slot-\d/.test(x));
        const d0 = JSON.parse(localStorage.getItem(k));
        const g = (A.activeG(d0)||[])[0];
        return { style: g && g.style, read: g && A.styleOf(g) };
      } catch(e){ return { style:"THREW: "+e.message }; }
    });
    lines.push(`after a reload, his standing style is "${kept.style}" and reads back as "${kept.read}"`);
    if(kept.style !== "defensive")
      fails.push(`his standing style did not survive the reload — it read "${kept.style}". That is the defect this release exists to fix: it used to be a useState that reverted to "measured" whenever the page did.`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
