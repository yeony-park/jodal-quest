import { runtime } from "./runtime.js";
import { $ } from "./dom.js";

export const KEY = "jodal-master-v1";

export function loadGame() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (
      s &&
      s.version === 1 &&
      Number.isInteger(s.stage) &&
      s.stage >= 0 &&
      s.stage <= 4 &&
      [
        "started",
        "brief",
        "contact",
        "specAdvice",
        "noticeChecked",
        "product",
        "eligibility",
      ].every((k) => typeof s[k] === "boolean") &&
      Number.isInteger(s.mistakes) &&
      s.mistakes >= 0 &&
      Array.isArray(s.history) &&
      s.history.every((x) => typeof x === "string")
    ) {
      runtime.state = s;
      runtime.loaded = s.started;
    }
  } catch (e) {
    runtime.storageOK = false;
  }
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(runtime.state));
    runtime.storageOK = true;
    $("save-status").textContent = "✓ 자동 저장됨";
  } catch (e) {
    runtime.storageOK = false;
    $("save-status").textContent = "저장 불가 · 현재 창에서 계속";
  }
}
