/* THE BRIBE HAD NEVER CHANGED AN OPPONENT — #205

   `GAMBITS.bribe` costs coin, twelve points of heat and fourteen of a rival's grudge, and its
   winning line promises *"for the next few months your men are matched softly"*. It sets
   `d.flags.editorBought`, which had **exactly one reader in the file** — and that reader was the
   `!pool.length` FALLBACK in `pickAnyOpp`, taken only when the circuit has nobody in the tier band.

   MEASURED (probes/editor.mjs, 8 houses x 300 weeks an arm): the circuit is empty in a tier band on
   **0 of 7,236 lookups**. Not rarely — never. The circuit holds sixteen men on a pyramid covering
   every band. So the one thing a bribe buys was bought never, while a player bribing every four
   weeks held the flag 5.67% of his weeks and got nothing at all for it.

   #205 said "the model is there, add the legitimate route". There was no model: five names used once
   to sign a booking line, and a dead flag. So this release makes the flag real first — a bought
   editor draws from a band one rung lower on the ORDINARY path — and then adds the honest
   counterpart, `PETITIONS`, which asks him for one thing about one card at the cost of favour.

   THE ASSERTION THIS EXISTS FOR: **a bought editor must actually soften the card.** It is asserted
   on the game's own picker over a real circuit, not on the flag's presence. */

import fs from "node:fs";
import path from "node:path";
import { found, tab, clearAll, forge, settle, click, waitSaved, ROOT } from "../harness.mjs";

export const name = "editor";
export const describe = "a bought editor matches you softly, and an honest word can do it too";

