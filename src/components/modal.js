import { $ } from "../core/dom.js";
import { keys, runtime } from "../core/runtime.js";
import { stopVoices } from "../audio/sound.js";
import { setNotebook } from "./hud.js";

export function toast(t) {
  $("toast").textContent = t;
  $("toast").hidden = false;
  clearTimeout(runtime.toastTimer);
  runtime.toastTimer = setTimeout(() => ($("toast").hidden = true), 3000);
}

function returnBag() {
  if (runtime.modalKind !== "submission") return;
  $("game-hud").prepend($("bag"));
  runtime.pendingSubmission = null;
  $("bag").classList.remove("submission-active");
  for (const slot of $("inventory-slots").querySelectorAll("button")) {
    slot.disabled = false;
    slot.draggable = false;
    slot.removeAttribute("aria-pressed");
  }
}

export function show(title, body, kind = "", closable = true) {
  returnBag();
  stopVoices();
  setNotebook(false);
  $("game-shell").inert = true;
  keys.clear();
  runtime.target = null;
  if (!runtime.modalOpen) runtime.lastFocus = document.activeElement;
  runtime.modalOpen = true;
  runtime.modalKind = kind;
  $("modal").classList.toggle("portal-modal", kind === "portal");
  $("modal").innerHTML =
    `${closable ? '<button class="close" data-action="close" aria-label="닫기">×</button>' : ""}<h2 id="modal-title">${title}</h2>${body}`;
  $("overlay").hidden = false;
  $("modal").scrollTop = 0;
  $("modal").focus();
}

export function close() {
  returnBag();
  stopVoices();
  $("game-shell").inert = runtime.titleVisible;
  runtime.modalOpen = false;
  $("overlay").hidden = true;
  runtime.modalKind = "";
  if (runtime.lastFocus && runtime.lastFocus.isConnected) runtime.lastFocus.focus();
}

export function buttons(items) {
  return /* HTML */ `<div class="actions">
    ${items.map(([a, t, secondary]) => /* HTML */ `<button class="${secondary ? "secondary" : "primary"}" data-action="${a}">${t}</button>`).join("")}
  </div>`;
}

export function doc(title, rows) {
  return /* HTML */ `<div class="document">
    <div class="doc-header"><strong>${title}</strong></div>
    ${rows.map(([a, b]) => /* HTML */ `<div class="row"><span>${a}</span><b>${b}</b></div>`).join("")}
  </div>`;
}

export function help() {
  show(
    "조달달의 업무 수첩",
    /* HTML */ `<p>
        <strong>대화:</strong> 스페이스바 한 번으로 현재 문장을 모두 보고, 다시 누르면 다음 말로
        넘어갑니다. 화면의 Space 버튼도 누를 수 있어요.
      </p>
      <p>
        <strong>퀘스트:</strong> 오른쪽 위 버튼 또는 Q로 김주문의 줄노트를 펼칩니다. 퀘스트를 완료할
        때마다 브라우저에 저장합니다.
      </p>
      <p>
        <strong>사운드:</strong> 소리 버튼에서 캐릭터 대화소리, 배경음악, 효과음을 각각 켜고 끌 수 있어요.
        배경음악 음량은 0부터 100까지 조절할 수 있어요.
      </p>
      <p>
        <strong>이동:</strong> 방향키나 WASD, 화면 방향 버튼을 길게 누르면 걸어요. 같은 방향을 두 번 누르고 있으면 달려요. 가까운 대상과 Space 또는 E로 상호작용합니다. 대상
        이름을 클릭·터치하면 자동으로 이동해 대화합니다.
      </p>
      <p>
        <strong>다음 목표 안내:</strong> 현재 해야 할 일을 바로 찾아갑니다. 다른 층 목표는 엘리베이터로 안내해요. 용어 수첩에서 배운 말도 다시 읽어 보세요. 잘못 고르면 결과를 확인한 뒤 수습 업무로 올바른 절차를 배웁니다.
      </p>
      <p>
        <strong>인벤토리:</strong> 아래 가방에 사원증과 업무 서류가 쌓여요. 필요한 서류를 끌어 놓거나, 가방에서 고른 뒤 놓을 곳을 눌러 주세요.
      </p>
      <p>
        <strong>업무용 모니터:</strong> 모니터를 사용할 때만 나라장터 체험 화면이 열립니다. 초안
        저장 후에는 사무실로 돌아와 선배에게 검토를 요청하세요.
      </p>
      <p>
        <strong>공간:</strong> 미니맵 오른쪽 위에서 층별 지도를 열 수 있어요. 층마다 캐비닛을 찾아보세요. 7층 도서실에서는 문다은에게 용어 카드를 받을 수 있어요.
      </p>
      <p>
        <strong>저장:</strong> 같은 브라우저·같은 주소에서 진행 상황이 자동 저장돼요. 시크릿 모드나 저장 제한 환경에선 이어하기가 안 될 수 있어요.
      </p>
      <p>
        <strong>업무 범위:</strong> 요청 접수 → 규격 검토 → 공고 → 기업 입찰 참여 → 낙찰자 선정·전자계약 → 검사·검수·대금 지급을 체험해요.
      </p>
      <p>
        참고 자료:
        <a href="https://www.pps.go.kr/kor/content.do?key=00179" target="_blank" rel="noopener"
          >조달청 총액계약 업무처리절차</a
        >
        (2026년 11월 21일 기준) 금액·품목·납기·기업·규격은 게임 체험을 위해 가상으로 설정했습니다.
      </p>
      `,
    "help",
  );
}
