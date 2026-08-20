/* THE FOUR WORDS BEFORE THE HORN — #166

   Four buttons on the arena panel, pressed before every single bout, and until this file the string
   "entrance" appeared in no check and no probe in the suite. `audit` priced them first and got a
   headline that did not survive its own falsification clause: +16.7 points of win rate for `showman`
   over 600 MIRRORED bouts. Twins share a renown, and the peak of the noise is one boolean —

       let mobHis = ((B.pfame||0) - (A.pfame||0)) > 12;
       const mobClear = Math.abs((A.pfame||0) - (B.pfame||0)) > 12;
       if(crowd>=82 && !cPeak && !mobClear) mobHis = sA!==sB ? sB : mom<0 ? true : mom>0 ? false : R()<0.5;

   — so a mirror is a bout where `mobClear` is false EVERY time and `showman`'s momentum point wins
   the tiebreak by construction. Re-measured against a card the game itself deals (`pickRivalOpp`,
   the generator behind every offer), 2,400 bouts a word on four seed prefixes, paired bout for bout:

       word      mirrored        a real card     play-weighted
       none      45.5%           70.7%           70.7%
       showman   63.8%  (+18.3)  77.8%  (+7.1)   77.4%  (+6.7)
       grim      46.8%  (+1.3)   72.5%  (+1.8)   72.4%  (+1.6)
       boxes     45.5%  (+0.0)   70.7%  (+0.0)   70.7%  (+0.0)

   Those are the v3.59.0 figures and `showman`'s is no longer one of them: #170 re-priced the word
   against the rest of the panel in v3.62.0 and made its billed cost real, which takes it to +0.4 and
   +2.5. The section below is kept as written because it is what was found, and because the ablation
   it records — the crowd worth nought and the momentum worth everything — is still the reason.

   Half the headline was the mirror. What was left was worse than the headline, because splitting
   `showman` into its terms — same seeds, one term dropped a time — says the crowd is not what pays:

       none                                    69.8%
       crowd +16, wind -5, fame +2             69.8%   (+0.0)
       momentum +1, wind -5, fame +2           78.2%   (+8.4)
       all four                                79.5%   (+9.7)

   One point of momentum is `p *= 1 + mom*0.03` compounded over twelve rounds, and this file's own
   note beside the traits says a trait is worth three to six points and Brutal at sixteen "is not a
   trait, it is a different man". The largest edge in the arena panel was behind a blurb about
   strutting. And `boxes` was the one button that bought NOTHING for any house that had got going:
   its missio was the last term still inside the editor's cap that a player CHOOSES, and #168 had
   just shown that cap is full on 98.5% of house-weeks.

   WHAT THIS CHECK HOLDS:
     1. Every non-cosmetic term on every word names itself to the player. A term that is not in
        `ENT_TERM_KEYS` is a term nobody is told about, which is what the item was.
     2. The salute lands OUTSIDE the editor's box cap, and is bounded there. Negative-tested against
        the shape it replaced: the same ten points inside the cap are worth nothing to a great house.
     3. All four words reach the sand through the rope's own lever and each leaves its mark.
     4. `grim`'s doubling against a green man is ONE rule, read by the sand and by the line.
     5. `boxes` pays every patron the favour it advertises, and pays them ONCE.

   All five are negative-tested. The fourth needed two goes: the first mutation loosened
   `if(ENT.favor)` and the check passed, because that guard is INSIDE `if(!pending)` and the one
   that matters is the outer one. A bar that cannot see the fault it was written for is not a bar —
   loosening `if(!pending)` itself reads "a coached bout paid the salute again: 39.0 → 43.0 across
   two words from the box", which is the fault. */

import { hasHandle } from "../harness.mjs";

