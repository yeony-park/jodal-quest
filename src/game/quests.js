import { awardQuestXP, xpReward } from "./progression.js";
import { beginRecovery } from "./recovery.js";
import { lessonCard } from "../components/learning.js";
import { runtime } from "../core/runtime.js";
import { save } from "../core/storage.js";
import { buttons, close, doc, show, toast } from "../components/modal.js";
import { render, setNotebook } from "../components/hud.js";
import { speak } from "../components/dialogue.js";
import { actions } from "./actions.js";
import { $ } from "../core/dom.js";

export function nextTarget() {
  if (runtime.state.stage === 0)
    return !runtime.state.brief ? "mentor" : !runtime.state.contact ? "phone" : "doc";
  if (runtime.state.stage === 1) return !runtime.state.specAdvice ? "mentor" : "doc";
  if (runtime.state.stage === 2) return !runtime.state.noticeChecked ? "terminal" : "mentor";
  if (runtime.state.stage === 3) return !runtime.state.product ? "doc" : "terminal";
  if (runtime.state.stage === 4) return !runtime.state.awardBrief ? "officer" : !runtime.state.openingChecked ? "bidroom" : "officer";
  if (runtime.state.stage === 5 && runtime.floor === 1 && !runtime.state.contractFarewell) return "officer";
  if (runtime.state.stage === 5) return !runtime.state.inspectionChecked ? "phone" : "terminal";
  return "result";
}

export function wrong(text, back, id) {
  const ids = ["intake", "spec-brand", "notice", "product", back === "bidroom" ? "opening" : "contract", back === "phone" ? "delivery" : "payment"];
  beginRecovery(id || ids[runtime.state.stage]);
}

export function complete(title, body) {
  const completed = runtime.state.stage;
  if (completed > 2) return;
  runtime.state.history.push(
    ["요청서 확인 및 접수 준비", "경쟁 가능한 규격 수정", "검토·결재 후 공고 게시"][completed],
  );
  awardQuestXP();
  runtime.state.stage++;
  save();
  render();
  show(
    title,
    /* HTML */ `<div class="success">✓ ${body}</div>
      ${xpReward()}${lessonCard(completed)}
      ${buttons([["advance", completed === 2 ? "입찰 준비하기" : "다음 퀘스트"]])}`,
    "advance",
    false,
  );
}

export function mentor() {
  if (runtime.state.stage === 0) {
    speak(
      "김주문",
      [
        { term: "수요기관", text: "모니터 20대를 요청한 새봄도서관이 이번 수요기관이에요. 요청서에는 납품기한이 빠져 있네요." },
        "왼쪽 연락 데스크에서 수요기관에 납기를 확인해 주세요. 확인한 내용으로 요청서를 보완하면 됩니다.",
      ],
      () => {
        runtime.state.brief = true;
        save();
        render();
      },
      "mentor",
      "네! 수요기관에 납기를 확인하고 요청서를 보완할게요.",
    );
  } else if (runtime.state.stage === 1) {
    speak(
      "김주문",
      [
        "규격서에 특정 브랜드가 적혀 있네요. 이번 사례에서는 그 브랜드만 필요한 사유가 확인되지 않았어요.",
        { term: "규격", text: "규격은 물품이 갖춰야 할 조건이에요. 도서관에는 24형 이상, FHD 이상, HDMI 연결이면 충분하대요." },
        "이 성능 기준을 담아 수정안을 만들어 주세요. 필요한 조건은 지키고, 다른 기업도 참여할 수 있게요.",
      ],
      () => {
        runtime.state.specAdvice = true;
        save();
        render();
      },
      "mentor",
      "알겠습니다. 성능 기준으로 수정안을 만들어 볼게요.",
    );
  } else if (runtime.state.stage === 2) {
    if (!runtime.state.noticeChecked) {
      speak("김주문", [
        "공고 초안을 먼저 확인해 주세요. 요청서는 모니터 20대였죠? 수량이 같은지 대조해 보세요.",
      ], () => {}, "mentor", "네, 요청서와 수량을 대조해 볼게요.");
      return;
    }
    speak(
      "김주문",
      [
        "수량 20대와 성능 조건을 확인했어요. 초안 검토를 마쳤습니다.",
        { term: "구매결의", text: "수량과 예산, 계약방법을 정리해 구매를 결정하는 게 구매결의예요. 담당자의 결재가 끝나면 공고를 게시해요." },
      ],
      () => actions.approve(),
      "mentor",
      "검토 감사합니다! 결재가 끝나면 공고를 확인할게요.",
    );
  } else
    speak(
      "김주문",
      ["수고했어요, 조달달 주무관! 확인하고 협의하는 습관을 기억하세요."],
      () => {},
      "mentor",
      "네, 선배님. 꼭 기억할게요!",
    );
}

