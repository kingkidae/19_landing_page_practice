// ===== 공통 (모든 페이지) =====
// 헤더 · 모바일 메뉴 · 등장 애니메이션 · 약관 팝업 · 맨 위로 버튼
// 페이지별 기능은 order.js(맞춤 사료), news.js(애견 정보), faq.js(FAQ)에 있습니다.

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// 이용약관 · 개인정보처리방침 팝업
function setupDialogs() {
  $$("[data-dialog]").forEach((button) =>
    button.addEventListener("click", () => {
      const dialog = document.getElementById(button.dataset.dialog);
      dialog.showModal();
      dialog.querySelector(".legal-body").scrollTop = 0;
    }),
  );
  // 바깥(배경) 클릭 시 닫기
  $$(".legal-dialog").forEach((dialog) =>
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    }),
  );
}

// 맨 위로 버튼: 한 화면 이상 내려가면 표시
function setupBackToTop() {
  const button = $("#backToTop");
  const toggle = () =>
    button.classList.toggle(
      "is-visible",
      window.scrollY > window.innerHeight * 0.8,
    );
  window.addEventListener("scroll", toggle, { passive: true });
  button.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
  toggle();
}

// 목차 링크 · 단계 이동처럼 특정 위치로 이동하는 동안에는 헤더를 숨기지 않음
// (숨기면 헤더 높이만큼 남겨둔 여백(scroll-padding)이 비어 화면이 잘려 보임)
let headerHoldUntil = 0;
function holdHeader(ms = 1500) {
  headerHoldUntil = Date.now() + ms;
  $(".site-header")?.classList.remove("is-hidden");
}

// 스크롤을 내리면 헤더 숨김, 올리면 다시 표시
function setupHeaderAutoHide() {
  const header = $(".site-header");
  let lastY = window.scrollY;

  // 같은 페이지 안의 #링크, 주소의 #해시, 새로고침 후 스크롤 위치 복원
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (link && link.pathname === location.pathname) holdHeader();
  });
  window.addEventListener("hashchange", () => holdHeader());
  window.addEventListener("load", () => holdHeader(1000));
  holdHeader(1000);

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 6) return; // 미세한 흔들림 무시
      if (Date.now() < headerHoldUntil) {
        lastY = y;
        return;
      }
      header.classList.toggle(
        "is-hidden",
        y > lastY &&
          y > header.offsetHeight &&
          !header.classList.contains("is-open"), // 모바일 메뉴가 열려 있으면 유지
      );
      lastY = y;
    },
    { passive: true },
  );
}

function setupReveal() {
  const targets = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  targets.forEach((el) => observer.observe(el));
}

// 모바일 메뉴 열기 / 닫기
function setupNavToggle() {
  const header = $(".site-header");
  const button = $(".nav-toggle");
  if (!button) return;
  const setOpen = (open) => {
    header.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  };
  button.addEventListener("click", () =>
    setOpen(!header.classList.contains("is-open")),
  );
  // 메뉴 링크를 누르거나 Esc를 누르면 닫기
  $$(".site-nav a").forEach((link) =>
    link.addEventListener("click", () => setOpen(false)),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
  window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => {
    if (e.matches) setOpen(false);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupHeaderAutoHide();
  setupNavToggle();
  setupReveal();
  setupDialogs();
  setupBackToTop();
});
