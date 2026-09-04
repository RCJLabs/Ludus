/* THE HOUSES ACROSS TOWN LOOK AT YOUR CARD, AND THE SHREWD ONES ACT ON IT

   Phase queue item #236. `RIVAL_MOVES.retrain` sent a man to one of the five classes he was not
   with a bare `pick()`; `RIVAL_MOVES.buy` lifted whoever topped `gladValue` off the block. Neither
   had ever looked at what the player fields — while COUNTERS and CLS_EDGE make the six-class cycle
   worth a real 1.15/0.91 in every bout he fights.

   FOUR THINGS WERE MEASURED BEFORE ANY OF IT WAS WRITTEN (`probes/roster.mjs`), and two changed the
   design while a third changed what this release claims:

   1 · THE CYCLE IS WORTH PRESSING ON. On 700 even bouts a side the countering class wins 59.4%,
       neutral 48.3%, countered 41.9%. Eleven points over neutral.
   2 · THE UNIFORM FLOOR IS 15.8%, NOT THE 20% THE ITEM ASSUMED. `filter(c=>c!==was)` drops the
       retrainer's own class, and sometimes that is the very class that would counter the player.
   3 · HALF THE TIME THERE IS NOTHING TO READ. 717 of 1,548 weeks with a roster of 3+ (46.3%) had a
       TIE at the top and the median top class holds 40% of the roster. That is the guardrail the
       item asked for, arriving for free: diversify and you cannot be read.
   4 · RECENCY WEIGHTING EARNS ITS CODE on the narrow question, not the flattering one — it
       disagrees with a plain tally on 37.7% of weeks, but 46.3% of weeks are ties where
       disagreement is a coin broken differently. On the 831 weeks with an unambiguous top class it
       still changed the answer 209 times (25.2%). And it is the truthful read: a rival watches the
       games, so he sees who you PUT ON THE SAND, not who is in your cells.

   AND ONE THING THE ITEM COULD NOT HAVE KNOWN, WHICH THIS RELEASE REPORTS RATHER THAN HIDES.
   Its check (2) asks that a counter-motivated move reach the log more often than once every forty
   weeks or "the tell reads as a fluke". Measured in play: **one every 92 weeks**. It fails, and the
   cause is not the read. `RIVAL_SEED` is a hardcoded three — Solonius, Vettius, Tullius — and in
   24 games those three appeared 24, 24 and 24 times while four of the nine lanistae appeared never.
   Of the three, only Tullius has train or bid above baseline. So exactly one house in Capua reads
   you, and the frequency ceiling is set by `RIVAL_SEED`, not by anything here: Tullius retrains
   about once in 39 weeks, aims 61% of those, and can only aim on the 58% of weeks with a readable
   roster — 1/85, against 1/92 measured. The arithmetic is closed. Widening the rival roster is a
   different item; this one does not fudge its constants to reach a threshold another system owns.

   SEVEN ARMS. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "roster";
export const describe = "the shrewd houses read the player's card before they retrain or buy, and say so when they do";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"READ-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];
    let tick = 0;
    const CL = Object.keys(A.CLASSES);
    const yard = (mix, week) => {
      const d = A.newGameState("Read", "clean", `RD-${tick++}`, null);
      d.week = week || 60; d.gold = 4000; d.gladiators = [];
      mix.forEach((cls, i)=>{
        const g = A.genGladiator(d, 60); g.id = d.nextId++; g.status = "active"; g.mine = true;
        g.cls = cls; g.kit = A.defaultKit(cls); g.wins = 5; g.pfame = 40;
        g.lastFought = d.week - 2;
        d.gladiators.push(g);
      });
      return d;
    };

    /* ---- 1 + 2: the read, and the lookup the right way round ---- */
    let arm1 = null;
    { const dom = yard(["Murmillo","Murmillo","Murmillo","Thraex"]);
      const got = A.rivalReadOf(dom);
      const tie = A.rivalReadOf(yard(["Murmillo","Murmillo","Thraex","Thraex"]));
      /* TWO MEN OF THE SAME CLASS. A thin roster of two DIFFERENT classes is also a tie, so the
         tie guard masks the length guard and a sabotage that drops the length check walks through.
         One class, two men: unambiguous, and still too few to be a pattern. */
      const thin = A.rivalReadOf(yard(["Murmillo","Murmillo"]));
      /* the man the bay has not seen counts for less than the man it has */
      const d2 = yard(["Murmillo","Murmillo","Thraex","Thraex","Thraex"]);
      d2.gladiators.filter(g=>g.cls==="Thraex").forEach(g=>{ g.lastFought = d2.week - 90; });
      const stale = A.rivalReadOf(d2);
      arm1 = { dom: got && got.dom, want: got && got.want, share: got && got.share,
        tie: tie === null, thin: thin === null, stale: stale && stale.dom,
        edgeFor: got ? A.CLS_EDGE(got.want, got.dom) : null,
        edgeBack: got ? A.CLS_EDGE(got.dom, got.want) : null };
      if(!got || got.dom !== "Murmillo") bad.push(`a yard of three Murmillones and one Thraex read as "${got && got.dom}"`);
      if(!got || !got.want) bad.push(`the read named no countering class`);
      if(got && A.CLS_EDGE(got.want, got.dom) <= 1)
        bad.push(`the "counter" the read names does not actually beat the dominant class — CLS_EDGE(${got.want}, ${got.dom}) is ${A.CLS_EDGE(got.want, got.dom)}, so the reverse lookup is the wrong way round`);
      if(!arm1.tie) bad.push(`a roster split evenly two and two was still read as having a dominant class — a tie is not a pattern, and 46.3% of played weeks are ties`);
      if(!arm1.thin) bad.push(`a roster of two was read at all`);
      if(arm1.stale !== "Murmillo")
        bad.push(`three men the bay has not seen in ninety weeks outvoted two it saw last week (read "${arm1.stale}") — the weighting is toward who is on the sand`); }

    /* ---- 3: sight is the lanista's own, and it is capped ---- */
    let arm3 = null;
    { const rows = Object.keys(A.LANISTAE).map(nm=>({ nm,
        train:A.LANISTAE[nm].train, bid:A.LANISTAE[nm].bid,
        t:+A.readSharp({name:nm},"train").toFixed(3), b:+A.readSharp({name:nm},"bid").toFixed(3) }));
      arm3 = { rows, cap:A.READ_CAP };
      for(const x of rows){
        if(x.t > A.READ_CAP + 1e-9 || x.b > A.READ_CAP + 1e-9)
          bad.push(`${x.nm} reads at ${Math.max(x.t,x.b)}, past the READ_CAP of ${A.READ_CAP} — even the shrewdest lanista is a bias and never a certainty`);
        if(x.train <= 1 && x.t > 0) bad.push(`${x.nm} trains at ${x.train} and still reads at ${x.t}`);
      }
      const sharp = rows.filter(x=>x.t > 0.25).map(x=>x.nm);
      const blind = rows.filter(x=>x.t === 0).map(x=>x.nm);
      if(!sharp.length) bad.push(`no lanista reads sharply on the retrain axis at all`);
      if(!blind.length) bad.push(`every lanista reads — the personality differentiation is the whole point`);
      /* and the two axes must not be the same houses, or "who reads you" is one trait not two */
      const sharpB = rows.filter(x=>x.b > 0.25).map(x=>x.nm);
      arm3.sharp = sharp; arm3.blind = blind; arm3.sharpB = sharpB;
      if(sharp.join() === sharpB.join())
        bad.push(`the same houses read on both axes — train and bid are separate fields and Glaber (bid 1.7) is meant to buy what he cannot train`); }

    /* ---- 4: retrain aims, past the floor, and says so only when it aimed ---- */
    let arm4 = null;
    { const cell = (nm) => {
        let hit = 0, told = 0, n = 700;
        for(let i=0;i<n;i++){
          const d = yard(["Murmillo","Murmillo","Murmillo","Thraex"]);
          const read = A.rivalReadOf(d);
          const h = { name:nm, fighters:[], fame:100 };
          const f = A.makeRivalFighter(d, nm, 55);
          f.cls = CL.find(c => c !== read.want);
          h.fighters.push(f);
          const line = A.RIVAL_MOVES.retrain.run(d, h);
          const landed = h.fighters[0].cls === read.want;
          const aimedLine = /noticed that before you did|is for, and you are fielding it|which way to jump|aimed at somebody/.test(line||"");
          if(landed) hit++;
          if(aimedLine){ told++; if(!landed) bad.push(`${nm} said he aimed and did not land on the counter`); }
        }
        return { nm, pc:+(100*hit/n).toFixed(1), told:+(100*told/n).toFixed(1) }; };
      const sharp = cell("Tullius"), blind = cell("Glaber"), mid = cell("Cossutius");
      arm4 = { sharp, blind, mid };
      if(sharp.pc < 40) bad.push(`Tullius (train 1.55) lands on the counter ${sharp.pc}% of the time — the item's own target for a shrewd house is 40%`);
      if(blind.pc > 30) bad.push(`Glaber (train 0.75) lands on the counter ${blind.pc}% — a house that does not look should sit at the uniform floor`);
      if(blind.told > 0) bad.push(`Glaber claimed to have aimed ${blind.told}% of the time`);
      if(sharp.told < 20) bad.push(`Tullius aimed but only said so ${sharp.told}% of the time — the tell and the bias ship in the same function so there is no silent counter`);
      if(!(sharp.pc > mid.pc && mid.pc > blind.pc))
        bad.push(`sight is not ordered by train: Tullius ${sharp.pc}% · Cossutius ${mid.pc}% · Glaber ${blind.pc}%`); }

    /* ---- 5: buy aims inside the value band ---- */
    let arm5 = null;
    { let aimed = 0, below = 0, n = 500, tookN = 0, worst = 1;
      for(let i=0;i<n;i++){
        const d = yard(["Murmillo","Murmillo","Murmillo","Thraex"]);
        const read = A.rivalReadOf(d);
        d.market = [];
        /* a rich block: the best man is NOT the counter, so any aim is a real choice */
        for(let k=0;k<6;k++){
          const g = A.genGladiator(d, 80 - k*6); g.id = d.nextId++;
          g.cls = k === 3 ? read.want : CL[k % CL.length];
          if(k === 0 && g.cls === read.want) g.cls = read.dom;
          g.price = A.gladValue(g); d.market.push(g);
        }
        const pool = d.market.slice().sort((a,b)=>A.gladValue(b)-A.gladValue(a));
        const topWorth = A.gladValue(pool[0]);
        /* THE MAN ON THE BLOCK, NOT THE FIGHTER HE BECOMES. `buy.run` builds a rival fighter with
           `makeRivalFighter` and copies only the seven stats and his name across — no wins, no
           pfame, no kit — so `gladValue` of the thing in `h.fighters` is not what he cost. The
           first draft of this arm compared that and reported 79 of 500 buys breaking a band the
           code never broke. The block is priced before the call and looked up by name after. */
        const worthOf = {}; for(const g of pool) worthOf[g.name] = A.gladValue(g);
        const h = { name:"Tullius", fighters:[], fame:100 };
        const line = A.RIVAL_MOVES.buy.run(d, h);
        if(!line) continue;
        tookN++;
        const got = h.fighters[h.fighters.length-1];
        const ratio = (worthOf[got.name] || 0) / Math.max(1, topWorth);
        worst = Math.min(worst, ratio);
        if(ratio < A.BUY_BAND - 0.02) below++;
        if(/which is what you buy when|only one house in Capua that makes him|Consider what a|except the man who has been watching/.test(line)){
          aimed++;
          if(got.cls !== read.want) bad.push(`the buy said it was aimed and the man is a ${got.cls}, not the ${read.want} that counters`);
        }
      }
      /* AND A HOUSE THAT DOES NOT BID SHARPLY MUST NEVER AIM ONE. Testing only Tullius means a
         sabotage that removes the `R() < readSharp(h,"bid")` gate entirely still passes — every
         house aims, and the one house being watched was going to aim anyway. */
      let blindAimed = 0, blindN = 0;
      for(let i=0;i<300;i++){
        const d = yard(["Murmillo","Murmillo","Murmillo","Thraex"]);
        const read = A.rivalReadOf(d);
        d.market = [];
        for(let k=0;k<6;k++){
          const g = A.genGladiator(d, 80 - k*6); g.id = d.nextId++;
          g.cls = k === 3 ? read.want : CL[k % CL.length];
          if(k === 0 && g.cls === read.want) g.cls = read.dom;
          g.price = A.gladValue(g); d.market.push(g);
        }
        const h = { name:"Cossutius", fighters:[], fame:100 };   /* bid 0.8 — he does not look */
        const line = A.RIVAL_MOVES.buy.run(d, h);
        if(!line) continue;
        blindN++;
        if(/which is what you buy when|only one house in Capua that makes him|Consider what a|except the man who has been watching/.test(line)) blindAimed++;
      }
      arm5 = { n:tookN, aimed, below, band:A.BUY_BAND, worst:+worst.toFixed(2), blindAimed, blindN };
      if(!aimed) bad.push(`Tullius never once bought the counter off a block that had one`);
      if(blindAimed) bad.push(`Cossutius (bid 0.8) aimed ${blindAimed} of ${blindN} buys — a house that does not bid sharply does not read the block either`);
      if(below) bad.push(`${below} of ${tookN} buys took a man worth less than BUY_BAND (${A.BUY_BAND}) of the best on the block — the tilt is a soft preference, not a licence to strip the market`); }

    /* ---- 6: a house that cannot be read is not read ---- */
    let arm6 = null;
    { let told = 0, n = 400;
      for(let i=0;i<n;i++){
        const d = yard(["Murmillo","Thraex","Hoplomachus","Secutor"]);   /* one of each — no pattern */
        if(A.rivalReadOf(d)) bad.push(`a roster of one man per class was read as having a dominant one`);
        const h = { name:"Tullius", fighters:[], fame:100 };
        h.fighters.push(A.makeRivalFighter(d, "Tullius", 55));
        const line = A.RIVAL_MOVES.retrain.run(d, h);
        if(/noticed that before you did|is for, and you are fielding it|which way to jump|aimed at somebody/.test(line||"")) told++;
      }
      arm6 = { n, told };
      if(told) bad.push(`${told} of ${n} retrains against an unreadable roster still claimed to be aimed`); }

    return { bad, arm1, arm3, arm4, arm5, arm6 };
  });

  bad.push(...r.bad);
  lines.push(`the read: three Murmillones and a Thraex read as ${r.arm1.dom} (${r.arm1.share} of the yard), countered by ${r.arm1.want}`);
  lines.push(`  and the lookup is the right way round — CLS_EDGE(${r.arm1.want}, ${r.arm1.dom}) is ${r.arm1.edgeFor}, the other way ${r.arm1.edgeBack}`);
  lines.push(`  a two-and-two tie reads as nothing (${r.arm1.tie}) · a roster of two reads as nothing (${r.arm1.thin}) · three men unseen for ninety weeks lose to two the bay watched (${r.arm1.stale})`);
  lines.push(`sight, capped at ${r.arm3.cap}: ${r.arm3.rows.map(x=>`${x.nm} ${x.t}/${x.b}`).join(" · ")}`);
  lines.push(`  sharp on the card [${r.arm3.sharp.join(", ")}] · sharp on the block [${r.arm3.sharpB.join(", ")}] · blind [${r.arm3.blind.join(", ")}]`);
  lines.push(`retrain, 700 a cell against a readable yard: Tullius lands ${r.arm4.sharp.pc}% (aimed ${r.arm4.sharp.told}%) · Cossutius ${r.arm4.mid.pc}% · Glaber ${r.arm4.blind.pc}% (aimed ${r.arm4.blind.told}%)`);
  lines.push(`  [the uniform floor is 15.8% in play, 20% on a fixture where he never starts as the counter]`);
  lines.push(`buy: ${r.arm5.aimed} of ${r.arm5.n} took the counter off the block · none below ${r.arm5.band} of the best man there (worst ${r.arm5.worst})`);
  lines.push(`  and Cossutius, who bids 0.8, aimed ${r.arm5.blindAimed} of ${r.arm5.blindN}`);
  lines.push(`and a yard of one man per class drew ${r.arm6.told} aimed moves in ${r.arm6.n} — there is nothing to read, so nothing is read`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