export function phone() {
  if (runtime.state.stage === 0) {
    if (!runtime.state.brief) {
      speak("안내", ["먼저 김주문 선배에게 첫 업무를 들어 보세요."]);
      return;
    }
    speak(
      "수요기관 담당자",
      [
        "새봄도서관 한서진 사서입니다. 아, 요청서에 납기를 빠뜨렸네요!",
        "계약일로부터 30일 이내에 도서관 2층 자료실로 부탁드려요. 이용자들이 문서를 읽을 때 쓸 모니터예요.",
      ],
      () => {
        runtime.state.contact = true;
        save();
        render();
        toast("납기 30일 · 2층 자료실을 기록했어요.");
      },
      "contact",
      "확인 감사합니다. 계약일로부터 30일 이내, 2층 자료실로 적어 둘게요.",
    );
  } else show("수요기관 확인 메모", `${requestDoc()}${buttons([["close", "돌아가기"]])}`);
}

export function requestDoc() {
  return doc("물품 구매 요청서", [
    ["수요기관", "새봄도서관"],
    ["구매 물품", "이용자용 모니터 20대"],
    ["배정 예산", "20,000,000원"],
    ["사용 목적", "자료실에서 문서·자료 열람"],
    ["납품기한", runtime.state.contact ? "계약일로부터 30일 이내" : "미기재 · 확인 필요"],
    ["납품 장소", runtime.state.contact ? "새봄도서관 2층 자료실" : "새봄도서관"],
  ]);
}

export function documentDesk() {
  if (runtime.state.stage === 0) {
    show(
      "첫 요청서를 검토하세요",
      `${requestDoc()}<p>접수 준비를 마치려면 어떻게 해야 할까요?</p><div class="choices"><button class="choice" data-action="intake-good">확인한 납기를 보완하고 검토를 요청한다</button><button class="choice" data-action="intake-bad">급하니 납기를 임의로 7일로 적는다</button></div>`,
    );
  } else if (runtime.state.stage === 1) {
    show(
      "규격서에서 공정한 기준 찾기",
      `${doc("물품 규격서 초안", [
        ["기존 문구", "“별빛전자 S24 제품만 허용”"],
        ["사용 목적", "문서 및 자료 열람"],
        ["필요 성능", "24형 이상 · FHD 이상 · HDMI 연결"],
        ["수량", "20대"],
      ])}<p>검토 의견으로 가장 알맞은 것은?</p><div class="choices"><button class="choice" data-action="spec-bad">기존 브랜드와 모델명 제한을 그대로 유지한다</button><button class="choice" data-action="spec-good">협의한 성능 기준으로 수정안을 작성한다</button><button class="choice" data-action="spec-empty">경쟁이 쉬워지도록 모든 규격을 삭제한다</button></div>`,
    );
  } else if (runtime.state.stage === 3) {
    show(
      "공고 규격과 제품을 비교하세요",
      `${doc("공고의 납품 조건", [
        ["구매 수량", "20대"],
        ["필요 성능", "24형 이상 · FHD 이상 · HDMI 연결"],
        ["납품기한", "계약일로부터 30일 이내"],
      ])}${doc("제품 자료", [
        ["새봄 M24", "24형 / FHD / HDMI · 20대 공급 · 계약 후 20일 내 납품"],
        ["새봄 C22", "22형 / FHD / HDMI · 20대 공급 · 계약 후 20일 내 납품"],
      ])}<div class="choices"><button class="choice" data-action="product-good">새봄 M24 · 24형 / FHD / HDMI</button><button class="choice" data-action="product-bad">새봄 C22 · 22형 / FHD / HDMI</button></div>`,
    );
  } else show("확인한 구매 요청서", `${requestDoc()}${buttons([["close", "확인 완료"]])}`);
}

