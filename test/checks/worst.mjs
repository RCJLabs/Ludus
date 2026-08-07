/* newBook() has always initialised four superlatives: best, longest, biggest and
   worst. bookBout wrote three of them. `worst` was never written by anything and
   never read by anything — an empty slot in every save this game has ever produced,
   sitting in the middle of the record book looking deliberate.

   It is filled now, and the reason it was easier to leave empty is worth keeping:
   the book records the purse the house TOOK, and a defeat pays nothing, so ranking
   defeats by purse ranks every one of them at zero. The book needed the figure that
   was on the table, not the one that was collected, and no caller was passing it.
   All four now do.

   What it says: cost, not humiliation, and a man outranks a purse. Any night that
   buried one of yours beats any night that did not, however much was on offer; among
   nights of the same kind, the bigger stake wins. A victory can therefore be the
   worst night in the book — a card taken at the price of your best man is precisely
   the one a house does not talk about afterwards.

   This check holds the ordering and holds the honesty: what the book calls the worst
   night has to be a night that actually happened, with the numbers the bout was
   actually fought for. An entry nobody can check is how the slot got empty. */

import { hasHandle } from "../harness.mjs";

export const name = "worst";
export const describe = "the book names the night the house would rather forget";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;

    /* 1. the ordering, stated as a table of cases against a book fed by hand */
    const feed = rows => { const d = { week:1, book:A.newBook() };
      for(const r of rows){ d.week = r.week || d.week; A.bookBout(d, r); }
      return d.book.worst; };
    const cases = [];
    const say = (label, got, want) => cases.push({ label, got, want, ok: got === want });

    say("the bigger stake, both lost",
      (feed([{ name:"A", stake:400 }, { name:"B", stake:900 }, { name:"C", stake:120 }])||{}).name, "B");
    say("a death beats any purse",
      (feed([{ name:"A", stake:9000 }, { name:"B", stake:60, died:true }])||{}).name, "B");
    say("and it still beats it in the other order",
      (feed([{ name:"B", stake:60, died:true }, { name:"A", stake:9000 }])||{}).name, "B");
    say("among deaths, the bigger stake",
      (feed([{ name:"A", stake:200, died:true }, { name:"B", stake:1400, died:true }])||{}).name, "B");
    say("a win that buried a man is the worst night there is",
      (feed([{ name:"A", stake:5000 }, { name:"B", stake:300, died:true, win:true }])||{}).name, "B");
    say("a win nobody was hurt in is not a bad night at all",
      (feed([{ name:"A", stake:400 }, { name:"B", stake:9000, win:true }])||{}).name, "A");
    say("a book of nothing but clean wins names nobody",
      feed([{ name:"A", stake:9000, win:true }, { name:"B", stake:400, win:true }]), null);
    say("an empty book names nobody", feed([]), null);

    /* 2. and it fills from the sand, through all four engines, on a house that plays */
    const av = f => (f.str+f.agi+f.end+f.tec+f.sho+f.dis)/6;
    const fin=(fn,a,re)=>{ let x=fn(...a); if(x&&x.crux){const pd=x.pending;pd.beats=x.beats;x=fn(...re(pd));} return (x&&!x.crux)?x:null; };
    const houses = [];
    for(let r=0;r<3;r++){
      const d = A.newGameState("Worst"+r,"clean","WORST_"+r,null);
      const stakes = [];              /* every purse that was ever on the table */
      let deaths = 0;
      for(let w=0;w<120;w++){
        d.gold = Math.max(d.gold, 15000);
        while(A.activeG(d).length<6 && !A.rosterFull(d)){
          const m=(d.market||[])[0]; if(!m || !A.buyFromBlock(d,m.id,null)) break; }
        /* not sine missione, and not the fattest purse on the card either — a probe
           that takes every death-match buries six men in nine bouts, and then every
           worst night in the book is a death and the purse branch is never seen */
        const os=((d.games&&d.games.offers)||[]).filter(o=>o.stakes!=="sine");
        const fit=A.activeG(d).filter(g=>!g.injury&&(g.fatigue||0)<58).sort((x,z)=>av(z)-av(x));
        const best=os.filter(o=>fit.length && (!(o.pair||o.melee)||fit.length>=2))
          .sort((a,c)=>(a.purse||0)-(c.purse||0))[Math.floor(os.length/2)] ||
          os.filter(o=>fit.length && (!(o.pair||o.melee)||fit.length>=2))[0];
        if(best){
          const dead0 = (d.fallen||[]).length;
          try{
            if(best.pair) fin(A.doPairFight,[d,[fit[0].id,fit[1].id],best,"measured",null,null],pd=>[d,[fit[0].id,fit[1].id],best,"measured",pd,null]);
            else if(best.melee){ const ids=fit.slice(0,3).map(g=>g.id); fin(A.doMelee,[d,ids,best,null,null,"measured"],pd=>[d,ids,best,pd,"finish","measured"]); }
            else if(best.venatio) fin(A.doVenatio,[d,fit[0].id,best,"measured",null,null],pd=>[d,fit[0].id,best,"measured",pd,null]);
            else fin(A.doFight,[d,fit[0].id,best,"measured",null,null,null,"none"],pd=>[d,fit[0].id,best,"measured",null,pd,null,"none"]);
            stakes.push(best.purse||0);
            deaths += (d.fallen||[]).length - dead0;
          }catch(e){}
        }
        if(d.pendingEvent){ try{ A.EVENTS[d.pendingEvent.id].run(d,d.pendingEvent,0); }catch(e){} d.pendingEvent=null; }
        try{ A.endWeek(d); }catch(e){ break; }
        if(d.over) break;
      }
      const B = d.book || A.newBook();
      houses.push({ bouts:B.n, deaths, worst:B.worst, biggest:B.biggest, longest:B.longest,
        topStake: stakes.length ? Math.max(...stakes) : 0, week:d.week });
    }
    return { cases, houses };
  });

  const lines = [], fails = [];
  lines.push(`the ordering, on a book fed by hand:`);
  for(const c of out.cases)
    lines.push(`   ${c.ok ? "✓" : "✗"} ${c.label.padEnd(46)} named ${c.got === null ? "nobody" : c.got}`);
  for(const c of out.cases)
    if(!c.ok) fails.push(`${c.label}: the book named ${c.got === null ? "nobody" : c.got}, not ${c.want === null ? "nobody" : c.want}`);

  lines.push(`and from the sand, three houses:`);
  for(const h of out.houses){
    const w = h.worst;
    lines.push(`   ${String(h.bouts).padStart(3)} bouts to week ${h.week}, ${h.deaths} buried — ` +
      (w ? `worst: ${w.died ? (w.fell||"a man") : w.stake+"d"}, ${w.name} at ${w.festival} in week ${w.week}${w.won?" (a night it won)":""}`
         : "NOTHING NAMED"));
    if(!h.bouts) continue;
    if(!w){ fails.push(`a house fought ${h.bouts} bouts and the book named no worst night at all — the slot is still empty`); continue; }
    /* it has to be a night that could have happened */
    if(w.week > h.week) fails.push(`the worst night is filed in week ${w.week} of a campaign that reached week ${h.week}`);
    if(!w.name) fails.push(`the worst night has no name on it`);
    if(!w.died && w.stake <= 0) fails.push(`the worst night was for ${w.stake}d and buried nobody — that is not a worst night, it is a blank`);
    /* and the figure must be one that was actually on a card */
    if(!w.died && w.stake > h.topStake)
      fails.push(`the book says ${w.stake}d was lost where the richest card all campaign was ${h.topStake}d`);
    /* a house that buried men must have its worst night be one of them */
    if(h.deaths > 0 && !w.died)
      fails.push(`${h.deaths} men were buried and the book's worst night is a ${w.stake}d purse — a man is supposed to outrank a purse`);
    /* a clean win is never the worst night — that is the row above it */
    if(w.won && !w.died)
      fails.push(`the book's worst night is a bout the house won with nobody hurt (${w.stake}d at ${w.festival})`);
    /* and the two entries beside it have to carry a name too. The pair engine went
       fifty versions filing its bouts under nobody, which is how this was noticed. */
    if(h.biggest && !h.biggest.name) fails.push(`the largest purse in the book has no name on it`);
    if(h.longest && !h.longest.name) fails.push(`the longest bout in the book has no name on it`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
