/* ---- THE HARNESS ----
   Everything a check needs to sit down in front of the game: a server, a browser,
   a founded house, and the handful of gestures that turned out to matter.

   Three of these encode things learned the hard way and are worth keeping:

   - autosave is debounced 500ms, so reading the slot straight after a change reads
     the state before it. waitSaved() waits past the debounce.
   - the gatekeeper's teaching panels and the opening guide are not .modalwrap and
     will sit in front of everything until answered. clearAll() knows their words.
   - modals do not stack in DOM order; the one on top is the one with the highest
     computed z-index. top() sorts before it looks. */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const MIME = { ".html":"text/html", ".js":"text/javascript", ".json":"application/json",
  ".png":"image/png", ".webmanifest":"application/manifest+json", ".css":"text/css" };

/* The test build is served AT THE ROOT, not from /dist/. It registers a service
   worker with a relative path, and from /dist/test.html that resolves to a URL that
   is not there — every check then drowned in the same two 404 console errors and
   called them page errors. Serving it as "/" makes sw.js resolve the way it does in
   a real install, and the noise goes away because the cause does. */
export function serve({ page = "dist/test.html" } = {}){
  const server = http.createServer((req,res)=>{
    const rel = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(ROOT, rel === "/" ? page : rel);
    if(!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, buf)=>{
      if(err){ res.writeHead(404).end("not found"); return; }
      res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
      res.end(buf);
    });
  });
  return new Promise(ok => server.listen(0, "127.0.0.1", ()=> ok({ server, port: server.address().port })));
}

/* playwright lives outside the repo in this environment; find it either way */
export async function chromium(){
  for(const spec of ["playwright", "/opt/node22/lib/node_modules/playwright/index.js"]){
    try { const m = await import(spec); return (m.default || m).chromium; } catch(e){}
  }
  throw new Error("playwright not found — npm i -D playwright, or run where it is installed");
}

export async function open(port, { page = "/", width = 390, height = 844 } = {}){
  const ch = await chromium();
  const browser = await ch.launch();
  const ctx = await browser.newContext({ viewport:{ width, height }, isMobile:true, hasTouch:true });
  const p = await ctx.newPage();
  await p.route("**/fonts.g**/**", r=>r.abort());
  const errors = [];
  p.on("pageerror", e => errors.push(String(e.message)));
  p.on("console", m => { if(m.type()==="error") errors.push("console: " + m.text().slice(0,160)); });
  await p.goto(`http://127.0.0.1:${port}${page}`, { waitUntil:"load" });
  await p.waitForTimeout(900);
  await installRope(p);
  return { browser, p, errors };
}

/* ---- THE ROPE, ONCE, FOR EVERY CHECK ----
   #116 measured what the suite was losing by hand-rolling this. `doFight` and its three sister
   engines return at their `res.unfinished` branch — the balance, where the box is asked for a word
   — BEFORE they credit anything, and they mutate NOTHING while a bout is held. Measured over 400
   bouts a row: **0.0% of first-blood bouts reach the balance, 60.5% of standard and 59.3% sine**,
   and in 721 of 721 held bouts the purse, the fatigue and the steel had all not moved.

   Three checks called the engines and never looked at `r.crux` at all, so ~60% of their bouts never
   happened. Thirteen more resolved exactly ONE word and then discarded anything that came back to
   the balance a second time — `simulateFight` allows three — which is another **26.8% of all
   standard bouts, 44.2% of the held ones**.

   So it is installed on the page instead of copied into each check, and `probe` fails any check
   that reaches for an engine without it. Keep the counters: a check that prints its own crux rate
   is a check whose rope can be seen to be working. */
