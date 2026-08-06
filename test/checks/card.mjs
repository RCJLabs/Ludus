/* This game has four fight engines. Three of them shared a tenth of the bill.

   Counting one Capuan card at a time, at a fixed standing, a made house's bill was
   75% the ordinary single combat, 10% venatio, 9% pair, 6% melee. makeGames called
   add() up to eight times a card while each of the other engines got a single roll
   at thirty to fifty per cent, and three of those add() calls were a second helping
   of the tier-2 and tier-3 bouts already put on above. It is 57 / 16 / 15 / 11 now.

   The audit that started this said 89% single, which was wrong twice over: it
   counted every bout showing every week rather than each bout once, and it counted
   the Rome campaign, whose branch is one imperial single bout a week by design. Both
   are corrected here — bouts are counted once by id, and Rome is left out.

   The card is a mix now. This check holds the shape from both ends: no single kind
   may swallow the bill, every engine must actually appear, and the card must not
   have grown or shrunk in the process — the point was the mix, not the size. */

import { hasHandle } from "../harness.mjs";

export const name = "card";
export const describe = "a card is a mix, not one bout four times";

const WEEKS = 150, HOUSES = 3;
const MAX_SINGLE = 86;   // percent of the bill the ordinary bout may take
const MIN_OTHER  = 12;   // and the share the other three engines must hold between them
const SIZE = [3.2, 5.4]; // bouts on a card — the mix changed, the bill should not have

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(({WEEKS,HOUSES})=>{
    const A = window.__LVDVS;
    const av = f => (f.str+f.agi+f.end+f.tec+f.sho+f.dis)/6;
    const kind = {}; let cards = 0, offers = 0, deaths = 0, bouts = 0;
    /* count each bout once, by its id. A card can sit on screen for more than one
       week, and counting what is showing rather than what was offered weights the
       bill by how long each thing lingers instead of how often it is put on. */
    const seen = new Set();
    for(let r=0;r<HOUSES;r++){
      const d = A.newGameState("Cd"+r, "clean", "CARD_"+r, null);
      const fin=(fn,a,re)=>{ let x=fn(...a); if(x&&x.crux){const pd=x.pending;pd.beats=x.beats;x=fn(...re(pd));} return (x&&!x.crux)?x:null; };
      for(let w=0;w<WEEKS;w++){
        d.gold = Math.max(d.gold, 30000);
        while(A.activeG(d).length<8 && !A.rosterFull(d)){
          const m=(d.market||[])[0]; if(!m || !A.buyFromBlock(d,m.id,null)) break; }
        if(d.unrest>=22) A.throwFeast(d);
        { const c=(d.doctoreMarket||[])[0]; if(c && !d.doctore) A.hireDoctore(d,c.id); }
        for(const k of Object.keys(A.BUILDINGS)) { try{ A.buildUp(d,k); }catch(e){} }
        /* Rome is not a card. Its branch puts up one imperial single bout a week
           for as long as the campaign lasts, by design. Neither is a tour: away
           games come from makeCityGames, a separate generator that builds single
           combats and nothing else. Counting either alongside Capua's bills is what
           made the audit read 88% single when a Capuan card of the same build was
           57%. What is measured here is the bill makeGames puts up at home. */
        const os = ((d.rome || d.city || d.travel) ? [] : ((d.games&&d.games.offers)||[]));
        if(os.length){
          let fresh = 0;
          for(const o of os){
            if(seen.has(o.id)) continue;
            seen.add(o.id); fresh++; offers++;
            const k = o.melee ? (o.spectacle||"melee") : o.venatio ? "venatio" : o.pair ? "pair"
                    : o.challenge ? "challenge" : o.booking ? "booked" : "single";
            kind[k] = (kind[k]||0)+1; }
          if(fresh) cards++; }
        const fit = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0)<58).sort((x,z)=>av(z)-av(x));
        const usable = os.filter(o=>o.stakes!=="sine").filter(o=>{ if(!fit.length) return false;
          if(o.pair||o.melee) return fit.length>=2; return true; });
        const best = usable.sort((a,c)=>(c.purse||0)-(a.purse||0))[0];
        const before = (d.fallen||[]).length;
        if(best){
          if(best.pair) fin(A.doPairFight,[d,[fit[0].id,fit[1].id],best,"measured",null,null],pd=>[d,[fit[0].id,fit[1].id],best,"measured",pd,null]);
          else if(best.melee){ const ids=fit.slice(0,3).map(g=>g.id); fin(A.doMelee,[d,ids,best,null,null,"measured"],pd=>[d,ids,best,pd,"finish","measured"]); }
          else if(best.venatio) fin(A.doVenatio,[d,fit[0].id,best,"measured",null,null],pd=>[d,fit[0].id,best,"measured",pd,null]);
          else fin(A.doFight,[d,fit[0].id,best,"measured",null,null,null,"none"],pd=>[d,fit[0].id,best,"measured",null,pd,null,"none"]);
          bouts++;
        }
        deaths += (d.fallen||[]).length - before;
        A.pairTheYard(d);
        A.activeG(d).forEach(g=>{ if(g.injury || (g.fatigue||0)>=58) A.setRegimenOf(d,g.id,"rest"); });
        if(d.pendingEvent){ try{ A.EVENTS[d.pendingEvent.id].run(d,d.pendingEvent,0); }catch(e){} d.pendingEvent=null; }
        try{ A.endWeek(d); }catch(e){ break; }
        if(d.over){ d.over=null; if(d.rebellion) d.rebellion=null; d.unrest=Math.min(d.unrest,35); }
      }
    }
    return { kind, cards, offers, deaths, bouts };
  }, { WEEKS, HOUSES });

  const lines = [], fails = [];
  if(!out.offers) return { pass:false, why:"no cards were offered at all", lines };
  const pc = k => (out.kind[k]||0) / out.offers * 100;
  const size = out.offers / out.cards;

  lines.push(`${out.cards} cards, ${out.offers} bouts on them, ${size.toFixed(2)} per card`);
  lines.push(Object.entries(out.kind).sort((a,b)=>b[1]-a[1])
    .map(([k,n])=>`${k} ${(n/out.offers*100).toFixed(0)}%`).join(" · "));
  lines.push(`${out.deaths} men buried in ${out.bouts} bouts (${(out.deaths/Math.max(1,out.bouts)*100).toFixed(1)} per hundred)`);

  if(pc("single") > MAX_SINGLE)
    fails.push(`${pc("single").toFixed(0)}% of the bill is the ordinary single bout (cap ${MAX_SINGLE}%) — the other three engines are being crowded out`);
  const other = pc("pair") + pc("venatio") + pc("melee") + pc("naumachia");
  if(other < MIN_OTHER)
    fails.push(`the pair, the hunt and the melee hold ${other.toFixed(0)}% between them (floor ${MIN_OTHER}%)`);
  /* and each of them has to actually turn up — an engine at zero is an engine
     nobody has seen, which is how the naumachia spent a campaign at one in 173 weeks */
  for(const k of ["pair","venatio","melee"])
    if(!out.kind[k]) fails.push(`not one ${k} was offered in ${out.cards} cards`);
  if(size < SIZE[0] || size > SIZE[1])
    fails.push(`a card carries ${size.toFixed(2)} bouts, outside ${SIZE[0]}–${SIZE[1]} — the mix was supposed to change, not the size of the bill`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
