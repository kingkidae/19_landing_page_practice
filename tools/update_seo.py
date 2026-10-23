"""오마카개 SEO · 콘텐츠 갱신 도구

사용법 (프로젝트 폴더에서):
    python tools/update_seo.py

하는 일
1. 모든 페이지 <head>의 <!-- seo:start --> ~ <!-- seo:end --> 사이를 다시 채웁니다.
   (title, description, canonical, Open Graph, 구조화 데이터 JSON-LD)
2. js/news-data.js의 글로 news/글id.html 상세 페이지를 만듭니다.
   자바스크립트를 실행하지 않는 검색엔진 · AI 크롤러도 본문을 읽을 수 있게 정적 HTML로 만듭니다.
3. news.html 목록과 index.html 최신 소식을 HTML로 미리 채웁니다.
4. faq.html의 질문 · 답변으로 FAQPage 구조화 데이터를 만듭니다.
5. sitemap.xml, robots.txt, llms.txt를 만듭니다.

글 추가 · FAQ 수정 · 페이지 제목 변경 후에는 다시 실행하세요.
사이트 주소(도메인)나 회사 정보가 바뀌면 아래 SITE_URL, BUSINESS, PAGES만 고치면 됩니다.
"""

import datetime
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# 사이트 주소 (끝에 / 포함). 도메인을 연결하면 바꿔주세요.
SITE_URL = "https://kingkidae.github.io/19_landing_page_practice/"

BUSINESS = {
    "name": "오마카개",
    "alternateName": "OMAKAGAE",
    "description": "대구광역시 수성구의 작은 주방에서 체급 · 건강 상태에 맞춘 수제 강아지 사료와 간식을 매일 소량으로 만들어 월 1회 30일분을 냉장 배송하는 반려견 맞춤 사료 정기구독 브랜드",
    "telephone": "+82-10-4526-6868",
    "region": "대구광역시",
    "locality": "수성구",
    "street": "상록로 15",
    "founder": "김기대",
    "foundingDate": "2026-01",
    "opens": "10:00",
    "closes": "18:00",
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
}

# 페이지별 제목 · 설명 · 대표 이미지 · 페이지 종류 · 이동 경로 이름
PAGES = {
    "index.html": {
        "title": "오마카개 | 대구 수제 강아지 사료 · 간식 맞춤 정기구독",
        "description": "셰프에게 맡기듯, 우리 아이의 한 끼를. 오마카개는 대구 수성구 주방에서 만든 수제 강아지 사료와 간식을 체급 · 건강 상태에 맞춰 설계해 매달 30일분을 냉장 배송합니다.",
        "image": "images/hero-corgi-yorkie.jpg",
        "type": "WebPage",
        "crumb": None,
    },
    "brand.html": {
        "title": "브랜드 소개 | 오마카개 - 대구 수성구 수제 강아지 사료 브랜드",
        "description": "오마카세처럼 오늘 가장 좋은 재료로 아이 한 마리를 위한 한 그릇을 만드는 오마카개의 아이덴티티, 설립 이념, 비전, 로고, 연혁과 회사 개요를 소개합니다.",
        "image": "images/brand-kitchen.jpg",
        "type": "AboutPage",
        "crumb": "브랜드",
    },
    "ingredients.html": {
        "title": "재료 · 품질 | 오마카개 수제 강아지 사료 원재료와 영양성분",
        "description": "오마카개 건식 · 습식 사료와 토핑 9종의 원재료, 100g당 열량 · 단백질 · 지방 영양성분, 만드는 과정, 강아지에게 위험한 음식과 보관 방법을 공개합니다.",
        "image": "images/brand-ingredients.jpg",
        "type": "WebPage",
        "crumb": "재료 · 품질",
    },
    "order.html": {
        "title": "강아지 맞춤 사료 신청 · 구독료 계산 | 오마카개",
        "description": "소형 · 중형 · 대형견 체급과 건강 상태를 고르면 하루 권장 열량과 급여량, 월 구독료가 바로 계산됩니다. 건식 · 습식 사료에 토핑과 간식을 더해 맞춤 구독을 신청하세요.",
        "image": "images/page-order.jpg",
        "type": "WebPage",
        "crumb": "맞춤 사료 신청",
    },
    "news.html": {
        "title": "애견 정보 | 연구로 읽는 반려견 영양 · 건강 소식 - 오마카개",
        "description": "최신 논문과 공식 발표를 바탕으로 반려견 영양 · 식단, 노화 · 수명, 행동 · 인지 연구와 국내 펫푸드 제도 소식을 보호자가 읽기 쉽게 정리합니다.",
        "image": "images/page-news.jpg",
        "type": "CollectionPage",
        "crumb": "애견 정보",
    },
    "reviews.html": {
        "title": "고객 후기 | 오마카개 수제 사료 구독",
        "description": "오마카개 맞춤 수제 사료 구독 후기를 체급 · 사료 타입 · 별점별로 확인하고 우리 아이와의 경험을 직접 남겨보세요.",
        "image": "images/brand-story.jpg",
        "type": "WebPage",
        "crumb": "고객 후기",
    },
    "faq.html": {
        "title": "자주 묻는 질문 (FAQ) | 오마카개 수제 사료 구독",
        "description": "오마카개 강아지 수제 사료 구독 · 결제, 사료 · 영양, 건강 · 알레르기, 배송 · 보관, 교환 · 환불에 대한 자주 묻는 질문과 답변입니다.",
        "image": "images/page-faq.jpg",
        "type": "FAQPage",
        "crumb": "FAQ",
    },
    "contact.html": {
        "title": "매장 · 문의 | 오마카개 대구 수성구 상록로 15",
        "description": "오마카개 주방 위치(대구광역시 수성구 상록로 15), 운영 시간, 전화 상담 010-4526-6868, 구독 · 단체 주문 · 제휴 문의 양식을 안내합니다.",
        "image": "images/brand-kitchen.jpg",
        "type": "ContactPage",
        "crumb": "매장 · 문의",
    },
}

