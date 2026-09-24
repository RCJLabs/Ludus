/* WHAT "COMPLY" STILL ASKS OF THE HOUSE — #314

   An edict's card offers "Comply" and "Carry on and hope". "Comply" sends word: craft +4, the
   magistrates' favour +9, heat -12, and nothing in the yard. Its reply was "It costs you nothing today
   and it will cost you something on a day you have not thought about yet", which reads as the matter
   settled. It is not. The numbers edict sets its cap one to three men BELOW the roster it finds, so a
   house that sends word and keeps its men is in breach from that day; breach raises heat every week,
   and heat brings the aedile's man and, at 90, the ban. #313 measured what acting on it is worth to a
   house that never leaves Capua: banned 1% of the time rather than 7%, debt 9% rather than 12%.

   The week's reminder said only "The house is in breach of an edict". The shortfall was one tap deep,
   in the villa's law panel. Now the reply says the word is not the deed and names what is left, and
   the reminder names the shortfall. `edictOwed` is the one place both read it from.

     1  the reply, per edict: the numbers edict names the cap, the roster and the men to stand down
        (and "one of them" for one), the women edict names the women, the condemned edict the
        sentence left; "Comply" still does exactly what it did (heat -12, the yard untouched)
     2  a house within the edict, or under an edict that cannot be broken, gets the old reply
     3  the week's reminder names the shortfall, and is gone once the men are stood down
     4  on screen: "Comply" clicked on a forged card shows the reply with the shortfall in it */
import { found, clearAll, forge, settle } from "../harness.mjs";

export const name = "comply";
export const describe = "sending word you will comply says what the edict still asks of the yard";

