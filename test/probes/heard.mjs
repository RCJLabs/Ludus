/* WHAT THE HOUSE HEARD — the asks before and after #245 phase 4.

   `askWeek` picks a never-asked man at random, filters the five conversations by what HE fits, and
   draws one by weight (brother 10 · match 9 · year 8 · burial 7 · woman 6) — the rarest lightest. So
   `woman` is raised only on the weeks the random man is the man who fits it, and a say() that
   returns nothing spends the week's 6% roll. Counted here on seeded reference play, per house: the
   asks raised by kind, the distinct kinds a house ever heard, how often each kind was FIT for some
   eligible man on a home week (its reach), and how many rolls were spent on nothing.

     node test/probes/heard.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SEED = process.argv[4] || "AUDIT";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const KEYS = A.ASK_KEYS || Object.keys(A.ASKS);
  const fired = {}, fit = {}, distinct = []; let weeks = 0, home = 0, spent = 0, saidNull = 0;
  /* a say() that returns nothing is a roll spent — wrap to count it */
  /* askWeek calls say() only for the kind it chose, so a say that returns something IS the kind
     raised — the attribution needs no record in the game */
  let heardNow = new Set();
  const raw = {}; for(const k of KEYS){ const f = A.ASKS[k].say; raw[k] = f;
    A.ASKS[k].say = function(d, g){ const r = f.call(this, d, g); if(!r) saidNull++; else { fired[k] = (fired[k]||0) + 1; heardNow.add(k); } return r; }; }
  for(let h=0; h<H; h++){ const d = A.newGameState("Hd"+h, "clean", `${SEED}-${h}`, null);
    const heard = heardNow = new Set();
    for(let w=0; w<W; w++){ if(d.over) break;
      if(!d.rome && !d.city && !d.travel){ home++;
        const men = A.activeG(d).filter(g=>A.regardOf(g) >= 45 && ((g.wins||0)+(g.losses||0)) >= 3 && !(d.flags.asked||[]).includes(g.id));
        for(const k of KEYS) if(men.some(g=>{ try { return !!A.ASKS[k].need(d, g); } catch(e){ return false; } })) fit[k] = (fit[k]||0) + 1; }
      try { R.lanista(d); } catch(e){ break; } weeks++;
    }
    distinct.push(heard.size); }
  for(const k of KEYS) A.ASKS[k].say = raw[k];
  return { weeks, home, fired, fit, saidNull, distinct: distinct.sort((a,b)=>a-b), keys: KEYS };
}, [H,W,SEED]);
console.log(JSON.stringify(out));
await browser.close(); server.close();
