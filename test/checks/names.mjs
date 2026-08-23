/* FOURTEEN NAMES, AND NOBODY MAY WEAR ONE TWICE IN THE SAME YARD — #195

   `pick(NICKS)` was written at FOURTEEN sites and not one of them asked who was already wearing the
   name. Measured over 120 houses before the fix: 567 of your men were named by the crowd, 89 took a
   name the house had used before and 8 took one a man STILL ON THE BOOKS was wearing — about one
   house in fifteen ended up with two living men called the Serpent.

   THE SCOPE IS DELIBERATE AND THIS CHECK HOLDS THE SCOPE, NOT A WISH. Fourteen names cannot cover
   the world: counted week by week, 10 to 12 of them are worn at any moment across your yard, the
   three rival rosters, the circuit, the block and the pit, so 99.8% of weeks carry a duplicate
   SOMEWHERE and refusing every worn name would empty the pool and start handing out repeats again
   by a longer road. `freshNick` refuses exactly what a player sees together — the men ON YOUR BOOKS
   and the men ON THIS WEEK'S CARD — which is 1 to 2 wearers a week against fourteen names.

   Two halves, and the static one is the one that will catch the next mistake:

     STATIC   the ONLY code that may name `NICKS` is the table's own line, the body of `freshNick`
              and the handle export. A fifteenth draw site added later names the table somewhere
              else and goes red here, rather than quietly reintroducing the fault at one call site.
              Comments are stripped first, the way `copies` does it — the note over `freshNick`
              quotes `pick(NICKS)` in prose, and a line-shape filter would count it. (The first cut
              of this half asserted `pick(NICKS)` appeared exactly once and read ZERO, because the
              draw inside the helper is `pick(free.length ? free : NICKS)`. An invariant has to be
              written against the code that exists.)
     DRIVEN   the gate itself, from both sides: a name a living man wears is never returned, a name
              a DEAD man wears is, the card is seen, `more` is honoured, and an exhausted pool still
              returns a name rather than nothing. Plus a played house, where no two men on the books
              may share one.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, hasHandle } from "../harness.mjs";

export const name = "names";
export const describe = "no two men in one yard wear the same nickname, and there is one draw site";

/* strip comments, keep the code — same shape as `copies`, and for the same reason: the note over
   `freshNick` contains the words `pick(NICKS)` and a line-shape filter would count it */
function strip(txt){
  const out = []; let inBlock = false;
  for(const raw of txt.split("\n")){
    let code = "";
    for(let j = 0; j < raw.length; j++){
      if(inBlock){ if(raw[j] === "*" && raw[j+1] === "/"){ inBlock = false; j++; } continue; }
      if(raw[j] === "/" && raw[j+1] === "*"){ inBlock = true; j++; continue; }
      if(raw[j] === "/" && raw[j+1] === "/") break;
      code += raw[j];
    }
    out.push(code);
  }
  return out;
}

