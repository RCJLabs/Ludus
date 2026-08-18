# Probes

These are **not** part of the suite. `test/run.mjs` discovers `test/checks/*.mjs` only, so nothing in here
runs on a release. They are measurement instruments, kept because they cost more to get right than to
write, and because the wrong version of each one produced a confident, wrong answer first.

Run them straight:

    node test/probes/late.mjs 10 420       # houses, weeks
    node test/probes/silent.mjs 10 420
    node test/probes/primacy.mjs 10 420
    node test/probes/road.mjs 10 420       # where the reference house is standing
    node test/probes/estate.mjs 10 420     # what a great house owns; add `on miser` for the saving arm
    node test/probes/quiet.mjs 10 420      # the week's shape, and the fast-forward button
    node test/probes/handle.mjs            # player actions no check can reach (no houses to play)
    node test/probes/dark.mjs 8 320        # and whether those actions ever open, and ever do anything
    node test/probes/nemesis.mjs 10 420    # #134; add `silent` for the arm that never replies
    node test/probes/season.mjs 24 40 bench # seeds, tail, and `bench` to keep the trainee off the card
    node test/probes/coast.mjs 24 320      # #133; controlled pairs, stay-at-home vs tour-and-return
    node test/probes/scroll.mjs 16         # week to measure the screens at
    node test/probes/keep.mjs 72 420 SEED  # what a house HOLDS — gains against losses, by era
    node test/probes/walk.mjs 72 420 180 SEED   # can a great house lose the people in it
    node test/probes/fires.mjs 24 420      # does v3.27.0's patron death ever fire in real play
    node test/probes/catalogue.mjs 72 420 SEED  # the acquirable catalogue, counted — #138's instrument
    node test/probes/yard.mjs 72 420 SEED  # true arrivals/exits with causes, and the buy gate
    node test/probes/named.mjs 72 420 SEED # the fighter-nemesis: how an episode actually ends
    node test/probes/ghost.mjs 12 300 SEED # who clears d.nemesis, caught by a setter trap — #137
    node test/probes/scen.mjs 24 420 SEED [default|reckless|neglect|bare]  # the five foundings
    node test/probes/sink.mjs 24 420 SEED  # #138: does a works-buying rope finish the tier? paired
    node test/probes/open.mjs                     # #142: the opening on a fixed policy — diff the SIG across builds
    node test/probes/perk.mjs 16 420 SEED         # #140: what each work is worth GRANTED FREE
    node test/probes/perk.mjs 16 420 SEED hot     # #141: and for a house that neglects unrest
    node test/probes/catalogue.mjs 72 420 SEED on   # the census with the works step switched on
    node test/probes/kit.mjs 40 KIT       # #149: the steel ledger, the forged piece, and the four dark doors
    node test/probes/quiet2.mjs 12 320 GAM  # #150: runGambit's nulls split by its own guards, and the panel's odds
    node test/probes/rung.mjs 16 700 RUNG   # #151: the census ladder's four terms, split, plus a free-grant bound
    node test/probes/finish.mjs 24 900 SEED # #147: nine arms, one per ending, and the RUINS gates split by term
    node test/probes/succ.mjs 30 1400 SEED [grant]  # #147: the second generation, with and without a free ledger

`keep`, `walk` and `fires` run in about 25 seconds at 72 houses, which is cheap enough that **they take
a seed prefix and should always be run on three or four of them.** Two findings died this session for
being read off 24 houses on one seed, and one of them was a MAXIMUM. If a figure moves between seeds it
is not a finding, and the probe should print it as unstable rather than let it be quoted.

`late`, `primacy` and `road` take a third argument, `on` or `off`, which is the reference player's
`road` option: `on` tours and comes home, `off` never leaves Capua. Everything measured before
v3.21.0 was taken on a player that could do neither — see below.

A probe prints; it does not pass or fail. When a probe's finding is worth defending against future
changes, that is what a check in `test/checks/` is for — `seller` is the one this batch produced.

## What each one is for, and what it got wrong first

**`late.mjs`** — every agenda label stamped with the eras it is ever SHOWN in, sorted into early-only,
perennial and late-only. This is #131: 97.1% of what a year-12 house reads was available in week one.
Its first version reported the opposite (29% late-only) because `agKey` normalises digits and not names,
so every per-man line counted as fresh content each time the yard turned over. It now strips names
gathered off the house's own people. **Do not pattern-match capitals for this** — that eats Rome, Capua
and Pompeii.

