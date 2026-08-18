/* THE LADDER, AND WHICH OF ITS FOUR GATES IS ACTUALLY HOLDING.

   The complaint that started this was that the climb takes thirteen years and the
   rungs above the sixth are decoration. Measured over twenty-four houses run
   twenty years apiece on a careful policy with no free coin, that was half right
   and wrong about the reason.

   The rate was never the problem. The standing meter — the one thing claimRise
   actually controls — was not once the gate: it fills in about fifteen weeks and
   it only sits empty because fame or favour is short. A house that answers its
   patrons reaches favour 90, the top gate on the ladder, by year four and a half;
   one that answers a third of them gets there by year nine. Nobody is waiting on
   the meter.

   What the twenty-four houses showed is that the gates split cleanly in two.
   Favour holds the bottom of the ladder — 93% of the wait below Friend of the
   Magistracy. Coin holds the top: 100% of the wait below Eques and below Known in
   Rome. One house reached Patron of the Games, in year eleven. None reached Amicus
   Caesaris. And one house sat on 99,182 denarii while stuck at rung two, because
   no patron liked it.

   The coin gate was the whole price, handed over and gone — 30,000 to be received
   as Patron of the Games, 80,000 for the last rung, against nine works and
   monuments already asking 336,500 for the same purse. A rank is a census now,
   which is what it was: you must be WORTH the figure, and being received costs a
   quarter of it in sportula and clerks. What standing costs thereafter is the
   liturgy, every week, which was already built.

   So this check holds three things. That the fee is a fraction of the census and
   the census is a threshold rather than a bill. That being received leaves a house
   still standing — the point of the change. And that the ladder is still a ladder:
   the gates must climb, and none of them may become free. */

import { hasHandle } from "../harness.mjs";

