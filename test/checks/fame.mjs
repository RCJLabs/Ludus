/* FAME IS THE WALL, NOT THE SPARE CHANGE, AND THE MUNUS PAYS IT OUT

   Audit item #227: "Fame climbs forever and buys almost nothing. Median fame 3,848 by era four and
   linear throughout; titles cap out and nothing consumes it. Meanwhile the munus — staging your own
   games, the era-appropriate fame SINK — was held 0 times (rope). Recommend fame become spendable
   standing: staging games, endowing works, backing candidates."

   EVERY LIMB OF THAT IS WRONG EXCEPT THE ZERO, and the zero is the item's own concession.

   1 · FAME IS NOT SPARE — IT IS THE COMMONEST WALL. Measured over 992 played weeks
       (`probes/fame.mjs`), on every week a house is short of its next rung, fame is the first term
       failing on 30.3% of them, ahead of census worth, favour and the fee. Making fame a currency a
       player burns would make the one wall it holds worse. The recommendation would have hurt.

   2 · AND THE "SINK" IS A SOURCE. `stageMunus` takes COIN and PAYS FAME — the scales gate on fame
       at 120/300/600 and hand back 14/32/64 of it. It is the fame engine the game already has, and
       the item names it as the drain.

   3 · THE ZERO IS EXACT AND TOTAL. `stageMunus` had no caller in the reference player at all, so
       "held 0 times" measured the harness. Given one (`munus:true`, opt-in for the reason `works`
       is), the same eight houses go from a median end fame of 672 to 3,210 and a median end rung of
       3 to 6, and fame's share of the binding falls from 30.3% to 12.7%.

   4 · WHAT IS ACTUALLY UNREACHABLE IS THE APEX, AND THE WALL THERE IS COIN. Amicus Caesaris had all
       four of its terms satisfied at once on 0 weeks in every arm measured, with census worth and
       the admission fee short on 100% of them. #154 predicted it here before anybody measured it:
       "favour is bought at the table and the table is the coin."

   AND A FIX WAS BUILT AND THROWN AWAY, which is recorded over `riseFee`: letting surplus name pay
   up to half the reception took Eques from claimable on 57% of weeks to 91% and Known in Rome from
   54% to 92%, and moved the apex from 0 weeks to 2. Loosening the part of the ladder nobody said
   was tight while missing the part that is, is not a fix.

   FIVE ARMS:
   1 · THE MUNUS PAYS FAME AND COSTS COIN, which is the item's factual error, held as an invariant.
   2 · AND THE REFERENCE PLAYER CAN STAGE ONE, or arm 1's campaign half measures the harness again.
   3 · FAME IS STILL A WALL over real play — if this goes quiet, somebody has made fame spendable.
   4 · EVERY TERM THE LADDER NAMES IS ACTUALLY CONSULTED. A rung reports fame, favour, worth and
       fee; `canClaimRise` must refuse on each one alone, or a term is decoration.
   5 · AND THE FEE THE PANEL QUOTES IS THE FEE THAT IS TAKEN, which is #150's rule. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "fame";
export const describe = "fame is the wall, not the spare change, and the munus pays it out";
export const slow = true;   /* plays houses up the ladder */

