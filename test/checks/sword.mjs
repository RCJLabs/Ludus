/* THE NUMBER HE ASKED FOR — #190

   `freedom` is *"To hold the rudis before he is thirty."* His ask, verbatim: *"catches you crossing
   the yard and asks for a number. Not a speech and not a promise — a number. How many more."* The
   game holds that number — `RUDIS_WINS - g.wins` — and until v3.122.0 answered it on no screen at
   all. `SECT.wants` printed his line and a state; the agenda row fires only once he is ALREADY
   eligible; the `rudis` feat's `near` line counts men who have earned it, not men approaching it.

   Measured over 12 houses x 420 weeks on two seeds, the reference player freeing every eligible man:

     50 and 53 men carried it · 1,440 and 1,194 active man-weeks · MET 1 and 1
     of those man-weeks, 74.6% and 66.2% were TEN OR MORE wins short
     and 644 (44.7%) and 221 (18.5%), across 15 and 12 men, were spent by a man ALREADY PAST THIRTY

   That last row is the one with teeth. A man over thirty is carrying an ambition whose own written
   line names a door that has shut, and neither he nor the player was told — and it is not theory:
   across the two seeds three men who wanted it were freed and ONE of them got nothing, because
   `grantRudis` meets it on `age < RUDIS_AGE` and he was thirty.

   WHAT THIS CHECK HOLDS is the screen, driven, not the helper: a man carrying `freedom` is shown
   what stands between him and it, in his own units; a man past thirty is told the clause has run
   out; a man who is clear is told the price; and a man carrying any OTHER ambition is shown none of
   it, because a panel that answers a question nobody asked is its own fault. The three terms are
   read off the handle rather than typed here, so a change to any of them moves the check with the
   game instead of leaving it asserting last year's arithmetic.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, found, clearAll, forge, tab, settle, hasHandle } from "../harness.mjs";

export const name = "sword";
export const describe = "a man who asks how many more is told, and one past thirty is told the clause has run out";
export const slow = true;   /* drives the real card in a real browser */

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
  return out.join("\n");
}

