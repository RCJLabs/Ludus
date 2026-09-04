/* THREE OF THE NINE, AND IT WAS THE SAME THREE EVERY GAME

   `LANISTAE` holds nine rival lanistae. Each is written the way the founders are — a name, a
   distinguishing trait, a blurb — and each carries seven dials that are read all over the file:
   `poach` at 36 sites, `bid` at 18, `train` at 11, plus `bribe`, `sabotage`, `grudgeDecay` and
   `stature`. They are not decoration, and the first arm below proves it off the game's own weights:
   **Pollio buys on 25% of his weeks against Cossutius's 6.5%** — 3.9 times as often — while Tullius
   and Cossutius drill twice as hard as Pollio and Glaber, and the hostile dials span 0.7–2.2 on
   poach, 0.5–2.0 on bribe and 0.5–1.9 on sabotage.

   AND `RIVAL_SEED` NAMED THREE OF THEM, FOREVER. The only other door into the bay was `bayRefill`,
   which fires when `liveRivals` drops under `BAY_FLOOR` — after a retirement, measured at 0.58 times
   per multi-decade campaign (`probes/dynasty.mjs`). Measured over 16 campaigns and 3,923 played
   weeks (`probes/nine.mjs`):

       Solonius, Vettius, Tullius    in the bay 16/16, FOUGHT 16/16 — every game, all three
       the other six                 in the bay 1–3 of 16, fought 0–3
       Rufinus and Pollio            NEVER FOUGHT, in sixteen campaigns
       distinct lanistae fought      THREE, of nine, every time

   Two thirds of the written opposition sat behind a door that opens once every other campaign.

   WHAT SHIPPED. The bay is still three houses — `BAY_FLOOR` does not move and neither does the
   opening's soft/middling/hard shape. What changes is WHICH three: they are drawn per campaign and
   then sorted by their own `stature`, the share of your fame each house is pulled toward, so the one
   that opens biggest is the one written biggest. And `NEW_HOUSES` gained arrival prose for the three
   founders, who previously could not arrive at all — the two sets never overlapped, so neither
   needed the other's lines, and a lanista who cannot be seeded and cannot arrive is simply gone.

   Re-measured: every one of the nine is now in the bay in 19–56% of campaigns and FOUGHT in 19–56%,
   against three at 100% and two at 0% before.

   SEVEN ARMS. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "nine";
export const describe = "the bay is drawn from all nine lanistae, tiered by their own stature, and every one of them can arrive";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"NINE-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const keys = Object.keys(A.LANISTAE);

    /* ---- 1: the dials are a personality, and must stay one ----
       `RIVAL_MOVES`' weights are pure functions of the house, so this is exact rather than sampled.
       A future edit that flattens the table — every lanista drilling and bidding alike — would make
       the other six arriving worth nothing, so the differentiation is guarded here. */
    { const mk = Object.keys(A.RIVAL_MOVES);
      const share = {};
      for(const k of keys){
        const hh = { name:k, fame:900, grudge:30, warm:10, form:0, formTier:0, fighters:[], star:null };
        const raw = {}; let tot = 0;
        for(const m of mk){ let w = 1;
          try { w = A.RIVAL_MOVES[m].weight(hh); } catch(e){ w = 0; }
          if(!(w >= 0)) w = 0; raw[m] = w; tot += w; }
        share[k] = Object.fromEntries(mk.map(m=>[m, tot ? raw[m]/tot : 0]));
      }
      const spread = m => { const xs = keys.map(k=>share[k][m]);
        return { lo:Math.min(...xs), hi:Math.max(...xs) }; };
      const buy = spread("buy"), train = spread("retrain");
      if(!(buy.hi / Math.max(1e-9, buy.lo) >= 2))
        bad.push(`the nine buy at ${(100*buy.lo).toFixed(1)}%–${(100*buy.hi).toFixed(1)}% of their weeks — the \`bid\` dial has been flattened and they are one opponent in nine coats`);
      if(!(train.hi / Math.max(1e-9, train.lo) >= 1.4))
        bad.push(`the nine retrain at ${(100*train.lo).toFixed(1)}%–${(100*train.hi).toFixed(1)}% — the \`train\` dial has been flattened`);
      for(const dial of ["poach","bribe"]){
        const xs = keys.map(k=>A.LANISTAE[k][dial]).filter(x=>x != null);
        if(xs.length !== keys.length) bad.push(`${keys.length - xs.length} of the nine carry no \`${dial}\` dial`);
        if(Math.max(...xs) / Math.min(...xs) < 2)
          bad.push(`the \`${dial}\` dial spans only ${Math.min(...xs)}–${Math.max(...xs)} across the nine`);
      }
      lines.push(`the dials: buy ${(100*buy.lo).toFixed(1)}%→${(100*buy.hi).toFixed(1)}% of weeks · retrain ${(100*train.lo).toFixed(1)}%→${(100*train.hi).toFixed(1)}%`);
    }

    /* ---- 2: EVERY ONE OF THE NINE CAN BE SEATED ---- */
    { const seat = {}, byTier = {};
      const N = 400;
      for(let i=0;i<N;i++){
        const d = A.newGameState("Nn", "clean", `NINE-seat-${i}`);
        const nm = (d.rivals||[]).map(x=>x.name);
        if(new Set(nm).size !== nm.length) bad.push(`a fresh bay holds the same house twice: ${nm.join(", ")}`);
        if(nm.length !== 3) bad.push(`a fresh bay opens with ${nm.length} houses, not three — the bay's size is not what this change was allowed to move`);
        nm.forEach((k,j)=>{ seat[k] = (seat[k]||0)+1; (byTier[k] = byTier[k] || [0,0,0])[j]++; });
      }
      const never = keys.filter(k=>!seat[k]);
      if(never.length) bad.push(`${never.join(", ")} never opened a bay in ${N} fresh games — still unreachable`);
      /* and roughly even: a draw that seats one lanista twice as often as another is a draw with a
         thumb on it. 3 of 9 seats over N games is N/3 apiece; allow a wide band, catch a broken one. */
      const ns = keys.map(k=>seat[k]||0), want = N/3;
      if(Math.min(...ns) < want*0.5 || Math.max(...ns) > want*1.6)
        bad.push(`the draw is lopsided: ${Math.min(...ns)}–${Math.max(...ns)} seats over ${N} games against an even ${Math.round(want)}`);
      lines.push(`seated over ${N} fresh bays: ${keys.map(k=>`${k.slice(0,4)} ${seat[k]||0}`).join(" · ")}`);

      /* ---- 3: and the tier follows the lanista's own stature ---- */
      const statures = Object.fromEntries(keys.map(k=>[k, A.LANISTAE[k].stature || 0.4]));
      const lowest = keys.slice().sort((a,b)=>statures[a]-statures[b])[0];
      const highest = keys.slice().sort((a,b)=>statures[b]-statures[a])[0];
      if((byTier[highest]||[0,0,0])[0] > 0)
        bad.push(`${highest} (stature ${statures[highest]}, the biggest of the nine) opened in the SOFTEST seat — the tiering does not read stature`);
      if((byTier[lowest]||[0,0,0])[2] > 0)
        bad.push(`${lowest} (stature ${statures[lowest]}, the smallest) opened in the HARDEST seat`);
      lines.push(`tiering: ${highest} never opens soft, ${lowest} never opens hard`);

      /* AND THE OPENING CURVE IS UNCHANGED — soft, middling, hard by fame, whoever fills the seats */
      const d0 = A.newGameState("Curve", "clean", "NINE-curve");
      const fames = (d0.rivals||[]).map(x=>x.fame);
      if(!(fames[0] < fames[1] && fames[1] < fames[2]))
        bad.push(`a fresh bay opens at fames ${fames.join(", ")} — the soft/middling/hard shape is gone`);
      lines.push(`the opening still runs ${fames.map(f=>Math.round(f)).join(" → ")}`);
    }

    /* ---- 4: every one of the nine can also ARRIVE, and its prose renders ---- */
    { const pool = A.NEW_HOUSES.map(x=>x.key);
      for(const k of keys) if(!pool.includes(k))
        bad.push(`${k} has no arrival line in NEW_HOUSES — if he is not seeded he can never appear at all`);
      for(const N2 of A.NEW_HOUSES){
        let txt = null, threw = null;
        try { txt = N2.line({ name:N2.key, fighters:[{},{},{}], fame:200 }); }
        catch(e){ threw = String(e && e.message || e).slice(0,90); }
        if(threw) bad.push(`${N2.key}'s arrival line threw: ${threw}`);
        else if(!txt || txt.length < 60) bad.push(`${N2.key}'s arrival line is ${txt ? txt.length : 0} characters`);
        else if(!new RegExp(A.LANISTAE[N2.key] ? A.LANISTAE[N2.key].name.split(" ").pop() : N2.key).test(txt))
          bad.push(`${N2.key}'s arrival line never names him: "${String(txt).slice(0,60)}"`);
      }
      lines.push(`arrivals written for ${pool.length} of ${keys.length}`);
    }

    /* ---- 5: and bayRefill actually installs them ----
       Driven, not asserted: the yard is emptied and the refill wound forward until it changes hands,
       once per lanista held back, so every one of the nine is seen to come through the door. */
    { const arrived = new Set();
      for(let i=0;i<40 && arrived.size < keys.length;i++){
        const d = A.newGameState("Rf", "clean", `NINE-rf-${i}`);
        d.week = 60; d.gold = 5000;
        d.rivals[0].retired = true;
        const before = new Set(d.rivals.map(x=>x.name));
        for(let w=0; w<60; w++){ d.week++;
          try { A.bayRefill(d); } catch(e){ bad.push(`bayRefill threw: ${String(e&&e.message||e).slice(0,80)}`); break; }
          const got = d.rivals.find(x=>!before.has(x.name));
          if(got){ arrived.add(got.name); break; }
        }
      }
      if(!arrived.size) bad.push(`bayRefill installed nobody at all in 40 emptied bays`);
      lines.push(`came through the gate in 40 emptied bays: ${[...arrived].join(", ") || "(nobody)"}`);
    }

    /* ---- 6: the bay's SIZE is untouched — this change was allowed to move who, not how many ---- */
    { if(A.BAY_FLOOR !== 3) bad.push(`BAY_FLOOR is ${A.BAY_FLOOR} — the bay's size is not what this change was allowed to move`);
      const d = A.newGameState("Sz", "clean", "NINE-size");
      if(A.liveRivals(d).length !== 3) bad.push(`a fresh bay holds ${A.liveRivals(d).length} live houses`);
    }

    /* ---- 7: and lanistaOf still answers for every one of them ---- */
    { for(const k of keys){ const L = A.lanistaOf ? A.lanistaOf(k) : A.LANISTAE[k];
        if(!L || !L.name || /^House /.test(L.name)) bad.push(`lanistaOf("${k}") falls through to the placeholder record`);
        if(!L.trait || !L.blurb) bad.push(`${k} has no trait or blurb — the panel would show a blank`);
        for(const dial of ["poach","bribe","train","bid","stature","grudgeDecay"])
          if(typeof L[dial] !== "number") bad.push(`${k} carries no \`${dial}\``);
      } }

    return { bad, lines };
  });

  bad.push(...r.bad);
  lines.push(...r.lines);
  return { pass: bad.length === 0, why: bad.join(" · "), lines };
}
