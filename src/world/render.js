import { MAP_H, MAP_W, TILE, furnishings, spots } from "../data/world.js";
import { canvas, ctx } from "./canvas.js";
import { player, runtime } from "../core/runtime.js";
import { pixelPerson } from "./characters.js";
import { nextTarget } from "../game/quests.js";
import { $ } from "../core/dom.js";

export function project(x, y, z = 0) {
  return { x: 426 + ((x - y) / TILE) * 22, y: 102 + ((x + y) / TILE) * 11 - z };
}

export function polygon(points, color, stroke) {
  ctx.beginPath();
  points.forEach((p, i) =>
    i ? ctx.lineTo(Math.round(p.x), Math.round(p.y)) : ctx.moveTo(Math.round(p.x), Math.round(p.y)),
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function tile(x, y, color) {
  polygon(
    [
      project(x * TILE, y * TILE),
      project((x + 1) * TILE, y * TILE),
      project((x + 1) * TILE, (y + 1) * TILE),
      project(x * TILE, (y + 1) * TILE),
    ],
    color,
    "#82938b33",
  );
}

export function box(x, y, w, h, z, top = "#c5cbbd", left = "#899e91", right = "#72877e") {
  const a = project(x * TILE, y * TILE),
    b = project((x + w) * TILE, y * TILE),
    c = project((x + w) * TILE, (y + h) * TILE),
    d = project(x * TILE, (y + h) * TILE),
    up = (p) => ({ x: p.x, y: p.y - z });
  polygon([d, c, up(c), up(d)], left);
  polygon([b, c, up(c), up(b)], right);
  polygon([up(a), up(b), up(c), up(d)], top);
}

export function drawFurniture(o) {
  if (o.type === "shelf") {
    box(o.x, o.y, o.w, o.h, 41, "#b6c4b8", "#758e86", "#536e69");
    const p = project((o.x + 0.1) * TILE, (o.y + o.h) * TILE, 26);
    for (let i = 0; i < Math.round(o.w * 5); i++) {
      ctx.fillStyle = ["#c58a69", "#e0c378", "#759aaf", "#9caf81"][i % 4];
      ctx.fillRect(Math.round(p.x + i * 5), Math.round(p.y + i * 2.5), 3, 10);
    }
    return;
  }
  if (o.type === "plant") {
    box(o.x + 0.15, o.y + 0.15, 0.65, 0.65, 13, "#d2a876", "#96704b", "#73563f");
    const p = project((o.x + 0.5) * TILE, (o.y + 0.5) * TILE, 30);
    ctx.fillStyle = "#4e7c53";
    ctx.fillRect(p.x - 8, p.y - 8, 16, 20);
    ctx.fillStyle = "#7a9e64";
    ctx.fillRect(p.x - 12, p.y - 2, 24, 8);
    return;
  }
  box(o.x + 0.08, o.y + 0.08, o.w - 0.16, o.h - 0.16, 19, "#dfc695", "#ad8c68", "#92724e");
  if (o.type === "table") return;
  const p = project((o.x + 0.5) * TILE, (o.y + 0.5) * TILE, 21);
  if (o.type === "phone") {
    ctx.fillStyle = "#2f5356";
    ctx.fillRect(p.x - 9, p.y - 8, 18, 9);
    ctx.fillRect(p.x - 12, p.y - 12, 24, 5);
    return;
  }
  ctx.fillStyle = "#263e4d";
  ctx.fillRect(p.x - 12, p.y - 22, 24, 19);
  ctx.fillStyle = "#87c4c3";
  ctx.fillRect(p.x - 9, p.y - 19, 18, 12);
  ctx.fillStyle = "#d0f1da";
  ctx.fillRect(p.x - 7, p.y - 17, 12, 2);
  ctx.fillRect(p.x - 7, p.y - 12, 8, 2);
  ctx.fillStyle = "#51676c";
  ctx.fillRect(p.x - 2, p.y - 3, 4, 5);
  ctx.fillRect(p.x - 8, p.y + 1, 16, 3);
  if (o.w > 1) {
    const q = project((o.x + 1.45) * TILE, (o.y + 0.6) * TILE, 21);
    ctx.fillStyle = "#fff1c8";
    ctx.fillRect(q.x - 8, q.y - 8, 16, 10);
    ctx.fillStyle = "#b1ad8a";
    ctx.fillRect(q.x - 5, q.y - 5, 10, 2);
  }
}

export function roomLabel(label, x, y) {
  const p = project(x * TILE, y * TILE);
  ctx.fillStyle = "#f7f4ddd9";
  ctx.fillRect(Math.round(p.x - 43), Math.round(p.y - 10), 86, 17);
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#527060";
  ctx.fillText(label, Math.round(p.x), Math.round(p.y + 2));
}

export function draw(t, moving) {
  camera();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#738e84";
  ctx.fillRect(0, 0, 940, 620);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = i % 2 ? "#78958a" : "#6c877e";
    ctx.fillRect((i * 137) % 940, (i * 83) % 620, 2, 2);
  }
  polygon(
    [
      project(0, 0),
      project(MAP_W * TILE, 0),
      project(MAP_W * TILE, MAP_H * TILE),
      project(0, MAP_H * TILE),
    ].map((p) => ({ x: p.x, y: p.y + 8 })),
    "#385a54",
  );
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++) {
      const corridor = (y >= 6 && y <= 8) || x === 5 || x === 11;
      tile(
        x,
        y,
        corridor ? ((x + y) % 2 ? "#b8c6bb" : "#c0cec2") : (x + y) % 2 ? "#d6d9c7" : "#dcdccc",
      );
    }
  box(0, 0, 18, 0.12, 37, "#e0e5d0", "#b6c2b2", "#9cae9f");
  box(0, 0, 0.12, 14, 37, "#e0e5d0", "#b6c2b2", "#9cae9f");
  for (const x of [5, 11]) {
    box(x, 0, 0.18, 5, 28, "#e0dfca", "#b8bdab", "#96aa9a");
    box(x, 10, 0.18, 4, 18, "#dedfc8", "#aebca8", "#91a48f");
  }
  for (const y of [5, 9]) {
    for (let x = 0; x < 18; x++)
      if (![2, 8, 14].includes(x))
        box(x, y, 1, 0.13, y === 5 ? 17 : 10, "#dce1cd", "#a3b5a7", "#93a994");
  }
  roomLabel("0505 공사원가", 2.5, 1);
  roomLabel("0506 보건의료", 8.5, 1);
  roomLabel("0507 전기전자", 14.5, 1);
  roomLabel("0504 구매총괄", 2.5, 13);
  roomLabel("0503 조달개혁", 8.5, 13);
  roomLabel("0502 건설환경", 14.5, 13);
  const objects = furnishings.map((o) => ({
    depth: (o.x + o.y + o.w + o.h) * TILE,
    draw: () => drawFurniture(o),
  }));
  if (runtime.state.stage !== 3) {
    objects.push({
      depth: spots.mentor.x + spots.mentor.y,
      draw: () => pixelPerson(spots.mentor.x, spots.mentor.y - 12, "mentor"),
    });
    objects.push({
      depth: spots.supplier.x + spots.supplier.y,
      draw: () => pixelPerson(spots.supplier.x, spots.supplier.y, "supplier"),
    });
  }
  objects.push({
    depth: player.x + player.y,
    draw: () =>
      pixelPerson(player.x, player.y, runtime.state.stage === 3 ? "supplier" : "rookie", moving),
  });
  objects.sort((a, b) => a.depth - b.depth).forEach((o) => o.draw());
  const dest = spots[nextTarget()];
  if (dest && !runtime.modalOpen && !runtime.talkState) {
    const p = project(dest.x, dest.y);
    ctx.strokeStyle = "#ffe58a";
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(p.x - 15), Math.round(p.y - 7), 30, 11);
  }
  const p = project(player.x, player.y);
  ctx.fillStyle = "#fff4d7";
  ctx.fillRect(Math.round(p.x - 28), Math.round(p.y + 7), 56, 15);
  ctx.fillStyle = "#3e6359";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    runtime.state.stage === 3 ? "욘 대리" : "조달달",
    Math.round(p.x),
    Math.round(p.y + 18),
  );
}

