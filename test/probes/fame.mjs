/* #227 — WHAT FAME IS FOR, AND WHETHER IT IS EVER THE THING IN THE WAY

   The item: "Fame climbs forever and buys almost nothing. Median fame 3,848 by era four and linear
   throughout; titles cap out and nothing consumes it. Meanwhile the munus — staging your own games,
   the era-appropriate fame sink — was held 0 times (rope). Recommend fame become spendable
   standing: staging games, endowing works (#217), backing candidates."

   TWO THINGS ARE TRUE OF THE SOURCE BEFORE ANY MEASURING:

   1. FAME IS NEVER SPENT. Twenty-odd sites subtract from `d.fame` and every one of them is a
      PENALTY — a loss, a scandal, a breach, the feud, the cut a successor takes. Nothing in the
      program lets a player choose to pay fame for anything. It is a threshold currency: `riseNeed`
      reads a rung's `fame` as a bar to clear, `romeBar` as a bar to clear, the venues as bars to
      clear, the munus scales as bars to clear.

   2. THE LADDER WAS ALREADY EXTENDED FOR EXACTLY THIS. Two rungs sit above what used to be the top,
      and the note over them says why: "The ladder ended here and the screen said so — 'There is no
      higher rung' — while the fame beside it went on climbing into the thousands." Patron of the
      Games wants 1,600 and Amicus Caesaris 3,600, against the item's median of 3,848 by era four.

   So the question is not whether fame has bars. It is whether fame is ever the bar that BINDS. A
   rung wants fame AND favour AND census worth AND a fee in coin; if fame is over its bar on every
   week a house is short of a rung, then fame is abundant by construction and the item is right for
   a sharper reason than it gives.

   This plays houses and records, week by week: the fame curve by era, every bar crossed and when,
   which term was the one holding at each rung the house could not claim, and how much fame is
   earned after the last bar in the game has been passed.

     node test/probes/fame.mjs 12 460 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 460);
/* a third argument names a rope policy to play under, so the same houses can be read twice:
   `node test/probes/fame.mjs 12 460 works` plays them building, which is what #217 shipped */
