/* EVERY HOUSE HAS COLOURS AND A MARK — audit item #249, phase 1.

   (`crest` was free in both directories; checked before writing.)

   `crest` — c1/c2/sym/motto, `HOUSE_COLOURS`, `CREST_SYMS` — was built for the player and used by
   nobody else: every `c1:` site in the file was the player's own. `LANISTAE` carried a name, a
   trait, a blurb and six behavioural multipliers and no colours at all, so THE HOUSES OF CAPUA was
   nine rows of text and the only way to tell Vettius from Varro at a glance was to read.

   THE SIZE IS THE WHOLE PROBLEM, and it is why this check is mostly arithmetic. In the league row
   the shield is 14px beside a name; at that size the SYMBOL is barely legible and the ground colour
   is all the eye gets. So the nine grounds have to be separable as colours, and "they look
   different to me" is not a measurement — the first cut put Tullius on deep blue `#3a5668` and
   Varro on slate `#3f5f74`, which is one shield twice, and only a screenshot caught it. Solving
   the assignment on a green-weighted RGB distance then caught two more the eye had not: the
   fallback was iron, which is Vettius's ground EXACTLY (distance 0.0), so an unnamed house would
   have worn a named one's colours; and Pollio on blood sat 45.1 from the player's own oxblood.

   FOUR ARMS. Three are read off the table, one off the rendered league.

   1 · EVERY HOUSE HAS ONE, and it is drawn from the vocabulary that already exists — a colour from
       `HOUSE_COLOURS`, a symbol from `CREST_SYMS`. A crest outside those is a colour nobody named.
   2 · AND NO TWO ARE THE SAME SHIELD. Every pair of grounds — the nine, the player's default and
       the fallback — at least SEP apart. This is the arm that would have caught the first cut.
   3 · AND NOBODY WEARS THE PLAYER'S OWN. Not the exact triple, whatever the distances say.
   4 · AND THE LEAGUE ACTUALLY DRAWS THEM: one shield per row on THE HOUSES OF CAPUA, the player's
       included, read off the rendered DOM rather than off the table it came from. */
import { found, clearAll, installRope, tab, settle } from "../harness.mjs";

const SEP = 45;   /* green-weighted RGB distance; measured minimum 50.2 across all eleven grounds */

export const name = "crest";
export const describe = "every house in the bay has its own colours, and no two are the same shield";

