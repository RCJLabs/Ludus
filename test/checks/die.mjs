/* ONE DIE FOR THIRTY-SIX EVENTS — second phase queue #245, phase 2

   Phase 1 (`checks/pace.mjs`) measured the draw: fourteen events eligible on the median week and
   one ticket each, so an event eligible one week in a hundred had to also win a 1-in-14 shuffle.
   `pickEvent` is weighted now — `EV_DIE` gives each drawn event tickets set from its measured reach —
   and it cools: an event that fired stays out of the pool for `cool` weeks. The ORDER is weighted,
   not the outcome: make() is still asked first-eligible, so every gate keeps its meaning.

   SEVEN ARMS:
   1 · THE TABLE IS SOUND — every drawn event has a finite weight of one or more and a cooldown of
       zero or more; the raised events (make() is `return null`) are not in the pool at all; and the
       two lists together are every key in EVENTS.
   2 · THE SAMPLER IS PROPORTIONAL — from a pool of four real keys weighted 1 / 2 / 4 / 8, twenty
       thousand draws put each first in proportion to its tickets, within the noise of the count.
   3 · AND EQUAL WEIGHTS ARE STILL FAIR — six keys of one ticket each come out first within 1.15x of
       one another, which is the #108 property `draw.mjs` proved for the shuffle, kept.
   4 · A COOLED EVENT IS OUT OF THE POOL, and back in the week its quiet ends.
   5 · ON A REAL HOUSE EVERY ELIGIBLE EVENT IS STILL DRAWN over two thousand clone draws, and a
       draw stamps the event's week on `flags.evLast`.
   6 · AND THE RARE TIER IS REACHED — over seeded reference play, events holding four tickets or
       more take a share of the drawn firings that the flat die never gave them. The floor is set
       from the measured share, and the number is written beside it.
   7 · AND AN EVENT THE HOUSE HAS NEVER MET WEIGHS MORE — phase 3. `flags.evLast[k]` unset is
       "never drawn here"; the unseen key comes out first EV_FRESH times as often as a seen one. */
import { found, clearAll, installRope } from "../harness.mjs";

/* MEASURED on this build's own seeds (six houses, 260 weeks): the four-ticket-and-up tier takes 14.5% of
   die draws weighted and 10.3% flat — a lift of 4.2 points; at 16 x 420 on two seed sets the surveys
   gave +4.3 and +6.0. Both runs are seeded, so both figures are fixed numbers on a given build and the
   floor sits between them: a flat die reads 10.3% and +0.0 and fails both terms. Re-pin with a reason
   if the game re-phases; never by raising the die. */
