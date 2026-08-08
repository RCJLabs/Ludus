/* The gatekeeper offers what he knows once, on the tab where it is any use, and then
   leaves you to it. Thirty-five lessons across six tabs — and `lessonFor(d, tab)` returns
   exactly ONE per tab: the first that is unlearned, whose `done` test is false, and whose
   `when` gate (if it has one) passes. So the lessons are a QUEUE with expiry windows, and
   that is a shape with three distinct ways to lose a lesson entirely:

     DEAD ON ARRIVAL   its `done` test is already true in week 1, so it is finished before
                       it is ever offered. The starting state switches it off.
     DOOR BEHIND EXIT  its `done` fires on an event that must happen BEFORE its `when` can,
                       so it closes before it opens.
     QUEUE-STARVED     it is eligible, but something ahead of it on the same tab holds the
                       slot until this one's window has shut behind it.

   All three shipped. `armory` — "Steel and Style", which is how kit works and why a net-man
   in a legionary's shield is worse than useless — tested `Object.keys(d.gear).length > 0`,
   and all five openings hand you a rack of two or three weapons, so it was done in week 1 in
   every scenario the game has. `wear` opened on a man WEARING bought steel and closed on
   `gearCond` having an entry, which buying writes instantly — closed before it could open.
   Between them the armory tab offered NO LESSON AT ALL to a new house: three written, none
   reachable. And `scout` — how much the seller is lying by, which is the single most useful
   thing a beginner could be told at the block — was eligible in 12 weeks across twelve
   houses and offered in 0, because it was only ever open while `market` was open in front
   of it, and the week after you read `market` it was already done.

   None of this was visible from the pass column, because no check had ever asked what the
   game SAYS. Every check in this project drives the engine; this one reads the gatekeeper. */

import { hasHandle } from "../harness.mjs";

