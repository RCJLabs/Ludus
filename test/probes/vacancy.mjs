/* THE DARK YARD — #242's verify-first, and the item makes it the gate on whether to build at all.

   (`vacancy` was free in BOTH directories; checked before writing.)

   `bayRefill` is the only function that touches a dark yard: it filters `NEW_HOUSES` by the names
   already taken, picks one, and `if(!opts.length) return;`. Nine names, `BAY_FLOOR` 3. So the item
   asks three things and attaches a decision to each:

     · HOW OFTEN and WHEN a yard goes dark — "if yards go dark twice a run at week 200+, this is
       late content and belongs beside #248".
     · WHAT THE MEN WERE WORTH at closing, which is the price phase 1 would put on it.
     · WHETHER THE NINE-NAME POOL EMPTIES — "if the pool empties, the 'stays dark forever' edge is a
       defect on its own", i.e. a fault to fix whatever happens to the rest of the item.

   `closeHouse` already writes a `lineage` carrying the purse, the man COUNT, how it ended and the
   warmth — a comment there names it as #242's price. What it does not carry is what the men were
   worth, so this reads `gladValue` over `h.fighters` at the moment the house closes.

     node test/probes/vacancy.mjs [houses] [weeks] [seed] */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SEED = process.argv[4] || "VACANCY";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 10); await installRope(p);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const q = a => { if(!a.length) return null; const s = a.slice().sort((x,y)=>x-y);
    const at = f => s[Math.min(s.length-1, Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), max:s[s.length-1] }; };
  const T = { houses:H, weeks:0, closed:0, closedAt:[], perHouse:[], endedAs:{},
    /* the price, at the moment it went dark */
    worth:[], purse:[], men:[], fame:[],
    /* the pool, and the dark stretch */
    poolEmpty:0, poolEmptyHouses:0, darkWeeks:0, liveAt:[], refills:0,
    /* the doors the item says are shut */
    lastDarkWeeks:[], soldOn:0, miss:[] };
  for(const k of ["newGameState","closeHouse","lastDark","gladValue","NEW_HOUSES","BAY_FLOOR","liveRivals"])
    if(A[k] == null) T.miss.push(k);

  for(let h=0; h<H; h++){
    const d = A.newGameState("Vac", "clean", `${SEED}-${h}`);
    const seen = new Set(); let mine = 0, emptyHere = false;
    for(let w=0; w<W; w++){
      if(d.over) break;
      /* the worth has to be read BEFORE the week runs, because `closeHouse` keeps only a count and
         a house that closed last week has already had its fighters left where they lie */
      const before = new Map();
      for(const r of (d.rivals||[])) if(!r.retired)
        before.set(r.name, { men:(r.fighters||[]).length,
          worth: (r.fighters||[]).reduce((n,f)=>{ try { return n + A.gladValue(f); } catch(e){ return n; } }, 0),
          fame: Math.round(r.fame||0) });
      try { R.lanista(d); } catch(e){ break; }
      T.weeks++;
      for(const r of (d.rivals||[])){
        if(!r.retired || seen.has(r.name)) continue;
        seen.add(r.name); T.closed++; mine++;
        T.closedAt.push(d.week);
        T.endedAs[r.endedAs || "?"] = (T.endedAs[r.endedAs || "?"] || 0) + 1;
        const b = before.get(r.name);
        if(b){ T.worth.push(Math.round(b.worth)); T.men.push(b.men); T.fame.push(b.fame); }
        if(r.lineage) T.purse.push(r.lineage.purse || 0);
      }
      const live = A.liveRivals(d) || [];
      T.liveAt.push(live.length);
      if(live.length < A.BAY_FLOOR) T.darkWeeks++;
      /* the pool: every NEW_HOUSES key already used up */
      const taken = new Set((d.rivals||[]).map(x=>x.name));
      if(!(A.NEW_HOUSES||[]).filter(x=>!taken.has(x.key)).length){ T.poolEmpty++; emptyHere = true; }
      const ld = A.lastDark(d);
      if(ld) T.lastDarkWeeks.push(1);
    }
    T.perHouse.push(mine);
    if(emptyHere) T.poolEmptyHouses++;
    for(const r of (d.rivals||[])) if(r.lineage && r.lineage.sold) T.soldOn++;
  }
  T.closedAt = q(T.closedAt); T.perHouse = q(T.perHouse); T.worth = q(T.worth);
  T.purse = q(T.purse); T.men = q(T.men); T.fame = q(T.fame); T.liveAt = q(T.liveAt);
  T.lastDarkWeeks = T.lastDarkWeeks.length;
  return T;
}, [H, W, SEED]);

console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
