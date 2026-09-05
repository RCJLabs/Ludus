/* A BOY OF TEN TAKES THE CHAIR — second phase queue #253, as it turned out to be

   The queue wrote #253 as "the age gate shuts the boy out after a succession". Traced properly
   (`probes/handover.mjs`, the v3.200.0 run), that was wrong: `succeed` moves the whole family to the
   forebear record, so there is no boy in `livingKids` for any gate to shut out. What the trace found
   instead: of three successions, TWO were a son of ten and of eleven — both through the retirement
   door, a man of sixty-two handing on by choice to a child because `d.heir` was set — and `succeed`
   rolled each of them `ri(22,31)` on the way in. #237 named the real boy years before sixteen on
   purpose; nothing downstream had ever read how old he was.

   SIX ARMS:
   1 · THE BOY'S AGE IS HIS OWN. A son of eleven who takes the house is eleven, and the chronicle says
       a boy took the chair rather than that he "has been in this yard his whole life".
   2 · A SCION'S TOO — the toga'd boy's real age, not `ri(18,24)`.
   3 · A NEPHEW IS STILL ROLLED — `ri(22,31)`, because there is no birth week to read.
   4 · A FATHER DOES NOT RETIRE ONTO A MINOR. Three hundred rolls of the retirement door with a boy
       of ten named: none. The same with a boy of seventeen: it opens. And the DEATH door is not
       gated — a man who dies with a boy of ten named still hands him the house.
   5 · A BOY IS NOT OFFERED A WIFE — `marryReady` wants eighteen.
   6 · YEARS AT THE HEAD ARE THIS MAN'S. The lanista sheet read "27 years old · 22 years at the head"
       for a nephew who arrived last spring, because it printed `yearOf`; `yearsAtHead` reads
       `L.since`. Held at module scope and on the sheet itself. */
import { found, clearAll, forge, tab } from "../harness.mjs";

