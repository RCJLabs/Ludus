/* THE READ IS THE ROLL, AND IT COMES WITH THE NUMBER

   Audit item #231: "The wager asks for exact coin against a read given in words. The pre-fight card
   offers 50d / 150d / 400d stakes beside a judgement like 'would be second best' or 'even, near
   enough' — a bet priced in denarii against odds priced in prose, on the same panel where the
   engine holds a real number. Recommend the doctore's read price the wager the way the missio line
   already prices mercy: the same figure the roll uses, shown before coin goes down."

   THREE OF ITS FOUR LIMBS WERE ALREADY ANSWERED IN THE SOURCE. `stakesFor(d)` scales the stakes off
   the purse and STAKES_MIN is a FLOOR, so 50/150/400 is what a broke house sees. The wager row
   prints `oddsWord(oddsFor(S, betChance(...)))` — a real number, from the same probability
   `makeBet` places the bet on. And the read is not beside the stakes at all: the word is drawn at
   arena step 1, the stake chips at step 2.

   THE LIMB THE ITEM DID NOT NAME IS THE ONE THAT MATTERED. `readMatch` banded `rateMan` — "power()
   without a bout around it": six stats on fixed weights, an injury penalty, a flat 1.12/0.9 for a
   counter. The sand rolls `winChance`, which has morale, fatigue, footing, kit, showmanship,
   regard, the real 1.045 counter, the tactic, FOE_EDGE and an odds-scale sharpening fitted to
   measured outcomes. Two functions, and the map between them is steep, so a band four points wide
   on the rating was forty-five points wide on the roll. Measured (`probes/read.mjs`, 8 houses over
   676 weeks, 37,217 pairings) — the median win chance under each word, before:

     would be favoured 87.7% · has a little the better of it 56.2% · even, near enough 31.0%
     would be second best 10.7% · is overmatched 2.5%

   The whole scale sat about one band low. "Even, near enough" was a bout the sand loses two times
   in three, and 429 of 526 of them on the card fell outside 42–58. And the word is not decoration:
   `matchAgainst` sorts on it and the foe's file prints its top five under "Against your house" —
   on 1,009 of 5,382 foes (18.7%) that list named a man who was NOT the best man by the roll, a
   median 4.6 points of win chance thrown away and up to 57.9.

   After: 0 of 37,217 readings point the other way from the roll, "even, near enough" runs 46 to 54,
   and the watched list names the best man on 5,382 of 5,382.

   FIVE ARMS:
   1 · THE WORD IS THE ROLL'S OWN BAND, and never points the other way from it.
   2 · AND THE FIGURE BESIDE IT IS THE ROLL'S OWN NUMBER — the #150 rule, on the box a player reads
       before coin goes down.
   3 · THE CUTS ARE SYMMETRIC ABOUT EVEN. A scale that drifts is a scale that flatters, and the one
       this replaced flattered by a whole band.
   4 · "AGAINST YOUR HOUSE" NAMES THE BEST MAN once the man has been watched — AND THE BLIND ORDER
       STILL GIVES NOTHING AWAY. `rateMan(foe)` is one number across your whole yard, so the blind
       order depends on your men and his class alone; move the foe's stats and it must not stir.
   5 · EVERY PANEL PRINTS THE READING THROUGH ONE COMPONENT, so none of them can print the word
       without the figure — and the sine warning, which is owed free, still has a figure to quote
       with nobody watched. */
import fs from "node:fs";
import path from "node:path";
import { found, clearAll, installRope, ROOT } from "../harness.mjs";

