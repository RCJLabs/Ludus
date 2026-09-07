/* WHAT A HOUSE FORGETS IN A WEEK — #246 phase 5b, the instrument before the constant.

   (`fade` was free in both directories; checked before writing, because v3.210.0 overwrote two
   files that were not.)

   Two releases have now measured the grudge and changed nothing in it, and between them they left
   one number that IS worth acting on. `servo.mjs` (v3.222.0) found the whole hostile surface to be
   an elastic function of the grudge's mean, because the four gates sit far out on its tail:

     the `seek` arm's intake  0.892 -> 1.015 a house-week   (+14%)
     mass above SABOTAGE 26    4.28% -> 8.09%
     mass above POACH 35       2.09% -> 4.54%
     mass above THUGS 44       1.09% -> 2.89%
     a hostile act every       37 wk -> 23 wk

   And `facing.mjs` (v3.223.0) established that the intake cannot be bought from the bill: the
   ceiling on rival bouts is supply (~23%), the reference player already takes the rival's card when
   it pays most, and pricing the grudge onto the offer flips 2% of the rest. Fourteen per cent of
   the intake is what the ENTIRE bill is worth.

   So the lever is the outflow, where `rivalWeekly` runs ONE line —

     h.grudge = clamp(h.grudge - 1*L.grudgeDecay, 0, 100);

   — unconditionally, every week, for ever, at 0.972 a house-week pooled. That is **74% of all the
   grudge's outflow** (the other 0.348 is the settlements, the peace bought, the arcs). A blood feud
   fades at exactly the rate of a slight, and a grudge from last week's bout fades at the rate of
   one from two years ago. That is the thing #246 was always about.

   FOUR CANDIDATE RULES, AND THE POINT IS THAT THREE OF THEM ARE EXPECTED TO FAIL. Each is run as a
   credit-back arm — the modelled decay is computed exactly and a share `hold` of it is returned
   after the week — so the shapes can be compared before any of them is written into the game:

     feud     hold rises with the grudge above `GRUDGE_SABOTAGE`, to 0.55 at 100.
              The obvious reading of "a feud does not fade like a slight" — and it is expected to be
              nearly inert, because it can only act on the 4.3% of house-weeks already above the
              gate. It is here to be shown inert, since that is the same trap the grudge premium
              fell into in v3.223.0 and naming it once is cheaper than falling in twice.
     flat13   hold 0.13 everywhere: the blunt equivalent, sized to return the +0.123 a house-week
              the `seek` arm produced. No story, and it is the control for whether ANY shape that
              moves the body by that much lands on the target.
     fresh8   hold 0.65 for 8 weeks after a meeting, 0 otherwise. The rule with the story: a house
              you have just fought has not stopped thinking about it. It acts on the BODY of the
              distribution rather than its tail, which is the whole difference, and it is
              self-limiting — it holds only while you keep meeting them.
     fresh16  the same at sixteen weeks, to see the window's own slope.

   THE TARGET AND THE FALSIFIER ARE BOTH `servo.mjs`'s TABLE. Success is landing near the `seek`
   column; a rule that leaves the gates where they are is a null, and one that takes mass above 26
   past about 15% or the interval under about 15 weeks has overshot into a permanent siege, which is
   not what the item asked for and is worse than doing nothing.

   THE ARMS ARE APPROXIMATE IN THE SAME WAY `servo.mjs`'s WERE — the credit lands after the week, so
   the gates inside that week saw the uncredited grudge, and the worlds diverge properly over 400
   weeks rather than staying paired. A difference smaller than a week's decay is not a result.

     node test/probes/fade.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 96), W = +(process.argv[3] || 420), SEED = process.argv[4] || "FADE";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const NEED = ["newGameState","lanistaOf","GRUDGE_SABOTAGE","GRUDGE_POACH","GRUDGE_BRIBE","GRUDGE_THUGS"];
  const miss = NEED.filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const HOSTILE = ["poached","sabotage","thugs","bribedEditor","stolenSteel","courted","defected","whispers"];
  const GATES = { sabotage:A.GRUDGE_SABOTAGE, poach:A.GRUDGE_POACH, bribe:A.GRUDGE_BRIBE, thugs:A.GRUDGE_THUGS };
  const clamp = (v,a,b) => v<a?a:v>b?b:v;
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
    return { p50:at(.5), p75:at(.75), p90:at(.9), p99:at(.99), max:s[s.length-1] }; };
  const pc = (v, n) => n ? Math.round(1000*v/n)/10 : 0;
  const per = (v, n) => n ? Math.round(1000*v/n)/1000 : 0;

  /* the four rules, as `hold(grudge, weeksSinceMet)` -> the share of this week's decay held back */
  const RULES = {
    ship:    () => 0,
    feud:    g => 0.55 * clamp((g - GATES.sabotage) / (100 - GATES.sabotage), 0, 1),
    flat13:  () => 0.13,
    fresh8:  (g, since) => (since != null && since < 8)  ? 0.65 : 0,
    fresh16: (g, since) => (since != null && since < 16) ? 0.65 : 0,
  };

  const arm = (label) => {
    const hold = RULES[label];
    const t = { weeks:0, houseWeeks:0, grudges:[], over:{}, top:0, acts:0, kinds:{},
      decay:0, decayWeeks:0, held:0, up:0, downOther:0, zero:0, hardZero:0, freshWeeks:0, met:0 };
    for(const g of Object.values(GATES)) t.over[g] = 0;
    for(let hh=0; hh<H; hh++){
      const d = A.newGameState("Fd"+hh, "clean", `${SEED}-${hh}`);
      const prev = {}, pmet = {}, lastMet = {};
      for(let w=0; w<W; w++){
        if(d.over) break;
        const riv = (d.rivals||[]).filter(x=>!x.retired);
        for(const h of riv){ prev[h.name] = h.grudge || 0;
          pmet[h.name] = ((d.metHouse||{})[h.name]||{}).met || 0; }
        const wk = d.week;
        t.weeks++;
        try { R.lanista(d); } catch(e){ break; }
        const ev = d.pendingEvent && d.pendingEvent.id;
        if(ev && HOSTILE.includes(ev)){ t.acts++; t.kinds[ev] = (t.kinds[ev]||0)+1; }

        for(const h of (d.rivals||[])){
          if(h.retired || prev[h.name] == null) continue;
          const g0 = prev[h.name], g = h.grudge || 0;
          /* freshness is read from BEFORE this week — the decay this week is slowed by a meeting
             that had already happened, not by the one that is about to */
          const since = lastMet[h.name] == null ? null : wk - lastMet[h.name];
          /* the modelled decay must be the game's own, or the ledger below reports a residual that
             is really the shipped rule. From v3.224.0 `fadeRate` IS the weekly forgetting and the
             arms here read as increments ON TOP of it — the table in this file's header was taken
             before that build, on a game whose decay was flat, and is kept as the record of the
             decision rather than re-run into agreement with its own outcome. */
          const rate = A.fadeRate ? A.fadeRate(d, h) : 1 * (A.lanistaOf(h.name).grudgeDecay || 1);
          const dec = g0 > 0 ? Math.min(g0, rate) : 0;
          const modelled = g0 - dec;
          if(modelled > 0 && modelled < 100 && g0 < 100){
            t.decayWeeks++; t.decay += dec;
            const resid = g - modelled;
            if(resid > 0.001) t.up += resid; else if(resid < -0.001) t.downOther += -resid;
          }
          /* ---- "AT ZERO" HAD TO STOP MEANING `=== 0`, AND THE SMOKE RUN IS WHY ----
             Every rule here holds back a SHARE of the decay, so under any of them the grudge decays
             geometrically and never lands on exactly nought again. `flat13` read 1.2% at zero
             against the control's 67.2% on its first run — not an effect, an artefact of the test:
             the houses were sitting at 0.0001 and being counted as hot. The quantity that matters
             is what a reader would call zero, so the reported figure rounds; `hardZero` is kept
             beside it so the artefact stays visible instead of being tidied away. */
          if(g0 < 0.5) t.zero++;
          if(g0 === 0) t.hardZero++;
          if(since != null && since < 16) t.freshWeeks++;
          /* THE ARM: hand back the share of this week's forgetting the rule says was not forgotten */
          const back = dec * hold(g0, since);
          if(back > 0){ const was = h.grudge || 0;
            h.grudge = clamp(was + back, 0, 100); t.held += h.grudge - was; }
          const dMet = (((d.metHouse||{})[h.name]||{}).met || 0) - (pmet[h.name] || 0);
          if(dMet > 0){ lastMet[h.name] = d.week; t.met += dMet; }
          t.houseWeeks++; t.grudges.push(Math.round(h.grudge||0));
          if((h.grudge||0) > t.top) t.top = h.grudge||0;
          for(const gate of Object.keys(t.over)) if((h.grudge||0) >= +gate) t.over[gate]++;
        }
      }
    }
    return { label, weeks:t.weeks, houseWeeks:t.houseWeeks, top:Math.round(t.top),
      grudge:q(t.grudges),
      over: Object.fromEntries(Object.entries(t.over).map(([g,n])=>[g, pc(n, t.houseWeeks)])),
      atZero: pc(t.zero, t.houseWeeks), hardZero: pc(t.hardZero, t.houseWeeks),
      freshPc: pc(t.freshWeeks, t.houseWeeks), metPerHouseWeek: per(t.met, t.houseWeeks),
      decayPerWeek: per(t.decay, t.decayWeeks),
      heldPerHouseWeek: per(t.held, t.houseWeeks),
      inPerWeek: per(t.up, t.decayWeeks), otherOutPerWeek: per(t.downOther, t.decayWeeks),
      acts:t.acts, actsPer100Weeks: pc(t.acts, t.weeks),
      everyN: t.acts ? Math.round(t.weeks/t.acts) : null, kinds:t.kinds };
  };

  return { gates:GATES, arms: Object.keys(RULES).map(arm),
    /* the target and the control, copied from `servo.mjs` so the reader does not have to hold two
       files in their head — and so a run that drifts from them is visible */
    target: { source:"servo.mjs seek arm, v3.222.0",
      atZero:56.9, over26:8.09, over35:4.54, over44:2.89, everyN:23 },
    control:{ source:"servo.mjs ship arm, v3.222.0",
      atZero:64.9, over26:4.28, over35:2.09, over44:1.09, everyN:37 } };
}, [H,W,SEED]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
const ship = out.arms.find(a=>a.label === "ship");
/* FAULT SIX: `fresh` is nothing without meetings, and a run where the rope never met a house would
   report three identical arms as though the rules had been compared. */
if(ship && !ship.metPerHouseWeek)
  console.log("!! no house was met in the control — the `fresh` arms are copies of `ship` and nothing below is a comparison");
if(ship && ship.freshPc === 0)
  console.log("!! the freshness window never opened — `fresh8`/`fresh16` cannot have moved");
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
