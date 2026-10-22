// ===== 설정 =====
// 신청서를 받을 주소 (예: Formspree의 https://formspree.io/f/xxxxxx)
// 비워두면 테스트 모드로 동작하며, 신청 내용은 현재 브라우저(localStorage)에만 저장됩니다.
const FORM_ENDPOINT = "";
const STORAGE_KEY = "omakagae_requests";

const DAYS = 30;
const MAX_TOPPINGS = 3;
const TOPPING_RATIO = 0.1; // 토핑 1개 = 하루 사료 급여량의 10%
const TREAT_KCAL_LIMIT = 0.1; // 간식은 하루 열량의 10% 이내 권장

// 기본 사료 100g당 영양성분
const BASE_FOOD = { kcal: 350, protein: 26, fat: 14, carbs: 40, fiber: 3 };

// weight: 평균 체중(kg), price: 월 사료 요금(원)
const SIZES = {
  small: { label: "소형견", weight: 5, price: 49000, treat: "S" },
  medium: { label: "중형견", weight: 15, price: 109000, treat: "M" },
  large: { label: "대형견", weight: 30, price: 179000, treat: "L" },
};

// 100g당 영양성분 (익힌 상태 기준), pricePerKg: 토핑 원가 기준 kg당 요금
const TOPPINGS = [
  { id: "chicken", name: "닭가슴살", note: "저지방 고단백", kcal: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0, pricePerKg: 18000 },
  { id: "salmon", name: "연어", note: "오메가-3 풍부", kcal: 206, protein: 22, fat: 12, carbs: 0, fiber: 0, pricePerKg: 32000 },
  { id: "beef", name: "소고기 안심", note: "철분 · 아연", kcal: 190, protein: 28, fat: 8, carbs: 0, fiber: 0, pricePerKg: 30000 },
  { id: "egg", name: "삶은 달걀", note: "완전 단백질", kcal: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0, pricePerKg: 12000 },
  { id: "sweetpotato", name: "고구마", note: "식이섬유 · 에너지", kcal: 90, protein: 2, fat: 0.2, carbs: 21, fiber: 3.3, pricePerKg: 9000 },
  { id: "pumpkin", name: "단호박", note: "장 건강 · 베타카로틴", kcal: 40, protein: 1, fat: 0.1, carbs: 10, fiber: 2, pricePerKg: 9000 },
  { id: "broccoli", name: "브로콜리", note: "비타민 C · K", kcal: 35, protein: 2.4, fat: 0.4, carbs: 7, fiber: 3.3, pricePerKg: 12000 },
  { id: "blueberry", name: "블루베리", note: "항산화 안토시아닌", kcal: 57, protein: 0.7, fat: 0.3, carbs: 14, fiber: 2.4, pricePerKg: 28000 },
  { id: "carrot", name: "당근", note: "눈 건강 · 베타카로틴", kcal: 35, protein: 0.8, fat: 0.2, carbs: 8, fiber: 3, pricePerKg: 8000 },
];

const TREATS = {
  S: { label: "소 · 한입 큐브", grams: 3, kcal: 10, price: 90 },
  M: { label: "중 · 수제 스틱", grams: 7, kcal: 23, price: 160 },
  L: { label: "대 · 통살 저키", grams: 15, kcal: 50, price: 300 },
};
const TREAT_MAX_COUNT = 10;

const NUTRIENTS = [
  { key: "kcal", label: "열량", unit: "kcal", digits: 0 },
  { key: "protein", label: "단백질", unit: "g", digits: 1 },
  { key: "fat", label: "지방", unit: "g", digits: 1 },
  { key: "carbs", label: "탄수화물", unit: "g", digits: 1 },
  { key: "fiber", label: "식이섬유", unit: "g", digits: 1 },
];

const state = {
  size: "small",
  toppings: new Set(),
  treatSize: "S",
  treatCount: 2,
  treatTouched: false, // 사용자가 간식 크기를 직접 고르면 사이즈 변경 시 자동으로 바꾸지 않음
};

// ===== 계산 =====
// 하루 권장 열량 = RER(70 × 체중^0.75) × 1.6 (중성화 성견)
const dailyKcal = (size) => Math.round(70 * SIZES[size].weight ** 0.75 * 1.6);
const dailyGrams = (size) => Math.round(dailyKcal(size) / (BASE_FOOD.kcal / 100));
const monthlyKg = (size) => (dailyGrams(size) * DAYS) / 1000;
const toppingGrams = (size) => Math.round(dailyGrams(size) * TOPPING_RATIO);

function nutrientsFor(per100, grams) {
  const ratio = grams / 100;
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [key, per100[key] * ratio]));
}

function toppingMonthlyPrice(topping, size) {
  const kg = (toppingGrams(size) * DAYS) / 1000;
  return Math.round((kg * topping.pricePerKg) / 100) * 100;
}

function selectedToppings() {
  return TOPPINGS.filter((t) => state.toppings.has(t.id));
}

