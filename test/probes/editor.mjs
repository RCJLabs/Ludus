/* THE EDITOR: A NAME LIST, A FLAG, AND ONE CONDITIONAL READER

   #205 says the only way to influence the editor is to bribe him, and that `d.flags.editorBought`
   and the `EDITORS` table mean "the model is there". Before building a legitimate route, read what
   the model actually is:

     EDITORS              five names. Used ONCE, to sign a booking line. There is no editor entity,
                          no standing relationship, nothing that persists between cards.
     editorBought         a 12-week flag with exactly ONE reader in the whole file, and it is on the
                          FALLBACK branch of `pickAnyOpp`:

                              if(!pool.length) return { opp: genOpponent(editorBought(d)
                                ? Math.max(0, tier-1) : tier, undefined, d), ... };

   So buying the editor softens your opponent only on the weeks the circuit had **nobody at all** in
   the tier band and the game had to invent a man. That is the number this probe exists for: if the
   circuit is nearly always populated, then the one thing the bribe buys is bought almost never, and
   #205 is not "the legitimate route is missing" — it is that the illegitimate one barely works.

   FALSIFIES the item's "the model is there" if the fallback is rare: there would be no model to
   attach a legitimate route to, and the release has to build one rather than reuse it.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 300);
const SEED = process.argv[4] || "EDITOR";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const readers = [...src.matchAll(/editorBought\(d\)/g)].length;
const edUses = [...src.matchAll(/\bEDITORS\b/g)].length - 1;   /* minus the definition */
const size = (src.match(/const CIRCUIT_SIZE = (\d+)/)||["","?"])[1];
const bands = (src.match(/const bands = (\[\[[^\]]*\][^;]*)\];/)||["","?"])[1];
console.log(`editorBought has ${readers} reader(s) in the file · EDITORS is used ${edUses} time(s) beyond its definition`);
console.log(`the circuit holds ${size} men · pickAnyOpp's bands: ${bands}]\n`);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const arm = async (opts) => inside(p, ([H, W, SEED, opts]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  R.reset();
  const T = { houses:0, weeks:0, bought:0, boughtWeeks:0, asks:0,
              /* the only thing the flag can change: how often pickAnyOpp has to invent a man */
              calls:0, fellBack:0, byTier:[0,0,0,0], fellByTier:[0,0,0,0] };
  for(let h=0; h<H; h++){
    const d = A.newGameState("Ed","clean",SEED+"-"+h, null); T.houses++;
    for(let w=0; w<W && !d.over; w++){
      R.lanista(d, opts); T.weeks++;
      if(A.editorBought(d)) T.boughtWeeks++;
      /* the fallback rate, read off the game's own pool test at every tier, without drawing:
         `pickAnyOpp` would invent a man exactly when this filter is empty */
      const avg = f => A.STATS.reduce((s,k)=>s+f[k],0)/6;
      const BANDS = [[22,46],[38,60],[54,76],[66,99]];
      for(let t=0;t<4;t++){
        const pool = (d.circuit||[]).filter(f=>{ const a=avg(f); return a>=BANDS[t][0]-12 && a<=BANDS[t][1]+12; });
        T.calls++; T.byTier[t]++;
        if(!pool.length){ T.fellBack++; T.fellByTier[t]++; }
      }
    }
    T.bought += (d.flags && d.flags.editorBought) ? 1 : 0;
  }
  return { T, rope: R.say() };
}, [H, W, SEED, opts]);

const C = await arm({});
const G = await arm({ gambit:4 });

/* ---- #254's VERIFY-FIRST: HAS THE LEDGER GOT ANYTHING TO HOLD? ----
   #254 wants `d.editors[name]` — a taste, the festivals he owns, and a record of bookings honoured
   and broken. `SLAVERS` is the model in the same file: four dealers who remember "exactly how the
   last four went". Before building a sixth memory system, the question is whether the player MEETS
   the same editor often enough for remembering to mean anything, and whether there is a record with
   two sides to it.

   Bookings are NOT dark, which had to be checked first: `offerBooking` fires at R()<0.10 a week,
   the ask becomes a `pendingEvent` with two doors, and the rope answers events with choice 0 —
   which here is "Sign for it". So the reference player signs every booking it is offered. But
   `takeBooking`, `offerBooking` and `failBooking` are on no export, so nothing in this suite has
   ever been able to drive one directly; this reads the deadline the booking leaves behind. */
