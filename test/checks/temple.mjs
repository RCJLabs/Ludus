/* THE GODS, WHOM NOBODY EVER ASKED FOR ANYTHING.

   Five gods, four boons plumbed into four different places in the engine — the missio
   score, the healing rate, the purse and the fame off a win — plus a weekly hand on
   morale and on a patron's warmth, a piety scale with two tiers of consequence, and vows
   with a real stake, a real reward and a real punishment. A whole system, finished and
   working.

   And across 3,200 house-weeks of the v2.52.0 audit: piety 30 to 35 in every house, no
   vow ever sworn, no blessing ever riding. `makeOffering` and `swearVow` were off the
   handle, so nothing could have called them and no check could have noticed.

   The diagnosis took two wrong turns worth recording. The first was mine: the prices are
   a flat term plus an uncapped share of fame, written when the ladder of renown ended at
   600, so at the twenty thousand a great house actually carries Jupiter asked **20,300
   denarii** for five weeks. That is real, and it is capped now — but it was not what was
   binding, because the houses in the probe died long before that fame. The second was
   the probe's: its affordability guard demanded the cost plus the ruin line plus 1,200 in
   hand, against a median 808 in the box, so it refused in nearly every week the game
   allowed and the run read "the temple is unaffordable".

   What the corrected instrument found is the #95 answer again. Observing without acting:
   **in 86% of weeks a house had no blessing, the altar was ready, and the coin was in the
   box.** Acting: a policy that keeps the rites reaches **31.6% blessing uptime** for 19.6%
   of its income, carries piety to a median peak of 55, and — swearing as well — keeps 64
   vows of 79 and finishes devout. Nothing was out of reach. Nothing ever said the temple
   was there: the agenda had twenty sources and not one of them was the gods, and the
   villa's own Temple panel stayed collapsed unless you already had a vow standing.

   So this holds the machinery, the prices, and the two ways in. */

import { hasHandle } from "../harness.mjs";

