import { awardQuestXP, xpReward } from "./progression.js";
import { lessonCard } from "../components/learning.js";
import { keys, player, runtime } from "../core/runtime.js";
import { save } from "../core/storage.js";
import { floors, spots } from "../data/world.js";
import { render } from "../components/hud.js";
import { buttons, close, doc, show, toast } from "../components/modal.js";
import { speak } from "../components/dialogue.js";
import { chime } from "../audio/sound.js";
import { ending } from "../components/ending.js";

export function elevator() {
  if (runtime.state.stage === 3) return;
  if (runtime.state.stage === 5 && runtime.floor === 1 && !runtime.state.contractFarewell) { contractFarewell(); return; }
  show("엘리베이터 · 어느 층으로 갈까요?", `<p>현재 ${floors[runtime.floor].level}입니다.</p>
    ${buttons([[runtime.floor === 0 ? "floor-1" : "floor-0", runtime.floor === 0 ? "3층 · 개찰·계약 창구" : "5층 · 구매팀·납품 확인"], ["close", "이번 층에 머무르기", true]])}`, "elevator");
}

export function travelTo(floor) {
  if (runtime.state.stage === 3 || ![0, 1].includes(floor)) return;
  close();
  keys.clear();
  runtime.target = null;
  runtime.floor = floor;
  runtime.state.floor = floor;
  player.x = spots.elevator.x + 32;
  player.y = spots.elevator.y;
  save();
  render();
  if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
    document.getElementById("scene").animate?.([{ opacity: 0.25 }, { opacity: 1 }], { duration: 280 });
  chime();
  toast(`${floors[floor].level} 도착 · 노트에서 다음 목표를 확인하세요.`);
}

export function officer() {
  if (runtime.floor !== 1) return;
  if (runtime.state.stage === 5 && !runtime.state.contractFarewell) { contractFarewell(); return; }
  if (runtime.state.stage !== 4) {
    speak("이계약 주무관", ["여기는 계약팀이에요. 입찰서 접수 뒤 공고한 선정방식에 따른 심사와 계약 절차를 확인해요."], () => {}, "officer", "네, 순서를 기억해 둘게요.");
    return;
  }
  if (!runtime.state.awardBrief) {
    speak("이계약 주무관", [
      "3층에 온 걸 환영해요. 입찰서 접수 다음에는 낙찰자 선정과 계약 절차가 남아 있어요.",
      "예정가격은 입찰 전에 결정해 두었어요. 먼저 옆의 개찰·계약 자료에서 순서를 확인해 주세요.",
      "이번 구매 건은 공고한 낙찰자 선정방식에 따른 심사를 마친 뒤 전자계약을 진행합니다.",
    ], () => {
      runtime.state.awardBrief = true;
      save();
      render();
    }, "officer", "네, 개찰·계약 자료에서 순서부터 확인할게요.");
    return;
  }
  if (!runtime.state.openingChecked) {
    speak("이계약 주무관", ["옆의 개찰·계약 자료를 먼저 확인해 주세요. 예정가격을 언제 결정했는지 기억해 볼까요?"], () => {}, "officer", "네, 자료를 먼저 보고 올게요.");
    return;
  }
  speak("이계약 주무관", [
    "예정가격 자료를 확인했군요. 입찰 전에 결정한 기록을 확인하는 순서를 잘 지켰어요.",
    "이번 건은 공고한 낙찰자 선정방식에 따른 심사를 마쳤고, 새봄테크가 낙찰예정자예요.",
    "접수증과 심사 결과, 납품 조건을 대조해 볼까요? 확인한 뒤 권한 있는 담당자가 전자계약을 체결합니다.",
  ], () => show("입찰서 접수 다음은?", `${doc("계약 검토 기록", [
    ["구매 물품", "새봄도서관 모니터 20대"],
    ["심사 상태", "공고한 낙찰자 선정방식에 따른 심사 완료"],
    ["낙찰예정자", "새봄테크"],
    ["납품 조건", "계약일로부터 30일 이내 · 24형 이상 / FHD 이상 / HDMI"],
  ])}<p>권한 있는 계약 담당자는 어떤 절차를 진행할까요?</p><div class="choices">
    <button class="choice" data-action="contract-bad">입찰서가 접수됐으니 계약도 끝났다고 기록한다</button>
    <button class="choice" data-action="contract-good">심사 결과를 확인하고 낙찰예정자와 전자계약을 체결한다</button></div>`, "contract"), "officer", "접수증과 심사 결과를 확인하고 계약 절차를 진행할게요.");
}

