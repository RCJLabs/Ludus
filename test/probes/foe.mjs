/* #216 — WHAT THE MAN ACROSS THE SAND ACTUALLY CARRIES

   The item: "on the sand he is a bare class silhouette, whatever his fame. The bearing/ornament
   machinery built for our men in v3.146.0 (`boreOf`, fame rings, kill marks) NEVER APPLIES to him."

   THE SECOND HALF IS FALSE ON ITS FACE. Every one of the eight sites that builds an arena snapshot
   passes `bore: boreOf(...)` for side B as well as side A — grep it. So the route exists and the
   opponent's figure is drawn through exactly the same reading our men are.

   WHICH MAKES THE QUESTION A DIFFERENT ONE, and the one this project keeps having to ask: the
   route is there, but does anything come down it? `boreOf` reads four fields:

       boreOf = g => ({ hurt: g.injury ? g.injury.part : null,
                        spent: (g.fatigue||0)/100,
                        fame:  g.pfame||0,
                        kills: g.kills||0 })

   and `genOpponent` sets `fatigue:0`, `injury:null`, a real `pfame`, and NEITHER `kills` NOR
   `scars`. So three of the four are dead on arrival and the fourth may be the only thing keeping
   the item from being wholly true.

   This measures it on the real path: every opponent a played house actually meets, through all
   four doors, with what the snapshot carries and what `boreOf` makes of it — against our own men
   over the same bouts, so "the opponent is flat" has something to be flat against.

     node test/probes/foe.mjs 8 60 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 8), B = +(process.argv[3] || 60);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"FOE" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,B])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","boreOf","genOpponent"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  const blank = () => ({ n:0, fame:[], kills:[], spent:[], hurt:0, scars:[], marks:[], wins:[], nick:0, house:0 });
  const foe = blank(), mine = blank();
  const put = (S, g) => { if(!g) return;
    S.n++;
    S.fame.push(Math.round(g.pfame||0));
    S.kills.push(g.kills||0);
    S.spent.push(Math.round(g.fatigue||0));
    if(g.injury) S.hurt++;
    S.scars.push((g.scars||[]).length);
    S.marks.push(A.marksOf ? A.marksOf(g).length : 0);   /* what the DRAWING is handed */
    S.wins.push(g.wins||0);
    if(g.nick) S.nick++;
    if(g.house) S.house++;
  };

  let bouts = 0, doors = {};
  for(let h=0; h<H; h++){
    const d = A.newGameState("Foe", "clean", "FOE-"+h, null);
    for(let w=0; w<12; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
    for(let i=0; i<B*3 && bouts < (h+1)*B; i++){
      if(d.over) break;
      let t; try { t = R.takeBout(d, {}); } catch(e){ t = null; }
      if(!t || t.ran === false){ try { R.lanista(d); } catch(e){ break; } continue; }
      bouts++;
      const o = t.offer || {};
      const door = o.melee ? "melee" : o.pair ? "pair" : o.venatio ? "venatio" : "singles";
      doors[door] = (doors[door]||0) + 1;
      /* every opponent this bout put across the sand, whichever door it came through */
      const foes = [].concat(o.opp || [], o.opps || []).filter(Boolean);
      for(const x of foes) put(foe, x);
      for(const g of A.activeG(d)) if(g.lastFought === d.week) put(mine, g);
    }
  }

  /* and what boreOf makes of a fresh opponent at each tier, which is the drawing's own input */
  const tiers = [0,1,2,3].map(tier => {
    const s = { fame:[], kills:[], spent:[], hurt:0, scars:[] };
    for(let i=0;i<400;i++){ const o = A.genOpponent(tier, undefined, null); const b = A.boreOf(o);
      s.fame.push(Math.round(b.fame)); s.kills.push(b.kills); s.spent.push(+b.spent.toFixed(2));
      if(b.hurt) s.hurt++; s.scars.push((o.scars||[]).length); }
    return { tier, ...s };
  });

  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at = f=>s[Math.floor(f*(s.length-1))];
    return { n:s.length, min:s[0], p50:at(.5), p90:at(.9), max:s[s.length-1],
      distinct:new Set(a).size, zero:+(a.filter(v=>!v).length/a.length*100).toFixed(1) }; };
  const roll = S => ({ n:S.n, fame:q(S.fame), kills:q(S.kills), spent:q(S.spent),
    scars:q(S.scars), marks:q(S.marks), wins:q(S.wins), hurtPc:S.n?+(S.hurt/S.n*100).toFixed(1):0,
    nickPc:S.n?+(S.nick/S.n*100).toFixed(1):0 });
  /* AND WHAT IT COSTS THE BALANCE. `simulateFight` opens the crowd on
     (A.scars.length + B.scars.length)*1.2, and B's half has been zero on every bout ever played. */
  const K = A.SCAR_CROWD || 0.6;   /* the weight the sim actually uses, not a copy of it */
  const crowdAdd = foe.marks.reduce((n,v)=>n+v,0) / Math.max(1, foe.marks.length) * K;
  return { bouts, doors, crowdAdd:+crowdAdd.toFixed(2), foe:roll(foe), mine:roll(mine),
    tiers: tiers.map(t=>({ tier:t.tier, fame:q(t.fame), kills:q(t.kills), spent:q(t.spent),
      scars:q(t.scars), hurt:t.hurt })) };
}, [H,B]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  console.log(`${out.bouts} bouts · ${Object.entries(out.doors).map(([k,v])=>`${k} ${v}`).join(" · ")}\n`);
  const show = (label, S) => {
    console.log(`${label} — ${S.n} men across the sand`);
    for(const k of ["fame","kills","spent","scars","marks","wins"]){
      const v = S[k]; if(!v){ console.log(`  ${k.padEnd(6)} —`); continue; }
      console.log(`  ${k.padEnd(6)} p50 ${String(v.p50).padStart(4)} · p90 ${String(v.p90).padStart(4)} · max ${String(v.max).padStart(4)}`
        + ` · ${String(v.distinct).padStart(3)} distinct values · ${String(v.zero).padStart(5)}% are zero`);
    }
    console.log(`  hurt when he walks on: ${S.hurtPc}%  ·  carries a nickname: ${S.nickPc}%\n`);
  };
  show("THE MAN ACROSS THE SAND", out.foe);
  show("YOUR OWN MAN", out.mine);
  console.log(`THE CROWD TERM: his marks add ${out.crowdAdd} to the opening crowd, on a term whose`);
  console.log(`  second half was structurally zero on every bout this game had ever played.\n`);
  console.log(`WHAT genOpponent HANDS THE DRAWING, 400 fresh men a tier:`);
  console.log(`  tier   fame p50/max      kills distinct   spent distinct   scars distinct   hurt`);
  for(const t of out.tiers)
    console.log(`   ${t.tier}     ${String(t.fame.p50).padStart(4)} / ${String(t.fame.max).padStart(4)}`
      + `        ${String(t.kills.distinct).padStart(6)}           ${String(t.spent.distinct).padStart(6)}`
      + `           ${String(t.scars.distinct).padStart(6)}      ${t.hurt}`);
}
console.log("\n" + JSON.stringify({ foe: out.foe, mine: out.mine }));
await browser.close(); server.close();