TODAY = datetime.date.today().isoformat()
BUSINESS_ID = SITE_URL + "#business"
WEBSITE_ID = SITE_URL + "#website"


# ===== 공통 =====
def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def write(name, text):
    path = ROOT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def esc(text):
    return html.escape(str(text), quote=True)


def page_url(name):
    return SITE_URL if name == "index.html" else SITE_URL + name


def replace_between(text, start, end, inner, name):
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    if not pattern.search(text):
        raise SystemExit(f"{name}: '{start}' 표시를 찾을 수 없습니다.")
    return pattern.sub(lambda _: start + inner + end, text, count=1)


def js_value(source, name):
    """news-data.js처럼 `const 이름 = <JSON>;` 형태의 값을 읽음"""
    match = re.search(rf"const {name} = (.*?);\n", source, re.S)
    return json.loads(match[1])


def json_ld(graph):
    data = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=2)
    return data.replace("</", "<\\/")


# ===== 구조화 데이터 =====
def business_entity():
    b = BUSINESS
    return {
        "@type": "PetStore",
        "@id": BUSINESS_ID,
        "name": b["name"],
        "alternateName": b["alternateName"],
        "description": b["description"],
        "url": SITE_URL,
        "logo": SITE_URL + "images/logo.svg",
        "image": SITE_URL + "images/hero-corgi-yorkie.jpg",
        "telephone": b["telephone"],
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "KR",
            "addressRegion": b["region"],
            "addressLocality": b["locality"],
            "streetAddress": b["street"],
        },
        "founder": {"@type": "Person", "name": b["founder"]},
        "foundingDate": b["foundingDate"],
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": b["days"],
            "opens": b["opens"],
            "closes": b["closes"],
        },
        "areaServed": {"@type": "Country", "name": "대한민국"},
        "priceRange": "₩49,000~₩179,000 / 월",
        "knowsAbout": ["수제 강아지 사료", "반려견 맞춤 사료", "강아지 화식", "반려견 영양", "강아지 간식"],
    }


def breadcrumb(url, trail):
    items = [{"name": "홈", "url": SITE_URL}, *trail]
    return {
        "@type": "BreadcrumbList",
        "@id": url + "#breadcrumb",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": item["name"], "item": item["url"]}
            for i, item in enumerate(items)
        ],
    }


def webpage(url, page_type, title, description, image, has_crumb):
    entity = {
        "@type": page_type,
        "@id": url + "#webpage",
        "url": url,
        "name": title,
        "description": description,
        "inLanguage": "ko-KR",
        "isPartOf": {"@id": WEBSITE_ID},
        "about": {"@id": BUSINESS_ID},
        "primaryImageOfPage": {"@type": "ImageObject", "url": image},
    }
    if has_crumb:
        entity["breadcrumb"] = {"@id": url + "#breadcrumb"}
    return entity


