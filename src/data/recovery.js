// Fictional draft consequences teach the official sequence, checked 2026-11-21.
// Source : https://www.pps.go.kr/kor/content.do?key=00179
export const recoveryScenes = {
  intake: {
    stage: 0, title: "급한 납기 초안 수습", action: "intake-good",
    consequence: "7일로 적은 초안을 본 도서관 담당자가 원래 요청한 일정과 다르다며 검토를 멈췄어요.",
    correction: "수요기관에 납기와 장소를 확인해요. 이 가상 의뢰의 납기는 계약 후 30일 이내, 장소는 도서관 2층 자료실이에요. 확인한 내용으로 요청서를 보완해 검토를 받아요.",
    button: "확인한 납기와 장소로 요청서 보완", source: "2. 조달요청 · 납기 등 요청 내용 기재",
  },
  "spec-brand": {
    stage: 1, title: "브랜드 제한 초안 수습", action: "spec-good",
    consequence: "특정 브랜드만 적은 초안을 본 선배가 경쟁 가능한 규격인지 재검토를 요청했어요.",
    correction: "일반경쟁에 맞는 규격을 검토해요. 이 사례는 문서 열람에 필요한 24형 이상·FHD 이상·HDMI 조건으로 수정하고 선배 검토를 받아요.",
    button: "협의한 성능 기준으로 규격 수정", source: "4. 규격검토 · 경쟁 가능한 규격",
  },
  "spec-empty": {
    stage: 1, title: "빈 규격서 수습", action: "spec-good",
    consequence: "규격을 지운 초안으로는 도서관에서 필요한 성능을 확인하기 어려워 검토가 멈췄어요.",
    correction: "사용 목적에 필요한 성능을 명시해 경쟁 가능한 규격으로 검토해요. 협의한 24형 이상·FHD 이상·HDMI 조건을 복원하고 검토를 받아요.",
    button: "필요한 성능 조건 복원", source: "4. 규격검토 · 경쟁 가능한 규격",
  },
  notice: {
    stage: 2, title: "수량이 다른 공고 초안 수습", action: "recovered-notice",
    consequence: "초안의 수량이 요청서 20대와 달라 검토본 저장이 멈췄어요.",
    correction: "구매결의와 입찰공고의 물품 내용을 확인해요. 요청서와 규격서를 대조해 20대로 바로잡은 뒤 선배 검토와 담당자 결재를 받아요.",
    button: "요청서와 대조해 20대로 바로잡기", source: "5. 구매결의 · 수량 / 6. 입찰공고",
  },
  product: {
    stage: 3, title: "작은 모니터 준비 수습", action: "product-good",
    consequence: "22형 제품을 준비하려다 공고의 24형 이상 조건에 미달한 것을 발견해 입찰 준비가 멈췄어요.",
    correction: "입찰은 공고한 조건에 맞춰 준비해요. 규격과 납기를 대조해 이 사례의 24형·FHD·HDMI 제품으로 바꾼 뒤 참가 조건을 확인해요.",
    button: "공고 조건에 맞는 M24로 변경", source: "6. 입찰공고 · 조건 / 8. 입찰",
  },
  opening: {
    stage: 4, title: "예정가격 순서 수습", action: "opening-good",
    consequence: "입찰 뒤 가격을 정하자는 메모를 본 담당자가 순서 오류를 찾아 확인을 멈췄어요.",
    correction: "예정가격은 입찰 전에 결정해요. 지금은 입찰 전에 결정해 둔 기록을 확인하고 공고한 선정방식에 따른 심사로 이어가요.",
    button: "입찰 전에 결정한 가격 기록 확인", source: "7. 예정가격결정 → 8. 입찰",
  },
  contract: {
    stage: 4, title: "접수와 계약 혼동 수습", action: "contract-good",
    consequence: "접수증만 보고 계약 완료라고 쓴 초안이 반려됐어요. 담당자가 심사·전자계약 기록을 요청했어요.",
    correction: "입찰 뒤 공고한 선정방식에 따른 심사를 확인해요. 이 가상 사례는 심사를 마쳤으므로 권한 있는 담당자가 낙찰예정자와 전자계약을 체결해요.",
    button: "심사 확인 후 담당자가 전자계약 체결", source: "8. 입찰 → 9. 낙찰자선정 및 계약체결",
  },
  delivery: {
    stage: 5, title: "부족한 한 대 수습", action: "delivery-report",
    consequence: "19대가 도착했는데 20대라고 적은 초안을 검사 담당자가 대조해 인수를 멈췄어요.",
    correction: "계약 조건과 실제 납품을 대조해요. 수요기관·계약상대자에게 한 대 보완을 요청한 뒤 20대의 검사·검수와 물품인수를 진행해요.",
    button: "부족분 보완 요청 후 검사 자료 받기", source: "11. 납품준비 ~ 14. 검사 검수 및 물품인수",
  },
  payment: {
    stage: 5, title: "빠진 지급 서류 수습", action: "payment-good",
    consequence: "입찰서만 붙인 지급 초안에 납품 서류가 빠져 담당자가 처리를 멈췄어요.",
    correction: "검사·검수와 물품인수 후 영수증·납품 서류를 확인해요. 서류 하자를 확인하고 계약종결 서류를 작성한 뒤 담당자가 대금 지급 절차를 진행해요.",
    button: "영수증·납품 서류 확인 후 지급 절차", source: "14. 검사 검수 및 물품인수 ~ 17. 계약종결",
  },
};

export function endingTitle(recoveries, mistakes = 0) {
  const count=Math.max(recoveries.length,mistakes);
  return count === 0 ? "정파" : count >= 3 ? "사파" : "정파 · 수습을 배운 신입";
}
