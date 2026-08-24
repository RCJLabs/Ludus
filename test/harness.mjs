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
/* A STALE ARTIFACT ANSWERS THE WRONG QUESTION AND SOUNDS CERTAIN DOING IT. `npm test` builds
   before it serves; a probe run by hand does not, and `npm run build` writes index.html while
   every probe here loads dist/test.html — only `build:test` writes that. So a probe run straight
   after an ordinary build measures the PREVIOUS build's source and reports it as today's.

   This is not hypothetical. The face-walk gate below was proved by breaking a section on purpose
   and checking the gate went red; it stayed green, and the reason was this exactly — both the
   clean run and the broken run had loaded the same forty-minute-old test.html. The clean run's
   "INTACT — 32 expected and 32 rendered" was correct by luck, not by method, which is the worse
   of the two outcomes because it is the one you believe.

   So: refuse. Serving a build older than the source it claims to be is the instrument fault this
   project has hit most often, and it costs one stat call to make impossible. LUDUS_STALE_OK=1 for
   the deliberate case — comparing against an old build on purpose. */
function freshness(page){
  const art = path.join(ROOT, page), src = path.join(ROOT, "src/ludus.jsx");
  let a, b; try { a = fs.statSync(art).mtimeMs; b = fs.statSync(src).mtimeMs; } catch { return null; }
  if(a >= b) return null;
  return `${page} is ${Math.round((b-a)/1000)}s older than src/ludus.jsx — it is a PREVIOUS build.\n`
    + `  Run \`npm run build:test\` (not \`npm run build\`, which writes index.html) and try again.\n`
    + `  Set LUDUS_STALE_OK=1 if you meant to measure the old build.`;
}

