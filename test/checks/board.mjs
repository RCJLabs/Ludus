/* THE DOCTORE'S BOARD, AND THE DOING THAT LEADS A FACE

   Two changes, one measurement behind each, and each can rot in a way nothing else here would
   catch.

   THE BOARD WAS A CHIP WALL. It already did what "set the week's work in one place" asks — the
   whole yard's regimens on one page, with three bulk verbs over them. The fault was the opposite
   of the one I went looking for: fifteen controls a man, of which one or two are lit. Measured on
   v3.104.0 at 390px wide, sections folded, the gatekeeper hushed:

       3 men   1,208px    52 pressable controls   45 chips,   7 lit
       6 men   1,821px    97                      87 chips,  13 lit
      10 men   2,638px   157                     143 chips,  21 lit

   Eighty-five per cent of the controls on the page a lanista uses to set the week existed to show
   him what he did NOT choose, and the page grew 204px a man. So each man's choosing folds behind
   his choice: the row READS his work and opens his chips on a tap. Nothing is out of reach — the
   same chips, one tap in — which is the promise this check has to keep on both sides.

   AND THE SENTENCE ON THAT ROW WAS WRONG FOR FIVE OF THE EIGHT REGIMENS. `regimenWord` named
   rest, spar, and a "cond" key the step-16 migration renamed to `hill` years ago, then fell
   through to "At the palus · <focus>" for everything else. A man on the weights, the pila, the
   footwork square, the hill or the crowd all read as being at the palus. It survived as a dim
   subtitle under a roster card; it cannot survive as the line a player reads INSTEAD of the chips.

   THE DOING WAS LAST. Measured the same way: villa · The House laid out four shut drawers of
   44-62px and then the one deliberately-open section that holds the only two things you can do
   there — first press at y=872 on an 844px phone, past the fold. Coin & Council did the same at
   726. Both faces open with a reading, which is right; both then made a player scroll past headers
   with nothing behind them to reach the drawer that was left open BECAUSE it is the work. The
   order is the change, and order is exactly what a later edit reshuffles without noticing.

   EVERY PIXEL HERE GOES THROUGH `settle`. `.leaf` turns the page for 420ms on a tab change, and a
   rect taken mid-rotation is the box of the rotated shape — the wrapper reads 143px wide instead
   of 390. That fault is why the two probes behind this check disagreed about the market by 210px
   and why neither was measuring the page. See the note over `settle` in the harness.
*/
import { found, clearAll, tab, forge, settle } from "../harness.mjs";

export const name = "board";
export const describe = "the week's work folds behind the week's work, and the doing leads its face";

const FOLD = 844;                    /* the phone the suite opens */
const REGS = ["palus","weights","pila","sand","hill","spar","crowd","rest"];

const hush = async p => { await tab(p, "men"); await p.waitForTimeout(300);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/i know my trade/i.test((x.innerText||"").trim())); if(b) b.click(); });
  await p.waitForTimeout(300); };

const showFace = async (p, re) => { await p.evaluate(src=>{ const rx=new RegExp(src,"i");
  const c=[...document.querySelectorAll("button[role=tab]")]
    .find(b=>rx.test((b.innerText||"")+" "+(b.getAttribute("aria-label")||""))); if(c) c.click(); }, re);
  await p.waitForTimeout(320); };

/* what a player can actually press: not a section's own summary, not a face chip, not the nav.
   An entry ROW's summary is kept — that is where the armoury and the block put their verbs. */
const FIRST_PRESS = `(()=>{
  const seen = el => { const d=el.closest("details:not([open])");
    if(d){ const s=el.closest("summary"); if(!s || s.parentElement!==d) return false; }
    const q=el.getBoundingClientRect(); return q.width>0 && q.height>0; };
  const wrap = document.querySelector(".scroll > div");
  const top = wrap.getBoundingClientRect().top;
  const btns = [...wrap.querySelectorAll("button")].filter(b=>seen(b)
    && !(b.closest("summary") && b.closest("details.sect")
         && b.closest("summary").parentElement === b.closest("details.sect"))
    && b.getAttribute("role")!=="tab" && !b.closest("[role=tablist]")
    && (b.innerText||"").trim());
  const f = btns[0];
  return { n: btns.length, h: Math.round(wrap.getBoundingClientRect().height),
    y: f ? Math.round(f.getBoundingClientRect().top - top) : null,
    what: f ? (f.innerText||"").split("\\n")[0].trim().slice(0,32) : null };
})()`;

const readBoard = p => p.evaluate(`(()=>{
  const wrap = document.querySelector(".scroll > div");
  const rows = [...wrap.querySelectorAll("details.entry.work")];
  const pressable = [...wrap.querySelectorAll("button")].filter(b=>(b.innerText||"").trim()).length;
  return { h: Math.round(wrap.getBoundingClientRect().height),
    rows: rows.length, pressable,
    chipsInDom: wrap.querySelectorAll("button.chip").length,
    says: rows.map(d=>((d.querySelector(".entryname")||{}).innerText||"").trim()) };
})()`);

const yard = (n, regs) => (A, R, arg) => {
  const d = A.newGameState("Board","clean","BOARD",null);
  d.gold = 40000;
  while(d.gladiators.length < arg.n) d.gladiators.push(A.genGladiator(d, 50));
  if(arg.regs) d.gladiators.forEach((g,i)=>{ g.regimen = arg.regs[i % arg.regs.length]; g.sparWith = null; });
  return d;
};

