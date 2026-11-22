import { runtime } from "../core/runtime.js";
import { face } from "../world/characters.js";

export function decision(thought, papers, options, form = "") {
  const supplier = runtime.state.stage === 3;
  return `<section class="decision-scene">
    <figure class="decision-actor">${face(supplier ? "supplier" : "rookie")}<figcaption>${supplier ? "욘 대리" : "조달달"}</figcaption></figure>
    <div class="decision-turn"><p class="decision-thought">${thought}</p>
      <h3>나의 선택은?</h3>${form}<div class="choices">${options.map(([action, label]) =>
        `<button class="choice" data-action="${action}">${label}</button>`).join("")}</div>
      ${papers ? `<details class="decision-document" open><summary>업무 서류</summary>${papers}</details>` : ""}
    </div></section>`;
}
