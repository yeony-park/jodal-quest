import { MAP_H, MAP_W, TILE, floorForScene, floors, spotOnFloor, spots } from "../data/world.js";
import { canvas, ctx } from "./canvas.js";
import { player, runtime } from "../core/runtime.js";
import { pixelPerson, rookieOutfit, spriteSheet } from "./characters.js";
import { nextTarget } from "../game/quests.js";
import { guideTarget, interactionTarget, spotActive, spotNearby } from "./navigation.js";
import { outlineRect } from "./contrast.js";
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

export function box(x, y, w, h, z, top = "#c5cbbd", left = "#899e91", right = "#72877e", bottom = 0) {
  const a = project(x * TILE, y * TILE),
    b = project((x + w) * TILE, y * TILE),
    c = project((x + w) * TILE, (y + h) * TILE),
    d = project(x * TILE, (y + h) * TILE),
    up = (p) => ({ x: p.x, y: p.y - z });
  const base = (p) => ({ x: p.x, y: p.y - bottom });
  polygon([base(d), base(c), up(c), up(d)], left);
  polygon([base(b), base(c), up(c), up(b)], right);
  polygon([up(a), up(b), up(c), up(d)], top);
}

const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");

function drawDeskWorker(p, activity) {
  const time = reduceMotion?.matches ? 0 : runtime.last;
  const typing = activity === "typing";
  const sigh = !typing && time % 5300 > 3500;
  const x = Math.round(p.x + 18), y = Math.round(p.y);
  ctx.fillStyle = "#697778";
  ctx.fillRect(x - 6, y - 19, 18, 20);
  ctx.fillRect(x + 3, y, 3, 7);
  ctx.drawImage(spriteSheet(typing ? "typist" : "reviewer"), 0, 0, 16, 19,
    x - 13, y - 38 + (sigh ? 3 : 0), 28, 34);
  ctx.fillStyle = "#677979";
  ctx.fillRect(x - 23, y - 3, 19, 5);
  const beat = typing ? Math.floor(time / 150) % 2 : 0;
  ctx.fillStyle = "#efba8d";
  ctx.fillRect(x - 16, y - 6 + beat * 2, 5, 4);
  ctx.fillRect(x - 8, y - 5 - beat * 2, 5, 4);
  if (sigh) {
    ctx.fillStyle = "#fffcf0";
    ctx.fillRect(x + 7, y - 48, 25, 13);
    ctx.fillRect(x + 8, y - 35, 4, 3);
    ctx.fillStyle = "#536168";
    ctx.textAlign = "center";
    ctx.font = "10px monospace";
    ctx.fillText("후…", x + 19, y - 38);
  }
}