**`keep.mjs`** — the same question as `late.mjs` from the other side: not what a great house is SHOWN
but what it HOLDS. Diffs the set of held things week against week, so every gain and every loss is
counted with its era and whether that exact thing came back — the instrument `estate.mjs` could not be,
since a snapshot cannot tell "never lost" from "lost and refilled before anybody looked". **It was
written under the name `late.mjs` and overwrote that probe**, which had to be recovered from git; the two
ask different questions and both are needed. Its own first draft read the late game at 47% losses, and
the raw table gave it away: **832 of 1,332 losses were `nemesis`**, with `rome` at 130 and `saga` at 100.
An arch-rival who comes and goes is not a possession, `d.rome` is a TRIP, a saga is a story — so the
inventory splits ESTATE / CONTESTED / EPISODE now. Second fault, same probe: "how much of what was lost
came back" falls with the era for a reason that is not the game, since a thing lost in week 400 of a
house ending at 420 has twenty weeks to return. It carries the weeks each house had left and reports the
raw and the fair rate side by side — late reads 49% raw and 62% fair.

**`walk.mjs`** — whether a great house can lose the PEOPLE in it, and the answer is that it already
could. Refuted its own item before a week was played, by reading the file first: there is no unrest-90
gate anywhere, the medicus door is OR'd with a policy the player chooses, and the armourer door is pure
insolvency. Counts each door's OPEN WEEKS before counting fires, because a door that never opens and a
door that opens constantly while the roll never lands are different findings that a fire count cannot
separate. Also measures what replacement COSTS without needing a rare event: `makeStaff` charges
`rnd(skill*5+40)` over `ri(32,56)`/`ri(48,76)` and that formula has no term for the house's wealth, so
the ratio reads on every late-solvent week. Two faults in its first draft were mine — `great` was defined
as late AND SOLVENT and the table then reported the debt doors open on 0.00% of great-house weeks, which
is the definition read back; and losses were nearly counted off the chronicle, which rolls.

**`fires.mjs`** — does the content v3.27.0 shipped ever actually fire? `patron` hand-builds its state,
setting `lanista.age` to `PATRON_AGE + 5`, so it would pass identically if the gate were unreachable in
play — content proved correct on a hand-built save and never observed on a played one is this project's
standing hazard in one sentence. 9 of the 10 houses that reach the gate see a patron die; the 38% is the
survival rate, not the gate. Counts firings off `d.flags.patronDied` rather than the chronicle, which
rolls at `LOG_ROLL` and would undercount by an amount that GROWS WITH THE LENGTH OF THE RUN. **Run this
against any new late-game content before believing a check that passes on a hand-built save.**
From v3.30.0 it asks the same question of the fire (`d.flags.roomBurned`), and it finally takes the
seed prefix the first version only claimed to: three prefixes read a floor burned in 2 / 4 / 6 of 24
houses, 12 of the 16 whose estate ever reached the 8-level bar — the constraint is estate size, which
is the gate doing what it is for, and the under-building it reads is the same fact #138 measured.