function calcPlan() {
  const size = state.size;
  // 반올림 전 급여량으로 계산해 사이즈 카드의 권장 열량과 숫자를 맞춤
  const base = nutrientsFor(BASE_FOOD, dailyKcal(size) / (BASE_FOOD.kcal / 100));
  const added = Object.fromEntries(NUTRIENTS.map(({ key }) => [key, 0]));
  selectedToppings().forEach((t) => {
    const n = nutrientsFor(t, toppingGrams(size));
    NUTRIENTS.forEach(({ key }) => (added[key] += n[key]));
  });

  const treat = TREATS[state.treatSize];
  const treatKcal = treat.kcal * state.treatCount;
  const treatPrice = treat.price * state.treatCount * DAYS;
  const toppingPrice = selectedToppings().reduce((sum, t) => sum + toppingMonthlyPrice(t, size), 0);

  return {
    base,
    added,
    need: dailyKcal(size),
    treat,
    treatKcal,
    treatPrice,
    toppingPrice,
    total: SIZES[size].price + toppingPrice + treatPrice,
  };
}

// ===== 포맷 =====
const won = (n) => `${n.toLocaleString("ko-KR")}원`;
const num = (n, digits = 1) => Number(n.toFixed(digits)).toLocaleString("ko-KR");

// ===== 렌더링 =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function renderSizeCards() {
  $$(".size-card").forEach((card) => {
    const size = card.dataset.size;
    card.querySelector('[data-field="kcal"]').textContent = `${num(dailyKcal(size), 0)} kcal`;
    card.querySelector('[data-field="grams"]').textContent = `${dailyGrams(size)} g`;
    card.querySelector('[data-field="monthly"]').textContent = `${num(monthlyKg(size))} kg`;
    card.querySelector('[data-field="price"]').innerHTML = `${won(SIZES[size].price)} <small>/ 월</small>`;
  });
}

function buildToppingList() {
  $("#toppingList").innerHTML = TOPPINGS.map(
    (t) => `
      <label class="topping">
        <input type="checkbox" value="${t.id}" />
        <strong>${t.name}</strong>
        <span class="note">${t.note}</span>
        <span class="add" data-topping-add="${t.id}"></span>
      </label>`
  ).join("");
}

function renderToppings() {
  const grams = toppingGrams(state.size);
  const full = state.toppings.size >= MAX_TOPPINGS;

  TOPPINGS.forEach((t) => {
    const kcal = (t.kcal * grams) / 100;
    $(`[data-topping-add="${t.id}"]`).textContent =
      `+${grams}g · +${num(kcal, 0)}kcal · 월 ${won(toppingMonthlyPrice(t, state.size))}`;
  });

  $$("#toppingList input").forEach((input) => {
    input.checked = state.toppings.has(input.value);
    input.disabled = full && !input.checked;
  });
  $("#toppingCount").textContent = state.toppings.size;
}

function renderNutrition(plan) {
  $("#nutriSizeLabel").textContent = SIZES[state.size].label;
  $("#nutriBody").innerHTML = NUTRIENTS.map(({ key, label, unit, digits }) => {
    const base = plan.base[key];
    const added = plan.added[key];
    return `
      <tr>
        <th scope="row">${label}</th>
        <td>${num(base, digits)}${unit}</td>
        <td class="plus">${added > 0 ? "+" + num(added, digits) + unit : "–"}</td>
        <td class="total">${num(base + added, digits)}${unit}</td>
      </tr>`;
  }).join("");

  const foodKcal = plan.base.kcal + plan.added.kcal;
  const percent = Math.round((foodKcal / plan.need) * 100);
  $("#meterPercent").textContent = `${percent}%`;
  $("#meterFill").style.width = `${Math.min(percent, 100)}%`;
  $("#meterFill").classList.toggle("over", percent > 115);

  const extra = Math.round(plan.added.kcal);
  $("#meterNote").textContent =
    extra === 0
      ? "기본 사료만으로 하루 권장 열량을 채워요."
      : percent > 115
        ? `토핑으로 하루 ${extra}kcal가 늘어나요. 체중 관리가 필요하다면 신청서 요청사항에 ‘사료량 조절’을 남겨주세요.`
        : `토핑으로 하루 ${extra}kcal가 더해져요. 권장 범위 안이에요.`;
}

function renderTreats(plan) {
  const limit = Math.round(plan.need * TREAT_KCAL_LIMIT);
  const count = state.treatCount;

  $("#treatCount").textContent = count;
  $("#treatMinus").disabled = count <= 0;
  $("#treatPlus").disabled = count >= TREAT_MAX_COUNT;
  $$('input[name="treatSize"]').forEach((input) => (input.checked = input.value === state.treatSize));

  $("#treatKcal").textContent = `${plan.treatKcal} kcal`;
  $("#treatLimit").textContent = `${limit} kcal`;
  $("#treatMonthly").textContent = count ? `${count * DAYS}개 (${num((plan.treat.grams * count * DAYS) / 1000, 2)}kg)` : "–";
  $("#treatPrice").textContent = count ? won(plan.treatPrice) : "간식 미구독";

  const note = $("#treatNote");
  const over = plan.treatKcal > limit;
  note.classList.toggle("warn", over);
  note.textContent = !count
    ? "간식 없이 사료만 구독해요."
    : over
      ? `${SIZES[state.size].label} 기준 권장 상한을 넘었어요. 개수를 줄이거나 더 작은 간식을 추천드려요.`
      : `${SIZES[state.size].label}에게 알맞은 양이에요.`;
}

