// ===== 고객 후기 (reviews.html) =====
// 예시 후기는 reviews-data.js에서 만들고, 직접 작성한 후기는 현재 브라우저(localStorage)에만 저장됩니다.

const REVIEW_STORAGE_KEY = "omakagae_reviews";
const HELPFUL_STORAGE_KEY = "omakagae_review_helpful";
const REVIEWS_PER_PAGE = 10;

// localStorage를 쓸 수 없는 환경(사생활 보호 모드 등)에서도 페이지가 동작하도록 감쌈
function readStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const escapeHtml = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );

// 닉네임은 첫 글자만 보이고 나머지는 가림 (예: k*******)
const maskNick = (name) => `${[...name.trim()][0] || "*"}*******`;

const allReviews = () => [
  ...readStore(REVIEW_STORAGE_KEY, []),
  ...SAMPLE_REVIEWS,
];

const starHtml = (rating, label = true) =>
  `<span class="stars" style="--rating: ${rating}"${
    label
      ? ` role="img" aria-label="별점 5점 만점에 ${rating}점"`
      : ' aria-hidden="true"'
  }>★★★★★</span>`;

// ===== 요약 (평균 별점 · 분포) =====
function renderReviewSummary(reviews, activeRating) {
  const total = reviews.length;
  const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;

  $("#reviewAvg").textContent = avg.toFixed(1);
  $("#reviewAvgStars").innerHTML = starHtml(Number(avg.toFixed(1)));
  $("#reviewTotal").textContent = `${total.toLocaleString("ko-KR")}개의 후기`;

  $("#reviewBars").innerHTML = [5, 4, 3, 2, 1]
    .map((star) => {
      const count = reviews.filter((r) => r.rating === star).length;
      const percent = total ? Math.round((count / total) * 100) : 0;
      return `
        <button type="button" class="review-bar" data-rating="${star}" aria-pressed="${activeRating === star}">
          <span class="review-bar-label">${star}점</span>
          <span class="review-bar-track"><span style="width: ${percent}%"></span></span>
          <span class="review-bar-count">${count.toLocaleString("ko-KR")}</span>
        </button>`;
    })
    .join("");
}

