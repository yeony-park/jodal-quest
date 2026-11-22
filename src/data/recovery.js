// Fictional draft consequences teach the official sequence, checked 2026-11-21.
// Source : https://www.pps.go.kr/kor/content.do?key=00179
export const recoveryScenes = {
  intake: {
    stage: 0, title: "급한 납기 초안 수습", action: "intake-good",
    reaction: "잠깐, 도서관에서 그 날짜를 부탁했나요? 통화할 때 적어 둔 기한을 다시 봐요.",
    consequence: "도서관에서 원래 요청한 일정과 달라 요청서를 돌려보냈어요.",
    correction: "통화 메모를 보니 계약일로부터 30일 이내예요. 제가 요청서에 날짜와 납품 장소를 적어서 넘길게요.",
    source: "2. 조달요청 · 납기 등 요청 내용 기재",
  },
  "spec-brand": {
    stage: 1, title: "브랜드 제한 초안 수습", action: "spec-good",
    reaction: "잠깐만요, 달달 주무관. ‘S24만 허용’이 그대로 있네요. 다른 회사 모니터도 도서관에서 쓸 수 있다고 했죠?",
    consequence: "특정 브랜드만 적은 초안을 본 선배가 경쟁 가능한 규격인지 재검토를 요청했어요.",
    correction: "제가 ‘S24만 허용’을 빼고 24형 이상, FHD 이상, HDMI 연결이라고 적을게요. 그래야 이 조건을 갖춘 다른 회사도 참여할 수 있어요.",
    source: "4. 규격검토 · 경쟁 가능한 규격",
  },
  "spec-empty": {
    stage: 1, title: "빈 규격서 수습", action: "spec-good",
    reaction: "잠깐만요. 규격을 다 지우면 어떤 모니터를 사야 할지 누가 알겠어요?",
    consequence: "규격을 지운 초안으로는 도서관에서 필요한 성능을 확인하기 어려워 검토가 멈췄어요.",
    correction: "제가 도서관과 정한 조건을 다시 적을게요. 24형 이상, FHD 이상에 HDMI로 연결할 수 있는 모니터예요.",
    source: "4. 규격검토 · 경쟁 가능한 규격",
  },
  notice: {
    stage: 2, title: "수량이 다른 공고 초안 수습", action: "recovered-notice",
    reaction: "요청서는 20대예요. 공고에 올릴 수량부터 다시 세어 봐요.",
    consequence: "초안의 수량이 요청서 20대와 달라 검토본 저장이 멈췄어요.",
    correction: "제가 수량을 요청서와 똑같이 20대로 고쳐서 저장할게요. 그다음에 결재를 올리면 돼요.",
    source: "5. 구매결의 · 수량 / 6. 입찰공고",
  },
  product: {
    stage: 3, title: "작은 모니터 준비 수습", action: "product-good",
    reaction: "욘 대리, 이 모델은 22형이에요. 공고보다 작은 제품으로 입찰하면 규격을 맞출 수 없어요.",
    consequence: "22형 제품을 준비하려다 공고의 24형 이상 조건에 미달한 것을 발견해 입찰 준비가 멈췄어요.",
    correction: "공고에는 24형 이상이라고 적혀 있죠? 제가 제품표와 납기를 대조해서 M24로 바꿔 둘게요.",
    source: "6. 입찰공고 · 조건 / 8. 입찰",
  },
  opening: {
    stage: 4, title: "예정가격 순서 수습", action: "opening-good",
    reaction: "잠깐만요. 이미 입찰서를 받았는데 이제 예정가격을 정하겠다고요?",
    consequence: "입찰 뒤 가격을 정하자는 메모를 본 담당자가 순서 오류를 찾아 확인을 멈췄어요.",
    correction: "입찰 전에 정해 둔 예정가격 기록이 여기 있어요. 제가 날짜를 대조해서 개찰 자료에 표시할게요.",
    source: "7. 예정가격결정 → 8. 입찰",
  },
  contract: {
    stage: 4, title: "접수와 계약 혼동 수습", action: "contract-good",
    reaction: "접수증을 계약서로 착각했군요. 심사 결과와 전자계약 체결 기록은 어디 있죠?",
    consequence: "접수증만 보고 계약 완료라고 쓴 초안이 반려됐어요. 담당자가 심사·전자계약 기록을 요청했어요.",
    correction: "접수증은 입찰서를 냈다는 뜻이에요. 제가 심사 결과를 확인하고 낙찰예정자와 전자계약을 진행할게요.",
    source: "8. 입찰 → 9. 낙찰자선정 및 계약체결",
  },
  delivery: {
    stage: 5, title: "부족한 한 대 수습", action: "delivery-report",
    reaction: "한 대가 비는데 전부 받았다고요? 지금 인수하면 그 한 대는 어떻게 찾죠?",
    consequence: "19대가 도착했는데 20대라고 적은 초안을 검사 담당자가 대조해 인수를 멈췄어요.",
    correction: "계약은 스무 대인데 열아홉 대만 왔죠? 제가 사서님께 연락해서 빠진 한 대를 보완해 달라고 할게요.",
    source: "11. 납품준비 ~ 14. 검사 검수 및 물품인수",
  },
  payment: {
    stage: 5, title: "빠진 지급 서류 수습", action: "payment-good",
    reaction: "입찰서만 보고 지급하자고요? 물건을 받았다는 서류부터 가져와요.",
    consequence: "입찰서만 붙인 지급 초안에 납품 서류가 빠져 담당자가 처리를 멈췄어요.",
    correction: "입찰서만으로는 물건을 받았는지 알 수 없어요. 제가 영수증과 납품 서류를 대조해서 지급 담당자에게 넘길게요.",
    source: "14. 검사 검수 및 물품인수 ~ 17. 계약종결",
  },
};

export function endingTitle(recoveries, mistakes = 0) {
  const count=Math.max(recoveries.length,mistakes);
  return count === 0 ? "정파" : count >= 3 ? "사파" : "정파 · 수습을 배운 신입";
}
