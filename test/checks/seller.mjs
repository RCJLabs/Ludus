/* THE BLOCK NEVER GIVES AWAY A NUMBER YOU HAVE NOT PAID FOR.

   The market's whole economy is that you do not know what you are buying. sellerSays() inflates every
   stat by ri(0,5), or ri(0,9) if the man has something wrong with him; readLevel is 0 with no doctore,
   1 with one, 2 once you pay SCOUT_FEE = 35 + 10% of his price; and bandOf widens the printed range to
   +-14, +-7, 0 to match. A whole teaching panel exists to explain that the numbers are the seller's.

   And under that, for every build up to v3.19.0, the panel drew the six stats a SECOND time as plain
   bars off g[k] — the true value, unconditional, no readLevel within twenty lines of it. Measured off
   the screen over 198 stats on 33 unscouted men, the bar sat a mean 3.17 points below the printed
   band's centre, never negative, never once outside the band, with the gaps distributed 0 through +9
   exactly as sellerSays rolls them. That is not a redraw of the seller's claim, which would agree
   exactly every time; it is the true stat, and Bar puts it in aria-valuenow to the integer as well as
   in the fill width. Everything the market charges for was legible for nothing, six pixels lower.

   THE INVARIANT, stated so it needs no access to the true value — which is the point, since a player
   has none either. On a man still offering HAVE HIM LOOKED OVER:
     - no progressbar in his panel may carry aria-valuenow at all
     - every window must run from exactly the lo to exactly the hi that is printed above it
   and on a man who has been paid for:
     - the bar carries aria-valuenow, and it equals the exact number printed above it
   If a future build reintroduces any channel carrying more than the band, the first bar catches it
   without anybody having to think of that channel in advance.

   WHAT WOULD FALSIFY IT: a bar whose window is narrower than the printed band, or an aria-valuenow on
   an unscouted man. Both are read off the rendered DOM of a real house, so neither can be argued. */

import { found, endWeek, clearAll, tab } from "../harness.mjs";

export const name = "seller";
export const describe = "the block never shows a stat the player has not paid for";
export const slow = true;   /* reads the rendered block in a real browser, week over week */

const readBlock = p => p.evaluate(()=>{
  const out = [];
  for(const el of [...document.querySelectorAll(".scroll > div .panel")]){
    /* a man's panel: a price in the corner and a bar row under it. Anything else on the tab —
       THE STAFF, THE BLOCK's own summary — has neither. */
    if(!el.querySelector('[role=progressbar]')) continue;
    if(!/^\d+d$/.test((((el.querySelector(".gold")||{}).innerText)||"").trim())) continue;
    const txt = (el.innerText||"").replace(/\s+/g," ");
    out.push({
      name: ((el.innerText||"").split("\n")[0]||"").trim(),
      /* which sentence is showing IS the read level, without asking the game anything */
      lvl: /Assessed:/.test(txt) ? 2 : /walks round/.test(txt) ? 1 : 0,
      offered: /looked over/i.test(txt),
      bands: [...txt.matchAll(/\b(\d{1,2})[–-](\d{1,2})\b/g)].map(m=>[+m[1], +m[2]]),
      exact: [...txt.matchAll(/\b(?:Stre|Agil|Endu|Tech|Show|Disc)\s+(\d{1,3})\b/g)].map(m=>+m[1]),
      bars: [...el.querySelectorAll('[role=progressbar]')].map(b=>{
        const f = b.querySelector(".fill");
        return { aria: b.getAttribute("aria-valuenow"),
          left: f ? parseFloat(f.style.marginLeft || "0") : null,
          width: f ? parseFloat(f.style.width || "0") : null }; }),
      h: Math.round(el.getBoundingClientRect().height) });
  }
  return out;
});

