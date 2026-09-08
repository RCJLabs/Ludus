/* HER FAMILY IS A STANDING TIE — #243 phase 1.

   (`mistress` was free in BOTH directories; checked before writing, in checks and probes.)

   `resolveMatch` wrote `dmm.wife = { name, family, married, age, from }` and **nothing read `from`**.
   Three families — a merchant's daughter, a magistrate's niece, a rival's daughter that folds a feud
   — were one sentence each at the wedding and the same wife every week after it.

   MEASURED FIRST (`probes/mistress.mjs`, four arms of 16 x 420), because a tie is only worth
   building onto a hook that carries traffic:

     merchant    the block takes a median of 5 men a run (p90 33) and `bargain` comes about twice a
                 house. The busiest hook, and the one the reference player always gets — choice 0 on
                 the card is the merchant's daughter and this rope answers 0.
     magistrate  `inspector` fires a median of one to three times a house (p90 7) and heat sits at
                 p50 0 across weeks. Thin, so the tie is two multipliers on numbers that exist.
     rival       41 of 41 cards dealt to a house that went on to marry offered TWO families. The
                 matchmakers call at a median of week 38; the top grudge in the bay that week is a
                 median of SIX against the 30 the rival candidate wants, and 30 arrives at a median
                 of week 66. Only the arm that declined every match ever saw a third family — 9
                 cards of 53 — and the text said "three families are willing" on all fifty-three.

   THE RIVAL'S REACH IS STATED RATHER THAN FAKED. The bar is not wrong: `nemCand` wants grudge 45
   before a house is a nemesis at all, so the match card's 30 is already the generous end, and
   lowering it further would put "ends the feud" over a house that has no feud — the same lie the
   candidate count was telling. So the third family stays a choice for a man who is unmarried when a
   real grudge arrives, the reference player never sees it, and arm 4 drives it instead of a
   campaign proving it.

   FIVE ARMS. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "mistress";
export const describe = "the three families are three standing ties, and the folded feud is a hostage";

export async function run({ p }){
  const lines = [], bad = [];
  await found(p, { seed:"MIS-1" });
  await clearAll(p, 10);
  await installRope(p);

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["newGameState","matchEvent","resolveMatch","domusOf","wifeOf","wifeFrom","wifeKin",
                  "wifeWord","kinFeudBroken","slaverPrice","dealings","meetRecord","weddingEndsFeud",
                  "lawWeek","lawOf","houseOf","patronsOf","EVENTS","WIFE_BLOCK","WIFE_LAW","WIFE_EYE",
                  "WIFE_KIN_BACK","kinBlock","KIN_BARGAIN"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

    let tick = 0;
    const mk = (grudge) => {
      const d = A.newGameState("Mis", "clean", `MIS-${grudge}-${tick++}`, null);
      d.week = 60; d.fame = 400; d.gold = 40000;
      if(grudge != null){ const h = (d.rivals||[]).filter(x=>!x.retired)[0]; if(h) h.grudge = grudge; }
      return d;
    };
    /* the wedding, driven: find the candidate of a kind on the card and take it */
    const wed = (d, kind) => {
      const ev = A.matchEvent(d);
      if(!ev) return { ok:false, why:"no card" };
      const kinds = ((ev.data && ev.data.cands)||[]).map(c=>c.kind);
      const i = kinds.indexOf(kind);
      if(i < 0) return { ok:false, why:`no ${kind} on the card (${kinds.join("+")})`, kinds, text:ev.text };
      A.resolveMatch(d, ev, i);
      return { ok:true, kinds, text:ev.text, wife:A.domusOf(d).wife };
    };

    /* ---- 1: THE CARD COUNTS WHAT IS ON IT ---- */
    const two = (()=>{ const d = mk(0); const ev = A.matchEvent(d);
      return ev ? { n:((ev.data&&ev.data.cands)||[]).length, text:ev.text } : null; })();
    const three = (()=>{ const d = mk(70); const ev = A.matchEvent(d);
      return ev ? { n:((ev.data&&ev.data.cands)||[]).length, text:ev.text,
        kinds:((ev.data&&ev.data.cands)||[]).map(c=>c.kind) } : null; })();

    /* ---- 2: THE MERCHANT — her people's word at every block ---- */
    const price = (()=>{
      const bare = mk(0), kin = mk(0);
      const w = wed(kin, "merchant");
      /* the same dealings on both, so only the marriage differs */
      for(const d of [bare, kin]) A.dealings(d, "syrian");
      const before = A.slaverPrice(bare, "syrian"), after = A.slaverPrice(kin, "syrian");
      /* and a long-standing customer is not capped out of it */
      const deep = mk(0), deepKin = mk(0);
      wed(deepKin, "merchant");
      for(const d of [deep, deepKin]) for(let i=0;i<40;i++) A.dealt(d, "syrian", "bought");
      return { wed:w.ok, before:+before.toFixed(4), after:+after.toFixed(4),
        floorBare:+A.slaverPrice(deep,"syrian").toFixed(4), floorKin:+A.slaverPrice(deepKin,"syrian").toFixed(4),
        from:w.ok ? A.wifeFrom(kin) : null, word: w.ok ? A.wifeWord(kin) : null };
    })();
    /* and the card that already exists becomes her family's */
    const card = (()=>{
      const bare = mk(0), kin = mk(0); const w = wed(kin, "merchant");
      const a = A.EVENTS.bargain.make(bare), b = A.EVENTS.bargain.make(kin);
      return { wed:w.ok, bareTitle:a?a.title:null, kinTitle:b?b.title:null,
        kinFlag: b ? !!(b.data&&b.data.kin) : null, bareFlag: a ? !!(a.data&&a.data.kin) : null,
        kinBlockBare: !A.kinBlock(bare), kinBlockKin: !!A.kinBlock(kin) };
    })();

    /* ---- 3: THE MAGISTRATE — the office forgets its relations ---- */
    const law = (()=>{
      const bare = mk(0), kin = mk(0); const w = wed(kin, "magistrate");
      const seat = A.patronsOf(kin).filter(x=>x.kin).length;
      const seatBare = A.patronsOf(bare).filter(x=>x.kin).length;
      /* heat cools: same start, no breach, twenty quiet weeks */
      for(const d of [bare, kin]){ A.lawOf(d).heat = 80; d.pendingEvent = { id:"hold" }; }
      for(let i=0;i<20;i++){ A.lawWeek(bare); A.lawWeek(kin); }
      const coolBare = +A.lawOf(bare).heat.toFixed(2), coolKin = +A.lawOf(kin).heat.toFixed(2);
      /* and the eye comes less often: same heat, no breach, the question left open */
      let seenBare = 0, seenKin = 0;
      for(let t=0;t<400;t++){
        const b = mk(0), k = mk(0); wed(k, "magistrate");
        for(const d of [b,k]){ A.lawOf(d).heat = 100; d.pendingEvent = null; }
        A.lawWeek(b); A.lawWeek(k);
        if(b.pendingEvent && b.pendingEvent.id === "inspector") seenBare++;
        if(k.pendingEvent && k.pendingEvent.id === "inspector") seenKin++;
      }
      return { wed:w.ok, seat, seatBare, coolBare, coolKin, seenBare, seenKin,
        word: w.ok ? A.wifeWord(kin) : null };
    })();

    /* ---- 4: THE RIVAL — the folded feud is a hostage ---- */
    const feud = (()=>{
      const d = mk(70);
      const w = wed(d, "rival");
      if(!w.ok) return { wed:false, why:w.why, kinds:w.kinds };
      const nm = A.wifeKin(d), h = nm ? A.houseOf(d, nm) : null;
      const folded = { kin: !!(h && h.kin), grudge: h ? Math.round(h.grudge) : null, house:nm,
        word:A.wifeWord(d) };
      /* another house's man dying does nothing */
      const other = (d.rivals||[]).filter(x=>!x.retired && x.name !== nm)[0];
      const g = (d.gladiators||[])[0];
      A.meetRecord(d, g, { id:9001, name:"Somebody", house: other ? other.name : "Nowhere" },
        { fid:9001, house: other ? other.name : "Nowhere" }, true, true, false);
      const afterOther = { kin: !!(h && h.kin), grudge: h ? Math.round(h.grudge) : null };
      /* hers does */
      A.meetRecord(d, g, { id:9002, name:"Her cousin", house:nm }, { fid:9002, house:nm }, true, true, false);
      const afterHers = { kin: !!(h && h.kin), grudge: h ? Math.round(h.grudge) : null,
        flag: d.flags.kinBroken || null, word:A.wifeWord(d),
        said: (d.log||[]).slice(0,4).some(x=>/unfolds it/.test(x.text||"")) };
      /* and a merchant's wife does not carry a hostage at all */
      const m = mk(70); const mw = wed(m, "merchant");
      const mh = (m.rivals||[]).filter(x=>!x.retired)[0];
      if(mh) mh.kin = true;
      const mg = (m.gladiators||[])[0];
      A.meetRecord(m, mg, { id:9003, name:"Nobody's cousin", house: mh?mh.name:"X" },
        { fid:9003, house: mh?mh.name:"X" }, true, true, false);
      const merchantSafe = { wed:mw.ok, stillKin: !!(mh && mh.kin) };
      /* a win that is not a death does nothing either */
      const q = mk(70); const qw = wed(q, "rival"); const qn = A.wifeKin(q), qh = qn?A.houseOf(q,qn):null;
      const qg = (q.gladiators||[])[0];
      if(qw.ok) A.meetRecord(q, qg, { id:9004, name:"Her other cousin", house:qn }, { fid:9004, house:qn }, true, false, false);
      return { wed:true, folded, afterOther, afterHers, merchantSafe,
        aliveKept: qw.ok ? !!(qh && qh.kin) : null };
    })();

    /* ---- 5: AND THE NEMESIS PICKER SKIPS A KIN HOUSE, which is what makes it a peace ---- */
    const picker = (()=>{ const d = mk(90); const w = wed(d, "rival");
      if(!w.ok) return { wed:false };
      const nm = A.wifeKin(d), h = A.houseOf(d, nm);
      if(h) h.grudge = 95;
      const skipped = !!(h && h.kin);
      A.kinFeudBroken(d, nm);
      return { wed:true, skipped, unfoldedTo: h ? Math.round(h.grudge) : null, kinAfter: !!(h && h.kin) }; })();

    return { two, three, price, card, law, feud, picker,
      K:{ block:A.WIFE_BLOCK, law:A.WIFE_LAW, eye:A.WIFE_EYE, back:A.WIFE_KIN_BACK } };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };
  const { two, three, price, card, law, feud, picker, K } = out;

  /* 1 */
  lines.push(`the card: no feud in the bay → ${two?two.n:"no card"} families, says "${two?(/three families/.test(two.text)?"three":"two"):"—"}" · a house at grudge 70 → ${three?three.n:"—"} (${three?three.kinds.join("+"):"—"}), says "${three?(/three families/.test(three.text)?"three":"two"):"—"}"`);
  if(!two || two.n !== 2 || /three families/.test(two.text))
    bad.push(`the match card offered ${two?two.n:"no"} families and said "${two&&/three families/.test(two.text)?"three":"two"}" — measured 44 cards of 53 promising three over two, `
      + `and 41 of 41 to houses that actually married`);
  if(!three || three.n !== 3 || !/three families/.test(three.text))
    bad.push(`a house with a rival at grudge 70 was offered ${three?three.n:"no"} families (${three?three.kinds.join("+"):"—"}) — `
      + `the third family is the whole of #243's rival tie and \`nemCand\` wants 45 for a nemesis, so 30 is already the generous bar`);

  /* 2 */
  lines.push(`the merchant: block price ${price.before} → ${price.after} (WIFE_BLOCK ${K.block}) · at 40 men bought ${price.floorBare} → ${price.floorKin}, so the floor moved with it`);
  if(!price.wed) bad.push(`could not marry a merchant's daughter on a driven card`);
  else {
    if(!(price.after < price.before - 0.05))
      bad.push(`a merchant's daughter in the house moved the block price ${price.before} → ${price.after} — \`slaverPrice\` is not reading \`wifeFrom\`, `
        + `and the block is the busiest of the three hooks (a median of 5 men a run, p90 33)`);
    if(!(price.floorKin < price.floorBare - 0.001))
      bad.push(`a long-standing customer with her people behind him pays ${price.floorKin} against a stranger's ${price.floorBare} — `
        + `the clamp floor did not move with the discount, so the tie is capped away from exactly the player who has earned it`);
    if(!price.word || !/block/.test(price.word)) bad.push(`the domus sheet says nothing about her family: "${price.word}"`);
  }
  lines.push(`her family's call: bare card "${card.bareTitle}" (kin ${card.bareFlag}) · with her "${card.kinTitle}" (kin ${card.kinFlag})`);
  if(!card.kinFlag || card.bareFlag)
    bad.push(`\`bargain\` came as "${card.kinTitle}" with kin=${card.kinFlag} for a merchant's daughter and "${card.bareTitle}" kin=${card.bareFlag} without one — `
      + `the item's "yearly call on the block" is this card's branch, and it fires about twice a house`);
  if(!card.kinBlockBare || !card.kinBlockKin) bad.push(`\`kinBlock\` does not tell the two houses apart`);

  /* 3 */
  lines.push(`the magistrate: heat 80 over 20 quiet weeks → ${law.coolBare} bare, ${law.coolKin} with her (WIFE_LAW ${K.law}) · the eye at heat 100, 400 trials: ${law.seenBare} → ${law.seenKin} (WIFE_EYE ${K.eye}) · patrons who are family ${law.seatBare} → ${law.seat}`);
  if(!law.wed) bad.push(`could not marry a magistrate's niece on a driven card`);
  else {
    if(!(law.coolKin < law.coolBare - 1))
      bad.push(`heat fell to ${law.coolKin} with her uncle in the office against ${law.coolBare} without — \`lawWeek\`'s cool is not reading \`wifeFrom\``);
    if(!(law.seat >= 1 && law.seatBare === 0))
      bad.push(`a magistrate's niece seated ${law.seat} patron as family (a house without her: ${law.seatBare}) — \`resolveMatch\` should mark one, `
        + `and \`p.kin\` is already a field the box renders`);
    if(!(law.seenKin < law.seenBare))
      bad.push(`the aedile's man came ${law.seenKin} times in 400 for a house he is related to against ${law.seenBare} for a stranger — WIFE_EYE is not biting`);
  }

  /* 4 */
  if(!feud.wed) bad.push(`could not marry a rival's daughter even at grudge 70 (${feud.why||""}; card had ${feud.kinds?feud.kinds.join("+"):"—"})`);
  else {
    lines.push(`the rival: the wedding folds it — House ${feud.folded.house} kin ${feud.folded.kin}, grudge ${feud.folded.grudge}`);
    lines.push(`   another house's dead man: kin ${feud.afterOther.kin}, grudge ${feud.afterOther.grudge} · HERS: kin ${feud.afterHers.kin}, grudge ${feud.afterHers.grudge}, chronicled ${feud.afterHers.said}`);
    lines.push(`   a merchant's wife carries no hostage: the kin house is still kin ${feud.merchantSafe.stillKin} · and beating her cousin without killing him keeps it folded ${feud.aliveKept}`);
    if(!feud.folded.kin) bad.push(`the rival wedding did not set \`h.kin\` on House ${feud.folded.house} — \`weddingEndsFeud\` is the whole of the promise "folded up and put away"`);
    if(!feud.afterOther.kin || feud.afterOther.grudge !== feud.folded.grudge)
      bad.push(`putting ANOTHER house's man in the ground unfolded her family's feud (kin ${feud.afterOther.kin}, grudge ${feud.folded.grudge} → ${feud.afterOther.grudge})`);
    if(feud.afterHers.kin)
      bad.push(`her own cousin died on your sand and House ${feud.folded.house} is still family — the folded feud is meant to be a HOSTAGE, not a free peace`);
    if(!(feud.afterHers.grudge >= K.back))
      bad.push(`the feud came back at grudge ${feud.afterHers.grudge}, under the ${K.back} \`WIFE_KIN_BACK\` sets`);
    if(!feud.afterHers.said) bad.push(`the chronicle said nothing the week the folding came undone`);
    if(!feud.merchantSafe.stillKin)
      bad.push(`a merchant's daughter's house lost its \`kin\` mark when a man died — \`kinFeudBroken\` must read \`wife.from\` and \`wife.house\`, not just the flag`);
    if(feud.aliveKept === false)
      bad.push(`beating her cousin without killing him unfolded the feud — the hostage is a death, not a defeat`);
  }

  /* 5 */
  if(picker.wed){
    lines.push(`   and the picker: a kin house at grudge 95 is skipped ${picker.skipped} · unfolded it comes back at ${picker.unfoldedTo}, kin ${picker.kinAfter}`);
    if(!picker.skipped) bad.push(`a kin house was not marked, so \`nemCand\`'s \`!h.kin\` filter has nothing to skip`);
    if(picker.kinAfter) bad.push(`\`kinFeudBroken\` left \`h.kin\` standing — the house never returns to the nemesis picker`);
    if(!(picker.unfoldedTo >= 90)) bad.push(`a house at grudge 95 came back at ${picker.unfoldedTo} — \`kinFeudBroken\` should not LOWER a grudge`);
  }

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
