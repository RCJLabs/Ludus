/* #221 — WHAT A MAN GETS FOR HIS FIRST BOUTS, AND WHICH GATES HE NEVER REACHES

   The item: "Man-depth is gated behind careers nobody has. Tells need history, sagas need renown,
   mastery needs wins — and the median career is one bout (#208), so most men never touch any
   man-system. Recommend early texture that fires on bout one: a debut tell, an annals line for a
   first blooding, the doctore's one-sentence read after a first loss."

   ITS PREMISE IS A NUMBER THIS SAME AUDIT ALREADY KILLED. #208's "median career is one bout" was
   the survey's own artifact — 470 fallen summaries counted as zero-bout careers, dragging the
   median from five to one. Corrected and measured twice: the dead man's median career is **4-5
   bouts**, and **88-90% of debut men survive their first**. So "most men never touch any
   man-system" cannot be read off the median career; it has to be measured against the GATES.

   AND TWO OF THE THREE GATES IT NAMES ARE NOT WHAT IT SAYS. `manTells` bands the six stats, an
   injury, an age and a kill count — a man with no bouts at all gets a reading. `masterOpen` is a
   HOUSE gate (`bLevel(armamentarium) >= 2 && acclaim >= 32`), nothing to do with a man's wins. The
   ones that are really career gates are the nickname (5 wins), the signature (6 wins) and the saga
   (8 wins and 40 renown, one man at a time in the whole house).

   So: how far up that ladder does a man actually get, and what does the game say about him on the
   way? Every man who ever stands in the cells, counted on his own row.

     node test/probes/green.mjs 10 320 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 320);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"GREEN" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","activeG","manTells","formOf","FORM_TELL","canLearnSig","SIG_GATE",
                "genGladiator","annalsSync","firstBlood","NIGHTS","teachSigTo","canLearnSig"].filter(k=>A[k]==null);
  if(miss.length) return { miss };
  const pct = n => Math.round(n*1000)/10;
  const q = (a,f) => a.length ? a.slice().sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*f))] : null;

  /* ---- 1 and 2: every man who ever stood in the cells, on his own row ---- */
  const men = new Map();     /* id -> { bouts, wins, nick, sig, saga, lines, firstLineAt, fate } */
  let weeks = 0, houses = 0;
  for(let h = 0; h < H; h++){
    const d = A.newGameState(`GREEN-${h}`, "clean", `GREEN-${h}`);
    houses++;
    let logSeen = 0;
    for(let w = 0; w < W && !d.over; w++){
      weeks++;
      for(const g of (d.gladiators||[])){
        const key = `${h}:${g.id}`;
        if(!men.has(key)) men.set(key, { bouts:0, wins:0, nick:false, sig:false, saga:false,
          lines:0, firstAt:null, name:g.name, status:g.status, night:false });
        const m = men.get(key);
        m.bouts = (g.wins||0) + (g.losses||0);
        m.wins = g.wins||0;
        m.status = g.status;
        if(g.nick) m.nick = true;
        if(g.signature) m.sig = true;
        if(d.saga && d.saga.gid === g.id) m.saga = true;
        if(g.nights && g.nights.first) m.night = true;
      }
      /* the chronicle lines written this week, attributed to the man they name */
      const fresh = (d.log||[]).slice(0, Math.max(0, (d.log||[]).length - logSeen));
      logSeen = (d.log||[]).length;
      for(const l of fresh){
        const txt = String((l && l.text) || l || "");
        for(const g of (d.gladiators||[])){
          if(!g.name || !txt.includes(g.name)) continue;
          const m = men.get(`${h}:${g.id}`); if(!m) continue;
          m.lines++;
          if(m.firstAt == null) m.firstAt = (g.wins||0) + (g.losses||0);
        }
      }
      try { R.lanista(d, {}); } catch(e){ break; }
    }
  }

  const all = [...men.values()];
  const fought = all.filter(m=>m.bouts > 0);
  const bouts = all.map(m=>m.bouts), wins = all.map(m=>m.wins);
  const share = f => pct(all.filter(f).length / Math.max(1, all.length));
  const ladder = [
    ["stood in the cells",      () => true],
    ["fought once",             m => m.bouts >= 1],
    ["fought twice",            m => m.bouts >= 2],
    ["won once",                m => m.wins >= 1],
    ["5 wins — a nickname",     m => m.wins >= 5],
    ["6 wins — a signature",    m => m.wins >= 6],
    ["8 wins — a saga's gate",  m => m.wins >= 8],
  ].map(([w,f]) => ({ w, n: all.filter(f).length, pc: share(f) }));
  const got = [
    ["a first afternoon", m => m.night],
    ["a nickname",  m => m.nick],
    ["a signature", m => m.sig],
    ["a saga",      m => m.saga],
  ].map(([w,f]) => ({ w, n: all.filter(f).length, pc: share(f) }));

  /* what the chronicle said about him, by how far he got */
  const band = (lo, hi) => { const v = all.filter(m=>m.bouts >= lo && m.bouts <= hi);
    return { n:v.length, lines: v.length ? Math.round(v.reduce((s,m)=>s+m.lines,0)/v.length*10)/10 : 0 }; };

  /* ---- 3: is a tell really history-gated? ---- */
  const green = (()=>{ const d = A.newGameState("GREEN-T", "clean", "GREEN-T");
    const g = A.genGladiator(d, 55); g.wins = 0; g.losses = 0; g.kills = 0; g.pfame = 0;
    const t = A.manTells(d, g);
    const veteran = A.genGladiator(d, 55); veteran.wins = 12; veteran.losses = 4; veteran.kills = 3;
    veteran.pfame = 70;
    return { fresh:t.length, freshFirst:t[0], vet:A.manTells(d, veteran).length,
      form:A.formOf(g), tell:A.FORM_TELL }; })();

  /* ---- 4: the signature, which no rope had ever taught ---- */
  let sig = { men:0, taught:0 };
  { for(let h = 0; h < 3; h++){
      const d = A.newGameState(`GREEN-S${h}`, "clean", `GREEN-S${h}`);
      const seen = new Set();
      for(let w = 0; w < 200 && !d.over; w++){
        for(const g of A.activeG(d)) if(g.signature || g.teaching) seen.add(g.id);
        try { R.lanista(d, { signature:true }); } catch(e){ break; }
      }
      sig.taught += seen.size;
      sig.men += (d.gladiators||[]).length; } }

  return { houses, weeks, sig, men:all.length, fought:fought.length,
    boutMid:q(bouts,0.5), boutP90:q(bouts,0.9), winMid:q(wins,0.5), winP90:q(wins,0.9),
    ladder, got, green,
    bands: [["0 bouts",0,0],["1 bout",1,1],["2-3",2,3],["4-7",4,7],["8+",8,999]]
      .map(([w,lo,hi])=>Object.assign({ w }, band(lo,hi))) };
}, [H, W]);

