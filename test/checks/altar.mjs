/* A BLESSING NAMES ITSELF WHERE IT WORKS

   Audit item #219: "The temple is furniture. Blessed on 2.3% of weeks, vows never taken (rope),
   while the altar ledger (v3.153.0) made the shop legible. The gods' effects are real but arrive
   unsigned — a blessed win reads exactly like an ordinary one. Recommend outcomes name the god
   when a blessing worked (Fortuna's finger, Aesculapius at the bedside), so piety visibly earns
   its denarii and the 2.3% has a reason to rise."

   THE FIRST HALF WAS THE INSTRUMENT. The rope's `rites` lever read `d.blessing` — a field that is
   never cleared, which is why every panel in the game reads `blessOf(d)` instead — so the first
   offering a rope ever made was also its last, for the life of the house. Measured
   (`probes/temple.mjs`): 10 houses over 1,637 weeks under `rites:true` made **0 offerings and
   swore 0 vows**, and were indistinguishable from a rope with the lever off at ~2% blessed weeks.
   That is the item's 2.3%, and it is a sentence about the lever. Fixed, the same rope is blessed
   on **43.6%** of weeks with a vow standing on **38.8%**; a policy that prays on every cooldown
   reaches 70.6%. `temple`'s own note has said the same thing since v2.52.0 — "a policy that keeps
   the rites reaches 31.6% blessing uptime". The temple was never furniture. And no check in the
   suite passes `rites`, so it was a trap rather than a live fault — #230's shape exactly — which
   is why it is opt-in now: a dead lever that starts working silently changes 136 checks.

   THE SECOND HALF WAS EXACTLY RIGHT, AND IT WAS NOT CLOSE. Across 160 weeks with a blessing kept
   riding: **0 of 2,582 bout beats and 0 of 606 chronicle lines named one of the five gods.** The
   offering line at the altar was the only place any of them was ever mentioned, and that is the
   receipt for the purchase, not the goods.

   Three of the five sign the moment they change something now, each priced by differencing the
   engine's own function rather than by a second formula (#150):

     Fortuna     `blessWorth` is `saluteWorth`'s counterfactual with her 9 points of `ctx.fav`
                 taken back out — measured at +2.0 points of spare odds on average, up to +12.4
     Aesculapius the healer's share of the week's mending rate, banked on the wound, spoken at
                 the table when it comes to a week or more
     Victoria    the purse minus the purse without her multiplier, on the result's own summary

   And all five keep a running count of what they have DONE — not what they offered — which the
   temple panel prints under the boon. Mars and Jupiter move standing numbers a little every week
   and have no moment to sign, so the count is the whole of their signature. It counts the clamp
   honestly: Jupiter at patrons already devoted adds nothing and says nothing.

   FIVE ARMS:
   1 · THE PRICE ON THE BEAT IS THE ROLL'S OWN, and zero when no goddess rode.
   2 · EVERY GOD SIGNS — a receipt for all five, a moment for the three that have one.
   3 · AND NOTHING IS SIGNED THAT WAS NOT GIVEN: an unblessed house names no god anywhere.
   4 · THE RECEIPT COUNTS WHAT HAPPENED, NOT WHAT WAS OFFERED — a boon spent against a clamp
       adds nothing and claims nothing.
   5 · AND THE LEVER IS NOT DEAD AGAIN: a rope told to keep the rites actually keeps them. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "altar";
export const describe = "a blessing names itself where it works, and the figure is the roll's own";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"ALTAR-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","GODS","GOD_KEYS","blessOf","blessWorth","blessTold","blessDid",
                  "blessMercy","blessHeal","blessPurse","makeOffering","offeringReady","missioPlace",
                  "missioScore","missioOdds","missioAccount","activeG","patronsOf","genGladiator",
                  "endWeek","templeWeek","makePatron"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const bad = [];
    const NAMES = A.GOD_KEYS.map(k=>A.GODS[k].name);
    const namesAGod = t => NAMES.filter(n=>String(t||"").includes(n));

    const house = (tag, wk) => { const d = A.newGameState(tag, "capua", tag);
      for(let w = 0; w < (wk||10) && !d.over; w++) R.lanista(d, {});
      if(!A.activeG(d).length){ const g = A.genGladiator(d, 60); g.id = d.nextId++;
        g.status = "active"; g.mine = true; d.gladiators.push(g); }
      return d; };
    /* EXTEND, do not replace: `d.blessing` carries the running count, and a fixture that reassigns
       the object every week wipes the very receipt it is about to read. The first draft did, and
       read five nulls off five gods that had all done their work. */
    const bless = (d, god) => {
      if(d.blessing && d.blessing.god === god) d.blessing.until = d.week + A.GODS[god].weeks;
      else d.blessing = { god, until: d.week + A.GODS[god].weeks }; };

    /* ---- 1. the price on the beat is the roll's own ---- */
    const worth = { asks:0, mean:0, max:0, zeroWhenBare:true, beats:0, matched:0 };
    { const d = house("ALTAR-W", 12);
      const g = A.activeG(d).slice().sort((a,b)=>(b.pfame||0)-(a.pfame||0))[0];
      let sum = 0;
      for(const fame of [10, 60, 200, 600]) for(const account of [20, 40, 60, 80])
        for(const crowd of [40, 62, 85]){
          const man = Object.assign({}, g, { pfame:fame });
          bless(d, "fortuna");
          const P = A.missioPlace(d, null);
          const ctx = Object.assign({}, P, { tier:2, man:0, day:0 });
          const got = A.blessWorth(man, ctx, crowd, account, 16);
          /* the same pair of calls, here, off the engine's own two functions */
          const full = A.missioOdds(A.missioScore(man, ctx, crowd, account, 16, true));
          const bare = A.missioOdds(A.missioScore(man,
            Object.assign({}, ctx, { fav:(ctx.fav||0) - A.blessMercy(d) }), crowd, account, 16, true));
          if(Math.abs(got - (full - bare)) > 1e-9)
            bad.push(`the goddess's share on the beat is not the difference the roll would make: `
              + `${got} against ${full - bare}`);
          worth.asks++; sum += got; worth.max = Math.max(worth.max, got);
          /* and nothing at all when she is not riding */
          d.blessing = null;
          const P2 = A.missioPlace(d, null);
          if(A.blessWorth(man, Object.assign({}, P2, { tier:2, man:0, day:0 }), crowd, account, 16) !== 0)
            worth.zeroWhenBare = false;
        }
      worth.mean = worth.asks ? sum / worth.asks : 0;
      if(!worth.asks) bad.push(`the counterfactual arm asked nothing`);
      if(worth.mean <= 0) bad.push(`Fortuna is worth ${worth.mean} points of spare odds — the boon `
        + `says the finger goes up for him and the arithmetic does not agree`);
      if(!worth.zeroWhenBare) bad.push(`an unblessed house is quoted a share of the editor's answer`);
    }

    /* ---- 2 and 4. every god signs, and signs what happened ---- */
    const receipts = {}, moments = {}, wheelSides = { spared:null, died:null };
    for(const god of A.GOD_KEYS){
      const d = house(`ALTAR-${god}`, 14);
      bless(d, god);
      /* give each one something to actually do */
      if(god === "mars") A.activeG(d).forEach(g=>{ g.morale = 40; });
      if(god === "jupiter"){ if(!A.patronsOf(d).length) d.patrons.push(A.makePatron(d, "merchant"));
        A.patronsOf(d).forEach(x=>{ x.favor = 40; }); }
      if(god === "aesculapius"){ const g = A.activeG(d)[0];
        g.status = "injured"; g.injury = { name:"a cut", part:"arm", pen:4, weeks:6, care:"rest" }; }
      for(let w = 0; w < A.GODS[god].weeks - 1; w++){
        bless(d, god);                      /* hold it riding for the run of the boon */
        try { A.templeWeek(d); } catch(e){ bad.push(`templeWeek threw under ${god}: ${e.message}`); break; }
        if(god === "aesculapius"){ try { A.endWeek(d); } catch(e){} }
      }
      if(god === "fortuna"){
        /* ---- SHE SIGNS WHETHER OR NOT HE LIVED ----
           A blessed LOSS reading like an ordinary one is the same fault as a blessed win, and the
           first draft of this arm took any wheel beat at all — a sabotage that silenced only the
           spared branch walked straight past it. Both sides are held. */
        for(let i = 0; i < 160 && !(wheelSides.spared && wheelSides.died); i++){
          bless(d, "fortuna");
          const t = R.takeBout(d, {});
          const beats = (t && t.res && t.res.beats) || [];
          const fell = beats.some(b=>b.kind === "spared" && b.actor === "A");
          const dead = beats.some(b=>b.kind === "death" && b.actor === "A");
          for(const b of beats) if(b.kind === "wheel"){
            moments.fortuna = moments.fortuna || b.text;
            if(!(b.wheel > 0)) bad.push(`the wheel beat carries no figure`);
            if(fell) wheelSides.spared = wheelSides.spared || b.text;
            if(dead) wheelSides.died = wheelSides.died || b.text;
          }
          try { R.lanista(d, {}); } catch(e){}
          if(!A.activeG(d).length){ const m = A.genGladiator(d, 60); m.id = d.nextId++;
            m.status = "active"; m.mine = true; d.gladiators.push(m); }
        }
        if(!wheelSides.spared) bad.push(`a man Fortuna helped spare is never told she was in it`);
        if(!wheelSides.died) bad.push(`a man Fortuna could not save dies without her being named — `
          + `a blessed loss reads exactly like an ordinary one, which is the item`);
      }
      if(god === "victoria"){
        for(let i = 0; i < 40 && !moments.victoria; i++){
          bless(d, "victoria");
          const t = R.takeBout(d, {});
          for(const l of ((t && t.res && t.res.sum) || (t && t.sum) || []))
            if(namesAGod(l).length) moments.victoria = String(l);
          try { R.lanista(d, {}); } catch(e){ break; }
        }
      }
      if(god === "aesculapius")
        for(const l of (d.log||[])) if(/Aesculapius/.test(String((l&&l.text)||l||"")))
          { moments.aesculapius = String((l&&l.text)||l); break; }
      bless(d, god);
      receipts[god] = A.blessTold(d);
      if(!receipts[god]) bad.push(`${A.GODS[god].name} rode for ${A.GODS[god].weeks} weeks with work `
        + `in front of ${god==="jupiter"?"him":"her"} and the temple panel shows no receipt at all`);
    }
    for(const god of ["fortuna","aesculapius","victoria"])
      if(!moments[god]) bad.push(`${A.GODS[god].name} changed an outcome and the outcome does not `
        + `name ${god==="victoria"||god==="fortuna"?"her":"him"} — which is the item`);
    for(const [god, m] of Object.entries(moments))
      if(!namesAGod(m).includes(A.GODS[god].name))
        bad.push(`the ${god} moment does not carry the god's name: "${m}"`);

    /* ---- 4b. a boon spent against a clamp claims nothing ---- */
    let clamped = null;
    { const d = house("ALTAR-CLAMP", 10);
      if(!A.patronsOf(d).length) d.patrons.push(A.makePatron(d, "merchant"));
      A.patronsOf(d).forEach(x=>{ x.favor = 100; });
      bless(d, "jupiter");
      for(let w = 0; w < 4; w++){ bless(d, "jupiter"); A.templeWeek(d);
        A.patronsOf(d).forEach(x=>{ x.favor = 100; }); }
      clamped = { did: A.blessDid(d), told: A.blessTold(d) };
      if(clamped.did > 0 || clamped.told)
        bad.push(`Jupiter is credited with ${clamped.did} of warmth he could not add — the patrons `
          + `were already devoted and the receipt says "${clamped.told}"`); }

    /* ---- 3. an unblessed house names nobody ---- */
    const clean = { beats:0, sums:0, log:0, named:0 };
    { const d = house("ALTAR-NONE", 8);
      for(let w = 0; w < 60 && !d.over; w++){
        d.blessing = null;
        const t = R.takeBout(d, {});
        for(const b of ((t && t.res && t.res.beats) || [])){ clean.beats++;
          if(namesAGod(b.text).length){ clean.named++;
            bad.push(`an unblessed bout names ${namesAGod(b.text)[0]}: "${String(b.text).slice(0,80)}"`); } }
        for(const l of ((t && t.res && t.res.sum) || [])){ clean.sums++;
          if(namesAGod(l).length){ clean.named++;
            bad.push(`an unblessed purse names ${namesAGod(l)[0]}`); } }
        try { R.lanista(d, {}); } catch(e){ break; }
        d.blessing = null;
      }
      for(const l of (d.log||[])){ clean.log++;
        const txt = String((l&&l.text)||l||"");
        if(/denarii to the altar of|vow to |pledged/.test(txt)) continue;
        if(namesAGod(txt).length){ clean.named++;
          bad.push(`an unblessed week writes "${txt.slice(0,70)}"`); } }
      if(clean.beats < 50) bad.push(`the unblessed sweep only produced ${clean.beats} beats`);
      if(A.blessTold(d)) bad.push(`an unblessed house shows a receipt on the temple panel`); }

    /* ---- 5. and the lever is not dead again ---- */
    const lever = { weeks:0, blessed:0, offerings:0, vowWeeks:0 };
    { for(let h = 0; h < 3; h++){
        const d = A.newGameState(`ALTAR-L${h}`, "capua", `ALTAR-L${h}`);
        let had = null;
        for(let w = 0; w < 90 && !d.over; w++){
          lever.weeks++;
          const now = A.blessOf(d);
          if(now) lever.blessed++;
          if(now && (!had || d.blessing.until !== had)) { lever.offerings++; had = d.blessing.until; }
          if(d.vow) lever.vowWeeks++;
          try { R.lanista(d, { rites:true }); } catch(e){ break; }
        } } }
    /* 12, not 3: with the lever dead the rope still manages ONE offering a house before the
       uncleared field locks it out, and a bar of three let a three-house sweep past. It makes 36 */
    if(lever.offerings < 12) bad.push(`a rope told to keep the rites made ${lever.offerings} offerings `
      + `in ${lever.weeks} weeks — the lever is dead again, which is the whole of #219's first half`);
    if(lever.blessed / Math.max(1, lever.weeks) < 0.15)
      bad.push(`a rope keeping the rites is blessed on `
        + `${Math.round(lever.blessed/Math.max(1,lever.weeks)*1000)/10}% of weeks`);

    return { bad, wheelSides, worth:{ asks:worth.asks, mean:Math.round(worth.mean*1000)/10,
      max:Math.round(worth.max*1000)/10 }, receipts, moments, clamped, clean, lever };
  });

  if(r.miss) return { pass:false, why:`handle is missing ${r.miss.join(", ")}`, lines:[] };
  bad.push(...r.bad);

  lines.push(`Fortuna is worth ${r.worth.mean} points of spare odds over ${r.worth.asks} asks `
    + `(most ${r.worth.max}), and the beat prints the roll's own difference`);
  lines.push(`the receipt each god leaves on the temple panel:`);
  for(const [g, t] of Object.entries(r.receipts)) lines.push(`   ${g.padEnd(13)} ${t}`);
  lines.push(`and the moment three of them sign:`);
  for(const [g, m] of Object.entries(r.moments)) lines.push(`   ${g.padEnd(13)} ${String(m).slice(0, 96)}`);
  lines.push(`and she signs both ways round — spared: ${r.wheelSides.spared ? "yes" : "NO"}, `
    + `killed anyway: ${r.wheelSides.died ? "yes" : "NO"}`);
  lines.push(`Jupiter against devoted patrons: credited ${r.clamped.did}, receipt ${r.clamped.told || "(none)"}`);
  lines.push(`an unblessed house: ${r.clean.named} of ${r.clean.beats} beats, ${r.clean.sums} summary `
    + `lines and ${r.clean.log} chronicle lines name a god`);
  lines.push(`a rope keeping the rites: ${r.lever.offerings} offerings in ${r.lever.weeks} weeks, `
    + `blessed on ${Math.round(r.lever.blessed/Math.max(1,r.lever.weeks)*1000)/10}% of them, `
    + `a vow standing on ${Math.round(r.lever.vowWeeks/Math.max(1,r.lever.weeks)*1000)/10}%`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
