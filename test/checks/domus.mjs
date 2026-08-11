/* THE HOUSEHOLD: FOUR EVENTS BEHIND A WOMAN'S SURVIVAL.

   `familyWeek` is the whole family arc — a match, a birth, `raising` at a child's seventh and twelfth
   year, `toga` at sixteen, `daughter` at fifteen, and behind those `resolveRaise`, `resolveToga`,
   `resolveDaughter` and the heir traits that a boy's upbringing decides. None of it had ever fired in
   any measured house. The v2.93.0 sweep listed `raising`, `toga` and `daughter` among nine dark events;
   this check is what came of chasing them.

   THREE CANDIDATE EXPLANATIONS WERE MEASURED AND KILLED before the real one turned up:

     1. THE CLOCK. `YEAR_WEEKS = 18` and `childAge = floor((week - born) / 18)`, so `raising` wants 126
        weeks after the birth, stage two 216, `daughter` 270 and `toga` 288 — on top of marrying (fame
        60 or census rung 1, then 10% a week) and conceiving (6% a week). Against a median house life of
        226 weeks that looked decisive. It is not: one house in fourteen lived **561 weeks** with a child
        born at week 29 who reached **age 29**, past every gate, and saw nothing.
     2. CHILD MORTALITY. There is none. `c.dead` is read in three places and never written for a child.
     3. THE QUEUE. `familyWeek` yields to any question already raised and sits fifth in `endWeek` behind
        `updateRebellion`, `heldQuestions`, `freedWeek` and `kinWeek`. Measured: 54.4% of weeks blocked
        across 10 houses — real, but 45% of weeks were clear, which is plenty.

   THE ACTUAL FAULT was one early return. `if(!dmm.wife){ …match…; return; }` skipped the child loop at
   the bottom of the function, so the entire arc was contingent on the wife being ALIVE. Hand-built: a
   sixteen-year-old son raised `toga` with a wife in the house and **NOTHING** once the lanista was
   widowed; a seventeen-year-old daughter the same. v2.95.0 moves the child loop out of the wife branch
   — the household's warmth and bearing a child stay wife-dependent, because those need her; a boy who
   is seven is seven either way.

   ONE CORRECTION TO THAT, MADE IN v2.98.0. The v2.95.0 note said "wives die", and they do not: the
   only write to `d.domus.wife` in the whole program is `resolveMatch` setting her, and nothing anywhere
   clears her. So the widowed arm below is a case the game does not currently produce, and it is held
   anyway — the state is one event away from being reachable, `domusOf` hands out `wife:null` to every
   pre-domus save, and a branch that only works while a field is non-null is exactly the shape of fault
   this check exists for. Recorded here as reachable-by-construction rather than measured in play.

   AND THE FAMILY BELONGED TO ONE MAN. `d.domus` sits on the state rather than the lanista, and
   `succeed` used to leave it alone — the note said so, "the blood of the house survives a succession".
   Driven: **8 of 8** houses through a succession handed the new lanista his predecessor's widow in the
   wife slot, and `marryReady` requires that slot EMPTY, so **0 of 8** could ever marry. A doctore who
   took the house inherited the dead man's wife; a son of twenty-one inherited his mother and three
   children older than himself. The whole arc above — the match, a birth, `raising`, `toga`, `daughter`,
   and the scion heir that comes out of it — was available to the first lanista and to nobody after him.
   v2.98.0 hands the family to the forebear record, where the annals still show it, and the new man
   starts his own; the same eight successions now read 8 of 8 able to marry.

   WHAT THIS HOLDS: every gate, at each age, with a wife and without; and that a succession does not
   hand the next man somebody else's wife. It is a bench rather than a campaign because that is what
   the claim is — one function, six branches, and one of them was unreachable for the life of the
   feature without any check being able to see it. */

import { hasHandle } from "../harness.mjs";

