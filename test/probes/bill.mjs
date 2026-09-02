/* #228 — WHAT THE CARD OFFERS, AND WHAT THE REFERENCE PLAYER TAKES OFF IT

   The item: "Two of the four fight engines carry 1.2% of play. Of 1,849 rope bouts: 1,658 single
   (89.7%), 168 pair (9.1%), 13 melee (0.7%), 10 venatio (0.5%). Recommend the calendar force
   variety: festival cards that ARE melees and hunts, so the year's shape rotates the engines."

   THE NUMBERS ARE THE ROPE, AND THIS FILE'S OWN HISTORY SAYS SO TWICE.

     `takeBout` filters the bill by stakes and then takes `pool[0]`, and `makeGames` pushes every
     single before it adds a pair, a melee or a hunt. #202 wrote that down for the pair — "the
     reference player's pair count over a played house is a fact about ARRAY ORDER, not about the
     game" — and the same sentence covers the other two engines without a word changed.

     And the BILL was already fixed. `makeGames` carries a note: "add() was called up to eight times
     per card and each of the other three engines got one roll at thirty to fifty per cent, so a
     card of four bouts was three and a half singles and a maybe. Measured over 495 cards: 89%
     single, venatio 4%, pair 3%, melee 2%." The duplicate helpings were removed; the rolls now
     stand at pair 0.60, melee 0.46, hunt 0.62.

   SO THE QUESTION IS THE GAP: what the card holds against what `pool[0]` picks off it. And the one
   half of the item that is NOT already answered — `forceHunt` and `forceNaum` exist, and NOTHING IN
   THE CALENDAR SETS EITHER. They are set only by the player's own munus. Six festivals, and not one
   of them makes the year's shape rotate the engines, which is the item's recommendation verbatim.

   This reads the bill week by week — every offer on every card, by engine — against what the
   reference player actually fought, and then runs the two least-met engines at volume through the
   real doors to see whether they hold up when somebody finally uses them.

     node test/probes/bill.mjs 10 420 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"BILL" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","CALENDAR","activeG"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  const kindOf = o => o.melee ? (o.spectacle === "naumachia" ? "naumachia" : "melee")
    : o.venatio ? "venatio" : o.pair ? "pair" : "single";

  /* ---- 1. THE BILL, AND WHAT pool[0] TAKES OFF IT ---- */
  const offered = {}, took = {}, cardHas = {};
  let cards = 0, weeks = 0, bouts = 0;
  const byFest = {};
  for(let h=0; h<H; h++){
    const d = A.newGameState("Bill", "clean", "BILL-"+h, null);
    for(let w=0; w<W; w++){
      if(d.over) break;
      const before = (d.games && d.games.offers) || [];
      if(before.length){
        cards++;
        const seen = new Set();
        for(const o of before){ const k = kindOf(o); offered[k] = (offered[k]||0)+1; seen.add(k); }
        for(const k of seen) cardHas[k] = (cardHas[k]||0)+1;
        const fk = (d.games && d.games.fest) || "—";
        const f = byFest[fk] = byFest[fk] || { cards:0 };
        f.cards++;
        for(const k of seen) f[k] = (f[k]||0)+1;
      }
      let t; try { t = R.takeBout(d, {}); } catch(e){ t = null; }
      if(t && t.ran !== false && t.offer){ bouts++; const k = kindOf(t.offer); took[k] = (took[k]||0)+1; }
      try { R.lanista(d); } catch(e){ break; }
      weeks++;
    }
  }

  /* ---- 2. THE TWO LEAST-MET ENGINES, DRIVEN AT VOLUME THROUGH THE REAL DOORS ----
     `checks/engines.mjs` already holds all four at n=3000, and holds them on HAND-BUILT men. What
     has never run is either engine inside a played house, on the bill the game actually draws, with
     the state that comes with it. 13 melees and 10 venatios is the whole history of that. */
  const vol = {};
  for(const want of ["melee","venatio"]){
    /* ---- WHAT THIS DELIBERATELY DOES NOT COUNT ----
       An earlier cut also counted cruxes and deaths off `t.res`, and reported 0 of each across 550
       bouts, which looked like a finding and was not. `doVenatio` and `doMelee` return `crux:true`
       only on their UNFINISHED branch, and `takeBout` answers that branch itself and hands back the
       resolved result — so the counter was reading the object after the crux it wanted to count had
       already been dealt with. `sand` drives that path properly in a browser and sees them.
       A number nobody can stand behind is worse than no number; the two counters are gone. */
    const v = vol[want] = { asked:0, ran:0, threw:0, rounds:[], purse:[], msgs:{} };
    for(let h=0; h<H; h++){
      const d = A.newGameState("Bill", "clean", "VOL-"+want+"-"+h, null);
      for(let w=0; w<12; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
      for(let i=0; i<W && v.ran < 400; i++){
        if(d.over) break;
        v.asked++;
        let t = null;
        try {
          t = R.takeBout(d, { pick: pool => pool.find(x=>kindOf(x) === want || (want==="melee" && x.melee)) || null });
        } catch(e){ v.threw++; v.msgs[String(e && e.message).slice(0,60)] = (v.msgs[String(e&&e.message).slice(0,60)]||0)+1; }
        if(t && t.ran !== false && t.offer && (kindOf(t.offer) === want || (want==="melee" && t.offer.melee))){
          v.ran++;
          const res = t.res || {};
          if(typeof res.rounds === "number") v.rounds.push(res.rounds);
          else if(Array.isArray(res.beats)) v.rounds.push(res.beats.length);
          if(typeof t.offer.purse === "number") v.purse.push(Math.round(t.offer.purse));
        }
        try { R.lanista(d); } catch(e){ break; }
      }
    }
  }

  /* ---- 3. AND WHETHER ANY FESTIVAL FORCES AN ENGINE ---- */
  const forcing = A.CALENDAR.map(f=>({ key:f.key, name:f.name, offers:f.offers,
    forceHunt: !!f.forceHunt, forceNaum: !!f.forceNaum, forceMelee: !!f.forceMelee }));

  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    return { n:s.length, min:s[0], p50:s[Math.floor(s.length/2)], max:s[s.length-1] }; };
  return { weeks, cards, bouts, offered, took, cardHas, byFest, forcing,
    vol: Object.fromEntries(Object.entries(vol).map(([k,v])=>[k,
      { asked:v.asked, ran:v.ran, threw:v.threw,
        rounds:q(v.rounds), purse:q(v.purse), msgs:v.msgs }])) };
}, [H,W]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  const KINDS = ["single","pair","melee","naumachia","venatio"];
  console.log(`${out.weeks} weeks · ${out.cards} cards · ${out.bouts} bouts fought\n`);
  console.log(`WHAT THE CARD OFFERS, against WHAT pool[0] TAKES:`);
  console.log(`  ${"engine".padEnd(11)} ${"offers".padStart(7)} ${"of all".padStart(7)}   ${"cards with one".padStart(15)}   ${"taken".padStart(6)} ${"of all".padStart(7)}`);
  const totOff = Object.values(out.offered).reduce((n,v)=>n+v,0) || 1;
  const totTook = Object.values(out.took).reduce((n,v)=>n+v,0) || 1;
  for(const k of KINDS){
    const o = out.offered[k]||0, t = out.took[k]||0, c = out.cardHas[k]||0;
    console.log(`  ${k.padEnd(11)} ${String(o).padStart(7)} ${(o/totOff*100).toFixed(1).padStart(6)}%`
      + `   ${(c/(out.cards||1)*100).toFixed(1).padStart(14)}%`
      + `   ${String(t).padStart(6)} ${(t/totTook*100).toFixed(1).padStart(6)}%`);
  }
  console.log(`\n  the item measured taken: single 89.7% · pair 9.1% · melee 0.7% · venatio 0.5%\n`);
  console.log(`DRIVEN AT VOLUME THROUGH THE REAL DOORS (nobody has ever run these):`);
  for(const [k,v] of Object.entries(out.vol)){
    console.log(`  ${k}: ran ${v.ran} of ${v.asked} asks · threw ${v.threw} · rounds ${JSON.stringify(v.rounds)}`);
    console.log(`     purse ${JSON.stringify(v.purse)}`);
    for(const [m,n] of Object.entries(v.msgs)) console.log(`     THREW ${n}x: ${m}`);
  }
  console.log(`\nDOES ANY FESTIVAL FORCE AN ENGINE? (the item's own recommendation)`);
  for(const f of out.forcing)
    console.log(`  ${f.name.padEnd(22)} offers ${f.offers}  hunt ${f.forceHunt} · naumachia ${f.forceNaum} · melee ${f.forceMelee}`);
}
console.log("\n" + JSON.stringify(out));
await browser.close(); server.close();
