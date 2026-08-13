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

## Open question on `primacy.mjs`, unresolved

The headline in #132 is that a primus offer reaches the card on **3% of open weeks**, measured at
10 houses x 420 weeks. Run at **2 houses x 60 weeks the same probe says 29%**, and that gap is not
explained. Two candidates, neither checked:

- `d.games` persists between games weeks — it carries its own `week` field — so `d.games.offers` may be
  reporting a STALE card in weeks that have no games at all. If so the 29% is nearer the truth and the
  3% is diluted by counting weeks where no card existed either way.
- long runs spend real time at Rome or travelling, where no card is up. The rope reports exactly this:
  `192 weeks refused (at Rome with no card up this week 110, ...)`.

**Settle this before building anything on the 3%.** The right form of the question is almost certainly
"of the open weeks in which a card exists at all, how many carry the offer" — which is a one-line change
to the probe (compare `d.games.week` to `d.week`) and changes what, if anything, is wrong.
