/* WHAT IS NEW, AND WHERE — WHICH THE SCREEN NEVER SAID.

   The agenda has known what wants an answer and which of the six tabs the answer is on
   since v2.57.0, and a player's only way to find out was to open all six every week. So
   there are marks now: a count on the tab bar in the agenda's own urgency colours, a
   quieter dot when something has merely arrived, and the same pair on the folded panels
   one level down.

   The obvious way to build it is a `touch(d, "arena")` call wherever something arrives —
   twenty-odd call sites, every one a chance to forget, and a forgotten one is invisible
   because a dot that never lights looks exactly like a tab with nothing in it. That is the
   shape of the v2.59.0 paragon fault: one part of the week writing and another quietly
   undoing it. So freshness is derived from a signature over each tab's discrete
   player-facing state instead, and this check is what makes that safe:

   - every tab has a signature, and no two tabs share one, or a mark lights the wrong tab
   - the things that are news move the signature: a fresh card, a refreshed block, a man
     coming back fit, a letter from Rome, a patron's want, a man bought or buried
   - the things that are NOT news leave it alone — fatigue creeping up, unrest wandering,
     coin coming in. A signature that moves every week lights every tab every week, and
     dots that are always on are worse than no dots at all.
   - looking clears it, and only looking; a turned week that changed nothing does not
     re-light a tab
   - and the marks agree with the agenda: if the agenda has three things for the Familia
     at urgency 2, that is what the Familia tab wears. */

import { hasHandle } from "../harness.mjs";