def base_graph():
    return [
        {
            "@type": "WebSite",
            "@id": WEBSITE_ID,
            "url": SITE_URL,
            "name": BUSINESS["name"],
            "alternateName": BUSINESS["alternateName"],
            "inLanguage": "ko-KR",
            "publisher": {"@id": BUSINESS_ID},
        },
        business_entity(),
    ]


def seo_block(url, title, description, image, graph, og_type="website", robots="index, follow, max-image-preview:large", extra=""):
    return f"""
    <title>{esc(title)}</title>
    <meta name="description" content="{esc(description)}" />
    <meta name="robots" content="{robots}" />
    <link rel="canonical" href="{url}" />
    <meta property="og:type" content="{og_type}" />
    <meta property="og:site_name" content="{BUSINESS['name']}" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:title" content="{esc(title)}" />
    <meta property="og:description" content="{esc(description)}" />
    <meta property="og:url" content="{url}" />
    <meta property="og:image" content="{image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="#3a2a1f" />{extra}
    <script type="application/ld+json">
{json_ld(graph)}
    </script>
    """


# ===== 데이터 읽기 =====
def load_articles():
    source = read("js/news-data.js")
    categories = js_value(source, "NEWS_CATEGORIES")
    articles = sorted(js_value(source, "ARTICLES"), key=lambda a: a["date"], reverse=True)
    return categories, articles


def load_faq():
    text = read("faq.html")
    items = []
    for q, a in re.findall(r"<details[^>]*>\s*<summary>(.*?)</summary>\s*<p>(.*?)</p>\s*</details>", text, re.S):
        a = re.sub(r"<sup>(.*?)</sup>", r"^\1", a)
        clean = lambda s: html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s))).strip()
        items.append((clean(q), clean(a)))
    return items


def load_prices():
    source = read("js/order.js")
    sizes = re.findall(r'(\w+): \{ label: "([^"]+)", weight: (\d+), price: (\d+)', source)
    return [{"label": label, "weight": int(w), "price": int(p)} for _, label, w, p in sizes]


def sample_reviews_on():
    return "const SHOW_SAMPLE_REVIEWS = true;" in read("js/reviews-data.js")


# ===== 애견 정보 HTML =====
def fmt_date(date):
    return date.replace("-", ".")


def article_card(a, categories, prefix="./", featured=False):
    """js/news.js의 articleCard()와 같은 마크업"""
    image = prefix + a["image"].removeprefix("./")
    return f"""
            <article class="news-card{' is-featured' if featured else ''}">
              <a href="{prefix}news/{a['id']}.html" class="news-card-link">
                <figure class="news-thumb">
                  <img src="{image}" alt="{esc(a['imageAlt'])}" loading="lazy" />
                </figure>
                <div class="news-card-body">
                  <p class="news-meta">
                    <span class="news-cat">{esc(categories[a['category']])}</span>
                    <time datetime="{a['date']}">{fmt_date(a['date'])}</time>
                  </p>
                  <h3>{esc(a['title'])}</h3>
                  <p class="news-dek">{esc(a['dek'])}</p>
                  <p class="news-source">{esc(a['source']['name'])} · {a['readMin']}분 읽기</p>
                </div>
              </a>
            </article>"""


