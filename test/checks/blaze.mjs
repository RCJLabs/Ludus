/* #131's second piece, and the second thing a great house can lose. Measured over 288 house-runs
   with zero exceptions: no house ever lost a room — the estate table marks rooms and patrons as the
   two things a year-12 house holds that a week-one house does not, the patron went in v3.27.0, and
   the fire is the other half. It takes the TOP LEVEL of one built-up wing, never the wing itself,
   so nothing that reads a room's PRESENCE (the staff rooms, the charter, the lessons) loses its
   footing; the rebuild is `buildUp` at the price the level always cost, which is a real purchase in
   the era the catalogue count measured as out of them.

   The gates are the patron piece's three lessons, held here so they cannot drift:
   · LATE BY THE ESTATE'S OWN CLOCK — ROOM_FIRE_LEVELS built levels before there is anything to
     burn, so a young house cannot be touched (the first patron draft gutted houses at week 60-86
     and `policy` read five subsystems dark).
   · A GAP — ROOM_FIRE_GAP weeks between fires, because `patronOld` with no gap took one man after
     another until the house was all strangers.
   · A LOSS, NOT A WOUND — one level, whichever door is taken; the choice trades the men's bodies
     against the stores, the way the pyre traded coin against the heir's opinion. */
export const name = "blaze";
export const describe = "the fire takes one floor of a big house, never a wing, never a young house, and the level rebuilds at its own price";

