/* THE ROAD TO ROME, AND THE ONE LADDER THAT LIGHTS IT

   Audit item #218: "Rome never happens. 0 offers in 16 houses over eight-plus years each. The
   gate: fame past `romeBar`, `romeProved`, at least two men — and a senator patron at favour >= 70,
   which is the term a competent house fails silently (rope). Nothing in the game teaches that road.
   Recommend an agenda whisper when every other term is met: 'Rome does not know your name. A
   senator would have to say it'."

   THE HEADLINE DOES NOT REPRODUCE AND THE DIAGNOSIS IS THE WRONG TERM. Measured
   (`probes/rome.mjs`, 16 houses on the default rope, at the item's own horizon of eight years):
   **14 letters, 9 of 16 houses go to Rome, 66 weeks on the imperial sand.** Run to 420 weeks it is
   25 letters and 10 of 16; under a rope that calls its patrons' favours, 47 and 14 of 16.

   And attributing every week BEFORE a house's first letter to the term that shut it — the last one
   standing, out of 1,347 shut weeks:

     proved   unmet 94.4%   last mile 65 weeks      senator  unmet 80.4%   last mile 0
     fame     unmet 94.8%   last mile 61            men      unmet 15.6%   last mile 0

   13 of 16 houses warmed a senator to **100**. The senator was the last term standing on ZERO
   weeks. What shuts the road is `romeProved` — the primacy or the fourth rung — which is what the
   feats sheet had been saying all along, on 1,271 of the 1,301 weeks it spoke.

   THE LAST SENTENCE OF THE ITEM IS THE TRUE ONE. The agenda spoke about Rome on **1 of 1,373 shut
   weeks (0.1%)**: its one block fired only for a senator ALREADY HELD who had cooled, so a house
   with no senator, short on fame, or unproved heard nothing at all. So there is one ladder now —
   `romeGap` — and `romeReady` is defined FROM it rather than being a second copy of the same five
   terms; the feats sheet renders every rung; and `romeRow` puts the rung in the way on the week's
   list. The agenda speaks on 11.5% of shut weeks now, and stays silent on the 94% where the answer
   is a multi-year campaign rather than something to do this week.

   AND THE LEVER FOR ROME ALWAYS SHUT THE ROAD TO ROME. `FAVOURS.senator` costs 34 favour; the
   letter wants a senator at 70; favour caps at 100. So calling it from anywhere at or above the
   bar leaves him under it — measured, **816 of 816** ready weeks — while the box selling it said
   only "150 off Rome's bar". It says both now.

   FIVE ARMS:
   1 · THE GATE AND THE LADDER ARE ONE. `romeGap`'s "ready" and the five terms of the invitation
       agree on every state, played and built.
   2 · EVERY RUNG IS REACHABLE AND NAMES ITS OWN TERM — including `nosenator`, which the item asked
       for and which 1,347 played weeks never once produced.
   3 · THE WEEK'S LIST SPEAKS WHERE THERE IS SOMETHING TO DO and stays quiet where there is not.
   4 · AND THE ROW REACHES THE ACTUAL AGENDA, not a reconstruction of it.
   5 · THE SENATOR'S FAVOUR SAYS WHAT IT COSTS. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "letter";
export const describe = "the road to Rome is one ladder, and the week's list names the rung in the way";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"LETTER-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","romeGap","romeRow","romeReady","romeProved","romeBar","romeShort",
                  "romeSenator","patronsOf","activeG","agenda","featNear","favourWorth","FAVOURS",
                  "makePatron","ROME_COOLDOWN","ROME_WARM","ROME_SOON"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const bad = [];

    /* the five terms of the invitation, written out here rather than read off the ladder — the
       whole point is that the two must not be able to drift */
    const gateTerms = d => ({
      here:    !d.rome && !d.romeOffer && !d.over,
      proved:  A.romeProved(d),
      fame:    (d.fame||0) >= A.romeBar(d),
      senator: A.patronsOf(d).some(x=>x.rank==="senator" && x.favor>=70),
      men:     A.activeG(d).length >= 2,
      cool:    (d.flags.romeDeclined == null || d.week - d.flags.romeDeclined >= 30)
               && (d.flags.romeReturned == null || d.week - d.flags.romeReturned >= A.ROME_COOLDOWN),
    });
    const gateOpen = d => Object.values(gateTerms(d)).every(Boolean);
    const check1 = (d, where) => {
      const key = (A.romeGap(d)||{}).key;
      if((key === "ready") !== gateOpen(d))
        bad.push(`the ladder and the gate disagree ${where}: romeGap says "${key}" where the five `
          + `terms say ${gateOpen(d) ? "open" : "shut"} (`
          + Object.entries(gateTerms(d)).filter(([,v])=>!v).map(([k])=>k).join(",") + ")");
      if(A.romeReady(d) !== gateOpen(d))
        bad.push(`romeReady disagrees with its own five terms ${where}`);
    };

    /* ---- 2. a fixture per rung ---- */
    const build = k => {
      const d = A.newGameState(`LETTER-${k}`, "clean", `LETTER-${k}`);
      d.flags.primusHeld = 1;                      /* proved by the sand */
      d.fame = A.romeBar(d) + 500;
      d.patrons = (d.patrons||[]).filter(x=>x.rank!=="senator");
      while(A.activeG(d).length < 2){
        const m = A.genGladiator(d, 60); m.id = d.nextId++; m.status="active"; m.mine=true;
        d.gladiators.push(m); }
      const warm = f => { const s = A.makePatron(d, "senator"); s.favor = f; d.patrons.push(s); return s; };
      if(k === "there"){ d.rome = { travel:0, fought:1, won:1, run:1 }; }
      else if(k === "letter"){ d.romeOffer = { due:d.week+4, run:1 }; }
      else if(k === "proved"){ d.flags.primusHeld = 0; d.rise = { rank:0, standing:0 }; }
      else if(k === "fame"){ d.fame = Math.max(0, A.romeBar(d) - 120); warm(90); }
      else if(k === "nosenator"){ /* no patron of that rank at all — the item's own line */ }
      else if(k === "cold"){ warm(40); }
      /* the week is a number and week 0 is a real one, so this plants the return at the CURRENT
         week rather than one before it — the first draft used `d.week - 1`, which is 0 on a fresh
         house, and a gate written on truthiness read that as no return at all */
      /* the week is a number and week 0 is a real one, so this plants the return at the CURRENT
         week rather than one before it — the first draft used `d.week - 1`, which is 0 on a fresh
         house, and a gate written on truthiness read that as no return at all. Planted deep enough
         into the cooldown that the row is the near-the-end one rather than a silent countdown. */
      else if(k === "forgetting"){ warm(90);
        d.flags.romeReturned = d.week - (A.ROME_COOLDOWN - A.ROME_SOON); }
      else if(k === "men"){ warm(90);
        A.activeG(d).slice(1).forEach(g=>{ g.status = "dead"; }); }
      else if(k === "cooling"){ warm(A.ROME_WARM - 3); }   /* open, and slipping — `ready` with a flag */
      else if(k === "ready"){ warm(92); }
      return d;
    };
    /* cooling is not a rung of the ladder — the letter asks 70 and nothing more, so a senator at
       74 leaves the gate OPEN. It rides on `ready` as a flag, and this holds that. */
    const KEYS = ["there","letter","proved","fame","nosenator","cold","forgetting","men","cooling","ready"];
    const EXPECT = k => k === "cooling" ? "ready" : k;
    const rungs = {};
    for(const k of KEYS){
      const d = build(k);
      const got = (A.romeGap(d)||{}).key;
      if(k === "cooling" && !(A.romeGap(d)||{}).cooling)
        bad.push(`a senator inside the warning band does not raise the cooling flag`);
      if(k === "ready" && (A.romeGap(d)||{}).cooling)
        bad.push(`a senator well past the bar is flagged as cooling`);
      let row = null, near = null;
      try { row = A.romeRow(d); } catch(e){ bad.push(`romeRow threw on the ${k} fixture: ${e.message}`); }
      try { near = A.featNear(d, "rome"); } catch(e){ bad.push(`featNear threw on the ${k} fixture: ${e.message}`); }
      rungs[k] = { got, row: row && row.label, sub: row && row.sub, urg: row && row.urgency, near };
      if(got !== EXPECT(k)) bad.push(`the ${k} rung is unreachable: a house built to sit on it reads "${got}"`);
      check1(d, `on the ${k} fixture`);
      /* every rung the sheet renders must say something, and something different */
      if(!near) bad.push(`the feats sheet says nothing at all on the ${k} rung`);
    }
    /* and deep in the cooldown it must say nothing — a 45-week countdown is the nag again */
    { const d = build("forgetting"); d.flags.romeReturned = d.week;
      const g = A.romeGap(d);
      if((g||{}).key !== "forgetting") bad.push(`a house one week back from Rome does not read as cooling off`);
      else if(A.romeRow(d)) bad.push(`the week's list starts a ${g.weeks}-week countdown to Rome `
        + `("${A.romeRow(d).label}") — that is the permanent nag, not a to-do`); }
    const nears = KEYS.map(k=>rungs[k].near).filter(Boolean);
    if(new Set(nears).size !== nears.length)
      bad.push(`two rungs render the same line on the feats sheet — the sheet cannot tell them apart`);
    /* the item's own recommendation, held to its own words */
    if(!(rungs.nosenator.row && /senator/i.test(rungs.nosenator.sub||"")))
      bad.push(`a house past the bar with no senator gets no line about one — which is the row #218 asked for`);

    /* ---- 3 and 4: played weeks ---- */
    const seen = { weeks:0, shut:0, spoke:0, byKey:{}, spokeByKey:{}, agendaHit:0, agendaMiss:0 };
    let letters = 0, lettered = 0, trips = 0;
    for(let h = 0; h < 5; h++){
      const d = A.newGameState(`LETTER-P${h}`, "clean", `LETTER-P${h}`);
      let was = false, got = false;
      for(let w = 0; w < 150 && !d.over; w++){
        seen.weeks++;
        const g = A.romeGap(d);
        const key = g ? g.key : "none";
        seen.byKey[key] = (seen.byKey[key]||0) + 1;
        if(key !== "there" && key !== "letter" && key !== "ready" && key !== "none") seen.shut++;
        check1(d, `on a played week (${key})`);
        const row = A.romeRow(d);
        if(row){
          seen.spoke++;
          seen.spokeByKey[key] = (seen.spokeByKey[key]||0) + 1;
          /* ---- 4. and the row must reach the list the player reads ---- */
          let rows = null; try { rows = A.agenda(d); } catch(e){}
          if(rows && rows.some(x=>x.label === row.label && x.sub === row.sub)) seen.agendaHit++;
          else { seen.agendaMiss++;
            if(seen.agendaMiss === 1) bad.push(`romeRow put "${row.label}" up and the agenda does not `
              + `carry it — the row is built and then dropped`); }
        }
        if(d.romeOffer && !was){ letters++; got = true; }
        was = !!d.romeOffer;
        if(d.rome) trips++;
        try { R.lanista(d, {}); } catch(e){ break; }
      }
      if(got) lettered++;
    }
    /* the row must be quiet on the long campaign and speak on the last mile */
    const provedQuiet = (seen.byKey.proved||0) - (seen.spokeByKey.proved||0);
    if((seen.spokeByKey.proved||0) > (seen.byKey.proved||0) * 0.25)
      bad.push(`the week's list nags about Rome on ${seen.spokeByKey.proved} of ${seen.byKey.proved} `
        + `weeks where the house is not yet proved — that is the permanent nag, not a to-do`);
    if(!seen.shut) bad.push(`no shut week came up at all — arm 3 measured nothing`);
    if(!seen.spoke) bad.push(`the week's list never once spoke about Rome across ${seen.weeks} weeks`);
    if(Object.keys(seen.byKey).length < 3)
      bad.push(`play only ever produced ${Object.keys(seen.byKey).length} rung(s) — the ladder was never walked`);

    /* ---- 5. what the favour costs, said where it is sold ---- */
    const fav = {};
    { const d = build("ready");
      const sen = A.romeSenator(d);
      sen.favor = 92;
      fav.high = A.favourWorth(d, sen);
      fav.cost = A.FAVOURS.senator.cost;
      fav.worst = 100 - fav.cost;
      if(fav.worst >= 70)
        bad.push(`the senator's favour costs ${fav.cost} off a cap of 100, which no longer takes him `
          + `under the 70 Rome asks — the warning below is describing something that stopped being true`);
      if(!/70/.test(fav.high) || !new RegExp(String(fav.cost)).test(fav.high))
        bad.push(`the senator's favour is sold without its cost: "${fav.high}"`);
      sen.favor = 50;
      fav.low = A.favourWorth(d, sen);
      if(new RegExp(`takes ${fav.cost} of his own favour`).test(fav.low))
        bad.push(`the road-is-shut warning fires for a senator already under the bar: "${fav.low}"`);
    }

    return { bad, rungs, KEYS, seen, letters, lettered, trips, fav, provedQuiet };
  });

  if(r.miss) return { pass:false, why:`handle is missing ${r.miss.join(", ")}`, lines:[] };
  bad.push(...r.bad);

  lines.push(`the ladder has ${r.KEYS.length} rungs and a house was built to sit on each:`);
  for(const k of r.KEYS)
    lines.push(`   ${k.padEnd(11)} ${r.rungs[k].row ? `list: [${r.rungs[k].urg}] ${r.rungs[k].row}` : "list: (quiet)"}`);
  lines.push(`5 houses x 150 weeks: ${r.letters} letters to ${r.lettered} of 5 houses, ${r.trips} weeks at Rome`);
  lines.push(`the rungs play actually walked: `
    + Object.entries(r.seen.byKey).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · "));
  lines.push(`the week's list spoke on ${r.seen.spoke} of ${r.seen.weeks} weeks`
    + ` — ${Object.entries(r.seen.spokeByKey).map(([k,v])=>`${k} ${v}`).join(", ") || "none"}`
    + ` · quiet on ${r.provedQuiet} unproved weeks`);
  lines.push(`every row it built reached the agenda: ${r.seen.agendaHit} carried, ${r.seen.agendaMiss} dropped`);
  lines.push(`the senator's favour costs ${r.fav.cost} of a cap of 100, so calling it from the bar `
    + `leaves ${r.fav.worst} — under the 70 the letter asks. The box says so.`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