export const name = "domus";
export const describe = "the family arc raises every beat it owes, widowed or not";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    if(typeof A.familyWeek !== "function")
      return { bad:["`familyWeek` is not on the handle — the family arc cannot be driven"], lines };

    const YW = 18;
    /* a house at week 400 with one child of a named age, and a wife or not */
    const mk = (age, sex, wife, extra) => {
      const d = A.newGameState("Dm", "clean", `DOMUS-${age}${sex}${wife?"w":"x"}`, null);
      d.week = 400; d.gold = 20000; d.fame = 900;
      d.domus = { wife: wife ? { name:"Tullia", age:26, married: d.week - YW*20 } : null,
        children:[], nextKin:2 };
      d.domus.children.push(Object.assign({ id:1, name:"Kin", sex, born: d.week - YW*age,
        up:{ palus:0, rhetor:0, box:0 } }, extra||{}));
      return d;
    };
    const raise = d => { try { A.familyWeek(d); } catch(e){ return "THREW: " + e.message; }
      return d.pendingEvent ? d.pendingEvent.id : null; };

    /* ---- 1. EVERY GATE, WITH A WIFE AND WITHOUT ---- */
    const WANT = [
      { age:7,  sex:"m", want:"raising",  what:"a boy of seven" },
      { age:12, sex:"m", want:"raising",  what:"a boy of twelve" },
      { age:16, sex:"m", want:"toga",     what:"a son of sixteen" },
      { age:22, sex:"m", want:"toga",     what:"a son long past sixteen" },
      { age:15, sex:"f", want:"daughter", what:"a daughter of fifteen" },
      { age:19, sex:"f", want:"daughter", what:"a daughter long past fifteen" },
    ];
    for(const c of WANT){
      const withW = raise(mk(c.age, c.sex, true));
      const widow = raise(mk(c.age, c.sex, false));
      lines.push(`${c.what.padEnd(28)} wife alive → ${String(withW).padEnd(9)} · widowed → ${String(widow)}`);
      if(withW !== c.want)
        bad.push(`${c.what} with a wife in the house raised \`${withW}\` and should raise \`${c.want}\``);
      if(widow !== c.want)
        bad.push(`${c.what} raised \`${widow}\` once the lanista was WIDOWED, and \`${c.want}\` with a `
          + `wife alive. The child loop is back inside the wife branch — that early return is what kept `
          + `the whole family arc dark for the life of the feature. Wives die; children still grow up`);
    }

    /* ---- 2. AND IT MUST NOT RAISE A BEAT TWICE, or nag a child already dealt with ---- */
    {
      const done = raise(mk(16, "m", true, { grown:true }));
      lines.push(`a son who has already had his toga: ${String(done)}`);
      if(done === "toga") bad.push(`a son with \`grown\` set is being offered the toga again`);

      const wed = raise(mk(19, "f", true, { wed:true }));
      lines.push(`a daughter already married out: ${String(wed)}`);
      if(wed === "daughter") bad.push(`a daughter with \`wed\` set is being matched a second time`);

      const held = mk(16, "m", true); held.pendingEvent = { id:"somethingElse", title:"x" };
      A.familyWeek(held);
      if(held.pendingEvent.id !== "somethingElse")
        bad.push(`\`familyWeek\` overwrote a question that was already up — it yields to one by design, `
          + `and 54.4% of weeks have one`);
      lines.push(`a question already up is left alone: ${held.pendingEvent.id === "somethingElse"}`);
    }

    /* ---- 3. THE CLOCK, printed so the arithmetic is on the record ---- */
    {
      const d = mk(0, "m", true);
      const at = n => { const c = mk(n, "m", true); return A.childAge(c, c.domus.children[0]); };
      lines.push(`the clock at YEAR_WEEKS ${YW}: raising wants ${7*YW}w after the birth, stage two `
        + `${12*YW}w, daughter ${15*YW}w, toga ${16*YW}w — and childAge reads back ${at(7)}/${at(12)}/${at(16)}`);
      if(at(16) !== 16) bad.push(`\`childAge\` read ${at(16)} for a child born ${16*YW} weeks ago — the `
        + `year length has moved and every gate above it with it`);
      /* children never die: c.dead is never written for a child, so the arc has no mortality tax */
      lines.push(`a child is never marked dead by the game (checked in v2.95.0) — the arc has no mortality`);
    }

    /* ---- 4. AND THE NEXT MAN DOES NOT INHERIT SOMEBODY ELSE'S WIFE ---- */
    {
      const mk = (tag) => {
        const d = A.newGameState("Ds", "clean", tag, null);
        d.week = 300; d.gold = 30000; d.fame = 900;
        if(!d.lanista) d.lanista = A.makeLanista(d);
        d.lanista.age = 52;
        d.domus = { wife:{ name:"Tullia", family:"Sergia", married: 300 - YW*20, age:24, from:"merchant" },
          children:[], nextKin:1 };
        for(const [age, sex] of [[22,"m"],[17,"m"],[19,"f"]])
          d.domus.children.push({ id:d.domus.nextKin++, name:"Kin"+age, sex, born: 300 - YW*age,
            up:{palus:6,rhetor:2,box:1}, grown:true });
        return d;
      };
      let handed = 0, canMarry = 0, kept = 0, runs = 0, onRecord = 0;
      for(let i=0;i<6;i++){
        const d = mk("DOMUS-SUCC-"+i);
        const opts = A.heirEligible(d) || [];
        if(!opts.length || !A.nameHeir(d, opts[0])) continue;
        d.lanista.health = 0;
        try { A.lanistaWeek(d); } catch(e){ bad.push(`\`lanistaWeek\` threw on a failing lanista: ${e.message}`); break; }
        if(!d.succession) continue;
        try { A.takeUpTheHouse(d); } catch(e){ bad.push(`\`takeUpTheHouse\` threw: ${e.message}`); break; }
        runs++; handed++;
        if(d.domus && d.domus.wife) kept++;
        if(A.marryReady(d)) canMarry++;
        const fb = (d.forebears||[]).slice(-1)[0];
        if(fb && fb.wife === "Tullia") onRecord++;
      }
      lines.push(`${runs} houses driven through a succession: the new man kept his predecessor's wife in `
        + `${kept}, could take one of his own in ${canMarry}, and she is on the forebear's record in ${onRecord}`);
      if(!runs) bad.push(`no house could be driven through a succession at all — \`nameHeir\`, `
        + `\`lanistaWeek\` or \`takeUpTheHouse\` has changed, and the second generation is untestable`);
      else {
        if(kept)
          bad.push(`${kept} of ${runs} new lanistae inherited the dead man's wife. \`marryReady\` needs `
            + `the slot empty, so that man never marries, never has a child, and never raises a scion — `
            + `the whole family arc becomes the first lanista's alone`);
        if(canMarry !== runs)
          bad.push(`only ${canMarry} of ${runs} new lanistae could take a wife. The generation after the `
            + `first has to be able to start a family or the domus is a one-generation feature`);
        if(onRecord !== runs)
          bad.push(`the old man's wife reached his forebear record in ${onRecord} of ${runs} — the family `
            + `is cleared off \`d.domus\` at a succession, so the record is the only place left that she `
            + `was ever in this house`);
      }
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