export function serve({ page = "dist/test.html" } = {}){
  const stale = process.env.LUDUS_STALE_OK ? null : freshness(page);
  if(stale) throw new Error("stale build — " + stale);
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

    /* ---- THE WAGER, WHICH THE ROPE NEVER PLACED (#162) ----
       Every call in here passed `null` for the bet, so nothing in this suite had ever settled one,
       and `bookEye` — the book shortening its board 5.5% for every wager the house wins, to a third
       off — could not be reached by any measurement. `bet: <denarii>` backs the house's man at that
       stake on every single bout it takes. The chance is copied VERBATIM from `makeBet` in the arena
       panel (src:18938), because that is the number the wager is actually struck on: the sheet's man,
       no prep edge, no read on how he means to fight it. Copying it is deliberate and it is the only
       copy in this file — the panel's own price is struck on a DIFFERENT number, which is #162. */
    const betFor = (d, offer, gid, o) => {
      if(!o.bet || !offer || !offer.opp) return null;
      const g = A.activeG(d).find(x=>x.id===gid); if(!g) return null;
      const amt = typeof o.bet === "number" ? o.bet : 200;
      if(d.gold < amt) return null;
      return { amount:amt, against:!!o.betAgainst,
        chance:A.winChance(g, offer.opp, 0, o.tactic || "measured") };
    };

    /* run one offer with whichever engine it belongs to, and answer it */
    const run = (d, offer, ids, opts) => {
      const o = opts || {};
      const list = [].concat(ids || []);
      if(!offer || !list.length) return { ran:false };
      /* #166: the four words on the arena panel, pressed before every bout, and nothing in this
         suite had ever pressed one. The panel writes the same field on the same object. */
      if(o.entrance) offer.entrance = o.entrance;
      let r = offer.melee   ? fin(A.doMelee,     [d, list.slice(0,3), offer, null, null, o.tactic || "measured"])
            : offer.pair    ? fin(A.doPairFight, [d, list.slice(0,2), offer, o.tactic || "measured", null, null])
            : offer.venatio ? fin(A.doVenatio,   [d, list[0], offer, o.tactic || "measured", null, null])
            :                 (()=>{ const bt = betFor(d, offer, list[0], o);
                                       if(bt){ d.gold -= bt.amount; d.flags.lastBet = d.week; R.wagers = (R.wagers||0)+1; }
                                       return fin(A.doFight, [d, list[0], offer, o.tactic || "measured", bt, null, null, o.plan || "none"]); })();
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
      /* which ENGINE the week actually reached. `say()` reported bouts and refusals and nothing
         about the shape of them, so "the reference player fought 0 pairs" was a claim no caller
         could make without writing its own counter — #202's probe was the third to want one. */
      if(offer.pair) R.tookPair = (R.tookPair||0)+1;
      else if(offer.melee) R.tookMelee = (R.tookMelee||0)+1;
      else if(offer.venatio) R.tookHunt = (R.tookHunt||0)+1;
      else R.tookSingle = (R.tookSingle||0)+1;
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
         protect       (one man fed the whole card and nobody else on it, sticky until he is freed,
                        sold or buried. #190's own falsifier, which had never been run: the item
                        claims `wins >= 10` is out of reach of a three-bout median career, and this
                        is the policy that would prove it is not. `true` feeds him everything;
                        `"safe"` also shields the MATCHUP — the card is sorted by the game's own
                        `winChance` and he sits the week out below 0.60, because a policy that
                        throws its man at anything is not a fair test of a gate. Default OFF.)
         pupil         (name the doctore a pupil and rotate it round the active men. Default OFF and
                        off is what every figure before v3.121.0 was measured on: the rope hired a
                        doctore and never named one, so `doctoreWeek` returned early every week and
                        the five `DOC_LESSONS` — including the only lift a living man's potential
                        ever gets — were unreachable by any policy in this directory. #189.)
         gear, party                                                        (default TRUE from v3.17.0)
         contract                                                           (default TRUE from v3.20.0)
         tour          (deliberate touring — the moment a town's welcome wears, move straight to
                        whichever of the three knows the house least, never going home. #160's upper
                        bound on `bayWide`. Implies nothing about `road`, which stays the reactive
                        default; `tour` supersedes its come-home step.)
         bet           (denarii — back the house's man on every SINGLE bout it takes, at the chance
                        the arena panel's `makeBet` stores. Default OFF, and off is the honest
                        default: measured over 24 houses on three seed prefixes wagering 5% of the
                        purse, the arm lived 125w median against the control's 146w and ended on
                        35d against 118d, so it is not free. What it reaches that nothing else did
                        is `bookEye` — 22 of the 24 opened it by median week 2 and 14 sat at the
                        third-off cap by week 33 — which is how #162 was measured. `betAgainst`
                        tells the man to go down instead, which is a different game entirely.)
         favours       (default NONE, #167 — `true` calls every patron favour the moment `favourReady`
                        says it is ready; a rank name or a list of them calls only those, so the four
                        can be priced apart; `"wise"` calls each one only when there is something for
                        it to do, every trigger read off what that favour's own `run` changes; and
                        `"thrift"` calls anything the next census rung will not miss, which is the
                        same lever derived from the COST side instead — #171's second set. The
                        price is the patron's own favour and, through `recomputeFavor`, the house's
                        standing, which is what makes any of these a policy rather than a free lunch)
         favourSkip    (a rank or list of them dropped from whatever `favours` policy is running,
                        so a policy can be ablated one trigger at a time — #171)
         entrance      (default NONE, #166 — one of `ENTRANCE_KEYS`, written onto every offer this
                        rope fights, exactly as the arena panel writes it. `showman` is the one that
                        pays: 6.7 points of win rate on a card the game deals, and all of it is the
                        single point of momentum — split into its terms the sixteen points of crowd
                        are worth 0.0. `boxes` is the missio one and lives outside the editor's cap
                        from v3.59.0; before that the cap ate it whole for any established house.
                        SINGLES ONLY: `doFight` is the only engine that reads `offer.entrance`, so
                        on a melee, a pairing or a hunt the word is written and does nothing.)
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
      /* ---- #189: THE SQUARE, WHICH THIS PLAYER HIRED AND THEN NEVER USED ----
         The rope has hired a doctore since it was written and has never once named him a pupil, so
         `doctoreWeek` returned on its second line every week of every run in this directory and
         `docLesson` — five written lessons, one of which is the only thing in the game that raises
         a living man's POTENTIAL — has never fired in a measurement. That is the difference between
         "the game cannot" and "the policy did not", and it read as the first for #189's champion
         gate until this lever existed. Round-robin over the active men rather than a favourite:
         the question the probe asks is what the SYSTEM can reach, and parking the square on one man
         answers a narrower one. OPT-IN, because it changes what a long-lived house's men become. */
      if(o.pupil === true && d.doctore && !d.doctore.retrainTo){
        const men = A.activeG(d);
        if(men.length){
          const now = d.doctore.pupil;
          const next = men[(d.week||0) % men.length];
          if(next && next.id !== now){
            if(now) fin(A.setPupilTo,[d, now]);          /* it toggles, so clear before naming */
            if(fin(A.setPupilTo,[d, next.id])) bump("pupil");
          }
        }
      }
      /* ---- #197: AND THE SECOND SEAT, which the round-robin above cannot reach ----
         `pupil:true` rotates ONE man through the square. `pupil:"two"` keeps BOTH seats filled and
         rotates the pair, which is the only policy that can say what a second seat is worth. It
         fills them from the front of the roster rather than by stat, so the arm is not also a
         "train your best men" policy wearing this one's name. */
      if(o.pupil === "two" && d.doctore && !d.doctore.retrainTo){
        const men = A.activeG(d);
        if(men.length >= 2){
          const w = d.week || 0;
          const want = [men[w % men.length], men[(w + 1 + Math.floor(w / men.length)) % men.length]]
            .filter((g,i,ar)=>g && ar.indexOf(g) === i);
          if(want.length === 2){
            const on = fin(A.squareMen,[d]) || [];
            const same = on.length === 2 && want.every(g=>on.includes(g.id));
            if(!same){
              for(const id of on) fin(A.setPupilTo,[d, id]);       /* empty it, then seat the pair */
              for(const g of want) fin(A.setPupilTo,[d, g.id]);
              bump("pupil");
            }
          }
        }
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
            /* mending is switchable so a probe can run a house that ARMS its men and then lets the
               steel go — the state the armory's "steel is close to going" item exists for. Turning
               the whole gear step off does not reach it: with nothing bought there is no steel to
               wear out, and the item cannot fire for want of a subject. */
            if(worn && !bare && o.mend !== false){
              const fee = fin(A.repairFee,[d, g]) || 0;
              if(fee > 0 && fee <= spareNow() * 0.25 && fin(A.mendKitOf,[d, g.id])){ bump("mended"); continue; }
            }
            /* AND `mend:false` ALONE DOES NOT NEGLECT ANYTHING. Skipping the mend drops straight
               through to the buy below, so a worn piece is REPLACED instead of repaired — which is
               more attentive, not less. A probe using it to make decaying steel measured 2,323
               house-weeks without a single piece under 34 and nearly concluded the armory's agenda
               line was unreachable. `neglect` is the arm that actually leaves steel alone: arm a man
               who has nothing, and after that never mend and never replace. */
            if(worn && !bare && o.neglect) continue;
            const master = A.masterOpen && A.masterOpen(d);
            /* ---- WHICH END OF THE RACK, AS A SWITCH ----
               This has always taken the DEAREST piece it can afford, on the assumption that price
               buys quality — which the catalogue bears out, rho +0.79 on weapons. But the armory
               lists gear cheapest first, so if that assumption is right the UI is putting the pieces
               a good player wants at the bottom of the longest scroll in the game, and if it is
               wrong the rope has been overpaying for 80 releases. Either way it is worth knowing
               rather than assuming, so the end is an option and both arms can be run on one seed. */
            const afford = Object.entries(A.GEAR)
              .filter(([id,it])=> it.slot === s && it.price > 0
                && (!it.styles || !it.styles.length || it.styles.includes(g.cls))
                && (!it.master || master)
                && it.price <= (it.master ? spareNow()/3 : spareNow()*0.4));
            const want = (o.gearEnd === "cheap"
              ? afford.slice().sort((a,b)=> a[1].price - b[1].price)
              : afford.slice().sort((a,b)=> b[1].price - a[1].price))[0];
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
      /* ---- #167: THE FOUR FAVOURS, WHICH NOTHING HAD EVER CALLED ----
         All four ranks are held and READY on essentially every patron-week a played house has —
         6,555 to 6,823 of them over 18 houses — and `callFavour` was dark in every measurement this
         project has taken. It is not unreachable content; it is a lever nobody pulls, which is
         #158's shape. `favours:true` calls every one the moment it is ready; `favours:"senator"` or
         a list calls only those ranks, so the four can be priced apart. The cost is the patron's own
         favour, and `recomputeFavor` takes the house's standing down with it, which is why "call
         everything" is a policy and not a free lunch. */
      if(o.favours && typeof A.callFavour === "function"){
        /* `wise` calls each favour ONLY when there is something for it to do, and every trigger is
           read off what the favour's own `run` changes rather than off a number somebody chose:
             magistrate  there is a poach or a soft nemesis for it to clear — the two things it clears
             merchant    gold is below the rope's own reserve, the same trigger the loan lever uses
             noble       the biggest rival's name is ahead of the house's own, and she takes a fifth
             senator     fame is within the 150 that `romeEarly` takes off `romeBar`, so the 150 bridges
           Without this the arm is "call it the moment it is ready", which is the clause #167 was
           opened with and also the least considered policy in the game. */
        const rivalTop = k => (d.rivals||[]).slice().sort((a,b)=>(b[k]||0)-(a[k]||0))[0] || null;
        const WISE = {
          magistrate: () => !!d.poach || !!(d.nemHouse) || !!(d.nemesis && !d.nemesis.hated),
          merchant:   () => d.gold < LAN.reserve(d),
          noble:      () => { const h = rivalTop("fame"); return !!h && (h.fame||0) > (d.fame||0); },
          senator:    () => typeof A.romeBar === "function" && !d.rome
                            && (d.fame||0) >= fin(A.romeBar,[d]) - 150,
        };
        /* ---- AND A SECOND SET, DERIVED FROM THE OTHER SIDE (#171) ----
           `wise` reads every trigger off the BENEFIT — what that favour's own `run` changes. #167's
           clause was that the gain might be an artefact of one trigger set, so `thrift` reads them
           off the COST instead and asks nothing about the world: the price of a favour is the
           house's standing, and the only thing standing is FOR is the next rung of the census, so
           call anything the rung will not miss. `riseNeed(d).favor` is the game's own ask and
           `F.cost` the game's own price; the test is deliberately conservative, because the actual
           drop in `d.favor` is a weighted mean and therefore smaller than the cost. At the top of
           the ladder there is no next rung and nothing to save it for, and this becomes `true`. */
        const wise = o.favours === "wise", thrift = o.favours === "thrift";
        const need = thrift ? fin(A.riseNeed,[d]) : null;
        const floor = need ? (need.favor||0) : 0;
        const want = (o.favours === true || wise || thrift) ? null : [].concat(o.favours);
        for(const pt of A.patronsOf(d)){
          if(want && want.indexOf(pt.rank) < 0) continue;
          /* `favourSkip` drops one rank from whatever policy is running, so a policy can be
             ablated a trigger at a time and "a considered set" told from "one good trigger" */
          if(o.favourSkip && [].concat(o.favourSkip).indexOf(pt.rank) >= 0) continue;
          if(wise && !(WISE[pt.rank] && WISE[pt.rank]())) continue;
          if(thrift && !((d.favor||0) >= floor + ((A.FAVOURS[pt.rank]||{}).cost||0))) continue;
          if(!fin(A.favourReady,[d, pt])) continue;
          if(fin(A.callFavour,[d, pt.id])) bump("favour:" + pt.rank);
        }
      }
      if(o.party !== false && typeof A.hostParty === "function"){
        const need = o.party === "rung" && typeof A.riseNeed === "function" ? fin(A.riseNeed,[d]) : null;
        const wants = o.party !== "rung" || !need || (d.favor||0) < (need.favor||0);
        const sp = d.gold - LAN.reserve(d);
        const kind = !wants ? null : sp > 4000 ? "decadent" : sp > 1600 ? "lavish" : sp > 700 ? "modest" : null;
        if(kind && fin(A.hostParty,[d, kind])) bump("party");
      }
      /* ---- THE LAW, AND A LEVER THIS ROPE NEVER HAD ----
         `asks` reported law heat among the quantities the week's list is blind to, and this rope
         could not test the claim either way: it has levers for men, gear, works, parties, rites,
         stakes and tactics and had NONE for gambits, so no policy in this suite had ever bribed an
         editor or put money in front of a rival's best man — the things heat is a measure of.

         Written, and measured against v3.113.0, 14 houses x 400 weeks an arm:

                        mean heat   h>=45    h>=70    h>=90   urg-3 breach row   `banned` fires
           honest            20.5   16.2%     5.7%     0.9%              12.1%            0.4%
           gambit:6          43.5   51.2%    22.7%     8.3%              25.8%            0.3%
           gambit:1          38.8   42.3%    21.5%    11.1%              12.1%            0.0%

         THE LAW IS LIVE, AND IT WAS ALREADY LIVE FOR AN HONEST HOUSE. Over four hundred weeks an
         ordinary house is in breach on 38% of them and past heat 45 on 16%, and `banned` — the
         "STRUCK FROM THE ROLL" ending — fires at 0.4%, which is `ends`' own figure of one or two
         houses in twenty-four. Playing the law game roughly triples the time spent past the gates.
         There was nothing here to build; the quiet `asks` found was its own diff of label SETS,
         and heat's work is on the URGENCY of a row that is not present every week.

         ---- TWO THINGS THIS COMMENT SAID BEFORE, WRONGLY ----
         It read "nobody had ever broken it" off an honest arm at mean heat 7.6 with 0% past every
         gate. That arm was 8 houses x 320 weeks: heat accumulates with a house's AGE through
         edicts and standing breaches, and at 320 weeks the honest house has not got there yet. The
         same arm at 400 weeks is 20.5 and past 45 on 16% of weeks. A short run measured a young
         house and I read it as a fact about the system.
         And the numbers before that were taken against a build 65 versions old, after the
         container reset the tree to v3.48.0 mid-session and `npm run build:test` quietly rebuilt
         from it. The tell was dist/test.html dropping 3,038KB -> 2,812KB in a step that changed no
         source. Check the version when a number moves for no reason.

         OPT-IN, because turning it on by default would move every measurement in the suite.
         `gambit:N` throws the best-odds trick it can afford at a live rival every N weeks;
         `gambit:true` is every six. It spends only above `LAN.reserve(d)`, like every other
         spending step here — an earlier copy of this policy living inside the probe did not, killed
         every house inside fifty weeks, and had me writing "a gambit every week kills the house"
         as though it were a fact about the game. */
      if(o.gambit && typeof A.runGambit === "function"){
        const every = typeof o.gambit === "number" ? Math.max(1, o.gambit) : 6;
        if(d.week % every === 0){
          const rivals = (d.rivals||[]).filter(x=>!x.retired);
          const keys = Object.keys(A.GAMBITS || {});
          if(rivals.length && keys.length){
            const priced = keys.map(k=>({ k,
              cost: (()=>{ const c = A.GAMBITS[k].cost; return typeof c === "function" ? (fin(c,[d]) || 0) : (c || 0); })(),
              odds: fin(A.gambitOdds,[d,k]) || 0 }))
              .filter(x=>x.cost > 0 && x.cost <= d.gold - LAN.reserve(d));
            if(priced.length){
              priced.sort((x,y)=>y.odds - x.odds);
              const target = rivals[d.week % rivals.length].name;
              const r = fin(A.runGambit,[d, priced[0].k, target]);
              if(r) bump(r.won ? "gambitWon" : "gambitLost");
            }
          }
        }
      }
      /* ---- #198: THE FRIENDLY MIRROR OF `gambit`, and it has to exist before the item can be judged ----
         Every `warmMove` in the game is either the game's own 5.5% weekly roll or +1.1 a card the
         BILL chose, so "warmth never gets anywhere" was a claim about a player with no way to try.
         `overture:N` makes the best-odds approach it can afford to the warmest live rival every N
         weeks; `overture:true` is every six, which is the cooldown. It targets the WARMEST rather
         than round-robin, because a lanista trying to make a friend works on the one who is already
         nearest — and round-robin against four houses at one approach a season reaches none of
         them. Cost is checked against the same reserve every other spend in this rope respects. */
      if(o.overture && typeof A.runOverture === "function"){
        const every = typeof o.overture === "number" ? Math.max(1, o.overture) : 6;
        if(d.week % every === 0 && fin(A.overtureReady,[d])){
          const live = (d.rivals||[]).filter(x=>!x.retired);
          const keys = (A.OV_KEYS || []).filter(k=>!fin(A.overtureWhy,[d,k]));
          if(live.length && keys.length){
            const target = live.slice().sort((x,y)=>(y.warm||0) - (x.warm||0))[0];
            const priced = keys.map(k=>({ k,
              cost: (()=>{ const c = A.OVERTURES[k].cost; return typeof c === "function" ? (fin(c,[d]) || 0) : (c || 0); })(),
              odds: fin(A.overtureOdds,[d, k, target]) || 0 }))
              .filter(x=>x.cost <= d.gold - LAN.reserve(d));
            if(priced.length){
              priced.sort((x,y)=>y.odds - x.odds);
              const r = fin(A.runOverture,[d, priced[0].k, target.name]);
              if(r) bump(r.won ? "overtureTaken" : "overtureRefused");
            }
          }
        }
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
        else if(A.nemEdge(d) < 1 && A.nemAnswerReady(d) && spare() > A.nemAnswerCost(d)
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
        let safePick = null;
        let men = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0) < 55 && !bench.has(g.id))
          .sort((x,z)=>av(z)-av(x));
        /* ---- #202: THE PAIR THE REFERENCE PLAYER NEVER TAKES ----
           `takeBout` filters the bill by stakes and then takes `pool[0]`. `makeGames` pushes every
           single before it calls `addPair`, so the first matching offer is a single on essentially
           every card the house is ever shown, and the reference player's pair count over a played
           house is a fact about ARRAY ORDER, not about the game. `AMBITIONS.beside` is met only
           inside `doPairFight`, and only when the two men already carry a `brother` tie, so a
           question about whether that ambition is reachable cannot be asked with a policy that
           never enters a pair.
           `pairs:true` is that policy and nothing more: when the bill carries a pair, take it, and
           send the two men who are already brothers if two such men are fit — which is exactly what
           a lanista trying to meet the ambition would do. Everything else about the week is
           untouched, so the arm is comparable to the reference player one bout at a time. */
        let pairPick = null;
        if(o.pairs){
          const fitId = new Set(men.map(g=>g.id));
          const bro = (A.tieList ? A.tieList(d) : (d.ties||[]))
            .filter(t=>t.kind==="brother" && fitId.has(t.a) && fitId.has(t.b))
            .sort((x,z)=>(z.strength||0)-(x.strength||0))[0];
          if(bro){
            const a = men.find(g=>g.id===bro.a), b = men.find(g=>g.id===bro.b);
            if(a && b) men = [a, b].concat(men.filter(g=>g!==a && g!==b));
          }
          pairPick = pool => pool.find(x=>x.pair) || pool[0];
          R.pairsSeen = (R.pairsSeen||0) + 1;
        }
        /* ---- #190: ONE MAN FED THE WHOLE CARD, which is the falsifier's own policy ----
           `rudisEligible` wants `wins >= 10` against a career the steel audit measured at THREE
           bouts at the median, and the clause written beside #190 when it was opened says: falsifies
           if a policy that protects one man — benching the rest, feeding him the card — gets him to
           ten wins reliably, in which case the item is about the reference player spreading its
           bouts and not about the gate. `bench` is the wrong shape for that: it takes fixed ids and
           the roster turns over. This is its inverse and it is STICKY — the same man every week
           until he is freed, sold or buried — because a champion who changes with the stat sort is
           the spread policy again under another name. Nobody else fights; if he is hurt or spent,
           the house takes no bout that week, which is the cost the policy is meant to pay. */
        /* the outer guard was `=== true` and the "safe" mode nests inside it, so `protect:"safe"`
           skipped the whole branch and ran as a plain CONTROL while reporting itself as the arm —
           it came back with MORE bouts than the crude arm, which is the shape of a lever that is
           not connected, and #136's rule caught it. */
        if(o.protect){
          const live = g => g && g.status === "active" && !A.isGone(g);
          let champ = d.__protectId ? A.activeG(d).find(g=>g.id === d.__protectId) : null;
          if(!live(champ)){
            /* the man nearest the gate — and on a roster where nobody has won anything yet that
               tie-breaks to the STRONGEST man rather than to whoever `activeG` happens to list
               first. The first cut sorted on wins and pfame alone, so a new house protected an
               arbitrary man and the card it was offered gave him a median 12% chance: the arm was
               feeding its worst fighter and reporting the gate as unreachable. */
            const av = g => A.STATS.reduce((s,k)=>s+(g[k]||0),0)/6;
            champ = A.activeG(d).filter(g=>!g.auctor)
              .sort((a,b)=>((b.wins||0)*1000 + (b.pfame||0) + av(b)) - ((a.wins||0)*1000 + (a.pfame||0) + av(a)))[0];
            d.__protectId = champ ? champ.id : null;
          }
          men = champ ? men.filter(g=>g.id === champ.id) : [];
          /* ---- AND THE STRONGER READING OF "PROTECTS", because the weak one is not a fair test ----
             `protect:true` feeds him EVERY card, which is the opposite of protection and kills him:
             67 protected men over 4 houses held the card a median of 3 weeks and 57 of them were
             buried. A gate is not proven unreachable by a policy that throws its man at everything.
             `protect:"safe"` shields the matchup as well: the card is sorted by the game's own
             `winChance` and he sits the week out rather than take one he is not favoured to win.
             0.60 is the bar and it is a POLICY number living in the rope, not a game constant —
             it is "clearly favoured" rather than "even money", which is what a lanista protecting
             an investment would hold out for. */
          if(o.protect === "safe" && men.length && champ){
            const tac = o.tactic || "measured";
            const ch = x => { try { return x && x.opp ? A.winChance(champ, x.opp, 0, tac) : 0; } catch(e){ return 0; } };
            /* the candidates `takeBout` would actually see, which is NOT just the arena bill: most
               of this rope's bouts come from the PIT, generated on the fly when the bill is empty.
               Scoring the bill alone read "best card on offer: median 0%" and sat out 135 weeks of
               138 — a lever that refuses everything looks exactly like a game that offers nothing. */
            let singles = ((d.games && d.games.offers) || []).filter(x=>!x.melee && !x.pair && x.opp);
            if(!singles.length && !d.city && !d.rome){
              try {
                if(!d.pitCard || d.pitCard.week !== d.week) A.makePitCard(d);
                const pm = A.pitMen(d) || [];
                const po = A.makePitOffer(d, champ, "standard", pm.length ? pm[0].id : null);
                if(po && po.opp) singles = [po];
              } catch(e){}
            }
            const best = singles.map(ch).sort((a,b)=>b-a)[0] || 0;
            R.safeSeen = (R.safeSeen||0) + 1;
            (R.safeBest = R.safeBest || []).push(Math.round(best*100));
            if(best < (typeof o.protectBar === "number" ? o.protectBar : 0.60)){ men = []; R.safeSat = (R.safeSat||0) + 1; }
            else safePick = pool => pool.slice().sort((a,b)=>ch(b) - ch(a))[0];
          }
        }
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
        const t = takeBout(d, { men, pick: safePick || pairPick,
          wantStakes:   d.rome ? null : (o.wantStakes || (o.preferStakes ? null : (o.stakes || "standard"))),
          preferStakes: d.rome ? null : (o.preferStakes || null),
          /* ---- THE CRUX ANSWER WAS A CONSTANT NOBODY CHOSE, AND IT WAS THE LETHAL ONE — #185 ----
             This read `o.choice || "press"` from the day the step was written, so the reference
             player answered EVERY crux front-foot and every figure this project published before
             v3.79.0 was taken inside that policy. It was never a decision; it was a default.
             Measured, all four answers, 72 houses of 420 weeks an arm, paired, control first
             (v3.76.0 for the first four columns, v3.78.0 for the wins):

               arm      bouts    wins   WIN RATE   deaths a bout   killed   alive at 420w   median life
               press    14788    4264     28.83%          19.03%     1657            18          207w
               cover    15886    4769     30.02%          13.68%     1651            18          240w
               finish   13676       —          —          17.34%        —            11          237w
               cloth     3294       —          —          14.94%        —             0           49w

             `cover` takes deaths a bout **-5.4 points** (p=0.002, 22u/50d, needs 19 of 72) and holds
             **+0.9 men** (needs 65 of 72). `finish` is indistinguishable from pressing on every
             quantity. Blanket `cloth` is ruinous — 0 of 72 alive at 420 weeks against 18.
             And the objection the CRUX table itself raises — cover means "He wins less and lives
             more" — is not supported: covering wins **30.02% against 28.83%**, and kills as many
             opponents (1,651 against 1,657) while losing far fewer of its own. The paired per-house
             test cannot resolve a win difference (needs 1,301) so that is written as unsupported
             rather than disproved, but every reading agrees on the sign and none supports the table.
             So: better on everything measurable, worse on nothing. The default moves.
             WHAT THIS INVALIDATES is written up in v3.79.0 and is not small — `open`'s signature,
             every bar calibrated on rope output, and every death rate published before it. */
          choice: o.choice || "cover",
          /* and the lever the note above this one is about caught the NEXT lever added: `entrance`
             shipped with `run` honouring it and this call not forwarding it, so four career arms
             came back byte-identical — 1787 bouts and 345 deaths in all four, which is what an
             unconnected lever looks like every time. */
          entrance: o.entrance || null,
          bet: o.bet || null, betAgainst: !!o.betAgainst,
          pick: us => { const pr = us.filter(x=>x.primus); return (pr.length ? pr : us)
            .sort((a,b)=>(b.purse||0)-(a.purse||0))[0]; } });
        if(t && t.ran !== false){
          bump("bout");
          if(t.offer && t.offer.primus) bump("primusBout");
          if(t.offer && t.offer.imperial) bump("imperialBout");
          if(t.res && t.res.win) bump("won");
          /* ---- #200: WHAT THE BOUT ACTUALLY WAS, not just that there was one ----
             `lanista` read `t.res.win` and threw the rest away, so any question about the SHAPE of
             the bouts a house fights — how long, how loud, who died — had no answer short of a
             probe writing its own player. The row is compact and capped; nothing else reads it. */
          if(t.res && (R.boutLog = R.boutLog || []).length < 20000){
            const r = t.res;
            R.boutLog.push({ venue:r.venue || (t.offer && t.offer.venue) || null,
              sky:(t.offer && t.offer.sky) || null, tier:r.tier != null ? r.tier : (t.offer||{}).tier,
              stakes:r.stakes || (t.offer||{}).stakes || null,
              crowd:r.crowd != null ? Math.round(r.crowd) : null,
              beats:(r.beats||[]).length, rounds:t.rounds || 0,
              win:!!r.win, mine:!!r.dead, kind: r.pair ? "pair" : r.melee ? "melee" : r.venatio ? "hunt" : "single",
              killed:(r.beats||[]).some(b=>b && b.kind === "death"),
              spared:(r.beats||[]).some(b=>b && b.kind === "spared") });
          }
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
      if(on("road") && !o.tour && d.city && !d.travel && !d.rome && A.welcomeOf(d) < 1){
        if(fin(A.comeHome,[d])) bump("cameHome");
      }
      /* ---- THE HOUSE THAT WORKS THE WHOLE BAY (#160) ----
         `road` is REACTIVE: it takes the invitation `bayCall` happens to send and comes home when
         the welcome wears. `tour:true` is the deliberate policy — break camp the same week and go
         straight to whichever of the three towns knows the house least, never touching Capua in
         between, because `setOut` will carry a house from one town to another directly. It is the
         upper bound on "can a house be known the length of the bay", which `bayWide` wants at 150
         of a possible 180 while `BAY_DECAY` takes 0.55 a week off every town you are not standing
         in. Off by default: it is a measuring arm, not the reference player. */
      if(o.tour && !d.travel && !d.rome && !d.over && A.welcomeOf(d) < 1){
        const towns = (A.CITY_KEYS||[]).filter(k=>k !== d.city);
        const next = towns.sort((a,b)=>A.knownIn(d,a) - A.knownIn(d,b))[0];
        if(next && fin(A.setOut,[d, next])) bump("setOut");
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
      /* ---- reset() NAMED ITS FIELDS BY HAND AND SO IT ALWAYS LAGGED ----
         It cleared six counters and `refused`. `safeSeen`, `safeSat` and `safeBest` were added for
         #190 and never joined the list; the engine counters added for #202 would have been the
         fourth and fifth to miss it. A probe running an arm and its control on ONE PAGE reads the
         second arm's figures with the first arm's still inside them, and nothing says so — #202's
         first run reported the pairs arm at 253 pair bouts against a control of 118 when the true
         second number was 135. So this resets whatever `R` is holding, by shape, and cannot drift
         behind the counters again. `R` holds only counters; the rope's functions are closures. */
      reset: ()=>{ for(const k of Object.keys(R)){
        if(Array.isArray(R[k])) R[k] = [];
        else if(R[k] && typeof R[k] === "object") R[k] = {};
        else if(typeof R[k] === "number") R[k] = 0; } },
      /* one line a check can print so its own rope is visible in the log. The refusals are on it
         because they were legible in the return and nothing forced a caller to look: a check that
         asked for 300 bouts and was refused 200 of them reported the 100 and said nothing. */
      say: ()=>{
        const pctl = (a,f)=>{ const z=[...a].sort((x,y)=>x-y); return z[Math.min(z.length-1,Math.floor(z.length*f))]; };
        const ref = Object.entries(R.refused).sort((a,b)=>b[1]-a[1]);
        const n = ref.reduce((s,x)=>s+x[1],0);
        return `${R.bouts} bouts · ${R.held} reached the balance`
          + (R.bouts ? ` (${Math.round(R.held/R.bouts*100)}%)` : "")
          + ` · ${R.rounds} words spoken`
          + (n ? ` · ${n} weeks refused (${ref.map(x=>`${x[0]} ${x[1]}`).join(", ")})` : "")
          + (R.wrongStakes ? ` · ${R.wrongStakes} at the WRONG STAKES` : "")
          + ` · engines: ${R.tookSingle||0} single, ${R.tookPair||0} pair, ${R.tookMelee||0} melee, ${R.tookHunt||0} hunt`
          + (R.safeSeen ? ` · protect:safe sat out ${R.safeSat||0} of ${R.safeSeen} weeks it was asked`
              + (R.safeBest && R.safeBest.length ? ` (best card on offer: p10 ${pctl(R.safeBest,.1)}% · median ${pctl(R.safeBest,.5)}% · p90 ${pctl(R.safeBest,.9)}%)` : "") : "")
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

/* ---- NAVIGATION IS THE SCENE NOW, AND SO IS THIS HELPER ----
   v3.92.0 removed the tab bar: the drawn ludus is the nav, with one "back to the ludus" door
   everywhere else. This helper walks the same path a player does — home first, then through the
   room — rather than reaching for buttons that no longer exist. Face chips (The Roster, The
   Armoury…) still carry role=tab and still route through the old matcher, so callers that pass a
   chip label are untouched. `armory` gets the two-step it always needed: the yard, then the chip —
   the old matcher never actually worked for it, because the label is spelled Armoury.
   Every arrival is VERIFIED against the shell's data-place, not assumed from the click. */
const SCN_DOOR = { familia:"the yard", men:"the yard", arena:"the road", market:"the gate", villa:"the villa" };
export const tab = async (p, key) => {
  const k = String(key).toLowerCase();
  if(!(k in SCN_DOOR) && k !== "ludus" && k !== "armory")
    return p.evaluate(kk=>{ const t=[...document.querySelectorAll("button[role=tab]")]
      .find(b => new RegExp(kk,"i").test(b.getAttribute("aria-label")||""));
      if(t){ t.click(); return true; } return false; }, key);
  const home = () => p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/back to the ludus/i.test(x.getAttribute("aria-label")||"")); if(b){ b.click(); return true; } return false; });
  const place = () => p.evaluate(()=>{ const sh=document.querySelector("[data-place]");
    return sh ? sh.getAttribute("data-place") : null; });
  /* POLL, NEVER SLEEP-AND-HOPE. The first version waited 180ms after the home click and clicked
     the door blind; on a slow run the scene had not mounted, the door missed, and reach read the
     LUDUS's buttons under the market's name -- the dedup then emptied the place and the tally
     said "market 5 -> 0" on a build where nothing about the market changed. Arrivals are awaited
     against data-place, and the door retries once. */
  const until = async (fn, ms) => { const t0 = Date.now();
    while(Date.now() - t0 < ms){ if(await fn()) return true; await p.waitForTimeout(90); } return fn(); };
  if(await place() !== "ludus"){
    await home();
    if(!await until(async()=>(await place())==="ludus", 2200)) return false;
  }
  if(k === "ludus") return (await place()) === "ludus";
  const door = SCN_DOOR[k] || SCN_DOOR.familia;
  /* PREFIX, NOT SUBSTRING. The gate's aria is "The gate -- the block and the road out", which
     CONTAINS "the road" -- so knocking for the road opened the gate, the arena read measured the
     market, and the label-dedup then handed every market action to "arena": the tally said
     "market 5 -> 0" while the market itself was untouched. Every door's first words are unique;
     nothing else about an aria-label is guaranteed to be. */
  const knock = () => p.evaluate(lab=>{ const g=[...document.querySelectorAll(".scn")]
    .find(x=>(x.getAttribute("aria-label")||"").toLowerCase().startsWith(lab));
    if(!g) return false; g.dispatchEvent(new MouseEvent("click",{bubbles:true})); return true; }, door);
  const wantP = (k === "familia" || k === "armory") ? "men" : k;
  if(!await knock()) { await p.waitForTimeout(250); if(!await knock()) return false; }
  if(!await until(async()=>(await place())===wantP, 2200)) return false;
  if(k === "armory"){
    await p.evaluate(()=>{ const c=[...document.querySelectorAll("button[role=tab]")]
      .find(b=>/armoury/i.test(b.getAttribute("aria-label")||b.innerText||"")); if(c) c.click(); });
    await p.waitForTimeout(160);
  }
  return (await place()) === wantP;
};

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
      /* ---- "I KNOW THE WORK" IS AN OPT-OUT, NOT AN ACKNOWLEDGEMENT ----
         It was in this list, and it MANUFACTURED the overlay this function then could not clear:
         pressing it opens the charter's confirm, the modal branch above answers that with its last
         button ("Think again"), which returns to the charter, whose opt-out this line presses
         again — round and round until `rounds` runs out, leaving LEAVE OFF THE CHARTER standing
         over the page. Every check that calls clearAll() and then reads the screen was reading
         through it. `guards` found this; two probes this session had worked around it by hand
         without anyone asking why the workaround was needed.
         Nothing depends on the press: sand, room and relay all switch the lessons off in STATE
         (flags.noLessons), which is the honest way to want them gone. */
      const rx = /^(understood|i know my trade|carry on|so be it|the doctore nods|next|go on|begin|done|got it|skip|think again)$/i;
      const el = [...document.querySelectorAll("button")].find(b => rx.test((b.innerText||"").trim()) && !b.disabled);
      if(el){ el.click(); return true; }
      return false;
    });
    if(!hit) return;
    await p.waitForTimeout(180);
  }
}

/* ---- PLANTING A HOUSE, AND PROVING IT TOOK ----
   Fifteen checks forge a whole state into a save slot and then measure the screen that comes
   back. `room` showed what happens when the plant does not take: it forges the widest line the
   interface can be asked to draw, and on the runs where the app's autosave got there first it
   measured a RANDOM house against that line and reported the line "is not on the panel". It had
   been passing on the wrong fixture some of the time — a vacuous pass in a check that had never
   once gone red, and a bisect found it rather than any guard.

   `fixtures` bars the specific race statically (nothing may yield between the write and the
   reload). This is the other half, and it is the half a static rule cannot reach: the plant is
   STAMPED, and if the stamp does not survive the load the check stops with a sentence saying so
   instead of quietly measuring somebody else's house.

   The builder runs in the page with the handle and the rope, and returns either
     the state to plant, or
     { plant: state, ...anything } — the rest comes back to the caller, because several of these
       forges also compute the numbers the check is about to assert against, and splitting that
       into two round trips would be a worse shape than the one it replaces, or
     { why: "..." } with no `plant` — an early-out, returned untouched.
   Nothing yields between the write and the reload, by construction. */
export async function forge(p, build, arg = null){
  const token = "fg" + Math.random().toString(36).slice(2, 10);
  const out = await p.evaluate(([src, token, arg]) => {
    const A = window.__LVDVS, R = window.__ROPE;
    const res = (new Function("A", "R", "arg", "return (" + src + ")(A, R, arg)"))(A, R, arg);
    if(!res || typeof res !== "object") return { __forge:"the builder returned nothing to plant" };
    const d = res.plant || (res.gladiators ? res : null);
    if(!d) return res;                       /* an early-out, e.g. { why: ... } — hand it back */
    d.flags = d.flags || {};
    d.flags.__forge = token;
    /* EVERY SLOT, not the first one found. "Take up the keys" resumes the ACTIVE slot, and a
       find-first write can land in a different one — which is how scene's yard fixture once
       reported a roster of five with two men drawn, two different houses in one sentence. The
       check that learned it wrote to every slot by hand; the helper does it for everyone. */
    const keys = Object.keys(localStorage).filter(q=>/ludus-slot-\d/.test(q));
    if(!keys.length) return { __forge:"no ludus slot to write into — found() has not run" };
    const blob = JSON.stringify(d);
    for(const k of keys) localStorage.setItem(k, blob);
    const rest = {}; for(const key of Object.keys(res)) if(key !== "plant") rest[key] = res[key];
    return Object.assign(rest, { __planted:true });
  }, [build.toString(), token, arg]);

  if(out && out.__forge) throw new Error(`forge(): ${out.__forge}`);
  if(!out || !out.__planted) return out;     /* the builder chose not to plant */

  await p.reload({ waitUntil:"domcontentloaded" });
  await p.waitForTimeout(1100);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/take up the keys/i.test(x.innerText||"")); if(b) b.click(); });
  await p.waitForTimeout(1100);

  const got = await slot(p);
  if(!got || !got.flags || got.flags.__forge !== token)
    throw new Error("forge(): the planted house did not survive the load — the app's own save is "
      + "on screen instead, so everything measured after this would be another house. Check that "
      + "nothing yields between the write and the reload (see the `fixtures` check).");
  const rest = {}; for(const k of Object.keys(out)) if(k !== "__planted") rest[k] = out[k];
  return rest;
}

