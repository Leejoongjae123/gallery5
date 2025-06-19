"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Spinner,
  Input,
  addToast
} from "@heroui/react";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { CiImageOn } from "react-icons/ci";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function EditProduct() {
  const params = useParams();
  const [artwork, setArtwork] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 폼 필드 상태
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [makeMaterial, setMakeMaterial] = useState("");
  const [makeDate, setMakeDate] = useState("");
  const [genre, setGenre] = useState("현대미술");
  const [price, setPrice] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const genres = [
    { id: 1, name: "현대미술" },
    { id: 2, name: "명화/동양화" },
    { id: 3, name: "추상화" },
    { id: 4, name: "사진/일러스트" },
    { id: 5, name: "기타" },
  ];

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('product')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) {
          console.log('작품 불러오기 오류:', error);
          addToast({
            title: "데이터 로드 실패",
            description: "작품 정보를 불러오는데 실패했습니다.",
            color: "danger"
          });
          router.push('/mypage/success');
          return;
        }

        // 현재 로그인한 사용자 확인
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== data.artist_id) {
          addToast({
            title: "접근 권한 없음",
            description: "이 작품을 수정할 권한이 없습니다.",
            color: "danger"
          });
          router.push('/mypage/success');
          return;
        }

        setArtwork(data);
        // 폼 필드 초기화
        setName(data.name || "");
        setSize(data.size || "");
        setMakeMaterial(data.make_material || "");
        setMakeDate(data.make_date || "");
        setGenre(data.genre || "현대미술");
        setPrice(data.price ? data.price.toString() : "");
        setProductImages(data.image || []);
      } catch (error) {
        console.log('오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params?.id) {
      fetchProductData();
    }
  }, [params.id, router, supabase]);

  // 브라우저 WebP 변환 (addProduct와 동일)
  async function fileToWebP(file) {
    return new Promise((resolve) => {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = (e) => (img.src = e.target.result);
      img.onload = () => {
        const max = 1200;
        let w = img.width,
          h = img.height;
        if (w > max || h > max) {
          if (w > h) {
            h = Math.round(h * (max / w));
            w = max;
          } else {
            w = Math.round(w * (max / h));
            h = max;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), "image/webp", 0.8);
      };
      reader.readAsDataURL(file);
    });
  }

  const handleImageUpload = async (e) => {
    try {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      setIsUploading(true);

      const uploadedImages = [];
      for (const file of files) {
        const webpBlob = await fileToWebP(file);
        const fileName = `${uuidv4()}.webp`;
        const filePath = `product/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product")
          .upload(filePath, webpBlob, { contentType: "image/webp" });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("product").getPublicUrl(filePath);
        uploadedImages.push(publicUrl);
      }

      setProductImages([...productImages, ...uploadedImages]);
    } catch (error) {
      console.log("Error uploading image:", error);
      addToast({
        title: "이미지 업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 입력 유효성 검증 함수
  const validateInputs = () => {
    // 작품 이미지 체크
    if (productImages.length === 0) {
      addToast({
        title: "필수 입력 누락",
        description: "작품 이미지를 1개 이상 등록해주세요.",
        color: "danger",
      });
      return false;
    }
    
    // 작품명 체크
    if (!name.trim()) {
      addToast({
        title: "필수 입력 누락",
        description: "작품명을 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    // 사이즈 체크
    if (!size.trim()) {
      addToast({
        title: "필수 입력 누락",
        description: "사이즈를 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    // 소재 체크
    if (!makeMaterial.trim()) {
      addToast({
        title: "필수 입력 누락",
        description: "소재를 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    // 제작일 체크 (YYYYMMDD 형식)
    if (!makeDate.trim()) {
      addToast({
        title: "필수 입력 누락",
        description: "제작일을 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    const datePattern = /^\d{8}$/;
    if (!datePattern.test(makeDate)) {
      addToast({
        title: "입력 형식 오류",
        description: "제작일은 YYYYMMDD 형식(예: 20250201)으로 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    // 작품금액 체크 (숫자만)
    if (!price.trim()) {
      addToast({
        title: "필수 입력 누락",
        description: "작품금액을 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    if (!/^\d+$/.test(price)) {
      addToast({
        title: "입력 형식 오류",
        description: "작품금액은 숫자만 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    return true;
  };

  // 숫자만 입력 허용하는 함수
  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setPrice(value);
    }
  };

  // 날짜 형식 검증 함수
  const handleDateChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d{0,8}$/.test(value)) {
      setMakeDate(value);
    }
  };

  const handleUpdate = async () => {
    // 입력 유효성 검증
    if (!validateInputs()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 작품 정보 업데이트
      const { error } = await supabase
        .from('product')
        .update({
          name,
          size,
          make_material: makeMaterial,
          make_date: makeDate,
          genre,
          price: parseInt(price),
          image: productImages
        })
        .eq('id', params.id);

      if (error) {
        addToast({
          title: "작품 수정 실패",
          description: "작품 정보 저장 중 오류가 발생했습니다.",
          color: "danger",
        });
        return;
      }

      addToast({
        title: "작품 수정 성공",
        description: "작품이 성공적으로 수정되었습니다.",
        color: "success",
      });
      
      router.push('/mypage/success');
    } catch (error) {
      console.log('Error updating product:', error);
      addToast({
        title: "작품 수정 실패",
        description: error.message || "작품 수정 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말로 작품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('product')
        .delete()
        .eq('id', params.id);

      if (error) {
        addToast({
          title: "작품 삭제 실패",
          description: "작품 삭제 중 오류가 발생했습니다.",
          color: "danger",
        });
        return;
      }

      addToast({
        title: "작품 삭제 성공",
        description: "작품이 성공적으로 삭제되었습니다.",
        color: "success",
      });
      
      router.push('/mypage/success');
    } catch (error) {
      console.log('Error deleting product:', error);
      addToast({
        title: "작품 삭제 실패",
        description: error.message || "작품 삭제 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner variant="wave" color="primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center mx-2">
      <div className="bg-white flex items-center w-[90%] justify-between">
        <Button
          isIconOnly
          variant="light"
          className="mr-2"
          onPress={() => router.push("/mypage/success")}
        >
          <FaArrowLeft className="text-xl" />
        </Button>
        <h2 className="text-lg font-bold text-center flex-grow">
          작품 수정하기
        </h2>
        <div className="w-10"></div>
      </div>
      
      <div className="w-[90%] space-y-6 mt-4 mb-24">
        <div className="flex flex-col gap-y-2">
          <label className="text-sm text-[#747474] font-medium">
            작품 이미지 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-4">
            {productImages.map((image, index) => (
              <div key={index} className="relative w-24 h-24">
                <img
                  src={image}
                  alt={`작품 이미지 ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => {
                    const newImages = [...productImages];
                    newImages.splice(index, 1);
                    setProductImages(newImages);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                >
                  <IoMdCloseCircleOutline className="text-gray-400 text-2xl" />
                </button>
              </div>
            ))}
            
            <div className="relative w-24 h-24">
              <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImageUpload}
                />
                <CiImageOn className="text-2xl text-gray-400 mb-2" />
                <span className="text-xs text-gray-400">이미지 추가</span>
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <Spinner size="sm" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <label className="text-sm text-[#747474] font-medium">
            작품명 <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            variant="bordered"
            placeholder="작품명을 입력해주세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <label className="text-sm text-[#747474] font-medium">
            사이즈 <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            variant="bordered"
            placeholder="예시) 121.9x156.8cm"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <label className="text-sm text-[#747474] font-medium">
            소재 <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            variant="bordered"
            placeholder="예시) 유화/캔버스"
            value={makeMaterial}
            onChange={(e) => setMakeMaterial(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <label className="text-sm text-[#747474] font-medium">
            제작일 <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            variant="bordered"
            placeholder="20250201"
            value={makeDate}
            onChange={handleDateChange}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <label className="text-sm text-[#747474] font-medium">
            장르 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <Button
                key={g.id}
                size="sm"
                variant={genre === g.name ? "solid" : "bordered"}
                className={`${
                  genre === g.name
                    ? "bg-black text-white"
                    : "border-gray-300 text-gray-600"
                }`}
                onPress={() => setGenre(g.name)}
              >
                {g.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <label className="text-sm text-[#747474] font-medium">
            작품금액 <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            variant="bordered"
            placeholder="콤마없이 숫자만 입력해주세요"
            value={price}
            onChange={handlePriceChange}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Button
            color="primary"
            className="w-full mt-6 bg-black text-white"
            size="lg"
            onPress={handleUpdate}
            isLoading={isSubmitting}
          >
            상품 수정
          </Button>
          
          <Button
            variant="bordered"
            className="w-full border-black text-black"
            size="lg"
            onPress={handleDelete}
            isLoading={isDeleting}
          >
            상품 삭제
          </Button>
        </div>
      </div>
    </div>
  );
} 