**`catalogue.mjs`** — the acquirable catalogue read off the game's own tables (71 keys: room levels,
works and monuments, feats, staff seats, household, doctrine/collegium/aedile/heir/wife, patron slots,
census rungs), and per house: the week its LAST new item arrived, the drought after it, and what was
never held, with prices. It settled the "out of things to buy" seam by refuting it as stated — a late
house dies holding about half the catalogue, and everything it never holds is either the works tier
(no rope step exists — #138) or priced past its peak gold. Its two designed-in guards: the headline is
quoted only off houses past 300 weeks, because a last-acquisition week is censored by the death week;
and every remaining key prints with its listed price against the house's peak gold, so "nothing left
to buy" and "nothing left it could pay for" cannot be conflated.

**`yard.mjs`** — why the yard shrinks, and it does not. keep.mjs's men row diffs the ACTIVE set, so
every injury books a departure and a return, and a man who dies hurt books a departure with no return
— which is the whole of the "net-losing men" seam. This counts true arrivals (new ids) against the
game's own GONE statuses on the same houses and reads net POSITIVE in every era, all four seeds. It
also reads the rope's buy gate every week it would want a man, split cap / empty stall / unaffordable,
because a fire count cannot separate doors — the walk.mjs lesson. The gate sample is taken before
`R.lanista` runs, so its "affordable" is an upper bound; the buys are counted off the roster diff.

**`named.mjs`** — the fighter-nemesis (`d.nemesis`, not #134's `d.nemHouse`), and how an episode ends
as the player sees it: on the sand (the designed payoff), told by a chronicle line, or silence. Its
first version never closed an episode — `cur` survived the push, so one finished episode was re-booked
every following week, 8,057 "episodes" at one per 1.5 weeks against keep.mjs's one per 16 — and the
raw sample table is what caught it: the same man, the same since-week, an end-week counting up by one.
Its second version could not attribute 539 endings at all, which is what `ghost.mjs` is for.

**`ghost.mjs`** — the attribution `named.mjs` could not make, made by trapping the write:
`Object.defineProperty(d, "nemesis", {set})` with a stack capture names the clearing function, and the
fid is searched everywhere at that instant. The lesson it leaves: when a weekly diff cannot attribute
a transition, trap the assignment — most nemesis episodes turned out to be born and unmade INSIDE one
week, invisible to any diff taken at week boundaries. What it found is #137: circuit-born nemeses are
unmade the same week by a house lookup that only knows the five rivals.

**`scen.mjs`** — the five foundings, finally compared on an outcome. Reads its keys off `SC_KEYS`
(a wrong key silently becomes `clean` — the lessons fault) and prints each scenario's week-one men and
coin so five identical rows cannot be read past. At 24 houses a seed, median lifespans swing by 2x
between seeds, so nothing is quoted unless the SIGN holds on all three: champion opening gentlest and
inherited harshest both did; every other difference drowned. The tags carry the verdict: "Hard" is
measured hard, and "Fragile" is measured the safest opening in the game.

**`open.mjs`** — the opening on a fixed policy over 60 headless houses, and the answer to "has it
moved". Its point is that when nothing relevant changes the SIGNATURE is identical rather than merely
close, which is a stronger statement than "within noise": v3.33.0's `survive` failure was settled by
running this on v3.32.0 and v3.33.0 and getting the same week, men, gold and ending house for house.
It also measured the thing #142 turned on — `survive`'s `standing` reading is nearly inert (39 of 60
clean, 44 with the weekly bill tripled, 39 with opening gold cut to 150, 40 with purses at 30%) while
`men` responds (128 / 123 / 94 / 104). **The lever that taught the most was the one that did nothing:**
tripling the weekly bill was chosen as a "gutting" and is not one, because at 26 weeks a house has
3-5 men and no buildings and its bill is ~30-40d. A null result from a lever that does not move the
thing you are testing says nothing about the check — suspect the lever before the instrument.

**`perk.mjs`** — what a work is worth when it costs NOTHING, which is how #140 was settled without a
policy arm, and then how #141 was REFUTED for the chapel by its `hot` arm. Two lessons live in it.
**First: measure the ENDING, not the outcome.** Fame and lifespan are downstream of everything, so a
coin flip there can always be argued away as noise swamping a real effect — and for four releases it
was. The chapel's job is unrest, unrest's job is the rebellion arc, and a rebellion is a NAMED way to
die: counted that way the chapel takes 24 deaths of 64 down to 8, on four seeds, where the fame
column had read a flat coin flip. **Second: an arm that is hot for the wrong reason answers a
different question.** The first `hot` was `cells:false` plus sine stakes — unrest 40.6, which looked
right, and lifespan 40 weeks, because those houses were dying of an empty yard. No perk saves a house
losing men that fast, so its null said nothing. Both arms are kept, with that written over them.
Also: **the baths read 6→1 on one seed and 5→6, 6→6, 7→2 on the other three** — recorded so nobody
ever quotes the first one. Its clause asked for a fame-maximising player; granting each work free at week one bounds
every purchasing policy that could ever exist from above, so a perk that does not pay here cannot pay
bought. It found the item's stated mechanism wrong — the perks deliver their tables exactly (the
school's +3/wk over ~210 weeks predicts +630 and measured +631, the instrument proving itself) — and
the item's premise right for a different reason: four of the five are coin flips on fame and lifespan
even free, because they move quantities the house's fate does not read. **The habit worth keeping:
when an item blames a price, test the free version first; it separates "this costs too much" from
"this is not worth anything", and only the second one makes repricing pointless.** Granting at week
one is deliberately generous and is stated as such — a real house gets its first work around week 200.

**`scen.mjs`** — the five foundings compared on an outcome. It reads its keys off `SC_KEYS` (a wrong
key silently becomes `clean`) and prints each scenario's week-one men and coin so five identical rows
cannot be read past. From v3.35 it takes a POLICY arm and tracks the founding man, because #139 —
"the opening tagged Fragile is the safest in the game" — died on both: champion is third of five on
the current build (58 of 72 against clean's 60 and veterans' 63), and its rank swings 1st/1st/mid/last
across `default`/`bare`/`neglect`/`reckless`. **The lesson is about the BOARD, not the probe:** the
finding was true when measured at v3.27.0 and six releases shipped before anyone acted on it. Re-run
an item's measurement before building it. The legend tracker exists because the scenario's blurb makes
a claim — "it can die on any given afternoon" — which is true (median week 13, 24 of 24) while the
implication is not (24 of 24 houses outlived him, by ~146 weeks).

**`sink.mjs`** — #138's paired instrument: same seed twice, identical but for the rope's opt-in
`works` step, control first, compared at the last common week. Its finding closed the item the
falsifying way — the works-buying house is poorer and shorter-lived on all three seeds, finishes the
five-work tier in 2 of 72 pairs, and never begins a monument — and its control arm found the stale
agenda gate (the sink's one hint asking the full price where the door opens at the deposit, 12-15%
against 57-62%). What its first version got wrong was the POLICY, not the probe: commissioning at
`spare() > deposit` ignored that the mason's draw outranks the player's own spending inside
`worksWeek`, and the arm it measured was a house bleeding to death, not a house buying stone. The
reserve now counts running draws; the probe was right both times and the difference between the two
runs is the lesson.

**`silent.mjs`** — for each late system, a predicate for LIVE taken off the game's own functions, then
whether the agenda named it and whether a `SECT_MARK` fired. This is #132's survey. Five of its predicates
were wrong before the table read true; each fault is commented at the line that carries it. The habit that
caught two of them is the one to keep: **it prints the commonest labels seen while an unmatched system was
live**, so a regex that misses the real wording is visible instead of silently confirming what you
expected.

**`primacy.mjs`** — the one system `silent.mjs` could not clear, measured against the game's own gate
including the `fame >= TIERS[2].fame` term that the survey omitted.

**`road.mjs`** — where the reference house is physically standing, week by week, and whether a
departure was ever matched by a return. Written to test a code-read, and the code-read held: the
rope had no travel step and `comeHome` has one caller in the whole game, a UI button, so the
reference player emigrated. It counts TRANSITIONS rather than weeks-away, because a house three
hundred weeks into an emigration and a house on its fourth week of a tour both read "on the coast".

**`estate.mjs`** — what a year-12 house owns that a week-one house does not: every quantity in both
eras off the same houses, sorted by ratio, plus which systems are switched on. Written to give #131's
design decision some raw material instead of a blank page. It does NOT claim anything is silent —
#132 is what that costs. Two faults in its first pass, both caught by the printed raw material rather
than by re-reading the code: `d.book.bouts` does not exist (the count is `d.book.n`), so it read 0
bouts against a rope reporting 1,851; and its house snapshots were taken after the loop, which is the
state at DEATH — three houses with 0 men and -2,910d, labelled "at the wall". It also carries a
`miser` arm, because "the house is short of coin" is a claim about the player's spending until you
have run one that does not spend. **A zero in both columns is the rope's policy, not the game's
content** — it never saves a kit, builds a work, or frees a man.

**`quiet.mjs`** — how many weeks the game calls quiet, which is the only gate on "Let it run". Written
to test a specific claim: that one dead man past the six-week rites window retired that button for the
rest of the run. It did — the term fired on 95.6% of house-weeks and every house's last quiet week
fell inside its first 13. Fixed in v3.22.0 and `quiet` (the check) holds it. **Its counterfactual
column inverted when the fix landed** and had to be turned round to reconstruct the OLD load from the
new code; left as it was it silently drifted below the truth. A probe that measures a fault needs
deciding, at the time it is written, what it should say once the fault is gone.

**`handle.mjs`** — every function the UI calls inside a `mut(d => …)` closure, differenced against
the live handle. Static, so it plays no houses. It found nineteen off the handle and sixteen
reachable by a click and by nothing else — the fifth instance of the fault that produced
`setOut`/`comeHome`, `nameHeir`, `makeMarket` and `holdMunera`. Two things it got wrong first: it
counted "off the handle" as one condition, when three of the nineteen are also called by the weekly
code and so were being exercised anyway; and **it matched its own documentation** — the note added to
`src/ludus.jsx` explaining the sweep contains the words `mut(d => …)`, so the closure count went 101
to 102 the moment the instrument was written up, and the balancer parsed prose. Comments are stripped
first now. The rule it enforces lives in `actions` as a derived list; this probe is the readable
version with the raw material printed under it.

**`dark.mjs`** — drives all nineteen actions v3.23.0 exposed and asks two different questions per
action: how often the game's OWN readiness gate is open, and whether calling it on a clone changes
the save. The two disagree in both directions and both disagreements are findings — never open but
always works is content the player never meets; often open and inert is a button that does nothing.
Result: nothing throws, five never open, and four of those five are the rope not borrowing, not
saving kits and not starting seasons. Its own weakest rows are the ones where the game has no gate
and the probe had to invent one — `clearWatch` reads 93% open and 11% effective purely because
"a man exists" is not a gate. Where the game HAS a gate it is called, never reconstructed.

**`nemesis.mjs`** — #134, and the design worth copying. `nemCanCallOut` is a CONJUNCTION of five
terms, so "the gate never opened" says nothing about which one is holding and the fix depends
entirely on that. It counts each term separately, and the pairs, the way `census` splits its four
gates. Two things make it trustworthy: it cross-checks its own reading of the gate against the game's
own `nemCanCallOut` and prints both (66 against 66, and 0 against 0 — if they ever diverge, the
reading is wrong), and it runs a `silent` arm so "the edge is never positive" can be attributed to
the player rather than the game.

It refuted the item AND its premise: heat and edge hold together on 27.2% of nemesis weeks, because
the −3 per answer is swamped by +1.4 a week of drift I had not read.

**And it caught two bad rope steps before the good one, which is the part to remember.** Answering
whenever affordable spent 202 times and broke `policy`'s buildings bar; answering only from surplus
above the build threshold spent 7 times and never got ahead. Both were the same fault — a policy on a
timer — and the fix was a policy with a reason (`nemEdge < 1`: answer until you are ahead, then use
it), not a threshold tuned until the output looked right. **If you find yourself adjusting a constant
because the number came out wrong, that is this mistake.**

**`season.mjs`** — the five long training arcs, which no measurement in this project had ever run.
A CONTROLLED PAIR rather than a policy arm: two houses from the same seed, identical but for one man
put on a season, control run first so it cannot inherit RNG state (`styles` paid two releases for
that lesson), pairs discarded and counted if the two men do not start identical.

**Its first version asked the wrong question and its own output said so.** It compared stats after
the season's advertised length — and `still on` came back 20 to 23 of 24 with `finished` at 0 to 3,
because `planWeek` only advances while the man is `active`. The advertised length is a floor, so the
comparison was measuring a season still in flight against a control that had drilled freely
throughout. It also called a column `alive` while testing `status === "active"`, which counts an
injured man as dead. Both are why it now runs to completion or death and reports the calendar cost.

**And it drops pairs rather than zeroing them:** a dead man's stat total is not a training result.

**The `bench` arm is what settled it.** 14 to 21 of 24 men died before the payout — but the probe puts
the season on `activeG(d)[0]` and the rope fights its best man every week, so the trainee was the one
on the sand. `bench` (a rope option, applied to BOTH sides of the pair) keeps him off the card:
2 to 6 die instead, and every season then takes exactly its advertised length. Both halves of the
finding belonged to the bout policy. **A confound named at the time and settled by one arm is the
cheapest thing in this directory — the alternative was publishing "seasons kill men" and being
wrong.**

**`coast.mjs`** — #133, and it refuted the item I had opened. The first pass compared three
whole-house POLICY arms on lifespans across different seeds and read the touring house as
shortest-lived. Paired properly — same seed twice, identical but for `road`, control first — the
touring house is richer in 10 of 12 pairs and lives longer too.

**The line that made the difference: it excludes pairs where the tour never happened.** A house tours
only if `bayCall` fires, so in half the seeds both arms are the same house doing the same things.
Averaging those in dilutes any effect toward zero while looking like twice the data. They are counted
and dropped. It also compares at the last week BOTH were still playing rather than at a fixed
horizon, because a dead house's gold answers a different question.

**`scen.mjs`, extended for #148** — the item asked whether the openings' 35-point survival spread is
carried by what the player is told, and what he is told is one word each. Three of those five words
describe a SHAPE rather than a difficulty, so each became a measurement:

* *"A closing window"* — when does the founding roster actually go? Reported on the **median**
  founding man as well as the last, because the last one is an order statistic and the rosters run
  from one man to six: `inherited` has six to `veterans`' four, so a naive "when are they all gone"
  favours it for arithmetic reasons alone. On the median the answer is unambiguous — a veteran lasts
  three to five times longer than anybody else's man, which is the opposite of the tag.
* *"Fragile"* — how long is a one-man house a one-man house? Seven weeks, on every seed and every
  policy. Worth stating plainly that this is a fact about the REFERENCE PLAYER, who buys: a player
  who declines to buy keeps the state. That is the honest reading and it is why the fix bounded the
  sentence ("until you put somebody in the next one") rather than deleting it.
* *"Volatile"* — the quartile spread of lives, because the median is precisely the statistic that
  cannot show what the word means. It came back mixed and nothing was changed on it.

Run it under `reckless`, `neglect` and `bare` as well as `default` before quoting any of it — #139
was a finding that held on the reference player and flipped on the others, and this probe's header
carries that lesson. Both surviving claims here hold under all four.

**`rung.mjs`** — #151, and the third conjunction-split in this directory after `nemesis` and `finish`.
`canClaimRise` wants fame, favour, coin held and a full standing meter, and `riseNeed(d)` hands all
four back as booleans, so the probe reconstructs nothing: it reads the game's own four every week
against whatever rung the house is reaching for, and counts which one is missing when the other three
hold. The answer is unambiguous — coin is the last term standing on 96-100% of one-short weeks from
rung 3 up, and favour appears in no one-short row at any rung in any arm that entertains.

**#154 came back to it and the clause named its own arm.** The top rung wants 80,000 held at the same
moment as favour 90, and no arm held both because `hostParty` fires whenever spare allows — so the
missing policy was "entertain on a CYCLE": table off in the rope, hosted only when favour slips below
92, everything else banked. It is the best census policy measured (median rung 5, rung 6 in 5 of 16),
and it holds both requirements at once for **13 weeks in one house of forty-eight** — so the clause
falsified, barely.

The part worth copying is what the probe did NEXT. "Read a worth instead of the box" is only a repair
if some version of it clears the bar, so the candidate definitions were built up ONE TERM AT A TIME —
box, +debts, +racks at half, +men, +stone — and each was asked the same question and priced off the
game's own tables. Four of the five change nothing; only the stone moves anything, and it moves it by
about one rung. **Price every term of a proposed fix before writing the fix**, and the design call
makes itself.

**Its real work was disproving another probe.** #151 was opened on `estate`'s `miser` arm reporting
72,752d held and the house "blocked on FAVOUR". `miser` is `{build:false, rites:false, party:false}`,
and the table is the favour engine — the rope's own note prices it at mean rung 2.70 against 1.50. So
`banker` here is the same arm with the table left ON, and it reaches Known in Rome in 3-5 houses of 16
where `miser` reaches it in 0-1. **When an arm turns something off to isolate a variable, check that
what it turned off is not the variable.**

It also carries a `granted` arm — coin topped to 200,000 a week — because "is it the coin" can only be
answered from above: a house that cannot run out reaches the top rung 14 times in 16, and every
remaining wait at every rung is the standing meter. That is what turns "rung 7 is unreached" from a
complaint into a measurement of what rung 7 costs.

**`quiet2.mjs`** — #150, and the shape for any "this function returns null a lot" item. A count of
nulls is not a finding; the split is. `runGambit` has exactly four ways out before it does anything,
so the probe re-tests the game's own guards immediately before each call, IN THE ORDER THE FUNCTION
TESTS THEM, and then asserts the call agreed — 2,106 of 2,106 across three seeds, which is what makes
the split quotable. It also reads coin on both sides of every null, because the item's headline
("a third of PAID attempts do nothing") was a claim about spending and deserved to be measured rather
than argued from the source.

Its second half is the useful one: having established the nulls were all the price, it went on to
check what the panel SAYS, and found it quoting `gambitDone` where the engine rolls `gambitStale` —
990 wrong rows of 6,448, wrong in the same direction every time. **Ask what the screen says as well
as what the function returns; a system can be perfectly correct and still lie.**

One thing to copy: it reconstructs `dark`'s own gating in a second arm, so the item's original 348-of-
1,100 could be compared like for like instead of against a number taken a different way.

**`kit.mjs`** — #149 and #152. The clearest example in this directory of why a control arm goes first, The
steel economy has a conservation law — for anything that wears, `d.gear[id]` equals what men are
carrying plus what the rack lists in `d.gearCond[id]` — and `equipOne` is the path the whole game is
built around, so it runs before anything else. **It failed the first version of the audit**, three
kinds out of balance, and the law was wrong rather than the code: `buyGearItem` pushes a `gearCond`
entry for every purchase and `equipOne` only draws one down for steel that WEARS, so house issue
accumulates entries nobody spends. Filtered to `wears`, the control balances and the arms under it
became readable — and `applyKit` was three of a piece owned, three worn, two still on the rack.

Two more faults came out of the same drive, and neither is a count: `applyKit` and `armFromRack` both
took a man's forged, named piece, against the forging's own line and against `equipOne`'s explicit
refusal; and `condOf` scored every candidate for a slot at the wear of the piece already in it, so
forty passes of the "arm him off the rack" button over a rack of fourteen bought kinds ended with none
of them worn by anybody. That last one was found by the ledger arm coming back BALANCED — every kind
reading `0w`, which is not a clean bill of health, it is an arm that never moved any bought steel. The
per-id ledger is printed even when it balances for exactly that reason.

**#152 came back to it for the break path**, and the conservation law paid for itself a second time:
a piece that snapped at the tang never left `d.gear`, so the house went on owning it, the armoury went
on charging rent for it, and once every copy had broken a man could still be armed with one at
condition 100 out of a rack that held none. The arm drives a real break — condition to 1, then
`wearKit` until the kit changes — and uses the game's own "finally goes" chronicle line as the witness,
because `steel`'s head records that a hand-rolled break detector undercounts by 60%.

**Its third fixture was wrong the same way as the first two.** The arm originally asked "can another
man be armed with the piece that just broke" while the house still owned two more of that kind, so
"HE GETS IT" proved nothing at all. It breaks every copy first now and then asks. Three fixtures, one
mistake: a test whose subject was never actually in question.

**Its own fixtures were wrong twice, and both were the same mistake** — a test whose subject never
moved. "`applyKit` left the named piece alone" was true only because the saved kit happened to want
the piece the man was already holding; "the book holds 6 of 12 saved kits" was `saveKit` deduping by
`cls · weapon` across six class names, which says nothing about the eight-kit cap. If an arm reports
that nothing happened, check that it asked for something to happen.

**`finish.mjs`** — #147, and the shape to copy when a count of outcomes is all you have. The item said
seven of the twelve endings never fire; a count cannot tell a gate the game will not open from a door
the reference player walks past, so this runs NINE arms, each the smallest deviation from the rope
that could reach one ending — borrow and never repay, free the earners then sell the rest, answer
`romeReturn` with its second door, decline the chair, name no heir, fight only sine. Four of the seven
fell out immediately (`foreclosed` 22-24 of 24 at week 26, deterministically; `oldAge` 2 of 24;
`triumph` 1 of 24), which refuted the item.

The part worth keeping is the RUINS half. Those three gates are three- and four-term conjunctions and
nothing had ever counted them, so — the `nemesis` design — each is asked of the game's own
`RUINS[k].need(d)` AND split by term beside it, with a "one short, and which one is missing" tally
under that. `disgrace` came back one term short for 301 weeks with the same term missing 301 times,
which is a fix; `ruined` came back one term short for 352-632 weeks in every arm, and a high-water
counterfactual (had the term EVER been true earlier in that house's life) read 0, which killed the
obvious repair before it was written.

**#153 came back to it for a tenth arm, `feud`, and that arm overturned a conclusion this same probe
had produced.** The RUINS split said `ruined` stood two-of-three for hundreds of weeks with the grudge
always missing, and I wrote that up as two halves belonging to different HOUSES. They belong to
different POLICIES: an arm that attacks one rival by every means the game offers — gambit, courting,
answering the arch-rival — drives the angriest rival to 98 while the house is at two men, satisfies the
gate on 36-46 weeks per seed, and ends there in 2 of 24 runs on all three. **A conjunction that never
co-occurs under the arms you happened to run is not a conjunction that cannot co-occur**, and the only
way to tell is an arm built to make it happen.

**Three instrument faults, two of them mine and one in the shared rope.** It was called `ends` first,
on a misreading of a handle comment as pointing at a deleted probe — it points at `test/checks/ends.mjs`,
which is alive and already answers three of the twelve; two files of that name would have put two
answers to one question in the suite. Its `hot` arm (`preferStakes:"sine"`) came back **byte-identical
to the reference player** over 24 houses and 4,000 weeks, which #136's rule says is impossible for a
live lever — a stakes census then showed the arena bill carrying 564 sine offers of 2,538, and the
fault was `lanista` collapsing every stakes option into a strict `wantStakes` so `preferStakes` never
reached `takeBout` at all. And see `succ` below for the third.

**`succ.mjs`** — the lanista's own clock, and whether the second generation is arithmetic or luck.
ARM A drives the game's `lanistaWeek` with no house on it, which is the kindest run the health number
can have; ARM B plays real houses with a free-grant lever so a gate that opens only for a house which
cannot go broke is legible as a survival problem rather than a gate fault. It is: a retirement
succession comes up in 5 of 90 ordinary houses and 22 of 30 solvent ones.

**Its first version had the fault this file exists to warn about.** ARM A advanced the age with
`A.WEEKS_PER_YEAR`, which is not on the handle — `x % undefined` is NaN, the age never moved, and all
twelve rows printed "he never got to 62" while ARM B beside them was reaching 62 in twenty-two houses
of thirty. Two arms of one probe disagreeing IS the alarm. It reads the year boundary off `yearOf`
now and prints the age each row actually ran to, so a frozen clock cannot pass as a healthy one.

**`scroll.mjs`** — where the vertical pixels go, per place, as the page ARRIVES versus with every fold
thrown open. The second is what `reach` necessarily measures and it is 40% taller than the first.

## The reference player could not come home, and it re-based everything

`primacy.mjs` (below) closed by blaming the reference player's touring. That explanation was right
about where the cards were and wrong about why, and the difference matters more than the item did.

**The rope never toured.** It emigrated. `R.lanista` had no travel step at all, and the only road out
of Capua a player is offered is the `bayCall` event — which the question step answered at its default
`i=0`, *"Take the road to <town>"*. Nothing brings a house back: `comeHome` has exactly one caller in
`src/ludus.jsx`, the UI button at line 18653, and no weekly phase touches it.

Measured, 10 houses × 420 weeks, before and after the step:

                                    before        after
    houses that ever left            5 of 10       5 of 10
    departures / returns             5 / 0         11 / 11
    longest single stay in one town  363w          7w
    all house-weeks spent away       54%           4%
    games weeks whose card was away  71%           8%

Five departures and zero returns. **Not one house in the project's history had ever come back.** This
is the `reSignOffer` shape from v3.20.0 exactly — a reference player standing in a doorway for years
— and it is the second time this specific stranding has been found: `roads` exists because the v2.46
audit lost two 12-house batches to it and published three confident wrong findings. That check has
passed every run since. It proved the round trip *could* be driven and never asked whether anyone was
driving it, which is now its last section.

**What this invalidates, and what it does not.** Any figure about where content appears, taken on a
long-running house, was taken partly from Puteoli. Re-measured on the corrected instrument:

- **#132 is refuted and closes.** Against a house that never leaves Capua, the primacy is offered on
  **49% of the weeks a card is up and 20% of every open week** (78 offers, 159 card weeks, 388 open
  weeks, 10 × 420). That is the file's own falsification clause — "the card carrying the offer on a
  decent share of open weeks … the item is refuted rather than built" — met. What survives is the
  narrow true part: no agenda line and no `SECT_MARK` key, on any horizon.
- **#131 survives, and is stronger for it.** Year 12+ reads **97.7% perennial / 2.3% late-only** on a
  stay-at-home house, against 96.5% / 3.5% on the emigrated one. The house being away was not the
  cause, which was the last cheap explanation available.

The habit this adds to the three below: **a reference player is an instrument, and a policy it cannot
execute is not a policy.** The tell was that a *state* persisted — 91% is not a rate a player chooses,
it is a rate something is stuck at. Ask of any policy step not just "would a good player do this" but
"can this player ever stop doing it".

## The `primacy.mjs` question, settled — and what it cost

The gap was real: 3% of open weeks at 10x420, 29% at 2x60, off the same probe. Three explanations were
tried and the first two were wrong, which is the usual ratio here.

    stale cards      REFUTED. d.games does persist, but a card is genuinely up on 70% of open weeks.
    activeG          REFUTED. The game gates on activeG(d) and the probe used d.gladiators; swapping to
                     the game's own predicate changed nothing at any of three horizons.
    the road         THIS ONE. Only Capua's own card builder carries the primus branch.

            2 x 60     20 card weeks,   0 on the road (0%),  15 offers -> 75% of Capua cards
            10 x 420  779 card weeks, 711 on the road (91%), 37 offers -> 54% of Capua cards

The primus offer fires on most Capua cards a qualifying house sees, which is what a flat `R()<0.6`
predicts. What falls away over a long run is how often the house is in Capua at all. **The headline was a
fact about the reference player's touring, not about the primacy.**

The general shape is worth keeping, because it is not the same mistake as the earlier ones: every
predicate was right and every channel was counted, and the number was still misleading because the
DENOMINATOR mixed two populations — weeks where the thing could happen and weeks where it structurally
could not. When a rate moves with the length of a run and the code that produces it does not, the
denominator is the first place to look.

**And the denominator had a cause, which this write-up got wrong.** "The reference lanista tours" was
itself a finding about the instrument, not about a policy — it could not come home. Run with
`road off`, the primacy is offered on 49% of card weeks and the item closes. See the section above.
