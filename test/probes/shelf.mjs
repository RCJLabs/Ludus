/* #220 — AVAILABLE, SURFACED, TAKEN: THREE DIFFERENT QUESTIONS ABOUT FOUR SYSTEMS

   The item: "A shelf of systems a long run never meets: gambits 0, courts 0, pacts 1, prisoner
   lots 2 — in sixteen runs. Some of that is policy (rope), but a system reachable only off-policy
   for eight years is dark by construction. Recommend wiring them into the arc that is always on —
   the feud (79% of weeks): the rival's schemes should offer the gambit, the court case, the pact
   as answers, instead of those living parallel and untouched."

   A COUNT OF WHAT THE ROPE DID IS NOT A MEASURE OF WHAT THE GAME OFFERS, and these four are in
   four different states before any policy touches them:

     gambits   `runGambit` is reachable only from the rivals panel. Nothing in the game points at
               it — no agenda row, no event, no mark. The rope has a `gambit:N` lever (#198) and it
               is OFF by default, so "gambits 0" is the lever, not the shelf.
     courts    `agendaCan` already offers one, gated on a GAP — room in the cells and fewer than
               three fit men — which v2.63.1 chose deliberately over "a rival's man is better than
               yours", a condition that stood in 36% of weeks. So the court is surfaced; the
               question is how often that gate opens.
     pacts     `offerPact` is called every week in the weekly loop and writes a `pendingEvent`,
               which is the LOUDEST thing in the game. Gated: week >= 20, fame >= 55, at most three
               seen, nothing else pending, and a 4.5% roll. Over a hundred and thirty eligible
               weeks that is five or six offers expected, not one in sixteen runs.
     lots      `d.powLot` is set by the market maker only while a war is running, then drawn on
               the market panel and carried in the market tab's signature. So its availability is
               the WAR's availability.

   So: for each, how many weeks was it AVAILABLE, how many weeks did the game SURFACE it, and how
   many times was it TAKEN. Three columns, and the item's number is only the third.

     node test/probes/shelf.mjs 16 300 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 300);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"SHELF" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","agenda","GAMBITS","gambitReady","gambitOdds","PACTS","PACT_KEYS",
                "activeG","canFight","rosterFull","cellsCap","courtCost","rateMan","tabSig",
                "lawOf"].filter(k=>A[k]==null);
  if(miss.length) return { miss };
  const pct = n => Math.round(n*1000)/10;

  const KEYS = ["gambit","court","pact","lot"];
  const cheapGambit = d => Math.min(...Object.keys(A.GAMBITS).map(k=>{
    const c = A.GAMBITS[k].cost; return typeof c === "function" ? c(d) : c; }));
  const canGambitNow = d => (d.rivals||[]).some(x=>!x.retired) && A.gambitReady(d)
    && d.gold >= cheapGambit(d);
  const arms = {};
  for(const [key, opts] of [["default", {}],
                            ["gambit:6", { gambit:6 }],
                            ["court+lot", { court:true, lot:true }]]){
    const a = arms[key] = { houses:0, weeks:0, feudWeeks:0,
      have:{}, said:{}, took:{},
      trig:{ nemHouse:0, nemesis:0, grudge35:0, grudge50:0, grudge65:0, poach:0, poachAnswerable:0 },
      gate:{ pactWeek:0, pactFame:0, pactSeen:0, pactBusy:0, pactRolls:0,
        warWeeks:0, courtGap:0, courtRoom:0, gambitAfford:0 } };
    for(const k of KEYS){ a.have[k] = 0; a.said[k] = 0; a.took[k] = 0; }

    for(let h = 0; h < H; h++){
      const d = A.newGameState(`SHELF-${h}`, "clean", `SHELF-${h}`);
      a.houses++;
      let hadPact = null, hadCourt = null, gamCount = 0, lotSeen = 0;
      for(let w = 0; w < W && !d.over; w++){
        a.weeks++;
        if(d.nemHouse || (d.nemesis && !d.nemesis.hated)) a.feudWeeks++;
        /* ---- WHAT "THE ARC THAT IS ALWAYS ON" ACTUALLY IS ----
           The item puts the feud at 79% of weeks and hangs its whole recommendation on that. Count
           the candidates apart: a named house feud, a named man, a rival keeping an account, and
           the one thing that is an INJURY with an answer — a rival with money in front of your man. */
        const top = (d.rivals||[]).reduce((m,x)=>Math.max(m, x.grudge||0), 0);
        if(d.nemHouse) a.trig.nemHouse++;
        if(d.nemesis) a.trig.nemesis++;
        if(top >= 35) a.trig.grudge35++;
        if(top >= 50) a.trig.grudge50++;
        if(top >= 65) a.trig.grudge65++;
        if(d.poach) a.trig.poach++;
        if(d.poach && canGambitNow(d)) a.trig.poachAnswerable++;

        /* ---- AVAILABLE ---- */
        const rivals = (d.rivals||[]).filter(x=>!x.retired);
        const spare = d.gold;
        const cheapest = Math.min(...Object.keys(A.GAMBITS).map(k=>{
          const c = A.GAMBITS[k].cost; return typeof c === "function" ? c(d) : c; }));
        const canGambit = canGambitNow(d);
        if(canGambit){ a.have.gambit++; a.gate.gambitAfford++; }

        const fit = A.activeG(d).filter(g=>A.canFight(g) && !g.injury).length;
        const room = !A.rosterFull(d);
        if(room) a.gate.courtRoom++;
        const canCourt = room && !d.court && !d.poach && rivals.some(x=>(x.fighters||[]).length);
        if(canCourt) a.have.court++;
        if(room && fit < 3) a.gate.courtGap++;

        /* the pact's own five gates, counted apart */
        const pw = d.week >= 20, pf = (d.fame||0) >= 55,
              ps = (d.flags.pactsSeen||0) < 3, pb = !d.pendingEvent && !d.pact && !d.rome && !d.city && !d.travel;
        if(pw) a.gate.pactWeek++; if(pf) a.gate.pactFame++; if(ps) a.gate.pactSeen++; if(pb) a.gate.pactBusy++;
        if(pw && pf && ps && pb){ a.have.pact++; a.gate.pactRolls++; }

        if(d.war && !d.war.done) a.gate.warWeeks++;
        if(d.powLot) a.have.lot++;

        /* ---- SURFACED: what the week's own list and the tab marks say ---- */
        let rows = null; try { rows = A.agenda(d); } catch(e){}
        const text = (rows||[]).map(x=>`${x.label||""} ${x.sub||""}`).join(" | ");
        if(/put a word in his ear|could be got at|is being talked to/i.test(text)) a.said.court++;
        if(/gambit|editor's ear|his best man|at his steel|word about/i.test(text)) a.said.gambit++;
        if(d.pendingEvent && d.pendingEvent.id === "pact") a.said.pact++;
        if(d.powLot){ let sig = ""; try { sig = A.tabSig(d, "market") || ""; } catch(e){}
          if(/lot\d/.test(String(sig))) a.said.lot++; }

        /* ---- TAKEN ---- */
        const gc = Object.values(d.gambits||{}).reduce((x,y)=>x+y, 0);
        if(gc > gamCount){ a.took.gambit += gc - gamCount; gamCount = gc; }
        if(d.court && d.court.name !== hadCourt){ a.took.court++; hadCourt = d.court.name; }
        /* NOT by counting war captives: the market maker flags ordinary market men `warCaptive`
           while a war is on (line 5941), so that counter reads market buys as lot buys. `buyLot`
           writes one chronicle line and nothing else does. */
        const lots = (d.log||[]).filter(l=>/take the whole lot off/.test(String((l&&l.text)||l||""))).length;
        if(lots > lotSeen){ a.took.lot += lots - lotSeen; lotSeen = lots; }
        if(!d.court) hadCourt = null;
        if(d.pact && d.pact.began !== hadPact){ a.took.pact++; hadPact = d.pact.began; }
        if(!d.pact) hadPact = null;

        try { R.lanista(d, opts); } catch(e){ break; }
      }
    }
  }

  return { arms, KEYS, pactOdds:0.045 };
}, [H, W]);

