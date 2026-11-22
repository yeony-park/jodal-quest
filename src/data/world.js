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
  cabinet: { x: 112, y: 240 },
  elevator: { x: 16, y: 240 },
  officer: { x: 496, y: 112, npcX: 528, npcY: 96, floor: 1 },
  bidroom: { x: 432, y: 112, floor: 1 },
};

// 칸막이: axis "h"는 y=at 줄을 from~to 칸까지 막고 doors 칸만 비웁니다.
// axis "v"는 x=at 줄을 from~to 칸까지 막습니다. z는 그릴 높이입니다.
export const floors = [
  {
    level: "5F",
    caption: "5층 구매팀",
    rooms: ["구매총괄과", "전기전자구매과"],
    term: "납품기한",
    corridorCols: [5, 11],
    partitions: [
      { axis: "h", at: 5, from: 0, to: 18, doors: [2, 8, 14], z: 17 },
      { axis: "h", at: 9, from: 0, to: 18, doors: [2, 8, 14], z: 10 },
      { axis: "v", at: 5, from: 0, to: 5, z: 28 },
      { axis: "v", at: 11, from: 0, to: 5, z: 28 },
      { axis: "v", at: 5, from: 10, to: 14, z: 18 },
      { axis: "v", at: 11, from: 10, to: 14, z: 18 },
    ],
    furnishings: [
      { type: "shelf", x: 1, y: 1, w: 3, h: 1 },
      { type: "desk", x: 2, y: 3, w: 2, h: 1 },
      { type: "desk", x: 7, y: 2, w: 2, h: 1 },
      { type: "shelf", x: 9, y: 1, w: 1, h: 2 },
      { type: "desk", spot: "doc", x: 13, y: 2, w: 2, h: 1 },
      { type: "desk", x: 16, y: 2, w: 1, h: 1 },
      { type: "phone", spot: "phone", x: 2, y: 11, w: 2, h: 1 },
      { type: "shelf", x: 1, y: 12, w: 1, h: 1 },
      { type: "table", x: 7, y: 11, w: 3, h: 1 },
      { type: "terminal", spot: "terminal", x: 13, y: 11, w: 3, h: 1 },
      { type: "plant", x: 17, y: 12, w: 1, h: 1 },
    ],
  },
  {
    level: "2F",
    caption: "2층 계약팀",
    rooms: ["계약 상담석", "개찰·계약 자료실"],
    term: "계약상대자",
    corridorCols: [9],
    partitions: [
      { axis: "h", at: 5, from: 0, to: 18, doors: [3, 13], z: 17 },
      { axis: "h", at: 9, from: 0, to: 18, doors: [8, 14], z: 10 },
      { axis: "v", at: 9, from: 0, to: 5, z: 28 },
      { axis: "v", at: 11, from: 10, to: 14, z: 18 },
    ],
    furnishings: [
      { type: "shelf", x: 1, y: 1, w: 3, h: 1 },
      { type: "table", x: 5, y: 2, w: 2, h: 1 },
      { type: "plant", x: 8, y: 1, w: 1, h: 1 },
      { type: "terminal", spot: "bidroom", x: 12, y: 2, w: 3, h: 1 },
      { type: "shelf", x: 16, y: 1, w: 1, h: 2 },
      { type: "table", x: 3, y: 11, w: 3, h: 1 },
      { type: "plant", x: 1, y: 12, w: 1, h: 1 },
      { type: "desk", x: 14, y: 11, w: 2, h: 1 },
      { type: "shelf", x: 16, y: 12, w: 1, h: 1 },
    ],
  },
];

// Indices 0 and 1 are the two quest floors in existing saves.
const tourFloors = [
  ["B1F", "기록관", ["조달청기록관", "제안서평가실"], "조달기록", ["shelf", "shelf", "shelf"], ["table", "plant", "shelf"], "#e7dae0"],
  ["1F", "전시관", ["조달전시관", "문화상품전시관"], "조달물자", ["plant", "display", "plant"], ["display", "plant", "display"], "#f9e5cb"],
  ["3F", "가격·데이터", ["조달가격조사과", "조달데이터관리팀"], "가격조사", ["desk", "shelf", "desk"], ["desk", "plant", "shelf"], "#d9e8f4"],
  ["4F", "물품관리", ["물품관리과", "해외물자과"], "물품관리", ["shelf", "shelf", "desk"], ["shelf", "table", "shelf"], "#dbe9d8"],
  ["6F", "시설사업", ["설계예산검토과", "건축설비과"], "설계도서", ["table", "table", "desk"], ["desk", "table", "shelf"], "#e5e3f0"],
  ["7F", "도서실", ["도서실", "서비스계약과"], "용역", ["shelf", "shelf", "shelf"], ["plant", "table", "desk"], "#e9dfcf"],
  ["8F", "회의 공간", ["기획재정담당관실", "대회의실"], "예산", ["desk", "plant", "shelf"], ["table", "table", "table"], "#ecdfee"],
  ["9F", "혁신조달", ["혁신조달정책과", "운영지원과"], "혁신조달", ["table", "desk", "desk"], ["shelf", "table", "plant"], "#d5eae5"],
];
for (const [level, name, rooms, term, firstRoom, secondRoom, tint] of tourFloors) {
  const furnishings = [];
  for (const [wing, arrangement] of [firstRoom, secondRoom].entries()) {
    for (const [slot, type] of arrangement.entries()) {
      furnishings.push({ type, x: 2 + 9 * wing + 2 * (slot % 2),
        y: 2 + 8 * Math.floor(slot / 2), w: type === "plant" ? 1 : 2, h: 1 });
    }
  }
  floors.push({level, caption: level.replace("F", "층").replace("B", "지하 ") + " " + name,
    rooms, term, tint, corridorCols: [8], furnishings,
    partitions: [{axis: "v", at: 8, from: 0, to: 6, z: 24},
      {axis: "h", at: 9, from: 0, to: 18, doors: [3, 8, 13], z: 16}]});
}
for (const floor of floors) {
  floor.furnishings.push(
    {type: "cabinet", spot: "cabinet", x: 3, y: 6, w: 1, h: 1},
    {type: "plant", variety: "palm", x: 0, y: 3, w: 1, h: 1},
    {type: "plant", variety: "flowers", x: 15, y: 4, w: 1, h: 1},
  );
}

// The supplier uses its own office during the bid, without the agency's collection cabinet.
const supplierOffice = {...floors[0], furnishings: floors[0].furnishings.filter(o => o.type !== "cabinet")};
export function floorForScene(index, stage) {
  return stage === 3 ? supplierOffice : floors[index];
}


function floorNumber(floor) {
  return floor.level === "B1F" ? -1 : parseInt(floor.level, 10);
}
export const floorOrder = floors.map((_, i) => i).sort((a, b) => floorNumber(floors[a]) - floorNumber(floors[b]));

// 5층 가구 목록. 기존 코드와 검사가 쓰는 이름을 유지합니다.
export const furnishings = floors[0].furnishings;
