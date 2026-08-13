/* WHEN A LATE SYSTEM IS LIVE, DOES THE GAME SAY ANYTHING?

   #131 measured that 97.1% of what a year-12 house is shown was available in week one, and the obvious
   next move was to find the late systems with no agenda line and give them one. A grep of the agenda
   function said seven were silent: the primacy, the road to Rome, emigration to the bay, the collegium,
   the household, the master's bench and the lanista's retirement.

   THE GREP WAS WRONG, and it was wrong in the way greps are wrong about a game — it looked in one place.
   There are TWO channels. The agenda is the week's list, and SECT_MARK is a separate vocabulary of eight
   marks — cells, feast, temple, standing, rome, block, collegium, rites — that light a section and are
   carried up to the villa's face chips. Rome and the collegium are both in it. So "silent" has to mean
   silent in BOTH, and that is a question about a running house rather than about the file.

   So: for each late system, a predicate for LIVE taken off the game's own functions, and then, on every
   live week, whether the agenda named it and whether a mark fired. Three numbers per system:
     live        weeks the system was actually available to a playing house
     agenda      of those, weeks any ranked item's label matched it
     mark        of those, weeks sectMark lit for it
   A system live for hundreds of weeks with zeroes in both columns is content the player owns and is
   never told about, which is the shape #131 predicts.

   AND THE REGEX IS THE WEAK PART, so it is not trusted on its own: for every system, the labels seen
   while it was live are collected and the commonest printed. If a system reads as unmatched but a line
   about it is sitting in that list under wording I did not guess, the print will show it. A regex that
   misses is the likeliest fault here and it fails in the direction of the conclusion I already expect,
   which is exactly when to hedge it. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  /* live is taken off the game's own predicates wherever one exists, so the probe cannot invent a
     definition of "available" that the game does not share */
  const SYS = {
    "the ladder":      { live: d => A.canClaimRise(d),            mark:"standing",
                         re: /is there to be taken|rung|census/i },
    "the road to Rome":{ live: d => !!d.romeOffer || A.romeReady(d), mark:"rome",
                         re: /rome|imperial|the emperor/i },
    "the collegium":   { live: d => (!d.collegium && d.gold >= A.COLL_FEE)
                                 || !!(d.collegium && d.collegium.lapsed), mark:"collegium",
                         re: /collegium|burial society|burial club/i },
    /* unhonoured is not on the handle — the first run guarded it away and reported 0 live weeks for a
       system #131 measured at 21% of the year-12 block. d.unburied is the field it reads. */
    "the rites":       { live: d => (d.unburied||[]).length > 0, mark:"rites",
                         re: /buried properly|the rites|the altar/i },
    /* primusEligible takes a GLADIATOR, not a state. Called on the state it is falsy for ever, which is
       how a system got reported as never live rather than as never spoken about. */
    "the primacy":     { live: d => !A.primusMine(d) && (d.gladiators||[])
                                      .some(g=>{ try { return A.primusEligible(g); } catch(e){ return false; } }),
                         mark:null, re: /primus|primacy|first house|foremost|the first of/i },
    /* and the bench is the SMITHS, not a man's mastery — the first regex matched "X has earned his
       mastery" on 95% of weeks and called that the bench being pointed at */
    "the master's bench":{ live: d => A.masterOpen(d),            mark:null,
                         re: /master smiths|commission/i },
    "the household":   { live: d => A.householdCount(d) < A.HH_KEYS.length, mark:null,
                         re: /nobody feeds this house|household|nurses it/i },
    /* bayHolder returns null when there is no bay at all, so "holder is not me" was true every week of
       every house. The bay is live when there IS one and somebody else has it. */
    "the bay":         { live: d => !!(d.bay && A.bayHolder(d) && A.bayHolder(d) !== d.name),
                         mark:null, re: /the bay|the coast|hold the bay/i },
    "the lanista's end":{ live: d => !!(d.lanista && (d.lanista.age >= 58 || d.lanista.health < 45)),
                         mark:null, re: /heir|retire|the chair|no head|failing|name somebody/i },
  };
  const keys = Object.keys(SYS);
  const acc = {};
  for(const k of keys) acc[k] = { live:0, agenda:0, mark:0, urgent:0, labels:{} };
  let weeks = 0, lateWeeks = 0;
  for(let h=0; h<H; h++){
    const d = A.newGameState("Si"+h, "clean", `SILENT-${h}`, null);
    for(let w=0; w<W; w++){
      if(d.over) break;
      weeks++;
      if(d.week > 220) lateWeeks++;
      const rank = A.agendaRanked(d);
      for(const k of keys){
        const S = SYS[k];
        let on = false;
        try { on = !!S.live(d); } catch(e){ on = false; }
        if(!on) continue;
        const a = acc[k];
        a.live++;
        const hit = rank.filter(x=>S.re.test(String(x.label||"")));
        if(hit.length){ a.agenda++; if(hit.some(x=>(x.urgency||0) >= 3)) a.urgent++; }
        if(S.mark){ let m = null; try { m = A.sectMark(d, S.mark); } catch(e){}
          if(m) a.mark++; }
        /* what the week DID say while this was live, so a regex that misses can be caught by eye */
        for(const x of rank){ const L = A.agKey(String(x.label||""));
          a.labels[L] = (a.labels[L]||0) + 1; }
      }
      R.lanista(d);
    }
  }
  return { acc, keys, weeks, lateWeeks, marks:Object.keys(A.SECT_MARK||{}), rope:R.say() };
}, [H,W]);
await browser.close(); server.close();

console.log(`=== WHEN A LATE SYSTEM IS LIVE, DOES THE GAME SAY ANYTHING? ===`);
console.log(`  ${out.weeks} house-weeks played, ${out.lateWeeks} of them past year 12`);
console.log(`  the mark vocabulary is ${out.marks.length} keys: ${out.marks.join(", ")}\n`);
console.log(`  system                 live weeks   agenda names it   a mark fires   urgent`);
for(const k of out.keys){
  const a = out.acc[k];
  const pc = (n) => a.live ? `${(n/a.live*100).toFixed(0)}%` : "-";
  console.log(`  ${k.padEnd(21)} ${String(a.live).padStart(10)}   ${(a.live?`${a.agenda} (${pc(a.agenda)})`:"-").padStart(15)}   `
    + `${(out.acc[k].markable === false ? "no mark exists" : a.live ? `${a.mark} (${pc(a.mark)})` : "-").padStart(12)}   `
    + `${(a.live?pc(a.urgent):"-").padStart(6)}`);
}

console.log(`\n  AND WHAT THE WEEK ACTUALLY SAID while each unmatched system was live — the check on the regex:`);
for(const k of out.keys){
  const a = out.acc[k];
  if(!a.live || a.agenda > a.live * 0.05) continue;
  const top = Object.entries(a.labels).sort((x,y)=>y[1]-x[1]).slice(0, 6);
  console.log(`    ${k} — live ${a.live}w, agenda ${a.agenda}w. Commonest lines in those weeks:`);
  for(const [L,n] of top) console.log(`        ${String(Math.round(n/a.live*100)).padStart(3)}%  ${L.slice(0,58)}`);
}
console.log(`\n  rope: ${out.rope}`);
