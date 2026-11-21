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

export function pixelPalette(kind) {
  return {
    H: kind === "supplier" ? "#49384d" : kind === "mentor" ? "#605049" : "#243a43",
    S: "#efba8d",
    X: "#26373d",
    M: "#a76557",
    J: kind === "supplier" ? "#956ba5" : kind === "mentor" ? "#c29458" : "#3b7c91",
    W: "#f9edcf",
    A: kind === "supplier" ? "#f0cb7a" : "#bd6e4b",
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

export function face(kind = "rookie") {
  const palette = pixelPalette(kind);
  return /* HTML */ `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 28"
    shape-rendering="crispEdges"
    aria-hidden="true"
  >
    ${spriteCells(kind)
      .map(
        ([x, y, c]) =>
          /* HTML */ `<rect x="${x + 2}" y="${y + 2}" width="1" height="1" fill="${palette[c]}" />`,
      )
      .join("")}
  </svg>`;
}

export function pixelPerson(x, y, kind, moving = false) {
  const p = project(x, y),
    s = 2,
    bob = moving ? Math.round(Math.sin(runtime.walk) * 1) : 0;
  ctx.fillStyle = "#263e4d30";
  ctx.fillRect(Math.round(p.x - 13), Math.round(p.y - 3), 26, 6);
  const palette = pixelPalette(kind);
  for (const [cx, cy, c] of spriteCells(kind)) {
    let step = cy > 19 && moving ? Math.round(Math.sin(runtime.walk) * (cx < 8 ? 1 : -1)) : 0;
    ctx.fillStyle = palette[c];
    ctx.fillRect(Math.round(p.x - 16 + cx * s), Math.round(p.y - 48 + cy * s + bob + step), s, s);
  }
}
