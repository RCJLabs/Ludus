/* WHAT DOES THE TITLE BOUT ACTUALLY COST? — the primacy challenge as a real fight

   `EVENTS.primacy`'s "Make the match" branch was two `power()` calls against a pair of independent
   0.8-1.3 rolls, a comparison, and a paragraph about a bout nobody was shown. It was the last
   marquee moment in the game decided by a coin, and it was raised as a DESIGN decision rather than
   a defect because fixing it properly means the house can lose its champion to its own second man.

   It is a real bout now, through `simulateFight` at standard stakes with the appeal live. This
   prices what that costs, because "your best man can die here" is a sentence and not a number:

     1 · WHO WINS. The old coin was `pb*(0.8+R()*0.5) > pa*(0.8+R()*0.5)` — roughly a fair fight
         between two men whose power ratio is usually close, so about a coin. What the engine makes
         of the same two men is the first thing worth knowing, and whether the holder's title means
         anything at all against a challenger the gate says is his equal.
     2 · HOW OFTEN SOMEBODY DIES, and which one. The appeal is real, so the answer runs through
         `missioScore` — the house's own fame, favour, patron and street. A well-regarded house
         should bury fewer of them, and that is a claim to check rather than assume.
     3 · THE ASYMMETRY THE WRAPPER CORRECTS. `simulateFight` reads A's appeal off the full missio
         machinery and gives B a flat `crowd>62 && R()<0.55`, which is right for an opponent from
         another house and wrong for the second-best man in yours. `doPrimacy` re-decides that roll
         against the same figure the holder would have been read at. This measures the correction:
         with it and without it, how many challengers die.
     4 · AND WHAT THE ORDER FROM THE BOX IS WORTH — say nothing, tell them to finish it, or throw
         the cloth. If pressing does not move the death rate, it is not a decision.

   Run: node test/probes/title.mjs [bouts] [seed] */
import { serve, open } from "../harness.mjs";
const N = +(process.argv[2] || 600);
const SEED = process.argv[3] || "TITLE";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([N,SEED])=>{
  const A = window.__LVDVS;
  /* a house good enough to hold the primacy, with two men the gate would accept */
  const build = (tag, fame, favor) => {
    const d = A.newGameState("Title", "clean", `${SEED}-${tag}`, null);
    d.fame = fame; d.favor = favor; d.week = 120; d.gold = 4000;
    d.gladiators = [];
    const men = [];
    for(let i=0;i<2;i++){
      const g = A.genGladiator(d, 66 + Math.floor(Math.random()*16));
      g.id = d.nextId++; g.status = "active"; g.mine = true;
      g.kit = A.defaultKit(g.cls);
      g.wins = 9 + Math.floor(Math.random()*8); g.losses = 2; g.pfame = 60 + Math.floor(Math.random()*50);
      g.fatigue = 0; g.morale = 70;
      d.gladiators.push(g); men.push(g);
    }
    d.primus = { mine:true, gid:men[0].id, name:men[0].name, nick:men[0].nick, cls:men[0].cls,
      since:d.week-10, defences:1 };
    return { d, h:men[0], r:men[1] };
  };

  const arm = (label, fame, favor, order) => {
    let challengerWon = 0, died = 0, holderDied = 0, challengerDied = 0, spared = 0, stopped = 0;
    let rounds = 0, fell = 0, crowd = 0, n = 0, threw = null, titleMoved = 0;
    for(let i=0;i<N;i++){
      const { d, h, r } = build(`${label}-${i}`, fame, favor);
      const before = d.primus.gid;
      try {
        /* A BOUT COMES TO THE BALANCE MORE THAN ONCE. `doFight` passes stopAtCrux on the resume
           too — `speak` says so in as many words — so a single resume leaves a large share of
           bouts unfinished. The first draft of this probe resumed once and counted 192 of 500
           unfinished results as "the holder kept it", reporting a 31% challenger rate on two men
           whose measured power was 314.1 against 313.1. Resumed to the end it is a fair fight. */
        let res = A.doPrimacy(d, h.id, r.id, null, null);
        for(let guard = 0; res && res.crux && guard < 12; guard++){
          res.pending.beats = res.beats;
          res = A.doPrimacy(d, h.id, r.id, res.pending, guard === 0 ? order : "run");
        }
        if(!res || res.crux) continue;
        n++;
        if(res.stopped){ stopped++; continue; }
        if(res.dead) died++;
        if(h.status === "dead") holderDied++;
        if(r.status === "dead") challengerDied++;
        if(d.primus && d.primus.gid !== before){ challengerWon++; titleMoved++; }
        if(res.beats.some(b=>b.kind==="spared")) spared++;
        if(res.beats.some(b=>b.kind==="fall")) fell++;
        rounds += res.beats.length ? Math.max(...res.beats.map(b=>b.round||0)) : 0;
        crowd += res.crowd || 0;
      } catch(e){ if(!threw) threw = String(e && e.stack || e).slice(0,200); }
    }
    return { label, order:order||"(none)", n, challengerWon, died, holderDied, challengerDied,
      spared, stopped, fell, titleMoved, rounds:+(rounds/Math.max(1,n)).toFixed(1),
      crowd:Math.round(crowd/Math.max(1,n)), threw };
  };

  /* ---- AND HOW OFTEN IS IT ASKED FOR AT ALL ----
     A 4% death rate on a bout nobody ever gets offered is a curiosity, not a risk. `make` wants
     the primacy held by this house, a second man past PRIMUS_GATE, and six weeks since the title
     last moved — so this counts the offers a played house actually sees, using the game's own
     `make` rather than a reconstruction of its gate. */
  const R = window.__ROPE;
  const life = (()=>{ let offers = 0, weeks = 0, houses = 0, held = 0, anyPrimus = 0;
    let twoEligible = 0, heldAndTwo = 0, heldTwoAndAged = 0, everHeld = 0, everOffered = 0;
    for(let h=0; h<10; h++){
      const d = A.newGameState("Life"+h, "clean", `${SEED}-life-${h}`);
      houses++; let sawHeld = false, sawOffer = false;
      for(let w=0; w<300 && !d.over; w++){
        try { R.lanista(d, {}); } catch(e){ break; }
        weeks++;
        const elig = A.activeG(d).filter(A.primusEligible).length;
        if(elig >= 2) twoEligible++;
        if(d.primus) anyPrimus++;
        if(d.primus && d.primus.mine){ held++; sawHeld = true;
          if(elig >= 2) heldAndTwo++;
          if(elig >= 2 && d.week - d.primus.since >= 6) heldTwoAndAged++;
          if(A.EVENTS.primacy.make(d)){ offers++; sawOffer = true; }
        }
      }
      if(sawHeld) everHeld++;
      if(sawOffer) everOffered++;
    }
    return { offers, weeks, houses, held, anyPrimus, twoEligible, heldAndTwo, heldTwoAndAged,
      everHeld, everOffered }; })();

  return {
    life,
    orders: ["run","press","cover","cloth"].map(o=>arm(`ord-${o}`, 900, 60, o)),
    houses: [
      arm("poor",  120,  15, "run"),
      arm("mid",   900,  60, "run"),
      arm("great",3000,  95, "run"),
    ],
    menu: Object.keys(A.PRIMACY_CRUX),
  };
}, [N, SEED]);

