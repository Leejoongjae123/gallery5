//Froala.js
'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { Spinner } from '@heroui/react';

// Supabase 클라이언트 설정
const supabase = createClient();

// FroalaEditor를 동적으로 임포트하는 함수
const getFroalaEditor = (setFroalaError) =>
  dynamic(
    async () => {
      try {
        const mod = await import('react-froala-wysiwyg');
        // CSS 및 플러그인 임포트
        await import('froala-editor/css/froala_style.min.css');
        await import('froala-editor/css/froala_editor.pkgd.min.css');
        await import('froala-editor/js/plugins.pkgd.min.js');
        await import('froala-editor/js/plugins/font_size.min.js');
        await import('froala-editor/js/plugins/image.min.js');
        await import('froala-editor/js/plugins/colors.min.js');
        await import('froala-editor/js/plugins/emoticons.min.js');
        await import('froala-editor/js/plugins/line_height.min.js');
        await import('froala-editor/js/plugins/file.min.js');
        await import('froala-editor/js/plugins/table.min.js');
        await import('froala-editor/js/plugins/video.min.js');
        await import('froala-editor/js/plugins/link.min.js');
        await import('froala-editor/js/plugins/lists.min.js');
        await import('froala-editor/js/plugins/paragraph_format.min.js');
        await import('froala-editor/js/plugins/align.min.js');
        await import('froala-editor/js/plugins/quote.min.js');
        await import('froala-editor/js/plugins/code_view.min.js');
        await import('froala-editor/js/languages/ko.js');
        return mod.default;
      } catch (error) {
        setFroalaError(true);
        console.log('Froala 에디터 로딩 중 오류:', error);
        return null;
      }
    },
    {
      ssr: false,
      loading: () => <Spinner color='primary' variant='wave' />
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
          // webp Blob 반환
          resolve(blob);
        },
        'image/webp',
        0.8
      );
    };
    reader.readAsDataURL(file);
  });
}

