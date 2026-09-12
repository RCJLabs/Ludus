/* WHAT THE GATE AT THE END OF THE STREET ACTUALLY BUYS — #273

   (`walls` was free in BOTH directories; checked before writing.)

   #273: "What does `yard` actually buy? Read `EVENTS.yard.run` and every reader of what it sets ...
   this is the whole item until it is answered."

   ---- ANSWERED: A ONE-OFF ROSTER PURCHASE, NO FACILITY ----
   `EVENTS.yard.run` delegates to `buyYard`, which buys a dead rival's LINEAGE and pushes his men
   into the cells you already have, capped by `rosterFull`, with whoever does not fit sold on at the
   gate for half `gladValue`. `offerYard`'s own comment says it outright: **"Phase 3 would be the
   second yard that holds them; without it they are sold on at the gate."**

   EVERY READER OF WHAT IT SETS, which is what the item asked for:

     d.flags.yardsTaken   LIVE — a new rival arrives warier (`grudge + ri(8,18)`, `watchful`) and
                          two chronicle lines name how many gates on the street are yours
     h.lineage.sold       LIVE — the offer gate, `lastDark`, the newcomer's inheritance
     g.fromYard           WRITTEN ONCE, READ NOWHERE — one hit in the whole file
     h.lineage.soldAt     WRITTEN ONCE, READ NOWHERE — one hit in the whole file

   ---- AND MEASURING IT FOUND SOMETHING WORSE THAN THE MISSING FACILITY ----
   `probes/walls.mjs`, 24 houses x 520 weeks. Three policies, and each fails to reach the purchase
   for its own reason — which is why a single arm would have said "it never happens" and stopped:

     reference          5 offer-weeks, 0 taken   — a poor house cannot raise the price
     complete + tour   49 dark weeks, 0 OFFERED  — `offerYard` refuses away, and `lineage.asked`
                                                   is set on the first ask and then refuses for
                                                   ever, so the one window falls while he is away
     complete at home  16 offer-weeks, 2 TAKEN

   And of those two purchases: **both at cap 4 against a roster of 4, and ZERO men arrived.** Every
   man of both houses went straight back out at the gate. The letter named `y.men` of his men and
   `y.worth` denarii of fighting men, quoted 2,803, and said nothing about the only number that
   decided what the buyer got.

   THIS RELEASE DOES NOT BUILD THE FACILITY. The item calls it "the largest state change since the
   domus" and its own Risk note says not to open the build without the verify-first; the measurement
   then sized the hole at **3 men across 24 houses in 520 weeks**. What ships is the number, said
   before the coin changes hands.

   FOUR ARMS. */
import { hasHandle } from "../harness.mjs";

