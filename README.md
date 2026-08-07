# LVDVS — Blood & Sand

A gladiator ludus management sim. You are a lanista in Capua: buy men, train them,
send them to the sand, climb the standings past the houses of Solonius, Vettius, and
Tullius — and mind the fire in your cells, because the best fighter you will ever own
is also the one who might burn your house down.

## Play

Open `index.html` in any modern browser. That's it — React and all code are bundled
inside the file. Saves are kept automatically in your browser's localStorage.

## Features

- Weekly management loop: training focus, fatigue, morale, injuries, upkeep
- Equipment: 29 weapons, shields, helms and armour with real stats (attack, guard,
  speed, crowd appeal), bought from the Armory and equipped per gladiator. What a man
  wears is what you see him fight in — dual-wield twin blades render two swords,
  a scutum renders a tower shield, a bare-headed retiarius shows his face
- Six fighting styles including the Dimachaerus, who fights with a blade in each hand.
  Gear outside a man's own style still works, but clumsily
- Round-by-round fight ticker with class counters, tactics, crowd meter, and missio
- Three persistent rival houses whose fighters grow, hold grudges, and die for good
- Rematches, bribed editors, sabotage, street feuds
- Parties for favor and fame; feasts for loyalty
- The rebellion arc: Whispers -> Stolen Steel -> The Night of Fire, with three endings
  (crush it, buy the guards, or open the gates and loose a Spartacus on Italy)
- The rudis: long, famed careers can end in freedom instead of death

## Rebuild from source

```
npm install
npm run build
```

`src/ludus.jsx` is the whole game (single React component, default export). It also
runs as-is as a Claude artifact, where saves use the artifact storage API instead.

## Check it before you ship it

```
npm test              every check
npm test book         just that one
npm run coverage      what no check ever touches
```

Each check drives a real browser against a real build: five houses live thirty weeks,
the fight engines keep their shape, the record book sees every bout, a question and its
answer are never split, no type falls under the scale, nothing throws when opened.
Takes a few minutes. See `test/README.md` — every check is a bug that shipped once,
and the comment at the top of each file says which.

## Structure

- `index.html` — the playable, self-contained build
- `src/ludus.jsx` — game data, engine, and UI
- `src/main.jsx` — mount point
- `build.js` — bundles and inlines everything into index.html; `--test` writes an
  instrumented `dist/test.html` instead, which never ships
- `test/` — the checks, and a harness that knows where the game hides things
