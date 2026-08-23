/* EVERY AMBITION HAS A DOOR OF ITS OWN — #188

   Seven ambitions. Five name a moment that satisfies them — the rudis, the crowd's name, the Ludi
   Romani, a brother at his shoulder, the house that marked him — and each of those five has a line
   in the file that fires `ambitionMet` on that kind. Two do not: `nokill` is *"Never to be sent out
   sine missione"* and `nobeast` is *"Never to be put in front of an animal"*, and a promise made of
   ABSTINENCE has no event to fire on. Measured over four policies before the fix: **651 of them
   given and 0 ever met**, `nokill` broken 36 times and `nobeast` 6, and two written `met` lines no
   player had ever read.

   The reckoning is the despair tick, pointed the right way round: he asked, he pressed, twelve
   weeks went by, and — because doing the thing calls `ambitionBroken` on the spot and a broken
   ambition never reaches that loop — a man who arrives there with one of those two kinds has by
   construction not been sent out that way. The one bar is that he has been on a card at all.

   Two halves:

     STATIC   every key in `AMBITIONS` must have a door — either a line that fires `ambitionMet`
              on `kind==="<key>"`, or membership of `AMB_NEVER`, which is met by the clock. An
              EIGHTH ambition added later with neither goes red here rather than being handed out
              for years and never kept. This is the general shape of #188; the two keys are the
              instance.
     DRIVEN   `ambWeek` itself, on states built to sit exactly on the tick: the man who kept it is
              MET and the line he is given is the one written for his kind with his name in it; the
              man who never fought DESPAIRS, because a promise not to card him a particular way is
              not tested until he has been on a card; and a positive ambition despairs as it always
              did.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, hasHandle } from "../harness.mjs";

export const name = "wants";
export const describe = "every ambition has a door, and a promise of abstinence is kept by the clock";

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

export async function run({ p }){
  const lines = [], fails = [];
  const src = strip(fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8"));

  /* ---- STATIC: a door for every kind ---- */
  const tbl = src.join("\n").match(/const AMBITIONS = \{([\s\S]*?)\n\};/);
  const keys = tbl ? [...tbl[1].matchAll(/^  ([A-Za-z]+):\s*\{/gm)].map(m=>m[1]) : [];
  const never = (src.find(c=>/const AMB_NEVER\s*=/.test(c)) || "").match(/(\w+)\s*:/g) || [];
  const neverKeys = never.map(x=>x.replace(/\s*:$/,"")).filter(k=>k !== "const" && k !== "AMB_NEVER");
  if(!keys.length) fails.push("could not read the AMBITIONS table — this check is reading a shape that has moved");
  const doors = {};
  for(const k of keys){
    const own = src.some(c => c.includes(`kind==="${k}"`) && c.includes("ambitionMet"));
    doors[k] = own ? "its own" : neverKeys.includes(k) ? "the clock (AMB_NEVER)" : null;
  }
  lines.push(`${keys.length} ambitions · AMB_NEVER holds [${neverKeys.join(", ")}]`);
  for(const k of keys) lines.push(`  ${k.padEnd(9)} ${doors[k] || "*** NO DOOR ***"}`);
  const doorless = keys.filter(k => !doors[k]);
  if(doorless.length)
    fails.push(`${doorless.join(", ")} can be given to a man and never met — a door is a line that fires `
      + `ambitionMet on that kind, or a place in AMB_NEVER where the clock keeps it (#188)`);
  for(const k of neverKeys) if(!keys.includes(k))
    fails.push(`AMB_NEVER names \`${k}\`, which is not an ambition — the clock is keeping a promise nobody makes`);

  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines };

  /* ---- DRIVEN: the tick itself ---- */
  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], say = [];
    if(typeof A.ambWeek !== "function") return { bad:["ambWeek is not on the handle"], say };

    /* a man sitting exactly on the tick: asked, pressed, and twelve weeks of silence */
    const onTheTick = (kind, bouts) => {
      const d = A.newGameState("Wants","clean","WANTS-"+kind+bouts,null);
      d.week = 60;
      const g = A.activeG(d)[0];
      g.wins = bouts; g.losses = 0; g.status = "active";
      g.ambition = { kind, met:false, broken:false, voiced:2, since:d.week-12, promised:false, despair:false };
      d.log = [];
      A.ambWeek(d);
      return { d, a:g.ambition, g, said:(d.log||[]).map(x=>x.text).join(" | ") };
    };

    for(const kind of Object.keys(A.AMB_NEVER || {})){
      const kept = onTheTick(kind, 2);
      say.push(`${kind}: pressed, twelve weeks, two bouts → ${A.ambState(kept.g)}`);
      if(!kept.a.met) bad.push(`a man who asked for "${kind}" twice, was never sent out that way and had fought twice is ${A.ambState(kept.g)}, not met`);
      if(kept.a.despair) bad.push(`"${kind}" was met AND despaired in the same tick`);
      /* the line he is given is the written one, with his name in it where the table asks for it */
      const want = (A.AMBITIONS[kind].met || "").replace("${name}", kept.g.name);
      if(want && !kept.said.includes(want))
        bad.push(`"${kind}" was met but the chronicle does not carry its own met line — wanted "${want.slice(0,48)}…", got "${kept.said.slice(0,64)}"`);
      if(/\$\{name\}/.test(kept.said))
        bad.push(`"${kind}"'s met line reached the chronicle with \${name} still in it`);

      const raw = onTheTick(kind, 0);
      say.push(`${kind}: the same man having never fought → ${A.ambState(raw.g)}`);
      if(raw.a.met) bad.push(`a man who has never been on a card had "${kind}" met — a promise not to card him a particular way is not tested until he has been carded`);
      if(!raw.a.despair) bad.push(`a man who has never fought is ${A.ambState(raw.g)} at the tick — he should give up on it, as he always did`);
    }

    /* and a positive ambition still despairs, which is the control */
    { const pos = Object.keys(A.AMBITIONS).find(k => !(A.AMB_NEVER||{})[k]);
      const r = onTheTick(pos, 4);
      say.push(`${pos} (a positive ambition, four bouts) → ${A.ambState(r.g)}`);
      if(r.a.met) bad.push(`"${pos}" was met by the clock — only a promise of abstinence is kept by not doing a thing`);
      if(!r.a.despair) bad.push(`"${pos}" neither met nor despaired at the tick`); }

    /* A BROKEN ONE IS NEVER MET, WHICH IS WHAT MAKES THE CLOCK PROOF OF ABSTINENCE — and this
       assertion is defended TWICE, which was worth finding out rather than assuming. Taking the
       `a.broken` early-out off `ambWeek` alone leaves this GREEN, because `ambitionMet` refuses a
       broken ambition on its own first line. It goes red only with both gone. The property is the
       one that matters, so it is asserted here; the note is so nobody reads a green run as proof
       that `ambWeek`'s guard is what holds it. */
    { const kind = Object.keys(A.AMB_NEVER || {})[0];
      const d = A.newGameState("Wants","clean","WANTS-broken",null);
      d.week = 60;
      const g = A.activeG(d)[0]; g.wins = 4;
      g.ambition = { kind, met:false, broken:true, voiced:2, since:d.week-12, promised:false, despair:false };
      A.ambWeek(d);
      say.push(`${kind} already broken → ${A.ambState(g)}`);
      if(g.ambition.met) bad.push(`a BROKEN "${kind}" was met by the clock — the clock is no longer proof that you kept it`); }

    return { bad, say };
  });

  lines.push(...out.say);
  fails.push(...out.bad);
  if(!fails.length) lines.push("every ambition has a door, and the two kept by not doing a thing are kept by the clock");
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
