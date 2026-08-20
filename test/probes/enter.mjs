/* #166 — THE ENTRANCE, AGAINST A CARD THAT IS NOT A MIRROR

   #166 was opened off `audit.mjs` with its own falsification written into it: "the spread is the
   mirrored setup — a real card's opponents vary, and `showman`'s crowd term may be worth less
   against a man who is not your twin." This probe is that clause and nothing else.

   WHY THE CLAUSE IS NOT IDLE. The crowd term is applied to BOTH men:
       const cf = clamp(crowd,0,100)/100;
       const shoA = 1 + cf*(A.sho/100)*shoK(A) * (cPeak && !mobHis ? 1.4 : 1);
       const shoB = 1 + cf*(B.sho/100)*shoK(B) * (cPeak &&  mobHis ? 1.4 : 1);
   so +16 crowd to a bout between twins lifts both sides by the same factor — EXCEPT through the
   peak, which is one boolean and goes to one of them whole:
       let mobHis = ((B.pfame||0) - (A.pfame||0)) > 12;   const mobClear = |gap| > 12
       if(crowd>=82 && !cPeak){ if(!mobClear) mobHis = sA!==sB ? sB : mom<0 ? true : mom>0 ? false : R()<0.5; }
   Twins have IDENTICAL pfame, so the gap is 0, so `mobClear` is FALSE in every mirrored bout and
   `showman`'s `mom:1` wins the tiebreak every single time — worth 1.4x on the crowd term and
   `sigOpen` 1.12 — off a coin the mirror rigs. Against a real card the gap is not 0. How often it
   is inside twelve is the whole question, and it is a thing the game deals, not a thing I choose.

   THE ARMS, four words each, the same seed set in every arm:
     0 · WHAT THE GAME DEALS — every bout twelve played houses actually FIGHT, caught by wrapping
         `doFight` on the handle. This is the weight everything else is read through.
     1 · MIRROR — the audit's setup replayed on this build: twins at 78 in all six.
     2 · CARD — a generated man of the house against `pickRivalOpp`, the function every offer in
         the game uses, banded by the pfame gap so the answer is a curve rather than an average.
     2d· THE ABLATION — two words that exist nowhere in the game, each dropping one of showman's
         terms, every bout forced inside twelve so the tiebreak is live.
     3 · GREEN · 4 · FOUNDING and ESTABLISHED with an outmatched man · 5 · the curve itself ·
     6 · THE POLICY — one word pressed every week for 420 of them, through the rope's own lever.

   INSTRUMENT PROOF. Every bout carries a signature — my man's six stats and pfame, the opponent's
   name, class, six stats, pfame and tier — taken BEFORE the fight, because a bout MUTATES both
   men and a signature taken after it is a measurement of the outcome. The four words' signature
   lists must be identical or the pairing is broken and every number below is noise. Printed, not
   assumed: the first mismatching bout is dumped in full. Section 0 carries its own calibration:
   the mean chance the panel states against the share actually won, 35.7% to 37.1%.

   WHAT IT FOUND. Half the headline was the mirror: showman +18.3 mirrored, +7.1 on the card, +6.7
   weighted. And the half that survived belonged to a different term — the sixteen points of crowd
   are worth +0.0 and the one point of momentum +8.4. `boxes` reads identical to no entrance to the
   digit in all three bands, because its missio was the last term in `missioScore` a player chooses
   that was still inside the editor's cap. Outside it (v3.59.0) it is +7.1 to a great house, and a
   house that salutes every week loses 12.85% of its bouts to a death against 19.31%.

   FOUR INSTRUMENT FAULTS, ALL CAUGHT HERE AND ALL WORTH REMEMBERING:
     · the signature was taken AFTER the fight, so the arms read unpaired on bouts they ran alike;
     · every crux RESUME counted as a fresh bout, so 3,198 bouts read as 6,777 — caught by printing
       the raw twelve, where the same two men stood four rows running;
     · `o.men` on the rope takes gladiators, not ids, and `[g.id]` fails with no reason given;
     · the `entrance` lever shipped UNCONNECTED — `run` honoured it, `lanista`'s `takeBout` call did
       not forward it, and four career arms came back byte-identical. A lever with real leverage
       does not produce zero divergence; the note beside that call says the same about `preferStakes`.

   Usage: node test/probes/enter.mjs [N per arm] [seed]
*/
import { serve, open } from "../harness.mjs";
const N = +(process.argv[2] || 150), SEED = process.argv[3] || "ENT";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([N,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const KEYS = A.ENTRANCE_KEYS;
  const avg = f => A.STATS.reduce((s,k)=>s+(f[k]||0),0)/6;

  /* ============ 0 · WHAT THE GAME DEALS ============
     Not the bouts a house is OFFERED — the bouts it TAKES. The rope calls `doFight` through the
     handle, so wrapping the handle's own property catches every single bout a played house
     actually fights and nothing it declined. Restored afterwards. */
  const deal = (()=>{
    const gaps = [], chances = [], bands = { mine:0, close:0, his:0 }, raw = [];
    let weeks = 0, bouts = 0, houses = 0, won = 0, lost = 0;
    const orig = A.doFight;
    /* `doFight(d, gid, offer, tactic, bet, PENDING, choice, plan)` — a bout HELD at a crux comes
       back through this same door once for every word the box says, so counting every call counted
       one bout three and four times over and put a third of them in an invented "held" bucket. A
       bout starts only when `pending` is falsy; its verdict arrives on whichever call returns
       without a crux. Caught by printing the raw twelve: the same men, four rows running. */
    let cur = null;
    A.doFight = function(d, gid, offer, tactic, bet, pending){
      if(!pending){
        cur = null;
        try {
          const g = (d.gladiators||[]).find(x=>x.id===gid);
          if(g && offer && offer.opp){
            const gap = (offer.opp.pfame||0) - (g.pfame||0);
            const ch = A.winChance(g, offer.opp, 0, "measured");
            gaps.push(Math.round(gap));
            chances.push(Math.round(ch*100));
            bands[gap > 12 ? "his" : gap < -12 ? "mine" : "close"]++;
            bouts++;
            cur = { ch, mine:avg(g), his:avg(offer.opp), tier:offer.tier,
              mp:Math.round(g.pfame||0), hp:Math.round(offer.opp.pfame||0), st:offer.stakes };
          }
        } catch(e){}
      }
      const r = orig.apply(this, arguments);
      /* THE CALIBRATION: what the panel's number said against what the sand did. If those two
         disagree, the chance is the instrument talking rather than the game. */
      if(cur && r && !r.__err && !r.crux){
        if(r.win) won++; else lost++;
        if(raw.length < 12) raw.push(Object.assign({ win:!!r.win }, cur));
        cur = null;
      }
      return r;
    };
    try {
      for(const pre of [`${SEED}-D1`, `${SEED}-D2`, `${SEED}-D3`]){
        for(let h=0; h<4; h++){
          const d = A.newGameState("Dl"+h, "clean", `${pre}-${h}`, null);
          houses++;
          for(let w=0; w<420; w++){
            if(d.over) break;
            d.gold = Math.max(d.gold, 200000);        /* the free-grant bound: the long-lived arm */
            R.lanista(d);
            if(!d.lanista) break;
            weeks++;
          }
        }
      }
    } finally { A.doFight = orig; }
    return { gaps, chances, bands, weeks, bouts, houses, won, lost, raw };
  })();

  /* ============ the two setups ============ */
  const state = (seed, poor) => {
    const d = A.newGameState("En","clean",seed,null);
    d.week = 60;
    if(poor){ d.fame = 40; d.favor = 12; d.patrons = []; d.gold = 400; }
    else { d.fame = 900; d.gold = 60000; }
    return d;
  };

  /* the audit's own setup, so the replication is like for like */
  const twin = (d) => {
    const opp = A.genOpponent(2, A.qForStat(78));
    for(const k of A.STATS) opp[k] = 78;
    opp.kit = A.kitFor(opp.cls, 2); opp.wins = 8;
    const g = A.genGladiator(d, A.qForStat(78));
    for(const k of A.STATS) g[k] = opp[k];
    g.cls = opp.cls; g.kit = opp.kit; g.traits = (opp.traits||[]).slice();
    g.heart = opp.heart; g.morale = opp.morale; g.pfame = opp.pfame; g.wins = opp.wins;
    g.status = "active"; g.injury = null; g.fatigue = 0; g.lastFought = -99;
    d.gladiators.push(g);
    const o = { id:d.nextId++, tier:2, festival:"a bench", opp, oppRef:null,
      stakes:"standard", purse:700, entrance:null };
    d.games = { festival:"x", offers:[o], week:d.week };
    return { g, o };
  };

  /* a man of the house against whoever the offer generator picks out of the men who exist.
     TIER is the game's own band table, matched to what my man actually is, so the card is the
     one an editor would make rather than one I chose. THE GAP IS THE CONTROLLED VARIABLE: his
     renown is set a fixed distance from the man he is put in front of, so all three bands fill
     evenly. That makes the gap a curve; the WEIGHT on the curve comes from section 0, which is
     the gap the game deals and nothing I set. Within a band the four words share one pfame, so
     pfame's other job — the 0.20 term in `missioScore` — cannot move a word against a word. */
  const TBANDS = [[22,46],[38,60],[54,76],[66,99]];
  const GAPS = [-160,-70,-25,-6,0,6,25,70,160], BASES = [25, 70, 160];
  const card = (d, i, flat, poor, weak) => {
    const g = A.genGladiator(d, A.qForStat(weak ? 28 + (i % 6) * 3 : 52 + (i % 6) * 8));
    g.status = "active"; g.injury = null; g.fatigue = 0; g.lastFought = -99;
    g.wins = 2 + (i % 9); g.losses = i % 4;
    d.gladiators.push(g);
    const a = avg(g);
    let tier = 3; for(let t=0;t<4;t++) if(a >= TBANDS[t][0] && a <= TBANDS[t][1]){ tier = t; break; }
    tier = Math.min(3, tier + (weak ? 2 : (i % 2)));  /* half the card a rung above him, as an editor's is */
    const pr = A.pickRivalOpp(d, tier);
    /* renown is set on BOTH men around a common base, because a fresh circuit's men carry a
       pfame of nought to thirty and the gap cannot be opened from one side alone. The base walks
       25/70/160 — the range played houses live in — and the gap is what section 0 will weight. */
    /* a founding house's man is UNKNOWN, and `pfame*0.20` alone fills MISSIO_CAP at 140 — so an
       arm that poors the house but leaves the man at 160 renown is not measuring a founding house
       at all. Its bases walk 5/15/30 instead. */
    const want = flat ? 0 : GAPS[i % GAPS.length];
    const base = (poor ? [5,15,30] : BASES)[Math.floor(i / GAPS.length) % 3];
    pr.opp.pfame = Math.max(0, Math.round(base + want/2));
    g.pfame      = Math.max(0, Math.round(base - want/2));
    const o = { id:d.nextId++, tier, festival:"a bench", opp:pr.opp, oppRef:pr.ref,
      stakes:"standard", purse:700, entrance:null };
    d.games = { festival:"x", offers:[o], week:d.week };
    return { g, o };
  };

  const sigOf = (g, o) => [A.STATS.map(k=>g[k]).join("."), Math.round(g.pfame||0),
    o.opp.name, o.opp.cls, A.STATS.map(k=>o.opp[k]).join("."), Math.round(o.opp.pfame||0), o.tier].join("|");

  const mobOf = res => {
    for(const x of (res.beats||[])){
      if(x.kind !== "crowd") continue;
      if(/did not come for your man/.test(x.text)) return "his";
      if(/feeds on it/.test(x.text)) return "mine";
    }
    return null;
  };

  const blank = () => ({ ran:0, won:0, lost:0, died:0, crowd:0, fame:0, favor:0, peak:0, mobMine:0 });
  const fold = (t, res, dF, dV, mob) => {
    t.ran++; if(res.win) t.won++; else { t.lost++; if(res.dead) t.died++; }
    t.crowd += res.crowd||0; t.fame += dF; t.favor += dV;
    if(mob){ t.peak++; if(mob==="mine") t.mobMine++; }
  };
  const done = t => ({ ran:t.ran, won:t.won, lost:t.lost, died:t.died,
    pct: t.ran ? t.won/t.ran*100 : null,
    spared: t.lost ? (t.lost-t.died)/t.lost*100 : null,
    crowd: t.ran ? t.crowd/t.ran : null, fame: t.ran ? t.fame/t.ran : null,
    favor: t.ran ? t.favor/t.ran : null,
    peak: t.ran ? t.peak/t.ran*100 : null, mobMine: t.peak ? t.mobMine/t.peak*100 : null });

  /* ---- THE ABLATION WORDS ----
     `showman` is four terms at once. These two split it: each keeps the stamina cost and the two
     fame, and each drops exactly one of the pair that could carry the peak. They are added to
     `ENTRANCES` but NOT to `ENTRANCE_KEYS`, so nothing in the game can reach them and the panel
     still shows four buttons. */
  A.ENTRANCES.abCrowd = { name:"crowd only", crowd:16, stam:-5, fame:2 };
  A.ENTRANCES.abMom   = { name:"mom only",              stam:-5, fame:2, mom:1 };

  /* one arm: N bouts of one word, on one seed prefix, in one setup */
  const cell = (setup, key, pre, opt) => {
    const O = opt || {};
    const all = blank(), byBand = { mine:blank(), close:blank(), his:blank() };
    const sig = []; let skipped = 0; const gaps = [], chances = [];
    for(let i=0;i<N;i++){
      const d = state(`${pre}-${setup}-${i}`, O.poor);
      const made = setup === "M" ? twin(d) : card(d, i, O.flat, O.poor, O.weak);
      if(!made){ skipped++; continue; }
      const { g, o } = made;
      if(O.green) o.opp.wins = 1;
      o.entrance = key;
      const gap = (o.opp.pfame||0) - (g.pfame||0);
      const band = gap > 12 ? "his" : gap < -12 ? "mine" : "close";
      sig.push(sigOf(g, o));                             /* BEFORE the fight — a bout mutates both */
      gaps.push(Math.round(gap));
      chances.push(Math.round(A.winChance(g, o.opp, 0, "measured")*100));
      const f0 = d.fame, v0 = A.patronsOf(d).reduce((s,x)=>s+x.favor, 0);
      let res = A.doFight(d, g.id, o, "measured", null, null, null, "none");
      if(res && res.crux) res = R.answer(d, res, "press").res;
      if(!res || res.__err || res.crux){ skipped++; sig.pop(); gaps.pop(); chances.pop(); continue; }
      const dF = d.fame - f0, dV = A.patronsOf(d).reduce((s,x)=>s+x.favor, 0) - v0;
      const mob = mobOf(res);
      fold(all, res, dF, dV, mob);
      fold(byBand[band], res, dF, dV, mob);
    }
    return { key, pre, skipped, ...done(all),
      bands: { mine:done(byBand.mine), close:done(byBand.close), his:done(byBand.his) },
      sig: sig.join("~"), gaps, chances };
  };

  const arm = (setup, pres, opt, words) => pres.map(pre =>
    ({ pre, rows: (words || KEYS).map(k => cell(setup, k, pre, opt)) }));
  const PRE = [`${SEED}-a`, `${SEED}-b`, `${SEED}-c`, `${SEED}-d`];

  const mirror = arm("M", PRE);
  const cardA  = arm("C", PRE);
  const green  = arm("C", PRE.slice(0,2), { green:true });
  const poor   = arm("C", PRE.slice(0,2), { poor:true, weak:true });
  const rich   = arm("C", PRE.slice(0,2), { weak:true });
  const ABW    = ["none","showman","abCrowd","abMom"];
  const ablate = arm("C", PRE, { flat:true }, ABW);

  /* ============ 6 · THE POLICY, OVER A CAREER ============
     One word pressed every week for 420 of them, against the arm that presses none. Control FIRST
     on each seed. `doFight` is wrapped again to count bouts and deaths, because a house's dead are
     replaced and a roster count at the end says nothing about how many went. */
  const career = (()=>{
    const rows = [];
    for(const word of [null, "boxes", "showman", "grim"]){
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
        for(const pre of [`${SEED}-C1`, `${SEED}-C2`, `${SEED}-C3`]){
          for(let h=0; h<8; h++){
            const d = A.newGameState("Cr"+h, "clean", `${pre}-${h}`, null);
            let w = 0;
            for(; w<420; w++){
              if(d.over) break;
              R.lanista(d, word ? { entrance:word } : undefined);
              if(!d.lanista) break;
            }
            lives.push(w);
          }
        }
      } finally { A.doFight = orig; }
      lives.sort((a,b)=>a-b);
      rows.push({ word: word || "none", bouts, deaths,
        rate: bouts ? deaths/bouts : null, median: lives[Math.floor(lives.length/2)], lives });
    }
    return rows;
  })();

  const table = KEYS.map(k => ({ k, ...A.ENTRANCES[k] }));

  /* where boxes' ten points land on the missio curve after #168 */
  const box = (()=>{
    const at = (fame, favor) => {
      const one = k => A.missioOdds(A.missioScore({ pfame:fame },
        { favor, fav:k==="fav"?A.ENT_MISSIO:0, day:k==="day"?A.ENT_MISSIO:0, man:0, patron:null },
        30, 20, 16)) * 100;
      return { fame, favor, none:one(null), inside:one("fav"), outside:one("day") };
    };
    return [at(20,10), at(60,18), at(140,30), at(600,55), at(1400,80)];
  })();

  return { deal, mirror, cardA, green, poor, rich, ablate, career, ABW, table, box, N, KEYS };
}, [N, SEED]);

