/* THE SHELF, AND WHICH OF ITS FOUR SYSTEMS IS ACTUALLY DARK

   Audit item #220: "A shelf of systems a long run never meets: gambits 0, courts 0, pacts 1,
   prisoner lots 2 — in sixteen runs. Some of that is policy (rope), but a system reachable only
   off-policy for eight years is dark by construction. Recommend wiring them into the arc that is
   always on — the feud (79% of weeks): the rival's schemes should offer the gambit, the court
   case, the pact as answers, instead of those living parallel and untouched."

   FOUR NUMBERS, FOUR DIFFERENT CAUSES. One count cannot tell "the game never mentions this" from
   "the rope has no button for it", so `probes/shelf.mjs` asks three questions of each — how many
   weeks it was AVAILABLE, how many the game SURFACED it, how many it was TAKEN. 16 houses x 300
   weeks, the default rope:

     gambit   available 94.2%  ·  surfaced **0%**  ·  taken 0
     court    available 49.2%  ·  surfaced 15.1%   ·  taken 0
     pact     available  8.9%  ·  surfaced  1.2%   ·  **taken 34** across 16 houses
     lot      available  6.2%  ·  surfaced  6.2%   ·  taken 0

   THREE OF THE FOUR ARE NOT DARK. The pact arrives on its own as a `pendingEvent` — the loudest
   thing in the game — and was taken twice a house, against the item's "1 in sixteen runs". The
   court is already offered by `agendaCan`, on the gap v2.63.1 chose over "a rival's man is better
   than yours" (which stood in 36% of weeks). The lot is surfaced on **100% of the weeks it
   exists** — its rarity is the WAR's rarity, 12.1% of weeks. Their zeroes were this suite's rope
   having no way to say yes; `court`, `lot` and `gambit` are levers now, opt-in like `rites`, and
   land 94 courts, 4 lots and 135 gambits when asked.

   ONE OF THE FOUR IS EXACTLY WHAT THE ITEM SAYS. A gambit is affordable and off cooldown on 94.2%
   of weeks and nothing in the game had ever pointed at one — no agenda row, no event, no mark.

   AND THE ARC IT WANTED TO HANG IT ON IS NOT 79%. Counted apart: a named nemesis FIGHTER stands on
   93.3% of weeks, a named house feud on 33%, a rival holding a grudge of 65 on 6.4%, and a rival
   with money in front of one of your men on 2.6%. A door on the 93% arc is the permanent nag #229
   was opened against, so it goes on the ACT — and it folds into the poach line that was already
   there rather than adding a second row about the same injury. Measured after: 5.8% of weeks.

   FIVE ARMS:
   1 · THE DOOR OPENS ON AN ACT and stays shut otherwise.
   2 · AND IT NAMES A NUMBER THE ENGINE WILL ROLL — the trick, its price and `gambitOdds`, not a
       second copy of any of them (#150).
   3 · THE POACH WARNING SURVIVED. A house with an empty box still hears that its man is being
       bought; the answer is what is conditional, not the news.
   4 · THE OTHER THREE ARE NOT DARK — the court offered, the pact arriving on its own, the lot
       surfaced on every week it exists.
   5 · AND THE ROPE CAN SAY YES to all three now, which is what the item's zeroes were. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "answer";
export const describe = "a house that moves on you is answerable, and the week's list says with what";
export const slow = true;   /* plays houses under three policies */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"ANSWER-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","agenda","answerRow","GAM_ACCOUNT","GAMBITS","GAM_KEYS","gambitOdds",
                  "gambitReady","peacePrice","poachedMan","startPoach","weeklyBill","activeG",
                  "rosterFull","startCourt","buyLot","runGambit","PACTS"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const bad = [];

    /* ---- 1, 2, 3, 4: one played sweep, three policies ---- */
    const sum = { weeks:0, moved:0, quiet:0, spoke:0, spokeMoved:0, spokeQuiet:0,
      poachWeeks:0, poachSpoke:0, poachBroke:0, agendaHit:0, agendaMiss:0,
      offBox:0, boxed:0, courtSaid:0, lotHave:0, lotSaid:0, pactEvent:0, pactTaken:0,
      took:{ court:0, lot:0, gambit:0 } };
    for(const [opts, houses, weeks] of [[{}, 5, 160], [{ court:true, lot:true }, 4, 160],
                                        [{ gambit:6 }, 3, 140]]){
      for(let h = 0; h < houses; h++){
        const d = A.newGameState(`ANSWER-${JSON.stringify(opts).length}-${h}`, "clean",
          `ANSWER-${JSON.stringify(opts).length}-${h}`);
        let court = null, gam = 0, lots = 0, pact = null;
        for(let w = 0; w < weeks && !d.over; w++){
          sum.weeks++;
          const pg = A.poachedMan(d);
          const top = (d.rivals||[]).filter(x=>!x.retired)
            .reduce((m,x)=>Math.max(m, x.grudge||0), 0);
          const moved = !!pg || top >= A.GAM_ACCOUNT;
          if(moved) sum.moved++; else sum.quiet++;
          if(pg) sum.poachWeeks++;

          const row = A.answerRow(d);
          if(row){
            sum.spoke++;
            if(moved) sum.spokeMoved++; else sum.spokeQuiet++;
            if(pg) sum.poachSpoke++;
            /* ---- 2. the figure on the row is the engine's own ---- */
            if(row.gambit){
              sum.boxed++;
              const G = A.GAMBITS[row.gambit];
              const cost = typeof G.cost === "function" ? G.cost(d) : G.cost;
              if(row.cost !== cost || Math.abs(row.odds - A.gambitOdds(d, row.gambit)) > 1e-9){
                sum.offBox++;
                if(sum.offBox === 1) bad.push(`the week's list offers "${row.gambit}" at ${row.cost}d `
                  + `and ${Math.round(row.odds*100)} in the hundred where the engine would charge `
                  + `${cost} and roll ${Math.round(A.gambitOdds(d,row.gambit)*100)} (#150)`);
              }
              if(!(new RegExp(String(row.cost)).test(row.sub)) ||
                 !(new RegExp(String(Math.round(row.odds*100))).test(row.sub)))
                bad.push(`the row means ${row.cost}d at ${Math.round(row.odds*100)} and prints `
                  + `"${row.sub}"`);
            }
            /* ---- and it reaches the list the player actually reads ---- */
            let rows = null; try { rows = A.agenda(d); } catch(e){}
            if(rows && rows.some(x=>x.label === row.label && x.sub === row.sub)) sum.agendaHit++;
            else { sum.agendaMiss++;
              if(sum.agendaMiss === 1) bad.push(`answerRow built "${row.label}" and the agenda does `
                + `not carry it`); }
          } else if(pg){
            sum.poachBroke++;
            bad.push(`a rival is buying ${pg.name} and the week's list says nothing at all — that `
              + `warning predates the answer and must not depend on being able to afford one`);
          }

          /* ---- 4. the other three ---- */
          let rows2 = null; try { rows2 = A.agenda(d); } catch(e){}
          const text = (rows2||[]).map(x=>`${x.label||""} ${x.sub||""}`).join(" | ");
          if(/put a word in his ear|could be got at|is being talked to/i.test(text)) sum.courtSaid++;
          if(d.powLot){ sum.lotHave++;
            let sig = ""; try { sig = A.tabSig(d, "market") || ""; } catch(e){}
            if(/lot\d/.test(String(sig))) sum.lotSaid++; }
          if(d.pendingEvent && d.pendingEvent.id === "pact") sum.pactEvent++;
          if(d.pact && d.pact.began !== pact){ sum.pactTaken++; pact = d.pact.began; }
          if(!d.pact) pact = null;

          /* ---- 5. what the rope managed to say yes to ---- */
          if(d.court && d.court.name !== court){ sum.took.court++; court = d.court.name; }
          if(!d.court) court = null;
          const gc = Object.values(d.gambits||{}).reduce((x,y)=>x+y, 0);
          if(gc > gam){ sum.took.gambit += gc - gam; gam = gc; }
          const lg = (d.log||[]).filter(l=>/take the whole lot off/.test(String((l&&l.text)||l||""))).length;
          if(lg > lots){ sum.took.lot += lg - lots; lots = lg; }

          try { R.lanista(d, opts); } catch(e){ break; }
        }
      }
    }

    /* vacuity and the shape of the door */
    if(sum.weeks < 500) bad.push(`only ${sum.weeks} weeks played`);
    if(!sum.moved) bad.push(`no house was ever moved on — arm 1 measured nothing`);
    if(!sum.spoke) bad.push(`the week's list never once offered an answer across ${sum.weeks} weeks`);
    if(sum.spokeQuiet > sum.quiet * 0.02)
      bad.push(`the list offers an answer on ${sum.spokeQuiet} of ${sum.quiet} weeks where nobody `
        + `has moved on the house — that is the nag, not a door`);
    if(sum.spokeMoved < sum.moved * 0.25)
      bad.push(`only ${sum.spokeMoved} of ${sum.moved} weeks with a house at your throat carry an `
        + `answer — the door is shut on the arc it was cut for`);
    if(!sum.boxed) bad.push(`no row ever named a trick — arm 2 measured nothing`);
    if(!sum.poachWeeks) bad.push(`no poach came up — arm 3 measured nothing`);
    if(sum.poachSpoke !== sum.poachWeeks)
      bad.push(`${sum.poachWeeks - sum.poachSpoke} poach weeks passed without a line`);
    if(sum.lotHave && sum.lotSaid !== sum.lotHave)
      bad.push(`a war lot stood on ${sum.lotHave} weeks and the market tab marked it on ${sum.lotSaid}`);
    if(!sum.courtSaid) bad.push(`the court was never offered — the item says it is dark and the `
      + `agenda is supposed to disagree`);
    if(!sum.pactEvent) bad.push(`no pact was ever offered across ${sum.weeks} weeks`);
    for(const k of ["court","gambit"])
      if(!sum.took[k]) bad.push(`the rope has no working \`${k}\` lever — ${k}s read 0 for want of a `
        + `button, which is what #220's zeroes were`);
    /* ---- 3b. AND THE WARNING DOES NOT NEED THE HOUSE TO EXIST ----
       `glance` plants a poach by a house that is not on the board — a rival can retire or be wound
       up while its offer is still out — and the line it replaced never needed the house object.
       The first draft of `answerRow` returned nothing there, and `glance` caught it. Held here too,
       at the function rather than three panels away. */
    { const d = A.newGameState("ANSWER-GHOST", "clean", "ANSWER-GHOST");
      for(let w = 0; w < 8 && !d.over; w++) R.lanista(d, {});
      const v = A.activeG(d)[0];
      if(v){
        d.poach = { house:"Nobodius", gid:v.id, weeks:3 };
        const row = A.answerRow(d);
        if(!row) bad.push(`a man is being bought by a house that is not on the board and the week's `
          + `list says nothing — the warning must not depend on finding the buyer`);
        else if(!/is being talked to/.test(row.label))
          bad.push(`the ghost-house poach reads "${row.label}"`);
        else if(/undefined|null|NaN/.test(`${row.label} ${row.sub}`))
          bad.push(`the ghost-house poach prints a broken lookup: "${row.label} · ${row.sub}"`);
      } }

    /* ---- 5b. THE LOT, ON A FIXTURE RATHER THAN ON LUCK ----
       A lot needs a war, cells with room and the price over the rope's reserve, and it stood on
       eleven weeks of a seven-hundred-week sweep. Holding the lever on that is holding a coin
       toss, so the lot is planted and the rope asked to take it. */
    let lot = null;
    { const d = A.newGameState("ANSWER-LOT", "clean", "ANSWER-LOT");
      for(let w = 0; w < 10 && !d.over; w++) R.lanista(d, {});
      /* room in the cells and coin well over any reserve */
      while(A.activeG(d).length > 2) A.activeG(d).slice(2).forEach(g=>{ g.status = "dead"; });
      d.gold = 60000;
      d.powLot = { n:3, price:400 };
      const before = (d.gladiators||[]).length;
      R.lanista(d, { lot:true });
      lot = { took: !d.powLot, gained: (d.gladiators||[]).length - before,
        said: (d.log||[]).some(l=>/take the whole lot off/.test(String((l&&l.text)||l||""))) };
      if(!lot.took || lot.gained <= 0)
        bad.push(`the rope has no working \`lot\` lever — a war lot of 3 at 400d in front of a `
          + `house with 60,000d and empty cells was left standing (took ${lot.took}, `
          + `${lot.gained} men)`);
      /* and it must not fire when the box cannot stand it */
      const e = A.newGameState("ANSWER-LOT2", "clean", "ANSWER-LOT2");
      for(let w = 0; w < 10 && !e.over; w++) R.lanista(e, {});
      e.gold = 10; e.powLot = { n:3, price:4000 };
      R.lanista(e, { lot:true });
      if(!e.powLot) bad.push(`the rope bought a 4,000d lot out of a box holding 10 denarii`);
      lot.refused = !!e.powLot; }

    return { bad, sum, lot };
  });

  if(r.miss) return { pass:false, why:`handle is missing ${r.miss.join(", ")}`, lines:[] };
  bad.push(...r.bad);
  const s = r.sum, pc = (a,b) => `${Math.round(a/Math.max(1,b)*1000)/10}%`;

  lines.push(`${s.weeks} weeks across three policies · a house had moved on ${s.moved} of them`);
  lines.push(`the door opened on ${s.spokeMoved} of ${s.moved} moved weeks (${pc(s.spokeMoved,s.moved)})`
    + ` and on ${s.spokeQuiet} of ${s.quiet} quiet ones (${pc(s.spokeQuiet,s.quiet)})`);
  lines.push(`${s.boxed} rows named a trick · ${s.offBox} quoted a price or an odds the engine `
    + `would not use · ${s.agendaHit} reached the agenda, ${s.agendaMiss} were dropped`);
  lines.push(`a rival was buying a man on ${s.poachWeeks} weeks and the list spoke on ${s.poachSpoke}`
    + ` (${s.poachBroke} silent)`);
  lines.push(`the other three: the court offered on ${s.courtSaid} weeks · ${s.pactEvent} pact `
    + `offers and ${s.pactTaken} taken · a lot stood on ${s.lotHave} weeks and was marked on ${s.lotSaid}`);
  lines.push(`and the rope's own levers land: ${s.took.court} courts, ${s.took.gambit} gambits, `
    + `${s.took.lot} lots in play — and on a planted lot it takes ${r.lot.gained} men and `
    + `${r.lot.refused ? "refuses" : "DOES NOT refuse"} one it cannot pay for`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
