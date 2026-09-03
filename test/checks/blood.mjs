/* A PASSED-OVER SON IS STILL A SON, AND A NAMED ONE STAYS NAMED

   Phase queue item #237, phases 4 and 5 — the two things left once `heir.mjs` fixed who gets
   installed as "son" heir.

   PHASE 4. `succeed()` folded the old lanista's whole family into one forebear record so the
   annals could show it, and wrote `children: fam.children.length` — a bare count. Every child who
   was NOT the one who took the house had a name right up until the week their father died or
   stepped back, and then they were a number nobody could read back. Fixed by naming them: the
   forebear record's `children` is now the passed-over children's actual names (the one who took
   the house is excluded — he's the new lanista, shown everywhere else), and a chronicle line
   announces them at succession instead of leaving them buried in a sheet nobody has to open.

   PHASE 5's own interaction, found reading `familyWeek`while scoping the above: a real son can now
   be named heir by identity years before sixteen (`heir.mjs`), but `togaEvent`'s trigger —
   `age>=16 && !c.grown` — has no idea that already happened, because manual naming never set
   `c.grown`. Before the identity fix this was moot: "son" always drew a fabricated stranger, so no
   real child's `c.grown` flag was ever at stake. Now it is a live boy, and the event fired the same
   "Name him your heir and successor" text whether the house had already named him or not — a
   fresh-news ask about a decision already made three years earlier, and refusing it read as
   "not yet named" for a boy who plainly was. `togaEvent`/`resolveToga` now check first: an
   already-named son gets a confirmation, not a proposal, on both the offer and the decline.

   THREE ARMS:
   1 · PASSED-OVER CHILDREN ARE NAMED: a son who takes the house is excluded from his own forebear
       record's child list; his passed-over brother and sister are named in it, and in a chronicle
       line fired the week of succession.
   2 · NOBODY PASSED OVER: an only child who takes the house leaves an empty list and fires no
       passed-over line — the feature says nothing when there is nothing to say.
   3 · THE TOGA KNOWS: an already-named son's toga event reads differently from a fresh one on
       offer and on both answers; accepting upgrades him to the fuller `scion` terms with text that
       acknowledges the years already served; declining leaves his `"son"` naming completely
       untouched — not reverted, not silently altered — with text that doesn't call him unnamed. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "blood";
export const describe = "a passed-over child keeps a name, and a boy named early stays named at the toga";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"BLOOD-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];

    const house = (over) => {
      const d = A.newGameState("Blood", "clean", "BLOOD", null);
      d.gold = 6000; d.fame = 4000;
      for(let i=0;i<3;i++){ const m = A.genGladiator(d, 76); m.id=d.nextId++; m.status="active"; m.mine=true;
        m.kit=A.defaultKit(m.cls); m.wins=6; m.pfame=60; d.gladiators.push(m); }
      d.lanista = Object.assign({}, d.lanista, { age:44, health:60 });
      Object.assign(d, over || {});
      return d;
    };
    const withKid = (d, id, ageYears, extra) => {
      const dm = A.domusOf(d);
      dm.wife = dm.wife || { name:"Vettia", family:"Vettius", married:1, age:30, from:"merchant" };
      dm.children.push(Object.assign({ id, name:`Boy${id}`, sex:"m",
        born: d.week - ageYears*A.YEAR_WEEKS, up:{palus:0,rhetor:0,box:0} }, extra || {}));
      return dm.children[dm.children.length-1];
    };
    const succeedNow = d => { d.lanista.health = -10; d.pendingEvent = null;
      try { A.endWeek(d); } catch(e){} A.takeUpTheHouse(d); };
    const asArr = v => Array.isArray(v) ? v : [];   /* so a regressed (non-array) children field fails a clean assertion, not a crash */

    /* ---- 1. passed-over children are named, not counted ---- */
    let arm1 = null;
    { const d = house();
      const heirC = withKid(d, 901, 12, {});
      const bro = withKid(d, 902, 8, {});
      const sis = withKid(d, 903, 6, { sex:"f" });
      A.nameHeir(d, "son", 901);
      succeedNow(d);
      const fb = d.forebears[d.forebears.length-1];
      const recent = d.log.slice(0,5).map(e=>e.text);
      arm1 = { children: fb.children, heirName: heirC.name, broName: bro.name, sisName: sis.name,
        recentHasBoth: recent.some(t=>t.includes(bro.name) && t.includes(sis.name)),
        recentHasHeir: recent.some(t=>t.includes("did not get the house") && t.includes(heirC.name)) };
      if(!Array.isArray(fb.children)) bad.push(`the forebear record's children field is not an array: ${JSON.stringify(fb.children)}`);
      if(asArr(fb.children).includes(heirC.name)) bad.push(`the forebear record names the heir "${heirC.name}" among the passed-over children — he took the house, he wasn't passed over`);
      if(!asArr(fb.children).includes(bro.name) || !asArr(fb.children).includes(sis.name))
        bad.push(`the passed-over son and daughter should both be named in the forebear record, got [${asArr(fb.children).join(",")}]`);
      if(!arm1.recentHasBoth) bad.push(`no chronicle line at succession names the passed-over children ("${bro.name}", "${sis.name}")`);
      if(arm1.recentHasHeir) bad.push(`the passed-over-children chronicle line names the heir "${heirC.name}" as if he'd been passed over too`); }

    /* ---- 2. nobody passed over: an empty list, and silence, not a false line ---- */
    let arm2 = null;
    { const d = house();
      const only = withKid(d, 950, 12, {});
      A.nameHeir(d, "son", 950);
      succeedNow(d);
      const fb = d.forebears[d.forebears.length-1];
      const recent = d.log.slice(0,5).map(e=>e.text);
      arm2 = { children: fb.children, onlyName: only.name,
        falseLine: recent.some(t=>t.includes("did not get the house")) };
      if(!Array.isArray(fb.children) || fb.children.length !== 0)
        bad.push(`an only son who takes the house should leave an empty passed-over list, got [${asArr(fb.children).join(",")}]`);
      if(arm2.falseLine) bad.push(`a succession with nobody passed over still fired the passed-over chronicle line`); }

    /* ---- 3. the toga knows an already-named son when it sees one ---- */
    let arm3 = null;
    { const build = (id) => { const d = house(); const c = withKid(d, id, 17, {}); A.nameHeir(d, "son", id); return { d, c }; };

      const { d: dAlready, c: cAlready } = build(1001);
      const evAlready = A.togaEvent(dAlready, cAlready);

      const dFresh = house(); const cFresh = withKid(dFresh, 1002, 17, {});
      const evFresh = A.togaEvent(dFresh, cFresh);

      const { d: dAccept, c: cAccept } = build(1003);
      const evA = A.togaEvent(dAccept, cAccept);
      const acceptMsg = A.EVENTS.toga.run(dAccept, evA, 0);

      const { d: dDecline, c: cDecline } = build(1004);
      const evD = A.togaEvent(dDecline, cDecline);
      const declineBefore = Object.assign({}, dDecline.heir);
      const declineMsg = A.EVENTS.toga.run(dDecline, evD, 1);

      const dFreshDecline = house(); const cFreshD = withKid(dFreshDecline, 1005, 17, {});
      const evFD = A.togaEvent(dFreshDecline, cFreshD);
      const freshDeclineMsg = A.EVENTS.toga.run(dFreshDecline, evFD, 1);

      arm3 = {
        alreadyText: evAlready.text, alreadyChoices: evAlready.choices,
        freshText: evFresh.text, freshChoices: evFresh.choices,
        acceptMsg, acceptKind: dAccept.heir && dAccept.heir.kind, acceptCid: dAccept.heir && dAccept.heir.cid,
        acceptName: dAccept.heir && dAccept.heir.name,
        declineMsg, declineBefore, declineAfter: dDecline.heir, togaTilSet: cDecline.togaTil, weekNow: dDecline.week,
        declineGrown: !!cDecline.grown,
        freshDeclineMsg,
      };

      if(evAlready.text === evFresh.text)
        bad.push(`the toga event's text is identical for an already-named son and a fresh one`);
      if(!evAlready.choices[0].includes("Confirm") || !evAlready.choices[1].includes("stays your heir as he is"))
        bad.push(`an already-named son's toga choices don't read as a confirmation: [${evAlready.choices.join(" | ")}]`);
      if(!evFresh.choices[0].includes("Name") || !evFresh.choices[0].includes("your heir and successor") || !evFresh.choices[1].includes("Not yet"))
        bad.push(`a fresh (never-named) son's toga choices regressed: [${evFresh.choices.join(" | ")}]`);
      if(arm3.acceptKind !== "scion") bad.push(`accepting the toga for an already-named son should still upgrade him to "scion" terms, got kind "${arm3.acceptKind}"`);
      if(arm3.acceptCid !== cAccept.id) bad.push(`accepting the toga lost the boy's identity — heir cid is ${arm3.acceptCid}, expected ${cAccept.id}`);
      if(!/confirmed heir before witnesses/.test(arm3.acceptMsg))
        bad.push(`accepting an already-named son's toga should say he's confirmed, not freshly named: "${arm3.acceptMsg}"`);
      if(arm3.acceptMsg === "He is a man now, whatever you decide.")
        bad.push(`resolveToga threw on accept and fell back to the generic EVENTS.toga.run catch text`);
      if(!arm3.declineAfter || arm3.declineAfter.kind !== "son" || arm3.declineAfter.cid !== declineBefore.cid || arm3.declineAfter.name !== declineBefore.name)
        bad.push(`declining the toga for an already-named son should leave d.heir completely untouched — before ${JSON.stringify(declineBefore)}, after ${JSON.stringify(arm3.declineAfter)}`);
      if(arm3.togaTilSet == null || arm3.togaTilSet <= arm3.weekNow)
        bad.push(`declining the toga should still push togaTil into the future so it doesn't re-fire next week`);
      if(arm3.declineGrown)
        bad.push(`declining the toga set c.grown — that would silently stop the event from ever asking again`);
      if(!/stays your heir exactly as he was named/.test(arm3.declineMsg))
        bad.push(`declining an already-named son's toga should say he stays heir as named, got: "${arm3.declineMsg}"`);
      if(!/not yet named/.test(arm3.freshDeclineMsg))
        bad.push(`declining a FRESH (never-named) son's toga regressed off "not yet named": "${arm3.freshDeclineMsg}"`); }

    return { bad, arm1, arm2, arm3 };
  });

  bad.push(...r.bad);
  const asArr = v => Array.isArray(v) ? v : [];

  lines.push(`arm 1 — passed over: forebear children [${asArr(r.arm1.children).join(", ")}] (heir "${r.arm1.heirName}" excluded) `
    + `· chronicle names both: ${r.arm1.recentHasBoth}`);
  lines.push(`arm 2 — only child "${r.arm2.onlyName}" takes the house: forebear children [${asArr(r.arm2.children).join(", ")}] `
    + `· false "passed over" line fired: ${r.arm2.falseLine}`);
  lines.push(`arm 3 — toga: already-named choices "${r.arm3.alreadyChoices.join(" / ")}" vs fresh "${r.arm3.freshChoices.join(" / ")}" `
    + `· accept → kind ${r.arm3.acceptKind}, cid ${r.arm3.acceptCid} · decline leaves heir "${r.arm3.declineAfter && r.arm3.declineAfter.name}" `
    + `(kind ${r.arm3.declineAfter && r.arm3.declineAfter.kind}), togaTil ${r.arm3.togaTilSet}`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
