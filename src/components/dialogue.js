import { keys, runtime } from "../core/runtime.js";
import { $ } from "../core/dom.js";
import { playSyllable, stopSounds } from "../audio/sound.js";
import { close } from "./modal.js";
import { setNotebook } from "./hud.js";
import { face } from "../world/characters.js";
import { canvas } from "../world/canvas.js";

export function stopTalk() {
  clearTimeout(runtime.talkTimer);
  runtime.talkTimer = null;
  runtime.talkState = null;
  $("speech").hidden = true;
  document.body.classList.remove("talking");
  stopSounds();
}

export function speak(name, lines, onDone = () => {}, role = "mentor") {
  close();
  stopTalk();
  keys.clear();
  runtime.target = null;
  setNotebook(false);
  runtime.talkState = { name, lines, onDone, role, index: 0, revealed: 0 };
  $("speech").hidden = false;
  document.body.classList.add("talking");
  $("speech-name").textContent = name;
  $("speech-portrait").innerHTML = face(role === "contact" ? "supplier" : role);
  $("speech").focus();
  typeLine();
}

export function typeLine() {
  if (!runtime.talkState) return;
  clearTimeout(runtime.talkTimer);
  const t = runtime.talkState,
    text = t.lines[t.index];
  t.revealed = 0;
  $("speech-text").textContent = "";
  $("speech-count").textContent = `${t.index + 1} / ${t.lines.length}`;
  $("speech-hint").textContent = "문장 모두 보기";
  function tick() {
    if (runtime.talkState !== t) return;
    t.revealed++;
    $("speech-text").textContent = text.slice(0, t.revealed);
    if (t.revealed % 2 === 1) playSyllable(text[t.revealed - 1], t.role);
    if (t.revealed < text.length)
      runtime.talkTimer = setTimeout(tick, /[,!?。.]$/.test(text.slice(0, t.revealed)) ? 160 : 42);
    else {
      $("speech-hint").textContent = t.index === t.lines.length - 1 ? "대화 마치기" : "다음 이야기";
      runtime.talkTimer = null;
    }
  }
  tick();
}

export function revealLine() {
  if (!runtime.talkState) return;
  clearTimeout(runtime.talkTimer);
  runtime.talkTimer = null;
  stopSounds();
  runtime.talkState.revealed = runtime.talkState.lines[runtime.talkState.index].length;
  $("speech-text").textContent = runtime.talkState.lines[runtime.talkState.index];
  $("speech-hint").textContent =
    runtime.talkState.index === runtime.talkState.lines.length - 1 ? "대화 마치기" : "다음 이야기";
}

export function nextLine() {
  if (!runtime.talkState) return;
  if (runtime.talkState.revealed < runtime.talkState.lines[runtime.talkState.index].length) {
    revealLine();
    return;
  }
  runtime.talkState.index++;
  if (runtime.talkState.index < runtime.talkState.lines.length) {
    stopSounds();
    typeLine();
  } else {
    const done = runtime.talkState.onDone;
    stopTalk();
    done();
    if (!runtime.modalOpen) canvas.focus({ preventScroll: true });
  }
}
