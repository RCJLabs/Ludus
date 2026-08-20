/* #169 — WHAT THE TRUNCATED LOG COSTS, AND WHAT MENDING IT MOVES

   All four fight engines carry the join BELOW the early return for a bout that has come to the
   balance again:

       if(res.unfinished){ return { ..., beats: res.beats, crux:true, ... }; }
       if(pending) res.beats = pending.beats.concat(res.beats);

   so a resume that stops again returns the segment since the LAST crux and nothing before it.
   `relay.mjs` shows what that does on screen. This one asks the other two questions:

   1 · WHAT IT COSTS — measured on ONE build, because the full log and the truncated view of it can
       both be computed from the same bout. Everything downstream that reads `res.beats` is scored
       twice: once over the whole log, once over the last segment only, and the two are compared.
       The consumers, found by reading every `res.beats` in the file:
         `favourBout`   `close = beats.some(b => b.kind === "clash")`, worth 1.6 favour
         `boutAccount`  `turn` = the highest-crowd beat that is not the last — a man's own account
                        of the bout that made him, kept six deep
         `boutAccount`  `end` and `rounds` — the last beat and the max round, both in the tail
         `doFight`      `spared` — pushed at the end, so in the tail
         `doMelee`      `forced` — an appeal, and in a melee men fall all the way through
         `doPairFight`  `spared` for one of two men, likewise
       A term whose evidence always lives in the tail is unaffected and is reported as unaffected;
       the ROADMAP's opening note said `rounds` was a casualty and it is not, because `Math.max` over
       a suffix of a monotonic sequence is the same number.

   2 · WHAT MENDING IT MOVES — the paired arms, control FIRST, same seeds: the opening on a fixed
       policy across four prefixes, and deaths a bout and median life over long play. Run this on
       the build with the join below the return, then on the build with it above, and diff. The
       question it answers is whether the signature move is SYSTEMATIC or chaotic: the only state
       any of this touches is a favour term worth 1.6 points, and a favour term feeds the crowd,
       and the crowd feeds every roll after it.

   Usage: node test/probes/join.mjs [houses] [weeks] [seed]
*/
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420), SEED = process.argv[4] || "JOIN";
/* `wide` drops sections 1 and 2b and runs the opening across TWELVE prefixes instead of four.
   Four was not enough to tell a systematic move from a chaotic one: the same edit read
   190 -> 193 standing on one seed set and 185 -> 171 on the next. */
