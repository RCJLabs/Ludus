/* THE SIXTEEN DEAD FIELDS #276 LEFT UNTRIAGED — the sweep's second pass.

     node test/probes/orphans.mjs 40 420

   #276 shipped a census as `checks/promise.mjs` arm 1: **538 assigned fields, 29 written once and
   read nowhere**. Thirteen of the twenty-nine are accounted for and the accounting is in that
   check — three deliberate (`fold` is read by the stylesheet, `women` and `damnati` are duplicate
   bookkeeping beside a live edict), eight read by the gate and nothing else, two refused with
   their own numbers (`oneMoreYear`, `wantMatch`).

   Sixteen were left. One of those sixteen, `d.election.stood`, turns out to be read by
   `checks/office.mjs`, so it belongs with the gate-only eight and the real list is FIFTEEN.

   This counts them, because a dead field is only worth repairing at the rate it is written. The
   `woman` precedent is the bar and it is a refusal: #239 measured that ask at once in 2,672 weeks
   and built three of its five phases into nothing.

   ---- AND ONE OF THE FIFTEEN IS NOT A DEAD FIELD, IT IS A DEAD EVENT ----
   `ROME_TURNS` is "three things Rome does to a house that keeps coming back", drawn once per trip
   behind `r.turned`. Two of the three do something: `matched` sets `romeHardCard` (live), and
   `watched` pays +40 fame and warms every senator. The third:

       offer: { need:d=>romeStanding(d)>=55, w:7,
         say:d=>`A man from a Roman familia asks, without much circling, what it would take to
                 buy your best. He names a figure that is not an insult, which is the insulting
                 part.`,
         hit:d=>{ d.flags.romeBid = 1; } },

   **The whole of what happens is the dead flag.** There is no figure, no offer and no decision —
   the prose describes a thing happening and the mechanism is one write nothing reads. And because
   `r.turned` is set either way, drawing it SPENDS the city's one piece of business with you.

   Arm B prices that directly: which of the three fires, and what each one moves. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 40), W = +(process.argv[3] || 420);
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true, rome:true };

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","endWeek","activeG","ROME_TURNS","RT_KEYS","romeWeek","PETITIONS",
    "PET_KEYS","runPetition","petitionReady","editorRec"].filter(k=>A[k]==null);

  /* ---- ARM A: how often is each of the fifteen actually written ---- */
  const hit = {}, houses = {};
  let weeks = 0;
  const mark = (k, i) => { hit[k] = (hit[k]||0) + 1; (houses[k] = houses[k] || new Set()).add(i); };

  for(let i=0;i<H;i++){
    const d = A.newGameState("Or","clean",`ORPHAN-${i}`);
    const seen = {};
    const once = (k, on) => { if(on && !seen[k]){ seen[k] = 1; mark(k, i); } };
    for(let w=0; w<W; w++){
      if(d.over) break;
      weeks++;
      try { R.lanista(d, MOST); } catch(e){}
      try { A.endWeek(d); } catch(e){ break; }
      const F = d.flags || {};
      once("cartel",        F.cartel != null);
      once("romeBid",       F.romeBid != null);
      once("paragonBought", F.paragonBought != null);
      once("lookedAway",    F.lookedAway != null);
      once("turnedHimIn",   F.turnedHimIn != null);
      once("scenario",      d.scenario != null);
      once("avenging",  (d.gladiators||[]).some(g=>g.avenging != null));
      once("lastCheck", (d.gladiators||[]).some(g=>g.lastCheck != null));
      once("wasYours",  (d.circuit||[]).some(f=>f.wasYours));
      const kids = (d.domus && d.domus.children) || [];
      once("mentorLost", kids.some(c=>c.mentorLost != null));
      once("wedTo",      kids.some(c=>c.wedTo != null));
      const offers = (d.games && d.games.offers) || [];
      once("softened", offers.some(o=>o.softened));
      once("raised",   offers.some(o=>o.raised));
      once("eased",    offers.some(o=>o.eased));
    }
  }

  /* ---- ARM B: what each of Rome's three turns actually moves ---- */
  /* the dead-29 as `checks/promise.mjs` pins them, so a flag written here can be told apart from
     a flag that is written here AND read somewhere else */
  const DEAD = ["avenging","cartel","damnati","demo","eased","everBorrowed","fold","fromYard",
    "inside","kinBroken","lastCheck","lookedAway","mentorLost","oneMoreYear","paragonBought",
    "raised","romeBid","scenario","softened","soldAt","stood","tookHouse","turnedHimIn","wantMatch",
    "wasYours","watchful","wedTo","women","writtenOff"];
  const turns = {};
  for(const k of (A.RT_KEYS||[])){
    const T = A.ROME_TURNS[k];
    const rows = [];
    for(let i=0;i<24;i++){
      const d = A.newGameState("Or","clean",`ROME-${k}-${i}`);
      /* a house that has been to Rome and is standing in it */
      d.fame = 900; d.gold = 6000;
      d.flags.romeRuns = 2; d.flags.romeTriumphs = 1;
      const was = Object.assign({}, d.flags||{});
      const before = { gold:Math.round(d.gold), fame:Math.round(d.fame),
        fav:Math.round(d.favor||0), flags:Object.keys(d.flags).length,
        sen:(A.patronsOf ? A.patronsOf(d) : []).reduce((n,x)=>n+(x.favor||0),0),
        morale:A.activeG(d).reduce((n,g)=>n+(g.morale||0),0) };
      let threw = null;
      try { T.hit(d); } catch(e){ threw = e.message; }
      const after = { gold:Math.round(d.gold), fame:Math.round(d.fame),
        fav:Math.round(d.favor||0), flags:Object.keys(d.flags).length,
        sen:(A.patronsOf ? A.patronsOf(d) : []).reduce((n,x)=>n+(x.favor||0),0),
        morale:A.activeG(d).reduce((n,g)=>n+(g.morale||0),0) };
      const moved = Object.keys(before).filter(x=>x !== "flags" && before[x] !== after[x]);
      /* WHICH flag it wrote, so a turn that sets a LIVE one is not filed beside a turn that sets a
         dead one. The first cut of this read scalar deltas only, called `matched` "the whole of it
         is one flag", and was wrong — `romeHardCard` is read, and a runtime delta cannot see that. */
      const wrote = Object.keys(d.flags||{}).filter(x=>!(x in was));
      rows.push({ threw, moved, wrote,
        d: { gold:after.gold-before.gold, fame:after.fame-before.fame, sen:after.sen-before.sen } });
    }
    const wrote = [...new Set(rows.flatMap(r=>r.wrote))];
    turns[k] = { w:T.w, wrote,
      moved: [...new Set(rows.flatMap(r=>r.moved))],
      deadFlag: wrote.length > 0 && wrote.every(f=>DEAD.includes(f)),
      threw: rows.filter(r=>r.threw).length,
      dFame: rows[0].d.fame, dGold: rows[0].d.gold, dSen: rows[0].d.sen };
  }

  /* ---- ARM C: THE ZEROS THE ROPE'S OWN POLICY MANUFACTURES ----
     `turnedHimIn` is the SECOND branch of the event whose first branch is `lookedAway`, and this
     rope answers 0. `softened`/`raised`/`eased` are petitions, and no rope has ever petitioned.
     Reporting either as "never written" would be reading a policy back out of itself — #274's
     `tour` fault. These drive them directly. */
  const driven = {};
  {
    /* the war messenger, answered the other way */
    let turned = 0, tried = 0;
    for(let i=0;i<H;i++){
      const d = A.newGameState("Or","clean",`WARWORD-${i}`);
      for(let w=0; w<W; w++){
        if(d.over) break;
        const ev = d.pendingEvent;
        if(ev && ev.id === "warWord"){
          tried++;
          try { A.EVENTS.warWord.run(d, ev, 1); } catch(e){}
          d.pendingEvent = null;
          if((d.flags||{}).turnedHimIn != null){ turned++; break; }
        }
        try { R.lanista(d, MOST); } catch(e){}
        try { A.endWeek(d); } catch(e){ break; }
      }
    }
    driven.warWord = { reached:tried, turned };
  }
  {
    /* every petition, run against a live bill */
    const pet = {};
    for(const k of A.PET_KEYS) pet[k] = { asked:0, won:0, marked:0 };
    for(let i=0;i<H;i++){
      const d = A.newGameState("Or","clean",`PET-${i}`);
      for(let w=0; w<W; w++){
        if(d.over) break;
        try { R.lanista(d, MOST); } catch(e){}
        const offers = (d.games && d.games.offers) || [];
        const o = offers.find(x=>!x.pair && !x.melee && !x.venatio);
        if(o && A.petitionReady(d)){
          for(const k of A.PET_KEYS){
            let ok = false; try { ok = !!A.PETITIONS[k].need(d, o); } catch(e){}
            if(!ok) continue;
            pet[k].asked++;
            let r = null; try { r = A.runPetition(d, k, o.id); } catch(e){}
            if(r && r.won){ pet[k].won++;
              if(o.softened || o.raised || o.eased) pet[k].marked++; }
            break;
          }
        }
        try { A.endWeek(d); } catch(e){ break; }
      }
    }
    driven.petitions = pet;
  }

  /* ---- ARM D: THE TWO CONTENDERS, PRICED ----
     `g.avenging = f.gid` is the highest genuine rate of any dead field — a kinsman raised to
     avenge the man who killed his brother, carrying the KILLER'S ID, and nothing ever puts the two
     on the same sand. That is `wantMatch`'s shape, which #276 refused at 7 fires in 2,402 weeks.
     This prices it: how many men carry it, whether the named man is still alive to be reached, and
     whether the avenger ever actually meets him.

     And the petitions: `runPetition` already charges patron favour for the asking, the editor
     keeps a kept/broken ledger (`editorRec`/`editorWord`/`editorTrust`), and a granted favour
     leaves its mark on the OFFER and nothing on the EDITOR. */
  /* ---- AND ARM D WAS WRONG TWICE BEFORE IT WAS RIGHT, WHICH IS THE POINT OF WRITING IT DOWN ----
     1. `g.avenging = f.gid` LOOKS like a revenge target and is not. `f` is a FALLEN record —
        { name, week, gid, cls, fans, fav, how, killer, kinCame, avenged } — so `f.gid` is the DEAD
        MAN'S OWN id and the killer is `f.killer`. The first cut searched `d.circuit` for `f.gid`,
        found nothing on 70 of 70, and would have published "the named killer is never reachable".
        The real revenge machinery is LIVE: `f.killer.fid` finds the man on a rival's roster,
        `fal.avenged = true` fires on the win, and the fallen list renders "avenged".
     2. The editor arm read `o.editorKey || editorKeyOf(o.editor)` off ordinary bill offers. They
        carry NO EDITOR — only bookings do — so the key was null, before and after compared equal,
        and "the ledger moved on 0 of 205" was true by construction. And the premise was wrong
        anyway: `petitionOdds` already reads `cardEditor(d)`, `editorTrust` and `editorRec().bought`,
        which #254 phase 2 built. The petition talks to the editor going in; it is only the MARKER
        on the offer that nothing reads. */
  const av = { men:0, houses:0, killerNamed:0, killerAlive:0, avengedFlag:0 };
  for(let i=0;i<H;i++){
    const d = A.newGameState("Or","clean",`AVENGE-${i}`);
    const carry = {};                      /* gid -> the fid he was raised against */
    let any = false;
    for(let w=0; w<W; w++){
      if(d.over) break;
      for(const g of (d.gladiators||[])) if(g.avenging != null && !carry[g.id]){
        carry[g.id] = g.avenging; av.men++; any = true;
        /* the DEAD KINSMAN this man was raised for, and whether the live machinery beside the
           dead field has what it needs: a named killer, still on a rival's roster */
        const fal = (d.fallen||[]).find(f=>f.gid === g.avenging);
        if(fal && fal.killer && fal.killer.fid != null){ av.killerNamed++;
          const h = (d.rivals||[]).find(y=>y.name===fal.killer.house);
          if(h && (h.fighters||[]).some(y=>y.id===fal.killer.fid)) av.killerAlive++; }
        if(fal && fal.avenged) av.avengedFlag++;
      }
      try { R.lanista(d, MOST); } catch(e){}
      try { A.endWeek(d); } catch(e){ break; }
    }
    if(any) av.houses++;
  }

  /* what a granted petition leaves behind. NOT on the editor — see the note above: an ordinary
     bill offer carries no editor, and `petitionOdds` already reads him on the way in. What this
     counts is the marker itself, and whether anything in the game distinguishes an offer that was
     softened/raised/eased from one that was not. */
  const led = { grants:0, marked:0 };
  for(let i=0;i<H;i++){
    const d = A.newGameState("Or","clean",`LEDGER-${i}`);
    for(let w=0; w<W; w++){
      if(d.over) break;
      try { R.lanista(d, MOST); } catch(e){}
      const offers = (d.games && d.games.offers) || [];
      const o = offers.find(x=>!x.pair && !x.melee && !x.venatio);
      if(o && A.petitionReady(d)){
        for(const k of A.PET_KEYS){
          let ok = false; try { ok = !!A.PETITIONS[k].need(d, o); } catch(e){}
          if(!ok) continue;
          let r = null; try { r = A.runPetition(d, k, o.id); } catch(e){}
          if(r && r.won){ led.grants++;
            if(o.softened || o.raised || o.eased) led.marked++; }
          break;
        }
      }
      try { A.endWeek(d); } catch(e){ break; }
    }
  }

  return { miss, weeks, houses:H, hit, driven, av, led,
    inHouses: Object.fromEntries(Object.entries(houses).map(([k,v])=>[k, v.size])), turns };
}, [H, W, MOST]);

