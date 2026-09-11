/* WHAT THE RITE IS WORTH, AND WHETHER THE FREE DOOR IS WORTH ANYTHING — #261's build half.

     node test/probes/pyre.mjs 16 420 2      # houses, weeks, seed sets

   v3.252.0 answered the first half of #261's design question — "measure what a rite is worth
   against the 377 it would answer" — and the answer was the rebellion arc: 12.0%/8.0% of house-
   weeks under the reference against 1.3%/0.6% under `bury`. That leaves the second half, which is
   the older claim from #224: **`none` — the interface's free door, "he goes into the ground and
   the week goes on" — is dominated by saying nothing at all.**

   THE ARITHMETIC OF THAT CLAIM, at today's constants, because it is not the flat domination #224's
   one-line summary suggests:

     holdMunera(d, gid, "none")   unrest +4   regard  was - 6      (kin: was - 10.8)   morale -3/-9
     riteLapse                    unrest  0   regard  min(was - 6, max(was - 6.9, 20))
                                                      (kin: min(was - 10.8, max(was - 14.4, 8)))

   `riteLapse` takes whichever is WORSE for the man — the pit's own or the floored surcharge — so
   ABOVE the floor a lapse costs 6.9 regard against `none`'s 6.0, and `none` is buying 0.9 points of
   regard for 4 unrest. AT the floor the surcharge is clamped and both come to the same number, so
   `none` is buying NOTHING for 4 unrest and is strictly dominated. Whether the door is dominated is
   therefore a question about where the roster's regard actually sits when a man goes into the
   ground, and that is measured here rather than argued.

   FIVE ARMS, so the two doors are priced apart and against the reference:
     ref     never buries anyone (the rope as every figure in this project has it)
     none    takes the free door every time
     rite    the cheap rite only          (unrest -7,  regard +5,  fame 2,  mercy 5)
     games   full games only              (unrest -19, regard +14, fame 11, mercy 14)
     best    the dearest spare() covers   (`bury:true`, what v3.252.0 measured)

   AND THE OTHER QUESTION THIS ASKS IS WHETHER BURYING IS DOMINANT, which is the mirror of the one
   the item poses. The `bury` arm in v3.252.0 lived LONGER than the reference (4,368 against 3,538
   house-weeks) and ended better, so if it is also no poorer then the rite is a free win rather than
   a trade, and a free win is as much a design fault as a dominated door. The coin rows are here for
   that. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SETS = +(process.argv[4] || 2);
const ARMS = [["ref",{}], ["none",{bury:"none"}], ["rite",{bury:"rite"}],
              ["games",{bury:"games"}], ["best",{bury:true}]];

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, SETS, ARMS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","activeG","regardOf","liquidate","holdMunera","RITES"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const med = a => { if(!a.length) return 0; const s=a.slice().sort((x,y)=>x-y); return s[Math.floor(0.5*s.length)]; };

  const arm = (o, seed) => {
    let weeks=0, risings=0, rebWeeks=0, stage3=0, marked=0, lapsed=0, answered=0, spent=0;
    const fired={}, ends={}, unrest=[], regard=[], morale=[], gold=[], fund=[], fame=[];
    /* the roster's regard on the weeks a man actually lapses — the floor question, sampled where
       it binds rather than over all weeks */
    const atLapse = [], floorAt = [];
    for(let i=0;i<H;i++){
      const d = A.newGameState("Py","clean",`${seed}-${i}`);
      const seen=[]; let prev=[], wasRebel=false, top=0, wasLapsed=0;
      for(let w=0;w<W;w++){
        if(d.over) break;
        const g0 = d.gold;
        let did=null; try{ did=R.lanista(d,o); }catch(e){ break; }
        weeks++;
        if(did) for(const k of Object.keys(did))
          if(typeof did[k]==="number" && k.startsWith("buried:")) fired[k]=(fired[k]||0)+did[k];
        { const cur=d.unburied||[], had=new Set(prev);
          for(const m of cur) if(!had.has(m)) seen.push(m);
          prev=cur.slice(); }
        const nowLapsed = seen.filter(m=>m.lapsed).length;
        if(nowLapsed > wasLapsed){
          const live = A.activeG(d).map(g=>A.regardOf(g));
          if(live.length){ atLapse.push(med(live)); floorAt.push(live.filter(x=>x <= 22).length / live.length); }
          wasLapsed = nowLapsed;
        }
        const reb = d.rebellion;
        if(reb){ rebWeeks++; if(!wasRebel) risings++; wasRebel=true; const st=reb.stage||0; if(st>top) top=st; }
        else wasRebel=false;
        if(w % 8 === 0){
          unrest.push(d.unrest||0);
          const live = A.activeG(d);
          if(live.length){ regard.push(med(live.map(g=>A.regardOf(g)))); morale.push(med(live.map(g=>g.morale||0))); }
        }
      }
      if(top>=3) stage3++;
      marked += seen.length;
      lapsed += seen.filter(m=>m.lapsed).length;
      answered += seen.filter(m=>m.done && !m.lapsed).length;
      /* what the rites cost, priced from the game's own table on the men that actually took one */
      for(const m of seen) if(m.done && !m.lapsed && A.RITES[m.done]) spent += A.RITES[m.done].cost(m);
      gold.push(Math.round(d.gold));
      let f=0; try{ f=A.liquidate(d).total; }catch(e){}
      fund.push(Math.round(f)); fame.push(Math.round(d.fame||0));
      const k = d.over ? d.over.kind : "survived";
      ends[k]=(ends[k]||0)+1;
    }
    return { weeks, risings, rebWeeks, stage3, marked, lapsed, answered, spent:Math.round(spent),
      fired, ends, share: weeks?rebWeeks/weeks:0,
      unrestP50:Math.round(10*med(unrest))/10, regardP50:Math.round(10*med(regard))/10,
      moraleP50:Math.round(10*med(morale))/10,
      goldP50:med(gold), fundP50:med(fund), fameP50:med(fame),
      regardAtLapse:Math.round(10*med(atLapse))/10,
      /* the MEDIAN share would read 0% for a distribution where the floor binds in a tenth of
         weeks, so the max and the mean are here too — a floor that never binds has to be shown
         never binding, not shown to be rare in the middle */
      floorMed: floorAt.length ? Math.round(1000*med(floorAt))/10 : 0,
      floorMean: floorAt.length ? Math.round(1000*floorAt.reduce((a,b)=>a+b,0)/floorAt.length)/10 : 0,
      floorMax: floorAt.length ? Math.round(1000*Math.max(...floorAt))/10 : 0,
      lapseSamples:atLapse.length };
  };

  const res = {};
  for(let s=0;s<SETS;s++){
    const seed = `PYRE${s}`;
    for(const [nm,o] of ARMS){ (res[nm] = res[nm] || []).push(arm(o, seed)); }
  }
  return { res, arms:ARMS.map(a=>a[0]) };
}, [H, W, SETS, ARMS]);

