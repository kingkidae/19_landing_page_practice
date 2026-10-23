// ===== 매장 · 문의 (contact.html) =====
// 문의를 받을 주소 (예: Formspree의 https://formspree.io/f/xxxxxx)
// 비워두면 테스트 모드로 동작하며, 문의 내용은 현재 브라우저(localStorage)에만 저장됩니다.
const CONTACT_ENDPOINT = "";
const CONTACT_STORAGE_KEY = "omakagae_inquiries";

function setupContactForm() {
  const form = $("#contactForm");
  if (!form) return;
  const message = $("#contactMessage");
  const show = (text, type) => {
    message.textContent = text;
    message.className = `form-message ${type}`;
  };

  // order.js의 formatPhone과 같은 규칙: 숫자만 남기고 010-0000-0000 형태로
  $("#contactPhone").addEventListener("input", (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    e.target.value =
      digits.length < 4
        ? digits
        : digits.length < 8
          ? `${digits.slice(0, 3)}-${digits.slice(3)}`
          : `${digits.slice(0, 3)}-${digits.slice(3, -4)}-${digits.slice(-4)}`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    form.classList.add("was-validated");
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    data.submittedAt = new Date().toISOString();
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;

    try {
      if (CONTACT_ENDPOINT) {
        const res = await fetch(CONTACT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        show(`${data.name}님, 문의가 접수되었어요. 운영 시간 안에 연락드릴게요.`, "success");
      } else {
        const saved = JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) || "[]");
        saved.push(data);
        localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(saved));
        show(`${data.name}님, 문의가 접수되었어요. (테스트 모드: 이 브라우저에만 저장됨)`, "success");
      }
      form.reset();
      form.classList.remove("was-validated");
    } catch (err) {
      console.error(err);
      show("전송 중 문제가 생겼어요. 전화(010-4526-6868)로 문의해주세요.", "error");
    } finally {
      button.disabled = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", setupContactForm);
