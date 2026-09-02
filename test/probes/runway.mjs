/* #229 — HOW LONG A HOUSE IS DYING BEFORE ANYTHING SAYS SO

   The item: "The game's most common death has its instrument buried three taps deep. Debt killed 7
   of 16, and the runway readout — 'the box would carry this house N more weeks' — lives on the
   villa's Coin & Council face, the least-visited place in the game. Recommend the runway surface
   itself where the player lives when it turns short: in the header or the morning report at under
   eight weeks, in blood under four. The number exists; its placement assumes a player who already
   knows he is dying."

   THE SOURCE AGREES BEFORE ANY MEASURING, in two ways the item does not name:

   1. THE NUMBER IS NOT A FUNCTION. It is computed inside the Coin & Council render —
        `const weeks = bill > 0 ? Math.floor((S.gold + owed) / bill) : null;`
      — inside a JSX closure, so nothing else in the program can read it. There is no `runway(d)`
      to put in a header even if somebody wanted to.

   2. THE AGENDA'S ONLY MONEY LINE IS `if(d.gold < 0)`. It speaks about the slide toward the
      creditors' line — "Nd under, and Nd ends it" — which is a sentence for a house that is ALREADY
      past empty. Nothing in the agenda describes the approach.

   So the question is the size of the silence: how many weeks a house spends with a short runway
   before the first thing in the game mentions money at all. This plays houses to their deaths and
   measures exactly that.

     node test/probes/runway.mjs 16 460 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 460);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"RUNWAY" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","weeklyBill","owedTotal","agenda"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  /* the same arithmetic the Coin & Council face does, because there is no function to call */
  const runwayOf = d => { const bill = A.weeklyBill(d);
    return bill > 0 ? Math.floor((d.gold + A.owedTotal(d)) / bill) : null; };
  /* does ANYTHING in the agenda mention money this week? */
  const moneyWord = /\bd\b|denari|box|owed|under|coin|creditor|lender|pay|purse|sell/i;
  /* THE LINES THAT SAY THE HOUSE IS RUNNING OUT. Before v3.173.0 there was exactly one, and it was
     `if(d.gold < 0)` — "Nd under, and Nd ends it" — a sentence for a house already past empty. The
     second is the runway itself, which is the release. Both are counted, so the before and the
     after are the same measurement. */
  const warnWord = /under, and .*ends it|would carry this house|box is empty/i;
  /* and the one that tells a house to SPEND: "Nd in the box, and <a work> unbuilt" */
  const spendWord = /in the box|sitting in the box/i;
  const rowsOf = d => { try { return A.agenda(d) || []; } catch(e){ return []; } };
  const saysWarn  = d => rowsOf(d).some(r => warnWord.test(String(r.label||"") + " " + String(r.sub||"")));
  const saysSpend = d => rowsOf(d).some(r => spendWord.test(String(r.label||"") + " " + String(r.sub||"")));
  const saysMoney = d => { let rows = [];
    try { rows = A.agenda(d) || []; } catch(e){ return false; }
    /* the row is `{ urgency, tab, dest, doc, label, sub, key, act, when }` — LABEL and SUB. The
       first cut read `.title` and `.note`, which are always undefined, so the regex matched nothing
       and the probe reported the agenda silent on 0 of 4,109 weeks including four houses that died
       of debt with the `d.gold < 0` line standing. A number that clean is the instrument. */
    return rows.some(r => moneyWord.test(String(r.label||"") + " " + String(r.sub||"")));
  };

  const ends = {}; let houses = 0, weeks = 0;
  const silent8 = [], silent4 = [], deadRunway = [], firstWord = [];
  const shortWeeks = { under8:0, under4:0, under8Spoken:0, under4Spoken:0,
    under8Warned:0, under4Warned:0, under8Told:0, under4Told:0 };

  for(let h=0; h<H; h++){
    houses++;
    const d = A.newGameState("Runway", "clean", "RUNWAY-"+h, null);
    let first8 = null, first4 = null, firstSpoke = null;
    for(let w=0; w<W; w++){
      if(d.over) break;
      try { R.lanista(d); } catch(e){ break; }
      weeks++;
      const rw = runwayOf(d);
      const spoke = saysMoney(d), warned = saysWarn(d), told = saysSpend(d);
      if(spoke && firstSpoke == null) firstSpoke = d.week;
      if(rw != null && rw < 8){
        shortWeeks.under8++; if(spoke) shortWeeks.under8Spoken++;
        if(warned) shortWeeks.under8Warned++; if(told) shortWeeks.under8Told++;
        if(first8 == null) first8 = d.week;
      }
      if(rw != null && rw < 4){
        shortWeeks.under4++; if(spoke) shortWeeks.under4Spoken++;
        if(warned) shortWeeks.under4Warned++; if(told) shortWeeks.under4Told++;
        if(first4 == null) first4 = d.week;
      }
    }
    const kind = d.over ? d.over.kind : "ran out the clock";
    ends[kind] = (ends[kind]||0) + 1;
    const rw = runwayOf(d);
    if(kind === "debt" || kind === "ruin" || kind === "foreclosed") deadRunway.push(rw == null ? -1 : rw);
    /* the silence: from the first week the runway was short to the first week anything spoke */
    if(first8 != null) silent8.push(firstSpoke == null ? 9999 : Math.max(0, firstSpoke - first8));
    if(first4 != null) silent4.push(firstSpoke == null ? 9999 : Math.max(0, firstSpoke - first4));
    if(firstSpoke != null) firstWord.push(firstSpoke);
  }

  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    return { n:s.length, min:s[0], p50:s[Math.floor(s.length/2)], max:s[s.length-1] }; };
  return { houses, weeks, ends, shortWeeks,
    silent8:q(silent8), silent4:q(silent4), deadRunway:q(deadRunway), firstWord:q(firstWord),
    spoke8: shortWeeks.under8 ? +(shortWeeks.under8Spoken/shortWeeks.under8*100).toFixed(1) : null,
    spoke4: shortWeeks.under4 ? +(shortWeeks.under4Spoken/shortWeeks.under4*100).toFixed(1) : null };
}, [H,W]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  console.log(`${out.weeks} weeks over ${out.houses} houses\n`);
  console.log(`HOW THEY ENDED:`);
  for(const [k,v] of Object.entries(out.ends).sort((a,b)=>b[1]-a[1])) console.log(`  ${String(v).padStart(3)}  ${k}`);
  console.log(`\nTHE RUNWAY WHEN THE HOUSE DIED OF MONEY: ${JSON.stringify(out.deadRunway)}`);
  console.log(`\nWEEKS SPENT WITH A SHORT RUNWAY, AND WHETHER ANYTHING SAID SO:`);
  const pc = (a,b) => b ? (a/b*100).toFixed(1)+"%" : "—";
  const S = out.shortWeeks;
  console.log(`  under 8 weeks of coin: ${S.under8} weeks · money mentioned ${pc(S.under8Spoken,S.under8)}`
    + ` · WARNED it is running out ${pc(S.under8Warned,S.under8)} · told to SPEND ${pc(S.under8Told,S.under8)}`);
  console.log(`  under 4 weeks of coin: ${S.under4} weeks · money mentioned ${pc(S.under4Spoken,S.under4)}`
    + ` · WARNED it is running out ${pc(S.under4Warned,S.under4)} · told to SPEND ${pc(S.under4Told,S.under4)}`);
  console.log(`\nTHE SILENCE — weeks from the runway going short to the first word about money:`);
  console.log(`  from under 8: ${JSON.stringify(out.silent8)}`);
  console.log(`  from under 4: ${JSON.stringify(out.silent4)}`);
  console.log(`  (9999 means the house died and nothing ever said it)`);
}
console.log("\n" + JSON.stringify(out));
await browser.close(); server.close();