export function drawFurniture(o) {
  if (o.type === "projection" || o.type === "window") {
    // Wall-mounted details follow the same vanishing lines as the back wall.
    const panel = (u, bottom, width, height, color) => {
      const point = (a, z) => project((o.x + a) * TILE, (o.y + .6) * TILE, z);
      polygon([point(u,bottom), point(u+width,bottom), point(u+width,bottom+height), point(u,bottom+height)], color);
    };
    if (o.type === "window") {
      panel(0, 17, o.w, 40, "#73938e");
      panel(.1, 19, o.w-.2, 36, "#c6e6e5");
      const skyline = [8, 14, 10, 17, 12, 9, 14, 7, 11, 15, 8, 12];
      skyline.forEach((h, i) => panel(.15 + i*.55, 19, .49, h, i%2 ? "#a7c9c4" : "#b2d0cb"));
      for (let u = 1; u < o.w; u++) panel(u, 18, .08, 38, "#789993");
      panel(0, 16, o.w, 3, "#dfccaf");
      return;
    }
    panel(0, 1, o.w, 66, "#8d695b");
    for (let u = .1; u < o.w; u += .24) panel(u, 1, .07, 64, "#c69879");
    panel(.72, 13, 4.6, 50, "#385357");
    panel(.83, 17, 4.38, 42, "#f4f4dd");
    panel(1.06, 48, 2.5, 4, "#53847d");
    panel(1.06, 40, 1.25, 2, "#a9c6ba");
    panel(1.06, 34, 1.62, 2, "#a9c6ba");
    [9, 16, 22].forEach((height, i) => panel(3.1 + i * .55, 22, .35, height, ["#d29b82", "#87b7ae", "#568981"][i]));
    return;
  }
  if (o.type === "conference") {
    const {x, y} = o;
    const chair = (a, b, front) => {
      box(a+.16, b+.17, .24, .28, 7, "#69766d", "#6c776f", "#536863");
      box(a, b, .61, .54, 12, "#a1c6b7", "#648c80", "#567a73", 9);
      box(a, b+(front ? .42 : 0), .61, .12, 23, "#8db5a4", "#638a7d", "#4c726b", 12);
    };
    for (let i = 0; i < 4; i++) chair(x+.6+i*1.35, y+.1, false);
    box(x+.75, y+1.1, 4.5, .74, 16, "#bd977c", "#947664", "#806658");
    box(x+.24, y+.77, 5.52, 1.42, 22, "#e8c5a1", "#bd957b", "#a9826c", 18);
    box(x+.6, y+1.35, 4.8, .22, 23, "#72978a", "#79988a", "#75988b", 22);
    for (const offset of [.7, 2.1, 4.8]) {
      box(x+offset, y+1.76, .44, .26, 23, "#fff7df", "#ded4b9", "#c5bca9", 22);
      box(x+offset+.08, y+1.83, .22, .03, 24, "#a3aea0", "#a3aea0", "#a3aea0", 23);
    }
    for (const offset of [1.55, 3.8]) {
      box(x+offset, y+.93, .46, .32, 23, "#829698", "#667b80", "#596e72", 22);
      box(x+offset, y+.93, .46, .06, 29, "#566e72", "#a6cec6", "#536a71", 23);
    }
    for (let i = 0; i < 4; i++) chair(x+.6+i*1.35, y+2.39, true);
    return;
  }
  if (o.type === "lounge") {
    box(o.x, o.y, 3.2, .85, 12, "#e4b59e", "#c5917e", "#ab796b");
    box(o.x, o.y, 3.2, .2, 22, "#eac8af", "#cf9e87", "#b58371");
    for (let i = 0; i < 3; i++) box(o.x+.12+i, o.y+.24, .94, .5, 15, "#f1d3bd", "#d9ac94", "#c49583", 12);
    box(o.x+.8, o.y+1.3, 1.72, .55, 9, "#b38e72", "#967459", "#826352");
    box(o.x+1.1, o.y+1.42, .46, .24, 11, "#90a9a1", "#758f84", "#69847b", 9);
    return;
  }
  if (o.type === "coffee") {
    const {x, y} = o;
    box(x, y, 3, 1, 19, "#dcb99c", "#b98b70", "#a47761");
    box(x+.15, y+.1, 2.7, .8, 21, "#f2e2c4", "#c7ac8d", "#b39b82", 19);
    box(x+.3, y+.17, .75, .52, 30, "#647575", "#465656", "#394b4c", 21);
    box(x+.48, y+.5, .25, .23, 25, "#faf1d9", "#d5c6ae", "#bfac97", 21);
    for (const a of [1.5, 1.9, 2.3]) box(x+a, y+.44, .18, .2, 24, "#fff6dc", "#cfc4a8", "#bfb09a", 21);
    return;
  }
  if (o.type === "cabinet") {
    box(o.x, o.y, o.w, o.h, 34, "#eadbbf", "#a08b78", "#786d70");
    const opened = runtime.state.learnedTerms.includes(floors[runtime.floor].term);
    for (const z of [6, 17, 28]) {
      const shift = opened && z === 28 ? 0.20 : 0;
      box(o.x + 0.08, o.y + 0.94 + shift, 0.84, 0.12, z, "#e4cdb0", "#c5ae95", "#948579");
      const p = project((o.x + 0.48) * TILE, (o.y + 1.08 + shift) * TILE, z - 3);
      ctx.fillStyle = "#574b4a";
      ctx.fillRect(Math.round(p.x) - 3, Math.round(p.y), 7, 2);
    }
    return;
  }
  if (o.type === "shelf") {
    box(o.x, o.y, o.w, o.h, 41, "#d4dee8", "#a0b8c4", "#839ca5");
    const p = project((o.x + 0.1) * TILE, (o.y + o.h) * TILE, 26);
    for (let i = 0; i < Math.round(o.w * 5); i++) {
      ctx.fillStyle = ["#c58a69", "#e0c378", "#759aaf", "#9caf81"][i % 4];
      ctx.fillRect(Math.round(p.x + i * 5), Math.round(p.y + i * 2.5), 3, 10);
    }
    return;
  }
  if (o.type === "display") {
    box(o.x, o.y, o.w, o.h, 18, "#f4e5c8", "#c8afa0", "#aa948a");
    box(o.x + .22, o.y + .15, o.w - .44, .68, 30, "#e1f5f2", "#b4d8d8", "#91bdc1");
    const p = project((o.x + o.w / 2) * TILE, (o.y + .6) * TILE, 32);
    polygon([{x:p.x-6,y:p.y}, {x:p.x-4,y:p.y-9}, {x:p.x+4,y:p.y-9}, {x:p.x+6,y:p.y}], "#c58166");
    return;
  }
  if (o.type === "plant") {
    box(o.x + 0.15, o.y + 0.15, 0.65, 0.65, 13, "#d2a876", "#96704b", "#73563f");
    const p = project((o.x + 0.5) * TILE, (o.y + 0.5) * TILE, 30);
    if (o.variety === "palm") {
      ctx.fillStyle = "#82684e";
      ctx.fillRect(p.x - 2, p.y - 12, 4, 30);
      for (const side of [-1, 1]) {
        polygon([{x:p.x,y:p.y-8}, {x:p.x+side*8,y:p.y-16}, {x:p.x+side*18,y:p.y-13}, {x:p.x+side*21,y:p.y-4}], "#618c76");
        polygon([{x:p.x,y:p.y-8}, {x:p.x+side*10,y:p.y-9}, {x:p.x+side*14,y:p.y+8}], "#86ae88");
      }
      return;
    }
    if (o.variety === "flowers") {
      for (const [dx, dy, color] of [[-7,3,"#cc8492"],[1,-3,"#e2a468"],[8,1,"#aa91ba"]]) {
        ctx.fillStyle = "#678b71";
        ctx.fillRect(p.x + dx, p.y + dy, 2, 14);
        ctx.fillStyle = color;
        ctx.fillRect(p.x + dx - 3, p.y + dy - 2, 8, 5);
        ctx.fillRect(p.x + dx - 1, p.y + dy - 4, 4, 9);
        ctx.fillStyle = "#ffdf98";
        ctx.fillRect(p.x + dx, p.y + dy, 2, 2);
      }
      return;
    }
    ctx.fillStyle = "#4e7c53";
    ctx.fillRect(p.x - 8, p.y - 8, 16, 20);
    ctx.fillStyle = "#7a9e64";
    ctx.fillRect(p.x - 12, p.y - 2, 24, 8);
    return;
  }
  box(o.x + 0.08, o.y + 0.08, o.w - 0.16, o.h - 0.16, 19, "#f2d6b4", "#cea890", "#b18776");
  if (o.type === "table") {
    // A folder and two stacked books give the shared desks a little lived-in detail.
    box(o.x + .25, o.y + .22, .54, .4, 21, "#dce9e8", "#96ada9", "#839f9a");
    box(o.x + 1, o.y + .2, .54, .46, 23, "#d8a7a0", "#bd8c88", "#a67a78");
    return;
  }
  const p = project((o.x + 0.5) * TILE, (o.y + 0.5) * TILE, 21);
  if (o.type === "phone") {
    if (o.spot && spotNearby(o.spot)) outlineRect(p.x - 14, p.y - 14, 28, 17);
    ctx.fillStyle = "#2f5356";
    ctx.fillRect(p.x - 9, p.y - 8, 18, 9);
    ctx.fillRect(p.x - 12, p.y - 12, 24, 5);
    return;
  }
  if (o.spot && spotNearby(o.spot)) outlineRect(p.x - 14, p.y - 24, 28, 25);
  if (o.activity) drawDeskWorker(p, o.activity);
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
  if (o.w > 1 && !o.activity) {
    const q = project((o.x + 1.45) * TILE, (o.y + 0.6) * TILE, 21);
    if (o.spot && spotNearby(o.spot)) outlineRect(q.x - 10, q.y - 10, 20, 14);
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

// 엘리베이터 문: 왼쪽 벽면(x=0)에 붙여 그립니다.
export function drawElevator() {
  const wall = 0.12 * TILE,
    face = (y, z) => project(wall, y * TILE, z);
  polygon([face(6.55, 0), face(8.45, 0), face(8.45, 35), face(6.55, 35)], "#4c6268");
  polygon([face(6.7, 0), face(7.47, 0), face(7.47, 31), face(6.7, 31)], "#b9c7c4", "#7f9391");
  polygon([face(7.53, 0), face(8.3, 0), face(8.3, 31), face(7.53, 31)], "#c7d3cf", "#7f9391");
  const lamp = face(7.5, 41);
  ctx.fillStyle = "#263e4d";
  ctx.fillRect(Math.round(lamp.x - 15), Math.round(lamp.y - 6), 30, 12);
  ctx.fillStyle = "#ffe58a";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("EV " + floors[runtime.floor].level, Math.round(lamp.x), Math.round(lamp.y + 3));
}

// 쿼터뷰에서 a가 b보다 뒤에 있으면(먼저 그려야 하면) 참입니다. 단위는 칸입니다.
function behind(a, b) {
  return a.x1 <= b.x0 + 1e-6 || a.y1 <= b.y0 + 1e-6;
}

// 가구·칸막이·사람을 앞뒤 관계대로 줄 세웁니다. 긴 가구도 사람을 올바르게 가립니다.
export function paintOrder(items) {
  const n = items.length,
    waiting = new Array(n).fill(0),
    after = items.map(() => []),
    used = new Array(n).fill(false),
    order = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const ij = behind(items[i], items[j]),
        ji = behind(items[j], items[i]);
      if (ij && !ji) {
        after[i].push(j);
        waiting[j]++;
      } else if (ji && !ij) {
        after[j].push(i);
        waiting[i]++;
      }
    }
  for (let step = 0; step < n; step++) {
    let pick = -1;
    for (const free of [true, false]) {
      for (let i = 0; i < n; i++) {
        if (used[i] || (free && waiting[i])) continue;
        if (pick < 0 || items[i].x1 + items[i].y1 < items[pick].x1 + items[pick].y1) pick = i;
      }
      if (pick >= 0) break;
    }
    used[pick] = true;
    order.push(items[pick]);
    for (const j of after[pick]) waiting[j]--;
  }
  return order;
}

function person(x, y, kind, moving) {
  return {
    actor: kind,
    x0: x / TILE,
    y0: y / TILE,
    x1: x / TILE,
    y1: y / TILE,
    draw: () => pixelPerson(x, y, kind, moving),
  };
}

export function sceneItems(moving) {
  const floor = floorForScene(runtime.floor, runtime.state.stage),
    items = [];
  for (const p of floor.partitions) {
    if (p.axis === "v")
      items.push({
        height: p.z,
        x0: p.at,
        y0: p.from,
        x1: p.at + 0.18,
        y1: p.to,
        draw: () => box(p.at, p.from, 0.18, p.to - p.from, p.z, "#f4e6d8", "#d2d4c7", "#b8c9c0"),
      });
    else
      for (let x = p.from; x < p.to; x++)
        if (!p.doors.includes(x))
          items.push({
            height: p.z,
            x0: x,
            y0: p.at,
            x1: x + 1,
            y1: p.at + 0.13,
            draw: () => box(x, p.at, 1, 0.13, p.z, "#f5eadd", "#c5d6ca", "#afc8be"),
          });
  }
  for (const o of floor.furnishings)
    items.push({ furniture: o, x0: o.x, y0: o.y, x1: o.x + o.w, y1: o.y + o.h, draw: () => drawFurniture(o) });
  if (runtime.floor === 0 || runtime.state.stage === 3) {
    items.push(person(spots.mentor.npcX, spots.mentor.npcY, "mentor"));
    if (runtime.state.stage === 3) items.push(person(spots.mentor.x, spots.mentor.y, "rookie"));
    else items.push(person(spots.supplier.npcX, spots.supplier.npcY, "supplier"));
  } else if (floor.guide) items.push(person(spots.librarian.npcX, spots.librarian.npcY, "librarian"));
  else if (runtime.floor === 1) items.push(person(spots.officer.npcX, spots.officer.npcY, "officer"));
  items.push(person(player.x, player.y, runtime.state.stage === 3 ? "supplier" : rookieOutfit(), moving));
  return items;
}

export function draw(t, moving) {
  camera();
  const floor = floorForScene(runtime.floor, runtime.state.stage);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#d7e8e4";
  ctx.fillRect(0, 0, 940, 620);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = i % 2 ? "#e5eff0" : "#c6ddd9";
    ctx.fillRect((i * 137) % 940, (i * 83) % 620, 2, 2);
  }
  polygon(
    [
      project(0, 0),
      project(MAP_W * TILE, 0),
      project(MAP_W * TILE, MAP_H * TILE),
      project(0, MAP_H * TILE),
    ].map((p) => ({ x: p.x, y: p.y + 8 })),
    "#8da9a3",
  );
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++) {
      const corridor = (y >= 6 && y <= 8) || floor.corridorCols.includes(x);
      tile(
        x,
        y,
        corridor ? ((x + y) % 2 ? "#dccbad" : "#e9dcc5") : (x + y) % 2 ? (floor.tint || "#e5e2cc") : "#f0ecd9",
      );
    }
  if (floor.level === "8F") {
    box(.55, 1.45, 6.9, 4.15, 1, "#9cafa5");
    box(.64, 1.54, 6.72, 3.97, 1, "#e5d8b8");
    box(.75, 1.65, 6.5, 3.75, 1, "#a8bdb0");
  }
  box(0, 0, 18, 0.12, 37, "#fbf0dc", "#d6dfd6", "#b9cec5");
  box(0, 0, 0.12, 14, 37, "#fbf0dc", "#d6dfd6", "#b9cec5");
  // A framed noticeboard on the back wall, outside the walking and interaction layers.
  const board = project(9 * TILE, 0, 25);
  const wallPoint = (offset, z) => ({x: board.x + offset, y: board.y + offset * .5 - z});
  polygon([wallPoint(-16,-6), wallPoint(16,-6), wallPoint(16,11), wallPoint(-16,11)], "#bb9477", "#957b67");
  for (const [offset, color] of [[-11,"#fff2c9"],[-2,"#d1e6dd"],[7,"#e6cbd5"]])
    polygon([wallPoint(offset,-2), wallPoint(offset+6,-2), wallPoint(offset+6,6), wallPoint(offset,6)], color);
  if (runtime.state.stage !== 3) drawElevator();
  const items = sceneItems(moving), dest = spots[guideTarget(nextTarget())];
  if (dest && spotNearby(guideTarget(nextTarget())) && !runtime.modalOpen && !runtime.talkState) drawFloorMarker(dest, items);
  for (const item of paintOrder(items)) item.draw();
  const p = project(player.x, player.y);
  if (!runtime.titleVisible) {
    const x = p.x, y = p.y - 54;
    polygon([{x, y}, {x: x - 7, y: y - 12}, {x, y: y - 20}, {x: x + 7, y: y - 12}], "#88e6ba", "#265e52");
    polygon([{x, y}, {x, y: y - 18}, {x: x + 6, y: y - 12}], "#41a782");
  }
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
  runtime.view.dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
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

