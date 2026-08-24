/* THE CROWD WAS A NUMBER AND NEVER A DEMAND — #200

   `VENUES` carries a flat `crowd` per venue and that was the only per-card crowd input in the game:
   a constant chosen off tier and festival, which nothing can meet or flout. The item asked first
   whether that constant already varies enough that an appetite would be a second name for it.

   MEASURED over 1,224 bouts a reference house actually fought (probes/appetite.mjs):

     the venue constant explains 37.8% of where a bout's crowd ends up — so it is NOT the dial
     a long bout ends +13.0 above a short one — the crowd DOES answer the shape of a bout
     a death moves it -0.8 — over 280 deaths, the crowd does not care that a man died

   The third line is why this was worth building: the one thing an arena crowd is supposed to want
   is the one thing the engine never priced. Base rates set the payouts — quick 16.2%, blood 22.9%,
   long 29.6%, mercy 68.1%.

   THE PROPERTY THIS CHECK EXISTS FOR ABOVE ALL: **the mood is derived from the card, not drawn.**
   A roll in `makeGames` would re-phase every seeded house in the project. `appetiteOf` hashes fields
   the offer already carries, so it costs no draw — and a later edit could break that silently with
   one `R()`. It is asserted on the game's own seed rather than trusted. */

import fs from "node:fs";
import path from "node:path";
import { found, tab, clearAll, forge, settle, click, waitSaved, ROOT } from "../harness.mjs";

export const name = "appetite";
export const describe = "some cards come with a mood, it is printed, and it is settled";