export const name = "census";
export const describe = "a rank is what you are worth, not what you hand over";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const rungs = [];

    /* 1. every rung: what it asks, what it takes, and what a house keeps */
    for(let i=1;i<A.RISE_RANKS.length;i++){
      const nx = A.RISE_RANKS[i];
      const d = A.newGameState("Cens","clean","CENS"+i,null);
      d.rise = { rank:i-1, standing:100 };
      d.fame = (nx.fame||0) + 5;
      /* patrons carrying exactly the favour this rung asks */
      d.patrons = [{ id:9001, name:"Patronus", rank:"senator", favor:(nx.favor||0), want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      d.gold = nx.cost || 0;                       /* worth the census, to the denarius */
      const before = d.gold;
      const can = A.canClaimRise(d);
      const took = can ? A.claimRise(d) : false;
      rungs.push({ i, name:nx.name, census:nx.cost||0, fee:A.riseFee(nx),
        can, took, kept:d.gold, spent:before - d.gold, rank:A.riseOf(d) });
    }

    /* 2. and a house one denarius short of the census may not buy its way in */
    const shy = (()=>{
      const nx = A.RISE_RANKS[6];
      const d = A.newGameState("Shy","clean","SHY",null);
      d.rise = { rank:5, standing:100 };
      d.fame = (nx.fame||0)+5;
      d.patrons = [{ id:9002, name:"P", rank:"senator", favor:nx.favor, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      d.gold = (nx.cost||0) - 1;
      return { can: A.canClaimRise(d), gold: d.gold, census: nx.cost };
    })();

    /* 3. the standing meter is not the thing holding anybody: how many weeks it
          takes to fill once fame and favour are already met */
    const fill = (()=>{
      const d = A.newGameState("Fill","clean","FILL",null);
      d.rise = { rank:2, standing:0 };
      const nx = A.RISE_RANKS[3];
      d.fame = (nx.fame||0) + 40; d.gold = 99999;
      d.patrons = [{ id:9003, name:"P", rank:"senator", favor:(nx.favor||0)+6, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      let w = 0;
      while(w < 200 && d.rise.standing < 100){ A.riseWeek(d); w++; }
      return w;
    })();

    /* 4. and what a house that answers its patrons can get its favour to */
    const favour = (()=>{
      const answer = (d,p)=>{ const w=p.want; if(!w) return;
        if(w.kind==="blood") A.serveWants(d,{type:"fight",oppDied:true,crowd:60,win:true,tier:2});
        else if(w.kind==="spectacle") A.serveWants(d,{type:"fight",crowd:88,win:true,tier:2});
        else if(w.kind==="mercy") A.serveWants(d,{type:"fight",spared:true,crowd:60,tier:2});
        else if(w.kind==="win") A.serveWants(d,{type:"fight",win:true,tier:2,crowd:60});
        else if(w.kind==="showman") A.serveWants(d,{type:"fight",gid:w.gid,crowd:60,tier:2});
        else if(w.kind==="party") A.serveWants(d,{type:"party",kind:"feast"});
        else if(w.kind==="sell") A.serveWants(d,{type:"sell",gid:w.gid}); };
      const one = (share, seed)=>{
        const d = A.newGameState("Fav","clean","FAV"+share+seed,null);
        d.fame = 300;
        while(A.activeG(d).length < 6){ const m=A.genOpponent(1,62);
          m.id=d.nextId++; m.status="active"; m.mine=true; m.name="M"+m.id; m.sho=70;
          m.kit=A.defaultKit(m.cls); d.gladiators.push(m); }
        let top = 0;
        for(let w=0;w<20*18;w++){
          d.week = w; d.fame = Math.min(4000, 300 + w*9);
          A.patronWeek(d);
          for(const pt of A.patronsOf(d)) if(pt.want && Math.random() < share) answer(d, pt);
          A.recomputeFavor(d);
          if(d.favor > top){ top = d.favor; if(top >= 90) return { top, week:w }; }
        }
        return { top, week:null };
      };
      const tended  = [0,1,2].map(i=>one(1, i));
      const ignored = [0,1,2].map(i=>one(0, i));
      return { tendedTop: Math.round(Math.max(...tended.map(r=>r.top))),
        tendedYr: (()=>{ const ws = tended.map(r=>r.week).filter(x=>x!=null); return ws.length ? +(Math.max(...ws)/18).toFixed(1) : null; })(),
        ignoredTop: Math.round(Math.max(...ignored.map(r=>r.top))) };
    })();

    /* ---- AND IS THE LADDER CLIMBABLE BY A HOUSE THAT PLAYS? — #151 ----
       Everything above is a bench: states built by hand to meet one gate at a time. It cannot say
       whether a real house ever gets there, and #151 was opened on the claim that rungs 5-7 are held
       by nobody. Split by the game's own four booleans over 192 house-runs on four policies and
       three seeds (`test/probes/rung.mjs`), the answer is that **coin is the last term standing on
       96-100% of every one-short week from rung 3 up**, and favour appears in no one-short row at
       any rung in any arm that entertains. The older reading — that favour holds the top — came from
       `estate`'s `miser`, which banks by switching the table OFF, and the table is the favour engine.

       So the tripwire is a FREE GRANT, which is the only honest way to ask "is it the coin": hand a
       played house more coin than the top rung asks and see how far it climbs. Measured, 16 houses:
       **14 of 16 reach Amicus Caesaris**, and every remaining wait at every rung is the standing
       meter, which is time. If this ever stops reaching the top, something other than money has shut
       the ladder and the roadmap's account of it is stale. Eight houses here rather than sixteen,
       because the claim is reachability and not a rate. */
    const climbed = (()=>{
      const best = [], why = {};
      for(let h=0; h<8; h++){
        const d = A.newGameState("Cl"+h, "clean", `CENSUS-CLIMB-${h}`, null);
        let top = 0;
        for(let w=0; w<420; w++){
          if(d.over) break;
          d.gold = Math.max(d.gold, 200000);
          window.__ROPE.lanista(d);
          top = Math.max(top, A.riseOf(d));
        }
        best.push(top);
        const n = A.riseNeed(d);
        if(n){ const miss = !n.fameOk ? "fame" : !n.favorOk ? "favour" : !n.goldOk ? "coin" : !n.full ? "the town's ear" : "nothing";
          why[miss] = (why[miss]||0)+1; }
      }
      return { best, why, topRung: A.RISE_RANKS.length - 1 };
    })();

    return { rungs, shy, fill, favour, admit: A.RISE_ADMIT, climbed };
  });

  const lines = [], fails = [];
  lines.push(`the ladder, rung by rung:`);
  for(const r of out.rungs)
    lines.push(`   ${r.name.padEnd(24)} census ${String(r.census).padStart(6)}d · received for ${String(r.fee).padStart(5)}d · ` +
      `${r.took ? `kept ${r.kept}d of ${r.census}d` : "COULD NOT BE TAKEN"}`);
  lines.push(`a house one denarius under the census (${out.shy.gold} of ${out.shy.census}) ${out.shy.can ? "was received anyway" : "is not received"}`);
  lines.push(`the standing meter fills in ${out.fill} weeks once fame and favour are met — it was never the thing holding`);
  lines.push(`patrons tended reach favour ${out.favour.tendedTop}${out.favour.tendedYr!=null?` by year ${out.favour.tendedYr}`:""}; ` +
    `patrons ignored reach ${out.favour.ignoredTop}`);

  /* ---- the fee is a fraction, the census is a threshold ---- */
  if(!(out.admit > 0 && out.admit < 1))
    fails.push(`the admission is ${out.admit} of the census — it has to be a fraction, or this is the old bill back`);
  for(const r of out.rungs){
    if(!r.took) fails.push(`${r.name} could not be taken by a house that met every gate exactly`);
    if(r.spent !== r.fee) fails.push(`${r.name} took ${r.spent}d where the panel quotes ${r.fee}d`);
    if(r.census > 0 && r.kept <= 0)
      fails.push(`${r.name} left the house with ${r.kept}d — being received is not supposed to empty the strongbox`);
    if(r.rank !== r.i) fails.push(`${r.name} was paid for but the rank did not move`);
  }
  /* ---- and it is still a ladder ---- */
  if(out.shy.can) fails.push(`a house under the census was received anyway — the census gate does nothing`);
  for(let i=1;i<out.rungs.length;i++){
    const a = out.rungs[i-1], b = out.rungs[i];
    if(b.census < a.census) fails.push(`${b.name} asks a smaller census than ${a.name} — the ladder goes down`);
    if(b.fee <= 0) fails.push(`${b.name} is free to be received`);
  }
  /* ---- and the meter is not where the years go ---- */
  if(out.fill > 40)
    fails.push(`the standing meter takes ${out.fill} weeks to fill with every other gate met — it has become the bottleneck`);
  if(out.favour.tendedTop < 90)
    fails.push(`a house that answers every patron only reaches favour ${out.favour.tendedTop} — the top of the ladder asks 90 and cannot be met`);
  /* a patron arrives holding 28-42 and decays from there, so an ignored house
     peaks somewhere in the thirties by arithmetic alone. The bar is set above
     that rather than on it: what would be wrong is a house climbing PAST the
     first favour gate without ever answering anybody. */
  if(out.favour.ignoredTop >= 48)
    fails.push(`a house that ignores its patrons still reaches favour ${out.favour.ignoredTop} — the climb costs nothing`);

  /* ---- and the whole ladder is climbable when the coin is not the obstacle — #151 ---- */
  { const C = out.climbed, made = C.best.filter(r=>r>=C.topRung).length;
    lines.push(`played houses handed 200,000d every week reach rung ${C.best.join(", ")} of ${C.topRung} — ` +
      `${made} of ${C.best.length} to the top` +
      (Object.keys(C.why).length ? ` · what the stragglers were still short of: ${Object.entries(C.why).map(([k,v])=>`${k} ${v}`).join(" · ")}` : ""));
    if(!made)
      fails.push(`not one of ${C.best.length} played houses reached rung ${C.topRung} with 200,000d handed to it ` +
        `every week (best ${Math.max(...C.best)}) — measured at 14 of 16, and a free grant is the upper bound ` +
        `on every banking policy there is. If coin cannot open the top of the ladder then something ` +
        `else has shut it, and #151's account of this is stale`);
    if(C.why.favour)
      fails.push(`${C.why.favour} of ${C.best.length} coin-granted houses ended still short of FAVOUR — the ` +
        `#151 measurement found favour in no one-short row at any rung of any entertaining arm, and ` +
        `\`estate\`'s \`miser\` said otherwise only because it switches the table off`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