if(out.miss){ console.log("handle is missing:", out.miss.join(", ")); }
else {
  console.log(`\n#220 — available, surfaced, taken: three different questions about four systems\n`);
  for(const [key, a] of Object.entries(out.arms)){
    const p = n => `${Math.round(n/Math.max(1,a.weeks)*1000)/10}%`;
    console.log(`=== ${key} — ${a.houses} houses, ${a.weeks} weeks · a feud standing on ${p(a.feudWeeks)} ===`);
    console.log(`  ${"system".padEnd(9)} ${"AVAILABLE".padStart(16)}   ${"SURFACED".padStart(16)}   ${"TAKEN".padStart(6)}`);
    for(const k of out.KEYS)
      console.log(`  ${k.padEnd(9)} ${String(a.have[k]).padStart(6)} wk ${p(a.have[k]).padStart(6)}   `
        + `${String(a.said[k]).padStart(6)} wk ${p(a.said[k]).padStart(6)}   ${String(a.took[k]).padStart(6)}`);
    console.log(`  the pact's five gates apart: week>=20 on ${p(a.gate.pactWeek)}, fame>=55 on ${p(a.gate.pactFame)}, `
      + `under three seen on ${p(a.gate.pactSeen)}, nothing else pending on ${p(a.gate.pactBusy)}`);
    console.log(`     — all five open on ${a.gate.pactRolls} weeks, and at 4.5% a week that is `
      + `${Math.round(a.gate.pactRolls*0.045*10)/10} offers expected against ${a.said.pact} seen`);
    console.log(`  a war was running on ${p(a.gate.warWeeks)} of weeks (the lot's whole availability)`);
    console.log(`  cells with room on ${p(a.gate.courtRoom)}, and the GAP the court line wants `
      + `(room and under three fit) on ${p(a.gate.courtGap)}`);
    console.log(`  a gambit affordable and off cooldown on ${p(a.gate.gambitAfford)}`);
    console.log(`  CANDIDATE TRIGGERS for a door onto the shelf:`);
    for(const [k, v] of Object.entries(a.trig))
      console.log(`     ${k.padEnd(17)} ${String(v).padStart(6)} wk  ${p(v)}`);
    console.log("");
  }
}
await browser.close(); server.close();