const WIDE = process.argv[5] === "wide";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED,WIDE])=>{
  const A = window.__LVDVS, R = window.__ROPE;

  /* ============ 1 · WHAT THE TRUNCATION COSTS ============
     The bout is driven by hand rather than through `R.answer`, so every segment is kept. The
     "full" log is what the join would have produced; the "seen" log is what the last call
     actually returns. Both are then put through the same readers. */
  const cost = WIDE ? null : (()=>{
    const clash = bs => bs.some(b=>b.kind === "clash");
    const turnOf = bs => {                      /* boutAccount's own rule, copied to be compared */
      const t = bs.filter(b=>b && b.text);
      let turn = null, best = -1;
      for(let i=0;i<t.length-1;i++){
        const b = t[i];
        if(b.kind === "intro" || b.kind === "salute") continue;
        const c = b.crowd == null ? 0 : b.crowd;
        if(c > best){ best = c; turn = b.text; }
      }
      return turn;
    };
    const maxRound = bs => bs.reduce((m,b)=>Math.max(m, b.round||0), 0);
    const rows = { bouts:0, stops:{}, twice:0,
      closeLost:0, closeEither:0, turnMoved:0, endMoved:0, roundMoved:0, sparedMoved:0, beatsLost:0 };
    for(const pre of [`${SEED}-X1`, `${SEED}-X2`, `${SEED}-X3`]){
      for(let h=0; h<H; h++){
        const d = A.newGameState("Jn"+h, "clean", `${pre}-${h}`, null);
        d.week = 60; d.fame = 900; d.gold = 60000;
        for(let i=0;i<40;i++){
          const g = A.genGladiator(d, A.qForStat(70));
          g.status = "active"; g.injury = null; g.fatigue = 0; g.lastFought = -99; g.wins = 5;
          d.gladiators.push(g);
          const opp = A.genOpponent(2, A.qForStat(70));
          for(const k of A.STATS) opp[k] = g[k];
          opp.cls = g.cls; opp.kit = A.defaultKit(g.cls); opp.wins = 5; opp.traits = [];
          const o = { id:d.nextId++, tier:2, festival:"a bench", opp, oppRef:null,
            stakes:"standard", purse:700 };
          d.games = { festival:"x", offers:[o], week:d.week };
          /* drive the bout segment by segment, keeping every one */
          const segs = [];
          let r = A.doFight(d, g.id, o, "measured", null, null, null, "none");
          if(!r || r.__err) continue;
          segs.push((r.beats||[]).slice());
          let n = 0;
          while(r && r.crux && n < 4){
            const pd = r.pending; pd.beats = r.beats; n++;
            r = A.doFight(d, pd.gid, pd.offer, pd.tactic, pd.bet, pd, "press");
            if(!r || r.__err) break;
            segs.push((r.beats||[]).slice());
          }
          if(!r || r.__err || r.crux) continue;
          rows.bouts++;
          rows.stops[n] = (rows.stops[n]||0) + 1;
          if(n >= 2) rows.twice++;
          /* the log the last call returned, against the log the join would have made. Each
             segment after the first already carries whatever the join gave it, so the whole is
             rebuilt from the FIRST segment plus every segment's own new tail. */
          const seen = r.beats || [];
          /* A segment is JOINED onto the one before it when its first line is that segment's first
             line — the engine's own `pending.beats.concat(res.beats)`. Otherwise it is a fresh tail,
             which is exactly the early return this item is about. Compared on `.text`, because every
             call builds new objects and identity says nothing. */
          const full = segs.length ? segs[0].slice() : [];
          for(let i=1;i<segs.length;i++){
            const prev = segs[i-1], cur = segs[i];
            const joined = prev.length && cur.length && cur.length >= prev.length
              && (cur[0].text||"") === (prev[0].text||"");
            full.push(...(joined ? cur.slice(prev.length) : cur));
          }
          if(full.length > seen.length) rows.beatsLost += full.length - seen.length;
          if(clash(full) !== clash(seen)) rows.closeLost++;
          if(clash(full)) rows.closeEither++;
          if(turnOf(full) !== turnOf(seen)) rows.turnMoved++;
          const lf = full[full.length-1], ls = seen[seen.length-1];
          if((lf && lf.text) !== (ls && ls.text)) rows.endMoved++;
          if(maxRound(full) !== maxRound(seen)) rows.roundMoved++;
          const sp = bs => bs.some(b=>b.kind === "spared" && b.actor === "A");
          if(sp(full) !== sp(seen)) rows.sparedMoved++;
        }
      }
    }
    return rows;
  })();

  /* ============ 2a · THE OPENING ON A FIXED POLICY, four prefixes ============ */
  const PRES = (WIDE ? [1,2,3,4,5,6,7,8,9,10,11,12] : [1,2,3,4]).map(i=>`${SEED}-O${i}`);
  const opening = PRES.map(pre=>{
    let standing = 0, men = 0;
    const rows = [];
    for(let h=0; h<60; h++){
      const d = A.newGameState("Op"+h, "clean", `${pre}-${h}`, null);
      for(let w=0; w<26; w++){ if(d.over) break; R.lanista(d); }
      const alive = A.activeG(d).length;
      if(alive > 0) standing++;
      men += alive;
      rows.push(`${d.week}/${alive}/${Math.round(d.gold)}/${d.over?d.over.kind:"up"}`);
    }
    return { pre, standing, men, sig: rows.join(" ") };
  });

  /* ============ 2b · LONG PLAY: deaths a bout and median life ============ */
  const career = WIDE ? null : (()=>{
    let bouts = 0, deaths = 0; const lives = [];
    const orig = A.doFight;
    A.doFight = function(d, gid, offer, tactic, bet, pending){
      const fresh = !pending;
      const r = orig.apply(this, arguments);
      if(fresh) bouts++;
      if(r && !r.__err && !r.crux && r.dead) deaths++;
      return r;
    };
    try {
      for(const pre of [`${SEED}-L1`, `${SEED}-L2`, `${SEED}-L3`]){
        for(let h=0; h<H; h++){
          const d = A.newGameState("Lf"+h, "clean", `${pre}-${h}`, null);
          let w = 0;
          for(; w<W; w++){ if(d.over) break; R.lanista(d); if(!d.lanista) break; }
          lives.push(w);
        }
      }
    } finally { A.doFight = orig; }
    lives.sort((a,b)=>a-b);
    return { bouts, deaths, rate: bouts ? deaths/bouts : null,
      median: lives[Math.floor(lives.length/2)], lives };
  })();

  return { cost, opening, career, H, W };
}, [H, W, SEED, WIDE]);

