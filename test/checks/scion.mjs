/* THE NEXT GENERATION IS SOMEBODY BEFORE HE IS AN HEIR

   Audit item #226: "3 successions in 16 runs, and the heir arrives as a mechanic at the death. The
   domus (wife, children, next of kin) exists from week one and stays procedural. Recommend seeding
   the generation early — the heir as a named character in years 1-3 (at the rail during a card, a
   first opinion, a falling-out) — so succession lands as an arc's end rather than a modal."

   `checks/domus.mjs` already holds this arc and says in its own words that it is a bench: hand-built
   states, each branch driven directly, because its claim is about six branches of one function. It
   asks nothing about whether a played house reaches any of them, which is the whole of #226.

   MEASURED over 3,497 weeks and fourteen played houses (`probes/scion.mjs`), and the item is right:

     houses that married                 14 of 14, median week 32
     children born                       41
     the age a child ever reached        median 5, max 21
     `raising` at seven / twelve         10 / 8
     THE TOGA, the only road to a scion  3
     successions                         2

   AND THE HEIR WAS A MECHANIC IN THE MOST LITERAL WAY AVAILABLE. `heirEligible` offered "A son" on
   `d.lanista.age >= 40` and NEVER ASKED WHETHER HE HAD A CHILD. Every one of the fourteen houses
   named an heir in WEEK TWO; seven named a son; one of those seven died 95 weeks later having never
   had a child at all. `HEIRS.son` describes a boy "they have watched since he was nine" — about a
   boy who did not exist. The real son, born week 92 and taking the toga 288 weeks later, arrived to
   find the job filled.

   AND BETWEEN THE GATES, NOTHING. `YEAR_WEEKS` is 18, so the three beats a child has land 126, 216
   and 288 weeks after his birth. The longest stretch with nothing said about the blood of the house
   ran a median of 91 weeks and a maximum of 199 — five to eleven years in which a man's children
   are a field on the save.

   AFTER: the son has to exist before he can be named, so all fourteen houses name a nephew, which
   is what a man with no children has always had. And a child is noticed at three, five, nine and
   fourteen — in the gaps at seven, twelve and sixteen — on a CLOCK rather than a roll, asking
   nothing of the player and drawing nothing from the simulation's stream. Family beats over the
   same fourteen houses went from 25 to 103, and the longest silence from a median of 91 weeks to 57.

   FIVE ARMS:
   1 · A SON YOU DO NOT HAVE IS NOT ON THE LIST, and one you do have is.
   2 · AND EVERY KIND THE LIST OFFERS IS A KIND THE GAME HAS. "son" hid for as long as it did
       because nothing ever compared the two tables.
   3 · THE BOY HAS YEARS. Over real play the between-gate beats fire, and the silence is bounded.
   4 · AND THEY ARE HIS YEARS — the line differs by child and by age, and does not draw on the
       simulation's stream, which is #223's rule.
   5 · AND THE ARC STILL REACHES ITS END: the toga still names a scion. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "scion";
export const describe = "the next generation is somebody before he is an heir";
export const slow = true;   /* plays houses until their children grow up */

