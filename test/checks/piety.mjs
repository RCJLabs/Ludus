/* ONE LADDER FOR THE WORD AND THE EFFECT — #267

   (`piety` was free in `test/checks/`; checked before writing. `test/probes/piety.mjs` is this
   item's instrument and shares the name on the usual convention.)

   ---- WHAT THE ITEM CLAIMED, AND WHAT THE MEASUREMENT SAID ----
   #267 said the temple is "a switch that does nothing, or a second brake on the rising as strong
   as the rite", on one unconfirmed single-set reading in v3.252.0 that put `rites` alone at 6.4%
   rebellion-weeks against a reference 12.0%. Run the way `bury` was — `probes/piety.mjs`, 16
   houses x 420 weeks on the eight paired `PYRE` sets:

     rebellion-weeks   ref 8.1% (5.5-10.9)  ->  rites 8.4% (6.5-9.8)
                       paired: -0.5 +1.1 -0.3 +1.2 +3.0 +4.4 -4.5 -1.7   FOUR of eight lower

   **REFUTED.** Mean +0.35 the wrong way, and the spread swamps it. v3.252.0's reading was a fluke
   of one seed set, exactly the shape `court` had before its second set. The temple is not a brake
   on the rising and no release should be built as though it were.

   What `rites` does buy, on the same eight pairs:

     blessed weeks     ref 0.8-2.1% (mean 1.1)  ->  36.3-43.0% (mean 40.8)   8/8
     hurt man-weeks    1.8%  ->  1.0%   6/8 lower, mean -0.77
     died per 100      76.7  ->  75.0   6/8 lower, mean -1.69, spread +6.9 to -8.3
     gold p50          1058  ->  617          fame p50   3158  ->  2336

   So praying is a real, paid, modest brake on the WOUND ledger and a net drain on coin and
   standing. The wound and death effects are directional and not solid enough to bar at a check
   frame — they are reported here and not asserted, on `young`'s precedent.

   The item's other premise also fails: "There is no third state: the temple is furniture or it is
   permanent." 40.8% IS the third state. A house praying as hard as it can afford reaches two weeks
   in five; the 62-68% the item quotes came from a longer-lived thrift arm, i.e. a richer house.
   Uptake is priced, and the price is what sets it.

   ---- SO WHAT THIS FILE HOLDS IS THE FAULT THE MEASUREMENT WALKED INTO ----
   The words changed at 18 / 38 / 60 / 80. The two things piety actually DOES fired at 65 and 20.
   Six copies of one threshold across `templeWeek`, `agendaGods`, `SECT_MARK`, `SECT_LIVE`, the
   bar's fill (`< 20`, not `<= 20`) and the section's `open`, and the word's own boundary was the
   odd one out. A house at 62 read "pious", went gold-hi, and bought nothing; a house at 19 read
   "lax", came off the red, and was still bleeding half a point of unrest a week.

   SIX ARMS.
     1 · ONE LADDER — every edge in the effect, the nag, the mark and the hue is an edge in the word.
     1b· AND BETWEEN THE INTEGERS — piety is fractional, so the one behavioural difference this
         release makes (a house in 20 < p < 21 is godless now, where the bare `<= 20` let it out) is
         pinned at thirteen points rather than left to drift back.
     2 · THE WEEK PAYS WHAT THE TIER SAYS — differenced off `templeWeek`, against the tier of the
         piety the week ENDS at, because the drift lands before the tier is read.
     3 · THE PANEL NAMES THE TERMS, AND ITS OMEN FIGURE IS THE ROLL — #150's rule, measured against
         `EVENTS.omen.make` over thousands of draws rather than read off the source.
     4 · THE SECOND DOOR — the fair reading blesses a house, and it does not ask the altar's leave.
     5 · AND IT IS ON THE SCREEN. */
import { hasHandle, found, clearAll, tab, settle } from "../harness.mjs";

export const name = "piety";
export const describe = "the word on the bar and the number behind it are one ladder, and the panel says what the band is worth";

