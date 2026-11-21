import { recoveryScenes } from "../data/recovery.js";
import { fresh } from "../data/initial-state.js";
import { LAST_STAGE } from "../data/quests.js";
import { runtime } from "./runtime.js";
import { $ } from "./dom.js";

export const KEY = "jodal-master-v1";

export function loadGame() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (
      s &&
      s.version === 1 &&
      (s.recoveries === undefined || (
        Array.isArray(s.recoveries) &&
        s.recoveries.length <= Object.keys(recoveryScenes).length &&
        s.recoveries.every(id => typeof id === "string" && Object.hasOwn(recoveryScenes,id)) &&
        new Set(s.recoveries).size === s.recoveries.length
      )) &&
      (s.pendingRecovery === undefined || s.pendingRecovery === null || (
        typeof s.pendingRecovery === "string" &&
        Object.hasOwn(recoveryScenes,s.pendingRecovery) &&
        recoveryScenes[s.pendingRecovery].stage === s.stage
      )) &&
      (s.xp === undefined || (Number.isInteger(s.xp) && s.xp >= s.stage * 100 && s.xp <= s.stage * 125 && s.xp % 25 === 0)) &&
      (s.questMistakes === undefined || (Number.isInteger(s.questMistakes) && s.questMistakes >= 0 && s.questMistakes <= s.mistakes)) &&
      Number.isInteger(s.stage) &&
      s.stage >= 0 &&
      s.stage <= LAST_STAGE &&
      (s.floor === undefined || s.floor === 0 || s.floor === 1) &&
      ["contractFarewell", "awardBrief", "openingChecked", "deliveryIssueReported", "inspectionChecked"].every(
        (k) => s[k] === undefined || typeof s[k] === "boolean",
      ) &&
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
      runtime.state = { ...fresh(), ...s, xp: s.xp ?? s.stage * 100, questMistakes: s.questMistakes ?? s.mistakes };
      runtime.floor = s.stage === 3 ? 0 : runtime.state.floor;
      runtime.state.floor = runtime.floor;
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
