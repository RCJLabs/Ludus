/* THE HANDOVER, TRACED — who takes the house, how old he really is, and what he inherits.

   v3.200.0 read three columns of `probes/boy.mjs` and wrote that two houses "are already in their
   second generation, where `succeed` installs a lanista of ri(22,31) and `eligibleSons`' own
   `age >= 40` gate shuts the boy out again". `succeed` resets the domus — the family goes to the
   forebear record and the new man starts his own — so after a succession there is no boy in
   `livingKids` for any gate to shut out. That sentence was an inference, and this is the trace it
   should have been. Per succession: the week, the heir's kind, whether he was a real child of the
   house (cid), his REAL age off his birth week against the age `succeed` rolled for him, and what
   the new man's first heir was. And the one number that decides whether #253 is an item at all:
   how many boys take the house before the toga age.

     node test/probes/handover.mjs [houses] [weeks] [seed]      (16 520 BOY reproduces v3.200.0's run) */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 520), SEED = process.argv[4] || "BOY";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const rows = [];
  for(let h=0; h<H; h++){
    const d = A.newGameState("Boy", "clean", `${SEED}-${h}`);
    let gen = 1, heirBefore = null, kidsBefore = [];
    for(let w=0; w<W; w++){
      if(d.over) break;
      /* what stands the week BEFORE a succession can happen */
      heirBefore = d.heir ? { kind:d.heir.kind, cid:d.heir.cid||null, name:d.heir.name } : null;
      kidsBefore = (A.domusOf(d).children||[]).map(c=>({ id:c.id, name:c.name, sex:c.sex, age:A.childAge(d,c) }));
      try { R.lanista(d); } catch(e){ break; }
      if((d.generation||1) > gen){
        const kid = heirBefore && heirBefore.cid ? kidsBefore.find(c=>c.id===heirBefore.cid) : null;
        rows.push({ house:h, week:d.week, kind: heirBefore ? heirBefore.kind : "?", real: kid ? kid.age : null,
          rolled: d.lanista ? d.lanista.age : null, kidsGone: (A.domusOf(d).children||[]).length === 0,
          passedOver: kidsBefore.filter(c=>!heirBefore || c.id!==heirBefore.cid).length,
          firstHeirAfter: null, retire: !!(d.forebears && d.forebears[d.forebears.length-1] && d.forebears[d.forebears.length-1].retired) });
        gen = d.generation;
      }
      const last = rows[rows.length-1];
      if(last && last.house===h && last.firstHeirAfter==null && d.heir) last.firstHeirAfter = d.heir.kind;
    }
  }
  const byKind = {}; for(const r of rows) byKind[r.kind] = (byKind[r.kind]||0)+1;
  const boys = rows.filter(r=>r.real!=null);
  return { successions: rows.length, byKind, realBoys: boys.length,
    underToga: boys.filter(r=>r.real < 16).length, rolledVsReal: boys.map(r=>`${r.real}→${r.rolled}`),
    allKidsGone: rows.every(r=>r.kidsGone), rows };
}, [H,W,SEED]);
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
