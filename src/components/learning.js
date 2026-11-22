import { $ } from "../core/dom.js";
import { save } from "../core/storage.js";
import { runtime } from "../core/runtime.js";
import { cabinetCreak, playCardDiscovery } from "../audio/sound.js";
import { glossary, lessons, PROCEDURE_SOURCE } from "../data/learning.js";
import { floors, spots } from "../data/world.js";
import { nextTarget } from "../game/quests.js";
import { questNames } from "../data/quests.js";
import { speak } from "./dialogue.js";
import { buttons, show } from "./modal.js";

export function lessonCard(stage) {
  return `<section class="lesson-card"><h3>이번 업무에서 배운 것</h3><p>${lessons[stage]}</p></section>`;
}

export function learningReview() {
  return `<ol class="learning-review">${lessons.slice(0, runtime.state.stage).map((lesson, i) => `<li><strong>${questNames[i]}</strong><p>${lesson}</p></li>`).join("")}</ol>`;
}

export function renderGlossary() {
  const terms = runtime.state.learnedTerms;
  $("glossary-count").textContent = terms.length;
  const unread = runtime.state.unreadTerms.length;
  $("glossary-button").classList.toggle("has-unread", unread > 0);
  $("glossary-button").setAttribute("aria-label", `용어 수첩 · ${terms.length}개${unread ? ", 읽지 않은 용어 " + unread + "개" : ""}`);
}

export function learnTerm(term, source) {
  if (runtime.state.learnedTerms.includes(term)) return;
  runtime.state.learnedTerms.push(term);
  runtime.state.unreadTerms.push(term);
  runtime.state.termSources[term] = source ?? [floors[runtime.floor].caption, runtime.talkState?.name].filter(Boolean).join(" · ");
  renderGlossary();
  save();
}

function noteBody(term) {
  const floor = floors.find(f => f.term === term);
  const source = runtime.state.termSources[term] ?? (floor ? floor.caption + " 자료 캐비닛" : "이전 업무 기록");
  return `<p>${glossary[term]}</p><footer>－ 얻은 장소 · ${source}</footer>`;
}

function showFloorCard(floor, source) {
  const collected = runtime.state.learnedTerms.includes(floor.term);
  if (!collected) {
    learnTerm(floor.term, source);
    playCardDiscovery();
  }
  show(collected ? "다시 펼친 용어 카드" : "용어 카드를 얻었다!", `<article class="cabinet-card${collected ? "" : " just-found"}">
    <h3>${floor.term}</h3>${noteBody(floor.term)}</article>
    <p class="source-note">화면 오른쪽 아래의 ‘용어 수첩’에서 다시 볼 수 있어요.</p>
    ${buttons([["glossary", "용어 수첩 보기"]])}`, "cabinet");
}

export function openCabinet() {
  const floor = floors[runtime.floor];
  if (runtime.state.stage === 3 || floor.guide) return;
  cabinetCreak();
  showFloorCard(floor, floor.caption + " 자료 캐비닛");
}

export function meetLibrarian() {
  const floor = floors[runtime.floor];
  if (runtime.state.stage === 3 || !floor.guide) return;
  const card = () => showFloorCard(floor, floor.caption + " · " + floor.guide);
  if (runtime.state.learnedTerms.includes(floor.term)) {
    speak(floor.guide, ["또 오셨네요! 지난번에 같이 본 쪽지, 다시 펼쳐 볼까요?"], card, "librarian");
    return;
  }
  const state = runtime.state, target = nextTarget();
  const errands = [
    {mentor: "오늘 첫 출근이라 김주문 선배님을 찾아가고 있어요.", phone: "새봄도서관에 모니터가 언제까지 필요한지 물어보러 가요.", doc: "도서관에서 알려 준 납품기한을 요청서에 적으러 가요."},
    {mentor: "모니터 규격서에 브랜드 이름이 적혀 있어서요. 선배님께 여쭤보러 가요.", doc: "선배님과 얘기한 대로 모니터 규격서를 고치러 가요."},
    {terminal: "공고를 올리기 전에 모니터 수량이 맞는지 확인하러 가요.", mentor: "공고 초안을 다 써서 선배님께 보여 드리러 가요."},
    {},
    {officer: state.openingChecked ? "심사 결과가 나와서 계약 담당자께 서류를 가져다드리러 가요." : "입찰서가 접수됐대요. 다음 절차를 배우러 계약팀에 가고 있어요.", bidroom: "계약팀에서 개찰 자료를 보고 예정가격을 확인하려고요."},
    {phone: state.deliveryIssueReported ? "지난번에 빠졌던 모니터가 도착했는지 확인하러 가요." : "도서관에 모니터가 잘 도착했는지 확인하러 가요.", terminal: "납품 확인이 끝나서 대금 청구 서류를 살펴보러 가요."},
    {result: "오늘 맡은 일은 다 끝냈어요. 어떤 곳들이 있나 둘러보는 중이에요."},
  ];
  const destination = floors[spots[target]?.floor];
  const directions = destination ? `아, 그러면 ${destination.caption}으로 가시면 돼요.` : "잘 오셨어요. 천천히 둘러보세요!";
  const introduceLibrary = () => speak(floor.guide, [
    directions + " 여기는 도서실이에요. 저는 업무에 필요한 책이나 자료를 찾아 드려요.",
    "책이 많으면 목록 만드는 일을 전문 업체에 맡기기도 해요. 이렇게 일을 맡기는 걸 ‘용역’이라고 해요. 자, 이 쪽지 하나 가져가세요.",
  ], card, "librarian", "그렇군요!");
  speak(floor.guide, ["여긴 어떻게 오셨어요?"], () =>
    speak("조달달", [errands[state.stage][target]], introduceLibrary, "rookie"), "librarian");
}

export function openGlossary() {
  const terms = runtime.state.learnedTerms;
  show("조달 용어 수첩", `<div class="glossary">${terms.length
    ? terms.map(term => {
      const classes = runtime.state.unreadTerms.includes(term) ? "cabinet-card is-unread" : "cabinet-card";
      return `<details data-term="${term}" class="${classes}"><summary>${term}</summary>${noteBody(term)}</details>`;
    }).join("")
    : "<p>설명을 듣거나 캐비닛에서 발견한 용어가 여기에 기록돼요.</p>"}</div>
    <p class="source-note"><a href="${PROCEDURE_SOURCE}" target="_blank" rel="noopener noreferrer">공식 업무처리절차 보기</a></p>
    `, "glossary");
  for (const entry of $("modal").querySelectorAll("details.is-unread")) {
    entry.addEventListener("toggle", () => {
      if (!entry.open || !runtime.state.unreadTerms.includes(entry.dataset.term)) return;
      runtime.state.unreadTerms = runtime.state.unreadTerms.filter(term => term !== entry.dataset.term);
      entry.classList.remove("is-unread");
      renderGlossary();
      save();
    });
  }
}