const OMEN_DRAWS = 7000;      /* ~14% survive the cluster gate, so ~1,000 rolls an arm */
const OMEN_TOL = 6;           /* points; sigma at 1,000 rolls is ~1.6 */

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(([DRAWS])=>{
    const A = window.__LVDVS, R = {};
    const miss = ["PIETY_TIERS","pietyRank","pietyWord","pietyTier","pietySays","omenIll",
      "templeWeek","agendaGods","SECT_MARK","SECT_LIVE","EVENTS","newGameState","pietyOf"]
      .filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

    const house = (seed, piety)=>{
      const d = A.newGameState("Pi","clean",seed,null);
      d.gold = 20000; d.fame = 400; d.unrest = 30; d.week = 40; d.piety = piety;
      d.patrons = [{ id:1, name:"Magistrate", rank:"magistrate", favor:50, want:null,
        since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      for(let i=0;i<3;i++){ const m = A.genGladiator(d, 70); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.fatigue=0; m.lastFought=-9; d.gladiators.push(m); }
      return d;
    };

    /* ---- 1. the ladder, every point of it ---- */
    { const d = house("PI_LADDER", 30), row = [];
      for(let pi=0; pi<=100; pi++){
        d.piety = pi; d.blessing = null; d.lastOffering = null; d.flags.illOmen = 0;
        const T = A.PIETY_TIERS[A.pietyRank(pi)];
        const said = [];
        try { A.agendaGods(d, (urg, go, label, sub)=>said.push({ urg, label:String(label||"") })); }
        catch(e){ said.push({ urg:-1, label:"THREW: " + e.message }); }
        const nag = said.filter(x=>/keeping no rites/i.test(x.label));
        let mark = null;
        try { const m = A.SECT_MARK.temple(d); mark = m === true ? "dot" : m ? "urg" + m.urg : "none"; }
        catch(e){ mark = "THREW"; }
        let live = null;
        try { live = !!A.SECT_LIVE.temple(d); } catch(e){ live = "THREW"; }
        row.push({ pi, word:A.pietyWord(pi), rank:A.pietyRank(pi), hue:T.hue,
          warmth:T.warmth, unrest:T.unrest,
          nag: nag.length ? "urg" + nag[0].urg : "silent", mark, live:String(live) });
      }
      const edges = key => row.filter((r,i)=>i>0 && r[key] !== row[i-1][key]).map(r=>r.pi);
      R.ladder = { rows:row,
        word: edges("word"), rank: edges("rank"), hue: edges("hue"),
        warmth: edges("warmth"), unrest: edges("unrest"),
        nag: edges("nag"), mark: edges("mark"), live: edges("live"),
        words: A.PIETY_TIERS.map(t=>t.word), floors: A.PIETY_TIERS.map(t=>t.at),
        monotone: row.every((r,i)=>i===0 || r.rank >= row[i-1].rank) }; }

    /* ---- 1b. and where the boundary sits BETWEEN two integers ----
       Piety is fractional: the drift is `p + (30 - p) * 0.03`, so a house climbing out of the
       cellar spends about three weeks in 20 < p < 21. The bare `<= 20` this release deleted let it
       out of the penalty there while the bar still showed it red; the ladder does not. That is the
       ONE behavioural difference in #267, so it is pinned rather than left to drift back. */
    R.edge = [19.99, 20, 20.01, 20.5, 20.99, 21, 21.01,
              63.99, 64, 64.5, 64.99, 65, 65.01].map(pi=>{
      const T = A.pietyTier({ piety:pi });
      return { pi, word:T.word, warmth:T.warmth, unrest:T.unrest };
    });

    /* ---- 2. what the week actually pays, against the tier it ends on ----
       The drift lands BEFORE the tier is read, so a house set to 65 ends the week at 63.95 and is
       paid as `pious`. That is the engine's own order and the comparison has to respect it, or the
       check reports the drift as a ladder fault. */
    R.week = [5, 19, 20, 21, 30, 45, 51, 52, 64, 65, 66, 80, 95].map(pi=>{
      const d = house("PI_W" + pi, pi);
      const fav0 = d.patrons[0].favor, un0 = d.unrest;
      A.templeWeek(d);
      const T = A.pietyTier(d);                        /* the tier of the piety the week ENDS at */
      return { pi, ended:+A.pietyOf(d).toFixed(2), band:T.word,
        gotFav:+(d.patrons[0].favor - fav0).toFixed(3), owedFav:T.warmth,
        gotUn:+(d.unrest - un0).toFixed(3), owedUn:T.unrest };
    });

    /* ---- 3. the panel's terms, and whether its omen figure is the roll ---- */
    R.says = [8, 30, 45, 64, 70, 92].map(pi=>{
      const d = house("PI_S" + pi, pi);
      return { pi, word:A.pietyWord(pi), text:A.pietySays(d), ill:Math.round(A.omenIll(d)*100) };
    });
    R.omen = [10, 45, 85].map(pi=>{
      const d = house("PI_O" + pi, pi);
      let drew = 0, ill = 0;
      for(let i=0;i<DRAWS;i++){
        d.flags.omenWk = 0;
        let ev = null; try { ev = A.EVENTS.omen.make(d); } catch(e){ break; }
        if(!ev) continue;
        drew++; if(ev.data && ev.data.ill) ill++;
      }
      return { pi, drew, illPct: drew ? +(100*ill/drew).toFixed(1) : null,
        printed: Math.round(A.omenIll(d)*100) };
    });

    /* ---- 4. the second door: the fair reading, which does not ask the altar ---- */
    { const seal = (gold, resting)=>{
        const d = house("PI_OMEN" + gold + resting, 40);
        d.gold = gold;
        if(resting) d.lastOffering = d.week;            /* altar mid-rest — makeOffering refuses */
        const p0 = A.pietyOf(d), g0 = d.gold;
        const wouldOffer = !!A.makeOffering(d, "mars");
        if(wouldOffer){ d.blessing = null; d.gold = g0; d.piety = p0; d.lastOffering = resting ? d.week : null; }
        let text = "";
        try { text = String(A.EVENTS.omen.run(d, { data:{ ill:false } }, 0) || ""); }
        catch(e){ text = "THREW: " + e.message; }
        return { gold, resting, altarWould:wouldOffer, text,
          god:A.blessOf(d), left:A.blessLeft(d), spent:Math.round(g0 - d.gold),
          pietyUp:+(A.pietyOf(d) - p0).toFixed(1) }; };
      R.door = { rich:seal(20000, false), broke:seal(0, false), resting:seal(20000, true),
        keys:A.GOD_KEYS.slice() }; }

    return R;
  }, [OMEN_DRAWS]);

  if(out.why) return { pass:false, why:out.why, lines:[] };

  /* ---- 5. and the line is on the screen ---- */
  await found(p);
  await clearAll(p, 10);
  await tab(p, "villa"); await p.waitForTimeout(400); await clearAll(p, 8); await settle(p);
  /* the villa carries three tabs of its own and the Temple is under Standing — the first pass of
     this arm knocked on the villa, found seven sections, none of them the temple, and reported the
     panel as unrendered. It was on the next tab along. */
  await p.evaluate(()=>{ const b = [...document.querySelectorAll("button[role=tab]")]
    .find(x=>/standing/i.test(x.getAttribute("aria-label") || x.innerText || "")); if(b) b.click(); });
  await p.waitForTimeout(400); await settle(p);
  await p.evaluate(()=>{ for(const d of document.querySelectorAll("details")) d.open = true; });
  await p.waitForTimeout(300);
  /* NOTHING ON THE PAGE HANDS OUT THE LIVE `S`, so the expectation is not imported from the
     engine — it is read off the section itself. The summary's note IS `pietyWord(pi)` for an
     unblessed house, so the word and the terms under the bar are two renderings of one number and
     have to agree with each other. A line that said "devout" over "+0.5 unrest" would be caught
     here without the check ever knowing what the house's piety is. */
  const screen = await p.evaluate(()=>{
    const sect = [...document.querySelectorAll("details.sect")]
      .find(x=>/the temple/i.test((x.querySelector("summary")||{}).innerText || ""));
    if(!sect) return { found:false,
      place: (document.querySelector("[data-place]")||{getAttribute:()=>null}).getAttribute("data-place"),
      sects: [...document.querySelectorAll("details.sect")].map(x=>((x.querySelector("summary")||{}).innerText||"").replace(/\s+/g," ").trim().slice(0,40)),
      tabs: [...document.querySelectorAll("button[role=tab]")].map(b=>b.getAttribute("aria-label")) };
    const text = (sect.innerText||"").replace(/\s+/g," ").trim();
    const note = ((sect.querySelector("summary")||{}).innerText||"").replace(/\s+/g," ").trim();
    const ill = /haruspex reads ill about (\d+) weeks in 100/i.exec(text);
    /* A BAND THAT IS WORTH NOTHING STILL NAMES WHAT DEVOUT IS WORTH, so a bare search for the
       warmth figure matches on every band and the first pass of this arm read a lax house as
       being paid a devout house's quarter point. The promise sits AFTER "nothing bought"; what
       the band itself pays is only ever the part before it. */
    const nothing = /nothing bought, nothing spent/i.test(text);
    return { found:true, text, note, ill: ill ? +ill[1] : null, nothing,
      unrest:  /\+0\.5 unrest in the cells/i.test(text),
      warmth:  !nothing && /\+0\.25 with every patron/i.test(text) };
  });

  const lines = [], fails = [];
  const L = out.ladder;
  lines.push(`the ladder: ${L.words.map((w,i)=>`${w}@${L.floors[i]}`).join(" · ")}`);
  lines.push(`   edges — word ${L.word.join(",")} · hue ${L.hue.join(",") || "none"} · ` +
    `warmth ${L.warmth.join(",") || "none"} · unrest ${L.unrest.join(",") || "none"} · ` +
    `nag ${L.nag.join(",") || "none"} · mark ${L.mark.join(",") || "none"} · live ${L.live.join(",") || "none"}`);
  lines.push(`between the integers: ${out.edge.map(e=>`${e.pi}→${e.word}`).join(" · ")}`);
  lines.push("what the week pays, against the tier it ends on:");
  for(const w of out.week)
    lines.push(`   piety ${String(w.pi).padStart(3)} → ends ${String(w.ended).padStart(6)} (${w.band.padEnd(10)}) · ` +
      `patron ${w.gotFav >= 0 ? "+" : ""}${w.gotFav} owed ${w.owedFav} · unrest ${w.gotUn >= 0 ? "+" : ""}${w.gotUn} owed ${w.owedUn}`);
  lines.push("what the bar says it is worth:");
  for(const s of out.says) lines.push(`   ${String(s.pi).padStart(3)} ${s.word.padEnd(10)} ${s.text}`);
  lines.push("and whether that omen figure is the roll:");
  for(const o of out.omen)
    lines.push(`   piety ${String(o.pi).padStart(3)} · printed ${o.printed}% · rolled ${o.illPct}% over ${o.drew} readings`);
  const D = out.door;
  lines.push(`the second door — a fair reading sealed: rich → ${D.rich.god || "nothing"} for ${D.rich.left}w, ${D.rich.spent}d, piety +${D.rich.pietyUp}`);
  lines.push(`   with an empty box → ${D.broke.god || "nothing, correctly"}, piety +${D.broke.pietyUp}`);
  lines.push(`   with the altar mid-rest (makeOffering would ${D.resting.altarWould ? "ALSO take it" : "refuse"}) → ${D.resting.god || "nothing"} for ${D.resting.left}w`);
  lines.push(screen.found
    ? `on the screen: summary "${screen.note}" · ill ${screen.ill}% · ` +
      `${screen.nothing ? "nothing bought" : screen.unrest ? "+0.5 unrest" : screen.warmth ? "+0.25 warmth" : "NO TERMS AT ALL"}`
    : `on the screen: NOT FOUND · place=${screen.place} · tabs=${JSON.stringify(screen.tabs)} · sects=${JSON.stringify(screen.sects)}`);

  /* ---- 1. every edge in the effect is an edge in the word ---- */
  { const wordEdges = new Set(L.word);
    const inside = (k, name) => { const stray = (L[k]||[]).filter(e=>!wordEdges.has(e));
      if(stray.length) fails.push(`${name} changes at piety ${stray.join(", ")}, where the word on the bar does not — ` +
        `this is #267's whole fault, six copies of one threshold with the visible one the odd man out`); };
    inside("warmth", "the patron's weekly warmth");
    inside("unrest", "the weekly unrest of a godless house");
    inside("nag", "the agenda's rites line");
    inside("mark", "the temple's section mark");
    inside("hue", "the colour of the word");
    inside("live", "the temple's live predicate");
    if(L.word.length !== L.words.length - 1)
      fails.push(`${L.words.length} words and ${L.word.length} edges between 0 and 100 — a word nobody can reach is not a band`);
    if(new Set(L.words).size !== L.words.length) fails.push("two tiers carry the same word");
    if(!L.monotone) fails.push("the rank falls somewhere as piety rises");
    /* and the two that are worth something have to be the two ENDS, or the ladder means nothing */
    const paid = L.rows.filter(r=>r.warmth || r.unrest);
    if(!paid.length) fails.push("no band of piety is worth anything at all — the whole scale is decoration");
    else {
      if(!(L.rows[0].unrest > 0)) fails.push("the bottom of the scale costs nothing — a godless house is supposed to feel it");
      if(!(L.rows[100].warmth > 0)) fails.push("the top of the scale buys nothing");
      const mid = L.rows.filter(r=>r.pi > 0 && r.pi < 100 && r.warmth && r.unrest);
      if(mid.length) fails.push(`piety ${mid[0].pi} both costs and buys — no band may do both`);
    } }

  /* ---- 1b. the fractional boundaries, pinned ---- */
  { const at = pi => out.edge.find(e=>e.pi===pi) || {};
    const godless = out.ladder.words[0], devout = out.ladder.words[out.ladder.words.length-1];
    for(const pi of [19.99, 20, 20.01, 20.5, 20.99])
      if(at(pi).word !== godless)
        fails.push(`piety ${pi} reads "${at(pi).word}" — everything below ${out.ladder.floors[1]} is ${godless}, `
          + `and the bare \`<= 20\` this release deleted is what let a house out of the penalty on a fraction`);
    for(const pi of [21, 21.01])
      if(at(pi).word === godless) fails.push(`piety ${pi} is still ${godless} — the band ends at ${out.ladder.floors[1]}`);
    for(const pi of [63.99, 64, 64.5, 64.99])
      if(at(pi).word === devout) fails.push(`piety ${pi} reads "${devout}" — the warmth starts at ${out.ladder.floors[4]}, not below it`);
    for(const pi of [65, 65.01])
      if(at(pi).word !== devout) fails.push(`piety ${pi} does not read "${devout}" — ${out.ladder.floors[4]} is where the warmth has always started`);
    for(const e of out.edge){
      const owed = out.ladder.rows.find(r=>r.word === e.word) || {};
      if(e.warmth !== owed.warmth || e.unrest !== owed.unrest)
        fails.push(`a fractional piety ${e.pi} reads "${e.word}" and pays ${e.warmth}/${e.unrest} against the band's ${owed.warmth}/${owed.unrest}`);
    } }

  /* ---- 2. the week pays exactly what the tier says ---- */
  for(const w of out.week){
    if(Math.abs(w.gotFav - w.owedFav) > 0.001)
      fails.push(`a week at piety ${w.pi} ended ${w.ended} (${w.band}) and moved a patron ${w.gotFav} against the ${w.owedFav} its tier promises`);
    if(Math.abs(w.gotUn - w.owedUn) > 0.001)
      fails.push(`a week at piety ${w.pi} ended ${w.ended} (${w.band}) and moved unrest ${w.gotUn} against the ${w.owedUn} its tier promises`);
  }
  { const worst = out.week[0], best = out.week[out.week.length-1];
    if(!(worst.gotUn > 0)) fails.push("a week at piety 5 left the cells untouched");
    if(!(best.gotFav > 0)) fails.push("a week at piety 95 warmed nobody"); }

  /* ---- 3. the panel names the terms, and the figure it prints is the roll ---- */
  for(const s of out.says){
    if(!new RegExp(`\\b${s.ill}\\b`).test(s.text))
      fails.push(`the bar at piety ${s.pi} does not print the ${s.ill}% the haruspex actually reads ill at — "${s.text}"`);
    if(!/weeks in 100/i.test(s.text))
      fails.push(`the bar at piety ${s.pi} gives the omen figure without saying what it is a figure of`);
  }
  { const say = pi => (out.says.find(s=>s.pi===pi)||{}).text || "";
    if(!/0\.5 unrest/i.test(say(8)))
      fails.push(`a godless house is not told the half point of unrest it pays every week — "${say(8)}"`);
    if(/nothing bought/i.test(say(8))) fails.push("a godless house is told it spends nothing");
    if(!/0\.25 with every patron/i.test(say(92)))
      fails.push(`a devout house is not told the quarter point of warmth it buys — "${say(92)}"`);
    for(const pi of [30, 45, 64]){
      if(!/nothing bought, nothing spent/i.test(say(pi)))
        fails.push(`piety ${pi} buys nothing and costs nothing and the bar does not say so — "${say(pi)}"`);
      if(!/more to devout/i.test(say(pi)))
        fails.push(`piety ${pi} is not told how far the next band that is worth something is`);
      if(!/0\.25 with every patron/i.test(say(pi)))
        fails.push(`piety ${pi} is told how far to devout without being told what devout is worth`);
    } }
  for(const o of out.omen){
    if(!(o.drew > 200)) { fails.push(`only ${o.drew} readings in ${OMEN_DRAWS} draws at piety ${o.pi} — the arm cannot say anything`); continue; }
    if(Math.abs(o.illPct - o.printed) > OMEN_TOL)
      fails.push(`the temple prints ${o.printed}% ill readings at piety ${o.pi} and the haruspex rolled ${o.illPct}% over ${o.drew} — ` +
        `#150's rule is that the shown number and the roll behind it are the same call`);
  }

  /* ---- 4. the second door ---- */
  if(!D.rich.god) fails.push("sealing a fair reading with 20,000d in the box put no blessing on the house — this is the only way into a blessing that is not the altar");
  else if(!D.keys.includes(D.rich.god)) fails.push(`the omen blessed the house with "${D.rich.god}", who is not one of the five`);
  if(!(D.rich.left > 0)) fails.push("the omen's blessing was over the week it arrived");
  if(!(D.rich.spent > 0)) fails.push("sealing a fair reading cost nothing");
  if(!(D.rich.pietyUp > 0)) fails.push("sealing a fair reading moved no piety");
  if(D.broke.god) fails.push("a house with an empty strongbox sealed the reading anyway");
  if(!/strongbox|too light/i.test(D.broke.text))
    fails.push(`a house that could not afford to seal the reading was not told why — "${String(D.broke.text).slice(0,90)}"`);
  if(!(D.broke.pietyUp > 0)) fails.push("the small gestures of a house that cannot pay are worth nothing at all");
  if(D.resting.altarWould)
    fails.push("the fixture meant to hold the altar mid-rest did not hold it, so the arm below proves nothing");
  else if(!D.resting.god)
    fails.push("with the altar mid-rest the fair reading blessed nobody — the card is supposed to be a second door, not the same one");

  /* ---- 5. and it reaches the screen ---- */
  if(!screen.found)
    fails.push("the villa has no Temple section to read — the panel this release writes into is not on screen");
  else {
    const words = out.ladder.words, shown = words.filter(w=>new RegExp(`\\b${w}\\b`, "i").test(screen.note));
    if(screen.ill == null)
      fails.push(`the Temple section on screen carries no omen figure — \`pietySays\` is not rendered: "${screen.text.slice(0, 140)}"`);
    else if(!(screen.ill >= 20 && screen.ill <= 72))
      fails.push(`the screen prints ${screen.ill}% ill readings, outside the ${20}-${72} \`omenIll\` can produce`);
    if(!(screen.nothing || screen.unrest || screen.warmth))
      fails.push(`the Temple section names no terms for the band at all: "${screen.text.slice(0, 140)}"`);
    if(!shown.length)
      fails.push(`the Temple section's summary names no band of piety: "${screen.note}"`);
    else {
      const w = shown[0];
      if(screen.unrest && w !== words[0])
        fails.push(`the screen calls the house "${w}" over a line charging it the godless half point of unrest`);
      if(screen.warmth && w !== words[words.length-1])
        fails.push(`the screen calls the house "${w}" over a line paying it the devout quarter point of warmth`);
      if(screen.nothing && (w === words[0] || w === words[words.length-1]))
        fails.push(`the screen calls the house "${w}" over a line saying nothing is bought or spent — the two ends of the ladder are the two that are worth something`);
    }
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
