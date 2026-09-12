/* THE PROMISES THE HOUSE MAKES TO ITS OWN MEN — #276

   (`promise` was free in BOTH directories; checked before writing.)

   ---- THE SWEEP THIS CAME OUT OF ----
   A census of `src/ludus.jsx` — every field assigned on an object, against every read of it
   anywhere, with COMMENTS stripped and nothing else (the note over `noComments` says why that is
   the right line to draw, and it cost eight false positives to find) — returned **538 distinct
   assigned fields, 30 written once and read nowhere**. `#273` had found two of them by hand
   (`g.fromYard`, `h.lineage.soldAt`), which is the calibration: the census finds what a careful
   reading finds, and finds twenty-eight more.

   Arm 1 below RE-RUNS THAT CENSUS as a gate. Twenty-nine are named in `KNOWN` — `pairWord` was
   the thirtieth and this release is why it is not — and the check fails on a THIRTY-FIRST, which
   is the `romeFall` pin of #269 scaled to a class. It does not require the list to shrink: several
   are deliberate (`el.dataset.fold` is read by the stylesheet, `d.law.women` and `d.law.damnati`
   are duplicate bookkeeping beside a live edict, six more are stamped for the gate to read). What
   it forbids is a NEW one arriving unremarked.

   ---- AND WHAT THE THIRTY CLUSTERED INTO ----
   `ASKS` is the five things a man will come and ask you for. Two leave something the game reads
   (`noSell` -> `herSpareMan`; `g.family` -> the death letter). Three left nothing at all, and the
   file had already diagnosed the fault: #239's note over `REGARD.leave` says *"`woman` was the
   only one of the five ASKS whose branches never called `remember`"*. IT WAS ONE OF FOUR. Arm 2
   drives every branch of all five and requires each to reach the man's own record.

   ---- AND THE ONE WITH TWO NAMES IN IT ----
   `WORDS.beside` — "Put them out together when you can" — is the third most common thing a man
   says to you (260 of 1,104 conversations, 23.6%, `probes/promise.mjs`). It wrote `d.flags.pairWord
   = d.week`: a house-wide NUMBER with no room for the two men. The game fought 330 pair bouts in
   3,491 weeks and honoured the word on **22 of 260 promises — 8.5%, the coincidence rate**.

   Arms 3-6 hold the repair: the word carries its two names, the pair-bout aftermath pays it, a
   bout between two OTHER men does not, and it is visible on both surfaces while it stands.

   SIX ARMS. */
import { hasHandle } from "../harness.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const name = "promise";
export const describe = "a word given to one of your own reaches his record, and the one with two names in it can be kept";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/* ---- THE TWENTY-NINE, WITH A REASON APIECE — the sweep closed, v3.273.0 ----
   #276 shipped this list as a bare set, which capped the class without saying anything about it: a
   reader could tell that twenty-nine fields are written once and read nowhere and not one thing
   about WHY, or which of them anybody had actually looked at. All twenty-nine are triaged now, the
   rates are `probes/orphans.mjs`, and the entries carry the finding rather than pointing at it.

   `pairWord` was the thirtieth and v3.272.0 is why it is not here. It is deliberately absent: if
   that wire is ever cut, arm 1 says so before arm 4 does.

   FIVE CLASSES. Nothing in `dup`, `rare` or `tell` is a bug list — they are measured refusals, and
   the measuring is the deliverable. A field arriving here without a class is the failure. */
const READ = "read, but not by the game";
const DUP  = "redundant beside machinery that is live";
const RARE = "unreachable, or near enough, at the measured rate";
const TELL = "genuinely dead, and a small missing tell";
const REF  = "refused with its own numbers";

