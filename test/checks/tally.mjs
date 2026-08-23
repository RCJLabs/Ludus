/* THE LEDGER OF THE DEAD — the one late quantity the week never counted

   #131 measured that 97% of what a year-12 house reads was available in week one and named the gap
   as late content. `asks.mjs` went looking for it CAUSALLY rather than by grep: take a played house,
   perturb one quantity at a time across many late weeks, and diff the week's list either side. Seven
   quantities can be emptied or heaped without the morning list changing a word, and the largest is
   the house's own body count — 54 perturbations, all of which moved the number, none of which moved
   the list. `d.book.killed` was written in one place and read in one: a row on the record sheet
   reading "Killed by your men". By year twelve a house has killed thirty-eight men.

   THE BANDS ARE DERIVED. Total dead in the ledger, 12 houses x 300 weeks: year 1-3 median 5, max
   16; year 3-7 median 11; year 7-12 median 18, p90 27; year 12+ median 21, p90 35. A young house's
   MAXIMUM is 16, so twenty is a number only a long game reaches, and thirty is p90 of year 7-12 and
   above. The rate runs the other way — 13.6 a hundred bouts early against 9.1 late — which is why
   the bands are on the total and not the appetite.

   WHAT THIS HOLDS:
     LATE. Nothing at nineteen dead. A row that a founding could raise is not late content.
     BOTH BANDS. Twenty speaks, and thirty speaks again with its own key — otherwise the second
       crossing is swallowed as a repeat of the first.
     TRUE. The sub prints the rate off the same two numbers on the same object. A nudge that
       describes a mechanic the game does not have is worse than saying nothing.
     IT FADES. Each band carries a stable key so `agendaTop` ages it out after AG_FRESH weeks.
       Driven over 8 houses x 300 weeks it stood on 263 weeks and was SHOWN on 28 — 11%. A row about
       a number that only ever rises must not stand for ever; that is what the bay already does, and
       the first probe of this reported 100% shown because it stamped age:0 on every row itself.
*/
import { found, clearAll, hasHandle, inside } from "../harness.mjs";

export const name = "tally";
export const describe = "a house is told what its ledger of dead has come to, once per band, then quiet";

export async function run({ p, errors }){
  const lines = [], fails = [];
  await found(p, { seed:"TALLY" });
  await clearAll(p);
  if(!await hasHandle(p)) return { pass:false, why:"no handle on the page", lines };

  const out = await inside(p, ()=>{
    const A = window.__LVDVS;
    const at = (killed, n) => {
      const d = A.newGameState("Tally","clean","TALLY",null);
      d.week = 200;
      d.book = Object.assign(A.newBook ? A.newBook() : {}, { n, killed, w:Math.round(n*0.6), dead:3, purse:0, crowd:0, rounds:0 });
      const rows = A.agenda(d).filter(r=>/died at your|ledger only runs/i.test(String(r.label||"")));
      return rows.map(r=>({ u:r.urgency, tab:r.tab, dest:r.dest, doc:r.doc, key:r.key,
        t:String(r.label||""), s:String(r.sub||"") }));
    };
    return { none:at(0,200), nine:at(19,200), twenty:at(20,200), thirty:at(31,200),
             ageFresh: A.AG_FRESH != null ? A.AG_FRESH : null };
  });

  const show = r => r.length ? r.map(x=>`u${x.u} ${x.doc||x.tab} "${x.t}" — ${x.s} [key ${x.key}]`).join(" | ") : "(none)";
  lines.push(`no dead at all:  ${show(out.none)}`);
  lines.push(`nineteen dead:   ${show(out.nine)}`);
  lines.push(`twenty dead:     ${show(out.twenty)}`);
  lines.push(`thirty-one dead: ${show(out.thirty)}`);

  /* LATE */
  if(out.none.length)  fails.push("a house that has killed nobody is told about its ledger of dead");
  if(out.nine.length)
    fails.push("nineteen dead raises the ledger row — a young house's maximum is sixteen, so a band below twenty is not late content, it is another perennial line");

  /* BOTH BANDS */
  if(!out.twenty.length) fails.push("twenty dead and the week says nothing — this is the band the measurement put it at");
  if(!out.thirty.length) fails.push("thirty-one dead and the week says nothing");
  if(out.twenty.length && out.thirty.length){
    const k1 = out.twenty[0].key, k2 = out.thirty[0].key;
    if(!k1 || !k2) fails.push("the ledger row carries no key, so `agendaTop` ages it by its sentence — and its sentence carries a number that changes every kill, which resets the age and makes it permanent");
    else if(k1 === k2)
      fails.push(`both bands share the key "${k1}" — the second crossing ages as a repeat of the first and is never shown`);
    if(out.thirty[0].u < out.twenty[0].u)
      fails.push("the second band is quieter than the first");
  }

  /* TRUE */
  for(const r of [...out.twenty, ...out.thirty]){
    const m = r.s.match(/([\d.]+) in every hundred/);
    if(!m){ fails.push(`the ledger row's sub does not carry the rate ("${r.s}")`); continue; }
    const killed = +(r.t.match(/(\d+)/) || [])[1];
    const want = (killed / 200 * 100).toFixed(1);
    if(m[1] !== want)
      fails.push(`the row says ${m[1]} in every hundred against ${killed} of 200 bouts, which is ${want} — the sentence and the ledger disagree`);
  }

  /* IT FADES — the machinery, not the wording */
  if(out.ageFresh == null) lines.push("AG_FRESH is not on the handle; the fade is held by the key assertions above");
  else lines.push(`AG_FRESH is ${out.ageFresh} weeks — a keyed row at urgency under 3 is shown that long and then falls out`);
  for(const r of [...out.twenty, ...out.thirty])
    if(r.u >= 3) fails.push(`the ledger row sits at urgency ${r.u}, which `
      + "`agendaTop` shows for ever regardless of age — this is a reflection, not a thing falling due");

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