const SILENCE_CEIL = 130;   /* measured max 84; it was 199 before v3.169.0 */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"SCION-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","heirEligible","HEIRS","domusOf","childAge","childYear",
      "CHILD_YEARS","YEAR_WEEKS","rngPeek","activeG"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const clone = x => JSON.parse(JSON.stringify(x));

    /* 1 and 2 — the list, on a house with no children and on one with a boy of nine */
    const bare = A.newGameState("Scion", "clean", "SCION-B", null);
    bare.lanista = { ...(bare.lanista||{}), age:52, health:90 };
    A.domusOf(bare).children = [];
    const bareList = A.heirEligible(bare) || [];

    const withBoy = clone(bare);
    const dm = A.domusOf(withBoy);
    dm.wife = { name:"Vettia", family:"Vettius", married:1, age:26, from:"merchant" };
    dm.children = [{ id:9001, name:"Aulus", sex:"m", born: withBoy.week - 10*A.YEAR_WEEKS }];
    const boyList = A.heirEligible(withBoy) || [];

    const tooYoung = clone(withBoy);
    A.domusOf(tooYoung).children[0].born = tooYoung.week - 4*A.YEAR_WEEKS;
    const youngList = A.heirEligible(tooYoung) || [];

    const unknown = [...new Set([].concat(bareList, boyList, youngList))].filter(k=>!A.HEIRS[k]);

    /* 4 — the years are his, and they cost the stream nothing */
    const shape = t => String(t||"").replace(/\d+/g,"#").replace(/\b[A-Z][a-z]{2,}\b/g,"N")
      .replace(/\s+/g," ").trim();
    const said = new Set(), byAge = {};
    const rngBefore = A.rngPeek();
    for(const age of A.CHILD_YEARS){
      byAge[age] = new Set();
      for(let k=0; k<8; k++){
        const s = clone(withBoy); s.week += k*7;
        const c = A.domusOf(s).children[0]; c.id = 9001 + k*3;
        const was = (s.log && s.log[0]) || null;
        try { A.childYear(s, c, age); } catch(e){}
        const h = (s.log && s.log[0]) || null;
        if(h && h !== was){ said.add(shape(h.text)); byAge[age].add(shape(h.text)); }
      }
    }
    const rngAfter = A.rngPeek();

    /* 3 and 5 — over real play */
    let weeks = 0, kids = 0, toga = 0, scion = 0, yearBeats = 0, gateBeats = 0;
    const sil = [], perHouse = [];
    for(let h=0; h<7; h++){
      const d = A.newGameState("Scion", "clean", "SCION-R"+h, null);
      const beatsAt = [];
      for(let w=0; w<420; w++){
        if(d.over) break;
        try { R.lanista(d); } catch(e){ break; }
        weeks++;
        for(const c of (A.domusOf(d).children||[])){
          if(!c.__b){ c.__b = 1; kids++; beatsAt.push(c.born); }
          for(const y of Object.keys(c.years||{}))
            if(!c["__y"+y]){ c["__y"+y] = 1; yearBeats++; beatsAt.push(c.years[y]); }
          for(const k of ["up1","up2","grown","wed"])
            if(c[k] && !c["__"+k]){ c["__"+k] = 1; gateBeats++; beatsAt.push(d.week);
              if(k === "grown") toga++; }
        }
        if(d.heir && d.heir.kind === "scion" && !d.__sc){ d.__sc = 1; scion++; }
      }
      beatsAt.sort((a,b)=>a-b);
      let worst = 0;
      for(let i=1;i<beatsAt.length;i++) worst = Math.max(worst, beatsAt[i]-beatsAt[i-1]);
      if(beatsAt.length >= 2) sil.push(worst);
      perHouse.push(beatsAt.length);
    }

    /* ---- 5, ON A BENCH, AND DELIBERATELY NOT AS A RATE ----
       The toga lands 288 weeks after a birth that lands around week 92, against a median house life
       of 224: measured, it fires 3 times in fourteen houses. Asserting on that in a seven-house run
       is a coin flip wearing an assertion's clothes — the same shape that has now cost this suite
       three false reds. What arm 5 owes is that the ROAD IS WALKABLE, so it walks it: a boy of
       sixteen, the event raised, the first door taken, and a scion heir on the state or not. */
    const grown = clone(withBoy);
    A.domusOf(grown).children[0].born = grown.week - 16*A.YEAR_WEEKS;
    let togaRaised = false, scionNamed = null, scionCid = null;
    { grown.pendingEvent = null;
      try { A.familyWeek(grown); } catch(e){}
      const ev = grown.pendingEvent;
      togaRaised = !!(ev && ev.id === "toga");
      if(togaRaised){ try { A.EVENTS.toga.run(grown, ev, 0); } catch(e){}
        scionNamed = grown.heir ? grown.heir.kind : null;
        scionCid = grown.heir ? grown.heir.cid : null; } }

    const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
      return { n:s.length, p50:s[Math.floor(s.length/2)], max:s[s.length-1] }; };
    return { bareList, boyList, youngList, unknown,
      shapes: said.size, perAge: Object.fromEntries(Object.entries(byAge).map(([k,v])=>[k, v.size])),
      rngMoved: rngBefore !== rngAfter, togaRaised, scionNamed, scionCid,
      weeks, kids, toga, scion, yearBeats, gateBeats, sil:q(sil), perHouse:q(perHouse) };
  });

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };

  lines.push(`the list a house with NO children is offered: ${r.bareList.join(", ") || "(nothing)"}`
    + ` · with a boy of ten: ${r.boyList.join(", ")} · with one of four: ${r.youngList.join(", ")}`);
  lines.push(`  the years between the gates: ${r.shapes} distinct shapes across ${JSON.stringify(r.perAge)}`
    + ` · the simulation's stream moved: ${r.rngMoved}`);
  lines.push(`  over ${r.weeks} played weeks: ${r.kids} children · ${r.yearBeats} years + ${r.gateBeats} gates`
    + ` = ${r.yearBeats + r.gateBeats} beats · ${r.toga} took the toga, ${r.scion} named a scion`);
  lines.push(`  on the bench, a boy of sixteen: the toga is raised ${r.togaRaised} · the heir it names is `
    + `${r.scionNamed || "nobody"}${r.scionCid != null ? ` (child ${r.scionCid})` : ""}`);
  lines.push(`  beats a house saw ${JSON.stringify(r.perHouse)} · the longest silence ${JSON.stringify(r.sil)} weeks`);

  /* 1 — a son you do not have */
  if(r.bareList.includes("son"))
    bad.push(`a house with no children at all is offered "A son" as its heir — \`heirEligible\` read the `
      + `LANISTA's age and never asked whether he had a child, and \`HEIRS.son\` describes a boy "they `
      + `have watched since he was nine". Seven of fourteen played houses named one in week two`);
  if(!r.boyList.includes("son"))
    bad.push(`a house with a living son of ten is NOT offered "A son" — the fix has taken the option away `
      + `from the men who actually have one, which is worse than the fault`);
  if(r.youngList.includes("son"))
    bad.push(`a boy of four is offered as an heir "they have watched since he was nine"`);
  /* 2 — and the list and the table agree */
  if(r.unknown.length)
    bad.push(`\`heirEligible\` offers ${r.unknown.join(", ")}, which \`HEIRS\` does not have — a kind on the `
      + `list and not in the table is an heir a player can choose and the game cannot deliver`);
  /* 4 — the years are his, and free */
  if(r.shapes < 6)
    bad.push(`the years between the gates speak ${r.shapes} distinct shapes over four ages and eight children `
      + `— a boy who is noticed in the same sentence every time is not being noticed`);
  for(const [age, n] of Object.entries(r.perAge))
    if(n < 2) bad.push(`the line at ${age} takes ${n} shape(s) — that age says one thing to every child`);
  if(r.rngMoved)
    bad.push(`writing a line about a child moved the simulation's random stream — prose must not decide `
      + `which men a house loses, which is #223's rule and the reason \`sayOf\` exists`);
  /* 3 — the boy has years, and the silence is bounded */
  if(!r.kids) bad.push(`no child was born in ${r.weeks} played weeks — arms 3 and 5 measured nothing`);
  else {
    if(!r.yearBeats)
      bad.push(`not one between-gate year fired across ${r.kids} children — the three gates land 126, 216 `
        + `and 288 weeks after a birth and the house hears nothing in between, which is #226`);
    else if(r.yearBeats < r.gateBeats)
      bad.push(`${r.yearBeats} between-gate years against ${r.gateBeats} gates — the gaps are still most of `
        + `the childhood`);
    if(r.sil && r.sil.max > SILENCE_CEIL)
      bad.push(`a house went ${r.sil.max} weeks with nothing said about its own blood — it was 199 before `
        + `v3.169.0 and the ceiling here is ${SILENCE_CEIL}`);
  }
  /* 5 — and the end is still reachable, on a bench: see the note over the fixture */
  if(!r.togaRaised)
    bad.push(`a boy of sixteen in the house raises no toga — the only road to a scion heir is shut, and `
      + `every year this release added is years of a boy who can never inherit`);
  else if(r.scionNamed !== "scion")
    bad.push(`the toga was taken and the heir on the state is ${r.scionNamed || "nobody"} rather than a `
      + `scion — the beat fires and the thing it exists to produce does not`);
  else if(r.scionCid == null)
    bad.push(`the scion heir carries no \`cid\`, so he is not linked to the child who took the toga — which `
      + `is how "A son" managed to be a son nobody had`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the son has to exist, and he is somebody for years before he is an heir`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