function renderSummary(plan) {
  const size = SIZES[state.size];
  const items = [
    {
      label: `${size.label} 시그니처 사료`,
      sub: `하루 ${dailyGrams(state.size)}g × ${DAYS}일 = ${num(monthlyKg(state.size))}kg`,
      price: size.price,
    },
    ...selectedToppings().map((t) => ({
      label: `토핑 · ${t.name}`,
      sub: `하루 ${toppingGrams(state.size)}g`,
      price: toppingMonthlyPrice(t, state.size),
    })),
  ];
  if (state.treatCount > 0) {
    items.push({
      label: `간식 · ${plan.treat.label}`,
      sub: `하루 ${state.treatCount}개 × ${DAYS}일`,
      price: plan.treatPrice,
    });
  }

  $("#summaryList").innerHTML = items
    .map((i) => `<li><span>${i.label}<small>${i.sub}</small></span><span>${won(i.price)}</span></li>`)
    .join("");
  $("#summaryTotal").textContent = won(plan.total);
  $("#mobileTotal").textContent = won(plan.total);

  const intake = Math.round(plan.base.kcal + plan.added.kcal + plan.treatKcal);
  $("#summaryKcal").textContent =
    `하루 총 섭취 열량 ${num(intake, 0)}kcal (권장 ${num(plan.need, 0)}kcal의 ${Math.round((intake / plan.need) * 100)}%)`;
}

function render() {
  const plan = calcPlan();
  renderToppings();
  renderNutrition(plan);
  renderTreats(plan);
  renderSummary(plan);
}

// ===== 신청서 =====
function planForSubmit() {
  const plan = calcPlan();
  return {
    size: SIZES[state.size].label,
    dailyFoodGrams: dailyGrams(state.size),
    monthlyFoodKg: Number(monthlyKg(state.size).toFixed(1)),
    toppings: selectedToppings().map((t) => t.name),
    treat: state.treatCount ? { type: plan.treat.label, perDay: state.treatCount } : null,
    monthlyTotal: plan.total,
  };
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(-4)}`;
}

function showMessage(text, type) {
  const el = $("#formMessage");
  el.textContent = text;
  el.className = `form-message ${type}`;
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  form.classList.add("was-validated");
  if (!form.reportValidity()) return;

  const data = Object.fromEntries(new FormData(form));
  data.agreePrivacy = Boolean(data.agreePrivacy);
  data.agreeMarketing = Boolean(data.agreeMarketing);
  data.plan = planForSubmit();
  data.submittedAt = new Date().toISOString();

  const button = $("#submitBtn");
  button.disabled = true;
  button.textContent = "보내는 중…";

  try {
    if (FORM_ENDPOINT) {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showMessage(`${data.ownerName}님, 신청이 접수되었어요. 곧 연락드릴게요!`, "success");
    } else {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      saved.push(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      console.info("[테스트 모드] 저장된 신청 내역:", saved);
      showMessage(`${data.ownerName}님, 신청이 접수되었어요. (테스트 모드: 이 브라우저에만 저장됨)`, "success");
    }
    form.reset();
    form.classList.remove("was-validated");
  } catch (err) {
    console.error(err);
    showMessage("전송 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "구독 신청하기";
  }
}

// ===== 이벤트 =====
function bindEvents() {
  $$('input[name="size"]').forEach((input) =>
    input.addEventListener("change", () => {
      state.size = input.value;
      if (!state.treatTouched) state.treatSize = SIZES[state.size].treat;
      render();
    })
  );

  $("#toppingList").addEventListener("change", (e) => {
    const { value, checked } = e.target;
    if (checked && state.toppings.size < MAX_TOPPINGS) state.toppings.add(value);
    else state.toppings.delete(value);
    render();
  });

  $$('input[name="treatSize"]').forEach((input) =>
    input.addEventListener("change", () => {
      state.treatSize = input.value;
      state.treatTouched = true;
      render();
    })
  );

  $("#treatMinus").addEventListener("click", () => {
    state.treatCount = Math.max(0, state.treatCount - 1);
    render();
  });
  $("#treatPlus").addEventListener("click", () => {
    state.treatCount = Math.min(TREAT_MAX_COUNT, state.treatCount + 1);
    render();
  });

  $("#phone").addEventListener("input", (e) => (e.target.value = formatPhone(e.target.value)));
  $("#orderForm").addEventListener("submit", handleSubmit);
}

// 첫 배송일은 내일부터 선택 가능
function setMinStartDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const local = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000);
  $("#startDate").min = local.toISOString().slice(0, 10);
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
    { threshold: 0.12 }
  );
  targets.forEach((el) => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  renderSizeCards();
  buildToppingList();
  bindEvents();
  setMinStartDate();
  setupReveal();
  render();
});
