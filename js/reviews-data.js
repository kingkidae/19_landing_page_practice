// ===== 고객 후기 예시 데이터 =====
// 디자인 확인용 예시 후기를 정해진 규칙(고정 시드)으로 생성합니다. 실제 고객 후기가 아닙니다.
// 실제 서비스를 열 때는 SHOW_SAMPLE_REVIEWS를 false로 바꾸고 실제 구매 고객의 후기만 보여주세요.
const SHOW_SAMPLE_REVIEWS = true;
const SAMPLE_REVIEW_COUNT = 520;

const REVIEW_SIZES = { small: "소형견", medium: "중형견", large: "대형견" };
const REVIEW_FOODS = { dry: "건식", wet: "습식" };
const REVIEW_HEALTH = {
  senior: "노령견 맞춤",
  obesity: "체중 관리",
  joint: "관절 케어",
  skin: "피부 · 알레르기",
  digestive: "소화기 민감",
};

const REVIEW_BREEDS = {
  small: ["말티즈", "푸들", "포메라니안", "치와와", "요크셔테리어", "시츄", "닥스훈트", "비숑 프리제"],
  medium: ["비글", "웰시코기", "시바견", "보더콜리", "프렌치불독", "스탠다드 슈나우저", "믹스견"],
  large: ["골든 리트리버", "래브라도 리트리버", "진돗개", "저먼 셰퍼드", "사모예드", "말라뮤트"],
};
const REVIEW_TOPPINGS = ["닭가슴살", "연어", "소고기 안심", "삶은 달걀", "고구마", "단호박", "브로콜리", "블루베리", "당근"];

