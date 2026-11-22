import { deadlineEdited, pressDeadlineKey } from "../components/deadline.js";
import { keys, runtime } from "../core/runtime.js";
import { changeSoundSetting, playPaperTurn, stopEffects, stopVoices, syncMusic, unlockAudio } from "../audio/sound.js";
import { nextLine, revealLine } from "../components/dialogue.js";
import { liftOpening } from "../components/elevator.js";
import { close } from "../components/modal.js";
import { $ } from "../core/dom.js";
import { render, setNotebook } from "../components/hud.js";
import { go, interact, stepPlayer } from "../world/navigation.js";
import { canvas } from "../world/canvas.js";
import { handOverDocument, selectDocument } from "./submission.js";
import { actions } from "./actions.js";
import { save } from "../core/storage.js";
import { resizeWorld } from "../world/render.js";

export function physicalKey(e) {
  const code = { KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d", KeyQ: "q", KeyE: "e" }[e.code];
  return code || e.key.toLowerCase();
}

const doubleTapWindow = 300;
let lastMoveKey = null, lastMoveTime = -Infinity;

function pressMove(key, time) {
  if (keys.has(key)) return;
  if (runtime.pendingSubmission) close();
  runtime.runKey = key === lastMoveKey && time - lastMoveTime <= doubleTapWindow ? key : null;
  if (runtime.runKey) {
    const dx = ["d", "arrowright", "s", "arrowdown"].includes(key) ? 10 : -10;
    const dy = ["s", "arrowdown", "a", "arrowleft"].includes(key) ? 10 : -10;
    stepPlayer(dx, dy);
  }
  lastMoveKey = key;
  lastMoveTime = time;
  keys.add(key);
}

export function handleKey(e) {
  if (runtime.pendingSubmission && e.key === "Escape") {
    close();
    canvas.focus({preventScroll: true});
    return;
  }
  if (liftOpening()) { e.preventDefault(); return; }
  if (runtime.modalKind === "delivery-surprise") {
    e.preventDefault();
    return;
  }
  if (runtime.talkState && !runtime.modalOpen) {
    if (runtime.talkState.lines[runtime.talkState.index]?.dialing) {
      if (e.key === "Escape") actions["hang-up"]();
      return;
    }
    if (e.code === "Space" || e.key === "Enter") {
      e.preventDefault();
      if (!e.repeat) {
        unlockAudio();
        nextLine();
      }
    }
    return;
  }
  if (runtime.modalOpen) {
    if (e.key === "Escape" && !["advance", "feedback", "recovery"].includes(runtime.modalKind)) close();
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && e.target?.tagName !== "INPUT") {
      const options = [...$("modal").querySelectorAll(".decision-scene .choice")];
      if (options.length) {
        e.preventDefault();
        const index = options.indexOf(document.activeElement);
        const next = e.key === "ArrowDown" ? index + 1 : index < 0 ? -1 : index - 1;
        options[(next + options.length) % options.length].focus();
      }
    }
    if (e.key === "Tab") {
      const list = [...$("modal").querySelectorAll("button,a,input,select,summary")].filter(
          (el) => !el.disabled,
        ),
        first = list[0],
        end = list.at(-1);
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === $("modal"))
      ) {
        e.preventDefault();
        end?.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === end || document.activeElement === $("modal"))
      ) {
        e.preventDefault();
        first?.focus();
      }
    }
    return;
  }
  if (runtime.titleVisible) return;
  const k = physicalKey(e);
  if (k === "q") {
    e.preventDefault();
    if (!e.repeat) setNotebook($("quest-panel").hidden);
    return;
  }
  if (e.code === "Space" && ["BUTTON", "INPUT", "SELECT"].includes(e.target.tagName)) return;
  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "e"].includes(k) ||
    e.code === "Space"
  ) {
    e.preventDefault();
    if (k === "e" || e.code === "Space") {
      if (!e.repeat) {
        unlockAudio();
        interact();
      }
    } else {
      if (!e.repeat) pressMove(k, e.timeStamp ?? Date.now());
      runtime.target = null;
      canvas.focus({ preventScroll: true });
    }
  }
}

