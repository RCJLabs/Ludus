/* THE INSTRUMENTS ARE INSTRUMENTS — a gate over test/, not over the game.

   Two hundred and four checks hold the game. Until this one, **nothing held the things that
   measure it**, and the five releases before this were all about instruments being wrong:

     #285  `depth.mjs` called `A.endWeek(d)` after `R.lanista(...)`. The rope ends its own week
           (`fin(A.endWeek,[d])`, harness.mjs), so every iteration played a week and then ran a
           second, EMPTY one — the player acting every other week and the weekly bill landing twice
           per action. Thirteen probes and two checks had it. #282's headline was published off it
           for eight releases: median house life read 51w against a true 317w.
     #286  a screen inventory that did not exist, so two proposals were made about screens the game
           had shipped for years.
     #287  `wagons.mjs` quoted five figures in its header that it no longer produced.
     #288  `depth.mjs` counted 28 events in its denominator that are never drawn by the die.
     #289  a distinct-shape count read as a count of writing.

   A gate cannot catch the last two: they are category errors and want a reader. It CAN catch the
   first and the shape of the third, and those are the two that ran longest undetected — because a
   probe that works is a probe nobody reads.

   THREE ARMS, each a fault this project actually had:

     1  the double-step — `R.lanista` and `endWeek` in one loop
     2  every instrument parses, because probes never run in the gate and can rot unseen
     3  a probe's own `miss` guard names only things the handle really exports, so a probe cannot
        refuse to run for a reason that reads like a finding
     4  a probe that takes an ARM from the command line prints which arm it ran, because a number
        without its policy beside it cannot be compared to anything

   THIS CHECK TOUCHES NO BROWSER AND NO GAME STATE. It reads files. If it is ever slow, it is
   wrong. */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const name = "tools";
export const describe = "the instruments that measure the game are themselves held to something";

const DIRS = ["test/checks", "test/probes"];
const files = () => DIRS.flatMap(d => readdirSync(d)
  .filter(f => f.endsWith(".mjs"))
  .map(f => ({ rel: `${d}/${f}`, path: join(d, f) })));

/* comments are where this file names its own dead patterns on purpose — strip them before
   looking for a pattern, or the prose describing a fault counts as the fault. (`promise.mjs`
   learned this the hard way: see its census note on apostrophes.) */
const noComments = src => src
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

