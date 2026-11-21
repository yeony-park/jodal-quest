import { recover, finishRecovery } from "./recovery.js";
import { requestSubmission, submitItem } from "./submission.js";
import { openGlossary } from "../components/learning.js";
import { buttons, close, help, show } from "../components/modal.js";
import { startGame } from "../components/title.js";
import { player, runtime } from "../core/runtime.js";
import { render, setNotebook } from "../components/hud.js";
import { $ } from "../core/dom.js";
import { previewVoice, soundSettings, stopSounds, updateVolume } from "../audio/sound.js";
import { nextLine, speak } from "../components/dialogue.js";
import { go, interact } from "../world/navigation.js";
import {
  complete,
  documentDesk,
  finishBid,
  returnRookie,
  mentor,
  nextTarget,
  phone,
  supplierNPC,
  wrong,
} from "./quests.js";
import {
  openPortal,
  portalBid,
  portalDetail,
  portalWork,
  savePortalDraft,
  terminal,
} from "../components/portal.js";
import { save } from "../core/storage.js";
import { elevator, travelTo, officer, contractFarewell, bidroom, openingGood, contractGood, delivery, reportDeliveryIssue, inspectDelivery, payment, finishPayment } from "./procurement.js";
import { inventoryItems, inspectItem } from "../components/inventory.js";

