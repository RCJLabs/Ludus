/* TWO WOMEN, BOTH CALLED HIS WIFE — a conundrum found while measuring #243, not part of it

   (`matron` was free in BOTH directories; checked before writing, in checks and probes.)

   `HOUSEHOLD.wife` is a household-STAFF slot. Its name is "The lanista's wife", its wage is 0, its
   fee is 0, its hire button reads **"She has always been here"**, and its chronicle line is *"NAME
   has been running the domestic half of this house since before there was a ludus in it"*. She is
   drawn from `HH_NAMES`, rolled a skill, and gives the lanista `0.35 * hhSkill` health a week. She
   never quits — `householdWeek`'s leaving clause is gated `k!=="wife"`.

   `d.domus.wife` is somebody else entirely. `resolveMatch` puts her there when the matchmakers call,
   she has her own name and family, and #243 built her three standing ties, a fever that can kill
   her, and two conversations of her own.

   SO A MARRIED HOUSE HAS TWO WOMEN IN IT, BOTH CALLED HIS WIFE, WITH DIFFERENT NAMES, ON TWO PANELS
   OF THE SAME SCREEN — and the household one gives MORE lanista health (0.35 x skill, up to 0.54)
   than the wife he actually married (0.15 x `wifeWarm`). Worse than the duplication: `marryReady`
   asks only `!domusOf(d).wife`, so a man whose household already contains "The lanista's wife" is
   told *"A man alone at the head of a ludus leaves nothing behind but a ledger"* and offered three
   families to choose from. That is the #150 shape — the game saying two contradictory things about
   the same fact — and it is on screen rather than buried.

   WHAT THIS MEASURES, before anything is designed:
     · how many played weeks carry BOTH women, and whether their names differ (they must, drawn from
       different pools);
     · how many weeks the house is told it is a man alone WHILE she stands in the household (which
       stops being a contradiction the moment she stops being called his wife, and is kept as the
       record of how much of the game the fault was on screen for);
     · which arrives first, and whether the household slot stands alone usefully in a house that
       never marries — because if it does, deleting it costs the unmarried house something;
     · and what she is worth: the health she adds, against the health a house actually has, which
       `checks/tenure.mjs` has already measured as a number that barely moves.

   Run: node test/probes/matron.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SEED = process.argv[4] || "MATRON";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const NEED = ["newGameState","domusOf","hasFolk","houseFolk","HOUSEHOLD","HH_KEYS","marryReady",
                "hhSkill","wifeWarm","wifeOf"];
  const miss = NEED.filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), max:s[s.length-1] }; };
  const pc = (v,n) => n ? Math.round(1000*v/n)/10 : 0;

  const run = (seed, want) => {
    const d = A.newGameState("Mt", "clean", seed);
    const row = { weeks:0, bothWeeks:0, folkOnly:0, domusOnly:0, neither:0,
      toldAlone:0, toldAloneWithHer:0, folkAt:null, domusAt:null,
      names:null, sameName:0, folkHealth:[], wifeHealth:[], lanHealth:[] };
    const answer = (ev) => (ev.id === "match" && want === "none")
      ? ((ev.data && ev.data.cands) || []).length : null;   /* the never-marries arm declines */
    for(let w=0; w<W; w++){
      if(d.over) break;
      row.weeks++;
      const dm = A.domusOf(d);
      const her = A.hasFolk(d, "wife") ? A.houseFolk(d).wife : null;
      const mrs = dm.wife || null;
      if(her && row.folkAt == null) row.folkAt = d.week;
      if(mrs && row.domusAt == null) row.domusAt = d.week;
      if(her && mrs){ row.bothWeeks++;
        if(row.names == null) row.names = { folk:her.name, domus:mrs.name };
        if(her.name === mrs.name) row.sameName++; }
      else if(her) row.folkOnly++;
      else if(mrs) row.domusOnly++;
      else row.neither++;
      /* the contradiction, counted: told he is a man alone while she stands in his household */
      if(A.marryReady(d)){ row.toldAlone++; if(her) row.toldAloneWithHer++; }
      /* what each is worth in lanista health a week */
      if(her) row.folkHealth.push(Math.round(0.35 * A.hhSkill(her) * 1000) / 1000);
      if(mrs) row.wifeHealth.push(Math.round(0.15 * A.wifeWarm(d) * 1000) / 1000);
      if(d.lanista) row.lanHealth.push(Math.round(d.lanista.health));
      try { R.lanista(d, { answer }); } catch(e){ break; }
    }
    return row;
  };

  const arms = {};
  for(const want of ["ref", "none"]){
    const rows = [];
    for(let i=0;i<H;i++) rows.push(run(`${SEED}-${i}`, want));
    const weeks = rows.reduce((a,r)=>a+r.weeks,0);
    arms[want] = { houses:H, weeks,
      both:rows.reduce((a,r)=>a+r.bothWeeks,0), bothPct:pc(rows.reduce((a,r)=>a+r.bothWeeks,0), weeks),
      folkOnly:rows.reduce((a,r)=>a+r.folkOnly,0), domusOnly:rows.reduce((a,r)=>a+r.domusOnly,0),
      neither:rows.reduce((a,r)=>a+r.neither,0),
      sameName:rows.reduce((a,r)=>a+r.sameName,0),
      names:rows.filter(r=>r.names).slice(0,3).map(r=>`${r.names.folk} / ${r.names.domus}`),
      toldAlone:rows.reduce((a,r)=>a+r.toldAlone,0),
      toldAloneWithHer:rows.reduce((a,r)=>a+r.toldAloneWithHer,0),
      toldPct:pc(rows.reduce((a,r)=>a+r.toldAloneWithHer,0), Math.max(1,rows.reduce((a,r)=>a+r.toldAlone,0))),
      folkAt:q(rows.filter(r=>r.folkAt!=null).map(r=>r.folkAt)),
      domusAt:q(rows.filter(r=>r.domusAt!=null).map(r=>r.domusAt)),
      housesWithFolk:rows.filter(r=>r.folkAt!=null).length,
      housesWithDomus:rows.filter(r=>r.domusAt!=null).length,
      folkHealth:q(rows.flatMap(r=>r.folkHealth)), wifeHealth:q(rows.flatMap(r=>r.wifeHealth)),
      lanHealth:q(rows.flatMap(r=>r.lanHealth)),
    };
  }
  return arms;
}, [H, W, SEED]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
const f = x => x ? `p10 ${x.p10} · p50 ${x.p50} · p90 ${x.p90}` : "—";
console.log(`TWO WOMEN, BOTH CALLED HIS WIFE — ${H} x ${W}, seed ${SEED}\n`);
for(const [k,a] of Object.entries(out)){
  console.log(`== ${k === "ref" ? "REFERENCE (marries when asked)" : "NEVER MARRIES (declines every match)"} ==`);
  console.log(`  ${a.houses} houses · ${a.weeks} played weeks`);
  console.log(`  BOTH women standing: ${a.both} weeks = ${a.bothPct}% · household only ${a.folkOnly} · married only ${a.domusOnly} · neither ${a.neither}`);
  console.log(`     · names, first three houses: ${a.names.join("  ·  ") || "—"} — the same name on ${a.sameName} of ${a.both} weeks`);
  console.log(`  the match open while she stands in the household: ${a.toldAloneWithHer} of ${a.toldAlone} \`marryReady\` weeks = ${a.toldPct}% — this WAS the contradiction, when the slot was called his wife; it is a matron and a match now`);
  console.log(`  arrivals: the household slot in ${a.housesWithFolk}/${a.houses} houses at ${f(a.folkAt)} · the marriage in ${a.housesWithDomus}/${a.houses} at ${f(a.domusAt)}`);
  console.log(`  worth a week, in lanista health: household ${f(a.folkHealth)} · the wife he married ${f(a.wifeHealth)} — against a health of ${f(a.lanHealth)}\n`);
}
await browser.close(); server.close();
