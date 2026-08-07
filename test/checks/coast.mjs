/* A tour down the coast was three single combats, and then three more single
   combats, for as many weeks as you stayed. makeCityGames built nothing else —
   no pair, no melee, no hunt, no flooded sand — while the Capuan bill ran 57%
   single and the rest spread across the other three engines. Going away made
   the game smaller rather than different, and a campaign spends a great many
   weeks away.

   The card is built from slots now, and each town fills some of them with a bout
   of its own: Pompeii, which pays for blood, holds a scrum in the old stone bowl;
   Neapolis, which can tell a feint from a flinch, wants two of yours working as
   one; Puteoli is a port, so the animals come off the ships, and for a house it
   has heard of the harbour goes onto the sand.

   THE SECOND HALF OF THIS CHECK IS THE PART THAT NEARLY SHIPPED BROKEN. Local
   standing, the magistrate's favour and the home house's temper all lived inline
   in doFight, so a melee or a hunt fought at Pompeii would have earned the house
   nothing whatsoever in Pompeii — the entire point of having gone. Worse, that
   block sat inside `if(win)`: a house could be beaten the length of the bay
   without a single town noticing it had been there. The give-away had been in
   plain sight for as long as cityServed existed — its craft branch tests for a
   LOSS and returns −1, a line that could never once have run.

   So this asks two things of the coast. That the card down there is a mix. And
   that whatever engine ran the afternoon, and however it went, the town saw it. */

import { hasHandle } from "../harness.mjs";

