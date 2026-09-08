/* THE BRIBE HAD NEVER CHANGED AN OPPONENT — #205

   `GAMBITS.bribe` costs coin, twelve points of heat and fourteen of a rival's grudge, and its
   winning line promises *"for the next few months your men are matched softly"*. It sets
   `d.flags.editorBought`, which had **exactly one reader in the file** — and that reader was the
   `!pool.length` FALLBACK in `pickAnyOpp`, taken only when the circuit has nobody in the tier band.

   MEASURED (probes/editor.mjs, 8 houses x 300 weeks an arm): the circuit is empty in a tier band on
   **0 of 7,236 lookups**. Not rarely — never. The circuit holds sixteen men on a pyramid covering
   every band. So the one thing a bribe buys was bought never, while a player bribing every four
   weeks held the flag 5.67% of his weeks and got nothing at all for it.

   #205 said "the model is there, add the legitimate route". There was no model: five names used once
   to sign a booking line, and a dead flag. So this release makes the flag real first — a bought
   editor draws from a band one rung lower on the ORDINARY path — and then adds the honest
   counterpart, `PETITIONS`, which asks him for one thing about one card at the cost of favour.

   THE ASSERTION THIS EXISTS FOR: **a bought editor must actually soften the card.** It is asserted
   on the game's own picker over a real circuit, not on the flag's presence. */

import fs from "node:fs";
import path from "node:path";
import { found, tab, clearAll, forge, settle, click, waitSaved, ROOT } from "../harness.mjs";

export const name = "editor";
export const describe = "a bought editor matches you softly, and an honest word can do it too";