const miniX = (x) => 10 + (x / MAP_W) * 168;

const miniY = (y) => 8 + (y / MAP_H) * 96;

// 미니맵의 복도·칸막이·가구를 현재 층 자료로 그립니다.
export function miniLayout() {
  const floor = floorForScene(runtime.floor, runtime.state.stage),
    r = (n) => Math.round(n * 10) / 10;
  let walls = "";
  for (const p of floor.partitions)
    if (p.axis === "v")
      walls += `M${r(miniX(p.at))} ${r(miniY(p.from))}V${r(miniY(p.to))}`;
    else {
      let start = null;
      for (let x = p.from; x <= p.to; x++) {
        const open = x === p.to || p.doors.includes(x);
        if (!open && start === null) start = x;
        if (open && start !== null) {
          walls += `M${r(miniX(start))} ${r(miniY(p.at + 0.5))}H${r(miniX(x))}`;
          start = null;
        }
      }
    }
  return (
    `<path d="M10 ${r(miniY(6))}H178V${r(miniY(9))}H10Z" fill="#c6d2b6"/>` +
    `<path d="${walls}" stroke="#97ad99" stroke-width="2" fill="none"/>` +
    `<g fill="#819c84">${floor.furnishings
      .filter((o) => o.type !== "plant")
      .map(
        (o) =>
          `<rect x="${r(miniX(o.x))}" y="${r(miniY(o.y))}" width="${r((o.w / MAP_W) * 168)}" height="${r((o.h / MAP_H) * 96)}"/>`,
      )
      .join("")}</g>` +
    (runtime.state.stage === 3 ? "" : `<rect x="6" y="${r(miniY(6.6))}" width="6" height="${r((1.8 / MAP_H) * 96)}" fill="#4c6268"/>`)
  );
}

