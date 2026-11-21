export const TILE = 32;

export const MAP_W = 18;

export const MAP_H = 14;

// floor: 해당 층에서만 보이는 대상. 값이 없으면 모든 층에 있습니다.
export const spots = {
  doc: { x: 464, y: 144, floor: 0 },
  mentor: { x: 528, y: 144, npcX: 560, npcY: 112, floor: 0 },
  phone: { x: 80, y: 400, floor: 0 },
  terminal: { x: 464, y: 400, floor: 0 },
  supplier: { x: 272, y: 240, npcX: 304, npcY: 208, floor: 0 },
  elevator: { x: 16, y: 240 },
  officer: { x: 496, y: 112, npcX: 528, npcY: 96, floor: 1 },
  bidroom: { x: 432, y: 112, floor: 1 },
};

// 칸막이: axis "h"는 y=at 줄을 from~to 칸까지 막고 doors 칸만 비웁니다.
// axis "v"는 x=at 줄을 from~to 칸까지 막습니다. z는 그릴 높이입니다.
export const floors = [
  {
    level: "5F",
    caption: "새봄지방조달청 · 5층 구매팀",
    corridorCols: [5, 11],
    partitions: [
      { axis: "h", at: 5, from: 0, to: 18, doors: [2, 8, 14], z: 17 },
      { axis: "h", at: 9, from: 0, to: 18, doors: [2, 8, 14], z: 10 },
      { axis: "v", at: 5, from: 0, to: 5, z: 28 },
      { axis: "v", at: 11, from: 0, to: 5, z: 28 },
      { axis: "v", at: 5, from: 10, to: 14, z: 18 },
      { axis: "v", at: 11, from: 10, to: 14, z: 18 },
    ],
    labels: [
      ["0505 공사원가", 2.5, 1],
      ["0506 보건의료", 8.5, 1],
      ["0507 전기전자", 14.5, 1],
      ["0504 구매총괄", 2.5, 13],
      ["0503 조달개혁", 8.5, 13],
      ["0502 건설환경", 14.5, 13],
    ],
    furnishings: [
      { type: "shelf", x: 1, y: 1, w: 3, h: 1 },
      { type: "desk", x: 2, y: 3, w: 2, h: 1 },
      { type: "desk", x: 7, y: 2, w: 2, h: 1 },
      { type: "shelf", x: 9, y: 1, w: 1, h: 2 },
      { type: "desk", x: 13, y: 2, w: 2, h: 1 },
      { type: "desk", x: 16, y: 2, w: 1, h: 1 },
      { type: "phone", x: 2, y: 11, w: 2, h: 1 },
      { type: "shelf", x: 1, y: 12, w: 1, h: 1 },
      { type: "table", x: 7, y: 11, w: 3, h: 1 },
      { type: "terminal", x: 13, y: 11, w: 3, h: 1 },
      { type: "plant", x: 17, y: 12, w: 1, h: 1 },
    ],
  },
  {
    level: "3F",
    caption: "새봄지방조달청 · 3층 개찰·계약 창구",
    corridorCols: [9],
    partitions: [
      { axis: "h", at: 5, from: 0, to: 18, doors: [3, 13], z: 17 },
      { axis: "h", at: 9, from: 0, to: 18, doors: [8, 14], z: 10 },
      { axis: "v", at: 9, from: 0, to: 5, z: 28 },
      { axis: "v", at: 11, from: 10, to: 14, z: 18 },
    ],
    labels: [
      ["0303 조달가격조사", 4, 1],
      ["0305 디지털조달", 13.5, 1],
      ["0304 공정조달", 5, 13],
      ["0306 조달관리", 14.5, 13],
    ],
    furnishings: [
      { type: "shelf", x: 1, y: 1, w: 3, h: 1 },
      { type: "table", x: 5, y: 2, w: 2, h: 1 },
      { type: "plant", x: 8, y: 1, w: 1, h: 1 },
      { type: "terminal", x: 12, y: 2, w: 3, h: 1 },
      { type: "shelf", x: 16, y: 1, w: 1, h: 2 },
      { type: "table", x: 3, y: 11, w: 3, h: 1 },
      { type: "plant", x: 1, y: 12, w: 1, h: 1 },
      { type: "desk", x: 14, y: 11, w: 2, h: 1 },
      { type: "shelf", x: 16, y: 12, w: 1, h: 1 },
    ],
  },
];

// 5층 가구 목록. 기존 코드와 검사가 쓰는 이름을 유지합니다.
export const furnishings = floors[0].furnishings;
