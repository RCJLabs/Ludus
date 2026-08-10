# The checks

```
npm test                  the fast tier — about half a minute
npm run test:all          every check, fast and slow
npm run test:slow         only the ones that drive a browser
npm test book modals      only those, whatever tier they are in
npm test -- --keep        leave the test bundle behind to poke at
npm run coverage          not what passes — what no check ever touches
```

Every check runs against a real build. Most reach into the game through the test
handle, play a house for a hundred weeks in memory, and answer in a second or two.
Five drive a real browser through the real screens, and those cost minutes.

## Why there are two tiers

They used to be one command, so the honest choice before a release was seventeen
minutes or nothing — and the answer was too often nothing. Two releases shipped on
the fast checks alone, and a fault in `survive` sat undetected across several more
because nobody had run it.

So `npm test` is the one you can afford on every save, and it prints in yellow
exactly which checks it did not run. `npm run test:all` before a release. The slow
checks run concurrently — each gets its own browser and its own storage, so there
was never a reason for them to queue — and `survive` plays its three houses side by
side rather than end to end.

A check declares itself with `export const slow = true`. Everything else is fast by
default, which is the right default: if a new check needs a browser, its author
knows it.

## Why these exist

Every one of them is a bug that shipped. The comment at the top of each file says
which. That comment is the durable part — when the numbers inside go stale, the
reason the check exists usually has not.

| check | tier | it exists because |
|---|---|---|
| `survive` | slow | economy changes have twice bankrupted every opening without anyone noticing |
| `engines` | fast | tactic and trait constants are 3–5× more powerful than they look, every time — and for fifty versions it tested two of the four engines under a comment claiming all of them |
| `book` | fast | the pair booked only its wins and the melee only its losses, for fifty versions |
| `modals` | slow | the week's digest threw itself over the answer to the question you were just asked |
| `sweep` | slow | the cheap net: does anything throw when you open it — every *face* of every tab, not just the one mounted when you arrive, because it reported `villa (+4 sections)` for a tab with 23 and a ReferenceError lived in the ones it never rendered |
| `layers` | fast | 28 overlays with hand-written z-indices, and no way to see the order |
| `saves` | fast | 165 lines of unordered backfills, and fifteen core fields that never had one |
| `block` | fast | buying a man lived in a React closure, so nothing outside it could buy anybody |
| `counsel` | fast | the book had every figure and no way to say what they came to |
| `actions` | fast | fifty-eight more actions lived in that same closure, and one probe measured its own copy of the feast |
| `rope` | fast | the pit filled half the weeks and paid the same in year twelve as in year one |
| `table` | fast | the only lever against the only number that ends a run cost 120 denarii flat, forever |
| `street` | fast | acclaim climbed past the top of its ladder into nothing, and the missio never read it |
| `chronicle` | fast | one in five lines the chronicle ever wrote was the same weekly receipt |
| `marks` | fast | a man bought with an old wound carried a scar drawn at NaN,NaN for as long as you owned him — and the four parts a bout wears down, held to the balance their split thresholds exist for |
| `grudge` | fast | two rival-vengeance events waited above the ceiling of the number they read |
| `card` | fast | three of the four fight engines shared a quarter of the bill, and the audit that found it was counting Rome |
| `stone` | fast | 336,500 denarii of works and monuments, and the richest careful house ever measured held 8,485 |
| `coast` | fast | a tour down the coast was single combats and nothing else, and a defeat away was invisible to the town that watched it |
| `census` | fast | the ladder's top rungs asked 110,000 denarii in cash from a house that had to spend the same coin on stone, so nobody ever stood on them |
| `bulk` | fast | four functions held every balance change in a 22,700-line file, and nothing ever said stop |
| `worst` | fast | the record book had a slot for the house's worst night that nothing ever wrote and nothing ever read; filling it found two more things nobody was writing |
| `nights` | fast | a man's page had everything about his condition and nothing about any afternoon of his life |
| `phases` | fast | the week was split into four phases so a check could run one alone, and no check ever called any of them — nor asserted the hard rule that no class may be clumsy in its own kit |
| `careers` | fast | the signature, mastery, the second trade, the switch, the rudis and retirement were all dark, and two audit probes "found" them unreachable when the fault was the probe |
| `roads` | fast | `setOut` and `comeHome` were never on the handle, so no check could take a tour and come back — and two 12-house audit batches emigrated by accident and reported half the game dead |
| `ledger` | fast | a payout read fame uncapped while its counterweight capped, and the ruin line still asked the figure it asked when a week cost fifty denarii; nothing was watching either |
| `summit` | fast | Rome is the only real ending and nothing had ever driven it — the gate took one proof and no other, and the trip had no clock, so a house that accepted and then declined its card sat there for ever with Capua frozen behind it |
| `line` | fast | `nameHeir` was never on the handle, so the half that arms a succession could not be reached by the half that fires it, and no check had walked a handover — four heir kinds with four different bargains, resting on nothing |
| `stall` | fast | `makeMarket` was not on the handle, so nothing could ask the block what it offered under a given state — a whole block battery was discarded for silently measuring the founding stall five times, the block's steep dependence on acclaim went unnoticed through the release that changed acclaim, and the market refresh was quietly destroying the paragon in the week he arrived, four times in five |
| `war` | fast | a fifty-eight week four-stage arc with its own tax, levy, market swing and defiance floor worked perfectly and had one door — the "open the gates" branch of one event, which costs nine men and thirty fame — so across 48 houses its four events fired not once |
| `glance` | fast | the agenda knew what wanted an answer and which tab it was on, and a player's only way to find out was to open all six every week — and the marks that fix it are the kind of thing that fails silently, because a dot that never lights looks exactly like a tab with nothing in it |
| `temple` | fast | five gods with four boons plumbed into the engine, and across 3,200 house-weeks no vow was ever sworn and no blessing ever rode with a house — the agenda had never named the gods, the Temple panel opened only for a house already using it, and a probe guard reserving four weeks' cushion produced the figure that made it all look unaffordable |
| `surface` | slow | the tab bar was 9px and END WEEK was 37px tall — and it measured a house twelve WEEKS old on one face of each tab with no record sheet ever opened, so it would have passed the whole way through a release where a house's name read "House Glaber…" and a fame of 23,703 rendered "237…" |
| `sand` | slow | thirteen checks called `doFight` and every one drove the engines in memory; four drove a browser and none reached the sand, so the most-looked-at screen in the game had no test — which is why a React key fault living on the bout wizard was found by a scratch probe photographing an axe |
| `draw` | fast | the week asks one question, chosen by the first event whose `make` fires from a shuffled key list — and the shuffle was `sort(()=>R()-0.5)`, the classic broken one, in a file that already contained a correct Fisher–Yates used in nine other places. What the game asked you depended on where in the file the event was written. Holds the shuffle uniform AND the statistic that actually decides it, the first *eligible* key, because the first-position figure overstates the fault four-fold |
| `probe` | fast | the audit's own instrument — a check that reads the other checks. The fight engines return at `res.unfinished` before crediting anything and mutate nothing, and nine of the nineteen checks that drive a bout were losing between a quarter and two thirds of their evidence to it. Fails any check that names an engine without resolving to exhaustion, reading each `if(… .crux …)` site rather than the file, because answering with the cloth ends the bout and is correct. One of its rules was taken back out for flagging seven right answers against one wrong one |
| `bay` | fast | the two coastal scales, neither of which had ever been toured — #115. Favour is a ratchet that opens every town on "an outsider" and climbs only on bouts fought there, and its bottom word is reachable ONLY through `cityServed`'s defeat branch at Neapolis; `knownIn` bleeds 0.55 a week and is pegged at 100 by a round robin. Also holds the branch neither of my arms could reach: the bay taken by a rival after 30 idle weeks, and given back only by turning up |
| `steel` | fast | wear — the one system where the probe was wrong FOUR separate ways. #114 read `d.gearCond`, which is the pool of pieces on the SHELF, and concluded steel never wears; read off the man in `g.wear[slot]` a bout takes 3-6 off a weapon, all five words are said and pieces break. Holds the rate against `WEAR_RATE`, the five words off a piece driven to nothing, the break on the game's own chronicle line, the bands a played house sees, a man's career against his weapon's life, and — the trap that cost the most — that a bout held at the balance has changed nothing while the same bout answered changes the kit |
| `houses` | fast | the four words for a rival house, two of which #113 measured as never said. Refuted on the item's own falsification clause: a house that works ONE rivalry for 300 weeks peaks at a median warmth of 76.8 and says all four, where a probe using `pickRivalOpp` meets six houses a little and tops out near 43. Holds the refutation plus the thing underneath it — that a bout against a rival's man registers as a meeting at all, which is `offer.opp.house` lining up with the rival's name |
| `chair` | fast | the name Capua settles on — `repStyle` — which earns two of the lanista's traits and is half of what makes a medicus walk out, and which nothing had ever measured. Sends one house after each of the four names the way a player would (the blood doctrine and *sine* stakes, the showboat tactic, the craft doctrine, the mercy doctrine plus the cloth at every crux) and holds three things: the town settles on something at all, each of the four names is not just reached but HELD for most of a house's named weeks, and the butcher loses his surgeon while the showman does not. Every one of the four faults it was written to catch turned out to be the probe |
| `ends` | fast | three answers to "what ends a house" were on record and disagreed, each measured on a different policy. Five policies over 400 weeks settled it: the mix belongs to the POLICY — 100% ledger for a house that does nothing, 40% empty yard for one that fights to the death every week, 69%/67% overall against a published 85%. This holds the cheap, stable half in 3 seconds: the opening is lethal, the ledger is what does it (11 of 13, median 272d UNDER), and a house doing nothing dies of the ledger too. The long table is in the roadmap and deliberately not asserted — the lifespan medians swung 36w to 20w between two runs |
| `near` | fast | ten lines telling the player how close they are to something, none of them ever driven — and this project had already shipped two of the shape wrong. Four were: the feast quoted a fraction through `Math.round` and read "reach **1** of them" at every house size; the paragon's shortfall was measured against the box plus debts at face plus steel at half, beside a button reading the box alone; the munus quoted **0 weeks** of cooldown to a house at Rome; the monuments' closed line blamed the monuments when the gate is the works. Five were right and are pinned so they stay right |
| `room` | slow | `sand` caught the pit row's second line cut off with 24px hidden — and then passed five runs in a row, because whether the fault shows depends on whether the night deals a long class name to a long house name. So this one does not wait to be dealt the bad case: it composes the widest line the content space allows out of `ORIGINS`, `NICKS`, `SMALL_HOUSES` and `CLASSES`, forces the widest menace word beside it, and measures the row. 263px of room for 300px of line before the fix, on all three men at the rope, every run |
| `scales` | fast | seventeen bucketed words the player reads and acts on, and the same fault had shipped three times — #79, #85 and `menace`. Walks every scale across the range its quantity can take, so a band that swallows the range or a word that can never be said both show up. It found the mirror of `menace`: `formWord`'s two outer words were never said in 4,862 man-weeks, because the decay of `f*0.78 - 3` against +24 for a win puts three straight wins at 37.6 and the band was 58 |
| `crown` | fast | the primacy — the top of the Capuan ladder and one of the two roads to Rome — was seven handle functions put there in v2.64.0 to be checked and never called once. Drives it end to end: the gate, the city seeding its own holder, the offer, the bout, the reign, the flag `romeReady` reads, a defence, losing it, and the second-best man in your own cells asking for it. And it holds the free reading: `menace`'s top bucket used to run from mean 66 to 99, which against one man is a quoted chance of 96% down to 13% — one word for every hard decision in the game |
| `wall` | fast | everything you do with another house's men — watch, drill against, court, buy, call out, settle — was eleven functions no check had ever called, in a system that supplies **98.6% of the single offers on a Capuan card**. Holds the shape of the bargain rather than a bug: what a reading costs and that it goes off, that a drill refuses a man nobody has watched, that it climbs to `PREP_MAX` and pays against **that one man and nobody else**, and what it takes off his own training (+6.3 stat points drilling against +9.5 at the post over six weeks) |
| `charter` | fast | the first-year guide — eleven steps, and a **prefix**: `charterWeek` stops at the first step not done, so one unfinishable step hides every step behind it and the year's 250d. Nothing had ever driven it. Walks the prefix end to end, holds each step to being finishable by a house doing exactly what it asks, keeps the stake sweep that found step two and step ten arguing (a crux in 0% of first-blood bouts, 53% at surrender), and asserts no step is retired by something it is not about — step ten used to clear on any man having a memory, which is written by one of your own being wounded |
| `lessons` | fast | thirty-five lessons, one per tab per week, each with an expiry window — so a queue, and sixteen of them could not be reached by any player: "Steel and Style" was `done` in week 1 of all five openings because every one hands you a rack, "Steel Does Not Last" closed on an event that had to happen before it could open, and between them the armory tab offered a new house nothing at all. Six sections now, three of which need no house to live long enough: every lesson **constructed into its own window** and asked (a gate whose halves cannot both hold is dead table); **no week-one action may shut one while its door is still closed** (which caught the note about the medicus being retired by hiring the trainer); and **from inside the window with a cold queue, he must reach it**. Its opening scan reads the five scenario keys off the handle, having spent two releases inventing four of them |
| `feats` | fast | five of the nineteen feats read as never earned across 3,200 house-weeks and every one of them was reachable — two of the five were the probe declining Rome's card and never founding the burial society; what was real was the cloth recording nothing outside a singles bout, and a sheet showing a dash to a house standing on the gate |

