/* Three written events wait on a rival house's anger: a man in your armoury at
   night, a bribed editor, and cudgels at your gate. They were gated at grudge 30,
   50 and 65.

   Measured week by week over 864 weeks of careful play, the angriest house in
   Capua sits at a median of 1.9, reaches 12.3 at the ninetieth percentile and 25.8
   at the ninety-ninth, and never once passed 27. All three gates were above the
   ceiling of the number they read, so none of them had ever happened to anybody —
   and nothing said so, because an event that never fires looks exactly like an
   event that is merely rare.

   This check runs campaigns, watches where the number actually goes, and fails if
   a gate has drifted above it. It also fails if the gates collapse together or
   invert, because the three are an escalation and want to stay one. */

import { hasHandle } from "../harness.mjs";

export const name = "grudge";
export const describe = "a rival's anger reaches the events that wait on it";

const WEEKS = 150, HOUSES = 3;

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(({WEEKS,HOUSES})=>{
    const A = window.__LVDVS;
    const av = f => (f.str+f.agi+f.end+f.tec+f.sho+f.dis)/6;
    const dist = [], fired = {};
    for(let r=0;r<HOUSES;r++){
      const d = A.newGameState("Gr"+r, "clean", "GRUDGE_"+r, null);
      const fin=(fn,a,re)=>{ let x=fn(...a); if(x&&x.crux){const pd=x.pending;pd.beats=x.beats;x=fn(...re(pd));} return (x&&!x.crux)?x:null; };
      for(let w=0;w<WEEKS;w++){
        d.gold = Math.max(d.gold, 30000);
        while(A.activeG(d).length<8 && !A.rosterFull(d)){
          const m=(d.market||[])[0]; if(!m || !A.buyFromBlock(d,m.id,null)) break; }
        if(d.unrest>=22) A.throwFeast(d);
        const fit = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0)<58).sort((x,z)=>av(z)-av(x));
        const offers = (d.games&&d.games.offers)||[];
        /* a rivalry is fed by fighting the same house — take the rival bout when
           there is one, which is the behaviour the grudge is meant to answer */
        const usable = offers.filter(o=>o.stakes!=="sine").filter(o=>{ if(!fit.length) return false;
          if(o.pair||o.melee) return fit.length>=2; return true; });
        const best = usable.sort((a,c)=> (c.oppRef?1:0)-(a.oppRef?1:0) || (c.purse||0)-(a.purse||0))[0];
        if(best){
          if(best.pair) fin(A.doPairFight,[d,[fit[0].id,fit[1].id],best,"measured",null,null],pd=>[d,[fit[0].id,fit[1].id],best,"measured",pd,null]);
          else if(best.melee){ const ids=fit.slice(0,3).map(g=>g.id); fin(A.doMelee,[d,ids,best,null,null,"measured"],pd=>[d,ids,best,pd,"finish","measured"]); }
          else if(best.venatio) fin(A.doVenatio,[d,fit[0].id,best,"measured",null,null],pd=>[d,fit[0].id,best,"measured",pd,null]);
          else fin(A.doFight,[d,fit[0].id,best,"measured",null,null,null,"none"],pd=>[d,fit[0].id,best,"measured",null,pd,null,"none"]);
        }
        A.pairTheYard(d);
        if(d.pendingEvent){ fired[d.pendingEvent.id] = (fired[d.pendingEvent.id]||0)+1;
          try{ A.EVENTS[d.pendingEvent.id].run(d,d.pendingEvent,0); }catch(e){} d.pendingEvent=null; }
        try{ A.endWeek(d); }catch(e){ break; }
        dist.push(Math.max(0, ...(d.rivals||[]).map(h=>h.grudge||0)));
        if(d.over){ d.over=null; if(d.rebellion) d.rebellion=null; d.unrest=Math.min(d.unrest,35); }
      }
    }
    dist.sort((a,b)=>a-b);
    const q = x => +(dist[Math.min(dist.length-1, Math.floor(dist.length*x))]||0).toFixed(1);
    return { gates: { sabotage:A.GRUDGE_SABOTAGE, bribedEditor:A.GRUDGE_BRIBE, thugs:A.GRUDGE_THUGS },
      p50:q(0.5), p90:q(0.90), p97:q(0.97), p99:q(0.99), top:+Math.max(...dist).toFixed(1),
      fired, weeks:dist.length };
  }, { WEEKS, HOUSES });

  const lines = [], fails = [];
  lines.push(`the angriest house in Capua, over ${out.weeks} weeks: median ${out.p50} · 90th ${out.p90} · 97th ${out.p97} · 99th ${out.p99} · highest ${out.top}`);
  lines.push(`the gates: sabotage ${out.gates.sabotage} · a bribed editor ${out.gates.bribedEditor} · thugs ${out.gates.thugs}`);

  const g = out.gates;
  for(const [name, at] of Object.entries(g)){
    if(at == null) { fails.push(`${name}'s gate is not exposed`); continue; }
    if(at > out.top)
      fails.push(`${name} waits at ${at} and the angriest rival ever measured reached ${out.top} — it cannot happen to anybody`);
  }
  /* the three are an escalation and want to stay one */
  if(!(g.sabotage < g.bribedEditor && g.bribedEditor < g.thugs))
    fails.push(`the three gates are not in order: ${g.sabotage}, ${g.bribedEditor}, ${g.thugs}`);
  if(g.thugs - g.sabotage < 6)
    fails.push(`only ${g.thugs-g.sabotage} points separate the mildest from the worst — the escalation has collapsed`);
  /* and the top one must sit high enough to stay rare */
  if(g.thugs < out.p90)
    fails.push(`thugs waits at ${g.thugs}, below the ninetieth percentile of ${out.p90} — cudgels at the gate should be rare`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
