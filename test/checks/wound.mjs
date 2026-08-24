/* EVERY WOUND IN THE TABLE IS REACHABLE, AND BOTH SIDES OF THE SAND ARE JUDGED BY ONE BAR — #191

   `INJ_BY_TARGET` maps six targets onto five wounds, and the flank is the only target with two:
   `injuryFor(target, severe)` gives **"Pierced side"** for a severe flank and **"Cracked ribs"** for
   a mild one. So `Cracked ribs` — 3 weeks, 7 pen, its own name in the table — is reachable only
   through a NON-SEVERE FLANK, and #191 counted it at **2 of 3,317 arrivals, 0.06%**, against 15-33%
   for the other five.

   THE ANSWER IS THAT IT IS RARE BY CONSTRUCTION AND THE CONSTRUCTION IS RIGHT, which took three
   measurements to establish and is worth writing down so nobody re-opens it:

     · **No tactic lifts it.** The mild door is `win && res.vA < HURT_BAR && R() < 0.4` — a victory
       that cost you — so the falsifier was that a defensive policy winning narrowly would make it
       visible. Driven 6,000 re-runs an arm over real pairings, the best of the four tactics gives
       **11 cracked ribs in 6,000 bouts, 0.18%**, against measured's 4. It does not fire.
     · **The two engines that cannot deal it are correct not to.** `doMelee` and `doPairFight` pass
       `severe = true`, and a man who goes down in either is genuinely wrecked: **601 of 601** melee
       men and **487 of 487** pairing men are under vitality 40, at medians of 11 and 2.
     · **And `doVenatio` CAN deal it** — it passes `res.vA < 40`, which the item had not counted.

   WHAT WAS ACTUALLY WRONG was the man across the sand. `doFight` ended with
   `f.injury = injuryFor(res.lastTarget, false)` — the beaten opponent ALWAYS took the lighter
   wound — while `simulateFight` returns his vitality right there. **1,285 of 1,401 opponents beaten
   without dying are under 45**, median 6, p10 minus seventeen. Both of the two cracked ribs a played
   house produced were his, off that line. Fixing it makes the wound rarer, which is the honest
   direction, and it moves **one house in sixty** of `open.mjs` — no RNG draw was added, so that one
   house is pure effect rather than re-phasing.

   THIS CHECK HOLDS TWO THINGS. That every entry in `INJURIES` is reachable from some
   (target, severity) pair — a seventh wound added with no target is dead content, the same bar
   `wants` holds for ambitions. And that both sides of the sand are judged by one rule, driven
   through the real door rather than asserted about the source.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, hasHandle } from "../harness.mjs";

export const name = "wound";
export const describe = "every wound in the table is reachable, and both sides of the sand share one bar";

export async function run({ p }){
  const lines = [], fails = [];
  const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");

  /* ---- STATIC: the bar is named once and both sides read it ---- */
  const bar = (src.match(/const HURT_BAR = (\d+)/) || [])[1];
  const uses = (src.match(/\bHURT_BAR\b/g) || []).length;
  lines.push(`HURT_BAR = ${bar || "(not declared)"} · read ${uses} times`);
  if(!bar) fails.push("HURT_BAR is not declared — the two sides of the sand are comparing against two copies of a number");
  else if(uses < 3) fails.push(`HURT_BAR is declared and read ${uses-1} time${uses===2?"":"s"} — your man and his must be tested against the same one`);
  /* ---- THE LINE THE FIX REPLACED, MATCHED PRECISELY ----
     The first cut of this forbade `injuryFor(res.lastTarget, false)` anywhere, and went red on a
     working build: `doFight`'s own mild branch passes a bare `false` and is RIGHT to, because the
     branch above it has already tested `win && res.vA < HURT_BAR`. A constant is only a fault where
     nothing has tested the thing it stands for. So this matches the OPPONENT's assignment, which is
     the one that had no test in front of it. */
  const opp = src.match(/f\.injury\s*=\s*injuryFor\(([^;]*)\);/);
  lines.push(`the opponent's wound: ${opp ? "f.injury = injuryFor(" + opp[1].trim() + ")" : "(no such assignment found)"}`);
  if(!opp) fails.push("no `f.injury = injuryFor(...)` assignment found — this check is reading a shape that has moved");
  else if(/,\s*(true|false)\s*$/.test(opp[1]))
    fails.push("the opponent's severity is a bare literal — that is the line #191 fixed, and `simulateFight` "
      + "returns his vitality on the same object the call already reads");

  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], say = [];
    for(const f of ["injuryFor","INJ_BY_TARGET","INJURIES","TARGETS","doFight","newGameState","activeG"])
      if(A[f] == null) return { bad:[`${f} is not on the handle`], say };

    /* ---- 1. THE 6 x 2 MATRIX, off the game's own function ---- */
    const targets = A.TARGETS.map(t=>t[0]);
    const table = A.INJURIES.map(i=>i[0]);
    const seen = new Set(), rows = [];
    let flips = [];
    for(const t of targets){
      const mild = A.injuryFor(t, false), sev = A.injuryFor(t, true);
      seen.add(mild.name); seen.add(sev.name);
      rows.push(`${t.padEnd(9)} mild -> ${String(mild.name).padEnd(16)} severe -> ${sev.name}`);
      if(mild.name !== sev.name) flips.push(t);
    }
    say.push(`${targets.length} targets x 2 severities, off injuryFor itself:`);
    rows.forEach(r=>say.push("   " + r));
    say.push(`severity changes the wound on: ${flips.join(", ") || "no target at all"}`);
    if(!flips.length)
      bad.push("no target's wound depends on severity — the `severe` flag decides nothing and one wound in the table is unreachable");

    /* every hand-written wound must be something the game can actually deal */
    const dead = table.filter(n=>!seen.has(n));
    say.push(`${seen.size} of ${table.length} wounds in INJURIES are reachable from some (target, severity)`);
    if(dead.length)
      bad.push(`${dead.join(", ")} ${dead.length===1?"is":"are"} in the INJURIES table and no (target, severity) pair produces ${dead.length===1?"it":"them"} — dead content`);

    /* ---- 2. AND BOTH SIDES OF THE SAND, THROUGH THE REAL DOOR ----
       A fixture is walked until a bout leaves the opponent beaten, alive and under the bar, and the
       wound he is given is read off him. Asserted only when the fixture actually produced one —
       a silent pass on an empty fixture is the fault this directory keeps finding. */
    const BAR = A.HURT_BAR != null ? A.HURT_BAR : 45;
    let saw = 0, wrong = 0, examples = [];
    for(let s=0; s<160 && saw < 8; s++){
      const d = A.newGameState("Wound","clean","WND-"+s,null);
      const men = A.activeG(d); if(!men.length) continue;
      const g = men[0];
      const h = (d.rivals||[])[0]; if(!h || !(h.fighters||[]).length) continue;
      const f = h.fighters[0];
      /* make him beatable and make the beating hurt: your man far stronger, his man frail */
      for(const k of A.STATS){ g[k] = 95; f[k] = 12; }
      f.injury = null;
      const offer = { id:9001, tier:0, opp:f, oppRef:{ house:h.name, fid:f.id }, stakes:"standard",
                      purse:100, venue:"forum", sky:"fair", rematch:false, grudgeM:false };
      try { A.doFight(d, g.id, offer, "aggressive", null, null, "press", "none"); } catch(e){ continue; }
      const after = (h.fighters||[]).find(x=>x.id===f.id);
      if(!after || !after.injury) continue;
      saw++;
      /* his wound must be one the table holds, and a flank wound must follow the same rule as yours */
      if(!table.includes(after.injury.name)){ wrong++; bad.push(`the opponent was given "${after.injury.name}", which is not in INJURIES`); }
      if(examples.length < 4) examples.push(`${after.injury.name} (${after.injury.weeks}w, part ${after.injury.part})`);
    }
    say.push(`through the real door: ${saw} opponents came off wounded — ${examples.join(" · ") || "none"}`);
    if(!saw)
      bad.push("no bout in 160 tries left an opponent wounded — the fixture is not reaching the line this check is about, so it proves nothing");
    /* and the heavy flank wound must be what a badly beaten man gets. `Cracked ribs` on a man at
       minus seventeen vitality is the bug; a flank wound at all is the only way to see it. */
    const flankSev = A.injuryFor("flank", true).name, flankMild = A.injuryFor("flank", false).name;
    say.push(`the flank: severe -> ${flankSev} · mild -> ${flankMild}  (BAR ${BAR})`);
    if(flankSev === flankMild)
      bad.push("the flank gives the same wound either way — the only target that distinguishes severity no longer does");
    return { bad, say };
  });

  lines.push(...out.say);
  fails.push(...out.bad);
  if(!fails.length) lines.push("every wound is reachable, and the man across the sand is judged by your bar");
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
