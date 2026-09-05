/* THE SON WHO IS NEVER OLD ENOUGH — and the reference player who never waits for him

   `probes/heirs.mjs` recorded it as a footnote to the tenure item: EVERY heir named is a `nephew`,
   sixteen of sixteen. Two shipped items sit downstream of that. #226 closed the fake-son path (the
   heir was offered on the LANISTA'S own age and never asked whether he had a child); #237 wired
   `nameHeir` to install the real boy, his mentor bond and upbringing traits included. If no played
   house reaches "son", both landed on content nobody sees — and `HEIRS.scion`, the best handover in
   the game (fameKeep 0.86, "the thing simply continues"), is dark with them.

   THE CHAIN, read off the source:

     marry    marryReady: no wife, lanista under 56, rise >= 1 or fame >= 60 — then 10% a week
     bear     wife, under three living kids, wife under 40, 6+ weeks since the last — then 6% a week,
              and the child is male at 52%
     nine     eligibleSons: lanista.age >= 40 AND childAge >= SON_AGE (9) — 9 x YEAR_WEEKS = 162 WEEKS
     sixteen  the toga, which overwrites any heir with `scion` — 288 weeks past the birth

   Against a median house that dies at week 180.

   AND A SECOND SUSPECT, IN THE INSTRUMENT. The rope names an heir here:

       if(on("heir") && !d.heir && !d.succession){
         const opts = fin(A.heirEligible,[d]) || [];
         if(... fin(A.nameHeir,[d, opts[0]])) bump("namedHeir"); }

   `heirEligible` puts "son" first when there is a son and "nephew" always. There is no son in week
   two, so `opts[0]` is "nephew" — and `!d.heir` shuts the gate for the rest of the run. That is the
   exact behaviour #226's banner indicts in the OLD code ("the heir was a mechanic you picked off a
   list before you married, and the real boy arrived to find the job filled") — now performed by the
   reference player instead of by the game. The rope's own comment says it takes the agenda's advice;
   the code does not read the agenda at all.

     1 · REFERENCE — what the rope actually does, and when.
     2 · PATIENT — the rope's naming off, an heir named only when the game warns, son preferred.
     3 · FORCED — a wife and a son handed to the house in week one, so the boy's clock is the only
         clock left. This is the floor: if nine is unreachable here it is unreachable anywhere.

   Run: node test/probes/boy.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 520);
const SEED = process.argv[4] || "BOY";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at = f => s[Math.min(s.length-1, Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), max:s[s.length-1] }; };

  /* one house, played week by week, with every gate in the chain stamped the week it first opens */
  const run = (seed, mode) => {
    const d = A.newGameState("Boy", "clean", seed);
    const row = { wed:null, born:null, sons:0, kids:0, nine:null, nineAge:null, toga:null,
      heir1:null, heir1At:null, heirEnd:null, end:null, endAt:null, marryWeeks:0, wifeWeeks:0 };
    if(mode === "forced"){
      const dm = A.domusOf(d);
      dm.wife = { name:"Prima Vettia", family:"the Vettii", married:1, age:22, from:"merchant" };
      dm.children.push({ id:dm.nextKin++, name:"Lucius Minor", sex:"m", born:1, up:{palus:0,rhetor:0,box:0} });
      dm.lastBorn = 1; row.wed = 1; row.born = 1; row.sons = 1; row.kids = 1;
    }
    const opts = mode === "ref" ? {} : { heir:false };
    for(let w=0; w<W; w++){
      if(d.over) break;
      try { R.lanista(d, opts); } catch(e){ break; }
      /* the patient policy: name one when the game itself says to, and prefer the boy */
      if(mode !== "ref" && !d.heir && !d.succession){
        const L = d.lanista;
        const warned = L && ((L.health||100) < 30 || (L.age||0) >= 58);
        if(warned){ const k = (A.heirEligible(d)||[]); const want = k.includes("son") ? "son" : k[0];
          if(want) A.nameHeir(d, want); }
      }
      const dm = A.domusOf(d);
      if(dm.wife){ row.wifeWeeks++; if(row.wed == null) row.wed = d.week; } else row.marryWeeks++;
      const kids = (dm.children||[]);
      row.kids = kids.length; row.sons = kids.filter(c=>c.sex==="m").length;
      if(row.born == null){ const b = kids.filter(c=>c.sex==="m").sort((a,b)=>a.born-b.born)[0];
        if(b) row.born = b.born; }
      if(row.nine == null && (A.eligibleSons(d)||[]).length){
        row.nine = d.week; row.nineAge = d.lanista ? d.lanista.age : null; }
      if(d.heir && row.heir1 == null){ row.heir1 = d.heir.kind; row.heir1At = d.week; }
      if(row.toga == null && d.heir && d.heir.kind === "scion") row.toga = d.week;
    }
    row.heirEnd = d.heir ? d.heir.kind : null;
    row.end = d.over ? d.over.kind : "survived"; row.endAt = d.week;
    row.forebears = (d.forebears||[]).length;
    return row;
  };

  const arm = (label, mode) => {
    const rows = []; for(let h=0; h<H; h++) rows.push(run(SEED+"-"+h, mode));
    const has = f => rows.filter(f).length;
    const kinds = {}; for(const r of rows){ const k = r.heirEnd || "none"; kinds[k] = (kinds[k]||0)+1; }
    const first = {}; for(const r of rows){ const k = r.heir1 || "none"; first[k] = (first[k]||0)+1; }
    const ends = {}; for(const r of rows){ ends[r.end] = (ends[r.end]||0)+1; }
    return { label, houses:H, weeks:W,
      married: has(r=>r.wed!=null), bore: has(r=>r.born!=null), reachedNine: has(r=>r.nine!=null),
      reachedToga: has(r=>r.toga!=null), succeeded: has(r=>r.forebears>0),
      wedAt: q(rows.filter(r=>r.wed!=null).map(r=>r.wed)),
      bornAt: q(rows.filter(r=>r.born!=null).map(r=>r.born)),
      nineAt: q(rows.filter(r=>r.nine!=null).map(r=>r.nine)),
      togaAt: q(rows.filter(r=>r.toga!=null).map(r=>r.toga)),
      heirNamedAt: q(rows.filter(r=>r.heir1At!=null).map(r=>r.heir1At)),
      endAt: q(rows.map(r=>r.endAt)),
      firstHeirKind: first, endHeirKind: kinds, endings: ends,
      /* the boy's clock against the house's, house by house — the whole question in one column */
      needed: q(rows.filter(r=>r.born!=null).map(r=>r.born + 9*18)),
      rows: rows.map(r=>({ wed:r.wed, born:r.born, nine:r.nine, toga:r.toga,
        h1:r.heir1, at:r.heir1At, hE:r.heirEnd, gen:r.forebears, end:r.end, endAt:r.endAt })) };
  };

  return { YEAR_WEEKS: A.YEAR_WEEKS, SON_AGE: A.SON_AGE,
    arms: [arm("reference (rope names an heir)", "ref"),
           arm("patient (named only when warned, son preferred)", "patient"),
           arm("forced (wife and son in week one)", "forced")] };
}, [H,W,SEED]);
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
