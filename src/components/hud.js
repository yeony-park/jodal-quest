import { quests } from "../data/quests.js";
import { runtime } from "../core/runtime.js";
import { $ } from "../core/dom.js";
import { nextTarget } from "../game/quests.js";
import { renderInventory } from "./inventory.js";

export function render() {
  const q = quests[runtime.state.stage];
  $("steps").innerHTML = ["요청서 접수", "규격 검토", "입찰 공고", "기업 입찰 참여"]
    .map(
      (n, i) =>
        /* HTML */ `<div
          class="step ${i < runtime.state.stage ? "done" : i === runtime.state.stage ? "active" : ""}"
          ${i === runtime.state.stage ? 'aria-current="step"' : ""}
        >
          <span class="num">${i < runtime.state.stage ? "✓" : String(i + 1).padStart(2, "0")}</span>
          <div>
            <strong>${n}</strong
            ><small
              >${i < runtime.state.stage ? "완료" : i === runtime.state.stage ? "진행 중" : "다음 퀘스트"}</small
            >
          </div>
        </div>`,
    )
    .join("");
  $("quest-title").textContent = q.title;
  $("quest-desc").textContent = q.desc;
  $("memo").textContent = q.memo;
  $("quest-count").textContent = runtime.state.stage + " / 4";
  const tasks =
    runtime.state.stage === 0
      ? [
          [runtime.state.brief, "선배에게 첫 업무 듣기"],
          [runtime.state.contact, "수요기관에 납기 확인"],
          [false, "요청서 검토 및 접수 준비"],
        ]
      : runtime.state.stage === 1
        ? [
            [runtime.state.specAdvice, "선배에게 규격 검토 조언 듣기"],
            [false, "규격 수정안 작성"],
          ]
        : runtime.state.stage === 2
          ? [
              [runtime.state.noticeChecked, "공고 초안 수량 대조"],
              [false, "선배 검토 및 결재 절차"],
            ]
          : runtime.state.stage === 3
            ? [
                [runtime.state.product, "공고에 맞는 제품 선택"],
                [runtime.state.eligibility, "참가 조건 확인"],
                [false, "모의 입찰서 제출"],
              ]
            : [
                [true, "요청서 확인"],
                [true, "규격 수정 및 공고"],
                [true, "기업 입찰 참여"],
              ];
  $("todos").innerHTML = tasks
    .map(
      ([ok, t]) =>
        /* HTML */ `<li class="${ok ? "checked" : ""}">
          <span class="check">${ok ? "✓" : ""}</span>${t}
        </li>`,
    )
    .join("");
  $("location").textContent =
    runtime.state.stage === 3 ? "새봄테크 · 영업팀 사무실" : "새봄지방조달청 · 구매팀";
  $("player-label").textContent =
    runtime.state.stage === 3 ? "욘 대리 · 기업 담당자" : "플레이어 · 조달달 / 신입 9급 주무관";
  $("scene-time").textContent = [
    "DAY 01 · 09:00",
    "DAY 01 · 10:00",
    "공고 준비 · 시간 축약",
    "입찰 참여 · 시간 축약",
    "EPISODE CLEAR",
  ][runtime.state.stage];
  $("spot-doc").textContent =
    runtime.state.stage === 3
      ? "제품 자료 · 내 책상"
      : runtime.state.stage === 1
        ? "규격서 · 내 책상"
        : "요청서 · 내 책상";
  $("spot-mentor").hidden = runtime.state.stage === 3;
  $("spot-phone").hidden = runtime.state.stage === 3;
  $("spot-supplier").hidden = runtime.state.stage === 3;
  $("spot-terminal").textContent = runtime.state.stage === 3 ? "업무용 모니터" : "업무용 모니터";
  ["doc", "mentor", "phone", "terminal"].forEach((id) =>
    $("spot-" + id).classList.toggle("target", nextTarget() === id),
  );
  $("guide-button").textContent = runtime.state.stage === 4 ? "완료 기록 보기" : "다음 목표로 이동";
  $("quest-label").textContent =
    runtime.state.stage === 4 ? "완료" : `퀘스트 ${runtime.state.stage + 1}`;
  renderInventory();
  if (!runtime.storageOK) $("save-status").textContent = "저장 불가 · 현재 창에서 계속";
}

export function setNotebook(open) {
  $("quest-panel").hidden = !open;
  $("quest-toggle").setAttribute("aria-expanded", String(open));
}
