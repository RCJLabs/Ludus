/* #218 — WHICH OF ROME'S FIVE TERMS IS THE ONE THAT SHUTS THE ROAD

   The item: "Rome never happens. 0 offers in 16 houses over eight-plus years each. The gate: fame
   past `romeBar`, `romeProved`, at least two men — and a senator patron at favour >= 70, which is
   the term a competent house fails silently (rope). Nothing in the game teaches that road.
   Recommend an agenda whisper when every other term is met."

   THE ITEM NAMES A TERM WITHOUT MEASURING IT. `romeReady` has five live conditions and the item
   asserts the fourth is the wall. Two of the others are at least as good a candidate: `romeProved`
   wants the primacy or the FOURTH RUNG of the census, and `romeBar` is 1,000 fame rising 300 a
   campaign. So this attributes every shut week to the term or terms that shut it, and asks which
   one is the LAST MILE — unmet while everything else is met.

   AND THE ROAD MAY NOT BE AS DARK AS THE ITEM SAYS. Two lines already exist:
     the feats sheet, under "The Sand at Rome", walks four states and names the one in the way,
       including "past the bar, and no senator warm enough to put your name forward";
     the agenda warns when a senator ALREADY HELD cools below 70, and again below 78.
   Neither fires for a house that has no senator at all, which is the hole to size.

     node test/probes/rome.mjs 12 420 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"ROME" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","romeReady","romeProved","romeBar","patronsOf","activeG","agenda",
                "riseOf","ROME_RANK","featNear","romeRow","romeGap","callFavour","favourReady","FAVOURS"].filter(k=>A[k]==null);
  if(miss.length) return { miss };
  const pct = n => Math.round(n*1000)/10;

  const TERMS = ["proved","fame","senator","men","cool"];
  const arms = {};

  for(const [key, opts, wk] of [["default · 8 years", {}, Math.min(W,150)],
                                ["default · long", {}, W],
                                ["favours:wise · long", { favours:"wise" }, W]]){
    const a = arms[key] = { houses:0, weeks:0, shut:0, ready:0, offers:0, letters:0, lettered:0, went:0, wonAt:0,
      unmet:{}, only:{}, everProved:0, everFame:0, everSenator:0, everWarm:0,
      bestSen:[], bestRise:[], bestFame:[], agendaRome:0, agendaWeeks:0, sheetLine:{},
      rowLine:{}, gapKey:{}, slamTried:0, slamShut:0 };
    for(const t of TERMS){ a.unmet[t] = 0; a.only[t] = 0; }

    for(let h = 0; h < H; h++){
      const d = A.newGameState(`ROME-${h}`, "capua", `ROME-${h}`);
      a.houses++;
      let sawProved = false, sawFame = false, sawSen = false, sawWarm = false;
      let topSen = 0, topRise = 0, topFame = 0, hadLetter = false, wasOffer = false;
      for(let w = 0; w < wk && !d.over; w++){
        a.weeks++;
        const sen = A.patronsOf(d).filter(x=>x.rank==="senator").sort((x,y)=>y.favor-x.favor)[0] || null;
        if(sen){ sawSen = true; topSen = Math.max(topSen, sen.favor); if(sen.favor >= 70) sawWarm = true; }
        topRise = Math.max(topRise, A.riseOf(d));
        topFame = Math.max(topFame, d.fame||0);
        if(A.romeProved(d)) sawProved = true;
        if((d.fame||0) >= A.romeBar(d)) sawFame = true;

        /* the item is about a road that never OPENS, so the attribution runs only on the weeks
           before a house's first letter — after that, "shut" is mostly the cooldown working */
        if(!d.rome && !d.romeOffer && !d.over && !hadLetter){
          /* the five live terms of `romeReady`, read one at a time */
          const st = {
            proved:  A.romeProved(d),
            fame:    (d.fame||0) >= A.romeBar(d),
            senator: A.patronsOf(d).some(x=>x.rank==="senator" && x.favor>=70),
            men:     A.activeG(d).length >= 2,
            cool:    (!d.flags.romeDeclined || d.week - d.flags.romeDeclined >= 30)
                     && (!d.flags.romeReturned || d.week - d.flags.romeReturned >= 45),
          };
          const off = TERMS.filter(t=>!st[t]);
          if(off.length){ a.shut++; for(const t of off) a.unmet[t]++;
            if(off.length === 1) a.only[off[0]]++; }
          else a.ready++;

          /* what the agenda says about Rome on a week the road is shut — the item's own claim */
          let rows = null; try { rows = A.agenda(d); } catch(e){}
          if(rows){ a.agendaWeeks++;
            if(rows.some(x=>/rome|senator|favour has fallen|put your name/i.test(
              `${x.label||""} ${x.sub||""}`))) a.agendaRome++; }
          /* and what the feats sheet says, which is the one place that already walks the states */
          let near = null; try { near = A.featNear(d, "rome"); } catch(e){}
          if(near) a.sheetLine[near] = (a.sheetLine[near]||0) + 1;
          /* what the NEW row would put on the week's list, from the game's own function */
          let row = null; try { row = A.romeRow(d); } catch(e){}
          if(row) a.rowLine[row.label.replace(/\d+/g, "N")] = (a.rowLine[row.label.replace(/\d+/g,"N")]||0) + 1;
          const gk = (A.romeGap(d)||{}).key || "none";
          a.gapKey[gk] = (a.gapKey[gk]||0) + 1;
        }
        /* ---- THE LEVER THAT SHUTS THE DOOR IT OPENS ----
           `FAVOURS.senator` costs 34 favour and the letter wants a senator at 70, so calling it
           from anywhere in 70..103 puts him under the bar. Counted, not asserted. */
        { const st = A.patronsOf(d).find(x=>x.rank==="senator");
          if(st && A.favourReady(d, st) && st.favor >= 70){
            a.slamTried++;
            if(st.favor - (A.FAVOURS.senator.cost||0) < 70) a.slamShut++;
          } }
        if(d.romeOffer && !wasOffer){ a.letters++; hadLetter = true; }
        wasOffer = !!d.romeOffer;
        if(d.romeOffer) a.offers++;
        if(d.rome) a.went++;
        if(d.rome && (d.rome.won||0) > 0) a.wonAt++;
        try { R.lanista(d, opts); } catch(e){ break; }
      }
      if(hadLetter) a.lettered++;
      if(sawProved) a.everProved++;
      if(sawFame) a.everFame++;
      if(sawSen) a.everSenator++;
      if(sawWarm) a.everWarm++;
      a.bestSen.push(Math.round(topSen)); a.bestRise.push(topRise); a.bestFame.push(Math.round(topFame));
    }
    a.shutPct = pct(a.shut/Math.max(1,a.weeks));
    a.readyPct = pct(a.ready/Math.max(1,a.weeks));
    a.agendaPct = pct(a.agendaRome/Math.max(1,a.agendaWeeks));
  }
  return { arms, TERMS, rank:A.ROME_RANK };
}, [H, W]);