export const name = "stage";
export const describe = "the entrance is four real choices, each priced where the player can read it";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const bad = [], lines = [];
    const COSMETIC = ["name","short","blurb","enter"];

    /* ---- 1. EVERY TERM NAMES ITSELF ---- */
    {
      const unsaid = [];
      for(const k of A.ENTRANCE_KEYS){
        const E = A.ENTRANCES[k];
        const terms = Object.keys(E).filter(t=>!COSMETIC.includes(t));
        const said = A.entranceSays(k, { wins:9 });
        /* the phrase the table itself would write for the term must be IN the line. Not the raw
           number — `dread 1` is eight points off the other man and the player is told the eight. */
        for(const t of terms) if(!A.ENT_TERM[t] || !said.includes(A.ENT_TERM[t](E[t], false)))
          unsaid.push(`${k}.${t} = ${E[t]}`);
        if(terms.length && said === "Nothing bought, nothing spent.")
          bad.push(`\`${k}\` carries ${terms.length} terms and its line says it carries none`);
        if(!terms.length && said !== "Nothing bought, nothing spent.")
          bad.push(`\`${k}\` carries nothing and its line claims something`);
        lines.push(`${k.padEnd(8)} ${terms.length ? terms.map(t=>`${t} ${E[t]}`).join(" · ") : "nothing"}  ->  "${said}"`);
      }
      if(unsaid.length) bad.push(`terms the player is never told about: ${unsaid.join(", ")}`);
      /* the structural half, and the reason this is a check rather than four assertions: a term
         added to any word must be added to ENT_TERM as well or it says nothing to anybody. */
      const carried = new Set(A.ENTRANCE_KEYS.flatMap(k=>Object.keys(A.ENTRANCES[k])).filter(t=>!COSMETIC.includes(t)));
      const covered = new Set(A.ENT_TERM_KEYS);
      const uncovered = [...carried].filter(t=>!covered.has(t));
      if(uncovered.length) bad.push(`ENT_TERM has no phrase for: ${uncovered.join(", ")} — add one, or the term is silent`);
    }

    /* ---- 2. THE SALUTE IS OUTSIDE THE EDITOR'S BOX, AND BOUNDED ---- */
    {
      const CAP = A.MISSIO_CAP, E = A.ENT_MISSIO;
      /* a great house: pfame alone is past the cap, so the box has nothing left to give */
      const great = { pfame: Math.ceil(CAP/0.20) + 200 };
      const ctx = extra => Object.assign({ favor:80, fav:0, day:0, man:0, patron:null }, extra);
      const sc = extra => A.missioScore(great, ctx(extra), 30, 20, 16);
      const flat = sc({});
      const inside = sc({ fav:E });          /* the shape this replaced */
      const outside = sc({ day:E });
      const over = sc({ day:E*40 });
      if(Math.abs(inside - flat) > 0.001)
        bad.push(`the box cap is not full in this fixture — ${flat.toFixed(2)} against ${inside.toFixed(2)} — the negative test cannot run`);
      if(Math.abs((outside - flat) - E) > 0.001)
        bad.push(`the salute is worth ${(outside-flat).toFixed(2)} of its ${E} against a saturated box — it is back inside the cap`);
      if(Math.abs(outside - over) > 0.001)
        bad.push(`${E*40} points of salute scored ${over.toFixed(2)} against ${outside.toFixed(2)} — the allowance is not bounded`);
      if(A.ENTRANCES.boxes.missio !== E)
        bad.push(`\`boxes\` carries missio ${A.ENTRANCES.boxes.missio} against ENT_MISSIO ${E} — two sources for one number`);
      /* and the man's side must not have been disturbed by it */
      if(Math.abs(sc({ man:A.MISSIO_MAN }) - flat - A.MISSIO_MAN) > 0.001)
        bad.push(`the man's own allowance stopped paying when the day's was added`);
      const odds = x => (A.missioOdds(sc(x))*100).toFixed(1);
      lines.push(`a great house, short bout badly lost: no salute ${odds({})}% · inside the cap ${odds({fav:E})}%`
        + ` · outside it ${odds({day:E})}% — the cap is ${CAP} and pfame alone brings ${(great.pfame*0.20).toFixed(0)}`);
    }

    /* ---- 3. ALL FOUR WORDS REACH THE SAND, THROUGH THE ROPE'S OWN LEVER ----
       Read off the FIRST segment of the bout, which is where a bout-start effect belongs and the
       only place it can honestly be read: a bout that comes to the balance twice returns the
       segment since the last crux and not the whole log, so a bar taken on the finished result is
       a bar on the log's plumbing. That truncation is real and is #169; it is not this check. */
    const fixture = key => {
      const d = A.newGameState("St","clean",`STAGE-${key}`,null);
      d.week = 60; d.fame = 900; d.gold = 60000;
      const opp = A.genOpponent(2, A.qForStat(70)); opp.wins = 9;
      const g = A.genGladiator(d, A.qForStat(70));
      g.status = "active"; g.injury = null; g.fatigue = 0; g.lastFought = -99;
      d.gladiators.push(g);
      const o = { id:d.nextId++, tier:2, festival:"a bench", opp, oppRef:null, stakes:"standard", purse:700 };
      d.games = { festival:"x", offers:[o], week:d.week };
      return { d, g, o };
    };
    {
      for(const k of A.ENTRANCE_KEYS){
        const { d, g, o } = fixture(k);
        const took = R.takeBout(d, { entrance:k, singlesOnly:true, men:[g], silent:true });
        if(!took.ran){ bad.push(`the rope could not fight a bout to press \`${k}\` (${took.why||took.err||"no reason given"})`); continue; }
        if(o.entrance !== k) bad.push(`the rope's \`entrance\` lever did not reach the offer for \`${k}\` — it reads ${o.entrance}`);
        const beats = (took.res && took.res.beats) || [];
        const spoke = beats.some(b=>b.kind === "intro"
          && /takes the long way|comes on slow|turns to the editor's box and the front rows/.test(b.text||""));
        if(A.ENTRANCES[k].enter && !spoke) bad.push(`\`${k}\` has an entrance line and the sand never printed it`);
        if(!A.ENTRANCES[k].enter && spoke) bad.push(`\`${k}\` has no entrance line and the sand printed one anyway`);
      }
    }

    /* ---- 3b. AND THE COST THE LOUDEST WORD IS BILLED FOR HAS TO BE REAL (#170) ----
       Priced against every other decision a player makes at the rail — the tactic, the plan and the
       word from the box — `showman` was worth +8.5 and +9.0 points of win rate on two seed families
       against a best-of-anything-else of +3.0 and +4.2, and the five wind its blurb billed measured
       at nothing. The walk costs a breather now: `BREATHER_BACK`, the same share of his own wind
       that waving him off gives back, one constant for both. The bar is that it is one constant and
       that it actually comes off him — a cost written down and not taken is what this was. */
    {
      if(A.ENTRANCES.showman.wind !== A.BREATHER_BACK)
        bad.push(`\`showman\` bills ${A.ENTRANCES.showman.wind} of his wind against BREATHER_BACK `
          + `${A.BREATHER_BACK} — the walk and the breather are two numbers again`);
      /* the beats either side of the entrance line, in ONE bout: the salute is pushed before the
         wind is taken and the entrance's own line after it, so the difference is the walk and
         nothing else. Reading "the first beat" instead read the intro, which is pushed before the
         entrance block runs, and both arms said 100.0% — a bar that could not see its own subject. */
      const { d:wd, g:wg } = fixture("WIND");
      const wt = R.takeBout(wd, { entrance:"showman", singlesOnly:true, men:[wg], silent:true });
      const wb = (wt.res && wt.res.beats) || [];
      const at = wb.findIndex(x=>/takes the long way/.test(x.text||""));
      if(at < 1) bad.push(`the showman's own entrance line is not in the log, so his wind cannot be read either side of it`);
      else {
        const before = wb[at-1].sA, after = wb[at].sA;
        lines.push(`he is on ${before.toFixed(1)}% of his wind at the salute and ${after.toFixed(1)}% by the time he reaches his mark`);
        if(!(after < before - 1))
          bad.push(`the long way to his mark cost him ${(before-after).toFixed(1)} points of wind — the blurb `
            + `bills "strutting is not resting", and #170 is what happens when that is a sentence and not a number`);
        const want = before - A.BREATHER_BACK*100;
        if(Math.abs(after - want) > 1.5)
          bad.push(`the walk took ${(before-after).toFixed(1)}% of his wind against the ${(A.BREATHER_BACK*100).toFixed(0)}% `
            + `a breather gives back — the two are supposed to be one number`);
      }
    }

    /* ---- 4. THE DOUBLING AGAINST A GREEN MAN IS ONE RULE ---- */
    {
      const G = A.ENTRANCES.grim;
      if(A.entDread(G, false) !== G.dread) bad.push(`entDread against a seasoned man is ${A.entDread(G,false)}, not ${G.dread}`);
      if(A.entDread(G, true) !== G.dread + 1) bad.push(`entDread against a green man is ${A.entDread(G,true)}, not ${G.dread+1}`);
      if(A.entDread({}, true) !== 0) bad.push(`a word with no dread was doubled anyway`);
      /* `oppGreen`'s threshold is the sand's: fewer than four wins */
      if(!(A.oppGreen({ wins:3 }) && !A.oppGreen({ wins:4 }) && !A.oppGreen({})))
        bad.push(`oppGreen does not read "fewer than four wins, and a man with no record is not green"`);
      const seasoned = A.entranceSays("grim", { wins:9 }), green = A.entranceSays("grim", { wins:1 });
      if(!seasoned.includes(String(G.dread*8))) bad.push(`grim's line does not name the ${G.dread*8} points it takes off a seasoned man`);
      if(!green.includes(String((G.dread+1)*8))) bad.push(`grim's line does not name the ${(G.dread+1)*8} it takes off a green one`);
      if(seasoned === green) bad.push(`grim reads the same against a green man as a seasoned one, and the sand does not`);
      lines.push(`grim: "${seasoned}" / against a green man: "${green}"`);
    }

    /* ---- 5. THE SALUTE PAYS EVERY PATRON, AND PAYS THEM ONCE ----
       "a bout-start effect only, never re-applied on a coached resume" is a claim the source makes
       in a comment and nothing has ever held it. A bout held at a crux goes back through the same
       door with `pending` set; if the guard ever came off, every word in the panel would pay two
       and three times over for a bout the player coached. */
    {
      const { d, g } = fixture("PAT");
      const held = A.patronsOf(d);
      if(!held.length) bad.push(`the founding house holds no patron — section 5 cannot run`);
      else {
        const want = A.ENTRANCES.boxes.favor;
        const before = held.map(x=>({ id:x.id, favor:x.favor }));
        const took = R.takeBout(d, { entrance:"boxes", singlesOnly:true, men:[g], silent:true });
        const after = before.map(b=>{ const n = A.patronsOf(d).find(x=>x.id===b.id); return n ? n.favor : null; });
        for(let i=0;i<before.length;i++)
          if(after[i] != null && after[i] < before[i].favor + want - 0.001)
            bad.push(`a patron went ${before[i].favor.toFixed(1)} → ${after[i].toFixed(1)} on a salute worth ${want}`);
        /* and again through every word the box says */
        const done = took.res && took.res.crux ? R.answer(d, took.res, "press") : null;
        const end = before.map(b=>{ const n = A.patronsOf(d).find(x=>x.id===b.id); return n ? n.favor : null; });
        for(let i=0;i<before.length;i++)
          if(end[i] != null && after[i] != null && end[i] > after[i] + 0.001)
            bad.push(`a coached bout paid the salute again: ${after[i].toFixed(1)} → ${end[i].toFixed(1)} across ${done?done.rounds:0} words from the box`);
        lines.push(`the salute paid ${before.length} patrons ${want} each — ${before.map(b=>b.favor.toFixed(0)).join("/")} → `
          + `${after.map(x=>x==null?"—":x.toFixed(0)).join("/")}, and ${done?done.rounds:0} words from the box did not pay it again`);
      }
    }

    return { bad, lines };
  });

  out.lines.push(`MEASURED, recorded not barred (test/probes/enter.mjs, test/probes/choice.mjs): the four `
    + `words were re-priced in v3.62.0 against every OTHER decision a player makes at the rail, 2,000 `
    + `bouts an arm on two seed families, every arm meeting the same men bout for bout. The best the `
    + `tactic offers is +0.5 and +3.5, the best a plan that reads him right +3.0 and +4.1, the best a `
    + `word from the box +1.8 and +4.2 — and \`showman\` was +8.5 and +9.0, twice anything else and `
    + `free, with the five wind its blurb billed measuring at nought. Its walk costs a breather now `
    + `(BREATHER_BACK, the same share waving him off gives back) and it reads +0.4 and +2.5, inside `
    + `the band the rest occupy, with the class's best spare rate. Over 24 houses of 420 weeks: `
    + `deaths a bout 17.16% with no entrance, 12.02% saluting the boxes, 13.15% working the mob, `
    + `14.97% silent and grim, at median lives of 284 / 246 / 244 / 212 weeks. \`open\`'s 60-house `
    + `signature is byte-identical, because the reference player presses no word at all. See the roadmap.`);

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
