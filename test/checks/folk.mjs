/* THE DOMESTIC HALF OF THE HOUSE, WHICH NOTHING COULD REACH AND NOBODY WAS TOLD ABOUT.

   `d.household` was an empty object in every house of every sweep this audit has run, and it was
   listed as a dark subsystem three times. Both reasons turned out to be true at once:

     1. NOT ONE OF THE NINE FUNCTIONS WAS ON THE TEST HANDLE — `hireFolk`, `householdWeek`,
        `householdCount`, `houseFolk`, `hasFolk`, `hhWage`, `hhUpkeep`, `HOUSEHOLD`, `HH_KEYS`.
        So no check could drive it and the reference player could not hire even if he wanted to.
        "Never fired in 5,000 house-weeks" was a fact about the handle, not about the game.
     2. AND NOTHING ON THE SCREEN MENTIONED IT. It is one section on the third view of the villa
        tab. This is the doctrine of v2.93.0 exactly, one layer down: a system that works, costs
        little, is strictly good, and is never found. v2.98.0 adds one line to the week's agenda.

   MEASURED, once it could be driven at all — 20 weeks with nothing else moving, one hire each:
     Cook (skill 44)          141 points of fatigue off the yard      112d down, 7d a week
     Nurse (skill 55)         3 weeks off one man's mending           144d down, 9d a week
     Housekeeper (skill 74)   unrest down 13.5                        112d down, 7d a week
     The lanista's wife       6.9 points of his life back             free
   The wage tracks the roster as advertised — 6d at one man, 8d at five, 13d at fourteen — it is on
   `weeklyBill` (50d alone against 75d with all four), and three of the four walk out of a house held
   at unrest 90 while the wife stays. All of it correct. None of it reachable.

   WHAT THIS HOLDS is each effect in the direction its own table promises, the wage arithmetic, the
   upkeep line, the leaving branch, and that the week's agenda says so ONCE and then goes quiet — two
   standing items on the villa tab is the fault #101 spent a release measuring.
   WHAT WOULD FALSIFY: an effect that stops moving its number, a wage that stops growing with the
   house, or the nudge arriving at a house that cannot pay the fee. */

import { hasHandle } from "../harness.mjs";

