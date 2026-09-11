/* WHAT A RITE COSTS, SAID OUT LOUD — #264

   (`rites` was free in BOTH directories; checked before writing, in checks and probes.)

   The panel that offers the three answers to a dead man rendered `name`, `desc` and `cost` and NOT
   ONE of the four numbers the table carries. v3.252.0 is what made that a defect rather than a
   style: the unrest credit it did not print is the main brake on the rebellion arc — 12.0%/8.0% of
   a house's weeks down to 1.3%/0.6% — and v3.253.0 found the free door's LACK of one is the whole
   of why it buys nothing against the rising. The most consequential number in the late game was
   behind a panel that did not print it.

   This is `checks/stage.mjs` arm 1 applied to a second table, and #166's note stands for both:
   *"every non-cosmetic term now names itself, off the table, so a term cannot be added without the
   player being told."*

   ---- AND THE FIELD IS NOT THE NUMBER, WHICH IS WHY ARM 2 EXISTS ----
   `holdMunera` spends `regard` two ways depending on its SIGN. Positive goes through
   `remember(d, g, "munera", riteMult(M, close))`, and `remember` adds `REGARD.munera.n` — **13** —
   times that multiplier. Negative is applied directly at `regard * (close?1.8:1)`. So the table's
   `rite.regard = 5` is **+7** to a yard man, and `games.regard = 14` is **+18**. Printing the raw
   field would have been wrong by 30-40% on the two rites that matter.

   MEASURED, one house of three men cloned per rite (victim, brother, bystander), unrest set to 50
   so neither clamp is in the way:

     rite     unrest   fame   mercy   yard obs / true / said   kin obs / true / said
     none          4      0       0        -6 /  -6  /  -6      -10.8 / -10.8 / -11
     rite         -7      2       5         7 / 6.5  /   7         11 / 11.05 /  11
     games       -19     11      14        18 / 18.2 /  18         31 / 30.94 /  31

   THE ONE POINT OF SLACK IS THE CONTRACT AND NOT A FUDGE. `riteRegardOf` rounds the DELTA;
   `remember` rounds the SUM (`Math.round(regardOf(g) + n*mult)`), so a man standing on a fractional
   regard lands a point either side of the figure on the card. The first cut of this fixture read
   that as a MISMATCH — observed 19 against a said 18, on a man at 51.3 — and it was the harness
   rounding the observed delta, not the card being wrong. Unrest, fame and mercy carry no slack at
   all and are asserted exactly.

   TWO ARMS. */
import { installRope } from "../harness.mjs";

export const name = "rites";
export const describe = "every term a rite carries names itself on the card, and the number on the card is the number the sand does";

/* `key` and `name` identify it, `desc` and `line` are the prose, `cost` is rendered as the price
   beside the name and is the one non-cosmetic term the panel already told the player about. */
const COSMETIC = ["key","name","desc","line","cost"];