export function bidroom() {
  if (runtime.floor !== 1) return;
  if (runtime.state.stage !== 4 || !runtime.state.awardBrief) {
    show("개찰·계약 자료", `<p>계약 담당자에게 업무 설명을 먼저 들어 주세요. 예정가격결정 → 입찰 → 낙찰자 선정·계약체결 순서로 진행해요.</p>${buttons([["close", "담당자에게 가기"]])}`);
    return;
  }
  show("입찰 전에 정한 가격을 확인해요", `${doc("개찰 단계 학습 메모", [
    ["공식 업무 순서", "예정가격결정 → 입찰 → 낙찰자 선정 및 계약체결"],
    ["현재 확인할 것", "입찰 전에 결정해 둔 예정가격과 공고한 선정방식"],
    ["사례", "새봄도서관 모니터 20대"],
  ])}<p>예정가격은 언제 결정할까요?</p><div class="choices">
    <button class="choice" data-action="opening-good">입찰 전에 결정해 두고, 지금 그 자료를 확인한다</button>
    <button class="choice" data-action="opening-bad">기업의 입찰서를 받은 다음 원하는 금액으로 정한다</button></div>`, "opening");
}

export function openingGood() {
  if (runtime.state.stage !== 4 || runtime.floor !== 1 || !runtime.state.awardBrief) return;
  runtime.state.openingChecked = true;
  save();
  render();
  show("예정가격 확인 완료", `<div class="success">예정가격은 입찰 전에 결정해 두었어요.</div><p>공고한 낙찰자 선정방식에 따른 심사를 마친 구매 건을 계약 담당자와 확인해요.</p>${buttons([["close", "계약 담당자에게 돌아가기"]])}`);
}

export function contractGood() {
  if (runtime.state.stage !== 4 || runtime.floor !== 1 || !runtime.state.openingChecked) return;
  runtime.state.history.push("선정방식에 따른 심사 확인 및 전자계약 체결");
  awardQuestXP();
  runtime.state.stage = 5;
  save();
  render();
  chime();
  show("전자계약 체결 완료", `<div class="success">권한 있는 계약 담당자가 낙찰예정자와 전자계약을 체결했어요.</div><p>계약서를 가방에 넣었어요. 이계약 주무관에게 다음 업무를 확인해요.</p>${xpReward()}${lessonCard(4)}${buttons([["contract-farewell", "계약서를 받고 담당자와 인사하기"]])}`, "advance", false);
}

export function contractFarewell() {
  if (runtime.state.stage !== 5 || runtime.floor !== 1) return;
  speak("이계약 주무관", [
    "계약서 받았죠? 모니터 20대와 계약일로부터 30일 이내라는 납품 조건을 기억해 주세요.",
    "수고했어요, 조달달 주무관. 이제 엘리베이터로 5층 구매팀에 돌아가세요.",
    "수요기관 연락 데스크에서 납품 자료를 확인하고, 계약서의 규격과 수량에 맞게 도착했는지 대조해 주세요.",
    "부족한 물품이 있으면 보완을 요청하고, 검사·검수와 물품인수를 확인한 뒤 납품 서류를 살펴봐요.",
  ], () => {
    runtime.state.contractFarewell = true;
    save();
    render();
  }, "officer", "감사합니다! 계약서를 챙겨서 5층으로 돌아갈게요. 연락 데스크에서 납품 자료부터 확인하겠습니다.");
}

