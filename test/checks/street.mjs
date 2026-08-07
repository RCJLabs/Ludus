/* Acclaim is what the street makes of you, and it used to stop mattering.

   The ladder topped out at "a name the whole city plays at" and above that the
   number moved nothing: a point of crowd noise and a few denarii of pottery. The
   missio, where it should have counted most, did not read it at all — and the one
   term that could have carried it, standing, is capped at MISSIO_CAP because a
   great house should buy a man a hearing and not immunity. A late house saturates
   that cap on fame and favour alone, so there was nowhere for the street to go.

   The mob in the top tiers is not the editor's box. It has its own small say now,
   outside the cap. This check holds its shape: worth nothing until your name is on
   the walls, worth a real but bounded amount at the top, and worth it even to a
   house whose standing with the good families is already maxed — because that is
   the whole point. */

import { hasHandle } from "../harness.mjs";

export const name = "street";
export const describe = "the street speaks for your men, and only so loudly";

const MIN_GAIN = 8;    // points of missio a full name must buy a flattened man
const MAX_GAIN = 20;   // and never so many that a famous house is immune

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Street","clean","STREET",null);
    d.gold = 200000;
    while(A.activeG(d).length < 3 && !A.rosterFull(d)){
      const m=(d.market||[])[0]; if(!m || !A.buyFromBlock(d, m.id, null)) break; }
    const man = A.activeG(d)[0];
    if(!man) return { fatal:"could not stock a house" };

    const houses = [
      { label:"a new house",             pfame:5,   favor:10,  wins:1,  losses:1 },
      { label:"a made house",            pfame:60,  favor:55,  wins:12, losses:5 },
      { label:"standing already capped", pfame:100, favor:100, wins:30, losses:9 },
    ];
    const steps = [0, 20, 40, 62, 82, 92, 100];
    const rows = [];
    for(const h of houses){
      const A2 = Object.assign({}, man, { pfame:h.pfame, wins:h.wins, losses:h.losses, sho:60, heart:60, mods:{} });
      const line = [];
      for(const acc of steps){
        d.acclaim = acc;
        const ctx = { favor:h.favor, street:A.streetVoice(d), tier:2 };
        /* the case the missio is actually for — a poor account, put down early.
           A man who gave a fair go is spared whatever his master's name is. */
        line.push({ acc, street:+A.streetVoice(d).toFixed(1),
          flat: Math.round(A.missioOdds(A.missioScore(A2, ctx, 44, 22,  7, true))*100),
          fair: Math.round(A.missioOdds(A.missioScore(A2, ctx, 62, 42, 16, true))*100) });
      }
      rows.push({ label:h.label, line });
    }

    /* a man who is not yours gets nothing out of your name */
    /* ---- WHAT THE STREET'S LOVE IS MADE OF ----
       The v2.51 consolidation pass found the ladder's top rung permanent again in
       real play, for two reasons this now guards. The men's term was unbounded, so
       a mature house's best man cleared the whole scale by himself and every other
       bound was decoration. And the primacy term read `d.primus`, which is set
       whoever in Capua holds the title — a house collected fourteen points for a
       title a rival was holding. */
    const targetOf = (over)=>{
      const e = A.newGameState("Tgt","clean","STREET_T",null);
      e.gladiators = [];
      for(const pf of (over.pfames||[])){ const m = A.genOpponent(2, 70); m.id=e.nextId++;
        m.status="active"; m.mine=true; m.pfame=pf; e.gladiators.push(m); }
      e.fame = over.fame||0; e.rep = over.rep || { blood:0, show:0, craft:30, mercy:60 };
      e.freed = Array.from({length:over.legends||0},(_,i)=>({name:"L"+i,week:1,wins:12,cls:"Thraex"}));
      if(over.primusMine) e.primus = { mine:true, gid:e.gladiators[0]&&e.gladiators[0].id, name:"X", since:1, defences:0 };
      if(over.primusTheirs) e.primus = { mine:false, house:"Vettius", fid:1, name:"X", since:1, defences:0 };
      return Math.round(A.acclaimTarget(e));
    };
    /* one enormous man, nothing else going on: the term must not clear the scale */
    const oneGiant = targetOf({ pfames:[400,40,30], fame:12000, legends:20 });
    /* the same house, with and without the primacy in its own cells */
    const withMine   = targetOf({ pfames:[120,80,60], fame:12000, legends:20, primusMine:true });
    const withTheirs = targetOf({ pfames:[120,80,60], fame:12000, legends:20, primusTheirs:true });
    const withNone   = targetOf({ pfames:[120,80,60], fame:12000, legends:20 });

    d.acclaim = 100;
    const notMine = Object.assign({}, man, { pfame:60, wins:12, losses:5, sho:60, heart:60, mods:{} });
    const ctx = { favor:55, street:A.streetVoice(d), tier:2 };
    const foreign = Math.round(A.missioOdds(A.missioScore(notMine, ctx, 44, 22, 7, false))*100);
    d.acclaim = 0;
    const foreignQuiet = Math.round(A.missioOdds(A.missioScore(notMine, ctx, 44, 22, 7, false))*100);

    return { rows, steps, foreign, foreignQuiet,
      tiers: A.ACCLAIM_TIERS.map(t=>({ at:t.at, name:t.name })),
      cap: A.MISSIO_CAP, top: A.ACCLAIM_MISSIO,
      word: [0,20,40,62,82,92,100].map(a=>`${a} ${A.acclaimWord(a)}`),
      oneGiant, withMine, withTheirs, withNone };
  });

  if(out.fatal) return { pass:false, why:out.fatal, lines:[] };

  const lines = [], fails = [];
  lines.push("the chance the thumb goes up for a man put down early, acclaim across the top:");
  lines.push("                              acclaim " + out.steps.map(s=>String(s).padStart(6)).join(" "));
  for(const r of out.rows){
    lines.push(`  ${r.label.padEnd(26)} flat    ${r.line.map(x=>String(x.flat+"%").padStart(6)).join(" ")}`);
    lines.push(`  ${"".padEnd(26)} street  ${r.line.map(x=>String(x.street).padStart(6)).join(" ")}`);
  }
  lines.push(`the ladder tops out at ${out.tiers[out.tiers.length-1].at} — "${out.tiers[out.tiers.length-1].name}"`);
  lines.push(`the editor's box is capped at ${out.cap}; the street is capped at ${out.top} and sits outside it`);

  /* nothing until the walls */
  for(const r of out.rows){
    const quiet = r.line.filter(x => x.acc < 40);
    if(quiet.some(x => x.street !== 0))
      fails.push(`${r.label}: the street already speaks below acclaim 40 — it is supposed to start at the walls`);
    if(new Set(quiet.map(x=>x.flat)).size > 1)
      fails.push(`${r.label}: the odds move below acclaim 40`);
  }

  /* a real gain at the top, for every house — including the one already capped */
  for(const r of out.rows){
    const gain = r.line[r.line.length-1].flat - r.line[0].flat;
    if(gain < MIN_GAIN) fails.push(`${r.label}: a full name is worth only ${gain} points of missio — under ${MIN_GAIN}, acclaim still has nowhere to go`);
    if(gain > MAX_GAIN) fails.push(`${r.label}: a full name is worth ${gain} points — over ${MAX_GAIN}, that is immunity, not a hearing`);
  }

  /* it must be worth something to a house that has maxed the editor's box —
     that case is the entire reason the term exists */
  const capped = out.rows[out.rows.length-1];
  if(capped.line[capped.line.length-1].flat - capped.line[0].flat < MIN_GAIN)
    fails.push("a house whose standing is already at the cap gains nothing from the street");

  /* a man who is not yours does not borrow your name */
  if(out.foreign !== out.foreignQuiet)
    fails.push("your acclaim is speaking for another house's man");

  /* the ladder needs a rung above the one a long campaign reaches */
  if(out.tiers[out.tiers.length-1].at <= 82)
    fails.push("nothing on the ladder above 82 — acclaim tops out where a long campaign lands");
  lines.push(`one 400-renown man and little else targets ${out.oneGiant}; the primacy is worth ` +
    `${out.withMine - out.withNone} held and ${out.withTheirs - out.withNone} when a rival holds it`);
  if(out.oneGiant >= 100)
    fails.push(`a house with one famous man and little else targets acclaim ${out.oneGiant} — the men's term clears the whole scale on its own and every other bound is decoration`);
  if(out.withTheirs !== out.withNone)
    fails.push(`a rival holding the primacy is worth ${out.withTheirs - out.withNone} points of YOUR acclaim — the term is reading d.primus rather than whose it is`);
  if(!(out.withMine > out.withNone))
    fails.push("holding the primacy yourself is worth nothing to the street");

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