export async function run({ p, errors }){
  const lines = [], fails = [];
  await found(p);

  const men = new Map();
  for(let w=0; w<14; w++){
    await tab(p, "market"); await p.waitForTimeout(200); await clearAll(p, 6);
    await tab(p, "market"); await p.waitForTimeout(200);
    for(const r of await readBlock(p)) men.set(r.name + "|" + r.lvl, r);
    if(!(await endWeek(p))) break;
    await clearAll(p);
  }

  const all = [...men.values()];
  const unpaid = all.filter(r => r.lvl < 2);
  if(unpaid.length < 6){
    return { pass:false, lines,
      why:`only ${unpaid.length} unscouted men seen on the block over 14 weeks [expect about 30] — `
        + `the house is probably dead or the market tab never mounted, and this check then holds `
        + `nothing at all` };
  }

  /* ---- 1. no exact number anywhere on a man nobody has looked at ---- */
  const leaked = unpaid.filter(r => r.bars.some(b => b.aria != null));
  if(leaked.length)
    fails.push(`${leaked.length} of ${unpaid.length} unscouted men carry an exact stat in a bar's `
      + `aria-valuenow — e.g. ${leaked[0].name} at ${leaked[0].bars.filter(b=>b.aria!=null)
        .map(b=>b.aria).join("/")}. The panel above prints the seller's band; anything on the panel `
      + `carrying more than that band is the number scout() is charging for, given away`);

  /* ---- 2. the window is the band, exactly ---- */
  let checked = 0, off = 0; let worst = null;
  for(const r of unpaid){
    const n = Math.min(r.bands.length, r.bars.length);
    for(let i=0;i<n;i++){
      const [lo,hi] = r.bands[i], b = r.bars[i];
      if(b.left == null) continue;
      checked++;
      const dl = Math.abs(b.left - lo), dh = Math.abs(b.left + b.width - hi);
      if(dl > 0.6 || dh > 0.6){ off++;
        if(!worst) worst = `${r.name} prints ${lo}–${hi} and draws ${b.left}–${(b.left+b.width).toFixed(1)}`; }
    }
  }
  if(off)
    fails.push(`${off} of ${checked} windows do not match the band printed over them (${worst}). A window `
      + `narrower than the band claims a precision nobody paid for; wider is simply wrong`);
  lines.push(`${unpaid.length} unscouted men over 14 weeks · ${checked} stat windows, `
    + `${checked-off} drawn exactly at the band they print, ${leaked.length} carrying an exact number`);

  /* ---- 3. and paying for a man does what it says ---- */
  await tab(p, "market"); await p.waitForTimeout(240); await clearAll(p, 6);
  await tab(p, "market"); await p.waitForTimeout(240);
  const paid = await p.evaluate(()=>{ const b = [...document.querySelectorAll("button.btn")]
    .find(x => /looked over/i.test(x.innerText||"") && !x.disabled);
    if(!b) return null; const t = (b.innerText||"").trim(); b.click(); return t; });
  if(!paid){
    lines.push(`nothing on the block could be afforded this week, so the paid half went unmeasured`);
  } else {
    await p.waitForTimeout(500); await clearAll(p, 6);
    await tab(p, "market"); await p.waitForTimeout(240);
    const done = (await readBlock(p)).filter(r => r.lvl === 2);
    if(!done.length){
      fails.push(`paid for a man ("${paid}") and no panel on the block moved to read level 2 — the fee `
        + `was taken and the assessment never appeared`);
    } else {
      const r = done[0];
      const blind = r.bars.filter(b => b.aria == null).length;
      const wrong = r.exact.filter((v,i) => r.bars[i] && +r.bars[i].aria !== v).length;
      if(blind) fails.push(`${r.name} has been looked over and ${blind} of his bars still carry no `
        + `number — paying is supposed to collapse the window to what he is`);
      if(wrong) fails.push(`${r.name} has been looked over and ${wrong} bars disagree with the numbers `
        + `printed over them (${r.exact.join("/")} against ${r.bars.map(b=>b.aria).join("/")})`);
      lines.push(`paid "${paid}" → ${r.name} reads ${r.exact.slice(0,6).join("/")}, `
        + `and his bars say ${r.bars.slice(0,6).map(b=>b.aria).join("/")}`);
    }
  }

  /* ---- and what the merge cost, printed rather than barred: the panel is the market ---- */
  const hs = unpaid.map(r=>r.h).sort((a,b)=>a-b);
  lines.push(`a man on the block is ${hs[hs.length>>1]}px of panel [was 502 before the two stat grids `
    + `became one; the tab is nothing but these]`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
