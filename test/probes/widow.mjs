/* THE WIFE WHO CANNOT DIE, AND THE WIDOW WHO CANNOT INHERIT — #243's verify-first

   The item asks three numbers over 16 x 520 before phase 4 is allowed to exist:

     · weeks with a wife (`probes/boy.mjs` already rows `wifeWeeks`);
     · the age she would reach at the house's end;
     · and how many houses would have a WIDOW AND A MINOR on the lanista's death —
       "phase 4 is worth building only if that number is not zero."

   `boy.mjs` answers the first and neither of the others, because it watches the BOY's clock and
   stops at the toga. This watches the marriage's, and it watches the one week that decides phase 4:
   the week `lanistaWeek` reads `L.health <= 0`.

   THAT WEEK IS HARD TO SEE FROM OUTSIDE, which is the whole reason for the shape below. The death
   branch does one of two things and never leaves the evidence standing:

     with an heir named   d.succession is raised — and the reference player TAKES IT UP in the same
                          R.lanista call (harness `on("heir")`), and `succeed` then does
                          `d.domus = { wife:null, children:[], nextKin:1 }`. Read the domus after the
                          week and the widow is already gone: not "no widow", ERASED.
     with nobody named    d.over = { kind:"lanistaDied" } and the loop breaks.

   So the domus is snapshotted BEFORE each week and the death is detected AFTER it, from two signals
   that outlive the reset: a new `d.forebears` entry with `retired` falsy, or `d.over.kind ===
   "lanistaDied"`. The row reported is the snapshot — the house as it stood the week he died.

     1 · REFERENCE — the rope as it plays: names an heir, takes up the house, second generation.
     2 · ALONE     — `heir:false`. Nobody is named, so every death ends the run at `lanistaDied` and
                     the domus is still standing when it does. This is the control on the detector:
                     if arm 1 sees deaths only through forebears and arm 2 only through `d.over`,
                     and the two agree on the widow rate, neither read is inventing them.

   Run: node test/probes/widow.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 520);
const SEED = process.argv[4] || "WIDOW";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const res = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const YW = A.WEEKS_PER_YEAR, SON = A.SON_AGE, TOGA = A.HEIR_AGE;
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at = f => s[Math.min(s.length-1, Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), max:s[s.length-1] }; };

  /* her age as `familyWeek` computes it, line for line */
  const wifeAgeOf = (d, dm) => dm.wife ? (dm.wife.age||24) + Math.floor((d.week - dm.wife.married)/YW) : null;

  /* the house as it stands right now: everything phase 4 would have to read at the death */
  const shot = d => { const dm = A.domusOf(d), kids = A.livingKids(d);
    const sons = kids.filter(c=>c.sex==="m").map(c=>A.childAge(d,c)).sort((a,b)=>a-b);
    return { week:d.week, wife:!!dm.wife, wifeAge:wifeAgeOf(d, dm), from:dm.wife?dm.wife.from:null,
      kids:kids.length, sons:sons.length, youngSon:sons.length?sons[0]:null,
      minorSon:sons.some(a=>a<SON), togaSon:sons.some(a=>a<TOGA),
      minorKid:kids.some(c=>A.childAge(d,c)<SON),
      lanAge:d.lanista?d.lanista.age:null, lanHealth:d.lanista?Math.round(d.lanista.health):null,
      gen:d.generation, heir:d.heir?d.heir.kind:null }; };

  const run = (seed, mode) => {
    const d = A.newGameState("Widow", "clean", seed);
    if(mode === "old" && d.lanista) d.lanista.age = 58;
    const row = { weeks:0, wifeWeeks:0, wed:null, wedAt:null, everWed:false, endWifeAge:null,
      endKind:null, endWeek:null, deaths:[], retires:[], gens:1, readyWeeks:0 };
    const opts = mode === "alone" ? { heir:false } : {};
    let hadSucc = false;
    for(let w=0; w<W; w++){
      if(d.over) break;
      const pre = shot(d);
      if(A.marryReady(d)) row.readyWeeks++;
      row.weeks++;
      if(pre.wife){ row.wifeWeeks++; if(row.wedAt == null) row.wedAt = pre.week; }
      try { R.lanista(d, opts); } catch(e){ break; }
      /* ---- READ IT AT THE RAISE, NOT AT THE HANDOVER ----
         The first draft watched `d.forebears` grow, which is `succeed` running — and `succeed` runs
         when the house is TAKEN UP, which the rope does on the following week's pass, one week after
         `lanistaWeek` raised the succession. `d.succession` is a fresh literal each time it is
         raised and `takeUpTheHouse` nulls it, so its identity is the signal, and `retire` on it says
         which door opened: a man who retires is alive and there is no widow. */
      /* ---- AND IT IS RE-RAISED EVERY WEEK IT IS NOT ANSWERED ----
         Neither branch of `lanistaWeek` checks `!d.succession` before writing one, so a succession
         nobody takes up is OVERWRITTEN with a fresh literal every week the roll comes up. Identity
         was the first guard here and it counted ten retirements in an arm that reached generation 2
         zero times. The transition is the event: falsy -> truthy, once. */
      if(d.succession && !hadSucc)
        (d.succession.retire ? row.retires : row.deaths).push({ ...pre, via:"succession" });
      hadSucc = !!d.succession;
      if(d.over && d.over.kind === "lanistaDied") row.deaths.push({ ...pre, via:"over" });
    }
    const dm = A.domusOf(d);
    row.endLanAge = d.lanista ? d.lanista.age : null;
    row.endLanHealth = d.lanista ? Math.round(d.lanista.health) : null;
    row.everWed = row.wifeWeeks > 0;
    row.endWifeAge = wifeAgeOf(d, dm);
    row.endKind = d.over ? d.over.kind : (d.week >= W ? "ran-out" : "stopped");
    row.endWeek = d.week; row.gens = d.generation;
    return row;
  };

  /* ---- THE READ-PATH CONTROL ----
     Both zeros above rest on one detector, and a detector that never fires is indistinguishable
     from a door that never opens. So: a house with a wife and a boy of nought standing, and the
     man's own clock wound to its end — age 70, health 0.01, so `lanistaWeek`'s own drain takes him
     under without anybody setting `d.over` by hand. Run BOTH ways, because the two signals are
     different code: with an heir named the death goes out through `d.succession` and `succeed`, and
     with nobody named it goes out through `d.over.kind === "lanistaDied"`. If both fire and both
     read the widow and the boy, the zeros are facts about the game. */
  const door = (seed, named) => {
    const d = A.newGameState("Door", "clean", seed);
    const dm = A.domusOf(d);
    dm.wife = { name:"Prima Vettia", family:"the Vettii", married:1, age:24, from:"merchant" };
    dm.children.push({ id:dm.nextKin++, name:"Lucius Minor", sex:"m", born:1, up:{palus:0,rhetor:0,box:0} });
    dm.lastBorn = 1;
    const opts = named ? {} : { heir:false };
    for(let w=0; w<6; w++){ if(d.over) break; try { R.lanista(d, opts); } catch(e){ break; } }
    if(d.over) return { ran:false, why:"the house ended before the door" };
    d.lanista.age = 70; d.lanista.health = 0.01;
    const pre = shot(d);
    try { R.lanista(d, opts); } catch(e){ return { ran:false, why:"threw: "+e.message }; }
    let via = "neither", retire = null;
    if(d.succession){ via = "succession"; retire = !!d.succession.retire; }
    else if(d.over && d.over.kind === "lanistaDied") via = "over";
    const gen1 = d.generation;
    /* one more pass, because the rope takes up the house on the week AFTER the raise */
    if(!d.over) try { R.lanista(d, opts); } catch(e){}
    return { ran:true, died: via !== "neither" && retire !== true, via, retire,
      heir:pre.heir, wife:pre.wife, wifeAge:pre.wifeAge, sons:pre.sons, young:pre.youngSon,
      minorSon:pre.minorSon, over: d.over ? d.over.kind : null, succ: via === "succession",
      gen:gen1, genAfter:d.generation, fore:(d.forebears||[]).length, wifeAfter: !!A.domusOf(d).wife };
  };
  const doors = { named: door(SEED+"-door", true), alone: door(SEED+"-door", false) };

  const arms = {};
  for(const mode of ["ref","alone","old"]){
    const rows = [];
    for(let i=0;i<H;i++) rows.push(run(SEED+"-"+i, mode));
    const deaths = rows.flatMap(r=>r.deaths);
    const retires = rows.flatMap(r=>r.retires);
    const kinds = {}; rows.forEach(r=>{ kinds[r.endKind] = (kinds[r.endKind]||0)+1; });
    arms[mode] = {
      houses:H, weeks:rows.reduce((a,r)=>a+r.weeks,0),
      wifeWeeks:rows.reduce((a,r)=>a+r.wifeWeeks,0),
      readyWeeks:rows.reduce((a,r)=>a+r.readyWeeks,0),
      wed:rows.filter(r=>r.everWed).length,
      wedAt:q(rows.filter(r=>r.wedAt!=null).map(r=>r.wedAt)),
      lived:q(rows.map(r=>r.weeks)),
      endWifeAge:q(rows.filter(r=>r.endWifeAge!=null).map(r=>r.endWifeAge)),
      endKinds:kinds,
      endLanAge:q(rows.map(r=>r.endLanAge).filter(x=>x!=null)),
      endLanHealth:q(rows.map(r=>r.endLanHealth).filter(x=>x!=null)),
      deaths:deaths.length,
      retires:retires.length,
      retireAge:q(retires.map(x=>x.lanAge).filter(x=>x!=null)),
      gens:rows.reduce((a,r)=>a+r.gens,0),
      viaSucc:deaths.filter(x=>x.via==="succession").length,
      viaOver:deaths.filter(x=>x.via==="over").length,
      deadWithWife:deaths.filter(x=>x.wife).length,
      deadAge:q(deaths.map(x=>x.lanAge).filter(x=>x!=null)),
      widowAge:q(deaths.filter(x=>x.wife).map(x=>x.wifeAge)),
      /* THE GATE: a wife and a boy who is not yet of age, the week the man dies */
      widowMinorSon:deaths.filter(x=>x.wife && x.minorSon).length,
      widowTogaSon:deaths.filter(x=>x.wife && x.togaSon).length,
      widowMinorKid:deaths.filter(x=>x.wife && x.minorKid).length,
      widowAnyKid:deaths.filter(x=>x.wife && x.kids>0).length,
      deathRows:deaths.map(x=>({ w:x.week, gen:x.gen, age:x.lanAge, wife:x.wife, wifeAge:x.wifeAge,
        kids:x.kids, sons:x.sons, young:x.youngSon, heir:x.heir, via:x.via })),
    };
  }
  return { arms, doors };
}, [H,W,SEED]);
const { arms: out, doors } = res;

