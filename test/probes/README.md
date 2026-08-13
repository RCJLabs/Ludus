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
    node test/probes/scroll.mjs 16         # week to measure the screens at

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
