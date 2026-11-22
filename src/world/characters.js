import { endingTitle } from "../data/recovery.js";
import { LAST_STAGE } from "../data/quests.js";
import { spotNearby } from "./navigation.js";
import { project } from "./render.js";
import { runtime } from "../core/runtime.js";
import { ctx } from "./canvas.js";

export const spriteRows = [
  ".....HHHHHH.....",
  "....HHHHHHHH....",
  "...HHHHHHHHHH...",
  "...HHHHHHHHHH...",
  "...HHSSSSSSHH...",
  "...HSSSSSSSSH...",
  "...HSSSSSSSSH...",
  "...HSSXSSXSSH...",
  "....SSSSSSSS....",
  "....SSSMMSSS....",
  ".....SSSSSS.....",
  "......SSSS......",
  "....JJWWWWJJ....",
  "...JJJWWWWJJJ...",
  "...JJJJAAJJJJ...",
  "..SSJJJAAJJJSS..",
  "..SSJJJJJJJJSS..",
  "..SSJJJJJJJJSS..",
  "....JJJJJJJJ....",
  "....PPPPPPPP....",
  ".....PPP.PPP....",
  ".....PPP.PPP....",
  ".....XXX.XXX....",
  "....XXXX.XXXX...",
];

export function rookieOutfit() {
  if (runtime.state.stage !== LAST_STAGE) return "rookie";
  return endingTitle(runtime.state.recoveries, runtime.state.mistakes) === "사파" ? "sapa" : "jeongpa";
}

const hair = { typist: "#51444d", reviewer: "#756257", librarian: "#794930", contact: "#685b52", sapa: "#332d40", supplier: "#49384d", mentor: "#605049", officer: "#2f3a4f" };

const jacket = { typist: "#7876a3", reviewer: "#b17561", librarian: "#b56d59", contact: "#478786", sapa: "#4b365a", jeongpa: "#e5eedd", supplier: "#956ba5", mentor: "#c29458", officer: "#5f7f63" };

export function pixelPalette(kind) {
  return {
    H: hair[kind] || "#243a43",
    S: "#efba8d",
    X: "#26373d",
    M: "#a76557",
    J: jacket[kind] || "#3b7c91",
    W: "#f9edcf",
    A: kind === "supplier" ? "#f0cb7a" : kind === "officer" ? "#e3d9a8" : "#bd6e4b",
    B: kind === "sapa" ? "#c57579" : "#468278",
    P: kind === "supplier" ? "#654b73" : "#3a4e54",
  };
}

export function spriteCells(kind) {
  const cells = [];
  spriteRows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c !== ".") cells.push([x, y, c]);
    }),
  );
  if (kind === "supplier") {
    for (let y = 6; y < 15; y++) for (const x of [2, 3, 12, 13]) cells.push([x, y, "H"]);
    cells.push([12, 5, "A"], [13, 5, "A"], [12, 6, "A"]);
  }
  if (kind === "librarian") {
    for (let y = 3; y <= 8; y++) cells.push([2,y,"H"],[13,y,"H"]);
    cells.push([4,7,"W"],[5,7,"X"],[6,7,"W"],[9,7,"W"],[10,7,"X"],[11,7,"W"],[10,14,"W"],[11,14,"W"]);
  }
  if (kind === "contact") {
    // A pinned bun, light fringe and a library badge distinguish the caller at portrait size.
    for (let y = 2; y <= 5; y++) for (let x = 1; x <= 4; x++) cells.push([x,y,"H"]);
    cells.push([4,4,"W"],[5,4,"W"],[6,3,"W"],[9,14,"W"],[10,14,"W"],[9,15,"B"],[10,15,"B"]);
  }
  if (kind === "sapa" || kind === "jeongpa") {
    for (let y = 12; y <= 20; y++) {
      const edge = y < 17 ? 3 : 2;
      for (let x = edge; x < 16 - edge; x++) cells.push([x,y,"J"]);
    }
    for (let x = 3; x <= 12; x++) cells.push([x,17,"B"]);
    for (let i = 0; i < 5; i++) cells.push([5+i,12+i,"B"], [10-i,12+i,"W"]);
    if (kind === "sapa") {
      for (let x = 2; x <= 13; x++) cells.push([x,4,"B"]);
      cells.push([13,5,"B"], [14,5,"B"], [14,6,"B"], [15,7,"B"], [12,18,"B"], [13,19,"B"]);
    }
  }
  if (kind === "officer") cells.push([4, 3, "A"], [5, 3, "A"], [6, 2, "A"]);
  if (kind === "mentor")
    for (const [x, y] of [
      [4, 6],
      [5, 6],
      [6, 6],
      [8, 6],
      [9, 6],
      [10, 6],
      [4, 8],
      [5, 8],
      [6, 8],
      [8, 8],
      [9, 8],
      [10, 8],
      [3, 7],
      [7, 7],
      [11, 7],
    ])
      cells.push([x, y, "H"]);
  return cells;
}

