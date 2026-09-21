# 웹 게시

Vite의 React 서버 렌더링과 Express를 사용합니다. Node 서버가 첫 응답에 목록·도구 설명·제목을 HTML로 보내고, 브라우저에서 React가 검색·상세·비교 동작을 연결합니다. 정적 파일만 올리는 호스팅으로는 실행할 수 없습니다.

## 서버 실행

Node.js 22.12 이상이 필요합니다.

```sh
npm ci
cp .env.example .env
npm run build
npm run start
```

`.env`에서 공개 HTTPS 도메인을 `PUBLIC_SITE_URL`에 입력합니다. 경로 없는 주소를 사용합니다. `CONTACT_EMAIL`은 사이트의 문의처이며 선택 사항입니다. 미설정 시 운영자의 공개 GitHub 프로필로 연결합니다. 비밀 값이나 계정 비밀번호를 넣는 항목은 없습니다.

프로덕션 서버는 기본 `0.0.0.0:4173`을 사용합니다. 호스팅이 제공하는 `PORT`와 필요하면 `HOST`를 설정합니다. TLS 종료와 HTTPS 연결은 호스팅 또는 앞단 프록시에서 구성합니다. 상태 확인 URL은 `/healthz`입니다. 정적 자산은 캐시하고 HTML은 재검증합니다.

Docker를 사용하는 호스팅에는 저장소의 Dockerfile을 사용할 수 있습니다. 컨테이너 기본 포트는 8080입니다. 컨테이너 빌드·실제 호스팅 배포는 아직 검증하지 않았습니다. 지원 플랫폼을 정한 뒤 해당 환경의 빌드·실행·도메인 연결을 확인합니다.

## 언어와 검색 노출

루트 방문은 HTTP `Accept-Language`의 한국어·영어 우선순위로 언어를 정하며, 지원 언어가 없으면 영어입니다. `/ko/`, `/en/`, `/ko/images`, `/en/images`는 언어가 고정된 URL입니다. 소개와 개인정보 안내도 각각 `/ko/about`, `/en/about`, `/ko/privacy`, `/en/privacy`에 있습니다.

언어별 canonical, hreflang, 기본 Open Graph 메타데이터와 `/sitemap.xml`, `/robots.txt`를 제공합니다. `PUBLIC_SITE_URL`이 없거나 개발 모드이면 검색 색인 금지로 응답합니다. 공개 도메인을 정해 프로덕션 모드로 실행해야 색인이 허용됩니다. SSR이 검색 순위나 색인 등록을 보장하지는 않습니다. 도구 상세는 탐색 중 여는 패널이며 별도 상세 URL은 없습니다.

## AdSense 연결

사이트에 광고를 게재해 수익을 받는 제품은 Google AdSense입니다. 계정에서 받은 게시자 ID를 `ADSENSE_CLIENT=ca-pub-...`에 입력하면 프로덕션 카탈로그에 계정 확인 메타 태그가 생기고 `/ads.txt`가 게시됩니다. `ADSENSE_ENABLED=false` 상태에서도 사이트 소유 확인을 진행할 수 있습니다.

[AdSense 사이트 등록과 검토](https://support.google.com/adsense/answer/7584263?hl=en)를 진행하고, 해당 계정에서 자동 광고를 설정합니다. 승인 전에는 코드만 넣어도 광고가 게재되지 않습니다. 공개 도메인과 올바른 게시자 ID가 있을 때 `ADSENSE_ENABLED=true`로 설정하면 카탈로그에 자동 광고 스크립트를 로드합니다. 소개·개인정보·404 페이지에는 광고 스크립트를 넣지 않습니다. 기본값과 개발 모드에서는 광고가 꺼집니다.

EEA·영국·스위스에 광고를 게재할 경우 [Google이 요구하는 인증 CMP](https://support.google.com/adsense/answer/13554020?hl=en)를 계정에서 설정해야 합니다. 동의 관리는 아직 구성하지 않았습니다. 실제 호스팅의 로그 처리, 문의처, 사용 지역과 광고 설정에 맞춰 개인정보 안내를 검토하고 게시합니다. 현재 구현은 광고 연결을 위한 준비이며 계정 심사·동의 설정·광고 송출 확인까지 완료한 상태가 아닙니다.

## 게시 전 확인

```sh
npm test
npm run test:pricing-sources
npm run build
npm run format:check
```

공개 도메인에서 HTML 본문, 언어별 URL, 자산, 404 응답, sitemap, robots, ads.txt를 확인합니다. 브라우저에서는 검색·패널 전환·비교·개인정보 링크를 확인합니다. 검색어와 비교 선택은 브라우저 메모리에만 두고 서버로 전송하지 않습니다.
