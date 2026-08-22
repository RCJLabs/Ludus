/* DOES THE LINE HAVE ROOM FOR WHAT CAN GO IN IT.

   `sand` caught this once, by accident, and could not catch it twice. It reported the pit row's
   second line cut off with 24px hidden — and then five clean runs in a row, because whether the
   fault shows depends on whether chance deals a long class name to a long house name that night.
   A check that finds a fault one run in six is not holding anything.

   So this one does not wait to be dealt the bad case. It composes the WIDEST LINE THE CONTENT
   SPACE ALLOWS — the longest class, the longest house name, a record in double figures, a kill
   count, the longest name against the longest nick — stamps it onto the men at the rope, and
   renders the panel. Reverting the wrap fails it every run, at 263px of room for 300px of line,
   37px of the man hidden, on all three men at the rope. Over 1,800 men dealt across 600 nights,
   110 of them (6.1%) lost some of that line.

   AND THE NAME LINE WAS NOT GUILTY. The scratch ruler that found this estimated the name's
   column at 175px and made it 6.6% as well; driven with the longest name against the longest
   nick, the name fits, and the revert run clips three spans, all of them the second line. The
   figure was the probe's. It is written down here because the note it came from is what this
   check replaces: a width estimated from arithmetic is a guess, and a width read off the
   element is a measurement.

   THE TABLES, NOT A SAMPLE. The first version of this drew 300 men to find the longest name and
   got a different answer each run — a probe setting its own bar by chance. It reads ORIGINS,
   NICKS, SMALL_HOUSES and CLASSES now, so the bar is the content space and not the draw.

   AND THE COUPLING, which is the part worth keeping. The menace word sits on the right of that
   line with flexShrink:0, so it takes its own width out of the span beside it. v2.71.0 gave the
   menace scale two more bands and its new top words are Murderous at 53px and Peerless at 40px
   where the old top word was Lethal at 31px. With the narrowest word on the right, 0 of the
   1,800 are cut off; with the widest, 110 are. A release spent on giving a scale more resolution
   took 22px out of the line next to it, and nothing in the suite connected the two. This check
   forces the widest word AND the widest line together, so the next time a scale gets a longer
   word the row it shares is measured with it. */

import { serve, open, found, endWeek, clearAll, tab, click, hasHandle } from "../harness.mjs";

