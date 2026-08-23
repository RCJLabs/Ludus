/* A GATE THAT WAS SHUT WHEN HE ARRIVED IS RE-TESTED WHEN IT OPENS — #189

   `ambPool` gates three of the seven keys on the man himself: `champion` on `potential >= 62`,
   `nickname` on not already carrying one, `revenge` on carrying a scar. Until v3.121.0 the pool was
   built once, the week he was made — the one moment in his life he is least likely to pass any of
   them, because a man off the block is unscarred and unassessed. Over 12 houses x 420 weeks on two
   seeds and two policies: **`revenge` 2.7-2.9% of every ambition given and `champion` 3.7-5.8%,
   against 14-20% each for the four ungated kinds.**

   The revenge gate is not shut, it is UNWATCHED: of the men it was shut for — 73-79% of everyone —
   **54-58% walk through it later**, at a median age of 24 in every arm, and **76-84% of those
   crossings happen while the man has still not said a word.** The line the table wrote for him is
   *"He touches the scar while he says it and does not notice he is doing it"*, and before this the
   only men who could ever say it were the ones who arrived already marked, in another house.

   THE BAR THIS HOLDS IS THE SHAPE, NOT THE KEY: a gate that can COME OPEN during a man's life must
   be re-tested when it does, and a want he has already stated must never move. The first half is
   general over `ambPool` — a fourth gated key added later is red here until somebody either gives
   it a re-test or writes down why its gate can only ever shut. The second is driven, on the tick
   and through the real weekly sweep, because "he never speaks after a turn" is the half that keeps
   the fix honest: `SECT.wants` shows the line from his first week under the words "He has not
   mentioned it", so the interior may change and the stated want may not.

   WHAT IS DELIBERATELY NOT ASSERTED: that `champion` moves. Its gate opens 0, 0, 0 and 2-4 times
   in the same four arms — the only lift a living man's potential gets is `DOC_LESSONS.potential`,
   behind a named pupil, and the reference player had never named one in the history of this
   project. The hook is there so the property holds at every gate; the check drives it directly
   rather than pretending the sim produces it.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, hasHandle } from "../harness.mjs";

export const name = "turn";
export const describe = "a gate that opens later is re-tested, and a want he has spoken never moves";

/* the prose above names the identifiers it guards, so the source is read with comments removed —
   `copies.mjs`'s helper, and the reason `names.mjs` needed it too */
function strip(txt){
  const out = []; let inBlock = false;
  for(const raw of txt.split("\n")){
    let code = "";
    for(let j = 0; j < raw.length; j++){
      if(inBlock){ if(raw[j] === "*" && raw[j+1] === "/"){ inBlock = false; j++; } continue; }
      if(raw[j] === "/" && raw[j+1] === "*"){ inBlock = true; j++; continue; }
      if(raw[j] === "/" && raw[j+1] === "/") break;
      code += raw[j];
    }
    out.push(code);
  }
  return out;
}

/* A GATE THAT CAN ONLY EVER SHUT NEEDS NO RE-TEST, AND SAYING WHICH IS A JUDGEMENT.
   `nickname` is gated on `!g.nick`: a man gains a nick and never loses one, so the term goes
   true -> false and there is nothing to re-open. That is written here rather than in the game
   because it is a statement about the check's coverage, not a rule the game enforces — and it is
   written at all so that a FOURTH gated key cannot arrive without somebody classifying it. */
const SHUTS_ONLY = {
  nickname: "gated on !g.nick, which goes true->false as the crowd names him — the gate shuts, never opens",
};

