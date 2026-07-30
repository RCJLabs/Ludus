# LVDVS — Roadmap & State

Gladiator-school management sim. You are a lanista in Capua: buy men, train them, send them to the sand, climb the standings against three rival houses, and manage the fire in your own cells. Football-manager loop wrapped around an animated round-by-round arena battler, with permadeath and a three-stage rebellion arc.

**Stack:** React 18, single-file game, esbuild → one self-contained `index.html`. No framework, no router, no CSS lib. Runs identically as a Claude artifact and as a downloadable HTML file.

---

## Architecture

```
ludus/
  src/ludus.jsx      the entire game (~2,000 lines, default export <App/>)
  src/main.jsx       mount point, 4 lines
  build.js           esbuild bundle + window.storage shim → index.html
  index.html         built artifact, ~252 KB, fully self-contained
  package.json       version lives here
  ROADMAP.md         this file
  INSTRUCTIONS.md    how to work on it
```

`src/ludus.jsx` is divided by banner comments, in order:

| Section | Contains |
|---|---|
| *(top)* | `CSS` template string — all styling, including keyframes |
| `EQUIPMENT` | `GEAR`, `SLOTS`, `DEFAULT_KIT`, `FINE_OF`, `kitMods`, `kitArt`, `kitFor` |
| `HELPERS` | RNG shims, `chron`, generators, `migrate`, `newGameState` |
| `RIVAL HOUSES` | `RIVAL_SEED`, `makeRivalFighter`, `rivalWeekly`, `pickRivalOpp` |
| `FIGHT ENGINE` | `ATTACKS`, `TARGETS`, `power`, `simulateFight`, `doFight` |
| `EVENTS` | `EVENTS` table (14 entries), `pickEvent`, `updateRebellion` |
| `WEEK RESOLUTION` | `endWeek`, `grantRudis`, `makePitOffer` |
| `UI` | `Fighter`, `CrowdRow`, `HPBar`, `FightModal`, `GearStats`, `App` |

The headless test harness slices the file at the `/* ================= UI` marker, so **everything above that line must stay importable without React**.

---

## Core loop

One turn = one week.

1. Set each man's **training focus** (one of six stats, or rest).
2. Take **fights** — the pits are always open; the games run every 3rd week once fame ≥ 25.
3. Spend on **gear** (Armory), **favor** (parties), or **loyalty** (feasts).
4. Resolve a random **event** (~45%/week), then **End Week**: training gain, fatigue, morale drift, injury ticks, upkeep, rival simulation, unrest.

---

## Systems

### Gladiators
Six visible stats (`str agi end tec sho dis`), plus hidden `potential`, `heart` (missio only), and `defiance`. Seven origins with stat modifiers and name pools. Eight traits. Status: `active | injured | away | dead | freed | escaped | retired` — use `isGone(g)`, never a hand-rolled list. Roster cap **8**. Nickname awarded at **5 wins**.

### Aging (`WEEKS_PER_YEAR = 18`)
Generated 18–32. Prime is **23–28**. Training gain scales `ageTrain()` — ×1.3 at 18, ×1.0 in prime, ×0.72 to 31, ×0.42 after. Past 28 the *body* decays weekly at `(age−28) × 0.05`, weighted `agi 1.4 / end 1.2 / str 1.0`; **`tec`, `sho` and `dis` never decay** — a veteran loses the engine and keeps the craft. Market price and sale value scale `agePrice()` (×0.5 for a 33-year-old). Veterans generate with bonus `tec`/`dis`, reduced potential, and 0–3 scars already on them.

Measured over 72 weeks, all stats starting at 60, training strength:

| Start age | → | str | agi | end | tec |
|---|---|---|---|---|---|
| 20 | 24 | 98.8 | 60.0 | 60.0 | 60.0 |
| 28 | 32 | 98.6 | 52.4 | 53.5 | 60.0 |
| 32 | 36 | 76.0 | 32.3 | 36.2 | 60.0 |

### Scars
Injuries carry the `part` they came from. On healing there's a **45%** chance of a scar (**75%** if `pen ≥ 8`). Each scar marks the figure permanently and shaves the mapped stat (`brow→dis, shoulder/arm→str, hand→tec, thigh→agi, flank→end`): first scar on a part −1 and a −2 training ceiling, **every repeat on the same part −3 and −7 ceiling** (`statCap()`, capped at −34). Scarred men draw a bigger crowd (+1.2 initial per scar). `scarBurden()` totals the ceiling loss.

### Ambitions that speak
An ambition was a flag you had to go looking for. It is now a ladder a man walks up, and it has its own weekly roll (14%) rather than competing with nineteen other events for a slot.

**Silent → asked → pressed → despair.** Each of the seven ambitions has its own three lines. He raises it when it is on his mind — a hunt on the card triples the odds it is the man who fears beasts who speaks, a sine offer brings out the man who never wants one, the Ludi Romani four weeks out brings out the man who wants Rome.

> *"Mucapor wants a name on the card. A particular one. He touches the scar while he says it and does not notice he is doing it."*

Three answers, and none of them is free:

| | First asking | Asking again |
|---|---|---|
| **Give him your word** | +12 morale, −7 defiance, sets a promise | +4 only — you can both hear it is worth less |
| **Tell him no** | −6 morale | −14, and **breaks the promise on the spot** if you made one |
| **Say nothing** | −10 morale, +6 defiance | −18, +14, +3 unrest |

Twelve weeks after the second asking with nothing done, he **despairs**: −30 morale, +25 defiance, +7 unrest, and his brothers feel it. *"He has stopped asking about the rudis. He trains, he fights, and he has taken the number out of his head, which is worse than carrying it."*

**A promise changes the arithmetic at both ends.** Keeping one pays **+34 morale and −26 defiance** instead of +24/−18, and lifts every other man in the house by 4 — *"You gave him your word and then you kept it. That is not a thing the cells had a lot of evidence for."* Breaking one costs **−38 and +26**, ten unrest, and docks the whole yard 6 morale and 5 defiance, because they all know what you said. Meeting an ambition also pulls a man back out of despair.

### Gear wear and the armourer
Bought steel wears. **House stock does not** — it is maintained, that is what it is for, so the free racks stay a reliable fallback rather than a chore.

Every bout takes `WEAR_RATE` off each paid piece — weapon 3–6, offhand 2–5, helm 1–3, armor 2–4, half again at sine missione or in a melee. A worn piece is worth less: its stats scale by `0.5 + condition/200`, so a full fine kit at zero condition drops from 34% guard to 21%. At zero it **breaks** — *"snapped at the tang"* — and he finishes the bout on house stock.

| | After 10 bouts |
|---|---|
| House stock | 100 / 100 / 100 / 100 |
| Bought kit | 54 / 67 / 79 / 70 |

**The armamentarium finally earns its upkeep.** It repairs **2.2 condition per level per week** passively, and discounts a full mend from 99d to 27d at L3. Condition is stored per instance and handed back to the rack on unequip, so swapping a worn piece out and back gives no free reset.

**The forge.** At L3 the smith will make **one piece for one man** — `FORGE_FEE 700`. It gains +5% attack and guard, wears **half as fast** (75 condition after 12 bouts against 47 for an ordinary one), cannot be equipped to anyone else, and **bends instead of breaking**: driven to nothing it comes back at 25 rather than snapping. Eight names, each used once per house.

### The nemesis
A rival gladiator who has **beaten your house twice**, or killed one of your men, stops being an opponent. `d.nemesis` names him, your own familia gives him a title, and the chronicle records the day they started using it.

While he stands: facing him costs your man **8 morale before the bout** (14 if he has killed), the crowd is 10 louder for it, and a *hated* nemesis drags the whole familia by 1.2 morale and 0.6 defiance every week he is still walking around Capua. His offers are flagged on the card with his title.

Settling it pays: **+11 morale across the house, −4 unrest, +12 fame** for beating him, and **+18 / −7 / +22** for killing him — *"Whatever the cells were carrying about him, they put it down tonight."* He clears if he dies elsewhere or leaves his house, so the slot never strands.

Only one at a time, unless a second man kills one of yours — a killer always displaces a mere rival.

### The crux, everywhere
The intervention now reaches every engine that can kill a man.

- **The hunt** is where it matters most, because there is no missio and never was. The third option becomes **"Call the handlers in"** — *"They come over the rail with irons and burning straw and get between them."* Against a lion with only a sword, press and cover both end in a **43% death**; the cloth makes it **0%**, at the cost of the purse, 7 fame and a badly mauled man. It is the only lifeline in a venatio and you have to spend it yourself.
- **Pair bouts** hold when one of yours goes down or either is badly used, and whatever you say, you say to both — the cloth walks them off together.
- Guarding works in both: incoming damage halves.

Held at: single bouts 99% (never over first blood), hunts 83%, pairs 96%.

### One word from the box
Fights used to resolve entirely before the first frame was drawn. `simulateFight` is now **pausable and resumable**: it takes an optional `from` snapshot and a `stopAtCrux` flag, breaks out mid-loop carrying its full internal state, and picks up at the round it left off. `doFight` splits to match — a first call returns `{crux, pending}` and mutates nothing, a second call resumes and applies every consequence.