export async function run({ p, errors }){
  const lines = [], bad = [];

  /* 1-3 · the table, read straight off the handle */
  const t = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["LANISTAE","lanistaOf","crestOf","HOUSE_COLOURS","CREST_SYMS"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const names = Object.keys(A.LANISTAE);
    const cols = A.HOUSE_COLOURS.map(c=>Array.isArray(c) ? c[0] : c);
    const set = names.map(n=>({ n, ...A.crestOf(n) }));
    set.push({ n:"(the fallback)", ...A.crestOf("__no_such_house__") });
    set.push({ n:"(the player's default)", c1:"#8d3b2c", c2:"#c99a4b", sym:"gladius" });
    return { names, cols, syms:A.CREST_SYMS, set,
      missing: names.filter(n=>!A.LANISTAE[n].crest) };
  });
  if(t.why) return { pass:false, why:t.why, lines };

  const rgb = h => { const x = String(h||"").replace("#",""); return [0,2,4].map(i=>parseInt(x.slice(i,i+2),16)); };
  const dist = (a,b) => { const [r1,g1,b1] = rgb(a), [r2,g2,b2] = rgb(b);
    return Math.round(Math.sqrt((r1-r2)**2*2 + (g1-g2)**2*4 + (b1-b2)**2*3)*10)/10; };

  lines.push(`${t.names.length} houses, ${t.set.length} grounds counting the player's and the fallback`);
  /* 1 */
  if(t.missing.length)
    bad.push(`${t.missing.join(", ")} ${t.missing.length===1?"has":"have"} no crest — a house without colours is a `
      + `row of text, which is the state #249 was filed about`);
  for(const c of t.set){
    if(c.n.startsWith("(")) continue;
    if(!t.cols.includes(c.c1)) bad.push(`${c.n}'s ground ${c.c1} is not one of \`HOUSE_COLOURS\` — the palette is the vocabulary and a colour outside it is one nobody named`);
    if(!t.cols.includes(c.c2)) bad.push(`${c.n}'s mark ${c.c2} is not one of \`HOUSE_COLOURS\``);
    if(!t.syms.includes(c.sym)) bad.push(`${c.n}'s symbol "${c.sym}" is not one of \`CREST_SYMS\` — \`Crest\` falls back to a gladius for anything it does not know, silently`);
  }
  /* 2 */
  const pairs = [];
  for(let i=0;i<t.set.length;i++) for(let j=i+1;j<t.set.length;j++)
    pairs.push({ d:dist(t.set[i].c1, t.set[j].c1), a:t.set[i].n, b:t.set[j].n });
  pairs.sort((x,y)=>x.d-y.d);
  const worst = pairs[0];
  lines.push(`  the closest two grounds are ${worst.a} and ${worst.b} at ${worst.d} `
    + `[floor ${SEP}; measured 50.2 — the first cut had two at 28.4 and the fallback at 0.0 from Vettius]`);
  for(const q of pairs.filter(x=>x.d < SEP))
    bad.push(`${q.a} and ${q.b} are ${q.d} apart [floor ${SEP}] — at 14px in the league row the symbol is `
      + `barely legible and the ground is all the eye gets, so two houses this close are one shield twice`);
  /* 3 */
  for(const c of t.set){
    if(c.n.startsWith("(")) continue;
    if(c.c1 === "#8d3b2c" && c.c2 === "#c99a4b" && c.sym === "gladius")
      bad.push(`${c.n} wears the player's own default oxblood-and-gold gladius — whatever the distances say, `
        + `a rival must not be dressed as the house the player started in`);
  }

  /* 4 · and the league draws them */
  await found(p, { seed:"CREST-1" });
  await clearAll(p, 10);
  await installRope(p);
  await p.evaluate(()=>{ const A = window.__LVDVS, R = window.__ROPE;
    const d = A.newGameState("Crest", "clean", "CRESTCHK");
    for(let w=0; w<70; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
    const keys = Object.keys(localStorage).filter(q=>/ludus-slot-\d/.test(q));
    const b = JSON.stringify(d); for(const k of keys) localStorage.setItem(k, b);
    const st = window.storage; if(st && !st.__crestShut){ const real = st.set.bind(st);
      st.set = (k,v)=>/ludus-slot-\d/.test(k)?Promise.resolve({key:k,value:v}):real(k,v); st.__crestShut = true; } });
  await p.reload({ waitUntil:"domcontentloaded" });
  await p.waitForTimeout(1100);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>/take up the keys/i.test(x.innerText||"")); if(b) b.click(); });
  await p.waitForTimeout(1100);
  await clearAll(p, 10);
  await tab(p, "villa"); await p.waitForTimeout(500); await clearAll(p, 8); await settle(p);
  await p.evaluate(()=>{ for(const d of document.querySelectorAll("details")) d.open = true; });
  await p.waitForTimeout(300);
  const opened = await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/^the houses(\n|$)/i.test((x.innerText||"").trim())); if(b){ b.click(); return true; } return false; });
  await p.waitForTimeout(900); await settle(p);
  const seen = await p.evaluate(()=>{
    const panel = [...document.querySelectorAll(".panel")].find(x=>/League of Capua/i.test(x.innerText||""));
    if(!panel) return { why:"the league panel is not on screen" };
    const rows = [...panel.querySelectorAll('[class*="rowname"]')];
    return { rows: rows.length,
      withCrest: rows.filter(r=>r.querySelector('svg[viewBox="0 0 100 114"]')).length,
      fills: [...new Set([...panel.querySelectorAll('svg[viewBox="0 0 100 114"] path[fill]')]
        .map(x=>x.getAttribute("fill")).filter(f=>f && f.startsWith("#")))] };
  });
  if(seen.why){ bad.push(`${seen.why} — arm 4 could not run${opened?"":" (the sheet did not open)"}`); }
  else {
    lines.push(`  the rendered league: ${seen.withCrest} of ${seen.rows} rows carry a shield · `
      + `${seen.fills.length} distinct grounds on screen`);
    if(seen.rows && seen.withCrest < seen.rows)
      bad.push(`${seen.rows - seen.withCrest} of ${seen.rows} league rows have no shield — the table is back to `
        + `being names and numbers for those houses`);
    if(seen.withCrest > 1 && seen.fills.length < 2)
      bad.push(`every shield in the league is drawn in the same colour (${seen.fills.join(", ")}) — the crests are `
        + `rendering but not reading their house, which looks like the feature working and is not`);
  }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`nine houses, nine shields, and no two the same`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