def article_main(a, articles, categories):
    i = articles.index(a)
    newer = articles[i - 1] if i > 0 else None
    older = articles[i + 1] if i + 1 < len(articles) else None
    cat = esc(categories[a["category"]])

    def section(s):
        paragraphs = "".join(f"\n            <p>{esc(p)}</p>" for p in s.get("paragraphs", []))
        items = "".join(f"\n              <li>{esc(li)}</li>" for li in s.get("list", []))
        lst = f"\n            <ul>{items}\n            </ul>" if items else ""
        return f"""
          <section class="article-section">
            <h2>{esc(s['title'])}</h2>{paragraphs}{lst}
          </section>"""

    def pager(x, label, cls):
        if not x:
            return f'<span class="{cls}"></span>'
        return f"""<a href="./news/{x['id']}.html" class="{cls}">
          <small>{label}</small>
          <strong>{esc(x['title'])}</strong>
        </a>"""

    stats = "".join(
        f"\n            <li><strong>{esc(s['value'])}</strong><span>{esc(s['label'])}</span></li>" for s in a["stats"]
    )
    takeaways = "".join(f"\n              <li>{esc(t)}</li>" for t in a["takeaways"])
    links = [{"label": "원문 보기", "url": a["source"]["url"]}, *a.get("links", [])]
    link_items = "".join(
        f'\n              <li><a href="{esc(l["url"])}" target="_blank" rel="noopener">{esc(l["label"])} ↗</a></li>'
        for l in links
    )
    others = [x for x in articles if x is not a]
    related = ([x for x in others if x["category"] == a["category"]] + [x for x in others if x["category"] != a["category"]])[:3]
    published = a.get("published", a["date"])

    return f"""
      <article class="article">
        <header class="container article-head">
          <nav class="breadcrumb" aria-label="현재 위치">
            <a href="./index.html">홈</a><span>/</span>
            <a href="./news.html">애견 정보</a><span>/</span>
            <a href="./news.html?category={a['category']}">{cat}</a>
          </nav>
          <p class="news-meta">
            <span class="news-cat">{cat}</span>
            <time datetime="{a['date']}">원문 {fmt_date(a['date'])}</time>
            <span>{a['readMin']}분 읽기</span>
          </p>
          <h1>{esc(a['title'])}</h1>
          <p class="article-dek">{esc(a['dek'])}</p>
          <p class="article-byline">오마카개 편집팀 · <time datetime="{published}">{fmt_date(published)}</time> 작성</p>
        </header>

        <figure class="container article-hero">
          <img src="./{a['image'].removeprefix('./')}" alt="{esc(a['imageAlt'])}" />
          <figcaption>출처 · {esc(a['source']['name'])}</figcaption>
        </figure>

        <div class="container article-layout">
          <div class="article-body">
            <ul class="stat-row">{stats}
            </ul>
{''.join(section(s) for s in a['sections'])}

            <aside class="omakagae-note">
              <svg class="brand-mark" aria-hidden="true"><use href="#logo-mark" /></svg>
              <div>
                <p class="eyebrow">Omakagae Note</p>
                <h2>오마카개 노트</h2>
                <p>{esc(a['note'])}</p>
                <a href="./order.html" class="btn btn-primary btn-sm">맞춤 사료 설계하기</a>
              </div>
            </aside>
          </div>

          <aside class="article-aside">
            <div class="aside-card">
              <p class="panel-label">한눈에 보기</p>
              <ul class="takeaways">{takeaways}
              </ul>
            </div>
            <div class="aside-card">
              <p class="panel-label">출처</p>
              <p class="citation">{esc(a['source']['citation'])}</p>
              <ul class="source-links">{link_items}
              </ul>
            </div>
            <p class="article-disclaimer">
              * 연구 내용을 쉽게 풀어 정리한 글로, 수의사의 진단이나 치료를 대신하지
              않습니다. 아이의 건강에 변화가 있다면 동물병원과 먼저 상담해주세요.
            </p>
          </aside>
        </div>

        <nav class="container article-pager" aria-label="이전 · 다음 글">
          {pager(older, "← 이전 글", "pager-prev")}
          <a href="./news.html" class="pager-list">목록</a>
          {pager(newer, "다음 글 →", "pager-next")}
        </nav>
      </article>

      <!-- 함께 읽으면 좋은 글 -->
      <section class="section section-sand">
        <div class="container">
          <header class="section-head split">
            <div>
              <p class="eyebrow">Read Next</p>
              <h2>함께 읽으면 좋은 글</h2>
            </div>
            <a href="./news.html" class="btn btn-ghost btn-sm">전체 보기</a>
          </header>
          <div class="news-grid">{''.join(article_card(x, categories) for x in related)}
          </div>
        </div>
      </section>
    """