export async function run({ p, errors }){
  const lines = [], bad = [];

  /* ---- STATIC: the terms are named once and read everywhere ---- */
  const src = strip(fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8"));
  const el = (src.match(/const rudisEligible = ([^;]*);/) || ["",""])[1];
  lines.push(`rudisEligible = ${el.trim()}`);
  if(!el) bad.push("could not read rudisEligible — this check is reading a shape that has moved");
  else if(/\d/.test(el.replace(/RUDIS_\w+/g, "")))
    bad.push(`rudisEligible still carries a numeric literal — the gate and the screen that counts it must read one constant, not two copies: ${el.trim()}`);
  for(const k of ["RUDIS_WINS","RUDIS_FAME","RUDIS_AGE"]){
    const n = (src.match(new RegExp("\\b"+k+"\\b","g")) || []).length;
    lines.push(`   ${k} appears ${n} times`);
    if(n < 2) bad.push(`${k} is declared and never read — a named constant nobody uses is two copies waiting to happen`);
  }

  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines };

  /* ---- DRIVEN: four men, four states, read off the real panel ---- */
  const K = await p.evaluate(()=>{
    const A = window.__LVDVS;
    if(typeof A.rudisStanding !== "function") return null;
    return { wins:A.RUDIS_WINS, fame:A.RUDIS_FAME, age:A.RUDIS_AGE };
  });
  if(!K) return { pass:false, why:"RUDIS_WINS / rudisStanding are not on the handle", lines };
  lines.push(`the handle's own terms: ${K.wins} wins · ${K.fame} renown · under ${K.age}`);

  /* the arithmetic first, so a screen fault and a helper fault are separable */
  const arith = await p.evaluate(K=>{
    const A = window.__LVDVS, out = [];
    const mk = (wins, pfame, age) => ({ id:1, status:"active", wins, pfame, age, auctor:null });
    const s1 = A.rudisStanding(mk(K.wins-3, K.fame-40, 24));
    const s2 = A.rudisStanding(mk(K.wins, K.fame, 24));
    const s3 = A.rudisStanding(mk(K.wins-3, K.fame-40, K.age+1));
    if(s1.wins !== 3) out.push(`three short reads ${s1.wins}`);
    if(s1.fame !== 40) out.push(`forty renown short reads ${s1.fame}`);
    if(s1.late) out.push("a man of 24 reads as past the clause");
    if(!s2.clear) out.push("a man on the terms exactly does not read as clear");
    if(!s3.late) out.push(`a man of ${K.age+1} does not read as past the clause`);
    return out;
  }, K);
  if(arith.length) bad.push(...arith.map(x=>`rudisStanding: ${x}`));
  else lines.push("rudisStanding counts the three terms off the handle's own constants");

  await found(p);
  await clearAll(p, 10);

  const CASES = [
    { key:"short",  amb:"freedom", wins:K.wins-3, pfame:K.fame-40, age:24,
      want:[/3 more wins/i, /40 more renown/i], not:[/not coming back/i] },
    { key:"clear",  amb:"freedom", wins:K.wins,   pfame:K.fame,    age:24,
      want:[/he has earned it/i, /\d+d to write/i], not:[/more wins/i, /not coming back/i] },
    { key:"late",   amb:"freedom", wins:K.wins-3, pfame:K.fame-40, age:K.age+1,
      want:[/3 more wins/i, /not coming back/i, new RegExp(`he is ${K.age+1}`, "i")], not:[] },
    /* and the control: a panel that answers a question nobody asked is its own fault */
    { key:"other",  amb:"beside",  wins:K.wins-3, pfame:K.fame-40, age:24,
      want:[], not:[/what stands between him and it/i, /more wins/i] },
  ];

  for(const c of CASES){
    const planted = await forge(p, (A, R, c) => {
      let key = null, s = null;
      for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
        try { const x = JSON.parse(localStorage.getItem(k)); if(x && x.gladiators && x.gladiators.length){ key = k; s = x; } } catch(e){} }
      if(!s) return { why:"no save to plant into" };
      const g = s.gladiators.find(x=>x.status === "active") || s.gladiators[0];
      g.wins = c.wins; g.pfame = c.pfame; g.age = c.age; g.auctor = null;
      g.ambition = { kind:c.amb, met:false, broken:false, voiced:0, since:0, promised:false, despair:false };
      s.gold = 99999;                     /* the price is shown, so it must be payable */
      return { plant:s, name:g.name, amb:c.amb };
    }, c);
    if(!planted || !planted.name){ bad.push(`${c.key}: could not plant the fixture`); continue; }
    await clearAll(p, 12);
    await tab(p, "familia");
    await p.waitForTimeout(300);
    await settle(p);
    const opened = await p.evaluate(()=>{ const b=[...document.querySelectorAll("button.panel")][0];
      if(b){ b.click(); return true; } return false; });
    if(!opened){ bad.push(`${c.key}: the roster showed no man to open`); continue; }
    await p.waitForTimeout(420);
    const txt = await p.evaluate(()=>{
      const s = [...document.querySelectorAll("details.sect, .sect, section, div")]
        .filter(x=>/what he wants/i.test((x.innerText||"").slice(0,400)))
        .sort((a,b)=>(a.innerText||"").length - (b.innerText||"").length)[0];
      return s ? (s.innerText||"").trim() : "";
    });
    if(!txt){ bad.push(`${c.key}: the "What he wants" panel did not render at all`); await clearAll(p, 8); continue; }
    const one = txt.replace(/\s+/g, " ").slice(0, 200);
    lines.push(`${c.key.padEnd(6)} ${planted.name} (${c.amb}, ${c.wins}w ${c.pfame}f age ${c.age}) → ${one}`);
    for(const re of c.want) if(!re.test(txt))
      bad.push(`${c.key}: the panel never says ${re} — the man asked for a number and the screen does not give him one`);
    for(const re of c.not) if(re.test(txt))
      bad.push(`${c.key}: the panel says ${re} and should not`);
    await clearAll(p, 8);
  }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push("the card answers the number, names the price, and says when the clause has run out");
  return { pass: bad.length === 0, why: bad.slice(0,4).join("; ") || null, lines };
}