The bout is held **once**, in rounds 3–6, when someone has taken real damage (`vA ≤ 74 || vB ≤ 70`). Never over first blood, and never at Rome — there is no box of yours in that arena. Then you get one word:

| | | |
|---|---|---|
| **Press him** | aggressive | more damage dealt, more taken |
| **Cover up** | measured, and incoming damage **×0.44**, +12 to the missio roll | he wins less and lives far more |
| **Throw in the cloth** | forfeit | he loses and walks off clean |

Measured on bouts held while *your* man is the hurt one:

| | Standard | | Sine missione | |
|---|---|---|---|---|
| | win | injured | win | **died** |
| Press | 17% | 78% | 21% | **72%** |
| Cover | 15% | **46%** | 11% | **50%** |
| The cloth | 0% | **0%** | 0% | **0%** |

Covering nearly halves the death rate for half the win chance; the cloth is certain survival at the cost of the purse, 9 fame and 5 standing with every patron — and every man in your cells sees who called it (−4 unrest, +4 morale to the rest, and it counts toward a merciful reputation).

Getting this right took three passes. The first fired the crux at `vA ≤ 42`, by which point the bout was decided — press won 6%, cover 2%, and only the cloth changed anything. The second made "cover up" plain defensive, which *raised* his death rate at sine (57% vs 51%), because trading offence for slower losing still ends in a loss and a dull fight earns less mercy.

### The annals
The chronicle keeps forty lines and then forgets. `d.annals` does not: **one entry per person who ever wore your colours**, opened when they arrive and closed when they go, whatever way they go.

Kept current by a single `annalsSync(d)` sweep each week rather than a hook at every call site — it enrols anyone new, refreshes the living, and closes anyone whose status has entered `GONE`. Only the two exits that *remove* a man from the array (sold, and the rival buyout) need an explicit `annalsClose`. Nine fates are distinguished, including the three ways to die:

`Killed` · `Killed by a beast` · `Died in revolt` · `Given the rudis` · `Released` · `Served his term` · `Escaped` · `Defected` · `Sold`

Each entry carries name, nickname, class, origin, whether he was under contract, the years he served, his record, kills, scars, and whether he ever got the thing he privately wanted. `houseRecord(d)` rolls it into a house total — served, won, lost, killed, buried, freed, walked out, and who won more than any of them.

The Ludus tab shows the summary with **"Read the annals"** opening the full book, split into *Still on the sand* and *Gone*. The ending screen shows the same record, so a run closes with what it actually was rather than two numbers.

Old saves are backfilled from the six fragmented lists (`fallen`, `freed`, `escaped`, `retired`, `departed`, `defected`) so a house in progress keeps its dead.

### The auctoratus
A free man who sold himself to the sand. Historically real, and the mechanical opposite of everyone else in the cells. He turns up on the block (**30% of market refreshes**) or at your gate as an event, and he is not for sale — he is offering.

| | Slave | Auctoratus |
|---|---|---|
| Acquired for | a purchase price | **a fee in hand (~500d) plus a weekly wage (~17d)** |
| Term | until death or the rudis | **6–12 bouts, then he walks** |
| Can be sold | yes | **no** |
| The rudis | the goal | **means nothing — he is already free** |
| Defiance | ~25 | **~7** |
| At the Night of Fire | may rise | **cannot lead it and will not join it** |
| Poachable | yes | **no — he is under contract** |

He steadies the house: unrest is now computed from **the enslaved men only** (their grievance, not his), and each auctoratus sheds a further 0.35/week. Measured on a defiant roster over 25 weeks, two of them take unrest from 37 to 20 — a real trade, not a cure.

**And his term ending is the cost.** If his morale holds he may offer to re-sign for a third more; let him walk instead and every enslaved man in the yard watches a man leave through the front gate — **+7 defiance each, +4 unrest plus one per slave watching.** He is the calmest thing you can own and the most dangerous thing you can lose.

Each one carries a reason he signed, shown on his page: debts, a farm lost to a senator's surveyor, a discharge with nothing but the walk south.

### House reputation
Four running tallies in `d.rep`, decayed 1.5%/week so they reflect recent behaviour, deciding what kind of house Capua thinks you are:

| | Earned by | Courts the |
|---|---|---|
| **Butchers** | kills (+7), signing sine missione (+5), the hunt (+6) | magistrate |
| **Showmen** | showboating (+6), a crowd over 90 (+3), gladiatrices (+2) | noblewoman |
| **Technicians** | winning barely scratched (+8), winning defensively (+7) | senator |
| **A Merciful House** | the rudis (+16), an honourable release (+10), sparing a beaten man (+3) | merchant |

A style takes hold at 36% share and changes the world: butchers get **+22% sine offers** and drift +0.35 unrest a week; showmen get an **extra bout on every card** and +8 opening crowd; technicians are paid **18% more**; a merciful house sees 13% fewer death matches and sheds unrest. Your dominant style also warms its matching patron by 0.35/week.

Verified by playing each style for eight 70-week campaigns: each one produces its own reputation, and the verdicts hold 8/8, 8/8, 6/8, 5/8.

### The other lanistae
The three rival houses are now three men, and the difference is mechanical:

- **Marcus Solonius, the schemer** — grudges cool ×1.6 as fast, but he poaches **×2.2** as often and bribes editors ×1.8.
- **Quintus Vettius Bassus, who forgets nothing** — grudges decay at **×0.35**, and he is ×1.9 more likely to be behind the sabotage. From a grudge of 80, forty weeks later Solonius is at 16 and Vettius is still at 66.
- **Gaius Tullius Rufus, who is simply better at this** — his fighters train **×1.55**, and every market refresh he has a 45% chance to simply **take the best man off the block** before you have finished looking at him.

### Ambitions
Every gladiator privately wants one of seven things — the rudis before thirty, never to be sent sine missione, never to be put in front of an animal, a name from the crowd, a win at the Ludi Romani, to fight beside someone he trusts, or to face the house that marked him. Shown on his page under **What he wants**.

Meeting it is worth **+24 morale, −18 defiance, −4 unrest**; breaking it costs **−26 morale, +18 defiance, +6 unrest** and his brothers take it too. Ambitions are assigned by eligibility (only the scarred want revenge, only the promising aim at Rome), so they read as personal rather than random.

### Founding scenarios
Five ways in, replacing the old founding gift:

| | |
|---|---|
| **A Clean Start** | 800d, 3 men, nothing wrong — its own kind of pressure |
| **Your Uncle's Debts** | 260d, **6 men**, unrest 26, a carceres already built. The upkeep will eat you if you stand still |
| **One Good Man** | 520d, **a single legend** at 70 fame with Defiant and nobody behind him |
| **The Old Guard** | 700d, 4 men averaging **32 years and 9 scars**. A closing window |
| **Another House's Leavings** | 640d, 5 men at **unrest 38 and double defiance** — Tullius' rejects, and told so |

### The festival year
Six festivals in their real order through the Roman year, on the **same 18-week clock the men age by** — one year is one year, and it recurs, so it can be planned around. `festivalNow(d)` drives the games entirely; the old "every third week" rule is gone.

| Week | Festival | Character |
|---|---|---|
| 2 | **Quinquatria** (March) | Minerva's five days; the schools display. Small purses, **training ×1.35** all week. |
| 5 | **Floralia** (May) | The mob wants a show, not a funeral. **No sine missione offers**, fame ×1.25 — and a death here costs **2.2× unrest**, 8 fame and 6 standing with every patron. |
| 8 | **Ludi Apollinares** (July) | The first serious money of the summer. Three bouts, purse ×1.15. |
| 11 | **Vulcanalia** (August) | Every armourer cutting his price: **gear at 75%**, and winning in bought steel pays **×1.25 fame**. |
| 14 | **Ludi Romani** (September) | The great games. Four bouts, purse ×1.6, fame ×1.5, and **every offer one tier higher**. |
| 17 | **Saturnalia** (December) | **No games at all.** The familia is served at your table; −11 unrest, +14 morale, −7 defiance. A week's takings for the cheapest peace you will ever buy. |

**Funeral games** fall outside the calendar — 16% on any empty week — and are what gladiatorial combat was actually *for*: double purses, and **every bout sine missione**.

The Ludus tab shows the year as an 18-segment strip with the current week lit, the festival's own description, and the next two with their distance in weeks. The header now reads *"Year 3, week 11"*.

### The house (buildings)
Five structures, three levels each, in `d.buildings`. Every one is a **standing weekly cost that changes a rate** — none of them add a resource:

| Building | L1 → L3 buys |
|---|---|
| **Valetudinarium** | heal speed ×1.45 → ×2.35, scar chance ×0.85 → ×0.55, and unlocks the surgeon |
| **Balneae** | −3 → −9 fatigue per week, +0.5 → +1.5 morale drift |
| **Carceres** | −0.5 → −1.5 unrest per week |
| **Armamentarium** | gear at 90% → 70% of list |
| **Palus** | training ×1.08 → ×1.24, sparring injuries ×0.9 → ×0.7 |

**16,210 denarii** to max all five, at **77d/week** upkeep — roughly doubling a six-man house's fixed costs. That is the late-game sink the economy was missing. Over 120 weeks a house that builds finished on fame 1345 and unrest 12; two that did not rebelled at weeks 33 and 53.

