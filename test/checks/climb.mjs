/* HIS CAREER, ON ONE STRIP — #317.

   (`climb` was free in both directories; `ladder` is a probe and `rungs` a check, both checked
   before writing.)

   A man's three rungs (a move of his own at 6 wins, the rudis at 10 and 180 renown, mastery at 12,
   55 and the square) were three panels on two tabs, each drawn only once he stood on it: the
   signature panel renders for a man who can already be taught, so a man one win short was told
   nothing. `careerRungs` puts all three on his overview. The claim that matters is that it cannot
   call a man ready whom the button would refuse, so this checks it against the buttons' own gates
   over a sweep, not only on hand-built men.

     1  the source: the ladder is on the Record view and reads the gates, not copies of them
     2  hand-built men: every state of every rung reads as it should, a woman's in her words
     3  the sweep: over 600 men of every state, a rung reads ready exactly when its button would take
        him, and a short rung always names something
     4  on screen: a man's page opens on the strip, with his wins on the bar */

import fs from "node:fs";
import path from "node:path";
import { ROOT, found, clearAll, forge, settle, tab } from "../harness.mjs";

export const name = "climb";
export const describe = "a man's page draws his signature, rudis and mastery on one strip, and it agrees with the buttons";

export async function run({ p, errors }){
  const fails = [], lines = [];

  /* ---- 1 · THE SOURCE ---- */
  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
  const fn = (src.match(/const careerRungs = [\s\S]*?\n\S/) || [""])[0];
  const placed = /\{gView==="record" && <CareerLadder S=\{S\} g=\{selG\}\/>\}/.test(src);
  const reads = ["canLearnSig(d, g)", "rudisEligible(g)", "rudisStanding(g)", "canMaster(d, g)", "masterNeed(d, g)", "sigTech(g)"].filter(x=>!fn.includes(x));
  lines.push(`source: on the Record view ${placed} · gates not read: ${reads.length ? reads.join(", ") : "none"}`);
  if(!placed) fails.push("the ladder is not placed on a man's Record view");
  if(reads.length) fails.push(`careerRungs does not read ${reads.join(", ")}`);
  if(/\bwins\s*>=\s*10\b|\bpfame\s*>=\s*(55|180)\b/.test(fn)) fails.push("careerRungs restates a gate's number instead of asking the gate");

  /* ---- 2 & 3 · THE RUNGS ---- */
  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["careerRungs","canLearnSig","rudisEligible","canMaster","masterOf","isAuctor","newGameState","genGladiator","activeG","TECHNIQUES"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const d = A.newGameState("Cl", "clean", "CLIMB-1", null); d.week = 60; d.pendingEvent = null; d.doctore = null;
    const man = (o = {}) => { const g = A.genGladiator(d, 50);
      Object.assign(g, { sex:"m", status:"active", wins:0, pfame:0, proved:null, mastery:null, learning:null, second:null,
        signature:null, teaching:null, auctor:null, rudisDischarge:null }, o); return g; };
    const at = g => Object.fromEntries(A.careerRungs(d, g).map(x=>[x.k, x]));
    const techOf = cls => Object.keys(A.TECHNIQUES).find(k=>A.TECHNIQUES[k].cls === cls);
    const out = {};
    out.far = at(man({ wins:4, pfame:40 }));
    out.six = at(man({ wins:6, pfame:40 }));
    { const g = man({ wins:8, pfame:60 }); const k = techOf(g.cls); g.signature = { key:k, cls:g.cls }; out.sig = at(g); out.sigName = A.TECHNIQUES[k].name; }
    { const g = man({ wins:8, pfame:60 }); const k = techOf(g.cls); g.signature = { key:k, cls:g.cls === "Murmillo" ? "Thraex" : "Murmillo" }; out.idle = at(g); }
    out.post = at(man({ wins:7, pfame:60, teaching:{ key:"x", weeks:2 } }));
    out.hurt = at(man({ wins:7, pfame:60, status:"injured" }));
    out.free = at(man({ wins:11, pfame:200 }));
    out.auctor = at(man({ wins:11, pfame:200, auctor:{ bouts:6, wage:12, why:"" } }));
    out.paper = at(man({ wins:4, pfame:90, rudisDischarge:{ wins:6, fame:120 } }));
    { const g = man({ wins:13, pfame:70 }); g.mastery = { cls:g.cls, week:1 }; out.master = at(g); out.masterCls = g.cls; }
    out.nameable = at(man({ wins:13, pfame:70, proved:{ week:1, foe:"x" } }));
    out.hurtMaster = at(man({ wins:13, pfame:70, proved:{ week:1, foe:"x" }, status:"injured" }));
    out.her = A.careerRungs(d, man({ sex:"f", wins:5, pfame:30 }));
    out.gone = A.careerRungs(d, man({ status:"dead" })).length;

    /* the sweep: every state, every combination, against the buttons */
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pick = a => a[Math.floor(rnd() * a.length)];
    const bad = { sig:[], rudis:[], master:[], short:[] }; let n = 0;
    for(let i = 0; i < 600; i++){
      const g = man({ wins:Math.floor(rnd() * 16), pfame:Math.floor(rnd() * 220), status:pick(["active","active","active","injured","away"]),
        proved: rnd() < 0.4 ? { week:1, foe:"x" } : null, sex: rnd() < 0.3 ? "f" : "m" });
      if(rnd() < 0.2){ g.signature = { key:techOf(g.cls), cls:g.cls }; }
      else if(rnd() < 0.15) g.teaching = { key:techOf(g.cls), weeks:1 + Math.floor(rnd() * 4) };
      if(rnd() < 0.15) g.mastery = { cls:g.cls, week:1 };
      if(g.mastery && rnd() < 0.3) g.learning = { to:"Thraex", weeks:3 };
      if(rnd() < 0.1) g.auctor = { bouts:5, wage:10, why:"" };
      if(rnd() < 0.1) g.rudisDischarge = { wins:5 + Math.floor(rnd() * 5), fame:90 + Math.floor(rnd() * 90) };
      const x = at(g); n++;
      const sigTake = x.sig.st === "ready" && /Training has the post/.test(x.sig.say);
      if(sigTake !== !!A.canLearnSig(d, g)) bad.sig.push(`${g.wins}w ${g.status} sig:${!!g.signature} post:${!!g.teaching} -> ${x.sig.st} "${x.sig.say}"`);
      if((x.rudis.st === "ready") !== !!A.rudisEligible(g)) bad.rudis.push(`${g.wins}w ${g.pfame}f auctor:${!!g.auctor} -> ${x.rudis.st} "${x.rudis.say}"`);
      const masTake = x.master.st === "ready" && /name (him|her) on Training/.test(x.master.say);
      if(masTake !== !!A.canMaster(d, g) || (x.master.st === "done") !== !!A.masterOf(g)) bad.master.push(`${g.wins}w ${g.pfame}f ${g.status} -> ${x.master.st} "${x.master.say}"`);
      for(const k of ["sig","rudis","master"]) if(x[k].st === "short" && !/\S/.test(x[k].say || "")) bad.short.push(k);
    }
    out.sweep = { n, bad };
    return out;
  });
  if(r.why) return { pass:false, why:r.why, lines };

  const say = x => `${x.st} "${x.say}"`;
  lines.push(`4 wins, 40 renown: ${say(r.far.sig)} · ${say(r.far.rudis)} · ${say(r.far.master)}`);
  if(r.far.sig.st !== "short" || r.far.sig.say !== "2 more wins") fails.push("a man two wins short of his move is not told so");
  if(r.far.rudis.say !== "6 more wins and 140 more renown") fails.push(`the rudis reads "${r.far.rudis.say}"`);
  if(r.far.master.say !== "8 more wins, 15 more renown and a man beaten in the square who is as good as he is") fails.push(`mastery reads "${r.far.master.say}"`);
  if(r.far.sig.at !== 6 || r.far.rudis.at !== 10 || r.far.master.at !== 12) fails.push("the rungs do not stand at 6, 10 and 12 wins");
  lines.push(`6 wins, no doctore: ${say(r.six.sig)}`);
  if(r.six.sig.st !== "ready" || !/Training has the post, \d+d/.test(r.six.sig.say)) fails.push("a man with his six wins is not told his move is earned, and at what fee");
  lines.push(`taught: ${say(r.sig.sig)} · in another style: ${say(r.idle.sig)} · at the post: ${say(r.post.sig)} · injured: ${say(r.hurt.sig)}`);
  if(r.sig.sig.st !== "done" || !r.sig.sig.say.startsWith(r.sigName)) fails.push("a man with his move is not shown its name");
  if(r.idle.sig.st !== "done" || !/idle while he fights as a/.test(r.idle.sig.say)) fails.push("a move idle in another style does not say so");
  if(r.post.sig.st !== "under" || !/2 weeks left/.test(r.post.sig.say)) fails.push("a man at the far post is not shown the weeks left");
  if(r.hurt.sig.st !== "ready" || /Training has the post/.test(r.hurt.sig.say)) fails.push("an injured man is pointed at a post he cannot take");
  lines.push(`free to go: ${say(r.free.rudis)} · under contract: ${say(r.auctor.rudis)} · a served paper: ${say(r.paper.rudis)} at ${r.paper.rudis.at} wins`);
  if(r.free.rudis.st !== "ready" || !/earned: grant it below, \d+d/.test(r.free.rudis.say)) fails.push("a man who has earned the rudis is not told it, and at what cost");
  if(r.auctor.rudis.st !== "none") fails.push("a man under contract is shown a rudis");
  if(r.paper.rudis.at !== 6 || !/2 more wins and 30 more renown, on his paper's 6 and 120/.test(r.paper.rudis.say)) fails.push("a served sentence's shorter bar is not the one drawn");
  lines.push(`a master: ${say(r.master.master)} · can be named: ${say(r.nameable.master)} · the same, injured: ${say(r.hurtMaster.master)}`);
  if(r.master.master.st !== "done" || !new RegExp(`master of the ${r.masterCls.toLowerCase()}`).test(r.master.master.say)) fails.push("a master's rung does not name his mastery");
  if(r.nameable.master.st !== "ready" || !/name him on Training/.test(r.nameable.master.say)) fails.push("a man who can be named a master is not told");
  if(r.hurtMaster.master.st !== "ready" || /name him/.test(r.hurtMaster.master.say)) fails.push("an injured man is pointed at a naming he cannot have");
  lines.push(`a woman: ${r.her.map(x=>`${x.name} · ${x.say}`).join(" | ")}`);
  if(!r.her.length || r.her[0].name !== "A move of her own" || r.her.some(x=>/\bhis\b|\bhe\b|\bhim\b/.test(`${x.name} ${x.say}`))) fails.push("a woman's rungs are written for a man");
  if(r.gone) fails.push("a dead man is drawn a career");
  const B = r.sweep.bad;
  lines.push(`the sweep: ${r.sweep.n} men · disagreements with the buttons: signature ${B.sig.length}, rudis ${B.rudis.length}, mastery ${B.master.length} · short rungs naming nothing: ${B.short.length}`);
  for(const [k, v] of Object.entries(B)) if(v.length){ fails.push(`the ${k} rung disagrees with its gate on ${v.length} of ${r.sweep.n} men`); lines.push(`   e.g. ${v.slice(0, 2).join(" ; ")}`); }

  /* ---- 4 · ON SCREEN ---- */
  await found(p, { seed:"CLIMB-UI" });
  await clearAll(p, 8);
  const planted = await forge(p, (A) => { const d = A.newGameState("Cl","clean","CLIMB-UI",null); d.week = 30; d.pendingEvent = null;
    const g = A.activeG(d)[0]; Object.assign(g, { wins:4, pfame:40, proved:null, mastery:null, signature:null, teaching:null, sex:"m" });
    return { plant:d, name:g.name }; });
  await clearAll(p, 8);
  await tab(p, "men"); await p.waitForTimeout(350); await clearAll(p, 6);
  const opened = await p.evaluate(nm=>{ const b = [...document.querySelectorAll("button")].find(x=>(x.innerText||"").includes(nm));
    if(b) b.click(); return !!b; }, planted.name);
  await settle(p); await p.waitForTimeout(300);
  const seen = await p.evaluate(()=>{ const L = document.querySelector("[data-ladder]"); if(!L) return null;
    const bar = L.querySelector("[role=progressbar]");
    return { text:(L.innerText||"").replace(/\s*\n+\s*/g, " · "), rungs:[...L.querySelectorAll("[data-rung]")].map(x=>x.dataset.rung + ":" + x.dataset.st),
      now: bar && bar.getAttribute("aria-valuenow"), max: bar && bar.getAttribute("aria-valuemax") }; });
  lines.push(`on screen, ${planted.name}'s page: ${opened ? (seen ? `${seen.text} · rungs ${seen.rungs.join(" ")} · bar ${seen.now} of ${seen.max}` : "NO LADDER") : "could not open"}`);
  if(!opened) fails.push("could not open the man's page");
  else if(!seen) fails.push("a man's page does not open on his career strip");
  else {
    if(seen.rungs.join(" ") !== "sig:short rudis:short master:short") fails.push(`the strip's rungs read ${seen.rungs.join(" ")}`);
    if(seen.now !== "4" || seen.max !== "12") fails.push(`the bar reads ${seen.now} of ${seen.max}, not 4 of 12`);
    if(!/2 more wins/.test(seen.text) || !/6 more wins and 140 more renown/.test(seen.text)) fails.push("the strip does not say what each rung still wants");
  }

  if(errors && errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
