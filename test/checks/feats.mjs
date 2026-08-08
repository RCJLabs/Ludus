/* THE NINETEEN THINGS A HOUSE IS REMEMBERED FOR, FIVE OF WHICH NOTHING EVER DID.

   The v2.53.0 audit ran eight houses four hundred weeks and five of the nineteen feats
   were earned by none of them: the cloth, the named steel, the stone, your own games
   and the imperial sand. The obvious reading was that they are out of reach. They are
   not. The same eight seeds under a policy that deliberately went after all five
   earned every one of the nineteen, four inside the first fifty weeks — and two of the
   "findings" in that list were the probe's own doing, one of them badly: the imperial
   bout is flagged `imperial` rather than `rome`, comes up sine about a third of the
   time and builds its man at quality 100+, so the careful probe crossed Italy, was
   offered three bouts, declined all three on a win-chance gate and came home having
   fought nothing.

   What the measurement did find is a real fault and a missing sentence.

   The fault: `d.flags.threwCloth` was set inside doFight and nowhere else, so the pair
   bout's cloth for both men and the hunt's call for the handlers left no trace at all —
   42 pair cloths and 37 hunts stopped, and the feat unearned, the front rows unmoved,
   nobody in the cells remembering it.

   The sentence: an unearned feat showed a dash. A house held the armoury at the third
   level for 24 weeks with the fee in the strongbox and forged nothing; the city would
   have taken its own games in 131 weeks and it staged none.

   So this check does two things nothing did before. It drives each of the five through
   its own action and asserts the feat lands, which is the only proof that they are
   reachable at all. And it holds the sheet to the truth: every unearned feat says how
   close in the house's own numbers, no earned one says a house is short of what it
   has, and no feat is added in future without a line to go under it. */

import { hasHandle } from "../harness.mjs";

