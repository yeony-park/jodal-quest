# 팀원 인수인계

기준일: 2026-11-21. 단일 HTML에서 책임별 소스와 CSS로 분리했습니다. 게임 동작은 기존 MVP를 유지합니다.

## 실행과 편집

- 바로 플레이: `dist/index.html`을 브라우저로 열기. `dist` 전체를 함께 배포합니다.
- 개발: Node.js 22 이상에서 `npm ci`, `npm run dev`. http://127.0.0.1:8765 에 접속합니다.
- 확인: `npm test`.
- 배포 갱신: `npm run build`. 저장소에 포함한 `dist`도 새 결과로 커밋합니다.

루트 `index.html`은 HTML 컴포넌트 조립 템플릿입니다. 그 파일만 브라우저로 열면 완성된 게임이 아닙니다.
`src`가 수정 원본이며 `dist`는 자동 생성 결과입니다. 이전 단일 HTML이나 임시 변환 스크립트로 덮어쓰지 마세요.

## 수정 위치

| 수정 내용                  | 파일 / 위치                                        |
| -------------------------- | -------------------------------------------------- |
| 시작 순서                  | `src/main.js`                                      |
| HUD·맵·노트·가방의 HTML 틀 | `src/components/world.html`                        |
| 시작 화면                  | `src/components/title.html`, `title.js`            |
| 말풍선·Space 진행          | `src/components/dialogue.html`, `dialogue.js`      |
| 모달과 도움말              | `src/components/modal.html`, `modal.js`            |
| 노트 상태·목표 표시        | `src/components/hud.js`                            |
| 다섯 아이템·획득 조건      | `src/components/inventory.js`                      |
| 나라장터 화면·초안·입찰    | `src/components/portal.js`                         |
| 레벨업·엔딩 링크           | `src/components/ending.js`                         |
| 대사·구매 문서·퀘스트 완료 | `src/game/quests.js`                               |
| 버튼 선택 결과             | `src/game/actions.js`                              |
| 키보드·클릭 연결           | `src/game/input.js`                                |
| 퀘스트 제목·안내           | `src/data/quests.js`                               |
| 방·가구·목적지             | `src/data/world.js`                                |
| 도트 캐릭터                | `src/world/characters.js`                          |
| 쿼터뷰·카메라·그리기       | `src/world/render.js`                              |
| 경로 탐색·충돌·이동        | `src/world/navigation.js`                          |
| 저장·복원                  | `src/core/storage.js`, `src/data/initial-state.js` |
| 실행 중 공유 상태          | `src/core/runtime.js`                              |
| 음량·목소리·효과음         | `src/audio/sound.js`                               |
| 욘 대리 가공 녹음          | `assets/audio/yon-voice-bank.wav`                  |
| 글꼴                       | `assets/fonts/Gaegu-Regular.ttf`                   |
| 모든 CSS 진입점            | `src/styles/index.css`                             |

CSS는 기존 적용 순서를 유지하면서 기본/HUD, 노트, 화면·대화, 반응형, 도트 테마, 나라장터, 엔딩으로 나눴습니다.
`index.css`에서 가져오는 순서가 우선순위에 영향을 주므로 임의로 정렬하지 마세요.

## 구조

HTML 컴포넌트는 빌드할 때 합칩니다. JavaScript는 명시적인 import/export를 사용하고, UI 컴포넌트와 게임 로직은 공용 `runtime` 상태를 참조합니다.
저장 대상은 `runtime.state`뿐입니다. 모달, 현재 대화, 오디오, 카메라 등은 세션 중에만 유지됩니다.
프레임워크와 대규모 상태 관리 도구는 도입하지 않았습니다. esbuild 하나로 실행 JavaScript와 CSS를 만들고 HTML·글꼴·허가문을 배포 폴더에 넣습니다.

글꼴과 음성은 소스에서 별도 파일입니다. 가공 음성은 빌드 중 JavaScript에 포함되어 `file://` 실행에서 음성을 가져오기 위한 네트워크 요청이 필요 없습니다. 원본 M4A 전체는 포함하지 않습니다.

## 유지할 플레이 흐름

