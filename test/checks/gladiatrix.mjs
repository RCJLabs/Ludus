/* A WOMAN'S PAGE, IN HER WORDS — #319.

   (`gladiatrix` was free in both directories; checked before writing. `hers` is the mistress's.)

   A woman's Training view said "PUT HIM ON A SEASON", and nothing looked, because no check had ever
   opened a woman fighter's page: `hers` is about the lanista's wife. The game turns its prose for a
   gladiatrix through `her()` and `PR()`, and the man's page used them on sixteen of its lines.

   HOW THIS LOOKS, and why it needs no list of phrases. The same house is drawn twice, once with
   every fighter a man and once with every fighter a woman, identical in everything else. A line
   about her must change between the two. So every line of her page that carries he, him, his or
   himself AND reads the same letter for letter as the man's is a line that forgot her, unless it
   is about somebody else, and those few are named in ALLOW with the reason. Measured on four played
   houses before the sweep: **71 distinct lines**, on all five views.

   THE FIXTURE is a house the reference player has run for 160 weeks, with seven of its fighters
   put into the states a played house rarely shows (the unsworn, a contract, the condemned, a man
   refusing, a season, a watcher at the wall, lasting wounds, the far post both ways, a master in
   two trades, named steel, the champion's road). Every one of those panels is asserted to have
   drawn, so a planted state that stops rendering fails here instead of quietly passing.

     1  the lines written away from the page: the bout's reading, the refusals, a brother's word,
        form, the bout word, the steel's history and the doctore's square, each for a woman
     2  every view of every fighter's page, drawn as a man and as a woman, diffed
     3  and the panels the fixture plants all drew */
import { found, clearAll, forge, settle, tab, installRope } from "../harness.mjs";

export const name = "gladiatrix";
export const describe = "every view of a woman's page speaks of her as a woman, and only the lines about somebody else say he";
export const slow = true;

const PRO = /\b(he|him|his|himself)\b/i;
/* lines that carry a man's pronoun on a woman's page because they are about a man */
const ALLOW = [
  { re:/^won, and killed him$/, why:"a bout's word: him is the man she killed" },
];
const VIEWS = ["Record","Body","Training","Kit","Standing"];
const MUST = ["Not yet sworn","Under contract","Crowd Favourite","What Capua makes of her","Condemned to the school",
  "She will not go out","On a season","Somebody is watching her","What never closed","Drilling","Two trades",
  "The Champion's Road","Bonds","The far post","the Widowmaker","Made for her"];

