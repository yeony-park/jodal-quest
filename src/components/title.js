import { showRecovery } from "../game/recovery.js";
import { LAST_STAGE } from "../data/quests.js";
import { keys, player, runtime } from "../core/runtime.js";
import { $ } from "../core/dom.js";
import { face } from "../world/characters.js";
import { unlockAudio } from "../audio/sound.js";
import { stopTalk } from "./dialogue.js";
import { close } from "./modal.js";
import { fresh } from "../data/initial-state.js";
import { save } from "../core/storage.js";
import { render, setNotebook } from "./hud.js";
import { tutorial } from "../game/quests.js";
import { result } from "./ending.js";

export function intro() {
  runtime.titleVisible = true;
  $("title-screen").hidden = false;
  $("continue-button").hidden = !runtime.loaded;
  $("title-chars").innerHTML = face() + face("mentor");
  document.body.classList.add("title-mode");
  $("game-shell").inert = true;
}

export function startGame(isNew) {
  unlockAudio();
  stopTalk();
  runtime.pendingSubmission=null;
  runtime.submittedSteps.clear();
  close();
  if (isNew) {
    runtime.state = fresh();
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
  if (!isNew && runtime.floor === 1) {
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
  else if (runtime.state.stage === 0 && !runtime.state.brief) tutorial();
  else if (runtime.state.stage === LAST_STAGE) result();
}
