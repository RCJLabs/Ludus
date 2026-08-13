/* IS THE PRIMACY SILENT, OR WAS I LOOKING IN THE WRONG THREE PLACES?

   The claim on the way in: the primacy is live for 644 of 1558 house-weeks and neither the agenda nor
   SECT_MARK says a word. Two corrections since, both mine:

     the ask     PRIMUS_ASK fires a whole event about the primacy at 14% a week — but inside the branch
                 where d.primus.mine is TRUE. That is the DEFENCE of a title you hold, not the taking of
                 one you do not, so it does not cover the state measured.
     the gate    my live predicate was !primusMine && some(primusEligible). The game's own gate for a
                 primus offer adds d.fame >= TIERS[2].fame. So an unknown share of those 644 weeks were
                 weeks the primacy was not actually available, and the denominator was wrong.

   And a channel I had not counted at all: a primus offer goes onto the ARENA CARD, in d.games.offers,
   tagged primus:true and titled "the primacy of Capua". The card is where every bout is chosen, so an
   offer sitting on it is the game telling you — as plainly as it tells you anything.

   So this counts, over real play, four things on the game's own terms:
     gate open    d.primus && !mine && some(primusEligible) && fame >= TIERS[2].fame
     on the card  of those weeks, a primus offer actually generated (the gate then rolls at 0.6)
     agenda       of those weeks, any ranked label naming it
     a mark       of those weeks, any sectMark for it — there is no primacy key, so this is 0 by design

   WHAT WOULD FALSIFY THE SILENCE CLAIM: the card carrying the offer on a decent share of open weeks.
   That would make the primacy surfaced where bouts are surfaced, and the item is refuted rather than
   built. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const T2 = A.TIERS[2].fame;
  let weeks=0, gate=0, card=0, cardWeek=0, cityCard=0, agenda=0, mark=0, held=0, everHeld=0, eligNoFame=0, took=0;
  const seenTitles = {};
  for(let h=0;h<H;h++){
    const d = A.newGameState("Pr"+h,"clean",`PRIM-${h}`,null);
    let was = false;
    for(let w=0;w<W;w++){
      if(d.over) break;
      weeks++;
      const mine = A.primusMine(d);
      if(mine){ held++; if(!was){ everHeld++; was = true; } }
      /* the game gates on activeG(d), not on every man on the books. d.gladiators carries the
         injured and the benched, and a house carries MORE of those the longer it runs — so using it
         inflated the open-week denominator by a growing amount and made the offer rate look like it
         collapsed over a run (75% of cards early, 5% late) when the code rolls a flat 0.6. */
      const elig = !mine && !!d.primus && A.activeG(d).some(g=>A.primusEligible(g));
      if(elig && d.fame < T2) eligNoFame++;
      if(elig && d.fame >= T2){
        gate++;
        /* d.games PERSISTS between games weeks and carries its own week field, so reading
           d.games.offers in a week with no games reports a STALE card. That is what made the
           long-run figure 3% and the short-run figure 29% off the same probe: the denominator
           was every open week, including the many with no card up at all. */
        const fresh = !!(d.games && d.games.week === d.week);
        if(fresh) cardWeek++;
        /* line 9803 builds a card for a city on tour with its own path, and only Capua's builder
           carries the primus branch. If late houses take their games on the road, the primacy stops
           being offered for reasons nothing in its own code shows. */
        if(fresh && d.games.city) cityCard++;
        const offs = (fresh && d.games.offers) || [];
        const po = offs.find(o=>o && (o.primus || /primacy/i.test(o.festival||"")));
        if(po){ card++; seenTitles[po.festival||"?"] = (seenTitles[po.festival||"?"]||0)+1; }
        const rank = A.agendaRanked(d);
        if(rank.some(x=>/primus|primacy|first house|foremost/i.test(String(x.label||"")))) agenda++;
        for(const k of Object.keys(A.SECT_MARK||{})){
          let m=null; try{ m=A.sectMark(d,k);}catch(e){}
          if(m && /prim/i.test(k)){ mark++; break; } }
      }
      R.lanista(d);
    }
  }
  return { weeks, gate, card, cardWeek, cityCard, agenda, mark, held, everHeld, eligNoFame, seenTitles, T2, H,
    markKeys:Object.keys(A.SECT_MARK||{}), rope:R.say() };
}, [H,W]);
await browser.close(); server.close();
const pc = (n,d) => d ? `${(n/d*100).toFixed(0)}%` : "-";
console.log(`=== IS THE PRIMACY SILENT? ===`);
console.log(`  ${out.weeks} house-weeks over ${out.H} houses · the fame gate for a primus offer is ${out.T2}`);
console.log(`  the house HELD the primacy on ${out.held} weeks, taking it at least once in ${out.everHeld} of ${out.H} houses\n`);
console.log(`  weeks the game's own gate was open           ${out.gate}  (${pc(out.gate,out.weeks)} of all play)`);
console.log(`  ...eligible man but not famous enough yet    ${out.eligNoFame}  — these are NOT weeks the primacy was available,`);
console.log(`                                                 and counting them was the fault in the first pass`);
console.log(`  ...of which a CARD WAS UP AT ALL             ${out.cardWeek}  (${pc(out.cardWeek,out.gate)} of open weeks)`);
console.log(`  ...and how many of those cards were on the ROAD ${out.cityCard}  (${pc(out.cityCard,out.cardWeek)}) — only Capua's card can carry it`);
console.log(`  a primus offer on that card                  ${out.card}  (${pc(out.card,out.cardWeek)} of weeks with a card,`
  + ` ${pc(out.card,out.gate)} of all open weeks)`);
console.log(`  of the open weeks, the agenda named it        ${out.agenda}  (${pc(out.agenda,out.gate)})`);
console.log(`  of the open weeks, a section mark fired       ${out.mark}  (${pc(out.mark,out.gate)})  — no primacy key exists among ${out.markKeys.length}`);
console.log(`\n  what the card called it: ${Object.entries(out.seenTitles).map(([k,v])=>`"${k}" x${v}`).join(" · ") || "never offered"}`);
console.log(`  rope: ${out.rope}`);