export function delivery() {
  if (runtime.state.stage !== 5 || runtime.floor !== 0) return;
  const corrected = runtime.state.deliveryIssueReported;
  show("수요기관의 납품 확인 요청", `${doc("납품·검사·검수 자료", [
    ["계약 수량", "모니터 20대"],
    ["실제 도착", corrected ? "모니터 20대 · 부족분 보완 완료" : "모니터 19대 · 1대 부족"],
    ["규격·납기", "24형 / FHD / HDMI · 계약 후 20일"],
    ["담당", "검사공무원 · 물품출납공무원"],
  ])}<p>${corrected ? "보완한 납품 자료가 도착했어요. 다음 절차는?" : "수량을 대조했더니 한 대가 부족해요. 어떻게 할까요?"}</p>
    <div class="choices">${corrected
      ? '<button class="choice" data-action="delivery-good">검사·검수 담당자가 계약 내용과 일치함을 확인하고 물품을 인수한다</button>'
      : '<button class="choice" data-action="delivery-report">수요기관·계약상대자에게 부족분 보완을 요청한다</button><button class="choice" data-action="delivery-bad">19대만 도착했지만 20대를 모두 받았다고 기록한다</button>'}</div>`, "delivery");
}

export function reportDeliveryIssue() {
  if (runtime.state.stage !== 5 || runtime.floor !== 0) return;
  runtime.state.deliveryIssueReported = true;
  save();
  render();
  speak("수요기관 담당자", ["한 대가 부족한 것을 확인했어요. 계약상대자에게 보완을 요청하겠습니다.", "부족한 한 대가 도착했어요! 수요기관 연락 데스크에서 보완한 자료를 다시 확인해 주세요."], () => {}, "contact", "보완 감사합니다. 스무 대가 맞는지 다시 확인할게요.");
}

export function inspectDelivery() {
  if (runtime.state.stage !== 5 || runtime.floor !== 0 || !runtime.state.deliveryIssueReported) return;
  runtime.state.inspectionChecked = true;
  save();
  render();
  show("검사·검수와 물품인수 완료", `<div class="success">계약한 규격과 수량 20대를 확인하고 물품을 인수했어요.</div><p>수요기관이 영수증을 발급했어요. 업무용 모니터에서 납품 서류와 대금 청구를 확인하세요.</p>${buttons([["close", "대금 청구 확인하러 가기"]])}`);
}

export function payment() {
  if (runtime.state.stage !== 5 || runtime.floor !== 0) return;
  if (!runtime.state.inspectionChecked) {
    show("대금 지급 전 확인", `<p>수요기관의 납품 자료부터 확인하세요. 검사·검수와 물품인수 후 영수증과 납품 서류를 확인해요.</p>${buttons([["close", "납품 확인하러 가기"]])}`);
    return;
  }
  show("납품 서류와 대금 청구 확인", `${doc("계약 종결 검토", [
    ["검사·검수 및 인수", "모니터 20대 · 완료"],
    ["영수증·납품 서류", "수요기관 영수증 발급 · 서류 하자 없음"],
    ["대금 청구", "계약상대자가 조달청에 청구"],
  ])}<p>권한 있는 담당자의 다음 업무로 알맞은 것은?</p><div class="choices">
    <button class="choice" data-action="payment-bad">납품 서류를 생략하고 입찰서만 보고 지급한다</button>
    <button class="choice" data-action="payment-good">확인한 납품 서류로 계약종결 서류를 작성하고 대금 지급 절차를 진행한다</button></div>`, "payment");
}

export function finishPayment() {
  if (runtime.state.stage !== 5 || runtime.floor !== 0 || !runtime.state.inspectionChecked) return;
  runtime.state.history.push("검사·검수 및 물품인수 확인, 대금 지급");
  awardQuestXP();
  runtime.state.stage = 6;
  save();
  render();
  close();
  chime();
  speak("김주문", ["스무 대가 모두 도착했는지 끝까지 확인했군요. 납품 서류를 확인하고 담당자가 대금 지급 절차를 마쳤어요.", "요청서부터 계약과 납품까지, 오늘 배운 절차를 다시 떠올려 봐요."], ending);
}