/* ---------------- report ---------------- */
const f1 = v => v==null ? "  —  " : v.toFixed(1).padStart(5);
const med = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
const quart = a => { const s=a.slice().sort((x,y)=>x-y);
  return `${s[Math.floor(s.length*0.25)]}% / ${s[Math.floor(s.length*0.75)]}%`; };
const mean = (rows, v) => { const xs = rows.map(r=>r[v]).filter(x=>x!=null);
  return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null; };

const sigCheck = (label, arm) => {
  let ok = true;
  for(const blk of arm){
    const base = blk.rows[0].sig;
    for(const r of blk.rows) if(r.sig !== base) ok = false;
  }
  console.log(`  ${label}: the four words met the same men, bout for bout — ${ok ? "YES" : "NO — THE PAIRING IS BROKEN"}`);
  if(!ok) for(const blk of arm){
    const base = blk.rows[0].sig.split("~");
    for(const r of blk.rows){
      const mine = r.sig.split("~");
      const i = mine.findIndex((x,ix)=>x !== base[ix]);
      if(i >= 0) console.log(`     ${blk.pre} ${r.key} first differs at bout ${i}:\n       ${arm[0].rows[0].key.padEnd(7)}: ${base[i]}\n       ${r.key.padEnd(7)}: ${mine[i]}`);
    }
  }
  return ok;
};

