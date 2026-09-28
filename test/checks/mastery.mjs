/* HOW FAR A MAN IS FROM HIS MASTERY — #315

   The mastery gate is three terms: twelve wins, fifty-five renown, and a man beaten in the square who
   is as good as him (#232 phase 5, measured on fighting quality since #252). `masterNeed` was written
   "for the card to say it rather than grey a button out", and nothing called it. The mastery panel on
   a man's Training view drew only for a man who could already be named (or was a master, or learning
   a second trade), and its own fallback line, "A master is made at 12 victories and 55 renown. He has
   X and Y.", sat inside a condition that excluded it. So a man's page said nothing about mastery until
   the day the button appeared, and even the dead line had never heard of the square.

     1  `masterSays` in the gate's own terms: every term owed, counted against the gate, for a man far
        off; only the square for a man with his wins and his renown, naming the weakest man in the yard
        who is still as good as him (a man beats his equal 49% of the time and one 15% better 29%,
        `probes/master.mjs`); no name when nobody in the yard qualifies; her pronouns for a woman; and
        nothing for a master or for a man who can be named today
     2  the week's word: "lacks only a proving bout" when the square is all that is left and there is
        a man to beat, and not otherwise; after the spar is won, "has earned his mastery" instead
     3  on screen: the Training view of a man with everything owed now carries the line */
import { found, clearAll, forge, settle, tab } from "../harness.mjs";

export const name = "mastery";
export const describe = "a man's page says how far he is from his mastery, and whom to beat in the square";

