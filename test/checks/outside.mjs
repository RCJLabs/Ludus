/* A LIFE OUTSIDE THE WALL, AND THE BILL WHEN IT ENDS

   Phase queue item #239. `ASKS.woman` is the only place in this game where a lanista can grant a
   man something that exists past the gate: leave into the town on the days he is not fighting.
   What the grant WAS, in full: `g.flags = 1`. One write. That field was read in exactly one place
   in thirty-two thousand lines — this ask's own gate, to stop asking twice — and nowhere else.
   The man then died and the grant died with him, silently. It was the cheapest generous decision
   on the board, and the most consequential thing a player could say yes to was the one thing the
   game had no memory of at all.

   THE ITEM ASKED FOR FIVE PHASES. TWO SHIPPED. The other three were measured first
   (`probes/outside.mjs`, 16 houses x 400 weeks) and the measurement refused them:

     THE ASK FIRES ONCE IN 2,672 PLAYED WEEKS. 33 asks of any kind across 16 houses — one every 81
     weeks, reaching 7.4% of the 447 men who ever stood in the cells — and by kind, ASKS ACTUALLY
     FIRED (counts, not weights): burial 12, brother 10, match 9, **woman 1**. `askWeek` rolls at
     6%, picks one man, and stamps `d.flags.asked`, so a man gets at most one ask in his life about
     anything. `woman` loses that draw twice over: it is the lowest-weighted of the five (brother
     10, match 9, year 8, burial 7, woman 6) AND carries the strictest gate.

     A CHILD COULD NOT GROW UP IN TIME. Of the 33 men who ever passed this gate, the weeks they
     survived after passing it: p25 5, median 17, p75 36, p90 45, max 55. A child born to the grant
     would need something near 250 weeks to reach the gate himself. Phase 3's walk-on recruit misses
     by a factor of fifteen and phase 2 has seventeen weeks to narrate a childhood in.

     AND PHASE 4'S GUARDRAIL CANNOT BE BUILT WHERE THE ITEM PUT IT. It wanted the family to make a
     man a sharper POACH target, so the grant carried a liability. `poachTarget` requires
     `defiance >= 45 && !regardLoyal(g)`, and `regardLoyal` is `regardOf(g) >= 70`. The ask pays
     +18 regard: measured at the moment of the grant, that puts **100% of takers at or past 70**.
     Saying yes does not make a man easier to take away — it makes him permanently impossible to
     take away, out of every poach pool in the game. The item's own risk section says phases 2 and 3
     must not ship without 4, so none of the three ships.

   WHAT SHIPS is what the brief itself singled out — "the smallest phase and the one the whole brief
   is actually chasing" — plus the record-keeping that makes it legible:

     the object     `g.family = { name, since }` replaces `g.flags = 1` at identical numbers
     the memory     both answers route through `remember`, like the other four asks always did
     the name       visible on his card while he is alive, or the death line names a stranger
     the bill       `mournKin` chronicles who has to be told, at every door he can die through

   EIGHT ARMS, and the sixth is the one that matters: each of the five death doors is driven to a
   REAL corpse and the chronicle read, rather than trusting a comment that says they all call the
   same function. */
import { found, clearAll, installRope, forge, tab, settle } from "../harness.mjs";

