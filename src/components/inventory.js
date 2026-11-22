import { levelProgress } from "../game/progression.js";
import { runtime } from "../core/runtime.js";
import { $ } from "../core/dom.js";
import { buttons, show, toast } from "./modal.js";

export const inventoryItems = [
  {
    name: "사원증",
    description:
      "새봄지방조달청 신입 9급 주무관 조달달의 사원증. 김주문에게 첫 업무를 받은 증표입니다.",
    color: "#72a3ad",
  },
  {
    name: "요청서",
    description:
      "수요기관에 확인한 납기와 장소를 보완한 요청서. 모니터 20대, 계약일로부터 30일 이내입니다.",
    color: "#bd9f64",
  },
  {
    name: "규격서",
    description:
      "수요기관과 협의하고 선배가 검토한 성능 중심 규격서. 24형 이상, FHD 이상, HDMI 연결입니다.",
    color: "#789c72",
  },
  {
    name: "공고문",
    description: "담당자 검토·결재 후 게시된 모의 공고문. 수량은 요청서와 같은 20대입니다.",
    color: "#728dc3",
  },
  {
    name: "접수증",
    description: "새봄테크의 모의 입찰서가 접수되었습니다. 제출은 낙찰이나 계약 체결이 아닙니다.",
    color: "#b686b7",
  },
  {
    name: "계약서",
    description: "공고한 선정방식에 따른 심사를 마치고 권한 있는 담당자가 체결한 전자계약. 모니터 20대, 계약 후 30일 이내 납품입니다.",
    color: "#c58e62",
  },
  {
    name: "완료철",
    description: "검사·검수와 물품인수, 영수증 및 납품 서류 확인을 마치고 대금 지급까지 진행한 업무 기록입니다.",
    color: "#76a395",
  },
];

export function ownedItems() {
  return inventoryItems.map((_, i) =>
    i === 0 ? runtime.state.brief || runtime.state.stage > 0 :
      i === 1 ? runtime.state.brief || runtime.state.stage >= 1 :
      i === 2 ? runtime.state.stage >= 1 : runtime.state.stage >= i,
  );
}

export function itemIcon(i) {
  const color = inventoryItems[i].color;
  return /* HTML */ `<svg viewBox="0 0 24 28" shape-rendering="crispEdges" aria-hidden="true">
    <path d="M5 2H16V5H20V26H5Z" fill="#252c30" />
    <path d="M6 3H15V7H19V25H6Z" fill="#efe3ba" />
    <path d="M7 8H18V11H7Z" fill="${color}" />
    ${i === 0 ? '<path d="M9 13H15V19H9Z" fill="#609092"/><path d="M8 21H16V23H8Z" fill="#9b987c"/>' : '<path d="M8 14H17V16H8ZM8 18H16V20H8Z" fill="#a6a18b"/>'}${i === 4 ? '<path d="M14 20H20V25H14Z" fill="#b57aa0"/>' : ""}
  </svg>`;
}

export function renderInventory() {
  const owned = ownedItems();
  $("bag").classList.toggle("submission-active", !!runtime.pendingSubmission);
  $("inventory-slots").innerHTML = inventoryItems
    .map(
      (item, i) =>
        /* HTML */ `<button
          class="inventory-slot ${owned[i] ? "owned" : ""}"
          data-action="item-${i}"
          aria-label="${i + 1}번 칸 · ${owned[i] ? item.name : "빈칸"}"
          title="${owned[i] ? item.name : "아직 얻지 못한 물건"}"
        >
          <span class="slot-number">${i + 1}</span
          >${owned[i] ? itemIcon(i) : '<span class="slot-empty">·</span>'}<span class="slot-name"
            >${owned[i] ? item.name : "빈칸"}</span
          >
        </button>`,
    )
    .join("");
  const { level, current, next } = levelProgress();
  $("level-badge").textContent = `Lv. ${level}`;
  $("xp-bar").value = current;
  $("xp-bar").max = next;
  $("xp-bar").setAttribute("aria-valuetext", `${current} / ${next} XP · 총 ${runtime.state.xp} XP`);
  $("xp-label").textContent = `${current} / ${next} XP`;
  $("xp-status").title = `총 ${runtime.state.xp} XP · 업무 완료 100 XP · 수습 없이 완료하면 25 XP 추가`;
}

export function inspectItem(i) {
  if (!ownedItems()[i]) {
    toast("퀘스트를 마치면 물건이 이 칸에 들어와요.");
    return;
  }
  show(
    inventoryItems[i].name,
    /* HTML */ `<div class="large-item">${itemIcon(i)}</div>
      <p>${i===1 && runtime.state.stage===0 ? "수요기관에 납기와 장소를 확인해 보완할 요청서 초안. 구매 물품 : 모니터 20대." : i===2 && runtime.state.stage===1 ? "성능 기준으로 수정할 규격서 초안. 선배에게 조건을 확인하세요." : inventoryItems[i].description}</p>
      ${buttons([["close", "가방 닫기"]])}`,
    "item",
  );
}