export async function run({ p, errors }){
  const lines = [], fails = [];
  await found(p, { seed:"BOARD" });
  await clearAll(p);
  await hush(p);

  /* ---- 1. THE WORK IS NAMED — one man on each of the eight regimens ---- */
  await forge(p, yard(), { n: REGS.length, regs: REGS });
  await clearAll(p, 8);
  await hush(p);
  await showFace(p, "doctore|board"); await settle(p);
  const named = await readBoard(p);
  lines.push(`eight men, eight regimens: ${named.says.join(" · ")}`);
  if(named.rows !== REGS.length)
    fails.push(`${named.rows} work rows for ${REGS.length} men — the board is not laying the yard out one row a man`);
  const palusSays = named.says.filter(t=>/palus/i.test(t)).length;
  if(palusSays !== 1)
    fails.push(`${palusSays} of ${named.says.length} rows say "palus" and exactly one man is at it — a regimen with no sentence of its own is falling through to the palus line`);
  if(new Set(named.says).size < REGS.length - 1)
    fails.push(`only ${new Set(named.says).size} distinct sentences across ${REGS.length} regimens — men doing different work are being told they are doing the same work`);

  /* ---- 2. THE CHOOSING FOLDS, AND NOTHING IS LOST ----
     The assertion is the SHAPE of the growth, not a pixel: a board whose pressable controls scale
     with the yard is a chip wall again, whatever its absolute size. The chips must still be in the
     DOM at full count, or folding has become hiding. */
  const grid = [];
  for(const n of [3, 6, 10]){
    await forge(p, yard(), { n });
    await clearAll(p, 8);
    await hush(p);
    await showFace(p, "doctore|board"); await settle(p);
    const r = await readBoard(p);
    grid.push({ n: r.rows, ...r });
    lines.push(`${String(r.rows).padStart(2)} men: ${String(r.h).padStart(5)}px · ${String(r.pressable).padStart(3)} pressable · ${r.chipsInDom} chips still in the page`);
  }
  const [a, , c] = grid;
  if(!a || !c || !a.rows || !c.rows) fails.push("the board did not lay out for one of the three yards");
  else {
    const perMan = (c.pressable - a.pressable) / (c.rows - a.rows);
    lines.push(`the board grows ${perMan.toFixed(1)} pressable controls a man and ${((c.h-a.h)/(c.rows-a.rows)).toFixed(0)}px a man`);
    if(perMan > 3)
      fails.push(`the board grows ${perMan.toFixed(1)} pressable controls for every man in the yard — the choosing is unfolded again (it was 15 a man before v3.105.0, and 1 after)`);
    /* and the chips are still THERE — fifteen a man, just not pressable until asked for */
    const chipsPerMan = (c.chipsInDom - a.chipsInDom) / (c.rows - a.rows);
    if(chipsPerMan < 10)
      fails.push(`only ${chipsPerMan.toFixed(1)} chips a man are in the page — folding has become dropping, and a regimen a player could set is no longer reachable at all`);
  }

  /* ---- 3. AND A ROW STILL OPENS ONTO EVERY CHOICE ---- */
  const opened = await p.evaluate(`(()=>{
    const d = document.querySelector("details.entry.work");
    if(!d) return null;
    d.querySelector("summary").click();
    return null; })()`);
  await p.waitForTimeout(240);
  const one = await p.evaluate(`(()=>{
    const d = document.querySelector("details.entry.work"); if(!d) return null;
    const chips = [...d.querySelectorAll("button.chip")].filter(c=>(c.innerText||"").trim());
    return { open:d.open, n:chips.length, lit:chips.filter(c=>c.classList.contains("on")).map(c=>(c.innerText||"").trim()) };
  })()`);
  lines.push(`tapping one man's work: open=${one&&one.open} · ${one?one.n:0} chips readable · lit ${one?one.lit.join("+"):"—"}`);
  if(!one || !one.open) fails.push("a man's work row did not open when its summary was pressed");
  else {
    if(one.n < 8) fails.push(`an opened work row offers ${one.n} readable chips — the eight regimens are not all there`);
    if(!one.lit.length) fails.push("an opened work row lights nothing — the board is not showing what the man is already set to");
  }

  /* ---- 4. THE DOING LEADS ITS FACE ----
     Both of these faces carry exactly one section that is open on arrival, and it is open because
     it is the only thing to do there. If it is not the first thing under the face's reading, the
     player scrolls past shut headers to reach it. */
  const FACES = [["villa","the house","villa · The House"], ["villa","coin","villa · Coin & Council"]];
  for(const [key, f, label] of FACES){
    if(!await tab(p, key)){ fails.push(`could not reach ${key}`); continue; }
    await showFace(p, f); await settle(p);
    const r = await p.evaluate(FIRST_PRESS);
    lines.push(`${label}: ${r.h}px · first press "${r.what}" at y=${r.y == null ? "—" : r.y} (fold ${FOLD})`);
    if(r.y == null) fails.push(`${label} offers a player nothing to press at all`);
    else if(r.y > FOLD)
      fails.push(`${label} puts its first pressable thing at ${r.y}px on an ${FOLD}px phone — the section that holds the work has fallen back under the shut ones`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