const DIE_FLOOR = { abs:0.12, lift:0.02 };
export const name = "die";
export const describe = "the week's question is drawn by weight and cools after asking, and the rare tier is reached";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"DIE-1" });
  await clearAll(p, 12);
  await installRope(p);          /* found() reloads the page; the rope has to be put back for arm 6 */
  const r = await p.evaluate((DIE_FLOOR)=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["EV_DIE","EV_DRAWN","EV_FRESH","evTune","evPool","evPick","pickEvent","EVENTS","clone","rngGet","rngSet"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const out = { arms:[], notes:[] }; const say = (ok, why) => out.arms.push({ ok, why });
    const KEYS = Object.keys(A.EVENTS);
    const raised = KEYS.filter(k => /^\s*make\s*\(\s*\)\s*\{\s*return\s+null;?\s*\}\s*$/.test(String(A.EVENTS[k].make)));

    /* 1 */
    { const badW = A.EV_DRAWN.filter(k => !(Number.isFinite(A.evTune(k).w) && A.evTune(k).w >= 1 && A.evTune(k).cool >= 0));
      const leak = raised.filter(k => A.EV_DRAWN.includes(k));
      const union = new Set([...A.EV_DRAWN, ...raised]);
      out.notes.push(`${A.EV_DRAWN.length} drawn · ${raised.length} raised · ${KEYS.length} keys · tiers: ${[1,2,4,8].map(w=>w+"×"+A.EV_DRAWN.filter(k=>A.evTune(k).w===w).length).join(" ")}`);
      say(!badW.length && !leak.length && union.size === KEYS.length && A.EV_DRAWN.length + raised.length === KEYS.length,
        `${badW.length} drawn event(s) with a bad weight or cooldown; ${leak.length} raised event(s) in the pool; drawn + raised = ${A.EV_DRAWN.length + raised.length} of ${KEYS.length} keys`); }

    /* a house that has met every drawn event, so arms 2 and 3 measure the tickets alone — freshness
       (arm 7) is measured on its own */
    const jaded = (()=>{ const d = A.newGameState("Jd", "clean", "DIE-JADED", null); d.week = 200;
      d.flags.evLast = {}; for(const k of A.EV_DRAWN) d.flags.evLast[k] = 1; return d; })();
    /* 2 */
    { const pick = w => A.EV_DRAWN.find(k => A.evTune(k).w === w);
      const pool = [1,2,4,8].map(pick).filter(Boolean);
      if(pool.length < 4) say(false, `could not find one drawn event at each of the four weights`);
      else {
        const N = 20000, first = {}; for(const k of pool) first[k] = 0;
        for(let i=0;i<N;i++) first[A.evPick(pool.slice(), jaded)]++;
        const sum = pool.reduce((s,k)=>s+A.evTune(k).w, 0);
        const off = pool.map(k => { const want = A.evTune(k).w / sum, got = first[k] / N; return { k, w:A.evTune(k).w, want:+(want*100).toFixed(1), got:+(got*100).toFixed(1), rel: got / want }; });
        const worst = Math.max(...off.map(o => Math.abs(o.rel - 1)));
        out.notes.push(`proportional: ` + off.map(o=>`${o.k}(w${o.w}) ${o.got}% for ${o.want}%`).join(" · "));
        say(worst < 0.12, `first-out shares track the tickets to within ${(worst*100).toFixed(1)}% relative (bar 12%)`); } }

    /* 3 */
    { const six = A.EV_DRAWN.filter(k => A.evTune(k).w === 1).slice(0, 6);
      const N = 20000, first = {}; for(const k of six) first[k] = 0;
      for(let i=0;i<N;i++) first[A.evPick(six.slice(), jaded)]++;
      const ps = six.map(k => first[k] / N * 100), sp = Math.max(...ps) / Math.max(0.001, Math.min(...ps));
      say(six.length === 6 && sp <= 1.15, `six one-ticket keys come out first ${ps.map(x=>x.toFixed(1)+"%").join(" / ")} — ${sp.toFixed(2)}x spread (bar 1.15)`); }

    /* 4 */
    { const d = A.newGameState("Die", "clean", "DIE-COOL", null); d.week = 40;
      const k = A.EV_DRAWN.find(x => A.evTune(x).cool >= 3), c = A.evTune(k).cool;
      d.flags.evLast = { [k]: d.week - (c - 1) };
      const outNow = !A.evPool(d).includes(k);
      d.flags.evLast = { [k]: d.week - c };
      const backThen = A.evPool(d).includes(k);
      const rest = A.evPool(d).length;
      say(outNow && backThen && rest === A.EV_DRAWN.length, `${k} (cool ${c}) is out of the pool ${c-1} weeks after firing (${outNow}) and back at ${c} (${backThen}); the pool is otherwise whole (${rest} of ${A.EV_DRAWN.length})`); }

    /* 5 */
    { const d = A.newGameState("Dw", "clean", "DIE-HOUSE", null); d.gold = 6000;
      while(A.activeG(d).length < 5 && !A.rosterFull(d)){ const m = (d.market||[])[0]; if(!m) break; if(!A.buyFromBlock(d, m.id, null)) break; }
      for(let w=0; w<10; w++){ for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "palus"); d.pendingEvent = null; try { A.endWeek(d); } catch(e){ break; } }
      d.pendingEvent = null; d.flags.evLast = {};
      const eligible = A.EV_DRAWN.filter(k => { try { return !!A.EVENTS[k].make(A.clone(d)); } catch(e){ return false; } });
      const won = {}; let stamped = 0;
      for(let i=0;i<2000;i++){ const c = A.clone(d); const ev = A.pickEvent(c); if(!ev) continue;
        won[ev.id] = (won[ev.id]||0) + 1; if(c.flags.evLast && c.flags.evLast[ev.id] === c.week) stamped++; }
      const drawn = Object.keys(won), missed = eligible.filter(k => !won[k]);
      out.notes.push(`real house wk ${d.week}: ${eligible.length} eligible, ${drawn.length} drawn in 2000 · ` + Object.entries(won).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k} ${(v/20).toFixed(1)}%`).join(" · "));
      say(eligible.length >= 3 && missed.length === 0 && stamped === Object.values(won).reduce((a,b)=>a+b,0),
        `${eligible.length} eligible, ${drawn.length} drawn, ${missed.length} eligible never drawn (${missed.join(", ")||"none"}); every draw stamped evLast (${stamped})`); }

    /* 6 — the rare tier over seeded reference play, counted at the die itself — and against a FLAT die
       on the same seeds. `did.events` counts every question the rope answered, and for many keys that
       is two things added together (`stash` fired 44 times in 3,616 survey weeks at 0.7% eligibility —
       raised by the purse, not drawn). The die is one caller: it calls make(), and no raised event
       does, so every make() is wrapped and the calls that return a question are the die's draws.
       The run is seeded, so each figure is a fixed number on a given build: the weighted share and the
       flat share (every weight one, every cooldown nought, restored after). The floor is the LIFT
       between them plus an absolute, both set from the measurement written in ROADMAP v3.204.0 — a
       flat die is what a regression looks like, and it is what the sabotage restores. */
    const runDie = (label) => {
      const H = 6, W = 260; const drew = {}; const raw = {}; let weeks = 0;
      for(const k of A.EV_DRAWN){ const f = A.EVENTS[k].make; raw[k] = f;
        A.EVENTS[k].make = function(d){ const ev = f.call(this, d); if(ev) drew[k] = (drew[k]||0) + 1; return ev; }; }
      try {
        for(let h=0; h<H; h++){ const d = A.newGameState("Die"+h, "clean", `DIE-RUN-${h}`, null);
          for(let w=0; w<W; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ out.notes.push(`${label}: rope threw at week ${w} of house ${h}: ${e && e.message || e}`); break; } weeks++; } }
      } finally { for(const k of Object.keys(raw)) A.EVENTS[k].make = raw[k]; }
      return { weeks, drew, top: Object.entries(drew).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>`${k} ${v}`).join(" · ") };
    };
    /* shares are computed AFTER the weights are back, against the real tiers — the first draft
       counted the flat run's rare tier while every weight was one, and read 0.0% */
    const shareOf = (run, rareKeys) => { const total = Object.values(run.drew).reduce((a,b)=>a+b, 0);
      const rare = rareKeys.reduce((s,k)=>s+(run.drew[k]||0), 0); return { total, rare, share: total ? rare/total : 0 }; };
    { const weighted = runDie("weighted");
      /* the same seeds on a flat die: every ticket one, every cooldown nought — the v3.203.0 draw */
      const keep = {}; for(const k of Object.keys(A.EV_DIE)){ keep[k] = { ...A.EV_DIE[k] }; A.EV_DIE[k].w = 1; A.EV_DIE[k].cool = 0; }
      let flat; try { flat = runDie("flat"); } finally { for(const k of Object.keys(keep)) Object.assign(A.EV_DIE[k], keep[k]); }
      const rareKeys = A.EV_DRAWN.filter(k=>A.evTune(k).w >= 4);
      const Wd = shareOf(weighted, rareKeys), Fl = shareOf(flat, rareKeys);
      out.notes.push(`weighted: ${weighted.weeks} weeks · ${Wd.total} die draws · four-ticket-and-up ${Wd.rare} (${(Wd.share*100).toFixed(1)}%) · ${weighted.top}`);
      out.notes.push(`flat:     ${flat.weeks} weeks · ${Fl.total} die draws · the same events ${Fl.rare} (${(Fl.share*100).toFixed(1)}%) · ${flat.top}`);
      out.rare = { weighted:+(Wd.share*100).toFixed(1), flat:+(Fl.share*100).toFixed(1), lift:+((Wd.share-Fl.share)*100).toFixed(1) };
      say(Wd.total >= 100 && Fl.total >= 100 && Wd.share >= DIE_FLOOR.abs && Wd.share - Fl.share >= DIE_FLOOR.lift,
        `the rare tier takes ${(Wd.share*100).toFixed(1)}% of die draws weighted and ${(Fl.share*100).toFixed(1)}% flat on the same seeds — a lift of ${((Wd.share-Fl.share)*100).toFixed(1)} points (floor: ${(DIE_FLOOR.abs*100).toFixed(0)}% absolute, +${(DIE_FLOOR.lift*100).toFixed(0)} lift)`); }
    /* 7 — #245 phase 3: an event this house has never met weighs more.
       `flags.evLast[k]` unset IS "never drawn here", so no new state. From a pool of six one-ticket
       keys with exactly one of them unseen, the unseen one must come out first about EV_FRESH times
       as often as any seen one; and a house that has met them all draws them evenly (arm 3). */
    { const six = A.EV_DRAWN.filter(k => A.evTune(k).w === 1).slice(0, 6);
      const d = A.newGameState("Fr", "clean", "DIE-FRESH", null); d.week = 200; d.flags.evLast = {};
      for(const k of six.slice(1)) d.flags.evLast[k] = 1;          /* six[0] is the one it has never met */
      const N = 20000, first = {}; for(const k of six) first[k] = 0;
      for(let i=0;i<N;i++) first[A.evPick(six.slice(), d)]++;
      const unseen = first[six[0]] / N, seen = six.slice(1).reduce((s,k)=>s+first[k], 0) / N / 5;
      const ratio = seen ? unseen / seen : 0, want = A.EV_FRESH || 1;
      out.notes.push(`freshness: the unseen key first ${(unseen*100).toFixed(1)}% · a seen key ${(seen*100).toFixed(1)}% · ratio ${ratio.toFixed(2)} against EV_FRESH ${want}`);
      say(Number.isFinite(want) && want > 1 && Math.abs(ratio / want - 1) < 0.12,
        `an event the house has never met comes out first ${ratio.toFixed(2)}× as often as one it has (EV_FRESH ${want}, bar within 12%)`); }
    return out;
  }, DIE_FLOOR);
  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  for(const n of r.notes) lines.push(n);
  r.arms.forEach((a,i)=>{ lines.push(`${i+1}. ${a.ok ? "held" : "FAILED"} — ${a.why}`); if(!a.ok) bad.push(`arm ${i+1}: ${a.why}`); });
  return { pass: bad.length === 0 && !errors.length, why: bad[0] || null, lines };
}
