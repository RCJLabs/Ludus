# The checks

```
npm test                  the fast tier — about half a minute
npm run test:all          every check, fast and slow
npm run test:slow         only the ones that drive a browser
npm test book modals      only those, whatever tier they are in
npm test -- --keep        leave the test bundle behind to poke at
```

Every check runs against a real build. Most reach into the game through the test
handle, play a house for a hundred weeks in memory, and answer in a second or two.
Four drive a real browser through the real screens, and those cost minutes.

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
| `engines` | fast | tactic and trait constants are 3–5× more powerful than they look, every time |
| `book` | fast | the pair booked only its wins and the melee only its losses, for fifty versions |
| `modals` | slow | the week's digest threw itself over the answer to the question you were just asked |
| `surface` | slow | the tab bar was set in 9px and END WEEK was 37px tall |
| `sweep` | slow | the cheap net: does anything throw when you open it |
| `layers` | fast | 28 overlays with hand-written z-indices, and no way to see the order |
| `saves` | fast | 165 lines of unordered backfills, and fifteen core fields that never had one |
| `block` | fast | buying a man lived in a React closure, so nothing outside it could buy anybody |
| `counsel` | fast | the book had every figure and no way to say what they came to |
| `actions` | fast | fifty-eight more actions lived in that same closure, and one probe measured its own copy of the feast |
| `rope` | fast | the pit filled half the weeks and paid the same in year twelve as in year one |
| `table` | fast | the only lever against the only number that ends a run cost 120 denarii flat, forever |
| `street` | fast | acclaim climbed past the top of its ladder into nothing, and the missio never read it |
| `chronicle` | fast | one in five lines the chronicle ever wrote was the same weekly receipt |
| `marks` | fast | a man bought with an old wound carried a scar drawn at NaN,NaN for as long as you owned him |

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
