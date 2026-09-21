# 툴견적

하고 싶은 상황을 입력하면 영상·이미지 제작 도구와 맡길 수 있는 작업을 찾아주는 Next.js 검색 사이트입니다. 38개 도구의 활용 방법과 기능을 소개하고, 공식 가격을 확인한 36개 도구의 요금표를 제공합니다.

## 실행

Node.js 22를 사용합니다.

```sh
npm ci
npm run dev
```

```sh
npm run build
npm test
npm run format:check
```

## 사용자 흐름

“사진 몇 장으로 유튜브 쇼츠를 만들고 싶어”처럼 가진 재료와 원하는 결과를 입력합니다. BM25F가 38개 도구의 공식 기능 설명과 편집한 활용 상황을 검색합니다. 이름·기능 검색도 지원하며 카드에서 추천 근거와 시작 구독료를 확인할 수 있습니다. 검색하지 않을 때는 영상·이미지별 전체 목록을 보여줍니다.

상세는 목록 옆의 패널에서 열립니다. 배경을 가리거나 목록 클릭을 막지 않아 다른 도구를 연속으로 탐색할 수 있습니다. 모바일에서는 화면 아래쪽에 표시합니다. 패널 내부에서 Escape 키를 누르면 닫히고 원래 선택 버튼으로 돌아갑니다.

요금제 탭에는 월 구독료, 포함 크레딧·토큰·GPU 시간과 지급 주기, 확인된 추가 구매 가격을 표시합니다. 연간 가격은 월 환산액과 연 선결제액을 구분합니다. 최대 3개 도구는 페이지 안의 비교표로 살펴볼 수 있습니다.

## 언어

서버는 브라우저의 `Accept-Language`로 한국어·영어를 선택합니다. 지역 코드와 언어 우선순위를 인식하고 지원 언어가 없으면 영어를 표시합니다. `/ko/`, `/en/` 등 명시한 언어 URL에서는 그 언어를 유지합니다. `react-i18next`로 서버와 브라우저를 같은 언어로 렌더링하며 쿠키·localStorage에 언어를 저장하지 않습니다.

UI 번역은 `src/common/locales/ui.ko.json`과 `ui.en.json`에 있습니다. 도구 설명과 요금 조건의 영어 번역은 `catalog.en.json`에 원문 문장과 함께 관리합니다. 한국어는 기존 카탈로그 JSON을 원문으로 사용합니다. 가격, 통화, 수집일, 출처는 언어에 따라 바꾸지 않습니다.

메뉴·검색·도구 설명·요금표·출처 안내·접근성 문구·페이지 제목·문서 언어를 번역합니다. 숫자와 날짜는 선택한 언어로 표시합니다. 카탈로그 문장을 추가하거나 수정하면 영어 번역도 갱신해야 하며, 누락은 `npm test`에서 검사합니다.

## 데이터

- `src/domains/catalog/data/tools.json`: 이름, 대표 아이콘 경로, 제작 분야, 용도, 특징, 살펴볼 점, 검색어, 공식 출처.
- `src/domains/catalog/data/product-profiles.json`: 공식 설명에서 요약한 38개 도구의 53개 기능, 입력·출력, 출처·확인일·근거.
- `src/domains/catalog/data/scenarios.json`: 편집한 활용 상황과 근거가 되는 도구·기능 ID.
- `src/domains/catalog/data/search-vocabulary.json`: 검색에 사용하는 한·영 동의어와 일반 표현.
- `src/domains/catalog/data/pricing-audits.json`: 38개 도구의 확인 결과, 수집 방법, 출처와 근거 파일.
- `src/domains/catalog/data/pricing.json`: 과금 방식, 요금제, 월·연 포함량, 통화, 추가 구매 팩, 확인일과 공식 가격 출처.

JSON은 Zod로 검증합니다. 도구 ID 중복, 연결되지 않은 가격 ID, 잘못된 가격·포함량은 앱 시작 시 오류로 드러납니다.

