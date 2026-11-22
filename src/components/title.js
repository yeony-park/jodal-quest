import { showRecovery } from "../game/recovery.js";
import { LAST_STAGE } from "../data/quests.js";
import { keys, player, runtime } from "../core/runtime.js";
import { $ } from "../core/dom.js";
import { face } from "../world/characters.js";
import { stopTitleCall, playTitleIntro, unlockAudio } from "../audio/sound.js";
import { nextLine, revealLine, speak, stopTalk } from "./dialogue.js";
import { close } from "./modal.js";
import { fresh } from "../data/initial-state.js";
import { save } from "../core/storage.js";
import { render, setNotebook } from "./hud.js";
import { playLiftArrival, stopLiftArrival } from "./elevator.js";
import { spots } from "../data/world.js";
import { tutorial } from "../game/quests.js";
import { result } from "./ending.js";

export function intro() {
  runtime.titleVisible = true;
  $("title-screen").hidden = false;
  $("continue-button").hidden = !runtime.loaded;
  $("title-chars").innerHTML = face() + face("mentor");
  document.body.classList.add("title-mode");
  const gate = $("title-enter"), screen = $("title-screen");
  function beginIntro(fromGesture = false) {
    playTitleIntro(() => {
      const hadFocus = document.activeElement === gate;
      gate.hidden = true;
      screen.classList.add("intro-playing");
      if (hadFocus) $("title-start").focus();
    }, fromGesture);
  }
  gate.onclick = () => beginIntro(true);
  beginIntro();
  gate.hidden = !runtime.audioCtx || runtime.audioCtx.state === "running" || screen.classList.contains("intro-playing");
  if (!gate.hidden) gate.focus();
  document.addEventListener("visibilitychange", () => {
    if (runtime.titleVisible && !document.hidden) beginIntro();
  });
  $("game-shell").inert = true;
}

export function startGame(isNew) {
  unlockAudio();
  stopTitleCall();
  stopLiftArrival();
  stopTalk();
  runtime.pendingSubmission=null;
  runtime.submittedSteps.clear();
  close();
  if (isNew) {
    runtime.state = fresh();
    runtime.lastXP = "";
    runtime.floor = 0;
    runtime.target = null;
    runtime.state.started = true;
    runtime.loaded = true;
    player.x = 464;
    player.y = 144;
    runtime.portalSignedIn = false;
    save();
  }
  keys.clear();
  runtime.target = null;
  if (!isNew && runtime.state.stage === 3) {
    player.x = spots.supplier.npcX;
    player.y = spots.supplier.npcY;
  } else if (!isNew && runtime.floor !== 0) {
    player.x = 48;
    player.y = 240;
  }
  runtime.titleVisible = false;
  $("title-screen").hidden = true;
  document.body.classList.remove("title-mode");
  $("game-shell").inert = false;
  setNotebook(false);
  render();
  if (runtime.state.pendingRecovery) showRecovery();
  else if (runtime.state.stage === 0 && !runtime.state.brief) {
    const meetMentor = () => {
      player.x = spots.mentor.x;
      player.y = spots.mentor.y;
      if (isNew) playLiftArrival("5F", tutorial);
      else tutorial();
    };
    if (!isNew) { meetMentor(); return; }
    speak("조달달", [{text: "오늘은 첫 출근날..! 잘 해보자!"}], meetMentor, "rookie");
    $("first-day").hidden = false;
    runtime.arrivalTimer = setTimeout(() => {
      if (!document.hidden && !$("first-day").hidden) { revealLine(); nextLine(); }
    }, 4100);
  }
  else if (runtime.state.stage === LAST_STAGE) result();
}
