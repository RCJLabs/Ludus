/* HER FAMILY, WHICH IS THREE SENTENCES AND THEN FURNITURE — #243 phase 1's measurement

   `resolveMatch` writes `dmm.wife = { name, family, married, age, from }`. **Nothing reads `from`.**
   The dowry is paid once, the favour once, `weddingEndsFeud` fires once for the rival, and after that
   week the three families are the same wife. Phase 1 makes each of them a standing tie:

     merchant     a `bargain`-shaped yearly call on the block, through `SLAVERS`
     magistrate   `inspector` heat softened, and a patron who is family
     rival        the folded feud as a HOSTAGE — put her brother's man down `sine missione`
                  and `weddingEndsFeud` unfolds

   Three ties, three different systems, and none of them worth building into a branch nobody takes.
   So, before any of it: WHICH FAMILY DOES A HOUSE ACTUALLY GET, AND HOW MUCH TRAFFIC IS THERE ON
   THE HOOK EACH TIE WOULD HANG FROM.

   The rope answers `pendingEvent` with choice 0, and choice 0 on the match card is the MERCHANT
   every time — so the reference player's answer is known before it is measured, and measuring it is
   the point: it says what the default house sees. The `answer` lever drives the other two.

     1 · MERCHANT    choice 0, which is also what the reference player does unaided
     2 · MAGISTRATE  choice 1
     3 · RIVAL       choice 2 when it is offered at all — and whether it IS offered is the first
                     number this probe owes, because the rival candidate needs a house at grudge 30
                     on the week the matchmakers call, and they call at a median of week 35
     4 · NOT NOW     the decline, as the control on the marriage being what moves these numbers

   Run: node test/probes/mistress.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "MIST";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at = f => s[Math.min(s.length-1, Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), max:s[s.length-1] }; };
  const sum = o => Object.values(o||{}).reduce((a,b)=>a+(b||0),0);

  const run = (seed, want) => {
    const d = A.newGameState("Mist", "clean", seed);
    const row = { weeks:0, card:0, offered:null, took:null, wedAt:null, from:null,
      atCard:null, atCard2:null, atCardWk:null, topGrudge:0, wk30:null, shapes:{}, lateCards:0, lateRival:0,
      heat:[], inspector:0, bargain:0, bought:0, scouted:0, burned:0,
      patrons:0, kinPatrons:0, rivalAlive:null, rivalKin:null, nemBack:0, events:{},
      /* ---- HER LIFE, for phase 2 ----
         "add the `fever` shape, death, and widowhood re-opening `marryReady` (which wants the slot
         empty)". Three numbers decide whether that is worth building: how many WIFE-WEEKS there are
         to put a hazard on, what AGE she is across them (a hazard has to be a curve, and childbirth
         is the one the game already has a moment for), and whether the lanista is still under 56 —
         `marryReady`'s own ceiling — when a plausible death would land. A widowhood that re-opens
         nothing is a loss with no second act. */
      wifeWeeks:0, herAges:[], hisAges:[], hisWhenOld:[], births:[], kidsAtEnd:0, bornWeeks:[],
      /* phase 2, once it is built: the fever card, who dies of what, and whether the slot re-opening
         leads anywhere. `widowWeeks` split by whether her children are still in the house is the
         tie's own half-life. */
      illCards:0, illAnswer:{}, deaths:0, how:{}, diedAt:[], herDeathAge:[], hisDeathAge:[],
      weds:0, remarried:false, widowWeeks:0, halfWeeks:0, noTieWeeks:0, reWedAt:null,
      /* ---- PHASE 3: HER OWN ASKS ----
         "two or three `ASKS`-shaped conversations with the mistress: a man she wants sold or
         spared, the household, the daughter's match". Three questions before any of it is built:
         how much traffic the ask channel already carries; whether the three subjects EXIST in a
         played house (a household to complain about, a daughter of an age to be matched); and how
         many weeks she is standing there to do the asking. */
      asks:0, askPool:[], askOpen:0, folk:0, folkWeeks:0, folkKinds:{},
      daughters:0, dAge:[], dEvents:0, oldestKid:0,
      herAsks:0, herKinds:{}, herAnswer:{}, moods:[], endMood:null, herSpent:0, noSell:0 };
    /* the card is answered here, and the card is also READ here — the only place the candidate
       list exists is the event object, and it is thrown away the moment it is run */
    const answer = (ev) => {
      if(ev.id === "herAsk"){
        row.herAsks++;
        const k = (ev.data && ev.data.k) || "?";
        row.herKinds[k] = (row.herKinds[k]||0) + 1;
        const i = want === "refusing" ? 1 : 0;
        row.herAnswer[i === 0 ? "gave" : "refused"] = (row.herAnswer[i === 0 ? "gave" : "refused"]||0) + 1;
        return i;
      }
      if(ev.id === "wifeIll"){
        row.illCards++;
        const keys = (ev.data && ev.data.keys) || ["pass"];
        /* `pay` is the reference player — this rope answers 0, and 0 is the physician. `skimp`
           takes the last door, which is always "herbs, rest, and what the household knows". */
        const i = want === "skimp" ? keys.length - 1 : 0;
        row.illAnswer[keys[i]] = (row.illAnswer[keys[i]]||0) + 1;
        return i;
      }
      if(ev.id !== "match") return null;
      const kinds = ((ev.data && ev.data.cands) || []).map(c=>c.kind);
      /* EVERY card, not the first — `row.offered` was the first card's shape and the summary line
         read "offered: merchant+magistrate 13" over an arm that had dealt FIFTY-THREE of them. A
         tally that answers a narrower question than its label is the fault this project keeps
         finding; the label here is "what does the card ever offer". */
      row.card++; row.shapes[kinds.join("+")] = (row.shapes[kinds.join("+")]||0)+1;
      if(row.offered == null) row.offered = kinds.join("+");
      /* THE THIRD FAMILY'S GATE, read on the week the matchmakers call: the rival candidate wants a
         house at grudge 30 and the card calls at a median of week 39. This is the number that says
         whether "three families are willing" is a promise the card can keep. */
      const gs = (d.rivals||[]).filter(h=>!h.retired).map(h=>Math.round(h.grudge||0)).sort((a,b)=>b-a);
      if(row.atCard == null){ row.atCard = gs[0]||0; row.atCard2 = gs[1]||0; row.atCardWk = d.week; }
      /* and the cards dealt AFTER the feud has had time to arrive, which is the honest test of
         whether the third family is unreachable or merely early */
      if(row.wk30 != null){ row.lateCards++; if(kinds.includes("rival")) row.lateRival++; }
      if(want === "none") return kinds.length;             /* "Not now" is past the last candidate */
      const kind = (want === "pay" || want === "skimp" || want === "refusing") ? "merchant" : want;
      const i = kinds.indexOf(kind);
      if(i >= 0){ row.took = kind; return i; }
      row.took = kinds.length ? kinds[0] : null;           /* the branch was not on the card */
      return 0;
    };
    let nemWas = null;
    for(let w=0; w<W; w++){
      if(d.over) break;
      row.weeks++;
      const L = A.lawOf ? A.lawOf(d) : null; if(L) row.heat.push(Math.round(L.heat||0));
      let did = null;
      try { did = R.lanista(d, { answer }); } catch(e){ break; }
      for(const [k,n] of Object.entries((did && did.events) || {})) row.events[k] = (row.events[k]||0)+n;
      row.asks = row.events.ask || 0; row.dEvents = row.events.daughter || 0;
      const dm = A.domusOf(d);
      if(dm.wife && row.wedAt == null){ row.wedAt = d.week; row.from = dm.wife.from; }
      /* the death is read off `dm.widowed`, which `wifeDies` stamps and nothing else writes */
      const wd = dm.widowed || null;
      if(wd && wd.died != null && !row.seenDeath){ row.seenDeath = wd.died; row.deaths++;
        row.how[wd.how||"?"] = (row.how[wd.how||"?"]||0)+1; row.diedAt.push(wd.died);
        row.herDeathAge.push(wd.age); if(d.lanista) row.hisDeathAge.push(d.lanista.age); }
      if(wd && dm.wife && dm.wife.married > wd.died && !row.remarried){
        row.remarried = true; row.weds = 2; row.reWedAt = dm.wife.married; }
      if(wd && !dm.wife){ row.widowWeeks++;
        if(A.kinTie(d)) row.halfWeeks++; else row.noTieWeeks++; }
      if(dm.wife){
        row.wifeWeeks++;
        const md = A.wifeMood(d); if(md != null) row.moods.push(md);
        const her = (dm.wife.age||24) + Math.floor((d.week - (dm.wife.married||1))/A.WEEKS_PER_YEAR);
        row.herAges.push(her);
        if(d.lanista){ row.hisAges.push(d.lanista.age); if(her >= 40) row.hisWhenOld.push(d.lanista.age); }
        const kids = (dm.children||[]).length;
        if(kids > row.births.length) for(let n=row.births.length; n<kids; n++){ row.births.push(1); row.bornWeeks.push(d.week); }
      }
      /* the feud coming BACK is what a hostage would have to bite on */
      /* the ask channel as it stands: how big the pool is, and how often it is non-empty */
      try { const pool = A.askPool(d); row.askPool.push(pool.length); if(pool.length) row.askOpen++; } catch(e){}
      /* the household, which is one of her three subjects */
      try { const have = (A.HH_KEYS||[]).filter(k=>A.hasFolk(d,k));
        if(have.length){ row.folkWeeks++; for(const k of have) row.folkKinds[k] = (row.folkKinds[k]||0)+1; }
        if(have.length > row.folk) row.folk = have.length; } catch(e){}
      /* and the daughter, who is the third */
      try { const kids = (A.domusOf(d).children||[]).filter(c=>!c.dead);
        const girls = kids.filter(c=>c.sex==="f");
        if(girls.length > row.daughters) row.daughters = girls.length;
        for(const c of kids){ const a = A.childAge(d,c); if(a > row.oldestKid) row.oldestKid = a; }
        for(const c of girls){ const a = A.childAge(d,c); if(a >= 15 && !c.__seen15){ c.__seen15 = true; row.dAge.push(a); } } } catch(e){}
      const top = Math.max(0, ...(d.rivals||[]).filter(h=>!h.retired).map(h=>h.grudge||0));
      if(top > row.topGrudge) row.topGrudge = Math.round(top);
      if(row.wk30 == null && top >= 30) row.wk30 = d.week;
      const nem = d.nemHouse ? d.nemHouse.house : null;
      if(nem && nem !== nemWas) row.nemBack++;
      nemWas = nem;
    }
    row.inspector = row.events.inspector || 0;
    row.bargain = row.events.bargain || 0;
    const sl = d.slavers || {};
    row.bought = sum(Object.fromEntries(Object.entries(sl).map(([k,v])=>[k,v.bought])));
    row.scouted = sum(Object.fromEntries(Object.entries(sl).map(([k,v])=>[k,v.scouted])));
    row.burned = sum(Object.fromEntries(Object.entries(sl).map(([k,v])=>[k,v.burned])));
    const ps = (d.patrons||[]);
    row.patrons = ps.length; row.kinPatrons = ps.filter(x=>x.kin).length;
    const dm = A.domusOf(d);
    row.from = dm.wife ? dm.wife.from : row.from;
    if(row.took === "rival"){
      const h = (d.rivals||[]).find(x=>x.kin);
      row.rivalAlive = !!(h && !h.retired); row.rivalKin = !!h;
    }
    row.kidsAtEnd = ((A.domusOf(d).children)||[]).filter(c=>!c.dead).length;
    row.endMood = A.wifeMood(d); row.noSell = ((d.flags||{}).noSell||[]).length;
    row.heatQ = q(row.heat); delete row.heat; delete row.events;
    return row;
  };

  const arms = {};
  for(const want of ["merchant","magistrate","rival","none","pay","skimp","refusing"]){
    const rows = [];
    for(let i=0;i<H;i++) rows.push(run(SEED+"-"+i, want));
    const wed = rows.filter(r=>r.from);
    const froms = {}; wed.forEach(r=>{ froms[r.from] = (froms[r.from]||0)+1; });
    const offers = {}; rows.forEach(r=>{ if(r.offered) offers[r.offered] = (offers[r.offered]||0)+1; });
    arms[want] = { houses:H, weeks:rows.reduce((a,r)=>a+r.weeks,0),
      lived:q(rows.map(r=>r.weeks)),
      cards:rows.reduce((a,r)=>a+r.card,0), offers, wed:wed.length, froms,
      wedAt:q(wed.map(r=>r.wedAt)),
      inspector:rows.reduce((a,r)=>a+r.inspector,0), inspQ:q(rows.map(r=>r.inspector)),
      bargain:rows.reduce((a,r)=>a+r.bargain,0),
      bought:q(rows.map(r=>r.bought)), scouted:q(rows.map(r=>r.scouted)), burned:q(rows.map(r=>r.burned)),
      heat:q(rows.flatMap(r=>r.heatQ ? [r.heatQ.p50] : [])),
      heatTop:q(rows.flatMap(r=>r.heatQ ? [r.heatQ.p90] : [])),
      patrons:q(rows.map(r=>r.patrons)), kinPatrons:rows.reduce((a,r)=>a+r.kinPatrons,0),
      nemBack:q(rows.map(r=>r.nemBack)),
      shapes:rows.reduce((m,r)=>{ for(const [k,n] of Object.entries(r.shapes)) m[k]=(m[k]||0)+n; return m; },{}),
      lateCards:rows.reduce((a,r)=>a+r.lateCards,0), lateRival:rows.reduce((a,r)=>a+r.lateRival,0),
      atCard:q(rows.filter(r=>r.atCard!=null).map(r=>r.atCard)),
      atCardWk:q(rows.filter(r=>r.atCardWk!=null).map(r=>r.atCardWk)),
      topGrudge:q(rows.map(r=>r.topGrudge)),
      wk30:q(rows.filter(r=>r.wk30!=null).map(r=>r.wk30)), reach30:rows.filter(r=>r.wk30!=null).length,
      rivalAlive:rows.filter(r=>r.rivalAlive).length, rivalKin:rows.filter(r=>r.rivalKin).length,
      /* her life */
      wifeWeeks:rows.reduce((a,r)=>a+r.wifeWeeks,0), wifeWeeksQ:q(rows.map(r=>r.wifeWeeks)),
      herAge:q(rows.flatMap(r=>r.herAges)),
      herAtEnd:q(rows.filter(r=>r.herAges.length).map(r=>r.herAges[r.herAges.length-1])),
      hisAge:q(rows.flatMap(r=>r.hisAges)),
      hisUnder56:(()=>{ const a = rows.flatMap(r=>r.hisAges); return a.length ? +(100*a.filter(x=>x<56).length/a.length).toFixed(1) : 0; })(),
      hisWhenOld:q(rows.flatMap(r=>r.hisWhenOld)),
      oldUnder56:(()=>{ const a = rows.flatMap(r=>r.hisWhenOld); return a.length ? +(100*a.filter(x=>x<56).length/a.length).toFixed(1) : 0; })(),
      births:rows.reduce((a,r)=>a+r.births.length,0), birthsQ:q(rows.map(r=>r.births.length)),
      bornAt:q(rows.flatMap(r=>r.bornWeeks)),
      kidsAtEnd:q(rows.map(r=>r.kidsAtEnd)), withKids:rows.filter(r=>r.kidsAtEnd>0).length,
      /* phase 2 */
      illCards:rows.reduce((a,r)=>a+r.illCards,0),
      illAnswer:rows.reduce((m,r)=>{ for(const [k,n] of Object.entries(r.illAnswer)) m[k]=(m[k]||0)+n; return m; },{}),
      deaths:rows.filter(r=>r.deaths).length,
      how:rows.reduce((m,r)=>{ for(const [k,n] of Object.entries(r.how)) m[k]=(m[k]||0)+n; return m; },{}),
      diedAt:q(rows.flatMap(r=>r.diedAt)), herDeathAge:q(rows.flatMap(r=>r.herDeathAge)),
      hisDeathAge:q(rows.flatMap(r=>r.hisDeathAge)),
      remarried:rows.filter(r=>r.remarried).length, reWedAt:q(rows.filter(r=>r.reWedAt!=null).map(r=>r.reWedAt)),
      widowWeeks:rows.reduce((a,r)=>a+r.widowWeeks,0),
      halfWeeks:rows.reduce((a,r)=>a+r.halfWeeks,0), noTieWeeks:rows.reduce((a,r)=>a+r.noTieWeeks,0),
      /* phase 3 */
      asks:rows.reduce((a,r)=>a+r.asks,0), asksQ:q(rows.map(r=>r.asks)),
      poolQ:q(rows.flatMap(r=>r.askPool)), askOpen:rows.reduce((a,r)=>a+r.askOpen,0),
      folkQ:q(rows.map(r=>r.folk)), folkHouses:rows.filter(r=>r.folk>0).length,
      folkWeeks:rows.reduce((a,r)=>a+r.folkWeeks,0),
      folkKinds:rows.reduce((m,r)=>{ for(const [k,n] of Object.entries(r.folkKinds)) m[k]=(m[k]||0)+n; return m; },{}),
      daughters:rows.reduce((a,r)=>a+r.daughters,0), dHouses:rows.filter(r=>r.daughters>0).length,
      d15:rows.reduce((a,r)=>a+r.dAge.length,0), d15Houses:rows.filter(r=>r.dAge.length).length,
      dEvents:rows.reduce((a,r)=>a+r.dEvents,0), oldestKid:q(rows.map(r=>r.oldestKid)),
      herAsks:rows.reduce((a,r)=>a+r.herAsks,0), herAsksQ:q(rows.map(r=>r.herAsks)),
      herKinds:rows.reduce((m,r)=>{ for(const [k,n] of Object.entries(r.herKinds)) m[k]=(m[k]||0)+n; return m; },{}),
      herAnswer:rows.reduce((m,r)=>{ for(const [k,n] of Object.entries(r.herAnswer)) m[k]=(m[k]||0)+n; return m; },{}),
      mood:q(rows.flatMap(r=>r.moods)), endMood:q(rows.filter(r=>r.endMood!=null).map(r=>r.endMood)),
      noSell:q(rows.map(r=>r.noSell)),
    };
  }
  return arms;
}, [H,W,SEED]);

