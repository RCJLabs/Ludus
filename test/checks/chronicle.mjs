/* The chronicle is the only place a campaign gets told back to you, and it had a
   sentence in it that ran every single week.

   Measured across three twelve-year campaigns before this check existed: 3,054
   lines, of which 648 — twenty-one per cent of everything the chronicle ever
   wrote — were "Week 41. Upkeep paid: 70 denarii." One receipt, sat among the
   deaths and the graffiti and the men sold at the gate, saying the same thing
   every time, while the week's digest already totalled the coin. Below it sat
   twenty more shapes used ten times or more, together a third of the whole.

   The ledger speaks when the number moves now, and the beats that wear through
   fastest have more than one sentence each. This check keeps it that way: it
   runs campaigns, strips names and numbers out of every line to leave the
   sentence's skeleton, and fails if any one skeleton is doing too much of the
   talking. It is deliberately about proportion rather than counts, so it does
   not go stale when the sample changes. */

import { hasHandle } from "../harness.mjs";

export const name = "chronicle";
export const describe = "no one sentence does the chronicle's talking";

const HOUSES = 2;
const WEEKS  = 150;
const MAX_SHARE = 4.0;   // percent of all lines any single shape may account for
const MAX_HEAVY = 6;     // how many shapes may exceed one per cent

/* strip the numbers and the proper nouns; what is left is the sentence itself */
const shape = t => t
  .replace(/[0-9]+/g, "#")
  .replace(/(?!^)\b[A-Z][a-z]{2,}\b/g, "~")
  .replace(/\s+/g, " ").trim().slice(0, 90);

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const seen = await p.evaluate(({ HOUSES, WEEKS })=>{
    const A = window.__LVDVS;
    const av = f => (f.str+f.agi+f.end+f.tec+f.sho+f.dis)/6;
    const out = [];
    for(let r=0;r<HOUSES;r++){
      const d = A.newGameState("Chron"+r, "clean", "CHRON_"+r, null);
      const fin = (fn,a,re)=>{ let s=fn(...a);
        /* #116: to exhaustion; one word left 26.8% of standard bouts unresolved and unwritten */
        { let n=0; while(s&&s.crux&&n++<4){ const pd=s.pending; pd.beats=s.beats; s=fn(...re(pd)); } }
        return (s&&!s.crux)?s:null; };
      const mine = new Set();
      for(let w=0;w<WEEKS;w++){
        d.gold = 250000;
        while(A.activeG(d).length<7 && !A.rosterFull(d)){
          const m=(d.market||[])[0]; if(!m || !A.buyFromBlock(d, m.id, null)) break; }
        if(d.unrest>=26) A.throwFeast(d);
        if(w%6===0) A.walkTheCells(d);
        const fit = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0)<55).sort((x,z)=>av(z)-av(x));
        const offers = (d.games&&d.games.offers)||[];
        const best = offers.filter(o=>{ if(!fit.length) return false;
          if(o.pair||o.melee) return fit.length>=2; return true; })
          .sort((a,c)=>(c.purse||0)-(a.purse||0))[0];
        if(best && fit.length){
          if(best.pair) fin(A.doPairFight,[d,[fit[0].id,fit[1].id],best,"measured",null,null],pd=>[d,[fit[0].id,fit[1].id],best,"measured",pd,null]);
          else if(best.melee){ const ids=fit.slice(0,3).map(g=>g.id);
            fin(A.doMelee,[d,ids,best,null,null,"measured"],pd=>[d,ids,best,pd,"finish","measured"]); }
          else if(best.venatio) fin(A.doVenatio,[d,fit[0].id,best,"measured",null,null],pd=>[d,fit[0].id,best,"measured",pd,null]);
          else fin(A.doFight,[d,fit[0].id,best,"measured",null,null,null,"none"],pd=>[d,fit[0].id,best,"measured",null,pd,null,"none"]);
        } else if(fit.length){
          const card = A.pitMen(d), rank = card.slice().sort((x,z)=>av(z)-av(x));
          const o = A.makePitOffer(d, fit[0], "standard", rank.length?rank[0].id:null);
          fin(A.doFight,[d,fit[0].id,o,"measured",null,null,null,"none"],pd=>[d,fit[0].id,o,"measured",null,pd,null,"none"]);
        }
        if(d.pendingEvent){ try{ A.EVENTS[d.pendingEvent.id].run(d,d.pendingEvent,0); }catch(e){} d.pendingEvent=null; }
        A.activeG(d).forEach(g=>{ g.regimen = (g.injury || (g.fatigue||0)>=50) ? "rest" : "palus"; });
        try { A.endWeek(d); } catch(e){ break; }
        for(const l of A.chronAll(d).slice(0, 14)) mine.add(l.text);
        if(d.over){ d.over=null; if(d.rebellion) d.rebellion=null; d.unrest=Math.min(d.unrest,40); }
      }
      out.push([...mine]);
    }
    return out;
  }, { HOUSES, WEEKS });

  const tally = {}, sample = {};
  for(const run of seen) for(const t of run){
    const k = shape(t); tally[k] = (tally[k]||0)+1; if(!sample[k]) sample[k] = t;
  }
  const rows = Object.entries(tally).sort((a,b)=>b[1]-a[1]);
  const total = rows.reduce((n,r)=>n+r[1], 0);
  if(!total) return { pass:false, why:"the chronicle wrote nothing at all", lines:[] };
  const share = n => n/total*100;

  const lines = [];
  lines.push(`${rows.length} distinct sentences across ${total} lines, ${HOUSES} houses × ${WEEKS} weeks`);
  const heavy = rows.filter(r => share(r[1]) >= 1);
  lines.push(`${heavy.length} shapes account for 1% or more of the chronicle, ${(heavy.reduce((n,r)=>n+r[1],0)/total*100).toFixed(0)}% of it between them`);
  for(const [k,n] of rows.slice(0,6))
    lines.push(`   ${share(n).toFixed(1).padStart(4)}%  ×${String(n).padStart(3)}  ${sample[k].slice(0,84)}`);

  const fails = [];
  const [topKey, topN] = rows[0];
  if(share(topN) > MAX_SHARE)
    fails.push(`one sentence is ${share(topN).toFixed(1)}% of the whole chronicle (cap ${MAX_SHARE}%): "${sample[topKey].slice(0,70)}"`);
  if(heavy.length > MAX_HEAVY)
    fails.push(`${heavy.length} shapes are each over 1% of the chronicle (cap ${MAX_HEAVY}) — the texture is wearing thin`);
  if(errors.length) fails.push(`${errors.length} page errors`);

  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
