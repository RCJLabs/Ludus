/* THE WIDOW WHO IS NEVER MADE — #243's verify-first, held as a gate.

   (`widow` was free in BOTH directories; checked before writing, in checks and probes.)

   The item gates its fourth phase — the widow as regent, holding the house until a boy of under nine
   comes of age — on one number: *"how many houses would have a widow-and-minor on the lanista's
   death. Phase 4 is worth building only if that number is not zero."*

   MEASURED (`probes/widow.mjs`, three arms, 48 houses, 10,927 played weeks): **it is zero, and there
   are no deaths to have one.** Not one lanista died in any played house. Twenty-two handovers, and
   twenty-two of twenty-two were RETIREMENTS at a median age of 63 — a living man handing on.

   THE REASON IS NOT THE ONE THE ITEM GUESSED. The item says the door "v3.200.0 measured and could
   not open, because the boy needs 162 weeks". The boy's clock is not the binding constraint:

     · the house ends first. The reference player's house dies at a median of week 260 with the man
       aged 51 at **health 100** — full health, the years barely started. The endings are the ledger's
       (debt 10 of 16), not the man's.
     · and where he does reach sixty-two well, the design routes him out ALIVE, on purpose. This is
       the trade `LAN_AGE_FROM` 42 → 52 made and said it was making: at the old onset "the successions
       that did happen came through the death door, the lanista dropping dead, rather than the
       retirement the design wrote for it". At the new one he is sound at 62, the retirement gate
       (`age >= 62 && health >= 45 && d.heir && heirOfAge`) opens at 6% a week, and the race to
       health 0 takes fifteen more years. He hands on and keeps his rooms.

   So phase 4 has no trigger, and #243's phases 1-3 — her family as a standing tie, a life, her own
   asks — are the item, because SHE is reachable: 15 of 16 houses marry at a median of week 35 and a
   wife stands on **85% of played weeks**.

   THE DEATH DOOR IS NOT SHUT, and this does not claim it is — `checks/tenure.mjs` arm 5 drives both
   doors and both fire, and arm 3 ages a man to health 0. Arms 3 and 4 below drive the death too, and
   read the widow and the boy standing in it. The refusal is about REACHABILITY in a played house,
   which is a different claim and the one the item asked for.

   FIVE ARMS. Arm 2 is the race, which is the refusal itself; arms 3 and 4 are its read-path control,
   because a zero from a detector that cannot fire is not a measurement. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "widow";
export const describe = "a man who reaches sixty-two in health hands the house on alive, so there is no widow to make a regent of";

export async function run({ p }){
  const lines = [], bad = [];
  await found(p, { seed:"WID-1" });
  await clearAll(p, 10);
  await installRope(p);

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","makeLanista","lanistaWeek","domusOf","childAge","livingKids",
                  "marryReady","takeUpTheHouse","SON_AGE","HEIR_AGE","LAN_AGE_FROM","WEEKS_PER_YEAR",
                  "heirOfAge"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const YW = A.WEEKS_PER_YEAR, SON = A.SON_AGE;

    /* A MOVING SEED, for the reason `checks/tenure.mjs` records: `newGameState` reseeds the one
       global R(), so a fixture naming the same seed replays the same first draw, and a hundred
       trials of a 6% roll become one roll a hundred times. */
    let tick = 0;
    const quiet = (age, health) => {
      const d = A.newGameState("Wid", "clean", `WID-${age}-${tick++}`, null);
      d.week = 6*YW + 4; d.unrest = 10; d.rebellion = null; d.buildings = {};
      d.lanista = A.makeLanista(d); d.lanista.age = age; d.lanista.health = health;
      return d;
    };
    const family = (d, wifeAge, boyAge) => { const dm = A.domusOf(d);
      dm.wife = { name:"Prima Vettia", family:"the Vettii", married: d.week - YW*(wifeAge-24), age:24, from:"merchant" };
      dm.children.push({ id:dm.nextKin++, name:"Lucius Minor", sex:"m", born: d.week - YW*boyAge,
        up:{palus:0,rhetor:0,box:0} });
      dm.lastBorn = dm.children[dm.children.length-1].born; return dm; };

    /* ---- 2: THE RACE. A man who reaches sixty-two in health hands on ALIVE ----
       Every term of the retirement gate satisfied and the clock left to run: the question is only
       which door he goes out of. If a death ever wins this race, phase 4 has a trigger and #243's
       fourth phase should be re-read. */
    const race = { retired:0, died:0, neither:0, weeks:[] };
    for(let t=0;t<80;t++){
      const d = quiet(62, 88);
      d.heir = { kind:"nephew", name:"Lucius" };
      let out = null, w = 0;
      for(; w<400 && !out; w++){
        try { A.lanistaWeek(d); } catch(e){ break; }
        if(d.succession) out = d.succession.retire ? "retired" : "died";
        else if(d.over && d.over.kind === "lanistaDied") out = "died";
        d.week++; if(w % YW === YW-1) d.lanista.age++;
      }
      if(out === "retired"){ race.retired++; race.weeks.push(w); }
      else if(out === "died") race.died++; else race.neither++;
    }

    /* ---- 3: AND THE STATE PHASE 4 WOULD READ IS THERE WHEN HE DOES DIE ----
       The read-path control on arm 2's zero: drive the death with a widow and a boy of three
       standing, and check that everything a regency would have to consult is legible at that week. */
    const death = (()=>{ const d = quiet(70, 0.05); family(d, 40, 3);
      d.heir = { kind:"nephew", name:"Lucius" };
      try { A.lanistaWeek(d); } catch(e){ return { threw:String(e.message||e).slice(0,60) }; }
      const dm = A.domusOf(d), boy = A.livingKids(d).filter(c=>c.sex==="m")[0];
      return { succ: !!d.succession, retire: d.succession ? !!d.succession.retire : null,
        wife: !!dm.wife, wifeName: dm.wife ? dm.wife.name : null,
        boyAge: boy ? A.childAge(d, boy) : null, minor: boy ? A.childAge(d, boy) < SON : false, d }; })();

    /* and with nobody named the run ends instead, and she is still standing in the wreck */
    const lone = (()=>{ const d = quiet(70, 0.05); family(d, 40, 3); d.heir = null;
      try { A.lanistaWeek(d); } catch(e){ return { threw:String(e.message||e).slice(0,60) }; }
      return { over: d.over ? d.over.kind : null, wife: !!A.domusOf(d).wife }; })();

    /* ---- 4: AND `succeed` ERASES HER, which is where a regency would have to intercept ----
       The handover resets the domus by design (`checks/domus.mjs`: the next man must not inherit the
       dead man's wife, or `marryReady` can never fire again). So a phase-4 regency cannot be bolted
       on after the handover — it would have to hold the house BEFORE `takeUpTheHouse` runs. */
    const after = (()=>{ const d = death.d;
      if(!d || !d.succession) return { ran:false };
      const gen0 = d.generation, took = A.takeUpTheHouse(d);
      const fore = (d.forebears||[])[(d.forebears||[]).length-1] || null;
      return { ran:true, took:!!took, gen0, gen:d.generation, wife: !!A.domusOf(d).wife,
        recorded: fore ? fore.wife : null, kids: fore ? (fore.children||[]).length : null }; })();

    /* ---- 5: AND SHE IS REACHABLE, which is what phases 1-3 rest on ----
       Small, because the probe carries the campaign; this holds only that the marriage still happens
       in a played house and that she stays. */
    const play = { houses:0, wed:0, weeks:0, wifeWeeks:0, deaths:0, readyWeeks:0 };
    for(let i=0;i<4;i++){
      const d = A.newGameState("Wid", "clean", `WID-PLAY-${i}`);
      play.houses++; let hadSucc = false, wed = false;
      for(let w=0; w<260; w++){
        if(d.over) break;
        const dm = A.domusOf(d);
        play.weeks++; if(dm.wife){ play.wifeWeeks++; wed = true; }
        if(A.marryReady(d)) play.readyWeeks++;
        try { R.lanista(d, {}); } catch(e){ break; }
        if(d.succession && !hadSucc && !d.succession.retire) play.deaths++;
        hadSucc = !!d.succession;
        if(d.over && d.over.kind === "lanistaDied") play.deaths++;
      }
      if(wed) play.wed++;
    }
    return { race, death:{ ...death, d:undefined }, lone, after, play,
      onset:A.LAN_AGE_FROM, son:SON, toga:A.HEIR_AGE };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };

  const { race, death, lone, after, play } = out;
  const medw = race.weeks.length ? race.weeks.slice().sort((a,b)=>a-b)[Math.floor(race.weeks.length/2)] : null;
  lines.push(`the race from sixty-two, 80 trials: retired ${race.retired} · died ${race.died} · neither in 400w ${race.neither}${medw!=null?` · handed on after a median of ${medw}w`:""}`);
  if(race.retired < 70)
    bad.push(`only ${race.retired} of 80 men who reached sixty-two at health 88 handed the house on alive `
      + `[measured 80 of 80]. The retirement gate wants \`age >= 62 && health >= 45 && d.heir && heirOfAge\` `
      + `and every term of it is satisfied here`);
  if(race.died > 4)
    bad.push(`${race.died} of 80 men who reached sixty-two IN HEALTH went out through the death door `
      + `[measured 0 of 80]. #243's fourth phase — the widow as regent — was declined because a played `
      + `lanista never dies; if the death door now wins this race the item should be re-read`);

  lines.push(`driven at health 0: a succession raised ${death.succ?"yes":"NO"} (retire ${death.retire}) · wife legible ${death.wife?death.wifeName:"NO"} · boy ${death.boyAge}, under ${out.son} ${death.minor?"yes":"no"}`);
  if(death.threw) bad.push(`lanistaWeek threw driving the death door: ${death.threw}`);
  if(!death.succ || death.retire !== false)
    bad.push(`a lanista at health 0 with an heir named raised ${death.succ?"a RETIREMENT":"no succession"} — `
      + `the death door is shut, and arm 2's zero would be a fact about this fixture rather than about the game`);
  if(!(death.wife && death.minor))
    bad.push(`the week the lanista died, a wife and a boy of ${death.boyAge} were standing and the state read `
      + `wife=${death.wife} minor=${death.minor} — the widow-and-minor a regency needs is not legible at the death, `
      + `so #243's zero cannot be trusted`);

  lines.push(`and with nobody named: over ${lone.over || "—"} · she is still in the slot ${lone.wife}`);
  if(lone.over !== "lanistaDied") bad.push(`a lanista died at health 0 with no heir and the run ended "${lone.over}"`);
  if(!lone.wife) bad.push(`the widow was cleared by the ending itself — nothing but \`succeed\` should empty the wife slot`);

  if(!after.ran) bad.push(`the handover arm never ran — no succession to take up`);
  else {
    lines.push(`the handover: generation ${after.gen0} → ${after.gen} · wife slot after ${after.wife} · she is on the forebear record as ${after.recorded || "—"} with ${after.kids} passed over`);
    if(after.wife) bad.push(`\`takeUpTheHouse\` left the dead man's wife in the new man's slot — \`marryReady\` wants it EMPTY, `
      + `and \`checks/domus.mjs\` holds the same ground`);
    if(!after.recorded) bad.push(`the widow was erased without being written to the forebear record — she is the one place `
      + `#243's family arc survives a succession`);
  }

  const share = play.weeks ? (100*play.wifeWeeks/play.weeks) : 0;
  lines.push(`played: ${play.wed}/${play.houses} houses married · a wife on ${play.wifeWeeks} of ${play.weeks} weeks = ${share.toFixed(1)}% · marryReady open ${play.readyWeeks}w · lanista deaths ${play.deaths}`);
  if(play.wed < 2)
    bad.push(`${play.wed} of ${play.houses} played houses ever took a wife [measured 15 of 16 at a median of week 35]. `
      + `#243's first three phases all hang off her being in the house`);
  if(share < 30)
    bad.push(`a wife stood on ${share.toFixed(1)}% of played weeks [measured 85%] — \`marryReady\` or \`resolveMatch\` has closed`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