### The medicus
A wound is no longer a countdown. `g.injury.care` takes one of three:

- **Let it mend** — the slow way, off the sand until it closes.
- **The surgeon** — costs `(55 + pen×14)` scaled by the valetudinarium; heals ×1.6 faster again and cuts scarring by a further 40%. Requires the building.
- **Work him through it** — status stays `active`, so he fights and trains at the full injury penalty and the wound *never closes*. Each week: 30% it worsens (`pen +2`, one more week) and **13% it sets badly** — an immediate severe scar, a permanent ceiling, +3 unrest and a chronicle line.

Measured, a pierced side (4 weeks, pen 9):

| Valetudinarium | Let it mend | With the surgeon |
|---|---|---|
| none | 4 wks, 76% scarred | — |
| L1 | 3 wks, 62% | 2 wks, 41% |
| L3 | 2 wks, 40% | 2 wks, 25% |

Working a man through it is usable for one bout and ruinous as a habit — 13% a week compounds to **93% over twenty**.

### Accessibility
- **Focus** — a visible `:focus-visible` ring on every control.
- **Motion** — `prefers-reduced-motion` now blanks *all* animation and transition via a universal rule, and hides blood spurts and the hit flash, rather than the handful of named classes it covered before.
- **Semantics** — `role="tablist"`/`tab` with `aria-selected` on the nav, `role="dialog"` + `aria-modal` on all seven overlays, `role="progressbar"` with live values on every stat and health bar, `aria-label` on icon-only buttons, `aria-hidden` on decorative icons.
- **The arena narrates.** The fight caption is a `role="log"` `aria-live="polite"` region, so a screen reader hears the bout blow by blow instead of nothing.
- **Contrast** — measured against the panel background `#1d1610`; everything now clears WCAG AA:

| | | |
|---|---|---|
| body `#e8d9b8` | 12.81:1 | AA |
| gold `#d8ac5f` | 8.50:1 | AA |
| laurel `#9aa86a` | 6.97:1 | AA |
| dim `#b09b7d` | 6.67:1 | AA (was 4.4) |
| tab label `#a08d6b` | 5.55:1 | AA |
| blood `#d96f5d` | 5.43:1 | AA (was 4.44) |

### Sound
`SFX` — a small Web Audio synth in the UI half, so the standalone file stays **one file with no assets**. Nothing is constructed until the player's first tap (browsers block audio before a gesture) and every call no-ops if `AudioContext` is missing.

Combat beats map to sounds: bandpass noise bursts for clashes and grazes, noise plus a low sine thump for hits, a longer pitch-drop for crits, a falling tone for a man going down, a two-stage descent for a death, a rising triangle pair for missio, and a sawtooth fifth for the horn at the salute and the verdict. The **crowd is a bed, not an event** — looped brown noise through a lowpass whose gain and cutoff track the crowd meter, so the roar swells with the fight and fades when the modal closes.

Muting is a chip in the fight header and persists in the save at `flags.mute`.

### Poaching
A rival with a grudge of 35+ does not only want to beat your men — it wants them. `poachWeek` rolls 7%/week to target your most **defiant** valuable gladiator and opens a **three-week window**, announced in the chronicle (*"seen at the wall after dark, talking to a man in House Vettius' colours"*). The `poached` event offers three answers: match their price (~60% of his value, −22 defiance), a week in irons (55% to break it, at a heavy morale and unrest cost), or watch and hope.

Let the window close and he **defects** — removed from your roster, added to that rival's live roster with his own stats, record and kit intact and a `wasYours` flag, so you meet him at the games. Costs 10 fame, 8 unrest, +4 defiance across the cells, and his brothers take it hard.

### Lessons
Nine in-world cards from the old man who keeps the gate — one per tab, shown once, covering the week, unrest, the roster, regimens, stakes, the bookmakers, gear styles, buying by age, and patrons. "Understood" retires a card; "I know my trade" silences him entirely, and the Ludus tab can ask him back.

### Gladiatrices
About 10% of recruits and 7% of opponents are women, drawn from per-origin female name pools — the Greek pool opens with **Achillia** and **Amazonia**, the only two gladiatrices whose names history recorded, from the Halicarnassus relief. They fight as anyone does; the differences are social and at the gate:

- **+9 initial crowd** and **×1.2 fame** on a win — the novelty sells tickets
- the traditionalist **senator** loses 2 standing per bout, the **noblewoman** gains 3
- `<Fighter>` draws a narrower frame with a chest wrap (*fascia*), and bound hair when bare-headed

**Pronouns.** `PR(g)` returns the right set and is threaded through all four combat engines, every event, and the UI. Two real bugs came out of testing this: the pronoun helpers `pA`/`pB` were **shadowed by the power variables of the same name** inside both fight loops, producing "Blood down undefined shoulder"; and `Corocotta`, a Cantabrian chieftain, had been sitting in the women's name pool. Collective phrasing ("both men standing", "the last man standing", beast moves like "barrels into his shins") is now neutral. Verified by running an all-female card through every engine and asserting that the only male pronouns left refer to the editor, who is a Roman magistrate.

### Rome
The fifth tier and the only real ending the game has. `romeReady` fires once a house passes **600 fame** with a **senator at 70+ standing** and two men fit to travel; the invitation then arrives on a 50%/week roll, with a **30-week cooldown** if declined so it never nags.

**Declining** is a real choice — Capua remains the whole of the world, at −25 fame and −30 with the senator, and the men are quietly relieved.

**Accepting ends the run either way.** Two weeks on the road (upkeep and tolls, no market, no events, nothing happens in Capua), then **three imperial bouts**, one per week, against opponents generated at quality 92–99 in tier-3 kit — an average stat of **76.5** against a starting gladiator's 51. Half are fought *sine missione*. Your Capuan standing is capped at 20 and your patron is stripped from the missio roll entirely: *"The box above the sand is not a magistrate's. Whatever your patrons are worth in Capua, they are worth nothing here."*

Two of three carries the house. One or none does not.

| Your roster | Triumph | Swallowed | Men lost |
|---|---|---|---|
| merely good (~69 stats) | **25%** | 75% | 1.05 |
| strong (~79) | 69% | 31% | 0.55 |
| exceptional (~89) | **89%** | 11% | 0.34 |

Endings: `triumph` — a rudis cut from imperial oak and a deed to land in Campania, and the house never has to send anyone to the sand again. `romeFall` — what is left goes home down the Appian Way in two wagons instead of six.

### The melee (gregatim)
Six to eight men on the sand at once, drawn from every house, and the editor pays **one**. `simulateMelee()` — a fourth engine. Each round the standing are shuffled and paired (allies kept apart while enemies remain); exchanges involving your men are narrated in full, the rest summarised as dust across the sand. A man who falls gets one missio roll at a harsher threshold than a formal bout — a melee tramples the fallen.

**The crux.** If your men are the last two upright, the editor does not lower his hand. They finish it, and the game takes the tie off the board:

| Entered | Win | Dead | Injured | Forced to finish |
|---|---|---|---|---|
| 2 | 25% | 0.22 | 1.53 | **10%** |
| 3 | 36% | 0.33 | 2.26 | **20%** |

Entering more men raises your chance at the purse *and* your chance of being made to kill your own. If the two were brothers it costs **18 unrest**, 16 morale and 12 defiance across the whole roster, 30 morale off the survivor, and the bond is deleted — *"Whatever the survivor is now, he is not what he was on the way in."* Strangers cost half that.

Purse ×4.0, plus a **survivor's share** of 22% per man still upright at the end, so lasting without winning is still worth something. Net of the men you lose, a melee clears roughly +225 (two entered) to +290 (three) — profitable in coin, expensive in bodies, since 1.5–2.3 men come back injured.

### Venatio
The morning hunt. `simulateVenatio()` — a third engine, again separate from the other two. **No missio**: when a man goes down, the only question is whether the handlers come in, at `0.26 + crowd×0.0022 + patron×0.0018 + pfame×0.0012`. Otherwise the beast is still on him when the cheering stops.

Six beasts across three tiers, each with `hp`, `pow`, `hide`, `spd`, `fear` and its own attack repertoire (`BEAST_MOVES`). Beast power is `pow × BEAST_SCALE 2.05 × (0.6 + spd×0.4)` — speed tilts an exchange rather than multiplying the whole animal, which is what made leopards unkillable and aurochs trivial in the first pass. Damage to the beast scales `100/hp`, so an aurochs takes half again as long to put down as a wolf.

**Reach is the whole trick.** `reachVsBeast()` — spear ×1.20, trident ×1.15, axe ×1.07, sword ×1.00, twin blades ×0.95, dagger ×0.86 — applied to *power only*, never damage (applying it to both made the hasta a guaranteed kill on everything).

| Tier | Beast | Kill with a spear | With a sword |
|---|---|---|---|
| 0 | wolves / boar | 100% | 90–95%, 3% dead |
| 1 | leopard | 98% | 74%, 11% dead |
| 1 | bear | 84% | 28%, **26% dead** |
| 2 | aurochs | 39%, 8% dead | 4%, **31% dead** |
| 2 | lion | 26%, **34% dead** | 2%, **46% dead** |

