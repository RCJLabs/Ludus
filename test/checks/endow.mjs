/* WHAT THE STONE SAYS IT DOES, AND WHAT IT DOES

   Phase queue item #241, "Endow, Actually". Its premise is confirmed and its engine is refused on
   its own falsifier, and the fault it names is the second of its kind in the same table.

   THE DEFECT. `MONUMENTS.endow` costs 44,000 denarii and three years, and its blurb promised "games
   that hold themselves, funded out of a sum so large the interest alone pays for blood every year
   after you are gone" — a recurring, self-staging festival. Grep the whole 32,000-line source for
   the string "endow" and there is ONE hit: the table entry. It never calls `festivalNow`, never
   touches `CALENDAR`, never calls `makeGames`. No game has ever been staged. Three rows above it
   the tomb's blurb was corrected by #140 for crediting an effect to the cells that `collSoften`
   produces — "a claim about the state that the state does not hold". This one did not misattribute
   an effect; it advertised a mechanism that does not exist.

   MEASURED (`probes/endow.mjs`, three arms over two seeds, 96 campaign runs of up to 520 weeks):

     ENDOW WAS 86,500 DENARII DEEP when #241 was measured. The five WORKS cost 42,500 between
     them, `monuReady` gates the monument tier behind finishing all five, and endow then asked
     44,000 more. Across the 96 runs the four monuments were finished **1 colossus, 1 endow,
     0 arena, 0 capua** — and `capua`, which the source calls "the last sentence in the book", had
     never been built by anything at all. An arm that commissions endow the moment it can found the
     tier open on **377 house-weeks** and the money there on **one** of them. So the festival was
     content nobody reached, and the item's own falsifier for phases 2-4 fired.
     THOSE PRICES WERE CUT IN v3.196.0 — 11,000 of works and 8,000/12,000/20,000/45,000 of
     monuments, sized to the measured survivor peak. This check reads every cost off the table, so
     it follows the retune rather than pinning the old numbers.

     AND ITS PHASE 3 IS BACKWARDS. It proposed dropping or shrinking the flat `acclaim 1.1` as
     over-valued. `acclaimWeek` drags `d.acclaim` toward `acclaimTarget(d)` — 10% of the gap up, 3%
     down, less a 0.15 drift — so the tick is held against a spring rather than banked, and the
     fixed point is where 1.1 = 0.03*gap + 0.15, about 32 points. Measured on played houses it holds
     **+30 (p50)**, worth +44 points of plain acclaim. It is the strongest perk in the table.

     THE ONE PROMISE THAT WAS TRUE is the one the item doubted: `succeed()` never touches `d.works`,
     so a finished monument, one still going up, and the perk all cross the handover. Verified by
     running the succession rather than by reading it.

   WHAT SHIPS is the text, which is #140's fix applied one entry down — and this check, which guards
   the half of every such claim that can silently drift: the NUMBER. Every `say` in WORKS and
   MONUMENTS states its own effect, and the number and the quantity it names must both match the
   entry's own `n` and `perk`. A retune that moves `n` and forgets the sentence trips this.

   SIX ARMS. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "endow";
export const describe = "every monument's sentence states its own real number, and the endowment stages no games";

/* the words a `say` may legitimately use for each perk, and the number spelled out */
const PERK_WORDS = {
  crowd:   /crowd/i,
  rest:    /fatigue/i,
  calm:    /unrest/i,
  fame:    /fame/i,
  regard:  /regard/i,
  acclaim: /acclaim|the street's love/i,
};
const SPELLED = { 1:"one", 2:"two", 3:"three", 4:"four", 5:"five", 6:"six", 7:"seven",
  8:"eight", 9:"nine", 10:"ten", 11:"eleven", 12:"twelve", 14:"fourteen", 20:"twenty" };

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"ENDOW-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(([PERK_SRC, SPELLED])=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const PERK = {}; for(const [k,v] of Object.entries(PERK_SRC)) PERK[k] = new RegExp(v.src, v.flags);

    /* ---- 1: every sentence states its own number, in digits or in words ---- */
    { const rows = [];
      for(const k of [...A.WORK_KEYS, ...A.MONU_KEYS]){
        const W = A.workDef(k);
        if(!W){ bad.push(`${k} has no definition`); continue; }
        if(!W.perk || W.n == null){ rows.push({ k, note:"no perk" }); continue; }
        if(!W.say){ bad.push(`${k} declares perk ${W.perk} ${W.n} and says nothing about it at all`); continue; }
        /* the escaping here was doubled in the first draft, so every decimal and every spelled
           number reported as missing — four of nine, on a table where all nine are correct. */
        const digits = new RegExp(`(^|[^\\d.])${String(W.n).replace(".","\\.")}(?![\\d])`);
        const word   = SPELLED[W.n] ? new RegExp(`\\b${SPELLED[W.n]}\\b`, "i") : null;
        const hasNum = digits.test(W.say) || (word && word.test(W.say));
        const rx = PERK[W.perk];
        const hasWord = rx ? rx.test(W.say) : true;
        rows.push({ k, perk:W.perk, n:W.n, hasNum, hasWord });
        if(!hasNum) bad.push(`${k} pays ${W.perk} ${W.n} a week and its sentence does not contain that number: "${String(W.say).slice(0,70)}"`);
        if(!hasWord) bad.push(`${k} pays ${W.perk} and its sentence never names ${W.perk}: "${String(W.say).slice(0,70)}"`);
        if(!rx && W.perk) bad.push(`${W.perk} is a perk this check has no word for — add it to PERK_WORDS rather than letting it pass unchecked`);
      }
      lines.push(`${rows.filter(x=>x.hasNum).length} of ${rows.filter(x=>x.perk).length} perked works state their own number and name their own quantity`);
    }

    /* ---- 2: and every perk a work declares is actually consumed ----
       An `n` nothing reads is the same fault one layer down: a number on a card that moves nothing. */
    { const declared = new Set();
      for(const k of [...A.WORK_KEYS, ...A.MONU_KEYS]){
        const W = A.workDef(k); if(W && W.perk) declared.add(W.perk); }
      const d = A.newGameState("Perk", "clean", "EN-perk", null);
      for(const perk of declared){
        /* forge the work done and require workPerk to see it — the accessor every consumer uses */
        const owner = [...A.WORK_KEYS, ...A.MONU_KEYS].find(k=>{ const W = A.workDef(k); return W && W.perk === perk; });
        const W = A.workDef(owner);
        const s = A.clone(d); s.works = { [owner]: { left:0, owed:0, paid:W.cost } };
        const got = A.workPerk(s, perk);
        if(!(got > 0)) bad.push(`a finished ${owner} declares perk ${perk} ${W.n} and workPerk reads ${got} — nothing can consume it`);
      }
      lines.push(`${declared.size} distinct perks declared, all readable through workPerk`);
    }

    /* ---- 3: THE ENDOWMENT STAGES NO GAMES, and the text must not say it does ----
       This is the assertion that would have caught the original blurb, and it is the one that keeps
       a future rewrite honest: the entry may only promise a recurring festival if one exists. */
    { const E = A.MONUMENTS.endow;
      if(!E){ bad.push("MONUMENTS.endow is gone"); }
      else {
        const text = `${E.blurb} ${E.done} ${E.say}`;
        /* a CALENDAR entry the endowment owns would have to be findable by festivalNow */
        const owns = (A.CALENDAR||[]).some(f=>/endow/i.test(f.key||"") || /endow/i.test(f.name||""));
        const promises = /games that hold themselves|every year after you are gone|will run when your grandsons/i.test(text);
        if(promises && !owns)
          bad.push(`the endowment's text promises a recurring festival and CALENDAR holds no entry for one — that is the claim #241 was raised for`);
        if(owns && !promises)
          bad.push(`CALENDAR now carries an endowed festival and the entry's text does not mention it`);
        /* and it must still say what it DOES do, which is the acclaim */
        if(!/acclaim|the street/i.test(text))
          bad.push(`the endowment's text does not mention the one thing it actually pays`);
        lines.push(`the endowment: promises a festival ${promises}, CALENDAR carries one ${owns}`);
      } }

    /* ---- 4: the free weeks a seventh festival would need still exist ----
       Reported, not required — but a collision would make festivalNow's `find` ambiguous, and this
       is the cheap standing guard on that. */
    { const ws = (A.CALENDAR||[]).map(f=>f.w);
      if(ws.length !== new Set(ws).size) bad.push(`CALENDAR has two entries on the same week — festivalNow's find is ambiguous`);
      for(const f of (A.CALENDAR||[])) if(!(f.w >= 1 && f.w <= 18))
        bad.push(`a festival sits at week ${f.w}, outside the 18-week year`);
      const free = []; for(let w=1;w<=18;w++) if(!ws.includes(w)) free.push(w);
      lines.push(`the calendar holds ${ws.length} of 18 weeks (${ws.join(", ")}) — ${free.length} free`);
    }

    /* ---- 5: WHAT THE ACCLAIM TICK IS ACTUALLY WORTH, which is why phase 3 was refused ----
       Not the measured +30 — that is a played figure and belongs in the probe. This pins the
       MECHANISM the measurement rests on: acclaim is a spring, so a flat perk holds a gap, and the
       fixed point the constants imply must stay large enough that the perk is not a token. */
    { const d = A.newGameState("Spring", "clean", "EN-spring", null);
      d.week = 200; d.fame = 2000;
      const E = A.MONUMENTS.endow;
      const s = A.clone(d); s.works = { endow: { left:0, owed:0, paid:E.cost } };
      const perk = A.workPerk(s, "acclaim");
      if(perk !== E.n) bad.push(`a finished endowment reads workPerk ${perk} against a declared ${E.n}`);
      /* the spring: hold acclaim below target and above it, and require the pull to be there */
      const at = (acc) => { const t = A.clone(s); t.acclaim = acc;
        const before = A.acclaimOf(t); A.acclaimWeek ? A.acclaimWeek(t) : null;
        return { before, after: A.acclaimOf(t) }; };
      if(typeof A.acclaimWeek === "function"){
        const low = at(5), high = at(95);
        if(!(low.after > low.before)) bad.push(`acclaim at 5 does not climb toward its target — the spring is gone and a flat perk would simply bank`);
        if(!(high.after < high.before)) bad.push(`acclaim at 95 does not fall back — the spring is gone in the other direction`);
        lines.push(`the spring: 5 → ${low.after.toFixed(1)}, 95 → ${high.after.toFixed(1)} · the perk reads ${perk}`);
      }
      if(!(E.n >= 0.9)) bad.push(`the endowment's acclaim tick has been cut to ${E.n} — measured, 1.1 holds a house about thirty points above its own deeds, and #241's proposal to shrink it was refused on that`);
    }

    /* ---- 6: AND IT OUTLIVES YOU, which is the half of the old blurb that was true ---- */
    { const d = A.newGameState("Heir", "capua", "EN-heir");
      d.week = 220; d.fame = 2600; d.gold = 12000;
      const EC = A.MONUMENTS.endow.cost;
      d.works = { endow: { left:0, owed:0, paid:EC }, colossus: { left:20, owed:3000, paid:4000 } };
      const gen0 = d.generation;
      let threw = null;
      try { d.heir = { kind:"son", name:"Lucius Verres", traits:[] }; A.succeed(d, "son"); }
      catch(e){ threw = String(e && e.message || e).slice(0,120); }
      if(threw) bad.push(`the succession threw with a monument on the books: ${threw}`);
      else {
        if(!A.workDone(d, "endow")) bad.push(`the endowment did not survive the handover — "it outlives you" is the second false claim in the same sentence`);
        if(!A.workOn(d, "colossus")) bad.push(`a monument still going up was lost at the handover`);
        if(A.workPerk(d, "acclaim") !== A.MONUMENTS.endow.n) bad.push(`the perk stopped paying after the handover`);
        if(!(d.generation > gen0)) bad.push(`the succession did not advance the generation, so this arm proved nothing`);
        lines.push(`the handover: generation ${gen0} → ${d.generation}, endowment still standing, perk still ${A.workPerk(d,"acclaim")}`);
      } }

    return { bad, lines };
  }, [Object.fromEntries(Object.entries(PERK_WORDS).map(([k,v])=>[k,{src:v.source,flags:v.flags}])), SPELLED]);

  bad.push(...r.bad);
  lines.push(...r.lines);
  return { pass: bad.length === 0, why: bad.join(" · "), lines };
}