/* autosave is debounced 500ms — anything less and you read the week before */
/* ---- WAIT OUT THE PAGE TURN, OR MEASURE A ROTATED BOX ----
   `.leaf` animates the page wrapper on every tab change (src:209):

       from { transform: perspective(1500px) rotateY(-74deg); opacity:.15 }
       to   { transform: perspective(1500px) rotateY(0);      opacity:1   }
       .42s cubic-bezier(.22,.61,.36,1)

   An element's getBoundingClientRect() mid-rotation is the box of the ROTATED shape, and at -74deg
   under a 1500px perspective that box is about 143px wide against a settled 390. Nothing about it
   reads as an error: it comes back as a plausible number.

   THE WINDOW IS NARROWER THAN THE ANIMATION. The easing is fast-out, so the wrapper is back to
   ~400px by 150ms and 390px by 430ms — measured. The genuinely wrong readings live in the first
   60-80ms, which is exactly the length of one Playwright evaluate round-trip. That is why a probe
   doing `tab(); evaluate()` lands in it and a check doing `tab(); wait; clearAll(); tab(); wait`
   never does: audited with LUDUS_TURN_WATCH across palette, room, sand, seller, surface and sweep,
   and NONE of them was ever caught mid-turn. Their settle() calls are insurance for the next edit,
   not repairs — the numbers did not move when they were added.

   It cost real work once: two probes disagreed about the market by 210px and there was no game
   fault between them. So settle() waits the animations out and then ASSERTS the wrapper is its
   full width, throwing rather than returning a number it cannot stand behind.

   Set LUDUS_TURN_WATCH=1 to have every settle() point report when it finds the page still turning.

   The animation wait is capped. `a.finished` on an INFINITE animation never resolves, and one
   added to the page later would hang every check that calls this. Chrome does not list SVG SMIL in
   getAnimations() — the scene's pulsing caller badge is invisible to it, checked — but a CSS
   `infinite` would be listed, and a hang is a far worse failure than a slightly early read. */
