/* THE WEEK'S ORDERS ARE PUT DOWN WHERE THEY ARE SPENT — #194

   Five functions send a man out — `fightOffer`, `fightPit`, `meleeGo`, `huntOffer`, `fightPair` —
   and every one of them ends TWICE: once where the bout runs to a verdict, and once where it stops
   at the balance and is held for a word from the box. The two exits cleared different things.
   `fightOffer`'s verdict exit put down the pit opponent, the plan and the entrance; its crux exit
   put down none of the three and returned early, `speak` cleared nothing on the way back, and
   `goPick` cleared the plan and the melee plan but not the entrance. So the entrance had exactly
   ONE path that ever put it down, and 55-61% of bouts take the other one.

   Driven on the real screen before the fix (`sticky.mjs`, two seeds): **the chip was still lit on
   8 of 8 bouts that stopped at the balance and cleared on 6 of 6 that ended outright.**

   This is a STATIC check and that is the point. The fault was not one wrong value, it was five
   functions each deciding for themselves what a finished bout puts down — so the guard is the
   shape, not the symptom:

     ONE PLACE     `spendOrders` is the only thing that may put an order down, apart from the chip
                   the player presses and the two handlers that mean "I have changed my mind about
                   this bout" (`goPick`, and closing the arena wizard).
     BEFORE THE    every one of the five entry points calls it BEFORE branching on `res.crux`, so
     BRANCH        the two exits cannot disagree. `speak` is exempt and named: it resumes a bout
                   whose orders were spent when it began.
     AND ALL SIX   `spendOrders` clears all six order fields. A future edit that quietly drops
                   `setEntrance` out of it puts #194 back with no other symptom.

   `tactic` is deliberately not an order — it reads as a standing preference and no exit has ever
   cleared it. `fGid` and `pairSel` are who is going out, not what he was told, and every exit
   already puts them down.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../harness.mjs";

export const name = "orders";
export const describe = "one place puts the week's orders down, and it runs before the bout can be held";

/* comments stripped the way `copies` and `names` do it — this file's own prose names every
   setter it is about, and a line-shape filter would count the note as a call site */
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

/* the six things a bout is told, and the only places each may be put down */
const ORDERS = ["setPitPick", "setPlan", "setMplan", "setEntrance", "setStake", "setAgainst"];
/* a chip's own onClick sets one; `goPick` and the wizard-close mean "different bout, forget it" */
const ALLOWED = [/onClick=/, /const goPick = /, /setArenaWiz\(false\)/];
/* the five that send a man out, and the one that brings him back */
const SENDERS = ["fightOffer", "fightPit", "meleeGo", "huntOffer", "fightPair"];
const RESUMER = "speak";

export async function run(){
  const lines = [], fails = [];
  const src = strip(fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8"));
  const at = re => { const i = src.findIndex(c => re.test(c)); return i < 0 ? null : i; };

  /* ---- 1. spendOrders exists and clears all six ---- */
  const sp = at(/const spendOrders\s*=/);
  if(sp == null) fails.push("`spendOrders` is gone — there is no single place that puts the week's orders down (#194)");
  else {
    const body = src.slice(sp, sp + 6).join(" ");
    const missing = ORDERS.filter(o => !body.includes(o + "("));
    lines.push(`spendOrders at line ${sp+1} clears ${ORDERS.length - missing.length} of ${ORDERS.length}`);
    if(missing.length) fails.push(`spendOrders no longer clears ${missing.join(", ")} — that is #194 back with no other symptom`);
  }

  /* ---- 2. every function that branches on res.crux is one we have classified ---- */
  const fnOf = i => { for(let j = i; j >= 0; j--){ const m = src[j].match(/^  const (\w+)\s*=/); if(m) return m[1]; } return "(top level)"; };
  const cruxAt = [];
  src.forEach((c, i) => { if(/if\(res\.crux\)/.test(c)) cruxAt.push({ i, fn: fnOf(i) }); });
  const fns = [...new Set(cruxAt.map(x => x.fn))].sort();
  const known = [...SENDERS, RESUMER].sort();
  lines.push(`${cruxAt.length} crux branches across ${fns.length} functions: ${fns.join(", ")}`);
  const strangers = fns.filter(f => !known.includes(f));
  if(strangers.length)
    fails.push(`${strangers.join(", ")} branch${strangers.length===1?"es":""} on res.crux and ${strangers.length===1?"is":"are"} not classified — `
      + `it either sends a man out (and must call spendOrders first) or resumes one (and must not)`);
  const absent = SENDERS.filter(f => !fns.includes(f));
  if(absent.length) fails.push(`${absent.join(", ")} no longer branch on res.crux — this check is reading a shape that has moved`);

  /* ---- 3. and each sender calls spendOrders BEFORE its first crux branch ---- */
  for(const fn of SENDERS){
    const head = at(new RegExp(`^  const ${fn}\\s*=`));
    if(head == null){ fails.push(`\`${fn}\` is gone`); continue; }
    const first = cruxAt.find(x => x.fn === fn);
    if(!first) continue;
    const before = src.slice(head, first.i);
    const ok = before.some(c => c.includes("spendOrders()"));
    lines.push(`  ${fn.padEnd(11)} head ${head+1} · crux ${first.i+1} · spendOrders before it: ${ok}`);
    if(!ok) fails.push(`\`${fn}\` branches on res.crux at line ${first.i+1} without putting the orders down first — `
      + `its two exits will disagree, which IS #194`);
  }
  /* the resumer must NOT — the orders were spent when the bout began */
  { const head = at(new RegExp(`^  const ${RESUMER}\\s*=`));
    const first = cruxAt.find(x => x.fn === RESUMER);
    if(head != null && first){
      const spends = src.slice(head, first.i).some(c => c.includes("spendOrders()"));
      lines.push(`  ${RESUMER.padEnd(11)} head ${head+1} · crux ${first.i+1} · spendOrders before it: ${spends} (must be false)`);
      if(spends) fails.push("`speak` puts the orders down — it resumes a bout that already spent them, so this clears the NEXT bout's chips a word early");
    } }

  /* ---- 4. nothing else puts an order down ---- */
  const stray = [];
  src.forEach((c, i) => {
    if(i === sp || (sp != null && i > sp && i < sp + 3)) return;      /* the helper itself */
    for(const o of ORDERS) if(c.includes(o + "(")){
      if(ALLOWED.some(re => re.test(c))) return;
      stray.push(`${o} at line ${i+1}`);
      return;
    }
  });
  lines.push(`order setters outside spendOrders, the chips and the two change-your-mind handlers: ${stray.length}`);
  if(stray.length) fails.push(`an order is put down away from spendOrders — ${stray.slice(0,3).join("; ")} — that is a sixth place deciding when a bout is finished`);

  if(!fails.length) lines.push("one place puts them down, all five senders call it before the branch, and speak does not");
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
