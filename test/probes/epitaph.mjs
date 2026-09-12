/* WHAT A PLAYER IS TOLD ABOUT HOW A HOUSE CAN END — #269's verify-first.

     node test/probes/epitaph.mjs 8 300      # houses, weeks

   #269: "Grep the 53 lessons, the agenda and the feats for each of the twelve ending names and
   confirm which are foreshadowed at all."

   TWO OF THAT SENTENCE'S NUMBERS ARE WRONG BEFORE THE PROBE RUNS.

   **There are 35 lessons, not 53** — the same stale figure #265 corrected in the item that cited it,
   carried forward into this one.

   **And `OVER_TEXT` has THIRTEEN entries while twelve are settable.** Every `d.over = {...}` site in
   the file is enumerated below; `romeFall` is written by none of them, by no dynamic assignment (there
   is no `over.kind =` anywhere and the one parameterised site takes `RUIN_KEYS`), and by nothing in
   test/. It is orphaned text: `romeWeek` carries the comment "the house comes home — Rome is a
   milestone, not the grave", so the ending was retired and its paragraph was left in the table.

   AND A GREP IS THE WRONG INSTRUMENT ANYWAY, in both directions. A lesson that says "free five men
   and there is nobody left to fight" foreshadows `closed` without containing the string; a lesson
   that says "the house is closed to him" contains it and foreshadows nothing. So this collects the
   CORPORA a player actually reads — every lesson, every feat, and every agenda line emitted over
   real played weeks rather than the ones a table suggests — and prints the hits for each ending
   against hand-built term sets. The probe gathers; the judgement is recorded in the release. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 8), W = +(process.argv[3] || 300);

/* the twelve, read off the `d.over = {` sites rather than off OVER_TEXT, which has thirteen */
const SET_AT = {
  foreclosed:"10737", lanistaDied:"13468", banned:"16506 (RUIN_KEYS)", disgrace:"16506 (RUIN_KEYS)",
  ruined:"16506 (RUIN_KEYS)", triumph:"22070", rebellion:"22616", debt:"23240", ruin:"23257",
  emptied:"23259", closed:"23287", oldAge:"26026",
};
/* what each ending IS, in the words a lesson or an agenda line would use for it */
const TERMS = {
  foreclosed:["lender","borrow","loan","principal","foreclos","seize"],
  lanistaDied:["your death","when you die","lanista dies","heir","succession","health"],
  banned:["banned","edict","aedile","licence","struck off","forbidden"],
  disgrace:["disgrace","shame","dishonour","name is filth","nobody will deal"],
  ruined:["ruined","rival","drove you out","finished you"],
  triumph:["triumph","Rome","imperial","retire at the top","walk away"],
  rebellion:["rebellion","rise","rising","revolt","unrest","cells turn"],
  debt:["debt","credit","the ledger","in the red","owe","strongbox is empty"],
  ruin:["ruin","nothing left","no men and no coin"],
  emptied:["empt","idle","nobody to fight","no men","yard stands"],
  closed:["closed","close the house","free","rudis","manumit","let him go","shut"],
  oldAge:["old age","age","hand over","successor","step down","too old"],
};

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["LESSONS","FEATS","FEAT_KEYS","OVER_TEXT","agenda","newGameState"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const lessons = A.LESSONS.map(l=>({ id:l.id, tab:l.tab,
    text:[l.title, l.body, l.text, l.say].filter(Boolean).join(" ") }));
  const feats = A.FEAT_KEYS.map(k=>{ const F = A.FEATS[k];
    return { id:k, text:[F.name, F.line, F.how, F.blurb].filter(Boolean).join(" ") }; });

  /* THE AGENDA CORPUS IS PLAYED, NOT READ OFF A TABLE. Its lines are built per week from live
     state, so the only way to know what a player is ever told is to collect what it actually
     emitted over real weeks. */
  const agenda = {};
  let weeks = 0;
  const overs = {};
  for(let i=0;i<H;i++){
    const d = A.newGameState("Ep","clean",`EPI-${i}`);
    for(let w=0; w<W; w++){
      if(d.over){ overs[d.over.kind] = (overs[d.over.kind]||0)+1; break; }
      weeks++;
      try { for(const it of (A.agenda(d)||[])){
        const key = String(it.label||"");
        agenda[key] = agenda[key] || { n:0, sub:String(it.sub||"") };
        agenda[key].n++;
      } } catch(e){}
      try { R.lanista(d, {}); } catch(e){}
      try { A.endWeek(d); } catch(e){ break; }
    }
  }
  /* ---- AND WHICH ENDINGS EACH POLICY ACTUALLY REACHES ----
     `checks/ends.mjs` records `closed` as NOT REACHABLE ("13 of 23 men standing in six real yards
     could be let go by none of them"), and #269 cites "9 and 11 of 16 houses" under a complete
     player. Both cannot be current. The difference is the `free` lever, which did not exist when
     that note was written — so the arms are run here rather than argued about. */
  const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
    rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true,
    free:true, mastery:true, signature:true, retire:true, tour:true };
  const arm = (opts, tag, n)=>{
    const got = {}; let alive = 0, wk = 0;
    for(let i=0;i<n;i++){
      const d = A.newGameState("Ep","clean",`EPIARM-${tag}-${i}`);
      let w = 0;
      for(; w<W; w++){ if(d.over) break;
        try { R.lanista(d, opts); } catch(e){}
        try { A.endWeek(d); } catch(e){ break; } }
      wk += w;
      if(d.over) got[d.over.kind] = (got[d.over.kind]||0)+1; else alive++;
    }
    return { got, alive, n, weeks:wk };
  };
  /* TWO SEED SETS, because #269's four-never-occur list is exactly the shape of claim this audit
     has had to withdraw half a dozen times off one set. */
  const byPolicy = { "ref/A":arm({}, "A", H), "ref/B":arm({}, "B2", H),
                     "most/A":arm(MOST, "A", H), "most/B":arm(MOST, "B2", H) };

  return { lessons, feats, agenda, weeks, overs, byPolicy,
    overText:Object.keys(A.OVER_TEXT), lessonCount:A.LESSONS.length, featCount:A.FEAT_KEYS.length };
}, [H, W]);

