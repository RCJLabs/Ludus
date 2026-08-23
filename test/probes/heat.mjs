/* IS THE LAW DEAD, OR HAS NOBODY EVER BROKEN IT? — the fourth lesson, applied

   `asks.mjs` found law heat among seven quantities that can be emptied or heaped without the week's
   list changing a word, even counting urgency. That reads like dead content: the breach row is
   raised from urgency 2 to 3 at heat 45 (src:3089), `banned` needs heat 90, and three gambits price
   their odds off it — while a played house sits at heat 8.4.

   Then the reason turned up in the harness rather than the game. The rope has levers for men, gear,
   works, parties, rites, stakes, tactics — and NONE for gambits. It never bribes an editor, never
   puts money in front of a rival's best man, never does any of the things heat is a measure of. So
   every heat number this suite has ever produced is "a house that does not cheat", and low heat
   there is not a fault, it is the correct reading of an honest house.

   ROADMAP, fourth lesson, verbatim: "'the probe never did it' and 'the game will not let you' look
   identical in a census, and the first is far commoner... Before filing a system as dead, write the
   policy that deliberately uses it and see whether the system answers."

   So this writes it. Three arms on the same seeds:
     honest   the reference player, untouched
     tricky   throws the cheapest gambit it can afford at a rival, roughly every six weeks
     brazen   throws the best-odds gambit every week it can pay for one

   If the tricky and brazen arms climb through 45 and 90 and the gated content fires, the law works
   and there is nothing here to build. If they cannot reach the gates either, the gates are the
   fault. Either way the answer is measured rather than inferred from an honest house's quiet.
*/
import { serve, open, found, clearAll, installRope, inside } from "../harness.mjs";

const H = +(process.argv[2] || 8), W = +(process.argv[3] || 320);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"HEAT" });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  const ARMS = ["honest", "tricky", "brazen"];
  const res = {};
  for(const arm of ARMS){
    const a = { arm, w:0, heatSum:0, peak:0, over15:0, over40:0, over45:0, over70:0, over90:0,
                breachW:0, edictsSum:0, tries:0, won:0, banned:0, urg3:0, houses:0, ended:0,
                b1:0, b2:0, b3:0, b4:0, b12:0, b123:0 };
    for(let h=0; h<H; h++){
      const d = A.newGameState("Heat","clean","HEAT-"+h, null); a.houses++;
      for(let w=0; w<W && !d.over; w++){
        /* the policy lives in the rope now, not in here — a probe that carries its own copy of a
           policy is a second implementation to keep in step, which is how `estate`'s miser came to
           bundle three levers. */
        const did = R.lanista(d, arm === "honest" ? {} : { gambit: arm === "tricky" ? 6 : 1 });
        a.tries += (did.gambitWon||0) + (did.gambitLost||0); a.won += (did.gambitWon||0);
        if(d.over) break;
        const L = A.lawOf(d);
        a.w++; a.heatSum += L.heat; a.peak = Math.max(a.peak, L.heat);
        if(L.heat >= 15) a.over15++;
        if(L.heat >= 40) a.over40++;
        if(L.heat >= 45) a.over45++;
        if(L.heat >= 70) a.over70++;
        if(L.heat >= 90) a.over90++;
        a.edictsSum += (L.edicts||[]).length;
        let br = []; try { br = A.inBreach(d) || []; } catch(e){}
        if(br.length) a.breachW++;
        if(br.length && L.heat >= 45) a.urg3++;
        /* `banned` is a four-way conjunction; count each term on its own or a zero says nothing
           about WHICH term is unreachable */
        const t1 = L.heat >= 90, t2 = (L.edicts||[]).length >= 2, t3 = br.length >= 2, t4 = L.fines > 0;
        if(t1) a.b1++; if(t2) a.b2++; if(t3) a.b3++; if(t4) a.b4++;
        if(t1&&t2) a.b12++; if(t1&&t2&&t3) a.b123++;
        if(t1&&t2&&t3&&t4) a.banned++;
      }
      if(d.over) a.ended++;
    }
    res[arm] = a;
  }
  return { res, rope:R.say() };
}, [H, W]);

await browser.close(); server.close();
const pc = (n, d) => d ? (Math.round(n/d*1000)/10).toFixed(1) + "%" : "-";
console.log(`=== IS THE LAW DEAD, OR HAS NOBODY BROKEN IT? ===  ${H} houses x ${W} weeks per arm\n`);
console.log(`  ${"arm".padEnd(8)} ${"weeks".padStart(6)} ${"tricks".padStart(7)} ${"won".padStart(5)} ${"mean heat".padStart(10)} ${"peak".padStart(6)} ${"died".padStart(5)}`);
for(const k of ["honest","tricky","brazen"]){ const a = out.res[k];
  console.log(`  ${k.padEnd(8)} ${String(a.w).padStart(6)} ${String(a.tries).padStart(7)} ${String(a.won).padStart(5)} `
    + `${(a.w ? (a.heatSum/a.w).toFixed(1) : "-").padStart(10)} ${a.peak.toFixed(0).padStart(6)} ${String(a.ended).padStart(5)}`); }
console.log(`\n  share of weeks past each gate the game actually reads:`);
console.log(`  ${"arm".padEnd(8)} ${"h>=15".padStart(7)} ${"h>=40".padStart(7)} ${"h>=45".padStart(7)} ${"h>=70".padStart(7)} ${"h>=90".padStart(7)} ${"in breach".padStart(10)} ${"urg-3 row".padStart(10)} ${"banned".padStart(7)}`);
for(const k of ["honest","tricky","brazen"]){ const a = out.res[k];
  console.log(`  ${k.padEnd(8)} ${pc(a.over15,a.w).padStart(7)} ${pc(a.over40,a.w).padStart(7)} ${pc(a.over45,a.w).padStart(7)} `
    + `${pc(a.over70,a.w).padStart(7)} ${pc(a.over90,a.w).padStart(7)} ${pc(a.breachW,a.w).padStart(10)} ${pc(a.urg3,a.w).padStart(10)} ${pc(a.banned,a.w).padStart(7)}`); }
console.log(`\n  THE 'banned' GATE, term by term — heat>=90 AND 2+ edicts AND 2+ breaches AND a fine paid:`);
console.log(`  ${"arm".padEnd(8)} ${"h>=90".padStart(7)} ${"2 edicts".padStart(9)} ${"2 breaches".padStart(11)} ${"fines>0".padStart(8)} ${"first two".padStart(10)} ${"first three".padStart(12)} ${"all four".padStart(9)}`);
for(const k of ["honest","tricky","brazen"]){ const a = out.res[k];
  console.log(`  ${k.padEnd(8)} ${pc(a.b1,a.w).padStart(7)} ${pc(a.b2,a.w).padStart(9)} ${pc(a.b3,a.w).padStart(11)} `
    + `${pc(a.b4,a.w).padStart(8)} ${pc(a.b12,a.w).padStart(10)} ${pc(a.b123,a.w).padStart(12)} ${pc(a.banned,a.w).padStart(9)}`); }
console.log(`\n  rope: ${out.rope}`);