export async function settle(p, { min = 340, cap = 1500 } = {}){
  if(process.env.LUDUS_TURN_WATCH){
    const w0 = await p.evaluate(()=>{ const el = document.querySelector(".scroll > div");
      return el ? Math.round(el.getBoundingClientRect().width) : -1; });
    if(w0 >= 0 && w0 < min) console.log(`  !! MID-TURN at a measurement point: wrapper ${w0}px`);
  }
  await Promise.race([
    p.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})))),
    new Promise(r=>setTimeout(r, cap)),
  ]);
  await p.waitForTimeout(120);
  const w = await p.evaluate(()=>{ const el = document.querySelector(".scroll > div");
    return el ? Math.round(el.getBoundingClientRect().width) : -1; });
  /* No wrapper is not a fault: a full-screen modal or the founding screen legitimately has none,
     and a check measuring one of those still wants the animations flushed. Only the page CAUGHT
     MID-TURN is a fault, because that is the reading nobody can tell is wrong. */
  if(w < 0) return 0;
  if(w < min) throw new Error(`settle(): the page is still turning — the wrapper reads ${w}px wide, not ~390. Every geometry read here would be the box of a rotating element.`);
  return w;
}

export const waitSaved = p => p.waitForTimeout(950);

export const slot = p => p.evaluate(()=>{
  let best = null;
  for(const k of Object.keys(localStorage)){
    if(!/ludus-slot-\d/.test(k)) continue;
    try { const v = JSON.parse(localStorage.getItem(k)); if(v && v.gladiators) best = v; } catch(e){}
  }
  return best;
});