export const actions = {
  recover,
  "recover-finish": finishRecovery,
  "recovered-notice": () => { openPortal("draft"); $("portal-quantity").value=20; savePortalDraft(); },
  close,
  help,
  glossary: openGlossary,
  interact,
  "return-rookie": returnRookie,
  restart: () =>
    show(
      "처음부터 다시 시작할까요?",
      /* HTML */ `<p>저장된 진행 상황과 학습 점수가 초기화됩니다.</p>
        ${buttons([
          ["new", "새 게임 시작"],
          ["close", "취소", true],
        ])}`,
      "restart",
    ),
  new: () => startGame(true),
  continue: () => startGame(false),
  "start-new": () => {
    if (runtime.loaded) actions.restart();
    else startGame(true);
  },
  quests: () => setNotebook($("quest-panel").hidden),
  sound: soundSettings,
  "talk-next": nextLine,
  mute: () => {
    runtime.muted = !runtime.muted;
    stopSounds();
    updateVolume();
  },
  "voice-preview": previewVoice,
  "rookie-voice-preview": () => previewVoice("rookie"),
  guide: () => {
    setNotebook(false);
    go(nextTarget());
  },
  mentor,
  phone: () => runtime.state.stage === 5 ? delivery() : phone(),
  doc: documentDesk,
  terminal: () => runtime.state.stage === 5 ? payment() : terminal(),
  elevator,
  "floor-0": () => travelTo(0),
  "floor-1": () => travelTo(1),
  officer,
  "contract-farewell": contractFarewell,
  bidroom,
  "opening-good": openingGood,
  "opening-bad": () => wrong("예정가격은 입찰 전에 결정해 둡니다. 입찰서를 받은 뒤 임의로 바꾸지 않아요.", "bidroom"),
  "contract-good": contractGood,
  "contract-bad": () => wrong("입찰서 접수 후 공고한 낙찰자 선정방식에 따른 심사를 거치고, 낙찰예정자와 전자계약을 체결해요.", "officer"),
  "delivery-report": reportDeliveryIssue,
  "delivery-good": inspectDelivery,
  "delivery-bad": () => wrong("계약한 20대와 납품한 19대가 다릅니다. 부족한 수량을 보완한 뒤 검사·검수해야 해요.", "phone"),
  "payment-good": finishPayment,
  "payment-bad": () => wrong("검사·검수와 물품인수, 영수증과 납품 서류를 확인하고 대금 청구·지급 절차를 진행해요.", "terminal"),
  approve: () => {
    if (runtime.state.stage === 2 && runtime.state.noticeChecked)
      complete(
        "검토·결재 후 공고 게시",
        "선배의 검토와 권한 있는 담당자의 결재를 거쳐 모의 공고가 게시됐습니다.",
      );
  },
  advance: () => {
    close();
    if (runtime.state.stage <= 3) {
      player.x = 464;
      player.y = 144;
    }
    runtime.portalSignedIn = false;
    if (runtime.state.stage === 3)
      speak(
        "욘 대리",
        [
          "공고가 게시됐군요! 이제 새봄테크 사무실의 욘 대리로 플레이합니다.",
          "제품 자료를 비교한 뒤 업무용 모니터에서 공고를 검색하고 모의 입찰서를 준비해 볼게요.",
        ],
        () => {},
        "supplier",
      );
  },
  "intake-good": () => {
    if (runtime.state.stage !== 0) return;
    if (!runtime.state.brief || !runtime.state.contact) {
      show(
        "확인할 정보가 남았어요",
        /* HTML */ `<p>
            선배에게 업무를 듣고 수요기관에 납품기한을 확인해 주세요. 추측으로 요청서를 채울 수는
            없어요.
          </p>
          ${buttons([["close", "정보 수집하러 가기"]])}`,
      );
      return;
    }
    complete("요청서 접수 준비 완료", "확인한 납기를 보완하고 선배 검토를 거쳐 접수했습니다.");
  },
  "intake-bad": () =>
    wrong(
      "납기는 구매 목적과 공급 가능성에 영향을 줍니다. 수요기관 확인 없이 임의로 정하지 않아요.",
      "doc",
    ),
  "spec-good": () => {
    if (runtime.state.stage !== 1) return;
    if (!runtime.state.specAdvice) {
      show(
        "수정 근거를 먼저 확인해요",
        /* HTML */ `<p>선배 김주문에게 수요기관과 확인한 성능 조건을 들어 보세요.</p>
          ${buttons([["close", "선배에게 가기"]])}`,
      );
      return;
    }
    complete(
      "규격 검토 완료",
      "수요기관과 협의한 성능 중심 수정안을 작성하고, 선배의 검토를 받았습니다.",
    );
  },
  "spec-bad": () =>
    wrong(
      "이 사례에는 특정 브랜드만 필요한 사유가 없어요. 필요한 성능으로 표현하면 여러 기업이 경쟁할 수 있습니다.",
      "doc",
    ),
  "spec-empty": () =>
    wrong(
      "규격을 모두 없애면 목적에 맞지 않는 물품이 올 수 있어요. 필요한 성능은 명확히 남겨야 해요.",
      "doc",
      "spec-empty",
    ),
  "product-good": () => {
    if (runtime.state.stage !== 3) return;
    runtime.state.product = true;
    save();
    render();
    show(
      "공고에 맞는 제품을 골랐어요",
      /* HTML */ `<div class="success">새봄 M24 · 크기, 해상도, 연결 방식 및 납기 충족</div>
        <p>모의 나라장터에서 참가 조건을 확인하고 입찰서를 제출하세요.</p>
        ${buttons([["close", "모의 입찰 준비하기"]])}`,
    );
  },
  "product-bad": () =>
    wrong(
      "22형은 공고의 24형 이상 조건에 미달해요. 가격만 보지 말고 규격과 납기를 함께 확인하세요.",
      "doc",
    ),
  "submit-bid": finishBid,
};

Object.assign(actions, {
  supplier: supplierNPC,
  "portal-home": () => openPortal("home"),
  "portal-login": () =>
    openPortal(runtime.portalSignedIn ? (runtime.state.stage === 2 ? "draft" : "list") : "login"),
  "portal-signin": () => {
    runtime.portalSignedIn = true;
    openPortal(runtime.state.stage === 2 ? "draft" : "list");
  },
  "portal-work": portalWork,
  "portal-list": () => openPortal("list"),
  "portal-search": () => openPortal("list", $("portal-search").value),
  "portal-guide": () => openPortal("guide"),
  "portal-detail": portalDetail,
  "portal-bid": portalBid,
  "portal-save-draft": savePortalDraft,
});

for (const target of ["mentor","doc","terminal","phone","officer","bidroom"]) {
  const original=actions[target];
  actions[target]=()=>requestSubmission(target, original);
}
for (let i = 0; i < inventoryItems.length; i++) actions["item-" + i] = () =>
  runtime.pendingSubmission ? submitItem(i) : inspectItem(i);
