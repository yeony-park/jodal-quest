import { runtime } from "../core/runtime.js";
import { inventoryItems, itemIcon, ownedItems, renderInventory } from "../components/inventory.js";
import { buttons, close, show } from "../components/modal.js";
import { $ } from "../core/dom.js";

export const submissionSteps = {
  intake: { item: 1, target: "doc", stage: 0 },
  specification: { item: 2, target: "doc", stage: 1 },
  notice: { item: 2, target: "terminal", stage: 2 },
  approval: { item: 2, target: "mentor", stage: 2 },
  product: { item: 3, target: "doc", stage: 3 },
  bid: { item: 3, target: "terminal", stage: 3 },
  award: { item: 4, target: "officer", stage: 4 },
  price: { item: 4, target: "bidroom", stage: 4 },
  contract: { item: 4, target: "officer", stage: 4 },
  delivery: { item: 5, target: "phone", stage: 5 },
  payment: { item: 5, target: "terminal", stage: 5 },
};

export function submissionStep(target) {
  const s=runtime.state;
  if (s.stage===0 && s.brief && s.contact && target==='doc') return 'intake';
  if (s.stage===1 && s.specAdvice && target==='doc') return 'specification';
  if (s.stage===2 && target==='terminal' && !s.noticeChecked) return 'notice';
  if (s.stage===2 && target==='mentor' && s.noticeChecked) return 'approval';
  if (s.stage===3 && target==='doc' && !s.product) return 'product';
  if (s.stage===3 && target==='terminal' && s.product) return 'bid';
  if (s.stage===4 && target==='officer') return s.openingChecked ? 'contract' : !s.awardBrief ? 'award' : null;
  if (s.stage===4 && target==='bidroom' && s.awardBrief && !s.openingChecked) return 'price';
  if (s.stage===5 && target==='phone' && !s.inspectionChecked) return 'delivery';
  if (s.stage===5 && target==='terminal' && s.inspectionChecked) return 'payment';
  return null;
}

export function matchesSubmission(step, item) {
  return submissionSteps[step]?.item === item;
}

export function requestSubmission(target, onSubmit) {
  const step=submissionStep(target);
  if (!step || runtime.submittedSteps.has(step)) { onSubmit(); return; }
  const owned=ownedItems(), expected=inventoryItems[submissionSteps[step].item].name;
  show("가방에서 서류를 제출해 주세요", `<p>담당자 : 이번 업무의 ${expected}를 보여 주세요.</p>
    <p id="submission-hint" role="status">가방의 물건을 눌러 제출하세요.</p>
    <div class="submission-bag" aria-label="제출할 가방 물건">${inventoryItems.map((item,i)=>
      `<button class="inventory-slot ${owned[i]?'owned':''}" data-action="item-${i}" ${owned[i]?'':'disabled'} aria-label="${owned[i]?item.name:'아직 없는 '+item.name}">${owned[i]?itemIcon(i):''}<span class="slot-name">${item.name}</span></button>`).join('')}</div>
    ${buttons([["close","서류를 나중에 제출하기",true]])}`, "submission");
  runtime.pendingSubmission={step,onSubmit};
  renderInventory();
}

export function submitItem(item) {
  const pending=runtime.pendingSubmission;
  if (!pending || runtime.modalKind!=="submission") return false;
  if (!matchesSubmission(pending.step,item) || !ownedItems()[item]) {
    const name=inventoryItems[submissionSteps[pending.step].item].name;
    $("submission-hint").textContent=`김주문 : 지금은 ${name}에 적힌 내용을 대조할 차례예요. 가방에서 다시 찾아봐요.`;
    return false;
  }
  runtime.submittedSteps.add(pending.step);
  runtime.pendingSubmission=null;
  close();
  renderInventory();
  pending.onSubmit();
  return true;
}
