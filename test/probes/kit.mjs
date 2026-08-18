/* THE FOUR DOORS NOBODY HAS EVER OPENED — #149

   `dark.mjs` drove all nineteen exposed actions and found five whose gate never opens on a
   rope-played house. Four of those five are the reference player's habits rather than the game's
   content: it never borrows, so `repay` is dark; it never saves a loadout, so `applyKit` and
   `dropKit` are dark; it never starts a training season in-run, so `breakPlan` is. The item's
   clause said driving each one might find them all correct, and that this would still be worth the
   coverage — `wall` cost a release and refuted both of its hypotheses.

   THE ONE THING THAT MAKES THIS MEASURABLE RATHER THAN A CODE READ is that the steel economy has a
   CONSERVATION LAW, and the game states it itself. A piece of bought steel is either on a man or on
   the rack:

       d.gear[id]  ===  gearUsed(d, id)  +  (d.gearCond[id] || []).length
       owned             worn by somebody     sitting in the armoury, each with its own condition

   AND IT ONLY HOLDS FOR STEEL THAT WEARS, which the control arm proved before anything else did.
   The first version of this audit ran over every priced piece and the CONTROL failed it: three kinds
   out of balance on `equipOne`, the path the whole game is built around. The law was wrong, not the
   code — `buyGearItem` pushes a `gearCond` entry for every purchase, and `equipOne` only draws one
   down `if(wears(now))`, so house-issue stock accumulates entries nobody ever spends. `wears` is the
   filter, and the control arm exists to catch exactly this class of mistake before a finding is read
   off the arms below it.

   `equipOne` maintains both halves — it pushes the outgoing piece's wear into `d.gearCond[id]` and
   pulls the incoming piece's condition out of it. So `equipOne` is the CONTROL ARM here, and it runs
   first: if the law fails for the path the game is built around, the law is wrong and not the code.

   INSTRUMENT NOTES, off this project's record:
   · the ownership arithmetic is the game's own `gearUsed` / `gearFree` / `isBasic`, taken off the
     handle rather than rebuilt here. `stone` reconstructed a health formula, disagreed with the
     game, and had to be rewritten around the game's own function; this file does not repeat it.
   · every arm prints the per-id ledger it is complaining about — owned, worn, racked — because a
     bare "conservation violated" is unactionable and because a count with no raw material under it
     is how two findings on this project died.
   · the arms are ordered cheapest-control-first and each one starts from a fresh state, so a
     failure cannot be inherited from the arm before it. */
