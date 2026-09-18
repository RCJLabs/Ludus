/* HOW MUCH OF THE WRITTEN GAME A HOUSE EVER MEETS — #282.

     node test/probes/depth.mjs 80 420

   Eight releases of audit work kept arriving at the same shape from different directions, and
   never once looked at it head on:

     `ASKS.year`      0 fires in 2,402 played weeks; its gate crossed in 5 of 40 houses   (#277)
     `ASKS.woman`     once in 2,672 weeks                                                  (#239)
     `romeBid`        0 of 120 houses — 21 reached Rome, 17 turned, all 17 the same card   (#277)
     `cartel`         needs year 7; 0 in 3,972 weeks                                       (#277)
     the night deck   a median of 4 nights from a deck of 5; 0 of 40 houses saw all five   (#281)
     `oldAge`         wants age>=62 AND health>=45; healthy in NONE of 3,070 lanista-weeks (#118)
     `closed`         wants 5 men freed; 0 of 40 staying houses, 10 of 40 touring          (#280)

   Each was written up as a fault in its own system — a gate too tight, a die too cold, a
   conjunction nobody split. This asks whether they are one fact about the game instead: **a house
   dies at a median of 53 weeks, and a great deal of what is written sits behind gates that want
   more weeks than that.**

   IT IS NOT A BUG REPORT. #99 measured 44% of houses dying inside a year and this project has
   treated that as the game's texture ever since, deliberately. The question is only how much of
   what is written a player actually meets, and whether the answer changes with how long he lives —
   because if coverage is flat in lifespan then the gates are the fault, and if it climbs steeply
   then lifespan is, and those want opposite repairs.

   ---- THIS PROBE WAS WRONG FOR ITS WHOLE LIFE. READ THIS BEFORE ANY NUMBER BELOW ----
   It stepped the week TWICE. `lanista` finishes with `fin(A.endWeek,[d])` (harness.mjs:1603) and
   the harness's own `play()` loops it ALONE, as do `abroad`, `answer` and `asked`; this probe
   called `endWeek` after it as well. Every iteration therefore played one week and then ran a
   second, EMPTY one — the player acted every other week and the weekly bill landed twice per
   action. `d.week` came out at exactly 2x the iteration count on 24 of 24 houses, and `git log -S`
   dates the rope's own `endWeek` to v3.96.0, a hundred and eighty-two releases before this file.

   So #282 was published off a game nobody plays. Corrected, 50 houses, 420w cap:

     reference arm        as published      corrected
     median life            51w               317w
     meets                  16/85             35/85      (19% -> 41%)
     dead inside 30w        22 of 80          4 of 50
     past 250w              5 of 80           27 of 50
     still standing at cap  0                 17 of 50

   The engaged arm lands at 302w and 25/85, and it is still the only arm that meets `WORDS` 4 of 4,
   still paying for it by standing away from Capua on 74% of its weeks.

   ---- WHAT THAT DOES TO #282's DECISION ----
   #282 closed "the median house meets a fifth of what is written" as THE INTENDED BARGAIN, and
   refused two repairs on the strength of it. The median house meets two fifths, lives three
   hundred weeks, and better than half of them get past 250w. The closure was reasoning about a
   different game. It is REOPENED, and the bands below are the ones to argue from.

   What is still true and did not depend on the stepping: coverage climbs steeply with lifespan,
   so the gates are not the fault; and a handful of situations are reached by NO house of fifty —
   `escape`, `owedLife`, `owedBack`, `primacy`, `defected`, `word`, `stolenSteel`, `uprising`,
   `ASKS.year` and the `steadied` night. Those are a real list and they are short.

   THIS REMAINS A STANDING INSTRUMENT. Run it when content is added: it says whether the addition
   reached anybody, and the bands say which houses it reached.

   TWO ARMS, for the reason every measurement in this sweep has needed them. The reference rope is
   a POLICY: it walks only above unrest 22 (#281), frees on sight (#279), tours only when invited
   (#280). An engaged arm walks every week it can and tours deliberately. Neither is "the player";
   together they bracket him. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 80), W = +(process.argv[3] || 420);
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true };

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","endWeek","activeG","EVENTS","NIGHT_KEYS","ASK_KEYS","WORD_KEYS",
    "AMB_KEYS","walkTheCells","CITY_KEYS","setOut","welcomeOf","knownIn",
    "haveWordWith","wordReady"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  /* the channels a player MEETS — each is a table of written situations, and each has a place in
     the week where it announces itself */
  const TABLES = {
    events:  Object.keys(A.EVENTS),
    night:   A.NIGHT_KEYS.slice(),
    asks:    A.ASK_KEYS.slice(),
    words:   A.WORD_KEYS.slice(),
    ambition:A.AMB_KEYS.slice(),
  };

  const arm = (engaged, tag) => {
    const houses = [];
    const union = {}; for(const t of Object.keys(TABLES)) union[t] = new Set();
    for(let i=0;i<H;i++){
      const d = A.newGameState("Dp","clean",`DEPTH-${tag}-${i}`);
      const seen = {}; for(const t of Object.keys(TABLES)) seen[t] = new Set();
      let away = 0;
      const noteAmb = () => { for(const g of (d.gladiators||[]))
        if(g.ambition && g.ambition.kind){ seen.ambition.add(g.ambition.kind); union.ambition.add(g.ambition.kind); } };
      let w = 0;
      for(; w<W; w++){
        if(d.over) break;
        noteAmb();
        /* the engaged player works his cells and keeps the bay warm */
        if(engaged){
          /* ---- AND HE TALKS TO HIS MEN, WHICH THE FIRST CUT OF THIS FORGOT ----
             `WORDS` is reached ONLY through `haveWordWith`, the verb #196 built for the player.
             Neither arm called it, so the first run reported `words 0/4` in every band of both
             arms — which reads as "nobody ever meets this table" and is entirely the probe's
             omission. An engaged player spends the week's one conversation. */
          if(!d.pendingEvent){
            const g = A.activeG(d).find(x=>A.wordReady && A.wordReady(d, x));
            if(g){ try { A.haveWordWith(d, g.id); } catch(e){} }
            const cev = d.pendingEvent;
            if(cev && cev.id === "word" && cev.data && cev.data.k){
              seen.words.add(cev.data.k); union.words.add(cev.data.k); }
          }
          if(!d.pendingEvent){ try { A.walkTheCells(d); } catch(e){} }
          const wev = d.pendingEvent;
          if(wev && wev.id === "ludusNight" && wev.data && wev.data.sit){
            seen.night.add(wev.data.sit.kind); union.night.add(wev.data.sit.kind); }
          if(!d.travel && !d.rome && !d.over && A.welcomeOf(d) < 1){
            const towns = A.CITY_KEYS.filter(k=>k !== d.city);
            const next = towns.sort((a,b)=>A.knownIn(d,a) - A.knownIn(d,b))[0];
            if(next){ try { A.setOut(d, next); } catch(e){} }
          }
        }
        /* ---- AND WHERE HE WAS STANDING, BECAUSE THAT IS WHAT DECIDES THE DIE ----
           A first cut of this counted "who took the week's one question" and reported 60% to the
           player's own verbs on an arm that takes NONE — it was counting a `pendingEvent` carried
           over from the previous `endWeek`, which is ordinary flow. There is no crowding to find:
           the rope answers the pending question before `endWeek` runs, exactly as the UI makes a
           player answer before the week can end, so the slot is free when the die is drawn.
           What DOES cut the engaged arm's event coverage is #268's eleven: the cards that refuse
           to fire away, and an engaged player tours. */
        if(d.city || d.travel) away++;
        const had = !!d.pendingEvent;
        /* ---- ONE CALL IS ONE WEEK. THIS LINE USED TO BE TWO ----
           `lanista` finishes with `fin(A.endWeek,[d])` (harness.mjs:1603) and the harness's own
           `play()` loops it ALONE, as do `abroad`, `answer` and `asked`. This probe called
           `endWeek` after it as well, which ran a SECOND, EMPTY week: the player acted every other
           week and the weekly bill landed twice per action. The rope has ended its own week since
           v3.96.0; this probe was written at v3.278.0 and added another.

           Everything #282 published came off that. See the header. */
        try { R.lanista(d, MOST); } catch(e){}
        const ev = d.pendingEvent;
        if(!had && ev && ev.id){
          seen.events.add(ev.id); union.events.add(ev.id);
          const k = ev.data && ev.data.k, sit = ev.data && ev.data.sit;
          if(ev.id === "ask"        && k){ seen.asks.add(k);  union.asks.add(k); }
          if(ev.id === "word"       && k){ seen.words.add(k); union.words.add(k); }
          if(ev.id === "ludusNight" && sit){ seen.night.add(sit.kind); union.night.add(sit.kind); }
        }
      }
      noteAmb();
      houses.push({ life:w, away,
        over:(d.over && (d.over.kind||d.over)) || "alive",
        seen: Object.fromEntries(Object.keys(TABLES).map(t=>[t, seen[t].size])) });
    }
    return { tag, houses,
      union: Object.fromEntries(Object.keys(TABLES).map(t=>[t, union[t].size])),
      missed: Object.fromEntries(Object.keys(TABLES).map(t=>[t, TABLES[t].filter(k=>!union[t].has(k))])) };
  };

  return { sizes: Object.fromEntries(Object.entries(TABLES).map(([t,k])=>[t, k.length])),
           reactive: arm(false, "REF"), engaged: arm(true, "ENG") };
}, [H, W, MOST]);

