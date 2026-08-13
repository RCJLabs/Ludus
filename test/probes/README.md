# Probes

These are **not** part of the suite. `test/run.mjs` discovers `test/checks/*.mjs` only, so nothing in here
runs on a release. They are measurement instruments, kept because they cost more to get right than to
write, and because the wrong version of each one produced a confident, wrong answer first.

Run them straight:

    node test/probes/late.mjs 10 420       # houses, weeks
    node test/probes/silent.mjs 10 420
    node test/probes/primacy.mjs 10 420
    node test/probes/scroll.mjs 16         # week to measure the screens at

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

**`scroll.mjs`** — where the vertical pixels go, per place, as the page ARRIVES versus with every fold
thrown open. The second is what `reach` necessarily measures and it is 40% taller than the first.

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

Before anything is built on this, run it against a reference player that does not tour.
