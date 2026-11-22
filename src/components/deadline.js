import { doc } from "./modal.js";
import { runtime } from "../core/runtime.js";
import { keyClick } from "../audio/sound.js";
import { $ } from "../core/dom.js";

export function requestDoc(editable = false) {
  return doc("물품 구매 요청서", [
    ["수요기관", "새봄도서관"],
    ["구매 물품", "이용자용 모니터 20대"],
    ["배정 예산", "20,000,000원"],
    ["사용 목적", "자료실에서 문서·자료 열람"],
    [editable ? '<label for="deadline-days">납품기한</label>' : "납품기한", editable
      ? `<span class="deadline-entry">계약일로부터 <input id="deadline-days" type="text" inputmode="none"
          maxlength="32" autocomplete="off" aria-describedby="deadline-hint" required> 일 이내</span>`
      : runtime.state.stage > 0 ? "계약일로부터 30일 이내" : "미기재"],
    ["납품 장소", runtime.state.contact ? "새봄도서관 2층 자료실" : "새봄도서관"],
  ]);
}

export function deadlineForm() {
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "⌫"];
  return `<form id="deadline-form" novalidate>
    ${requestDoc(true)}
    <div class="deadline-keypad" role="group" aria-label="납품기한 숫자 키패드">
      ${keys.map(key => `<button type="button" data-deadline-key="${key}"${key === "⌫" ? ' aria-label="한 자리 지우기"' : ""}>${key}</button>`).join("")}
    </div>
    <p id="deadline-hint" role="status"></p>
    <button class="choice" type="submit">작성한 요청서를 건넨다</button>
  </form>`;
}

export function enteredDays() {
  const field = $("deadline-days");
  const match = field.value.normalize("NFKC").replace(/\s+/g, "").match(/^(?:계약(?:일(?:로부터|부터)?|후|체결후))?(\d{1,3})(?:일(?:이내)?)?$/);
  if (match && Number(match[1]) > 0) return Number(match[1]);
  deadlineHint(field.value.trim() ? "납기 칸에 일수를 숫자로 적어 주세요." : "납기 칸이 비었어요. 며칠인지 적어 주세요.");
  return null;
}

export function deadlineHint(message) {
  $("deadline-hint").textContent = message;
  $("deadline-days").setAttribute("aria-invalid", "true");
  $("deadline-days").focus();
}

export function deadlineEdited() {
  keyClick();
  $("deadline-days").removeAttribute("aria-invalid");
  $("deadline-hint").textContent = "";
}

export function pressDeadlineKey(key) {
  const field = $("deadline-days");
  let start = field.selectionStart;
  const end = field.selectionEnd;
  if (key === "⌫" && start === end) start = Math.max(0, start - 1);
  if (key === "⌫" || field.value.length - (end - start) < field.maxLength)
    field.setRangeText(key === "⌫" ? "" : key, start, end, "end");
  deadlineEdited();
  field.focus({ preventScroll: true });
}