const POL = (process.argv[4] || "").split(",").filter(Boolean)
  .reduce((o,k)=>{ o[k] = true; return o; }, {});
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"FAME" }); await clearAll(p, 20); await installRope(p);
await p.evaluate(pol=>{ window.__POL = pol; }, POL);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const POLICY = window.__POL || {};
  const miss = ["newGameState","RISE_RANKS","riseOf","riseNeed","romeBar","TIERS","MUNUS_SCALES"]
    .filter(k=>A[k]==null);
  if(miss.length) return { miss };

  const ERA = 18*4;
  const eras = [[],[],[],[]];
  const topBar = A.RISE_RANKS.reduce((n,r)=>Math.max(n, r.fame||0), 0);
  const bind = { fame:0, favor:0, worth:0, fee:0, none:0 };
  const byRung = {}, indep = {};
  const crossed = {};                 /* the week each rung's FAME bar was first cleared */
  const claimed = {};                 /* and the week the rung was actually taken */
  let weeks = 0, deadFame = 0, aboveTop = 0, peakFame = 0;
  const endRank = [], endFame = [];

  for(let h=0; h<H; h++){
    const d = A.newGameState("Fame", "clean", "FAME-"+h, null);
    const seenBar = new Set(), seenRank = new Set();
    let lastFame = d.fame||0;
    for(let w=0; w<W; w++){
      if(d.over) break;
      try { R.lanista(d, POLICY); } catch(e){ break; }
      weeks++;
      const f = d.fame||0;
      eras[Math.min(3, Math.floor(d.week/ERA))].push(Math.round(f));
      peakFame = Math.max(peakFame, f);
      /* fame earned once every bar in the game is behind you is fame with nothing left to clear */
      if(f >= topBar){ aboveTop++; if(f > lastFame) deadFame += f - lastFame; }
      lastFame = f;
      for(const r of A.RISE_RANKS){
        if((r.fame||0) > 0 && f >= r.fame && !seenBar.has(r.name)){
          seenBar.add(r.name); (crossed[r.name] = crossed[r.name] || []).push(d.week); }
      }
      const rk = A.riseOf(d);
      const cur = A.RISE_RANKS[rk];
      if(cur && !seenRank.has(cur.name)){ seenRank.add(cur.name);
        (claimed[cur.name] = claimed[cur.name] || []).push(d.week); }
      /* WHICH TERM IS ACTUALLY HOLDING, on every week the house is short of the next rung */
      const need = A.riseNeed(d);
      if(need){
        const which = !need.fameOk ? "fame" : !need.favorOk ? "favor"
          : !need.goldOk ? "worth" : !need.feeOk ? "fee" : "none";
        bind[which]++;
        /* AND WHICH RUNG IS BEING REACHED FOR. The aggregate hides the top: a house spends most of
           its weeks climbing the cheap rungs, so whatever holds THOSE dominates the total, and the
           question #227 actually asks is what stands between a great house and the last title. */
        const nx = rk + 1;
        (byRung[nx] = byRung[nx] || { fame:0, favor:0, worth:0, fee:0, none:0 })[which]++;
        /* ---- AND EACH TERM ON ITS OWN, because the line above cannot answer the question ----
           `which` reports the FIRST failing term in a fixed order, so every week fame is short is
           filed under fame whether or not the other three would also have failed. That reads as
           "fame is the wall" by construction. Counted independently, a week can be short of all
           four, and `all` is the weeks where every one of them was satisfied at once — which is the
           only number that says whether a rung is reachable at all. */
        const ind = indep[nx] = indep[nx] || { n:0, fame:0, favor:0, worth:0, fee:0, all:0 };
        ind.n++;
        if(!need.fameOk) ind.fame++;
        if(!need.favorOk) ind.favor++;
        if(!need.goldOk) ind.worth++;
        if(!need.feeOk) ind.fee++;
        if(need.fameOk && need.favorOk && need.goldOk && need.feeOk) ind.all++;
      }
    }
    endRank.push(A.riseOf(d)); endFame.push(Math.round(d.fame||0));
  }

  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    return { n:s.length, p50:s[Math.floor(s.length/2)], p90:s[Math.floor(s.length*0.9)], max:s[s.length-1] }; };
  const bindTotal = Object.values(bind).reduce((n,v)=>n+v,0);
  return { weeks, topBar, peakFame:Math.round(peakFame), aboveTop, deadFame:Math.round(deadFame),
    era: eras.map(q), bind, bindPc: Object.fromEntries(Object.entries(bind)
      .map(([k,v])=>[k, bindTotal ? +(v/bindTotal*100).toFixed(1) : 0])),
    byRung, indep,
    rungs: A.RISE_RANKS.map((r,i)=>({ i, name:r.name, fame:r.fame||0, favor:r.favor||0, cost:r.cost||0,
      barAt: q(crossed[r.name]||[]), tookAt: q(claimed[r.name]||[]) })),
    endRank:q(endRank), endFame:q(endFame),
    tierBar: (A.TIERS||[]).map(v=>({ name:v.name, fame:v.fame })),
    munusBar: Object.entries(A.MUNUS_SCALES||{}).map(([k,v])=>({ k, gate:v.gate })) };
}, [H,W]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  console.log(`${out.weeks} weeks · peak fame ${out.peakFame}`
    + (Object.keys(POL).length ? ` · policy ${Object.keys(POL).join("+")}` : "") + `\n`);
  console.log(`FAME BY ERA (the item says 991 -> 4,163 -> 4,361 -> 3,480 and "linear throughout"):`);
  out.era.forEach((e,i)=>console.log(`  y${i*4+1}-${i*4+4}   ${e ? `p50 ${e.p50} · p90 ${e.p90} · max ${e.max}` : "—"}`));
  console.log(`\nTHE LADDER — where fame's bar is, when it was cleared, and when the rung was taken:`);
  for(const r of out.rungs){
    if(!r.fame) continue;
    console.log(`  ${r.name.padEnd(24)} fame ${String(r.fame).padStart(5)} · favour ${String(r.favor).padStart(2)}`
      + ` · worth ${String(r.cost).padStart(6)}`
      + `   bar cleared ${r.barAt ? `wk ${r.barAt.p50} (${r.barAt.n}/12)` : "NEVER"}`
      + `   ·   rung taken ${r.tookAt ? `wk ${r.tookAt.p50} (${r.tookAt.n}/12)` : "NEVER"}`);
  }
  console.log(`\nWHICH TERM IS HOLDING, on every week a house is short of its next rung:`);
  for(const [k,v] of Object.entries(out.bindPc).sort((a,b)=>b[1]-a[1]))
    console.log(`  ${k.padEnd(6)} ${String(v).padStart(5)}%   (${out.bind[k]} weeks)`);
  console.log(`\nAND WHICH TERM HOLDS AT EACH RUNG BEING REACHED FOR:`);
  for(const [i, b] of Object.entries(out.byRung)){
    const r = out.rungs[+i]; if(!r) continue;
    const tot = Object.values(b).reduce((n,v)=>n+v,0) || 1;
    console.log(`  ${String(r.name).padEnd(24)} ` + Object.entries(b)
      .filter(([,v])=>v).sort((a,b2)=>b2[1]-a[1])
      .map(([k,v])=>`${k} ${(v/tot*100).toFixed(0)}%`).join(" · ") + `   (${tot} weeks)`);
  }
  console.log(`\nEACH TERM COUNTED ON ITS OWN (a week can be short of all four):`);
  for(const [i, b] of Object.entries(out.indep)){
    const r = out.rungs[+i]; if(!r || !b.n) continue;
    const pc = v => `${(v/b.n*100).toFixed(0)}%`;
    console.log(`  ${String(r.name).padEnd(24)} short of fame ${pc(b.fame).padStart(4)}`
      + ` · favour ${pc(b.favor).padStart(4)} · worth ${pc(b.worth).padStart(4)} · fee ${pc(b.fee).padStart(4)}`
      + `   ·   ALL FOUR AT ONCE ${pc(b.all)} (${b.all} of ${b.n} weeks)`);
  }
  console.log(`\nFAME PAST THE LAST BAR IN THE GAME (${out.topBar}):`);
  console.log(`  ${out.aboveTop} of ${out.weeks} weeks were spent above it, and ${out.deadFame} fame was`);
  console.log(`  earned while there — every point of it clearing a bar that was already behind.`);
  console.log(`\nended at rung ${JSON.stringify(out.endRank)} · with fame ${JSON.stringify(out.endFame)}`);
  console.log(`\nthe other bars fame has: the bill ${out.tierBar.map(v=>`${v.name} ${v.fame}`).join(" · ")}`);
  console.log(`  the munus scales: ${out.munusBar.map(v=>`${v.k} ${v.gate}`).join(" · ")}`);
}
console.log("\n" + JSON.stringify(out));
await browser.close(); server.close();
