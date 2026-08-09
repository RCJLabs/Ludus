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
| `lessons` | fast | thirty-five lessons, one per tab per week, each with an expiry window — so a queue, and sixteen of them could not be reached by any player: "Steel and Style" was `done` in week 1 of all five openings because every one hands you a rack, "Steel Does Not Last" closed on an event that had to happen before it could open, and between them the armory tab offered a new house nothing at all |
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
Those are covered now; sixty functions still are not, and the list is printed every
time so it stays a fact rather than a feeling.

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