**The men hate it.** Any hunt costs the man 12 morale and 6 defiance, everyone else 3 morale, and the house 4 unrest — **doubled for a man with 60+ renown**, who is far too well known to be sent to the dogs. Brothers react. A kill pays a big purse and house fame, but personal renown at only 35% of a normal bout: the mob remembers the beast.

Over 90 weeks, a house that takes every hunt finishes on 5,000–6,000 gold against 1,000–4,300 for one that takes none — and pays for it with unrest 35–63 and 2–8 dead, against 0 and 0.

`<Beast>` renders one quadruped with six sets of bones — mane, horns, tusks, spots, hump, ear and tail shape all driven by an art table.

### Betting & fixing
`winChance(g, opp)` estimates the bout from `power()` on both sides, then **sharpens the raw ratio on the odds scale with an exponent of 8.0** — a power edge compounds hard across twelve rounds, and the unsharpened ratio was wildly wrong at the tails (it paid 2.20 on a man who actually won 17% of the time). Calibrated against 9,000 simulated bouts, predicted vs actual is now within **2.5 points** across the full 10–90% range.

Odds are `1/p × (1 − VIG)` with `VIG 0.12`, shown on every offer card once a man is picked. Backing your own man every bout loses **10.9d per 100d staked** — exactly the vig. Betting is not free money.

**Fixing** — stake against your own man and he is told to go down: his `str/agi/tec/dis` drop to 74% for that bout. Discovery is `0.22 + 0.18 (crowd > 70) + 0.12 (tier ≥ 2) − sho/400`, and **+0.30 if he wins anyway**, so the pits are the safe place to do it and the Primus is not. Caught costs 18 fame, **14 standing with every patron**, +9 unrest and morale across the roster. Uncaught still costs the man 15 morale and 9 defiance, and his brothers 8 more — he knows what you asked.

Measured over 90-week campaigns:

| | Outcome |
|---|---|
| Honest house | 2/3 alive at week 91, 2,900–4,300 gold, unrest 0 |
| Fixes every bout | **3/3 destroyed** — two rebellions (wk 20, wk 37), one bankruptcy, fame 3–18, standing 0–19 |

A single fix is worth about 3× an honest bout. A habit of it burns the house down.

### Pair bouts
Two of yours against two of theirs, offered at the games (45% of cards once fame ≥ 25, `stakes` always `standard`). Written as **`simulatePair()`, separate from `simulateFight()`** — the single bout is the most tested code in the game and did not need touching.

One man leads each exchange; his partner presses in behind for `ASSIST 0.35`, scaled by `assistMult()` — **brothers up to ×1.56, rivals down to ×0.64**. Damage lands on the lead; when he drops below 20 he goes down and his partner steps up, with a missio roll per fallen man. The bout ends when both of a side are down, or on the horn at 16 rounds.

Opponents are drawn one tier below at the higher games (two men of the tier below ≈ one of this tier) and at equal tier at the local games. Purse ×1.7.

| | Strangers | Brothers | Rivals |
|---|---|---|---|
| Local Games (tier 1) | 48.9% | **75.0%** | 35.6% |
| Arena of Capua (tier 2) | 50.0% | **78.1%** | 41.7% |

Who you send together is worth ~26 points of win rate. Winning together deepens the tie (+9), and a rival pair that wins has a 35% chance to reconcile on the sand. Beats carry `hA`/`hB`/`dA`/`dB`/`xA`/`xB` arrays plus `slot`, and the arena renders four figures in formation — lead in front, partner behind and inside, scaled 0.86.

### Patrons
`d.patrons` — named Romans with their own standing, appetites and memory. `d.favor` is no longer a resource you bank; it is the **rank-weighted average of what they all think of you**, recomputed by `recomputeFavor()`.

| Rank | Weight | Unlocks at fame | Wants |
|---|---|---|---|
| Magistrate | 1.2 | 0 (start) | blood, spectacle, party |
| Merchant | 0.8 | 0 (start) | sell, win, party |
| Noblewoman | 1.0 | 60 | showman, mercy, party |
| Senator | 1.5 | 220 | win, spectacle, mercy |

**Wants** are small contracts with deadlines — one raised roughly every 4.4 weeks across the house. `serveWants()` watches fights (a death, a crowd ≥78, a missio, a tier-1+ win, a named man appearing), parties, and sales, and resolves any want that matches. Meeting one is worth +11 to +16 with that patron; letting it lapse costs 8–11 and is counted in `slighted`. Standing also decays 0.35/week without attention — ignore everyone for 40 weeks and a house at 34 falls to 9.

**The thumb.** Your best-standing patron leans on the editor when your man is down: `spare += patron.favor × 0.12`, and above 70 he does it visibly — *"raises a hand from the editor's box before the crowd has finished deciding."* Measured, an unknown man falling in the pits:

| Best patron | He dies |
|---|---|
| none | **87.6%** |
| 40 | 69.6% |
| 70 | 54.9% |
| 95 | **38.9%** |

Above 85 standing a patron sends unexplained gifts; below 10 he talks about you at the baths and costs you fame. Parties raise every patron at once (+5/9/15 by tier) and satisfy any outstanding `party` want, which is what parties are now *for*.

### Regimens
`g.regimen` — **palus / spar / cond / rest** — sits alongside `g.focus` (which stat). Measured over 16 weeks from 45 strength, age 25, resting above 70 fatigue:

| Regimen | Result | Injured at least once |
|---|---|---|
| Palus (solo post work) | str 66.6 | 0% |
| Spar, no tie | str 76.3 | 16% |
| Spar with a **brother** | str 77.4 | 16% (11% when driven hard) |
| Spar with a **rival** | str 77.6 | **27%** |
| Spar with a **better man** | **str 82.1** | 12% |
| Conditioning | end 56.0, fatigue cleared | 0% |

**Sparring** needs a mutual partner (`g.sparWith`, both sides set). Gain is `SPAR_BASE 1.45` plus a **learning bonus** of `(partner[focus] − self[focus]) × 0.010` capped at +0.45 — a man learns most from someone better than him. Brothers ×1.10 gain, **×0.6 injury**, +1 morale each; rivals ×1.25 gain, **×2 injury**, −1 morale each. Base injury `SPAR_INJ 0.015`/week, ×1.6 above 70 fatigue, reduced by the doctore.

**Conditioning** trains `end` at 0.7× and *sheds* 8 fatigue — the middle option between training and resting.

`repairSpar()` runs before training every week: a pairing whose partner died, was sold, went to rest or took an injury quietly falls back to the post. Verified zero orphan pairings across five 90-week campaigns.

**Sparring feeds the cell block.** `sparSocial()` gives an untied pair a 12%/week chance to become brothers, deepens existing ties by +2/week, and gives rivals a 6%/week chance to beat it out of each other and end the feud — 28% of rival pairs reconcile over 60 weeks of shared drills.

### The cell block
`d.ties` — a flat list of `{a, b, kind, strength, since}`, symmetric, **max 3 per man**, deduped, self-ties refused. `kind` is `brother` or `rival`; `strength` 1–100 grows ~1.2/week, +1.6 more if both drill the same focus.

**Forming** — 22%/week `weaveTies()` pairs two active men, weighted by shared origin (+9), shared focus (+6), shared class (+3). Whether it comes out warm or sour depends on their average morale (>48) and house unrest (<70), so a well-run house breeds brothers and a miserable one breeds feuds. The `feud` event now leaves a permanent tie behind: the whip creates a **rival**, letting them settle it with wooden swords creates — or converts an existing rival into — a **brother**.

**Living with it** — brothers drift +0.5 morale/week each; rivals −0.6 but **+0.10/week to their key stat**, because spite is a whetstone. `kinReact()` propagates events along ties, scaled `0.4 + strength/100 × 0.6`:

| Event | Brothers | Rivals |
|---|---|---|
| He wins | +4 morale, −1 defiance | −3 morale, +1 defiance |
| **He dies** | **−22 morale, +12 defiance**, +3 unrest each | +3 morale |
| He is sold | −16 morale, +9 defiance, +3 unrest each | — |
| He takes the rudis | +14 morale, −8 defiance | — |
| He is released | +8 morale, −5 defiance | — |

Measured: a stranger's death costs a given man nothing and +4 unrest; **a brother's death costs him 19 morale, +11 defiance, and +7 unrest.**

**The danger** — `updateRebellion` now picks the ringleader by `defiance + brothers × 9`, so the man who can *rally* leads rather than merely the angriest. At the Night of Fire his brothers rise with him regardless of their own temper. Measured: a house of loners produces a 1-man revolt; the same house with two bonds produces a **3-man** revolt. Bonds are the warmest thing in the ludus and the most dangerous thing you own.

New event `plea` — a man stops you in the yard and asks that his brother be rested, not for himself. Granting it costs a week's fight and buys real loyalty; refusing costs him 12 morale and gains 8 defiance.

Ties are pruned every week for men who died, were sold, freed, escaped or retired — verified zero leaks across 200 houses.

### The doctore's pupil
He can drill the whole yard, or take **one man** and work only on him — `d.doctore.pupil`. The bonus share moves from a flat 0.32 to **0.85 for the pupil and 0.13 for everyone else**, so it is a genuine reallocation rather than an upgrade. His pupil also gets 1.8× the injury guard and +2 morale a week.

