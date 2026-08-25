/* THE EDITOR: A NAME LIST, A FLAG, AND ONE CONDITIONAL READER

   #205 says the only way to influence the editor is to bribe him, and that `d.flags.editorBought`
   and the `EDITORS` table mean "the model is there". Before building a legitimate route, read what
   the model actually is:

     EDITORS              five names. Used ONCE, to sign a booking line. There is no editor entity,
                          no standing relationship, nothing that persists between cards.
     editorBought         a 12-week flag with exactly ONE reader in the whole file, and it is on the
                          FALLBACK branch of `pickAnyOpp`:

                              if(!pool.length) return { opp: genOpponent(editorBought(d)
                                ? Math.max(0, tier-1) : tier, undefined, d), ... };

   So buying the editor softens your opponent only on the weeks the circuit had **nobody at all** in
   the tier band and the game had to invent a man. That is the number this probe exists for: if the
   circuit is nearly always populated, then the one thing the bribe buys is bought almost never, and
   #205 is not "the legitimate route is missing" — it is that the illegitimate one barely works.

   FALSIFIES the item's "the model is there" if the fallback is rare: there would be no model to
   attach a legitimate route to, and the release has to build one rather than reuse it.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 300);
const SEED = process.argv[4] || "EDITOR";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const readers = [...src.matchAll(/editorBought\(d\)/g)].length;
const edUses = [...src.matchAll(/\bEDITORS\b/g)].length - 1;   /* minus the definition */
const size = (src.match(/const CIRCUIT_SIZE = (\d+)/)||["","?"])[1];
const bands = (src.match(/const bands = (\[\[[^\]]*\][^;]*)\];/)||["","?"])[1];
console.log(`editorBought has ${readers} reader(s) in the file · EDITORS is used ${edUses} time(s) beyond its definition`);
console.log(`the circuit holds ${size} men · pickAnyOpp's bands: ${bands}]\n`);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const arm = async (opts) => inside(p, ([H, W, SEED, opts]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  R.reset();
  const T = { houses:0, weeks:0, bought:0, boughtWeeks:0, asks:0,
              /* the only thing the flag can change: how often pickAnyOpp has to invent a man */
              calls:0, fellBack:0, byTier:[0,0,0,0], fellByTier:[0,0,0,0] };
  for(let h=0; h<H; h++){
    const d = A.newGameState("Ed","clean",SEED+"-"+h, null); T.houses++;
    for(let w=0; w<W && !d.over; w++){
      R.lanista(d, opts); T.weeks++;
      if(A.editorBought(d)) T.boughtWeeks++;
      /* the fallback rate, read off the game's own pool test at every tier, without drawing:
         `pickAnyOpp` would invent a man exactly when this filter is empty */
      const avg = f => A.STATS.reduce((s,k)=>s+f[k],0)/6;
      const BANDS = [[22,46],[38,60],[54,76],[66,99]];
      for(let t=0;t<4;t++){
        const pool = (d.circuit||[]).filter(f=>{ const a=avg(f); return a>=BANDS[t][0]-12 && a<=BANDS[t][1]+12; });
        T.calls++; T.byTier[t]++;
        if(!pool.length){ T.fellBack++; T.fellByTier[t]++; }
      }
    }
    T.bought += (d.flags && d.flags.editorBought) ? 1 : 0;
  }
  return { T, rope: R.say() };
}, [H, W, SEED, opts]);

const C = await arm({});
const G = await arm({ gambit:4 });
await browser.close(); server.close();

const pc = (n,dd) => dd ? (n/dd*100).toFixed(2)+"%" : "-";
console.log(`=== ${C.T.houses} houses x ${W} weeks an arm · control ${C.T.weeks} house-weeks, gambit:4 ${G.T.weeks}\n`);
for(const [lab, X] of [["control (never bribes)", C], ["gambit:4 (bribes as it can)", G]]){
  const T = X.T;
  console.log(`  ${lab}`);
  console.log(`     weeks the editor was BOUGHT              ${String(T.boughtWeeks).padStart(6)}  ${pc(T.boughtWeeks,T.weeks)} of weeks`);
  console.log(`     tier-band lookups made                   ${String(T.calls).padStart(6)}`);
  console.log(`     ...that would have to INVENT a man       ${String(T.fellBack).padStart(6)}  ${pc(T.fellBack,T.calls)}`);
  console.log(`     by tier: ${T.fellByTier.map((v,i)=>`t${i} ${pc(v,T.byTier[i])}`).join(" · ")}`);
  console.log("");
}
const overlap = (G.T.boughtWeeks / (G.T.weeks||1)) * (G.T.fellBack / (G.T.calls||1));
console.log(`  >>> THE FLAG HAS ${readers} READER AND IT IS ON A FALLBACK.`);
console.log(`      The circuit is empty in a tier band ${pc(G.T.fellBack, G.T.calls)} of the time, and the editor is bought`);
console.log(`      ${pc(G.T.boughtWeeks, G.T.weeks)} of weeks even under a player bribing every four weeks. Both together:`);
console.log(`      about ${(overlap*100).toFixed(3)}% of lookups are ones where buying him changes anything at all.`);
console.log(`  >>> ${G.T.fellBack === 0
  ? "The fallback NEVER fires, so the one thing a bribe buys is bought never. #205's model is a name list and a dead flag."
  : `#205's "the model is there" is generous: it is five names used once for a booking line, and a flag whose single reader fires on ${pc(G.T.fellBack,G.T.calls)} of lookups.`}`);
console.log(`\n  control: ${C.rope}`);
console.log(`  gambit:  ${G.rope}`);