if(out.why){ console.log("HANDLE:", out.why); await browser.close(); server.close(); process.exit(1); }

const pad=(s,n)=>String(s).padEnd(n), rp=(s,n)=>String(s).padStart(n);
console.log(`\nWHAT THE RITE IS WORTH — ${H} houses x ${W} weeks x ${SETS} seed sets an arm\n`);
const cols = [["weeks","weeks"],["risings","risings"],["reb %",a=>(100*a.share).toFixed(1)],
  ["st3","stage3"],["marked","marked"],["lapsed","lapsed"],["answ","answered"],
  ["spent","spent"],["unrest","unrestP50"],["regard","regardP50"],["morale","moraleP50"],
  ["gold","goldP50"],["fund","fundP50"],["fame","fameP50"]];
for(let s=0;s<SETS;s++){
  console.log(`  set ${s}` + cols.map(c=>rp(c[0],9)).join(""));
  for(const nm of out.arms){
    const a = out.res[nm][s];
    console.log(`  ${pad(nm,6)}` + cols.map(c=>rp(typeof c[1]==="function"?c[1](a):a[c[1]],9)).join(""));
  }
  console.log("");
}
console.log(`THE FLOOR QUESTION — the roster's regard on the weeks a man lapses:`);
for(const nm of out.arms){
  const r = out.res[nm].map(a=>`regard p50 ${a.regardAtLapse} · at/under 22: p50 ${a.floorMed}% mean ${a.floorMean}% worst week ${a.floorMax}% (${a.lapseSamples} lapses)`);
  console.log(`  ${pad(nm,6)} ${r.join("   |   ")}`);
}
console.log(`\nRITES TAKEN:`);
for(const nm of out.arms)
  console.log(`  ${pad(nm,6)} ${out.res[nm].map(a=>Object.entries(a.fired).map(([k,v])=>k.slice(7)+" "+v).join(", ")||"none").join("   |   ")}`);
console.log(`\nENDINGS:`);
for(const nm of out.arms)
  console.log(`  ${pad(nm,6)} ${out.res[nm].map(a=>Object.entries(a.ends).sort((x,y)=>y[1]-x[1]).map(([k,v])=>k+" "+v).join(", ")).join("   |   ")}`);

await browser.close(); server.close();