공식 기능과 편집한 활용 상황은 따로 관리합니다. 검색은 등록한 단어·동의어를 대조하며 문장의 모든 조건을 이해하거나 결과 품질을 보장하지 않습니다. [메타데이터 작성·검토 방법](docs/product-metadata.md)에 구조, 근거 보관, 수집 명령과 검색 한계를 정리했습니다.

영상 길이, 해상도, 생성 횟수에 따른 비용 계산은 제공하지 않습니다. `구독료 환산`은 구독료를 포함량으로 나눈 참고값이며 실제 추가 구매 단가와 구별합니다. 서로 다른 서비스의 크레딧을 같은 제작량으로 환산하지 않습니다.

`요금표 있는 도구만` 필터는 가격 데이터 존재 여부로 동작합니다. 연간 가격을 확인하지 못한 서비스도 목록에 남고, 상세에서 월간 가격을 보여줍니다. 가격 확인 후 30일이 지나면 재확인 표시와 함께 마지막 확인 가격을 유지합니다.

## 디자인과 구성

흑백 색상과 shadcn/ui의 Button, Badge, Input, Checkbox, Tabs, Separator를 사용합니다. 공식 CLI의 new-york 컴포넌트를 가져와 기존 디렉터리 규칙에 맞춰 `common/components/이름/index.tsx`에 배치했습니다. 스타일은 Tailwind CSS 4와 CSS 변수로 구성합니다.

- `src/app`: Next.js 라우트, 레이아웃, 메타데이터
- `src/app/_pages/ComparePage`: 탐색 페이지와 선택 상태
- `src/router/App.tsx`: 언어별 클라이언트 진입점
- `src/domains/catalog`: 도구 데이터, 검증, 특징·가격 표시
- `src/common`: 공통 UI와 스타일

공식 요금표를 확인한 뒤 JSON으로 관리합니다. 공식 페이지를 수동 명령으로 수집하는 크롤러를 제공합니다. 정기 실행 주기는 아직 정하지 않았습니다. SSR·언어별 URL·사이트맵·AdSense 연결 코드를 준비했습니다. [Vercel](https://ai-tool-quote.vercel.app)에 공개 배포했으며 광고는 꺼져 있습니다. [게시 방법](docs/publishing.md)에 서버 실행과 도메인·게시자 ID 설정을 정리했습니다. 결제와 콘텐츠 생성은 제공하지 않습니다. 가격 갱신 방식은 [가격 갱신 문서](docs/pricing-updates.md)에 정리했습니다.

## 공식 요금 수집

```sh
npm run crawl:pricing
npm run crawl:pricing -- --tool higgsfield
npm run test:pricing-sources
```

Python 3.9 이상과 네트워크 연결이 필요합니다. HTTP 수집 원문은 `research/pricing/`에 저장하고 원본 HTML은 `.cache/pricing-sources/`에 보관합니다. 브라우저 확인 기록과 도구별 결과는 [수집 결과](research/README.md)에서 볼 수 있습니다.

크롤러는 공개 가격 JSON을 덮어쓰지 않습니다. 수집 내용에서 결제 주기·할인·통화·포함량을 확인한 뒤 반영합니다.

## 도구 아이콘 수집

```sh
npm run fetch:icons
npm run fetch:icons -- --tool higgsfield
```

공식 사이트가 선언한 아이콘을 내려받아 `public/tool-icons/`에 보관합니다. 큰 Apple Touch Icon과 밝은 화면용 아이콘을 우선하고, 선언이 없으면 사이트의 `/favicon.ico`를 확인합니다. 외부 아이콘 서비스는 사용하지 않습니다.

수집한 38개 아이콘의 원본 주소, 발견한 페이지, 수집 시각, 파일 해시는 [아이콘 출처 기록](research/icon-sources.json)에 남겼습니다. 공식 사이트의 아이콘 원본을 수정하지 않고 서비스 식별용으로 표시합니다. 브랜드의 권리는 각 서비스에 있습니다.

수집에 성공한 아이콘만 도구 JSON에 반영합니다. 재수집에 실패하면 기존 파일을 유지합니다. 화면에서 이미지를 불러오지 못하면 도구의 글자 아이콘을 표시합니다. 교체 후에는 카드·상세 패널·추천 목록에서 모양을 확인합니다.