const f = x => x ? `p10 ${x.p10} · p50 ${x.p50} · p90 ${x.p90} · max ${x.max}` : "—";
console.log(`#243 PHASE 1 — HER FAMILY AS A STANDING TIE, ${H} x ${W}, seed ${SEED}\n`);
for(const [k,a] of Object.entries(out)){
  console.log(`== ${k.toUpperCase()} ==`);
  console.log(`  ${a.houses} houses · ${a.weeks}w played · lived ${f(a.lived)}`);
  console.log(`  the card came ${a.cards}x · every card offered: ${Object.entries(a.shapes).map(([s,n])=>`${s} ${n}`).join(" · ")||"never"}`);
  console.log(`     · of the ${a.lateCards} dealt AFTER a grudge of 30 had been reached, ${a.lateRival} carried the rival`);
  console.log(`  married ${a.wed}/${a.houses} at ${f(a.wedAt)} · from: ${Object.entries(a.froms).map(([s,n])=>`${s} ${n}`).join(" · ")||"—"}`);
  console.log(`  THE MERCHANT'S HOOK — the block: bought ${f(a.bought)} · scouted ${f(a.scouted)} · burned ${f(a.burned)} · \`bargain\` fired ${a.bargain}x`);
  console.log(`  THE MAGISTRATE'S — heat p50 across weeks ${f(a.heat)}, its p90 ${f(a.heatTop)} · \`inspector\` ${a.inspector}x, per house ${f(a.inspQ)} · patrons ${f(a.patrons)}, kin ${a.kinPatrons}`);
  console.log(`  THE RIVAL'S — a nemesis house raised ${f(a.nemBack)} times a house · married-in house still standing ${a.rivalAlive}/${a.rivalKin} kin-marked`);
  console.log(`  THE THIRD FAMILY'S GATE — top grudge ON THE WEEK THE CARD CAME (${f(a.atCardWk)}): ${f(a.atCard)}`);
  console.log(`     · a grudge of 30 is reached in ${a.reach30}/${a.houses} houses, at ${f(a.wk30)} · highest ever ${f(a.topGrudge)}`);
  console.log(`  HER LIFE (phase 2) — wife-weeks ${a.wifeWeeks} total, per house ${f(a.wifeWeeksQ)}`);
  console.log(`     · her age across those weeks ${f(a.herAge)} · at the house's end ${f(a.herAtEnd)}`);
  console.log(`     · HIS age across them ${f(a.hisAge)} — under 56 (marryReady's ceiling) on ${a.hisUnder56}% of wife-weeks`);
  console.log(`     · once she is 40+: his age ${f(a.hisWhenOld)}, under 56 on ${a.oldUnder56}%`);
  console.log(`     · births ${a.births} total, per house ${f(a.birthsQ)} at ${f(a.bornAt)} · houses with a living child at the end ${a.withKids}/${a.houses}, count ${f(a.kidsAtEnd)}`);
  console.log(`  AND SHE HAS A LIFE — the fever came ${a.illCards}x, answered ${Object.entries(a.illAnswer).map(([k,n])=>`${k} ${n}`).join(" · ")||"—"}`);
  console.log(`     · SHE DIED in ${a.deaths}/${a.houses} houses (${Object.entries(a.how).map(([k,n])=>`${k} ${n}`).join(" · ")||"—"}) at week ${f(a.diedAt)}, aged ${f(a.herDeathAge)}; he was ${f(a.hisDeathAge)}`);
  console.log(`     · he married again in ${a.remarried}/${a.deaths||0} of them, at ${f(a.reWedAt)} · widowed weeks ${a.widowWeeks} — tie at half ${a.halfWeeks}, gone ${a.noTieWeeks}`);
  console.log(`  HER OWN ASKS (phase 3) — the channel today: ${a.asks} asks heard, per house ${f(a.asksQ)} · the pool is non-empty on ${a.askOpen} of ${a.weeks} weeks, size ${f(a.poolQ)}`);
  console.log(`     · THE HOUSEHOLD: folk hired in ${a.folkHouses}/${a.houses} houses (most at once ${f(a.folkQ)}), standing ${a.folkWeeks} weeks — ${Object.entries(a.folkKinds).map(([k,n])=>`${k} ${n}w`).join(" · ")||"never"}`);
  console.log(`     · HERS: ${a.herAsks} asks, per house ${f(a.herAsksQ)} — ${Object.entries(a.herKinds).map(([k,n])=>`${k} ${n}`).join(" · ")||"never"} · answered ${Object.entries(a.herAnswer).map(([k,n])=>`${k} ${n}`).join(" · ")||"—"}`);
  console.log(`     · HER MOOD across wife-weeks ${f(a.mood)} · at the house's end ${f(a.endMood)} · men she kept off the block ${f(a.noSell)}`);
  console.log(`     · THE DAUGHTER: ${a.daughters} born across ${a.dHouses}/${a.houses} houses · reached 15 in ${a.d15Houses} houses (${a.d15} girls) · \`daughter\` fired ${a.dEvents}x · oldest child ever ${f(a.oldestKid)}\n`);
}
await browser.close(); server.close();