export const name = "glance";
export const describe = "the tab bar says what is new and where, and only when it is";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const R = {};

    const house = (seed)=>{
      const d = A.newGameState("Gl","clean",seed,null);
      d.gold = 9000; d.fame = 900; d.week = 30;
      d.patrons = [{ id:1, name:"Magistrate", rank:"magistrate", favor:60, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      for(let i=0;i<4;i++){ const m = A.genGladiator(d, 72); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.wins=4; m.fatigue=0; m.lastFought=-9;
        d.gladiators.push(m); }
      for(const k of A.TAB_KEYS) A.markSeen(d, k);        /* the player has looked at everything */
      return d;
    };

    /* ---- 1. six tabs, six signatures, and none of them the same ---- */
    { const d = house("GL_SIG");
      const sigs = {}; for(const k of A.TAB_KEYS) sigs[k] = A.tabSig(d, k);
      const empty = A.TAB_KEYS.filter(k=>!sigs[k]);
      const dupes = [];
      for(let i=0;i<A.TAB_KEYS.length;i++) for(let j=i+1;j<A.TAB_KEYS.length;j++)
        if(sigs[A.TAB_KEYS[i]] === sigs[A.TAB_KEYS[j]]) dupes.push(`${A.TAB_KEYS[i]}=${A.TAB_KEYS[j]}`);
      R.sigs = { tabs:A.TAB_KEYS.length, empty, dupes,
        clean: A.TAB_KEYS.filter(k=>A.tabFresh(d,k)) }; }

    /* ---- 2. what counts as news marks the tab ----
       Judged on `tabFresh` — the thing the player actually sees — and NOT on whether the
       signature differs from what it was before the act. Three of these go there and back:
       a man is laid up and comes good again, the altar is used and comes off its rest. The
       signature ends where it started while what was last SEEN sits in between, so a
       before/after comparison called them all failures when the mark was lighting
       correctly. What was last seen is the only baseline that means anything. */
    const moves = (label, tab, act)=>{
      const d = house("GL_"+label.replace(/\W/g,""));
      act(d);
      const others = A.TAB_KEYS.filter(k=>k!==tab && A.tabFresh(d,k));
      return { label, tab, fresh: A.tabFresh(d, tab), others,
        seen: (A.seenOf(d, tab).s||"").slice(0,28), now: A.tabSig(d, tab).slice(0,28) };
    };
    R.news = [
      /* the bill is drawn every third week, so a probe that calls makeGames on whatever
         week it happens to be sitting on gets nothing back and reads "the mark never
         lights for a fresh card" */
      moves("a fresh card is drawn", "arena", d=>{
        d.games = null; A.markSeen(d, "arena");
        for(let i=0;i<4 && !d.games; i++){ d.week++; A.makeGames(d); } }),
      moves("the block is refreshed", "market", d=>A.makeMarket(d)),
      moves("a man is bought", "men", d=>{ A.makeMarket(d);
        const m = (d.market||[]).find(x=>x.price <= d.gold); if(m) A.buyFromBlock(d, m.id, null); }),
      moves("a man is laid up", "men", d=>{ A.activeG(d)[0].injury = { kind:"gash", weeks:3, sev:2 }; }),
      moves("a man comes back fit", "men", d=>{ const g = A.activeG(d)[0];
        g.injury = { kind:"gash", weeks:3, sev:2 }; A.markSeen(d, "men"); g.injury = null; }),
      moves("a letter comes from Rome", "villa", d=>{ d.flags.primusHeld = 1;
        d.fame = A.romeBar(d) + 500;
        d.patrons = [{ id:1, name:"A senator", rank:"senator", favor:85, want:null, since:0, served:0, slighted:0 }];
        A.recomputeFavor(d); A.markSeen(d, "villa"); A.offerRome(d); }),
      moves("a patron asks for something", "villa", d=>{ d.patrons[0].want = { kind:"party", due:d.week+6 }; }),
      moves("the altar comes off its rest", "villa", d=>{ A.makeOffering(d, "mars");
        d.blessing = null; A.markSeen(d, "villa"); d.lastOffering = d.week - A.OFFERING_COOL; }),
      moves("a wing goes up", "ludus", d=>A.buildUp(d, "balneae")),
      moves("a work is begun", "ludus", d=>{ d.gold = 90000;
        const k = A.ALL_WORK_KEYS.find(x=>A.workOpen(d,x) && !A.workOn(d,x) && !A.workDone(d,x));
        if(k) A.beginWork(d, k); }),
      moves("steel starts to go", "armory", d=>{ const g = A.activeG(d)[0];
        const bought = Object.keys(A.GEAR).find(x=>{ const it=A.GEAR[x];
          return it.slot==="weapon" && !it.stock && it.price>0 && it.price < 900; });
        if(bought){ A.buyGearItem(d, bought); A.equipOne(d, g.id, "weapon", bought);
          A.markSeen(d, "armory"); g.wear = g.wear||{}; g.wear.weapon = 6; } }),
      moves("a man is buried", "men", d=>{ const g = A.activeG(d)[0]; g.status = "dead";
        d.fallen = (d.fallen||[]).concat([{ name:g.name, week:d.week }]); }),
    ];

    /* ---- 3. and what is NOT news leaves it alone ----
       This is the half that keeps the marks worth looking at. A signature that reads
       anything continuous lights its tab every single week for four hundred weeks. */
    const still = (label, act)=>{
      const d = house("GL_S"+label.replace(/\W/g,""));
      act(d);
      return { label, lit: A.TAB_KEYS.filter(k=>A.tabFresh(d,k)) };
    };
    R.quiet = [
      still("fatigue creeping up", d=>{ for(const g of A.activeG(d)) g.fatigue = 44; }),
      still("unrest wandering", d=>{ d.unrest = 38; }),
      still("coin coming in", d=>{ d.gold += 4000; }),
      still("fame climbing", d=>{ d.fame += 2500; }),
      still("morale sagging", d=>{ for(const g of A.activeG(d)) g.morale = 41; }),
      still("a week of nothing at all", d=>{ d.pendingEvent = null;
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "rest");
        /* the card and the block genuinely do change on a turned week; the point here is
           that the tabs which had no arrival on them stay dark */
        try { A.endWeek(d); } catch(e){} }),
    ];

    /* ---- 3b. AN EMPTY TAB IS NOT NEWS ----
       The Arena was marked fresh in 68% of weeks and 42% of those changes were the card
       being CONSUMED rather than a new one arriving — 352 arrivals against 352
       disappearances over 1,200 weeks. A signature that moves when its subject goes away
       reports the absence of news as news, at exactly the same rate as the real thing. */
    { const d = house("GL_QUIET");
      d.games = null; A.markSeen(d, "arena");
      for(let i=0;i<4 && !d.games; i++){ d.week++; A.makeGames(d); }
      const litOnArrival = A.tabFresh(d, "arena");
      /* the player never looked, and the card is fought off the board */
      d.games = null;
      R.quietTab = { litOnArrival, quiet: A.tabQuiet(d, "arena"),
        litOnEmpty: A.tabFresh(d, "arena"),
        /* and the NEXT card still lights it, because nothing overwrote what was seen */
        litAgain: (()=>{ for(let i=0;i<8 && !d.games; i++){ d.week++; A.makeGames(d); }
          return { got:!!d.games, fresh:A.tabFresh(d, "arena"),
            seen:(A.seenOf(d,"arena").s||"").slice(0,24), now:A.tabSig(d,"arena").slice(0,24) }; })() }; }

    /* ---- 3c. AND THE BADGE COUNTS WHAT IS ASKING ----
       It counted every agenda item including urgency 1 — "when you can" — and `1|men` runs
       at 2.28 items a week (men not sworn in, moves not taught: standing options that never
       clear if you have decided against them). That was a permanent "2" on the Familia tab.
       The agenda holds 7.86 items a week and only 3.64 at urgency 2 or 3. */
    { const d = house("GL_BADGE");
      /* a house whose only business is a pile of urgency-1 options */
      const items = A.agenda(d), m = A.tabMarks(d);
      const quietOnly = A.TAB_KEYS.filter(k=>{
        const mine = items.filter(x=>x.tab===k);
        return mine.length && mine.every(x=>(x.urgency||0) < A.MARK_URG); });
      R.badge = { threshold:A.MARK_URG,
        quietOnlyTabs: quietOnly,
        badgedAnyway: quietOnly.filter(k=>m[k].n > 0),
        /* and the quiet ones are still counted, just not badged */
        carried: A.TAB_KEYS.filter(k=>m[k].quiet > 0),
        loudCounted: A.TAB_KEYS.every(k=>
          m[k].n === items.filter(x=>x.tab===k && (x.urgency||0) >= A.MARK_URG).length) }; }

    /* ---- 4. looking clears it, and only looking ---- */
    { const d = house("GL_SEEN");
      d.games = null; A.markSeen(d, "arena");
      for(let i=0;i<4 && !d.games; i++){ d.week++; A.makeGames(d); }
      const litBefore = A.tabFresh(d, "arena");
      A.markSeen(d, "arena");
      const litAfter = A.tabFresh(d, "arena");
      /* looking at one tab must not clear another */
      A.makeMarket(d);
      const marketStillLit = A.tabFresh(d, "market");
      A.markSeen(d, "arena");
      const marketAfterLookingElsewhere = A.tabFresh(d, "market");
      R.seen = { litBefore, litAfter, marketStillLit, marketAfterLookingElsewhere }; }

    /* ---- 5. the marks agree with the agenda ---- */
    { const d = house("GL_MARK");
      d.unrest = 74; d.gold = 30000;                        /* the cells, loudly */
      for(const g of A.activeG(d).slice(0,2)) g.injury = { kind:"gash", weeks:3, sev:2 };
      d.piety = 8;
      const items = A.agenda(d), m = A.tabMarks(d);
      const byTab = {};
      /* against the LOUD items only — the badge counts urgency MARK_URG and above, so
         comparing it to every item on the tab was comparing two different things and made
         the villa row read 1 against 3 */
      for(const it of items) if((it.urgency||0) >= A.MARK_URG)
        byTab[it.tab] = (byTab[it.tab]||[]).concat([it.urgency]);
      R.marks = { tabs:Object.keys(m).length, threshold:A.MARK_URG,
        rows: A.TAB_KEYS.map(k=>({ tab:k, n:m[k].n, urg:m[k].urg, fresh:m[k].fresh,
          quiet:m[k].quiet,
          realN:(byTab[k]||[]).length, realUrg:Math.max(0, ...(byTab[k]||[0])) })) }; }

    /* ---- 6. the feast and the rung, which the agenda never mentioned ---- */
    { const say = d => A.agenda(d).map(x=>({ u:x.urgency, t:x.tab, l:x.label, s:x.sub }));
      const cells = house("GL_FEAST"); cells.unrest = 58; cells.gold = 30000;
      const calm  = house("GL_CALM");  calm.unrest = 12;  calm.gold = 30000;
      const broke = house("GL_BROKE"); broke.unrest = 58; broke.gold = 40;
      const rung  = house("GL_RUNG");  rung.gold = 30000; rung.fame = 3000;
      rung.patrons = [{ id:1, name:"P", rank:"senator", favor:90, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(rung);
      /* the rung wants a full census as well as the fame and the favour — riseNeed reads
         four things and a probe setting two of them measures nothing */
      rung.rise = { rank:0, standing:100 };
      for(let i=0;i<200 && !A.canClaimRise(rung); i++){ rung.gold += 2000; rung.fame += 200; }
      /* a rival's man: `courted` fired 0 times in 4,908 house-weeks and the arc works
         perfectly when driven — 14 of 26 approaches landed. Gated on having somewhere to put
         him, so a full house hears nothing; measured at +0.08 items a week, which is the
         difference between a prompt and wallpaper. */
      /* short-handed, which is the gate: v2.63.0 hung this on room-in-the-cells alone and it
         stood in 36.7% of weeks — the #101 fault one release later. On a real gap it is 13%. */
      const room = house("GL_ROOM"); room.gold = 40000;
      for(const g of A.activeG(room).slice(2)) g.injury = { kind:"gash", weeks:3, sev:2 };
      /* and one with room but plenty of fit men, which must hear nothing */
      const manned = house("GL_MANNED"); manned.gold = 40000;
      const full = house("GL_FULL"); full.gold = 40000;
      while(!A.rosterFull(full)){ const m = A.genGladiator(full, 90); m.id=full.nextId++;
        m.status="active"; m.mine=true; m.kit=A.defaultKit(m.cls);
        for(const k of A.STATS) m[k] = Math.min(A.statCap(m,k), 96);
        full.gladiators.push(m); }
      R.can = {
        court: say(room).filter(x=>/could be got at/i.test(x.l)),
        courtWhenFull: say(full).filter(x=>/could be got at/i.test(x.l)).length,
        courtWhenManned: say(manned).filter(x=>/could be got at/i.test(x.l)).length,
        mannedFit: A.activeG(manned).filter(g=>!g.injury).length,
        feast: say(cells).filter(x=>/feast/i.test(x.l)),
        calm:  say(calm).filter(x=>/feast/i.test(x.l)).length,
        broke: say(broke).filter(x=>/feast/i.test(x.l)).length,
        rung:  say(rung).filter(x=>/rung|there to be taken/i.test(x.l)),
        canClaim: A.canClaimRise(rung) }; }

    /* ---- 7. the folded panels one level down ----
       Kept as functions of the save rather than conditions inside the JSX, so this can ask
       what each panel would wear. Every one from both sides: the state that lights it, and
       a state that must leave it dark. */
    { const mk = (key, on, off)=>{
        const a = house("GL_M"+key), b = house("GL_N"+key);
        on(a); if(off) off(b);
        return { key, lit: A.sectMark(a, key), dark: A.sectMark(b, key) };
      };
      R.sect = [
        mk("cells",  d=>{ d.unrest = 74; }, d=>{ d.unrest = 12; }),
        mk("feast",  d=>{ d.unrest = 58; d.gold = 30000; }, d=>{ d.unrest = 58; d.gold = 20; }),
        mk("temple", d=>{ d.piety = 8; }, d=>{ d.piety = 55; A.makeOffering(d, "mars"); }),
        mk("rome",   d=>{ d.flags.primusHeld = 1; d.fame = A.romeBar(d)+500;
          d.patrons = [{ id:1, name:"S", rank:"senator", favor:85, want:null, since:0, served:0, slighted:0 }];
          A.recomputeFavor(d); }, d=>{}),
        mk("collegium", d=>{ d.gold = 5000; }, d=>{ A.foundCollegium(d); }),
        mk("rites",  d=>{ d.unburied = [{ id:1, name:"Somebody", week:d.week }]; }, d=>{}),
        mk("block",  d=>{ const g = A.makeParagon(d); d.market = [g, ...(d.market||[])]; }, d=>{}),
        /* the rung wants four things at once, so walk a house up to it rather than
           setting two of them and measuring nothing */
        mk("standing", d=>{ d.rise = { rank:0, standing:100 }; d.gold = 6000; d.fame = 900;
          for(let i=0;i<200 && !A.canClaimRise(d); i++){ d.gold += 2000; d.fame += 200; } }, d=>{}),
      ];
      R.sectKeys = Object.keys(A.SECT_MARK); }

    /* ---- 8. and none of it survives a save/load ---- */
    { const d = house("GL_SAVE");
      d.games = null; A.makeGames(d);
      const lit = A.tabFresh(d, "arena");
      const round = A.migrate(JSON.parse(JSON.stringify(d)));
      R.save = { lit, keptSeen: !!round.seen && Object.keys(round.seen).length > 0,
        sameAfter: A.tabFresh(round, "arena") === lit }; }

    /* ---- 9. AND THE FIRST HOUR, WHICH IS WHERE A LIST IS EITHER USEFUL OR NOISE ----
       Nothing had ever read the agenda as a beginner meets it. Over fourteen houses through
       their first thirty weeks, the list carried 3.57 items at urgency 2 or more every week
       and more than two of them in 81.1% of weeks — because "Nobody in this yard can teach"
       sat at urgency 2 in 100.0% of those weeks, being both true and affordable and simply
       not yet acted on. A permanent item that outranks the week's news is not a priority.
       Dropping it to a standing note after the first half-year: 2.94 a week and 58.8%.
       (`add` consumes no randomness, so this is one of the few paired comparisons this
       project's RNG allows — same seeds, same policy, one expression changed.) */
    { const S6 = ["str","agi","end","tec","sho","dis"];
      let weeks = 0, urgSum = 0, crowded = 0, perma = 0;
      for(let h=0; h<6; h++){
        const d = A.newGameState("GL_HOUR","clean","GL-HOUR"+h,null);
        for(let w=0; w<30; w++){
          let items = []; try { items = A.agenda(d) || []; } catch(e){}
          weeks++;
          const loud = items.filter(x=>x.urgency >= A.MARK_URG);
          urgSum += loud.length;
          if(loud.length > 2) crowded++;
          if(loud.some(x=>/can teach/.test(x.label||""))) perma++;
          /* played, because what the list says to a house doing nothing is not the question */
          while(A.activeG(d).length<6 && !A.rosterFull(d) && d.gold > A.weeklyBill(d)*6 + 900){
            let got=false;
            for(const m of (d.market||[]).slice().sort((a,b)=>
              (b.str+b.agi+b.end+b.tec+b.sho+b.dis)-(a.str+a.agi+a.end+a.tec+a.sho+a.dis))){
              if(m.paragon || m.price > d.gold-800) continue;
              if(A.buyFromBlock(d,m.id,null)){ got=true; break; } }
            if(!got) break; }
          for(const g of A.activeG(d)){
            if((g.fatigue||0)>=55) A.setRegimenOf(d,g.id,"rest");
            else { A.setRegimenOf(d,g.id,"palus");
              A.setFocusOf(d,g.id,S6.reduce((m,k)=>g[k]<g[m]?k:m,S6[0])); } }
          if(d.unrest>=35 && d.gold>A.feastCost(d)+A.weeklyBill(d)) A.throwFeast(d);
          let pool = A.activeG(d).filter(g=>!g.injury&&(g.lastFought==null||g.lastFought<d.week));
          for(const o of ((d.games&&d.games.offers)||[])){
            if(o.pair||o.melee||o.venatio||(!o.imperial&&o.stakes==="sine")) continue;
            const g = pool.find(x=>x.status==="active"&&!x.injury); if(!g) break;
            let x=A.doFight(d,g.id,o,"measured",null,null,null,"none");
            /* #116: to exhaustion, and the result captured — this threw the resumed bout away, so
               a second word was never spoken and the bout stayed pending */
            { let n=0; while(x&&x.crux&&n++<4){ const pd=x.pending; pd.beats=x.beats;
              x=A.doFight(d,g.id,o,"measured",null,pd,"press","none"); } } }
          d.pendingEvent = null;
          try { A.endWeek(d); } catch(e){ break; }
          if(d.over) break;
        }
      }
      R.hour = { weeks, perWeek:+(urgSum/weeks).toFixed(2),
        crowded:+(crowded/weeks*100).toFixed(1), perma:+(perma/weeks*100).toFixed(1) }; }

    /* ---- 10. LOOKING PUTS THE BADGE OUT, EVEN WHEN THE THING IS STILL ASKING ----
       The badge showed whenever the agenda had a loud item for the tab, so it did not go out
       when you went and looked — the Armory sat on a "1" through the armoury and back out
       again. Looking at a thing does not answer it, but a mark you cannot clear is a mark you
       stop believing. So what is ASKING is part of what "seen" means, and only additions
       count: a new item lights it, an answered one going away does not. */
    { const d = house("GL_ASK");
      d.pendingEvent = { id:"x", title:"A NOBLE'S REQUEST" };
      const lit = A.tabFresh(d, "ludus");
      A.markSeen(d, "ludus");
      const afterLook = A.tabFresh(d, "ludus");
      const stillLoud = (A.agendaAsk(d).ludus || []).length;
      d.pendingEvent = { id:"y", title:"FEVER IN THE CELLS" };
      const relit = A.tabFresh(d, "ludus");
      A.markSeen(d, "ludus");
      d.pendingEvent = null;
      const afterAnswer = A.tabFresh(d, "ludus");
      R.ask = { lit, afterLook, stillLoud, relit, afterAnswer }; }

    /* ---- 11. AND A MARK POINTS AT A SCREEN, NOT AT FOUR OF THEM ----
       The villa has four faces behind its own switcher and twenty-three sections across them,
       so a mark on the Villa tab dropped the player on The House to go hunting. Each face
       carries the loudest mark of the sections that live on it. */
    { const faceOf = (seed, act)=>{ const d = house(seed); act(d);
        /* three faces since v3.85.0: `The Cells` carried one panel and was folded into `The House`,
           and its marks came with it — a chip that stops reporting the feast is worse than a chip. */
        const out = {}; for(const f of ["house","standing","council"]) out[f] = A.faceMark(d,"villa",f);
        return out; };
      R.faces = {
        "a letter from Rome": faceOf("GL_FR", d=>{ d.flags.primusHeld = 1; d.fame = A.romeBar(d) + 500;
          d.patrons = [{ id:1, name:"A senator", rank:"senator", favor:85, want:null, since:0, served:0, slighted:0 }];
          A.recomputeFavor(d); A.offerRome(d); }),
        "the cells simmering": faceOf("GL_FC", d=>{ d.unrest = 62; d.gold = 9000; }),
        "a quiet house": faceOf("GL_FQ", d=>{ d.unrest = 4; d.piety = 40; d.lastOffering = d.week; }),
      };
      R.faceKeys = A.FACE_SECTS.villa; }

    return R;
  });

  const lines = [], fails = [];
  lines.push(`${out.sigs.tabs} tabs, ${out.sigs.tabs - out.sigs.empty.length} with a signature, ${out.sigs.dupes.length} pairs sharing one`);
  lines.push("what counts as news:");
  for(const n of out.news)
    lines.push(`   ${n.fresh ? "✓" : "✗"} ${n.label.padEnd(28)} → ${n.tab}${n.others.length ? `  (also lit ${n.others.join(",")})` : ""}`);
  lines.push("and what does not:");
  for(const q of out.quiet)
    lines.push(`   ${q.lit.length ? "✗" : "✓"} ${q.label.padEnd(28)} ${q.lit.length ? `lit ${q.lit.join(",")}` : "left every tab dark"}`);
  lines.push(`an empty arena: a fresh card lit it ${out.quietTab.litOnArrival}, the card gone → quiet ${out.quietTab.quiet}, lit ${out.quietTab.litOnEmpty}, and the next card lit it again ${out.quietTab.litAgain.fresh}`);
  lines.push(`the badge counts urgency ${out.badge.threshold}+: tabs holding only quieter items ${out.badge.quietOnlyTabs.join(",")||"none"} · badged anyway ${out.badge.badgedAnyway.join(",")||"none"} · still carried as quiet ${out.badge.carried.join(",")||"none"}`);
  lines.push(`looking clears it: lit ${out.seen.litBefore} → ${out.seen.litAfter}; looking at the arena left the market ${out.seen.marketAfterLookingElsewhere ? "still lit" : "CLEARED TOO"}`);
  lines.push("the marks against the agenda:");
  for(const r of out.marks.rows)
    lines.push(`   ${r.tab.padEnd(7)} badge ${r.n} at urgency ${r.urg}${r.fresh?" · new":""}  (agenda has ${r.realN} loud, ${r.quiet} quieter)`);
  lines.push(`the feast: ${out.can.feast.map(x=>`[${x.u}] ${x.l} — ${x.s}`).join("; ") || "NOT MENTIONED"}`);
  lines.push(`   quiet cells ${out.can.calm ? "STILL NAGGED" : "silent"} · a house that cannot pay for one ${out.can.broke ? "STILL OFFERED IT" : "silent"}`);
  lines.push(`the rung: ${out.can.rung.map(x=>`[${x.u}] ${x.l} — ${x.s}`).join("; ") || (out.can.canClaim ? "NOT MENTIONED" : "none claimable")}`);
  lines.push(`a rival's man: ${out.can.court.map(x=>`[${x.u}] ${x.l} — ${x.s}`).join("; ") || "not mentioned"} · a full house of better men ${out.can.courtWhenFull ? "IS STILL TOLD" : "hears nothing"}`);

  const K = out.ask;
  lines.push(`a thing asking: lit ${K.lit} → looked at it → ${K.afterLook}`
    + ` (it is still asking: ${K.stillLoud} loud item${K.stillLoud===1?"":"s"})`
    + ` · a NEW one lights it again ${K.relit} · answering one does not ${K.afterAnswer}`);
  if(!K.lit) fails.push("a thing asking on a tab did not mark it at all");
  if(K.afterLook) fails.push("the mark survived being looked at — this is the fault the Armory badge had, where a standing item kept it lit for ever");
  if(!K.stillLoud) fails.push("the test is hollow: nothing was still asking after the look, so clearing it proves nothing");
  if(!K.relit) fails.push("a NEW thing asking did not re-light a tab already looked at — the badge can now never come back");
  if(K.afterAnswer) fails.push("answering the thing re-lit the tab — an item going away is not news, which is the v2.62.0 arena fault returning");

  lines.push("which face of the villa a mark points at:");
  for(const [k,v] of Object.entries(out.faces))
    lines.push(`   ${k.padEnd(21)} ${Object.entries(v).map(([f,m])=>`${f} ${m===true?"·":m?`[${m.urg}] ${m.n}`:"—"}`).join("  ")}`);
  if(!out.faces["a letter from Rome"].standing)
    fails.push("a letter from Rome left the villa's Standing face unmarked, which is the face the road to Rome is on");
  if(out.faces["a letter from Rome"].house)
    fails.push("a letter from Rome marked The House, which has nothing to do with it");
  if(!out.faces["the cells simmering"].house)
    fails.push("simmering cells left The House unmarked, and the feast is on that face now");
  if(out.faces["the cells simmering"].standing)
    fails.push("simmering cells marked Standing, which is not where the answer is");
  if(Object.values(out.faces["a quiet house"]).some(Boolean))
    fails.push("a quiet house wears a mark on some face of the villa");
  /* and a face only ever carries a count. A plain dot means "there is something you could do
     here", which is true of a solvent house for ever — carried up to the chips it put a
     permanent dot on two of the four faces, the same fault as a badge that will not go out. */
  for(const [k,v] of Object.entries(out.faces))
    for(const [f,m] of Object.entries(v))
      if(m === true) fails.push(`with ${k}, the villa's ${f} face wears a bare dot — a face may only carry something that is asking`);

  lines.push(`the first hour (${out.hour.weeks} house-weeks of the opening thirty): ${out.hour.perWeek} loud items a week · `
    + `more than two in ${out.hour.crowded}% of weeks · the teacher line loud in ${out.hour.perma}%`);
  /* a list where most weeks carry three or more things ranked "answer this" has no ranking
     left. Measured before the doctore line stopped outranking the week's news: 3.57 and 81.1% */
  if(out.hour.perWeek > 3.3)
    fails.push(`${out.hour.perWeek} items a week at urgency ${2}+ through the first thirty weeks — the ranking has stopped ranking`);
  if(out.hour.crowded > 70)
    fails.push(`more than two loud items in ${out.hour.crowded}% of a beginner's first thirty weeks`);
  if(out.hour.perma > 60)
    fails.push(`the teacher line is loud in ${out.hour.perma}% of the first hour — a permanent item at that rank is furniture, not a priority`);

  /* ---- a signature each, and no two alike ---- */
  if(out.sigs.empty.length)
    fails.push(`${out.sigs.empty.join(", ")} — no signature at all, so nothing on those tabs can ever be new`);
  if(out.sigs.dupes.length)
    fails.push(`${out.sigs.dupes.join(", ")} share a signature — a mark would light the wrong tab`);
  if(out.sigs.clean.length)
    fails.push(`${out.sigs.clean.join(", ")} are marked new on a house that has just looked at all six`);

  /* ---- news moves it ---- */
  for(const n of out.news){
    if(!n.fresh)
      fails.push(`${n.label} left the ${n.tab} tab unmarked — last seen "${n.seen}", now "${n.now}", so a player has no way to know it happened`);
    if(n.others.length > 2)
      fails.push(`${n.label} lit ${n.others.length} other tabs (${n.others.join(",")}) — the signatures are reading each other's state`);
  }

  /* ---- and drift does not ---- */
  for(const q of out.quiet){
    if(q.label === "a week of nothing at all") continue;    /* a turned week may bring a card */
    if(q.lit.length)
      fails.push(`${q.label} lit ${q.lit.join(", ")} — a signature reading something continuous marks its tab new every week for ever, and dots that are always on are worse than none`);
  }

  /* ---- an empty tab is not news ---- */
  if(!out.quietTab.litOnArrival) fails.push("a fresh card did not light the arena at all");
  if(!out.quietTab.quiet) fails.push("an arena with no card, no ask and no trip does not read as quiet");
  if(out.quietTab.litOnEmpty)
    fails.push("the card being fought off the board marked the arena new — that is the absence of news reported as news, and it happens exactly as often as a real card");
  if(!out.quietTab.litAgain.got)
    fails.push("no second card could be drawn in eight weeks — the quiet-tab case could not be tested");
  else if(!out.quietTab.litAgain.fresh)
    fails.push(`after a card was consumed the NEXT card did not light the tab (seen "${out.quietTab.litAgain.seen}", now "${out.quietTab.litAgain.now}") — quieting a tab must not overwrite what was last seen`);
  /* ---- and the badge counts what is asking ---- */
  if(!out.badge.loudCounted)
    fails.push(`a tab's badge does not equal its count of urgency-${out.badge.threshold}+ items`);
  if(out.badge.badgedAnyway.length)
    fails.push(`${out.badge.badgedAnyway.join(", ")} wear a badge for items at urgency 1 alone — "when you can" belongs on the agenda, not on a permanent count, and \`1|men\` alone runs at 2.28 items a week`);

  /* ---- looking is what clears it ---- */
  if(!out.seen.litBefore) fails.push("a fresh card did not mark the arena new");
  if(out.seen.litAfter) fails.push("looking at the arena did not clear its mark");
  if(!out.seen.marketStillLit) fails.push("a refreshed block did not mark the market new");
  if(!out.seen.marketAfterLookingElsewhere)
    fails.push("looking at the arena cleared the market's mark as well — one markSeen is clearing every tab");

  /* ---- and the bar shows what the agenda actually has ---- */
  if(out.marks.tabs !== out.sigs.tabs) fails.push(`tabMarks returned ${out.marks.tabs} tabs for ${out.sigs.tabs}`);
  for(const r of out.marks.rows){
    if(r.n !== r.realN) fails.push(`the ${r.tab} tab would show ${r.n} against the agenda's ${r.realN}`);
    if(r.urg !== r.realUrg) fails.push(`the ${r.tab} tab would show urgency ${r.urg} against the agenda's ${r.realUrg}`);
  }
  if(!out.marks.rows.some(r=>r.n > 0))
    fails.push("a house with the cells near fire, two men laid up and no rites kept has nothing on any tab — the marks are not reading the agenda");
  if(!out.marks.rows.some(r=>r.quiet > 0))
    fails.push("no tab carries any quieter item — the urgency-1 tier has stopped being counted at all, and the agenda still needs it");

  /* ---- the two things you could simply do ---- */
  if(!out.can.feast.length)
    fails.push("cells past restless, 30,000d in the box, and the agenda does not mention the feast — this was the whole ask");
  else {
    if(out.can.feast[0].t !== "ludus") fails.push(`the feast line points at "${out.can.feast[0].t}"`);
    if(!/\d/.test(out.can.feast[0].s || "")) fails.push("the feast line does not say what it costs or who it reaches");
  }
  if(out.can.calm) fails.push("a house with quiet cells is told to throw a feast");
  if(out.can.broke) fails.push("a house that cannot afford a feast is told to throw one");
  if(!out.can.court.length)
    fails.push("a house short of fit men, with room in its cells and coin in the box, is told nothing about the man it could get at — `courted` fired 0 times in 4,908 house-weeks and the arc lands 14 of 26 when driven");
  else if(out.can.court[0].u >= 2)
    fails.push("the rival's man is raised as something demanding an answer — it is an opportunity, not a problem");
  if(out.can.courtWhenFull)
    fails.push("a house with no room in its cells is told to court somebody — the gate on this line is what keeps it from becoming wallpaper");
  /* and a house that is NOT short-handed hears nothing, which is the whole of the v2.63.1 fix:
     the best man in Capua is a median 1.43× your own best, so "better than anybody you own"
     was true almost always and stood in 36.7% of weeks */
  if(out.can.courtWhenManned)
    fails.push(`a house with ${out.can.mannedFit} fit men is told where to get another — the gate must be a gap, not a comparison, because the best rival man is a median 1.43× your own best and no margin fixes that`);
  if(out.can.canClaim && !out.can.rung.length)
    fails.push("a rung is there to be taken and the agenda says nothing — the stipend runs from the week you claim it");

  /* ---- and the panels inside a tab say which one it is ---- */
  lines.push("the folded panels:");
  for(const x of out.sect)
    lines.push(`   ${x.lit ? "✓" : "✗"} ${x.key.padEnd(10)} lit ${JSON.stringify(x.lit)} · dark ${JSON.stringify(x.dark)}`);
  for(const x of out.sect){
    if(!x.lit) fails.push(`the ${x.key} panel wears no mark in the state that is supposed to light it`);
    if(x.dark) fails.push(`the ${x.key} panel wears a mark (${JSON.stringify(x.dark)}) in a state where there is nothing to do — a mark that is always on is not a mark`);
  }
  { const covered = out.sect.map(x=>x.key), missing = out.sectKeys.filter(k=>!covered.includes(k));
    if(missing.length) fails.push(`${missing.join(", ")} are in SECT_MARK and nothing here drives them`); }

  /* ---- and it survives being written down ---- */
  if(!out.save.keptSeen) fails.push("the last-looked signatures do not survive a save — every tab lights up on load");
  if(!out.save.sameAfter) fails.push("a save/load round trip changed which tabs are marked new");

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