const show = (title, arm, words) => {
  const W = words || out.KEYS;
  console.log(`\n${title}`);
  console.log(`  word      win rate by prefix (${arm.map(b=>b.pre.slice(-1)).join("      ")})${" ".repeat(Math.max(0,26-arm.length*9))}mean   spared  crowd   fame   favour`);
  for(let k=0;k<W.length;k++){
    const rows = arm.map(b=>b.rows[k]);
    console.log(`  ${rows[0].key.padEnd(8)} ${rows.map(r=>f1(r.pct)).join(" /")}${" ".repeat(Math.max(0,26-arm.length*9))}  ${f1(mean(rows,"pct"))}  ${f1(mean(rows,"spared"))}  ${f1(mean(rows,"crowd"))}  ${f1(mean(rows,"fame"))}  ${f1(mean(rows,"favor"))}`);
  }
  const ran = arm.reduce((s,b)=>s+b.rows.reduce((t,r)=>t+r.ran,0),0);
  const skip = arm.reduce((s,b)=>s+b.rows.reduce((t,r)=>t+r.skipped,0),0);
  console.log(`  ${ran} bouts counted, ${skip} skipped`);
};

const mech = (title, arm) => {
  console.log(`\n${title}`);
  console.log(`  word      the crowd peaked   the mob was mine`);
  for(let k=0;k<arm[0].rows.length;k++){
    const rows = arm.map(b=>b.rows[k]);
    console.log(`  ${rows[0].key.padEnd(8)} ${f1(mean(rows,"peak"))}%            ${f1(mean(rows,"mobMine"))}%`);
  }
  const gaps = arm.flatMap(b=>b.rows[0].gaps), chs = arm.flatMap(b=>b.rows[0].chances);
  const inb = gaps.filter(g=>Math.abs(g)<=12).length;
  console.log(`  the card itself: pfame gap median ${med(gaps)}, range ${Math.min(...gaps)} to ${Math.max(...gaps)},`
    + ` inside twelve on ${(inb/gaps.length*100).toFixed(1)}% of bouts;`
    + ` win chance median ${med(chs)}%, range ${Math.min(...chs)}-${Math.max(...chs)}%`);
};

