/* THE DRAWN MAN HAS TO SAY WHICH MAN HE IS

   The game is a shadow play. A silhouette has no colour, no texture and no face, so SHAPE is the
   whole of what it can say — and the six men in the yard are the drawing a player looks at every
   week of the game.

   Measured over every axis a man carries, that drawing came back at **two** distinct pictures:
   hurt, or whole. Class said nothing. Scars said nothing. Fatigue said nothing either, and it is
   how it stopped that this check exists for.

   FATIGUE USED TO WORK. `ScnMan` was handed `tone` — one of two colours, by whether he was spent —
   and drew his outline in it. v3.138.0 made every man a silhouette, so the outline became a fixed
   near-black, and all `tone` was left gating was a small arc drawn in a literal that did not
   depend on it. The prop was still passed. The value was still computed. The reading was gone, and
   nothing anywhere could tell, because no check has ever asked whether two different men are drawn
   differently.

   SO THIS ASKS EXACTLY THAT, and it does it behaviourally rather than by reading the source: a
   source check cannot catch this bug, because the source still READ `tone`. It renders real men
   into the real yard and diffs the SVG they produce.

   AND v3.144.0 ADDED THE THREE IT COULD NOT SEE AT ALL: what he has won, who knows his name, and
   who he has killed. Those did not stop working — they had never started. The band counts came off
   `test/probes/palm.mjs` rather than off taste, for the reason written over FLOOR below.

   ONE MAN PER RENDER, and that is not laziness. The first cut planted six at once and normalised
   away their slots by subtracting each man's own x from any number within 40 of it. It leaks: the
   body is a relative path, `q-9 3 -10 27`, and for the man in slot 0 the number 27 falls inside
   [14,94] and gets shifted while for every other man it does not. Six men at two fatigue values
   came back as FOUR distinct drawings. Planting one man puts every variant in the same slot, so
   there is nothing to normalise and nothing to leak.
*/
import { found, clearAll, forge, installRope, settle, tab } from "../harness.mjs";

export const name = "vocab";
export const describe = "seven things about a man are seven readings, and each one is drawn";

/* what the yard must be able to tell apart, and how many pictures each is worth at least.

   THE THREE RECORD TERMS WERE ADDED IN v3.144.0, and their step counts are not a preference:
   `test/probes/palm.mjs` walked 14,934 man-weeks of real play and the wins ladder is five bands
   because a sixth at 12+ wins — `MASTERY_GATE` — is 1.0% of them, a step nobody would ever see.
   The five values swept below are the five band floors, so this fails the moment a band stops
   drawing, and the renown and kills values are taken off the same distribution rather than made up:
   0 is the median, 40 is the p85, and 180 is the rudis gate that the shadow's scale saturates at. */
const FLOOR = { class: 6, fatigue: 2, injury: 3, scars: 2, wins: 5, renown: 3, kills: 3 };
const SWEEP = { wins:[0,1,2,4,7], renown:[0,40,180], kills:[0,1,4] };

/* ---- AND THE SAME QUESTION PUT TO THE ARENA'S OWN FIGHTER, off the same planted man ----
   v3.146.0. `test/probes/vocab.mjs` asked both figures the same six questions and the little 35px
   man in the yard knew MORE about him than the centrepiece did: 22 distinct drawings against 12,
   with fatigue, injury and his record each worth exactly ONE to the fighter. Bout state was never
   the gap — seventeen poses, live wounds, wear and aim all work — the drawing simply had no route
   to the man, because the arena is handed a snapshot built at eight sites and none of them carried
   him. Each man below is planted ONCE and read twice, so the two figures are never compared across
   two different men.

   WINS IS DELIBERATELY NOT ON THIS LIST, and its floor here is 1 rather than an oversight. What he
   was handed for winning is a palm, and a man does not carry a palm into a fight; it is a yard mark
   and the arena is not the yard. Renown and the men he has killed reach BOTH, through the same two
   functions at two sizes, which is what keeps one visual language rather than two. */
const FIG_FLOOR = { class: 6, fatigue: 2, injury: 3, scars: 2, renown: 3, kills: 3 };

