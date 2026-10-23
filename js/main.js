// ===== 설정 =====
// 신청서를 받을 주소 (예: Formspree의 https://formspree.io/f/xxxxxx)
// 비워두면 테스트 모드로 동작하며, 신청 내용은 현재 브라우저(localStorage)에만 저장됩니다.
const FORM_ENDPOINT = "";
const STORAGE_KEY = "omakagae_requests";

const DAYS = 30;
const MAX_TOPPINGS = 3;
const TOPPING_RATIO = 0.1; // 토핑 1개 = 하루 사료 급여량의 10%
const TREAT_KCAL_LIMIT = 0.1; // 간식은 하루 열량의 10% 이내 권장

// 사료 타입별 100g당 영양성분
// 습식은 수분이 많아 같은 열량에 무게가 약 3배 → 1회분씩 진공 포장, 무게에 따라 배송비 추가
const FOOD_TYPES = {
  dry: {
    label: "건식",
    name: "시그니처 건식 사료",
    desc: "닭고기·현미·귀리를 오븐에 저온으로 구운 기본 사료",
    per100: { kcal: 350, protein: 26, fat: 14, carbs: 40, fiber: 3 },
  },
  wet: {
    label: "습식",
    name: "시그니처 습식 화식",
    desc: "닭고기·현미·채소를 수비드로 익힌 촉촉한 화식 사료",
    per100: { kcal: 115, protein: 10, fat: 7, carbs: 6, fiber: 0.8 },
    mealsPerDay: 2, // 1회 급여량씩 개별 진공 포장
  },
};
const WET_SHIPPING = { perKg: 5, fee: 3000 }; // 습식: 월 배송 무게 5kg당 3,000원

// weight: 평균 체중(kg), price: 월 사료 요금(원)
const SIZES = {
  small: { label: "소형견", weight: 5, price: 49000, treat: "S" },
  medium: { label: "중형견", weight: 15, price: 109000, treat: "M" },
  large: { label: "대형견", weight: 30, price: 179000, treat: "L" },
};

// 100g당 영양성분 (익힌 상태 기준), pricePerKg: 토핑 원가 기준 kg당 요금
const TOPPINGS = [
  {
    id: "chicken",
    name: "닭가슴살",
    note: "저지방 고단백",
    kcal: 165,
    protein: 31,
    fat: 3.6,
    carbs: 0,
    fiber: 0,
    pricePerKg: 18000,
  },
  {
    id: "salmon",
    name: "연어",
    note: "오메가-3 풍부",
    kcal: 206,
    protein: 22,
    fat: 12,
    carbs: 0,
    fiber: 0,
    pricePerKg: 32000,
  },
  {
    id: "beef",
    name: "소고기 안심",
    note: "철분 · 아연",
    kcal: 190,
    protein: 28,
    fat: 8,
    carbs: 0,
    fiber: 0,
    pricePerKg: 30000,
  },
  {
    id: "egg",
    name: "삶은 달걀",
    note: "완전 단백질",
    kcal: 155,
    protein: 13,
    fat: 11,
    carbs: 1.1,
    fiber: 0,
    pricePerKg: 12000,
  },
  {
    id: "sweetpotato",
    name: "고구마",
    note: "식이섬유 · 에너지",
    kcal: 90,
    protein: 2,
    fat: 0.2,
    carbs: 21,
    fiber: 3.3,
    pricePerKg: 9000,
  },
  {
    id: "pumpkin",
    name: "단호박",
    note: "장 건강 · 베타카로틴",
    kcal: 40,
    protein: 1,
    fat: 0.1,
    carbs: 10,
    fiber: 2,
    pricePerKg: 9000,
  },
  {
    id: "broccoli",
    name: "브로콜리",
    note: "비타민 C · K",
    kcal: 35,
    protein: 2.4,
    fat: 0.4,
    carbs: 7,
    fiber: 3.3,
    pricePerKg: 12000,
  },
  {
    id: "blueberry",
    name: "블루베리",
    note: "항산화 안토시아닌",
    kcal: 57,
    protein: 0.7,
    fat: 0.3,
    carbs: 14,
    fiber: 2.4,
    pricePerKg: 28000,
  },
  {
    id: "carrot",
    name: "당근",
    note: "눈 건강 · 베타카로틴",
    kcal: 35,
    protein: 0.8,
    fat: 0.2,
    carbs: 8,
    fiber: 3,
    pricePerKg: 8000,
  },
];

