"use client";
import React from "react";
import { Button, Skeleton, Input, Textarea, DatePicker, Spinner, useToast } from "@heroui/react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Card, CardBody, Divider, Image, CardFooter } from "@heroui/react";
import { FaPlusCircle } from "react-icons/fa";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { parseDate } from "@internationalized/date";
import { CiImageOn } from "react-icons/ci";
import { addToast } from "@heroui/react";

export default function MagazineList() {
  const [magazines, setMagazines] = useState([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [allLoaded, setAllLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState("/noimage.jpg");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [artistName, setArtistName] = useState("");
  const [artistPhone, setArtistPhone] = useState("");
  const [artistIntro, setArtistIntro] = useState("");
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [artistProof, setArtistProof] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const [topCards, setTopCards] = useState([]);
  const [visibleTopCards, setVisibleTopCards] = useState([]);

  const genres = [
    { id: 1, name: "현대미술" },
    { id: 2, name: "명화/동양화" },
    { id: 3, name: "추상화" },
    { id: 4, name: "사진/일러스트" },
    { id: 5, name: "기타" }
  ];

  // 사용자 정보 및 작가 정보 가져오기
  const getUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // 현재 로그인된 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('로그인된 사용자가 없습니다.');
        setIsLoading(false);
        return;
      }

      // profiles 테이블에서 사용자 정보 검색
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .eq('isArtistApproval', true)
        .single();

      if (profileError) {
        console.log('프로필 정보를 가져오는 중 오류 발생:', profileError);
        setIsLoading(false);
        return;
      }

      // 작가 정보가 있으면 폼에 미리 채우기
      if (profileData && profileData.isArtist) {
        setIsEdit(true);
        setArtistName(profileData.artist_name || "");
        setArtistPhone(profileData.artist_phone || "");
        setArtistIntro(profileData.artist_intro || "");
        setBirthDate(profileData.artist_birth || "1990-01-01");
        setArtistProof(profileData.artist_proof || "");
        
        // 장르 설정
        const genreObj = genres.find(g => g.name === profileData.artist_genre);
        if (genreObj) {
          setSelectedGenre(genreObj.id);
        }
        
        // 프로필 이미지 설정
        if (profileData.avatar_url) {
          setProfileImage(profileData.avatar_url);
        }
      }
      
    } catch (error) {
      console.log('사용자 정보 가져오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 더미 데이터 - 20개의 탑 카드 아이템
  const dummyTopCards = [
    { id: 1, name: "김작가", photo: "/noimage.jpg" },
    { id: 2, name: "이작가", photo: "/noimage.jpg" },
    { id: 3, name: "박작가", photo: "/noimage.jpg" },
    { id: 4, name: "최작가", photo: "/noimage.jpg" },
    { id: 5, name: "정작가", photo: "/noimage.jpg" },
    { id: 6, name: "강작가", photo: "/noimage.jpg" },
    { id: 7, name: "조작가", photo: "/noimage.jpg" },
    { id: 8, name: "윤작가", photo: "/noimage.jpg" },
    { id: 9, name: "장작가", photo: "/noimage.jpg" },
    { id: 10, name: "임작가", photo: "/noimage.jpg" },
    { id: 11, name: "한작가", photo: "/noimage.jpg" },
    { id: 12, name: "오작가", photo: "/noimage.jpg" },
    { id: 13, name: "서작가", photo: "/noimage.jpg" },
    { id: 14, name: "신작가", photo: "/noimage.jpg" },
    { id: 15, name: "권작가", photo: "/noimage.jpg" },
    { id: 16, name: "황작가", photo: "/noimage.jpg" },
    { id: 17, name: "안작가", photo: "/noimage.jpg" },
    { id: 18, name: "송작가", photo: "/noimage.jpg" },
    { id: 19, name: "전작가", photo: "/noimage.jpg" },
    { id: 20, name: "홍작가", photo: "/noimage.jpg" },
  ];

  useEffect(() => {
    setTopCards(dummyTopCards);
    setVisibleTopCards(dummyTopCards.slice(0, visibleCount));
    setAllLoaded(dummyTopCards.length <= visibleCount);
  }, [visibleCount]);

  const getMagazines = async () => {
    const { data, error } = await supabase
      .from("magazine")
      .select("*")
      .order("created_at", { ascending: false });
    setMagazines(data);
    setAllLoaded(data.length <= visibleCount);
  };

  useEffect(() => {
    getMagazines();
    getUserProfile(); // 사용자 정보 가져오기
  }, []);

  console.log("magazines:", magazines);

  const loadMore = () => {
    const newVisibleCount = visibleCount + 12;
    setVisibleCount(newVisibleCount);
  };

  // 브라우저에서 WebP 변환 함수 (최대 1200px 리사이즈 적용)
  async function fileToWebP(file) {
    return new Promise((resolve) => {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      img.onload = () => {
        // 최대 크기 제한
        const maxSize = 1200;
        let targetW = img.width;
        let targetH = img.height;
        if (img.width > maxSize || img.height > maxSize) {
          if (img.width > img.height) {
            targetW = maxSize;
            targetH = Math.round(img.height * (maxSize / img.width));
          } else {
            targetH = maxSize;
            targetW = Math.round(img.width * (maxSize / img.height));
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetW, targetH);
        canvas.toBlob(
          (blob) => { resolve(blob); },
          'image/webp',
          0.8 // 압축률(0~1)
        );
      };
      reader.readAsDataURL(file);
    });
  }

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploading(true);

      // 파일 확장자 체크 및 미리보기
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);

      // webp 변환
      const webpBlob = await fileToWebP(file);
      const fileName = `${Math.random()}.webp`;
      const filePath = `${fileName}`;

      // Supabase Storage에 webp 업로드
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // 업로드된 이미지의 public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 이미지 URL 상태 업데이트
      setProfileImage(publicUrl);
    } catch (error) {
      console.log('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setIsRegistering(true);

      // 현재 로그인된 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }

      if (!user) {
        addToast({
          title: "오류",
          description: "로그인이 필요합니다.",
          color: "danger",
        });
        return;
      }

      // 장르가 선택되었는지 확인
      if (!selectedGenre) {
        addToast({
          title: "오류",
          description: "장르를 선택해주세요.",
          color: "warning",
        });
        return;
      }

      // 필수 입력 필드 검증
      if (!artistName || !artistPhone || !artistIntro || !birthDate || !artistProof) {
        addToast({
          title: "오류",
          description: "모든 필드를 입력해주세요.",
          color: "warning",
        });
        return;
      }

      // 날짜 유효성 검사
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        addToast({
          title: "오류",
          description: "날짜 형식이 유효하지 않습니다. YYYY-MM-DD 형식으로 입력해주세요.",
          color: "warning",
        });
        return;
      }

      // 선택된 장르 이름 찾기
      const genreName = genres.find(g => g.id === selectedGenre)?.name || "";

      // profiles 테이블 업데이트
      const updatePayload = {
        isArtist: true,
        artist_name: artistName,
        artist_phone: artistPhone,
        artist_intro: artistIntro,
        artist_birth: birthDate,
        artist_genre: genreName,
        artist_proof: artistProof,
        avatar_url: profileImage,
      };

      if (!isEdit) {
        // 신규 등록 시에만 승인 상태 false 로 설정
        updatePayload.isArtistApproval = false;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      addToast({
        title: isEdit ? "수정 완료" : "등록 완료",
        description: isEdit ? "작가 정보가 성공적으로 수정되었습니다." : "작가 등록이 성공적으로 완료되었습니다.",
        color: "success",
      });

      // 성공 후 리다이렉트 (예: 작가 프로필 페이지로)
      router.push('/mypage/success');
      
    } catch (error) {
      console.log('작가 등록 오류:', error);
      addToast({
        title: isEdit ? "수정 실패" : "등록 실패",
        description: `작가 ${isEdit ? '정보 수정' : '등록'}에 실패했습니다: ${error.message}`,
        color: "danger",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // 날짜 입력 핸들러
  const handleDateChange = (e) => {
    const value = e.target.value;
    setBirthDate(value);
  };

  return (
    <div className="flex flex-col items-center justify-center mx-2">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-full gap-y-6 mt-12">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="max-w-[300px] w-full flex items-center gap-3"
            >
              <div>
                <Skeleton className="flex rounded-full w-12 h-12" />
              </div>
              <div className="w-full flex flex-col gap-2">
                <Skeleton className="h-3 w-3/5 rounded-lg" />
                <Skeleton className="h-3 w-4/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-white flex items-center w-[90%] justify-between">
            <Button
              isIconOnly
              variant="light"
              className="mr-2"
              onPress={() => router.back()}
            >
              <FaArrowLeft className="text-xl" />
            </Button>
            <h2 className="text-lg font-bold text-center flex-grow">
              {isEdit ? "작가 정보 수정하기" : "신규작가 등록하기"}
            </h2>
            <div className="w-10"></div>
          </div>
          <div className="w-[90%] flex flex-col gap-y-4 mt-6">
            <div className="flex flex-col items-center gap-y-2">
              <div className="relative w-24 h-24">
                <img
                  src={profileImage}
                  alt="프로필 이미지"
                  className={`w-full h-full object-cover rounded-full ${isUploading ? 'opacity-50' : ''}`}
                />
                {isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-100">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                    />
                    <CiImageOn className="text-xl text-gray-600" />
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">프로필 이미지</span>
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm text-[#747474] font-medium">작가명</label>
              <Input
                type="text"
                variant="bordered"
                placeholder="작가명을 입력해주세요"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm text-[#747474] font-medium">연락처</label>
              <Input
                type="tel"
                variant="bordered"
                placeholder="연락처를 입력해주세요"
                value={artistPhone}
                onChange={(e) => setArtistPhone(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm text-[#747474] font-medium">작가 소개</label>
              <Textarea
                variant="bordered"
                placeholder="작가 소개를 입력해주세요"
                minRows={4}
                value={artistIntro}
                onChange={(e) => setArtistIntro(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm text-[#747474] font-medium">출생연도</label>
              <Input
                type="text"
                variant="bordered"
                placeholder="YYYY-MM-DD"
                value={birthDate}
                onChange={handleDateChange}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm text-[#747474] font-medium">장르</label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${selectedGenre === genre.id 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm text-[#747474] font-medium">활동 검증 자료</label>
              <Textarea
                variant="bordered"
                placeholder="전시 이력, 수상 경력 등 작가 활동을 증명할 수 있는 자료를 입력해주세요"
                minRows={4}
                value={artistProof}
                onChange={(e) => setArtistProof(e.target.value)}
              />
            </div>

            <Button
              color="primary"
              className="w-full mt-6 mb-24 bg-black text-white"
              size="lg"
              onPress={handleRegister}
              isLoading={isRegistering}
            >
              {isEdit ? "작가 정보 수정하기" : "신규 작가 등록하기"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