/* ---- AND `seed` EXISTS BECAUSE A YARDSTICK NEEDS THE SAME HOUSE TWICE ----
   Leaving the field empty is the right default for every check that wants a house nobody has run —
   `survive`'s whole retry rests on two draws being independent. But a measurement meant to be
   DIFFED across builds cannot afford it: `reach` founded a random house each run, so its first two
   nav-tally rows read 38 actions and then 40, and the y of every button moved with a roster that had
   nothing to do with the build. Two rows like that cannot be compared, which is the one thing the
   tally was written for. Pass a seed and the same Capua is built every time. */
export async function found(p, { scenario = /clean start|even hand|your uncle|one good man|old guard/i, seed = null } = {}){
  await p.evaluate(()=>localStorage.clear());
  await p.reload({ waitUntil:"load" });
  await p.waitForTimeout(900);
  await click(p, /found a house/);
  await p.waitForTimeout(300);
  if(seed){
    const typed = await p.evaluate(sd => {
      const el = [...document.querySelectorAll("input")].find(x => /seed/i.test(x.getAttribute("aria-label")||""));
      if(!el) return false;
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      set.call(el, sd);
      el.dispatchEvent(new Event("input", { bubbles:true }));
      return true;
    }, seed);
    if(!typed) throw new Error("found({seed}) — no seed field on the founding screen");
    await p.waitForTimeout(200);
  }
  await click(p, scenario);
  await p.waitForTimeout(200);
  await click(p, /take the keys/);
  await p.waitForTimeout(1200);
  await clearAll(p);
}