# ===== 페이지별 처리 =====
def update_root_pages(articles, categories, faq, prices, noindex_reviews):
    for name, cfg in PAGES.items():
        text = read(name)
        url = page_url(name)
        image = SITE_URL + cfg["image"]
        graph = base_graph()
        page = webpage(url, cfg["type"], cfg["title"], cfg["description"], image, bool(cfg["crumb"]))
        graph.append(page)
        if cfg["crumb"]:
            graph.append(breadcrumb(url, [{"name": cfg["crumb"], "url": url}]))

        if name == "faq.html":
            page["mainEntity"] = [
                {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq
            ]
        if name == "order.html":
            graph.append({
                "@type": "Product",
                "@id": url + "#product",
                "name": "오마카개 체급별 맞춤 수제 강아지 사료 정기구독",
                "description": "체급과 건강 상태에 맞춰 하루 권장 열량을 계산한 수제 건식 · 습식 사료를 월 1회 30일분 냉장 배송하는 정기구독. 토핑 9종과 수제 간식 3종을 더할 수 있습니다.",
                "brand": {"@type": "Brand", "name": BUSINESS["name"]},
                "image": [SITE_URL + "images/kibble-bowl.jpg", SITE_URL + "images/page-order.jpg"],
                "offers": [
                    {
                        "@type": "Offer",
                        "name": f"{p['label']} 기본 사료 월 구독 (평균 체중 {p['weight']}kg 기준)",
                        "price": p["price"],
                        "priceCurrency": "KRW",
                        "availability": "https://schema.org/InStock",
                        "url": url,
                        "seller": {"@id": BUSINESS_ID},
                        "priceSpecification": {
                            "@type": "UnitPriceSpecification",
                            "price": p["price"],
                            "priceCurrency": "KRW",
                            "referenceQuantity": {"@type": "QuantitativeValue", "value": 1, "unitCode": "MON"},
                        },
                    }
                    for p in prices
                ],
            })
        if name == "news.html":
            page["mainEntity"] = {
                "@type": "ItemList",
                "itemListElement": [
                    {"@type": "ListItem", "position": i + 1, "url": SITE_URL + f"news/{a['id']}.html", "name": a["title"]}
                    for i, a in enumerate(articles)
                ],
            }

        robots = "index, follow, max-image-preview:large"
        if name == "reviews.html" and noindex_reviews:
            robots = "noindex, follow"  # 예시 후기가 켜져 있는 동안 검색 결과에 노출하지 않음
        extra = ""
        if name == "index.html":
            extra = """
    <!-- 검색엔진 소유 확인: Google Search Console · 네이버 서치어드바이저에서 받은 값으로 주석을 풀어 사용하세요
    <meta name="google-site-verification" content="" />
    <meta name="naver-site-verification" content="" />
    -->"""
        text = replace_between(
            text, "<!-- seo:start -->", "<!-- seo:end -->",
            seo_block(url, cfg["title"], cfg["description"], image, graph, robots=robots, extra=extra), name,
        )

        if name == "news.html":
            cards = "".join(article_card(a, categories, featured=(i == 0)) for i, a in enumerate(articles))
            text = replace_between(text, "<!-- auto:news-list -->", "<!-- /auto:news-list -->", cards + "\n            ", name)
        if name == "index.html":
            cards = "".join(article_card(a, categories) for a in articles[:3])
            text = replace_between(text, "<!-- auto:latest-news -->", "<!-- /auto:latest-news -->", cards + "\n            ", name)
        write(name, text)


def build_article_pages(articles, categories):
    template = read("news.html")
    template = re.sub(r'\n    <script src="\./js/news(-data)?\.js" defer></script>', "", template)
    out_dir = ROOT / "news"
    keep = set()
    for a in articles:
        url = SITE_URL + f"news/{a['id']}.html"
        image = SITE_URL + a["image"].removeprefix("./")
        published = a.get("published", a["date"])
        graph = base_graph()
        graph.append(webpage(url, "WebPage", a["title"], a["dek"], image, True))
        graph.append(breadcrumb(url, [
            {"name": "애견 정보", "url": SITE_URL + "news.html"},
            {"name": a["title"], "url": url},
        ]))
        graph.append({
            "@type": "Article",
            "@id": url + "#article",
            "headline": a["title"],
            "description": a["dek"],
            "image": image,
            "datePublished": published,
            "dateModified": published,
            "inLanguage": "ko-KR",
            "articleSection": categories[a["category"]],
            "author": {"@type": "Organization", "name": "오마카개 편집팀", "url": SITE_URL + "brand.html"},
            "publisher": {"@id": BUSINESS_ID},
            "mainEntityOfPage": {"@id": url + "#webpage"},
            "citation": {"@type": "CreativeWork", "name": a["source"]["citation"], "url": a["source"]["url"]},
        })
        extra = f'\n    <meta property="article:published_time" content="{published}" />'
        text = replace_between(
            template, "<!-- seo:start -->", "<!-- seo:end -->",
            seo_block(url, f"{a['title']} | 오마카개 애견 정보", a["dek"], image, graph, og_type="article", extra=extra),
            "news.html",
        )
        text = re.sub(r'(<main id="top">).*?(</main>)', lambda m: m[1] + article_main(a, articles, categories) + m[2], text, count=1, flags=re.S)
        # news/ 폴더 안에 있으므로 상대 경로를 한 단계 위로
        text = text.replace('href="./', 'href="../').replace('src="./', 'src="../')
        filename = f"{a['id']}.html"
        write(f"news/{filename}", text)
        keep.add(filename)
    # 데이터에서 지운 글의 페이지는 삭제
    for old in out_dir.glob("*.html"):
        if old.name not in keep:
            old.unlink()


def build_sitemap(articles, noindex_reviews):
    urls = [(page_url(n), TODAY) for n in PAGES if not (n == "reviews.html" and noindex_reviews)]
    urls += [(SITE_URL + f"news/{a['id']}.html", a.get("published", a["date"])) for a in articles]
    body = "".join(f"  <url>\n    <loc>{esc(u)}</loc>\n    <lastmod>{d}</lastmod>\n  </url>\n" for u, d in urls)
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}</urlset>\n')