export function bindInput() {
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "deadline-form") return;
    e.preventDefault();
    if (runtime.modalKind === "intake") actions["intake-submit"]();
  });
  document.addEventListener("toggle", (e) => {
    if (e.target.open && e.target.matches?.(".decision-document")) playPaperTurn();
  }, true);
  document.addEventListener("dragstart", (e) => {
    const slot = e.target.closest("#bag [draggable=true]");
    if (!slot || !runtime.pendingSubmission) return;
    const item = Number(slot.dataset.action.slice(5));
    selectDocument(item, true);
    e.dataTransfer.setData("application/x-jodal-item", String(item));
    e.dataTransfer.effectAllowed = "move";
  });
  document.addEventListener("dragover", (e) => {
    if (e.target.closest("#handoff-tray") && e.dataTransfer.types.includes("application/x-jodal-item")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  });
  document.addEventListener("drop", (e) => {
    if (!e.target.closest("#handoff-tray") || !e.dataTransfer.types.includes("application/x-jodal-item")) return;
    e.preventDefault();
    if (e.dataTransfer.getData("application/x-jodal-item") === String(runtime.pendingSubmission?.selected))
      handOverDocument(true);
  });
  document.addEventListener("click", (e) => {
    if (runtime.modalKind === "delivery-surprise") {
      e.preventDefault();
      return;
    }
    const key = e.target.closest("[data-deadline-key]");
    if (key) {
      unlockAudio();
      pressDeadlineKey(key.dataset.deadlineKey);
      return;
    }
    const b = e.target.closest("[data-action]");
    if (b) {
      const a = b.dataset.action;
      if (runtime.talkState?.lines[runtime.talkState.index]?.dialing && a !== "hang-up") return;
      if (!$("first-day").hidden && runtime.talkState && a !== "talk-next") return;
      if (runtime.talkState && !runtime.modalOpen && !["hang-up", "talk-next", "sound", "glossary", "map"].includes(a)) return;
      unlockAudio();
      if (a.startsWith("go-")) go(a.slice(3));
      else if (actions[a]) actions[a]();
    }
    const m = e.target.closest("[data-move]");
    if (m && e.detail === 0 && !runtime.modalOpen && !runtime.talkState && !runtime.titleVisible) {
      runtime.target = null;
      const d = { left: [-18, 18], right: [18, -18], up: [-18, -18], down: [18, 18] }[
        m.dataset.move
      ];
      stepPlayer(d[0], d[1]);
    }
  });
  const releaseTouch = () => {
    if (runtime.touchKey) keys.delete(runtime.touchKey);
    runtime.touchKey = null;
  };
  document.addEventListener("pointerdown", (e) => {
    const control = e.target.closest("[data-move]");
    if (!control || runtime.modalOpen || runtime.talkState || runtime.titleVisible) return;
    e.preventDefault();
    releaseTouch();
    runtime.target = null;
    runtime.touchKey = { left: "arrowleft", right: "arrowright", up: "arrowup", down: "arrowdown" }[control.dataset.move];
    pressMove(runtime.touchKey, e.timeStamp ?? Date.now());
    control.setPointerCapture?.(e.pointerId);
  });
  document.addEventListener("pointerup", releaseTouch);
  document.addEventListener("pointercancel", releaseTouch);
  document.addEventListener("lostpointercapture", releaseTouch);
  document.addEventListener("change", (e) => {
    if (e.target.dataset?.sound) changeSoundSetting(e.target.dataset.sound, e.target.checked);
    if (e.target.id === "eligible") {
      runtime.state.eligibility = e.target.checked;
      save();
      render();
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "deadline-days" && !e.isComposing) deadlineEdited();
    if (e.target.id === "music-volume") changeSoundSetting("musicVolume", Number(e.target.value));
  });
  document.addEventListener("keydown", handleKey);
  document.addEventListener("keyup", (e) => keys.delete(physicalKey(e)));
  window.addEventListener("blur", () => {
    keys.clear();
    releaseTouch();
    lastMoveKey = null;
    revealLine();
    stopVoices();
  });
  window.addEventListener("resize", resizeWorld);
  document.addEventListener("visibilitychange", () => {
    syncMusic();
    if (document.hidden) {
      keys.clear();
      releaseTouch();
      lastMoveKey = null;
      revealLine();
      stopVoices();
      stopEffects();
    }
  });
}
