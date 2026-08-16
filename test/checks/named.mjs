/* #137. The fighter-nemesis (d.nemesis) had one designed payoff — beat the name on the sand for
   morale, unrest and fame — and it fired on 1-2% of episodes, because ludus.jsx let a pit man be
   named nemesis with a synthetic house ({name:f.house, fighters:d.circuit}, a SMALL_HOUSES name)
   and `nemesisWeek`'s lookup only knew the five rival houses. It concluded the man was gone and
   unmade him THE SAME WEEK he was named — 99-100% of circuit-born nemeses on every measured seed —
   and a hated usurper evicted a standing rival nemesis on the way through, so 82-87% of the real
   episodes died with them, in silence. One clear per 5 weeks against one VISIBLE episode per 16:
   most nemeses lived and died between two week-end reads, which is why no snapshot instrument ever
   saw it (test/probes/named.mjs measured the endings; test/probes/ghost.mjs trapped the assignment).

   Fixed, the eviction rule then over-fired — every pit loss to any man who had ever killed one of
   yours re-dealt the title, one hand-over per 4.4 weeks — so a hated name now holds against another
   killer and yields only to the sand or the man leaving it. After both halves: one episode per
   47-60 weeks, sand 36-38%, told 32-38%, silent 0-1% (was 81%).

   This check holds the rules, not the trajectory (#136): a nemesis may be cleared only when the man
   is genuinely gone from every roster and the circuit, whatever week that happens. */
export const name = "named";
export const describe = "a nemesis survives the week that names him, holds against the next killer, and the sand settles it";

