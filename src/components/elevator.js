import { elevatorChime } from "../audio/sound.js";
import { $ } from "../core/dom.js";

let doors = null;

export function liftOpening() {
  return doors !== null;
}

export function stopLiftArrival() {
  if (!doors) return;
  for (const animation of doors) animation.cancel();
  doors = null;
  $("lift-arrival").hidden = true;
  $("game-shell").inert = false;
}

export function playLiftArrival(level, onOpen = () => {}) {
  stopLiftArrival();
  elevatorChime();
  const left = $("lift-left"), right = $("lift-right");
  if (!left.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    onOpen();
    return;
  }
  $("lift-indicator").textContent = level;
  $("lift-arrival").hidden = false;
  $("game-shell").inert = true;
  const timing = {delay: 900, duration: 900, easing: "ease-in-out", fill: "both"};
  doors = [left, right].map((door, i) => door.animate(
    [{transform: "translateX(0)"}, {transform: i ? "translateX(100%)" : "translateX(-100%)"}], timing));
  doors[0].onfinish = () => {
    stopLiftArrival();
    onOpen();
  };
}