Measured over 12 weeks of strength work from 45:

| | Result |
|---|---|
| No doctore | 61.7 |
| Drilling the whole yard | 71.4 |
| **Working only on him** | **80.7** |
| Working on someone else | 68.4 |

**Lessons.** Each week with a pupil rolls `skill/340`, ×1.5 if the doctore is one of your own freed men — about 40% a week at skill 90. Five outcomes:

- **Footwork** — +2–4 potential, permanently. *"Finds something nobody had looked for."*
- **A habit drilled in** — gains Swift Learner, Stoic, Iron Hide or Showman.
- **He reads him** — his exact potential, heart and defiance are shown from then on, in place of the doctore's vague phrases.
- **Steadied** — −11 defiance, +2 discipline, +6 morale. *"Takes the fight out of his eyes and puts it in his hands."*
- **Mended** — lifts a scar's permanent training ceiling by 5. The only way to claw back what a repeated wound took.

**Remaking a man.** `RETRAIN_FEE 240` and **three weeks off the sand** turns him into any other class: his kit resets to that style's default, its key stats gain 3, and he keeps everything else he is. Losing the pupil mid-lesson — death, sale, injury — releases the doctore cleanly rather than stranding him.

### The doctore
`d.doctore` — the man who runs the training square, or `null`. Fields: `skill` (30–96), `spec` (one stat), `wage`, `fee`, `fromHouse`, `weeks`.

- **Training** `docTrain()` — `(1 + skill/100 × 0.32)` to everything, **×1.28** on his specialty. A skill-60 hired man with the right specialty turns 14 weeks of strength work from +18.8 into +28.7.
- **Injury** `docInjuryGuard()` — overtraining injury chance × `(1 − skill/200)`.
- **Unrest** `docCalm()` — −0.4/week hired, **−1.2/week if he is one of your own**.
- **The Night of Fire** — he adds `skill × 0.25` to the house's strength when the revolt comes.

**Hired** candidates refresh with the slave market, cap at **skill 82**, and cost a fee (~480–630d) plus 21–26d/week. **Freed men are better and cheaper**: `doctoreFromGladiator()` scales with wins, renown and `tec`/`dis` up to **96**, charges no fee and half wage. Granting the rudis (or releasing a veteran) rolls `offerDoctore()`:

| Unrest | Morale | Rudis | Retirement |
|---|---|---|---|
| 20 | 80 | **85% stay** | 70% stay |
| 50 | 60 | 45% | — |
| 70+ | 40 | **15%** | — |

Measured over 90-week campaigns: merciful houses finish with a freed-man doctore ("the finest in Capua") and unrest 0; brutal houses receive **zero** offers and ruin out by week 14–52. Dismissing a freed doctore costs 8 unrest and 8 morale across the roster.

### Retirement
`retireEligible` at **age ≥ 31 or scarBurden ≥ 20**. Releasing a man gives +12 fame, −9 unrest, +5 morale to the rest, and defuses the rebellion if he was the ringleader. Compare the rudis (+60 fame, −12 unrest) which needs 10 wins and 90 renown — retirement is the merciful exit for a man who will never earn it.

### Classes (6, in a counter cycle)
Murmillo → Thraex → Hoplomachus → Secutor → Retiarius → Dimachaerus → Murmillo. Countering grants **×1.12** power. Each class needs an entry in `CLASSES`, `COUNTERS`, `ATTACKS`, and `DEFAULT_KIT`.

### Equipment (29 items, 4 slots)
`weapon | offhand | helm | armor`. Stats: `atk` (power + damage), `def` (guard + damage soak), `spd` (stamina drain), `sho` (crowd). Items list `styles`; gear outside a man's style applies at **half effect −0.045 atk** and is labelled *unfamiliar*. Free/basic gear is unlimited; purchased pieces are tracked in `d.gear` and arm one man at a time (`gearFree`). What a man wears is what the `<Fighter>` component draws.

### Fight engine
Up to 12 rounds. Each round compares `power()` for both men; a gap < 7 is a clash, otherwise the higher roll lands a blow on a random body part. Emits a flat array of **beats** (`intro salute clash graze hit crit gas crowd fall appeal spared death end`) carrying a full state snapshot — health, stamina, crowd, momentum, round, target coords. The UI animates purely from beats; it never re-runs logic.

Stakes: `blood` (first blood, no deaths), `standard` (missio decides), `sine` (no mercy).

### Rival houses
Solonius (60 fame), Vettius (150), Tullius (330). Each keeps a live 4-man roster that trains, fights off-screen, earns nicknames, and dies permanently. Games opponents are drawn from these rosters, so beating a man creates a **rematch** and killing one spikes that house's **grudge** (+20). Grudges gate three events: `sabotage` (≥30), `bribedEditor` (≥50), `thugs` (≥65).

### Unrest & the rebellion arc
Unrest rises from cruelty, deaths, sine missione, sales, and thin rations; falls from victories, feasts, and the rudis. Three stages, each firing a decision event and de-escalating if unrest drops below `[40, 55, 68]`:

- **50 — Whispers.** Buy the ringleader's name; he's tagged *Firebrand*.
- **65 — Stolen Steel.** Lockdown, or pay for a watch that forewarns you.
- **78 — The Night of Fire.** Fight it, buy the magistrate's guards (300d), or open the gates.

Opening the gates sets `flags.spartacusAtLarge` and runs a 5-beat chronicle of his growing revolt. Granting the rudis to a known Firebrand **defuses the whole conspiracy**.

### Economy
Upkeep 10d/man/week, +8d per injured man. Purses and appearance fees by tier. Parties (150/400/900d) buy favor; feasts (120d) buy loyalty. Losing more than −250d ends the run.

### Save files
**Three independent slots** at `window.storage` keys `ludus-slot-1..3`, each autosaved 500ms after any state change with a `savedAt` stamp. Boot reads all three and shows the **Records** title screen — house name, week, fame title, men/fallen/freed, and how long ago it was kept. A single pre-slot save at the legacy key `ludus-save-v1` is adopted into slot 1 on first boot, so no one loses a house.

A fallen house stays in its slot marked closed; you re-open it to read the ending or strike it out. `wipeSlot` confirms through the themed modal.

**Transfer codes** — `encodeSave` / `decodeSave` round-trip the whole state through unicode-safe base64 (≈17k chars at week 13). Copy the ledger from the Ludus tab, paste it into any slot from the title screen. `decodeSave` validates shape and runs `migrate()`, so an old or corrupt code is refused rather than loaded.

State `ver: 6`. `migrate()` is additive and idempotent — it backfills `rivals`, `escaped`, `rebellion`, `gear`, `retired`, `doctore`/`doctoreMarket`/`doctoreOffer`, and per-gladiator `kit`, `scars`, `scarCap`, `weeksAged`, `age`.

---

## Balance reference (measured, N ≥ 800)

Tuning dials, in the order you'd reach for them:

| Dial | Location | Current |
|---|---|---|
| Gear → power | `power()` | `1 + atk*0.6 + def*0.30` |
| Gear → damage dealt | `simulateFight` | `× (1 + atk*0.7)` |
| Gear → damage taken | `simulateFight` | `× (1 − def)` |
| Gear → stamina | `simulateFight` | `drain × (1 − spd*0.5)` |
| Gear caps | `kitMods` | `atk [−0.24, 0.26]`, `def [−0.25, 0.34]` |
| Class counter | `power()` | `× 1.12` |
| Momentum | `power()` | `± 3 steps × 3%` |
| Missio threshold | `simulateFight` | `spare ≥ 42` |
| Rudis gate | `rudisEligible` | 10 wins **and** 90 renown |
| Year length | `WEEKS_PER_YEAR` | 18 weeks |
| Prime window | `PRIME` | 23–28 |
| Age → training | `ageTrain` | 1.3 / 1.0 / 0.72 / 0.42 |
| Age → decay | `endWeek` | `(age−28) × 0.05`, agi ×1.4 |
| Scar chance | `endWeek` | 45%, or 75% if `pen ≥ 8` |
| Scar bite | `addScar` | −1 / −3 stat, −2 / −7 ceiling |
| Retire gate | `retireEligible` | age ≥ 31 **or** burden ≥ 20 |
| Doctore → training | `docTrain` | `1 + skill/100 × 0.32`, spec ×1.28 |
| Doctore → injuries | `docInjuryGuard` | `× (1 − skill/200)` |
| Doctore → unrest | `docCalm` | −0.4/wk, −1.2 if `fromHouse` |
| Hired skill cap | `makeDoctore` | 82 (freed men reach 96) |
| Stay-on chance | `offerDoctore` | .45 rudis / .3 retire, ±unrest, ±morale |
| Tie formation | `weaveTies` | 22%/wk, cap 3/man |
| Tie growth | `weaveTies` | +1.2/wk, +1.6 shared focus |
| Brother's death | `doFight` | −22 morale, +12 defiance, +3 unrest |
| Ringleader sway | `updateRebellion` | `defiance + brothers × 9` |
| Spar gain | `SPAR_BASE` | ×1.45 + learning (max +0.45) |
| Spar injury | `SPAR_INJ` | 1.5%/wk, ×0.6 brother, ×2 rival |
| Spar fatigue | `endWeek` | +14/wk vs +13 at the palus |
| Conditioning | `endWeek` | `end` ×0.7 gain, −8 fatigue |
| Want cadence | `patronWeek` | 9%/patron/week |
| Want value | `WANTS` | +11…+16 met, −8…−11 lapsed |
| Standing decay | `patronWeek` | −0.35/week |
| Patron at missio | `simulateFight` | `spare += favor × 0.12` |
| Pair assist | `ASSIST` | 0.35 base, ×1.56 brother / ×0.64 rival |
| Pair opponents | `makeGames` | one tier down at tier ≥ 2 |
| Pair purse | `makeGames` | ×1.7 |
| Odds sharpening | `winChance` | odds-scale exponent 8.0 |
| Bookmaker's cut | `VIG` | 12% |
| Fixed-fight penalty | `doFight` | ×0.74 on str/agi/tec/dis |
| Discovery | `settleBet` | .22 base, +.18 loud, +.12 tier 2+, +.30 if he wins |
| Beast power | `BEAST_SCALE` | `pow × 2.05 × (0.6 + spd×0.4)` |
| Reach vs beasts | `reachVsBeast` | spear ×1.20 … dagger ×0.86, power only |
| Handlers pull him out | `simulateVenatio` | `.26 + crowd×.0022 + patron×.0018` |
| Hunt morale cost | `doVenatio` | −12, or −22 at 60+ renown |
| Melee purse | `makeGames` | ×4.0, plus 22%/survivor |
| Melee missio | `simulateMelee` | threshold 44, −16 penalty |
| Brothers forced | `doMelee` | −18 unrest, −16 morale, tie deleted |
| Rome gate | `romeReady` | 600 fame + senator ≥ 70 |
| Imperial opponents | `makeImperialBout` | quality 92–99, 50% sine |
| Standing at Rome | `doFight` | capped at 20, patron removed |
| Bouts to triumph | `ROME_BOUTS` | 2 of 3 |
| Poach chance | `poachWeek` | 7%/wk, grudge ≥ 35, 3-week window |
| Poach buyout | `poached` | 60% of the man's value |
| Gladiatrix rate | `genGladiator` | 10% recruits, 7% opponents |
| Gladiatrix crowd | `simulateFight` | +9 crowd, ×1.2 fame |
| Building costs | `BUILDINGS` | 380–460 / 880–1000 / 1750–2000 |
| Building upkeep | `bUpkeep` | 4–5 / 8–10 / 14–17 per week |
| Heal speed | `healSpeed` | `1 + level × 0.45`, ×1.6 with the surgeon |
| Scar guard | `scarGuard` | ×0.85 / ×0.70 / ×0.55 |
| Fighting wounded | `endWeek` | 30% worsens, 13% sets badly, per week |
| The year | `YEAR_WEEKS` | 18 weeks, shared with aging |
| Festival slots | `CALENDAR[].offers` | 2 / 2 / 3 / 2 / 4 / none |
| Ludi Romani | `CALENDAR` | purse ×1.6, fame ×1.5, +1 tier |
| Funeral games | `endWeek` | 16% of empty weeks, purse ×2, all sine |
| Reputation decay | `repWeek` | ×0.985/week |
| Style threshold | `repStyle` | 36% share, min 14 total |
| Ambition met/broken | `ambitionMet` | ±24/26 morale, ∓18 defiance |
| Lanista traits | `LANISTAE` | grudge ×0.35–1.6, poach ×0.8–2.2, train ×1–1.55 |
| Auctoratus fee | `makeAuctoratus` | `140 + quality×5.2`, wage `8 + quality×0.13` |
| Contract length | `makeAuctoratus` | 6–12 bouts |
| His calm | `endWeek` | −0.35 unrest/week, and he is outside the average |
| His departure | `auctorDepart` | +7 defiance per slave, +4 unrest +1 each |
| Annals sync | `annalsSync` | one sweep per week, keyed on `GONE` |
| Fates tracked | `FATES` | 9, including three ways to die |
| Crux window | `cruxNow` | rounds 3–6, `vA ≤ 74 \|\| vB ≤ 70` |
| Cover's guard | `simulateFight` | incoming ×0.44, spare +12 |
| The cloth | `doFight` | −9 fame, −5 patrons, −4 unrest, +8 mercy |
| Pupil share | `docTrain` | 0.85 pupil / 0.13 the rest / 0.32 nobody |
| Lesson odds | `docLesson` | `skill/340`, ×1.5 if he is one of yours |
| Remaking | `RETRAIN_FEE` | 240d and 3 weeks |
| Nemesis trigger | `nemesisCheck` | 2 defeats, or one of your dead |
| Facing him | `doFight` | −8 morale, −14 if he has killed |
| Settling it | `nemesisSettled` | +11/+18 morale, +12/+22 fame |
| Hunt crux | `simulateVenatio` | rounds 3–7, `vA ≤ 58 \|\| vB ≤ 42` |
| Wear per bout | `WEAR_RATE` | 3–6 weapon … 1–3 helm, ×1.5 hard |
| Worn value | `wearEff` | `0.5 + condition/200` |
| Weekly repair | `repairWeek` | 2.2 × armamentarium level |
| A named piece | `FORGE_FEE` | 700d, +5%, half wear, never breaks |
| He asks | `endWeek` | 14%/week, own channel |
| Gap before pressing | `EVENTS.ambition` | 5 weeks, then 9 |
| Despair | `ambWeek` | 12 weeks after the second asking |
| A promise kept / spent | `ambitionMet` | +34/−26 · −38/+26 and the yard hears |

Measured outcomes at standard stakes, equal fighters:

- basic vs basic — **~50%**
- full fine kit (1,480d) vs basic — **~63%**
- axe + subarmalis vs basic — **~55%**
- heavy defensive kit vs basic — **~46%** (survives longer, wins less)
- naked (pugio, no armour) vs basic — **~14%**, dies 80% at sine missione
- Dimachaerus vs Secutor (neutral) — **~44%**, shortest fights, highest crowd
- Dimachaerus vs Murmillo (counters) — **~80%**

Opponent loadout variety: 58 distinct kits at tier 0 (54% bare-headed), 178 at tier 3 (61% fine weapons).

---

## Changelog (shipped)

### v0.28.0 — Ambitions that speak
A man's one private want used to sit on his page waiting to be noticed. Now he raises it himself, at the moment it is on his mind, and each of the seven has its own voice. Give him your word, tell him no, or walk on — and if you have said nothing twice, twelve weeks later he stops asking, which costs more than either answer would have.

A promise is now a real object in the game. Keeping one pays half again what simply meeting the want does and lifts the whole house; spending one costs more than breaking a want you never acknowledged, and the entire yard draws the obvious conclusion about what your word is worth.

### v0.27.0 — Gear wear and the armourer
Bought steel now dulls, splits and eventually snaps at the tang, and a worn kit measurably stops helping. House stock is exempt — it is maintained, so the free racks remain a dependable floor rather than another thing to manage.

This gives the armamentarium a job past discounts: it mends 2.2 condition a level every week and cuts a full overhaul from 99 denarii to 27. Condition follows the piece rather than the man, so taking it off and putting it back does not reset it.

At the third level the smith will make one thing for one man — better, half as durable to wear through, bound to him, and it bends rather than breaks. *"Six weeks of nights on one piece, and he hands it over without a word."*

### v0.26.0 — The crux everywhere, and the nemesis
Ported the mid-bout intervention to the hunt and to pair bouts. In a venatio there is no editor and no appeal, so the third option is calling the handlers in yourself — the only thing that will get a man off a lion alive, and it turns a 43% death into none at all. In a pair bout whatever you say, you say to both.

Added **nemesis fighters**: a rival who beats your house twice, or kills one of your men, gets a name from your own familia. Facing him costs morale before the bout is even joined; a hated one drags the whole house down every week he is still walking around Capua; and putting him down is worth more than the purse.

### v0.25.0 — The doctore's pupil
The doctore stops being a flat multiplier. Point him at one man and that man trains far harder while the rest of the yard visibly suffers for it — 80.7 against 68.4 over twelve weeks, from a yard average of 71.4.

A week of his whole attention can also turn something up: a jump in potential, a habit drilled in until it becomes a trait, a true reading of what the man actually is, the fight taken out of his eyes and put in his hands, or an old scar worked until its permanent ceiling gives back a little of what it took — the only counter to scarring in the game.

And for 240 denarii and three weeks off the sand he will take a man apart and rebuild him as a different class entirely, kit and all.

### v0.24.0 — One word from the box
The last gap between what the game simulates and what you get to do. Fights resolved entirely before the animation began; now the engine pauses mid-bout, once, when it is genuinely in the balance, and hands you a single decision — press him forward, get him behind the guard, or throw in the cloth and forfeit to save his life.

Covering up nearly halves his chance of dying in a death match for half his chance of winning. The cloth guarantees he walks off, and costs the purse, nine fame and standing with every patron — while every man in your cells sees who called it. One choice, not control: the arena is still the antagonist.

### v0.23.0 — The annals
A permanent record of everyone who ever fought for the house — name, class, origin, the years they served, their record, their scars, how they left and in which year. Nine distinct fates, from the rudis to the beasts to sold on. Kept by a single weekly sweep rather than a hook at every exit, so nothing can slip out unrecorded.

