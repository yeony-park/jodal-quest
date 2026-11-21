import { learningReview } from "./learning.js";
import { LAST_STAGE } from "../data/quests.js";
import { player, runtime } from "../core/runtime.js";
import { TILE } from "../data/world.js";
import { speak } from "./dialogue.js";
import { buttons, show } from "./modal.js";
import { face } from "../world/characters.js";

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
  show(
    "이제 나도... 조달의 왕이야!",
    /* HTML */ `<div class="level-up-tag">LEVEL UP!</div>
      <div class="level-up-hero">
        ${face("rookie")}<strong>Lv. 1 <span>〉</span> Lv. 2</strong>
      </div>
      <div class="level-progress"><i></i></div>
      <p class="center">첫 의뢰 완료 · 조달의 왕을 향한 첫걸음</p>
      <div class="stats">
        <div class="stat"><strong>6 / 6</strong><small>퀘스트</small></div>
        <div class="stat"><strong>7 / 7</strong><small>획득한 물건</small></div>
        <div class="stat"><strong>${score}</strong><small>학습 점수</small></div>
      </div>
      <div class="success">가상 구매 완료 · 입찰서 접수 → 심사 확인·전자계약 → 검사·검수 → 대금 지급</div>
      <details class="ending-review" open><summary>여섯 업무에서 배운 것</summary>${learningReview()}</details>
      <a class="ending-link" href="${MORE_QUESTS}" target="_blank" rel="noopener noreferrer"
        >더 많은 퀘스트를 깨고 싶다면?</a
      >
      <p class="ending-destination">조달청 채용정보로 이동합니다 · 외부 사이트</p>
      ${buttons([
        ["close", "사무실로 돌아가기"],
        ["restart", "다시 플레이", true],
      ])}`,
    "result",
  );
}
