"use client";
import React, { useState } from "react";

const REST_API_KEY = "3117cb5cd8c4f53904c294f3d31e4e74";
const REDIRECT_URI = "http://localhost:3000/kakao-test"; // 실제 배포시 도메인에 맞게 수정

export default function KakaoTestPage() {
  const [accessToken, setAccessToken] = useState("");
  const [result, setResult] = useState("");

  // 1. 카카오 로그인(동의 포함)
  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=talk_message`;
    window.location.href = kakaoAuthUrl;
  };

  // 2. access_token 추출 (리다이렉트 후)
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.replace("#", "?"));
      const token = params.get("access_token");
      if (token) setAccessToken(token);
    }
  }, []);

  // 3. 메시지 전송
  const handleSendMessage = async () => {
    if (!accessToken) {
      setResult("access_token이 없습니다. 먼저 카카오 로그인을 해주세요.");
      return;
    }
    const res = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      body: new URLSearchParams({
        template_object: JSON.stringify({
          object_type: "text",
          text: "테스트 메시지입니다.",
          link: {
            web_url: "https://www.naver.com",
            mobile_web_url: "https://www.naver.com"
          }
        })
      })
    });
    if (res.ok) {
      setResult("카카오톡 메시지 전송 성공!");
    } else {
      const err = await res.json().catch(() => ({}));
      setResult("카카오톡 메시지 전송 실패: " + JSON.stringify(err));
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 20, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>카카오톡 나에게 메시지 보내기 테스트</h2>
      <button onClick={handleKakaoLogin} style={{ margin: "10px 0", padding: "10px 20px", background: "#FEE500", border: "none", borderRadius: 4 }}>
        1. 카카오 로그인 및 동의
      </button>
      <div>
        <input
          type="text"
          value={accessToken}
          onChange={e => setAccessToken(e.target.value)}
          placeholder="access_token"
          style={{ width: "100%", margin: "10px 0" }}
        />
      </div>
      <button onClick={handleSendMessage} style={{ padding: "10px 20px", background: "#03c75a", color: "#fff", border: "none", borderRadius: 4 }}>
        2. 나에게 메시지 보내기
      </button>
      <div style={{ marginTop: 20, color: "#333" }}>{result}</div>
    </div>
  );
} 