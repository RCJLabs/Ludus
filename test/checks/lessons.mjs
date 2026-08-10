/* The gatekeeper offers what he knows once, on the tab where it is any use, and then
   leaves you to it. Thirty-five lessons across six tabs — and `lessonFor(d, tab)` returns
   exactly ONE per tab: the first that is unlearned, whose `done` test is false, and whose
   `when` gate (if it has one) passes. So the lessons are a QUEUE with expiry windows, and
   that is a shape with four distinct ways to lose a lesson entirely:

     DEAD ON ARRIVAL   its `done` test is already true in week 1, so it is finished before
                       it is ever offered. The starting state switches it off.
     A TRAP            one ordinary action makes `done` true while `when` is still FALSE —
                       shut before its own door can open, and never again openable.
     QUEUE-STARVED     it is eligible, but something ahead of it on the same tab holds the
                       slot until this one's window has shut behind it.
     WINDOW EMPTY      no state satisfies `when` while `done` is false at all. Dead table.

   All four shipped. `armory` — how kit works and why a net-man in a legionary's shield is
   worse than useless — tested `Object.keys(d.gear).length > 0`, and every opening hands you
   a rack, so it was done in week 1 in every scenario the game has. `wear` opened on a man
   WEARING bought steel and closed on `gearCond` having an entry, which buying writes
   instantly — closed before it could open. `scout` was eligible in 12 weeks across twelve
   houses and offered in 0, because it was only ever open while `market` was open in front
   of it. And `market` itself was done at "more than three men", which three of the five
   openings hand you.

   THAT LAST ONE WAS SITTING UNDER THIS CHECK'S FIRST SECTION FOR TWO RELEASES.
   It passed ["clean","even","uncle","onegood","oldguard"]. The scenario keys are clean,
   inherited, champion, veterans, castoffs, and newGameState ends `SCENARIOS[scen] ||
   SCENARIOS.clean` — so four of its five houses were A Clean Start with a different name in
   the log, and the section written to prove no lesson dies on arrival IN ANY OPENING had
   only ever seen one. The keys now come off the handle, where they cannot be invented.

   The three sections after it are the answer to what this check used to admit it could not
   say. It ended with a line reading "9 state-gated ones were not reached by these houses",
   which is not a verdict, and it could not be one by playing from week 1: a played house
   here reaches week 40 and 20-odd bouts, and `book` wants 25, `bench` an acclaimed house
   and a built armoury. So each lesson is now CONSTRUCTED into its own window and the
   question asked from inside it. */

import { hasHandle } from "../harness.mjs";

