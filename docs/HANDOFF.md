# Developer handoff

Updated 2026-11-21. This build has six quests, two floors, recorded rookie replies, document submission, and consequence/recovery achievements. Save version 1 remains compatible.

## Build and repository rules

Use Node 22+, `npm ci`, then `npm test`. The test command rebuilds `dist` and runs 98 game checks plus distribution checks. `npm run dev` serves the game at http://127.0.0.1:8765. For offline play, open `dist/index.html` and keep the entire distribution folder together.

Edit source in `src`; regenerate `dist` with `npm run build`. Keep the CSS import order in `src/styles/index.css`. Later rules in `ending.css` override mobile inventory rules in `pixel-theme.css`; check both when changing the HUD. No new dependencies, external images, or fonts were added. The owner-supplied processed rookie voice bank is included.

The existing supplier recording and Gaegu font remain included with the font license. Contest submission, a public deployment, Windows EXE packaging, and video production remain separate work.

## File map

| Responsibility | Source |
| --- | --- |
| Boot and input wiring | `src/main.js`, `src/game/input.js` |
| First four quests and dialogue | `src/game/quests.js`, `src/game/actions.js` |
| Elevator, contract, delivery, payment | `src/game/procurement.js` |
| Quest names and last-stage constant | `src/data/quests.js` |
| Learning text and official source links | `src/data/learning.js` |
| Glossary and lesson review | `src/components/learning.js` |
| HUD, inventory, ending | `src/components/hud.js`, `inventory.js`, `ending.js`, `world.html` |
| Mock G2B | `src/components/portal.js` |
| Map data, floor partitions, destinations | `src/data/world.js` |
| Sprites and projection/depth order | `src/world/characters.js`, `render.js` |
| Movement and floor-aware routing | `src/world/navigation.js` |
| Submission matrix and gates | `docs/ITEM_SUBMISSIONS.md`, `src/game/submission.js` |
| Recovery content and progression | `src/data/recovery.js`, `src/game/recovery.js` |
| Outline colors and contrast calculation | `src/world/contrast.js` |
| Save migration | `src/core/storage.js`, `src/data/initial-state.js` |
| Voice registration and effects | `src/audio/sound.js` |

## Stages and progression

`LAST_STAGE = 6`; stages 0–5 are playable quests and stage 6 is the ending.

| Stage | Quest | Gates and completion |
| --- | --- | --- |
| 0 | 요청서 접수 | Tutorial briefing, contact the library, complete request |
| 1 | 규격 검토 | Mentor advice, performance-based specification |
| 2 | 입찰 공고 | Save quantity 20 in the mock portal; mentor review and authorized approval |
| 3 | 기업 입찰 참여 | Supplier role, suitable product, mock login and participation checkbox |
| 4 | 낙찰과 계약 | Return to rookie; elevator to 3F; officer briefing, confirm the previously determined price, contract |
| 5 | 납품과 대금 지급 | Return to 5F; request correction of 19 delivered against 20 contracted, inspect corrected delivery, verify receipt/documents, payment |
| 6 | Ending | Six lessons, seven items, earned final level, existing recruitment link |

Bid receipt completes stage 3 only. It must never be described as award or contract completion. The contract scene assumes a fictional review under the announced selection method is complete; it teaches no scoring formula or lowest-price shortcut. The price was determined before bidding. The later scene confirms that existing record.

A completion saves immediately. The new inspection flow also saves after requesting a correction and after inspection. Repeated submit/contract/payment calls cannot duplicate a completed quest.

## Floors and navigation

`floors[0]` is 5F and `floors[1]` is 3F. The original `furnishings` export aliases floor 0 for compatibility. Partitions, doors, and furnishings drive collision, rendering, and minimap layout.

Every spot has a floor except the elevator. Room number/department signs are removed. Minimap captions identify 5F 구매팀, 3F 계약팀, or 새봄테크 영업팀. NPC spots also carry separate `npcX`/`npcY` render coordinates so arrivals stand beside the NPC rather than on top of it. `spotActive` filters interactions and hotspots. `guideTarget` redirects another floor's target to the elevator; the player chooses the destination and presses the next-goal button again after arrival. `travelTo` clears movement, places the player next to the elevator, updates the floor, and saves. The supplier office permits only its desk and monitor and cannot travel.

Floor location and legal procedure are fictionalized for the game. Official headquarters room numbers are visual references, not a claim that those offices perform these fictional tasks.

