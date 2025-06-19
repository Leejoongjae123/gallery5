"use client";
import React, { useEffect, useState } from "react";
import { HiUsers, HiPhotograph, HiClock, HiThumbUp } from "react-icons/hi";
import { GalleryList } from "./components/gallery-list";
import { GalleryDetail } from "./components/gallery-detail";
import { createClient } from "@/utils/supabase/client";
import { addToast, Tabs, Tab, Card, Spinner } from "@heroui/react";

// 통계 카드 컴포넌트
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center">
    <div className={`rounded-full p-3 ${color}`}>{icon}</div>
    <div className="ml-4">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);


// 갤러리 미리보기 컴포넌트
const GalleryPreview = ({ gallery }) => {
  if (!gallery) return null;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">갤러리 미리보기</h2>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3">
            <Image
              src={gallery.thumbnail || "/images/gallery/default.jpg"}
              alt={gallery.name}
              className="w-full h-48 object-cover rounded-lg"
              fallbackSrc="/images/gallery/default.jpg"
            />
          </div>
          <div className="w-full md:w-2/3 space-y-4">
            <h3 className="text-2xl font-bold">
              {gallery.name || "갤러리 이름"}
            </h3>
            <p className="text-gray-700">
              {gallery.description || "갤러리에 대한 설명이 없습니다."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500">주소</h4>
                <p>{gallery.address || "주소 정보가 없습니다."}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500">
                  전화번호
                </h4>
                <p>{gallery.phone || "전화번호 정보가 없습니다."}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500">
                  영업시간
                </h4>
                <p>{gallery.workinghour || "영업시간 정보가 없습니다."}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500">
                  웹사이트
                </h4>
                <p>
                  {gallery.homepage_url ? (
                    <a
                      href={gallery.homepage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {gallery.homepage_url}
                    </a>
                  ) : (
                    "웹사이트 정보가 없습니다."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">갤러리 소개</h4>
          <p className="text-gray-700 whitespace-pre-line">
            {gallery.shop_info || "갤러리 소개 정보가 없습니다."}
          </p>
        </div>

        {gallery.add_info && (
          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-2">추가 정보</h4>
            <p className="text-gray-700 whitespace-pre-line">
              {gallery.add_info}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [galleryData, setGalleryData] = useState(null);
  const [activeTab, setActiveTab] = useState("edit");

  // 기본 갤러리 데이터 서식
  const defaultGallery = {
    title: "",
    name: "",
    url: "",
    address: "",
    phone: "",
    workinghour: "",
    thumbnail: "/images/gallery/default.jpg",
    homepage_url: "",
    shop_info: "",
    add_info: "",
    description: "",
  };

  // 통계 데이터 (예시)
  const stats = [
    {
      title: "총 사용자",
      value: "1,248",
      icon: <HiUsers className="w-6 h-6 text-white" />,
      color: "bg-blue-500",
    },
    {
      title: "총 갤러리 항목",
      value: "342",
      icon: <HiPhotograph className="w-6 h-6 text-white" />,
      color: "bg-green-500",
    },
    {
      title: "이번 달 방문자",
      value: "8,492",
      icon: <HiClock className="w-6 h-6 text-white" />,
      color: "bg-purple-500",
    },
    {
      title: "좋아요 수",
      value: "2,350",
      icon: <HiThumbUp className="w-6 h-6 text-white" />,
      color: "bg-pink-500",
    },
  ];

  // 사용자 정보 및 갤러리 정보 가져오기
  useEffect(() => {
    async function fetchUserAndGallery() {
      try {
        setLoading(true);
        const supabase = createClient();

        // 현재 로그인된 사용자 정보 가져오기
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (user) {
          setUser(user);

          // 사용자 ID로 갤러리 정보 가져오기
          const { data: galleryInfo, error: galleryError } = await supabase
            .from("gallery")
            .select("*")
            .eq("account_id", user.id)
            .single();

          if (galleryError && galleryError.code !== "PGRST116") {
            throw galleryError;
          }

          if (galleryInfo) {
            // 갤러리 정보가 있으면 설정
            setGalleryData({
              id: galleryInfo.id,
              title: galleryInfo.title || "",
              name: galleryInfo.name || "",
              url: galleryInfo.url || "",
              address: galleryInfo.address || "",
              phone: galleryInfo.phone || "",
              workinghour: galleryInfo.workinghour || "",
              thumbnail: galleryInfo.thumbnail || "/images/gallery/default.jpg",
              homepage_url: galleryInfo.homepage_url || "",
              status: galleryInfo.status || "active",
              createdAt: galleryInfo.created_at
                ? new Date(galleryInfo.created_at).toLocaleDateString()
                : new Date().toLocaleDateString(),
              shop_info: galleryInfo.shop_info || "",
              add_info: galleryInfo.add_info || "",
              description: galleryInfo.description || "",
            });
          } else {
            // 갤러리 정보가 없으면 기본값 설정
            setGalleryData(defaultGallery);
          }
        }
      } catch (error) {
        console.log("갤러리 정보를 가져오는 중 오류가 발생했습니다:", error);
        addToast({
          title: "오류",
          description: "갤러리 정보를 가져오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndGallery();
  }, []);

  // 갤러리 정보 업데이트
  const handleUpdateGallery = async (updatedGallery) => {
    try {
      const supabase = createClient();

      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      const galleryDataToUpdate = {
        title: updatedGallery.title,
        name: updatedGallery.name,
        url: updatedGallery.url,
        address: updatedGallery.address,
        phone: updatedGallery.phone,
        workinghour: updatedGallery.workinghour,
        thumbnail: updatedGallery.thumbnail,
        homepage_url: updatedGallery.homepage_url,
        shop_info: updatedGallery.shop_info,
        add_info: updatedGallery.add_info,
        description: updatedGallery.description,
        account_id: user.id,
      };

      let result;

      // 기존 갤러리 레코드가 있으면 업데이트, 없으면 새로 생성
      if (updatedGallery.id) {
        const { data, error } = await supabase
          .from("gallery")
          .update(galleryDataToUpdate)
          .eq("id", updatedGallery.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from("gallery")
          .insert(galleryDataToUpdate)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      if (result) {
        // 업데이트된 갤러리 정보로 상태 업데이트
        setGalleryData({
          ...updatedGallery,
          id: result.id,
          createdAt: result.created_at
            ? new Date(result.created_at).toLocaleDateString()
            : updatedGallery.createdAt,
        });

        toast({
          title: "성공",
          description: "갤러리 정보가 성공적으로 업데이트되었습니다.",
          variant: "success",
        });

        // 저장 후 미리보기 탭으로 이동
        setActiveTab("preview");
      }
    } catch (error) {
      console.error("갤러리 정보 업데이트 중 오류가 발생했습니다:", error);
      toast({
        title: "오류",
        description: "갤러리 정보 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 py-20">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner color="primary" />
          </div>
        ) : (
          <>
            {galleryData && (
              <div className="p-6">
                <GalleryDetail
                  gallery={galleryData}
                  onUpdate={handleUpdateGallery}
                  onDelete={() => {}}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