if(out.miss && out.miss.length) console.log("handle is missing: " + out.miss.join(", "));
console.log(`\n#277 — THE FIFTEEN DEAD FIELDS LEFT UNTRIAGED`);
console.log(`${out.houses} houses · ${out.weeks} played weeks\n`);

const ALL = ["cartel","romeBid","paragonBought","lookedAway","turnedHimIn","scenario","avenging",
  "lastCheck","wasYours","mentorLost","wedTo","softened","raised","eased"];
console.log(`  written in how many of the ${out.houses} houses (the rope never petitions, so the last three need their own arm):`);
for(const k of ALL.sort((a,b)=>(out.inHouses[b]||0)-(out.inHouses[a]||0))){
  const n = out.inHouses[k] || 0;
  console.log(`    ${k.padEnd(15)} ${String(n).padStart(3)} of ${out.houses} houses `
    + `(${(n/out.houses*100).toFixed(0).padStart(3)}%)${n===0 ? "   <- never written in this sample" : ""}`);
}

console.log(`\n  ARM B — Rome's three turns, what each moves, and whether the flag it writes is read:`);
for(const [k, t] of Object.entries(out.turns||{})){
  console.log(`    ${k.padEnd(9)} w:${t.w} · moves ${t.moved.length ? t.moved.join(", ") : "nothing directly"} `
    + `· writes ${t.wrote.length ? t.wrote.join(", ") : "no flag"} `
    + `${t.wrote.length ? (t.deadFlag ? "(DEAD)" : "(read elsewhere)") : ""}`
    + (t.deadFlag && !t.moved.length ? `  <- the whole of it is one write nothing reads` : ""));
}
const ws = Object.values(out.turns||{}).reduce((n,t)=>n+t.w, 0);
const dead = Object.entries(out.turns||{}).filter(([,t])=>t.deadFlag && !t.moved.length)
  .reduce((n,[,t])=>n+t.w, 0);
