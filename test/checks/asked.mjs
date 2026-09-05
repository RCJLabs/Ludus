/* THE ASKS THROUGH THE SAME DOOR — second phase queue #245, phase 4

   `askWeek` picked a never-asked man at random, filtered the five conversations by what HE fits, and
   drew one by weight — brother 10 · match 9 · year 8 · burial 7 · woman 6, the rarest lightest. So a
   conversation only one man in the yard fits was raised only on the weeks the random man was him,
   and a `say()` that returned nothing spent the week's roll. The draw is one pool now — every
   (never-asked eligible man, conversation he fits) pair — drawn by weight with `askPick`, a
   conversation this house has never heard weighing ASK_FRESH times more, and the next pair tried
   when one has nothing to say. The man still asks once in his life.

   SIX ARMS:
   1 · THE POOL IS EVERY PAIR — each never-asked eligible man against each conversation he fits; a
       man already in `flags.asked` is in no pair; every kind has tickets of one or more.
   2 · THE DRAW IS JOINT — one man fitting `woman` and four fitting `match`: the pair's share of
       twenty thousand picks tracks its tickets over the pool's, not one man in five.
   3 · A CONVERSATION THE HOUSE HAS NEVER HEARD WEIGHS MORE — the same pool with `match` already
       heard: `woman`'s share rises by ASK_FRESH.
   4 · NOTHING TO SAY DOES NOT SPEND THE WEEK — with `brother` forced silent on a house where it fits
       every man, fifteen hundred rolls raise about as many asks as with him speaking, none brother.
   5 · A MAN ASKS ONCE — after his ask he is in `flags.asked` and in no later pool, and the kind is
       stamped on `flags.askLast`.
   6 · AND THE RARE ONES ARE HEARD — over seeded reference play, `woman` and `year` raised at all,
       where the man-first draw raised woman once in sixteen houses (ROADMAP v3.206.0). */
import { found, clearAll, installRope } from "../harness.mjs";

