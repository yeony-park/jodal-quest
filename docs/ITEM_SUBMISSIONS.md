# Bag item-to-step matrix

Seven items : 0 badge, 1 request, 2 specification, 3 notice, 4 bid receipt, 5 contract, 6 completed file.
Request is available as a draft after briefing; specification is available as a draft at stage 1. Their descriptions distinguish draft and completed records.

| Step ID | Stage / gate | Target | Required item |
| --- | --- | --- | --- |
| registration | Officer holding a badge, first account registration | card reader | 0 badge |
| intake | 0, briefing and agency contact complete | documents | 1 request |
| specification | 1, mentor advice complete | documents | 2 specification |
| notice | 2, draft unchecked | terminal | 2 specification |
| approval | 2, draft checked | mentor | 2 specification |
| product | 3, product unchecked | documents | 3 notice |
| bid | 3, product checked | terminal | 3 notice |
| award | 4, briefing incomplete | officer | 4 bid receipt |
| price | 4, briefing complete, price unchecked | bidroom | 4 bid receipt |
| contract | 4, price checked | officer | 4 bid receipt |
| delivery | 5, inspection incomplete | phone | 5 contract |
| payment | 5, inspection complete | terminal | 5 contract |

Every other item at each step gives an in-character retry hint, changes no score/progression, and leaves submission pending. Locked items stay locked. Registration persists in the save file. Documents remain in the bag after submission. A session-only approved-step set avoids asking twice while retrying a local screen; reload asks again safely. Submission is requested at the actual target, not at a distance.

Official source (verified 2026-11-21) : https://www.pps.go.kr/kor/content.do?key=00179 . Recovery scenes stop the incorrect draft before publication/submission/payment and teach the proper procedure before returning to the shared storyline.

Implementation : `src/game/submission.js`. The automated suite checks the document matrix and registration. Wrong choices and wrong documents are separate actions : a wrong document retries without a penalty; a wrong decision enters a recovery scene.
