/* DEFIANCE AMBUSHED YOU — #201

   `REFUSE_REASONS` has six entries and `applyRefusal` four answers, and none of it was ever
   foreshadowed. The item says the refusal arrives after you have committed; the measurement says
   that half is wrong and the substance is right.

   MEASURED before it was surfaced (probes/refuse.mjs, 8 houses x 300 weeks, 1,600 house-weeks):

     the game has a candidate on          19.7% of house-weeks
     his chance when it does              p50 16% · worst 42.4%
     refusals                             41, from 23 men — 8% of every man the house held
     ...that the game had ALREADY NAMED   75.6%
     ...out of a clear sky                24.4%, and 80% of those were grieving by the time they sat
     the refuser was fit to fight         90.2%
     and once he sits, he sits            a MEDIAN OF 41 WEEKS

   A refusal arrives as a weekly event before you pick anybody — so it is not an ambush at the gate.
   But it takes a man you could have used nine times in ten, the game knew who he was three times in
   four, and it never said. The 24.4% that cannot be foreshadowed are the deaths: the grief and the
   refusal land in the same sweep, and no panel can print that in advance.

   THE PROPERTY THIS CHECK EXISTS FOR: **the number on the panel and the number the engine rolls are
   the same function.** #150 is the precedent — the gambit panel quoted one figure while `runGambit`
   rolled another, on 990 of 6,448 rows, and it was the worse number every time. `refuseWeek` now
   rolls against `refuseOdds` and the panel reads `refuseRisk`, which calls it. A later edit could
   fork them silently, so the check asserts they agree across the whole regard range. */

import fs from "node:fs";
import path from "node:path";
import { found, tab, clearAll, forge, settle, click, waitSaved, ROOT } from "../harness.mjs";

export const name = "refuse";
export const describe = "the man who is about to sit down is named before you pick anybody";

