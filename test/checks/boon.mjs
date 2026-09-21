/* A BOON THE TITLE SCREEN PROMISES AND NOTHING PAYS OUT — #305

   The six legacies are the only thing that crosses between houses, and the title screen has been
   naming what each is worth since they were written. Two of those six sentences were false for as
   long as they have existed: `legacyPrice` (6% off the block) and `legacyRegard` (+6 on a bought
   man) were written, named, given the exact constants the sentences quote — and CALLED BY NOTHING.
   `grep` returned two definitions and no call site. Sixty men in the ground bought the player a
   sentence.

   Nothing caught it because nothing was looking. Every existing check reads what the code DOES;
   this one reads what the code SAYS and asks whether anything does it. That is the general form of
   the fault this release paid for three times — a definition is not a call site, `SIGNATURES.odds`
   is not the landing chance, `d.legacy` is not the running tally — and the only defence against it
   is a test that starts from the claim rather than from the function.

   FIVE ARMS:

     1  the source itself: every helper a `boon` leans on has a CALL SITE, not just a definition.
        This is the arm that would have gone red the day `legacyPrice` was written. It reads
        `src/ludus.jsx` and counts uses outside the `const NAME =` line.
     2  one table of claims, not two. `legacyRows` must hand the standing panel the SAME sentence
        the title screen prints — #299 built a second table and it drifted inside one release.
     3  the block discount is REAL and it is the number the player sees. A house holding The Long
        Bill is built, a market made, and the asking price compared against a house without it —
        then a man is bought and the coin that leaves the strongbox is compared against the tag.
     4  the new man's regard is real: the same two houses, the same man off the block, +6.
     5  a forged slot prices nothing. `equipOne` refuses a swap when a named piece sits in the
        slot, so `gearWorth` must return null there rather than quoting the worth of an exchange
        the rules will not make.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, hasHandle } from "../harness.mjs";

export const name = "boon";
export const describe = "what the legacies promise is what something in the code actually pays";

/* the helper behind each standing claim, and the word in the sentence that promises it */
const PAYS = {
  buried: { fn:"legacyPrice",  want:/6%/ },
  freed:  { fn:"legacyRegard", want:/6 more regard/ },
};

