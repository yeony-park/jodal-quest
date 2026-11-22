import { footstep } from "../audio/sound.js";
import { MAP_H, MAP_W, TILE, floorForScene, floors, spotOnFloor, spots } from "../data/world.js";
import { keys, player, runtime } from "../core/runtime.js";
import { result } from "../components/ending.js";
import { close, toast } from "../components/modal.js";
import { setNotebook } from "../components/hud.js";
import { nextTarget } from "../game/quests.js";
import { actions } from "../game/actions.js";
import { draw, updateMap } from "./render.js";
import { LAST_STAGE } from "../data/quests.js";

export const MOVE_SPEED = 145;

export function spotNearby(id) {
  const spot = spotOnFloor(id, runtime.floor);
  return spotActive(id) && Math.hypot(player.x - spot.x, player.y - spot.y) <= 2 * TILE;
}

export function cellBlocked(x, y, floor = runtime.floor) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
  const f = floorForScene(floor, runtime.state.stage);
  for (const p of f.partitions) {
    if (p.axis === "h" && y === p.at && x >= p.from && x < p.to && !p.doors.includes(x))
      return true;
    if (p.axis === "v" && x === p.at && y >= p.from && y < p.to) return true;
  }
  return f.furnishings.some((o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);
}

export function canWalk(x, y) {
  return !cellBlocked(Math.floor(x / TILE), Math.floor(y / TILE));
}

// 기업 단계(욘 대리)는 별도 사무실이라 책상과 모니터만 씁니다.
export function spotActive(id) {
  const spot = spots[id];
  if (!spot) return false;
  if (runtime.state.stage === 3) return id === "doc" || id === "terminal";
  if (id === "cabinet" && floors[runtime.floor].guide) return false;
  return spot.floor === undefined || spot.floor === runtime.floor;
}

// 목표가 다른 층에 있으면 엘리베이터를 먼저 안내합니다.
export function guideTarget(id) {
  const spot = spots[id];
  return spot && !spotActive(id) && runtime.state.stage !== 3 ? "elevator" : id;
}

export function routeTo(id) {
  const goal = spotOnFloor(id, runtime.floor);
  if (!goal) return [];
  const sx = Math.floor(player.x / TILE),
    sy = Math.floor(player.y / TILE),
    gx = Math.floor(goal.x / TILE),
    gy = Math.floor(goal.y / TILE),
    queue = [[sx, sy]],
    seen = new Map([[sx + "," + sy, null]]);
  let reached = false;
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (x === gx && y === gy) {
      reached = true;
      break;
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        key = nx + "," + ny;
      if (!cellBlocked(nx, ny) && !seen.has(key)) {
        seen.set(key, [x, y]);
        queue.push([nx, ny]);
      }
    }
  }
  if (!reached) return [];
  const path = [];
  let cell = [gx, gy];
  while (cell) {
    path.unshift({ x: (cell[0] + 0.5) * TILE, y: (cell[1] + 0.5) * TILE });
    cell = seen.get(cell.join(","));
  }
  return path;
}

export function go(id) {
  if (id === "result") {
    if (runtime.state.stage === LAST_STAGE) result();
    return;
  }
  if (!runtime.state.started || runtime.titleVisible || runtime.talkState) return;
  close();
  setNotebook(false);
  keys.clear();
  if (!spotActive(id)) {
    const next = guideTarget(id);
    if (next === id || !floors[spots[id]?.floor]) return;
    toast(`${floors[spots[id].floor].level}에 있어요. 엘리베이터로 이동합니다.`);
    id = next;
  }
  const path = routeTo(id);
  if (!path.length) {
    toast("복도를 따라 가까이 이동해 주세요.");
    return;
  }
  runtime.target = { id, path, index: 0 };
}

let stride = 0;

function trackSteps(distance) {
  stride += distance;
  if (stride >= 46) {
    stride %= 46;
    footstep();
  }
}

export function stepPlayer(dx, dy) {
  const x = player.x, y = player.y;
  if (canWalk(player.x + dx, player.y)) player.x += dx;
  if (canWalk(player.x, player.y + dy)) player.y += dy;
  const distance = Math.hypot(player.x - x, player.y - y);
  trackSteps(distance);
  return distance > 0;
}

export function interactionTarget() {
  const goal = guideTarget(nextTarget());
  if (spots[goal] && spotActive(goal) && Math.hypot(player.x - spots[goal].x, player.y - spots[goal].y) < 55)
    return goal;
  let closest = null,
    distance = Infinity;
  for (const id of Object.keys(spots)) {
    if (!spotActive(id)) continue;
    const p = spotOnFloor(id, runtime.floor);
    const d = Math.hypot(player.x - p.x, player.y - p.y);
    if (d < distance) {
      distance = d;
      closest = id;
    }
  }
  return distance < 55 ? closest : null;
}

export function interact() {
  const id = interactionTarget();
  if (id) actions[id]();
  else toast("사람이나 모니터 가까이 다가가 주세요.");
}

export function frame(t) {
  const dt = Math.min((t - runtime.last) / 1000, 0.035) || 0;
  runtime.last = t;
  let moving = false;
  if (!runtime.modalOpen && !runtime.talkState && !runtime.titleVisible && runtime.state.started) {
    if (runtime.target) {
      const dest = runtime.target.path[runtime.target.index],
        dx = dest.x - player.x,
        dy = dest.y - player.y,
        d = Math.hypot(dx, dy),
        step = MOVE_SPEED * dt;
      if (d < step + 1) {
        trackSteps(d);
        player.x = dest.x;
        player.y = dest.y;
        runtime.target.index++;
        if (runtime.target.index === runtime.target.path.length) {
          const id = runtime.target.id;
          runtime.target = null;
          actions[id]();
        }
      } else {
        trackSteps(step);
        player.x += (dx / d) * step;
        player.y += (dy / d) * step;
        moving = true;
      }
    } else {
      let sx =
          Number(keys.has("d") || keys.has("arrowright")) -
          Number(keys.has("a") || keys.has("arrowleft")),
        sy =
          Number(keys.has("s") || keys.has("arrowdown")) -
          Number(keys.has("w") || keys.has("arrowup"));
      if (sx || sy) {
        let dx = sx + sy,
          dy = sy - sx,
          n = Math.hypot(dx, dy);
        const speed = keys.has(runtime.runKey) ? MOVE_SPEED * 1.85 : MOVE_SPEED;
        moving = stepPlayer((dx / n) * speed * dt, (dy / n) * speed * dt);
      }
    }
  }
  if (moving) runtime.walk += dt * (keys.has(runtime.runKey) ? 22 : 12);
  draw(t, moving);
  updateMap();
  requestAnimationFrame(frame);
}
