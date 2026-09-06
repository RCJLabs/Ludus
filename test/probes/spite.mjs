/* WHAT THE GRUDGE WOULD BUY — #246 phase 2, the instrument.

   (`spite` is free in both directories; checked before writing, because v3.210.0 overwrote two
   files that were not.)

   Phase 1 settled what the poach gate's two terms are worth: a takeable man exists on two weeks in
   three, and the SCARCE term is the grudge — a rival stands at `GRUDGE_POACH` on 3-5% of weeks.
   Phase 2 is the move the item actually asks for: *"hostile moves in RIVAL_MOVES itself — poach,
   bribeEditor, sabotage, thugs as moves with `weight: h => grudge x lanistaOf().poach/bribe/sabotage`,
   so the multipliers finally drive something."*

   Before writing a weight, three things have to be known, and none of them is in the queue:

     1 · THE GRUDGE AS A QUANTITY, not a gate. Phase 1 counted weeks over a line. A weight reads the
         NUMBER, so this is its distribution: percentiles over house-weeks, the share above each of
         the four thresholds, the highest any house reaches, and how long a hot spell lasts. A
         quantity that is 0 for nine weeks in ten and 40 for the tenth wants a different weight from
         one that drifts around 20.

     2 · WHAT THE BAY'S TURN ALREADY IS. `rivalTurn` fires on 30% of weeks, picks ONE house, and
         draws from a bag built by `Math.round(weight(h)*10)` entries per eligible move. So the
         question a new move faces is not "how likely am I" but "how much of one house's bag am I,
         on the weeks that house is picked". This reads the bag itself — no draws, so it disturbs
         no seeded fixture — and reports what each of the nine moves is worth today.

     3 · WHAT THE MULTIPLIERS DRIVE TODAY, which the item says is the event odds. It is not.
         `evWeight(d,k)` is `EV_DIE[k].w` times a freshness bonus and reads no lanista at all;
         `sabotage.make` sorts the bay by `grudge x L.sabotage` only to choose WHOSE COLOURS the
         cook saw. The multipliers pick the accused, not the odds. Measured here rather than
         asserted, because that sentence is the reason the item exists.

   And then the shadow ledger, which is the point of the whole file:

     4 · WHAT THE WEIGHT PRODUCES. Written before the moves existed, to size them; kept afterwards,
         because it is the only place the choice is legible. The bag is read twice — once as it
         ships (`grudge/GATE x L.mult x die/4`, which is what `RIVAL_MOVES` now carries) and once
         under the item's literal `grudge x L.mult`, rebuilt on the same bag. No draw is taken and
         nothing is mutated. Measured before any of it was written: the literal weight turns a hot
         house's bag **88.7% hostile** — a house that hates you doing nothing else, which is the
         item's own stated risk — against the normalised **31.1%**.

     5 · AND THE GRUDGE'S OWN LEDGER, which is what decided the phase. A weight multiplies the
         grudge, so what feeds the grudge matters more than any weight: week over week per house,
         what went in, what the decay took, and what else took it. `grudgeDecay` is 1 x the
         lanista's rate whenever the grudge is above zero, so it is known exactly and the rest is
         the residual — counted only where the modelled decay lands strictly inside [0,100], since
         a clamp at either end reads as a flow (v3.209.0's fault, in the unrest residual).

     6 · AND WHOSE IT WAS. Hostile cards carry the house they are charged to, counted per week that
         house actually held a grudge — the only way to see a multiplier rather than a seating plan.

     node test/probes/spite.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SEED = process.argv[4] || "SPITE";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const NEED = ["newGameState","activeG","poachTarget","lanistaOf","LANISTAE","RIVAL_MOVES",
                "GRUDGE_POACH","GRUDGE_SABOTAGE","GRUDGE_BRIBE","GRUDGE_THUGS","evWeight","evTune","EV_DRAWN"];
  const miss = NEED.filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p50:at(.5), p75:at(.75), p90:at(.9), p99:at(.99), max:s[s.length-1] }; };
  const MK = Object.keys(A.RIVAL_MOVES);
  const HOSTILE = ["poached","sabotage","thugs","bribedEditor","stolenSteel","courted","defected","whispers"];
  const mult = (h, k) => { const L = A.lanistaOf(h.name); return (L && L[k] != null) ? L[k] : 1; };

  /* the bag `rivalTurn` builds, without taking its draw */
  const bagOf = (d, h) => { const b = {}; let tot = 0;
    for(const k of MK){ const M = A.RIVAL_MOVES[k];
      let ok = false; try { ok = M.when(d,h); } catch(e){ ok = false; }
      if(!ok) continue;
      let w = 1; try { w = M.weight(h); } catch(e){ w = 1; }
      const n = Math.round(Math.max(0.2, w) * 10);
      b[k] = n; tot += n; }
    return { b, tot }; };

  /* the four the item names, read off `RIVAL_MOVES` itself rather than copied — a hand-written list
     is the fault `actions` was written for, and it catches a name that goes missing but never one
     that was never added */
  const HOT = MK.filter(k=>A.RIVAL_MOVES[k].hostile).map(k=>({ key:k,
    gate: { poach:A.GRUDGE_POACH, bribe:A.GRUDGE_BRIBE, sabotage:A.GRUDGE_SABOTAGE, thugs:A.GRUDGE_THUGS }[k],
    mul:  { poach:"poach", bribe:"bribe", sabotage:"sabotage", thugs:"poach" }[k],
    when: A.RIVAL_MOVES[k].when }));
  if(!HOT.length) return { why:"`RIVAL_MOVES` carries no move marked `hostile` — #246 phase 2 is not in this build" };

  const t = { weeks:0, houseWeeks:0, grudges:[], over:{}, hotRun:[], top:0,
    bag:{}, bagWeeks:0, eligible:{}, acts:0, kinds:{}, poaches:0,
    shadow:{ raw:{ share:[], any:0 }, norm:{ share:[], any:0 } },
    lan:{}, evw:{}, hot:{},
    /* 5 · THE LEDGER. A weight multiplies the grudge, so what the grudge itself is fed matters more
       than any weight. Week over week per house: what went in, what the decay took, and what else
       took it. `grudgeDecay` is 1 x the lanista's rate per week whenever the grudge is above zero,
       so it is known exactly and everything else is the residual. Only weeks where the modelled
       decay lands strictly inside [0,100] are counted — a clamp at either end would otherwise be
       read as a flow, which is the fault v3.209.0 found in the unrest residual. */
    flow: { weeks:0, up:0, upN:0, downOther:0, downN:0, decay:0, met:0, zero:0, fromZero:0, fromZeroTo:[] } };
  for(const k of MK) { t.bag[k] = 0; t.eligible[k] = 0; }
  for(const g of [A.GRUDGE_SABOTAGE, A.GRUDGE_POACH, A.GRUDGE_BRIBE, A.GRUDGE_THUGS]) t.over[g] = 0;
  for(const c of HOT){ t.shadow.raw[c.key] = 0; t.shadow.norm[c.key] = 0; }

  for(let hh=0; hh<H; hh++){
    const d = A.newGameState("Sp"+hh, "clean", `${SEED}-${hh}`);
    const run = {};                                   /* the hot spell each house is in */
    const prev = {};                                  /* last week's grudge, for the ledger */
    for(let w=0; w<W; w++){
      if(d.over) break;
      t.weeks++;
      const riv = (d.rivals||[]).filter(x=>!x.retired);
      for(const h of riv){
        const g = h.grudge || 0;
        if(prev[h.name] != null){
          const g0 = prev[h.name], dec = g0 > 0 ? Math.min(g0, 1 * (A.lanistaOf(h.name).grudgeDecay || 1)) : 0;
          const modelled = g0 - dec;
          if(modelled > 0 && modelled < 100 && g0 < 100){       /* no clamp at either end */
            t.flow.weeks++; t.flow.decay += dec;
            const resid = g - modelled;
            if(resid > 0.001){ t.flow.up += resid; t.flow.upN++; }
            else if(resid < -0.001){ t.flow.downOther += -resid; t.flow.downN++; }
          }
          /* ---- AND THE COLD HOUSE WARMING, COUNTED OUTSIDE THAT GUARD ----
             The first draft put this inside it, where `g0 === 0` makes the modelled decay 0 and the
             `modelled > 0` test can never pass: the counter was structurally incapable of moving and
             read 0 of 4,418, which is precisely the shape FAULT SIX exists to catch. A grudge that
             is 0 on two house-weeks in three is DEFINED by the weeks it leaves zero, so that is the
             number, and it is taken before any residual arithmetic. */
          if(g0 === 0){ t.flow.zero++; if(g > 0){ t.flow.fromZero++; t.flow.fromZeroTo.push(Math.round(g)); } }
        }
        prev[h.name] = g;
        t.houseWeeks++; t.grudges.push(Math.round(g)); if(g > t.top) t.top = g;
        for(const gate of Object.keys(t.over)) if(g >= +gate) t.over[gate]++;
        if(g >= A.GRUDGE_SABOTAGE) run[h.name] = (run[h.name]||0) + 1;
        else if(run[h.name]){ t.hotRun.push(run[h.name]); run[h.name] = 0; }
        const L = A.lanistaOf(h.name);
        if(L && !t.lan[h.name]) t.lan[h.name] = { poach:mult(h,"poach"), bribe:mult(h,"bribe"), sabotage:mult(h,"sabotage") };
      }
      /* 2 · the bag, and 4 · the same bag with the four hostile moves in it */
      const pickable = riv.filter(x=>!x.away);
      for(const h of pickable){
        const { b, tot } = bagOf(d, h);
        if(!tot) continue;
        t.bagWeeks++;
        for(const k of Object.keys(b)){ t.bag[k] += b[k]; t.eligible[k]++; }
        /* `norm` is what SHIPPED and is already inside `b`; `raw` is the item's literal
           `grudge x mult`, rebuilt on the same bag so the two are one comparison. */
        { let hotN = 0, hotR = 0, cold = tot;
          for(const c of HOT){
            if(b[c.key] == null) continue;
            cold -= b[c.key]; hotN += b[c.key];
            const g = h.grudge || 0, m = mult(h, c.mul);
            hotR += Math.round(Math.max(0.2, g * m) * 10);
            t.shadow.norm[c.key] += b[c.key];
            t.shadow.raw[c.key]  += Math.round(Math.max(0.2, g * m) * 10);
          }
          if(hotN > 0){ t.shadow.norm.any++; t.shadow.norm.share.push(hotN / tot); }
          if(hotR > 0){ t.shadow.raw.any++;  t.shadow.raw.share.push(hotR / (cold + hotR)); }
        }
      }
      if(d.poach) t.poaches++;
      for(const h of riv) if((h.grudge||0) >= A.GRUDGE_SABOTAGE)
        (t.hot[h.name] = t.hot[h.name] || { weeks:0, acts:0 }).weeks++;
      let did; try { did = R.lanista(d); } catch(e){ break; }
      const ev = d.pendingEvent && d.pendingEvent.id;
      if(ev && HOSTILE.includes(ev)){ t.acts++; t.kinds[ev] = (t.kinds[ev]||0)+1;
        /* 6 · AND WHOSE. The card carries the house it is charged to, so the accused can be counted
           per week that house actually held a grudge — which is the only way to see a multiplier
           rather than a bay's seating plan. */
        const who = d.pendingEvent.data && d.pendingEvent.data.house;
        if(who) (t.hot[who] = t.hot[who] || { weeks:0, acts:0 }).acts++; }
    }
    for(const k of Object.keys(run)) if(run[k]) t.hotRun.push(run[k]);
  }

  /* 3 · what the multipliers drive in the event die: nothing. Read the weight the shuffle actually
     uses for the three hostile cards, on a fresh state and on a used one. */
  { const d0 = A.newGameState("EvW", "clean", `${SEED}-evw`);
    for(const k of ["sabotage","bribedEditor","thugs"]){
      const tune = A.evTune(k);
      t.evw[k] = { w:tune.w, cool:tune.cool, fresh:A.evWeight(d0, k), drawn:A.EV_DRAWN.includes(k) };
    }
    t.evPool = A.EV_DRAWN.length;
    /* and the same weight for a bay of schemers against a bay of the placid — if the multipliers
       reached the odds these two would differ */
    t.evwSame = true;
    const names = Object.keys(A.LANISTAE);
    for(const n of names){ const d1 = A.newGameState("EvW", "clean", `${SEED}-${n}`);
      if(A.evWeight(d1, "sabotage") !== t.evw.sabotage.fresh) t.evwSame = false; } }

  const pc = (v, n) => n ? Math.round(1000*v/n)/10 : 0;
  const share = a => a.length ? Math.round(1000*a.reduce((s,x)=>s+x,0)/a.length)/10 : 0;
  return {
    weeks:t.weeks, houseWeeks:t.houseWeeks, bagWeeks:t.bagWeeks, top:Math.round(t.top),
    grudge: q(t.grudges),
    over: Object.fromEntries(Object.entries(t.over).map(([g,n])=>[g, pc(n, t.houseWeeks)])),
    hotRun: q(t.hotRun),
    bagShare: Object.fromEntries(MK.map(k=>[k, pc(t.bag[k], Object.values(t.bag).reduce((s,x)=>s+x,0))])),
    eligible: Object.fromEntries(MK.map(k=>[k, pc(t.eligible[k], t.bagWeeks)])),
    acts:t.acts, kinds:t.kinds, everyN: t.acts ? Math.round(t.weeks/t.acts) : null,
    poachWeeks: pc(t.poaches, t.weeks),
    shadow: {
      raw:  { anyPc: pc(t.shadow.raw.any,  t.bagWeeks), hostileShare: share(t.shadow.raw.share),
              by: Object.fromEntries(HOT.map(c=>[c.key, t.shadow.raw[c.key]])) },
      norm: { anyPc: pc(t.shadow.norm.any, t.bagWeeks), hostileShare: share(t.shadow.norm.share),
              by: Object.fromEntries(HOT.map(c=>[c.key, t.shadow.norm[c.key]])) },
    },
    flow: { weeks:t.flow.weeks,
      inPerWeek: t.flow.weeks ? Math.round(1000*t.flow.up/t.flow.weeks)/1000 : 0,
      decayPerWeek: t.flow.weeks ? Math.round(1000*t.flow.decay/t.flow.weeks)/1000 : 0,
      otherOutPerWeek: t.flow.weeks ? Math.round(1000*t.flow.downOther/t.flow.weeks)/1000 : 0,
      weeksItRose: pc(t.flow.upN, t.flow.weeks), weeksItFellOther: pc(t.flow.downN, t.flow.weeks),
      sittingAtZero: pc(t.flow.zero, t.houseWeeks),
      leftZero: t.flow.fromZero, leftZeroPcOfZeroWeeks: pc(t.flow.fromZero, t.flow.zero),
      andLandedAt: q(t.flow.fromZeroTo) },
    accused: Object.fromEntries(Object.entries(t.hot).map(([n,v])=>[n,
      { hotWeeks:v.weeks, acts:v.acts, per100:v.weeks ? Math.round(1000*v.acts/v.weeks)/10 : null,
        poach:(t.lan[n]||{}).poach, bribe:(t.lan[n]||{}).bribe, sabotage:(t.lan[n]||{}).sabotage }])),
    lanistae:t.lan, evw:t.evw, evwSameForEveryBay:t.evwSame, evPool:t.evPool };
}, [H,W,SEED]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
/* the rate a shadow share implies: the turn fires on 30% of weeks and picks one of the houses */
const houses = Object.keys(out.lanistae).length || 3;
for(const m of ["raw","norm"]){
  const s = out.shadow[m];
  const perWeek = 0.30 * (s.anyPc/100) * (s.hostileShare/100);
  s.impliedEveryN = perWeek > 0 ? Math.round(1/perWeek) : null;
}
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
