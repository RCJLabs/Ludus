/* WHAT A HOUSE THAT HATES YOU CAN DO — #246 phase 2.

   (`spite` was free in both directories; checked before writing.)

   The item's phase 2 asks for hostile moves inside `RIVAL_MOVES`, weighted by the grudge and the
   `LANISTAE` multipliers, "so the multipliers finally drive something". They are here. But the
   instrument written for them (`probes/spite.mjs`) refuted the reason the item gives for wanting
   them, and found something else on the way:

     · THE MULTIPLIERS REALLY DID DRIVE NOTHING. `evWeight(d,k)` is `EV_DIE[k].w` times a freshness
       bonus and reads no lanista at all — the same number for every bay in the game. The sorts in
       `sabotage.make` and its two sisters choose WHOSE COLOURS the cook saw, never whether he saw
       anybody.
     · AND A WEIGHT ON THE GRUDGE MULTIPLIES ALMOST NOTHING. The grudge is 0 on 64.4% of house-weeks
       and under the lowest gate on 95.4%; it leaves zero on 3.4% of its zero-weeks and lands at a
       median of 4 against a nearest gate of 26; and above zero it takes in 0.90 a week against a
       drain of 1.30. Measured over four 32 x 420 sets, the surface holds its rate either way — 8.8
       hostile acts per hundred hot house-weeks before, 9.2 after. What the moves change is the
       AUTHORSHIP: hostility is now the act of the house that holds the grudge, reached for at its
       own character's rate, instead of a die that cannot see a lanista.
     · AND A HOUSE THAT WAS ALREADY DARK WAS STILL DOING ALL OF IT. That is the arm below that
       matters, and it is arm 1.

   FOUR ARMS. One played run and three read directly off the shipped move table.

   1 · A HOUSE THAT IS GONE DOES NOTHING. `closeHouse` sets `retired` and leaves the house in
       `d.rivals` on purpose — `lastDark` sells the yard on and the annals name the man — and
       every other walker of that array steps over them. The bay's own turn did not. Measured
       before the fix over 4,481 weeks: **268 of 3,110 rival moves (8.6%) were made by a house that
       no longer existed**, and **28 of 88 hostile acts (31.8%) were charged to one** — House
       Vettius closed on week 200 and was still poisoning the grain at 202, 204 and 206. Both must
       be zero.
   2 · THE MOVES ARE THERE AND THE GRUDGE IS THEIR GATE. Four moves marked `hostile`, every one
       refusing a house at grudge 0 and allowing one at its own gate.
   3 · AND THE WEIGHT READS BOTH THINGS IT IS SUPPOSED TO. At one grudge, the schemer reaches for
       the poach harder than the man with no multiplier; and for one house, the card the die rates
       highest is the one weighted highest. This is the item's sentence, asserted directly.
   4 · AND SOMETHING STILL LANDS. A floor under the surface, so the channel cannot go quietly dead
       the way the poach branch did. */
import { found, clearAll, installRope } from "../harness.mjs";

const HOUSES = 8, WEEKS = 320;
const ACT_FLOOR = 3.0;      /* acts per 100 hot house-weeks; measured 8.8 before and 9.2 after */

