/* THE NAME CAPUA SETTLES ON, AND THE MAN IN THE CHAIR WHO IS MADE OF IT.

   #111 named `lanistaWeek`, `hasLT`, `repStyle` and `addRep` as a dark group. #95 had already
   settled the traits themselves (`hard` in two houses of eight, `shrewd` in seven once the probe
   has a flutter, `marked` only if you fix a bout and are caught). What nothing had measured is the
   thing UPSTREAM of them: `repStyle`, the name the town settles on. It earns `hard` and `merciful`
   at fifteen straight weeks, and it is one of the two things that makes a medicus walk out — which
   is all of #112.

   FOUR SUSPICIONS WENT IN AND FOUR CAME OUT REFUTED, EVERY ONE OF THEM THE PROBE'S.

   1. "The town may never settle on a name at all." It settles in **87% to 100% of house-weeks** in
      every arm, first name at median week 2 to 11, over 10 of 10 houses each time.

   2. "`show` is never the name." First sweep: the name for **1 week out of 3,001**. The cause was
      that every arm passed `"measured"` as the tactic, and `showboat` is the one thing that awards
      `show` per bout. A house that showboats holds the name **824 of 917 weeks**. The lever was
      the one the probe had its hand on the whole time.

   3. "`mercy` cannot be earned on purpose." The arm built to test it fought at FIRST BLOOD, which
      is the naive reading and the exact thing the charter's tenth step warns about — "at first
      blood it ends at the wound and nobody is ever on their knees" — so it reached no crux, threw
      **0 cloths in 2,345 house-weeks**, and was called `craft`. The policy the charter actually
      teaches, fighting to surrender and then letting the man up, threw **727 cloths** and held the
      mercy name **1,277 of 1,296 weeks**, with all ten houses earning the `merciful` trait.

   4. "`recordCloth` awards no mercy rep." It does not, and it should not. The eight points are
      paid where the cloth is RESOLVED, once per engine, plus three for a man spared without dying.
      A duplicate award was written, tested, and found to change nothing — 1,277 of 1,296 either
      way, because mercy was already saturating — and that identical figure is what caught it.

   WHAT IS REAL IS #112, AND THE CLAUSE HAS TEETH. `STAFF.medicus.quitOn` is
   `d.unrest > 72 || repStyle(d) === "blood"`. The butcher loses his surgeon in **9 of 10 houses at
   median week 12**; the showman, playing just as hard for just as long, loses him in **0 of 10**.
   That is the clause doing exactly what it says.

   SO WHAT THIS CHECK HOLDS is the shape all four of those refutations depend on: every one of the
   four names is reachable by a house that goes after it, and the butcher — and only the butcher —
   loses his surgeon. If a name becomes ungettable, or the tactic stops feeding `show`, or the
   cloth stops feeding `mercy`, the fault I thought I had found becomes real and this fails. */

import { hasHandle } from "../harness.mjs";