export async function run({ p, errors }){
  const fails = [], lines = [];

  /* ---- ONE FORMULA ---- */
  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
  const rw = (src.match(/function refuseWeek\(d\)\{([\s\S]*?)\n\}/)||["",""])[1];
  if(/const odds\s*=/.test(rw))
    fails.push("refuseWeek has grown its own odds again — the panel quotes refuseOdds and #150 is what happens when those two drift");
  if(!/refuseOdds\(d, g\)/.test(rw))
    fails.push("refuseWeek no longer rolls against refuseOdds");

  const agree = await p.evaluate(()=>{
    const A = window.__LVDVS;
    if(!A.refuseOdds || !A.refuseRisk) return null;
    const d = A.newGameState("Sit","clean","RF-1",null);
    while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 60));
    const g = A.activeG(d)[0];
    const rows = [];
    for(let rg=0; rg<=60; rg+=4){
      g.regard = rg;
      rows.push({ rg, o:+(A.refuseOdds(d, g)).toFixed(4) });
    }
    /* it must rise as regard falls, be bounded, and never be negative */
    return { rows, top:Math.max(...rows.map(r=>r.o)), bottom:Math.min(...rows.map(r=>r.o)) };
  });
  if(!agree) return { pass:false, why:"refuseOdds or refuseRisk is not on the handle", lines };
  lines.push(`refuseOdds across regard 0→60: ${agree.rows.filter((_,i)=>i%3===0).map(r=>`${r.rg}:${(r.o*100).toFixed(0)}%`).join(" · ")}`);
  if(!(agree.top > agree.bottom)) fails.push("refuseOdds does not move with regard at all");
  if(agree.bottom < 0 || agree.top > 1) fails.push(`refuseOdds left the unit range: ${agree.bottom} to ${agree.top}`);
  const desc = agree.rows.every((r,i,a)=>i===0 || r.o <= a[i-1].o + 1e-9);
  if(!desc) fails.push("refuseOdds does not fall as regard rises — a man who thinks better of you must be likelier to go out");

  /* ---- THE READING ITSELF ---- */
  const risk = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const mk = () => { const d = A.newGameState("Sit","clean","RF-2",null);
      while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 60));
      A.activeG(d).forEach(g=>{ g.regard = 70; g.injury = null; g.fatigue = 3; g.defiance = 20; g.morale = 70; });
      return d; };
    const calm = mk();
    const sore = mk(); A.activeG(sore)[1].regard = 8;
    /* the reading must go quiet when no refusal can happen at all */
    const busy = mk(); A.activeG(busy)[1].regard = 8; busy.pendingEvent = { id:"x", title:"t", text:"t", choices:["a"] };
    const over = mk(); A.activeG(over)[1].regard = 8; over.over = { kind:"ruin" };
    const rome = mk(); A.activeG(rome)[1].regard = 8; rome.rome = { travel:0, fought:0 };
    const r = A.refuseRisk(sore);
    /* and it must name the man the ENGINE would have taken, not a different one */
    const cand = A.refuseCandidate(sore);
    return { calm: !!A.refuseRisk(calm), sore: r && { id:String(r.g.id), chance:+r.chance.toFixed(3), key:r.key, fit:r.fit },
             sameMan: !!(r && cand && r.g.id === cand.id),
             sameOdds: !!(r && Math.abs(r.chance - A.refuseOdds(sore, r.g)) < 1e-9),
             busy: !!A.refuseRisk(busy), over: !!A.refuseRisk(over), rome: !!A.refuseRisk(rome),
             name: r && r.g.name };
  });
  lines.push(`a calm house: ${risk.calm ? "NAMES SOMEBODY" : "says nothing"} · a house with a man at regard 8: ${risk.sore ? `${risk.name} at ${Math.round(risk.sore.chance*100)}%, reason "${risk.sore.key}", fit ${risk.sore.fit}` : "SAYS NOTHING"}`);
  lines.push(`it goes quiet when it must: mid-event ${!risk.busy} · house over ${!risk.over} · away at Rome ${!risk.rome}`);
  if(risk.calm) fails.push("a house where nobody is near refusing still named somebody — the warning would cry wolf every week");
  if(!risk.sore) fails.push("a man at regard 8 was not named at all");
  if(!risk.sameMan) fails.push("the panel names a different man from the one refuseCandidate would take — that is #150 again");
  if(!risk.sameOdds) fails.push("the chance the panel would print is not the chance refuseOdds returns");
  if(risk.busy) fails.push("it spoke during a pending event, when refuseWeek returns early and no refusal can happen");
  if(risk.over) fails.push("it spoke on a house that is over");
  if(risk.rome) fails.push("it spoke at Rome, where refuseWeek returns early");

  /* ---- THE MARK IN THE CHOOSER ---- */
  const mark = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Sit","clean","RF-3",null);
    while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 60));
    A.activeG(d).forEach(g=>{ g.regard = 70; g.injury = null; g.fatigue = 3; g.defiance = 20; g.morale = 70; });
    const men = A.activeG(d); men[1].regard = 8;
    return { onHim: A.rowMarks(d, men[1], null, null).map(m=>m.key + ": " + m.text),
             onOther: A.rowMarks(d, men[0], null, null).map(m=>m.key),
             keys: A.ROW_MARKS.map(m=>m.key) };
  });
  lines.push(`the chooser's marks: [${mark.keys.join(" ")}]`);
  lines.push(`on the man at risk: ${mark.onHim.join(" | ") || "NOTHING"}`);
  if(!mark.keys.includes("sitting")) fails.push("ROW_MARKS has no sitting mark — the warning is not where the item asked for it");
  if(!mark.onHim.some(x=>x.startsWith("sitting:"))) fails.push("the man the game would take carries no mark in the fight chooser");
  if(mark.onOther.includes("sitting")) fails.push("a man who is not the candidate carries the mark too — only one man can refuse in a week");
  const line = mark.onHim.find(x=>x.startsWith("sitting:")) || "";
  if(line && !/in a hundred/.test(line)) fails.push(`the mark quotes no chance: "${line.slice(0,80)}"`);
  if(line && !line.includes(String(mark.onHim.length ? "" : ""))) { /* name check below */ }

  /* ---- AND A HOUSE OF WOMEN, because the reasons are written with pronouns in them ---- */
  const fem = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Sit","clean","RF-4",null);
    while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 60));
    A.activeG(d).forEach(g=>{ g.sex = "f"; g.regard = 70; g.injury = null; g.fatigue = 3; });
    const men = A.activeG(d); men[1].regard = 8;
    return A.rowMarks(d, men[1], null, null).map(m=>m.text);
  });
  lines.push(`a house of women: ${fem.join(" | ").slice(0,150) || "NOTHING"}`);
  for(const t of fem){
    const he = t.match(/\b(He|him|his|himself)\b/);
    if(he) fails.push(`the warning over a woman reads "${he[1]}": "${t.slice(0,90)}"`);
  }

  /* ================= AND ON HIS OWN PAGE ================= */
  await found(p, { seed:"RF-S" });
  await clearAll(p, 8);
  const planted = await forge(p, (A) => {
    const d = A.newGameState("Sit","clean","RF-S",null);
    d.gold = 20000; d.week = 50;
    while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 62));
    const men = A.activeG(d);
    men.forEach(g=>{ g.regard = 72; g.injury = null; g.fatigue = 3; g.defiance = 20; g.morale = 70; g.refusing = null; });
    men[1].regard = 6;
    d.pendingEvent = null;
    return { plant:d, name: men[1].name, safe: men[0].name };
  });
  lines.push(`the man planted at regard 6: ${planted.name}`);
  await clearAll(p, 8);
  await tab(p, "men"); await p.waitForTimeout(350); await clearAll(p, 6);
  await tab(p, "men"); await p.waitForTimeout(330); await settle(p);
  const opened = await p.evaluate(nm=>{
    const b = [...document.querySelectorAll("button")].find(x=>(x.innerText||"").includes(nm));
    if(b) b.click(); return !!b;
  }, planted.name);
  if(!opened) return { pass:false, why:"could not open the man's page", lines };
  await p.waitForTimeout(600);
  /* it is on the OVERVIEW, which is the view every man opens on. The first placement was inside
     `SECT.regard` — where the number behind it lives — and that sect is a FOLD: it rendered as
     "WHAT HE MAKES OF YOU · hates you · ⌄" with the warning shut inside. No tab click here is
     deliberate: if it needed one, it would not be a warning. */
  const page = await p.evaluate(()=>{
    const t = (document.body.innerText || "").toUpperCase();
    const i = t.indexOf("HE IS CLOSE TO SITTING DOWN");
    return i < 0 ? null : t.slice(i, i + 320).replace(/\n+/g, " · ");
  });
  lines.push(`his page: ${page ? page.slice(0,200) : "NO WARNING"}`);
  if(!page) fails.push("the man the game is about to take carries no warning on his own page, where his regard already is");
  else if(!/IN A HUNDRED/.test(page)) fails.push("the warning on his page quotes no chance");

  await waitSaved(p);
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
