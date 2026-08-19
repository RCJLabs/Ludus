/* WHAT CAPUA CALLS YOU, AND WHETHER IT EVER MAKES UP ITS MIND — #159

   #159 opened on a coverage count: `addRep`, `repLeader`, `repOf`, `repShare`, `repSettle`,
   `repTotal` and `repWeek` reached by 0 of 68 checks, with `chair` driving `repStyle` and nothing
   underneath it. Its falsification is #152's own clause — that they are pure readers no check would
   sensibly drive — and reading the source that is already answered: the name Capua settles on feeds
   the lanista's traits (`hard` and `merciful` want fifteen consecutive weeks of one name), half of
   `disgrace`'s gate (`repOf(d,"blood") >= 88`), whether debts get collected, the block's discount,
   which patron courts you, whether the medicus stays, a town's taste on the road, the crowd, a
   gambit's odds and an extra bout on a festival card. Nothing about that is a pure reader.

   So the question is the one the coverage count implies rather than states: does the machinery ever
   engage? There are four names, a floor, a settling share, a keeping share and a take-it-off-you
   margin — five constants and four outcomes — and nothing in the suite has ever watched them move.

   WHAT IS ASKED:
   · does the town settle at all, on what, and how often does it change its mind?
   · are all four names reached, or is this the shape #151, #156 and #165 all turned out to be?
   · does the fifteen-week run that earns `hard` or `merciful` ever happen in play?
   · does `repOf(d,"blood") >= 88` — half of `disgrace`'s gate — ever come true?
   · and do KEEP, TAKE and FLOOR ever bind, or does the name latch once and sit there?

   INSTRUMENT NOTES:
   · sampled EVERY week, not at the end. "Which name a house ends on" and "which name a house lives
     under" are different questions and only the second is about a four-way ladder.
   · a GRANTED arm holds the ledger up, because a house that dies at week 40 has not declined a name,
     it has run out of money.
   · three seed prefixes.
   · every transition is recorded with the week and both names, so a settle that never fires and a
     settle that fires and is immediately undone cannot read the same.

   WHAT IT FOUND. The clause falsifies — nothing here is a pure reader — and the machinery was
   switching itself off. Each tally was clamped at 120 and all four decay 1.5% a week, so a tally
   settles at `inflow/0.015` and every kind a rounded house feeds at more than 1.8 a week ends up
   sitting on the clamp. Then the arithmetic closes it: with the other three at a cap C the leader
   needs 3C·s/(1−s), which is 202.5 for SETTLE 0.36 and 154.3 for KEEP 0.30 — both above 120. A house
   whose other three saturate MUST lose its name and can never win another.

     30 houses x 420w, the ledger held up (where saturation is reached)     cap 120     cap derived
       the town had no name for it at all                                    72.3%         18.4%
       weeks it said "blood" or "show", of 10,878                                0             0
       times it changed its mind / dropped a name                            0 / 32        0 / 19
       `merciful` earned, of 30                                                   1             0

     the same 30 houses as the rope actually plays                          cap 120     cap derived
       no name at all                                                        23.1%          6.3%
       changed its mind / dropped a name                                     24 / 19       27 / 13
       `merciful` earned, of 30                                                  22            21
       median life                                                              56w           56w

   `hard` was earned by NO house in any of the four arms: it wants fifteen straight weeks of the
   blood name and the reference player never holds it. That is a fact about the policy, not the
   machinery — `chair` shows a house that chases `show` holding it 824 weeks of 917.

   AND ONE OF THIS PROBE'S OWN READINGS NEARLY SHIPPED AS A FINDING. A first pass over 12 houses on
   a different seed prefix read craft 57.1% and every other name at NOUGHT, with 0 changes of mind
   and a tally peaking at 437 — while the 30-house run on the same build read all four names used
   and 24 changes. Both were true: the first prefix happened to produce long-lived houses, which
   saturate, and the second short-lived ones, which never do. #136's rule — a bar taken over a
   handful of houses is a bar on one RNG trajectory — and the reason the granted arm is the one that
   settles it, because a house that cannot go broke is the long-lived case by construction. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "NAME";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const arms = [];
  for(const grant of [0, 200000]){
    const houses = [];
    for(const pre of [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`]){
      for(let h=0; h<H; h++){
        const d = A.newGameState("Nm"+h, "clean", `${pre}-${h}`, null);
        const wk = { none:0 }; for(const k of A.REP_ORDER) wk[k] = 0;
        const moves = [];
        let run = 0, longest = 0, longKey = null, prev = null;
        let floorWk = 0, bloodPeak = 0, bloodGate = 0, totPeak = 0;
        let firstSettle = null;
        const traits = { hard:null, merciful:null };
        for(let w=0; w<W; w++){
          if(d.over) break;
          if(grant) d.gold = Math.max(d.gold, grant);
          R.lanista(d);
          if(!d.lanista) break;
          const st = A.repStyle(d);
          wk[st || "none"]++;
          const tot = A.repTotal(d);
          totPeak = Math.max(totPeak, tot);
          if(tot < A.REP_FLOOR) floorWk++;
          bloodPeak = Math.max(bloodPeak, A.repOf(d, "blood"));
          if(A.repOf(d, "blood") >= 88) bloodGate++;
          if(st !== prev){
            moves.push({ w:d.week, from:prev, to:st });
            if(prev !== null || st !== null){ if(run > longest){ longest = run; longKey = prev; } }
            run = 0; prev = st;
            if(st && firstSettle == null) firstSettle = d.week;
          } else run++;
          for(const t of ["hard","merciful"]) if(traits[t] == null && A.hasLT(d, t)) traits[t] = d.week;
        }
        if(run > longest){ longest = run; longKey = prev; }
        const L = A.repLeader(d);
        houses.push({ pre, h, end:d.week, over:d.over?d.over.kind:"alive",
          wk, moves, longest, longKey, floorWk, bloodPeak:+bloodPeak.toFixed(1), bloodGate,
          totPeak:+totPeak.toFixed(1), firstSettle, traits,
          endName:A.repStyle(d), leader:L.key, share:+L.share.toFixed(3), tot:+L.tot.toFixed(1),
          rep:Object.fromEntries(A.REP_ORDER.map(k=>[k, +A.repOf(d,k).toFixed(1)])) });
      }
    }
    arms.push({ grant, houses });
  }

  /* ---- the machinery on its own, driven by hand: does each constant bind? ---- */
  const gates = (()=>{
    const mk = rep => { const q = A.newGameState("Ng","clean","NAME-G",null); q.week = 50;
      q.rep = { blood:0, show:0, craft:0, mercy:0, ...rep }; q.repName = null; return q; };
    const rows = [];
    /* the floor: a house nobody has noticed gets no name however lopsided it is */
    { const q = mk({ blood:A.REP_FLOOR - 1 }); A.repSettle(q);
      rows.push({ nm:`one blood point under the floor (${A.REP_FLOOR})`, name:A.repStyle(q), leader:A.repLeader(q).key }); }
    { const q = mk({ blood:A.REP_FLOOR }); A.repSettle(q);
      rows.push({ nm:`exactly at the floor`, name:A.repStyle(q), leader:A.repLeader(q).key }); }
    /* the settle share: loudest is not enough */
    { const q = mk({ blood:30, show:29, craft:29, mercy:29 }); A.repSettle(q);
      rows.push({ nm:`loudest but only ${(30/117*100).toFixed(0)}% of the tally`, name:A.repStyle(q), leader:A.repLeader(q).key }); }
    { const q = mk({ blood:60, show:20, craft:20, mercy:20 }); A.repSettle(q);
      rows.push({ nm:`loudest and 50% of the tally`, name:A.repStyle(q), leader:A.repLeader(q).key }); }
    /* the keep share: a settled name survives a lead it would not have won */
    { const q = mk({ blood:60, show:20, craft:20, mercy:20 }); A.repSettle(q);
      q.rep = { blood:32, show:30, craft:19, mercy:19 }; A.repSettle(q);
      rows.push({ nm:`held at 32% — under SETTLE ${A.REP_SETTLE}, over KEEP ${A.REP_KEEP}`, name:A.repStyle(q), leader:A.repLeader(q).key }); }
    { const q = mk({ blood:60, show:20, craft:20, mercy:20 }); A.repSettle(q);
      q.rep = { blood:20, show:45, craft:18, mercy:17 }; A.repSettle(q);
      rows.push({ nm:`another gets clear of it`, name:A.repStyle(q), leader:A.repLeader(q).key }); }
    { const q = mk({ blood:60, show:20, craft:20, mercy:20 }); A.repSettle(q);
      q.rep = { blood:20, show:26, craft:26, mercy:26 }; A.repSettle(q);
      rows.push({ nm:`it falls away and nobody replaces it`, name:A.repStyle(q), leader:A.repLeader(q).key }); }
    /* TAKE: a challenger clear of SETTLE but not clear of the holder by TAKE */
    { const q = mk({ blood:60, show:20, craft:20, mercy:20 }); A.repSettle(q);
      q.rep = { blood:37, show:38, craft:13, mercy:12 }; A.repSettle(q);
      rows.push({ nm:`a challenger one point clear (TAKE is ${A.REP_TAKE})`, name:A.repStyle(q), leader:A.repLeader(q).key }); }
    return rows;
  })();

  /* ---- and what each of the four is worth, so "does it matter" has figures ---- */
  const effects = A.REP_ORDER.map(k=>({ k, name:A.REP_KINDS[k].name, patron:A.REP_KINDS[k].patron,
    lines:(A.REP_EFFECTS && A.REP_EFFECTS[k]) ? A.REP_EFFECTS[k].length : null }));

  return { arms, gates, effects,
    K:{ floor:A.REP_FLOOR, settle:A.REP_SETTLE, keep:A.REP_KEEP, take:A.REP_TAKE } };
}, [H, W, SEED]);

