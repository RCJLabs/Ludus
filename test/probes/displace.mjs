/* WHAT THE NEW ENDING DISPLACED, AND WHETHER IT CAME EARLY — #164

   v3.38.0 took a term out of `disgrace`'s gate (`d.favor <= 6`, which reads the PATRONS in an ending
   about the front rows) and the ending went from firing never to firing for 10 of 21 dead houses in
   `ends`' own `careless` arm and 7 / 9 / 4 of 24 in the blood arms. Nothing measured what those
   houses used to end as, or WHEN. An ending that fires earlier than the one it replaced shortens
   runs, and shortening runs quietly is how a content change becomes a balance change.

   THE CONTROL IS THE OLD GATE, and it can be had exactly rather than approximated: the three-term
   version fired 0 times in 216 house-runs, so a `disgrace` that cannot fire IS the old behaviour.
   `RUINS` is on the handle and `ruinWeek` looks its `need` up at call time, so the control pass
   neuters `RUINS.disgrace.need` and the live pass leaves it alone. Same seeds, same policies, same
   everything else.

   INSTRUMENT NOTES, all off this project's record:
   · the CONTROL RUNS FIRST, which is `season`'s rule — a paired arm that runs second can inherit
     state, and this one shares a page with its partner.
   · the control has its own control: if any house ends `disgrace` in the neutered pass, the patch did
     not take and every number below is worthless. It is asserted and printed, not assumed.
   · both arms report per house, and the pairs that CHANGED are printed in full — a median over
     houses that did not move tells you nothing about the ones that did.
   · run it on more than one seed prefix before quoting; a displacement count over 24 houses is the
     size of sample that has killed two findings on this project. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "DSP";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const POLICIES = {
    base: { note:"the reference player — disgrace should never fire here at all", opts:undefined },
    hot:  { note:"takes the death match whenever the bill has one", opts:{ preferStakes:"sine" } },
    sine: { note:"fights only sine missione, falling through to the pit", opts:{ stakes:"sine" } },
  };
  const real = A.RUINS.disgrace.need;
  const run = (pol, live) => {
    A.RUINS.disgrace.need = live ? real : (()=>false);
    const rows = [];
    for(let h=0; h<H; h++){
      const d = A.newGameState("Dp"+h, "clean", `${SEED}-${h}`, null);
      /* ---- AND WHETHER THE STORY COULD HAVE HAPPENED YET ----
         `disgrace` is the front rows walking away from a house that kills. That takes a season of
         cards to become true, so the week the GATE first holds — and what the house had actually
         done by then — is the difference between an ending and a trapdoor. Recorded on the live pass
         only; the control's gate is neutered and has no first week. */
      let gateAt = null, ctx = null;
      for(let w=0; w<W; w++){
        if(d.over) break;
        R.lanista(d, POLICIES[pol].opts);
        if(live && gateAt == null){
          let hit = false; try { hit = A.RUINS.disgrace.need(d); } catch(e){}
          if(hit){ gateAt = d.week;
            ctx = { bouts:(d.book&&d.book.n)||0, men:A.activeG(d).length, fame:Math.round(d.fame||0),
                    blood:Math.round(A.repOf(d,"blood")), front:Math.round(A.facOf(d,"front")),
                    buried:A.houseRecord(d).lost }; }
        }
      }
      /* ---- AND WAS HE TOLD ----
         `ruinWeek` writes the gate's `warn` line the first week it holds and will not land the ending
         for six weeks after. "The run is shorter but the player was warned" is the whole defence of a
         displacement like this, so it is read out of the chronicle rather than assumed from the code. */
      const warned = [...(d.log||[]), ...(d.kept||[])].some(L=>(L.text||"").includes("front rows have stopped coming"));
      rows.push({ week:d.week, kind: d.over ? d.over.kind : "alive", gateAt, ctx, warned,
        notice: gateAt == null ? null : d.week - gateAt });
    }
    return rows;
  };
  const out = {};
  for(const pol of Object.keys(POLICIES)){
    const ctrl = run(pol, false);      /* the control first, always */
    const live = run(pol, true);
    out[pol] = { note:POLICIES[pol].note, ctrl, live };
  }
  A.RUINS.disgrace.need = real;
  return out;
}, [H, W, SEED]);