const HEARD_FLOOR = 1;   /* the rare tier raised at all on six seeded houses — set from the measurement in ROADMAP v3.206.0 */
export const name = "asked";
export const describe = "the week's conversation is drawn from every man and every thing he could raise, by weight, the unheard first";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"ASKED-1" });
  await clearAll(p, 12);
  await installRope(p);
  const r = await p.evaluate((HEARD_FLOOR)=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["ASKS","ASK_KEYS","ASK_DIE","ASK_FRESH","askPool","askPick","askWeight","askWeek","regardOf","activeG"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const out = { arms:[], notes:[] }; const say = (ok, why) => out.arms.push({ ok, why });
    let tick = 0;
    /* a house where exactly one man fits `woman` and the other four fit `match` (wins 4, a circuit man
       who beat them) — the woman-man fits match too, so the pool is five match pairs and one woman pair */
    const mk = () => { const d = A.newGameState("Ak", "clean", `ASKED-${tick++}`, null); d.week = 30;
      const men = A.activeG(d).slice(0, 5);
      men.forEach((g,i)=>{ g.wins = i===0 ? 6 : 4; g.losses = 1; g.regard = 70; g.family = null; g.flags = 0; g.status = "active"; });
      if(!d.circuit || !d.circuit.length) d.circuit = [{ id:9001, name:"Sorix", house:"a small house", beatYou:1, lostToYou:0, cls:"Murmillo" }];
      else d.circuit[0].beatYou = 1;
      d.flags.asked = []; d.flags.askLast = {}; d.collegium = null; d.fallen = [];
      return { d, men }; };

    /* 1 */
    { const { d, men } = mk(); const pool = A.askPool(d);
      const kinds = k => pool.filter(x=>x.k===k).length;
      const w = A.ASK_KEYS.map(k=>A.ASK_DIE[k] ? A.ASK_DIE[k].w : null);
      out.notes.push(`pool on the fixture: ${pool.length} pairs — ${A.ASK_KEYS.map(k=>`${k} ${kinds(k)}`).join(" · ")} · tickets ${A.ASK_KEYS.map((k,i)=>`${k} ${w[i]}`).join(" · ")}`);
      /* the clean opening has three men, not five — the first draft wrote "5" and failed on its own
         fixture; every expectation is derived from the men the house actually has */
      const M = men.length;
      d.flags.asked = [men[0].id]; const pool2 = A.askPool(d);
      say(M >= 3 && kinds("woman") === 1 && kinds("match") === M && w.every(x=>Number.isFinite(x) && x >= 1) && !pool2.some(x=>x.gid===men[0].id) && pool2.length === M - 1,
        `${M} men: woman pairs ${kinds("woman")} (want 1), match pairs ${kinds("match")} (want ${M}); an asked man leaves ${pool2.length} pairs (want ${M-1}); tickets all ≥1: ${w.every(x=>x>=1)}`); }

    /* 2 — joint, by weight */
    { const { d } = mk(); const pool = A.askPool(d);
      const N = 20000, first = {}; for(let i=0;i<N;i++){ const x = A.askPick(pool.slice(), d); first[x.k] = (first[x.k]||0) + 1; }
      const sum = pool.reduce((s,x)=>s + A.askWeight(d, x), 0);
      const want = k => pool.filter(x=>x.k===k).reduce((s,x)=>s + A.askWeight(d, x), 0) / sum;
      const got = k => (first[k]||0) / N;
      const off = Math.max(...["woman","match"].map(k => Math.abs(got(k) / want(k) - 1)));
      out.notes.push(`joint draw: woman first ${(got("woman")*100).toFixed(1)}% for ${(want("woman")*100).toFixed(1)}% · match ${(got("match")*100).toFixed(1)}% for ${(want("match")*100).toFixed(1)}%`);
      say(off < 0.12, `the pair's share tracks its tickets over the pool's to within ${(off*100).toFixed(1)}% (bar 12%) — not one man in five`); }

    /* 3 — freshness */
    { const { d } = mk(); const pool = A.askPool(d);
      const N = 20000; const share = () => { const f = {}; for(let i=0;i<N;i++){ const x = A.askPick(pool.slice(), d); f[x.k] = (f[x.k]||0)+1; } return (f.woman||0) / N; };
      const both = share();                                  /* neither heard */
      d.flags.askLast = { match: 10 };                       /* match heard, woman not */
      const fresh = share();
      /* expected: woman's tickets × ASK_FRESH against match's plain tickets */
      const nM = pool.filter(x=>x.k==="match").length;
      const wW = A.ASK_DIE.woman.w * A.ASK_FRESH, wM = nM * A.ASK_DIE.match.w, w0 = A.ASK_DIE.woman.w * A.ASK_FRESH, m0 = nM * A.ASK_DIE.match.w * A.ASK_FRESH;
      const want = wW / (wW + wM), want0 = w0 / (w0 + m0);
      out.notes.push(`freshness: woman first ${(both*100).toFixed(1)}% with nothing heard (want ${(want0*100).toFixed(1)}), ${(fresh*100).toFixed(1)}% with match heard (want ${(want*100).toFixed(1)}) · ASK_FRESH ${A.ASK_FRESH}`);
      say(A.ASK_FRESH > 1 && Math.abs(fresh / want - 1) < 0.12 && fresh > both,
        `an unheard conversation's share ${(fresh*100).toFixed(1)}% against ${(want*100).toFixed(1)}% expected at ASK_FRESH ${A.ASK_FRESH} (bar 12%)`); }

    /* 4 — nothing to say does not spend the week.
       A house where brother fits every man and woman fits one: with brother forced silent, the asks
       raised must be about as many as with brother speaking (the roll is 6% either way), and none of
       them brother. A draw that returned on a silent say() would raise 40-45% fewer here — measured,
       the sabotage reads about half the speaking count — so the bar is 0.75 on three thousand rolls,
       where both sides sit two deviations clear of it. */
    { const house = () => { const d = A.newGameState("Ak", "clean", `ASKED-S-${tick++}`, null); d.week = 30;
        const men = A.activeG(d).slice(0, 4); men.forEach((g,i)=>{ g.wins = i===0 ? 6 : 2; g.losses = 1; g.regard = 70; g.family = null; g.flags = 0; });
        d.flags.asked = []; d.flags.askLast = {}; d.circuit = (d.circuit||[]).map(f=>({ ...f, beatYou:0 }));
        try { for(let j=1;j<men.length;j++) A.addTie(d, men[0].id, men[j].id, "brother", 60); } catch(e){}
        return d; };
      const roll = silent => { let raised = 0, brothers = 0, fit = 0; const rawSay = A.ASKS.brother.say;
        if(silent) A.ASKS.brother.say = () => null;
        try { for(let i=0;i<3000;i++){ const d = house(); const pool = A.askPool(d); if(!pool.some(x=>x.k==="brother")) continue; fit++;
            A.askWeek(d); if(d.pendingEvent && d.pendingEvent.id === "ask"){ raised++; if(d.pendingEvent.data.k === "brother") brothers++; } } }
        finally { A.ASKS.brother.say = rawSay; }
        return { raised, brothers, fit }; };
      const sp = roll(false), si = roll(true);
      const ratio = sp.raised ? si.raised / sp.raised : 0;
      out.notes.push(`silent brother: ${si.fit} houses where brother fit · speaking ${sp.raised} raised (${sp.brothers} brother) · silent ${si.raised} raised (${si.brothers} brother) · ratio ${ratio.toFixed(2)}`);
      say(si.fit >= 1000 && sp.raised >= 60 && si.brothers === 0 && ratio >= 0.75,
        `with brother silent ${si.raised} asks were raised against ${sp.raised} with him speaking (ratio ${ratio.toFixed(2)}, bar 0.75), ${si.brothers} of them brother`); }

    /* 5 — once */
    { let done = null; for(let i=0;i<400 && !done;i++){ const { d } = mk(); A.askWeek(d); if(d.pendingEvent && d.pendingEvent.id==="ask") done = d; }
      if(!done) say(false, `no ask raised in 400 rolls on a house where five men fit`);
      else { const gid = done.pendingEvent.data.gid, k = done.pendingEvent.data.k;
        const inAsked = (done.flags.asked||[]).includes(gid), stamped = done.flags.askLast && done.flags.askLast[k] === done.week;
        const later = A.askPool(done).some(x=>x.gid===gid);
        say(inAsked && stamped && !later, `the man who asked is in flags.asked (${inAsked}), the kind is stamped on askLast (${stamped}), and he is in no later pool (${!later})`); } }

    /* 6 — the house hears more of the five, on seeded reference play */
    { const H = 6, W = 260; const heard = []; const fired = {};
      const raw = {}; let cur = new Set();
      for(const k of A.ASK_KEYS){ const f = A.ASKS[k].say; raw[k] = f; A.ASKS[k].say = function(d,g){ const r = f.call(this,d,g); if(r){ fired[k]=(fired[k]||0)+1; cur.add(k); } return r; }; }
      try { for(let h=0; h<H; h++){ const d = A.newGameState("Ah"+h, "clean", `ASKED-RUN-${h}`, null); cur = new Set();
          for(let w=0; w<W; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
          heard.push(cur.size); } }
      finally { for(const k of A.ASK_KEYS) A.ASKS[k].say = raw[k]; }
      heard.sort((a,b)=>a-b); const p50 = heard[Math.floor(heard.length/2)];
      const rare = (fired.woman||0) + (fired.year||0);
      out.notes.push(`${H} houses x ${W}: distinct conversations heard ${heard.join("/")} (p50 ${p50}) · fired ${A.ASK_KEYS.map(k=>`${k} ${fired[k]||0}`).join(" · ")} · rare (woman+year) ${rare}`);
      say(rare >= HEARD_FLOOR, `the rare conversations were raised ${rare} time(s) across ${H} seeded houses (floor ${HEARD_FLOOR}; the man-first draw raised woman once in sixteen houses)`); }
    return out;
  }, HEARD_FLOOR);
  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  for(const n of r.notes) lines.push(n);
  r.arms.forEach((a,i)=>{ lines.push(`${i+1}. ${a.ok ? "held" : "FAILED"} — ${a.why}`); if(!a.ok) bad.push(`arm ${i+1}: ${a.why}`); });
  return { pass: bad.length === 0 && !errors.length, why: bad[0] || null, lines };
}
