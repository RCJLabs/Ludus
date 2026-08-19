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

    /* ================= #165: THE SUM, AND THAT THE PANEL RENDERS THE SAME ONE =================
       `acclaimTarget` was six inline terms; the villa panel showed the LEVEL and described the rate
       in prose that named three of them. They are `acclaimTerms` now — a table `acclaimTarget` sums
       and `TheStreet` renders — so the breakdown a player reads and the number the engine walks to
       are one object. What follows holds that they cannot come apart, that every term is reachable
       and bounded, and that the two gates the panel names are asked of the gate rather than typed. */
    const terms = (()=>{
      const bad = [], note = [];
      const states = [
        ["a founding house", q=>{}],
        ["one famous man",   q=>{ const g = A.activeG(q)[0]; if(g) g.pfame = 400; }],
        ["a show ledger",    q=>{ q.rep = { blood:0, show:100, craft:0, mercy:0 }; }],
        ["a great house",    q=>{ A.activeG(q).forEach(g=>{ g.pfame = 200; g.graffiti = { line:"x", week:1 }; });
                                  q.fame = 9000; q.primus = { mine:true, week:1 };
                                  q.freed = [{wins:12},{wins:14},{wins:20},{wins:11}];
                                  q.rep = { blood:20, show:80, craft:0, mercy:0 }; }],
      ];
      const rows = [];
      for(const [nm, fn] of states){
        const q = A.clone(d); q.acclaim = 0; fn(q);
        const T = A.acclaimTerms(q);
        const sum = T.reduce((n,x)=>n+x.v, 0);
        const tgt = A.acclaimTarget(q);
        rows.push({ nm, sum:+sum.toFixed(3), tgt:+tgt.toFixed(3),
          v:T.map(x=>({ k:x.k, v:+x.v.toFixed(1), top:x.top, say:!!x.say, name:!!x.name })) });
        /* the sum is clamped to 100 at the end, so compare against the clamp the function applies */
        if(Math.abs(Math.min(100, Math.max(0, sum)) - tgt) > 0.001)
          bad.push(`at "${nm}" the six terms sum to ${sum.toFixed(2)} and \`acclaimTarget\` answers `
            + `${tgt.toFixed(2)} — they are one table on purpose, and a panel showing a breakdown that `
            + `does not add up to the number beside it is #150's fault on a bigger surface`);
        for(const x of T){
          if(x.v > x.top + 0.001)
            bad.push(`the "${x.name}" term reads ${x.v.toFixed(1)} against its stated ceiling of ${x.top} `
              + `— the panel prints "N of ${x.top}" and a term past its own ceiling makes that a lie`);
          if(!x.name || !x.say)
            bad.push(`a term of \`acclaimTerms\` has no ${x.name?"blurb":"name"} — the panel renders both`);
        }
      }
      /* every term must be individually reachable: something moves each one off nought */
      const big = rows[rows.length-1].v;
      for(const x of big) if(x.v <= 0)
        bad.push(`the "${x.k}" term is still nought for a house with famous men, a show ledger, four `
          + `freed legends, its own primacy, fame 9,000 and men on the walls — a term nothing can move `
          + `is not a term, it is a comment`);
      const ceiling = A.acclaimTerms(d).reduce((n,x)=>n+x.top, 0);
      note.push(`the six terms cap at ${A.acclaimTerms(d).map(x=>`${x.k} ${x.top}`).join(" · ")} = ${ceiling} before the clamp at 100`);
      if(ceiling < 100)
        bad.push(`every term at its ceiling sums to ${ceiling}, so the top of the ladder cannot be `
          + `reached even in principle — "the street's own house" wants 92`);
      /* the two gates the panel names are asked of the gate, not typed into it */
      const mg = A.merchGate(), sg = A.streetGate();
      note.push(`the panel asks the gates where they are: the potters at ${mg}, the top tiers' voice from ${sg}`);
      if(A.merchLive({ acclaim:mg - 1 }) || !A.merchLive({ acclaim:mg }))
        bad.push(`\`merchGate\` says the potters open at ${mg} and \`merchLive\` disagrees either side of it`);
      if(A.streetVoice({ acclaim:sg - 1 }) > 0 || !(A.streetVoice({ acclaim:sg }) > 0))
        bad.push(`\`streetGate\` says the street finds its voice at ${sg} and \`streetVoice\` disagrees either side of it`);
      return { bad, note, rows };
    })();

    /* ================= #165: THE SIX ON THE ITEM'S LIST THAT ARE NOT ACCLAIM ================= */
    const dark = (()=>{
      const bad = [], note = [];
      { const q = A.clone(d); const g = A.activeG(q)[0];
        delete g.fans;
        if(A.fansOf(g) !== 0) bad.push(`\`fansOf\` answers ${A.fansOf(g)} for a man with no \`fans\` at all`);
        g.fans = 140;
        if(A.fansOf(g) !== 100) bad.push(`\`fansOf\` does not clamp: 140 reads ${A.fansOf(g)}`);
        g.fans = 54; const below = A.isFavourite(g), pBelow = A.fanPurse(g);
        g.fans = 55; const at = A.isFavourite(g), pAt = A.fanPurse(g);
        if(below || !at) bad.push(`\`isFavourite\` reads ${below} at 54 fans and ${at} at 55`);
        if(!(pAt > pBelow)) bad.push(`\`fanPurse\` pays the same for 54 fans and 55`);
        note.push(`fans: a favourite from 55, and the seats pay x${pAt.toFixed(2)} at 55 against x${A.fanPurse({fans:100}).toFixed(2)} at 100`); }
      { const q = A.clone(d);
        q.fame = A.PIETY_TOP * 4;
        if(A.pietyFame(q) !== A.PIETY_TOP)
          bad.push(`\`pietyFame\` reads ${A.pietyFame(q)} at fame ${q.fame} against a PIETY_TOP of ${A.PIETY_TOP}`);
        const dear = A.GODS.mars.cost(q);
        q.fame = 0; const cheap = A.GODS.mars.cost(q);
        note.push(`the altar: Mars asks ${cheap}d of a nobody and ${dear}d of a great house, capped at fame ${A.PIETY_TOP}`);
        if(!(dear > cheap)) bad.push(`the altar charges a great house ${dear}d and a nobody ${cheap}d`); }
      { const q = A.clone(d); q.week = 100;
        q.fallen = [{week:99},{week:81},{week:80},{week:79}];
        const n = A.buried20(q);
        note.push(`buried20 counts ${n} of 4 — the twentieth week back is inside, the twenty-first is not`);
        if(n !== 3) bad.push(`\`buried20\` counts ${n} of four burials at weeks 99, 81, 80 and 79 in week 100 — `
          + `the vow's own screen quotes this number at the player before he stakes coin on it`); }
      { const q = A.clone(d);
        if(A.monuReady(q)) bad.push("`monuReady` is true for a house that has finished no works");
        for(const k of A.WORK_KEYS) (q.works = q.works || {})[k] = { left:0, week:1 };
        if(!A.monuReady(q)) bad.push(`\`monuReady\` is still false with all ${A.WORK_KEYS.length} works finished`);
        note.push(`the monuments open once all ${A.WORK_KEYS.length} works are done, and the pool goes ${A.WORK_KEYS.length} to ${A.ALL_WORK_KEYS.length}`); }
      { const q = A.clone(d); q.acclaim = 0; q.brand = { licensed:false, decided:false, tier:0, earned:0 };
        if(A.openLicenceNow(q)) bad.push("`openLicenceNow` opened for a house nobody has heard of");
        q.acclaim = 70;
        if(!A.openLicenceNow(q)) bad.push("`openLicenceNow` will not raise the licence for a house at acclaim 70");
        else if(!q.pendingEvent || q.pendingEvent.id !== "licence")
          bad.push(`\`openLicenceNow\` returned true and raised ${q.pendingEvent ? q.pendingEvent.id : "nothing"}`);
        q.brand.decided = true;
        if(A.openLicenceNow(q)) bad.push("`openLicenceNow` offers the decision a second time after it is decided");
        note.push("the licence is offered once, at the potters' rung, and never again"); }
      { const q = A.clone(d); q.acclaim = 0;
        if(A.tourneyReady(q) && A.activeG(q).length < 4)
          bad.push("`tourneyReady` is true for a house with too few men to hold one");
        q.fame = 3000; q.gold = 60000; q.week = 120;
        while(A.activeG(q).length < 6) q.gladiators.push(A.genGladiator(q, 70));
        if(!A.tourneyReady(q)) bad.push("`tourneyReady` is false for a great house with six fit men and no cooldown");
        const before = A.activeG(q).map(g=>({ id:g.id, pf:g.pfame||0, fans:g.fans||0 }));
        const un0 = q.unrest;
        const res = A.holdTourney(q);
        if(!res || !res.win) bad.push("`holdTourney` crowned nobody in a yard of six");
        else {
          const w = A.activeG(q).find(g=>g.name === res.win);
          const was = w && before.find(x=>x.id === w.id);
          if(!w || !was) bad.push(`\`holdTourney\` named ${res.win} and he is not in the yard`);
          else if(!((w.pfame||0) > was.pf && (w.fans||0) > was.fans))
            bad.push(`\`holdTourney\` crowned ${res.win} and his renown went ${was.pf}→${w.pfame||0} and his `
              + `fans ${was.fans}→${w.fans||0} — an afternoon nobody gains anything from is not a reward`);
          if(!(q.unrest < un0)) bad.push(`the yard fought each other for an afternoon and unrest went ${un0}→${q.unrest}`);
          note.push(`the tourney crowned ${res.win}${res.second?` over ${res.second}`:""}, unrest ${un0}→${q.unrest}`);
        }
        if(A.tourneyReady(q)) bad.push("`tourneyReady` is still true the week after one was held — it has no cooldown"); }
      return { bad, note };
    })();

    return { rows, steps, foreign, foreignQuiet, terms, dark,
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

  /* ---- #165 ---- */
  for(const r of out.terms.rows)
    lines.push(`${r.nm.padEnd(18)} ` + r.v.map(x=>`${x.k} ${x.v}/${x.top}`).join(" · ") + `  = ${r.tgt}`);
  for(const n of out.terms.note) lines.push(n);
  for(const b of out.terms.bad) fails.push(b);
  lines.push(`MEASURED IN PLAY, recorded not barred: 30 houses x 420w on three seed prefixes spend `
    + `29.8% / 35.6% / 26.3% / 8.3% of their weeks in the first four rungs and NOUGHT in the last two. `
    + `With the ledger held up so the house cannot go broke: 97 weeks of 10,387 in the fifth and 3 in `
    + `the sixth. The terms at each house's best week, played then granted: the men 32.0/46.0 (its `
    + `ceiling is 46), the styles 5.5/7.2 of 22, freed legends 0.0/0.7 of 12, the primacy 1.4/12.1 of `
    + `14, the fame spill 10.4/14.0 of 14, the walls 3.0/5.7 of 9. See the roadmap.`);
  for(const n of out.dark.note) lines.push(n);
  for(const b of out.dark.bad) fails.push(b);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
