import { runtime } from "../core/runtime.js";
import { glossary, lessons, PROCEDURE_SOURCE, LAYOUT_SOURCE } from "../data/learning.js";
import { questNames } from "../data/quests.js";
import { buttons, show } from "./modal.js";

export function lessonCard(stage) {
  return `<section class="lesson-card"><h3>이번 업무에서 배운 것</h3><p>${lessons[stage]}</p></section>`;
}

export function learningReview() {
  return `<ol class="learning-review">${lessons.slice(0, runtime.state.stage).map((lesson, i) => `<li><strong>${questNames[i]}</strong><p>${lesson}</p></li>`).join("")}</ol>`;
}

export function openGlossary() {
  show("조달 용어 수첩", `<p>지금까지 ${runtime.state.stage}개 업무를 마쳤어요. 용어를 누르면 설명이 펼쳐져요.</p>
    <div class="glossary">${glossary.map(([term, meaning]) => `<details><summary>${term}</summary><p>${meaning}</p></details>`).join("")}</div>
    <p class="source-note">기준 자료 : 조달청 물품구매 총액계약 업무처리절차 · 2026-11-21 확인<br />
    <a href="${PROCEDURE_SOURCE}" target="_blank" rel="noopener noreferrer">공식 업무처리절차 보기</a> · <a href="${LAYOUT_SOURCE}" target="_blank" rel="noopener noreferrer">층별배치도 보기</a></p>
    <p class="source-note">새봄지방조달청·도서관·기업·금액은 가상 설정이에요. 층별배치도를 참고해 재구성했고, 심사 세부 내용과 대기 시간은 줄였어요.</p>
    ${buttons([["close", "수첩 닫기"]])}`, "glossary");
}