export async function run({ p }){
  const has = await p.evaluate(() => !!window.__LVDVS);
  if(!has)
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const fin = (fn,args) => { try { return fn(...args); } catch(e){ return { threw: String(e) }; } };
    /* the game's own call shape at the pit-bout aftermath — the synthetic house is the point */
    const nameCirc = (d, f) => A.nemesisCheck(d, { name:f.house, grudge:0, fighters:d.circuit }, f);
    const anywhere = (d, fid) =>
      (d.circuit||[]).some(x=>x.id===fid) ||
      (d.rivals||[]).some(h=>h.fighters.some(x=>x.id===fid));
    const logNames = (d, nm) => [...(d.log||[]), ...(d.kept||[])].some(L=>(L.text||"").includes(nm));

    /* ---- 1. a pit man who has beaten the house twice gets the name ---- */
    {
      const d = A.newGameState("Nm", "clean", "NAMED-1", null);
      const C = d.circuit[0]; C.beatYou = 2;
      nameCirc(d, C);
      if(!d.nemesis || d.nemesis.fid !== C.id) bad.push("a circuit man at beatYou 2 was not named");
      else if(d.nemesis.hated) bad.push("beatYou 2 with no kill read as hated");
      else lines.push(`named: ${C.name} of ${C.house}, off the circuit, not hated`);

      /* ---- 2. the #137 regression: he survives the weeks, until he genuinely leaves ---- */
      let present = 0, clearedWhilePresent = null;
      for(let w=0; w<8; w++){
        const fid = d.nemesis && d.nemesis.fid;
        A.endWeek(d); d.pendingEvent = null;
        if(fid === C.id){
          if(anywhere(d, C.id)){ if(d.nemesis && d.nemesis.fid===C.id) present++;
            else { clearedWhilePresent = d.week; break; } }
          else break;   /* the circuit's own lottery took him — a legal exit, not this fault */
        }
      }
      if(clearedWhilePresent != null)
        bad.push(`the nemesis was unmade in week ${clearedWhilePresent} while still standing on the circuit — the #137 fault`);
      else if(present < 1)
        bad.push("the persistence rule was never exercised: the man left the circuit before one week passed");
      else lines.push(`stood ${present} week${present===1?"":"s"} while on the circuit, never unmade in place`);

      /* ---- 3. a killer takes the title from a man who merely beat you ---- */
      const K = d.circuit.find(x=>x.id!==C.id);
      K.killedYours = 1;
      if(d.nemesis && d.nemesis.fid===C.id){
        nameCirc(d, K);
        if(!d.nemesis || d.nemesis.fid !== K.id) bad.push("a killer failed to take the title from a non-hated nemesis");
        else if(!d.nemesis.hated) bad.push("the killer's title is not hated");
        else lines.push(`evicted: ${K.name} (a killer) takes the name from ${C.name}`);
      }
      /* ---- 4. and holds it against the NEXT killer — the churn damper ---- */
      if(d.nemesis && d.nemesis.hated){
        const K2 = d.circuit.find(x=>x.id!==K.id && x.id!==(d.nemesis&&d.nemesis.fid));
        if(K2){ K2.killedYours = 1;
          const held = d.nemesis.fid;
          nameCirc(d, K2);
          if(!d.nemesis || d.nemesis.fid !== held)
            bad.push("a hated nemesis yielded the title to the next killer — the 4.4-week churn");
          else lines.push(`held: the next killer (${K2.name}) does not re-deal a hated name`);
        }
      }
      /* ---- 5. when he does leave, the cells are told ---- */
      if(d.nemesis){
        const n = d.nemesis;
        const i = d.circuit.findIndex(x=>x.id===n.fid);
        if(i >= 0){
          const nm = d.circuit[i].name;
          d.circuit[i] = A.genOpponent(1, 40); d.circuit[i].id = d.nextId++;
          d.circuit[i].house = "Nola"; d.circuit[i].beatYou = 0;
          A.endWeek(d); d.pendingEvent = null;
          if(d.nemesis && d.nemesis.fid===n.fid) bad.push("the nemesis outlived his own disappearance from every roster");
          else if(!logNames(d, nm)) bad.push(`he vanished from the panel with no line — the chronicle never says ${nm} is gone`);
          else lines.push(`gone quietly from the circuit, and the chronicle says so`);
        }
      }
    }

    /* ---- 6. a rival's man keeps the old behaviour: named, stands, and his house is his home ---- */
    {
      const d = A.newGameState("Nm2", "clean", "NAMED-2", null);
      const h = d.rivals[0], f = h.fighters[0]; f.beatYou = 2;
      A.nemesisCheck(d, h, f);
      if(!d.nemesis || d.nemesis.fid !== f.id) bad.push("a rival's man at beatYou 2 was not named");
      else {
        A.endWeek(d); d.pendingEvent = null;
        if(!d.nemesis && anywhere(d, f.id)) bad.push("a rival-house nemesis was unmade while still on his roster");
        else lines.push(`a rival's man is named and stands the week, as before`);
      }
    }

    /* ---- 7. the payoff: beat the name at the pit and the house feels it ---- */
    {
      let settled = null;
      for(let t=0; t<6 && !settled; t++){
        const d = A.newGameState("Nm3", "clean", "NAMED-3-"+t, null);
        const g = A.activeG(d)[0];
        A.STATS.forEach(k=>{ g[k] = 96; }); g.morale = 90; g.fatigue = 0;
        const C = d.circuit.slice().sort((a,b)=>A.STATS.reduce((s,k)=>s+a[k],0)-A.STATS.reduce((s,k)=>s+b[k],0))[0];
        C.beatYou = 2; C.injury = null;
        nameCirc(d, C);
        if(!d.nemesis || d.nemesis.fid!==C.id) continue;
        const other = A.activeG(d).find(x=>x.id!==g.id);
        const moraleWas = other ? other.morale : null;
        const o = A.makePitOffer(d, g, "standard", C.id);
        if(!o || !o.oppRef || o.oppRef.fid!==C.id) { bad.push("makePitOffer would not put the nemesis on the card"); break; }
        /* the win is read off the game's own record (his wins counter), not off the return —
           `.unfinished` and friends are the wrong layer's fields, which `probe` polices */
        const winsWas = g.wins;
        let r = fin(A.doFight, [d, g.id, o, "measured", null, null, null, "none"]);
        let guard = 0;
        while(r && r.crux && guard++ < 5){
          const pd = r.pending; pd.beats = r.beats;
          r = fin(A.doFight, [d, g.id, o, "measured", null, pd, null, "none"]);
        }
        if(g.wins > winsWas){
          settled = { cleared: !d.nemesis,
            told: logNames(d, "was beaten in front of everyone") || logNames(d, "is dead on your sand"),
            lifted: other ? (other.morale > moraleWas) : true };
        }
      }
      if(!settled) bad.push("six tries at 96 stats and the pit never gave a win — the settle path is unexercised");
      else {
        if(!settled.cleared) bad.push("the nemesis was beaten on the sand and the name did not come down");
        if(!settled.told) bad.push("the settle wrote no line");
        if(!settled.lifted) bad.push("the settle moved nobody's morale");
        if(settled.cleared && settled.told && settled.lifted)
          lines.push("beaten at the pit: the name comes down, the line is written, the cells feel it");
      }
    }

    return { bad, lines };
  });

  return { pass: out.bad.length===0,
    why: out.bad.length ? out.bad.join("; ") : null,
    lines: out.lines };
}
