"use client";
import React, { useState, useEffect, Suspense } from "react";
import { Button, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/userStore";

// SearchParams를 사용하는 컴포넌트를 별도로 분리
function MyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("redirect_to") || "/mypage/success";
  console.log("MyPage - redirect_to 파라미터:", returnUrl);
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [policyTitle, setPolicyTitle] = useState("");
  const [policyContent, setPolicyContent] = useState("");
  const [showPolicy, setShowPolicy] = useState(false);
  // 개인정보 처리방침 내용 예시 (실제 내용으로 교체)
  const privacyPolicy = `
    <h3>■ 제1조 (개인정보 수집 항목 및 수집 방법)</h3>
    <p>회사는 회원가입, 서비스 이용, 고객문의 응대 등을 위해 다음과 같은 개인정보를 수집합니다.</p>
    <ul>
      <li>필수항목: 이메일 주소, 카카오 계정 식별자(UID), 닉네임, 프로필 이미지</li>
      <li>추가 수집 항목(카카오 로그인 연동 시): 이름, 성별, 연령대, 출생연도, 카카오계정 전화번호</li>
      <li>선택항목: 생년월일, 휴대폰 번호, 전시/작품 관련 관심사</li>
    </ul>
    <p>개인정보는 다음과 같은 방법으로 수집됩니다.</p>
    <ul>
      <li>홈페이지 회원가입 및 카카오 로그인 연동 시 자동 수집</li>
      <li>서비스 이용 중 이용자의 자발적 입력을 통해 수집</li>
    </ul>
    <h3>■ 제2조 (개인정보 수집 및 이용 목적)</h3>
    <p>회사는 수집한 개인정보를 다음 목적을 위해 활용합니다.</p>
    <ul>
      <li>회원 관리: 회원가입 의사 확인, 본인 확인, 부정이용 방지 등</li>
      <li>맞춤형 콘텐츠 및 서비스 제공: 이용자의 성별, 연령대, 출생연도 등의 정보를 활용하여 관심 기반 전시 추천 및 메시지 발송</li>
      <li>관람한 전시 이력 기반 전시/작품 추천 및 알림 발송</li>
      <li>구매한 티켓 및 작품 관련 알림 서비스 제공</li>
      <li>카카오 API를 활용한 친구 목록 조회 및 메시지 발송 (이용자 동의 하에)</li>
      <li>신규 홍보 메시지 및 이벤트 알림: 이용자 동의 시, 카카오톡 메시지를 통해 신규 전시 소식, 할인, 이벤트 등 정보 제공</li>
      <li>연령, 성별, 지역 기반 타겟팅 메시지 발송에 활용</li>
    </ul>
    <h3>■ 제3조 (개인정보 제3자 제공)</h3>
    <p>회사는 원칙적으로 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
    <ul>
      <li>이용자가 사전에 동의한 경우</li>
      <li>법령에 특별한 규정이 있는 경우</li>
    </ul>
    <h3>■ 제4조 (개인정보 보유 및 이용기간)</h3>
    <p>회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
    <p>단, 관련 법령에 따라 일정 기간 보관이 필요한 경우는 아래와 같습니다.</p>
    <ul>
      <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
      <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
      <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
    </ul>
    <h3>■ 제5조 (개인정보 처리 위탁)</h3>
    <p>회사는 원활한 서비스 제공을 위해 개인정보 처리를 외부에 위탁할 수 있으며, 위탁 시 관련 법령에 따라 계약을 체결하고 개인정보가 안전하게 관리되도록 조치합니다.</p>
    <ul>
      <li>위탁업체: 카카오(주), Supabase Inc., Amazon Web Services 등</li>
      <li>위탁업무: 카카오 로그인 및 메시지 API 연동, 데이터베이스 운영, 클라우드 인프라 제공 등</li>
    </ul>
    <h3>■ 제6조 (이용자 및 법정대리인의 권리와 행사 방법)</h3>
    <p>이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 가입 해지를 요청할 수 있습니다.</p>
    <p>권리 행사는 개인정보 보호책임자를 통해 서면, 이메일, 고객센터 등을 통해 가능합니다.</p>
    <h3>■ 제7조 (개인정보 자동 수집 장치의 설치·운영 및 거부)</h3>
    <p>회사는 서비스 개선을 위해 쿠키를 사용할 수 있으며, 이용자는 이를 거부할 수 있습니다. 쿠키 설정 변경은 브라우저 설정을 통해 가능합니다.</p>
    <h3>■ 제8조 (개인정보 보호책임자)</h3>
    <ul>
      <li>성명: 김주홍</li>
      <li>이메일: support@artandbridge.com</li>
      <li>담당 업무: 개인정보 보호 및 민원 처리</li>
    </ul>
    <h3>■ 부칙</h3>
    <p>이 개인정보 처리방침은 2025년 6월 13일부터 시행됩니다.</p>
  `;

  // 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // 세션이 있으면 profiles 테이블에서 사용자 정보 확인
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.log("프로필 조회 중 오류:", profileError);
            return;
          }

          // role이 'client'인 경우에만 로그인 성공으로 처리
          if (profile && profile.role === 'client') {
            console.log("클라이언트 권한 확인됨, 리다이렉트 경로:", returnUrl);
            window.location.href = returnUrl;
          } else {
            console.log("클라이언트 권한이 아님, 로그인 화면 유지");
          }
        }
      } catch (error) {
        console.log("로그인 상태 확인 중 오류 발생:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, [router, returnUrl]);

  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const redirectUrl = `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(returnUrl)}`;
      console.log("카카오 로그인 리다이렉션 URL:", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("카카오 로그인 오류:", error);
        throw error;
      }
    } catch (error) {
      console.error("로그인 처리 중 오류가 발생했습니다:", error);
      alert("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 카카오 로그인 버튼 클릭 시 최초 1회만 개인정보 처리방침 동의 팝업
  const handleKakaoLoginButton = () => {
    if (typeof window !== "undefined" && !localStorage.getItem("policyAgreed")) {
      setShowPolicy(true);
    } else {
      handleKakaoLogin();
    }
  };

  // 개인정보 처리방침 팝업에서 확인 버튼 클릭 시
  const handlePolicyConfirm = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("policyAgreed", "true");
    }
    setShowPolicy(false);
    handleKakaoLogin();
  };

  return (
    <div className="w-full flex justify-center items-centerh-full">
      <div className="w-full flex flex-col justify-center items-center h-[90vh] px-4">
        <div className=" text-[24px] font-bold text-[#121212] text-start w-full">
          새로운 미술플랫폼👋
        </div>
        <div className=" text-[16px] text-[#A6A6A6] text-start w-full">
          대한민국 전시회,갤러리 정보
        </div>
        <div className="text-[16px]  text-[#A6A6A6] w-full text-start mb-4">
          아티스트 작품 직거래
        </div>
        <Button
          className="w-full flex rounded-none items-center justify-center gap-2 bg-[#FEE500] text-black font-medium py-2 hover:bg-[#F6D33F] transition-colors"
          onPress={handleKakaoLoginButton}
          isDisabled={loading}
        >
          {loading ? (
            <Spinner variant="wave" color="primary" />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 256 256"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M128 36C70.562 36 24 72.713 24 118.304C24 147.994 43.725 174.08 73.213 187.175C71.774 192.02 66.31 211.071 65.297 215.368C64.073 220.56 68.962 225.116 73.741 222.051C77.62 219.571 100.709 204.886 108.271 200.026C114.661 201.334 121.28 202 128 202C185.438 202 232 165.287 232 118.304C232 72.713 185.438 36 128 36Z"
                fill="black"
              />
            </svg>
          )}
          {loading ? "로그인 중..." : "카카오톡 로그인"}
        </Button>

        {/* 가로선과 or 텍스트 추가 */}
        <div className="w-full flex items-center justify-center my-4">
          <div className="flex-grow h-px bg-gray-300"></div>
          <div className="px-4 text-sm text-gray-500">or with </div>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>
        {/* 개인정보 처리방침 버튼 */}
        <span
          className="text-xs text-gray-500 underline cursor-pointer text-center mt-2"
          onClick={() => {
            setPolicyTitle("개인정보 처리방침");
            setPolicyContent(privacyPolicy);
            onOpen();
          }}
        >
          개인정보 처리방침
        </span>
        <img
          className="w-[50px] h-[50px]"
          src="/login/loginlogo.png"
          alt="google"
        />
        {/* 개인정보 처리방침 모달 */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">{policyTitle}</ModalHeader>
                <ModalBody className="max-h-[80vh] overflow-y-auto">
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: policyContent }}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="primary" onPress={onClose}>
                    확인
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
        {/* 개인정보 처리방침 최초 1회 동의용 팝업 */}
        <Modal isOpen={showPolicy} onOpenChange={setShowPolicy} size="xs">
          <ModalContent className="max-w-xs">
            <ModalHeader className="text-xs">개인정보 처리방침</ModalHeader>
            <ModalBody className="max-h-[40vh] overflow-y-auto text-xs">
              <div dangerouslySetInnerHTML={{ __html: privacyPolicy }} />
            </ModalBody>
            <ModalFooter>
              <Button color="primary" size="sm" onPress={handlePolicyConfirm}>확인</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}

// fallback UI가 표시될 로딩 컴포넌트
function LoadingComponent() {
  return (
    <div className="w-full flex justify-center items-center h-[90vh]">
      <Spinner variant="wave" color="primary" />
    </div>
  );
}

// SearchParams를 사용하는 부분을 별도 컴포넌트로 추출
function MyPageWithSearchParams() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <MyPageContent />
    </Suspense>
  );
}

// 메인 컴포넌트
export default function mypage() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/mypage/success");
    } else {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUser(user);
          router.replace("/mypage/success");
        }
        // 없으면 로그인 화면 유지
      });
    }
  }, [user, setUser, router]);

  if (user) return null;

  return <MyPageWithSearchParams />;
}