## What no check has ever touched

`npm run coverage` answers the question the pass column cannot. It builds the test
bundle — which wraps every function on `__LVDVS` in a counter — runs each check
against a fresh page, and reads the counters back. The output is three lists: how
much of the game each check reaches, everything nothing reaches at all, and which
functions rest on exactly one check, so it is known what goes dark if that check
does.

It exists because "passing" and "looking" are not the same thing, and this repo has
the receipts. `survive` ran for weeks without ever buying a man. Two checks asserted
against distributions borrowed from a different way of playing. `card` counted Rome
and a tour down the coast as though they were a Capuan bill and read 84% single
combats where the real figure was 57. None of that was visible from a green column.

The first sweep found `engines` — the check named for the fight engines, under a
comment that said "the other three engines" — calling `simulateFight` and
`simulatePair` and nothing else. The melee's eighteen rounds and the venatio's
fourteen had never been run by anything, and neither had `winChance`, which is the
number the player is shown before every bout and the one the wager is priced from.
Those are covered now; **84 of 257 still are not**, and the list is printed every
time so it stays a fact rather than a feeling.

That list is also where to go for the next item, and it is worth saying how to read it.
Eleven of the 84 turned out to be a single system — everything you do with another house's
men — supplying 98.6% of the opponents on a Capuan card, and the `wall` check came out of
noticing that they belonged together rather than out of picking one name off the list. Group
the dark functions before choosing; a cluster is a system nobody is watching, and a lone
name is usually a reader somebody will call next week anyway. Note too that a dark cluster
does not imply a bug: `wall` drove all eleven, found both of its hypotheses refuted, and
exists for the coverage. That is still worth a release.

**One caveat, because an unqualified coverage number is worse than none.** The
counter only sees calls made *through the handle*. A check that drives the real UI
runs plenty of game code — when the app calls `simulateMelee` from inside `doMelee`
it uses the module binding and never touches the wrapper — which is why the four
browser checks show zero. Read "never called" as "no check can assert anything about
this directly", not "this never runs". That is the useful reading regardless.

## The test build

Checks that reach inside the game need a handle on functions the bundle keeps to
itself. `node build.js --test` writes `dist/test.html` with `window.__LVDVS`
attached and never touches `index.html`.

The handle sits behind `process.env.LVDVS_TEST`, which esbuild folds away in a
shipping build — so what ships cannot carry it even by accident. That is the point:
the handle used to be appended to the source by hand and stripped again before every
release, and once it was not stripped cleanly.

Two things keep it out of a release: `dist/` is gitignored, so the test build cannot
be committed; and the runner rebuilds the shipping `index.html` on its way out, so the
tree is clean whether the checks passed or not.