export async function run({ p }){
  const lines = [], bad = [];
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["RITES","RITE_KEYS","RITE_TERM","RITE_TERM_KEYS","riteSays","riteMult",
      "riteRegardOf","REGARD","holdMunera","markUnburied","regardOf","activeG","newGameState"]
      .filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const clone = x => JSON.parse(JSON.stringify(x));

    /* ONE house grown to three men and cloned per rite — three separate seeds gave three different
       houses and two were too small to carry a victim, a brother and a bystander at once */
    let base = null;
    for(const seed of ["RITECHK","RITECHK-B","RITECHK-C","RITECHK-D"]){
      const d = A.newGameState("Rt","clean",seed);
      for(let w=0;w<120 && !d.over;w++){ try { R.lanista(d); } catch(e){ break; }
        if(A.activeG(d).length>=3) break; }
      if(!d.over && A.activeG(d).length>=3){ base = d; break; }
    }
    if(!base) return { why:"no fixture house reached three living men in 120 weeks — that is the fixture failing, not the panel" };

    const rows = [];
    for(const k of A.RITE_KEYS){
      const R2 = A.RITES[k];
      const carried = Object.keys(R2).filter(t=>!["key","name","desc","line","cost"].includes(t) && R2[t]);
      const says = A.riteSays(k);
      const unsaid = carried.filter(t=>!A.RITE_TERM[t] || !says.includes(A.RITE_TERM[t](R2[t], R2)));

      const d = clone(base);
      const men = A.activeG(d), victim = men[0], kinMan = men[1], yardMan = men[2];
      A.markUnburied(d, victim);
      const m = d.unburied[d.unburied.length-1];
      m.kin = [kinMan.id];
      d.gold = 99999; d.unrest = 50;
      const b = { unrest:d.unrest, fame:d.fame, mercy:(d.rep||{}).mercy||0,
        yard:A.regardOf(yardMan), kin:A.regardOf(kinMan) };
      const held = A.holdMunera(d, m.gid, k);
      const men2 = A.activeG(d);
      const y2 = men2.find(g=>g.id===yardMan.id), k2 = men2.find(g=>g.id===kinMan.id);
      const a = { unrest:d.unrest, fame:d.fame, mercy:(d.rep||{}).mercy||0,
        yard:y2?A.regardOf(y2):null, kin:k2?A.regardOf(k2):null };
      rows.push({ k, name:R2.name, says, carried, unsaid, held,
        obs:{ unrest:a.unrest-b.unrest, fame:a.fame-b.fame,
          mercy:Math.round((a.mercy-b.mercy)*100)/100,
          yard:a.yard==null?null:Math.round((a.yard-b.yard)*100)/100,
          kin:a.kin==null?null:Math.round((a.kin-b.kin)*100)/100 },
        tbl:{ unrest:R2.unrest||0, fame:R2.fame||0, mercy:R2.mercy||0 },
        said:{ yard:A.riteRegardOf(R2,false), kin:A.riteRegardOf(R2,true) } });
    }
    /* the structural half: a term carried by ANY rite with no phrase in the table is silent */
    const allCarried = new Set(A.RITE_KEYS.flatMap(k=>Object.keys(A.RITES[k]))
      .filter(t=>!["key","name","desc","line","cost"].includes(t)));
    const uncovered = [...allCarried].filter(t=>!A.RITE_TERM_KEYS.includes(t));
    return { rows, uncovered, men:A.activeG(base).length, n:A.REGARD.munera.n };
  });

  if(r.why) return { pass:false, why:r.why, lines };
  const { rows, uncovered } = r;

  /* 1 — EVERY TERM NAMES ITSELF */
  for(const row of rows){
    lines.push(`${row.name.padEnd(20)} ${row.carried.length ? row.carried.join(" · ") : "nothing"}  ->  "${row.says}"`);
    if(row.unsaid.length)
      bad.push(`\`${row.k}\` carries ${row.unsaid.join(", ")} and its line does not say so — a term the player is never told about, which is what #264 was`);
    if(row.carried.length && row.says === "Nothing bought, nothing spent.")
      bad.push(`\`${row.k}\` carries ${row.carried.length} terms and its line says it carries none`);
    if(!row.carried.length && row.says !== "Nothing bought, nothing spent.")
      bad.push(`\`${row.k}\` carries nothing and its line claims something`);
  }
  if(uncovered.length)
    bad.push(`RITE_TERM has no phrase for: ${uncovered.join(", ")} — add one, or the term is silent. `
      + `This is the structural half and the reason this is a check rather than three assertions: a term added to RITES must be added to RITE_TERM or nobody is told`);

  /* 2 — AND THE NUMBER SAID IS THE NUMBER THE SAND DOES */
  lines.push(`the sand, one house of ${r.men} men cloned per rite (REGARD.munera.n = ${r.n}), unrest set to 50:`);
  for(const row of rows){
    if(!row.held){ bad.push(`\`holdMunera\` refused \`${row.k}\` on the fixture house, so nothing was measured for it — every rite is refused when \`d.gold < cost\`, the free one included`); continue; }
    lines.push(`   ${row.k.padEnd(6)} unrest ${row.obs.unrest} [table ${row.tbl.unrest}] · fame ${row.obs.fame} [${row.tbl.fame}] · mercy ${row.obs.mercy} [${row.tbl.mercy}]`
      + ` · yard ${row.obs.yard} [card ${row.said.yard}] · kin ${row.obs.kin} [card ${row.said.kin}]`);
    for(const [f, obs, want] of [["unrest",row.obs.unrest,row.tbl.unrest],["fame",row.obs.fame,row.tbl.fame],["mercy",row.obs.mercy,row.tbl.mercy]])
      if(obs !== want)
        bad.push(`\`${row.k}\` moved ${f} by ${obs} and its table says ${want} — the card prints the table, so the card is lying about ${f}`);
    for(const [who, obs, said] of [["the yard",row.obs.yard,row.said.yard],["his brothers",row.obs.kin,row.said.kin]]){
      if(obs == null){ bad.push(`\`${row.k}\` left no man to read ${who}'s regard off — the fixture failed, not the panel`); continue; }
      if(Math.abs(obs - said) > 1)
        bad.push(`\`${row.k}\` moved ${who}'s regard by ${obs} and the card says ${said} — off by ${Math.round(Math.abs(obs-said)*100)/100}, past the one point \`remember\` rounding the SUM can explain. `
          + `\`riteRegardOf\` and \`holdMunera\` share \`riteMult\`, so a gap this size means \`REGARD.munera.n\` or a kin multiplier moved on one side only`);
    }
  }

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