export async function run({ p, errors }){
  const fails = [], lines = [];

  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
  const drawn = /function appetiteOf\([\s\S]*?\n\}/.exec(src);
  if(drawn && /\bR\(\)/.test(drawn[0]))
    fails.push("appetiteOf draws a random number — every seeded house in the project re-phases, and open.mjs can never be exact again");

  /* ---- THE TABLE, AND THAT IT COSTS NO DRAW ---- */
  const table = await p.evaluate(()=>{
    const A = window.__LVDVS;
    if(!A.APPETITES || !A.appetiteOf) return null;
    const d = A.newGameState("Mood","clean","AP-1",null);
    /* ---- THE OPPONENT IS BUILT ONCE, OUTSIDE THE SEED TEST ----
       `genOpponent` DRAWS. Calling it inside the loop moved the seed by three thousand opponents
       and this check reported "the mood is being drawn" against a function that is a pure hash —
       the instrument accusing the code of the instrument's own fault. */
    const foe = A.genOpponent(1, undefined, d);
    const mk = (i, extra) => Object.assign({ id:1000+i, tier:1, festival:"the games", purse:400+i*37,
      venue:"forum", stakes:"standard", opp:foe }, extra||{});
    A.rngSet(4242);
    const seen = {}; let n = 0;
    for(let i=0;i<3000;i++){ const k = A.appetiteOf(mk(i)); if(k){ n++; seen[k] = (seen[k]||0)+1; } }
    const seedAfter = A.rngGet();
    /* and the same card twice must give the same mood */
    const a = A.appetiteOf(mk(7)), b = A.appetiteOf(mk(7));
    /* never on the engines that have no single opponent to judge */
    const other = { melee: A.appetiteOf(mk(3,{melee:true, field:[]})),
                    pair:  A.appetiteOf(mk(3,{pair:true, opps:[]})),
                    hunt:  A.appetiteOf(mk(3,{venatio:true})),
                    imper: A.appetiteOf(mk(3,{imperial:true})),
                    noOpp: A.appetiteOf(mk(3,{opp:null})) };
    return { keys:A.APP_KEYS, share:A.APP_SHARE, seen, n, of:3000, seedAfter, stable:a===b, a, other };
  });
  if(!table) return { pass:false, why:"APPETITES is not on the handle", lines };
  lines.push(`the table: [${table.keys.join(" ")}] · a mood on ${(table.n/table.of*100).toFixed(1)}% of 3000 cards (APP_SHARE ${table.share})`);
  lines.push(`which moods: ${Object.entries(table.seen).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
  if(table.seedAfter !== 4242)
    fails.push(`three thousand appetiteOf calls moved the seed 4242 → ${table.seedAfter} — the mood is being DRAWN, and every seeded house re-phases`);
  if(!table.stable) fails.push(`the same card gave two different moods ("${table.a}") — it must be a property of the card`);
  for(const k of table.keys) if(!table.seen[k]) fails.push(`"${k}" never came up in 3000 cards — unreachable writing`);
  const share = table.n / table.of;
  if(Math.abs(share - table.share) > 0.06)
    fails.push(`a mood landed on ${(share*100).toFixed(1)}% of cards against APP_SHARE ${table.share} — the hash is not spreading`);
  for(const [what, v] of Object.entries(table.other))
    if(v) fails.push(`a "${what}" offer carried the mood "${v}" — there is no single opponent for it to be judged on`);

  /* ---- MET AND FLOUTED, FOR EVERY ONE OF THEM ---- */
  const ran = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const out = {};
    for(const k of A.APP_KEYS){
      const mk = () => { const d = A.newGameState("Mood","clean","AP-2",null);
        d.gold = 5000; d.acclaim = 50;
        return d; };
      const offer = { id:1, tier:1, venue:"forum", purse:500, stakes:"standard", festival:"the games", opp:{ name:"X" } };
      /* the result the entry is judged on, built to satisfy it and to flout it */
      const longRes  = { beats:new Array(30).fill({kind:"clash"}), bDies:false };
      const shortRes = { beats:new Array(9).fill({kind:"clash"}),  bDies:false };
      const deadRes  = { beats:new Array(18).fill({kind:"clash"}), bDies:true };
      const cases = { quick:[shortRes, longRes], blood:[deadRes, longRes],
                      long:[longRes, shortRes], mercy:[longRes, deadRes] };
      const [yes, no] = cases[k] || [longRes, shortRes];
      const dm = mk(), dn = mk();
      /* force this card to carry THIS mood by walking ids until the hash lands on it */
      let id = 1, guard = 0;
      while(guard++ < 20000 && A.appetiteOf(Object.assign({}, offer, { id })) !== k) id++;
      const found = A.appetiteOf(Object.assign({}, offer, { id })) === k;
      const oM = Object.assign({}, offer, { id }), oN = Object.assign({}, offer, { id });
      const rm = A.appetiteAfter(dm, null, oM, yes, 500);
      const rn = A.appetiteAfter(dn, null, oN, no, 500);
      out[k] = { found, tries:guard,
        met:  rm && { met:rm.met, paid:rm.paid, gold:dm.gold - 5000, acclaim:+(dm.acclaim - 50).toFixed(2) },
        miss: rn && { met:rn.met, paid:rn.paid, gold:dn.gold - 5000, acclaim:+(dn.acclaim - 50).toFixed(2) } };
    }
    /* a card with no mood must settle to nothing at all */
    const d0 = A.newGameState("Mood","clean","AP-3",null); d0.gold = 5000; d0.acclaim = 50;
    let plain = null, id = 1, g2 = 0;
    while(g2++ < 20000 && A.appetiteOf({ id, tier:1, venue:"forum", purse:500, opp:{name:"X"} })) id++;
    plain = A.appetiteAfter(d0, null, { id, tier:1, venue:"forum", purse:500, opp:{name:"X"} },
      { beats:[], bDies:false }, 500);
    out.__plain = { r:plain, gold:d0.gold - 5000, acclaim:d0.acclaim - 50 };
    return out;
  });
  for(const k of table.keys){
    const r = ran[k];
    if(!r || !r.found){ fails.push(`could not build a card carrying "${k}" in 20,000 ids`); continue; }
    lines.push(`  ${k}: met → ${r.met && r.met.paid}d, acclaim ${r.met && r.met.acclaim>=0?"+":""}${r.met && r.met.acclaim}`
      + `   ·   flouted → ${r.miss && r.miss.paid}d, acclaim ${r.miss && r.miss.acclaim}`);
    if(!r.met || !r.met.met) fails.push(`"${k}" was not met by a result built to satisfy it`);
    if(r.miss && r.miss.met) fails.push(`"${k}" counted as met by a result built to flout it`);
    if(!(r.met && r.met.gold > 0)) fails.push(`"${k}" paid nothing when it was met`);
    if(!(r.met && r.met.acclaim > 0)) fails.push(`"${k}" did not warm the town when it was met`);
    if(!(r.miss && r.miss.acclaim < 0)) fails.push(`"${k}" did not sour the town when it was flouted — the item is paid if met and soured if flouted`);
    if(r.miss && r.miss.gold !== 0) fails.push(`"${k}" moved coin on a flouting (${r.miss.gold}d) — nothing is taken, the bonus is simply not paid`);
  }
  lines.push(`a card with no mood: ${ran.__plain.r === null ? "settles to nothing" : "RETURNED SOMETHING"} · gold ${ran.__plain.gold} · acclaim ${ran.__plain.acclaim}`);
  if(ran.__plain.r !== null || ran.__plain.gold || ran.__plain.acclaim)
    fails.push("a card carrying no mood still settled one");

  /* ================= AND IT HAS TO BE PRINTED BEFORE YOU FIGHT ================= */
  await found(p, { seed:"AP-S" });
  await clearAll(p, 8);
  const planted = await forge(p, (A) => {
    const d = A.newGameState("Mood","clean","AP-S",null);
    d.gold = 20000; d.fame = 500; d.week = 60;
    while(A.activeG(d).length < 2) d.gladiators.push(A.genGladiator(d, 64));
    A.activeG(d).forEach(g=>{ g.injury = null; g.fatigue = 3; g.lastFought = 0; });
    let guard = 0;
    while(guard++ < 60){ A.makeGames(d); if(d.games && (d.games.offers||[]).length) break; d.week++; }
    if(!d.games) return { plant:d, mood:null };
    /* one offer, forced to carry a mood by walking its id — the same hash the panel reads */
    const o = (d.games.offers||[]).find(x=>x.opp && !x.melee && !x.pair && !x.venatio);
    if(!o) return { plant:d, mood:null };
    let id = o.id, g2 = 0;
    while(g2++ < 20000 && !A.appetiteOf(Object.assign({}, o, { id }))) id++;
    o.id = id;
    d.games.offers = [o];
    d.games.week = d.week;
    return { plant:d, mood: A.appetiteOf(o), name: A.APPETITES[A.appetiteOf(o)].name,
             /* the venue's own line, so the guard below checks the real offer panel rather than a
                list of venue NAMES the panel never prints — it prints the description */
             venueSay: (A.VEN(o.venue).say || "").slice(0, 28) };
  });
  lines.push(`the forged card's mood: ${planted.mood || "NONE — could not force one"}`);
  if(!planted.mood) return { pass:false, why:"could not put a mood on a real card", lines };
  await clearAll(p, 8);
  await tab(p, "arena"); await p.waitForTimeout(340); await clearAll(p, 6);
  await tab(p, "arena"); await p.waitForTimeout(340); await settle(p);
  /* ---- THE OFFER PANEL IS THREE DOORS IN ----
     The wizard is Where → Your man → Ready, and the mood is printed on the last of them, beside the
     venue and the weather. Reading document.body at the arena root found none of the three and read
     as "the mood is not printed", which is a navigation fault and not a rendering one. The first
     row of the bill is also always THE PITS, which is not the forged card. */
  const top = `(()=>{ const ws=[...document.querySelectorAll(".modalwrap")]
    .map(w=>({z:+getComputedStyle(w).zIndex||50,w})).sort((a,b)=>b.z-a.z); return ws[0] && ws[0].w; })()`;
  if(!(await click(p, /choose a bout/i)))
    return { pass:false, why:"the arena would not open the wizard", lines };
  await p.waitForTimeout(700);
  const picked = await p.evaluate(`(()=>{ const w = ${top}; if(!w) return "no wizard";
    const rows=[...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled);
    const o = rows.find(x=>!/the pits/i.test(x.innerText||""));
    if(!o) return "the bill carried only the pits";
    o.click(); return null; })()`);
  if(picked) return { pass:false, why:picked, lines };
  await p.waitForTimeout(700);
  const gotMan = await p.evaluate(`(()=>{ const w = ${top}; if(!w) return false;
    const rows=[...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled);
    if(!rows.length) return false; rows[0].click(); return true; })()`);
  if(!gotMan) return { pass:false, why:"no man to send on the forged card", lines };
  await p.waitForTimeout(500);
  /* choosing a man does not advance the wizard — the step has its own Next, which reads
     "Choose a man" and is disabled until the pick is valid. Matched loosely on purpose: a `\s` in
     a regex written inside a template literal is eaten by the template before the page ever sees
     it, so /next\s*›/ reached the browser as /nexts*›/ and matched nothing. */
  const advanced = await p.evaluate(`(()=>{ const w = ${top}; if(!w) return false;
    const b = [...w.querySelectorAll("button")].find(x=>/next/i.test(x.innerText||"") && !x.disabled);
    if(!b) return false; b.click(); return true; })()`);
  if(!advanced) return { pass:false, why:"the man-picker would not advance to the ready panel", lines };
  await p.waitForTimeout(800);
  /* `.tag` is text-transform:uppercase and `innerText` reflects that, so the mood's name comes back
     shouted — comparing it raw read as "the mood is not printed" while it was on the screen. */
  const shown = await p.evaluate(`(()=>{ const w = ${top};
    const t = ((w ? w.innerText : document.body.innerText) || "").toUpperCase();
    return { has: t.indexOf(${JSON.stringify(planted.name.toUpperCase())}) >= 0,
             pct: t.indexOf("% OF THE PURSE") >= 0, warn: t.indexOf("THE TOWN COOLS ON THE HOUSE") >= 0,
             venue: t.indexOf(${JSON.stringify(planted.venueSay.toUpperCase())}) >= 0 }; })()`);
  lines.push(`on the ready panel: the venue line ${shown.venue} · the mood named ${shown.has} · what it pays ${shown.pct} · what flouting costs ${shown.warn}`);
  if(!shown.venue) fails.push("this is not the offer panel at all — the venue's own line is not on it either, so the walk above is wrong and the three assertions below prove nothing");
  if(!shown.has) fails.push(`the card's mood ("${planted.name}") is not printed on the offer — a demand you cannot see before you fight is not a demand`);
  if(!shown.pct) fails.push("the offer does not say what meeting the mood is worth");
  if(!shown.warn) fails.push("the offer does not say what flouting it costs, and it costs acclaim");

  await waitSaved(p);
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