if(out.miss){ console.log("handle is missing:", out.miss.join(", ")); }
else {
  console.log(`\n#218 — which of Rome's five terms shuts the road (proof wants the primacy or rung ${out.rank})`);
  for(const [key, a] of Object.entries(out.arms)){
    console.log(`\n=== ${key} — ${a.houses} houses, ${a.weeks} weeks played ===`);
    console.log(`  ${a.letters} letters (${a.lettered} of ${a.houses} houses got one) · on the table for `
      + `${a.offers} weeks · at Rome on ${a.went} weeks · a win there on ${a.wonAt}`);
    console.log(`  BEFORE the first letter: the road was open on ${a.ready} weeks and shut on ${a.shut}`);
    console.log(`  ${"term".padEnd(10)} ${"unmet".padStart(7)}  ${"share".padStart(6)}   ${"THE LAST MILE".padStart(13)}  share of shut weeks`);
    for(const t of out.TERMS)
      console.log(`  ${t.padEnd(10)} ${String(a.unmet[t]).padStart(7)}  `
        + `${String(Math.round(a.unmet[t]/Math.max(1,a.shut)*1000)/10).padStart(5)}%   `
        + `${String(a.only[t]).padStart(13)}  ${Math.round(a.only[t]/Math.max(1,a.shut)*1000)/10}%`);
    console.log(`  houses that ever: were proved ${a.everProved}/${a.houses} · reached the fame bar `
      + `${a.everFame}/${a.houses} · held a senator ${a.everSenator}/${a.houses} · warmed one to 70 ${a.everWarm}/${a.houses}`);
    console.log(`  best senator favour per house: ${a.bestSen.join(", ")}`);
    console.log(`  best census rung per house:    ${a.bestRise.join(", ")}`);
    console.log(`  best fame per house:           ${a.bestFame.join(", ")}`);
    console.log(`  THE AGENDA said anything about Rome on ${a.agendaRome} of ${a.agendaWeeks} shut weeks (${a.agendaPct}%)`);
    console.log(`  the senator's favour was READY to call on ${a.slamTried} of those weeks with him at 70+`
      + ` — calling it would have put him under the bar on ${a.slamShut}`);
    console.log(`  WHICH RUNG romeGap NAMED, on those weeks:`);
    for(const [k,v] of Object.entries(a.gapKey).sort((x,y)=>y[1]-x[1]))
      console.log(`     ${String(v).padStart(6)}  ${k}`);
    console.log(`  WHAT romeRow PUT ON THE WEEK'S LIST:`);
    const rowN = Object.values(a.rowLine).reduce((x,y)=>x+y,0);
    console.log(`     ${rowN} of ${a.shut} shut weeks carry a line (`
      + `${Math.round(rowN/Math.max(1,a.shut)*1000)/10}%, against 0.1% before)`);
    for(const [k,v] of Object.entries(a.rowLine).sort((x,y)=>y[1]-x[1]))
      console.log(`     ${String(v).padStart(6)}  ${k}`);
    console.log(`  the feats sheet's line, on those weeks:`);
    for(const [k,v] of Object.entries(a.sheetLine).sort((x,y)=>y[1]-x[1]).slice(0,5))
      console.log(`     ${String(v).padStart(6)}  ${k}`);
  }
}
await browser.close(); server.close();
