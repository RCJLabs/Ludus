/* Every bout the house fights should reach the record book, from all four engines,
   with the purse it actually took. Until v2.18.0 the pair booked only its wins and
   the melee only its losses, so the book read a hundred per cent at pair bouts and
   nought at melees and quietly lost half of every campaign. */

import { hasHandle } from "../harness.mjs";

export const name = "book";
export const describe = "the record book sees every bout, and no purse it never took";

export async function run({ p }){
  if(!(await hasHandle(p))) return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(N=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Check", "clean", "BOOKCHECK", null);
    d.fame = 260; d.gold = 60000; d.week = 40;
    while(d.gladiators.length < 4) d.gladiators.push(A.genGladiator(d, 60));
    const gs = d.gladiators.slice(0,4);
    const snap = JSON.stringify(gs);
    const reset = ()=>{ const S=JSON.parse(snap);
      S.forEach((s,i)=>{ Object.keys(s).forEach(k=>gs[i][k]=s[k]); gs[i].status="active"; }); };
    const finish = (fn, args, resume) => { let r = fn(...args);
      /* #116: to exhaustion. The sim comes back to the balance up to three times, and answering
         one word dropped 26.8% of all standard bouts — `bookBout` runs at the verdict, so a bout
         left pending never reaches the record book at all. */
      { let n=0; while(r && r.crux && n++<4){ const pd=r.pending; pd.beats=r.beats; r = fn(...resume(pd)); } }
      return (r && !r.crux) ? r : null; };

    const tally = { pair:0, melee:0, hunt:0, single:0 };
    for(let i=0;i<N;i++){
      reset();
      const off = { id:d.nextId++, tier:1, festival:"the check", pair:true, stakes:"standard", purse:900,
        opps:[A.pickRivalOpp(d,1).opp, A.pickRivalOpp(d,1).opp], oppRefs:[null,null] };
      if(finish(A.doPairFight, [d,[gs[0].id,gs[1].id],off,"measured",null,null],
        pd=>[d,[gs[0].id,gs[1].id],off,"measured",pd,null])) tally.pair++;
    }
    for(let i=0;i<N;i++){
      reset();
      const field=[]; for(let k=0;k<4;k++) field.push(A.pickRivalOpp(d,0).opp);
      const off = { id:d.nextId++, tier:1, festival:"the check", melee:true, field, stakes:"melee", purse:1800 };
      if(finish(A.doMelee, [d,[gs[0].id,gs[1].id,gs[2].id],off,null,null,"measured"],
        pd=>[d,[gs[0].id,gs[1].id,gs[2].id],off,pd,"finish","measured"])) tally.melee++;
    }
    let huntOwed = 0, huntKills = 0;
    const purseBefore = d.book.purse;
    for(let i=0;i<N;i++){
      reset();
      const off = { id:d.nextId++, tier:1, festival:"the check", venatio:true, beast:"boar",
        grade:0.35, stakes:"venatio", purse:1200 };
      const r = finish(A.doVenatio, [d,gs[0].id,off,"measured",null,null],
        pd=>[d,gs[0].id,off,"measured",pd,null]);
      if(r){ tally.hunt++; if((r.sum||[]).some(s=>/^Purse: /.test(s))){ huntKills++; huntOwed += off.purse; } }
    }
    const huntBooked = d.book.purse - purseBefore;
    for(let i=0;i<N;i++){
      reset();
      const off = { id:d.nextId++, tier:1, festival:"the check", opp:A.pickRivalOpp(d,1).opp,
        oppRef:null, rematch:false, grudgeM:false, stakes:"standard", purse:900 };
      if(finish(A.doFight, [d,gs[0].id,off,"measured",null,null,null,"none"],
        pd=>[d,gs[0].id,off,"measured",null,pd,null,"none"])) tally.single++;
    }
    const B = d.book;
    return { tally, n:B.n, w:B.w, drew:B.drew||0, kind:B.kind, huntOwed, huntBooked, huntKills };
  }, 45);

  const fought = out.tally.pair + out.tally.melee + out.tally.hunt + out.tally.single;
  const lines = [
    `fought  pair ${out.tally.pair} · melee ${out.tally.melee} · hunt ${out.tally.hunt} · single ${out.tally.single}  = ${fought}`,
    `booked  ${out.n} bouts, ${out.w} won, ${out.drew} drawn`,
    `by kind ${Object.entries(out.kind).map(([k,e])=>`${k} ${e.n}(${e.w}w${e.d?`,${e.d}d`:""})`).join(" · ")}`,
    `hunt purses: ${out.huntKills} kills owed ${out.huntOwed}d, book has ${out.huntBooked}d`,
  ];
  const fails = [];
  if(out.n !== fought) fails.push(`${fought} bouts fought but ${out.n} booked`);
  for(const k of ["pair","melee","venatio","single"]){
    const e = out.kind[k];
    if(!e || !e.n) { fails.push(`nothing booked under "${k}"`); continue; }
    if(e.w === 0)    fails.push(`"${k}" booked ${e.n} bouts and not one win — the melee read this way before v2.18.0`);
    if(e.w === e.n)  fails.push(`"${k}" booked ${e.n} bouts and lost none — the pair read this way before v2.18.0`);
  }
  if(out.huntBooked !== out.huntOwed)
    fails.push(`the book has ${out.huntBooked}d of hunt purses against ${out.huntOwed}d actually won`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