To expose something new, add it to the `__LVDVS` block at the foot of `src/ludus.jsx`.
Nothing there reaches a player.

## What a check can reach

Every action a lanista can take is a function of the save — `sellMan(d, id, price)`,
`throwFeast(d)`, `setCareOf(d, id, "convalesce")` — living at module scope and
exported on the handle. The closures inside `App` are the React half only: read the
form, call one of these, set the panel that follows.

That split is the point. It used to be the other way round, and the cost was not
tidiness: nothing outside a mounted component could sell a man or throw a feast, so
no check could drive a house through a year. The one probe that needed the feast
copied it in by hand and then measured its own copy — which cannot catch a bug in
the original, and goes stale the moment the original moves, silently, because
nothing compares them.

If you add an action, add it at module scope and put it on the handle. `actions`
holds a list of names and fails when one goes missing, so a lift that forgets a
function is loud rather than quietly narrowing what the checks can see.

## Writing one

Drop a module in `checks/`. The runner finds it.

```js
import { found, endWeek, clearAll, slot } from "../harness.mjs";

export const name = "cells";
export const describe = "the cells cap grows when you build";
export const slow = true;        // only if it drives the screens; omit otherwise

export async function run({ p, errors, port }){
  await found(p);
  // ...
  return { pass: true, why: null, lines: ["what it saw"] };
}
```

`run` gets a live page, the errors it has thrown so far, and the port. Return
`{ pass, why, lines }` — `why` is printed only on failure, `lines` always.

`port` is there so a check can open more browsers of its own with `open(port)` —
that is how `survive` plays three houses at once instead of one after another.
Close what you open, and gather the extra sessions' `errors` alongside your own.

## Stock a roster with `genGladiator`, never `genOpponent`

`genOpponent` builds the other side of a card. It carries no `defiance`, no
`regard` and no record, because an opponent does not need them — and a roster
stocked with it averaged `undefined` into the week's unrest, so unrest came out
**NaN and was then clamped, stored, and read by the rebellion, the ledger and the
agenda without one of them noticing.** Six checks stock the player's cells this
way. `genGladiator(d, quality)` is the one that makes a man of the house.

The engine now reads `g.defiance || 0` so the field cannot NaN the number again,
and `phases` asserts it for a roster of strangers. But the habit is still wrong:
a man built by `genOpponent` has no memory, no ties and no ambition either, and a
check that measures any of those on him is measuring nothing.

## "The probe never did it" and "the game will not let you" look identical

This is the commonest fault in an audit and the most expensive, because it produces a
finding that reads like a discovery. Five feats of nineteen were never earned across
eight houses run four hundred weeks. Every one of them was reachable, and three needed
one line of probe policy: the burial society was never founded, so the stone was never
cut; and Rome's card is flagged **`imperial`**, not `rome`, comes up *sine* about a
third of the time and builds its man at quality 100+, so a probe with a 0.42
win-chance gate crossed Italy, was offered three bouts and declined all three.

Before filing a system as dead, write the policy that deliberately uses it and see
whether the system answers. If it does, the item is about prompting, not reachability,
and the fix is somewhere the player looks rather than somewhere the engine runs.

A fourth, from the v2.61.0 audit: **your own probe's competence.** Two items dissolved on it.
The feast looked unreachable — 10 houses in 24, first at week 138 — because the probe walked
its cells every seventh week and rested anybody past 55 fatigue; a deliberately inattentive
house sits past the feast's gate in 57% of weeks. And "debt is 85% of every ending" was true
only of playing well: a careless policy over 120 houses dies of rebellion or closure 37% of
the time. If a finding is about content nobody meets, run the policy that would meet it AND
the policy that plays badly, because both of them are players.

A third wears it too, and it is the one that cost most here: **your own probe's safety
margin.** The temple measurement reported a blessing riding 2.45% of weeks and "the altar
is unaffordable", and the guard producing that was mine — cost plus the ruin line plus
1,200 in hand, against a median 808 in the box and a cheapest altar of 203. An observing
probe that acted on nothing found the truth in one run: a house had a rested altar and the
coin for it in 86% of weeks. When a policy probe says a system is out of reach, run an
observer that only watches and see whether the game agrees.

Two other things wear this disguise. **A gate can be set one rung too high**, which looks
exactly like a gate that works: Rome's census road opened at the fifth rung of the
standing ladder, and every house that ever reached it had taken the primacy years
earlier — so the second road led nowhere new and only a per-house census of *when* each
proof came true showed it. And **content can be destroyed by something else in the same
week**: the paragon was put on the block by one part of `endWeek` and thrown away by
another fifty-six lines later, so "one house in twenty ever sees this" was not a rate, it
was a bug. When a feature reads as too rare, check whether the week is deleting it before
you retune the odds.

The same day taught the corollary: **a hint is a claim about the state, and a wrong one
is worse than saying nothing.** Two of the first proximity lines written for the feats
sheet were false — the forge wants *bought* steel, not house issue, so a house of six
men in stock kit was told the fee was the whole of it; and Rome's letter has five
conditions, so a house with no senator warm enough to send it read `0 fame short` and
would have gone off to win fame it did not need. Neither was caught by reading. Both
were caught by a check that drove the real gate.

## Measure the statistic the code uses, not the one that is easy to measure

`pickEvent` shuffles the event keys and returns the first ELIGIBLE one. When the shuffle turned
out to be broken, the obvious measurement was which key comes out FIRST — and that showed a 5.1×
spread across the list, which is a dramatic number and nearly went into the changelog as the
finding. It is the wrong statistic. Position zero only decides the outcome when the key at
position zero is eligible, and on a real house seven of fifty-seven were. Measured properly — the
first eligible key, over the eligible-set shapes a real house actually presents — the skew is
**1.3 to 1.4×**. Still a fault, still worth fixing, four times smaller than advertised.

The habit that catches this: before believing a figure, write down the line of code that consumes
it. If the number you measured is not the number that line reads, you have measured something
adjacent to the bug. And when the honest figure turns out smaller, say so at its real size — a
finding oversold once makes every figure in the same document worth less.

## The same scale fault has two directions, and a check for one will not catch the other

`menace` had one word covering the top of its range. `formWord` had two words nobody ever saw.
Both are the same underlying mistake — bucket edges set against a quantity nobody measured — and
a test written for one direction misses the other, which is exactly what happened here: the first
version of `scales` asserted that a band must not be too WIDE, passed the form table, and had to
be given a second assertion before it caught the bug it was written for.

So sweep for both. **Too wide** is arithmetic on the table alone: walk the function across its
quantity's clamps and measure the widest contiguous band as a share of the range. **Unreachable**
cannot be read off the table at all — it needs the mechanics that move the quantity, driven. For
form that is two lines: `formShift` for what a bout gives, `formWeek` for the weekly decay, and
then a fixed-point sum tells you the ceiling before you run anything.

And pick the bar from the game's own words where there is one. The lesson about form says "three
straight wins and he walks out expecting to win", so three straight wins reading as the top of the
scale is the game's promise rather than my taste, and a bar like that survives someone disagreeing
with me about what form should feel like.

## A bucket that ends below the top of the range says nothing where it matters most

Three audit items have now been the same shape. #79: fame ran past the last thing that read it.
#85: the street finished loving you by year eight and had nothing left to say. And now `menace`,
the one opponent reading a player gets without paying — its top word began at mean 66 while men
run to 99, so it covered a quoted chance of 96% down to 13% in a single word, and every hard
decision in the game lives in exactly that range.

The test is mechanical and worth running on any scale in the file: **take the top bucket, walk the
underlying quantity to its real maximum, and measure the spread of the thing the player actually
cares about inside it.** If the spread inside one bucket is comparable to the spread across all
the others, the scale is upside down — it is spending its resolution where nothing is at stake.
Here the three words below 66 covered 0 points between them and the one above covered 83.

Two cautions from doing it. Average the walk: `genOpponent` varies kit and traits, so a single
opponent per step had the quote at mean 78 reading 86% in one run and 50% in another, and the
first version of the check tripped its own bar on that noise. And do not read a 0-point span in
the low buckets as a fault — those words describe the man, not the match-up, and against a weaker
house they separate properly.

