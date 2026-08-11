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
      /* ---- `stakes` WAS A PIT-ONLY OPTION AND READ LIKE A POLICY, fixed in v2.91.0 ----
         `o.stakes` was passed to `makePitOffer` and nowhere else, so a probe asking for `blood`
         got first blood only while the house was too poor for the arena bill, and whatever the
         bill happened to offer after that. A mercy measurement built on it fought first blood for
         its opening and `standard` for the rest of its life without a word of complaint.
         `wantStakes` filters the bill as well and falls through to the pit, which honours it. And
         either way the stakes ACTUALLY fought come back in the result, so a caller can assert on
         what happened instead of on what it asked for. */
      const want = o.wantStakes || null;
      const wanted = want ? bill.filter(x=>x.stakes === want) : bill;
      const pool = (want && wanted.length) ? wanted : (want ? [] : bill);
      let offer = pool.length ? (o.pick ? o.pick(pool) : pool[0]) : null;
      /* ---- ROME IS NOT CAPUA, AND THIS ROPE USED TO FORGET IT ----
         The pit fallback below was guarded on `!d.city`, and a house at Rome has `d.rome` set with
         `d.city` still null — so a probe driving the imperial trip fell through to the CAPUAN PIT
         whenever the imperial card was momentarily empty, and then reported what it found there as
         what happened at Rome. It cost a `triumph` probe its headline: `d.rome.won` sat at nought and
         read as "the imperial sand is unwinnable" when the house had been fighting at home.
         There is no fallback at Rome. `romeWeek` puts the card up; if it is not there this week,
         the answer is that there is no bout, not that there is one somewhere else. */
      if(!offer && !d.city && !d.rome){
        if(!d.pitCard || d.pitCard.week !== d.week) A.makePitCard(d);
        const pm = A.pitMen(d) || [];
        offer = A.makePitOffer(d, men[0], want || o.stakes || "standard", pm.length ? pm[0].id : null);
      }
      if(!offer && d.rome) return { ran:false, why:"at Rome with no card up this week", rome:true };
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
      return Object.assign({ offer, ids, stakes: offer.stakes,
        gotWanted: want ? offer.stakes === want : null }, run(d, offer, ids, o));
    };

    /* ================= THE LANISTA: ONE CANONICAL COMPETENT WEEK =================

       Every check that needs a house to get anywhere has written its own player, and in v2.93.0 three
       attempts at one produced median lives of 108, 27 and 157 weeks on the same build. The first
       reported thirteen events and fourteen subsystems dark; almost all of it was the policy declining
       to act. A reachability claim is a claim about a policy, so the policy belongs here, once, with a
       check under it — `policy` holds the benchmarks below.

       THE FOUR THINGS THAT MADE THE EARLIER ATTEMPTS WRONG, all fixed here:
         · no `wantStakes`, so a purse-maximising pick walked into sine missione cards;
         · it bought the CHEAPEST man on the block rather than the best it could afford;
         · it never spent on anything, so doctore, rooms, staff, rites and the census read as dark;
         · and a FLAT reserve, which is not a reserve — the weekly bill grows with the roster, so the
           reserve is twelve weeks of the bill and every discretionary spend clears it with room.

       `lanista(d, opts)` plays one week and RETURNS WHAT IT DID, so a caller can assert on behaviour
       rather than intent. Every part can be switched off through `opts` for a control arm:
         cells, buy, doctore, build, rites, census, staff, school, heir, rome, bout  (all default true)
       `play(d, weeks, opts)` runs many and pools the counters. */
    const LAN = {
      reserve: d => Math.max(700, A.weeklyBill(d) * 12),
      rooms: ["valetudinarium","armamentarium","palus","carceres","balneae"],
    };
    const lanista = (d, opts) => {
      const o = opts || {};
      const on = k => o[k] !== false;
      const did = {};
      const bump = k => { did[k] = (did[k]||0)+1; };
      const fin = (f, args) => { try { return f(...args); } catch(e){ bump("threw"); return null; } };
      if(d.over) return did;
      const spare = () => d.gold - LAN.reserve(d);

      /* the cells first — the largest single lever measured in this project */
      if(on("cells")){
        if(d.unrest >= 30 && fin(A.throwFeast,[d])) bump("feast");
        if(d.unrest >= 22 && fin(A.walkTheCells,[d]) === true) bump("walk");
      }
      for(const g of A.activeG(d)) fin(A.setRegimenOf,[d, g.id, (g.fatigue||0) > 55 ? "rest" : "palus"]);

      if(on("doctore") && !d.doctore){
        if(!(d.doctoreMarket||[]).length) fin(A.makeStaffMarket,[d]);
        const c = (d.doctoreMarket||[]).filter(x=>x.fee <= spare()*0.5).sort((a,b)=>b.fee-a.fee)[0];
        if(c && fin(A.hireDoctore,[d, c.id])) bump("doctore");
      }
      if(on("buy") && A.activeG(d).filter(g=>!g.injury).length < 5 && !A.rosterFull(d)){
        const m = (d.market||[]).filter(x=>x.price <= spare()*0.5).sort((a,b)=>b.price-a.price)[0];
        if(m && fin(A.buyFromBlock,[d, m.id, null])) bump("bought");
      }
      if(on("build") && spare() > 6000)
        for(const k of LAN.rooms) if(fin(A.buildUp,[d,k])){ bump("built"); break; }
      if(on("rites")){
        if(!d.blessing && spare() > 3500)
          for(const gd of Object.keys(A.GODS||{})) if(fin(A.makeOffering,[d,gd])){ bump("offering"); break; }
        if(!d.vow && spare() > 9000)
          for(const gd of Object.keys(A.GODS||{})) if(fin(A.swearVow,[d,gd])){ bump("vow"); break; }
      }
      /* the census must be CLAIMED — `riseWeek` only fills the meter, and this is one of the two
         gates on Rome. No policy of mine called it until v2.93.0, which is why every earlier sweep
         read census rung 0 in every house. */
      if(on("census") && A.canClaimRise(d) && fin(A.claimRise,[d])) bump("claimedRank");
      if(on("staff")) for(const kind of ["medicus","armourer"]){
        if(d[kind]) continue;
        if(!((d.staffMarket||{})[kind]||[]).length) fin(A.makeStaffMarket,[d]);
        const c = (((d.staffMarket||{})[kind])||[]).filter(x=>x.fee <= spare()*0.4).sort((a,b)=>b.fee-a.fee)[0];
        if(c && fin(A.hireStaffMember,[d, kind, c.id])) bump("hired:"+kind);
      }
      /* the school of the house, which v2.93.0 put in front of the player for the first time. The
         reference player takes the one that matches how he already fights — the yard is bought on
         price rather than class, so `craft` is the honest default for a house that keeps its men. */
      if(on("school") && !d.doctrine && A.DOCTRINES && spare() > 2500){
        const want = A.DOCTRINES.craft ? "craft" : Object.keys(A.DOCTRINES)[0];
        if(fin(A.declareDoctrine,[d, want])) bump("school");
      }
      /* ---- THE LINE OF THE HOUSE, added in v2.96.0 ----
         `lanistaWeek` at `L.health <= 0` does one of two things and the ONLY thing that decides which
         is whether an heir has been named: with `d.heir` set it writes `d.succession` and the house
         goes on, and without it the run ends `lanistaDied`. So every `lanistaDied` in every sweep this
         audit has run was a lanista who died with nobody named — because no policy of mine ever named
         anybody. The game does warn: `agenda` raises "You are failing and have named nobody" at health
         under 30, and "The house has no head" at urgency 3 once the succession is open. The reference
         player now takes both, which is what a player following his own advice would do, and it is the
         only route to a second generation. */
      if(on("heir") && !d.heir && !d.succession){
        const opts = fin(A.heirEligible,[d]) || [];
        if(Array.isArray(opts) && opts.length && fin(A.nameHeir,[d, opts[0]])) bump("namedHeir");
      }
      if(on("heir") && d.succession && fin(A.takeUpTheHouse,[d])) bump("tookUpHouse");
      if(on("rome") && d.romeOffer && fin(A.answerRomeWith,[d,true])) bump("toRome");

      if(on("bout")){
        const av = g => A.STATS.reduce((s,k)=>s+(g[k]||0),0)/6;
        const men = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0) < 55).sort((x,z)=>av(z)-av(x));
        /* the primacy first when it is up — a purse-maximising pick passes it over, and it is the
           other gate on Rome. At Rome, take whatever card is there: the imperial bill is sine
           missione 54% of the time and refusing it lapses the trip. */
        const t = takeBout(d, { men, wantStakes: d.rome ? null : (o.stakes || "standard"),
          choice: o.choice || "press",
          pick: us => { const pr = us.filter(x=>x.primus); return (pr.length ? pr : us)
            .sort((a,b)=>(b.purse||0)-(a.purse||0))[0]; } });
        if(t && t.ran !== false){
          bump("bout");
          if(t.offer && t.offer.primus) bump("primusBout");
          if(t.offer && t.offer.imperial) bump("imperialBout");
          if(t.res && t.res.win) bump("won");
        } else bump("noBout");
      }

      /* the week's question, answered the way a solvent player would — NOT always choice 0, which on
         `uprising` is the only lethal branch and cost an earlier probe 129 weeks of median life */
      const ev = d.pendingEvent;
      if(ev){
        did.events = did.events || {};
        did.events[ev.id] = (did.events[ev.id]||0)+1;
        let i = 0;
        if(ev.id === "uprising"){ const k=(ev.data&&ev.data.keys)||["fight"]; const gi=k.indexOf("guards"); if(gi>=0) i=gi; }
        fin(()=>A.EVENTS[ev.id].run(d, ev, i), []);
        d.pendingEvent = null;
      }
      fin(A.endWeek,[d]);
      return did;
    };

    const play = (d, weeks, opts) => {
      const tot = { events:{} };
      for(let w=0; w<(weeks||100); w++){
        if(d.over) break;
        const did = lanista(d, opts);
        for(const [k,v] of Object.entries(did)){
          if(k === "events"){ for(const [e,n] of Object.entries(v)) tot.events[e] = (tot.events[e]||0)+n; }
          else tot[k] = (tot[k]||0) + v;
        }
      }
      tot.week = d.week; tot.kind = d.over ? d.over.kind : "alive";
      return tot;
    };

    window.__ROPE = { answer, run, takeBout, fit, lanista, play,
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