const bandTable = arm => {
  console.log(`\n2b · THE CARD, BY WHO THE CROWD ALREADY KNEW  (win rate / spared / bouts)`);
  const B = ["mine","close","his"];
  const label = { mine:"mine ahead by >12", close:"inside twelve", his:"his ahead by >12" };
  console.log(`  band                 ${out.KEYS.map(k=>k.padEnd(20)).join("")}`);
  for(const b of B){
    const cells = out.KEYS.map((k,i)=>{
      const rows = arm.map(x=>x.rows[i].bands[b]);
      const ran = rows.reduce((s,r)=>s+r.ran,0);
      const won = rows.reduce((s,r)=>s+r.won,0);
      const lost = rows.reduce((s,r)=>s+r.lost,0), died = rows.reduce((s,r)=>s+r.died,0);
      return `${(ran?won/ran*100:0).toFixed(1)}% / ${(lost?(lost-died)/lost*100:0).toFixed(1)}% / ${ran}`.padEnd(20);
    });
    console.log(`  ${label[b].padEnd(20)} ${cells.join("")}`);
  }
  /* #136: a band pooled over four prefixes is still four trajectories. Here they are apart. */
  console.log(`  none against showman inside twelve, prefix by prefix:`);
  for(const blk of arm){
    const a = blk.rows[0].bands.close, b = blk.rows[1].bands.close;
    console.log(`    ${blk.pre}  ${(a.ran?a.won/a.ran*100:0).toFixed(1)}% -> ${(b.ran?b.won/b.ran*100:0).toFixed(1)}%  (${a.ran} bouts)`);
  }
};

