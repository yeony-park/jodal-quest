import { levelProgress } from "../game/progression.js";
import { endingTitle, recoveryScenes } from "../data/recovery.js";
import { learningReview } from "./learning.js";
import { LAST_STAGE } from "../data/quests.js";
import { player, runtime } from "../core/runtime.js";
import { TILE, floors } from "../data/world.js";
import { speak } from "./dialogue.js";
import { buttons, show } from "./modal.js";
import { face, rookieOutfit } from "../world/characters.js";

export const MORE_QUESTS = "https://www.pps.go.kr/kor/bbs/list.do?key=00645";

export function ending() {
  runtime.floor = 0;
  runtime.state.floor = 0;
  player.x = 14.5 * TILE;
  player.y = 4.5 * TILE;
  speak(
    "조달달",
    [
      "요청서의 빈칸부터 계약, 납품과 대금 지급까지 마쳤어. 공정한 기준과 꼼꼼한 확인을 기억할 거야!",
      "이제 나도... 조달의 왕이야!",
    ],
    result,
    "rookie",
  );
}

export function result() {
  if (runtime.state.stage !== LAST_STAGE) return;
  const score = Math.max(60, 100 - runtime.state.mistakes * 5);
  const title = endingTitle(runtime.state.recoveries, runtime.state.mistakes);
  const collected = floors.filter(floor => runtime.state.learnedTerms.includes(floor.term)).length;
  const collectionTitle = collected === floors.length ? "캐비닛 수집왕"
    : collected >= Math.ceil(floors.length / 2) ? "청사 기록가" : collected > 0 ? "서류 탐색가" : "수집 준비생";
  const note = title === "사파"
    ? "달달 주무관, 여러 번 초안을 다시 펼쳤지요. 잘못 적은 곳을 짚어 내고 끝까지 바로잡는 끈기, 그게 자네의 장점이에요."
    : title === "정파" ? "달달 주무관, 처음부터 끝까지 근거를 확인했네요. 다음에 어려운 의뢰가 와도 오늘처럼 차근차근 살펴봐요."
    : "달달 주무관, 실수를 알아차리고 돌아가 고친 순간을 기억해요. 다음 의뢰에서는 그 부분부터 눈에 들어올 거예요.";
  show(
    title,
    /* HTML */ `<div class="level-up-tag">업무 완료</div>
      <div class="level-up-hero">
        ${face(rookieOutfit())}<strong>최종 Lv. ${levelProgress().level}</strong>
      </div>
      <section class="mentor-assessment" aria-label="선배의 인물평"><h3>김주문의 인물평</h3>
        <p>${note}</p>
        <p class="collection-award"><strong>${collectionTitle}</strong> · 캐비닛 카드 ${collected}/${floors.length}장</p>
        <p class="note-signed">구매팀 선배 김주문 씀</p></section>
      <p class="center">총 ${runtime.state.xp} XP</p>
      <p class="center">이제 나도... 조달의 왕이야!</p>
      <a class="ending-link" href="${MORE_QUESTS}" target="_blank" rel="noopener noreferrer"
        >더 많은 퀘스트를 깨고 싶다면?</a
      >
      <section class="achievements" aria-label="획득한 업적"><h3>획득한 업적</h3><ul>
        <li>여섯 업무 완주 · 계약부터 대금 지급까지</li>
        ${runtime.state.recoveries.length===0 && runtime.state.mistakes===0 ? '<li>정파 · 모든 선택을 올바른 절차로 완료</li>' : `<li>${Math.max(runtime.state.recoveries.length,runtime.state.mistakes)>=3?'사파 · 수습 달인':'수습을 배운 신입'} · ${runtime.state.recoveries.length}개 수습 완료</li>`}
        ${runtime.state.mistakes>runtime.state.recoveries.length?`<li>이전 선택 확인 기록 · ${runtime.state.mistakes-runtime.state.recoveries.length}회</li>`:""}
        ${runtime.state.recoveries.map(id=>`<li>${recoveryScenes[id].title}</li>`).join('')}
        </ul><p>칭호 기준 : 수습 0개는 정파, 1~2개는 정파 · 수습을 배운 신입, 3개 이상은 사파예요. 수습은 잘못된 초안을 고치고 공식 절차를 마친 기록이에요. 이전 저장은 기존 오답 횟수도 칭호에 반영해요.</p></section>
      <div class="stats">
        <div class="stat"><strong>6 / 6</strong><small>퀘스트</small></div>
        <div class="stat"><strong>7 / 7</strong><small>획득한 물건</small></div>
        <div class="stat"><strong>${score}</strong><small>학습 점수</small></div>
      </div>
      <details class="ending-review" open><summary>여섯 업무에서 배운 것</summary>${learningReview()}</details>
      <p class="source-note">공공조달 체험 게임 · 실제 업무와 다를 수 있습니다</p>
      ${buttons([
        ["close", "사무실로 돌아가기"],
        ["restart", "다시 플레이", true],
      ])}`,
    "result",
  );
}
