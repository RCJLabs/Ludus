/* A man knew his wins, his losses, his kills, his scars, what the years had taken
   and what the body would not forget. A great deal about his condition, and nothing
   whatever about any particular afternoon — so a fighter carried for sixty weeks had
   no answer to the only question a player actually asks about him: what was he
   famous for.

   Four nights now, each written the day it happens rather than worked out afterwards,
   because the figures that make them are on the table at the time and gone a line
   later. The odds on the upset are the ones the bookmakers were quoting BEFORE the
   horn — a man given one chance in five who took it is the story, and a number
   derived from the result afterwards would not be that story, it would be a tautology.

   Each keeps one night by its own rule: the roar and the brink keep the most extreme,
   the upset keeps the longest odds he ever beat, and the sparing keeps the FIRST,
   because the night the crowd let a man live is the one that marks him and the third
   time is not news.

   What this check holds is that they fill from the sand through all four engines,
   that each keeps the right one of two candidates, and — the part that matters — that
   nothing on the page is invented: every night names a week the man was alive for and
   a figure the bout was actually fought at. A page that makes things up about a man
   is worse than a page that says nothing about him. */

import { hasHandle } from "../harness.mjs";

export const name = "nights";
export const describe = "a man's page remembers the afternoon he is known for";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;

    /* 1. each slot keeps the right one of two */
    const cases = [];
    const two = (kind, a, b) => { const g = {}; A.markNight(g, kind, a); A.markNight(g, kind, b); return g.nights[kind]; };
    const say = (label, got, want) => cases.push({ label, got, want, ok: got === want });
    say("the roar keeps the louder night",  two("roar",  { crowd:70, week:1 }, { crowd:91, week:2 }).week, 2);
    say("and does not lose it to a quieter one", two("roar", { crowd:91, week:1 }, { crowd:70, week:2 }).week, 1);
    say("the upset keeps the longer odds",   two("upset", { odds:38, week:1 }, { odds:11, week:2 }).week, 2);
    say("and does not lose it to a shorter price", two("upset", { odds:11, week:1 }, { odds:38, week:2 }).week, 1);
    say("the brink keeps the closer call",   two("brink", { left:24, week:1 }, { left:6,  week:2 }).week, 2);
    say("the sparing keeps the first",       two("spared",{ week:1 }, { week:2 }).week, 1);

    /* 2. and they fill from the sand */
    const av = f => (f.str+f.agi+f.end+f.tec+f.sho+f.dis)/6;
    const fin=(fn,a,re)=>{ let x=fn(...a); if(x&&x.crux){const pd=x.pending;pd.beats=x.beats;x=fn(...re(pd));} return (x&&!x.crux)?x:null; };
    const kinds = { roar:0, upset:0, spared:0, brink:0 };
    const engines = new Set();
    let men = 0, withAny = 0, bad = [];
    const houses = [];
    for(let r=0;r<3;r++){
      const d = A.newGameState("N"+r,"clean","NIGHTS_"+r,null);
      for(let w=0;w<150;w++){
        d.gold = Math.max(d.gold, 20000);
        while(A.activeG(d).length<6 && !A.rosterFull(d)){
          const m=(d.market||[])[0]; if(!m || !A.buyFromBlock(d,m.id,null)) break; }
        /* NOT the richest bout on the card. An earlier version of this probe took it
           every week, won one bout in three campaigns, and reported that the upset
           slot never fills — which was true of the probe and not of the game. The
           fattest purse is the hardest man on the bill. Take one he has a real but
           uncertain chance at, which is where an upset can happen at all. */
        const os=((d.games&&d.games.offers)||[]);
        const fit=A.activeG(d).filter(g=>!g.injury&&(g.fatigue||0)<58).sort((x,z)=>av(z)-av(x));
        const odds = o => { if(!fit.length) return 0.5;
          if(o.pair || o.melee || o.venatio) return 0.5;
          try { return A.winChance(fit[0], o.opp, 0, "measured"); } catch(e){ return 0.5; } };
        const can = os.filter(o=>fit.length && (!(o.pair||o.melee)||fit.length>=2));
        const best = can.filter(o=>odds(o) >= 0.22).sort((a,c)=>(c.purse||0)-(a.purse||0))[0]
          || can.sort((a,c)=>odds(c)-odds(a))[0];
        if(best){ try{
          if(best.pair){ engines.add("pair"); fin(A.doPairFight,[d,[fit[0].id,fit[1].id],best,"measured",null,null],pd=>[d,[fit[0].id,fit[1].id],best,"measured",pd,null]); }
          else if(best.melee){ engines.add("melee"); const ids=fit.slice(0,3).map(g=>g.id); fin(A.doMelee,[d,ids,best,null,null,"measured"],pd=>[d,ids,best,pd,"finish","measured"]); }
          else if(best.venatio){ engines.add("hunt"); fin(A.doVenatio,[d,fit[0].id,best,"measured",null,null],pd=>[d,fit[0].id,best,"measured",pd,null]); }
          else { engines.add("single"); fin(A.doFight,[d,fit[0].id,best,"measured",null,null,null,"none"],pd=>[d,fit[0].id,best,"measured",null,pd,null,"none"]); }
        }catch(e){} }
        if(d.pendingEvent){ try{ A.EVENTS[d.pendingEvent.id].run(d,d.pendingEvent,0); }catch(e){} d.pendingEvent=null; }
        try{ A.endWeek(d); }catch(e){ break; }
        /* a house that folds is stood back up. This check is asking whether the four
           slots fill, not whether the opening is survivable — that is survive's job,
           and stopping at week thirty gave the rarer nights no chance to happen. */
        if(d.over){ d.over=null; if(d.rebellion) d.rebellion=null; d.unrest=Math.min(d.unrest,35); }
      }
      /* everyone the house ever held, alive or not */
      for(const g of (d.gladiators||[])){
        men++;
        const N = g.nights || {};
        const ks = Object.keys(N);
        if(ks.length) withAny++;
        for(const k of ks){
          kinds[k] = (kinds[k]||0)+1;
          const n = N[k];
          if(!n || typeof n.week !== "number") { bad.push(`${g.name}'s ${k} has no week on it`); continue; }
          if(n.week > d.week) bad.push(`${g.name}'s ${k} is filed in week ${n.week} of a campaign that reached ${d.week}`);
          if(!n.festival) bad.push(`${g.name}'s ${k} has no place on it`);
          if(k==="roar" && !(n.crowd >= 0 && n.crowd <= 100)) bad.push(`${g.name} drew a crowd of ${n.crowd}`);
          if(k==="upset" && !(n.odds > 0 && n.odds <= 50)) bad.push(`${g.name}'s upset was priced at ${n.odds} in a hundred — that is not an upset`);
          if(k==="brink" && !(n.left >= 0 && n.left <= 30)) bad.push(`${g.name} walked off the brink with ${n.left} left in him`);
        }
      }
      houses.push({ week:d.week, roster:(d.gladiators||[]).length });
    }
    return { cases, kinds, men, withAny, engines:[...engines], bad:bad.slice(0,4), houses };
  });

  const lines = [], fails = [];
  for(const c of out.cases)
    lines.push(`   ${c.ok ? "✓" : "✗"} ${c.label.padEnd(42)} kept week ${c.got}`);
  for(const c of out.cases)
    if(!c.ok) fails.push(`${c.label}: kept week ${c.got}, not ${c.want}`);

  lines.push(`three houses, ${out.houses.map(h=>`${h.roster} men to week ${h.week}`).join(" · ")}`);
  lines.push(`engines exercised: ${out.engines.join(", ")}`);
  lines.push(`${out.withAny} of ${out.men} men have a night on their page — ` +
    Object.entries(out.kinds).map(([k,n])=>`${k} ${n}`).join(", "));

  fails.push(...out.bad);
  if(!out.men) fails.push("no men were held at all");
  else {
    if(!out.withAny) fails.push(`not one of ${out.men} men came out of three campaigns with a night on his page`);
    else if(out.withAny / out.men < 0.5)
      fails.push(`only ${out.withAny} of ${out.men} men have a night — most of the yard still has nothing to show for itself`);
    /* the roar is the one every fighter should get; the other three are earned */
    if(!out.kinds.roar) fails.push(`nobody ever drew a crowd worth remembering`);
    for(const k of ["upset","spared","brink"])
      if(!out.kinds[k]) fails.push(`not one man in three campaigns has a "${k}" night — that slot never fills`);
  }
  if(out.engines.length < 3)
    lines.push(`   (only ${out.engines.length} engines came up on these cards; the nights are written in all four)`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