const FroalaEditorComponent = ({ 
  value, 
  onChange, 
  placeholder = '내용을 입력해주세요...', 
  height = 400,
  imageUploadURL = null,
  imageUploadParams = {},
  imageUploadMethod = 'POST',
  events = {},
  bucketName = 'exhibition'  // 기본값은 exhibition으로 설정
}) => {
  const [froalaError, setFroalaError] = useState(false);
  const [editorContent, setEditorContent] = useState(value || '');
  const editorRef = useRef(null);
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  // FroalaEditor를 useMemo로 동적으로 생성
  const FroalaEditor = useMemo(() => getFroalaEditor(setFroalaError), [setFroalaError]);

  useEffect(() => {
    setEditorContent(value || '');
  }, [value]);

  // 에디터 로드 확인
  useEffect(() => {
    // 컴포넌트 마운트 시 window 객체 확인
    const isClient = typeof window !== 'undefined';
    setEditorReady(isClient);
    
    // 에디터 참조 확인
    if (editorRef.current && editorRef.current.editor) {
      setIsEditorLoaded(true);
    }
  }, [editorRef.current]);

  const handleModelChange = (model) => {

    setEditorContent(model);
    if (onChange) {
      onChange(model);
    }
  };

  // 이미지 업로드 핸들러 설정
  useEffect(() => {
    let isImageBeingUploaded = false;

    const setupEditor = () => {
      if (editorRef.current && editorRef.current.editor) {
        const editor = editorRef.current.editor;
        setIsEditorLoaded(true);
        
        // 이미지 업로드 커스텀 핸들러 등록
        editor.events.on('image.beforeUpload', async function(images) {
          console.log('이미지 업로드 시작 - 버킷:', bucketName);
          if (isImageBeingUploaded) return false;
          isImageBeingUploaded = true;
          try {
            for (let i = 0; i < images.length; i++) {
              const file = images[i];
              // webp 변환 및 리사이즈
              const webpBlob = await fileToWebP(file);
              const uniqueFileName = `${uuidv4()}.webp`;
              // Supabase에 업로드
              const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(uniqueFileName, webpBlob, {
                  contentType: 'image/webp',
                });
              if (error) {
                console.log('Supabase 업로드 에러:', error);
                continue;
              }
              // 공개 URL 가져오기
              const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(uniqueFileName);
              console.log('업로드된 이미지 URL:', publicUrl);
              editor.image.insert(publicUrl, null, null, editor.image.get());
            }
          } catch (error) {
            console.log('이미지 업로드 중 오류:', error);
          } finally {
            isImageBeingUploaded = false;
          }
          return false;
        });

        // 이미지 드래그&드롭 핸들러
        editor.events.on('image.dropped', async function(images, response) {
          console.log('이미지 드롭됨');
          return false; // 기본 동작 중단
        });

        // 이미지 붙여넣기 핸들러
        editor.events.on('image.paste', async function(images, response) {
          console.log('이미지 붙여넣기');
          return false; // 기본 동작 중단
        });

        // 이미지 업로드 에러 처리
        editor.events.on('image.error', function(error, response) {
          console.error('Froala 이미지 업로드 에러:', error);
          isImageBeingUploaded = false;
        });
      }
    };
    
    if (isEditorLoaded) {
      setupEditor();
    } else {
      const timer = setTimeout(setupEditor, 500);
      return () => clearTimeout(timer);
    }
    
    return () => {
      if (editorRef.current && editorRef.current.editor) {
        try {
          editorRef.current.editor.events.off('image.beforeUpload');
          editorRef.current.editor.events.off('image.dropped');
          editorRef.current.editor.events.off('image.paste');
          editorRef.current.editor.events.off('image.error');
        } catch (error) {
          console.error('이벤트 해제 중 오류:', error);
        }
      }
    };
  }, [isEditorLoaded, bucketName]);

  // 에디터 설정
  const config = {
    placeholderText: placeholder,
    heightMin: height,
    language: 'ko',
    toolbarSticky: true,
    toolbarStickyOffset: 50,
    toolbarButtons: [
      ['bold', 'fontSize', 'textColor', 'insertImage', 'align'],
      ['undo', 'redo']
    ],
    fontSizeSelection: true,
    fontSizeDefaultSelection: '16',
    fontSize: ['16', '20'],
    pastePlain: true,
    
    // 이미지 업로드 설정
    imageUploadURL: null,
    imageUploadToS3: false,
    imageUploadParams: {},
    imageUploadMethod: 'POST',
    imageMaxSize: 5 * 1024 * 1024,
    imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    imageMove: true,
    imageResize: true,
    imageInsertButtons: ['imageUpload'],
    imageEditButtons: ['imageDisplay', 'imageAlign', 'imageRemove'],
    
    // 이미지 처리 관련 추가 설정
    imageDefaultWidth: 'auto',
    imageDefaultDisplay: 'block',
    imageDefaultAlign: 'center',
    imagePaste: false,
    imagePasteProcess: false,
    
    // 정렬 관련 설정 - 클래스 대신 인라인 스타일 사용
    useClasses: false,
    htmlUseStyle: true,
    
    // 이미지 정렬 시 스타일 직접 적용
    imageStyles: {
      'fr-fil': 'style="float: left; margin: 5px 20px 5px 0;"',
      'fr-fic': 'style="text-align: center; display: block; margin: 5px auto;"',
      'fr-fir': 'style="float: right; margin: 5px 0 5px 20px;"'
    },
    
    // 텍스트 정렬 시 스타일 직접 적용
    paragraphStyles: {
      'fr-text-left': 'text-align: left;',
      'fr-text-center': 'text-align: center;',
      'fr-text-right': 'text-align: right;',
      'fr-text-justify': 'text-align: justify;'
    },
    
    events: {
      'initialized': function() {
        // 에디터 초기화 후 실행할 코드
        setIsEditorLoaded(true);
        if (events.initialized) events.initialized();
        
        // 워터마크 요소 제거
        setTimeout(() => {
          const watermarkElements = document.querySelectorAll('.fr-wrapper::before, .fr-wrapper::after, .fr-second-toolbar');
          watermarkElements.forEach(el => {
            if (el) el.style.display = 'none';
          });
        }, 100);
      },
      'contentChanged': function() {
        console.log('Froala 내용 변경됨 (contentChanged 이벤트)');
        const content = this.html.get();
        if (onChange) {
          onChange(content);
        }
      },
      'focus': function() {
        // 에디터에 포커스가 갔을 때 실행할 코드
        if (events.focus) events.focus();
      },
      'blur': function() {
        // 에디터에서 포커스가 빠졌을 때 실행할 코드
        if (events.blur) events.blur();
      },
      ...events
    },
    // 모바일 환경에서의 설정
    pluginsEnabled: [
      'colors', 'fontSize', 'image', 'align', 'bold'
    ],
    // preview 기능 비활성화
    htmlAllowedEmptyTags: ['textarea', 'a', 'iframe', 'object', 'video', 'style', 'script'],
    htmlDoNotWrapTags: ['script', 'style'],
    htmlSimpleAmpersand: false,
    // 미리보기 버튼 제거
    quickInsertButtons: ['image', 'table', 'ul', 'ol', 'hr'],
    // 테마 설정
    theme: 'royal',
    // 커스텀 스타일
    zIndex: 9999,
    attribution: false, // Froala 로고 제거
    // 미리보기 기능 비활성화
    preview: false,
    // 코드 뷰 비활성화 (HTML 미리보기 기능)
    codeView: false,
    // 라이센스 키 설정 (워터마크 제거)
    licenseKey: 'X-XXXXXXXXXXX-XXXXXXXXX',
  };

  return (
     <div className="froala-editor-container col-span-2 w-full w-full">
      {froalaError ? (
        <p>에디터를 불러오는 데 실패했습니다. 새로고침 해주세요.</p>
      ) : editorReady && FroalaEditor && typeof FroalaEditor === 'function' ? (
        <FroalaEditor
          ref={editorRef}
          tag='textarea'
          model={editorContent}
          onModelChange={handleModelChange}
          config={config}
        />
      ) : (
        <p>에디터 로딩 중...</p>
      )}
      <style jsx>{`
        :global(.fr-box) {
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }
        :global(.fr-toolbar) {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          background-color: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }
        :global(.fr-wrapper) {
          background-color: #ffffff;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        :global(.fr-element) {
          font-family: 'Noto Sans KR', sans-serif;
          color: #343a40;
          line-height: 1.6;
        }
        :global(.fr-btn-grp) {
          margin: 0 4px;
        }
        :global(.fr-btn) {
          color: #495057;
          transition: all 0.2s ease;
        }
        :global(.fr-btn:hover) {
          background-color: #e9ecef;
        }
        :global(.fr-active) {
          color: #228be6 !important;
          background: #e7f5ff !important;
        }
        /* 미리보기 관련 요소 숨기기 */
        :global(.fr-preview) {
          display: none !important;
        }
        /* 라이센스 워터마크 숨기기 */
        :global(.fr-wrapper::before),
        :global(.fr-wrapper::after),
        :global(.fr-second-toolbar) {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default FroalaEditorComponent;
