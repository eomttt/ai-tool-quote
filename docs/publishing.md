# 웹 게시

Next.js 16 App Router를 사용합니다. 요청마다 목록·도구 설명·제목을 HTML로 보내고, 브라우저에서 React가 검색·상세·비교 동작을 연결합니다. 공개 주소는 https://ai-tool-quote.vercel.app 입니다.

## 서버 실행

Node.js 22를 사용합니다. 개발 서버는 `npm run dev`로 실행하며 주소는 `http://127.0.0.1:5173`입니다.

```sh
npm ci
cp .env.example .env
npm run build
npm run start
```

`.env`에서 공개 HTTPS 도메인을 `PUBLIC_SITE_URL`에 입력합니다. 경로 없는 주소를 사용합니다. `CONTACT_EMAIL`은 사이트의 문의처이며 선택 사항입니다. 미설정 시 운영자의 공개 GitHub 프로필로 연결합니다. 비밀 값이나 계정 비밀번호를 넣는 항목은 없습니다.

로컬 프로덕션 서버는 기본 `0.0.0.0:4173`을 사용합니다. 다른 포트가 필요하면 `npx next start --port 8080`으로 실행합니다. 상태 확인 URL은 `/healthz`이며, HTML은 요청마다 렌더링하고 빌드된 정적 자산은 캐시합니다.

Dockerfile은 Next.js standalone 결과물과 정적 자산을 복사합니다. 컨테이너 기본 포트는 8080입니다. 컨테이너 빌드는 아직 검증하지 않았습니다.

## Vercel 배포

`vercel.json`은 Next.js 프리셋을 사용하며, `package.json`은 Node.js 22를 지정합니다. Vercel이 `npm run build`를 실행해 서버 함수와 정적 자산을 배포합니다. Express 서버나 별도의 정적 파일 복사 단계는 없습니다.

```sh
npx vercel link --project ai-tool-quote --scope hyuntae-eoms-projects
npx vercel --prod
```

프로덕션에서는 `PUBLIC_SITE_URL`이 없으면 Vercel이 제공하는 프로젝트의 기본 프로덕션 주소를 사용합니다. 도메인을 연결하면 `PUBLIC_SITE_URL`을 해당 HTTPS 주소로 설정합니다. Preview 배포는 공개 도메인 설정을 적용하지 않아 검색 색인을 차단합니다.

`.vercel/`과 `.env.local`은 로컬 연결·인증 파일이므로 커밋하지 않습니다. `.vercelignore`는 환경 파일과 조사 자료를 업로드에서 제외합니다. CLI 배포는 GitHub push와 별개이며, Git 자동 배포는 Vercel GitHub 앱에 저장소 접근 권한을 부여하고 연결한 뒤 사용할 수 있습니다.

현재 광고는 꺼져 있습니다. [Vercel Hobby 정책](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)은 개인의 비상업적 사용만 허용하므로, AdSense를 붙여 수익화하기 전에는 Pro 이상의 요금제가 필요합니다.

## 언어와 검색 노출

루트 방문은 HTTP `Accept-Language`의 한국어·영어 우선순위로 언어를 정하며, 지원 언어가 없으면 영어입니다. `/ko`, `/en`, `/ko/images`, `/en/images`는 언어가 고정된 URL입니다. 소개와 개인정보 안내도 각각 `/ko/about`, `/en/about`, `/ko/privacy`, `/en/privacy`에 있습니다.

Next.js Metadata API로 언어별 canonical, hreflang, Open Graph를 생성합니다. `/sitemap.xml`과 `/robots.txt`는 Route Handler가 응답합니다. 공개 주소가 없거나 개발·Preview 배포이면 검색 색인을 금지하며, 도구 상세는 별도 URL 없이 탐색 중 여는 패널입니다.

## AdSense 연결

사이트에 광고를 게재해 수익을 받는 제품은 Google AdSense입니다. 처음에는 [자동 광고](https://support.google.com/adsense/answer/9261805?hl=ko) 하나로 시작합니다. 기존 공통 스크립트를 사용하므로 개별 광고 단위 ID나 배너 이미지는 필요하지 않으며, 광고 형식·양·제외 위치는 AdSense 계정에서 조정합니다.

1. 사이트를 공개 HTTPS 도메인에 배포하고 `PUBLIC_SITE_URL`을 설정합니다.
2. AdSense 계정을 만들고 사이트를 등록합니다. 발급받은 게시자 ID를 `ADSENSE_CLIENT=ca-pub-...`에 입력합니다.
3. `ADSENSE_ENABLED=false`를 유지한 채 배포합니다. 자동으로 생성되는 계정 확인 메타 태그 또는 `/ads.txt`로 사이트를 확인하고 [검토를 요청](https://support.google.com/adsense/answer/7584263?hl=ko)합니다.
4. 사이트 승인 후 계정에서 자동 광고를 설정하고 `ADSENSE_ENABLED=true`로 배포합니다.

승인 전에는 코드만 넣어도 광고가 게재되지 않습니다. 광고 스크립트는 활성화된 프로덕션 카탈로그에서만 로드하며, 개발 모드와 소개·개인정보·404 페이지에서는 꺼집니다.

EEA·영국·스위스에 광고를 게재할 경우 [Google이 요구하는 인증 CMP](https://support.google.com/adsense/answer/13554020?hl=en)를 계정에서 설정해야 합니다. 동의 관리는 아직 구성하지 않았습니다. 실제 호스팅의 로그 처리, 문의처, 사용 지역과 광고 설정에 맞춰 개인정보 안내를 검토하고 게시합니다. 현재 구현은 광고 연결을 위한 준비이며 계정 심사·동의 설정·광고 송출 확인까지 완료한 상태가 아닙니다.

## 게시 전 확인

```sh
npm test
npm run test:pricing-sources
npm run build
npm run format:check
```

공개 도메인에서 HTML 본문, 언어별 URL, 자산, 404 응답, sitemap, robots, ads.txt를 확인합니다. 브라우저에서는 검색·패널 전환·비교·개인정보 링크를 확인합니다. 검색어와 비교 선택은 브라우저 메모리에만 두고 서버로 전송하지 않습니다.