// 문장 조각 ({breed} {age} {size} {topping} 자리에 값이 들어감)
const REVIEW_PHRASES = {
  intro: [
    "{age}살 {breed} 보호자예요.",
    "{breed} {age}살 아이 키우고 있어요.",
    "{age}살 된 {breed} 한 마리와 살고 있어요.",
    "{size} 구독 중인 {age}살 {breed} 보호자입니다.",
    "입이 짧은 {age}살 {breed} 키워요.",
    "{breed} 두 마리 중 첫째 기준으로 남겨요.",
  ],
  dry: [
    "건식인데 냄새부터 고소해서 봉지를 뜯으면 먼저 달려와요.",
    "알갱이가 바삭해서 오독오독 잘 씹어 먹어요.",
    "지퍼백으로 소분돼 와서 보관이 정말 편해요.",
    "하루 급여량이 정해져 있어서 따로 계량할 필요가 없어요.",
    "예전 사료는 남기기 일쑤였는데 요즘은 그릇을 깨끗하게 비워요.",
  ],
  wet: [
    "습식 화식은 1회분씩 진공 포장이라 하나씩 꺼내 주기 편해요.",
    "촉촉해서 물을 잘 안 마시던 아이인데 걱정이 줄었어요.",
    "화식으로 바꾸고 나서 밥그릇을 핥아서 비워요.",
    "팩마다 날짜가 적혀 있어서 냉동실 관리가 쉬워요.",
    "배송비가 붙긴 하지만 기호성은 확실히 습식이 좋네요.",
  ],
  topping: [
    "{topping} 토핑을 올렸더니 제일 먼저 골라 먹어요.",
    "토핑으로 {topping} 넣었는데 양이 딱 적당해요.",
    "{topping} 토핑은 매달 고정으로 넣고 있어요.",
    "{topping} 토핑 덕분에 밥시간만 되면 꼬리를 흔들어요.",
  ],
  health: {
    senior: [
      "노령견이라 열량을 낮춰 설계해주신 점이 마음에 들어요.",
      "나이 들면서 밥을 남기곤 했는데 요즘은 다 먹어요.",
    ],
    obesity: [
      "체중 관리 중인데 정량대로 주니까 조절이 쉬워요.",
      "채소 토핑으로 포만감을 채워주니 덜 보채요.",
    ],
    joint: [
      "관절 때문에 체중을 신경 쓰는데 하루 열량이 숫자로 나와서 좋아요.",
      "연어 토핑 추천받아서 꾸준히 먹이고 있어요.",
    ],
    skin: [
      "소고기를 빼달라고 적었더니 정확히 맞춰서 보내주셨어요.",
      "알레르기 때문에 성분표를 꼼꼼히 보는데 전부 공개돼 있어서 안심돼요.",
    ],
    digestive: [
      "장이 예민한 편인데 기존 사료와 섞어 천천히 바꾸니 무리 없이 적응했어요.",
      "지방이 적은 토핑으로 추천받아서 속 편하게 잘 먹어요.",
    ],
  },
  service: [
    "신청서를 보내니 담당자분이 전화로 구성을 다시 확인해주셔서 믿음이 갔어요.",
    "아이스팩이 넉넉해서 차가운 상태로 도착했어요.",
    "다음 달 구성 변경도 연락 한 번에 바로 반영해주셨어요.",
    "성분표와 영양 계산이 다 보여서 믿고 먹여요.",
  ],
  close5: [
    "앞으로도 계속 구독할게요!",
    "산책 친구들한테도 추천했어요.",
    "정기 구독 고민 중이라면 추천해요.",
    "아이가 잘 먹으니 그걸로 충분해요.",
    "만족합니다 :)",
  ],
  close4: [
    "전체적으로 만족해요.",
    "다음 달엔 다른 토핑도 시도해보려고요.",
    "가격만 조금 더 착하면 완벽할 것 같아요.",
  ],
  con: [
    "다만 일반 사료보다는 가격이 확실히 부담돼요.",
    "배송이 하루 늦은 달이 한 번 있었어요.",
    "처음 이틀은 낯설어해서 기존 사료와 섞어 줬어요.",
    "토핑 양이 생각보다 적게 느껴졌어요.",
    "간식 크기가 우리 아이에게는 조금 커서 잘라서 줘요.",
  ],
  mixed: [
    "잘 먹긴 하는데 기대만큼 확 달라진 건 모르겠어요.",
    "아이 반응은 반반이에요. 좋아하는 날도, 남기는 날도 있어요.",
    "재료가 좋은 건 알겠는데 우리 아이 입맛엔 호불호가 있네요.",
  ],
  close3: [
    "한 달 더 먹여보고 결정하려고요.",
    "구성을 바꿔서 다시 시도해볼게요.",
  ],
  problem: [
    {
      text: "처음 며칠은 잘 먹다가 일주일째부터 남기기 시작했어요.",
      reply: "아이 입맛에 맞는 구성을 다시 찾을 수 있도록 담당자가 연락드려 토핑 · 사료 타입 변경을 도와드리겠습니다.",
    },
    {
      text: "받았을 때 아이스팩이 다 녹아 있어서 속상했어요.",
      reply: "배송 중 온도 관리가 부족했던 점 사과드립니다. 확인 후 바로 재발송해드리고 포장을 보완하겠습니다.",
    },
    {
      text: "우리 아이에게는 습식이 잘 안 맞는지 변이 묽어졌어요.",
      reply: "사료를 바꿀 때는 7~10일에 걸쳐 천천히 섞어 주시는 것이 좋아요. 건식 전환이나 구성 조정을 상담해드리겠습니다.",
    },
    {
      text: "가격에 비해 양이 적게 느껴져요.",
      reply: "하루 권장 열량 기준으로 정량을 설계하고 있어 기존 사료보다 적어 보일 수 있어요. 아이 체중에 맞게 다시 확인해드리겠습니다.",
    },
    {
      text: "배송 일정 안내를 늦게 받아서 사료가 떨어질 뻔했어요.",
      reply: "일정 안내가 늦어 불편을 드렸습니다. 다음 배송부터는 출고 3일 전에 미리 안내드리겠습니다.",
    },
  ],
  closeLow: [
    "개선되면 다시 이용해볼게요.",
    "아쉬워서 별점을 낮게 남겨요.",
    "구성을 바꿀지 고민 중이에요.",
  ],
};