console.log(`\n#166 — THE ENTRANCE, AGAINST A CARD THAT IS NOT A MIRROR   (N=${out.N} a word a prefix)\n`);
console.log(`  what the four words are:`);
for(const t of out.table){
  const terms = ["crowd","stam","fame","mom","dread","missio","favor"].filter(k=>t[k]!=null)
    .map(k=>`${k} ${t[k]>0?"+":""}${t[k]}`).join(" · ") || "nothing";
  console.log(`    ${t.k.padEnd(8)} ${terms}`);
}

console.log(`\nINSTRUMENT`);
const okM = sigCheck("mirror", out.mirror);
const okC = sigCheck("card  ", out.cardA);

const D = out.deal, tot = D.bands.mine + D.bands.close + D.bands.his;
console.log(`\n0 · WHAT THE GAME DEALS — ${D.houses} played houses, ${D.weeks} weeks, ${D.bouts} single bouts FOUGHT`);
console.log(`  the renown gap between the man the rope would send and the man he is offered:`);
console.log(`    mine ahead by more than 12   ${(D.bands.mine/tot*100).toFixed(1)}%`);
console.log(`    inside twelve, either way    ${(D.bands.close/tot*100).toFixed(1)}%   <- the only band the entrance can win the mob in`);
console.log(`    his ahead by more than 12    ${(D.bands.his/tot*100).toFixed(1)}%`);
console.log(`  gap median ${med(D.gaps)}, range ${Math.min(...D.gaps)} to ${Math.max(...D.gaps)};`
  + ` and the win chance the game deals: median ${med(D.chances)}%, quartiles ${quart(D.chances)}`);
