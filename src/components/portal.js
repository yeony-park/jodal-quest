import { beginRecovery } from "../game/recovery.js";
import { runtime } from "../core/runtime.js";
import { face } from "../world/characters.js";
import { show, toast } from "./modal.js";
import { $ } from "../core/dom.js";
import { save } from "../core/storage.js";
import { render } from "./hud.js";

export function portalShell(content, page) {
  const supplier = runtime.state.stage === 3;
  return /* HTML */ `<div class="monitor-chrome">
      <span>▣ 업무용 모니터</span><span>나라장터</span
      ><button data-action="close" aria-label="모니터 닫고 사무실로">×</button>
    </div>
    <div class="g2b-top">
      <span>나라장터　 종합쇼핑몰　 조달데이터허브　 누리장터</span
      ><button data-action="portal-login">
        ${runtime.portalSignedIn ? (supplier ? "욘 대리" : "조달달 주무관") : "로그인"}</button
      ><button data-action="portal-guide">인증센터</button>
    </div>
    <div class="g2b-brand">
      <div class="g2b-logo">
        <i></i>
        <div>나라장터<small>국가종합전자조달</small></div>
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
    <nav class="g2b-nav" aria-label="나라장터 메뉴">
      <button data-action="portal-work">발주</button><button data-action="portal-list">입찰</button
      ><button data-action="portal-guide">공통</button
      ><button data-action="portal-guide">이용자관리</button
      ><button data-action="portal-home">홈</button>
    </nav>
    <div class="g2b-content">${content}</div>
    <footer class="g2b-footer">
      ${supplier ? "새봄테크 · 기업 입찰 참여" : "새봄지방조달청 · 공고 초안 준비"}
    </footer>`;
}

export function openPortal(page = "home", query = "모니터") {
  let content = "";
  if (page === "home")
    content = /* HTML */ `<div class="g2b-hero">
        나라장터에서 전하는 다양한<br /><strong>입찰정보</strong>와 <em>소식</em>을 만나보세요
      </div>
      <div class="g2b-grid">
        <section class="g2b-card starter">
          <h3>나라장터 시작하기</h3>
          <p>오늘의 한 건을 차근차근 준비해 보세요.</p>
          <button class="g2b-primary" data-action="portal-login">
            ${runtime.portalSignedIn ? "나의 업무" : "로그인"}
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
            ><button data-action="portal-guide">이용 안내</button>
          </div>
        </section>
      </div>`;
  else if (page === "login")
    content = /* HTML */ `<div class="g2b-breadcrumb">홈 / 로그인</div>
      <h3>업무 계정으로 시작</h3>
      <div class="g2b-login-card">
        <div class="large-avatar">${face(runtime.state.stage === 3 ? "supplier" : "rookie")}</div>
        <h4>
          ${runtime.state.stage === 3 ? "욘 대리 · 새봄테크" : "조달달 주무관 · 새봄지방조달청"}
        </h4>
        <p>
          미리 준비된 업무 계정으로 진행합니다.
        </p>
        <button class="g2b-primary" data-action="portal-signin">업무 계정으로 로그인</button>
      </div>`;
  else if (page === "draft")
    content = /* HTML */ `<div class="g2b-breadcrumb">홈 / 발주 / 공고 초안</div>
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
          />
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
    const matches =
      ["", "모니터", "새봄", "도서관", "새봄도서관 모니터 구매"].some(
        (term) => query.trim() === term,
      ) || "새봄도서관 모니터 구매".includes(query.trim());
    const exists = runtime.state.stage >= 3 && matches;
    content = /* HTML */ `<div class="g2b-breadcrumb">홈 / 입찰 / 입찰공고목록</div>
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
    content = /* HTML */ `<div class="g2b-breadcrumb">홈 / 입찰 / 공고 상세</div>
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
    content = /* HTML */ `<div class="g2b-breadcrumb">홈 / 입찰 / 입찰서 작성</div>
      <h3>입찰서 작성</h3>
      <div class="g2b-form">
        <div><label>업체 / 담당자</label><span>새봄테크 / 욘 대리</span></div>
        <div>
          <label>구매 물품</label
          ><span>모니터 20대 / ${runtime.state.product ? "새봄 M24" : "적합 제품 미선택"}</span>
        </div>
        <div><label>입찰총액</label><span>18,400,000원 (부가세 포함)</span></div>
      </div>
      <label class="checkline"
        ><input id="eligible" type="checkbox" ${runtime.state.eligibility ? "checked" : ""} />공고의
        참가자격과 제출서류를 확인했습니다. 새봄테크는 등록·참가 요건을 갖췄습니다.</label
      >
      <p class="g2b-caution">
        접수는 낙찰·계약 체결을 뜻하지 않습니다.
      </p>
      <div class="g2b-actions">
        <button class="g2b-primary" data-action="submit-bid">입찰서 제출</button
        ><button data-action="portal-detail">공고 다시 보기</button>
      </div>`;
  else
    content = /* HTML */ `<h3>나라장터 이용 안내</h3>
      <p>
        공무원은 공고 초안을 준비하고 선배에게 검토를 요청합니다. 기업
        담당자는 게시된 공고를 검색하고 입찰서를 제출합니다.
      </p>
      <button class="g2b-primary" data-action="portal-home">나라장터 첫 화면</button>`;
  show("나라장터", portalShell(content, page), "portal");
  if (page === "list") $("portal-query-label").textContent = query || "전체";
}

export function terminal() {
  openPortal("home");
}

export function portalWork() {
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

export function portalDetail() {
  if (runtime.state.stage < 3) {
    toast("공고 게시 전입니다.");
    return;
  }
  openPortal("detail");
}

export function portalBid() {
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

export function savePortalDraft() {
  if (runtime.state.stage !== 2) return;
  if (Number($("portal-quantity").value) !== 20) {
    beginRecovery("notice");
    return;
  }
  runtime.state.noticeChecked = true;
  save();
  render();
  openPortal("draft");
  toast("검토본 저장 완료. 모니터를 닫고 김주문에게 검토를 요청하세요.");
}