The Ludus tab carries the house total — served, won, buried, freed, walked out, and who won more than any of them — with the full book a tap away. The ending screen now closes a run with what it actually was instead of two numbers. Old saves have their history reconstructed from the fragmented lists that came before.

### v0.22.0 — The auctoratus
Free men who sold themselves to the arena, on the block at 30% of market refreshes and occasionally at the gate. Paid up front and by the week rather than bought, contracted for a fixed number of bouts, unsellable, uninterested in the rudis, and carrying almost no defiance because nobody made him do this. He cannot lead a revolt, will not join one, and cannot be poached.

Unrest is now measured from the enslaved men alone, which is both more accurate and stops a contracted man diluting a grievance that is not his. Two auctorati take a defiant house from 37 unrest to 20 — a real trade against their wage, not an off-switch.

The catch is the end of his term: he may offer to re-sign, but let him walk and every slave in the yard watches a man leave through the front gate, at +7 defiance apiece. He is the calmest thing you can own and the most expensive thing to lose.

### v0.21.0 — Reputation, lanistae, ambitions, scenarios
**House reputation** — the arena remembers *how* you win. Four tallies decayed weekly decide whether Capua calls you butchers, showmen, technicians or a merciful house, and that changes which offers arrive, how much they pay, and which Roman courts you.

**The other lanistae** got names and habits. Solonius forgets a grudge fast and poaches twice as hard; Vettius forgets nothing and is usually behind the sabotage; Tullius trains his men half again as fast and will take the best man off the block before you have finished looking at him.

**Ambitions** — every gladiator privately wants one of seven things, shown on his page. Give it to him and he is yours; step on it and he remembers that instead.

**Founding scenarios** replace the founding gift: a clean start, an inherited debt with six men and a creditor, a single champion with nobody behind him, four ageing veterans, or five of Tullius' castoffs at unrest 38.

### v0.20.0 — The festival year
`FESTIVALS` was a flavour list picked at random. It is now a **real calendar** — six festivals in their Roman order on the same 18-week clock the men age by, so the year recurs and can be planned around. The games only happen when a festival does.

Each one has a character worth planning for: the Quinquatria boosts training, the Floralia forbids death matches and punishes a death badly, the Vulcanalia discounts the armourers and rewards fine steel, the Ludi Romani bump every offer a tier, and the **Saturnalia holds no games at all** — the familia is served at your own table and the house buys a week of real peace for a week of takings. Funeral games fall outside the calendar and pay double for bouts that are all sine missione, which is what these were for in the first place.

### v0.19.0 — The house, and the medicus
Added **five buildings** — valetudinarium, balneae, carceres, armamentarium, palus — three levels each, every one a standing weekly cost that moves a rate: healing, scarring, fatigue, unrest, gear price, training gain and sparring safety. 16,210d to max, 77d/week to keep, which finally gives a rich house something to do with its money and a shape you can see on the Ludus tab.

Turned injuries from a countdown into a **decision**. Let it mend, pay the surgeon (needs the valetudinarium), or send him back out on an open wound — where he fights at the full penalty, the wound never closes, and every week carries a 13% chance it sets badly and leaves something permanent. Good for one bout, ruinous as a habit.

### v0.18.0 — Familia, accessibility, sound
Renamed the roster tab **Men → Familia** — *familia gladiatoria* was the real Roman term for a troupe, and it stopped being accurate the moment gladiatrices arrived. Swept the collective nouns with it: "the men" became the familia, the cells, or the yard wherever it was player-facing.

**Accessibility pass** — visible focus rings, full `prefers-reduced-motion` coverage, tab/dialog/progressbar semantics, labelled icon buttons, and a live region on the fight caption so the arena is narrated to a screen reader. Raised `dim` and `blood` until every colour in the palette clears WCAG AA against the panel background.

**Sound pass** — a Web Audio synth with no asset files: noise bursts for steel, a low thump for hits, a pitch-drop for crits, a horn at the salute and the verdict, and a looped crowd bed whose gain and filter follow the crowd meter. Lazily constructed on first tap, no-ops without `AudioContext`, and muteable from the fight header.

### v0.17.0 — Poaching, lessons, gladiatrices
Rivals now come for your men. A house that hates you finds the most defiant gladiator on your roster and works on him for three weeks; match their offer, put him in irons, or watch him walk — and if he walks, he turns up on their roster with his record intact and you meet him at the games.

Added nine in-world tutorial cards from the gatekeeper, one per tab, dismissible individually or entirely.

Added **gladiatrices** — 10% of recruits, named from per-origin female pools headed by Achillia and Amazonia from the Halicarnassus relief. They draw a bigger crowd and more fame, delight the noblewoman and irritate the senator. This required a full pronoun pass across four combat engines, every event and the UI, which turned up two real bugs: the pronoun helpers were shadowed by identically-named power variables inside both fight loops ("Blood down undefined shoulder"), and a male Cantabrian chieftain was sitting in the women's name pool.

### v0.16.0 — Rome, and a layout bug that was clipping every screen
**Found the reason content was running off the right edge.** Nothing in the game was `border-box`, so the root container and the sticky header — both `width:100%` with 14px of side padding — pushed **28px past the viewport on every screen**, clipping the standings, the fame column and the last tab. Added a global `box-sizing` reset in both the CSS string and the page shell, `overflow-x` guards, non-shrinking value columns, and a six-tab bar that shares its width properly.

Added **Rome**. A senator puts your house forward for the imperial games once you pass 600 fame; the letter arrives with an explicit warning, and accepting ends the run whichever way it falls. Two weeks on the road, then three bouts against quality 92–99 opponents with half of them sine missione, and your Capuan patrons stripped out of the missio roll — nobody in that box owes you anything. Two of three and the house is made; one or none and it does not come home. A merely good roster triumphs 25% of the time; an exceptional one 89%. Declining costs fame and the senator's regard, and Capua remains the whole of the world.

### v0.15.0 — The melee
Last man standing, six to eight on the sand, one purse. Enter two of your own and you have accepted that they may be the last two — and the editor will not take two victors. It happens 10% of the time with two entered and 20% with three; if they were brothers it costs 18 unrest, guts the roster's morale, and the bond is struck from the record. Entering more men is both the way to win and the way to be made to kill your own. The arena shows the whole field as a strip of names that go struck-through and daggered as they fall, with the two currently engaged rendered below.

### v0.14.0 — Venatio
The morning hunt: six beasts across three tiers, on a third combat engine with **no missio** — a beast does not see a raised finger, and the handlers are slow when the crowd is enjoying itself. A hunting spear is the difference between 84% and 28% against a bear. The men hate being sent, doubly so if they are anyone: a renowned man sent to the beasts costs 22 morale and 7 unrest, and the whole ludus hears about it. Hunts pay well and build house fame while giving the man almost nothing — the mob remembers the beast. `<Beast>` draws lion, bear, boar, leopard, aurochs and wolves from one quadruped skeleton.

### v0.13.0 — Betting, and the standalone layout bug
**Found a real bug in the downloadable build.** The game used Tailwind utility classes — `flex`, `grid`, `grid-cols-N`, `gap-N`, `items-center` — which the Claude artifact runtime provides but the standalone `index.html` never had. Every grid and flex layout in the downloaded file had been silently collapsing to plain block flow since v0.1. The 16 utilities the game actually uses are now defined in the CSS string, so both builds render identically. Regimen and drill buttons rebuilt at a 46px touch target with full words and live stat values instead of four-letter stubs.

Added **the bookmakers**: wager on your own man at calibrated odds, or stake against him and have him go down. Odds required an odds-scale sharpening exponent of 8.0 to match reality and are now accurate within 2.5 points; the 12% vig means backing your man is a slow loss. Fixing pays about 3× an honest bout — and three of three houses that fixed every fight were destroyed inside 90 weeks, two by rebellion.

### v0.12.0 — Pair bouts, and the spearhead
Fixed the **hasta**: its head was modelled apex-to-the-rear, so the spear pointed back at the man carrying it. Trident prongs gained points too, and a regression test now asserts every pointed weapon's apex is forward of its base.

Added **pair bouts** — two of yours against two of theirs, on a separate team engine. One man leads each exchange while his partner presses in behind, and how much that partner is worth is decided entirely by what the two of them are to each other: brothers 75%, strangers 49%, rivals 36%. Choosing who fights beside whom is now the most valuable decision on the card. The arena renders four fighters in formation with four health bars.

### v0.11.0 — Patrons
`favor` stopped being a number and became four Romans with names. A magistrate and a merchant know you from the start; a noblewoman notices at 60 fame and a senator at 220. Each keeps his own standing, decays if ignored, and periodically **wants something** on a deadline — a death at the next games, a crowd on its feet, a beaten man spared, your best fighter sold to him, an invitation to the villa. Meeting a want buys real standing; letting it lapse is remembered. The payoff is the thumb: a patron at 95 cuts a fallen man's chance of dying from 88% to 39%, and above 70 he intervenes visibly from the editor's box. Parties now raise every patron at once and settle any outstanding invitation. Save `ver: 9`; an existing house's `favor` is inherited as its patrons' opening standing.

