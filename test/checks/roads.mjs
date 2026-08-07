/* The coast could not be driven headless. setOut and comeHome were functions of
   the save at module scope — exactly what the file's first rule demands — but
   neither was on the handle, and the actions check's name-list did not miss
   them. The cost was paid in full during the v2.46 audit: two entire 12-house
   campaign batches accepted a town's invitation, had no way home, spent three
   hundred weeks stranded, and reported half the game dark — freedman, primus,
   kin, court, saga, the market — three confident wrong findings before the
   instrument was caught.

   This check drives the round trip the audit could not: out, arrive, fight the
   town's card, wear out the welcome, and come home. It also holds the residency
   costs from v2.46.0 — a fresh visitor's card against a stale resident's. */

import { hasHandle } from "../harness.mjs";

export const name = "roads";
export const describe = "a tour can be driven headless — out, around the bay, and home";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Rd","clean","ROADS1",null);
    d.gold = 9000; d.fame = 300;
    const week = () => { d.pendingEvent = null; A.endWeek(d); };

    /* out — and the gate refuses a second departure mid-road */
    const outOk = A.setOut(d, "pompeii");
    const outTwice = A.setOut(d, "neapolis");
    week();
    const arrived = d.city === "pompeii" && !d.travel;
    const clocked = A.stayWeeks(d) >= 0 && d.flags.cityArrived != null;

    /* the town's card exists and is the town's */
    A.makeCityGames(d);
    const card = (d.games && d.games.offers) || [];
    const cardOk = card.length >= 2 && card.every(o=>o.city === "pompeii");

    /* a fresh visitor against a stale resident: same state, only the stay moved */
    const draw = () => { A.makeCityGames(d); return ((d.games&&d.games.offers)||[]).map(o=>o.purse||0); };
    const med = a => { const s = a.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)] || 0; };
    const freshP = [], staleP = [];
    d.flags.cityArrived = d.week;          for(let i=0;i<30;i++) freshP.push(...draw());
    d.flags.cityArrived = d.week - 16;     for(let i=0;i<30;i++) staleP.push(...draw());
    const welFresh = (d.flags.cityArrived = d.week, A.welcomeOf(d));
    const welStale = (d.flags.cityArrived = d.week - 16, A.welcomeOf(d));
    d.flags.cityArrived = d.week;

    /* home — and the stay clock is wiped */
    const homeOk = A.comeHome(d);
    week();
    const home = d.city == null && !d.travel;
    const wiped = d.flags.cityArrived == null && A.stayWeeks(d) === 0;

    return { outOk, outTwice, arrived, clocked, cardOk, cardN: card.length,
      freshMed: med(freshP), staleMed: med(staleP),
      welFresh: +welFresh.toFixed(2), welStale: +welStale.toFixed(2),
      homeOk, home, wiped };
  });

  const lines = [], fails = [];
  lines.push(`out ${out.outOk ? "went" : "REFUSED"} · arrived ${out.arrived} · ${out.cardN} offers on the town's card`);
  lines.push(`a fresh visitor's median purse ${out.freshMed}d (welcome ${out.welFresh}) · sixteen weeks resident ${out.staleMed}d (welcome ${out.welStale})`);
  lines.push(`home ${out.home}, the stay clock ${out.wiped ? "wiped" : "STILL RUNNING"}`);

  if(!out.outOk) fails.push("setOut refused a plain departure");
  if(out.outTwice) fails.push("a house already on the road was allowed to set out again");
  if(!out.arrived) fails.push("one week out of Capua did not arrive at Pompeii");
  if(!out.clocked) fails.push("arrival did not start the stay clock");
  if(!out.cardOk) fails.push("the town's card was missing or not the town's");
  if(!(out.welStale < out.welFresh)) fails.push("sixteen weeks of residence left the welcome as warm as a first morning");
  if(!(out.staleMed < out.freshMed * 0.85))
    fails.push(`a stale resident's median purse is ${out.staleMed}d against a fresh visitor's ${out.freshMed}d — residence is supposed to cost`);
  if(!out.homeOk || !out.home) fails.push("comeHome did not bring the house home");
  if(!out.wiped) fails.push("coming home did not wipe the stay clock");

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