export const name = "lessons";
export const describe = "the gatekeeper can actually say everything he knows";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];
    const S6 = ["str","agi","end","tec","sho","dis"];
    const av = f => (f.str+f.agi+f.end+f.tec+f.sho+f.dis)/6;

    /* ---- 1. NOTHING MAY BE FINISHED BEFORE IT STARTS, in any opening the game offers ---- */
    const SCEN = ["clean","even","uncle","onegood","oldguard"];
    const dead = {};
    for(const sc of SCEN){
      let d = null;
      try { d = A.newGameState("L", sc, "LES-"+sc, null); } catch(e){ continue; }
      if(!d) continue;
      for(const l of A.LESSONS){
        let done = false; try { done = !!(l.done && l.done(d)); } catch(e){}
        /* a lesson gated on a state a fresh house cannot be in is allowed to be done —
           what is not allowed is an UNGATED lesson being finished before week one */
        if(done && !l.when){ (dead[l.id] = dead[l.id] || []).push(sc); }
      }
    }
    for(const [id, scs] of Object.entries(dead))
      bad.push(`"${A.LESSONS.find(l=>l.id===id).title}" (${id}) is already done in week 1 of ${scs.length===SCEN.length?"every opening":scs.join(", ")} — it can never be offered`);

    /* ---- 2. EVERY TAB MUST HAVE SOMETHING TO SAY TO A NEW HOUSE ---- */
    const fresh = A.newGameState("L","clean","LES-FRESH",null);
    const firstWord = {};
    for(const t of A.TAB_KEYS){
      let L = null; try { L = A.lessonFor(fresh, t); } catch(e){}
      firstWord[t] = L ? L.id : null;
      if(!L) bad.push(`the ${t} tab offers a new house no lesson at all, and ${A.LESSONS.filter(x=>x.tab===t).length} are written for it`);
    }

    /* ---- 3. A DOOR MAY NOT BE BEHIND ITS EXIT ----
       driven, not read: buy a piece of steel, put it on a man, and check that the lesson
       about steel wearing out is open at some point in that sequence rather than already shut */
    const w = A.newGameState("L","clean","LES-WEAR",null);
    w.gold = 60000;
    const WEAR = A.LESSONS.find(l=>l.id==="wear");
    const stateOf = () => { let when=false, done=false;
      try{ when = WEAR.when ? !!WEAR.when(w) : true; }catch(e){}
      try{ done = WEAR.done ? !!WEAR.done(w) : false; }catch(e){}
      return { when, done, open: when && !done }; };
    const seq = [{ tag:"fresh", ...stateOf() }];
    let boughtId = null;
    for(const id of Object.keys(A.GEAR)){
      const it = A.GEAR[id]; if(!it || !it.slot) continue;
      try { if(A.buyGearItem(w, id)){ boughtId = id; break; } } catch(e){}
    }
    seq.push({ tag: boughtId ? `bought ${boughtId}` : "bought nothing", ...stateOf() });
    if(boughtId){
      const g = A.activeG(w)[0];
      try { A.equipOne(w, g.id, A.GEAR[boughtId].slot, boughtId); } catch(e){}
      seq.push({ tag:"equipped", ...stateOf() });
    }
    if(!boughtId) bad.push("no piece of gear could be bought, so the wear lesson could not be driven");
    else if(!seq.some(x=>x.open))
      bad.push(`"Steel Does Not Last" (wear) was never open across fresh → bought → equipped: `
        + seq.map(x=>`${x.tag} when=${x.when} done=${x.done}`).join(" · ")
        + " — its done test fires on an event that precedes its when gate");

    /* ---- 4. AN UNGATED LESSON MUST ACTUALLY BE OFFERED, inside its own window ----
       the reader here is the most attentive one possible: he opens all six tabs every week
       and reads whatever he is given, which is what advances the queue. Twelve houses, and a
       lesson counts as reached if ANY of them was offered it — one house dying at week 21
       once reported eighteen lessons unreachable that had simply never had the weeks. */
    const offered = {}, eligible = {}, firstAt = {};
    for(const l of A.LESSONS){ offered[l.id]=0; eligible[l.id]=0; }
    const lives = [];
    for(let h=0; h<8; h++){
      const d = A.newGameState("L","clean","LES-P"+h,null);
      for(let k=0; k<220; k++){
        for(const l of A.LESSONS){
          if((d.flags.learned||{})[l.id]) continue;
          let done=false, when=true;
          try { done = !!(l.done && l.done(d)); } catch(e){}
          try { when = l.when ? !!l.when(d) : true; } catch(e){ when=false; }
          if(!done && when) eligible[l.id]++;
        }
        for(const t of A.TAB_KEYS){
          let L=null; try{ L = A.lessonFor(d, t); }catch(e){}
          if(L){ offered[L.id]++; if(firstAt[L.id]==null) firstAt[L.id] = d.week;
            d.flags.learned = d.flags.learned || {}; d.flags.learned[L.id] = 1; } }
        /* played well enough that state gates have their state, and trained properly —
           `palus` is focus:true and a man who is never pointed anywhere trains one stat */
        while(A.activeG(d).length<6 && !A.rosterFull(d) && d.gold > A.weeklyBill(d)*6 + 900){
          let got=false;
          for(const m of (d.market||[]).filter(x=>!x.paragon && x.price<=d.gold-800).sort((a,b)=>av(b)-av(a))){
            if(!m.scouted && d.gold > m.price + A.weeklyBill(d)*6) A.scoutBlockMan(d,m.id);
            if(m.flaw && m.scouted) continue;
            if(A.buyFromBlock(d,m.id,null)){ got=true; break; } }
          if(!got) break; }
        if(!d.doctore && d.gold>1600){ const c=(d.doctoreMarket||[]).sort((a,b)=>(b.skill||0)-(a.skill||0))[0];
          if(c && d.gold>c.fee+900) A.hireDoctore(d,c.id); }
        for(const g of A.activeG(d)){
          if((g.fatigue||0)>=55) A.setRegimenOf(d,g.id,"rest");
          else { A.setRegimenOf(d,g.id,"palus");
            A.setFocusOf(d,g.id,S6.reduce((m,k)=>g[k]<g[m]?k:m,S6[0])); }
          A.makeMasterOf(d,g.id); }
        try{ A.pairTheYard(d); }catch(e){}
        if(d.unrest>=35 && d.gold>A.feastCost(d)+A.weeklyBill(d)) A.throwFeast(d);
        for(const bk of Object.keys(A.BUILDINGS)) if(d.gold>5000) A.buildUp(d,bk);
        let pool = A.activeG(d).filter(g=>!g.injury&&(g.fatigue||0)<58&&(g.lastFought==null||g.lastFought<d.week));
        for(const o of ((d.games&&d.games.offers)||[]).slice().sort((a,b)=>(b.purse||0)-(a.purse||0))){
          pool = pool.filter(g=>g.status==="active"&&!g.injury);
          if(!pool.length) break;
          if(o.pair||o.melee||o.venatio) continue;
          if(!o.imperial && o.stakes==="sine") continue;
          let pg=null,pw=0;
          for(const g of pool){ let wc=0; try{wc=A.winChance(g,o.opp);}catch(e){} if(wc>pw){pw=wc;pg=g;} }
          if(!pg||pw<0.42) continue;
          let x=A.doFight(d,pg.id,o,"measured",null,null,null,"none");
          if(x&&x.crux){ const pd=x.pending; pd.beats=x.beats; A.doFight(d,pg.id,o,"measured",null,pd,"press","none"); } }
        if(!((d.games&&d.games.offers)||[]).length){
          try{ A.makePitCard(d); const men=A.pitMen(d)||[];
            const g=A.activeG(d).find(x=>!x.injury&&(x.lastFought==null||x.lastFought<d.week));
            if(g&&men.length){ const o=A.makePitOffer(d,g,"standard",men[0].id);
              if(o){ let x=A.doFight(d,g.id,o,"measured",null,null,null,"none");
                if(x&&x.crux){ const pd=x.pending; pd.beats=x.beats;
                  A.doFight(d,g.id,o,"measured",null,pd,"press","none"); } } } }catch(e){} }
        d.pendingEvent = null;
        try { A.endWeek(d); } catch(e){ break; }
        if(d.over) break;
      }
      lives.push(d.week);
    }
    /* an ungated lesson is one the game promises to a house in any state — if the most
       attentive reader alive never sees it, nobody will. A `when`-gated one may legitimately
       want a state these houses never reached, so those are reported and not asserted. */
    const starved = A.LESSONS.filter(l=>!l.when && offered[l.id]===0);
    for(const l of starved)
      bad.push(`"${l.title}" (${l.id}, ${l.tab}) is ungated and was offered 0 times to a reader `
        + `who read every lesson on every tab for ${Math.max(...lives)} weeks — eligible ${eligible[l.id]} weeks, so the queue in front of it ate its window`);

    const rows = A.LESSONS.map(l=>({ id:l.id, tab:l.tab, gated:!!l.when,
      offered:offered[l.id], eligible:eligible[l.id], firstAt:firstAt[l.id]||null }));
    return { bad, rows, lives, firstWord, seq, boughtId,
      count:A.LESSONS.length,
      byTab:A.TAB_KEYS.map(t=>`${t} ${A.LESSONS.filter(l=>l.tab===t).length}`).join(" · ") };
  });

  const lines = [];
  const reached = out.rows.filter(r=>r.offered>0);
  lines.push(`${out.count} lessons — ${out.byTab}`);
  lines.push(`what each tab says to a house in its first week: `
    + Object.entries(out.firstWord).map(([t,id])=>`${t} ${id||"— NOTHING"}`).join(" · "));
  lines.push(`steel wearing out, driven: ${out.seq.map(x=>`${x.tag} ${x.open?"OPEN":x.done?"shut":"not yet"}`).join(" → ")}`);
  lines.push(`${reached.length} of ${out.count} reached by a reader who reads everything, over ${out.lives.length} houses (longest ${Math.max(...out.lives)} weeks)`);
  const un = out.rows.filter(r=>!r.gated);
  lines.push(`  of the ${un.length} with no state gate, ${un.filter(r=>r.offered>0).length} were offered — first at: `
    + un.filter(r=>r.firstAt).sort((a,b)=>a.firstAt-b.firstAt).map(r=>`${r.id} w${r.firstAt}`).join(", "));
  const missed = out.rows.filter(r=>r.gated && r.offered===0);
  lines.push(`  ${missed.length} state-gated ones were not reached by these houses (their states may want a longer life): ${missed.map(r=>r.id).join(", ") || "none"}`);

  const fails = [...out.bad];
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,4).join("; ") || null, lines };
}
