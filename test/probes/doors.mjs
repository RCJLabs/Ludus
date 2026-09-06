/* THE ANSWER SET — #246 phase 4, the instrument.

   (`doors` is free in both directories; checked before writing, because v3.210.0 overwrote two
   files that were not.)

   The item's last phase: *"your answer set — `poached`'s three doors, `answerNem`-shaped calling
   out, and the `ear`/`WHISPERS` telling you first."* Three claims, and phase 1 has already taught
   this queue not to take any of them on trust — its headline was a swallowed TypeError, and phase 2
   found the item's remedy did nothing while a house that had gone dark made 8.6% of all rival moves.

   All three of the things phase 4 asks for EXIST. `poached` carries its three doors and each one
   does real work; `answerNem` is a paid, cooldown-gated strike that costs `160 + fame/2`; and
   `WHISPERS` already carries a `deep` line for `d.poach`. So the question is not whether they are
   written. It is whether any of them ever REACHES the player, and this reads that:

     1 · DOES THE CARD ARRIVE BEFORE THE MAN DOES? `startPoach` sets `d.poach.weeks = 3` and
         `poachWeek` counts it down to `defect`. The card has to win the week's event draw inside
         that window — it is one of ~36 in the pool, drawn at 45% a week, at `EV_DIE` weight 4. So:
         poaches started, poaches the player was actually SHOWN, and poaches that took a man with
         no card ever offered. A poach the player never sees is a defection with no answer, which is
         the whole of what "your answer set" means.

     2 · AND IS THE FIRST DOOR OPEN WHEN IT DOES? Door 0 costs `gladValue(g)*0.6` and refuses if the
         box is short — `"You cannot find the coin, and he can count."` A door that is shut when it
         arrives is not an answer. The price and the box are recorded at the moment the card is made.

     3 · AND CAN YOU EVER GO AT THEM FIRST? Read carefully, because the first draft of this arm
         overstated it. Every hostile card already carries an answering door — the thugs are answered
         in kind, the editor is outbid, the watchmen are posted — so an act is never unanswerable.
         What you cannot do is INITIATE: `answerNem` and `nemCallOut` are the only ways to move
         against a house first, and both read `d.nemHouse` alone. So this counts how often the house
         that just acted is the one house you are allowed to go at, which is a different and smaller
         claim than "no recourse".

     4 · AND DOES ANYTHING TELL YOU FIRST? The `d.poach` whisper is `deep`, so it needs an ear that
         is a MAN inside the cells, not the gate; and `listenWeek` draws only 3-4 of the eligible
         pool. Measured: weeks with an ear at all, weeks with a deep ear, and — of the poach weeks —
         the share where the whisper actually got drawn and said.

     node test/probes/doors.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420), SEED = process.argv[4] || "DOORS";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const NEED = ["newGameState","EVENTS","evTune","gladValue","activeG","lanistaOf",
                "nemAnswerCost","answerNem","WHISPERS","earOn","earInside","setEarTo"];
  const miss = NEED.filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), max:s[s.length-1] }; };
  const CHARGED = ["poached","sabotage","thugs","bribedEditor"];

  const t = { weeks:0,
    /* 1 */ started:0, shown:0, tookAMan:0, tookUnseen:0, tookShown:0, shownAndKept:0, poachWeeks:0, windows:[],
    /* 2 */ doorPrices:[], doorAfford:0, doorShut:0,
    /* 3 */ acts:0, byNemesis:0, byAnswerable:0, noRecourse:0, nemWeeks:0, actKinds:{},
    /* 4 */ earWeeks:0, deepWeeks:0, poachHeardable:0, poachHeard:0 };

  for(let hh=0; hh<H; hh++){
    const d = A.newGameState("Dr"+hh, "clean", `${SEED}-${hh}`);
    /* ---- AND HALF OF THEM LISTENING, BECAUSE THE ROPE NEVER HIRES AN EAR ----
       First run: `anyEarPc` 0.0 over 5,492 weeks. That is `dark.mjs`'s rule — a system the rope
       never reaches reads as dark, and the zero is a fact about the POLICY, not about the game.
       So half the houses put a man inside the cells on week one and keep him there, which is the
       deepest ear the game sells, and the whisper is measured on those. */
    const listening = (hh % 2) === 1;
    let live = null;                       /* the poach we are watching, and whether it was shown */
    for(let w=0; w<W; w++){
      if(d.over) break;
      t.weeks++;
      if(listening && !A.earInside(d)){
        const m = A.activeG(d)[0];
        if(m) A.setEarTo(d, "man", m.id);
      }
      if(A.earOn(d)) t.earWeeks++;
      if(A.earInside(d)) t.deepWeeks++;
      if(d.nemHouse) t.nemWeeks++;
      const beforeDefected = (d.defected||[]).length;
      const hadPoach = d.poach ? { gid:d.poach.gid, house:d.poach.house } : null;

      try { R.lanista(d); } catch(e){ break; }

      /* 1 · the poach's own life, watched from outside */
      if(d.poach && !live){ t.started++; live = { gid:d.poach.gid, shown:false, weeks:0 }; }
      if(d.poach && live) live.weeks++;
      if(d.poach) t.poachWeeks++;

      /* 4 · the whisper, which is drawn into d.heard by listenWeek */
      if(d.poach && A.earInside(d)){ t.poachHeardable++;
        if((d.heard||[]).some(x=>/at the wall after dark/i.test(x))) t.poachHeard++; }

      const ev = d.pendingEvent;
      if(ev && CHARGED.includes(ev.id)){
        t.acts++; t.actKinds[ev.id] = (t.actKinds[ev.id]||0)+1;
        const who = ev.data && ev.data.house;
        const nem = d.nemHouse && d.nemHouse.house;
        if(who){ if(who === nem) t.byNemesis++; else t.noRecourse++; }
        if(ev.id === "poached"){
          if(live) live.shown = true;
          t.shown++;
          /* 2 · was the first door open at the moment it was offered? */
          const price = ev.data && ev.data.price;
          if(price != null){ t.doorPrices.push(price);
            if(d.gold >= price) t.doorAfford++; else t.doorShut++; }
        }
      }
      /* the poach ended: taken, or answered, or lapsed */
      if(!d.poach && live){
        const took = (d.defected||[]).length > beforeDefected;
        if(took){ t.tookAMan++; if(live.shown) t.tookShown++; else t.tookUnseen++; }
        else if(live.shown) t.shownAndKept++;
        t.windows.push(live.weeks);
        live = null;
      }
    }
  }
  const pc = (v,n) => n ? Math.round(1000*v/n)/10 : 0;
  return {
    weeks:t.weeks,
    poach: { started:t.started, shown:t.shown, shownPc:pc(t.shown, t.started),
      tookAMan:t.tookAMan, lostPc:pc(t.tookAMan, t.started),
      /* the three ways one ends, which is the whole finding: never offered · offered and the coin
         was not there when the week came · offered and the man stayed */
      neverOffered:t.tookUnseen, offeredAndStillLost:t.tookShown, offeredAndKept:t.shownAndKept,
      windowWeeks:q(t.windows), poachWeeks:t.poachWeeks },
    firstDoor: { offered:t.doorPrices.length, price:q(t.doorPrices),
      afford:t.doorAfford, affordPc:pc(t.doorAfford, t.doorPrices.length), shut:t.doorShut },
    initiative: { acts:t.acts, kinds:t.actKinds, weeksWithANemesis:pc(t.nemWeeks, t.weeks),
      byTheOneHouseYouCanGoAtFirst:t.byNemesis, byAHouseYouCanOnlyANSWER:t.noRecourse,
      canOnlyAnswerPc:pc(t.noRecourse, t.byNemesis + t.noRecourse) },
    ear: { anyEarPc:pc(t.earWeeks, t.weeks), deepEarPc:pc(t.deepWeeks, t.weeks),
      poachWeeksWithADeepEar:t.poachHeardable, andItWasSaid:t.poachHeard,
      saidPc:pc(t.poachHeard, t.poachHeardable) } };
}, [H,W,SEED]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