// ===== 카드 =====
function reviewCard(r, helpfulIds) {
  const option = [
    REVIEW_SIZES[r.size],
    REVIEW_FOODS[r.food],
    r.toppings?.length ? `토핑 ${r.toppings.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const dog = [
    r.breed && escapeHtml(r.breed),
    r.age ? `${r.age}살` : null,
    r.health ? REVIEW_HEALTH[r.health] : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const voted = helpfulIds.includes(r.id);
  const tag = r.sample
    ? '<span class="review-tag">예시 후기</span>'
    : '<span class="review-tag is-mine">내가 쓴 후기</span>';

  return `
    <article class="review-card">
      <header class="review-head">
        <span class="review-avatar" aria-hidden="true">${escapeHtml([...r.nick][0])}</span>
        <div class="review-who">
          <strong>${escapeHtml(r.nick)}</strong>
          <time datetime="${r.date}">${r.date.split("-").join(".")}</time>
        </div>
        ${starHtml(r.rating)}
      </header>
      <p class="review-option">${option}</p>
      ${dog ? `<p class="review-dog">${dog}</p>` : ""}
      <p class="review-text">${escapeHtml(r.text)}</p>
      ${
        r.reply
          ? `<div class="review-reply"><strong>오마카개 답변</strong><p>${r.reply}</p></div>`
          : ""
      }
      <footer class="review-foot">
        ${tag}
        <button type="button" class="helpful-btn" data-helpful="${r.id}" aria-pressed="${voted}">
          도움돼요 <span>${r.helpful + (voted ? 1 : 0)}</span>
        </button>
      </footer>
    </article>`;
}

// 1 … 4 5 6 … 52 처럼 현재 페이지 주변만 보여줌
function pageList(current, last) {
  const pages = new Set([1, last, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  return sorted.flatMap((p, i) =>
    i && p - sorted[i - 1] > 1 ? ["gap", p] : [p],
  );
}

function renderPagination(current, last) {
  const nav = $("#reviewPages");
  nav.hidden = last <= 1;
  if (last <= 1) return;
  nav.innerHTML = `
    <button type="button" data-page="${current - 1}" ${current === 1 ? "disabled" : ""} aria-label="이전 페이지">‹</button>
    ${pageList(current, last)
      .map((p) =>
        p === "gap"
          ? '<span class="page-gap">…</span>'
          : `<button type="button" data-page="${p}" ${p === current ? 'aria-current="page"' : ""}>${p}</button>`,
      )
      .join("")}
    <button type="button" data-page="${current + 1}" ${current === last ? "disabled" : ""} aria-label="다음 페이지">›</button>`;
}

function setupReviews() {
  if (!$("#reviewList")) return;

  const state = { size: "all", food: "all", rating: null, sort: "recent", page: 1 };

  const sorters = {
    recent: (a, b) => b.date.localeCompare(a.date),
    high: (a, b) => b.rating - a.rating || b.date.localeCompare(a.date),
    low: (a, b) => a.rating - b.rating || b.date.localeCompare(a.date),
    helpful: (a, b) => b.helpful - a.helpful,
  };

  const render = () => {
    const reviews = allReviews();
    const helpfulIds = readStore(HELPFUL_STORAGE_KEY, []);
    renderReviewSummary(reviews, state.rating);

    const filtered = reviews
      .filter(
        (r) =>
          (state.size === "all" || r.size === state.size) &&
          (state.food === "all" || r.food === state.food) &&
          (!state.rating || r.rating === state.rating),
      )
      .sort(sorters[state.sort]);

    const last = Math.max(1, Math.ceil(filtered.length / REVIEWS_PER_PAGE));
    state.page = Math.min(state.page, last);
    const from = (state.page - 1) * REVIEWS_PER_PAGE;

    $("#reviewList").innerHTML = filtered
      .slice(from, from + REVIEWS_PER_PAGE)
      .map((r) => reviewCard(r, helpfulIds))
      .join("");
    $("#reviewCount").textContent = state.rating
      ? `${state.rating}점 후기 ${filtered.length.toLocaleString("ko-KR")}개`
      : `${filtered.length.toLocaleString("ko-KR")}개의 후기`;
    $("#reviewEmpty").hidden = filtered.length > 0;
    $("#clearRating").hidden = !state.rating;
    $$("#reviewSizes .filter-chip").forEach((chip) =>
      chip.setAttribute("aria-pressed", String(chip.dataset.size === state.size)),
    );
    renderPagination(state.page, last);
  };

  const update = (patch) => {
    Object.assign(state, { page: 1 }, patch);
    render();
  };

  $("#reviewSizes").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-size]");
    if (chip) update({ size: chip.dataset.size });
  });
  $("#reviewFood").addEventListener("change", (e) => update({ food: e.target.value }));
  $("#reviewSort").addEventListener("change", (e) => update({ sort: e.target.value }));
  $("#reviewBars").addEventListener("click", (e) => {
    const bar = e.target.closest("[data-rating]");
    if (!bar) return;
    const rating = Number(bar.dataset.rating);
    update({ rating: state.rating === rating ? null : rating });
    $("#reviewListTop").scrollIntoView({ behavior: "smooth" });
  });
  $("#clearRating").addEventListener("click", () => update({ rating: null }));

  $("#reviewPages").addEventListener("click", (e) => {
    const button = e.target.closest("[data-page]");
    if (!button || button.disabled) return;
    state.page = Number(button.dataset.page);
    render();
    $("#reviewListTop").scrollIntoView({ behavior: "smooth" });
  });

  // 도움돼요: 한 번 더 누르면 취소
  $("#reviewList").addEventListener("click", (e) => {
    const button = e.target.closest("[data-helpful]");
    if (!button) return;
    const ids = new Set(readStore(HELPFUL_STORAGE_KEY, []));
    const id = button.dataset.helpful;
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    writeStore(HELPFUL_STORAGE_KEY, [...ids]);
    render();
  });

  $("#reviewForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    form.classList.add("was-validated");
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    const today = new Date();
    const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    const review = {
      id: `my-${Date.now()}`,
      nick: maskNick(data.nick),
      rating: Number(data.rating),
      date: local.toISOString().slice(0, 10),
      size: data.size,
      food: data.food,
      toppings: [],
      breed: data.breed.trim(),
      age: data.age ? Number(data.age) : null,
      health: null,
      text: data.text.trim(),
      helpful: 0,
      reply: null,
      sample: false,
    };

    const message = $("#reviewMessage");
    const saved = writeStore(REVIEW_STORAGE_KEY, [
      review,
      ...readStore(REVIEW_STORAGE_KEY, []),
    ]);
    if (!saved) {
      message.textContent = "이 브라우저에서는 후기를 저장할 수 없어요. 잠시 후 다시 시도해주세요.";
      message.className = "form-message error";
      return;
    }
    message.textContent = `${review.nick}님, 소중한 후기 고마워요! (테스트 모드: 이 브라우저에만 저장됨)`;
    message.className = "form-message success";
    form.reset();
    form.classList.remove("was-validated");
    update({ size: "all", food: "all", rating: null, sort: "recent" });
    $("#reviewFood").value = "all";
    $("#reviewSort").value = "recent";
  });

  $("#sampleNotice").hidden = !SHOW_SAMPLE_REVIEWS;
  render();
}

document.addEventListener("DOMContentLoaded", setupReviews);
