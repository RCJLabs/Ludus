/* THE CARD HOLDS FOUR ENGINES, AND THE YEAR TURNS THEM OVER

   Audit item #228: "Two of the four fight engines carry 1.2% of play. Of 1,849 rope bouts: 1,658
   single (89.7%), 168 pair (9.1%), 13 melee (0.7%), 10 venatio (0.5%). The melee engine and the
   hunt are the game's most expensive, least-met content. Recommend the calendar force variety:
   festival cards that ARE melees and hunts, so the year's shape rotates the engines."

   THE NUMBERS ARE THE ROPE, AND THIS FILE SAID SO BEFORE THE ITEM WAS WRITTEN. `takeBout` filters
   the bill and takes `pool[0]`, and `makeGames` pushes every single before it adds a pair, a melee
   or a hunt. #202 wrote it down for the pair — "the reference player's pair count over a played
   house is a fact about ARRAY ORDER, not about the game" — and the sentence covers the other two
   engines unchanged. The item marks its own zero **(rope)**.

   THE BILL WAS ALREADY VARIED. Measured over 669 cards (`probes/bill.mjs`), before this release:

     offered      single 69.9%  ·  venatio 13.1%  ·  pair 8.4%  ·  melee 7.5%  ·  naumachia 1.1%
     cards with one   single 100%  ·  VENATIO 52.5%  ·  pair 33.6%  ·  MELEE 29.1%
     what pool[0] took   single 98.4%  ·  melee 0.8%  ·  venatio 0.5%  ·  pair 0.2%

   A hunt was on the card on more than half of all cards and the reference player fought one on a
   bout in two hundred. That gap is the whole of the item.

   AND BOTH ENGINES HOLD UP WHEN SOMEBODY FINALLY USES THEM: 159 melees and 391 hunts driven through
   the real doors on played houses, 0 threw. `checks/engines.mjs` already holds all four at n=3000,
   and holds them on HAND-BUILT men; this is the first time either has run inside a house.

   WHAT WAS GENUINELY MISSING IS THE ITEM'S OWN RECOMMENDATION. `forceHunt` and `forceNaum` existed
   and NOTHING IN THE CALENDAR SET EITHER — only the player's own munus could. Six festivals came
   and went and the bill's shape never turned on which one it was. Each of the four that hold games
   now carries the engine its day is for, and the year has a shape:

     the Quinquatria   melee on 31% of its cards -> 68%     Minerva's schools, arms on show
     the Floralia      hunt  on 61% -> 97%                  a mob that wants a spectacle, not a funeral
     the Apollinares   hunt  on 57% -> 97%                  Apollo's summer games
     the Ludi Romani   melee on 29% -> 69%                  everything at once, for Jupiter

   FIVE ARMS:
   1 · THE CARD HOLDS ALL FOUR, on a real share of cards and not as a rounding error.
   2 · AND THE YEAR TURNS THEM OVER — each forcing festival puts its engine up far more often than
       an ordinary week does.
   3 · THE SHARE THE REFERENCE PLAYER FIGHTS IS ARRAY ORDER — a picker that asks for a melee or a
       hunt gets one through the same door, which is what makes #228's figure a fact about
       `pool[0]` rather than about the game.
   4 · AND BOTH ENGINES RUN AT VOLUME without throwing.
   5 · ON A REAL BILL, or every arm above passed on an empty card. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "bill";
export const describe = "the card holds four engines, and the year turns them over";
export const slow = true;   /* plays houses and drives the two big engines */

