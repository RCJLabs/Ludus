/* THE EXCLUSIVE, SAID AS IT IS PLAYED — #320.

   (`exclusive` was free in both directories; checked before writing.)

   The aedile's exclusive promised "your men appear at no other editor's games in Capua" and the game
   cut every Capua card to its first offer instead, whoever's it was. `pactBlocks`, the precise rule,
   was never called, and could not have worked: no offer carries an editor, so it closed every card
   in Capua (`probes/pact.mjs`: 12 of 187 staying houses' exclusives kept, against 203 of 205 on the
   cut). The owner chose the cut. So this holds the cut, and holds the words to it:

     1  under the exclusive a Capua card keeps exactly its first offer, the one it would have led with
     2  and nothing else cuts it: no pact, a season with one editor, or the house's own munus, which is
        not another editor's games and which the cut used to take down to one bout as well
     3  the pact's words, the chronicle's and the arena's describe the cut, and none promises "no other
        editor's games"; and `pactBlocks` is gone
     4  on screen, the arena says why the week's card holds one bout */
import fs from "node:fs";
import path from "node:path";
import { ROOT, found, clearAll, forge, settle, tab } from "../harness.mjs";

export const name = "exclusive";
export const describe = "the aedile's exclusive cuts a Capua card to his one bout, spares your own games, and says so";

export async function run({ p, errors }){
  const fails = [], lines = [];

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["makeGames","PACTS","takePact","pactOf","EXCL_SAYS","rngGet","rngSet","clone","festivalNow","newGameState"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const d0 = A.newGameState("Ex", "clean", "EXCLUSIVE-1", null);
    d0.week = 8 + 18*3; d0.fame = 420; d0.favor = 50; d0.pendingEvent = null; d0.munusCard = null; d0.pact = null;
    const F = A.festivalNow(d0);
    if(!F || F.rest) return { why:`week ${d0.week} holds no games (${F ? F.key : "nothing"})` };
    const s = A.rngGet();
    const card = (setup) => { const d = A.clone(d0); if(setup) setup(d); A.rngSet(s); A.makeGames(d); A.rngSet(s);
      return { offers:(d.games && d.games.offers) || [], exclusive: !!(d.games && d.games.exclusive), d }; };
    const J = o => JSON.stringify(o);
    const munus = d => { d.munusCard = { name:"The games of the house", tier:0, offers:3, purse:0.6, sine:false, hunt:false, spectacle:null, headliner:null }; };
    const free = card(null);
    const excl = card(d => A.takePact(d, "exclusive"));
    const season = card(d => A.takePact(d, "season"));
    const own = card(munus);
    const ownExcl = card(d => { munus(d); A.takePact(d, "exclusive"); });
    const log = J(excl.d.log || []);
    return { fest:F.key, week:d0.week,
      free:free.offers.length, excl:excl.offers.length, exclFlag:excl.exclusive,
      sameFirst: excl.offers.length === 1 && free.offers.length >= 1 && J(excl.offers[0]) === J(free.offers[0]),
      season:season.offers.length, seasonSame: J(season.offers) === J(free.offers), seasonFlag:season.exclusive,
      own:own.offers.length, ownExcl:ownExcl.offers.length, ownSame: J(ownExcl.offers) === J(own.offers), ownFlag:ownExcl.exclusive,
      blurb:A.PACTS.exclusive.blurb(d0), says:A.EXCL_SAYS, chron:log.includes(A.EXCL_SAYS), blocks: A.pactBlocks !== undefined };
  });
  if(r.why) return { pass:false, why:r.why, lines };

  /* ---- 1 · THE CUT ---- */
  lines.push(`${r.fest}, week ${r.week}: the card with no pact carries ${r.free} offers · under the exclusive ${r.excl}, the same one it led with ${r.sameFirst} · the card marked ${r.exclFlag}`);
  if(r.free < 2) fails.push(`the fixture's card carries ${r.free} offer${r.free===1?"":"s"}, too few to show a cut`);
  if(r.excl !== 1 || !r.sameFirst) fails.push(`under the exclusive the card should keep exactly the offer it led with; it kept ${r.excl}`);
  if(!r.exclFlag) fails.push("the cut card does not say it was cut");

  /* ---- 2 · AND NOTHING ELSE CUTS IT ---- */
  lines.push(`a season with one editor: ${r.season} offers, unchanged ${r.seasonSame}, marked ${r.seasonFlag} · your own munus: ${r.own} offers, under the exclusive ${r.ownExcl}, unchanged ${r.ownSame}, marked ${r.ownFlag}`);
  if(!r.seasonSame || r.seasonFlag) fails.push("a season with one editor cuts the card, and only the exclusive should");
  if(!r.ownSame || r.ownFlag) fails.push(`your own munus was cut under the exclusive (${r.own} to ${r.ownExcl}): it is not another editor's games`);

  /* ---- 3 · THE WORDS ---- */
  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
  const promise = /no other editor's games|nobody else's games/i;
  lines.push(`the pact: "${r.blurb}"`);
  lines.push(`the chronicle and the arena: "${r.says}" (in the chronicle ${r.chron})`);
  if(promise.test(r.blurb) || !/cut to the one bout he puts your house on/.test(r.blurb)) fails.push("the pact's own words do not describe the cut");
  if(promise.test(r.says) || !/cut to his one bout/.test(r.says)) fails.push("the words the chronicle and arena share do not describe the cut");
  if(!r.chron) fails.push("giving your word to the exclusive does not write what it does into the chronicle");
  const stale = (src.match(/["`][^"`\n]*(no other editor's games|nobody else's games)[^"`\n]*["`]/gi) || []);
  if(stale.length) fails.push(`a string still promises the old rule: ${stale[0].slice(0, 90)}`);
  if(r.blocks || /const pactBlocks\s*=/.test(src)) fails.push("`pactBlocks` is still defined");

  /* ---- 4 · ON SCREEN ---- */
  await found(p, { seed:"EXCLUSIVE-UI" });
  await clearAll(p, 8);
  await forge(p, (A) => { const d = A.newGameState("Ex","clean","EXCLUSIVE-UI",null);
    d.week = 8 + 18*3; d.fame = 420; d.favor = 50; d.pendingEvent = null; d.munusCard = null;
    A.takePact(d, "exclusive"); A.makeGames(d);
    return { plant:d }; });
  await clearAll(p, 8);
  await tab(p, "arena"); await settle(p); await clearAll(p, 4);
  const seen = await p.evaluate(()=>{ const t = (document.body.innerText || "").replace(/\s+/g, " ");
    const i = t.search(/Your word is given/i), j = t.search(/The pits are always open/i);
    return { pact: i < 0 ? null : t.slice(i, i + 360), sand: j < 0 ? null : t.slice(j, j + 200) }; });
  lines.push(`on screen: "${(seen.pact||"NO PACT PANEL").slice(0, 200)}…"`);
  lines.push(`   and "${(seen.sand||"NO CARD").slice(0, 160)}…"`);
  if(!seen.pact || !seen.pact.includes(r.says)) fails.push("the arena's pact panel does not say what the exclusive does");
  if(!seen.sand || !/cut to his one bout while your word to the aedile stands/.test(seen.sand)) fails.push("the arena does not say why the week's card holds one bout");

  if(errors && errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