export function intersects(a, b, gap = 0) {
  return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
}

// Canvas-space envelopes include the full sprite and furniture silhouette.
export function sceneItemBounds(item) {
  if (item.actor) {
    const p = project(item.x0 * TILE, item.y0 * TILE);
    return { x: p.x - 20, y: p.y - 54, w: 40, h: 58 };
  }
  const height = item.height ?? ({ cabinet: 34, shelf: 41, plant: 40, table: 19, phone: 35 }[item.furniture?.type] ?? 46);
  const corners = [[item.x0,item.y0],[item.x1,item.y0],[item.x1,item.y1],[item.x0,item.y1]]
    .map(([x,y]) => project(x*TILE,y*TILE));
  const xs = corners.map(p=>p.x), ys = corners.map(p=>p.y);
  return { x: Math.min(...xs)-3, y: Math.min(...ys)-height-3,
    w: Math.max(...xs)-Math.min(...xs)+6, h: Math.max(...ys)-Math.min(...ys)+height+6 };
}

export function floorMarkerBounds(dest, items = sceneItems(false)) {
  const p = project(dest.x,dest.y), rect = { x:p.x-14, y:p.y-7, w:28, h:14 };
  // Suppress the whole marker when any foreground silhouette could clip it.
  return items.some(item => intersects(rect,sceneItemBounds(item))) ? null : rect;
}

