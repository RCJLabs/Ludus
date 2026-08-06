/* A question and its answer are one thing. Until v2.18.1 the week's digest waited
   on the question clearing but not on the reply to it, and outranked the answer by
   eight z-layers — so the moment you chose, the summary threw itself over the top
   of your own decision. This walks weeks, answers whatever is asked, and checks
   what is actually in front of the player afterwards. */

import { found, endWeek, clearAll, top } from "../harness.mjs";

export const name = "modals";
export const describe = "answering a question shows the answer, not the week's summary";
export const slow = true;   /* drives a real browser through the real screens */

export async function run({ p, errors }){
  await found(p);
  let asked = 0, clean = 0, split = 0, followed = 0;
  const seen = [];
  for(let w=0; w<45; w++){
    if(!(await endWeek(p))) break;

    /* a question is the topmost overlay that offers a real choice */
    const q = await p.evaluate(()=>{
      const w = [...document.querySelectorAll(".modalwrap")]
        .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
      if(!w) return null;
      const head = ((w.querySelector(".disp")||{}).innerText||"").trim().split("\n")[0];
      if(/THE WEEK THAT WAS|IT IS DECIDED/i.test(head)) return null;
      const bs = [...w.querySelectorAll("button.btn")]
        .filter(x=>!x.disabled && !/close/i.test(x.getAttribute("aria-label")||""));
      return bs.length >= 2 ? head : null;
    });

    if(q){
      asked++;
      await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")]
        .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
        const bs=[...w.querySelectorAll("button.btn")]
          .filter(x=>!x.disabled && !/close/i.test(x.getAttribute("aria-label")||""));
        bs[0].click(); });
      await p.waitForTimeout(420);
      const t = await top(p);
      const head = t ? t.head : "(nothing)";
      if(/THE WEEK THAT WAS/i.test(head)){
        split++;
        if(seen.length<3) seen.push(`"${q}" answered, and the digest covered the answer`);
      } else if(/IT IS DECIDED/i.test(head)){
        clean++;
        /* the digest must still be waiting behind it, not swallowed */
        await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")]
          .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
          const bs=[...w.querySelectorAll("button.btn")].filter(x=>!x.disabled);
          if(bs.length) bs[bs.length-1].click(); });
        await p.waitForTimeout(340);
        const t2 = await top(p);
        if(t2 && /THE WEEK THAT WAS/i.test(t2.head)) followed++;
        if(seen.length<3) seen.push(`"${q}" answered → "${head}"${t2?` → "${t2.head}"`:""}`);
      }
    }
    await clearAll(p);
    const done = await p.evaluate(()=>/found a house|strike it out/i.test(document.body.innerText));
    if(done) break;
  }
  const lines = [
    `weeks that asked something : ${asked}`,
    `answer shown straight away : ${clean}`,
    `digest wedged in between   : ${split}`,
    `digest still shown after   : ${followed} (of ${clean})`,
    ...seen,
  ];
  const fails = [];
  if(asked < 3) fails.push(`only ${asked} questions in 45 weeks — too few to conclude anything`);
  if(split > 0) fails.push(`${split} of ${asked} answers were covered by the week's digest`);
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
