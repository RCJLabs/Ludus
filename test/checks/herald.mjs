/* THE CROWN OF CAPUA, AND THE WEEK THAT NEVER MENTIONED IT

   (Named `herald`, not `crown`. `crown` is taken — by the check that drives the primacy ITSELF:
   won, held, lost. I overwrote it writing this one, which is about the primacy being ANNOUNCED,
   and the tell was the same as last time: the suite reported 85 checks after I had supposedly
   added an 86th. Twice in one session. `bulk` now asserts that every check's declared name
   matches its filename and that no two share one, so a third time fails loudly instead of
   deleting a check and going green.)

   `silent` drove nine late systems against both channels a week can speak through — the agenda's
   list and the SECT_MARK vocabulary. Eight of them use at least one. The primacy uses NEITHER:
   485 live weeks, 0 agenda lines, 0 marks. (The collegium reads 0% on the agenda and 100% on the
   marks. That is a voice, and calling it silent was my error, not the game's.)

   Then the arena itself, over 10 houses x 420 weeks:

       the primus bout was on the card             93 times
       the week's list named it                     0 times
       weeks the primacy was challengeable, unsaid 588
       weeks the house actually held the crown       2

   The card row reads "the Ludi Romani · 3 on the card" whether the third of those is a plain bout
   or the first man in the city. A player who works the morning list took the crown twice in four
   thousand weeks, and not because it is hard.

   WHAT THIS HOLDS, and the trap in each:

     NAMED. A card carrying the primus bout raises a row that says so, at urgency 3, because it
       expires when the week does. Driven on a forged card rather than by playing until one turns
       up: 93 in 4,200 house-weeks is too rare to wait for, and a check that waits for it would pass
       green on the weeks it never came.
     BOTH NIGHTS. The defence branch fired ZERO times in the whole measurement, because the
       reference house never holds the crown long enough to defend it. Untested code that looks
       tested is the fault this suite keeps finding, so the fixture forges a held primacy too.
     NOT FURNITURE. Being *able* to challenge is true for 588 weeks, and a row standing for 588
       weeks is what the bay already is — named on 100% of 1,100 live weeks and never once urgent.
       So a house that is merely eligible, with no card up, must raise NOTHING.
*/
import { found, clearAll, hasHandle, inside } from "../harness.mjs";

export const name = "herald";
export const describe = "when the first man in the city is on the card, the week says so";

export async function run({ p, errors }){
  const lines = [], fails = [];
  await found(p, { seed:"CROWN" });
  await clearAll(p);
  if(!await hasHandle(p)) return { pass:false, why:"no handle on the page", lines };

  const out = await inside(p, ()=>{
    const A = window.__LVDVS;
    const say = d => A.agenda(d).map(x=>({ u:x.urgency, tab:x.tab,
      t:String(x.label||""), s:String(x.sub||"") }));
    /* a house with a man good enough to challenge, and a rival holding the crown */
    const base = ()=>{
      const d = A.newGameState("Crown","clean","CROWN",null);
      d.gold = 9000; d.fame = 4000; d.week = 60;
      for(const g of A.activeG(d)){ g.wins = 14; g.pfame = 90; g.fatigue = 0; g.lastFought = -9; }
      if(!d.primus) A.seedPrimus ? A.seedPrimus(d) : null;
      if(!d.primus) d.primus = { mine:false, house:"Ovidius", fid:1, name:"Gnaeus", cls:"Murmillo", since:1, defences:0 };
      return d;
    };
    const R = {};

    /* 1. eligible, no card up — must say nothing about the crown */
    { const d = base(); d.games = null; R.idle = say(d); }

    /* 2. the crown on the card */
    { const d = base();
      d.games = { festival:"the Ludi Romani", week:d.week, offers:[
        { id:9001, tier:3, festival:"the primacy of Capua", primus:true,
          opp:{ name:"Gnaeus", cls:"Murmillo", wins:20, pfame:95 }, stakes:"standard", purse:1600 },
        { id:9002, tier:1, festival:"the Ludi Romani", opp:{ name:"Some Man", cls:"Thraex" }, stakes:"standard", purse:200 },
      ] };
      R.challenge = say(d); }

    /* 3. the house HOLDS it and must defend — the branch that never fired in 4,200 house-weeks */
    { const d = base();
      const mine = A.activeG(d)[0];
      d.primus = { mine:true, gid:mine.id, name:mine.name, cls:mine.cls, since:d.week-20, defences:1 };
      d.games = { festival:"the Ludi Romani", week:d.week, offers:[
        { id:9003, tier:3, festival:"the primacy of Capua", primus:true, defence:true,
          opp:{ name:"Bituitus", cls:"Secutor", wins:12, pfame:80 }, stakes:"standard", purse:1400 },
      ] };
      R.defend = say(d); R.holderName = mine.name; }

    return R;
  });

  const crownRows = rows => rows.filter(r=>/primacy|crown of capua/i.test(r.t));
  const show = rows => rows.map(r=>`u${r.u} ${r.tab} "${r.t}" — ${r.s}`).join(" | ") || "(none)";

  /* NOT FURNITURE */
  const idle = crownRows(out.idle);
  lines.push(`eligible, no card up: ${show(idle)}`);
  if(idle.length)
    fails.push(`a house that is merely able to challenge raises ${idle.length} crown row(s) — being eligible is true for 588 weeks and a row that stands that long is furniture, not news`);

  /* NAMED */
  const ch = crownRows(out.challenge);
  lines.push(`the crown on the card: ${show(ch)}`);
  if(!ch.length)
    fails.push("the primacy is on this week's card and the morning list does not mention it — the card row says only \"3 on the card\", which is what let a played house take the crown twice in four thousand weeks");
  else {
    if(!ch.some(r=>r.u >= 3))
      fails.push(`the crown row sits at urgency ${Math.max(...ch.map(r=>r.u))} — it expires with the week, so it belongs with what is due`);
    if(!ch.some(r=>r.tab === "arena"))
      fails.push(`the crown row points at "${ch[0].tab}" — the bout is on the arena's card`);
    if(!ch.some(r=>/holds it|first man/i.test(r.s)))
      fails.push(`the crown row does not say who holds it (sub reads "${ch[0].s}")`);
  }

  /* BOTH NIGHTS */
  const df = crownRows(out.defend);
  lines.push(`holding it, a defence on the card: ${show(df)}`);
  if(!df.length)
    fails.push("the house holds the primacy and a defence is on the card, and the week says nothing — this branch fired ZERO times in the whole measurement, so nothing but a forged fixture can hold it");
  else {
    if(!df.some(r=>/defend/i.test(r.t)))
      fails.push(`the defence night reads "${df[0].t}" — it is not a challenge, it is the crown being taken off you`);
    if(!df.some(r=>r.u >= 3))
      fails.push("the defence row is not urgent, and a forfeit is as final as a loss");
    if(out.holderName && !df.some(r=>r.s.includes(out.holderName)))
      fails.push(`the defence row does not name the man defending (${out.holderName})`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
