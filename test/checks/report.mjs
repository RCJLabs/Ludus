/* THE REPORT BAR — the morning's business, one tap from anywhere but home

   v3.90.0 docked the morning report above the nav on every tab except ludus, where the same list
   already opens the page. Three promises, each of which can rot silently:

     the bar's COUNT is the agenda's length and its colour is the worst urgency on it — a bar that
       says 6 over a sheet holding 4 is the copied-number fault on a new surface
     a row that names a panel opens it as a document, unfolded, exactly as the desk does
     a row that names none travels to the face it says, and the sheet closes behind it

   Walked on the played pinned morning, like desk and scene.
*/
import { found, tab, clearAll, installRope , forge } from "../harness.mjs";

export const name = "report";
export const describe = "the report bar counts true, and every row opens its paper or travels";

export async function run({ p, errors }){
  const lines = [], fails = [];
  await found(p, { seed:"REACH-1" });
  await installRope(p);
  await forge(p, (A, R) => {
    const d=A.newGameState("Reach","clean","REACH-1",null);
    for(let i=0;i<16;i++){ if(d.over) break; R.lanista(d); }
    return d; }); await clearAll(p, 8);

  await tab(p, "ludus"); await p.waitForTimeout(300);
  /* INVERTED in v3.93.0: THIS WEEK left the home page, so the bar is universal now — a home
     without the bar would mean the week's business is reachable from everywhere EXCEPT the
     place a session starts. */
  const onHome = await p.evaluate(()=>!!document.querySelector(".reportbar"));
  if(!onHome) fails.push("no report bar on the ludus — THIS WEEK left the page in v3.93.0 and the bar is the only door to the week from home");

  await tab(p, "arena"); await p.waitForTimeout(350); await clearAll(p, 4);
  await tab(p, "arena"); await p.waitForTimeout(250); await clearAll(p, 4);
  /* the second arrival can raise a first-visit lesson on the scene-door path, and its modal
     sits later in the DOM than the report sheet -- counting rows in it read "0 rows over an
     agenda of 6". Clear it the way a player would before opening the report. */
  const truth = await p.evaluate(()=>{
    const b=document.querySelector(".reportbar");
    const S = (()=>{ try { return JSON.parse(localStorage.getItem(
      Object.keys(localStorage).find(k=>/ludus-slot-\d/.test(k)))); } catch(e){ return null; } })();
    let n = -1; try { n = (window.__LVDVS.agenda(S)||[]).length; } catch(e){}
    return { bar: b ? (b.getAttribute("aria-label")||"") : null, agendaN: n };
  });
  lines.push(`arena bar: "${truth.bar}" · the agenda holds ${truth.agendaN}`);
  if(!truth.bar) fails.push("no report bar on the arena");
  else if(!truth.bar.includes(String(truth.agendaN)))
    fails.push(`the bar says "${truth.bar}" over an agenda of ${truth.agendaN} — the count is a copied number`);

  await p.evaluate(()=>{ const b=document.querySelector(".reportbar"); if(b) b.click(); });
  await p.waitForTimeout(400);
  const sheet = await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")].pop();
    return w ? [...w.querySelectorAll("button.optrow:not(.leadrow)")].length : -1; });
  lines.push(`the sheet holds ${sheet} rows`);
  /* v3.99.0: the sheet leads with a masthead row — the week that was — which is not an agenda
     item and carries the .leadrow mark so this count stays the agenda's. */
  if(sheet !== truth.agendaN) fails.push(`the sheet holds ${sheet} rows over an agenda of ${truth.agendaN}`);

  const openRow = await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")].pop();
    const b=[...(w?w.querySelectorAll("button.optrow:not(.leadrow)"):[])].find(x=>/open ›/.test(x.innerText||""));
    if(!b) return null; const lab=(b.innerText||"").split("\n")[0]; b.click(); return lab; });
  await p.waitForTimeout(450);
  if(openRow){
    const doc = await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")].pop();
      if(!w) return null; const dets=[...w.querySelectorAll("details")];
      return { open:dets.filter(d=>d.open).length, dets:dets.length }; });
    lines.push(`doc row "${openRow.slice(0,36)}" -> ${doc ? `${doc.open}/${doc.dets} unfolded` : "NOTHING"}`);
    if(!doc || (doc.dets && doc.open !== doc.dets)) fails.push(`the doc row opened ${doc ? "folded" : "nothing"}`);
    await p.evaluate(()=>{ const b=[...document.querySelectorAll(".modalwrap button")]
      .find(x=>/put it down/i.test(x.innerText||"")); if(b) b.click(); });
    await p.waitForTimeout(250);
  } else lines.push("no doc-bearing row this morning (the walk still proves count and travel)");

  await p.evaluate(()=>{ const b=document.querySelector(".reportbar"); if(b) b.click(); });
  await p.waitForTimeout(350);
  const travelled = await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")].pop();
    const b=[...(w?w.querySelectorAll("button.optrow:not(.leadrow)"):[])].find(x=>/›/.test(x.innerText||"") && !/open ›/.test(x.innerText||""));
    if(!b) return null; const lab=(b.innerText||"").split("\n")[0]; b.click(); return lab; });
  await p.waitForTimeout(450);
  if(travelled){
    const st = await p.evaluate(()=>({ modal: !!document.querySelector(".modalwrap"),
      tab: (()=>{ const sh=document.querySelector("[data-place]"); return sh?sh.getAttribute("data-place"):"?"; })() }));
    lines.push(`travel row "${travelled.slice(0,36)}" -> ${st.tab}, sheet ${st.modal?"STILL OPEN":"closed"}`);
    if(st.modal) fails.push("the sheet stayed open behind a journey");
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