const TREATS = {
  S: { label: "소 · 한입 큐브", grams: 3, kcal: 10, price: 90 },
  M: { label: "중 · 수제 스틱", grams: 7, kcal: 23, price: 160 },
  L: { label: "대 · 통살 저키", grams: 15, kcal: 50, price: 300 },
};
const TREAT_MAX_COUNT = 10;

// 건강 상태별 열량 조절 비율과 추천 / 주의 토핑 (일반적인 영양 가이드 기준)
// 여러 개를 고르면 열량 비율이 누적 적용됨 (healthFactor 참고)
const HEALTH = [
  {
    id: "healthy",
    name: "건강해요",
    desc: "특별한 질환 없음",
    factor: 1,
    recommend: [],
    avoid: [],
    tip: "",
  },
  {
    id: "senior",
    name: "노령견",
    desc: "7살 이상 · 활동량 감소",
    factor: 0.85,
    recommend: ["salmon", "blueberry", "pumpkin"],
    avoid: [],
    tip: "활동량이 줄어든 만큼 열량을 15% 낮추고, 오메가-3와 항산화 재료를 더해요.",
  },
  {
    id: "obesity",
    name: "비만 · 체중 관리",
    desc: "적정 체중 초과",
    factor: 0.75,
    recommend: ["broccoli", "carrot", "pumpkin"],
    avoid: ["salmon", "beef", "egg"],
    tip: "열량을 25% 낮추고, 포만감은 높고 열량은 낮은 채소 토핑을 추천해요.",
  },
  {
    id: "joint",
    name: "관절 질환",
    desc: "슬개골 탈구 · 관절염",
    factor: 0.9,
    recommend: ["salmon", "blueberry", "broccoli"],
    avoid: [],
    tip: "관절 부담을 줄이도록 체중을 가볍게 유지하고 오메가-3를 챙겨요.",
  },
  {
    id: "kidney",
    name: "신장 질환",
    desc: "신부전 · 신장 수치 이상",
    factor: 0.95,
    recommend: ["pumpkin", "sweetpotato", "blueberry"],
    avoid: ["beef", "egg", "chicken"],
    tip: "인과 단백질 부담이 큰 육류·달걀 토핑은 빼고 채소 위주로 구성해요.",
  },
  {
    id: "heart",
    name: "심장 질환",
    desc: "판막 질환 · 심비대",
    factor: 0.95,
    recommend: ["salmon", "blueberry", "pumpkin"],
    avoid: [],
    tip: "적정 체중을 유지하고 오메가-3가 풍부한 연어를 추천해요. 모든 제품에 소금을 넣지 않아요.",
  },
  {
    id: "diabetes",
    name: "당뇨",
    desc: "혈당 관리 필요",
    factor: 0.9,
    recommend: ["chicken", "broccoli", "egg"],
    avoid: ["sweetpotato", "blueberry"],
    tip: "혈당을 빠르게 올리는 고구마·과일은 빼고 단백질과 식이섬유 위주로 구성해요.",
  },
  {
    id: "digestive",
    name: "췌장염 · 소화기 민감",
    desc: "구토 · 묽은 변",
    factor: 0.95,
    recommend: ["chicken", "pumpkin", "sweetpotato"],
    avoid: ["salmon", "beef", "egg"],
    tip: "지방이 많은 토핑은 빼고 소화가 쉬운 저지방 재료로 구성해요.",
  },
  {
    id: "skin",
    name: "피부 · 알레르기",
    desc: "가려움 · 발진",
    factor: 1,
    recommend: ["salmon", "sweetpotato", "blueberry"],
    avoid: ["beef", "egg"],
    tip: "흔한 알레르기 원인인 소고기·달걀은 빼요. 기본 사료에 닭고기가 들어가니 닭 알레르기가 있다면 신청서에 꼭 적어주세요.",
  },
];

const NUTRIENTS = [
  { key: "kcal", label: "열량", unit: "kcal", digits: 0 },
  { key: "protein", label: "단백질", unit: "g", digits: 1 },
  { key: "fat", label: "지방", unit: "g", digits: 1 },
  { key: "carbs", label: "탄수화물", unit: "g", digits: 1 },
  { key: "fiber", label: "식이섬유", unit: "g", digits: 1 },
];

