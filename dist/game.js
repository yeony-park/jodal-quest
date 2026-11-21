(() => {
  // src/data/initial-state.js
  var fresh = () => ({
    version: 1,
    started: false,
    stage: 0,
    floor: 0,
    awardBrief: false,
    openingChecked: false,
    deliveryIssueReported: false,
    inspectionChecked: false,
    brief: false,
    contact: false,
    specAdvice: false,
    noticeChecked: false,
    product: false,
    eligibility: false,
    mistakes: 0,
    history: []
  });

  // src/data/quests.js
  var LAST_STAGE = 6;
  var questNames = ["요청서 접수", "규격 검토", "입찰 공고", "기업 입찰 참여", "낙찰과 계약", "납품과 대금 지급"];
  var quests = [
    {
      title: "요청서의 빈칸을 채워라",
      desc: "새봄도서관에서 모니터 구매를 요청했어요. 빠진 정보를 찾아 접수 준비를 마치세요.",
      memo: "요청서는 구매의 출발점. 필요한 물품과 수량, 예산, 납기를 함께 확인해요.",
      dialogue: "조달달 주무관, 첫 의뢰가 왔어요! 먼저 저에게 업무를 듣고, 요청서를 살펴볼까요?"
    },
    {
      title: "브랜드보다 필요한 성능",
      desc: "특정 제품만 살 수 있는 규격인가요? 사용 목적을 지키면서 경쟁 가능한 규격을 검토하세요.",
      memo: "규격은 “어느 회사 제품”보다 “무엇을 할 수 있는가”에 집중해요.",
      dialogue: "꼼꼼한 접수였어요. 이번엔 규격서에 적힌 브랜드 이름이 꼭 필요한지 함께 살펴봐요."
    },
    {
      title: "같은 정보를, 모두에게",
      desc: "요청서와 공고 초안을 대조하고 선배에게 검토를 요청하세요.",
      memo: "신입은 초안 작성과 확인을 담당해요. 공고는 권한 있는 담당자의 검토·결재를 거쳐요.",
      dialogue: "공고 수량이 요청서와 같은지 확인해요. 초안이 준비되면 제가 검토할게요."
    },
    {
      title: "이번에는 기업의 시선으로",
      desc: "이제 공급기업 담당자입니다. 공고와 제품을 확인하고 모의 입찰서를 제출하세요.",
      memo: "입찰서 제출은 낙찰이나 계약 체결이 아니에요. 이후 별도 심사와 절차가 이어져요.",
      dialogue: "이제 공급기업 담당자의 시선으로 볼까요? 공고에 맞는 제품인지, 참가 준비가 되었는지 확인하세요."
    },
    {
      title: "엘리베이터 너머, 계약까지",
      desc: "조달달로 돌아왔어요. 엘리베이터를 타고 3층에서 개찰 자료와 계약 절차를 확인하세요.",
      memo: "예정가격은 입찰 전에 결정해요. 접수 후에는 공고한 선정방식에 따른 심사와 전자계약이 이어져요.",
      dialogue: "입찰서 접수 다음은 별도 절차예요. 3층 계약 담당자에게 배워 볼까요?"
    },
    {
      title: "스무 대가 도착했나요?",
      desc: "5층으로 돌아가 수요기관의 납품 자료를 확인하세요. 검사·검수와 물품인수 후 대금 청구를 검토해요.",
      memo: "계약 내용대로 납품했는지 검사·검수하고, 납품 서류를 확인한 뒤 대금 지급 절차를 진행해요.",
      dialogue: "계약 다음은 실제 납품이에요. 수량과 규격을 끝까지 확인해요."
    },
    {
      title: "첫 의뢰의 모든 과정을 마쳤어요!",
      desc: "요청서부터 대금 지급까지 여섯 퀘스트를 마쳤어요. 배운 내용을 다시 살펴보세요.",
      memo: "공공조달은 필요한 물품을 공정하게 구매하고, 납품과 대금 지급까지 확인하는 일이에요.",
      dialogue: "수고했어요! 작은 확인을 끝까지 이어 가니 의뢰가 마무리됐네요."
    }
  ];

  // src/core/runtime.js
  var keys = /* @__PURE__ */ new Set();
  var player = { x: 464, y: 144 };
  var runtime = {
    state: fresh(),
    floor: 0,
    storageOK: true,
    loaded: false,
    modalOpen: false,
    lastFocus: null,
    modalKind: "",
    toastTimer: null,
    target: null,
    touchKey: null,
    last: 0,
    walk: 0,
    audioCtx: null,
    master: null,
    muted: false,
    volume: 0.28,
    supplierVoiceReady: null,
    rookieVoiceReady: null,
    talkState: null,
    talkTimer: null,
    titleVisible: true,
    view: { width: 940, height: 560, dpr: 1, scale: 1, x: 0, y: 0 },
    portalSignedIn: false
  };

  // src/core/dom.js
  var $ = (id) => document.getElementById(id);

  // src/core/storage.js
  var KEY = "jodal-master-v1";
  function loadGame() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.version === 1 && Number.isInteger(s.stage) && s.stage >= 0 && s.stage <= LAST_STAGE && (s.floor === void 0 || s.floor === 0 || s.floor === 1) && ["awardBrief", "openingChecked", "deliveryIssueReported", "inspectionChecked"].every(
        (k) => s[k] === void 0 || typeof s[k] === "boolean"
      ) && [
        "started",
        "brief",
        "contact",
        "specAdvice",
        "noticeChecked",
        "product",
        "eligibility"
      ].every((k) => typeof s[k] === "boolean") && Number.isInteger(s.mistakes) && s.mistakes >= 0 && Array.isArray(s.history) && s.history.every((x) => typeof x === "string")) {
        runtime.state = { ...fresh(), ...s };
        runtime.floor = s.stage === 3 ? 0 : runtime.state.floor;
        runtime.state.floor = runtime.floor;
        runtime.loaded = s.started;
      }
    } catch (e) {
      runtime.storageOK = false;
    }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(runtime.state));
      runtime.storageOK = true;
      $("save-status").textContent = "✓ 자동 저장됨";
    } catch (e) {
      runtime.storageOK = false;
      $("save-status").textContent = "저장 불가 · 현재 창에서 계속";
    }
  }

  // src/data/world.js
  var TILE = 32;
  var MAP_W = 18;
  var MAP_H = 14;
  var spots = {
    doc: { x: 464, y: 144, floor: 0 },
    mentor: { x: 528, y: 144, npcX: 560, npcY: 112, floor: 0 },
    phone: { x: 80, y: 400, floor: 0 },
    terminal: { x: 464, y: 400, floor: 0 },
    supplier: { x: 272, y: 240, npcX: 304, npcY: 208, floor: 0 },
    elevator: { x: 16, y: 240 },
    officer: { x: 496, y: 112, npcX: 528, npcY: 96, floor: 1 },
    bidroom: { x: 432, y: 112, floor: 1 }
  };
  var floors = [
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
        { axis: "v", at: 11, from: 10, to: 14, z: 18 }
      ],
      labels: [
        ["0505 공사원가", 2.5, 1],
        ["0506 보건의료", 8.5, 1],
        ["0507 전기전자", 14.5, 1],
        ["0504 구매총괄", 2.5, 13],
        ["0503 조달개혁", 8.5, 13],
        ["0502 건설환경", 14.5, 13]
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
        { type: "plant", x: 17, y: 12, w: 1, h: 1 }
      ]
    },
    {
      level: "3F",
      caption: "새봄지방조달청 · 3층 개찰·계약 창구",
      corridorCols: [9],
      partitions: [
        { axis: "h", at: 5, from: 0, to: 18, doors: [3, 13], z: 17 },
        { axis: "h", at: 9, from: 0, to: 18, doors: [8, 14], z: 10 },
        { axis: "v", at: 9, from: 0, to: 5, z: 28 },
        { axis: "v", at: 11, from: 10, to: 14, z: 18 }
      ],
      labels: [
        ["0303 조달가격조사", 4, 1],
        ["0305 디지털조달", 13.5, 1],
        ["0304 공정조달", 5, 13],
        ["0306 조달관리", 14.5, 13]
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
        { type: "shelf", x: 16, y: 12, w: 1, h: 1 }
      ]
    }
  ];
  var furnishings = floors[0].furnishings;

  // src/data/learning.js
  var PROCEDURE_SOURCE = "https://www.pps.go.kr/kor/content.do?key=00179";
  var LAYOUT_SOURCE = "https://www.pps.go.kr/kor/content.do?key=00139";
  var lessons = [
    "조달요청에는 품명·규격·납기·예산 등이 필요해요. 빠진 정보는 수요기관에 확인해요.",
    "정부물품 구매는 일반경쟁이 원칙이에요. 이 사례는 협의한 성능으로 규격을 고쳐 경쟁 기회를 열었어요.",
    "구매결의에는 수량·계약방법·낙찰자 선정방식 등을 담고, 검토·결재를 거쳐 나라장터에 공고해요.",
    "기업은 공고의 규격과 참가 조건을 확인해 입찰서를 제출해요. 접수 뒤 낙찰자 선정과 계약 절차가 이어져요.",
    "예정가격은 입찰 전에 결정해요. 공고한 선정방식에 따른 심사 후 낙찰예정자와 전자계약을 체결해요.",
    "납품한 물품을 검사·검수하고 인수해요. 영수증과 납품 서류를 확인한 뒤 대금 청구·지급 절차를 진행해요."
  ];
  var glossary = [
    ["수요기관", "필요한 물품의 품명·규격·납기·예산 등을 적어 조달을 요청하는 기관이에요. 게임에서는 가상 새봄도서관이에요."],
    ["규격", "구매할 물품의 크기·성능 등 필요한 조건이에요. 이 게임에서는 24형 이상·FHD 이상·HDMI 연결을 확인해요."],
    ["구매결의", "수요기관명, 물품의 규격·수량, 계약방법, 낙찰자 선정방식, 예산, 입찰일시, 납품기한 등을 정리해요."],
    ["예정가격", "입찰 전에 결정하는 가격이에요. 공식 절차에서는 작성한 예비가격 중 추첨된 가격을 산술평균해 정해요."],
    ["낙찰자 선정·전자계약", "공고한 선정방식에 따른 심사를 거치고, 낙찰예정자와 전자계약을 체결해 계약이 성립해요."],
    ["검사·검수", "납품 물품을 검사공무원과 물품출납공무원이 각각 확인하고, 수요기관이 물품을 인수해요."],
    ["대금 청구", "계약상대자가 납품 후 조달청에 대금을 청구해요. 수요기관이 직접 지급하는 경우에는 수요기관에 청구해요."]
  ];

  // src/components/learning.js
  function lessonCard(stage) {
    return `<section class="lesson-card"><h3>이번 업무에서 배운 것</h3><p>${lessons[stage]}</p></section>`;
  }
  function learningReview() {
    return `<ol class="learning-review">${lessons.slice(0, runtime.state.stage).map((lesson, i) => `<li><strong>${questNames[i]}</strong><p>${lesson}</p></li>`).join("")}</ol>`;
  }
  function openGlossary() {
    show("조달 용어 수첩", `<p>지금까지 ${runtime.state.stage}개 업무를 마쳤어요. 용어를 누르면 설명이 펼쳐져요.</p>
    <div class="glossary">${glossary.map(([term, meaning]) => `<details><summary>${term}</summary><p>${meaning}</p></details>`).join("")}</div>
    <p class="source-note">기준 자료 : 조달청 물품구매 총액계약 업무처리절차 · 2026-11-21 확인<br />
    <a href="${PROCEDURE_SOURCE}" target="_blank" rel="noopener noreferrer">공식 업무처리절차 보기</a> · <a href="${LAYOUT_SOURCE}" target="_blank" rel="noopener noreferrer">층별배치도 보기</a></p>
    <p class="source-note">새봄지방조달청·도서관·기업·금액은 가상 설정이에요. 층별배치도를 참고해 재구성했고, 심사 세부 내용과 대기 시간은 줄였어요.</p>
    ${buttons([["close", "수첩 닫기"]])}`, "glossary");
  }

  // src/world/canvas.js
  var canvas = $("world");
  var ctx = canvas.getContext("2d");

  // src/components/title.js
  function intro() {
    runtime.titleVisible = true;
    $("title-screen").hidden = false;
    $("continue-button").hidden = !runtime.loaded;
    $("title-chars").innerHTML = face() + face("mentor");
    document.body.classList.add("title-mode");
    $("game-shell").inert = true;
  }
  function startGame(isNew) {
    unlockAudio();
    stopTalk();
    close();
    if (isNew) {
      runtime.state = fresh();
      runtime.floor = 0;
      runtime.target = null;
      runtime.state.started = true;
      runtime.loaded = true;
      player.x = 464;
      player.y = 144;
      runtime.portalSignedIn = false;
      save();
    }
    keys.clear();
    runtime.target = null;
    if (!isNew && runtime.floor === 1) {
      player.x = 48;
      player.y = 240;
    }
    runtime.titleVisible = false;
    $("title-screen").hidden = true;
    document.body.classList.remove("title-mode");
    $("game-shell").inert = false;
    setNotebook(false);
    render();
    if (runtime.state.stage === 0 && !runtime.state.brief) tutorial();
    else if (runtime.state.stage === LAST_STAGE) result();
  }

  // src/components/portal.js
  function portalShell(content, page) {
    const supplier = runtime.state.stage === 3;
    return (
      /* HTML */
      `<div class="monitor-chrome">
      <span>▣ 업무용 모니터</span><span>나라장터 체험</span
      ><button data-action="close" aria-label="모니터 닫고 사무실로">×</button>
    </div>
    <div class="training-ribbon">게임 속 모의 나라장터 · 실제 서비스와 연결되지 않습니다</div>
    <div class="g2b-top">
      <span>나라장터　 종합쇼핑몰　 조달데이터허브　 누리장터</span
      ><button data-action="portal-login">
        ${runtime.portalSignedIn ? supplier ? "욘 대리" : "조달달 주무관" : "로그인"}</button
      ><button data-action="portal-guide">인증센터</button>
    </div>
    <div class="g2b-brand">
      <div class="g2b-logo">
        <i></i>
        <div>나라장터<small>국가종합전자조달 · 체험</small></div>
      </div>
      <div class="g2b-search">
        <input
          id="portal-search"
          aria-label="공고명 검색"
          placeholder="공고명 검색"
          value="모니터"
        /><button data-action="portal-search" aria-label="검색">⌕</button>
      </div>
    </div>
    <nav class="g2b-nav" aria-label="모의 나라장터 메뉴">
      <button data-action="portal-work">발주</button><button data-action="portal-list">입찰</button
      ><button data-action="portal-guide">공통</button
      ><button data-action="portal-guide">이용자관리</button
      ><button data-action="portal-home">홈</button>
    </nav>
    <div class="g2b-content">${content}</div>
    <footer class="g2b-footer">
      ${supplier ? "기업 입찰 참여" : "조달청 공고 초안 준비"} 체험 · 가상 구매 1건 ·
      ${page === "home" ? "팝업 없는 시작 화면" : "세부 서류와 인증 절차는 축약했습니다."}
    </footer>`
    );
  }
  function openPortal(page = "home", query = "모니터") {
    let content = "";
    if (page === "home")
      content = /* HTML */
      `<div class="g2b-hero">
        나라장터에서 전하는 다양한<br /><strong>입찰정보</strong>와 <em>소식</em>을 만나보세요
      </div>
      <div class="g2b-grid">
        <section class="g2b-card starter">
          <h3>나라장터 시작하기</h3>
          <p>오늘의 한 건을 차근차근 준비해 보세요.</p>
          <button class="g2b-primary" data-action="portal-login">
            ${runtime.portalSignedIn ? "나의 업무" : "체험 로그인"}
          </button>
          <div class="g2b-small-buttons">
            <button data-action="portal-guide">이용자등록</button
            ><button data-action="portal-guide">이용 안내</button>
          </div>
          <div class="g2b-guide-note">오늘의 의뢰<br /><b>새봄도서관 모니터 20대</b></div>
        </section>
        <section class="g2b-card">
          <h3>나라장터 공지사항</h3>
          <p class="g2b-news">[안내] 공정한 입찰의 첫걸음</p>
          <p class="g2b-news">[안내] 규격과 납기를 확인하세요</p>
          <p class="g2b-news">[안내] 제출 전 정보를 한 번 더 확인</p>
          <button
            class="g2b-notice-link"
            data-action="${runtime.state.stage === 2 ? "portal-work" : "portal-list"}"
          >
            ${runtime.state.stage === 2 ? "작성 중인 공고 초안 확인" : "새봄도서관 모니터 구매 공고"}
          </button>
        </section>
        <section class="g2b-card">
          <h3>기관별 공지사항</h3>
          <p>새봄지방조달청</p>
          <p class="g2b-news">모두에게 같은 정보를 공개합니다.</p>
          <div class="g2b-support">
            <b>처음이어도 괜찮아요.</b><span>김주문의 업무 노트와<br />함께 진행해 보세요.</span
            ><button data-action="portal-guide">체험 이용 안내</button>
          </div>
        </section>
      </div>`;
    else if (page === "login")
      content = /* HTML */
      `<div class="g2b-breadcrumb">홈 / 체험 로그인</div>
      <h3>체험 계정으로 시작</h3>
      <div class="g2b-login-card">
        <div class="large-avatar">${face(runtime.state.stage === 3 ? "supplier" : "rookie")}</div>
        <h4>
          ${runtime.state.stage === 3 ? "욘 대리 · 새봄테크" : "조달달 주무관 · 새봄지방조달청"}
        </h4>
        <p>
          실제 아이디·비밀번호·인증서는 입력하지 않습니다.<br />미리 준비된 가상 계정으로
          진행합니다.
        </p>
        <button class="g2b-primary" data-action="portal-signin">가상 계정으로 로그인</button>
      </div>`;
    else if (page === "draft")
      content = /* HTML */
      `<div class="g2b-breadcrumb">홈 / 발주 / 공고 초안</div>
      <h3>물품 구매 공고 초안</h3>
      <div class="g2b-form">
        <div><label>공고명</label><span>새봄도서관 모니터 구매</span></div>
        <div><label>계약 구분</label><span>물품구매 총액계약</span></div>
        <div>
          <label for="portal-quantity">구매 수량</label
          ><input
            id="portal-quantity"
            type="number"
            min="1"
            max="100"
            value="${runtime.state.noticeChecked ? 20 : 2}"
          /><small>요청서: 20대</small>
        </div>
        <div><label>물품 규격</label><span>24형 이상 / FHD 이상 / HDMI</span></div>
        <div><label>납품기한</label><span>계약일로부터 30일 이내</span></div>
      </div>
      <p id="portal-error" role="status">
        ${runtime.state.noticeChecked ? "검토본 저장 완료. 아직 공고 전입니다." : "요청서와 공고 초안의 수량을 대조하세요."}
      </p>
      <div class="g2b-actions">
        <button class="g2b-primary" data-action="portal-save-draft">검토본 저장</button
        ><button data-action="close">사무실로 돌아가기</button>
      </div>`;
    else if (page === "list") {
      const matches = ["", "모니터", "새봄", "도서관", "새봄도서관 모니터 구매"].some(
        (term) => query.trim() === term
      ) || "새봄도서관 모니터 구매".includes(query.trim());
      const exists = runtime.state.stage >= 3 && matches;
      content = /* HTML */
      `<div class="g2b-breadcrumb">홈 / 입찰 / 입찰공고목록</div>
      <h3>입찰공고목록</h3>
      <div class="g2b-filter">업무 구분 <b>물품</b>　공고명 <b id="portal-query-label"></b></div>
      <div class="g2b-results">검색 결과 ${exists ? "1" : "0"}건</div>
      <div class="g2b-table">
        <div class="g2b-table-head">
          <span>업무</span><span>공고명</span><span>수요기관</span><span>진행</span>
        </div>
        ${exists ? '<button class="g2b-table-row" data-action="portal-detail"><span>물품</span><strong>새봄도서관 모니터 구매</strong><span>새봄도서관</span><span>입찰 중</span></button>' : '<p class="g2b-empty">' + (runtime.state.stage < 3 ? "아직 공고가 게시되지 않았습니다. 검토와 결재를 먼저 마치세요." : "일치하는 공고가 없습니다. “모니터”로 검색해 보세요.") + "</p>"}
      </div>`;
    } else if (page === "detail")
      content = /* HTML */
      `<div class="g2b-breadcrumb">홈 / 입찰 / 공고 상세</div>
      <h3>새봄도서관 모니터 구매</h3>
      <div class="g2b-form">
        <div><label>공고 상태</label><span>담당자 검토·결재 후 게시 완료</span></div>
        <div><label>수량 및 규격</label><span>20대 / 24형 이상 · FHD 이상 · HDMI</span></div>
        <div><label>납품기한</label><span>계약일로부터 30일 이내</span></div>
        <div>
          <label>선택 제품</label
          ><span
            >${runtime.state.product ? "새봄 M24 · 적합" : "제품 자료에서 적합 제품 선택 필요"}</span
          >
        </div>
      </div>
      <p>공고 조건과 참가 요건을 확인한 후 입찰서를 작성합니다.</p>
      <div class="g2b-actions">
        <button class="g2b-primary" data-action="portal-bid">입찰서 작성</button
        ><button data-action="portal-list">목록</button>
      </div>`;
    else if (page === "bid")
      content = /* HTML */
      `<div class="g2b-breadcrumb">홈 / 입찰 / 입찰서 작성</div>
      <h3>모의 입찰서 작성</h3>
      <div class="g2b-form">
        <div><label>업체 / 담당자</label><span>새봄테크 / 욘 대리</span></div>
        <div>
          <label>구매 물품</label
          ><span>모니터 20대 / ${runtime.state.product ? "새봄 M24" : "적합 제품 미선택"}</span>
        </div>
        <div><label>입찰총액</label><span>18,400,000원 (부가세 포함·가상 금액)</span></div>
      </div>
      <label class="checkline"
        ><input id="eligible" type="checkbox" ${runtime.state.eligibility ? "checked" : ""} />공고의
        참가자격과 제출서류를 확인했습니다. 가상 기업은 등록·요건을 갖춘 것으로 설정합니다.</label
      >
      <p class="g2b-caution">
        모의 제출이며 실제 입찰로 전송되지 않습니다. 접수는 낙찰·계약 체결을 뜻하지 않습니다.
      </p>
      <div class="g2b-actions">
        <button class="g2b-primary" data-action="submit-bid">모의 입찰서 제출</button
        ><button data-action="portal-detail">공고 다시 보기</button>
      </div>`;
    else
      content = /* HTML */
      `<h3>나라장터 체험 이용 안내</h3>
      <p>
        이번 체험은 한 건만 다룹니다. 공무원은 공고 초안을 준비하고 선배에게 검토를 요청합니다. 기업
        담당자는 게시된 공고를 검색하고 입찰서를 제출합니다.
      </p>
      <p>실제 이용자등록, 인증서, 보증과 세부 서류는 생략했습니다.</p>
      <button class="g2b-primary" data-action="portal-home">나라장터 첫 화면</button>`;
    show("모의 나라장터", portalShell(content, page), "portal");
    if (page === "list") $("portal-query-label").textContent = query || "전체";
  }
  function terminal() {
    openPortal("home");
  }
  function portalWork() {
    if (runtime.state.stage < 2) {
      toast("요청서 접수와 규격 검토를 먼저 마치세요.");
      return;
    }
    if (runtime.state.stage === 2) {
      if (!runtime.portalSignedIn) {
        openPortal("login");
        return;
      }
      openPortal("draft");
    } else openPortal("list");
  }
  function portalDetail() {
    if (runtime.state.stage < 3) {
      toast("공고 게시 전입니다.");
      return;
    }
    openPortal("detail");
  }
  function portalBid() {
    if (runtime.state.stage !== 3) {
      toast("기업 입찰 참여 단계에서 작성할 수 있어요.");
      return;
    }
    if (!runtime.portalSignedIn) {
      openPortal("login");
      return;
    }
    if (!runtime.state.product) {
      toast("사무실의 제품 자료에서 적합한 제품을 먼저 선택하세요.");
      return;
    }
    openPortal("bid");
  }
  function savePortalDraft() {
    if (runtime.state.stage !== 2) return;
    if (Number($("portal-quantity").value) !== 20) {
      runtime.state.mistakes++;
      save();
      $("portal-error").textContent = "요청서는 20대입니다. 수량을 맞춘 뒤 검토본을 저장하세요.";
      return;
    }
    runtime.state.noticeChecked = true;
    save();
    render();
    openPortal("draft");
    toast("검토본 저장 완료. 모니터를 닫고 김주문에게 검토를 요청하세요.");
  }

  // src/game/procurement.js
  function elevator() {
    if (runtime.state.stage === 3) return;
    show("엘리베이터 · 어느 층으로 갈까요?", `<p>현재 ${floors[runtime.floor].level}입니다. 가상 지방청의 업무 공간이에요.</p>
    ${buttons([[runtime.floor === 0 ? "floor-1" : "floor-0", runtime.floor === 0 ? "3층 · 개찰·계약 창구" : "5층 · 구매팀·납품 확인"], ["close", "이번 층에 머무르기", true]])}`, "elevator");
  }
  function travelTo(floor) {
    if (runtime.state.stage === 3 || ![0, 1].includes(floor)) return;
    close();
    keys.clear();
    runtime.target = null;
    runtime.floor = floor;
    runtime.state.floor = floor;
    player.x = spots.elevator.x + 32;
    player.y = spots.elevator.y;
    save();
    render();
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
      document.getElementById("scene").animate?.([{ opacity: 0.25 }, { opacity: 1 }], { duration: 280 });
    chime();
    toast(`${floors[floor].level} 도착 · 노트에서 다음 목표를 확인하세요.`);
  }
  function officer() {
    if (runtime.floor !== 1) return;
    if (runtime.state.stage !== 4) {
      speak("이계약 주무관", ["여기는 가상의 개찰·계약 창구예요. 입찰서 접수 뒤 공고한 선정방식에 따른 심사와 계약 절차를 확인해요."], () => {
      }, "officer");
      return;
    }
    if (!runtime.state.awardBrief) {
      speak("이계약 주무관", [
        "3층에 온 걸 환영해요. 입찰서 접수 다음에는 낙찰자 선정과 계약 절차가 남아 있어요.",
        "예정가격은 입찰 전에 결정해 두었어요. 먼저 옆의 개찰·계약 자료에서 순서를 확인해 주세요.",
        "이 가상 사례에서는 공고한 낙찰자 선정방식에 따른 심사를 마친 뒤 전자계약을 진행합니다."
      ], () => {
        runtime.state.awardBrief = true;
        save();
        render();
      }, "officer");
      return;
    }
    if (!runtime.state.openingChecked) {
      speak("이계약 주무관", ["옆의 개찰·계약 자료를 먼저 확인해 주세요. 예정가격을 언제 결정했는지 기억해 볼까요?"], () => {
      }, "officer");
      return;
    }
    show("입찰서 접수 다음은?", `${doc("가상 계약 검토 기록", [
      ["구매 물품", "새봄도서관 모니터 20대"],
      ["심사 상태", "공고한 낙찰자 선정방식에 따른 심사 완료 (가상)"],
      ["낙찰예정자", "새봄테크 (가상 기업)"],
      ["납품 조건", "계약일로부터 30일 이내 · 24형 이상 / FHD 이상 / HDMI"]
    ])}<p>권한 있는 계약 담당자는 어떤 절차를 진행할까요?</p><div class="choices">
    <button class="choice" data-action="contract-bad">입찰서가 접수됐으니 계약도 끝났다고 기록한다</button>
    <button class="choice" data-action="contract-good">심사 결과를 확인하고 낙찰예정자와 전자계약을 체결한다</button></div>`, "contract");
  }
  function bidroom() {
    if (runtime.floor !== 1) return;
    if (runtime.state.stage !== 4 || !runtime.state.awardBrief) {
      show("개찰·계약 자료", `<p>계약 담당자에게 업무 설명을 먼저 들어 주세요. 예정가격결정 → 입찰 → 낙찰자 선정·계약체결 순서로 진행해요.</p>${buttons([["close", "담당자에게 가기"]])}`);
      return;
    }
    show("입찰 전에 정한 가격을 확인해요", `${doc("개찰 단계 학습 메모", [
      ["공식 업무 순서", "예정가격결정 → 입찰 → 낙찰자 선정 및 계약체결"],
      ["현재 확인할 것", "입찰 전에 결정해 둔 예정가격과 공고한 선정방식"],
      ["사례", "새봄도서관 모니터 20대 · 가상 구매"]
    ])}<p>예정가격은 언제 결정할까요?</p><div class="choices">
    <button class="choice" data-action="opening-good">입찰 전에 결정해 두고, 지금 그 자료를 확인한다</button>
    <button class="choice" data-action="opening-bad">기업의 입찰서를 받은 다음 원하는 금액으로 정한다</button></div>`, "opening");
  }
  function openingGood() {
    if (runtime.state.stage !== 4 || runtime.floor !== 1 || !runtime.state.awardBrief) return;
    runtime.state.openingChecked = true;
    save();
    render();
    show("예정가격 확인 완료", `<div class="success">예정가격은 입찰 전에 결정해 두었어요.</div><p>공고한 낙찰자 선정방식에 따른 심사를 마친 가상 사례를 계약 담당자와 확인해요.</p>${buttons([["close", "계약 담당자에게 돌아가기"]])}`);
  }
  function contractGood() {
    if (runtime.state.stage !== 4 || runtime.floor !== 1 || !runtime.state.openingChecked) return;
    runtime.state.history.push("선정방식에 따른 심사 확인 및 가상 전자계약 체결");
    runtime.state.stage = 5;
    save();
    render();
    chime();
    show("가상 전자계약 체결 완료", `<div class="success">권한 있는 계약 담당자가 낙찰예정자와 전자계약을 체결했어요.</div><p>이제 엘리베이터로 5층에 돌아가 수요기관의 납품 자료를 확인해 주세요. 계약 뒤 납품까지의 시간은 게임에서 축약했어요.</p>${lessonCard(4)}${buttons([["advance", "납품 확인하러 가기"]])}`, "advance", false);
  }
  function delivery() {
    if (runtime.state.stage !== 5 || runtime.floor !== 0) return;
    const corrected = runtime.state.deliveryIssueReported;
    show("수요기관의 납품 확인 요청", `${doc("납품·검사·검수 자료 (가상)", [
      ["계약 수량", "모니터 20대"],
      ["실제 도착", corrected ? "모니터 20대 · 부족분 보완 완료" : "모니터 19대 · 1대 부족"],
      ["규격·납기", "24형 / FHD / HDMI · 계약 후 20일 (가상)"],
      ["담당", "검사공무원 · 물품출납공무원"]
    ])}<p>${corrected ? "보완한 납품 자료가 도착했어요. 다음 절차는?" : "수량을 대조했더니 한 대가 부족해요. 어떻게 할까요?"}</p>
    <div class="choices">${corrected ? '<button class="choice" data-action="delivery-good">검사·검수 담당자가 계약 내용과 일치함을 확인하고 물품을 인수한다</button>' : '<button class="choice" data-action="delivery-report">수요기관·계약상대자에게 부족분 보완을 요청한다</button><button class="choice" data-action="delivery-bad">19대만 도착했지만 20대를 모두 받았다고 기록한다</button>'}</div>`, "delivery");
  }
  function reportDeliveryIssue() {
    if (runtime.state.stage !== 5 || runtime.floor !== 0) return;
    runtime.state.deliveryIssueReported = true;
    save();
    render();
    speak("수요기관 담당자", ["한 대가 부족한 것을 확인했어요. 계약상대자에게 보완을 요청하겠습니다.", "부족한 한 대가 도착했어요! 수요기관 연락 데스크에서 보완한 자료를 다시 확인해 주세요. 게임에서는 대기 시간을 축약했어요."], () => {
    }, "contact");
  }
  function inspectDelivery() {
    if (runtime.state.stage !== 5 || runtime.floor !== 0 || !runtime.state.deliveryIssueReported) return;
    runtime.state.inspectionChecked = true;
    save();
    render();
    show("검사·검수와 물품인수 완료", `<div class="success">계약한 규격과 수량 20대를 확인하고 물품을 인수했어요.</div><p>수요기관이 영수증을 발급했어요. 업무용 모니터에서 납품 서류와 대금 청구를 확인하세요.</p>${buttons([["close", "대금 청구 확인하러 가기"]])}`);
  }
  function payment() {
    if (runtime.state.stage !== 5 || runtime.floor !== 0) return;
    if (!runtime.state.inspectionChecked) {
      show("대금 지급 전 확인", `<p>수요기관의 납품 자료부터 확인하세요. 검사·검수와 물품인수 후 영수증과 납품 서류를 확인해요.</p>${buttons([["close", "납품 확인하러 가기"]])}`);
      return;
    }
    show("납품 서류와 대금 청구 확인", `${doc("가상 계약 종결 검토", [
      ["검사·검수 및 인수", "모니터 20대 · 완료"],
      ["영수증·납품 서류", "수요기관 영수증 발급 · 서류 하자 없음"],
      ["대금 청구", "계약상대자가 조달청에 청구 (가상 사례)"]
    ])}<p>권한 있는 담당자의 다음 업무로 알맞은 것은?</p><div class="choices">
    <button class="choice" data-action="payment-bad">납품 서류를 생략하고 입찰서만 보고 지급한다</button>
    <button class="choice" data-action="payment-good">확인한 납품 서류로 계약종결 서류를 작성하고 대금 지급 절차를 진행한다</button></div>`, "payment");
  }
  function finishPayment() {
    if (runtime.state.stage !== 5 || runtime.floor !== 0 || !runtime.state.inspectionChecked) return;
    runtime.state.history.push("검사·검수 및 물품인수 확인, 가상 대금 지급");
    runtime.state.stage = 6;
    save();
    render();
    close();
    chime();
    speak("김주문", ["스무 대가 모두 도착했는지 끝까지 확인했군요. 납품 서류를 확인하고 담당자가 대금 지급 절차를 마쳤어요.", "요청서부터 계약과 납품까지, 오늘 배운 절차를 다시 떠올려 봐요."], ending);
  }

  // src/components/inventory.js
  var inventoryItems = [
    {
      name: "사원증",
      description: "새봄지방조달청 신입 9급 주무관 조달달의 사원증. 김주문에게 첫 업무를 받은 증표입니다.",
      color: "#72a3ad"
    },
    {
      name: "요청서",
      description: "수요기관에 확인한 납기와 장소를 보완한 요청서. 모니터 20대, 계약일로부터 30일 이내입니다.",
      color: "#bd9f64"
    },
    {
      name: "규격서",
      description: "수요기관과 협의하고 선배가 검토한 성능 중심 규격서. 24형 이상, FHD 이상, HDMI 연결입니다.",
      color: "#789c72"
    },
    {
      name: "공고문",
      description: "담당자 검토·결재 후 게시된 모의 공고문. 수량은 요청서와 같은 20대입니다.",
      color: "#728dc3"
    },
    {
      name: "접수증",
      description: "새봄테크의 모의 입찰서가 접수되었습니다. 제출은 낙찰이나 계약 체결이 아닙니다.",
      color: "#b686b7"
    },
    {
      name: "계약서",
      description: "공고한 선정방식에 따른 심사를 마치고 권한 있는 담당자가 체결한 가상 전자계약. 모니터 20대, 계약 후 30일 이내 납품입니다.",
      color: "#c58e62"
    },
    {
      name: "완료철",
      description: "검사·검수와 물품인수, 영수증 및 납품 서류 확인을 마치고 대금 지급까지 진행한 가상 업무 기록입니다.",
      color: "#76a395"
    }
  ];
  function ownedItems() {
    return inventoryItems.map(
      (_, i) => i === 0 ? runtime.state.brief || runtime.state.stage > 0 : runtime.state.stage >= i
    );
  }
  function itemIcon(i) {
    const color = inventoryItems[i].color;
    return (
      /* HTML */
      `<svg viewBox="0 0 24 28" shape-rendering="crispEdges" aria-hidden="true">
    <path d="M5 2H16V5H20V26H5Z" fill="#252c30" />
    <path d="M6 3H15V7H19V25H6Z" fill="#efe3ba" />
    <path d="M7 8H18V11H7Z" fill="${color}" />
    ${i === 0 ? '<path d="M9 13H15V19H9Z" fill="#609092"/><path d="M8 21H16V23H8Z" fill="#9b987c"/>' : '<path d="M8 14H17V16H8ZM8 18H16V20H8Z" fill="#a6a18b"/>'}${i === 4 ? '<path d="M14 20H20V25H14Z" fill="#b57aa0"/>' : ""}
  </svg>`
    );
  }
  function renderInventory() {
    const owned = ownedItems();
    $("inventory-slots").innerHTML = inventoryItems.map(
      (item, i) => (
        /* HTML */
        `<button
          class="inventory-slot ${owned[i] ? "owned" : ""}"
          data-action="item-${i}"
          aria-label="${i + 1}번 칸 · ${owned[i] ? item.name : "빈칸"}"
          title="${owned[i] ? item.name : "아직 얻지 못한 물건"}"
        >
          <span class="slot-number">${i + 1}</span
          >${owned[i] ? itemIcon(i) : '<span class="slot-empty">·</span>'}<span class="slot-name"
            >${owned[i] ? item.name : "빈칸"}</span
          >
        </button>`
      )
    ).join("");
    $("level-badge").textContent = runtime.state.stage === LAST_STAGE ? "Lv. 2" : "Lv. 1";
  }
  function inspectItem(i) {
    if (!ownedItems()[i]) {
      toast("퀘스트를 마치면 물건이 이 칸에 들어와요.");
      return;
    }
    show(
      inventoryItems[i].name,
      /* HTML */
      `<div class="large-item">${itemIcon(i)}</div>
      <p>${inventoryItems[i].description}</p>
      ${buttons([["close", "가방 닫기"]])}`,
      "item"
    );
  }

  // src/game/actions.js
  var actions = {
    close,
    help,
    glossary: openGlossary,
    interact,
    "return-rookie": returnRookie,
    restart: () => show(
      "처음부터 다시 시작할까요?",
      /* HTML */
      `<p>저장된 진행 상황과 학습 점수가 초기화됩니다.</p>
        ${buttons([
        ["new", "새 게임 시작"],
        ["close", "취소", true]
      ])}`,
      "restart"
    ),
    new: () => startGame(true),
    continue: () => startGame(false),
    "start-new": () => {
      if (runtime.loaded) actions.restart();
      else startGame(true);
    },
    quests: () => setNotebook($("quest-panel").hidden),
    sound: soundSettings,
    "talk-next": nextLine,
    mute: () => {
      runtime.muted = !runtime.muted;
      stopSounds();
      updateVolume();
    },
    "voice-preview": previewVoice,
    "rookie-voice-preview": () => previewVoice("rookie"),
    guide: () => {
      setNotebook(false);
      go(nextTarget());
    },
    mentor,
    phone: () => runtime.state.stage === 5 ? delivery() : phone(),
    doc: documentDesk,
    terminal: () => runtime.state.stage === 5 ? payment() : terminal(),
    elevator,
    "floor-0": () => travelTo(0),
    "floor-1": () => travelTo(1),
    officer,
    bidroom,
    "opening-good": openingGood,
    "opening-bad": () => wrong("예정가격은 입찰 전에 결정해 둡니다. 입찰서를 받은 뒤 임의로 바꾸지 않아요.", "bidroom"),
    "contract-good": contractGood,
    "contract-bad": () => wrong("입찰서 접수 후 공고한 낙찰자 선정방식에 따른 심사를 거치고, 낙찰예정자와 전자계약을 체결해요.", "officer"),
    "delivery-report": reportDeliveryIssue,
    "delivery-good": inspectDelivery,
    "delivery-bad": () => wrong("계약한 20대와 납품한 19대가 다릅니다. 부족한 수량을 보완한 뒤 검사·검수해야 해요.", "phone"),
    "payment-good": finishPayment,
    "payment-bad": () => wrong("검사·검수와 물품인수, 영수증과 납품 서류를 확인하고 대금 청구·지급 절차를 진행해요.", "terminal"),
    approve: () => {
      if (runtime.state.stage === 2 && runtime.state.noticeChecked)
        complete(
          "검토·결재 후 공고 게시",
          "선배의 검토와 권한 있는 담당자의 결재를 거쳐 모의 공고가 게시됐습니다."
        );
    },
    advance: () => {
      close();
      if (runtime.state.stage <= 3) {
        player.x = 464;
        player.y = 144;
      }
      runtime.portalSignedIn = false;
      if (runtime.state.stage === 3)
        speak(
          "욘 대리",
          [
            "공고가 게시됐군요! 이제 새봄테크 사무실의 욘 대리로 플레이합니다.",
            "제품 자료를 비교한 뒤 업무용 모니터에서 공고를 검색하고 모의 입찰서를 준비해 볼게요."
          ],
          () => {
          },
          "supplier"
        );
    },
    "intake-good": () => {
      if (runtime.state.stage !== 0) return;
      if (!runtime.state.brief || !runtime.state.contact) {
        show(
          "확인할 정보가 남았어요",
          /* HTML */
          `<p>
            선배에게 업무를 듣고 수요기관에 납품기한을 확인해 주세요. 추측으로 요청서를 채울 수는
            없어요.
          </p>
          ${buttons([["close", "정보 수집하러 가기"]])}`
        );
        return;
      }
      complete("요청서 접수 준비 완료", "확인한 납기를 보완하고 선배 검토를 거쳐 접수했습니다.");
    },
    "intake-bad": () => wrong(
      "납기는 구매 목적과 공급 가능성에 영향을 줍니다. 수요기관 확인 없이 임의로 정하지 않아요.",
      "doc"
    ),
    "spec-good": () => {
      if (runtime.state.stage !== 1) return;
      if (!runtime.state.specAdvice) {
        show(
          "수정 근거를 먼저 확인해요",
          /* HTML */
          `<p>선배 김주문에게 수요기관과 확인한 성능 조건을 들어 보세요.</p>
          ${buttons([["close", "선배에게 가기"]])}`
        );
        return;
      }
      complete(
        "규격 검토 완료",
        "수요기관과 협의한 성능 중심 수정안을 작성하고, 선배의 검토를 받았습니다."
      );
    },
    "spec-bad": () => wrong(
      "이 사례에는 특정 브랜드만 필요한 사유가 없어요. 필요한 성능으로 표현하면 여러 기업이 경쟁할 수 있습니다.",
      "doc"
    ),
    "spec-empty": () => wrong(
      "규격을 모두 없애면 목적에 맞지 않는 물품이 올 수 있어요. 필요한 성능은 명확히 남겨야 해요.",
      "doc"
    ),
    "product-good": () => {
      if (runtime.state.stage !== 3) return;
      runtime.state.product = true;
      save();
      render();
      show(
        "공고에 맞는 제품을 골랐어요",
        /* HTML */
        `<div class="success">새봄 M24 · 크기, 해상도, 연결 방식 및 납기 충족</div>
        <p>모의 나라장터에서 참가 조건을 확인하고 입찰서를 제출하세요.</p>
        ${buttons([["close", "모의 입찰 준비하기"]])}`
      );
    },
    "product-bad": () => wrong(
      "22형은 공고의 24형 이상 조건에 미달해요. 가격만 보지 말고 규격과 납기를 함께 확인하세요.",
      "doc"
    ),
    "submit-bid": finishBid
  };
  Object.assign(actions, {
    supplier: supplierNPC,
    "portal-home": () => openPortal("home"),
    "portal-login": () => openPortal(runtime.portalSignedIn ? runtime.state.stage === 2 ? "draft" : "list" : "login"),
    "portal-signin": () => {
      runtime.portalSignedIn = true;
      openPortal(runtime.state.stage === 2 ? "draft" : "list");
    },
    "portal-work": portalWork,
    "portal-list": () => openPortal("list"),
    "portal-search": () => openPortal("list", $("portal-search").value),
    "portal-guide": () => openPortal("guide"),
    "portal-detail": portalDetail,
    "portal-bid": portalBid,
    "portal-save-draft": savePortalDraft
  });
  for (let i = 0; i < inventoryItems.length; i++) actions["item-" + i] = () => inspectItem(i);

  // src/game/quests.js
  function nextTarget() {
    if (runtime.state.stage === 0)
      return !runtime.state.brief ? "mentor" : !runtime.state.contact ? "phone" : "doc";
    if (runtime.state.stage === 1) return !runtime.state.specAdvice ? "mentor" : "doc";
    if (runtime.state.stage === 2) return !runtime.state.noticeChecked ? "terminal" : "mentor";
    if (runtime.state.stage === 3) return !runtime.state.product ? "doc" : "terminal";
    if (runtime.state.stage === 4) return !runtime.state.awardBrief ? "officer" : !runtime.state.openingChecked ? "bidroom" : "officer";
    if (runtime.state.stage === 5) return !runtime.state.inspectionChecked ? "phone" : "terminal";
    return "result";
  }
  function wrong(text, back) {
    runtime.state.mistakes++;
    save();
    show(
      "잠깐, 한 번 더 확인해요",
      /* HTML */
      `<div class="alert">${text}</div>
      <p>아직 제출되지 않았어요. 자료를 다시 확인하고 수정할 수 있어요.</p>
      ${buttons([[back, "다시 검토하기"]])}`,
      "feedback",
      false
    );
  }
  function complete(title, body) {
    const completed = runtime.state.stage;
    if (completed > 2) return;
    runtime.state.history.push(
      ["요청서 확인 및 접수 준비", "경쟁 가능한 규격 수정", "검토·결재 후 공고 게시"][completed]
    );
    runtime.state.stage++;
    save();
    render();
    show(
      title,
      /* HTML */
      `<div class="success">✓ ${body}</div>
      <p>
        ${completed === 2 ? "검토·결재를 거쳐 공고가 게시됐습니다. 다음 장면에서는 기업 담당자로 전환합니다." : "퀘스트 완료! 진행 상황을 이 브라우저에 저장했습니다."}
      </p>
      ${lessonCard(completed)}
      ${buttons([["advance", completed === 2 ? "기업 담당자로 전환" : "다음 퀘스트"]])}`,
      "advance",
      false
    );
    chime();
  }
  function mentor() {
    if (runtime.state.stage === 0) {
      speak(
        "김주문",
        [
          "새봄도서관에서 모니터 20대를 요청했어요. 요청서에 납품기한이 빠져 있네요.",
          "왼쪽 연락 데스크에서 수요기관에 납기를 확인해 주세요. 확인한 내용으로 요청서를 보완하면 됩니다."
        ],
        () => {
          runtime.state.brief = true;
          save();
          render();
        }
      );
    } else if (runtime.state.stage === 1) {
      speak(
        "김주문",
        [
          "규격서에 특정 브랜드가 적혀 있네요. 이번 사례에서는 그 브랜드만 필요한 사유가 확인되지 않았어요.",
          "수요기관과 확인했더니 문서 열람용 24형 이상, FHD 이상, HDMI 연결이면 된대요.",
          "이 성능 기준을 담아 수정안을 만들어 주세요. 필요한 조건은 지키고, 다른 기업도 참여할 수 있게요."
        ],
        () => {
          runtime.state.specAdvice = true;
          save();
          render();
        }
      );
    } else if (runtime.state.stage === 2) {
      if (!runtime.state.noticeChecked) {
        speak("김주문", [
          "공고 초안을 먼저 확인해 주세요. 요청서는 모니터 20대였죠? 수량이 같은지 대조해 보세요."
        ]);
        return;
      }
      speak(
        "김주문",
        [
          "수량 20대와 성능 조건을 확인했어요. 초안 검토를 마쳤습니다.",
          "이제 권한 있는 담당자의 구매결의·결재 절차로 넘길게요. 그 절차가 끝나야 공고가 게시됩니다."
        ],
        () => actions.approve()
      );
    } else speak("김주문", ["수고했어요, 조달달 주무관! 확인하고 협의하는 습관을 기억하세요."]);
  }
  function phone() {
    if (runtime.state.stage === 0) {
      if (!runtime.state.brief) {
        speak("안내", ["먼저 김주문 선배에게 첫 업무를 들어 보세요."]);
        return;
      }
      speak(
        "수요기관 담당자",
        [
          "새봄도서관입니다. 아, 요청서에 납기를 빠뜨렸네요!",
          "계약일로부터 30일 이내에 도서관 2층 자료실로 부탁드려요. 이용자들이 문서를 읽을 때 쓸 모니터예요."
        ],
        () => {
          runtime.state.contact = true;
          save();
          render();
          toast("납기 30일 · 2층 자료실을 기록했어요.");
        },
        "contact"
      );
    } else show("수요기관 확인 메모", `${requestDoc()}${buttons([["close", "돌아가기"]])}`);
  }
  function requestDoc() {
    return doc("물품 구매 요청서", [
      ["수요기관", "새봄도서관"],
      ["구매 물품", "이용자용 모니터 20대"],
      ["배정 예산", "20,000,000원 (가상 설정)"],
      ["사용 목적", "자료실에서 문서·자료 열람"],
      ["납품기한", runtime.state.contact ? "계약일로부터 30일 이내" : "미기재 · 확인 필요"],
      ["납품 장소", runtime.state.contact ? "새봄도서관 2층 자료실" : "새봄도서관"]
    ]);
  }
  function documentDesk() {
    if (runtime.state.stage === 0) {
      show(
        "첫 요청서를 검토하세요",
        `${requestDoc()}<p>접수 준비를 마치려면 어떻게 해야 할까요?</p><div class="choices"><button class="choice" data-action="intake-good">확인한 납기를 보완하고 검토를 요청한다<small>수요기관 확인 내용으로 빈칸을 채웁니다.</small></button><button class="choice" data-action="intake-bad">급하니 납기를 임의로 7일로 적는다<small>빠른 처리를 위해 내가 정합니다.</small></button></div>`
      );
    } else if (runtime.state.stage === 1) {
      show(
        "규격서에서 공정한 기준 찾기",
        `${doc("물품 규격서 초안", [
          ["기존 문구", "“별빛전자 S24 제품만 허용”"],
          ["사용 목적", "문서 및 자료 열람"],
          ["필요 성능", "24형 이상 · FHD 이상 · HDMI 연결"],
          ["수량", "20대"]
        ])}<p>검토 의견으로 가장 알맞은 것은?</p><div class="choices"><button class="choice" data-action="spec-bad">기존 브랜드와 모델명 제한을 그대로 유지한다</button><button class="choice" data-action="spec-good">협의한 성능 기준으로 수정안을 작성한다<small>브랜드 제한 대신 크기·해상도·연결 조건을 명시합니다.</small></button><button class="choice" data-action="spec-empty">경쟁이 쉬워지도록 모든 규격을 삭제한다</button></div>`
      );
    } else if (runtime.state.stage === 3) {
      show(
        "공고 규격과 제품을 비교하세요",
        `${doc("공고의 납품 조건", [
          ["구매 수량", "20대"],
          ["필요 성능", "24형 이상 · FHD 이상 · HDMI 연결"],
          ["납품기한", "계약일로부터 30일 이내"]
        ])}<div class="choices"><button class="choice" data-action="product-good">새봄 M24 · 24형 / FHD / HDMI<small>20대 공급 가능 · 계약 후 20일 내 납품 가능</small></button><button class="choice" data-action="product-bad">새봄 C22 · 22형 / FHD / HDMI<small>20대 공급 가능 · 저렴하지만 화면 크기가 부족합니다.</small></button></div>`
      );
    } else show("확인한 구매 요청서", `${requestDoc()}${buttons([["close", "확인 완료"]])}`);
  }
  function tutorial() {
    speak(
      "김주문",
      [
        "반가워요, 조달달 주무관! 새봄지방조달청에 온 걸 환영해요. 첫 업무는 제가 옆에서 알려 줄게요.",
        "방향키나 WASD로 걸어 보세요. 사람이나 책상 이름을 누르면 알아서 찾아가요. 대화는 스페이스바로 넘기면 돼요.",
        "왼쪽 위 작은 지도에서 내 위치를 볼 수 있어요. 오른쪽 위는 제 업무 노트, 아래 7칸은 물건을 모으는 인벤토리예요.",
        "우리는 내용을 확인하고 초안을 준비해요. 공고는 검토와 담당자 결재를 거칩니다. 혼자 확정하면 안 돼요.",
        "첫 의뢰는 도서관 모니터 20대예요. 요청서에 납기가 빠졌네요. 연락 데스크에서 확인해 주세요. 노트에도 적어 둘게요."
      ],
      () => {
        runtime.state.brief = true;
        save();
        render();
        setNotebook(true);
        toast("첫 업무를 받았어요. 김주문의 노트를 확인해 보세요.");
      }
    );
  }
  function supplierNPC() {
    speak(
      "욘 대리",
      [
        "안녕하세요! 새봄테크에서 입찰 업무를 맡고 있는 욘입니다.",
        "공고가 게시되면 나라장터에서 같은 정보를 확인하고 참여할 거예요. 규격과 납기를 꼼꼼히 읽어야죠."
      ],
      () => {
      },
      "supplier"
    );
  }
  function finishBid() {
    if (runtime.state.stage !== 3) return;
    const checked = $("eligible") && $("eligible").checked;
    runtime.state.eligibility = !!checked;
    if (!runtime.state.product || !checked) {
      save();
      render();
      toast(
        !runtime.state.product ? "규격에 맞는 제품을 먼저 선택하세요." : "참가 조건 확인란에 체크해 주세요."
      );
      return;
    }
    runtime.state.history.push("기업 모의 입찰서 접수");
    runtime.state.stage = 4;
    runtime.portalSignedIn = false;
    save();
    render();
    close();
    chime();
    speak(
      "욘 대리",
      [
        "모의 입찰서가 접수됐어요! 공고를 꼼꼼히 읽으니 제출까지 할 수 있었네요.",
        "접수는 낙찰이나 계약 체결이 아니에요. 다음 절차가 남아 있다는 점도 기억할게요."
      ],
      () => {
        runtime.floor = 0;
        runtime.state.floor = 0;
        render();
        show("모의 입찰서 접수 완료", `<div class="success">입찰서가 접수됐어요. 이어서 낙찰자 선정과 계약 절차를 배워요.</div>${lessonCard(3)}${buttons([["return-rookie", "조달달로 돌아가 다음 업무 받기"]])}`, "advance", false);
      },
      "supplier"
    );
  }
  function returnRookie() {
    if (runtime.state.stage !== 4) return;
    speak("김주문", [
      "조달달 주무관으로 돌아왔어요. 모의 입찰서는 접수됐고, 이제 낙찰자 선정과 계약 절차를 배울 차례예요.",
      "복도 왼쪽 엘리베이터를 타고 3층 계약 담당자에게 가 보세요. 노트의 다음 목표 버튼도 안내해 줄 거예요."
    ]);
  }

  // src/world/render.js
  function project(x, y, z = 0) {
    return { x: 426 + (x - y) / TILE * 22, y: 102 + (x + y) / TILE * 11 - z };
  }
  function polygon(points, color, stroke) {
    ctx.beginPath();
    points.forEach(
      (p, i) => i ? ctx.lineTo(Math.round(p.x), Math.round(p.y)) : ctx.moveTo(Math.round(p.x), Math.round(p.y))
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
  function tile(x, y, color) {
    polygon(
      [
        project(x * TILE, y * TILE),
        project((x + 1) * TILE, y * TILE),
        project((x + 1) * TILE, (y + 1) * TILE),
        project(x * TILE, (y + 1) * TILE)
      ],
      color,
      "#82938b33"
    );
  }
  function box(x, y, w, h, z, top = "#c5cbbd", left = "#899e91", right = "#72877e") {
    const a = project(x * TILE, y * TILE), b = project((x + w) * TILE, y * TILE), c = project((x + w) * TILE, (y + h) * TILE), d = project(x * TILE, (y + h) * TILE), up = (p) => ({ x: p.x, y: p.y - z });
    polygon([d, c, up(c), up(d)], left);
    polygon([b, c, up(c), up(b)], right);
    polygon([up(a), up(b), up(c), up(d)], top);
  }
  function drawFurniture(o) {
    if (o.type === "shelf") {
      box(o.x, o.y, o.w, o.h, 41, "#b6c4b8", "#758e86", "#536e69");
      const p2 = project((o.x + 0.1) * TILE, (o.y + o.h) * TILE, 26);
      for (let i = 0; i < Math.round(o.w * 5); i++) {
        ctx.fillStyle = ["#c58a69", "#e0c378", "#759aaf", "#9caf81"][i % 4];
        ctx.fillRect(Math.round(p2.x + i * 5), Math.round(p2.y + i * 2.5), 3, 10);
      }
      return;
    }
    if (o.type === "plant") {
      box(o.x + 0.15, o.y + 0.15, 0.65, 0.65, 13, "#d2a876", "#96704b", "#73563f");
      const p2 = project((o.x + 0.5) * TILE, (o.y + 0.5) * TILE, 30);
      ctx.fillStyle = "#4e7c53";
      ctx.fillRect(p2.x - 8, p2.y - 8, 16, 20);
      ctx.fillStyle = "#7a9e64";
      ctx.fillRect(p2.x - 12, p2.y - 2, 24, 8);
      return;
    }
    box(o.x + 0.08, o.y + 0.08, o.w - 0.16, o.h - 0.16, 19, "#dfc695", "#ad8c68", "#92724e");
    if (o.type === "table") return;
    const p = project((o.x + 0.5) * TILE, (o.y + 0.5) * TILE, 21);
    if (o.type === "phone") {
      ctx.fillStyle = "#2f5356";
      ctx.fillRect(p.x - 9, p.y - 8, 18, 9);
      ctx.fillRect(p.x - 12, p.y - 12, 24, 5);
      return;
    }
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
      ctx.fillStyle = "#fff1c8";
      ctx.fillRect(q.x - 8, q.y - 8, 16, 10);
      ctx.fillStyle = "#b1ad8a";
      ctx.fillRect(q.x - 5, q.y - 5, 10, 2);
    }
  }
  function roomLabel(label, x, y) {
    const p = project(x * TILE, y * TILE);
    ctx.fillStyle = "#f7f4ddd9";
    ctx.fillRect(Math.round(p.x - 43), Math.round(p.y - 10), 86, 17);
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#527060";
    ctx.fillText(label, Math.round(p.x), Math.round(p.y + 2));
  }
  function drawElevator() {
    const wall = 0.12 * TILE, face2 = (y, z) => project(wall, y * TILE, z);
    polygon([face2(6.55, 0), face2(8.45, 0), face2(8.45, 35), face2(6.55, 35)], "#4c6268");
    polygon([face2(6.7, 0), face2(7.47, 0), face2(7.47, 31), face2(6.7, 31)], "#b9c7c4", "#7f9391");
    polygon([face2(7.53, 0), face2(8.3, 0), face2(8.3, 31), face2(7.53, 31)], "#c7d3cf", "#7f9391");
    const lamp = face2(7.5, 41);
    ctx.fillStyle = "#263e4d";
    ctx.fillRect(Math.round(lamp.x - 15), Math.round(lamp.y - 6), 30, 12);
    ctx.fillStyle = "#ffe58a";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("EV " + floors[runtime.floor].level, Math.round(lamp.x), Math.round(lamp.y + 3));
  }
  function behind(a, b) {
    return a.x1 <= b.x0 + 1e-6 || a.y1 <= b.y0 + 1e-6;
  }
  function paintOrder(items) {
    const n = items.length, waiting = new Array(n).fill(0), after = items.map(() => []), used = new Array(n).fill(false), order = [];
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const ij = behind(items[i], items[j]), ji = behind(items[j], items[i]);
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
          if (used[i] || free && waiting[i]) continue;
          if (pick < 0 || items[i].x0 + items[i].y0 < items[pick].x0 + items[pick].y0) pick = i;
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
      x0: x / TILE,
      y0: y / TILE,
      x1: x / TILE,
      y1: y / TILE,
      draw: () => pixelPerson(x, y, kind, moving)
    };
  }
  function sceneItems(moving) {
    const floor = floors[runtime.floor], items = [];
    for (const p of floor.partitions) {
      if (p.axis === "v")
        items.push({
          x0: p.at,
          y0: p.from,
          x1: p.at + 0.18,
          y1: p.to,
          draw: () => box(p.at, p.from, 0.18, p.to - p.from, p.z, "#e0dfca", "#b8bdab", "#96aa9a")
        });
      else
        for (let x = p.from; x < p.to; x++)
          if (!p.doors.includes(x))
            items.push({
              x0: x,
              y0: p.at,
              x1: x + 1,
              y1: p.at + 0.13,
              draw: () => box(x, p.at, 1, 0.13, p.z, "#dce1cd", "#a3b5a7", "#93a994")
            });
    }
    for (const o of floor.furnishings)
      items.push({ x0: o.x, y0: o.y, x1: o.x + o.w, y1: o.y + o.h, draw: () => drawFurniture(o) });
    if (runtime.state.stage !== 3) {
      if (runtime.floor === 0) {
        items.push(person(spots.mentor.npcX, spots.mentor.npcY, "mentor"));
        items.push(person(spots.supplier.npcX, spots.supplier.npcY, "supplier"));
      } else items.push(person(spots.officer.npcX, spots.officer.npcY, "officer"));
    }
    items.push(person(player.x, player.y, runtime.state.stage === 3 ? "supplier" : "rookie", moving));
    return items;
  }
  function draw(t, moving) {
    camera();
    const floor = floors[runtime.floor];
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#738e84";
    ctx.fillRect(0, 0, 940, 620);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = i % 2 ? "#78958a" : "#6c877e";
      ctx.fillRect(i * 137 % 940, i * 83 % 620, 2, 2);
    }
    polygon(
      [
        project(0, 0),
        project(MAP_W * TILE, 0),
        project(MAP_W * TILE, MAP_H * TILE),
        project(0, MAP_H * TILE)
      ].map((p2) => ({ x: p2.x, y: p2.y + 8 })),
      "#385a54"
    );
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++) {
        const corridor = y >= 6 && y <= 8 || floor.corridorCols.includes(x);
        tile(
          x,
          y,
          corridor ? (x + y) % 2 ? "#b8c6bb" : "#c0cec2" : (x + y) % 2 ? "#d6d9c7" : "#dcdccc"
        );
      }
    box(0, 0, 18, 0.12, 37, "#e0e5d0", "#b6c2b2", "#9cae9f");
    box(0, 0, 0.12, 14, 37, "#e0e5d0", "#b6c2b2", "#9cae9f");
    if (runtime.state.stage !== 3) drawElevator();
    for (const [label, x, y] of floor.labels) roomLabel(label, x, y);
    const dest = spots[guideTarget(nextTarget())];
    if (dest && !runtime.modalOpen && !runtime.talkState) {
      const p2 = project(dest.x, dest.y);
      ctx.strokeStyle = "#ffe58a";
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(p2.x - 15), Math.round(p2.y - 7), 30, 11);
    }
    for (const item of paintOrder(sceneItems(moving))) item.draw();
    const p = project(player.x, player.y);
    ctx.fillStyle = "#fff4d7";
    ctx.fillRect(Math.round(p.x - 28), Math.round(p.y + 7), 56, 15);
    ctx.fillStyle = "#3e6359";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      runtime.state.stage === 3 ? "욘 대리" : "조달달",
      Math.round(p.x),
      Math.round(p.y + 18)
    );
  }
  function resizeWorld() {
    runtime.view.width = window.innerWidth;
    runtime.view.height = window.innerHeight;
    runtime.view.dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
    canvas.width = Math.ceil(runtime.view.width * runtime.view.dpr);
    canvas.height = Math.ceil(runtime.view.height * runtime.view.dpr);
  }
  function camera() {
    runtime.view.scale = Math.max(runtime.view.width / 940, runtime.view.height / 620);
    const w = runtime.view.width / runtime.view.scale, h = runtime.view.height / runtime.view.scale, p = project(player.x, player.y);
    runtime.view.x = Math.max(0, Math.min(940 - w, (runtime.titleVisible ? 470 : p.x) - w / 2));
    runtime.view.y = Math.max(0, Math.min(620 - h, (runtime.titleVisible ? 310 : p.y) - h * 0.55));
    ctx.setTransform(
      runtime.view.dpr * runtime.view.scale,
      0,
      0,
      runtime.view.dpr * runtime.view.scale,
      -runtime.view.x * runtime.view.dpr * runtime.view.scale,
      -runtime.view.y * runtime.view.dpr * runtime.view.scale
    );
  }
  var miniX = (x) => 10 + x / MAP_W * 168;
  var miniY = (y) => 8 + y / MAP_H * 96;
  function miniLayout() {
    const floor = floors[runtime.floor], r = (n) => Math.round(n * 10) / 10;
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
    return `<path d="M10 ${r(miniY(6))}H178V${r(miniY(9))}H10Z" fill="#c6d2b6"/><path d="${walls}" stroke="#97ad99" stroke-width="2" fill="none"/><g fill="#819c84">${floor.furnishings.filter((o) => o.type !== "plant").map(
      (o) => `<rect x="${r(miniX(o.x))}" y="${r(miniY(o.y))}" width="${r(o.w / MAP_W * 168)}" height="${r(o.h / MAP_H * 96)}"/>`
    ).join("")}</g><rect x="6" y="${r(miniY(6.6))}" width="6" height="${r(1.8 / MAP_H * 96)}" fill="#4c6268"/>`;
  }
  function updateMap() {
    if ($("mini-layout").dataset?.floor !== String(runtime.floor)) {
      $("mini-layout").innerHTML = miniLayout();
      $("mini-layout").setAttribute("data-floor", runtime.floor);
    }
    for (const [id, s] of Object.entries(spots)) {
      const el = $("spot-" + id), p = project(s.npcX ?? s.x, s.npcY ?? s.y, id === "doc" ? 88 : 65);
      if (id === "mentor" || id === "officer") {
        p.y += 7;
      }
      if (id === "elevator") p.y += 12;
      el.hidden = !spotActive(id);
      el.style.left = (p.x - runtime.view.x) * runtime.view.scale + "px";
      el.style.top = (p.y - runtime.view.y) * runtime.view.scale + "px";
    }
    const officer2 = $("spot-officer");
    if (!officer2.hidden) {
      const scale = runtime.view.scale, feet = project(player.x, player.y), head = { x: (feet.x - runtime.view.x) * scale, y: (feet.y - 36 - runtime.view.y) * scale, w: 36 * scale, h: 28 * scale }, bidroom2 = $("spot-bidroom"), task = { x: parseFloat(bidroom2.style.left), y: parseFloat(bidroom2.style.top), w: bidroom2.offsetWidth || 130, h: bidroom2.offsetHeight || 32 }, guide = $("quick-guide").parentElement?.getBoundingClientRect(), obstacles = [head, task];
      if (guide) obstacles.push({ x: guide.x + guide.width / 2, y: guide.y + guide.height / 2, w: guide.width, h: guide.height });
      const width = officer2.offsetWidth || 120, height = officer2.offsetHeight || 32, baseX = parseFloat(officer2.style.left), baseY = parseFloat(officer2.style.top);
      for (const [dx, dy] of [[0, 0], [0, -40], [0, -80], [70, 0], [-70, 0]]) {
        const x = Math.max(width / 2 + 8, Math.min(runtime.view.width - width / 2 - 8, baseX + dx)), y = Math.max(height / 2 + 8, baseY + dy);
        if (obstacles.some((o) => Math.abs(x - o.x) < (width + o.w) / 2 + 6 && Math.abs(y - o.y) < (height + o.h) / 2 + 6)) continue;
        officer2.style.left = x + "px";
        officer2.style.top = y + "px";
        break;
      }
    }
    $("mini-player").setAttribute("cx", miniX(player.x / TILE));
    $("mini-player").setAttribute("cy", miniY(player.y / TILE));
    const next = spots[guideTarget(nextTarget())];
    $("mini-target").style.display = next ? "" : "none";
    if (next) {
      $("mini-target").setAttribute("cx", miniX(next.x / TILE));
      $("mini-target").setAttribute("cy", miniY(next.y / TILE));
    }
  }

  // src/world/characters.js
  var spriteRows = [
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
    "....XXXX.XXXX..."
  ];
  var hair = { supplier: "#49384d", mentor: "#605049", officer: "#2f3a4f" };
  var jacket = { supplier: "#956ba5", mentor: "#c29458", officer: "#5f7f63" };
  function pixelPalette(kind) {
    return {
      H: hair[kind] || "#243a43",
      S: "#efba8d",
      X: "#26373d",
      M: "#a76557",
      J: jacket[kind] || "#3b7c91",
      W: "#f9edcf",
      A: kind === "supplier" ? "#f0cb7a" : kind === "officer" ? "#e3d9a8" : "#bd6e4b",
      P: kind === "supplier" ? "#654b73" : "#3a4e54"
    };
  }
  function spriteCells(kind) {
    const cells = [];
    spriteRows.forEach(
      (row, y) => [...row].forEach((c, x) => {
        if (c !== ".") cells.push([x, y, c]);
      })
    );
    if (kind === "supplier") {
      for (let y = 6; y < 15; y++) for (const x of [2, 3, 12, 13]) cells.push([x, y, "H"]);
      cells.push([12, 5, "A"], [13, 5, "A"], [12, 6, "A"]);
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
        [11, 7]
      ])
        cells.push([x, y, "H"]);
    return cells;
  }
  function face(kind = "rookie") {
    const palette = pixelPalette(kind);
    return (
      /* HTML */
      `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 28"
    shape-rendering="crispEdges"
    aria-hidden="true"
  >
    ${spriteCells(kind).map(
        ([x, y, c]) => (
          /* HTML */
          `<rect x="${x + 2}" y="${y + 2}" width="1" height="1" fill="${palette[c]}" />`
        )
      ).join("")}
  </svg>`
    );
  }
  var sheets = /* @__PURE__ */ new Map();
  function spriteSheet(kind, pose = 0) {
    const key = kind + pose;
    if (!sheets.has(key)) {
      const sheet = document.createElement("canvas");
      sheet.width = 16;
      sheet.height = 24;
      const g = sheet.getContext("2d"), palette = pixelPalette(kind);
      for (const [x, y, c] of spriteCells(kind)) {
        let dy = 0;
        if (y > 19) {
          if (pose === 1 && x < 8 || pose === 3 && x >= 8) dy = -1;
        } else if (pose === 2) dy = 1;
        g.fillStyle = palette[c];
        g.fillRect(x, y + dy, 1, 1);
      }
      sheets.set(key, sheet);
    }
    return sheets.get(key);
  }
  function walkPose(moving) {
    return moving ? [1, 2, 3, 2][Math.floor(runtime.walk / 1.6) % 4] : 0;
  }
  function pixelPerson(x, y, kind, moving = false) {
    const p = project(x, y), k = runtime.view.dpr * runtime.view.scale, left = Math.round((p.x - 16 - runtime.view.x) * k), top = Math.round((p.y - 48 - runtime.view.y) * k), width = Math.max(16, Math.round(32 * k)), height = Math.max(24, Math.round(48 * k));
    ctx.fillStyle = "#263e4d30";
    ctx.fillRect(Math.round(p.x - 13), Math.round(p.y - 3), 26, 6);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spriteSheet(kind, walkPose(moving)), left, top, width, height);
    ctx.restore();
  }

  // src/components/dialogue.js
  function stopTalk() {
    clearTimeout(runtime.talkTimer);
    runtime.talkTimer = null;
    runtime.talkState = null;
    $("speech").hidden = true;
    document.body.classList.remove("talking");
    stopSounds();
  }
  function speak(name, lines, onDone = () => {
  }, role = "mentor") {
    close();
    stopTalk();
    keys.clear();
    runtime.target = null;
    setNotebook(false);
    runtime.talkState = { name, lines, onDone, role, index: 0, revealed: 0 };
    $("speech").hidden = false;
    document.body.classList.add("talking");
    $("speech-name").textContent = name;
    $("speech-portrait").innerHTML = face(role === "contact" ? "supplier" : role);
    $("speech").focus();
    typeLine();
  }
  function typeLine() {
    if (!runtime.talkState) return;
    clearTimeout(runtime.talkTimer);
    const t = runtime.talkState, text = t.lines[t.index];
    t.revealed = 0;
    $("speech-text").textContent = "";
    $("speech-count").textContent = `${t.index + 1} / ${t.lines.length}`;
    $("speech-hint").textContent = "문장 모두 보기";
    function tick() {
      if (runtime.talkState !== t) return;
      t.revealed++;
      $("speech-text").textContent = text.slice(0, t.revealed);
      if (t.revealed % 2 === 1) playSyllable(text[t.revealed - 1], t.role);
      if (t.revealed < text.length)
        runtime.talkTimer = setTimeout(tick, /[,!?。.]$/.test(text.slice(0, t.revealed)) ? 160 : 42);
      else {
        $("speech-hint").textContent = t.index === t.lines.length - 1 ? "대화 마치기" : "다음 이야기";
        runtime.talkTimer = null;
      }
    }
    tick();
  }
  function revealLine() {
    if (!runtime.talkState) return;
    clearTimeout(runtime.talkTimer);
    runtime.talkTimer = null;
    stopSounds();
    runtime.talkState.revealed = runtime.talkState.lines[runtime.talkState.index].length;
    $("speech-text").textContent = runtime.talkState.lines[runtime.talkState.index];
    $("speech-hint").textContent = runtime.talkState.index === runtime.talkState.lines.length - 1 ? "대화 마치기" : "다음 이야기";
  }
  function nextLine() {
    if (!runtime.talkState) return;
    if (runtime.talkState.revealed < runtime.talkState.lines[runtime.talkState.index].length) {
      revealLine();
      return;
    }
    runtime.talkState.index++;
    if (runtime.talkState.index < runtime.talkState.lines.length) {
      stopSounds();
      typeLine();
    } else {
      const done = runtime.talkState.onDone;
      stopTalk();
      done();
      if (!runtime.modalOpen) canvas.focus({ preventScroll: true });
    }
  }

  // src/components/ending.js
  var MORE_QUESTS = "https://www.pps.go.kr/kor/bbs/list.do?key=00645";
  function ending() {
    runtime.floor = 0;
    runtime.state.floor = 0;
    player.x = 14.5 * TILE;
    player.y = 4.5 * TILE;
    speak(
      "조달달",
      [
        "요청서의 빈칸부터 계약, 납품과 대금 지급까지 마쳤어. 공정한 기준과 꼼꼼한 확인을 기억할 거야!",
        "이제 나도... 조달의 왕이야!"
      ],
      result,
      "rookie"
    );
  }
  function result() {
    if (runtime.state.stage !== LAST_STAGE) return;
    const score = Math.max(60, 100 - runtime.state.mistakes * 5);
    show(
      "이제 나도... 조달의 왕이야!",
      /* HTML */
      `<div class="level-up-tag">LEVEL UP!</div>
      <div class="level-up-hero">
        ${face("rookie")}<strong>Lv. 1 <span>〉</span> Lv. 2</strong>
      </div>
      <div class="level-progress"><i></i></div>
      <p class="center">첫 의뢰 완료 · 조달의 왕을 향한 첫걸음</p>
      <div class="stats">
        <div class="stat"><strong>6 / 6</strong><small>퀘스트</small></div>
        <div class="stat"><strong>7 / 7</strong><small>획득한 물건</small></div>
        <div class="stat"><strong>${score}</strong><small>학습 점수</small></div>
      </div>
      <div class="success">가상 구매 완료 · 입찰서 접수 → 심사 확인·전자계약 → 검사·검수 → 대금 지급</div>
      <details class="ending-review" open><summary>여섯 업무에서 배운 것</summary>${learningReview()}</details>
      <a class="ending-link" href="${MORE_QUESTS}" target="_blank" rel="noopener noreferrer"
        >더 많은 퀘스트를 깨고 싶다면?</a
      >
      <p class="ending-destination">조달청 채용정보로 이동합니다 · 외부 사이트</p>
      ${buttons([
        ["close", "사무실로 돌아가기"],
        ["restart", "다시 플레이", true]
      ])}`,
      "result"
    );
  }

  // src/world/navigation.js
  function cellBlocked(x, y, floor = runtime.floor) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
    const f = floors[floor];
    for (const p of f.partitions) {
      if (p.axis === "h" && y === p.at && x >= p.from && x < p.to && !p.doors.includes(x))
        return true;
      if (p.axis === "v" && x === p.at && y >= p.from && y < p.to) return true;
    }
    return f.furnishings.some((o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);
  }
  function canWalk(x, y) {
    return !cellBlocked(Math.floor(x / TILE), Math.floor(y / TILE));
  }
  function spotActive(id) {
    const spot = spots[id];
    if (!spot) return false;
    if (runtime.state.stage === 3) return id === "doc" || id === "terminal";
    return spot.floor === void 0 || spot.floor === runtime.floor;
  }
  function guideTarget(id) {
    const spot = spots[id];
    return spot && !spotActive(id) && runtime.state.stage !== 3 ? "elevator" : id;
  }
  function routeTo(id) {
    const goal = spots[id], sx = Math.floor(player.x / TILE), sy = Math.floor(player.y / TILE), gx = Math.floor(goal.x / TILE), gy = Math.floor(goal.y / TILE), queue = [[sx, sy]], seen = /* @__PURE__ */ new Map([[sx + "," + sy, null]]);
    let reached = false;
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i];
      if (x === gx && y === gy) {
        reached = true;
        break;
      }
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const nx = x + dx, ny = y + dy, key = nx + "," + ny;
        if (!cellBlocked(nx, ny) && !seen.has(key)) {
          seen.set(key, [x, y]);
          queue.push([nx, ny]);
        }
      }
    }
    if (!reached) return [];
    const path = [];
    let cell = [gx, gy];
    while (cell) {
      path.unshift({ x: (cell[0] + 0.5) * TILE, y: (cell[1] + 0.5) * TILE });
      cell = seen.get(cell.join(","));
    }
    return path;
  }
  function go(id) {
    if (id === "result") {
      if (runtime.state.stage === LAST_STAGE) result();
      return;
    }
    if (!runtime.state.started || runtime.titleVisible || runtime.talkState) return;
    close();
    setNotebook(false);
    keys.clear();
    if (!spotActive(id)) {
      const next = guideTarget(id);
      if (next === id) return;
      toast(`${floors[spots[id].floor].level}에 있어요. 엘리베이터로 이동합니다.`);
      id = next;
    }
    const path = routeTo(id);
    if (!path.length) {
      toast("복도를 따라 가까이 이동해 주세요.");
      return;
    }
    runtime.target = { id, path, index: 0 };
  }
  function stepPlayer(dx, dy) {
    if (canWalk(player.x + dx, player.y)) player.x += dx;
    if (canWalk(player.x, player.y + dy)) player.y += dy;
  }
  function interact() {
    let closest = null, distance = Infinity;
    for (const [id, p] of Object.entries(spots)) {
      if (!spotActive(id)) continue;
      const d = Math.hypot(player.x - p.x, player.y - p.y);
      if (d < distance) {
        distance = d;
        closest = id;
      }
    }
    if (distance < 55) actions[closest]();
    else toast("사람이나 모니터 가까이 다가가 주세요.");
  }
  function frame(t) {
    const dt = Math.min((t - runtime.last) / 1e3, 0.035) || 0;
    runtime.last = t;
    let moving = false;
    if (!runtime.modalOpen && !runtime.talkState && !runtime.titleVisible && runtime.state.started) {
      if (runtime.target) {
        const dest = runtime.target.path[runtime.target.index], dx = dest.x - player.x, dy = dest.y - player.y, d = Math.hypot(dx, dy), step = 145 * dt;
        if (d < step + 1) {
          player.x = dest.x;
          player.y = dest.y;
          runtime.target.index++;
          if (runtime.target.index === runtime.target.path.length) {
            const id = runtime.target.id;
            runtime.target = null;
            actions[id]();
          }
        } else {
          player.x += dx / d * step;
          player.y += dy / d * step;
          moving = true;
        }
      } else {
        let sx = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft")), sy = Number(keys.has("s") || keys.has("arrowdown")) - Number(keys.has("w") || keys.has("arrowup"));
        if (sx || sy) {
          let dx = sx + sy, dy = sy - sx, n = Math.hypot(dx, dy);
          stepPlayer(dx / n * 105 * dt, dy / n * 105 * dt);
          moving = true;
        }
      }
    }
    if (moving) runtime.walk += dt * 12;
    draw(t, moving);
    updateMap();
    requestAnimationFrame(frame);
  }

  // src/components/hud.js
  function render() {
    const q = quests[runtime.state.stage];
    $("steps").innerHTML = questNames.map(
      (n, i) => (
        /* HTML */
        `<div
          class="step ${i < runtime.state.stage ? "done" : i === runtime.state.stage ? "active" : ""}"
          ${i === runtime.state.stage ? 'aria-current="step"' : ""}
        >
          <span class="num">${i < runtime.state.stage ? "✓" : String(i + 1).padStart(2, "0")}</span>
          <div>
            <strong>${n}</strong
            ><small
              >${i < runtime.state.stage ? "완료" : i === runtime.state.stage ? "진행 중" : "다음 퀘스트"}</small
            >
          </div>
        </div>`
      )
    ).join("");
    $("quest-title").textContent = q.title;
    $("quest-desc").textContent = q.desc;
    $("memo").textContent = q.memo;
    $("quest-count").textContent = runtime.state.stage + " / " + LAST_STAGE;
    const tasks = runtime.state.stage === 0 ? [
      [runtime.state.brief, "선배에게 첫 업무 듣기"],
      [runtime.state.contact, "수요기관에 납기 확인"],
      [false, "요청서 검토 및 접수 준비"]
    ] : runtime.state.stage === 1 ? [
      [runtime.state.specAdvice, "선배에게 규격 검토 조언 듣기"],
      [false, "규격 수정안 작성"]
    ] : runtime.state.stage === 2 ? [
      [runtime.state.noticeChecked, "공고 초안 수량 대조"],
      [false, "선배 검토 및 결재 절차"]
    ] : runtime.state.stage === 3 ? [
      [runtime.state.product, "공고에 맞는 제품 선택"],
      [runtime.state.eligibility, "참가 조건 확인"],
      [false, "모의 입찰서 제출"]
    ] : runtime.state.stage === 4 ? [[runtime.state.awardBrief, "3층 계약 담당자에게 설명 듣기"], [runtime.state.openingChecked, "입찰 전 결정한 예정가격 확인"], [false, "선정방식에 따른 심사 확인 후 전자계약"]] : runtime.state.stage === 5 ? [[runtime.state.deliveryIssueReported, "5층에서 납품 부족분 보완 요청"], [runtime.state.inspectionChecked, "보완한 물품의 검사·검수와 인수"], [false, "영수증·납품 서류 확인 후 대금 지급"]] : [
      [true, "요청서 확인"],
      [true, "규격 수정 및 공고"],
      [true, "기업 입찰 참여"],
      [true, "계약·납품·대금 지급"]
    ];
    $("todos").innerHTML = tasks.map(
      ([ok, t]) => (
        /* HTML */
        `<li class="${ok ? "checked" : ""}">
          <span class="check">${ok ? "✓" : ""}</span>${t}
        </li>`
      )
    ).join("");
    $("location").textContent = runtime.state.stage === 3 ? "새봄테크 · 영업팀 사무실" : floors[runtime.floor].caption;
    $("player-label").textContent = runtime.state.stage === 3 ? "욘 대리 · 기업 담당자" : "플레이어 · 조달달 / 신입 9급 주무관";
    $("scene-time").textContent = [
      "DAY 01 · 09:00",
      "DAY 01 · 10:00",
      "공고 준비 · 시간 축약",
      "입찰 참여 · 시간 축약",
      "개찰·계약 · 시간 축약",
      "납품·대금 지급 · 시간 축약",
      "전체 업무 완료"
    ][runtime.state.stage];
    $("spot-doc").textContent = runtime.state.stage === 3 ? "제품 자료 · 내 책상" : runtime.state.stage === 1 ? "규격서 · 내 책상" : "요청서 · 내 책상";
    const target = guideTarget(nextTarget());
    for (const id of Object.keys(spots))
      $("spot-" + id).classList.toggle("target", target === id);
    $("guide-button").textContent = runtime.state.stage === LAST_STAGE ? "완료 기록 보기" : target === "elevator" ? "엘리베이터로 이동" : "다음 목표로 이동";
    $("quest-label").textContent = runtime.state.stage === LAST_STAGE ? "완료" : `퀘스트 ${runtime.state.stage + 1}`;
    const goalLabels = { mentor: "김주문에게 업무 듣기", phone: runtime.state.stage === 5 ? "5층 · 납품 자료 확인" : "수요기관에 연락", doc: runtime.state.stage === 3 ? "공고에 맞는 제품 고르기" : "내 책상 자료 확인", terminal: runtime.state.stage === 5 ? "5층 · 대금 청구 확인" : "업무용 모니터 사용", officer: "3층 · 계약 담당자 만나기", bidroom: "3층 · 개찰·계약 자료 확인", result: "완료 기록 다시 보기" };
    $("current-goal").textContent = goalLabels[nextTarget()];
    $("quick-guide").textContent = $("guide-button").textContent;
    renderInventory();
    if (!runtime.storageOK) $("save-status").textContent = "저장 불가 · 현재 창에서 계속";
  }
  function setNotebook(open) {
    $("quest-panel").hidden = !open;
    $("quest-toggle").setAttribute("aria-expanded", String(open));
  }

  // src/components/modal.js
  function toast(t) {
    $("toast").textContent = t;
    $("toast").hidden = false;
    clearTimeout(runtime.toastTimer);
    runtime.toastTimer = setTimeout(() => $("toast").hidden = true, 3e3);
  }
  function show(title, body, kind = "", closable = true) {
    stopSounds();
    setNotebook(false);
    $("game-shell").inert = true;
    keys.clear();
    runtime.target = null;
    runtime.lastFocus = document.activeElement;
    runtime.modalOpen = true;
    runtime.modalKind = kind;
    $("modal").classList.toggle("portal-modal", kind === "portal");
    $("modal").innerHTML = `${closable ? '<button class="close" data-action="close" aria-label="닫기">×</button>' : ""}<div class="eyebrow">${runtime.state.stage === 3 ? "SUPPLIER SIDE" : "PROCUREMENT QUEST"}</div><h2 id="modal-title">${title}</h2>${body}`;
    $("overlay").hidden = false;
    $("modal").scrollTop = 0;
    $("modal").focus();
  }
  function close() {
    stopSounds();
    $("game-shell").inert = runtime.titleVisible;
    runtime.modalOpen = false;
    $("overlay").hidden = true;
    runtime.modalKind = "";
    if (runtime.lastFocus && runtime.lastFocus.isConnected) runtime.lastFocus.focus();
  }
  function buttons(items) {
    return (
      /* HTML */
      `<div class="actions">
    ${items.map(([a, t, secondary]) => (
        /* HTML */
        `<button class="${secondary ? "secondary" : "primary"}" data-action="${a}">${t}</button>`
      )).join("")}
  </div>`
    );
  }
  function doc(title, rows) {
    return (
      /* HTML */
      `<div class="document">
    <div class="doc-header"><strong>${title}</strong><small>게임용 가상 문서</small></div>
    ${rows.map(([a, b]) => (
        /* HTML */
        `<div class="row"><span>${a}</span><b>${b}</b></div>`
      )).join("")}
  </div>`
    );
  }
  function help() {
    show(
      "조달달의 업무 수첩",
      /* HTML */
      `<p>
        <strong>대화:</strong> 스페이스바 한 번으로 현재 문장을 모두 보고, 다시 누르면 다음 말로
        넘어갑니다. 화면의 Space 버튼도 누를 수 있어요.
      </p>
      <p>
        <strong>퀘스트:</strong> 오른쪽 위 버튼 또는 Q로 김주문의 줄노트를 펼칩니다. 퀘스트를 완료할
        때마다 브라우저에 저장합니다.
      </p>
      <p>
        <strong>사운드:</strong> 소리 버튼에서 음량을 조절하거나 욘 대리의 녹음 목소리를 들어 볼 수
        있어요. 대화 중 소리 버튼을 누르면 음소거를 전환합니다.
      </p>
      <p>
        <strong>이동:</strong> 방향키 또는 WASD, 휴대전화에서는 이동 버튼을 길게 눌러 걸어요. 가까운 대상과 Space 또는 E로 상호작용합니다. 대상
        이름을 클릭·터치하면 자동으로 이동해 대화합니다.
      </p>
      <p>
        <strong>다음 목표로 이동:</strong> 현재 해야 할 일을 바로 찾아갑니다. 다른 층의 목표는 엘리베이터로 안내해요. 용어 수첩에서 배운 말을 다시 읽어 보세요. 잘못 선택해도 설명을
        읽고 다시 시도할 수 있습니다.
      </p>
      <p>
        <strong>인벤토리:</strong> 하단 7칸에 사원증과 완료한 업무의 문서가 쌓입니다. 물건을 눌러
        내용을 다시 볼 수 있어요.
      </p>
      <p>
        <strong>업무용 모니터:</strong> 모니터를 사용할 때만 나라장터 체험 화면이 열립니다. 초안
        저장 후에는 사무실로 돌아와 선배에게 검토를 요청하세요.
      </p>
      <p>
        <strong>공간:</strong> 조달청 본청 5층과 3층 배치를 참고한 가상 지방청입니다. 엘리베이터로 층을 옮겨요.
        기업 단계는 별도 사무실로 전환하며 공간 배치는 체험을 위해 재사용합니다.
      </p>
      <p>
        <strong>저장:</strong> 같은 브라우저·같은 주소에서 진행 상황이 자동 저장됩니다. 시크릿
        모드나 저장 제한 환경에서는 이어하기가 제한됩니다.
      </p>
      <p>
        <strong>업무 범위:</strong> 요청 접수 → 규격 검토 → 공고 → 기업 입찰 참여 → 낙찰자 선정·전자계약 → 검사·검수·대금 지급을 체험해요. 심사 세부 내용과 대기 시간은 줄였어요.
      </p>
      <p>
        원자료:
        <a href="https://www.pps.go.kr/kor/content.do?key=00179" target="_blank" rel="noopener"
          >조달청 총액계약 업무처리절차</a
        >
        (확인 2026-11-21). 금액·품목·납기·기업·규격은 게임용 창작입니다.
      </p>
      ${buttons([["close", "게임으로 돌아가기"]])}`,
      "help"
    );
  }

  // assets/audio/yon-voice-bank.wav
  var yon_voice_bank_default = "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";

  // assets/audio/jodal-voice-bank.wav
  var jodal_voice_bank_default = "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";

  // src/audio/sound.js
  var voiceClips = /* @__PURE__ */ new Map();
  var activeSounds = /* @__PURE__ */ new Set();
  async function loadVoiceBank(role, bytes, offsets, segment = 0.085) {
    if (!["rookie", "supplier"].includes(role) || !runtime.audioCtx)
      throw new Error("Unsupported voice role or unavailable audio context");
    if (!(segment > 0) || !Number.isFinite(segment) || !Array.isArray(offsets) || !offsets.length || offsets.some((n) => !Number.isFinite(n) || n < 0))
      throw new Error("Invalid voice segments");
    const buffer = await runtime.audioCtx.decodeAudioData(bytes);
    if (offsets.some((n) => n + segment > buffer.duration + 1e-6))
      throw new Error("Voice segment exceeds recording duration");
    const clip = { buffer, offsets: [...offsets], segment };
    voiceClips.set(role, clip);
    return clip;
  }
  function loadSupplierVoice() {
    if (runtime.supplierVoiceReady) return;
    runtime.supplierVoiceReady = loadVoiceBank(
      "supplier",
      Uint8Array.from(atob(yon_voice_bank_default), (c) => c.charCodeAt(0)).buffer,
      Array.from({ length: 24 }, (_, i) => i * 0.1)
    ).catch(() => toast("녹음 재생을 지원하지 않아 기본 목소리를 사용합니다."));
  }
  function loadRookieVoice() {
    if (runtime.rookieVoiceReady) return;
    runtime.rookieVoiceReady = loadVoiceBank(
      "rookie",
      Uint8Array.from(atob(jodal_voice_bank_default), (c) => c.charCodeAt(0)).buffer,
      Array.from({ length: 24 }, (_, i) => i * 0.1)
    ).catch(() => toast("조달달 녹음을 재생하지 못해 기본 목소리를 사용합니다."));
  }
  function unlockAudio() {
    if (!runtime.audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      runtime.audioCtx = new AC();
      runtime.master = runtime.audioCtx.createGain();
      runtime.master.gain.value = runtime.muted ? 0 : runtime.volume;
      runtime.master.connect(runtime.audioCtx.destination);
      loadSupplierVoice();
      loadRookieVoice();
    }
    if (runtime.audioCtx.state === "suspended")
      runtime.audioCtx.resume().catch(() => toast("소리 재생을 위해 사운드 버튼을 다시 눌러 주세요."));
    return true;
  }
  function stopSounds() {
    for (const source of activeSounds) {
      try {
        source.stop();
      } catch (e) {
      }
    }
    activeSounds.clear();
  }
  function updateVolume() {
    if (runtime.master)
      runtime.master.gain.setValueAtTime(
        runtime.muted ? 0 : runtime.volume,
        runtime.audioCtx.currentTime
      );
    $("sound-toggle").textContent = runtime.muted ? "♫ 꺼짐" : "♫ 소리";
    const m = $("mute-button");
    if (m) m.textContent = runtime.muted ? "소리 켜기" : "소리 끄기";
  }
  function playSyllable(letter, role = "mentor", delay = 0) {
    if (runtime.muted || !runtime.audioCtx || runtime.audioCtx.state !== "running" || /\s|[.,!?…·]/.test(letter))
      return;
    const clip = voiceClips.get(role), code = letter.codePointAt(0) || 0, rate = (role === "rookie" ? 1.7 : 1.4) + code % 7 * 0.045;
    const source = runtime.audioCtx.createBufferSource(), gain = runtime.audioCtx.createGain();
    let offset = 0, segment = 0.085;
    if (clip) {
      source.buffer = clip.buffer;
      segment = clip.segment;
      offset = clip.offsets[code % clip.offsets.length];
    } else {
      const length = Math.floor(runtime.audioCtx.sampleRate * segment), buffer = runtime.audioCtx.createBuffer(1, length, runtime.audioCtx.sampleRate), data = buffer.getChannelData(0), f0 = 155 + code % 9 * 14;
      for (let i = 0; i < length; i++) {
        const t = i / runtime.audioCtx.sampleRate;
        let value = 0;
        for (let h = 1; h <= 7; h++) {
          const hz = f0 * h, weight = (0.25 + Math.exp(-Math.pow((hz - 750) / 350, 2)) + 0.6 * Math.exp(-Math.pow((hz - 1450) / 500, 2))) / h;
          value += Math.sin(2 * Math.PI * hz * t) * weight;
        }
        data[i] = value * 0.25;
      }
      source.buffer = buffer;
    }
    source.playbackRate.value = rate;
    const when = runtime.audioCtx.currentTime + delay, duration = segment / rate;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.7, when + 8e-3);
    gain.gain.linearRampToValueAtTime(0, when + duration);
    source.connect(gain);
    gain.connect(runtime.master);
    activeSounds.add(source);
    source.onended = () => {
      activeSounds.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start(when, offset, segment);
    source.stop(when + duration + 0.01);
  }
  function chime() {
    if (runtime.muted || !runtime.audioCtx || runtime.audioCtx.state !== "running") return;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const s = runtime.audioCtx.createOscillator(), g = runtime.audioCtx.createGain(), t = runtime.audioCtx.currentTime + i * 0.11;
      s.type = "sine";
      s.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.17, t + 0.015);
      g.gain.exponentialRampToValueAtTime(1e-3, t + 0.25);
      s.connect(g);
      g.connect(runtime.master);
      activeSounds.add(s);
      s.onended = () => {
        activeSounds.delete(s);
        s.disconnect();
        g.disconnect();
      };
      s.start(t);
      s.stop(t + 0.27);
    });
  }
  function soundSettings() {
    if (runtime.talkState) {
      runtime.muted = !runtime.muted;
      stopSounds();
      updateVolume();
      toast(runtime.muted ? "대화 소리를 껐어요." : "대화 소리를 켰어요.");
      return;
    }
    show(
      "사운드",
      /* HTML */
      `<p>
        여성 기업 담당자 욘 대리는 팀원의 실제 녹음을 짧게 잘라 웅얼거리는 목소리로 말합니다.
      </p>
      <div class="sound-row">
        <label for="volume">음량</label
        ><input
          id="volume"
          type="range"
          min="0"
          max="70"
          value="${Math.round(runtime.volume * 100)}"
          aria-label="음량"
        />
      </div>
      <p>조달달은 사용자가 제공한 녹음의 발성 조각을 사용합니다. 김주문과 다른 인물은 기본 합성 목소리를 사용합니다.</p>
      <div class="actions">
        <button class="primary" data-action="rookie-voice-preview">조달달 목소리 듣기</button>
        <button class="primary" data-action="voice-preview">욘 대리 목소리 듣기</button
        ><button class="secondary" data-action="mute" id="mute-button">
          ${runtime.muted ? "소리 켜기" : "소리 끄기"}</button
        ><button class="secondary" data-action="close">닫기</button>
      </div>`,
      "sound"
    );
  }
  async function previewVoice(role = "supplier") {
    if (!unlockAudio()) return;
    await (role === "rookie" ? runtime.rookieVoiceReady : runtime.supplierVoiceReady);
    stopSounds();
    if (runtime.muted) {
      toast("소리를 켠 뒤 들어 주세요.");
      return;
    }
    Array.from(role === "rookie" ? "이제나도조달의왕이야" : "안녕하세요입찰에참여할게요").forEach(
      (letter, i) => playSyllable(letter, role, i * 0.095)
    );
  }

  // src/game/input.js
  function handleKey(e) {
    if (runtime.talkState) {
      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) {
          unlockAudio();
          nextLine();
        }
      }
      return;
    }
    if (runtime.modalOpen) {
      if (e.key === "Escape" && !["advance", "feedback"].includes(runtime.modalKind)) close();
      if (e.key === "Tab") {
        const list = [...$("modal").querySelectorAll("button,a,input,select")].filter(
          (el) => !el.disabled
        ), first = list[0], end = list.at(-1);
        if (e.shiftKey && (document.activeElement === first || document.activeElement === $("modal"))) {
          e.preventDefault();
          end?.focus();
        } else if (!e.shiftKey && (document.activeElement === end || document.activeElement === $("modal"))) {
          e.preventDefault();
          first?.focus();
        }
      }
      return;
    }
    if (runtime.titleVisible) return;
    const k = e.key.toLowerCase();
    if (k === "q") {
      e.preventDefault();
      if (!e.repeat) setNotebook($("quest-panel").hidden);
      return;
    }
    if (e.code === "Space" && ["BUTTON", "INPUT", "SELECT"].includes(e.target.tagName)) return;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "e"].includes(k) || e.code === "Space") {
      e.preventDefault();
      if (k === "e" || e.code === "Space") {
        if (!e.repeat) {
          unlockAudio();
          interact();
        }
      } else {
        keys.add(k);
        runtime.target = null;
        canvas.focus({ preventScroll: true });
      }
    }
  }
  function bindInput() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-action]");
      if (b) {
        const a = b.dataset.action;
        if (runtime.talkState && !["talk-next", "sound"].includes(a)) return;
        unlockAudio();
        if (a.startsWith("go-")) go(a.slice(3));
        else if (actions[a]) actions[a]();
      }
      const m = e.target.closest("[data-move]");
      if (m && e.detail === 0 && !runtime.modalOpen && !runtime.talkState && !runtime.titleVisible) {
        runtime.target = null;
        const d = { left: [-18, 18], right: [18, -18], up: [-18, -18], down: [18, 18] }[m.dataset.move];
        stepPlayer(d[0], d[1]);
      }
    });
    const releaseTouch = () => {
      if (runtime.touchKey) keys.delete(runtime.touchKey);
      runtime.touchKey = null;
    };
    document.addEventListener("pointerdown", (e) => {
      const control = e.target.closest("[data-move]");
      if (!control || runtime.modalOpen || runtime.talkState || runtime.titleVisible) return;
      e.preventDefault();
      releaseTouch();
      runtime.target = null;
      runtime.touchKey = { left: "arrowleft", right: "arrowright", up: "arrowup", down: "arrowdown" }[control.dataset.move];
      keys.add(runtime.touchKey);
      control.setPointerCapture?.(e.pointerId);
    });
    document.addEventListener("pointerup", releaseTouch);
    document.addEventListener("pointercancel", releaseTouch);
    document.addEventListener("lostpointercapture", releaseTouch);
    document.addEventListener("change", (e) => {
      if (e.target.id === "eligible") {
        runtime.state.eligibility = e.target.checked;
        save();
        render();
      }
    });
    document.addEventListener("input", (e) => {
      if (e.target.id === "volume") {
        runtime.volume = Number(e.target.value) / 100;
        updateVolume();
      }
    });
    document.addEventListener("keydown", handleKey);
    document.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
    window.addEventListener("blur", () => {
      keys.clear();
      releaseTouch();
      revealLine();
      stopSounds();
    });
    window.addEventListener("resize", resizeWorld);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        keys.clear();
        releaseTouch();
        revealLine();
        stopSounds();
      }
    });
  }

  // src/main.js
  loadGame();
  bindInput();
  resizeWorld();
  render();
  intro();
  requestAnimationFrame(frame);
})();