export const name = "temple";
export const describe = "five gods, four boons, a fair vow, and a way to hear about it";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const R = {};

    const house = (seed, over)=>{
      const d = A.newGameState("Tm","clean",seed,null);
      d.gold = 30000; d.fame = 900; d.unrest = 10; d.week = 40;
      d.patrons = [{ id:1, name:"Magistrate", rank:"magistrate", favor:60, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      for(let i=0;i<4;i++){ const m = A.genGladiator(d, 74); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.wins=5; m.fatigue=0; m.lastFought=-9;
        d.gladiators.push(m); }
      Object.assign(d, over||{});
      return d;
    };
    const quiet = d => { d.pendingEvent = null;
      for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "rest");
      try { A.endWeek(d); } catch(e){}
      if(d.over){ d.over = null; d.unrest = Math.min(d.unrest, 20); } };

    /* ---- 1. each god, and the boon he actually carries ---- */
    R.gods = A.GOD_KEYS.map(k=>{
      const d = house("TM_"+k);
      const p0 = A.pietyOf(d), g0 = d.gold;
      const res = A.makeOffering(d, k);
      const heal0 = A.healSpeed ? null : null;
      const row = { god:k, name:A.GODS[k].name, weeks:A.GODS[k].weeks,
        paid: res ? res.cost : 0, quoted: A.GODS[k].cost(d),
        took: Math.round(g0 - d.gold), riding: A.blessOf(d), left: A.blessLeft(d),
        pietyUp: +(A.pietyOf(d) - p0).toFixed(1),
        mercy: A.blessMercy(d), heal: +A.blessHeal(d).toFixed(2),
        purse: +A.blessPurse(d).toFixed(2), fame: +A.blessFame(d).toFixed(2) };
      /* and the weekly hand — mars on morale, jupiter on a patron */
      const mor0 = A.activeG(d).reduce((s,g)=>s+g.morale,0)/A.activeG(d).length;
      const fav0 = d.favor;
      A.templeWeek(d);
      row.moraleWk = +(A.activeG(d).reduce((s,g)=>s+g.morale,0)/A.activeG(d).length - mor0).toFixed(2);
      row.favorWk = +(d.favor - fav0).toFixed(2);
      /* it runs out on its own clock */
      let stood = 0;
      for(let w=0; w<12 && A.blessOf(d); w++){ quiet(d); if(A.blessOf(d)) stood++; }
      row.stood = stood;
      return row;
    });

    /* ---- 2. the altar rests, one blessing at a time, and piety drifts home ---- */
    { const d = house("TM_COOL");
      A.makeOffering(d, "mars");
      const readyAtOnce = A.offeringReady(d);
      const secondNow = !!A.makeOffering(d, "victoria");
      for(let w=0; w<A.OFFERING_COOL; w++) quiet(d);
      const readyAfter = A.offeringReady(d);
      const swapped = !!A.makeOffering(d, "victoria");
      R.cool = { readyAtOnce, secondNow, readyAfter, swapped, riding:A.blessOf(d),
        wait:A.OFFERING_COOL };
      /* and piety comes back to the middling reverence of an ordinary house */
      const e = house("TM_DRIFT"); e.piety = 90;
      for(let w=0; w<120; w++) quiet(e);
      const f = house("TM_DRIFT2"); f.piety = 4;
      for(let w=0; w<120; w++) quiet(f);
      R.drift = { from90: Math.round(A.pietyOf(e)), from4: Math.round(A.pietyOf(f)) }; }

    /* ---- 3. the vow, both ways ----
       The settlement is read off `resolveVow` itself rather than across the weeks it
       takes to come due. Measured over ten quiet weeks, a broken vow appeared to hand
       back 640 denarii — which was the stipend and the upkeep of those weeks, not a
       refund. That the vow comes due at all is asserted separately, by playing it. */
    const vowRun = (seed, bury, cards)=>{
      const d = house(seed);
      const p0 = A.pietyOf(d), u0 = d.unrest, g0 = d.gold;
      const sworn = A.swearVow(d, "fortuna");
      const twice = !!A.swearVow(d, "mars");                   /* one at a time */
      const took = Math.round(g0 - d.gold);
      /* what the month risked. Every engine records through bookBout, so this is the same
         count a real card would produce. */
      for(let i=0;i<(cards||0);i++) A.bookBout(d, { win:true, purse:100, tier:1, kind:"single" });
      if(bury) d.fallen = (d.fallen||[]).concat([{ name:"Somebody", week:d.week }]);
      /* stand it out to the due week without letting the week's trade in */
      d.week = d.vow.until;
      const g1 = d.gold, cardsUnder = d.vow.bouts||0;
      A.resolveVow(d);
      return { stake: sworn ? sworn.stake : 0, took, twice, cardsUnder,
        back: Math.round(d.gold - g1), gone: !d.vow,
        pietyMove:+(A.pietyOf(d)-p0).toFixed(1), unrestUp:+(d.unrest-u0).toFixed(1),
        ill:A.illLuck(d), riding:A.blessOf(d) };
    };
    /* THE CARD COUNTS COME OFF THE CONSTANT, NOT OUT OF THE AIR.
       These were 5, chosen when the bar was VOW_EARNT_AT = 2. The bar moved to 6 — measured
       over 31 vows settled in real play, where the FEWEST cards under any vow was three and
       the median was eight, so 2 could never once fail — and a hardcoded 5 silently stopped
       being "a month of hard cards" and became a month just under the bar. A check that
       carries its own copy of a dial goes stale the week the dial moves, and reports the
       game as broken rather than itself. So: the bar, one under it, and nothing at all. */
    const BAR = A.VOW_EARNT_AT;
    R.vowKept  = vowRun("TM_VOWK", false, BAR);       /* a month that carried it in full */
    R.vowShort = vowRun("TM_VOWS", false, BAR - 1);   /* and one card short of it */
    R.vowIdle  = vowRun("TM_VOWI", false, 0);         /* and a month of promising nothing */
    R.vowBroken = vowRun("TM_VOWB", true, BAR);
    R.bar = BAR;
    /* and it does come due on its own, played out week by week */
    { const d = house("TM_VOWDUE");
      A.swearVow(d, "fortuna");
      const until = d.vow.until; let weeks = 0;
      for(let w=0; w<12 && d.vow; w++){ quiet(d); weeks++; }
      R.vowDue = { weeks, until: until - 40, gone:!d.vow }; }

    /* ---- 4. and the priests stop counting somewhere ----
       Every price was a flat term plus a share of fame with no ceiling, set when the
       ladder ended at 600. Jupiter asked 20,300 denarii of a house at fame 20,000. */
    { const at = f => { const d = house("TM_P"+f); d.fame = f;
        return { fame:f, prices:A.GOD_KEYS.map(k=>A.GODS[k].cost(d)), vow:A.vowStake(d) }; };
      R.price = { top:A.PIETY_TOP, rows:[at(120), at(600), at(A.PIETY_TOP), at(9000), at(20000)] }; }

    /* ---- 5. the two ways a player finds out any of this exists ---- */
    { const said = d => A.agenda(d).filter(x=>/rites|altar/i.test(x.label||""));
      /* a house keeping no rites at all */
      const godless = house("TM_AG1"); godless.piety = 8;
      A.weekReckoning(godless);
      /* a house with men laid up and an altar that would take a gift */
      const hurt = house("TM_AG2");
      for(const g of A.activeG(hurt).slice(0,2)) g.injury = { kind:"gash", weeks:3, sev:2 };
      /* and one with nothing wrong, which must hear nothing */
      const fine = house("TM_AG3");
      const blessed = house("TM_AG4");
      A.makeOffering(blessed, "victoria");
      R.agenda = {
        godless: said(godless).map(x=>({ u:x.urgency, l:x.label, s:x.sub })),
        hurt: said(hurt).map(x=>({ u:x.urgency, l:x.label, s:x.sub })),
        fine: said(fine).map(x=>({ u:x.urgency, l:x.label })),
        blessed: said(blessed).map(x=>({ u:x.urgency, l:x.label })) }; }

    /* ---- 6. and a house that keeps the rites actually gets something for it ---- */
    { const d = house("TM_RIDE"); d.gold = 60000;
      let weeks = 0, blessed = 0, spent = 0, offers = 0;
      for(let w=0; w<120; w++){
        d.gold = Math.max(d.gold, 8000);
        if(!A.blessOf(d) && A.offeringReady(d)){
          const r = A.makeOffering(d, "aesculapius");
          if(r){ spent += r.cost; offers++; }
        }
        quiet(d); weeks++;
        if(A.blessOf(d)) blessed++;
      }
      R.ride = { weeks, blessed, offers, spent,
        pct: +(100*blessed/weeks).toFixed(1), piety:Math.round(A.pietyOf(d)) }; }

    return R;
  });

  const lines = [], fails = [];
  lines.push("the five, and what each one actually carries:");
  for(const g of out.gods)
    lines.push(`   ${g.name.padEnd(12)} ${String(g.paid).padStart(5)}d · ${g.weeks}w (stood ${g.stood}) · piety +${g.pietyUp} · ` +
      `missio +${g.mercy} · heal ×${g.heal} · purse ×${g.purse} · fame ×${g.fame} · morale ${g.moraleWk>=0?"+":""}${g.moraleWk}/wk · standing ${g.favorWk>=0?"+":""}${g.favorWk}/wk`);
  lines.push(`the altar rests ${out.cool.wait} weeks: a second gift at once ${out.cool.secondNow}, after the wait ${out.cool.swapped} (now ${out.cool.riding})`);
  lines.push(`piety drifts home: from 90 → ${out.drift.from90}, from 4 → ${out.drift.from4}`);
  lines.push(`a vow kept through ${out.vowKept.cardsUnder} cards: ${out.vowKept.stake}d staked, ${out.vowKept.back}d back, piety +${out.vowKept.pietyMove} — riding: ${out.vowKept.riding || "nothing, which is the point"}`);
  lines.push(`one card short of the bar (${out.vowShort.cardsUnder} of ${out.bar}): ${out.vowShort.back}d back on ${out.vowShort.stake}d, piety +${out.vowShort.pietyMove} — the bar bites`);
  lines.push(`a vow kept through ${out.vowIdle.cardsUnder}: ${out.vowIdle.back}d back on ${out.vowIdle.stake}d, piety +${out.vowIdle.pietyMove} — the gods are not moved by a quiet month`);
  lines.push(`a vow broken: ${out.vowBroken.stake}d staked, ${out.vowBroken.back}d back, piety ${out.vowBroken.pietyMove}, unrest +${out.vowBroken.unrestUp}, ill turn ${out.vowBroken.ill}`);
  lines.push(`and it comes due on its own after ${out.vowDue.weeks} weeks (sworn for ${out.vowDue.until})`);
  lines.push(`what the priests ask (they stop counting fame at ${out.price.top}):`);
  for(const r of out.price.rows)
    lines.push(`   fame ${String(r.fame).padStart(6)} → ${r.prices.join(" / ")}d · a vow stakes ${r.vow}d`);
  lines.push(`the agenda: godless → ${out.agenda.godless.map(x=>`[${x.u}] ${x.l}`).join("; ") || "SILENT"}`);
  lines.push(`   two men laid up → ${out.agenda.hurt.map(x=>`[${x.u}] ${x.l} — ${x.s}`).join("; ") || "SILENT"}`);
  lines.push(`   nothing wrong → ${out.agenda.fine.length ? out.agenda.fine.map(x=>x.l).join("; ") : "silent, correctly"} · already blessed → ${out.agenda.blessed.length ? "STILL NAGGING" : "silent, correctly"}`);
  lines.push(`a house that keeps the rites: ${out.ride.offers} gifts, ${out.ride.spent}d, blessed ${out.ride.pct}% of ${out.ride.weeks} weeks, piety ${out.ride.piety}`);

  /* ---- every god must be a different god ---- */
  for(const g of out.gods){
    if(!g.paid) fails.push(`${g.name} would not take an offering from a house with 30,000d and a rested altar`);
    if(g.riding !== g.god) fails.push(`an offering to ${g.name} left "${g.riding}" riding with the house`);
    if(g.pietyUp < 5) fails.push(`an offering to ${g.name} moved piety ${g.pietyUp} — it is supposed to be worth keeping`);
    if(g.stood < g.weeks - 1)
      fails.push(`${g.name}'s blessing stood ${g.stood} weeks against the ${g.weeks} it promises`);
  }
  { const G = k => out.gods.find(x=>x.god===k);
    if(!(G("fortuna").mercy > 0)) fails.push("Fortuna's blessing does nothing to the wheel in the box");
    if(!(G("aesculapius").heal > 1)) fails.push("Aesculapius' blessing does not close a wound any faster");
    if(!(G("victoria").purse > 1 && G("victoria").fame > 1)) fails.push("Victoria's blessing makes a win neither richer nor louder");
    if(!(G("mars").moraleWk > 0)) fails.push("Mars' blessing puts no heart into the cells");
    if(!(G("jupiter").favorWk > 0)) fails.push("Jupiter's blessing does not warm a patron");
    /* and no god may quietly carry another's boon */
    if(G("mars").purse > 1 || G("mars").heal > 1) fails.push("Mars is carrying somebody else's boon"); }

  /* ---- the altar's own rules ---- */
  if(!out.cool.readyAtOnce === false && out.cool.secondNow) fails.push("two offerings in one week");
  if(out.cool.secondNow) fails.push(`the altar took a second gift inside its ${out.cool.wait}-week rest`);
  if(!out.cool.readyAfter) fails.push(`the altar never rests out its ${out.cool.wait} weeks`);
  if(!out.cool.swapped) fails.push("a rested altar refused a fresh offering");
  if(out.cool.riding !== "victoria") fails.push(`a fresh offering left "${out.cool.riding}" riding — one blessing at a time, the newest one`);
  if(!(out.drift.from90 < 60 && out.drift.from90 > 25))
    fails.push(`a devout house drifted to ${out.drift.from90} over two years — piety is supposed to fall back toward an ordinary 30`);
  if(!(out.drift.from4 > 18 && out.drift.from4 < 40))
    fails.push(`a godless house drifted to ${out.drift.from4} — it should climb back toward 30 on its own`);

  /* ---- the vow is a real bet, kept and broken ---- */
  if(!(out.vowKept.took >= out.vowKept.stake - 1)) fails.push("swearing a vow cost nothing");
  if(out.vowKept.twice) fails.push("two vows stand at once");
  if(!out.vowKept.gone) fails.push("resolving a vow did not clear it");
  if(!out.vowDue.gone) fails.push(`a vow sworn for ${out.vowDue.until} weeks never came due in ${out.vowDue.weeks} of play`);
  if(!(out.vowDue.weeks >= 4 && out.vowDue.weeks <= 8))
    fails.push(`a vow came due after ${out.vowDue.weeks} weeks — it is sworn on the month to come`);
  if(!(out.vowKept.back > out.vowKept.stake))
    fails.push(`a vow kept through ${out.vowKept.cardsUnder} cards returned ${out.vowKept.back}d on a ${out.vowKept.stake}d stake — a month genuinely risked is supposed to come back with interest`);
  if(!(out.vowKept.pietyMove >= 10)) fails.push(`a vow kept moved piety ${out.vowKept.pietyMove}`);
  /* ---- and the promise is the risk, not the month ---- */
  if(out.vowIdle.cardsUnder !== 0) fails.push("the idle vow was credited with cards it never fought");
  if(out.vowIdle.back > out.vowIdle.stake)
    fails.push(`a vow kept through no cards at all returned ${out.vowIdle.back}d on ${out.vowIdle.stake}d — a house that sends nobody anywhere has promised the gods nothing, and this is the v2.62.0 fault returning`);
  if(!(out.vowIdle.pietyMove < out.vowKept.pietyMove))
    fails.push(`promising nothing moved piety ${out.vowIdle.pietyMove} against ${out.vowKept.pietyMove} for a month of hard cards — the reward does not follow the risk`);
  /* and the bar has to be a bar: one card short of it must not pay what carrying it pays.
     At VOW_EARNT_AT = 2 this could not be written, because nothing in play was ever under 2. */
  if(!(out.vowShort.pietyMove < out.vowKept.pietyMove))
    fails.push(`${out.vowShort.cardsUnder} cards paid piety ${out.vowShort.pietyMove}, the same as ${out.vowKept.cardsUnder} — VOW_EARNT_AT is ${out.bar} and nothing is below it, which is how it sat inert for a release`);
  if(!(out.vowShort.back < out.vowKept.back))
    fails.push(`a vow one card short returned ${out.vowShort.back}d against ${out.vowKept.back}d — the purse is supposed to scale with what was risked`);
  /* ---- and a blessing is bought, never won ---- */
  if(out.vowKept.riding)
    fails.push(`a kept vow put "${out.vowKept.riding}" on the house — measured over 200 vows, a house past fame 1,600 kept 36 of 44 and collected 36 free blessings, so it never needed the altar the previous release spent itself pricing. The vow pays coin and piety; the altar sells blessings.`);
  if(out.vowIdle.riding) fails.push("a vow kept through nothing put a blessing on the house");
  if(out.vowBroken.back !== 0) fails.push(`a vow broken returned ${out.vowBroken.back}d — the stake is forfeit`);
  if(!(out.vowBroken.pietyMove <= -15)) fails.push(`a vow broken moved piety ${out.vowBroken.pietyMove} — the gods are not mocked`);
  if(!(out.vowBroken.unrestUp > 0)) fails.push("a vow broken left the cells untroubled");
  if(!out.vowBroken.ill) fails.push("a vow broken did not turn the house's luck");
  if(out.vowBroken.riding) fails.push("a vow broken left a blessing riding");

  /* ---- and the price stops climbing ---- */
  { const rows = out.price.rows, cap = rows.find(r=>r.fame===out.price.top), top = rows[rows.length-1];
    if(!cap) fails.push("the price could not be read at the cap");
    else {
      for(let i=0;i<cap.prices.length;i++)
        if(top.prices[i] > cap.prices[i])
          fails.push(`${out.gods[i].name} asks ${top.prices[i]}d at fame ${top.fame} against ${cap.prices[i]}d at the ${out.price.top} the priests stop counting at — this is the uncapped-fame fault of v2.43.0 and v2.47.0 for a third time`);
      if(top.vow > cap.vow)
        fails.push(`a vow stakes ${top.vow}d at fame ${top.fame} against ${cap.vow}d at the cap`);
      if(!(cap.prices[0] > rows[0].prices[0]))
        fails.push("a famous house pays no more at the altar than a new one — the cap has flattened the whole curve");
      const dearest = Math.max(...cap.prices);
      if(dearest > 4000)
        fails.push(`the dearest altar asks ${dearest}d even at the cap — a blessing is worth a few hundred denarii of effect, not a monument`);
    } }

  /* ---- and there are two ways to find out it is there ---- */
  if(!out.agenda.godless.length)
    fails.push("a house keeping no rites at all is told nothing by the agenda — this is the whole of #91, and it is how piety sat at 30 for three thousand house-weeks");
  else if(out.agenda.godless[0].u < 2)
    fails.push(`a godless house under an ill turn is urgency ${out.agenda.godless[0].u}`);
  if(!out.agenda.hurt.length)
    fails.push("two men laid up, a rested altar, coin in the box, and the agenda does not mention the healer");
  else if(!/\d/.test(out.agenda.hurt[0].s || ""))
    fails.push("the agenda names the altar without naming what it costs");
  if(out.agenda.fine.length) fails.push("the agenda talks about the gods to a house with nothing wrong — #84 was about exactly this");
  if(out.agenda.blessed.length) fails.push("the agenda asks for an offering from a house that already has a blessing riding");

  /* ---- and keeping the rites is a thing a house can actually do ---- */
  if(!(out.ride.pct > 55))
    fails.push(`a house doing nothing but keep the rites was blessed ${out.ride.pct}% of ${out.ride.weeks} weeks — the altar's rest is ${out.cool.wait} weeks against a ${out.gods.find(g=>g.god==="aesculapius").weeks}-week blessing, so this should be most of them`);
  if(!(out.ride.piety > 45))
    fails.push(`a house that kept the rites for ${out.ride.weeks} weeks finished at piety ${out.ride.piety} — the drift is outrunning the devotion`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