const state = {
  size: "small",
  foodType: "dry",
  toppings: new Set(),
  health: new Set(), // 비어 있으면 '건강해요'
  treatSize: "S",
  treatCount: 2,
  treatTouched: false, // 사용자가 간식 크기를 직접 고르면 사이즈 변경 시 자동으로 바꾸지 않음
};

// ===== 계산 =====
// 하루 권장 열량 = RER(70 × 체중^0.75) × 1.6 (중성화 성견)
const dailyKcal = (size) => Math.round(70 * SIZES[size].weight ** 0.75 * 1.6);
const currentFood = () => FOOD_TYPES[state.foodType];
const gramsForKcal = (kcal, food = currentFood()) =>
  kcal / (food.per100.kcal / 100);

// 건강 상태
const selectedHealth = () => HEALTH.filter((h) => state.health.has(h.id));
// 여러 항목을 고르면 감소율이 누적(곱셈)되되, 과도한 감량을 막기 위해 최대 40%까지만 낮춤
const MIN_HEALTH_FACTOR = 0.6;
const healthFactor = () =>
  Math.max(
    MIN_HEALTH_FACTOR,
    selectedHealth().reduce((product, h) => product * h.factor, 1),
  );
const avoidedToppings = () => new Set(selectedHealth().flatMap((h) => h.avoid));

// 여러 질환에 공통으로 추천되는 토핑을 우선, 주의 토핑은 제외하고 최대 3개
function recommendedToppings() {
  const avoid = avoidedToppings();
  const score = new Map();
  selectedHealth().forEach((h) =>
    h.recommend.forEach((id, i) => {
      if (!avoid.has(id)) score.set(id, (score.get(id) || 0) + 10 - i);
    }),
  );
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TOPPINGS)
    .map(([id]) => id);
}

// 건강 상태를 반영한 실제 하루 권장 열량과 급여량
const needKcal = (size) => Math.round(dailyKcal(size) * healthFactor());
const dailyGrams = (size) => Math.round(gramsForKcal(needKcal(size)));
const monthlyKg = (size) => (dailyGrams(size) * DAYS) / 1000;
// 토핑 양은 사료 타입과 관계없이 건식 급여량 기준 (습식은 수분 때문에 무게만 늘어나므로)
const toppingGrams = (size) =>
  Math.round(gramsForKcal(needKcal(size), FOOD_TYPES.dry) * TOPPING_RATIO);

// 습식 1회분 진공 포장
function packInfo(size) {
  const meals = currentFood().mealsPerDay;
  if (!meals) return null;
  return { grams: Math.round(dailyGrams(size) / meals), count: meals * DAYS };
}

function nutrientsFor(per100, grams) {
  const ratio = grams / 100;
  return Object.fromEntries(
    NUTRIENTS.map(({ key }) => [key, per100[key] * ratio]),
  );
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
  // 반올림 전 급여량으로 계산해 권장 열량과 숫자를 맞춤
  const base = nutrientsFor(currentFood().per100, gramsForKcal(needKcal(size)));
  const added = Object.fromEntries(NUTRIENTS.map(({ key }) => [key, 0]));
  selectedToppings().forEach((t) => {
    const n = nutrientsFor(t, toppingGrams(size));
    NUTRIENTS.forEach(({ key }) => (added[key] += n[key]));
  });

  const treat = TREATS[state.treatSize];
  const treatKcal = treat.kcal * state.treatCount;
  const treatPrice = treat.price * state.treatCount * DAYS;
  const toppingPrice = selectedToppings().reduce(
    (sum, t) => sum + toppingMonthlyPrice(t, size),
    0,
  );

  // 월 배송 총 무게 (사료 + 토핑 + 간식)
  const shippingKg =
    monthlyKg(size) +
    (toppingGrams(size) * selectedToppings().length * DAYS) / 1000 +
    (treat.grams * state.treatCount * DAYS) / 1000;
  const shippingFee =
    state.foodType === "wet"
      ? Math.ceil(shippingKg / WET_SHIPPING.perKg) * WET_SHIPPING.fee
      : 0;

  return {
    base,
    added,
    need: needKcal(size),
    treat,
    treatKcal,
    treatPrice,
    toppingPrice,
    shippingKg,
    shippingFee,
    total: SIZES[size].price + toppingPrice + treatPrice + shippingFee,
  };
}