export function resizeWorld() {
  runtime.view.width = window.innerWidth;
  runtime.view.height = window.innerHeight;
  runtime.view.dpr = 0.65;
  canvas.width = Math.ceil(runtime.view.width * runtime.view.dpr);
  canvas.height = Math.ceil(runtime.view.height * runtime.view.dpr);
}

export function camera() {
  runtime.view.scale = Math.max(runtime.view.width / 940, runtime.view.height / 620);
  const w = runtime.view.width / runtime.view.scale,
    h = runtime.view.height / runtime.view.scale,
    p = project(player.x, player.y);
  runtime.view.x = Math.max(0, Math.min(940 - w, (runtime.titleVisible ? 470 : p.x) - w / 2));
  runtime.view.y = Math.max(0, Math.min(620 - h, (runtime.titleVisible ? 310 : p.y) - h * 0.55));
  ctx.setTransform(
    runtime.view.dpr * runtime.view.scale,
    0,
    0,
    runtime.view.dpr * runtime.view.scale,
    -runtime.view.x * runtime.view.dpr * runtime.view.scale,
    -runtime.view.y * runtime.view.dpr * runtime.view.scale,
  );
}

export function updateMap() {
  for (const [id, s] of Object.entries(spots)) {
    const el = $("spot-" + id),
      p = project(s.x, s.y, id === "doc" ? 88 : 65);
    if (id === "mentor") {
      p.x += 60;
      p.y += 7;
    }
    el.style.left = (p.x - runtime.view.x) * runtime.view.scale + "px";
    el.style.top = (p.y - runtime.view.y) * runtime.view.scale + "px";
  }
  $("mini-player").setAttribute("cx", 10 + (player.x / (MAP_W * TILE)) * 168);
  $("mini-player").setAttribute("cy", 8 + (player.y / (MAP_H * TILE)) * 96);
  const next = spots[nextTarget()];
  $("mini-target").style.display = next ? "" : "none";
  if (next) {
    $("mini-target").setAttribute("cx", 10 + (next.x / (MAP_W * TILE)) * 168);
    $("mini-target").setAttribute("cy", 8 + (next.y / (MAP_H * TILE)) * 96);
  }
}
