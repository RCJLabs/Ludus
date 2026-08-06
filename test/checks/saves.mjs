/* An old save still loads, and comes out whole.

   The state has one hundred and thirty-five top-level keys and grew one at a time
   over fifty versions. Every field added is a chance to forget its backfill, and a
   forgotten one is a NaN or a crash in a stranger's year-twelve save — the one
   thing in this game that cannot be undone by the player.

   So: take a full save, strip it back to what older versions actually held, put it
   through migrate, and check that nothing is missing, nothing is undefined, and the
   thing that comes out can still play a week. */

import { hasHandle } from "../harness.mjs";

export const name = "saves";
export const describe = "a save from any vintage loads whole and plays a week";

export async function run({ p }){
  if(!(await hasHandle(p))) return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const fresh = () => { const d = A.newGameState("Vintage","clean","SAVECHECK",null);
      d.week = 40; d.fame = 220; d.gold = 9000;
      while(d.gladiators.length < 5) d.gladiators.push(A.genGladiator(d, 60));
      return d; };

    /* every key a current save has, and every key a current man has */
    const model = fresh();
    const KEYS = Object.keys(model);
    const MANKEYS = Object.keys(model.gladiators[0]);

    /* the vintages. Each strips what a save of that age would not have carried. */
    const VINTAGES = {
      "everything present": d => d,
      "no ver at all":      d => { delete d.ver; return d; },
      "ver 9":              d => { d.ver = 9; ["book","annals","household","gamWhen","rise","brand",
        "domus","league","staffMarket","forged","gearCond","kept","pitCard","pitSeat"].forEach(k=>delete d[k]); return d; },
      "ver 1":              d => { d.ver = 1;
        KEYS.forEach(k=>{ if(!["week","gold","fame","name","gladiators","log","seed"].includes(k)) delete d[k]; });
        return d; },
      "men stripped bare":  d => { d.gladiators.forEach(g=>{
        MANKEYS.forEach(k=>{ if(!["id","name","cls","str","agi","end","tec","sho","dis","status"].includes(k)) delete g[k]; });
      }); return d; },
      "the empty house":    d => { d.gladiators = []; d.market = []; return d; },
      "nulls where objects go": d => { ["rivals","patrons","annals","book","law","rep","crest",
        "factions","rise","domus","league"].forEach(k=>{ d[k] = null; }); return d; },
    };

    const rows = [];
    for(const [label, strip] of Object.entries(VINTAGES)){
      const d = strip(fresh());
      let migrated = null, threw = null;
      try { migrated = A.migrate(d); } catch(e){ threw = e.message; }
      if(threw){ rows.push({ label, threw }); continue; }

      const missing  = KEYS.filter(k => migrated[k] === undefined);
      const badMen   = [];
      (migrated.gladiators||[]).forEach(g=>{
        for(const k of ["regard","form","fans","strain","weeksAged","age","scars","scarCap","kit","sex","regimen","focus"])
          if(g[k] === undefined || (typeof g[k] === "number" && !Number.isFinite(g[k]))) badMen.push(k);
      });
      const nan = KEYS.filter(k => typeof migrated[k] === "number" && !Number.isFinite(migrated[k]));

      /* and can it still take a week? */
      let weekThrew = null;
      try { A.endWeek(migrated); } catch(e){ weekThrew = e.message; }

      /* migrating twice must change nothing that migrating once did not */
      const once = JSON.stringify(migrated.ver);
      let twice = null;
      try { A.migrate(migrated); twice = JSON.stringify(migrated.ver); } catch(e){ twice = "threw: "+e.message; }

      rows.push({ label, missing, nan, badMen:[...new Set(badMen)], weekThrew,
        stable: once === twice, ver: migrated.ver });
    }
    return { rows, keys:KEYS.length, manKeys:MANKEYS.length, latest:A.SAVE_VER,
      repairs:A.REPAIRS.length, fields:Object.keys(A.SAVE_FIELDS).length,
      maybe:A.SAVE_MAYBE.length, numbers:Object.keys(A.SAVE_NUMBERS).length };
  });

  const lines = [
    `${out.keys} top-level keys, ${out.manKeys} per man · shape: ${out.fields} fields, ${out.maybe} nullable, ${out.numbers} numbers · ${out.repairs} repairs · latest ver ${out.latest}`,
  ];
  const fails = [];
  for(const r of out.rows){
    if(r.threw){ fails.push(`"${r.label}" threw in migrate: ${r.threw}`); lines.push(`${r.label.padEnd(24)} THREW`); continue; }
    const bits = [];
    if(r.missing.length) bits.push(`${r.missing.length} missing (${r.missing.join(", ")})`);
    if(r.nan.length)     bits.push(`${r.nan.length} not-a-number (${r.nan.slice(0,3).join(", ")})`);
    if(r.badMen.length)  bits.push(`men missing ${r.badMen.slice(0,4).join(", ")}`);
    if(r.weekThrew)      bits.push(`the week threw: ${r.weekThrew.slice(0,60)}`);
    if(!r.stable)        bits.push("migrating twice changed it");
    lines.push(`${r.label.padEnd(24)} ver ${String(r.ver).padStart(2)} · ${bits.length ? bits.join(" · ") : "whole"}`);
    for(const b of bits) fails.push(`"${r.label}": ${b}`);
  }
  return { pass: fails.length === 0, why: fails.slice(0,5).join("; ") || null, lines };
}
