import { player, runtime } from "../core/runtime.js";
import { floorForScene, floorOrder, floors, MAP_H, MAP_W, spots, TILE } from "../data/world.js";
import { show } from "./modal.js";

const colors = { cabinet: "#b58443", shelf: "#94a89b", plant: "#89bba4", table: "#cfb398", display: "#b4cad9" };

function floorPlan(index, supplier) {
  const floor = floorForScene(index, runtime.state.stage);
  const walls = [];
  for (const p of floor.partitions) {
    for (let n = p.from; n < p.to; n++) {
      if (p.doors?.includes(n)) continue;
      walls.push(p.axis === "h" ? `M${n} ${p.at + .5}h1` : `M${p.at + .5} ${n}v1`);
    }
  }
  const pin = (x, y, color, label) => `<circle cx="${x}" cy="${y}" r=".36" fill="${color}" stroke="white" stroke-width=".1"><title>${label}</title></circle>`;
  return `<svg class="floor-plan" viewBox="-.4 -.4 ${MAP_W + .8} ${MAP_H + .8}" role="img" aria-label="${supplier ? "새봄테크" : floor.caption} 안내도">
    <rect width="${MAP_W}" height="${MAP_H}" rx=".35" fill="${floor.tint || "#edeada"}"/>
    <rect y="6" width="${MAP_W}" height="3" fill="#e4d6bf"/>
    <path d="${walls.join("")}" stroke="#82978d" stroke-width=".2"/>
    ${floor.furnishings.map(o => `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx=".12" fill="${colors[o.type] || "#a9b9c7"}"/>`).join("")}
    ${(supplier ? ["영업팀", "제품 자료실"] : floor.rooms).map((room, i) =>
      `<g transform="translate(${i * 9 + 4.5} 4.9)"><rect x="-3.9" y="-.66" width="7.8" height="1.14" rx=".22" fill="#fffdf1"/><text text-anchor="middle" y=".14" fill="#34473e" font-size=".73" font-weight="700">${room}</text></g>`).join("")}
    ${floor.guide && !supplier ? pin(spots.librarian.npcX / TILE, spots.librarian.npcY / TILE, "#ab6650", "문다은 자료 담당자") : ""}
    ${supplier ? "" : pin(spots.elevator.x / TILE, spots.elevator.y / TILE, "#67619e", "엘리베이터")}
    ${index === runtime.floor ? pin(player.x / TILE, player.y / TILE, "#247953", "현재 위치") : ""}
  </svg>`;
}

export function showFloorMap(index = runtime.floor) {
  const floor = floors[index], supplier = runtime.state.stage === 3;
  const tabs = supplier ? "" : `<div class="floor-tabs" aria-label="층 선택">${floorOrder.map(i =>
    `<button data-action="map-${i}" aria-pressed="${i === index}">${floors[i].level}</button>`).join("")}</div>`;
  const rooms = supplier ? "영업팀 · 제품 자료실" : floor.rooms.join(" · ");
  const legend = `<div class="map-legend">
    ${index === runtime.floor ? '<span class="map-person">현재 위치</span>' : ""}
    ${supplier ? "" : '<span class="map-lift">엘리베이터</span><span class="map-cabinet">' + (floor.guide ? "자료 담당자" : "자료 캐비닛") + '</span>'}</div>`;
  show("층별 지도", `${tabs}<h3 class="floor-caption">${supplier ? "새봄테크" : floor.caption}</h3>
    <p class="floor-rooms">${rooms}</p>${floorPlan(index, supplier)}${legend}`, "map");
}