export const name = "read";
export const describe = "the doctore's read is banded on the roll, and shows the figure it banded";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"READ-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","readMatch","matchAgainst","READ_CUT","readBand","winChance",
                  "rateMan","styleOf","activeG","canFight","scoutLive"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const bad = [];

    /* ---- 3. the cuts, before anything is played ---- */
    const cuts = A.READ_CUT.map(b=>b[0]).filter(v=>v > 0);
    const above = cuts.filter(v=>v > 0.5).map(v=>+(v-0.5).toFixed(6)).sort((a,b)=>a-b);
    const below = cuts.filter(v=>v < 0.5).map(v=>+(0.5-v).toFixed(6)).sort((a,b)=>a-b);
    if(above.length !== below.length || above.some((v,i)=>v !== below[i]))
      bad.push(`the word-bands are not symmetric about even — ${above.join(",")} above 0.5 against `
        + `${below.join(",")} below, so the same margin reads better one way round than the other`);
    if(A.READ_CUT.length < 4)
      bad.push(`only ${A.READ_CUT.length} words for the whole range of match-ups`);
    /* and every cut must name a distinct word, or a band covers nothing */
    const words = A.READ_CUT.map(b=>b[1]);
    if(new Set(words).size !== words.length) bad.push(`two bands share a word: ${words.join(" · ")}`);

    /* ---- the sweep every behavioural arm reads ---- */
    const seen = [], blind = [];
    const sorts = { paid:0, paidBad:0, worst:0, blindMoved:0, blindTried:0 };
    let sine = { cards:0, quoted:0 };
    let weeks = 0;

    for(let h = 0; h < 4; h++){
      const d = A.newGameState(`READ-C${h}`, "clean", `READ-C${h}`);
      for(let w = 0; w < 45 && !d.over; w++){
        weeks++;
        const mine = A.activeG(d).filter(g=>A.canFight(g));
        const offers = (d.games && d.games.offers) || [];
        const foes = offers.filter(o=>o && o.opp).map(o=>o.opp);
        for(const H2 of (d.rivals||[]).slice(0, 2))
          for(const f of (H2.fighters||[]).slice(0, 2)) foes.push(f);

        /* 5b — the sine warning is owed free: a reading nobody has paid for must still carry the
           roll, or the chooser is back to "he loses about NaN in a hundred" */
        for(const o of offers){
          if(o.stakes !== "sine" || !o.opp || !mine.length) continue;
          sine.cards++;
          const rd = A.readMatch(mine[0], o.opp, false);
          if(rd && rd.chance != null && Number.isFinite(rd.chance)) sine.quoted++;
          else bad.push(`a sine card carries no figure for the warning that quotes one `
            + `(readMatch chance ${rd ? rd.chance : "no read"} with nobody watched)`);
        }

        for(const foe of foes){
          const rows = [];
          for(const g of mine){
            const told = A.readMatch(g, foe, true), fog = A.readMatch(g, foe, false);
            if(!told || !fog) continue;
            const wc = A.winChance(g, foe, 0, A.styleOf(g));
            if(!Number.isFinite(wc)) continue;
            seen.push({ id:g.id, word:told.word, pc:told.pc, chance:told.chance, wc });
            blind.push({ word:fog.word, pc:fog.pc, chance:fog.chance });
            rows.push({ id:g.id, wc });
          }
          if(rows.length < 2) continue;

          /* ---- 4a. watched: the list must be headed by the best man on the roll ---- */
          const keep = foe.seen;
          foe.seen = d.week;
          const paid = A.matchAgainst(d, foe);
          if(paid.length === rows.length){
            sorts.paid++;
            const best = Math.max(...rows.map(x=>x.wc));
            const got = (rows.find(x=>x.id === paid[0].g.id) || {}).wc;
            if(!(got >= best - 1e-9)){ sorts.paidBad++; sorts.worst = Math.max(sorts.worst, best - got); }
          }
          /* ---- 4b. blind: move the man behind the fog and the order must not stir ---- */
          delete foe.seen;
          const b1 = A.matchAgainst(d, foe).map(m=>m.g.id).join(",");
          const was = {}; for(const k of A.STATS) was[k] = foe[k];
          for(const k of A.STATS) foe[k] = Math.max(5, Math.min(99, (foe[k]||40) + 17));
          const b2 = A.matchAgainst(d, foe).map(m=>m.g.id).join(",");
          for(const k of A.STATS) foe[k] = was[k];
          sorts.blindTried++;
          if(b1 !== b2) sorts.blindMoved++;
          if(keep == null) delete foe.seen; else foe.seen = keep;
        }
        try { R.lanista(d, {}); } catch(e){ break; }
      }
    }

    /* ---- 1. the word is the roll's own band, and points the right way ---- */
    const up = new Set(["would be favoured","has a little the better of it"]);
    const dn = new Set(["would be second best","is overmatched"]);
    const misband = seen.filter(x => x.word !== A.readBand(x.wc)[1]);
    const wrongWay = seen.filter(x => (up.has(x.word) && x.wc < 0.5) || (dn.has(x.word) && x.wc > 0.5));
    const evenOff = seen.filter(x => x.word === "even, near enough" && (x.wc < 0.42 || x.wc > 0.58));

    /* ---- 2. and the figure beside it is the roll's own number ---- */
    const offBox = seen.filter(x => x.pc !== Math.round(x.wc*100));
    const noBox  = seen.filter(x => x.pc == null);
    /* ---- 5a. the fog: no figure until it is paid for ---- */
    const leaked = blind.filter(x => x.pc != null);
    const fogWords = new Set(["has the shape for him","gives him the match-up","no read"]);
    const fogOff = blind.filter(x => !fogWords.has(x.word));

    /* vacuity: a sweep that read nothing, or read one word, proves nothing */
    if(seen.length < 400) bad.push(`only ${seen.length} readings taken — the sweep measured nothing`);
    if(new Set(seen.map(x=>x.word)).size < 3)
      bad.push(`the whole sweep produced ${new Set(seen.map(x=>x.word)).size} distinct word(s) — `
        + `every pairing landed in one band, so the scale was never exercised`);
    if(!sorts.paid) bad.push(`no watched list was long enough to rank — arm 4 measured nothing`);
    if(!sine.cards) bad.push(`no sine card came up in the sweep — the free-figure arm measured nothing`);

    if(misband.length) bad.push(`${misband.length} of ${seen.length} readings carry a word that is `
      + `not the band of the roll: "${misband[0].word}" on a bout the sand rolls at `
      + `${Math.round(misband[0].wc*100)} in a hundred, where the bands say `
      + `"${A.readBand(misband[0].wc)[1]}"`);
    if(wrongWay.length) bad.push(`${wrongWay.length} of ${seen.length} readings point the other way `
      + `from the roll — "${wrongWay[0].word}" at ${Math.round(wrongWay[0].wc*100)} in a hundred`);
    if(evenOff.length) bad.push(`${evenOff.length} readings call a bout "even, near enough" that the `
      + `sand rolls at ${Math.round(evenOff[0].wc*100)} in a hundred`);
    if(offBox.length) bad.push(`${offBox.length} of ${seen.length} readings print a figure that is not `
      + `the roll's own — the panel says ${offBox[0].pc} in a hundred where the sand rolls `
      + `${Math.round(offBox[0].wc*100)} (#150)`);
    if(noBox.length) bad.push(`${noBox.length} of ${seen.length} paid readings carry no figure at all, `
      + `which is the item: a judgement in words with the number withheld`);
    if(leaked.length) bad.push(`${leaked.length} of ${blind.length} readings hand over a figure for a `
      + `man nobody has paid to have watched`);
    if(fogOff.length) bad.push(`a man nobody has watched reads "${fogOff[0].word}" — the scouting is `
      + `sold on the reading being withheld until it is bought`);
    if(sorts.paidBad) bad.push(`"Against your house" heads its list with a man who is not the best by `
      + `the roll on ${sorts.paidBad} of ${sorts.paid} watched foes, the worst by `
      + `${Math.round(sorts.worst*100)} points of win chance`);
    if(sorts.blindMoved) bad.push(`the BLIND order moved on ${sorts.blindMoved} of ${sorts.blindTried} `
      + `foes when the man's stats changed behind the fog — the list is handing over the reading `
      + `the scouting is sold for`);

    return { bad, weeks, seen:seen.length, blind:blind.length, cuts:A.READ_CUT.map(b=>b[0]),
      words, misband:misband.length, wrongWay:wrongWay.length, evenOff:evenOff.length,
      offBox:offBox.length, noBox:noBox.length, leaked:leaked.length, fogOff:fogOff.length,
      sorts, sine,
      spread: A.READ_CUT.map(b=>{ const v = seen.filter(x=>x.word===b[1]).map(x=>x.wc);
        return { w:b[1], n:v.length,
          lo:v.length?Math.round(Math.min(...v)*1000)/10:null,
          hi:v.length?Math.round(Math.max(...v)*1000)/10:null }; }) };
  });

  if(r.miss) return { pass:false, why:`handle is missing ${r.miss.join(", ")}`, lines:[] };
  bad.push(...r.bad);

  /* ---- 5c. one component, so no panel can print the word without the figure ---- */
  const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");
  const srcLines = src.split("\n");
  /* ReadVal's own body is the one place the word is drawn from, so it is not a stray — but bound
     the exemption to the function rather than to the string, or moving the word out of the
     component and leaving the old span behind would read as compliance */
  const at = srcLines.findIndex(l => /^function ReadVal\(/.test(l));
  let end = at;
  if(at >= 0) while(++end < srcLines.length && srcLines[end] !== "}"){}
  const stray = [];
  srcLines.forEach((l, i) => {
    if(at >= 0 && i >= at && i <= end) return;
    if(/^\s*(\/\*|\*|\/\/)/.test(l)) return;
    if(/\{\s*(read|m|rd)\.word\s*\}/.test(l)) stray.push(i + 1);
  });
  if(stray.length) bad.push(`a panel prints the reading's word straight at src/ludus.jsx:`
    + `${stray.join(", ")} instead of through <ReadVal/>, which is how a word gets printed `
    + `without the figure that made it`);
  if(at < 0) bad.push(`<ReadVal/> is gone — nothing holds the word and the `
    + `figure together any more`);
  const uses = (src.match(/<ReadVal\s/g) || []).length;
  if(uses < 4) bad.push(`only ${uses} panel(s) render <ReadVal/>; the reading is drawn in five places`);

  lines.push(`${r.weeks} weeks · ${r.seen} paid readings, ${r.blind} behind the fog`
    + ` · the cuts are ${r.cuts.filter(v=>v>0).join(" / ")}, symmetric about even`);
  for(const s of r.spread)
    lines.push(`   ${s.w.padEnd(30)} ${String(s.n).padStart(5)} readings`
      + (s.n ? ` · the roll runs ${s.lo} to ${s.hi} in a hundred` : ""));
  lines.push(`the word is the roll's band on ${r.seen - r.misband} of ${r.seen}`
    + ` · ${r.wrongWay} point the other way · ${r.evenOff} call a lopsided bout even`);
  lines.push(`the figure is the roll's own on ${r.seen - r.offBox} of ${r.seen}`
    + ` · ${r.noBox} paid readings show no figure · ${r.leaked} of ${r.blind} leak one`);
  lines.push(`"Against your house": ${r.sorts.paid - r.sorts.paidBad} of ${r.sorts.paid} watched lists `
    + `head with the best man by the roll · the blind order stirred on ${r.sorts.blindMoved} of `
    + `${r.sorts.blindTried} when the man behind the fog changed`);
  lines.push(`${r.sine.quoted} of ${r.sine.cards} sine cards carry a figure for the warning that is owed free`
    + ` · ${uses} panels draw the reading through <ReadVal/>`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
