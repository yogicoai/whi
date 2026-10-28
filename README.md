# 위스키 렌즈 — 섞어 마시는 위스키

보틀 렌즈(`../wine`)에서 위스키만 떼어 새로 만든 앱이다(2026-10-27).
하이볼·잭콕처럼 위스키를 무엇과, 어떤 비율로 섞을지가 중심이다.

## 실행

```
npm install
npm run dev        # http://localhost:5710
```

위스키 정보는 `data/whiskies.json` 을 읽는다. 회원 · 이용 기록 · 어드민 설정은 MongoDB(`whiskylens`)에 둔다 — `.env.local` 이 필요하다:

```
MONGODB_URI=…            # 보틀 렌즈와 같은 Atlas 클러스터(무료 등급)
MONGODB_DB=whiskylens     # 위스키 렌즈 전용 데이터베이스 — 보틀 렌즈 운영 데이터와 따로
ADMIN_ID=…                # 어드민(/admin) 마스터 아이디
ADMIN_PASSWORD=…          # 어드민 비밀번호
ADMIN_SECRET=…            # 어드민 로그인 쿠키 서명 키(긴 무작위 문자열)
NEXT_PUBLIC_SITE_URL=…    # 배포 주소(카톡 미리보기 카드용, 배포할 때만)
```

DB 가 없거나 안 되면 손님 화면은 기본값(코드에 적힌 레시피·추천)으로 돌고, 가입·어드민만 안 된다.

## 어드민

`/admin` — 마스터 아이디와 비밀번호로 들어온다. 대시보드(회원 수·이용 기록·최근 14일·인기 레시피와 제품) · 회원(찾기·자세히·이용 정지·탈퇴 처리) ·
레시피·추천(노출·순서·한 줄 설명·팁, 실제 제품 추천 고정·빼기) · 공지·배너(홈 인사말 아래, 기간·켜고 끄기) · 사업자 정보·약관(푸터 칸 · 이용약관 · 개인정보처리방침 · 청소년보호정책 판 게시). 바꾸면 손님 화면이 바로 바뀐다.

## 데이터 다시 뽑기

```
npm run export:whiskies    # = node scripts/export-whiskies.mjs <wine 저장소>/.env.local
```

wine 저장소 DB 에서 위스키만 **읽어** `data/whiskies.json` 을 다시 쓴다. 원본에는 아무것도 쓰지 않는다.
이야기·검증·판매처 짝 맞추기는 당분간 wine 저장소에서 하고, 그 결과를 이 명령으로 가져온다.
같은 판매처 상품에 붙은 중복 문서는 하나로 합치고 다른 이름은 별칭(`aliases`)으로 남긴다.

## 음료 사진 다시 만들기

```
npm run photos     # docs/design 의 2K 원본 → public/drinks · public/steps 의 화면용 JPG, public/drinks3d 의 WebP 두 벌
```

원본은 힉스필드로 만든 것이다(`docs/design/drinks/` 완성 사진, `docs/design/steps-<레시피>/` 단계 사진, `docs/design/drinks3d/` 3D 그림).
화면에는 실사 사진 WebP 를 쓴다(리퀴드 글래스) — 카드 `<키>-card.webp`(480px), 첫 화면 `<키>-hero.webp`(900px) · `-hero-l.webp`(1536px, PC).
3D 그림(`public/drinks3d/`, 카드용 `-s.webp` 360px · 상세용 600px)은 예전 디자인 B 의 것으로, 지금 화면에서는 쓰지 않는다.
만드는 과정 영상 클립은 `public/clips/<키>/<단계>.mp4`(힉스필드 이미지→영상을 ffmpeg 로 다시 누른 것).
사진·클립을 더하면 `lib/photos.js` 의 목록도 고친다.

## 구조