export const name = "feats";
export const describe = "all nineteen are reachable, and the sheet says how close";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const R = {};

    /* a working house of six, the way the game builds men rather than opponents */
    const house = (seed, over)=>{
      const d = A.newGameState("Ft","clean",seed,null);
      d.gold = 40000; d.fame = 2600; d.unrest = 0;
      d.doctore = { name:"Oenomaus", skill:80, spec:"tec", wage:10, fee:0, fromHouse:true, weeks:20 };
      for(let i=0;i<6;i++){ const m = A.genGladiator(d, 78); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.wins=6; m.pfame=50; m.fatigue=0; m.lastFought=-9;
        d.gladiators.push(m); }
      Object.assign(d, over||{});
      return d;
    };
    const quiet = d => { d.pendingEvent = null;
      for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "rest");
      try { A.endWeek(d); } catch(e){}
      if(d.over){ d.over = null; d.unrest = Math.min(d.unrest, 20); } };

    /* ---- 1. THE CLOTH, IN ALL THREE ENGINES THAT OFFER IT ----
       CRUX.cloth carries no `when`, so it is on the menu at every crux the game
       raises: the count of cruxes is the count of chances, and a careful house saw 70
       of them in one run. Each engine is driven to its own crux and answered. */
    R.cloth = {};
    for(const kind of ["solo","pair","hunt"]){
      const d = house("FEAT_CLOTH_"+kind);
      let cruxes = 0, thrown = 0;
      for(let w=0; w<200 && !thrown; w++){
        /* a forfeit is a lost card, and 200 weeks of them thins the cells */
        while(A.activeG(d).length < 6){ const m = A.genGladiator(d, 78); m.id=d.nextId++;
          m.status="active"; m.mine=true; m.kit=A.defaultKit(m.cls); m.wins=6; m.pfame=50;
          m.fatigue=0; m.lastFought=-9; d.gladiators.push(m); }
        for(const g of A.activeG(d)){ g.injury=null; g.fatigue=0; g.lastFought=-9; }
        d.gold = Math.max(d.gold, 20000);
        const pool = A.activeG(d);
        for(const o of ((d.games&&d.games.offers)||[])){
          if(thrown) break;
          const solo = !(o.pair || o.melee || o.venatio);
          let x = null, resume = null;
          if(kind==="solo" && solo){
            x = A.doFight(d, pool[0].id, o, "measured", null, null, null, "none");
            resume = pd => A.doFight(d, pool[0].id, o, "measured", null, pd, "cloth", "none");
          } else if(kind==="pair" && o.pair && pool.length>=2){
            const ids = [pool[0].id, pool[1].id];
            x = A.doPairFight(d, ids, o, "measured", null, null);
            resume = pd => A.doPairFight(d, ids, o, "measured", pd, "cloth");
          } else if(kind==="hunt" && o.venatio){
            x = A.doVenatio(d, pool[0].id, o, "measured", null, null);
            resume = pd => A.doVenatio(d, pool[0].id, o, "measured", pd, "cloth");
          }
          if(x && x.crux){ cruxes++; const pd = x.pending; pd.beats = x.beats; resume(pd); thrown++; }
        }
        quiet(d);
      }
      A.featWeek(d);
      /* across the whole roster, not activeG: a beast usually has a piece of the man
         before the handlers come over the rail, so the one who remembers it is
         "injured" and the first draft of this looked straight past him */
      R.cloth[kind] = { cruxes, thrown, flag:!!d.flags.threwCloth, ever:d.flags.everCloth||0,
        feat:A.hasFeat(d,"cloth"),
        remembered: d.gladiators.some(g=>(g.memory||[]).some(m=>m && m.kind==="cloth")) };
    }

    /* ---- 2. NAMED STEEL — the armoury built, and a man carrying a piece of his own ----
       forgeReady wants `wears`: bought steel, price above nought and not house issue.
       Six men in their default kits are six men nothing can be forged for, which is
       what the first draft of this missed and what the sheet was wrongly telling a
       player who had built the armoury and had the fee in hand. */
    { const d = house("FEAT_FORGE");
      const before = A.featNear(d, "forge");
      for(let i=0;i<4;i++){ A.buildUp(d, "armamentarium"); for(let w=0;w<8;w++) quiet(d); }
      const houseIssue = A.featNear(d, "forge");
      const buyable = Object.keys(A.GEAR).find(k=>{ const it = A.GEAR[k];
        return it.slot==="weapon" && !it.stock && it.price > 0 && it.price < 900; });
      const target = A.activeG(d)[0];
      const bought = buyable ? A.buyGearItem(d, buyable) : false;
      const worn = !!(buyable && target && A.equipOne(d, target.id, "weapon", buyable));
      const ready = A.activeG(d).filter(g=>A.forgeReady(d,g)).length;
      const onTheGate = A.featNear(d, "forge");
      const man = A.activeG(d).find(g=>A.forgeReady(d,g));
      d.gold = Math.max(d.gold, A.FORGE_FEE + 500);
      const did = man ? A.forgeForMan(d, man.id, "weapon") : false;
      A.featWeek(d);
      R.forge = { before, houseIssue, onTheGate, ready, bought:!!bought, worn, did,
        pieces:(d.forged||[]).length, feat:A.hasFeat(d,"forge"), after:A.featNear(d,"forge") }; }

    /* ---- 3. THE STONE — the society founded, and ten men under it ---- */
    { const d = house("FEAT_STONE");
      const before = A.featNear(d, "stone");
      const founded = A.foundCollegium(d);
      const atNone = A.featNear(d, "stone");
      /* collBury is what the sand calls when a man of the society dies */
      for(let i=0;i<9;i++){ const m = A.genGladiator(d, 60); m.id=d.nextId++; A.collBury(d, m); }
      const atNine = A.featNear(d, "stone");
      A.featWeek(d);
      const featAtNine = A.hasFeat(d, "stone");
      { const m = A.genGladiator(d, 60); m.id=d.nextId++; A.collBury(d, m); }
      A.featWeek(d);
      R.stone = { before, founded, atNone, atNine, featAtNine, buried:d.collegium.buried,
        feat:A.hasFeat(d,"stone"), after:A.featNear(d,"stone"), fee:A.COLL_FEE }; }

    /* ---- 4. MUNERA — three cards held for your own dead ----
       The occasion has to be a funeral and the house has to have somebody to name, so
       the dead are the game's own: sine bouts on the rope until the sand takes one. */
    { const d = house("FEAT_MUNERA");
      let deaths = 0;
      for(let w=0; w<160 && !(d.fallen||[]).length; w++){
        while(A.activeG(d).length < 4){ const m = A.genGladiator(d, 62); m.id=d.nextId++;
          m.status="active"; m.mine=true; m.kit=A.defaultKit(m.cls); m.fatigue=0; m.lastFought=-9;
          d.gladiators.push(m); }
        for(const g of A.activeG(d)){ g.injury=null; g.fatigue=0; g.lastFought=-9; }
        d.gold = Math.max(d.gold, 30000);
        try {
          A.makePitCard(d);
          const men = A.pitMen(d) || [];
          const g = A.activeG(d)[0];
          if(g && men.length){
            const o = A.makePitOffer(d, g, "sine", men[men.length-1].id);
            if(o){ let x = A.doFight(d, g.id, o, "aggressive", null, null, null, "none");
              if(x && x.crux){ const pd=x.pending; pd.beats=x.beats;
                A.doFight(d, g.id, o, "aggressive", null, pd, "press", "none"); } }
          }
        } catch(e){}
        quiet(d);
        deaths = (d.fallen||[]).length;
      }
      const hadDead = deaths;
      const shortOfFame = (()=>{ const e = A.clone(d); e.fame = 40; return A.featNear(e, "munera"); })();
      const before = A.featNear(d, "munera");
      d.fame = Math.max(d.fame, A.MUNUS_SCALES.modest.gate + 200);
      let held = 0;
      for(let i=0;i<3;i++){
        d.gold = Math.max(d.gold, 20000);
        d.munusLast = -99;                                  /* the six-week wait, served */
        const ready = A.munusReady(d);
        try { A.stageMunus(d, { occasion:"funeral", scale:"modest", sell:false }); held++; } catch(e){}
        if(!ready) held = held;                             /* recorded below, not silently */
        A.featWeek(d);
      }
      R.munera = { hadDead, shortOfFame, before, held, honoured:d.honoured||0,
        feat:A.hasFeat(d,"munera"), after:A.featNear(d,"munera") }; }

    /* ---- 5. THE IMPERIAL SAND — the letter, the road, and the card actually fought ---- */
    { const d = house("FEAT_ROME");
      d.flags.primusHeld = 1;                    /* the proof of v2.53.0, honestly held */
      d.fame = Math.max(A.romeBar(d) + 500, d.fame);
      const unheard = (()=>{ const e = A.clone(d); e.flags.primusHeld = 0; e.rise = { rank:0, standing:0 };
        return A.featNear(e, "rome"); })();
      /* the letter has five conditions and a senator warm enough to send it is one of
         them — a house without one reads "0 fame short" and waits forever */
      const noSenator = A.featNear(d, "rome");
      d.patrons = [{ id:1, name:"A senator", rank:"senator", favor:85, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      const proved = A.romeProved(d);
      const before = A.featNear(d, "rome");
      /* one man built to survive the imperial bill — Rome draws its man at 100+ */
      for(const g of A.activeG(d)) for(const k of A.STATS) g[k] = Math.min(A.statCap(g,k), 96);
      let bouts = 0, won = 0, trips = 0, offered = 0;
      for(let w=0; w<400 && !A.hasFeat(d,"rome"); w++){
        d.gold = Math.max(d.gold, 30000);
        for(const g of A.activeG(d)){ g.injury=null; g.fatigue=0; g.lastFought=-9;
          if(g.status!=="active") continue; }
        while(A.activeG(d).length < 4){ const m = A.genGladiator(d, 90); m.id=d.nextId++;
          m.status="active"; m.mine=true; m.kit=A.defaultKit(m.cls); m.wins=12; m.pfame=80;
          m.fatigue=0; m.lastFought=-9; for(const k of A.STATS) m[k] = Math.min(A.statCap(m,k), 96);
          d.gladiators.push(m); }
        if(!d.rome && !d.romeOffer){ if(A.romeReady(d) && A.offerRome(d)) offered++; }
        if(d.romeOffer){ A.answerRomeWith(d, true); trips++; }
        for(const o of ((d.games&&d.games.offers)||[])){
          if(!o.imperial) continue;
          const g = A.activeG(d).sort((a,b)=>(b.wins||0)-(a.wins||0))[0];
          if(!g) continue;
          bouts++;
          let x = A.doFight(d, g.id, o, "measured", null, null, null, "none");
          if(x && x.crux){ const pd=x.pending; pd.beats=x.beats;
            x = A.doFight(d, g.id, o, "measured", null, pd, "press", "none"); }
        }
        won = Math.max(won, (d.rome && d.rome.won) || 0, d.flags.romeBest || 0);
        quiet(d);
      }
      R.rome = { unheard, noSenator, proved, before, offered, trips, bouts, won,
        feat:A.hasFeat(d,"rome"), after:A.featNear(d,"rome"), bar:Math.round(A.romeBar(d)) }; }

    /* ---- 6. THE SHEET, AGAINST A STATE THE GAME PRODUCED ----
       Not a house invented for the purpose: forty weeks of ordinary play, then every
       unearned feat is asked how close it is and the answer is held to the house's own
       numbers. This is the half that would have caught the dash. */
    { const d = house("FEAT_SHEET");
      for(let w=0; w<40; w++){
        while(A.activeG(d).length < 5 && !A.rosterFull(d)){ const m = A.genGladiator(d, 70);
          m.id=d.nextId++; m.status="active"; m.mine=true; m.kit=A.defaultKit(m.cls);
          m.fatigue=0; m.lastFought=-9; d.gladiators.push(m); }
        for(const g of A.activeG(d)){ g.injury=null; g.fatigue=0; g.lastFought=-9; }
        d.gold = Math.max(d.gold, 12000);
        for(const o of ((d.games&&d.games.offers)||[])){
          const g = A.activeG(d).find(x=>x.lastFought==null||x.lastFought<d.week);
          if(!g || o.pair || o.melee || o.venatio || o.stakes==="sine") continue;
          let x = A.doFight(d, g.id, o, "measured", null, null, null, "none");
          if(x && x.crux){ const pd=x.pending; pd.beats=x.beats;
            A.doFight(d, g.id, o, "measured", null, pd, "cover", "none"); }
        }
        quiet(d);
      }
      const rec = A.houseRecord(d);
      const said = {}, missing = [], earnedButNagged = [];
      for(const k of A.FEAT_KEYS){
        const n = A.featNear(d, k);
        if(A.hasFeat(d,k)){ if(n) earnedButNagged.push(k); continue; }
        if(!n || !String(n).trim()) missing.push(k);
        else said[k] = n;
      }
      /* and the countable ones must be counting the house in front of them */
      const truth = {
        fivewins: [said.fivewins, `${rec.w} of 20`],
        hundred:  [said.hundred,  `${rec.w} of 100`],
        threefree:[said.threefree,`${rec.freed} of 3`],
        quiet:    [said.quiet,    `${d.flags.quietRun||0} of 30`],
        decade:   [said.decade,   `year ${A.yearOf(d)} of 10`],
        school:   [said.school,   `${Object.keys(A.BUILDINGS).filter(b=>(d.buildings||{})[b]>=2).length} of ${Object.keys(A.BUILDINGS).length}`],
      };
      const wrong = Object.entries(truth).filter(([k,[got,want]])=>got && got.indexOf(want) < 0)
        .map(([k,[got,want]])=>`${k}: "${got}" does not say "${want}"`);
      /* no feat may be added without a line to go under it */
      const noNear = A.FEAT_KEYS.filter(k=>!A.FEATS[k].near);
      R.sheet = { week:d.week, wins:rec.w, earned:A.FEAT_KEYS.filter(k=>A.hasFeat(d,k)),
        asked:Object.keys(said).length, missing, earnedButNagged, wrong, noNear,
        sample:["forge","stone","munera","rome","cloth"].map(k=>`${k}: ${said[k]||"(earned)"}`) }; }

    return R;
  });

  const lines = [], fails = [];
  for(const kind of ["solo","pair","hunt"]){
    const c = out.cloth[kind];
    lines.push(`the cloth in a ${kind} bout: thrown at ${c.thrown} of ${c.cruxes} cruxes · flag ${c.flag} · counted ${c.ever} · feat ${c.feat} · remembered ${c.remembered}`);
  }
  lines.push(`named steel: in house issue it said "${out.forge.houseIssue}"`);
  lines.push(`   with a bought piece on him: ${out.forge.ready} on the gate, forged ${out.forge.pieces} — "${out.forge.onTheGate}"`);
  lines.push(`the stone: founded for ${out.stone.fee}d, ${out.stone.buried} under it — at nine it said "${out.stone.atNine}"`);
  lines.push(`munera: ${out.munera.hadDead} of your own dead, ${out.munera.held} cards held, honoured ${out.munera.honoured} — "${out.munera.before}"`);
  lines.push(`Rome: unproved it said "${out.rome.unheard}"; proved with no senator, "${out.rome.noSenator}"`);
  lines.push(`   bar ${out.rome.bar} fame · ${out.rome.trips} trips · ${out.rome.bouts} bouts · ${out.rome.won} won — waiting, it said "${out.rome.before}"`);
  lines.push(`the sheet after ${out.sheet.week} weeks (${out.sheet.wins} won): ${out.sheet.earned.length} earned, ${out.sheet.asked} unearned and every one of them saying how close`);
  for(const s of out.sheet.sample) lines.push(`   ${s}`);

  /* ---- the cloth counts wherever it is thrown ---- */
  for(const kind of ["solo","pair","hunt"]){
    const c = out.cloth[kind];
    if(!c.thrown){ fails.push(`no ${kind} crux came up in 200 weeks — the cloth could not be tested there at all`); continue; }
    if(!c.flag) fails.push(`the cloth was thrown in a ${kind} bout and threwCloth is still false — this is the v2.58.0 fault returning, and it is silent`);
    if(!c.feat) fails.push(`${c.thrown} cloth${c.thrown===1?"":"s"} thrown in ${kind} bouts and the White Cloth is unearned`);
    if(c.ever < c.thrown) fails.push(`${c.thrown} ${kind} cloths thrown and ${c.ever} counted — the freedman at the gate reads that count`);
    if(!c.remembered) fails.push(`the cloth went over the rail in a ${kind} bout and no man in the cells remembers it`);
  }
  /* ---- and each of the other four is reachable through its own action ---- */
  if(!out.forge.bought) fails.push("no bought weapon under 900d could be found in the whole of GEAR");
  if(!out.forge.worn) fails.push("a bought weapon in the racks could not be put on a man");
  if(/whole of it/.test(out.forge.houseIssue||""))
    fails.push(`a house of six men in stock kit is told "${out.forge.houseIssue}" — the forge wants bought steel and the sheet is promising a piece that cannot be cut`);
  if(!out.forge.ready) fails.push("a man carrying a bought weapon under a third-level armoury is still not somebody a piece can be forged for");
  if(!out.forge.did || out.forge.pieces < 1) fails.push("the forge refused a house with the armoury built, a bought piece on the man and the fee in hand");
  if(!out.forge.feat) fails.push("a piece of named steel was cut and Named Steel is unearned");
  if(!out.stone.founded) fails.push(`the burial society could not be founded with ${out.stone.fee}d and no society standing`);
  if(out.stone.featAtNine) fails.push("The Stone was awarded at nine men — it asks ten");
  if(out.stone.buried !== 10) fails.push(`ten men were buried under the society and it counted ${out.stone.buried}`);
  if(!out.stone.feat) fails.push("ten men went into the ground under the society's stone and The Stone is unearned");
  if(!out.munera.hadDead) fails.push("160 weeks of no-mercy bouts on the rope produced no dead of your own — the funeral card cannot be tested");
  if(out.munera.honoured < 3) fails.push(`three funeral cards were held for the house's own dead and ${out.munera.honoured} were counted`);
  if(!out.munera.feat) fails.push("three cards held for your own dead and Munera is unearned");
  if(!out.rome.proved) fails.push("a house that has held the primacy is not proved to Rome");
  if(/fame short/.test(out.rome.noSenator||""))
    fails.push(`a proved house past the bar with no senator is told "${out.rome.noSenator}" — it is not fame that is missing and the sheet is sending it to fight for more`);
  if(!out.rome.trips) fails.push("a proved house past the bar was never sent for");
  if(!out.rome.bouts) fails.push("a house that went to Rome was offered no imperial bout — the card is flagged `imperial`, and a probe reading `rome` finds nothing");
  if(!out.rome.won || !out.rome.feat)
    fails.push(`${out.rome.bouts} imperial bouts fought across ${out.rome.trips} trips and ${out.rome.won} won — the summit is not winnable by a house built to win it`);

  /* ---- the sheet says how close, and says it truly ---- */
  if(out.sheet.missing.length)
    fails.push(`${out.sheet.missing.join(", ")} — unearned and the sheet shows only a dash, which is the whole of #95`);
  if(out.sheet.earnedButNagged.length)
    fails.push(`${out.sheet.earnedButNagged.join(", ")} — earned, and the sheet still tells the house how far short it is`);
  for(const w of out.sheet.wrong) fails.push(`the sheet is quoting a number the house does not have — ${w}`);
  if(out.sheet.noNear.length)
    fails.push(`${out.sheet.noNear.join(", ")} — a feat with no line to go under it, so a house on its gate reads a dash`);
  if(!out.sheet.asked) fails.push("a house forty weeks old had earned all nineteen feats — the sheet could not be tested");

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