import { serve, open } from "../harness.mjs";
const REPS = +(process.argv[2] || 40);
const SEED = process.argv[3] || "KIT";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([REPS,SEED])=>{
  const A = window.__LVDVS;
  const rows = [];

  /* the law, read off the game's own ownership functions */
  const audit = d => {
    const bad = [], seen = {};
    for(const id of Object.keys(d.gear || {})){
      if(!A.wears(A.GEAR[id])) continue;      /* stock steel does not wear and does not draw the pool */
      const owned = d.gear[id] || 0;
      if(!owned) continue;
      const worn = A.gearUsed(d, id);
      const racked = ((d.gearCond || {})[id] || []).length;
      seen[id] = { owned, worn, racked };
      if(worn + racked !== owned) bad.push({ id, owned, worn, racked, off:(worn+racked)-owned });
    }
    return { bad, seen };
  };

  /* a house with steel in it and men to put it on */
  const stocked = (tag) => {
    const d = A.newGameState("Kt", "clean", `${SEED}-${tag}`, null);
    d.gold = 60000;
    const ids = Object.keys(A.GEAR).filter(id=>A.wears(A.GEAR[id]));
    const buy = ids.slice(0, 14);
    for(const id of buy) for(let i=0;i<3;i++) A.buyGearItem(d, id);
    return { d, buy };
  };

  /* ---- ARM 1: `equipOne`, THE CONTROL ---- */
  {
    const { d, buy } = stocked("equip");
    const men = A.activeG(d);
    let calls = 0;
    for(let r=0;r<REPS;r++){
      for(const g of men){
        const id = buy[(r + g.id) % buy.length];
        const slot = A.GEAR[id].slot;
        if(A.equipOne(d, g.id, slot, id)) calls++;
      }
    }
    const { bad, seen } = audit(d);
    rows.push({ arm:"equipOne (control)", calls, bad, seen });
  }

  /* ---- ARM 2: `armFromRack`, the yard's "arm him" button ---- */
  {
    const { d, buy } = stocked("rack");
    let calls = 0, changedSlots = 0;
    for(let r=0;r<REPS;r++) for(const g of A.activeG(d)){
      /* `bestKitFor` picks the highest-scoring AVAILABLE piece, and with a full rack that answer is
         the same every week — six changes in forty passes is not an exercise of this path. Buying a
         fresh piece each round is what actually makes the button do its job. */
      A.buyGearItem(d, buy[r % buy.length]);
      const res = A.armFromRack(d, g.id);
      if(res && res.changed && res.changed.length){ calls++; changedSlots += res.changed.length; }
      g.wear = g.wear || {};
      for(const s of A.SLOTS) if(g.wear[s] != null) g.wear[s] = Math.max(0, g.wear[s] - 9);
    }
    const { bad, seen } = audit(d);
    rows.push({ arm:"armFromRack", calls, bad, seen, note:`${changedSlots} slots changed` });
  }

  /* ---- ARM 3: `saveKit` + `applyKit`, the dark pair ---- */
  {
    const { d, buy } = stocked("kit");
    const men = A.activeG(d);
    /* give the first man a real loadout through the CORRECT path, save it, hand it round */
    for(const id of buy.slice(0,4)) A.equipOne(d, men[0].id, A.GEAR[id].slot, id);
    A.saveKit(d, men[0].id);
    let calls = 0, missing = 0;
    for(let r=0;r<REPS;r++) for(const g of men){
      const k = (d.kits||[])[0]; if(!k) continue;
      const res = A.applyKit(d, g.id, k.id);
      if(res){ calls++; missing += (res.missing||[]).length; }
    }
    const { bad, seen } = audit(d);
    rows.push({ arm:"saveKit + applyKit", calls, bad, seen, note:`${missing} slots came back "missing"` });
  }

  /* ---- ARM 4: what a kit does to CONDITION, told as one story ----
     The ledger above says whether pieces are lost. This says whether a keen piece arrives keen. */
  const tale = [];
  {
    const { d, buy } = stocked("tale");
    const men = A.activeG(d);
    const id = buy.find(x=>A.GEAR[x].slot === "weapon") || buy[0];
    const slot = A.GEAR[id].slot;
    /* put a BATTERED copy on the rack first, so "what condition did man B get" has a real answer
       rather than two hundreds that cannot be told apart */
    d.gearCond[id] = [31, 100];
    A.equipOne(d, men[0].id, slot, id);
    tale.push(`the rack holds ${(d.gearCond[id]||[]).join(",")} of ${d.gear[id]} ${A.GEAR[id].name}; man A takes one and reads ${A.wearOf(men[0], slot)}`);
    men[0].wear[slot] = 12;
    tale.push(`he fights it down to ${A.wearOf(men[0], slot)} · the rack now holds ${(d.gearCond[id]||[]).join(",")||"nothing"}`);
    A.saveKit(d, men[0].id);
    const before = ((d.gearCond||{})[id]||[]).slice();
    A.applyKit(d, men[1].id, (d.kits||[])[0].id);
    tale.push(`man B applies the saved kit and reads ${A.wearOf(men[1], slot)} on the same slot`
      + ` (the rack held ${before.join(",")||"nothing"} before, ${((d.gearCond||{})[id]||[]).join(",")||"nothing"} after)`);
    tale.push(`man A still shows ${A.wearOf(men[0], slot)} and is ${men[0].kit[slot]===id?"still carrying it":"no longer carrying it"}`
      + ` · the house owns ${d.gear[id]}, ${A.gearUsed(d,id)} worn, ${((d.gearCond||{})[id]||[]).length} racked`);
  }

  /* ---- ARM 4b: THE ONE PIECE THE GAME SAYS CANNOT BE TAKEN ----
     `forgeForMan` writes `g.named = {slot,...}` and its chronicle line is unambiguous: "It is his,
     and it is not going back on the rack." `equipOne` honours that with an explicit refusal and
     `stripAll` skips the slot. Whether the two dark paths do is a question, not an assumption. */
  const held = [];
  {
    const { d, buy } = stocked("named");
    const men = A.activeG(d);
    const id = buy.find(x=>A.GEAR[x].slot === "weapon") || buy[0];
    const slot = A.GEAR[id].slot;
    A.equipOne(d, men[0].id, slot, id);
    men[0].named = { slot, title:"Probe's Own", made:1 };
    /* the saved kit must want a DIFFERENT weapon, or "it left the named piece alone" only means
       the kit asked for the piece he was already holding — which tests nothing */
    const other = buy.find(x=>A.GEAR[x].slot === slot && x !== id);
    A.equipOne(d, men[1].id, slot, other);
    A.saveKit(d, men[1].id);
    const before = men[0].kit[slot];
    A.applyKit(d, men[0].id, (d.kits||[])[0].id);
    held.push(`applyKit on a man carrying a NAMED piece, with a kit that wants ${A.GEAR[other].name} instead: `
      + `${men[0].kit[slot]===before ? "left it alone" : `TOOK IT — ${before} became ${men[0].kit[slot]}`}`);
    const g2 = men[2];
    A.equipOne(d, g2.id, slot, id);
    g2.named = { slot, title:"Probe's Second", made:1 };
    const was = g2.kit[slot];
    A.armFromRack(d, g2.id);
    held.push(`armFromRack on a man carrying a NAMED piece: ${g2.kit[slot]===was ? "left it alone" : `TOOK IT — ${was} became ${g2.kit[slot]}`}`);
    /* the control: the path the game is built around refuses, and says so in its own source */
    const w3 = men[1].kit[slot];
    men[1].named = { slot, title:"Probe's Third", made:1 };
    A.equipOne(d, men[1].id, slot, id);
    held.push(`equipOne on a man carrying a NAMED piece (the control): ${men[1].kit[slot]===w3 ? "refused, as documented" : "TOOK IT"}`);
  }

  /* ---- ARM 4c: WHAT BECOMES OF A PIECE THAT BREAKS — #152 ----
     The steel-keeping cluster is twelve functions no check reaches, and every one of them counts
     what the house OWNS: `rackUsed` fills the room from `d.gear`, `rackRent` charges 4d a week for
     every piece past the cap, `gearUpkeep` bills `kitKeepOf` on each. So what `d.gear` says after a
     sword snaps is not bookkeeping, it is the price of the room. `wearKit`'s break path reads:

         const spare = defaultKit(g.cls)[s];
         g.kit[s] = (GEAR[spare] && gearFree(d, spare) > 0) ? spare : BARE[s];
         g.wear[s] = 100;

     — the man is re-armed and nothing else is said. This drives a break directly, with the game's
     own chronicle line as the witness rather than a detector of mine (`steel`'s head records that a
     hand-rolled break detector undercounts by 60%), and then asks the three questions the cluster
     turns on: does the house still own it, does the room still hold it, and can somebody else pick
     it up. */
  const broke = [];
  {
    const { d, buy } = stocked("break");
    const men = A.activeG(d);
    const id = buy.find(x=>A.GEAR[x].slot === "weapon") || buy[0];
    const slot = A.GEAR[id].slot;
    A.equipOne(d, men[0].id, slot, id);
    const ownedWas = d.gear[id], freeWas = A.gearFree(d, id), usedWas = A.rackUsed(d);
    const keepWas = A.gearUpkeep(d);
    broke.push(`before: the house owns ${ownedWas} ${A.GEAR[id].name}, ${A.gearUsed(d,id)} worn, `
      + `${freeWas} free · the room holds ${usedWas} of ${A.rackCap(d)} · upkeep ${keepWas}d a week`);
    /* one point of condition left, then one bout's worth of wear — the game breaks it, not the probe */
    men[0].wear[slot] = 1;
    let fired = 0;
    for(let i=0;i<40 && men[0].kit[slot]===id;i++){ A.wearKit(d, men[0], true); fired++; }
    const line = [...(d.log||[]), ...(d.kept||[])].some(L=>(L.text||"").includes("finally goes"));
    broke.push(`the game's own line "finally goes" was written: ${line} (after ${fired} bouts of wear)`);
    broke.push(`after: he carries ${A.GEAR[men[0].kit[slot]] ? A.GEAR[men[0].kit[slot]].name : "nothing"}`
      + ` · the house owns ${d.gear[id]||0} · ${A.gearUsed(d,id)} worn · ${A.gearFree(d,id)} free`
      + ` · the room holds ${A.rackUsed(d)} · upkeep ${A.gearUpkeep(d)}d a week`);
    /* AND THE QUESTION THE WHOLE CLUSTER TURNS ON, asked properly.
       The house owns three of this kind, so arming a second man after one broke is correct and
       proves nothing. Break the LAST one and then ask: a house that owns none of a piece must not
       be able to put it on anybody. */
    while((d.gear[id]||0) > 0){
      const g2 = A.activeG(d).find(x=>x.kit[slot] !== id);
      if(!g2 || !A.equipOne(d, g2.id, slot, id)) break;
      g2.wear[slot] = 1;
      for(let i=0;i<40 && g2.kit[slot]===id;i++) A.wearKit(d, g2, true);
    }
    broke.push(`every one of them broken: the house owns ${d.gear[id]||0} · ${A.gearUsed(d,id)} worn`
      + ` · ${A.gearFree(d,id)} free · the room holds ${A.rackUsed(d)}`);
    const took = A.equipOne(d, men[1].id, slot, id);
    broke.push(`a man asks for one anyway: ${took ? `HE GETS IT, at condition ${A.wearOf(men[1], slot)} — out of a rack that holds none` : "refused, as it must be"}`);
    const off = audit(d).bad;
    broke.push(`the ledger: ${off.length ? off.map(b=>`${b.id} owned ${b.owned} worn ${b.worn} racked ${b.racked}`).join(" · ") : "owned = worn + racked, every kind"}`);
  }

  /* ---- ARM 5: `dropKit`, and the eight-kit cap ---- */
  const kitCap = [];
  {
    const { d } = stocked("drop");
    const men = A.activeG(d);
    /* `saveKit` dedupes by NAME (`cls · weapon`), so twelve saves of six classes is six kits and says
       nothing about the eight-kit cap. Vary the WEAPON as well to get twelve distinct names. */
    const wp = Object.keys(A.GEAR).filter(id=>A.GEAR[id].slot === "weapon").slice(0, 12);
    for(let i=0;i<12;i++){
      men[0].cls = ["Murmillo","Thraex","Retiarius","Secutor","Hoplomachus","Provocator"][i%6];
      men[0].kit = Object.assign({}, men[0].kit, { weapon: wp[i % wp.length] });
      A.saveKit(d, men[0].id);
    }
    kitCap.push(`saved 12 loadouts under ${new Set((d.kits||[]).map(k=>k.name)).size} distinct names, the book holds ${(d.kits||[]).length} (the cap in saveKit is 8)`);
    const k = (d.kits||[])[0];
    A.dropKit(d, k.id);
    kitCap.push(`dropped one, ${(d.kits||[]).length} left, the dropped id is ${(d.kits||[]).some(x=>x.id===k.id)?"STILL THERE":"gone"}`);
    A.dropKit(d, 999999);
    kitCap.push(`dropping an id that was never there leaves ${(d.kits||[]).length}`);
  }

  /* ---- ARM 6: `repay` ---- */
  const loan = [];
  {
    const d = A.newGameState("Lo", "clean", `${SEED}-loan`, null);
    d.gold = 20000;
    A.borrow(d, "murena", 99999);
    const start = A.owes(d), principal = d.loan.principal;
    loan.push(`borrowed: principal ${principal}, owed ${start}, gold ${Math.round(d.gold)}`);
    const g0 = d.gold, paid = A.repay(d, 500);
    loan.push(`repay(500) returned ${paid}, owed ${A.owes(d)}, gold moved ${Math.round(g0 - d.gold)}`);
    const over = A.repay(d, 999999);
    loan.push(`repay(999999) returned ${over}, owed ${A.owes(d)}, the loan is ${d.loan ? "STILL OPEN" : "closed"}, gold ${Math.round(d.gold)}`);
    const after = A.repay(d, 100);
    loan.push(`repay(100) with nothing owed returned ${after}, gold ${Math.round(d.gold)}`);
    /* and it must not foreclose a house that has paid */
    const d2 = A.newGameState("Lo2", "clean", `${SEED}-loan2`, null);
    d2.gold = 20000; A.borrow(d2, "murena", 99999);
    for(let w=0; w<60 && !d2.over; w++){ A.repay(d2, 200); window.__ROPE.lanista(d2); }
    loan.push(`a house that repays 200 a week for 60 weeks: owed ${A.owes(d2)}, loan ${d2.loan?"open":"closed"}, ended ${d2.over?d2.over.kind:"alive"}`);
  }

  /* ---- ARM 7: `startPlan` / `breakPlan` ---- */
  const season = [];
  {
    const d = A.newGameState("Se", "clean", `${SEED}-plan`, null);
    d.gold = 20000;
    const g = A.activeG(d)[0];
    const k = Object.keys(A.PLANSEASON)[0];
    const started = A.startPlan(d, g, k);
    season.push(`startPlan("${k}") returned ${JSON.stringify(started)} · seasonOfMan ${A.seasonOfMan(g) ? "set" : "NOT SET"} · regimen "${g.regimen}"`);
    for(let w=0;w<4;w++) window.__ROPE.lanista(d);
    const g2 = d.gladiators.find(x=>x.id===g.id);
    season.push(`four weeks on: seasonOfMan ${A.seasonOfMan(g2) ? "still set" : "gone"} · regimen "${g2.regimen}"`);
    const broke = A.breakPlan(d, g2, "probe");
    season.push(`breakPlan returned ${JSON.stringify(broke)} · seasonOfMan ${A.seasonOfMan(g2) ? "STILL SET" : "cleared"} · regimen "${g2.regimen}"`);
    const again = A.breakPlan(d, g2, "probe");
    season.push(`breakPlan on a man with no season returned ${JSON.stringify(again)}`);
    const re = A.startPlan(d, g2, k);
    season.push(`startPlan again after breaking returned ${JSON.stringify(re)} · seasonOfMan ${A.seasonOfMan(g2) ? "set" : "NOT SET"}`);
  }

  return { rows, tale, held, broke, kitCap, loan, season };
}, [REPS, SEED]);