// 같은 결과가 나오도록 고정 시드를 쓰는 난수 (mulberry32)
function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSampleReviews(count) {
  const rand = seededRandom(20260523);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const weighted = (pairs) => {
    let r = rand();
    for (const [value, weight] of pairs) {
      if ((r -= weight) < 0) return value;
    }
    return pairs[pairs.length - 1][0];
  };

  // 정기 구독을 시작한 2026년 5월부터 어제까지
  const start = new Date(2026, 4, 10).getTime();
  const end = new Date(2026, 9, 22).getTime();
  const letters = "abcdefghijklmnopqrstuvwxyz";

  const reviews = [];
  for (let i = 0; i < count; i++) {
    const size = weighted([["small", 0.55], ["medium", 0.28], ["large", 0.17]]);
    const food = weighted([["dry", 0.6], ["wet", 0.4]]);
    const rating = weighted([[5, 0.68], [4, 0.22], [3, 0.07], [2, 0.02], [1, 0.01]]);
    const health = weighted([
      [null, 0.6], ["senior", 0.12], ["obesity", 0.09], ["joint", 0.07], ["skin", 0.07], ["digestive", 0.05],
    ]);
    const age = health === "senior" ? 8 + Math.floor(rand() * 8) : 1 + Math.floor(rand() * 9);
    const toppings = [...REVIEW_TOPPINGS]
      .sort(() => rand() - 0.5)
      .slice(0, Math.floor(rand() * 4));
    const values = {
      breed: pick(REVIEW_BREEDS[size]),
      age,
      size: REVIEW_SIZES[size],
      topping: toppings[0],
    };
    const fill = (text) => text.replace(/\{(\w+)\}/g, (_, key) => values[key]);

    const lines = [];
    let reply = null;
    if (rand() < 0.75) lines.push(pick(REVIEW_PHRASES.intro));

    if (rating >= 4) {
      lines.push(pick(REVIEW_PHRASES[food]));
      if (toppings.length) lines.push(pick(REVIEW_PHRASES.topping));
      if (health) lines.push(pick(REVIEW_PHRASES.health[health]));
      if (rand() < 0.4) lines.push(pick(REVIEW_PHRASES.service));
      if (rating === 4) lines.push(pick(REVIEW_PHRASES.con), pick(REVIEW_PHRASES.close4));
      else lines.push(pick(REVIEW_PHRASES.close5));
    } else if (rating === 3) {
      lines.push(pick(REVIEW_PHRASES.mixed), pick(REVIEW_PHRASES.con), pick(REVIEW_PHRASES.close3));
    } else {
      const problem = pick(REVIEW_PHRASES.problem);
      lines.push(problem.text, pick(REVIEW_PHRASES.closeLow));
      reply = `안녕하세요, 오마카개입니다. 불편을 드려 죄송합니다. ${problem.reply}`;
    }

    const date = new Date(start + rand() * (end - start));
    reviews.push({
      id: `sample-${i + 1}`,
      nick: `${pick([...letters])}*******`,
      rating,
      date: [date.getFullYear(), date.getMonth() + 1, date.getDate()]
        .map((n) => String(n).padStart(2, "0"))
        .join("-"),
      size,
      food,
      toppings,
      breed: values.breed,
      age,
      health,
      text: fill(lines.join(" ")),
      helpful: Math.floor(rand() ** 2 * 40),
      reply,
      sample: true,
    });
  }
  return reviews;
}

