"use client";
import React from "react";
import { Input, Button, Textarea, Checkbox, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { QRCodeSVG } from "qrcode.react";
import RichTextEditor from "./RichTextEditor/RichTextEditor";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { createClient as createClientAdmin } from "@supabase/supabase-js";

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

export function GalleryDetail({
  gallery,
  onUpdate,
  selectedKeys,
  setSelectedKeys,
  onRefresh,
  refreshToggle,
  setRefreshToggle,
  selectedGallery,
  setSelectedGallery,
}) {
  // 갤러리 ID가 없으면 신규 등록 모드로 간주
  const isNewGallery = !gallery.id;
  const [isEditing, setIsEditing] = React.useState(isNewGallery);
  const [editedGallery, setEditedGallery] = React.useState(gallery);
  // 이전 갤러리 ID를 저장하는 ref
  const prevGalleryIdRef = React.useRef(null);
  const supabase = createClient();
  const supabaseAdmin = createClientAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // QR 코드 관련 상태
  const [qrValue, setQrValue] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const qrRef = useRef(null);
  
  // 이미지 업로드 관련 상태
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // 갤러리 데이터가 변경되었거나 처음 로드된 경우 처리
    if (prevGalleryIdRef.current !== gallery.id) {
      // 갤러리가 변경되면 editedGallery 상태 업데이트
      setEditedGallery(gallery);

      // 새 갤러리이거나 다른 갤러리로 전환된 경우에만 편집 모드 설정
      if (!gallery.id) {
        setIsEditing(true); // 신규 등록 모드
      } else {
        setIsEditing(false); // 기존 갤러리 조회 모드
      }

      // 이전 갤러리 ID 업데이트
      prevGalleryIdRef.current = gallery.id;

      // 썸네일 URL이 있는 경우 항상 미리보기 설정
      setImagePreview(gallery.thumbnail || "");
    }
    
    // QR 코드 URL 설정
    if (gallery.id) {
      // 현재 window.location.origin 가져오기
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setBaseUrl(origin);
      setQrValue(`${origin}/review/gallery/${gallery.id}`);
    }
  }, [gallery]);

  // QR 코드 다운로드 함수
  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const canvas = document.createElement("canvas");
    const svgElement = qrRef.current.querySelector("svg");
    const { width, height } = svgElement.getBoundingClientRect();
    
    // 고해상도 캔버스 설정
    const scale = 2; // 2배 크기로 렌더링
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    const context = canvas.getContext("2d");
    context.scale(scale, scale);
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgURL = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0, width, height);
      
      try {
        const dataURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `gallery-review-qr-${editedGallery.id || 'new'}.png`;
        link.href = dataURL;
        link.click();
      } catch (err) {
        console.log("QR 코드 다운로드 중 오류 발생:", err);
        addToast({
          title: "QR 코드 다운로드 오류",
          description: "QR 코드 이미지를 생성하는 중 오류가 발생했습니다.",
          color: "danger",
        });
      }
    };
    
    image.onerror = () => {
      addToast({
        title: "QR 코드 다운로드 오류",
        description: "QR 코드 이미지 변환 중 오류가 발생했습니다.",
        color: "danger",
      });
    };
    
    image.src = svgURL;
  };

  // 이미지 파일 변경 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 유형 체크
    if (!file.type.includes("image")) {
      addToast({
        title: "이미지 업로드 오류",
        description: "이미지 파일만 업로드할 수 있습니다.",
        color: "danger",
      });
      return;
    }

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "이미지 업로드 오류",
        description: "이미지 크기는 5MB 이하여야 합니다.",
        color: "danger",
      });
      return;
    }

    setImageFile(file);

    // 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 업로드 함수 (webp 변환 적용)
  const uploadImage = async () => {
    if (!imageFile) return null;
    try {
      setIsUploading(true);
      const fileName = `${uuidv4()}.webp`;
      const filePath = `gallery/${fileName}`;
      // WebP 변환
      const webpBlob = await fileToWebP(imageFile);
      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from("gallery")
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        });
      if (error) throw error;
      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from("gallery")
        .getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      console.log("이미지 업로드 오류:", error);
      addToast({
        title: "이미지 업로드 오류",
        description: error.message,
        color: "danger",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // 이미지 삭제 함수
  const deleteImage = async () => {
    if (!editedGallery.thumbnail) return;

    try {
      // URL에서 경로 추출
      const urlParts = editedGallery.thumbnail.split("/");
      const filePath =
        urlParts[urlParts.length - 2] + "/" + urlParts[urlParts.length - 1];

      // Supabase Storage에서 이미지 삭제
      const { error } = await supabase.storage
        .from("gallery")
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.log("이미지 삭제 오류:", error);
    }
  };

  // 이미지 삭제 버튼 핸들러
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setEditedGallery({ ...editedGallery, thumbnail: "" });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!editedGallery.url) {
      addToast({
        title: "갤러리 저장 중 오류 발생",
        description: "URL을 입력해주세요.",
        color: "danger",
      });
      return;
    }
    if (isNaN(Number(editedGallery.visitor_rating))) {
      addToast({
        title: "갤러리 저장 중 오류 발생",
        description: "방문자 평점을 숫자로 입력해주세요.",
        color: "danger",
      });
      return;
    }
    if (isNaN(Number(editedGallery.blog_review_count))) {
      addToast({
        title: "갤러리 저장 중 오류 발생",
        description: "블로그 리뷰 수를 숫자로 입력해주세요.",
        color: "danger",
      });
    }

    try {
      // 이미지 파일이 있는 경우 업로드
      let thumbnailUrl = editedGallery.thumbnail;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          thumbnailUrl = uploadedUrl;
        }
      }

      if (isNewGallery) {
        // Supabase에 새 갤러리 데이터 삽입
        console.log("삽입하기기");
        const { data, error } = await supabase
          .from("gallery")
          .insert([
            {
              name: editedGallery.name,
              url: editedGallery.url,
              address: editedGallery.address,
              phone: editedGallery.phone,
              workinghour: editedGallery.workinghour,
              thumbnail: thumbnailUrl,
              visitor_rating: editedGallery.visitor_rating,
              blog_review_count: editedGallery.blog_review_count,
              homepage_url: editedGallery.homepage_url,
              shop_info: editedGallery.shop_info,
              add_info: editedGallery.add_info,
              isNew: editedGallery.isNew,
              isRecommended: editedGallery.isRecommend,
              isNow: editedGallery.isNow,
              pick: editedGallery.pick,
            },
          ])
          .select();

        if (error) {
          throw error;
        }

        // 저장된 데이터 (ID 포함)로 갤러리 정보 업데이트
        const newGalleryWithId = data[0];
        onUpdate(newGalleryWithId);
      } else {
        // 기존 갤러리 데이터 업데이트
        console.log("업데이트하기");
        const { error } = await supabase
          .from("gallery")
          .update({
            name: editedGallery.name,
            url: editedGallery.url,
            address: editedGallery.address,
            phone: editedGallery.phone,
            workinghour: editedGallery.workinghour,
            thumbnail: thumbnailUrl,
            visitor_rating: editedGallery.visitor_rating,
            blog_review_count: editedGallery.blog_review_count,
            homepage_url: editedGallery.homepage_url,
            shop_info: editedGallery.shop_info,
            add_info: editedGallery.add_info,
            isNew: editedGallery.isNew,
            isRecommended: editedGallery.isRecommend,
            isNow: editedGallery.isNow,
            pick: editedGallery.pick,
          })
          .eq("id", editedGallery.id);

        if (error) {
          throw error;
        }

        onUpdate({ ...editedGallery, thumbnail: thumbnailUrl });
      }

      // 저장 후 편집 모드 종료
      setIsEditing(false);
      setImageFile(null);
      setImagePreview("");
      setEditedGallery({
        name: "",
        url: "",
        address: "",
        phone: "",
        workinghour: "",
        thumbnail: "",
        visitor_rating: 0,
        blog_review_count: 0,
        homepage_url: "",
        shop_info: "",
        add_info: "",
        isNew: false,
        isRecommended: false,
        isNow: false,
        pick: false,
      });
      // 목록 새로고침 실행
      try {
        if (onRefresh) {
          console.log("갤러리 목록 새로고침 함수 호출 시도");
          onRefresh();
          console.log("갤러리 목록 새로고침 함수 호출 성공");
        } else {
          console.log("갤러리 목록 새로고침 함수가 전달되지 않았습니다");
        }
      } catch (refreshError) {
        console.log("갤러리 목록 새로고침 중 오류 발생:", refreshError);
      }

      addToast({
        title: "갤러리 저장 완료",
        description: "갤러리 정보가 성공적으로 저장되었습니다.",
        color: "success",
      });
      setSelectedKeys(new Set([]));
      setRefreshToggle((refreshToggle) => refreshToggle + 1);
      setSelectedGallery(null);
    } catch (error) {
      console.log("갤러리 저장 중 오류 발생:", error);
      addToast({
        title: "갤러리 저장 중 오류 발생",
        description: error.message.includes("duplicate")
          ? "중복되는 URL이 있어 등록이 불가합니다."
          : error.message,
        color: "danger",
      });
      setRefreshToggle((refreshToggle) => refreshToggle + 1);
    }
  };

  const handleDelete = async () => {
    try {
      // 이미지가 있다면 먼저 스토리지에서 삭제
      if (editedGallery.thumbnail) {
        await deleteImage();
      }

      const { error } = await supabase
        .from("gallery")
        .delete()
        .eq("id", editedGallery.id);
      if (error) {
        throw error;
      }
      addToast({
        title: "갤러리 삭제 완료",
        description: "갤러리 정보가 성공적으로 삭제되었습니다.",
        color: "success",
      });
      setSelectedKeys(new Set([]));
      setRefreshToggle((refreshToggle) => refreshToggle + 1);
      setIsEditing(false);
      setImageFile(null);
      setImagePreview("");
      setEditedGallery({
        name: "",
        url: "",
        address: "",
        phone: "",
        workinghour: "",
        thumbnail: "",
        visitor_rating: 0,
        blog_review_count: 0,
        homepage_url: "",
        shop_info: "",
        add_info: "",
        isNew: false,
        isRecommended: false,
        isNow: false,
        pick: false,
      });
      setSelectedGallery(null);
    } catch (error) {
      console.log("갤러리 삭제 중 오류 발생:", error);
      addToast({
        title: "갤러리 삭제 중 오류 발생",
        description: error.message,
        color: "danger",
      });
    }
  };

  const handleCancel = () => {
    if (isNewGallery) {
      // 신규 등록 취소 시 해당 데이터를 삭제하고 목록으로 돌아감
      onDelete();
    } else {
      // 기존 데이터 편집 취소 시 원래 데이터로 복원
      setEditedGallery(gallery);
      setIsEditing(false);

      // 이미지 미리보기 초기화
      if (gallery.thumbnail) {
        setImagePreview(gallery.thumbnail);
      } else {
        setImagePreview("");
      }
      setImageFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 계정 생성 처리 함수
  const handleCreateAccount = async () => {
    try {
      // 12자리 난수 생성
      const randomNum = Math.floor(100000000000 + Math.random() * 900000000000);
      const email = `${randomNum}@naver.com`;
      const password = "123456789";

      // Supabase Admin API를 사용하여 계정 생성
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

      if (error) throw error;

      // 생성된 사용자 ID 가져오기
      const userId = data.user.id;
      console.log("userId:", userId);
      const userEmail = data.user.email;
      console.log("userEmail:", userEmail);
      
      // 갤러리 테이블 업데이트
      const { error: galleryError } = await supabase
        .from("gallery")
        .update({ account_id: userId,account_email:userEmail})
        .eq("id", editedGallery.id);
      
      if (galleryError) {
        console.log("갤러리 계정 ID 업데이트 오류:", galleryError);
      }
      
      // profiles 테이블에 row가 생성될 때까지 기다리기
      let profileExists = false;
      let attempts = 0;
      const maxAttempts = 10; // 최대 시도 횟수
      
      while (!profileExists && attempts < maxAttempts) {
        // 프로필 존재 여부 확인
        const { data: profileData, error: checkError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
          
        if (profileData) {
          profileExists = true;
          console.log("프로필 생성 확인됨:", profileData);
          
          // profiles 테이블 업데이트 - supabaseAdmin으로 변경
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({ role: "gallery", url: editedGallery.url })
            .eq("id", profileData.id);
            
          if (profileError) {
            console.log("프로필 업데이트 오류:", profileError, "프로필 데이터:", profileData);
            throw profileError;
          } else {
            console.log("프로필 업데이트 성공");
          }
        } else {
          console.log(`프로필 확인 중... 시도 ${attempts + 1}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
          attempts++;
        }
      }
      
      if (!profileExists) {
        throw new Error("프로필 생성 확인 시간 초과. 나중에 다시 시도해주세요.");
      }

      addToast({
        title: "계정 생성 완료",
        description: `이메일: ${email}, 비밀번호: ${password}`,
        color: "success",
      });      

    } catch (error) {
      console.log("계정 생성 오류:", error);
      addToast({
        title: "계정 생성 오류",
        description: error.message,
        color: "danger",
      });
    }
  };

  return (
    <div className="space-y-6 ">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isNewGallery ? "갤러리 신규 등록" : "갤러리 상세 정보"}
        </h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                color="primary"
                onPress={handleSave}
                isDisabled={isUploading}
              >
                <Icon icon="lucide:save" className="text-lg mr-1" />
                {isNewGallery ? "등록" : "저장"}
              </Button>
              <Button
                variant="flat"
                onPress={handleCancel}
                isDisabled={isUploading}
              >
                <Icon icon="lucide:x" className="text-lg mr-1" />
                취소
              </Button>
            </>
          ) : (
            <>
              <Button
                color="primary"
                variant="flat"
                onPress={() => {
                  setIsEditing(true);
                  handleSave();
                }}
              >
                <Icon icon="lucide:edit" className="text-lg mr-1" />
                수정
              </Button>
              <Button color="danger" variant="flat" onPress={handleDelete}>
                <Icon icon="lucide:trash" className="text-lg mr-1" />
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
        {!isEditing && (
          <>
            <Input
              className="col-span-2 md:col-span-1"
              label="아이디"
              value={editedGallery.account_email||"없음"}
              onValueChange={(value) =>
                setEditedGallery({ ...editedGallery, account_email: value })
              }
              isReadOnly={true}
            />
            <div className="flex flex-col justify-center items-center col-span-2 md:col-span-1">
              <Button
                className="w-full md:h-full h-12"
                color="primary"
                variant="solid"
                onPress={handleCreateAccount}
              >
                <Icon icon="lucide:user-plus" className="text-lg mr-1" />
                계정 생성하기
              </Button>
            </div>
          </>
        )}

        <Input
          className="col-span-2 md:col-span-1"
          label="이름"
          value={editedGallery.name}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, name: value })
          }
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="URL"
          value={editedGallery.url}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, url: value })
          }
          isRequired
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="주소"
          value={editedGallery.address}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, address: value })
          }
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="전화번호"
          value={editedGallery.phone}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, phone: value })
          }
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="영업시간"
          value={editedGallery.workinghour}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, workinghour: value })
          }
        />

        {/* 썸네일 이미지 업로드 컴포넌트 */}
        <div className="space-y-2 col-span-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium">썸네일 이미지</label>
            {imagePreview && (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={handleRemoveImage}
                isDisabled={isUploading}
              >
                <Icon icon="lucide:trash-2" className="text-sm mr-1" />
                이미지 삭제
              </Button>
            )}
          </div>

          <div className="flex items-start space-x-4">
            {/* 이미지 미리보기 영역 */}
            <div className="w-36 h-36 border border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="썸네일 미리보기"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-center p-2">
                  <Icon icon="lucide:image" className="text-3xl mx-auto mb-1" />
                  <p className="text-xs">이미지 없음</p>
                </div>
              )}
            </div>

            {/* 업로드 영역 */}
            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                id="thumbnail-upload"
                disabled={isUploading}
              />

              <Button
                className="w-full"
                color="primary"
                variant="flat"
                onPress={() => fileInputRef.current?.click()}
                isDisabled={isUploading}
              >
                <Icon icon="lucide:upload" className="text-lg mr-1" />
                {isUploading ? "업로드 중..." : "이미지 선택"}
              </Button>

              <p className="text-xs text-gray-500">
                5MB 이하의 이미지 파일을 선택해주세요. (JPG, PNG, GIF)
              </p>

              {/* 외부 URL 입력 필드 */}
              <Input
                size="sm"
                label="또는 이미지 URL 직접 입력"
                value={!imageFile ? editedGallery.thumbnail || "" : ""}
                onValueChange={(value) => {
                  if (!imageFile) {
                    setEditedGallery({ ...editedGallery, thumbnail: value });
                    setImagePreview(value);
                  }
                }}
                placeholder="https://example.com/image.jpg"
                isDisabled={!!imageFile || isUploading}
              />
            </div>
          </div>
        </div>

        <Input
          className="col-span-2 md:col-span-1"
          label="방문자 평점"
          value={editedGallery.visitor_rating}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, visitor_rating: value })
          }
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="블로그 리뷰 수"
          value={editedGallery.blog_review_count}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, blog_review_count: value })
          }
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="홈페이지 URL"
          value={editedGallery.homepage_url}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, homepage_url: value })
          }
        />
        <Textarea
          className="col-span-2 md:col-span-1"
          label="갤러리 소개"
          value={editedGallery.shop_info || ""}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, shop_info: value })
          }
          placeholder="갤러리에 대한 소개 정보를 입력하세요"
        />
        <Textarea
          className="col-span-2 md:col-span-1"
          label="갤러리 설명"
          value={editedGallery.description || ""}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, description: value })
          }
          placeholder="갤러리에 대한 상세 설명을 입력하세요"
        />
        <Textarea
          className="col-span-2 md:col-span-1"
          label="추가 정보"
          value={editedGallery.add_info || ""}
          onValueChange={(value) => {
            setEditedGallery({ ...editedGallery, add_info: value });
          }}
          placeholder="추가 정보를 입력하세요. (텍스트만 입력 가능)"
        />

        <div className="flex flex-col gap-4 md:col-span-2 mt-2">
          <h3 className="text-md font-medium">갤러리 옵션</h3>
          <div className="flex flex-col gap-3 pl-1">
            <Checkbox
              id="isNew"
              isSelected={editedGallery.isNew}
              onValueChange={(isSelected) =>
                setEditedGallery({ ...editedGallery, isNew: isSelected })
              }
              size="md"
              radius="sm"
            >
              <div className="flex items-center gap-2">
                <span>신규</span>
              </div>
            </Checkbox>
            <Checkbox
              id="isRecommended"
              isSelected={editedGallery.isRecommended || false}
              onValueChange={(isSelected) =>
                setEditedGallery({
                  ...editedGallery,
                  isRecommended: isSelected,
                })
              }
              size="md"
              radius="sm"
            >
              <div className="flex items-center gap-2">
                <span>추천</span>
              </div>
            </Checkbox>
            <Checkbox
              id="isNow"
              isSelected={editedGallery.isNow}
              onValueChange={(isSelected) =>
                setEditedGallery({ ...editedGallery, isNow: isSelected })
              }
              size="md"
              radius="sm"
            >
              <div className="flex items-center gap-2">
                <span>현재 진행 중</span>
              </div>
            </Checkbox>
            <Checkbox
              id="pick"
              isSelected={editedGallery.pick || false}
              onValueChange={(isSelected) =>
                setEditedGallery({
                  ...editedGallery,
                  pick: isSelected,
                })
              }
              size="md"
              radius="sm"
            >
              <div className="flex items-center gap-2">
                <span>예술랭픽</span>
              </div>
            </Checkbox>
          </div>
        </div>
        
        {/* QR 코드 섹션 - 편집 모드가 아닌 경우에만 표시 */}
        {!isNewGallery && !isEditing && (
          <div className="flex flex-col items-center gap-5 col-span-2 border border-gray-200 p-6 rounded-lg mt-6 bg-gradient-to-b from-gray-50 to-white shadow-sm">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">리뷰 페이지 QR 코드</h3>
              <p className="text-sm text-gray-600">
                아래 QR 코드를 스캔하면 갤러리 리뷰 페이지로 이동합니다
              </p>
            </div>
            
            <div ref={qrRef} className="bg-white p-5 rounded-lg shadow border border-gray-100">
              {qrValue && (
                <QRCodeSVG 
                  value={qrValue} 
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              )}
            </div>
            
            <div className="text-center space-y-3 w-full max-w-md">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <p className="font-medium text-gray-700 mb-1">리뷰 페이지 URL:</p>
                <p className="text-sm text-gray-600 break-all font-mono">
                  {qrValue || "QR 코드 URL을 확인할 수 없습니다."}
                </p>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  color="primary" 
                  onPress={downloadQRCode}
                  isDisabled={!qrValue}
                  className="px-6"
                >
                  <Icon icon="lucide:download" className="text-lg mr-2" />
                  QR 코드 다운로드
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                갤러리 안내판이나 홍보 자료에 이 QR 코드를 사용하여 방문객들이 쉽게 리뷰를 작성할 수 있도록 하세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