export async function run() {
  const lines = [];
  const bad = [];
  const F = files();

  /* ---- ARM 1: THE DOUBLE-STEP ---- */
  {
    const hits = [];
    for (const f of F) {
      const src = noComments(readFileSync(f.path, "utf8")).split("\n");
      for (let i = 0; i < src.length; i++) {
        if (!/\bR\.lanista\s*\(|\blanista\s*\(\s*d\b/.test(src[i])) continue;
        for (let j = i + 1; j < Math.min(src.length, i + 5); j++) {
          if (/\bendWeek\s*\(/.test(src[j])) { hits.push(`${f.rel}:${i + 1}`); break; }
        }
      }
    }
    if (hits.length)
      bad.push(`${hits.length} place${hits.length === 1 ? "" : "s"} step the week twice — `
        + `\`R.lanista\` ends its own week and these call \`endWeek\` after it, so the player acts `
        + `every other week: ${hits.slice(0, 4).join(", ")}`);
    lines.push(`the double-step (#285): ${hits.length} of ${F.length} instruments — `
      + `${hits.length ? "REGRESSED" : "none, and fifteen were fixed in v3.281.0"}`);
  }

  /* ---- ARM 2: EVERY INSTRUMENT PARSES ----
     Checks are run by the gate and so cannot rot unseen. PROBES ARE NEVER RUN BY ANYTHING, so a
     probe broken by an edit stays broken until somebody reaches for it — which is exactly when
     they least want to debug it. esbuild is already a dependency and parses without executing;
     importing them would run browsers. */
  {
    const esbuild = await import("esbuild");
    let broke = 0;
    for (const f of F) {
      const src = readFileSync(f.path, "utf8");
      try { await esbuild.transform(src, { loader: "js", format: "esm" }); }
      catch (e) {
        broke++;
        bad.push(`${f.rel} does not parse — ${String(e.message || e).split("\n")[0].slice(0, 90)}`);
      }
    }
    lines.push(`every instrument parses: ${F.length - broke} of ${F.length}`);
  }

  /* ---- ARM 3: A `miss` GUARD THAT NAMES SOMETHING REAL ----
     Nearly every probe opens with `const miss = [...].filter(k=>A[k]==null)` and refuses to run if
     anything is missing. A typo or a stale name there makes the probe print
     "the handle is missing X" — which reads like a finding about the game and is a fault in the
     probe. The handle's own key list is read out of the export block in `src/ludus.jsx`. */
  {
    const L = readFileSync("src/ludus.jsx", "utf8").split("\n");
    const a = L.findIndex(l => /window\.__LVDVS = \{/.test(l));
    let b = a;
    while (b < L.length && !/^  \};\s*$/.test(L[b])) b++;
    const keys = new Set();
    let inC = false;
    for (let raw of L.slice(a + 1, b)) {
      let l = raw;
      if (inC) { const e = l.indexOf("*/"); if (e < 0) continue; l = l.slice(e + 2); inC = false; }
      for (;;) {
        const x = l.indexOf("/*"); if (x < 0) break;
        const y = l.indexOf("*/", x + 2);
        if (y < 0) { l = l.slice(0, x); inC = true; break; }
        l = l.slice(0, x) + l.slice(y + 2);
      }
      if (!/^    [A-Za-z_$]/.test(l)) continue;
      for (const part of l.split(",")) {
        const m = part.match(/^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*(:|$)/);
        if (m) keys.add(m[1]);
      }
    }

    if (keys.size < 400) {
      bad.push(`the handle's export block read as only ${keys.size} keys — the reader is broken, `
        + `and a broken reader here would pass this arm by finding nothing`);
    } else {
      let guards = 0, ghosts = 0;
      for (const f of F) {
        const src = noComments(readFileSync(f.path, "utf8"));
        for (const m of src.matchAll(/const\s+(?:miss|NEED)\s*=\s*\[([^\]]*)\]/g)) {
          guards++;
          for (const q of m[1].matchAll(/["']([A-Za-z_$][A-Za-z0-9_$]*)["']/g)) {
            if (keys.has(q[1])) continue;
            ghosts++;
            /* WHICH FAULT IT IS DEPENDS ON WHETHER THE PROBE ACTUALLY USES THE NAME, and the
               first cut of this arm did not check. It reported that `orphans.mjs` "would refuse
               to run" on a probe that runs fine and prints a false alarm instead — an over-claim
               in a check written to catch over-claims. Both cases are faults; they are not the
               same fault and the message has to say which. */
            const used = new RegExp(`[.\\[]\\s*["']?${q[1]}\\b`).test(src.replace(m[0], ""));
            bad.push(used
              ? `${f.rel} guards on \`${q[1]}\` and uses it — the handle does not export it, so `
                + `the probe cannot work`
              : `${f.rel} guards on \`${q[1]}\` and never uses it — a stale guard against a key `
                + `the handle does not export, so every run prints "handle is missing ${q[1]}", `
                + `which reads as a finding about the game`);
          }
        }
      }
      lines.push(`handle guards: ${guards} lists checked against ${keys.size} exported keys · `
        + `${ghosts} name${ghosts === 1 ? "" : "s"} the handle does not have`);
    }
  }

  /* ---- ARM 4: A PROBE MUST SAY WHICH ARM IT RAN ----
     v3.287.0 re-took three probes and passed none of them their `[ref|most]` argument, so they ran
     the bare reference rope where `free` defaults FALSE. `bench` came back with "a freed man was
     waiting in 0.0% of weeks" against a published 68.4%, and that looked exactly like a shipped
     fix that had stopped working. It was the wrong arm.

     BE HONEST ABOUT WHAT THIS ARM WOULD AND WOULD NOT HAVE CAUGHT. `bench` DID print
     `under \`ref\`` on its first line; the figure was read through `tail` and the header was cut
     off. No regex fixes that — it is a discipline point and it belongs in the ROADMAP, not here.
     What this arm does close is the narrower case where a probe CANNOT tell you: it takes an arm
     from argv, branches on it, and never prints it. A number without its policy beside it cannot
     be compared to the number it is supposed to be compared to. */
  {
    let armed = 0, mute = 0;
    for (const f of F) {
      const src = noComments(readFileSync(f.path, "utf8"));
      const m = src.match(/const\s+([A-Z_][A-Z0-9_]*)\s*=\s*process\.argv\[\d+\]\s*\|\|\s*["'][a-z]+["']/);
      if (!m) continue;
      armed++;
      const v = m[1];
      /* IT MUST REACH AN OUTPUT LINE, AND THE NAME MAY CHANGE ON THE WAY.
         `credit.mjs` reads `WHO` from argv, hands it into the page, and prints it back as
         `out.who` — the arm IS named in the output, under a lowercased name. The first cut of this
         arm flagged it, which is a false positive in a check meant to be trusted; `faces.mjs`'s own
         header says a regex that is nearly right is worse than none, because it teaches you to
         ignore the thing. `perk.mjs` was the second false positive: it prints `${MODEWORD}`, the
         arm under a derived name. So the match is case-insensitive, leading-boundary only (MODE
         matches MODEWORD), and spans a multi-line console.log rather than stopping at the first
         `)` — a `.toFixed(1)` early in a template was hiding the arm named later in it. Three
         refinements, each driven by a verified false positive rather than by taste. */
      const printed = new RegExp(`console\\.log[\\s\\S]{0,400}?\\b${v}`, "i").test(src);
      if (!printed) {
        mute++;
        bad.push(`${f.rel} takes \`${v}\` from the command line and never prints it — its output `
          + `cannot say which arm produced the numbers, so they cannot be compared to anything`);
      }
    }
    lines.push(`probes that take an arm and name it: ${armed - mute} of ${armed}`);
  }

  lines.push(`${F.length} instruments held: ${DIRS.join(" + ")}`);
  return { pass: bad.length === 0, why: bad.slice(0, 4).join("; ") || null, lines };
}