export async function run({ p, errors }){
  const fails = [], lines = [];
  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");

  /* ---- THE ONE CONTRACT THE GAME ASKS A PLAYER TO KEEP, NEVER ONCE ASSERTED ----
     `offerBooking`, `takeBooking` and `failBooking` were on no export, so nothing in this suite
     could drive a booking end to end and neither side of it had ever been checked. Measured over
     4,049 house-weeks before this: the reference player signs EVERY booking it is offered — the ask
     is a `pendingEvent` and this rope answers events with choice 0, which is "Sign for it" — and
     honoured 14 of 122, entirely by accident, because `housePick` sorts the bill by purse and a
     booking's balance is sometimes the biggest thing on it. The other 107 cost `advance x 2`, 22
     fame, 9 patron favour and 6 faction apiece: 2,273 denarii and 147 fame a house, sitting inside
     every figure this project has ever taken. With the rope's new `booking` lever on, 73 of 118.

     So both sides are asserted here: the day kept, and the day missed. */
  const bk = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["newGameState","offerBooking","takeBooking","failBooking","bookedFor","EDITORS",
                  "makeGames","activeG","deadlines","EDITOR_KEYS","editorOf","editorRec"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    /* a house famous enough to be asked, with a man famous enough to be wanted */
    const mk = () => { const d = A.newGameState("Book","clean","BOOK-1");
      d.fame = 400; d.gold = 6000;
      for(const g of A.activeG(d)){ g.pfame = 60; g.wins = 9; }
      return d; };
    let d = mk(), o = null;
    for(let i=0;i<400 && !o;i++){ d.week++; o = A.offerBooking(d); }
    if(!o) return { why:"no booking was offered in 400 tries on a famous house" };
    const gold0 = d.gold;
    A.takeBooking(d, o);
    const dl = (d.deadlines||[]).find(x=>x.kind==="booking");
    const signed = { advance:o.advance, paid:d.gold - gold0, editor:o.editor,
      onList:!!dl, carriesEditor:!!(dl && dl.editor), named:!!(dl && dl.gid === o.gid),
      /* EDITORS is a keyed table since #254 phase 1, and the booking is signed by the man whose
         festival it is rather than by a draw — so this checks BOTH that he is one of the five and
         that he is the right one of the five */
      knownEditor: (A.EDITOR_KEYS||[]).some(k=>A.editorOf(k).name === o.editor),
      ownsIt: !!(o.editorKey && A.editorOf(o.editorKey).owns === o.festKey),
      key:o.editorKey, festKey:o.festKey };
    /* the day kept: the booked bout is on the bill for the festival it names */
    const found = A.bookedFor(d, o.festKey);
    /* the day missed: what the default costs */
    const f = mk(); f.week = o.due; const g0 = f.gold, fa0 = f.fame;
    A.takeBooking(f, o);
    const adv = f.gold - g0;
    A.failBooking(f, (f.deadlines||[]).find(x=>x.kind==="booking"));
    return { signed, bookedForFound: !!found && found.festKey === o.festKey,
      broke:{ advance:adv, gold: f.gold - g0, fame: f.fame - fa0 } };
  });
  if(bk.why) fails.push(`the booking arm could not run: ${bk.why}`);
  else {
    lines.push(`a booking: ${bk.signed.editor} advances ${bk.signed.advance}d (box moved `
      + `${bk.signed.paid}) · on the deadline list ${bk.signed.onList} · it carries the editor `
      + `${bk.signed.carriesEditor} · and the man it names ${bk.signed.named} · `
      + `bookedFor finds it ${bk.bookedForFound}`);
    lines.push(`  missing the day: took ${bk.broke.advance}d and gave back ${-bk.broke.gold} net, `
      + `${-bk.broke.fame} fame`);
    if(!(bk.signed.advance > 0)) fails.push(`a booking advances nothing, so there is no contract to keep`);
    if(bk.signed.paid !== bk.signed.advance) fails.push(`signing paid ${bk.signed.paid} against an `
      + `advance of ${bk.signed.advance}`);
    if(!bk.signed.onList) fails.push(`a signed booking leaves no deadline, so nothing can come due`);
    if(!bk.signed.carriesEditor) fails.push(`the booking deadline does not carry its editor — the name `
      + `is the only thing a ledger could ever be keyed on, and #254 is about that ledger`);
    if(!bk.signed.knownEditor) fails.push(`the booking is signed by "${bk.signed.editor}", who is not `
      + `in EDITORS — the five names are the whole cast`);
    if(!bk.signed.ownsIt) fails.push(`${bk.signed.festKey} was signed by ${bk.signed.key || "nobody"}, `
      + `who does not own that day. #254 phase 1 makes the booking's editor the man whose festival it `
      + `is instead of a draw — if it is a draw again the table is decoration and the ledger cannot `
      + `mean anything, because the same man never comes back for the same reason`);
    if(!bk.signed.named) fails.push(`the deadline does not name the man the editor asked for by name`);
    if(!bk.bookedForFound) fails.push(`\`bookedFor\` cannot find the booking for its own festival key, `
      + `so \`makeGames\` will never put the bout on the bill and the day cannot be kept at all`);
    if(!(bk.broke.gold < 0)) fails.push(`missing the day left the box no worse off (${bk.broke.gold}) — `
      + `the advance is supposed to come back doubled`);
    if(bk.broke.gold !== -bk.signed.advance) fails.push(`missing the day cost ${-bk.broke.gold} net `
      + `against an advance of ${bk.signed.advance} — taking one and paying back two is a net of the `
      + `advance itself, and that arithmetic is what makes an unkept booking hurt`);
    if(!(bk.broke.fame < 0)) fails.push(`missing the day cost no fame, and the story going round `
      + `Capua ahead of you is the half of it that is not coin`);
  }

  /* ---- #254 phase 1: AND THE LEDGER IS WRITTEN BY THE GAME, NOT BY THIS CHECK ----
     `signed` and `broken` come off `takeBooking` and `failBooking` directly. `kept` is driven
     through the ROPE with `booking:true` rather than by calling `editorMark` here, because a record
     asserted against the helper that writes it is the "constant validated against itself" fault
     this suite has shipped before — the only honest proof that the honour site writes the ledger is
     a run in which a booking is honoured. */
  const led = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    if(!A.editorRec || !A.EDITOR_KEYS) return { why:"the handle is missing the editor ledger" };
    /* signed and broken, off the real functions */
    const d = A.newGameState("Led","clean","LED-1"); d.fame = 400; d.gold = 6000;
    for(const g of A.activeG(d)){ g.pfame = 60; g.wins = 9; }
    let o = null; for(let i=0;i<400 && !o;i++){ d.week++; o = A.offerBooking(d); }
    if(!o) return { why:"no booking offered" };
    A.takeBooking(d, o);
    const afterSign = A.editorRec(d, o.editorKey);
    A.failBooking(d, (d.deadlines||[]).find(x=>x.kind==="booking"));
    const afterFail = A.editorRec(d, o.editorKey);
    /* kept, through a real run that honours one */
    let kept = 0, paid = 0, ran = 0;
    for(let h=0; h<6 && !kept; h++){
      const e = A.newGameState("Kept","clean","LED-K"+h);
      for(let w=0; w<260 && !e.over; w++){ try { R.lanista(e, { booking:true }); } catch(x){ break; } ran++; }
      for(const k of Object.keys(e.editors||{})){ kept += (e.editors[k].kept||0); paid += (e.editors[k].paid||0); }
    }
    return { key:o.editorKey, afterSign, afterFail, kept, paid, ran,
      owns: A.editorOf(o.editorKey).owns, festKey:o.festKey,
      taste: A.editorOf(o.editorKey).taste,
      tastesReal: (A.EDITOR_KEYS||[]).every(k=>!!(A.APPETITES||{})[A.editorOf(k).taste]),
      ownsReal: (A.EDITOR_KEYS||[]).every(k=>(A.CALENDAR||[]).some(f=>f.key === A.editorOf(k).owns)),
      distinctOwners: new Set((A.EDITOR_KEYS||[]).map(k=>A.editorOf(k).owns)).size,
      n: (A.EDITOR_KEYS||[]).length };
  });
  if(led.why) fails.push(`the ledger arm could not run: ${led.why}`);
  else {
    lines.push(`the ledger: ${led.key} signed ${led.afterSign.signed} → broken ${led.afterFail.broken} `
      + `· over ${led.ran} roped weeks, ${led.kept} booking(s) kept and ${led.paid}d of balances recorded`);
    lines.push(`  the table: ${led.n} editors, ${led.distinctOwners} distinct festivals owned, `
      + `every taste a real APPETITE ${led.tastesReal}, every day a real CALENDAR key ${led.ownsReal}`);
    if(led.afterSign.signed !== 1) fails.push(`signing a booking did not write \`signed\` on its editor `
      + `(${led.afterSign.signed}) — the ledger #254 is about is not being kept`);
    if(led.afterFail.broken !== 1) fails.push(`breaking a booking did not write \`broken\` on its editor `
      + `(${led.afterFail.broken}) — the side of the record that costs you is the one that has to be there`);
    if(!(led.kept > 0)) fails.push(`no booking was kept in ${led.ran} roped weeks with the honouring `
      + `lever on, so the \`kept\` half of the ledger is written by nothing and is a dark field`);
    if(!(led.paid > 0)) fails.push(`balances paid recorded nothing across ${led.kept} kept booking(s)`);
    if(!led.tastesReal) fails.push(`an editor's taste is not an APPETITES key, so phase 2 has nothing to read`);
    if(!led.ownsReal) fails.push(`an editor owns a festival that is not in CALENDAR, so his day never comes`);
    if(led.distinctOwners !== led.n) fails.push(`${led.n} editors own ${led.distinctOwners} distinct `
      + `festivals — two men on one day means one of them is never the editor of anything`);
  }

  /* ---- #254 phase 2: AND THE RECORD IS READ, WHICH FOR ONE RELEASE IT WAS NOT ----
     Phase 1 shipped `d.editors` with exactly two readers in the program and both were the accessors
     that write it. A ledger nobody reads is a dark field. These arms are behavioural on purpose:
     they change the RECORD and assert the game's answer moves, rather than asserting that a term
     appears in a formula — a check that restates the rule it is checking proves nothing about
     whether the rule is wired in. */
  const rd = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["editorTrust","cardEditor","petitionOdds","offerBooking","EDITOR_PATIENCE"]
      .filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const mk = () => { const d = A.newGameState("P2","clean","P2-1"); d.fame = 400; d.gold = 6000;
      for(const g of A.activeG(d)){ g.pfame = 60; g.wins = 9; } return d; };
    const k0 = A.EDITOR_KEYS[0];
    const d0 = mk();
    const at = (kept, broken, signed) => { d0.editors = { [k0]:{ signed, kept, broken, paid:0, bought:0 } };
      return +A.editorTrust(d0, k0).toFixed(2); };
    const spread = { fresh:at(0,0,0), one:at(1,0,1), full:at(4,0,4), burned:at(0,4,4) };
    /* the advance, on ONE seed and ONE week, with only the record differing */
    const adv = {};
    for(const [lab, rec] of [["burned",{signed:6,kept:0,broken:6}],["fresh",{signed:0,kept:0,broken:0}],
                             ["trusted",{signed:8,kept:8,broken:0}]]){
      const d = mk(); let o = null;
      for(let i=0;i<400 && !o;i++){ d.week++;
        d.editors = {}; for(const ek of A.EDITOR_KEYS) d.editors[ek] = Object.assign({paid:0,bought:0}, rec);
        o = A.offerBooking(d); }
      adv[lab] = o ? { advance:o.advance, total:o.advance + o.balance, trust:o.trust } : null;
    }
    /* a word with him: one house, one card, four records */
    const dp = mk();
    for(let w=0; w<300 && !A.cardEditor(dp); w++){ try { R.lanista(dp); } catch(e){ break; } }
    const ck = A.cardEditor(dp);
    const pet = {};
    if(ck) for(const [lab, rec] of [["burned",{signed:6,kept:0,broken:6}],["fresh",{signed:0,kept:0,broken:0}],
                                    ["trusted",{signed:8,kept:8,broken:0}],["bought",{signed:0,kept:0,broken:0,bought:1}]]){
      dp.editors = { [ck]: Object.assign({paid:0,bought:0}, rec) };
      pet[lab] = +A.petitionOdds(dp, "purse").toFixed(3);
    }
    /* and NOT at Rome or in a town, where the card is nobody's */
    const away = mk(); away.games = { festival:"the imperial games", offers:[], week:away.week };
    const town = mk(); town.games = { festival:"a town card", offers:[], week:town.week, city:"nuceria" };
    return { spread, adv, pet, cardEd:ck, patience:A.EDITOR_PATIENCE,
      romeNull: A.cardEditor(away) === null, townNull: A.cardEditor(town) === null };
  });
  if(rd.why) fails.push(`the phase 2 arm could not run: ${rd.why}`);
  else {
    lines.push(`the standing (patience ${rd.patience}): fresh ${rd.spread.fresh} · one kept ${rd.spread.one} `
      + `· four kept ${rd.spread.full} · four broken ${rd.spread.burned}`);
    lines.push(`  the advance on one seed: burned ${rd.adv.burned && rd.adv.burned.advance} of `
      + `${rd.adv.burned && rd.adv.burned.total} · fresh ${rd.adv.fresh && rd.adv.fresh.advance} of `
      + `${rd.adv.fresh && rd.adv.fresh.total} · trusted ${rd.adv.trusted && rd.adv.trusted.advance} of `
      + `${rd.adv.trusted && rd.adv.trusted.total}`);
    lines.push(`  a word with ${rd.cardEd}: burned ${rd.pet.burned} · fresh ${rd.pet.fresh} `
      + `· bought ${rd.pet.bought} · trusted ${rd.pet.trusted}`);
    if(rd.spread.one >= 1) fails.push(`ONE kept booking makes a man who fully trusts you `
      + `(${rd.spread.one}) — EDITOR_PATIENCE is not holding the denominator, and a standing earned `
      + `in one week is not a standing`);
    if(!(rd.spread.burned < 0 && rd.spread.full > 0)) fails.push(`the standing does not run both ways `
      + `(four kept ${rd.spread.full}, four broken ${rd.spread.burned})`);
    if(!rd.adv.burned || !rd.adv.trusted) fails.push(`no booking was offered for one of the arms, so the `
      + `advance comparison measured nothing`);
    else {
      if(!(rd.adv.trusted.advance > rd.adv.fresh.advance && rd.adv.fresh.advance > rd.adv.burned.advance))
        fails.push(`the advance does not move with the record (burned ${rd.adv.burned.advance}, fresh `
          + `${rd.adv.fresh.advance}, trusted ${rd.adv.trusted.advance}) — phase 2's first limb is that a `
          + `man who trusts you puts more down in front, and if these are equal the ledger is unread`);
      if(!(rd.adv.trusted.total > rd.adv.burned.total))
        fails.push(`the purse is the same for a house he trusts and one that has let him down twice`);
    }
    if(!rd.cardEd) fails.push(`no card in 300 weeks was on a festival an editor owns, so the petition `
      + `arm measured nothing — 55.6% of card weeks were on one when this was measured`);
    else {
      if(!(rd.pet.trusted > rd.pet.fresh && rd.pet.fresh > rd.pet.burned))
        fails.push(`the odds of a word with the editor do not move with his record (burned `
          + `${rd.pet.burned}, fresh ${rd.pet.fresh}, trusted ${rd.pet.trusted}) — favour alone made `
          + `every editor the same man, which is what #254 is about`);
      if(!(rd.pet.bought > rd.pet.fresh && rd.pet.bought < rd.pet.trusted))
        fails.push(`buying his ear (${rd.pet.bought}) is not worth more than nothing (${rd.pet.fresh}) `
          + `and less than keeping your word (${rd.pet.trusted}). This is the FIRST live reader the `
          + `bribe has ever had — #205 measured its only other one firing on 0.00% of lookups — and a `
          + `bribe worth as much as a kept booking is the wrong game`);
    }
    if(!rd.romeNull) fails.push(`the imperial card has an editor. It carries no \`fest\`, and `
      + `\`editorFor\` falls back to the first key rather than drawing — so without the ownership `
      + `test a petition at Rome reads a Capuan's ledger`);
    if(!rd.townNull) fails.push(`a town's card has an editor — the five names put on Capua's festivals`);
  }

  /* ---- #254 phase 3: HIS TASTE IS ON HIS OWN CARD, AND IT WAS DARK FOR TWO RELEASES ----
     Phase 1 gave every editor a `taste` and phase 2 read his ledger and not that, so the field sat
     unread — the second dark field shipped inside this one item. The man putting the games on fills
     the tiers with the people who come to what he books, so his taste gets extra tickets in
     `appetiteOf`'s bag on his own festival. Asserted against a CONTROL — the same offer with its
     `fest` removed — so what comes back is the editor's pull and not the shape of the bag. */
  const vo = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["appetiteOf","APP_KEYS","APPETITES","editorWord","EDITOR_PULL","CALENDAR"]
      .filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const fests = (A.CALENDAR||[]).filter(f=>!f.rest).map(f=>f.key);
    const rows = [], control = {}; let cN = 0;
    for(const k of A.APP_KEYS) control[k] = 0;
    const dist = {}; for(const fk of fests){ dist[fk] = {}; for(const k of A.APP_KEYS) dist[fk][k] = 0; }
    for(let i=0;i<12000;i++){
      const fk = fests[i % fests.length];
      const o = { id:9000+i, venue:"forum", tier:1, festival:"f", purse:200+(i%97), opp:{name:"x"}, fest:fk };
      const got = A.appetiteOf(o); if(got) dist[fk][got]++;
      const o2 = Object.assign({}, o); delete o2.fest;
      const g2 = A.appetiteOf(o2); cN++; if(g2) control[g2]++;
    }
    const tot = x => Object.values(x).reduce((a,b)=>a+b,0);
    const cT = tot(control);
    for(const fk of fests){ const ek = A.editorFor(fk); const E = A.editorOf(ek);
      if(E.owns !== fk) continue;
      const t = tot(dist[fk]);
      rows.push({ fk, ek, taste:E.taste, mine: t ? dist[fk][E.taste]/t : 0,
        base: cT ? control[E.taste]/cT : 0 }); }
    /* #150 — the mood PRINTED and the mood JUDGED are the same call, so it must be stable */
    const o3 = { id:4242, venue:"forum", tier:1, festival:"f", purse:333, opp:{name:"x"}, fest:fests[0] };
    const stable = A.appetiteOf(o3) === A.appetiteOf(o3) && A.appetiteOf(o3) === A.appetiteOf({ ...o3 });
    /* the word, off the record */
    const d = A.newGameState("W","clean","W-1"); const k0 = A.EDITOR_KEYS[0];
    const word = rec => { d.editors = { [k0]: Object.assign({signed:0,kept:0,broken:0,paid:0,bought:0}, rec) };
      return A.editorWord(d, k0); };
    const words = { none:word({}), dealt:word({signed:2}), good:word({signed:3,kept:2}),
      loyal:word({signed:5,kept:5}), burned:word({signed:4,broken:4}), bought:word({bought:1}) };
    return { rows, stable, words, pull:A.EDITOR_PULL };
  });
  if(vo.why) fails.push(`the phase 3 arm could not run: ${vo.why}`);
  else {
    for(const r of vo.rows)
      lines.push(`  ${r.fk.padEnd(13)} ${r.ek} wants ${r.taste} → ${(r.mine*100).toFixed(1)}% of his `
        + `card's moods against ${(r.base*100).toFixed(1)}% baseline`);
    if(vo.rows.length !== 5) fails.push(`${vo.rows.length} festivals have an owner, not 5`);
    for(const r of vo.rows){
      if(!(r.mine > r.base * 1.2)) fails.push(`${r.ek} wants ${r.taste} and it is ${(r.mine*100).toFixed(1)}% `
        + `of his own card's moods against a baseline of ${(r.base*100).toFixed(1)}% — his taste is not `
        + `reaching \`appetiteOf\`, which makes it the dark field it was for two releases`);
      if(r.mine > 0.75) fails.push(`${r.ek}'s taste is ${(r.mine*100).toFixed(1)}% of his card's moods — `
        + `the tiers are a crowd he draws, not an instrument he plays, and a card whose mood is a `
        + `foregone conclusion is not a mood`);
    }
    if(!vo.stable) fails.push(`\`appetiteOf\` gave two answers for one offer — the panel PRINTS the mood `
      + `and \`appetiteAfter\` JUDGES it through this same call, so an unstable answer pays a house for `
      + `a demand it was never shown (#150's rule)`);
    const w = vo.words, uniq = new Set(Object.values(w));
    lines.push(`  his word: none "${w.none}" · dealt "${w.dealt}" · loyal "${w.loyal}" · burned "${w.burned}"`);
    if(uniq.size < 5) fails.push(`\`editorWord\` gives ${uniq.size} distinct phrases across six records — `
      + `a standing that reads the same whatever you have done is \`slaverWord\`'s shape without its point`);
    if(w.none === w.loyal || w.loyal === w.burned) fails.push(`the word does not tell a house he trusts `
      + `from one he has never met, or from one that has burned him`);
    if(/\d/.test(w.loyal + w.burned)) fails.push(`the word quotes a number — the ledger is the mechanism `
      + `and this is the sentence; \`slaverWord\` says "has your measure", not a percentage`);
  }

  const readers = [...src.matchAll(/editorBought\(d\)/g)].length;
  lines.push(`editorBought has ${readers} reader(s) in the file`);
  if(/if\(!pool\.length\) return \{ opp: genOpponent\(editorBought\(d\)/.test(src))
    fails.push("editorBought is back on the FALLBACK branch only — measured, that branch is taken on 0 of 7,236 lookups, so the bribe would buy nothing again");

  /* ---- THE BRIBE, ON THE GAME'S OWN PICKER ---- */
  const soft = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const avg = f => A.STATS.reduce((s,k)=>s+(f[k]||0),0)/6;
    const run = (bought) => {
      const d = A.newGameState("Ed","clean","ED-1",null);
      d.flags.editorBought = bought ? d.week + 12 : 0;
      const out = [];
      for(let i=0;i<600;i++){ const r = A.pickAnyOpp(d, 2); if(r && r.opp) out.push(avg(r.opp)); }
      return out;
    };
    const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
    const plain = run(false), bribed = run(true);
    return { plain:+mean(plain).toFixed(2), bribed:+mean(bribed).toFixed(2), n:plain.length };
  });
  lines.push(`a tier-2 opponent over ${soft.n} draws: ordinary ${soft.plain} · with the editor bought ${soft.bribed}`);
  if(!(soft.bribed < soft.plain))
    fails.push(`buying the editor drew an opponent averaging ${soft.bribed} against the ordinary ${soft.plain} — the bribe's own line promises your men are matched softly, and it is not happening`);

  /* and the fallback branch must still exist for the case it was written for */
  const fell = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Ed","clean","ED-2",null);
    d.circuit = [];                                  /* nobody at all, which is what the branch is for */
    const r = A.pickAnyOpp(d, 2);
    return !!(r && r.opp);
  });
  if(!fell) fails.push("with an empty circuit the picker returns nobody — the fallback it was written for is gone");

  /* ---- THE PETITIONS ---- */
  const pet = await p.evaluate(()=>{
    const A = window.__LVDVS;
    /* ---- A FIXTURE THAT RE-CREATES THE HOUSE RE-SEEDS THE RNG ----
       `newGameState` seeds the generator from its seed string, so rebuilding the house from one seed
       makes every iteration identical: four hundred tries were ONE try repeated four hundred times,
       and every entry read as "never granted — unreachable writing" against a table that grants
       freely. The seed varies per call, which is the only thing that makes a loop a sample. */
    let nth = 0;
    const mk = (patrons) => {
      const d = A.newGameState("Ed","clean","ED-3-" + (nth++),null);
      d.week = 60; d.fame = 400; d.favor = 70;
      if(!patrons) d.patrons = [];
      while(A.activeG(d).length < 2) d.gladiators.push(A.genGladiator(d, 60));
      d.flags.petitionWeek = 0;
      return d;
    };
    const offer = () => ({ id:1, tier:2, purse:600, stakes:"standard", venue:"forum",
      opp:{ name:"Foe", str:70, agi:70, end:70, tec:70, sho:70, dis:70, cls:"Murmillo", wins:5 } });
    const sine = () => Object.assign(offer(), { stakes:"sine" });
    const out = {};
    for(const k of A.PET_KEYS){
      const d = mk(true), o = k === "mercy" ? sine() : offer();
      d.games = { offers:[o], week:d.week, festival:"the games" };
      out[k] = { why: A.petitionWhy(d, k, o), odds:+A.petitionOdds(d, k).toFixed(3) };
    }
    /* every one of them driven to a yes and to a no */
    const drive = (k, want) => {
      for(let i=0;i<400;i++){
        const d = mk(true), o = k === "mercy" ? sine() : offer();
        d.games = { offers:[o], week:d.week, festival:"the games" };
        d.flags.petitionWeek = 0;
        const before = { purse:o.purse, opp:o.opp.name, stakes:o.stakes, fav:d.favor };
        const r = A.runPetition(d, k, 1);
        if(r && r.won === want) return { r, before, after:{ purse:o.purse, opp:o.opp.name, stakes:o.stakes, fav:d.favor } };
      }
      return null;
    };
    for(const k of A.PET_KEYS){ out[k].yes = drive(k, true); out[k].no = drive(k, false); }
    /* the two gates: no patrons, and the cooldown */
    const bare = mk(false); const bo = offer();
    bare.games = { offers:[bo], week:bare.week, festival:"the games" };
    out.__bare = A.petitionWhy(bare, "purse", bo);
    const cd = mk(true); const co = offer();
    cd.games = { offers:[co], week:cd.week, festival:"the games" };
    A.runPetition(cd, "purse", 1);
    out.__cool = A.petitionWhy(cd, "purse", co);
    out.__second = !!A.runPetition(cd, "soften", 1);
    return out;
  });
  for(const k of ["soften","purse","mercy"]){
    const r = pet[k];
    if(!r){ fails.push(`PETITIONS has no "${k}" entry`); continue; }
    lines.push(`  ${k}: about ${Math.round(r.odds*100)} in a hundred · ${r.why ? `dark ("${r.why.slice(0,40)}")` : "open"}`);
    if(r.why) fails.push(`"${k}" is dark on a house built to make it: ${r.why}`);
    if(!r.yes) fails.push(`"${k}" was never granted in 400 tries — unreachable writing`);
    if(!r.no) fails.push(`"${k}" was never refused in 400 tries — a request nobody can decline is not a request`);
    if(r.yes){
      const b = r.yes.before, a = r.yes.after;
      lines.push(`     granted → purse ${b.purse}→${a.purse} · opponent ${b.opp}→${a.opp} · stakes ${b.stakes}→${a.stakes} · favour ${b.fav}→${a.fav}`);
      if(k === "purse" && !(a.purse > b.purse)) fails.push("a granted purse request did not raise the purse");
      if(k === "mercy" && a.stakes !== "standard") fails.push("a granted appeal request left the card sine missione");
      if(k === "soften" && a.opp === b.opp) fails.push("a granted request for an easier man left the same man on the bill");
      if(!(a.fav < b.fav)) fails.push(`"${k}" cost no favour at all when it was granted`);
    }
    if(r.no && !(r.no.after.fav < r.no.before.fav))
      fails.push(`"${k}" cost nothing when it was refused — the asking was done in public`);
  }
  lines.push(`a house with no patrons: "${pet.__bare}" · after one request: "${pet.__cool}" · a second the same month ${pet.__second}`);
  if(!pet.__bare || !/nobody behind you/i.test(pet.__bare))
    fails.push("a house with no patrons is not told that is why it cannot ask");
  if(!pet.__cool || !/weeks/i.test(pet.__cool)) fails.push("the cooldown does not name itself");
  if(pet.__second) fails.push("a second request landed in the same month");

  /* ================= THE REAL OFFER PANEL ================= */
  await found(p, { seed:"ED-S" });
  await clearAll(p, 8);
  await forge(p, (A) => {
    const d = A.newGameState("Ed","clean","ED-S",null);
    d.gold = 20000; d.fame = 500; d.week = 70; d.flags.petitionWeek = 0;
    while(A.activeG(d).length < 2) d.gladiators.push(A.genGladiator(d, 64));
    A.activeG(d).forEach(g=>{ g.injury = null; g.fatigue = 3; g.lastFought = 0; });
    let guard = 0;
    while(guard++ < 60){ A.makeGames(d); if(d.games && (d.games.offers||[]).length) break; d.week++; }
    return d;
  });
  await clearAll(p, 8);
  await tab(p, "arena"); await p.waitForTimeout(340); await clearAll(p, 6);
  await tab(p, "arena"); await p.waitForTimeout(340); await settle(p);
  const top = `(()=>{ const ws=[...document.querySelectorAll(".modalwrap")]
    .map(w=>({z:+getComputedStyle(w).zIndex||50,w})).sort((a,b)=>b.z-a.z); return ws[0] && ws[0].w; })()`;
  if(!(await click(p, /choose a bout/i))) return { pass:false, why:"the arena would not open the wizard", lines };
  await p.waitForTimeout(700);
  await p.evaluate(`(()=>{ const w = ${top}; if(!w) return;
    const rows=[...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled);
    const o = rows.find(x=>!/the pits/i.test(x.innerText||"")) || rows[0]; if(o) o.click(); })()`);
  await p.waitForTimeout(650);
  await p.evaluate(`(()=>{ const w = ${top}; if(!w) return;
    const rows=[...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled); if(rows.length) rows[0].click(); })()`);
  await p.waitForTimeout(450);
  await p.evaluate(`(()=>{ const w = ${top}; if(!w) return;
    const b=[...w.querySelectorAll("button")].find(x=>/next/i.test(x.innerText||"") && !x.disabled); if(b) b.click(); })()`);
  await p.waitForTimeout(750);
  const panel = await p.evaluate(`(()=>{ const w = ${top};
    const t = ((w ? w.innerText : document.body.innerText) || "").toUpperCase();
    return { there: t.indexOf("A WORD WITH THE EDITOR") >= 0, odds: t.indexOf("IN A HUNDRED HE HEARS YOU") >= 0,
             cost: t.indexOf("FAVOUR") >= 0 }; })()`);
  lines.push(`on the ready panel: the editor's row ${panel.there} · its odds ${panel.odds} · what it costs ${panel.cost}`);
  if(!panel.there) fails.push("there is no way to put anything to the editor on the offer panel — the legitimate route is not reachable");
  if(!panel.odds) fails.push("the panel quotes no odds, and the gambit rows it sits beside all do");
  if(!panel.cost) fails.push("the panel does not say what the asking costs");

  await waitSaved(p);
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
