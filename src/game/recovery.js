import { recoveryScenes } from "../data/recovery.js";
import { runtime } from "../core/runtime.js";
import { save } from "../core/storage.js";
import { buttons, show } from "../components/modal.js";
import { speak } from "../components/dialogue.js";
import { learnTerm } from "../components/learning.js";
import { actions } from "./actions.js";

export function showRecovery(id=runtime.state.pendingRecovery) {
  const scene=recoveryScenes[id];
  if (!scene || scene.stage!==runtime.state.stage) return;
  show(scene.title, `<div class="alert">${scene.consequence}</div>
    <p>조달달 : 초안에서 발견했으니 근거를 확인하고 수습할게요.</p>
    ${buttons([["recover","수습 절차 확인"]])}`, "recovery", false);
}

export function beginRecovery(id) {
  const scene=recoveryScenes[id];
  if (!scene || scene.stage!==runtime.state.stage || runtime.state.pendingRecovery) return;
  runtime.state.mistakes++;
  runtime.state.pendingRecovery=id;
  save();
  showRecovery(id);
}

export function recover() {
  const scene=recoveryScenes[runtime.state.pendingRecovery];
  if (!scene || scene.stage!==runtime.state.stage) return;
  speak("조달달", ["기록을 바로잡고 올바른 절차로 이어갈게요."], () => {
    const term = { intake: "수요기관", "spec-brand": "규격", "spec-empty": "규격", notice: "구매결의",
      opening: "예정가격", contract: "낙찰자 선정·전자계약", delivery: "검사·검수", payment: "대금 청구" }[runtime.state.pendingRecovery];
    if (term) learnTerm(term);
    show("수습 업무 · " + scene.title, `<p>${scene.correction}</p>
      <p class="source-note">근거 : 조달청 총액계약 업무처리절차 · ${scene.source} · <a href="https://www.pps.go.kr/kor/content.do?key=00179" target="_blank" rel="noopener">원문</a></p>
      ${buttons([["recover-finish",scene.button]])}`, "recovery", false);
  }, "rookie");
}

export function finishRecovery() {
  const id=runtime.state.pendingRecovery, scene=recoveryScenes[id];
  if (!scene || scene.stage!==runtime.state.stage) return;
  if (id==='intake') { runtime.state.brief=true; runtime.state.contact=true; }
  if (id.startsWith('spec-')) runtime.state.specAdvice=true;
  if (!runtime.state.recoveries.includes(id)) runtime.state.recoveries.push(id);
  runtime.state.pendingRecovery=null;
  save();
  actions[scene.action]();
}
