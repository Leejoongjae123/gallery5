import React, { useState, useEffect } from "react";
import { Input, Button, Textarea, Checkbox, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";

// HTML 태그 제거 함수
function stripHtmlTags(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '');
}

export function GalleryDetail({ galleryId }) {
  const [gallery, setGallery] = useState(null);
  const [editedGallery, setEditedGallery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = React.useRef(null);
  
  // Supabase 클라이언트 생성
  const supabase = createClient();
  
  // 현재 로그인한 사용자 정보 가져오기
  const getUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(user);
      return user;
    } catch (error) {
      console.error('사용자 정보를 가져오는 중 오류 발생:', error);
      return null;
    }
  };
  
  // 갤러리 데이터 불러오기
  const fetchGallery = async () => {
    setIsLoading(true);
    try {
      // 먼저 사용자 정보 가져오기
      const currentUser = await getUser();
      
      if (!currentUser) {
        throw new Error('사용자 정보를 가져올 수 없습니다.');
      }
      
      // 사용자의 account_id와 일치하는 갤러리 찾기
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('account_id', currentUser.id)
        .single();
      
      if (error) throw error;
      
      setGallery(data);
      setEditedGallery(data);
    } catch (error) {
      console.error('갤러리 데이터를 불러오는 중 오류 발생:', error);
      setSaveMessage("갤러리 데이터를 불러오는 중 오류가 발생했습니다.");
      onOpen();
    } finally {
      setIsLoading(false);
    }
  };
  console.log('gallery:',gallery);
  
  // 초기 데이터 로드
  useEffect(() => {
    fetchGallery();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('gallery')
        .update(editedGallery)
        .eq('id', editedGallery.id);
      
      if (error) throw error;
      
      setGallery(editedGallery);
      setSaveMessage("갤러리 정보가 성공적으로 저장되었습니다.");
      onOpen();
    } catch (error) {
      console.error('갤러리 정보 저장 중 오류 발생:', error);
      setSaveMessage("갤러리 정보 저장 중 오류가 발생했습니다.");
      onOpen();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("정말로 이 갤러리를 삭제하시겠습니까?")) {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('gallery')
          .delete()
          .eq('id', gallery.id);
        
        if (error) throw error;
        
        setSaveMessage("갤러리가 성공적으로 삭제되었습니다.");
        onOpen();
      } catch (error) {
        console.error('갤러리 삭제 중 오류 발생:', error);
        setSaveMessage("갤러리 삭제 중 오류가 발생했습니다.");
        onOpen();
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  if (isLoading && !gallery) {
    return <div className="flex justify-center items-center h-40">데이터를 불러오는 중...</div>;
  }
  
  if (!gallery) {
    return <div className="flex justify-center items-center h-40">갤러리 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="space-y-6 ">
      <div className="flex items-center justify-center relative">
        <h1 className="text-2xl font-bold text-center w-full">갤러리 관리</h1>
        <div className="absolute right-0 top-1 flex gap-2">
          {isEditing ? (
            <Button color="primary" onPress={handleSave} isLoading={isLoading}>
              <Icon icon="lucide:save" className="text-lg mr-1" />
              저장
            </Button>
          ) : (
            <Button color="primary" onPress={() => setIsEditing(true)}>
              <Icon icon="lucide:edit" className="text-lg mr-1" />
              수정
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Input
          label="갤러리 이름"
          value={editedGallery.name}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, name: value })
          }
          placeholder="갤러리의 공식 이름을 입력하세요"
          className="w-full"
          isReadOnly={!isEditing}
        />
        <Input
          label="주소"
          value={editedGallery.address}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, address: value })
          }
          placeholder="갤러리의 실제 주소를 입력하세요"
          className="w-full"
          isReadOnly={!isEditing}
        />
        <Input
          label="전화번호"
          value={editedGallery.phone}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, phone: value })
          }
          placeholder="연락 가능한 전화번호를 입력하세요"
          className="w-full"
          isReadOnly={!isEditing}
        />
        <Input
          label="영업시간"
          value={editedGallery.workinghour}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, workinghour: value })
          }
          placeholder="예: 10:00 - 18:00 (월-금)"
          className="w-full"
          isReadOnly={!isEditing}
        />
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium">썸네일 이미지</label>
            {editedGallery.thumbnail && (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={() => {
                  setEditedGallery({ ...editedGallery, thumbnail: "" });
                }}
                isDisabled={!isEditing}
              >
                <Icon icon="lucide:trash-2" className="text-sm mr-1" />
                이미지 삭제
              </Button>
            )}
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-36 h-36 border border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
              {editedGallery.thumbnail ? (
                <img
                  src={editedGallery.thumbnail}
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
            <div className="flex-1 space-y-2">
              {isEditing && (
                <Button
                  className="w-full"
                  color="primary"
                  variant="flat"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon icon="lucide:upload" className="text-lg mr-1" />
                  이미지 선택
                </Button>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  function fileToWebP(file) {
                    return new Promise((resolve) => {
                      const img = new window.Image();
                      const reader = new FileReader();
                      reader.onload = (ev) => { img.src = ev.target.result; };
                      img.onload = () => {
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
                          0.8
                        );
                      };
                      reader.readAsDataURL(file);
                    });
                  }
                  const webpBlob = await fileToWebP(file);
                  const supabase = createClient();
                  const fileName = `${Date.now()}.webp`;
                  const filePath = `gallery/${fileName}`;
                  const { data, error } = await supabase.storage
                    .from("gallery")
                    .upload(filePath, webpBlob, {
                      contentType: 'image/webp',
                      cacheControl: '3600',
                      upsert: false
                    });
                  if (error) {
                    alert('이미지 업로드 오류: ' + error.message);
                    return;
                  }
                  const { data: { publicUrl } } = supabase.storage
                    .from("gallery")
                    .getPublicUrl(filePath);
                  setEditedGallery({ ...editedGallery, thumbnail: publicUrl });
                }}
                className="hidden"
                disabled={!isEditing}
              />
              <p className="text-xs text-gray-500">
                5MB 이하의 이미지 파일을 선택해주세요. (JPG, PNG, GIF)
              </p>
              {isEditing && (
                <Input
                  size="sm"
                  label="또는 이미지 URL 직접 입력"
                  value={editedGallery.thumbnail || ""}
                  onValueChange={(value) => {
                    setEditedGallery({ ...editedGallery, thumbnail: value });
                  }}
                  placeholder="https://example.com/image.jpg"
                  isDisabled={false}
                />
              )}
            </div>
          </div>
        </div>
        <Input
          label="홈페이지 URL"
          value={editedGallery.homepage_url}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, homepage_url: value })
          }
          placeholder="갤러리 공식 웹사이트 URL을 입력하세요"
          className="w-full"
          isReadOnly={!isEditing}
        />
        <Textarea
          label="추가 정보"
          value={stripHtmlTags(editedGallery.add_info || "")}
          onValueChange={(value) =>
            setEditedGallery({ ...editedGallery, add_info: stripHtmlTags(value) })
          }
          placeholder="방문객들에게 알리고 싶은 추가 정보를 입력하세요"
          className="w-full"
          isReadOnly={!isEditing}
        />
      </div>

      <div className="flex justify-end mt-4">
        <p className="text-sm text-gray-500 italic">
          수정 후 저장 버튼을 클릭하세요
        </p>
      </div>
      
      {/* 저장 결과 알림 모달 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>알림</ModalHeader>
          <ModalBody>
            {saveMessage}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={onClose}>
              확인
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
