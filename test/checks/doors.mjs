/* THE OFFER HAS TO ARRIVE — #246 phase 4.

   (`doors` was free in both directories; checked before writing.)

   The item's last phase asks for an answer set: *"`poached`'s three doors, `answerNem`-shaped
   calling out, and the `ear`/`WHISPERS` telling you first."* All three were already written. The
   doors do real work, `answerNem` is a paid cooldown-gated strike, and `WHISPERS` carries a `deep`
   line for `d.poach`. What `probes/doors.mjs` found is that the first of them almost never reached
   the player, and the shape of that is the whole item:

     Over 24 x 420 on two seeds, with the beat not planted: **32 poaches began, 4 were shown, 18
     took a man — and all 18 of those were men the player was never offered a card for.** Every
     poach that WAS shown, the player answered and kept the man. The three doors were never a dead
     branch; phase 1 already refuted that. They were a lottery ticket: `d.poach.weeks` is 3, and in
     those three weeks the card has to win a 45%-a-week draw against thirty-six others.

     `startPoach` plants the beat now and `fireArc` raises it ahead of the week's random event,
     which is what that machinery is for. Same two seeds: **41 begun, 35 shown (85.4%), 11 lost** —
     and 5 of those 11 are men the player was offered and lost anyway, because the coin was not
     there when the week came. A loss with a door in front of it is a different thing from a man
     walking out of a house that was never told.

   FOUR ARMS. One played run, three read directly off the state.

   1 · THE OFFER ARRIVES. A poach that begins is put in front of the player.
   2 · AND THE LOSSES ARE DECISIONS. Not a bar on how many men go — the honest outcome of being
       offered a door you cannot pay for is still losing him — but on whether they ALL go silently,
       which is the state before this release and the one thing about it that cannot recur quietly.
   3 · AND A PLANTED BEAT IS THE SAME OFFER AS A DRAWN ONE. `poached` carries `make` and `build`
       both; if they ever drift, half the poaches in the game show a different card from the other
       half and nothing else in the suite would see it.
   4 · AND AN EAR THAT IS GONE IS GONE. `earOn` checked the informer was an active man and
       `earInside` did not, while `yardWeek` asked neither — it read `d.ear` straight and paid a
       dead man the inside rate of 0.85 against a gate's 0.55. A man who had died, been freed or
       been sold went on hearing everything in the yard while `listenWeek`, correctly guarded,
       reported that nobody was listening. Two readers of one piece of state, disagreeing. */
import { found, clearAll, installRope } from "../harness.mjs";

/* ---- WHAT IS ASSERTED, AND WHAT IS ONLY REPORTED ----
   A poach is rare — about 1.4 a house over 420 weeks — so every rate here has a small n behind it
   and the bar has to be chosen for that. The LOSS RATE is reported and not asserted: it reads 27.3%
   and 25.0% now against 65.0% and 41.7% before, and those straddle, so no ceiling drawn through
   them separates a broken build from a quiet seed. `houses` cost this release a gate on exactly
   that mistake one release ago. The two that DO separate them are the share shown (84.8 / 87.5
   against 10.0 / 16.7) and the shape of the losses (5 of 11 offered, against 18 of 18 unoffered). */
const HOUSES = 24, WEEKS = 380;
const SHOWN_FLOOR = 0.55;   /* measured 84.8% and 87.5%; 10.0% and 16.7% before the beat was planted */

