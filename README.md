# jodal-quest

2026 조달청AI 게임·콘텐츠 공모전 출품작입니다.

최종 산출물 : html, exe

현재 제공하는 실행물은 **웹 게임(HTML)**입니다. **Windows EXE 패키징은 아직 구현·검증하지 않았습니다.**

## 실행하기

저장소를 내려받아 **`dist/index.html`**을 브라우저로 열면 됩니다.
`dist`에는 실행에 필요한 HTML·CSS·JavaScript·글꼴이 함께 들어 있습니다. **폴더 전체를 유지하세요.** 루트의 `index.html`은 개발용 조립 템플릿입니다.

진행 저장은 같은 브라우저·같은 주소에서 유지됩니다. 파일 위치나 서버 주소를 바꾸면 기존 저장 공간과 달라질 수 있습니다.

## 팀원 개발 시작

Node.js **22 이상**이 필요합니다.

```sh
npm ci
npm run dev
```

브라우저에서 <http://127.0.0.1:8765>를 여세요. 파일을 수정하고 새로고침하면 반영됩니다. 종료는 `Ctrl+C`입니다.

```sh
npm test       # 빌드 + 게임 동작 검사 + 배포 자산 검사
npm run build  # dist 폴더 재생성
```

`dist`는 바로 실행할 수 있도록 저장소에도 포함했습니다. **직접 편집하지 말고 `src` 수정 후 다시 빌드하세요.**
별도 프레임워크 없이 JavaScript 모듈과 HTML 컴포넌트로 구성했습니다. 개발 의존성은 esbuild 하나이며, 버전은 lockfile로 고정했습니다.

## 코드 구조

```text
index.html                 # HTML 컴포넌트를 조립하는 템플릿
src/
  main.js                  # 초기화와 시작
  components/              # 화면별 HTML / UI 동작
    world.html             # 사무실·미니맵·노트·인벤토리 틀
    title.html, title.js   # 시작 화면
    dialogue.html, dialogue.js
    modal.html, modal.js
    hud.js, inventory.js, portal.js, ending.js
  styles/                  # 기본·노트·화면·반응형·나라장터·엔딩 CSS
  game/                    # 퀘스트·선택 동작·키보드/마우스 입력
  world/                   # 맵 그리기·도트 캐릭터·이동·충돌
  core/                    # 공용 상태·브라우저 저장·DOM 접근
  data/                    # 퀘스트 안내·맵 배치·초기 저장값
  audio/sound.js           # 대화 소리·음량·효과음
assets/
  audio/yon-voice-bank.wav  # 가공한 욘 대리 발성 조각
  fonts/Gaegu-Regular.ttf   # 한국어 손글씨체
scripts/build.mjs          # 소스 → 배포 폴더 조립
tests/                    # 동작 및 배포 검사
dist/                     # 실행용 결과물 (자동 생성)
docs/                     # 실행·인수인계·시연·제출 안내
```

자세한 수정 위치와 주의할 흐름은 [팀원 인수인계](docs/HANDOFF.md)에 정리했습니다.

## 게임 내용

가상 지방조달청 신입 9급 주무관 **조달달**이 선배 **김주문**에게 배우며 네 퀘스트를 진행합니다.

- 요청서 접수 → 규격 검토 → 입찰 공고 → 기업 입찰 참여.
- 도트 2.5D 쿼터뷰, 미니맵, 미색 손글씨 퀘스트 노트.
- 하단 5칸 인벤토리: 사원증·요청서·규격서·공고문·접수증.
- 업무용 모니터에서만 열리는 모의 나라장터.
- 마지막 단계에서 여성 기업 담당자 **욘 대리**로 잠시 전환.
- 팀원 녹음을 가공한 욘 대리 음성, 자동 저장, Lv. 2 엔딩.

`WASD` / 방향키로 이동, 대상 이름을 누르면 자동 이동, `Space`로 대화, `Q`로 퀘스트 노트를 엽니다.
신입은 확인·초안 작성, 선배는 조언·검토를 맡고 공고는 권한 있는 담당자의 결재 후 게시합니다.
**모의 입찰서 접수는 낙찰·계약 완료가 아닙니다.** 실제 나라장터로 데이터를 보내지 않습니다.

## EXE로도 실행할 수 있나?

가능합니다. HTML·CSS·JavaScript를 분리해도 Electron 같은 데스크톱 포장 도구가 실행 자산을 함께 묶을 수 있습니다.
후속 작업에서는 `dist/index.html`과 `dist` 안의 모든 파일을 Electron에 포함하고 Windows용으로 패키징하면 됩니다.
현재 소스에는 Electron 실행부나 EXE 빌드 설정을 넣지 않았으므로, **지금 EXE가 만들어진 것은 아닙니다.**
패키징 후에는 Windows에서 실행·저장·음성·외부 링크를 별도로 검수해야 합니다.
참고: [Electron 공식 앱 구성](https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app), [패키징](https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging).

## 검증과 문서

현재 **게임 검사 43개 + 배포 자산 검사**를 통과했습니다. 분리 전후 조달달·기업·완료 장면의 Canvas 렌더링도 동일함을 확인했습니다.
모의 환경 검사이며 **실제 브라우저 완주·최종 화면 배치·스피커 청취는 아직 미검증**입니다.

- [실행 안내](docs/실행안내.txt)
- [팀원 인수인계](docs/HANDOFF.md)
- [음성 설명](docs/팀원음성안내.txt)
- [1분 시연 동선](docs/1분시연동선.txt)
- [제출용 소개문 초안](docs/제출용소개문-초안.txt)
- [검증 기록](docs/검증기록.txt)

원본 전체 녹음은 업로드하지 않았습니다. 가공한 발성 조각만 `assets/audio`에 있으며, 배포 시 파일 직접 실행에서도 재생되도록 JavaScript에 포함합니다.
Gaegu 글꼴 허가문은 `assets/FONT-LICENSE.txt`와 배포 폴더에 포함합니다.
공개 배포·EXE 제작·공모전 접수·시연 영상 제작은 아직 하지 않았습니다.