export const name = "minor";
export const describe = "a boy who takes the house is his own age, and nobody retires onto a child";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"MINOR-1" });
  await clearAll(p, 12);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["heirOfAge","HEIR_AGE","yearsAtHead","lanistaWeek","takeUpTheHouse","nameHeir","domusOf","childAge","marryReady","makeLanista"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const out = { arms:[], notes:[] };
    const say = (ok, why) => out.arms.push({ ok, why });
    let tick = 0;
    /* a house with an old master, a wife, and one boy of a given age */
    const mk = (boyYears, lanAge) => {
      const d = A.newGameState("Minor", "clean", `MINOR-${boyYears}-${lanAge}-${tick++}`, null);
      d.week = 6*A.YEAR_WEEKS + 4; d.unrest = 10; d.rebellion = null; d.buildings = {};
      d.lanista = A.makeLanista(d); d.lanista.age = lanAge; d.lanista.health = 70; d.lanista.since = 1;
      const dm = A.domusOf(d);
      dm.wife = { name:"Prima Vettia", family:"the Vettii", married:2, age:24, from:"merchant" };
      const c = { id:dm.nextKin++, name:"Lucius Minor", sex:"m", born: d.week - boyYears*A.YEAR_WEEKS, up:{palus:1,rhetor:0,box:0} };
      dm.children.push(c);
      return { d, c };
    };
    const die = d => { d.lanista.health = 0; try { A.lanistaWeek(d); } catch(e){} if(d.succession){ try { A.takeUpTheHouse(d); } catch(e){} } };

    /* 1 · the boy's age is his own, and the line says a boy */
    { const { d, c } = mk(11, 60);
      const named = A.nameHeir(d, "son", c.id);
      die(d);
      const line = (d.log && d.log.find(x=>/years old and the house is his/.test(x.text||""))) || null;
      out.notes.push(`son of 11: named ${named}, succession ${!!d.succession || d.generation>1}, new lanista ${d.lanista.name} aged ${d.lanista.age}, gen ${d.generation}`);
      say(named && d.generation === 2 && d.lanista.age === 11 && !!line && (A.domusOf(d).children||[]).length === 0,
        `a son of eleven takes the house at ${d.lanista.age} (gen ${d.generation}); the chronicle ${line ? "says a boy took the chair" : "does NOT say a boy took the chair"}`); }

    /* 2 · a scion's too */
    { const { d, c } = mk(17, 63);
      d.heir = { kind:"scion", name:c.name, named:d.week, raised:true, cid:c.id, traits:[] };
      die(d);
      say(d.generation === 2 && d.lanista.age === 17, `a scion of seventeen takes the house at ${d.lanista.age}`); }

    /* 3 · a nephew is still rolled */
    { const ages = [];
      for(let i=0;i<6;i++){ const { d } = mk(11, 60); A.nameHeir(d, "nephew"); die(d); ages.push(d.lanista.age); }
      say(ages.every(a=>a>=22 && a<=31), `six nephews arrive aged ${ages.join("/")} — the ri(22,31) roll, since there is no birth week to read`); }

    /* 4 · the retirement door and a minor */
    { let onTen = 0, onSeventeen = 0, deathOpens = 0;
      for(let i=0;i<300 && onTen < 1; i++){ const { d, c } = mk(10, 63); A.nameHeir(d, "son", c.id); try { A.lanistaWeek(d); } catch(e){} if(d.succession && d.succession.retire) onTen++; }
      for(let i=0;i<300 && onSeventeen < 1; i++){ const { d, c } = mk(17, 63); A.nameHeir(d, "son", c.id); try { A.lanistaWeek(d); } catch(e){} if(d.succession && d.succession.retire) onSeventeen++; }
      { const { d, c } = mk(10, 63); A.nameHeir(d, "son", c.id); d.lanista.health = 0; try { A.lanistaWeek(d); } catch(e){} if(d.succession && !d.over) deathOpens++; }
      const ofAge10 = (()=>{ const { d, c } = mk(10, 63); A.nameHeir(d, "son", c.id); return A.heirOfAge(d); })();
      out.notes.push(`retirement rolls: boy of 10 → ${onTen} in 300 · boy of 17 → ${onSeventeen ? "opened" : "never"} · heirOfAge with a boy of 10: ${ofAge10} · death door with a boy of 10: ${deathOpens ? "hands on" : "SHUT"}`);
      say(onTen === 0 && onSeventeen >= 1 && deathOpens === 1 && ofAge10 === false,
        `retirement onto a boy of ten opened ${onTen} times in 300; onto a boy of seventeen ${onSeventeen ? "opened" : "never opened"}; the death door with a minor named ${deathOpens ? "still hands on" : "is shut"}`); }

    /* 5 · no wife for a boy.
       THE FIRST DRAFT OF THIS ARM WAS INERT: it never named the son, so `die()` ended the run instead
       of seating the boy, and `marryReady` came back false for a sixty-year-old with no health — the
       right answer for the wrong man. Sabotaging the guard out passed. The arm now proves the boy is
       in the chair before it asks, so it cannot be vacuous the same way twice. */
    { const { d, c } = mk(11, 60); A.nameHeir(d, "son", c.id); die(d);
      const seated = d.generation === 2 && d.lanista.age === 11;
      d.fame = 200; A.domusOf(d).wife = null;
      const at11 = A.marryReady(d);
      d.lanista.age = 18; const at18 = A.marryReady(d);
      say(seated && at11 === false && at18 === true,
        `the boy ${seated ? "is" : "is NOT"} in the chair at 11; marryReady for him at 11: ${at11}; at 18: ${at18}`); }

    /* 6 · years at the head are this man's */
    { const { d, c } = mk(11, 60);
      const first = A.yearsAtHead(d, d.lanista), y0 = A.yearOf(d);
      A.nameHeir(d, "son", c.id); die(d);
      const after = A.yearsAtHead(d, d.lanista), y1 = A.yearOf(d);
      /* and the lanistaDied record, which the ending's text reads */
      const { d:e } = mk(11, 70); e.lanista.since = e.week - 36; e.lanista.health = 0; try { A.lanistaWeek(e); } catch(x){}
      say(first === y0 && after === 1 && y1 >= 6 && e.over && e.over.kind==="lanistaDied" && e.over.years === 3,
        `first lanista: yearsAtHead ${first} = yearOf ${y0}; the boy after succession: ${after} (yearOf says ${y1}); a man dead after 36 weeks at the head: ${e.over ? e.over.years : "no ending"} years on the record`); }

    return out;
  });
  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  for(const n of r.notes) lines.push(n);
  r.arms.forEach((a,i)=>{ lines.push(`${i+1}. ${a.ok ? "held" : "FAILED"} — ${a.why}`); if(!a.ok) bad.push(`arm ${i+1}: ${a.why}`); });

  /* 6b · and the sheet says it — a succeeded house, planted, its lanista sheet read */
  const planted = await forge(p, (A)=>{
    const d = A.newGameState("Minor", "clean", "MINOR-SHEET");
    d.week = 6*A.YEAR_WEEKS + 4; d.lanista = A.makeLanista(d); d.lanista.age = 60; d.lanista.since = 1;
    const dm = A.domusOf(d); dm.wife = { name:"Prima Vettia", family:"the Vettii", married:2, age:24, from:"merchant" };
    const c = { id:dm.nextKin++, name:"Lucius Minor", sex:"m", born: d.week - 11*A.YEAR_WEEKS, up:{palus:1,rhetor:0,box:0} }; dm.children.push(c);
    A.nameHeir(d, "son", c.id); d.lanista.health = 0; A.lanistaWeek(d); if(d.succession) A.takeUpTheHouse(d);
    return { plant:d, age:d.lanista.age, gen:d.generation, week:d.week };
  });
  if(planted && planted.__forge) bad.push(`arm 6b could not be set up: ${planted.__forge}`);
  else {
    await tab(p, "villa"); await p.waitForTimeout(260);
    const opened = await p.evaluate(()=>{ document.querySelectorAll("details").forEach(x=>{ x.open = true; });
      const row = [...document.querySelectorAll("button.optrow")].find(x=>/^\s*The Lanista/i.test((x.innerText||"").replace(/\n/g," ")));
      if(!row) return { why:"no Lanista row on the records shelf" }; row.click(); return { why:null }; });
    if(opened.why) bad.push(`arm 6b: ${opened.why}`);
    else { await p.waitForTimeout(320);
      const txt = await p.evaluate(()=>(document.body.innerText||"").replace(/\n/g," "));
      const m = txt.match(/(\d+) years old · (\d+) years? at the head of this house/);
      lines.push(`6b. the sheet: ${m ? m[0] : "no age line found"} (planted: a boy of ${planted.age}, generation ${planted.gen}, week ${planted.week})`);
      if(!m) bad.push(`arm 6b: the lanista sheet did not show its age line`);
      else if(+m[1] !== planted.age) bad.push(`arm 6b: the sheet says ${m[1]} years old for a boy of ${planted.age}`);
      else if(+m[2] !== 1) bad.push(`arm 6b: the sheet says ${m[2]} years at the head for a boy who took the chair this week`); }
  }
  return { pass: bad.length === 0 && !errors.length, why: bad[0] || null, lines };
}