export async function installRope(p){
  await p.evaluate(()=>{
    if(!window.__LVDVS || window.__ROPE) return;
    const A = window.__LVDVS;
    const R = { bouts:0, held:0, rounds:0, unresolved:0, threw:0 };
    const fin = (fn, args) => { try { return fn(...args); } catch(e){ R.threw++; return { __err:e.message }; } };

    /* answer until the sand is quiet, up to the three words the sim can ask for and one spare */
    const answer = (d, res, choice) => {
      let r = res, n = 0;
      while(r && r.crux && n < 4){
        const pd = r.pending; pd.beats = r.beats; n++; R.rounds++;
        r = pd.melee    ? fin(A.doMelee,     [d, pd.ids, pd.offer, pd, choice || null])
          : pd.venatio  ? fin(A.doVenatio,   [d, pd.gid, pd.offer, pd.tactic, pd, choice || null])
          : pd.pair     ? fin(A.doPairFight, [d, pd.ids, pd.offer, pd.tactic, pd, choice || null])
          :               fin(A.doFight,     [d, pd.gid, pd.offer, pd.tactic, pd.bet, pd, choice || null]);
        if(r && r.__err) break;
      }
      if(r && r.crux) R.unresolved++;
      return { res:r, rounds:n };
    };

    /* run one offer with whichever engine it belongs to, and answer it */
    const run = (d, offer, ids, opts) => {
      const o = opts || {};
      const list = [].concat(ids || []);
      if(!offer || !list.length) return { ran:false };
      let r = offer.melee   ? fin(A.doMelee,     [d, list.slice(0,3), offer, null, null, o.tactic || "measured"])
            : offer.pair    ? fin(A.doPairFight, [d, list.slice(0,2), offer, o.tactic || "measured", null, null])
            : offer.venatio ? fin(A.doVenatio,   [d, list[0], offer, o.tactic || "measured", null, null])
            :                 fin(A.doFight,     [d, list[0], offer, o.tactic || "measured", null, null, null, o.plan || "none"]);
      if(r && r.__err) return { ran:false, err:r.__err };
      R.bouts++;
      const held = !!(r && r.crux);
      if(held) R.held++;
      if(o.silent) return { ran:true, crux:held, rounds:0, res:r };   /* only for checks measuring the trap itself */
      const a = answer(d, r, o.choice);
      return { ran:true, crux:held, rounds:a.rounds, res:a.res };
    };

    /* THE OTHER HALF OF THE ROPE: the bill is shut until fame 25, so a probe that reads only
       `d.games.offers` fights almost nothing. The pit fills every other week. */
    const av = g => A.STATS.reduce((s,k)=>s+(g[k]||0),0)/6;
    const fit = (d, o) => A.activeG(d)
      .filter(g=>!g.injury && (g.fatigue||0) < ((o && o.spent) || 62))
      .sort((x,z)=>av(z)-av(x));

    const takeBout = (d, opts) => {
      const o = opts || {};
      const men = o.men ? [].concat(o.men) : fit(d, o);
      if(!men.length) return { ran:false, why:"nobody fit" };
      const bill = ((d.games && d.games.offers) || []).filter(x=>{
        if(x.melee && men.length < 3) return false;
        if(x.pair && men.length < 2) return false;
        return o.singlesOnly ? !(x.melee || x.pair || x.venatio) : true;
      });
      let offer = bill.length ? (o.pick ? o.pick(bill) : bill[0]) : null;
      if(!offer && !d.city){
        if(!d.pitCard || d.pitCard.week !== d.week) A.makePitCard(d);
        const pm = A.pitMen(d) || [];
        offer = A.makePitOffer(d, men[0], o.stakes || "standard", pm.length ? pm[0].id : null);
      }
      if(!offer && d.city){
        A.makeCityGames(d);
        const town = ((d.games && d.games.offers) || []).filter(x=>
          !(x.melee && men.length < 3) && !(x.pair && men.length < 2));
        offer = town.length ? town[0] : null;
      }
      if(!offer) return { ran:false, why:"no offer" };
      const ids = offer.melee ? men.slice(0,3).map(g=>g.id)
                : offer.pair  ? men.slice(0,2).map(g=>g.id)
                :               [men[0].id];
      return Object.assign({ offer, ids }, run(d, offer, ids, o));
    };

    window.__ROPE = { answer, run, takeBout, fit,
      stats: ()=>Object.assign({}, R),
      reset: ()=>{ R.bouts = R.held = R.rounds = R.unresolved = R.threw = 0; },
      /* one line a check can print so its own rope is visible in the log */
      say: ()=>`${R.bouts} bouts · ${R.held} reached the balance`
        + (R.bouts ? ` (${Math.round(R.held/R.bouts*100)}%)` : "")
        + ` · ${R.rounds} words spoken`
        + (R.unresolved ? ` · ${R.unresolved} STILL UNRESOLVED` : "")
        + (R.threw ? ` · ${R.threw} threw` : "") };
  });
}