const show = (n,a) => {
  const p = (x,y) => y ? (100*x/y).toFixed(1)+"%" : "—";
  console.log(`\n== ${n} ==`);
  console.log(`  houses ${a.houses} · played ${a.weeks}w · lived p50 ${a.lived&&a.lived.p50}w`);
  console.log(`  married ${a.wed}/${a.houses} · wed p50 wk ${a.wedAt?a.wedAt.p50:"—"} · wifeWeeks ${a.wifeWeeks} of ${a.weeks} = ${p(a.wifeWeeks,a.weeks)}`);
  console.log(`  marryReady open ${a.readyWeeks}w (the slot empty and the gate passed)`);
  console.log(`  her age at the house's end: ${a.endWifeAge ? `n ${a.endWifeAge.n} · p10 ${a.endWifeAge.p10} · p50 ${a.endWifeAge.p50} · p90 ${a.endWifeAge.p90} · max ${a.endWifeAge.max}` : "no wife standing at any end"}`);
  console.log(`  endings: ${Object.entries(a.endKinds).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
  console.log(`  the man at the house's end: age p50 ${a.endLanAge?a.endLanAge.p50:"—"} (max ${a.endLanAge?a.endLanAge.max:"—"}) · health p50 ${a.endLanHealth?a.endLanHealth.p50:"—"} (min p10 ${a.endLanHealth?a.endLanHealth.p10:"—"})`);
  console.log(`  handed on alive (RETIRED) ${a.retires} · age p50 ${a.retireAge?a.retireAge.p50:"—"} · generations reached ${a.gens} across ${a.houses} houses`);
  console.log(`  LANISTA DEATHS ${a.deaths} (via succession ${a.viaSucc} · via over ${a.viaOver}) · age p50 ${a.deadAge?a.deadAge.p50:"—"}`);
  console.log(`    died with a wife        ${a.deadWithWife} of ${a.deaths}  ${p(a.deadWithWife,a.deaths)}${a.widowAge?`  her age p50 ${a.widowAge.p50}`:""}`);
  console.log(`    WIDOW + SON UNDER 9     ${a.widowMinorSon}`);
  console.log(`    widow + son under 16    ${a.widowTogaSon}`);
  console.log(`    widow + any child < 9   ${a.widowMinorKid}`);
  console.log(`    widow + any child       ${a.widowAnyKid}`);
  if(a.deathRows.length){ console.log(`    each death:`);
    a.deathRows.forEach(r=>console.log(`      wk ${String(r.w).padStart(3)} gen ${r.gen} · lanista ${r.age} · wife ${r.wife?`yes (${r.wifeAge})`:"no "} · kids ${r.kids} sons ${r.sons} youngest ${r.young==null?"—":r.young} · heir ${r.heir||"none"} · ${r.via}`)); }
};
console.log(`#243 THE MISTRESS OF THE HOUSE — verify-first, ${H} x ${W}, seed ${SEED}`);
show("1 · REFERENCE (rope names an heir and takes up the house)", out.ref);
show("2 · ALONE (heir:false — every death ends the run, domus intact)", out.alone);
show("3 · OLD MAN (started at 58, which is how heirs.mjs reached the same door)", out.old);
console.log(`\n== 4 · THE DOOR — read-path control, wife and a boy of nought, the man's clock wound to its end ==`);
for(const [k,r] of Object.entries(doors)){
  if(!r.ran){ console.log(`  ${k.padEnd(6)} DID NOT RUN — ${r.why}`); continue; }
  console.log(`  ${k.padEnd(6)} heir ${String(r.heir||"none").padEnd(7)} · detector ${r.died?"FIRED":"SILENT"} via ${r.via}${r.retire===null?"":` (retire=${r.retire})`} · read wife ${r.wife?"yes":"no"} (${r.wifeAge}) · sons ${r.sons} youngest ${r.young} · under 9 ${r.minorSon?"yes":"no"}`);
  console.log(`  ${"".padEnd(6)} after: over=${r.over||"—"} generation ${r.gen} -> ${r.genAfter} · forebears ${r.fore} · wife still in the slot=${r.wifeAfter}`);
}

await browser.close(); server.close();