export const name = "outside";
export const describe = "the leave a man is granted is on the record, and somebody has to be told when he dies";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"OUTSIDE-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    let tick = 0;

    /* a house, and a man the ask would take */
    const seat = (n, lvl) => {
      const d = A.newGameState("Outside", "clean", `OS-${tick++}`, null);
      d.week = 90; d.gold = 30000; d.gladiators = []; d.fame = 300; d.favor = 20;
      const men = [];
      for(let i=0;i<n;i++){
        const g = A.genGladiator(d, lvl[i]); g.id = d.nextId++;
        g.status = "active"; g.mine = true; g.kit = A.defaultKit(g.cls);
        g.wins = 8; g.losses = 2; g.pfame = 60; g.morale = 60; g.regard = 60;
        d.gladiators.push(g); men.push(g);
      }
      return { d, men };
    };
    const grant = (d, g, name) => { g.family = { name: name || "Vibia", since: d.week - 30 }; };
    const told  = d => (d.log||[]).slice(0, 25).filter(L=>/Vibia/.test(L.text||"")).map(L=>L.text);

    /* ---- 1: the gate reads the grant, and a refusal is not a grant ---- */
    { const { d, men } = seat(1, [40]);
      const g = men[0];
      const W = A.ASKS.woman;
      if(!W){ bad.push("ASKS.woman is gone"); }
      else {
        if(!W.need(d, g)) bad.push(`a man with ${g.wins} wins and ${A.regardOf(g)} regard is not asked at all — the gate has moved off the men it was written for`);
        W.yes(d, g);
        if(!g.family) bad.push("saying yes granted nothing — g.family was not set, so the whole feature is one dead write again");
        if(W.need(d, g)) bad.push("a man who was already let out is asked a second time — the gate is not reading the grant it wrote");

        /* and a REFUSAL must leave him askable: the old `g.flags = 1` was only ever set on yes,
           and the object has to keep that asymmetry or a "no" silently closes the door forever */
        /* HIGH REGARD ON PURPOSE. The first draft seated him at 60, the refusal took its -12, and
           the arm then reported "a no is being stored as a yes" — the gate wants 55 and he was at
           48. That is the ask's own gate working, not the grant leaking. */
        const { d:d2, men:m2 } = seat(1, [40]);
        m2[0].regard = 85;
        W.no(d2, m2[0]);
        if(m2[0].family) bad.push("saying no granted him a family anyway");
        if(!W.need(d2, m2[0])) bad.push("a man who was REFUSED can never be asked again — a no is being stored as a yes");
        lines.push(`the gate: yes closes it, no leaves it open`);
      } }

    /* ---- 2: both answers are on the record, in the man's own memory ---- */
    { const { d, men } = seat(2, [40, 40]);
      const [a, b] = men;
      const r0 = A.regardOf(a), s0 = A.regardOf(b);
      A.ASKS.woman.yes(d, a);
      A.ASKS.woman.no(d, b);
      const memA = (a.memory||[]).filter(m=>m.kind==="leave");
      const memB = (b.memory||[]).filter(m=>m.kind==="walled");
      if(!memA.length) bad.push("granting leave left nothing in the man's memory — the one thing he would count either way is the one thing his card cannot show");
      if(!memB.length) bad.push("refusing left nothing in the man's memory");
      if(!A.REGARD.leave || !A.REGARD.walled) bad.push("the two answers are not on the REGARD table, so his card has no words for them");
      if(A.REGARD.leave && !(A.REGARD.leave.n > 0)) bad.push(`granting leave is scored ${A.REGARD.leave.n} — a kindness that costs him regard`);
      if(A.REGARD.walled && !(A.REGARD.walled.n < 0 && A.REGARD.walled.bad)) bad.push(`keeping him behind the wall is scored ${A.REGARD.walled.n}${A.REGARD.walled.bad?"":", and not marked bad"}`);
      /* the numbers are the ones the ask always paid — this release moved them onto the table,
         it did not retune them, and a check that does not pin that lets the table drift for free */
      const dy = A.regardOf(a) - r0, dn = A.regardOf(b) - s0;
      if(dy !== 18) bad.push(`yes now pays ${dy} regard, not the 18 it always paid — the move onto REGARD was supposed to be a no-op on the numbers`);
      if(dn !== -12) bad.push(`no now costs ${dn} regard, not the -12 it always cost`);
      lines.push(`on the record: yes ${dy>0?"+":""}${dy} regard, no ${dn} — unchanged, and now in his memory`);
    }

    /* ---- 3: the woman is a real person, named, and stamped ---- */
    { const names = new Set(); let sinceOK = true, blank = 0;
      for(let i=0;i<60;i++){
        const { d, men } = seat(1, [40]);
        A.ASKS.woman.yes(d, men[0]);
        const f = men[0].family;
        if(!f || !f.name) { blank++; continue; }
        names.add(f.name);
        if(f.since !== d.week) sinceOK = false;
      }
      if(blank) bad.push(`${blank} of 60 grants produced no name at all`);
      if(!sinceOK) bad.push("the grant is not stamped with the week it was made, so the death line cannot say how long he had");
      if(names.size < 3) bad.push(`60 grants produced ${names.size} distinct name(s) — she is a constant, not a person`);
      for(const n of names) if(!A.HH_NAMES || !A.HH_NAMES.includes(n))
        bad.push(`"${n}" is not a name this world uses`);
      lines.push(`she is named: ${names.size} distinct over 60 grants`);
    }

    /* ---- 4: the death line fires, and only for a man who had somebody ---- */
    { const { d, men } = seat(2, [40, 40]);
      grant(d, men[0]);
      /* CAUGHT BY A SABOTAGE. Dropping the `gone.family` guard makes this call THROW rather than
         over-fire, and a throw inside p.evaluate takes every arm below it with it — which is how
         `blood.mjs` once lost three. The two calls this arm makes are held. */
      const safe = (dd, id) => { try { A.mournKin(dd, id, A.fullName(dd.gladiators.find(x=>x.id===id)), {});
        return null; } catch(e){ return String(e && e.message || e).slice(0, 120); } };
      const e1 = safe(d, men[0].id);
      if(e1) bad.push(`mourning a man with a family threw: ${e1}`);
      const said = told(d);
      if(!said.length) bad.push("a man with a family died and nothing was said — the grant is silent again, which is the entire defect this item was raised for");

      const { d:d2, men:m2 } = seat(2, [40, 40]);
      const e2 = safe(d2, m2[0].id);
      if(e2) bad.push(`mourning a man with NO family threw: ${e2} — the guard is gone`);
      if(told(d2).length) bad.push("a man with NO family produced the family line — it is firing on everybody");
      lines.push(`the bill: "${(said[0]||"").slice(0, 72)}..."`);
    }

    /* ---- 5: it reads how long he had her, and names her either way ---- */
    { const rows = [];
      for(const held of [0, 1, 8, 19, 20, 44]){
        const { d, men } = seat(2, [40, 40]);
        men[0].family = { name:"Vibia", since: d.week - held };
        A.mournKin(d, men[0].id, A.fullName(men[0]), {});
        const said = told(d);
        rows.push({ held, said: said[0] || "(nothing)" });
        if(!said.length){ bad.push(`no line at all for a man who had ${held} weeks of her`); continue; }
        if(!/Vibia/.test(said[0])) bad.push(`the line for ${held} weeks does not name her`);
        /* the long shape has to actually say the number, or `since` is decoration */
        if(held >= 20 && !new RegExp(`${held} weeks`).test(said[0]))
          bad.push(`a man who had ${held} weeks of her got a line that does not say so: "${said[0].slice(0,80)}"`);
      }
      const shapes = new Set(rows.map(x=>x.said.replace(/\d+/g,"#").slice(0,40)));
      if(shapes.size < 2) bad.push("every duration gets the identical sentence — `since` is being stored and not read");
      lines.push(`duration: ${shapes.size} shapes over ${rows.length} spans`);
    }

    /* ---- 6: EVERY DOOR. Driven to a real corpse, not asserted. ----
       The claim in the source is that all five resolvers a man of yours can die through call
       `mournKin`, so one line covers them all. That is a claim about five call sites in a 32,000
       line file and it is exactly the kind of thing that is true when written and false two
       releases later. Each door is opened here with a real fatal bout. */
    const door = (label, run, want) => {
      let n = 0, dead = 0, line = 0, err = null;
      for(let i=0; i<260 && dead < want; i++){
        try {
          const st = run();
          if(!st) { err = err || "could not build the bout"; break; }
          n++;
          if(st.men.some(m=>m.status === "dead")){ dead++; if(told(st.d).length) line++; }
        } catch(e){ err = err || String(e && e.stack || e).slice(0, 160); }
      }
      if(err) bad.push(`the ${label} door threw before it could be measured: ${err}`);
      else if(dead < want) bad.push(`only ${dead} of ${want} men died at the ${label} door in ${n} bouts — the arm cannot answer its own question`);
      else if(line < dead) bad.push(`${dead - line} of ${dead} deaths at the ${label} door said NOTHING about the woman waiting for him — that door does not call mournKin`);
      lines.push(`  ${label.padEnd(9)} ${line}/${dead} deaths told her`);
      return { label, n, dead, line, err };
    };
    const drive = (fn, args, at) => { let r = fn(...args);
      for(let k=0; r && r.crux && k<14; k++){ r.pending.beats = r.beats;
        const a = args.slice(); a[at] = r.pending; a[at+1] = "run"; r = fn(...a); }
      return r; };

    const doors = [
      door("bout", ()=>{ const st = seat(3, [16, 50, 50]); grant(st.d, st.men[0]);
        const o = A.makePitOffer(st.d, st.men[0], "sine"); if(!o) return null;
        drive(A.doFight, [st.d, st.men[0].id, o, "aggressive", null, null, null, "none"], 5);
        return st; }, 8),
      door("venatio", ()=>{ const st = seat(3, [16, 50, 50]); grant(st.d, st.men[0]);
        const bk = Object.keys(A.BEASTS).filter(k=>A.BEASTS[k].tier <= 1);
        const o = { id:st.d.nextId++, tier:1, festival:null, venatio:true, beast:bk[bk.length-1],
          grade:1.2, stakes:"venatio", purse:900 };
        drive(A.doVenatio, [st.d, st.men[0].id, o, "aggressive", null, null], 4);
        return st; }, 6),
      door("pair", ()=>{ const st = seat(3, [16, 18, 50]); grant(st.d, st.men[0]); grant(st.d, st.men[1]);
        const p1 = A.pickRivalOpp(st.d, 2), p2 = A.pickRivalOpp(st.d, 2);
        const o = { id:st.d.nextId++, tier:2, festival:null, pair:true, opps:[p1.opp, p2.opp],
          oppRefs:[p1.ref, p2.ref], stakes:"sine", purse:1400 };
        drive(A.doPairFight, [st.d, [st.men[0].id, st.men[1].id], o, "aggressive", null, null], 4);
        return st; }, 6),
      door("melee", ()=>{ const st = seat(3, [16, 18, 20]); st.men.forEach(m=>grant(st.d, m));
        const field = []; for(let k=0;k<5;k++) field.push(A.pickRivalOpp(st.d, 2).opp);
        const o = { id:st.d.nextId++, tier:2, festival:null, melee:true, field, stakes:"melee", purse:1600 };
        drive(A.doMelee, [st.d, [st.men[0].id, st.men[1].id], o, null, null, "aggressive"], 3);
        return st; }, 6),
      door("primacy", ()=>{ const st = seat(2, [62, 68]); st.men.forEach(m=>grant(st.d, m));
        st.d.primus = { mine:true, gid:st.men[0].id, name:st.men[0].name, nick:st.men[0].nick,
          cls:st.men[0].cls, since:st.d.week - 10, defences:1 };
        drive(A.doPrimacy, [st.d, st.men[0].id, st.men[1].id, null, null], 3);
        return st; }, 6),
    ];

    /* ---- 7: and the grant survives a save ---- */
    { const { d, men } = seat(1, [40]);
      A.ASKS.woman.yes(d, men[0]);
      const back = A.clone(d);
      const g2 = back.gladiators.find(x=>x.id === men[0].id);
      if(!g2 || !g2.family || g2.family.name !== men[0].family.name)
        bad.push("the grant does not survive a save — a man reloads with nobody in the town");
      if(!g2 || !g2.family || g2.family.since !== men[0].family.since)
        bad.push("the week of the grant does not survive a save");
    }

    return { bad, lines, doors };
  });

  bad.push(...r.bad);
  lines.push(...r.lines);
  lines.push(`  ${r.doors.reduce((s,x)=>s+x.dead,0)} real deaths driven across ${r.doors.length} doors`);

  /* ---- 8: AND THE NAME IS ON HIS CARD WHILE HE IS ALIVE ----
     A grant nobody can see is the defect this item was raised for, one layer up. #234 shipped a
     button that was never wired to anything and eight headless arms walked straight past it, so a
     surface added by a release is opened here rather than reasoned about. */
  await forge(p, (A) => {
    const d = A.newGameState("Vettius", "clean", "OUTSIDE-UI", null);
    d.week = 90; d.gold = 9000;
    const g = d.gladiators.filter(x=>x.status === "active")[0];
    if(g){ g.family = { name:"Naevia", since: d.week - 30 }; A.remember(d, g, "leave"); }
    return { plant:d, out:{ who: g ? g.name : null } };
  });
  await tab(p, "men");
  await settle(p);
  const press = (rx, all) => p.evaluate(([r, a])=>{
    const hits = [...document.querySelectorAll("button,[role=button],summary,div")]
      .filter(el => new RegExp(r, "i").test(el.textContent||"") && (el.textContent||"").length < (a||90));
    const t = hits[hits.length-1];
    if(!t || !t.click) return false; t.click(); return true;
  }, [rx, all]);
  /* the gatekeeper's tutorial sits over the roster on a fresh house and eats the click */
  await press("I know my trade"); await settle(p);
  const opened = await press("^Balarus", 300); await settle(p);
  await press("^\\s*STANDING\\s*$"); await settle(p);
  const unfolded = await press("WHAT HE MAKES OF YOU", 160); await settle(p);
  const said = await p.evaluate(()=>{ const t = document.body.innerText || "";
    return { name: /Her name is Naevia/.test(t),
      leave: /has leave into the town on the quiet days/i.test(t),
      memory: /let him out of the gate on the quiet days/i.test(t) };
  });
  lines.push(`through the screen: opened his card (${opened}) and unfolded it (${unfolded})`);
  lines.push(`  it says he has leave (${said.leave}) · names her (${said.name}) · and the memory row is there (${said.memory})`);
  if(!opened) bad.push("could not open the man's card at all — the DOM arm cannot answer its own question");
  if(!said.leave || !said.name)
    bad.push("his card says nothing about the leave he was granted or who is waiting — the death line will name a stranger, which is this item's own defect one layer up");
  if(!said.memory)
    bad.push(`the grant left no row in "What he makes of you" — REGARD.leave is on the table but the card never shows it`);

  return { pass: bad.length === 0, why: bad.join(" · "), lines };
}
