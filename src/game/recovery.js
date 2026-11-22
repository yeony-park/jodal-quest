import { face } from "../world/characters.js";
import { recoveryScenes } from "../data/recovery.js";
import { runtime } from "../core/runtime.js";
import { save } from "../core/storage.js";
import { buttons, show } from "../components/modal.js";
import { speak } from "../components/dialogue.js";
import { learnTerm } from "../components/learning.js";
import { actions } from "./actions.js";

function supervisor(stage) {
  if (stage === 3) return {name: "새봄테크 팀장", role: "reviewer"};
  if (stage === 4) return {name: "이계약 주무관", role: "officer"};
  return {name: "김주문 선배", role: "mentor"};
}

export function showRecovery(id=runtime.state.pendingRecovery) {
  const scene=recoveryScenes[id];
  if (!scene || scene.stage!==runtime.state.stage) return;
  const {name, role} = supervisor(scene.stage);
  const days = runtime.state.attemptedDeadline;
  const reaction = id === "intake" && Number.isInteger(days)
    ? `${days}일이요? 사서님이 부탁한 기한과 다르잖아요. 이대로 보내면 도서관에서 제때 못 받아요.`
    : scene.reaction;
  show("그런 선택을..?!", `<section class="decision-scene decision-impact">
    <figure class="decision-actor">${face(role)}<figcaption>${name}</figcaption></figure>
    <div class="decision-turn"><p class="decision-thought">${reaction}</p>
      <p>${scene.consequence}</p>${buttons([["recover", "다음"]])}</div>
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
  const {name, role} = supervisor(scene.stage);
  const address = scene.stage === 3 ? "욘 대리" : "조달달 주무관";
  speak(name, [`${address}, 실수할 수도 있죠. 이번엔 제가 할게요. 다음부터는 보내기 전에 한 번 더 확인해요.`, scene.correction], () => {
    const term = { intake: "수요기관", "spec-brand": "규격", "spec-empty": "규격", notice: "구매결의",
      opening: "예정가격", contract: "낙찰자 선정·전자계약", delivery: "검사·검수", payment: "대금 청구" }[runtime.state.pendingRecovery];
    if (term) learnTerm(term);
    show("선배가 처리했어요", `<p>${scene.title} · 이번 퀘스트 0 XP</p>
      <p class="source-note"><a href="https://www.pps.go.kr/kor/content.do?key=00179" target="_blank" rel="noopener">${scene.source}</a></p>
      ${buttons([["recover-finish","다음으로"]])}`, "recovery", false);
  }, role);
}

export function finishRecovery() {
  const id=runtime.state.pendingRecovery, scene=recoveryScenes[id];
  if (!scene || scene.stage!==runtime.state.stage) return;
  if (id === "intake") {
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