export const name = "lessons";
export const describe = "the gatekeeper can actually say everything he knows";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];
    const L = A.LESSONS;
    const S6 = ["str","agi","end","tec","sho","dis"];
    const av = f => (f.str+f.agi+f.end+f.tec+f.sho+f.dis)/6;
    const gate = (l, d) => { let done=false, when=true;
      try { done = !!(l.done && l.done(d)); } catch(e){ done=false; }
      try { when = l.when ? !!l.when(d) : true; } catch(e){ when=false; }
      return { done, when, open: when && !done }; };
    const nm = l => `"${l.title}" (${l.id}, ${l.tab})`;

    /* ---- 1. NOTHING MAY BE FINISHED BEFORE IT STARTS, in every opening the game HAS ---- */
    const SCEN = A.SC_KEYS;
    const dead = {}, openings = {};
    for(const sc of SCEN){
      const d = A.newGameState("L", sc, "LES-"+sc, null);
      openings[sc] = { men:(d.gladiators||[]).length, gold:d.gold, fame:d.fame,
        rooms:Object.entries(d.buildings||{}).map(([k,v])=>`${k} ${v}`).join(", ") || "none",
        open:L.filter(l=>gate(l,d).open).length };
      for(const l of L){
        /* a lesson gated on a state a fresh house cannot be in is allowed to be done —
           what is not allowed is an UNGATED lesson being finished before week one */
        if(gate(l,d).done && !l.when) (dead[l.id] = dead[l.id] || []).push(sc);
      }
    }
    for(const [id, scs] of Object.entries(dead))
      bad.push(`${nm(L.find(l=>l.id===id))} is already done in week 1 of `
        + `${scs.length===SCEN.length?"every opening":scs.join(", ")} — it can never be offered`);

    /* ---- 2. EVERY TAB MUST HAVE SOMETHING TO SAY TO A NEW HOUSE ---- */
    const fresh = A.newGameState("L","clean","LES-FRESH",null);
    const firstWord = {};
    for(const t of A.TAB_KEYS){
      let l = null; try { l = A.lessonFor(fresh, t); } catch(e){}
      firstWord[t] = l ? l.id : null;
      if(!l) bad.push(`the ${t} tab offers a new house no lesson at all, and ${L.filter(x=>x.tab===t).length} are written for it`);
    }

    /* ---- 3. EVERY WINDOW MUST BE NON-EMPTY, AND THE GATEKEEPER MUST ACTUALLY SAY IT ----
       One house per lesson, built into the state its own `when` asks for by the most direct
       means the game allows, and then asked. A gate whose two halves cannot both hold is
       dead table — which is what `wear` was, and this is the section that catches it: buying
       the steel made `done` true while `when` still wanted it equipped, so no state passed.
       These are constructed states, not states a house is claimed to reach: reachability in
       play is section 5's business. What this proves is that the TABLE is answerable. */
    const cardUp = d => { for(let w=1; w<=A.YEAR_WEEKS; w++){ d.week = w;
        try { A.makeGames(d); } catch(e){}
        if(((d.games&&d.games.offers)||[]).length) return true; } return false; };
    const BUILD = {
      agenda: d => { d.week = 3; },
      season: d => { d.week = 12; },
      book: d => { d.book = A.newBook(); d.book.n = 30; },
      heir: d => { d.lanista.age = 50; d.heir = null; },
      regard: d => { A.activeG(d)[0].memory = [{ what:"kept", w:1 }]; },
      form: d => { A.activeG(d)[0].form = 40; },
      refusal: d => { const g = A.activeG(d)[0]; g.regard = 10; g.morale = 4; g.defiance = 92; },
      stands: d => { d.fame = 90; },
      venue: d => { d.fame = 60; d.book = A.newBook(); d.book.n = 2; },
      watch: d => { d.fame = 120; cardUp(d); },
      circuit: d => { d.fame = 200; d.city = null; d.known = {}; },
      lenders: d => { d.gold = 200; },
      aedile: d => { d.election = { week:1, cands:[] }; d.aedile = null; },
      collegium: d => { d.week = 16; },
      munera: d => { d.unburied = [{ name:"Verus", week:1, done:false }]; d.honoured = 0; },
      staff: d => { d.doctore = null; d.medicus = null; d.armourer = null;
        d.gold = 90000; A.buildUp(d, "valetudinarium"); },
      wear: d => { d.gold = 60000;
        for(const id of Object.keys(A.GEAR)){ if(!A.GEAR[id].slot) continue;
          if(A.buyGearItem(d, id)) break; } },
      bench: d => { d.gold = 300000; d.acclaim = 60;
        A.buildUp(d,"armamentarium"); A.buildUp(d,"armamentarium"); A.buildUp(d,"armamentarium"); },
      signature: d => { const g = A.activeG(d)[0]; g.wins = 8;
        g.signature = null; g.teaching = null; g.learning = null; },
      board: d => { d.gold = 90000; A.makeDoctoreMarket(d);
        const c = (d.doctoreMarket||[])[0]; if(c) A.hireDoctore(d, c.id);
        while(A.activeG(d).length < 3 && !A.rosterFull(d)){
          const m = (d.market||[])[0]; if(!m) break; if(!A.buyFromBlock(d, m.id, null)) break; } },
      acclaim: d => { d.acclaim = 25; },
      stagecraft: d => { d.fame = 120; cardUp(d); d.book = A.newBook(); d.book.n = 3; },
      dynasty: d => { d.week = 40; d.fame = 400; d.gold = 40000;
        if(d.lanista) d.lanista.age = 30; d.domus = { wife:null, children:[], nextKin:1 }; },
      campania: d => { d.week = 26; d.city = null; d.known = {}; },
    };
    const built = [];
    for(const l of L){
      const d = A.newGameState("L","clean","LES-W-"+l.id,null);
      let err = null;
      if(BUILD[l.id]){ try { BUILD[l.id](d); } catch(e){ err = String(e.message||e); } }
      const g = gate(l, d);
      /* and would he say it, with the tab to itself? */
      d.flags.learned = {};
      for(const o of L) if(o.tab===l.tab && o.id!==l.id) d.flags.learned[o.id] = 1;
      let said = null; try { const x = A.lessonFor(d, l.tab); said = x ? x.id : null; } catch(e){}
      built.push({ id:l.id, open:g.open, when:g.when, done:g.done, said, err });
      /* and the builder is checked against the game's own predicate, not against my reading
         of it — three of the five rounds this section took were builders that wrote a field
         the gate does not read (`g.form` as an array of week records; `d.book.n` on a book
         that is null until the first bout) */
      if(l.id==="bench" && !A.masterOpen(d))
        bad.push(`the state built for ${nm(l)} does not satisfy masterOpen — the builder is wrong, not the gate`);
      if(l.id==="signature" && !A.activeG(d).some(g2=>A.canLearnSig(d,g2)))
        bad.push(`the state built for ${nm(l)} has nobody who canLearnSig — the builder is wrong, not the gate`);
      if(!g.open) bad.push(`${nm(l)} has no state where its door is open and its exit is not: `
        + `built to order, when=${g.when} done=${g.done}${err?` (${err})`:""} — the gate cannot be satisfied`);
      else if(said !== l.id) bad.push(`${nm(l)} is open in a state built for it and the gatekeeper `
        + `says ${said || "nothing"} instead, with every other lesson on that tab already read`);
    }

    /* ---- 4. NO ORDINARY ACTION MAY SHUT A LESSON BEFORE ITS OWN DOOR OPENS ----
       This is the `wear` fault stated generally, and the one that caught `staff`: `done` was
       "a medicus, or an armourer, or a doctore", the doctore is the trainer off another
       market, and the charter's fifth step tells you to go and hire him — while the door
       wanted a built room, which comes a dozen weeks later.
       Every house here starts with the same purse BEFORE anything is measured, because an
       earlier version of this sweep gave each action its own spending money and then found
       that eleven unrelated actions "retired" the lesson about the lenders, whose exit is
       1,200 denarii. And every flip is played eight weeks forward without touching what the
       action set, because a `done` on a threshold un-fires and reopens the window. */
    const ACTS = {
      "set a man to spar":      d => { const g=A.activeG(d); A.setSparOf(d,g[0].id,g[1].id); },
      "set a man to condition": d => A.setRegimenOf(d,A.activeG(d)[0].id,"cond"),
      "rest a man":             d => A.setRegimenOf(d,A.activeG(d)[0].id,"rest"),
      "pair the whole yard":    d => A.pairTheYard(d),
      "point a man at a stat":  d => A.setFocusOf(d,A.activeG(d)[0].id,"str"),
      "name a first man":       d => A.makeMasterOf(d,A.activeG(d)[0].id),
      "buy a piece of steel":   d => { for(const id of Object.keys(A.GEAR)){
                                       if(A.GEAR[id].slot && A.buyGearItem(d,id)) return; } },
      "arm a man off the rack": d => A.armHimOff(d,A.activeG(d)[0].id),
      "buy a man":              d => { const m=(d.market||[])[0]; if(m) A.buyFromBlock(d,m.id,null); },
      "have one looked over":   d => { const m=(d.market||[])[0]; if(m) A.scoutBlockMan(d,m.id); },
      "hire a doctore":         d => { A.makeDoctoreMarket(d);
                                       const c=(d.doctoreMarket||[])[0]; if(c) A.hireDoctore(d,c.id); },
      "put the yard on a drill":d => { A.makeDoctoreMarket(d);
                                       const c=(d.doctoreMarket||[])[0]; if(c) A.hireDoctore(d,c.id);
                                       A.setDrillTo(d,"blade"); },
      "hire a medicus":         d => { A.makeStaffMarket(d);
                                       const m=((d.staffMarket||{}).medicus||[])[0];
                                       if(m) A.hireStaffMember(d,"medicus",m.id); },
      "build a room up":        d => A.buildUp(d,"valetudinarium"),
      "found the burial club":  d => A.foundCollegium(d),
      "throw a feast":          d => A.throwFeast(d),
      "walk the cells":         d => A.walkTheCells(d),
      "whip a man":             d => A.whipMan(d,A.activeG(d)[0].id),
      "reward a man":           d => A.rewardMan(d,A.activeG(d)[0].id),
      "sell a man":             d => A.sellMan(d,A.activeG(d)[0].id),
      "make an offering":       d => A.makeOffering(d,"mars"),
      "set the crest":          d => A.setCrestTo(d,{ c1:"#111", c2:"#222", sym:"gladius", motto:"x" }),
      "take a pit bout":        d => { A.makePitCard(d); const men=A.pitMen(d)||[];
                                       const g=A.activeG(d)[0];
                                       if(men.length){ const o=A.makePitOffer(d,g,"standard",men[0].id);
                                         if(o) A.doFight(d,g.id,o,"measured",null,null,null,"none"); } },
      "end the first week":     d => { d.pendingEvent=null; A.endWeek(d); },
    };
    const hold = d => { for(let k=0;k<8;k++){ d.pendingEvent=null;
        try{ A.endWeek(d); }catch(e){ return; } if(d.over) return; } };
    const traps = {}, shuts = {}, actErr = [], collide = [];
    for(const [tag, act] of Object.entries(ACTS)){
      const d = A.newGameState("L","clean","LES-A-"+tag.replace(/\W/g,""),null);
      d.gold = 60000;
      const before = {}; for(const l of L) before[l.id] = gate(l, d);
      const cBefore = A.CHARTER.map(c=>{ try { return !!c.done(d); } catch(e){ return false; } });
      try { act(d); } catch(e){ actErr.push(`${tag}: ${e.message||e}`); continue; }
      const after = {}; for(const l of L) after[l.id] = gate(l, d);
      const cAfter = A.CHARTER.map(c=>{ try { return !!c.done(d); } catch(e){ return false; } });
      const flipped = L.filter(l => !before[l.id].done && after[l.id].done);
      /* WHICH INSTRUCTION RETIRES WHICH NOTE. The charter is the game telling a new player
         what to do; the lessons are the game explaining it. Where one action satisfies a
         charter step AND retires a lesson, the guide is switching off the gatekeeper — which
         is survivable when the note is first on its tab and fatal when it is not. This is
         how "The Men In The Rooms" died: charter step five says go and hire the doctore. */
      const steps = A.CHARTER.filter((c,i)=>!cBefore[i] && cAfter[i]).map(c=>c.id);
      if(steps.length && flipped.length)
        collide.push(`${tag} → charter ${steps.join("+")} · retires ${flipped.map(l=>l.id).join(", ")}`);
      if(!flipped.length) continue;
      const d2 = A.clone(d); hold(d2);
      for(const l of flipped){
        if(!gate(l, d2).done) continue;                 /* a threshold that un-fires — no trap */
        (after[l.id].when ? shuts : traps)[l.id] = ((after[l.id].when ? shuts : traps)[l.id] || []).concat(tag);
      }
    }
    for(const [id, tags] of Object.entries(traps))
      bad.push(`${nm(L.find(l=>l.id===id))} is shut for good by one action in week one — `
        + `${tags.join(", ")} — while its own door (\`when\`) is still closed, so that house can never be told`);

    /* ---- 5. FROM INSIDE ITS WINDOW, WITH NOTHING READ, HE MUST GET TO IT ----
       The `scout` fault: a window only ever open while the lesson AHEAD of it is open too.
       Each house starts in the lesson's own window with a cold queue — the worst case — and
       is read one lesson per tab per week, which is what a player who opens every tab does.
       STARVED means `done` came true first, unsaid, and that is the only outcome asserted:
       a lesson with no `done` at all cannot starve, its window merely closes and reopens
       (the note about form is open whenever a man is hot or cold, which recurs all game),
       and a house that dies inside 24 weeks has not answered the question either way. */
    const WEEKS = 24;
    const queue = [];
    for(const l of L){
      const d = A.newGameState("L","clean","LES-Q-"+l.id,null);
      if(BUILD[l.id]){ try { BUILD[l.id](d); } catch(e){} }
      let verdict = null, said = null;
      for(let k=0; k<WEEKS && !verdict; k++){
        const holder = {};
        for(const t of A.TAB_KEYS){ let x=null; try{ x=A.lessonFor(d,t); }catch(e){} holder[t]=x?x.id:null; }
        if(holder[l.tab] === l.id){ said = d.week; verdict = "said"; break; }
        for(const t of A.TAB_KEYS) if(holder[t]){
          d.flags.learned = d.flags.learned || {}; d.flags.learned[holder[t]] = 1; }
        const g = gate(l, d);
        if(!g.open){ verdict = g.done ? "starved" : "window shut again"; break; }
        while(A.activeG(d).length<5 && !A.rosterFull(d) && d.gold>1500){
          const m=(d.market||[]).filter(x=>!x.paragon).sort((a,b)=>av(b)-av(a))[0];
          if(!m || d.gold < m.price+900) break;
          if(!A.buyFromBlock(d,m.id,null)) break; }
        for(const x of A.activeG(d)){
          if((x.fatigue||0)>=55) A.setRegimenOf(d,x.id,"rest");
          else { A.setRegimenOf(d,x.id,"palus");
            A.setFocusOf(d,x.id,S6.reduce((m,k)=>x[k]<x[m]?k:m,S6[0])); } }
        let pool = A.activeG(d).filter(x=>!x.injury&&(x.fatigue||0)<58&&(x.lastFought==null||x.lastFought<d.week));
        let sent = false;
        for(const o of ((d.games&&d.games.offers)||[]).slice().sort((a,b)=>(b.purse||0)-(a.purse||0))){
          if(o.pair||o.melee||o.venatio) continue;
          if(!o.imperial && o.stakes==="sine") continue;
          let pg=null,pw=0;
          for(const x of pool){ let wc=0; try{wc=A.winChance(x,o.opp);}catch(e){} if(wc>pw){pw=wc;pg=x;} }
          if(!pg||pw<0.42) continue;
          let r=A.doFight(d,pg.id,o,"measured",null,null,null,"none");
          /* #116: to exhaustion, and the answer captured. This spoke one word and dropped the
             result, so a bout that came back to the balance stayed pending and earned nothing —
             26.8% of all standard bouts. */
          { let n=0; while(r&&r.crux&&n++<4){ const pd=r.pending; pd.beats=r.beats;
            r=A.doFight(d,pg.id,o,"measured",null,pd,"press","none"); } }
          sent = true; break; }
        if(!sent){ try{ A.makePitCard(d); const men=A.pitMen(d)||[];
          const x=pool[0];
          if(x&&men.length){ const o=A.makePitOffer(d,x,"standard",men[0].id);
            if(o){ let r=A.doFight(d,x.id,o,"measured",null,null,null,"none");
              let n=0; while(r&&r.crux&&n++<4){ const pd=r.pending; pd.beats=r.beats;
                r=A.doFight(d,x.id,o,"measured",null,pd,"press","none"); } } } }catch(e){} }
        d.pendingEvent = null;
        try { A.endWeek(d); } catch(e){ verdict = "the week would not run"; break; }
        if(d.over) verdict = gate(l,d).done ? "starved" : "the house died";
      }
      if(!verdict) verdict = gate(l, d).open ? "still queued at week 24" : "window shut again";
      queue.push({ id:l.id, tab:l.tab, verdict, said });
      if(verdict === "starved")
        bad.push(`${nm(l)} was open with nothing read in front of it and its exit came true `
          + `before the gatekeeper reached it — the queue on the ${l.tab} tab ate its window`);
    }

    /* ---- 6. AN UNGATED LESSON MUST ACTUALLY BE OFFERED IN PLAY, inside its own window ----
       The reader here is the most attentive one possible: he opens all six tabs every week
       and reads whatever he is given, which is what advances the queue. Eight houses, and a
       lesson counts as reached if ANY of them was offered it — one house dying at week 21
       once reported eighteen lessons unreachable that had simply never had the weeks. */
    const offered = {}, eligible = {}, firstAt = {};
    for(const l of L){ offered[l.id]=0; eligible[l.id]=0; }
    const lives = [];
    for(let h=0; h<8; h++){
      const d = A.newGameState("L","clean","LES-P"+h,null);
      for(let k=0; k<220; k++){
        for(const l of L){
          if((d.flags.learned||{})[l.id]) continue;
          if(gate(l, d).open) eligible[l.id]++;
        }
        for(const t of A.TAB_KEYS){
          let x=null; try{ x = A.lessonFor(d, t); }catch(e){}
          if(x){ offered[x.id]++; if(firstAt[x.id]==null) firstAt[x.id] = d.week;
            d.flags.learned = d.flags.learned || {}; d.flags.learned[x.id] = 1; } }
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
          { let n=0; while(x&&x.crux&&n++<4){ const pd=x.pending; pd.beats=x.beats;
            x=A.doFight(d,pg.id,o,"measured",null,pd,"press","none"); } } }
        if(!((d.games&&d.games.offers)||[]).length){
          try{ A.makePitCard(d); const men=A.pitMen(d)||[];
            const g=A.activeG(d).find(x=>!x.injury&&(x.lastFought==null||x.lastFought<d.week));
            if(g&&men.length){ const o=A.makePitOffer(d,g,"standard",men[0].id);
              if(o){ let x=A.doFight(d,g.id,o,"measured",null,null,null,"none");
                let n=0; while(x&&x.crux&&n++<4){ const pd=x.pending; pd.beats=x.beats;
                  x=A.doFight(d,g.id,o,"measured",null,pd,"press","none"); } } } }catch(e){} }
        d.pendingEvent = null;
        try { A.endWeek(d); } catch(e){ break; }
        if(d.over) break;
      }
      lives.push(d.week);
    }
    const starved = L.filter(l=>!l.when && offered[l.id]===0);
    for(const l of starved)
      bad.push(`${nm(l)} is ungated and was offered 0 times to a reader who read every lesson `
        + `on every tab for ${Math.max(...lives)} weeks — eligible ${eligible[l.id]} weeks, so the queue in front of it ate its window`);

    return { bad, built, queue, openings, firstWord, lives, actErr, collide,
      traps:Object.keys(traps), shuts,
      rows: L.map(l=>({ id:l.id, tab:l.tab, gated:!!l.when,
        offered:offered[l.id], eligible:eligible[l.id], firstAt:firstAt[l.id]||null })),
      count:L.length,
      byTab:A.TAB_KEYS.map(t=>`${t} ${L.filter(l=>l.tab===t).length}`).join(" · ") };
  });

  const lines = [];
  lines.push(`${out.count} lessons — ${out.byTab}`);
  lines.push(`the five openings: ` + Object.entries(out.openings)
    .map(([sc,x])=>`${sc} ${x.men} men/${x.gold}d/fame ${x.fame}/rooms ${x.rooms} → ${x.open} open`).join(" · "));
  lines.push(`what each tab says to a house in its first week: `
    + Object.entries(out.firstWord).map(([t,id])=>`${t} ${id||"— NOTHING"}`).join(" · "));
  lines.push(`built into its own window: ${out.built.filter(b=>b.open).length} of ${out.count} open, `
    + `${out.built.filter(b=>b.said===b.id).length} of ${out.count} then said with the tab to themselves`);
  for(const c of out.collide) lines.push(`  one action, two systems: ${c}`);
  const acts = Object.entries(out.shuts);
  lines.push(`shut by one week-one action while still queued (survivable — read faster than you act): `
    + (acts.map(([id,t])=>`${id} (${t.length})`).join(", ") || "none")
    + ` · shut before their door opens (fatal): ${out.traps.join(", ") || "none"}`);
  const byV = {};
  for(const q of out.queue) byV[q.verdict] = (byV[q.verdict]||0) + 1;
  lines.push(`from inside the window with nothing read: `
    + Object.entries(byV).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${v} ${k}`).join(" · ")
    + ` (median week said ${(()=>{ const s=out.queue.filter(q=>q.said).map(q=>q.said).sort((a,b)=>a-b);
        return s.length ? s[s.length>>1] : "—"; })()})`);
  const reached = out.rows.filter(r=>r.offered>0);
  lines.push(`${reached.length} of ${out.count} reached in play by a reader who reads everything, `
    + `over ${out.lives.length} houses (longest ${Math.max(...out.lives)} weeks)`);
  const un = out.rows.filter(r=>!r.gated);
  lines.push(`  of the ${un.length} with no state gate, ${un.filter(r=>r.offered>0).length} were offered — first at: `
    + un.filter(r=>r.firstAt).sort((a,b)=>a.firstAt-b.firstAt).map(r=>`${r.id} w${r.firstAt}`).join(", "));
  const missed = out.rows.filter(r=>r.gated && r.offered===0);
  lines.push(`  ${missed.length} state-gated ones want a state these houses never reached — `
    + `each proved answerable above: ${missed.map(r=>r.id).join(", ") || "none"}`);
  if(out.actErr.length) lines.push(`  actions that would not run: ${out.actErr.join(" · ")}`);

  const fails = [...out.bad];
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,4).join("; ") || null, lines };
}
