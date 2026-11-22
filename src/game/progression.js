import { questFanfare } from "../audio/sound.js";
import { recoveryScenes } from "../data/recovery.js";
import { runtime } from "../core/runtime.js";
import { toast } from "../components/modal.js";

export const XP_PER_QUEST = 100;
export const CLEAN_BONUS = 25;
export const XP_PER_LEVEL = 150;

export function levelProgress(xp = runtime.state.xp) {
  return { level: 1 + Math.floor(xp / XP_PER_LEVEL), current: xp % XP_PER_LEVEL, next: XP_PER_LEVEL };
}

export function awardQuestXP() {
  const previous = levelProgress().level;
  const clean = runtime.state.mistakes === runtime.state.questMistakes &&
    !runtime.state.recoveries.some(id => recoveryScenes[id].stage === runtime.state.stage) && !runtime.state.pendingRecovery;
  if (clean) runtime.state.xp += XP_PER_QUEST + CLEAN_BONUS;
  runtime.state.questMistakes = runtime.state.mistakes;
  const level = levelProgress().level;
  runtime.lastXP = clean ? `${XP_PER_QUEST} XP + 수습 없이 완료 보너스 ${CLEAN_BONUS} XP${level > previous ? ` · 레벨 업! Lv. ${level}` : ""}` : "선배가 처리한 업무 · 0 XP";
  toast(runtime.lastXP);
  questFanfare();
}

export function xpReward() {
  return `<p class="xp-reward" role="status">${runtime.lastXP || ""}</p>`;
}
