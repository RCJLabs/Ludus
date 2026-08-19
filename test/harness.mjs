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
    /* `refused` is keyed by the reason `takeBout` gave, and `wrongStakes` counts bouts fought at
       stakes other than the ones asked for. Both exist because a refusal was legible in the return
       and nothing forced a caller to look — see the note over `takeBout`. */
    const R = { bouts:0, held:0, rounds:0, unresolved:0, threw:0, refused:{}, wrongStakes:0 };
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

    const no = (why, extra) => { R.refused[why] = (R.refused[why]||0)+1;
      return Object.assign({ ran:false, why }, extra||{}); };

    const takeBout = (d, opts) => {
      const o = opts || {};
      const men = o.men ? [].concat(o.men) : fit(d, o);
      if(!men.length) return no("nobody fit");
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
      /* ---- AND THEN NOTHING WAS EVER WIRED TO IT, found in v3.0.0 ----
         `wantStakes` shipped in v2.91.0 and every caller in the suite went on passing `stakes:` —
         `chair`, both of `ends`'s arms and `steel`'s wrapper. Measured over 10 houses of 120 weeks,
         asking one way and then the other:
            asked for `sine`      `stakes:` fought 76% sine, 10% standard, 9% melee, 5% venatio
            asked for `standard`  `stakes:` fought 76% standard, 9% sine, 8% melee, 7% venatio
            asked for `blood`     `stakes:` fought 83% blood, 9% sine, 5% standard, 4% venatio
            all three            `wantStakes:` fought 100% of what it asked for
         So `ends`'s sine arm and its standard arm overlapped by about a quarter of their bouts.

         THE FIRST FIX WAS TO ALIAS THE TWO NAMES TOGETHER, AND IT BROKE `ends` — 4 of 5 `proven`
         houses ended in debt against a measured 0-10%, because a house that REFUSES every week the
         bill has no standard card on it fights far less and is paid far less. That is the point: a
         competent player does not sit out a week, he fights what is there or walks to the pit. So
         there are two honest readings and they are two options, not one:
            wantStakes   STRICT — only these stakes, and refuse the week otherwise
            preferStakes take these if the bill has them, else take the bill anyway; the pit honours it
         `stakes:` is the old name and means `preferStakes`, which is what its four callers meant and
         is still a fix on what they got: a preference now filters the bill instead of being dropped
         on the floor everywhere except the pit. */
      const want = o.wantStakes || null;
      const pref = want || o.preferStakes || o.stakes || null;
      const matching = pref ? bill.filter(x=>x.stakes === pref) : bill;
      const pool = matching.length ? matching : (want ? [] : bill);
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
        offer = A.makePitOffer(d, men[0], pref || "standard", pm.length ? pm[0].id : null);
      }
      if(!offer && d.rome) return no("at Rome with no card up this week", { rome:true });
      if(!offer && d.city){
        A.makeCityGames(d);
        const town = ((d.games && d.games.offers) || []).filter(x=>
          !(x.melee && men.length < 3) && !(x.pair && men.length < 2));
        /* the town's card is the town's card; it does not take an order for stakes, so a caller that
           asked for one gets `gotWanted:false` rather than a bout quietly billed as what it wanted */
        offer = town.length ? town[0] : null;
      }
      if(!offer) return no(want ? `no ${want} bout to be had` : "no offer");
      const ids = offer.melee ? men.slice(0,3).map(g=>g.id)
                : offer.pair  ? men.slice(0,2).map(g=>g.id)
                :               [men[0].id];
      const got = pref ? offer.stakes === pref : null;
      if(got === false) R.wrongStakes++;
      return Object.assign({ offer, ids, stakes: offer.stakes, gotWanted: got,
        strict: !!want, asked: pref }, run(d, offer, ids, o));
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
         gear, party                                                        (default TRUE from v3.17.0)
         contract                                                           (default TRUE from v3.20.0)
         bench         (a list of gladiator ids never sent to the sand — the control arm for #135;
                        they train and age and cost as usual, they are simply never picked)
         nem           (default TRUE from v3.24.0 — answers the arch-rival and names the day when it
                        holds the upper hand. `nem:false` is the arm that never replies, which is
                        every measurement this project took before the step existed)
         road          (default TRUE — accept a town's invitation and COME HOME once the welcome
                        wears. `road:false` is the stay-at-home arm: it declines the invitation too,
                        because a house that leaves once and cannot return is not a house that stays)
         free                                                                          (default FALSE —
           opt-in: freeing everyone eligible takes the house's fame from 2,232 to 1,270,
           and fame is the quantity most of this suite's reachability leans on. See the step's note)
         works         (default FALSE — opt-in, #138: commission the works and monuments, cheapest
                        open site first, one at a time, deposit from spare(). Flipping this default
                        re-bases what a long-lived house owns and is its own release. `works:true`)
         loan          (default NONE, #163 — `loan:"murena"` borrows from that lender the week gold
                        falls below `LAN.reserve(d)` and pays the debt down from everything above the
                        reserve every week after. Both triggers are the rope's own reserve, so there
                        is no threshold in it. Nothing in the suite borrows without this)
         party         (default TRUE — host whenever spare allows. `party:"rung"` hosts only while
                        favour is SHORT of what the next census rung asks, and banks otherwise: the
                        target is the game's own gate rather than a number somebody chose, so it
                        re-aims as the house climbs. `party:false` is the arm that never entertains)
         answer        (default NONE, #147 — `answer(ev, d)` returns the index to take on this week's
                        question, or null to leave the rope's own reading of it alone. The rope
                        answers 0 to everything bar `uprising` and `bayCall`, and one of the game's
                        twelve endings — `triumph` — is choice 1 on `romeReturn` and nothing else,
                        so without this lever "the rope never triumphs" is a statement about the
                        rope rather than about the game)
       `play(d, weeks, opts)` runs many and pools the counters. */
    const LAN = {
      /* the reserve is twelve weeks of obligations. A rising work's mason draw IS an obligation —
         worksWeek takes it from gold before any of this player's own spending sees it — and the
         first works policy that ignored that killed its houses: commissioned at spare() > deposit,
         the works-on arm was RICHER in 1 pair of 24 and died earlier in most (338w -> 72w, 420 ->
         161). Not a constant to tune; the existing reserve rule applied to a new obligation class.
         For every arm without a rising work the term is zero and this line is exactly the old one. */
      reserve: d => Math.max(700, (A.weeklyBill(d) + LAN.draws(d)) * 12),
      draws: d => (A.ALL_WORK_KEYS||[]).reduce((s,k)=>{ const on = A.workOn && A.workOn(d,k);
        return s + (on && on.owed > 0 ? A.workWeekly(A.workDef(k)) : 0); }, 0),
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
      /* ---- #146: HOW MANY MEN THIS PLAYER KEEPS, as a lever rather than a constant ----
         The buy gate has been a hard 5 since the rope was written, and #146 asks whether the weeks
         the reference player cannot field anybody (8.1%, of which 94% are simply an EMPTY yard) are
         the game's attrition or this number being too low. `keep` makes that testable; it defaults
         to 5, which is exactly the old behaviour. */
      if(on("buy") && A.activeG(d).filter(g=>!g.injury).length < (o.keep || 5) && !A.rosterFull(d)){
        const m = (d.market||[]).filter(x=>x.price <= spare()*0.5).sort((a,b)=>b.price-a.price)[0];
        if(m && fin(A.buyFromBlock,[d, m.id, null])) bump("bought");
      }
      if(on("build") && spare() > 6000)
        for(const k of LAN.rooms) if(fin(A.buildUp,[d,k])){ bump("built"); break; }
      /* ---- THE STONE, WHICH NO POLICY OF MINE HAS EVER COMMISSIONED — #138 ----
         The works and monuments are the file's own late-game sink ("what a fortune is spent on
         once the yard is finished"), the agenda nags about them, and they have been payable in
         instalments since the stone repricing — 25% down, a weekly draw that idles gracefully.
         `beginWork`'s only callers were the two villa buttons, so the reference player never
         commissioned one in the project's history: measured over four seeds x 72 houses x 420
         weeks, EVERY late house held zero of the nine, while its peak gold (median 12,300-13,300d)
         covered the whole first tier's prices one by one. The sixth instance of "a policy the
         player cannot execute is not a policy", and it sat under every out-of-things-to-buy
         figure #131 rests on.
         OPT-IN, the way `gear` began: switching it on re-bases what a long-lived house owns and
         earns (five perk streams), and flipping the default is its own release with every affected
         figure re-measured. `works:true` asks for it. The policy is the game's own shape: one site
         at a time (the agenda's `anyOn` rule), the cheapest open work first because finishing is
         what opens the monument tier, and the deposit paid from spare() like every other
         discretionary coin — the weekly draw is what the instalment design already tolerates. */
      if(o.works === true && typeof A.beginWork === "function"){
        const anyOn = (A.ALL_WORK_KEYS||[]).some(k=>A.workOn(d,k));
        if(!anyOn){
          const pick = (A.ALL_WORK_KEYS||[])
            .filter(k=>!A.workDone(d,k) && A.workOpen(d,k))
            .map(k=>({ k, W:A.workDef(k) }))
            /* the deposit AND twelve weeks of the draw it commits to, from spare() — the same
               twelve-week rule the reserve holds everything else to */
            .filter(x=>x.W && Math.ceil(x.W.cost*A.WORK_DEPOSIT) + A.workWeekly(x.W)*12 <= spare())
            .sort((a,b)=>a.W.cost-b.W.cost)[0];
          if(pick && fin(A.beginWork,[d,pick.k]) === true) bump("commissioned");
        }
      }
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
      /* the domestic half of the house, which nothing pointed at until v2.98.0 and no check could
         reach before it — none of the nine functions were on the handle. Cheap, strictly good, and
         the reference player takes them in the order the villa tab lists them once he can pay. */
      /* NOT in the opening. Measured: 22d a week against a new house's whole bill of 30d is a 73%
         rise, and the first version of this step hired three women in year one and took `policy`
         under its own fame bar. A house carries the domestic half once it can carry it. */
      if(on("folk") && typeof A.hireFolk === "function" && d.week >= 18)
        for(const k of (A.HH_KEYS || [])){
          if(A.hasFolk(d, k) || (k !== "wife" && spare() < 2500)) continue;
          if(fin(A.hireFolk,[d, k])) bump("folk");
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
      /* ---- THE STEEL, WHICH NO POLICY OF MINE HAS EVER BOUGHT ----
         `gearUpkeep` measured 0.0 denarii in every era of a 2,555-week sweep, and the reason was here:
         the reference player fought with whatever the house issued him and never bought a piece, never
         mended a kit and never went near the master's bench. So the whole steel economy — 70
         purchasable pieces, 19 of them master's work at 2,900 to 9,500 denarii with a weekly keep —
         was invisible to every measurement this audit has run, and "60 of 70 pieces affordable and
         unbought" was a fact about the probe as much as about the game.

         A competent player arms his men. This one keeps every slot filled with the best he can afford
         behind the reserve, replaces a piece once it is worn past a third, and pays the armoury to
         straighten a kit when that is cheaper than replacing it. The master's bench is deliberately
         CAUTIOUS: one piece at a time and only at three times its price in spare coin, because the
         ticket is once and the keep is forever — a policy that buys the bench out the week it opens
         would be measuring bankruptcy rather than the sink. */
      /* ---- AND IT IS OFF BY DEFAULT, WHICH IS A DECISION AND NOT AN OVERSIGHT ----
         Every other step here defaults ON, because `on(k)` is `o[k] !== false`. This one is opt-in,
         because turning it on changes the reference player more than anything since the rope itself.
         MEASURED, paired on the same eight seeds over 400 weeks, off against on:

           year 12+   gear keep 3.7d/wk -> 382d/wk · weekly bill 291d -> 923d · gold 107,246d -> 87,054d
           over the run  0 pieces bought -> 387, 0 master's -> 179, 0 kits mended -> 54
           mean condition 56.5% -> 82.7% · houses alive at week 400: 3 of 8 -> 6 of 8

         Those are not small. The bill more than triples, the ending mix loses its rebellions, and half
         the figures quoted in the heads of `policy`, `ends`, `careers` and `survive` were measured on a
         player who fought in house issue. Flipping this default is a deliberate re-baselining of the
         whole suite and belongs in its own release with every affected figure re-measured — not as a
         side effect of adding the step.

         AND v3.17.0 TURNS IT ON. The direction was never in doubt: arming your men improves SURVIVAL —
         six houses of eight came through four hundred weeks against three — and v3.16.0 settled that a
         player who uses the levers runs 19 denarii a week at year 12+ against 769 for one who does not.
         A reference player sitting on 88,555 denarii he has no use for is not modelling competence; he
         is modelling somebody who never found the game. Only three checks drive this player at all —
         `ends`, `policy` and `week` — and their figures are re-measured with it. `gear:false` is how a
         control arm asks for the old man. */
      if(o.gear !== false && typeof A.buyGearItem === "function"){
        const spareNow = () => d.gold - LAN.reserve(d);
        for(const g of A.activeG(d)){
          if(!g.kit) continue;
          for(const s of A.SLOTS){
            const cur = A.GEAR[g.kit[s]];
            const worn = A.wears(cur) && A.wearOf(g, s) < 34;
            const bare = !cur || !cur.price;
            if(!worn && !bare) continue;
            /* mending is the cheaper answer while there is anything left to mend */
            if(worn && !bare){
              const fee = fin(A.repairFee,[d, g]) || 0;
              if(fee > 0 && fee <= spareNow() * 0.25 && fin(A.mendKitOf,[d, g.id])){ bump("mended"); continue; }
            }
            const master = A.masterOpen && A.masterOpen(d);
            const want = Object.entries(A.GEAR)
              .filter(([id,it])=> it.slot === s && it.price > 0
                && (!it.styles || !it.styles.length || it.styles.includes(g.cls))
                && (!it.master || master)
                && it.price <= (it.master ? spareNow()/3 : spareNow()*0.4))
              .sort((a,b)=> b[1].price - a[1].price)[0];
            if(!want) continue;
            if(fin(A.buyGearItem,[d, want[0]])){
              bump(want[1].master ? "master" : "bought:gear");
              fin(A.equipOne,[d, g.id, s, want[0]]);
            }
          }
        }
      }
      /* ---- AND THE RUDIS, WHICH NOTHING HAS EVER GRANTED ----
         `closed` — five men freed — is an ending `ends` measured at 2 houses in 20. Measured here over
         8 houses and 227 men who ever drew breath: 14.1% of them cross `rudisEligible` at some point
         (wins >= 10 AND pfame >= 180), which is about four men a house against the five that ending
         wants, and 146 of the 227 DIED. So the door is nearly wide enough and nobody has ever walked
         through it — the reference player freed 0 men in 3,200 house-weeks, for the same reason he
         never bought a piece of steel: there was no step here for it.

         AND THIS ONE STAYS OPT-IN WHERE `gear` AND `party` DID NOT, on a measurement rather than a shrug.
         Freeing every man the week he qualifies takes the house's fame from 2,232 to 1,270 — it is your
         BEST men you are letting go and their fame was the house's. Fame is the quantity most of this
         suite's reachability leans on: `policy` asserts a best house past 2,000 of it, and the primacy,
         Rome and half the census gates read it. So a reference player who frees everyone reaches LESS of
         the game, which is the opposite of what he is for. It is also a style rather than a competence —
         mercy-maximising is a way to play, not the way — and nothing measured says it is optimal.
         `free:true` is how a check asks for it. */
      /* ---- AND THE TABLE, which v3.7.0 measured as the largest lever on the census ladder ----
         Paired then: a lanista who entertains reaches mean rung 2.70 against 1.50 and 218 weeks at Rome
         against 31, for about 457 denarii a week. It is also a sink, and a "does everything" arm without
         it is not one. ON from v3.17.0 with `gear`: entertaining is how the census ladder moves at all —
         rung 2.70 against 1.50 — and a reference player who never does it cannot reach the rungs this
         suite asserts he reaches. */
      /* ---- AND *WHEN*, WHICH WAS NEVER A DECISION UNTIL #158 ----
         This hosted whenever spare allowed, which is a policy on a purse rather than a policy with a
         reason — the fault `nemesis` names in its own head ("if you find yourself adjusting a constant
         because the number came out wrong, that is this mistake"). Favour is bought at the table and
         the census wants a THRESHOLD of it, so once the house clears what the next rung asks, another
         party buys nothing on the ladder and the coin would be better held: the census counts what you
         are worth (v3.45.0) and the top rung wants 80,000 of it.
         `party:"rung"` hosts only while favour is short of `riseNeed(d).favor`. There is no constant in
         that — the target is the game's own next gate, so the policy re-aims itself as the house climbs
         and stops entirely at the top of the ladder. `party:true` (the default) is unchanged.

         ---- AND IT IS MEASURABLY WORSE, WHICH IS WHY THE DEFAULT DID NOT MOVE ----
         #158 was opened on the reading that the rope entertains on the wrong schedule and it costs a
         whole rung. Paired on the same seeds with nothing else changed — 48 houses an arm over three
         seeds, 700 weeks each:

           party every week affordable (default)   mean rung 2.96 · 15 of 48 past rung 5 · 7 at rung 6
           party only while short of the gate      mean rung 2.73 · 13 of 48         · 7
           never entertaining at all               mean rung 2.23 ·  8 of 48         · 3

         The reason the reason was wrong is in `riseWeek`: surplus favour is not wasted, it SPEEDS the
         standing meter — `over = (fame - need)/200 + (favor - need)/60`, worth up to five a week on
         top of the base four. So there is no point at which the table stops paying, and a policy that
         stops at the gate gives that up. The earlier "whole rung" came from `rung`'s `cycle` arm,
         which differed from the rope in its SPARE THRESHOLD as well as its schedule and was never a
         control. This lever stays because a measured no-improvement is worth keeping findable. */
      /* ---- THE MONEY NOBODY HAS EVER BORROWED — #163 ----
         `dark` found `repay`'s gate open on 0 of 1,100 house-weeks, because the rope has never taken
         a loan. That makes `foreclosed` a 25-week fuse in every measurement of it — borrow and never
         service it and 22-24 houses of 24 go out at week 26 with 9,825 owed, deterministically. The
         question the fuse cannot answer is whether the loan is a TOOL: a house that borrows when it
         is short and pays it down from surplus is a different house from one that borrows and spends.
         `loan:"<lender>"` is that player. The trigger is the rope's own idea of having nothing —
         gold below `LAN.reserve(d)`, twelve weeks of obligations — and the repayment is everything
         above it, so there is no constant in either. */
      if(o.loan && typeof A.borrow === "function"){
        const res = LAN.reserve(d);
        if(A.canBorrow && A.canBorrow(d) && d.gold < res){
          if(fin(A.borrow,[d, o.loan, 99999])) bump("borrowed");
        } else if(d.loan && d.gold > res){
          const paid = fin(A.repay,[d, Math.floor(d.gold - res)]);
          if(paid > 0) bump("repaid");
        }
      }
      if(o.party !== false && typeof A.hostParty === "function"){
        const need = o.party === "rung" && typeof A.riseNeed === "function" ? fin(A.riseNeed,[d]) : null;
        const wants = o.party !== "rung" || !need || (d.favor||0) < (need.favor||0);
        const sp = d.gold - LAN.reserve(d);
        const kind = !wants ? null : sp > 4000 ? "decadent" : sp > 1600 ? "lavish" : sp > 700 ? "modest" : null;
        if(kind && fin(A.hostParty,[d, kind])) bump("party");
      }
      if(o.free === true && typeof A.grantRudis === "function"){
        for(const g of A.activeG(d)){
          if(!fin(A.rudisEligible,[g])) continue;
          const before = A.activeG(d).length;
          fin(A.grantRudis,[d, g.id]);
          if(A.activeG(d).length < before) bump("freed");
        }
      }
      if(on("rome") && d.romeOffer && fin(A.answerRomeWith,[d,true])) bump("toRome");

      /* ---- THE QUESTION THIS LANISTA NEVER ANSWERED ----
         `d.reSignOffer` is an auctor whose contract has run out, standing in the yard with the gate
         open. On screen it is a blocking modal with two doors and the week cannot proceed past it.
         Headless, nothing here touched it, so it was set once and stood for the rest of the run — and
         the offer that raises it is guarded `if(!d.reSignOffer && ...)`, so ONE stuck question shut the
         whole system for every long probe this project has ever run.
         It surfaced sideways: a label census found "A contract is up" available on 779 of 779 late
         weeks and shown on none of them, which is not a game that never surfaces its content but a
         reference player standing in a doorway for eight years.
         MEASURED BEFORE AND AFTER, because the first version of this note overstated it. The question
         needs an auctor to finish a contract, which needs one to have been bought, so it is not
         universal: over 10 houses x 420 weeks, 3 houses ever raised it — and those 3 then spent 387 of
         1,009 house-weeks, 38%, frozen on it, because the offer that raises it is guarded on its own
         absence. Rare to start and permanent once started.
         Signed when affordable, let go when not, because that is the choice the panel offers and a
         house that cannot pay does not get to keep him. */
      if(on("contract") && d.reSignOffer){
        const fee = d.reSignOffer.fee || 0;
        if(fin(A.answerReSignWith,[d, d.gold >= fee])) bump(d.gold >= fee ? "reSigned" : "letWalk");
      }

      /* ---- THE ARCH-RIVAL, WHOM THIS LANISTA NEVER ONCE HIT BACK ----
         `nemEdge` is `answered - hits`. `hits` climbs when the rival schemes at you; `answered` moves
         only through `answerNem` or a won gambit, and there was a step for neither — so `answered`
         stayed 0 for every house this project has ever run, the edge was permanently negative, and
         `nemCanCallOut` (stage>=2 AND edge>=1 AND heat>=45 AND a man at pfame>=18) could not open.
         Measured before this step, 8 houses x 320 weeks: the call-out gate opened on 0 weeks while
         `answerNem`'s own gate was open on 73% of them. The nemesis existed; the house never replied.
         The policy is the one the panel offers: answer when you can afford it, and when you hold the
         upper hand, name the day yourself rather than waiting to be challenged. Answering is priced
         at `160 + fame*0.5` and comes out of `spare()` like every other discretionary spend, so a
         house that cannot afford the reply does not make it — which is the honest version, since
         `answerNem` simply returns null below the price and a step that ignored that would report a
         reply it never made. */
      if(on("nem") && d.nemHouse){
        if(A.nemCanCallOut(d) && fin(A.nemCallOut,[d])) bump("calledOut");
        /* ---- TWO WRONG VERSIONS OF THIS BEFORE THE RIGHT ONE, AND BOTH WERE POLICIES ----
           Guarded on `spare() > cost` it answered 202 times at `160 + fame*0.5` — about 690d a week
           at late fame against a weekly bill of 364 — and `policy` failed on the buildings: the
           best-off house held 2 of 5 rooms against a bar of 3, which is that check doing its job.
           Guarded instead on clearing the build threshold after paying, it answered 7 times in 2,586
           weeks and the call-out window opened in 1 house of 10. One arm bought revenge with the
           roof; the other never got ahead. Both were the same mistake: answering ON A TIMER, for ever.
           A player chasing the call-out answers until he holds the upper hand and then USES it, so
           the spend is bounded by the rival's hits rather than by the calendar. `nemEdge < 1` is that
           condition, off the game's own function — and once the edge is up the branch above names the
           day instead of paying again. */
        else if(A.nemEdge(d) < 1 && A.nemAnswerReady(d) && spare() > 160 + d.fame*0.5
                && fin(A.answerNem,[d])) bump("answeredNem");
      }

      if(on("bout")){
        const av = g => A.STATS.reduce((s,k)=>s+(g[k]||0),0)/6;
        /* ---- THE BENCH, ADDED FOR #135 ----
           `season.mjs` measured 14 to 21 of every 24 men dying before their season paid out, and the
           figure was confounded: it puts the season on `activeG(d)[0]` and this step sorts by average
           stat, so the trainee IS the man being fought every week. Whether that death rate belongs to
           the season or to the bout policy cannot be separated without an arm that trains a man it
           does not send to the sand. `bench` is a list of ids never picked for a bout — nothing else
           about them changes, so they still train, still age, still cost their upkeep. */
        const bench = new Set([].concat(o.bench || []));
        const men = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0) < 55 && !bench.has(g.id))
          .sort((x,z)=>av(z)-av(x));
        /* the primacy first when it is up — a purse-maximising pick passes it over, and it is the
           other gate on Rome. At Rome, take whatever card is there: the imperial bill is sine
           missione 54% of the time and refusing it lapses the trip. */
        /* ---- AND THE THIRD TIME THIS OPTION HAS BEEN DROPPED ON THE FLOOR ----
           `takeBout` above documents two honest readings — `wantStakes` STRICT, `preferStakes` take
           it if the bill has it — and then this line collapsed every one of them into a strict
           `wantStakes`, so `preferStakes` never reached `takeBout` at all and `lanista(d, {preferStakes})`
           was inert. Found the way #136 says to find these: an arm passing `preferStakes:"sine"` came
           back BYTE-IDENTICAL to the reference player over 24 houses and 4,000 weeks — same endings,
           same weeks lived, same raw rows — while a stakes census over 1,702 played weeks showed the
           arena bill carrying 564 sine offers against 1,410 standard. A lever with 22% of the bill to
           work with does not produce zero divergence; the lever was not connected.
           The default is untouched on purpose: with neither option given this is still
           `wantStakes:"standard"`, which is what every figure in this project was measured on. */
        const t = takeBout(d, { men,
          wantStakes:   d.rome ? null : (o.wantStakes || (o.preferStakes ? null : (o.stakes || "standard"))),
          preferStakes: d.rome ? null : (o.preferStakes || null),
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

      /* ---- THE HOUSE THAT WENT SOUTH AND NEVER CAME BACK ----
         `comeHome` has exactly ONE caller in the whole game — the UI button at ludus.jsx:18653.
         No weekly phase ever returns a house to Capua, and this lanista had no travel step, so the
         first time an editor asked for one of its men by name (`bayCall`, answered at the default
         i=0, "Take the road to <town>") the house left and stood in that town for the rest of its
         life. That is not a player who tours. It is the `reSignOffer` shape again: a reference
         player standing in a doorway for years.
         MEASURED over 10 houses x 420 weeks before the step, by `test/probes/road.mjs`: 5 of 10
         houses ever left, and every one of the 5 made exactly ONE departure and ZERO returns —
         246, 363, 175, 264 and 150 weeks in a single town. 54% of all house-weeks were spent on
         the coast and 71% of every games week's card was a town's rather than Capua's.
         That is the whole of #132's "91% of a late house's cards are somewhere else", and it was
         written up as a fact about the reference player's POLICY. It was a fact about its cage.
         The game had already named this exact failure at ludus.jsx:9632 — "a house that accepted
         one town's invitation and simply never went home prospered for three hundred straight
         weeks" — and priced it: past `STAY_FRESH` the purses fade and Capua's patrons stop asking.
         So the policy is the game's own: a guest, not a resident. Stay while the town is fresh,
         break camp the week the welcome starts to wear. Read off `welcomeOf` rather than a number
         of my own, so it tracks the constant instead of drifting from it.
         AFTER the bout, because `comeHome` nulls `d.games` — deciding to leave before fighting
         throws away the card that was the reason to be there. */
      if(on("road") && d.city && !d.travel && !d.rome && A.welcomeOf(d) < 1){
        if(fin(A.comeHome,[d])) bump("cameHome");
      }

      /* the week's question, answered the way a solvent player would — NOT always choice 0, which on
         `uprising` is the only lethal branch and cost an earlier probe 129 weeks of median life */
      const ev = d.pendingEvent;
      if(ev){
        did.events = did.events || {};
        did.events[ev.id] = (did.events[ev.id]||0)+1;
        let i = 0;
        if(ev.id === "uprising"){ const k=(ev.data&&ev.data.keys)||["fight"]; const gi=k.indexOf("guards"); if(gi>=0) i=gi; }
        /* `road:false` is the STAY-AT-HOME control arm, and it has to decline the invitation as
           well as skip the return — otherwise "does not tour" means "leaves once and is stuck",
           which is the thing being controlled for. `bayCall`'s second door is "Write back that you
           are needed here", and it is the only road out of Capua a player is ever offered. */
        if(ev.id === "bayCall" && !on("road")) i = 1;
        /* ---- AND AN ARM THAT IS PURSUING ONE PARTICULAR ENDING ----
           #147 asked which of the twelve endings the source can set are unreachable and which are
           merely declined, and the only honest test of "declined" is an arm that declines the other
           way. `triumph` is exactly one door on exactly one event (`romeReturn`, choice 1); a policy
           that wants it does not want a different rope, it wants to answer that one question
           differently. `answer(ev, d)` returns an index, or null to leave the default alone. */
        if(typeof o.answer === "function"){
          const j = o.answer(ev, d);
          if(j != null && j >= 0) i = j;
        }
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
      stats: ()=>Object.assign({}, R, { refused:Object.assign({}, R.refused) }),
      reset: ()=>{ R.bouts = R.held = R.rounds = R.unresolved = R.threw = R.wrongStakes = 0;
        R.refused = {}; },
      /* one line a check can print so its own rope is visible in the log. The refusals are on it
         because they were legible in the return and nothing forced a caller to look: a check that
         asked for 300 bouts and was refused 200 of them reported the 100 and said nothing. */
      say: ()=>{
        const ref = Object.entries(R.refused).sort((a,b)=>b[1]-a[1]);
        const n = ref.reduce((s,x)=>s+x[1],0);
        return `${R.bouts} bouts · ${R.held} reached the balance`
          + (R.bouts ? ` (${Math.round(R.held/R.bouts*100)}%)` : "")
          + ` · ${R.rounds} words spoken`
          + (n ? ` · ${n} weeks refused (${ref.map(x=>`${x[0]} ${x[1]}`).join(", ")})` : "")
          + (R.wrongStakes ? ` · ${R.wrongStakes} at the WRONG STAKES` : "")
          + (R.unresolved ? ` · ${R.unresolved} STILL UNRESOLVED` : "")
          + (R.threw ? ` · ${R.threw} threw` : "");
      } };
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
