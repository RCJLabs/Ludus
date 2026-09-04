/* A SENTENCE FOUGHT OUT IS WORTH SOMETHING, AND IT IS STILL NOT FREEDOM

   Phase queue item #238. The banner over this feature says a man condemned to the ludus who
   "survived his term earned the rudis out of it". `damnCheck` fired when the term cleared, gave him
   +26 regard and +24 morale, and left `g.status` at "active". Freedom runs through `grantRudis`,
   gated on `rudisEligible` — ten wins and 180 renown — which exempted him from nothing. The two
   counters do not even measure the same thing: a sentence is 10-18 BOUTS FOUGHT, win or lose, and
   the rudis wants ten WINS. A man who loses one bout of a ten-bout term was already short the day
   his paper was discharged.

   MEASURED FIRST (`probes/served.mjs`), and it moved the fix a layer below where the item put it.
   With a lanista deliberately working sentences off — softest bout on the bill, fought defensively,
   every week the man is fit — over 6,537 played weeks:

     82 arrived under a paper · 12 discharged alive (14.6%) · 45 died under it · 20 still serving
     a median of 59 weeks to work one off
     at discharge: median 2 wins and 49 renown, against a bar of 10 and 180
     **0 of 12 ever crossed it**

   Under the reference player, who does not work at it, 1 of 45 was discharged at all. So the item's
   falsifiable outcome (b) holds: discharged damnati essentially never cross the bar, and the
   promise has never been paid.

   AND THE ITEM'S PROPOSED CURVE IS BACKWARDS, which only the measurement shows. It scales the
   reward by win rate over the sentence — but the play that gets a condemned man to his discharge is
   the soft bout fought defensively. Surviving and winning are OPPOSED here, and the measured rates
   say so: p25 0.063, median 0.125, p75 0.30, max 0.500. Grading chiefly on wins rewards the
   strategy that buries him. So the term carries most of the discount (`DISCH_BASE`) and how well he
   fought adds to it (`DISCH_RATE`).

   REPLAYED AGAINST THE TWELVE REAL DISCHARGES: the two best servers walk at once where none could
   before; the middle band needs four or five more wins and thirty to ninety more renown; the two
   who won nothing still owe seven wins and 117 renown. Surviving alone is worth a third off the
   bar and no more.

   SEVEN ARMS. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "served";
export const describe = "a discharged sentence shortens a man's own road to the rudis, and never opens it";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"SERVED-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];
    let tick = 0;
    /* a house with one condemned man in it, his term already fought */
    const seat = (wins, losses, fame) => {
      const d = A.newGameState("Served", "clean", `SV-${tick++}`, null);
      d.week = 80; d.gold = 20000; d.gladiators = [];
      const g = A.genGladiator(d, 40); g.id = d.nextId++; g.status = "active"; g.mine = true;
      g.kit = A.defaultKit(g.cls); g.wins = wins; g.losses = losses; g.pfame = fame;
      g.age = 24; g.morale = 60; g.traits = (g.traits||[]).filter(t=>t!=="Glory-Seeker");
      g.damnatus = { what:"arson in the insulae", note:"n", bouts: wins+losses, since: 10 };
      d.gladiators.push(g);
      for(let i=0;i<3;i++){ const o = A.genGladiator(d, 50); o.id = d.nextId++;
        o.status="active"; o.mine=true; o.kit = A.defaultKit(o.cls); d.gladiators.push(o); }
      return { d, g };
    };

    /* ---- 1 + 2: the discharge attaches a bar, graded, and never above the house's ---- */
    let arm1 = null;
    { const rows = [];
      for(const [w,l,f] of [[0,14,0],[1,13,31],[2,12,49],[3,7,125],[6,6,156],[7,7,329],[14,0,400]]){
        const { d, g } = seat(w,l,f);
        const took = A.damnCheck(d, g);
        const o = g.rudisDischarge || null;
        /* tolerant of a missing bar: a check that CRASHES where it should report has taken the
           rest of its own arms down with it, which is how `blood.mjs` lost three */
        rows.push({ w, l, f, took, cut:+A.dischargeCut({wins:w,losses:l}).toFixed(3),
          bar: o ? `${o.wins}/${o.fame}` : "(none)", wins: o ? o.wins : null, fame: o ? o.fame : null,
          clear: A.rudisEligible(g), still: A.isDamn(g) });
        if(!took) bad.push(`a man whose term was fully served was not discharged (${w}w/${l}l)`);
        if(!o) bad.push(`the discharge attached no bar at all (${w}w/${l}l)`);
        if(o && (o.wins > A.RUDIS_WINS || o.fame > A.RUDIS_FAME))
          bad.push(`a discharged man is asked for ${o.wins}/${o.fame}, MORE than the house's own ${A.RUDIS_WINS}/${A.RUDIS_FAME} — the bar may only ever come down`);
        if(o && (o.wins < 1 || o.fame < 1)) bad.push(`the bar fell to ${o.wins}/${o.fame} — it is a shorter road, not an open door`);
      }
      arm1 = { rows };
      /* ordered AND actually graded. Asserting only that the bars never rise lets DISCH_RATE go to
         zero — every man gets the same cut, the order still holds, and "how he served" has stopped
         meaning anything. The ends have to differ. */
      const known = rows.filter(x=>x.wins != null);
      for(let i=1;i<known.length;i++)
        if(known[i].wins > known[i-1].wins)
          bad.push(`a man who fought better was asked for MORE wins (${known[i-1].w}w → ${known[i-1].wins}, ${known[i].w}w → ${known[i].wins})`);
      if(known.length >= 2){
        const worst = known[0], best = known[known.length-1];
        if(!(best.wins < worst.wins && best.fame < worst.fame))
          bad.push(`a man who won ${best.w} of ${best.w+best.l} is asked ${best.bar} and one who won ${worst.w} is asked ${worst.bar} — the curve does not grade, so how he served buys nothing`);
      }
      /* AND THE FLOOR IS A REAL GUARD, not a fact about what damnCheck happens to produce. Every
         cut is at least DISCH_BASE, so a produced bar is always under the house's — removing the
         Math.min changed nothing and passed. This asks the guard directly. */
      { const hand = A.newGameState("Floor", "clean", "SV-FLOOR", null);
        const gg = A.genGladiator(hand, 40); gg.id = hand.nextId++; gg.status="active"; gg.mine=true;
        gg.wins = 10; gg.pfame = 180;
        gg.rudisDischarge = { wins: A.RUDIS_WINS + 5, fame: A.RUDIS_FAME + 200 };
        const b = A.rudisBar(gg);
        if(b.wins > A.RUDIS_WINS || b.fame > A.RUDIS_FAME)
          bad.push(`a hand-written override of ${gg.rudisDischarge.wins}/${gg.rudisDischarge.fame} was read back as ${b.wins}/${b.fame} — rudisBar must floor at the house's bar whatever it is handed`);
        if(!A.rudisEligible(gg))
          bad.push(`a man at the house's own bar was refused because an override asked for more`); }
      /* surviving alone is worth exactly DISCH_BASE and no more */
      const none = rows[0];
      if(Math.abs(none.cut - A.DISCH_BASE) > 1e-9)
        bad.push(`a man who won nothing got a cut of ${none.cut}, not DISCH_BASE ${A.DISCH_BASE} — the term alone is what that constant prices`); }

    /* ---- 3: the gate and its readers take the per-man bar, and only for him ---- */
    let arm3 = null;
    { const { d, g } = seat(2,12,49);
      const plainBefore = A.rudisStanding(g);
      const wordBefore = A.rudisWord(g);
      A.damnCheck(d, g);
      const st = A.rudisStanding(g), word = A.rudisWord(g);
      /* an ordinary man in the same yard is untouched */
      const other = d.gladiators.find(x=>x.id !== g.id);
      other.wins = 2; other.pfame = 49;
      const oSt = A.rudisStanding(other), oBar = A.rudisBar(other);
      arm3 = { beforeWins:plainBefore.wins, beforeFame:plainBefore.fame,
        afterWins:st.wins, afterFame:st.fame, served:st.served, bar:st.bar,
        word, wordBefore, oWins:oSt.wins, oFame:oSt.fame, oBar };
      if(!(st.wins < plainBefore.wins && st.fame < plainBefore.fame))
        bad.push(`the discharge did not shorten his standing: ${plainBefore.wins}/${plainBefore.fame} → ${st.wins}/${st.fame}`);
      if(!st.served) bad.push(`rudisStanding does not report that this man served a sentence`);
      if(!/paper/.test(word)) bad.push(`the card does not say whose bar it is quoting: "${word}"`);
      if(!new RegExp(`${A.RUDIS_WINS}/${A.RUDIS_FAME}`).test(word))
        bad.push(`the card quotes his bar without the house's, so the player cannot see what it is worth: "${word}"`);
      if(oBar.wins !== A.RUDIS_WINS || oBar.fame !== A.RUDIS_FAME)
        bad.push(`an ordinary man's bar moved to ${oBar.wins}/${oBar.fame} — the override is per man`);
      if(oSt.wins !== A.RUDIS_WINS - 2) bad.push(`an ordinary man's standing changed`); }

    /* ---- 4: the road is shortened, never opened ---- */
    let arm4 = null;
    { const { d, g } = seat(0,14,0);
      A.damnCheck(d, g);
      const clearAtOnce = A.rudisEligible(g);
      const freed = A.grantRudis(d, g.id);
      /* and now give him what the shorter bar asks. Guarded: a discharge that attaches nothing is a
         FINDING, and a check that dereferences it crashes out of the browser instead of saying so. */
      const b = g.rudisDischarge;
      if(!b) bad.push(`the discharge attached no bar, so there is no shortened road to test`);
      g.wins = b ? b.wins : 99; g.pfame = b ? b.fame : 999;
      const clearAfter = A.rudisEligible(g);
      arm4 = { clearAtOnce, freed, bar: b ? `${b.wins}/${b.fame}` : "(none)", clearAfter };
      if(clearAtOnce) bad.push(`a man who won NOTHING walked free the moment his paper cleared — surviving is not the same as earning it`);
      if(freed) bad.push(`grantRudis freed a man who had not reached even his own shortened bar`);
      if(!clearAfter) bad.push(`a man who reached his own bar still could not be freed`); }

    /* ---- 5: and grantRudis pays out unchanged ---- */
    let arm5 = null;
    { const { d, g } = seat(3,7,125);
      A.damnCheck(d, g);
      const b = g.rudisDischarge;
      if(!b) bad.push(`the discharge attached no bar, so the payout cannot be checked against one`);
      g.wins = b ? b.wins : A.RUDIS_WINS; g.pfame = b ? b.fame : A.RUDIS_FAME;
      const fame0 = d.fame, unrest0 = d.unrest, gold0 = d.gold, freed0 = (d.freed||[]).length;
      const fee = A.rudisCost(d, g);
      const ok = A.grantRudis(d, g.id);
      /* the fate is written by `annalsSync`, which runs weekly inside `endWeek` off `g.fateNote ||
         g.status` — not synchronously by `grantRudis`. Asserting it straight after the grant reads
         null and says nothing about the accounting. */
      A.annalsSync(d);
      const ann = (d.annals||[]).find(x=>x.id === g.id);
      arm5 = { ok, status:g.status, freedRow:(d.freed||[]).length - freed0, fee,
        paid: gold0 - d.gold, fame:d.fame - fame0, unrest:d.unrest - unrest0,
        fate: ann ? ann.fate : null };
      if(!ok || g.status !== "freed") bad.push(`a discharged man who reached his own bar was not freed`);
      if(arm5.freedRow !== 1) bad.push(`the freeing did not reach d.freed, which is what the closed ending counts`);
      if(arm5.fate !== "freed") bad.push(`the annals recorded his fate as "${arm5.fate}" — the discount moves the gate and nothing else, so this must read like any manumission`);
      if(arm5.paid !== fee) bad.push(`the house paid ${arm5.paid} against a rudisCost of ${fee} — the state took its term, the house still pays the fee`);
      if(arm5.fame <= 0) bad.push(`freeing him paid no fame`);
      if(arm5.unrest >= 0) bad.push(`freeing him did not settle the cells`); }

    /* ---- 6: the chronicle distinguishes how he served ---- */
    let arm6 = null;
    { const say = (w,l,f) => { const { d, g } = seat(w,l,f); A.damnCheck(d, g);
        return (d.log||[]).length ? d.log[0].text : ""; };
      const poor = say(0,14,0), fair = say(3,10,60), good = say(7,7,329);
      arm6 = { poor:poor.slice(0,60), fair:fair.slice(0,60), good:good.slice(0,60) };
      const all = [poor, fair, good];
      if(new Set(all).size !== 3) bad.push(`the discharge says the same thing however he served`);
      for(const t of all){
        /* `herOwn` rewrites the line for a woman, so the pronoun is not part of the claim */
        if(!/fought out (his|her) sentence/.test(t)) bad.push(`a discharge line lost the sentence itself: "${t.slice(0,70)}"`);
        if(!/\d+ wins? and \d+ renown/.test(t)) bad.push(`a discharge line does not name the bar it just bought him: "${t.slice(0,90)}"`);
      }
      if(!/won a great many/.test(good)) bad.push(`the best server's line does not say he fought well`); }

    return { bad, arm1, arm3, arm4, arm5, arm6 };
  });

  bad.push(...r.bad);
  lines.push(`the bar a discharge buys (house bar ${r.arm1.rows.length ? "10/180" : "?"}):`);
  for(const x of r.arm1.rows)
    lines.push(`  ${String(x.w).padStart(2)}w/${String(x.l).padStart(2)}l ${String(x.f).padStart(3)} renown → cut ${x.cut} → asks ${x.bar}${x.clear ? "  (clear at once)" : ""}`);
  lines.push(`the card: before "${r.arm3.wordBefore}" · after "${r.arm3.word}"`);
  lines.push(`  and an ordinary man beside him is still asked ${r.arm3.oBar.wins}/${r.arm3.oBar.fame}`);
  lines.push(`a man who won nothing: clear at discharge ${r.arm4.clearAtOnce} · grantRudis ${r.arm4.freed} · at his own ${r.arm4.bar} he clears ${r.arm4.clearAfter}`);
  lines.push(`and the payout is a manumission like any other: freed ${r.arm5.status} · d.freed +${r.arm5.freedRow} · annals "${r.arm5.fate}" · paid ${r.arm5.paid}d of a ${r.arm5.fee}d fee · fame +${r.arm5.fame} · unrest ${r.arm5.unrest}`);
  lines.push(`the three discharges say three things: "${r.arm6.poor}…" / "${r.arm6.fair}…" / "${r.arm6.good}…"`);

  /* ---- 7: a played house, headless ---- */
  const play = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    let arrived = 0, discharged = 0, withBar = 0, overBar = 0, threw = null;
    for(let h=0; h<8; h++){
      const d = A.newGameState("SvP"+h, "capua", `SVP-${h}`);
      const seen = new Set();
      for(let w=0; w<260 && !d.over; w++){
        try { R.lanista(d, {}); } catch(e){ if(!threw) threw = String(e).slice(0,150); break; }
        for(const g of (d.gladiators||[])){
          if(A.isDamn(g) && !seen.has(g.id)){ seen.add(g.id); arrived++; }
          if(g.rudisDischarge){
            if(!seen.has("d"+g.id)){ seen.add("d"+g.id); discharged++; withBar++;
              if(g.rudisDischarge.wins > A.RUDIS_WINS || g.rudisDischarge.fame > A.RUDIS_FAME) overBar++; }
          }
        }
      }
    }
    return { arrived, discharged, withBar, overBar, threw };
  });
  lines.push(`played headless: ${play.arrived} arrived under a paper · ${play.discharged} discharged, every one with a bar of his own (${play.withBar}), none above the house's (${play.overBar})`);
  if(play.threw) bad.push(`a played house threw: ${play.threw}`);
  if(play.overBar) bad.push(`${play.overBar} discharged men were asked for more than the standard bar in play`);
  if(play.discharged !== play.withBar) bad.push(`${play.discharged - play.withBar} discharges attached no bar`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