export const name = "doors";
export const describe = "a man is not taken out of your house without the offer ever reaching you";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"DOORS-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","EVENTS","activeG","setEarTo","earOn","earInside","poachedMan"]
      .filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function") return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };
    const P = A.EVENTS.poached;
    if(!P) return { why:"`EVENTS.poached` is gone — the answer set has no card" };

    /* 1 & 2 · the played run */
    const t = { weeks:0, started:0, shown:0, lost:0, neverOffered:0, offeredAndLost:0, kept:0 };
    for(let hh=0; hh<H; hh++){
      const d = A.newGameState("Dr"+hh, "clean", `DOORSCHK-${hh}`);
      let live = null;
      for(let w=0; w<W; w++){
        if(d.over) break;
        t.weeks++;
        const before = (d.defected||[]).length;
        try { R.lanista(d); } catch(e){ break; }
        if(d.poach && !live){ t.started++; live = { shown:false }; }
        const ev = d.pendingEvent;
        if(ev && ev.id === "poached" && live){ live.shown = true; t.shown++; }
        if(!d.poach && live){
          if((d.defected||[]).length > before){ t.lost++;
            if(live.shown) t.offeredAndLost++; else t.neverOffered++; }
          else if(live.shown) t.kept++;
          live = null;
        }
      }
    }

    /* 3 · the planted beat and the drawn one are one card */
    const shapes = (()=>{
      const d = A.newGameState("Card", "clean", "DOORSCHK-CARD");
      const g = A.activeG(d)[0];
      if(!g) return { why:"a founding house has nobody to poach" };
      d.poach = { house:(d.rivals[0]||{}).name || "Vettius", gid:g.id, weeks:3 };
      let made = null, built = null;
      try { made  = P.make(d); }  catch(e){ made  = { err:String(e.message) }; }
      try { built = P.build(d, {}); } catch(e){ built = { err:String(e.message) }; }
      const key = c => c && !c.err ? `${c.id}|${c.title}|${(c.choices||[]).length}|${c.text}` : `ERR ${c && c.err}`;
      return { hasBuild: typeof P.build === "function", same: key(made) === key(built),
        madeKey: key(made).slice(0, 60), doors: (made && made.choices || []).length };
    })();

    /* 4 · the ear that is no longer there */
    const ear = (()=>{
      const d = A.newGameState("Ear", "clean", "DOORSCHK-EAR");
      const g = A.activeG(d)[0];
      if(!g) return { why:"a founding house has nobody to listen with" };
      A.setEarTo(d, "man", g.id);
      const live = { on:A.earOn(d), inside:A.earInside(d) };
      g.status = "dead";                       /* he is carried out; d.ear still points at him */
      const dead = { on:A.earOn(d), inside:A.earInside(d) };
      return { live, dead };
    })();
    return { t, shapes, ear };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };
  const { t, shapes, ear } = r;
  const pc = (v, n) => n ? `${(100*v/n).toFixed(1)}%` : "—";

  lines.push(`${t.weeks} weeks · ${t.started} poaches began · ${t.shown} were put in front of the player `
    + `(${pc(t.shown, t.started)}) · ${t.lost} took a man (${pc(t.lost, t.started)})`);
  lines.push(`  of the losses: ${t.neverOffered} with no card ever offered, ${t.offeredAndLost} offered and lost anyway `
    + `· ${t.kept} offered and the man stayed [before the beat was planted: 4 of 32 shown, and all 18 losses unoffered]`);
  lines.push(`  the card: build ${shapes.hasBuild ? "present" : "MISSING"}, ${shapes.doors} doors, `
    + `planted and drawn ${shapes.same ? "identical" : "DIFFERENT"}`);
  lines.push(`  the ear, with its man alive: on ${ear.live && ear.live.on} inside ${ear.live && ear.live.inside} · `
    + `and with him carried out: on ${ear.dead && ear.dead.on} inside ${ear.dead && ear.dead.inside}`);

  /* 1 */
  if(!t.started)
    bad.push(`no poach began in ${HOUSES} runs of ${WEEKS} weeks, so nothing below was tested — this arm needs a `
      + `rival angry enough to reach for a man, and if that has stopped happening it is #246 phase 2 that broke`);
  else if(t.shown / t.started < SHOWN_FLOOR)
    bad.push(`only ${pc(t.shown, t.started)} of poaches were ever put in front of the player [floor `
      + `${Math.round(SHOWN_FLOOR*100)}%, measured 84.8 and 87.5] — \`startPoach\` plants the beat and \`fireArc\` `
      + `raises it ahead of the week's draw; if that has come apart the card is back to winning a 45%-a-week `
      + `lottery inside a three-week window, which is how 18 men in 18 left a house that was never told`);
  /* 2 */
  if(t.lost >= 3 && t.neverOffered === t.lost)
    bad.push(`every one of the ${t.lost} men lost went without a card being offered — that is the exact state `
      + `this release measured and closed, and it has come back`);
  /* 3 */
  if(shapes.why) bad.push(shapes.why);
  else {
    if(!shapes.hasBuild)
      bad.push(`\`EVENTS.poached\` has no \`build\` — \`scheduleArc\` names an entry with one, so without it the `
        + `planted beat lapses silently and every poach is back to the draw`);
    if(!shapes.same)
      bad.push(`the planted card and the drawn card are not the same offer (${shapes.madeKey}...) — half the `
        + `poaches in a run come through each path and nothing else in this suite compares them`);
    if(shapes.doors !== 3)
      bad.push(`the poach card offers ${shapes.doors} doors, not the three #246 is about`);
  }
  /* 4 */
  if(ear.why) bad.push(ear.why);
  else {
    if(!(ear.live.on && ear.live.inside))
      bad.push(`a man just put inside the cells does not read as an ear (on ${ear.live.on}, inside ${ear.live.inside}) — `
        + `everything below this is untested if the ear cannot be switched on`);
    if(ear.dead.on || ear.dead.inside)
      bad.push(`the informer is dead and the house still thinks somebody is listening (on ${ear.dead.on}, `
        + `inside ${ear.dead.inside}) — \`yardWeek\` pays whoever \`earInside\` says is in the cells at 0.85 against `
        + `a gate's 0.55, so a corpse goes on hearing everything while \`listenWeek\` reports silence`);
  }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the offer arrives, the doors are the same offer either way, and the dead stop listening`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