await browser.close(); server.close();
if(out.why){ console.log(out.why); process.exit(1); }

const KINDS = Object.keys(SET_AT);
console.log(`\n#269 — WHAT A PLAYER IS TOLD BEFORE THE END · ${H} houses x ${W} weeks (${out.weeks} played)`);
console.log(`${out.lessonCount} lessons · ${out.featCount} feats · ${Object.keys(out.agenda).length} distinct agenda lines emitted`);
console.log(`OVER_TEXT carries ${out.overText.length} entries; ${KINDS.length} are settable.`);
const orphan = out.overText.filter(k=>!SET_AT[k]);
console.log(`ORPHANED ENDING TEXT: ${orphan.join(", ") || "none"}`);
const missingText = KINDS.filter(k=>!out.overText.includes(k));
console.log(`SETTABLE WITH NO TEXT: ${missingText.join(", ") || "none"}\n`);

const hit = (text, terms) => terms.filter(t=>new RegExp(t, "i").test(text));
console.log(`${"ending".padEnd(12)} ${"lessons".padStart(8)} ${"feats".padStart(6)} ${"agenda".padStart(7)}   where`);
for(const k of KINDS){
  const T = TERMS[k] || [k];
  const L = out.lessons.filter(l=>hit(l.text, T).length);
  const F = out.feats.filter(f=>hit(f.text, T).length);
  const G = Object.entries(out.agenda).filter(([lab, v])=>hit(lab + " " + v.sub, T).length);
  console.log(`${k.padEnd(12)} ${String(L.length).padStart(8)} ${String(F.length).padStart(6)} ${String(G.length).padStart(7)}   ` +
    [...L.map(x=>"L:"+x.id), ...F.map(x=>"F:"+x.id)].slice(0,4).join(" ") || "");
  for(const [lab, v] of G.slice(0,3)) console.log(`${" ".repeat(13)}A: ${lab}${v.sub?" — "+v.sub:""}`.slice(0,150));
}
console.log(`\nendings reached while collecting the agenda: ${Object.entries(out.overs).map(([k,n])=>`${k} ${n}`).join(" · ") || "none"}`);
console.log(`\n---- WHICH ENDINGS EACH POLICY REACHES (${H} houses x ${W} weeks an arm) ----`);
for(const [tag, a] of Object.entries(out.byPolicy)){
  const rows = Object.entries(a.got).sort((x,y)=>y[1]-x[1]).map(([k,n])=>`${k} ${n}`);
  console.log(`${tag.padEnd(5)} ${a.n - a.alive}/${a.n} ended (${a.weeks} weeks) · ${rows.join(" · ") || "none"}${a.alive?` · ${a.alive} still standing`:""}`);
}
