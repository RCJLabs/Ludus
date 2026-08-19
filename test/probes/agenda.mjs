/* THE GAME'S OWN TO-DO LIST, AND WHETHER IT EVER MENTIONS THE GAME — #161

   #161 listed six as dark — `agAgeBy`, `agWord`, `agendaCan`, `agendaGods`, `agendaSquare`,
   `agendaTick` — and noted that two of them ARE #144's repair, shipped with a check (`week`) that
   holds the churn RATE rather than the identity underneath it. Its own clause says this may be a
   coverage artefact, and reading `week` most of it is: it drives `agendaRanked`, `agendaTop`,
   `agendaTick`, `agAge`, `agKey` and `agId`, and holds the churn bar that caught #144. `agAgeBy` is
   reached through `agAge`, which is one line of arithmetic over it.

   So the question worth asking is not coverage. This list is the game's DISCOVERY mechanism — three
   separate comments in the source say a whole system went unfound because "no line in the game
   pointed at it" (the doctrine, in 0 of 5,000 house-weeks; the rival's man, `courted`, in 0 of
   4,908). The agenda is what points. So: over a played campaign, which of its lines does a house
   ever actually see, and which are furniture it is taught to stop reading?

   WHAT IS ASKED:
   · every distinct key the agenda raises over a played campaign, how many weeks it stood, and how
     many of those the panel SHOWED it (`agendaTop`: urgent, or newer than AG_FRESH).
   · the same with the ledger held up, because "never raised" and "raised only for a house that can
     pay for the answer" are different findings.
   · `agWord`'s four bands against what the panel can put on the screen at all — the row prints
     "now" for anything urgent and `agWord(age)` otherwise, and `agendaTop` only shows the
     unurgent while they are fresh, so two of the four bands may be unreachable without expanding
     the list.
   · and the three contributors driven directly, each fired AND each silenced, because a line that
     cannot go quiet is the `agendaCan` fault the source has already priced once.

   INSTRUMENT NOTES:
   · keys, not labels. `agId` is the identity `agendaTick` ages by; counting labels would split one
     item into as many rows as it has phrasings, which is exactly the fault #144 fixed.
   · the panel's own filter is used (`agendaTop` over `agendaRanked`), never a copy of it.
   · three seed prefixes.

   WHAT IT FOUND: #161 IS REFUTED, exactly as its own clause predicted, and the age system is doing
   its job. Over 12 played houses of 420 weeks and 12 more with the ledger held up:

     the collapsed list drew 5,623 of 11,067 rows (50.8%) and the "and N things that have been
       waiting" button stood on 95.3% of weeks, hiding 5,444 rows
     with the button pressed, `agWord`'s four bands split 13.4 / 16.7 / 14.7 / 23.4 per cent of rows
       plus 9.2% urgent — every band reachable
     the pit line #144 repaired ages to 102 weeks now and is shown on 26.1% of the weeks it stands,
       against the 100.0% at an age never above 3 that #144 measured before the fix
     697 distinct lines over the played arm, a median 148 a house
     and the three contributors each fire when the house can act and go quiet when it cannot, and
       for a house that is away

   AND TWO OF MY OWN READINGS DIED ON THE WAY, both of them the probe and not the game.
   · "two of `agWord`'s four bands are dead text — 0 rows of 10,013". They are not: the panel is
     `allTodos ? RANK : TOP` with a button offered whenever anything is waiting, and I had measured
     the COLLAPSED list alone. Read the screen before writing up what it cannot show.
   · "the festival lines carry the churn signature — raised 112 weeks, shown 100%, oldest 0". They
     are NEW every week they appear: a Capuan card stands for exactly one week (weeks 14, 20, 21,
     23, 26 on the first seed), so an age of 0 is the truth about them. A town's card, which does
     stand for several weeks, ages 3 to 7 under the same key. #144's fault is not live here.
   · and a third, smaller: the familia's items can never be in the shown set, because the panel folds
     every `tab:"men"` row into one pointing at the familia. Counting them in `raised` and looking
     for them in `shown` reported two lines "raised 924 weeks, shown 0" as though something were
     broken. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 8), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "AG";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;

  /* ============ ARM A: WHAT A PLAYED HOUSE IS EVER TOLD ============ */
  const arms = [];
  for(const grant of [0, 200000]){
    const seen = {};                 /* key -> { raised, shown, urg3, maxAge, label } */
    /* BOTH VIEWS. The panel is `allTodos ? RANK : TOP` with a button that appears whenever anything
       is waiting, so measuring `agendaTop` alone measures the COLLAPSED list and nothing else. The
       first draft of this probe did exactly that, read "weeks 0 · standing 0" and had two of
       `agWord`'s four bands written up as dead text before I read the panel and found the expand. */
    const mkBands = () => ({ "new this week":0, fresh:0, weeks:0, standing:0, now:0 });
    const bands = mkBands(), full = mkBands();
    let houseWeeks = 0, rows = 0, shownRows = 0, restWeeks = 0, restRows = 0;
    const houses = [];
    for(const pre of [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`]){
      for(let h=0; h<H; h++){
        const d = A.newGameState("Ag"+h, "clean", `${pre}-${h}`, null);
        const mine = new Set();
        for(let w=0; w<W; w++){
          if(d.over) break;
          if(grant) d.gold = Math.max(d.gold, grant);
          R.lanista(d);
          if(!d.lanista) break;
          houseWeeks++;
          let rank = [];
          try { rank = A.agendaRanked(d) || []; } catch(e){ rank = []; }
          /* the panel splits the familia off into one row of its own before it filters */
          const RANK = rank.filter(a=>a.tab !== "men");
          const top = A.agendaTop(RANK);
          const rest = RANK.length - top.length;
          if(rest > 0){ restWeeks++; restRows += rest; }
          const shown = new Set(top.map(a=>A.agId(a)));
          const drawn = (a, into) => { if(a.urgency >= 3){ into.now++; return; }
            const wd = A.agWord(a.age||0);
            if(wd === "new this week") into["new this week"]++;
            else if(wd === "standing") into.standing++;
            else if((a.age||0) <= A.AG_FRESH) into.fresh++;
            else into.weeks++; };
          for(const a of RANK) drawn(a, full);          /* the list with the button pressed */
          /* THE FAMILIA'S ITEMS CAN NEVER BE IN THE SHOWN SET. The panel folds every `tab:"men"`
             item into ONE row pointing at the familia, deliberately and since before this panel.
             The first draft counted them in `raised` and looked for them in `shown`, and duly
             reported two items "raised 924 weeks, shown 0" as though something were broken. */
          for(const a of RANK){
            const k = A.agId(a);
            const e = seen[k] = seen[k] || { raised:0, shown:0, urg3:0, maxAge:0, label:a.label, tab:a.tab };
            e.raised++; e.maxAge = Math.max(e.maxAge, a.age||0);
            if(a.urgency >= 3) e.urg3++;
            if(shown.has(k)) e.shown++;
            mine.add(k);
            rows++;
            if(shown.has(k)){ shownRows++; drawn(a, bands); }
          }
        }
        houses.push({ pre, h, end:d.week, over:d.over?d.over.kind:"alive", keys:mine.size });
      }
    }
    arms.push({ grant, seen, bands, full, houseWeeks, rows, shownRows, restWeeks, restRows, houses });
  }

  /* ============ ARM B: agWord's bands, and which the panel can reach ============ */
  const word = (()=>{
    const rows = [];
    for(const age of [0, 1, 3, 4, 8, 11, 12, 40]) rows.push({ age, say:A.agWord(age) });
    /* what the panel draws: "now" for urgent, agWord otherwise, and agendaTop filters the rest */
    const reach = [];
    for(const age of [0, 1, 3, 4, 8, 12, 40]){
      for(const urg of [1, 2, 3]){
        const item = { urgency:urg, age, tab:"ludus", label:"x" };
        const inTop = A.agendaTop([item]).length > 0;
        reach.push({ age, urg, inTop, drawn: inTop ? (urg>=3 ? "now" : A.agWord(age)) : null });
      }
    }
    return { rows, reach, fresh:A.AG_FRESH };
  })();

  /* ============ ARM C: the three contributors, fired and silenced ============ */
  const contrib = (()=>{
    const base = () => { const q = A.newGameState("Ac","clean",`${SEED}-c`,null); q.week = 40; return q; };
    const fire = (fn, setup) => { const q = base(); setup(q); const got = [];
      try { A[fn](q, (urgency, tab, label, sub, key)=>got.push({ urgency, tab, label, sub, key })); } catch(e){ return { err:e.message }; }
      return { n:got.length, items:got }; };
    const o = {};
    o.can = {
      quiet:  fire("agendaCan", q=>{ q.unrest = 0; q.gold = 0; }),
      broke:  fire("agendaCan", q=>{ q.unrest = 60; q.gold = 0; }),
      fires:  fire("agendaCan", q=>{ q.unrest = 60; q.gold = 90000; }),
      away:   fire("agendaCan", q=>{ q.unrest = 60; q.gold = 90000; q.city = "pompeii"; }),
    };
    o.gods = {
      godless: fire("agendaGods", q=>{ q.piety = 0; }),
      kept:    fire("agendaGods", q=>{ q.piety = 60; q.gold = 0; }),
      hurt:    fire("agendaGods", q=>{ q.piety = 60; q.gold = 90000; q.lastOffering = -99;
                 A.activeG(q).slice(0,2).forEach(g=>{ g.injury = { name:"a cut", weeks:3, care:"rest" }; }); }),
      away:    fire("agendaGods", q=>{ q.piety = 0; q.rome = { travel:0, fought:0, won:0 }; }),
    };
    o.square = {
      none:   fire("agendaSquare", q=>{ q.doctore = null; q.doctoreMarket = []; }),
      market: fire("agendaSquare", q=>{ q.doctore = null; q.gold = 90000;
                q.doctoreMarket = [{ name:"Ictus", fee:900, skill:70 }, { name:"Barca", fee:2200, skill:84 }]; }),
      broke:  fire("agendaSquare", q=>{ q.doctore = null; q.gold = 100;
                q.doctoreMarket = [{ name:"Ictus", fee:900, skill:70 }]; }),
      hired:  fire("agendaSquare", q=>{ q.doctore = { name:"Ictus", skill:70 };
                q.doctoreMarket = [{ name:"Barca", fee:2200, skill:84 }]; }),
      offer:  fire("agendaSquare", q=>{ q.doctore = null; q.doctoreOffer = { name:"Barca", fee:2200 }; }),
    };
    return o;
  })();

  /* ============ ARM D: agAgeBy and agendaTick, the identity underneath ============ */
  const ident = (()=>{
    const q = A.newGameState("Ai","clean",`${SEED}-i`,null); q.week = 50;
    q.flags.agSeen = { "a stable key":44, [A.agKey("A thing with 3 men in it")]:40 };
    const out = {
      declared: A.agAgeBy(q, "a stable key"),
      normalised: A.agAgeBy(q, A.agKey("A thing with 9 men in it")),
      unseen: A.agAgeBy(q, "never raised"),
      idDeclared: A.agId({ key:"mine", label:"a label that rotates" }),
      idFallback: A.agId({ label:"A thing with 7 men in it" }),
    };
    /* and a full tick: raised, kept, forgotten */
    const e = A.newGameState("Aj","clean",`${SEED}-j`,null); e.week = 10;
    A.agendaTick(e);
    const first = Object.keys(e.flags.agSeen||{}).length;
    const wk1 = Object.assign({}, e.flags.agSeen);
    e.week = 15; A.agendaTick(e);
    const kept = Object.entries(e.flags.agSeen||{}).filter(([k,v])=>wk1[k] === v).length;
    const fresh = Object.entries(e.flags.agSeen||{}).filter(([k,v])=>v === 15).length;
    out.tick = { first, kept, fresh, now:Object.keys(e.flags.agSeen||{}).length };
    return out;
  })();

  return { arms, word, contrib, ident, FRESH:A.AG_FRESH };
}, [H, W, SEED]);

const pc = (a,b) => b ? (a/b*100).toFixed(1)+"%" : "—";

for(const arm of out.arms){
  console.log(`\n  ARM A — ${arm.houses.length} houses x 420w${arm.grant ? ", the ledger held up" : ", as the rope plays"}: ${arm.houseWeeks} house-weeks, ${arm.rows} agenda rows, ${arm.shownRows} of them shown (${pc(arm.shownRows, arm.rows)})\n`);
  const rows = Object.entries(arm.seen).sort((a,b)=>b[1].raised - a[1].raised);
  console.log(`  key                                                tab       raised   shown    %shown   urgent   oldest`);
  for(const [k,e] of rows)
    console.log(`  ${k.slice(0,48).padEnd(48)} ${String(e.tab).padEnd(8)} ${String(e.raised).padStart(7)} ${String(e.shown).padStart(7)}  ${pc(e.shown,e.raised).padStart(7)}  ${String(e.urg3).padStart(7)}  ${String(e.maxAge).padStart(6)}`);
  console.log(`\n  distinct lines a house ever saw: ${rows.length} · median per house ${(()=>{const v=arm.houses.map(h=>h.keys).sort((a,b)=>a-b);return v[Math.floor(v.length/2)];})()}`);
  /* ---- THE CHURN SIGNATURE, which is what #144 was ----
     an item that stands for many weeks and reads NEW on nearly all of them has an identity that is
     rotating under it. `week` bars this as a rate; this prints the raw so a near miss is visible. */
  const churn = rows.filter(([,e])=>e.raised >= 20 && e.urg3 === 0 && e.shown/e.raised > 0.6)
    .map(([k,e])=>({ k, raised:e.raised, pc:e.shown/e.raised, oldest:e.maxAge }))
    .sort((a,b)=>b.pc - a.pc);
  console.log(`  the churn signature — stands often, unurgent, and shown anyway (AG_FRESH ${out.FRESH}):`);
  if(!churn.length) console.log(`    none: every unurgent item raised 20 weeks or more is shown on 60% of them or fewer`);
  for(const c of churn.slice(0,8))
    console.log(`    "${c.k.slice(0,44).padEnd(44)}" raised ${String(c.raised).padStart(4)}w · shown ${(c.pc*100).toFixed(0)}% · oldest ${c.oldest}`);
  console.log(`  the COLLAPSED list drew: ` + Object.entries(arm.bands).map(([k,v])=>`${k} ${v} (${pc(v, arm.shownRows)})`).join(" · "));
  console.log(`  with the button pressed: ` + Object.entries(arm.full).map(([k,v])=>`${k} ${v} (${pc(v, arm.rows)})`).join(" · "));
  console.log(`  the "and N things that have been waiting" button stood on ${arm.restWeeks} of ${arm.houseWeeks} weeks (${pc(arm.restWeeks, arm.houseWeeks)}), hiding ${arm.restRows} rows`);
}

console.log(`\n  ARM B — agWord's bands (AG_FRESH ${out.word.fresh}), and what the panel can draw\n`);
for(const r of out.word.rows) console.log(`    age ${String(r.age).padStart(3)} → "${r.say}"`);
console.log(`\n    what a row actually draws, by urgency:`);
console.log(`    age    urgency 1              urgency 2              urgency 3`);
for(const age of [0,1,3,4,8,12,40]){
  const c = u => { const x = out.word.reach.find(r=>r.age===age && r.urg===u); return x ? (x.drawn==null ? "(not shown)" : `"${x.drawn}"`) : "?"; };
  console.log(`    ${String(age).padStart(3)}    ${c(1).padEnd(22)} ${c(2).padEnd(22)} ${c(3)}`);
}

console.log(`\n  ARM C — the three contributors, fired and silenced\n`);
for(const [nm, cases] of Object.entries(out.contrib)){
  console.log(`    agenda${nm[0].toUpperCase()+nm.slice(1)}:`);
  for(const [k,v] of Object.entries(cases))
    console.log(`      ${k.padEnd(9)} ${v.err ? "THREW "+v.err : `${v.n} line${v.n===1?"":"s"}`}` + (v.items && v.items.length ? `  — ${v.items.map(i=>`u${i.urgency} "${i.label}"`).join(" · ")}` : ""));
}

console.log(`\n  ARM D — the identity underneath\n`);
console.log(`    agAgeBy on a declared key first seen in week 44, read in week 50: ${out.ident.declared}`);
console.log(`    on a normalised label first seen in week 40:                     ${out.ident.normalised}`);
console.log(`    on something never raised:                                      ${out.ident.unseen}`);
console.log(`    agId prefers the declared key: "${out.ident.idDeclared}" · and falls back to the normalised label: "${out.ident.idFallback}"`);
console.log(`    agendaTick: ${out.ident.tick.first} keys stamped in week 10 · five weeks later ${out.ident.tick.now} stand, ${out.ident.tick.kept} keeping their first week and ${out.ident.tick.fresh} stamped anew`);

await browser.close(); server.close();