export function face(kind = "rookie", expression = "neutral") {
  const palette = pixelPalette(kind);
  const surprised = expression === "surprised";
  const cells = spriteCells(kind).filter(([, y]) => !surprised || y < 14);
  if (surprised) {
    cells.push([7, 9, "X"], [8, 9, "X"], [7, 10, "X"], [8, 10, "X"]);
  }
  return /* HTML */ `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="${surprised ? "0 0 20 16" : "0 0 20 28"}"
    shape-rendering="crispEdges"
    aria-hidden="true"
  >
    ${cells
      .map(
        ([x, y, c]) =>
          /* HTML */ `<rect x="${x + 2}" y="${y + 2}" width="1" height="1" fill="${palette[c]}" />`,
      )
      .join("")}
    ${surprised ? '<g class="surprise-sweat" fill="#3585bc"><rect x="15" y="6" width="1" height="1"/><rect x="14" y="7" width="2" height="2"/></g>' : ""}
  </svg>`;
}

// 자세: 0 서 있기, 1 왼발 들기, 2 지나가는 자세, 3 오른발 들기.
// 발은 위로만 올려 몸통과 떨어지지 않게 하고, 지나가는 자세에서는 상체가 한 칸 내려옵니다.
const sheets = new Map();

export function spriteSheet(kind, pose = 0) {
  const key = kind + pose;
  if (!sheets.has(key)) {
    const sheet = document.createElement("canvas");
    sheet.width = 16;
    sheet.height = 24;
    const g = sheet.getContext("2d"),
      palette = pixelPalette(kind);
    for (const [x, y, c] of spriteCells(kind)) {
      let dy = 0;
      if (y > 19) {
        if ((pose === 1 && x < 8) || (pose === 3 && x >= 8)) dy = -1;
      } else if (pose === 2) dy = 1;
      g.fillStyle = palette[c];
      g.fillRect(x, y + dy, 1, 1);
    }
    sheets.set(key, sheet);
  }
  return sheets.get(key);
}

export function walkPose(moving) {
  return moving ? [1, 2, 3, 2][Math.floor(runtime.walk / 1.6) % 4] : 0;
}

export function outlinedSprite(kind, pose) {
  const key = "outline" + kind + pose;
  if (!sheets.has(key)) {
    const sheet = document.createElement("canvas");
    sheet.width = 20; sheet.height = 28;
    const g = sheet.getContext("2d"), palette = pixelPalette(kind);
    const cells = spriteCells(kind).map(([x,y,c]) => {
      const dy = y > 19 ? ((pose === 1 && x < 8) || (pose === 3 && x >= 8) ? -1 : 0) : pose === 2 ? 1 : 0;
      return [x+2,y+2+dy,c];
    });
    for (const [radius,color] of [[2,"#172f35"],[1,"#fff2a6"],[0,null]]) {
      for (const [x,y,c] of cells) {
        g.fillStyle = color || palette[c];
        g.fillRect(x-radius,y-radius,1+radius*2,1+radius*2);
      }
    }
    sheets.set(key,sheet);
  }
  return sheets.get(key);
}

// 스프라이트 한 장을 화면 픽셀에 맞춰 그려 칸 사이로 배경이 비치지 않게 합니다.
export function pixelPerson(x, y, kind, moving = false) {
  const p = project(x, y),
    k = runtime.view.dpr * runtime.view.scale,
    left = Math.round((p.x - 16 - runtime.view.x) * k),
    top = Math.round((p.y - 48 - runtime.view.y) * k),
    width = Math.max(16, Math.round(32 * k)),
    height = Math.max(24, Math.round(48 * k));
  ctx.fillStyle = "#263e4d30";
  ctx.fillRect(Math.round(p.x - 13), Math.round(p.y - 3), 26, 6);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const npc = kind !== "rookie" && !(kind === "supplier" && runtime.state.stage === 3) && spotNearby(kind);
  const pad = npc ? Math.round(4 * k) : 0;
  ctx.drawImage(npc ? outlinedSprite(kind, walkPose(moving)) : spriteSheet(kind, walkPose(moving)), left-pad, top-pad, width+pad*2, height+pad*2);
  ctx.restore();
}