export const click = (p, re) => p.evaluate(s=>{
  const rx = new RegExp(s, "i");
  const el = [...document.querySelectorAll("button")].find(b => rx.test((b.innerText||"").trim()) && !b.disabled);
  if(el){ el.click(); return true; } return false;
}, re.source);

export const tab = (p, key) => p.evaluate(k=>{
  const t = [...document.querySelectorAll("button[role=tab]")].find(b => new RegExp(k,"i").test(b.getAttribute("aria-label")||""));
  if(t){ t.click(); return true; } return false;
}, key);

/* the topmost overlay, by computed z-index rather than DOM order */
export const top = p => p.evaluate(()=>{
  const w = [...document.querySelectorAll(".modalwrap")]
    .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
  if(!w) return null;
  return { head: ((w.querySelector(".disp")||{}).innerText||"").trim().split("\n")[0].slice(0,44),
    z: +(getComputedStyle(w).zIndex||50), text:(w.innerText||"").slice(0,400) };
});

/* answer whatever is in the way — overlays, teaching panels, the opening guide */
export async function clearAll(p, rounds = 26){
  for(let i=0;i<rounds;i++){
    const hit = await p.evaluate(()=>{
      const w = [...document.querySelectorAll(".modalwrap")]
        .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
      if(w){
        const bs = [...w.querySelectorAll("button.btn, button.optrow")]
          .filter(x=>!x.disabled && !/close/i.test(x.getAttribute("aria-label")||""));
        if(bs.length){ bs[bs.length-1].click(); return true; }
      }
      /* the gatekeeper and the opening guide are inline panels, not overlays */
      const rx = /^(understood|i know my trade|i know the work|carry on|so be it|the doctore nods|next|go on|begin|done|got it|skip|think again)$/i;
      const el = [...document.querySelectorAll("button")].find(b => rx.test((b.innerText||"").trim()) && !b.disabled);
      if(el){ el.click(); return true; }
      return false;
    });
    if(!hit) return;
    await p.waitForTimeout(180);
  }
}

/* autosave is debounced 500ms — anything less and you read the week before */
export const waitSaved = p => p.waitForTimeout(950);

export const slot = p => p.evaluate(()=>{
  let best = null;
  for(const k of Object.keys(localStorage)){
    if(!/ludus-slot-\d/.test(k)) continue;
    try { const v = JSON.parse(localStorage.getItem(k)); if(v && v.gladiators) best = v; } catch(e){}
  }
  return best;
});

export async function found(p, { scenario = /clean start|even hand|your uncle|one good man|old guard/i } = {}){
  await p.evaluate(()=>localStorage.clear());
  await p.reload({ waitUntil:"load" });
  await p.waitForTimeout(900);
  await click(p, /found a house/);
  await p.waitForTimeout(300);
  await click(p, scenario);
  await p.waitForTimeout(200);
  await click(p, /take the keys/);
  await p.waitForTimeout(1200);
  await clearAll(p);
}

export async function endWeek(p){
  await tab(p, "ludus");
  await p.waitForTimeout(140);
  const went = await click(p, /^end week$/i);
  if(!went) return false;
  await p.waitForTimeout(720);
  return true;
}

/* reach into the game itself — only present in the --test build */
export const inside = (p, fn, arg) => p.evaluate(fn, arg);
export const hasHandle = p => p.evaluate(()=>!!window.__LVDVS);

export const pct = (a,b) => b ? +(a/b*100).toFixed(1) : 0;
export const ok   = (cond, msg) => ({ pass:!!cond, msg });