export const name = "spite";
export const describe = "a rival's grudge reaches for something, its own character decides what, and a house that is gone does nothing at all";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"SPITE-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","RIVAL_MOVES","lanistaOf","evTune","closeHouse","activeG",
                  "GRUDGE_POACH","GRUDGE_SABOTAGE","GRUDGE_BRIBE","GRUDGE_THUGS"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function") return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };
    const MK = Object.keys(A.RIVAL_MOVES);
    const HOT = MK.filter(k=>A.RIVAL_MOVES[k].hostile);
    const CARD = { sabotage:"sabotage", bribe:"bribedEditor", thugs:"thugs" };
    const GATE = { poach:A.GRUDGE_POACH, sabotage:A.GRUDGE_SABOTAGE, bribe:A.GRUDGE_BRIBE, thugs:A.GRUDGE_THUGS };

    /* 1 · the played run */
    const t = { weeks:0, moves:0, movesByDark:0, acts:0, actsByDark:0, hotWeeks:0, darkWeeks:0,
      kinds:{}, sawDark:0, exam:[] };
    const CHARGED = ["poached","sabotage","thugs","bribedEditor"];
    for(let hh=0; hh<H; hh++){
      const d = A.newGameState("Sp"+hh, "clean", `SPITECHK-${hh}`);
      let top = (d.rivalLog||[])[0];
      for(let w=0; w<W; w++){
        if(d.over) break;
        t.weeks++;
        const all = d.rivals || [];
        if(all.some(x=>x.retired)) t.darkWeeks++;
        for(const h of all) if(!h.retired && (h.grudge||0) >= A.GRUDGE_SABOTAGE) t.hotWeeks++;
        try { R.lanista(d); } catch(e){ break; }
        const log = d.rivalLog || [];
        if(log.length && log[0] !== top){ t.moves++;
          const h = all.find(x=>x.name === log[0].house);
          if(h && h.retired){ t.movesByDark++;
            if(t.exam.length < 3) t.exam.push(`House ${log[0].house}, dark since week ${h.retiredAt}: ${log[0].text.slice(0,70)}`); } }
        top = log[0];
        const ev = d.pendingEvent && d.pendingEvent.id;
        if(ev && CHARGED.includes(ev)){ t.acts++; t.kinds[ev] = (t.kinds[ev]||0)+1;
          const who = d.pendingEvent.data && d.pendingEvent.data.house;
          const h = who && all.find(x=>x.name === who);
          if(h && h.retired){ t.actsByDark++;
            if(t.exam.length < 6) t.exam.push(`${ev} charged to House ${who}, dark since week ${h.retiredAt}`); } }
      }
      if((d.rivals||[]).some(x=>x.retired)) t.sawDark++;
    }

    /* 2 · the gate, and 3 · the weight — read straight off the shipped table */
    const d0 = A.newGameState("Gate", "clean", "SPITECHK-GATE");
    const gate = {}, wt = {};
    for(const k of HOT){
      const M = A.RIVAL_MOVES[k], g = GATE[k];
      const cold = { name:"Vettius", grudge:0, fighters:[] };
      const hot  = { name:"Vettius", grudge:Math.min(100, g + 20), fighters:[] };
      let coldOK = null, hotOK = null;
      try { coldOK = !!M.when(d0, cold); } catch(e){ coldOK = "threw"; }
      try { hotOK  = !!M.when(d0, hot);  } catch(e){ hotOK  = "threw"; }
      gate[k] = { g, coldOK, hotOK, wCold:M.weight(cold), wHot:M.weight(hot) };
    }
    /* the multiplier: two houses, one grudge, one move */
    const at = (nm, g) => ({ name:nm, grudge:g, fighters:[] });
    wt.poachSchemer = A.RIVAL_MOVES.poach.weight(at("Solonius", 60));   /* poach 2.2 */
    wt.poachPlain   = A.RIVAL_MOVES.poach.weight(at("Tullius",  60));   /* poach 0.8 */
    wt.sabVettius   = A.RIVAL_MOVES.sabotage.weight(at("Vettius",   60)); /* sabotage 1.9 */
    wt.sabMarcellus = A.RIVAL_MOVES.sabotage.weight(at("Marcellus", 60)); /* sabotage 0.5 */
    /* the die: one house, three cards, at a grudge that clears every gate */
    wt.dieThugs = A.RIVAL_MOVES.thugs.weight(at("Vettius", 100));
    wt.dieSabot = A.RIVAL_MOVES.sabotage.weight(at("Vettius", 100));
    wt.evThugs = A.evTune("thugs").w; wt.evSabot = A.evTune("sabotage").w;
    return { t, HOT, gate, wt };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };
  const { t, HOT, gate, wt } = r;
  const per100 = t.hotWeeks ? Math.round(1000*t.acts/t.hotWeeks)/10 : 0;

  lines.push(`${t.weeks} weeks · ${t.moves} rival moves · ${t.acts} hostile acts charged to a house `
    + `(${Object.entries(t.kinds).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k} ${n}`).join(" · ") || "none"}) `
    + `over ${t.hotWeeks} hot house-weeks — ${per100} per 100`);
  lines.push(`  ${t.sawDark} of ${HOUSES} runs saw a house go dark (${t.darkWeeks} weeks with one in the bay): `
    + `${t.movesByDark} moves and ${t.actsByDark} acts came from one [both must be 0; before the fix, 8.6% and 31.8%]`);
  lines.push(`  the four: ${HOT.map(k=>`${k} at ${gate[k].g} (cold ${gate[k].coldOK} → hot ${gate[k].hotOK}, `
    + `w ${Math.round(100*gate[k].wCold)/100} → ${Math.round(100*gate[k].wHot)/100})`).join(" · ")}`);
  lines.push(`  at one grudge: the schemer's poach ${wt.poachSchemer.toFixed(2)} against ${wt.poachPlain.toFixed(2)}; `
    + `the ledger-keeper's sabotage ${wt.sabVettius.toFixed(2)} against ${wt.sabMarcellus.toFixed(2)}; `
    + `and the die's own order kept — thugs (w${wt.evThugs}) ${wt.dieThugs.toFixed(2)} over sabotage (w${wt.evSabot}) ${wt.dieSabot.toFixed(2)}`);

  /* 1 — the one that matters */
  if(t.movesByDark > 0 || t.actsByDark > 0)
    bad.push(`a house that has already gone dark made ${t.movesByDark} of ${t.moves} rival moves and was `
      + `charged with ${t.actsByDark} of ${t.acts} hostile acts — \`closeHouse\` leaves it in \`d.rivals\` so `
      + `\`lastDark\` can sell the yard on, and every other walker of that array steps over it. `
      + `${t.exam.slice(0,2).join(" | ")}`);
  if(!t.sawDark)
    bad.push(`no house went dark in ${HOUSES} runs of ${WEEKS} weeks, so arm 1 proved nothing — it is the `
      + `only arm here that can catch a house acting from beyond the end of it, and it needs a corpse`);
  /* 2 */
  if(HOT.length !== 4)
    bad.push(`\`RIVAL_MOVES\` carries ${HOT.length} moves marked \`hostile\`, not the four #246 asks for`);
  for(const k of HOT){
    if(gate[k].coldOK !== false)
      bad.push(`the ${k} move is open to a house at grudge 0 (\`when\` said ${gate[k].coldOK}) — the grudge is `
        + `supposed to be the whole of the gate, and a bay that is not angry must not reach for anything`);
    if(gate[k].wCold !== 0)
      bad.push(`the ${k} move weighs ${gate[k].wCold} at grudge 0 — \`rivalTurn\` floors a weight at 0.2, so a `
        + `non-zero weight here would put it in the bag of a house that has nothing against you`);
  }
  if(!HOT.some(k=>gate[k].hotOK === true))
    bad.push(`not one of the four opened for a house twenty points above its own gate — the grudge reaches `
      + `no move at all, which is the state #246 was filed about`);
  /* 3 */
  if(!(wt.poachSchemer > wt.poachPlain))
    bad.push(`at the same grudge the schemer (poach 2.2) reaches for the poach at ${wt.poachSchemer.toFixed(2)} and `
      + `the man with no theatre (0.8) at ${wt.poachPlain.toFixed(2)} — the \`LANISTAE\` multipliers are what #246 `
      + `says drive nothing, and this is the assertion that they now do`);
  if(!(wt.sabVettius > wt.sabMarcellus))
    bad.push(`the house that forgets nothing (sabotage 1.9) sabotages at ${wt.sabVettius.toFixed(2)} against `
      + `${wt.sabMarcellus.toFixed(2)} for the house rated 0.5 — the same failure on the other multiplier`);
  if(wt.evThugs > wt.evSabot && !(wt.dieThugs > wt.dieSabot))
    bad.push(`the die rates the thugs ${wt.evThugs} against sabotage's ${wt.evSabot} and the moves weigh them `
      + `${wt.dieThugs.toFixed(2)} against ${wt.dieSabot.toFixed(2)} — without that term the lowest gate wins `
      + `everything, which took sabotage from 37% of the surface to 69% on the first cut`);
  /* 4 */
  if(t.hotWeeks && per100 < ACT_FLOOR)
    bad.push(`${t.acts} hostile acts over ${t.hotWeeks} hot house-weeks is ${per100} per 100 [floor ${ACT_FLOOR}, `
      + `measured 8.8 before this release and 9.2 after] — the surface has gone quiet`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the grudge reaches, the character chooses, and the dead stay dead`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
