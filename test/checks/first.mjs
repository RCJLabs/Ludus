/* THE FIRST AFTERNOON, WHICH EVERY MAN WHO FIGHTS AT ALL HAS

   Audit item #221: "Man-depth is gated behind careers nobody has. Tells need history, sagas need
   renown, mastery needs wins — and the median career is one bout (#208), so most men never touch
   any man-system. Recommend early texture that fires on bout one: a debut tell, an annals line for
   a first blooding, the doctore's one-sentence read after a first loss."

   ITS PREMISE IS A FIGURE THIS SAME AUDIT ALREADY KILLED. #208's "median career is one bout" was
   the survey's own artifact — 470 fallen summaries counted as zero-bout careers, dragging the
   median from five to one — and the corrected figure is **4-5 bouts with 88-90% debut survival**.
   Measured here (`probes/green.mjs`, 10 houses over 1,731 weeks, 278 men who ever stood in the
   cells): median 4 bouts, 1 win.

   AND TWO OF THE THREE GATES IT NAMES ARE NOT WHAT IT SAYS. `manTells` bands the six stats, an
   injury, an age and a kill count, and answers on a man who has never fought — the reading is dull,
   not absent. `masterOpen` is a HOUSE gate (`bLevel(armamentarium) >= 2 && acclaim >= 32`), nothing
   to do with a man's wins at all.

   THE CLAIM SURVIVES IN A CORRECTED FORM AND IT IS WORSE THAN THE ITEM'S VERSION. 85.3% of men
   fight at least once and 60.8% win at least once, but only **16.5% reach the five wins a nickname
   wants, 14.7% the six a signature wants, 9.7% the eight a saga wants.** Five men in six never
   cross a single career gate. And the first bout bought almost nothing — chronicle lines naming a
   man, by how far he got:

     0 bouts 1.3     1 bout 1.4     2-3 bouts 2.5     4-7 bouts 3.3     8+ bouts 5.4

   Fighting once was worth **a tenth of a line** over never fighting at all.

   So the debut is a night — the fifth, kept like the sparing because a man has exactly one — and
   his first blooding and his first defeat speak. The doctore's read is a READ: banded on
   `missioAccount(res.vB)`, the account he gave, which is the same figure the editor weighed when
   deciding whether to let him up. After: **78.4%** of men carry a first afternoon, against 14.7%
   for the next-lowest man-system, and the one-bout band moved 1.4 -> 1.6 lines.

   AND A FOURTH ZERO THAT WAS THE INSTRUMENT. The signature is reachable by the 14.7% who make six
   wins and was reached by **0 of 278 men** — no rope in this suite had a button for it. `signature`
   is a lever now, opt-in like `court` and `rites`, and teaches nine men across three houses.

   FIVE ARMS:
   1 · EVERY MAN WHO FIGHTS AND COMES OFF HAS A FIRST AFTERNOON, in all four engines.
   2 · AND IT IS THE BOUT'S OWN NUMBERS, not a second copy of them.
   3 · THE DOCTORE'S READ IS BANDED ON THE ACCOUNT — three bands, three different sentences.
   4 · A MAN HAS EXACTLY ONE FIRST, and a second bout does not overwrite it.
   5 · THE GATES THE ITEM NAMES: a tell answers a man with no bouts, mastery is a house gate, and
       the three real career gates are crossed by about one man in six. */
import fs from "node:fs";
import path from "node:path";
import { found, clearAll, installRope, ROOT } from "../harness.mjs";

