# The checks

```
npm test                  every check
npm test book modals      only those
npm test -- --keep        leave dist/test.html behind to poke at
```

Each check drives a real browser against a real build and reports what it found.
They take a few minutes; they are meant to be run before a release, not on every save.

## Why these exist

Every one of them is a bug that shipped. The comment at the top of each file says
which. That comment is the durable part — when the numbers inside go stale, the
reason the check exists usually has not.

| check | it exists because |
|---|---|
| `survive` | economy changes have twice bankrupted every opening without anyone noticing |
| `engines` | tactic and trait constants are 3–5× more powerful than they look, every time |
| `book` | the pair booked only its wins and the melee only its losses, for fifty versions |
| `modals` | the week's digest threw itself over the answer to the question you were just asked |
| `surface` | the tab bar was set in 9px and END WEEK was 37px tall |
| `sweep` | the cheap net: does anything throw when you open it |
| `layers` | 28 overlays with hand-written z-indices, and no way to see the order |
| `saves` | 165 lines of unordered backfills, and fifteen core fields that never had one |

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

## Writing one

Drop a module in `checks/`. The runner finds it.

```js
import { found, endWeek, clearAll, slot } from "../harness.mjs";

export const name = "cells";
export const describe = "the cells cap grows when you build";

export async function run({ p, errors }){
  await found(p);
  // ...
  return { pass: true, why: null, lines: ["what it saw"] };
}
```

`run` gets a live page, the errors it has thrown so far, and the port. Return
`{ pass, why, lines }` — `why` is printed only on failure, `lines` always.

## Three things the harness knows that cost a day each to learn

- **Autosave is debounced 500ms.** Read the slot straight after a change and you get
  the state before it. `waitSaved(p)` waits past the debounce.
- **The gatekeeper's teaching panels and the opening guide are not `.modalwrap`.**
  They sit in front of everything until answered and cannot be dismissed by clicking
  the backdrop. `clearAll(p)` knows their words.
- **Overlays do not stack in DOM order.** The one in front is the one with the
  highest computed z-index. `top(p)` sorts before it looks — the digest-over-answer
  bug was invisible until it did.

## Two that read the source, not the screen

`layers` and part of `saves` never open a browser tab in anger — they read
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
