import { keys, runtime } from "../core/runtime.js";
import { changeSoundSetting, stopEffects, stopVoices, syncMusic, unlockAudio } from "../audio/sound.js";
import { nextLine, revealLine } from "../components/dialogue.js";
import { close } from "../components/modal.js";
import { $ } from "../core/dom.js";
import { render, setNotebook } from "../components/hud.js";
import { go, interact, stepPlayer } from "../world/navigation.js";
import { canvas } from "../world/canvas.js";
import { actions } from "./actions.js";
import { save } from "../core/storage.js";
import { resizeWorld } from "../world/render.js";

export function physicalKey(e) {
  const code = { KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d", KeyQ: "q", KeyE: "e" }[e.code];
  return code || e.key.toLowerCase();
}

export function handleKey(e) {
  if (runtime.talkState && !runtime.modalOpen) {
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
    if (e.key === "Tab") {
      const list = [...$("modal").querySelectorAll("button,a,input,select")].filter(
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
      keys.add(k);
      runtime.target = null;
      canvas.focus({ preventScroll: true });
    }
  }
}

export function bindInput() {
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (b) {
      const a = b.dataset.action;
      if (runtime.talkState && !runtime.modalOpen && !["talk-next", "sound", "glossary", "map"].includes(a)) return;
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
    keys.add(runtime.touchKey);
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
    if (e.target.id === "music-volume") changeSoundSetting("musicVolume", Number(e.target.value));
  });
  document.addEventListener("keydown", handleKey);
  document.addEventListener("keyup", (e) => keys.delete(physicalKey(e)));
  window.addEventListener("blur", () => {
    keys.clear();
    releaseTouch();
    revealLine();
    stopVoices();
  });
  window.addEventListener("resize", resizeWorld);
  document.addEventListener("visibilitychange", () => {
    syncMusic();
    if (document.hidden) {
      keys.clear();
      releaseTouch();
      revealLine();
      stopVoices();
      stopEffects();
    }
  });
}