const C = out.cost;
console.log(`\n#169 — WHAT THE TRUNCATED LOG COSTS, AND WHAT MENDING IT MOVES\n`);
if(C) console.log(`1 · THE COST — ${C.bouts} bouts, driven segment by segment so nothing is thrown away`);
if(C) console.log(`  where they stopped: ${Object.keys(C.stops).sort().map(k=>`${k}x ${C.stops[k]}`).join(" · ")}`
  + `  (${(C.twice/C.bouts*100).toFixed(1)}% stopped twice or more)`);
if(C) console.log(`  beats the last call never returned: ${C.beatsLost}`);
if(C) console.log(`  and what each reader of the log gets wrong because of it:`);
const line = (name, n, note) => console.log(`    ${name.padEnd(34)} ${String(n).padStart(4)} bouts `
  + `(${(n/C.bouts*100).toFixed(1)}%)  ${note}`);
if(C){
line("favourBout's `close` flips", C.closeLost, `— a clash happened in ${(C.closeEither/C.bouts*100).toFixed(1)}% of bouts`);
line("boutAccount's `turn` moves", C.turnMoved, "— the man's own account of how it turned");
line("boutAccount's `end` moves", C.endMoved, "— expected nought: the end is the end");
line("`rounds` moves", C.roundMoved, "— expected nought: a max over a suffix of a rising run");
line("doFight's `spared` flips", C.sparedMoved, "— expected nought: the appeal is at the end");
}

console.log(`\n2a · THE OPENING ON A FIXED POLICY — 60 houses x 26 weeks, ${out.opening.length} prefixes`);
for(const o of out.opening) console.log(`  ${o.pre}  standing ${o.standing} of 60 · men ${String(o.men).padStart(3)}`);
console.log(`  SIGHASH ${out.opening.map(o=>{
  let h = 2166136261; const s = o.sig;
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619)>>>0; }
  return (h>>>0).toString(16);
}).join(" ")}`);

console.log(`  POOLED  standing ${out.opening.reduce((a,o)=>a+o.standing,0)} of ${out.opening.length*60}`
  + ` · men ${out.opening.reduce((a,o)=>a+o.men,0)}`);
console.log(`  MEN     ${out.opening.map(o=>o.men).join(" ")}`);
console.log(`  STAND   ${out.opening.map(o=>o.standing).join(" ")}`);

const K = out.career;
if(K) console.log(`\n2b · LONG PLAY — ${out.H} houses x ${out.W} weeks on three prefixes`);
if(K) console.log(`  ${K.bouts} bouts · ${K.deaths} of his men died · ${(K.rate*100).toFixed(2)}% a bout · median life ${K.median}w`);
if(K) console.log(`  lives [${K.lives.join(" ")}]`);
console.log();

await browser.close();
server.close();
