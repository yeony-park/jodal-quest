// Fictional draft consequences teach the official sequence, checked 2026-11-21.
// Source : https://www.pps.go.kr/kor/content.do?key=00179
export const recoveryScenes = {
  intake: {
    stage: 0, title: "급한 납기 초안 수습", action: "intake-good",
    reaction: "잠깐, 도서관에서 그 날짜를 부탁했나요? 통화할 때 적어 둔 기한을 다시 봐요.",
    consequence: "도서관에서 원래 요청한 일정과 달라 요청서를 돌려보냈어요.",
    correction: "납기는 물품 사용 목적과 공급 일정에 큰 영향을 줘요. 수요기관 확인 없이 임의로 정하면 안 됩니다. 이번 납기는 계약 후 30일 이내, 장소는 도서관 2층 자료실이니 확인한 내용대로 요청서를 고쳐 검토를 받으세요.",
    button: "확인한 납기와 장소로 요청서 보완", source: "2. 조달요청 · 납기 등 요청 내용 기재",
  },
  "spec-brand": {
    stage: 1, title: "브랜드 제한 초안 수습", action: "spec-good",
    reaction: "이 브랜드만 된다고 쓰면 다른 회사는 어떻게 참여하죠? 도서관이 요구한 성능을 다시 보세요.",
    consequence: "특정 브랜드만 적은 초안을 본 선배가 경쟁 가능한 규격인지 재검토를 요청했어요.",
    correction: "일반경쟁에 맞는 규격을 검토해야 해요. 문서 열람에 필요한 24형 이상·FHD 이상·HDMI 조건으로 수정한 뒤 선배 검토를 받으세요.",
    button: "협의한 성능 기준으로 규격 수정", source: "4. 규격검토 · 경쟁 가능한 규격",
  },
  "spec-empty": {
    stage: 1, title: "빈 규격서 수습", action: "spec-good",
    reaction: "잠깐만요. 규격을 다 지우면 어떤 모니터를 사야 할지 누가 알겠어요?",
    consequence: "규격을 지운 초안으로는 도서관에서 필요한 성능을 확인하기 어려워 검토가 멈췄어요.",
    correction: "사용 목적에 맞는 성능을 적어야 경쟁 가능한 규격이 돼요. 협의한 24형 이상·FHD 이상·HDMI 조건을 되살려 검토를 받으세요.",
    button: "필요한 성능 조건 복원", source: "4. 규격검토 · 경쟁 가능한 규격",
  },
  notice: {
    stage: 2, title: "수량이 다른 공고 초안 수습", action: "recovered-notice",
    reaction: "요청서는 20대예요. 공고에 올릴 수량부터 다시 세어 봐요.",
    consequence: "초안의 수량이 요청서 20대와 달라 검토본 저장이 멈췄어요.",
    correction: "구매결의와 입찰공고의 물품 내용을 확인해야 해요. 요청서·규격서와 대조해 20대로 고친 뒤 선배 검토와 담당자 결재를 받으세요.",
    button: "요청서와 대조해 20대로 바로잡기", source: "5. 구매결의 · 수량 / 6. 입찰공고",
  },
  product: {
    stage: 3, title: "작은 모니터 준비 수습", action: "product-good",
    reaction: "앗, 이 모델은 22형이잖아! 그대로 냈으면 큰일 날 뻔했네.",
    consequence: "22형 제품을 준비하려다 공고의 24형 이상 조건에 미달한 것을 발견해 입찰 준비가 멈췄어요.",
    correction: "입찰은 공고 조건에 맞춰 준비해야 해요. 규격과 납기를 대조해 24형·FHD·HDMI 제품으로 바꾼 뒤 참가 조건을 확인하세요.",
    button: "공고 조건에 맞는 M24로 변경", source: "6. 입찰공고 · 조건 / 8. 입찰",
  },
  opening: {
    stage: 4, title: "예정가격 순서 수습", action: "opening-good",
    reaction: "잠깐만요. 이미 입찰서를 받았는데 이제 예정가격을 정하겠다고요?",
    consequence: "입찰 뒤 가격을 정하자는 메모를 본 담당자가 순서 오류를 찾아 확인을 멈췄어요.",
    correction: "예정가격은 입찰 전에 결정해요. 입찰 전에 정해 둔 기록을 확인하고 공고한 선정방식에 따른 심사로 넘어가세요.",
    button: "입찰 전에 결정한 가격 기록 확인", source: "7. 예정가격결정 → 8. 입찰",
  },
  contract: {
    stage: 4, title: "접수와 계약 혼동 수습", action: "contract-good",
    reaction: "접수증을 계약서로 착각했군요. 심사 결과와 전자계약 체결 기록은 어디 있죠?",
    consequence: "접수증만 보고 계약 완료라고 쓴 초안이 반려됐어요. 담당자가 심사·전자계약 기록을 요청했어요.",
    correction: "입찰 뒤엔 공고한 선정방식대로 심사했는지 확인해요. 이번 건은 심사를 마쳤으니 권한 있는 담당자가 낙찰예정자와 전자계약을 체결합니다.",
    button: "심사 확인 후 담당자가 전자계약 체결", source: "8. 입찰 → 9. 낙찰자선정 및 계약체결",
  },
  delivery: {
    stage: 5, title: "부족한 한 대 수습", action: "delivery-report",
    reaction: "한 대가 비는데 전부 받았다고요? 지금 인수하면 그 한 대는 어떻게 찾죠?",
    consequence: "19대가 도착했는데 20대라고 적은 초안을 검사 담당자가 대조해 인수를 멈췄어요.",
    correction: "계약 조건과 실제 납품 내역을 대조해야 해요. 수요기관·계약상대자에게 1대 보완을 요청한 뒤 20대의 검사·검수와 물품인수를 진행하세요.",
    button: "부족분 보완 요청 후 검사 자료 받기", source: "11. 납품준비 ~ 14. 검사 검수 및 물품인수",
  },
  payment: {
    stage: 5, title: "빠진 지급 서류 수습", action: "payment-good",
    reaction: "입찰서만 보고 지급하자고요? 물건을 받았다는 서류부터 가져와요.",
    consequence: "입찰서만 붙인 지급 초안에 납품 서류가 빠져 담당자가 처리를 멈췄어요.",
    correction: "검사·검수와 물품인수 뒤엔 영수증·납품 서류를 확인해요. 서류 하자를 점검하고 계약종결 서류를 작성하면 담당자가 대금 지급을 진행합니다.",
    button: "영수증·납품 서류 확인 후 지급 절차", source: "14. 검사 검수 및 물품인수 ~ 17. 계약종결",
  },
};

export function endingTitle(recoveries, mistakes = 0) {
  const count=Math.max(recoveries.length,mistakes);
  return count === 0 ? "정파" : count >= 3 ? "사파" : "정파 · 수습을 배운 신입";
}