export const name = "folk";
export const describe = "the household hires, works, costs what it says, and is finally mentioned";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    for(const fn of ["hireFolk","householdWeek","householdCount","houseFolk","hasFolk","hhWage","hhUpkeep"])
      if(typeof A[fn] !== "function") bad.push(`\`${fn}\` is not on the handle — the household cannot be driven`);
    if(!A.HOUSEHOLD || !A.HH_KEYS) bad.push("`HOUSEHOLD`/`HH_KEYS` are not on the handle");
    if(bad.length) return { bad, lines };

    /* a house that needs every one of them: tired men, one laid up, restive cells, a failing lanista */
    const needy = tag => {
      const d = A.newGameState("Fk", "clean", tag, null);
      d.week = 60; d.gold = 40000; d.fame = 300;
      while(A.activeG(d).length < 5){ const m = A.genGladiator(d, 70); m.id = d.nextId++;
        m.status = "active"; m.mine = true; m.kit = A.defaultKit(m.cls); d.gladiators.push(m); }
      for(const g of A.activeG(d)){ g.injury = null; g.lastFought = -9; g.fatigue = 60; }
      const hurt = A.activeG(d)[0];
      hurt.status = "injured"; hurt.injury = { kind:"a deep cut", weeks:8 };
      d.unrest = 50;
      if(!d.lanista) d.lanista = A.makeLanista(d);
      d.lanista.health = 60;
      return { d, hurt };
    };
    /* what each of them is FOR, in the direction its own entry promises */
    const READS = {
      cook:   { what:"fatigue off the yard", read:(d)=>A.activeG(d).reduce((n,g)=>n+(g.fatigue||0),0), want:-1 },
      nurse:  { what:"weeks off the mending", read:(d,h)=>h.injury ? h.injury.weeks : 0, want:-1 },
      keeper: { what:"unrest in the cells", read:(d)=>d.unrest, want:-1 },
      wife:   { what:"the lanista's life", read:(d)=>d.lanista.health, want:+1 },
    };

    /* ---- 1. EACH OF THEM HIRES, CHARGES, AND DOES WHAT SHE IS FOR ---- */
    for(const k of A.HH_KEYS){
      const H = A.HOUSEHOLD[k], Rd = READS[k];
      const { d, hurt } = needy("FOLK-"+k);
      const g0 = d.gold;
      if(A.hireFolk(d, k) !== true){ bad.push(`\`hireFolk(d,"${k}")\` refused with 40,000d in the box`); continue; }
      const fee = g0 - d.gold;
      const f = A.houseFolk(d)[k];
      if(!f) bad.push(`\`hireFolk\` reported ok for "${k}" and \`houseFolk\` has nobody in the place`);
      if(f && !(f.skill >= 38 && f.skill <= 78))
        bad.push(`"${k}" rolled a skill of ${f.skill}, and the table rolls 38 to 78 — the multiplier `
          + `\`hhSkill\` reads it, so a value off the end of that is a woman worth 1.55x or 0.62x by accident`);
      if(k !== "wife" && fee <= 0) bad.push(`taking on the ${H.name.toLowerCase()} cost ${fee}d`);
      if(k === "wife" && fee !== 0) bad.push(`telling your wife she runs the house cost ${fee}d, and she is free`);
      if(A.hireFolk(d, k) === true) bad.push(`the same ${H.name.toLowerCase()} was hired twice`);

      const before = Rd.read(d, hurt);
      const gold1 = d.gold;
      for(let w=0; w<20; w++) A.householdWeek(d);
      const after = Rd.read(d, hurt);
      const moved = after - before, paid = gold1 - d.gold;
      lines.push(`${H.name.padEnd(22)} skill ${String(f?f.skill:"?").padStart(2)} · ${String(fee).padStart(4)}d down, `
        + `${A.hhWage(d,k)}d a week · 20 weeks cost ${String(paid).padStart(4)}d · ${Rd.what} `
        + `${before.toFixed(1)} → ${after.toFixed(1)}`);
      if(Rd.want > 0 ? !(moved > 0) : !(moved < 0))
        bad.push(`the ${H.name.toLowerCase()} moved ${Rd.what} by ${moved.toFixed(1)} over 20 weeks and her `
          + `entry says she should move it ${Rd.want > 0 ? "up" : "down"}. She is being paid ${paid}d for it`);
      if(k !== "wife" && paid !== A.hhWage(d,k) * 20)
        bad.push(`the ${H.name.toLowerCase()} cost ${paid}d over 20 weeks and her wage says ${A.hhWage(d,k)*20}d`);
    }

    /* ---- 2. A COOK FOR FOURTEEN IS NOT A COOK FOR FOUR ---- */
    {
      const { d } = needy("FOLK-WAGE");
      const at = n => {
        while(A.activeG(d).length > n) A.activeG(d)[0].status = "dead";
        while(A.activeG(d).length < n){ const m = A.genGladiator(d, 70); m.id = d.nextId++;
          m.status = "active"; m.mine = true; d.gladiators.push(m); }
        return A.hhWage(d, "cook");
      };
      const one = at(1), five = at(5), many = at(14);
      lines.push(`the cook's wage against the roster: ${one}d at one man, ${five}d at five, ${many}d at fourteen`);
      if(!(many > five && five > one))
        bad.push(`the cook is paid ${one}/${five}/${many}d for one, five and fourteen men — \`hhWage\` is `
          + `meant to grow with the house that made her necessary, and a flat wage was the fault it fixed`);
      if(A.hhWage(d, "wife") !== 0) bad.push(`the lanista's wife is drawing a wage of ${A.hhWage(d,"wife")}d`);
    }

    /* ---- 3. AND IT IS ON THE LEDGER, not taken quietly out of the box ---- */
    {
      const { d } = needy("FOLK-BILL");
      const b0 = A.weeklyBill(d);
      for(const k of A.HH_KEYS) A.hireFolk(d, k);
      const b1 = A.weeklyBill(d), up = A.hhUpkeep(d);
      lines.push(`the weekly bill: ${b0}d alone, ${b1}d with all ${A.householdCount(d)} of them (hhUpkeep ${up}d)`);
      if(up <= 0) bad.push(`\`hhUpkeep\` is ${up}d with the whole household hired`);
      if(b1 - b0 !== up)
        bad.push(`the bill went up ${b1-b0}d and the household costs ${up}d — the domestic half of the `
          + `house has come off \`weeklyBill\` again, which is how it was invisible in the first place`);
    }

    /* ---- 4. THEY LEAVE A HOUSE THAT IS COMING APART, and the wife does not ---- */
    {
      const { d } = needy("FOLK-LEAVE");
      for(const k of A.HH_KEYS) A.hireFolk(d, k);
      for(let w=0; w<60; w++){ A.householdWeek(d); d.gold = 5000; d.unrest = 90; }
      const left = A.HH_KEYS.filter(k=>!A.hasFolk(d, k));
      lines.push(`60 weeks at unrest 90: ${left.length ? left.join(", ")+" walked out" : "nobody left"}`
        + ` · the wife stayed: ${A.hasFolk(d, "wife")}`);
      if(!left.length)
        bad.push(`nobody walked out of a house held at unrest 90 for 60 weeks — the branch is `
          + `\`weeks>8 && (unrest>78 || gold<-80)\` at 5% a week, which should take somebody in that time`);
      if(!A.hasFolk(d, "wife"))
        bad.push(`the lanista's wife walked out — the branch excludes her by \`k!=="wife"\`, and she is `
          + `the one person in this house who cannot be replaced by hiring somebody`);
    }

    /* ---- 5. AND THE WEEK FINALLY SAYS SO, ONCE ---- */
    {
      const mk = (gold) => { const { d } = needy("FOLK-SAY-"+gold); d.week = 30; d.gold = gold; return d; };
      const says = st => { try { return A.agenda(st) || []; } catch(e){ return [{ label:"THREW: "+e.message }]; } };
      const hit = items => items.find(i => /feeds this house|household have never been hired/i.test(i.label || ""));

      const rich = mk(40000);
      const first = hit(says(rich));
      lines.push(`a house at week 30 with 40,000d is told about the household: ${first ? `"${first.label}" · ${first.sub}` : "NO"}`);
      if(!first)
        bad.push(`the week's agenda never mentions the household. Four hires, a skill roll, a wage that `
          + `scales, an upkeep line and a leaving branch, and \`d.household\` was empty in every house of `
          + `every sweep — a system nothing points at is not a choice, it is dead weight`);
      else if(first.urgency >= 2)
        bad.push(`the household is being raised at urgency ${first.urgency} — it is cheap and strictly `
          + `good, not urgent, and anything above 1 pushes a real problem down the list`);

      for(const k of A.HH_KEYS) A.hireFolk(rich, k);
      if(hit(says(rich)))
        bad.push(`the agenda still asks for the household with all ${A.householdCount(rich)} of them hired — `
          + `that is a standing item on the villa tab, which is the #101 fault`);
      lines.push(`and goes quiet once they are hired: ${!hit(says(rich))}`);

      const poor = mk(60);
      if(hit(says(poor)))
        bad.push(`a house with 60d is being told to take on a cook it cannot pay the fee for — advice `
          + `that arrives when it cannot be taken is the \`agendaCan\` fault #119 already priced`);
      lines.push(`a house with 60d is left alone about it: ${!hit(says(poor))}`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
