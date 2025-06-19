"use client";
import React from "react";
import { Input, Button, Textarea, Checkbox, addToast, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";

export function ProductDetail({
  product,
  onUpdate,
  selectedKeys,
  setSelectedKeys,
  onRefresh,
  refreshToggle,
  setRefreshToggle,
  selectedProduct,
  setSelectedProduct,
}) {
  // 상품 ID가 없으면 신규 등록 모드로 간주
  const isNewProduct = !product.id;
  // 항상 편집 가능하도록 isEditing 상태 제거
  const [editedProduct, setEditedProduct] = React.useState(product);
  // 이전 상품 ID를 저장하는 ref
  const prevProductIdRef = React.useRef(null);
  const supabase = createClient();
  
  // 이미지 업로드 관련 상태
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [artists, setArtists] = useState([]);

  // 삭제 확인 모달
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    // 아티스트 목록 가져오기
    const fetchArtists = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, artist_name, username')
        .eq('isArtist', true)
        .order('artist_name', { ascending: true });

      if (error) {
        console.log('아티스트 목록 조회 중 오류:', error);
      } else {
        setArtists(data || []);
      }
    };

    fetchArtists();
  }, []);

  useEffect(() => {
    // 상품 데이터가 변경되었거나 처음 로드된 경우 처리
    if (prevProductIdRef.current !== product.id) {
      // 상품이 변경되면 editedProduct 상태 업데이트
      setEditedProduct(product);

      // 이전 상품 ID 업데이트
      prevProductIdRef.current = product.id;

      // 이미지 미리보기 설정
      if (product.image && Array.isArray(product.image)) {
        setImagePreviews(product.image);
      } else {
        setImagePreviews([]);
      }
    }
  }, [product]);

  // 이미지 파일 변경 핸들러
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // 파일 유효성 검사
    const validFiles = files.filter(file => {
      // 파일 유형 체크
      if (!file.type.includes("image")) {
        addToast({
          title: "이미지 업로드 오류",
          description: `${file.name}은(는) 이미지 파일이 아닙니다.`,
          color: "danger",
        });
        return false;
      }

      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          title: "이미지 업로드 오류",
          description: `${file.name}의 크기가 5MB를 초과합니다.`,
          color: "danger",
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setImageFiles(prevFiles => [...prevFiles, ...validFiles]);

    // 이미지 미리보기 생성
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
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

  // 이미지 업로드 함수
  const uploadImages = async () => {
    if (imageFiles.length === 0) return null;
    try {
      setIsUploading(true);
      const uploadedUrls = [...(editedProduct.image || [])]; // 기존 이미지 URL 유지
      // 새 이미지 파일 업로드
      for (const file of imageFiles) {
        // WebP 변환
        const webpBlob = await fileToWebP(file);
        const fileName = `${uuidv4()}.webp`;
        const filePath = `product/${fileName}`;
        // Supabase Storage에 이미지 업로드
        const { data, error } = await supabase.storage
          .from("product")
          .upload(filePath, webpBlob, {
            contentType: 'image/webp',
          });
        if (error) throw error;
        // 공개 URL 가져오기
        const {
          data: { publicUrl },
        } = supabase.storage.from("product").getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }
      return uploadedUrls;
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

  // 특정 이미지 삭제 핸들러
  const handleRemoveImage = (index) => {
    // 미리보기 배열에서 제거
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);

    // 업로드 대기 중인 파일 배열에서도 제거 (인덱스가 맞지 않을 수 있으므로 조심스럽게 처리)
    if (index < imageFiles.length) {
      const newFiles = [...imageFiles];
      newFiles.splice(index, 1);
      setImageFiles(newFiles);
    }

    // 이미 업로드된 이미지 URL 배열에서도 제거
    const newImages = editedProduct.image ? [...editedProduct.image] : [];
    if (index < newImages.length) {
      // 스토리지에서 실제 파일 삭제 처리는 하지 않음 (복잡도 증가)
      newImages.splice(index, 1);
      setEditedProduct({...editedProduct, image: newImages});
    }
  };

  const handleSave = async () => {
    // 필수 항목 검사
    if (!editedProduct.name || !editedProduct.name.trim()) {
      addToast({
        title: "상품 저장 중 오류 발생",
        description: "작품명을 입력해주세요.",
        color: "danger",
      });
      return;
    }

    try {
      setIsUploading(true);

      // 이미지 업로드 처리
      let imageUrls = editedProduct.image || [];
      if (imageFiles.length > 0) {
        const uploadedUrls = await uploadImages();
        if (uploadedUrls) {
          imageUrls = uploadedUrls;
        }
      }

      // 상품 데이터 저장
      const productData = {
        name: editedProduct.name,
        price: Number(editedProduct.price) || 0,
        size: editedProduct.size || "",
        artist_id: editedProduct.artist_id || null,
        image: imageUrls,
        make_method: editedProduct.make_method || "",
        make_material: editedProduct.make_material || "",
        make_frame: editedProduct.make_frame || "",
        isRecommended: editedProduct.isRecommended || false,
        isTopOfWeek: editedProduct.isTopOfWeek || false,
        make_date: editedProduct.make_date || "null",
        genre: editedProduct.genre || "null"
      };

      let result;
      if (isNewProduct) {
        // 새 상품 생성
        result = await supabase
          .from("product")
          .insert(productData)
          .select()
          .single();
      } else {
        // 기존 상품 업데이트
        result = await supabase
          .from("product")
          .update(productData)
          .eq("id", editedProduct.id)
          .select()
          .single();
      }

      const { data, error } = result;

      if (error) throw error;

      // 상태 업데이트
      setEditedProduct(data);
      setImageFiles([]);
      
      // 성공 메시지
      addToast({
        title: isNewProduct ? "상품 등록 완료" : "상품 수정 완료",
        description: `${data.name} 상품이 성공적으로 ${isNewProduct ? "등록" : "수정"}되었습니다.`,
        color: "success",
      });

      // 목록 새로고침
      if (setRefreshToggle) {
        setRefreshToggle(prev => prev + 1);
      }

      // 신규 등록이었으면 목록에서 해당 항목 선택
      if (isNewProduct && setSelectedKeys && data) {
        setSelectedKeys(new Set([data.id.toString()]));
        onUpdate(data);
      } else {
        onUpdate(data);
      }
    } catch (error) {
      console.log("상품 저장 중 오류:", error);
      addToast({
        title: "상품 저장 오류",
        description: error.message,
        color: "danger",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!editedProduct.id) return;

    // 모달 열기
    onOpen();
  };

  const confirmDelete = async () => {
    try {
      setIsUploading(true);

      // 상품 삭제
      const { error } = await supabase
        .from("product")
        .delete()
        .eq("id", editedProduct.id);

      if (error) throw error;

      // 성공 메시지
      addToast({
        title: "상품 삭제 완료",
        description: `${editedProduct.name} 상품이 삭제되었습니다.`,
        color: "success",
      });

      // 목록 새로고침
      if (setRefreshToggle) {
        setRefreshToggle(prev => prev + 1);
      }

      // 선택 초기화
      if (setSelectedKeys) {
        setSelectedKeys(new Set([]));
      }
      
      // 부모 컴포넌트에 null 전달
      onUpdate(null);
      
      // 모달 닫기
      onClose();
    } catch (error) {
      console.log("상품 삭제 중 오류:", error);
      addToast({
        title: "상품 삭제 오류",
        description: error.message,
        color: "danger",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (isNewProduct) {
      // 신규 등록 취소 시 부모 컴포넌트에 null 전달
      onUpdate(null);
      if (setSelectedKeys) {
        setSelectedKeys(new Set([]));
      }
    } else {
      // 기존 상품 편집 취소 시 원래 데이터로 복원
      setEditedProduct(product);
      setImageFiles([]);
      
      // 이미지 미리보기 복원
      if (product.image && Array.isArray(product.image)) {
        setImagePreviews(product.image);
      } else {
        setImagePreviews([]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 상단 버튼 영역 */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          {isNewProduct 
            ? "신규 상품 등록" 
            : editedProduct.name}
        </h2>
        <div className="flex gap-2">
          <Button
            color="primary"
            onClick={handleSave}
            isLoading={isUploading}
            startContent={<Icon icon="heroicons:check" />}
          >
            저장
          </Button>

          {!isNewProduct && (
            <Button
              color="danger"
              onClick={handleDelete}
              startContent={<Icon icon="heroicons:trash" />}
            >
              삭제
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 기본 정보 섹션 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">작품명</label>
            <Input
              value={editedProduct.name || ""}
              onChange={(e) =>
                setEditedProduct({
                  ...editedProduct,
                  name: e.target.value,
                })
              }
              placeholder="작품명을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">가격</label>
            <Input
              type="number"
              value={editedProduct.price || ""}
              onChange={(e) =>
                setEditedProduct({
                  ...editedProduct,
                  price: e.target.value,
                })
              }
              placeholder="가격을 입력하세요"
              startContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">₩</span>
                </div>
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">크기</label>
            <Input
              value={editedProduct.size || ""}
              onChange={(e) =>
                setEditedProduct({
                  ...editedProduct,
                  size: e.target.value,
                })
              }
              placeholder="크기를 입력하세요 (예: 100x100cm)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">장르</label>
            <Input
              value={editedProduct.genre === 'null' ? '' : (editedProduct.genre || '')}
              onChange={(e) =>
                setEditedProduct({
                  ...editedProduct,
                  genre: e.target.value || 'null',
                })
              }
              placeholder="장르를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">제작일</label>
            <Input
              value={editedProduct.make_date === 'null' ? '' : (editedProduct.make_date || '')}
              onChange={(e) =>
                setEditedProduct({
                  ...editedProduct,
                  make_date: e.target.value || 'null',
                })
              }
              placeholder="제작일을 입력하세요"
            />
          </div>

         
        </div>

        {/* 추가 정보 섹션 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">제작 방법</label>
            <Input
              value={editedProduct.make_method || ""}
              onChange={(e) =>
                setEditedProduct({
                  ...editedProduct,
                  make_method: e.target.value,
                })
              }
              placeholder="제작 방법을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">재료</label>
            <Input
              value={editedProduct.make_material || ""}
              onChange={(e) =>
                setEditedProduct({
                  ...editedProduct,
                  make_material: e.target.value,
                })
              }
              placeholder="재료를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">프레임</label>
            <Input
              value={editedProduct.make_frame || ""}
              onChange={(e) =>
                setEditedProduct({
                  ...editedProduct,
                  make_frame: e.target.value,
                })
              }
              placeholder="프레임 정보를 입력하세요"
            />
          </div>

          <div className="flex gap-4">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  isSelected={editedProduct.isRecommended}
                  onChange={() =>
                    setEditedProduct({
                      ...editedProduct,
                      isRecommended: !editedProduct.isRecommended,
                    })
                  }
                />
                <span>추천 작품</span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  isSelected={editedProduct.isTopOfWeek}
                  onChange={() =>
                    setEditedProduct({
                      ...editedProduct,
                      isTopOfWeek: !editedProduct.isTopOfWeek,
                    })
                  }
                />
                <span>이번주 작품</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">등록일</label>
            <p className="text-default-700">
              {editedProduct.created_at
                ? new Date(editedProduct.created_at).toLocaleDateString()
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* 이미지 섹션 */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">이미지</h3>
          <Button
            onClick={() => fileInputRef.current?.click()}
            startContent={<Icon icon="heroicons:photo" />}
          >
            이미지 추가
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {imagePreviews.length > 0 ? (
            imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`작품 이미지 ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                >
                  <Icon icon="heroicons:x-mark" />
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center p-8 bg-gray-100 rounded-lg">
              <Icon icon="heroicons:photo" className="mx-auto text-4xl text-gray-400" />
              <p className="mt-2 text-gray-500">등록된 이미지가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>상품 삭제 확인</ModalHeader>
          <ModalBody>
            <p>정말 <strong>{editedProduct.name}</strong> 상품을 삭제하시겠습니까?</p>
            <p className="text-sm text-gray-500 mt-2">이 작업은 되돌릴 수 없습니다.</p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onClose}>
              취소
            </Button>
            <Button color="danger" onPress={confirmDelete} isLoading={isUploading}>
              삭제
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}