/* ---- PREFIX, NOT THE WHOLE LABEL ----
   This matched /^end week$/ — anchored at BOTH ends — until v3.99.0 gave the button the week's
   close and it began reading "End week · 2 unanswered". The button did not move and did not
   break; the matcher simply stopped finding it, endWeek() returned false, and every check that
   advances a week through the screen quietly played a shorter game. `reach` was the one that
   noticed, and only because its house came out different: the arena lost three actions and the
   villa gained six, which reads exactly like a game fault and was a matcher.
   The same lesson the scene's doors taught in v3.92.0: a control's FIRST WORDS are stable and
   everything after them is the build's business. */
export async function endWeek(p){
  await tab(p, "ludus");
  await p.waitForTimeout(140);
  const went = await click(p, /^end week/i);
  if(!went) return false;
  await p.waitForTimeout(720);
  return true;
}

/* reach into the game itself — only present in the --test build */
export const inside = (p, fn, arg) => p.evaluate(fn, arg);
export const hasHandle = p => p.evaluate(()=>!!window.__LVDVS);

/* ---- HOW MANY HOUSES A FIGURE ACTUALLY NEEDS ----
   Twenty-seven probes in this directory take a house count as their first argument and not one of
   them knows what it should be. Every figure this project has published was read off a number
   somebody chose by feel — 12, 24, 30, 72 — and the one time that was checked, #171 found 72 was a
   third of what the question needed and a figure had already shipped off it. #136 has fired five
   times; this is the arithmetic that would have caught all five before the writing-up.

   Given the PAIRED per-house differences between an arm and its control, it returns:
     mean   the figure being claimed
     sd     how much a single house varies around it — the thing that decides everything
     se     sd/sqrt(n), the error on the figure at the sample it was read off
     t      mean/se. Below 2 the figure is not separated from nothing.
     need   4*sd^2/mean^2 — the houses at which a difference THIS SIZE would clear two standard
            errors. If `need` is larger than `n`, the figure is not yet a figure.
     mde    2*sd/sqrt(n) — the SMALLEST difference the sample you ran could have seen. This is the
            more useful of the two when auditing a figure somebody already published, because the
            observed difference cannot be used to justify the sample that produced it: a small run
            only reports the differences that happened to come out large, so anything at or below
            the mde is noise and anything above it is inflated. Quote the mde, not the estimate.
     up/dn/p  the sign test, which assumes nothing about the shape of the distribution. Lives are
            censored at the run length and fame has a long tail, so the t is the optimistic reading
            and the sign test is the one to believe.
   The normal approximation with a continuity correction is used for p; at the sample sizes worth
   quoting it agrees with the exact binomial to the third decimal, and below those sizes nothing
   should be quoted anyway. */
