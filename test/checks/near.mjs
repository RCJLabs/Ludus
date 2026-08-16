/* EVERY PROXIMITY LINE IS A CLAIM ABOUT THE STATE, AND TEN OF THEM HAD NEVER BEEN DRIVEN.

   This project has shipped two of these wrong already, and the notes on both say the same thing:
   the forge line told a house of six men in stock kit that the fee was the whole of it, and Rome's
   letter read "0 fame short" to a house with no senator warm enough to send it. Neither was found
   by reading. Both were found by driving the gate and comparing what the line CLAIMED to what the
   gate DECIDED.

   Ten more were unchecked. Driven, four were wrong and five were right, and the tenth turned out
   not to be a proximity line at all:

     feastReach     WRONG   `Math.round` of a fraction clamped 0.65-1, so the agenda read
                            "it would reach 1 of them" to a house of eight, every time
     paragonReach   WRONG   `short` was the gap against the box PLUS debts at face PLUS steel at
                            half, beside a sentence that says "You have N in the box" and a button
                            that reads the box alone — 12.8% of 187 played house-weeks past week 20
                            fell in the window where the line names nothing missing and the
                            purchase is refused
     munusWait      WRONG   `munusReady` also refuses a house standing on the imperial sand, and
                            the panel is not hidden there, so a house at Rome that had never held
                            games was told "0 weeks before you can put on games again"
     workOpen       WRONG   one sentence for two gates: the three tier-2 monuments are gated on the
                            five plain WORKS, and the line told you to finish your monuments
     blessLeft      right   blessOf and blessLeft share one guard, so the count cannot contradict
                            the panel that shows it
     creditLine     right   the quoted line IS the gate — both sides call creditLine — and it does
                            not drift over the week the player is about to end (median 0d of 60)
     riseNeed       right   0 disagreements between the three rows and the button over 60 states,
                            each with one requirement deliberately one short
     romeBar        right   0 letters arrived with the renown rung unmet over 40 houses across both
                            roads and both senator states
     featNear       right   19 of 19 near lines, 0 threw, 0 empty, 0 claimed a shortfall of zero

   AND THE TENTH: `acclaimTarget` is on the item's list and is not a proximity line. It is read by
   `acclaimWeek` and by nothing the player ever sees — a rate, not a claim about how close anything
   is. Reported rather than quietly dropped, because a list of ten that is really nine is worth
   knowing about the list.

   FOUR OF THE SIX VERDICTS THE FIRST DRAFT PRODUCED WERE THE PROBE'S, which is the ordinary rate
   here and is written down so the next one budgets for it: `makeParagon` RETURNS the man and does
   not put him on the block, so the paragon arm tested nothing and reported "agrees" on a sample of
   zero; the credit arm ran a whole week before reading the gate, and `endWeek` draws the ledger
   first, so all 60 came back wrong on gold that was already spent; the feat arm flagged any line
   starting with a zero and caught "0 of 20 won", which is a correct line on a house that has won
   none; and the frequency behind the paragon finding was first measured at 0% by a policy that
   never fought a bout — purses paid on credit are the only source of money owed to you. */

import { hasHandle } from "../harness.mjs";

