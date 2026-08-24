/* THE CONVERSATION THE PLAYER STARTS — #196

   `ASKS` is five entries and every one is HIM opening it, through `askWeek`: regard 45, three
   bouts, a 6% weekly roll, and `d.flags.asked`, which is one-way — **a man asks you once in his
   life and never again**. Measured over 12 houses x 420 weeks before this was built: **47.3% of the
   men a house holds reach the point where they would speak to you and 9.5% ever do**, on 1.7% of
   weeks. A quarter of all active man-weeks clear the gate, and 28% of those belong to a man whose
   one turn is already behind him — for a median of 16 weeks and as long as 57.

   `haveWordWith` is the other direction, off the man's own "What he makes of you" panel. What this
   check holds is the three things that keep it from being a cheat:

     THE PRICE. `wants` makes him VOICE an unvoiced ambition — `voiced` and `since` are the two
     fields the despair tick reads, so learning what he wants starts his clock. Knowing costs the
     quiet, and that is asserted rather than described.
     THE EMPTY CASE. A man with nothing on his mind must be able to say so, and the week's
     conversation is spent finding out. Without it the verb is an oracle: ask, and the game tells
     you the most interesting true thing about a man.
     THE GATES. One conversation a week, the same man not twice inside `WORD_COOL`, and never over
     the top of something already at your table.

   Every entry is driven — text, choices, and all three answers — because a table of writing nobody
   has run is how `nokill` and `nobeast` went 651 given and 0 met (#188).
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, hasHandle } from "../harness.mjs";

export const name = "talk";
export const describe = "the player can start a conversation, it costs him something, and it can come up empty";

export async function run({ p }){
  const lines = [], fails = [];
  const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");

  /* ---- STATIC: it resolves, and the table is shaped like the others ---- */
  const ev = /\bword:\s*\{\s*make\(\)\{\s*return null;\s*\},/.test(src);
  lines.push(`EVENTS.word resolver present: ${ev}`);
  if(!ev) fails.push("EVENTS has no `word` entry with a make() — an event raised with an id nothing resolves is a dead modal");

  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], say = [];
    for(const f of ["WORDS","WORD_KEYS","WORD_COOL","wordReady","wordWhy","haveWordWith","newGameState","activeG"])
      if(A[f] == null) return { bad:[`${f} is not on the handle`], say };

    /* every entry carries the four fields the raiser and the resolver read */
    for(const k of A.WORD_KEYS){
      const W = A.WORDS[k];
      for(const f of ["w","need","say","run"])
        if(W[f] == null) bad.push(`WORDS.${k} has no \`${f}\` — the raiser or the resolver will skip it`);
    }
    say.push(`WORDS: ${A.WORD_KEYS.length} entries [${A.WORD_KEYS.join(" ")}] · WORD_COOL ${A.WORD_COOL}`);

    /* ---- DRIVEN: every entry raised on a man built to satisfy it ---- */
    const fresh = () => { const d = A.newGameState("Talk","clean","TALK-1",null); d.week = 60; return d; };
    const build = {
      wants: d => { const g = A.activeG(d)[0];
        g.ambition = { kind:"freedom", met:false, broken:false, voiced:0, since:0, promised:false, despair:false };
        g.memory = []; g.defiance = 10; return g; },
      grudge: d => { const g = A.activeG(d)[0];
        g.ambition = null; g.defiance = 10;
        g.memory = [{ kind:"whipped", week:d.week-3, again:1 }]; return g; },
      spine: d => { const g = A.activeG(d)[0];
        g.ambition = null; g.memory = []; g.defiance = 80; return g; },
      beside: d => { const men = A.activeG(d); const g = men[0], o = men[1];
        if(!o) return null;
        g.ambition = null; g.memory = []; g.defiance = 10;
        d.ties = [{ a:g.id, b:o.id, kind:"brother", strength:70 }];
        return g; },
    };
    let raised = 0;
    for(const k of A.WORD_KEYS){
      const mk = build[k];
      if(!mk){ bad.push(`WORDS.${k} has no fixture in this check — a new entry must be driven, not assumed`); continue; }
      let hit = null;
      /* the weighted pick can land elsewhere when several fit, so try until this one comes up */
      for(let t=0; t<60 && !hit; t++){
        const d = fresh(); const g = mk(d); if(!g) break;
        d.pendingEvent = null; d.flags.wordWk = null; g.wordWk = null;
        if(!A.haveWordWith(d, g.id)) continue;
        if(d.pendingEvent && d.pendingEvent.data.k === k) hit = { d, g, e:d.pendingEvent };
      }
      if(!hit){ bad.push(`WORDS.${k} could never be raised on a man built to satisfy its own \`need\` — it is unreachable writing`); continue; }
      raised++;
      const e = hit.e;
      if(!e.text || e.text.length < 40) bad.push(`WORDS.${k} raised an event with no text worth reading`);
      if(!Array.isArray(e.choices) || e.choices.length < 2) bad.push(`WORDS.${k} raised an event with fewer than two answers`);
      say.push(`   ${k.padEnd(7)} ${e.choices.length} answers · "${String(e.text).replace(/\s+/g," ").slice(0,66)}…"`);
      /* every answer must come back as a sentence, and none may throw */
      for(let i=0;i<e.choices.length;i++){
        const d2 = fresh(); const g2 = mk(d2); if(!g2) break;
        let r = null;
        try { r = A.EVENTS.word.run(d2, { data:{ k, gid:g2.id, ex:e.data ? e.data.ex : e.ex } }, i); } catch(x){ r = null; }
        /* the fixture's own ex is what the resolver needs for `beside`; rebuild it honestly */
        if(r == null || typeof r !== "string" || r.length < 20)
          bad.push(`WORDS.${k} answer ${i} returned ${r === null ? "nothing" : "\`"+String(r).slice(0,40)+"\`"} — every answer is a line the player reads`);
      }
    }
    say.push(`${raised} of ${A.WORD_KEYS.length} entries raised on a fixture built for them`);
    if(!raised) bad.push("not one entry could be raised — this check proves nothing");

    /* ---- THE PRICE: `wants` starts his clock ---- */
    { const d = fresh(); const g = build.wants(d);
      const before = { voiced:g.ambition.voiced, since:g.ambition.since };
      let got = false;
      for(let t=0;t<60 && !got;t++){
        const dd = fresh(); const gg = build.wants(dd);
        if(A.haveWordWith(dd, gg.id) && dd.pendingEvent && dd.pendingEvent.data.k === "wants"){
          A.EVENTS.word.run(dd, dd.pendingEvent, 2);          /* the answer that promises nothing */
          got = true;
          say.push(`the price: voiced ${before.voiced} -> ${gg.ambition.voiced}, since ${before.since} -> ${gg.ambition.since} (week ${dd.week})`);
          if(!(gg.ambition.voiced >= 1))
            bad.push("a man told you what he wants and his ambition is still unvoiced — knowing has to cost the quiet, or this is free information");
          if(gg.ambition.since !== dd.week)
            bad.push(`\`since\` reads ${gg.ambition.since} and the week is ${dd.week} — the despair clock must start when he speaks`);
        }
      }
      if(!got) bad.push("the `wants` entry could not be driven to its answer, so the price is unproven");
    }

    /* ---- THE EMPTY CASE: a man with nothing on his mind ---- */
    { const d = fresh(); const g = A.activeG(d)[0];
      g.ambition = null; g.memory = []; g.defiance = 10; d.ties = []; d.pendingEvent = null;
      const ok = A.haveWordWith(d, g.id);
      say.push(`a man with nothing on his mind: raised=${ok} · event=${d.pendingEvent ? d.pendingEvent.data.k : "none"} · week spent=${d.flags.wordWk === d.week}`);
      if(!ok) bad.push("a man with nothing on his mind could not be sent for at all — the verb must be spendable on a blank");
      if(d.pendingEvent) bad.push(`sending for a man with no ambition, no memory, no edge and no tie still raised \`${d.pendingEvent.data.k}\` — the verb is an oracle`);
      if(d.flags.wordWk !== d.week) bad.push("the week's conversation was not spent on the empty case — then asking is free and choosing who is not a decision");
    }

    /* ---- THE GATES ---- */
    { const d = fresh(); const g = build.spine(d);
      A.haveWordWith(d, g.id); d.pendingEvent = null;
      const men = A.activeG(d);
      const other = men[1];
      if(other && A.wordReady(d, other)) bad.push("a second man could be sent for in the same week — one conversation a week is the gate");
      d.flags.wordWk = null;
      if(A.wordReady(d, g)) bad.push(`the same man could be sent for again immediately — WORD_COOL is ${A.WORD_COOL} weeks`);
      d.week += A.WORD_COOL;
      if(!A.wordReady(d, g)) bad.push(`the same man is still refused ${A.WORD_COOL} weeks later — the cooldown never lifts`);
      d.pendingEvent = { id:"x" };
      if(A.wordReady(d, g)) bad.push("a man could be sent for over the top of something already at your table");
      d.pendingEvent = null;
      g.status = "dead";
      if(A.wordReady(d, g)) bad.push("a dead man could be sent for");
      say.push(`gates: one a week, ${A.WORD_COOL}-week per man, no double-booking, no dead men — all held`);
    }
    return { bad, say };
  });

  lines.push(...out.say);
  fails.push(...out.bad);
  if(!fails.length) lines.push("the player can start it, it costs him the quiet, and a man is allowed to have nothing to say");
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
