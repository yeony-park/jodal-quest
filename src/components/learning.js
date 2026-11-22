import { $ } from "../core/dom.js";
import { save } from "../core/storage.js";
import { runtime } from "../core/runtime.js";
import { glossary, lessons, PROCEDURE_SOURCE } from "../data/learning.js";
import { floors } from "../data/world.js";
import { questNames } from "../data/quests.js";
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
  $("learned-terms").innerHTML = terms.slice().reverse().map(term => `<li>${term}</li>`).join("");
}

export function learnTerm(term) {
  if (runtime.state.learnedTerms.includes(term)) return;
  runtime.state.learnedTerms.push(term);
  renderGlossary();
  save();
}

export function openCabinet() {
  if (runtime.state.stage === 3) return;
  const {term, caption} = floors[runtime.floor];
  const collected = runtime.state.learnedTerms.includes(term);
  learnTerm(term);
  show(collected ? "다시 펼친 용어 카드" : "용어 카드를 발견했어요", `<article class="cabinet-card">
    <small>${caption} · 자료 캐비닛</small><h3>${term}</h3><p>${glossary[term]}</p></article>
    ${buttons([["close", "캐비닛 닫기"], ["glossary", "용어 수첩 보기", true]])}`, "cabinet");
}

export function openGlossary() {
  const terms = runtime.state.learnedTerms;
  show("조달 용어 수첩", `<div class="glossary">${terms.length
    ? terms.map(term => `<details><summary>${term}</summary><p>${glossary[term]}</p></details>`).join("")
    : "<p>설명을 듣거나 캐비닛에서 발견한 용어가 여기에 기록돼요.</p>"}</div>
    <p class="source-note"><a href="${PROCEDURE_SOURCE}" target="_blank" rel="noopener noreferrer">공식 업무처리절차 보기</a></p>
    ${buttons([["close", "수첩 닫기"]])}`, "glossary");
}
