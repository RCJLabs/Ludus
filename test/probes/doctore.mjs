/* THE DOCTORE'S CLOCK — #251's verify-first, and the item's hypothesis stated as a number.

   The item says he is "furniture with a wage": `makeDoctore` writes name, origin, skill, spec,
   creed, past, fee and wage and NO age, and `d.doctore = null` is written in exactly two places —
   the heir who is the doctore, and `dismissDoctore`. The claim to test is the one in its verify-
   first note: *if no house ever changes doctore for any reason but dismissal, every drill and every
   lesson in the game has been taught by one man.*

   The rope only ever HIRES (`harness.mjs` line ~419, gated on `!d.doctore`) and has no dismissal, so
   under the reference player any change of `doctore.id` is a change the GAME made, not the player.
   That is what makes this measurable at all.

     node test/probes/doctore.mjs [houses] [weeks] [seed]

   Reads no chronicle, so nothing here goes through the week-stamp trap of v3.232.0. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SEED = process.argv[4] || "DOCTORE";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const q = a => { if(!a.length) return null; const s = a.slice().sort((x,y)=>x-y);
    const at = f => s[Math.min(s.length-1, Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), max:s[s.length-1] }; };
  const mark = (o,k,n=1) => { o[k] = (o[k]||0) + n; };

  const sum = {
    houses:H, weeks:0,
    hired:{ houses:0, never:0, firstAt:[] },
    tenure:{ spells:[], closed:0, stillOn:[], changes:0, housesThatChanged:0 },
    empty:{ weeks:0, housesEverEmptyAfterHire:0 },
    /* is there a clock on him at all? */
    clock:{ hasAge:0, hasWeeks:0, weeksAdvanced:0, weeksSpan:[], skillMoved:0, skillSpan:[] },
    /* the two writers of `d.doctore = null` the item names */
    doors:{ heirIsDoctore:0, dismissSeen:0 },
    /* the rival side: the move exists and sets a boolean */
    rivals:{ housesSeen:0, everTrue:0, nonBoolean:0 },
    /* what a house was OFFERED but never took */
    market:{ weeksWithMarket:0, distinctOffered:[] },
    miss:[]
  };
  for(const k of ["hireDoctore","dismissDoctore","makeDoctore","doctoreWeek"])
    if(typeof A[k] !== "function") sum.miss.push(k);

  for(let h=0; h<H; h++){
    const d = A.newGameState("Doc", "clean", `${SEED}-${h}`);
    let curId = null, since = 0, hadOne = false, changed = false, emptyHere = false;
    let firstSkill = null, lastSkill = null, firstWeeks = null, lastWeeks = null;
    const offered = new Set();
    for(let w=0; w<W; w++){
      if(d.over) break;
      try { R.lanista(d); } catch(x){ break; }
      sum.weeks++;
      const doc = d.doctore || null;
      const id = doc ? doc.id : null;
      if(id !== curId){
        if(curId != null){ sum.tenure.spells.push(w - since); sum.tenure.closed++;
          sum.tenure.changes++; changed = true; }
        if(id != null){ if(!hadOne){ hadOne = true; sum.hired.houses++; sum.hired.firstAt.push(w); }
          firstSkill = doc.skill; firstWeeks = doc.weeks; }
        curId = id; since = w;
      }
      if(doc){
        lastSkill = doc.skill; lastWeeks = doc.weeks;
        if(doc.age != null) sum.clock.hasAge++;
        if(doc.weeks != null) sum.clock.hasWeeks++;
      } else if(hadOne){ sum.empty.weeks++; emptyHere = true; }
      /* the market he was picked from, and everyone in it he was picked over */
      const mk = d.doctoreMarket || [];
      if(mk.length){ sum.market.weeksWithMarket++; for(const c of mk) offered.add(c.id); }
      if(d.heir && d.heir.kind === "doctore") sum.doors.heirIsDoctore++;
    }
    if(curId != null) sum.tenure.stillOn.push(Math.max(0, d.week - since));
    if(!hadOne) sum.hired.never++;
    if(changed) sum.tenure.housesThatChanged++;
    if(emptyHere) sum.empty.housesEverEmptyAfterHire++;
    if(firstWeeks != null && lastWeeks != null){
      if(lastWeeks > firstWeeks) sum.clock.weeksAdvanced++;
      sum.clock.weeksSpan.push(lastWeeks - firstWeeks); }
    if(firstSkill != null && lastSkill != null){
      if(lastSkill !== firstSkill) sum.clock.skillMoved++;
      sum.clock.skillSpan.push(lastSkill - firstSkill); }
    sum.market.distinctOffered.push(offered.size);
    /* the rivals live on `d.rivals` — the first cut read `d.houses`, which does not exist, and the
       arm came back a clean 0/0/0 that looked exactly like a finding. That is FAULT SIX's shape in
       a field name rather than a function name, and it is why this arm counts `housesSeen`. */
    for(const r of (d.rivals || [])){
      sum.rivals.housesSeen++;
      if(r.doctore) sum.rivals.everTrue++;
      if(r.doctore != null && typeof r.doctore !== "boolean") sum.rivals.nonBoolean++;
    }
  }
  sum.tenure.spells = q(sum.tenure.spells);
  sum.tenure.stillOn = q(sum.tenure.stillOn);
  sum.hired.firstAt = q(sum.hired.firstAt);
  sum.clock.weeksSpan = q(sum.clock.weeksSpan);
  sum.clock.skillSpan = q(sum.clock.skillSpan);
  sum.market.distinctOffered = q(sum.market.distinctOffered);
  return sum;
}, [H, W, SEED]);

console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
