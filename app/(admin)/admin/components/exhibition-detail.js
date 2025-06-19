"use client";
import React from "react";
import { Input, Button, Textarea, Checkbox, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { QRCodeSVG } from "qrcode.react";
import Froala from "./Froala";
import RichTextEditor from "./RichTextEditor/RichTextEditor";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";

export function ExhibitionDetail({
  exhibition,
  onUpdate,
  selectedKeys,
  setSelectedKeys,
  onRefresh,
  refreshToggle,
  setRefreshToggle,
  selectedExhibition,
  setSelectedExhibition,
}) {
  // 전시회 ID가 없으면 신규 등록 모드로 간주
  const isNewExhibition = !exhibition.id;
  const [isEditing, setIsEditing] = React.useState(isNewExhibition);
  const [editedExhibition, setEditedExhibition] = React.useState({
    ...exhibition,
    free_ticket_limit: exhibition.free_ticket_limit !== undefined && exhibition.free_ticket_limit !== null ? exhibition.free_ticket_limit : 0,
  });
  // 이전 전시회 ID를 저장하는 ref
  const prevExhibitionIdRef = React.useRef(exhibition.id);
  const supabase = createClient();
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  
  // QR 코드 관련 상태
  const [qrValue, setQrValue] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const qrRef = useRef(null);

  // DatePicker 관련 상태
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    console.log('ExhibitionDetail: exhibition prop 변경됨:', exhibition);
    
    // exhibition이 변경될 때마다 editedExhibition 업데이트
    setEditedExhibition({...exhibition}); // 새로운 객체로 복사
    setPreviewUrl(exhibition.photo || '');

    // 새 전시회이거나 다른 전시회로 전환된 경우에만 편집 모드 설정
    if (!exhibition.id) {
      console.log('신규 전시회 모드로 설정');
      setIsEditing(true); // 신규 등록 모드
    } else if (prevExhibitionIdRef.current !== exhibition.id) {
      console.log('다른 전시회로 전환됨, 조회 모드로 설정');
      setIsEditing(false); // 기존 전시회 조회 모드
    }

    // 이전 전시회 ID 업데이트
    prevExhibitionIdRef.current = exhibition.id;
    
    // QR 코드 URL 설정
    if (exhibition.id) {
      // 현재 window.location.origin 가져오기
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setBaseUrl(origin);
      setQrValue(`${origin}/review/exhibition/${exhibition.id}`);
    } else {
      setQrValue("");
    }
  }, [exhibition, exhibition.id]); // exhibition.id도 의존성에 추가

  // add_info 값 변경 감지
  useEffect(() => {
  }, [editedExhibition.add_info]);

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
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 브라우저에서 WebP 변환 함수
  async function fileToWebP(file) {
    return new Promise((resolve) => {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => { resolve(blob); },
          'image/webp',
          0.8 // 압축률(0~1)
        );
      };
      reader.readAsDataURL(file);
    });
  }

  const uploadImage = async () => {
    if (!imageFile) return null;
    try {
      setIsUploading(true);
      const fileName = `${uuidv4()}.webp`;
      const filePath = `exhibition/${fileName}`;
      // WebP 변환
      const webpBlob = await fileToWebP(imageFile);
      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from("exhibition")
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        });
      if (error) throw error;
      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from("exhibition")
        .getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
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
  console.log("exhibition:", exhibition)
  const handleSave = async () => {
    // 편집 모드가 아닌 경우에는 바로 저장 진행
    if (!isEditing && !isNewExhibition) {
      console.log("전시회 저장 시작 - 추가 정보:", editedExhibition.add_info);
      // 이미지가 선택되었다면 업로드부터 진행
      let photoUrl = editedExhibition.photo;
      if (imageFile) {
        setIsUploading(true);
        photoUrl = await uploadImage();
        if (!photoUrl) {
          addToast({
            title: "이미지 업로드 실패",
            description: "이미지 업로드에 실패했습니다. 다시 시도해주세요.",
            color: "danger",
          });
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }
      
      // 이제 이미지 URL을 포함한 데이터로 업데이트
      try {
        // 기존 전시회 데이터 업데이트
        console.log("업데이트하기");
        
        // naver_gallery_url 처리
        const naver_gallery_url = editedExhibition.naver_gallery_url && typeof editedExhibition.naver_gallery_url === 'object' 
          ? editedExhibition.naver_gallery_url.url || "" 
          : editedExhibition.naver_gallery_url || "";
        
        let payload = {
          name: editedExhibition.name,
          contents: editedExhibition.contents,
          photo: photoUrl, // 새 이미지 URL 사용
          start_date: editedExhibition.start_date,
          end_date: editedExhibition.end_date,
          working_hour: editedExhibition.working_hour,
          off_date: editedExhibition.off_date,
          add_info: editedExhibition.add_info,
          homepage_url: editedExhibition.homepage_url,
          isFree: editedExhibition.isFree,
          isRecommended: editedExhibition.isRecommended,
          review_count: editedExhibition.review_count,
          review_average: editedExhibition.review_average,
          naver_gallery_url: naver_gallery_url,
          price: editedExhibition.price,
          isSale: editedExhibition.isSale,
          pick: editedExhibition.pick,
        };
        if (editedExhibition.isSale) {
          payload.free_ticket_limit = editedExhibition.free_ticket_limit;
        }
        
        const { error } = await supabase
          .from("exhibition")
          .update(payload)
          .eq("id", editedExhibition.id);

        if (error) {
          throw error;
        }

        // 업데이트된 photo URL을 포함하여 전달
        onUpdate({...editedExhibition, photo: photoUrl});

        addToast({
          title: "전시회 저장 완료",
          description: "전시회 정보가 성공적으로 저장되었습니다.",
          color: "success",
        });
        
        // 목록 새로고침 실행
        try {
          if (onRefresh) {
            onRefresh();
          }
        } catch (refreshError) {
          console.error("전시회 목록 새로고침 중 오류 발생:", refreshError);
        }
        
        setRefreshToggle((refreshToggle) => refreshToggle + 1);
        setImageFile(null); // 이미지 파일 초기화
        return;
      } catch (error) {
        console.log("전시회 저장 중 오류 발생:", error);
        addToast({
          title: "전시회 저장 중 오류 발생",
          description: error.message,
          color: "danger",
        });
        setRefreshToggle((refreshToggle) => refreshToggle + 1);
        return;
      }
    }
    
    console.log('editedExhibition', editedExhibition)
    if (!editedExhibition.contents) {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "전시회 이름을 입력해주세요.",
        color: "danger",
      });
      return;
    }
    if (isNaN(Number(editedExhibition.review_average))) {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "평점을 숫자로 입력해주세요.",
        color: "danger",
      });
      return;
    }
    if (isNaN(Number(editedExhibition.review_count))) {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "리뷰 수를 숫자로 입력해주세요.",
        color: "danger",
      });
      return;
    }
    
    // naver_gallery_url 유효성 검사 - 객체 또는 문자열 모두 처리
    const naver_gallery_url_value = typeof editedExhibition.naver_gallery_url === 'object' 
      ? (editedExhibition.naver_gallery_url?.url || "") 
      : (editedExhibition.naver_gallery_url || "");
      
    if (naver_gallery_url_value === "") {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "네이버 갤러리 URL을 입력해주세요.",
        color: "danger",
      });
      return;
    }

    // end_date 검증 강화
    if (!editedExhibition.end_date || editedExhibition.end_date==="" || editedExhibition.end_date.trim() === "") {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "전시종료일을 입력해주세요.",
        color: "danger",
      });
      return;
    }
    
    // YYYYmmdd 형식 검증
    const dateFormatRegex = /^\d{8}$/;
    if (!dateFormatRegex.test(editedExhibition.end_date)) {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "전시종료일은 YYYYMMDD 형식(예: 20241231)으로 입력해주세요.",
        color: "danger",
      });
      return;
    }
    
    // 유효한 날짜인지 추가 검증
    const year = parseInt(editedExhibition.end_date.substring(0, 4));
    const month = parseInt(editedExhibition.end_date.substring(4, 6)) - 1; // 0-11
    const day = parseInt(editedExhibition.end_date.substring(6, 8));
    
    const date = new Date(year, month, day);
    if (
      date.getFullYear() !== year || 
      date.getMonth() !== month || 
      date.getDate() !== day
    ) {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "유효하지 않은 날짜입니다. 올바른 날짜를 입력해주세요.",
        color: "danger",
      });
      return;
    }
    
    // start_date도 동일한 형식인지 확인
    if (editedExhibition.start_date && !dateFormatRegex.test(editedExhibition.start_date)) {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "전시시작일은 YYYYMMDD 형식(예: 20241231)으로 입력해주세요.",
        color: "danger",
      });
      return;
    }

    try {
      // 이미지가 선택되었다면 업로드
      let photoUrl = editedExhibition.photo;
      if (imageFile) {
        setIsUploading(true);
        photoUrl = await uploadImage();
        if (!photoUrl) {
          addToast({
            title: "이미지 업로드 실패",
            description: "이미지 업로드에 실패했습니다. 다시 시도해주세요.",
            color: "danger",
          });
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      if (isNewExhibition) {
        // Supabase에 새 전시회 데이터 삽입
        console.log("삽입하기");
        
        // naver_gallery_url 처리
        const naver_gallery_url_value = typeof editedExhibition.naver_gallery_url === 'object' 
          ? (editedExhibition.naver_gallery_url?.url || "") 
          : (editedExhibition.naver_gallery_url || "");
        
        let payload = {
          name: editedExhibition.name,
          contents: editedExhibition.contents,
          photo: photoUrl,
          start_date: editedExhibition.start_date,
          end_date: editedExhibition.end_date,
          working_hour: editedExhibition.working_hour,
          off_date: editedExhibition.off_date,
          add_info: editedExhibition.add_info,
          homepage_url: editedExhibition.homepage_url,
          isFree: editedExhibition.isFree,
          isRecommended: editedExhibition.isRecommended,
          review_count: editedExhibition.review_count,
          review_average: editedExhibition.review_average,
          naver_gallery_url: naver_gallery_url_value,
          price: editedExhibition.price,
          isSale: editedExhibition.isSale,
          pick: editedExhibition.pick,
        };
        if (editedExhibition.isSale) {
          payload.free_ticket_limit = editedExhibition.free_ticket_limit;
        }
        
        const { data, error } = await supabase
          .from("exhibition")
          .insert([payload])
          .select();

        if (error) {
          throw error;
        }

        // 저장된 데이터 (ID 포함)로 전시회 정보 업데이트
        const newExhibitionWithId = data[0];
        onUpdate(newExhibitionWithId);

      } else {
        // 기존 전시회 데이터 업데이트
        console.log("업데이트하기");
        const { error } = await supabase
          .from("exhibition")
          .update({
            name: editedExhibition.name,
            contents: editedExhibition.contents,
            photo: photoUrl,
            start_date: editedExhibition.start_date,
            end_date: editedExhibition.end_date,
            working_hour: editedExhibition.working_hour,
            off_date: editedExhibition.off_date,
            add_info: editedExhibition.add_info,
            homepage_url: editedExhibition.homepage_url,
            isFree: editedExhibition.isFree,
            isRecommended: editedExhibition.isRecommended,
            review_count: editedExhibition.review_count,
            review_average: editedExhibition.review_average,
            naver_gallery_url: editedExhibition.naver_gallery_url,
            price: editedExhibition.price,
            isSale: editedExhibition.isSale,
            pick: editedExhibition.pick,
          })
          .eq("id", editedExhibition.id);

        if (error) {
          throw error;
        }

        onUpdate({...editedExhibition, photo: photoUrl});
      }

      // 저장 후 편집 모드 종료
      setIsEditing(false);
      setImageFile(null);
      setPreviewUrl('');
      setEditedExhibition({
        name: "",
        contents: "",
        photo: "",
        start_date: "",
        end_date: "",
        working_hour: "",
        off_date: "",
        add_info: "",
        homepage_url: "",
        isFree: false,
        isRecommended: false,
        review_count: 0,
        review_average: 0,
        naver_gallery_url:"",
        price:0,
        isSale: false,
        pick: false,
        free_ticket_limit: 0,
      });
      // 목록 새로고침 실행
      try {
        if (onRefresh) {
          console.log("전시회 목록 새로고침 함수 호출 시도");
          onRefresh();
          console.log("전시회 목록 새로고침 함수 호출 성공");
        } else {
          console.log("전시회 목록 새로고침 함수가 전달되지 않았습니다");
        }
      } catch (refreshError) {
        console.error("전시회 목록 새로고침 중 오류 발생:", refreshError);
      }

      addToast({
        title: "전시회 저장 완료",
        description: "전시회 정보가 성공적으로 저장되었습니다.",
        color: "success",
      });
      setSelectedKeys(new Set([]));
      setRefreshToggle((refreshToggle) => refreshToggle + 1);
      setSelectedExhibition(null);
    } catch (error) {
      console.log("전시회 저장 중 오류 발생:", error);
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: error.message,
        color: "danger",
      });
      setRefreshToggle((refreshToggle) => refreshToggle + 1);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("exhibition")
      .delete()
      .eq("id", editedExhibition.id);
    if (error) {
      throw error;
    }
    addToast({
      title: "전시회 삭제 완료",
      description: "전시회 정보가 성공적으로 삭제되었습니다.",
      color: "success",
    });
    setSelectedKeys(new Set([]));
    setRefreshToggle((refreshToggle) => refreshToggle + 1);
    setIsEditing(false);
    setImageFile(null);
    setPreviewUrl('');
    setEditedExhibition({
      name: "",
      contents: "",
      photo: "",
      start_date: "",
      end_date: "",
      working_hour: "",
      off_date: "",
      add_info: "",
      homepage_url: "",
      isFree: false,
      isRecommended: false,
      review_count: 0,
      review_average: 0,
      naver_gallery_url:"",
      price:0,
      isSale: false,
      pick: false,
      free_ticket_limit: 0,
    });
    setSelectedExhibition(null);
  };

  const handleCancel = () => {
    if (isNewExhibition) {
      // 신규 등록 취소 시 해당 데이터를 삭제하고 목록으로 돌아감
      setSelectedExhibition(null);
      setSelectedKeys(new Set([]));
    } else {
      // 기존 데이터 편집 취소 시 원래 데이터로 복원
      setEditedExhibition(exhibition);
      setPreviewUrl(exhibition.photo || '');
      setImageFile(null);
      setIsEditing(false);
    }
  };

  // 이미지 삭제 함수
  const deleteImage = async () => {
    if (!editedExhibition.photo) return;
    
    try {
      // URL에서 경로 추출
      const urlParts = editedExhibition.photo.split("/");
      const filePath = urlParts[urlParts.length - 2] + "/" + urlParts[urlParts.length - 1];
      
      // Supabase Storage에서 이미지 삭제
      const { error } = await supabase.storage
        .from("exhibition")
        .remove([filePath]);
        
      if (error) throw error;
    } catch (error) {
      console.error("이미지 삭제 오류:", error);
    }
  };
  
  // 이미지 삭제 버튼 핸들러
  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl("");
    setEditedExhibition({ ...editedExhibition, photo: "" });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
        link.download = `exhibition-review-qr-${editedExhibition.id || 'new'}.png`;
        link.href = dataURL;
        link.click();
      } catch (err) {
        console.error("QR 코드 다운로드 중 오류 발생:", err);
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

  console.log("editedExhibition", editedExhibition);
  return (
    <div className="space-y-6 ">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isNewExhibition ? "전시회 신규 등록" : "전시회 상세 정보"}
        </h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button color="primary" onPress={handleSave} isDisabled={isUploading}>
                <Icon icon="lucide:save" className="text-lg mr-1" />
                {isNewExhibition ? "등록" : "저장"}
                {isUploading && " (업로드 중...)"}
              </Button>
              <Button variant="flat" onPress={handleCancel} isDisabled={isUploading}>
                <Icon icon="lucide:x" className="text-lg mr-1" />
                취소
              </Button>
            </>
          ) : (
            <>
              <Button
                color="primary"
                variant="flat"
                onPress={handleSave}
              >
                <Icon icon="lucide:save" className="text-lg mr-1" />
                저장
              </Button>
              <Button color="danger" variant="flat" onPress={handleDelete}>
                <Icon icon="lucide:trash" className="text-lg mr-1" />
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 ">
        <Input
          className="col-span-2 md:col-span-1"
          label="전시회 이름"
          value={editedExhibition.contents||""}
          onValueChange={(value) =>
            setEditedExhibition({ ...editedExhibition, contents: value })
          }
          isRequired={true}
        />
                <Input
          className="col-span-2 md:col-span-1"
          label="전시회 아이디"
          value={editedExhibition.id||""}
          
          isDisabled={true}
        />
        
        {/* 썸네일 이미지 업로드 컴포넌트 */}
        <div className="space-y-2 col-span-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium">전시회 이미지</label>
            {previewUrl && (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={handleRemoveImage}
                isDisabled={isUploading}
                className="col-span-2 md:col-span-1"
              >
                <Icon icon="lucide:trash-2" className="text-sm mr-1" />
                이미지 삭제
              </Button>
            )}
          </div>
          
          <div className="flex items-start space-x-4">
            {/* 이미지 미리보기 영역 */}
            <div className="w-36 h-36 border border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="썸네일 미리보기"
                  className="w-full h-full object-cover col-span-2 md:col-span-1"
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
                className="hidden col-span-2 md:col-span-1"
                id="thumbnail-upload"
                disabled={isUploading}
              />
              
              <Button
                className="w-full col-span-2 md:col-span-1"
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
                value={!imageFile ? editedExhibition.photo || "" : ""}
                onValueChange={(value) => {
                  if (!imageFile) {
                    setEditedExhibition({ ...editedExhibition, photo: value });
                    setPreviewUrl(value);
                  }
                }}
                placeholder="https://example.com/image.jpg"
                isDisabled={!!imageFile || isUploading}
              />
            </div>
          </div>
        </div>
        
        {/* 전시시작/종료 달력 UI - 신규 등록 모드일 때 갤러리와 동일하게 */}
        {isNewExhibition ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-sm font-medium mb-1 block">전시시작 *</label>
                <DatePicker
                  locale={ko}
                  selected={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const day = String(date.getDate()).padStart(2, "0");
                      setEditedExhibition({ ...editedExhibition, start_date: `${year}${month}${day}` });
                    }
                  }}
                  dateFormat="yyyy.MM.dd"
                  customInput={
                    <div className="relative">
                      <input
                        className="w-full pl-3 pr-10 py-2 rounded-lg border-2 border-gray-400 focus:border-blue-500 focus:outline-none cursor-pointer text-lg"
                        value={
                          editedExhibition.start_date
                            ? `${editedExhibition.start_date.slice(0,4)}.${editedExhibition.start_date.slice(4,6)}.${editedExhibition.start_date.slice(6,8)}`
                            : ""
                        }
                        readOnly
                        placeholder="YYYY.MM.DD"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Icon icon="lucide:calendar" className="text-gray-500 text-xl" />
                      </div>
                    </div>
                  }
                  popperClassName="react-datepicker-popper z-50"
                />
              </div>
              <div className="relative">
                <label className="text-sm font-medium mb-1 block">전시종료 *</label>
                <DatePicker
                  locale={ko}
                  selected={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const day = String(date.getDate()).padStart(2, "0");
                      setEditedExhibition({ ...editedExhibition, end_date: `${year}${month}${day}` });
                    }
                  }}
                  dateFormat="yyyy.MM.dd"
                  customInput={
                    <div className="relative">
                      <input
                        className="w-full pl-3 pr-10 py-2 rounded-lg border-2 border-gray-400 focus:border-blue-500 focus:outline-none cursor-pointer text-lg"
                        value={
                          editedExhibition.end_date
                            ? `${editedExhibition.end_date.slice(0,4)}.${editedExhibition.end_date.slice(4,6)}.${editedExhibition.end_date.slice(6,8)}`
                            : ""
                        }
                        readOnly
                        placeholder="YYYY.MM.DD"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Icon icon="lucide:calendar" className="text-gray-500 text-xl" />
                      </div>
                    </div>
                  }
                  popperClassName="react-datepicker-popper z-50"
                />
              </div>
            </div>
          </>
        ) : (
          // 기존 코드 유지 (수정/상세 모드)
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">전시시작 *</label>
              <DatePicker
                locale={ko}
                selected={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    setEditedExhibition({ ...editedExhibition, start_date: `${year}${month}${day}` });
                  }
                }}
                dateFormat="yyyy.MM.dd"
                customInput={
                  <div className="relative">
                    <input
                      className="w-full pl-3 pr-10 py-2 rounded-lg border-2 border-gray-400 focus:border-blue-500 focus:outline-none cursor-pointer text-lg"
                      value={
                        editedExhibition.start_date
                          ? `${editedExhibition.start_date.slice(0,4)}.${editedExhibition.start_date.slice(4,6)}.${editedExhibition.start_date.slice(6,8)}`
                          : ""
                      }
                      readOnly
                      placeholder="YYYY.MM.DD"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Icon icon="lucide:calendar" className="text-gray-500 text-xl" />
                    </div>
                  </div>
                }
                popperClassName="react-datepicker-popper z-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">전시종료 *</label>
              <DatePicker
                locale={ko}
                selected={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    setEditedExhibition({ ...editedExhibition, end_date: `${year}${month}${day}` });
                  }
                }}
                dateFormat="yyyy.MM.dd"
                customInput={
                  <div className="relative">
                    <input
                      className="w-full pl-3 pr-10 py-2 rounded-lg border-2 border-gray-400 focus:border-blue-500 focus:outline-none cursor-pointer text-lg"
                      value={
                        editedExhibition.end_date
                          ? `${editedExhibition.end_date.slice(0,4)}.${editedExhibition.end_date.slice(4,6)}.${editedExhibition.end_date.slice(6,8)}`
                          : ""
                      }
                      readOnly
                      placeholder="YYYY.MM.DD"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Icon icon="lucide:calendar" className="text-gray-500 text-xl" />
                    </div>
                  </div>
                }
                popperClassName="react-datepicker-popper z-50"
              />
            </div>
          </div>
        )}

        <Input
          label="운영 시간"
          value={editedExhibition.working_hour}
          onValueChange={(value) =>
            setEditedExhibition({ ...editedExhibition, working_hour: value })
          }
          className="col-span-2 md:col-span-1"
        />
        <Input
          label="휴무일"
          value={editedExhibition.off_date}
          onValueChange={(value) =>
            setEditedExhibition({ ...editedExhibition, off_date: value })
          }
        />
        <Input
          label="홈페이지 URL"
          value={editedExhibition.homepage_url}
          onValueChange={(value) =>
            setEditedExhibition({ ...editedExhibition, homepage_url: value })
          }
          className="col-span-2 md:col-span-1"
        />
        <Input
          label="리뷰 수"
          value={editedExhibition.review_count||0}
          onValueChange={(value) =>
            setEditedExhibition({ ...editedExhibition, review_count: value })
          }
        />
        <Input
          label="평균 평점"
          value={editedExhibition.review_average||0}
          onValueChange={(value) =>
            setEditedExhibition({ ...editedExhibition, review_average: value })
          }
          className="col-span-2 md:col-span-1"
        />
        <Input
          label="네이버 갤러리 URL"
          value={editedExhibition.naver_gallery_url && typeof editedExhibition.naver_gallery_url === 'object' ? editedExhibition.naver_gallery_url.url || "" : editedExhibition.naver_gallery_url || ""}
          onValueChange={(value) =>
            setEditedExhibition({ ...editedExhibition, naver_gallery_url: value })
          }
          className="col-span-2 md:col-span-1"
          isRequired
          isDisabled={!isEditing}
        />
        <Input
          label="가격"
          value={editedExhibition.price}
          onValueChange={(value) =>
            setEditedExhibition({ ...editedExhibition, price: value })
          }
          className="col-span-2 md:col-span-1"
        />
        <Textarea
          label="전시회 내용"
          value={editedExhibition.contents}
          onValueChange={(value) =>
            setEditedExhibition({ ...editedExhibition, contents: value })
          }
          className="col-span-2 md:col-span-1"
        />
        <h1>추가 정보</h1>
        {/* <Froala
          label="추가 정보"
          value={editedExhibition.add_info}
          onChange={(value) => {
            setEditedExhibition({ ...editedExhibition, add_info: value });
          }}
          className="col-span-2 w-full"
        /> */}
                <RichTextEditor
          contents={editedExhibition.add_info}
          setContents={(value) => {
            
            setEditedExhibition({ ...editedExhibition, add_info: value });
          }}
          className="col-span-2 w-full"
        />

        <div className="flex flex-col gap-4 md:col-span-2 mt-2">
          <h3 className="text-md font-medium">전시회 옵션</h3>
          <div className="flex flex-col gap-3 pl-1">
            <Checkbox
              id="isFree"
              isSelected={editedExhibition.isFree||false}
              onValueChange={(value) =>
                setEditedExhibition({ ...editedExhibition, isFree: value })
              }
              className="col-span-2 md:col-span-1"
            >
              무료 전시회
            </Checkbox>
            <Checkbox
              id="isRecommended"
              isSelected={editedExhibition.isRecommended||false}
              onValueChange={(value) =>
                setEditedExhibition({ ...editedExhibition, isRecommended: value })
              }
            >
              추천 전시회로 표시
            </Checkbox>
            {/* 티켓판매로 표시 + 무료티켓 전체수량 UI 개선 (가로 정렬) */}
            <div className="flex flex-row items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 w-fit mb-2">
              <Checkbox
                id="isSale"
                isSelected={editedExhibition.isSale||false}
                onValueChange={(value) =>
                  setEditedExhibition({
                    ...editedExhibition,
                    isSale: value,
                    free_ticket_limit:
                      value && (editedExhibition.free_ticket_limit === undefined || editedExhibition.free_ticket_limit === '' || isNaN(Number(editedExhibition.free_ticket_limit)))
                        ? 0
                        : editedExhibition.free_ticket_limit,
                  })
                }
                className="whitespace-nowrap"
              >
                티켓판매로 표시
              </Checkbox>
              <Input
                type="number"
                min={1}
                step={1}
                size="sm"
                label=""
                value={editedExhibition.free_ticket_limit ?? 0}
                onValueChange={(v) => setEditedExhibition({ ...editedExhibition, free_ticket_limit: v.replace(/[^0-9]/g, '') })}
                isDisabled={!editedExhibition.isSale}
                placeholder="티켓수량 (예: 100)"
                className="w-40 border border-blue-300 bg-white px-2 py-1 rounded-md"
                style={{minWidth:'160px'}}
              />
            </div>
            <span className="text-xs text-gray-500 mt-1 ml-1 mb-2 block">무료티켓 수량을 입력하세요</span>
            <Checkbox
              id="pick"
              isSelected={editedExhibition.pick || false}
              onValueChange={(value) =>
                setEditedExhibition({ ...editedExhibition, pick: value })
              }
            >
              예술랭픽
            </Checkbox>
          </div>
        </div>

        {/* QR 코드 섹션 - 편집 모드가 아닌 경우에만 표시 */}
        {!isNewExhibition && !isEditing && (
          <div className="flex flex-col items-center gap-5 col-span-2 border border-gray-200 p-6 rounded-lg mt-6 bg-gradient-to-b from-gray-50 to-white shadow-sm">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">리뷰 페이지 QR 코드</h3>
              <p className="text-sm text-gray-600">
                아래 QR 코드를 스캔하면 전시회 리뷰 페이지로 이동합니다
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
                전시회 안내판이나 홍보 자료에 이 QR 코드를 사용하여 방문객들이 쉽게 리뷰를 작성할 수 있도록 하세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
