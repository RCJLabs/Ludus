/* The four fight engines, held to the shape they are supposed to have.

   Two things worth knowing before changing the bands. The seeded RNG correlates
   draws within a page load, so a win rate at n=3000 swings about two and a half
   points between identical runs — the bands below are wide on purpose and a
   failure means a real move, not noise. And power multipliers compound over
   twelve rounds, so a one per cent edge is worth roughly three points of win
   rate: small-looking constants are not small. */

import { hasHandle } from "../harness.mjs";

export const name = "engines";
export const describe = "all four engines, and the odds the player is quoted";

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

    /* ---- THE OTHER THREE ENGINES, EACH EVEN AGAINST ITSELF ----
       This comment sat above a block that tested one of them. A coverage sweep of
       the whole suite — every function on the test handle wrapped in a counter,
       every check run against it — found that engines, the check named for the
       fight engines, called simulateFight and simulatePair and nothing else. The
       melee and the venatio have their own eighteen and fourteen rounds, their own
       withdrawal and crux logic, and every balance pass in this game touches them.
       Neither had ever been put through this check. */
    const pair = (()=>{ let w=0,n=0;
      for(let i=0;i<N/3;i++){
        const r = A.simulatePair([man({name:"A1"}),man({name:"A2"})], [man({name:"B1"}),man({name:"B2"})],
          "measured", "standard", { d:{ties:[],gladiators:[],flags:{}}, favor:45, tier:1 }, {});
        if(r.unfinished) continue; n++; if(r.win) w++;
      }
      return { pc:+(w/n*100).toFixed(1), n }; })();

    /* three of yours against three of theirs, everyone identical.

       THE FIRST VERSION OF THIS BLOCK SCORED IT WRONG, and the way it was wrong
       is worth keeping. It asked whether r.winner pointed at one of yours — last
       man standing — and got 0% across sixty melees, which read as a dead engine.
       It is not: eighteen rounds rarely reduce six evenly-matched men to one, so
       winner sits at -1 almost always and the melee ends with people still up.
       The deaths were there the whole time, 177 of them, on r.ents[].dead. Score
       it the way the sand actually settles: who has more men left on their feet. */
    const melee = (()=>{ let w=0,l=0,drew=0,n=0,dead=0,men=0,left=0;
      /* the plan keys are the ones meleePlanEffect returns — pow, def, stam, hunt.
         Writing `guard` for `def` here made every one of your men unkillable and
         the check read 100%; the engine now fills a short plan in, but a harness
         that lies about the shape of a call is not testing the game either. */
      const mctx = { favor:45, street:0, patron:null, myTactic:"measured", naumachia:false,
        plan:{ pow:1, def:1, stam:1, hunt:false }, tie:()=>null };
      const up = e => !e.dead && !e.out && !e.withdrew;
      for(let i=0;i<N/6;i++){
        const field = [];
        for(let k=0;k<3;k++){ const c = man({ name:"Mine"+k }); c.mine = true;  c.gid = 100+k; c.house = null; field.push(c); }
        for(let k=0;k<3;k++){ const c = man({ name:"Theirs"+k }); c.mine = false; c.gid = null;  c.house = "Vettius"; field.push(c); }
        const r = A.simulateMelee(field, mctx, {});
        if(!r || r.unfinished) continue;
        n++;
        const ents = r.ents || [];
        const mine = ents.filter(e=>e.mine), theirs = ents.filter(e=>!e.mine);
        const a = mine.filter(up).length, b = theirs.filter(up).length;
        men += mine.length; left += a;
        dead += mine.filter(e=>e.dead).length;
        if(a > b) w++; else if(a < b) l++; else drew++;
      }
      return { pc:n?+(w/n*100).toFixed(1):0, lost:n?+(l/n*100).toFixed(1):0,
        drew:n?+(drew/n*100).toFixed(1):0, n,
        dead:men?+(dead/men*100).toFixed(1):0, standing:n?+(left/n).toFixed(2):0 }; })();

    /* and one man against each animal in the book */
    const hunt = (()=>{ const rows = [];
      for(const key of Object.keys(A.BEASTS||{})){
        let killed=0, died=0, n=0;
        for(let i=0;i<N/4;i++){
          const a = man({ name:"Hunter", cls:"Hoplomachus", kit:A.defaultKit("Hoplomachus") });
          const r = A.simulateVenatio(a, key, "measured",
            { favor:45, grade:0.5, patron:null, plan:{pow:1,stam:1,guard:1} }, {});
          if(!r || r.unfinished) continue;
          n++; if(r.killed) killed++; if(r.aDies) died++;
        }
        if(n) rows.push({ key, n, killed:+(killed/n*100).toFixed(0), died:+(died/n*100).toFixed(0) });
      }
      return rows; })();

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
        for(let i=0;i<Math.round(N*0.8);i++){
          const a = man({name:"Yours"}), b = man({name:"Theirs"});
          const r = A.simulateFight(a, b, mine, "sine", ctx(), { foeTac:foe });
          if(r.unfinished) continue; n++; if(r.winner==="A") w++; if(r.aDies) dd++;
        }
        grid[mine][foe] = n ? +(w/n*100).toFixed(1) : 0;
        dead[mine][foe] = n ? +(dd/n*100).toFixed(1) : 0;
      } }
    const avg = o => +(TACS.reduce((s,k)=>s+o[k],0)/4).toFixed(1);

    /* ---- AND WHETHER THE BOOKMAKER IS QUOTING THE SAME FIGHT ----
       winChance is what the player is shown before every bout, what the wager is
       priced from, and what the sine missione warning added in v2.33.0 reads. It
       had never been checked against the sand it claims to describe. */
    const book = (()=>{ const rows = [];
      for(const [label, mine, theirs] of [["even",60,60],["yours the better",76,60],["yours outmatched",56,72]]){
        const a = man({ name:"Yours",  str:mine,agi:mine,end:mine,tec:mine,sho:mine,dis:mine });
        const b = man({ name:"Theirs", str:theirs,agi:theirs,end:theirs,tec:theirs,sho:theirs,dis:theirs });
        const quoted = Math.round(A.winChance(a, b, 0, "measured") * 100);
        let w=0,n=0;
        for(let i=0;i<N;i++){
          const r = A.simulateFight(man({ name:"Yours", str:mine,agi:mine,end:mine,tec:mine,sho:mine,dis:mine }),
            man({ name:"Theirs", str:theirs,agi:theirs,end:theirs,tec:theirs,sho:theirs,dis:theirs }),
            "measured", "standard", ctx(), { foeTac:"measured" });
          if(r.unfinished) continue; n++; if(r.winner==="A") w++;
        }
        rows.push({ label, quoted, sand:n?+(w/n*100).toFixed(1):0, n });
      }
      return rows; })();

    return { melee, hunt, book, measured:even("measured"), aggressive:even("aggressive"),
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
    `melee, three a side    your side ends ahead ${out.melee.pc}%, level ${out.melee.drew}%, behind ${out.melee.lost}%  (n=${out.melee.n})`,
    `                       ${out.melee.standing} of your three still up at the end, ${out.melee.dead}% of yours buried`,
    `the hunt, one man against each animal:`,
    ...out.hunt.map(h=>`   ${h.key.padEnd(9)} kills it ${String(h.killed).padStart(3)}%  ·  is killed ${String(h.died).padStart(2)}%  (n=${h.n})`),
    `the bookmaker against the sand:`,
    ...out.book.map(b=>`   ${b.label.padEnd(17)} quoted ${String(b.quoted).padStart(3)}%  ·  the sand gave ${b.sand}%`),
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

  /* ---- THE OTHER TWO ENGINES ----
     No published targets here either; what these catch is an engine that has
     stopped being a fight, or one that has quietly become a slaughter. */
  if(!out.melee.n) fails.push("the melee engine returned nothing at all");
  else {
    /* an even melee should be roughly even, and should not be decided in advance
       either way. The band is wide because six correlated men swing further than
       two do, and because level is a real and common outcome here. */
    if(out.melee.pc + out.melee.drew <= 20)
      fails.push(`three of yours against three identical men end level or ahead only ${(out.melee.pc+out.melee.drew).toFixed(1)}% of the time — the melee has turned against the player`);
    if(out.melee.pc >= 80)
      fails.push(`three of yours against three identical men end ahead ${out.melee.pc}% of the time — the melee has stopped being a fight`);
    if(out.melee.drew >= 98)
      fails.push(`${out.melee.drew}% of melees end perfectly level — eighteen rounds are deciding nothing`);
    if(out.melee.dead >= 60)
      fails.push(`${out.melee.dead}% of your men die in an even melee — that is not a bout, it is a culling`);
    if(out.melee.dead === 0)
      fails.push(`nobody has died in ${out.melee.n} melees — the eighteen rounds have no teeth`);
  }
  if(!out.hunt.length) fails.push("not one animal in the book could be fought");
  else {
    for(const h of out.hunt){
      if(h.killed === 0) fails.push(`a hunter never once killed the ${h.key} in ${h.n} tries`);
      if(h.died >= 70) fails.push(`the ${h.key} kills the hunter ${h.died}% of the time`);
    }
    /* NOT "no animal may reach 100%". The easiest of the six sits at 96-98 and a
       correlated run puts it on the hundred perfectly honestly — that would be a
       check crying wolf about a bear. What is worth failing on is the whole book
       going soft at once, and the six ceasing to be a ladder. */
    const easiest = Math.max(...out.hunt.map(h=>h.killed)), hardest = Math.min(...out.hunt.map(h=>h.killed));
    if(hardest > 97)
      fails.push(`even the worst animal in the book dies ${hardest}% of the time — the venatio is scenery`);
    if(easiest - hardest < 10)
      fails.push(`every animal in the book kills within ${easiest-hardest} points of every other — they are one animal with six names`);
  }

  /* ---- AND THE BOOKMAKER ----
     winChance is what the player is shown before every bout, what the wager is
     priced from, and what the sine missione warning reads. If it disagrees with
     the sand the player is being lied to, and every decision made on it is wrong. */
  for(const b of out.book){
    if(Math.abs(b.quoted - b.sand) > 12)
      fails.push(`the bookmaker quotes ${b.quoted}% where the sand gives ${b.sand}% (${b.label}) — the odds are not describing this fight`);
  }
  const order = out.book.map(b=>b.quoted);
  if(!(order[1] > order[0] && order[0] > order[2]))
    fails.push(`the bookmaker does not rank the three matchups in order: ${order.join(", ")}`);

  /* ---- and the triangle ---- */
  /* MARGINS, BECAUSE THE DICE ARE CORRELATED.
     The seeded RNG swings a couple of points between identical runs, and these
     comparisons are three or four points apart by design — so a bare > will fail
     on noise perhaps one run in four. It happened on the first run of this very
     check. A margin means a failure is a real inversion, not a bad afternoon;
     a check nobody trusts is worse than no check. */
  const EDGE = 1.5;
  const g = out.grid;
  if(g.aggressive.measured < g.measured.measured - EDGE)
    fails.push(`going forward does not answer a man fighting it straight (${g.aggressive.measured} vs his own ${g.measured.measured})`);
  if(g.defensive.aggressive < g.aggressive.aggressive - EDGE)
    fails.push(`the shield does not answer a charge (${g.defensive.aggressive} vs ${g.aggressive.aggressive})`);
  if(g.measured.defensive < g.defensive.defensive - EDGE)
    fails.push(`patience does not answer a shield (${g.measured.defensive} vs ${g.defensive.defensive})`);
  /* nothing may be clearly best on both axes at once — that is what made this a
     non-choice. Clearly: ahead of every other by more than the noise. */
  const W = out.win, D = out.buried;
  for(const t of ["measured","aggressive","defensive","showboat"]){
    const others = Object.keys(W).filter(k=>k!==t);
    const bestWin = others.every(k => W[t] > W[k] + EDGE);
    const safest  = others.every(k => D[t] < D[k] - EDGE);
    if(bestWin && safest) fails.push(`${t} wins most (${W[t]}%) AND buries fewest (${D[t]}%) — it is not a choice, it is the answer`);
  }
  if(W.showboat >= Math.min(W.measured, W.aggressive, W.defensive) - EDGE)
    fails.push(`showboat (${W.showboat}%) is not behind all three of the others`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