// ===== 포맷 =====
const won = (n) => `${n.toLocaleString("ko-KR")}원`;
const num = (n, digits = 1) =>
  Number(n.toFixed(digits)).toLocaleString("ko-KR");

// ===== 렌더링 =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// 사이즈 카드는 건강 상태 반영 전 표준값을 보여줌
function renderSizeCards() {
  $$(".size-card").forEach((card) => {
    const size = card.dataset.size;
    const grams = Math.round(gramsForKcal(dailyKcal(size), FOOD_TYPES.dry));
    card.querySelector('[data-field="kcal"]').textContent =
      `${num(dailyKcal(size), 0)} kcal`;
    card.querySelector('[data-field="grams"]').textContent = `${grams} g`;
    card.querySelector('[data-field="monthly"]').textContent =
      `${num((grams * DAYS) / 1000)} kg`;
    card.querySelector('[data-field="price"]').innerHTML =
      `${won(SIZES[size].price)} <small>/ 월</small>`;
  });
}

function buildToppingList() {
  $("#toppingList").innerHTML = TOPPINGS.map(
    (t) => `
      <label class="topping" data-topping="${t.id}">
        <input type="checkbox" value="${t.id}" />
        <span class="badge"></span>
        <strong>${t.name}</strong>
        <span class="note">${t.note}</span>
        <span class="add" data-topping-add="${t.id}"></span>
      </label>`,
  ).join("");
}

function renderToppings() {
  const grams = toppingGrams(state.size);
  const full = state.toppings.size >= MAX_TOPPINGS;

  const recommended = recommendedToppings();
  const avoid = avoidedToppings();

  TOPPINGS.forEach((t) => {
    const kcal = (t.kcal * grams) / 100;
    $(`[data-topping-add="${t.id}"]`).textContent =
      `+${grams}g · +${num(kcal, 0)}kcal · 월 ${won(toppingMonthlyPrice(t, state.size))}`;

    const card = $(`[data-topping="${t.id}"]`);
    card.classList.toggle("is-recommended", recommended.includes(t.id));
    card.classList.toggle("is-avoid", avoid.has(t.id));
    card.querySelector(".badge").textContent = avoid.has(t.id)
      ? "주의"
      : "추천";
  });

  $$("#toppingList input").forEach((input) => {
    input.checked = state.toppings.has(input.value);
    input.disabled = full && !input.checked;
  });
  $("#toppingCount").textContent = state.toppings.size;
}

function buildHealthList() {
  $("#healthList").innerHTML = HEALTH.map(
    (h) => `
      <label class="health-option">
        <input type="checkbox" value="${h.id}" />
        <strong>${h.name}</strong>
        <small>${h.desc}</small>
        <span class="factor">${h.factor < 1 ? `열량 −${Math.round((1 - h.factor) * 100)}%` : "열량 유지"}</span>
      </label>`,
  ).join("");
}

const toppingName = (id) => TOPPINGS.find((t) => t.id === id).name;
const chips = (ids, emptyText) =>
  ids.length
    ? ids.map((id) => `<li>${toppingName(id)}</li>`).join("")
    : `<li class="empty">${emptyText}</li>`;

function renderHealth() {
  $$("#healthList input").forEach((input) => {
    input.checked =
      input.value === "healthy"
        ? state.health.size === 0
        : state.health.has(input.value);
  });

  const standard = dailyKcal(state.size);
  const need = needKcal(state.size);
  const cut = Math.round((1 - healthFactor()) * 100);
  $("#healthKcal").textContent = `${num(need, 0)} kcal`;
  $("#healthKcalNote").textContent = cut
    ? `${SIZES[state.size].label} 표준 ${num(standard, 0)}kcal에서 ${cut}% 낮췄어요 · 하루 ${dailyGrams(state.size)}g` +
      (healthFactor() === MIN_HEALTH_FACTOR ? " (최대 감량폭 40% 적용)" : "")
    : `${SIZES[state.size].label} 표준 열량 그대로예요 · 하루 ${dailyGrams(state.size)}g`;

  $("#healthRecommend").innerHTML = chips(
    recommendedToppings(),
    "원하는 토핑을 자유롭게 골라주세요",
  );
  $("#healthAvoid").innerHTML = chips([...avoidedToppings()], "없음");

  const tips = selectedHealth().map(
    (h) => `<li><strong>${h.name}</strong> · ${h.tip}</li>`,
  );
  $("#healthTips").innerHTML = tips.length
    ? tips.join("")
    : "<li>건강한 아이는 표준 열량으로 설계해요.</li>";
  $("#applyHealth").textContent = recommendedToppings().length
    ? "추천 토핑 담고 다음 단계로"
    : "다음 단계로";
}

