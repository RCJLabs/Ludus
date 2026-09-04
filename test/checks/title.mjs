/* THE PRIMACY OF CAPUA IS DECIDED ON THE SAND, AND IT CAN COST YOU YOUR CHAMPION

   `EVENTS.primacy`'s "Make the match" branch — one of your own men asking for the title against the
   man who sleeps four doors down — was two `power()` calls against a pair of independent 0.8-1.3
   rolls, a comparison, and a paragraph about a bout nobody was shown. It was the last marquee
   moment in the game decided by a coin, and it was raised as a DESIGN decision rather than a defect
   because fixing it properly means the house can lose its best man to its own second.

   It goes through `simulateFight` now, at standard stakes, with the appeal live. Measured
   (`probes/title.mjs`, 400-500 bouts a cell on two men whose power measured 314.1 against 313.1):

     the order from the box     challenger takes it   somebody dies
       say nothing                    53.5%               2.8%
       tell the holder to press       50.5%               4.5%
       tell the holder to cover       54.8%               4.5%
       throw the cloth                     — 316 of 400 stopped before a result —

   THE GATE SAYS THE CHALLENGER IS THE HOLDER'S EQUAL AND THE SAND AGREES: he takes it about half
   the time. The old coin did too, so that is not the change. The change is that somebody can die.

   AND THE HOUSE'S STANDING IS NOT MEASURABLE BY COUNTING DEATHS, which is worth writing down
   because it looked like it was. The same two houses read 25 against 8 holder deaths on one run of
   500 and 15 against 16 on another of 400 — the deaths are far too rare to compare at any N this
   suite can afford, and an arm built on them is a coin dressed as a gate. So the appeal's own
   arithmetic is asked directly instead, at an afternoon the editor is actually thinking about: a
   veteran of sixteen bouts, of modest renown, who gave a poor account before a thin crowd. There
   the house is worth 18% spared against 38% — and at the game's own MERCY_CASE it is worth nothing
   at all, because `missioOdds` clamps at 0.97 and the score saturates long before it.

   ONE ASYMMETRY IS CORRECTED AT THE WRAPPER RATHER THAN IN THE ENGINE. `simulateFight` reads A's
   appeal off the full missio machinery — `missioScore` against the box, the patron, the street,
   what he endured — and gives B a flat `crowd>62 && R()<0.55`. That is right when B belongs to
   another house and nobody in the seats has any feeling about him, and wrong when B is the
   second-best man in yours. `doPrimacy` re-decides that one roll against the figure the holder
   would have been read at and rewrites the beat, rather than editing the single sand, which
   `simulatePair` was written apart from on purpose.

   AND THE BOX HAS ONE VOICE, WHICH IS THE WHOLE OF THE DECISION. `simulateFight` carries one tactic
   per side and, on a resume, the one it already had — so an order given at the crux can only reach
   A. Everywhere else in the game that is invisible because B belongs to somebody else. Here it is
   the point: you can speak to exactly one of them and it is the one holding the title.

   SEVEN ARMS:
   1 · IT IS A FIGHT: beats are emitted, rounds are inside the cap, and the result agrees with its
       own HP — and the two `power()` calls that used to decide it are gone from the branch.
   2 · IT CAN KILL, AND THE DEAD MAN IS BURIED PROPERLY: status, the fallen roll, the collegium, the
       unburied mark, the killer's tally, and the yard's own answer to watching it.
   3 · THE MISSIO READS THE HOUSE, AND THE WRAPPER HANDS IT THE HOUSE: the appeal's arithmetic is
       asked directly rather than sampled, and `doPrimacy` reports the place it named so that
       stripping `missioPlace` out of its ctx cannot pass. Both halves are needed — the first draft
       had only the first, and a sabotage that removed the house from the bout entirely walked
       through it.
   4 · THE BOX HAS ONE VOICE, AND THE ORDER REACHES THE SAND: `doPrimacy` reports the tactic it
       handed the engine, read at the resume where the order was given — a bout comes to the balance
       more than once and every later word is "say nothing", so the tactic on the final result is
       always "measured". `press` shipped its first draft as `order:{press:true}`, which is
       `simulateSpar`'s vocabulary and means nothing to the single sand; it moved the sampled death
       rate by 0.3 points on 400 bouts, i.e. not at all, which is exactly why this is held on a
       reported field and not on a sampled one.
   4b· AND THE CHALLENGER'S APPEAL IS RE-READ: the wrapper reports how many times it overruled the
       engine's flat roll. Measured here, the engine condemned 140 challengers and the house's own
       missio spared 135 of them — take the correction out and nothing else in this check notices,
       because the difference hides inside the sampling noise on deaths.
   5 · THE CLOTH SETTLES NOTHING, AND THAT IS ITS PRICE: the title stays, nobody is hurt, the house
       loses fame and the yard's temper for stopping a bout the city came to see.
   6 · THE TITLE MOVES ONLY WHEN THE CHALLENGER WINS, and a successful defence is counted.
   7 · AND IT HAPPENS WITH NOBODY WATCHING: the rope answers events by calling `EVENTS[id].run` and
       has never heard of a viewer, so a match made headlessly is fought by `endWeek` or the answer
       "make the match" means nothing at all. Exactly the fault #232 shipped once and had to fix. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "title";
export const describe = "the primacy is fought for, not rolled for, and the man who loses it can die on the sand";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"TITLE-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];
    let tick = 0;
    /* a house holding the primacy with a second man the gate would take. The seed MOVES: `R()` is
       one global counter reseeded from the seed string, so a fixture that names the same seed runs
       one bout N times (the fault `checks/office.mjs` records in full). */
    const seat = (fame, favor) => {
      const d = A.newGameState("Title", "clean", `TTL-${tick++}`, null);
      d.fame = fame; d.favor = favor; d.week = 120; d.gold = 4000; d.gladiators = [];
      const men = [];
      for(let i=0;i<2;i++){
        const g = A.genGladiator(d, 66 + Math.floor(Math.random()*16));
        g.id = d.nextId++; g.status = "active"; g.mine = true; g.kit = A.defaultKit(g.cls);
        g.wins = 12; g.losses = 2; g.pfame = 80; g.fatigue = 0; g.morale = 70;
        d.gladiators.push(g); men.push(g);
      }
      /* two more in the cells, so the yard has somebody to have a view about it */
      for(let i=0;i<3;i++){
        const g = A.genGladiator(d, 50); g.id = d.nextId++; g.status="active"; g.mine=true;
        g.kit = A.defaultKit(g.cls); g.morale = 70; d.gladiators.push(g);
      }
      d.primus = { mine:true, gid:men[0].id, name:men[0].name, nick:men[0].nick, cls:men[0].cls,
        since:d.week-10, defences:1 };
      return { d, h:men[0], r:men[1] };
    };
    /* one bout, resumed to the end — a bout comes to the balance more than once */
    const fight = (fx, order) => {
      let res = A.doPrimacy(fx.d, fx.h.id, fx.r.id, null, null);
      let ordered = null;      /* the tactic the ORDERED resume handed the engine */
      for(let n = 0; res && res.crux && n < 14; n++){
        res.pending.beats = res.beats;
        res = A.doPrimacy(fx.d, fx.h.id, fx.r.id, res.pending, n === 0 ? order : "run");
        if(n === 0 && res) ordered = res.tactic;
      }
      /* a bout comes to the balance more than once and every later word is "say nothing", so the
         tactic on the FINAL result is "measured" whatever was ordered at the first crux. Reading it
         off the end is how the first draft of this arm reported press as [measured, aggressive]. */
      return (res && !res.crux) ? Object.assign({}, res, { ordered }) : null;
    };
    const cell = (n, fame, favor, order) => {
      const o = { n:0, chall:0, died:0, hDied:0, rDied:0, stopped:0, spared:0, fell:0,
        rounds:0, maxRound:0, noBeats:0, disagreed:0, defended:0, moved:0, buried:0, killTally:0,
        owed:0, offRoster:0, tactics:{}, reread:0, saved:0, favorSeen:null };
      const note = t => { o.tactics[t||"(none)"] = (o.tactics[t||"(none)"]||0) + 1; };
      for(let i=0;i<n;i++){
        const fx = seat(fame, favor);
        const before = fx.d.primus.gid, defs = fx.d.primus.defences;
        const res = fight(fx, order);
        if(!res) continue;
        o.n++;
        o.reread += res.reread || 0; o.saved += res.saved || 0;
        if(res.place) o.favorSeen = res.place.favor;
        /* only the bouts that actually reached the balance were ever given the order — one that
           ended before it is not a dropped tactic, it is a bout nobody got to speak into */
        if(res.ordered != null) note(res.ordered);
        if(!res.beats || !res.beats.length) o.noBeats++;
        const mr = res.beats && res.beats.length ? Math.max(...res.beats.map(b=>b.round||0)) : 0;
        o.rounds += mr; o.maxRound = Math.max(o.maxRound, mr);
        if(res.stopped){ o.stopped++;
          if(fx.d.primus.gid !== before) bad.push(`a stopped title bout moved the primacy anyway`);
          continue; }
        if(res.dead) o.died++;
        if(fx.h.status === "dead"){ o.hDied++; }
        if(fx.r.status === "dead"){ o.rDied++; }
        const dead = fx.h.status === "dead" ? fx.h : fx.r.status === "dead" ? fx.r : null;
        if(dead){
          const live = fx.h.status === "dead" ? fx.r : fx.h;
          /* four separate things have to happen to a man who dies here, and asserting only the
             first left `collBury`/`markUnburied` free to be deleted — sabotage 3 walked through it */
          if((fx.d.fallen||[]).some(x=>(x.name||"").includes(dead.name))) o.buried++;
          if((fx.d.unburied||[]).some(x=>x.gid === dead.id)) o.owed++;
          if(!A.activeG(fx.d).some(x=>x.id === dead.id)) o.offRoster++;
          if((live.kills||0) >= 1) o.killTally++;
        }
        if(res.beats.some(b=>b.kind==="spared")) o.spared++;
        if(res.beats.some(b=>b.kind==="fall")) o.fell++;
        if(fx.d.primus.gid !== before){ o.moved++; o.chall++; }
        else if(fx.d.primus.defences > defs) o.defended++;
      }
      o.rounds = +(o.rounds/Math.max(1,o.n)).toFixed(1);
      return o;
    };

    /* ---- 1, 2, 5, 6: the fight, the death, the cloth, the title ---- */
    const run   = cell(120, 900, 60, "run");
    const press = cell(120, 900, 60, "press");
    const cover = cell(120, 900, 60, "cover");
    const cloth = cell(120, 900, 60, "cloth");
    const poor  = cell(120, 100, 10, "run");
    const great = cell(120, 3000, 96, "run");

    if(run.noBeats) bad.push(`${run.noBeats} title bouts produced no beats at all — it is meant to be a fight`);
    if(run.maxRound > 16) bad.push(`a title bout ran ${run.maxRound} rounds, past simulateFight's own cap of 16`);
    if(run.rounds < 2) bad.push(`title bouts average ${run.rounds} rounds — that is a coin with beats printed on it`);
    if(!run.fell) bad.push(`nobody ever went down in ${run.n} title bouts`);
    if(run.moved + run.defended !== run.n - run.stopped)
      bad.push(`${run.n - run.stopped - run.moved - run.defended} decided bouts neither moved the title nor counted a defence`);
    if(!run.chall) bad.push(`the challenger never once took it in ${run.n} bouts`);
    if(run.chall === run.n - run.stopped) bad.push(`the challenger took it every single time`);
    /* the gate says he is the holder's equal, so it must not be a formality either way */
    const cp = 100*run.chall/Math.max(1,run.n-run.stopped);
    if(cp < 25 || cp > 75) bad.push(`the challenger takes it ${cp.toFixed(0)}% of the time — PRIMUS_GATE says he is the holder's equal`);

    /* 2 — it can kill, and the dead man is buried like anybody else */
    const deaths = run.died + press.died + cover.died + poor.died + great.died;
    const buried = run.buried + press.buried + cover.buried + poor.buried + great.buried;
    const tallied = run.killTally + press.killTally + cover.killTally + poor.killTally + great.killTally;
    if(!deaths) bad.push(`nobody died in ${run.n*5} title bouts — the whole point of making it a real bout is that it can cost you one of them`);
    if(deaths && buried !== deaths)
      bad.push(`${deaths - buried} of ${deaths} men killed for the primacy never reached d.fallen — a death here is a death like any other`);
    if(deaths && tallied !== deaths)
      bad.push(`${deaths - tallied} of ${deaths} kills were never credited to the man who did it`);
    const owed = run.owed + press.owed + cover.owed + poor.owed + great.owed;
    const off  = run.offRoster + press.offRoster + cover.offRoster + poor.offRoster + great.offRoster;
    if(deaths && owed !== deaths)
      bad.push(`${deaths - owed} of ${deaths} men killed for the primacy left no funeral owing — markUnburied is what the house is then asked about`);
    if(deaths && off !== deaths)
      bad.push(`${deaths - off} of ${deaths} men killed for the primacy are still on the active roster`);
    /* the correction the wrapper makes for the challenger — see the note over it. If the engine's
       flat crowd>62 && R()<0.55 is left standing, this counter is zero and nothing else notices,
       because the only visible effect is a few more dead challengers inside the sampling noise. */
    const reread = run.reread + press.reread + cover.reread + poor.reread + great.reread;
    const saved  = run.saved + press.saved + cover.saved + poor.saved + great.saved;
    if(!reread)
      bad.push(`the challenger's death was never re-read against the house's own missio in ${run.n*5} bouts — simulateFight gives B a flat crowd>62 && R()<0.55, which is an opponent from another house, not the second-best man in yours`);
    if(reread && saved === 0)
      bad.push(`${reread} challengers were condemned by the engine's flat roll and the wrapper spared none of them — the correction is running and doing nothing`);

    /* 5 — the cloth settles nothing */
    if(!cloth.stopped) bad.push(`"throw the cloth" stopped nothing in ${cloth.n} bouts`);
    if(cloth.stopped && cloth.stopped < cloth.n * 0.4)
      bad.push(`the cloth only reached ${cloth.stopped} of ${cloth.n} bouts — most never came to the balance for it`);

    /* ---- 3: the missio reads the house — COMPUTED, because the deaths are far too noisy ----
       The same two houses measured 25 against 8 holder deaths on one run of 500 bouts and 15
       against 16 on another of 400. A sampled comparison here is a coin dressed as a gate, and it
       let a sabotage that stripped the house out of the appeal entirely walk through. So the
       appeal's own arithmetic is asked directly: one stated afternoon, the same man, the same
       crowd, the same account — and only the house changes. */
    let arm3 = null;
    { /* THE AFTERNOON HAS TO BE ONE THE EDITOR IS ACTUALLY THINKING ABOUT. `missioOdds` clamps at
         0.97 and the score saturates long before that: at the game's own MERCY_CASE (crowd 62,
         account 42) a poor house and a great one both read 97%, and the first draft of this arm
         asserted a difference between two saturated numbers. It is also easy to leave `green` on by
         accident — a freshly generated man has no bouts and collects the novice's 15 points. So:
         a veteran of sixteen bouts, of modest renown, who gave a poor account before a thin crowd.
         That is the afternoon where the box has a decision to make, and it is where the house is
         worth something. */
      const at = (fame, favor) => {
        const d = A.newGameState("Odds", "clean", `ODD-${fame}`, null);
        d.fame = fame; d.favor = favor; d.week = 120;
        const g = A.genGladiator(d, 70); g.id = d.nextId++; g.status="active"; g.mine=true;
        g.pfame = 30; g.wins = 12; g.losses = 4; g.kit = A.defaultKit(g.cls); d.gladiators = [g];
        const P = A.missioPlace(d, null);
        const ctx = { plan:0, ...P, fav:P.fav, man:0, footing:1, sky:1, venue:0, favor:P.favor,
          tier:2, hostile:false, patron:null, repShow:14, guarded:false };
        return Math.round(A.missioOdds(A.missioScore(g, ctx, 25, 8, 3)) * 100);
      };
      const lo = at(100, 10), mid = at(900, 60), hi = at(3000, 96);
      arm3 = { lo, mid, hi };
      if(!(hi > lo))
        bad.push(`the appeal reads the same for a house of fame 100 (${lo}%) as for one of fame 3000 (${hi}%) — the whole reason a great house gets its champion back is that it is read differently`);
      if(hi - lo < 8)
        bad.push(`the appeal moves only ${hi - lo} points between the poorest house and the greatest (${lo}% to ${hi}%) — that is not a house the city has a view about`);
      /* AND THE WRAPPER HAS TO ACTUALLY HAND THAT HOUSE TO THE EDITOR. The arm above proves
         `missioScore` reads the house; it proves nothing about `doPrimacy`, which builds its own
         ctx. Stripping `missioPlace` out of that ctx entirely passed this arm cleanly, so the
         wrapper reports the place it named and it is checked against the state's own. */
      if(poor.favorSeen == null || great.favorSeen == null)
        bad.push(`doPrimacy did not report the place it gave the editor`);
      else if(!(great.favorSeen > poor.favorSeen))
        bad.push(`doPrimacy told the editor the same thing about a house of favour 10 (${poor.favorSeen}) as about one of favour 96 (${great.favorSeen}) — the appeal is built from the ctx this wrapper hands it`);
      if(!(mid >= lo && hi >= mid))
        bad.push(`the appeal is not monotone in the house: ${lo}% / ${mid}% / ${hi}%`); }

    /* ---- 4: the box has one voice, and the orders are real ---- */
    const menu = Object.keys(A.PRIMACY_CRUX);
    const tacts = menu.map(k=>({ k, tactic:A.PRIMACY_CRUX[k].tactic || null, stop:!!A.PRIMACY_CRUX[k].stop }));
    if(!menu.includes("press") || !menu.includes("cover") || !menu.includes("cloth") || !menu.includes("run"))
      bad.push(`the title bout's menu is [${menu.join(", ")}]`);
    for(const t of tacts){
      if(t.k === "run" || t.k === "cloth") continue;
      if(!t.tactic)
        bad.push(`PRIMACY_CRUX.${t.k} carries no tactic — the single sand takes tactics, not simulateSpar's order keys, and an order it cannot read is a menu entry that does nothing`);
    }
    /* HELD ON THE RESULT, NOT SAMPLED. `doPrimacy` reports the tactic it handed the engine, because
       the alternative — comparing two sampled death rates — cannot tell a dropped order from an
       ordinary run of luck at any N this check can afford. Dropping `C.tactic` from the call passed
       a sampled comparison cleanly. */
    const only = o => Object.keys(o.tactics).filter(k=>o.tactics[k] > 0);
    for(const [k, o, want] of [["run",run,"measured"],["press",press,"aggressive"],["cover",cover,"defensive"]]){
      const got = only(o);
      const spoken = Object.values(o.tactics).reduce((a,b)=>a+b,0);
      if(got.length !== 1 || got[0] !== want)
        bad.push(`the "${k}" order reached the sand as [${got.join(", ")}], not ${want} — the single sand takes a tactic, and an order it never receives is a menu entry that does nothing`);
      if(spoken < o.n * 0.4)
        bad.push(`only ${spoken} of ${o.n} "${k}" bouts ever came to the balance to be spoken into — the arm is not testing what it says it is`);
    }

    /* ---- 7: the menu is the primacy's own ---- */
    const fakeFight = { primacy:true };
    const solo = A.cruxSolo ? A.cruxSolo(fakeFight) : null;
    return { bad, run, press, cover, cloth, poor, great, menu, tacts, solo, deaths, buried, tallied, arm3,
      reread, saved };
  });

  bad.push(...r.bad);
  const pc = (a,b) => b ? `${(100*a/b).toFixed(1)}%` : "-";
  const row = (k,x) => `  ${k.padEnd(6)} n=${String(x.n).padStart(3)} · challenger takes it ${pc(x.chall, x.n-x.stopped).padStart(6)}`
    + ` · dies ${pc(x.died,x.n).padStart(6)} (holder ${x.hDied}, challenger ${x.rDied})`
    + ` · went down ${pc(x.fell,x.n).padStart(6)} · spared ${pc(x.spared,x.n).padStart(6)} · ${x.rounds} rounds`
    + (x.stopped ? ` · stopped ${x.stopped}` : "");
  lines.push(`the order from the box:`);
  lines.push(row("run", r.run)); lines.push(row("press", r.press));
  lines.push(row("cover", r.cover)); lines.push(row("cloth", r.cloth));
  lines.push(`what the city thinks of the house:`);
  lines.push(row("poor", r.poor)); lines.push(row("great", r.great));
  lines.push(`  the champion was buried ${r.poor.hDied} times by a house nobody has heard of and ${r.great.hDied} by one the city plays at belonging to (SAMPLED — noisy, printed not barred)`);
  lines.push(`  the appeal itself, one stated afternoon with only the house changed: ${r.arm3.lo}% spared at fame 100 · ${r.arm3.mid}% at 900 · ${r.arm3.hi}% at 3000`);
  lines.push(`${r.deaths} men died for the title across the cells · ${r.buried} reached d.fallen · ${r.tallied} kills credited`);
  lines.push(`  the challenger's appeal was re-read off the house ${r.reread} times, and spared him ${r.saved} of them (the engine would have condemned all ${r.reread})`);
  lines.push(`  and the wrapper named the house to the editor: favour ${r.poor.favorSeen} for the poor one, ${r.great.favorSeen} for the great`);
  lines.push(`the menu is the primacy's own: [${r.menu.join(", ")}] · tactics ${r.tacts.filter(t=>t.tactic).map(t=>`${t.k}→${t.tactic}`).join(", ")} · cruxSolo says solo: ${r.solo}`);
  if(r.solo) bad.push(`cruxSolo counts a title bout as the single sand, so it would inherit that menu — cloth, finish, legs and breather, for a bout with two of your own men in it`);

  /* ---- 7. and it happens with nobody watching ---- */
  const head = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const out = { n:0, fought:0, dangling:0, moved:0, threw:null };
    for(let i=0;i<40;i++){
      const d = A.newGameState("Head", "clean", `TTLH-${i}`, null);
      d.week = 120; d.gold = 4000; d.gladiators = []; d.fame = 900; d.favor = 60;
      const men = [];
      for(let k=0;k<2;k++){
        const g = A.genGladiator(d, 70); g.id = d.nextId++; g.status="active"; g.mine=true;
        g.kit = A.defaultKit(g.cls); g.wins = 12; g.pfame = 80; g.morale = 70;
        d.gladiators.push(g); men.push(g);
      }
      d.primus = { mine:true, gid:men[0].id, name:men[0].name, nick:men[0].nick, cls:men[0].cls,
        since:d.week-10, defences:0 };
      const ev = A.EVENTS.primacy.make(d);
      if(!ev) continue;
      out.n++;
      try {
        A.EVENTS.primacy.run(d, ev, 0);
        if(!d.pendingPrimacy){ out.dangling++; continue; }
        const before = d.primus.gid, defs = d.primus.defences;
        A.endWeek(d);
        if(d.pendingPrimacy){ out.dangling++; continue; }
        out.fought++;
        if(d.primus.gid !== before || d.primus.defences > defs) out.moved++;
      } catch(e){ if(!out.threw) out.threw = String(e && e.stack || e).slice(0,180); }
    }
    return out;
  });
  lines.push(`headless: ${head.n} matches made by the event · ${head.fought} fought by endWeek · ${head.dangling} left a marker on the save · ${head.moved} settled the title`);
  if(head.threw) bad.push(`the headless path threw: ${head.threw}`);
  if(!head.n) bad.push(`EVENTS.primacy.make never produced an offer on a fixture built to satisfy it`);
  if(head.dangling) bad.push(`${head.dangling} of ${head.n} headless matches left d.pendingPrimacy on the save — the rope calls EVENTS.run directly and never sees a viewer, so endWeek has to fight what the box did not`);
  if(head.fought && head.moved !== head.fought)
    bad.push(`${head.fought - head.moved} headless title bouts settled nothing — no move, no defence counted`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
