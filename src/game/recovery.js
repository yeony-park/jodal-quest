import { $ } from "../core/dom.js";
import { deadlineForm, deadlineHint, enteredDays } from "../components/deadline.js";
import { face } from "../world/characters.js";
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
  const supplier = scene.stage === 3;
  const officer = scene.stage === 4;
  const role = supplier ? "supplier" : officer ? "officer" : "mentor";
  const name = supplier ? "욘 대리" : officer ? "이계약 주무관" : "김주문 선배";
  const days = runtime.state.attemptedDeadline;
  const reaction = id === "intake" && Number.isInteger(days)
    ? `${days}일이요? 사서님이 부탁한 기한과 다르잖아요. 통화할 때 적은 메모를 봐요.`
    : scene.reaction;
  show("그런 선택을..?!", `<section class="decision-scene decision-impact">
    <figure class="decision-actor">${face(role)}<figcaption>${name}</figcaption></figure>
    <div class="decision-turn"><p class="decision-thought">${reaction}</p>
      <p>${scene.consequence}</p>${buttons([["recover", "서류 다시 살펴보기"]])}</div>
    </section>`, "recovery", false);
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
  const supplier = scene.stage === 3;
  speak(supplier ? "욘 대리" : "조달달", [supplier ? "다른 모델의 규격도 봐야겠어." : "아차, 제가 놓쳤네요. 다시 볼게요!"], () => {
    const term = { intake: "수요기관", "spec-brand": "규격", "spec-empty": "규격", notice: "구매결의",
      opening: "예정가격", contract: "낙찰자 선정·전자계약", delivery: "검사·검수", payment: "대금 청구" }[runtime.state.pendingRecovery];
    if (term) learnTerm(term);
    show("수습 업무 · " + scene.title, `<p>${scene.correction}</p>
      <p class="source-note">근거 : 조달청 총액계약 업무처리절차 · ${scene.source} · <a href="https://www.pps.go.kr/kor/content.do?key=00179" target="_blank" rel="noopener">원문</a></p>
      ${runtime.state.pendingRecovery === "intake" ? deadlineForm() : buttons([["recover-finish",scene.button]])}`, "recovery", false);
    if (runtime.state.pendingRecovery === "intake") $("deadline-days").focus({ preventScroll: true });
  }, supplier ? "supplier" : "rookie");
}

export function finishRecovery() {
  const id=runtime.state.pendingRecovery, scene=recoveryScenes[id];
  if (!scene || scene.stage!==runtime.state.stage) return;
  if (id === "intake") {
    const days = enteredDays();
    if (days === null) return;
    if (days !== 30) { deadlineHint("사서님이 부탁한 기한은 계약 후 30일 이내예요. 다시 적어 볼까요?"); return; }
    runtime.state.attemptedDeadline = null;
    runtime.state.brief = true;
    runtime.state.contact = true;
  }
  if (id.startsWith('spec-')) runtime.state.specAdvice=true;
  if (!runtime.state.recoveries.includes(id)) runtime.state.recoveries.push(id);
  runtime.state.pendingRecovery=null;
  save();
  actions[scene.action]();
}
