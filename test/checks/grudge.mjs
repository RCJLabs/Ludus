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
   invert, because the three are an escalation and want to stay one.

   AND THE WHOLE CARD, not one bout a week. The v2.51 consolidation pass caught
   this check crying wolf a second time: its p99 fell from 62.8 to 28.7 on a build
   whose only relevant change made the slave market a little weaker, and it
   declared all three gates unreachable. They are not — the same session's campaign
   censuses fired sabotage eight times, a bribed editor ten and cudgels at the gate
   eight, in ordinary play. The fault was the instrument: it took the single best
   offer each week, where a real house takes every bout it can field a man for, so
   it generated a fraction of the rival contact — and a grudge is spiked +20 by
   killing one of their men, which is a thing that happens on the cards this check
   was declining. It fights the whole card now, and the distribution it reports is
   the one a playing house actually produces.

   Nine houses, not three. With three fixed seeds the ninety-ninth percentile is
   set by the single angriest streak in the sample, and any change that reorders
   the RNG stream anywhere upstream swaps that streak for a different one — at
   v2.45.0 the same build measured p99 34 on the three old seeds and 63 across
   nine fresh ones, and the check cried wolf on a distribution that had not
   narrowed (A/B against v2.44.0: p99 61.9 old, 63.2 new; the median actually
   rose 4.5 → 14.8, because a decreed season keeps the in-form hunting line
   warm). Nine houses puts ~1,350 samples under the percentile instead of ~450,
   which is the difference between measuring the tail and measuring one story. */

import { hasHandle } from "../harness.mjs";

export const name = "grudge";
export const describe = "a rival's anger reaches the events that wait on it";

const WEEKS = 150, HOUSES = 9;

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
        /* every bout the house can field a man for, rival cards first — one man
           to one bout a week, which is the rule the arena itself enforces */
        let pool = fit.slice();
        for(const o of usable.sort((a,c)=> (c.oppRef?1:0)-(a.oppRef?1:0) || (c.purse||0)-(a.purse||0))){
          pool = pool.filter(g=>g.status==="active" && !g.injury && (g.lastFought==null || g.lastFought<d.week));
          if(!pool.length) break;
          if((o.pair||o.melee) && pool.length<2) continue;
          if(o.pair) fin(A.doPairFight,[d,[pool[0].id,pool[1].id],o,"measured",null,null],pd=>[d,[pool[0].id,pool[1].id],o,"measured",pd,null]);
          else if(o.melee){ const ids=pool.slice(0,Math.min(3,pool.length)).map(g=>g.id); fin(A.doMelee,[d,ids,o,null,null,"measured"],pd=>[d,ids,o,pd,"finish","measured"]); }
          else if(o.venatio) fin(A.doVenatio,[d,pool[0].id,o,"measured",null,null],pd=>[d,pool[0].id,o,"measured",pd,null]);
          else fin(A.doFight,[d,pool[0].id,o,"measured",null,null,null,"none"],pd=>[d,pool[0].id,o,"measured",null,pd,null,"none"]);
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
    const gates = { sabotage:A.GRUDGE_SABOTAGE, bribedEditor:A.GRUDGE_BRIBE, thugs:A.GRUDGE_THUGS };
    /* the share of weeks each gate is actually open. This is the figure the check
       is really about — a gate open in no week is unreachable, a gate open in every
       week is not a gate — and unlike a tail percentile it does not move when
       something upstream reorders the RNG or shifts the policy a little. */
    const share = {};
    for(const [k,at] of Object.entries(gates))
      share[k] = +(100 * dist.filter(x=>x>=at).length / Math.max(1,dist.length)).toFixed(1);
    return { gates, share,
      p50:q(0.5), p90:q(0.90), p97:q(0.97), p99:q(0.99), top:+Math.max(...dist).toFixed(1),
      fired, weeks:dist.length };
  }, { WEEKS, HOUSES });

  const lines = [], fails = [];
  lines.push(`the angriest house in Capua, over ${out.weeks} weeks: median ${out.p50} · 90th ${out.p90} · 97th ${out.p97} · 99th ${out.p99} · highest ${out.top}`);
  lines.push(`the gates: sabotage ${out.gates.sabotage} · a bribed editor ${out.gates.bribedEditor} · thugs ${out.gates.thugs}`);
  lines.push(`each gate stands open: sabotage ${out.share.sabotage}% of weeks · a bribed editor ${out.share.bribedEditor}% · cudgels ${out.share.thugs}%`);

  /* ---- ASSERT THE PROPERTY, NOT THE PERCENTILE ----
     This check twice cried wolf inside one session, in opposite directions, on
     builds whose only relevant change was upstream of it: once when a reordered
     RNG stream swapped away its one angry streak (p99 34 against 63 on nine fresh
     seeds), and once when its own policy was corrected to fight the whole card
     and the distribution moved up under gates that had not moved at all. A tail
     percentile of a heavy-tailed level is not a stable thing to pin a gate to, and
     test/README.md says what to do about that: assert the property instead.

     The property is that each gate is a gate — open sometimes, not never and not
     always — and that the three remain an escalation. */
  const g = out.gates, sh = out.share;
  for(const [name, at] of Object.entries(g)){
    if(at == null) { fails.push(`${name}'s gate is not exposed`); continue; }
    if(sh[name] <= 0)
      fails.push(`${name} waits at ${at} and no week in ${out.weeks} ever reached it — it is unreachable`);
    if(sh[name] >= 85)
      fails.push(`${name}'s gate at ${at} is open in ${sh[name]}% of weeks — that is not a gate, it is the weather`);
  }
  /* the three are an escalation and want to stay one */
  if(!(g.sabotage < g.bribedEditor && g.bribedEditor < g.thugs))
    fails.push(`the three gates are not in order: ${g.sabotage}, ${g.bribedEditor}, ${g.thugs}`);
  if(g.thugs - g.sabotage < 6)
    fails.push(`only ${g.thugs-g.sabotage} points separate the mildest from the worst — the escalation has collapsed`);
  /* and the escalation has to be felt as one: the worst must stay rarer than the mildest */
  if(!(sh.thugs < sh.sabotage))
    fails.push(`cudgels at the gate are open in ${sh.thugs}% of weeks against sabotage's ${sh.sabotage}% — the worst of the three is not the rarest`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
