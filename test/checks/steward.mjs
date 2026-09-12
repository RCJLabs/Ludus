/* THE MASTER WHO IS UPSTAIRS — #272

   (`steward` was free in BOTH directories; checked before writing.)

   ---- #272'S PREMISE IS THE #118-ERA STATE AND IT WAS FIXED ----
   "The dynasty is playable only through death. `succeed` fires when the lanista dies or breaks;
   `oldAge` ... #118 measured it UNREACHABLE."

   `lanistaWeek` carries a retirement branch — `L.age >= 62 && L.health >= 45 && d.heir &&
   heirOfAge(d) && yearOf(d) >= 6 && R() < 0.06` — raising `d.succession` with `retire:true`, and
   `succeed` reads it. **It is not merely reachable; it is the only door anybody uses.**
   `probes/steward.mjs`, two policies, 24 houses x 520 weeks each:

       reference   3 handovers, 3 RETIRED, 0 died
       complete    7 handovers, 7 RETIRED, 0 died

   matching `probes/widow.mjs`'s fifteen of fifteen. And the state the door needs is common: a
   lanista past `LAN_AGE_FROM` and a named heir of age stand together in **10.4%** of reference
   weeks and **23.5%** under a complete player. The door does not open on nobody; it opens on
   everybody who gets that far.

   ---- THE FAULT IS WHAT THE HOUSE SAYS AFTERWARDS ----
   `succeed` promises the retired man "keeps his rooms and the ledger, and comes down to the square
   when the mood takes him". #248 phase 2 then gives the house six recurring lines about its old
   master on a fourteen-week cadence — and every one of the six was written for a DEAD man. "A
   trader asks after him by name and takes the news standing in the doorway." "He has now served two
   masters in this house."

       10 of 10 and 42 of 42 of those lines landed on a man still in the building.

   `f.retired` was written on the forebear record, read by exactly one UI row ("stepped back at"
   against "died at"), and read by nothing else.

   FOUR ARMS. */
import { hasHandle } from "../harness.mjs";