export async function run({ p }){
  const lines = [], fails = [];
  const src = strip(fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8"));
  const flat = src.join("\n");

  /* ---- STATIC: every gate that can open has a re-test ---- */
  const poolBody = (flat.match(/const ambPool = g => AMB_KEYS\.filter\(k=>\{([\s\S]*?)\n\}\);/) || ["",""])[1];
  const gated = [...poolBody.matchAll(/if\(k==="(\w+)"\)/g)].map(m=>m[1]);
  const tbl = (flat.match(/const AMBITIONS = \{([\s\S]*?)\n\};/) || ["",""])[1];
  const keys = [...tbl.matchAll(/^  ([A-Za-z]+):\s*\{/gm)].map(m=>m[1]);
  if(!poolBody) fails.push("could not read `ambPool` — the filter has moved and this check is reading a shape that is gone");
  if(!keys.length) fails.push("could not read the AMBITIONS table");
  lines.push(`${keys.length} ambitions · ${gated.length} gated by ambPool [${gated.join(", ")}]`);

  for(const k of gated){
    const written = new RegExp(`^  ${k}:[\\s\\S]*?\\n  [A-Za-z]+:`, "m").test(tbl + "\n  zzz:")
      ? /\bturn\s*:/.test((tbl.split(new RegExp(`^  ${k}:`, "m"))[1] || "").split(/\n  [A-Za-z]+:\s*\{/)[0])
      : false;
    const hooked = new RegExp(`ambTurn\\([^)]*"${k}"\\)`).test(flat);
    const shuts = SHUTS_ONLY[k];
    lines.push(`  ${k.padEnd(9)} turn line ${written?"yes":"no "} · re-test hook ${hooked?"yes":"no "}${shuts?`  — declared shut-only: ${shuts}`:""}`);
    if(shuts){
      if(written || hooked) fails.push(`${k} is declared a gate that only ever shuts, but it has a turn line or a re-test — one of the two is wrong`);
      continue;
    }
    if(!written) fails.push(`${k}'s gate can come open and AMBITIONS.${k} has no \`turn\` line — the moment would pass unwritten`);
    if(!hooked) fails.push(`${k}'s gate can come open and nothing calls ambTurn(d, g, "${k}") — eligibility is still tested only at creation, which is #189`);
  }
  /* and the filter is used ONCE. Two copies of a predicate is how the pool and the re-test drift
     apart, and the whole point of extracting `ambPool` was that there is one. */
  const inlineFilter = (flat.match(/AMB_KEYS\.filter\(/g) || []).length;
  lines.push(`AMB_KEYS.filter( appears ${inlineFilter} time${inlineFilter===1?"":"s"} — the pool must have exactly one definition`);
  if(inlineFilter !== 1)
    fails.push(`the ambition pool is built in ${inlineFilter} places — the draw and the re-test must share one predicate or they drift`);

  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines };

  /* ---- DRIVEN ---- */
  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], say = [];
    for(const f of ["ambPool","ambTurn","giveAmbition","rngGet","rngSet","endWeek"])
      if(typeof A[f] !== "function") return { bad:[`${f} is not on the handle`], say };

    /* --- 1. the extracted predicate is the one the draw actually uses --- */
    const probe = { potential:70, nick:null, scars:[{part:"flank"}], ambition:null };
    const pool = A.ambPool(probe).slice().sort();
    const drawn = new Set();
    for(let i=0;i<400;i++){ A.giveAmbition(null, probe); drawn.add(probe.ambition.kind); }
    const got = [...drawn].sort();
    say.push(`ambPool on a scarred, well-assessed man: [${pool.join(" ")}] · 400 real draws produced [${got.join(" ")}]`);
    if(pool.join("|") !== got.join("|"))
      bad.push(`ambPool and giveAmbition disagree about the pool — [${pool.join(" ")}] against [${got.join(" ")}]`);

    /* --- 2. a silent man whose gate opens turns, at the rate the pool implies ---
       the seed is pinned so the count is the same on every run of this check on this build. */
    const d = A.newGameState("Turn","clean","TURN-1",null);
    d.week = 60;
    const trial = (mut) => {
      const g = { name:"Trial", potential:40, nick:null, scars:[], wins:0, losses:0,
                  morale:60, defiance:10, status:"active", id:9001, ambition:null };
      A.giveAmbition(d, g);
      while(g.ambition.kind === "revenge") A.giveAmbition(d, g);   /* he must not already have it */
      g.scars = [{ part:"flank" }];                                 /* the sand marked him */
      if(mut) mut(g);
      return A.ambTurn(d, g, "revenge") === true;
    };
    A.rngSet(20250823);
    let turned = 0; const N = 3000;
    for(let i=0;i<N;i++) if(trial(null)) turned++;
    const pl = A.ambPool({ potential:40, nick:null, scars:[{part:"flank"}] }).length;
    say.push(`${turned} of ${N} silent men turned when the scar landed — ${(turned/N*100).toFixed(1)}%, against 1/${pl} = ${(100/pl).toFixed(1)}%`);
    if(!turned) bad.push("no silent man ever turned — the re-test is not reachable and #189 is not fixed");
    /* the odds are the draw he would have got at creation, so they are not free to drift far */
    const want = 1/pl, seen = turned/N;
    if(Math.abs(seen - want) > 0.035)
      bad.push(`the turn fires at ${(seen*100).toFixed(1)}% where the pool implies ${(want*100).toFixed(1)}% — `
        + `the correction that makes an old draw into a new one is 1/|pool| and nothing else`);

    /* --- 3. and a want he has already stated NEVER moves --- */
    const guards = [
      ["voiced once",  g=>{ g.ambition.voiced = 1; }],
      ["pressed",      g=>{ g.ambition.voiced = 2; }],
      ["your word given", g=>{ g.ambition.voiced = 1; g.ambition.promised = true; }],
      ["already met",  g=>{ g.ambition.met = true; }],
      ["broken",       g=>{ g.ambition.broken = true; }],
      ["given up",     g=>{ g.ambition.despair = true; }],
      ["no scar yet",  g=>{ g.scars = []; }],
    ];
    for(const [what, mut] of guards){
      A.rngSet(20250823);
      let n = 0; for(let i=0;i<600;i++) if(trial(mut)) n++;
      say.push(`   ${what.padEnd(18)} turned ${n} of 600`);
      if(n) bad.push(`a man who is "${what}" turned ${n} times in 600 — ${what==="no scar yet"
        ? "the gate is not even open" : "a want he has stated is not the game's to change"}`);
    }

    /* --- 4. THROUGH THE REAL WEEKLY SWEEP, because a unit test of `ambTurn` proves the function
       and not the wiring. A man is put on the medicus' table one week from healing and `endWeek`
       is run; the sweep heals him, rolls for a scar, and — if one lands — is the call site. The
       seed is walked until a scar lands rather than assumed, and if none ever does the check says
       so instead of passing on an empty fixture. */
    let scarred = 0, turnedLive = 0, tries = 0;
    for(let s=0; s<400 && scarred < 12; s++){
      const dd = A.newGameState("Live","clean","LIVE-"+s,null);
      dd.week = 30;
      const men = A.activeG(dd); if(!men.length) continue;
      const g = men[0];
      g.scars = []; g.status = "injured";
      g.injury = { name:"Torn thigh", weeks:0.2, pen:9, part:"thigh", care:"rest" };
      A.giveAmbition(dd, g);
      while(g.ambition.kind === "revenge") A.giveAmbition(dd, g);
      g.ambition.voiced = 0; g.ambition.since = dd.week;
      const was = g.ambition.kind;
      tries++;
      try { A.endWeek(dd); } catch(e){ bad.push("endWeek threw: " + e.message); break; }
      if((g.scars||[]).length){ scarred++;
        if(g.ambition.kind === "revenge" && was !== "revenge") turnedLive++; }
    }
    say.push(`through the real sweep: ${tries} men put on the table, ${scarred} came off it marked, ${turnedLive} of those turned`);
    if(!scarred)
      bad.push("no man was ever scarred by the weekly sweep in 400 tries — the fixture is not reaching the call site, so this proves nothing");
    return { bad, say };
  });

  lines.push(...out.say);
  fails.push(...out.bad);
  if(!fails.length) lines.push("every gate that can open is re-tested, and nothing he has said out loud moves");
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