export const name = "first";
export const describe = "every man who fights has a first afternoon, and it is the bout's own numbers";
export const slow = true;

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"FIRST-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","firstBlood","NIGHTS","markNight","nightWhere","missioAccount",
                  "manTells","masterOpen","SIG_GATE","genGladiator","activeG","doFight","doMelee",
                  "doVenatio","doPairFight","GREEN_HARD","GREEN_POOR","canLearnSig",
                  "teachSigTo"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const bad = [];

    /* ---- 3. the doctore's read, on three built accounts ---- */
    const reads = {};
    for(const [band, account] of [["outlasted", A.GREEN_HARD + 8], ["close", 40],
                                  ["outclassed", A.GREEN_POOR - 8]]){
      const d = A.newGameState(`FIRST-${band}`, "capua", `FIRST-${band}`);
      const g = A.genGladiator(d, 55); g.id = d.nextId++; g.status = "active"; g.mine = true;
      g.wins = 0; g.losses = 1; g.kills = 0; d.gladiators.push(g);
      const sum = [];
      A.firstBlood(d, g, A.nightWhere(d, { festival:"the pits" }, "somebody"), false,
        { account, left:12, crowd:55, killed:false }, sum);
      const said = sum.filter(l=>/lost his first/.test(l))[0] || null;
      reads[band] = said;
      if(!said) bad.push(`a man who lost his first at ${account} in the hundred hears nothing`);
      /* and the night is written whether he won it or not */
      if(!(g.nights && g.nights.first)) bad.push(`a man who lost his debut gets no first afternoon`);
      else if(g.nights.first.account !== Math.round(account))
        bad.push(`the night says ${g.nights.first.account} where the bout gave ${Math.round(account)}`);
    }
    const said = Object.values(reads).filter(Boolean);
    if(new Set(said).size !== said.length)
      bad.push(`two of the three accounts get the same read back — the bands are not bands`);
    if(said.length === 3){
      if(!/outlasted/.test(reads.outlasted)) bad.push(`a man who gave 63 in the hundred is not told he was outlasted: "${reads.outlasted}"`);
      if(!/never landed/.test(reads.outclassed)) bad.push(`a man who gave 17 in the hundred is not told he never landed`);
    }

    /* ---- 4. one first, and a second bout does not take it ---- */
    { const d = A.newGameState("FIRST-ONCE", "capua", "FIRST-ONCE");
      const g = A.genGladiator(d, 55); g.id = d.nextId++; g.status = "active"; g.mine = true;
      g.wins = 1; g.losses = 0; d.gladiators.push(g);
      A.firstBlood(d, g, A.nightWhere(d, { festival:"the pits" }, "one"), true,
        { account:70, left:40, crowd:80 }, []);
      const kept = g.nights.first && g.nights.first.week;
      g.wins = 2;                                    /* his second, weeks later */
      const d2 = Object.assign({}, d, { week: d.week + 9 });
      A.firstBlood(d2, g, A.nightWhere(d2, { festival:"the games" }, "two"), true,
        { account:90, left:80, crowd:95 }, []);
      if(!g.nights.first) bad.push(`his first afternoon vanished on his second bout`);
      else if(g.nights.first.week !== kept || g.nights.first.account !== 70)
        bad.push(`a second bout overwrote his first afternoon — it now reads week `
          + `${g.nights.first.week}, ${g.nights.first.account} in the hundred`);
      /* and a man on his third does not suddenly acquire one */
      const h = A.genGladiator(d, 55); h.id = d.nextId++; h.status = "active"; h.mine = true;
      h.wins = 2; h.losses = 1; d.gladiators.push(h);
      A.firstBlood(d, h, A.nightWhere(d, { festival:"the pits" }, "x"), true, { account:50 }, []);
      if(h.nights && h.nights.first) bad.push(`a man on his fourth bout was given a first afternoon`); }

    /* ---- 1 and 2: played, in every engine the cards produce ---- */
    const engines = new Set();
    const play = { men:0, fought:0, night:0, off:0, died:0 };
    for(let h = 0; h < 3; h++){
      const d = A.newGameState(`FIRST-P${h}`, "capua", `FIRST-P${h}`);
      for(let w = 0; w < 130 && !d.over; w++){
        try { R.lanista(d, {}); } catch(e){ break; }
        if(d.over){ d.over = null; if(d.rebellion) d.rebellion = null;
          d.unrest = Math.min(d.unrest, 35); }
      }
      for(const g of (d.gladiators||[])){
        play.men++;
        const bouts = (g.wins||0) + (g.losses||0);
        if(bouts >= 1) play.fought++;
        const n = g.nights && g.nights.first;
        if(n) play.night++;
        else if(bouts >= 1 && g.status !== "dead"){ play.off++;
          if(play.off === 1) bad.push(`${g.name} has fought ${bouts} time${bouts===1?"":"s"} and `
            + `walked off, and has no first afternoon on his page`); }
        else if(bouts >= 1) play.died++;
        if(n){
          if(typeof n.won !== "boolean") bad.push(`${g.name}'s first does not say whether he won it`);
          if(!n.festival || typeof n.week !== "number") bad.push(`${g.name}'s first has no place or week`);
          if(n.account != null && !(n.account >= 0 && n.account <= 100))
            bad.push(`${g.name} took ${n.account} in the hundred on his first`);
        }
      }
    }
    if(play.fought < 20) bad.push(`only ${play.fought} men ever fought — the sweep measured nothing`);
    if(!play.night) bad.push(`not one first afternoon was written across ${play.men} men`);

    /* every engine writes it, driven the way `nights` drives them */
    { const d = A.newGameState("FIRST-ENG", "capua", "FIRST-ENG");
      const fin = (f, a) => { try { return f(...a); } catch(e){ return null; } };
      for(let w = 0; w < 160 && !d.over; w++){
        const fit = A.activeG(d).filter(g=>A.canFight(g));
        const os = ((d.games && d.games.offers) || []);
        /* PREFER the rarer engines — taking the first card on the bill is taking a single almost
           every week, which is how the first draft exercised one of four */
        const o = os.filter(x=>x.pair)[0] || os.filter(x=>x.melee)[0]
          || os.filter(x=>x.venatio)[0] || os[0];
        if(o && fit.length){
          if(o.pair && fit.length >= 2){ engines.add("pair");
            fin(A.doPairFight, [d, [fit[0].id, fit[1].id], o, "measured", null, null]); }
          else if(o.melee && fit.length >= 3){ engines.add("melee");
            fin(A.doMelee, [d, fit.slice(0,3).map(g=>g.id), o, null, null, "measured"]); }
          else if(o.venatio){ engines.add("hunt");
            fin(A.doVenatio, [d, fit[0].id, o, "measured", null, null]); }
          else { engines.add("single");
            fin(A.doFight, [d, fit[0].id, o, "measured", null, null, null, "none"]); }
        }
        if(d.pendingEvent) d.pendingEvent = null;
        try { A.endWeek(d); } catch(e){ break; }
        if(d.over){ d.over = null; if(d.rebellion) d.rebellion = null; d.unrest = Math.min(d.unrest, 35); }
      } }
    /* the played engines are an OBSERVATION — which cards a season throws is not this check's
       promise. What is held is that all four ENGINES call the function, and that is read off the
       source, the way `read` holds its five panels. */

    /* ---- 5. the gates the item names ---- */
    const gates = (()=>{ const d = A.newGameState("FIRST-G", "capua", "FIRST-G");
      const g = A.genGladiator(d, 55); g.wins = 0; g.losses = 0; g.kills = 0; g.pfame = 0;
      const t = A.manTells(d, g);
      if(!t.length) bad.push(`a man with no bouts gets no reading at all — the item says tells need `
        + `history and the function is supposed to disagree`);
      const house = A.masterOpen(d);
      return { tells:t.length, first:t[0], master:typeof house === "boolean", sigWins:A.SIG_GATE.wins }; })();
    /* and the signature has a button now */
    let sig = 0;
    { const d = A.newGameState("FIRST-SIG", "capua", "FIRST-SIG");
      const seen = new Set();
      for(let w = 0; w < 190 && !d.over; w++){
        for(const g of A.activeG(d)) if(g.signature || g.teaching) seen.add(g.id);
        try { R.lanista(d, { signature:true }); } catch(e){ break; }
      }
      sig = seen.size;
      if(!sig) bad.push(`the rope taught no signature in 190 weeks with the lever on — the arc reads `
        + `dark for want of a button, which is what #221's zeroes were`); }

    return { bad, reads, play, engines:[...engines], gates, sig };
  });

  if(r.miss) return { pass:false, why:`handle is missing ${r.miss.join(", ")}`, lines:[] };
  bad.push(...r.bad);

  /* ---- 1b. all four engines call it, read off the source ---- */
  const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");
  const callers = [];
  { const lines2 = src.split("\n");
    let fn = null;
    for(let i = 0; i < lines2.length; i++){
      const m = /^function ([A-Za-z_$][\w$]*)\(/.exec(lines2[i]);
      if(m) fn = m[1];
      if(/\bfirstBlood\(/.test(lines2[i]) && fn && fn !== "firstBlood") callers.push(fn);
    } }
  const want = ["boutAftermath", "doMelee", "doVenatio", "doPairFight"];
  for(const w of want) if(!callers.includes(w))
    bad.push(`\`${w}\` never calls firstBlood — a man who debuts in that engine gets no first `
      + `afternoon, which is the hole the played sweep is too thin to find`);

  lines.push(`${r.play.men} men · ${r.play.fought} fought · ${r.play.night} carry a first afternoon`
    + ` · ${r.play.died} died on their debut · ${r.play.off} walked off without one`);
  lines.push(`the four engines that write one: ${[...new Set(callers)].join(", ")}`
    + ` · this run's cards exercised ${r.engines.join(", ")}`);
  lines.push(`the doctore's three reads:`);
  for(const [k, v] of Object.entries(r.reads))
    lines.push(`   ${k.padEnd(11)} ${String(v).replace(/^.*?lost his first\. /, "").slice(0, 92)}`);
  lines.push(`a man with no bouts still gets ${r.gates.tells} reading — "${String(r.gates.first).slice(0, 60)}…"`);
  lines.push(`mastery is a house gate (a boolean off the armoury and acclaim: ${r.gates.master})`
    + ` · the signature wants ${r.gates.sigWins} wins, and the rope now teaches ${r.sig} of them`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