## Save compatibility

Keep key `jodal-master-v1` and version 1. `loadGame` validates the old required fields, accepts stages 0–6, validates optional new fields, and merges defaults from `fresh()`.

New saved fields :

- `recoveries` : completed recovery IDs, default `[]`; IDs are unique and validated.
- `pendingRecovery` : a recovery ID for the current stage, default `null`; Continue restores its consequence screen.

- `floor` : 0 or 1; absent old saves default to 0.
- `awardBrief` : 3F officer explanation completed.
- `openingChecked` : player confirmed that the price was determined before bidding.
- `deliveryIssueReported` : shortage correction requested; the next delivery screen shows 20.
- `inspectionChecked` : inspection, acceptance, and receipt completed.

Old stage-4 saves continue into the contract quest, with five items and these flags false. The new final stage is 6. Existing history strings remain intact. The officer adds a post-price explanation and a send-off after the contract document. The stage-5 goal remains the officer until that dialogue and recorded rookie reply finish; Continue restores that pending send-off on 3F.

Session-only state includes the active floor mirror (`runtime.floor`), camera, coordinates, dialogue, modal, touch key, and mock portal login. Resuming restores the saved floor and starts beside the elevator on 3F or at the desk on 5F; it does not persist precise coordinates. New game resets floor, movement target, progression, and login.

## Sprite fixes

Topological depth ordering resolves unconstrained candidates by the footprint front edge (`x1 + y1`). Tests cover four front/back cells for every furniture instance on both floors (80 placements). A real Chromium canvas check compared 17,528 opaque overlap pixels across the same 80 placements with zero mismatches.

Each character/pose is rasterized once into a 16×24 offscreen canvas. One `drawImage` call draws the full sprite at integer device pixels with smoothing disabled. This removes fractional cell seams. Walking lifts one foot rather than shifting legs downward; all four poses remain connected. People, wide desks, and partitions use their geometric behind/in-front relation for drawing order. The floor target marker is drawn before furniture and characters so it cannot appear across a body.

The tests check connected sprite pixels for rookie, mentor, supplier, and officer in all four poses, integer destination pixels across fractional camera scales, and the wide-desk ordering regression. Browser screenshots are separate evidence; see the validation record.

## Voice integration

The owner's recording is now registered as the production `rookie` voice, independently of the existing supplier recording. `assets/audio/jodal-voice-bank.wav` is mono 24kHz s16 PCM, 2.4 seconds, 115244 bytes, with 24 slots of 85ms voice plus 15ms silence. Offsets are `i * 0.1` for `i = 0..23`.

The coordinator prepared these grains from the owner's 5.67-second AAC recording using a 90Hz highpass, 7.5kHz lowpass, loudness normalization, peak leveling, and 6ms fades. Only the processed bank is included; the raw recording stays outside the repository and distribution.

`loadVoiceBank(role, bytes, offsets, segment = 0.085)` validates decoded ranges and registers an independent `rookie` or `supplier` bank. `loadRookieVoice()` stores `runtime.rookieVoiceReady`; both banks load after audio initialization. The build embeds both WAV files as base64 for offline play. A failed decode falls back to synthesized syllables. Conversations pass an optional per-conversation rookie reply as the fifth argument of `speak`; it plays before the completion callback and is skipped at supplier stage 3. Both recordings use a 1.4 base playback rate plus the existing character-derived variation; only the synthetic rookie fallback uses 1.7. Sound settings retain both preview buttons and one master volume. Other characters retain their existing synthetic voices.

Tests verify both production banks, nonempty voiced windows, rookie dialogue playback, independence, decode fallback, and invalid-range rejection. The distribution suite checks both embedded banks and excludes raw M4A recordings. No upload UI or external voice service was added.

## Evidence and remaining work

`npm test` currently passes 98 checks plus the distribution suite. See `docs/검증기록.txt` for browser results and limits. No commit, push, PR, or deployment was performed by this worker.

Official reference content was supplied to the worker from a 2026-11-21 fetch :

- Procedure : https://www.pps.go.kr/kor/content.do?key=00179
- Floor reference : https://www.pps.go.kr/kor/content.do?key=00139
- G2B : https://www.g2b.go.kr/
- Ending recruitment link : https://www.pps.go.kr/kor/bbs/list.do?key=00645

## Bag and recovery flow

