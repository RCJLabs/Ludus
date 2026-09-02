/* A REQUIREMENT REFUSES, A PREFERENCE SETTLES, AND THE SAND HONOURS THE CARD

   Audit item #230: "Fourteen bouts fought at the wrong stakes. The rope's own counters report 14 of
   1,849 bouts (0.8%) fought at stakes other than the ones asked for. Small, real, and exactly the
   class #150 exists for — the card promised one thing and the sand rolled another. This one is an
   investigation, not a design: one probe to find which path drops the stakes, then the fix."

   IT IS SMALL AND REAL AND IT IS NOT THE CLASS #150 EXISTS FOR. Read what the counter counts:

       const got = pref ? offer.stakes === pref : null;
       if(got === false) R.wrongStakes++;

   That compares WHICH CARD WAS TAKEN against what was asked for. It says nothing about whether the
   bout was fought at the stakes the card carried — so "the card promised one thing and the sand
   rolled another" is not the sentence that counter can write.

   AND THE SAND DOES HONOUR THE CARD, though not by the route it looks like. `spareOdds()` returns
   null at sine, but that is only what the BOX shows: removing it changes no outcome at all. The
   sparing is decided in the aftermath, where `if(stakes==="sine")` kills the man who fell without
   an appeal ever being raised. Nothing in the suite had checked that the field and its consequence
   agree, and finding out which of the two was the real gate took a sabotage that moved nothing.
   Measured (`probes/stakes.mjs`) over 1,250 rope bouts: **175 sine cards, 0 sparings, 153 deaths**,
   against 1,046 standard cards and 725 sparings. The field and its consequence agree exactly.

   WHAT THE COUNTER ACTUALLY FOUND is the rope taking a different card, and two of the three paths
   that do that are written down as doing it — `preferStakes` (which is what the old name `stakes:`
   means) filters the bill and, finding nothing, takes the bill anyway, which is its documented
   contract against `wantStakes`; and the town's card "does not take an order for stakes".

   THE ONE REAL FAULT IS THAT THE TOWN BROKE THE STRICT OPTION. `wantStakes` is documented "only
   these stakes, and refuse the week otherwise", and the town branch fought the bout regardless.
   Measured, it was the ONLY path that did under `wantStakes`: 7 of 259 asking for sine, 18 of 1,565
   for standard, and 146 of 1,461 for blood — **9% of the bouts of a caller who had asked for none
   of them**. No check uses the strict option today, so it was a trap set for its first caller
   rather than a live fault, which is the honest size of #230. It refuses now: 0 of all three.

   FIVE ARMS:
   1 · A REQUIREMENT REFUSES. `wantStakes` fights only what it asked for, on every path.
   2 · A PREFERENCE SETTLES, and says so — it falls back and reports `gotWanted:false` rather than
       billing the bout as what it wanted. Breaking that would be the v3.0.0 regression that put
       4 of 5 houses into debt.
   3 · THE SAND HONOURS THE CARD — no sparing on a sine card, and sparings on standard ones.
   4 · AND THE RESULT SAYS WHAT THE CARD SAID.
   5 · ON ENOUGH SINE CARDS TO MEAN IT. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "stakes";
export const describe = "a requirement refuses, a preference settles, and the sand honours the card";
export const slow = true;   /* plays houses under three stakes policies */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"STAKES-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","activeG"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const pathOf = (d, o) => o.venue === "pit" ? "the pit"
      : d.city ? "the town" : d.rome ? "the bill (at Rome)" : "the bill";

    /* 1 and 2 — a requirement against a preference, on the same houses */
    const arms = {};
    for(const [opt, want] of [["wantStakes","sine"], ["wantStakes","blood"],
                              ["preferStakes","sine"], ["preferStakes","blood"]]){
      const key = `${opt}:${want}`;
      const a = arms[key] = { ran:0, refused:0, wrong:0, byPath:{}, saidSo:0 };
      for(let h=0; h<3; h++){
        const d = A.newGameState("Stakes", "clean", "STK-R"+h, null);
        for(let w=0; w<10; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
        for(let i=0; i<200; i++){
          if(d.over) break;
          let t = null;
          try { t = R.takeBout(d, { [opt]: want }); } catch(e){}
          if(!t || t.ran === false) a.refused++;
          else if(t.offer){
            a.ran++;
            if(t.offer.stakes !== want){
              a.wrong++;
              a.byPath[pathOf(d, t.offer)] = (a.byPath[pathOf(d, t.offer)]||0) + 1;
              /* a preference that settles must SAY it settled */
              if(t.gotWanted === false) a.saidSo++;
            }
          }
          try { R.lanista(d); } catch(e){ break; }
        }
      }
    }

    /* 3, 4 and 5 — what the sand did, filed against what the card said */
    const sand = {};
    const appeals = { n:0, off:0, worst:null };
    for(let h=0; h<4; h++){
      const d = A.newGameState("Stakes", "clean", "STK-S"+h, null);
      for(let w=0; w<10; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
      for(let i=0; i<300; i++){
        if(d.over) break;
        let t = null;
        try { t = R.takeBout(d, {}); } catch(e){}
        if(t && t.ran !== false && t.offer && t.res){
          const st = t.offer.stakes || "?";
          const s = sand[st] = sand[st] || { n:0, spared:0, echoed:0 };
          s.n++;
          const beats = [].concat((t.res.beats)||[]);
          if(beats.some(b=>b && b.kind === "spared")) s.spared++;
          if(t.res.stakes == null || t.res.stakes === st) s.echoed++;
          /* ---- AND THE BOX'S NUMBER AGAINST THE ONE THAT WAS ROLLED ----
             Every beat carries `spp` — what `spareOdds()` was showing the player at that moment —
             and the appeal beat carries the `odds` the appeal actually rolled against. They were
             two separate copies of one expression until #230; they agreed, and nothing held them
             to it. On the same beat, at the same round, they must be the same number. */
          for(const b of beats){
            if(!b || b.kind !== "appeal" || b.odds == null || b.spp == null) continue;
            appeals.n++;
            if(b.odds !== b.spp){ appeals.off++;
              if(appeals.worst == null || Math.abs(b.odds-b.spp) > Math.abs(appeals.worst))
                appeals.worst = b.odds - b.spp; }
          }
        }
        try { R.lanista(d); } catch(e){ break; }
      }
    }
    return { arms, sand, appeals };
  });

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };

  for(const [k,a] of Object.entries(r.arms))
    lines.push(`  ${k.padEnd(20)} ran ${String(a.ran).padStart(4)} · refused ${String(a.refused).padStart(4)}`
      + ` · at other stakes ${String(a.wrong).padStart(4)}`
      + (a.wrong ? `  (${Object.entries(a.byPath).map(([p2,n])=>`${p2} ${n}`).join(" · ")}, said so ${a.saidSo})` : ""));
  lines.push(`  ${r.appeals.n} appeals · the box's number matched the roll on ${r.appeals.n - r.appeals.off}`);
  for(const [st,s] of Object.entries(r.sand).sort((a,b)=>b[1].n-a[1].n))
    lines.push(`  the card said ${st.padEnd(9)} ${String(s.n).padStart(4)} bouts · ${String(s.spared).padStart(4)} spared`
      + ` · the result echoed it ${s.echoed}/${s.n}`);

  /* 1 — a requirement refuses */
  for(const [k,a] of Object.entries(r.arms)){
    if(!k.startsWith("wantStakes")) continue;
    if(!a.ran) bad.push(`${k} fought nothing at all, so the strict arm measured nothing`);
    else if(a.wrong)
      bad.push(`${k} fought ${a.wrong} of ${a.ran} bouts at other stakes, by way of `
        + `${Object.keys(a.byPath).join(", ")} — \`wantStakes\` is "only these stakes, and refuse the `
        + `week otherwise", and the town branch fought the bout anyway on 9% of a blood caller's weeks`);
  }
  /* 2 — a preference settles, and says so */
  for(const [k,a] of Object.entries(r.arms)){
    if(!k.startsWith("preferStakes")) continue;
    if(!a.ran) bad.push(`${k} fought nothing at all, so the preference arm measured nothing`);
    else if(!a.wrong)
      bad.push(`${k} never once settled for another card in ${a.ran} bouts — a preference that always `
        + `gets its way is a requirement, and the strict reading put 4 of 5 houses into debt in v3.0.0`);
    else if(a.saidSo !== a.wrong)
      bad.push(`${k} settled for another card ${a.wrong} times and reported \`gotWanted:false\` on `
        + `${a.saidSo} of them — a bout quietly billed as what it wanted is the thing the fallback `
        + `was written to avoid`);
  }
  /* 3 — the sand honours the card */
  const sine = r.sand.sine, std = r.sand.standard;
  if(!sine || sine.n < 20)
    bad.push(`only ${sine ? sine.n : 0} sine cards came up, which is too few to say whether the sand `
      + `honours one — \`spareOdds()\` is null at sine and nothing else in the suite checks it`);
  else if(sine.spared)
    bad.push(`${sine.spared} of ${sine.n} bouts on a SINE MISSIONE card ended in a sparing — the `
      + `aftermath branch reads \`if(stakes==="sine")\` and kills the man who fell without an appeal, `
      + `so the card promised no mercy and the sand gave some. That is the class #150 exists for and `
      + `the thing #230 believed it had found`);
  if(!std || !std.spared)
    bad.push(`no standard card ended in a sparing across ${std ? std.n : 0} of them, so arm 3 is `
      + `comparing sine against nothing`);
  /* 4 — and the box's number is the number that was rolled */
  if(!r.appeals.n)
    bad.push(`no appeal beat carried both the box's reading and the odds it rolled, so the arm that `
      + `holds them to one figure measured nothing`);
  else if(r.appeals.off)
    bad.push(`${r.appeals.off} of ${r.appeals.n} appeals rolled against odds the box was not showing `
      + `(worst ${r.appeals.worst} points) — \`spareOdds()\` and the appeal were two copies of one `
      + `expression until v3.174.0, and a box that lies about the roll behind it is #150`);
  /* 4b — and the result says what the card said */
  for(const [st,s] of Object.entries(r.sand))
    if(s.echoed !== s.n)
      bad.push(`${s.n - s.echoed} of ${s.n} bouts on a ${st} card came back reporting other stakes`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the requirement refuses, the preference settles and says so, and no sine card spares`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
