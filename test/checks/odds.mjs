/* THE PANEL'S OWN NUMBER, AGAINST THE SAND — AND IT NAMED THE WORST ORDER BEST.

   The arena panel quotes the player his chance and recomputes it from whichever tactic chip is
   selected, so the four numbers he sees ARE a recommendation, whatever else they are. Measured with
   mirrored men — two fighters identical in all six stats, class, kit, traits, heart, morale, record
   and fame — 250 bouts a cell, the crux answered the same word in every arm:

     the bay's ordinary card   sand: forward 52.8% · standing off 49.2% · patient 42.4% · showing 34.4%
     a good card in Capua      sand: forward 48.0% · standing off 40.0% · patient 35.2% · showing 30.0%
     the best in the bay       sand: forward 43.2% · standing off 40.0% · patient 36.4% · showing 29.2%
     the imperial bill         sand: forward 46.8% · standing off 39.6% · patient 36.4% · showing 32.8%

   and the panel put STANDING OFF at the top of all four, ahead of forward by a few tenths, while the
   sand had forward ahead by 3.2 to 8.0 points. Nought of four rankings agreed. `board`'s defensive
   term gave a shield man a 0.44 multiple of his cover for standing off against the 0.13 every other
   order gets — a 25% premium that outran the 1.18-against-1.05 `TACTIC_OR` gives going forward.
   0.44 → 0.22 in v2.90.0 and all four rankings agree.

   AND THE FIRST VERSION OF THIS CHECK ASSERTED THE WRONG THING, which is worth keeping. It held the
   REALISED ranking off 150 bouts a cell. The standard error on a difference of two proportions at
   that n is about 5.8 points, the effect is 3 to 8, and the ranking duly flipped between two runs of
   the same build. A 250-bout version looked stable and was not; it was four cells of noise agreeing
   by luck. What the check holds now is the part that needs no sampling at all: `winChance` is a pure
   function, and for any man with a board it ranked standing off above going forward EVERY time, by
   arithmetic — cover 0.9 gives board 1.396 against 1.117, a ratio of 1.250, against TACTIC_OR's
   1.18/1.05 = 1.124. The sand's side of it is taken from the figure the source itself published off
   2,700 bouts (aggressive 47.2% · measured 43.8% · defensive 42.0% · showboat 32.2% at 82 against
   82), not from anything this check has the samples to establish. Realised rates are still printed,
   because they are worth seeing, but they are printed as observations and not as bars.

   WHAT THIS CHECK HOLDS, and why each bar is where it is:

     1. THE MIRROR, which is this check's own instrument before it is a bar. Two identical men must
        land a shade under half — `FOE_EDGE` is 1.029, a deliberate 2.9% premium to the other side.
        If the mirror drifts off ~46% then nothing else measured here means anything, and that is
        exactly how the fault below was found: the first version of this measurement read 21% to 28%
        for a mirror and the engine was never the reason.

     2. THE CRUX RETURN IS `crux`, NOT `unfinished`. `doFight` and its three sisters return
        `{ pending, beats, crux:true, … }` with NO `unfinished` field — `unfinished` belongs to the
        `simulate*` layer underneath. Three probes of mine tested `res.unfinished` on a `doFight`
        result, read every held bout as a finished one with no winner, and scored 33% to 58% of all
        bouts as losses. That is what produced the impossible mirror. This section asserts the shape
        of the return so the confusion cannot come back, and `probe` now fails any check that reads
        `.unfinished` off a `do*` result.

     3. THE RANKING THE PANEL QUOTES, held on `winChance` directly, for all six classes, with no
        sampling anywhere in it. Not the gap in points — the ORDER of the words, because the order is
        the only thing a player uses the number for. The bar is that going forward must quote above
        standing off, which is what the source's own 2,700-bout table says the sand does.

     4. THE IMPERIAL BOUT IS THE ONLY BOUT IN THE GAME WITH NO CRUX. `simulateFight` is called with
        `stopAtCrux: !offer.imperial`, so a crux comes up in 58.4%, 45.6% and 32.8% of ordinary cards
        by grade and 0.0% of imperial ones. Nothing in the source says why. It is recorded, not
        asserted as a fault: it may well be the intent — Rome gives a lanista no say, which is what
        the bout's own opening line says about his patrons — but a player who has learned to coach a
        bout loses the lever at the exact moment it is worth most, and is never told.

   WHAT IS MEASURED AND LEFT ALONE, CORRECTED IN v3.9.0. This head used to say "the quote runs about
   four points rich across all four orders". Both halves of that were wrong and neither was sourced:
   `cell` has always computed the quote AND the realised rate and only ever PRINTED the realised one,
   so the figure came from nowhere this file can point at. Both are printed now, per grade and pooled,
   so the claim is re-derived on every run instead of being quoted from a comment.

   And the shape is not a bias in one direction at all. On the two instruments in this suite that are
   sound for the level:
     this check's mirror  quote 45.2% against a realised 44.7% pooled over 600 bouts — rich by 0.55,
                          se 2.04, which is indistinguishable from honest, at the one pairing whose
                          answer is known in advance
     `engines`            even 41% quoted against 43.5% on the sand (2.5 thin) · yours the better 94%
                          against 96.8% (2.8 thin) · yours outmatched 3% against 0.7% (2.3 rich)
   So the quote is HONEST where the fight is even and COMPRESSED TOWARD THE CENTRE at both ends: about
   two and a half points thin when the man is the favourite and about two and a half rich when he is
   outmatched. That is what a model which under-weights an edge does, and it is the opposite of a flat
   four-point richness. Nothing is changed for it — a two-point hedge is within what a bookmaker's
   number owes anybody, and it errs toward caution in the only direction that costs a life: a man who
   is outmatched is quoted slightly better than he is, which is a real cost, but 2.3 points of it, and
   the panel's word for that range is already "he is outmatched" rather than a number alone.

   The forward-against-standing-off figure was also wrong, and by more. The panel quotes forward 45.2%
   against standing off 44.5% — 0.7 points — where the source's own 2,700-bout table has aggressive
   47.2% against defensive 42.0%, or 5.2. That is understated about sevenfold, not by half. The bar is
   still the ORDER and not the gap, because the order is what a player does something with.

   AND FOUR PROBES OF MINE FAILED BEFORE ANY OF THAT WAS READABLE, all with the same fault. Each built
   ONE fighter and reused him across hundreds of bouts, resetting the six stats, fatigue, injury,
   morale and record between them — and not `lasting`, `strain`, `form`, `wear`, `scars`, `regard` or
   `defiance`, which accumulate. The man decayed in ways `winChance` cannot see, and the readings came
   out 9.6 points "thin" pooled, with a mirror at 35.6% where this check's own mirror sits at 44.7%.
   A fifth probe blamed coaching and killed its own explanation: pressing at every balance against
   saying nothing at all is worth 0.58 points over 9,600 bouts. `cell` below takes a FRESH STATE per
   bout for exactly this reason, and that is not incidental to it. */

