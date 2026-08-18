# LVDVS — Roadmap & State

Gladiator-school management sim. You are a lanista in Capua: buy men, train them, send them to the sand, climb the standings against three rival houses, and manage the fire in your own cells. Football-manager loop wrapped around an animated round-by-round arena battler, with permadeath and a three-stage rebellion arc.

**Stack:** React 18, single-file game, esbuild → one self-contained `index.html`. No framework, no router, no CSS lib. Runs identically as a Claude artifact and as a downloadable HTML file.

---

## Architecture

```
ludus/
  src/ludus.jsx      the entire game (~22,900 lines, default export <App/>)
  src/main.jsx       mount point, 4 lines
  build.js           esbuild bundle + window.storage shim → index.html
                       --test writes an instrumented dist/ build instead
  index.html         built artifact, ~1.16 MB, fully self-contained
  manifest.webmanifest, sw.js, icons/   the PWA shell, version-stamped at build
  package.json       version lives here — bump it, the service worker reads it
  test/              the checks, the harness, and the coverage sweep
  ROADMAP.md         this file
  INSTRUCTIONS.md    how to work on it
```

`src/ludus.jsx` is one file in rough dependency order — constants and tables, then
the systems that read them, then the four fight engines, then week resolution, then
the UI. It is not sectioned by banner any more; it is navigated by grep. The pieces
worth knowing where to find:

| What | Where to look |
|---|---|
| Styling | the `CSS` template string at the top, keyframes included |
| Equipment | `GEAR`, `SLOTS`, `kitMods`, `kitFor`, `wearKit` |
| Saves | `newGameState`, `migrate`, `SAVE_FIELDS`, `MAN_FIELDS`, `REPAIRS`, `SAVE_VER` |
| Rival houses | `RIVAL_SEED`, `makeRivalFighter`, `rivalWeekly`, `pickRivalOpp` |
| The four engines | `simulateFight` (12 rounds), `simulatePair` (16), `simulateMelee` (18), `simulateVenatio` (14) |
| What a bout does to the house | `doFight`, `doPairFight`, `doMelee`, `doVenatio`, `boutAftermath` |
| Events | the `EVENTS` table (57 entries), `pickEvent`, `updateRebellion` |
| The week | `endWeek`, and its phases `menWeek`, `ludusLedger`, `heldQuestions`, `weekReckoning` |
| The player's actions | module scope, all of them — `sellMan(d,id,price)`, `throwFeast(d)`, and fifty-odd more |
| UI | `Fighter`, `FightModal`, and the App component (`takeUpTheHouse`) |

**Two rules the file lives by.**

Every action a lanista can take is a **function of the save**, at module scope, and
exposed on the test handle. The closures inside the App are the React half only:
read the form, call one of these, set the panel that follows. It used to be the
other way round, and the cost was not tidiness — nothing outside a mounted component
could sell a man or throw a feast, so no check could drive a house through a year.

And **no function grows past 200 lines** without being written down. The `bulk`
check measures every top-level definition and fails on a new one over the line; the
exceptions each carry a ceiling and a reason. `simulateFight` is the interesting
one — it stays whole because a bout is a state machine whose state is the closure,
twenty mutable bindings all written by the round loop, and the comment above it says
where to cut it if anyone ever does.

---

## Core loop

One turn = one week.

1. Set each man's **regimen** — one of eight drills, a sparring partner, or rest.
2. Take a bout. The pits are always open; the Capuan bill runs on the festival year
   once fame ≥ 25, and a tour down the coast has a card of its own.
3. Spend — gear, the block, the works, a feast, a patron's want, a rung of the ladder.
4. Answer the week's one question, then **End Week**.

`endWeek` runs in four phases, in this order, and the order is load-bearing:

| Phase | What it does |
|---|---|
| `menWeek` | upkeep accrued, the years turned, wounds mended, the week's work done, what age takes |
| *(the subsystems)* | fifty-odd `xWeek(d)` calls — feuds, patrons, rivals, the coast, the ladder, Rome |
| `ludusLedger` | every wage and bill, the city's liturgy, and what the week does to the temper of the cells |
| `heldQuestions` | questions raised earlier and held, so a named man on a named day beats a random beat |
| `weekReckoning` | the fame rungs, and whether this is still a house |

---

## Testing

```
npm test              the fast tier — about half a minute
npm run test:all      every check, fast and slow — about thirteen minutes
npm run coverage      not what passes, but what no check ever touches
```

**63 checks.** Most read into the game through a test handle and answer in seconds; a
handful drive a real browser through the real screens. Every one of them exists because
of a bug that shipped, and the comment at the top of each says which — that comment
is the durable part, not the numbers inside it. See `test/README.md` for the table.

`node build.js --test` writes `dist/test.html` with `window.__LVDVS` attached. The
handle sits behind `process.env.LVDVS_TEST`, which esbuild folds away in a shipping
build, so what ships cannot carry it even by accident. `dist/` is gitignored and the
runner rebuilds the shipping `index.html` on its way out.

Three things worth knowing before adding one:

- **`survive` runs alone.** It opens five browsers and plays five houses at once.
  Sharing a lane put seven Chromiums on four cores and it started inventing failures
  — twice. A check may declare `exclusive`.
- **The seeded RNG correlates draws within a page load.** A win rate at n=1500 swings
  about two and a half points between identical runs. Bands are wide on purpose;
  assert direction, not targets. A check nobody trusts is worse than no check.
- **Check the instrument before you believe the finding.** More findings in this
  project have turned out to be faults in the probe than faults in the game: probes
  that force-fed gold, took the richest bout every week, never courted a patron,
  counted Rome as a Capuan card, or wrote `guard` where the engine reads `def`.
  Every one of them produced a confident, wrong conclusion first.

---

## Systems

### Gladiators
Six visible stats (`str agi end tec sho dis`), plus hidden `potential`, `heart` (missio only), and `defiance`. Seven origins with stat modifiers and name pools. Eight traits. Status: `active | injured | away | dead | freed | escaped | retired` — use `isGone(g)`, never a hand-rolled list. Roster cap grows with the lanista's standing — `CELLS_BY_RANK = [8,8,9,10,11,12,13,14]`, read through `cellsCap(d)` and `rosterFull(d)`; never count the roster by hand, and never forget an injured man is still in a cell. Nickname awarded at **5 wins**.

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

### The aftermath
Opening the gates used to set a flag and print five lines. It now starts a war that takes about two years to come back and find you.

**Four stages**, on the same clock as everything else:

| Week | | |
|---|---|---|
| 1 | *A band in the hills* | A villa near Nola, a burned press. Nobody is calling it a war yet. |
| 11 | *An army* | Thousands. **Every man in your cells has worked out that it was possible** — defiance floors at 18. The block runs 25% dearer. |
| 27 | *The legions* | Eight of them, and Crassus has bought the command. **−20 fame and −14 with every patron**: nobody has forgotten which gate he walked out of. |
| 44 | *The road* | Six thousand crucified from Capua to Rome, at intervals, so the whole of it can be walked. The block collapses to 55% and the men on it were taken in the south. |

Standing leaks the whole time — measured at **0–38 after a full war** against a normal 35–60.

**Four events come to your gate.** *A Levy for the South* wants coin, and has your name at the top of the second column. *They Want Bodies* wants your strongest man for the legions, and is offering not to remember that he had to ask twice. *Word From the South* is a messenger before dawn: he remembers who opened the gate, there is a place in the column, and there is coin if you look away while some of your men walk — capped so it never empties the house. And *The Road to Rome*, where you can walk the first mile yourself, keep the gate shut, or **march the familia out to look at it**, which drops defiance 22 → 6 and works exactly as well as you were told it would.

### The collegium
A burial society, and one of the few things in the game that is history rather than invention. Roman *collegia funeraticia* took small regular dues and buried their members properly; gladiators formed them, and we know it mostly from tombstones raised by a man's society giving his name, his fighting style, and his record of bouts.

**180d to found, then 3d a week for every man on the roster.** Founding it is worth +9 morale across the yard, −5 unrest and 8 toward a merciful reputation, and it shaves 0.4 off unrest every week it is paid for.

Its real work is on the day somebody dies. **A burial costs 8.5 unrest without it and 4.8 with it**, it halves what a death takes out of the lanista's own health, and the man's annals entry reads *"Buried under his own name."* All six death sites route through it — the sand, the beasts, a melee, a pair bout, and both ways to die the night the cells rise.

**It is designed to be easy to cut.** A year of dues on a small house is about 450 denarii for which *nothing visible happens*, right up until the month you bury three men. Stopping costs 7 unrest and 12 morale if nobody has needed it yet — and **14 unrest and 22 morale if they have**, because every man still in the cells watched those burials.

*The Stone* — bury ten men under the society's name — is the eighteenth feat.

### The lanista
You were a number in the corner of the screen for thirty-two versions. You have a name now — three names, in the Roman way — an age of 34 to 46, and a body that the work takes pieces off.

**Health is driven by how you run the place, not by the calendar.** Age past 42 erodes it slowly; a house above 60 unrest erodes it faster; the rebellion's later stages erode it faster still; and **every man you bury costs 1.3** wherever he dies. A bath house, a feast, and an ordinary quiet week put a little back. Measured over 195 weeks, a house of butchers with fifteen men in the ground left its lanista at **health 8, age 55, ailing**, while careful houses stayed hale.

**Six traits, all earned by play rather than chosen:**

| | Earned by | Does |
|---|---|---|
| **Hard** | fifteen weeks of a butcher's reputation | defiance drifts down 0.3, morale down 0.2 |
| **Merciful** | fifteen weeks of a merciful one | unrest falls a further 0.3 a week |
| **Shrewd** | five wagers won | the bookmakers' cut drops from 12% to 6% |
| **Respected** | standing above 65 for twenty weeks | patrons cool at half speed |
| **Marked** | being caught arranging a bout | patrons cool at nearly double |
| **Ailing** | health broken below thirty | training slows 8% |

At zero health the run ends on **THE STAIRS TO THE GALLERY** — a personal ending rather than the house's. *"The doctore finds him. The men are told at the post and go back to it, because there is nothing else in the day for them to do."*

The header shows your own condition once it drops below 45, which is the point at which you should start caring.

### The circuit
Three towns down the bay who have never heard of you.

| | Road | Purses | The crowd |
|---|---|---|---|
| **Pompeii** | 1 wk | ×1.20 | Wants blood — 30% of its cards are sine missione |
| **Neapolis** | 1 wk | ×1.05 | Greek, and can tell a feint from a flinch |
| **Puteoli** | 2 wk | ×1.40 | A port full of sailors with money and nothing to spend it on |

Travel costs a week each way and 25d, and while you are gone **Capua's business stops**: no market, no doctore, no festivals, no funeral games, no primacy — and no poaching, because nobody can reach your men on the road.

**Your standing does not travel.** Away, the missio roll uses *local* standing instead — 12 at nothing, rising with `known`, which grows 7–12 a win and more if the town's taste matches your reputation. On top of that a stranger takes a **−19 penalty** to the roll, decaying to nothing as they learn the name:

| Your man goes down | Spared |
|---|---|
| At home, well regarded | 100% |
| A stranger in Pompeii | **56%** |
| Known there (25) | 89% |
| Known there (50+) | 100% |

So the first tour is genuinely dangerous and the third is a payday. Local standing persists between visits, and at 30 and 60 it opens tier-2 and tier-3 cards.

### Feats
Seventeen things a house does once and is afterwards, checked every week. Each pays coin or fame on the day, and eleven of them leave a **permanent perk** behind — six distinct ones that stack:

- **Training +6%** · **unrest falls 0.45 faster every week** · **+1 fame a week**
- **gear 8% cheaper and wears 15% slower** · **patrons warm half again as fast** · **a death costs the familia 30% less morale**

They range from *First Blood* through *The Wooden Sword* (free a man), *The White Cloth* (stop a bout to save a life), *A Word Kept* (promise a man his one wish and deliver it), *The Numidian* (kill a lion), *The Circuit* (win in all three towns), *A Quiet House* (thirty weeks under twenty unrest), to *Ten Years a Lanista* and *The Sand at Rome*. Most of the perks sit on the merciful ones, which is deliberate.

### The Primus of Capua
One man in the city holds it, and at the start of a run he is not yours. `d.primus` tracks the holder whether he is in your cells or another house's; among the rivals it changes hands on its own, so the city's title is alive with or without you — 14 times across 300 weeks in testing, between four different men.

**Challenging** needs a man at **5 wins and 35 renown** — calibrated against 2,906 man-weeks of real play, which puts a qualified man on your roster about 7% of the time. The offer arrives on the games card at tier 3 for a purse near 1,400d, sometimes sine missione.

**Holding it** pays +3 fame a week, feeds the holder's renown, warms every patron by a quarter point, and marks him everywhere. Taking it is worth 60 fame, 8 standing with every patron, and lifts the whole house.

**And then they come for it.** While you hold it, 45% of games cards carry a defence against a tier-3 challenger with 7–14 wins. Lose one and the title goes, at −25 fame and a morale hit across the familia. If the holder dies, it simply leaves.

**The man four doors down.** Six weeks in, the second-best eligible man in your own cells wants the bout — the one against someone who sleeps four doors down. Make the match and **the challenger takes it 42% of the time**, whichever way it goes the tie between them is struck from the record, and the loser has to live in the same building as the answer. Refuse and he takes 20 morale, 16 defiance, and it **breaks his ambition outright**. Tell him to wait and he goes back to the post and hits it harder than the wood deserves.

### Calling in a favour
Standing has only ever sat on the missio roll and gated Rome. Each of the four patrons can now do **one thing nobody else in Capua can**, and it is spent from your standing with that man — so a favour costs you the very thing that keeps your men alive when they fall.

| | Costs | Waits | Does |
|---|---|---|---|
| **Magistrate** | 30 | 22wk | Has a word with the angriest rival house — **grudge −55**, and cancels any poaching attempt or non-lethal nemesis from them |
| **Merchant** | 28 | 26wk | **Carries your entire upkeep for ten weeks** |
| **Noblewoman** | 26 | 20wk | A story at the baths costs the leading rival **60–100 fame** — and they work out who started it (+18 grudge) |
| **Senator** | 34 | 30wk | **+45–80 fame**, and the imperial invitation will come **110 fame early** |

Each has its own gate: the magistrate needs somebody to actually be angry with you, the noblewoman needs a rival worth slandering. The button says which of those is missing.

Measured over 120 weeks, a house that calls in everything the moment it can finishes on **7–32 standing** against **31–60** for one that never asks — powerful, and paid for out of the same pocket that buys mercy on the sand.

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

### The doctrine of the house
Reputation is something you drift into. A doctrine is something you **declare**, in front of Capua, and then have to live inside. Six of them, each costing about as much as it gives:

| | | |
|---|---|---|
| **The Heavy Shield** | 400d | Murmillo and secutor train **×1.22**, everything else **×0.86**. Shields and armour 18% cheaper. **Scutarii +22, parmularii −18** |
| **The Small Shield** | 400d | The mirror of it — thraex, hoplomachus, net and twin blades. Blades 12% cheaper |
| **The Red School** | 300d | Purses **×1.18**, sine offers **11% → 33%**, +0.55 unrest a week, and your own health goes 43% faster |
| **The Long Apprenticeship** | 500d | Training +12%, **training injuries 49% → 35%**, purses ×0.90. The front rows adopt you |
| **The Open Hand** | 350d | Missio **+14**, sine offers **→ 0%**, unrest falls, regard climbs, fame ×0.90 |
| **The Travelling School** | 350d | Local standing builds **70% faster** and being a stranger is **half** as unforgiving |

Declaring lifts the yard 6 morale and swings the stands hard. **Turning the house over later costs 1.8× the fee, twenty fame, six unrest and eight morale off every man** — *"everything the men were taught last year is now the wrong thing, and Capua watches a lanista change his mind in public."*

Measured: at standing 8 a fallen man is spared **74% with no school and 100% under the Open Hand**; a bronzed scutum costs **320d normally and 262d** in a heavy-shield house.

### Two of your men, in front of you
The cells have kept feuds since v0.19 and not one of them ever arrived. This is the morning it does: both of them eight feet apart in the training square, the whole familia stopped working to watch, *"the doctore has not moved and is not going to. This is yours."*

It ripens on tie strength, defiance and low morale, and fires at **20% a week** once a feud is genuinely bitter — flagged in the agenda before it does. **The cause is drawn from what actually happened**: one has taken the other's place on three cards, one killed a man the other trained beside, one was condemned and the other chose this, one has worked out who has been carrying the cells' talk up to the house, or one is plainly your favourite.

| | Feud | Unrest | |
|---|---|---|---|
| **Put them on the sand** | **gone** | −5 | Wooden swords, the doctore counting. **15%** somebody is hurt. The rest of the yard lifts |
| **Take one off the card for a month** | 70 → 40 | +3 | He is benched, off every card, −6 regard. *"It stops it happening today, which some weeks is the whole of the job"* |
| **Say one is in the right** | 70 → **84** | +4 | +14 and −21 regard, and **every bystander loses 3** — they have learned this is a house where the lanista picks |
| **Walk away** | 70 → **88** | **+9** | **42%** somebody is hurt, both lose 11 regard, the yard gains defiance |

Only one of the four actually settles it, and it is the one this trade would reach for.

### The arena view
The animation had not changed since v0.4, when there was one crowd and one floor.

**The stands are drawn as four blocks now**, one per faction, each in its own colour — the parmularii in purple, the scutarii in bronze, the mob in red, the front rows in green. A block's brightness and how hard it bobs come from that faction's actual standing with you, so a house the scutarii adore and the parmularii despise *looks* like one from the first frame.

**And the venue is drawn rather than captioned.** Six grounds with their own floor and border: the pit's near-black earth, the courtyard's marble, the field's turf, the amphitheatre's sand, the imperial gold, the harbour's grey. The crowd thins with the place — **thirty heads in the amphitheatre, fourteen in a magistrate's courtyard.**

Verified by rendering the component through `react-dom/server` and asserting on the markup: nine checks covering head counts, faction colours, and that a partisan crowd is visibly brighter than an indifferent one.

### What carries between houses
Feats are per-run. This is the other book: what **Capua remembers about you as a lanista**, written by every house you have ever run and read by every house you run after. It is stored outside any save slot and **it survives losing**, which is the entire point.

| | Needs | Gives |
|---|---|---|
| **The Wooden Sword** | 12 men freed | new men arrive with **+6 regard** |
| **The Long Bill** | 60 men buried | the block fears you — bought men **6% cheaper** |
| **A Thousand Afternoons** | 900 bouts | **+40 fame** and you already know the week |
| **The Primacy** | held 3 times | patrons start **8 warmer** |
| **The Imperial Sand** | 1 bout won at Rome | a **senator already watching** |
| **The Long Tenure** | 40 years across all houses | your lanista starts **three years younger** and healthier |

A house that burned to the ground in week 30 still contributed its forty bouts, its freed man and its two years. Founding with everything earned starts you at **45 fame against 5, standing 46 against 32, a lanista of 41 in better health, and a block averaging 444d against 524d.**

The title screen shows the tally, including the best man any of your houses ever had, by name.

### Mastery, and a second style
Six stats forever is not a career. A man who has been at this long enough now stops getting bigger and starts getting particular.

**Mastery** comes at **12 victories and 55 renown** — named, not automatic, and the agenda tells you when he has earned it. Each style has its own, with its own line: *The Wall*, *The Gap*, *The Length*, *The Patient Man*, *The Cast*, *Both Hands*. It is worth **61% against 51%** on the sand, plus six crowd, and it belongs to *that style* — a master of the hoplomachus fighting as a murmillo gets none of it.

**A second trade** needs a master, a doctore, and **340d plus his renown**. He goes to the far post for **eight weeks off every card** — a master of one style spending two months as a beginner in another. He comes back able to fight both, switching between them any week he has not already fought.

> *"He comes back off the far post a murmillo, and keeps the hoplomachus in his hands for whenever it is wanted. There are not five men in Campania who can do both."*

That makes a long-lived gladiator into a thing rather than a bigger number, and it gives the venue and footing systems something to answer — a man with two trades can be put into whichever the ground favours.

### The sacramentum
*Uri, vinciri, verberari, ferroque necari* — to be burned, to be bound, to be beaten, and to be killed by the sword. It has been a word in the vocabulary since v0.1. It is a moment now.

Every man who joins the house owes the oath, and it appears in the agenda until it is said. Three ways to do it:

| | | Him | The yard |
|---|---|---|---|
| **Get it said** | — | — | — |
| **Properly, with the familia stood down** | 40d | +9 | +3 morale |
| **With wine afterward** | 150d | +16 | +7 morale |

**And it lands differently depending on what he is.** A free man swearing it himself gets ×1.4; a condemned man, who has no say in it at all, gets ×0.6. From a regard of 50, the full ceremony leaves a **free man at 72, a bought man at 66, and a condemned man at 60** — because *"a free man agreeing to be burned, bound, beaten and killed by the sword"* is a different act from words said over property.

It goes into his memory, so his page carries the oath in the form it was given.

### Damnatio ad ludum
Rome had three sentences involving the arena. Two were executions. **This one was not** — condemned to the school, and a man who fought out his term earned the wooden sword from it. That distinction is the whole feature.

A clerk arrives with one or two men and their paperwork: arson in the insulae, killing a freedman in a wine shop, striking his master and refusing to say why. **The city pays you 105–150d to take them**, and warms the magistrate by 8; sending the clerk away cools him by 7.

**What arrives** is a man of about 24 average stat against a bought man's 46, with morale in the twenties, almost no defiance — he is not defiant, he is finished — and a sentence of **10 to 18 bouts**. He costs nothing and **cannot be sold**: he belongs to the sentence until it is served.

**The yard does not want him.** Every other man loses 5 morale and 4 regard the day he arrives, and unrest rises 4. And his death is worth **0.72 of the lanista's health against 1.30 for a bought man** — Capua does not mind losing him, which is exactly the thing your own cells notice.

**And then he serves it out.** Every bout counts down; at zero the paper is discharged, he gains 26 regard and 24 morale, the yard lifts, unrest falls 6, and the house gains toward a merciful reputation. *"He is a gladiator of this house like any other, which is a sentence of a different kind and he knows it."*

### The gatekeeper, brought up to date
Nine lessons written when the game had a third of its systems. **Twenty-eight now**, and — the actual fix — **seventeen of them wait for a condition** rather than firing on a tab.

A new house is offered exactly six, one per tab, and nothing else. The rest arrive when the thing they explain does. Measured over a 91-week campaign:

> wk2 unrest · wk3 the agenda, the drills, the venue, the moneylenders · wk5 watching an opponent · wk9 form · wk10 the seasons · wk12 regard, the stands · wk13 refusal · wk14 the aedile · wk15 the record book, the collegium · wk16 munera · wk21 the circuit · wk32 gear wear · wk33 the staff

Twenty-seven of twenty-eight taught across that run, paced at roughly one a week early and one a month later. The heir lesson never fired, correctly — it waits for a lanista who is 48 or failing.

The new lessons cover training and strain, regard, form, refusal, the agenda, seasons, the record book, the heir, the factions, venues, watching an opponent, the circuit, the moneylenders, the aedileship, the collegium, munera, the seller's account, the staff, and gear wear.

### The overhaul
Thirty versions of adding features meant thirty versions of adding panels to columns. The home tab carried thirteen; opening it told you everything about the house and nothing about what to do.

**This week** replaces them. One prioritised list of everything actually wanting an answer, each row tapping through to the tab where the answer is, sorted **now / soon / when you can** and red-bordered when something is due. It reads from twenty different systems: the pending event, deadlines inside two weeks, patron wants about to lapse, Rome's window, a man refusing, a man who has given up asking, strain, steel about to break, an unburied man, the election, the card, a poaching attempt, a debt getting away, a doctore waiting, unrest, and a failing lanista with no heir named.

Above it, the four permanent situation panels — the war, the primacy, a nemesis, the aedile, the circuit — collapse into a **single row of compact chips** that only appear when they apply.

**Moved:** hiring the medicus and armourer went to the Market, where you acquire people. The standings went behind a tile with the other reference sheets, of which there are now six.

The home tab is a strip, an agenda, six tiles and five panels. Verified across **1,500 houses × 8 weeks** with zero malformed or thrown agendas.

### Seeded runs
Every roll came out of `Math.random`, so no house could be handed to anybody else and no measurement could be repeated. There is one **mulberry32** behind the same `R()` that everything already called, so nothing else in the codebase changed.

A seed is eight characters in two groups — **`7KK9-UFV4`** — drawn from an alphabet with no I, O, 0 or 1, so it survives being read out loud. Leave the field empty when you found a house and you get one nobody has run.

**What it guarantees.** The same seed builds the same Capua: the same three men in your cells, the same lanista at the same age, the same rivals, the same block. Verified identical across repeated founding, and a 40-week campaign of identical play reproduces to the denarius. The generator's position is written into the save on every change and restored when you pick the house up, so it survives a reload mid-campaign.

**What it does not.** A seed fixes the world, not the story. The moment your choices differ from someone else's, the two houses diverge, because rolls are consumed in a different order. It is the same opening position, not the same run.

Quality: 200,000 draws across ten buckets came out **19,738 to 20,255** — a 2.6% spread.

The seed showed its worth immediately by making a pre-existing bug reproducible: a house could be founded with **two men of the same name**. Fixed — new gladiators now draw from names not already taken on the roster or the block, and 3,000 fresh houses produce zero collisions.

### Form
Morale is how he lives. Momentum is inside one bout and resets at the horn. **Form is the four weeks between them** — how the last few afternoons went, carried out to the next one.

Five words on his card: **in form · sharp · level · off his stride · shaken**. A win moves him +18, +24 at tier 2 or above; a loss −22, being carried off another −13, killing his man +7. Three wins then a loss and an injury runs 0 → 18 → 36 → 54 → 32 → 19, which is a man who has stopped being frightening without being a wreck.

**It is deliberately small.** Power ×0.964 to ×1.036 and a shade off his stamina drain, which measures as an **8-point win-rate spread** at the true extremes — half what gear is worth and two-thirds of a good read. It is felt at the edges, which is where it belongs, and a man at the extremes has earned it with four or five straight results.

**And it fades.** Proportional decay puts half of it away in two quiet weeks and all of it in eight, so it is genuinely short memory rather than a sixth slow-drifting stat. His page lists what put him there — *"Lately: beat Gannicus, beat Oenomaus, carried off against Crixus"*.

An opponent's bad month is also a **tell** you can pay to see: *"He has had a bad month and it is on him. He starts slowly now, and he did not used to."*

### Venues
Every bout in this game was fought in the same rectangle. There are **nine places** now, chosen by the kind of bout, and each changes it.

| | Crowd | Footing | Missio | Fame |
|---|---|---|---|---|
| **The pit behind the ludus** | −22 | 0.88 | −5 | ×0.72 |
| **The forum stands** | +2 | 0.97 | +3 | ×1.00 |
| **The amphitheatre** | +9 | 1.00 | — | ×1.15 |
| **A magistrate's courtyard** | −16 | **1.12** | **+12** | ×0.86 |
| **A field outside the walls** | −9 | **0.80** | +6 | ×0.92 |
| **The stone bowl** (Pompeii) | +12 | 1.00 | −3 | ×1.10 |
| **The harbour ground** (Puteoli) | +6 | 0.91 | −4 | ×1.05 |
| **The Greek theatre** (Neapolis) | +4 | 1.06 | +8 | ×1.08 |
| **The imperial sand** | +20 | 1.00 | −2 | ×1.40 |

**Footing is the mechanic.** It scales what a man's speed and precision are worth, so the ground decides which of your men should go out:

| | A quick man | A strong man |
|---|---|---|
| A magistrate's courtyard (marble) | **52%** | 48% |
| The amphitheatre | 46% | 54% |
| A field outside the walls (turf) | **36%** | **59%** |

They cross over: the courtyard is the only place the quick man is favoured. At footing 1.00 the power formula is arithmetically identical to before, so nothing that was balanced has moved.

A courtyard of forty people who have eaten well is also the most merciful floor in the game, and the pit behind your own ludus is the least — *"nobody is here who was not already here."*

### The aedileship
Capua elected its magistrates and the **aedile** was the man who put on the games. Pompeii's walls are still covered in the campaign graffiti; this is what it was for.

**Week 13 of every year**, three men stand. Each has a platform — the biggest card in twenty years and no word on who pays for it, a quiet town and views about schools that keep armed men in it, bread and shade over the seats — and any of them may already have a rival house behind him.

| | Buys | Your man takes it |
|---|---|---|
| **Nothing** | — | 0% |
| **180d**, quietly | +11 | **57%** |
| **520d**, with your name on it | +26 | **86%** |
| **1300d** | +44 | **98%** |

The vote falls three weeks later, and the office runs a full year.

**A friendly aedile** is worth **+1 bout on every card, purses ×1.14**, and a thumb on the missio. **One you bet against** is −1 bout, ×0.89, and he does not look your way when a decision is being made.

That last part is honest about its own size: at a comfortable standing the missio roll clears regardless and the aedile changes nothing. At **standing 8 it runs 87% hostile against 100% friendly** — he matters exactly when you are already thin, which is when you would want a friend in that chair. He is a Capuan office and does nothing at all on the circuit.

### The medicus and the armourer
The infirmary and the armoury were building levels. **The building is the room; these are the men in it**, hired like the doctore, with a name, an origin, a skill from 28 to 84, a fee and a weekly wage — and both can be bought away or simply leave.

| | | |
|---|---|---|
| **The medicus** | mending **×1.25 to ×1.71** on top of the room | and a wound is **17–46% less likely to set badly** |
| **The armourer** | steel **5–15% cheaper**, wears **7–21% slower** | and mends faster in the racks |

Room and man multiply: a level-3 infirmary alone heals at ×2.35, a skilled medicus alone at ×1.68, and the two together at **×3.95**. In whole weeks — which is how the injury system has always counted — a mangled hand goes **4 weeks with neither, 3 with one, 2 with both**. A one-week cut cannot be improved on, which is honest.

**They leave.** A medicus in a house at 80 unrest, or one Capua calls butchers, is gone within forty weeks **87% of the time** — *"he has simply been carried enough of your men and would rather do something else."* An armourer paid late goes 90% of the time, and *"his tools go with him, because they were always his."* Either can also be bought away by a rival house with a grudge.

### The record book
Fifty versions of accumulated history with no way to ask it anything. Every bout in all four engines is now counted, and the book derives the rest.

**What it answers.** Years standing, bouts and win rate, men served, victories, killed, buried, freed, purses taken and per bout, average crowd, largest single purse and where, longest bout ever fought and against what. Then the breakdowns — **by tier, by style, by stakes, by kind of bout, by city, and against each of the great houses** — each showing win rate and record, filtered to four bouts or more so a single fluke does not sit at the top. Then the best man the house ever had, how every one of them ended, and the line of lanistae who held it.

A sample 130-week campaign read: 233 bouts at 46%, and the style table came back **Hoplomachus 60%, Thraex 56%, Secutor 51%, Dimachaerus 30%, Murmillo 20%, Retiarius 8%** — the kind of thing a player would change their buying on. Against the houses it read Vettius 31%, Solonius 20%, **Tullius 10% from 31 bouts.**

It is counters rather than a log, so the whole book serialises to **890 bytes after 233 bouts** and costs nothing to carry in a save.

### A man who will not go out
Men had only ever left this house by dying, by the rudis, by sale, or in a revolt of the whole cell block. The commonest human failure — one man, sitting down, on a Tuesday — was missing.

He is on the boards with his back to the wall and will not put his hands up. **The reason is drawn from his own memory**: the wound you sent him out on, the brother you sold, the promise you spent, the cards with no mercy in them — or none at all, and *"he has simply had enough, and today is the day."*

It happens at **20% a week to a man who hates you, 13% at regard 18, 6% at 26, and never above 32.** He cannot be put on any card until it is settled.

| | | |
|---|---|---|
| **The whip** | back on the sand | +8 unrest, +5 defiance across the yard, −5 regard from every man watching. *"It works, in that he is on the sand. It works in no other way at all."* |
| **Talk to him** | **sometimes** | Costs nothing. Works 24% at regard 10 and 40% at 25 — **57% for a merciful lanista, 36% for a hard one.** |
| **Give him the thing he wants** | back on the sand | Meets his ambition outright. −12 unrest and the whole block hears which way that went |
| **Take him off the card** | **still sitting** | +6 defiance a week across the yard, and it compounds — *"by the evening every man in the block has worked out that sitting down is a thing that can be done and survived."* |

Eight weeks of one man sitting drags the rest from 40 to 47 defiance. Talking is free and unreliable and depends entirely on what you have been to him, which is the point of the previous two versions.

### Munera for your own dead
Funeral games were exactly that — combat staged at a rich man's tomb, paid for by his heirs. The game has always hired you out for other people's: *funeral games for a magistrate's father, for an old soldier of Sulla, for a merchant with no sons.* Holding them for a dead gladiator inverts the whole institution, which is the point.

When one of yours dies you have **six weeks** to decide, and then the moment has gone:

| | Cost | Unrest | The yard |
|---|---|---|---|
| **Nothing** | — | **+4** | *"He goes into the ground and the week goes on. Nobody says anything about it, which is how you know."* |
| **A rite at the gate** | 70–235d | −7 | Wine, a fire, his name said aloud, the familia stood down for the afternoon |
| **Games in his name** | 320–1270d | **−19** | A card at your own expense with his name where the dead man's usually goes |

It scales with what he was — 320d for a man nobody knew, 1,270d for one with twenty victories — and it is **never profitable**: full games for a middling man cost 320d and return eleven fame.

The men who called him brother feel it nearly twice as hard as the rest. Measured on his closest friend: regard **35 after doing nothing, 57 after a rite, 81 after games.** The annals record which, and *Munera* — three men given full games — is the nineteenth feat.

### What he makes of you
Every gladiator had bonds with the other men, a thing he privately wanted, and no opinion whatsoever about the person who owned him. He has one now, and it is built out of specific things you did rather than a mood.

**Seventeen memories** — nine he counts in your favour, eight against — hooked into machinery that already existed:

| | |
|---|---|
| **+22** | You stopped a bout to keep him alive |
| **+20** | You gave him your word and then you kept it |
| **+15** | You gave the rudis to a man he called brother |
| **+12 / +11 / +9** | Steel made for him alone · the surgeon when the cheap answer was there · the burial society |
| **−26** | You left him on the sand until he had to finish a man from his own cells |
| **−24 / −20** | A promise spent elsewhere · you sold a man he called brother |
| **−16 / −14 / −13** | Sent out on a wound that had not closed · the whip · you said no to the one thing he wanted |

They accumulate, they are listed on his page in his own terms, and repeats are counted. Two acts of mercy can take a new man from *takes you as he finds you* to **would follow you anywhere**.

**What it buys.** A man's regard scales his power on the sand — measured at **48% win rate at the bottom against 56% at the top** — and pulls his defiance down a little every week instead of up. At 70 he is **unpoachable**: no other house's coin will move him. At 18 or below he does what he is told and not one thing more.

That last threshold exists to be built on: *a man who will not go out* is the next thing in the queue.

### Reading a man before you fight him
The loop was: pick a man, pick a tactic word, watch. There is a week between the card going up and the bout, and it is worth spending now.

**Have him watched** — 28d plus tier and a slice of the purse, so 55d for a pit bout and 121d for a tier-3 card. It buys **two tells** about the specific man, or **three if you keep a doctore**, drawn from his actual stats and record:

> *"He is blowing hard by the sixth exchange. He has been for years and he knows it, which is why he goes early."*
> *"He drops his shield-arm for a beat every time he lands one. Every time."*
> *"He has almost no bouts behind him. Whatever he does under pressure, he has not done it often."*

Then pick one of **five plans** — let him spend himself, keep him at the end of it, wait for the opening, crowd him, break him early — and the card marks which ones fit what your man saw.

| | Win rate |
|---|---|
| No plan | baseline |
| A plan that reads him right | **+7 to +8 points** |
| A plan that reads him wrong | **−4 to −7 points** |

Eight tells, all pointing at a plan that beats them, and none of the five plans is unreachable. A man with nothing wrong with him reports *"nothing to report — he does everything correctly and nothing twice"*, and you fight him blind like everyone else.

The first calibration made a right read worth **+20 points**, which was larger than gear, class counters and momentum combined; it is halved from there.

### The heir
The lanista's death used to stop the run. Name somebody and it does not — the house carries its men, its buildings, its racks, its collegium and every debt it owes, and loses almost everything Capua thought of the last man.

| | Keeps | Cells | |
|---|---|---|---|
| **A son** | 72% fame, 50% standing | +6 unrest, −4 morale | grown up in this yard, and they have watched him do it since he was nine |
| **A nephew** | 62% fame, **62% standing** | +12 unrest, −9 morale | brings **900d** of his own, and no idea what any of these men are called |
| **Your freed doctore** | 48% fame, **34% standing** | **−16 unrest, +14 morale** | he was on that sand himself and every man knows it — Capua knows it too |

That last row is the design in miniature: the man the cells would follow anywhere is the man Capua will hold against you, because a freedman running a ludus is exactly what it looks like. A son needs the lanista to be 40; the doctore needs to be one of your own freed men.

The new man starts at 22–31 (or 34–44 for the doctore) in full health with **no traits at all** — he has to earn his own reputation, and *Hard* or *Merciful* is not inherited. The house gains a numeral in the header, and the men who held it before are recorded with their age at death and what Capua had made of them.

Verified across three successions: generation 4, fame decaying 1500 → 560 across the line, every gladiator and building intact.

### The other houses
The three rivals had been training, poaching and buying invisibly since v0.9, which made the standings read as scenery. They take a **visible turn** now — measured at one every 1.4 weeks over 120 weeks — and it goes in a feed on the Ludus tab.

**Nine moves:** they **buy** the best man off your block (he is simply gone), **sell** one onto it (tagged *Sold on by House Vettius*), **retrain** a fighter into another class, **free** a man with the rudis in front of the whole city, **hire a doctore** — worth ×1.3 to their training, and shown in the standings — **tour the coast**, which takes them off your card entirely for three to six weeks, **lose** a man on somebody else's sand, **win** one at Nola or Cales, or simply be **heard at the baths** putting one of theirs above one of yours.

Each lanista plays to his existing type. Tullius, who is simply better funded, buys and hires and retrains; Solonius schemes; Vettius grinds. The weights come off the `LANISTAE` table that already described them, so nothing new had to be invented about who they are.

The move that matters most is the tour: a house on the road appeared in **0% of 500 opponent draws** against 59% at home, so when Vettius leaves for the coast the shape of your card changes and you can see why.

### The seasons
The eighteen-week year already ran from March, with each festival in its real month. The weather now runs with it, derived from the week — nothing stored, so every existing save has a season the moment it loads.

| | Weeks | | |
|---|---|---|---|
| **Spring** | 1–4 | March–May | training **×1.09** — the best weeks for putting work into a man |
| **Summer** | 5–10 | May–August | purses ×1.12, **+6 crowd**, fatigue ×1.18, mending ×0.90 |
| **Autumn** | 11–14 | Sept–Nov | **purses ×1.18** — harvest money, and the Ludi Romani |
| **Winter** | 15–18 | Dec–Feb | purses ×0.82, **pits ×0.45**, +4d a man, +0.55 unrest, training ×0.88 — but **mending ×1.35** |

Measured across eight campaigns, net income by season runs **autumn +249d a week, spring +183, summer +124, winter +28**. Winter is lean rather than lethal — one failure in six landed there — and it pays you back in a different currency: a pierced side that takes five weeks to close in summer closes in **three** in the cold, because there is nothing else for a man to do.

So the year has a shape to play against. Build in winter, earn in autumn, and watch what the heat takes out of them in between.

### Deadlines
Nothing in this house had ever had to be done by a particular week. Five things do now, and they share one panel — **Owed by a date** — that sorts by how soon and turns red inside a week.

**A name on the bill.** An editor contracts *one named man* for *one named festival*, two to six weeks out: about a third of the fee now, the rest on the day. On that festival's card his bout appears flagged **Contracted**, and honouring it pays the balance, ten fame and five with every patron. Missing it — injured, strained, sold, dead, or you were at Puteoli — returns **the advance doubled**, costs 22 fame and 9 standing, and *"he mentions it to the others, which is the part that costs."*

**Named in public.** A rival lanista with a grudge of 45+ names your best man against his, inside three to five weeks, in front of the editors. Answering pays 6 fame up front and 26 more for a win; letting the week pass costs 14 fame, the mob's regard, and — pointedly — **cools his grudge**, because he got his answer.

**A levy.** Once past 90 fame the magistrate lays a charge on the schools of Capua toward the amphitheatre awnings or a statue nobody asked for. Pay it and only the magistrate notices; miss it and it is 16 fame and 12 with every patron.

**Patron wants** now carry the week they are due, so standing is managed against a clock rather than a vague intention. **And the invitation to Rome expires** — four weeks to answer, then the place on the bill goes to another house at −12 fame and −22 with the senator who put you forward.

### The cells at night
Almost everything about these men reaches you as a word like *restless*. Somebody has to be listening, and there are only two kinds of somebody.

**The gatekeeper** — 14d a week, no risk, and he hears what anyone at the door would: who does the talking after the lamps go out, who has stopped eating with the rest, who cannot get off the boards in the morning, whose bedding has moved.

**One of your own** — costs no coin and hears **3.5 fragments a week against the gatekeeper's 1.5**, including five things only somebody inside the cells could know: what a man privately wants and has told the others but not you, **who the ringleader is before the rebellion names him**, who has been at the wall after dark, who has been repeating your promise the way people repeat a thing they are not sure of, and which of your men has worked out his own record against the one holding the primacy.

He is found out **27% of the time by week 20 and 69% by week 40**, and when he is: −13 morale and +11 defiance across the whole yard, +16 unrest, his own ties struck off, and *"he eats alone now and will for as long as he is here."*

All twelve fragments are generated from state that is actually true, so nothing it tells you is flavour.

### The moneylenders
Three named men will put coin on your table this afternoon, and choosing between them is choosing what kind of trouble you want.

| | Rate | Cap | Quiet for | |
|---|---|---|---|---|
| **Novius Gratus** | 3.5%/wk | 1400d | 12 wks | cheap, because he does not need to argue — **collects in men** |
| **Titus Murena** | 5.8%/wk | 2400d | 20 wks | dear and unhurried, and **never takes a man** |
| **Scaeva** | 8.2%/wk | 900d | 8 wks | lends to anyone at a price that says so — **collects in men** |

Interest **compounds weekly**, so 800d untouched becomes 1,053d by week eight and 1,827d by week twenty-four. It is entirely survivable if you pay it down — a few hundred a week clears it inside a month — and fatal if you look away.

**The escalation is the feature.** He is quiet for exactly as long as he said: his man appears at the gate at his patience limit and does not come in; eight weeks later word is round Capua that you are carrying his paper, which costs 12 fame and 8 with every patron; eight weeks after that a hard lender **takes a gladiator against the debt** at 70% of his value, with nobody asking you first. At **4× the principal** he stops discussing it, and the ending is `foreclosed`.

Carrying paper also buys you a little room at the bottom — the creditors come at −250 gold normally and −420 while a loan is open — which is the trap in miniature.

### The stands
The crowd was a meter that filled and reset. It is four constituencies now, and the two biggest are historical: Roman gladiator audiences really did divide into **parmularii** (partisans of the small shield) and **scutarii** (the big one), a rivalry entrenched enough that Titus and Domitian each publicly backed a side.

| | Sits at | Wants |
|---|---|---|
| **The Parmularii** | the small shield | a light man winning on his feet — thraex, hoplomachus, net-man, twin blades |
| **The Scutarii** | the big shield | a murmillo or secutor walking a man down behind a wall of wood |
| **The Mob** | the upper tiers | blood, sine missione, a crowd on its feet |
| **The Front Rows** | the magistrate's end | craft, a clean win, a man spared |

**Each pair is zero-sum.** Courting one cools its opposite at 55% of the rate, so you cannot please both shields. Eight murmillo wins takes it to parm 25 / scut 67; eight thraex wins after that puts it back at 52 / 52.

Over thirty weeks a murmillo house that kills reaches **scut 99, parm 1, mob 97, front 11**. A thraex house that wins cleanly reaches **parm 99, front 97, scut 1**. It pays: whoever is warmest sets your purses (up to ×1.18), and the shield factions set how loud the stands are for that style and what the win is worth — a scutarii-partisan house gets **+10.6 crowd and ×1.19 fame** for a murmillo and **−5.7 and ×0.90** for a thraex.

They all drift back toward indifference at 1.4% a week, so a reputation with the stands has to be kept up. Away on the circuit none of it applies — they have never heard of you.

### Judging a man before you buy him
The block used to print a man's exact numbers, so buying was arithmetic. It shows the **seller's account** now, which is a different document.

**Three levels of knowing:**

| | Stats shown as | Centred on | The flaw |
|---|---|---|---|
| The seller only | a **±14 range** | his own generous claim | not mentioned |
| Your doctore | a **±7 range** | the actual man | hinted at |
| Scouted, ~15% of his price | the exact number | — | **named** |

Every range genuinely contains the truth — the seller does not lie about the band, only about where the man sits in it. He overstates a sound man by 2.5 points a stat and a **flawed one by 4.5**, so the patter is thickest where there is most to hide.

**Roughly a third of the block has something wrong with it**, and is priced about 19% under a sound man for it: *An old wound* (a stat down and a permanent ceiling on it), *Broken already* (the trait, and the heart gone out of him), *Trouble* (+32 defiance and Defiant), *Slower than he looks*, *No wind in him*, and *He is what he is* — 26 points of potential that will never arrive.

Scouting names it outright: *"He favours one side when he thinks nobody is watching. The seller does not meet your eye about it."* A cheap man is now genuinely either a find or a wreck, and a doctore earns part of his wage standing at the block.

### The circuit of Capua
Half the men your gladiators fought were generated on the spot and thrown away. There is a **standing pool of sixteen independents** now — men of small houses, or of no house at all: the school at Atella, Rufio's yard, the Praenestine school.

They are real in the ways that matter. They **train** (key stats climb every fourth week), they **age** on the same clock as everyone else and lose a step past thirty, and roughly every fourteen weeks one of them stops turning up — *"somebody says the sand, somebody says a fever, and nobody says it twice."* The pool holds at sixteen, weighted as a pyramid so most of them are pit fighters rather than champions.

And they **remember**. Every bout writes into a per-man record of who he has met and how it went, so the card can say *"He has beaten Crixus twice"* or *"Crixus has put him down three times."* Measured over four campaigns, **44% of pit bouts are now against a man that gladiator has already faced.**

The pits, the towns down the bay, and the rival-house fallback all draw from the pool, so the only fights against a stranger are genuinely new arrivals. A pit fighter who beats your house twice can now become a **nemesis** exactly as a rival-house man can — it happened in 30% of test runs after five meetings.

### The nemesis
A rival gladiator who has **beaten your house twice**, or killed one of your men, stops being an opponent. `d.nemesis` names him, your own familia gives him a title, and the chronicle records the day they started using it.

While he stands: facing him costs your man **8 morale before the bout** (14 if he has killed), the crowd is 10 louder for it, and a *hated* nemesis drags the whole familia by 1.2 morale and 0.6 defiance every week he is still walking around Capua. His offers are flagged on the card with his title.

Settling it pays: **+11 morale across the house, −4 unrest, +12 fame** for beating him, and **+18 / −7 / +22** for killing him — *"Whatever the cells were carrying about him, they put it down tonight."* He clears if he dies elsewhere or leaves his house, so the slot never strands.

Only one at a time, unless a second man kills one of yours — a killer always displaces a mere rival.

### The crux in the melee
The fourth engine holds now, and its version is a different decision rather than a port. It fires when the **field has thinned far enough that you can see the forced duel coming** — four or fewer standing with two of them yours — or when one of yours is badly used. Early enough to still act.

- **Let them finish it** — the sand decides, and it may decide that two of yours are the last two.
- **Pull one out** — he walks off. No share, no wound, and **if he was your second, the editor has nobody left to make him fight.**
- **Pull them all out** — forfeit. −11 fame, −5 with every patron, +9 toward a merciful house, and the cells lift 5 morale.

Measured entering three:

| | Win | Dead | Injured | Forced to finish |
|---|---|---|---|---|
| Let them finish | 10% | 0.41 | 2.48 | 4% |
| Pull one out | 8% | **0.29** | **1.63** | 2% |
| Pull them all out | 0% | **0.16** | **0.53** | **0%** |

And entering two, which is where the threat is sharpest: pulling one out takes the forced duel from 1% to **zero**, and halves the deaths, for two points of win rate. You are buying your way out of the exact thing the melee holds over you.

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
| **The Old Guard** | 700d, 4 men averaging **32 years and 9 scars** — and the most durable founding roster in the game (#148) |
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

### Training
Four regimens and a stat picker became **eight named drills**, each with something it costs:

| | Trains | Costs | Fatigue |
|---|---|---|---|
| **The Palus** | whatever you point him at | — | +12 |
| **The Weights** | Strength ×1.55 | Agility | **+16** |
| **The Pila** | Technique + Discipline | — | +12 |
| **Footwork** | Agility + Technique | — | +11 |
| **The Hill** | Endurance ×1.25 | — | **−9** |
| **Sparring** | *whatever his partner is better at* | injury risk | +14 |
| **Playing to the Yard** | Showmanship ×1.35 | Discipline | +10 |
| **Rest** | — | — | −24, and takes strain off |

Over twelve weeks from 50: the palus gives +16.6 strength, the weights **+25.6 and −2.6 agility**, footwork +17.4 agility and +6.6 technique, the yard +22.4 showmanship and −2.6 discipline.

**Sparring stopped being a multiplier.** He now learns whatever his partner most exceeds him at, regardless of what you picked — a partner 28 ahead on technique teaches technique, and once the gap closes he falls back to your choice. Set against a partner better at nothing and it is just the post.

**Strain** is deep tiredness a night does not touch. It accrues above 62 fatigue and faster on the heavy drills, eats gains (`1 − strain/150`) and multiplies injury risk (`1 + strain/90`). **Only rest takes it off** — the hill sheds fatigue but barely touches strain.

That turns the heavy drill into a cycle rather than a trap. Thirty weeks of nothing but weights injures **64%** of men; the same thirty weeks cycled with rest and the hill reaches **identical strength with nobody hurt at all**.

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
Upkeep 10d/man/week, +8d per injured man. Purses and appearance fees by tier. Parties (150/400/900d) buy favor; feasts (priced against the house, see `feastCost`) buy loyalty. The creditors close at −max(250, 2.5 weeks of the house's own bill) — see `creditLine`.

### Save files
**Three independent slots** at `window.storage` keys `ludus-slot-1..3`, each autosaved 500ms after any state change with a `savedAt` stamp. Boot reads all three and shows the **Records** title screen — house name, week, fame title, men/fallen/freed, and how long ago it was kept. A single pre-slot save at the legacy key `ludus-save-v1` is adopted into slot 1 on first boot, so no one loses a house.

A fallen house stays in its slot marked closed; you re-open it to read the ending or strike it out. `wipeSlot` confirms through the themed modal.

**Transfer codes** — `encodeSave` / `decodeSave` round-trip the whole state through unicode-safe base64 (≈17k chars at week 13). Copy the ledger from the Ludus tab, paste it into any slot from the title screen. `decodeSave` validates shape and runs `migrate()`, so an old or corrupt code is refused rather than loaded.

State `ver: 6`. `migrate()` is additive and idempotent — it backfills `rivals`, `escaped`, `rebellion`, `gear`, `retired`, `doctore`/`doctoreMarket`/`doctoreOffer`, and per-gladiator `kit`, `scars`, `scarCap`, `weeksAged`, `age`.

---

## Balance reference (measured, N ≥ 800)

**Read this against the source, not instead of it.** These figures were measured when they
were written and several have been retuned since; where a number matters, the comment above
it in `src/ludus.jsx` carries the measurement it was actually set on, and `npm test engines`
prints the live ones every run. What is durable here is which dial does what, and roughly
how hard each one pulls.

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
| The circuit | `CIRCUIT_SIZE` | 16, pyramid-weighted, ~7% churn a week |
| Their records | `circuitRecord` | per-man memory of every meeting |
| Concealed flaws | `FLAWS` | 6 kinds, 34% of the block, −18% price |
| What you can see | `bandOf` | ±14 seller / ±7 doctore / exact |
| Having him looked at | `SCOUT_FEE` | `35 + price × 0.10` |
| Faction pairs | `FACTIONS` | opposed at 55% of the gain |
| What they pay | `facPurse` / `facFame` | ×1.18 purse, ×0.90–1.19 fame |
| Forgetting | `facWeek` | 1.4% a week back toward indifference |
| Lenders | `LENDERS` | 3.5–8.2% a week, compounding |
| His patience | `LENDERS[].patience` | 8–20 weeks, then the gate, then a man |
| Foreclosure | `loanWeek` | 4× the principal |
| The gatekeeper | `EAR_FEE` | 14d/wk, 1–2 surface fragments |
| A man inside | `listenWeek` | 3–4 fragments, 5 of them deep |
| Being found out | `d.ear.risk` | +1/wk, `R() < risk/700` |
| A booking | `offerBooking` | 35% advance, 2–6 weeks, doubled back if missed |
| A challenge | `offerChallenge` | grudge ≥ 45, 3–5 weeks |
| The levy | `offerLevy` | `140 + fame×0.5`, 3–6 weeks |
| Rome's window | `romeOffer.due` | 4 weeks |
| The seasons | `SEASONS` | 4, derived from the week |
| Winter | `seasonOf` | pits ×0.45, +4d a man, mending ×1.35 |
| Autumn | `seasonPurse` | ×1.18 |
| Rival turns | `rivalTurn` | ~1 move per 1.4 weeks |
| Their moves | `RIVAL_MOVES` | 9, weighted by lanista |
| A house away | `h.away` | 3–6 weeks, off your card entirely |
| Succession | `HEIRS` | 48–72% fame, 34–62% standing |
| The freedman | `HEIRS.doctore` | −16 unrest, +14 morale, worst standing |
| The line | `d.forebears` | every man who held it, and how he ended |
| Watching him | `watchCost` | `28 + tier×22 + purse×0.045` |
| A right read | `planEffect` | pow ×1.052, stamina ×0.93, guard ×0.955 |
| A wrong one | `planEffect` | pow ×0.974, stamina ×1.04, guard ×1.028 |
| Regard | `REGARD` | 17 memories, −26 to +22 |
| On the sand | `regardPower` | ×0.97 to ×1.03 |
| Loyalty | `regardLoyal` | 70+ cannot be poached |
| Rites | `RITES` | 0 / 70–235d / 320–1270d |
| The window | `RITE_WINDOW` | 6 weeks, then it is gone |
| Doing nothing | `RITES.none` | +4 unrest, −6 regard, −9 for kin |
| Refusal odds | `refuseWeek` | `0.05 + (24−regard)×0.011` |
| Talking him up | `EVENTS.refusal` | `0.16 + regard×0.011` ± the lanista |
| Letting him sit | `refuseWeek` | +0.9 defiance a week to everyone else |
| The book | `bookBout` | counters from all four engines |
| Its breakdowns | `bookOf` | 4-bout minimum before a row shows |
| The medicus | `medicusMult` | ×1.25–1.71 mending, 17–46% bad-set guard |
| The armourer | `armourerCut` | −5–15% steel, −7–21% wear |
| Losing them | `staffWeek` | 6% a week once the condition holds |
| The election | `ELECTION_WEEK` | week 13, resolved 3 weeks later |
| Backing him | `backLevels` | 180 / 520 / 1300d → +11 / +26 / +44 |
| The office | `aedilePurse` | ×1.14 or ×0.89, ±1 bout, ±9 missio |
| Venues | `VENUES` | 9, assigned when the card goes up |
| Footing | `power()` | scales agility ×ft² and technique ×(0.5+ft/2) |
| Form | `formPower` | ×0.964–1.036, an 8-point spread |
| Its decay | `formWeek` | `f×0.78 − 3` — half gone in two weeks |
| The generator | `R()` | mulberry32, state in `d.rngState` |
| Seeds | `newSeedWord` | 8 chars, no I/O/0/1 |
| The agenda | `agenda()` | 20 sources, 3 urgencies |
| Lessons | `LESSONS` | 28, of which 17 gated on `when(d)` |
| The condemned | `CRIMES` | 10–18 bouts, free, unsellable |
| What he costs the yard | `damnArrive` | −5 morale, −4 regard, +4 unrest |
| Serving out | `damnCheck` | +26 regard, −6 unrest, +6 mercy |
| The oath | `SWEARING` | 0 / 40 / 150d, ×1.4 free, ×0.6 condemned |
| Mastery | `MASTERY_GATE` | 12 wins, 55 renown; ×1.055 in that style |
| A second trade | `secondFee` | `340 + renown×2.2`, 8 weeks off the card |
| The trade's memory | `TRADE_KEY` | outside the save slots, survives a loss |
| The stands | `FAC_TINT` | 4 blocks, lit by faction standing |
| The ground | `.v-*` | 6 venue floors, crowd thinned to match |
| The man four doors down | `PRIMUS_ASK` / `PRIMUS_ASK_GAP` | 14% a week from six weeks into a reign, then 30 weeks' silence |
| A feud arriving | `feudWeek` | 20% a week once bitter |
| Settling it | `EVENTS.feud` | 15% hurt supervised, 42% not |
| Doctrines | `DOCTRINES` | 6, 300–500d, 1.8× to change |
| A school's own | `docTrainMult` | ×1.22 taught, ×0.86 tolerated |
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
| Drills | `REGIMENS` | 8, with gains, costs and fatigue |
| Strain | `strainDrag` / `strainRisk` | −gains, ×risk; only rest clears it |
| Weekly recovery | `endWeek` | 13 fatigue, so light drills break even |
| Lesson odds | `docLesson` | `skill/340`, ×1.5 if he is one of yours |
| Remaking | `RETRAIN_FEE` | 240d and 3 weeks |
| Nemesis trigger | `nemesisCheck` | 2 defeats, or one of your dead |
| Facing him | `doFight` | −8 morale, −14 if he has killed |
| Settling it | `nemesisSettled` | +11/+18 morale, +12/+22 fame |
| Hunt crux | `simulateVenatio` | rounds 3–7, `vA ≤ 58 \|\| vB ≤ 42` |
| Melee crux | `simulateMelee` | round 4+, ≤4 standing with 2 yours |
| Pulling a man | `MELEE_CRUX` | forfeits his share, forecloses the duel |
| Wear per bout | `WEAR_RATE` | 3–6 weapon … 1–3 helm, ×1.5 hard |
| Worn value | `wearEff` | `0.5 + condition/200` |
| Weekly repair | `repairWeek` | 2.2 × armamentarium level |
| A named piece | `FORGE_FEE` | 700d, +5%, half wear, never breaks |
| He asks | `endWeek` | 14%/week, own channel |
| Gap before pressing | `EVENTS.ambition` | 5 weeks, then 9 |
| Despair | `ambWeek` | 12 weeks after the second asking |
| A promise kept / spent | `ambitionMet` | +34/−26 · −38/+26 and the yard hears |
| Favour costs | `FAVOURS` | 26–34 standing, 20–30 week wait |
| The magistrate | `FAVOURS` | grudge −55, cancels a poach |
| The merchant | `flags.underwritten` | upkeep 0 for 10 weeks |
| The senator | `flags.romeEarly` | Rome gate −110 fame |
| Primacy gate | `PRIMUS_GATE` | 5 wins, 35 renown |
| Defence frequency | `makeGames` | 45% of cards while you hold it |
| Holding it | `primusWeek` | +3 fame/wk, +0.25 to every patron |
| The house challenge | `EVENTS.primacy` | 42% the challenger takes it |
| Local standing | `knownIn` | 7–12 a win, +5 if the taste fits |
| Being a stranger | `simCtx.strange` | −19 to the missio roll, decaying to 0 |
| City tiers | `cityTier` | 30 known → tier 2, 60 → tier 3 |
| Feat perks | `PERKS` | 6 distinct, 11 feats carry one |
| Your health | `lanistaWeek` | −0.045/yr past 42, −1.3 a burial, +0.06 idle |
| Your traits | `LAN_TRAITS` | 6, all earned by play |
| Dying of it | `over.lanistaDied` | health 0 |
| The society | `COLL_FEE` / `COLL_DUES` | 180d, then 3d a man a week |
| A burial under it | `collSoften` | half the unrest, half the health |
| Cutting it | `lapseCollegium` | +7 unrest, or +14 once it has been used |
| The war | `WAR` | 4 stages at weeks 1, 11, 27, 44; over at 58 |
| What standing pays on | `CENSUS_TOP` | fame capped at 9,000 for the stipend, the liturgy and the league's purse |
| A name at the block | `FAME_WARM_AT` | from fame 14,000, bought men arrive +6 regard, +6 morale |
| A rival's name | `stature` in `LANISTAE` | pulled toward stature × the leading house's fame |
| A decreed season | `leagueReckoning` | 28%/yr, form 82–100 floored at 60 for the year, crest +0.9 × stature |
| A worn welcome | `STAY_FRESH` / `welcomeOf` | past 6 weeks resident, purses fade to ×0.6 and the card thins |
| Proving it for Rome | `romeProved` / `ROME_RANK` | the primacy held, or received as Eques (rank 4); rank 5 admitted nobody the sand had not |
| Who is shown a paragon | `PARAGON_ODDS` / `PARAGON_REACH` / `PARAGON_GAP` | 5.5% a week, only within 88% of his price by a full fire sale, 90 weeks between; 23–30% of houses reaching week 120 see one |
| What counts as new, and where | `TAB_SIG` / `tabSig` / `tabMarks` | a signature per tab over its discrete state; arrivals move it, drift never does |
| What the box can say, and when | `CRUX[k].when` | over 1,381 cruxes resumed to the end: press/cover/cloth 100%, legs 86%, breather 74%, rouse 53%, milk 26%, finish 23%, blind 9%, hound 5% — and **0.80 cruxes a bout**, at most 3 |
| When a limb goes | `MARK_NEED` | legs 24, head 26, body 26, arm 58 — three of the six places a blow can land feed the arm, hence the split. Measured over 700 bouts with each man matched to the tier he is billed at: legs **40.3%**, arm **37.9%**, head **40.6%**, body **35.1%**, one mark or more in 91%. Flatten the arm to 26 and it lands in **81.9%** — the fault the split is for. Mortality does not move with it (15.4 / 16.7 / 13.6 / 17.6% at arm 58/42/34/26; s.e. 1.4pt). The A/B this row used to ask for has been run; the number is right. *(The old figures here — arm 4% — came from a probe pairing raw men against proper arena opponents, which produced a 0.4% win rate.)* |
| When the yard gets built | `BUILDINGS[k].cost` | levels 1–3 all bought inside a five-week band (weeks 118/122/123, 3,270d the lot); level 4 by 5 of 50, at week 258 — the fourth level is the late sink and it works |
| What ends a run BY ERA | — | debt dominates **years 1–3 in every one of the five policies** — it is what an unfinished house dies of, whatever it is doing. The later eras are the other systems arriving: **years 4–7** rebellion and ruin, **8–12** rebellion and `banned`, **13+** `lanistaDied`, `emptied` and a last of debt. And competence does not buy the first year: over 40 weeks the proven policy went out **13 of 24** against **12 of 24** for a house doing nothing at all. What it buys is the ceiling — the careful arm was the only one of five with houses still standing at year 22 (**3 of 20**, and 2 of 20 on the second run); every other arm ended 0 of 20. Lifespan medians at n=20 are NOT a bar: the same policy came out 36 weeks and 20 weeks on two runs |
| What ends a run IN THE OPENING | — | not the same thing at all. Pooling four runs of `survive` on its own policy — 20 new houses, 26 weeks: **13 standing (65%, s.e. 10.7)**, and of the seven failures **five were the yard emptying against two for the ledger**, with three of those five still holding coin when the last man went (248, 360 and 96 denarii). Early you die of attrition with money in hand; later you die of the ledger. Carrying the row below into the first twenty-six weeks tunes the wrong dial |
| Whether the opening has drifted | — | a fixed handle policy over 200 houses returns **72 standing, 36.0%**, with identical endings to one decimal on four builds spanning v2.5x to v2.68.0 — the same to the house, so none of those releases touches a code path a new house executes. That probe is the two-minute answer to "did I just break the opening", and it is unambiguous precisely because the streams match when nothing relevant changed |
| Whether the week's nudge points at the biggest lever | `agendaCan` / `walkTheCells` / `LESSONS.unrest` | #119. The gatekeeper's lesson teaches the cells ("watch that red bar more closely than the gold"), and the agenda offers the feast — but at `unrest >= 35`, gated on `gold >= feastCost + weeklyBill` and `feastFresh >= 0.6`. Measured over one policy's 400-week houses: **1,432 weeks with unrest at 22 or more, and 648 of them (45.3%) sit below the agenda's threshold with nothing offered at all**. Of the weeks past 35, the item was offered 179 times and **suppressed 372** — 361 of those by the freshness gate, 11 by coin. And **walking the cells is never suggested anywhere**: `walkTheCells` appears outside its own definition in exactly one place, a button on the villa tab, and nowhere in `agendaCan`, across **1,029 weeks where the cells were loud and the walk was available** |
| Which endings a house can actually reach | the twelve `d.over.kind` values / `ends` | #118, with a control that works this time (an ordinary house: ruin 4, lanistaDied 1, rebellion 1 of 6). Eight of the twelve are reached in play. **`foreclosed` is reachable and was simply never tried** — borrow 2,000, never repay, and `owes(d)` passes four times the principal at **week 44, 6 of 6 houses**. **`oldAge` cannot happen**: it wants `age>=62 && health>=45 && d.heir`, and over **3,070 lanista-weeks the man was 62 or over in 907 and healthy enough in NONE** — health decays with the years, and with an heir named a lanista at nought health hands over instead (1,135 weeks of succession). **`closed` cannot happen either**: it needs five men freed, `rudisEligible` is `wins>=10 && pfame>=180`, and the best man in a 500-week house reached **8 wins** — which #114 explains, since a man fights 3 bouts at the median. `triumph` is a choice on the road back from Rome and is untested. The two dead gates carry TRIPWIRES rather than locks: if the rudis bar drops, `ends` asks for the re-measurement |
| What actually ends a run | `ends` / `survive` / the endings table | RE-MEASURED TWICE, in v2.81.0 for the crux and v2.82.0 for the night. The old figures had two faults: ~60% of every arm's bouts returned at `res.unfinished` unpaid, and every question was answered with choice 0 — which on `uprising` is the one branch that can end the run. Corrected, over 400 weeks and two seed sets: **debt is 24% / 27% across six policies against a published 69% / 67%, and 95-100% of it is the idle arm's**. A resolved bout is a PAID bout, so a house that fights does not die of the ledger. **`lanistaDied` is the plurality ending for a well-run house** — it lives long enough for the man in the chair to grow old. Working the cells (feast over 30, walk over 22) is the largest single lever measured, and its size was settled in v2.85.0 by a PAIRED run — the same seed to both arms, 110 houses: the cells arm **outlived its own twin 70 times against 31, with 9 ties**, median life **105w against 64w**, and **11 of 110 alive at year 22 against 0 of 110**. The unpaired 3.6x figures first published (308w/270w against 183w/116w, 5 of 20 against 0) came from one kind seed family; the direction held, the magnitude did not. Answering the uprising with steel rather than the guards takes `proven` from 183 weeks to 54 and its rebellion share from 40% to 70% |
| How the war reaches you | `WAR_AWAY_AT` / `WAR_AWAY_ODDS` | your own gate, or a rising elsewhere from week 60 at 0.35% a week — 45% of houses that get there see it |
| What earns a badge | `MARK_URG` / `TAB_QUIET` | urgency 2 and above only (3.64 items a week, not 7.86); an empty tab cannot be fresh |
| What a kept vow is worth | `VOW_BOUTS_FULL` / `VOW_EARNT_AT` | par at nothing risked, 1.6× at six cards fought under it — and never a blessing. Both are six: `VOW_EARNT_AT` was 2, and over 31 vows settled in 1,611 house-weeks the fewest cards under any vow was three and the median eight, so the piety split could never resolve the lean way. At six it bites 26% of vows |
| What the gatekeeper can say | `LESSONS` / `lessonFor` | 35 lessons, one per tab per week, each with a `done` window — so it is a queue, and a window can expire while something ahead of it holds the slot. **All 35 windows are non-empty**: built into its own state, every lesson opens and every one is then said. From inside its window with nothing read in front of it, **29 of 35 are said, median week 3**; the other 6 are windows that close and reopen rather than expire. A reader playing from week 1 reaches 27 of 35 in 47 weeks; all 11 with no state gate are offered, first at weeks 1–3. Four ways to lose one, all of which had happened: done in week 1 (in an opening nobody was checking), `done` firing before `when` can, starved by the queue in front, and a gate with no satisfiable state at all |
| Which question the week asks | `pickEvent` / `shuffled` | one slot, filled by the first event whose `make` returns something from a shuffled key list — so the draw has to BE a shuffle. It was `sort(()=>R()-0.5)`, which is not one: measured on the first-eligible key, the statistic that decides what is asked, it skewed **1.3 to 1.4×** toward events written earlier in the file (1.03× for two adjacent, 1.39× for the seven a real house had) against 1.01–1.06× for Fisher–Yates. The 5.1× figure that first turned up is first-POSITION of the permutation and is not the statistic that matters. Systems with channels of their own — the feud, the licence, the inspector, the primacy — set `pendingEvent` before the draw runs at all and take the week outright |
| What a man's last month is worth | `formWord` / `FORM_TELL` / `formWeek` | five words, and two were never said. `formWeek` decays `f*0.78 - 3` weekly against +24 for a win at the great games, so three straight wins — the lesson's own example — reaches **37.6**, and the bands were 58 and 24. Over 4,862 man-weeks form ran **-50.5 to +42.4**, "in form" and "shaken" **0 times each**, "level" **97%**. Bands are 34 and 14 now; the fixed point of winning every single week is 71.5. What form DOES is unchanged at ±3.6% of power |
| What warms between two lanistae | `warmth` / `houseWord` / `RIVAL_BEATS` | four words at **25 / 50 / 75**, fed by **1.1 a meeting** while that house's grudge is under 30, plus **4 to 16** from each of eight once-only beats gated on `met>=6` through `met>=26`. A house that works ONE rivalry for 300 weeks peaks at a **median 76.8 and a max of 100**, and says all four words; a probe using `pickRivalOpp` meets six houses a little and tops out near 43, which is what #113 measured. `rivalArc` will not run while a question is waiting — worth about **15%** of the arc and a delay to `end` (3 of 20 against 5), not a word. `loan` needs the purse under 200 at the moment it runs |
| Whether the suite is measuring what it says | `probe` / `harness.mjs`'s rope | the audit's own instrument, #116. `doFight` and its three sisters return at `res.unfinished` — the balance — BEFORE crediting anything, and mutate NOTHING while a bout is held: **0.0% of first-blood bouts reach it, 60.5% of standard, 59.3% sine**, and in **721 of 721** held bouts the purse, the fatigue and the steel had all not moved. THREE checks answered nothing (`ends`, `houses`, `chair`) and lost ~60% of their bouts; FIVE more answered one word and dropped anything that came back, another **26.8% of all standard bouts, 44.2% of the held ones**. The rope is in the harness now, installed by `open()` on every page, and `probe` fails any check that reaches for an engine without resolving to exhaustion — reading each `if(… .crux …)` site rather than the file, because answering with the CLOTH ends the bout and is correct |
| What a town down the bay thinks of you | `bayPol.favor` / `cityFavWord` / `knownIn` / `BAY_DECAY` | TWO scales that behave oppositely, and nothing had toured either. Favour has five words at **78 / 58 / 38 / 18**, opens at `20 + ri(0,15)` so every town starts on "an outsider", moves ONLY on a bout fought there by `4 + served*5` (**+9 / +4 / -1**) and never decays: toured properly it runs **10 to 100** over 24 town-houses at a median peak of **93**, and **all five words are said**. The bottom word is reached only by LOSING — Neapolis wants craft and `cityServed` scores a defeat -1 — which a reading of the source misses. `knownIn` is fed by every bout and bleeds **0.55 a week** for every town you are not in: a five-week-a-town round robin pegs all three at **100 by about week 20** and never feels it, while a house that tours once to 70-90 and stays home bleeds to nothing over **~130 weeks** and loses `known>=10 everywhere` about week 130. The bay itself goes to a rival after **30 idle weeks** at 2.8% a week — **8 of 10** homebound houses, **0 of 8** touring ones — at -4 fame every eight weeks, and is given back ONLY by turning up: **12 of 12**, two weeks out, for **+10 to +12** grudge |
| What a bout takes out of what he carries | `WEAR_RATE` / `wearKit` / `wearWord` / `repairWeek` | five words at **85 / 60 / 35 / 15**, fed by **3-6 a weapon** a bout (offhand 2-5, helm 1-3, armour 2-4), **1.5x** at sine missione, halved on a named piece, and a piece at nought **breaks** and puts him on house stock. All five words are said and the rate measures at a median of **4** over 87 calls. In a played house with no armoury, **76.6%** of man-slot-weeks read "keen" and **8.5%** read "worn" or worse; over 6 houses and 130 weeks it is 83.3% and 4.3%. Wear is a system of the FIRST YEARS: breaks per ~1,050 bouts run **28 at L0, 2 at L1, 0 at L2 and L4** as `repairWeek` adds level*2.2 a week. And the piece outlives its owner — a man fights **3 bouts at the median and 8 at p90** against the ~25 a weapon needs, **2 of 241** ever reached 25, and **207 of 263** left the yard dead. `gearCond` is the SHELF and measures none of this |
| The name Capua settles on | `repStyle` / `repSettle` / `addRep` | four names, a share of **0.36** of a total of **14** to be given one, **0.30** to keep it and **0.06** clear to take it off you. All four are earnable and all four are HELD once a house goes after them — blood 100% of weeks from week 2 with the doctrine and *sine* stakes, show 824 of 917 weeks on the **showboat tactic**, craft 412 of 427, mercy 1,277 of 1,296 on **fighting to surrender and then throwing the cloth**. Fighting at first blood is caution, not mercy: 0 cloths in 2,345 house-weeks and the town calls you a craftsman. It settles on something 87–100% of all house-weeks. `repStyle(d)==="blood"` is half of `STAFF.medicus.quitOn`, and the butcher loses his surgeon 9 of 10 times at median week 12 against the showman's 0 of 10 |
| How close you are to a thing | ten proximity lines vs the gates they describe | driven for the first time in #109: four wrong, five right, one not a line. `feastReach` is a fraction 0.65–1 and the agenda put it through `Math.round`, so the feast read "reach **1** of them" at every house size; `paragonReach.short` measured the gap against the box **plus** debts at face **plus** steel at half, beside a button reading the box alone — **12.8%** of 187 played house-weeks past week 20 fell in the window where the line says nothing is missing and the purchase is refused, median **24.6%** of "worth" being outside the box; `munusWait` read **0 weeks** of cooldown to a house standing on the imperial sand, because `munusReady` refuses for a reason the panel had no words for; `workOpen`'s closed line blamed the monuments when the tier-2 gate is the five plain works. Right: `blessLeft`, `creditLine` (median 0d drift), `riseNeed`, `romeBar`, `featNear`. `acclaimTarget` is read by `acclaimWeek` and shown to nobody |
| Whether a line has room for what can go in it | `SMALL_HOUSES` / `NICKS` / `ORIGINS` vs the row it fills | the pit row's second line — `class · house · record` — has **263px** of room and the widest the content space allows renders at **300px**: 110 of 1,800 men dealt across 600 nights (**6.1%**) lost some of it behind an ellipsis. The coupling is the point: the menace word sits on the right at `flexShrink:0`, so v2.71.0's new words (**Murderous 53px, Peerless 40px** against the old top word **Lethal 31px**) took 22px out of the span beside it — with the narrowest word on the right, **0 of the 1,800** are cut off. A scale that gets a longer word narrows every row it shares. `room` forces the widest content AND the widest word together |
| What you are told before you commit | `menace` / `readMatch` | two readings, and only one is free. `readMatch` — the per-man word on the pick screen — is real only when you have paid to have the man watched, which a house holds on **15.3%** of the men it is offered; the other 84.7% read "no read". Free is `menace`, six words now: Green/Seasoned/Dangerous under mean 66 where a strong man is quoted 97% throughout, then **Lethal 66–77, Murderous 78–89, Peerless 90+**, which against a mean-92 man is 11, 29 and 24 points of quoted chance per band. It ended at 66 for fifty releases, so one word covered mean 66 to 99 — a quote of 96% down to 13%, and every hard decision in the game sits inside it |
| What a new player is told to do | `CHARTER` / `charterWeek` | eleven steps, and a PREFIX — `charterWeek` stops at the first step not done, so one step a house cannot finish hides every step behind it and the year-end 250d + 12 fame. Walked end to end it finishes; played, it finishes for 10 of 40 houses in 40 weeks and 26 of the 40 died first, which is the opening's mortality and not the guide's doing (a reserve arm that spends less scores **−5.0 points against it, s.e. 9.1**). The crux — the word from the box — comes in **0.0%** of first-blood bouts, **53.2%** at surrender, **67.8%** sine, which is why step two's advice and step ten's requirement had to be reconciled |
| Which opening a check is looking at | `SC_KEYS` / `SCENARIOS` | five: clean 3 men/800d, inherited 6/260 **with a room already up**, champion 1/520 **whose man starts on 6–10 wins**, veterans 4/700, castoffs 5/640. `newGameState` ends `SCENARIOS[scen] \|\| SCENARIOS.clean`, so a wrong key returns A Clean Start **without a word** — which is how one check spent two releases testing one opening five times, and why the keys are now on the handle. Those two starting states are the only ones that open the doors on `staff` and `signature` in week one |
| How loud the first hour is | `agenda` / `URG` | over the opening thirty weeks, **2.94** items a week at urgency 2 or more, more than two of them in **58.8%** of weeks (was 3.57 and 81.1% while the teacher line outranked the week's news). 93.2% of weeks carry more than three items in total, and no week in 420 was silent |
| Which stat to point him at | `CLASSES[c].key` / `setFocusOf` | `power()` and `winChance` weight a class's own two stats, so the drilling grid's six buttons are **not equivalent** — that is a fact about the engine, not a measurement. What was measured says only what it can: weakest-stat pointing reliably lifts a man's MEAN (91.5 and 99 across two batches), which is what it optimises by construction; pointing at his class's own stats does not reliably lift the mean (94.4 and 88.4 against 86.7 and 88.6 for never pointing him), because that is not what it is for; and no policy separated on house-level outcomes at 20 houses × 2 batches. So the grid marks which two stats are his trade and claims nothing beyond that |
| What a man can be trained to | `PRIME` / `REGIMENS.palus` | a young man with a doctore and a full yard, pointed at his weakest stat each week, reaches mean stat **99 by week 149 aged 28** — the same ceiling the city's best reaches, gap **0.0**. `palus` is `focus:true`: it trains what you point him at and nothing else, so a house that never sets a focus tops out near **58** and the whole top of the arena reads as unwinnable. This is a dial in the sense that it decides what "a good house" means, and every measurement of the late game depends on the focus being set |
| Which panel inside a tab | `SECT_MARK` / `sectMark` | eight panels, each a function of the save so a check can ask what it would wear |
| What the priests count | `PIETY_TOP` / `pietyFame` | fame read up to 1,600 and no further — the dearest altar asks 1,900d, not 20,300d at fame 20,000 |
| A blessing worth keeping | `GODS` / `OFFERING_COOL` | 4–6 weeks a gift, a 3-week rest; a house that keeps the rites rides one 31.6% of weeks for 19.6% of income |
| Rome's patience | `ROME_WEEKS_PER_BOUT` | 4 weeks a bout, then the place is given away |
| Who may be named | `heirEligible` | a son at 40, a nephew always, your own freed doctore, a scion you raised |
| Patrons while away | `patronWeek` | wants neither asked nor credited; decay ×2.5 |
| Feast fatigue | `FEAST_FRESH` / `feastFresh` | ×0.4 effect on the cooldown floor, full at a 6-week gap |
| Feast price ceiling | `feastCost` | fame clamp extended to ×2 (≈×5.4 base at fame 4,400+) |
| The creditors' patience | `CREDIT_WEEKS` / `creditLine` | ruin at −max(250, 2.5 × `weeklyBill`), ×1.68 with a loan |
| Hearing the slide | `DEBT_STAGE` | the trades notice at 35% of the line, talk at 65%, stop being polite at 85% |
| The asking drumbeat | `AMB_COOL` | ten weeks of yard-wide quiet after any man's ambition beat |
| The cloth, wherever it is thrown | `recordCloth` | singles, pairs and hunts all record it; before v2.58.0 only singles did |
| How close an unearned feat is | `FEATS[k].near` / `featNear` | all nineteen carry one, read off the house's own state; the sheet must name the thing in the way, not the easiest thing to count |
| The street's memory | `acclaimTarget` | men cap +46, freed legends +12, walls +9, spill +14; the primacy only if it is yours |
| What the street buys at the block | `makeMarket` | acclaim 40 / 72 / 95 → mean stat 54.7 / 61.4 / 63.6, fine men 6.9% / 17.5% / 23.1%, price 545 / 926 / 1,208d — accepted deliberately in v2.55.0; `stall` prints it every run |
| What it leaks | `warWeek` | standing, unrest, and a defiance floor |
| The block | `warMarket` | ×1.25 at its height, ×0.55 after |

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

## Where the work stands — read this first

**Shipped and verified:** v3.42.0 — #151 refuted on its own clause: a banking arm that keeps
entertaining reaches Known in Rome in 3-5 houses of 16, and the "blocked on favour" evidence came from
`estate`'s `miser`, which banks by switching the table — the favour engine — off. Split by the game's
own four booleans over 192 house-runs, coin is the last term standing on 96-100% of one-short weeks
from rung 3 up and favour appears in no one-short row anywhere. The panel's coin row now explains
itself, and `census` grows a free-grant tripwire (8 of 8 played houses reach the top rung). Opens
#154. Suite green at **66/66**, `survive` drawing (4,5). v3.41.0 — #150 refuted on its own clause (nothing is paid for a refusal —
coin moved on 0 of 1,800 nulls — and every null a caller can reach past the cooldown is the price),
which made it a UI item, and both UI faults are fixed: the panel quoted odds the engine would not roll
(990 wrong rows of 6,448, understated every time) and a shut door gave no reason. Adds `gambit`, the
66th check, to a system nothing had ever touched. Suite **65 of 66**, the one failure `survive` at
(1,1) — proven false by a 60-house cross-build signature that is identical house for house, and two
clean re-runs at (2,11) and (1,11). v3.40.0 — #149 closed: `repay`, `breakPlan` and `dropKit` are correct, and
driving `applyKit` found three real faults in the steel economy's unguarded half — a piece could be
moved between a man and the rack without its condition going with it (three owned, three worn, two
still listed on the rack), both dark paths took a man's forged and named piece, and `condOf` scored
every candidate at the wear of the piece already in the slot, so "arm him off the rack" handed out
house issue precisely when a man's own steel was finished. `steel` grows a section 7 whose four bars
were each negative-tested against the unfixed code. Suite green at **65/65**, `survive` drawing
(3,10). v3.39.0 — #148 closed: the openings' 35-point survival spread is real and
is not what the tags describe. Two of the five made a claim about a trajectory and both were
measurably false — `veterans`' "closing window" is backwards (its founding men outlast every other
opening's by 3-5×, under all four policies) and `champion`'s "everything is standing in one cell" is
true for a median seven weeks of a 200-week run. Two sentences fixed, nothing retuned. Suite green at
**65/65**, `survive` drawing (4,6). v3.38.0 — #147 refuted on its own clause (the missing endings are
declined, not unreachable: 22-24 of 24 houses reach `foreclosed` when a policy goes after it) and one
real gate fault fixed on the way — `disgrace` was held shut by a term that reads your PATRONS in an
ending about the front rows, and now fires for 7-11 of 24 houses that play for blood and 0 of 24 for
the reference player. Suite green at **65/65** in 13.2 minutes, `survive` drawing (3,5). Opens #153. v3.37.0 — #143 refuted as opened, its one-word residue fixed (a lesson
whose first sentence was false on 33% of the weeks it could be read). Carries #145 with it. v3.36.0 — #145 closed: the late game asks 51% more and shows none of it,
and the armoury drain that ran 308 weeks unseen now re-announces as it worsens. v3.35.0 — #144 closed: one agenda item had been exempt from ageing for
the whole run (shown on 100.0% of the weeks it existed, now 24.8%). v3.34.0 before it. **#131's measurement question is closed on top of it — the
97.7% is frequency-weighted and cannot be moved by rare content, so it is retired as a target.
#139 is refuted too — measurement only, no game change
and no bump**: the "Fragile is safest" finding does not reproduce on the current build and is not
stable across policies, and the rule it leaves is that a board item must be re-measured before it is
built. #142 CLOSED: `survive`'s bar re-derived from 37 runs (8.1% →
2.7% false failures) and its `standing` reading measured as nearly inert. v3.33.0 — #141 CLOSED: the works are three tiers, not five, and the
agenda's one hint at the sink now names the work this house needs and why. Suite green at **65/65**.
v3.32.0 refuted #141 for the chapel, v3.31.0 closed #140, v3.30.0 shipped #131's second loss. v3.29.0 closed #138, v3.28.0 closed #137, and the measurement session before
those settled the five seams and left the instruments — `catalogue.mjs`, `yard.mjs`, `named.mjs`,
`ghost.mjs`, `scen.mjs`, `sink.mjs` — each with its first wrong version documented in
`test/probes/README.md`. `main`, the item branch and the upload mirror are at this commit; the tree
is clean.

### Before you run anything

    npm install --no-save playwright@1.56.1     # see "the environment" at the end of this section

`node build.js` must be run from the repo root — a `cd` earlier in a compound command silently kills it.
`node build.js --test` writes `dist/test.html`, which every probe and every browser check loads.
`npm test` is the fast tier; `npm run test:all` is all 63 and takes about thirteen minutes. Capture the
whole log, never pipe it through `tail` — the summary line is not the interesting part.

### The board

**The board, ranked by player impact over risk:**

- **#131 — ITS MEASUREMENT QUESTION IS CLOSED, AND THE HEADLINE IS RETIRED AS A TARGET.** Re-measured
  on the current build (`late.mjs 10 420 off`), the year-12 split reads **PERENNIAL 98.3% ·
  LATE-ONLY 1.7%** against v3.27.0's 97.7% / 2.3%. Two shipped losses moved it by nothing — and the
  reason is the metric, not the game: **"A Death In The Family" IS in the late-only list, shown for
  1 week of 246.** The share is FREQUENCY-WEIGHTED, so it is dominated by items that recur every
  week (`~ is not buried properly` tops the late block at 104% of weeks — more than one line a week
  — and `# at the rope in <venue>` appears four times at 20-25% each), and a once-per-run loss can
  never register against them. A third loss would move it about 0.4 of a point.
  So *"the late game reads what week one reads"* is true and will REMAIN true however much late
  content ships, because it measures **what a late week usually looks like** rather than **whether
  late content exists.** Those are different questions and only the first one this statistic can
  answer. The fair metric for the second is the one `fires.mjs` already uses — the share of RUNS
  that see a piece of content, where the patron death reads 9 of the 10 houses that reach its gate.
  **Nothing more should be built to move the 97.7%.** Whether a third loss is worth having is now a
  plain design question with no number pending behind it.
  *Two observations, recorded as observations:* the top late item raising more than one line a week
  wants its own look (several unburied men each get a line), and `agKey` counts one pit item as four
  labels because the venue name is in it — neither changes the split above, since all of them are
  perennial either way.
- **#131's CONTENT — direction decided (losses), and TWO pieces stand: the patron (v3.27.0) and the
  fire (v3.30.0).** Rooms have left the never-lost list by the front door — `keep.mjs` reads 14
  floors burned and rebuilt over 72 houses where 288 house-runs had read zero, ever. What remains
  never-lost and is candidate material for a third piece: the doctore, the doctrine, the collegium,
  the aedile, and the feats (which are records and arguably should stay). The succession also turns
  out to reach real play now — wife and heir "lost" 7/7 on seed LATE, both cleared by the designed
  succession door, which earlier trajectories never lived to use. Whether a third piece is needed
  before re-measuring the late game's read (`late.mjs`'s 97.7% perennial figure) is the next
  decision on this item.
- **#140 — CLOSED in v3.31.0. The premise held, MY STATED MECHANISM WAS WRONG, and the fix it named
  is refuted.** Full write-up in the changelog. In one line: the perks all deliver their tables
  exactly, and four of the five buy nothing at the house level even when the stone is a GIFT — so
  repricing the stone cannot work, and what to do about it is a design decision rather than a
  measurement. The live question it leaves is below.
- **#141 — CLOSED in v3.33.0.** Three tiers: the chapel is insurance that saves the house, the tomb
  is insurance against something cheap, the baths and spina are accepted flavour. The hint that
  points at them now reads the house first. Full write-up in the changelog. Below is how it was
  opened, kept because the item was wrong twice before it was right.
- **#141 as opened — REFUTED FOR THE CHAPEL in v3.32.0, and narrowed to three works.** Its clause fired on the
  first arm that tested it: for a house that neglects unrest, the chapel cuts deaths by rebellion
  from **24 of 64 to 8 of 64** — 6→2, 5→2, 6→2, 7→2 on four seeds, the most stable effect this
  session has measured. It is not a dead perk, it is INSURANCE against a failure mode the reference
  player does not have, because he feasts. The baths, tomb and spina did NOT convert (unstable, seed
  by seed), so what survives of the item is three works rather than four, and it is now a design
  question rather than a measurement — see the changelog for why that is a smaller claim than it
  looks. **Do not quote the baths as converting:** one seed read 6→1 and the other three 5→6, 6→6,
  7→2, which is exactly the vivid single-seed case this project keeps getting burned by.
- **#142 — CLOSED in v3.34.0**, and the calibration found something better than the bar: `survive`'s
  `standing` reading is nearly INERT. Full write-up in the changelog.
- **#142 as opened — `survive`'s bar is set from a rate the pooled tally no longer supports.** 35 runs across
  24 builds now read 3 failures (9%), standing min 0 / median 3 / max 5. The check's own
  false-failure table puts 9% at a true standing rate near 55-65%; its bar was derived from 70%.
  #127's rule says re-derive from the distribution rather than nudge — and the same rule is why it
  was NOT touched in v3.33.0, whose own run is one of the three failures. Doing it in a release the
  bar did not fail is the honest version. *Falsifies if:* the three failures turn out to share a
  cause other than the draw (all three were investigated as variance; only the v3.33.0 one was
  proven so by a cross-build signature).
- **#139 — REFUTED, and the way it died is a rule about the BOARD rather than about a probe.**
  Re-measured on the current build it does not reproduce, and it is not stable across policies:

        alive at week 90, of 72 (3 seeds x 24), the reference player
        veterans 63 · clean 60 · CHAMPION 58 · castoffs 45 · inherited 38

  Champion is third, not first. When #139 was opened at v3.27.0 the same probe read champion 59 and
  clean 48 — a lead of eleven — and **six releases shipped between then and the re-measurement**
  (the #137 nemesis fix alone changed the morale pressure on every house in the game). Across
  policies it swings from first to last: 19 at default, 22 with `gear:false`, 15 neglecting the
  cells, 0 under sine stakes. A ranking that moves like that is a fact about the policy, not the
  opening, which is the same lesson #133 learned and the reason its clause named this test.
  **What survives on every build and every policy is `inherited`:** 38 of 72 here, 34 of 72 at
  v3.27.0, worst under all four policies. Its "Hard" tag is measured accurate, so the tags are left
  alone and nothing is relabelled or retuned.
  *And the blurb was checked too, since it makes its own claim:* "it can die on any given afternoon"
  is TRUE — the champion's founding man dies at median week **13, in 24 of 24 houses** — but the
  house does not die with him: **24 of 24 outlived him**, by a median 146 weeks. The rope is actively
  hard on that scenario, fighting its best man every week until he is gone, and the house still
  recovers. Nothing there is a fault; it is a scenario that reads its own first fortnight honestly.
  **THE RULE THIS LEAVES:** a finding is about the build it was measured on. An item that sits on
  the board across releases must be RE-MEASURED before it is built, not built from the numbers that
  opened it — this one would have shipped a relabelling of a tag that is not wrong.
- **#137 — CLOSED, shipped in v3.28.0.** Sand endings 1-2% → 36-38%, silence 81% → 0-1%, verified on
  its own falsification clause.
- **#138 — CLOSED, shipped in v3.29.0.** Both halves answered: the rope has a works step (opt-in,
  with the reserve extended to mason draws), and the "out of things to buy" headline SURVIVES in
  sharpened form — reachable-but-not-worth-it at the bottom (#140), unreachable at the top. Full
  write-up in the changelog.

**The prior session closed six** — #132, #133, #134, #135, #136 and #131's second half — four of them
refuted on their own falsification clauses. This session killed two of its five seams the same way.
The full #131 record, three refuted theses and all, is preserved in the sections further down.

The hardest fact from last session still stands, verified on four seeds, **288 house-runs with no
exceptions**: every room, all ~15 feats, the doctore, the doctrine, the collegium, the aedile and the
wife were gained hundreds of times between them and lost **zero** times.

### THE AUDIT — ten items, and the four candidates it killed on the way

Swept with `coverage`, `handle.mjs`, `dark.mjs`, a re-run of `late.mjs`, and two fresh probes. Every
item below carries a figure and a sample size; where a number is an OBSERVATION that has not been
asked as its own question, it says so. Ranked by player impact over risk.

**#143 — REFUTED as opened, and the residue is one word.** I read "104% of year-12 weeks" as
fourteen lines crowding the block. It is ~1.04 lines a WEEK, and the agenda loop runs over
`unhonoured(d)`, which windows to the six weeks a burial is decidable — so the fourteen `markUnburied`
keeps never reach the agenda. Re-measured on the current build, 16 houses × 420 weeks: burial lines
are **1.15 in the list and 0.76 shown per late week, 16% of the block**, and the share is FLAT across
eras (15% / 11% / 14% / 16%), so it is not a late-game crowding problem at all.
**What survived is smaller and real:** the `munera` LESSON's door was `(d.unburied||[]).some(m=>!m.done)`
with no window — the last unwindowed reader of that list, in the very release note that claimed to
have fixed the last of them. Open on **97% of weeks**, and on **33% of those (620 of 1,857) the six
weeks its own first sentence promises were already gone.** Windowed on `unhonoured`, the door opens
on 65% of weeks and its claim is true on **100%** of them, false on 0. Shipped in v3.37.0.
*And a claim of mine died on the way:* I measured that lesson holding the villa slot on 1,276 weeks
and starving `acclaim` and `dynasty` to zero. That was my probe — `lessonFor` skips anything in
`d.flags.learned` and I never marked a lesson read, so I had modelled a player who reads nothing.

**#144 — CLOSED in v3.35.0, and it was a live game fault rather than the census artifact it was
opened as.** `agKey` normalises digits and nothing else, so the rope's line took a new key every time
its venue rotated — and a new key is an age of 0, which `agendaTop` shows. `PIT_MOVE` is **4** and
`AG_FRESH` is **3**, so its age ran 0,1,2,3 and reset before it could ever become furniture.
Measured over 12 houses x 320 weeks: the item stood in the agenda on 1,493 weeks and was **SHOWN on
1,493 of them — 100.0%**, age never once above 3, while every other item read age>3 on 9,431 of
17,645 readings and ran as high as 222. Fixed by letting an item declare a stable `key`: shown falls
to **370 of 1,493 (24.8%)** and its age now runs to 67. Full write-up in the changelog.

**#145 — CLOSED in v3.36.0, and the item as opened was WRONG.** Re-measured on the current build the
late game asks a great deal MORE, not the same: the whole list grows **7.85 → 11.85 items a week**
(+51%) and urgency-2 items **double, 2.45 → 5.14**. What is flat is the SHOWN block — 4.70 / 4.61 /
4.62 / 4.59 across the four eras — because both of the game's attention channels filter on novelty,
and the late game's added demand all lands at urgency 2. Of a late house's shown slots, **75% are
there for being NEW and only 3% for being urgent.** Full write-up in the changelog, including the
costed exemplar it found. (16 houses × 420 weeks.)

**#146 — REFUTED on its own falsification clause, and the premise was misdiagnosed too.** The item
guessed the 7.8% at fatigue or too small a yard. Decomposed on the current build (16 houses × 420
weeks, 297 such weeks): **94% are simply an EMPTY yard** — every man gone — against 4% all-tired and
3% all-injured. And an empty yard is not a trap: **141 empty spells, median ONE week, 140 of them
recovered**, gold held while empty a median 772d against the rope's 700d reserve floor, so it can
buy. It is the last man dying and a replacement arriving next week.
**The clause said it would falsify if buying harder closed the gaps without shortening lives.** A
`keep` lever was added to the rope for it (opt-in, defaulting to the old hard 5). 20 controlled pairs,
keep 5 against keep 8: no-fit weeks **7.9% → 7.7%** (fewer in 4 of 20), lifespan **224w → 185w**
(longer in 4 of 20), fame **2,032 → 1,570**. A bigger yard does not close the gaps and measurably
shortens the run — the upkeep is not recovered. **Not the rope's fault and not a fault at all**: the
gaps are the churn of a small yard, and the game is right that enlarging it is a bad trade.
*Kept from it:* `keep` is now a lever any future measurement can use, which is worth more than the
item was.

**#147 — REFUTED on its own clause, and one real gate fault fell out of the refutation.** The item
counted ruin 26 / debt 25 of 60 houses and called seven endings dead. Its clause said it would
falsify if the missing ones are choices the rope declines rather than gates it cannot reach, and
named the test: an arm that deliberately pursues each. Nine arms, 24 houses × up to 900 weeks each,
three seed prefixes (`test/probes/finish.mjs`):

    foreclosed   borrow the line and never repay      22-24 of 24, at week 26, deterministically
    oldAge       call `endTheLine` when offered       2 of 24 (0 on one seed)
    triumph      answer `romeReturn` with door two    1 of 24
    lanistaDied  never name an heir                   0 — the arm lives 155w and the man does not die
    closed       free every earner, sell the rest     0 here; `ends` holds it reachable on a bench

**So the endings are not unreachable, they are declined** — `foreclosed` needs a loan, `triumph` one
door on one event, `oldAge` the refusal of a chair the rope always takes. Same conclusion the `ends`
check reached for three of them several releases ago, now measured for the rest.

The second generation was measured properly while the arm was up (`test/probes/succ.mjs`, 90 houses
× 1,400 weeks, three seeds): a retirement succession is raised in **5 of 90 houses (5.6%)** and
generation 2 with it. Hold the ledger up — coin topped to 20,000 a week — and it is **22 of 30**. The
gate is the house's solvency, not the lanista's clock: on his 62nd birthday his health reads 98-100.

**What the refutation turned up is worth more than the item.** The three RUINS gates had never been
counted at all, and split by term (the `nemesis` design) two of them are conjunctions whose parts
belong to different houses:

* `disgrace` read `blood ≥ 88 && d.favor ≤ 6 && front ≤ 12`. In the two blood-playing arms it stood
  **one term short for 301 and 259 weeks, and the missing term was `favor ≤ 6` on 301 of 301 and 259
  of 261.** `d.favor` is `recomputeFavor`'s weighted mean of your PATRONS, and an empty seat refills
  at `ri(28,42)`, so the mean cannot sit at six; the best any of 24 blood houses reached was 10. The
  ending's own text is about the front rows and the editors and never mentions a patron. **FIXED in
  v3.38.0 by removing the term, not by moving a number.** After: the reference player 0, mercy 0, the
  heirless arm 0, the borrower 0 on all three seeds; a house fighting every bout sine missione 7 / 9
  / 4 of 24, and one taking the death match whenever the bill has one 11 / 8 / 5. `ends`'s own
  `careless` arm, written years earlier and untouched, independently reads disgrace 10 of 21 dead.
* `ruined` stands **one term short for 352-632 weeks in every arm and the term is always
  `grudge ≥ 95`** — see #153.

*Kept from it:* `RUINS`, `RUIN_KEYS`, `facOf`, `lawOf` and `inBreach` on the handle so a gate is
asked of the game and never re-implemented; an `answer(ev, d)` lever on the rope, without which
"the rope never triumphs" is a statement about the rope; and a harness fix — `preferStakes` had never
been wired through `lanista` at all, so an arm passing it came back **byte-identical to the reference
player over 24 houses**, while the arena bill carries 564 sine offers against 1,410 standard.

**#153 — a rival can resent you, and cannot take you apart.** `ruined`'s gate wants a rival at
grudge 95 while the house is at two men and under 120 fame. Split by term over 216 house-runs on nine
policies, it holds two of three for 352-632 weeks and the missing one is always the grudge. On those
weeks the angriest rival in the bay stood at **24-48**, and **no house had ever lost a man to another
house**. It is not decay: the high-water counterfactual — had any rival EVER reached 95, at any
earlier week of that house's life — is **0 of 24 in all nine arms**. Grudge is raised by what YOU do
to a rival (poach his man +18, answer him +8, buy the editor +14) and decays 0.35-1.7 a week, so it
measures your aggression and a dying house has none. The prose describes a hostile takeover; the
game has houses fall over instead. *Falsifies if:* a rival CAN be made to grudge 95 against a
shrinking house by some policy — in which case the item is the gate and not the rival system. If it
cannot, the repair is that a rival with a grudge should be able to close a house, and lowering 95
would only make the ending fire for the wrong reason.

**#148 — CLOSED in v3.39.0, and the spread was not the finding.** Re-measured on the current build,
4 seeds × 24 houses per opening (alive at week 90): **champion 88% · veterans 86% · clean 74% ·
castoffs 68% · inherited 53%** — 35 points, wider than the item as opened, and it does not close
later (58% to 32% at week 180). The clause said the item is to price the tags against that spread,
so each tag was read as a CLAIM and measured. Three of the five are not difficulty ratings at all,
they describe a shape, and a shape can be false:

| tag | the claim | measured |
|---|---|---|
| `inherited` **"Hard"** | it is the hard one | **true** — 53% against 88%, the only difficulty claim the game makes and it is right |
| `champion` **"Fragile"** | "everything the house has is standing in one cell, and it can die on any given afternoon" | **true for a median SEVEN WEEKS.** The reference player has a second man in the yard by week 6-7 on every seed and under every policy, and this is the longest-lived opening in the game |
| `veterans` **"A closing window"** | "every one of them past the top of the hill. Whatever you build, build it fast" | **backwards.** The typical founding veteran is gone in week **37-50**, against 15-16 for `castoffs` and `inherited` and 9-14 for `clean` and `champion` — three to five times longer, on a smaller roster than two of those |
| `castoffs` **"Volatile"** | the outcome is unusually uncertain | **mixed** — widest spread of lives under 2 of 4 policies, and `inherited` is widest under 3 of 4 seeds of the default. Recorded, not changed (#127) |

The veterans result survives the control #139 established: first or joint-first for founding-roster
durability under all four of `scen`'s policies, including `reckless`, where every bout is a death
match. And the obvious confound is the wrong way round — `inherited` starts with six men to
`veterans`' four, so the order statistic favours it, and it still loses by 2×. The measurement is
taken on the MEDIAN founding man rather than the last one for exactly that reason.

**Shipped: the two sentences the game contradicts.** `veterans` is tagged "Old hands" and no longer
tells the player to hurry; `champion` keeps "Fragile" — #139 already measured and refuted the
ordering claim — but its blurb now bounds the state to "until you put somebody in the next one",
which is both true and the first thing a player should do. Nothing is retuned: the spread stands,
and the item was never that the spread is wrong.

**#149 — CLOSED in v3.40.0. Two of the four were correct; the third was hiding three faults.**
`repay` is clean on every reading taken: 500 against 2,400 owed moves gold by exactly 500 and owed to
1,900, an over-payment returns exactly what was owed and closes the loan, repaying nothing owed
returns 0, and a house paying 200 a week for 60 weeks clears the debt and lives. `breakPlan` is clean
too — it lifts the season, a man can be put back on one afterwards, and calling it on a man with no
season does nothing (its only blemish is that it returns `undefined`, so a caller cannot tell a
success from a no-op; recorded, not fixed). `dropKit` removes the right kit, ignores an id that was
never there, and `saveKit`'s eight-kit cap holds once you feed it eight distinct names.

**`applyKit` is where the item paid.** The steel economy states a conservation law about itself —
for anything that wears, `d.gear[id] === gearUsed(d,id) + d.gearCond[id].length`: a piece is on a man
or on the rack, and `d.gearCond` remembers what each unworn one is like. `equipOne` keeps both halves.
Driving the dark paths (`test/probes/kit.mjs`, with `equipOne` first as the control so a failing LAW
could not read as failing code) found:

1. **`applyKit` and `armFromRack` moved steel without moving its condition.** After 120 applications:
   three of a piece owned, all three worn by men, **two still listed on the rack**. And the rack held
   one Noric Gladius at condition 31, a man applied the saved kit, and he read **100** while the 31
   stayed on the shelf — free repair in one direction, forgotten wear in the other.
2. **Both took a man's FORGED, named piece** — `gladius_f` became `sica_f` under `applyKit` and
   `fuscina_f` under `armFromRack` — against the forging's own chronicle line, "It is his, and it is
   not going back on the rack", and against `equipOne`, which refuses.
3. **`condOf` scored every candidate at the wear of the piece already in the slot.** It read
   `g.wear[it.slot]` and ignored the piece entirely, so a man whose sword was at 3 had every sword in
   the armoury scored at 3; `gearScore` docks a worn piece twice and house issue is a flat 100, so the
   "arm him off the rack" button handed out the wooden one. Forty passes over a rack of fourteen
   bought kinds ended with **none of them worn by anybody**. After the fix: 93 calls, 140 slots
   changed, men carrying bought steel again.

*Fixed by* one `swapSlot(d, g, slot, id)` that both bookings go through, `isNamed` guards on the two
dark paths, and `condOf` reading the armoury's record of the candidate. Nothing the reference player
does touches any of it — the rope buys by price and equips through `equipOne` — so no figure in the
suite was measured on the old behaviour. `steel` grows a section 7 holding the ledger, the condition
hand-over, the forged piece and the scorer, and **all four bars were negative-tested**: each one
fails on the unfixed code and passes on the fixed.

**#150 — REFUTED on its own clause in v3.41.0, and it was a UI item after all.** Nothing was ever
paid: every guard in `runGambit` runs before `d.gold -= cost`, and **coin moved on 0 of 1,800 nulls**
over three seeds × 12 houses × 320 weeks (`test/probes/quiet2.mjs`). Split by the game's own guards,
with the reconstruction agreeing with the function on 2,106 of 2,106 calls:

| way out | share of calls | share of the nulls |
|---|---|---|
| the six-week cooldown | 70-73% | **81-86%** |
| the price | 12-16% | 14-19% |
| unknown trick / unknown house | 0% | 0% |
| it ran | 14-15% | — |

Counted the way `dark` counts — gated on `gambitReady` first, so the cooldown cannot appear — 52-63%
would be null and **every one of them is the price**, which is the falsification clause word for word.

**Two real faults on the panel, though.** *The odds it quoted were not the odds the game rolled:* it
worked them out for itself from `gambitDone`, the count stored at the last use, while `runGambit`
rolled against `gambitStale`, that count minus one per `GAM_FORGET` weeks since. Of **6,448 rows the
panel drew, 990 were wrong — and wrong in the same direction every time**, understating by a median 7
points and up to 14. Fixed by `gambitOdds(d,k)`, which both sides now call, so they cannot drift
again. *And a shut door said nothing:* the rival buttons rendered behind `ready && S.gold >= cost`, so
a house short of the price saw a name, a blurb, a price and odds, with no button and no reason; it now
names the shortfall and says a refusal costs nothing.

*Kept from it:* `gambit`, the suite's 66th check — **nothing had ever touched this system** — holding
the forgetting curve (48% fresh → 27% after three throws → 34/41/48% as the town forgets) and all four
refusals with the coin read on each side. Both bars were negative-tested against the unfixed code.

**#151 — REFUTED on its own clause in v3.42.0, and the evidence it was opened on was an arm
artefact.** The clause said it falsifies if a deliberately banking arm reaches rung 5. One does:
across three seeds × 16 houses (`test/probes/rung.mjs`), an arm that stops building and keeps
entertaining reaches **Known in Rome in 5, 4 and 3 of 16 houses**, against 0-1 for the reference
player, and rung 6 (Patron of the Games) comes up too — once for the reference player, twice for the
banker on one seed.

**The "blocked on FAVOUR" reading came from `estate`'s `miser`, which banks by switching the table
off** — and the rope's own note calls the table "the largest lever on the census ladder", worth mean
rung 2.70 against 1.50. Measured side by side: `miser` peaks at favour 52-70 median / 84-89 max; the
same arm with the table left ON peaks at 70-81 / 100. An arm that banks by not spending on the thing
it is trying to buy measures itself, not the price. `estate.mjs`'s header now carries that in full.

**What is actually in the way is coin, everywhere, always.** `canClaimRise` is a conjunction of four
and `riseNeed(d)` hands all four over already split, so nothing was reconstructed. Over 192 house-runs
on four policies and three seeds, of the weeks a house is ONE term short of the next rung:

    rung 3 Friend of the Magistracy   coin held 68-71%    the town's ear 28-32%
    rung 4 Eques                      coin held 89-97%    the town's ear 3-11%
    rung 5 Known in Rome              coin held 96-100%
    rung 6 Patron of the Games        coin held 100%

**Favour appears in no one-short row, at any rung, in any arm that entertains.**

*Shipped:* the panel's coin row had no explanation while the favour row has had one for releases —
and coin is the case that actually happens. It now says the census counts the box on the day it looks
and nothing else, so a house that keeps building never holds enough at one time. Plus a driven
tripwire in `census`: a played house handed 200,000d a week reaches the top rung 8 times in 8, so if
coin ever stops being able to open the ladder, something else has shut it.

**#154 — the last rung asks for two things that cannot both be had.** `Amicus Caesaris` wants 80,000
denarii HELD, at the same moment as favour 90. Across 192 house-runs on four policies and three seeds
it was reached **0 times**; hand the house coin and it is reached by **14 of 16**, so the gate is not
shut on fame, favour or the meter. But the two requirements are opposed: the arm that banks hardest
(`miser`, no table) peaks at **45,343 / 54,074 / 45,337 denarii** across the three seeds — still short
of 80,000 — and its favour caps at **84-89**, under the 90 the rung asks; the arm that reaches favour
100 peaks at **25,620-38,634 denarii**, because favour is bought at the table and the table is the
coin. **This is the shape the source itself removed from `closed`'s gate** — its note says `freed >= 5`
and `freed > lost` were "in direct opposition: the only way to earn the first is to fail the second",
and that no ratio replaced it because anything fitted to two data points is how `survive` got `MEN = 6`.
*Falsifies if:* some policy holds 80,000 while carrying favour 90 — the obvious candidate is
entertaining on a cycle rather than every week the purse allows, which no arm here does. If none can,
the repair is not a smaller number: it is that the census reads `d.gold` alone while the flavour text
beside it says a man "had to BE worth it", and the house's stone, steel and men are worth a great deal
that the censor cannot see (`paragonReach` already draws exactly this distinction for the block).

**#152 — 143 of 424 handle functions are called by no check, and they GROUP into three systems.**
`coverage` finished: **281 of 424 reached, 143 never called.** Per the `wall` rule the list was
grouped before anything was picked, and it is not 143 lone names — the three largest clusters are
whole systems nobody is watching:

    the cost of KEEPING steel   12   rackCap · rackUsed · rackOver · rackStrain · rackRent ·
                                     gearUpkeep · kitKeepOf · repairWeek · perkWear ·
                                     armourerWear · armourerMend · armourerCut
    Rome's own readouts          9   romeRuns · romeTriumphs · romeStanding · romeWord · romePrize ·
                                     romePurseMult · romeSineOdds · romeGreeting · makeImperialBout
    the name Capua settles on    7   addRep · repLeader · repOf · repTotal · repShare · repSettle ·
                                     repWeek   (`chair` drives `repStyle` and nothing underneath it)

The steel cluster is the one to take first: `steel` is a 65-check suite's most thorough check and it
touches 18 functions, none of them these — so the half of the steel economy that **takes condition
away** is guarded and the half that **pays to keep it** is not, which is the exact asymmetry v3.13.0
was written to fix. And a separate hazard the same run printed: **`scales` alone carries 15 functions
no other check reaches**, so one check going quiet takes fifteen readers with it.
*Falsifies if:* a cluster turns out to be readers the UI calls and no check would sensibly drive —
`wall` drove eleven such, refuted both its hypotheses, and was still worth a release for the coverage.

#### The four candidates this audit KILLED, which is the part worth reading

Each of these looked like an item and was measured before it was written up. The ratio is the point.

- **"`clearWatch` is a live button that does nothing" — dead.** `dark.mjs` reads it open on 1,021
  weeks and inert on 926 of them (91%), which is a striking pair. It returns false when
  `!g.watchedBy`, the probe's fixture picks men who are not being watched, and the UI renders the
  button only inside the "Somebody is watching him" block. Fixture artifact.
- **"Quiet weeks have regressed to zero" — dead, and it was my bug.** A fresh probe read 0 quiet
  weeks of 10,800 against v3.22.0's documented 4.1%, which would have meant a shipped fix had
  regressed. `weekWeight` returns `{kind, n}` and I compared it to `0`. Read correctly it is
  **449 of 10,800 = 4.2%**, matching the documented figure — the fix is holding.
- **"The four never-open actions are dead content" — half dead.** They are dead to the REFERENCE
  PLAYER, not to the game, which `dark.mjs`'s own head warns about in those words. Kept as #149 with
  the honest framing rather than dropped.
- **"`handle.mjs` will find actions off the handle" — nothing to find.** 0 of them. The v3.23.0
  sweep plus `actions` deriving its list has held for eleven releases.

### The seams, settled — five asked as their own questions, two killed, three became items

The last session left five loose ends marked "observations, not findings" and this session's whole job
was to confirm or kill them before building on any of them. The record, in the order they were listed:

1. **"The yard shrinks after the early game" — KILLED, and the corpse was the instrument.** keep.mjs's
   men row diffs the ACTIVE set, so every injury books a departure and a return, and a man who dies
   hurt books a departure that never comes back. Run on the SAME houses (seed `LATE`, 72 × 420),
   keep.mjs reads net -53 mid / -67 late while true arrivals (new ids) against true exits (the game's
   own GONE statuses) read net **+30 mid / +27 late** — and the true net is positive in every era on
   all four seeds tried (+13 to +48). Its "left the yard" column runs ~3x the true exits. The yard is
   not shrinking; the instrument was counting injuries as men lost. `yard.mjs` is the corrected
   instrument and keep.mjs's row now says what it is. What the corrected instrument found instead:
   deaths run level across eras (~140-180/1k weeks) and the rope's yard sits at 3-4 men against its
   own want of 5, blocked on 56-63% of late want-weeks by its own price bar (spare() median 51d late
   against a cheapest man of ~202d) — a fact about the rope's reserve policy, recorded here so nobody
   reads it as the market drying up.
2. **"Is the nemesis churn rate right?" — became #137**, and the question dissolved on measurement:
   the rate is not a rate anybody chose, it is the wreckage of one failed lookup. Below.
3. **The contested tier as the model for losable permanents — STANDS, unexamined further, and its
   urgency DROPPED.** #138's count says the late game has an unreachable shelf before it has a
   missing-loss problem, so the copy-this-loop model stays on file until #131's direction is settled.
4. **"Half of everything arrived in the first 90 weeks" — CONFIRMED in passing by the catalogue count**
   (first-holds by era: ~1,250 early / ~380 mid / ~90 late per 72 houses), and absorbed into #138: the
   question was never whether acquisition front-loads, but whether anything is left to acquire. There
   is — the house just cannot reach it.
5. **The five foundings compared — became #139.** Most differences drown in batch noise at n=24×3;
   two survive the sign test on all three seeds, and one of them contradicts its own label.

### #137 — the named enemy cannot survive the week that names him

The seam said a fighter-nemesis (`d.nemesis` — the man of another house the cells have named, not
#134's `d.nemHouse`) arrives and leaves once every 16 house-weeks, and asked whether that rate is
right. Measured as its own question, **72 houses × 420 weeks, two seeds** (`named.mjs`):

    episodes                    725 · 712        (one per 16.6w / 15.9w — keep.mjs's 832/13,678 confirmed)
    ended ON THE SAND           9 (1%) · 11 (2%)     <- the designed payoff: morale, unrest, fame, a line
    ended with a line saying so 126 (18%) · 115 (16%)
    ended in SILENCE            578 (81%) · 576 (82%),  median 3 weeks, most with the man still
                                standing on his own house's roster

The silent 81% could not be attributed by any weekly diff — the clear rate turned out to be THREE
TIMES the visible episode rate, because most episodes are born and unmade inside one week, between two
week-end reads. So `ghost.mjs` traps the assignment itself — `Object.defineProperty(d, "nemesis",
{set})` with a stack capture — and the mechanism fell out in one run. Four seeds × 12 houses × 300w:

    nemeses named            132 / 132 / 149 / 98 rival men · 736 / 586 / 750 / 476 CIRCUIT men
    circuit-born nemeses unmade THE SAME WEEK they were named: 99-100% on every seed (732/736 … 476/476)
    rival-born episodes ended by EVICTION: 82-87% (111, 111, 130, 80) — direct clears of any kind ~10%
    the clearing line, every time: nemesisWeek, ludus.jsx:10009
    (the first two seeds both read 132 rival men — that is a coincidence in one counter, not a
     determinism; the fresh seeds broke it and every RATIO above held)

**The fault, named exactly:** `ludus.jsx:14568` lets a pit man become a nemesis by handing
`nemesisCheck` a synthetic house — `{name:f.house, fighters:d.circuit}`, where `f.house` is drawn from
`SMALL_HOUSES`. `nemesisWeek` at 10007 then looks that name up in `d.rivals`, which only ever holds
the five named rival houses, finds nothing, concludes the man is gone, and nulls him — the same week,
every time, with no chronicle line. And because a HATED circuit man (he killed one of yours) evicts a
standing rival nemesis first (the one-at-a-time rule at 9997 yields to hated), each doomed usurper
also silently destroys the rival episode it displaced — which is why rival nemeses re-appear over and
over (`beatYou` persists, so the next bout against his house re-names the same man) and why the system
churns at 4x a year. The player-facing cost: the game's revenge arc — beat the name on the sand for
+11/18 morale to every man, -4/7 unrest, +12/22 fame — fires on **1-2% of episodes**, and a hated
nemesis's -1.2 morale/week pressure barely exists because he cannot stand a full week.

*Verified:* the churn rate matches keep.mjs's independent count; the trap's attribution is a stack,
not an inference; and the same-week-clear and eviction RATIOS hold within a few points across four
seeds.

**BUILT AND SHIPPED IN v3.28.0, VERIFIED ON THE CLAUSE ABOVE.** The falsification bar was ">50%
silent or sand under 5% after the fix falsifies the mechanism" — measured after: silent 0-1%, sand
36-38%. The fix also surfaced a second fault the first had been hiding (the eviction churn, damped in
the same release), and the balance warning above was measured rather than guessed: the -1.2/wk term
is now live on ~92% of weeks and house lifespans still move only within seed noise. Full write-up in
the v3.28.0 changelog; the `named` check holds the rules. *The decision the item asks:* may a pit man be a
nemesis at all? If yes, 10007 must learn to look in `d.circuit`; if no, 14568 must stop naming him —
either way the eviction rule needs the same look. *Falsifies if:* after the fix, `named.mjs` still
reads >50% silent endings or the sand share stays under 5% — then the lookup was not what starved the
payoff and the item is wrong about its own mechanism. NOTE the fix is a balance change in disguise:
today a hated circuit nemesis drains morale for under a week; fixed, he stands until answered. Measure
the morale term before shipping, and expect `EVENTS`-adjacent checks to move (#136's rule).

### #138 — the reference player has no step for the game's own late-game sink

The open question ROADMAP said decides #131's direction, answered (`catalogue.mjs`, 72 × 420, four
seeds; headline quoted only off houses that lived past 300 weeks): **the acquirable catalogue is 71
keys** — 20 room levels, 9 works and monuments, 19 feats, 3 staff seats, 4 household roles, doctrine,
collegium, aedile, heir, wife, 4 patron slots, 8 census rungs.

    held at death (houses past 300w)   median 32-45 of 71, across the four seeds
    the LAST new item arrives          median week 273-303
    weeks lived after the last new     median 79-105
    first-holds by era, per 72 houses  ~1,250-1,350 early · ~350-430 mid · ~60-125 late

So "the catalogue is exhausted by week 180" is **refuted as stated** — a late house dies holding about
half the shelf, still picking up one or two new things a year. What it NEVER holds is the point.
Never held by ANY late house, any seed (37 of 37, 29 of 29, …):

    all 9 works and monuments     spina 7,000d … capua 150,000d — the file's own comments call these
                                  "the true late-game sink" and "what a fortune is spent on once the
                                  yard is finished", and the agenda nags "Xd sitting in the box"
    census rungs 5-7              15,000 / 30,000 / 80,000d      (known: the accepted threshold design)
    feats gated on untaken acts   threefree, cloth, forge, munera, lion — the rope frees no man,
                                  stages no munus, buys no master steel for the forge

**And the works are not priced out of reach — they are out of POLICY.** Peak gold over a late house's
life: median 12,300-13,300d across the four seeds, max 17,600-29,300d, against a works tier of
5,500-12,000d each. Most late houses could at some point have paid for most of the five works
outright. The rope's `build` step raises the
five rooms and never once calls `beginWork` — its only callers in the whole file are the two villa
buttons and the agenda line (grep-verified). That is `holdMunera`, `setOut`/`comeHome`, `startPlan`,
`gear` and `party` again: the sixth instance of *a policy the player cannot execute is not a policy*,
this time sitting under every "out of things to buy" figure #131 rests on.

*The item:* give the rope a works step (opt-in first, like `gear` was — flipping a default re-bases
the suite and belongs to its own release), then re-measure the late game's gains collapse and the
"nothing left" claim with the shelf actually reachable. *Falsifies if:* a works-buying rope still
cannot finish the works tier on cumulative income — then the shelf is genuinely priced past play, the
"out of things to buy" headline survives, and #131's answer goes back to losses (where the contested
tier stays the model to copy). Either outcome decides #131's direction, which is what the last session
asked of this count.

**BUILT AND SHIPPED IN v3.29.0, AND THE FALSIFICATION CLAUSE FIRED — which is the informative
outcome.** The step exists (opt-in `works:true`; its first version killed its houses and the reserve
had to learn that a mason's draw is an obligation — see the changelog). Measured over three seeds ×
24 controlled pairs: the shelf's bottom is REACHABLE (1-5 works per surviving house, masons idle
9-17 weeks a run) but the tier is not FINISHABLE (all five works: 2 of 72; a monument: never begun),
and building is a net harm on every seed — richer 3/3/1 of 24, longer-lived 2/4/1. So the headline
survives sharpened: the late game's remaining shelf is reachable-but-not-worth-it at the bottom
(now #140) and priced past cumulative income at the top. **#131's answer goes back to losses**, per
this clause, with the contested tier as the model. The stale agenda gate found along the way (the
one hint pointing at the sink asked for the full price when the door opens at the 25% deposit —
fired on 12-15% of open weeks) is fixed in the same release and pinned by `near`.

### #139 — the opening tagged "Fragile" is measured the safest in the game

The five foundings, compared on an outcome for the first time (`scen.mjs`, 24 houses × 420 weeks ×
three seeds, reference player). Discipline first: at this n the median lifespans swing 2x between
seeds (veterans read 130, 173, 281), so nothing is quoted unless its SIGN holds on all three seeds.
Two things do:

    alive at week 90, of 24:   champion 19 · 18 · 22      (pooled 59 of 72)
                               clean    17 · 17 · 14      (pooled 48 of 72)
                               inherited 13 · 8 · 13      (pooled 34 of 72)
    and champion's worst house died at week 44 — every other opening buries houses in single digits.

`inherited` ("Your Uncle's Debts", tag **Hard**, six men on 260d) is measured exactly as sold — the
harshest opening, dead of the ledger it warns about. But `champion` ("One Good Man", tag **Fragile**,
"it can die on any given afternoon") is the gentlest opening in the game by survival, on every seed,
at the median AND at the tail. The one man at 80-90 wins the tier-matched cards the rope takes, and
nothing about the opening kills houses early. *The decision:* relabel the tag to what it actually is,
retune so the promise is kept (the legend's death actually ending runs would do it — today the house
just buys men and carries on), or accept the tag as describing a feeling rather than odds. *Falsifies
if:* the champion's edge is the rope's best-man bout policy rather than the opening — run the same
comparison with `bench` holding the legend off the sand; if champion then reads mid-pack, the safety
was the policy's, not the scenario's. *Caveat, stated:* all figures are the reference player's; a
human playing `inherited` can sell men week one, which the rope never does.

### The method note, which cost the most to learn and is the most reusable

**Three theses in three turns, each refuted by the next measurement.** None survived contact. What kept
working was not the thinking — it was **printing the raw material every single time**. Three confident
wrong answers were caught by three raw tables: the `nemesis` row (episodes counted as possessions), the
censoring window (a rate that moved with the length of the run), and the `200-420d` fee formula (a price
read off one vivid house at the p99 rather than the median). **Not one of the three was visible from the
summary statistic.** Prefer a probe that prints its own denominator over one that prints a percentage,
and run anything cheap on three or four seeds before quoting it.

The probes are kept in `test/probes/` with their faults commented at the lines that carry them; they are
not part of the suite (`test/run.mjs` discovers `test/checks/*.mjs` only). **Read `test/probes/README.md`
before writing a new one** — most of the instruments a new item needs already exist, and each entry says
what its first version got wrong.

### The environment, which will bite a fresh session

The container ships Playwright 1.62.1, which wants a Chromium build (1234) that is not in `/opt`; what is
there is 1194. Every browser check and every probe fails on a version error until you run
`npm install --no-save playwright@1.56.1`. It is deliberately NOT committed — `package.json` should keep
its real floor — so **this recurs in every fresh container and is the first thing to do.**

**The reference player could not come home, and it had re-based every long-run figure since v2.93.0.** The rope had
no travel step, and `comeHome` has exactly one caller in the game — the UI button at line 18653, with no
weekly phase behind it. So the reference house answered `bayCall` at the question step's default `i=0`
("Take the road"), went south, and stood in that town until it died: 5 of 10 houses ever left, **5 of 5
made one departure and zero returns**, 246 to 363 weeks in one town, 54% of all house-weeks away. There
is now a `road` step, on by default, which breaks camp when `welcomeOf` drops below 1. Full write-up in
the v3.21.0 changelog.

**AND THE SHAPE IS NOW CAUGHT MECHANICALLY.** v3.23.0 swept every function the UI calls inside a
`mut(d => …)` closure — which is the definition of a player action — against the handle, and found
**nineteen off it, sixteen of them reachable by a click and by nothing else in the program**:
`callFavour`, `repay`, the nemesis pair, the watch-and-plan four, the kit three, `skipWeeks`, and
more. `actions` derives that list now instead of holding a hand-written one, so the fifth instance
of this fault is also the last that can happen silently. **Exposing them proves nothing about whether
those systems work** — it makes the question askable, and on this project's base rate several will be
dead or faulty when something finally drives them. That is the obvious next item and it is a bug hunt
rather than a design call.

**That is the second harness fix of this shape in two releases** — v3.20.0's was `d.reSignOffer`, an
auctor standing in a blocking modal for eight years. Both are the same failure: **a state the reference
player enters and has no step to leave.** Game line 12244 enumerates what halts a week and is the
authority for the modal half; the road half has no such list, and the general rule is the one to carry
forward — *a policy the player cannot execute is not a policy.* When a rate looks like 91% or 38%, ask
whether it is a rate anybody chose or a rate something is stuck at.

### #131 — the late game reads what week one reads

Every agenda label stamped with the eras it is ever SHOWN in. Re-measured after each of the two harness
fixes, and the headline has now held through both:

                         first pass    after the contract fix    on a house that stays in Capua
    PERENNIAL in year 12+   97.1%              96.5%                        97.7%
    LATE-ONLY in year 12+    2.9%               3.5%                         2.3%

Twenty-eight late-only labels against a hundred and eighteen perennial, half of them able to reach
urgency 3 and almost none of them ever shown. The game does retire its early content — early-only items
are 0.0% of the shown block from year 7 on — and puts nothing in its place. Re-run with
`node test/probes/late.mjs 10 420 off`.

**Three cheap explanations have now been checked and none of them yields a fix.** Late content that
exists but never surfaces is 4 labels, no bug, `agendaTop`'s rule holds. Late systems with no voice is
#132, closed and refuted. And the house having quietly emigrated — the one that looked most promising,
because a house standing in Puteoli for eight years genuinely cannot be shown Capua's late content — is
worth **1.2 points** and moves the finding the wrong way.

**Quote only the year-12 figures.** The early-era percentages swing hard between runs (early-only in year
1-3 read 7.0%, then 45.6%, then 11.9%) because they depend on how many houses survive long enough to be
classified at all.

**What is left is writing new late-game content, which is a design decision about what a great house
should be urgently asked for, not something measurement can settle.** The measuring is finished. Three
explanations that would have made this a bug have each been checked and failed, and the third of them was
a real instrument fault that still did not move the number.

**AND CHASING IT FOUND A LIVE FAULT, WHICH IS NOT WHAT ANYONE EXPECTED.** The estate table below put
14 unburied dead at year 12 — the cap, not a trend. Following that to what the unburied actually cost
turned up a load term with no window, which had quietly retired the game's only multi-week advance
after week ~13 in every house ever measured. Shipped as v3.22.0; full write-up in the changelog. The
lesson for #131 is not about the fix: **"the late game is thin" and "a late-game affordance is
broken" look identical from the agenda census, and only the second one is cheap to settle.** Before
writing new content, it is worth asking of each measured late-game quantity what it COSTS and what the
player can DO about it — that is a bug hunt, and this one took an afternoon.

**THE THESIS WAS ACCEPTED AND THE FIRST PIECE SHIPPED IN v3.27.0.** A patron a house has held for
years dies and the seat refills with a stranger — chosen because a search found that **nothing in the
file ever removed a patron or a room**, the two things the estate table marks as new entirely at year
12. It was blocked by #136 for one release — four checks were fitted to a single RNG trajectory and any
new `EVENTS` key reshuffled every draw after it — and went in unchanged once those were widened.

#### And then: does it ever HAPPEN? — `test/probes/fires.mjs`

Every figure in the v3.27.0 release is about whether the loss is CORRECT. Not one is about whether a
player ever sees it — `patron` hand-builds the state, setting `lanista.age` to `PATRON_AGE + 5`, so it
would pass identically if the gate were unreachable in play. That is the standing hazard's exact
shape, so it was measured before anything else was built. **24 houses × 420 weeks of the reference
player:**

    still up at 420w              0 of 24    weeks lived: median 196, range 17-368
    lanista ever reached 50      10 of 24    at week 217 median (73-253)
    the gate ever opened         10 of 24    at week 217 median (73-257)
    a patron actually died        9 of 24    at week 247 median (104-311), 1-2 times

**It is not dead content, and the right frame is the conditional one: 9 of the 10 houses that reached
the gate saw a death.** The 38% is the survival rate, not the gate — the piece works, and the same
pattern can carry the next one. The one house that reached the gate and never fired had 13 weeks
between opening and dying, which is `pickEvent` being a draw rather than a schedule.

Two things fell out of it that were not the question. **#131's premise describes a state under half of
runs reach** — "a year-12 house" is week 216 against a median lifespan of 196 — so a loss aimed at
year 12 is aimed at the top two fifths of runs by construction. And **a succession resets the gate**:
house 22 went from a lanista of 44 to an heir of 27 and the age term shut for a decade, which is
defensible (a young man's patrons are not dying) but is worth knowing before the next piece leans on
`lanista.age` too.

*Instrument note, since it bit the first draft:* the chronicle is not a counter. `chron` unshifts into
`d.log`, which rolls at `LOG_ROLL` and spills into a capped `d.kept`, so counting death lines
undercounts by an amount that GROWS WITH THE LENGTH OF THE RUN — the denominator fault the brief warns
about, in the one place it would have inflated the answer I wanted. `d.flags.patronDied` is stamped
every firing and never rolls.

#### The second piece, REFUTED before a line of it was written — `test/probes/walk.mjs`

The candidate was "staff who walk out at unrest 90 never do, because a great house's unrest is 1.7".
**Reading the file first refuted the premise on every term**, before any week was played: there is no 90
anywhere, there is no single gate, and two of the three doors have nothing to do with unrest.

    medicus     d.unrest > 72 || repStyle(d) === "blood"    R()<0.06/wk after 6 weeks
    armourer    d.gold < -120                               R()<0.06/wk after 6 weeks
    household   d.unrest > 78 || d.gold < -80               R()<0.05/wk after 8 weeks, never the wife
    poached     rival grudge >= 40 && warmth < 45           R()<0.02/wk after 10 weeks

The medicus door is OR'd with a POLICY the player chooses, and `chair` already measures that arm firing
— the butcher loses his surgeon. The armourer door is pure insolvency. Then 24 houses × 420 weeks,
**4,295 house-weeks, 1,353 of them a late non-blood house:**

    great-house unrest    median 5.7 · p75 15.9 · p90 27.5 · p99 71.8 · max 76.7    (not 1.7, and not flat)
    medicus  unrest > 72  open on 1.61% of all weeks, 0.89% of great-house weeks — NOT never
    household unrest > 78 open on 0.81% of all weeks, 0.00% of great-house weeks
    poached               open on 16.90% of all weeks, 17.52% of great-house weeks — the widest door by far
    what actually left     22 losses · 10 to a late non-blood house · 6 to one that was also solvent

**So staff already leave a great house, and the item as posed is dead.**

*(A "near-miss" was recorded here from that 24-house run — that great-house unrest tops out at 76.7
against a gate of 78, so the household door is shut by a point and a half. **It is not.** At 72 houses
the same figure reads 97.2, 97.2, 71.5 and 100 across four seeds, and the door is open on 0.00% to 0.87%
of great-house weeks depending on the seed. A maximum is the least stable statistic there is and it
should never have been quoted from 24 houses.)*

**And the finding underneath it is better than the item was.** The estate table's "staff at 100% of late
weeks" reads PRESENCE AT A SNAPSHOT, which cannot tell a role that was never lost from one lost and
refilled before anybody looked. The losses are real and the seat refills.

#### THE FIRST VERSION OF THAT FINDING WAS WRONG, AND ITS OWN FALSIFICATION CLAUSE CAUGHT IT

It was published here as *"the late game does not lack losses, it lacks losses that COST anything — a few
hundred denarii against five figures is not a loss, it is a receipt."* That was written off 24 houses,
**one turn after this same document recorded #136's rule that a bar taken over a handful of houses is a
bar on one RNG trajectory.** The vivid case behind it — an armourer lost at 9,809d and replaced a week
later — is the p99 of the distribution, not the median.

The clause said the median-8-weeks figure wanted a bigger sample. It did. The price question needed no
bigger sample at all, only a better instrument: `makeStaff` charges `rnd(skill*5+40)` over `ri(32,56)` /
`ri(48,76)` — 200 to 420 denarii, **a formula with no term for the house's wealth, roster or era** — so
the ratio can be read on every late-solvent week rather than on six losses. **Four independent runs of
72 houses × 420 weeks, ~3,600 great-house weeks each:**

    replacement in WEEKS OF THE HOUSE'S OWN BILL   median 1.1 · 1.1 · 1.1 · 1.1     (p25 0.9-1.0, p75 1.4-1.6)
    replacement as a share of gold held            median 10.4% · 9.1% · 9.0% · 10.7%
    gold a great house actually holds              median 2,976 · 3,403 · 3,464 · 2,891d
    weeks the seat stays empty                     median 1 · 2 · 2 · 1
    the poach door, open on great-house weeks      41.2% · 24.2% · 38.9% · 24.4%   <- NOT stable, do not quote

So the median great house holds about 3,000d, not five figures, and pays about a tenth of its box and
**one week of its own operating bill** to undo the loss. That is not free. The first claim is refuted.

**What survives is sharper, and it is not about price at all.** A staff loss costs roughly one week of
running the house and is undone in one to two weeks. A patron's death costs thirty-five points of
standing and is never undone — the seat refills with a stranger, which is the point. The late game's
losses do not fail because they are cheap. **They fail because they are REVERSIBLE.**

> If the late game is to have stakes, the lever is irreversibility, not price.

That is a decision, and it is also a retroactive argument that v3.27.0's patron piece was built on the
right axis by accident rather than by design. *Falsifies if:* a loss that is cheap but permanent still
reads as trivial to a player — which `late.mjs` can ask once there is more than one of them.

*On the four-run table:* every figure quoted above is stable to within a rounding step across four seeds
EXCEPT the poach door, which swings 24% to 41% and is recorded here only so nobody quotes it later.

*Instrument, verified rather than assumed:* `repStyle`, `warmth` and `houseFolk` are pure reads, so
observing every week does not move the run — and re-running this probe on `fires.mjs`'s seeds reproduced
its 24 lifespans EXACTLY (156, 26, 323, 74, 266, …). An earlier draft read a median lifespan of ~120
against `reach`'s 196 and the difference was entirely the seed prefix, which is why that is an argument
now. Two faults in the first draft were mine: `great` was defined as late AND SOLVENT and the table then
reported the debt doors open on 0.00% of great-house weeks, which is the definition read back rather
than a finding; and losses were nearly counted off the chronicle, which rolls.

#### AND THE REVERSIBILITY THESIS WAS WRONG TOO, IN THE OPPOSITE DIRECTION — `test/probes/keep.mjs`

Third statement of this item, third refutation, and this one is the useful one. The thesis was *"the
late game's losses fail because they are REVERSIBLE."* `estate.mjs` reads snapshots, which is the
instrument that cannot tell "never lost" from "lost and refilled before anybody looked" — so this reads
**transitions**: every week the set of things a house holds is diffed against last week's, and each gain
and loss is recorded with its era and whether that exact thing ever came back. **Four seeds × 72 houses
× 420 weeks.**

Printing the raw table caught the first draft answering a different question. It took `estate.mjs`'s
twenty booleans as one flat inventory and reported the late game at 47% losses — and **832 of the 1,332
losses were `nemesis`**, with `rome` at 130 and `saga` at 100 behind it. A nemesis is an arch-rival who
comes and goes, `d.rome` is a TRIP, a saga is a running story. Three quarters of the signal was episodes
being mistaken for possessions. Split three ways — ESTATE, CONTESTED, EPISODE — the estate reads:

    era     gains   losses   losses/1k wks   losses as a share of estate changes   reversible (censoring-corrected)
    early   1077-984-963-1028    4-10        0.8 - 1.9              0% - 1%                80% - 100%
    mid      333-294-255-366    27-63        6.8 - 14.3             8% - 15%               67% -  75%
    late     124-119- 74-144    40-72       12.9 - 16.3            33% - 38%               62% -  66%

**Late losses are the LEAST reversible in the game, not the most.** The thesis is refuted on its own
statement. (The raw reversibility figure reads 40-49% late, and that number is contaminated: a thing
lost in week 400 of a house ending at 420 has twenty weeks to return and one lost in week 40 has
hundreds, so the rate MOVES WITH THE LENGTH OF THE RUN while the code producing it does not. Restricting
to losses whose house had ≥40 weeks left moves late from 49% to 62%. Both are printed.)

**What is true instead is stable to a rounding step across all four seeds, and it is a better answer
than any of the three theses:**

> The late game is not at risk of nothing. It is OUT OF THINGS TO BUY. Gains collapse by about 88% —
> roughly 1,000 in the early era against 120 in the late — while losses rise fifteenfold. A third of
> everything that happens to a late estate is now a loss. The problem was never the losses.

And the single sharpest fact, verified on all four seeds, **288 house-runs with zero exceptions**:

    NEVER LOST BY ANY HOUSE, EVER — every room (valetudinarium, armamentarium, palus, carceres,
    balneae), all ~15 feats, the doctore, the doctrine, the collegium, the aedile, and the wife.
    Gained hundreds of times between them. Lost zero times.

So "a room still cannot be lost" is no longer a hunch from a search; it is measured. What CAN be lost
late is patrons, the medicus, the armourer, the blessing, the heir and the household — and after
v3.27.0 the patron is the only one of those that is not simply re-bought.

*The method note, which is the actual lesson:* **three theses in three turns, each refuted by the next
measurement.** Reversibility, price, and unrest all felt like the answer and none survived contact. The
thing that kept working was not the thinking — it was printing the raw material every single time. The
`nemesis` row, the censoring window, and the 200-420d fee formula each turned a confident wrong answer
into a correct one, and none of the three was visible from the summary statistic.

#### The estate, so the blank page is not blank — `test/probes/estate.mjs`

"What should a great house be urgently asked for?" has stalled this item twice, so the one thing
measurement CAN do was done: what a year-12 house owns that a week-one house does not. Every quantity in
both eras off the same houses, sorted by ratio, 10 × 420.

    NEW ENTIRELY          5 rooms (15 levels) · census rung 4 · brand tier 3 · 3 edicts standing
                          · law heat 21 · 75 towns known · 3 children
    MUCH MORE OF          fame 119 -> 3,791 (31.9x) · 39 men killed by yours (19.5x) · 36 buried (12x)
                          · 251 bouts (11.4x) · 9 feats (9x) · weekly bill 48d -> 364d (7.6x)
                          · 43 men on the books (5.4x) · 14 unburied dead (4.7x)
    BARELY MOVED          4 men in the yard (1.3x) · 4 patrons (1.3x) · piety 1.0x · 2 ties (1.0x)
    LESS OF               unrest 4.5 -> 1.7 (0.4x)

And the systems, as a share of the era's weeks:

    MAXED BY YEAR 12      armourer, collegium, doctrine, medicus, blessing, wife, doctore, aedile,
                          election — every one of them 100%, from 3-75% early
    NEVER FIRES LATE      the primacy 0% · a vow 0% · a saga 0% · a court case 0% · a loan 0%
    RARE LATE             at Rome 8% · a war 6% · the bay held 43%
    GOES BACKWARDS        a name in Capua 67% -> 52%

**The reading, which is a design thesis and not a measurement: a year-12 house has acquired everything
acquirable and is at risk of nothing.** Every system that could apply pressure is either maxed out
(patrons at 94 of 100, all four staff, doctrine, blessing, every room) or never fires. Unrest — the
game's main pressure system, and the spine of the whole rebellion arc — *falls* by 60%. The perennial
labels that fill a late week are the only things still moving: men on the block, the rope, the unburied.

So the shape of the answer is that **the late game does not need more things to acquire. It needs things
that can be LOST.** That is the proposal to accept or reject before anything is written.

**Two cautions on the above, both mine.** The census rung is a fact about the reference player's
spending, not the ladder's pricing: it reads "ready in every term but the coin" on 93% of late weeks
while having held 25,249d at some point, because it builds whenever `spare()` clears 6,000 and never
banks the 15,000 the fifth rung asks. A `miser` arm (no rooms, rites or parties) reaches rung 5 and 72,752d
and is then blocked by FAVOUR on 93% of late weeks, favour being what parties buy. Neither arm ever stands
on rungs 6 or 7. **That is not new** — `census`'s own head already records "one house reached Patron of
the Games, in year eleven. None reached Amicus Caesaris", measured over 24 houses, and the threshold
design was the accepted outcome of that work. It is re-measured here, not rediscovered.
And the `time`-marked quantities (bouts, buried, feats, towns known) grow with weeks survived rather than
with success, so their ratios flatter. The late column is a survivors' sample: 5 of 10 houses reach it.

### #132 — and the one system with almost no voice

The obvious follow-up was "find the late systems with no agenda line". Six of the seven that a grep
accused turn out to speak, through channels the grep did not know existed. **There are at least four:**

    the agenda      agendaRanked / agendaTop — the week's ranked list
    SECT_MARK       eight marks that light a section and reach the villa's face chips
    the man's ask   PRIMUS_ASK and the ambition channel put a whole event in front of the player
    the arena card  d.games.offers — an offer titled "the primacy of Capua" simply appears there

Anyone claiming a system is silent must clear all four. The collegium is the case that makes the point:
live 430 weeks, never on the agenda, and a mark fires on 100% of them.

The primacy is the survivor. Its gate is open on about half of all play and neither the agenda nor any
mark ever names it — the card is its only voice.

**#132 IS CLOSED — REFUTED ON ITS OWN FALSIFICATION CLAUSE.** The clause was: *"the card carrying the
offer on a decent share of open weeks … would make the primacy surfaced where bouts are surfaced, and the
item is refuted rather than built."* Run against a reference player that never leaves Capua, 10 × 420:

    388 weeks the gate was open · 159 of them with a card up (41%) · 0 of those cards on the road
    78 primus offers  ->  49% of every week a card is up, 20% of every open week

Half the cards a qualifying house sees carry it. The item is refuted.

**The last explanation was wrong too, and it was mine.** The previous pass blamed the reference player's
touring — "by year twelve 91% of its cards are somewhere else" — and wrote it up as a fact about its
policy. It was not a policy. The rope had no travel step and could not come home, so 5 of 5 houses that
ever left simply emigrated. The 91% was the shape of a cage. Three hypotheses were killed reaching this
and all three were mine: the stale card (a card is genuinely up on 41-70% of open weeks), the
`activeG`-versus-`d.gladiators` denominator (identical numbers), and the touring.

What survives, narrowly and truly: the primacy has **no agenda line and no `SECT_MARK` key**, on any
horizon. It is not silent — `d.games.offers` is a channel and it uses it — but it is unnamed in the two
places the player is taught to look. That is a small, cheap, optional item, not the one #132 was.

**And the design question that hung off it is void.** "Whether touring should crowd out the crown of the
city" was asking about behaviour no player exhibits: a house that comes home spends 4% of its weeks away,
not 91%. There is nothing to weigh.

### #134 — CLOSED in v3.24.0, REFUTED on its own falsification clause, and the premise was wrong too

The item named its own refutation: *"the window opening at a decent rate for the answering arm."* It
opens on **4.4% of nemesis weeks, in 8 of 10 houses**, 66 times, once the rope can reply. Against the
arm that never replies: 0.0%, 0 of 10, with the edge sitting at −5 or worse on 1,588 of 2,094 weeks.
The edge was the single blocking term and it was zero because nothing ever answered.

The tension the item was built on does not exist either. Heat and edge hold together on 27.2% of
nemesis weeks: the −3 an answer costs is swamped by +1.4 a week of drift at `ludus.jsx:10090` while
stage < 3, and an answer is only permitted every three weeks. I read one term of the sum, not both.

Full write-up, including the two wrong versions of the rope step and why they were wrong the same
way, in the v3.24.0 changelog.

### #135 — CLOSED, ANSWERED: the death rate was the bout policy, and a season buys a trait

The item was opened deliberately unconcluded — 14 to 21 of every 24 men died before their season paid
out, and the probe put the season on `activeG(d)[0]` while the rope's `takeBout` sorts by average
stat, so the trainee was also the man on the sand. The arm named to settle it was one that trains a
man it does not fight. `bench` is that arm — a list of ids never picked for a bout, applied to BOTH
sides of the pair so the comparison stays like for like. It changes nothing by default.

    season   advertised   finished FOUGHT   finished BENCHED   median weeks benched   injured weeks
    wall           18w         5 of 24          21 of 24              18w                 0.5
    quick          18w         3 of 24          17 of 24              18w                 0.5
    crowd          12w        10 of 24          20 of 24              12w                 0.2
    smith          14w         4 of 24          19 of 24              14w                 0.1
    mend            8w         4 of 24          22 of 24               8w                 0.1

**Both halves belonged to the bout policy.** Benched, 2 to 6 men die instead of 14 to 21, and every
season takes EXACTLY its advertised length because injured weeks fall to about a tenth of one. So the
season's clock is not misdesigned — it is exact for a man who is not being fought, and the overrun
measured in v3.25.0 is entirely the injury a fighting man accumulates. **The v3.25.0 write-up
presented that overrun as a property of seasons; it is a property of seasons plus a bout policy, and
this is the correction.** The deadline fix still stands, because most men do fight and the line
ignored injury either way.

**And the original question is finally answerable, because men now live to collect.** Among pairs
where both men survived (n = 9 to 16):

    season   stat gain over the control   traits held, control vs season
    wall             +5.6                          11 vs 25
    quick           +12.5                           9 vs 19
    crowd            +1.5                           7 vs 22
    smith            -3.7                           5 vs 14
    mend            -11.7                           7 vs 7   (no trait by design)

**A season buys a TRAIT, not stats.** `wall` pays 14 points on paper and nets +5.6, because the
control spent the same weeks drilling and gained too. Three of five land within a few points of
ordinary drilling and two land behind it. The trait is the part that is reliably delivered — roughly
tripled across every kind that has one. Whether that is the intended bargain is a design question;
that it IS the bargain is now measured.

**Do not quote the stat column as a direction per season** — n is 9 to 16 and it swings. The trait
effect is the one large enough to stand on this sample.

### #133 — CLOSED, REFUTED. A tour pays, and the item was opened on the weak statistic

I opened this on three whole-house arms whose *lifespans* read 175 weeks for the shuttling house
against 261 stuck and 259 staying home, wrote "do not quote those medians", and said what would
settle it: *a returning house should end RICHER than one that never went, and it does not have to
live longer to show it.* Measured that way, as controlled pairs — same seed twice, identical but for
`road`, control first — it goes the other way:

    24 seeds x 320 weeks · 12 pairs where the house ACTUALLY toured, 12 where it never left
    at the last week both were still playing (median 205w compared):
      GOLD    never leaves    813      toured  3,547
      FAME    never leaves  1,740      toured  2,841
      the touring house was RICHER in 10 of 12 pairs, more famous in 9 of 12

**And the statistic the item was opened on flips too:** median life 279w toured against 223w staying
home. The original reading was an artifact of three things at once — unpaired arms on different
seeds, lifespans, and **including houses that never toured**, which are identical in both arms and
drag any difference toward zero while looking like more data. Excluding them is what made the effect
visible; it is half the seeds.

**Two things kept honest.** n is 12 touring pairs, so the sign test (10 of 12) is the read, not the
mean — paired runs diverge in RNG and one runaway house drags an average. And the effect is NOT
uniform over time: at week 80 the touring house is richer in only 3 of 11 pairs, at 160 in 4 of 6,
at 240 in 3 of 4. A tour appears to cost early and pay later, which is a different and more
interesting claim than "a tour pays", and this sample is too small to make it.

**What this says about the method, since it is the fourth item this session to turn on it:** the
first pass compared POLICIES across houses; this one compared the SAME HOUSE with one thing changed.
Every item this session that came out clean used the second shape — #135, #134's term split, and this.
Whole-house policy arms are for questions about policies. For a question about one decision, pair it.

### #136 — CLOSED in v3.27.0. Four checks were fitted to one trajectory; three of them were mine

Opened by trying to build #131's first piece: adding one key to `EVENTS`, with its `make` neutered to
`return null` so the event never fired, failed `card`, `ends`, `roads` and `steel` — every one of them
identically to the live version. One extra key reshuffles `pickEvent` and every draw after it, which
`policy`'s head has warned about since v2.98.0 and nothing since had acted on.

All four are widened and their bounds re-derived, none nudged:

    card    3 houses, 38-53 cards      -> 10 houses. True figure 2.90-2.94; the bound had been 3.2
    ends    12 per arm, ~6 dead        -> 28 per arm. `proven` now reads rebellion 8, ruin 4, debt 0
    roads   6 houses, dead counted as failing to come home -> 16, and the dead excluded
    steel   ONE house against one      -> 5 pooled per arm: 88.2% keen against 79.8%

**Two were bad bars rather than small samples**, and both were mine: `roads` counted a house that died
on the coast as one that failed to return, and `steel` compared one house against one with a strict
inequality. **The verification is that the patron event then went in unchanged and all 63 checks
stayed green** — which is the whole point of the item, since every future piece of #131 is a new event.

**The rule this leaves behind:** a bar taken over a handful of houses is a bar on one RNG trajectory.
Before setting one, ask what the statistic does when the draws move — and the cheapest way to make the
draws move, with no change to the game at all, is to add a dead key to `EVENTS`.

### The standing hazard, and it got worse

Across the last two sessions' items, **instrument faults outran game faults by roughly nine to two.** The
list, because the pattern is more useful than any one of them: a grep that read one of four signalling
channels; `agKey` normalising digits but not names, which reported the opposite conclusion on #131;
`unhonoured` not being on the handle; `primusEligible` taking a gladiator rather than a state;
`bayHolder` returning null so "not mine" was true every week; a regex matching a man's mastery instead of
the smiths' bench; a denominator mixing weeks where a thing could happen with weeks where it structurally
could not; a reference player standing in a modal doorway for eight years; and that same player living in
Puteoli for the whole of every long run this project has ever done.

**The last two are the same fault and are worth naming as one.** A reference player is an instrument, and
*a policy it cannot execute is not a policy.* Both times the tell was in the number rather than the code:
38% and 91% are not rates anybody chooses, they are rates something is stuck at. Both times the fix was
one step in `__ROPE.lanista` and the write-up it invalidated was already published. Before trusting any
figure taken over a long run, ask what STATE the reference player might have entered and never left.

Three habits earned their keep and should survive into the next session:

- **print the raw material a regex is filtering.** Two misses were caught by eye that no amount of
  re-reading the regex would have found — the household read 0% while "Nobody feeds this house, or nurses
  it, or keeps it" sat in its own printout at 33%.
- **when a new probe contradicts a measurement you took an hour ago, suspect the probe.** The rites
  reading "never live" came one probe after they were measured at 21% of the year-12 block.
- **when a rate moves with the length of a run and the code producing it does not, look at the
  denominator.** That is the whole of #132. And when the denominator turns out to be a fact about where
  the reference player was standing, keep going — that was the whole of #132 twice over.
- **prove a code-read with a probe before building on it, even when it is obviously right.** The road
  fault was found by grep in about ten minutes and was correct. It still got a probe first, and the probe
  is what produced the 5-departures-0-returns line that made the write-up worth anything.

And the judgement call to weigh before picking the next item: at eight-to-two, the probes are getting into
territory where the measuring is harder than the thing measured. That is a reason to prefer items whose
answer is a decision over items whose answer is another number.

## Changelog (shipped)

### v3.42.0 — #151: the ladder is not held by favour, and the arm that said so had switched it off

#151 said census rungs 5, 6 and 7 were held by nobody, and its clause said it falsifies if a
deliberately banking arm reaches rung 5. **One does.** Across three seeds × 16 houses
(`test/probes/rung.mjs`), an arm that stops building and keeps entertaining reaches Known in Rome in
**5, 4 and 3 of 16 houses** against 0-1 for the reference player, and Patron of the Games comes up as
well — once for the reference player, twice for the banker on one seed.

#### The evidence the item was opened on was an arm measuring itself

The item cited `estate.mjs`'s `miser` — "72,752d held, blocked on FAVOUR rather than coin". `miser`
is `{ build:false, rites:false, party:false }`, and the rope's own note calls the table **"the
largest lever on the census ladder"**, worth mean rung 2.70 against 1.50 and favour 79 against 40.
Side by side over the same seeds:

    miser  (no table)    favour  52-70 median · 84-89 max     best rung 4-6
    banker (table on)    favour  70-81 median ·   100 max     best rung 5-6

A banking arm that banks by not spending on the thing it is trying to buy is not measuring the price.
`estate.mjs`'s header now says so at length, so the next reader does not inherit it.

#### What is in the way is coin, at every rung, in every arm

`canClaimRise` is a conjunction of four and `riseNeed(d)` returns all four booleans already split, so
nothing here is reconstructed — the probe reads the game's own `fameOk`, `favorOk`, `goldOk` and
`full` every week against whatever rung the house is currently reaching for. Of the weeks a house is
exactly one term short, over 192 house-runs:

    Friend of the Magistracy    coin held  68-71%     the town's ear 28-32%
    Eques                       coin held  89-97%     the town's ear  3-11%
    Known in Rome               coin held 96-100%
    Patron of the Games         coin held    100%

**Favour appears in no one-short row, at any rung, in any arm that entertains.** The standing meter —
"the town's ear" — holds the bottom of the ladder, and it is only time.

#### What shipped

The panel's coin row had no explanation. The favour row has had one for releases, written because
"the panel named the number and never once said where the number comes from" — and coin is the case
that actually happens, on 96-100% of one-short weeks from rung 3 up. It now says that the census
counts the coin in the box on the day it looks and nothing else, not the stone or the racks or the
men, so a house that keeps building never holds enough at one time.

And `census` grows a driven tripwire on top of its bench: a played house handed 200,000 denarii a
week reaches the top rung **8 times out of 8**. A free grant is the upper bound on every banking
policy there is, so if that ever stops working, something other than money has shut the ladder and
this account of it is stale. It fails loudly if any coin-granted house ends short of favour, which is
the specific wrong answer this release exists to bury.

#### Opened, not fixed — #154

`Amicus Caesaris` wants 80,000 denarii **held** at the same moment as favour 90, and those cannot both
be had by any policy measured. The hardest-banking arm peaks at 45,343 / 54,074 / 45,337 denarii
across three seeds — short of 80,000 — with favour capped at 84-89; the arm that reaches favour 100
peaks at 25,620-38,634, because favour is bought at the table and the table is the coin. Reached 0
times in 192 house-runs; reached by 14 of 16 the moment coin is handed over. It is the same shape the
source removed from `closed`'s gate for being unsatisfiable, and the repair is not a smaller number.

### v3.41.0 — #150: a panel that quoted the wrong odds, and a shut door that said nothing

The item read `runGambit` returning null on 348 of 1,100 calls and called it "a third of PAID gambit
attempts do nothing". Nothing is paid: all four guards run before `d.gold -= cost`. Measured over
three seeds, 12 houses × 320 weeks (`test/probes/quiet2.mjs`), **coin moved on 0 of 1,800 nulls**.

Split by the game's own guards — re-tested immediately before each call, in the order the function
tests them, with the reconstruction agreeing with the function on **2,106 of 2,106 calls**:

    the six-week cooldown       70-73% of calls    81-86% of the nulls
    the price                   12-16%             14-19%
    unknown trick, unknown house     0%                  0%
    it ran                      14-15%

And counted the way `dark` counts — gated on `gambitReady` first, so the cooldown cannot be one of
its nulls — 52-63% would return null and **every one is the price**. That is #150's falsification
clause word for word: *"every null is the affordability guard, in which case the item is a UI one —
the button should say why."*

#### The panel quoted a number the engine would not roll

`runGambit` rolls against `gambitStale(d,k)` — the number of times you have used a trick, minus one
for every `GAM_FORGET` (26) weeks since you last did. The forgetting is not incidental; it is the
whole of `GAM_FORGET`'s own note, written because "by the eighth throw of anything the odds are on
the floor and stay there for the rest of the run". The panel worked its odds out for itself, from
`gambitDone` — the raw count stored at the last use, which never moves between uses.

Of **6,448 rows the panel drew across three seeds, 990 quoted a number the engine would not use**,
and it was the WORSE number every single time: a median 7 points understated, up to 14. A player
looking at "about 27 in a hundred" was being offered 48.

The fix is not "call the other function". It is `gambitOdds(d,k)`, which the panel and the roll both
call now — the same move `workNeed` and `rackKey` made on their own systems, and the only one that
stops the two drifting apart again.

#### And when it would not work, it said nothing at all

The rival buttons rendered behind `ready && S.gold >= cost`. A house twenty denarii short saw the
trick's name, its blurb, its price and its odds — and no button, and no reason. The cooldown was
already named in the panel header ("not for 4 weeks"); the price was not named anywhere. It now says
how far short the house is, and that a refusal is free, which is the fact the item got backwards.

#### `survive` drew (1,1) on the release run, and it is a false failure

Recorded rather than re-rolled away. The release run read 65 of 66, the one failure being `survive`
at 1 house standing and 1 man — its fourth in 47 runs. Proven false the way v3.33.0's (0,4) was:
`open.mjs` ran 60 headless houses through 26 weeks on both builds and the signature is **identical
house for house** — same week, same men, same gold, same ending, sixty times — so no path a new house
executes differs between v3.40.0 and v3.41.0. Standing 39 of 60 and men 128 on both, which is the
clean baseline #142 measured. Two further `survive` runs on a quiet machine read (2,11) and (1,11),
both passing. Nothing the reference player does calls `runGambit` at all, so there was never a route
by which this release could touch the opening. **The failing entry stays in the committed tally** —
a check's false-failure rate is a property worth keeping honest, and it is now 4 of 47 (9%).

#### `gambit`, the suite's 66th check

**Nothing in the suite had ever touched this system** — no check mentioned `runGambit`, `GAMBITS` or
any of it. The new one is a bench: the forgetting curve (48% fresh → 27% after three throws in one
week → 34% → 41% → 48% as 26 weeks pass at a time, with the stored count sitting at 3 throughout,
which is exactly why reading it lied), and all four refusals with the coin read on each side of every
one. Both bars were negative-tested — restore `gambitDone` and the curve flatlines at 27% while the
worn count falls to zero, and the check names the fault.

### v3.40.0 — #149: the four dark doors, and the steel ledger behind one of them

`dark` found four actions whose gate never opens on a rope-played house — `repay`, `applyKit`,
`dropKit`, `breakPlan` — each a fact about the reference player rather than about the game. The item
said driving them might find them all correct and that this would still be worth the coverage. Two of
them are correct. The third was hiding three faults, and they are not small.

**`repay` is clean.** Borrow 2,400 from Murena: `repay(500)` returns 500, owed goes to 1,900, gold
moves by exactly 500. `repay(999999)` returns exactly the 1,900 still owed, closes the loan and
leaves the rest of the coin alone. `repay(100)` with nothing owed returns 0 and moves nothing. A
house that pays 200 a week for sixty weeks clears the debt and is alive at the end.

**`breakPlan` and `dropKit` are clean.** The season lifts, a man can be put back on one afterwards,
and breaking a season nobody is on does nothing. `dropKit` removes the right kit and ignores an id
that was never there; the eight-kit cap holds once it is fed eight distinct names — `saveKit` dedupes
by `cls · weapon`, so twelve saves of six classes is six kits, which is a fact about the fixture and
not about the cap. The one blemish, recorded and not fixed: `breakPlan` returns `undefined`, so a
caller cannot tell a success from a no-op.

#### The conservation law, and the control that had to run first

For anything that wears, the game states this about itself:

    d.gear[id]  ===  gearUsed(d, id)  +  (d.gearCond[id] || []).length
    owned             worn by somebody     on the rack, each with its own condition

`equipOne` keeps both halves — the outgoing piece's wear goes into the pool, the incoming piece's
condition comes out of it — so `equipOne` is the control arm, and it ran first. **It failed the first
version of the audit**, three kinds out of balance, and the law was wrong rather than the code:
`buyGearItem` pushes a `gearCond` entry for every purchase and `equipOne` only draws one down
`if(wears(now))`, so house-issue stock accumulates entries nobody ever spends. Filtered to `wears`,
the control balances and everything below it is readable.

**1. `applyKit` and `armFromRack` moved steel without moving its condition.** Both assigned `g.kit`
wholesale and touched `d.gearCond` not at all. After 120 applications: three of a piece owned, all
three worn by men, **two still listed on the rack**. Told as one exchange: the rack held one Noric
Gladius at condition 31, a man applied the saved kit, and he read **100** while the 31 stayed on the
shelf. Free repair one way, forgotten wear the other.

**2. Both took a man's forged, named piece.** `forgeForMan` writes `g.named = {slot,…}` and its own
chronicle line is unambiguous — "It is his, and it is not going back on the rack." `equipOne` honours
that with an explicit refusal and `stripAll` skips the slot. `applyKit` turned `gladius_f` into
`sica_f` and `armFromRack` turned it into `fuscina_f`, the first time either was asked.

**3. `condOf` scored every candidate at the wear of the piece already in the slot.** It read
`g.wear[it.slot]` and ignored the piece entirely. `gearScore` docks a worn piece twice — the
`0.5 + c/200` scale and a flat 14 under condition 25 — while house issue is a flat 100, so a man whose
sword was down to 3 had every sword in the armoury scored at 3 and the "arm him off the rack" button
handed him the wooden one. Worst exactly when it mattered most. Forty passes over a rack of fourteen
bought kinds ended with **none of them worn by anybody**; after the fix the same fixture reads 93
calls and 140 slots changed, with men carrying bought steel again. It also repairs `kitFaults`' "better
on the rack" nudge, which compared two scores that were both the man's own wear and so could never
see a keen piece sitting unused.

#### What shipped

One `swapSlot(d, g, slot, id)` that makes both bookings, with `equipOne`, `applyKit` and
`armFromRack` all going through it; `isNamed` guards on the two dark paths; and `condOf` reading the
armoury's record of the candidate rather than the slot. **Nothing the reference player does touches
any of this** — the rope buys by price and equips through `equipOne` — so no figure in the suite was
measured on the old behaviour.

`steel` grows a section 7: the ledger on all three paths (control first), the condition hand-over,
the forged piece, and the scorer. **All four bars were negative-tested** — each fails on the unfixed
code and passes on the fixed, which is the only evidence that a green check is doing anything.

### v3.39.0 — #148: two openings told the player something the game contradicts

#148 asked whether the survival spread across the five foundings is intended and whether the tags
carry it. Re-measured on the current build, 4 seeds × 24 houses per opening, alive at week 90:

    champion   88%      veterans   86%      clean   74%      castoffs   68%      inherited   53%

35 points, wider than the item as opened, and it does not close later — 58% to 32% at week 180. The
spread is not the finding. What the player is told about it is one word each, and **three of those
five words are not difficulty ratings at all**: they describe a shape, and a shape can be false.

**"A closing window" is backwards.** `veterans` says "every one of them past the top of the hill.
Whatever you build, build it fast." Measured on the MEDIAN founding man — the last one is an order
statistic and the rosters are different sizes — a veteran is gone in **week 37-50**, against 15-16
for `castoffs` and `inherited` and 9-14 for `clean` and `champion`. Three to five times longer than
anybody else's men, on a smaller roster than two of them. The confound runs the wrong way:
`inherited` starts with six to `veterans`' four and still loses by 2×. And it survives #139's
control — first or joint-first under all four of `scen`'s policies, including `reckless`, where
every bout is a death match. There is no window; "build it fast" is an imperative about a clock
that does not tick. Tagged **"Old hands"** now, and the last sentence of the blurb is gone.

**"Fragile" is true for a median seven weeks.** `champion` says "everything the house has is
standing in one cell, and it can die on any given afternoon". The reference player has a second man
in the yard by **week 6-7 on every seed and under every policy tried**, and this is the longest-lived
opening in the game (median 158-256 weeks). The tag stays — #139 already measured the ORDERING claim
and refuted it, and on week one, which is when the player reads it, the sentence is true. What ships
is the bound: "standing in one cell **until you put somebody in the next one**", which is true and is
also the first thing a player should do about it.

**"Volatile" is left alone.** `castoffs` holds the widest spread of lives under 2 of 4 policies, and
`inherited` is widest under 3 of 4 seeds of the default. Mixed is not a finding, and #127's rule is
that a threshold — or here a word — does not move on a number that will not hold still.

**"Hard" on `inherited` is correct** and is the only difficulty claim the game makes: 53% against 88%.

*Kept from it:* `scen` grows three tests, one per testable tag — when the founding roster actually
goes (median and last, so roster size cannot carry the result), how long a one-man house stays a
one-man house, and the quartile spread of lives, because a median is exactly the statistic that
cannot show what "volatile" means.

### v3.38.0 — #147: the endings are declined, not unreachable, and one gate was reading the wrong people

**#147 is refuted on its own clause.** It counted ruin 26 and debt 25 of 60 houses, called seven of
the twelve endings dead, and said it would falsify if the missing ones are choices the reference
player declines rather than gates it cannot reach. Nine arms, 24 houses × up to 900 weeks each on
three seed prefixes, each arm the smallest deviation from the rope that could reach one ending:

    foreclosed   borrow the largest line, never repay      22-24 of 24, at week 26
    oldAge       call `endTheLine` the week it is offered   2 of 24 (0 on one seed)
    triumph      answer `romeReturn` with its second door   1 of 24
    lanistaDied  never name an heir                         0 — the arm lives 155w and the man lives
    closed       free every earner, then sell the rest      0 here; `ends` holds it on a bench

`foreclosed` is not even rare — it is deterministic. Murena's cap is 2,400 at 5.8% a week, the gate is
`owes > principal × 4`, and ln4/ln1.058 is 24.6 weeks, so 22 of 24 houses foreclose at week 26 with
9,825 owed and no variance between them. The rope had simply never borrowed.

**The second generation, measured properly** (`test/probes/succ.mjs`, 90 houses × 1,400 weeks over
three seeds): a retirement succession is raised in **5 of 90 (5.6%)**. Hold the ledger up — coin
topped to 20,000 a week — and it is **22 of 30**. So the gate is the house's solvency and not the
lanista's clock: on his 62nd birthday his health reads **98-100**, because the staff, the baths and
the feasts outrun the 0.045-a-year decay by a wide margin. Left alone with nothing but age against
mending he is dead at 57-59 and would never see the gate at all; a real house never leaves him alone.

#### The fix: `disgrace` was a two-constituency ending with a third constituency in its gate

The three RUINS gates — `banned`, `disgrace`, `ruined` — had never been counted by anything. They are
conjunctions, so following `nemesis` each was asked of the game's own `RUINS[k].need(d)` and split by
term beside it, with a "one short, and which term is missing" tally under that.

`disgrace` read `repOf(blood) >= 88 && d.favor <= 6 && facOf(front) <= 12`. Over 216 house-runs it
fired zero times. In the two arms that play for blood it stood **one term short for 301 weeks and for
259 weeks, and the missing term was `d.favor <= 6` on 301 of 301 and on 259 of 261.**

`d.favor` is not the crowd. It is `recomputeFavor`'s weighted mean of your **patrons**, and
`patronWeek` refills an empty seat at `ri(28,42)`, so short of the list emptying outright the mean
cannot sit at six — the best any of 24 blood houses ever got it to was 10. Read the ending's own text:
the front rows stop coming, the editors stop asking, Capua would rather watch something else. Not one
word of it is about a patron.

**The term is removed rather than moved.** Nothing is fitted; a term that belongs to another system
came out of a gate that has two terms of its own, both of which its prose describes. Measured both
ways on three seed prefixes × 24 houses:

    the reference player          0    front tops out at 22 — not even the "hostile" band
    mercy, heirless, borrower     0    on all three seeds
    every bout sine missione      7 / 9 / 4 of 24
    the death match when offered  11 / 8 / 5 of 24

and `ends`'s own `careless` arm — written years before this and untouched by it — independently reads
**disgrace 10 of 21 dead** over its 120-week arc. The ending of one way of playing, reachable by
playing that way, and shut for everyone else.

#### Three instrument faults, and one of them was in the shared rope

* **`preferStakes` had never been wired through `lanista`.** An arm passing it came back
  **byte-identical to the reference player** over 24 houses and 4,000 weeks — same endings, same weeks
  lived, same raw rows. #136's rule says a live lever cannot do that, so the lever was dead: a stakes
  census over 1,702 played weeks found the arena bill carrying **564 sine offers against 1,410
  standard**, and `lanista` was collapsing every stakes option into a strict `wantStakes` that
  `takeBout` then filtered on. The default is untouched on purpose — with neither option given it is
  still `wantStakes:"standard"`, which is what every figure in this project was measured on.
* **`succ`'s clock arm was frozen.** It advanced the lanista's age with `A.WEEKS_PER_YEAR`, which is
  not on the handle; `x % undefined` is NaN, the age never moved, and twelve rows read "he never got
  to 62" while the arm beside them was reaching 62 in twenty-two houses of thirty. Two arms of one
  probe disagreeing is the alarm. It reads `yearOf` now and prints the age each row ran to.
* **The probe was called `ends` first**, on a misreading of a handle comment as pointing at a deleted
  probe. It points at `test/checks/ends.mjs`, which is alive and already answers `foreclosed`,
  `closed` and `oldAge`. Renamed to `finish`, and the handle comment corrected — two files of one
  name in two directories is how a suite ends up with two answers to one question.

#### What is opened rather than fixed

`ruined` stands **one term short for 352-632 weeks in every arm and the term is always
`grudge >= 95`.** On those weeks the angriest rival in the bay stood at **24-48** and **no house had
ever lost a man to another house.** It is not the grudge decaying either: the high-water
counterfactual — had any rival EVER reached 95 at any earlier week of that house's life — is **0 of
24 in all nine arms.** Grudge is raised by what you do to a rival and decays 0.35-1.7 a week, so it
measures your aggression; a house shrinking to two men has none to measure. The gate's prose is a
hostile takeover and the game has houses fall over instead. Lowering the 95 would make the ending
fire for the wrong reason, so it is **#153** and not a smaller number.

*Also in:* `RUINS`, `RUIN_KEYS`, `facOf`, `lawOf` and `inBreach` on the test handle, so a gate is
asked of the game and never re-implemented beside it; an `answer(ev, d)` lever on the rope, without
which "the rope never triumphs" is a statement about the rope; `ends` grows a section 6 holding
`disgrace` on a bench and driven, plus a tripwire that speaks up if `ruined`'s grudge term ever comes
within reach.

### v3.37.0 — #143: the last unwindowed reader, in the note that said there were none left

#143 was opened off my own misreading. The audit recorded the burial line at "104% of year-12 weeks"
and I wrote it up as fourteen lines crowding the block. It is **~1.04 lines a week**, and the agenda
loop runs over `unhonoured(d)` — windowed to the six weeks a burial can still be decided — so the
fourteen `markUnburied` keeps never reach the agenda at all. Re-measured, 16 houses × 420 weeks:

    burial lines        in list/wk   shown/wk   share of the shown block
    year 1-3                  1.03       0.70              15%
    year 7-12                 0.96       0.63              14%
    year 12+                  1.15       0.76              16%

Flat across every era. Not a late-game crowding problem, and the item as written is refuted.

**What survived is one word.** The `munera` lesson's door read `(d.unburied||[]).some(m=>!m.done)` —
no window — which is the exact pattern v3.22.0's note beside `weekWeight` says was "the only reader
of that list without one". It was not the only one. `markUnburied` keeps fourteen men for ever and
only `holdMunera` clears one, inside the six weeks, so the door stood open on **97% of weeks** — and
on **33% of those (620 of 1,857) the six weeks the lesson's own first sentence promises were already
gone.** A note whose opening claim is false a third of the time it can be read is the `near`/`words`
fault exactly. Windowed on the game's own `unhonoured`: the door opens on 65% of weeks and its claim
is true on **100% of them, false on 0.**

**And a finding of mine died on the way, which is the part worth keeping.** I measured that lesson
holding the villa tab's lesson slot on 1,276 of 1,909 weeks and starving `acclaim` and `dynasty` to
zero — a dramatic queue-starvation result in a class this project has documented. It was my probe.
`lessonFor` skips anything in `d.flags.learned`, `learned` is written by an explicit `read()` at
ludus.jsx:19891, and my probe never marked a lesson read — so I had measured a player who reads
nothing and reported it as the game. Caught before it was written up, by asking who sets the flag.

This release also carries **#145** (below), because the #143 fix landed after that release's suite had
started and a build the suite has not seen does not get promoted.

### v3.36.0 — #145: the late game asks more and shows none of it, and one drain ran 308 weeks unseen

The audit opened #145 as *"the game asks a year-twelve house exactly as much as a week-one house"*.
Re-measured on the current build — #139's rule, and #144 had just changed what the agenda shows — the
premise is **wrong in the interesting direction**:

    16 houses x 420w     whole list   SHOWN   urgency3   urgency2   urgency1
    year 1-3                   7.85    4.70       0.96       2.45       4.45
    year 3-7                  10.82    4.61       1.14       3.80       5.88
    year 7-12                 11.86    4.62       1.19       4.56       6.11
    year 12+                  11.85    4.59       1.14       5.14       5.58

The late game asks **51% more** and the shown block does not move a hair. The reason is that the
extra demand is all at urgency 2, and **both** of the game's "look here" channels filter on novelty:
`agendaTop` keeps `urgency>=3 || age<=3`, and the tab mark's own code is `tab !== k && m.fresh`, with
a comment saying `m.urg > 0` was removed precisely so a standing item could not keep the badge lit.
Of a late house's shown slots, **75% are there for being new and 3% for being urgent.**

**What that filters out of a year-twelve house, per week it is carried:** the armoury over capacity
86% · a rival holding the bay 55% · men who have STOPPED ASKING for what they want 38% · the master
smiths open 36% · a doctore offering 28% · patrons fallen below Rome's ask 14%.

**And the first of those is a costed drain that ran for three hundred weeks unseen.**

    over its racks   mean over   wear strain   rent/wk   longest unbroken run   SHOWN
    year 1-3    2%        1.0        1.07x        4d              11w
    year 7-12  70%       12.0        1.64x       48d             150w
    year 12+   86%       22.1        1.71x       88d             308w           0.5% of late weeks

A year-twelve house pays **88 denarii a week** — about a quarter of its whole weekly bill — and wears
every piece of steel **71% faster**, for runs of up to **308 consecutive weeks**, and is shown the
line on **one late week in two hundred**. It was told for three weeks, once, when the condition was
one piece over.

**The cause is #144's normalisation, inverted.** `agKey` flattens every digit to `#`, so "1 past what
it holds" and "22 past" are one key and one age. #144 gave a churning sentence a stable identity; this
gives a flattened number a moving one — `rackKey` bands the magnitude, so the item is news again when
it materially worsens and silent while it merely persists. Measured both ways on the same instrument:
**0.5% → 6.3% of late weeks shown.** News, not nagging.

The sub-line now carries the strain it is costing (`71% faster`) rather than "everything wearing
faster", because the number is the argument. And `agenda` stays inside `bulk`'s 200-line cap — the
explanation lives on `rackKey`, the same call `bulk` forced on #144's `workNeed`.

### v3.35.0 — #144: one agenda item was exempt from ageing for the whole run

The audit opened this as a census artifact — one pit item counted as four labels because the venue's
name is inside it. It is a live game fault, and the mechanism is an exact interaction between two
constants four apart.

`agKey` is `replace(/\d+/g,"#").slice(0,48)`: it normalises digits and nothing else. The rope's line
is `${men.length} at the rope in ${pitOf(d).name}`, the rope moves every **PIT_MOVE = 4** weeks, and
a new key is an age of 0. `agendaTop` keeps anything with `age <= AG_FRESH`, which is **3**. So the
item's age ran 0,1,2,3 and reset one week before it could ever pass the bar.

    12 houses x 320 weeks          in the agenda   SHOWN      age above 3
    the rope's line, before             1,493      1,493  =100.0%      never
    the rope's line, after              1,493        370  = 24.8%      runs to 67
    every other agenda item                  —          —        9,431 of 17,645 readings, max 222

**An item's identity is not its sentence.** `add()` takes an optional stable `key` now, `agId(a)` is
that key where it exists and the old label-derived one where it does not, and the rope declares
`"pit"`. Nothing else changes: every item without a key ages exactly as before.

**The check that should have caught this had the right bar and the wrong key.** `week` holds
MAX_STANDING — no single label may be in the shown block on more than 34% of weeks — and the fault
walked past it by splitting into four labels of ~25% each. **The fault evaded the bar by the same
mechanism that caused it.** Keying that tally by identity was the obvious repair and it is NOT
sufficient: with no declared key `agId` falls back to the sentence, the four labels are four again,
and the check passes — verified, not assumed. So the guard is a different statistic. A real item is
new once and then ages; one whose identity rotates keeps coming back new. Healthy items read **3-5%**
new-again over the weeks they appear; the rope's line read **49-58%**. The bar is 20%, and the
failure text names the fix. Verified both ways: it fails on the unkeyed build and passes on this one.

### v3.34.0 — #142: the bar moves on evidence, and the calibration found the better fault

`survive` failed v3.33.0's release run at (0,4) and the failure was proven false by a cross-build
signature. That opened #142 on its false-failure RATE. The rate turned out to be the smaller half.

**The bar moved, and the v2.87.0 note is what licensed it.** That note identified this exact
tightening years ago and refused it — *"it would be a constant fitted to ONE event... a bar is moved
when the evidence says where to put it"*. The tally now holds **37 runs across 24 builds with no
drift** (mean standing 3.11 in the first half against 2.95 in the second; men 5.44 against 5.11), so
pooling is defensible and the distribution sets it:

    bar                                fires on the 37 healthy runs
    standing<2 AND men<5   (was)       3  = 8.1%    3.15.0(1,2) 3.20.0(1,4) 3.33.0(0,4)
    standing<2 AND men<4   (is)        1  = 2.7%    3.15.0(1,2)
    standing<1 AND men<4               0  = 0.0%

4 is chosen over the 0% options because a run at **(1,3) should still fail** — weak on both readings
at once is what the conjunction is for — and because two of the three retired failures are known not
to be the game. (1,2) is left failing on purpose. The design budget was 1.6%; 2.7% is close and 8.1%
was not.

**And the sensitivity was measured, which matters more.** A quieter bar is only an improvement if it
still catches what the check exists for, so three gutting levers were run headlessly over 60 houses
each — big enough that the reading is not itself a five-house lottery:

    clean                     39 of 60 standing · 128 men
    weekly bill x3            44 · 123      <- NOT a gutting, and the most instructive lever
    opening gold 800 -> 150   39 ·  94
    bout purses x0.3          40 · 104

**`standing` is nearly inert; `men` is the half that responds** — and the conjunction is GATED on the
dead term. That is one cause under both symptoms: it fires when standing dips by luck, and would sit
quiet while the economy moved. It stays a conjunction (the two absolute guards above it are the
catastrophe net and this is the middle ground), but the head now says plainly that **at five houses
this cannot be an economy-regression detector**: the gold gutting is a 27% fall in men, which scales
to about 10.7 → 7.8 on five houses and is inside ordinary variance.

**The lever that taught the most was the one that did nothing.** Tripling the weekly bill was chosen
as the gutting and is not one — at 26 weeks a house has three to five men and no buildings, so its
bill is 30-40d and tripling it is nothing against purses. Had that been read as "the check missed a
3x cost regression", this release would have shipped a confident wrong finding about `survive`. Sixty
headless houses said otherwise. **Suspect the lever before the instrument.**

`open.mjs` is graduated into `test/probes/` as the instrument for the question `survive` cannot
answer — the project's own long-standing note asked for it (*"ask 'has it moved' with a fixed policy
across builds, not with the check"*), and its real power is that an unchanged opening gives an
IDENTICAL signature rather than a close one, which is how v3.33.0's (0,4) was settled. Two tally
entries written by the deliberately-broken builds were removed: they carried v3.33.0's label and not
its code, which is precisely the dirty data a tally is worthless with.

### v3.33.0 — #141 closed: three tiers, not five, and the hint now names which one you need

v3.32.0 refuted #141 for the chapel. This finishes the item by asking the same question of the tomb
and then acting on all five answers.

**The tomb's door, counted before any arm was built to push a house through it.** Regard has a named
failure the way unrest does — `regardRefuse` is `regardOf(g) <= 18`, a man who one day will not go
out — so the tomb is the chapel's SHAPE. Whether it is the chapel's STORY is cheaper to count than a
cruel policy arm is to build, which is `walk.mjs`'s habit: count the door first.

    refusing man-weeks, control -> with a free tomb
    reference player   130 of 10,160 (1.28%) -> 53      ·   172 of 9,407 (1.83%) -> 44
    neglecting the cells   263 of 9,058 (2.90%) -> 140  ·   314 of 6,972 (4.50%) -> 94

**The door opens and the tomb halves it.** So the works are three tiers, not the flat "four dead
perks" this item was opened at:

    the chapel   its quantity has a named ENDING       converts, and it saves the house
                 (unrest -> rebellion)                 24 deaths of 64 -> 8
    the tomb     a named FAILURE that is CHEAP         converts, but a refusal costs a man-week,
                 (regard -> a man will not go out)     not a house — halved, and worth little
    baths/spina  no failure mode behind them at all    do not convert, and cannot: fatigue is a
                 (fatigue; crowd, 1 of ~15 terms)      modifier and crowd is diluted by design

**The baths and the spina are ACCEPTED as flavour, which is a decision and not a shrug.** Giving
fatigue a terminal state means building a new system beside strain and injury, which already occupy
it; the spina's +4 crowd is one term of fifteen by design. Both deliver exactly what they promise
(v3.31.0), and repricing them buys nothing measurable, because #140 established that FREE is the
upper bound of any purchase.

**What ships instead is the thing the measurement actually indicts: the game never told you which
one you needed.** The agenda's single hint at the sink said *"there are things a house this old can
start building"* to every house alike — to one at unrest 9 and one at unrest 79 identically. That is
not a claim about anything, and it is the `near`/`words` class this project has now shipped fixes for
five times. The line reads the house before it speaks:

    unrest >= 30           -> the shrine, "the cells are at 55 and a shrine takes 1.1 off every week of it"
    a man past caring      -> the tomb, "2 men are past caring what you think — 0.4 of that a week"
    two or more worn men   -> the baths, "3 men are worked past what they have"
    nothing wrong          -> the plain line, unchanged. A house with no live problem is not sold
                              insurance it does not need.

Each arm requires its OWN work to still be buildable, and the reason carries the house's own figure
so a player can price it — which is the whole point, since these perks are worth a great deal or
nothing depending on a number only he can see.

**`survive` FAILED on this release's run at (0,4) — a new minimum — and it is a FALSE failure,
proven rather than argued.** The check's own head says to price the bar before hunting the bug, and
the technique it names is the one that settled this: *ask "has it moved" with a fixed policy across
builds, not with the check.* Sixty houses × 26 weeks through `__ROPE`, v3.32.0's source against this
one, printing each house's week, men, gold and ending:

    standing 39 of 60 · men 128        — and the two signatures are IDENTICAL, house for house

Identical is the useful word. It is not "within noise": no path a new house executes differs, which
is what one would expect from a diff that consumes no RNG draw — `workNeed` and `regardRefuse` are
pure reads and the rest is a handle line and a sentence. `policy` (24 houses × 320 weeks) and `ends`
(28 per arm) also passed, and both are far larger samples of the same opening economy than
`survive`'s five houses. **Then two clean re-runs both came back (3,4)** — the identical pair
v3.32.0 drew — so the tally now carries `3.33.0 (0,4) FAIL · (3,4) · (3,4)` and the release is
promoted on that, the way v3.15.0 and v3.20.0 were before it.

*And one observation for a future item, deliberately NOT acted on here:* the pooled tally now reads
**3 failures in 35 runs (9%), standing min 0 / median 3 / max 5.** The check's own false-failure
table puts 9% at a true standing rate near 55-65%, not the 70% its bar was derived from. Re-deriving
that bar from 35 runs is real work and #127's rule says to do it from the distribution — but doing
it in the release whose run just failed would be nudging a threshold to pass, which is the same
rule's other half. It goes on the board, not into this diff.

**The rule lives in `workNeed` rather than inside `agenda`, because `bulk` caught the first draft
growing that function past its cap** — and the right answer to that check is a named concept, not a
bigger allowance. `agenda` ends this release at 198 lines against its limit of 200, where it began at
193. `near` holds all four arms, asserting the DECISION off the handle and the SENTENCE it produces
separately, because a rule that picks the chapel and a line that then fails to say so are different
faults and this check exists for the second kind.

### v3.32.0 — #141 refuted for the chapel: it is insurance, not a dead perk

v3.31.0 closed #140 by measuring that four of the five works buy nothing at the house level even
granted FREE, and opened #141 to decide what to do about it. **Its falsification clause fired on the
first arm that honestly tested it, which is the second time in two releases that testing the clause
before building was what saved the item from being wrong.**

The clause: *"a house driven at a policy that leans on unrest does convert the chapel into
survival — this measured the reference player, whose unrest sits at 9.9 and whose deaths are the
ledger's."* `perk.mjs` grows a `hot` arm built from the rope's own switches rather than a number of
mine — `cells:false`, which takes away the feast and the cell-walk, the only two levers a player has
against unrest. And the measurement is no longer fame or lifespan, which are downstream of
everything and can always be argued away as noise: **it is the ENDING**. The chapel's job is unrest,
unrest's job is the rebellion arc, and a rebellion is a named way to die.

    deaths by REBELLION, 16 houses a seed, control against the same seed with a free chapel
    seed PKA   6 -> 2        peak unrest 79.3 -> 40.5
    seed PKB   5 -> 2        peak unrest 53.2 -> 35.5      (the rebellion arc's first gate is 70)
    seed PKC   6 -> 2        peak unrest 78.1 -> 26.2
    seed PKD   7 -> 2        peak unrest 78.1 -> 75.0
    pooled    24 of 64 -> 8 of 64

**So the chapel is not a dead perk. It is insurance against a failure mode the reference player does
not have.** The mechanism is clean and it explains the whole of #140's cool-run null: a chapel is a
DRAIN, and a drain only matters when there is inflow. A house that feasts has no sustained inflow,
so 1.1 a week does nothing and the cool arm reads a coin flip; a house that neglects the cells
accumulates, and the same 1.1 a week holds it under the gate that kills it.

**Two things did NOT convert, and one of them nearly went in as a finding.** The baths read 6→1 on
the first seed — a clean-looking halving — and 5→6, 6→6, 7→2 on the other three. The tomb and the
spina are the same story. Only the chapel survives four seeds, and the baths are recorded here
precisely so nobody quotes that first seed later. What is left of #141 is three works rather than
four, and the honest framing of it is much weaker than the item was opened at: three perks that a
reference player has no use for, on a shelf he cannot afford anyway (#138), one of which has now
turned out to be doing its job in conditions nobody had measured.

**An arm was built and DISCARDED on the way, which is the part worth keeping.** The first hot arm
was `cells:false` *and* sine stakes: unrest reached 40.6, which looked like the clause's house — and
lifespan collapsed to 40 weeks, because those houses were dying of an empty yard rather than of the
cells. A null result there says nothing about the chapel; it says the arm was answering a different
question. Both arms are kept in the probe with that written at the top of them, because "the perk
did not help" and "the house died of something else first" are indistinguishable from a rate and
this project has published the confusion before.

**The guard that ships with it is delivery, not value.** These perks are situational, so their worth
cannot honestly be pinned by a check — but a perk silently DISCONNECTED would read exactly like a
perk that does not matter, which is the distinction this item spent two releases getting wrong. So
`stone` now drives each kind through the game's own `worksWeek` and holds it to the size its own
table names: calm 1.1 off unrest, fame +3, regard +0.4 a man, and the two that are read elsewhere
(the baths' rest, the spina's crowd) at least registering. Verified by disconnecting the chapel's
calm line — it fails, naming the figure.

### v3.31.0 — #140 closed: the perks work, and four of them buy nothing

#138 measured that a works-buying house ends poorer and shorter-lived and opened #140 with a stated
mechanism: *"the perks are priced against quantities that are already solved — the chapel's calm
1.1/wk against a late-house unrest median of 5.7."* **That was mine and it was wrong.**

**The falsification clause named a fame-maximising policy arm. `perk.mjs` answers it at the upper
bound instead, which is stronger than any arm:** grant each work FREE at week one — no deposit, no
mason's draw — and every purchasing policy that could ever exist is bounded above by what that
measures. Three seeds × 16 pairs, control run first:

    work    perk        the quantity its OWN table names        fame better   life longer
    chapel  calm 1.1    unrest  9.9 -> 6.1 / 9.1 -> 4.3 / 10.2 -> 6.3   23/48        22/48
    baths   rest 6      fatigue 15.4 -> 12.3 / 17.4 -> 13.3 / 17.1 -> 13.6  20/48    19/48
    tomb    regard 0.4  regard  +3.0 / +3.5 / +1.0                   20/48        22/48
    spina   crowd 4     (reads through the purse; unstable)         18/48        19/48
    school  fame 3      fame +631 / +358 / +1178                    36/48        26/48

**Every perk delivers its table exactly** — the school's +3/wk over ~210 weeks predicts +630 and
measured +631, which is the instrument proving itself. The chapel genuinely cuts unrest by 39-47%.
Nothing is "already solved" and nothing is broken.

**And four of the five buy nothing anyway.** Free, at the ceiling of what any policy could reach,
the chapel, baths, tomb and spina are coin flips on both fame and lifespan. The one that lands is
the school, whose perk is a direct additive on the score everything downstream reads. So the fault
is not the price of the stone and not the size of the perks — **it is that three of them move
quantities the house's fate is insensitive to at these magnitudes.** A reference house's unrest is
9.9 and its deaths are the ledger's; taking four points off unrest changes nothing that decides a
run.

**Which refutes the fix #140 implied.** Repricing the stone cannot help: free is the upper bound and
free does not pay. That is now #141, and it is a design decision — give the four perks a term the
outcome reads, or accept them as vanity the fiction already sells honestly ("nothing to show for it
until the last of it"). Measurement has taken it as far as it goes.

**A second half, from `sink.mjs`'s new collection window:** a work pays nothing until its last week
and then pays every week the house survives, so what a buyer receives is the perk *times the weeks
left to collect it*. Bought, 36 finished works began at median week 102, finished at 132, and were
collected for a median of **90 weeks** — under half the 200+ the free grant enjoys. The purchase is
worse than this release's table on both terms.

**One game change ships with it, and it is a real fault rather than a balance opinion.** The tomb's
`say` read *"and a death costs the cells far less."* Its second effect is real and lands somewhere
else entirely: `workPerk(d,"regard")` multiplies the **lanista's** health loss by 0.7 at all four
death sites, while the cells' share of a death is softened by `collSoften` — the burial society, a
different purchase. One work's effect was being credited to another's, which is the `near`/`words`
fault class exactly: a claim about the state that the state does not hold. The line now names the
lanista, and `stone` pins **both halves by mechanism rather than by copy** — it calls `workPerk`
(now on the handle, so a check need not reconstruct the formula) and reads the source for where the
0.7 sits, failing if the sites stop being the lanista's health or if the copy goes back to claiming
the cells. Verified against the old wording: it fails, naming the fault.

### v3.30.0 — #131's second loss: the fire, and the third instance of #136's shape

The estate table marks rooms and patrons as the two things a year-12 house holds that a week-one
house does not. The patron went in v3.27.0; this is the other half, measured first: **288 house-runs
with zero exceptions, no house ever lost a room.**

**The fire takes the top level of one built-up wing, never the wing itself** — nothing that reads a
room's PRESENCE (the staff rooms, the charter, the lessons) can lose its footing — and the rebuild
is `buildUp` at the price the level always cost, which is a real purchase in the era the catalogue
count measured as out of them. The gates are the patron piece's three lessons, applied rather than
relearned: late by the ESTATE'S own clock (`ROOM_FIRE_LEVELS` 8 built levels — a young house cannot
be touched), a 100-week gap so fires do not chain, and a loss rather than a wound — the floor is
gone whichever door is taken, and the choice trades the men's bodies against the stores (send the
yard in: every man pays fatigue, someone may be hurt, a quarter of the stores still burns; stand
back: the stores go whole and the men watch, which unrest remembers).

**Adding the key caught the third instance of #136's shape, and the diagnostic is now routine.**
`policy` and `steel` failed; neutering the event's `make` to `return null` reproduced both failures
identically, so the content was innocent and two more bars were fitted to one RNG trajectory. Seven
dead-key trajectories measured it: `policy`'s best-rooms bar swung 1..4 against a bar of 3 (two
false failures in seven runs) and its census floor tripped once; `steel`'s armoury difference swung
-2.4 to +2.6 against a slack of 1.5. Treated the #136 way — widened and re-derived, never nudged:
`policy` runs 24 houses now (was 8; rooms read 4-5 across four trajectories at the new n, and the
census floor's arithmetic is recomputed for it), `steel`'s slack is 3.5 with the measured swing
written into the failure text, and `bulk`'s EVENTS allowance moves 1080 → 1110 because a designed
event is the sanctioned way that table grows.

**Reachability, measured before belief (the fires.mjs rule):** across three seed prefixes × 24
houses, a floor burned in 2 / 4 / 6 houses — 12 of the 16 whose estate ever reached the 8-level bar.
The constraint is estate size, which is the gate doing what it is for; the reference player's
under-building is the same fact #138 measured. And `keep.mjs` carries room LEVELS now (presence-only
had made the fire invisible to the very instrument that owns the never-lost list): on seed LATE it
reads 14 floors burned across five room keys, rebuilds visible in the gains column. **Rooms are off
the never-lost list.**

**One observation from the same run, flagged as an observation:** wife and heir read "lost 7 / 7"
where 288 earlier house-runs read zero — both cleared by the SUCCESSION, the designed door at
`succeed` ("she keeps her rooms and her authority and is nobody's wife now"). Successions simply
never happened in the earlier trajectories' lifetimes; post-v3.28.0 houses live long enough to use
the door. Designed behaviour becoming reachable, not a fault — but the never-lost list's old
wording ("the wife, lost zero times") is stale and this is the correction.

`blaze` is the 65th check. `roomBurns`, `roomAblaze`, `bLevels` and the two constants are on the
handle, and `fires.mjs` now asks its does-it-ever-happen question of both losses and takes the seed
prefix it always claimed to.

### v3.29.0 — #138: the sink is reachable now, and reaching it answered #131's open question

The works and monuments are the file's own late-game sink — 336,500 denarii of stone, repriced long
ago into instalments so "a house that nets a few thousand a year can put up a monument over three
years instead of never" — and no reference player had ever commissioned one, because `beginWork`'s
only callers were the two villa buttons. The sixth instance of *a policy the player cannot execute
is not a policy*, sitting under every "out of things to buy" figure #131 rests on.

**The rope has a `works` step now, opt-in (`works:true`), and its first version was a lesson worth
the price.** Commissioning at `spare() > deposit` gutted the houses that used it: richer in 1 pair
of 24, alive-longer in 1, with lifespans like 338→72 and 420→161 — because `worksWeek` takes the
mason's weekly draw from gold before any of the player's own spending sees it, and the rope's
twelve-week reserve did not know the obligation existed. The fix is not a tuned constant but the
reserve's own principle extended to a new obligation class: running draws count in the reserve, and
a commission requires the deposit plus twelve weeks of the new draw from spare(). Masons idle 9-17
weeks per 24-house run after it, against 64 before.

**Measured, three seeds × 24 controlled pairs (`sink.mjs` — same seed twice, control first,
compared at the last common week):**

    the works-buying house ends RICHER      3 / 3 / 1  of 24
    lives LONGER                            2 / 4 / 1  of 24
    ends MORE FAMOUS                        3 / 6 / 3  of 24
    what gets built              chapel 27 · spina 25 · tomb 15 · baths 8 · school 2, over 72 pairs
    all five works finished (the monument door)   2 of 72 · a monument begun: NEVER

**So #138's falsification clause fired, and #131's open question is answered: the direction is
LOSSES.** The shelf's bottom is reachable and measurably not worth reaching (opened as #140); the
tier that could absorb a fortune — three monuments at 144,000d and the amphitheatre at 150,000 —
is beyond any reference house's cumulative income. "Out of things to buy" survives in sharpened
form, the contested tier stays the model to copy, and v3.27.0's patron death was the right first
piece.

**One game change ships with it, found by the probe's control arm.** The agenda's one hint at the
sink — "Xd sitting in the box" — still filtered on `d.gold >= cost`, the full price, though the
stone repricing opened the door at the 25% deposit and the villa button already said so. Measured:
the door open on 57-62% of eligible weeks, the hint firing on 12-15%. The line now gates on
`beginWork`'s own deposit, its monument branch quotes the down payment beside the price, and `near`
holds it both ways: a house holding the chapel's deposit is told, a house under every deposit is
not.

The default stays `works:false`: #140 says the purchase is a bad trade under current pricing, so a
reference player who buys stone is not yet modelling competence — the step exists so every future
measurement CAN, which is what this item was for. `catalogue.mjs` takes `on` as a fifth argument to
run its census works-aware.

### v3.28.0 — #137: the named enemy survives the week that names him

The fighter-nemesis (`d.nemesis`) had one designed payoff — beat the name on the sand for +11/18
morale to every man, -4/7 unrest, +12/22 fame and a chronicle line — and it fired on **1-2% of
episodes**. The system churned a "named enemy" once every 16 weeks, and nothing had asked whether
that rate was right until this session's probes did.

**The fault, two lines apart for who knows how many versions.** `ludus.jsx:14568` names a pit man
nemesis with a synthetic house — `{name:f.house, fighters:d.circuit}`, `f.house` drawn from
`SMALL_HOUSES` — and `nemesisWeek`'s lookup only ever searched the five rival houses. It concluded
the man was gone and unmade him THE SAME WEEK he was named, silently: **99-100% of circuit-born
nemeses on every measured seed** (732/736, 586/586, 745/750, 475/476). Worse, a HATED circuit man
(he killed one of yours) evicts a standing rival nemesis on the way through, so **82-87% of the real
rival episodes died with him** — which is why the same rival kept being re-named (`beatYou` persists)
and the whole system read as churn. Found by `named.mjs` (the endings: 81% silent), attributed by
`ghost.mjs` (a setter trap with a stack capture — the weekly diff could not see it because the clear
rate was THREE TIMES the visible episode rate; most episodes lived and died inside one week).

**The fix is the lookup, plus the line the player was owed.** A man is still here if he stands on his
own house's roster OR on the circuit — the fid is the identity, not the house name. And the one
remaining quiet exit (a rival's man retiring unfamously) now writes a chronicle line instead of
leaving the panel silently empty.

**And the fix exposed a second fault it had been hiding, which is this project's usual shape.** With
killers persistent, the title chained hand to hand **once every 4.4 weeks** — every pit loss to any
man who had ever killed one of yours re-dealt the name. The eviction rule now reads the way its own
comment always did: a killer takes the title off a man who merely beat you, but not off another
killer. A hated name holds until the sand settles it or the man leaves it.

**Measured after, 72 × 420, two seeds:** one episode per **47-60 weeks** (a season-scale enemy,
median 25-42 weeks), endings **sand 36-38% · told 32-38% · replaced 25-30% · silent 0-1%**. The
balance change the fix un-hides was measured before shipping, as the item demanded: a nemesis now
stands 95-96% of weeks, hated on ~92%, so the -1.2 morale/week term is live for most of a house's
life — and house lifespans move only within seed noise (11,572 vs 12,009 house-weeks on one seed,
12,865 vs 11,312 the other way on the second; late-era house counts 29 → 32 on the catalogue seed),
because the payoff is finally collectable and the rope collects it at the pit. `doFight`'s own
morale weight for fighting your nemesis (-8, -14 hated) applies now too, having been unreachable
for circuit men.

**`named` is the 64th check.** It holds the rules rather than the trajectory: a nemesis may be
cleared only when the man is genuinely gone from every roster and the circuit; a killer takes the
title from a non-hated name and not from a hated one; the quiet exit writes its line; and a win at
the pit brings the name down, writes the line, and lifts the yard. `nemesisCheck` is on the handle —
the naming could not be driven by anything before this.

Both probes carry their post-fix expectations in their heads (the `quiet.mjs` lesson), so the next
reader knows what the repaired world should print.

v3.26.0 held a finished piece of content because four checks failed on a build whose only change was
one extra key in the `EVENTS` table with its `make` neutered to `return null`. This is that fixed, and
the piece landing on top of it.

**All four were small samples with bars fitted to one trajectory. All four are widened, none nudged.**

    card    3 houses, 38-53 cards      -> 10 houses, ~110 cards. True figure 2.90-2.94, bound was 3.2
    ends    12 houses per arm, 6 dead  -> 28 per arm. A share over six moves 17 points on one house
    roads   6 houses, and the bar counted the DEAD as failing to come home  -> 16, dead excluded
    steel   ONE house against one      -> 5 pooled per arm, ~5,000 man-slot-weeks

Two of those were faults in the bar rather than the sample. `roads` counted a house that died on the
coast as one that failed to come home — it cannot come home, it is dead, and that was my own check
from four releases ago. `steel` compared a single armed house against a single plain one with a strict
inequality; pooled, the effect it is testing is unmistakable — **88.2% keen against 79.8%, worn-or-worse
2.5% against 8.1%.** And widening `ends` restored its documented finding: `proven` over 120 weeks now
reads **rebellion 8, ruin 4, debt 0** of 28, which is the reference table's claim exactly. The 3-of-6
debt reading that failed was noise.

**Then the patron piece went in unchanged and everything stayed green.** A patron held for years dies,
the seat refills with a stranger, and `d.favor` — the weighted mean the census ladder's `favorOk` and
Rome both read — falls with the replacement rather than with the man: **90 → 90 on the day → 55 once
the seat refilled.** Attending the pyre costs `180 + fame*0.35` and the heir starts from 60% of what
his father thought of you; a letter costs 4 fame and he starts cold. `PATRON_AGE` gates it on the
lanista's own years rather than the house's weeks, because 60 weeks of service is year four and the
first version was gutting young houses.

`patron` is the 63rd check. It holds four things and the first would ruin a save — never the last
patron, since `recomputeFavor` sets `d.favor = 0` on an empty list.

**What #136 cost and what it bought.** It cost one release's delay. It bought a suite that can accept
a new event at all — which every future piece of #131 is — and it removed four bars that would have
failed on any content change while looking like real regressions. Three of the four were mine.

### v3.26.0 — Four checks are fitted to one RNG trajectory, and any new event exposes them

**#131's first piece was built, measured, and is NOT in this release.** The thesis was accepted — a
great house has acquired everything and is at risk of nothing, so the late game needs things that can
be **lost** — and a search found the sharpest case: **nothing in `src/ludus.jsx` ever removed a patron
or a room.** A patron a house had held for years now died, the seat refilled with a stranger at a
third of his favour, and attending the pyre bought the heir's opinion. It worked, it had a check, and
three iterations of its design were driven by measurement rather than taste (the cost lands on the
REPLACEMENT, not the death, because `recomputeFavor` is a mean; and the gate had to move from 60 weeks
of service to the lanista's own age, because 60 weeks is year FOUR and the loss was gutting young
houses).

**It is held back because the suite cannot currently accept a new event, and that is the finding.**

`card`, `ends`, `roads` and `steel` all failed. None of it was the patron event. Neutering its `make`
to `return null` — leaving only its KEY in the `EVENTS` table — reproduced **every failure
identically**:

    card    3.00 bouts per card live · 2.71 with the event neutered · bound 3.2
    ends    3 of 6 `proven` houses by debt (50%) against a measured 0-10%, both live and neutered
    roads   5 of 6 came home, both live and neutered
    steel   the armoury comparison flipped, both live and neutered

One extra key reshuffles `pickEvent` and every draw after it, which `policy`'s head has warned about
since v2.98.0: *"consuming two extra rolls of the RNG and reshuffling every draw after it can."* Four
checks have bars fitted to a single trajectory, and they all sit on small samples — `card` counted 38
to 53 cards, `ends` 6 houses, `roads` 6, `steel` 2.

**`card` is fixed here and is the model for the rest.** Measured like for like at 10 houses instead of
3: **2.94 without the change and 2.90 with it**, so the true figure was always below its own 3.2 lower
bound and the 3.36 that set it was one lucky trajectory. Re-baselined from the larger sample rather
than nudged to pass — #127's rule — and the sample tripled, which makes the statistic tighter and the
check MORE sensitive to a real change, not less.

**What this blocks.** #131 cannot be built at all until `ends`, `roads` and `steel` get the same
treatment, because *every* piece of late-game content is a new event. That is now the item in front of
#131, and it is a real one: raising n on three checks and re-deriving their bars from the distribution.
Doing it in a hurry to land one patron event would have weakened four real guards, which is why the
content is written up here and held rather than shipped green-by-adjustment.

### v3.25.0 — "He finishes his season in six weeks" was the soonest he could, not when he would

`PLANSEASON` is five long training arcs, 8 to 18 weeks, that fix a man's drill and pay a block of
stats and a named trait **in one lump at the end**. **No season had ever run in this project.**
`startPlan` was off the handle until v3.23.0 and the reference player has no step for it — which
`dark.mjs` proved sideways: `breakPlan`'s gate was open on 0% of weeks because there was never a
season to break. So the balance question had never been asked.

**Measured as controlled pairs** — two houses from the same seed, identical but for one named man put
on a season on week one, control run first so it cannot inherit RNG state, 24 pairs per kind:

    season   advertised   ever finished   median weeks actually taken
    wall           18w        5 of 24              22w
    quick          18w        3 of 24              26w
    crowd          12w       10 of 24              18w
    smith          14w        4 of 24              17w
    mend            8w        4 of 24              12w

**The advertised length is a floor, not a length.** `planWeek` advances a season only while the man is
`active`, so every week he spends hurt is a week the clock does not move — and the deadline line put
the finish at `d.week + planWeeksLeft(g)`, which treats weeks of WORK as weeks of CALENDAR. The quoted
day was early by **22 to 44%** on every kind that finished at all. That is the #109 shape exactly: a
line telling the player how close a thing is, computed off the wrong quantity, in a project that has
now shipped that mistake three times. The date stays as the earliest it could be — the game genuinely
cannot know the real one — and the note now says how many weeks of *work* are left and that it only
moves in the weeks he is fit.

**What is NOT concluded, and why.** 14 to 21 of every 24 men died before the payout. That looks
damning for a system that pays nothing until the final week, and it is **confounded**: this probe puts
the season on `activeG(d)[0]`, and the rope's `takeBout` sorts by average stat and fights its best man
every week. So the trainee is also the one being sent to the sand. **That is a fact about the rope's
bout policy at least as much as about the season**, and separating them needs an arm that trains a man
it does not fight. Stated here rather than shipped as a finding.

**`survive` drew (2,2)** — the low end of a 24-run tally with median (3,6), and the check printed its
own reading: *"only 2 men between them, but 2 houses still standing — a bad run of luck, not a
gutting."* Unambiguously variance here rather than arguably: the only game change in this release is
the text of a note on a deadline entry, which consumes no RNG draw and cannot reach the opening.

**And no `season` step was added to the rope.** The other four steps this run — contract, road, nem —
each freed the player from a state it could not leave. A season is a genuine strategic choice, not a
cage, and the measurement above does not establish that a competent house starts one. Adding a step
would have re-based every figure in the suite on a guess about good play.

### v3.24.0 — The house never hit back, so the arch-rival's best door had never opened

No game code changed. A rope step, the item it was built to answer, and two wrong versions of the
step on the way — both of which were wrong in the same instructive way.

**The gap.** `nemEdge` is `answered - hits`. `hits` climbs when the arch-rival schemes at you;
`answered` moves only through `answerNem` or a won gambit — and `__ROPE.lanista` had a step for
neither. So `answered` was 0 in every house this project has ever run, the edge was permanently
negative, and `nemCanCallOut` could not open.

**#134 is refuted.** It asked whether the call-out window can open at all, since `heat >= 45` and
`edge >= 1` are both required while every answer raises the edge and lowers the heat by 3. Each of
the five terms counted separately, the way `census` splits its four:

    of the weeks a nemesis existed          never replies (2,094w)   replies (1,499w)
    stage >= 2                                   96.5%                   92.4%
    heat >= 45                                   95.7%                   80.8%
    edge >= 1                                     0.0%                   39.8%
    a man at pfame >= 18                         58.5%                   61.0%
    no challenge already pending                 62.7%                   58.6%
    ALL FOUR TOGETHER                             0.0%                    4.4%

The window opens 66 times in **8 of 10 houses**, and the lanista takes it every time.

**The premise was wrong as well as the conclusion.** Heat and edge hold together on 27.2% of nemesis
weeks. The −3 an answer costs is swamped by the **+1.4 a week of passive drift** at `ludus.jsx:10090`
while stage < 3, and an answer is only permitted every three weeks. I read one term of the sum and
not the other. What thins 27.2% to 4.4% is the pfame term and the fact that a call-out *issues a
grudge match*, raising a `challenge` deadline that shuts the window until it resolves — a cooldown,
working as designed.

**TWO WRONG STEPS FIRST, AND THEY ARE THE USEFUL PART.** Guarded on affordability alone the lanista
answered **202 times** at `160 + fame*0.5` — about 690d a week at late fame against a weekly bill of
364 — and `policy` failed: *the best-off house held 2 of 5 rooms against a bar of 3*. Revenge was
outbidding the roof every week because it asked first and asked small. Guarded instead on clearing the
build threshold after paying, it answered **7 times in 2,586 weeks** and the window opened in 1 house
of 10. One arm bought revenge with the buildings; the other never got ahead.

Both were the same mistake — **answering on a timer, for ever.** A player chasing the call-out answers
until he holds the upper hand and then *uses* it, which bounds the spend by the rival's hits instead
of by the calendar. `nemEdge(d) < 1` is that condition, off the game's own function: 86 answers, 66
call-outs, `policy` green at 4 of 5 rooms. **The threshold was not tuned until the numbers looked
right; the policy was replaced with one that has a reason.** That distinction is the whole of it —
the first two arms are what fitting a constant to a desired answer looks like from the inside.

**Sixth time** a system has read as unreachable because of the reference player rather than the game:
`setOut`/`comeHome`, `nameHeir`, `makeMarket`, `holdMunera`, the road, and now this. The difference is
that the probe was built to say WHICH TERM was short rather than whether the gate fired, and it
cross-checks its own reading against the game's own `nemCanCallOut` and prints both — 66 against 66,
0 against 0. **That is the design to copy for any conjunction gate.**

### v3.23.0 — Sixteen things a player can do that no check could reach

No behaviour changed. What changed is that the blind spot which produced four of this project's
wrong findings is now closed mechanically instead of by remembering.

**The pattern, stated once.** Four times a system has read as dead content because the function
behind it was not on the `__LVDVS` handle, so nothing outside a mounted component could drive it —
and each time a confident wrong finding was published first:

    setOut / comeHome   v2.46   two 12-house batches emigrated and reported half the game dark
    nameHeir                    the heir null in 8 of 8 houses, zero successions
    makeMarket                  a block battery silently measuring the founding stall five times
    holdMunera          v3.22   `d.honoured` read 0 in every measurement this project ever took

Neither existing guard could see it. `coverage` answers "what does no check touch" — among things
already on the handle. And `actions` holds a **hand-written** list of names: it catches an action
that goes missing and is silent, by construction, about one nobody ever thought to list.

**The definition is the whole trick, and it is not "mutates the save"** — that sweeps in every
internal helper and needs a judgement call per row, which is how a sweep becomes a list nobody reads.
A player action is a function the UI calls inside a `mut(d => …)` closure. That closure *is* the
player doing something, and it is exactly how `holdMunera` was reached and by nothing else.

**Nineteen were off the handle. Sixteen of them were reachable by a click and by nothing else in the
program** — `holdMunera`'s exact shape:

    answerNem · nemCallOut     the nemesis, called out and answered
    callFavour                 calling in a patron's favour — a system with its own roadmap section
    repay                      the moneylenders
    backCandidate              backing a candidate for the aedileship
    runGambit                  the crowd gambits
    watchField · startPlan · breakPlan · clearWatch    watching a man and building a plan on it
    saveKit · applyKit · dropKit                       the kits
    skipWeeks                  the fast-forward — the very button v3.22.0 was about
    charterSkip · firstBuyWarn

The other three — `applyRefusal`, `sellDebt`, `swearIn` — are called by the weekly code as well, so
a check driving `endWeek` runs them. They were exercised; what could not be driven was the *player's*
own version of the action. Counting the two classes together would have reported nineteen dead
systems where the sharp figure is sixteen, and the probe makes the split itself rather than leaving it
to an eyeball.

All nineteen are on the handle now, and `actions` derives the list as well as declaring it — the way
`school` derives its field list instead of writing it down. Take one name back off and it fails by
name with the line to add it to. It reads the source directly, like `layers` and half of `saves`,
because the claim is about what the FILE exposes and a rendered page cannot answer it.

**And the instrument caught itself, which is the part worth keeping.** The closure count went 101 to
102 the moment the sweep was documented: the note added to the `__LVDVS` block contains the words
`mut(d => …)` while explaining the sweep, and `/\bmut\(\s*d\s*=>/` matched its own documentation.
The balancer then parsed prose. It changed no conclusion — the phantom body holds no calls — but a
comment *quoting a real call* would have injected an action that does not exist, and a doc-comment is
precisely where such a quote goes. Comments are stripped before anything is matched now. A one-off
discrepancy between two runs of the same logic was the only thing that showed it.

**`survive` came back (3,8)** — above the 21-run median of 3 standing and 6 men, which also settles
v3.22.0's (2,3) as the draw it was read as rather than damage.

**What this does not do.** Exposing a function proves nothing about whether the system behind it
works — it only makes the question askable. On this project's base rate several of the sixteen will
turn out to be dead or faulty when something finally drives them, and that is the follow-up work.

### v3.22.0 — One dead man you could no longer bury retired the fast-forward button for the rest of the run

Chasing #131's "the late game reads what week one reads" into what a great house actually OWNS, the
estate table put **14 unburied dead** at year 12 against 3 early — and 14 is the cap `markUnburied`
keeps. Not a growing liability: a saturated one. Pulling that thread found a live fault in the game.

`weekWeight(d)` scores the week and calls it `quiet` only at load 0, and that is the **sole gate on
"Let it run · Nw"** (line 19573) — the game's single multi-week advance. One of its load terms read
the unburied with no window:

    if((d.unburied||[]).some(m=>!m.done)) load += 1;

**Every other reader of that list has one.** The agenda line uses `unhonoured(d)`, six weeks, and
prints *"after this nobody can put it right"*. The villa section offering the rites uses
`unhonoured(S)` under a *"6w to decide"* caption. `markUnburied` keeps the last fourteen men for ever
and only `holdMunera` clears one, which the UI offers inside the window alone. So six weeks after a
death the entry was permanent, **the player had no action left that could clear it**, and load could
never return to 0.

Measured over 10 houses × 420 weeks before the change:

    the term fired on                        95.6% of all house-weeks (1,942 of 2,031)
    houses stuck for good                    10 of 10, between week 10 and week 37
    every house's LAST quiet week            inside its first 13 — 1, 1, 2, 3, 3, 4, 10, 12, 13, 13
    windowed, the last quiet week            145, 161, 174, 204, 234, 276, 325 for seven of them
    quiet weeks as a share of play           1.8% -> 4.1%

On one seed, held still: **3 quiet weeks ending at week 6 became 9 ending at week 172.** The fix is
the window every other reader already applies — a man you can no longer put right is not this week's
business.

**It was invisible because none of it was reachable.** `weekWeight`, `unhonoured` and `holdMunera`
were all off the handle, and `holdMunera`'s only caller was the UI closure at 18649 — so no check
could ask the week its shape or bury a man, and `d.honoured` read 0 in every measurement this project
has ever taken. **That is the file's first rule broken**: an action a lanista can take must be a
function of the save *and* on the handle. It is the same class as `setOut`/`comeHome` (v2.46),
`nameHeir`, `makeMarket` and v3.21.0's own road fix — and the fourth time a system has read as dead
because nothing could drive it.

`quiet` is the 62nd check. It holds the rule rather than the number — a man past the window may not
weigh on the week — and drives the three rites end to end at the same time, since they had never once
been driven: doing nothing costs 0d and +4 unrest, a fire at the gate 114d for −7, a full card 588d
for −19 unrest, +11 fame and the `d.honoured` the munera lesson reads for "done". Against the old
line it fails on the load, on the week's shape, and on both.

**`survive` came back (2,3) — passing, at the low end.** The 20-run tally sits at median 3 standing
and 6 men, and this build drew 2 and 3. It is worth saying why that is being read as variance rather
than as damage: `weekWeight` has exactly one consumer, the button at 19573, and neither reading of the
unburied term consumes an RNG draw — so a headless house plays an identical sequence before and after.
The in-browser difference is that a quiet week renders an extra button beside End Week, which is the
one `survive` clicks either way. If a later build draws low again, that reasoning is the thing to
check first.

**One theory died on the way and is worth recording.** The `munera` lesson (`when` any undone man,
`done` only on full games) looked like it would sit in the villa tab's queue for ever and starve the
two lessons behind it — which is precisely the failure `lessons` exists for. It does not: reading a
lesson marks it learned (line 19611) and the queue advances. Inferred, then checked, then dropped.

### v3.21.0 — The reference player could not come home, and every long run was measured from Puteoli

No game code changed. What changed is the instrument every long measurement in this project is taken
with, and one of the two open items closed as a result.

**The rope did not tour. It emigrated.** `__ROPE.lanista` had no travel step at all. The only road out
of Capua a player is ever offered is the `bayCall` event — *"Asked For By Name"* — and the question
step answers at its default `i=0`, which is *"Take the road to <town>"*. Nothing brings a house back:
**`comeHome` has exactly one caller in `src/ludus.jsx`, the UI button at line 18653**, and no weekly
phase touches it. So the reference house accepted an editor's invitation, went south, and stood in
that town until it died.

Measured over 10 houses × 420 weeks by the new `test/probes/road.mjs`, before and after:

                                        before      after
    houses that ever left                5 of 10     5 of 10
    departures / returns                 5 / 0       11 / 11
    longest single stay in one town      363w        7w
    all house-weeks spent away           54%         4%
    games weeks whose card was a town's  71%         8%

Five departures and no returns. Not one house in this project's history had ever come back. The step
is the game's own policy rather than a number of mine — a guest, not a resident: it breaks camp the
week `welcomeOf` drops below 1, which is `STAY_FRESH` and tracks the constant instead of drifting from
it. `road:false` is the stay-at-home arm, and it declines the invitation too, because a house that
leaves once and cannot return is not a house that stays.

**#132 closes, refuted on its own falsification clause.** Re-run against a house that never leaves
Capua, the primacy is offered on **49% of the weeks a card is up and 20% of every open week** — 78
offers over 159 card weeks and 388 open weeks. The file's own bar was "the card carrying the offer on
a decent share of open weeks … the item is refuted rather than built". It is met. The primacy is
surfaced where every bout is surfaced. What survives is only the narrow true part, unchanged: it has
no agenda line and no `SECT_MARK` key.

**#131 survives the correction and is stronger for it.** Year 12+ reads **97.7% perennial / 2.3%
late-only** on a stay-at-home house against 96.5% / 3.5% on the emigrated one. Standing in Puteoli for
eight years was the last cheap explanation on the table, and it was not the cause either.

**This is the second time this exact stranding has been found, and `roads` passed through all of it.**
That check exists because the v2.46 audit lost two 12-house batches to it and published three
confident wrong findings. It proved the round trip *could* be driven, every run, ever since —
and never asked whether anyone was driving it. Its new last section is forced rather than observed:
houses are put on the coast with `setOut` and the reference player has 25 weeks to get them back
(measured: 5 of 5, slowest 8). Waiting for `bayCall` to fire naturally would give a bar that passes
while measuring an empty set, which is the free-pass shape #128 was about.

**The habit worth keeping.** A reference player is an instrument, and *a policy it cannot execute is
not a policy*. The tell was there in the number: 91% is not a rate anybody chooses, it is a rate
something is stuck at. Ask of any policy step not only "would a good player do this" but "can this
player ever stop doing it".

**One thing measured on the way past and deliberately not acted on.** Across the three arms — stuck,
tour-and-return, never-leave — the house that shuttles is the shortest-lived of the three (median life
175w against 261w stuck and 259w staying home, n=10 per arm). The game's note at `src/ludus.jsx:9632`
intends the opposite: *"a tour is untouched; an emigration bleeds."* That is a game finding, not an
instrument one, but n=10 lifespans are censored and wide and it is nowhere near settled. See the open
items.

### v3.20.0 — The block charged you to learn a number it was already showing you

Chasing the 80% scroll, the market was the place to look: the tab is nothing but the men standing at the
block, at **502px of panel each**. Reading one panel line by line to find what could be condensed, the six
stats turned out to be drawn **twice** — a numeric row, and a row of bars under it. The numeric row is the
careful one, `bandOf(src2[k], lvl)` over `src2 = lvl>=1 ? g : (g.shown || g)`. The bar row was
`<Bar v={g[k]}/>`, with no read level within twenty lines of it.

`g[k]` is the true stat. So the entire economy of the block — `sellerSays` inflating every number, the
doctore narrowing the band from ±14 to ±7, `scout` charging 35d plus a tenth of the price, and a teaching
panel that spends a paragraph explaining *the numbers are the seller's* — was being given away six pixels
lower, for nothing, on every man.

**Measured off the screen rather than off the source,** because reading the JSX is how you convince
yourself and not how you find out. Over **198 stats on 33 unscouted men**, sampled across 26 weeks of a
real house, the bar's `aria-valuenow` sat a mean **3.17 points below the printed band's centre**:

    gap between the band's centre and the bar's number
    0: 25   +1: 34   +2: 31   +3: 32   +4: 20   +5: 23   +6: 10   +7: 9   +8: 9   +9: 5

which is `sellerSays`'s own `ri(0,5)`, and `ri(0,9)` on a flawed man, exactly. Never negative, never once
outside the printed band. That rules out the innocent reading — a bar merely redrawing the seller's claim
would agree at 0.00 every time. And it was not a matter of squinting at a bar: `Bar` renders
`role="progressbar" aria-valuenow={Math.round(v)}`, so the true integer was in the accessibility tree, and
the fill width equalled it to the percent.

**The fix is the condensation.** The two rows are now one. A new `Band` draws what you actually know: a
window floating from lo to hi, which is the honest picture of not knowing, collapsing to an ordinary filled
bar the moment somebody has looked at him. Uncertainty is the block's whole subject, so the row that used
to give it away is now the only place you can see it.

    a man on the block   502px  ->  448px      54px, about 11% of the panel
    market as it arrives 3,257px -> 2,564px    (the block's population is the RNG's, so the panel is the honest figure)
    all six tabs        19,491px -> 18,392px

**And the instrument was wrong before any of this.** `reach` prints "79% of the things that change the
house sit below the first 844 pixels" — measured with **every fold thrown open**, because a closed
`details` lays out no content and a button inside one has no y at all. That page is **40% taller** than the
one a player arrives at (27,260px against 19,491px; 242% taller on `villa · The House`). Restated against
the page that exists — a closed section costing the scroll to its *summary*, which is where the thumb
actually stops — the figure is **74%, not 79%**, median y 1,312 rather than 1,561. The problem survives the
correction; the number did not. A second fault with it: `arrive`'s per-place figures deduplicated actions
across places, so "the market's first action is at y=1,426" was an action belonging to another tab. Per
place, honestly, it is y=932.

`seller` is the 61st check. It holds the invariant without any access to the true value — which is the
point, since a player has none either: on a man still offering to be looked over, no bar may carry
`aria-valuenow` and every window must run from exactly the printed lo to exactly the printed hi; on a man
paid for, the bar carries the number and it equals the one printed above it. Run against v3.19.0 it fails
19 of 19 men and 114 of 114 windows, which is how a new bar earns its place.

It is called `seller` because it was called `block` first, and `block` was already the name of the
end-to-end buy check — so the file was written straight over a live guard on `buyFromBlock`, the path that
was lifted out of a React closure precisely because nothing outside the component could spend a player's
money. The suite reported 60 and I read that as the new total; it was the old total with one check
replaced. **A suite that auto-discovers `test/checks/*.mjs` by filename will let you delete a check by
adding one, and the count will not tell you** — it went 60 to 60. Before writing a new check, `ls` the
directory. The count is now genuinely 61.

**One red run, and why it shipped anyway.** The verifying suite came back 60/61: `survive` returned 1
house standing of 5. Re-run alone three times it passed — (2,5) (2,4) (3,8) — but all at the low end, and
v3.20.0's five observations had a median of 2 houses standing against a prior median of 4 over 12
observations. The comfortable reading is that a change to how a panel draws six stats cannot reach a
simulation, so it must be noise. That is an inference, and this project's record is that inferences of
that shape are usually wrong. So the v3.19.0 game code was put back and run four times on the same
machine, minutes later:

    v3.19.0 game code   (3,5) (2,3) (2,3) (5,7)         standing median 2.5
    v3.20.0 game code   (3,3) (1,4) (2,5) (2,4) (3,8)   standing median 2

Same distribution, so the low run is the machine and the hour, not the release. Worth keeping as a fact
about the instrument: **`survive`'s spread is wide enough that five consecutive low draws prove nothing
about a build, and the only thing that settles it is running the previous build beside it.** The four
paired runs are deliberately NOT in `survive-tally.json` — `package.json` was already at 3.20.0, so they
would have been stamped with the wrong version, and a hand-corrected stamp is exactly what #130 caught in
that file's own head note.

### v3.19.0 — The panel said "the block below this one" and it was three screens away

v3.7.0 gave the census ladder's Standing panel a line naming the lever that moves it: *"Throw a party —
the block below this one — and every patron warms to you."* `reach` then measured where that block
actually was. **y=2,655**, sixth of seven sections on the face, with the whole road to Rome and the whole
temple standing between the sentence and the thing it pointed at.

The party is the largest lever measured on the ladder — mean census rung 2.70 against 1.50, and 218 weeks
at Rome against 31. It now sits directly under the panel that sends you to it, above the road to Rome
rather than below it.

    SEND INVITATIONS   y=2,655  ->  y=1,763        892 pixels, just over one screen
    its position on the face   6th of 7  ->  2nd

**And the honest half: total scroll did not move.** 80% of the things that change the house still sit
below the first 844 pixels, because pushing one section up pushes another down — the temple's offerings
went from above the party to below it, at y=2,395 to 2,688. **Reordering redistributes scroll; it does not
reduce it.** The only things that reduce it are removing content, condensing it, or folding it, and the
last of those trades scroll for taps at a rate `reach` now measures on both sides.

So this release is not a fix for the 80%. It is a fix for one specific sentence being false, and for the
most valuable lever in the middle game sitting further from the panel that recommends it than any other
action on the face. The 80% is a separate problem and wants a different kind of answer.

### v3.18.0 — The week gets quieter with the years, and the fix I reached for already existed

Two findings, one of them about the game and one about me.

**THE WEEK GETS QUIETER, not flatter.** The middle-game brainstorm's option 3 said a twenty-year house is
asked for the same 0.8 urgent things a week as a first-year one, measured through the reference player as
he then was — the man v3.17.0 showed reaches a fifth of the game and never gets to Rome. Re-measured
through BOTH men, 8 houses of 400 weeks, same seeds:

| | urgent/wk, yr 1-3 → yr 12+ | new/wk | distinct labels shown |
|---|---|---|---|
| the old player | 0.98 → **0.61** | 4.8 → 2.9 | 271 → 136 |
| the v3.17.0 player | 0.89 → **0.64** | 4.9 → 2.5 | 248 → 171 |

Both decline, so it is the game and not the probe — and it is worse than the item claimed. The list of
things *available* grows (7.5 to 12.2 items) while what is URGENT falls by a third and what is NEW falls
by half. A great house is asked for less than a poor one, and hears a third fewer distinct things.

**AND THE FIX I REACHED FOR WAS ALREADY THERE.** The obvious late-game item is the master's bench: 19
pieces at 2,900 to 9,500 denarii behind `masterOpen`, which an audit item (#62) had recorded as "open and
never used, and nothing points at it". The gate was measured properly first, per #101 — bench open with
something affordable and unbought stands in 0.0% of year 1-3 weeks, 6.4% of year 7-12 and **72.1% of year
12+**, which is 22.7% of a house's life and concentrated exactly in the era that measured quietest. A line
was written naming the dearest affordable piece and its price and weekly keep. It passed the suite.

Then a diagnostic printed the agenda beside it and the line above mine read *"Capua's master smiths will
take your commissions now"*. It has been there all along, at urgency 2, with a comment over it saying **"the
one time it is worth saying out loud — after that the tab speaks for itself"**, and a gate that stops it the
moment the house owns a single master's piece.

So the premise was wrong, and worse, my version reintroduced precisely what that comment exists to prevent:
it named a different piece every week and would have gone on for ever. It is reverted. The existing line's
comment now carries this episode, because the next person to read "nothing points at the bench" in an audit
list should find the answer next to the code rather than repeat the work.

**The check for "does anything mention this?" is `grep`, not a measurement.** I ran a 3,200-house-week
probe to establish that the bench is reachable and never bought, which was true, and inferred from it that
nothing points at it, which did not follow and took ten seconds to falsify. Measuring the world is not the
same as reading the file.

No net change to the game. Task #62 is closed as REFUTED.

### v3.17.0 — The reference player could not reach Rome

No game change. The reference player arms his men and entertains now, which the last four releases had
made overdue: three sinks were built and each was added to him as an OPT-IN step, so the man every check
measures the game through was drifting further from a competent player with each release.

v3.16.0 is what forced it. A player who uses the levers runs 19 denarii a week at year 12+; one who does
not runs 769 and holds 88,555 he has no use for. That is not a model of competence — it is a model of
somebody who never found the game, and the whole suite was certifying the economy through him.

**What he now reaches, same eight seeds, before and after:**

| | house issue, no parties | arms and entertains |
|---|---|---|
| median life | 60w | **211w** |
| median fame | 147 | **5,497** |
| best house's fame | 11,051 | 17,840 |
| stood past week 180 | 4 of 8 | 5 of 8 |
| events fired | 36 of 57 | 41 of 57 |
| houses that claimed a rank | 7 of 8 | 8 of 8 |
| the subsystem census | **19 of 20, `rome` DARK** | **20 of 20, none dark** |
| `rome` reached | **0 houses** | **6 of 8** |
| `city` · medicus · armourer · war | 4 · 4 · 4 · 1 | 6 · 7 · 7 · 2 |

**He could not reach Rome.** That is the finding, and it had been sitting in plain sight in every census
this project has printed: `rome` at 1 of 8 or 0 of 8, release after release, and the v3.10.0 floor set at
18 of 20 partly to tolerate it. It was never a fact about Rome's gates. A house that never buys steel and
never entertains does not get a senator to 70 favour or a man good enough to hold the primacy, so the
imperial road was shut for a reason that had nothing to do with the road.

**No bar had to move**, which is the part worth keeping. Every bar in `policy` is a FLOOR, and a better
player clears floors by more than a worse one — so the re-baselining that looked like it would need a
dozen recalibrations needed none. The bracketed `[measured …]` figures in those messages are now history
rather than error, and the head says so with the new numbers beside them. Only three checks drive this
player at all — `ends`, `policy`, `week` — and all three pass unchanged.

**`free` stays opt-in, on a measurement rather than a shrug.** Freeing every man the week he qualifies
takes the house's fame from 2,232 to 1,270: it is your best men you are letting go and their fame was the
house's. Fame is the quantity most of this suite's reachability leans on — `policy` asserts a best house
past 2,000 of it, and the primacy, Rome and half the census gates read it — so a reference player who
frees everyone reaches LESS of the game, which is the opposite of what he is for. It is also a style
rather than a competence, and nothing measured says it is optimal.

### v3.16.0 — The surplus was a missing sink after all, and I had the reason backwards

No game change. One measurement, which decides whether to build a fourth sink and says not to.

Three sinks were built or priced in four releases, each measured alone: steel that wears out (v3.13/14),
freedom priced at what it cost in Rome (v3.15), and the table the census ladder turns on (v3.7). Every arm
still ended with tens of thousands idle — the gear arm even bought 179 master's pieces, the biggest fixed
sink in the game, and finished on 87,054 denarii. From that I concluded in v3.14.0 that "any sink that
buys capability refunds part of its own cost" and that closing the surplus would need something on the
income side.

**The thing I never measured was the NET.** A balance is a history; the net says whether the gap is still
widening at the end of the game. Four arms plus a combined one, same eight seeds, 400 weeks:

| arm | net gold/week at year 12+ | holding |
|---|---|---|
| nothing (the old reference player) | **769d** | 88,555d |
| steel only | 48d | 37,874d |
| freedom only | 465d | 56,907d |
| the table only | 255d | 30,527d |
| **every sink at once** | **19d** | **16,662d** |

**The sinks close it.** A player who uses all three runs essentially break-even at year 12+ — 19 denarii a
week against a bill of 750 — and holds 16,662 instead of 88,555, a fall of 81%. Income does not outrun
them. The v3.14.0 conclusion was wrong, and it was wrong because it read a BALANCE and reasoned about a
RATE.

**And they compound rather than adding.** Alone they take 94%, 40% and 66% off the net; together they take
97.5%. That is not because each is stronger than measured — it is because they are not independent. Coin
spent on steel is coin that never became the income that would have funded the parties, and a house that
freed its best man earns less thereafter to spend on either. Measuring a sink alone systematically
understates what a set of them does.

**One honesty note on the magnitudes.** v3.14.0 measured steel taking year-12 gold from 107,246 to 87,054,
a fall of 19%; here steel alone takes 88,555 to 37,874, a fall of 57%. Same change, same direction, wildly
different size — and the difference is the seed set, which is the lesson this project has already learned
twice ("the 6x gap was the seed set, and pairing settled the real effect at 1.6x"). Only the ORDERING
within one seed set is trustworthy. Both runs agree that steel is a real sink; neither pins its size, and
nothing here should be quoted as a coefficient.

**What this changes about what to do next.** The middle game's coin problem is not a design gap — it is a
DISCOVERABILITY gap, which is what the last four releases have actually been fixing: the party the panel
never named, the bench nothing points at, the man who has earned the rudis that only one line of counsel
ever mentioned. A player who finds these levers has no surplus. A player who does not holds 88,555 denarii
and reasonably concludes the game has run out.

It also makes the case for flipping the `gear`, `free` and `party` defaults much stronger than it was an
hour ago. The reference player who uses none of them holds 88,555 denarii and looks like a broken economy;
the one who plays holds 16,662 and looks correct. Every figure in the heads of `policy`, `ends`, `careers`
and `survive` describes the former.

The rope gained a `party` step to make the combined arm honest — a "does everything" arm without the
largest per-week sink in the game is not one. Opt-in, with the other two.

### v3.15.1 — Three faults in the ten minutes after pricing freedom

v3.15.0 gave `grantRudis` a fee and an early return when the house cannot pay it. That introduced three
defects, two of them the exact fault this audit has spent a dozen releases finding, and the third one
worse. All three were found by looking for them rather than by the suite.

**The action silently did nothing while the screen said otherwise.** `grantRudis` returned bare, and two
callers go straight on to tell the player it happened. The `year` ambition's second choice runs it and
returns *"You free him anyway, over his own objection"* — so a house that could not pay would read that
line over a man still standing in the yard. It returns a boolean now, both callers read it, and the
refusal has its own line: the fee, what the strongbox actually holds, and that he stays.

**The confirm did not name the price.** The card's Grant the Rudis dialog described the crowd and the
walk to the gate and never said what it cost — which is the fault #100 was written about, on the one
button in the game that asks a player to pledge coin. It carries the fee, says what the fee is FOR, and
when the house cannot meet it the button says so instead of pretending.

**And the fix for that nearly shipped a crash.** Passing `run: null` for the unaffordable case looked
tidy; `ask.run()` is called unconditionally at both of its two sites, so tapping a button that exists
only to state a price would have thrown. It is a no-op function.

**`survive` failed at (1 standing, 2 men)** on the v3.15.0 suite — the worst pair on record. Its own head
insists the change is proved inert before luck is blamed, so: `survive` drives its own `playOne` and never
touches the rope's lanista, so the new `free` step cannot fire in it; `grantRudis` needs `wins >= 10` and
`pfame >= 180`, which a 26-week house does not produce; `gladValue` reads `rnd`, which in this file is
`Math.round` and consumes no RNG, so the new `rudisCost` call inside `agendaCan` cannot reshuffle the
stream; and the agenda line adds a display row and mutates nothing. Re-run on the same build: **(3, 5),
pass.** The tally now reads **1 failure in 7 runs across 5 builds**, against the ~1 in 8 the head has
documented since v2.92.0. Luck, and on the record as a pair rather than as an argument — which is what
the tally was built for two releases ago.

### v3.15.0 — Freedom was a button that handed you things

v3.14.0 established the rule: a sink that buys CAPABILITY refunds most of its own cost, so closing the
middle game's 87,000-denarii surplus needs something that does not make the house stronger. There is
exactly one act in this game that buys negative capability — you lose the fighter outright — and it was
the only lever pointed backwards.

**The falsifier first: can a man ever earn his freedom?** `rudisEligible` wants `wins >= 10 && pfame >=
180`, and `steel` had already measured the median man fighting three bouts. If almost nobody crosses it,
`closed` — five men freed — is gated on career length and pricing freedom would be decorating a locked
door. Measured over 8 houses and **227 men who ever drew breath**:

| | |
|---|---|
| reached 10 wins | 36 of 227 (15.9%) |
| reached 180 own fame | 69 of 227 (30.4%) |
| crossed both, ever | **32 of 227 (14.1%)** |
| what removed them | **dead 146** · active 36 · injured 23 · away 11 · departed 11 |

About four men a house against the five that ending wants. The door is nearly wide enough, 146 of the 227
died before reaching it, and **the reference player freed 0 men in 3,200 house-weeks** — for the same
reason he had never bought a piece of steel: there was no step in the rope for it. So it survived, with
the premise corrected: freedom is earnable and nobody was ever choosing it.

**And when a policy finally did choose it, freeing men made you RICHER.** `grantRudis` took no coin at
all. It cost the fighter and PAID fame +60, four points with every patron, twelve off the unrest, sixteen
of mercy standing, and the fire out of a rebellion if the freed man was the one they would have followed.
Paired on the same eight seeds:

| | keeps them | frees them |
|---|---|---|
| gold | 9,064 | **10,567 (+17%)** |
| fame | 2,232 | 2,360 |
| acclaim | 36 | **44** |

Richer, more famous and better loved, at no price. There was no decision in it — a button that hands you
things, gated on a man being good.

**So it costs what it cost in Rome, and both halves scale with the house.** The state took the *vicesima
libertatis*, a twentieth of the freedman's assessed value — here a fifth of what the man is worth, because
a lanista's assessment was never charitable — and a freedman of a house that thinks well of itself is not
turned out of the gate with nothing, so the peculium scales with the census rung and what the street
expects of you. Scaling rather than a fixed sum is the v3.14.0 rule: a flat price is a tax on a young
house and a rounding error to an old one.

| | keeps them | frees them, priced |
|---|---|---|
| gold | 9,064 | **3,915 (−57%)** |
| fame | 2,232 | 1,270 |
| men freed | 0 | 20 |
| houses ending `closed` | 0 of 8 | **2 of 8** |
| median life | 136w | 146w |

That is the most expensive thing in the game, and the arm above is the most extreme possible player — he
frees every man the week he qualifies. A player choosing two or three over a career pays a fraction of it.
The 57% is the ceiling of what mercy costs, not its expected price.

**And the week's work now names the man.** `rudisEligible` was crossed by 14.1% of every man who ever
lived and the only thing in the game that ever mentioned it was one line of the doctore's counsel,
weighted 66 among all the others — so the ending nobody reaches was gated on noticing. The agenda carries
it at urgency 1 with the fee and the plain warning that you lose a fighter, and it goes quiet the moment
you act. Gated on being able to afford it, so a house that cannot is not taunted with it.

`rudisCost`, `canAffordRudis`, `RUDIS_TAX` and `gladValue` reached the handle. The rope gained a `free`
step, opt-in for the same reason `gear` is: a player who frees his veterans is a measurably different
player, and flipping either default is a suite-wide re-baselining.

### v3.14.0 — Arming your men triples the bill and dents the surplus by a fifth

v3.13.0 made steel wear again. The question left over was whether that closes the middle game's coin
surplus, and it could not be asked, because the reference player has never bought a piece of gear in his
life. `gearUpkeep` read 0.0 denarii in every era of a 2,555-week sweep for that reason — so "60 of 70
purchasable pieces affordable and unbought" was a fact about the probe as much as about the game, and the
master's bench, 19 pieces at 2,900 to 9,500 denarii apiece, had never been driven at all.

The rope has a `gear` step now: it keeps every slot filled with the best affordable piece behind the
reserve, replaces anything worn past a third, pays the armoury to straighten a kit when that is cheaper,
and goes to the master's bench once it opens — one piece at a time and only at three times its price in
spare coin, because the ticket is once and the keep is for ever.

**Paired on the same eight seeds over 400 weeks:**

| | house issue only | arms his men |
|---|---|---|
| pieces bought over the run | 0 | **387** |
| master's pieces | 0 | **179** |
| kits mended | 0 | 54 |
| gear keep, year 12+ | 3.7d/wk | **382d/wk** |
| weekly bill, year 12+ | 291d | **923d** |
| mean condition | 56.5% | 82.7% |
| gold, year 12+ | 107,246d | **87,054d** |
| houses alive at week 400 | 3 of 8 | **6 of 8** |

**So the answer is: it helps, and it does not close it.** The bill more than triples and gear becomes a
382-a-week line where it was 3.7, which is a real and continuous sink — but the strongbox only falls 19%,
because a house that arms its men properly also wins more and is paid more. The sink is partly
self-funding, which is worth knowing before designing the next one: **anything that makes the house
stronger will refund a fraction of its own cost.** The surplus at year 12+ is still 87,000 denarii.

The other half of the result is that arming your men is straightforwardly good — six houses of eight
survive four hundred weeks against three, and the ending mix loses its rebellions entirely. That is a
reasonable thing for good equipment to do, and it means the gear economy is not a tax on competence.

**The step is OPT-IN, and that is a decision rather than an oversight.** Every other step in the
reference player defaults on. This one does not, because turning it on changes that player more than
anything since the rope itself: the bill triples, the ending mix changes shape, and half the figures
quoted in the heads of `policy`, `ends`, `careers` and `survive` were measured on a man who fought in
house issue. Flipping the default is a deliberate re-baselining of the whole suite and belongs in its own
release with every affected figure re-measured — not as a side effect of adding the step. `gear:true` is
how a check asks for it meanwhile.

**And the census floor from v3.10.0 earned itself this release.** `policy` came in at 19 of 20 with `rome`
dark, against 20 of 20 last time — exactly the 1-in-3 coin flip the 18-of-20 floor was set to tolerate,
correctly not failing. The v3.13.0 constants reshuffled the RNG stream and the bar absorbed it.

### v3.13.0 — The armoury was not maintaining steel, it was switching wear off

The ask was more wear, more maintenance, more breakage, so that arms and armour have to be bought again
and the middle game's surplus has somewhere to go. The system already existed. Measured first, over 8
houses and 2,555 weeks of the reference player:

| era | armoury lvl | free mend/wk/slot | mean condition | weapons under 25 | pieces broken |
|---|---|---|---|---|---|
| year 1–3 | 0.00 | 0.0 | 54.5% | 0.0% | |
| year 3–7 | 1.09 | 3.8 | 53.8% | 22.4% | |
| year 7–12 | 3.36 | 12.0 | **97.1%** | 0.0% | |
| year 12+ | 3.96 | 14.1 | **99.2%** | 0.0% | **0 in 8 houses** |

Steel is a real cost for seven years and then free for ever. `repairWeek` mended `level × 2.2 ×
armourerMend` into every slot every week, free, with no ceiling — against a weapon losing 3 to 6 in a
bout, the second level already broke even and the fourth restored four times what the sand took, from a
wear the same armourer had also cut by a quarter.

**And the number the whole balance turns on had never been measured.** Both of the first two attempts at
a new rate set the mend against the wear of ONE BOUT and both left steel comfortably above the warning
line for ever. A house fights about one bout a week and shares it round the yard, so a man fights **0.18
to 0.29 times a week** — his weapon loses about 5.5 a bout, an armourer takes a quarter off, and the real
figure is about **1.2 a week, not 5.5.** A mend of 0.45 a level was still more than double it.

**What changed.** `WEAR_RATE` up — weapon 4–7, offhand 3–6, helm 2–4, armor 2–5. `MEND_RATE` 2.2 → **0.18
a level**, which is 0.72 a week at the fourth level or about 1.1 with the best armourer in the game: just
under what a man in ordinary rotation loses. And a ceiling, `MEND_CEIL` 88 — free care keeps a piece
serviceable, it does not make it new. What makes a piece new is buying one, and now something has to.

| era | mean condition | weapon | weapons under 25 | pieces broken |
|---|---|---|---|---|
| year 1–3 | 54.0% | 54% | — | |
| year 3–7 | 57.9% | 58% | 16% | |
| year 7–12 | 60.9% | 52% | 10% | |
| year 12+ | 60.7% | **49%** | **18%** | **2 in 8 houses** |

**And maintenance now exists below the master's bench.** `gearUpkeep` sums `keep`, which is set on the
nineteen master's pieces and nothing else — so it read exactly **0.0 denarii in every era**, and a rack of
forty bought pieces was as free to hold as an empty one. Anything over 260 denarii now wants a smith at
0.6% of its price a week. The floor is deliberate: house issue and everything a young house can afford
stay free, so the opening is untouched, and `survive` came through at (4 standing, 7 men).

**What this does NOT do, said plainly.** It does not by itself soak a 102,000-denarii surplus. `gearUpkeep`
on the reference player reaches 5.5d a week, because he owns almost no bought steel — the cost lands on a
player who arms his men well, which is the right place for it. What it does is turn good steel from a
one-off purchase into a standing commitment, which is the precondition for the sink that already exists:
**19 master's pieces at 2,900 to 9,500 denarii, and arming eight men in the dearest kit is 212,000 to buy
and 856 a week to keep** — twice the year-12 surplus and more than the whole current bill. `masterOpen`
wants armoury level 2 and acclaim, both of which a middle-game house has. It is open, it is enormous, and
nothing has ever bought from it.

**Twelve functions reached the handle**, because the wear half of this economy was measurable and every
term that opposes it was not: `gearUpkeep`, `repairFee`, `armourerWear`, `armourerMend`, `armourerCut`,
`perkWear`, `rackCap`, `rackUsed`, `rackOver`, `rackStrain`, `rackRent`, `staffSkill`, plus the new
`kitKeepOf`, `MEND_RATE` and `MEND_CEIL`. The question a player asks — does any of this ever cost me
anything — could not be asked from outside the file at all.

**And `steel` was quoting three literals about the pair it tests**: "the ~25 a weapon needs to break",
"+4.4 a week", "against 3-6 a bout". All three would have gone on printing the old economy after the
constants moved. They are derived from `A.WEAR_RATE` and `A.MEND_RATE` now, and the historical figures are
labelled as belonging to the old pair — the #125 lesson, applied to the check that needed it next.

### v3.12.0 — Two items raised off a check's own honesty, and one of them still paid

The last two items of this audit round were both raised off a check's "what is not asserted" clause
without reading the reason printed beside it. Neither was the fault it claimed. Both were worth something.

**#129 — the doctrine career comparison is held to nothing. REFUTED: there is no career comparison.**
`school`'s head opens with "THE CAREER COMPARISON IS NOT ASSERTED, and why", and the item was raised off
that line and not the twenty after it. v3.0.0 removed the career arm entirely and replaced it with pricing
each doctrine field at the one or four places it is actually read — `purse` at 14088, `injure` in the
training week at 15565, and so on — all of which IS asserted. The note now says the arm is GONE rather
than merely unasserted, and says why the distinction matters, because the first line of a paragraph is
what gets quoted.

**#130 — `survive`'s distribution is twelve runs of one build. TRUE, ALREADY DOCUMENTED, AND NOW FIXED
DIFFERENTLY.** The head says it in more detail than the item did: twelve runs put a 95% interval on a
1-in-12 failure rate of roughly 1.5% to 35%, the cure is more houses, and more houses is the one thing
that check cannot have — seven Chromiums on four cores started missing clicks and cost two false failures
of a different kind. So the bar stayed where it was, correctly, for four releases.

What nobody had tried is making the sample accumulate ACROSS runs instead of within one. Every
observation `survive` ever made was written into its head comment by hand, one paragraph per release —
which is exactly the practice #125 caught in `odds`, where a figure copied into prose became a figure
nobody could recompute. It now appends `(version, standing, men, pass)` to `test/survive-tally.json` and
prints the pooled distribution, with the count of distinct builds and a line saying how many more runs
are needed before the bar is worth setting on evidence. The file is in the repo deliberately: the
container is ephemeral, and a tally that does not outlive the session that wrote it is worth nothing.
Writing it is best-effort — a run that cannot write says so and carries on, because a tally is evidence
for the next person rather than something the suite depends on.

First entry: v3.11.0, (4 standing, 6 men), pass.

**And the standing lesson from both.** A check that documents its own limits honestly will generate false
audit items. The answer is to read to the end of the paragraph, not to document less.

### v3.11.0 — Nobody had ever counted the taps

**#126 — nothing measured how deep an action is.** Five releases of UI work were argued from screen text,
fold position and section counts, and none of them counted the thing a player actually spends. The item
guessed at it — "the build UI is three taps down" — and guessed wrong: building is on the ludus tab, whose
deepest action is two taps.

Depth, defined the way a thumb experiences it: 1 for the tab, +1 if the action sits behind a face chip,
+1 for each closed section it sits inside. Scroll is deliberately kept separate, because a tap and a
scroll are different costs and lumping them is how "above the fold" got argued for three releases without
either number being written down. Measured at week 16 of a founded house, 43 actions that change the house:

| | actions |
|---|---|
| one tap | 22 |
| two taps | 16 |
| three taps | 5 (12%) |
| deeper than three | **none** |

All five of the three-tap actions are on the villa, behind a face chip AND a closed section: the
collegium, the household's three women, and **the party** — the lever the middle-game measurement found
moves the census ladder from rung 1.50 to 2.70 and Rome from 31 weeks to 218, sitting three taps and two
and a half screens from the tab bar.

**The real cost is scroll, not depth: about 77% of the things that change the house sit below the first
844 pixels**, the furthest past y=2,900. That is printed rather than barred, because a button's y depends
on how many men are in the yard and how many slavers are at the block.

**And the one bar that fired found something.** Every PLACE a player can arrive must offer an action at
the shallowest depth that place can give — 1 on a plain tab, 2 on a face. `villa · The Cells` failed it:
its only two actions are the feast and walking the cells, both inside one folded section, so its
shallowest action cost 3 taps where 2 was all that face could ever ask. #117 measured working the cells as
the largest single lever in the game and #119 found nothing ever suggested walking them; folding the only
actionable panel on a face saves no scroll and costs a tap. It opens by default now, and the face went
from 3 taps to 2.

New check `reach` (60). Its bar on depth carries no margin, because depth is arithmetic on the DOM rather
than a sample — unlike every count-comparison bar in this suite. Three probe faults first, each a way of
measuring nothing: an arm that advanced 60 weeks pressing End Week and nothing else, which is `ends`'s
`idle` policy, went bankrupt near week 55 and reported the TITLE SCREEN's seven buttons as the game's
actions; reading every `button` counted section summaries as actions when they are the cost of depth
rather than things at the bottom of it; and the gatekeeper's teaching panel came in because it is an
inline panel and not a `.modalwrap`, exactly as the note over the harness's `clearAll` says. The
per-place bar was also wrong once — first stated per TAB, where the familia and the villa cannot give a
one-tap action because their actions all sit behind a chip by construction, so it failed both for being
built as designed.

### v3.10.0 — A census with three entries that could not fail, reading twenty of twenty

**#128 — `policy`'s subsystem census had no floor, and three of its twenty were free passes.** Both
halves were worth fixing and the second was not in the item.

The census printed the KEYS of the systems that switched on and nothing else, so "aedile, armourer, bay,
..." looked like twenty systems in health when it is equally consistent with nineteen firing everywhere
and the twentieth firing once. `subs[k]` — the number of houses each system switched on in — has always
been computed here and was never shown. It is printed now, so a system on its way dark shows as a falling
number rather than vanishing from a list in one step:

    doctore 8 · primus 8 · bay 8 · election 8 · aedile 8 · league 8 · book 8 · heir 8 · household 8
    rise 7 · blessing 6 · medicus 4 · armourer 4 · vow 4 · nemesis 4 · brand 4 · city 4 · doctrine 4
    war 1 · rome 1

And "switched on" was `d[k] != null` and not an empty object, which is right for the seventeen that start
as `null`. Measured on a brand new house before the player does anything, three of them are populated
objects on the first morning:

    rise    {"rank":0,"standing":0}
    brand   {"licensed":false,"decided":false,"tier":0,"earned":0}
    league  {"first":null,"since":1,"held":0,"best":99,"year":1,"snap":null}

so all three counted 8 of 8 in every run this check has ever done and could not have counted anything
else. Each now has to have actually happened — a rung claimed, the brand touched, the league recording a
placing — and the corrected counts move `rise` from 8 to 7 and `brand` from 8 to 4.

**The floor sits where the arithmetic puts it: 18 of 20.** It cannot be twenty, because two of them are
coin flips at this n — `war` 1 of 8 and `rome` 1 of 8, so p-hat 0.125 and P(0 of 8) = 0.875^8 = 34% each,
and a bar requiring both would fail more than half of all runs with nothing changed. The next-rarest group
sits at 4 of 8, where P(0 of 8) is 0.4%. So 18 is the only floor under both fragile systems and above
every stable one, and it fails by chance in about 0.5% of runs.

**Two things deliberately left unbarred, with the arithmetic for each.** Per-system floors: eight houses
is one observation of each system's rate, and a system seen 8 of 8 has a 95% lower bound near p = 0.63,
where P(2 or fewer of 8) is about 4% — barring those individually off one run is the mistake #127 was
about. The ending mix: the only collapse worth failing on is every dead house dying of the ledger, the
#117 signature of an arm that has stopped being paid, and at 6 dead of 8 with the measured mix that comes
up by chance about 1.6% of the time, which is above what this suite tolerates. Both are printed with
counts so they can be barred once there is a series to bar them on.

**And `bulk` caught v3.8.0 in a way worth keeping.** It failed with *"endTheLine is 7021 lines"* — a
two-line function. `bulk` measures a definition by the distance to the next one, and its regex did not
match `export default function App` because of the `default`, so App was not a definition and whatever
happened to be the last real one before it absorbed the whole component. The 7,000-line allowance was
written against `takeUpTheHouse`, which is one line; it was never a fact about that function, only about
its position, and adding a function beside it moved the allowance to the new name. `default` is in the
regex now, App is measured as itself at 7,013 lines, and the allowance says what it is for.

### v3.9.0 — Two figures the suite had been quoting from its own comments

No game change. Both audit items turned out to be about what the checks BELIEVE, which is the category
this audit keeps finding things in.

**#125 — the quote is not four points rich. It is honest in the middle and compressed at both ends.**
`odds`'s head has carried "the quote runs about four points rich across all four orders" for three
releases, and `cell` has always computed both the quote and the realised rate while printing only the
realised one — so the figure came from nowhere the file could point at. Both are printed now, per grade
and pooled, so the claim is re-derived every run. On the two instruments that are sound for it:

| | quoted | on the sand | |
|---|---|---|---|
| this check's mirror, 600 bouts | 45.2% | 44.7% | rich by 0.55, se 2.04 — indistinguishable from honest |
| `engines`, even | 41% | 43.5% | 2.5 thin |
| `engines`, yours the better | 94% | 96.8% | 2.8 thin |
| `engines`, yours outmatched | 3% | 0.7% | 2.3 rich |

So it is honest where the fight is even and compressed toward the centre at both ends — what a model
that under-weights an edge does, and the opposite of a flat richness. Left alone: two points is inside
what a bookmaker's number owes anybody. The second half of #125 was wrong by more: the panel quotes
forward 45.2% against standing off 44.5%, a gap of 0.7 where the source's own 2,700-bout table has 5.2.
That is understated about sevenfold, not by half. The bar stays on the ORDER, which is the part a player
acts on.

**And five probes of mine failed before any of that was readable — four of them with one fault.** Each
built ONE fighter and reused him across hundreds of bouts, resetting the six stats, fatigue, injury,
morale and record between them and not `lasting`, `strain`, `form`, `wear`, `scars`, `regard` or
`defiance`, which accumulate. He decayed in ways `winChance` cannot see: 9.6 points "thin" pooled over
4,800 bouts, and a mirror at 35.6% where `odds`'s own mirror sits at 44.7%. The fifth blamed coaching and
killed its own explanation — pressing at every balance against saying nothing at all is worth **0.58
points** over 9,600 bouts. `odds`'s `cell` takes a fresh state per bout, and that is not incidental to it.

**#127 — a bar that did not match the paragraph above it.** `ends` says of the playing-well-against-idle
comparison: *"this is recorded, not asserted: if it ever inverts — if doing nothing outlives playing well
BY A WIDE MARGIN"* — and then asserted `outP >= outI`, a bare inequality with no margin in it. At this n
that is not stable: 6 of 24 against 12 of 24 is p 0.25 against 0.50, the counts have SD 2.12 and 2.45,
their difference has SD 3.24 against a mean of 6, and the inequality flips by chance in about **3% of
runs** with nothing changed in the game. Three percent is a check that fails once a month for no reason,
which is how a suite is taught to be ignored — `policy`'s median-life bar was retired for the same
arithmetic two releases ago. The bar now carries the four-house margin the paragraph asks for: P(diff >= 4)
is about 0.1%, and a genuine inversion moves it by far more than four.

### v3.8.0 — Generation two was reached zero times in twenty-four houses

The open question was whether a named heir should always continue the line. The measurement answered it,
and the figure was worse than the question assumed.

`lanistaWeek` read `d.heir` in two branches that disagreed about what naming one meant:

    L.age >= 62 && L.health >= 45 && d.heir && yearOf(d) >= 6 && R() < 0.06
       -> d.over = { kind:"oldAge" }          the run ENDS
    L.health <= 0
       -> d.heir ? d.succession = {...}       the run CONTINUES into generation 2
                 : d.over = { kind:"lanistaDied" }

The retirement branch REQUIRED an heir and then discarded him — and `oldAge`'s own prose says *"by summer
the house is being run by the heir and everybody has agreed not to say so"*, which is the continuation,
described, and then not delivered.

The two branches raced and the ending won almost every time. Past 62 health falls `(62-42)*0.045` = 0.90 a
week against 0.06 of mending, so from about 85 it takes roughly 48 weeks to reach the health-45 floor, and
6% a week across 48 weeks fires with probability 0.95.

**Measured over 24 houses of up to 900 weeks, every one of which named an heir:**

| | before | after |
|---|---|---|
| successions raised | **0** | 11 |
| houses reaching generation 2 | **0** | 11 of 24 |
| ended with an heir standing there unused | 24 of 24 | 17 |
| ended at `oldAge` | 11 of 24 | 0 (this player takes the chair) |
| still standing at week 900 | 0 | 7 |

Not "1 in 12" as the earlier note in `ends` had it — **none**. `succeed`, `takeUpTheHouse`, the forebear
record and the whole second generation, including the v2.98.0 fix that stops the next lanista inheriting his
predecessor's widow, were unreachable in ordinary play by arithmetic rather than by bad luck.

**What changed.** Retirement raises the same `d.succession` a death does, and the choice is the player's.
The screen serves both and says which: a death opens *THE HOUSE GOES ON* with one door, a retirement opens
*THE LONG TENURE* with two — take the chair, or let it end with him. `oldAge` is still an ending; it is now
the door you choose rather than one chosen for you, which is also the only reason it is still reachable at
all. `succeed` and the forebear record know the difference, so the annals no longer say a living man was
carried out, and both record sheets read `retired` instead of printing "died at 66" under a man who walked
down to the square that morning.

`domus` drives both doors — 6 of 6 retirements raise a succession, 3 take the chair into generation 2 with
the forebear marked retired, 3 decline into `oldAge` — and `words` holds the screen's copy in both states.
`ends` and `policy` both carried notes claiming the old behaviour was the fix; both are corrected in place.

### v3.7.0 — The ladder blamed the meter for everything, in 98.7% of all weeks

The middle-game measurement said favour is the first failing gate on the next rung in 60–83% of weeks past
year three, while the house sits on tens of thousands of denarii. Before that became a design claim it had
to survive the standing rule that an extreme number is evidence about the probe first — and this time the
probe was fine and the panel was not.

**The paired arm.** `hostParty` costs 900 for a decadent affair and warms every patron. The reference
lanista had never thrown one. Same eight seeds, 300 weeks, the only difference being a man who entertains:

| | reference | + parties |
|---|---|---|
| mean census rung | 1.50 | **2.70** |
| highest rung reached | 5 | **7** |
| patrons' favour | 40 | **79** |
| weeks at Rome | 31 | **218** |
| what holds the rung | favour 60% of weeks | favour **0%**, coin 53% |

**And the falsifier half-fired, which changed the copy.** One party alone IS a treadmill: measured, the
per-patron bump is repaid by decay in about fifteen weeks. Kept up it is nothing of the kind — a party
whenever the two-week guard allows reaches favour 91 by week 10 and pins at 100 from week 30, for about 457
denarii a week against a middle-game bill of 249. So the panel does not say "throw a party"; it says favour
is bought at your table and at the games, and that leaving it alone cools it every week.

**The button.** `!need.full` was tested before every substantive gate, and `riseWeek` drains standing by 2 a
week in exactly the case where fame or favour is short — so the two conditions are not independent. Measured
over 1,256 weeks of the reference player, the button read *"The town is not yet used to you"* in **98.7% of
all weeks**, and in **84.7% of those** the thing actually short was fame, favour or coin. It named the one
term that is a *consequence* of the others and never named a cause. The substantive gates are tested first
now and each says its own figure against the one the rung wants.

**The meter said "growing" while it drained.** Its label read *"The town must grow used to you"* whether the
bar was filling or emptying, and it is emptying in **77.1%** of weeks. It now says which, and turns red when
the answer is cooling.

**And the party table advertised a number that never survived being read.** `hostParty` did
`d.favor += PARTY[kind].favor` — 6 / 14 / 28 — and then, four lines down, called `serveWants`, which ends in
`recomputeFavor`: the rank-weighted mean of the patrons. The line wrote a figure and the same function
overwrote it. Measured on a house at favour 6, the table's figure would have left it at 34 and it came out at
21, which is the patrons' mean to the point. The field is gone; `warm` (5 / 9 / 15) is the per-patron bump —
what the villa's menu has always advertised — and is now one field rather than the same ladder hardcoded in
`hostParty` and again in the menu, which is how those two could have drifted apart unnoticed.

**One thing measured and NOT built.** The obvious companion was an agenda line: when favour holds your next
rung and a party is affordable, the week's work says so. Counted before writing it, that gate stands in
**45.6%** of weeks — which is precisely the #101 wallpaper fault, by the same hand, for the fourth time. The
panel copy is the fix; the week's work says nothing new.

`words` grew the three ladder states and the party's arithmetic. Two arms of that failed first and both were
the probe: the favour arm stood on rung 0, whose next rung asks for `favor: 0`, so favour was met by
definition; and it asserted the meter reads "cooling" in all three arms, when `riseWeek` knows nothing about
coin and is genuinely filling in the coin arm.

### v3.6.0 — A warning that arrives after the wagons are loaded, and two boxes that opened onto one sentence

Three lines of copy, all found the same way: by asking what a panel says in the state a player is most
likely to be standing in, rather than the state it was written for.

**The letter from Rome warned about two of the three things and not the third.** It said half the imperial
bouts are fought sine missione and that your patrons have no reach in that city. It did not say that
`stopAtCrux: !offer.imperial` makes the imperial card the only bout in the game that never stops for an
order — 0.0% of imperial bouts reach the balance against 33–58% of ordinary ones. The bout's own beats DO
say it, two lines in: *"no word of yours is going to reach him once it starts."* That is after the letter is
answered, the wagons are loaded and three men are on the road to a city the house cannot leave for a month.
A warning that arrives once the decision is unmakeable is not a warning. The letter carries it now, and
says plainly that it is not true of any other card the house has ever taken.

**`The blood of the house` told a lanista of sixty to climb a little higher.** `marryReady` is
`age < 56 && (rung >= 1 || fame >= 60)`. Below 56 and under the bar, "climb" is exactly right — so the
panel now names the bar and the figure: *they want fame 60, or any rung of the census; you have fame 12 and
stand a keeper of slaves.* Above 55 no purse and no name will ever open it, and the panel was asking for
work that could not possibly pay. That branch now says the blood is shut and points at the thing that is
not: `heirEligible` always offers a nephew, so the line can still be carried by somebody from outside it.
The summary line used to read "no family yet" in both states, which is the same word for a bar you can
clear this year and a door that has closed.

**`The aedile` was a box whose entire content is one sentence about his stance,** with only the weeks
remaining on its summary line — so the box had to be opened to learn the one word it was worth opening for.
The summary carries the stance now (*he owes you*, *he is against you*, *no view of you*) and the body keeps
what the stance is worth in numbers, which is the only part that deserves a fold.

**And `sweep`'s thin list carried a confident false positive for three releases.** `THE YARD` on the ludus
tab read 118 characters and no buttons; its content is `LudusPlan`, a drawing of the whole compound in svg,
which `innerText` cannot see. The thin count now excludes sections with an `svg` or `canvas` in them and
prints those separately as short on words because the content is a picture. A list with one obvious false
positive on it is a list you stop reading, which is a fair guess at why the two real thin sections beside
it went three releases without being fixed.

New check `words` (59), which reads all three off a real save loaded into a real browser — a copy assertion
written against the source file asserts that a string exists somewhere, which is not the claim. Its first
draft reported that the letter from Rome could not be raised at all: `clearAll` clicks the last live button
of the topmost overlay, and on that letter the last button is "Capua is enough". The probe declined the
invitation and then measured its absence.

### v3.5.0 — Both remaining UI options are refuted, and what survives is novelty again

Options 2 and 4 of the five, and the measurement they were both waiting on killed both of them as stated.
Option 2 was "open by default what is actionable this week"; option 4 was "fold the sections with nothing
in them into one *not yet* block". Both are bets on the same unknown number, so a predicate was written for
each of eleven sections and the number was measured over 8 houses of 300 weeks — 660 weeks — of the
reference player:

| | | | | | |
|---|---|---|---|---|---|
| party | **96.8%** | cells | 68.6% | watch | 51.1% |
| temple | **93.9%** | blood | 67.0% | collegium | 48.9% |
| aedile | **91.5%** | school | 61.8% | block | 47.0% |
| | | household | 58.5% | square | 26.8% |

**Ten of the eleven are live on 35% of weeks or more and three on over 90%**, so opening what is actionable
opens almost everything and collapses the tab into the one long scroll option 2 existed to prevent. And
**nothing is live on under 15%**, so option 4 has nothing to fold away.

**THE FAULT IS IN THE PREDICATE, AND IT IS #101 FOR THE THIRD TIME.** "Can this be acted on" is nearly
always yes: the altar is off cooldown, a party is affordable, an aedile is seated. A signal lit on 90% of
weeks is not a signal. The predicate that works is the one v3.2.0 already found for the week's agenda —
NOVELTY. A section opens itself for the first three weeks after its opportunity appears and then stops
asking, exactly as an agenda item stops being news.

**RE-MEASURED WITH THE FRESHNESS LAYER:** a section opens itself on **9.2% of weeks** against 64.7% if
availability alone decided it, and no section exceeds 35% (worst: `watch` at 30.8%, patrons who want
something, which churns). The eleven predicates live in one exported `SECT_LIVE` table so the two options
can never drift apart the way a hand-kept list of "important sections" would, and `secAge` is ticked beside
`agendaTick` at the end of `endWeek`.

**AND ONE THING FROM OPTION 2 SURVIVED UNTOUCHED BY ANY OF THAT.** `Sect` takes a `sid` now: once a player
opens or shuts a section by hand, that is what it does for the rest of the session, over the top of
whatever the game guessed. It is held in memory rather than in the save, so it does not survive a reload —
deliberately, because it is a preference about one sitting and not a fact about the house. A `live={false}`
section also says *nothing yet* on its own summary, which is honest and does happen: `square` is false on
73% of weeks.

`week` gains the section table: the clock, the bar that a section may not open itself on more than 40% of
weeks, the bar that the mean must stay under 25%, and the reverse bar that the predicates must still SEE
their opportunities (live under 25% on average would mean they had stopped working).

### v3.4.0 — Seven catalogues become one rack, and the filter says what it is hiding

Option 3 of the five, reshaped by its own falsifier. The armory was a `Sect` per weapon FAMILY — seven of
them for the weapon slot (Straight Blades, Curved Blades, Spears & Reach, Tridents, Paired Blades, Heavy
Arms, Sidearms), each 24 to 37 lines. The plan was one list filtered to "his style". Two measurements
changed the shape of it:

| | |
|---|---|
| distinct classes in the yard, over 343 house-weeks | **mean 2.41 of six**, and 86% of weeks hold three or fewer |
| what a "his style" filter keeps | **4.09 of 7 weapon families — 58% of the racks** |
| where the seven headings sat, closed, at a phone width | **y=578 to y=803 — all on one screen** |

So the filter earns its place (the yard is narrow) but cuts 42% rather than the 80% I first assumed — and
the seven sections were never costing scroll, they were costing CLICKS. Comparing a sica to a gladius meant
opening two boxes.

**WHAT SHIPPED** is one open list per slot, cheapest first, with three filter chips that carry their own
counts — *In our styles 14 · Everything 26 · On the racks 2* — so the filter says what it is hiding instead
of hiding it. Every piece the seven headings carried is still on the row: the family as a tag, the master's
piece line, and a *clumsy for this yard* tag on anything outside the styles you actually field. A house at
week 17 reads "14 of 26, cheapest first — what the men in this yard can carry without it being clumsy."

`sweep` holds the ceiling: the armory face may carry at most two sections, and the check names the seven it
used to have and why they went.

### v3.3.0 — The arena opened with a bribery menu, and the card was below the fold

Option 5 of the five: give every tab a one-line answer before its detail. Its falsifier was "if a strip's
numbers are already visible in the header, it is duplication" — and the header is FIXED on every tab and
already carries the coin, the fame, the favour, the loan, the lanista's health when it is low, and the
unrest word. So a new probe read every element whose top sits inside the first 844 pixels of each tab and
face, at a phone width, and the option shrank from five strips to three real faults.

**THREE TABS ALREADY ANSWERED THEIR OWN QUESTION.** `familia` opens with *What the men need · 1 thing* at
y=234, `armory` with *The racks · 0 of 8* at y=174, and `ludus` with the week's work at y=247 as of v3.2.0.
Nothing needed adding to any of them, which is the falsifier doing its job.

**AND THE ARENA OPENED WITH A BRIBERY MENU.** The first thing on the arena tab was *What can be done
quietly* and its three bribe options with their quoted odds, filling the entire first screen: a player who
opened the Arena to see what bouts were on offer got a menu of ways to get at a rival's steel, and TO THE
SAND was below the fold. The quiet business is below the card now. Measured after: TO THE SAND at y=249,
CHOOSE A BOUT at y=328, the bribery at y=412.

**THE MARKET ANSWERED IN FLAVOUR TEXT** at y=361, under two staff sections — *"The slaver's block. Fresh
stock every third week. Roster holds 8 men."* It has a real answer now: how many are standing, how long
until new stock, how much room is in the cells, how many are within your coin, and the cheapest price.

**AND THE VILLA'S COIN & COUNCIL FACE SAID NOTHING ABOUT COIN.** It opened with three closed sections and
then the moneylenders. It leads with the week's cost now — the bill, how many weeks the box would carry the
house at it, and who is holding money in either direction.

**PLUS A COPY ERROR OF MY OWN FROM v3.1.0.** The market's merged staff panel said "build either on the
villa's House page". The villa's House face is the crest, the motto, the name and the family; the WINGS are
in the House sheet behind Records & Annals on the Ludus tab — three taps away, and not where I sent
anybody. Only the fold probe caught it.

`sweep` asserts the fold now: each tab must say what it is for inside its first 844 pixels, with the
keyword per tab named in the check. It reads *every tab says what it is for in its first 844px*.

**AND OPTION 3'S FALSIFIER WAS MEASURED AND PARTLY FIRES.** The plan was to replace the armory's seven
weapon-family sections with one list filtered to "his style", and the falsifier was "if a typical house
holds men of five or six classes, that filter keeps almost everything". Over 343 house-weeks of the
reference player: the yard holds a mean of **2.41 distinct classes** and 86% of weeks hold three or fewer —
narrow, which favours a filter — but a "his style" filter keeps **4.09 of 7 weapon families, 58% of the
racks**, because `pugio` carries `styles:[]` and suits everybody and each class's own weapon adds a family
of its own. So the filter cuts 42%, not 80%. The seven sections also all fit on one screen closed
(y=578 to y=803), so they are costing CLICKS rather than scroll — comparing a sica to a gladius means
opening two boxes. That reframes the change from "filter the catalogue" to "one list, one scroll, sorted",
and it is the next release rather than a rushed half of this one.

### v3.2.0 — The week's work comes first, and five lines of it were wallpaper

First of the five UI options. `agenda(d)` has known what wants an answer and which tab the answer is on
since v2.57.0, and it rendered inside a `Sect` called `This week` which the v3.1.0 tab anatomy measured at
**y=1565** on a founded house at a phone width — two screens down, after the gatekeeper's panel, the
rivalry line, the banners and The Yard. It opened itself only when something was urgency 3, so an ordinary
week with five things on it was shut and read "5 things".

**THE FALSIFIER WAS MEASURED FIRST.** 289 weeks of the reference player, `agenda(d)` read before he acted:

| | |
|---|---|
| weeks with nothing on the list | **0 of 289** — so a promoted block is never empty |
| weeks with seven items or more | **156 (54.0%)** — so a flat list of seven is the wrong shape |
| weeks with five or more | 246 (85.1%) |
| distinct tabs a week's items point at | **4.11 mean** — so a jump to the tab is worth having |
| weeks the section opened itself | 218 (75.4%), and it stayed shut on 71 weeks that had work on them |

So promotion was right and a flat list was wrong, which is the shape the measurement bought.

**AND THE LIST WAS WALLPAPER — #101's FAULT AGAIN, WITH TWO OF MINE IN IT.** Five labels were lit on 41 to
62% of every week a house lives:

| label | weeks | share | |
|---|---|---|---|
| There are men on the block | 180 of 289 | 62% | |
| Nobody in this yard can teach | 177 | 61% | |
| This house teaches no particular thing | 151 | 52% | **added in v2.93.0** |
| Nobody feeds this house, or nurses it, or keeps it | 118 | 41% | **added in v2.98.0** |
| N men have not been sworn in | 118 | 41% | |

#101 was "the marks shipped last week are lit most weeks, which makes them decoration". Two of these five
were added by this audit in the three releases before anybody counted them. A list where the same five
lines sit every week teaches a player to stop reading it, and then the one line that matters is invisible
among them.

**WHAT SHIPPED.** An item carries its AGE — the consecutive weeks its label has been raised without being
dealt with, tracked in `d.flags.agSeen` and ticked at the end of `endWeek` with the label's numbers
normalised out. The panel is the FIRST thing on the ludus tab, it always shows what is urgent or new
(three weeks or less), each row is a button that switches to the item's tab, and the standing furniture is
a count and a tap — *"And 6 things that have been waiting"*. The doctore's word and the year-ahead button
came with it; the old section is gone rather than duplicated.

**RE-MEASURED ON THE SAME CAMPAIGN:**

| | before | after |
|---|---|---|
| the whole list, mean items | 5.6 | 5.6 (unchanged — it is all still there) |
| **what a player is shown without asking** | 5.6 | **2.3** |
| seven or more shown | 54% of weeks | **1.2%** |
| the worst standing item, in the shown block | 62% of weeks | **16%** |
| the same item, in the whole list behind the tap | 62% | 69% — not hidden |

New check `week` holds the age arithmetic, the ranking, and the shape: the shown block may average at most
5 items and no single label may be in it on more than 34% of weeks. Fifty-eight checks.

### v3.1.0 — "He loses about NaN in a hundred", and the first count of every section on every tab

**A PLAYER SENT A SCREENSHOT OF A PAIR CHOOSER WITH `NaN` UNDER EVERY MAN ON IT.** The line reads
*"✦ No appeal is asked and none is given. He loses about NaN in a hundred, and a loss here is his life."*
The chooser prices that warning with `winChance(g, foe, …)`, and `foe` for a pair or a melee is
`fieldAverage(o.opps)` — the average man in the field. `fieldAverage` returned the six stats, `cls:null`,
`injury:null` and nothing else. `power` reads `morale` and `fatigue`; `clamp(undefined, 0, 100)` is NaN;
NaN survives every multiplication after it and lands in the template. **Nothing threw and nothing was
ever going to.**

**IT COULD NOT HAPPEN UNTIL v2.98.0, WHICH IS THE PART WORTH KEEPING.** The warning is gated on
`stakes === "sine"`, and a pair offer hardcoded `"standard"` until that release let a munus bought sine
missione carry its pair. Making dead content reachable is a change to every path that reads it — the fix
for one unreachable branch made a second one reachable, and the second one was broken.

`fieldAverage` carries everything `power` reads now, and averages the soft numbers the same way it
averages the stats. `cls` stays null on purpose: a field of four men has no one style, and `readMatch` is
right to answer "no read" rather than invent one. The warning also stands on its own when there is no
figure to put in it. Priced against all five foes the chooser can build, every one comes back finite.

**AND NOTHING IN THE SUITE HAD EVER READ THE SCREEN.** `sweep` opens every tab, face, section and sheet
and asks whether rendering threw — which a NaN never does. It scans the text of every face now for the
four things a template says when a value went missing under it: `NaN`, `undefined`, `[object Object]`,
`Infinity`. `odds` holds the headless half: `winChance` must price a real opponent, a melee field, a pair
field, a field of one and the barest object to a finite number.

**THE UI AUDIT: THE FIRST COUNT OF EVERY SECTION ON EVERY FACE.** Measured on a founded house at week 17,
at a phone width:

| face | sections | what the count found |
|---|---|---|
| ludus | 12 | one of them a section **inside** a section |
| armory | 7 | every weapon family 24–37 lines long |
| villa · The Cells | 4 | three holding one paragraph and one button each |
| market | 4 | two saying "build the room first" in 61 and 63 characters |
| villa · The House | 4 | the last of them 100 characters |

Three fixes came out of it. **"What you are doing without"** — the six things a doctore is worth — was a
`details.sect` nested inside the Training Square's `details.sect`, so it sat two clicks down on the tab a
player opens every week; it is a plain block now, and the section it lives in only renders when there is
no doctore, so it was never hiding anything. **The villa's Cells face** had three collapsed disclosures of
two lines apiece, each holding one button, on a face with nothing else on it — they are one section, *What
you can do for the block*, because they are one decision. **The market's two staff sections** both said
"build the room first" to a house with neither room; when no post is open it is one line and no
disclosure, and the sections come back the moment there is a room to work in.

Nesting is asserted now. The thin sections are counted and printed and NOT asserted — three remain
(`THE YARD` 118c, `THE BLOOD OF THE HOUSE` 100c, `THE AEDILE` 92c) and all three are states that fill in
as the house grows, so "too short" is a judgement rather than a fault, and `probe` already paid for the
lesson that a rule which flags false positives teaches people to add exemptions without thinking.

**AND ONE FINDING OF MINE WAS WITHDRAWN ON THE WAY.** The first anatomy probe reported an EMPTY section on
the ludus tab — 0 lines, 0 characters. It opened each `details` in isolation and read `innerText`, and
`innerText` is empty for anything inside a CLOSED parent. Nothing was empty; the "empty section" was the
nested one, and finding that out is what turned a phantom into the real fault.

### v3.0.0 — A fix shipped nine releases ago that nothing was ever wired to

The last two items on the v2.93.0 audit list were both about the suite's own instruments, and they turned
out to be one item.

**`wantStakes` SHIPPED IN v2.91.0 AND EVERY CALLER WENT ON PASSING THE BROKEN OPTION.** `takeBout` used
to hand `o.stakes` to `makePitOffer` and nowhere else, so an arm asking for a kind of bout got it in the
pit and whatever the arena bill happened to offer everywhere else. v2.91.0 added `wantStakes`, which
filters the bill too, and wrote the fault down in the harness. Then `chair`, both of `ends`'s arms and
`steel`'s wrapper all kept passing `stakes:`. Measured over 10 houses of 120 weeks:

| asked for | with `stakes:` | with `wantStakes:` |
|---|---|---|
| `sine` | 76% sine, 10% standard, 9% melee, 5% venatio | 100% |
| `standard` | 76% standard, 9% sine, 8% melee, 7% venatio | 100% |
| `blood` | 83% blood, 9% sine, 5% standard, 4% venatio | 100% |

So `ends`'s sine arm and its standard arm — the two halves of a published comparison — overlapped by
about a quarter of their bouts.

**THE FIRST FIX WAS TO ALIAS THE TWO NAMES AND IT BROKE `ends` IMMEDIATELY**, which is the useful part.
Strict filtering took `proven` to 4 of 5 houses out by debt against a measured 0–10%, because a house
that refuses every week the bill has no standard card on it fights far less and is paid far less. There
are two honest readings, so there are two options: `wantStakes` is strict and refuses the week, and
`stakes` / `preferStakes` takes the preferred card if the bill has one and the bill anyway if not. That
is what the four callers meant, and it still fixes what they got — 92% standard against 76%.

**AND THE REFUSALS ARE NOW COUNTED, which was the other half of the item.** A refusal was legible in
`takeBout`'s return and nothing forced a caller to look, so a check that asked for 300 bouts and was
refused 200 reported the 300. The rope keeps `refused` by reason and `wrongStakes`, and `__ROPE.say()`
prints them. `ends` now says out loud: *4,998 bouts · 3,249 reached the balance · 1,307 weeks refused ·
594 at the WRONG STAKES.* None of those three numbers existed before.

**WHAT IT MOVED, and how much of that is attributable.** `ends`'s `proven` arm over 120 weeks went from
6 of 12 out (rebellion 4, ruin 2, median fame 560) to 4 of 12 out (rebellion 4, median fame 1,845) — the
direction you would expect from an arm that has stopped walking into death matches it never asked for.
The magnitude is not attributable: filtering the bill changes which offer is picked and reshuffles every
RNG draw after it, and v2.99.0 measured fame block-medians spanning 84 to 4,206 on eight houses of one
build. Direction: the fix. Size: unknown, and said so.

**AND THE OTHER ITEM WAS ANSWERED IN THE SAME PASS.** `school` shipped in v2.93.0 with a promise: that
`blood`'s "purses ×1.18 delivering 374d against 530d" needed one identical bout fought with and without.
Each doctrine field is read in exactly one or four places, so each can be priced at its own site:

| | listed | measured |
|---|---|---|
| `blood` purse, on a held card | 1.18 | **1.179** |
| `blood` health, a DIVISOR — the lanista per death | 0.7 → 1.4286 | **1.429** |
| `craft` train, one man on one stat | 1.12 | **1.1194** |
| `craft` injure, spar injuries over 1,800 weeks | 0.7 | 0.55 ± 0.14 — consistent, n too small to separate |
| `craft` purse | 0.90 | **0.968** |

The v2.93.0 inversion was entirely the career. The `craft` residual is real and is a note rather than a
bug: `facPurse` reads the factions, and the front rows craft wins you hand back three quarters of the
discount it charges — so its player-facing note says so now.

**THREE MEASUREMENTS OF MINE FAILED BEFORE THOSE FIVE WORKED,** all the same shape. `injure` first read
1.00× because I counted BOUT injuries and `docInjure` is read in the training week. The arm before that
read 0.0000 in both arms because it set `regimen:"spar"` without pairing anybody, so `repairSpar` turned
every week into post work and nothing was ever at risk. And `train` first read 1.002 because four men
starting at 66 had capped out in both arms. **Check the ceiling before believing a flat result, and check
which line reads the field before believing a dead one.**

**AND THERE ARE TWO `blood`s.** The doctrine (The Red School, purse 1.18) and the stakes (first blood).
Priced on one bout each at the same seeds, first blood pays 129d against a standard bout's 192d, kills
nobody at all against 6.5%, and leaves a man hurt 1.0% of the time against 17.5%. The audit item was
about the school; the name is a trap and `school` names it now.

The audit list from v2.93.0 is closed. Fifty-seven checks.

### v2.99.0 — The classes are not 1.8x apart, and the odds panel could not see a stat

Item 7 of the v2.93.0 audit was a 1.8x spread in wins per man-week — Dimachaerus 0.167 and Thraex 0.160
against Murmillo 0.094 and Hoplomachus 0.113. That figure is not normalised by bouts fought, so it mixes
who gets picked for a card, who comes back fit enough to be picked again, and who wins the bout he is in.
Only the last is a balance claim.

**THE MATCHUP TABLE IS EXACTLY NEUTRAL, BY CONSTRUCTION.** `COUNTERS` is a six-cycle and `CLS_EDGE` pays
1.15 for the counter and 0.91 against it, so over a uniform mix every class meets one it counters and one
that counters it: the mean edge is **1.010 for all six**, and with one identical kit `winChance` gives
every class the same row average to the second decimal — **spread 0.00 points.** In their own default
kits the priced spread is 4.67 points and the fought spread 7.8 points at 3.0 SE over 360 bouts a class,
with five of the six inside 4 points of each other. **The item is refuted as a class fault.**

**AND THREE OF THE MEASUREMENTS ALONG THE WAY WERE MINE RATHER THAN THE GAME'S.**

`kitFor(cls, tier)` is a random draw by design: it swaps the weapon 40% of the time for anything suitable
under the tier's price cap, upgrades to a fine piece at 40%/30%, drops the helm and armour at tier 0 — and
`pugio` carries `styles:[]`, so a dagger suits everybody and a Retiarius came out holding a Fine Pugio
instead of his trident. It is not monotone in tier either: one Hoplomachus draw was 96d and shield-less at
tier 2 against 130d with a clipeus at tier 1. So a class comparison built on `kitFor` randomises the thing
being compared, which is why the priced ranking (Hoplomachus best, 47.6%) and the fought ranking
(Hoplomachus worst, 37.9%) had nothing to do with each other.

`newGameState` reseeds the global RNG, so a helper that built a fighter AFTER the arena had been seeded
made all forty iterations the same bout. It showed as win rates of exactly 100.0%, 0.0%, 83.3% and 33.3%
over 240 bouts — sixths, which is six outcomes repeated forty times.

And **"Retiarius has a dead key stat" was measured with the one function that cannot see it.** `power`
weights str 3.55 · tec 4.44 · agi 3.02 · end 2.20 · dis 1.07 and **sho 0.00** per ten points, so priced
through `power` the Retiarius key pair (agi+sho) came out worth +41 at birth against +49 to +53 for every
other class. That is the instrument, not the man.

**THE REAL FINDING IS THE QUOTE.** Showmanship is not a dead stat. It enters the exchange at
`1 + crowd/100 * sho/100 * 0.16` — a few per cent of damage, compounding across twelve rounds the way a
power edge does — and the note above that line says its "real payment is the purse, the crowd and the
raised finger, not the exchange". Measured on the same man twice with nothing but `sho` moved, 250 bouts a
point against a uniform mix of the six classes:

| sho | 40 | 58 | 76 | 94 | |
|---|---|---|---|---|---|
| Retiarius, fought | 31.2% | 34.0% | 39.6% | 47.6% | **+16.4 points** |
| Murmillo, fought | 36.0% | 39.2% | 44.8% | 51.2% | **+15.2 points** |
| the power edge that implies | — | 1.03% | 2.99% | 5.72% | (Murmillo: 1.10 / 2.98 / 5.11) |
| **what the panel quoted** | 38.9% | 38.9% | 38.9% | 38.9% | **it moved 0.00** |

Two unrelated classes, monotone, and the implied edge agreeing to a tenth of a point at every step, so it
is the engine rather than the sample. `power` cannot take the term — the exchange calls `power` too and
would pay for it twice — so it goes in `winChance` beside the board, for exactly the reason the board is
there. The coefficient is the engine's own 0.16 times the crowd a bout averages over its rounds, which
fits at 0.54: exact at sho 76 (1.44 against a measured 1.443 and 1.446) and understating the ends by
about 8% of the odds ratio, which is the safer direction since the quote already runs about four points
rich. The panel now reads 32.1 / 36.3 / 40.7 / 45.1 across that range, and the term cancels exactly in a
mirror so the 46% instrument everything else is calibrated against is untouched. No gameplay number
changed: the same 250-bout curves came back identical after the fix.

**AND `probe` CAUGHT THE FIRST DRAFT OF THE NEW CHECK.** `styles` answered the crux once and dropped any
bout that came back to the balance — the exact fault #116 shipped that lint for, in a check written after
it. Routed through `__ROPE.run` the six fought rates came back identical, which says the one-shot guard
was dropping only bouts still held after four words, but the lint was right to fail it and the scratch
probes behind this release were re-run through the rope to confirm the curve.

`power`, `COUNTERS` and `CLS_EDGE` go on the handle. New check `styles` holds the cycle, the identical-kit
identity and the default-kit closeness; `odds` gains the showmanship section. Fifty-seven checks.

### v2.98.0 — Five dark subsystems, and the two nobody could have reached

Item 6 of the v2.93.0 audit was "five subsystems never went non-null on the reference player": `loan`,
`court`, `munusCard`, `household`, `ear`. Following v2.97.0's lesson, the first move was to read the
check that owns each area rather than measure anything.

**THREE OF THE FIVE ARE ALREADY OWNED, AND ARE DARK ONLY BECAUSE HE DOES NOT DO THEM.** `loan` — `houses`
documents the gate as `warm>=34 && poor` where `poor` is `gold<200`, and fires it 9 times in 12 on a broke
house; the reference player is solvent, so he never borrows. `court` — `wall` drives the whole arc to a
man coming over, and `glance` asserts the nudge that points at it. `ear` — `actions` drives `setEarTo`,
`wall` drives the courting side. Nothing to fix; the sweep was reporting a policy, not a game.

**`munusCard` HAD NO CHECK, AND THE CARD IS CORRECT IN ALL TWELVE COMBINATIONS.** `near` holds the four
reasons the panel refuses a munus and `feats` stages three of them to earn `munera`; neither ever looked
at `d.games` afterwards. Measured across every scale and both stakes: the bill goes up the same week,
`mine` and `fest` are set, the headliner is pinned to the marquee bout, the hunt is forced, purses carry
the 0.6 of a card you paid for yourself, the cost matches `munusCost` to the denarius, selling pays
`munusSellFee` exactly and puts no card up, and the card comes down at `endWeek`. One thing was wrong.

**A PAIR BOUT COULD NEVER BE SINE MISSIONE, IN ANY BOUT IN THE GAME.** `add()` reads `F.allSine`;
`addPair` hardcoded `"standard"`, and so did the coastal pair at Neapolis. So `simulatePair`'s entire
sine branch — its intro line, a death where a standard bout puts the question to the editor, the kin and
the unrest tax at 7 against 4 — was unreachable. It surfaced as something smaller: commission your own
munus **sine missione**, pay the 15% surcharge for it, and **17 of 24 modest cards** put a standard pair
on your own bill. Driven 18 times before the fix shipped: no throw, 4 of 36 men dead, every one of them in
the fallen, none left standing at zero health. `addPair` honours the forced case now, and only the forced
case — an editor's card does not roll a sine pair, because two of your men in a death match is a different
bout from one and it stays the player's own decision.

**`household` WAS DARK BY CONSTRUCTION: NOT ONE OF ITS NINE FUNCTIONS WAS ON THE TEST HANDLE.** Four
hires, a skill roll, a wage that scales with the roster, an upkeep line and a branch where they walk out
of a failing house — and `hireFolk`, `householdWeek`, `householdCount`, `houseFolk`, `hasFolk`, `hhWage`,
`hhUpkeep`, `HOUSEHOLD`, `HH_KEYS` were all internal. "Never fired in 5,000 house-weeks" was a fact about
the handle. Driven for the first time, 20 weeks each with nothing else moving:

| | what she does | measured | costs |
|---|---|---|---|
| Cook | fatigue off the yard | 141 points | 112d down, 7d a week |
| Nurse | weeks off the mending | 3 weeks | 144d down, 9d a week |
| Housekeeper | unrest in the cells | −13.5 | 112d down, 7d a week |
| The lanista's wife | his own life | +6.9 | free |

All correct. The wage tracks the roster as advertised (6d at one man, 8d at five, 13d at fourteen), it is
on `weeklyBill`, and three of the four walk out of a house held at unrest 90 while the wife stays. So it
is the doctrine of v2.93.0 one layer down: a system that works and is never found. `agendaFolk` mentions
it once, and goes quiet once the house is staffed.

**AND THE SOURCE'S OWN WORD "CHEAP" WAS WRONG, WHICH IS CORRECTED OFF A MEASUREMENT.** The note over
`HOUSEHOLD` called these hires "all cheap, and all strictly good — a checkbox you tick once in year one".
Three of them cost 22 denarii a week against a **new** house's entire weekly bill of 30 — a 73% rise in
the standing cost of a ludus one bad card from the creditors. Against a made house's bill of 200 it is
what the note says. So it is dear early and cheap late, which makes it a decision after all, and the
nudge waits a full year and twelve weeks of the bill before it mentions them.

**THE FAMILY BELONGED TO ONE MAN.** `d.domus` sits on the state rather than the lanista and `succeed` left
it alone on purpose — "so the blood of the house survives a succession". Driven, that produced the
opposite: **8 of 8** houses handed the new lanista his predecessor's widow in the wife slot, and
`marryReady` needs that slot empty, so **0 of 8** could ever marry. A doctore who took the house inherited
the dead man's wife; a son of twenty-one inherited his mother and three children older than himself. The
match, a birth, `raising`, `toga`, `daughter` and the scion heir that comes out of them belonged to the
first lanista and to nobody after him. The family goes to the forebear record now, where the annals panel
shows it, and the new man starts his own — the same eight successions read 8 of 8 able to marry.

**AND ONE CORRECTION TO v2.95.0: WIVES DO NOT DIE.** That release moved the child loop out of the wife
branch and the note said "wives die". The only write to `d.domus.wife` in the program is `resolveMatch`
setting her. `domus` keeps the widowed arm anyway and now says why — reachable by construction, not
measured in play.

**AND ONE CORRECTION TO `policy`, WHICH IS MINE AND IS THE MOST USEFUL THING HERE.** Adding one household
hire around week twenty took the check under its own bars twice running: median life 106, then 60, against
a bar of 70. A 112-denarius hire cannot do that; consuming two extra rolls of the RNG and reshuffling every
draw after it can. So the distribution behind the bar was measured instead of the bar being nudged — 48
houses of the reference player on the check's own seeds, at 320 weeks:

| | |
|---|---|
| dead before week 100 | **18 of 48 (38%)** |
| alive at the 320-week wall | 14 of 48 |
| life | p10 27 · median 170 · p90 321 |
| the median of a block of eight | **54 · 60 · 99 · 121 · 311 · 321** |
| the best house in the same blocks | 291 · 321 · 321 · 321 · 321 · 321 |

The median of eight draws spans 54 to 321 and would fail the old life bar in 2 blocks of 6 and the old
fame bar in 3 of 6 — **one run in three, with no change to the game at all.** The shape is why: 38% of
even well-played houses die in the opening and 29% are still standing at the wall, so there is no stable
middle for a median to sit in. The claim was never about the middle anyway — it is *a house played well
can still get somewhere* — so `policy` asserts on the best house in the run, which spans 291 to 321 weeks
and 6,808 to 17,487 fame across the same six blocks, at bars of 150 and 2,000. The event tally rides on
the same reshuffle (42 kinds on one build, 34 on the next, same seeds) and its bar drops to 22.

Two new checks: `folk` for the household, `munus` for your own games. `domus` gains the succession
section. Fifty-six checks.

### v2.97.0 — Two audit items withdrawn, one as a duplicate and one as refuted

Two of the ten items from the v2.93.0 audit come off the list without a fix, and both withdrawals are
worth recording because they are failures of the audit rather than findings about the game.

**ITEM 5, "six feats never earned", WAS A DUPLICATE OF WORK THE SUITE ALREADY HELD.** The v2.93.0 sweep
reported `threefree`, `cloth`, `forge`, `circuit`, `munera` and `rome` unearned. Reading their tests, five
are things the reference player does not do — free three men, throw the cloth, forge a piece, tour every
coastal town, hold games for three of your own dead. And the `feats` check already says so on its face,
from v2.53.0: *"The obvious reading was that they are out of reach. They are not. The same eight seeds
under a policy that deliberately went after all five earned every one of the nineteen, four inside the
first fifty weeks."* Its `describe` is literally "all nineteen are reachable, and the sheet says how
close". I listed as new an item the suite had closed long ago, because I read a sweep's output instead of
the check that owns the area. **Before adding an audit item about coverage, read the check whose subject
it is.**

**ITEM 9, "Rome demands a mean-92 man and never says so", IS REFUTED — it says so plainly.** The single
bout panel prints the bookmakers' price off `winChance` at line 23932. Measured, for a house standing on
the imperial sand:

| the house brings | its best man | the bill's man | quoted | what the panel prints |
|---|---|---|---|---|
| five men off the block | 72.8 | 98.6 | 2.5% | **"35.20 to 1 on him"** |
| the same, +22 a stat | 79.8 | 98.6 | 2.5% | "35.20 to 1 on him" |
| a best man at mean 92 | 92 | 97.8 | 9.2% | "9.60 to 1 on him" |
| a best man at the ceiling | 99 | 98 | 13.3% | "6.60 to 1 on him" |

Thirty-five to one is not a game withholding information. The item is withdrawn.

**AND THE LAST ROW IS THE USEFUL PART.** A man at mean 99 against the bill's mean 98 quotes **13.3%**, not
the ~46% that v2.90.0 measured for a MIRROR at the same venue. The difference is everything that is not a
stat: that man came off the block, so he carries a block man's fame, morale and kit against an imperial
man at pfame ~91. It is exactly #121's decomposition — fame worth +11.6 points of win rate through
`mobHis`, morale +10 to +12 — and it means **six stats at the ceiling are not an imperial contender.** The
quote is telling the truth about that, and the truth is harsher than the stat line looks.

`oddsFor` and `oddsWord` go on the handle, since the bookmakers' line is how the game actually tells a
player what he is walking into and no check could read it.

### v2.96.0 — Three answers, and two of them correct something I had already written down

No game code changed. Three measurements: one closes a suspected regression, one revives an ending this
project retired two releases ago, and one refutes a fault I had suspected in my own reference player.

**1. `survive` DID NOT DRIFT, AND MY "RATE HAS DOUBLED" READING WAS SELECTION BIAS I CREATED.** After the
v2.95.0 suite failed at (1 standing, 1 man) I pooled every run across v2.89–v2.95 and got **4 failures in
20**, against the 1-in-12 measured earlier, and wrote it up as a possible drift in the opening. The pool
was enriched for failures **because I only ever re-ran after a failure** — every extra run in it was
conditioned on a failure having just happened. Twelve controlled runs on v2.95.0, machine to itself:

| | | | | | | | | | | | | median |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| standing | 3 | 5 | 4 | 4 | 2 | 3 | 3 | 1 | 2 | 4 | 3 | **3** |
| men | 8 | 8 | 6 | 9 | 8 | 4 | 3 | 10 | 2 | 6 | 9 | **8** |

**Zero failures.** Pooled with the twelve at `96ebc0c` (one failure) that is **1 in 24 controlled runs,
about 4%** — consistent with the original figure. The bar is untouched for a fourth time, now on twice
the evidence. The rule written into the check: **never pool opportunistic re-runs with scheduled ones.**

**2. `oldAge` IS REACHABLE, AND v2.89.0's CONCLUSION WAS A PROBE ARTEFACT.** That release recorded the
ending as retired rather than fixed, on 907 lanista-weeks at 62 or over with health at 45 or better in
**none** of them — "written for a man the game does not produce". Two defects in the probe produced that,
and the reference player now fixes both: it never built the **baths** (`lanistaWeek` mends the lanista by
`bLevel(d,"balneae") * 0.09` a week, and the old build order named five rooms that do not exist), and it
never **named an heir**, which `oldAge` requires. Paired on 12 seeds of 900 weeks:

| | heir named | heir not named |
|---|---|---|
| median life | **297w** | 104w |
| `lanistaDied` | **0 of 12** | 4 of 12 |
| `oldAge` | **4 of 12** | 0 of 12 |
| reached generation 2 | 1 of 12 | 0 of 12 |

`lanistaWeek` at `L.health <= 0` writes `d.succession` if an heir is named and ends the run
`lanistaDied` if not — that one field is the whole difference, and it nearly triples the life of a house.
Both `ends` and `policy` are corrected; `policy` now fails if the naming stops working.

**And the two endings compete**, which is why a second generation is still 1 in 12 even with an heir: the
healthy old lanista **retires** (`oldAge`, the run ends) rather than dying (`succession`, the house goes
on). Recorded, not changed — it reads as the intent.

**3. THE CELL-WALK ORDER IS NOT A DEFECT, and I had convinced myself it was.** `walkReady` allows a walk
every three weeks at no coin cost, and the reference player took only 55 in 961 available weeks — because
it feasts at unrest 30 first and the feast drops unrest below the walk's threshold. Paired on 14 seeds,
walk-first (walking from unrest 14) against feast-first:

    walks 134 against 55 · feasts 182 against 281 · median life 159w against 318w

...and **paired, walk-first was outlived 6 times and outlived 4** — no difference at this n. The medians
over independent houses are misleading exactly as #120 warned, and the sign test is the statistic. So
nothing is changed. What the numbers DO show is the mechanism: walking eagerly holds unrest just under the
feast's trigger, so the cheap tool crowds out the strong one. The low walk count is correct behaviour.

### v2.95.0 — A widower's children stopped growing up

Item three off the v2.93.0 audit: the nine events that never fire. Chasing them found a real fault, and
three plausible explanations died on the way.

**THE NINE ARE THREE DIFFERENT THINGS**, read rather than guessed. Six — `raising`, `toga`, `daughter`,
`licence`, `courted`, `freedman` — carry `make(){ return null; }` and can never be surfaced by
`pickEvent`; they are raised directly by the system that owns them. Two — `owedBack`, `sagaFreedom` —
have `build` and no `make`, so only `fireArc` raises them weeks after a choice plants the beat. Three —
`mentor`, `owedLife`, `poached` — roll properly and their gates simply never opened. And `primacy` is not
an EVENTS key at all; the sweep listed it from a different table, and that one is **withdrawn**.

**THE FAULT: one early return made the whole family arc contingent on the wife being alive.**
`familyWeek` began `if(!dmm.wife){ …match…; return; }`, and the child loop is at the BOTTOM of the
function. So a lanista who was widowed stopped raising his children. Hand-built and measured:

| | wife alive | widowed |
|---|---|---|
| a son of sixteen | **`toga`** | **nothing** |
| a daughter of seventeen | **`daughter`** | **nothing** |

Behind that gate sat four events — `raising` at a child's seventh and twelfth year, `toga`, `daughter` —
plus `resolveRaise`, `resolveToga`, `resolveDaughter`, and the heir traits a boy's upbringing decides.
The child loop moves out of the wife branch. The household's warmth and bearing a child stay
wife-dependent, because those need her; a boy who is seven is seven either way.

**THREE EXPLANATIONS MEASURED AND KILLED FIRST**, and each looked convincing:

1. **The clock.** `YEAR_WEEKS = 18`, so `raising` wants 126 weeks after the birth, stage two 216,
   `daughter` 270 and `toga` 288 — on top of marrying (10% a week once fame 60) and conceiving (6% a
   week). Against a median house life of 226 weeks that looked decisive. It is not: one house in
   fourteen lived **561 weeks** with a child born at week 29 who reached **age 29**, past every gate,
   and saw nothing.
2. **Child mortality.** There is none. `c.dead` is read in three places and never written for a child.
3. **The queue.** `familyWeek` yields to any question already up and sits fifth in `endWeek` behind
   `updateRebellion`, `heldQuestions`, `freedWeek` and `kinWeek`. Measured at **54.4% of weeks blocked**
   across 10 houses — real, and not the answer, because 45% of weeks were clear.

Only 5 of 14 houses ever have a child at all (median week 32, having married at median week 25), so the
arc is thin even now — that is a separate question and it is written down as one.

**A new 54th check, `domus`,** holds every gate at every age, with a wife and without, plus the
"already dealt with" cases and the clock arithmetic. `familyWeek`, `childAge`, `livingKids` and
`marryReady` go on the handle — none of them were there, which is why no check could see any of this.

### v2.94.0 — The reference player moves into the harness, with a bar under him

Item two off the v2.93.0 audit. No game code changed; this is the instrument the last twenty releases
kept getting wrong.

**EVERY REACHABILITY CLAIM THIS AUDIT HAS PUBLISHED WAS A CLAIM ABOUT A POLICY.** Each check that needed
a house to get somewhere wrote its own player, and in v2.93.0 three attempts at a competent one produced
median lives of **108, 27 and 157 weeks on the same build** — the first reporting thirteen events and
fourteen subsystems dark, almost none of which was the game.

So the policy now lives in `test/harness.mjs` as **`__ROPE.lanista(d, opts)`** — one canonical competent
week — and **`__ROPE.play(d, weeks, opts)`**. It works the cells, trains, buys the best man it can afford
behind **twelve weeks of the weekly bill** (a flat reserve is not a reserve; the bill grows with the
roster), hires the doctore, builds the five rooms, hires the medicus and armourer, keeps the rites,
declares a school, claims the census, takes the primacy when it is up, accepts Rome, and at Rome takes
**whatever card is there** — the imperial bill is sine missione 54% of the time and refusing it lapses the
trip. Every part switches off through `opts` for a control arm, and it **returns what it did**, so a check
asserts on behaviour rather than intent.

**AND A NEW 53rd CHECK, `policy`, PUTS A BAR UNDER HIM.** `survive` asks whether a new house can get off
the ground; nothing asked whether a house played *well* still gets anywhere. Measured at 8 houses × 320
weeks, headless, in 3 seconds:

| | measured | bar |
|---|---|---|
| median life | **226w** | 70w |
| median fame | **2,981** | 300 |
| events fired | **45 of 57** | 30 |
| rooms held by the best house | **5 of 5** | 3 |
| houses claiming a census rung | **7 of 8** (up to rung 4) | at least one |
| a school declared | **every surviving house** | at least one |

Three of the eight houses reach week 321 still standing, at fame 3,813 to 8,333, with all five rooms, the
census claimed and three imperial campaigns. The bars sit near half of each measurement on purpose: this
suite has now paid three times for a threshold fitted close to its sample, and the point of these is to
catch a build where the reference player *collapses*, not to police ordinary variance. The event tally,
the subsystem census and the ending mix are printed and asserted on nothing — they are the audit's raw
material, not a contract.

**The reference player also exercises v2.93.0's doctrine**, so `doctrine` is a live subsystem in the
census now rather than a dark one, and `policy` fails if `declareDoctrine` ever stops taking.

### v2.93.0 — Six schools of the house, every one of them live, and no house had ever declared one

A fresh audit sweep, the first item off it built, and four instrument faults of mine on the way.

**A COMPETENT POLICY TOOK THREE ATTEMPTS TO WRITE, and that is a finding about this audit.** Asked for
ten new items, the first sweep reported 13 events, 9 feats and 14 subsystems dark — then its own header
line read median life **108 weeks**, 6 of 16 houses in `ruin`, median fame 974. A house dead at week 108
cannot reach Rome, cannot afford a building and will never see a second generation, so almost every
"never" was the probe declining to act. Four things were wrong with it: no `wantStakes` (so a
purse-maximising pick steered into *sine missione* cards), it bought the CHEAPEST man every time, it never
spent on anything, and it never chased the primacy. Version two overcorrected — a flat 400d reserve behind
the priciest affordable man — and died at **week 27** with 7 of 16 in debt. Version three, with the reserve
scaled to twelve weeks of the bill, reaches **median 157 weeks, fame 1286, 48 of 57 events, all five rooms
at level 4, the census to rung 7 and 22 imperial campaigns.**

| sweep | median life | median fame | events firing | buildings |
|---|---|---|---|---|
| passive | 108w | 974 | 44 of 57 | none built |
| reckless | 27w | 90 | 43 of 57 | all five |
| a lanista | **157w** | **1286** | **48 of 57** | all five at level 4 |

**AND THE ITEM IT FOUND: `DOCTRINES`.** Six schools of the house — The Heavy Shield, The Small Shield, The
Red School, The Long Apprenticeship, The Open Hand, The Travelling School — each with a price of 300 to
500 denarii, a creed, faction moves, and a table of multipliers that the fight engine and the week read
through `docNum` and `docIs`: training rates, purses, the odds of sine missione, unrest, injuries, missio,
regard, fame, and how fast local standing builds down the bay.

**`d.doctrine` was non-null in 0 of roughly 5,000 measured house-weeks** — across all three sweeps,
including the one that hired the doctore, built every room to level 4, hired the medicus and the armourer,
swore 249 vows, claimed the census to rung 7 and went to Rome twenty-two times. Nothing in the game
pointed at it, so a competent player never found it.

**The system is sound, which had to be proved BEFORE pointing anyone at it** — a signpost to a broken
feature is worse than no signpost. All six declare, all six charge their listed price, changing costs the
new school's price × 1.8, every numeric field reads back through `docNum` exactly, `docIs` answers on the
key, and every faction moves the way its table says. So the fix is a nudge, not a repair:
`agendaSchool` raises it once past week 12 and once the house can pay for one without eating its reserve
— never in the opening, and never to a house that cannot afford the cheapest.

**A new 52nd check, `school`,** holds all of that, and derives its field list from each doctrine's own
entry rather than a list in the check.

**FOUR INSTRUMENT FAULTS, and the last one corrects a standing misconception.**

1. **`docIs` compares the KEY, not the tag.** I tested `docIs(d, D.tag)` and got false for scutum, parma
   and road — while blood, craft and mercy passed because their key happens to equal their tag. Three
   passes and three "failures" out of one wrong field.
2. **A hardcoded field list reported "The Travelling School names no multipliers."** It names four —
   `knownMult`, `strangeCut`, `travelCut`, `capuaDecay` — none of which were in my list.
3. **`balneae` and `carceres` "never built"** was five invented room names in my own build order.
   `BUILDINGS` has exactly five keys and I had guessed at Latin.
4. **`agendaCan` IS NOT THE AGENDA.** It is one of four contributors — `agendaCan`, `agendaSquare`,
   `agendaSchool`, `agendaGods` — and `agenda(d)` is the aggregator the panel renders. The check drove
   `agendaCan`, saw no school item, and reported the nudge missing after it had shipped. Worth knowing
   for **#119**, which measured the feast's offer through `agendaCan` alone.

**AND ONE REFUTATION WORTH MORE THAN A FINDING.** The sweep showed 26 imperial campaigns and **62 bouts
with none won**, which would have overturned v2.90.0's "the summit is fair and reachable". It does not: the
probe's men were mean stat **65–80** against a bill of **94.7**, and the game's own quote for its best man
going forward was **3.2%**. At that rate, nought wins in 62 has a 13% chance — luck, not a fault. `d.mark`
"never set" was the same kind of artefact: it is a within-week scratch ledger that `afterWeek` moves to
`d.after` and nulls, so reading it after `endWeek` always shows null.

**Nine remaining items are recorded and not built,** ranked, in the audit list: the eight other sweep
findings plus the per-bout measurement `blood` needs. `blood` promises purses ×1.18 and produced 374d a
bout against 530d with no school — not an inversion but a confound, since it also adds 0.16 to the odds of
sine missione, so the house fights deadlier cards and earns less at a lower tier. Pricing it properly
needs one identical bout fought with and without.

### v2.92.0 — A sold man was never gone, and `closed` fires after all

Two corrections and one live fault, all from one question I should have asked a release earlier: can you
not simply sell a gladiator?

**YOU CAN, AND MY "SECOND BLOCKER" DID NOT EXIST.** v2.91.0 recorded that `closed` was still unreachable
in practice because 13 of 23 men in six real yards "could be let go by no means the game offers" — I had
checked `rudisEligible` and `retireEligible`, found both narrow, and stopped looking. `sellMan`, reached
from the roster as **"Sell Him On"**, takes any man who is not damnatus and deletes him from the roster
outright. The release action I put up as a design decision has been in the game the whole time.

**AND `closed` IS NOW DEMONSTRATED IN PLAY, not merely un-blocked.** Played the act the ending's own text
describes — free every man who earns the rudis, then sell whoever is left — **it fired in 1 of 12 houses,
at week 283, on five freed against thirty-one buried, having sold three men off from week 277.** Together
with v2.91.0 dropping the unsatisfiable `freed > lost`, the mercy ending works end to end.

**THE LIVE FAULT: "sold" WAS MISSING FROM `GONE`.** A man leaves a house six ways and only five were in
the list. It never showed for `sellMan`, which deletes the row — but `sellTheHouse`, the liquidation, sets
`m.status = "sold"` and leaves the row in place exactly as death and retirement do. So those men were
`!isGone` for ever. Measured on a seven-man house stripped to the walls: roster 7, **active 1**, weekly
bill correctly down to 10d — and **`onTheBooks` still reading 7**.

That number gates exactly two things, and a house that has just sold everything it owns to stay alive is
precisely the house that needs both:

| gate | condition | what a stripped house lost |
|---|---|---|
| `slaverAtTheGate` | `idleYard >= 3 && onTheBooks(d) === 0` | the game's own way BACK from an empty yard |
| the `emptied` ending | `idleYard >= EMPTY_LIMIT && onTheBooks(d) === 0` | the way OUT — it could not even finish |

So the one house in twenty that takes itself apart could neither recover nor end. `"sold"` added to
`GONE`; `onTheBooks` now reads 1 where it read 7. `activeG` reads `status === "active"` and is untouched,
and the wage bill was already correct — this was the "has he left?" predicate alone.

`stall` is the only check that strips a house, so the tripwire lives there: after `sellTheHouse`, active
and on-the-books must agree, and it fails loudly if `"sold"` drops out of `GONE` again.

**Also on the handle:** `GONE`, `isGone` and `onTheBooks`. All three were dark, which is why nobody
noticed that a predicate deciding whether a man has left the house was missing one of the six ways out.

**AND `survive` DREW ITS WORST HAND YET IN THIS RELEASE'S SUITE — 50 of 51.** It failed at **(1 standing,
1 man)**, below anything in the twelve-run distribution measured a release earlier. Before blaming luck the
change was proved inert: v2.92.0's only game edit is `"sold"` added to `GONE`, and the whole file has
**exactly one producer of `status === "sold"`** (`sellTheHouse`), which this check never calls — so
`isGone` returns the same answer for every man it will ever see. Re-run three times on the same build:
(3, 8) pass, (5, 6) pass. That puts the tally at **2 failures in 15 runs, about one in eight**.

The bar was not touched for a third time, and the diagnosis is now sharper than "it is noisy": (1, 1) is
not a threshold being too strict — five houses holding one man between them IS a gutted opening on any
reading. The check is describing its sample correctly, and the SAMPLE is what is too small. The cure is
more houses, which is the one thing this check cannot cheaply buy: `HOUSES` is already five browsers, and
its own notes record that seven Chromiums on four cores started missing clicks and cost two false failures
of a different kind. A failure here is worth exactly one re-run before it is worth investigating.

### v2.91.0 — The mercy ending's second clause could not be satisfied, and Rome stops taking two things silently

Three recommendations from v2.90.0, carried out. Two of the three turned out to need measuring before
implementing, and one of them changed shape entirely once measured.

**THE `closed` GATE HAD TWO CLAUSES IN DIRECT OPPOSITION.** `closed` fired on `!alive && freed >= 5 &&
freed > lost`, under a source comment saying "the game says mercy is the strongest long game; it should
be able to end that way". My earlier figures for it — frees ~2.6, buries 68 to 154 — came from the
standard audit policy, which fights `standard` stakes and **never frees anybody**. Measuring a mercy gate
with a butcher's policy is the same fault as measuring the rebellion with a probe that never touched the
cells, and it is on the list of things this project keeps doing.

Re-measured with the policy the gate is written for — fight properly, and free every man the moment he
earns the rudis instead of working him to death — 20 houses of 600 weeks:

| | result |
|---|---|
| `freed >= 5` | **2 of 20 houses**, at a median week **359** |
| `freed > lost` | **0 of 20**, and it cannot be |
| the only two qualifying houses | freed 7 of 69 buried (**10%**) · freed 5 of 30 (**17%**) |

The clauses are opposed by construction: the rudis wants `wins >= 10 && pfame >= 180`, so a free-able man
has fought a great deal, and a house that fights that much buries a median of 28. **`freed > lost` asks
for a mercy share of 100% when the best real play produces is about a sixth.**

**`freed > lost` is removed and no ratio replaces it.** Anything between `freed*5 > lost` (admits neither
qualifying house) and `freed*10 > lost` (admits both, one of them by a single man) would be a threshold
fitted to two data points — which is exactly how `survive` came to carry `MEN = 6` and fail one healthy
run in four. The count is already the mercy test: five men who each reached ten wins and a name in the
town, and who walked out instead of being kept. `ends` now holds the gate on a hand-built ledger — five
freed against thirty buried must end `closed`, four must not — so it cannot silently close again.

**AND A SECOND BLOCKER, FOUND WHILE MEASURING AND DELIBERATELY NOT FIXED.** `!alive` needs an emptied
yard, and there are only four ways a man leaves a house: dead, freed (needs the rudis), retired (needs age
31 or a heavy burden of scars), or departed at the end of an auctor contract. Counted across six real
yards, 13 of 23 men could be let go by none of them.

**THIS PARAGRAPH IS WRONG AND v2.92.0 CORRECTS IT.** There is a fifth door and I missed it: `sellMan`,
the roster's "Sell Him On", takes any man who is not damnatus and removes him outright. A lanista can
empty his yard whenever he likes, the "feature with balance questions" I wrote up as a design decision
already exists, and `closed` has since been demonstrated firing in play. See v2.92.0.

**ROME TAKES TWO THINGS AND NOW SAYS SO.** Both were measured in v2.90.0 and recorded; neither behaviour
is changed, because both read as the intent. What is changed is that the player is told.

- **The drill does not travel.** `prepFor` returns 0 unless `offer.oppRef.fid` matches the man drilled
  against, and `makeImperialBout` sets `oppRef: null` — so a fighter carrying all six weeks of work has
  `prepEdge` 1.0 and is worth **exactly 0.0** on the imperial sand. The panel that shows the drill hides
  itself when the edge is nought, so the player saw *no line at all* after spending six weeks at
  `PREP_DRAG` 0.62 of the man's own training. The imperial card now carries a panel saying the work does
  not transfer, before he chooses.
- **No word of yours reaches him.** `simulateFight` is called with `stopAtCrux: !offer.imperial`, making
  the imperial bout the only bout in the game that never stops for an order — a crux comes up in 58.0%,
  42.7% and 43.3% of ordinary cards by grade and **0.0%** of imperial ones. A second intro beat says so.

**A HARNESS FAULT THAT HAD BEEN QUIETLY MISREPORTING POLICY.** `__ROPE.takeBout`'s `stakes` option was
passed to `makePitOffer` and **nowhere else**, so a probe asking for `blood` got first blood only while
the house was too poor for the arena bill, and whatever the bill happened to offer for the rest of its
life. The first mercy measurement was built on it and read 1,739 blood bouts against 835 standard without
complaining. `wantStakes` now filters the bill as well, and the result reports the stakes **actually
fought** plus a `gotWanted` flag, so a caller can assert on what happened rather than on what it asked
for. `stakes` is left alone so no existing check changes meaning.

**Two more instrument faults of mine, both in the same measurement.** The mercy probe counted frees by
reading `houseRecord().freed` before and after `grantRudis` — but that tally comes off closed annals and
`annalsSync` does not run until `endWeek`, so it read 0 every time however many men actually walked out.
Read the man (`g.status === "freed"`), not the ledger. And its first hybrid arm answered every crux with
`"cloth"`, which **spends the purse you just won** — that is not a mercy policy, it is a policy of giving
away every win, and it died at week 48 of debt in 10 of 14 houses with nobody alive long enough to earn a
rudis. The cloth spares the *other* house's man and has nothing to do with the gate being measured.

**AND `survive`'S DISTRIBUTION, THE JOB ITS OWN NOTE ASKED FOR.** That check has carried a written-down
task since v2.76.0: "what is needed is the actual distribution of (houses standing, men) over ten or more
runs of an unchanged build, and then a threshold set against it." Twelve runs back to back on 96ebc0c,
with the machine to itself:

| | | | | | | | | | | | | median |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| standing | 1 | 2 | 2 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 4 · 5 | **3** |
| men | 4 | 3 | 5 | 4 | 6 | 6 | 6 | 6 | 6 | 6 | 11 · 6 | **6** |

**One failure in twelve** — the run at 1 standing with 4 men — and **two in forty-seven** pooled with the
35 counted in task #50. So the standing claim that both-weak-together "trips on luck at something like one
run in four" is **retracted**: it came from four samples, which is the same fault this project has now made
three times with three different constants.

**The bar was still not moved, deliberately.** Twelve runs put a 95% interval on 1-in-12 of roughly 1.5% to
35% — enough to rule out one-in-four, nowhere near enough to place a new threshold. The obvious tightening
(`BOTH_MEN` 5 → 4) would have passed the one failing run at no visible cost, and that is precisely the
objection: a constant fitted to a single event is `MEN = 6` again with the sign reversed. What is on record
now is the sample, so the next person inherits evidence instead of an argument.

### v2.90.0 — The odds panel was recommending the worst order, and the imperial sand was never unwinnable

#121. One real fault in the game, seven in my own instruments, and the answer to the last measurable
question on the list. `board`'s defensive multiple is the only game constant changed.

**THE ARENA PANEL WAS RECOMMENDING THE WORST OF THE FOUR ORDERS.** The panel quotes the player his
chance and recomputes it from whichever tactic chip is selected, so those four numbers are a
recommendation whether or not they mean to be. `winChance` prices the order twice: once through
`TACTIC_OR` (aggressive 1.18, defensive 1.05 — correctly ordered) and again through `board`, which gave
a shield man **0.44 of his cover for standing off against the 0.13 every other order gets**. For a man
with cover 1.00 that is 1.440 against 1.130 — a ratio of **1.274**, against `TACTIC_OR`'s 1.18/1.05 =
**1.124**. The second term swamped the first, so the panel put **standing off at the top for every class
that carries a board** — Murmillo 1.00, Secutor 1.00, Hoplomachus 0.75, Thraex 0.40 — four of six. The
game's own reference table, measured off 2,700 bouts, has going forward the best word by **5.2 points
over standing off**. A player reading his own odds and picking the best number was picking to lose.

**0.44 → 0.22.** The quote can still see a board and standing off still prices above patience, which is
what the sand says too; it no longer outruns the order. Measured and left alone: the quote runs about
four points rich across all four words, and even fixed it understates the forward-against-standing-off
gap by roughly half. The ordering is what a player acts on, and the ordering is now right.

**WHAT IS ACTUALLY ACROSS THE IMPERIAL SAND, at last.** The standing claim was 0 of 18 imperial bouts
won. `makeImperialBout` draws `genOpponent(3, ri(floor, floor+3))` with `floor = min(104, 100 + romeRuns)`,
then adds `ri(1,4)` again to the class keys. Over 200 draws a campaign:

| | mean stat | class keys | stats pinned at 99 | heart | to the death |
|---|---|---|---|---|---|
| first campaign | **96.8** (93.4–99.0) | 98.5 | 3.4 of 6 | 83.6 | 54.0% |
| fourth campaign | **98.6** (96.7–99.0) | 99.0 | 5.2 of 6 | 83.1 | 49.5% |
| the `matched` hard card | **99.0** | 99.0 | 5.8 of 6 | 83.8 | 53.0% |

The escalation saturates by design — the floor caps at 104 and `qStat` clamps past 99 anyway — so from
the fourth campaign the man is simply at the ceiling and gets no harder.

**And 0 of 18 was my instrument, twice over.** Quality is not a stat: `qStat(92) = 78.6`, so the
"quality 92" men that probe fielded were **eighteen points of mean stat below the man on the bill**, in a
game whose own source says a ten-point edge decides a bout. And every bout it ever ran was fought on
`measured` while the imperial man grades out **aggressive in half of all draws** — worth 10.8 points at
mean 92 and **15.2 at mean 99**, the largest in-bout lever there is, and the one the probe never pulled.

**The summit is fair and it is reachable.** Two men identical in all six stats, class, kit, traits, heart,
morale, record and fame: **45.2%** at the imperial bill over 250 bouts, which is exactly what `FOE_EDGE`
= 1.029 predicts. And a played house's best man, counted over **every man who ever served** — not
`activeG`, which is #118's fault — reaches a **median mean stat of 92.3**, high 95.8, with 6 of 10 houses
fielding a 90 or better. At mean 92 with morale high and fame past his, the imperial bout runs 40–52%.

**What the levers are worth at the summit, decomposed one at a time and paired on the seed:**

| lever | worth |
|---|---|
| the order given (`measured` → `aggressive`) | **+10.8 at mean 92, +15.2 at mean 99** |
| his fame past the other man's (`pfame` 80 → 200) | **+11.6** — via `mobHis`, and the quote never moves for it |
| morale 79 → 95 | **+10 to +12** |
| a plan his habits answer | +2 to +4, available in 108 of 200 draws |
| morale 70 → 79 | +3.4 to +5.3 |
| paying to have him watched | **0** on its own — it buys information, nothing else |
| his career record (`wins` 8 → 14) | **0.0** |
| his heart (60 → 84) | **0.0** — heart is not a win-rate lever in a bout |

**Two things the summit takes away and never mentions.** `prepFor` needs `offer.oppRef.fid` to match the
man drilled against, and `makeImperialBout` sets `oppRef: null` — so a fighter with all six weeks of
drill carries **prepEdge 1.0 and is worth 0.0** at Rome. And `simulateFight` is called with
`stopAtCrux: !offer.imperial`: a crux comes up in **58.0%, 42.7% and 43.3%** of ordinary cards by grade
and **0.0%** of imperial ones, so the imperial bout is the only bout in the game you cannot coach.
Nothing in the source says why either is so. Both are recorded, neither changed — they may well be the
intent, since Rome is meant to give a lanista no say, but the player is told neither.

**SEVEN FAULTS IN MY OWN INSTRUMENTS, and the third one is the expensive one.**

1. **Quality read as a stat.** And the source told me to: the comment in `answerRomeWith` still said the
   imperial bill drew "quality 92 to 99" after the floor was raised to 100–103 under it. Corrected, with
   the mean stat spelled out beside it so the next reader cannot repeat it.
2. **`measured` hardcoded** in every arm of three probes, against a foe who chooses his own word.
3. **`doFight`'s crux return says `crux`, not `unfinished`.** There is no `unfinished` field on it at all
   — that belongs to the `simulate*` layer underneath. Three probes tested `res.unfinished`, read every
   held bout as a finished one with no winner, and **scored a third to two thirds of all bouts as
   losses** — which produced a mirror match at 21% and four rounds of chasing a fault in the engine that
   was never there. `probe` now fails any check that reads `.unfinished` while driving a `do*` engine.
4. **The crux takes a WORD, not an index.** `doFight`'s seventh argument is a key into `CRUX`; I passed
   `0`, which is falsy, so those bouts were resumed with no order at all.
5. **The resume protocol sets `pd.beats` on the pending object**, not `g.beats` on the man.
6. **The first version of the new `odds` check asserted a realised ranking off 150 bouts a cell**, where
   the standard error on a difference of two proportions is 5.8 points and the effect is 3 to 8. It
   flipped between two runs of the same build. A 250-bout version had looked stable and was not — four
   cells of noise agreeing by luck. What the check holds now needs no sampling at all: `winChance` is a
   pure function and the misprice is arithmetic.
7. **`probe`'s new rule flagged itself three times**, each for a different reason and all one reflex — a
   lint that reads source cannot spell what it hunts. Its message named the field (fixed by stripping
   string literals), its exemption was keyed `unfinished` so `ex.unfinished` matched, and its pattern was
   a regex literal, which is code. The needle is assembled at run time now.

**Also:** a new 51st check, `odds`. A duplicate `feastCost` key removed from the test handle — it had
warned on every build since v2.84.0, the same class of thing as the `makeStaffMarket` duplicate v2.81.0
took out. And the whole Rome surface put on the handle (`makeImperialBout`, `romeStanding`, `romeWord`,
`romeSineOdds`, `romePurseMult`, `romeGreeting`, `romePrize`, `ROME_TURNS`), with the two converters
between a quality and a stat (`qStat`, `qForStat`) and `foeTactic`, `kitFor`, `watchHim`, `FOE_EDGE`.
Everything on the handle before this was the ROAD to Rome; none of it was the bout.

### v2.89.0 — The cells step moves to fourth, and the mercy ending's blocker was not the one I named

The first game-behaviour change in fourteen releases, plus a correction to v2.83.0 that came out of
checking my own recommendation before implementing it.

**THE CHARTER PUTS THE CELLS FOURTH NOW, ahead of the four things that cost money.** "Keep the cells
quiet" sat at step nine, behind buying a man, hiring the doctore, arming somebody and paying to have an
opponent watched. Working the cells is the largest single lever measured in this project: paired on one
seed across 110 houses, the arm that feasts over unrest 30 and walks the cells over 22 **outlived its
own twin 70 times to 31**, median **105 weeks against 64**, with **11 of 110 reaching year 22 against
none at all**. Four steps of spending came before the one that keeps the house alive.

It is safe this early because `done` is `everFeast || unrest < 12` and **every one of the five openings
starts at 12 or above** — clean 12, champion 14, veterans 18, inherited 26, castoffs 38 — so the step is
live from week one rather than auto-satisfied, which is the trap the `LESSONS` work already paid for.

**AND A CORRECTION TO v2.83.0, FOUND BY CHECKING MY OWN RECOMMENDATION.** I had proposed dropping
`closed`'s requirement from five men freed to three, on the strength of #118's measurement that the best
man in a 500-week house reached **8 wins** against a rudis bar of ten. Before changing it I re-measured,
and the 8 was **a sampling fault of mine**: it was taken over `activeG(d)`, the men standing in the yard
at the moment of sampling, and a long-career man is precisely the one most likely to have already left
it — freed, sold or buried.

Counted over every man who ever served, 8 houses of 400 weeks: **best career 43 wins, best fame 2,414,
and 21 men clear `wins >= 10 && pfame >= 180` — 2.6 a house.** The rudis is reachable and always was,
and dropping five to three would have changed nothing.

**What actually blocks `closed` is the other half of its gate: `freed > lost`.** A house frees about 2.6
men across a career and buries 68 to 154 of them. No house that fights can free more men than it buries,
so the mercy ending cannot fire however low the count goes. That is a different dial from the one I
named, and it is left for a decision rather than changed on my own initiative — the honest options are
relaxing the comparison (`freed >= 3` alone, or `freed * 3 > lost`) or retracting the source comment that
says mercy "should be able to end that way".

**`oldAge` is left exactly as it is**, and recorded as retired rather than fixed: 907 lanista-weeks at 62
or over with health at 45 or better in **none** of them. Widening the health band would open the ending
but would also make a seventy-year-old lanista hale, and health decay is load-bearing elsewhere. A
twelfth ending nobody reaches costs less than that. The prose stays in the file; nothing was deleted.

### v2.88.0 — The rope thought Rome was Capua

A fault in the test harness, found while driving the last unreached ending. No game code changed.

The shared rope added in v2.81.0 falls through to the Capuan pit when the arena bill is empty, because
#116 measured that a probe reading only the bill fights almost nothing. That fallback was guarded on
`!d.city` — and **a house at Rome has `d.rome` set with `d.city` still null.**

So a probe driving the imperial trip fought pit bouts in Capua on every week the imperial card was not
up, then read `d.rome.won` and found nought. It came within one run of being written up as *the
imperial sand is unwinnable*: six houses of quality-92 men, 0 of 18 bouts won, a clean-looking figure
taken from the wrong venue.

Fixed: there is no fallback at Rome. `romeWeek` puts the card up, and if it is not there this week the
answer is that there is no bout — the rope returns `{ ran:false, why:"at Rome with no card up this
week" }`. Driven again, a trip is **three imperial bouts fought and two weeks honestly reported as
empty**, where before those two weeks were bouts somewhere else.

**AND THE ENDING ITSELF IS PROVED, WITH THE MATCHUP LEFT OPEN.** `triumph` needs `won >= 2` of the
three, and then choice 1 on the homecoming. Forcing the win count and taking the laurel ends the run in
triumph **6 of 6**; the same houses answering with choice 0 end **0 of 6** and play on. So the twelfth
ending exists and the choice is what fires it. Whether a house can actually take two of three on the
imperial sand is a separate question — **0 of 18 with the venue bug fixed** — and it is NOT claimed
here, because the men were hand-built and nothing has yet read what is across from them. That is the
next item, not this one.

The general lesson is in `test/README.md`: every fallback encodes an assumption about which venue the
house is standing in, and it fails by producing plausible numbers from the wrong place rather than by
erroring.

### v2.87.0 — The survive bar is fine, and the one-in-four figure was mine off four samples

Task #50, closed by measurement, and it refutes my own alarm.

v2.76.0 saw `survive` fail on a byte-identical build, and the note written then recorded that its
both-weak-together conjunction "trips on luck about one run in four". Four samples is not a rate, and
the item has sat open since with an explicit instruction not to touch the bar on fewer than ten.

**Thirty-five real runs of the check were collected across this session's releases and tallied:**

| houses standing | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| runs | 3 | 10 | 17 | 4 | 1 |

Men between the yards: **min 2, median 6, max 12.**

**Hard failures — `standing < 2` AND `men < 5` — 1 of 35, or 2.9%. And 0 of the 27 runs since
v2.79.0.** The check's own design note budgets for about 1.6% of healthy runs failing, and one failure
in thirty-five is consistent with that at this n.

**The conjunction is doing precisely what it was built for.** Three runs came in with only one house
standing. Two of those still had five or more men between the yards, and the check called them a bad
week and passed. Only the third was weak on both readings at once. A bar on either reading alone would
have failed three runs in thirty-five instead of one.

Nothing was changed. The one-in-four figure is retracted, and the measured distribution is written into
the check's head so the next person to see a red `survive` can tell a bad week from a gutting without
re-deriving it.

**And the method note, which is the third time this session it has mattered:** the samples cost nothing
to collect because every full-suite run logs one. A variance question about a slow check does not need a
dedicated fifty-minute sweep; it needs somebody to read the logs that already exist.

### v2.86.0 — Four claims re-run paired: one reversed, one understated, two held

Audit item **#120**. No game behaviour changed. v2.85.0 established that an unpaired design cannot
separate a 1.6× effect from seed noise at the n this project had been using, so every live cross-arm
claim was re-run **paired on one seed** — each house played twice, once per arm — with the sign test
over decided pairs as the statistic. n=60 pairs each.

**REVERSED — #115's "touring makes no difference to the rebellion".** Unpaired at n=10 it read 6 of 10
either way. Paired at n=60 it reads **rebellion 5 for the touring arm against 14 for the homebound
one**, with 11 of 60 out against 14. Touring nearly **thirds** the rebellion count. The rest of that
item stands — the levers matter more than travel does, and touring houses do live longer — but the
specific claim that travel is neutral on the cells was an artefact of ten houses on unpaired seeds. The
likely mechanism is that much of the week, `agendaCan` included, returns early while `d.travel` or
`d.city` is set.

**UNDERSTATED — #114's mend race.** Unpaired at n=6 per level it read a keen share of 83.3% with no
armamentarium against 94.8-96.3% above it. Paired at n=60, with the same house played twice and the room
built in one copy: **keen 99.8% against 68.1%, breaks 0 against 135, and 60 of 60 pairs favour the
room.** A cleaner sign test is not available. The effect is far larger than the unpaired figures showed,
which is the opposite error from #117's — and worth noting, because it means unpaired noise cuts both
ways rather than always flattering the finding.

**HELD, with a softer magnitude — `ends`'s "playing well halves the opening".** Published as 6 of 24
out against idle's 12. Paired at n=60: **17 of 60 against 28**, so playing well cuts the chance of going
out by about a third rather than half. The direction is solid and the suite's bar — which fails if the
played arm dies at least as often as the idle one — is comfortably safe. The check's line now carries
both figures.

**HELD — #117's policy range.** `careless`, the fattest purse every week to the death, **outlives
`proven` 42 pairs to 18**, median 157 weeks against 71. And the mechanism is in the endings: rebellion
22 for `proven` against **1** for `careless`. A house that fights everything to the death loses its men
before its cells ever get loud enough to rise.

**THE SCORE ON THE METHOD.** Four claims, four different outcomes: one reversed, one understated by a
wide margin, one softened, one confirmed and sharpened. Not one of the four came back unchanged. Pairing
is now the default for any two arms differing in one line, and the four unpaired figures are kept in the
reference beside their paired replacements, because which way each one moved is the useful part.

### v2.85.0 — Two probes, one policy, and the seed set was the whole of the difference

Resolves the open item from v2.84.0, and corrects a magnitude I published in v2.82.0.

Two sweeps drove what was meant to be the same unrest policy — feast over unrest 30, walk the cells
over 22 — and disagreed by six times: 259 weeks median life and 6 of 30 houses alive at year 22 against
45 weeks and 1 of 30. Both at n=30.

**The two implementations are identical.** `RNG` is a single module-level global and `newGameState`
resets it from the seed, so same build plus same seed plus two policy functions is a valid paired
comparison. Run that way, the two shapes produced **byte-identical week-by-week trails on 30 of 30
houses** and never diverged once. There was no code difference to find. The gap was the seed set and
nothing else — and on a third, neutral seed scheme the policy read 69 weeks and 1 of 30, agreeing with
the lower pair.

**Which put v2.82.0's headline in doubt, so it was re-measured properly.** The comparison that matters
is the same body with and without the cells, paired on one seed, at an n large enough to see past the
families. 110 houses:

| | median life | alive at year 22 | median fame |
|---|---|---|---|
| with the cells | **105w** | **11 of 110** | 605 |
| without them | 64w | 0 of 110 | 151 |

**And the paired statistic, which is the one the design buys: the cells arm outlived its own twin 70
times, was outlived 31 times, and tied 9.** So the direction v2.82.0 claimed is real and now properly
established — working the cells is the largest single lever measured in this project. **The magnitude
was not**: 1.6× on median life rather than 3.6×, and 10% of houses reaching year 22 rather than 20%.
The 3.6× came from one kind seed family, and the dial row now says so.

The first divergences are the mechanism in two numbers: around weeks 14 to 24 the cells arm is holding
slightly less coin and slightly lower unrest than its twin. The feast costs money and buys quiet, and
over four hundred weeks the quiet is worth more than the money.

**THE METHOD IS THE LASTING PART.** Unpaired arms at n=30 could not separate a 1.6× effect from seed
noise, which is exactly how a 3.6× figure and a "makes it worse" figure both came out of the same code.
Pairing removes the seed family entirely: every house is compared against itself. It should be the
default for any two policies that differ in one line.

### v2.84.0 — Half the biggest lever is never suggested, and two of my probes disagree about the other half

Audit item **#119**, shipped as two counts and one refusal. No game behaviour changed.

#117 measured working the cells as the largest lever on record. #119 asks whether the game points at
it. The gatekeeper does: `LESSONS.unrest` — "The Fire in the Cells" — says to watch that red bar more
closely than the gold, and names feasts as what cools it. The weekly agenda is the other half of the
answer, and it is a partial one.

**The feast is offered late, and goes quiet when the house is poor.** `agendaCan` gates it on
`unrest >= 35` plus `gold >= feastCost(d) + weeklyBill(d)` and `feastFresh(d) >= 0.6`. Over one
policy's 400-week houses: **1,432 weeks with unrest at 22 or more, of which 648 (45.3%) are below 35
and get nothing at all.** Of the weeks past 35, the item appeared **179** times and was suppressed
**372** — 361 by the freshness gate and 11 by the coin gate.

**And walking the cells is never suggested at all.** Outside its own definition, `walkTheCells` appears
in exactly one place in the source: a button on the villa tab. It is absent from `agendaCan`. Measured:
**1,029 weeks where the cells were loud and `walkReady` was true**, and nothing anywhere in the game
pointed at it.

**WHAT IS NOT CLAIMED, AND WHY.** The obvious third measurement was an obedient arm — feast only when
the agenda offers it, never walk the cells because nothing suggests it — against the 30/22 policy #117
found best. It read **obedient 170 weeks against 30/22's 45**, with the 30/22 arm coming last of four,
below doing nothing about the cells at all, and 17 of its 29 deaths from money.

That contradicts #117, so #117's comparison was re-run at n=30: it replicates strongly — `proven+cells`
259 weeks against `proven`'s 71, **6 of 30 houses alive at year 22 against 0**, median fame 3,183
against 458. **So two probes of what is meant to be the same policy disagree by six times, both at
n=30, and I have not found why.** The buy rule, the regimen, the fit filter, the offer pick, the stakes
and the event answering all read equivalent; only the seeds differ, and a 6× gap is far too large for
seeds at that n. Until it is resolved, no ordering claim from the second probe is trustworthy, and
v2.82.0's claim rests on the first — which did replicate. The disagreement is on the board as an open
item, not written up as a finding in either direction.

The two counts above do not depend on any cross-arm comparison: they are tallies from a single arm's
weeks, and they stand on their own.

### v2.83.0 — Two of the endings are written for houses the game does not produce

Audit item **#118**. No game behaviour changed. Two hundred played houses had produced seven of the
twelve endings the source can set, and the probe sent after the rest failed its own control, so its
verdicts were worth nothing and the gap was recorded as unresolved. Answered now, with a control that
works: an ordinary house, played the way #117 recommends, ends in ruin 4, lanistaDied 1 and rebellion 1
of 6 — the record's own endings — so what follows counts.

**`foreclosed` was reachable all along and nobody had tried.** Borrow 2,000 (the lender books 1,400 of
it as principal), never repay, and `owes(d)` passes four times the principal at **week 44 in 6 of 6
houses**. It sits behind `borrow`, and no sweep policy in this project has ever taken a loan.

**`oldAge` cannot happen.** The gate is `age >= 62 && health >= 45 && d.heir && year >= 6`. Over
**3,070 lanista-weeks** the man in the chair was 62 or over in **907 of them** and his health was 45 or
better in **none**. Health decays with the years, so the two conditions never hold together — and with
an heir named, a lanista whose health reaches nought hands the house over rather than ending the run
(1,135 weeks of `d.succession` in the same sample). The ending is written for a man the game does not
produce: old, well, and with somebody to hand it to.

**`closed` cannot happen either, and the bar is arithmetic.** It needs five men freed —
`houseRecord(d).freed >= 5` and `freed > lost` — and `rudisEligible` is `wins >= 10 && pfame >= 180`.
Across 500-week houses the best man ever reached **8 wins**. #114 already explained why: a man fights
**3 bouts at the median and 8 at p90**, because the piece outlives its owner. Five men at ten wins each
is a bar the game's own career lengths do not reach — beside a source comment that says *"the game says
mercy is the strongest long game; it should be able to end that way"*.

`triumph` is a choice on the road back from Rome, offered only to a house that got there and won, and
no arm here reaches fame 1,000. It stays untested rather than answered.

**AND TWO MORE FAULTS OF MINE, both of them a call signature.** The first pass reported the heir as
unreachable after calling `nameHeir` 396 times: `heirEligible(d)` returns an array of KIND STRINGS and I
read `opts[0].kind`, then passed three arguments to a two-argument function. Corrected, an heir is named
in **week 1 of 6 of 6 houses** — the heir system is perfectly usable, and #90's "unused" is about
players and not about reach. The second: `rudisEligible(g)` takes the MAN, and I passed `(d, g)`, so it
was handed the state as its gladiator and returned false every week of every run. The arm freed nobody
and I nearly wrote that the rudis was broken.

`ends` carries the section, and the two dead gates carry **tripwires rather than locks**: it asserts the
reachable ending and asserts that `rudisEligible` still refuses a man with nine wins, so if the bar
drops or careers lengthen the check asks for a re-measurement instead of pinning a fault in place.

### v2.82.0 — A resolved bout is a paid bout, and the night is a policy too

Audit item **#117**. No game behaviour changed. The reference table that said the ledger is the
competent player's only enemy is replaced, and the second fault in it is the more interesting one.

v2.81.0 corrected the 40-week opening and left the five-policy 400-week table alone, flagged as known
stale. Re-run here: same five policies verbatim, plus a sixth, 400 weeks, 20 houses an arm, two seed
sets, no arm handed a denarius, and every bout resolved through the harness rope.

**THE FIRST FAULT WAS THE CRUX, and the correction is a full inversion.** Debt across the arms is
**24% and 27%** against a published **69% and 67%**, and essentially all of it belongs to the idle
arm, which is unchanged at 95-100%. `careless` reads **0% debt on every run**. A bout that is resolved
is a bout that is **paid**, so a house that fights does not run out of money — it runs out of quiet, of
men, or of lanista. The ledger is the enemy of a house that does nothing and of nobody else.

**What ends a well-run house is old age.** `lanistaDied` is the plurality ending for both `proven` and
`proven + the cells worked`, at 50%/20% and 53%/40%. No previous sweep had ever seen it, because no
previous sweep kept a house alive long enough.

**THE SECOND FAULT WAS MINE AGAIN, and I nearly published the finding it manufactured.** The first
re-run put rebellion at **55-84%** of every playing policy's endings and I had a headline about the
cells being the real killer. Both the old sweep and mine answered the week's question with choice 0
and called that a control because it was identical in every arm. It is not a control. On `uprising` —
the one event that can end a run — choice 0 is *"Meet them with steel"*, the only branch that sets
`d.over = rebellion`; choice 1 is the magistrate's guards for 300 denarii, worth +80 on the house's
side of the roll; choice 2 opens the gates and cannot end the run at all.

Answering it the way a solvent player would takes `proven` from a median life of **54 weeks to 183**
and its rebellion share from **70% to 40%**. One 300-denarii decision, tripling the arm's lifespan and
distorting every other figure in the table on the way. Answering every question identically is not a
control when the choices differ in how lethal they are.

**AND THE LARGEST LEVER MEASURED IN THIS PROJECT SO FAR.** `proven + the cells worked` differs from
`proven` by two lines — feast when unrest passes 30, walk the cells when it passes 22 — and it is the
only arm with houses standing at year 22 on **both** seed sets: **5 of 20 against 0 of 20**, median
life **308w and 270w** against 183w and 116w, median fame **1,316-1,919** against 225-380, median peak
unrest **59** against 84. At n=14 with the wrong answer policy this looked unstable (74w → 41w on one
run) and was reported and not pinned; with the night answered properly it is stable on both sets, and
it is now the strongest argument on record for the charter's "keep the cells quiet" step moving ahead
of its four spend-money steps.

`ends` carries the long arc now — four arms over 120 weeks, where the inversion is already plain — and
it answers the night the way a player would and prints which word it spoke. Reverting its rope to
crux-blind reproduces the OLD published numbers exactly: 13 of 24 out, 58% debt for `proven`, debt
above rebellion. Three of its bars fire on that one edit, which is as direct a demonstration as the
audit has produced that the old table was the trap and not the game.

One thing measured and NOT the cause: silencing every unrest point a death in the familia costs — four
call sites — did not stop the rebellions. Grief is not what drives the cells; fighting is, and a house
that never fights peaks at a median unrest of 17 against a fighting house's 85.

### v2.81.0 — The suite was measuring bouts that never happened

Audit item **#116**, the audit's own instrument. No game code changed; the whole release is the test
suite and two published figures being corrected.

#116 was written because the probe had been wrong more often than the game. Counted off the record
for #108–#115: **eight items, six of them closed as refuted or answered rather than as faults**,
against **roughly twenty-two instrument faults of mine**. Prose in a README does not stop that
happening again, so this release turns the two mechanically detectable ones into a rope and a lint.

**THE FAULT, MEASURED.** `doFight` and its three sister engines return at their `res.unfinished`
branch — the balance, where the box is asked for a word — BEFORE they credit anything, and they
mutate **nothing at all** while a bout is held. Over 400 bouts a row: **0.0% of first-blood bouts
reach the balance, 60.5% of standard, 59.3% sine missione**, and in **721 of 721** held bouts the
purse, the fatigue and the steel had all not moved. (The 0.0% reproduces a figure already on record,
which is what says the instrument is right — the first version of this probe passed `"first"` as the
stakes, which is not a key the game uses, and read 61%.)

Three checks — `ends`, `houses` and `chair` — called the engines and never looked at `r.crux`, so
about **60% of their bouts never happened**. Five more shared a wrapper that answered exactly ONE
word and discarded any bout that came back to the balance a second time; `simulateFight` allows
three, so that is another **26.8% of all standard bouts, 44.2% of the held ones**. In total nine of
the nineteen checks that drive a bout were losing a quarter to two thirds of their evidence.

**TWO PUBLISHED FIGURES WERE WRONG BECAUSE OF IT, and they moved in opposite directions.**

`ends` read **13 of 24 houses out inside 40 weeks with a median 272 denarii UNDER**, and #110's
conclusion was that the ledger is what ends a competent opening. It was an arm that fought hard and
was paid for two afternoons in five. With every bout resolved: **6 of 24 out, median +506d in the
box, and the endings split debt 3 / rebellion 3.** Playing well *halves* the chance of going out in
the opening rather than barely changing it, and what ends a house that plays is as much the **cells**
as the ledger — which lines up with #115's control arms, where the levers doubled a house's life.

`houses` moved the other way, and its own header had predicted exactly how: resolved bouts raise the
rival's **grudge**, and warmth's familiarity term only pays while the grudge is under 30. Two of five
houses stopped warming at all and rebelled at weeks 89 and 104. Given the rope AND the unrest levers,
#113's median peak warmth of **76.8 re-measures at 100** over twenty houses and 300 weeks, with `end`
firing in 12 of 20 against 3. So #113 is refuted more decisively than before, not less.

`chair` came out unchanged in verdict and better in figures — the four names are now held 100%, 95%,
100% and 97% of their named weeks.

**THE ROPE** lives in `test/harness.mjs` and `open()` installs it on every page, so no check
hand-rolls it again: `__ROPE.takeBout` picks men, prefers the bill, falls through to the pit or a
town's card, dispatches the right engine and answers to exhaustion, keeping counters a check can
print. `ends`, `houses` and `chair` are on it; the other fourteen resolve in loops of their own.

**`probe` IS THE 50th CHECK** and reads the suite's own source. It fails any check that names a fight
engine without resolving to exhaustion, reading **each `if(… .crux …)` site** rather than the whole
file — because answering with the **cloth** ends the bout as a forfeit and is correct, which
`chair`'s mercy arm and the whole of `feats` rely on. A file-wide rule flagged both.

**AND ONE OF ITS OWN RULES WAS TAKEN BACK OUT.** A second rule flagged any check reading
`d.games.offers` without a pit fallback — the fault that held two of my probes to 2-5 bouts in 90
weeks. It flagged eight checks and **seven were right to**: `card` measures what a bill is made of,
`nights` and `worst` read a record built from festival cards, `grudge` waits for a match that only
appears on a bill, `glance` and `summit` build houses famous enough to have one, and `bay` falls
through to the town's card because a house down the coast does not fight Capua's pit. One real fault
against seven false positives is not a rule — it is a rule that teaches whoever reads it to add an
exception without thinking. It is a reported line now.

Its own detector needed the same treatment twice: the first version required a `(` after the engine
name and found 7 of the 19 checks that drive one, because the dominant style here passes the engine as
a reference — `fin(A.doFight, [d, …])` — and the second version read the file rather than the site.
A detector that only sees one calling convention is the same class of fault it exists to catch.

Also removes a duplicate `makeStaffMarket` key on the test handle that had been warning on every build
since v2.77.0.

### v2.80.0 — The coast has two scales, and a probe blamed touring for what its own policy did

Audit item **#115**, answered rather than refuted, and no game behaviour changed.

`cityFavWord` took **zero samples** in the whole scales sweep. `coast` drives a town's card and asks
whether its favour moved after one constructed bout, but nothing had ever toured, so the RANGE of
either coastal scale was unmeasured and their bands rested on nothing. Driven, both work — and they
work in opposite directions, which is the part worth having written down.

**Favour is a ratchet.** `d.bayPol[key].favor` opens at `20 + ri(0,15)`, so every town starts you on
"an outsider". It moves only on a bout fought in that town, by `4 + served*5` — **+9** for the
afternoon the town came for, **+4** for one it did not mind, **-1** for one it did not want — and it
never decays. Eight houses touring the bay five weeks a town ran it from **10 to 100**, median peak
**93**, and said **all five words**.

**And the bottom word is reached only by losing,** which reading the source would have missed. Favour
opens above 18 and mostly climbs, so "not wanted here" looks unreachable — but Neapolis wants craft
and `cityServed` scores a defeat **-1**, and a house beaten again and again on Greek sand fell to
**10**. That one branch is the whole of the bottom band.

**Local standing is the opposite: it bleeds.** `knownIn` is fed by every bout down there and loses
`BAY_DECAY` **0.55 a week** for every town you are not standing in. A five-week-a-town round robin
pegs all three towns at **100 by about week 20** and never feels the decay at all. Neglect it and it
does exactly what it says: a house that tours once to 70-90 and then stays in Capua bleeds to
**nothing over about 130 weeks**, and loses `knownIn >= 10 everywhere` around week 130.

**One branch neither of my arms could reach.** `bayWeek` hands the bay to a rival on `!d.city && 30
idle weeks && R() < 0.028`. The touring arm reset that clock every few weeks and measured it **0
times in 8 houses**; the homebound arm had it taken in **8 of 10** — median week 55, median 28 weeks
held, up to 167 — and, never travelling, never got it back, because it is cleared only by `if(d.city)`:
turning up. Driven on purpose that is **12 of 12**, two weeks after setting out, for **+10 to +12**
grudge with the house you took it from. Two arms drove every part of the mechanic except the reward at
the end of it, which is what happens when both arms are policies instead of one policy and one
variable.

**THE BIG INSTRUMENT FAULT: my tour probe put 7 of 8 houses out by REBELLION between weeks 17 and
100,** which read as a savage price on being away from Capua. Four arms of 10 houses over 200 weeks,
one policy apart from the named variable:

| arm | rebellion | median life |
|---|---|---|
| home, no unrest levers | 7/10 | 55w |
| tour, no unrest levers | 10/10 | 68w |
| home + feast and walking the cells | 6/10 | 117w |
| tour + feast and walking the cells | 6/10 | 126w |

Pulling the levers roughly **doubles** the median life in both. A touring house lives **longer** than a homebound one in both pairs, which is the opposite of the
finding I nearly had. **The "no difference to the rebellion" half of this was WRONG, and #120 found
it**: unpaired at n=10 it read 6 of 10 either way; PAIRED on one seed at n=60 it reads **rebellion 5
for the touring arm against 14 for the homebound one**. Touring nearly thirds it. The likely mechanism
is that `agendaCan` and much of the week return early while `d.travel` or `d.city` is set. The rebellion was a probe that never touched
the cells. (A second, smaller one: the "stay home and watch it decay" arm had towns pegged at 100
because an invitation event put the house back in a city. Staying home has to be enforced against the
game's own invitations.)

`bay` is the 49th check and runs in 2 seconds: a real tour raising both scales and saying the middle
words, the losing branch that keeps the bottom word alive, the decay against `BAY_DECAY`, and the bay
being taken and given back. **And one of its own sections was caught holding nothing** — the decay
arm compared the observed fall against `BAY_DECAY * weeks`, which is a constant validated against
itself, so setting `BAY_DECAY` to 0 made both sides nought and the check PASSED a build in which no
town ever forgets anybody. It now holds the rate against the constant *and* the constant against zero.
Killing the `cityServed` defeat branch and the holder's clear branch each fail it on the matching bar.

### v2.79.0 — Steel does wear, and the probe that said otherwise was reading the shelf

Audit item **#114**, refuted on its own falsification clause, and no game behaviour changed.

The item measured `gearCond` 583 times: the range seen was 56 to 74, so "keen" was never read and
neither of the bottom two bands was ever occupied, beside a lesson promising steel that "wears every
bout and eventually breaks in the middle of one". Its own falsification clause asked whether a piece
carried through forty bouts without mending falls through the floor.

**It does, and both halves of the item were the instrument.** `d.gearCond[id]` is the pool of pieces
ON THE SHELF. `buyGearItem` pushes 100 and `equipOne` splices that number straight back out when the
piece goes on a man, so what is left in the pool is dominated by spoils taken off a dead opponent,
which enter at `ri(55,85)` — which is exactly a floor near 56 and a ceiling under 85. While a piece
is worn, its condition lives in `g.wear[slot]`, which is what `wearWord`, the armoury bar,
`kitFaults` and `gearScore` all read.

Read off the man, the whole system works: **a bout takes 3-6 off a weapon at a measured median of 4
over 87 calls**, a piece walking from 100 down to nothing **says every one of the five words**, and
it breaks. In a played house with no armoury, **76.6% of man-slot-weeks read "keen", 8.5% read "worn"
or worse, and three pieces broke in sixty bouts**.

**Two things are true about wear that are not faults, and are written down so nobody re-opens them.**

It is a system of the first years. Counted on the game's own chronicle line, breaks per ~1,050 bouts
run **28 with no armamentarium, 2 at level 1, and 0 at levels 2 and 4**, while the keen share runs
83.3% at L0 against 94.8-96.3% above it. `repairWeek` adds level*2.2 a week against 3-6 a bout on a
man who fights every second or third week, so the room does exactly what it says it does.

And underneath that, the piece outlives its owner. A man fights **3 bouts at the median and 8 at
p90**; a weapon needs about 25 to break. **Only 2 of 241 men ever reached 25 of their own bouts, and
207 of 263 left the yard dead.** The break line is written for a fight that a careful house rarely
has, and that is a property of how short a gladiator's career is rather than of the wear rate.

**FOUR INSTRUMENT FAULTS OF MINE, every one of which changed a headline number.**

The rope. The first draft read only `d.games.offers` — the arena bill, shut until fame 25 — and
fought **2 to 5 bouts in 91 weeks**, so every arm was the idle one wearing a name. `ends` already
carries that lesson on its face and I repeated it.

The crux, which is the expensive one. `doFight` returns at its `res.unfinished` branch **before** it
calls `wearKit`, and mutates nothing at all, because the bout is being held for the box to speak.
Between **41% and 82%** of bouts reach the balance. A silent probe measures a bout that never
happened — and because the crux rate is highest at sine missione, the arm fighting to the death wore
its steel LEAST, which looked like a finding about hard wear running backwards.

The break counter. My own detector — a slot that was under 30 and is now a different piece —
**undercounted by 60%, 11 against 28**, because a break re-arms the man from the rack with another
copy of the SAME GEAR ID, so the slot looks untouched. Identity of the gear id is not identity of the
piece, and the game's own chronicle line is the only honest counter.

The room. The arms comparing armamentarium levels ran `buildUp` on a fresh house's purse, so only
level 1 was ever affordable and the L2 and L4 arms were the L1 arm under another name. Three runs
printing the same 1,036 bouts and the same two breaks is what gave it away.

**And two more suspicions of my own, both refuted.** The n=2 version of the mend race read "lows of
90 with the room against 26 without" and looked like the first level switching a whole system off; at
n=6 it is a keen share of 95.4% against 83.3%, which is the same direction and a much smaller claim.
And `LESSONS.wear` — whose exit is `some gearCond entry < 80` — looked like it would be satisfied in
the first month by spoils and never say the thing it is about. **12 of 12 houses were offered it in
week 1**, the exit fired later or never, and **0 of the 4 that fired it did so on a number that looks
like spoils**.

`steel` is the 48th check and runs in 3 seconds. It holds the rate against `WEAR_RATE`, all five
words off a piece driven to nothing, the break on the game's own line, the bands a played house
actually sees, the career against the weapon's life, and — because this is the trap that cost the
most — that a bout held at the balance has changed **nothing** and the same bout answered changes the
kit. Zeroing `WEAR_RATE.weapon`, killing the break branch, and moving `wearKit` above the
`res.unfinished` return each fail it on the matching bar.

### v2.78.0 — The two words nobody had seen are said by a house that works one rivalry

Audit item **#113**, refuted on its own falsification clause, and no game behaviour changed.

The item measured warmth topping out at **43.4** over 2,310 samples across 6 houses and 160 weeks,
so "on good terms" (50) and "thick as thieves" (75) were never said — and it refused to call that a
fault, writing the test itself: *a house that fights one rival repeatedly for 200 weeks might pass
50, which would make my sample too short rather than the game short of content.*

**It does.** Twenty houses, each picking one rival at the start and fighting that house every week it
could for 300 weeks: **median peak warmth 76.8, max 100 — the cap — and every one of the four words
said.** The old ceiling was an artefact of how the opponent is chosen: `pickRivalOpp` draws from every
rival by band, so a probe that uses it meets six houses a little instead of one house often. Warmth is
1.1 a *meeting* plus 4 to 16 from each of eight once-only beats, and the beats gate on `met>=6`,
`met>=10`, `met>=14`, `met>=22`, `met>=26` — the numbers a concentrated rivalry reaches and a spread
one does not.

**Two more findings of mine went the same way at higher n, and both are worth the space.**

`loan` fired 0 times in every 300-week sweep and looked dead. Its gate is `c.warm>=34 && c.poor`, and
`poor` is `d.gold < 200` — the sweep floors the purse at 4,000 so the house is never broke at the
moment the arc runs. Isolated on a broke house it fires **9 times in 12**. Reachable; the probe was
solvent.

`rivalArc` refuses to run while a question is waiting: `d.pendingEvent` sits in the same guard as
`d.over`, `d.rome`, `d.city` and `d.travel`, and unlike those four it is not a fact about where the
lanista is. The function only writes a chronicle line — it never sets a question of its own, so
nothing is being protected from being clobbered. **At n=8, removing it moved median peak warmth from
39.7 to 55.9** and I had a finding about the median house being pushed across a word boundary. **At
n=20 the same comparison reads 76.8 against 100, 57 beats against 67, and `end` at 3 of 20 against 5
of 20.** So the guard costs about **15%** of the arc and delays its last beat, and blocks no word at
all. The guard was left alone, the n=8 version is recorded as what it was, and `bitter` firing *less*
in the warmer arm is noted as a trade rather than a loss — it needs `warm<25` and a warmer arc leaves
it behind.

`houses` is the 47th check and runs in 2 seconds. It holds the refutation, because that is the thing
that would be a real fault if it stopped being true: a house working one rivalry reaches the top of
the scale, every one of the four words is said, at least one beat fires, and — underneath all of it —
a bout against a rival's man registers as a meeting at all. That last one is two fields lining up:
`metHouse` reads `offer.opp.house` against the rival's name, and if they ever come apart the whole arc
goes quiet with nothing else to show for it. Breaking the meeting registration, the per-meeting
warmth, or the arc itself fails it on the matching bar each time.

### v2.77.0 — Four suspicions about the name Capua gives your house, four refutations, all mine

Audit items **#111 and #112**, and between them one line of shipped source changed — a comment.

#111 named the man in the chair as a dark group: `lanistaWeek`, `hasLT`, `repStyle`, `addRep`. #95
had already settled the traits themselves. What nothing had measured is the thing upstream of them:
**`repStyle`, the name the town settles on.** It earns `hard` and `merciful` at fifteen straight
weeks, and `repStyle(d) === "blood"` is one of the two things that makes a medicus walk out, which is
the whole of #112.

**Four suspicions went in. Four came out refuted, and every one of them was the probe.**

**1. "The town may never settle on a name."** It settles in **87% to 100% of house-weeks** in every
arm, first name at median week 2 to 11, in 10 of 10 houses each time.

**2. "`show` is never the name."** The first sweep made it the name for **1 week out of 3,001** —
which looked like a fifth of the reputation system being dead content. The cause was that every arm
passed `"measured"` as the tactic, and `showboat` is the one thing that awards `show` per bout. A
house that showboats holds the name **824 of 917 weeks**. The lever was the one the probe had its
hand on the whole time.

**3. "`mercy` cannot be earned on purpose."** The arm built to test it fought at **first blood** —
the naive reading, and the exact thing the charter's tenth step warns about: *"at first blood it ends
at the wound and nobody is ever on their knees."* So it reached no crux, threw **0 cloths in 2,345
house-weeks**, and was called `craft` for 2,208 of them. The policy the charter actually teaches —
fight to surrender, then let the man up — threw **727 cloths** and held the mercy name **1,277 of
1,296 weeks**, with all ten houses earning the `merciful` trait. The game was right and the probe was
reading "merciful" as "cautious".

**4. "`recordCloth` awards no mercy rep."** It does not, and it should not. The eight points are paid
where the cloth is **resolved**, once per engine — the singles forfeit branch, the hunt's handlers,
the pair let up together — plus three more for a man spared without dying. A duplicate award was
written on top of the real one, tested, and found to change **nothing**: 1,277 of 1,296 either way,
because mercy was already saturating. **That identical figure is what caught it.** A fix that changes
no measurement is either unnecessary or being measured wrong, and it is worth finding out which
before it ships.

**WHAT IS REAL IS #112, AND THE CLAUSE HAS TEETH.** `STAFF.medicus.quitOn` is
`d.unrest > 72 || repStyle(d) === "blood"`. The butcher loses his surgeon in **9 of 10 houses at
median week 12**; the showman, playing just as hard for just as long, loses him in **0 of 10**. The
item's falsification clause was that `repStyle` might reach "blood" so rarely the clause was inert —
the butcher holds that name **100% of his weeks from week 2**. Not inert.

`chair` is the 46th check and runs in 4 seconds. It sends one house after each of the four names the
way a player would — the blood doctrine and every bout *sine*, the showboat tactic, the craft
doctrine, and the mercy doctrine with the cloth at every crux — and holds three things: the town
settles on a name at all, **each of the four names is not only reached but HELD** for the majority of
a house's named weeks, and the butcher loses his surgeon while the showman does not. Reverting the
showboat award, the cloth award, or the blood clause in `quitOn` fails it on the matching bar each
time. "Ever reached" was too weak to be worth asserting and is written down as such: with the cloth's
eight points removed the mercy arm still touched the name in 6 of 6 houses on the three points a
spared man pays, but held it 184 weeks of 426 against craft's 181 — a coin-flip rather than a name.

### v2.76.0 — What ends a house is decided by how it is played, not by what year it is

Audit item #110. Three answers to one question were on record. The balance reference said **debt is
85% of endings** and "the ledger is the competent player's only enemy". v2.68.1 found the first 26
weeks kill by the yard emptying with coin still in the box. The v2.72.0 careless sweep put all 24
houses out — 16 emptied, 8 in debt. Each was measured on a different policy over a different span.

**RE-MEASURED IN v2.82.0 ON THE ROPE, AND THE OLD TABLE IS BELOW IT FOR THE RECORD.** The original
sweep called `doFight` and never answered the balance, so ~60% of every arm's bouts returned at
`res.unfinished`, mutated nothing and paid no purse — five policies that fought hard and were paid for
two afternoons in five. It also answered every question with choice 0 and called that a control. On
`uprising`, the one event that can end a run, choice 0 is *"Meet them with steel"* — the only branch
that sets `d.over = rebellion`. So the sweep was also manufacturing rebellions.

**Six policies, 400 weeks, 20 houses each, two seed sets, every bout resolved, and the night answered
the way a solvent player would — the magistrate's guards for 300 denarii.**

| policy | out | debt | the rest | alive at year 22 | median life |
|---|---|---|---|---|---|
| idle — ends the week, nothing else | 20/20 | **100% / 95%** | — | 0 of 20 | 21w / 24w |
| middling — takes the card, no reserve | 20/20 | 10% / 10% | rebellion 35% / 70% | 0 of 20 | 41w / 101w |
| proven — `survive`'s own discipline | 20/20 | 0% / 15% | rebellion 40% / 40%, **lanistaDied 50% / 20%** | 0 of 20 | 183w / 116w |
| proven + the cells worked | 15/20 | 7% / 20% | **lanistaDied 53% / 40%**, rebellion 33% / 7% | **5 of 20 / 5 of 20** | **308w / 270w** |
| careful — reserve, blood stakes, stone late | 17/20, 18/20 | 24% / 22% | rebellion 59% / 67% | 3 of 20 / 2 of 20 | 86w / 166w |
| careless — fattest purse, to the death, weekly | 20/20 | **0% / 0%** | lanistaDied 35% / 40%, emptied 40% / 35% | 0 of 20 | 175w / 142w |

**Debt across all six arms is 24% and 27%, against a published 69% and 67%** — and essentially all of
it is the idle arm's. **A bout that is resolved is a bout that is PAID**, so a house that fights does
not run out of money; it runs out of quiet, or of men, or of lanista. The ledger is the enemy of a
house that does nothing, and of nobody else.

**What ends a well-run house is old age.** `lanistaDied` is the plurality ending for both `proven` and
`proven + the cells worked` — the run finishes because the man in the chair grows old, which is the
game working exactly as designed and something no previous sweep had ever seen.

**And working the cells is worth more than anything else measured here.** `proven + the cells` differs
from `proven` by two lines — feast over unrest 30, walk the cells over 22 — and it is the only arm with
houses standing at year 22 on both seed sets (**5 of 20 against 0 of 20**), at a median life of 308 and
270 weeks against 183 and 116, a median fame of 1,316-1,919 against 225-380, and a median peak unrest
of 59 against 84.

**HOW THE NIGHT IS ANSWERED IS ITSELF A POLICY, and treating it as a control was the second fault in
the old table.** Answering `uprising` with steel every time instead of the guards takes `proven` from a
median 183 weeks to **54**, its rebellion share from 40% to **70%**, and pushes the pooled rebellion
share across the fighting arms to 55-84%. Both numbers are real; neither is "the game".

*The original crux-blind table, kept because the correction is the point:* idle 100%/100% debt,
middling 90%/80%, proven 70%/80%, careful 60%/45%, careless 15%/25% with ruin 40%, and 69%/67% debt
across the five.

**So the mix is not a property of the game. It is a property of the policy** — which is what #110's
falsification clause asked, answered in the negative, and it survives the correction. What changed is
which end of the range is which: the ledger belongs to the house that does nothing, and everything
else belongs to the cells, the yard and the years.

**And the disagreement with `survive` dissolves the same way.** That check records five of seven
early failures as the yard emptying with coin in hand; this measures 78–80% of early failures as the
ledger, at a median **270 denarii under**. Both are right about their own policy: a house that
replaces its losses dies of the ledger, a house that does not dies of the empty yard. Which one you
meet is the buying, not the era.

**By era, the part the reference never carried.** Debt dominates **years 1–3 in every one of the five
policies** — it is what an unfinished house dies of whatever it is doing. The later eras are the other
systems arriving: years 4–7 rebellion and ruin, 8–12 rebellion and `banned`, 13+ `lanistaDied`,
`emptied` and a last of debt.

**And competence does not buy the first year.** Over 40 weeks the proven policy went out 13 of 24
against 12 of 24 for a house doing nothing at all. What it buys is the ceiling.

**AND THE SUITE CAME BACK 44 OF 45, on a build that could not have caused it.** `survive` failed at
**1 of 5 standing and 3 men** — both its bars at once, which its own comment calls the only thing it
can detect and says "no amount of bad luck produces on a healthy build". `src/ludus.jsx` in this
release is **byte-identical** to v2.75.0's, which passed it: `git diff 753714a -- src/ludus.jsx` is
empty, because this release adds a check file and three documents and touches no game code. Three
more runs of that identical build: **4/5 with 7 men · 2/5 with 10 · 4/5 with 7**. So both-weak-
together trips on luck at roughly one run in four, and that claim is falsified.

**The bar was deliberately not touched.** That comment is right that loosening a threshold in the
same breath as its failure is the worst possible look, and right again that four samples is how the
last bad bar got set. The measurements are written into `survive`'s own comment, and getting the real
distribution of (houses standing, men) over ten or more runs of an unchanged build is now its own
item rather than a nudge made in passing.

`ends` is the 45th check and it holds the cheap, stable half — the opening, in 3 seconds. The long
table above is deliberately NOT asserted: at twenty houses per arm the lifespan medians swung from 36
weeks to 20 between two runs of the same policy. The mix was stable run to run; the medians were not,
so only the stable thing is pinned. Making the creditors 200× more patient fails it on both bars.

**FOUR PROBE FAULTS, and the first one invalidated everything.** The sweep's first version measured
**zero bouts in every arm over every house** — it only looked at `d.games.offers`, and a house that
never fights never gets a card, so all four policies were the idle arm wearing different names. Then a
wrong building key threw inside a `try/catch` every week the careful arm had coin, aborting the rest of
its week including the bout; four arms died inside a year and the table said it was the economy. Then
the invented "careful" policy turned out to be **no better than doing nothing** (median 26 weeks
against idle's 31) because it bought `market[0]`, the top of the block — the exact mistake `survive`
already has written down as having ended three houses in debt with men still in the yard. And a
diagnostic that "proved" four policies survive 161 weeks was **n=1 per variant**.

**ONE THING LEFT UNRESOLVED, on purpose.** Two hundred played houses produced seven of the twelve
endings the source can set; `oldAge`, `foreclosed`, `ruined`, `closed` and `triumph` did not appear. A
probe built to reach each one by constructing the state **failed its own control** — it could not reach
`debt`, `ruin` or `rebellion` either, which the played sweep produces constantly. So whether those five
are rare content or dead content is unresolved, and it is recorded as unresolved rather than guessed at.

### v2.75.0 — Four of the ten lines that tell you how close you are were wrong

Audit item #109. Every proximity line is a claim about the state, and ten had never been driven.
This project has shipped two of them wrong already and the notes on both say the same thing: the
forge line told a house of six men in stock kit that the fee was the whole of it, and Rome's letter
read `0 fame short` to a house with no senator warm enough to send it. Neither was found by reading.
Both were found by driving the gate and comparing what the line **claimed** to what the gate
**decided**. So: all ten, driven.

**Four were wrong.**

`feastReach` returns a fraction — `5 / the number of men`, clamped 0.65 to 1 — and the agenda put it
through `Math.round`, which is **1 for every house that can exist**. So the one line in the game
that tells you what a feast would do read *"it would reach 1 of them"* to a house of eight, at every
size, forever. The villa panel has always quoted it correctly as a percentage. The agenda says the
same thing now: *"on 8 men it lands 65% as hard as on four"*.

`paragonReach.short` was the gap against **worth** — the box, plus every debt owed to you at face,
plus the steel on the racks at half price — sitting in a sentence that reads *"You have N in the
box"* next to a button that compares the **box** to the price. So a house with steel on the racks
was told nothing was missing and then refused. Measured over 187 house-weeks of played houses past
week 20: a median **24.6%** of what this counted as worth was not in the box, **54.5%** of
house-weeks held something outside it, and **12.8%** fell in the window where the line names no
shortfall and the purchase is refused. The worst had 2,488d in the box and 16,200d of steel against
a man priced at 8,273. Both numbers exist now and each says which question it answers; the sentence
quotes the one the button reads.

`munusWait` — the panel is guarded on travel and the coast, but `munusReady` **also** refuses a
house standing on the imperial sand. Driven for real (letter offered, accepted, wagons walked
north), a house at Rome that had never held games was told *"Capua has had its fill of your
generosity for now. **0 weeks** before you can put on games again."* It now names what is actually
in the way.

`workOpen` — one sentence for two different gates. The three tier-2 monuments are gated on the five
plain **works** (a spina, baths, a shrine, a school, a tomb) and the closed line told you to finish
your **monuments**, which is the tier above. Only the amphitheatre wants the monuments.

**Five were right, and that is worth as much.** `blessLeft` cannot contradict the panel that shows
it — `blessOf` and `blessLeft` share one guard. `creditLine` **is** the gate, both sides call it, and
it does not drift over the week it is quoted in (median 0d of 60, worst 0d). `riseNeed`: 0
disagreements between the three rows and the button over 60 states, each with one requirement
deliberately one short. `romeBar`: 0 letters arrived with the renown rung unmet over 40 houses across
both roads and both senator states. `featNear`: 19 of 19 near lines over three states, 0 threw, 0
empty, 0 claiming a shortfall of nothing.

**And the tenth is not a proximity line.** `acclaimTarget` is on the item's list and is read by
`acclaimWeek` and by nothing the player ever sees — a rate, not a claim about how close anything is.
Reported rather than quietly dropped, because a list of ten that is really nine is worth knowing
about the list.

**FOUR OF THE SIX VERDICTS THE FIRST DRAFT PRODUCED WERE THE PROBE'S**, which is the ordinary rate
here and is written into the check so the next one budgets for it. `makeParagon` **returns** the man
and does not put him on the block, so the paragon arm tested nothing and reported "agrees" on a
sample of zero. The credit arm ran a whole week before reading the gate, and `endWeek` draws the
ledger first, so all 60 came back wrong on gold that was already spent. The feat arm flagged any
line beginning with a zero and caught *"0 of 20 won"*, a correct line on a house that has won none —
23 of its 23 hits were that. And the 12.8% above was first measured at **0%** by a policy that never
fought a bout: purses paid on credit are the only source of money owed to you, so the probe measured
its own idleness.

`near` is the 44th check. Its first draft had one more fault worth recording: it pinned the munus
decomposition over seven hand-listed states, every one of them with a quiet yard, so a condition
injected on unrest to prove the check could fail slipped through **7 of 7**. It runs the cross
product now — 181 states over away-state, cooldown, unrest and coin — and catches it at 169 of 181.
Reverting all four fixes fails it on all four.

### v2.74.0 — A word got longer and the line beside it got shorter

Not an audit item. The v2.73.0 suite came back 41 of 42, and the one failure was `sand`:

    the pits, choosing: "Hoplomachus · the Ludus Pomp" is cut off, 24px hidden

**The instrument first, because that is the rule here.** Five solo runs of `sand` afterwards all
passed, and a probe that drove the pits leg on its own six times never reproduced it. So the check
finds this about one run in six — it depends on whether chance deals a long class name to a long
house name that night. A check with that hit rate is not holding anything, and the anecdote it
produced is not a measurement.

**So the content space was measured instead of waited for.** 1,800 men dealt across 600 pit nights,
each man's two lines composed and measured at the row's own font, against a column read off the
live panel rather than estimated from the viewport. The second line — `class · house · record` — has
**263px of room, and the widest line the content space allows renders at 300px**. 110 of the 1,800
(**6.1%**) lost some of it. Both lines wrap now, which is what a fix on this same panel already did
one level up; the note there says so.

**And the cause is a release we shipped two weeks ago.** The menace word sits on the right of that
line with `flexShrink:0`, so it takes its own width out of the span beside it. v2.71.0 gave the
menace scale two more bands, and the words it added are **Murderous at 53px** and **Peerless at
40px** where the top word had been **Lethal at 31px**. With the narrowest word on the right, **0 of
the 1,800 are cut off**; with the widest, 110 are. A release spent giving a scale more resolution
took 22px out of the line next to it, and nothing in the suite connected the two.

**One figure retracted.** The first draft of this said the name line was cut off for 6.6% of men
too. That came from a ruler estimating its column at 175px; driven with the longest name against
the longest nick, the name fits, and the revert run clips three spans, all of them the second line.
The 6.6% was the probe's. A width estimated by arithmetic is a guess; a width read off the element
is a measurement.

**The 43rd check, `room`,** composes the widest line the content space allows — longest class,
longest house, a record in double figures, a kill count, longest name against longest nick — and
forces the widest menace word beside it, so the next time a scale gets a longer word the row it
shares is measured with it. It reads `ORIGINS`, `NICKS`, `SMALL_HOUSES` and `CLASSES` off the handle
rather than sampling 300 generated men, which is how its first draft set its own bar by chance and
got a different longest name every run. Reverting the wrap fails it every time, on all three men at
the rope. Because the wrap leaves nothing bounded to measure, it also asserts the whole of both
lines is *on* the panel — a clip count of zero must not be able to pass by absence.

**And one thing left open rather than dressed up.** `sand` has a second failure mode, seen once in
six solo runs: `the pits: nothing would send them out after choosing 0 and 0 steps — on screen:
btn: · btn:‹ BACK`. An overlay with the wizard's chrome and an empty body. The obvious theory —
that the wizard's kind chain has a path that renders nothing — is **refuted**: the step dispatch is
total (`step===0`, `step===1`, `else`) and the else covers all five kinds `goPick` can be handed
(`pits`, `single`, `pair`, `melee`, `hunt`), so `body` is always assigned. The cause is unknown and
is written down as unknown.

### v2.73.0 — The week's one question was never drawn fairly

First item of the v2.72.0 audit, and it turned into something the item had not predicted. #108
asked why the careless and idle arms met wholly different content — `plea` 0/0/11, `feud` 0/0/8
against `kinReturn` 14/12/0 — at a nearly flat rate. Most of that is **by design** and the item's
own falsification clause says so: measuring how often each event was *eligible* rather than how
often it fired, the states genuinely differ (`ludusNight` eligible 5% / 5% / 51% of weeks, `affair`
43% / 41% / 100%, `auctoratus` 100% / 100% / 29%). An idle house has fevers and affairs because its
men are idle; a busy one has contracts and kin at the gate. That half is refuted.

**But reading `pickEvent` to write the measurement found the chooser itself was broken.**

    const keys = Object.keys(EVENTS).sort(()=>R()-0.5);

That is the classic broken shuffle. A comparator must be consistent; one that ignores its arguments
and returns a random sign leaves the outcome to the sort's internal access pattern, and V8's TimSort
walks an array in a fixed order, so keys stay near where they started. The list is the declaration
order of `EVENTS` — so **what the game asked you depended on where in the file the event was
written.** And the file already contained the correct shuffle: `shuffled()` is a Fisher–Yates,
written for the melee, used in nine other places — the feud's cause, the refusal's reason, the
slavers at the block, the platforms at an election. The one draw that decides what the game says to
you this week was the one that did not call it.

**How big, stated carefully, because the first figure measured was four times too large and nearly
got reported as the finding.** Over 20,000 draws of the real 57-key list the old line put a key
*first* between 1.05% and 5.38% of the time — a 5.1× spread. But `pickEvent` takes the first
*eligible* key, not position zero, and that washes most of it out. Taking the first eligible key,
40,000 draws each: two adjacent events **1.03×**, a contiguous block of six **1.14×**, two at
opposite ends **1.27×**, six scattered evenly **1.35×**, and the seven a real house actually had
**1.39×** — against 1.01× to 1.06× for a real shuffle. So the fault is a **1.3 to 1.4× skew toward
events written earlier in the file**, and it is worth fixing at that size rather than oversold above
it. After the fix, on a real house at week 11: 14 events eligible and all 14 drawn in 2,000 draws.

The 42nd check, `draw`, holds the shuffle uniform and holds the statistic that actually decides what
is asked — the first eligible key, in the three eligible-set shapes that separated the broken sort
from a real one. Reverting the comparator fails it at 5.8× with all three shapes named.

**And one thing the check deliberately does not claim.** The sweep that opened the item found
`bodyguard` eligible in 43% and 41% of two arms' weeks and asked **zero times in 272 house-weeks**.
That is not explained by this fault — `bodyguard` sits early in the list, where the broken sort
*favoured* it — so it is either small-sample noise or something else, and it is recorded as an open
question rather than dressed up as evidence for a fix it does not support.

### v2.72.0 — Two of form's five words had never been said

v2.71.0's `menace` fault was the third of one shape: #79 fame ran past the last thing that read
it, #85 the street finished loving you by year eight, and `menace`'s top band began at mean 66
while the game's men run to 99. Three of a shape is a pattern, so rather than wait for the fourth,
this sweeps **all seventeen word-scales in the game** — every bucketed word a player reads and
acts on — against the range its quantity actually takes in play.

**The fault it found is the mirror image of `menace`'s.** Where `menace` had one word swallowing
the top, `formWord` had two words that were never said at all. Its bands were 58 and 24, and
`formWeek` decays every man every week by `f*0.78 - 3` against the +24 a win at the great games
gives. So three straight wins — which is the example the lesson about form gives, *in those words*
— comes to 15.7, then 28.0, then **37.6**: one band short of "in form" at 58. The only road to 58
is a win EVERY week, whose fixed point is 71.5, and fatigue, the card and the infirmary see to it
that almost nobody does. Measured over **4,862 man-weeks** of a house that fought whenever it
could: form ran from **-50.5 to +42.4**, "in form" was said **0 times**, "shaken" **0 times**, and
"level" covered **97% of every man-week**. Five words, three of them ever used, and the promise in
the lesson landed a band above anything the engine produces. The bands are 34 and 14 now, where the
quantity lives. Nothing about what form DOES has changed — still ±3.6% of power at the extremes.

The 24 also lived, bare, in two other places: the lesson's own `when` gate and the tag on a man's
row. Both read `FORM_TELL` now, so the tag cannot light on a man the game has nothing to say about.

**And four things the sweep did NOT find, which took as long to establish.** `houseWord`'s top two
bands were unseen in 2,310 samples at a maximum warmth of 43.4 — but warmth rises 1.1 per *meeting*
with a house whose grudge is under 30, plus 6 to 16 from rival-relationship beats whose `need` gates
six houses had not met in 160 weeks; not reached in that sample is not unreachable, and it is not
claimed. `pietyWord` sat at 30 for all 960 weeks because the probe never made an offering, which is
#91's finding and not the scale's fault. `cityFavWord` took no samples: nothing toured the coast.
And `fanWord` and `wearWord` hold most of their mass in one word because most men are unknown and
most steel is serviceable — the game being steady, not the word being wrong. Which is why the 41st
check, `scales`, asserts on **reachability** and on the share of the **range**, and only reports the
mass.

**One note on the check's own bar, because the first version of it was too weak to catch the bug it
was written for.** It began by asserting only that three straight wins should not read the same word
as a man who had never fought — and the old bands passed that, because 37.5 was "sharp". The bar is
now the game's own promise: the lesson says "three straight wins and he walks out expecting to win",
so three straight wins must read as the top of the scale. Reverting the bands fails it with that
sentence.

### v2.71.0 — One word covered the whole top of the game

`primusMine`, `primusEligible`, `primusWeek`, `PRIMUS_GATE`, `seedPrimus`, `makePrimusOffer` and
`makeDefenceOffer` went onto the test handle in v2.64.0 for the express purpose of being checked.
Six releases later the coverage sweep still listed every one of them as never called. The primacy
is the top of the Capuan ladder and one of the two roads to Rome, and #88 found `flags.primusHeld`
read in four places and written in none, so no save in any version could reach the imperial games.

**Four rounds of measurement, three of them about my own probe, which is the normal ratio here.**
Over 490 house-weeks the whole gate stood open in 22.2% of weeks, 23 primacy offers came, and the
title was taken **0 times** — with our man dying in 6 of the 20 bouts fought, and eighteen of those
twenty quoted at **3 or 4 per cent**. That is evidence about the probe first. Side by side, my man
was mean 65 and thirty-four years old while the primus climbed 67 → 78 in twelve weeks: the policy
was buying the best mean on the block, which on a veterans opening buys men already past PRIME.
**REFUTED** by construction at the ceiling v2.68.0 proved reachable — a yard at mean 99 is quoted
**98%** and takes the crown in **91.7% of 120 bouts** with no deaths; even a mean-65 yard is quoted
53% and wins 57.5%. The primacy is not a wall. It is arithmetic, and the arithmetic was mine.

**And the thing that was actually wrong, which none of that was looking for.** `readMatch` — the
per-man reading on the pick screen — returns a real word only when you have PAID to have the man
watched, and the `wall` measurement says a house holds a fresh reading on **15.3%** of the men it
is offered. For the other 84.7% the screen says "no read". The one thing given free is
`menace(o.opp)` on the offer — "looks lethal" — and its table ended at mean 66 while the game's men
run to 99. Measured against one man at mean 92, walking an opponent from 36 to 99: **"Lethal"
covered mean 66 to 99, a quoted chance of 96% down to 13% — 83 points of difference inside one
word.** Every hard decision in the game lives in that bucket: the primacy, the fourth rung of the
bill, the imperial games, the whole elite pool. Meanwhile three words split 40 to 66, where the same
man is quoted 97% throughout and nothing is at stake.

Two more words, pitched where the quote actually turns — **Murderous** at 78 and **Peerless** at 90.
The bands now read 11, 29 and 24 points of quoted chance instead of 83 in one. The 40th check,
`crown`, drives the primacy end to end — the gate, the city seeding its own holder, the offer, the
bout, the reign, the flag Rome reads, a defence, losing it, and the second-best man in your own
cells asking for it (52 weeks in 400, the channel #92 gave him) — and holds every word of the free
reading to covering a band where the quote actually differs.

### v2.70.1 — Eleven functions were everything you do with another house's men, and nothing watched any of them

The coverage sweep names the handle functions no check has ever called — 84 of 257 after v2.69.0.
Eleven of them were one system: `scoutMan` to watch a rival's fighter over his own wall, `setPrep`
and `stopPrepFor` to drill one of yours against him, `startCourt`/`courtCost`/`courtWeek` to put a
word in his ear, `buyFromHouse` to buy him outright, `nameHim` to call him out, `makePeace` to pay
his lanista off, with `houseOf`, `rateMan` and `gladValue` underneath. That is not a corner of the
game: measured over 780 house-weeks, **98.6% of the single offers on a Capuan card are against one
of these named men**. It is who you fight.

**Two hypotheses, both refuted, and the numbers are the point.**

*The drill is a trap.* `prepFor` pays only when the offer's `oppRef.fid` is the man drilled
against, and the source says so out loud — "it is a week a man does not get back if the bout never
comes". Measured over 147 drills: the bout came for **21.1% at a median of 3 weeks**, and 19.7%
lapsed. One drill in five paying inside a month is a bet, not a trap.

*The top of the scale is unreachable.* The first sweep watched a drill lapse at five weeks of six
because the rival's man left his house's card in the sixth, and `prepLive` drops a drill when he
does. Over 60 drills: **30 reached PREP_MAX, 50%**, median weeks reached **6**, and the chron line
that fires only at the top was written 15 times. A rival's man stays on his card a median of **21
weeks**. The anecdote was an anecdote.

**And the bargain, now measured rather than asserted.** A reading costs about 147 denarii and keeps
ten weeks. A full six-week drill takes a man from **+9.5 stat points at the post to +6.3 while he
is on somebody else's habits** — a third of his own progress, which is `PREP_DRAG` 0.62 doing
exactly what it says — and buys him up to +14% power and −9% stamina drain in one bout against one
man. Against anybody else it is worth nothing at all, which the 39th check now holds.

`prepOf`, `prepFor`, `prepEdge`, `prepPlans`, `PREP_MAX`, `PREP_DRAG`, `scoutLive`, `SCOUT_KEEPS`
and `scoutCost` go on the handle, because a check could reach `setPrep` and then had to infer what
it had bought. No behaviour changed; the shipping page differs only in its version stamp.

### v2.70.0 — The guide's second step and its tenth were arguing, and nothing had ever driven the guide

The CHARTER is the only thing in the game that tells a new lanista what to do next, it is eleven
steps long, and until this release nothing had driven it — it was not on the test handle, and
`haveWatchedOffer`, which is the whole of step eight, had never been called by any check at all.
The coverage sweep had been saying so for twenty releases.

Its shape is much less forgiving than the lessons' queue, and that is the point of this release.
`charterWeek` walks forward from `i` and stops at the first step that is not done, so **step k+1
is never shown until step k is**. A lesson that cannot be reached costs one note. A charter step
that cannot be finished costs every step behind it, plus the year-end 250 denarii and 12 fame.

**Two steps were arguing with each other.** Step two says *"take a bout at first blood — nobody
dies at those stakes"*, which is the right first advice to give anybody. A first-blood bout ends
**at** the first real wound, so nobody is ever on their knees waiting for the word from the box,
so it never reaches a crux. Measured at 250 pit bouts a stake: a crux in **0.0% at first blood,
53.2% at surrender, 67.8% sine missione**. And step ten is *"Let a beaten man up"*, which needs
exactly that moment and said nothing about where to find it. Over 40 houses following the guide
across all five openings: of the 10 that got past step ten, **not one did it by stopping a bout**.
All ten cleared it on its other clause — `activeG(d).some(g => (g.memory||[]).length > 0)`, a man
remembering anything at all, which `remember(d, g, "hurt")` writes when one of your own is carried
off. The step about sparing a beaten man was being retired by having a man wounded. And all **5**
houses still standing at week 40 without finishing the guide were sitting on it.

Step ten now says where the moment comes from, and its exit is the cloth itself with the year as
a backstop, so it can be neither retired by something unrelated nor left holding the last step.

**REFUTED, and the falsification was written first.** The reading that produced this item was that
the guide hides step nine — *"unrest is the only number that ends a run outright"* — from the
houses that need it: 21 of 26 dead houses were never shown it. The game's own code says no. `ruin`
is no men **and** no coin, `rebellion` is the unrest ending, and not one of the forty houses ended
in rebellion; they went debt 15, ruin 7, emptied 4. So the follow-up asked whether the guide's four
spending instructions teach a beginner to lose, with a stated bar of 13 points on 60 houses a side:
a reserve arm that would not spend below four weeks of the bill came in at **43.3% against the
charter arm's 48.3%, a difference of −5.0 points against one standard error of 9.1**. The guide is
not teaching anybody to lose. And the honest limit of that measurement is that **both arms spent an
identical median 490 denarii** — a four-week floor almost never binds in a first year — so the
hypothesis is untested rather than disproved, and it is written that way in the check.

**And a probe fault worth keeping, because it is the shape of most of them.** The first run reported
17 of 30 houses stalled on step six, *"Arm somebody properly"*. The step's own words are "buy a real
piece, **then** arm him off the rack"; `wears(it)` is `!it.stock && it.price > 0`; and the probe was
arming men off a rack of free house stock. The cheapest buyable piece is a pugio at 80 denarii
against an opening purse of 260 to 800. The step was never the problem.

The 38th check, `charter`, walks the prefix end to end, holds every step to being finishable by a
house doing exactly what it asks, keeps the stake sweep as a measurement, and asserts that no step
is retired by something it is not about.

### v2.69.0 — Four of five openings were never tested, and the note about the medicus was retired by hiring the trainer

`lessons` ended its report with a line reading *"9 state-gated ones were not reached by these
houses (their states may want a longer life)"*. That is not a verdict, and it could not become
one by playing from week one: the check's own houses reach week 47, and `book` wants 25 bouts,
`bench` an acclaimed house with a built armoury. Closing that gap found three shipped faults —
and one of them was sitting under the check's first section, which is the part written to prove
no lesson dies on arrival **in any opening the game has**.

**It had only ever seen one opening.** The section passes `["clean","even","uncle","onegood",
"oldguard"]`. The scenario keys are `clean, inherited, champion, veterans, castoffs`, and
`newGameState` ends `SCENARIOS[scen] || SCENARIOS.clean` — so four of its five houses were
A Clean Start with a different name in the log. Two releases of "no lesson is dead on arrival in
five openings" rested on one. Give it the real keys and it fails immediately: **"The Slaver's
Block"** — age is most of the price, a fighter is in his prime from 23 to 28 — was `done` at
*"the annals have an entry, or the house holds more than three men"*, and Your Uncle's Debts hands
you six men, The Old Guard four, Another House's Leavings five. Dead on arrival in **three
openings out of five**, exactly the `armory` fault of v2.65.0. Its other half was never a signal
either: `annalsSync` runs inside `endWeek` and writes an entry per man, so the annals are
non-empty from week two of every game ever played. The exit is now `flags.everBought`, written
where the buying happens, with a week-ten backstop.

**And "The Men In The Rooms" was retired by a man it is not about.** Its exit was *"a medicus, or
an armourer, or a doctore"*. The doctore is the trainer — a different person, off a different
market, on a different screen — and the charter's fifth step tells you to go and hire him. Its
door needed a built room. Measured over 30 houses following the charter, in all five openings:
the doctore arrives at **median week 4–8**, the earliest median for a first room in any opening is
**week 17**, and **not one of the thirty** got a room before it had staff of some kind. The note
stood open in 141 house-weeks of Your Uncle's Debts — the only opening that starts with a room already up — and in **zero
weeks of the other four**. **24 of 30 houses were never told**, and three of them hired the very
medicus the note describes. Exit is now the two men it is about; the door opens on a room or on
week eight, because the post is on the market screen from week one saying plainly that there is
nowhere to put him. Re-measured after the fix: **0 of 30**.

**A third, smaller.** "A Stone With His Name" opened at week 14 and the burial society costs 180
denarii, which every opening can afford in week one — so the door opened thirteen weeks after the
button. 2 of the 7 houses that founded it were never told what they had bought. The door is now
the price. And `hireStaffMember` now refuses a house with no room for him: the condition lived
only in the render, so nothing a player can reach was broken, but every lanista action in this
file is supposed to be a function of the save, and a probe that hired a medicus into a roomless
house reported a fault no game can have.

**REFUTED, at some length.** A sweep of one-action-per-house said "The Palus and the Pair" was
shut in week one by the charter's own first step — the two have literally the same test — and a
five-week trace confirmed it: the familia tab went `men` → `drills` and never said it. Over 20
played houses, **20 of 20 were told, at median week 4**. The trace was the thing that was wrong:
it took no bouts. Sparring hurts men, an injured man goes back to the post and his partner with
him, and the window reopens within a few weeks of any house that actually fights. The lesson is
delayed, not lost.

**What the check can now say instead of "I don't know".** Three new sections, none of which needs
a house to live long enough: every lesson is **constructed into its own window** and asked
(35 of 35 open, 35 of 35 then said with the tab to themselves — this is the section that catches
`wear`, whose two halves could not both hold in any state); **no ordinary week-one action may
shut a lesson while its own door is still closed** (the fatal case, which caught `staff`, with
every flip played eight weeks forward because a `done` on a threshold un-fires); and **from
inside its window with nothing read in front of it, the gatekeeper must reach it** — 29 of 35
said, median week 3, the other 6 being windows that close and reopen rather than expire. The
report's last line now reads that the eight state-gated lessons want a state these houses never
reached and that **each has been proved answerable** above it.

### v2.68.1 — The check was right and the alarm was mine

v2.68.0 closed by flagging that `survive` was scoring 2–3 of 5 houses where its own comment
predicted 3.5. Across a session's runs it went 3, 3, 4, 2, 1 — and the 1 failed. Thirteen of
twenty-five is 52% against a bootstrapped 70%, which has a 4.4% chance of happening if 70% is
true. Worth looking at. Nothing was wrong.

**The opening has not moved.** A fixed handle policy over 200 houses returns 72 standing, 36.0%,
with identical endings to one decimal on **four builds spanning v2.5x to v2.68.0** — the same to
the house. Identical means the RNG stream never diverged, which means none of those releases
touches a single code path a new house executes, `endWeek` included. That probe is now the
two-minute answer to "did I just break the opening".

**The bar is calibrated.** Re-bootstrapped by pooling four runs of the check itself on the
current build — its own browser policy, not a handle imitation: 5 + 2 + 3 + 3 = **13 of 20
standing, 65%, one standard error 10.7 points**. The original 70% sits inside that interval. The
1-of-5 was the false failure a five-house bar is designed to tolerate; at a true 65% it cries
wolf about one run in eighteen, and buying power with more houses would cost accuracy elsewhere
on a machine whose own notes record seven Chromiums on four cores making houses miss clicks.

**And one thing worth carrying forward, which is the opposite of what the table's headline says.**
Of the seven failures in those twenty houses, **five were the yard emptying and two were the
ledger** — and three of the five still had coin in the box when the last man went, holding 248,
360 and 96 denarii. The balance reference's "debt 85% of endings, the ledger is the competent
player's only enemy" was measured over long runs of a good policy and it is not true of the first
twenty-six weeks. Early, a house dies of attrition with money in hand. Both rows are in the table
now, in that order, because a reader who takes the second into the opening will tune the wrong
dial.

No behaviour changed. The measurements are in `survive`'s own comment, where the next person to
see a 1-of-5 will find them before going hunting.

### v2.68.0 — The balance table stands, and twenty houses cannot tell you anything about the late game

v2.64.0 found that no probe in this project had ever called `setFocusOf`: `palus` trains
whatever you point a man at and nothing else, so every man in every long-run measurement ground
one of six stats for his career. The probes were fixed. **The balance reference was not** — and
it is the table every tuning decision here is made against. Two of its rows had been used to
refute audit items: the fourth wing *"by 5 of 50, at week 258 — the late sink works"* (#104) and
*"debt 85% of endings, nothing else above 5%"* (#99). A house whose men train properly wins and
earns more, so both looked suspect in the same direction.

**The premise is refuted. The table stands.** Three training policies — never pointed, pointed
at his weakest stat, pointed at the weakest stat his class actually fights with — over 20 houses
each, twice, on different seeds. The fourth wing came out at **1 to 5 of 20 houses (5–25%)**
across the six arm-batches, straddling the published 10%; debt was **45–80% of endings** in every
arm, with the published 85% at the top of that range. Nothing here shows either row wrong.

**And the reason nobody should re-open it at this sample size is the real finding.** Within a
*single* arm, between two batches of twenty:

| the same policy, two batches | first | second |
|---|---|---|
| Rome letters (weakest stat) | 4 | **28** |
| primacy weeks held (weakest stat) | 0 | **159** |
| titles taken (weakest stat) | 0 | **11** |
| Rome letters (class's own stats) | 1 | **20** |
| the fourth wing, of 20 houses | 1 | 3 |

The between-batch spread for one policy dwarfs the between-policy spread inside either batch. The
lifespan distribution is why, and it is not a bell curve — it is a spike of houses dying inside
ninety weeks plus a handful that run to the four-hundred-week cap:

```
10 16 23 25 27 52 59 62 63 65 70 72 89 137 156 189 401 401 401 401
```

Of twenty houses, **4 to 7 ever reach week 150 and 4 to 7 reach week 258** — the week the table's
own row names. So every figure about the fourth wing, Rome and the primacy is generated by four
to seven houses whatever the header claims the sample is. A median over twenty is not a
measurement here; the effective n for anything late is single digits. Re-opening this wants
hundreds of houses, not twenty.

**A correction owed on v2.64.0.** That release reported that pointing the men moved v2.56.0's
primacy challenge from 0 asks to 2, and read it as the fix landing. Across these batches the same
policy gave **0 primacy weeks in one and 159 in the other**. The mechanism claim holds — a
pointed man's mean does reach the high nineties where an unpointed one sits in the eighties, and
that ordering was stable in every arm that lived long enough to show it. The *outcome* claims
attached to it were one batch each and were stated more firmly than one batch supports.

**One thing was worth fixing, and it is not a balance change.** The drilling grid is six
identical buttons. `power()` and `winChance` weight a class's own two stats, so which one you
press is the difference between a man who fights better and a man whose average goes up — and the
game already knows which two, prints them on the class picker two panels down, and never printed
them on the screen where the choice is actually made thirty-odd times a game. They are marked
`· his trade` now, and the justification is deliberately narrow: it is a fact about `power()`
and `winChance`, not a measured win rate. The figures do not support more. Across the two batches
the class-key arm's peak mean was 94.4 and **88.4**, against 86.7 and **88.6** for never pointing
anybody — no reliable gap. The arm that did reliably lift the mean was weakest-stat pointing
(91.5 and 99), which is what that policy optimises by construction and which the same batches
show buys nothing at the house level. Citing the 94.4 alone would have been the single-batch
overclaim this very release is about, and the first draft of this entry did exactly that.

### v2.67.0 — Nothing had ever rendered a round

Thirty-six checks. Thirteen of them call `doFight` and every one drives the engines in memory
through the test handle, reading the beats as data. Four drive a browser, and not one reached
the sand: `sweep` opens the wizard's first step and stops, `survive` clicks into a bout as a
side effect of its economy policy and never looks at what comes up. The most-looked-at screen
in the game had no test at all, which is why last release's React key fault was found by a
scratch probe taking a photograph of an axe.

**`sand` drives the whole arc in a real browser**: pick a card → pick the men → NEXT → SEND
HIM TO THE SAND → the rounds run → a crux offers its answers → answer it → the verdict →
RETURN TO THE LUDUS. One bout of **every kind the bill actually drew**, plus the pits:

| | rounds | cruxes |
|---|---|---|
| a single | 12 | 2 answered, 5 ways |
| a pair | 9 | 1, 3 ways |
| a melee | 11 | 1, 3 ways |
| a hunt | 6 | 1, 3 ways |
| the pits | 8 | 2, 7 ways |

And the record book has to go from 0 to 5 afterwards, because a screen that runs beautifully
and books nothing is a fault this project has shipped twice — the pair booked only its wins
and the melee only its losses, for fifty versions. The check also applies `surface`'s floors to
every overlay it passes through: the wizard's three steps, the sand, each crux, the night. Put
last release's missing `key` back and it fails with five page errors.

**It found a truncation on its first full run.** `HPBar`'s label was `nowrap` with an ellipsis,
which is right for "Gulussa" and wrong for "a full-grown bear of the north" — the hunt puts the
whole phrase in that slot, so the one bout whose label needs two lines was the one bout that
could not have them. Cut on the crux and on the night both. Also fixed: an inline
nowrap-and-ellipsis on the pits panel, which was overriding v2.66.0's fix to `.rowval`.

**Four of this check's five faults were the driver's, not the game's**, and they are the part
worth keeping:

- The arena tab's own CHOOSE A BOUT is a `btn-blood` — the same class as the wizard's SEND HIM
  TO THE SAND — so a driver reaching for "the blood button" closes the wizard it just opened.
  Six earlier attempts died on that. Everything acts inside the topmost overlay now.
- The melee does not draw two fighters. It cannot; there are up to six. It names its entrants
  as tags and strikes them through as they go out, and a flat "somebody is drawn" assertion
  failed on the one engine where the picture is a list.
- The pits offer the men at the rope in the same `.optrow` shape as your own roster, so a
  driver that picks "one row" spends it on the wrong list. It asks the wizard now — press the
  send if it is live, else advance, else choose one more — which needs to know nothing about
  which list is which.
- **Five bouts through one week's screens is five bouts a real house would spread over five
  weeks.** The roster was spent by the fourth and the wizard offered an empty list; the driver
  reported "nothing would send them out", which is a shrug and not a finding. It stands the
  yard back up between bouts, and it now prints what was on screen when it gets stuck.

And the bill's shape is chance — one run offered three singles and a hunt, the next a pair and
a melee — so what the check covered moved run to run while the report said nothing about it. It
draws until the bill holds the most kinds it can find (four, over about 25 weeks), deals the
roster on purpose so the beast card has somebody eligible for it, and then demands every kind
it drew. A check that asks for "at least two" quietly becomes "the pits, once" the week
something breaks, and reports a pass.

### v2.66.0 — Four things off a phone screen

All four reported from a real save in year twelve, which is most of the point: none of them
were reachable by a check, and two of them were not reachable by any state a check had ever
constructed.

**The axe was a labrys.** It had been fixed once already — the original head curved out to two
horns and bit inward, so the cutting edge was scalloped hollow — and the fix flared it to a
convex bit **symmetrically about the haft**, which at the size a man actually carries it is
the silhouette of a double-headed axe with no telling which way it cuts. A securis is
one-sided: narrow at the eye, a blunt poll behind, and the whole of the steel hanging to one
side. Four candidates were drawn and rendered at true size (the Fighter's box is 128 units
wide at 118px, so one unit is 0.92px) and mirrored, because side B is flipped by the parent.
Three of the four read as a frying pan; the straight top edge is what makes it an axe rather
than a blob on a stick. Two versions of this weapon have now shipped wrong for the same
reason — drawn in coordinates and never looked at.

**The tab badge would not go out.** It counted the agenda's loud items for a tab and showed
whenever that count was above zero, so walking into the armoury and back out again left the
"1" exactly where it was. Looking at a thing does not answer it — but a mark you cannot clear
is a mark you stop believing, which is the whole of what it is for. What is ASKING is part of
what "seen" means now, and only **additions** count: a new item lights the tab, an answered one
going away does not, which is the lesson the Arena taught in v2.62.0 where 42% of that tab's
changes were the card being consumed rather than a new one arriving. Urgency is part of the
key, so a levy moving from "next week" to "due this week" is a new thing asking.

**And a mark on the Villa pointed at four screens.** The villa has four faces behind its own
switcher — twenty-three sections across them — so a badge on the tab dropped the player on The
House to go hunting while the thing sat on Coin & Council. Each face carries the loudest mark
of the sections that live on it. Faces carry only what is asking: carrying the plain
availability dots up as well ("you could found the burial society", "the altar is rested") put
a permanent dot on two of the four, which is the same fault one level up.

**And nothing is allowed to cut a word in half.** `.rowname` and `.rowval` carried
`white-space:nowrap` with `text-overflow:ellipsis`, and between them they were most of the
truncation in the game: "House Glaber…", a lanista's line stopping at "who bought i", and a
fame of 23,703 rendering "237…" — that last one from a `max-width:64%` inside a flex row whose
width comes from its own content, which resolves against a box that has not been sized yet and
clipped the number to about forty pixels with empty space beside it. A name wraps now; a value
keeps `nowrap`, because a number broken across two lines is its own kind of unreadable, but is
never capped and never elided. The league table's rows were restructured so the figures and
the names stop competing for one line, the masthead puts the house's title on its own line
rather than clipping it, and three chip rows wrap instead of scrolling off the edge.

**What made all four invisible, and what now finds them.** `surface` measured six tabs of a
house **twelve weeks old** — short names, three-digit numbers, one face per tab, and no record
sheet ever opened. It would have passed the whole way through this. It now grows the house to
the size a long game reaches before it measures anything, walks every face of every tab
(10 screens instead of 6), opens all nine record sheets, and fails if any element is clipping
its own text — `scrollWidth > clientWidth` on anything that is actually hiding overflow. Put
the old CSS back and it names both reported symptoms exactly: a `.rowname` cut on a lanista's
line, and `.rowval` hiding 13px of `23703`.

Extending that coverage immediately found two things nobody had reported. A **25px** control on
the doctore's board — the one button that opens a man's page, against a 44px thumb floor — on
the tab face `surface` had never visited. And on the bout wizard, `occRow` returned a
`<button>` with no `key` and is called from four `.map`s, so React warned on every render and
reused the wrong DOM node when the bill changed: no check has ever rendered a bout in a
browser, because `card` and `engines` drive the engines in memory and `sweep` opens the
wizard's first step and stops. That gap is now written down rather than fixed.

### v2.65.0 — The gatekeeper could not say a third of what he knows

Thirty-six checks, and every one of them drives the engine. Not one had ever asked what the
game *says*. So this release reads the first hour the way a person who has never seen it reads
it: a week is a minute or two of play, so the first hour is about the first thirty weeks, and
the questions are what the list names, what the gatekeeper offers, and whether a beginner is
ever told the things a house must do to still be standing.

**First, the disproved premise, which is the good news.** All four of the things `survive`'s
policy must do to keep a house alive are named by the agenda, early: buy a man (median week
**1**), set the week's work (**1**), take a bout (**2**), watch the cells (**3**), across 14
houses. No week in 420 was silent. The game does teach itself. *(And the first version of this
measurement said "take a bout" was never named until week 29 — because my pattern missed "3 at
the rope in Sextus' cellar", which is the pit, and the most frequent thing the list ever says.)*

**Sixteen of the thirty-five lessons could not be reached by any player.** The gatekeeper shows
ONE lesson per tab — the first that is unlearned, whose `done` test is false and whose `when`
gate passes — so thirty-five lessons across six tabs is a queue with expiry windows, and that
shape loses lessons three distinct ways. All three had happened:

- **Dead on arrival.** `armory` — "Steel and Style", which is how kit works and why a net-man
  in a legionary's shield is worse than useless — tested `Object.keys(d.gear).length > 0`. All
  five openings hand you a rack: clean `{gladius 2, hasta 1}`, even, uncle, one good man, old
  guard. So it was `done` in week 1 in **every scenario the game has**.
- **Door behind exit.** `wear` opened on a man *wearing* bought steel and closed on `gearCond`
  having an entry — which buying writes instantly. Driven through fresh → bought → equipped,
  `when` was never once true while `done` was false. It closed before it could open.
- Between those two, **the armory tab offered a new house no lesson at all**: three written for
  it, none reachable. Confirmed by putting the fault back — the check now prints `armory —
  NOTHING`.
- **Queue-starved.** `scout` — how much the seller is overstating, which is the single most
  useful thing a beginner can be told at the block — was **eligible in 12 weeks across twelve
  houses and offered in 0**. It was only ever open while `market` was open in front of it, and
  the week after you read `market` it was already done (`annals >= 2`).

All three are fixed by making each lesson's exit the thing the lesson is *about*: owning bought
steel, having seen a piece come back worn, having paid to have a man looked over. That last one
needed a flag, because three of the five openings hand you an already-scouted man and
`some(m => m.scouted)` was true in week 1 of those three — a fault the new check caught in my
own fix. A reader who reads everything now reaches **26 of 35** in 47 weeks, and every one of
the eleven lessons with no state gate is offered, first at weeks 1–7.

**And the list outranked itself.** "Nobody in this yard can teach" stood in **354 of 354**
first-hour weeks — 100.0%, the most frequent line in the game — at urgency 2 in nearly all of
them. The first guess was that it nagged about a man nobody could afford; gating it on
affordability moved 100.0% to 98.9%, because a young house *can* afford the cheaper of the two
almost every week and simply has not hired one. So the frequency was never the fault: the line
is true and actionable every week. The urgency was. A permanent item ranked "answer this" sits
above the week's actual news for as long as the player declines it, and 93.2% of first-hour
weeks already carried more than three items. It is news for a season and a standing note after.
Measured, same seeds, same policy, one expression changed — and `add` consumes no randomness,
so this is one of the few genuinely paired comparisons this project's RNG allows:

| | before | after |
|---|---|---|
| loud items a week, first 30 weeks | 3.57 | **2.94** |
| weeks carrying more than two | 81.1% | **58.8%** |

New check `lessons` — the first in this project that reads the gatekeeper instead of driving
the engine. It asserts that nothing is finished before week 1 in any opening, that every tab has
something to say to a new house, that a lesson's door is not behind its exit (driven, by buying
and equipping a real piece of steel), and that every ungated lesson is actually offered to the
most attentive reader possible. `glance` now measures the first hour's crowding and fails if
the ranking stops ranking. `agenda` passed 200 lines again and `agendaSquare` was lifted out.

### v2.64.0 — A screen nobody could look at, and the reason nobody looked

A consolidation pass over the eleven releases since v2.52.0, asking one question of each:
*does this fire in real play, and how often?* Every one of them has a check and every check
passes, but a check proves a mechanism in a state I built — which is how v2.55.0's street fix
shipped inert, verified against a house whose best man had renown 90 when real ones carry
100–400. Anything at zero here is inert whatever its check says.

The pass found one crash, one dead constant, one line firing far too often — and, underneath
all three, an instrument fault big enough that it had been quietly producing wrong answers
for the whole audit series.

**The temple had no screen for a house with a vow standing.** `VOW_BLESS_AT` was read at
one line to colour the vow panel and declared nowhere: one occurrence in the file, one in
the built bundle, no binding in front of either. Any house that had sworn a vow and opened
the temple hit `ReferenceError: VOW_BLESS_AT is not defined` inside the render and got
nothing. It shipped in v2.62.0, the release that added that very panel. Confirmed by putting
the fault back: **nine page errors and a blank tab.**

Why neither check saw it is the more useful half. `temple` knows all about vows and settles
them by calling `resolveVow` directly — it renders nothing. `sweep` renders everything and
never had a vow. One check had the screen and no vow, the other had the vow and no screen,
and the crash sat in the gap between them for a release.

And `sweep` was not rendering everything. Three tabs are split into faces by their own
switchers — the villa has four, the familia two, a man's page several — and only one face is
mounted at a time. `sweep` clicked the tab and opened whatever collapsibles were in the DOM,
which on the villa is **4 of the 23 sections written for it**, then reported `villa (+4
sections)` and passed. That reads like coverage and was 17% of one tab. The temple is in the
villa's *Standing* face, so the check whose entire job is "does any screen throw" had never
once rendered it. It now walks every face, reports the count per face so a collapse back to
four is visible, and takes a second pass over the villa with a vow actually standing at three
cards and at eight — the two sides of the branch.

**`VOW_EARNT_AT` was a threshold nothing was ever below.** It was 2. `bookBout` counts every
card fought while a vow stands and a vow stands a month, so any house that fights at all
clears it in a fortnight. Measured over **31 vows settled in 1,611 house-weeks**: the fewest
cards under any vow was **three**, the median **eight**, and not one came in under the bar —
so `earnt ? 16 : 5`, the patron warmth behind it, and a paragraph of chronicle written for
the shrugging case could never once resolve the second way. It is now `VOW_BOUTS_FULL`, the
same six the purse is capped at, which is the only line in this system that ever meant
anything: the vow was carried in full, or it was not. At six it bites **8 of those 31 (26%)**
and the panel's countdown can finally count. `temple` now takes its card counts off the
constant rather than a hardcoded 5 — the number that silently stopped meaning "a month of
hard cards" the moment the dial moved — and asserts that one card short pays less.

**The rival's man stood in 36.7% of weeks.** v2.63.0's courting line was gated on a roster
with a free cell and a rival who had somebody better, which is nearly always true, and it was
approved on "+0.08 items a week" — a figure from comparing two *different* twelve-seed
batches, the invalid method this project's own notes warn about. Counted directly in one
batch it stood in **36.7% of weeks**, the most of any of the eleven releases' six lines. It
now also asks that the house be short-handed — fewer than three men fit to fight — which is
when another house's man is actually the answer: **13.0%**, and at urgency 1, which the badge
ignores. The best rival man is a median **1.43×** the player's best, so no amount of raising
the quality margin would have fixed it.

**And the thing that had been wrong all along: no probe in this project had ever pointed a
man at a stat.** `palus` is `focus:true` — it trains whatever you point him at and nothing
else. Every audit probe set the regimen and never set the focus, so every man in every
long-run measurement trained one of six stats for his entire career. What that did to the
answers, same seeds, same policy, one line added:

| | never pointed | pointed at his weakest |
|---|---|---|
| best man's mean stat | 79 | 84.9 |
| weeks the player holds the Primus | 0.00% | 2.98% |
| reigns past the challenge's 6-week wait | 0 | 16 |
| **v2.56.0's primacy challenge asked** | **0** | **2** |
| best win chance on a title card, max | 14.6% | 56.8% |

So the consolidation's own first finding — *v2.56.0 shipped a channel for a state the player
cannot reach* — was **refuted by the probe that produced it.** Isolated further: a young man
with a doctore and a full yard, pointed at his weakest stat each week, reaches mean **99 by
week 149 aged 28**, exactly the ceiling the city's best reaches. Gap at the peak: **0.0**.
The growth model is fair; the probe was starving its own men.

**Also measured and left alone.** `MARK_NEED.arm = 58`, the suspect #102 named and never
tested: the arm lands in **37.9%** of bouts against legs 40.3, head 40.6, body 35.1 — the
balance the split thresholds exist for — and flattening it to 26 puts it back to **81.9%**,
the original fault. Mortality does not move with it at all (15.4 / 16.7 / 13.6 / 17.6% across
four thresholds; the standard error on a 15% rate at n=700 is 1.4 points). `marks` pins it
now, by swinging the threshold inside one page load. And `succeed` — reported dark by the
consolidation probe — is reachable: **2 of 14 houses reached generation 2**. That probe had
simply never named an heir, and succession is gated on `d.heir`.

Confirmed load-bearing in real play, for the record: `recordCloth` (39 pair cloths and 9 hunt
cloths, all of which recorded nothing before v2.58.0), `ROME_RANK` (5 rank-4 letters against
5 primacy letters — v2.59.0's second road carries half the traffic), `PIETY_TOP` (55 offerings
past the cap against 46 under it), `DEBT_STAGE` (19 / 11 / 16), `warElsewhere` (7).

### v2.63.0 — The war does not have to be your gate

Audit items #98 and #103, and both of them turned out to be about the door rather than the
room — which is what their falsification clauses were written to find out.

**#98. The Spartacus war works perfectly and had exactly one way in.** Four named stages
across fifty-eight weeks, standing decay, a rising defiance floor because the men watched it
done, a block that swings from ×1.25 to ×0.55, and four events of its own. Driven four times
by forcing the Night of Fire and opening the gates: **all four runs reached all four stages,
ran the full fifty-eight weeks and resolved**, and carried standing from 70 down to between
9 and 23. There was never anything wrong with the arc.

What was wrong: `spartacusAtLarge` — the only flag `warWeek` reads — was written in exactly
one place in twenty-three thousand lines, the "Open the gates" branch of `uprising`. So the
whole subsystem sat behind driving a rebellion to its last night and then choosing the branch
that costs you the house: measured, **nine men to three, plus thirty fame**. Across 48 houses
run four hundred weeks on a good policy the four war events fired **not once**, and rebellion
was the ending for two.

A lanista in Capua in 73 BC did not need it to be his gate. It was Batiatus's gate and every
other house on that hill lived through the same three years. So the war can arrive as news:
a rising somewhere else that got away, once in a run, after week 60, naming the house it
broke out of and putting three points of defiance into your own cells because the men hear
about it too. Your own gate is still the worse road — it costs the men, the thirty fame, and
the line at stage three about nobody having forgotten which gate he walked out of.

Measured after: **45% of houses that live past the gate see the war, and 4 of the 7 that
reach week 250**, breaking out between weeks 101 and 190, every one running its fifty-eight
weeks and resolving. Dials: `WAR_AWAY_AT`, `WAR_AWAY_ODDS`.

**#103. Courting a rival's man works and nothing ever mentioned it.** `courted` fired 0 times
in 4,908 house-weeks and six of the arc's functions were dark. Its falsification came back
the way #95's did: a policy that deliberately courts lands the man — over 2,000 weeks, **26
approaches, 14 landed**, none caught, nine let go. A 54% arc at about 500 denarii a try,
finished and invisible.

So the agenda names it, gated on having somewhere to put him — a full house hears nothing,
which is self-limiting in exactly the way #101's permanent badge was not. Measured at
**+0.08 items a week**, which is the difference between a prompt and wallpaper, and at
urgency 1 because a rival's man is an opportunity rather than a problem.

`war` (new, 35th check): both roads into it; that the news road refuses a house in its first
year, refuses one whose own cells are already rising, and never starts a second war; the four
stages arriving in order on their own clock with the block swinging across them; the defiance
floor; and the one thing that must never be true of a fifty-eight week arc — that it can fail
to end, which is the v2.53.0 fault where a house sat at Rome for ever, nine times longer.

**And #105 was refuted by its own clause.** The feast reaching 10 houses in 24 was a fact
about the probe managing its yard well, not about the feast: driven with a deliberately
inattentive policy over 2,000 weeks, unrest sits past the feast's gate in **57% of weeks** and
a feast is both wanted and affordable in **59%**. Nothing to build. Worth keeping: an
attentive house genuinely avoids unrest 35 almost entirely, so the feast is a lever for a
house in trouble rather than a routine expense — which is good design, now measured.

### v2.62.0 — A vow is a gamble, not a way to buy a blessing

Audit items #100 and #101, both of them faults this project shipped in the two releases
before it. The v2.61.0 audit's first job was measuring its own recent work, and it found
two things wrong with it.

**#100. The vow's odds run steeply with house quality and v2.60.0 removed the
counterweight.** Measured over 200 vows across ten houses fighting a real card, with the
settlement read off `resolveVow` rather than across the weeks it takes to come due:

| fame | sworn | kept | staked | back | net |
|---|---|---|---|---|---|
| under 300 | 74 | 34 (46%) | 17,141 | 11,516 | −33% |
| 300–1,600 | 82 | 52 (63%) | 51,144 | 47,027 | −8% |
| past 1,600 | 44 | 36 (**82%**) | 48,840 | 55,944 | **+15%** |

The falsification clause asked whether that was the probe's card policy rather than house
quality — a great house fights MORE, so it ought to lose a man MORE often. Settled: deaths
per bout falls **4.7×** as a house improves (0.168 under fame 300 against 0.036 past 1,600)
and a great house also fights *fewer* bouts a week (0.37 against 0.74), because it is away
at Rome or holding the title. Predicted keep rates from those two figures alone: 54%, 80%,
94%. It is structural.

Before v2.60.0 the stake climbed with fame without limit, which partly offset the improving
odds. Capping it at `PIETY_TOP` took that away and nothing was watching.

So a kept vow now pays **what the month actually risked**. Every engine records through
`bookBout` and nowhere else, so that is where a standing vow counts the cards fought under
it: par at nothing ventured, 1.6× at six cards. **And the blessing comes out of it
entirely** — that was the real prize and the real fault. A house past the cap collected 36
free four-to-six-week blessings across 44 vows, so it never once needed the altar the
previous release spent itself repricing. Two systems and one of them free. Now the vow is a
gamble on your own men and the altar sells blessings, and they have stopped being
substitutes. Measured after: the great house's edge is **+4%** and the free blessings are
gone. Dials: `VOW_BOUTS_FULL`, `VOW_EARNT_AT`.

The small house's −33% is left alone deliberately, and disclosed instead. A house burying a
man a month cannot honestly promise that none will fall, and the screen said "the coin
returns doubled in goodwill" — which is a rosy way to describe a bet you lose 54% of the
time. Both the ask and the standing-vow panel now name what the house has been risking, in
its own recent dead and its own cards fought.

**#101. The marks from v2.61.0 were lit most weeks.** Arena fresh in 72% of weeks, Familia
68%, Market 51%, and the Familia tab carried a mean 2.98 items. Two separate causes, both
measured before either was touched.

The badge counted **every** agenda item, urgency 1 included — and `1|men` alone runs at 2.28
items a week: four standing lines about men not sworn in and moves not taught, which persist
until you act and never clear if you have decided against them. The agenda holds 7.86 items
a week but only **3.64 at urgency 2 or 3**, so the badge counts the loud ones now, which is
about six tenths of an item per tab. The quieter ones are still on the agenda, which is where
a list of what you could get round to belongs.

And the Arena reported the card's **disappearance** as news, at exactly the rate of its
arrival: 352 arrivals against 352 disappearances over 1,200 weeks of a fighting house, so
42% of its freshness was the absence of news. A tab with nothing on it cannot be fresh now
(`TAB_QUIET`), and the next card still lights it because quieting does not overwrite what
was last seen.

Measured after: Arena 72% → 43%, and the badges from 2.98 / 2.07 / 1.44 to 0.34 / 0.76 /
1.21. Familia freshness is 63% and **left there on purpose**: driven per-part in a house
that fights, it is the roster that moves — men dying, men bought, men freed, in 75% of
weeks. Pulling the fit list out on suspicion moved the figure four points and cost two real
signals (a man carried off, a man coming good), so it went back in and `glance` holds it.
A house that gains or loses a man most weeks has news most weeks; #99 says 44% of houses die
inside a year, so that is the game's texture rather than a leak.

### v2.61.0 — You can see what is new without opening all six tabs

Not an audit item — a thing the game plainly needed. The agenda has known what wants an
answer and which of the six tabs the answer is on since v2.57.0, and the only way to find
out was to open all six, every week. So there are marks now: a count on the tab bar in the
agenda's own urgency colours, a quieter gold dot when something has merely **arrived**, and
the same pair on the folded panels one level down so you can see which of eleven it is. The
tab you are on never wears one — you are looking at it.

**The interesting part is how freshness is decided.** The obvious build is a
`touch(d, "arena")` call wherever something arrives: twenty-odd call sites, every one a
chance to forget, and a forgotten one is *invisible*, because a dot that never lights looks
exactly like a tab with nothing in it. That is the shape of the v2.59.0 paragon fault — one
part of the week writing and another quietly undoing it — and it is not a mistake worth
making twice.

So freshness is **derived**. Each tab has a signature over its discrete, player-facing
state: the week the card was drawn and the ids of the bouts on it, the ids on the block,
which men are fit, which patrons are asking, whether the altar is off its rest. The save
stores the signature that was current when the tab was last looked at, and the tab is fresh
when the signature has moved. Nothing has to remember to announce itself.

The discipline that makes it work is in what the signatures **do not** read. Fatigue
creeping up, unrest wandering, coin arriving and fame climbing are all deliberately absent:
a signature that reads anything continuous marks its tab new every week for four hundred
weeks, and dots that are always on are worse than no dots at all. `glance` asserts both
halves — twelve arrivals that must light their tab, five kinds of drift that must leave
every tab dark.

**And two things you could simply do.** Sixty lines on the agenda and every one of them was
a problem, a deadline or somebody asking — nothing was ever "here is a thing that would
help". So the cells would take a feast now says so, with the cost and how many men it
reaches, at urgency 2 past simmering and 1 below it, and silent for a house with quiet
cells or one that cannot pay. And a rung you have already earned in fame and favour but
have not been received into says so, because the stipend runs from the week you claim it
and not before. Both resolve the moment you act, so neither becomes wallpaper.

The section conditions live in a `SECT_MARK` table of functions of the save rather than
inline in the JSX, for the reason everything else here does: a condition inside a render is
a condition no check can reach. `surface` caught the first draft of the badges setting type
at 9px against the 11.4px floor, and `bulk` caught the agenda passing 200 lines — both
fixed rather than exempted.

`glance` (new, 34th check): six tabs with six distinct signatures; twelve arrivals against
five kinds of drift; that looking clears a mark and looking elsewhere does not; that the
bar's counts and urgencies equal what the agenda actually holds for that tab; every entry
in `SECT_MARK` driven from both sides; the feast and the rung said and not over-said; and
that the last-looked signatures survive a save, so a loaded house does not light all six.

### v2.60.0 — Nobody ever asked the gods for anything

Audit item #91, the last of the ten. The temple is a finished system: five gods, four
boons plumbed into four separate places in the engine — the missio score, the healing
rate, the purse and the fame off a win — plus a weekly hand on morale and on a patron's
warmth, a piety scale with two tiers of consequence, and vows with a real stake, a real
reward and a real punishment. And across 3,200 house-weeks: **piety 30 to 35 in every
house, no vow ever sworn, no blessing ever riding.**

**The diagnosis took two wrong turns and both are worth the record.** Mine first: every
price is a flat term plus an uncapped share of fame, written when the ladder of renown
ended at 600. At the old ceiling Jupiter asked 900 denarii for five weeks; at the twenty
thousand a great house actually carries he asked **20,300**, and Aesculapius 10,160 for
six weeks of faster mending. That is the v2.43.0 stipend and the v2.47.0 feast a third
time, and it is capped now at `PIETY_TOP` — where `fameEdge` gives up paying for renown —
so the dearest altar asks 1,900 instead of 20,300. But it was not what was binding, and
capping it changed the measurement not by one denarius, because the probe's houses died
long before that fame.

The second wrong turn was the probe's, and it had produced the whole finding: its
affordability guard demanded the cost **plus the ruin line plus 1,200** in hand, against a
median 808 denarii in the box and a cheapest altar of 203. It refused in nearly every week
the game would have allowed, and the run read "a blessing rides 2.45% of weeks — the
temple is unaffordable."

**Corrected, it is the #95 answer again.** Observing without acting: a house had no
blessing, a rested altar and the coin in the box in **86% of weeks.** Acting: a policy
that keeps the rites reaches **31.6% blessing uptime** (max 77%) for 19.6% of its income
and carries piety to a median peak of 55; swearing as well, it keeps **64 vows of 79** —
so the vow is a slightly favourable bet in coin before the piety and the blessing that
come with keeping it — and finishes devout. Nothing was out of reach. Nothing ever said
the temple was there.

So the fix is the two ways in. **The agenda now names the gods**, which it never did in
twenty sources: one line at urgency 2 for a house keeping no rites at all, and one at
urgency 1 for the week the altar could fix something actually wrong — two men laid up, or
cells past restless — naming the god, the price and the weeks. Nothing for a house with
nothing wrong, and nothing for a house that already has a blessing riding, because #84 was
about an agenda that talks too much. Lifted into `agendaGods` rather than added inline:
`agenda` came to 208 lines with it in place and `bulk` said so, which is that check doing
its job. **And the villa's Temple panel opens** when there is something to do — a blessing
riding, an ill turn to sit out, or an altar that will take a gift the box can stand —
instead of only for a house that already had a vow standing, which was the one state you
could not reach without having used the system already.

**One plain bug on the way past.** The vow button's label read `Vow ·  stake` — a figure
that was never interpolated — so the only button in the game that asks a player to pledge
coin never said how much, and the screen recomputed the stake inline three times from a
formula that `swearVow` no longer used. It reads `Vow · 690d` now, from `vowStake`.

`temple` (new, 33rd check): each god's own blessing and its own boon, and that no god
quietly carries another's; the altar's three-week rest and one-blessing-at-a-time;
piety's drift home from 90 and from 4; a vow kept and a vow broken settled through
`resolveVow` itself, and coming due on its own by play; the price flat past the cap and
still climbing below it; both agenda lines firing when they should and silent when they
should not; and a house that keeps the rites reaching real uptime. Dials: `PIETY_TOP`.

### v2.59.0 — The man the whole town came to look at, swept off the block by the block

Audit items #88 and #97, and the second of them turned out to be a bug rather than a
balance question.

**#97. The paragon was being destroyed by the market refresh.** `paragonWeek` puts him
at the head of `d.market` and writes his name into `paragonSeen`, of which a house gets
two in its whole life. The three-weekly refresh runs fifty-six lines later **in the same
`endWeek`** and begins with `d.market = []`. Measured over twenty houses run four hundred
weeks: five paragons generated, and **one** ever standing there when the player looked.
The other four were wiped in the week they arrived, each spending one of the two, with
nothing on screen. `marketWeek` had always been careful to leave him out of its sweep;
`makeMarket` was not. He is now carried across a refresh, and 4 of 4 survive.

**And the answer to him had never once been available.** The screen has three: pay it,
take the house apart and it is enough, or it would still leave you short, which settles
it. Only the third could fire. He arrived in years three to seven — the poorest stretch a
surviving house has — asking a median **9,936 denarii of a house holding 1,774**, and
stripping that house to the walls raised **3,153**. The fire sale closed a third of the
gap and never bridged it.

The lever is the sighting, not the price: he is the best man you will ever own and he
ought to hurt. A crowd gathers where there is a plausible buyer, so a house that could
not get within `PARAGON_REACH` of him by selling every spare thing it has is not shown
him at all — and does not spend one of its two on a morning it can do nothing with.
Two further faults surfaced doing it: `paragonDone` was a wall rather than a gap, checked
*before* the `paragonSeen.length >= 2` cap, so the cap was dead code and no house was
ever shown a second; and with three rolls in four now refused, the old 1.8% weekly rate
came to four sightings in sixty houses, which is not content but a rumour.

Measured after, two batches of sixty houses: **23% and 30%** of the houses that reached
week 120 are shown a paragon (from about 5%), one house in each batch was shown a second,
and across the 19 sightings all three answers fired — pay it 5, **take the house apart 6**,
not even then 8. Dials: `PARAGON_REACH`, `PARAGON_GAP`, `PARAGON_ODDS`.

**#88. Rome's census road was set one rung too high to admit anybody.** v2.53.0 opened a
second way to the summit at the fifth rung, Known in Rome — which is very nearly a
tautology as a gate. Measured across twenty-four houses run four hundred weeks: **every
house that reached rank 5 had already taken the primacy, all of them years earlier.** The
census route never admitted one house the sand had not.

Two candidates were measured before choosing. A top-rung win at home is not a wider gate
but a narrower one: **40 tier-4 cards were offered across twelve houses, 7 were taken,
and none of the 7 was won** — so my own recommendation from the audit was wrong, and
adding it would have widened access to nobody. The fourth rung is the one that works.
Eques is where the censors count you among the knights, and a senator can put a knight's
name forward; he cannot really put a slaver's.

Measured across two batches of twelve: letters went from 10 of 24 houses to 12 of 24, the
two new ones being houses that never took the title at all — one of them previously died
of its debts at week 173 and now runs the full four hundred weeks with five Rome
campaigns behind it. For houses that were getting in anyway the letter arrives about four
years earlier (median week 184 → 133, and 161 → 134 in the second batch). Honest limit:
in the second batch it widened access to nobody, because every house there that reached
rank 4 also took the primacy. Two houses in twenty-four is the size of this.

**And the road-to-Rome screen had never mentioned the census at all** — it listed the
primacy as the only first rung, so a house climbing the ladder was being told the only way
up was an afternoon it had already decided against. It names both now, with the rung you
are on and the rung you need. `summit` asserts the gate from both sides, and that it is
never again set at the top of the ladder.

### v2.58.0 — How close, which the sheet never said

Audit item #95, and mostly a disproof. The item said five of the nineteen feats are
never earned — the cloth, named steel, the stone, your own games, the imperial sand —
and wrote its own falsification: *if a policy that deliberately goes after them earns
all five, this is a prompting item rather than a reachability one.* It does. The same
eight seeds, run four hundred weeks with a policy that founds the burial society,
throws the cloth at the first crux, forges a piece, holds funeral games and fights at
Rome, earned **every one of the nineteen**, four of them inside fifty weeks.

**Two of the five were the probe's own doing, and one of them badly.** The imperial
bout is flagged `imperial`, not `rome`; it comes up *sine* about a third of the time;
and it builds its man at quality 100+, so a Capuan best draws a win chance under the
0.42 gate the audit policy uses. The careful probe therefore crossed Italy, was
offered three bouts, declined all three and came home with `rome.won` at nought —
which would have shipped as "the summit is unwinnable" if it had not been checked.
Corrected, three of eight houses win at Rome. The stone was simpler: the probe had
never founded the society at all. Founding it, five of eight houses bury ten men.

**The one real fault: the cloth outside a singles bout left no trace.**
`d.flags.threwCloth` was set inside `doFight` and nowhere else, so the pair bout's
"Throw in the cloth for both" and the hunt's "Call the handlers in" — the two most
expensive mercies on any card, a whole purse forfeited each — recorded nothing.
Measured, driving each engine to its own crux and answering with the cloth every
time: **42 pair bouts stopped and 37 hunts called off, and after all 79 the flag was
false, the count 0, the front rows unmoved off 40 and not one man in the cells
remembering it.** The same probe throwing 178 singles recorded every one. There is a
`recordCloth` now and all three engines call it.

**And the sheet says how close.** Every unearned feat showed a dash. A house held the
armoury at its third level for 24 weeks with the fee in the strongbox and forged
nothing; the city would have taken its own games in 131 weeks, with its own dead to
name in 97 of them, and it staged none. Each of the nineteen carries a `near` now that
reads the house's own numbers — `9 of 10 under the stone`, `the armoury is at 1 of the
3 levels a forge needs`, `no burial society — 180d founds one`.

Writing those lines is where the interesting part was, because **a proximity line that
is wrong is worse than the dash it replaced**, and the new check caught two of mine
being wrong. The forge wants *bought* steel — `forgeReady` tests `wears`, which stock
issue fails — so the first draft told a house of six men in house kit that 700 denarii
was the whole of it. And the letter from Rome has five conditions, so a house past the
fame bar with no senator warm enough to send it read `0 fame short of the letter` and
would have gone off to win fame it did not need. Both now name the thing actually in
the way.

**What the traits half found:** `hard` is earned in ordinary play (two of eight houses),
and `shrewd` and `marked` are not unreachable either — they are wagers. The audit probe
had never placed one. A probe that has a flutter earns `shrewd` in seven houses of
eight inside a few weeks. `marked` needs betting *against* your own man and being
caught at it, which is a thing a player chooses and no probe has ever chosen.

`feats` (new): all nineteen driven through their own actions — the cloth in each of the
three engines that offers it, the armoury built and a bought piece cut, the society
founded and ten men under the stone, three funeral cards for the game's own dead, and
the road to Rome walked until an imperial bout is won. Then the sheet held to the truth
against a state forty weeks of play produced: every unearned feat says how close, no
earned one nags, the countable ones quote the house's real numbers, and **no feat may
be added in future without a line to go under it.**

### v2.57.0 — The slide, which used to happen in silence

Audit item #94. v2.48.0 gave the creditors a patience measured in the house's own
weekly bill, and a house took a great deal longer to die of it — median life 43
weeks to 167 under one fixed policy, which was the point. What did not grow with
it was anything to hear. The three ruins of v1.10.0 each warn six weeks out and
lapse if the pressure comes off; **debt warned not at all** unless you happened to
be carrying a lender's paper, so a hundred weeks of sliding read exactly like a
hundred quiet weeks.

Three beats now, against the same line the end reads, each said once and all of
them forgotten if the ledger comes back — the shape `ruinWeek` already uses. At
35% of the way down, the butcher wants cash and says so pleasantly and the smith
writes it down. At 65%, word is round the trades, with the two figures named. At
85%, the men who are owed have stopped being pleasant, and the line says plainly
that whatever is going to save the house has a week or two to do it. The agenda
carries it at urgency 2, then 3.

Measured at both ends of the game, which is the point of hanging it on
`creditLine`: a house of three is warned at −100, −175 and −225 against its line
of −250, and a finished house at −1,199, −2,099 and −2,698 against −2,998. Both
forget it when the ledger comes back. Dials: `DEBT_STAGE` beside `creditLine`.

**And the agenda went on the handle.** Twenty sources, three urgencies, the
most-read screen in the game — and until now only a browser could reach it, so no
check could ask what it says about a given house. `ledger` now asserts the slide
through it.

### v2.56.0 — The man four doors down asks

Audit items #92 and #93, the second of them settled rather than built.

**#92, measured before it was touched.** The bout against your own second-best —
the one against the man who sleeps four doors down, 42% he takes it, and whichever
way it goes the loser lives in the same building as the answer — is the best thing
the mid-game has to say, and it had never once fired in 3,200 censused house-weeks.
It was not broken: handed a qualifying state, `make()` returned an event 400 times
out of 400. It was starved. Over **1,320 weeks of a house that actually held the
title with a genuine challenger in its cells, the state qualified in 1,284 of them
— 97% — and the event fired eight times, 0.62 per hundred eligible weeks.** What
took the slot instead was mostly systems holding channels of their own, which set
the week's question before the random draw ever runs: a feud in the yard 257 times,
the potter's licence 230, the aedile's inspector 100.

So it gets a channel too, the way ambitions did, and in the place that already
watches the title: `primusWeek` raises it at `PRIMUS_ASK` 14% a week once a reign
is six weeks old, then leaves it `PRIMUS_ASK_GAP` 30 weeks. Measured after: **45
firings against 8** on the same 1,320 weeks, and on a single reign the shape is
right — asked twice in eighty weeks, first in week 31. A new holder starts the
clock over, because `d.primus` is replaced when the title changes cells. `careers`
holds both ends now: that a holder is asked inside a reasonable stretch, and that
he is not asked in the first week of a reign, which the event was always written to
refuse.

**#93 is accepted rather than changed.** `stall` measures the block's dependence on
the house's name at acclaim 40 / 72 / 95 as mean stat 54.7 / 61.4 / 63.6, fine men
6.9% / 17.5% / 23.1%, price 545 / 926 / 1,208d. That is 2.2 points of mean stat and
5.6 of fine men across the range v2.50.0 moved a mature house through — a third of
what the audit item claimed on a noisier probe — and prices move with it, so per
denarius it is close to neutral. It is also what "the good ones go where the name
is" is supposed to mean. Recorded in the balance reference, printed every run, and
closed.

### v2.55.0 — The block, which no check could refresh

Audit item #96, plus the harness half of #97. `makeMarket` was not on the handle,
nor were the doctore's market, the staff market, or `liquidate` — so the only way
to see a second stall was to drive three whole weeks, and nothing ever asked the
block what it was offering under a given state. The cost is on the record twice:
the v2.52.0 consolidation pass discarded a whole block battery that called
`A.makeMarket`, found it undefined, and silently measured the founding stall five
times over — reading flat where the truth is steep — and the steepness itself went
unnoticed through v2.50.0, a release whose entire content was changing the number
the block reads.

All of them are exported, and `stall` is the thirty-first check. It holds the
shape rather than the values, because the values are what a repricing is allowed
to move: the stall must improve with the house's name, cost more as it improves,
keep about a third of itself hiding something, and the four sellers must remain
four different places to shop. Measured live every run:

| acclaim | mean stat | fine men | flawed | price |
|---|---|---|---|---|
| 10 | 53.7 | 6.9% | 29.4% | 544d |
| 40 | 54.7 | 6.9% | 33.1% | 545d |
| 72 | 61.4 | 17.5% | 30.0% | 926d |
| 95 | 63.6 | 23.1% | 25.0% | 1,208d |

and the sellers come back as their own table — Bones at 238d with 77% carrying
something, through Batiatus and the Syrian, to the honest man at 1,048d and 11%.
It also pins the one thing the block may never do: **every band the seller quotes
must contain the real man.** 11,520 bands checked, all of them holding, widths ±14
seller / ±7 doctore / exact when scouted.

That table is also the honest correction to #93, which claimed the acclaim
dependence was worth 4.1 points of mean stat and 15 points of fine men between 72
and 95. Measured properly, with a single variable and a refreshing stall, it is
**2.2 and 5.6** — real, and about a third of what the item asserted.

And `liquidate` being exposed closes the harness half of #97: the fire sale now
quotes and then does the same thing, verified — 1,826 denarii quoted, 1,826 raised,
and exactly the one man left standing.

### v2.54.0 — The line of the house

Audit item #90, and the item was wrong in a way worth recording. It claimed the
heir was a system no house had ever used, on a measurement of eight houses with
an heir in none of them. That measurement was taken on houses that died between
weeks 25 and 239. Re-run after v2.53.0 let three of them live past week 360 and
**all three had an heir — a scion, raised through the family arc, named by the
game without the player doing anything.** A child needs about fifteen game years
to reach the toga, so the heir does not arrive late because it is broken; it
arrives late because it grows up.

What was genuinely unreachable is narrower and still true: `nameHeir` and
`heirEligible` were not on the handle, so the three heirs a player *chooses* — a
son, a nephew, the freed doctore — could not be named by anything outside a
rendered screen, and `succeed` has run in play precisely never, because the
old-and-well ending intercepts a lanista before his health reaches nothing. Both
are exported now, and `line` is the thirtieth check: who may be named and when,
then each of the four kinds carried through a death and asserted against its own
row in `HEIRS` — the fame kept, the standing kept, what he brings, what the cells
make of it — plus the things a handover must not cost, which are every man, every
wing, the generation count and the forebear's name. A house with nobody named
still simply ends.

**And it found a real fault on its first honest run.** Unrest came out of a
handover as NaN. Not from the succession — from the week before it: `ludusLedger`
averages the cells' defiance, six checks stock the player's roster with
`genOpponent`, which builds the other side of a card and carries no defiance, and
`undefined` in that average turns unrest into NaN — which is then clamped, stored,
and read by the rebellion, the ledger and the agenda without one of them
noticing. In-game the field is always there, so nothing shipped broken; but the
most-watched number in the game had no floor under it. The average reads
`g.defiance || 0` now, `phases` asserts a roster of strangers still leaves a
number, and `test/README.md` says which generator makes a man of the house.

### v2.53.0 — Rome always ends

Audit items #88 and #89. The only real ending the game has could not be driven by
any check — `romeReady`, `offerRome` and the trip's mechanics were all off the
handle — and behind that silence sat a fault that was quietly ending runs.

**The trip had no clock.** The invitation expired in four weeks; what followed it
never expired at all. A house that accepted and then declined the card it was
given — half of imperial bouts are sine missione against men built at quality 92
to 99 — sat at Rome indefinitely, aging and paying upkeep, with Capua frozen
behind it: no market, no festivals, no events, no way back. Rome now holds a place
for about a month a bout (`ROME_WEEKS_PER_BOUT`), and then the editors fill it from
a queue that is never short: the house comes home with what it took, 14 fame plus
9 a missed place, 16 off the senator, and a homecoming line of its own — coming
back from a decision rather than from a defeat.

**Measured, and it was worse than the item claimed.** On the same eight houses and
the same policy, the three that accepted an invitation before this went 152 / 239 /
401 weeks with one invitation each; after, they run 388 / 369 / 401 with **three
and four invitations each, and two of them now die of old age instead of debt.**
The strand was not a curiosity — it was silently ending careers, because a house
frozen at Rome cannot earn and the creditors do not stop.

**And a second road to the summit**, which the measurement is less kind about.
Rome asked that a house had held the primacy and would take nothing else, so a
house at fame 4,301 with ten feats never saw a letter. The fifth rung of the
standing ladder is called Known in Rome and now means it (`romeProved`). Both
roads verified open — but on this sample **they land on the same three houses**:
everyone who reached rank 5 had also held the title. So the second road is a real
alternative for a standing-led house and *not* a widening, and #88 stays open with
that figure on it. Whether the summit should also admit an eques at rank 4, or a
tier-4 winner, is a design call about how rare Rome ought to be.

`summit` is the twenty-ninth check, and it holds the thing that must never be true
again: both roads open, the letter still expires, and a trip ends whether it is
fought or not — a run must never enter a state it cannot leave.

### v2.52.0 — The consolidation pass

Nine releases shipped in one session, each verified in isolation, none against the
others — and all nine inside one interacting complex: income, standing, rivals,
the street, the ruin line. v0.90.0 did this once before over thirty-one features
and found four faults. This read v2.43.0–v2.51.0 as a composite. **Two things were
wrong, two fears were disproved, and one of the two faults was my own verification
rather than the game.**

**Wrong: v2.50.0 did not work.** Eight measured houses past week 250 still sat at
acclaim 98–100. Two causes. The men's term in `acclaimTarget` was left unbounded,
and I had checked the fix against a house I invented whose best man held renown 90
— a mature house's best man reaches 100 to 400, at which point that term alone
clears the whole scale and every bound below it is decoration. It caps at 46 now.
And the primacy term read `d.primus`, which is set whoever in Capua holds the
title, so **a house was collecting fourteen points of the street's love for a
title a rival was holding** — a fault older than this session, present in v2.42.0.
It reads `primusMine` now. Measured after both: median acclaim past week 150 runs
**82–93 with the top rung occupied 6–51% of weeks**, against 98–100 permanently.

**Disproved: the mortality fear.** A weaker street thumb (v2.50) and a weaker
feast (v2.47) both push deaths up, and were measured apart. Composite deaths per
bout came in at **2.83%, against 3.20% before the audit** — and careers grew
sharply (men reaching twelve wins 42 → 101, masters 37 → 91). The acclaim→missio
sensitivity is real but small and bounded: on 1,500 losing bouts a cell, death
runs 15.3% at acclaim 95 and 16.5% at 72, and the curve is flat above 82. Longer
careers raise a man's own standing faster than the street's voice falls.

**Disproved: v2.45.0's rival fame rescale.** Rival fame now reaching five figures
feeds the recruit formula, but the bay's best man measures 99 at player fame 300,
3,000, 12,000 and 25,000 alike — `clamp(…, 25, 90)` absorbs it exactly as hoped,
and the median man drifts *down* 90 → 80 rather than up.

**Measured and recorded rather than fixed:** the block follows acclaim steeply —
mean stat 55.2 at acclaim 40, 63.2 at 72, 67.3 at 95, with fine men 7.3% → 25.3%
→ 40% — so v2.50 does make the men you can buy worse. Prices move with it
(525 → 918 → 1,268), so it is close to value-neutral, and it is what "the good
ones go where the name is" is supposed to mean.

**And the shape of a campaign changed more than any one release implied.** Under
one policy held fixed, median house life went **43 → 167 weeks** and median bouts
26 → 184, almost entirely from v2.48.0's credit line; the same 19 of 24 houses
still end in debt, but they get years to fix it instead of a fortnight. Wealth is
capped as intended (gold p90 19,070 → 9,436) and houses now live long enough to
build (works finished, median 0 → 4). The v2.48.0 "slow slide" flag is real and
now has a figure on it.

`grudge` cried wolf twice inside this session in opposite directions, on builds
whose only relevant changes were upstream of it. Its policy took one bout a week
where a real house takes the whole card, which under-produced rival contact by
several times; that is corrected. And it no longer pins a gate to a tail
percentile of a heavy-tailed level — it asserts the property, as `test/README.md`
advises: each gate must stand open sometimes and not always (measured: 37.5% /
24.6% / 21.2% of weeks), and the worst of the three must stay the rarest.

### v2.51.0 — Four checks, and two actions that were never on the handle

Audit items #86 and #87, and the release that guards the six before it.

**#87 first, because it cost the most.** `setOut` and `comeHome` are functions of
the save at module scope — exactly what the file's first rule demands — but
neither was on the handle, and the actions check's name-list did not miss them.
So no check or probe could take a tour and come home: two entire 12-house audit
batches accepted a town's invitation, had no way back, spent three hundred weeks
stranded, and reported half the game dark. Three confident wrong findings came
out of that before the instrument was caught. Both are exported now and both are
in the list that fails loudly.

**Four new checks**, all fast, taking the suite from 24 to 28:

| | |
|---|---|
| `phases` | runs each of the week's four phases alone — the split v2.40.0 made *for* checks, which no check had ever used — and asserts the hard rule from INSTRUCTIONS.md that had none: no class clumsy in its own default kit |
| `careers` | walks one man up the whole ladder — signature, mastery, second trade, the switch, the rudis, retirement — and tests every gate from both sides |
| `roads` | drives the round trip the audit could not, and holds v2.46.0's residency costs: a fresh visitor's card against a stale resident's |
| `ledger` | holds the shape of the standing economy: the stipend and the liturgy must read the same censual fame, a finished idle house must be under water, and the creditors' line must follow the house's own bill while still folding a shed at −250 |

`careers` earned its keep on its first run by failing: `makeMasterOf` answered
true whenever the man merely existed, so the UI's own mastery button reported
success on an ineligible fighter. It returns what `makeMaster` actually did now.

**Coverage: 104 of 165 reached, 61 dark, down from 72** — and nine functions were
*added* to the handle in the same pass, so twenty previously-dark ones are now
covered. `ledger` in particular means the two faults this session found in the
standing economy cannot drift back silently: it prints the live figures every
run (stipend 710 / liturgy 593 flat from fame 9,000 up; a finished idle house at
−195 a week; a shed folding at −250 and a palace at −2,998).

### v2.50.0 — The street loves what is in front of it

Audit item #85. Every measured house alive past week 150 sat at acclaim 90–100:
the six-tier street ladder was a first-third-of-the-game experience and "the
street's own house" (92) a permanent state entered around year eight. The cause
sat in `acclaimTarget`: history that never stopped counting — six points per
freed legend, uncapped, banked +120 on a twenty-year merciful house by itself —
so every mature house's target was past 100 whatever it was currently doing.

The remembered terms are bounded now: freed legends cap at +12 (4 a head), the
walls at +9, the fame-spill at +14. What the street chants about is the men on
this week's card, the primacy, and the show. Verified on fixed states: a calm
great house (three names, twenty legends freed, fame 12,000, no primacy)
targets **72 where it used to target 100**; the same house holding the primacy
in a show streak still reaches 100 — the last rung is taken with heat and
lapses in nine to twelve weeks when the heat goes; a young house is unchanged
to the point (23 → 23). The tier announcements only ever fire on the way up
(`brand.tier` keeps its high-water mark), so nothing re-congratulates.
Untested for feel: where real campaigns settle between 72 and 92.

### v2.49.0 — One man's asking buys the yard a month

Audit item #84. Across four independent 12-house batches, the ambition event was
17.4–21.3% of everything the player was ever asked — two to two and a half times
the next most common event. The per-man cadence (five weeks to ask, nine to
press) was always right; the drumbeat came from a full roster keeping somebody
eligible every week for both the dedicated channel and the random table.

One dial: a house-wide cooldown of ten weeks between ambition events
(`AMB_COOL`). A four-week cooldown was tried first and measured nearly useless
(17.0% → 16.4%) — different men's asks already arrive four to six weeks apart —
so the gap was sized from the arithmetic of the event rate instead. Measured
result: **17.0% → 10.7%**, still the single most common voice in the house
(right — it is the men speaking) but now at parity-plus with the next event
rather than double it, and the freed slots diversify the week (total events
rose 810 → 873 across the same census). The despair clock is untouched — it
runs on weeks since HIS asking, not on the drumbeat — though a man's full
asked-pressed-despair arc stretches with the quieter cadence, flagged untested
for feel.

### v2.48.0 — What the creditors will carry

Audit item #83. The run ended at gold below −250 (−420 with a loan open) —
constants from the v0.1 economy, when a house's whole week cost about fifty
denarii and the line meant five weeks of grace. A built house now runs fixed
costs of a thousand a week; the same line was less than two days, and sixteen of
twenty-four measured mid-transition houses died on it inside one bad festival.

The men who extend a lanista credit extend it against what he visibly spends.
`weeklyBill(d)` — the same sum the ledger takes and the home page estimates,
lifted into one shared helper — and `creditLine(d)`: the run ends at
−max(250, 2.5 weeks of the bill), ×1.68 with a loan open. Verified: a young
house folds at exactly the old figures (−250 / −420 to the denarius); a
mid-house at rank 4 is carried to −603; a finished house to −3,373 — the same
two-and-a-half weeks of patience at every size. Dials: `CREDIT_WEEKS` beside
`creditLine`.

### v2.47.0 — The men can count

Audit item #82 — and the audit's premise half-died under its own follow-up
measurement, which is worth recording loudly. The item claimed the feast pinned
unrest at nought for merciful houses at two per cent of turnover. Deeper probes
say otherwise: a genuinely merciful house (the rudis given when earned, clean
cards) sits at unrest ~0 for decades **without feasting at all** — that quiet is
mercy working, which is the design — and a hard house burns on the old build and
the new alike, because a death-cluster surge outruns a three-week cooldown
either way. What survived of the finding: the feast's effect was flat at any
cadence and its price stopped scaling at fame 2,200, an era five repricings
gone.

So two small dials, verified harmless to merciful play (A/B: unchanged at ~0):
**feast fatigue** — the night's whole effect scales with the gap since the last
one, ×0.4 on the cooldown floor rising to full at six weeks (`FEAST_FRESH`),
with its own line when the men notice the catering — and **the price follows
the era**, the fame clamp extended from ×1 to ×2 (up to ~×5.4 base) so a great
house pays for its table like everything else it does. The `table` check's
guards (opening price unmoved, ≥4× spread, a fresh feast still a lever) all
hold. Unit-verified: unrest drops 2.8 / 4.2 / 5.6 / 7 / 7 at gaps of 3 / 4 /
5 / 6 / 9 weeks.

### v2.46.0 — A guest, not a resident

Audit item #81. A house that accepted one town's invitation and simply never went
home prospered for three hundred straight weeks — favour 97–100, the works
rising, the amphitheatre of Capua commissioned from a tent in Puteoli — because
patron wants arose and were served from the road, and no town ever tired of the
same bill. Nothing anywhere objected to emigration.

Two costs now, both of **residence rather than travel**. Past six weeks in one
town the crowd has seen the whole repertoire: purses fade toward ×0.6 and the
card thins by a plain single — never the home house's champion bout, of which a
stale resident sees more, not less. And Capua's patrons neither ask nor credit
wants while you are down the bay, and cool at two and a half times the rate —
out of sight is out of mind — so a long stay is the whole ladder quietly letting
go of you. The agenda says it plainly from week ten, and the town says it twice
in its own voice.

Measured (5-man fame-900 houses, 60 resident weeks): favour 70 → 47 and 68 → 43
where it used to hold flat; the stale weekly take falls to 69–80d against the
old squatter's escalating 464–966d; a proper six-week tour's purses are
untouched (welcome is fresh) and its favour cost is a few points of extra decay
plus the lapse risk the deadline panel already shows — flagged untested for
feel. Home play on the same seed is byte-identical, verified. Dials:
`STAY_FRESH` (6 weeks) and the welcome slope beside it; the away-decay
multiplier (×2.5) in `patronWeek`.

### v2.45.0 — The city rises with its First House

Audit item #80. Rival fame was pinned by a weekly mean-reversion at sixty — a
recruiting dial from before the league existed. Measured over 400-week runs the
three houses sat at **143–485 fame while any surviving player house ran to five
figures**: the fame table that names the First House of Capua was decided for
good around year four, and the standings screen read as scenery.

Three changes, all in the rival machinery. **Every lanista carries a `stature`**
— his share of the leading house's name (Tullius 0.62 down to Cossutius 0.38) —
and rival fame is pulled toward `stature × your fame` instead of toward sixty,
so the standings read as a living city (calm-state: 0.4–0.8× of the leader).
**About one year in four the reckoning decrees somebody a season** — form set to
82–100 and floored at 60 for that year, a crest worth up to +0.9 stature while
it lasts, with a faster pull — which is the one time the top of the table can
genuinely change hands late. **And the noblewoman's story now cuts a share of a
name (18–30%) rather than sixty denarii's worth of one**, so the counterplay
survived the rescale.

Measured at a held era of 12,000 fame over 400 weeks: the top spot changed hands
4 times for 43 total weeks in one seed and stayed held in another — a threat
every few years, not churn — and at the opening (player fame under ~100) the
anchor floors at sixty and the erosion is exactly the old line, verified
unchanged. Dials: `stature` per lanista in `LANISTAE`, the decree odds (0.28/yr)
in `leagueReckoning`, crest/pull/fall (0.9 / 0.06 / 0.03) in `rivalWeekly`.
Untested for feel at the margin: how often a real, fighting player actually
loses the title — the probes' inert player overstates the rivals.

One check recalibrated on the way: `grudge` measured its ninety-ninth percentile
off three fixed seeds, and the RNG reordering swapped its one angry streak away —
the same build read p99 34 on the old seeds and 63 across nine fresh ones (A/B
v2.44.0 vs v2.45.0: 61.9 vs 63.2 — the distribution had not narrowed; the median
actually rose 4.5 → 14.8 with the hunting line warmer). It samples nine houses
now, ~1,350 weeks, still three seconds.

### v2.44.0 — The ladder gets its last rung, on purpose

Audit item #79. The fame ladder was rebuilt once already (v2.37-era) and the game
outgrew it again: measured houses cross 11,000 — the last rung — around year
twelve, the finished stone prints +24 fame a week forever, and above 11,000 the
only things still reading fame were an imperceptible purse slope (about +1% per
900 fame, dying quietly at 24,120) and the levy, which is a bill. The most-watched
figure on the screen was decoration for the back half of a long game, for the
second time.

Two rungs, placed where measured houses actually go (post-v2.43 survivors crossed
14,000 three of three and 20,000 one of three). **The House Men Ask For (14,000)
has teeth in men rather than coin**: a man bought off the block arrives +6 regard
and +6 morale — the name does half the sacramentum's work before the oath is said
— because how the men take you is the one currency v2.43.0 deliberately did not
cap. **The Measure of the Trade (20,000) is a last rung on purpose**: the ladder
ends by saying so, rather than by running out of lines.

Verified: same seed, same man — regard 40 → 40 and morale 60 → 60 buying at fame
13,999; 40 → 46 and 60 → 66 at 14,000. Each word fires exactly once, in order,
and nothing fires above 20,000. The change consumes no RNG draws, so every
trajectory below the rung is untouched by construction. Tuning dial:
`FAME_WARM_AT` beside `FAME_TIERS`.

### v2.43.0 — Standing pays on the census, not the legend

The audit's headline finding, fixed at its root. The liturgy has always read fame
capped at 9,000 — the figure the censors stop counting at — while the stipend's
root term and the league's yearly purse read fame uncapped. Measured on a finished
house (all nine works standing, nobody fighting), the idle ledger ran **−281 a week
at fame 1,500, broke even near 12,000, and paid +750 a week at 27,000** — and the
finished stone itself prints +24 fame a week, so every completed house rode that
curve into a strongbox nothing could empty (measured end-golds 19k–528k with
everything built by year 12–14).

One shared constant now, `CENSUS_TOP = 9000`, read by all three: the stipend's
root term, the liturgy, and the league reckoning's purse. **Below fame 9,000
nothing anywhere changes** — verified by re-running 24 recorded campaigns on the
same seeds: every house that died below the census produced byte-identical
outcomes. At the top, a finished house now settles **≈150–400 a week under water,
flat in fame** (36-week idle probes at fame 9k, 12k and 27k are indistinguishable),
which is one small purse a month: the sand still has to pay for the stone.
Campaign effect on the same seeds: end-gold 116,317 → 35,918 and 19,070 → 1,143;
the amphitheatre of Capua is commissioned at week 280–316 instead of 183–223 and
is still rising at year twenty-two for the second-best house, which is what
"priced to be the work of years" was always supposed to mean.

Every release since v1.12.0 has a full write-up in its commit message; `git log` is
the changelog of record for that stretch, and the comments in the source carry the
measurements each change was made on. What follows is the shape of it, so somebody
picking the project up knows what happened without reading seventy commits.

### v1.12.0 → v2.42.0 — the long middle

Seventy-one releases. They divide into five things.

**The bout stopped being a slot machine.** The tactic triangle was fitted so none of
the four words is the answer — forward answers straight, the shield answers forward,
patience answers the shield, and showing off costs you the bout you are showing off
in. The class counter was narrowed until picking a style was a real choice and every
class was symmetrical against itself. Traits reached the sand. The read stopped being
free and the crowd stopped being automatically yours. The shield came back at the top
of the game. A ceiling was chosen out loud — sixty per cent for a maxed man with a
perfect read — and it has held since. *(v1.87–v1.92, v2.2–v2.12, v2.24, v2.31–v2.35)*

**Four engines instead of one.** The pair, the melee and the hunt were given the
single sand's shape: the crux, the missio, the record, the deaths, the purse. The
Capuan bill went from 75% ordinary single combats to 57%, and a tour down the coast
— which had been single combats and nothing else — got a card with each town's own
character on it. *(v1.92, v2.1, v2.3, v2.25, v2.35, v2.38)*

**A house that is somebody's.** Patrons became named people with wants and a hand on
the thumb. The lanista got an age, a body the job wears down, and an heir. The cells
got bonds, feuds, nights, and seventeen things a man remembers about you. The
collegium, the auctoratus, the sacramentum, mastery, ambitions that speak and are
given up on. The street learned to shout for a man the editors have written off.
*(v1.13–v1.80, v2.13–v2.29, v2.42)*

**A campaign with a shape after year three.** The standing ladder above its sixth
rung, and then a census rather than a bill so its top rungs could actually be stood
on. The works and monuments paid for as they rise. The pit, the feast and the card
repriced against the house that is playing them rather than a house nobody has.
Acclaim given somewhere to go after it saturates. *(v2.27–v2.29, v2.35–v2.39)*

**And the part that made the rest possible.** A regression harness in the repo, then
a save format with a version that means something, then the player's actions lifted
out of React closures so anything could drive a house, then two test tiers, then a
coverage sweep that asks what nothing has ever touched, then a size guard so the four
functions holding every balance change could not quietly grow back. Twenty-four
checks now. Roughly half the findings in this stretch were disproved by measurement
before they shipped, and the ones that survived carry their figures in the source.
*(v2.18–v2.23, v2.26, v2.36–v2.42)*

### v1.11.0 — What they ask you for
They remember, refuse, form ties and carry ambitions, and in ninety versions not one of them has ever asked you for anything directly. **A man who has fought for you and thinks well enough of you now comes and stands in front of your table.** Once each, about 2.4 a campaign.

- **That his brother not be sold.** *"He does not ask for himself and he has clearly been working up to it for some weeks."* Give your word and it binds — that man cannot be sold for the rest of the run.
- **A particular man.** Somebody on the circuit put him down in front of a house that laughed. Arrange it and he trains differently from that afternoon on: +18 form, +12 morale.
- **One more year.** He has earned the wooden sword and knows it, and wants to go out at the top. Refuse and you free him anyway, *"which is a strange way to be generous and is generous."*
- **The burial society**, on behalf of men who did not want to ask. Three denarii a week each and a name cut in stone instead of a ditch.
- **A woman in the town.** Leave to see her on the days he is not fighting. *"He now has a reason to want to live through this, which cuts both ways and you knew that when you said yes."*

**Saying no is always allowed and always costs** — 5 to 14 regard and up to 14 morale, and it goes in his memory. *"He stays behind the wall. It is the correct decision for a lanista and you are not required to feel any particular way about it."*

Two silent failures caught by the harness. The eligibility used `g.since`, which does not exist on a gladiator — no man would ever have qualified. And the brother request read tie strength as `t.n` when the field is `t.strength`, so that request could never fire and its `try/catch` would have hidden it forever.


### v1.10.0 — Ways to be finished
Debt, ruin, rebellion, and the lanista dying. But there is now a law with heat, a reputation the town holds, and rivals with grudges — three systems that generate pressure and could not conclude anything. **They can now.**

**STRUCK FROM THE ROLL** — heat at 90, two edicts, two live breaches and a history of fines. *"The aedile does not send for you. He publishes... Nothing burned. Nobody died. It took four years to build and eleven days to be told it was over."*

**NOBODY WILL BOOK YOU** — a blood reputation at 88, no standing, and the front rows gone cold. *"It is not a decision anybody makes. The editors simply stop asking, one after another, over about two months, and each of them has a reason that is not the reason."*

**THEY TOOK IT APART** — a rival at 95 grudge against a house down to two men. *"He sends nothing, says nothing, and does not come to watch you close. That is the part you will think about."*

**None of them lands without warning.** The first week over the line writes a chronicle line and puts a three-urgency item on the agenda — *"This house has 6 weeks to change something"* — and **six weeks is enough to fix any of them.** If the pressure comes off, the warning lapses: *"Whatever was about to happen to this house has stopped being about to happen."*

Measured across sixteen ordinary campaigns: **15 survive.** A deliberately lawless house — over the cap, a woman on the sand in defiance of a decree, fines already paid — is still finishable, which is the point.

The first pass banned 4 of 16 ordinary houses, because heat accrues from the numbers cap that sets itself below your roster and a house that keeps buying men is quietly always in breach. Requiring two live breaches and prior fines separates defiance from drift.


### v1.9.0 — What you can do back
They have poached, sabotaged, bribed editors and sent men round since v0.2, and you have never had any way to do it in return. **Four gambits**, one every six weeks, from week 16:

| | | Works | Heat |
|---|---|---|---|
| **Put a word about** | 140d + | 60%, 72% if your house is known for craft | 5 |
| **Put money in front of his best man** | 420d + | 48% — and his best fighter walks into your yard | 9 |
| **Buy the editor's ear** | 300d + | 58% — twelve weeks of soft matching | 12 |
| **Get at his steel** | 220d + | 50% — two of his men lose afternoons they should have won | 16 |

**Every one of them can fail publicly.** The poached man tells his lanista, who tells the town. The editor mentions it at dinner to somebody who mentions it to the aedile. *"His armourer catches it, and the man you paid gives your name up before anybody has to hit him."* A failure costs 15–30 fame, up to 22 heat, and adds far more to that house's grudge than success does.

**And the same trick stops working.** Each use of a gambit drops its odds seven points: poaching runs **48 → 40 → 31 → 23 → 14** across five attempts, with heat climbing to 31 along the way. **A house the magistrate is already watching finds all of it harder** — at heat 80, getting at his steel falls from 50% to 26%.

The bought editor is real and temporary: while it holds, your men are matched a full tier softer. A rival's fame has a floor of 35, so a rival can be damaged and not annihilated — there is no way to remove a house from Capua by whispering about it.


### v1.8.0 — What became of them
The rudis is the moral centre of this game and a freed man has always vanished into a list. He is a person with one trade and nowhere else to use it, and Capua is not a large town. **He comes back.** Five weeks after the wooden sword, six things can become of him:

- **He comes back to teach.** *"Three months at a trade he is not good at, and he knows this yard."* A doctore for nothing but keep, tagged **who was freed here** — and every man in the block just watched what the wooden sword is actually worth. +9 morale, +7 regard across the house.
- **He sets up on his own.** Two men and a yard on the Neapolis road. *"He learned the trade somewhere and everybody knows where."*
- **He is in the front row.** *"He does not shout. He is simply there and a number of people notice him being there."* Every faction warms.
- **He sends something.** A cart of wine, oil and forty denarii he does not explain. *"The men drink it and talk about him for a week."*
- **He asks to come back** — signed as an auctoratus, for wages, with his wins intact and regard at 82. *"A free man choosing this on purpose."*
- **It did not go well.** Sleeping under the arches by the river. *"A free man with one trade and nobody buying it, which is most of them."* +5 unrest, and it takes something off the wooden sword for a while.

Measured across sixteen campaigns: **29 men freed, 8 came back — 28%** — and all six outcomes appear. A man becomes something exactly once; verified across 120,000 rolls with no repeats.


### v1.7.0 — What you have promised
A booking is one afternoon. Nothing in this game has ever held a house to anything longer than that. **Three standing obligations**, offered from week 20 at about two a campaign, and every one of them is a thing you cannot quietly stop doing.

| | | Kept | Broken |
|---|---|---|---|
| **A season with one editor** | 6 cards / 18 weeks, 280d each | +40 fame, +1,560d, every patron warms | −45 fame, and *"he tells four people who matter, quietly, over a month"* |
| **An exclusive with the aedile** | 4 cards / 24 weeks, 500d each | +55 fame, +2,500d, the aedile turns friendly, **−20 heat** | −60 fame, **+25 heat**, and *"the aedile's office simply stops answering"* |
| **A debt paid in men** | 8 cards / 30 weeks, no coin at all | **the loan is gone** | the debt grows 40% and he wants it now |

**The exclusive genuinely shuts doors** — measured, a card offers **4.5 bouts normally and 1.0 while you are bound to him.** That is the cost, and it is why the bonus is what it is. The debt pact is only offered if you actually owe somebody, and it is the one route out of the moneylenders that does not involve coin.

**The agenda watches the pace** — *comfortable*, *behind*, or **impossible**, at which point it says so plainly: *"There are not enough weeks left. Whatever happens now, it will be remembered as broken."*


### v1.6.0 — What the stands say
Four factions with real standings, eleven beat kinds carrying full state, and not one voice among them. **The stands talk now, and they disagree with each other about the same blow.**

A retiarius lands one and the parmularii say *"there, that is what the small shield is for"* while the scutarii say *"he is being pulled apart out there."* A murmillo walks through his man and it reverses: *"on the shield, on the shield, exactly on the shield"* against *"that is not fighting, that is leaning."* The mob wants blood and says so. The front rows manage *"a small noise of approval that costs them nothing"* — or, when it is going badly, *"the word vulgar is used, clearly, by somebody who wanted it heard."*

**Who you hear depends on where you are.** The upper tiers are loud in an amphitheatre and barely present in a courtyard; the front rows are the reverse. **And a faction that has gone cold on your house says less** — at standing 10 only 21% of loud beats draw a voice, against 43% at standing 70.

**Silence is a voice too.** A man goes down and 37% of the time the answer is *"The noise stops. That is the noise."*

**They use his name once he is somebody** — a crowd favourite at 45 hears himself shouted for.

**78 lines**, and the honest measurement is that a 250-bout campaign draws **539 shouts, so each line is seen about seven times.** The first pass fired at 3.2 a bout and burned through the whole table in a fortnight; dropping to **2.2 a bout** — with **8% of bouts watched in complete silence** — is the difference between a crowd and wallpaper.


### v1.5.0 — A season, not a week
Eight drills chosen weekly, each independent, none constraining another: that was bookkeeping, not strategy. **A plan declares what a man is being made into over a season, runs itself, and pays only if you let it finish.**

| | | Pays |
|---|---|---|
| **Make him a wall** | 18 weeks | +5 strength, +6 endurance, +3 discipline, **Iron Hide** |
| **Make him quick** | 18 weeks | +7 agility, +4 technique, +3 endurance, **Swift Learner** |
| **Teach him the trade** | 14 weeks | +8 technique, +4 discipline, +2 agility, **Stoic** |
| **Make him theirs** | 12 weeks | +9 showmanship, +3 technique, **Showman** |
| **Bring him back** | 8 weeks | +4 endurance, +2 discipline |

The drills follow the plan in a fixed order — a wall goes *weights → palus → sand → weights → palus → hill* and keeps going — and the weekly picker disappears while it runs.

**Commitment is the whole mechanic.** Finish and he takes the stats, the trait, +14 morale and +9 regard. **Come off at halfway and you keep only what the weekly drills gave and none of the bonus.** *"He comes off his season at 50 in the hundred."*

**The doctore sets the pace.** The one who drives them finishes a season in **16 weeks**; the patient one takes **20**.

**And the world keeps interrupting.** The agenda warns when a man on a season is being run into the ground, because a broken season pays nothing. Freeing him clears it. A card he is the only fit man for is the real question the system exists to ask.

Measured on the worry I flagged before building it — that plans would strip a turn bare. **Drill choices per week fall from 4.7 to 0.7 and the agenda holds at 6.1.** The turn loses repetition, not substance.


### v1.4.0 — The men who sell men
The block has been a price and a concealed flaw. Somebody is standing behind it, he has been doing this longer than you have, and he remembers exactly how the last four went.

**Four sellers**, three of whom are at the block on any given week. Their stalls are measurably different places to shop:

| | Lies | Avg price | Flawed | Avg stat |
|---|---|---|---|---|
| **Cossutius**, at the far end | 70% | **199d** | **72%** | 46 |
| **Lentulus**, who deals in war captives | 20% | 380d | 42% | 52 |
| **Ashur** of the eastern block | 55% | 460d | 33% | 55 |
| **Verrus**, thirty years at this | 5% | **658d** | **9%** | 57 |

Lentulus sells only Gauls, Thracians and Germans, straight off the legions at the docks. Ashur sells only easterners and *"talks constantly, knows every man's history, and half of what he tells you is true and useful."* Cossutius *"sells what the others would not take."*

**And the pitch is character, not data.** Selling a man with something wrong, Verrus says *"there is something you should have looked at"* 94% of the time and does not say what. Cossutius says the man has never been beaten by anybody worth naming — or, when he is not lying, *"is very keen to talk about something else."* The same information, delivered as a person.

**They remember.** Buy four from Ashur and he *has your measure* at **9% off**; buy eight from Verrus and he goes **18% off**. Pay to have three of his men looked over and catch a flaw each time and he *will not meet your eye* — and charges you **6% more** for the privilege of dealing with somebody who checks.


### v1.3.0 — Somewhere to practise
Every decision in this game has been permanent from the first morning. Somebody who has never seen the arena had to risk a man to find out what it is.

**Watch a bout**, on the title screen next to the records. Oenomaus, the Wall — a murmillo of the House of Batiatus — against Barca the thraex, in the amphitheatre on a fair day. Eleven beats, five rounds, and nobody dies.

It is **the same bout every time**, seeded and deterministic, so it can be described and recommended. It builds its own house and touches nothing of yours: a real save is byte-identical after watching it twice. And it **resolves its own crux** rather than asking a first-time watcher to make the hardest decision in the game before they have any stake in it.

It opens with *"Somebody else's afternoon, on somebody else's sand. Nothing here is yours and nothing here counts"* and closes with the one thing a new player most needs to be told:

> *"That is the whole of it. You choose who goes out and against whom, and then you watch. The men decide the rest, out of what you have trained into them and what they think of you."*

The v0.97 reading appears underneath it, so the first thing anyone sees is not just a fight but an explanation of why it went that way.


### v1.2.0 — The doctore
The most-mentioned man in the game and the least realised: a training multiplier with a name. He was a gladiator who lived, which is rare, and he has a view about how you are running this.

**Six pasts**, one per man:

- *who was let up* — fought eleven years and was let up twice, which he mentions when a man of yours goes down and not otherwise
- *who bought himself out* — a coin at a time over nine years, and has never once said what it cost him
- *who taught the man who killed him* — trained a boy in another house who later put a man of his in the ground. He does not blame the boy
- *who broke* — went out one afternoon and could not do it, and came back to the trade the only way left to him

**And four ways of running a yard**, which are mechanically different houses to work in:

| | Believes | |
|---|---|---|
| **He drives them** | a man not broken in the yard breaks on the sand | training ×1.12, strain ×1.22, regard −0.35/wk |
| **He is patient with them** | a man in four years beats a corpse in two | training ×0.94, strain ×0.78, injuries ×0.86 |
| **He teaches the trick of it** | the sand is won before either of them moves | technique ×1.18, crowd +2 |
| **He is fond of them** | knows every man's name and which are lying about it | regard +0.7/wk, unrest −0.35/wk |

Measured over ten weeks on the same yard: **regard falls 3.5 under a hard doctore and rises 7.0 under a fond one.** Hiring is now a choice about what kind of place this is, not a number.

**And he reports.** A line in his own register that reads the yard: *"Half of them are hanging off the post and he says that is what the post is for"* against *"He wants 3 of them rested and has said so twice, which for him is shouting"* — the same week, two different men. An existing save whose doctore predates all this keeps working at ×1.00 and simply has no creed.


### v1.1.0 — The shape of a week
Measured a turn by thirty-week band and found the problem exactly: **urgent demands rise from 4.2 a week to 7.0, while first-time events fall from 86 to zero.** The late game asks more of you and gives less back. Both halves fixed.

**The noise.** Thirty-nine per cent of a mature agenda was a single line — *"has not been sworn in"*, one per unsworn man, forever, for a ceremony that costs nothing. Unsworn men, worn steel and unfamiliar kit now collapse into one line each when several apply. **Agenda items per week fall from 10.8 to 7.5 at the peak**, and no single line is more than 13% of it.

**The silence.** Four things that only a house with a decade behind it can meet, once each:

- **A man from Rome with questions** — writing something about the trade. He wants to know how many you have buried, how many you have freed, and whether it was worth doing. *"He writes down everything you say, including the pauses."* Tell him the truth for fame and the reputation you have actually earned, or tell him the version with the good afternoons in it for nearly twice as much.
- **Somebody's son at the gate** — fifteen, too thin, walked a long way to say his father fought here. *"He is not lying about the father."* Take him on, put him in the kitchens, or send him home; every man in that block notices which.
- **An offer from across the sand** — a rival proposes you stop bidding against each other. It saves both of you money and it is exactly what the aedile exists to prevent. **+18 heat** if you shake on it.
- **A morning you do not get up** — *"the house runs, the men are fed, the ledger is in order, and you cannot think of one thing you want to walk out into."* Get up anyway at six health, hand the week to the doctore, or sit in the sun and find out the house does not need you every single day.

Nine of ten campaigns reach year 8, and 1.1 of these arrive per run.


### v1.0.1 — The accessibility audit
Never done, and the one item on the list that was a defect rather than an absence. Audited first — contrast is measurable — then fixed.

**Contrast.** Seventeen text colours checked against both the panel and page backgrounds by WCAG relative luminance. Three failed AA: the plan's unbuilt-wing labels at **2.71:1**, the faint dim text at 3.46 and the tab hint at 4.27. All three lifted to the nearest tone clearing **4.5:1 on both backgrounds** — 4.55, 4.53 and 4.51. **Seventeen of seventeen now pass**, and the plan was re-rendered to confirm unbuilt wings still read as unbuilt.

**Tap targets.** **All 21 inline button paddings** were under 10px vertical, below a 44px target once line-height is counted. All raised.

**Text size.** Six pieces of real interface text sat under 11px, the smallest at **8.5px**. Raised to an 11px floor. Textareas holding pasted house strings keep their monospace 11px, which is correct for that job.

**Semantics.** The plan and the arena were unlabelled graphics — both now carry `role="img"` and a live description: *"A plan of the ludus. 7 of 15 wings built, 5 men in the yard, 1 in the infirmary."* The house-name and seed inputs had no accessible names and now do.

**What was already right**, and worth recording: every action is a real `<button>` (153 of them, none without an accessible name), the tab bar is a proper `role="tablist"` with `aria-selected`, the bout narration is an `aria-live` region so a screen reader follows the fight, decorative icons are `aria-hidden`, and `prefers-reduced-motion` is honoured in the stylesheet.


### v1.0.0 — The first purchase, the first death, and a number
Two moments that happen once per house, and then the version number.

**Before you buy anybody.** The block has never warned anyone that it lies. *"He is not obliged to be right and he is not obliged to be honest — the numbers on the block are his account of them, out by a couple either way on a sound man and further on one who is not. About a third of the men standing there have something wrong that he has not mentioned... Buy the cheap one if you must. Everybody does. Just know which of the two things you are doing."*

**The first one.** The emotional centre of the game has always arrived with no framing at all. *"The cells took it harder than the ledger did. Every man in that block watched a decision get made about somebody they ate beside, and they will each have formed a view about what kind of house this is. That view is worth real points on the sand and it does not reset.*

*A man who goes down can be let up. The cloth costs you the purse and it costs you nothing else, and the men who see you throw it fight measurably harder for you afterward. It is the strongest thing in this game and it looks like weakness, which is most of why it works."*

Both fire exactly once and never again, verified across fourteen campaigns and three hundred deaths. The death word initially fired from `d.fallen.push`, which turns out not to be the path a bout death takes — it is wired to all five places a man is actually marked dead.

**And the number.** Thirty-eight regression harnesses, every one passing. A full component mount. A game that installs to a home screen, plays offline, seeds and shares houses, teaches itself in twenty-eight lessons and a ten-step charter, tells you what decided every bout, says whether your numbers are any good, and offers an opinion when you are stuck.


### v0.99.0 — The doctore's opinion
The agenda has always said what is *pending*. It has never said what is *wise*. A player looking at six tabs with no idea which to open had nowhere to turn.

**One line at the foot of the agenda**, read off the actual state of the house — seventeen pieces of concrete advice, weighted so the most urgent wins:

- *"You are into the moneylenders and the week does not care. Put somebody on the sand at first blood — nobody dies at those stakes and the purse is real."*
- *"The cells are close to going up. A feast is a hundred and twenty denarii and it is the cheapest thing you will ever buy."*
- *"Nobody is fit to go out. Rest the worst of them this week; a man sent out tired is a man sent out to lose."*
- *"You are owed money and short of it at the same time. Sell the paper at a discount — a purse you cannot spend is not a purse."*
- *"There is coin sitting still. A wing of the ludus pays every week for the rest of the run; coin in a box does not."*

And when there is genuinely nothing wrong: *"Nothing is urgent. Train them, keep the cells fed, and take what cards you are offered — a house is built out of quiet weeks more than loud ones."*

Verified across **1,200 houses in every scenario and at every age: none silent, none malformed.** Following one house for sixty weeks, the advice changed ten times and tracked what was actually happening.

Two fixes during the build. Every line reached into a `find()` that its own condition guaranteed — correct today and one refactor from a crash, so all five now survive their condition not holding. And the weights were wrong twice: hiring a doctore outranked a card already on the table, and a mastery outranked the rudis.


### v0.98.0 — Is that good?
Fame 340. Unrest 44. Regard 61. Nothing in ninety-seven versions has said whether those are numbers to be pleased about.

**The house header now carries a comparison**, against a house the same age as yours. It is measured rather than asserted: twenty-six campaigns sampled every week for two hundred weeks, quartiled into ten twenty-week bands and baked in as a table.

| Week | Fame (25/50/75) | Coin | Regard |
|---|---|---|---|
| 20 | 54 / 78 / 108 | 627 / 1,194 / 1,890 | 48 / 56 / 63 |
| 60 | 65 / 103 / 186 | 1,121 / 1,886 / 2,610 | 57 / 67 / 75 |
| 100 | 123 / 196 / 402 | 1,921 / 2,757 / 6,472 | 62 / 73 / 83 |
| 180 | 271 / 738 / 1,113 | 3,771 / 26,189 / 49,981 | 70 / 81 / 98 |

Four words per line — *behind most houses · a little behind · about typical · ahead of most houses* — and unrest reads the other way round, since low is good: *quieter than most · about typical · higher than most · dangerously high*.

**Verified against the game it describes.** Playing houses and counting which band they land in gives fame 17/22/26/35, coin 15/31/31/24 and regard 22/23/26/28 — close to the 25/25/25/25 a well-calibrated band should produce.

**And it says nothing at all before week 6.** The first pass told a brand-new house it was *behind most houses* on its first morning, which is both true and a terrible thing to tell somebody who has just started.


### v0.97.0 — What decided it
The arena is watched, not driven. A new lanista sees his man carried off and has no way of knowing whether he was under-armed, exhausted, badly matched or simply unlucky. **Every bout now ends with a reading of what actually decided it** — the three heaviest causes, worst first, drawn from the man's state as he walked out.

It weighs eighteen things: fatigue, deep strain, a lasting wound, form, what he thought of the house, unfamiliar steel, gear nearly gone, how well armed he was, the win gap against his opponent, the style counter, the tier against his renown, the footing, the rain, the heat against his wind, the plan you gave him, a cold front row, the crowd, and whether there was mercy on the card at all.

- *"He went out at 64 fatigue, which is most of a man's edge before anything else happens."*
- *"The murmillo is the wrong match for a thraex and everyone at the editor's table knew it."*
- *"He thinks very little of this house, and a man who thinks little of you does not spend himself for you."*
- *"His knee that goes — past the sixth round he is not the same man."*
- *"There was no mercy on that card. There was never going to be a decision to lean on."*

**And it does not invent a lesson where there was none.** A man who went out fresh, well armed and fairly matched and lost anyway gets: *"Nothing was wrong with any of it. Some afternoons the other man is simply better and there is nothing in the ledger to blame."*

Verified across 400 bouts — every one produces a reading, averaging 1.6 lines, and eleven deliberately broken setups each name their own fault first. Compliments no longer explain defeats, which was the first pass's mistake: a man who lost while well armed was being told he was well armed.


### v0.96.0 — The law
Rome legislated this trade constantly — caps on how many armed men a private citizen could keep, a tax on every sale, decrees about who could be put on the sand. In ninety-five versions the game has never once told you that you cannot do something.

**Five edicts**, up to three per campaign, arriving from week 22:

| | |
|---|---|
| **On the keeping of armed men** | a cap set **one to three below what you already keep** — it is aimed at you |
| **The tax on the sale of gladiators** | 8–14% on every purchase, collected before the man is off the block |
| **On women upon the sand** | *"It names no house and everybody knows which houses it means"* |
| **On fights without mercy** | not banned, licensed — 40–90d for the magistrate's seal on every sine card |
| **On the condemned** | a house holding condemned men will account for them |

Each arrives as a decision: **comply**, which costs nothing today and something on a day you have not thought about — or **carry on and hope**, which is what most houses do, *"and the difference between you and most houses is that somebody is already writing your name down."*

**Heat accumulates while you are in breach** — 1.6 a week per edict broken, falling 0.9 a week when you are clean. *Nobody is looking at you · noticed once or twice · you are being watched · the magistrate has your name on a list.*

**And then the inspector, who does not send word.** A man from the aedile's office standing in your yard with a wax tablet, who has been there long enough to have counted things. **Pay the fine** (−25 heat), **buy the tablet** at 55% of the fine — which works 72% of the time and, when it does not, *"he takes the money, writes it all down anyway, and adds a line about the money"* — or **let him write**, which is free and puts an account of exactly what this house is into the aedile's office.

Measured on a house that plays: **1.6 edicts complying against 2.2 ignoring, heat 36 against 49.** A house that stays three men over the cap gets **8.1 visits and 2,519d in fines** across 120 weeks. A house that obeys never sees him at all.


### v0.95.0 — The plan of the house
A ludus was a square of cells around a yard. The game's subject has been pure abstraction for ninety-five versions — a list of numbers describing a place nobody could picture.

**It is drawn now**, at the top of the home tab, and it changes as the house does:

- **Carceres** along the north — six cells that light as the level rises
- **The palus** down the west, with a post appearing for each level
- **Armoury and infirmary** down the east — racked blades on one, and beds on the other that **turn red for each man currently on them**
- **Balneae** along the south, which doubles in width if you build the great baths
- **The yard** in the middle, with the **spina** in it once that work is standing
- **The shrine** in the north-west corner, **the school** in the north-east, and **the tomb outside the south wall**, each appearing only when finished
- **And the men**, standing about in it — pale for a sound man, amber for one at the far post, rust for one carrying something permanent, and red for a man who is refusing

Underneath: *"Four walls, a yard, and whatever you brought with you"* for a new house, or *"12 of 15 wings raised, and 5 things that will outlast you"* for an old one.

Rendered server-side and rasterised at both extremes before shipping — an empty house reads as dark rooms around a bare yard, and a complete one reads as a lit square with three monuments and a tomb on the road out. The difference is legible at a glance, which was the whole point.


### v0.94.0 — A man better than you deserve
Everything on the block has always scaled with the house looking at it. Nothing ever arrived that was simply out of your league.

**Once per run**, after week 30 and 120 fame, a man appears that the whole town has come out to look at. Four of them exist and you will meet one: Verus, whose lanista died and whose estate is being broken up by a nephew who does not want any of it. Priscus, who fought a man to a standstill in front of the emperor and then sold himself back into it because there was nothing else he knew how to do. Flamma, who refused the rudis four times. Spiculus, who had a house and land and lost both in a way nobody will discuss.

**What he is:** average stat **93 against an ordinary man's 55**, twenty-nine bouts behind him, potential 99 — and **3,096 denarii against 578** for the best man you would otherwise see. On the sand he wins **99% against your ordinary man's 58%.** His bearing is correspondingly high, because the best man you will ever own is the most dangerous to own.

**And you almost certainly cannot afford him.** So the market offers the other way: **take the house apart.** Every piece of steel off the racks, every debt sold at a discount, and every gladiator but one led out through the gate — in one measured case **35 pieces, one debt and five men, raising 6,242d**. It costs 25 unrest, a memory in every surviving man, and *"everybody in Capua knows exactly what you are about to do."*

**He waits three weeks.** Then *"Priscus, the Fury goes to House Solonius. Marcus Solonius paid it without haggling, in front of people, which was most of the point"* — and that rival gains 60 fame permanently.

He appears in **92% of long campaigns, typically around week 74.** A house under 120 fame never sees him at all.


### v0.93.0 — The week that is not a week
Every turn has been seven days of identical shape, costing the same attention whether anything was in it or not. Measured across 960 weeks of a running house: **38% of weeks are genuinely quiet**, 53% ordinary, 9% full.

A week is now weighted by what is actually in it — a pending event, a card your men can take, a deadline inside two weeks, a man refusing, an open election, an editor who has stopped paying, unrest near the fire. **When the total comes to nothing, the End Week button gains a companion: *Let it run · 4w*.**

It advances as far as it can and **stops the instant anything wants you** — an event, a card, a doctore at the gate, a contract up, a succession. Nothing is skipped. Verified against the identical RNG state: three weeks batched and three weeks by hand produce **byte-identical week, gold, unrest and fame**. It is exactly N calls to `endWeek` with an early exit.

Afterward a sheet says what went by: *"Four quiet weeks. They train, they eat, they argue about nothing, and the doctore reports that nothing needs reporting"* — followed by whatever the chronicle recorded while you were not looking.

**27% fewer presses of the button across eighty weeks**, and every one of the removed presses was a week where the honest answer to *what do you want to do* was *nothing*.

Two corrections during the build. The skip initially halted on any card at all rather than a card that had just arrived, so it never ran past one week; and a card nobody in the house could fight still counted as a busy week. Both now check whether the card is this week's and whether anyone can actually take it.


### v0.92.0 — Great works, and the long middle
Measured a campaign in 25-week bands and found the problem precisely. **Gold climbs from 638 a week to 27,569 while bouts stay flat at three.** The entire buildable game — every building level and one of every piece of steel — costs **26,580d**. A house at week 175 is sitting on more than that with nothing left to buy, and after week 75 the count of new things seen per band falls from 20 to 7.

The long middle had no sink and no escalation. **Five great works**, each costing more than a wing of the ludus and taking years:

| | | | |
|---|---|---|---|
| **A proper shrine** | 5,500d | 1 year | unrest falls 1.1 a week, forever |
| **A spina for the yard** | 7,000d | 2 years | +4 crowd on every bout |
| **A tomb for the house** | 8,500d | 2 years | +0.4 regard a week, and a death costs the cells far less |
| **Baths worth the name** | 9,500d | 2 years | six more fatigue shed weekly |
| **A school under your name** | 12,000d | 3 years | +3 fame a week |

All five is **42,500d** against 26,580 for everything else in the game combined.

They are slow on purpose — *"9,500 denarii gone in a morning, and nothing to show for it for two years"* — and they are the only things in the game that pay a dividend forever rather than once. The tomb is the one I would build: *"Every man in that block has now seen exactly where he is going, and it is not a ditch."*

Measured effect on the problem: end-of-campaign gold falls from **27,569d to 13,088d**, and a long house finishes one or two. The agenda now says when there is coin in the box and nothing being built.


### v0.91.0 — Rome remembers
The gate moved to fame 1000 with a 45-week cooldown, which turned Rome from an ending into a summit you can revisit. The content still assumed one visit. **The city keeps notes now.**

**Standing, which is not fame** — 12 per visit, 26 per triumph, 8 per bout taken:

| | |
|---|---|
| never been | *nobody at all* |
| one visit, took one | *nobody at all* |
| two of three taken | *Rome has heard of you* |
| three visits, two triumphs | *they know your house in Rome* |

**And the greeting changes.** First time: *"Nobody here has heard of you and the man taking your names spells them wrong twice."* After a bad visit: *"They remember that you came and that you took nothing, and somebody says so within earshot on the first afternoon."* After a good one: *"He knows the house. You took 2 of three the last time and he has the tablet open at the page."*

**Three editors**, one per visit, each with his own habit — the one who keeps a tablet on every house that ever fought there, the one who says almost nothing, and the one who is charming and has bankrupted two houses this year by being both.

**The terms move with the standing.** Purses **×1.00 → ×1.45** (3,386d → 5,255d a card) and no-mercy cards **53% → 73%**, because a city that knows your house wants more from it. Being known is worth money and costs men.

**And Rome does three things to a house that keeps coming back**, once per visit, gated on what you have already done there:

- **matched** — the editor has thought about your man. The opponent comes with **6.4 wins behind him instead of none**
- **watched** — somebody in the imperial box asks who owns the house from Capua. *"Your name is said aloud in a place where names are not usually said aloud."* +40 fame, +14 senator
- **offer** — a Roman familia asks what it would take to buy your best, and *"names a figure that is not an insult, which is the insulting part"*

A first visit gets none of these. A house that has triumphed gets two. It fires on **56% of return trips**, and the record book now carries what Rome makes of you.


### v0.90.0 — The consolidation pass
Thirty-one features across three bursts, every one verified in isolation and none against the others. This read the whole thing as a composite. Full findings in `CONSOLIDATION.md`; four things were wrong and one thing I expected to be wrong was fine.

**Careers were dying out.** 245 men across ten 200-week campaigns: **171 died, and only 19% ever reached ten wins.** No per-bout rate had drifted — standard stakes still killed 2.1% and blood stakes still killed nobody. The composite was the problem: a campaign now runs 504 bouts across a roster of six, so 35 bouts is a coin flip and everyone eventually rolls it. The bout count rose when fatigue softened in v0.77 and the road to Rome lengthened in v0.89.1; the death rate was never re-checked against it.

A veteran now carries his own guard on the missio — **+0.5 per win to a cap of 11**. Death per bout at standard stakes is now **12.3% for a novice in a house at no standing, 2% at standing 25, and near zero for a man with eight wins behind him.** A young house at low standing is where men die, which is where they should. **Mortality across a full campaign: 70% → 36%.**

**Renown had drifted an order of magnitude past its gate.** The rudis wanted 62; a long career now reaches 625. Re-sampled across 1,950 man-weeks of ten-win veterans: median 119, 75th percentile 217. **The gate is 180**, where a third qualify — the same intent I calibrated at v0.77 against a game that produced a tenth of the numbers.

**The agenda overflowed.** Busiest week seen was **11 items against a UI that shows 7**, and the four dropped were always the lowest urgency. Patron wants and strain warnings now collapse into single lines when several are live, and the panel says *"and 3 smaller things besides"* rather than silently hiding them. Busiest week is now **6**.

**What was fine.** Multiplier stacking, the thing I most expected to be broken. Across 5,872 sampled man-weeks the total power multiplier runs 0.69 at the worst percentile to 1.00 at the best, median 0.92 — and almost all of the spread is fatigue rather than the trait stack, which spans 0.98 to 1.00. Fifteen systems compose sanely. And only two pieces of player-facing prose contain hard numbers, both still accurate, because the lessons describe mechanics qualitatively. That is worth keeping to as a rule.


### v0.89.0 — What never quite closes
Scars already cost a stat and capped it. But a man carried off four times is not the same fighter with marks drawn on him. **Three wounds to the same place now leave something permanent**, and he finds out about it in the eleventh round.

| | From | |
|---|---|---|
| **a knee that goes** | the thigh | *"It holds all week and then it does not, usually at the worst moment"* |
| **no wind since the ribs** | the flank | *"There is a point past which there is nothing"* |
| **a hand that will not close** | the hand | *"He cannot hold it the way he used to at the end of a long one"* |
| **the eye on that side** | the brow | *"He turns his whole head now where he used to turn his eyes"* |
| **a shoulder that hangs** | the shoulder | *"The medicus says it mended"* |

**The shape is the whole point — small in a short bout, real in a long one:**

| | Short bout | Long bout |
|---|---|---|
| sound | 53% | 61% |
| a knee that goes | 50% (−3) | 53% (**−8**) |
| no wind since the ribs | 50% (−3) | 51% (**−10**) |
| a shoulder that hangs | 46% (−7) | 49% (**−12**) |

They cost stamina all the way through and power only past the sixth round, so a veteran can still win a quick one and cannot be sent into anything that might go long. A shoulder also mends 15% slower forever after.

Rare enough to mean something: **2% of men across fourteen campaigns** end up carrying one.

The first pass applied the arm and eye conditions as flat multipliers on total power and they cost 18–23 points across the board, which is a crippled man rather than a damaged one. Moving the weight onto `latePow` produced the intended curve.


### v0.88.0 — What they do unwatched
The cells whispered and the ear reported, but nothing ever actually happened down there that you had not arranged. **Ten things the block now does on its own**, about one every ten weeks:

- **taught** — *"He has been taking the new one out to the post after the others have gone in. Nobody asked him to and nobody was told."* +2–4 to a stat, and a bond
- **theft** — a piece is not in the racks and has not been for a while. *"Nobody says anything, which means several of them know"*
- **kindness** — *"He has been sitting with him at night. He does not do it where anybody can see him doing it"*
- **shrine** — one appears in the corner of the block. Nobody will say whose it is
- **dice** — a debt one of them cannot pay, and the whole block enjoying it more than either of them
- **name** — the others start calling him something. *"He pretends not to like it"*
- **language** — seven origins in that block have quietly built an eighth out of pieces of all of them. *"None of it is for your benefit"*
- **grief** — they still set out a portion for a dead man on the day he died
- **wall** — a tally of every bout this house ever fought, scratched in, going back further than you would have thought any of them cared to remember

**And here is the point: it happens whether you hear about it or not.** With nobody listening you are told about **29%** of it. The gatekeeper gets you **54%**. A man of your own inside the block gets you **85%**. The cells panel tells you how many things you have missed, and never what they were.

That finally gives the listening system a reason to exist beyond the rebellion arc: **theft only happens in a house where somebody is discontented** — 100% of attempts with an unhappy man, 0% in a house that likes you — so what you fail to hear is exactly correlated with what you should be worried about.

Two bugs caught by the harness: a man could be paired with himself to sit up at night, and the theft gate required more steel than most houses own.


### v0.87.0 — Measuring the thing before changing it
Ten thousand lines in one 671 KB file sounds like a problem. **It measured as almost entirely fine**, so this version is mostly a record of what the numbers actually are.

| | |
|---|---|
| Download | **213 KB gzipped** — 0.35s on 4G, and 0s once the service worker has it |
| Parse and compile | under a millisecond, so under 5ms on a mid-range Android |
| `endWeek` | **0.53ms** median, 6.19ms worst |
| A whole bout simulated | **0.22ms** |
| A 43-week save | 42 KB; clone and parse **0.82ms** |
| The app rendering | 0.92ms, about 5ms on a phone |

The build was already minified and the largest save field is `rivals` at 10 KB. There was nothing to fix in any of that.

**One real finding.** `FightModal` rendered in **6.19ms — about 31ms on a phone, which is two dropped frames** — and it re-renders on every beat of the animation. The cause was `CrowdRow` rebuilding thirty head elements and `Fighter` rebuilding dozens of SVG paths per side, per beat, none of which change between most beats.

Both are `React.memo` now, with the crowd comparing on a coarsened crowd level so it only redraws when the stands meaningfully shift. Server-side that took it to **4.16ms**; in the browser the saving is larger, because server rendering cannot use memoisation at all and still paid to build every node.


### v0.86.0 — How hard Capua is
Five openings decided where you start. Nothing decided the pressure. **A second axis, chosen at founding**, that never touches the fight engine — only what the town asks of you and how much it forgives.

| | Purse | Upkeep | Unrest | The block | Mending | Missio | Start |
|---|---|---|---|---|---|---|---|
| **With a patron behind you** | ×1.18 | ×0.85 | ×0.72 | ×0.88 | ×1.20 | +8 | +400d |
| **On your own account** | — | — | — | — | — | — | — |
| **With a name to live down** | ×0.88 | ×1.20 | ×1.30 | ×1.15 | ×0.85 | −7 | −150d |
| **Nobody is coming** | ×0.78 | ×1.35 | ×1.55 | ×1.30 | ×0.75 | −14 | −300d |

Measured across 20 campaigns each, 110 weeks:

| | Ran out of road | Gold | Freed | Buried |
|---|---|---|---|---|
| **Patron** | 5% | 20,407 | 2.9 | 8.8 |
| **Own account** | 0% | 8,896 | 2.5 | 8.4 |
| **Name to live down** | 20% | 4,974 | 1.4 | 5.3 |
| **Nobody is coming** | **30%** | 2,719 | 1.5 | 7.0 |

A clean gradient, and the mercy dial is the one that bites hardest: at −14 the missio goes against your man far more often, so the hardest setting is also the one that buries the most men for the least money. *"Houses have been run out of Capua on less. Most of them deserved it."*

An existing save defaults to **on your own account**, which is what every campaign to date has been playing.


### v0.85.0 — The household
Eighty men have been fed, nursed, buried and washed by nobody at all. **A ludus was a household before it was a business**, and the people who kept it running were mostly women and mostly on nobody's roster.

| | | Measured |
|---|---|---|
| **Cook** | 5d/wk | six weeks from 60 fatigue leaves the yard at **45 instead of 58** |
| **Nurse** | 6d/wk | a five-week wound closes in **4.85 weeks instead of 6** |
| **Housekeeper** | 5d/wk | unrest over twelve quiet weeks: **44 instead of 50** |
| **The lanista's wife** | — | half a year of the work: **69 health instead of 60** |

None of them will ever be on a card. **And they leave** — a house at 85 unrest loses one within thirty weeks **92% of the time**: *"gone in the morning without saying anything to anybody. She was owed two weeks and did not ask for them."* A quiet solvent house keeps them all. The wife stays through everything, which is its own statement.

**And a woman on the sand is now a different proposition.** Gladiatrices already occurred naturally in the pool; they were simply men with different names. She now draws **+12 crowd and 15% more purse** — and splits the amphitheatre permanently. Fought week after week, the front rows fall from 40 to **7** and the mob climbs to **83**, then both hold. *"The upper tiers will not shut up about her and the front rows think it is vulgar."*

The first pass had no floor on that and drove the front rows to 1 across twenty bouts, which is a faction destroyed rather than a faction disapproving.


### v0.84.0 — Coin that behaves like coin
Gold has been one number since v0.1. A lanista's actual problem was almost never whether he was rich — it was whether he could put his hand on it this week.

**The pits pay out of a bag at the rope. An editor pays when his clerk gets to it.** Any purse of 140 or more at the games, a booking, the circuit or Rome now arrives **35% in hand and the rest on the books**. Measured across 25 campaigns: winning at the games gives **265 denarii at once and 393 on the books**, against **57 in cash** for a pit win. The games pay in 2 weeks, a contracted bout 3, the circuit 4, Rome 5.

**And they do not all pay on time.** 55% settle on the day, 45% are late, and one that goes eight weeks past due is written off with three fame — *"chasing it further would cost more than it is worth and everybody involved knows that."*

**Who you are decides how fast you are paid.** A house Capua calls butchers waits **1.38 weeks** on average; a house known for craft waits **0.55**, the same as one with a friendly aedile. Being owed by four editors at once makes all of them slower.

**Or you sell the paper.** A man who buys other men's debts gives **62%** on the spot, 68% if your reputation is good. *"He will get all of it eventually. That is the whole of his trade."*

The agenda tells you when you are **rich on paper** — 250+ owed with under 120 in the box — and names any editor who has stopped being at home when your man calls.


### v0.83.0 — The man across the sand
Three rival houses with rosters and a grudge number. **A grudge is only one direction a long acquaintance can go.** There is a second axis now — warmth — and it accrues from simply standing across the sand from the same man for years, provided the grudge is not in the way.

**Eight beats**, each firing once per house and gated on real history:

- **drink** — six cards in and neither of you gets up first. *"He is better company than he has any right to be"*
- **respect** — ten cards each way. *"At some point in the last few years the thing between you stopped being about winning"*
- **loan** — 400 denarii with a note: *pay it when you have it, and do not make a thing of it*
- **warning** — the man they matched against yours is not what the bill says he is, and he thought you would want to know
- **offer** — would you take one of his men for a season? He is not selling. He wants the boy taught something you do better
- **bitter** — *"he hopes your house has a good year. Everyone at the table understands what has been said"*
- **old** — *"there is nobody left in Capua who remembers the trade the way the two of you do, and he said so out loud, which cost him something"*
- **end** — he is not at the games, and a letter comes: sold up, gone to a farm near Nola, and would you look in on his doctore

**Warmth protects you.** A house on good terms at 45+ will not send men round and will not poach, which is a real defensive reason to let a rivalry become something else.

Measured over 14 campaigns of 170 weeks: **4.6 beats per campaign**. In their own conditions the specific beats correctly beat the general ones — bitter 82% in a bitter rivalry, loan 83% when you are warm and broke, **end 100%** at twelve years and thirty cards.

The arc initially stalled at four of eight because warmth only rose from the beats themselves and so could never bootstrap past 10. Meetings now add 1.1 each, which is what lets a decade of cards turn into something.



### v0.82.0 — What each style actually does
Six classes that fought identically with different numbers. Attack names were pure flavour, picked at random. **Each style now has one signature move that behaves differently from an ordinary exchange** — its own odds, its own payoff, and its own way of going wrong.

| | | Lands | Misses |
|---|---|---|---|
| **Retiarius** · the cast | 28% | **×1.9 damage** | guard to **0.72**, −16 wind |
| **Dimachaerus** · the flurry | 34% | ×1.7 | guard to 0.76, −10 wind |
| **Thraex** · the hook | 33% | ×1.5 | guard to 0.78 |
| **Hoplomachus** · the reach | 31% | ×1.45 | guard to 0.75, −11 wind |
| **Murmillo** · the shield | 42% | ×1.2 | **guard to 0.90** — barely costs him |
| **Secutor** · the press | 40% | ×1.15 | guard to 0.88 |

That is the whole point: **the net gambles and the shield grinds.** A miss leaves an opening the opponent takes on the very next exchange.

**A man goes for it when he is winning or when he is pressing** — 28% of exchanges at a measured pace, 39% pressing, 15% covering up, 35% with momentum, and only 18% when he is blown. Technique raises it slightly.

> *"The net goes out and comes back empty. He is a man with a stick until he has gathered it."*
> *"He comes on with both and finds nothing, and there is nothing in either hand to hide behind."*

**The counter cycle survives it**, which was the thing to protect: all six counters run **58–73%**. Against the whole field the spread is 14 points — Secutor 55%, Murmillo 52%, Hoplomachus 50%, Thraex 45%, Retiarius 43%, Dimachaerus 41%. The steady styles are steady and the volatile ones are volatile, which is a real reason to pick one.

The first pass had the flurry at ×1.55 with a 0.66 guard penalty, which dropped Dimachaerus to 54% against the Murmillo it is supposed to counter while every other counter sat at 62–76%. More damage on the hit, less ruin on the miss, and it sits at 58%.


### v0.81.0 — An ending worth reaching
The ending was the same ending whether you got there in forty weeks or two hundred, freed twelve men or buried thirty. The house carries an enormous accumulated history by then and the ending read almost none of it.

**A verdict, and it does not flatter.** Seven of them, chosen from what actually happened:

| | |
|---|---|
| **They will say you were a merciful man** | 4+ freed and half again as many freed as buried |
| **They will say you were a butcher** | 8+ buried against almost nobody freed |
| **They will say the house outlived you** | more than one lanista held it |
| **They will say you were unlucky** | 40+ bouts under 42% |
| **They will say your men were the ones to beat** | 40+ bouts at 58% or better |
| **They will not say very much at all** | under 25 bouts — *"not a career, an attempt"* |
| **They will say you knew the work** | everything else |

**And a closing account** that reads the record book and the annals back: the best man the house ever had and how he ended, your best and worst style by win rate, **the house that took you apart** with the record to prove it, your worst single year by burials, the purses, the feats, and **every man you freed, by name.**

**Two endings that the game's own values implied and never offered.** *The gates stand open* — free five or more, more than you buried, and empty the cells on purpose: *"Capua thinks you have lost your mind, and one lanista in Neapolis writes to ask how it was done."* And *the long tenure* — a lanista past 62, still well, with an heir named, simply stops: *"There is no single morning it ends... by summer the house is being run by somebody else and everybody has agreed not to say so."*

One bug found in the build: the nemesis-house comparison tested a 0–1 fraction against a stored 0–100 percentage, so it named whichever house came first rather than the one that beat you. It now correctly picks Tullius at 2 of 14 over Solonius at 5 of 9.


### v0.80.0 — The morning after
Everything in this game landed the instant it was earned. A man died and the unrest was there before the body was cold. **Eight consequences now arrive a week late**, when you have already moved on to something else.

No new state. The week keeps a ledger of itself as it happens — bouts, deaths, kills, men spared, men carried off, the best crowd, the purse — and the following week reads it back:

- **The bench where he sat is empty** and nobody has moved along to fill it. +unrest, −morale
- **Somebody from the other house came to the gate** to ask after the body. He was not let in
- **Half of Capua is still talking about him.** Two men who have never fought at the games asked the doctore what he does differently. +5 fame
- **Nobody has said anything about last week's card**, which is its own kind of review
- **The man you let up is still alive somewhere**, and every man in your cells knows how that decision was made. +regard
- **He is in the infirmary** and the yard works around the space where he usually stands
- **The coin is spent before it is counted** — the butcher, the smith, and a man from the magistrate's office who had heard about it already
- **A week with nobody on the sand.** They train, eat, and get on each other's nerves in the usual order

Measured across 14 campaigns and 956 weeks: **one morning every 15 weeks**, led by triumph at 61% and mercy at 29%. A flat card only reads as a failure once the house has a reputation to disappoint.

Three tuning passes to get there. The first delivered nothing at all — the line was written *before* the week's own upkeep summary and buried by it. The second delivered 39 a week, 94% of them the same one, because the thresholds were set for festival-scale numbers when an ordinary week is two bouts, forty denarii and a crowd of 26. The third overcorrected to almost silence. What finally worked was calibrating every threshold against a measured real week rather than an imagined one.


### v0.79.0 — A reason to leave Capua
The v0.76.0 audit found five venues, three cities and Rome sitting behind travel, unseen by any house that stays home. Nothing new is built here. **Staying put is given a price, and the bay is given a memory.**

**Local standing rusts.** Whatever you built down the coast bleeds **0.55 a week** while you are not in it — Pompeii at 60 falls to 49 over twenty weeks at home, which drops you from tier 3 cards to tier 2. Standing still the moment you arrive.

**And somebody else takes the coast.** After **thirty weeks without leaving**, a rival house may start working the bay: *"Word comes up from Puteoli that House Vettius has been fighting the whole bay while you have been minding Capua."* It costs 4 fame every eight weeks and Capua notices which houses travel. Turn up anywhere down there and it stops being theirs on the spot — and that house's grudge rises 12, because you took it back in front of them.

| | Loses the bay in 90 weeks |
|---|---|
| **Never travels** | **81%**, typically week 53 |
| **Travels once a year** | **0%** |
| Travels every ten weeks | 0% |

A consequence of a choice, and cheap to avoid if you make the other one.

**And there is a pull as well as a push.** Once your house has 90 fame and a man with a name of his own, a town writes and **asks for him by name** — an advance paid up front, the crossing arranged, and the wagons out inside the week. Decline and you lose 3 fame, *"which is the answer a smaller house gives."*

The circuit panel now shows what a stranger's standing costs before you go: a man of yours who goes down in a town that has never heard of him is spared about half the time, against every time at home.


### v0.78.0 — Carrying a house out
A seed shares an opening position. This shares an actual house, mid-campaign, in a string somebody can paste into a message: **every man, the chronicle, the record book, the annals, the relationships, and the generator's exact position**, so the receiving copy continues the same run rather than a similar one.

**`LVDVS1z.checksum.body`** — deflate-compressed and base64url encoded, no `+`, `/` or `=`, so it survives URLs and chat apps. A 41-week house is **11,623 characters compressed against 53,578 plain**, a 4.6× saving that is the difference between shareable and not. It falls back to uncompressed automatically where `CompressionStream` is unavailable.

**It fails loudly rather than quietly.** An FNV-1a checksum sits between the tag and the body, and every corruption is refused with a specific reason: an empty box, random words, a bare JSON save, a seed pasted by mistake, a paste truncated by a chat app, and a single flipped character all come back with something a person can act on. A save from an older version is migrated on the way in.

Verified across 19 checks on a real 41-week house: byte-identical round trip including the chronicle, the book and the RNG position, plus all seven refusals.

One real bug found in building it — a damaged paste rejects the **writer** of the decompression stream as well as the reader, and that rejection escaped the caller's `try/catch` as an unhandled error that crashed the tab rather than showing a message. Both sides are caught now.


### v0.77.0 — Fatigue, and a correction
The v0.76.0 audit reported that fatigue blocked 49% of all man-weeks. **That number was wrong.** The game has never prevented a tired man from fighting — the 60-point cutoff was my own test harness's policy, and the audit measured the harness rather than the game. Diagnosing it properly turned up two real things instead.

**Fatigue was punishingly steep.** It cost up to 33% power on a straight line, so a man at 55 fatigue — a normal state two weeks after a bout — dropped from **53% to 21%** against a fresh equal. An 11% power loss producing a 32-point swing is why every sensible player rests every man every time. The curve is now gentle to 45 and steep after: **43% at 30 fatigue (was 36), 30% at 55 (was 21), 7% at 95 (was 5).** A lightly tired man is a real option; an exhausted one is still a bad idea. A fresh man is unchanged at 52%.

**And the rudis works after all.** A house that actually keeps its men on the sand produces **250 bouts and 76 peak renown per campaign** — the earlier figure of 55 came from a harness sending two men a week. So the v0.76.0 renown boost was an overcorrection and **has been reverted to ×0.7**, with the gate set at **62** rather than 90 or 45.

Final measurement across 30 campaigns: **1.97 men freed per run, 0.5 buried.** At the start of this session it was 0.03 freed. The wooden sword is an achievement — roughly twice in a lanista's career — rather than a formality or an impossibility.

The lesson, recorded because it cost two versions: **a harness that models a player's policy will measure that policy, not the game.** Anything the harness chooses not to do looks like something the game forbids.


### v0.76.0 — The audit, and the rudis
Rather than guess which systems were over-built, thirty campaigns were instrumented and played through — **2,655 weeks, 1,809 bouts** — counting every state the game can be in.

**It found the worst bug in the game.** The rudis fired **once in 2,655 weeks.** The gate wanted 90 renown; the best gladiator across twelve full campaigns reached **55**. The wooden sword — the thing the design calls the strongest long game and the moral centre of the whole thing — has been unreachable for the entire life of the project.

Sampling 332 man-weeks of ten-win veterans gave the real distribution: median 41 renown, 75th percentile 51, maximum 69. **The gate is 45**, where a third of ten-win men qualify, and **renown earned per victory is up from ×0.7 to ×1.15**. Combat is untouched — even fighters still win 52%.

**What the audit found healthy.** Ambitions, form, the aedileship, weather, venues, the crux, condemned men and the nemesis all appear constantly. Every one of the six skies is drawn. Seventeen events never fired, and sixteen of those are correct: four are pushed by their own systems rather than the random draw, and the rest are gated on unrest, grudges or the war — a house at 80 unrest with a grudge unlocks *sabotage*, *thugs* and *bribedEditor* immediately. Cruelty unlocking its own content is the design working.

**What it found unused.** Five venues never appeared in thirty campaigns — the courtyard, the stone bowl, the harbour, the Greek theatre and the imperial sand — because four are on the circuit and one is Rome, and a house that never travels never sees them. That is content behind a door, not content that is broken.

**And it found the real bottleneck, unfixed:** fatigue blocks **49% of all man-weeks**. Men cannot fight often enough to build the careers the rudis, mastery and favour systems all assume. That is a balance change with a wide blast radius and it is the next thing to look at, deliberately, on its own.


### v0.75.0 — Sound that knows where it is
The synth predated venues, factions and weather, so every bout sounded like the same bout. Every sound now plays **into a room**.

Nine acoustics, a convolution impulse each, measured at 44.1kHz:

| | Impulse | Wet |
|---|---|---|
| **A field outside the walls** | 4,410 samples (0.10s) | 2% |
| **The pit behind the ludus** | 7,056 | 5% |
| **The forum stands** | 14,994 | 12% |
| **A magistrate's courtyard** | 24,255 | 30% |
| **The Greek theatre** | 41,895 | 34% |
| **The amphitheatre** | 48,510 | 26% |
| **The imperial sand** | **70,560 (1.60s)** | 32% |

A blow in a field is dead on arrival; the same blow on the imperial sand rings for a second and a half. Damping runs with it — 3000Hz outdoors, 1600Hz under stone — so a big room is darker as well as longer.

**The crowd bed is sized by the house.** It scales by the same figure the arena view uses for head count, so fourteen people in a courtyard sound like fourteen people and the amphitheatre sounds full.

**And the sky is audible.** Rain lays a bright 2400Hz bed under the whole bout, a hard wind a low 700Hz one, bitter cold a thin trace. A fair day is silent, as it should be.

Verified by running the audio graph against a mocked Web Audio API and asserting on the constructed nodes — eleven checks covering impulse length per venue, the ordering of the rooms, the weather bed opening only on the right skies, and muting closing everything.


### v0.74.0 — The first year
Twenty-eight lessons explain the machinery as it arrives. None of them told a new lanista what to actually do on a Tuesday.

**Ten objectives, in the order a man would learn them**, sitting above the agenda: put them to work · send one out · end the week · buy a man · arm somebody properly · take a card at the games · look at a man before you fight him · keep the cells quiet · **let a beaten man up** · stand for a year.

Every one is finished **by doing it**, never by reading it, and the charter **skips anything already true** — a player who worked out the first three on his own is handed the fourth without being congratulated for the others. It can be put down permanently at any point, and a save already underway is never given homework.

Measured across 60 first campaigns played plausibly: **85% finish, typically by week 21**, which is the "stand for a year" step arriving as the last one. Finishing pays 250 denarii and 12 fame, and the chronicle says the only true thing available: *"Nobody hands you anything for that except the next week."*

The ninth step is the cloth deliberately. It is the decision the whole game is built around, and a first-year lanista should have made it once on purpose rather than stumbled into it.


### v0.73.0 — A man the tiers know by name
The stands had opinions about styles and none at all about men. Renown is what Capua thinks a gladiator is worth; **favour is whether it likes him**, which is a different thing, worth more, and the reason a favourite is dangerous to own.

Five degrees of it — *one more man on the sand · known by sight · a name in the stands · they chant for him · **the darling of Capua***.

**It is built by afternoons, not victories.** The crowd score is the biggest lever: a bout at 74 crowd is worth +2.8, one at 38 is worth −0.8. Winning adds 3.2, a bout with real exchanges 1.6, and **being spared adds 3.4** — a man they asked for is a man they have invested in. Showmanship, a nickname, and the imperial sand all count. And it fades **1.3 a week** once he stops appearing: from 70, twelve quiet weeks leave him at 56.

| Favour | Purse | Missio | Crowd |
|---|---|---|---|
| 25 · known by sight | ×1.05 | +4 | +2 |
| 50 · a name | ×1.11 | +8 | +5 |
| 90 · the darling | ×1.20 | +14 | +8 |

At a thin standing of 6, a fallen man is spared **76% unknown, 87% known by sight, 92% a name, 99% a favourite** — they lean, they do not overrule, and at a comfortable standing it changes nothing because the roll clears anyway.

**And losing one is not a private matter.** Killed: −12 fame, +6 unrest, 32 off the stands. Sold: −15 fame, +8 unrest, the same 32 — *"Selling him is not a private arrangement. The stands find out inside a day."* **Freed: +14 fame and 11 back to the stands** — the only exit that pays, which is the whole argument of this game in one number. A man nobody knows costs nothing to lose either way.


### v0.72.0 — The weather on the day
The seasons decide the year. This decides the afternoon. Six of them, drawn per card and shown on it before you commit — and footing is the same dial the venues already use, so a wet field and a dry courtyard are one mechanism arriving from two directions.

| | Footing | Stamina | Crowd | Purse |
|---|---|---|---|---|
| **Fair** | — | — | — | — |
| **A good day for it** | 1.03 | ×0.96 | **+8** | ×1.06 |
| **Blazing** | 1.01 | **×1.24** | −5 | — |
| **Rain** | **0.84** | ×1.08 | **−16** | **×0.86** |
| **A hard wind** | 0.96 | ×1.02 | −3 | ×0.97 |
| **Bitter** | 0.93 | ×1.12 | −9 | ×0.92 |

Each season sends its own: summer is **50% blazing**, winter **50% bitter and 33% rain**, spring and autumn mixed. Across six years it comes out fair 27%, rain 21%, a good day 17%, blazing 17%, bitter 10%, wind 8%.

**A roof is worth a great deal.** Shelter runs 0% in a field or your own pit, 32% under the amphitheatre's awning, 50% in the Greek theatre, **72% in a magistrate's courtyard** — where rain leaves the footing at 1.07, better than a dry field, and costs four crowd instead of sixteen.

Rain swings a quick man from 52% to 46% and a strong one from 61% to 65%. Heat does nothing at blood stakes, where bouts end in a round, and a great deal at standard: a man of 40 endurance goes from **58% to 83% gassed**, a man of 75 from 27% to 46%. And a hard wind is worse for a net than for a shield.


### v0.71.0 — What the racks will hold
Fifty-four kinds of thing and nowhere to put them. A ludus armoury was a room, and a room has walls.

**House issue does not count** — it is issue, and twenty gladii off the rack read as zero. Bought steel takes space: **8 pieces at no armamentarium, then 15, 22 and 29.**

Go past it and the room stops being an armoury. Everything wears **up to 75% faster** and it costs **4 denarii a week per piece over**. Measured over eight bouts, a blade in a room with space ends at **64 of 100**; the same blade in a room stuffed to 1.75× strain ends at **37**. The agenda raises it, and every sixth week the chronicle notes *"stacked against the wall and going off in the damp."*

So a piece can now **go back out the door**. Resale runs **42% of list, 55% with an armourer**, 47% under a shield doctrine, scaled by condition — and it sells your worst example first, so a 260d blade at 40 condition fetches 73d while a mint one with an armourer fetches 144d. It will not sell what a man is wearing.


### v0.70.0 — Where a piece came from
Fifty-four kinds of steel told apart by four numbers. A piece with a history is the same four numbers and a different object entirely.

**Six ways one gets a story**, and the story attaches to the slot rather than the item, so it survives the man who earned it:

| | Crowd | Him | |
|---|---|---|---|
| **forged** | +5 | +8 | Made for him by your own smith |
| **spoils** | +7 | +6 | Taken off a named man on the sand, after |
| **gift** | +6 | +5 | Sent up from a patron with no note |
| **imperial** | +11 | +10 | Carried onto the sand at Rome and off it again |
| **primacy** | +8 | +7 | He held the primacy of Capua in this |
| **dead** | +4 | **−7** | Somebody died in it, and the cells know which piece |

Only bought steel carries a history — house stock is refused — and a piece takes **one** story and no more. A man carrying a taken weapon, a Roman helm and a dead man's armour walks out at **+22 crowd** and with the whole block watching what he is wearing.

**Kill a man at sine missione and 36% of the time your gladiator comes off the sand with his weapon.** *"Nobody stops him and nobody asks for it back."*

And what a man dies in does not vanish: every wearing piece goes back on the rack as **dead steel**, listed in the armoury and raised in the agenda, until somebody is handed it — *"He takes it, because the alternative is going out without one."*


### v0.69.0 — Loadouts
Fifty-four pieces, four slots, eight men. Arming a house by hand had stopped being a decision and become bookkeeping.

**Arm him from the rack** picks the best the house actually owns for that man, scoring each piece the way the fight engine will read it — attack and guard weighted as `power()` weights them, showmanship and speed counted, condition scaled in, and a hard penalty on anything outside his style. Verified across 600 men armed from a full armoury: **not one ended up carrying something unfamiliar**, and arming three men from a rack holding exactly one of everything **double-issued nothing**.

It is worth having. From a full rack, a man goes from **42% to 67%** on the sand and from 9%/4% attack and guard to **18%/25%**.

**Go down the line** does the whole familia from the armoury, and tells you first how many are carrying less than the racks can give them.

**Kits you keep** saves a loadout by class and weapon — *"Retiarius · Neptune's Fuscina"* — to put on the next man in a tap. Applying one the house can no longer supply falls back to bare in those slots and says which pieces were missing.

And a man's page now flags what is wrong with what he carries: **unfamiliar**, **failing**, and **there is better on the rack**, each reported independently, with the first two also raised in the agenda.


### v0.68.0 — Offline play
The downloaded file has always worked without a network. The hosted copy needed one to load, which meant no home screen and nothing on a plane. It is a proper installable app now.

`build.js` emits three companions beside `index.html`: a **web manifest**, a **service worker**, and **three icons** — a bronze gladius point-down between laurel, at 192, 512, and a maskable 512 with Android's safe zone. Install it and it opens standalone, portrait, with no browser chrome at all, which also disposes of the URL-bar problem from v0.65 entirely.

The worker precaches the whole shell on install, names its cache after the build version so a new one purges the old, and serves **cache-first with a background refresh** — the game is a single file and never needs the network twice. Cross-origin and non-GET requests are left alone.

**The single-file build is unchanged.** Registration is guarded behind `/^https?:$/`, so opening `index.html` from disk skips all of it and behaves exactly as before.

Verified by running the worker in a sandboxed context with a mock Cache API: 29 checks covering manifest validity and installability, icon files existing, relative paths, install precaching all six entries, activate purging a previous version, and — with the network forcibly down — the page still being served.


### v0.65.2 — And the nav back
v0.65.1 pinned the shell with all four insets *and* gave it a height. In CSS, when `top` and `height` are both set, `bottom` is ignored — so the box was as tall as the unit said rather than as tall as the viewport, and on a device where that unit resolved larger than the visible area the navigation row sat below the fold of an `overflow: hidden` box, unreachable.

The height declarations are gone. `top: 0` and `bottom: 0` with no height makes the box exactly the viewport the browser reports, whatever that is this frame, and the flex column pins the header and the nav to its two ends. No units to guess wrong.

### v0.65.1 — The header, under Chrome's URL bar
The shell was sized in `dvh`, which on Chrome for Android is the viewport with the toolbar *hidden*. While the URL bar is showing, that is taller than what you can actually see, so the body gained a hundred pixels of scroll and the top row — the house name and END WEEK — slid up underneath the browser.

Three changes: the shell is now `position: fixed` and pinned to all four edges rather than merely being tall; it is sized in **`svh`**, which is the viewport *with* browser chrome shown and therefore always fits; and the body is stopped from scrolling at all while the shell is up. It also pads for a notch at the top, matching the home-indicator padding already on the nav.

### v0.65.0 — The doctrine of the house
You could always end up with a reputation. Now you can commit to one, out loud, and pay for it in both directions.

A heavy-shield house teaches the murmillo and the secutor and grudgingly tolerates everything else, buys its armour cheap, and is adopted by half the amphitheatre and written off by the other half. A red school takes triple the sine missione offers and a fifth more coin for them, and spends the difference out of the cells and the lanista's own body. The open hand gets no such offers at all and keeps its men alive. The travelling school builds a name down the bay in two-thirds the time.

And a lanista who changes his mind pays nearly double, loses twenty fame, and spends a week with every man in the yard wondering what the last year was for.

### v0.64.1 — Removing the event it replaced
The new feud shared its key with a two-choice `Bad Blood` event written in v0.11, which JavaScript silently resolved by keeping whichever came last. The old one had been unreachable since the moment the new one shipped; it is deleted rather than left to rot, and the events table is back to thirty unique keys.

### v0.64.0 — Two of your men, in front of you
A feud in the cells has always been a number that made the whispers more interesting. Now it comes to a head: two of them in the square, everybody watching, and the doctore deliberately not intervening.

You can put them on the sand with wooden swords, which settles it and hurts somebody one time in seven. You can bench one for a month, which settles nothing and stops it happening today. You can say out loud which of them is right, which costs you the other man entirely and teaches every bystander that this is a house where the lanista picks. Or you can go back inside, which is free, and which they all watched you do.

### v0.63.1 — Fix: fighting crashed
v0.62.0 put the legacy loader inside `FightModal` instead of `App`. Both components hold a `SFX.mute` effect on an identical line and I anchored on the wrong one, so every fight mounted a component referencing `S` — state that does not exist there — and threw `ReferenceError: S is not defined` the moment the arena opened. The same rename also pointed the old single-slot save migration at the trade-memory key. Both corrected.

The render harness only ever mounted the title screen, which is why it passed. There is now a **mount test that renders every top-level component in isolation** — the fight modal in all four of its shapes, the crowd, the fighter, the bars — with no App state in scope. It reproduces the crash on the broken build and passes on this one.

### v0.63.0 — The arena view
The fight has been happening in the same rectangle in front of the same anonymous crowd since v0.4. The crowd is four blocks now, one per faction, each in its own colour and lit by how warmly that faction actually regards you — so you can see at a glance that half the amphitheatre wants you to lose. And the ground is drawn: black earth in your own pit, marble in a magistrate's courtyard, turf in a field outside the walls, gold at Rome. Fourteen people watch a courtyard bout. Thirty watch one in the amphitheatre.

### v0.62.0 — What carries between houses
Losing a house has always cost you everything in it. Now it does not quite: the bouts you fought, the men you freed, the men you buried, the years you stood and the primacies you held are written into a book that belongs to you rather than to the house, and read by the next one you found.

Free enough men and the block hears about it before you arrive. Bury enough and it fears you, which is cheaper. Stand long enough and the next lanista in your line starts younger. It is on the title screen with the name of the best gladiator any of your houses ever owned.

### v0.61.0 — Mastery, and a second style
A man with twelve victories and a name can be made a master of his style, which is worth ten bouts in a hundred and only in the style he mastered. Past that, if you keep a doctore and can spare the fee, he can be sent to the far post for two months and taught a second trade from nothing — and comes back able to fight either, which no more than five men in Campania can do.

A veteran stops being a stat block with good numbers and becomes a particular kind of fighter you deploy according to the ground.

### v0.60.0 — The sacramentum
The oath every gladiator took has been a word in this game's vocabulary since the first version. Now every man who comes through the gate owes it, and you decide how it is given: read out at the post while the yard carries on, spoken through properly with the familia stood down, or followed by wine and a table until dark.

A free man says the words himself and it is worth half again as much, because agreeing to be burned, bound, beaten and killed by the sword is a different thing from having it said over you. A condemned man gets the least of it, for the same reason.

### v0.59.0 — Damnatio ad ludum
A clerk from the magistrate's office arrives with two men, their paperwork, and a hundred and fifty denarii for taking them off the city's hands. They are condemned — arson, a knife in a wine shop, striking a master and not saying why — and the court sent them to the school rather than the beasts, which is a mercy in the way that a longer road is a mercy.

They arrive knowing nothing, owning nothing, and despised by every man in the cells who chose this life or was at least bought for it. They cannot be sold. Their deaths cost you about half what a bought man's does, because Capua does not mind — and your own men are watching you notice that.

Fight the sentence out, though, and the paper is discharged.

### v0.58.0 — The gatekeeper, brought up to date
The old man on the gate knew nine things, all of them from when the game was a third of its current size. He knows twenty-eight now, and more importantly he waits: a lesson only appears once the thing it describes is actually in front of you. A new house gets six, one per tab. Regard arrives when a man first has something to remember about you, refusal when somebody is close to sitting down, the moneylenders when you are short, munera when there is a man unburied, and the heir when you are old enough to think about it.

Writing the pacing test found something else: a Dimachaerus had been founding his house carrying a 420-denarius weapon that wears out, while every other class started on thirty-denarius house stock. The v0.32 stock pass had missed it because the item was already priced. There are Paired Blades on the rack now, and all six classes found on comparable kit.

### v0.57.0 — The overhaul
Every feature this session arrived as another box in a column, and the home tab ended up with thirteen of them. It now opens with **This week**: one list of what actually wants an answer, in priority order, each row tapping straight through to where the answer is. The permanent situations — a war, the primacy, a nemesis, an aedile who owes you — became a row of chips instead of four full panels. Hiring moved to the Market and the standings moved behind a tile.

Writing the agenda's test found a crash that had been shipping since v0.43.0: the deadline panel called `WANTS[kind].label`, and `WANTS` has never had a `label` field, so any patron want within two weeks of its due date threw the entire Ludus tab. The labels exist now.

### v0.56.0 — Seeded runs
Houses can be handed to other people now. Type `CAPVA-7719` when you found one and you get exactly the Capua somebody else got: the same men in the cells, the same rivals, the same block, the same lanista. What you do with it is still yours, and the two runs part company the first time you choose differently.

One mulberry32 behind the `R()` that everything already called, its position saved with the house so a reload picks up mid-sequence rather than starting again.

It paid for itself before it shipped by making an old bug reproducible: a house could be founded with two men answering to the same name. Now it cannot.

### v0.55.0 — Form
The four weeks between a man's last bout and his next one now count for something. Three straight wins and he walks out expecting to win; carried off twice and he has not been right since. Five words on his card, the reasons listed on his page, and an opponent's bad month is something you can pay to find out about before you send anybody at him.

It is small on purpose — an eight-point swing at the extremes against sixteen for a full set of gear — and it fades fast enough to be memory rather than another slow stat. The temptation to ride a streak is the point; so is the cost of resting a shaken man.

### v0.54.0 — Venues
Nine places instead of one rectangle: the pit behind your own ludus where nobody is watching who was not already there, boards thrown up across the market for the week, the stone amphitheatre with an awning that does not quite reach, a magistrate's courtyard with forty people who have eaten well and a silence you can hear yourself breathing in, and turf cut outside the walls with the dead man's family standing where the editor would be.

Footing is what makes it a decision rather than a caption. On marble a quick man wins 52% and a strong one 48%; on wet turf that becomes 36% and 59%. The ground decides who you send.

### v0.53.0 — The aedileship
Once a year the names go up on the walls. Three men stand for the office that decides whose gladiators are on the card, what they are paid, and whether anybody leans forward when one of them is down.

You can put money behind one of them quietly, or openly with your name on the subscription list, or you can stay out of it entirely and have no particular standing with whoever wins. The other houses are doing the same thing, and it is usually obvious which of them is behind which man.

Win and you have the games in your pocket for a year. Lose and the new aedile knows exactly whose name was on the other list, because everyone does.

### v0.52.0 — The medicus and the armourer
Two building levels became two men. You hire them the way you hire a doctore, they have names and origins and a skill worth paying for, and the room they work in is now a floor rather than the whole answer — a good medicus in a bad infirmary can only do so much, and the two together are worth nearly four times what neither is.

They also have opinions. A medicus in a house that fills his table every week gives notice without making a speech about it. An armourer paid late twice does not wait for a third, and his tools go with him because they were always his. A rival with a grudge can buy either of them out from under you.

### v0.51.0 — The record book
The house has been accumulating history since the first version and there was no way to ask it how it had actually done. Now there is: every bout in every engine is counted, and the book will tell you which style has served you best, which stakes you should stop accepting, which of the three great houses is quietly taking you apart, the biggest purse you ever took and the longest bout anyone ever fought.

It is counters rather than a log, so a full campaign costs under a kilobyte.

### v0.50.0 — A man who will not go out
One of them sits down on the boards with his back to the wall and will not put his hands up, and the reason is something you did that he wrote down at the time.

You can have him whipped, which works and costs you every other man in the room. You can sit down on the boards with him and talk, which is free, unreliable, and depends entirely on what you have been to him. You can give him the thing he stopped asking for. Or you can leave him there, and find out how quickly the rest of the block does the arithmetic.

Nothing else in the game required so little new machinery: regard supplies the trigger, his memory supplies the reason, and his ambition supplies one of the four answers.

### v0.49.0 — Munera
The game has always paid you to stage funeral games for other people's dead — a magistrate's father, an old soldier of Sulla, a merchant with no sons. It never occurred to it that you might stage them for one of your own.

Six weeks after a man dies you can burn a fire at the gate with his name said aloud, or put on a full card at your own expense with his name where the dead man's usually goes, or do nothing at all and let the week go on. The third costs no money and the men notice it more than either of the others.

It is priced by what he was and it never returns what it costs, which is the whole of the feature.

### v0.48.0 — What he makes of you
The game's whole argument is that these are men and not units, and until now not one of them had any view of you at all. Each of them now keeps a short list of things you actually did — the bout you stopped to keep him alive, the promise you kept, the brother you freed, the brother you sold, the wound you sent him out on, the night you left him on the sand until he had to finish somebody from his own cells.

It moves how hard he fights for you, whether his defiance climbs or settles, and whether another house's money can reach him at all. A man who would follow you anywhere wins eight bouts in a hundred more than one who hates you, and cannot be poached at any price.

### v0.47.0 — Reading a man before you fight him
The football-manager half of this game had no preparation in it. Now you can pay to have an opponent watched during the week before the bout, and what comes back is specific to him: that he is blowing by the sixth, that he drops his arm every time he lands one, that he has almost no bouts behind him.

Then you pick a plan built against what you were told. Read him right and it is worth seven or eight bouts in a hundred; read him wrong and it costs five. A doctore on the payroll sees one tell more than a hired watcher does, which is a second reason to keep one.

### v0.46.0 — The heir
Name nobody and the house is sold off in pieces the morning after you die. Name somebody and it goes on: the same men in the same cells, the same buildings, the same moneylender waiting, and a new man in the chair who has none of your reputation and none of your faults.

A son has grown up in the yard and the men have watched him do it since he was nine, which cuts both ways. A nephew arrives from Neapolis with his own money and a very clear idea of how this will be run. And your own freed doctore — the one who fought on that sand — can take it, which the cells will love and Capua will not forgive quickly.

The house takes a numeral. The men who held it before are written down with the age they died at and what Capua had decided they were.

### v0.45.1 — Fix: the rival feed was not in the build
The panel that shows what the other houses have been doing, and the tag marking a man they sold on, were both in an edit batch that failed on a bad anchor and therefore never reached the file. The engine had been taking its turns since v0.45.0 with nowhere to display them. Both are in now.

### v0.45.0 — The other houses
The rivals have been playing the whole time where you could not see them. Now, roughly every other week, one of them does something in public: buys the man you were looking at, puts one of his own on the block, takes a fighter off the card for a month and puts him back on it as something else, gives a ten-victory man the rudis in front of the entire city, hires a doctore out of Ravenna at a price people talk about, or loads the wagons for the coast and takes his whole stable off your card for a month.

They also lose men, win cards at Nola, and stand in the baths putting their best man above yours in a way calculated to carry.

Each of the three plays to the character he already had; the weights come straight off the table that described them.

### v0.44.0 — The seasons
The year had festivals and no weather. It has both now. Spring is when a man learns fastest; summer is the season of games and the sand is hot enough to burn anyone who goes down on it; autumn brings the harvest money and the great games and the best purses of the year; and in winter almost nobody is putting on games, the pits pay less than half, the cells cost four denarii a man more to keep, and wounds close faster than they ever will again because there is nothing else for anybody to do.

It is derived entirely from the week, so it costs nothing to save and every existing house has a season the moment it loads.

### v0.43.0 — Deadlines
The calendar was scenery. An editor now puts one of your men on a bill by name, five weeks out, and pays a third up front — so when he tears something in week three you find out what a promise is worth. A rival names your best fighter in public and the whole of Capua waits to see whether you answer. The magistrate wants money by a date. The patrons' wants have a week on them. And the invitation to Rome stops waiting politely forever.

All five sit in one list, sorted by how soon, and it goes red when something is due inside the week.

### v0.42.0 — The cells at night
The game hides a great deal behind vague words, and there was no way to look behind them. Now you can pay the old man on the gate a retainer to keep his ears open, or put one of your own men inside the thing you want to hear.

The gatekeeper tells you who is doing the talking and who has stopped eating. A man inside tells you what somebody privately wants and has told everyone except you, which of them the others are listening to before the rebellion gives you the name, and who has been at the wall after dark. He hears more than twice as much — and he gets found out, sooner or later, and when he does the whole yard turns on him and stays turned.

Every fragment is generated from something the game actually knows to be true.

### v0.41.0 — Debt and the moneylenders
Three men in Capua will lend you coin: one cheap who collects in gladiators, one expensive who never touches your men, and one who lends to anybody at a rate that explains why. Interest compounds every week and the debt grows whether you look at it or not.

Each is quiet for exactly as long as he said he would be. Then his man is at the gate — he does not come in, he wants you to know he was here. Then Capua knows you are carrying his paper and the editors are polite in a slightly different way. Then, if he is that sort, he takes a man against the debt at seven-tenths of his value and nobody asks you first.

It is the way out of a bad month, and it is very hard to stop taking once you have started.

### v0.40.1 — Fix: the pair-bout purse
v0.40.0 shipped with a crash. The faction purse multiplier was applied to `doPairFight` instead of `doFight` — the two purse lines are near-identical and I matched the wrong one — so every pair bout threw on an undefined `away`. Corrected, and the multiplier now sits where it was meant to.

### v0.40.0 — The stands
Capua stopped being a meter. There are four groups in the seats now, each wanting a different afternoon: the parmularii and the scutarii — a real rivalry, over shield size, which Roman emperors took sides in — plus the mob in the upper tiers who want blood, and the front rows who want craft and can afford to.

The shield factions cannot both be pleased; courting one cools the other. A house of murmillones that kills ends up adored by half the amphitheatre and hated by the other half, which is worth a fifth more fame every time a heavy man walks out and a tenth less every time a light one does. Whoever likes you most sets what the editors offer.

They forget, slowly, if you stop giving them reasons.

### v0.39.0 — Judging a man before you buy him
Buying used to be arithmetic: the block printed exact numbers and you compared them to a price. It now shows the seller's version — a range, centred somewhere flattering, and no mention of the thing wrong with the man.

A third of the block has something wrong with it and is priced accordingly. An old wound that will cap a stat forever, a spirit already broken, a man sold twice in a year and nobody saying why, or one who has been at this three years and has not improved once. Your doctore narrows the range and hints; paying to have a man looked over gives you the number and names the problem.

The seller overstates a sound man by two and a half points a stat and a flawed one by four and a half, which is the whole feature in one number.

### v0.38.0 — Every opponent a person
The three rival houses had names, records and grudges. Everybody else was a stat block that evaporated after one bout, which is a strange thing in a game whose whole argument is that men are not units.

There is a standing circuit of sixteen independents now, from small houses or none. They train, they age, they drop off the cards, and they keep a record of every time they have met each of your men — so the offer card can tell you he has beaten this one twice before, and 44% of pit bouts are now against a familiar face. Any of them can become a nemesis.

Also moved the gear-ownership helpers out of the interface and into the engine, where the wear system had been reaching across a layer to call them.

### v0.37.0 — Training
The decision you make most often was the one with least in it. Eight named drills now, each with a real cost: the weights build strength half again as fast and take agility off him, the hill works fatigue out rather than in, playing to the yard sells tickets and teaches him to think about being watched.

Sparring stopped being a flat multiplier and became the thing it should always have been — he learns whatever his partner is better at, not whatever you selected, and stops learning it when the gap closes.

And **strain**: the deep tiredness that a week's rest does not fix. It accumulates on the hard drills, eats what he gains and is how men tear things. Thirty weeks of grinding the weights injures 64% of them; the same thirty weeks cycled with rest reaches the same strength with nobody hurt. The drill is not a trap — it is a thing that wants managing.

### v0.36.0 — The crux in the melee
The last engine holds. Its intervention is not the duel's — there is no single bout to lean into — so it fires when the field has thinned to the point where you can see what is coming, and offers a way out rather than a tactic.

Pull one man off the sand and he loses his share and takes no wound; more to the point, if he was the second of yours still up, there is no longer anyone for the editor to make him kill. Entering two, that takes the forced duel from happening to not happening, and halves the deaths, and costs two points of win rate. Pull them all out and you forfeit the purse and a piece of your name, and everybody walks.

All four combat engines now pause exactly once at the moment it matters.

### v0.35.0 — The aftermath
The fire you fed for years comes back. Opening the gates now starts a four-stage war that runs for about two years: a band in the hills, then an army, then eight legions and Crassus, then six thousand crosses along the road north.

It costs you the whole time. Standing leaks every week and craters when the legions march, because nobody in Capua has forgotten which gate he walked out of. Your own men hold a defiance floor once the thing is an army, having watched it be done. The slave block first inflates and then collapses, and the men on it late in the war were taken in the south.

Four events come to the gate, and the last two are the point. A messenger before dawn with a place in the column for anyone who wants one and coin for you if you look away. And then the road, where you can walk the first mile, shut the gate — or march the familia out to look at it, which quiets them for a very long time and is the thing you will have to live with.

### v0.34.0 — The collegium
A burial society, on the Villa tab beside the feasts. The house pays in three denarii a week per man and when one of them dies there is a stone with his name, his style and his victories on it instead of a pit outside the wall.

It never wins a bout. What it does is halve what a death costs the cells — and what it costs you personally — because men who know what happens to them afterward take a burial differently. It is the cheapest humane thing available and by some distance the easiest line to cut in a bad month, which is the entire point: stopping the dues after men have already gone into the ground under it costs double what stopping before does.

### v0.33.0 — The lanista
You are a person now. Three Roman names, an age, and health that the job erodes — slowly with the years, faster with a house on the edge of fire, and by a fixed amount for every single man you put in the ground. Feasts, a bath house and a quiet week mend a little of it.

Six traits, none of them chosen: run a bloody house long enough and you become **Hard**, and the men do as they are told quickly while looking at the floor. Run a merciful one and you become **Merciful**, and word gets round which houses bury their men and which free them. Win five wagers and the bookmakers stop giving you the tourist's price. Get caught arranging a bout and every editor in Campania hears.

And at the end of it there is now an ending that belongs to you rather than the house.

### v0.32.1 — What the marks mean
A man's card carries up to seven tags and the game never explained one of them. **What the marks mean** now sits at the top of the Familia tab and opens a glossary in five parts:

- **The styles** — all six, with their key stats, what each beats and what beats it, read straight out of `CLASSES` and `COUNTERS`
- **Where they came from** — all seven origins, with which stats each favours and which it is short on, derived from `ORIGINS`
- **Marks on a man** — the twelve status tags: Gladiatrix, Auctoratus, Primus, Firebrand, rare fire, Given up, Your word, With the doctore, Being remade, Kit failing, a named piece, and the four age words
- **Bearing** — the five-step defiance scale and what each step means in the yard
- **The weapon on his card** — and the cost of wearing something outside his own style

The first two sections are generated from the data tables rather than written out, so adding a class or an origin later cannot leave the glossary lying.

### v0.32.0 — The racks start empty
Everyone used to walk out of the gate in a full set of house kit, which made the armoury irrelevant for the first thirty weeks and armour something you never thought about.

**House stock is now owned, not assumed.** A gladius, a scutum, a galea and a manica have prices (22–45d) and sit in `d.gear` like anything else. You found the house with **one weapon per man and nothing else** — three men, three blades, bare heads and bare chests. The exception is *One Good Man*, who has nobody behind him and gets the whole set.

A free hand, a bare head and a bare chest still cost nothing and always will, so a man is never unable to fight — he is just **42% to win at standard stakes against 58% fully kitted**, and hurt 58% of the time against 41%. Kitting a murmillo out costs 111d; doing it for three is 333d of an 800d purse, against a doctore, a fourth man, or the first building.

Stock still does not wear — that distinction moved from `price > 0` to an explicit flag — and when a fine piece finally snaps, the man drops to a house spare if you own one and to bare skin if you do not.

### v0.31.2 — Racks in the armoury
Twenty-nine pieces in one column was a long scroll to reach a helmet. The armoury now opens on four racks — **Weapon (12), Offhand (6), Helm (6), Armor (5)** — one at a time, with each tab face carrying how many of that kind you own and how many are sitting idle on the rack rather than on a man.

### v0.31.1 — The Ludus tab, tidied
Thirteen stacked panels had accumulated on the home screen, and seventeen feats at the bottom of it was the point where scrolling past everything to reach the chronicle stopped being reasonable.

**The House**, **Feats**, **What Capua Says** and **The Annals** now sit behind a four-tile row, each opening as its own sheet with a summary on the tile face — how many buildings are up, how many feats are taken, what Capua calls you, how many have served. The tab keeps only what you act on or glance at every week: the year, the doctore, the standings, unrest, the chronicle, and whichever of Rome, the primacy, a nemesis or the road is currently true.

### v0.31.0 — The circuit, and feats
Pompeii, Neapolis and Puteoli: a week or two down the road, better purses, local houses, and crowds with their own taste. Nothing you built in Capua travels — the editor there weighs what he has seen himself, and a man of yours who falls in front of a town that has never heard of him is spared 56% of the time against 100% at home. Win there often enough and they learn the name; local standing persists, and opens better cards next visit. Your grudges do not travel either, so a tour is also a way to get out from under one.

Added **seventeen feats**, checked weekly, from First Blood to Ten Years a Lanista. Each pays on the day and eleven leave a permanent perk on the house — faster training, calmer cells, cheaper and longer-lasting steel, warmer patrons, or a familia that takes a death better. Most of the perks hang off the merciful feats, which is the point.

### v0.30.0 — The Primus of Capua
There is one title in the city and it starts in somebody else's house. Get a man to five wins and thirty-five renown and the editors will hear of it; beat the holder and it is yours, along with three fame a week, a warmer word from every patron, and a queue of tier-3 challengers on nearly every card.

The interesting part is internal. Six weeks in, the second-best man in your own cells asks for the one bout in Capua that means anything, against a man who sleeps four doors down. He takes it off the holder two times in five, the bond between them is gone either way, and refusing him breaks whatever he was privately hoping for.

Calibrating the gate meant sampling 2,906 man-weeks of real play; the first three attempts were set where **no gladiator in the game could ever reach them.**

### v0.29.0 — Calling in a favour
Standing was a number that sat there. Now each of the four patrons will do exactly one thing for you and nobody else will do it: the magistrate makes another house drop a grudge, the merchant carries your upkeep for ten weeks, the noblewoman ruins a rival's name at the baths, and the senator says yours in a room in Rome.

It is spent from your standing with that man, which is the same standing that leans on the editor when your man is in the sand — so every favour is paid for out of the pocket that buys mercy. A house that asks for everything the moment it can ends up with a third of the standing of one that never asks.

### v0.28.2 — Scrolling, restored
The shell fix in v0.28.1 locked the whole app to the viewport height and stopped the page scrolling — which is correct for the main screen, where a flex column supplies its own scroller, and completely wrong for the title screen, which has none and simply became unreachable below the fold.

The viewport lock now applies only to `.shell` (the in-game screen). `.lr` grows with its content again, the page scrolls normally on the title and ending screens, and those two use `align-items: safe center` so a card list taller than the screen is never centre-clipped out of reach.

### v0.28.1 — The navigation bar stays put
The bottom bar was `position: sticky`, and the `overflow-x: hidden` added in v0.18 to stop the horizontal clipping had quietly turned its ancestors into scroll containers — which makes a sticky child stick to the bottom of *that container* rather than the viewport, so on any tab longer than a screen the tabs scrolled off and never came back.

Rebuilt as a proper app shell instead of patching the sticky: the root is a fixed-height flex column, the header and nav are non-shrinking rows, and **one** middle region scrolls. No sticky positioning survives anywhere, so no ancestor's overflow can break it again. The nav also clears the iOS home indicator via `env(safe-area-inset-bottom)`, and the page itself no longer scrolls at all.

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
- ✅ Patron favours you can call in, paid for out of your standing
- ✅ The Primus of Capua — a title held, defended, and wanted from inside
- ✅ The circuit — three towns, local standing, and no benefit of the doubt
- ✅ Seventeen feats with permanent house perks
- ✅ The lanista — an age, a body the job wears down, and six earned traits
- ✅ The collegium — a stone with his name on it, and the cost of stopping
- ✅ The aftermath — the war you started, coming back for two years
- ✅ The crux in the melee — all four engines now hold
- ✅ Eight training drills, partner-led sparring, and strain
- ✅ A standing circuit of independents who persist, age and remember
- ✅ The seller's account, concealed flaws, and paying to look properly
- ✅ Four crowd factions, two of them historically at war
- ✅ Three moneylenders, compounding interest, and what he does when you stop paying
- ✅ The cells at night — twelve true fragments, and the price of hearing them
- ✅ Five kinds of deadline, and one list of what is owed by when
- ✅ Four seasons, and a year with a shape to play against
- ✅ Rival houses that take visible turns you can watch
- ✅ The heir — an ending that becomes a continuation
- ✅ Watching an opponent, and a plan built against what you saw
- ✅ What he makes of you — seventeen things a man remembers
- ✅ Munera for your own dead, and the cost of doing nothing
- ✅ A man who will not go out, and the four things you can do about it
- ✅ The record book — everything the house ever did, in under a kilobyte
- ✅ The medicus and the armourer as men who can quit
- ✅ The aedileship — buying the man who runs the games
- ✅ Nine venues, and footing that decides who you send
- ✅ Form — the four weeks between one bout and the next
- ✅ Seeded runs — a house you can hand to somebody else
- ✅ The overhaul — an agenda instead of a wall of panels
- ✅ Twenty-eight lessons that wait for their moment
- ✅ Damnatio ad ludum — the sentence that is not an execution
- ✅ The sacramentum — the oath, and who is able to swear it
- ✅ Mastery, and a second trade taught at the far post
- ✅ What carries between houses — a book that survives losing
- ✅ The arena view — a crowd with sides and a floor you can see
- ✅ Two of your men in the yard, and four ways to answer it
- ✅ Six house doctrines you declare and then live inside
- ✅ Self-contained layout CSS — no Tailwind dependency in the standalone build

- ✅ Four fight engines that all hold the same shape
- ✅ A regression harness in the repo, in two tiers, with a coverage sweep
- ✅ Saves with a version that means something and one ordered migration
- ✅ Every player action a function of the save, not a React closure
- ✅ The tactic triangle — four words and none of them the answer
- ✅ A tour down the coast with a card of its own in every town
- ✅ Stone paid for as it rises; a rank held as a census rather than handed over
- ✅ The record book's worst night, and the four nights a man is known for
- ✅ A size guard, so no function grows past the line unremarked
- ✅ Every one of the thirty-five lessons proved answerable — window, trap, and queue

**The queue is clear.**

The v2.42.0 audit raised ten items (#78–#87) and all ten have shipped, in
v2.43.0 through v2.51.0. Two of them half-disproved themselves on the way and
the releases say so: the feast was not what kept merciful houses quiet (mercy
was, which is the design), and the fame ladder above 11,000 was not read by
literally nothing (a slow purse slope and the levy read it). The one item still
outstanding is a decision rather than work:

- **#47 — one tap to the obvious bout.** Declined; the multi-tap arena is intended.

**What the ten came to.** Six were numbers chosen against an economy that had
moved underneath them — the stipend against the census, the fame ladder's last
rung, rival fame against the league, the creditors' −250, the feast's flat
effect, the street's unbounded memory. Two were systems with real machinery the
player could reach but nothing answered — the emigrant house Capua never
objected to, the asking that outdrew every other voice two to one. Two were the
harness itself, and those two are why the other eight took as long as they did
to surface: `setOut` and `comeHome` were never on the handle, so no probe could
take a tour and come home, and the standing economy had no check watching it at
all.

**The v2.52.0 audit — ten items, #88–#97, open in the task list.** Run against
the consolidated build over 3,200 censused house-weeks on a full policy (the
primacy taken, the bay toured, hunts and melees fielded, Rome answered, the rope
worked on empty weeks). The seams it found, in one line each:

- **The summit is behind one afternoon.** Rome asks that you have held the
  primacy; the 3 houses of 8 that held it were the 3 offered Rome, and a house at
  fame 4,301 with ten feats never saw a letter. Settled in v2.59.0: v2.53.0's census
  road was set at the fifth rung, which admitted nobody the sand had not, and my own
  recommendation for a third proof — a top-rung win at home — was measured and
  refuted (40 offered, 7 taken, 0 won). The fourth rung admits two houses in
  twenty-four, and the screen names the road now. *(#88)*
- **And the trip has no clock.** Accept, decline the imperial card, and the house
  sits at Rome forever with Capua frozen. Nothing has ever driven the round trip
  — `romeReady` and `offerRome` are not on the handle. *(#89)*
- **Two whole systems nobody meets.** The heir: null in 8 of 8 houses, zero
  successions, because `nameHeir` is not exposed. The temple: piety 30–35 in
  every house across 400 weeks, no vow, no blessing, and both its actions
  unexposed. *(#90, #91)* Both settled. #91 was unprompted, not unreachable: a
  house had a rested altar and the coin for it in **86% of weeks**, and a policy
  that keeps the rites rides a blessing a third of the time. The agenda had never
  named the gods and the Temple panel opened only for a house already using it.
  A price uncapped in fame was fixed on the way past, but it was not what was
  binding — and a probe guard reserving four weeks' cushion was.
- **The best-written event in the mid-game is starved, not broken.** The man four
  doors down never asked once in 3,200 weeks including 188 weeks of holding the
  title — and `make()` returns an event 400 times in 400 when handed the state.
  A conditional event competing with a dozen always-eligible ones in `pickEvent`
  loses for years. *(#92)*
- **A knock-on we shipped without pricing it.** Bounding acclaim moved every late
  house down a band of slave market (fine men 40% → 30%) and cost 1.2 points of
  mortality. Possibly correct; never a decision. *(#93)*
- **The long slide is silent.** 43 → 167 weeks to die of debt, on the same single
  warning. *(#94)*
- **Five feats of nineteen and three lanista traits of six are never earned**,
  four of the five carrying a permanent perk. Settled in v2.58.0, and mostly the
  other way: all nineteen are earned by a policy that goes after them, and two of
  the five were the probe — Rome's card is flagged `imperial` and was being
  declined on a win-chance gate, and the society was never founded. What was real
  was a cloth outside a singles bout recording nothing, and a sheet that showed a
  dash to a house standing on the gate. *(#95)*
- **And two harness gaps that explain why the rest went unseen:** the four market
  generators are unexposed, so no check can ask what the block offers under a
  given state *(#96)*; and the fire sale — the answer to a paragon 2 houses in 19
  can afford — is reachable but untouched, with `liquidate` unexposed *(#97)*.
  Both closed. #97 was not a balance question at all: the market refresh was
  destroying the paragon in the week he arrived, four times in five, and the
  "take the house apart" branch of that screen had never once been true. *(#97)*

**The v2.72.0 audit — nine items, #108–#116, opened.** The last numbered batch closed at
v2.63.0; everything since was picked one item at a time, so this is a proper pass again. Its
scoping is deliberately shaped by what the last four releases taught: three of those four items
came back **refuted**, with a check as the deliverable rather than a fix. So every item below
carries its falsification clause written BEFORE the finding, and roughly half are expected to
dissolve. That is the clause earning its keep.

Four sweeps produced it: the careless-player arms, the scales walk, the static enumeration of
every line that makes a claim about the state, and the coverage list.

**#108 — CLOSED in v2.73.0, half refuted and half a fault nobody was looking for.** The
composition half is refuted: measuring ELIGIBILITY rather than firings, the states genuinely differ
(`ludusNight` eligible 5% / 5% / 51% of weeks, `affair` 43% / 41% / 100%, `auctoratus` 100% / 100% /
29%), so an idle house meeting fevers and affairs while a busy one meets contracts and kin is the
game working. But reading `pickEvent` to write that measurement found the draw itself was
`sort(()=>R()-0.5)` — the classic broken shuffle, in a file that already held a correct Fisher-Yates
used in nine other places. Measured on the statistic that decides what is asked, the first ELIGIBLE
key: a **1.3 to 1.4x skew toward events written earlier in the file**. The 5.1x first-position
figure is the wrong statistic and is recorded as such. Fixed, and the 42nd check holds it.

**#108 as it was written, for the record — The week asks one question, and which one depends on
whether you are doing anything.**
`d.pendingEvent` is a single slot, and systems with channels of their own set it before the
weekly lottery runs. Measured over 24 houses in three arms — careful, careless and idle — 120
weeks each: the RATE is nearly flat (0.48, 0.47, 0.55 questions a week), but the MIX is not.
`plea` fired 0 / 0 / **11**, `feud` 0 / 0 / **8**, `ludusNight` 2 / 0 / **11**, `affair` 2 / 0 /
**7** — the human events of the yard, effectively exclusive to a house doing nothing. Against
them `kinReturn` **14 / 12 / 0**, `booking` **5 / 0 / 0**, `match` 4 / 4 / 0, `pact` 5 / 1 / 0 —
the transactional ones, exclusive to a house that plays. A player who plays actively may never
meet the yard's written life at all. *Falsifies if:* each of those events' `need` gates is
satisfiable by an active house at a comparable rate, in which case this is composition by design.
*How verified:* three arms off one seed set, interleaved, counting `pendingEvent.key` per week.

**#109 — CLOSED in v2.75.0. Four of the ten were wrong, five were right, and the tenth is not a
proximity line.** Wrong: `feastReach` (a fraction 0.65–1 put through `Math.round`, so the feast read
"reach **1** of them" at every house size), `paragonReach` (the shortfall measured against the box
plus debts at face plus steel at half, beside a button reading the box alone — **12.8%** of 187
played house-weeks past week 20 in the window where the line names nothing missing and the purchase
is refused), `munusWait` (**0 weeks** of cooldown quoted to a house standing on the imperial sand),
`workOpen` (the closed line blamed the monuments; the tier-2 gate is the five plain works). Right:
`blessLeft`, `creditLine`, `riseNeed`, `romeBar`, `featNear`. And `acclaimTarget` is read by
`acclaimWeek` and shown to nobody — a rate, not a claim about how close anything is, so the list of
ten was really nine. Four of the first draft's six verdicts were the probe's; all four are written
into `near`, the 44th check.

**#109 as it was written, for the record — Every proximity line is a claim about the state, and ten
of them have never been driven.**
`featNear`, `riseNeed`, `romeBar`, `paragonReach`, `munusWait`, `workOpen`, `acclaimTarget`,
`blessLeft`, `creditLine`, `feastReach`. This project has already shipped two wrong ones and the
notes say so: the forge line told a house of six men in stock kit that the fee was the whole of
it, and Rome's letter read `0 fame short` to a house with no senator warm enough to send it. Both
were caught only by a check that drove the real gate. Ten more are unchecked. *Falsifies if:* all
ten agree with the gate they describe, in which case the release is the check.

**#110 — CLOSED in v2.76.0. The mix belongs to the policy, not to the game, so the three figures on
record were never in conflict.** Five policies, every opening, 400 weeks, 20 houses each, twice: debt
runs from **100%** (a house that does nothing) to **15–25%** (one that fights every bout to the death,
where 40% is the yard emptying instead), and is **69% / 67%** across all five — inside the 45–80% band
v2.68.0 measured, so the published 85% was the top of a wide range. By era, debt dominates years 1–3 in
every policy and the later years bring rebellion, `banned`, `lanistaDied` and `emptied`. Competence does
not buy the first year (13 of 24 out against 12 of 24 doing nothing); it buys the ceiling. `ends` is the
45th check and pins the opening, which was the stable half — the lifespan medians swung 36w to 20w
between runs and are not a bar. Left unresolved: five of the twelve endings never appeared in 200 played
houses, and the probe built to reach them failed its own control.

**#110 as it was written, for the record — What actually ends a house, by era and by competence, in one
table.** The balance
reference says debt is 85% of endings; v2.68.1 found the first 26 weeks kill by the yard emptying
with coin still in the box; and the careless sweep above put all 24 houses out — 16 emptied, 8 in
debt. Three different answers to one question, each measured on a different policy over a
different span, and the table carries only the first. *Falsifies if:* the ending mix is stable
across competence and era once lifespan is normalised. *How verified:* the proven long-life
policy, the careless arms and the idle floor, binned by year.

**#111 — CLOSED in v2.77.0, and the group was worth grouping.** The man in the chair turned out to
hang off one thing nothing had measured — `repStyle`, the name Capua settles on. Four suspicions, four
refutations, all the probe's: the town settles 87–100% of house-weeks; `show` looked dead at 1 week in
3,001 because every arm passed `"measured"` as the tactic, and a showboating house holds it 824 of 917
weeks; `mercy` looked unearnable because the arm testing it fought at first blood and so never reached
a crux, while the policy the charter teaches held it 1,277 of 1,296 weeks on 727 cloths; and
`recordCloth` awards no mercy rep because the award is where the cloth is resolved, one engine at a
time. `chair` is the 46th check. The ladder's readers and `boutAftermath` are still ungrouped.

**#111 as it was written, for the record — Sixty-six functions on the handle are still dark, in four
groups.** The man in the chair
(`lanistaWeek`, `hasLT`, `repStyle`, `addRep`); what the ladder tells you about the next rung
(`riseNext`, `riseNeed`, `riseFav`, `risePurse`, `riseRank`); the two contracts that arrive as
questions (`answerReSignWith`, `takeDoctoreOffer`); and `boutAftermath`, the one phase `phases`
does not run. Group before picking: eleven names turned into one `wall` check that way, and a
lone name is usually a reader somebody will call next week anyway.

**#112 — CLOSED in v2.77.0 with the clause upheld.** Its falsification clause was that `repStyle`
might reach "blood" so rarely that `STAFF.medicus.quitOn` was inert. A house that fights every bout to
the death holds the name **100% of its weeks from week 2** and loses its surgeon in **9 of 10 houses at
median week 12**, while a showman playing just as hard for just as long loses him in **0 of 10**. The
clause has real teeth and `chair` now holds that contrast.

**#112 as it was written, for the record — `repStyle` decides whether your medicus walks out, and
nothing has ever read it.**
`STAFF.medicus.quitOn` is `d.unrest > 72 || repStyle(d) === "blood"`, so a house Capua thinks of
as butchers loses its surgeon — a rule with real teeth that no check touches and no measurement
has ever priced. *Falsifies if:* `repStyle` reaches "blood" so rarely that the clause is inert,
which would make it the opposite fault and still worth the release.

**#113 — CLOSED in v2.78.0, REFUTED on its own falsification clause.** Twenty houses each working
one rivalry for 300 weeks: **median peak warmth 76.8, max 100**, and all four words said. The 43.4
ceiling came from `pickRivalOpp` spreading meetings across six rivals, and the beats gate on `met`
counts a concentrated rivalry reaches and a spread one does not. Two of my own follow-ups also
refuted: `loan` looked dead only because the sweep floored the purse at 4,000 (`poor` is gold under
200; isolated it fires 9 of 12), and the `d.pendingEvent` guard on `rivalArc` costs ~15% of the arc
rather than the word boundary an n=8 comparison suggested. No behaviour changed; `houses` is the 47th
check.

**#113 as it was written, for the record — Two of the four words for a rival house have never been
seen.** Measured over 2,310
samples across 6 houses and 160 weeks: warmth topped out at **43.4**, so "on good terms" (50) and
"thick as thieves" (75) were never said. Warmth rises 1.1 per *meeting* with a house whose grudge
is under 30, plus 6 to 16 from the rival-relationship beats — whose `need` gates gate on `met>=6`
and `met>=10`, which six houses had not reached. *Falsifies if:* a house that fights one rival
repeatedly for 200 weeks passes 50, which would make this the `houseWord` version of the primacy:
reachable, and my sample too short. Explicitly NOT claimed as a fault yet.

**#114 — CLOSED in v2.79.0, REFUTED on its own falsification clause.** `gearCond` is the pool of
pieces on the SHELF, not what a man carries: `buyGearItem` pushes 100 and `equipOne` splices it back
out on equipping, so the pool is dominated by spoils entering at `ri(55,85)` — a floor near 56 and a
ceiling under 85, which is the whole of the reported range. Read off the man in `g.wear[slot]`, a
bout takes **3-6** off a weapon at a measured median of **4**, all five words are said, and pieces
break. Two true things recorded rather than fixed: wear is a first-years system (breaks per ~1,050
bouts run 28 at L0, 2 at L1, 0 above), and the piece outlives its owner (a career is 3 bouts at the
median against the ~25 a weapon needs). Four instrument faults of mine are written into `steel`,
including that `doFight` returns before `wearKit` on an unanswered crux. No behaviour changed;
`steel` is the 48th check.

**#114 as it was written, for the record — Bought steel never read "keen" and never fell below 56.**
583 samples of `gearCond`: the range seen was 56 to 74 and neither the top band nor the bottom two
were ever occupied, while the lesson about wear promises steel that "eventually breaks in the middle
of one". *Falsifies if:* a piece carried through forty bouts without mending does fall through the
floor, in which case the probe simply did not own steel for long enough.

**#115 — CLOSED in v2.80.0, ANSWERED: both coastal scales work, and they work oppositely.** Favour
is a ratchet — opens at `20 + ri(0,15)`, moves only on a bout in that town by `4 + served*5`, never
decays — and runs 10 to 100 with all five words said, the bottom one reachable only through the
`cityServed` defeat branch at Neapolis. `knownIn` bleeds 0.55 a week: pegged at 100 by a round robin,
bled to nothing over ~130 weeks by neglect. The bay goes to a rival after 30 idle weeks (8 of 10
homebound houses, 0 of 8 touring) and comes back only by turning up (12 of 12). My tour probe's 7-of-8
REBELLION was its own policy: with the unrest levers pulled it is 6 of 10 whether the house tours or
not, and touring houses live longer. No behaviour changed; `bay` is the 49th check.

**#115 as it was written, for the record — Nothing has toured the coast in anything that samples
it.** `cityFavWord` took zero samples in the scales sweep. `roads` and `coast` drive the machinery; no
measurement has ever established what a town actually thinks of a house that visits it, so the scale
has no known range and its bands rest on nothing.

**#116 — CLOSED in v2.81.0. The suite was measuring bouts that never happened.** Counted off the
record for #108-#115: eight items, six closed as refuted or answered rather than as faults, against
roughly twenty-two instrument faults of mine. The two mechanically detectable ones are now a rope in
`harness.mjs` and a lint in `probe`, the 50th check. The fault measured: the fight engines return at
`res.unfinished` before crediting anything and mutate nothing, which is 60.5% of standard bouts and
59.3% sine (0.0% at first blood), confirmed by 721 of 721 held bouts having moved nothing. Three
checks answered no cruxes and five answered one, so nine of nineteen were losing a quarter to two
thirds of their evidence. TWO PUBLISHED FIGURES CORRECTED: `ends` from 13 of 24 out at a median 272d
under to **6 of 24 out at +506d, debt 3 / rebellion 3**, so playing well halves the opening's
lethality and the cells matter as much as the ledger; and #113's warmth peak from 76.8 to **100**,
refuting that item more decisively. One of `probe`'s own rules was taken back out for flagging seven
right answers against one wrong one, and its detector was rebuilt twice.

**#117 — CLOSED in v2.82.0. The reference table had two faults, and the second was a control that
was not one.** Re-run on the rope: debt across six policies is 24% / 27%, not 69% / 67%, and 95-100%
of it is the idle arm's — a resolved bout is a paid bout. `lanistaDied` is the plurality ending for a
well-run house. The second fault: answering every question with choice 0 is not a control, because on
`uprising` choice 0 is the only branch that can end the run — answering it as a solvent player would
takes `proven` from 54 weeks to 183 and its rebellion share from 70% to 40%, and the 55-84% rebellion
figure my first re-run produced was substantially my own answer policy. Working the cells is the
largest lever on record: 5 of 20 houses alive at year 22 against 0, on both seed sets.

**The v2.61.0 audit — ten items, #98–#107 — closed as of v2.63.0, and this is the ratio
worth remembering: four shipped, six refuted or judged not worth the risk.**

Shipped: the war given a second door (#98), the vow made a gamble again rather than a way to
buy a blessing (#100), the tab marks stopped being decoration (#101), courting a rival's man
prompted (#103). Two of those four were faults this project had shipped in the previous two
releases, which is what made measuring its own recent work the audit's first job.

Refuted by their own falsification clauses: the feast being unreachable was the probe being a
good manager (#105); "nine agenda items a week" was 3.64 once urgency was counted (#107); the
opening's bimodality was noise at 24 houses (#99); debt at 85% of endings is a property of
competence, since a careless policy dies of rebellion and closure a third of the time (#99);
and `hard` and `marked` are earned by 8 of 8 and 7 of 8 cruel houses, so both traits work and
a merciful house correctly never wears them (#106).

Measured, understood and left alone: `hound` is seen a median 3 times a house and `blind`
twice, with a fifth to a third of houses never meeting either — this named `MARK_NEED.arm = 58`
as the suspect, and v2.64.0 ran the A/B it asked for and **refuted it**: the arm lands in 37.9%
of bouts against 40.3 / 40.6 / 35.1 for the other three, and flattening it restores the fault
the split was written to fix. `engines` exists because bout constants are 3–5× stronger than
they look (#102). The
fourth level of each wing is reached by 5 of 50 upgrades at year five, which is the late sink
working as priced (#104).

**The lesson for the next one.** After twenty releases of this the cheap findings are gone,
and more than half of a well-measured list now dissolves under its own falsification clause.
That is the clause earning its keep, not the audit failing — but it means the next pass should
budget more time for disproving its own items than for building them, and should write the
falsification before the finding rather than after.

**The v2.52.0 audit's ten were closed as of v2.60.0.** Four of the ten were not what they looked like:
#95's five unearned feats were all reachable and three were the probe's own policy;
#97's rare content was a market refresh deleting it; #88's own recommended fix was
measured and refuted; and #91 was a system nobody was ever told about, with a probe
guard producing the number that made it look unaffordable. That is a hit rate worth
remembering when reading the next audit's list.

`npm run coverage` names the functions on the handle no check has ever called, every
run.

**What the audit after that should look for.** The same two seams, which have now
paid three times: a number set against an economy that no longer exists, and a
system with machinery the player never meets. And a third, learned the hard way
in v2.52.0: **a fix verified against a state you invented rather than one the game
produces is not verified.** Check where the game actually sits before deciding
what a change did.

And a fourth, from v2.58.0: **"the probe never did it" and "the game will not let
you" look identical in a census, and the first is far commoner.** Five feats read as
unreachable across 3,200 house-weeks and every one of them was reachable; the fix for
three of them was one line of probe policy. Before filing a system as dead, write the
policy that deliberately uses it and see whether the system answers. The corollary,
learned the same day: a proximity line, a hint or a nudge is a claim about the state,
and a wrong one is worse than saying nothing — both of the first two written here were
wrong, and only a check that drove the real gate caught them.

**What the next audit should be looking for.** The five that produced the best
releases in this stretch were all of one kind — a system with real machinery behind
it that the player never meets, or a number that was chosen against an economy that
no longer exists. The seams to check: content that never fires, ladders whose top
rungs nobody reaches, prices set before three repricings, screens that show a figure
nobody can act on, and anything the coverage sweep says no check has ever touched.

---

*Last updated: v3.5.0*