/* THE FIGHTER'S SAG IS ON THE SVG'S OWN STYLE, not on any child, so a key built only from child
   attributes would report fatigue as absent while it was working — the same blindness `opacity`
   had here until v3.144.0. The root's computed transform is part of the drawing and is read. */
const FIG_READ = `(()=>{
  const svg = document.querySelector('svg[viewBox="0 0 128 146"]'); if(!svg) return null;
  const kids = [...svg.querySelectorAll("circle,path,rect,ellipse,line,polygon,polyline")].map(e=>{
    const a = n => e.getAttribute(n) || "";
    return [e.tagName, a("d"), a("points"), a("cx"), a("cy"), a("x"), a("y"),
            a("x1"), a("y1"), a("x2"), a("y2"), a("r"), a("rx"), a("ry"),
            a("width"), a("height"), a("fill"), a("stroke"), a("stroke-width"),
            a("opacity"), a("transform")].join("|");
  }).join("~");
  return getComputedStyle(svg).transform + "@@" + kids;
})()`;

const READ = `(()=>{
  const svg = document.querySelector('svg[aria-label^="The ludus"]'); if(!svg) return null;
  const man = [...svg.querySelectorAll('g[role="button"]')].find(g=>{
    const l = g.getAttribute("aria-label") || "";
    return / the /.test(l) && !/^The /.test(l); });
  if(!man) return null;
  return [...man.querySelectorAll("circle,path,rect,ellipse,line")].map(e=>{
    const a = n => e.getAttribute(n) || "";
    /* OPACITY IS IN THE KEY from v3.144.0. The men a man has killed are drawn as how dark the
       pool at his feet is and nothing else, so a key blind to opacity would have reported that
       reading as absent while it was working — the inverse of the fatigue bug this check exists
       for, and just as invisible. */
    return [e.tagName, a("d"), a("points"), a("cx"), a("cy"), a("x"), a("y"),
            a("x1"), a("y1"), a("x2"), a("y2"), a("r"), a("rx"), a("ry"),
            a("width"), a("height"), a("fill"), a("stroke"), a("stroke-width"), a("opacity")].join("|");
  }).join("~");
})()`;