export async function run({ p, errors }){
  const fails = [], lines = [];

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["edictOwed","EVENTS","lawOf","agenda","newGameState","genGladiator","isGone","activeG","sellMan"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const alive = d => d.gladiators.filter(g=>!A.isGone(g));
    const house = (men, law) => { const d = A.newGameState("Cp", "clean", "COMPLY-1", null);
      d.week = 40; d.gold = 5000; d.pendingEvent = null;
      d.gladiators = d.gladiators.filter(g=>!A.isGone(g)).slice(0, men);
      while(alive(d).length < men) d.gladiators.push(A.genGladiator(d, 55));
      Object.assign(A.lawOf(d), law); return d; };
    const answer = (d, k) => { const heat0 = A.lawOf(d).heat, men0 = alive(d).length;
      const say = A.EVENTS.edict.run(d, { id:"edict", data:{ k } }, 0);
      return { say, heat:heat0 - A.lawOf(d).heat, men:[men0, alive(d).length] }; };
    const out = {};
    { const d = house(8, { edicts:["numbers"], cap:5, heat:40 }); out.numbers = answer(d, "numbers"); }
    { const d = house(6, { edicts:["numbers"], cap:5, heat:40 }); out.one = answer(d, "numbers"); }
    { const d = house(4, { edicts:["women"], women:true, heat:40 }); A.activeG(d).forEach((g,i)=>{ g.sex = i === 1 ? "f" : "m"; });
      out.women = answer(d, "women"); out.women.who = A.activeG(d)[1].name; }
    { const d = house(4, { edicts:["damnati"], damnati:true, heat:40 });
      const g = A.activeG(d)[2]; g.damnatus = { bouts:(g.wins||0) + (g.losses||0) + 3 }; out.damnati = answer(d, "damnati"); out.damnati.who = g.name;
      /* and the same man as a woman: the sentence is hers */
      const e = house(4, { edicts:["damnati"], damnati:true, heat:40 }); const h = A.activeG(e)[2];
      h.damnatus = { bouts:(h.wins||0) + (h.losses||0) + 3 }; h.sex = "f"; out.damnatiF = answer(e, "damnati"); }
    { const d = house(4, { edicts:["numbers"], cap:4, heat:40 }); out.within = answer(d, "numbers"); }
    { const d = house(6, { edicts:["vectigal"], tax:0.1, heat:40 }); out.vectigal = answer(d, "vectigal"); }
    /* 3 · the reminder */
    { const d = house(8, { edicts:["numbers"], cap:5, heat:40 });
      const row = () => (A.agenda(d) || []).find(x=>/in breach of/.test(x.label || ""));
      const before = row();
      const men = A.activeG(d).slice().sort((a,b)=>A.gladValue(a) - A.gladValue(b));
      for(const g of men.slice(0, 3)) A.sellMan(d, g.id, null);
      out.row = { before: before ? { label:before.label, sub:before.sub } : null, after: row() ? row().sub : null, left:alive(d).length }; }
    return out;
  });
  if(r.why) return { pass:false, why:r.why, lines };

  const show = (tag, x) => lines.push(`  ${tag.padEnd(9)} heat -${x.heat} · men ${x.men.join(" -> ")} · "${x.say.slice(0, 170)}"`);
  lines.push("the reply to \"Comply\":");
  for(const k of ["numbers","one","women","damnati","within","vectigal"]) show(k, r[k]);
  const deed = /the word is not the deed/;
  if(!deed.test(r.numbers.say) || !/The edict allows 5 and you keep 8\./.test(r.numbers.say) || !/Until 3 of them are off the roster/.test(r.numbers.say))
    fails.push("the reply to Comply under a numbers edict, eight men against five, does not name the three to stand down");
  if(!/Until one of them is off the roster/.test(r.one.say)) fails.push("one man over the cap is not named as one");
  if(!deed.test(r.women.say) || !r.women.say.includes(`${r.women.who} is still on the roster`)) fails.push("the reply under the women edict does not name her");
  if(!deed.test(r.damnati.say) || !r.damnati.say.includes(`${r.damnati.who} is still serving, 3 bouts of sentence left`)) fails.push("the reply under the condemned edict does not name him and the sentence left");
  if(!/until she is done/.test(r.damnatiF.say) || /until he is done/.test(r.damnatiF.say)) fails.push("a condemned woman is told \"until he is done\"");
  if(!/until he is done/.test(r.damnati.say) && !/until she is done/.test(r.damnati.say)) fails.push("the condemned edict's reply lost its pronoun");
  for(const k of ["within","vectigal"])
    if(deed.test(r[k].say) || !/It costs you nothing today/.test(r[k].say)) fails.push(`a house with nothing owed (${k}) is told it owes something`);
  for(const k of ["numbers","one","women","damnati","within","vectigal"]){
    if(r[k].heat !== 12) fails.push(`"Comply" no longer takes 12 off the heat (${k}: ${r[k].heat})`);
    if(r[k].men[0] !== r[k].men[1]) fails.push(`"Comply" changed the yard (${k}: ${r[k].men.join(" -> ")})`);
  }
  lines.push(`the week's reminder, eight men against five: ${r.row.before ? `"${r.row.before.label}" · "${r.row.before.sub}"` : "NONE"} · three stood down, ${r.row.left} left: ${r.row.after ? `"${r.row.after}"` : "no reminder"}`);
  if(!r.row.before) fails.push("a house in breach of the numbers edict has no reminder in its week");
  else if(!/8 men where 5 are allowed — 3 to stand down/.test(r.row.before.sub)) fails.push("the week's reminder does not name the shortfall");
  if(r.row.after) fails.push("the reminder stayed after the men were stood down");

  /* ---- 4 · ON SCREEN ---- */
  await found(p, { seed:"COMPLY-UI" });
  await clearAll(p, 6);
  await forge(p, (A) => { const d = A.newGameState("Cp","clean","COMPLY-UI",null); d.week = 40;
    d.gladiators = d.gladiators.filter(g=>!A.isGone(g));
    while(d.gladiators.filter(g=>!A.isGone(g)).length < 7) d.gladiators.push(A.genGladiator(d, 55));
    Object.assign(A.lawOf(d), { edicts:["numbers"], cap:5, heat:30 });
    d.pendingEvent = { id:"edict", title:"An Edict Is Read Out", text:"On the keeping of armed men.", choices:["Comply","Carry on and hope"], data:{ k:"numbers" } };
    return { plant:d }; });
  await settle(p);
  const clicked = await p.evaluate(()=>{ const b = [...document.querySelectorAll(".modal button")].find(x=>/^comply$/i.test((x.innerText||"").trim()));   /* buttons are set in capitals */
    if(b) b.click(); return !!b; });
  await p.waitForTimeout(500);
  const seen = await p.evaluate(()=>{ const m = document.querySelector(".modal"); return m ? (m.innerText || "").replace(/\n+/g, " · ") : ""; });
  lines.push(`on screen, "Comply" clicked: ${clicked ? seen.slice(0, 220) : "NO COMPLY BUTTON"}`);
  if(!clicked) fails.push("the forged edict card showed no Comply button");
  else if(!/the word is not the deed/.test(seen) || !/Until 2 of them are off the roster/.test(seen)) fails.push("the reply on screen does not name the men to stand down");

  if(errors && errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