console.log(`\n  THE STEEL LEDGER — owned must equal worn plus racked, ${REPS} passes per arm · seed "${SEED}"\n`);
for(const r of out.rows){
  console.log(`  ${r.arm.padEnd(20)} ${String(r.calls).padStart(5)} calls that changed something`
    + `   ->   ${r.bad.length ? `${r.bad.length} PIECE KINDS OUT OF BALANCE` : "ledger balances"}${r.note?` · ${r.note}`:""}`);
  for(const b of r.bad.slice(0,6))
    console.log(`      ${String(b.id).padEnd(14)} owned ${String(b.owned).padStart(3)} · worn ${String(b.worn).padStart(3)} · racked ${String(b.racked).padStart(3)}  (${b.off>0?"+":""}${b.off})`);
  if(r.bad.length > 6) console.log(`      ... and ${r.bad.length-6} more`);
  /* the ledger is printed even when it balances — "no imbalance" is only news if the arm actually
     moved wearing steel about, and an arm that quietly touched nothing reads identically otherwise */
  const kinds = Object.entries(r.seen);
  console.log(`      ledger, every wearing kind the house owns: `
    + (kinds.length ? kinds.map(([id,v])=>`${id} ${v.owned}=${v.worn}w+${v.racked}r`).join(" · ") : "the house owns no wearing steel at all"));
}
console.log(`\n  WHAT A SAVED KIT DOES TO A PIECE'S CONDITION:`);
for(const t of out.tale) console.log(`    ${t}`);
console.log(`\n  THE PIECE THAT IS NOT GOING BACK ON THE RACK:`);
for(const t of out.held) console.log(`    ${t}`);
console.log(`\n  WHAT BECOMES OF A PIECE THAT BREAKS:`);
for(const t of out.broke) console.log(`    ${t}`);
console.log(`\n  THE KIT BOOK:`);
for(const t of out.kitCap) console.log(`    ${t}`);
console.log(`\n  REPAY:`);
for(const t of out.loan) console.log(`    ${t}`);
console.log(`\n  THE SEASON, STARTED AND BROKEN:`);
for(const t of out.season) console.log(`    ${t}`);

await browser.close(); server.close();
