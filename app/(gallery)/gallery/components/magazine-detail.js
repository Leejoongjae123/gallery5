import React from "react";
import { Input, Button, Textarea, Checkbox, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Icon } from "@iconify/react";

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

export function MagazineDetail({ magazine, onUpdate, onDelete, selectedKey }) {
  const [isEditing, setIsEditing] = React.useState(!magazine.id);
  const [editedMagazine, setEditedMagazine] = React.useState(magazine);
  const [imagePreview, setImagePreview] = React.useState(magazine.thumbnail || null);

  // selectedKey 또는 magazine이 변경될 때마다 매거진 데이터 초기화
  React.useEffect(() => {
    setEditedMagazine(magazine);
    setImagePreview(magazine.thumbnail || null);
    setIsEditing(!magazine.id);  // 새 매거진이면 편집 모드로 설정
  }, [selectedKey, magazine]);

  const handleSave = () => {
    // 실제로는 API 요청을 보낼 것
    const savedMagazine = {
      ...editedMagazine,
      id: editedMagazine.id || Date.now(), // 새 소식인 경우 ID 생성
    };
    onUpdate(savedMagazine);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("정말로 이 소식을 삭제하시겠습니까?")) {
      onDelete();
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const webpBase64 = await fileToWebP(file);
      setImagePreview(webpBase64);
      setEditedMagazine({
        ...editedMagazine,
        thumbnail: webpBase64
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {magazine.id ? "소식 상세 정보" : "새 소식 등록"}
        </h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button color="primary" onPress={handleSave}>
                <Icon icon="lucide:save" className="text-lg mr-1" />
                저장
              </Button>
              {magazine.id && (
                <Button color="default" variant="flat" onPress={() => setIsEditing(false)}>
                  취소
                </Button>
              )}
            </>
          ) : (
            <>
              <Button color="primary" variant="flat" onPress={() => setIsEditing(true)}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="제목"
          value={editedMagazine.title}
          onValueChange={(value) => setEditedMagazine({...editedMagazine, title: value})}
          isReadOnly={!isEditing}
          className="md:col-span-2"
        />

        <div className="space-y-2 md:col-span-2">
          <label className="text-small font-medium">썸네일 이미지</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center">
            {imagePreview ? (
              <div className="relative w-full">
                <img 
                  src={imagePreview} 
                  alt="썸네일 미리보기" 
                  className="w-full h-48 object-cover rounded-md"
                />
                {isEditing && (
                  <Button
                    isIconOnly
                    color="danger"
                    variant="flat"
                    size="sm"
                    className="absolute top-2 right-2"
                    onPress={() => {
                      setImagePreview(null);
                      setEditedMagazine({...editedMagazine, thumbnail: ""});
                    }}
                  >
                    <Icon icon="lucide:x" />
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Icon icon="lucide:image" className="text-4xl text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">이미지 미리보기</p>
              </>
            )}
            {isEditing && (
              <div className="mt-4 ">
                <input
                  type="file"
                  id="thumbnail-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label htmlFor="thumbnail-upload">
                  <Button as="span" color="primary" variant="flat" size="sm">
                    <Icon icon="lucide:upload" className="mr-1" />
                    이미지 {imagePreview ? '변경' : '업로드'}
                  </Button>
                </label>
              </div>
            )}
          </div>
        </div>

        <Textarea
          label="내용"
          value={editedMagazine.summary}
          onValueChange={(value) => setEditedMagazine({...editedMagazine, summary: value})}
          isReadOnly={!isEditing}
          className="md:col-span-2"
        />
      </div>
    </div>
  );
} 