const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : 0; };
const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;
const tally = rows => { const t={}; for(const r of rows) t[r.kind]=(t[r.kind]||0)+1;
  return Object.entries(t).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · "); };

console.log(`\n  ${H} houses x ${W}w per arm · seed "${SEED}" · the control is \`disgrace\` neutered, which IS the pre-v3.38.0 gate\n`);
for(const [pol, A2] of Object.entries(out)){
  const bad = A2.ctrl.filter(r=>r.kind==="disgrace").length;
  console.log(`  ${pol.toUpperCase()} — ${A2.note}`);
  console.log(`    the control's own control: ${bad} houses ended \`disgrace\` with the gate neutered`
    + (bad ? "  <-- THE PATCH DID NOT TAKE; EVERYTHING BELOW IS WORTHLESS" : "  (0 is required, and it is 0)"));
  console.log(`    old gate: median life ${med(A2.ctrl.map(r=>r.week))}w · ${tally(A2.ctrl)}`);
  console.log(`    new gate: median life ${med(A2.live.map(r=>r.week))}w · ${tally(A2.live)}`);
  const moved = A2.ctrl.map((c,i)=>({ i, c, l:A2.live[i] })).filter(x=>x.c.kind!==x.l.kind || x.c.week!==x.l.week);
  const dis = moved.filter(x=>x.l.kind==="disgrace");
  console.log(`    houses whose run changed at all: ${moved.length} of ${H} · of those, ${dis.length} now end \`disgrace\``);
  if(dis.length){
    const early = dis.filter(x=>x.l.week < x.c.week);
    console.log(`      each one, old -> new:  ${dis.map(x=>`w${x.c.week} ${x.c.kind} -> w${x.l.week} disgrace`).join("  ·  ")}`);
    console.log(`      of them, ${early.length} ended EARLIER than they used to, by a median `
      + `${med(early.map(x=>x.c.week - x.l.week))}w (mean ${mean(dis.map(x=>x.c.week - x.l.week)).toFixed(1)}w over all ${dis.length})`);
    const was = {}; for(const x of dis) was[x.c.kind]=(was[x.c.kind]||0)+1;
    console.log(`      what they used to be: ${Object.entries(was).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
  }
  if(dis.length){
    const c = dis.map(x=>x.l.ctx).filter(Boolean);
    if(c.length){
      const mm = f => med(c.map(f));
      console.log(`      the week the GATE first held: median w${med(dis.map(x=>x.l.gateAt).filter(Boolean))}`
        + ` (earliest w${Math.min(...dis.map(x=>x.l.gateAt||9999))}) — and at that moment the house had fought`
        + ` a median ${mm(x=>x.bouts)} bouts, buried ${mm(x=>x.buried)}, held ${mm(x=>x.men)} men, ${mm(x=>x.fame)} fame,`
        + ` blood ${mm(x=>x.blood)} of the 88 asked and front ${mm(x=>x.front)} of the 12`);
      console.log(`      and the warning: the chronicle carried "the front rows have stopped coming" in `
        + `${dis.filter(x=>x.l.warned).length} of ${dis.length} of them, a median `
        + `${med(dis.map(x=>x.l.notice).filter(x=>x!=null))} weeks before the house closed`);
    }
  }
  const other = moved.filter(x=>x.l.kind!=="disgrace");
  if(other.length)
    console.log(`      and ${other.length} moved WITHOUT ending in disgrace: ${other.slice(0,6).map(x=>`w${x.c.week} ${x.c.kind} -> w${x.l.week} ${x.l.kind}`).join(" · ")}`
      + (other.length>6?" …":"") + `  (a warning written on one week reshuffles the draws after it, so some of this is trajectory)`);
  console.log(`    median life moved ${med(A2.live.map(r=>r.week)) - med(A2.ctrl.map(r=>r.week))}w · `
    + `mean ${(mean(A2.live.map(r=>r.week)) - mean(A2.ctrl.map(r=>r.week))).toFixed(1)}w`);
  console.log("");
}

await browser.close(); server.close();