export const name = "room";
export const describe = "the widest line the content space allows still fits the row it goes in";
export const slow = true;

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const lines = [], bad = [];

  await found(p);
  for(let w=0; w<3; w++){ if(!(await endWeek(p))) break; await clearAll(p); }
  await clearAll(p);

  const set = await p.evaluate(()=>{
    const A = window.__LVDVS; if(!A) return { why:"no handle" };
    let key=null, s=null;
    for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
      try { const x=JSON.parse(localStorage.getItem(k)); if(x&&x.gladiators){ key=k; s=x; } } catch(e){} }
    if(!s) return { why:"no save to set up" };
    s.gold = 40000; s.fame = 900;
    s.flags = s.flags || {}; s.flags.noLessons = 1;
    s.charter = { i:0, done:true, skipped:true };
    for(const l of A.LESSONS) (s.flags.learned = s.flags.learned || {})[l.id] = 1;
    while(A.activeG(s).length < 3 && !A.rosterFull(s)){
      const m=A.genGladiator(s,70); m.id=s.nextId++; m.status="active";
      m.kit=A.defaultKit(m.cls); m.fatigue=0; m.strain=0; m.lastFought=-9;
      s.gladiators.push(m);
    }

    /* THE WIDEST CONTENT THE SPACE ALLOWS, taken from the tables rather than invented — a name
       this check made up would prove nothing about the game. Every man at the rope gets it, so
       whoever the card deals is the worst case and the assertion does not depend on the draw. */
    const classes = Object.keys(A.CLASSES||{});
    const houses = A.SMALL_HOUSES || [];
    const names = Object.values(A.ORIGINS||{}).flatMap(o=>o.names||[]);
    const nicks = A.NICKS || [];
    if(!classes.length || !houses.length || !names.length || !nicks.length)
      return { why:"the name tables are not on the handle, so the widest line cannot be composed" };
    const longest = a => a.filter(Boolean).sort((x,y)=>y.length-x.length)[0] || "";
    const wCls = longest(classes), wHouse = longest(houses), wName = longest(names), wNick = longest(nicks);
    if(!(s.circuit||[]).length) return { why:"no circuit to stand at the rope" };
    for(const f of s.circuit){
      f.cls = wCls; f.house = wHouse; f.name = wName; f.nick = wNick;
      f.wins = 12; f.losses = 12; f.kills = 9;
      f.injury = null;
      /* and the widest word the menace scale can say. It reads the mean of the six stats, so
         drive the stats to the band rather than writing the word — the word is the game's. */
      for(const k of A.STATS) f[k] = 84;
    }
    localStorage.setItem(key, JSON.stringify(s));
    const one = s.circuit[0];
    return { why:null, wCls, wHouse, wName, wNick, word:A.menace(one),
      words:(A.MENACE_WORDS||[]).join("/"), n:s.circuit.length,
      l1:`${wName}, ${wNick}`,
      l2:`${wCls} · ${wHouse} · 12–12, 9 killed` };
  });
  if(set.why) return { pass:false, why:set.why, lines };

  lines.push(`the widest the content space allows: "${set.l1}" over "${set.l2}"`);
  lines.push(`  longest class "${set.wCls}" · longest house "${set.wHouse}" · ${set.n} men at the rope`);
  lines.push(`  and the menace word beside it forced to "${set.word}" (of ${set.words})`);
  if(!/Murderous|Peerless|Dangerous|Seasoned/.test(set.word))
    bad.push(`the stats meant to force a wide menace word read "${set.word}" instead — the scale `
      + `has moved and this check is now measuring the row against a narrow word`);

  /* ---- DO NOT WAIT AFTER WRITING A FIXTURE: THE APP IS STILL RUNNING ----
     This waited 950ms here, which is `waitSaved`'s job — to let the app's debounced autosave
     flush. That is exactly backwards after writing state by hand: the app holds its own S in
     memory, and during the wait its autosave writes that state OVER the fixture. Then the reload
     loads the app's house, not the forged one, and the sixteen men at the rope come back with
     their real names — which is why this check intermittently reported that the widest line was
     "not on the panel" when the panel was fine and the fixture had simply been clobbered.
     Every other check that forges state (sheet, arm, guards) writes and reloads at once. */
  await p.reload({ waitUntil:"domcontentloaded" });
  await p.waitForTimeout(1000);
  await click(p, /take up the keys/i);
  await p.waitForTimeout(1000);
  await clearAll(p, 14);
  await tab(p, "arena"); await p.waitForTimeout(320);
  await clearAll(p, 8);
  await tab(p, "arena"); await p.waitForTimeout(300);
  if(!(await click(p, /choose a bout/i)))
    return { pass:false, why:"the arena tab would not open the wizard", lines };
  await p.waitForTimeout(800);

  const got = await p.evaluate(()=>{
    const topWrap = () => {
      const ws=[...document.querySelectorAll(".modalwrap")]
        .map(w=>({z:+getComputedStyle(w).zIndex||50,w})).sort((a,b)=>b.z-a.z);
      return ws[0] && ws[0].w;
    };
    let w = topWrap(); if(!w) return { why:"the wizard did not open" };
    const row = [...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled)
      .find(x=>/the pits/i.test((x.innerText||"").replace(/\n/g," ")));
    if(!row) return { why:"the bill had no pits on it, which is meant to be always open" };
    row.click();
    return { why:null };
  });
  if(got.why) return { pass:false, why:got.why, lines };
  await p.waitForTimeout(700);

  /* choose one of our own men ONCE and then advance — clicking the same row twice deselects it,
     which is how the scratch version of this spun in the man-picking step forever */
  let picked = 0, steps = 0;
  for(let i=0;i<10;i++){
    const what = await p.evaluate(([n])=>{
      const ws=[...document.querySelectorAll(".modalwrap")]
        .map(w=>({z:+getComputedStyle(w).zIndex||50,w})).sort((a,b)=>b.z-a.z);
      const w=ws[0]&&ws[0].w; if(!w) return "gone";
      if([...w.querySelectorAll("button.btn-blood")].some(x=>!x.disabled)) return "ready";
      const adv=[...w.querySelectorAll("button.btn:not(.btn-ghost):not(.btn-blood)")]
        .filter(x=>!x.disabled && !/^(sound|pause|\d+×)/i.test((x.innerText||"").trim()))[0];
      if(n>0 && adv){ adv.click(); return "step"; }
      const rows=[...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled);
      if(rows[n]){ rows[n].click(); return "pick"; }
      if(adv){ adv.click(); return "step"; }
      return "stuck";
    }, [picked]);
    await p.waitForTimeout(420);
    if(what === "pick") picked++;
    else if(what === "step") steps++;
    else break;
  }

  /* AND NOW MEASURE THE PANEL. Every clipped span, named, with how much of it is gone — the
     same rule `surface` holds the six tabs to, applied to the one overlay whose content this
     check has driven to its widest. */
  const seen = await p.evaluate(([WANT1, WANT2])=>{
    const ws=[...document.querySelectorAll(".modalwrap")]
      .map(w=>({z:+getComputedStyle(w).zIndex||50,w})).sort((a,b)=>b.z-a.z);
    const w=ws[0]&&ws[0].w;
    if(!w) return { why:"no overlay to measure" };
    const rows = [...w.querySelectorAll("button.optrow")].map(x=>(x.innerText||"").replace(/\n/g," | ").slice(0,74));
    const clipped = [], measured = [];
    for(const e of w.querySelectorAll("div,span,button")){
      if(e.offsetParent === null || e.closest("[data-scrolls]")) continue;
      const t=(e.innerText||"").trim(); if(!t) continue;
      const cs=getComputedStyle(e);
      const bounded = /hidden|clip/.test(cs.overflowX) || cs.textOverflow === "ellipsis";
      if(!bounded || cs.overflowX==="auto" || cs.overflowX==="scroll") continue;
      measured.push(1);
      const over = e.scrollWidth - e.clientWidth;
      if(over > 1) clipped.push({ over, t:t.slice(0,44), cw:e.clientWidth, sw:e.scrollWidth });
    }
    const body = (w.innerText||"").replace(/\s+/g," ");
    const norm = s => s.replace(/[–—]/g,"-").replace(/\s+/g," ").trim();
    const ropeRow = [...w.querySelectorAll("button.optrow")]
      .find(x=>/·/.test(x.innerText||"")) || null;
    return { why:null, rows, clipped, measured:measured.length,
      isPits:/THE PITS/i.test(body),
      hasL1: norm(body).includes(norm(WANT1)), hasL2: norm(body).includes(norm(WANT2)),
      rowH: ropeRow ? Math.round(ropeRow.getBoundingClientRect().height) : 0,
      buttons:[...w.querySelectorAll("button")].map(x=>
        `${x.disabled?"[x]":""}${(x.className||"").toString().split(/\s+/).join(".")}:${(x.innerText||"").split("\n")[0].trim().slice(0,20)}`).slice(0,10) };
  }, [set.l1, set.l2]);
  if(seen.why) return { pass:false, why:seen.why, lines };

  if(!seen.isPits){
    /* say what IS on the screen — "the panel was not there" is a shrug, and most of this
       project's faults so far have been the probe's */
    bad.push(`the pits panel never came up after ${picked} pick${picked===1?"":"s"} and ${steps} step`
      + `${steps===1?"":"s"} — on screen: ${seen.buttons.join(" · ")}`);
  } else {
    for(const r of seen.rows) lines.push(`  at the rope: ${r}`);
    lines.push(`${seen.measured} bounded span${seen.measured===1?"":"s"} on the panel, ${seen.clipped.length} cut off`);
    for(const c of seen.clipped)
      bad.push(`"${c.t}" is cut off, ${c.over}px hidden (${c.cw}px of room for ${c.sw}px of line) — `
        + `the widest thing the content space allows does not fit the row it goes in`);

    /* AND THE POSITIVE HALF, because the clip count above is now zero and a check that passes
       on an empty measurement is the fault this project keeps finding in its own probes. The
       wrap took the bounded spans away, so nothing is left to measure — so assert instead that
       the whole line is ON the panel. That cannot pass by absence, and it also catches the
       other way of making a line fit, which is to cut the text in JS before it is rendered. */
    if(!seen.hasL2)
      bad.push(`the panel does not carry the man's whole line — "${set.l2}" is not on it, so it `
        + `has been shortened somewhere before it was drawn`);
    if(!seen.hasL1)
      bad.push(`the panel does not carry the man's whole name — "${set.l1}" is not on it`);
    if(seen.hasL1 && seen.hasL2)
      lines.push(`  and the whole of both lines is on the panel, ${seen.rowH}px tall to hold them`);
  }

  const fails = [...bad];
  if(errors.length) fails.push(`${errors.length} page errors: ${errors.slice(0,2).join(" · ")}`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
