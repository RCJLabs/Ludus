/* CAPUA VOTES WHETHER OR NOT YOU ARE IN IT — #192

   `electionWeek` opened `if(d.rome || d.over) return;`, so a house away at the imperial games had
   no vote until it came home. The agenda row `villa:council:aedileship` stayed on the villa the
   whole time with its note reading `Math.max(0, 3 - (d.week - d.election.week))` — floored at
   zero. Measured over 48 houses x 420 weeks: **143 of 1,845 open weeks past the due date, 18 of 48
   houses saw one, the longest ran 16 weeks against a designed 3, and the row read "0 weeks to the
   vote" on all 143.** Worse than the lie: a stall that outlived the year ate the NEXT election too
   — 568 elections became 598 once the guard went.

   The guard was the anomaly and the coast is the proof: `d.city` was never in it, so a house
   touring Puteoli has always voted on time. This holds both halves of that.

     THE CLOCK   the same house, driven week by week at home and at Rome, must call the vote on the
                 same week and settle it on the same week. Three weeks up, and the third is the
                 last. Not "roughly the same" — the same integers.
     THE NOTE    the row's own sub-line, read off `agenda(d)` rather than recomputed, must be the
                 three sentences the three weeks deserve. This is where the check earned its keep:
                 it went red on the HOME arm, the one meant to be the control. `electionWeek` runs
                 before the week is incremented, so the vote lands at the end of the week the note
                 called "0 weeks to the vote" — a floor hiding an off-by-one, on every election
                 ever held, at home as much as at Rome. `vote.mjs` could not see it because it only
                 counted weeks an election ran PAST its due date.
     THE GUARD   `d.over` is still in it. A house that has ended holds no election, and the check
                 asserts the half of the guard that stayed as well as the half that went.
     THE WORD    a vote that happened while the house was on the road says so in the chronicle,
                 because a player who comes home to a new aedile should be able to find out why.
*/
import { hasHandle } from "../harness.mjs";

export const name = "aedile";
export const describe = "the vote keeps its three-week clock wherever the house is, and the row never says zero";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], say = [];
    if(typeof A.ELECTION_WEEK !== "number") return { bad:["ELECTION_WEEK is not on the handle"], say };
    const EW = A.ELECTION_WEEK;

    /* the row as the panel would read it — off `agenda`, not rebuilt here, because a check that
       recomputes the sentence cannot catch the sentence being wrong */
    const row = d => { let list = [];
      try { list = A.agenda(d) || []; } catch(e){ return null; }
      return list.find(r => /aedileship is open/i.test(r.label || "")) || null; };

    /* walk one house from just before the names go up to well past the vote, recording what the
       week's list said each week. `arm` sets the house down somewhere before the window opens. */
    const walk = (seed, arm) => {
      const d = A.newGameState("Aedile","clean",seed,null);
      d.week = EW - 2;
      const notes = [], log = [];
      let called = null, settled = null, upWeeks = 0;
      for(let i=0; i<10; i++){
        arm(d, i);
        try { A.endWeek(d); } catch(e){ bad.push(`endWeek threw in ${seed}: ${e.message}`); break; }
        const r = row(d);
        if(r){ upWeeks++; notes.push(`w${d.week}:${r.sub}`); }
        if(d.election && !d.election.done && called == null) called = d.election.week;
        if(d.election && d.election.done && settled == null) settled = d.week;
        for(const e of (d.log||[]).slice(0, 3)) if(!log.includes(e.text)) log.push(e.text);
      }
      return { d, called, settled, upWeeks, notes, log, aedile: !!d.aedile };
    };

    const HOME = walk("AEDILE-1", ()=>{});
    /* at Rome for the whole window — travel first, then the sand, the way the trip really runs */
    const ROME = walk("AEDILE-1", (d, i)=>{
      if(!d.rome) d.rome = { travel:2, fought:0, won:0, turned:false, run:1, due:d.week+14 };
      if(d.rome.travel > 0) d.rome.travel--;
    });

    say.push(`at home: called w${HOME.called}, settled w${HOME.settled}, the row up ${HOME.upWeeks} weeks — ${HOME.notes.join(" · ")}`);
    say.push(`at Rome: called w${ROME.called}, settled w${ROME.settled}, the row up ${ROME.upWeeks} weeks — ${ROME.notes.join(" · ")}`);

    if(HOME.called !== ROME.called)
      bad.push(`the names go up on week ${HOME.called} at home and week ${ROME.called} from Rome — the ballot is still waiting for the lanista`);
    if(HOME.settled !== ROME.settled)
      bad.push(`the vote settles on week ${HOME.settled} at home and week ${ROME.settled} from Rome — #192 is back`);
    if(HOME.upWeeks !== ROME.upWeeks)
      bad.push(`the row stands ${HOME.upWeeks} weeks at home and ${ROME.upWeeks} from Rome`);
    if(ROME.upWeeks !== 3)
      bad.push(`the row stood ${ROME.upWeeks} weeks from Rome — the design is three`);
    if(!ROME.aedile) bad.push("no aedile was seated after a vote taken while the house was at Rome");
    /* the exact three sentences, in order — not "does not contain a zero", which a reworded
       floor would still pass */
    const WANT = ["2 weeks to the vote", "1 week to the vote", "the vote is this week"];
    for(const arm of [["home",HOME],["Rome",ROME]]){
      const got = arm[1].notes.map(n => n.split(":").slice(1).join(":"));
      if(got.join(" | ") !== WANT.join(" | "))
        bad.push(`the ${arm[0]} row read [${got.join(" | ")}] over its three weeks, wanted [${WANT.join(" | ")}]`);
    }

    /* the word, so a player who comes home to a new aedile can find out why */
    const told = ROME.log.some(t => /while (the house was )?on the road|could not find you|Word comes from Capua/i.test(t));
    say.push(`the chronicle names the absence: ${told}`);
    if(!told) bad.push("a vote taken while the house was away is not named in the chronicle — the player has a new aedile and no way to learn how");

    /* and the half of the guard that STAYED */
    { const d = A.newGameState("Aedile","clean","AEDILE-2",null);
      d.week = EW - 2; d.over = { kind:"ruin" };
      for(let i=0;i<6;i++){ try { A.endWeek(d); } catch(e){} }
      say.push(`a house that has ended: election ${d.election ? "CALLED" : "not called"}`);
      if(d.election) bad.push("an ended house called an election — `d.over` has dropped out of the guard"); }

    return { bad, say };
  });

  const fails = out.bad;
  const lines = out.say.slice();
  if(!fails.length) lines.push("the clock is the same integers at home and at Rome, and the row never reaches zero");
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