export const name = "walls";
export const describe = "the dark yard's letter says how many of his men your cells can actually hold";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["yardRoom","yardSays","cellsCap","rosterCount","rosterFull","buyYard","EVENTS",
      "newGameState","genGladiator"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

    const house = (seed, men)=>{
      const d = A.newGameState("Wl","clean",seed,null);
      d.gold = 60000; d.week = 80; d.favor = 90;
      d.gladiators = [];
      for(let i=0;i<men;i++){ const m = A.genGladiator(d, 60); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.fatigue=0; m.lastFought=-9; d.gladiators.push(m); }
      return d;
    };
    const offerOf = (men, worth)=>({ house:"Solonius", lan:"Gaius", price:2800, favour:30,
      men, worth:worth==null?4000:worth, walls:900, endedAs:"fond" });

    /* ---- 1. the arithmetic, across the whole range ---- */
    const probe = house("WL_CAP", 0);
    const cap = A.cellsCap(probe);
    const rows = [];
    for(const standing of [0, Math.max(0, cap-2), cap]){
      const d = house("WL_" + standing, standing);
      for(const men of [0, 1, 6]){
        const r = A.yardRoom(d, offerOf(men));
        rows.push({ standing, men, cap:r.cap, room:r.room, fit:r.fit, spill:r.spill,
          say:A.yardSays(d, offerOf(men)) });
      }
    }

    /* ---- 2. and the arithmetic is the loop's own answer, driven ---- */
    const drive = (standing, men)=>{
      const d = house("WL_D" + standing + "_" + men, standing);
      /* a dark house with `men` fighters standing in it */
      const h = { name:"Solonius", retired:true, fame:200, grudge:0, fighters:[] };
      for(let i=0;i<men;i++){ const f = A.genGladiator(d, 55); f.id = 90000+i; f.name = "Man"+i; h.fighters.push(f); }
      h.lineage = { name:"Gaius", house:"Solonius", fame:200, purse:0, men, worth:1000, walls:900, endedAs:"fond" };
      d.rivals = [h];
      const y = { house:"Solonius", lan:"Gaius", price:2800, favour:30, men, worth:1000, walls:900, endedAs:"fond" };
      const said = A.yardSays(d, y), room = A.yardRoom(d, y);
      const before = A.rosterCount(d);
      const took = A.buyYard(d, true, y);
      const arrived = (d.gladiators||[]).filter(g=>g.fromYard).length;
      return { standing, men, said, promised:room.fit, arrived, took:!!took,
        before, after:A.rosterCount(d), cap:room.cap };
    };
    const driven = [drive(0, 3), drive(cap, 3), drive(Math.max(0,cap-1), 3)];

    /* ---- 3. the letter carries it ---- */
    const letter = (()=>{
      const d = house("WL_LET", cap);
      d.askYard = offerOf(5);
      d.pendingEvent = null;
      try { A.raiseQueued ? A.raiseQueued(d) : null; } catch(e){}
      /* the queue-raiser is inside endWeek; build the note the same way the site does */
      return { note:A.yardSays(d, d.askYard), cap:A.cellsCap(d), standing:A.rosterCount(d) };
    })();

    return { cap, rows, driven, letter, full:A.rosterFull(house("WL_F", cap)) };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };

  const lines = [], fails = [];
  lines.push(`cellsCap on a fresh house: ${out.cap} · rosterFull at ${out.cap}: ${out.full}`);
  lines.push("what the letter would say:");
  for(const r of out.rows)
    lines.push(`   ${String(r.standing).padStart(2)} standing, ${r.men} offered → fit ${r.fit}, spill ${r.spill} — ${r.say.slice(0,96)}`);
  lines.push("and what the purchase actually delivers:");
  for(const d of out.driven)
    lines.push(`   ${d.standing} standing of ${d.cap}, ${d.men} offered → promised ${d.promised}, ARRIVED ${d.arrived} (roster ${d.before}→${d.after})`);

  /* ---- 1. the arithmetic ---- */
  for(const r of out.rows){
    if(r.fit + r.spill !== r.men) fails.push(`${r.men} offered split into ${r.fit} + ${r.spill}`);
    if(r.fit > r.room) fails.push(`${r.fit} said to fit into ${r.room} of room`);
    if(!r.say) fails.push(`no line at all for ${r.standing} standing and ${r.men} offered`);
  }

  /* ---- 2. THE PROMISE IS THE LOOP'S OWN ANSWER — the whole of this release ---- */
  for(const d of out.driven){
    if(!d.took) { fails.push(`the purchase at ${d.standing} standing was refused, so this arm proves nothing`); continue; }
    if(d.arrived !== d.promised)
      fails.push(`the letter promised ${d.promised} of his ${d.men} would fit and ${d.arrived} arrived — ` +
        `\`yardRoom\` and \`buyYard\`'s own \`rosterFull\` loop have to give the same answer, or the number ` +
        `is worse than no number`);
  }
  { const full = out.driven.find(x=>x.standing === out.cap);
    if(full && full.arrived !== 0)
      fails.push(`a house at its cap took a yard and ${full.arrived} men arrived — \`rosterFull\` should refuse every one`);
    if(full && !/full|not one/i.test(full.said))
      fails.push(`a house at its cap is not told its cells are full: "${full.said}"`); }

  /* ---- 3. the letter carries the number, not just the prose ---- */
  if(!out.letter.note) fails.push("the offer letter carries no note at all");
  else {
    if(!new RegExp(`(?<![0-9])${out.letter.cap}(?![0-9])`).test(out.letter.note))
      fails.push(`the letter does not name the ${out.letter.cap} its cells hold — "${out.letter.note}"`);
    if(!/gate|full|room|fit/i.test(out.letter.note))
      fails.push(`the letter's note says nothing about what becomes of the men: "${out.letter.note}"`);
  }

  /* ---- 4. and an empty yard is said to be empty ---- */
  { const none = out.rows.find(r=>r.men === 0);
    if(none && !/nobody|walls/i.test(none.say))
      fails.push(`a yard with no men left in it reads "${none.say}"`); }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