const ledgerArm = (ROPE) => inside(p, ([H, W, SEED, ROPE]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  R.reset();
  const T = { houses:0, weeks:0, signed:0, honoured:0, broken:0, stillOpen:0,
              paidBack:0, fameLost:0, billHad:0, billChecked:0, manFit:0, ledgerHouses:0,
              perEditor:{}, distinctPerHouse:[], maxRepeat:[], gaps:[], names:{} };
  for(let h=0; h<H; h++){
    const d = A.newGameState("Led","clean",SEED+"-L"+h, null); T.houses++;
    const open = {}, mine = {}, lastAt = {}; const metIds = new Set();
    for(let w=0; w<W && !d.over; w++){
      R.lanista(d, ROPE); T.weeks++;
      for(const x of (d.deadlines||[])){
        if(x.kind !== "booking") continue;
        if(!open[x.id]){
          open[x.id] = { editor:x.editor, met:!!x.met, advance:x.advance||0, due:x.due, gid:x.gid };
          T.signed++;
          const e = x.editor || "(none)";
          T.perEditor[e] = (T.perEditor[e]||0) + 1;
          mine[e] = (mine[e]||0) + 1;
          if(lastAt[e] != null) T.gaps.push(d.week - lastAt[e]);
          lastAt[e] = d.week;
        }
        open[x.id].met = !!x.met;      /* last sight before it resolves */
      }
      /* WAS THE BOUT EVER ON THE BILL? `makeGames` pushes an offer carrying `booking:bk.id` for
         the festival the booking names, so honouring is reachable and 0-of-124 is about the
         policy. Counted rather than asserted from the source, because "reachable" read off code
         and "reached" read off a run are different claims and this project has confused them. */
      const offs = (d.games && d.games.offers) || [];
      if(offs.length && (d.deadlines||[]).some(x=>x.kind==="booking" && !x.met)){
        T.billChecked++;
        const bo = offs.find(o=>o.booking != null);
        if(bo){ T.billHad++;
          const man = (d.gladiators||[]).find(g=>g.id === bo.bookedGid);
          if(man && man.status === "active") T.manFit++; }
      }
      /* one that has gone from the list has been resolved by `deadlineWeek` */
      { const S0 = R.stats ? R.stats() : {}; for(const bid of (S0.bookedMetIds||[])) metIds.add(bid); }
      const live = new Set((d.deadlines||[]).filter(x=>x.kind==="booking").map(x=>x.id));
      for(const id of Object.keys(open)){
        if(live.has(+id) || live.has(id)) continue;
        /* ---- HONOUR IS ATTRIBUTED BY ID FROM INSIDE THE WEEK ----
           The first cut read `met` at last sight from out here and reported 0 honoured in BOTH
           arms — including the one where 32 of 32 booked bouts marked their contract. A booking is
           marked in `doFight` and the deadline is dropped by `deadlineWeek` in the same week it
           falls due, so an observer outside the week can never see the flag set. */
        if(metIds.has(+id) || metIds.has(id)) T.honoured++;
        else { T.broken++; T.paidBack += (open[id].advance||0) * 2; T.fameLost += 22; }
        delete open[id];
      }
    }
    T.stillOpen += Object.keys(open).length;
    if(d.editors && Object.keys(d.editors).length){ T.ledgerHouses++;
      for(const k of Object.keys(d.editors)){ const r = d.editors[k];
        if(!T.ledgerAcc) T.ledgerAcc = {};
        const a = T.ledgerAcc[k] = T.ledgerAcc[k] || { signed:0, kept:0, broken:0, paid:0 };
        for(const f of ["signed","kept","broken","paid"]) a[f] += (r[f]||0); } }
    T.distinctPerHouse.push(Object.keys(mine).length);
    T.maxRepeat.push(Object.values(mine).reduce((a,b)=>Math.max(a,b), 0));
  }
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    return { n:a.length, p50:s[Math.floor(s.length/2)], max:s[s.length-1] }; };
  T.distinctPerHouse = q(T.distinctPerHouse); T.maxRepeat = q(T.maxRepeat); T.gaps = q(T.gaps);
  /* #254 phase 1 — what the ledger actually holds after a run, read off the state rather than
     recomputed here, so a record that is written and never filled cannot read as a full one */
  T.ledger = T.ledgerAcc || {}; delete T.ledgerAcc;
  /* the lever's OWN reach, before anything is concluded about the game from its result */
  /* ---- THROUGH `stats()`, BECAUSE THE HANDLE IS NOT THE COUNTER STORE ----
     The rope's counters live on an inner `R` and the object on `window.__ROPE` carries only the
     functions — "R holds only counters; the rope's functions are closures". Reading `R.bookedSeen`
     off the handle gives undefined for EVERY counter, which read as "the lever never saw a booked
     bout" and would have been published as a fact about the game. The read-path control caught it:
     `tookSingle`, set in the same function on the same object, came back 0 as well, and a run with
     three thousand single bouts in it cannot have taken none. */
  const S = R.stats ? R.stats() : {};
  T.bookedSeen = S.bookedSeen||0; T.bookedTook = S.bookedTook||0; T.bookedUnfit = S.bookedUnfit||0;
  T.tookSingle = S.tookSingle||0;
  T.bookedRan = S.bookedRan||0; T.bookedMet = S.bookedMet||0;
  return T;
}, [H, W, SEED, ROPE]);
const ledger = await ledgerArm({});
const kept   = await ledgerArm({ booking:true });

