/* A MAP OF CAMPANIA — audit item #250.

   (`map` was free in both directories; checked before writing.)

   The circuit is three towns with travel weeks, a purse multiplier, a taste, a missio bias, a
   magistrate, a house that has always had the sand, and a standing that bleeds `BAY_DECAY` a week
   you are not there — and until now **nothing spatial existed**: thirty mentions of Campania in the
   file and no drawing. A player choosing where to go read three rows of a table.

   THE ITEM ASKED FOR A PIN THAT DOES NOT EXIST. Its sketch says "a standing letter as a pin", and
   `bayCall` is an event card — made, answered, gone — with no persistent invitation anywhere in the
   state to draw. What is persistent is whose sand it is (`bayPol[k]`: the magistrate, the house that
   has always had that town, its grudge) and `bayHolder`, a rival working the whole coast. Those are
   the pins, and that substitution is the first thing this check holds.

   THREE ARMS, and two of them are #150's rule — a number on the screen and the roll behind it are
   the same call.

   1 · THE MAP IS THERE AND CARRIES THE BAY. One mark per town in `CITY_KEYS`, plus Capua, which is
       not a stop on the circuit but the thing you leave.
   2 · AND EVERY MARK IS LIT BY THE MODEL. Each town's `data-known` must equal `knownIn` rounded —
       the fill is driven off that number, so a mark that is lit by anything else is a drawing that
       has come loose from the game. A town you have never worked and one you own must not read the
       same.
   3 · AND TAPPING ONE OPENS THE LEDGER ROW IT ALREADY HAS, with the travel weeks, the purse
       multiplier and the standing from `CITIES` and `knownIn` — not a second copy of them.
   4 · AND THE CONTESTED RING IS THE MODEL'S, NOT A MOOD. It is drawn exactly where
       `bayPol[k].grudge >= 45`, which is the same gate the panel's own "wants you off this sand"
       line uses. */
import { found, clearAll, installRope, tab, settle } from "../harness.mjs";

