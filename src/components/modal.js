import { $ } from "../core/dom.js";
import { keys, runtime } from "../core/runtime.js";
import { stopSounds } from "../audio/sound.js";
import { setNotebook } from "./hud.js";

export function toast(t) {
  $("toast").textContent = t;
  $("toast").hidden = false;
  clearTimeout(runtime.toastTimer);
  runtime.toastTimer = setTimeout(() => ($("toast").hidden = true), 3000);
}

export function show(title, body, kind = "", closable = true) {
  stopSounds();
  setNotebook(false);
  $("game-shell").inert = true;
  keys.clear();
  runtime.target = null;
  runtime.lastFocus = document.activeElement;
  runtime.modalOpen = true;
  runtime.modalKind = kind;
  $("modal").classList.toggle("portal-modal", kind === "portal");
  $("modal").innerHTML =
    `${closable ? '<button class="close" data-action="close" aria-label="닫기">×</button>' : ""}<div class="eyebrow">${runtime.state.stage === 3 ? "SUPPLIER SIDE" : "PROCUREMENT QUEST"}</div><h2 id="modal-title">${title}</h2>${body}`;
  $("overlay").hidden = false;
  $("modal").scrollTop = 0;
  $("modal").focus();
}

export function close() {
  runtime.pendingSubmission=null;
  $("bag").classList.remove("submission-active");
  stopSounds();
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
    <div class="doc-header"><strong>${title}</strong><small>게임용 가상 문서</small></div>
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
        <strong>사운드:</strong> 소리 버튼에서 마스터 음량을 조절하거나 두 녹음 목소리를 들어 볼 수
        있어요. 대화 중 소리 버튼을 누르면 음소거를 전환합니다.
      </p>
      <p>
        <strong>이동:</strong> 방향키 또는 WASD, 휴대전화에서는 이동 버튼을 길게 눌러 걸어요. 가까운 대상과 Space 또는 E로 상호작용합니다. 대상
        이름을 클릭·터치하면 자동으로 이동해 대화합니다.
      </p>
      <p>
        <strong>다음 목표로 이동:</strong> 현재 해야 할 일을 바로 찾아갑니다. 다른 층의 목표는 엘리베이터로 안내해요. 용어 수첩에서 배운 말을 다시 읽어 보세요. 잘못 선택하면 결과를
        확인하고 수습 업무로 올바른 절차를 배웁니다.
      </p>
      <p>
        <strong>인벤토리:</strong> 하단 7칸에 사원증과 업무 문서가 쌓입니다. 제출 요청이 뜨면
        가방의 서류를 눌러 제출하세요. 다른 서류를 내면 힌트를 받고 다시 고릅니다.
      </p>
      <p>
        <strong>업무용 모니터:</strong> 모니터를 사용할 때만 나라장터 체험 화면이 열립니다. 초안
        저장 후에는 사무실로 돌아와 선배에게 검토를 요청하세요.
      </p>
      <p>
        <strong>공간:</strong> 조달청 본청 5층과 3층 배치를 참고한 가상 지방청입니다. 엘리베이터로 층을 옮겨요.
        기업 단계는 별도 사무실로 전환하며 공간 배치는 체험을 위해 재사용합니다.
      </p>
      <p>
        <strong>저장:</strong> 같은 브라우저·같은 주소에서 진행 상황이 자동 저장됩니다. 시크릿
        모드나 저장 제한 환경에서는 이어하기가 제한됩니다.
      </p>
      <p>
        <strong>업무 범위:</strong> 요청 접수 → 규격 검토 → 공고 → 기업 입찰 참여 → 낙찰자 선정·전자계약 → 검사·검수·대금 지급을 체험해요. 심사 세부 내용과 대기 시간은 줄였어요.
      </p>
      <p>
        원자료:
        <a href="https://www.pps.go.kr/kor/content.do?key=00179" target="_blank" rel="noopener"
          >조달청 총액계약 업무처리절차</a
        >
        (확인 2026-11-21). 금액·품목·납기·기업·규격은 게임용 창작입니다.
      </p>
      ${buttons([["close", "게임으로 돌아가기"]])}`,
    "help",
  );
}
