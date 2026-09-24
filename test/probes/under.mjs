/* WHAT PUTS A HOUSE UNDER THE LINE — #312

     node test/probes/under.mjs [houses a seed set] [weeks] [seed sets] [rope options as JSON]
     DUMP=/path/to/out.json node test/probes/under.mjs     # every dead house's last forty weeks, to slice

   Every coin a house gains or loses, booked to what moved it: each rope call by name, each event by
   key, and the week's end split into the bill's lines and the rest. A wrapper books its own delta LESS
   what wrappers nested inside it booked, so an event run inside the week's end is counted once, as the
   event. Anything that slips through is printed as unattributed; on v3.303.0 nothing did, over 82,449
   house-weeks. Every house that dies of debt is then lined up on the week it went under, and its last
   forty weeks are set against the average house of the same age in the same arm.

   WHAT IT FOUND, v3.303.0, 4 x 40 houses x 420 weeks an arm:
     A staying house's debt death is the cliff #247 described (4,263 in the box ten weeks out, 1,234
     the week before, -1,516 the week of), and the cliff had a name. In the fatal week the dying house
     paid 3,400 in inspector's fines on average, against 68 for a house of its age:
       50 of the 56 paid a fine that week (median 3,077, three quarters of a twelve-week reserve),
       and every one of those 50 weeks would have closed above the creditors' line without it.
     The 11 touring houses that died of debt all died at home, and 5 of them the same way. The
     inspector, the edicts and the heat that brings him are Capua's alone (`awayFromCapua`).

   THE FINE WAS HALF OF IT. The rope answered the week's card LAST, after its own sell step and just
   before `endWeek`, where the game's modal puts it first. Moved to where the game has it (#312), the
   staying houses' debt went 35% -> 12% with nothing else about the policy changed. The other half is
   the card itself, which now counts the fine against the line (`checks/fine.mjs`).

   AND WHAT IS LEFT, v3.304.0: 19 staying houses die of debt, not 56, and 18 of the 19 still paid a
   fine in their last week (median 3,599) that they would have survived without. The sell step
   runs now, and it sold what it could, but a two-man yard cannot raise a fine that size. The
   reference player still answers every card with its first choice, so it pays. A player who reads
   the card's count would let him write it down. That, and the ban it leads to, is the law's share. */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 40), W = +(process.argv[3] || 420);
const SEEDS = (process.argv[4] || "WAGON,SEEDB,SEEDC,SEEDD").split(",");
const EXTRA = process.argv[5] ? JSON.parse(process.argv[5]) : {};
const PAGE = process.env.PAGE || "dist/test.html";
const BACK = 40, BUCKET = 30;
const MOST = Object.assign({ court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true }, EXTRA);

const { server, port } = await serve({ page: PAGE });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST, SEEDS, BACK, BUCKET])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","endWeek","weeklyBill","creditLine","activeG","EVENTS"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const O = {};
  for(const k of Object.keys(A)) if(typeof A[k] === "function") O[k] = A[k];
  const isState = d => d && typeof d === "object" && Array.isArray(d.gladiators) && "gold" in d;
  /* EXCLUSIVE attribution: a wrapper books its own delta LESS whatever wrappers nested inside it
     booked, so an event that runs inside the week's end is counted once, as the event. */
  let cur = null, nested = 0;
  const add = (k, v) => { if(cur && v) cur[k] = (cur[k] || 0) + v; };
  const wrap = (label, fn, split) => function(...args){
    const d = args[0];
    if(!isState(d)) return fn.apply(this, args);
    const pre = split ? split(d) : null;
    const g0 = d.gold, saved = nested; nested = 0;
    let r; try { r = fn.apply(this, args); }
    finally {
      const delta = d.gold - g0, own = delta - nested;
      if(pre){ let bill = 0; for(const [b, v] of Object.entries(pre)){ add(`bill · ${b}`, -v); bill += v; }
        add(`${label} · rest`, own + bill); }
      else add(label, own);
      nested = saved + delta;
    }
    return r; };
  const BILL = ["bUpkeep","workUpkeep","gearUpkeep","liturgy","collDues","hhUpkeep","staffWages"];
  const billParts = d => { const parts = { men: O.activeG(d).reduce((n,g)=> n + (10 + O.seasonUpkeep(d)) * O.pit(d,"upkeep")
      + (g.auctor ? g.auctor.wage : 0), 0) };
    for(const b of BILL){ try { parts[b] = O[b](d) || 0; } catch(e){ parts[b] = 0; } }
    parts.doctore = d.doctore ? O.docWage(d.doctore) : 0;
    return parts; };
  for(const k of Object.keys(O)) A[k] = k === "endWeek" ? wrap("endWeek", O.endWeek, billParts) : wrap(`call · ${k}`, O[k]);
  for(const [k, E] of Object.entries(A.EVENTS)) if(E && typeof E.run === "function") E.run = wrap(`event · ${k}`, E.run);
  const draws = d => (O.ALL_WORK_KEYS ? A.ALL_WORK_KEYS : []).reduce((s,k)=>{ const on = O.workOn && O.workOn(d,k);
    return s + (on && on.owed > 0 ? O.workWeekly(O.workDef(k)) : 0); }, 0);
  const reserve = d => Math.max(700, (O.weeklyBill(d) + draws(d)) * 12);
  const where = d => d.rome ? "rome" : (d.city || d.travel) ? "away" : "home";

  const arm = lever => {
    const base = {};                 /* age bucket -> { weeks, flows } over every house-week */
    const deaths = [], ends = {};
    let unattributed = 0, weeksAll = 0;
    for(const S of SEEDS) for(let i=0;i<H;i++){
      const d = A.newGameState("Un","clean",`${S}-${i}`);
      const opts = Object.assign({}, MOST, lever);
      const ring = [];
      for(let w=0; w<W && !d.over; w++){
        cur = {}; nested = 0;
        const g0 = d.gold, age = w;
        try { R.lanista(d, opts); } catch(e){}
        const flows = cur; cur = null;
        const booked = Object.values(flows).reduce((n,v)=>n+v, 0);
        const miss = (d.gold - g0) - booked; if(Math.abs(miss) > 0.5){ flows["(unattributed)"] = miss; unattributed += Math.abs(miss); }
        weeksAll++;
        const B = (base[Math.floor(age / BUCKET)] = base[Math.floor(age / BUCKET)] || { weeks:0, flows:{} });
        B.weeks++; for(const [k, v] of Object.entries(flows)) B.flows[k] = (B.flows[k] || 0) + v;
        ring.push({ age, flows, gold:Math.round(d.gold), bill:O.weeklyBill(d), line:O.creditLine(d), reserve:reserve(d),
          men:O.activeG(d).length, at:where(d), loan:!!d.loan });
        if(ring.length > BACK) ring.shift();
      }
      const end = d.over ? String(d.over.kind || d.over) : "alive";
      ends[end] = (ends[end] || 0) + 1;
      if(end === "debt") deaths.push({ seed:`${S}-${i}`, week:ring.length ? ring[ring.length-1].age : 0, ring });
    }
    return { base, deaths, ends, unattributed, weeksAll };
  };
  return { stays: arm({ road:false }), tours: arm({ tour:true }) };
}, [H, W, MOST, SEEDS, BACK, BUCKET]);

