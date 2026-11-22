import { keys, runtime } from "../core/runtime.js";
import { $ } from "../core/dom.js";
import { learnTerm } from "./learning.js";
import { playSyllable, ringPhone, stopFirstDayVoice, stopRing, stopVoices } from "../audio/sound.js";
import { close } from "./modal.js";
import { setNotebook } from "./hud.js";
import { face, rookieOutfit } from "../world/characters.js";
import { canvas } from "../world/canvas.js";

export function stopTalk() {
  clearTimeout(runtime.phoneTimer);
  clearTimeout(runtime.arrivalTimer);
  stopRing();
  stopFirstDayVoice();
  $("first-day").hidden = true;
  $("speech-paper").hidden = true;
  $("hang-up").hidden = true;
  $("speech-next").hidden = false;
  clearTimeout(runtime.talkTimer);
  runtime.talkTimer = null;
  runtime.talkState = null;
  $("speech").hidden = true;
  document.body.classList.remove("talking");
  stopVoices();
}

export function callContact(lines, onDone, reply) {
  const answer = () => speak("수요기관 담당자", lines, onDone, "contact", reply);
  speak("조달달", [{text: "새봄도서관에 전화 거는 중…", dialing: true}], () => {}, "rookie");
  const delay = ringPhone();
  if (!delay) { answer(); return; }
  runtime.phoneTimer = setTimeout(answer, delay);
}

// reply: 대화가 끝난 뒤 조달달이 녹음 목소리로 하는 짧은 대답. 대화마다 따로 적습니다.
export function speak(name, lines, onDone = () => {}, role = "mentor", reply = "") {
  close();
  stopTalk();
  keys.clear();
  runtime.target = null;
  setNotebook(false);
  const done =
    !reply || role === "rookie" || runtime.state.stage === 3
      ? onDone
      : () => speak("조달달", [reply], onDone, "rookie");
  runtime.talkState = { name, lines, onDone: done, role, index: 0, revealed: 0 };
  $("speech").hidden = false;
  document.body.classList.add("talking");
  $("speech-name").textContent = name;
  $("speech-portrait").innerHTML = face(role === "rookie" ? rookieOutfit() : role);
  $("speech").focus();
  typeLine();
}

export function typeLine() {
  if (!runtime.talkState) return;
  clearTimeout(runtime.talkTimer);
  const t = runtime.talkState,
    line = t.lines[t.index],
    text = line.text ?? line;
  if (line.dialing) {
    t.revealed = text.length;
    $("speech-text").textContent = text;
    $("speech-next").hidden = true;
    $("hang-up").hidden = false;
    return;
  }
  t.revealed = 0;
  $("speech-text").textContent = "";
  $("speech-count").textContent = `${t.index + 1} / ${t.lines.length}`;
  $("speech-hint").textContent = "문장 모두 보기";
  function tick() {
    if (runtime.talkState !== t) return;
    t.revealed++;
    $("speech-text").textContent = text.slice(0, t.revealed);
    if (!line.narration && !runtime.modalOpen && t.revealed % 2 === 1) playSyllable(text[t.revealed - 1], t.role);
    if (t.revealed < text.length)
      runtime.talkTimer = setTimeout(tick, /[,!?。.]$/.test(text.slice(0, t.revealed)) ? 160 : 42);
    else {
      $("speech-hint").textContent = t.index === t.lines.length - 1 ? "대화 마치기" : "다음 이야기";
      runtime.talkTimer = null;
      if (line.term) learnTerm(line.term);
    }
  }
  tick();
}

export function revealLine() {
  if (!runtime.talkState) return;
  clearTimeout(runtime.talkTimer);
  runtime.talkTimer = null;
  stopVoices();
  const line = runtime.talkState.lines[runtime.talkState.index];
  const text = line.text ?? line;
  runtime.talkState.revealed = text.length;
  $("speech-text").textContent = text;
  if (line.term) learnTerm(line.term);
  $("speech-hint").textContent =
    runtime.talkState.index === runtime.talkState.lines.length - 1 ? "대화 마치기" : "다음 이야기";
}

export function nextLine() {
  if (!runtime.talkState) return;
  const line = runtime.talkState.lines[runtime.talkState.index];
  if (line.dialing) return;
  if (runtime.talkState.revealed < (line.text ?? line).length) {
    revealLine();
    return;
  }
  runtime.talkState.index++;
  if (runtime.talkState.index < runtime.talkState.lines.length) {
    stopVoices();
    typeLine();
  } else {
    const done = runtime.talkState.onDone;
    stopTalk();
    done();
    if (!runtime.modalOpen) canvas.focus({ preventScroll: true });
  }
}