export function tutorial() {
  speak(
    "김주문",
    [
      "반가워요, 조달달 주무관! 새봄지방조달청에 온 걸 환영해요. 첫 업무는 제가 옆에서 알려 줄게요.",
      "방향키나 WASD로 걸어 보세요. 사람이나 책상 이름을 누르면 알아서 찾아가요. 대화는 스페이스바로 넘기면 돼요.",
      "왼쪽 위 작은 지도에서 내 위치를 볼 수 있어요. 오른쪽 위는 제 업무 노트, 아래 7칸은 물건을 모으는 인벤토리예요.",
      { term: "수요기관", text: "필요한 물품을 사 달라고 요청하는 곳을 수요기관이라고 해요. 이번 수요기관은 새봄도서관이에요." },
      "첫 의뢰는 도서관 모니터 20대예요. 요청서에 납기가 빠졌네요. 연락 데스크에서 확인해 주세요. 노트에도 적어 둘게요.",
    ],
    () => {
      runtime.state.brief = true;
      save();
      render();
      setNotebook(true);
      toast("첫 업무를 받았어요. 김주문의 노트를 확인해 보세요.");
    },
    "mentor",
    "네, 선배님! 연락 데스크에서 납기부터 확인해 볼게요.",
  );
}

export function supplierNPC() {
  speak(
    "욘 대리",
    [
      "안녕하세요! 새봄테크에서 입찰 업무를 맡고 있는 욘입니다.",
      "공고가 게시되면 나라장터에서 같은 정보를 확인하고 참여할 거예요. 규격과 납기를 꼼꼼히 읽어야죠.",
    ],
    () => {},
    "supplier",
    "반갑습니다! 공고가 게시되면 잘 부탁드려요.",
  );
}

export function finishBid() {
  if (runtime.state.stage !== 3) return;
  const checked = $("eligible") && $("eligible").checked;
  runtime.state.eligibility = !!checked;
  if (!runtime.state.product || !checked) {
    save();
    render();
    toast(
      !runtime.state.product
        ? "규격에 맞는 제품을 먼저 선택하세요."
        : "참가 조건 확인란에 체크해 주세요.",
    );
    return;
  }
  runtime.state.history.push("기업 입찰서 접수");
  awardQuestXP();
  runtime.state.stage = 4;
  runtime.portalSignedIn = false;
  save();
  render();
  close();
  speak(
    "욘 대리",
    [
      "입찰서가 접수됐어요! 공고를 꼼꼼히 읽으니 제출까지 할 수 있었네요.",
      "접수는 낙찰이나 계약 체결이 아니에요. 다음 절차가 남아 있다는 점도 기억할게요.",
    ],
    () => {
      runtime.floor = 0;
      runtime.state.floor = 0;
      render();
      show("입찰서 접수 완료", `<div class="success">입찰서가 접수됐어요. 이어서 낙찰자 선정과 계약 절차를 배워요.</div>${xpReward()}${lessonCard(3)}${buttons([["return-rookie", "계약 업무 받기"]])}`, "advance", false);
    },
    "supplier",
  );
}

export function returnRookie() {
  if (runtime.state.stage !== 4) return;
  speak("김주문", [
    "입찰서가 접수됐어요. 다음은 낙찰자 선정과 계약이에요.",
    "복도 왼쪽 엘리베이터를 타고 2층 계약 담당자에게 가 보세요. 노트의 다음 목표 버튼도 안내해 줄 거예요.",
  ], () => {}, "mentor", "네! 엘리베이터를 타고 2층으로 가 볼게요.");
}