console.log(`\n  ---- #254: WHAT A LEDGER WOULD HOLD (${ledger.houses} houses, ${ledger.weeks} weeks) ----`);
console.log(`  bookings signed          ${ledger.signed}`);
console.log(`  honoured / broken        ${ledger.honoured} / ${ledger.broken}  (still open at the end: ${ledger.stillOpen})`);
console.log(`  distinct editors a house meets  ${JSON.stringify(ledger.distinctPerHouse)}`);
console.log(`  most times one editor is met    ${JSON.stringify(ledger.maxRepeat)}`);
console.log(`  weeks between meeting the same man ${JSON.stringify(ledger.gaps)}`);
console.log(`  the bill carried the booked bout ${ledger.billHad} of ${ledger.billChecked} weeks a booking stood with a card up `
  + `(the booked man active on ${ledger.manFit} of them)`);
console.log(`  what breaking them cost: ${ledger.paidBack}d paid back and ${ledger.fameLost} fame across ${ledger.houses} houses `
  + `= ${Math.round(ledger.paidBack/ledger.houses)}d and ${Math.round(ledger.fameLost/ledger.houses)} fame a house`);
console.log(`  the record on disk (${ledger.ledgerHouses} of ${ledger.houses} houses hold one):`);
for(const [k,r] of Object.entries(ledger.ledger||{}))
  console.log(`    ${k.padEnd(9)} signed ${String(r.signed).padStart(3)} · kept ${String(r.kept).padStart(3)} `
    + `· broken ${String(r.broken).padStart(3)} · paid ${r.paid}d`);
console.log(`  by name: ${Object.entries(ledger.perEditor).map(([k,v])=>`${k} ${v}`).join(" · ") || "(none)"}`);
console.log(`\n  ---- AND WITH THE ROPE HONOURING WHAT IT SIGNS (booking:true) ----`);
console.log(`  signed ${kept.signed} · honoured ${kept.honoured} · broken ${kept.broken}`);
console.log(`  the lever's own reach: a booked bout was on the bill ${kept.bookedSeen} time(s) it looked, `
  + `taken ${kept.bookedTook}, passed over for an unfit man ${kept.bookedUnfit} `
  + `[read-path control: tookSingle ${kept.tookSingle}]`);
console.log(`  booked bouts actually fought ${kept.bookedRan}, and the contract was marked met on `
  + `${kept.bookedMet} of them (counted inside the week, since the deadline is dropped the week it falls due)`);
console.log(`  what breaking them still cost: ${kept.paidBack}d and ${kept.fameLost} fame `
  + `= ${Math.round(kept.paidBack/kept.houses)}d and ${Math.round(kept.fameLost/kept.houses)} fame a house`);

await browser.close(); server.close();

const pc = (n,dd) => dd ? (n/dd*100).toFixed(2)+"%" : "-";
console.log(`=== ${C.T.houses} houses x ${W} weeks an arm · control ${C.T.weeks} house-weeks, gambit:4 ${G.T.weeks}\n`);
for(const [lab, X] of [["control (never bribes)", C], ["gambit:4 (bribes as it can)", G]]){
  const T = X.T;
  console.log(`  ${lab}`);
  console.log(`     weeks the editor was BOUGHT              ${String(T.boughtWeeks).padStart(6)}  ${pc(T.boughtWeeks,T.weeks)} of weeks`);
  console.log(`     tier-band lookups made                   ${String(T.calls).padStart(6)}`);
  console.log(`     ...that would have to INVENT a man       ${String(T.fellBack).padStart(6)}  ${pc(T.fellBack,T.calls)}`);
  console.log(`     by tier: ${T.fellByTier.map((v,i)=>`t${i} ${pc(v,T.byTier[i])}`).join(" · ")}`);
  console.log("");
}
const overlap = (G.T.boughtWeeks / (G.T.weeks||1)) * (G.T.fellBack / (G.T.calls||1));
console.log(`  >>> THE FLAG HAS ${readers} READER AND IT IS ON A FALLBACK.`);
console.log(`      The circuit is empty in a tier band ${pc(G.T.fellBack, G.T.calls)} of the time, and the editor is bought`);
console.log(`      ${pc(G.T.boughtWeeks, G.T.weeks)} of weeks even under a player bribing every four weeks. Both together:`);
console.log(`      about ${(overlap*100).toFixed(3)}% of lookups are ones where buying him changes anything at all.`);
console.log(`  >>> ${G.T.fellBack === 0
  ? "The fallback NEVER fires, so the one thing a bribe buys is bought never. #205's model is a name list and a dead flag."
  : `#205's "the model is there" is generous: it is five names used once for a booking line, and a flag whose single reader fires on ${pc(G.T.fellBack,G.T.calls)} of lookups.`}`);
console.log(`\n  control: ${C.rope}`);
console.log(`  gambit:  ${G.rope}`);