export async function run({ p, errors }){
  const fails = [], lines = [];

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["masterSays","proveFoe","agendaMaster","masterNeed","canMaster","MASTERY_GATE","agenda","newGameState","genGladiator","activeG"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const STATS = ["str","agi","con","skl","wil","cha"];
    const set = (g, v) => { for(const k of Object.keys(g)) if(typeof g[k] === "number" && /^(str|agi|con|skl|wil|cha|spd|end|tec|pow)$/.test(k)) g[k] = v; };
    const house = n => { const d = A.newGameState("Ms", "clean", "MASTERY-1", null); d.week = 60; d.pendingEvent = null;
      d.gladiators = d.gladiators.filter(g=>g.status === "active").slice(0, 1);
      while(d.gladiators.length < n) d.gladiators.push(A.genGladiator(d, 50));
      d.gladiators.forEach(g=>{ g.proved = null; g.mastery = null; g.learning = null; g.benched = false; g.sex = "m"; });
      return d; };
    const out = {};
    /* 1a · far off */
    { const d = house(1), g = A.activeG(d)[0]; g.wins = 3; g.pfame = 20; out.far = A.masterSays(d, g); }
    /* 1b · only the square left, two men in the yard as good as him: the weaker of the two is named */
    { const d = house(4), [g, a, b, c] = A.activeG(d);
      g.wins = 13; g.pfame = 60; set(g, 50); set(a, 52); set(b, 70); set(c, 30);
      out.square = A.masterSays(d, g); out.foe = A.proveFoe(d, g); out.foe = out.foe && out.foe.name; out.weaker = a.name; out.stronger = b.name;
      /* 2 · and the week says it */
      const row = () => (A.agenda(d) || []).find(x=>x.label && x.label.includes(g.name) && /mastery/.test(x.label));
      out.row = row() ? { label:row().label, sub:row().sub, tab:row().tab, doc:row().doc } : null;
      g.proved = { week:d.week, foe:a.name };
      out.rowAfter = row() ? row().label : null; out.canAfter = A.canMaster(d, g); out.saysAfter = A.masterSays(d, g); }
    /* 1c · nobody in the yard is as good as him */
    { const d = house(3), [g, a, b] = A.activeG(d);
      g.wins = 13; g.pfame = 60; set(g, 60); set(a, 40); set(b, 45);
      out.alone = A.masterSays(d, g); out.aloneRow = (A.agenda(d) || []).some(x=>x.label && /proving bout/.test(x.label)); }
    /* 1d · a woman */
    { const d = house(1), g = A.activeG(d)[0]; g.sex = "f"; g.wins = 5; g.pfame = 30; out.her = A.masterSays(d, g); }
    /* 1e · a master, and a man who can be named */
    { const d = house(1), g = A.activeG(d)[0]; g.mastery = { cls:g.cls, week:1 }; out.master = A.masterSays(d, g); }
    /* 2b · more than the square owed: no row */
    { const d = house(3), [g, a] = A.activeG(d); g.wins = 8; g.pfame = 60; set(g, 50); set(a, 60);
      out.earlyRow = (A.agenda(d) || []).some(x=>x.label && /proving bout/.test(x.label)); }
    return out;
  });
  if(r.why) return { pass:false, why:r.why, lines };

  lines.push(`far off: "${r.far}"`);
  if(!r.far || !/Toward his mastery: 9 more wins, 35 more renown and a man beaten in the square who is as good as he is\./.test(r.far)
     || !/He has 3 of 12 wins and 20 of 55 renown\./.test(r.far)) fails.push("a man far from his mastery is not told the three terms against the gate");
  lines.push(`only the square: "${r.square}"`);
  lines.push(`   the man named: ${r.foe} (the weaker of the two who are as good: ${r.weaker}; the stronger: ${r.stronger})`);
  if(!r.square || !/Toward his mastery: a man beaten in the square who is as good as he is\. He has his 12 wins and his 55 renown\./.test(r.square))
    fails.push("a man with his wins and renown is not told the square is all that is left");
  if(r.foe !== r.weaker) fails.push(`the man to beat should be the weakest who is still as good as him (${r.weaker}), not ${r.foe}`);
  else if(!r.square || !r.square.includes(`${r.weaker} is as good as he is and stands in this yard.`)) fails.push("the page does not name the man to beat");
  lines.push(`the week: ${r.row ? `"${r.row.label}" · "${r.row.sub}" -> ${r.row.tab}, the ${r.row.doc} panel` : "NO ROW"} · after the spar is won: ${r.rowAfter ? `"${r.rowAfter}"` : "no row"} (can be named: ${r.canAfter})`);
  if(!r.row) fails.push("the week does not say when the square is all that is left");
  else {
    if(!/lacks only a proving bout/.test(r.row.label)) fails.push(`the week's row reads "${r.row.label}"`);
    if(!r.row.sub.includes(r.weaker)) fails.push("the week's row does not name the man to beat");
    if(r.row.tab !== "ludus" || r.row.doc !== "square") fails.push(`the week's row does not go to the square (${r.row.tab}, ${r.row.doc})`);
  }
  if(!r.canAfter || !/has earned his mastery/.test(r.rowAfter || "")) fails.push("after the spar is won the week does not say he has earned it");
  if(r.saysAfter) fails.push("a man who can be named today is still told what he owes");
  lines.push(`nobody in the yard as good as him: "${r.alone}" · a row: ${r.aloneRow}`);
  if(!r.alone || /stands in this yard/.test(r.alone)) fails.push("a man with nobody to beat is told there is somebody");
  if(r.aloneRow) fails.push("the week points at the square when there is nobody in it to beat");
  lines.push(`a woman: "${r.her}"`);
  if(!r.her || !/Toward her mastery/.test(r.her) || !/She has 5 of 12 wins/.test(r.her) || /\bhe is\b|\bHe has\b/.test(r.her)) fails.push("a woman's line is written for a man");
  if(r.master) fails.push("a master is told what he still owes");
  if(r.earlyRow) fails.push("the week points at the square while wins or renown are still owed");

  /* ---- 3 · ON SCREEN ---- */
  await found(p, { seed:"MASTERY-UI" });
  await clearAll(p, 8);
  const planted = await forge(p, (A) => { const d = A.newGameState("Ms","clean","MASTERY-UI",null); d.week = 30; d.pendingEvent = null;
    const g = A.activeG(d)[0]; g.wins = 4; g.pfame = 22; g.proved = null; g.mastery = null; g.learning = null; g.second = null;
    return { plant:d, name:g.name }; });
  await clearAll(p, 8);
  await tab(p, "men"); await p.waitForTimeout(350); await clearAll(p, 6);
  const opened = await p.evaluate(nm=>{ const b = [...document.querySelectorAll("button")].find(x=>(x.innerText||"").includes(nm));
    if(b) b.click(); return !!b; }, planted.name);
  await p.waitForTimeout(500);
  const trained = await p.evaluate(()=>{ const b = [...document.querySelectorAll("button")].find(x=>/^training$/i.test((x.innerText||"").trim()));
    if(b) b.click(); return !!b; });
  await settle(p);
  const shown = await p.evaluate(()=>{ const t = document.body.innerText || ""; const i = t.search(/Toward (his|her) mastery/);
    return i < 0 ? null : t.slice(i, i + 200).replace(/\n+/g, " · "); });
  lines.push(`on screen, ${planted.name}'s Training view: ${opened && trained ? (shown || "NO LINE") : `could not open (${opened}, ${trained})`}`);
  if(!opened || !trained) fails.push("could not reach the man's Training view");
  else if(!shown || !/8 more wins/.test(shown)) fails.push("the Training view of a man far from his mastery says nothing about it");

  if(errors && errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