if(out.miss){ console.log("handle is missing:", out.miss.join(", ")); }
else {
  console.log(`\n#221 — what a man gets for his first bouts, and which gates he never reaches`);
  console.log(`${out.houses} houses · ${out.weeks} weeks · ${out.men} men ever in the cells, ${out.fought} of whom fought\n`);
  console.log(`career: median ${out.boutMid} bouts (p90 ${out.boutP90}) · median ${out.winMid} wins (p90 ${out.winP90})\n`);
  console.log(`HOW FAR UP THE LADDER A MAN GETS:`);
  for(const r of out.ladder) console.log(`  ${r.w.padEnd(24)} ${String(r.n).padStart(5)}  ${String(r.pc).padStart(5)}%`);
  console.log(`\nAND WHAT HE ACTUALLY ENDS UP WITH:`);
  for(const r of out.got) console.log(`  ${r.w.padEnd(24)} ${String(r.n).padStart(5)}  ${String(r.pc).padStart(5)}%`);
  console.log(`\nCHRONICLE LINES NAMING HIM, by how far he got:`);
  for(const b of out.bands) console.log(`  ${b.w.padEnd(10)} ${String(b.n).padStart(5)} men · ${b.lines} lines each`);
  console.log(`\nIS A TELL HISTORY-GATED? a man with no bouts at all gets ${out.green.fresh} tell(s) `
    + `— "${out.green.freshFirst}" — against ${out.green.vet} for a veteran of sixteen`);
  console.log(`his form reads ${out.green.form} against a tell threshold of ${out.green.tell}`);
  console.log(`\nAND THE SIGNATURE, with a rope that has a button for it: ${out.sig.taught} men taught `
    + `across three houses (it was 0 in ${out.men} men before the lever existed)`);
}
await browser.close(); server.close();
