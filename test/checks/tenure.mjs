/* THE AGE THAT OPENED RETIREMENT WAS THE AGE THAT KILLED HIM

   `lanistaWeek`'s retirement door wants `L.age >= 62 && L.health >= 45`, so the design plainly
   intends a healthy sixty-two-year-old to exist. The age drain made him impossible: 0.045 a week per
   year over 42, with no ceiling, which is LINEAR in rate and therefore quadratic in cumulative cost.
   A man aging 43 → 62 pays about 170 points of health against a mend of 0.06 a week — 21 over the
   same span — from a start of `ri(78,92)`. He is at zero long before he is sixty-two.

   MEASURED (`probes/heirs.mjs`, 16 houses × 520 weeks, before and after):

       arm                      gate held    of those who reached 62,     his health
                                (weeks)      how many handed the house on    floor
       reference, onset 42          11            2 of 2                     68.5
       started at 58, onset 42      24           10 of 12                     0.0
       started at 58, onset 52     196           12 of 12                    57.7

   The middle row is the fault: 881 weeks of being sixty-two-or-over and the gate holding on
   twenty-four of them, because by the time he is old enough his health has collapsed. The two terms
   of one gate pulled against each other, and the succession that did happen happened through the
   DEATH door — the lanista dropping dead — rather than the retirement the design wrote for it, where
   `oldAge` lives as "an ending you choose rather than one that is chosen for you".

   THE NOTE IN `lanistaWeek` RECORDS THIS BEING FOUND ONCE ALREADY: "succeed, takeUpTheHouse, the
   forebear record and the whole second generation were unreachable in ordinary play, by arithmetic
   rather than by bad luck", and the fix was to make retirement a second door. The door was added.
   Nothing made it passable.

   SO THE YEARS START TO TELL AT FIFTY-TWO. That is the whole change: the coefficient, the mend, the
   unrest and rebellion drains and the baths are untouched. What it does NOT do, and this is stated
   rather than glossed: it does not make more lanistae reach sixty-two. Under the reference player he
   still ends at a median age of 47 because the HOUSE dies at week 180, and the rate is 2 of 16 either
   way. How long a house lives is a different question and a different item.

   A CAP WAS TRIED FIRST AND WENT TOO FAR — ceiling the weekly drain at 0.18 got the same 196 weeks,
   and also put the drain permanently under what a man out-mends, so his health never fell below 71
   and he became effectively immortal. Arm 3 is that sabotage, standing.

   SIX ARMS. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "tenure";
export const describe = "a lanista can reach the age that opens retirement and still be well enough to take it";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"TENURE-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];

    /* a quiet house, so the only thing touching his health is the years */
    let tick = 0;
    const quiet = (age, health) => {
      /* A MOVING SEED. `newGameState` reseeds the one global R() from the seed word, so a fixture
         that names the same seed replays the SAME first draw every time — the retirement arm below
         asked for 300 rolls at 6% and got one roll three hundred times, reporting a door that never
         opens on a build where it opens fine. */
      const d = A.newGameState("Ten", "clean", `TEN-${age}-${health}-${tick++}`, null);
      d.week = 60; d.unrest = 10; d.rebellion = null;
      d.lanista = A.makeLanista(d);
      d.lanista.age = age; d.lanista.health = health;
      d.buildings = {};                      /* no baths, so the mend is the bare 0.06 */
      return d;
    };
    const runFor = (d, weeks) => { for(let i=0;i<weeks;i++){ try { A.lanistaWeek(d); } catch(e){ return e; }
      if(i % 18 === 17) d.lanista.age++; } return null; };

    /* ---- 1: the onset is a named constant, and it is where the years begin ---- */
    { if(typeof A.LAN_AGE_FROM !== "number") bad.push("LAN_AGE_FROM is not on the handle — the onset is a magic number again");
      const before = quiet(A.LAN_AGE_FROM - 1, 80), after = quiet(A.LAN_AGE_FROM + 8, 80);
      runFor(before, 18); runFor(after, 18);
      if(!(before.lanista.health > 80)) bad.push(`a lanista a year under the onset LOST health over a quiet year (${before.lanista.health.toFixed(1)}) — the mend should carry him`);
      if(!(after.lanista.health < 80)) bad.push(`a lanista eight years past the onset did not decline at all (${after.lanista.health.toFixed(1)}) — the years have stopped telling`);
      lines.push(`the onset is ${A.LAN_AGE_FROM}: a year under it he mends to ${before.lanista.health.toFixed(1)}, eight years over he falls to ${after.lanista.health.toFixed(1)}`);
    }

    /* ---- 2: THE INVARIANT. A man who reaches the retirement age is still well enough to take it ----
       This is the whole item. `lanistaWeek` wants age 62 AND health 45; if ageing from a normal start
       to 62 leaves him under 45 in a quiet house, the gate cannot be satisfied and the door is
       decoration. Aged from 40 at the top of the starting band and from 46 at the bottom. */
    { const rows = [];
      for(const start of [34, 40, 46]){
        const d = quiet(start, 85);
        const yrs = 62 - start;
        const threw = runFor(d, yrs * 18);
        if(threw){ bad.push(`lanistaWeek threw while ageing from ${start}: ${String(threw.message||threw).slice(0,80)}`); continue; }
        rows.push({ start, age:d.lanista.age, health:+d.lanista.health.toFixed(1) });
        if(d.lanista.age < 62) bad.push(`ageing from ${start} for ${yrs} years reached only ${d.lanista.age}`);
        if(!(d.lanista.health >= 45))
          bad.push(`a lanista who started at ${start} reaches 62 with health ${d.lanista.health.toFixed(1)} — under the 45 his own retirement gate asks for, so the two terms of one gate cannot both hold`);
      }
      lines.push(`aged to 62 in a quiet house: ${rows.map(x=>`from ${x.start} → health ${x.health}`).join(" · ")}`);
    }

    /* ---- 3: AND HE IS NOT IMMORTAL — the sabotage that a cap made, standing as an arm ----
       Ceilinged, the drain sits permanently under the 0.06 mend and he never goes down at all. */
    { const d = quiet(52, 85);
      const threw = runFor(d, 25 * 18);           /* into his late seventies */
      if(threw) bad.push(`lanistaWeek threw ageing into his seventies: ${String(threw.message||threw).slice(0,80)}`);
      else {
        if(!(d.lanista.health <= 0))
          bad.push(`a lanista aged to ${d.lanista.age} in a quiet house still holds health ${d.lanista.health.toFixed(1)} — the years no longer end him, so the death door and the lanistaDied ending are shut`);
        lines.push(`and he is not immortal: aged to ${d.lanista.age}, health ${Math.max(0,d.lanista.health).toFixed(1)}`);
      } }

    /* ---- 4: the other drains are untouched — a badly run house still ruins him ---- */
    { const calm = quiet(56, 80), hot = quiet(56, 80);
      hot.unrest = 75; hot.rebellion = { stage:2 };
      runFor(calm, 60); runFor(hot, 60);
      if(!(hot.lanista.health < calm.lanista.health - 10))
        bad.push(`a lanista running a house at unrest 75 with a rising is at ${hot.lanista.health.toFixed(1)} against a calm house's ${calm.lanista.health.toFixed(1)} — the unrest and rebellion drains have been softened along with the years, which is not what this changed`);
      lines.push(`a bad house still tells: calm ${calm.lanista.health.toFixed(1)} against unrest-and-rising ${hot.lanista.health.toFixed(1)} over 60 weeks`);
    }

    /* ---- 5: BOTH DOORS STILL OPEN, driven ---- */
    { /* the retirement door */
      let retired = 0, died = 0;
      for(let i=0;i<300 && retired < 1; i++){
        const d = quiet(62, 70);
        d.week = 6*18 + 4;                       /* past the year-6 gate */
        d.heir = { kind:"nephew", name:"Lucius" };
        try { A.lanistaWeek(d); } catch(e){}
        if(d.succession && d.succession.retire) retired++;
      }
      if(!retired) bad.push(`the retirement door did not open once in 300 weeks with every term of its gate satisfied`);
      /* the death door */
      { const d = quiet(70, 0.05);
        d.heir = { kind:"nephew", name:"Lucius" };
        try { A.lanistaWeek(d); } catch(e){}
        if(d.succession && !d.succession.retire) died++;
        else bad.push(`a lanista at health 0 with an heir named raised no succession — the death door is shut`);
      }
      /* and with nobody named, the run ends rather than silently continuing */
      { const d = quiet(70, 0.05);
        d.heir = null;
        try { A.lanistaWeek(d); } catch(e){}
        if(!(d.over && d.over.kind === "lanistaDied"))
          bad.push(`a lanista died at health 0 with no heir and the run did not end — over is ${d.over ? d.over.kind : "null"}`);
      }
      lines.push(`both doors: retirement opened ${retired ? "yes" : "NO"} · death raised a succession ${died ? "yes" : "NO"} · and ends the run when nobody is named`);
    }

    /* ---- 6: and the handover completes ---- */
    { const d = quiet(62, 70);
      d.week = 200; d.fame = 2000; d.gold = 5000;
      d.heir = { kind:"nephew", name:"Lucius Verres" };
      const gen0 = d.generation, fame0 = d.fame;
      let threw = null;
      try { A.succeed(d); } catch(e){ threw = String(e && e.message || e).slice(0,100); }
      if(threw) bad.push(`succeed threw: ${threw}`);
      else {
        if(!(d.generation > gen0)) bad.push(`the succession did not advance the generation`);
        if(!(d.forebears||[]).length) bad.push(`the handover recorded no forebear — the survey counts this and would read 0`);
        if(!(d.fame < fame0)) bad.push(`the heir kept every point of his forebear's fame (${d.fame} of ${fame0}) — fameKeep is not being applied`);
        if(!d.lanista || d.lanista.age > 62) bad.push(`the new lanista is ${d.lanista ? d.lanista.age : "(none)"} — the house has not actually changed hands`);
        lines.push(`the handover: generation ${gen0} → ${d.generation}, fame ${fame0} → ${d.fame}, the new man is ${d.lanista ? d.lanista.age : "?"}`);
      } }

    return { bad, lines };
  });

  bad.push(...r.bad);
  lines.push(...r.lines);
  return { pass: bad.length === 0, why: bad.join(" · "), lines };
}
