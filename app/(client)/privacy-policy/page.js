"use client";
import React from "react";

const privacyPolicy = `
  <h3>■ 제1조 (개인정보 수집 항목 및 수집 방법)</h3>
  <p>회사는 카카오 로그인을 통해 회원가입 시 다음과 같은 개인정보를 수집합니다.</p>
  <ul>
    <li><b>필수 항목:</b> 전화번호 (카카오 계정 기반)</li>
    <li><b>선택 항목:</b> 이름, 성별, 출생연도</li>
  </ul>
  <p>※ 위 항목은 카카오 로그인 시 이용자의 동의를 통해 회원가입 시점에 수집되며,<br />서비스 제공 및 본인 확인, 주요 안내 메시지 발송 등을 위해 사용됩니다.</p>
  <p>또한, 서비스 이용 중에는 아래와 같은 정보가 자발적으로 추가 수집될 수 있습니다:</p>
  <ul>
    <li>관심 전시 분야, 구매 이력, 사용자 리뷰, 문의 응답 등</li>
  </ul>
  <p>개인정보는 아래 방법으로 수집됩니다:</p>
  <ul>
    <li>카카오 로그인 연동 시 자동 수집</li>
    <li>서비스 이용 중 사용자의 자발적 입력</li>
  </ul>
  <h3>■ 제2조 (개인정보 수집 및 이용 목적)</h3>
  <p>회사는 수집한 개인정보를 다음 목적을 위해 활용합니다.</p>
  <ul>
    <li>회원 가입 및 본인 확인</li>
    <li>전시 티켓 예매, 예약 확인 등 서비스 제공</li>
    <li>카카오 알림톡 또는 문자 등을 통한 필수 안내 메시지 발송</li>
    <li>서비스 품질 향상 및 고객 응대</li>
    <li>관련 법령에 따른 기록 보존</li>
  </ul>
  <h3>■ 제3조 (개인정보 제3자 제공)</h3>
  <p>회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.<br />단, 다음의 경우는 예외로 합니다.</p>
  <ul>
    <li>이용자가 사전에 명시적으로 동의한 경우</li>
    <li>관계 법령에 따라 제출 의무가 있는 경우</li>
  </ul>
  <h3>■ 제4조 (개인정보 보유 및 이용기간)</h3>
  <p>회사는 수집한 개인정보를 목적 달성 후 즉시 파기하며,<br />관련 법령에 따라 아래와 같이 일정 기간 보관할 수 있습니다:</p>
  <table border="1" cellpadding="4" style="border-collapse:collapse; margin:10px 0;">
    <thead><tr><th>보존 항목</th><th>보유 기간</th><th>관련 법령</th></tr></thead>
    <tbody>
      <tr><td>계약 및 청약철회 기록</td><td>5년</td><td>전자상거래법</td></tr>
      <tr><td>결제 및 재화 공급 기록</td><td>5년</td><td>전자상거래법</td></tr>
      <tr><td>소비자 불만 및 분쟁처리 기록</td><td>3년</td><td>전자상거래법</td></tr>
    </tbody>
  </table>
  <h3>■ 제5조 (개인정보 처리 위탁)</h3>
  <p>회사는 원활한 서비스 운영을 위해 아래와 같이 개인정보 처리를 위탁할 수 있습니다.</p>
  <table border="1" cellpadding="4" style="border-collapse:collapse; margin:10px 0;">
    <thead><tr><th>수탁자</th><th>위탁 업무 내용</th></tr></thead>
    <tbody>
      <tr><td>카카오(주)</td><td>로그인 및 메시지 발송 API 연동</td></tr>
      <tr><td>Supabase Inc.</td><td>사용자 데이터베이스 저장 및 인증 처리</td></tr>
      <tr><td>Amazon Web Services</td><td>클라우드 인프라 및 데이터 백업 운영</td></tr>
    </tbody>
  </table>
  <p>※ 회사는 위탁 시 관련 법령에 따라 개인정보 보호를 위한 계약을 체결하고 관리·감독을 수행합니다.</p>
  <h3>■ 제6조 (이용자의 권리와 행사 방법)</h3>
  <p>이용자는 언제든지 본인의 개인정보에 대해 열람, 정정, 삭제를 요청할 수 있으며,<br />회원 탈퇴를 통해 수집 및 이용 동의를 철회할 수 있습니다.</p>
  <ul>
    <li>연락처: support@artandbridge.com</li>
    <li>고객센터 또는 마이페이지를 통해 요청 가능</li>
  </ul>
  <h3>■ 제7조 (개인정보 자동 수집 장치의 설치 및 거부)</h3>
  <p>회사는 이용자 맞춤형 서비스 제공을 위해 쿠키를 사용할 수 있습니다.<br />이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다.</p>
  <h3>■ 제8조 (개인정보 보호책임자)</h3>
  <ul>
    <li>성명: 김주홍</li>
    <li>이메일: support@artandbridge.com</li>
    <li>담당 업무: 개인정보 보호 및 관련 민원 응대</li>
  </ul>
  <h3>■ 부칙</h3>
  <p>이 개인정보처리방침은 2025년 6월 13일부터 시행됩니다.</p>
`;

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 min-h-screen pb-24">
      <h1 className="text-2xl font-bold mb-6 text-center">개인정보 처리방침</h1>
      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: privacyPolicy }} />
    </div>
  );
} 