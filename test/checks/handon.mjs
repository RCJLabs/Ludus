/* STEPPING DOWN WHILE THE HOUSE STANDS — #318.

   (`handon` was free in both directories; `stepdown` is the probe that set the gate, and was checked
   free before it was written.)

   A house that stayed in Capua and prospered had no way to finish: the handover opened only at 62,
   290-500 weeks in, and 57% of careful staying houses were still running at week 420. `canStepDown`
   opens the same handover early, on ten years at the head, the rank of Eques and a house clear of
   trouble, and `probes/stepdown.mjs` is what chose those terms.

     1  the gate: open on a clear house, and shut by each term alone, each named in its own words
     2  the handover: asked early it is the 62-year handover marked early, and both of its doors work;
        the long tenure and a death read as they did
     3  the week: the first week it opens the chronicle says so once, and the week's list for a month
     4  the reference player's `stepDown` lever takes it, both ways
     5  on screen: the lanista's tile and sheet show it, and stepping down reaches the ending with
        nothing left open over it */
import { found, clearAll, forge, settle, tab, installRope } from "../harness.mjs";

export const name = "handon";
export const describe = "a lanista can hand the house on early once it has proved itself, and it can end there by his choice";

export async function run({ p, errors }){
  const fails = [], lines = [];
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["STEP_DOWN","stepDownNeed","canStepDown","stepDownNow","succSays","endTheLine","takeUpTheHouse","nameHeir",
      "lanistaWeek","agenda","OVER_TEXT","lawOf","domusOf","HEIR_AGE","newGameState"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    if(!R || typeof R.lanista !== "function") return { why:"the reference player is not installed" };
    const clear = () => { const d = A.newGameState("Hn", "clean", "HANDON-1", null);
      d.week = 200; d.pendingEvent = null; d.gold = 3000; d.loan = null; d.lanista.since = 1; d.lanista.age = 51;
      if(!d.rise) d.rise = { rank:0 }; d.rise.rank = A.STEP_DOWN.rung; A.nameHeir(d, "nephew"); return d; };
    const out = { gate:A.STEP_DOWN };
    { const d = clear(); out.clear = { can:A.canStepDown(d), need:A.stepDownNeed(d) }; }
    const one = (why, f) => { const d = clear(); f(d); return { why, can:A.canStepDown(d), need:A.stepDownNeed(d) }; };
    out.terms = [
      one("no heir", d=>{ d.heir = null; }),
      one("a son of eight", d=>{ const k = A.domusOf(d); k.children.push({ id:"kid1", name:"Marcus", born:d.week - 8*18 }); d.heir = { kind:"son", name:"Marcus", cid:"kid1", named:d.week }; }),
      one("nine years at the head", d=>{ d.week = 150; }),
      one("a rung short", d=>{ d.rise.rank = A.STEP_DOWN.rung - 1; }),
      one("in the red", d=>{ d.gold = -40; }),
      one("a lender's paper", d=>{ d.loan = { principal:500, owed:500, who:"x" }; }),
      one("an edict broken", d=>{ const L = A.lawOf(d); L.edicts = ["numbers"]; L.cap = 1; }),
      one("a ruin warned", d=>{ d.flags.ruinWarn = { banned:d.week - 1 }; }),
      one("a rising", d=>{ d.rebellion = { stage:1, leaderId:0 }; }),
      one("abroad", d=>{ d.city = { key:"pompeii", since:d.week }; }),
    ];
    out.closedDoors = [ (()=>{ const d = clear(); d.over = { kind:"debt" }; return A.stepDownNeed(d); })(),
                        (()=>{ const d = clear(); d.succession = { lan:"x", retire:true }; return A.stepDownNeed(d); })() ];
    /* refused on a house that is not clear, and it changes nothing */
    { const d = clear(); d.gold = -40; out.refused = { did:A.stepDownNow(d), succ:!!d.succession }; }
    /* 2 · asked, then ended */
    { const d = clear(), lan = d.lanista.name, heir = d.heir.name; const did = A.stepDownNow(d); const s = d.succession && Object.assign({}, d.succession);
      out.asked = { did, s, say:s && A.succSays(s) };
      A.endTheLine(d); out.ended = { over:d.over && Object.assign({}, d.over), title:d.over && A.OVER_TEXT[d.over.kind](d.over).title,
        text:d.over && A.OVER_TEXT[d.over.kind](d.over).text, lan, heir, bare:A.OVER_TEXT.oldAge({}).title }; }
    /* asked, then handed on */
    { const d = clear(), heir = d.heir.name, was = d.lanista.name; A.stepDownNow(d); A.takeUpTheHouse(d);
      out.handed = { gen:d.generation, lan:d.lanista && d.lanista.name, heir, was, succ:!!d.succession, over:!!d.over,
        forebear:(d.forebears||[]).slice(-1)[0] || null }; }
    out.old = A.succSays({ lan:"Old", age:63, years:20, retire:true }).title;
    out.dead = A.succSays({ lan:"Dead", age:58 }).title;
    /* 3 · the week */
    { const d = clear(); d.flags.stepDownAt = undefined; const logN = () => (d.log||[]).length;
      const n0 = logN(); A.lanistaWeek(d); const n1 = logN(); const at = d.flags.stepDownAt;
      const line = (d.log||[]).find(x=>/could hand it to/.test(x.text || x.t || String(x)));
      A.lanistaWeek(d); const n2 = logN();
      const row = w => { d.week = at + w; return (A.agenda(d)||[]).some(x=>x.label && /You could hand the house to/.test(x.label)); };
      out.week = { at, first:n1 - n0, again:n2 - n1, line:line ? (line.text || line.t || String(line)) : null, rows:[0,1,3,4,8].map(row),
        rowTab:(()=>{ d.week = at; const x = (A.agenda(d)||[]).find(y=>y.label && /hand the house/.test(y.label)); return x ? `${x.tab}${x.doc ? ":" + x.doc : ""}` : null; })() }; }
    /* 4 · the lever */
    const lever = mode => { const d = clear(); d.flags.stepDownAt = d.week;
      const did = R.lanista(d, { stepDown:mode, cells:false, buy:false, doctore:false, build:false, census:false, staff:false, school:false, rome:false, bout:false }) || {};
      return { stepped:did.steppedDown || 0, ended:did.endedTheLine || 0, over:d.over && d.over.kind, early:!!(d.over && d.over.early), gen:d.generation || 1 }; };
    out.lever = { end:lever("end"), heir:lever("heir") };
    return out;
  });
  if(r.why) return { pass:false, why:r.why, lines };

  /* ---- 1 · THE GATE ---- */
  lines.push(`the gate: ${r.gate.years} years at the head and rung ${r.gate.rung} · a clear house: open ${r.clear.can} (wants ${JSON.stringify(r.clear.need)})`);
  if(!r.clear.can) fails.push(`a clear house of ${r.gate.years} years and rung ${r.gate.rung} cannot step down: it wants ${(r.clear.need||[]).join(", ")}`);
  const expect = { "no heir":/^an heir named$/, "a son of eight":/^Marcus of age$/, "nine years at the head":/^1 more year at its head$/,
    "a rung short":/^the rank of Eques$/, "in the red":/^the box out of the red$/, "a lender's paper":/^the lender paid off$/,
    "an edict broken":/^every edict kept$/, "a ruin warned":/^no ruin hanging over it$/, "a rising":/^the cells quiet$/, "abroad":/^the house home in Capua$/ };
  for(const t of r.terms){
    lines.push(`   ${t.why.padEnd(24)} open ${t.can} · wants ${JSON.stringify(t.need)}`);
    if(t.can) fails.push(`${t.why} does not shut the door`);
    else if(!t.need || t.need.length !== 1 || !expect[t.why].test(t.need[0])) fails.push(`${t.why} is not named alone and in its own words: ${JSON.stringify(t.need)}`);
  }
  if(r.closedDoors.some(x=>x !== null)) fails.push("an ended house, or one already handing over, is offered the door");
  if(r.refused.did || r.refused.succ) fails.push("stepping down on a house that is not clear went through");

  /* ---- 2 · THE HANDOVER ---- */
  const s = r.asked.s || {};
  lines.push(`asked: ${r.asked.did} · handover retire ${s.retire} early ${s.early} heir "${s.heir}" · screen "${r.asked.say && r.asked.say.title}"`);
  if(!r.asked.did || !s.retire || !s.early) fails.push("asking does not raise the 62-year handover marked early");
  if(!r.asked.say || r.asked.say.title !== "THE HOUSE HANDED ON") fails.push("the handover screen for an early step-down is not its own");
  lines.push(`let it end with him: ${r.ended.over && r.ended.over.kind} early ${r.ended.over && r.ended.over.early} · "${r.ended.title}" · a bare call still reads "${r.ended.bare}"`);
  if(!r.ended.over || r.ended.over.kind !== "oldAge" || !r.ended.over.early) fails.push("ending it early is not `oldAge` marked early");
  if(r.ended.title !== "THE HOUSE HANDED ON" || !r.ended.text.includes(r.ended.lan) || !r.ended.text.includes(r.ended.heir)) fails.push("the ending does not tell the early step-down");
  if(r.ended.bare !== "THE LONG TENURE") fails.push("the long tenure's own title moved");
  lines.push(`handed on: generation ${r.handed.gen} · the chair to ${r.handed.lan} (heir ${r.handed.heir}) · a forebear ${r.handed.forebear ? JSON.stringify(r.handed.forebear).slice(0, 120) : "none"}`);
  if(r.handed.gen !== 2 || r.handed.lan !== r.handed.heir || r.handed.succ || r.handed.over) fails.push("handing on early does not seat the heir and go on");
  lines.push(`the other two screens: at 62 "${r.old}" · a death "${r.dead}"`);
  if(r.old !== "THE LONG TENURE" || r.dead !== "THE HOUSE GOES ON") fails.push("the long tenure or a death no longer reads as it did");

  /* ---- 3 · THE WEEK ---- */
  const W = r.week;
  lines.push(`the week: marked at ${W.at} · chronicle lines ${W.first} then ${W.again} · "${(W.line||"").slice(0, 110)}…" · the list at +0,+1,+3,+4,+8: ${W.rows.join(",")} -> ${W.rowTab}`);
  if(W.at == null || W.first < 1 || W.again !== 0 || !W.line) fails.push("the week the door opens is not written down once");
  if(W.rows.join(",") !== "true,true,true,false,false") fails.push("the week's list does not carry it for a month and then let it go");

  /* ---- 4 · THE LEVER ---- */
  lines.push(`the lever: "end" ${JSON.stringify(r.lever.end)} · "heir" ${JSON.stringify(r.lever.heir)}`);
  if(!r.lever.end.stepped || r.lever.end.over !== "oldAge" || !r.lever.end.early) fails.push("`stepDown:\"end\"` does not end the house early");
  if(!r.lever.heir.stepped || r.lever.heir.over || r.lever.heir.gen !== 2) fails.push("`stepDown:\"heir\"` does not hand the house on");

  /* ---- 5 · ON SCREEN ---- */
  const shown = await (async () => {
    await found(p, { seed:"HANDON-UI" }); await clearAll(p, 8);
    const planted = await forge(p, (A) => { const d = A.newGameState("Hn","clean","HANDON-UI",null); d.week = 200; d.pendingEvent = null; d.gold = 3000; d.loan = null;
      d.lanista.since = 1; d.lanista.age = 51; if(!d.rise) d.rise = { rank:0 }; d.rise.rank = A.STEP_DOWN.rung; A.nameHeir(d, "nephew");
      return { plant:d, heir:d.heir.name }; });
    await clearAll(p, 8);
    await tab(p, "villa"); await p.waitForTimeout(300); await clearAll(p, 4);
    await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>(x.innerText||"").trim().toUpperCase()==="THE HOUSE"); if(b) b.click(); });
    await p.waitForTimeout(350);
    await p.evaluate(()=>{ const h=[...document.querySelectorAll("button,[role=button],summary")].find(x=>/records & annals/i.test(x.innerText||"") && (x.innerText||"").length < 160); if(h) h.click(); });
    await p.waitForTimeout(300);
    const tile = await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>/^The Lanista/i.test((x.innerText||"").trim())); if(b){ const t=(b.innerText||"").replace(/\s+/g," "); b.click(); return t; } return null; });
    await settle(p); await p.waitForTimeout(300);
    const panel = await p.evaluate(()=>{ const x = document.querySelector("[data-stepdown]"); return x ? { st:x.dataset.stepdown, text:(x.innerText||"").replace(/\s*\n+\s*/g, " · ") } : null; });
    const pressed = await p.evaluate(()=>{ const b=[...document.querySelectorAll("[data-stepdown] button")].find(x=>/step down/i.test(x.innerText||"")); if(b){ b.click(); return true; } return false; });
    await p.waitForTimeout(350);
    const confirmed = await p.evaluate(()=>{ const b=[...document.querySelectorAll(".modalwrap button")].find(x=>/^Hand the house to/i.test((x.innerText||"").trim())); if(b){ b.click(); return true; } return false; });
    await settle(p); await p.waitForTimeout(350);
    const hand = await p.evaluate(()=>{ const m=[...document.querySelectorAll(".modalwrap")].pop(); return m ? (m.innerText||"").replace(/\s*\n+\s*/g, " · ").slice(0, 160) : null; });
    await p.evaluate(()=>{ const b=[...document.querySelectorAll(".modalwrap button")].find(x=>/Let it end with him/i.test(x.innerText||"")); if(b) b.click(); });
    await settle(p); await p.waitForTimeout(450);
    const top = await p.evaluate(()=>{ const ms=[...document.querySelectorAll(".modalwrap")]; const vis = ms.filter(m=>{ const b=m.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
      const z = m => +(getComputedStyle(m).zIndex || 0) || 0; const t = vis.sort((a,b)=>z(b)-z(a))[0];
      return { n:vis.length, text: t ? (t.innerText||"").replace(/\s*\n+\s*/g, " · ").slice(0, 120) : null, sheet: vis.some(m=>/^THE LANISTA/i.test((m.innerText||"").trim())) }; });
    return { planted, tile, panel, pressed, confirmed, hand, top };
  })();
  lines.push(`on screen: tile "${shown.tile}" · panel ${shown.panel ? `${shown.panel.st}: ${shown.panel.text.slice(0, 120)}` : "NONE"}`);
  lines.push(`   pressed ${shown.pressed} · confirmed ${shown.confirmed} · the handover: "${shown.hand}"`);
  lines.push(`   after "Let it end with him": ${shown.top.n} open · on top "${shown.top.text}" · the sheet still open ${shown.top.sheet}`);
  if(!/free to step down/.test(shown.tile || "")) fails.push("the lanista's tile does not say he is free to step down");
  if(!shown.panel || shown.panel.st !== "open") fails.push("the lanista's sheet does not offer the door on a clear house");
  if(!shown.pressed || !shown.confirmed) fails.push("the door or its confirm could not be pressed");
  if(!/^THE HOUSE HANDED ON/.test(shown.hand || "")) fails.push("stepping down does not bring up the handover");
  if(shown.top.sheet) fails.push("the lanista's sheet is left open over the ending");
  if(!/^THE HOUSE HANDED ON/.test(shown.top.text || "")) fails.push("the ending is not what is on the screen");

  if(errors && errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
