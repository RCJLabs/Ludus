/* WHAT IS NEW, AND WHERE — WHICH THE SCREEN NEVER SAID.

   The agenda has known what wants an answer and which of the six tabs the answer is on
   since v2.57.0, and a player's only way to find out was to open all six every week. So
   there are marks now: a count on the tab bar in the agenda's own urgency colours, a
   quieter dot when something has merely arrived, and the same pair on the folded panels
   one level down.

   The obvious way to build it is a `touch(d, "arena")` call wherever something arrives —
   twenty-odd call sites, every one a chance to forget, and a forgotten one is invisible
   because a dot that never lights looks exactly like a tab with nothing in it. That is the
   shape of the v2.59.0 paragon fault: one part of the week writing and another quietly
   undoing it. So freshness is derived from a signature over each tab's discrete
   player-facing state instead, and this check is what makes that safe:

   - every tab has a signature, and no two tabs share one, or a mark lights the wrong tab
   - the things that are news move the signature: a fresh card, a refreshed block, a man
     coming back fit, a letter from Rome, a patron's want, a man bought or buried
   - the things that are NOT news leave it alone — fatigue creeping up, unrest wandering,
     coin coming in. A signature that moves every week lights every tab every week, and
     dots that are always on are worse than no dots at all.
   - looking clears it, and only looking; a turned week that changed nothing does not
     re-light a tab
   - and the marks agree with the agenda: if the agenda has three things for the Familia
     at urgency 2, that is what the Familia tab wears. */

import { hasHandle } from "../harness.mjs";

