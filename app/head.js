export default function Head() {
  return (
    <>
      <title>미술예술랭</title>
      {/* iPhone Safari 포함 모든 모바일에서 화면 폭에 맞춰 줍니다 */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      <meta name="naver-site-verification" content="bad7ac6c90f1c11f1dfa8f9ef1d8bb44d3fc597c" />

      {/* 아이콘 관련 메타태그 추가 */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      {/* <link rel="manifest" href="/site.webmanifest" /> */}

      {/* Open Graph & Twitter 메타태그 */}
      <meta property="og:title" content="미술예술랭" />
      <meta property="og:site_name" content="미술예술랭" />
      <meta name="twitter:title" content="미술예술랭" />
    </>
  );
} 