export async function run({ p }){
  const has = await p.evaluate(() => !!window.__LVDVS);
  if(!has)
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const mk = d => A.EVENTS.roomFire.make(d);
    const logHas = (d, s) => [...(d.log||[]), ...(d.kept||[])].some(L=>(L.text||"").includes(s));

    /* ---- 1. a young house cannot burn ---- */
    {
      const d = A.newGameState("Bz", "clean", "BLAZE-1", null);
      if(A.roomAblaze(d)) bad.push(`a founding house (${A.bLevels(d)} levels) offered a room to burn`);
      if(mk(d)) bad.push("the event built itself for a founding house");
      d.buildings = { valetudinarium:2, palus:2, carceres:2, balneae:1 };   /* 7 levels — one short */
      if(mk(d)) bad.push(`the event fired at ${A.bLevels(d)} levels, under ROOM_FIRE_LEVELS ${A.ROOM_FIRE_LEVELS}`);
      d.buildings.balneae = 2;                                             /* 8 — the estate bar */
      if(!mk(d)) bad.push(`the event would not fire at ${A.bLevels(d)} levels with rooms at 2`);
      else lines.push(`fires at ${A.ROOM_FIRE_LEVELS} built levels and not at ${A.ROOM_FIRE_LEVELS-1}`);
    }

    /* ---- 2. the pigeonhole the gate leans on: 8 levels over 5 wings always has a floor to lose ---- */
    {
      const d = A.newGameState("Bz2", "clean", "BLAZE-2", null);
      let holes = 0;
      for(const b of [ {valetudinarium:4,armamentarium:1,palus:1,carceres:1,balneae:1},
                       {valetudinarium:2,armamentarium:2,palus:2,carceres:1,balneae:1},
                       {valetudinarium:2,armamentarium:2,palus:2,carceres:2,balneae:2} ]){
        d.buildings = b;
        const k = A.roomAblaze(d);
        if(!k || (d.buildings[k]||0) < 2) holes++;
      }
      if(holes) bad.push(`${holes} of 3 eight-level estates offered no room at level 2+ — the estate bar no longer implies an eligible wing`);
      else lines.push("every 8-level estate offers a wing with an upper floor, whatever its shape");
    }

    /* ---- 3. the gap: fires do not chain ---- */
    {
      const d = A.newGameState("Bz3", "clean", "BLAZE-3", null);
      d.buildings = { valetudinarium:2, armamentarium:2, palus:2, carceres:1, balneae:1 };
      d.week = 200; d.flags.roomBurned = 200 - (A.ROOM_FIRE_GAP - 1);
      if(mk(d)) bad.push(`a second fire built itself ${A.ROOM_FIRE_GAP-1} weeks after the first, inside the ${A.ROOM_FIRE_GAP}-week gap`);
      d.flags.roomBurned = 200 - A.ROOM_FIRE_GAP;
      if(!mk(d)) bad.push("the gap over, the event still would not fire");
      else lines.push(`the gap holds at ${A.ROOM_FIRE_GAP} weeks and opens after it`);
    }

    /* ---- 4. stand back: the floor goes, the stores go whole, the yard is untouched and told ---- */
    {
      const d = A.newGameState("Bz4", "clean", "BLAZE-4", null);
      d.buildings = { valetudinarium:4, armamentarium:1, palus:1, carceres:1, balneae:1 };
      d.week = 150; d.gold = 5000;
      const ev = mk(d);
      if(!ev){ bad.push("no event to run the stand-back door on"); }
      else {
        const goldWas = d.gold, unrestWas = d.unrest, fatWas = A.activeG(d).map(g=>g.fatigue||0);
        A.EVENTS.roomFire.run(d, ev, 1);
        if(d.buildings[ev.data.k] !== 3) bad.push(`stand back: the ${ev.data.k} read level ${d.buildings[ev.data.k]}, not 3 — the loss must be exactly one floor`);
        if(Math.round(goldWas - d.gold) !== ev.data.stores) bad.push(`stand back: the stores cost ${Math.round(goldWas-d.gold)}d against the ${ev.data.stores}d the event named`);
        if(d.unrest <= unrestWas) bad.push("stand back: the men watched the house burn and unrest did not move");
        if(A.activeG(d).some((g,i)=>Math.abs((g.fatigue||0)-fatWas[i]) > 0.01)) bad.push("stand back: nobody went in, and somebody's fatigue moved anyway");
        if(!d.flags.roomBurned) bad.push("the firing did not stamp d.flags.roomBurned — the reachability probe counts off it, and the chronicle rolls");
        if(!logHas(d, "burned in the night")) bad.push("no chronicle line carries the fire");
        if(!bad.length) lines.push(`stand back: one floor and ${ev.data.stores}d of stores, nobody hurt, the line written`);
      }
    }

    /* ---- 5. send the yard in: the floor still goes, most stores come out, the men pay for it ---- */
    {
      const d = A.newGameState("Bz5", "clean", "BLAZE-5", null);
      d.buildings = { valetudinarium:4, armamentarium:1, palus:1, carceres:1, balneae:1 };
      d.week = 150; d.gold = 5000;
      const ev = mk(d);
      if(!ev){ bad.push("no event to run the fight door on"); }
      else {
        const goldWas = d.gold, fatWas = A.activeG(d).map(g=>g.fatigue||0);
        A.EVENTS.roomFire.run(d, ev, 0);
        const paid = Math.round(goldWas - d.gold), quarter = Math.round(ev.data.stores*0.25);
        if(d.buildings[ev.data.k] !== 3) bad.push(`fight: the floor survived — the loss is certain and the choice is only what it costs around it`);
        if(paid !== quarter) bad.push(`fight: the saved stores cost ${paid}d against the quarter (${quarter}d) the aftermath describes`);
        if(!A.activeG(d).every((g,i)=>(g.fatigue||0) > fatWas[i])) bad.push("fight: the whole yard went in and somebody's fatigue did not move");
        if(!bad.length) lines.push(`fight: the floor goes anyway, a quarter of the stores (${quarter}d), and every man pays in fatigue`);
      }
    }

    /* ---- 6. never the wing, and the rebuild is the game's own ---- */
    {
      const d = A.newGameState("Bz6", "clean", "BLAZE-6", null);
      d.buildings = { valetudinarium:1, armamentarium:1, palus:1, carceres:1, balneae:1 };
      if(A.roomBurns(d, "palus") !== false || d.buildings.palus !== 1)
        bad.push("a level-1 wing burned to nothing — presence is load-bearing (staff rooms, charter, lessons) and the fire must never take it");
      d.buildings = { valetudinarium:3, armamentarium:1, palus:1, carceres:1, balneae:1 };
      const b = A.roomBurns(d, "valetudinarium");
      if(!b || d.buildings.valetudinarium !== 2) bad.push("the burn did not take exactly one level");
      else {
        const price = A.BUILDINGS.valetudinarium.cost[2];
        if(b.rebuild !== price) bad.push(`the burn quotes ${b.rebuild}d to rebuild against the table's ${price}d`);
        d.gold = price + 100;
        A.buildUp(d, "valetudinarium");
        if(d.buildings.valetudinarium !== 3) bad.push("buildUp would not restore the burned floor");
        else if(Math.round(price + 100 - d.gold) !== price) bad.push(`the rebuild charged ${Math.round(price+100-d.gold)}d against the table's ${price}d`);
        else lines.push(`never below level 1, and the burned floor rebuilds through buildUp at its own ${price}d`);
      }
    }

    return { bad, lines };
  });

  return { pass: out.bad.length===0,
    why: out.bad.length ? out.bad.join("; ") : null,
    lines: out.lines };
}
