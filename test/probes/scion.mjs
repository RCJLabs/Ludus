/* #226 — WHETHER THE HOUSE EVER HAS A NEXT GENERATION, AND WHETHER HE IS ANYBODY

   The item: "3 successions in 16 runs, and the heir arrives as a mechanic at the death. The domus
   (wife, children, next of kin) exists from week one and stays procedural. Recommend seeding the
   generation early — the heir as a named character in years 1-3 (at the rail during a card, a first
   opinion, a falling-out) — so succession lands as an arc's end rather than a modal."

   `checks/domus.mjs` already holds every gate in this arc and holds them on a BENCH, by its own
   statement: hand-built states, each branch driven directly, because the claim it makes is about
   six branches of one function. It says nothing about whether a played house ever reaches them,
   which is the whole of what #226 asks.

   THE CLOCK, from the source. `YEAR_WEEKS = 18` and `childAge = floor((week - born)/18)`, so after
   the boy is born the house waits

       126 weeks   his seventh year      `raising` 1
       216 weeks   his twelfth           `raising` 2
       288 weeks   the toga, and the only route to a SCION heir

   and before any of that it has to marry — `marryReady` wants census rung 1 or fame 60, then 10% a
   week — and conceive at 6% a week. So the question is not whether the gates work. It is what the
   house is told about its own blood in the two hundred weeks between the birth and the seventh
   year, and whether a run is ever long enough to reach the end of it.

   This plays houses and counts: when the marriage lands, when each child is born, which beats fire
   and at what week, what heir is named and of what kind, and how many lines the chronicle ever
   spends on any of it. And the gap: the longest silence between one family beat and the next.

     node test/probes/scion.mjs 14 460 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 14), W = +(process.argv[3] || 460);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"SCION" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","domusOf","childAge","YEAR_WEEKS"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  const rows = [];                 /* one per house */
  const beats = {};                /* every family event that fired, by id */
  const kinds = {};                /* heirs named, by kind */
  let weeks = 0, married = 0, bore = 0, kids = 0, heirs = 0, succ = 0, gen2 = 0, yearLines = 0;
  const wedAt = [], bornAt = [], ageReached = [], silences = [], famLines = [];

  for(let h=0; h<H; h++){
    const d = A.newGameState("Scion", "clean", "SCION-"+h, null);
    const row = { h, weeks:0, wed:null, births:[], beats:[], heir:null, succ:null, end:null };
    let lastBeat = null;
    const sil = [];
    for(let w=0; w<W; w++){
      if(d.over) break;
      /* the week's question BEFORE the rope answers it, so a family beat is seen even though
         `pendingEvent` is cleared inside the same step */
      try { R.lanista(d); } catch(e){ break; }
      weeks++; row.weeks++;
      const dm = A.domusOf(d);
      if(dm.wife && row.wed == null){ row.wed = d.week; wedAt.push(d.week); married++;
        row.beats.push(["wed", d.week]); if(lastBeat!=null) sil.push(d.week-lastBeat); lastBeat = d.week; }
      for(const c of (dm.children||[])){
        if(!c.__seen){ c.__seen = 1; row.births.push({ id:c.id, sex:c.sex, born:c.born });
          bornAt.push(c.born); kids++; bore++;
          row.beats.push(["born", c.born]); if(lastBeat!=null) sil.push(c.born-lastBeat); lastBeat = c.born; }
        for(const [k, mark] of [["up1","up1"],["up2","up2"],["grown","toga"],["wed","wedKid"]]){
          if(c[k] && !c["__"+k]){ c["__"+k] = 1; beats[mark] = (beats[mark]||0)+1;
            row.beats.push([mark, d.week]); if(lastBeat!=null) sil.push(d.week-lastBeat); lastBeat = d.week; }
        }
        /* the years between the gates, which are beats too — a line about him, at an age */
        for(const y of Object.keys(c.years||{})){
          if(c["__y"+y]) continue; c["__y"+y] = 1;
          beats["year"+y] = (beats["year"+y]||0)+1; yearLines++;
          const at = c.years[y];
          row.beats.push(["year"+y, at]); if(lastBeat!=null) sil.push(at-lastBeat); lastBeat = at;
        }
      }
      if(d.heir && !row.heir){ row.heir = { kind:d.heir.kind, week:d.week }; heirs++;
        kinds[d.heir.kind] = (kinds[d.heir.kind]||0)+1;
        row.beats.push(["heir", d.week]); if(lastBeat!=null) sil.push(d.week-lastBeat); lastBeat = d.week; }
      if(d.succession && !row.succ){ row.succ = d.week; succ++; }
      if((d.generation||1) > 1 && !row.gen2){ row.gen2 = d.week; gen2++; }
    }
    /* how old the children ever got, and how much of the chronicle was ever about them */
    const dm = A.domusOf(d);
    for(const c of (dm.children||[])) ageReached.push(A.childAge(d, c));
    /* ---- WHAT NOT TO COUNT ----
       An earlier cut counted surviving chronicle lines that mention a child by name. `d.log` is a
       rolling buffer that drops its tail, so that number is "how recently was the family mentioned"
       wearing the label "how often" — it read 2.3 lines a house across a build with 25 family beats
       and 2.8 across one with 103. The beats themselves are counted instead, at the week they land. */
    famLines.push(row.beats.length);
    /* the longest stretch with nothing said about the blood of the house, from the wedding on */
    if(row.wed != null) sil.push(Math.min(d.week, row.weeks) - lastBeat);
    silences.push(sil.length ? Math.max(...sil) : null);
    row.end = d.over ? d.over.kind : "ran out the clock";
    rows.push(row);
  }

  const q = a => { const s = a.filter(v=>v!=null).slice().sort((x,y)=>x-y); if(!s.length) return null;
    return { n:s.length, min:s[0], p50:s[Math.floor(s.length/2)], max:s[s.length-1],
      mean:+(s.reduce((n,v)=>n+v,0)/s.length).toFixed(1) }; };
  return { houses:H, weeks, married, kids, heirs, succ, gen2, beats, kinds, yearLines,
    wedAt:q(wedAt), bornAt:q(bornAt), ageReached:q(ageReached), silence:q(silences),
    famLines:q(famLines), lifespan:q(rows.map(r=>r.weeks)),
    rows: rows.map(r=>({ weeks:r.weeks, wed:r.wed, births:r.births.length, heir:r.heir,
      succ:r.succ, end:r.end, beats:r.beats.length })) };
}, [H,W]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  console.log(`${out.weeks} weeks over ${out.houses} houses · a house lived ${JSON.stringify(out.lifespan)}\n`);
  console.log(`THE MARRIAGE:  ${out.married} of ${out.houses} houses married · ${JSON.stringify(out.wedAt)}`);
  console.log(`CHILDREN:      ${out.kids} born · ${JSON.stringify(out.bornAt)}`);
  console.log(`  the age any of them ever reached: ${JSON.stringify(out.ageReached)}`);
  console.log(`  (the gates are 7, 12 and 16 — 126, 216 and 288 weeks after the birth)\n`);
  console.log(`THE BEATS THAT FIRED:`);
  const all = { year3:"noticed at three", year5:"an opinion at five", up1:"his seventh year",
    year9:"a falling-out at nine", up2:"his twelfth", year14:"nearly somebody at fourteen",
    toga:"the toga (the only road to a scion)", wedKid:"a daughter married" };
  for(const [k,label] of Object.entries(all))
    console.log(`  ${String(out.beats[k]||0).padStart(4)}  ${label}`);
  console.log(`\nTHE HEIR:      ${out.heirs} named` + (Object.keys(out.kinds).length
    ? ` — ${Object.entries(out.kinds).map(([k,v])=>`${k} ${v}`).join(" · ")}` : ""));
  console.log(`SUCCESSION:    raised ${out.succ} times · generation 2 reached ${out.gen2}`);
  console.log(`\nFAMILY BEATS A HOUSE EVER SAW: ${JSON.stringify(out.famLines)}  (${out.yearLines} of them years between the gates)`);
  console.log(`THE LONGEST SILENCE between one family beat and the next: ${JSON.stringify(out.silence)} weeks`);
  console.log(`\nper house:`);
  for(const r of out.rows) console.log(`  ${String(r.weeks).padStart(4)}w  wed ${String(r.wed==null?"never":r.wed).padStart(5)}`
    + ` · ${r.births} born · ${String(r.beats).padStart(2)} beats · heir ${r.heir?`${r.heir.kind}@${r.heir.week}`:"none"}`
    + ` · ${r.end}`);
}
console.log("\n" + JSON.stringify(out));
await browser.close(); server.close();
