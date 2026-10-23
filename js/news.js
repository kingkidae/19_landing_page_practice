// ===== 애견 정보 목록 (news.html) =====
// 글 데이터는 news-data.js에 있습니다.
// 글 상세 페이지(news/글id.html)와 처음 보이는 목록은 tools/update_seo.py가 HTML로 미리 만들어 두고,
// 이 파일은 분류 · 검색으로 목록을 다시 그리는 역할만 합니다.

const sortedArticles = () =>
  [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));

const categoryLabel = (key) => NEWS_CATEGORIES[key] || key;
const articleUrl = (a) => `./news/${encodeURIComponent(a.id)}.html`;
// "2026-10-16" → "2026.10.16", "2026-08" → "2026.08"
const formatDate = (date) => date.split("-").join(".");

// tools/update_seo.py의 article_card()와 같은 마크업
function articleCard(a, { featured = false } = {}) {
  return `
    <article class="news-card${featured ? " is-featured" : ""}">
      <a href="${articleUrl(a)}" class="news-card-link">
        <figure class="news-thumb">
          <img src="${a.image}" alt="${a.imageAlt}" loading="lazy" />
        </figure>
        <div class="news-card-body">
          <p class="news-meta">
            <span class="news-cat">${categoryLabel(a.category)}</span>
            <time datetime="${a.date}">${formatDate(a.date)}</time>
          </p>
          <h3>${a.title}</h3>
          <p class="news-dek">${a.dek}</p>
          <p class="news-source">${a.source.name} · ${a.readMin}분 읽기</p>
        </div>
      </a>
    </article>`;
}

function setupNewsList() {
  const list = $("#newsList");
  if (!list) return;

  const state = { category: "all", query: "" };
  const filters = $("#newsFilters");
  const count = (key) =>
    key === "all"
      ? ARTICLES.length
      : ARTICLES.filter((a) => a.category === key).length;

  filters.innerHTML = [["all", "전체"], ...Object.entries(NEWS_CATEGORIES)]
    .map(
      ([key, label]) =>
        `<button type="button" class="filter-chip" data-category="${key}" aria-pressed="false">${label}<span>${count(key)}</span></button>`,
    )
    .join("");

  const render = () => {
    const q = state.query.trim().toLowerCase();
    const items = sortedArticles().filter(
      (a) =>
        (state.category === "all" || a.category === state.category) &&
        (!q ||
          `${a.title} ${a.dek} ${a.source.name}`.toLowerCase().includes(q)),
    );
    // 필터 없이 볼 때만 가장 최근 글을 크게 보여줌
    const showFeatured = state.category === "all" && !q;
    list.innerHTML = items
      .map((a, i) => articleCard(a, { featured: showFeatured && i === 0 }))
      .join("");

    filters
      .querySelectorAll(".filter-chip")
      .forEach((chip) =>
        chip.setAttribute(
          "aria-pressed",
          String(chip.dataset.category === state.category),
        ),
      );
    $("#newsCount").textContent = `${items.length}개의 글`;
    $("#newsEmpty").hidden = items.length > 0;
  };

  filters.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-category]");
    if (!chip) return;
    state.category = chip.dataset.category;
    render();
  });
  $("#newsSearch").addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
  });

  // news.html?category=nutrition 처럼 들어오면 해당 분류부터 보여줌
  const initial = new URLSearchParams(location.search).get("category");
  if (NEWS_CATEGORIES[initial]) state.category = initial;
  render();
}

document.addEventListener("DOMContentLoaded", setupNewsList);
