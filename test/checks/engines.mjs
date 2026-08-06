/* The four fight engines, held to the shape they are supposed to have.

   Two things worth knowing before changing the bands. The seeded RNG correlates
   draws within a page load, so a win rate at n=3000 swings about two and a half
   points between identical runs — the bands below are wide on purpose and a
   failure means a real move, not noise. And power multipliers compound over
   twelve rounds, so a one per cent edge is worth roughly three points of win
   rate: small-looking constants are not small. */

import { hasHandle } from "../harness.mjs";

export const name = "engines";
export const describe = "the editor's thumb is on the scale and the ceiling holds at sixty";

export async function run({ p }){
  if(!(await hasHandle(p))) return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(N=>{
    const A = window.__LVDVS;
    const man = o => Object.assign({ id:1, sex:"m", name:"X", cls:"Murmillo", origin:"Thracian",
      morale:74, fatigue:0, injury:null, traits:[], heart:66, pfame:50, wins:10, losses:6, kills:1,
      scars:[], lasting:[], nick:null, kit:A.defaultKit("Murmillo"), potential:80, age:26,
      str:60,agi:60,end:60,tec:60,sho:60,dis:60 }, o||{});
    const ctx = ()=>({ d:{ties:[],gladiators:[],flags:{}}, favor:45, fav:0, patron:null, aedile:0,
      venue:0, doctrine:0, tier:1, guarded:false, hostile:false, strange:0, sky:1, skyB:1,
      plan:{pow:1,stam:1,guard:1} });

    const even = (tac, extra) => { let w=0, n=0;
      for(let i=0;i<N;i++){
        const a = man(Object.assign({name:"Yours"}, extra||{})), b = man({name:"Theirs"});
        const r = A.simulateFight(a, b, tac||"measured", "standard", ctx(), {});
        if(r.unfinished) continue; n++; if(r.winner==="A") w++;
      }
      return { pc:+(w/n*100).toFixed(1), n }; };

    /* the ceiling: a maxed man, reading his opponent right, best tactic, even foe */
    const maxed = { str:99,agi:99,end:99,tec:99,sho:99,dis:99, potential:99, morale:100, wins:40 };
    const ceiling = (()=>{ let w=0,n=0;
      for(let i=0;i<N;i++){
        const a = man(Object.assign({name:"Yours"}, maxed)), b = man(Object.assign({name:"Theirs"}, maxed));
        const c = ctx(); c.plan = { pow:1.027, stam:0.962, guard:0.977, right:true };
        const r = A.simulateFight(a, b, "aggressive", "standard", c, {});
        if(r.unfinished) continue; n++; if(r.winner==="A") w++;
      }
      return { pc:+(w/n*100).toFixed(1), n }; })();

    /* the other three engines, each even against itself */
    const pair = (()=>{ let w=0,n=0;
      for(let i=0;i<N/3;i++){
        const r = A.simulatePair([man({name:"A1"}),man({name:"A2"})], [man({name:"B1"}),man({name:"B2"})],
          "measured", "standard", { d:{ties:[],gladiators:[],flags:{}}, favor:45, tier:1 }, {});
        if(r.unfinished) continue; n++; if(r.win) w++;
      }
      return { pc:+(w/n*100).toFixed(1), n }; })();

    /* ---- THE TRIANGLE ----
       The point of four words is that none of them is the answer. Measured over a
       full matrix — every tactic against every tactic — each of the three should
       take one other apart and be taken apart by a third, and showing off should
       answer nothing. Before this was fitted, defensive won most AND buried fewest:
       strictly better on both axes, which is not a choice. */
    const TACS = ["measured","aggressive","defensive","showboat"];
    const grid = {}, dead = {};
    for(const mine of TACS){ grid[mine] = {}; dead[mine] = {};
      for(const foe of TACS){ let w=0,n=0,dd=0;
        for(let i=0;i<Math.round(N/4);i++){
          const a = man({name:"Yours"}), b = man({name:"Theirs"});
          const r = A.simulateFight(a, b, mine, "sine", ctx(), { foeTac:foe });
          if(r.unfinished) continue; n++; if(r.winner==="A") w++; if(r.aDies) dd++;
        }
        grid[mine][foe] = n ? +(w/n*100).toFixed(1) : 0;
        dead[mine][foe] = n ? +(dd/n*100).toFixed(1) : 0;
      } }
    const avg = o => +(TACS.reduce((s,k)=>s+o[k],0)/4).toFixed(1);
    return { measured:even("measured"), aggressive:even("aggressive"),
      defensive:even("defensive"), showboat:even("showboat"), ceiling, pair,
      grid, dead, win:{ measured:avg(grid.measured), aggressive:avg(grid.aggressive),
        defensive:avg(grid.defensive), showboat:avg(grid.showboat) },
      buried:{ measured:avg(dead.measured), aggressive:avg(dead.aggressive),
        defensive:avg(dead.defensive), showboat:avg(dead.showboat) } };
  }, 1500);

  const lines = [
    `even bout, measured    ${out.measured.pc}%  (n=${out.measured.n})`,
    `even bout, aggressive  ${out.aggressive.pc}%`,
    `even bout, defensive   ${out.defensive.pc}%`,
    `even bout, showboat    ${out.showboat.pc}%`,
    `maxed man, right read, best tactic, even foe: ${out.ceiling.pc}%`,
    `pair bout, even sides  ${out.pair.pc}%  (n=${out.pair.n})`,
    `across the whole matrix — win%:  ` + Object.entries(out.win).map(([k,v])=>`${k} ${v}`).join("  "),
    `                        buried%: ` + Object.entries(out.buried).map(([k,v])=>`${k} ${v}`).join("  "),
    `the triangle: forward answers straight (${out.grid.aggressive.measured} v ${out.grid.measured.measured}) · ` +
      `shield answers forward (${out.grid.defensive.aggressive} v ${out.grid.aggressive.aggressive}) · ` +
      `patience answers shield (${out.grid.measured.defensive} v ${out.grid.defensive.defensive})`,
  ];
  const fails = [];
  /* THE EDITOR'S THUMB. A dead-even mirror is deliberately NOT a coin flip — FOE_EDGE
     puts about two per cent of power on the other man because a house that wins
     everything is not a card the crowd goes home talking about. So the test is that
     an even bout sits on the wrong side of fifty, not on it. Assert the direction,
     not a target: the exact figure moves with every tactic change and pinning it
     would make this check cry wolf. */
  if(out.measured.pc >= 50)
    fails.push(`an even mirror wins ${out.measured.pc}% — the editor's thumb is off the scale`);
  if(out.measured.pc < 28)
    fails.push(`an even mirror wins only ${out.measured.pc}% — the thumb has become a fist`);
  /* the ceiling is the one number that was chosen out loud: v2.5.0 set it at sixty */
  if(out.ceiling.pc < 52 || out.ceiling.pc > 68)
    fails.push(`the ceiling is ${out.ceiling.pc}%, outside 52-68 — it is meant to sit at sixty`);
  if(out.ceiling.pc <= out.measured.pc)
    fails.push(`a maxed man reading right (${out.ceiling.pc}%) does no better than an even mirror (${out.measured.pc}%)`);
  /* showing off is meant to cost you the bout you are showing off in */
  const best = Math.max(out.measured.pc, out.aggressive.pc, out.defensive.pc);
  if(out.showboat.pc >= best)
    fails.push(`showboat (${out.showboat.pc}%) is not the worst tactic`);
  /* the pair has no published target; catch it only when it has stopped being a fight */
  if(out.pair.pc <= 2 || out.pair.pc >= 98)
    fails.push(`the pair engine returns ${out.pair.pc}% — it has stopped deciding anything`);

  /* ---- and the triangle ---- */
  const g = out.grid;
  if(!(g.aggressive.measured > g.measured.measured))
    fails.push(`going forward does not answer a man fighting it straight (${g.aggressive.measured} vs his own ${g.measured.measured})`);
  if(!(g.defensive.aggressive > g.aggressive.aggressive))
    fails.push(`the shield does not answer a charge (${g.defensive.aggressive} vs ${g.aggressive.aggressive})`);
  if(!(g.measured.defensive > g.defensive.defensive))
    fails.push(`patience does not answer a shield (${g.measured.defensive} vs ${g.defensive.defensive})`);
  /* nothing may be best on both axes at once — that is what made this a non-choice */
  const W = out.win, D = out.buried;
  for(const t of ["measured","aggressive","defensive","showboat"]){
    const bestWin = Object.values(W).every(v => W[t] >= v);
    const safest  = Object.values(D).every(v => D[t] <= v);
    if(bestWin && safest) fails.push(`${t} wins most (${W[t]}%) AND buries fewest (${D[t]}%) — it is not a choice, it is the answer`);
  }
  if(W.showboat >= Math.min(W.measured, W.aggressive, W.defensive))
    fails.push(`showboat (${W.showboat}%) is not behind all three of the others`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