export const name = "glance";
export const describe = "the tab bar says what is new and where, and only when it is";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const R = {};

    const house = (seed)=>{
      const d = A.newGameState("Gl","clean",seed,null);
      d.gold = 9000; d.fame = 900; d.week = 30;
      d.patrons = [{ id:1, name:"Magistrate", rank:"magistrate", favor:60, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      for(let i=0;i<4;i++){ const m = A.genGladiator(d, 72); m.id=d.nextId++; m.status="active";
        m.mine=true; m.kit=A.defaultKit(m.cls); m.wins=4; m.fatigue=0; m.lastFought=-9;
        d.gladiators.push(m); }
      for(const k of A.TAB_KEYS) A.markSeen(d, k);        /* the player has looked at everything */
      return d;
    };

    /* ---- 1. six tabs, six signatures, and none of them the same ---- */
    { const d = house("GL_SIG");
      const sigs = {}; for(const k of A.TAB_KEYS) sigs[k] = A.tabSig(d, k);
      const empty = A.TAB_KEYS.filter(k=>!sigs[k]);
      const dupes = [];
      for(let i=0;i<A.TAB_KEYS.length;i++) for(let j=i+1;j<A.TAB_KEYS.length;j++)
        if(sigs[A.TAB_KEYS[i]] === sigs[A.TAB_KEYS[j]]) dupes.push(`${A.TAB_KEYS[i]}=${A.TAB_KEYS[j]}`);
      R.sigs = { tabs:A.TAB_KEYS.length, empty, dupes,
        clean: A.TAB_KEYS.filter(k=>A.tabFresh(d,k)) }; }

    /* ---- 2. what counts as news marks the tab ----
       Judged on `tabFresh` — the thing the player actually sees — and NOT on whether the
       signature differs from what it was before the act. Three of these go there and back:
       a man is laid up and comes good again, the altar is used and comes off its rest. The
       signature ends where it started while what was last SEEN sits in between, so a
       before/after comparison called them all failures when the mark was lighting
       correctly. What was last seen is the only baseline that means anything. */
    const moves = (label, tab, act)=>{
      const d = house("GL_"+label.replace(/\W/g,""));
      act(d);
      const others = A.TAB_KEYS.filter(k=>k!==tab && A.tabFresh(d,k));
      return { label, tab, fresh: A.tabFresh(d, tab), others,
        seen: ((d.seen||{})[tab]||"").slice(0,28), now: A.tabSig(d, tab).slice(0,28) };
    };
    R.news = [
      /* the bill is drawn every third week, so a probe that calls makeGames on whatever
         week it happens to be sitting on gets nothing back and reads "the mark never
         lights for a fresh card" */
      moves("a fresh card is drawn", "arena", d=>{
        d.games = null; A.markSeen(d, "arena");
        for(let i=0;i<4 && !d.games; i++){ d.week++; A.makeGames(d); } }),
      moves("the block is refreshed", "market", d=>A.makeMarket(d)),
      moves("a man is bought", "men", d=>{ A.makeMarket(d);
        const m = (d.market||[]).find(x=>x.price <= d.gold); if(m) A.buyFromBlock(d, m.id, null); }),
      moves("a man is laid up", "men", d=>{ A.activeG(d)[0].injury = { kind:"gash", weeks:3, sev:2 }; }),
      moves("a man comes back fit", "men", d=>{ const g = A.activeG(d)[0];
        g.injury = { kind:"gash", weeks:3, sev:2 }; A.markSeen(d, "men"); g.injury = null; }),
      moves("a letter comes from Rome", "villa", d=>{ d.flags.primusHeld = 1;
        d.fame = A.romeBar(d) + 500;
        d.patrons = [{ id:1, name:"A senator", rank:"senator", favor:85, want:null, since:0, served:0, slighted:0 }];
        A.recomputeFavor(d); A.markSeen(d, "villa"); A.offerRome(d); }),
      moves("a patron asks for something", "villa", d=>{ d.patrons[0].want = { kind:"party", due:d.week+6 }; }),
      moves("the altar comes off its rest", "villa", d=>{ A.makeOffering(d, "mars");
        d.blessing = null; A.markSeen(d, "villa"); d.lastOffering = d.week - A.OFFERING_COOL; }),
      moves("a wing goes up", "ludus", d=>A.buildUp(d, "balneae")),
      moves("a work is begun", "ludus", d=>{ d.gold = 90000;
        const k = A.ALL_WORK_KEYS.find(x=>A.workOpen(d,x) && !A.workOn(d,x) && !A.workDone(d,x));
        if(k) A.beginWork(d, k); }),
      moves("steel starts to go", "armory", d=>{ const g = A.activeG(d)[0];
        const bought = Object.keys(A.GEAR).find(x=>{ const it=A.GEAR[x];
          return it.slot==="weapon" && !it.stock && it.price>0 && it.price < 900; });
        if(bought){ A.buyGearItem(d, bought); A.equipOne(d, g.id, "weapon", bought);
          A.markSeen(d, "armory"); g.wear = g.wear||{}; g.wear.weapon = 6; } }),
      moves("a man is buried", "men", d=>{ const g = A.activeG(d)[0]; g.status = "dead";
        d.fallen = (d.fallen||[]).concat([{ name:g.name, week:d.week }]); }),
    ];

    /* ---- 3. and what is NOT news leaves it alone ----
       This is the half that keeps the marks worth looking at. A signature that reads
       anything continuous lights its tab every single week for four hundred weeks. */
    const still = (label, act)=>{
      const d = house("GL_S"+label.replace(/\W/g,""));
      act(d);
      return { label, lit: A.TAB_KEYS.filter(k=>A.tabFresh(d,k)) };
    };
    R.quiet = [
      still("fatigue creeping up", d=>{ for(const g of A.activeG(d)) g.fatigue = 44; }),
      still("unrest wandering", d=>{ d.unrest = 38; }),
      still("coin coming in", d=>{ d.gold += 4000; }),
      still("fame climbing", d=>{ d.fame += 2500; }),
      still("morale sagging", d=>{ for(const g of A.activeG(d)) g.morale = 41; }),
      still("a week of nothing at all", d=>{ d.pendingEvent = null;
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "rest");
        /* the card and the block genuinely do change on a turned week; the point here is
           that the tabs which had no arrival on them stay dark */
        try { A.endWeek(d); } catch(e){} }),
    ];

    /* ---- 4. looking clears it, and only looking ---- */
    { const d = house("GL_SEEN");
      d.games = null; A.markSeen(d, "arena");
      for(let i=0;i<4 && !d.games; i++){ d.week++; A.makeGames(d); }
      const litBefore = A.tabFresh(d, "arena");
      A.markSeen(d, "arena");
      const litAfter = A.tabFresh(d, "arena");
      /* looking at one tab must not clear another */
      A.makeMarket(d);
      const marketStillLit = A.tabFresh(d, "market");
      A.markSeen(d, "arena");
      const marketAfterLookingElsewhere = A.tabFresh(d, "market");
      R.seen = { litBefore, litAfter, marketStillLit, marketAfterLookingElsewhere }; }

    /* ---- 5. the marks agree with the agenda ---- */
    { const d = house("GL_MARK");
      d.unrest = 74; d.gold = 30000;                        /* the cells, loudly */
      for(const g of A.activeG(d).slice(0,2)) g.injury = { kind:"gash", weeks:3, sev:2 };
      d.piety = 8;
      const items = A.agenda(d), m = A.tabMarks(d);
      const byTab = {};
      for(const it of items) byTab[it.tab] = (byTab[it.tab]||[]).concat([it.urgency]);
      R.marks = { tabs:Object.keys(m).length,
        rows: A.TAB_KEYS.map(k=>({ tab:k, n:m[k].n, urg:m[k].urg, fresh:m[k].fresh,
          realN:(byTab[k]||[]).length, realUrg:Math.max(0, ...(byTab[k]||[0])) })) }; }

    /* ---- 6. the feast and the rung, which the agenda never mentioned ---- */
    { const say = d => A.agenda(d).map(x=>({ u:x.urgency, t:x.tab, l:x.label, s:x.sub }));
      const cells = house("GL_FEAST"); cells.unrest = 58; cells.gold = 30000;
      const calm  = house("GL_CALM");  calm.unrest = 12;  calm.gold = 30000;
      const broke = house("GL_BROKE"); broke.unrest = 58; broke.gold = 40;
      const rung  = house("GL_RUNG");  rung.gold = 30000; rung.fame = 3000;
      rung.patrons = [{ id:1, name:"P", rank:"senator", favor:90, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(rung);
      /* the rung wants a full census as well as the fame and the favour — riseNeed reads
         four things and a probe setting two of them measures nothing */
      rung.rise = { rank:0, standing:100 };
      for(let i=0;i<200 && !A.canClaimRise(rung); i++){ rung.gold += 2000; rung.fame += 200; }
      R.can = {
        feast: say(cells).filter(x=>/feast/i.test(x.l)),
        calm:  say(calm).filter(x=>/feast/i.test(x.l)).length,
        broke: say(broke).filter(x=>/feast/i.test(x.l)).length,
        rung:  say(rung).filter(x=>/rung|there to be taken/i.test(x.l)),
        canClaim: A.canClaimRise(rung) }; }

    /* ---- 7. the folded panels one level down ----
       Kept as functions of the save rather than conditions inside the JSX, so this can ask
       what each panel would wear. Every one from both sides: the state that lights it, and
       a state that must leave it dark. */
    { const mk = (key, on, off)=>{
        const a = house("GL_M"+key), b = house("GL_N"+key);
        on(a); if(off) off(b);
        return { key, lit: A.sectMark(a, key), dark: A.sectMark(b, key) };
      };
      R.sect = [
        mk("cells",  d=>{ d.unrest = 74; }, d=>{ d.unrest = 12; }),
        mk("feast",  d=>{ d.unrest = 58; d.gold = 30000; }, d=>{ d.unrest = 58; d.gold = 20; }),
        mk("temple", d=>{ d.piety = 8; }, d=>{ d.piety = 55; A.makeOffering(d, "mars"); }),
        mk("rome",   d=>{ d.flags.primusHeld = 1; d.fame = A.romeBar(d)+500;
          d.patrons = [{ id:1, name:"S", rank:"senator", favor:85, want:null, since:0, served:0, slighted:0 }];
          A.recomputeFavor(d); }, d=>{}),
        mk("collegium", d=>{ d.gold = 5000; }, d=>{ A.foundCollegium(d); }),
        mk("rites",  d=>{ d.unburied = [{ id:1, name:"Somebody", week:d.week }]; }, d=>{}),
        mk("block",  d=>{ const g = A.makeParagon(d); d.market = [g, ...(d.market||[])]; }, d=>{}),
        /* the rung wants four things at once, so walk a house up to it rather than
           setting two of them and measuring nothing */
        mk("standing", d=>{ d.rise = { rank:0, standing:100 }; d.gold = 6000; d.fame = 900;
          for(let i=0;i<200 && !A.canClaimRise(d); i++){ d.gold += 2000; d.fame += 200; } }, d=>{}),
      ];
      R.sectKeys = Object.keys(A.SECT_MARK); }

    /* ---- 8. and none of it survives a save/load ---- */
    { const d = house("GL_SAVE");
      d.games = null; A.makeGames(d);
      const lit = A.tabFresh(d, "arena");
      const round = A.migrate(JSON.parse(JSON.stringify(d)));
      R.save = { lit, keptSeen: !!round.seen && Object.keys(round.seen).length > 0,
        sameAfter: A.tabFresh(round, "arena") === lit }; }

    return R;
  });

  const lines = [], fails = [];
  lines.push(`${out.sigs.tabs} tabs, ${out.sigs.tabs - out.sigs.empty.length} with a signature, ${out.sigs.dupes.length} pairs sharing one`);
  lines.push("what counts as news:");
  for(const n of out.news)
    lines.push(`   ${n.fresh ? "✓" : "✗"} ${n.label.padEnd(28)} → ${n.tab}${n.others.length ? `  (also lit ${n.others.join(",")})` : ""}`);
  lines.push("and what does not:");
  for(const q of out.quiet)
    lines.push(`   ${q.lit.length ? "✗" : "✓"} ${q.label.padEnd(28)} ${q.lit.length ? `lit ${q.lit.join(",")}` : "left every tab dark"}`);
  lines.push(`looking clears it: lit ${out.seen.litBefore} → ${out.seen.litAfter}; looking at the arena left the market ${out.seen.marketAfterLookingElsewhere ? "still lit" : "CLEARED TOO"}`);
  lines.push("the marks against the agenda:");
  for(const r of out.marks.rows)
    lines.push(`   ${r.tab.padEnd(7)} shows ${r.n} at urgency ${r.urg}${r.fresh?" · new":""}  (agenda has ${r.realN} at ${r.realUrg})`);
  lines.push(`the feast: ${out.can.feast.map(x=>`[${x.u}] ${x.l} — ${x.s}`).join("; ") || "NOT MENTIONED"}`);
  lines.push(`   quiet cells ${out.can.calm ? "STILL NAGGED" : "silent"} · a house that cannot pay for one ${out.can.broke ? "STILL OFFERED IT" : "silent"}`);
  lines.push(`the rung: ${out.can.rung.map(x=>`[${x.u}] ${x.l} — ${x.s}`).join("; ") || (out.can.canClaim ? "NOT MENTIONED" : "none claimable")}`);

  /* ---- a signature each, and no two alike ---- */
  if(out.sigs.empty.length)
    fails.push(`${out.sigs.empty.join(", ")} — no signature at all, so nothing on those tabs can ever be new`);
  if(out.sigs.dupes.length)
    fails.push(`${out.sigs.dupes.join(", ")} share a signature — a mark would light the wrong tab`);
  if(out.sigs.clean.length)
    fails.push(`${out.sigs.clean.join(", ")} are marked new on a house that has just looked at all six`);

  /* ---- news moves it ---- */
  for(const n of out.news){
    if(!n.fresh)
      fails.push(`${n.label} left the ${n.tab} tab unmarked — last seen "${n.seen}", now "${n.now}", so a player has no way to know it happened`);
    if(n.others.length > 2)
      fails.push(`${n.label} lit ${n.others.length} other tabs (${n.others.join(",")}) — the signatures are reading each other's state`);
  }

  /* ---- and drift does not ---- */
  for(const q of out.quiet){
    if(q.label === "a week of nothing at all") continue;    /* a turned week may bring a card */
    if(q.lit.length)
      fails.push(`${q.label} lit ${q.lit.join(", ")} — a signature reading something continuous marks its tab new every week for ever, and dots that are always on are worse than none`);
  }

  /* ---- looking is what clears it ---- */
  if(!out.seen.litBefore) fails.push("a fresh card did not mark the arena new");
  if(out.seen.litAfter) fails.push("looking at the arena did not clear its mark");
  if(!out.seen.marketStillLit) fails.push("a refreshed block did not mark the market new");
  if(!out.seen.marketAfterLookingElsewhere)
    fails.push("looking at the arena cleared the market's mark as well — one markSeen is clearing every tab");

  /* ---- and the bar shows what the agenda actually has ---- */
  if(out.marks.tabs !== out.sigs.tabs) fails.push(`tabMarks returned ${out.marks.tabs} tabs for ${out.sigs.tabs}`);
  for(const r of out.marks.rows){
    if(r.n !== r.realN) fails.push(`the ${r.tab} tab would show ${r.n} against the agenda's ${r.realN}`);
    if(r.urg !== r.realUrg) fails.push(`the ${r.tab} tab would show urgency ${r.urg} against the agenda's ${r.realUrg}`);
  }
  if(!out.marks.rows.some(r=>r.n > 0))
    fails.push("a house with the cells near fire, two men laid up and no rites kept has nothing on any tab — the marks are not reading the agenda");

  /* ---- the two things you could simply do ---- */
  if(!out.can.feast.length)
    fails.push("cells past restless, 30,000d in the box, and the agenda does not mention the feast — this was the whole ask");
  else {
    if(out.can.feast[0].t !== "ludus") fails.push(`the feast line points at "${out.can.feast[0].t}"`);
    if(!/\d/.test(out.can.feast[0].s || "")) fails.push("the feast line does not say what it costs or who it reaches");
  }
  if(out.can.calm) fails.push("a house with quiet cells is told to throw a feast");
  if(out.can.broke) fails.push("a house that cannot afford a feast is told to throw one");
  if(out.can.canClaim && !out.can.rung.length)
    fails.push("a rung is there to be taken and the agenda says nothing — the stipend runs from the week you claim it");

  /* ---- and the panels inside a tab say which one it is ---- */
  lines.push("the folded panels:");
  for(const x of out.sect)
    lines.push(`   ${x.lit ? "✓" : "✗"} ${x.key.padEnd(10)} lit ${JSON.stringify(x.lit)} · dark ${JSON.stringify(x.dark)}`);
  for(const x of out.sect){
    if(!x.lit) fails.push(`the ${x.key} panel wears no mark in the state that is supposed to light it`);
    if(x.dark) fails.push(`the ${x.key} panel wears a mark (${JSON.stringify(x.dark)}) in a state where there is nothing to do — a mark that is always on is not a mark`);
  }
  { const covered = out.sect.map(x=>x.key), missing = out.sectKeys.filter(k=>!covered.includes(k));
    if(missing.length) fails.push(`${missing.join(", ")} are in SECT_MARK and nothing here drives them`); }

  /* ---- and it survives being written down ---- */
  if(!out.save.keptSeen) fails.push("the last-looked signatures do not survive a save — every tab lights up on load");
  if(!out.save.sameAfter) fails.push("a save/load round trip changed which tabs are marked new");

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