export function drawFloorMarker(dest, items) {
  const r = floorMarkerBounds(dest,items);
  if (!r) return false;
  const x=r.x+r.w/2, y=r.y+r.h/2;
  ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x+11,y);ctx.lineTo(x,y+4);ctx.lineTo(x-11,y);ctx.closePath();
  ctx.lineWidth=6;ctx.strokeStyle="#172f35";ctx.stroke();
  ctx.lineWidth=2;ctx.strokeStyle="#fff2a6";ctx.stroke();
  return true;
}

export function labelVisuals() {
  const scale=runtime.view.scale, screen=r=>({x:(r.x-runtime.view.x)*scale,y:(r.y-runtime.view.y)*scale,w:r.w*scale,h:r.h*scale});
  const visuals = sceneItems(false).filter(item => item.furniture?.spot ||
    (item.actor && spotActive(item.actor) && spots[item.actor]?.npcX !== undefined))
    .map(item => ({id: item.furniture?.spot || item.actor, ...screen(sceneItemBounds(item))}));
  return visuals;
}

// 이름표는 대상 실루엣 바로 둘레(위·아래·옆·대각)에서만 자리를 찾습니다.
// 화면 전체를 뒤지면 이름표가 대상과 떨어져 다른 버튼처럼 보입니다.
export function placeLabel(anchor, size, obstacles, own) {
  const t=own || {x:anchor.x-12,y:anchor.y,w:24,h:24};
  const cx=t.x+t.w/2, cy=t.y+t.h/2;
  let best=null, score=Infinity;
  const consider=(x,y,rank)=>{
    const rect={x,y,w:size.w,h:size.h};
    let hits=0;for(const obstacle of obstacles)if(intersects(rect,obstacle,6))hits++;
    const value=hits*1e8+rank*1e3+Math.hypot(rect.x+size.w/2-cx,rect.y+size.h/2-cy);
    if(value<score){score=value;best=rect;}
  };
  let rank=0;
  for(const gap of [10,26,44,66,90]) {
    const top=t.y-gap-size.h, bottom=t.y+t.h+gap, left=t.x-gap-size.w, right=t.x+t.w+gap;
    if (own?.id === "cabinet" || own?.id === "librarian") consider(cx-size.w/2,bottom,rank++);
    consider(cx-size.w/2,top,rank++);
    for(let k=1;k<=4;k++) for(const d of [k,-k]) consider(cx-size.w/2+d*size.w/3,top,rank++);
    for(let k=0;k<=3;k++) for(const d of k?[k,-k]:[0]) {
      consider(right,cy-size.h/2+d*size.h,rank++);
      consider(left,cy-size.h/2+d*size.h,rank++);
    }
    for(let k=0;k<=4;k++) for(const d of k?[k,-k]:[0]) consider(cx-size.w/2+d*size.w/3,bottom,rank++);
    if(score<1e8)return best;
  }
  return best;
}