const pc = (a,b) => b ? `${(100*a/b).toFixed(1)}%` : "-";
const row = x => `${String(x.label).padEnd(9)} n=${String(x.n).padStart(4)} · challenger takes it ${pc(x.challengerWon,x.n).padStart(6)}`
  + ` · somebody dies ${pc(x.died,x.n).padStart(6)} (holder ${x.holderDied}, challenger ${x.challengerDied})`
  + ` · spared ${pc(x.spared,x.n).padStart(6)} · went down ${pc(x.fell,x.n).padStart(6)}`
  + ` · ${x.rounds} rounds · crowd ${x.crowd}${x.stopped?` · stopped ${x.stopped}`:""}`;

console.log(`\n  THE TITLE BOUT, ${N} per cell · seed "${SEED}" · the menu is [${out.menu.join(", ")}]\n`);
console.log(`  BY THE ORDER FROM THE BOX (a house of fame 900, favour 60):`);
for(const x of out.orders) console.log(`    ${String(x.order).padEnd(6)} ${row(x)}`);
const L = out.life;
console.log(`\n  AND HOW OFTEN IT IS ASKED FOR, over ${L.weeks} played weeks in ${L.houses} houses:`);
console.log(`    somebody in Capua held the primacy on ${L.anyPrimus} weeks · THIS house held it on ${L.held} (${L.everHeld} of ${L.houses} houses ever did)`);
console.log(`    two men past PRIMUS_GATE on ${L.twoEligible} weeks · holding it WITH two eligible ${L.heldAndTwo} · and six weeks since it moved ${L.heldTwoAndAged}`);
console.log(`    EVENTS.primacy.make returned an offer on ${L.offers} weeks — ${L.everOffered} of ${L.houses} houses were ever asked`);
console.log(`\n  BY WHAT THE CITY THINKS OF THE HOUSE (saying nothing):`);
for(const x of out.houses) console.log(`    ${row(x)}`);
const threw = [...out.orders, ...out.houses].filter(x=>x.threw);
if(threw.length) console.log(`\n  THREW: ${threw[0].threw}`);
console.log("");

await browser.close(); server.close();
