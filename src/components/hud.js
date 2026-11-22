import { LAST_STAGE, questNames, quests } from "../data/quests.js";
import { floors, spots } from "../data/world.js";
import { guideTarget } from "../world/navigation.js";
import { runtime } from "../core/runtime.js";
import { $ } from "../core/dom.js";
import { nextTarget } from "../game/quests.js";
import { renderGlossary } from "./learning.js";
import { renderInventory } from "./inventory.js";

export function render() {
  const q = quests[runtime.state.stage];
  $("steps").innerHTML = questNames
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
  $("quest-count").textContent = runtime.state.stage + " / " + LAST_STAGE;
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
                [false, "입찰서 제출"],
              ]
            : runtime.state.stage === 4
              ? [[runtime.state.awardBrief, "2층 계약 담당자에게 설명 듣기"], [runtime.state.openingChecked, "입찰 전 결정한 예정가격 확인"], [false, "선정방식에 따른 심사 확인 후 전자계약"]]
              : runtime.state.stage === 5
                ? [[runtime.state.deliveryIssueReported, "5층에서 납품 부족분 보완 요청"], [runtime.state.inspectionChecked, "보완한 물품의 검사·검수와 인수"], [false, "영수증·납품 서류 확인 후 대금 지급"]]
                : [
                [true, "요청서 확인"],
                [true, "규격 수정 및 공고"],
                [true, "기업 입찰 참여"],
                [true, "계약·납품·대금 지급"],
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
    runtime.state.stage === 3 ? "새봄테크 영업팀" : floors[runtime.floor].caption;
  $("player-label").textContent =
    runtime.state.stage === 3 ? "욘 대리 · 기업 담당자" : "조달달 · 신입 9급 주무관";
  $("spot-doc").textContent =
    runtime.state.stage === 3
      ? "제품 자료 · 내 책상"
      : runtime.state.stage === 1
        ? "규격서 · 내 책상"
        : "요청서 · 내 책상";
  const target = guideTarget(nextTarget());
  for (const id of Object.keys(spots))
    $("spot-" + id).classList.toggle("target", target === id);
  $("guide-button").textContent = runtime.state.stage === LAST_STAGE ? "완료 기록 보기" : target === "elevator" ? "엘리베이터로 이동" : "다음 목표로 이동";
  $("quest-label").textContent = runtime.state.stage === LAST_STAGE ? "완료" : `퀘스트 ${runtime.state.stage + 1}`;
  const goalLabels = { mentor: runtime.state.stage === 2 ? "김주문에게 공고 초안 보여 주기" : "김주문에게 업무 듣기", phone: runtime.state.stage === 5 ? "5층 · 납품 자료 확인" : "수요기관에 연락", doc: runtime.state.stage === 3 ? "공고에 맞는 제품 고르기" : "내 책상 자료 확인", terminal: runtime.state.stage === 5 ? "5층 · 대금 청구 확인" : "업무용 모니터 사용", officer: runtime.state.stage === 5 ? "2층 · 계약 담당자와 인사하기" : "2층 · 계약 담당자 만나기", bidroom: "2층 · 개찰·계약 자료 확인", result: "완료 기록 다시 보기" };
  $("current-goal").textContent = goalLabels[nextTarget()];
  $("quick-guide").textContent = $("guide-button").textContent;
  renderInventory();
  renderGlossary();
  if (!runtime.storageOK) $("save-status").textContent = "저장할 수 없어요. 이 창에서 계속 플레이할 수 있어요.";
}

export function setNotebook(open) {
  $("quest-panel").hidden = !open;
  $("quest-toggle").setAttribute("aria-expanded", String(open));
}