Read `docs/ITEM_SUBMISSIONS.md` for the matrix written before the bag implementation. The seven items are reusable; the request and specification become available as drafts before their first submission. Target actions request an item before opening the task. The modal contains a highlighted bag with keyboard-accessible buttons because the world is inert behind an open modal. Wrong items leave the request pending and change no score or progress. A session-only `submittedSteps` set avoids duplicate prompts within a local step and resets on Continue/new game; it adds no save fields.

Wrong decisions now open a consequence screen, then a corrective task with one action that rejoins the existing storyline. Nine scenes include both mutually exclusive specification errors. Official procedure step references are stored beside each scene. Notice quantity recovery restores the draft form before setting its value; the dialog replaces the old form in the browser DOM.

Ending titles use completed recovery count, with legacy mistake count retained for older saves : zero = 정파, one or two = 정파 · 수습을 배운 신입, three or more = 사파. Completed recoveries appear in the achievements list. No alternative full storyline was added.

## Outline verification

Interactable NPC sprites use a cached bright silhouette and dark outer edge within two tiles of the player; interactive monitors, phone, and documents use the same proximity rule and colors. Nearby names appear within that radius; the current goal name and minimap dot remain visible at any distance. Other floor colors are one tone darker. Only the next hotspot pulses, with `prefers-reduced-motion` disabling animation. The goal floor marker uses the same two-color outline.

WCAG 2.2 SC 1.4.11 requires 3:1 for meaningful non-text information against adjacent colors. The measured outline pair `#fff2a6` / `#172f35` is 12.3815:1. The dark edge against the darkest tested desk side `#92724e` is 3.1712:1; against the darker floor `#899e92`, 4.9312:1. Calculation uses sRGB linearization and relative luminance, with unrounded values tested against 3.

Sources checked 2026-11-21 : [official procedure](https://www.pps.go.kr/kor/content.do?key=00179), [WCAG non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

Artifacts for this worker are in `/tmp/jodal-run2/`. Full-room depth screenshots use a temporary harness importing the production renderer; proper and recovery playthroughs use the shipped bundle and visible UI controls.

## Follow-up 1 : review fixes

The current suite passes 87 checks plus distribution checks. Recovery IDs must be strings before any property-key lookup; malformed pending IDs and nested completed-ID arrays reject the save and leave Continue unavailable. Valid pending recovery strings still resume and finish.

`drawFurniture` outlines only active spots, so stage 3 shows document/terminal cues and leaves the disabled phone unoutlined. `positionLabels` uses screen-space silhouette bounds, label dimensions, existing labels, and visible HUD rectangles to place clickable labels without covering actors or active furniture. The same placement applies on both floors and adapts to viewport/camera changes.

The ground goal cue is an isometric diamond. `floorMarkerBounds` conservatively suppresses the whole cue if any scene silhouette might clip it. At the reviewed mentor approach, the foreground partition suppresses the cue; the highlighted name and minimap continue to show the next goal.

Regression tests cover malformed recovery values, active-only furnishing outlines, desktop/mobile label placement on both floors, and complete suppression of clipped ground markers. Chromium measurements and four new screenshots are in `/tmp/jodal-run2/fix1-*`; the detailed result is appended to `core-report.md`.

## Play-test polish (2026-11-21)

- Physical `e.code` handles WASD, Q, and E on both keydown and keyup, including Korean IME jamo/Process values. Arrows remain supported. Manual and automatic movement share `MOVE_SPEED = 145`.
- The portal draft contains no quantity answer beside the input. Players consult the request. Decision buttons retain plain decision text and the 11 document submissions remain intact.
- `src/game/progression.js` awards 100 XP per quest plus 25 XP for no recovery on that quest; every 150 XP gives a level. Each completion shows the award and any level-up. The HUD shows current level, progress, and XP; the ending shows total XP and final level (clean run : 750 XP / level 6).
- Optional saved fields : `xp`, `questMistakes` (mistake count at the prior quest boundary), `contractFarewell`. Loading old version-1 saves awards 100 XP per completed stage and defaults the current mistake baseline. Recovery IDs also suppress the current quest bonus after reload. Save key and version remain unchanged.
- Removed all player-visible fiction/abbreviation notices, including documents, glossary, help, portal, and dialogue. The title and ending each show one actual-work accuracy note. The clock shows story dates/times. The recruitment button keeps its destination and the separate destination sentence is removed.

`npm test` now runs 87 game checks plus distribution checks. Browser artifacts and item-by-item ownership are in `/tmp/jodal-run3/polish-report.md`.
