/* THE SIXTEEN, DRIVEN — WHICH OF THEM ACTUALLY DO ANYTHING?

   v3.23.0 put nineteen player actions on the handle that no check could reach; sixteen of them were
   reachable by a click and by nothing else in the program. Exposing a function proves nothing about
   whether the system behind it works — it makes the question askable. This asks it.

   TWO QUESTIONS PER ACTION, and they are different:
     OPEN   over real play, how often is the game's own readiness gate satisfied? That is whether a
            player could ever have clicked it. Where the game HAS a gate (`favourReady`,
            `gambitReady`, `nemAnswerReady`, `nemCanCallOut`, `seasonOfMan`) it is called rather than
            reconstructed — reconstructing a gate is what made #132 wrong three times.
     WORKS  on a week the gate is open, call it on a CLONE and see whether the save changed. A clone
            because the answer must not perturb the run that is producing the other rows.

   The two can disagree in both directions and both disagreements are findings. Never open, always
   works = content the player never meets. Often open, never works = a button that does nothing.

   HOW THIS COULD BE WRONG, which is the standing hazard here:
     · an action called with arguments a player would never pass measures nothing. Every argument is
       taken FROM THE STATE — a patron off `patronsOf`, a key off the game's own table — and where no
       argument can be built the row says NO FIXTURE rather than counting a zero. `actions` set that
       precedent: a fixture the check failed to build is the check's problem, and it should say so.
     · a clone that is not deep enough would report "nothing changed" for everything. The clone is
       compared against itself first, and a row that cannot even be cloned is reported.
     · these are the reference player's weeks. An action gated on something it never does reads as
       never-open and that is a fact about the rope, not the game — the `road` and `holdMunera`
       lessons exactly. Rows are marked where the rope is known not to pursue the system. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 8), W = +(process.argv[3] || 320);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["GAMBITS","SWEARING","PLANSEASON","favourReady","gambitReady","nemAnswerReady",
    "nemCanCallOut","seasonOfMan"].filter(k => A[k] == null);
  if(miss.length) return { miss };

  const clone = d => { try { return structuredClone(d); } catch(e){ return JSON.parse(JSON.stringify(d)); } };
  const sig = d => JSON.stringify(d);

  /* Each row: a gate taken off the game where one exists, and a call built from the state.
     `args` returns null when no fixture can be built — which is reported, not counted as a zero. */
  const ROWS = [
    { k:"answerNem",   gate:d=>A.nemAnswerReady(d),
      args:d=>[d] },
    { k:"nemCallOut",  gate:d=>A.nemCanCallOut(d),
      args:d=>[d] },
    { k:"callFavour",  gate:d=>A.patronsOf(d).some(x=>A.favourReady(d,x)),
      args:d=>{ const p = A.patronsOf(d).find(x=>A.favourReady(d,x)); return p ? [d, p.id] : null; } },
    /* ---- AND FOUR ROWS THAT READ "NEVER OPEN" ABOUT THE ROPE, NOT ABOUT THE GAME ----
       `repay` wants a loan, `applyKit` and `dropKit` want a saved kit, `breakPlan` wants a drilled
       season — and the reference player borrows nothing, saves no kit and drills no season, so all
       four read 0 of 2,470 house-weeks and looked like content nobody can reach. That is a fact
       about the policy. `arm` switches the system on IN THE CLONE first, so the row answers the
       question that was meant: once a player has done the thing before it, does the next step work?
       The OPEN column still reports the reference player's own rate, and a row with an `arm` says so. */
    { k:"repay",       gate:d=>!!d.loan && d.gold > 0, rope:"never borrows",
      arm:d=>{ if(!d.loan && A.canBorrow && A.canBorrow(d)) A.borrow(d, "murena", 2000); },
      args:d=>d.loan ? [d, Math.min(Math.max(d.gold,1), 50)] : null },
    { k:"sellDebt",    gate:d=>(d.owed||[]).some(x=>!x.paid),
      args:d=>{ const x=(d.owed||[]).find(y=>!y.paid); return x ? [d, x.id] : null; } },
    { k:"runGambit",   gate:d=>A.gambitReady(d) && (d.rivals||[]).length > 0,
      args:d=>{ const h=(d.rivals||[])[0]; const k=Object.keys(A.GAMBITS)[0];
                return h ? [d, k, h.house || h.name] : null; } },
    { k:"backCandidate", gate:d=>!!(d.election && !d.election.done && (d.election.runners||d.election.cands||[]).length),
      args:d=>{ const e=d.election||{}; const c=(e.runners||e.cands||[])[0];
                return c ? [d, c.id != null ? c.id : c.name, 1] : null; } },
    { k:"swearIn",     gate:d=>A.activeG(d).some(g=>!g.sworn),
      args:d=>{ const g=A.activeG(d).find(x=>!x.sworn); return g ? [d, g.id, Object.keys(A.SWEARING)[0]] : null; } },
    { k:"applyRefusal", gate:d=>A.activeG(d).some(g=>g.refusing),
      args:d=>{ const g=A.activeG(d).find(x=>x.refusing); return g ? [d, g, "whip"] : null; } },
    { k:"skipWeeks",   gate:d=>A.weekWeight(d).kind === "quiet",
      args:d=>[d, 2] },
    { k:"charterSkip", gate:d=>!!(d.charter && !d.charter.skipped),
      args:d=>[d] },
    { k:"firstBuyWarn", gate:d=>!(d.flags||{}).sawFirstBuy,
      args:d=>[d] },
    { k:"saveKit",     gate:d=>A.activeG(d).length > 0,
      args:d=>{ const g=A.activeG(d)[0]; return g ? [d, g.id] : null; } },
    /* saving the FIRST man's kit and applying it back to the FIRST man is a no-op by construction,
       and read as 2,408 of 2,408 opens doing nothing — an "OPEN AND INERT" verdict manufactured
       entirely by the fixture. It saves off one man and applies to ANOTHER, which is what the
       screen is for, and says NO FIXTURE on a yard of one. */
    { k:"applyKit",    gate:d=>(d.kits||[]).length > 0 && A.activeG(d).length > 1, rope:"saves no kit",
      arm:d=>{ const g=A.activeG(d)[0]; if(g && !(d.kits||[]).length) A.saveKit(d, g.id); },
      args:d=>{ const men=A.activeG(d), k=(d.kits||[])[0];
                return (men.length > 1 && k) ? [d, men[1].id, k.id] : null; } },
    { k:"dropKit",     gate:d=>(d.kits||[]).length > 0, rope:"saves no kit",
      arm:d=>{ const g=A.activeG(d)[0]; if(g && !(d.kits||[]).length) A.saveKit(d, g.id); },
      args:d=>{ const k=(d.kits||[])[0]; return k ? [d, k.id] : null; } },
    { k:"watchField",  gate:d=>!!(d.games && d.games.week === d.week && (d.games.offers||[]).length),
      args:d=>{ const o=(d.games&&d.games.offers||[])[0]; return o ? [d, o] : null; } },
    { k:"startPlan",   gate:d=>A.activeG(d).some(g=>!A.seasonOfMan(g)),
      args:d=>{ const g=A.activeG(d).find(x=>!A.seasonOfMan(x)); return g ? [d, g, Object.keys(A.PLANSEASON)[0]] : null; } },
    { k:"breakPlan",   gate:d=>A.activeG(d).some(g=>A.seasonOfMan(g)), rope:"drills no season",
      arm:d=>{ const g=A.activeG(d).find(x=>!A.seasonOfMan(x));
               if(g) A.startPlan(d, g, Object.keys(A.PLANSEASON)[0]); },
      args:d=>{ const g=A.activeG(d).find(x=>A.seasonOfMan(x)); return g ? [d, g, "probe"] : null; } },
    /* the panel offers this INSIDE a block gated on `g.watchedBy`, so a gate of "he is alive" is not
       the game's gate — it read 78% of 2,408 opens as a button that did nothing, and every one of
       those was a man nobody was watching. The probe's own head warns against reconstructing a
       gate; this file was doing it. */
    { k:"clearWatch",  gate:d=>A.activeG(d).some(g=>g.watchedBy),
      args:d=>{ const g=A.activeG(d).find(x=>x.watchedBy); return g ? [d, g] : null; } },
  ];
  const tally = {};
  for(const r of ROWS) tally[r.k] = { open:0, armed:0, noFixture:0, changed:0, same:0, threw:0, ret:{},
    rope: r.rope || null };

  let weeks = 0;
  for(let h=0;h<H;h++){
    const d = A.newGameState("Dk"+h,"clean",`DARK-${h}`,null);
    for(let w=0;w<W;w++){
      if(d.over) break;
      weeks++;
      for(const r of ROWS){
        const t = tally[r.k];
        let isOpen = false;
        try { isOpen = !!r.gate(d); } catch(e){ }
        if(isOpen) t.open++;
        const c = clone(d);
        /* a row with an `arm` switches its own system on in the clone and asks again — the reference
           player's rate is already counted above and is reported beside it, not instead of it */
        if(!isOpen && r.arm){
          try { r.arm(c); } catch(e){}
          try { isOpen = !!r.gate(c); } catch(e){}
          if(isOpen) t.armed++;
        }
        if(!isOpen) continue;
        let a = null;
        try { a = r.args(c); } catch(e){}
        if(!a){ t.noFixture++; continue; }
        const before = sig(c);
        let ret;
        try { ret = A[r.k](...a); } catch(e){ t.threw++; continue; }
        const key = ret === true ? "true" : ret === false ? "false" : ret == null ? "null" : typeof ret;
        t.ret[key] = (t.ret[key]||0)+1;
        if(sig(c) !== before) t.changed++; else t.same++;
      }
      R.lanista(d);
    }
  }
  return { weeks, tally, H, W, rope:R.say() };
}, [H,W]);
await browser.close(); server.close();
if(out.miss){ console.error("not on the handle: " + out.miss.join(", ")); process.exit(1); }
const pc = (n,d) => d ? `${Math.round(n/d*100)}%` : "-";
console.log(`=== THE SIXTEEN, DRIVEN ===`);
console.log(`  ${out.weeks} house-weeks over ${out.H} houses x ${out.W} weeks\n`);
console.log(`  action          open to the rope   armed   no fixture   CHANGED THE SAVE   did nothing   threw`);
const rows = Object.entries(out.tally).sort((a,b)=>(a[1].open+a[1].armed)-(b[1].open+b[1].armed));
for(const [k,t] of rows){
  const tried = t.changed + t.same;
  console.log(`  ${k.padEnd(15)} ${String(t.open).padStart(7)} (${pc(t.open,out.weeks).padStart(4)})`
    + `   ${String(t.armed||0).padStart(6)}`
    + `   ${String(t.noFixture).padStart(10)}`
    + `   ${String(t.changed).padStart(9)} (${pc(t.changed,tried).padStart(4)})`
    + `   ${String(t.same).padStart(11)}   ${String(t.threw).padStart(5)}`
    + (t.open === 0 && !t.armed ? "   <- NEVER OPEN" : tried && !t.changed ? "   <- OPEN AND INERT" : ""));
}
const armedRows = rows.filter(([,t])=>t.rope);
if(armedRows.length){
  console.log(`\n  the ARMED column is weeks where the reference player's own policy closed the gate and the`);
  console.log(`  clone had the system switched on before asking. It is a fact about the rope, not the game:`);
  for(const [k,t] of armedRows)
    console.log(`    ${k.padEnd(15)} the reference player ${t.rope}`);
}
console.log(`\n  what each returned: `);
for(const [k,t] of rows){
  const r = Object.entries(t.ret).map(([a,b])=>`${a} x${b}`).join(", ");
  if(r) console.log(`    ${k.padEnd(15)} ${r}`);
}
console.log(`\n  rope: ${out.rope}`);
