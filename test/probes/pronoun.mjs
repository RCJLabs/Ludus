/* WHAT A WOMAN'S PAGE SAYS ABOUT HER — the measurement behind #319.

   (`pronoun` was free in both directories; checked before writing.)

   Plays a house with the reference player, then draws every fighter's five views twice: once with
   every fighter a man, once with every fighter a woman, the house otherwise identical. Prints each
   line of her page that carries he, him, his or himself and reads the same letter for letter as the
   man's: a line that did not turn for her. Some are about somebody else (the man she killed), and
   `checks/gladiatrix.mjs` names those; this prints everything, merged across the seeds with names
   and numbers folded out.

   Measured before #319 on PRON-1 (160 weeks) and PRON-2..4 (300): 71 distinct lines, on all five
   views. After it: the one line about the man she killed.

   node test/probes/pronoun.mjs [seeds = PRON-1,PRON-2,PRON-3,PRON-4] [weeks = 300] [fighters a house = 14] */
import { serve, open, found, clearAll, forge, settle, tab, installRope } from "../harness.mjs";
const SEEDS = (process.argv[2] || "PRON-1,PRON-2,PRON-3,PRON-4").split(",");
const W = +(process.argv[3] || 300), MAXMEN = +(process.argv[4] || 14);
const PAGE = process.env.PAGE || "dist/test.html";
const VIEWS = ["Record","Body","Training","Kit","Standing"];
const PRO = /\b(he|him|his|himself)\b/i;

const { server, port } = await serve({ page: PAGE });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 8);

const render = async (SEED, SEX) => {
  await installRope(p);
  const planted = await forge(p, (A, R, [SEED, W, SEX]) => {
    const d = A.newGameState("Pr", "clean", SEED, null);
    const opts = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true, rites:true, bury:true, yard:true,
      booking:true, favours:true, lot:true, overture:true, free:true, mastery:true, signature:true, retire:true, comply:true, fines:"read", road:false };
    for(let w=0; w<W && !d.over; w++){ try { R.lanista(d, opts); } catch(e){} }
    d.over = null; d.pendingEvent = null; d.succession = null; d.pendingSpar = null;
    d.gladiators.forEach(g=>{ g.sex = SEX; });
    return { plant:d, names: d.gladiators.filter(g=>!A.isGone(g)).map(g=>g.name) };
  }, [SEED, W, SEX]);
  await clearAll(p, 8);
  const out = {};
  for(const nm of planted.names.slice(0, MAXMEN)){
    await tab(p, "men"); await p.waitForTimeout(250); await clearAll(p, 4);
    const ok = await p.evaluate(nm=>{ const b=[...document.querySelectorAll("button")].find(x=>(x.innerText||"").includes(nm)); if(b){ b.click(); return true; } return false; }, nm);
    if(!ok) continue;
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
  return out;
};

const all = new Map(); let views = 0;
for(const SEED of SEEDS){
  const M = await render(SEED, "m"), F = await render(SEED, "f");
  const names = Object.keys(F);
  const norm = s => { let t = s.replace(/\d+(\.\d+)?/g, "#"); for(const n of names) t = t.split(n).join("NAME"); return t.replace(/House [A-Z][a-z]+/g, "House X"); };
  let here = 0;
  for(const nm of names) for(const v of VIEWS){
    const f = F[nm] && F[nm][v], m = M[nm] && M[nm][v]; if(f == null || m == null) continue;
    views++;
    const mset = new Set(m.split("\n").map(s=>s.trim()));
    for(const line of f.split("\n").map(s=>s.trim()).filter(Boolean)){
      if(!PRO.test(line) || !mset.has(line)) continue;
      here++;
      const k = norm(line), e = all.get(k) || { views:new Set(), n:0 }; e.views.add(v); e.n++; all.set(k, e);
    }
  }
  console.log(`${SEED}: ${names.length} fighters · ${here} lines on her pages unchanged from his with a man's pronoun`);
}
console.log(`\n${all.size} distinct lines over ${views} views (${SEEDS.length} houses, ${W} weeks each)`);
for(const [k, e] of [...all.entries()].sort((a,b)=>[...a[1].views][0].localeCompare([...b[1].views][0])))
  console.log(`  [${[...e.views].join(",")}] x${e.n}  ${k.slice(0, 220)}`);
await browser.close(); server.close();
