# Developer handoff

Updated 2026-11-21. This build expands the existing four quests to six, retains save version 1, and adds a second floor reached through an elevator.

## Build and repository rules

Use Node 22+, `npm ci`, then `npm test`. The test command rebuilds `dist` and runs 63 game checks plus distribution checks. `npm run dev` serves the game at http://127.0.0.1:8765. For offline play, open `dist/index.html` and keep the entire distribution folder together.

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
| 6 | Ending | Six lessons, seven items, level 2, existing recruitment link |

Bid receipt completes stage 3 only. It must never be described as award or contract completion. The contract scene assumes a fictional review under the announced selection method is complete; it teaches no scoring formula or lowest-price shortcut. The price was determined before bidding. The later scene confirms that existing record.

A completion saves immediately. The new inspection flow also saves after requesting a correction and after inspection. Repeated submit/contract/payment calls cannot duplicate a completed quest.

## Floors and navigation

`floors[0]` is 5F and `floors[1]` is 3F. The original `furnishings` export aliases floor 0 for compatibility. Partitions, doors, labels, and furnishings drive collision, rendering, and minimap layout.

Every spot has a floor except the elevator. NPC spots also carry separate `npcX`/`npcY` render coordinates so arrivals stand beside the NPC rather than on top of it. `spotActive` filters interactions and hotspots. `guideTarget` redirects another floor's target to the elevator; the player chooses the destination and presses the next-goal button again after arrival. `travelTo` clears movement, places the player next to the elevator, updates the floor, and saves. The supplier office permits only its desk and monitor and cannot travel.

Floor location and legal procedure are fictionalized for the game. Official headquarters room numbers are visual references, not a claim that those offices perform these fictional tasks.

## Save compatibility

Keep key `jodal-master-v1` and version 1. `loadGame` validates the old required fields, accepts stages 0–6, validates optional new fields, and merges defaults from `fresh()`.

New saved fields :

- `floor` : 0 or 1; absent old saves default to 0.
- `awardBrief` : 3F officer explanation completed.
- `openingChecked` : player confirmed that the price was determined before bidding.
- `deliveryIssueReported` : shortage correction requested; the next delivery screen shows 20.
- `inspectionChecked` : inspection, acceptance, and receipt completed.

Old stage-4 saves continue into the contract quest, with five items and these flags false. The new final stage is 6. Existing history strings remain intact. Session-only state includes the active floor mirror (`runtime.floor`), camera, coordinates, dialogue, modal, touch key, and mock portal login. Resuming restores the saved floor and starts beside the elevator on 3F or at the desk on 5F; it does not persist precise coordinates. New game resets floor, movement target, progression, and login.

## Sprite fixes

Each character/pose is rasterized once into a 16×24 offscreen canvas. One `drawImage` call draws the full sprite at integer device pixels with smoothing disabled. This removes fractional cell seams. Walking lifts one foot rather than shifting legs downward; all four poses remain connected. People, wide desks, and partitions use their geometric behind/in-front relation for drawing order. The floor target marker is drawn before furniture and characters so it cannot appear across a body.

The tests check connected sprite pixels for rookie, mentor, supplier, and officer in all four poses, integer destination pixels across fractional camera scales, and the wide-desk ordering regression. Browser screenshots are separate evidence; see the validation record.

## Voice integration

The owner's recording is now registered as the production `rookie` voice, independently of the existing supplier recording. `assets/audio/jodal-voice-bank.wav` is mono 24kHz s16 PCM, 2.4 seconds, 115244 bytes, with 24 slots of 85ms voice plus 15ms silence. Offsets are `i * 0.1` for `i = 0..23`.

The coordinator prepared these grains from the owner's 5.67-second AAC recording using a 90Hz highpass, 7.5kHz lowpass, loudness normalization, peak leveling, and 6ms fades. Only the processed bank is included; the raw recording stays outside the repository and distribution.

`loadVoiceBank(role, bytes, offsets, segment = 0.085)` validates decoded ranges and registers an independent `rookie` or `supplier` bank. `loadRookieVoice()` stores `runtime.rookieVoiceReady`; both banks load after audio initialization. The build embeds both WAV files as base64 for offline play. A failed decode falls back to synthesized syllables. Sound settings provide separate rookie and supplier previews. Other characters retain their existing synthetic voices.

Tests verify both production banks, nonempty voiced windows, rookie dialogue playback, independence, decode fallback, and invalid-range rejection. The distribution suite checks both embedded banks and excludes raw M4A recordings. No upload UI or external voice service was added.

## Evidence and remaining work

`npm test` currently passes 63 checks plus the distribution suite. See `docs/검증기록.txt` for browser results and limits. No commit, push, PR, or deployment was performed by this worker.

Official reference content was supplied to the worker from a 2026-11-21 fetch :

- Procedure : https://www.pps.go.kr/kor/content.do?key=00179
- Floor reference : https://www.pps.go.kr/kor/content.do?key=00139
- G2B : https://www.g2b.go.kr/
- Ending recruitment link : https://www.pps.go.kr/kor/bbs/list.do?key=00645