function renderFood(plan) {
  const food = currentFood();
  const p = food.per100;
  const pack = packInfo(state.size);

  $$('input[name="foodType"]').forEach(
    (input) => (input.checked = input.value === state.foodType),
  );
  $("#baseName").textContent = food.name;
  $("#baseDesc").textContent = food.desc;
  $("#baseSpec").textContent =
    `100g당 ${p.kcal}kcal · 단백질 ${p.protein}g · 지방 ${p.fat}g · 탄수화물 ${p.carbs}g · 식이섬유 ${p.fiber}g`;
  $("#basePack").textContent = pack
    ? `하루 ${dailyGrams(state.size)}g → 1회분 ${pack.grams}g씩 개별 진공 포장 · 월 ${pack.count}팩`
    : `하루 ${dailyGrams(state.size)}g · 월 ${num(monthlyKg(state.size))}kg 지퍼백 소분 포장`;

  const notice = $("#shippingNotice");
  notice.hidden = !plan.shippingFee;
  notice.textContent = plan.shippingFee
    ? `습식은 건식보다 무게가 약 3배 무거워 추가 배송비가 발생해요. 월 배송 무게 ${num(plan.shippingKg)}kg 기준 ` +
      `${WET_SHIPPING.perKg}kg당 ${won(WET_SHIPPING.fee)} → 배송비 ${won(plan.shippingFee)}`
    : "";
}