1. 조달달이 수요기관에 납기를 확인하고 요청서를 보완합니다.
2. 김주문에게 조언을 듣고 성능 중심 규격 수정안을 고릅니다.
3. 모니터에서 수량 2대를 20대로 수정해 검토본만 저장합니다. 선배 검토와 권한 있는 담당자의 결재 후 공고를 게시합니다.
4. 욘 대리로 전환해 적합한 제품을 고르고, 모니터에서 공고와 참가 조건을 확인한 후 모의 입찰서를 제출합니다.
5. 조달달로 복귀해 Lv. 2, “이제 나도... 조달의 왕이야!” 엔딩.

입찰서 접수를 낙찰이나 계약 완료로 표현하지 않습니다. 엔딩의 지정 외부 링크는 조달청 채용정보입니다.

## 저장과 음성 유지 사항

- 저장 키 `jodal-master-v1`, 저장 버전 1 유지. 기존 저장 구조와 호환됩니다.
- 같은 origin/파일 주소의 저장만 이어집니다. 예전 루트 HTML에서 `dist/index.html`로 파일 주소를 옮기면 브라우저별 파일 저장 공간이 달라질 수 있습니다. 기존 서버 주소를 유지하려면 같은 주소의 루트에서 `dist`를 제공하세요.
- 인벤토리는 5칸이고 퀘스트 상태에서 획득 여부를 계산합니다.
- 모의 로그인 상태는 새로고침 후 초기화되지만 퀘스트는 저장됩니다.
- 욘 대리만 실제 팀원 음성. 김주문·조달달·수요기관 담당자는 합성 웅얼거림입니다.
- 음성 불러오기 UI는 사용자 요청으로 제거했습니다.
- 현재 음성 조각은 모노 24kHz WAV, 85ms 발성 + 15ms 간격 24개로 총 2.4초입니다. 교체할 때 `loadSupplierVoice`의 오프셋과 관련 검사를 같이 맞추세요.
- 기업 사무실은 별도 장소로 표기하되 간단한 MVP를 위해 맵 배치를 재사용합니다.

## 검증과 남은 확인

`npm test`는 빌드 후 43개 게임 검사와 배포 연결 검사를 실행합니다.
게임 모듈을 테스트 전용으로 묶어 상태 전이를 검사하며, 실제 배포 번들도 별도로 부팅하고 시작 버튼 연결을 검사합니다.
배포 검사에서는 HTML·CSS의 상대 자산 경로, HTML 컴포넌트, 글꼴 바이트, 내장 음성 및 허가문을 확인합니다.
분리 전후 조달달·기업·완료 장면의 Canvas 결과가 동일한 것도 확인했습니다.

다음 항목은 실제 기기에서 확인해야 합니다.

- 제출할 브라우저에서 처음부터 네 퀘스트 완주.
- 화면 크기별 HUD·말풍선·나라장터 배치와 스피커 음량.
- 실제 브라우저 새로고침·이어하기.
- 제출용 팀명·참가자 정보, 공모전 지정 항목.

## EXE 후속 작업

파일을 분리해도 EXE로 묶을 수 있습니다. Electron에서 `dist/index.html`을 로드하고 `dist`의 자산을 함께 패키징하는 방식입니다.
현재 저장소에는 Electron 실행부나 Windows EXE 빌드 설정을 추가하지 않았습니다. EXE 제작을 완료했다고 간주하지 마세요.
실제 Windows에서 앱 실행·localStorage·오디오·외부 링크 처리를 확인해야 합니다.

공식 참고: https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app
패키징: https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging

## 원자료

업무 흐름: https://www.pps.go.kr/kor/content.do?key=00179
맵 참고: https://www.pps.go.kr/kor/content.do?key=00139
나라장터: https://www.g2b.go.kr/
보조 화면 자료(공개 PDF 116쪽): https://www.nyjwf.or.kr/File/Download/e4281ebc747d1a45c3f6afe5a97701a2
엔딩: https://www.pps.go.kr/kor/bbs/list.do?key=00645

실제 평면도나 나라장터 화면을 완전히 복제한 것은 아니며 가상의 학습 사례로 축약했습니다.
