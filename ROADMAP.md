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

## Changelog (shipped)

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

**Next up — the queue**
- **Weather on the day.** Seasons exist but no individual afternoon is wet. Venue footing already provides the machinery.

**Later**

---

*Last updated: v0.68.0*