export async function run({ p, errors }){
  const bad = [], lines = [];
  await found(p, { seed:"VOCAB" });
  await clearAll(p);

  const oneMan = async (axis, i) => {
    await installRope(p);
    await forge(p, (A, R, a) => {
      const d = A.newGameState("V","clean","VOCAB-"+a.axis+"-"+a.i,null);
      d.gold = 40000; d.week = 40;
      /* newGameState SEEDS A FAMILIA — plant into an empty yard or you measure its men, not yours */
      d.gladiators = [];
      const CLS = Object.keys(A.CLASSES || {});
      const g = A.genGladiator(d, 60);
      g.cls = a.axis === "class" ? CLS[a.i % CLS.length] : CLS[0];
      g.kit = A.defaultKit(g.cls);
      /* ONE AXIS AT A TIME, and `genGladiator` HANDS BACK A MAN WITH RENOWN ALREADY ON HIM —
         `pfame: rnd(clamp((quality-34)*1.15,0,108) * (0.45+R()*0.85))`. Left unzeroed, every other
         sweep here would inherit random renown, and once renown reaches the drawing that noise
         would make the class, fatigue, injury and scar floors pass on renown's back rather than
         on their own. The record is flattened first and then exactly one term is put back. */
      g.status = "active"; g.fatigue = 0; g.injury = null; g.scars = []; g.sex = "m";
      g.wins = 0; g.losses = 0; g.kills = 0; g.pfame = 0;
      if(a.axis === "fatigue") g.fatigue = a.i ? 90 : 0;
      if(a.axis === "injury" && a.i > 0)
        /* THROUGH THE GAME'S OWN CONSTRUCTOR, and on parts it really uses. This swept "head",
           which is not a target the game has — `injuryFor` sets `part: target` and every target
           comes from TARGETS: arm, shoulder, thigh, flank, brow, hand. The fighter looks its
           binding up in that same table, so "head" resolved to nothing and two of the three
           injured men were drawn identically. The yard tolerated it only because `PART_Y` carries
           aliases. A fixture that plants states the game cannot produce proves nothing. */
        g.injury = A.injuryFor(["brow","flank","thigh"][a.i-1], false);
      /* THROUGH THE GAME'S OWN CONSTRUCTOR. This built `{part, big}` by hand, and the arena figure
         draws a scar at `s.x, s.y` — coordinates only `scarMark` puts on it — so every scar in this
         sweep would have been drawn at NaN,NaN on the fighter while reading fine in the yard. The
         same fault the note over `scarMark` records, re-introduced by the test rather than the game. */
      if(a.axis === "scars")
        g.scars = Array.from({length:a.i*2}).map((_,k)=>A.scarMark(["flank","arm","thigh","brow"][k%4], k%2===0));
      if(a.axis === "wins")   g.wins  = a.sweep[a.i];
      if(a.axis === "renown") g.pfame = a.sweep[a.i];
      if(a.axis === "kills")  g.kills = a.sweep[a.i];
      d.gladiators.push(g);
      return d;
    }, { axis, i, sweep: SWEEP[axis] || null });
    await clearAll(p, 8);
    await tab(p, "ludus"); await p.waitForTimeout(330); await clearAll(p, 5);
    await tab(p, "ludus"); await p.waitForTimeout(330); await settle(p);
    const yard = await p.evaluate(READ);
    /* to his card and onto its KIT face, which is where the arena's own figure is shown at rest,
       captioned "as he takes the sand". `arm` learned both of these: the gatekeeper's note sits
       above the roster, and the card has five faces with the figure behind only one. */
    await tab(p, "men"); await p.waitForTimeout(300);
    await clearAll(p, 6); await p.waitForTimeout(200);
    await p.evaluate(()=>{ const c = [...document.querySelectorAll("button.panel")][0]; if(c) c.click(); });
    await p.waitForTimeout(420);
    await p.evaluate(()=>{ const c = [...document.querySelectorAll(".modalwrap button.chip")]
      .find(b=>/^kit$/i.test((b.innerText||"").trim())); if(c) c.click(); });
    await p.waitForTimeout(360); await settle(p);
    const card = await p.evaluate(FIG_READ);
    return { yard, card };
  };

  const seen = new Set(), figSeen = new Set();
  for(const [axis, want] of Object.entries(FLOOR)){
    const figWant = FIG_FLOOR[axis] || 0;
    const steps = Math.max(want, figWant);
    const keys = [], figKeys = [];
    for(let i=0;i<steps;i++){
      const r = await oneMan(axis, i);
      if(r.yard) keys.push(r.yard); else bad.push(`the yard drew no man at all on ${axis} step ${i}`);
      if(r.card) figKeys.push(r.card); else bad.push(`his card drew no fighter at all on ${axis} step ${i}`);
    }
    const uniq = new Set(keys.slice(0, want)), figUniq = new Set(figKeys.slice(0, Math.max(figWant,1)));
    for(const k of uniq) seen.add(k);
    for(const k of figUniq) figSeen.add(k);
    lines.push(`  ${axis.padEnd(8)} yard ${String(uniq.size).padStart(2)}/${want}`
      + `   fighter ${figWant ? `${String(figUniq.size).padStart(2)}/${figWant}` : " — not his to say"}`);
    if(uniq.size < want)
      bad.push(`${want} men differing only in ${axis} produce ${uniq.size} distinct drawing${uniq.size===1?"":"s"} — `
        + `the yard cannot tell them apart, so that reading is not reaching the picture`);
    if(figWant && figUniq.size < figWant)
      bad.push(`${figWant} men differing only in ${axis} produce ${figUniq.size} distinct fighter`
        + `${figUniq.size===1?"":"s"} on the card — the arena's own figure cannot tell them apart, `
        + `and it is the picture the game is FOR`);
  }
  lines.unshift(`both drawn men, over every axis each should read:`);
  lines.push(`distinct drawings across every sweep: yard ${seen.size} · fighter ${figSeen.size}`);
  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push("class, fatigue, where he is hurt, what has closed, what he has won, "
    + "who knows his name and who he has killed all reach the yard; the fighter reads every one of "
    + "them but the palm, which is not a thing a man carries into a fight");
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