if(out.why){ console.log("PROBE COULD NOT RUN: " + out.why); }
else {
  const T = Object.keys(out.sizes);
  const BANDS = [[0,30,"died inside 30w"],[30,60,"30-60w"],[60,120,"60-120w"],
                 [120,250,"120-250w"],[250,9999,"past 250w"]];
  const med = a => a.length ? a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)] : 0;
  const pc = (a,b) => b ? (a/b*100).toFixed(0) : "0";

  console.log(`\n#282 — HOW MUCH OF THE WRITTEN GAME A HOUSE EVER MEETS`);
  console.log(`the tables counted: ` + T.map(t=>`${t} ${out.sizes[t]}`).join(" · "));

  for(const key of ["reactive","engaged"]){
    const a = out[key];
    const lives = a.houses.map(h=>h.life);
    console.log(`\n  ${key === "reactive" ? "THE REFERENCE PLAYER" : "AN ENGAGED PLAYER — walks every week he can, tours deliberately"}`);
    console.log(`    ${a.houses.length} houses · median life ${med(lives)}w · longest ${Math.max(...lives)}w `
      + `· ${lives.filter(x=>x>=W).length} still standing at ${W}w`);
    console.log(`    the WHOLE RUN between them reached: `
      + T.map(t=>`${t} ${a.union[t]}/${out.sizes[t]}`).join(" · "));
    console.log(`    but one house, by how long it lived:`);
    console.log(`      ${"band".padEnd(17)} ${"n".padStart(3)}  ` + T.map(t=>t.padStart(9)).join(" "));
    for(const [lo, hi, label] of BANDS){
      const g = a.houses.filter(h=>h.life >= lo && h.life < hi);
      if(!g.length) continue;
      console.log(`      ${label.padEnd(17)} ${String(g.length).padStart(3)}  `
        + T.map(t=>{ const m = med(g.map(h=>h.seen[t]));
            return `${m}/${out.sizes[t]}`.padStart(9); }).join(" "));
    }
    const all = a.houses;
    const totSeen = med(all.map(h=>T.reduce((n,t)=>n + h.seen[t], 0)));
    const totAll = T.reduce((n,t)=>n + out.sizes[t], 0);
    console.log(`    the median house meets ${totSeen} of ${totAll} written situations (${pc(totSeen, totAll)}%)`);
    const aw = all.reduce((n,h)=>n+h.away,0), lw = all.reduce((n,h)=>n+h.life,0);
    console.log(`    stood away from Capua on ${pc(aw,lw)}% of its weeks — where 11 of the 36 drawn `
      + `cards refuse to fire (#268)`);
    for(const t of T){ const m = a.missed[t];
      if(m && m.length) console.log(`    ${t}: never reached by ANY of the ${a.houses.length} houses — ${m.join(", ")}`); }
  }
  console.log("");
}

await browser.close(); server.close();