function renderNutrition(plan) {
  const cut = Math.round((1 - healthFactor()) * 100);
  $("#nutriSizeLabel").textContent =
    SIZES[state.size].label + (cut ? ` · 건강 맞춤 −${cut}%` : "");
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
  $$('input[name="treatSize"]').forEach(
    (input) => (input.checked = input.value === state.treatSize),
  );

  $("#treatKcal").textContent = `${plan.treatKcal} kcal`;
  $("#treatLimit").textContent = `${limit} kcal`;
  $("#treatMonthly").textContent = count
    ? `${count * DAYS}개 (${num((plan.treat.grams * count * DAYS) / 1000, 2)}kg)`
    : "–";
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
  const pack = packInfo(state.size);
  const items = [
    {
      label: `${size.label} ${currentFood().label} 사료`,
      sub: pack
        ? `1회분 ${pack.grams}g 진공 포장 × ${pack.count}팩 = ${num(monthlyKg(state.size))}kg`
        : `하루 ${dailyGrams(state.size)}g × ${DAYS}일 = ${num(monthlyKg(state.size))}kg`,
      price: size.price,
    },
    ...(state.health.size
      ? [
          {
            label: "건강 맞춤",
            sub: `${selectedHealth()
              .map((h) => h.name)
              .join(", ")} · 하루 ${num(plan.need, 0)}kcal`,
            price: 0,
          },
        ]
      : []),
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
  items.push({
    label: "배송비",
    sub: plan.shippingFee
      ? `습식 · 월 ${num(plan.shippingKg)}kg (${WET_SHIPPING.perKg}kg당 ${won(WET_SHIPPING.fee)})`
      : `월 ${num(plan.shippingKg)}kg · 건식 무료 배송`,
    price: plan.shippingFee,
    freeText: "무료",
  });

  $("#summaryList").innerHTML = items
    .map(
      (i) =>
        `<li><span>${i.label}<small>${i.sub}</small></span><span>${i.price ? won(i.price) : i.freeText || "포함"}</span></li>`,
    )
    .join("");
  $("#summaryTotal").textContent = won(plan.total);
  $("#mobileTotal").textContent = won(plan.total);

  const intake = Math.round(plan.base.kcal + plan.added.kcal + plan.treatKcal);
  $("#summaryKcal").textContent =
    `하루 총 섭취 열량 ${num(intake, 0)}kcal (권장 ${num(plan.need, 0)}kcal의 ${Math.round((intake / plan.need) * 100)}%)`;
}

function render() {
  const plan = calcPlan();
  renderHealth();
  renderFood(plan);
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
    foodType: currentFood().label,
    vacuumPacks: packInfo(state.size),
    health: selectedHealth().map((h) => h.name),
    dailyKcal: plan.need,
    dailyFoodGrams: dailyGrams(state.size),
    monthlyFoodKg: Number(monthlyKg(state.size).toFixed(1)),
    toppings: selectedToppings().map((t) => t.name),
    treat: state.treatCount
      ? { type: plan.treat.label, perDay: state.treatCount }
      : null,
    shippingFee: plan.shippingFee,
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
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showMessage(
        `${data.ownerName}님, 신청이 접수되었어요. 곧 연락드릴게요!`,
        "success",
      );
    } else {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      saved.push(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      console.info("[테스트 모드] 저장된 신청 내역:", saved);
      showMessage(
        `${data.ownerName}님, 신청이 접수되었어요. (테스트 모드: 이 브라우저에만 저장됨)`,
        "success",
      );
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
// 선택 직후 다음 단계 섹션으로 화면 이동
function goToSection(id) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  setTimeout(() => {
    document
      .getElementById(id)
      .scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
  }, 350);
}

function bindEvents() {
  $$('input[name="size"]').forEach((input) =>
    input.addEventListener("change", () => {
      state.size = input.value;
      if (!state.treatTouched) state.treatSize = SIZES[state.size].treat;
      render();
      goToSection("health");
    }),
  );
  // 이미 선택된 사이즈를 다시 눌러도 다음 단계로 이동
  $$(".size-card").forEach((card) =>
    card.addEventListener("click", (e) => {
      if (e.target.tagName !== "INPUT" && card.querySelector("input").checked)
        goToSection("health");
    }),
  );

  $("#healthList").addEventListener("change", (e) => {
    const { value, checked } = e.target;
    if (value === "healthy") state.health.clear();
    else if (checked) state.health.add(value);
    else state.health.delete(value);
    render();
  });

  $("#applyHealth").addEventListener("click", () => {
    const recommended = recommendedToppings();
    if (recommended.length) state.toppings = new Set(recommended);
    render();
    goToSection("custom");
  });

  $$('input[name="foodType"]').forEach((input) =>
    input.addEventListener("change", () => {
      state.foodType = input.value;
      render();
    }),
  );

  $("#toppingList").addEventListener("change", (e) => {
    const { value, checked } = e.target;
    if (checked && state.toppings.size < MAX_TOPPINGS)
      state.toppings.add(value);
    else state.toppings.delete(value);
    render();
  });

  $$('input[name="treatSize"]').forEach((input) =>
    input.addEventListener("change", () => {
      state.treatSize = input.value;
      state.treatTouched = true;
      render();
    }),
  );

  $("#treatMinus").addEventListener("click", () => {
    state.treatCount = Math.max(0, state.treatCount - 1);
    render();
  });
  $("#treatPlus").addEventListener("click", () => {
    state.treatCount = Math.min(TREAT_MAX_COUNT, state.treatCount + 1);
    render();
  });

  $("#phone").addEventListener(
    "input",
    (e) => (e.target.value = formatPhone(e.target.value)),
  );
  $("#orderForm").addEventListener("submit", handleSubmit);
}

// 첫 배송일은 내일부터 선택 가능
function setMinStartDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const local = new Date(
    tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000,
  );
  $("#startDate").min = local.toISOString().slice(0, 10);
}

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

// 스크롤을 내리면 헤더 숨김, 올리면 다시 표시
function setupHeaderAutoHide() {
  const header = $(".site-header");
  let lastY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 6) return; // 미세한 흔들림 무시
      header.classList.toggle(
        "is-hidden",
        y > lastY && y > header.offsetHeight,
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

document.addEventListener("DOMContentLoaded", () => {
  renderSizeCards();
  buildToppingList();
  buildHealthList();
  bindEvents();
  setupHeaderAutoHide();
  setMinStartDate();
  setupReveal();
  setupDialogs();
  setupBackToTop();
  render();
});