export const name = "map";
export const describe = "the bay is drawn, every town is lit by what they know of you, and tapping one says what the ledger says";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"MAP-1" });
  await clearAll(p, 10);
  await installRope(p);

  /* a played house that has worked some of the coast and not all of it */
  const model = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","CITIES","CITY_KEYS","knownIn","cityTier","bayHolder"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const d = A.newGameState("Map", "clean", "MAPCHK");
    for(let w=0; w<160; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
    d.gold = Math.max(d.gold, 4000); d.city = null; d.travel = null;
    /* one town certainly worked and one certainly not, so arm 2 has both ends to tell apart */
    d.known = d.known || {};
    d.known[A.CITY_KEYS[0]] = 74;
    d.known[A.CITY_KEYS[2]] = 0;
    d.bayPol = d.bayPol || {};
    d.bayPol[A.CITY_KEYS[0]] = Object.assign({ mag:"A magistrate", house:"Varro", favor:40 },
      d.bayPol[A.CITY_KEYS[0]] || {}, { grudge:60 });
    const keys = Object.keys(localStorage).filter(q=>/ludus-slot-\d/.test(q));
    const b = JSON.stringify(d); for(const k of keys) localStorage.setItem(k, b);
    const st = window.storage; if(st && !st.__mapShut){ const real = st.set.bind(st);
      st.set = (k,v)=>/ludus-slot-\d/.test(k)?Promise.resolve({key:k,value:v}):real(k,v); st.__mapShut = true; }
    return { keys:A.CITY_KEYS, known:Object.fromEntries(A.CITY_KEYS.map(k=>[k, Math.round(A.knownIn(d,k))])),
      travel:Object.fromEntries(A.CITY_KEYS.map(k=>[k, A.CITIES[k].travel])),
      purse:Object.fromEntries(A.CITY_KEYS.map(k=>[k, A.CITIES[k].purse])),
      name:Object.fromEntries(A.CITY_KEYS.map(k=>[k, A.CITIES[k].name])),
      contested:A.CITY_KEYS.filter(k=>((d.bayPol||{})[k]||{}).grudge >= 45) };
  });
  if(model.why) return { pass:false, why:model.why, lines };

  await p.reload({ waitUntil:"domcontentloaded" });
  await p.waitForTimeout(1100);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>/take up the keys/i.test(x.innerText||"")); if(b) b.click(); });
  await p.waitForTimeout(1100);
  await clearAll(p, 10);
  let drawn = null;
  for(const t of ["arena","ludus","villa","market","familia"]){
    await tab(p, t); await p.waitForTimeout(480); await clearAll(p, 8); await settle(p);
    await p.evaluate(()=>{ for(const d of document.querySelectorAll("details")) d.open = true; });
    await p.waitForTimeout(300);
    drawn = await p.evaluate(()=>{ const m = document.querySelector('svg[data-map="1"]'); if(!m) return null;
      const towns = [...m.querySelectorAll("g[data-town]")].map(g=>({ k:g.getAttribute("data-town"),
        known:g.getAttribute("data-known"), pin:!!g.querySelector("[data-pin]"), taps:g.querySelectorAll('[role="button"]').length }));
      return { towns, tab:null }; });
    if(drawn){ drawn.tab = t; break; }
  }
  if(!drawn) return { pass:false, why:"no map is drawn on any tab — #250's whole deliverable is one drawing", lines };

  const stops = drawn.towns.filter(t=>t.k !== "capua");
  lines.push(`the map is on the ${drawn.tab} tab: ${drawn.towns.length} marks — ${drawn.towns.map(t=>t.k).join(", ")}`);
  /* 1 */
  for(const k of model.keys)
    if(!drawn.towns.some(t=>t.k === k))
      bad.push(`${model.name[k]} is not on the map — \`CITY_KEYS\` has ${model.keys.length} towns and the drawing must carry all of them`);
  if(!drawn.towns.some(t=>t.k === "capua"))
    bad.push(`Capua is not on the map — it is not a stop on the circuit, it is the thing you leave, and the three towns have no meaning drawn without it`);
  /* 2 */
  lines.push(`  what the marks are lit by: ${stops.map(t=>`${t.k} ${t.known}`).join(" · ")} `
    + `[the model says ${model.keys.map(k=>`${k} ${model.known[k]}`).join(" · ")}]`);
  for(const t of stops){
    if(t.known == null){ bad.push(`${t.k}'s mark carries no \`data-known\` — the fill is driven off that number and nothing can check it`); continue; }
    if(+t.known !== model.known[t.k])
      bad.push(`${t.k}'s mark says the town knows you ${t.known} and \`knownIn\` says ${model.known[t.k]} — the drawing has come `
        + `loose from the model, which is the one thing a map must never do (#150)`);
    if(!t.taps)
      bad.push(`${t.k} has no tap target — the item's single step ends "tapping a town opens the ledger row it already has"`);
  }
  /* 4 */
  const pinned = stops.filter(t=>t.pin).map(t=>t.k).sort();
  lines.push(`  contested: ${pinned.join(", ") || "none"} [the model says ${model.contested.join(", ") || "none"}]`);
  if(pinned.join() !== model.contested.slice().sort().join())
    bad.push(`the map rings ${pinned.join(", ")||"nothing"} as contested and \`bayPol[k].grudge >= 45\` holds for `
      + `${model.contested.join(", ")||"nothing"} — the ring is supposed to BE that gate, not a second opinion about it`);

  /* 3 · tap one and read the row */
  const want = model.keys[0];
  await p.evaluate((k)=>{ const t = document.querySelector(`g[data-town="${k}"] [role="button"]`);
    if(t) t.dispatchEvent(new MouseEvent("click", { bubbles:true })); }, want);
  await p.waitForTimeout(500);
  const row = await p.evaluate(()=>{ const el = document.querySelector("[data-mappick]");
    return el ? { k:el.getAttribute("data-mappick"), text:(el.innerText||"").replace(/\s+/g," ") } : null; });
  if(!row) bad.push(`tapping ${model.name[want]} opened no ledger row — that is the half of the item that makes the drawing a control rather than a picture`);
  else {
    lines.push(`  tapped ${row.k}: ${row.text.slice(0, 110)}`);
    if(row.k !== want) bad.push(`tapping ${want} opened ${row.k}'s row`);
    if(!row.text.includes(`${model.travel[want]}wk`))
      bad.push(`${model.name[want]}'s row does not carry its travel weeks (${model.travel[want]}wk) from \`CITIES\``);
    if(!row.text.includes(`×${model.purse[want].toFixed(2)}`))
      bad.push(`${model.name[want]}'s row does not carry its purse multiplier (×${model.purse[want].toFixed(2)}) from \`CITIES\``);
    if(!row.text.includes(`${model.known[want]}/100`))
      bad.push(`${model.name[want]}'s row says a standing the model does not — \`knownIn\` reads ${model.known[want]}`);
  }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`Capua, the three towns, the sea below the coast, and every mark lit by the model`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