export const name = "near";
export const describe = "what a proximity line claims is what the gate it describes decides";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];

    const fresh = (scen, seed) => A.newGameState("Nr", scen || "clean", seed || "NEAR", null);
    const stock = d => { d.gold = 400000; d.fame = 4000; d.favor = 90;
      while(A.activeG(d).length < 5 && !A.rosterFull(d)){
        const m=(d.market||[])[0]; if(!m) break; if(!A.buyFromBlock(d,m.id,null)) break; }
      return d; };

    /* ---- 1. THE FEAST'S REACH IS A FRACTION AND THE LINE MUST READ AS ONE ----
       the agenda's text is a string on the handle, so this one can be asserted on the words
       themselves rather than on the quantity behind them */
    {
      const seen = new Map();
      for(const men of [4, 6, 8]){
        const d = stock(fresh(null, "FEAST"+men));
        while(A.activeG(d).length < men && !A.rosterFull(d)){
          const m=A.genGladiator(d,60); m.id=d.nextId++; m.status="active"; d.gladiators.push(m); }
        while(A.activeG(d).length > men){ A.activeG(d)[0].status = "sold"; }
        d.unrest = 60; d.gold = 40000; d.lastFeast = -20; d.week = 30;
        const row = (A.agenda(d)||[]).find(x=>/would take a feast/i.test(x.label||""));
        if(!row){ bad.push(`the agenda would not raise the feast on a house of ${men} with the cells at 60 and coin in the box`); continue; }
        seen.set(A.activeG(d).length, row.sub);
      }
      const subs = [...seen.values()];
      lines.push(`the feast, on ${[...seen.keys()].join("/")} men: ${subs.map(s=>`"${s}"`).join(" · ")}`);
      if(subs.length > 1 && new Set(subs).size === 1)
        bad.push(`the feast line says the same thing at every house size — reach runs 0.65 to 1 and `
          + `the line quotes one number: "${subs[0]}"`);
      for(const [men, sub] of seen){
        /* the fault shape: a fraction put through Math.round, which is 1 for every legal house */
        if(/reach 1 of them/.test(sub) || /\breach [01] of\b/.test(sub))
          bad.push(`on ${men} men the feast line reads "${sub}" — feastReach is a fraction, and `
            + `rounding it to a count of men is 1 for every house that can exist`);
      }
    }

    /* ---- 2. THE PARAGON'S SHORTFALL MUST BE THE ONE THE BUTTON READS ----
       the sentence is "You have N in the box" and the button beside it compares the box to the
       price, so the shortfall in the same sentence has to be measured on the box too */
    {
      let tested = 0, wrong = 0, ex = null;
      for(let i=0;i<120;i++){
        const d = stock(fresh(null, "PARA"+i));
        d.week = 40 + i;
        const made = A.makeParagon(d);           // RETURNS the man; it does not put him on the block
        if(!made) continue;
        d.market = d.market || []; d.market.push(made);
        const g = A.paragonOf(d); if(!g) continue;
        /* wealth deliberately outside the box, which is where the two numbers came apart:
           a debt owed to the house, and steel on the racks */
        d.gold = Math.round(g.price * (0.15 + (i%8)*0.09));
        d.owed = [...(d.owed||[]), { id:d.nextId++, amount:Math.round(g.price*0.7), from:"Ovidius",
          kind:"games", due:d.week+2, paid:false }];
        const r = A.paragonReach(d, g);
        const canPay = d.gold >= g.price;
        tested++;
        if((r.short === 0) !== canPay){
          wrong++;
          if(!ex) ex = `price ${g.price}, ${Math.round(d.gold)} in the box, ${A.owedTotal(d)} owed to `
            + `the house — the line says ${r.short===0?"nothing is missing":r.short+" short"} and the `
            + `button says ${canPay?"pay it":"you cannot pay"}`;
        }
      }
      lines.push(`the paragon, ${tested} men priced against a house holding wealth outside the box: `
        + `${wrong} where the sentence and the button disagree`);
      if(wrong) bad.push(`the paragon line's shortfall is not the gap the button reads — ${ex}`);
      if(tested < 50) bad.push(`only ${tested} paragons were priced; makeParagon returns the man rather `
        + `than putting him on the block, and a probe that forgets that tests nothing`);
    }

    /* ---- 3. EVERY REASON THE MUNUS IS REFUSED MUST BE ONE THE PANEL CAN NAME ----
       the panel is guarded on travel and the coast only, so `munusReady` refusing for any OTHER
       reason lands in the cooldown sentence. Enumerate the reasons by toggling them. */
    {
      const reasons = [];
      const base = () => { const d = stock(fresh(null,"MUN")); d.week = 60; d.munusLast = null;
        d.travel = null; d.city = null; d.rome = null; return d; };
      const shownFor = d => d.fame >= A.MUNUS_SCALES.modest.gate && !d.travel && !d.city;
      /* the clean case must be ready */
      { const d = base(); if(!A.munusReady(d)) bad.push(`a house at home with games never held is refused the munus`); }
      /* the cooldown, which the sentence is about */
      { const d = base(); d.munusLast = d.week - 1;
        reasons.push({ why:"the cooldown", shown:shownFor(d), ready:A.munusReady(d), wait:A.munusWait(d) }); }
      /* on the road, and touring the coast — the panel hides for both */
      { const d = base(); d.travel = { to:"pompeii", weeks:2 };
        reasons.push({ why:"on the road", shown:shownFor(d), ready:A.munusReady(d), wait:A.munusWait(d) }); }
      { const d = base(); d.city = "pompeii";
        reasons.push({ why:"touring the coast", shown:shownFor(d), ready:A.munusReady(d), wait:A.munusWait(d) }); }
      /* AND AT ROME, driven for real: the letter, the acceptance, the wagons */
      { const d = base(); d.flags.primusHeld = 1; d.fame = 40000; d.favor = 100;
        (d.patrons||[]).forEach(x=>{ if(x.rank==="senator") x.favor = 95; });
        A.offerRome(d);
        if(d.romeOffer) A.answerRomeWith(d, true);
        for(let w=0; w<4 && d.rome && d.rome.travel>0; w++) A.endWeek(d);
        reasons.push({ why:"standing on the imperial sand", shown:shownFor(d), ready:A.munusReady(d),
          wait:A.munusWait(d), reached:!!(d.rome && d.rome.travel<=0) }); }

      for(const r of reasons)
        lines.push(`  the munus, ${r.why}: panel ${r.shown?"shown":"hidden"}, ready=${r.ready}, `
          + `wait=${r.wait}${r.reached===false?" (NOT REACHED)":""}`);
      const rome = reasons[reasons.length-1];
      if(!rome.reached)
        bad.push(`the house could not be driven to Rome, so the reason the munus panel was wrong `
          + `about cannot be tested — the letter or the road has changed`);
      /* ---- THE INVARIANT THE WORDING RESTS ON ----
         The panel now has a branch for each reason: the cooldown when there is one, and "you are
         not in Capua to give Capua anything" when there is not. That is only complete while the
         reasons are exactly these four. So assert the decomposition: munusReady must be nothing
         more than the cooldown, the road, the coast and the imperial sand. A fifth condition added
         to munusReady without a branch on the panel lands in the wrong sentence again, and this is
         what fails when it does.

         The first version of this asserted "the panel is never shown with a wait of 0", which the
         fix does not make true and should not — the panel IS shown at Rome, it just has to say the
         right thing there. */
      let split = 0, splitEx = null;
      const cases = [];
      /* THE WHOLE CROSS-PRODUCT, NOT A HANDFUL. The first version of this listed seven states and
         every one of them had a quiet yard, so a condition injected on unrest to prove the check
         could fail slipped straight through 7 of 7. A decomposition is only pinned over a space
         wide enough for a new term to bite, so vary everything a new term might plausibly read. */
      for(const away of [null, "road", "coast", "north", "sand"])
      for(const last of [null, -1, -A.MUNUS_COOL, -99])
      for(const unrest of [5, 45, 85])
      for(const gold of [40, 4000, 200000]){
        const d = base();
        d.unrest = unrest; d.gold = gold;
        if(last !== null) d.munusLast = d.week + last;
        if(away === "road") d.travel = { to:"pompeii", weeks:2 };
        if(away === "coast") d.city = "pompeii";
        if(away === "north") d.rome = { travel:2, fought:0, won:0 };
        if(away === "sand") d.rome = { travel:0, fought:1, won:1 };
        cases.push([`${away||"at home"} · last ${last} · unrest ${unrest} · ${gold}d`, d]);
      }
      /* and a yard that cannot field anybody, in case readiness ever starts reading the men */
      { const d = base(); d.gladiators.forEach(g=>{ g.status="injured"; g.injury={ weeks:4, kind:"deep" }; });
        cases.push(["nobody fit", d]); }
      for(const [why, d] of cases){
        const named = A.munusWait(d) === 0 && !d.travel && !d.city && !(d.rome && d.rome.travel <= 0);
        if(A.munusReady(d) !== named){
          split++;
          if(!splitEx) splitEx = `${why}: munusReady=${A.munusReady(d)} but the four reasons the panel `
            + `can name give ${named}`;
        }
      }
      lines.push(`  the munus refuses for exactly four reasons the panel has words for: `
        + `${cases.length - split} of ${cases.length} states agree`);
      if(split) bad.push(`munusReady refuses for a reason the panel has no branch for, so it falls `
        + `through to the cooldown sentence — ${splitEx}`);
    }

    /* ---- 4. THE MONUMENTS' CLOSED LINE NAMES ONE OF TWO DIFFERENT GATES ----
       tier 2 wants the five plain works finished; only tier 3 wants the monuments. The wording
       follows this shape, so pin the shape. */
    {
      const t2 = A.ALL_WORK_KEYS.filter(k=>{ const W=A.workDef(k); return W && W.tier===2; });
      const t3 = A.ALL_WORK_KEYS.filter(k=>{ const W=A.workDef(k); return W && W.tier===3; });
      const plain = A.ALL_WORK_KEYS.filter(k=>{ const W=A.workDef(k); return W && !W.tier; });
      const d = stock(fresh(null,"WORK")); d.week = 300; d.works = {};
      const closedCold = t2.filter(k=>!A.workOpen(d,k)).length;
      for(const k of plain) d.works[k] = { done:true, left:0 };
      const openAfterWorks = t2.filter(k=>A.workOpen(d,k)).length;
      const t3AfterWorks = t3.filter(k=>A.workOpen(d,k)).length;
      for(const k of t2) d.works[k] = { done:true, left:0 };
      const t3AfterAll = t3.filter(k=>A.workOpen(d,k)).length;
      lines.push(`the works: ${t2.length} tier-2 monuments closed cold ${closedCold}/${t2.length}, `
        + `open once the ${plain.length} plain works are done ${openAfterWorks}/${t2.length}; `
        + `tier 3 open on the works alone ${t3AfterWorks}/${t3.length}, once the monuments are up ${t3AfterAll}/${t3.length}`);
      if(closedCold !== t2.length || openAfterWorks !== t2.length)
        bad.push(`the tier-2 monuments are no longer gated on exactly the plain works — the closed `
          + `line says "has not finished the works in its own yard first" and it must keep saying `
          + `the thing that is actually in the way`);
      if(t3.length && (t3AfterWorks !== 0 || t3AfterAll !== t3.length))
        bad.push(`tier 3 is no longer gated on the monuments — its closed line names them`);
    }

    /* ---- 4b. THE SINK'S ONE HINT OPENS WHEN THE DOOR DOES — #138 ----
       Stone is commissioned at its 25% deposit and paid as it rises; the villa button gates on
       the deposit. The agenda's "sitting in the box" line still asked for the FULL price, so the
       one hint pointing at the sink fired on 12-15% of the weeks the door was open (57-62%),
       measured over three seeds x 24 houses. The line's gate must be beginWork's own. */
    {
      const dep = k => Math.ceil(A.workDef(k).cost * A.WORK_DEPOSIT);
      const cheap = A.WORK_KEYS.slice().sort((a,b)=>dep(a)-dep(b))[0];
      const says = d => JSON.stringify(A.agenda(d)||[]).includes("sitting in the box");
      const d = fresh(null, "SINKNAG"); d.week = 300; d.works = {};
      d.gold = dep(cheap) + 25;                      /* the deposit and small change — not the price */
      const atDeposit = says(d);
      d.gold = Math.min(...A.WORK_KEYS.map(dep)) - 50;   /* under every deposit */
      const underDeposit = says(d);
      lines.push(`the sink's hint: fires holding ${dep(cheap)+25}d (the ${cheap}'s deposit) ${atDeposit ? "yes" : "NO"}, `
        + `silent under every deposit ${underDeposit ? "NO" : "yes"}`);
      if(!atDeposit) bad.push(`a house holding the ${cheap}'s deposit is not told there is anything to build — `
        + `the line's gate asks for more than beginWork's does`);
      if(underDeposit) bad.push(`the sink's hint fires on a house that cannot commission anything`);
    }

    /* ---- 5. THE FIVE THAT WERE RIGHT, kept so they stay right ---- */
    {
      /* blessLeft against the panel that shows it */
      let b = 0;
      for(let w=0; w<40; w++){ const d = fresh(null,"BL"); d.week = 50;
        d.blessing = { god:"victoria", until: 50 + w };
        if(!!A.blessOf(d) !== (A.blessLeft(d) > 0)) b++; }
      if(b) bad.push(`${b} of 40 blessings where the panel would show a blessing whose count says it is over`);

      /* creditLine must not move under the player over the week they are about to end */
      const drift = [];
      for(let i=0;i<30;i++){
        const d = stock(fresh(null,"CR"+i)); d.week = 40 + i*3;
        if(i%2) d.loan = { amount:2000, due:d.week+20, rate:0.1 };
        const q = Math.round(-A.creditLine(d));
        const c = A.clone(d); c.gold = 0; A.endWeek(c);
        drift.push(Math.abs(Math.round(-A.creditLine(c)) - q));
      }
      drift.sort((x,y)=>x-y);
      lines.push(`the creditors' line: median drift ${drift[15]}d over the week it is quoted in, worst ${drift[29]}d`);
      if(drift[29] > 400) bad.push(`the creditors' line moved ${drift[29]}d in one week — the figure quoted `
        + `is not the figure the gate will read`);

      /* riseNeed's rows against its button */
      let rw = 0, rn = 0;
      for(let rank=0; rank<5; rank++) for(let i=0;i<10;i++){
        const d = stock(fresh(null,"RS"+rank+i));
        d.rise = { rank, standing: i%2 ? 100 : 40 };
        const nx = A.riseNext(d); if(!nx) continue;
        d.fame  = i%3===0 ? (nx.fame||0) - 1 : (nx.fame||0) + 5;
        d.favor = i%3===1 ? (nx.favor||0) - 1 : (nx.favor||0) + 5;
        d.gold  = i%3===2 ? (nx.cost||0) - 1 : (nx.cost||0) + 5;
        const need = A.riseNeed(d); rn++;
        const rows = need.fameOk && need.favorOk && need.goldOk && need.full;
        if(!!A.canClaimRise(d) !== !!rows) rw++;
        if(need.fameOk !== (d.fame >= (nx.fame||0))) rw++;
        if(need.goldOk !== (d.gold >= (nx.cost||0))) rw++;
      }
      lines.push(`the census: ${rn} states over five rungs, ${rw} rows that disagree with the button`);
      if(rw) bad.push(`${rw} of the census rows tick against a number they do not name`);

      /* romeBar: the letter must never come with the renown rung unmet */
      let mw = 0, mn = 0;
      for(let i=0;i<30;i++){
        const d = stock(fresh(null,"RM"+i)); d.week = 100 + i;
        d.flags.primusHeld = i%2; d.rise = { rank: i%3===0 ? 4 : 1, standing:0 };
        (d.patrons||[]).forEach(x=>{ if(x.rank==="senator") x.favor = i%4===0 ? 90 : 30; });
        const bar = A.romeBar(d);
        d.fame = i%5===0 ? bar - 1 : bar + 10;
        mn++;
        if(A.romeReady(d) && d.fame < bar) mw++;
      }
      lines.push(`the road to Rome: ${mn} houses, ${mw} letters that came with the renown rung short`);
      if(mw) bad.push(`${mw} letters arrived while the sheet said the house was short of the bar`);

      /* featNear: nineteen lines, none of them claiming a shortfall of nothing */
      const fb = [], states = [
        ()=>fresh(null,"F0"), ()=>stock(fresh(null,"F1")),
        ()=>{ const d=stock(fresh(null,"F2")); d.week=400; d.fame=30000; d.favor=100;
              d.rise={rank:4,standing:100}; d.flags.primusHeld=3; d.flags.quietRun=200; return d; },
      ];
      let nEmpty = 0, nThrew = 0, nLines = 0;
      for(const k of A.FEAT_KEYS) for(let si=0; si<states.length; si++){
        let d; try { d = states[si](); } catch(e){ continue; }
        if(A.hasFeat(d,k)) continue;
        let s; try { s = A.featNear(d,k); } catch(e){ nThrew++; continue; }
        if(s === null) continue;
        nLines++;
        if(typeof s !== "string" || !s.trim()){ nEmpty++; continue; }
        /* the shape shipped wrong twice: nothing missing from a thing you have not got */
        if(/\b0 (fame|renown|more|denarii|weeks?|men|wins?)\s+(short|to go|left|away|behind|more)\b/i.test(s)
           || /\b(\d+) of \1\b/.test(s))
          fb.push(`${k} reads "${s.slice(0,54)}"`);
      }
      lines.push(`the feats: ${nLines} near lines driven over 3 states, ${nThrew} threw, ${nEmpty} empty, `
        + `${fb.length} claiming a shortfall of nothing`);
      if(nThrew) bad.push(`${nThrew} feat near lines threw — the sheet is not allowed to be the thing that takes the screen down`);
      if(nEmpty) bad.push(`${nEmpty} feat near lines came back empty`);
      if(fb.length) bad.push(`a feat's near line says nothing is missing from a feat that is not earned — ${fb[0]}`);
    }

    /* ---- 6. AND THE ONE THAT IS NOT A LINE ---- */
    {
      const d = stock(fresh(null,"AC")); d.week = 200;
      lines.push(`acclaimTarget reads ${A.acclaimTarget(d).toFixed(1)} against acclaim `
        + `${A.acclaimOf(d).toFixed(1)} — a rate read by acclaimWeek, shown to nobody, and not a `
        + `proximity line at all`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0, 4).join("; ") || null, lines: out.lines };
}