export function needN(diffs){
  const d = (diffs||[]).filter(x=>typeof x === "number" && isFinite(x));
  const n = d.length;
  if(n < 2) return { n, mean:null, sd:null, se:null, t:null, need:null, up:0, dn:0, p:null };
  const mean = d.reduce((a,b)=>a+b,0)/n;
  const sd = Math.sqrt(d.reduce((a,b)=>a+(b-mean)*(b-mean),0)/(n-1));
  const se = sd/Math.sqrt(n);
  const up = d.filter(x=>x>0).length, dn = d.filter(x=>x<0).length, m = up+dn;
  const z = m ? (Math.abs(up - m/2) - 0.5)/Math.sqrt(m/4) : 0;
  const erf = x => { const t = 1/(1+0.3275911*Math.abs(x));
    const y = 1 - (((((1.061405429*t - 1.453152027)*t) + 1.421413741)*t - 0.284496736)*t + 0.254829592)*t*Math.exp(-x*x);
    return x >= 0 ? y : -y; };
  return { n, mean, sd, se, t: se ? mean/se : null, mde: 2*se,
    need: mean ? Math.ceil(4*sd*sd/(mean*mean)) : Infinity,
    up, dn, p: m ? +(1 - erf(z/Math.SQRT2)).toFixed(4) : null };
}
/* one line a probe can print instead of quoting a number it cannot support */
export const sayNeed = (label, r) => `${String(label).padEnd(16)} `
  + (r.mean == null ? "too few to say"
    : `${r.mean >= 0 ? "+" : ""}${r.mean.toFixed(1).padStart(8)}  sd ${r.sd.toFixed(1).padStart(7)}`
      + `  se ${r.se.toFixed(1).padStart(6)}  t ${r.t.toFixed(2).padStart(5)}`
      + `  ${r.up}u/${r.dn}d p=${r.p == null ? "  —  " : r.p.toFixed(3)}`
      + `  needs ${r.need === Infinity ? "∞" : r.need} of ${r.n}`
      + `  · ${r.n} could only see ${r.mde.toFixed(1)}`
      + (r.need > r.n ? "   ← NOT YET A FIGURE" : ""));

export const pct = (a,b) => b ? +(a/b*100).toFixed(1) : 0;
export const ok   = (cond, msg) => ({ pass:!!cond, msg });
