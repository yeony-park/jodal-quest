import { playPaperTurn } from "../audio/sound.js";
import { runtime } from "../core/runtime.js";
import { inventoryItems, submittedPaper, itemIcon, ownedItems, renderInventory } from "../components/inventory.js";
import { close } from "../components/modal.js";
import { $ } from "../core/dom.js";

export const submissionSteps = {
  registration: { item: 0, target: "reader" },
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
  if (target === "reader" && s.stage !== 3 && !s.badgeRegistered) return "registration";
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
  const atDesk = target === "doc" || target === "terminal" || target === "bidroom";
  const recipient = {reader: "이용자 등록 · 사원증 단말기", doc: "내 책상", terminal: "업무용 모니터", bidroom: "개찰·계약 자료실",
    mentor: "김주문", officer: "이계약 주무관", phone: "한서진 사서"}[target];
  const expectedItem = submissionSteps[step].item;
  const expected = inventoryItems[expectedItem].name;
  const verb = target === "reader" ? "사원증 찍기" : atDesk ? "펼치기" : "건네기";
  close();
  $("handoff-recipient").textContent = recipient;
  $("submission-hint").textContent = `아래 가방에서 ‘${expected}’ 칸을 눌러 주세요.`;
  $("handoff-paper").textContent = "⇣";
  $("handoff-label").textContent = "여기에 " + verb;
  $("handoff-tray").setAttribute("aria-disabled", "true");
  $("handoff-dock").hidden = false;
  runtime.pendingSubmission = {step, onSubmit, selected: null, verb, expectedItem};

  renderInventory();
}

export function selectDocument(item, dragging = false) {
  const pending = runtime.pendingSubmission;
  if (!pending || pending.delivering || !ownedItems()[item]) return;
  pending.selected = item;
  for (const slot of $("inventory-slots").querySelectorAll("button")) {
    slot.setAttribute("aria-pressed", String(slot.dataset.action === "item-" + item));
  }
  $("handoff-tray").setAttribute("aria-disabled", "false");
  $("handoff-paper").innerHTML = itemIcon(item);
  $("handoff-label").textContent = pending.step === "registration" ? pending.verb : inventoryItems[item].name + " " + pending.verb;
  $("submission-hint").textContent = pending.step === "registration"
    ? "단말기를 누르거나 사원증을 그 위로 끌어 놓으세요."
    : "오른쪽 서류 칸을 누르거나, 그곳으로 끌어 놓으세요.";
  if (!dragging) $("handoff-tray").focus({preventScroll: true});
}

export function handOverDocument(dropped = false) {
  const pending = runtime.pendingSubmission;
  if (!pending || pending.selected === null || pending.delivering) return;
  const item = pending.selected;
  if (!matchesSubmission(pending.step, item)) {
    submitItem(item);
    return;
  }
  const paper = $("handoff-paper");
  if (!paper.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    submitItem(item);
    return;
  }
  pending.delivering = true;
  const from = $("bag").querySelector(`[data-action="item-${item}"]`).getBoundingClientRect();
  const to = paper.getBoundingClientRect();
  const dx = dropped ? 0 : from.left + from.width / 2 - to.left - to.width / 2;
  const dy = dropped ? -14 : from.top + from.height / 2 - to.top - to.height / 2;
  const flight = paper.animate([{transform: `translate(${dx}px, ${dy}px) rotate(-12deg)`},
    {transform: "translate(0, 0) rotate(0)"}], {duration: 290, easing: "ease-out"});
  flight.onfinish = () => {
    if (runtime.pendingSubmission === pending) submitItem(item);
  };
}

export function submitItem(item) {
  const pending=runtime.pendingSubmission;
  if (!pending) return false;
  if (!matchesSubmission(pending.step,item) || !ownedItems()[item]) {
    const name=inventoryItems[submissionSteps[pending.step].item].name;
    $("submission-hint").textContent = `가방에서 ‘${name}’ 칸을 눌러 주세요.`;
    return false;
  }
  playPaperTurn();
  runtime.submittedSteps.add(pending.step);
  close();
  pending.onSubmit();
  // Decisions and the intake form already display their full working documents.
  if (runtime.talkState) {
    const sheet = $("speech-paper");
    sheet.innerHTML = submittedPaper(item);
    sheet.hidden = false;
    sheet.open = true;
  }
  return true;
}
