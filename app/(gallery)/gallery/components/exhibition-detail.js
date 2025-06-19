"use client";

import React, { useState, useEffect } from "react";
import { Input, Button, Textarea, Checkbox, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import dynamic from "next/dynamic";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ko from "date-fns/locale/ko";

// Froala 에디터를 동적으로 임포트
const FroalaEditor = dynamic(
  () => import("@/app/(admin)/admin/components/Froala"),
  {
    ssr: false,
    loading: () => <p>에디터 로딩 중...</p>
  }
);

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
        (blob) => {
          // webp base64로 변환
          const reader2 = new FileReader();
          reader2.onloadend = () => {
            resolve(reader2.result);
          };
          reader2.readAsDataURL(blob);
        },
        'image/webp',
        0.8
      );
    };
    reader.readAsDataURL(file);
  });
}

export function ExhibitionDetail({
  galleryInfo,
  exhibition = {},
  onUpdate,
  onDelete,
  isNew = false,
  onSave,
  onCancel,
  isReadOnly = false,
  isEdit = false,
  selectedKey,
}) {
  const emptyExhibition = {
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
    naver_gallery_url: "",
    price: 0,
  };

  const [editedExhibition, setEditedExhibition] = useState(
    isNew ? emptyExhibition : exhibition
  );
  const [imagePreview, setImagePreview] = useState(
    isNew ? null : exhibition?.photo || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();
  const [step, setStep] = useState(1);

  // selectedKey나 exhibition이 변경될 때 필요한 데이터 로드
  useEffect(() => {
    if (exhibition && !isNew) {
      setEditedExhibition(exhibition);
      setImagePreview(exhibition.photo || null);
    }
  }, [selectedKey, exhibition, isNew]);
  
  // 저장 핸들러 - 내용이 변경되면 자동으로 저장
  const handleSave = async (e) => {
    if (e) e.preventDefault(); // form submit 방지
    if (isSaving) return; // 중복 실행 방지
    setIsSaving(true);
    try {
      if (isNew) {
        if (onSave) {
          onSave(editedExhibition);
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      } else {
        if (onUpdate) {
          onUpdate(editedExhibition);
        }
      }
    } catch (error) {
      console.log("전시회 저장 중 오류 발생:", error);
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "전시회 정보 저장 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
      addToast({
        title: "전시회 저장 완료",
        description: "전시회 정보가 성공적으로 저장되었습니다.",
        color: "success",
      });
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    if (isNew) {
      if (onCancel) onCancel();
    } else {
      setEditedExhibition(exhibition);
      setImagePreview(exhibition.photo || null);
      if (onCancel) onCancel();
    }
  };

  // 삭제 핸들러
  const handleDelete = () => {
    if (window.confirm("정말로 이 전시회를 삭제하시겠습니까?")) {
      if (onDelete) onDelete();
    }
  };

  // 필드 변경 핸들러
  const handleFieldChange = (field, value) => {
    const updatedExhibition = { ...editedExhibition, [field]: value };
    setEditedExhibition(updatedExhibition);
    // 여기서 변경사항 즉시 저장하지 않고, 사용자가 저장 버튼을 누를 때 저장하도록 변경
  };

  // handleImageChange에서 webp 변환 적용
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const webpBase64 = await fileToWebP(file);
      setImagePreview(webpBase64);
      handleFieldChange("photo", webpBase64);
    }
  };
  console.log("editedExhibition", editedExhibition);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isNew ? "신규 전시회 등록" : "전시회 정보"}
        </h2>
        {!isReadOnly && step !== 2 && (
          <div className="flex gap-2">
            {(!isNew || step === 2) && (
              <Button color="primary" onClick={handleSave} isLoading={isSaving} type="button">
                <Icon icon="lucide:save" className="text-lg mr-1" />
                {isNew ? "등록" : "수정한내용저장"}
              </Button>
            )}
            {!isNew && (
              <Button color="danger" variant="flat" onClick={handleDelete}>
                <Icon icon="lucide:trash" className="mr-1" />
                삭제
              </Button>
            )}
            <Button color="default" variant="flat" onClick={handleCancel}>
              취소
            </Button>
          </div>
        )}
      </div>
      {isNew ? (
        step === 1 ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {/* <Input
                label="갤러리명"
                value={galleryInfo?.name || ""}
                onValueChange={(value) => handleFieldChange("name", value)}
                isDisabled
              /> */}
              <Input
                label="전시회명"
                value={editedExhibition.contents || ""}
                onValueChange={(value) => handleFieldChange("contents", value)}
                isReadOnly={isReadOnly}
                className="border-2 border-gray-400 focus:border-blue-500 focus:outline-none"
              />
              <div className="relative">
                <label className="text-small font-medium block mb-2">전시시작 *</label>
                <div className="relative">
                  <DatePicker
                    selected={
                      editedExhibition.start_date
                        ? new Date(
                            editedExhibition.start_date.slice(0, 4),
                            parseInt(editedExhibition.start_date.slice(4, 6)) - 1,
                            parseInt(editedExhibition.start_date.slice(6, 8))
                          )
                        : null
                    }
                    onChange={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const day = String(date.getDate()).padStart(2, "0");
                        handleFieldChange("start_date", `${year}${month}${day}`);
                      }
                    }}
                    locale={ko}
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
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <Icon icon="lucide:calendar" className="text-gray-500 text-xl" />
                        </div>
                      </div>
                    }
                    popperClassName="react-datepicker-popper"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-small font-medium block mb-2">전시종료 *</label>
                <div className="relative">
                  <DatePicker
                    selected={
                      editedExhibition.end_date
                        ? new Date(
                            editedExhibition.end_date.slice(0, 4),
                            parseInt(editedExhibition.end_date.slice(4, 6)) - 1,
                            parseInt(editedExhibition.end_date.slice(6, 8))
                          )
                        : null
                    }
                    onChange={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const day = String(date.getDate()).padStart(2, "0");
                        handleFieldChange("end_date", `${year}${month}${day}`);
                      }
                    }}
                    locale={ko}
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
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <Icon icon="lucide:calendar" className="text-gray-500 text-xl" />
                        </div>
                      </div>
                    }
                    popperClassName="react-datepicker-popper"
                  />
                </div>
              </div>

              <Input
                label="운영 시간"
                value={editedExhibition.working_hour || ""}
                onValueChange={(value) => handleFieldChange("working_hour", value)}
                isReadOnly={isReadOnly}
                placeholder="예: 10:00 - 18:00"
                className="border-2 border-gray-400 focus:border-blue-500 focus:outline-none"
              />

              <Input
                label="휴관일"
                value={editedExhibition.off_date || ""}
                onValueChange={(value) => handleFieldChange("off_date", value)}
                isReadOnly={isReadOnly}
                placeholder="예: 매주 월요일"
                className="border-2 border-gray-400 focus:border-blue-500 focus:outline-none"
              />

              {/* <Input
                label="네이버 갤러리 URL"
                value={galleryInfo?.url || ""}
                onValueChange={(value) =>
                  handleFieldChange("naver_gallery_url", value)
                }
                isReadOnly={isReadOnly}
                isDisabled
              /> */}

              <Input
                label="홈페이지 URL"
                value={editedExhibition.homepage_url || ""}
                onValueChange={(value) => handleFieldChange("homepage_url", value)}
                isReadOnly={isReadOnly}
                className="border-2 border-gray-400 focus:border-blue-500 focus:outline-none"
              />

              <Input
                type="number"
                label="가격 (원)"
                value={editedExhibition.price || 0}
                onValueChange={(value) => handleFieldChange("price", value)}
                isReadOnly={isReadOnly}
                className="border-2 border-gray-400 focus:border-blue-500 focus:outline-none"
              />

              <div className="flex flex-col gap-2">
                <span className="text-small font-medium">옵션</span>
                <div className="flex flex-col gap-2">
                  <Checkbox
                    isSelected={editedExhibition.isFree || false}
                    onValueChange={(value) => handleFieldChange("isFree", value)}
                    isDisabled={isReadOnly}
                  >
                    무료 전시회
                  </Checkbox>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-small font-medium">포스터 이미지</label>
                  <Button 
                    color="primary" 
                    variant="flat" 
                    size="sm"
                    as="a" 
                    href="/sample/guide.jpg"
                    download
                  >
                    <Icon icon="lucide:info" />
                    가이드 라인
                  </Button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center">
                  {imagePreview ? (
                    <div className="relative w-full">
                      <img
                        src={imagePreview}
                        alt="포스터 이미지"
                        className="w-full h-48 object-cover rounded-md"
                      />
                      {!isReadOnly && (
                        <Button
                          isIconOnly
                          color="danger"
                          variant="flat"
                          size="sm"
                          className="absolute top-2 right-2"
                          onPress={() => {
                            setImagePreview(null);
                            handleFieldChange("photo", "");
                          }}
                        >
                          <Icon icon="lucide:x" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <Icon
                        icon="lucide:image"
                        className="text-4xl text-gray-400 mb-2"
                      />
                      <p className="text-sm text-gray-500">이미지 미리보기</p>
                    </>
                  )}
                  {!isReadOnly && (
                    <div className="mt-4">
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label htmlFor="photo-upload">
                        <Button as="span" color="primary" variant="flat" size="sm">
                          <Icon icon="lucide:upload" className="mr-1" />
                          이미지 {imagePreview ? "변경" : "업로드"}
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={onCancel} variant="light">취소</Button>
                <Button color="primary" onClick={() => setStep(2)}>다음</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full">
            <label className="text-small font-medium block mb-2">추가 정보</label>
            <FroalaEditor
              value={editedExhibition.add_info || ""}
              onChange={(content) => handleFieldChange("add_info", content)}
              placeholder="전시회에 대한 상세 정보를 입력하세요."
              height={300}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => setStep(1)} variant="outline">이전</Button>
              <Button color="primary" onClick={handleSave} isLoading={isSaving}>수정한내용저장</Button>
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* <Input
            label="갤러리명"
            value={galleryInfo?.name || ""}
            onValueChange={(value) => handleFieldChange("name", value)}
            isDisabled
          /> */}

          <Input
            label="전시회명"
            value={editedExhibition.contents || ""}
            onValueChange={(value) => handleFieldChange("contents", value)}
            isReadOnly={isReadOnly}
            className="border-2 border-gray-400 focus:border-blue-500 focus:outline-none"
          />

          <div className="relative">
            <label className="text-small font-medium block mb-2">전시시작 *</label>
            <div className="relative">
              <DatePicker
                selected={
                  editedExhibition.start_date
                    ? new Date(
                        editedExhibition.start_date.slice(0, 4),
                        parseInt(editedExhibition.start_date.slice(4, 6)) - 1,
                        parseInt(editedExhibition.start_date.slice(6, 8))
                      )
                    : null
                }
                onChange={(date) => {
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    handleFieldChange("start_date", `${year}${month}${day}`);
                  }
                }}
                locale={ko}
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
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Icon icon="lucide:calendar" className="text-gray-500 text-xl" />
                    </div>
                  </div>
                }
                popperClassName="react-datepicker-popper"
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-small font-medium block mb-2">전시종료 *</label>
            <div className="relative">
              <DatePicker
                selected={
                  editedExhibition.end_date
                    ? new Date(
                        editedExhibition.end_date.slice(0, 4),
                        parseInt(editedExhibition.end_date.slice(4, 6)) - 1,
                        parseInt(editedExhibition.end_date.slice(6, 8))
                      )
                    : null
                }
                onChange={(date) => {
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    handleFieldChange("end_date", `${year}${month}${day}`);
                  }
                }}
                locale={ko}
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
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Icon icon="lucide:calendar" className="text-gray-500 text-xl" />
                    </div>
                  </div>
                }
                popperClassName="react-datepicker-popper"
              />
            </div>
          </div>

          <Input
            label="운영 시간"
            value={editedExhibition.working_hour || ""}
            onValueChange={(value) => handleFieldChange("working_hour", value)}
            isReadOnly={isReadOnly}
            placeholder="예: 10:00 - 18:00"
            className="border-2 border-gray-400 focus:border-blue-500 focus:outline-none"
          />

          <Input
            label="휴관일"
            value={editedExhibition.off_date || ""}
            onValueChange={(value) => handleFieldChange("off_date", value)}
            isReadOnly={isReadOnly}
            placeholder="예: 매주 월요일"
            className="border-2 border-gray-400 focus:border-blue-500 focus:outline-none"
          />

          {/* <Input
            label="네이버 갤러리 URL"
            value={galleryInfo?.url || ""}
            onValueChange={(value) =>
              handleFieldChange("naver_gallery_url", value)
            }
            isReadOnly={isReadOnly}
            isDisabled
          /> */}

          <Input
            label="홈페이지 URL"
            value={editedExhibition.homepage_url || ""}
            onValueChange={(value) => handleFieldChange("homepage_url", value)}
            isReadOnly={isReadOnly}
            className="border-2 border-gray-400 focus:border-blue-500 focus:outline-none"
          />

          <Input
            type="number"
            label="가격 (원)"
            value={editedExhibition.price || 0}
            onValueChange={(value) => handleFieldChange("price", value)}
            isReadOnly={isReadOnly}
            className="border-2 border-gray-400 focus:border-blue-500 focus:outline-none"
          />

          <div className="flex flex-col gap-2">
            <span className="text-small font-medium">옵션</span>
            <div className="flex flex-col gap-2">
              <Checkbox
                isSelected={editedExhibition.isFree || false}
                onValueChange={(value) => handleFieldChange("isFree", value)}
                isDisabled={isReadOnly}
              >
                무료 전시회
              </Checkbox>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-small font-medium">포스터 이미지</label>
              <Button 
                color="primary" 
                variant="flat" 
                size="sm"
                as="a" 
                href="/sample/guide.jpg"
                download
              >
                <Icon icon="lucide:info" />
                가이드 라인
              </Button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center">
              {imagePreview ? (
                <div className="relative w-full">
                  <img
                    src={imagePreview}
                    alt="포스터 이미지"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  {!isReadOnly && (
                    <Button
                      isIconOnly
                      color="danger"
                      variant="flat"
                      size="sm"
                      className="absolute top-2 right-2"
                      onPress={() => {
                        setImagePreview(null);
                        handleFieldChange("photo", "");
                      }}
                    >
                      <Icon icon="lucide:x" />
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <Icon
                    icon="lucide:image"
                    className="text-4xl text-gray-400 mb-2"
                  />
                  <p className="text-sm text-gray-500">이미지 미리보기</p>
                </>
              )}
              {!isReadOnly && (
                <div className="mt-4">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="photo-upload">
                    <Button as="span" color="primary" variant="flat" size="sm">
                      <Icon icon="lucide:upload" className="mr-1" />
                      이미지 {imagePreview ? "변경" : "업로드"}
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isNew && (
        <div className="border-t pt-4 mt-6">
          <h3 className="text-lg font-medium mb-2">리뷰 통계</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-default-100 p-4 rounded-lg">
              <p className="text-sm text-default-600">평균 평점</p>
              <p className="text-2xl font-bold">
                {(editedExhibition.review_average || 0).toFixed(1)}
                <span className="text-sm font-normal ml-1">/ 5.0</span>
              </p>
            </div>
            <div className="bg-default-100 p-4 rounded-lg">
              <p className="text-sm text-default-600">리뷰 수</p>
              <p className="text-2xl font-bold">
                {(editedExhibition.review_count || 0).toLocaleString()}개
              </p>
            </div>
          </div>
        </div>
      )}

      {false && (
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onCancel} variant="light">취소</Button>
          <Button color="primary" onClick={handleSave} isLoading={isSaving} type="button">등록</Button>
        </div>
      )}

      <style jsx global>{`
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker {
          font-family: 'Noto Sans KR', sans-serif;
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          background: white;
          font-size: 0.875rem;
        }
        .react-datepicker__header {
          background-color: white;
          border-bottom: 1px solid #e5e7eb;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          padding: 1rem;
        }
        .react-datepicker__current-month {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        .react-datepicker__day-names {
          display: flex;
          justify-content: space-around;
          margin-bottom: 0.5rem;
        }
        .react-datepicker__day-name {
          color: #9CA3AF;
          width: 2rem;
          font-size: 0.875rem;
        }
        .react-datepicker__month {
          margin: 0;
          padding: 0.5rem;
        }
        .react-datepicker__week {
          display: flex;
          justify-content: space-around;
        }
        .react-datepicker__day {
          width: 2rem;
          height: 2rem;
          line-height: 2rem;
          border-radius: 50%;
          margin: 0;
          color: #374151;
          font-size: 0.875rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .react-datepicker__day:hover {
          background-color: #F3F4F6;
        }
        .react-datepicker__day--selected {
          background-color: #2563EB !important;
          color: white !important;
          font-weight: 500;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #DBEAFE;
          color: #2563EB;
        }
        .react-datepicker__day--outside-month {
          color: #D1D5DB;
        }
        .react-datepicker__navigation {
          top: 1rem;
          width: 2rem;
          height: 2rem;
          border: none;
        }
        .react-datepicker__navigation--previous {
          left: 1rem;
        }
        .react-datepicker__navigation--next {
          right: 1rem;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #6B7280;
          border-width: 2px 2px 0 0;
          width: 8px;
          height: 8px;
        }
        .react-datepicker__triangle {
          display: none;
        }
      `}</style>
    </div>
  );
}
