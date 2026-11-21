import { MAP_H, MAP_W, TILE, furnishings, spots } from "../data/world.js";
import { keys, player, runtime } from "../core/runtime.js";
import { result } from "../components/ending.js";
import { close, toast } from "../components/modal.js";
import { setNotebook } from "../components/hud.js";
import { actions } from "../game/actions.js";
import { draw, updateMap } from "./render.js";

export function cellBlocked(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
  if ((x === 5 || x === 11) && (y < 6 || y > 8)) return true;
  if ((y === 5 || y === 9) && ![2, 8, 14].includes(x)) return true;
  return furnishings.some((o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);
}

export function canWalk(x, y) {
  return !cellBlocked(Math.floor(x / TILE), Math.floor(y / TILE));
}

export function routeTo(id) {
  const goal = spots[id],
    sx = Math.floor(player.x / TILE),
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
    result();
    return;
  }
  if (!runtime.state.started || runtime.titleVisible || runtime.talkState) return;
  close();
  setNotebook(false);
  keys.clear();
  const path = routeTo(id);
  if (!path.length) {
    toast("복도를 따라 가까이 이동해 주세요.");
    return;
  }
  runtime.target = { id, path, index: 0 };
}

export function stepPlayer(dx, dy) {
  if (canWalk(player.x + dx, player.y)) player.x += dx;
  if (canWalk(player.x, player.y + dy)) player.y += dy;
}

export function interact() {
  let closest = null,
    distance = Infinity;
  for (const [id, p] of Object.entries(spots)) {
    if (runtime.state.stage === 3 && ["mentor", "phone", "supplier"].includes(id)) continue;
    const d = Math.hypot(player.x - p.x, player.y - p.y);
    if (d < distance) {
      distance = d;
      closest = id;
    }
  }
  if (distance < 55) actions[closest]();
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
        step = 145 * dt;
      if (d < step + 1) {
        player.x = dest.x;
        player.y = dest.y;
        runtime.target.index++;
        if (runtime.target.index === runtime.target.path.length) {
          const id = runtime.target.id;
          runtime.target = null;
          actions[id]();
        }
      } else {
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
        stepPlayer((dx / n) * 105 * dt, (dy / n) * 105 * dt);
        moving = true;
      }
    }
  }
  if (moving) runtime.walk += dt * 12;
  draw(t, moving);
  updateMap();
  requestAnimationFrame(frame);
}