const WALL_FLOOR = 0.08;   /* measured 30.3%; under 8% fame has stopped being a bar anybody meets */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"FAME-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","stageMunus","munusReady","munusCost","MUNUS_SCALES","MUNUS_OCCASIONS",
      "RISE_RANKS","riseNeed","riseOf","riseNext","riseFee","canClaimRise","claimRise"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const clone = x => JSON.parse(JSON.stringify(x));

    /* 1 — the munus pays fame and costs coin */
    const base = A.newGameState("Fame", "clean", "FAME-K", null);
    for(let w=0; w<40; w++){ if(base.over) break; try { R.lanista(base); } catch(e){ break; } }
    base.gold = 40000; base.fame = 1200;
    const occ = Object.keys(A.MUNUS_OCCASIONS)[0];
    const staged = [];
    for(const key of Object.keys(A.MUNUS_SCALES)){
      const s = clone(base);
      const plan = { occasion:occ, scale:key, hunt:false, sine:false, sell:false, spectacle:null };
      const f0 = s.fame, g0 = s.gold, cost = A.munusCost(plan);
      let said = null; try { said = A.stageMunus(s, plan); } catch(e){ said = "threw"; }
      staged.push({ key, gate:A.MUNUS_SCALES[key].gate, cost,
        dFame: Math.round(s.fame - f0), dGold: Math.round(s.gold - g0), said: !!said });
    }

    /* 2 — and the reference player can stage one */
    let ropeStaged = 0, ropeWeeks = 0;
    for(let h=0; h<3; h++){
      const d = A.newGameState("Fame", "clean", "FAME-M"+h, null);
      let last = d.munusLast;
      for(let w=0; w<260; w++){
        if(d.over) break;
        try { R.lanista(d, { munus:true }); } catch(e){ break; }
        ropeWeeks++;
        if(d.munusLast !== last){ last = d.munusLast; ropeStaged++; }
      }
    }

    /* 3 — fame is still a wall over real play */
    const bind = { fame:0, favor:0, worth:0, fee:0, none:0 };
    let weeks = 0;
    for(let h=0; h<4; h++){
      const d = A.newGameState("Fame", "clean", "FAME-R"+h, null);
      for(let w=0; w<300; w++){
        if(d.over) break;
        try { R.lanista(d); } catch(e){ break; }
        weeks++;
        const need = A.riseNeed(d);
        if(!need) continue;
        bind[!need.fameOk ? "fame" : !need.favorOk ? "favor"
          : !need.goldOk ? "worth" : !need.feeOk ? "fee" : "none"]++;
      }
    }
    const tot = Object.values(bind).reduce((n,v)=>n+v,0);

    /* 4 — every term the ladder names is actually consulted */
    /* ---- AND THE FIFTH TERM, WHICH THE FIRST CUT OF THIS FIXTURE DID NOT KNOW ABOUT ----
       `canClaimRise` wants `n.full` as well as the four the panel names: `d.rise.standing >= 100`,
       a meter that fills over weeks once fame and favour are met. A fixture that hands a house
       infinite fame, favour and coin and forgets it cannot claim anything, which is what this arm
       reported before — "cannot claim a rung at all", on a house with 999,999 of everything. And
       `d.favor` is recomputed FROM the patrons, so setting the field and then calling
       `recomputeFavor` sets it straight back to zero. */
    const outfit = s => { s.fame = 999999; s.gold = 999999;
      s.rise = { rank:0, standing:100 };
      s.patrons = [{ id:1, name:"A senator", rank:"senator", favor:100, want:null, since:0, served:0, slighted:0 }];
      if(A.recomputeFavor) A.recomputeFavor(s);
      return s; };
    const rich = outfit(clone(base));
    for(let i=0;i<40;i++){ try { if(!A.claimRise(rich)) break; } catch(e){ break; }
      rich.rise.standing = 100; }
    const climbed = A.riseOf(rich);
    /* now take each term away in turn from a house that could otherwise claim */
    const gate = {};
    /* ---- AT A RUNG THAT NAMES ALL FOUR ----
       The first cut ran this from rung 0, where the next rung is Man of Means — `favor: 0` — and
       then reported "a house with no favor can still claim its next rung, favour is decoration".
       It is not decoration; that rung does not ask for it. Taking a term away only tests anything
       at a rung that wants it, so this starts one rung up, where Citizen of Standing asks for fame
       120, favour 40, worth 1,200 and a fee. */
    const ready = outfit(clone(base)); ready.rise = { rank:1, standing:100 };
    const askFor = A.riseNext(ready);
    const canBase = A.canClaimRise(ready);
    for(const [term, hobble] of [
      ["fame",  s=>{ s.fame = 0; }],
      ["favor", s=>{ (s.patrons||[]).forEach(x=>{ x.favor = 0; });
                     if(A.recomputeFavor) A.recomputeFavor(s); s.favor = 0; }],
      ["coin",  s=>{ s.gold = 0; s.gear = {}; s.gladiators = []; s.buildings = {}; s.works = {};
                     s.owed = []; }],
      ["standing", s=>{ s.rise = { rank:s.rise.rank, standing:0 }; }],
    ]){
      const s = clone(ready); hobble(s);
      gate[term] = A.canClaimRise(s);
    }

    /* 5 — the fee the panel quotes is the fee that is taken */
    const pay = outfit(clone(base)); pay.rise = { rank:1, standing:100 };
    const nx = A.riseNext(pay), quoted = nx ? A.riseFee(nx) : null;
    const g0 = pay.gold; let took = null;
    if(nx && A.canClaimRise(pay)){ try { A.claimRise(pay); } catch(e){} took = Math.round(g0 - pay.gold); }

    return { staged, ropeStaged, ropeWeeks, weeks, bind,
      bindPc: Object.fromEntries(Object.entries(bind).map(([k,v])=>[k, tot ? +(v/tot*100).toFixed(1) : 0])),
      climbed, canBase, gate, quoted, took,
      askFor: askFor ? { name:askFor.name, fame:askFor.fame||0, favor:askFor.favor||0, cost:askFor.cost||0 } : null,
      topRung: A.RISE_RANKS[A.RISE_RANKS.length-1].name };
  });

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };

  lines.push(`the munus, staged at each scale: ${r.staged.map(s=>`${s.key} (gate ${s.gate}) fame ${s.dFame>=0?"+":""}${s.dFame} · coin ${s.dGold}`).join(" · ")}`);
  lines.push(`  the reference player staged ${r.ropeStaged} in ${r.ropeWeeks} weeks with \`munus:true\``);
  lines.push(`  over ${r.weeks} weeks short of a rung, what held: `
    + Object.entries(r.bindPc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}%`).join(" · "));
  lines.push(`  a house given everything climbed to rung ${r.climbed} (${r.topRung} is the top)`
    + ` · at ${r.askFor ? r.askFor.name : "?"} (fame ${r.askFor&&r.askFor.fame} favour ${r.askFor&&r.askFor.favor})`
    + ` claimable ${r.canBase} · refused without `
    + Object.entries(r.gate).map(([k,v])=>`${k} ${!v}`).join(", "));
  lines.push(`  the fee quoted ${r.quoted} · taken ${r.took}`);

  /* 1 — the munus pays fame and costs coin */
  for(const s of r.staged){
    if(!(s.dFame > 0))
      bad.push(`staging a ${s.key} munus moved the house's fame by ${s.dFame} — #227 calls this "the `
        + `era-appropriate fame SINK" and \`stageMunus\` has always paid fame out, not taken it in`);
    if(!(s.dGold < 0))
      bad.push(`staging a ${s.key} munus moved the box by ${s.dGold} — an afternoon of sand at your own `
        + `expense is what it costs, and the coin is the whole of the price`);
  }
  /* 2 — and the rope can stage one */
  if(!r.ropeStaged)
    bad.push(`the reference player staged no munus in ${r.ropeWeeks} weeks with \`munus:true\` on — the `
      + `policy exists so that #227's "held 0 times (rope)" can be shown to be the harness and not `
      + `the game, and an unexercised policy proves nothing`);
  /* 3 — fame is still a wall */
  if(!r.weeks) bad.push(`no weeks were played — the arm that holds fame's share of the wall measured nothing`);
  else if(r.bindPc.fame < WALL_FLOOR*100)
    bad.push(`fame is the term holding on only ${r.bindPc.fame}% of the weeks a house is short of its next `
      + `rung — it was 30.3% when #227 said fame "buys almost nothing", and under ${(WALL_FLOOR*100)|0}% `
      + `somebody has made it spendable, which is the recommendation this item's own numbers refute`);
  /* 4 — every term is consulted */
  if(!r.canBase)
    bad.push(`a house given fame, favour and coin without limit cannot claim a rung at all, so the arm `
      + `that takes each term away in turn measured nothing`);
  else for(const [term, still] of Object.entries(r.gate))
    if(still) bad.push(`a house with no ${term} can still claim its next rung — the ladder names four terms `
      + `and ${term} is decoration`);
  /* 5 — and the fee quoted is the fee taken */
  if(r.quoted == null || r.took == null)
    bad.push(`no rung was claimed on the bench, so the arm that checks the quoted fee is the taken fee `
      + `measured nothing`);
  else if(r.quoted !== r.took)
    bad.push(`the panel quotes ${r.quoted}d to be received and ${r.took}d left the box — a displayed number `
      + `and the roll behind it must be the same function, which is #150`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the munus pays fame out, fame is still the wall, and every term is read`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