// 회사가 통제할 수 없는 사유(날씨 · 택배사 · 연휴 등)로 불편이 있었지만 사후 응대에 만족한 예시 후기
// 별점은 응대가 아닌 '배송 경험' 기준으로 매긴 경우가 많아 1~5점에 고르게 분포
const CARE_SAMPLE_REVIEWS = [
  {
    rating: 5,
    date: "2026-09-02",
    nick: "s*******",
    size: "small",
    food: "wet",
    breed: "말티즈",
    age: 6,
    text: "태풍 때문에 택배사 배송이 하루 밀렸는데, 출고 전날 담당자분이 먼저 전화로 알려주시고 아이스팩을 두 배로 넣어 보내주셨어요. 하루 늦게 받았는데도 팩이 꽁꽁 얼어 있었어요. 날씨는 어쩔 수 없는 건데 이렇게까지 챙겨주셔서 감동했어요.",
    reply: "태풍 소식에 혹시나 싶어 보냉을 더 챙겼는데 무사히 도착해 다행이에요. 기다려주셔서 감사합니다.",
    helpful: 64,
  },
  {
    rating: 5,
    date: "2026-07-18",
    nick: "m*******",
    size: "medium",
    food: "dry",
    breed: "웰시코기",
    age: 4,
    text: "택배 기사님이 옆 동 같은 호수로 잘못 배송하셨어요. 오마카개 고객센터에 말씀드렸더니 택배사에 직접 확인해주시고, 찾는 동안 아이 밥이 떨어지면 안 된다며 당일에 새로 하나 더 보내주셨어요. 잘못 간 상자도 회수까지 챙겨주셨고요.",
    reply: "아이 식사가 끊기지 않는 게 가장 중요하다고 생각했어요. 빠르게 알려주셔서 저희도 감사했습니다.",
    helpful: 51,
  },
  {
    rating: 5,
    date: "2026-08-21",
    nick: "y*******",
    size: "small",
    food: "dry",
    breed: "포메라니안",
    age: 9,
    text: "아이가 갑자기 장염에 걸려서 병원에서 한동안 처방식만 먹이라고 했어요. 이미 이번 달 사료가 출고된 뒤라 걱정했는데, 구독을 바로 일시정지해주시고 남은 사료 보관법과 회복 후 천천히 다시 바꾸는 방법까지 차근차근 알려주셨어요. 다 나아서 다시 잘 먹고 있어요.",
    reply: "아이가 건강하게 회복해서 정말 다행이에요. 다시 오마카개를 찾아주셔서 고맙습니다.",
    helpful: 47,
  },
  {
    rating: 4,
    date: "2026-08-07",
    nick: "j*******",
    size: "large",
    food: "wet",
    breed: "골든 리트리버",
    age: 5,
    text: "폭염 경보 기간에 택배 차량이 지연돼서 아이스팩이 일부 녹은 채로 도착했어요. 사진을 보내드리니 10분 만에 답장이 와서 다음 날 바로 재발송해주셨고, 이후로는 보냉 박스를 더 두꺼운 걸로 바꿔주셨어요. 별 하나는 재발송분을 기다린 하루 때문에 뺐어요.",
    reply: "무더위에 불편을 드려 죄송했어요. 여름철에는 계속 강화된 보냉 포장으로 보내드릴게요.",
    helpful: 38,
  },
  {
    rating: 4,
    date: "2026-09-29",
    nick: "h*******",
    size: "medium",
    food: "dry",
    breed: "시바견",
    age: 3,
    text: "추석 연휴에 택배사가 쉬어서 배송 일정이 애매했는데, 연휴 전에 미리 연락 주셔서 2주분을 먼저 보내주셨어요. 덕분에 연휴 내내 사료 걱정이 없었어요. 연휴 직후 나머지 분량이 조금 늦게 온 건 아쉬웠지만 충분히 이해돼요.",
    reply: "명절 택배 휴무로 일정이 나뉘어 번거로우셨을 텐데 이해해주셔서 감사합니다.",
    helpful: 29,
  },
  {
    rating: 4,
    date: "2026-06-24",
    nick: "d*******",
    size: "small",
    food: "wet",
    breed: "비숑 프리제",
    age: 2,
    text: "아파트 공동현관 출입이 안 돼서 기사님이 경비실에 맡기셨는데, 퇴근이 늦어 몇 시간 상온에 있었어요. 혹시 몰라 문의했더니 상태를 같이 확인해주시고, 조금이라도 걱정되면 새로 보내드리겠다고 해주셨어요. 다음부터는 공동현관 비밀번호를 신청서에 꼭 적어두려고요.",
    reply: "아이가 먹는 음식이라 조금이라도 걱정되시면 언제든 말씀해주세요. 배송 메모 등록도 도와드릴게요.",
    helpful: 22,
  },
  {
    rating: 3,
    date: "2026-07-05",
    nick: "p*******",
    size: "medium",
    food: "dry",
    breed: "비글",
    age: 7,
    text: "제가 이사 전 주소를 그대로 적어서 사료가 옛날 집으로 갔어요. 제 실수인데도 택배사 회수를 대신 요청해주시고 새 주소로 다시 보내주셨어요. 그 사이 이틀은 동네에서 산 사료를 먹였는데 아이가 잘 안 먹어서 별점은 셋만 드려요. 응대는 정말 친절했어요.",
    reply: "주소 변경은 언제든 편하게 말씀 주세요. 이사 후 아이가 새 환경에 잘 적응하길 바랄게요.",
    helpful: 18,
  },
  {
    rating: 3,
    date: "2026-07-23",
    nick: "w*******",
    size: "large",
    food: "dry",
    breed: "진돗개",
    age: 6,
    text: "장마철 집중호우로 우리 지역 택배가 사흘이나 멈췄어요. 날씨 탓이라 어쩔 수 없었지만 사료가 떨어져서 급하게 다른 사료를 사야 했던 건 아쉬워요. 그래도 매일 배송 상황을 문자로 알려주셔서 답답하지는 않았어요.",
    reply: "호우로 배송이 멈춰 많이 기다리셨죠. 다음 장마철에는 출고 일정을 앞당겨 미리 보내드릴게요.",
    helpful: 15,
  },
  {
    rating: 2,
    date: "2026-08-14",
    nick: "n*******",
    size: "small",
    food: "dry",
    breed: "치와와",
    age: 8,
    text: "운송 중에 상자가 크게 찌그러져서 와서 처음엔 기분이 상했어요. 사진을 보내자마자 사과와 함께 재발송해주셨고 응대는 정말 친절했지만, 다시 받기까지 이틀이 걸려서 배송 경험 기준으로 별점은 낮게 드려요.",
    reply: "포장 상태로 속상하셨을 텐데 다시 기다려주셔서 감사합니다. 완충재를 보강해 보내드리고 있어요.",
    helpful: 12,
  },
  {
    rating: 2,
    date: "2026-10-03",
    nick: "c*******",
    size: "small",
    food: "wet",
    breed: "시츄",
    age: 11,
    text: "노견이라 그런지 입맛이 까다로워서 결국 화식이 잘 안 맞았어요. 그래도 담당자분이 세 번이나 통화하면서 토핑을 바꿔보고 소량 샘플까지 보내주셨어요. 우리 아이와는 인연이 아니었지만 상담만큼은 최고였어요.",
    reply: "아이 입맛을 함께 찾아가는 시간이 저희에게도 소중했어요. 언제든 다시 상담해드릴게요.",
    helpful: 9,
  },
  {
    rating: 1,
    date: "2026-09-11",
    nick: "t*******",
    size: "medium",
    food: "wet",
    breed: "보더콜리",
    age: 4,
    text: "택배사 물류센터에서 상자가 분실돼서 결국 도착하지 않았어요. 별점은 택배 때문에 1점이지만 오마카개 대응은 5점이에요. 분실 확인 즉시 새로 조리해서 보내주시고 환불도 원하면 해주겠다고 먼저 말씀해주셨어요.",
    reply: "택배 분실로 많이 놀라셨을 거예요. 끝까지 믿고 기다려주셔서 진심으로 감사합니다.",
    helpful: 33,
  },
  {
    rating: 1,
    date: "2026-07-30",
    nick: "r*******",
    size: "large",
    food: "dry",
    breed: "래브라도 리트리버",
    age: 2,
    text: "배송 중 택배 차량 사고가 나서 상자가 젖은 채로 왔어요. 너무 당황스러웠는데 바로 전화를 주셔서 젖은 제품은 폐기하라고 안내해주시고, 다음 날 새 제품을 받았어요. 아이 밥은 무사했지만 첫 배송부터 이런 일이 생겨 별점은 1점으로 남깁니다.",
    reply: "첫 배송에서 놀라게 해드려 죄송합니다. 앞으로는 기분 좋은 배송만 전해드릴게요.",
    helpful: 20,
  },
].map((r, i) => ({
  id: `sample-care-${i + 1}`,
  toppings: [],
  health: null,
  sample: true,
  ...r,
  reply: `안녕하세요, 오마카개입니다. ${r.reply}`,
}));

const SAMPLE_REVIEWS = SHOW_SAMPLE_REVIEWS
  ? [...CARE_SAMPLE_REVIEWS, ...generateSampleReviews(SAMPLE_REVIEW_COUNT)]
  : [];