if(ws) console.log(`\n    -> when all three are eligible, ${(dead/ws*100).toFixed(0)}% of the time the city's `
  + `ONE piece of business with a house is a sentence and nothing else`);

const D = out.driven || {};
console.log(`\n  ARM C — the zeros the rope's own policy manufactures:`);
if(D.warWord) console.log(`    warWord reached ${D.warWord.reached} times; answered the OTHER way it `
  + `stamps turnedHimIn ${D.warWord.turned} times — the same event as lookedAway, so the zero above `
  + `is this rope answering 0, not a door that is shut`);
for(const [k, v] of Object.entries(D.petitions || {}))
  console.log(`    petition ${k.padEnd(8)} could be asked ${String(v.asked).padStart(4)} times `
    + `· granted ${String(v.won).padStart(3)} · left its marker on the offer ${v.marked}`);
const V = out.av || {}, L = out.led || {};
console.log(`\n  ARM D — the two contenders, priced:`);
console.log(`    avenging   ${V.men} men raised to avenge, in ${V.houses} of ${out.houses} houses`);
console.log(`               of the dead kinsmen behind them, ${V.killerNamed} had a named killer and `
  + `${V.killerAlive} of those killers were still on a rival's roster — so the LIVE revenge path `
  + `(f.killer / f.avenged) has what it needs and g.avenging is a back-pointer beside it`);
console.log(`    petitions  ${L.grants} favours granted · ${L.marked} left a marker on the offer, and `
  + `nothing anywhere distinguishes a softened card from a plain one`);
console.log("");

await browser.close(); server.close();