export const name = "coast";
export const describe = "a tour is a different card, and the town sees what it saw";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const KEYS = Object.keys(A.CITIES);

    const house = (key, known, seed)=>{
      const d = A.newGameState("Tour","clean","COAST"+key+known+"#"+seed,null);
      d.fame = 300; d.gold = 6000;
      while(A.activeG(d).length < 5){
        const m = A.genOpponent(1, 62); m.id = d.nextId++; m.status = "active"; m.mine = true;
        m.name = "Man"+m.id; m.kit = A.defaultKit(m.cls);
        d.gladiators.push(m);
      }
      d.city = key; d.known = { [key]: known };
      return d;
    };

    /* ---- 1. what each town puts on ---- */
    const towns = {};
    for(const key of KEYS){
      const t = { single:0, pair:0, melee:0, naum:0, hunt:0, offers:0, cards:0, empty:0 };
      for(let i=0;i<260;i++){
        const d = house(key, i%2 ? 20 : 70, i);
        A.makeCityGames(d);
        if(!d.games){ t.empty++; continue; }
        t.cards++;
        for(const o of d.games.offers){
          t.offers++;
          if(o.venatio) t.hunt++;
          else if(o.melee) o.spectacle==="naumachia" ? t.naum++ : t.melee++;
          else if(o.pair) t.pair++;
          else t.single++;
        }
      }
      towns[key] = t;
    }

    /* ---- 2. and whether the town sees the afternoon, whatever shape it was ---- */
    const seen = [], threw = [];
    const finish = (d, o, ids, kind)=>{
      let r = kind==="melee" ? A.doMelee(d, ids, o, null, null, "measured")
            : kind==="pair"  ? A.doPairFight(d, ids, o, "measured", null, null)
            : kind==="hunt"  ? A.doVenatio(d, ids[0], o, "measured", null, null)
            :                  A.doFight(d, ids[0], o, "measured", null, null, null, "none");
      /* every engine stops at a crux the first time and asks for a word from the
         box. The app hands the beats back on the pending; so does this. */
      let guard = 0;
      while(r && r.pending && guard++ < 5){
        const pd = r.pending; pd.beats = r.beats;
        r = kind==="melee" ? A.doMelee(d, ids, o, pd, "hold", "measured")
          : kind==="pair"  ? A.doPairFight(d, ids, o, "measured", pd, "hold")
          : kind==="hunt"  ? A.doVenatio(d, ids[0], o, "measured", pd, "hold")
          :                  A.doFight(d, ids[0], o, "measured", null, pd, "hold");
      }
      return r;
    };

    for(const [kind, want] of [["melee",o=>o.melee && o.spectacle!=="naumachia"],
                               ["naum", o=>o.melee && o.spectacle==="naumachia"],
                               ["pair", o=>o.pair], ["hunt", o=>o.venatio],
                               ["single", o=>!o.pair && !o.melee && !o.venatio]]){
      let n = 0, moved = 0, favMoved = 0, gained = 0, wins = 0;
      for(const key of KEYS){
        for(let i=0;i<70 && n<70;i++){
          const d = house(key, 55, 5000+i);
          A.makeCityGames(d);
          const o = d.games && d.games.offers.find(want);
          if(!o) continue;
          const men = A.activeG(d);
          const ids = (o.melee ? men.slice(0,3) : o.pair ? men.slice(0,2) : men.slice(0,1)).map(g=>g.id);
          const k0 = A.knownIn(d, key), f0 = A.bayPol(d, key).favor;
          let r; try { r = finish(d, o, ids, o.melee ? "melee" : o.pair ? "pair" : o.venatio ? "hunt" : "single"); }
          catch(e){ threw.push(`${kind} at ${key}: ${e.message.split("\n")[0]}`); continue; }
          if(r && r.pending) continue;                    /* never resolved; not this check's business */
          n++;
          const dk = A.knownIn(d, key) - k0;
          gained += dk; if(dk > 0) moved++;
          if(A.bayPol(d, key).favor !== f0) favMoved++;
          if(r && (r.win || r.won)) wins++;
        }
      }
      seen.push({ kind, n, moved, favMoved, gained: n ? +(gained/n).toFixed(1) : 0 });
    }

    /* ---- 3. a loss away used to be invisible ---- */
    let lost = 0, lostSeen = 0;
    for(let i=0;i<160;i++){
      const d = house("neapolis", 40, 9000+i);
      A.makeCityGames(d);
      const o = d.games && d.games.offers.find(x=>!x.pair && !x.melee && !x.venatio);
      if(!o) continue;
      /* a plainly outmatched man, so most of these are defeats */
      const g = A.activeG(d)[0];
      for(const k of ["str","agi","end","tec","sho","dis"]) g[k] = 24;
      const k0 = A.knownIn(d,"neapolis");
      let r; try { r = finish(d, o, [g.id], "single"); } catch(e){ continue; }
      if(!r || r.pending) continue;
      if(r.win) continue;
      lost++; if(A.knownIn(d,"neapolis") > k0) lostSeen++;
    }

    return { towns, seen, threw: threw.slice(0,4), lost, lostSeen,
      /* the line that could never have run */
      craftLoss: A.cityServed({}, "neapolis", { stakes:"standard" },
        { won:false, theirDead:false, spared:false, vigour:90, crowd:60 }) };
  });

  const lines = [], fails = [...out.threw];
  const T = out.towns;
  lines.push(`the card, town by town (260 weeks each, half of them well known):`);
  for(const [k,t] of Object.entries(T)){
    const pc = n => (n/Math.max(1,t.offers)*100).toFixed(0).padStart(3)+"%";
    lines.push(`   ${k.padEnd(9)} ${String(t.offers).padStart(4)} bouts — single ${pc(t.single)}  pair ${pc(t.pair)}  ` +
      `melee ${pc(t.melee)}  naumachia ${pc(t.naum)}  hunt ${pc(t.hunt)}`);
  }
  const all = Object.values(T).reduce((a,t)=>{ for(const k of Object.keys(t)) a[k]=(a[k]||0)+t[k]; return a; }, {});
  lines.push(`   the whole coast: ${(all.single/all.offers*100).toFixed(1)}% single combats ` +
    `(the Capuan bill runs about 57)`);
  lines.push(`what the town saw, by the engine that ran it:`);
  for(const s of out.seen)
    lines.push(`   ${s.kind.padEnd(7)} ${String(s.n).padStart(3)} fought — local standing moved on ${s.moved}, ` +
      `the magistrate on ${s.favMoved}, ${s.gained} standing a time`);
  lines.push(`${out.lostSeen} of ${out.lost} defeats away still put the house's name about — it used to be none of them`);

  /* ---- the card is a mix ---- */
  if(!all.offers) fails.push("no away card was built at all");
  else {
    const single = all.single/all.offers*100;
    if(single > 75) fails.push(`${single.toFixed(1)}% of a tour is still single combats — the coast has not been opened up`);
    if(single < 35) fails.push(`only ${single.toFixed(1)}% of a tour is a single combat — the towns have taken the card over`);
  }
  /* every town needs a bout of its own, and they must not all have the same one */
  const sig = {};
  for(const [k,t] of Object.entries(T)){
    const own = t.pair + t.melee + t.naum + t.hunt;
    if(!own) fails.push(`${k} puts on nothing Capua would not — the town has no character`);
    sig[k] = [["pair",t.pair],["melee",t.melee],["naumachia",t.naum],["hunt",t.hunt]]
      .sort((a,b)=>b[1]-a[1])[0][0];
    if(t.cards && !t.offers) fails.push(`${k} built cards with no bouts on them`);
  }
  if(new Set(Object.values(sig)).size < Object.keys(T).length)
    fails.push(`the towns share a signature bout (${Object.entries(sig).map(([k,v])=>`${k}:${v}`).join(", ")}) — that is one town three times`);

  /* ---- and the town sees it, whatever ran ---- */
  for(const s of out.seen){
    if(!s.n){ fails.push(`not one ${s.kind} bout away could be resolved to the end`); continue; }
    if(s.moved < s.n) fails.push(`${s.n - s.moved} of ${s.n} ${s.kind} bouts away moved no local standing — the town did not notice you were there`);
    if(!s.favMoved) fails.push(`no ${s.kind} bout away moved the magistrate at all`);
  }
  if(out.lost && out.lostSeen < out.lost)
    fails.push(`${out.lost - out.lostSeen} of ${out.lost} defeats away were invisible to the town`);
  if(out.craftLoss !== -1)
    fails.push(`a Greek town shrugs at a defeat (cityServed gave ${out.craftLoss}, not -1) — losing at Neapolis is meant to cost you`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