| 자리 | 하는 일 |
|---|---|
| `app/` | 화면 — 홈 · 레시피 · 레시피 상세 · 위스키 상세 · 내 바 · 내 레시피 · 찍기 · 찾기 |
| `lib/mixes.js` | 레시피 규칙(믹서·맛 더하기·레시피·위스키별 추천·양 계산). **wine 저장소와 같은 파일**이다 |
| `lib/cocktails.js` | 칵테일·핫 토디 규칙(재료·맛 조절·위스키별 추천·양과 완성 도수). 이 앱에만 있다 |
| `lib/look.js` | 화면에만 쓰는 것 — 레시피 색·분위기, 가격대 이름 |
| `lib/whiskies.js` | 위스키 데이터 읽기·찾기 (서버) — 둘러보기(종류 KINDS · 가격대 · 처음이라면 · 정렬), 오늘의 위스키 |
| `app/whiskies` · `components/WhiskyCard.js` | 위스키 탭 — 1,142종 둘러보기(위스키가 주, 섞어 마시기는 부 — 2026-10-27 저녁) |
| `lib/bar.js` | 가진 재료·위스키로 만들 수 있는 레시피 고르기 |
| `lib/saved.js` | 내 레시피·내 바를 기기(브라우저)에 저장 — 회원 기능이 붙으면 여기만 바꾼다 |
| `lib/photos.js` | 음료 사진 주소 — `drinkPhoto`(카드 · 첫 화면 실사 WebP), 공유 카드용 잘라 낸 사진, 만드는 과정 단계 사진 |
| `lib/picks.js` | 실제 제품으로 만드는 레시피 — 인기 위스키마다 잘 맞는 레시피를 규칙으로 짝지음(홈 줄 · /picks) |
| `lib/golden.js` · `data/golden.json` | 황금레시피 — 잭콕 · 가쿠 하이볼처럼 이름 붙은 조합과 비율(네이버 블로그·카페, 2026-10-27). 홈 줄 · /golden · 상세 |
| `lib/greeting.js` | 홈 인사말 — 서버가 한국 시각으로 미리 그린다(화면이 뜬 뒤 제목이 바뀌면 느리게 잡힌다) |
| `app/fonts/pretendard/` | Pretendard 글꼴(동적 서브셋 92조각, OFL) — 외부 CDN 대신 앱이 내보낸다 |
| `lib/member.js` | 회원(브라우저 쪽) — 가입·회원정보 API 호출과 기기 사본. 칸 정의는 `docs/member-data.md` |
| `lib/track.js` | 이용 기록 보내기(저장·보내기·만들어 봄) |
| `lib/server/` | 서버 전용 — `db`(MongoDB) · `members`(회원) · `activity`(이용 기록·대시보드) · `settings`(레시피·추천 설정, 배너) · `admin`(어드민 로그인) |
| `app/api/members` · `app/api/activity` | 가입·내 회원정보(열쇠로) · 이용 기록 받기 |
| `lib/legal.js` · `lib/legal-drafts.js` · `lib/server/legal.js` | 사업자 정보 칸 · 약관 판(보이스 동화 구조) — 검사 · 본문 나누기 · 지금 판 고르기, 준비된 초안, DB 읽기 · 쓰기 |
| `app/terms` · `app/privacy` · `app/youth` · `components/SiteFooter.js` | 약관 화면과 화면 맨 아래 사업자 정보 줄 — 어드민 '사업자 정보·약관'에서 게시 · 저장한 것 |
| `app/api/admin/*` · `app/admin/*` · `components/admin/*` | 어드민 API(쿠키로 막음) · 어드민 화면 |
| `components/Brand.js` | 앱 이름 로고 — 마크(위스키가 반쯤 담긴 렌즈) + "Whisky Lens" 글자. 홈 위 · PC 위쪽 메뉴 · 어드민 |
| `components/AccountDrawer.js` | 내 정보 서랍 — 오른쪽에서 나오는 회원 · 활동 · 계정 창(보틀 렌즈 구성). 어디서든 `openAccount()` 로 연다 |
| `app/login` · `app/signup` · `app/account` | 시작하기 · 가입 3단계(동의 → 나이 확인 → 프로필) · 회원정보 |
| `lib/share.js` | 공유 주소 — 레시피·이름·메모·보낸 사람을 주소 하나에 담고 읽기 |
| `app/api/card` | 레시피 카드 이미지 — 카톡 미리보기(1200×630)와 인스타 스토리(1080×1920) |
| `components/Glass.js` | 하이볼 잔 그림 — 사진이 없는 레시피의 만드는 과정·카드에 |
| `components/CocktailGlass.js` | 칵테일 잔(온더록 잔·머그) 그림 — 셰이커 흔들기, 김 |
| `components/DrinkGlass.js` | 사진이 없을 때 카드·내 레시피에 쓰는 완성된 잔 그림 |
| `components/MixStudio.js` · `CocktailStudio.js` | 레시피 상세의 몸통(고르기·양·순서·저장·보내기) — 하이볼류 / 칵테일 |
| `components/StepPlayer.js` | 만드는 과정 — 폰은 전체 화면, PC·태블릿은 가운데 창. 스토리형(사진 확대·영상 클립·진행 막대·자막, 탭으로 넘기기·꾹 눌러 멈춤) |
| `components/ShareSheet.js` | 레시피 보내기 — 이름·메모·보낸 사람, 링크 보내기·카드 이미지 |

## 알아 둘 것

- wine 저장소는 Dropbox 팀 폴더(`…\04_개발\앱개발\wine`)에 있다. 데이터 뽑기 명령이 그 `.env.local` 을 읽는다.
- `next.config.mjs` 의 `turbopack.root` 는 지우지 않는다. 홈 폴더(`C:\Users\Yogibo Design`)에 package-lock.json 이 있어서, 비워 두면 Next 가 기준 폴더를 홈으로 잘못 잡는다.
- 카톡 미리보기 카드는 배포한 뒤에야 보인다(카톡이 localhost 를 열 수 없다). 배포 주소는 `NEXT_PUBLIC_SITE_URL` 로 준다.
- 화면 글꼴은 앱 안(`app/fonts/pretendard`)에서 내보내지만, 카드 이미지(/api/card) 글꼴은 jsDelivr 에서 받는다 — 서버가 인터넷에 닿아야 한다.
- 화면 폭: 폰 → 태블릿(720px~) → PC(1080px~, 위쪽 메뉴 · 상세 두 칸). 규칙은 `app/globals.css` 맨 아래 "넓은 화면".
- 아직 없는 것: 라벨 촬영(찍기 탭은 이름 찾기로 대신), 실제 소셜 로그인·본인인증(지금은 시연용 가입), 공유 2단계, 배포, 하이볼 말고 다른 레시피의 단계 사진·영상(지금은 하이볼 사진을 같이 쓴다).
#   w h i  
 