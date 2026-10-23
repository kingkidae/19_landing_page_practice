// ===== FAQ (faq.html) =====
// 분류 탭과 검색으로 질문을 걸러 보여줍니다.

function setupFaq() {
  const groups = $$(".faq-group");
  if (!groups.length) return;

  const state = { category: "all", query: "" };
  const tabs = $$(".faq-tab");

  const render = () => {
    const q = state.query.trim().toLowerCase();
    let visible = 0;

    groups.forEach((group) => {
      const inCategory =
        state.category === "all" || group.dataset.group === state.category;
      let shown = 0;
      group.querySelectorAll("details").forEach((item) => {
        const match =
          inCategory && (!q || item.textContent.toLowerCase().includes(q));
        item.hidden = !match;
        // 검색 중에는 찾은 답변을 펼쳐서 보여줌
        if (q) item.open = match;
        if (match) shown++;
      });
      group.hidden = shown === 0;
      visible += shown;
    });

    tabs.forEach((tab) =>
      tab.setAttribute(
        "aria-pressed",
        String(tab.dataset.category === state.category),
      ),
    );
    $("#faqEmpty").hidden = visible > 0;
  };

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      state.category = tab.dataset.category;
      render();
    }),
  );
  $("#faqSearch").addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
  });

  render();
}

document.addEventListener("DOMContentLoaded", setupFaq);