console.log(`  CALIBRATION — mean stated chance ${(D.chances.reduce((a,b)=>a+b,0)/D.chances.length).toFixed(1)}%`
  + ` against ${(D.won/(D.won+D.lost)*100).toFixed(1)}% actually won (${D.won} of ${D.won+D.lost} decided, ${D.bouts-D.won-D.lost} left hanging)`);
console.log(`  the first twelve bouts, raw:`);
for(const r of D.raw) console.log(`    tier ${r.tier} ${String(r.st).padEnd(8)} mine avg ${r.mine.toFixed(1)} pfame ${String(r.mp).padStart(4)}`
  + ` vs his avg ${r.his.toFixed(1)} pfame ${String(r.hp).padStart(4)}  chance ${(r.ch*100).toFixed(1)}%  ->  ${r.win===null?"held":r.win?"won":"lost"}`);

show("1 · THE MIRROR — the audit's setup, replayed on this build", out.mirror);
mech("1b · and what the mirror does to the coin", out.mirror);
show("2 · THE CARD — the game's own opponent generator, same man, same seeds", out.cardA);
mech("2c · and what the card does to it", out.cardA);
bandTable(out.cardA);
show("2d · THE ABLATION — every bout forced INSIDE twelve, where showman lives", out.ablate, out.ABW);