export async function run({ p }){
  const lines = [], fails = [];

  /* ---- STATIC: one place draws from the table ---- */
  const src = strip(fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8"));
  const decl   = src.findIndex(c => /^const NICKS\s*=/.test(c.trim())) + 1;
  const fresh  = src.findIndex(c => /function freshNick\s*\(/.test(c)) + 1;
  /* the helper runs from its own line to the closing brace at column 0 */
  let end = fresh;
  for(let i = fresh; i < src.length; i++){ if(/^\}/.test(src[i])){ end = i + 1; break; } }
  const refs = [];
  src.forEach((code, i) => { if(/\bNICKS\b/.test(code)) refs.push(i + 1); });
  const allowed = n => n === decl || (n >= fresh && n <= end) || /window\.__LVDVS|ORIGINS, NICKS/.test(src[n-1]);
  const stray = refs.filter(n => !allowed(n));
  if(!decl || !fresh) fails.push(`could not find ${!decl ? "the NICKS table" : "freshNick"} in the source — this check cannot read what it guards`);
  if(stray.length)
    fails.push(`NICKS is read outside freshNick at line${stray.length===1?"":"s"} ${stray.join(", ")} — every draw `
      + `must go through freshNick(d), or #195 comes back one call site at a time`);
  if(src.some(c => c.includes("pick(NICKS)")))
    fails.push(`a bare pick(NICKS) is back in the source — that is the fourteen-site fault by name`);
  lines.push(`NICKS named at ${refs.length} places: the table (line ${decl}), freshNick (${fresh}-${end}), the handle — ${stray.length} stray`);

  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines };

  /* ---- DRIVEN: the gate, from both sides ---- */
  const out = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const bad = [], say = [];
    if(typeof A.freshNick !== "function") return { bad:["freshNick is not on the handle"], say };
    const N = A.NICKS, DRAWS = 300;
    const man = (id, nick, status) => ({ id, name:"M"+id, nick, status: status||"active" });

    /* control — an empty house draws anything in the table and nothing outside it */
    { const d = A.newGameState("Names","clean","NAMES-0",null);
      d.gladiators = []; d.games = null;
      const got = new Set();
      for(let i=0;i<DRAWS;i++){ const n = A.freshNick(d); if(!N.includes(n)) bad.push(`freshNick returned ${JSON.stringify(n)}, which is not in NICKS`); got.add(n); }
      say.push(`empty house: ${got.size} of ${N.length} names drawn in ${DRAWS} tries`);
      if(got.size < N.length - 2) bad.push(`an empty house only ever drew ${got.size} of ${N.length} names — the filter is eating names nobody wears`); }

    /* thirteen worn by living men leaves exactly one, every time */
    { const d = A.newGameState("Names","clean","NAMES-1",null);
      d.games = null;
      d.gladiators = N.slice(0, 13).map((n,i)=>man(900+i, n));
      const left = N[13];
      let wrong = 0;
      for(let i=0;i<DRAWS;i++) if(A.freshNick(d) !== left) wrong++;
      say.push(`13 names worn by living men: the 14th came back ${DRAWS-wrong} of ${DRAWS} times`);
      if(wrong) bad.push(`with 13 of 14 names worn, ${wrong} of ${DRAWS} draws returned a name already in the yard`); }

    /* a man who has gone does not hold a name */
    { const d = A.newGameState("Names","clean","NAMES-2",null);
      d.games = null;
      d.gladiators = N.slice(0, 13).map((n,i)=>man(900+i, n));
      d.gladiators[0].status = "dead";
      const freed = N[0], got = new Set();
      for(let i=0;i<DRAWS;i++) got.add(A.freshNick(d));
      say.push(`with one of the thirteen dead: ${[...got].length} names available, the dead man's ${got.has(freed)?"came back":"did NOT come back"}`);
      if(!got.has(freed)) bad.push(`a dead man is still holding ${freed} — isGone is not being read`); }

    /* the card is seen, and it is not on d.gladiators */
    { const d = A.newGameState("Names","clean","NAMES-3",null);
      d.gladiators = [];
      d.games = { festival:"x", offers:[{ opp:{ nick:N[5] } }, { opps:[{ nick:N[6] }] }] };
      let hit = 0;
      for(let i=0;i<DRAWS;i++){ const n = A.freshNick(d); if(n === N[5] || n === N[6]) hit++; }
      say.push(`two names on the card: drawn ${hit} of ${DRAWS} times`);
      if(hit) bad.push(`a name on this week's card came back ${hit} of ${DRAWS} times — the card is not being read`); }

    /* `more` — the card being BUILT, which the state cannot see yet */
    { const d = A.newGameState("Names","clean","NAMES-4",null);
      d.gladiators = []; d.games = null;
      let hit = 0;
      for(let i=0;i<DRAWS;i++) if(A.freshNick(d, [N[2], N[3]]) === N[2]) hit++;
      say.push(`a name passed in \`more\`: drawn ${hit} of ${DRAWS} times`);
      if(hit) bad.push(`a name handed to freshNick in \`more\` came back ${hit} of ${DRAWS} times`); }

    /* an exhausted pool still answers — a repeat beats no name */
    { const d = A.newGameState("Names","clean","NAMES-5",null);
      d.games = null;
      d.gladiators = N.map((n,i)=>man(900+i, n));
      let badDraw = 0;
      for(let i=0;i<DRAWS;i++){ const n = A.freshNick(d); if(!n || !N.includes(n)) badDraw++; }
      say.push(`all 14 worn: ${DRAWS-badDraw} of ${DRAWS} draws still returned a name from the table`);
      if(badDraw) bad.push(`with every name worn, ${badDraw} of ${DRAWS} draws returned nothing usable`); }

    /* ---- AND A PLAYED HOUSE, because a gate that passes in a fixture and fails in play is the
       fault this suite exists for. Six houses to 200 weeks names about a dozen men. ---- */
    { let named = 0, clashWeeks = 0, houses = 0, weeks = 0, worstPool = 0;
      for(let h=0; h<6; h++){
        const d = A.newGameState("Names","clean","NAMESPLAY-"+h, null); houses++;
        for(let w=0; w<200 && !d.over; w++){
          R.lanista(d); weeks++;
          const live = (d.gladiators||[]).filter(g=>!A.isGone(g) && g.nick).map(g=>g.nick);
          if(new Set(live).size < live.length) clashWeeks++;
          const inPlay = A.nicksInPlay(d).size;
          if(inPlay > worstPool) worstPool = inPlay;
        }
        named += (d.gladiators||[]).filter(g=>g.nick).length;
      }
      say.push(`${houses} played houses, ${weeks} weeks, ${named} men carrying a name: `
        + `${clashWeeks} week${clashWeeks===1?"":"s"} with two of them alike · the fix's own pool `
        + `peaked at ${worstPool} of ${A.NICKS.length} names refused`);
      if(clashWeeks) bad.push(`${clashWeeks} house-weeks had two living men in the same yard wearing one name`);
      if(named < 4) bad.push(`only ${named} men were named in ${weeks} weeks — the driven half proved nothing`);
      if(worstPool >= A.NICKS.length) bad.push(`the fix's own pool reached ${worstPool} of ${A.NICKS.length} in play — the scope is too wide and it will start repeating`); }

    return { bad, say };
  });

  lines.push(...out.say);
  fails.push(...out.bad);
  if(!fails.length) lines.push("every draw goes through freshNick, and no yard holds one name twice");
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