export async function run({ p, errors }){
  const fails = [], lines = [];
  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");

  const readers = [...src.matchAll(/editorBought\(d\)/g)].length;
  lines.push(`editorBought has ${readers} reader(s) in the file`);
  if(/if\(!pool\.length\) return \{ opp: genOpponent\(editorBought\(d\)/.test(src))
    fails.push("editorBought is back on the FALLBACK branch only — measured, that branch is taken on 0 of 7,236 lookups, so the bribe would buy nothing again");

  /* ---- THE BRIBE, ON THE GAME'S OWN PICKER ---- */
  const soft = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const avg = f => A.STATS.reduce((s,k)=>s+(f[k]||0),0)/6;
    const run = (bought) => {
      const d = A.newGameState("Ed","clean","ED-1",null);
      d.flags.editorBought = bought ? d.week + 12 : 0;
      const out = [];
      for(let i=0;i<600;i++){ const r = A.pickAnyOpp(d, 2); if(r && r.opp) out.push(avg(r.opp)); }
      return out;
    };
    const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
    const plain = run(false), bribed = run(true);
    return { plain:+mean(plain).toFixed(2), bribed:+mean(bribed).toFixed(2), n:plain.length };
  });
  lines.push(`a tier-2 opponent over ${soft.n} draws: ordinary ${soft.plain} · with the editor bought ${soft.bribed}`);
  if(!(soft.bribed < soft.plain))
    fails.push(`buying the editor drew an opponent averaging ${soft.bribed} against the ordinary ${soft.plain} — the bribe's own line promises your men are matched softly, and it is not happening`);

  /* and the fallback branch must still exist for the case it was written for */
  const fell = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Ed","clean","ED-2",null);
    d.circuit = [];                                  /* nobody at all, which is what the branch is for */
    const r = A.pickAnyOpp(d, 2);
    return !!(r && r.opp);
  });
  if(!fell) fails.push("with an empty circuit the picker returns nobody — the fallback it was written for is gone");

  /* ---- THE PETITIONS ---- */
  const pet = await p.evaluate(()=>{
    const A = window.__LVDVS;
    /* ---- A FIXTURE THAT RE-CREATES THE HOUSE RE-SEEDS THE RNG ----
       `newGameState` seeds the generator from its seed string, so rebuilding the house from one seed
       makes every iteration identical: four hundred tries were ONE try repeated four hundred times,
       and every entry read as "never granted — unreachable writing" against a table that grants
       freely. The seed varies per call, which is the only thing that makes a loop a sample. */
    let nth = 0;
    const mk = (patrons) => {
      const d = A.newGameState("Ed","clean","ED-3-" + (nth++),null);
      d.week = 60; d.fame = 400; d.favor = 70;
      if(!patrons) d.patrons = [];
      while(A.activeG(d).length < 2) d.gladiators.push(A.genGladiator(d, 60));
      d.flags.petitionWeek = 0;
      return d;
    };
    const offer = () => ({ id:1, tier:2, purse:600, stakes:"standard", venue:"forum",
      opp:{ name:"Foe", str:70, agi:70, end:70, tec:70, sho:70, dis:70, cls:"Murmillo", wins:5 } });
    const sine = () => Object.assign(offer(), { stakes:"sine" });
    const out = {};
    for(const k of A.PET_KEYS){
      const d = mk(true), o = k === "mercy" ? sine() : offer();
      d.games = { offers:[o], week:d.week, festival:"the games" };
      out[k] = { why: A.petitionWhy(d, k, o), odds:+A.petitionOdds(d, k).toFixed(3) };
    }
    /* every one of them driven to a yes and to a no */
    const drive = (k, want) => {
      for(let i=0;i<400;i++){
        const d = mk(true), o = k === "mercy" ? sine() : offer();
        d.games = { offers:[o], week:d.week, festival:"the games" };
        d.flags.petitionWeek = 0;
        const before = { purse:o.purse, opp:o.opp.name, stakes:o.stakes, fav:d.favor };
        const r = A.runPetition(d, k, 1);
        if(r && r.won === want) return { r, before, after:{ purse:o.purse, opp:o.opp.name, stakes:o.stakes, fav:d.favor } };
      }
      return null;
    };
    for(const k of A.PET_KEYS){ out[k].yes = drive(k, true); out[k].no = drive(k, false); }
    /* the two gates: no patrons, and the cooldown */
    const bare = mk(false); const bo = offer();
    bare.games = { offers:[bo], week:bare.week, festival:"the games" };
    out.__bare = A.petitionWhy(bare, "purse", bo);
    const cd = mk(true); const co = offer();
    cd.games = { offers:[co], week:cd.week, festival:"the games" };
    A.runPetition(cd, "purse", 1);
    out.__cool = A.petitionWhy(cd, "purse", co);
    out.__second = !!A.runPetition(cd, "soften", 1);
    return out;
  });
  for(const k of ["soften","purse","mercy"]){
    const r = pet[k];
    if(!r){ fails.push(`PETITIONS has no "${k}" entry`); continue; }
    lines.push(`  ${k}: about ${Math.round(r.odds*100)} in a hundred · ${r.why ? `dark ("${r.why.slice(0,40)}")` : "open"}`);
    if(r.why) fails.push(`"${k}" is dark on a house built to make it: ${r.why}`);
    if(!r.yes) fails.push(`"${k}" was never granted in 400 tries — unreachable writing`);
    if(!r.no) fails.push(`"${k}" was never refused in 400 tries — a request nobody can decline is not a request`);
    if(r.yes){
      const b = r.yes.before, a = r.yes.after;
      lines.push(`     granted → purse ${b.purse}→${a.purse} · opponent ${b.opp}→${a.opp} · stakes ${b.stakes}→${a.stakes} · favour ${b.fav}→${a.fav}`);
      if(k === "purse" && !(a.purse > b.purse)) fails.push("a granted purse request did not raise the purse");
      if(k === "mercy" && a.stakes !== "standard") fails.push("a granted appeal request left the card sine missione");
      if(k === "soften" && a.opp === b.opp) fails.push("a granted request for an easier man left the same man on the bill");
      if(!(a.fav < b.fav)) fails.push(`"${k}" cost no favour at all when it was granted`);
    }
    if(r.no && !(r.no.after.fav < r.no.before.fav))
      fails.push(`"${k}" cost nothing when it was refused — the asking was done in public`);
  }
  lines.push(`a house with no patrons: "${pet.__bare}" · after one request: "${pet.__cool}" · a second the same month ${pet.__second}`);
  if(!pet.__bare || !/nobody behind you/i.test(pet.__bare))
    fails.push("a house with no patrons is not told that is why it cannot ask");
  if(!pet.__cool || !/weeks/i.test(pet.__cool)) fails.push("the cooldown does not name itself");
  if(pet.__second) fails.push("a second request landed in the same month");

  /* ================= THE REAL OFFER PANEL ================= */
  await found(p, { seed:"ED-S" });
  await clearAll(p, 8);
  await forge(p, (A) => {
    const d = A.newGameState("Ed","clean","ED-S",null);
    d.gold = 20000; d.fame = 500; d.week = 70; d.flags.petitionWeek = 0;
    while(A.activeG(d).length < 2) d.gladiators.push(A.genGladiator(d, 64));
    A.activeG(d).forEach(g=>{ g.injury = null; g.fatigue = 3; g.lastFought = 0; });
    let guard = 0;
    while(guard++ < 60){ A.makeGames(d); if(d.games && (d.games.offers||[]).length) break; d.week++; }
    return d;
  });
  await clearAll(p, 8);
  await tab(p, "arena"); await p.waitForTimeout(340); await clearAll(p, 6);
  await tab(p, "arena"); await p.waitForTimeout(340); await settle(p);
  const top = `(()=>{ const ws=[...document.querySelectorAll(".modalwrap")]
    .map(w=>({z:+getComputedStyle(w).zIndex||50,w})).sort((a,b)=>b.z-a.z); return ws[0] && ws[0].w; })()`;
  if(!(await click(p, /choose a bout/i))) return { pass:false, why:"the arena would not open the wizard", lines };
  await p.waitForTimeout(700);
  await p.evaluate(`(()=>{ const w = ${top}; if(!w) return;
    const rows=[...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled);
    const o = rows.find(x=>!/the pits/i.test(x.innerText||"")) || rows[0]; if(o) o.click(); })()`);
  await p.waitForTimeout(650);
  await p.evaluate(`(()=>{ const w = ${top}; if(!w) return;
    const rows=[...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled); if(rows.length) rows[0].click(); })()`);
  await p.waitForTimeout(450);
  await p.evaluate(`(()=>{ const w = ${top}; if(!w) return;
    const b=[...w.querySelectorAll("button")].find(x=>/next/i.test(x.innerText||"") && !x.disabled); if(b) b.click(); })()`);
  await p.waitForTimeout(750);
  const panel = await p.evaluate(`(()=>{ const w = ${top};
    const t = ((w ? w.innerText : document.body.innerText) || "").toUpperCase();
    return { there: t.indexOf("A WORD WITH THE EDITOR") >= 0, odds: t.indexOf("IN A HUNDRED HE HEARS YOU") >= 0,
             cost: t.indexOf("FAVOUR") >= 0 }; })()`);
  lines.push(`on the ready panel: the editor's row ${panel.there} · its odds ${panel.odds} · what it costs ${panel.cost}`);
  if(!panel.there) fails.push("there is no way to put anything to the editor on the offer panel — the legitimate route is not reachable");
  if(!panel.odds) fails.push("the panel quotes no odds, and the gambit rows it sits beside all do");
  if(!panel.cost) fails.push("the panel does not say what the asking costs");

  await waitSaved(p);
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