export function positionLabels() {
  const visuals=labelVisuals(), obstacles=[...visuals];
  const target = guideTarget(nextTarget()), nearby = interactionTarget();
  const ids = Object.keys(spots).sort((a, b) => Number(b === target) - Number(a === target));
  for (const id of ids) {
    const el = $("spot-" + id), s = spotOnFloor(id, runtime.floor);
    el.hidden = !spotActive(id) || (id !== target && !spotNearby(id) && !(id === "librarian" || (id === "cabinet" && runtime.floor > 1)));
    if (el.hidden) continue;
    el.classList.toggle("in-range", id === nearby);
    const p=project(s.npcX??s.x,s.npcY??s.y), own=visuals.find(v=>v.id===id);
    const anchor={x:(p.x-runtime.view.x)*runtime.view.scale,y:own?own.y-10:(p.y-65-runtime.view.y)*runtime.view.scale};
    if(own)anchor.x=own.x+own.w/2;
    const r=placeLabel(anchor,{w:el.offsetWidth||130,h:el.offsetHeight||34},obstacles,own);
    el.style.left=r.x+r.w/2+"px";el.style.top=r.y+r.h/2+"px";
    obstacles.push(r);
    // Off-screen destinations are reachable from the HUD's guide button.
    el.style.visibility = r.x + r.w < 0 || r.x > runtime.view.width || r.y + r.h < 0 || r.y > runtime.view.height ? "hidden" : "";
  }
}

export function updateMap() {
  const layout = runtime.state.stage === 3 ? "supplier" : String(runtime.floor);
  if ($("mini-layout").dataset?.floor !== layout) {
    $("mini-layout").innerHTML = miniLayout();
    $("mini-layout").setAttribute("data-floor", layout);
  }
  positionLabels();
  $("mini-player").setAttribute("cx", miniX(player.x / TILE));
  $("mini-player").setAttribute("cy", miniY(player.y / TILE));
  const next = spots[guideTarget(nextTarget())];
  $("mini-target").style.display = next ? "" : "none";
  if (next) {
    $("mini-target").setAttribute("cx", miniX(next.x / TILE));
    $("mini-target").setAttribute("cy", miniY(next.y / TILE));
  }
}