import { hasHandle } from "../harness.mjs";

export const name = "odds";
export const describe = "the arena panel ranks the four orders the way the sand does, and the crux return says `crux`";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const bad = [], lines = [];
    const mean = f => A.STATS.reduce((s,k)=>s+(f[k]||0),0)/6;
    const avg = a => a.length ? a.reduce((s,v)=>s+v,0)/a.length : null;
    const TACS = ["aggressive","measured","defensive","showboat"];
    const SAY = { aggressive:"forward", measured:"patient", defensive:"standing off", showboat:"showing off" };
    const N = 150;

    const state = seed => { const d = A.newGameState("Od","clean",seed,null);
      d.fame = 1200; d.gold = 40000; return d; };

    /* the other man, pinned flat so the only thing separating the arms is the word given */
    const mkOpp = m => { const o = A.genOpponent(3, A.qForStat(m));
      for(const k of A.STATS) o[k] = Math.round(Math.min(99, m));
      o.kit = A.kitFor(o.cls, 3); return o; };

    const mkOffer = (d, opp) => { const o = { id:d.nextId++, tier:3, festival:"a bench", opp,
      oppRef:null, rematch:false, grudgeM:false, stakes:"standard", purse:900 };
      d.games = { festival:"a bench", offers:[o], week:d.week }; return o; };

    const romeOffer = d => { d.rome = { travel:0, fought:0, won:0, due:d.week+20 };
      A.makeGames(d); return d.games && d.games.offers && d.games.offers[0]; };

    /* HIS TWIN. Every readable thing copied across, so a gap is the engine and nothing else. */
    const twin = (d, opp) => {
      const g = A.genGladiator(d, A.qForStat(mean(opp)));
      for(const k of A.STATS) g[k] = opp[k];
      g.cls = opp.cls; g.kit = opp.kit; g.traits = (opp.traits||[]).slice();
      g.heart = opp.heart; g.morale = opp.morale; g.pfame = opp.pfame; g.wins = opp.wins||0;
      g.status = "active"; g.injury = null; g.fatigue = 0;
      d.gladiators.push(g); return g;
    };

    /* one cell: N mirrored bouts on one word, over one seed set shared by every arm */
    const cell = (tag, m, tac, rome) => {
      let won = 0, ran = 0, cruxes = 0, q = [];
      for(let i=0;i<N;i++){
        const d = state(`ODDS-${tag}-${i}`);
        const o = rome ? romeOffer(d) : mkOffer(d, mkOpp(m));
        if(!o) continue;
        const g = twin(d, o.opp);
        q.push(A.winChance(g, o.opp, 0, tac, null));
        let res = A.doFight(d, g.id, o, tac, 0, null, null, null);
        /* `crux`, not `unfinished` — and the rope is what knows the difference */
        if(res && res.crux){ cruxes++; res = R.answer(d, res, "press").res; }
        if(!res || res.crux || res.__err) continue;
        ran++; if(res.win) won++;
      }
      return { n:ran, pct: ran ? won/ran*100 : null, quoted: avg(q)*100, cruxRate: cruxes/N*100 };
    };

    const GRADES = [
      { key:"g66", name:"the bay's ordinary card", m:66 },
      { key:"g82", name:"a good card in Capua",    m:82 },
      { key:"g92", name:"the best in the bay",     m:92 },
    ];

    /* ================= 1. THE MIRROR — THE INSTRUMENT BEFORE THE BAR ================= */
    {
      const rows = [];
      for(const G of GRADES) rows.push([G.name, cell(`M-${G.key}`, G.m, "aggressive", false)]);
      rows.push(["the imperial bill", cell("M-rome", 97, "aggressive", true)]);
      /* ---- AND THE QUOTE BESIDE IT, WHICH IS THE ONLY PAIRED READING OF THE LEVEL ----
         Both numbers were already computed here and only the realised one was printed, so the head's
         claim about the LEVEL — "about four points rich across all four orders" — was never sourced
         from anything and turned out to have the wrong sign. See the head. `winChance` is a pure
         function of the pairing, so it carries no sampling error and the whole error on the gap is the
         realised rate's, 0.5/sqrt(n), which is 4.1 points at n=150. Printed, not asserted: the level
         wants an n this check does not spend, and the mirror bar above is what holds the instrument. */
      let pq = 0, pr = 0, pn = 0;
      for(const [nm, c] of rows){
        if(c.pct != null){ pq += c.quoted*c.n; pr += c.pct*c.n; pn += c.n; }
        lines.push(`the mirror at ${nm}: ${c.pct==null?"—":c.pct.toFixed(1)}% of ${c.n}`
          + ` against a quote of ${c.quoted.toFixed(1)}% (${c.pct==null?"—":((c.pct-c.quoted)>=0?"+":"")+(c.pct-c.quoted).toFixed(1)} points)`
          + ` · a crux came up in ${c.cruxRate.toFixed(1)}% of bouts`);
        if(c.n < N*0.8)
          bad.push(`the mirror at ${nm} only resolved ${c.n} of ${N} bouts — the crux is not being answered`);
        else if(c.pct == null || c.pct < 38 || c.pct > 54)
          bad.push(`two men identical in all six stats, class, kit, traits, heart, morale, record and `
            + `fame went ${c.pct==null?"nowhere":c.pct.toFixed(1)+"%"} at ${nm} — FOE_EDGE is 1.029, so `
            + `this must sit a shade under half. Off that, either the engine has grown an asymmetry `
            + `or this check is scoring held bouts as losses again`);
      }
      if(pn){ const gap = pr/pn - pq/pn;
        lines.push(`pooled over ${pn} mirrored bouts the quote is ${(pq/pn).toFixed(1)}% against a realised `
          + `${(pr/pn).toFixed(1)}% — ${gap >= 0 ? "thin" : "rich"} by ${Math.abs(gap).toFixed(2)} points, `
          + `se ${(0.5/Math.sqrt(pn)*100).toFixed(2)}`); }
      lines.push(`FOE_EDGE ${A.FOE_EDGE != null ? A.FOE_EDGE : "(not on the handle)"} — the other side's standing premium, by design`);
    }

    /* ================= 2. THE SHAPE OF A HELD BOUT ================= */
    {
      const d = state("ODDS-SHAPE");
      const o = mkOffer(d, mkOpp(82));
      const g = twin(d, o.opp);
      let held = null;
      /* fish for a held bout — a crux comes up in about half of ordinary cards */
      for(let i=0;i<40 && !held;i++){
        const d2 = state(`ODDS-SHAPE-${i}`);
        const o2 = mkOffer(d2, mkOpp(82));
        const g2 = twin(d2, o2.opp);
        const r = A.doFight(d2, g2.id, o2, "measured", 0, null, null, null);
        if(r && r.crux) held = r;
      }
      if(!held)
        bad.push(`forty bouts on an ordinary card and not one reached the crux — either the balance `
          + `has stopped firing or \`stopAtCrux\` has changed`);
      else {
        const hasCrux = held.crux === true;
        const hasUnfinished = Object.prototype.hasOwnProperty.call(held, "unfinished");
        const hasWin = Object.prototype.hasOwnProperty.call(held, "win");
        lines.push(`a held bout returns: crux ${held.crux} · an \`unfinished\` field: ${hasUnfinished}`
          + ` · a \`win\` field: ${hasWin} · pending carries ${Object.keys(held.pending||{}).sort().join(", ")}`);
        if(!hasCrux)
          bad.push(`a held bout no longer says \`crux: true\` — every probe and check in this suite `
            + `tests that field to know the bout is waiting`);
        if(hasUnfinished)
          bad.push(`a held \`doFight\` result has grown an \`unfinished\` field. It never had one — `
            + `\`unfinished\` belongs to the \`simulate*\` layer underneath — and three probes read `
            + `\`res.unfinished\` off a \`doFight\` result, scored a third to two thirds of all bouts `
            + `as losses, and produced a 21% mirror. If both fields now exist, say which is which`);
        if(hasWin)
          bad.push(`a HELD bout is reporting a \`win\` — it has credited nothing and decided nothing, `
            + `and anything reading that field will score the bout before it happened`);
      }

      /* ---- AND THE LOG A HELD BOUT CARRIES BACK MUST BE THE WHOLE BOUT (#169) ----
         The join was below the early return in all four engines, so a bout that came to the
         balance TWICE returned only the segment since the first crux. `speak` gives that straight
         to `FightModal`, which keeps its own cursor and is handed an array shorter than the index
         it holds — so the arena jumped to the line it was already on and the exchange the player's
         order bought was never drawn: 1.0 beats shown against 10.4 for the same button on a bout
         that ended instead. Two readers went with it, `favourBout`'s `close` on 10.8% of held
         bouts and `boutAccount`'s `turn` on 4.4%. The bar is the invariant, not the symptom: a
         log may only grow, and the bout must still begin where it began. */
      {
        let segs = null, tries = 0;
        for(let i=0;i<60 && !segs;i++){
          const d2 = state(`ODDS-LOG-${i}`);
          const o2 = mkOffer(d2, mkOpp(82));
          const g2 = twin(d2, o2.opp);
          let r = A.doFight(d2, g2.id, o2, "measured", 0, null, null, null);
          if(!r || r.__err) continue;
          const got = [(r.beats||[]).slice()];
          let n = 0;
          while(r && r.crux && n < 4){
            const pd = r.pending; pd.beats = r.beats; n++;
            r = A.doFight(d2, pd.gid, pd.offer, pd.tactic, pd.bet, pd, "press");
            if(!r || r.__err) break;
            got.push((r.beats||[]).slice());
          }
          tries++;
          if(!r || r.__err || r.crux) continue;
          if(n >= 2) segs = got;                    /* a bout that stopped TWICE, which is the case */
        }
        if(!segs)
          bad.push(`sixty bouts and not one came to the balance twice in ${tries} that finished — `
            + `either the crux has stopped repeating or this fixture no longer produces long bouts`);
        else {
          const opened = (segs[0][0] || {}).text;
          const lens = segs.map(x=>x.length);
          const shrank = lens.findIndex((n,i)=>i > 0 && n < lens[i-1]);
          const last = segs[segs.length-1];
          lines.push(`a bout held ${segs.length-1} times carries ${lens.join(" → ")} beats, `
            + `and still opens on "${String(opened).slice(0,44)}…"`);
          if(shrank > 0)
            bad.push(`the log SHRANK across a word from the box — ${lens.join(" → ")} beats — so the `
              + `exchange that word bought is not in what came back, and the modal is handed an array `
              + `shorter than the cursor it is holding`);
          if((last[0] || {}).text !== opened)
            bad.push(`a finished bout no longer opens where it opened: "${String((last[0]||{}).text).slice(0,44)}" `
              + `against "${String(opened).slice(0,44)}"`);
        }
      }
    }

    /* ================= 3. THE RANKING THE PANEL RECOMMENDS — NO SAMPLING ================= */
    {
      /* `winChance` is pure: same two men, same words, same number every time. So the ranking it
         recommends can be asserted outright, for every class, with no sample size to argue about. */
      const d = state("ODDS-QUOTE");
      const flat = (cls, m) => { const g = A.genGladiator(d, A.qForStat(m));
        for(const k of A.STATS) g[k] = Math.round(Math.min(99, m));
        g.cls = cls; g.kit = A.kitFor(cls, 3);
        g.status="active"; g.injury=null; g.fatigue=0; g.morale=80; g.heart=70; g.wins=8; g.pfame=80;
        return g; };
      let boarded = 0;
      for(const cls of Object.keys(A.CLASSES)){
        const me = flat(cls, 88), him = flat(cls, 88);
        const cov = (A.kitMods(me.kit, cls, me).cover) || 0;
        if(cov > 0) boarded++;
        const q = {};
        for(const t of TACS) q[t] = A.winChance(me, him, 0, t, null) * 100;
        const rq = TACS.slice().sort((a,b)=>q[b]-q[a]);
        lines.push(`${cls.padEnd(12)} board ${cov.toFixed(2)} · the panel quotes `
          + TACS.map(t=>`${SAY[t]} ${q[t].toFixed(1)}%`).join(" · ")
          + ` → it recommends ${SAY[rq[0]]}`);
        /* the source's own 2,700-bout table: aggressive 47.2 · measured 43.8 · defensive 42.0 ·
           showboat 32.2. Going forward is the best word on the sand; the panel must say so too. */
        if(q.defensive >= q.aggressive)
          bad.push(`for a ${cls} the panel quotes standing off at ${q.defensive.toFixed(1)}% against `
            + `going forward at ${q.aggressive.toFixed(1)}% — the source's own 2,700-bout table has `
            + `forward the best word by 5.2 points over standing off, so the panel is recommending `
            + `the worse one. This is \`board\`'s defensive multiple outrunning TACTIC_OR, which only `
            + `gives forward 1.18 against 1.05 — so any cover premium for standing off worth more `
            + `than 1.124 reverses the advice. This man's board is ${cov.toFixed(2)}, and every `
            + `class with a board fails together, which is the signature`);
        if(q.showboat >= q.measured)
          bad.push(`for a ${cls} the panel rates showing off at or above patience `
            + `(${q.showboat.toFixed(1)}% against ${q.measured.toFixed(1)}%) — it is last on the sand `
            + `in all four games, by seven points`);
      }
      lines.push(`${boarded} of ${Object.keys(A.CLASSES).length} classes carry a board, `
        + `which is who the defensive term was mispricing`);
    }

    /* ============ 4. AND THE REALISED RATES, PRINTED BUT NOT HELD ============
       At 150 bouts a cell the standard error on a difference of two proportions is about 5.8 points
       and the effect is 3 to 8, so these cannot settle the ranking and are not asked to. They are
       here because a number worth fixing is worth looking at, and because the crux rate per grade is
       the evidence for section 4 of the header. */
    {
      const GRADES = [
        { key:"g66", name:"the bay's ordinary card", m:66 },
        { key:"g82", name:"a good card in Capua",    m:82 },
        { key:"g92", name:"the best in the bay",     m:92 },
      ];
      const rows = [];
      for(const G of GRADES){
        const o = {}; for(const t of TACS) o[t] = cell(`O-${G.key}`, G.m, t, false);
        rows.push([G.name, o]);
      }
      { const o = {}; for(const t of TACS) o[t] = cell("O-rome", 97, t, true);
        rows.push(["the imperial bill", o]); }
      for(const [nm, o] of rows){
        const rs = TACS.slice().sort((a,b)=>o[b].pct-o[a].pct);
        lines.push(`${nm}: ` + rs.map(t=>`${SAY[t]} ${o[t].pct.toFixed(1)}%`).join(" · ")
          + `  (${o.aggressive.n} bouts a word, ±5.8 on any difference — not a ranking)`);
      }
    }

    /* ============ 5. AND THE QUOTE CAN SEE A CROWD, from v2.99.0 ============
       `power` weights the stats str 3.55 · tec 4.44 · agi 3.02 · end 2.20 · dis 1.07 and **sho 0.00**
       per ten points, so `winChance` was blind to showmanship. It is not a dead stat: it enters the
       exchange at `1 + crowd/100 * sho/100 * 0.16`, a few per cent of damage compounding over twelve
       rounds. Measured on the same man twice with nothing but `sho` moved, 250 bouts a point against a
       uniform mix of the six classes:

         sho          40      58      76      94
         Retiarius  31.2%   34.0%   39.6%   47.6%    +16.4 points, and the quote moved 0.00
         Murmillo   36.0%   39.2%   44.8%   51.2%    +15.2 points, and the quote moved 0.00

       Two unrelated classes, monotone, the implied power edge agreeing to a tenth of a point at every
       step. The term lives in `winChance` rather than in `power` because the exchange calls `power` too
       and would pay for it twice — the same reason the board lives there. Asserted with no sampling:
       the quote must rise with showmanship, must move most of the measured range, and must CANCEL in a
       mirror, because a term that does not cancel when both men are equal has broken the 46% instrument
       that everything else here is measured against. */
    {
      const SHO = [40, 58, 76, 94];
      const at = v => {
        const d = A.newGameState("Oq","clean","ODDS-SHO",null);
        const opp = mkOpp(78);
        const g = twin(d, opp); g.sho = v;
        return A.winChance(g, opp, 0, "measured", "measured") * 100;
      };
      const q = SHO.map(at);
      lines.push(`the quote against showmanship: ` + SHO.map((v,i)=>`sho ${v} → ${q[i].toFixed(1)}%`).join(" · ")
        + `  (the sand: 31.2 · 34.0 · 39.6 · 47.6 for a Retiarius, 36.0 · 39.2 · 44.8 · 51.2 for a Murmillo)`);
      for(let i=1;i<q.length;i++) if(!(q[i] > q[i-1]))
        bad.push(`the quote at showmanship ${SHO[i]} is ${q[i].toFixed(1)}% and at ${SHO[i-1]} it is `
          + `${q[i-1].toFixed(1)}% — a stat worth 15 to 16 points of win rate on the sand has to move `
          + `the number the player is shown, in the right direction`);
      const range = q[q.length-1] - q[0];
      if(range < 8)
        bad.push(`54 points of showmanship moves the quote ${range.toFixed(1)} points and moves the sand `
          + `15 to 16. Before v2.99.0 it moved 0.00, because \`power\` pays nothing for \`sho\` — if this `
          + `has gone back to zero then \`winChance\` has lost the show term`);
      if(range > 20)
        bad.push(`54 points of showmanship moves the quote ${range.toFixed(1)} points against 15 to 16 on `
          + `the sand — the show term is now overpaying, and an odds panel that overstates a stat sends `
          + `a player after the wrong man`);

      /* and it must vanish in a mirror */
      const d = A.newGameState("Om","clean","ODDS-SHO-MIRROR",null);
      const opp = mkOpp(78); opp.sho = 94;
      const g = twin(d, opp);
      const m = A.winChance(g, opp, 0, "measured", "measured") * 100;
      const base = (()=>{ const e = A.newGameState("Om2","clean","ODDS-SHO-MIRROR-2",null);
        const o2 = mkOpp(78); o2.sho = 40; const g2 = twin(e, o2);
        return A.winChance(g2, o2, 0, "measured", "measured") * 100; })();
      lines.push(`and it cancels in a mirror: two men at sho 94 quote ${m.toFixed(1)}%, two at sho 40 `
        + `quote ${base.toFixed(1)}%`);
      if(Math.abs(m - base) > 0.5)
        bad.push(`a mirror at showmanship 94 quotes ${m.toFixed(1)}% and a mirror at 40 quotes `
          + `${base.toFixed(1)}% — the show term does not cancel between equals, so it is not a ratio, `
          + `and the 46% mirror this whole check is calibrated on now depends on a stat`);
    }

    /* ============ 6. AND IT MUST PRICE EVERY FOE THE CHOOSER CAN HAND IT ============
       A player reported "He loses about NaN in a hundred, and a loss here is his life" under every man
       in a pair chooser. The sine warning is `winChance(g, foe, …)` and `foe` for a pair or a melee is
       `fieldAverage(o.opps)` — the average man in the field — which returned the six stats, `cls:null`
       and nothing else. `power` reads `morale` and `fatigue`; `clamp(undefined,0,100)` is NaN; NaN
       survives every multiplication after it and reaches the screen. Nothing threw and nothing was
       ever going to.

       IT COULD NOT HAPPEN UNTIL v2.98.0, which is the part worth keeping: the warning is gated on
       `stakes === "sine"` and a pair offer hardcoded `"standard"` until that release let a munus bought
       sine missione carry its pair. Making dead content reachable is a change to every path that reads
       it. `cls` stays null on purpose — a field of four men has no one style, and `readMatch` is right
       to answer "no read" rather than invent one. */
    {
      const mine = (()=>{ const d = A.newGameState("Oz","clean","ODDS-NAN",null);
        const g = A.genGladiator(d, A.qForStat(74)); g.id = 1; g.status = "active";
        g.kit = A.defaultKit(g.cls); g.injury = null; g.fatigue = 0; return g; })();
      const field = [0,1,2,3].map(()=>{ const o = A.clone(A.genOpponent(2, A.qForStat(74)));
        o.kit = A.defaultKit(o.cls); return o; });
      const CASES = [
        ["a real opponent",         field[0]],
        ["a melee field of four",   A.fieldAverage(field)],
        ["a pair field of two",     A.fieldAverage(field.slice(0,2))],
        ["a field of one",          A.fieldAverage([field[0]])],
        ["the barest object",       A.fieldAverage([{ str:60 }])],
      ];
      const said = [];
      for(const [nm, foe] of CASES){
        if(!foe){ bad.push(`\`fieldAverage\` gave nothing back for "${nm}" — the chooser reads it to `
          + `draw a pair and a melee, and a null there means no reading at all`); continue; }
        let q = null, threw = null;
        try { q = A.winChance(mine, foe, 0, "measured", "measured"); } catch(e){ threw = e.message; }
        said.push(`${nm} ${threw ? "THREW" : Number.isFinite(q) ? (q*100).toFixed(1)+"%" : String(q)}`);
        if(threw)
          bad.push(`\`winChance\` threw on ${nm}: ${threw}. The chooser prices its sine missione warning `
            + `with it and cannot catch that`);
        else if(!Number.isFinite(q))
          bad.push(`\`winChance\` priced ${nm} at ${q} — the chooser puts that straight on the screen as `
            + `"He loses about ${Math.round((1-q)*100)} in a hundred", which is what a player was shown `
            + `under every man in a pair chooser. \`fieldAverage\` has to carry everything \`power\` reads`);
      }
      lines.push(`priced against every foe the chooser can build: ${said.join(" · ")}`);
      /* and the field's style must stay unclaimed */
      const fa = A.fieldAverage(field);
      if(fa && fa.cls != null)
        bad.push(`\`fieldAverage\` now claims a class ("${fa.cls}") for a field of four men. \`readMatch\` `
          + `reads \`foe.cls\` for the counter cycle, so a field would start reporting a match-up that `
          + `belongs to one man in it`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
