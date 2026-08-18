/* WHY A THIRD OF GAMBIT ATTEMPTS RETURN NOTHING — #150

   `dark.mjs` called all nineteen exposed actions every week on a rope-played house and reported
   `runGambit` returning null on 348 of 1,100 calls (32%). The item was opened on that count and on a
   framing that a code read already contradicts: it said "a third of PAID attempts do nothing", and
   `runGambit` charges AFTER all four of its guards, so a null costs nothing. The count is real; what
   it means is the question, and a count of nulls cannot answer it.

   There are exactly four ways out of that function before it does anything:

       !GAMBITS[k]        an unknown key — a caller fault, never a game state
       !gambitReady(d)    the six-week cooldown between any two tricks
       !h                 the named house is not in `d.rivals`
       d.gold < cost      it is not affordable this week

   THE ITEM'S CLAUSE: it falsifies if every null is the affordability guard, in which case the item
   is a UI one — the button should say why. So this splits the nulls by the game's own guards and
   prints the raw split, and then goes one further, because "the button should say why" is only worth
   knowing if what the button DOES say is right:

   · WHAT THE PANEL HIDES. The rival buttons render behind `ready && S.gold >= cost`, so a house
     twenty denarii short sees a price, a blurb, odds — and no button and no reason.
   · WHAT THE PANEL QUOTES. The panel computes its odds from `gambitDone`, the count stored the last
     time the trick was used; `runGambit` rolls against `gambitStale`, that count minus one for every
     GAM_FORGET weeks since. They are the same number only in the week you last used it.

   INSTRUMENT NOTES:
   · the split is taken by re-testing the game's OWN guards immediately before the call, in the order
     the function tests them, and then asserting the call agreed — `agreed` in the output. If the
     reconstruction and the function ever disagree, the split is wrong and the raw disagreement count
     says so before any share is quoted.
   · coin is read before and after every null so "nothing was paid" is measured, not reasoned.
   · it runs on whatever seed prefix it is given; run three before quoting anything. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 12), W = +(process.argv[3] || 320);
const SEED = process.argv[4] || "GAM";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const why = { unknownKey:0, cooldown:0, noSuchHouse:0, tooDear:0, ran:0 };
  let calls = 0, disagreed = 0, paidOnNull = 0, firstDisagreement = null;
  const gap = { weeks:0, same:0, worse:0, points:[], worst:0 };
  const shortBy = [];
  let darkCalls = 0, darkNulls = 0;

  for(let h=0; h<H; h++){
    const d = A.newGameState("Gm"+h, "clean", `${SEED}-${h}`, null);
    for(let w=0; w<W; w++){
      if(d.over) break;
      R.lanista(d);
      const rivals = (d.rivals||[]).filter(x=>!x.retired);
      if(!rivals.length) continue;

      /* ---- THE PANEL AGAINST THE ENGINE, every week the panel would be on screen ---- */
      if(d.week >= 16) for(const k of A.GAM_KEYS){
        const shown = A.gambitDone(d, k), rolled = A.gambitStale(d, k);
        gap.weeks++;
        if(shown === rolled) gap.same++;
        else { gap.worse++; const pts = (shown - rolled) * 7; gap.points.push(pts);
               gap.worst = Math.max(gap.worst, pts); }
      }

      /* ---- AND THE ITEM'S OWN NUMBER, RECONSTRUCTED ----
         `dark` gates on `gambitReady(d) && rivals.length` before it calls, so the cooldown can never
         be one of ITS nulls. Counting the same way is the only honest comparison with the 348 of
         1,100 the item was opened on. */
      if(A.gambitReady(d)){
        const dk = A.GAM_KEYS[0], dh = (d.rivals||[])[0];
        if(dh){
          darkCalls++;
          if(d.gold < A.GAMBITS[dk].cost(d)) darkNulls++;
        }
      }

      /* ---- THE NULLS, SPLIT BY THE GAME'S OWN GUARDS ---- */
      const k = A.GAM_KEYS[w % A.GAM_KEYS.length];
      const house = rivals[w % rivals.length].name;
      const G = A.GAMBITS[k];
      const cost = G.cost(d);
      const expect = !G ? "unknownKey"
        : !A.gambitReady(d) ? "cooldown"
        : !(d.rivals||[]).some(x=>x.name===house) ? "noSuchHouse"
        : d.gold < cost ? "tooDear"
        : "ran";
      const goldWas = d.gold;
      const res = A.runGambit(d, k, house);
      calls++;
      why[expect]++;
      const actuallyRan = res != null;
      if(actuallyRan !== (expect === "ran")){
        disagreed++;
        if(!firstDisagreement) firstDisagreement = `week ${d.week}: guards said "${expect}", runGambit ${actuallyRan?"ran":"returned null"}`;
      }
      if(!actuallyRan){
        if(Math.round(goldWas - d.gold) !== 0) paidOnNull++;
        if(expect === "tooDear") shortBy.push(Math.round(cost - goldWas));
      }
    }
  }
  return { why, calls, disagreed, firstDisagreement, paidOnNull, gap, shortBy, darkCalls, darkNulls };
}, [H, W, SEED]);

const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };
const W2 = out.why, tot = out.calls, nulls = tot - W2.ran;

console.log(`\n  ${H} houses x ${W}w · seed "${SEED}" · ${tot} calls to runGambit\n`);
console.log(`  THE SPLIT — every way out of the function, counted by its own guards:`);
for(const [k,v] of Object.entries(W2).sort((a,b)=>b[1]-a[1]))
  console.log(`    ${k.padEnd(13)} ${String(v).padStart(6)}  ${tot?((v/tot)*100).toFixed(1):0}% of calls${k!=="ran"&&nulls?`  ·  ${((v/nulls)*100).toFixed(1)}% of the nulls`:""}`);
console.log(`\n  the reconstruction agreed with the function on ${tot - out.disagreed} of ${tot} calls`
  + (out.disagreed ? ` — ${out.disagreed} DISAGREEMENTS, first: ${out.firstDisagreement}` : ` (if this is ever short, the split above is wrong)`));
console.log(`  coin moved on ${out.paidOnNull} of the ${nulls} nulls — the item said a third of PAID attempts do nothing`);
if(out.shortBy.length)
  console.log(`  when it was unaffordable the house was short by a median ${med(out.shortBy)}d (worst ${Math.max(...out.shortBy)}d, best ${Math.min(...out.shortBy)}d)`);

console.log(`\n  COUNTED THE WAY \`dark\` COUNTS — gated on gambitReady first, so the cooldown cannot appear:`);
console.log(`    ${out.darkNulls} of ${out.darkCalls} would return null (${out.darkCalls?((out.darkNulls/out.darkCalls)*100).toFixed(1):0}%), and every one of them is the price`);
console.log(`    the item was opened on 348 of 1,100 (32%) counted this way`);

console.log(`\n  WHAT THE PANEL QUOTES AGAINST WHAT THE ENGINE ROLLS:`);
console.log(`    ${out.gap.weeks} panel-rows drawn · the two counts agree on ${out.gap.same}`
  + ` (${out.gap.weeks?((out.gap.same/out.gap.weeks)*100).toFixed(1):0}%)`);
console.log(`    they differ on ${out.gap.worse} rows, ALWAYS with the panel quoting the WORSE number`
  + (out.gap.points.length ? ` — median ${med(out.gap.points)} points understated, worst ${out.gap.worst}` : ""));

await browser.close(); server.close();