export const name = "chair";
export const describe = "each of the four names Capua can give a house is earnable, and the butcher loses his surgeon";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const SC = A.SC_KEYS;
    const av = g => A.STATS.reduce((s,k)=>s+(g[k]||0),0)/6;
    const fin = (fn, args) => { try { return fn(...args); } catch(e){ return null; } };
    const cheapest = (d, room) => (d.market||[]).filter(m=>m.price<=room).sort((a,b)=>a.price-b.price)[0]||null;
    const keep = d => {
      if(A.activeG(d).filter(g=>!g.injury).length < 4 && !A.rosterFull(d)){
        const m = cheapest(d, d.gold - 260); if(m) A.buyFromBlock(d, m.id, null); }
    };
    const fitMen = (d, cap) => A.activeG(d).filter(g=>!g.injury && (g.fatigue||0) < cap)
      .sort((x,z)=>av(z)-av(x));
    /* THE ROPE: the card if there is one, the pit if there is not — a house that only reads
       `d.games.offers` never fights, which is how #110's first sweep measured nothing. And #116
       found the other half of it here: this arm answered no cruxes, so ~60% of the bouts it did
       find returned at `res.unfinished` and awarded no reputation at all. It is the harness rope
       now, which answers to exhaustion. */
    const bout = (d, fit, pick, stakes, tac) => {
      window.__ROPE.takeBout(d, { men:fit, pick, stakes, tactic:tac });
    };

    /* one arm per name, each going after that name the way a player would */
    const ARMS = {
      blood: { doctrine:"blood", play: d => {
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "palus");
        keep(d);
        const fit = A.activeG(d).filter(g=>!g.injury);
        bout(d, fit, os => os.filter(o=>o.stakes==="sine").sort((a,b)=>(b.purse||0)-(a.purse||0))[0]
          || os.sort((a,b)=>(b.purse||0)-(a.purse||0))[0], "sine", "aggressive");
      }},
      show: { doctrine:null, play: d => {
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, (g.fatigue||0)>55?"rest":"palus");
        keep(d);
        bout(d, fitMen(d,55), os => os.sort((a,b)=>(b.purse||0)-(a.purse||0))[0], "standard", "showboat");
      }},
      craft: { doctrine:"craft", play: d => {
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, (g.fatigue||0)>50?"rest":"palus");
        keep(d);
        bout(d, fitMen(d,50), os => os.sort((a,b)=>(b.purse||0)-(a.purse||0))[0], "standard", "defensive");
      }},
      /* and the mercy arm is the one that has to fight to SURRENDER and then let the man up.
         Fighting at first blood is caution, not mercy, and the charter says so. */
      mercy: { doctrine:"mercy", play: d => {
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, (g.fatigue||0)>50?"rest":"palus");
        keep(d);
        const fit = fitMen(d, 50);
        if(!fit.length) return;
        const os = ((d.games && d.games.offers)||[]).filter(o=>!(o.pair||o.melee) && o.stakes!=="sine");
        let o = os.sort((a,b)=>(b.purse||0)-(a.purse||0))[0];
        if(!o){
          if(!d.pitCard || d.pitCard.week !== d.week) A.makePitCard(d);
          const men = A.pitMen(d) || [];
          o = A.makePitOffer(d, fit[0], "standard", men.length ? men[0].id : null);
        }
        if(!o) return;
        const x = fin(A.doFight, [d, fit[0].id, o, "measured", null, null, null, "none"]);
        if(x && x.crux){ const pd = x.pending; pd.beats = x.beats;
          fin(A.doFight, [d, fit[0].id, o, "measured", null, pd, "cloth", "none"]); }
      }},
    };

    const HOUSES = 6, WEEKS = 90;
    const res = {};
    let threw = 0, firstThrow = null;
    for(const [want, arm] of Object.entries(ARMS)){
      const R = { held:{blood:0,show:0,craft:0,mercy:0}, weeks:0, named:0, houses:0,
        gotWanted:0, medHired:0, medQuit:0, quitWeeks:[], cloths:0, traits:{} };
      for(let h=0; h<HOUSES; h++){
        const d = A.newGameState("Ch"+h, SC[h % SC.length], `CHAIR-${want}-${h}`, null);
        /* a surgeon to lose, which needs his room first — and the market he is hired from is
           built on a week turn, so a fresh state has none until `makeStaffMarket` is called.
           The first draft skipped that and hired nobody in any arm, leaving #112 untested. */
        d.gold = 9000;
        for(let i=0;i<2;i++) A.buildUp(d, "valetudinarium");
        A.makeStaffMarket(d);
        for(const c of ((d.staffMarket && d.staffMarket.medicus) || []))
          if(!d.medicus) A.hireStaffMember(d, "medicus", c.id);
        if(d.medicus) R.medHired++;
        if(arm.doctrine) A.declareDoctrine(d, arm.doctrine);
        R.houses++;
        let sawWanted = false, quitAt = null;
        for(let w=0; w<WEEKS; w++){
          if(d.over) break;
          try { arm.play(d); } catch(e){ threw++; if(!firstThrow) firstThrow = `${want}: ${e.message}`; }
          if(d.pendingEvent){ try { A.EVENTS[d.pendingEvent.id].run(d, d.pendingEvent, 0); } catch(e){} d.pendingEvent = null; }
          const had = !!d.medicus;
          try { A.endWeek(d); } catch(e){ break; }
          R.weeks++;
          if(had && !d.medicus && quitAt == null){ quitAt = d.week; }
          const st = A.repStyle(d);
          if(st){ R.named++; R.held[st]++; if(st === want) sawWanted = true; }
        }
        if(sawWanted) R.gotWanted++;
        if(quitAt != null){ R.medQuit++; R.quitWeeks.push(quitAt); }
        R.cloths += (d.flags.everCloth || 0);
        for(const t of (d.lanista ? (d.lanista.traits||[]) : [])) R.traits[t] = (R.traits[t]||0)+1;
      }
      res[want] = R;
    }

    if(threw) bad.push(`the policies threw ${threw} times, so the arms are not doing what they say — ${firstThrow}`);

    for(const [want, R] of Object.entries(res)){
      const med = R.quitWeeks.slice().sort((a,b)=>a-b);
      lines.push(`going after "${want}": named ${R.named}/${R.weeks} weeks · `
        + `held ${A.REP_ORDER.map(k=>`${k} ${R.held[k]}`).join("/")} · `
        + `got it in ${R.gotWanted}/${R.houses} houses · cloths ${R.cloths} · `
        + `surgeon hired ${R.medHired}, walked out of ${R.medQuit}`
        + (med.length ? ` (median week ${med[Math.floor(med.length/2)]})` : "")
        + ` · traits ${Object.keys(R.traits).length ? Object.entries(R.traits).map(([k,n])=>`${k} ${n}`).join(",") : "none"}`);
    }

    /* ---- 1. THE TOWN MUST SETTLE ON A NAME AT ALL ---- */
    for(const [want, R] of Object.entries(res)){
      if(!R.weeks) { bad.push(`the "${want}" arm never played a week`); continue; }
      const share = R.named / R.weeks;
      if(share < 0.5)
        bad.push(`going after "${want}", the town had a name for the house only `
          + `${Math.round(share*100)}% of ${R.weeks} weeks — measured, it settles 87% to 100% of the `
          + `time in every arm, and repStyle being null is what makes the traits and the medicus `
          + `clause inert`);
    }

    /* ---- 2. EACH OF THE FOUR NAMES MUST BE EARNABLE BY A HOUSE THAT GOES AFTER IT ----
       this is the assertion the whole item turned on: every "never seen" name in the first sweep
       was a lever the probe was not pulling, so the check pulls each one on purpose */
    for(const [want, R] of Object.entries(res)){
      if(R.gotWanted === 0)
        bad.push(`no house going after "${want}" was ever called it — ${R.houses} houses, `
          + `${R.weeks} weeks, and the town settled on `
          + `${A.REP_ORDER.filter(k=>R.held[k]).map(k=>`${k} ${R.held[k]}w`).join(", ") || "nothing"} `
          + `instead. One of the four names Capua can give a house has become ungettable`);
      /* AND IT MUST BE THE NAME IT MOSTLY HOLDS, not one it touched once. "Ever reached" is too
         weak to be worth asserting: with the cloth's eight points removed, the mercy arm still
         reached the name in 6 of 6 houses on the three points a spared man pays plus the
         doctrine's eighteen — but it held it 184 weeks of 426 against craft's 181, a coin-flip
         rather than a name. With every award in place all four arms hold their own name for
         91% to 100% of their named weeks, so 60% is clear of both. */
      const share = R.named ? R.held[want] / R.named : 0;
      if(R.named >= 60 && share < 0.6)
        bad.push(`a house going after "${want}" held that name only ${R.held[want]} of its `
          + `${R.named} named weeks (${Math.round(share*100)}%, measured 91-100%) — the town keeps `
          + `calling it ${A.REP_ORDER.filter(k=>k!==want && R.held[k]).sort((a,b)=>R.held[b]-R.held[a])[0]} `
          + `instead, so whatever feeds "${want}" has stopped being enough to earn it`);
    }

    /* ---- 3. AND THE MERCY ARM MUST ACTUALLY BE SPARING PEOPLE ----
       a mercy arm that throws no cloths is measuring caution, not mercy, and would pass the bar
       above for the wrong reason if the doctrine alone carried it */
    if(res.mercy && res.mercy.cloths === 0)
      bad.push(`the mercy arm threw 0 cloths in ${res.mercy.weeks} weeks — it is not sparing anybody, `
        + `so whatever it is measuring is not the act the charter's tenth step teaches`);

    /* ---- 4. #112: THE BUTCHER LOSES HIS SURGEON AND THE SHOWMAN DOES NOT ----
       `quitOn` is `d.unrest > 72 || repStyle(d) === "blood"`, and the pair of arms brackets it:
       both play hard, only one is called butchers */
    {
      const b = res.blood, s = res.show;
      if(b && b.medHired && b.medQuit === 0)
        bad.push(`the butcher kept his surgeon in all ${b.medHired} houses — measured, he walks out `
          + `of 9 in 10 at median week 12, and repStyle(d)==="blood" is half of STAFF.medicus.quitOn`);
      if(b && s && b.medHired && s.medHired && b.medQuit <= s.medQuit)
        bad.push(`the butcher lost his surgeon ${b.medQuit} times and the showman ${s.medQuit} — `
          + `the butcher must lose him MORE, or the blood clause in quitOn is doing nothing`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