const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : null; };
const f1 = x => x==null ? "—" : (+x).toFixed(1);

console.log(`\n  the constants: floor ${out.K.floor} · settles at ${out.K.settle} · keeps at ${out.K.keep} · taken off you by ${out.K.take}\n`);

for(const arm of out.arms){
  const HS = arm.houses;
  console.log(`\n  ${HS.length} houses x ${W}w${arm.grant ? ", the ledger held up" : ", as the rope plays"}\n`);
  const tot = {}; let all = 0;
  for(const h of HS) for(const [k,v] of Object.entries(h.wk)){ tot[k] = (tot[k]||0)+v; all += v; }
  console.log(`  what the town calls a house, by the week:`);
  for(const k of ["none", ...Object.keys(tot).filter(k=>k!=="none")])
    if(tot[k] != null) console.log(`    ${(k==="none"?"nothing in particular":k).padEnd(22)} ${String(tot[k]).padStart(6)} weeks  ${((tot[k]/all)*100).toFixed(1)}%`);
  console.log(`  houses that were ever named:      ${HS.filter(h=>h.firstSettle!=null).length} of ${HS.length} (median week ${med(HS.map(h=>h.firstSettle))||"—"})`);
  console.log(`  names the town used at all:       ${[...new Set(HS.flatMap(h=>h.moves.map(m=>m.to)).filter(Boolean))].join(", ") || "none"}`);
  console.log(`  times it changed its mind:        ${HS.reduce((s,h)=>s+h.moves.filter(m=>m.from&&m.to).length,0)} · dropped a name entirely ${HS.reduce((s,h)=>s+h.moves.filter(m=>m.from&&!m.to).length,0)}`);
  console.log(`  the longest a name was held:      median ${med(HS.map(h=>h.longest))}w · most ${Math.max(...HS.map(h=>h.longest))}w`);
  console.log(`  weeks under the floor of ${out.K.floor}:      ${HS.reduce((s,h)=>s+h.floorWk,0)} of ${all}`);
  console.log(`  \`hard\` earned by ${HS.filter(h=>h.traits.hard).length} houses · \`merciful\` by ${HS.filter(h=>h.traits.merciful).length} — both want fifteen straight weeks of one name`);
  console.log(`  blood past 88 (half of disgrace's gate): ${HS.filter(h=>h.bloodGate>0).length} houses, ${HS.reduce((s,h)=>s+h.bloodGate,0)} weeks · peak blood median ${f1(med(HS.map(h=>h.bloodPeak)))}`);
  console.log(`  the tally at its highest: median ${f1(med(HS.map(h=>h.totPeak)))}`);
  console.log(`\n  raw:`);
  console.log(`    seed        ended  ending       ends as     leader/share   blood  show  craft mercy   changes  longest   hard/merciful`);
  for(const h of HS)
    console.log(`    ${h.pre.padEnd(11)} ${String(h.end).padStart(5)}  ${String(h.over).padEnd(11)} ${String(h.endName||"—").padEnd(10)}  ${String(h.leader||"—").padEnd(6)}${String(h.share).padStart(6)}  ${String(h.rep.blood).padStart(6)}${String(h.rep.show).padStart(6)}${String(h.rep.craft).padStart(6)}${String(h.rep.mercy).padStart(6)}   ${String(h.moves.filter(m=>m.from&&m.to).length).padStart(7)}  ${String(h.longest).padStart(7)}w   ${h.traits.hard?"hard@"+h.traits.hard:"—"}/${h.traits.merciful?"merciful@"+h.traits.merciful:"—"}`);
  const withMoves = HS.filter(h=>h.moves.filter(m=>m.to).length > 1)[0];
  if(withMoves)
    console.log(`\n  and one house's whole history of names (${withMoves.pre} h${withMoves.h}): `
      + withMoves.moves.map(m=>`w${m.w} ${m.from||"—"}→${m.to||"—"}`).join(" · "));
}

console.log(`\n  THE MACHINERY ON ITS OWN — does each constant bind?\n`);
for(const g of out.gates)
  console.log(`    ${g.nm.padEnd(52)} loudest ${String(g.leader||"—").padEnd(7)} → the town says ${g.name || "nothing in particular"}`);

console.log(`\n  and what each name is worth, in the words the panel uses:\n`);
for(const e of out.effects)
  console.log(`    ${e.k.padEnd(7)} ${e.name.padEnd(18)} courts a ${String(e.patron).padEnd(11)} · ${e.lines} effects listed`);

await browser.close(); server.close();