## A prefix hides everything behind it, and a queue only loses one thing

Two systems in this game hand the player instructions, and they fail in different ways. `LESSONS`
is a QUEUE: one note per tab per week, and a note whose window shuts is one note lost. `CHARTER`
is a PREFIX: `charterWeek` walks forward and stops at the first step that is not done, so a step
a house cannot finish costs every step behind it AND the year-end reward. When auditing a system
that dispenses guidance, find out which shape it is first — it decides what a single fault costs,
and therefore how hard to look.

The charter's version was two steps arguing. Step two recommends first blood, which is right;
first blood ends AT the wound, so it never reaches a crux; step ten needs a crux. Measured at 250
pit bouts a stake: 0.0% / 53.2% / 67.8% across blood, surrender and sine. Neither step is wrong
on its own, and no amount of reading either one finds it — only fighting 250 bouts at each stake
and counting does.

And the corollary for `done` clauses generally: **an escape clause is a second definition of the
thing, and it will do most of the work.** Step ten's was `activeG(d).some(g => (g.memory||[]).length
> 0)`, which sounds like "he has been through something with you" and is in fact written by
`remember(d, g, "hurt")` the first time one of your own is carried off. Ten houses out of ten
passed the step about sparing a beaten man by having a man wounded. When a gate has an OR in it,
measure which side actually fires.

## A key the game does not have is a key the game silently forgives

`newGameState(name, scen, seed, pitch)` ends `const S = SCENARIOS[scen] || SCENARIOS.clean`.
Nothing throws, nothing warns, and the log says whatever `name` you passed — so a check
sweeping the five openings with `["clean","even","uncle","onegood","oldguard"]` builds
A Clean Start five times and reports five openings. The real keys are `clean, inherited,
champion, veterans, castoffs`. `lessons` shipped that way and spent two releases asserting
"no lesson is dead on arrival in any opening" over one opening; give it the true keys and it
fails on the first house, because three of the five hand you more than three men and the note
about the slaver's block was `done` at exactly that.

The general shape: **a permissive fallback turns a typo into a silent loss of coverage, and
the check goes green either way.** Two defences, both cheap. Take the domain off the handle
rather than writing it out — `SC_KEYS` is there now for this reason — and where a check
enumerates something, print what it enumerated *with a distinguishing figure per case*. This
one would have been visible for two releases if it had printed each opening's men and coin:
five identical rows of `3 men / 800d` is not something you read past.

And it is worth knowing what those four unseen openings contain, because two of them are the
only states in the game that open certain doors: `inherited` starts with `buildings:{carceres:1}`,
which is the only week-one state that opens `staff`'s door, and `champion` starts its one man on
6–10 wins, which is the only one that opens `signature`'s.

## Four faults in five will be the probe's, and this is what that looks like over one session

The rule at the top of this file is that more findings turn out to be faults in the probe than
faults in the game. The `lessons` work is a clean record of it: five rounds of probe, and the
first four each died of a fault of mine.

- **Round one** wrote `d.book.n = 30` to open a lesson gated on the record book. `d.book` is
  **null** on a fresh house — the book is built by the first bout — so the builder threw and
  three windows were reported "shut" that are not. Its reader also topped out at week 84 with
  3–22 bouts against a gate wanting 25.
- **Round two** set `g.form` to an array of week records. `formOf(g)` reads a **number**.
- **Round two** also called `makeGames(d)` on week 1. The card is `CALENDAR.find(f => f.w ===
  yearWeek(d))`, so it only exists on a festival week; two lessons gated on a live card looked
  unreachable.
- **Round four** gave each action its own `d.gold = 60000` so it could be afforded, and then
  reported that eleven unrelated actions had retired the lesson about the lenders — whose exit
  is 1,200 denarii in the box. It also counted the queue in front of a lesson in a **fresh**
  house, which is the wrong state for a lesson whose door opens in week 14.
- **Round five's** eight-week hold test set every man to the post each week, which is precisely
  what un-does the action it was testing — so a real finding disappeared and I nearly took the
  disappearance as a refutation.

Only round six was measuring the game. Two habits shortened each cycle: **print the state you
built, not just the verdict** (`when=false done=false` next to the builder's own error string is
what caught `d.book` being null), and when a result looks extreme, **check the probe's own numbers
first** — "3 to 22 bouts" was on the screen for two rounds before I read it as the reason `book`
was unreachable rather than evidence about the game.

## When a check cries wolf, price the bar before you hunt the bug

`survive` scored 3, 3, 4, 2 and then 1 of 5 standing houses across one session, and the
1 failed. Its comment predicted 3.5. Thirteen of twenty-five is 52% against 70%, a 4.4%
event if 70% is true, so the honest reading was "go and look". Two hours of looking found
nothing wrong with the game and two things worth keeping.

**Ask "has it moved" with a fixed policy across builds, not with the check.** 200 houses
on one handle policy returned 72 standing, 36.0%, with identical endings on four builds
from v2.5x to v2.68.0. *Identical* is the useful part: when nothing relevant changes the
RNG stream doesn't diverge either, so the answer is not "within noise", it is "no path a
new house executes differs". That is a two-minute, unambiguous regression test, and it is
strictly stronger than re-running the noisy check and squinting.

**Then re-bootstrap the bar with the check's OWN policy.** Pooling four runs gave 13 of 20
= 65%, s.e. 10.7 — the original 70% inside the interval, measured the same way (n=20) and
therefore just as imprecise. The failure was the false failure the bar exists to tolerate:

    true rate        70%    65%    55%    50%
    runs that fail   3.1%   5.7%  13.1%  18.8%     (5 houses, floor of 2)

A bar you cannot state the false-failure rate of is a bar you will eventually go bug-hunting
behind. Write the table into the check.

And a caution about the imitation: my handle policy reported 57.5% of houses running out of
MEN against 6.5% running out of coin, median six buried in 26 weeks. It took every offer
including sine missione. That is a mortality measurement wearing an economy measurement's
name, and it is why four builds agreed to the house — mortality had not changed. It could
answer "did anything move" and could not answer "is the opening too hard". **When you
imitate a check's policy in memory, say which question the imitation can still answer.**

## A median over twenty houses is not a measurement

The balance reference was re-measured because v2.64.0 had found that no probe here ever
set a man's training focus, and two of that table's rows had been used to refute audit
items. Three training policies, twenty houses each, run twice on different seeds. The
table survived — but the useful result was about the instrument, and it is the most
expensive thing in this file to learn late.

**Within a single arm, between two batches of twenty**, Rome letters went 4 → 28,
primacy weeks 0 → 159, titles taken 0 → 11. The between-batch spread for one policy
dwarfed the between-policy spread inside either batch. Every arm-to-arm difference I
thought I could see at n=8 evaporated at n=20 and reversed sign between batches.

The lifespan distribution is why, and it is not a bell curve:

```
10 16 23 25 27 52 59 62 63 65 70 72 89 137 156 189 401 401 401 401
```

A spike of houses dying inside ninety weeks, then a handful that run to the cap. Of
twenty houses, **four to seven ever reach week 150, and four to seven reach week 258** —
the week the table's own late-game row names. So every figure about the fourth wing,
about Rome, about the primacy is generated by four to seven houses however large the
header says the sample is.

Three habits out of it:

- **Print the whole spread, not the median.** A median of 63 over that list says almost
  nothing, and it reads like a summary. One line of raw numbers would have stopped two
  wrong readings.
- **State the effective n for the era you are measuring**, not the number of houses you
  started. "20 houses" and "4 houses that lived long enough to see this" are different
  claims and only the second one is true of a late-game figure.
- **Two batches or it is not a result.** This project's notes already said never conclude
  from one run, and the reason had been about within-page RNG correlation. It is worse
  than that: two batches of *twenty houses each* disagreed on which of three policies was
  best. The n at which a house-level question becomes answerable is in the hundreds.

And the correction that came with it: v2.64.0 called weakest-stat pointing "trained" and
reported outcome figures off one batch. What survives is narrow — weakest-stat pointing
does reliably lift a man's MEAN (91.5 and 99 across the two batches), which is exactly
what that policy optimises and which these same batches show buys nothing at the house
level. Pointing at the class's own stats did *not* reliably lift the mean (94.4 and 88.4
against 86.7 and 88.6 for never pointing anybody).

Worth admitting: the first draft of the changelog for this very release quoted the 94.4
on its own as evidence, which is the single-batch overclaim it was written to document.
Two numbers per arm, always — one of them is how you catch yourself.

## Driving a screen is a skill, and four faults in five will be yours

`sand` was the first check to render a bout. Getting there took six failed attempts and
then five more faults inside the check itself — and only one of the five was the game's.
Every one is a shape that will recur:

- **A class is not a role.** The arena tab's own CHOOSE A BOUT is a `btn-blood`, exactly
  like the wizard's SEND HIM TO THE SAND. A driver reaching for "the blood button"
  closes the wizard it just opened. Act inside the topmost `.modalwrap`, and make every
  helper *return what it pressed* so the log says `→ SEND MALCHUS TO THE BEAST` instead
  of `clicked something`.
- **Two lists can wear the same clothes.** The pits offer the men at the rope as
  `.optrow`, the same element as your own roster, so "pick one row" spends itself on the
  wrong list and the send button never comes alive. Don't encode which list is which —
  **ask the screen**: press the send if it's live, else advance, else choose one more.
  That loop drove all five paths and knows nothing about any of them.
- **The picture is not the same in every mode.** The melee cannot draw two fighters;
  there are up to six, so it names them as tags and strikes them through. A flat
  "somebody is drawn" assertion failed on the one engine where the picture is a list.
- **Compressing time breaks the rules time was enforcing.** Five bouts through one
  week's screens is five bouts a house would spread over five weeks; the roster was
  spent by the fourth and the wizard offered an empty list. Stand the state back up
  between passes, and say in a comment that that is what the weeks between them do.
- **"Nothing happened" is a shrug, not a finding.** Three of these hid behind the same
  useless message. When a driver gets stuck it must print what was on the screen —
  every button, its class, and whether it was disabled. That one change turned two
  guessing rounds into one look.

And the fixture's *shape* was chance: the bill is drawn every third week and one run
offered three singles and a hunt where the next offered a pair and a melee, so coverage
moved run to run while the report said nothing about it. Draw until the bill holds the
most kinds it can, deal the roster on purpose so each engine has somebody eligible, then
**demand every kind you drew**. A check that asks for "at least two" quietly becomes
"the pits, once" the week something breaks, and reports a pass.

## A clipped element renders perfectly happily

Four truncations were reported off one phone screen: a house called "House Glaber" as
"House Glaber…", a lanista's line stopping at "who bought i", a fame of 23,703 as
"237…", and the masthead's house title as "The Measure of the Tr…". Every one came
from two CSS classes carrying `white-space:nowrap` with `text-overflow:ellipsis`, and
one of them from a `max-width:64%` inside a flex row sized by its own content — a
percentage cap resolving against a box that has not been sized yet, which clipped the
number to about forty pixels with empty space beside it.

None of it was visible to a check, because **there is no error in a cut-off word.**
The layout is valid, nothing throws, the pass column is green. But the browser knows:
an element whose `scrollWidth` exceeds its `clientWidth` is hiding part of itself. That
is the whole test, it costs one pass per screen, and it applies to every screen at
once. Deliberately scrollable strips opt out with `data-scrolls`.

The harder half was **coverage**, and it is the more useful lesson. `surface` measured
six tabs of a house twelve WEEKS old: short names, three-digit numbers, one face per
tab, and not one record sheet ever opened. The new test found nothing there — and put
the old CSS back and it still found nothing, because a young house clips nothing. So:

- **grow the state to the size a long game reaches before measuring it.** The report
  came from year twelve with fame 23,703. A check whose fixture is always a new house
  can only ever find bugs that a new house has.
- **walk every face.** Three tabs mount one of several at a time; the villa keeps
  nineteen of its twenty-three sections behind chips. Six screens became ten.
- **open the sheets.** The league table is a modal behind a section, and no check had
  ever opened one — which is exactly where two of the four truncations were.

With all three, putting the old CSS back names both reported symptoms exactly. And the
extension immediately found two faults nobody had reported: a 25px control on the tab
face `surface` had never visited, and — from the one screen still uncovered — a
`<button>` returned without a `key` from four `.map`s on the bout wizard, warned about
by React on every render and caught only because a scratch probe drove a bout. **No
check renders a bout in a browser**: `card` and `engines` drive the engines in memory,
`sweep` opens the wizard's first step and stops. That is the next gap.

## Every check drives the engine. None of them read the screen.

Thirty-five lessons, six tabs, one lesson shown per tab per week, each with a `done`
window that closes it. That is a QUEUE with expiry, and a queue with expiry loses
things three ways — all three of which had happened and none of which any pass
column could show:

- **Dead on arrival.** `armory` ("Steel and Style") tested `Object.keys(d.gear).length
  > 0`, and all five openings hand you a rack of two or three weapons. Done in week 1,
  in every scenario the game has.
- **Door behind exit.** `wear` opened on a man *wearing* bought steel and closed on
  `gearCond` having an entry — which buying writes instantly. Driven through fresh →
  bought → equipped, `when` was never true while `done` was false.
- **Queue-starved.** `scout` was eligible in 12 weeks across twelve houses and offered
  in **0**, because it was only open while the lesson in front of it was open, and the
  week after you read that one it was already done.

The general lesson: **a lesson's exit must be the thing the lesson is about, and it
must be reachable strictly after its door.** Owning bought steel, having seen a piece
come back worn, having paid to have a man looked over. Anything else and the starting
state or the queue closes it for you.

Two instrument notes worth keeping, because both nearly produced a wrong finding:

- **A reader who never reads pins the queue.** `lessonFor` returns the first *unlearned*
  lesson, so a probe that never sets `flags.learned` holds every tab at its head for
  ever and reports 26 of 35 as unreachable. Model the most attentive player possible —
  reads every lesson on every tab every week — because a lesson that player cannot
  reach genuinely cannot be reached.
- **A zero can mean the house was dead.** The first run of this reported eighteen
  lessons never offered; the house had died at week 21. Aggregate over houses, count a
  lesson reached if *any* of them saw it, and print the longest life next to the zero so
  it can never silently mean "no weeks" again.

And one about the agenda, which nothing had ever read as a beginner meets it: the four
things `survive`'s policy must do are all named early — buy a man at median week 1, set
the week's work at 1, take a bout at 2, watch the cells at 3 — so the game does teach
itself, and that premise was worth disproving before touching anything. What was wrong
was rank: "Nobody in this yard can teach" stood in **354 of 354** first-hour weeks at
urgency 2, and **a permanent item ranked "answer this" is furniture, not a priority.**
Gating it on affordability moved 100.0% to 98.9% — the wrong hypothesis, measured and
dropped — because the house *can* afford one nearly every week. Lowering its rank after
the first half-year moved loud items from 3.57 a week to 2.94, and crowded weeks from
81.1% to 58.8%.

## The one that was wrong in every probe for twenty releases: set the focus

`REGIMENS.palus` is `focus:true`. It trains **whatever you point him at and nothing
else** — `targets[g.focus] = D.rate`, one stat, once a week. Every probe in this
project's history called `setRegimenOf(d, id, "palus")` and never called
`setFocusOf`, so every man in every long-run measurement ground the same one of six
stats for his entire career. Exactly one check has ever pointed anybody: `actions`,
and only to prove the action exists.

What that did to the answers, same seeds, same policy, one line added:

| | never pointed | pointed at his weakest stat |
|---|---|---|
| best man's mean stat | 79 | 84.9 |
| weeks the player holds the Primus | 0.00% | 2.98% |
| reigns past the challenge's 6-week wait | 0 | 16 |
| the primacy challenge asked | **0** | **2** |
| best win chance on a title card, max | 14.6% | 56.8% |

The finding this produced — *v2.56.0 shipped a channel for a state the player cannot
reach* — was **refuted by the probe that produced it**. And the diagnosis one step
before that was worse: measuring a man's ceiling with an unpointed focus gave 58.3
against the city's best at 99, a "1.7× structural gap" in the rival growth model that
would have justified retuning the hardest bout in the game. Pointed at his weakest
stat each week, a young man with a doctore and a full yard reaches mean **99 by week
149 aged 28** — the same ceiling, gap **0.0**.

So: **a probe that trains men must set the focus, and a probe that does not is
measuring a house nobody plays.** More generally — when a subsystem takes a target as
well as a mode, the mode is the half you will remember to set and the target is the
half that decides whether anything happens.

## A check that reports what it opened is not reporting what it missed

`sweep` opens every tab and every collapsible on it and asks only whether rendering
threw. Three tabs are split into **faces** by their own switchers — `vView` on the
villa (four), `mView` on the familia (two), `gView` on a man's page — and only one
face is mounted at a time. `sweep` clicked the tab, opened what was in the DOM, and
reported `villa (+4 sections)`. The villa has **23**. That line reads like coverage
and was 17% of one tab, and it passed for many releases.

What came through the hole: `VOW_BLESS_AT`, read to colour the vow panel and declared
nowhere — one occurrence in the source, one in the built bundle, no binding in front
of either. Any house with a vow standing that opened the temple got
`ReferenceError: VOW_BLESS_AT is not defined` inside the render and no screen at all.
The temple is in the villa's *Standing* face.

And the reason no other check caught it is worth having by heart: **`temple` had the
vow and no screen; `sweep` had the screen and no vow.** Both passed. A crash lives
very comfortably in the gap between a logic check that never renders and a render
check that never sets up the state. When you split a subsystem across two checks, ask
which state only the renderer can see and which screen only the logic check can
construct — that intersection is where things ship broken.

Two habits out of it. Walk every face, not every tab. And **say what you did not
reach**: a count per face, so a collapse from nineteen sections back to four is a
visible regression instead of a still-passing check.

The same day, the same fault in the small: after the courting line's copy was
relabelled, the census matching on `/better than anybody you own/` reported **0.0%**
where the real rate was 13.0%. **A census that matches on copy breaks the week the
copy changes, and it breaks silently, downward, into a number that looks like a
success.** Match on something the copy cannot move — an id, a key, an urgency — or
assert that the match found anything at all.

And its cousin: **a check that carries its own copy of a dial goes stale the week the
dial moves.** `temple` built "a month of hard cards" as a literal 5, chosen when
`VOW_EARNT_AT` was 2. The bar moved to 6 and the literal silently became *one card
short of the bar* — so the check failed and reported the game as broken rather than
itself. It reads `A.VOW_EARNT_AT` now, and tests the bar, one under it, and nothing.

## Three things the harness knows that cost a day each to learn

- **Autosave is debounced 500ms.** Read the slot straight after a change and you get
  the state before it. `waitSaved(p)` waits past the debounce.
- **The gatekeeper's teaching panels and the opening guide are not `.modalwrap`.**
  They sit in front of everything until answered and cannot be dismissed by clicking
  the backdrop. `clearAll(p)` knows their words.
- **Overlays do not stack in DOM order.** The one in front is the one with the
  highest computed z-index. `top(p)` sorts before it looks — the digest-over-answer
  bug was invisible until it did.

## Three that read the source, not the screen

`layers`, `bulk` and part of `saves` never open a browser tab in anger — they read
`src/ludus.jsx` and the migration tables directly. That is deliberate: both guard
against bugs that are invisible on screen until two things happen to coincide. An
overlay ordering only goes wrong when both overlays are open at once; a forgotten
backfill only bites the one player whose save is old enough to be missing it.

`saves` builds a save, strips it back to what older versions actually carried —
seven vintages, down to a ver-1 save holding seven keys and men holding ten — and
checks that each comes out with nothing missing, nothing NaN, plays a week, and
does not change again if migrated twice.

## On the numbers in `engines`

The seeded RNG correlates draws within a page load, so an identical run swings about
two and a half points at n=1500. The bands are wide on purpose and assert direction
rather than targets — an even mirror should sit *below* fifty because `FOE_EDGE` puts
the editor's thumb on the scale deliberately. The one figure pinned to a range is the
ceiling, because that one was chosen out loud: 60% for a maxed man with a perfect read.

If a band starts crying wolf, widen it or assert the property instead of the number.
A check nobody trusts is worse than no check.

## A check that finds a fault one run in six is not holding it

`sand` reported the pit row's second line cut off with 24px hidden. Then five solo runs passed, and
a probe that drove the pits leg on its own six times never reproduced it. The check was real and the
fault was real, but the check only sees the fault when chance deals a long class name to a long house
name — so it would have gone green through any release that made this worse.

The fix is not a better driver, it is a different kind of assertion. Stop driving the game and hoping
the bad case turns up; **compose the widest content the space allows and force it in.** The longest
class, the longest house name, a record in double figures, a kill count, the longest name against the
longest nick — all read off the game's own tables, because a name the check invents proves nothing
about the game. Then the assertion is deterministic and the bar is the content space rather than the
draw. `room`'s first draft sampled 300 generated men for the longest name and got a different answer
every run, which is the same fault one level in: a probe deciding its own bar by chance.

Two figures to keep from this. A width estimated by arithmetic on the viewport is a guess — 175px
turned into a 6.6% claim about the name line that driving it refuted. A width read off the element is
a measurement. And a clip count of zero must not be able to pass by absence: once the fix removed the
bounded spans there was nothing left to measure, so the check also asserts the whole of both lines is
*on* the panel.

## A scale that gets a longer word narrows every row it shares

v2.71.0 gave the menace scale two more bands, because one word had covered mean 66 to 99 — a quote of
96% down to 13%. That was right. What nothing priced is that the word it added is **Murderous at
53px** where the old top word was **Lethal at 31px**, and that word sits at the right of a row with
`flexShrink:0` — so it takes its width out of the span beside it. With the narrowest word on the
right, 0 of 1,800 pit rows are cut off. With the widest, 110 are.

So a release spent on a scale's *resolution* silently spent 22px of a *layout*, two releases apart,
and no check connected them because the scale checks measure words and the layout checks measure
pixels. `room` forces the widest content and the widest word together for exactly this reason. The
general shape: when a bounded span shares a row with text that comes from a word table, the table's
longest word is part of that span's budget — and the next release to lengthen the table will not
think of the row.

## A line that quotes a number must quote the number the button reads

Four of the ten proximity lines in #109 were wrong, and three of the four failed the same way: the
sentence and the control beside it were measuring different quantities.

- The paragon panel said *"You have 2,488 in the box"* and then computed its shortfall against the
  box **plus** every debt owed to you at face **plus** the steel on the racks at half price. With
  16,200d of steel on the racks the shortfall came out zero, so the sentence named nothing missing
  and the button underneath stayed dead. 12.8% of played house-weeks past week 20 sat in that window.
- The munus panel had one sentence for a refusal with four causes. Three of them the panel could
  see; the fourth — standing on the imperial sand — fell through to the cooldown wording and read
  *"0 weeks before you can put on games again."*
- The monuments' closed line had one sentence for two gates, and named the tier above its own.

The habit: when you write a line that quotes a proximity, find the branch that actually decides and
read the same expression. If you cannot, the line is describing something else and should say what.
And the assertion that holds it is not "the number is right" — it is **the number the line quotes
and the number the gate reads are the same expression**. That is checkable without a browser, which
is why `near` is a fast check.

The fourth fault was different and worth its own note: `feastReach` returns a fraction clamped 0.65
to 1, and `Math.round` of it is 1 for every house that can exist. A fraction rendered as a count is
not a wrong number, it is a number that cannot vary — so the tell is not "is it right" but **does it
ever change**. The check asks the feast line at three house sizes and fails if all three agree.

## A decomposition is only pinned over a space wide enough for a new term to bite

`near` asserts that the munus is refused for exactly the four reasons its panel has words for — so
that a fifth condition added later fails the check instead of silently landing in the wrong sentence.
The first draft asserted it over seven hand-listed states. Every one of them had a quiet yard, so a
condition injected on unrest to prove the check could fail slipped through **7 of 7**: the check
passed on the broken build.

It runs the cross product now — away-state × cooldown × unrest × coin, 181 states — and catches the
same injection at 169 of 181. The lesson is not about unrest. It is that an invariant of the form
"X is exactly these N things" needs its test states to vary everything an N+1th thing might plausibly
read, or the test is a spot check wearing a proof's clothing. Always inject the fault you are
guarding against and watch the check go red; a green on a broken build is the only way to find out
the states were too narrow.

## A probe that never fights is not a policy, it is the idle arm wearing a name

The sweep behind #110 ran four policies — careful, middling, careless, idle — and measured **zero bouts
in every arm over every house.** It only looked at `d.games.offers`, and the arena's bill is not there
every week; the rope is what fills the rest, and the arms never touched it. So four policies were the
idle arm under four names, and the ending table they produced was about nothing at all.

The tell was in the report and I nearly walked past it: `median bouts 0`. Every arm summary should carry
the thing that makes the arm an arm. If a policy's defining action has a count, print the count, because
a policy that silently does nothing looks exactly like a policy that works.

Two more of the same family followed. A wrong building key threw inside `try/catch` every week the
careful arm had coin — aborting the rest of its week, bout included — and four arms then died inside a
year while the table said it was the economy: **a probe that swallows its own throws reports them as the
game's behaviour**, so count them and print them. And the invented "careful" policy turned out to be no
better than doing nothing (median 26 weeks against idle's 31) because it bought `market[0]`, the top of
the block — which `survive` already has written down as the mistake that ended three houses in debt with
men still in the yard. **Before inventing a policy, read the one the suite already tuned.**

## Which half of a measurement is stable is itself a measurement

Two runs of 100 houses each gave the ending MIX to within two points — debt 69% and 67%, the careless
arm's ruin 40% and 40%, the opening's ledger share 80% and 78%. The same two runs gave LIFESPAN medians
of 36 weeks and 20 weeks for the identical policy.

So one half of that sweep is a fact and the other half is noise at n=20, and a check that pinned both
would fail roughly every other run for no reason. `ends` asserts the mix and merely prints the gradient.
Run every measurement twice before deciding which numbers are allowed to be bars — not to confirm them,
but to find out which ones move.

## "No amount of bad luck produces this" is a claim, and it can be falsified by a diff

`survive` fails when both its bars are weak at once — few houses standing AND few men between them —
and its comment says that is the only thing it can detect, because "a gutted opening drives BOTH to
the floor at once" and no amount of bad luck produces it on a healthy build.

In v2.76.0 it produced exactly that: **1 of 5 standing, 3 men.** And `src/ludus.jsx` in that build was
byte-identical to the parent that had just passed it — `git diff <parent> -- src/ludus.jsx` was empty,
because the release added a check file and three documents. Three more runs of that same build: 4/5
with 7 men, 2/5 with 10, 4/5 with 7. So the bar trips on luck at something like one run in four.

Two things worth keeping. The first is the diagnostic: **when a stochastic check fails, diff the game
code before anything else.** An empty diff against a green parent is the strongest possible evidence
that the check moved rather than the game, and it costs one command — far cheaper than the four
browser runs it took to confirm the same thing by sampling.

The second is what NOT to do next. The bar was left alone. Loosening a threshold in the same breath as
its failure is how a check stops being trusted, and four samples is how the bad bar got set the first
time; the measurement that would justify a new threshold is ten or more runs of an unchanged build, and
that is a job rather than a nudge. Record the failure, prove it was not the game, and leave the number
for a release whose whole subject is the number.

## A fix that changes no measurement is telling you something

#111 read `recordCloth`, found no `addRep` in it, and concluded that the game's central act of mercy —
throwing the cloth, calling the handlers off a hunt, letting both men of a pair up — paid nothing
toward the name Capua gives the house. The fix was one line. It was written, built, and measured
against the run before it.

**The numbers were identical: 1,277 of 1,296 weeks either way.** Because the award already existed,
one layer down, at the point the cloth is *resolved* rather than *recorded* — and because mercy was
already saturating, so a duplicate award changed nothing observable. Had the arm been weaker, the
duplicate would have shipped and looked like it worked.

So: **when a fix moves no measurement, do not conclude that it is harmless.** Two possibilities, and
they are opposites. Either the thing was not broken — go and find the code that already does it — or
the measurement cannot see the thing you changed, in which case you have no evidence either way and
should not ship. The one conclusion never available is "it does no harm, leave it in".

## "Ever reached" is a much weaker bar than "held", and usually the wrong one

`chair` asserts that each of the four reputation names is earnable. The first version asked whether a
house going after a name was *ever* called it. Removing the eight points a cloth pays still passed
that bar in 6 of 6 houses — the three points a spared man pays, plus the doctrine's one-off eighteen,
were enough to touch the name once.

Held share caught it immediately: 184 weeks of 426 against craft's 181, which is a coin-flip and not a
name, where every intact arm holds its own name for 91% to 100% of its named weeks. For anything the
player is meant to *be* rather than to have momentarily touched, assert the share of time, and get the
headroom from the intact build before choosing the threshold.

## Concentration is a variable, and a sweep that spreads its samples measures the wrong ceiling

#113 sampled warmth toward rival houses 2,310 times over 6 houses and 160 weeks and found it capped at
43.4, so two of the four words looked like dead content. Every one of those samples came from a probe
using the game's own opponent picker, which chooses from **all** the rivals by band. So the probe met
six houses a little each.

The scale is not fed by samples, it is fed by *meetings with one house* — 1.1 each, and eight once-only
beats gated at `met>=6`, `10`, `14`, `22`, `26`. Spread across six rivals nobody reaches those numbers;
concentrated on one, warmth hits the 100 cap and the median peak is 76.8.

So before reporting a ceiling, ask what the quantity actually accumulates against, and whether the probe
is accumulating it or dividing it six ways. A large sample of the wrong shape is not evidence — and the
tell was available in the source the whole time, in the gate values themselves. **`met>=26` is a design
telling you the arc expects a rivalry, not an acquaintance.** When a gate names a big count, the question
is not "did my sample reach it" but "was my sample even the kind of thing that could".

## n=8 is enough to see a difference and not enough to name it

Removing the `d.pendingEvent` guard from `rivalArc` — a guard that protects nothing, since the function
only writes a chronicle line — moved median peak warmth from **39.7 to 55.9** across eight houses. That
is a word boundary: "civil" to "on good terms". It was very nearly written up as one.

At twenty houses the same comparison reads **76.8 against 100**: both arms are already deep into the top
two words, the guard is worth about 15% of the beats and a delay to the last one, and the boundary claim
evaporates. The medians at n=8 were not wrong about the *direction* — they were wrong about where both
arms sat, which is the only thing that made the claim interesting.

The habit: when a comparison is about to become a finding, raise n before writing it, not after. And
remember that a code change reorders the RNG stream, so the two arms are never a paired comparison
however identical the seeds look — which is exactly why the small-n medians moved so far.

## `gearCond` is the shelf, and four ways to get wear wrong

Wear was the single worst instrument in the audit so far: four separate faults, each of which changed
a headline number, and every one of them looked like a finding about the game first.

**Read the field the thing actually lives in.** `d.gearCond[id]` is a POOL OF PIECES ON THE SHELF.
`buyGearItem` pushes 100 into it and `equipOne` splices that number straight back out when the piece
goes on a man, so a pool sampled during play is dominated by spoils off dead opponents, which enter at
`ri(55,85)`. The reported range of "56 to 74, never keen" was that distribution and nothing else. A
worn piece's condition lives in `g.wear[slot]`. Before sampling a quantity, find the write that
produces the number you want and check you are reading its destination.

**A function that returns early mutates nothing.** `doFight` returns at `res.unfinished` — the crux —
BEFORE it calls `wearKit`, because the bout is being held for the box to speak. 41% to 82% of bouts
reach the balance. A probe that does not answer measures a bout that never happened: no wear, no
purse, no fatigue. Worse, the crux rate is highest at sine missione, so the arm meant to wear steel
FASTEST wore it least and that read as a finding about hard wear running backwards. Any check that
calls `doFight` and does not loop on `r.crux` is measuring a fraction of what it thinks.

**Identity of an id is not identity of a thing.** My break detector watched for a slot that was under
30 and is now a different piece. It undercounted by 60% — 11 against 28 — because a break re-arms the
man from the rack with ANOTHER COPY OF THE SAME GEAR ID. When the game writes a line for an event,
count the line.

**An arm that cannot afford its own setup is another arm wearing its name.** The armamentarium
comparison ran `buildUp` on a fresh house's purse, so only level 1 was ever affordable and the L2 and
L4 arms were the L1 arm. The tell was three runs printing the same 1,036 bouts and the same two
breaks. Assert the state you set up — `steel` now reads `bLevel` back and fails if it is not what was
asked for.

## Forcing a man fit is a bench; forcing him alive is fiction

The first bench for the wear rate fought real bouts back to back with the week never turned, and got 3
bouts before every man was dead. An earlier scratch version of the same setup got 25 — but only
because it never checked `g.status` and was cheerfully fighting a corpse, which is where a confident
"a weapon breaks at 25 bouts" figure came from.

Zeroing fatigue between bouts is a bench: it removes a rate limiter and says so. Ignoring death is
not a bench, it is a state the game cannot reach, and any number taken from it is about nothing.

The fix was to drive the unit instead of the scene: `wearKit` is what a bout calls, and it holds the
`WEAR_RATE` draw, the named-piece halving, the perks and the break branch. Called directly, the rate,
the five words and the break are all exact and the check runs in a fraction of the time. Then prove
SEPARATELY, in a played house, that real bouts reach the unit at all — which is the half a bench
cannot do and the half that catches a rope that never gets to the sand.

## A constant validated against itself holds nothing

The decay section of `bay` measured how far a town's memory of a house fell over 40 idle weeks and
compared it against `BAY_DECAY * 40`. It passed. It also passed a build with `BAY_DECAY` set to **0**,
where no town ever forgets anybody, because both sides of the comparison were nought and agreed
perfectly.

A rate needs TWO bars: the observed movement against the constant, *and* the constant against zero.
The first says the arithmetic is wired up; only the second says the system exists. Any assertion of the
form `observed ≈ CONST * n` inherits whatever `CONST` happens to be, including nothing — so ask, before
writing it, what this line does if the constant is deleted.

## Two policies are not one policy and one variable

Two arms drove the bay mechanic: a touring house and a homebound one. Between them they covered
everything except the one branch that matters most — the reward. The tourist never idled the 30 weeks
needed for a rival to take the bay, so it measured that 0 times in 8 houses; the homebody had it taken
in 8 of 10 and never travelled, so it never saw it given back. Neither arm was wrong. They simply
differed in more than one way at once, and the uncovered branch sat in the gap.

When arms are whole policies, the space between them is invisible. Name the variable, hold the rest
fixed, and then ask which combination of settings no arm actually visits — that is where the untested
branch is.

## Before blaming the thing you are measuring, run your own policy without it

The tour probe put 7 of 8 houses out by rebellion between weeks 17 and 100 and it looked like a savage
price on leaving Capua. The same policy that never left Capua rebelled 7 of 10. The same policy WITH
the feast and walking the cells rebelled 6 of 10 whether it toured or not, and lived twice as long
either way — and the touring houses outlived the homebound ones in both pairs.

The probe was not measuring travel. It was measuring a manager who never went down to the cells. When a
sweep produces a dramatic ending, the first arm to write is the same policy with the suspect feature
removed — and if you cannot remove it, the same policy with the levers a real player would pull. This
is the third time in this audit that a probe's own neglect has been mistaken for a cost the game
imposes, so it belongs in the standing checklist and not just in one release note.

## Fix the instrument, then expect the findings to move

#116 put a rope in the harness — one that answers the balance to exhaustion — and routed the three
checks that had never answered it through that. Both of the numbers those checks had published then
changed, and they changed in **opposite directions**, which is the part worth keeping.

`ends` had read 13 of 24 houses out in the opening at a median 272 denarii UNDER, and the conclusion
drawn from it was that the ledger is the competent player's only enemy. It was an arm that fought hard
and was paid for two afternoons in five. Resolved, it reads **6 of 24 out at +506d, debt 3 / rebellion
3**: playing well halves the opening's lethality, and the cells kill a played house as often as the
ledger does.

`houses` moved the other way, and its own header had predicted the mechanism: real bouts raise the
rival's grudge, and warmth only accumulates while the grudge is under 30. Two of five houses stopped
warming and rebelled. With the rope *and* the unrest levers, the figure went from 76.8 to **100** —
the item it was written to refute is refuted harder.

The habit: when you fix an instrument, re-read every number that instrument produced, and expect some
of them to get *better* and some to get *worse*. A correction that moves everything the same way is
usually a second fault, not a fix.

## A lint that flags mostly-correct code is worse than no lint

`probe` shipped with one rule and nearly shipped with two. The second flagged any check that looked
for bouts in `d.games.offers` without a pit fallback — the exact fault that had held two probes to
2-5 bouts in 90 weeks. It flagged eight checks and seven of them were right: their subject IS the
bill, or they build houses famous enough to have one, or they fall through to a town's card instead.

One true positive against seven false ones does not teach care, it teaches the reflex of adding an
exception. The rule became a reported line, and the fault it was aimed at is caught instead by making
the rope the only sanctioned way to take a bout — a rule with no false positives at all.

The corollary for the ALLOWED table: every entry has to carry the reason it is not the fault being
hunted, in words specific to that check. `feats` answers every crux with the cloth, which ends the
bout, so there is no second word to speak — that is an exception. "This one is fine" is not.

## A detector that knows one calling convention is the fault it is hunting

`probe`'s first version required a `(` after the engine name and reported that 7 of the suite's checks
drive a bout. The real figure was 19: the dominant style here passes the engine as a REFERENCE —
`fin(A.doFight, [d, …])` — so the paren belongs to the wrapper. Its second version read the whole file
for a `while`, which cleared files holding a rope in one place and a one-shot in another, and flagged
files whose one-shot was a cloth that ends the bout.

Both were the same mistake the tool exists to catch: measuring the shape you expected instead of the
shape that is there. Before trusting a source-level detector, print what it found and read the list
against the thing itself — 7 against 19 was visible in one `grep`.

## Answering every question the same way is not a control

Two sweeps — the published five-policy table and my re-run of it — answered the week's one question
with choice 0 every time, and both called that a control on the grounds that it was identical in every
arm. Identical is not neutral.

On `uprising`, the one event that can end a run, choice 0 is *"Meet them with steel"* — the only branch
that sets `d.over = rebellion`. Choice 1 sends for the magistrate's guards for 300 denarii and adds 80
to the house's side of the roll. Choice 2 opens the gates and cannot end the run at all. So "answer 0
always" is not holding a variable fixed; it is choosing the lethal option a hundred and twenty times
and then measuring how often houses die.

Answering it the way a solvent player would took the `proven` arm from a median life of **54 weeks to
183** and its rebellion share from **70% to 40%**, and turned `lanistaDied` into the plurality ending.
I had a headline about the cells being the real killer of a competent house, at 55-84% of endings,
before running that arm.

The habit: before treating an answer policy as a control, read what the choices actually DO. If any of
them can end the run, or costs money, or changes a roll, then the answer policy is one of your
variables and has to be varied like one — and reported like one.

## The ledger stops mattering the moment the bouts get paid

Worth writing down as a fact about this game and not just about probes. Across six policies and 400
weeks, debt is 24-27% of endings and 95-100% of that belongs to the arm that does nothing at all. Every
arm that fights reads 0-24%, and the arm that fights every week to the death reads **0% on every run**.

A resolved bout pays a purse. The old table's "debt is 60-90% of every playing policy" was measuring
arms that fought hard and were paid for two afternoons in five. When a sweep reports that a system is
starving, check first whether the sweep is feeding it.
