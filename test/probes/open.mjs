/* THE OPENING ON A FIXED POLICY — "has it moved", answered properly

   `survive` asks whether a new house gets off the ground, and it asks with FIVE houses through five
   real browsers. That is the right shape for a catastrophe net and the wrong shape for an economy
   regression: #142 measured its `standing` reading as nearly INERT — 39 of 60 clean, 44 with the
   weekly bill tripled, 39 with the opening gold cut from 800 to 150, 40 with bout purses at 30% —
   while `men` moved 128 / 123 / 94 / 104. At five houses a 27% fall in men scales to about
   10.7 -> 7.8, which is inside ordinary variance, so no bar on that sample can see it.

   Sixty headless houses can. This is the instrument the project's own note asked for years ago:
   "Ask 'has it moved' with a fixed policy across builds, not with the check" — and its real power is
   that when nothing relevant changes, the SIGNATURE is identical rather than merely close. That is
   how v3.33.0's (0,4) was proven a false failure: 60 houses on v3.32.0 and on v3.33.0 gave the same
   week, men, gold and ending house for house, so the answer was not "within noise", it was "no path
   a new house executes differs".

   Run it on two builds and diff the SIG line. Same signature = the opening is untouched. */
import { serve, open } from "../harness.mjs";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(()=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const rows = [];
  for(let h=0; h<60; h++){
    const d = A.newGameState("Op"+h, "clean", `OPEN-${h}`, null);
    for(let w=0; w<26; w++){ if(d.over) break; R.lanista(d); }
    rows.push(`${d.week}/${A.activeG(d).length}/${Math.round(d.gold)}/${d.over?d.over.kind:"up"}`);
  }
  const standing = rows.filter(r=>+r.split("/")[1] > 0).length;
  const men = rows.reduce((s,r)=>s+ +r.split("/")[1], 0);
  return { sig: rows.join(" "), standing, men };
});
console.log(`standing ${out.standing} of 60 · men ${out.men}`);
console.log("SIG " + out.sig);
await browser.close(); server.close();