const KNOWN = {
  /* ---- read elsewhere: the stylesheet, or a check that asserts the stamp ---- */
  fold:         [READ, "the stylesheet reads it — `.plate[data-fold=\"1\"]{height:44px}`"],
  inside:       [READ, "`checks/doctore.mjs` requires the succession offer to carry it"],
  tookHouse:    [READ, "`checks/heir.mjs` asserts succession stamps it on the son's own record"],
  watchful:     [READ, "`checks/vacancy.mjs` requires the newcomer to carry the tell"],
  kinBroken:    [READ, "`checks/mistress.mjs` reports it"],
  everBorrowed: [READ, "`probes/credit.mjs` reads it"],
  writtenOff:   [READ, "`probes/cliff.mjs` reads it"],
  fromYard:     [READ, "`checks/walls.mjs` — found by hand in #273 and pinned there"],
  soldAt:       [READ, "`checks/walls.mjs` — found by hand in #273 and pinned there"],
  stood:        [READ, "`checks/office.mjs` reads `d.election.stood`"],

  /* ---- duplicates of state the game already keeps somewhere it does read ---- */
  lastCheck:    [DUP,  "`g.scars.push(scarMark(target))` one line above stores the same part; "
                     + "`g.scars[last].part` is `lastCheck`. Written in 40 of 40 houses, and "
                     + "redundant in every one"],
  avenging:     [DUP,  "looks like a revenge target and is not: `f` is a FALLEN record, so `f.gid` "
                     + "is the DEAD man's id. The live path is `f.killer.fid` -> a rival's roster, "
                     + "`fal.avenged` on the win, \"avenged\" in the fallen list. 70 men in 25 of "
                     + "40 houses carry a back-pointer beside a system that works"],
  paragonBought:[DUP,  "written in the same statement as `d.flags.paragonDone`, which is read"],
  scenario:     [DUP,  "`d.scenario` is save data recording the opening; the five keys are read "
                     + "off `SCENARIOS` where they are needed"],
  women:        [DUP,  "`d.law.women` sits beside a live edict — `L.edicts` plus `EDICTS[k].check` "
                     + "carry the whole consequence, heat and fines included"],
  damnati:      [DUP,  "`d.law.damnati`, the same shape as `women` above"],
  softened:     [DUP,  "the petition's mark on the offer. `petitionOdds` already reads the editor "
                     + "going in — `cardEditor`, `editorTrust`, `editorRec().bought`, #254 phase 2 "
                     + "— so the asking is priced; only the mark is unread. 240 grants in 40 houses"],
  raised:       [DUP,  "as `softened`; 34 grants in 40 houses"],
  eased:        [DUP,  "as `softened`; `mercy` needs a sine card on the bill and was askable 0 times"],
  demo:         [DUP,  "`out.demo` on the tutorial fight, which already has `crux:false, pending:null`"],

  /* ---- real, and not reached often enough to build on ---- */
  romeBid:      [RARE, "`ROME_TURNS.offer`'s ENTIRE effect, and the prose says a Roman familia "
                     + "names a figure for your best man. Over 120 houses: 21 reached Rome, 17 had "
                     + "a turn fire, ALL 17 were `matched` — the three gate differently and `offer` "
                     + "wants standing 55. Zero fires. The `year`/`woman` refusal a third time"],
  cartel:       [RARE, "needs year 7 and a rival grudge >= 45; the median house lives 43 weeks. "
                     + "0 in 3,972 played weeks"],
  wasYours:     [RARE, "a man you lost to a poach, now on a rival's roster and never named as "
                     + "yours. 0 in 3,972 played weeks"],

  /* ---- dead, reachable, and small ---- */
  lookedAway:   [TELL, "the war messenger's first branch — you sell men to the rising for coin. "
                     + "15% of houses. Nothing refers to it again, `theRoad` included"],
  turnedHimIn:  [TELL, "the same event's second branch. 0 under a rope that answers 0; driven, it "
                     + "stamps 3 of 3, so the zero is policy and not a shut door"],
  mentorLost:   [TELL, "the heir's mentor died and the boy's record keeps his id. 13% of houses"],
  wedTo:        [TELL, "which way you placed a daughter — patron, magistrate or rival. Each kind "
                     + "pays out on the day and none is remembered after. 13% of houses"],

  /* ---- refused in #276, with the numbers beside the code refused ---- */
  oneMoreYear:  [REF,  "its ask fires 0 times in 2,402 weeks; the gate is crossed on 1.2%"],
  wantMatch:    [REF,  "7 fires in 2,402 weeks, all 7 outliving their own date, median 58 weeks"],
};