export async function run({ p }){
  const lines = [], fails = [];
  if(!await hasHandle(p)) return { pass:false, why:"no test handle — build with `node build.js --test`", lines };

  /* ---- ARM 1: A DEFINITION IS NOT A CALL SITE ---- */
  const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");
  /* comments blanked first: this file argues with itself in prose and names these functions a
     dozen times in it, which would read as call sites — `voice.mjs` learned that the hard way */
  const bare = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  if(bare.length < 200000){
    fails.push(`blanking comments left ${bare.length} characters of a ${src.length}-character file — `
      + `the scan is eating the source, and a scan that reads nothing finds every call site missing`);
  }
  const wired = [];
  for(const [k, P] of Object.entries(PAYS)){
    const uses = (bare.match(new RegExp(`\\b${P.fn}\\s*\\(`, "g")) || []).length;
    const defs  = (bare.match(new RegExp(`const\\s+${P.fn}\\s*=`, "g")) || []).length;
    if(!defs) fails.push(`\`${P.fn}\` is gone from the source but ${k}'s boon still names what it did`);
    else if(uses < 1)
      fails.push(`\`${P.fn}\` is defined and CALLED BY NOTHING, while the ${k} legacy's boon promises `
        + `what it computes — the player is told a thing the game does not do`);
    else wired.push(`${P.fn} ×${uses}`);
  }
  lines.push(`standing boons with a live call site: ${wired.length} of ${Object.keys(PAYS).length} · ${wired.join(" · ")}`);

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["newGameState","makeMarket","buyFromBlock","activeG","LEGACIES","legacyRows",
                  "legacyPrice","legacyRegard","gearWorth","forgeForMan","isNamed","GEAR"]
      .filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

    /* two houses off ONE seed so the market draws the same men: the only difference is the ledger
       the lanista walked in with. Anything that moves is the legacy and nothing else. */
    const build = held => {
      const d = A.newGameState("Boon","clean","BOON-1");
      d.legacy = Object.assign({ freed:0, buried:0, bouts:0, primus:0, rome:0, years:0, houses:1 }, held);
      d.gold = 500000;
      A.makeMarket(d);
      return d;
    };
    const plain = build({});
    const bill  = build({ buried:60 });      /* The Long Bill */
    const sword = build({ freed:12 });       /* The Wooden Sword */

    const mOf = d => (d.market||[]).filter(g=>g && g.price > 0);
    const tags = { plain:mOf(plain).map(g=>g.price), bill:mOf(bill).map(g=>g.price) };

    /* the coin that actually leaves the box, against the tag the block showed */
    const charge = d => {
      const g = mOf(d)[0]; if(!g) return null;
      const tag = g.price, before = d.gold, n0 = A.activeG(d).length;
      const ok = A.buyFromBlock(d, g.id);
      return { ok, tag, spent: before - d.gold, joined: A.activeG(d).length - n0,
        regard: (A.activeG(d).find(x=>x.id===g.id)||{}).regard, was: g.regard };
    };
    const cPlain = charge(plain), cBill = charge(bill), cSword = charge(sword);

    /* a forged slot: give a man a named piece and ask what a swap into it is worth */
    const d3 = A.newGameState("Forge","clean","BOON-2");
    d3.gold = 500000;
    const man = A.activeG(d3)[0];
    let forged = null, wornWorth = null, otherWorth = null;
    if(man){
      man.named = { slot:"weapon", title:"The Test Blade", made:1 };
      forged = A.isNamed(man, "weapon");
      const other = Object.keys(A.GEAR).find(id => A.GEAR[id].slot === "weapon" && id !== (man.kit||{}).weapon);
      wornWorth  = other ? A.gearWorth(man, "weapon", other) : "no second weapon in GEAR";
      const helm = Object.keys(A.GEAR).find(id => A.GEAR[id].slot === "helm" && id !== (man.kit||{}).helm);
      otherWorth = helm ? A.gearWorth(man, "helm", helm) : null;
    }

    return { tags, cPlain, cBill, cSword,
      says: Object.keys(A.LEGACIES).map(k=>({ k, boon:A.LEGACIES[k].boon,
        row:(A.legacyRows(plain).find(r=>r.k===k)||{}).say })),
      priceMul: A.legacyPrice(bill), regardAdd: A.legacyRegard(sword),
      forged, wornWorth, otherWorth };
  });

  if(out.why) return { pass:false, why:out.why, lines };

  /* ---- ARM 2: ONE TABLE OF CLAIMS ---- */
  if(out.says.length < 5)
    fails.push(`only ${out.says.length} legacies read off the handle — this arm compares what two `
      + `screens say and cannot do it on an empty table`);
  const split = out.says.filter(x => x.row !== x.boon);
  if(split.length)
    fails.push(`${split.map(x=>x.k).join(", ")}: the standing panel and the title screen say `
      + `different things about the same legacy — ${split[0].row} vs ${split[0].boon}`);
  lines.push(`legacies whose two screens print one sentence: ${out.says.length - split.length} of ${out.says.length}`);
  for(const [k, P] of Object.entries(PAYS)){
    const e = out.says.find(x => x.k === k);
    if(e && !P.want.test(String(e.boon)))
      fails.push(`${k}'s boon no longer names the figure \`${P.fn}\` pays — the sentence and the `
        + `constant have drifted apart, which is the whole fault this check exists for`);
  }

  /* ---- ARM 3: THE DISCOUNT IS REAL, AND IT IS THE NUMBER ON THE TAG ---- */
  const T = out.tags;
  if(!T.plain.length || T.plain.length !== T.bill.length){
    fails.push(`the two markets came out ${T.plain.length} and ${T.bill.length} men — the same seed `
      + `must draw the same block or nothing below is comparing like with like`);
  } else {
    const cut = T.plain.map((v, i) => v && T.bill[i] / v);
    const off = cut.filter(r => Math.abs(r - out.priceMul) > 0.02);
    if(out.priceMul !== 0.94)
      fails.push(`legacyPrice returns ${out.priceMul} for a house holding The Long Bill, not 0.94`);
    if(off.length > Math.ceil(cut.length * 0.15))
      fails.push(`${off.length} of ${cut.length} men on the block are not ${Math.round((1-out.priceMul)*100)}% `
        + `cheaper for a house that holds The Long Bill — the boon is promised and not paid`);
    lines.push(`block tags cut by the legacy: ${cut.length - off.length} of ${cut.length}`
      + ` · median ratio ${cut.slice().sort((a,b)=>a-b)[cut.length>>1].toFixed(3)}`);
  }
  for(const [who, c] of [["without", out.cPlain], ["with", out.cBill]]){
    if(!c || !c.ok){ fails.push(`the ${who}-legacy house could not buy a man off its own block`); continue; }
    if(c.joined !== 1) fails.push(`buying off the block ${who} the legacy put ${c.joined} men in the yard`);
  }
  if(out.cPlain && out.cBill && out.cPlain.ok && out.cBill.ok){
    /* #230's rule, which is the half of this that a discount at the CHARGE would have broken */
    const gap = [["without", out.cPlain], ["with", out.cBill]]
      .filter(([, c]) => Math.abs(c.spent - c.tag) > c.tag * 0.25);
    if(gap.length)
      fails.push(`${gap.map(([w])=>w).join(" and ")} the legacy, the block showed ${gap[0][1].tag}d and `
        + `${gap[0][1].spent}d left the strongbox — the tag and the charge must be one number`);
    lines.push(`the tag and the charge: ${out.cPlain.tag}d shown / ${out.cPlain.spent}d spent without it`
      + ` · ${out.cBill.tag}d / ${out.cBill.spent}d with it (the gap either way is the vectigal)`);
  }

  /* ---- ARM 4: THE NEW MAN'S REGARD ---- */
  if(out.regardAdd !== 6)
    fails.push(`legacyRegard returns ${out.regardAdd} for a house holding The Wooden Sword, not 6`);
  if(!out.cSword || !out.cSword.ok){
    fails.push(`the Wooden Sword house could not buy a man, so its boon could not be measured`);
  } else if(out.cPlain && out.cPlain.ok){
    const lift = out.cSword.regard - out.cPlain.regard;
    if(lift !== out.regardAdd)
      fails.push(`a man bought under The Wooden Sword came in at ${out.cSword.regard} regard against `
        + `${out.cPlain.regard} without it — a lift of ${lift}, where the boon promises ${out.regardAdd}`);
    lines.push(`regard on a man off the block: ${out.cPlain.regard} plain · ${out.cSword.regard} under the Wooden Sword`);
  }

  /* ---- ARM 5: A FORGED SLOT PRICES NOTHING ---- */
  if(!out.forged){
    fails.push(`the forged man did not read as named, so arm 5 measured nothing`);
  } else {
    if(out.wornWorth !== null)
      fails.push(`gearWorth priced a swap into a forged slot (${JSON.stringify(out.wornWorth)}) — `
        + `\`equipOne\` refuses that exchange, so the figure is the worth of something the player `
        + `cannot do, and the drawer charged him for trying`);
    if(out.otherWorth === null)
      fails.push(`gearWorth returned null for an UNNAMED slot on the same man — the lock is too wide `
        + `and the whole panel has gone quiet`);
    lines.push(`forged slot priced: ${out.wornWorth === null ? "nothing, correctly" : "a swap that cannot happen"}`
      + ` · his other slots still price: ${out.otherWorth !== null ? "yes" : "no"}`);
  }

  if(!fails.length) lines.push("every sentence the legacies print has something in the code paying it out");
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