def build_robots():
    bots = ["Googlebot", "Yeti", "Bingbot", "Daumoa", "GPTBot", "OAI-SearchBot", "ChatGPT-User",
            "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Google-Extended"]
    allow = "".join(f"User-agent: {b}\nAllow: /\n\n" for b in bots)
    write("robots.txt", f"""# 오마카개 robots.txt
# 검색엔진(구글 · 네이버 · 빙 · 다음)과 AI 검색 · 답변 서비스 크롤러의 수집을 허용합니다.

{allow}User-agent: *
Allow: /

Sitemap: {SITE_URL}sitemap.xml
""")


def build_llms(articles, categories, faq, prices):
    b = BUSINESS
    price_text = " · ".join(f"{p['label']} 월 {p['price']:,}원" for p in prices)
    pages = "\n".join(f"- [{cfg['crumb'] or '홈'}]({page_url(n)}): {cfg['description']}" for n, cfg in PAGES.items())
    news = "\n".join(f"- [{a['title']}]({SITE_URL}news/{a['id']}.html): {a['dek']} (출처: {a['source']['name']})" for a in articles)
    qa = "\n".join(f"- {q} — {a}" for q, a in faq)
    write("llms.txt", f"""# {b['name']} ({b['alternateName']})

> {b['description']}

## 기본 정보
- 회사명: {b['name']} ({b['alternateName']})
- 대표: {b['founder']}
- 설립: {b['foundingDate']}
- 주소: {b['region']} {b['locality']} {b['street']}
- 전화: 010-4526-6868 (평일 {b['opens']}–{b['closes']})
- 서비스: 체급(소형 · 중형 · 대형) · 건강 상태 맞춤 수제 강아지 사료(건식 · 습식 화식), 토핑 9종, 수제 간식 3종 정기구독, 월 1회 30일분 냉장 배송
- 기본 요금: {price_text} (토핑 · 간식 · 습식 배송비 별도, VAT 포함)
- 하루 권장 열량 계산식: RER(70 × 체중^0.75) × 1.6 (중성화 성견 기준)

## 주요 페이지
{pages}

## 애견 정보 (연구 기반 반려견 소식)
{news}

## 자주 묻는 질문
{qa}
""")


def main():
    categories, articles = load_articles()
    faq = load_faq()
    prices = load_prices()
    noindex_reviews = sample_reviews_on()
    update_root_pages(articles, categories, faq, prices, noindex_reviews)
    build_article_pages(articles, categories)
    build_sitemap(articles, noindex_reviews)
    build_robots()
    build_llms(articles, categories, faq, prices)
    print(f"완료: 페이지 {len(PAGES)}개 · 글 {len(articles)}개 · FAQ {len(faq)}개 · 가격 {len(prices)}개")
    if noindex_reviews:
        print("참고: 예시 후기가 켜져 있어 reviews.html은 noindex로 설정했습니다.")


if __name__ == "__main__":
    main()
