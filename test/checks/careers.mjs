/* The whole of what a long-lived fighter becomes — the signature move, mastery,
   the second trade, the switch between styles, the rudis, retirement — was dark
   to the coverage sweep: teachSigTo, makeMasterOf, startSecond, switchStyle,
   grantRudis and retireG had never been called by any check. The v2.46 audit's
   first campaign probes "found" mastery unreachable and the second trade dead,
   and both findings were the probe's own fault — which is exactly what a check
   here would have said in seconds.

   One man is walked up the whole ladder: taught his signature at the far post,
   named a master, sent back to the post for a second trade, switched between
   his two styles, and a brother of his is freed and another retired. Every gate
   is tested from both sides — the eligible man passes, the ineligible one is
   refused. */

import { hasHandle } from "../harness.mjs";

export const name = "careers";
export const describe = "a man can be taught, mastered, doubled, switched, freed and retired";

const TECH1 = { Retiarius:"snare", Murmillo:"bulwark", Thraex:"widow",
  Hoplomachus:"reach", Secutor:"vice", Dimachaerus:"storm" };

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate((TECH1)=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Car","clean","CAREER1",null);
    d.gold = 50000; d.unrest = 0;
    d.doctore = { name:"Oenomaus", skill:78, spec:"tec", wage:22, fee:0, fromHouse:false, weeks:0 };
    const mk = (over)=>{ const m = A.genOpponent(2, 78); m.id = d.nextId++; m.status="active";
      m.mine = true; m.kit = A.defaultKit(m.cls); m.morale = 85; m.regard = 85; m.defiance = 5;
      m.fatigue = 0; m.lastFought = -9; Object.assign(m, over||{}); d.gladiators.push(m); return m; };
    const vet   = mk({ wins:14, pfame:90 });            // the man who walks the ladder
    const green = mk({ wins:2,  pfame:10 });            // and the man the gates refuse
    const elder = mk({ wins:9,  pfame:60, age:34 });
    const hero  = mk({ wins:12, pfame:200 });
    const week = () => { d.pendingEvent = null;
      for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "rest");
      A.endWeek(d); };

    /* 1. the signature — taught at the far post, and the green man refused */
    const sigGreen = A.teachSigTo(d, green.id, TECH1[green.cls]);
    const g0 = d.gold;
    const sigOk = A.teachSigTo(d, vet.id, TECH1[vet.cls]);
    const sigFeePaid = g0 - d.gold;
    for(let i=0;i<6 && !vet.signature;i++) week();
    const signature = !!vet.signature;

    /* 2. mastery — the gate refuses the green man and passes the veteran */
    const masGreen = A.makeMasterOf(d, green.id);
    A.makeMasterOf(d, vet.id);
    const mastery = !!vet.mastery;

    /* 3. the second trade — eight weeks at the post, and both styles in his hands */
    const from = vet.cls;
    const to = from === "Murmillo" ? "Secutor" : "Murmillo";
    const secOk = A.startSecond(d, vet.id, to);
    for(let i=0;i<10 && vet.learning;i++) week();
    const second = !!vet.second && vet.cls === to;

    /* 4. the switch — back to the style he came from, any week he has not fought */
    const swOk = A.switchStyle(d, vet.id, from);
    const switched = vet.cls === from && vet.second && vet.second.cls === to;

    /* 5. the rudis — the hero walks, the green man does not */
    const freed0 = (d.freed||[]).length;
    A.grantRudis(d, green.id);
    const rudisGreen = green.status === "freed";
    A.grantRudis(d, hero.id);
    const rudisOk = hero.status === "freed" && (d.freed||[]).length === freed0 + 1;

    /* 6. retirement — the elder goes, the veteran stays */
    A.retireG(d, vet.id);
    const retVet = vet.status;
    A.retireG(d, elder.id);
    const retired = elder.status === "retired";

    /* ---- 7. and the man four doors down asks ----
       The bout against your own second-best is the best thing the mid-game has to
       say and it waited in the weekly lottery for a slot it could not win: measured
       over 1,320 weeks of a house that held the title with a real challenger in its
       cells, the state qualified in 97% of them and the event fired in 0.62%. It has
       its own channel now. This holds both ends — that a holder is asked inside a
       reasonable stretch, and that he is not asked every fortnight. */
    const ask = (()=>{
      const e = A.newGameState("Ask","clean","CAREER_ASK",null);
      e.fame = 900; e.gold = 9000;
      const mk = (wins, pf) => { const m = A.genGladiator(e, 80); m.id=e.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.wins=wins; m.pfame=pf; m.fatigue=0; m.lastFought=-9;
        e.gladiators.push(m); return m; };
      const holder = mk(10, 80), challenger = mk(7, 55); mk(3, 20);
      /* the title has been his for seven weeks: the event deliberately waits six
         before the man four doors down will say anything, and testing it on the
         first morning of a reign measured that wait rather than the channel */
      e.primus = { mine:true, gid:holder.id, name:holder.name, nick:null, cls:holder.cls,
        since: e.week - 7, defences:0 };
      const eligibleAtOnce = !!A.EVENTS.primacy.make(e);
      const mutePlease = !A.EVENTS.primacy.make(Object.assign(A.clone(e),
        { primus: Object.assign({}, e.primus, { since: e.week }) }));
      let fired = 0, firstAt = null;
      for(let w=0; w<80; w++){
        e.primus = e.primus || { mine:true, gid:holder.id, name:holder.name, nick:null, cls:holder.cls, since:1, defences:0, asked:e.primus&&e.primus.asked };
        for(const g of [holder, challenger]){ g.status="active"; g.injury=null; g.fatigue=0;
          g.wins=Math.max(g.wins, g===holder?10:7); g.pfame=Math.max(g.pfame, g===holder?80:55); }
        e.pendingEvent = null; e.gold = Math.max(e.gold, 4000);
        try { A.endWeek(e); } catch(err){ break; }
        if(e.pendingEvent && e.pendingEvent.id === "primacy"){ fired++; if(firstAt==null) firstAt = w+1; }
        if(e.over){ e.over = null; e.unrest = Math.min(e.unrest, 30); }
      }
      return { eligibleAtOnce, mutePlease, fired, firstAt, weeks:80 };
    })();

    return { sigGreen, sigOk, sigFeePaid, signature, masGreen, mastery,
      secOk, second, swOk, switched, rudisGreen, rudisOk, retVet, retired, ask,
      vetLine: `${vet.name}: ${from} master, ${to} in his hands` };
  }, TECH1);

  const lines = [], fails = [];
  lines.push(`the signature cost ${out.sigFeePaid}d and took: ${out.signature}`);
  lines.push(out.vetLine);
  lines.push(`gates refused the green man: signature ${!out.sigGreen}, mastery ${!out.masGreen}, rudis ${!out.rudisGreen}`);
  lines.push(`the man four doors down asked ${out.ask.fired} time${out.ask.fired===1?"":"s"} in ${out.ask.weeks} weeks of holding${out.ask.firstAt!=null?`, first in week ${out.ask.firstAt}`:""}`);

  if(out.sigGreen) fails.push("a two-win man was taught a signature — the six-win gate is open");
  if(!out.sigOk || !(out.sigFeePaid > 0)) fails.push("the veteran could not be taught his signature, or it cost nothing");
  if(!out.signature) fails.push("the far post never finished the signature — teaching does not progress through the week");
  if(out.masGreen) fails.push("a two-win man was made a master — the twelve-win gate is open");
  if(!out.mastery) fails.push("a fourteen-win, ninety-renown man could not be made a master");
  if(!out.secOk) fails.push("a master with a doctore and the fee could not start a second trade");
  if(!out.second) fails.push("eight weeks at the post did not finish the second trade");
  if(!out.swOk || !out.switched) fails.push("a man with two trades could not switch back to the one he came from");
  if(out.rudisGreen) fails.push("a two-win man was given the rudis");
  if(!out.rudisOk) fails.push("a twelve-win, two-hundred-renown man was refused the rudis");
  if(out.retVet === "retired") fails.push("a man in his prime was retired");
  if(!out.retired) fails.push("a thirty-four-year-old could not be retired");

  if(!out.ask.eligibleAtOnce)
    fails.push("a house seven weeks into holding the title, with a second eligible man, does not qualify for the challenge at all");
  if(!out.ask.mutePlease)
    fails.push("the challenge is raised in the first week of a reign — it is supposed to wait six");
  if(out.ask.fired === 0)
    fails.push(`the man four doors down never asked across ${out.ask.weeks} weeks of holding the title — the channel is not reaching him`);
  if(out.ask.firstAt != null && out.ask.firstAt > 40)
    fails.push(`he first asked in week ${out.ask.firstAt} of holding — a reign of a few months should raise it`);
  if(out.ask.fired > 5)
    fails.push(`he asked ${out.ask.fired} times in ${out.ask.weeks} weeks — the gap between askings has gone`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
