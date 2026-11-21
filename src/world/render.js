import { MAP_H, MAP_W, TILE, floors, spots } from "../data/world.js";
import { canvas, ctx } from "./canvas.js";
import { player, runtime } from "../core/runtime.js";
import { pixelPerson } from "./characters.js";
import { nextTarget } from "../game/quests.js";
import { guideTarget, spotActive } from "./navigation.js";
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
    if (o.spot && spotActive(o.spot)) outlineRect(p.x - 14, p.y - 14, 28, 17);
    ctx.fillStyle = "#2f5356";
    ctx.fillRect(p.x - 9, p.y - 8, 18, 9);
    ctx.fillRect(p.x - 12, p.y - 12, 24, 5);
    return;
  }
  if (o.spot && spotActive(o.spot)) outlineRect(p.x - 14, p.y - 24, 28, 25);
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
    if (o.spot && spotActive(o.spot)) outlineRect(q.x - 10, q.y - 10, 20, 14);
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
  const floor = floors[runtime.floor],
    items = [];
  for (const p of floor.partitions) {
    if (p.axis === "v")
      items.push({
        height: p.z,
        x0: p.at,
        y0: p.from,
        x1: p.at + 0.18,
        y1: p.to,
        draw: () => box(p.at, p.from, 0.18, p.to - p.from, p.z, "#e0dfca", "#b8bdab", "#96aa9a"),
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
            draw: () => box(x, p.at, 1, 0.13, p.z, "#dce1cd", "#a3b5a7", "#93a994"),
          });
  }
  for (const o of floor.furnishings)
    items.push({ furniture: o, x0: o.x, y0: o.y, x1: o.x + o.w, y1: o.y + o.h, draw: () => drawFurniture(o) });
  if (runtime.state.stage !== 3) {
    if (runtime.floor === 0) {
      items.push(person(spots.mentor.npcX, spots.mentor.npcY, "mentor"));
      items.push(person(spots.supplier.npcX, spots.supplier.npcY, "supplier"));
    } else items.push(person(spots.officer.npcX, spots.officer.npcY, "officer"));
  }
  items.push(person(player.x, player.y, runtime.state.stage === 3 ? "supplier" : "rookie", moving));
  return items;
}

export function draw(t, moving) {
  camera();
  const floor = floors[runtime.floor];
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
      const corridor = (y >= 6 && y <= 8) || floor.corridorCols.includes(x);
      tile(
        x,
        y,
        corridor ? ((x + y) % 2 ? "#899e92" : "#96aa9c") : (x + y) % 2 ? "#9da99b" : "#a9b3a3",
      );
    }
  box(0, 0, 18, 0.12, 37, "#e0e5d0", "#b6c2b2", "#9cae9f");
  box(0, 0, 0.12, 14, 37, "#e0e5d0", "#b6c2b2", "#9cae9f");
  if (runtime.state.stage !== 3) drawElevator();
  for (const [label, x, y] of floor.labels) roomLabel(label, x, y);
  const items = sceneItems(moving), dest = spots[guideTarget(nextTarget())];
  if (dest && !runtime.modalOpen && !runtime.talkState) drawFloorMarker(dest, items);
  for (const item of paintOrder(items)) item.draw();
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
  const floor = floors[runtime.floor],
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
    `<rect x="6" y="${r(miniY(6.6))}" width="6" height="${r((1.8 / MAP_H) * 96)}" fill="#4c6268"/>`
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
  const height = item.height ?? ({ shelf: 41, plant: 40, table: 19, phone: 35 }[item.furniture?.type] ?? 46);
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
  const visuals=sceneItems(false).filter(item=>item.actor || (item.furniture?.spot && spotActive(item.furniture.spot)))
    .map(item=>({id:item.furniture?.spot || Object.keys(spots).find(id=>spots[id].npcX/TILE===item.x0 && spots[id].npcY/TILE===item.y0),...screen(sceneItemBounds(item))}));
  return visuals;
}

// 이름표는 대상 실루엣 바로 둘레(위·아래·옆·대각)에서만 자리를 찾습니다.
// 화면 전체를 뒤지면 이름표가 대상과 떨어져 다른 버튼처럼 보입니다.
export function placeLabel(anchor, size, obstacles, own) {
  const margin=8, maxX=Math.max(margin,runtime.view.width-size.w-margin), maxY=Math.max(margin,runtime.view.height-size.h-margin);
  const t=own || {x:anchor.x-12,y:anchor.y,w:24,h:24};
  const cx=t.x+t.w/2, cy=t.y+t.h/2;
  let best=null, score=Infinity;
  const consider=(x,y,rank)=>{
    const rect={x:Math.max(margin,Math.min(maxX,x)),y:Math.max(margin,Math.min(maxY,y)),w:size.w,h:size.h};
    let hits=0;for(const obstacle of obstacles)if(intersects(rect,obstacle,6))hits++;
    const value=hits*1e8+rank*1e3+Math.hypot(rect.x+size.w/2-cx,rect.y+size.h/2-cy);
    if(value<score){score=value;best=rect;}
  };
  let rank=0;
  for(const gap of [10,26,44,66,90]) {
    const top=t.y-gap-size.h, bottom=t.y+t.h+gap, left=t.x-gap-size.w, right=t.x+t.w+gap;
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
  for(const el of document.querySelectorAll?.(".minimap,.goal-bar,.top-controls,.inventory,.bottom-controls,.mobile-controls") || []) {
    const r=el.getBoundingClientRect();if(r.width&&r.height)obstacles.push({x:r.x,y:r.y,w:r.width,h:r.height});
  }
  const target=guideTarget(nextTarget()), ids=Object.keys(spots).sort((a,b)=>(a===target?-1:b===target?1:0));
  for(const id of ids) {
    const el=$("spot-"+id), s=spots[id];el.hidden=!spotActive(id);if(el.hidden)continue;
    const p=project(s.npcX??s.x,s.npcY??s.y), own=visuals.find(v=>v.id===id);
    const anchor={x:(p.x-runtime.view.x)*runtime.view.scale,y:own?own.y-10:(p.y-65-runtime.view.y)*runtime.view.scale};
    if(own)anchor.x=own.x+own.w/2;
    const r=placeLabel(anchor,{w:el.offsetWidth||130,h:el.offsetHeight||34},obstacles,own);
    el.style.left=r.x+r.w/2+"px";el.style.top=r.y+r.h/2+"px";
    obstacles.push(r);
  }
}

export function updateMap() {
  if ($("mini-layout").dataset?.floor !== String(runtime.floor)) {
    $("mini-layout").innerHTML = miniLayout();
    $("mini-layout").setAttribute("data-floor", runtime.floor);
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