if(out.why){ console.log("PROBE COULD NOT RUN: " + out.why); await browser.close(); server.close(); process.exit(0); }
const fs = await import("node:fs");
if(process.env.DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify(out));
const med = a => { if(!a.length) return NaN; const s = a.slice().sort((x,y)=>x-y); return s[s.length>>1]; };
const q = (a, f) => { if(!a.length) return NaN; const s = a.slice().sort((x,y)=>x-y); return s[Math.min(s.length-1, Math.floor(s.length*f))]; };
const r0 = x => Number.isFinite(x) ? Math.round(x).toLocaleString("en-US") : "—";
console.log(`UNDER THE LINE — ${SEEDS.length} seed sets x ${H} houses an arm x ${W} weeks · page ${PAGE} · rope extras ${JSON.stringify(EXTRA)}`);
for(const [tag, A] of [["stays", out.stays], ["tours", out.tours]]){
  const D = A.deaths;
  console.log(`\n${tag.toUpperCase()} · ${D.length} debt deaths · ends ${JSON.stringify(A.ends)} · unattributed ${r0(A.unattributed)} over ${A.weeksAll} weeks`);
  if(!D.length) continue;
  const wk = D.map(x=>x.week);
  console.log(`  died in week  p25 ${q(wk,.25)} · median ${med(wk)} · p75 ${q(wk,.75)}`);
  console.log(`  the approach, medians over the dead (week -1 is the week it went under)`);
  console.log(`    ${"".padEnd(8)}${["gold","reserve","bill","line","men"].map(s=>s.padStart(9)).join("")}   where`);
  for(const o of [40,20,10,5,3,2,1]){
    const rows = D.map(x=>x.ring[x.ring.length - o]).filter(Boolean);
    const at = {}; rows.forEach(r=>at[r.at]=(at[r.at]||0)+1);
    console.log(`    ${("-"+o).padEnd(8)}${["gold","reserve","bill","line","men"].map(k=>r0(med(rows.map(r=>r[k]))).padStart(9)).join("")}   ${Object.entries(at).map(([k,n])=>`${k} ${n}`).join(" · ")}`);
  }
  /* flows: the dead's windows against the same-age average house of the same arm */
  const meanAt = (age, k) => { const B = A.base[Math.floor(age / BUCKET)]; return B && B.weeks ? (B.flows[k] || 0) / B.weeks : 0; };
  const cats = new Set(); D.forEach(x=>x.ring.forEach(r=>Object.keys(r.flows).forEach(k=>cats.add(k))));
  const win = (lo, hi) => { const act = {}, exp = {}; let n = 0;
    for(const x of D) for(let o=lo; o<=hi; o++){ const r = x.ring[x.ring.length - o]; if(!r) continue; n++;
      for(const k of cats){ act[k] = (act[k]||0) + (r.flows[k] || 0); exp[k] = (exp[k]||0) + meanAt(r.age, k); } }
    return { act, exp, n }; };
  for(const [lo, hi, label] of [[11, 40, "weeks -40 to -11"], [2, 10, "weeks -10 to -2"], [1, 1, "the last week"]]){
    const { act, exp, n } = win(lo, hi);
    const rows = [...cats].map(k=>({ k, a:act[k]/n, e:exp[k]/n, d:(act[k]-exp[k])/n })).sort((x,y)=>x.d-y.d);
    const tot = rows.reduce((s,r)=>s+r.a, 0), totE = rows.reduce((s,r)=>s+r.e, 0);
    console.log(`  ${label}: net ${r0(tot)} a house-week against ${r0(totE)} for a house that age · the ten largest shortfalls, then the five largest gains`);
    for(const r of rows.slice(0, 10).concat(rows.slice(-5).reverse()))
      console.log(`    ${r.k.padEnd(34)} ${r0(r.a).padStart(8)} vs ${r0(r.e).padStart(7)}   ${(r.d >= 0 ? "+" : "") + r0(r.d)}`);
  }
}
await browser.close(); server.close();