const MELEE_FLOOR = 0.15;   /* measured on 40.2% of cards; under 15% it is a rounding error again */
const HUNT_FLOOR  = 0.30;   /* measured 56.7% */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"BILL-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","CALENDAR","activeG"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const kindOf = o => o.melee ? (o.spectacle === "naumachia" ? "naumachia" : "melee")
      : o.venatio ? "venatio" : o.pair ? "pair" : "single";

    /* 1, 2 and 3 — the bill, the year, and what `pool[0]` takes off it */
    const offered = {}, took = {}, cardHas = {}, byFest = {};
    let cards = 0, weeks = 0;
    for(let h=0; h<5; h++){
      const d = A.newGameState("Bill", "clean", "BILL-R"+h, null);
      for(let w=0; w<300; w++){
        if(d.over) break;
        const bill = (d.games && d.games.offers) || [];
        if(bill.length){
          cards++;
          const seen = new Set();
          for(const o of bill){ const k = kindOf(o); offered[k] = (offered[k]||0)+1; seen.add(k); }
          for(const k of seen) cardHas[k] = (cardHas[k]||0)+1;
          const fk = (d.games && d.games.fest) || "—";
          const f = byFest[fk] = byFest[fk] || { cards:0 };
          f.cards++; for(const k of seen) f[k] = (f[k]||0)+1;
        }
        let t; try { t = R.takeBout(d, {}); } catch(e){ t = null; }
        if(t && t.ran !== false && t.offer){ const k = kindOf(t.offer); took[k] = (took[k]||0)+1; }
        try { R.lanista(d); } catch(e){ break; }
        weeks++;
      }
    }

    /* 3b and 4 — the same door, asked for the other engines */
    const vol = {};
    for(const want of ["melee","venatio"]){
      const v = vol[want] = { asked:0, ran:0, threw:0, rounds:[] };
      /* ---- PREFER THE ENGINE, DO NOT LIVE ON IT ----
         The first cut passed a pick that returned NULL when the card held no hunt, so the house
         fought nothing on those weeks — and a house that only ever sends a man at a beast is
         insolvent by about week nineteen. It read 6 hunts in 56 asks against the probe's 302 in
         1,353, and the arm reported the engine untested when what had died was the fixture. A pick
         that takes the wanted engine when it is there and the ordinary bout when it is not is both
         survivable and what a `melee:`/`hunt:` policy would actually be — it is `pairPick`'s shape,
         which #202 already settled. */
      for(let h=0; h<6; h++){
        const d = A.newGameState("Bill", "clean", "BV-"+want+"-"+h, null);
        for(let w=0; w<12; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
        for(let i=0; i<300 && v.ran < 90; i++){
          if(d.over) break;
          v.asked++;
          let t = null;
          try { t = R.takeBout(d, { pick: pool => pool.find(x=>kindOf(x) === want) || pool[0] }); }
          catch(e){ v.threw++; }
          if(t && t.ran !== false && t.offer && kindOf(t.offer) === want){
            v.ran++;
            const res = t.res || {};
            if(Array.isArray(res.beats)) v.rounds.push(res.beats.length);
          }
          try { R.lanista(d); } catch(e){ break; }
        }
      }
    }

    const forcing = A.CALENDAR.filter(f=>f.forceHunt || f.forceMelee || f.forceNaum)
      .map(f=>({ key:f.key, name:f.name,
        want: f.forceMelee ? "melee" : f.forceHunt ? "venatio" : "naumachia" }));
    const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
      return { n:s.length, min:s[0], p50:s[Math.floor(s.length/2)], max:s[s.length-1] }; };
    return { weeks, cards, offered, took, cardHas, byFest, forcing,
      vol: Object.fromEntries(Object.entries(vol).map(([k,v])=>[k,
        { asked:v.asked, ran:v.ran, threw:v.threw, rounds:q(v.rounds) }])) };
  });

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  if(!r.cards) return { pass:false, why:`no card was drawn in ${r.weeks} weeks — nothing was measured`, lines };

  const share = k => (r.cardHas[k]||0) / r.cards;
  const totTook = Object.values(r.took).reduce((n,v)=>n+v,0) || 1;
  lines.push(`${r.cards} cards over ${r.weeks} weeks · a card holds `
    + ["single","pair","melee","venatio","naumachia"].map(k=>`${k} ${(share(k)*100).toFixed(1)}%`).join(" · "));
  lines.push(`  what \`pool[0]\` takes off them: `
    + Object.entries(r.took).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${(v/totTook*100).toFixed(1)}%`).join(" · "));
  for(const f of r.forcing){
    const b = r.byFest[f.key];
    const other = Object.entries(r.byFest).filter(([k])=>k !== f.key && k !== "—")
      .reduce((acc,[,v])=>({ n:acc.n+(v.cards||0), k:acc.k+(v[f.want]||0) }), { n:0, k:0 });
    lines.push(`  ${f.name.padEnd(22)} ${f.want} on ${b ? ((b[f.want]||0)/b.cards*100).toFixed(0) : "—"}% of its cards`
      + ` · ${other.n ? (other.k/other.n*100).toFixed(0) : "—"}% on everyone else's`);
  }
  lines.push(`  asked for one through the same door: `
    + Object.entries(r.vol).map(([k,v])=>`${k} ran ${v.ran} of ${v.asked} asks, threw ${v.threw}, rounds ${v.rounds?v.rounds.p50:"—"}`).join(" · "));

  /* 1 — the card holds all four */
  if(share("melee") < MELEE_FLOOR)
    bad.push(`a melee is on ${(share("melee")*100).toFixed(1)}% of cards — it was 29.1% when #228 called `
      + `the engine the game's "least-met content", and the bill was never the reason`);
  if(share("venatio") < HUNT_FLOOR)
    bad.push(`a hunt is on ${(share("venatio")*100).toFixed(1)}% of cards — it was 52.5% before this `
      + `release, so more than half of all cards carried one while the rope fought 0.5%`);
  if(!r.cardHas.pair) bad.push(`no card in ${r.cards} carried a pair`);
  /* 2 — and the year turns them over */
  if(!r.forcing.length)
    bad.push(`no festival in the calendar forces an engine — \`forceHunt\` and \`forceNaum\` existed and `
      + `nothing set them, so six festivals came and went and the bill's shape never turned on which `
      + `one it was, which is #228's recommendation verbatim`);
  for(const f of r.forcing){
    const b = r.byFest[f.key];
    if(!b || !b.cards){ bad.push(`${f.name} never came up, so its forcing was not measured`); continue; }
    const mine = (b[f.want]||0)/b.cards;
    const other = Object.entries(r.byFest).filter(([k])=>k !== f.key && k !== "—")
      .reduce((acc,[,v])=>({ n:acc.n+(v.cards||0), k:acc.k+(v[f.want]||0) }), { n:0, k:0 });
    const rest = other.n ? other.k/other.n : 0;
    if(mine < 0.55)
      bad.push(`${f.name} forces a ${f.want} and carries one on only ${(mine*100).toFixed(0)}% of its cards`);
    else if(mine <= rest)
      bad.push(`${f.name} forces a ${f.want} and puts one up no more often than an ordinary week `
        + `(${(mine*100).toFixed(0)}% against ${(rest*100).toFixed(0)}%) — the year does not turn`);
  }
  /* 3 — the rope's share is array order */
  const tookHunt = (r.took.venatio||0)/totTook, tookMelee = (r.took.melee||0)/totTook;
  if(tookHunt > share("venatio") || tookMelee > share("melee"))
    lines.push(`  (the reference player is taking more of an engine than the card holds, which cannot happen)`);
  for(const [want, v] of Object.entries(r.vol)){
    if(!v.ran)
      bad.push(`asking the same door for a ${want} got none in ${v.asked} tries — if the engine cannot be `
        + `reached through \`takeBout\` then #228's share is not array order after all, and the item is right`);
    else if(v.threw)
      bad.push(`the ${want} engine threw on ${v.threw} of ${v.asked} asks through the real doors`);
  }
  /* 4 — and at volume */
  for(const [want, v] of Object.entries(r.vol))
    if(v.ran && v.ran < 20)
      bad.push(`only ${v.ran} ${want} bouts ran, which is too few to say the engine holds up at volume`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`four engines on the bill, a year that turns them over, and both big ones run`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