/* the decision number: the curve above, weighted by the gap the game actually deals */
{
  const B = ["mine","close","his"], share = { mine:D.bands.mine/tot, close:D.bands.close/tot, his:D.bands.his/tot };
  const rate = (wi, b) => {
    const rows = out.cardA.map(x=>x.rows[wi].bands[b]);
    const ran = rows.reduce((s,r)=>s+r.ran,0), won = rows.reduce((s,r)=>s+r.won,0);
    return ran ? won/ran*100 : null;
  };
  console.log(`\n2e · THE DECISION — the curve of 2b weighted by the card of 0`);
  const base = B.reduce((s,b)=>s + share[b]*rate(0,b), 0);
  for(let wi=0; wi<out.KEYS.length; wi++){
    const w = B.reduce((s,b)=>s + share[b]*rate(wi,b), 0);
    console.log(`  ${out.KEYS[wi].padEnd(8)} ${w.toFixed(1)}%   ${(w-base>=0?"+":"")}${(w-base).toFixed(1)} points against no entrance at all`);
  }
  console.log(`  weights: mine ${(share.mine*100).toFixed(1)}% · inside twelve ${(share.close*100).toFixed(1)}% · his ${(share.his*100).toFixed(1)}%`);
}

show("3 · THE CARD, against a GREEN opponent (grim's doubled dread)", out.green);
show("4 · A FOUNDING HOUSE WITH AN OUTMATCHED MAN — where the missio actually decides", out.poor);
show("4b · THE SAME OUTMATCHED MAN, in an established house — the cap is full here", out.rich);

console.log(`\n5 · WHERE THE SALUTE LANDS ON THE MISSIO CURVE — inside the box's cap against outside it`);
console.log(`  man / house favour   no salute   inside the cap (was)   outside it (now)`);
for(const b of out.box)
  console.log(`  ${String(b.fame).padStart(5)} / ${String(b.favor).padStart(3)}          ${f1(b.none)}%     ${f1(b.inside)}%  ${(b.inside-b.none>=0?"+":"")}${(b.inside-b.none).toFixed(1)}`
    + `        ${f1(b.outside)}%  ${(b.outside-b.none>=0?"+":"")}${(b.outside-b.none).toFixed(1)}`);

console.log(`\n6 · THE POLICY OVER A CAREER — 24 houses x 420 weeks a word, control first`);
console.log(`  word      bouts   his men died   a bout    median life`);
for(const r of out.career)
  console.log(`  ${r.word.padEnd(8)} ${String(r.bouts).padStart(5)}   ${String(r.deaths).padStart(10)}   ${(r.rate*100).toFixed(2)}%    ${String(r.median).padStart(3)}w   [${r.lives.join(" ")}]`);
console.log(`  every life is printed because a median of twenty-four is one number and these arms`);
console.log(`  diverge on the first bout — the death RATE over ~2,000 bouts is the figure to read.`);

console.log(`\n  instrument: ${okM && okC ? "both arms paired" : "PAIRING BROKEN — the numbers above mean nothing"}\n`);

await browser.close();
server.close();