/* ---- STRIP COMMENTS AND NOTHING ELSE, AND THE REASON IS A FINDING ----
   The first cut of this parsed string and template state too, so that prose could not count as a
   read. It reported EIGHT extra dead fields — `avenged`, `ended`, `headline`, `imported`,
   `lastScheme`, `snap`, `stone`, `watchedTac` — and every one of them is read inside JSX, in
   `{o.headline && ...}` and its kind. The cause is an APOSTROPHE: this file is thirty-six thousand
   lines of English prose inside JSX, "he doesn't" opens a string state that runs until the next
   apostrophe, and whole regions of the render were being blanked before the reads were counted.

   A read is `.field` WITH A LEADING DOT, and English does not write a leading dot, so a string
   body cannot manufacture one and there is nothing to defend against. A COMMENT can — this file's
   notes name dead fields by name on purpose, `#273`'s two among them — so comments still go. */
function noComments(s){
  const out = []; let i = 0, st = "code"; const n = s.length;
  while(i < n){ const c = s[i], nx = i+1 < n ? s[i+1] : "";
    if(st === "code"){
      if(c === "/" && nx === "*"){ st = "block"; out.push("  "); i += 2; continue; }
      if(c === "/" && nx === "/"){ st = "line";  out.push("  "); i += 2; continue; }
      out.push(c); i++; continue; }
    if(st === "block"){ if(c === "*" && nx === "/"){ st = "code"; out.push("  "); i += 2; continue; }
      out.push(c === "\n" ? "\n" : " "); i++; continue; }
    if(c === "\n"){ st = "code"; out.push("\n"); i++; continue; }
    out.push(" "); i++; }
  return out.join("");
}