### v0.10.0 — Training regimens
One focus per man became a real weekly decision. Four regimens: **the palus** (safe, slow), **sparring** (paired, much faster, and someone can get hurt), **conditioning** (builds wind and sheds fatigue), and **rest**. Sparring pays most against a better man — the learning bonus scales with the gap — and the cell block decides the risk: brothers look after each other at ×0.6 injury, rivals go too hard at ×2. Pairings self-repair when a partner is lost. Sparring also *builds* the cell block: strangers become brothers at the post, and rival pairs beat the feud out of each other 28% of the time. Save `ver: 8`; old `focus:"rest"` migrates to `regimen:"rest"`.

### v0.9.0 — The cell block
Men are no longer strangers to each other. Bonds and feuds form at the palus, weighted by shared origin and shared drills, and grow over years in the same room. What happens to one man now lands on whoever was close to him — a brother's death costs 19 morale and spikes defiance where a stranger's costs nothing. Selling a man sours his friends; freeing one gives them hope. The `feud` event leaves a permanent tie, and letting two men settle it with wooden swords turns a grudge into respect. Crucially, the rebellion now picks its ringleader by who can *rally* rather than who is angriest, and his brothers rise with him — a bonded house produces a revolt three times the size. New `plea` event. Save `ver: 7`.

### v0.8.0 — Save files
Three independent save slots behind a **Records** title screen, each with house name, week, fame, roster and time since last kept. Fallen houses stay on the shelf until struck out. A single legacy save is adopted into slot 1 automatically. Added **transfer codes** — lift the whole ledger out as base64 and restore it into any slot, validated and migrated on the way in. Also corrected the roadmap's Save section, which had been stale since `ver: 4`.

### v0.7.0 — The doctore
The flat `trainMult` bump is now a man. Hire a doctore from candidates who refresh with the market — each with a stat specialty, a skill tier, a fee and a weekly wage — or, far better, **grant the rudis to a champion and have him ask to stay**. Freed men reach skill 96 against a hired cap of 82, charge no fee and half wage, calm the cells three times as much, and stand with the house on the Night of Fire. Whether they offer at all depends on how you have run the ludus: 85% at low unrest, 15% at high. A released veteran may also stay. Dismissing a man who chose you costs unrest and morale. Save `ver: 6`; legacy `trainMult` preserved on old saves.

### v0.6.0 — Aging, scars & retirement
`age` now drives a real career arc: prime 23–28, training falling off after, and a weekly decay that takes `agi`/`end`/`str` while leaving `tec`/`sho`/`dis` untouched. Wounds no longer heal clean — injuries remember where they landed, healing can leave a permanent mark on the figure, and a second cut to the same place lowers that stat's training ceiling for good. **Retirement** added as a third exit beside death and the rudis. Market shows Young/Prime/Past-peak/Veteran with prices to match; veterans arrive pre-scarred and craftier. Status list gained `retired`, centralised behind `isGone()`. Save `ver: 5`.

### v0.5.2 — Themed UI
Removed all native browser chrome. `<select>` dropdowns → in-game picker overlays showing each item's description, stats, style fit, and owned count. `window.confirm` → themed modals with written-in-world consequences. Arena fighter selection is now tappable cards showing each man's carried kit.

### v0.5.1 — Gear preview
Live `<Fighter>` portrait on the gladiator page, updating as slots change.

### v0.5.0 — Equipment
29 items across 4 slots with real stats feeding power, damage, stamina, and crowd. Armory tab, per-man equip panel with kit totals, style-affinity penalty. Sixth class **Dimachaerus** added as the native home for twin blades. `<Fighter>` now renders equipped kit rather than class. Opponent kits randomized by tier. Combat model reworked so guard contributes to winning exchanges, not just soaking damage. Save `ver: 4`.

### v0.4.1 — Fighter geometry
Fixed strikes traveling *backward* (arm offset was negative). Fixed inverted stance spacing; moved to center-anchored pixels so striking distance holds at any width. Added forward eye-slits and nose guards, sandalled feet, victor pose.

### v0.4.0 — Visual battle sim
Replaced the text ticker with an animated arena: rendered gladiators, crowd tier, blood spurts at the struck body part, permanent wound marks, screen shake, momentum meter, pause/2×/skip. Engine rewritten to emit structured beats. Added class attack repertoires, body-part targeting (injuries now match where he was hit), and momentum.

### v0.3.0 — Rebellion arc + packaging
Replaced instant game-over with the three-stage Whispers → Stolen Steel → Night of Fire arc, a named ringleader, three resolutions, and the escaped-Spartacus chronicle. Shipped the standalone `index.html` build and repo zip.

### v0.2 — Rival houses
Three persistent AI ludi with living rosters, grudges, rematches, a Capua standings table, and grudge-gated sabotage events.

### v0.1 — MVP
Weekly loop, roster, training, fight sim with missio, market, parties, feasts, events, injuries, permadeath, fame ladder, the rudis.

---

## To-do

**Done**
- ✅ Core weekly loop, training, fatigue, morale, injuries, upkeep
- ✅ Fight sim with class counters, tactics, crowd, missio, three stake levels
- ✅ Market, parties, feasts, random events, chronicle
- ✅ Permadeath and the rudis
- ✅ Rival houses with persistent rosters and grudges
- ✅ Three-stage rebellion arc with three resolutions
- ✅ Animated arena battler
- ✅ Equipment with stats, rendered on the fighter
- ✅ Fully themed UI, no native widgets
- ✅ Standalone single-file build + repo zip
- ✅ Aging curve, decline, and retirement as a third exit
- ✅ Permanent scars with stat ceilings, drawn on the figure
- ✅ The doctore — hired or freed, with a specialty and a wage
- ✅ Three save slots, a records screen, and portable transfer codes
- ✅ The cell block — bonds, feuds, and a rebellion that recruits along them
- ✅ Training regimens — palus, sparring pairs, conditioning, rest
- ✅ Patrons as named people, with wants, decay, and a hand on the thumb
- ✅ Pair bouts, where who you send together decides the fight
- ✅ Betting and fight-fixing, with calibrated odds and a discovery risk
- ✅ Venatio — six beasts, no missio, and a morale cost the cells remember
- ✅ The melee — last man standing, and the price of entering two of your own
- ✅ Rome — the imperial games, and the run's two real endings
- ✅ Global border-box; no more horizontal clipping on any screen
- ✅ Rival poaching, and defectors who reappear in their colours
- ✅ Nine in-world tutorial lessons
- ✅ Gladiatrices, with a full pronoun pass
- ✅ Familia rename and gender-neutral collective nouns
- ✅ Accessibility: focus, motion, semantics, live narration, AA contrast
- ✅ Sound, synthesised in-browser with no asset files
- ✅ Five buildings, three levels each, as the late-game coin sink
- ✅ The medicus — mend, surgeon, or work him through it
- ✅ The festival year — six festivals with real character, on the aging clock
- ✅ House reputation — butchers, showmen, technicians, merciful
- ✅ Named lanistae with mechanical personalities
- ✅ Ambitions — what each man privately wants
- ✅ Five founding scenarios
- ✅ The auctoratus — the free man, and what it costs when he leaves
- ✅ The annals — a permanent record of everyone who ever served
- ✅ One word from the box — a single intervention mid-bout
- ✅ The crux in the hunt and in pair bouts
- ✅ Nemesis fighters, named by your own familia
- ✅ Gear wear, the armourer's repairs, and named forged pieces
- ✅ Ambitions that speak, escalate, and are given up on
- ✅ Self-contained layout CSS — no Tailwind dependency in the standalone build

**Next up — deepening what exists**
- **The crux in the melee.** The single and pair engines and the hunt all hold now; the melee does not. Its version is different — pulling *one* man out of a running free-for-all while the rest fight on.
- **Patron favours you can call in.** Standing is passive — it sits on the missio roll and gates Rome. Make it spendable: the magistrate quashes a grudge, the merchant buys a man at a fair price, the senator moves a date, the noblewoman spreads a story that costs a rival fame.

**Next up — new ground**
- **The circuit.** Capua is the whole world until Rome, which is a long way between structures. Pompeii and Neapolis: a week's travel, local crowds with their own taste, local houses who have never heard of you, and purses that do not care about your Capuan standing.
- **The collegium.** Historically real — gladiators paid into a burial society so they would be interred under their own name. Fund it and a death costs a fraction of the unrest it does now, because the cells know what happens to them afterward. The cheapest humane thing in the game, and an ongoing cost rather than a purchase.
- **The lanista.** You have no character at all. An age, a health, and traits earned by how you actually play — the game already knows whether you are a butcher or merciful. A lanista who gets old, or hated, or sick, and a personal ending that is not just the house's.
- **The Primus of Capua.** One gladiator in the city holds the title. Challenge for it, take it, then defend it against everyone who wants it — including your own rising men. The mid-game structure between the local games and Rome, which is currently a long empty stretch.
- **The aftermath.** Opening the gates sets `spartacusAtLarge` and produces five chronicle lines, then nothing. Make the war you started come back: requisitions, refugees, a magistrate who remembers whose house he came from, and eventually a choice about the man you let go.

**Later**

---

*Last updated: v0.28.0*
