import { player, runtime } from "../core/runtime.js";
import { TILE } from "../data/world.js";
import { speak } from "./dialogue.js";
import { buttons, show } from "./modal.js";
import { face } from "../world/characters.js";

export const MORE_QUESTS = "https://www.pps.go.kr/kor/bbs/list.do?key=00645";

export function ending() {
  player.x = 14.5 * TILE;
  player.y = 4.5 * TILE;
  speak(
    "조달달",
    [
      "빈칸을 확인하고, 공정한 기준을 세우고, 함께 검토하니 기업의 참여까지 이어졌어. 혼자 서두르는 것보다 중요한 게 있었구나!",
      "이제 나도... 조달의 왕이야!",
    ],
    result,
    "rookie",
  );
}

export function result() {
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
        <div class="stat"><strong>4 / 4</strong><small>퀘스트</small></div>
        <div class="stat"><strong>5 / 5</strong><small>획득한 물건</small></div>
        <div class="stat"><strong>${score}</strong><small>학습 점수</small></div>
      </div>
      <div class="success">모의 입찰서 접수 완료. 낙찰·계약 체결은 아직 진행하지 않았습니다.</div>
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