export async function run({ p, errors }){
  const fails = [], lines = [];

  /* ---- 1 · THE LINES WRITTEN AWAY FROM THE PAGE ---- */
  const u = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["readBout","REFUSE_REASONS","tieWord","formWord","boutWord","PROV","squareWord","newGameState","activeG","TECHNIQUES"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const d = A.newGameState("Gx", "clean", "GLADIATRIX-1", null); d.week = 90; d.pendingEvent = null;
    const g = A.activeG(d)[0], m = A.activeG(d)[1];
    g.sex = "f"; m.sex = "m";
    Object.assign(g, { fatigue:60, form:-40, regard:10, lasting:["knee"], wins:2, pfame:20 });
    const opp = { name:"Spiculus", house:"Glaber", cls:"Secutor", wins:20 };
    const offer = { opp, tier:3, stakes:"sine", sky:"hot", venue:null };
    const after = A.readBout(d, g, offer, { win:false, crowd:80 }, { plan:{ right:false, label:"fighting to a plan" } }) || [];
    const pre = A.readBout(d, g, offer) || [];
    const won = A.readBout(d, g, offer, { win:true, crowd:30 }) || [];
    const refuse = Object.keys(A.REFUSE_REASONS).map(k=>({ k, s:A.REFUSE_REASONS[k].say(g) }));
    return { after:after.map(x=>x.s), pre:pre.map(x=>x.s), won:won.map(x=>x.s), refuse,
      tieF:A.tieWord({ kind:"brother", strength:80 }, g), tieM:A.tieWord({ kind:"brother", strength:80 }, m),
      form:A.formWord(-20, g), formM:A.formWord(-20, m),
      died:A.boutWord({ died:true }, g), killed:A.boutWord({ win:true, killed:true }, g),
      forged:A.PROV.forged.line({ week:3 }, g), primacy:A.PROV.primacy.line({}, g), dead:A.PROV.dead.line({ from:"Crixus" }, g),
      square:(()=>{ d.doctore = d.doctore || { name:"Oenomaus", spec:"str", skill:60 }; try { return A.squareWord(d, g); } catch(e){ return "THREW " + e.message; } })() };
  });
  if(u.why) return { pass:false, why:u.why, lines };
  const bad1 = [...u.after, ...u.pre, ...u.won].filter(s=>PRO.test(s));
  lines.push(`the bout's reading for a woman: ${u.after.length} lines after a loss, ${u.pre.length} before, ${u.won.length} after a win · with a man's pronoun: ${bad1.length}`);
  for(const s of bad1.slice(0, 3)) lines.push(`   "${s}"`);
  if(bad1.length) fails.push(`the bout's reading speaks of a woman as a man: "${bad1[0]}"`);
  const badR = u.refuse.filter(x=>PRO.test(x.s.replace(/the sand that took him/, "")));
  lines.push(`the refusals for a woman: ${u.refuse.map(x=>x.k).join(", ")} · with a man's pronoun about her: ${badR.length} (grief keeps "the sand that took him", the dead man's)`);
  if(badR.length) fails.push(`a refusal speaks of a woman as a man: "${badR[0].s}"`);
  lines.push(`a brother's word: "${u.tieF}" to a woman, "${u.tieM}" to a man · form "${u.form}" / "${u.formM}" · the bout word "${u.died}", "${u.killed}"`);
  if(u.tieF !== "would die for her" || u.tieM !== "would die for him") fails.push("a brother's word does not follow who he would die for");
  if(u.form !== "off her stride" || u.formM !== "off his stride") fails.push("form's word does not turn");
  if(u.died !== "she did not come back" || u.killed !== "won, and killed him") fails.push("the bout word does not turn, or turned the man she killed");
  lines.push(`the steel: "${u.forged}" · "${u.primacy}" · "${u.dead}" · the doctore's square: "${u.square}"`);
  if(!/for her/.test(u.forged) || !/^She held/.test(u.primacy)) fails.push("the history of her steel is written for a man");
  if(!/when he died in it/.test(u.dead)) fails.push("the dead man's steel stopped being his");
  if(/\bhim\b/.test(u.square || "") || !/\bher\b/.test(u.square || "")) fails.push(`the doctore's square reads "${u.square}"`);

  /* ---- 2 · EVERY VIEW, AS A MAN AND AS A WOMAN ---- */
  await found(p, { seed:"GLADIATRIX-UI" }); await clearAll(p, 8);
  const render = async SEX => {
    await installRope(p);
    const planted = await forge(p, (A, R, SEX) => {
      const d = A.newGameState("Gx", "clean", "PRON-1", null);
      const opts = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true, rites:true, bury:true, yard:true,
        booking:true, favours:true, lot:true, overture:true, free:true, mastery:true, signature:true, retire:true, comply:true, fines:"read", road:false };
      for(let w=0; w<160 && !d.over; w++){ try { R.lanista(d, opts); } catch(e){} }
      d.over = null; d.pendingEvent = null; d.succession = null; d.pendingSpar = null;
      const men = d.gladiators.filter(g=>!A.isGone(g) && g.status !== "away");
      if(men.length < 7) return { why:`the played house has ${men.length} fighters, and the fixture plants seven` };
      const [a, b, c, e, f, t, s] = men;
      const other = x => x.cls === "Thraex" ? "Murmillo" : "Thraex";
      const techOf = cls => Object.keys(A.TECHNIQUES).find(k=>A.TECHNIQUES[k].cls === cls);
      for(const g of [a, b, c, e, f, t, s]){ g.status = "active"; g.injury = null; g.refusing = null; }
      /* a: the unsworn, under contract, the crowd's, loved in the town */
      Object.assign(a, { sworn:null, auctor:{ bouts:9, served:2, fee:220, wage:12, why:A.AUCTOR_WHY[3] }, fans:80, favour:45, regard:90,
        family:{ name:"Vibia", since:d.week - 30 }, memory:[{ kind:"grief", forName:"Crixus", week:d.week - 2, settled:false, again:1 }] });
      /* b: the condemned, and refusing */
      Object.assign(b, { damnatus:{ what:"striking his master", note:"He will not say why and nobody in the cells asks him twice.",
        bouts:(b.wins||0) + (b.losses||0) + 10, since:d.week - 12 }, refusing:{ reason:"plain", weeks:1, since:d.week - 1 } });
      /* c: a season, a watcher, lasting wounds */
      c.plan = null; A.startPlan(d, c, A.PS_KEYS[0]);
      Object.assign(c, { watchedBy:{ house:(d.rivals[0]||{}).name, week:d.week, known:true }, shiftWeeks:1, lasting:["knee","wind"] });
      /* e: a move at the far post, off form */
      Object.assign(e, { signature:null, teaching:{ key:techOf(e.cls), weeks:2 }, form:-40, formLog:["a loss at the pits"] });
      /* f: a master of two trades, with named and storied steel, on the champion's road */
      Object.assign(f, { mastery:{ cls:f.cls, week:d.week - 30 }, second:{ cls:other(f) }, learning:null,
        named:{ slot:"weapon", title:"the Widowmaker", made:d.week - 20 },
        prov:{ weapon:{ kind:"forged", week:d.week - 20 }, helm:{ kind:"primacy", week:d.week - 10 } } });
      d.saga = { gid:f.id, name:f.name, stage:3, renown:60, since:d.week - 10, foe:{ name:"Spiculus", house:"Glaber" } };
      /* t and s: teacher and pupil, and brothers */
      Object.assign(t, { protege:s.id, protegeName:s.name, mentor:null }); Object.assign(s, { mentor:t.id, mentorName:t.name, protege:null });
      (d.ties = d.ties || []).push({ a:t.id, b:s.id, kind:"brother", strength:85, since:d.week - 40 });
      d.gladiators.forEach(g=>{ g.sex = SEX; });
      return { plant:d, names:[a, b, c, e, f, t, s].map(g=>g.name) };
    }, SEX);
    if(planted.why) return planted;
    await clearAll(p, 8);
    const out = {};
    for(const nm of planted.names){
      await tab(p, "men"); await p.waitForTimeout(250); await clearAll(p, 4);
      const ok = await p.evaluate(nm=>{ const b=[...document.querySelectorAll("button")].find(x=>(x.innerText||"").includes(nm)); if(b){ b.click(); return true; } return false; }, nm);
      if(!ok){ out[nm] = null; continue; }
      await settle(p);
      out[nm] = {};
      for(const v of VIEWS){
        const hit = await p.evaluate(v=>{ const b=[...document.querySelectorAll(".modal button")].find(x=>(x.innerText||"").trim().toLowerCase().replace(/\s*·.*$/,"")===v.toLowerCase()); if(b){ b.click(); return true; } return false; }, v);
        await p.waitForTimeout(200);
        out[nm][v] = hit ? await p.evaluate(()=>{ const ms=[...document.querySelectorAll(".modalwrap .modal")]; const m = ms[ms.length-1]; return m ? m.innerText : ""; }) : null;
      }
      await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")].pop(); if(w) w.click(); });
      await p.waitForTimeout(150);
    }
    return { names:planted.names, out };
  };
  const M = await render("m"), F = await render("f");
  if(M.why || F.why) return { pass:false, why:M.why || F.why, lines };

  let views = 0, opened = 0;
  const found1 = new Map(), allowed = new Map();
  for(const nm of F.names){
    if(F.out[nm]) opened++;
    for(const v of VIEWS){
      const f = F.out[nm] && F.out[nm][v], m = M.out[nm] && M.out[nm][v];
      if(f == null || m == null) continue;
      views++;
      const mset = new Set(m.split("\n").map(x=>x.trim()));
      for(const line of f.split("\n").map(x=>x.trim()).filter(Boolean)){
        if(!PRO.test(line) || !mset.has(line)) continue;
        const ok = ALLOW.find(a=>a.re.test(line));
        const key = `[${v}] ${line.replace(/\d+/g, "#").replace(new RegExp(nm, "g"), "NAME")}`;
        (ok ? allowed : found1).set(key, (ok ? allowed : found1).get(key) || { line, nm, why: ok && ok.why });
      }
    }
  }
  lines.push(`drawn twice: ${opened} of ${F.names.length} fighters opened, ${views} views as a man and as a woman`);
  lines.push(`lines on a woman's page that speak of her as a man: ${found1.size}${allowed.size ? ` · about somebody else, and allowed: ${[...allowed.values()].map(a=>`"${a.line}" (${a.why})`).join(", ")}` : ""}`);
  for(const [k] of [...found1].slice(0, 12)) lines.push(`   ${k.slice(0, 200)}`);
  if(opened < F.names.length || views < F.names.length * VIEWS.length) fails.push(`only ${views} of ${F.names.length * VIEWS.length} views could be drawn`);
  if(found1.size) fails.push(`${found1.size} line${found1.size===1?"":"s"} on a woman's page ${found1.size===1?"speaks":"speak"} of her as a man, e.g. ${[...found1.keys()][0].slice(0, 120)}`);

  /* ---- 3 · AND THE PLANTED PANELS ALL DREW ---- */
  const everything = F.names.map(nm=>VIEWS.map(v=>(F.out[nm]||{})[v]||"").join("\n")).join("\n");
  const missing = MUST.filter(w=>!everything.toLowerCase().includes(w.toLowerCase()));
  lines.push(`the planted panels: ${MUST.length - missing.length} of ${MUST.length} drew${missing.length ? ` · missing: ${missing.join(", ")}` : ""}`);
  if(missing.length) fails.push(`the fixture's panels did not all draw (${missing.join(", ")}), so this looked at less than it claims`);

  if(errors && errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
