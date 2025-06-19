"use client";
import React, { useEffect, useState } from "react";
import { ExhibitionCards } from "./components/BookmarkedExhibition";
import {
  Tabs,
  Tab,
  Button,
  Select,
  SelectItem,
  Divider,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { FaChevronLeft, FaFileContract } from "react-icons/fa";
import { BiSupport } from "react-icons/bi";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import BookmarkedExhibition from "./components/BookmarkedExhibition";
import Reviews from "./components/Reviews";
import GalleryCards from "./components/gallery-cards";
import { FaArrowLeft } from "react-icons/fa";
import { FaChevronRight } from "react-icons/fa";
import MyArtworks from "./components/MyArtworks";
import { FaCheckCircle } from "react-icons/fa";

const Success = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState(null);
  const [customerService, setCustomerService] = useState(null);
  const [title, setTitle] = useState(null);
  const [content, setContent] = useState(null);
  const [selectedModal, setSelectedModal] = useState(null);
  const [selectedTab, setSelectedTab] = useState("favorite");
  const [selectedGalleryTab, setSelectedGalleryTab] = useState("recommended");
  const [isArtist, setIsArtist] = useState(false);
  const [profile, setProfile] = useState(null);
  const getPolicy = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("policy").select("*");
    if (error) {
      console.error("정책 정보를 가져오는 중 오류가 발생했습니다:", error);
    }

    if (data && data.length > 0) {
      const policyData = data.find((item) => item.title === "이용약관");
      const csData = data.find((item) => item.title === "고객센터");

      setPolicy(policyData);
      setCustomerService(csData);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error(
            "사용자 정보를 가져오는 중 오류가 발생했습니다:",
            error
          );
          router.push("/mypage");
          return;
        }

        if (user) {
          setUser(user);
          console.log("user:", user);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .eq('isArtistApproval', true)
            .single();  
          if (profileData) {
            setIsArtist(profileData.isArtist);
            setProfile(profileData);
          }

        } else {
          // 로그인되지 않은 경우 로그인 페이지로 리디렉션
          router.push("/mypage");
        }
      } catch (error) {
        console.error("사용자 정보를 가져오는 중 오류가 발생했습니다:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    if (selectedModal === "policy") {
      setTitle(policy?.title);
      setContent(policy?.content);
    }
    if (selectedModal === "customerService") {
      setTitle(customerService?.title);
      setContent(customerService?.content);
    }
  }, [selectedModal, policy, customerService]);

  useEffect(() => {
    getPolicy();
  }, []);
  console.log("policy", policy);
  console.log("customerService", customerService);
  console.log("isArtist", isArtist);

  const handleLogout = async () => {
    try {
      // 카카오 로그아웃 확인
      if (window.Kakao && window.Kakao.Auth.getAccessToken()) {
        // 카카오 초기화 확인
        if (!window.Kakao.isInitialized()) {
          // 카카오 초기화 (KAKAO_APP_KEY는 환경 변수나 설정으로 관리해야 합니다)
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
        }

        // 카카오 로그아웃
        window.Kakao.Auth.logout(() => {
          console.log("카카오 로그아웃 완료");
        });
      }

      // Supabase 로그아웃
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("로그아웃 중 오류가 발생했습니다:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Spinner variant="wave" color="primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center ">
      <div className="bg-white flex items-center w-[90%] justify-between">
        <Button
          isIconOnly
          variant="light"
          className="mr-2"
          onPress={() => router.push("/")}
        >
          <FaArrowLeft className="text-xl" />
        </Button>
        <h2 className="text-lg font-bold text-center flex-grow">마이페이지</h2>
        <div className="w-10"></div>
      </div>
      <div className="w-full h-auto flex justify-center items-center my-6 flex-col gap-y-4">
        <div className="w-24 h-24 flex justify-center items-center bg-black rounded-full">
          {user?.user_metadata?.avatar_url && (
            <Image
              src={user.user_metadata.avatar_url}
              width={96}
              height={96}
              alt="프로필 이미지"
              className="rounded-full"
            />
          )}
        </div>
        <div className="text-lg font-bold flex flex-col justify-center items-center">
          <div className="flex flex-row items-center gap-x-2 text-[#0B437E]">
            {user?.user_metadata?.full_name || user?.email || "사용자"}
            
          </div>
          <div className="flex flex-row items-center text-sm justify-center gap-x-1">
            <div
              className="cursor-pointer"
              onClick={() => router.push("/register")}
            >
              {isArtist ? "작가 정보 수정하기" : "작가 등록하기"}
            </div>
            {!isArtist && (
              <div className="flex flex-row items-center gap-x-2">
                <FaChevronRight className="text-sm"  />
              </div>
            )}
            {isArtist && (
              <div className="flex flex-row items-center gap-x-2">
                <FaCheckCircle className="text-green-500 text-sm"  />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 첫 번째 커스텀 탭바 */}
      <div className="flex flex-row w-[90%] border-t border-gray-200 mb-2 justify-center items-center">
        <div className="w-[5%]"></div>
        <div className="flex w-full">
          <button
            className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "favorite" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
            onClick={() => setSelectedTab("favorite")}
          >
            즐겨찾기
          </button>
          <button
            className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "review" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
            onClick={() => setSelectedTab("review")}
          >
            리뷰
          </button>
          <button
            className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "message" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
            onClick={() => setSelectedTab("message")}
          >
            메시지
          </button>
          <button
            className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "order" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
            onClick={() => setSelectedTab("order")}
          >
            주문내역
          </button>
          <button
            className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "myArt" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
            onClick={() => setSelectedTab("myArt")}
          >
            나의 작품
          </button>
        </div>
        <div className="w-[5%]"></div>
      </div>

      <div className="w-full px-2 flex justify-center items-center">
        {selectedTab === "favorite" && <BookmarkedExhibition user={user} />}
        {selectedTab === "review" && <Reviews user={user} />}
        {selectedTab === "message" && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-gray-500">메시지 기능이 준비 중입니다.</p>
          </div>
        )}
        {selectedTab === "order" && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-gray-500">주문내역이 없습니다.</p>
          </div>
        )}
        {selectedTab === "myArt" && <MyArtworks user={user} profile={profile} />}
      </div>

      {/* 두 번째 커스텀 탭바 */}
      <div className="flex w-[90%] border-t border-gray-200 mb-2 mt-4 justify-center items-center">
        <div className="w-[10%]"></div>
        <div className="flex w-2/3">
          <button
            className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedGalleryTab === "recommended" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
            onClick={() => setSelectedGalleryTab("recommended")}
          >
            추천갤러리
          </button>
          <button
            className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedGalleryTab === "new" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
            onClick={() => setSelectedGalleryTab("new")}
          >
            신규갤러리
          </button>
          <button
            className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedGalleryTab === "now" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
            onClick={() => setSelectedGalleryTab("now")}
          >
            전시갤러리
          </button>
        </div>
        <div className="w-[10%]"></div>
      </div>

      <div className="w-full px-2">
        <GalleryCards selectedTab={selectedGalleryTab} />
      </div>

      <div className="w-full h-auto flex justify-center items-center flex-col gap-y-4 mb-24 px-4">
        <div
          onClick={() => {
            setSelectedModal("policy");
            onOpen();
          }}
          className="flex items-center gap-x-2 w-full cursor-pointer"
        >
          <FaFileContract className="text-gray-600" size={20} />
          <span>이용약관 및 정책</span>
        </div>
        <Divider></Divider>
        <div
          className="flex items-center gap-x-2 w-full cursor-pointer"
          onClick={() => {
            router.push("http://pf.kakao.com/_sBnXn/chat");
          }}
        >
          <BiSupport className="text-gray-600" size={20} />
          <span>고객센터</span>
        </div>
        <Divider></Divider>
        <div
          className="flex items-center gap-x-2 w-full cursor-pointer"
          onClick={handleLogout}
        >
          <FiLogOut className="text-gray-600" size={20} />
          <span>로그아웃</span>
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
              <ModalBody className="max-h-[80vh] overflow-y-auto">
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: content }}
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
    </div>
  );
};

export default Success;