function census(){
  const code = noComments(fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8"));
  const assigned = new Set();
  for(const m of code.matchAll(/(?:^|[^\w.$])[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\.([A-Za-z_$][\w$]*)\s*=(?!=)/g))
    assigned.add(m[1]);
  const dead = [];
  for(const f of assigned){
    if(f.length < 3) continue;                    /* `id`, `at`, `a`, `b` — too short to count safely */
    const hits = (code.match(new RegExp("\\." + f + "\\b", "g")) || []).length
      + (code.match(new RegExp("\\[\\s*['\"]" + f + "['\"]\\s*\\]", "g")) || []).length;
    if(hits === 1) dead.push(f);
  }
  return { fields: assigned.size, dead: dead.sort() };
}

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const lines = [], fails = [];

  /* ---- 1. the class cannot grow unremarked ---- */
  const C = census();
  const fresh = C.dead.filter(f=>!KNOWN[f]);
  const tally = {};
  for(const f of C.dead) if(KNOWN[f]) tally[KNOWN[f][0]] = (tally[KNOWN[f][0]]||0) + 1;
  lines.push(`1. census: ${C.fields} assigned fields · ${C.dead.length} written once and read nowhere `
    + `· ${fresh.length} of them unaccounted for`);
  for(const [cls, n] of Object.entries(tally)) lines.push(`   ${String(n).padStart(2)} ${cls}`);
  if(fresh.length)
    fails.push(`${fresh.length} field${fresh.length===1?"":"s"} written once and read nowhere that the `
      + `sweep did not account for: ${fresh.join(", ")} — read it, delete it, or add it to KNOWN `
      + `with a class and a reason`);
  /* and the accounting has to stay honest in the other direction too: a field that is no longer
     dead has been repaired or deleted, and its entry is then a claim about code that is gone */
  const stale = Object.keys(KNOWN).filter(f=>!C.dead.includes(f));
  if(stale.length)
    fails.push(`${stale.length} field${stale.length===1?"":"s"} in KNOWN ${stale.length===1?"is":"are"} `
      + `no longer written-once-read-nowhere: ${stale.join(", ")} — if that was deliberate, drop the `
      + `entry, because it now describes code that does not exist`);

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["ASKS","ASK_KEYS","WORDS","haveWordWith","wordReady","EVENTS","doPairFight",
      "pairSworn","pairStands","pairMen","pairKept","pairWordSays","PAIR_WORD","agendaPair",
      "calendarRows","REGARD","newGameState","activeG","endWeek","genGladiator","genOpponent","addTie"]
      .filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

    /* ---- 2. every branch of every ask reaches the man's own record ---- */
    const marks = {};
    for(const k of A.ASK_KEYS){
      marks[k] = {};
      for(const branch of ["yes","no"]){
        const F = A.ASKS[k][branch];
        if(typeof F !== "function"){ marks[k][branch] = "no such branch"; continue; }
        const d = A.newGameState("Ck","clean",`ASK-${k}-${branch}`);
        const g = A.activeG(d)[0];
        if(!g){ marks[k][branch] = "no man"; continue; }
        g.wins = 12; g.losses = 2; g.pfame = 220; g.regard = 70;
        d.gold = 99999;                    /* so a branch that FREES a man can actually free him */
        d.fallen = [{ name:"A", week:1 }, { name:"B", week:2 }];
        const o = A.activeG(d)[1];
        const before = ((g.memory||[]).length);
        const beforeAll = A.activeG(d).reduce((n,x)=>n + ((x.memory||[]).length), 0);
        try { F(d, g, { oid:o ? o.id : null, fid:1, fname:"Someone" }); } catch(e){ marks[k][branch] = "threw: " + e.message; continue; }
        const after = ((g.memory||[]).length);
        const afterAll = A.activeG(d).reduce((n,x)=>n + ((x.memory||[]).length), 0);
        const gone = !A.activeG(d).some(x=>x.id === g.id);
        marks[k][branch] = (after > before || afterAll > beforeAll) ? "on the record"
          : gone ? "he leaves the roster" : "SILENT";
      }
    }
    /* AND THE ONE SUB-BRANCH THE RULE ABOVE CANNOT SEE. `year.no` is "Free him now", and when the
       house cannot pay the manumission `grantRudis` returns false, keeps the man, and chronicles
       *"He stays, which he will understand and not forgive."* Nothing is behind the not forgiving.
       It is not this table's to fix — `grantRudis` has two callers and the gap is inside it — so
       this reports the state rather than failing on it, and `src` carries the note. */
    let poorRudis = null;
    {
      const d = A.newGameState("Ck","clean","ASK-year-no-poor");
      const g = A.activeG(d)[0];
      if(g){
        g.wins = 12; g.losses = 2; g.pfame = 220; g.regard = 70; d.gold = 0;
        const before = (g.memory||[]).length;
        try { A.ASKS.year.no(d, g, {}); } catch(e){}
        poorRudis = { stays: A.activeG(d).some(x=>x.id === g.id),
          onRecord: (g.memory||[]).length > before,
          said: (d.log||[]).slice(0,3).some(x=>/not forgive/i.test(x.text||"")) };
      }
    }

    /* ---- 3-5. the word with two names in it ---- */
    const pairArm = (sameMen)=>{
      const d = A.newGameState("Ck","clean", sameMen ? "PAIR-SAME" : "PAIR-OTHER");
      /* four men, two of them brothers, all fit */
      while(A.activeG(d).length < 4){ const g = A.genGladiator(d, 28); g.status = "active"; d.gladiators.push(g); }
      const men = A.activeG(d).slice(0, 4);
      men.forEach(g=>{ g.wins = 5; g.losses = 1; g.regard = 70; g.morale = 70; g.pfame = 90;
        g.injury = null; g.refusing = false; g.learning = null; g.benched = null; });
      A.addTie(d, men[0].id, men[1].id, "brother", 60);
      /* the word, set exactly as `WORDS.beside` sets it */
      d.flags.pairWord = { a:men[0].id, b:men[1].id, at:d.week };
      const P = A.pairSworn(d), M = A.pairMen(d);
      const says = A.pairWordSays(d);
      /* the calendar, which is the block headed "what you have promised, or been told" */
      let cal = [];
      try { cal = (A.calendarRows(d, A.YEAR_WEEKS)||[])
        .filter(r=>(r.title||"").includes(men[0].name) && (r.title||"").includes(men[1].name)); } catch(e){}
      /* the agenda, which must be silent with no pair on the card and speak with one */
      const agQuiet = []; d.games = { offers:[] };
      try { A.agendaPair(d, (u,t,l,s)=>agQuiet.push({u,t,l,s})); } catch(e){}
      const offer = { id:1, tier:1, festival:"the pits", pair:true, stakes:"standard", purse:400,
        opps:[A.genOpponent(1, undefined, d), A.genOpponent(1, undefined, d)], oppRefs:[null,null] };
      d.games = { offers:[offer], fest:"pits" };
      const agLoud = [];
      try { A.agendaPair(d, (u,t,l,s)=>agLoud.push({u,t,l,s})); } catch(e){}
      /* and the bout — through its crux, which is where the aftermath lives */
      const ids = sameMen ? [men[0].id, men[1].id] : [men[2].id, men[3].id];
      const kBefore = men.map(g=>(g.memory||[]).filter(m=>m.kind==="kept").length);
      const logBefore = (d.log||[]).slice(0, 3).map(x=>x.text||"");
      let r = null, threw = null;
      try { r = A.doPairFight(d, ids, offer, "measured", null, null);
        let guard = 0;
        while(r && r.crux && r.pending && guard++ < 5){
          const pd = r.pending; pd.beats = r.beats;
          r = A.doPairFight(d, pd.ids, pd.offer, pd.tactic, pd, null); }
      } catch(e){ threw = e.message; }
      const kAfter = men.map(g=>(g.memory||[]).filter(m=>m.kind==="kept").length);
      const said = (d.log||[]).slice(0, 6).map(x=>x.text||"")
        .some(t=>/went out together, which is what you said/i.test(t) && !logBefore.includes(t));
      return { sworn:!!P, twoNames:!!(P && P.a != null && P.b != null && P.a !== P.b),
        men:M ? M.map(x=>x.name) : null, says, cal:cal.length, calWeek:cal[0] ? cal[0].week : null,
        at:d.week, agQuiet:agQuiet.length, agLoud:agLoud.length, agLabel:agLoud[0] ? agLoud[0].l : null,
        threw, kBefore, kAfter, said, cleared: A.pairSworn(d) == null,
        gained: kAfter.map((v,i)=>v - kBefore[i]) };
    };

    /* the old shape must not be mistaken for a promise */
    const dOld = A.newGameState("Ck","clean","PAIR-OLD");
    dOld.flags.pairWord = dOld.week;          /* what a save written before #276 carries */
    const oldOK = A.pairSworn(dOld) == null && A.pairMen(dOld) == null && A.pairWordSays(dOld) == null;

    return { marks, poorRudis, same: pairArm(true), other: pairArm(false), oldOK,
             span:A.YEAR_WEEKS, win:A.PAIR_WORD };
  });

  if(out.why) return { pass:false, why:out.why, lines };

  /* ---- 2 ---- */
  const silent = [];
  for(const [k, br] of Object.entries(out.marks)){
    lines.push(`2. ask \`${k}\`: yes -> ${br.yes} · no -> ${br.no}`);
    for(const [b, v] of Object.entries(br)) if(v === "SILENT") silent.push(`${k}.${b}`);
    for(const [b, v] of Object.entries(br)) if(/^threw/.test(v)) fails.push(`\`${k}.${b}\` ${v}`);
  }
  if(silent.length)
    fails.push(`${silent.length} ask branch${silent.length===1?"":"es"} leave nothing on any man's record: `
      + `${silent.join(", ")} — #239 fixed one of these and its note says it was the only one`);
  const PR = out.poorRudis;
  lines.push(`2. and \`year.no\` in a house that cannot pay: he stays ${PR && PR.stays} `
    + `· chronicled ${PR && PR.said} · on his record ${PR && PR.onRecord} `
    + `(a recorded gap inside \`grantRudis\`, which has two callers — not this table's)`);
  if(PR && !PR.stays) fails.push("a house with no gold freed a man anyway");
  if(PR && !PR.said) fails.push("`grantRudis` refused the manumission and said nothing");

  /* ---- 3 ---- */
  const S = out.same, O = out.other;
  lines.push(`3. the word: sworn ${S.sworn} · two names ${S.twoNames} · ${S.men ? S.men.join(" and ") : "nobody"} `
    + `· stands ${out.win}w inside a ${out.span}w year · "${S.says}"`);
  if(!S.twoNames) fails.push("the pair word does not carry two names");
  if(!out.oldOK) fails.push("a save carrying the old shape (a bare week) reads as a live promise");
  if(out.win > out.span)
    fails.push(`the word stands ${out.win} weeks and \`calendarRows\` spans ${out.span} — its own `
      + `deadline falls off the end of the calendar, which is the surface this item exists to reach`);

  /* ---- 4 ---- */
  lines.push(`4. the bout, the two men you swore about: ${S.threw ? "THREW " + S.threw : "ran"} `
    + `· kept memories ${S.kBefore.join("/")} -> ${S.kAfter.join("/")} · said so ${S.said} · cleared ${S.cleared}`);
  if(S.threw) fails.push(`a pair bout between the sworn two threw: ${S.threw}`);
  else {
    if(!(S.gained[0] > 0 && S.gained[1] > 0))
      fails.push(`the two men you gave your word about went out together and neither remembers it `
        + `(gained ${S.gained.join("/")}) — \`REGARD.kept\` is the sentence this pays`);
    if(!S.cleared) fails.push("the word was kept and is still standing");
    if(!S.said) fails.push("the word was kept and the chronicle does not say so");
  }

  /* ---- 5. and two OTHER men do not pay it ---- */
  lines.push(`5. the same bout, two other men: kept ${O.kBefore.join("/")} -> ${O.kAfter.join("/")} `
    + `· cleared ${O.cleared} · said so ${O.said}`);
  if(O.cleared) fails.push("a pair bout between two men you said nothing about cleared the word");
  if(O.said) fails.push("a pair bout between two men you said nothing about claimed the word was kept");
  if(O.gained.some(v=>v > 0))
    fails.push(`a pair bout between two other men paid \`kept\` (gained ${O.gained.join("/")})`);

  /* ---- 6. both surfaces, and only when they should speak ---- */
  lines.push(`6. surfaces: a calendar row at week ${S.calWeek} (sworn at ${S.at}, +${out.win}) `
    + `· agenda with no pair on the card ${S.agQuiet} · with one ${S.agLoud}: "${S.agLabel}"`);
  if(S.cal !== 1)
    fails.push(`the standing word puts ${S.cal} rows on the calendar — the block headed "what you `
      + `have promised, or been told" is where every other dated promise in this game already is`);
  if(S.calWeek != null && S.calWeek !== S.at + out.win)
    fails.push(`the calendar row is pinned to week ${S.calWeek} and the word runs out at ${S.at + out.win}`);
  if(S.agQuiet !== 0)
    fails.push("the agenda names the word on a week with no pair bout on the card — #101's wallpaper fault");
  if(S.agLoud !== 1)
    fails.push(`the agenda said ${S.agLoud} things on the one week the word CAN be kept`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