export const name = "steward";
export const describe = "a master who stepped back is not a master who was carried out, and the house says so";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["FORE_LINES","FORE_LINES_BACK","FORE_EVERY","foreWeek","newGameState","succeed",
      "servedUnder","heirOfAge","LAN_AGE_FROM","yearOf"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

    /* ---- the two sets must line up, because the index is the calendar ---- */
    const shape = {
      n:{ dead:A.FORE_LINES.length, back:A.FORE_LINES_BACK.length },
      arity:{ dead:A.FORE_LINES.map(f=>f.length), back:A.FORE_LINES_BACK.map(f=>f.length) },
    };

    /* ---- and what each one actually says, driven rather than read ---- */
    const say = (retired)=>{
      const d = A.newGameState("St","clean","STEWCHK" + (retired?"R":"D"));
      d.gold = 20000; d.week = 200;
      for(let i=0;i<3;i++){ const m = A.genGladiator(d, 70); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.fatigue=0; m.lastFought=-9; d.gladiators.push(m); }
      /* two men who served under him, so the lines that name somebody have somebody to name */
      d.annals = d.gladiators.slice(0,2).map(g=>({ name:g.name, joined:100, left:null }));
      d.forebears = [{ name:"Marcus Tullius", age:63, traits:[], from:20, to:190,
        gen:1, retired:!!retired }];
      /* `chron` UNSHIFTS onto `d.log` — not `d.chronicle`, which does not exist. The first pass of
         this check read a field that was never written and reported all twelve lines silent, which
         is the instrument saying nothing rather than the game. */
      const out = [];
      for(let k=1;k<=A.FORE_LINES.length;k++){
        d.week = 190 + k*A.FORE_EVERY;
        const n0 = (d.log||[]).length;
        try { A.foreWeek(d); } catch(e){ out.push("THREW: " + e.message); continue; }
        const now = d.log || [];
        out.push(now.length > n0 ? String((now[0]||{}).text || "") : "");
      }
      return out;
    };
    const dead = say(false), back = say(true);

    /* ---- and the state the door needs, split by term over played weeks ---- */
    /* ---- THE DOOR'S OWN TERMS, HELD RATHER THAN RE-MEASURED ----
       The first cut of this arm played a bare `endWeek` loop and read "138 weeks past LAN_AGE_FROM,
       0 with an heir of age". Naming an heir is a PLAYER action; a house left alone never names one,
       so the fixture could not reach the state whatever the game does. The share in play is the
       probe's job and its numbers are in the header (10.4% and 23.5%). What belongs here is the
       gate: five terms, each one asserted, so a moved term says which. */
    const gate = (()=>{
      const d3 = A.newGameState("St","clean","STEWGATE");
      d3.gold = 30000; d3.week = 8 * 52;
      d3.lanista = Object.assign({}, d3.lanista, { age:63, health:60, since:1 });
      d3.heir = { kind:"doctore", name:"Rufus", traits:[] };
      let ofAge = null; try { ofAge = !!A.heirOfAge(d3); } catch(e){ ofAge = "THREW: " + e.message; }
      let yr = null; try { yr = A.yearOf(d3); } catch(e){ yr = null; }
      return { age:d3.lanista.age, health:d3.lanista.health, named:!!d3.heir,
        ofAge, year:yr, lanFrom:A.LAN_AGE_FROM };
    })();

    return { shape, dead, back, gate, every:A.FORE_EVERY };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };

  const lines = [], fails = [];
  lines.push(`the two sets: ${out.shape.n.dead} for a dead master, ${out.shape.n.back} for one who stepped back`);
  lines.push(`   arities  dead [${out.shape.arity.dead.join(",")}] · back [${out.shape.arity.back.join(",")}]`);
  lines.push("what the house says about a master who was carried out:");
  for(const t of out.dead) lines.push(`   ${t ? t.slice(0,112) : "(silent)"}`);
  lines.push("and about one who stepped back:");
  for(const t of out.back) lines.push(`   ${t ? t.slice(0,112) : "(silent)"}`);
  const G = out.gate;
  lines.push(`the retirement gate's terms: age ${G.age} (wants 62) · health ${G.health} (wants 45) · ` +
    `an heir named ${G.named} · of age ${G.ofAge} · year ${G.year} (wants 6)`);

  /* ---- 1. the sets line up, because the index is the calendar ---- */
  if(out.shape.n.back !== out.shape.n.dead)
    fails.push(`${out.shape.n.back} lines for a retired master against ${out.shape.n.dead} for a dead one — ` +
      `\`foreWeek\` indexes by \`since / FORE_EVERY\`, so a short set goes silent partway through the memory`);
  for(let i=0;i<Math.min(out.shape.arity.dead.length, out.shape.arity.back.length);i++)
    if(out.shape.arity.dead[i] !== out.shape.arity.back[i])
      fails.push(`line ${i} takes ${out.shape.arity.back[i]} arguments in the retired set against ` +
        `${out.shape.arity.dead[i]} in the other — the \`fn.length < 3\` rule that spares the lines needing a ` +
        `named man is what keeps a house with nobody left from throwing`);

  /* ---- 2. every line fires, in both registers ---- */
  for(const [tag, set] of [["dead", out.dead], ["retired", out.back]]){
    const silent = set.filter(t=>!t).length, threw = set.filter(t=>/^THREW/.test(t));
    if(threw.length) fails.push(`the ${tag} set threw: ${threw[0]}`);
    if(silent) fails.push(`${silent} of ${set.length} ${tag} lines said nothing on their own week`);
  }

  /* ---- 3. AND THEY ARE NOT THE SAME LINES — the whole of #272 ---- */
  { let same = 0;
    for(let i=0;i<Math.min(out.dead.length, out.back.length);i++)
      if(out.dead[i] && out.dead[i] === out.back[i]) same++;
    if(same)
      fails.push(`${same} of the recurring lines read identically for a master who stepped back and one who was ` +
        `carried out — measured, 10 of 10 and 42 of 42 of these landed on a LIVING man, and \`succeed\` had just ` +
        `promised he "keeps his rooms and comes down to the square"`);
    /* the dead register must not be caught telling a living man's house he is gone */
    const deadWords = /takes the news|carried out|buried|his grave|since he died/i;
    for(const t of out.back)
      if(t && deadWords.test(t))
        fails.push(`a house whose master is upstairs was told: "${t.slice(0,90)}"`);
    /* and the living register must not be used for a man who is not there */
    const liveWords = /upstairs|comes down|in front of him|watches from/i;
    for(const t of out.dead)
      if(t && liveWords.test(t))
        fails.push(`a house whose master was carried out was told: "${t.slice(0,90)}"`);
    if(!out.back.some(t=>t && liveWords.test(t)))
      fails.push("not one of the retired lines says the man is still there, which is the only thing that makes it a second set"); }

  /* ---- 4. and every term of the door is satisfiable at once ---- */
  { if(!(G.age >= 62)) fails.push(`the fixture's lanista is ${G.age}, under the 62 the branch wants`);
    if(!(G.health >= 45)) fails.push(`the fixture's lanista is at health ${G.health}, under the 45 the branch wants`);
    if(!G.named) fails.push("the fixture named no heir");
    if(G.ofAge !== true)
      fails.push(`\`heirOfAge\` says ${JSON.stringify(G.ofAge)} for a named doctore heir in year ${G.year} — ` +
        `if this term has moved, the retirement door is the only handover anybody uses (3 of 3 and 7 of 7 ` +
        `measured) and it has just narrowed`);
    if(!(G.year >= 6)) fails.push(`the fixture is in year ${G.year}, under the 6 the branch wants`);
    if(!(G.lanFrom > 0)) fails.push("LAN_AGE_FROM is not a number"); }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
