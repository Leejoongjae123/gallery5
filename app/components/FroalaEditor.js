'use client'
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins.pkgd.min.js';
import 'froala-editor/js/plugins/font_size.min.js';
import 'froala-editor/js/plugins/image.min.js';
import 'froala-editor/js/plugins/colors.min.js';
import 'froala-editor/js/plugins/emoticons.min.js';
import 'froala-editor/js/plugins/line_height.min.js';
import 'froala-editor/js/plugins/file.min.js';
import 'froala-editor/js/plugins/table.min.js';
import 'froala-editor/js/plugins/video.min.js';
import 'froala-editor/js/plugins/link.min.js';
import 'froala-editor/js/plugins/lists.min.js';
import 'froala-editor/js/plugins/paragraph_format.min.js';
import 'froala-editor/js/plugins/align.min.js';
import 'froala-editor/js/plugins/quote.min.js';
import 'froala-editor/js/plugins/code_view.min.js';
import 'froala-editor/js/languages/ko.js';

const FroalaEditor = dynamic(
  async () => {
    const mod = await import('react-froala-wysiwyg');
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
  },
  {
    ssr: false,
    loading: () => <p>에디터 로딩 중...</p>
  }
);

const FroalaEditorComponent = ({ 
  value, 
  onChange, 
  placeholder = '내용을 입력해주세요...', 
  height = 400,
  imageUploadURL = null,
  imageUploadParams = {},
  imageUploadMethod = 'POST',
  events = {}
}) => {
  const [editorContent, setEditorContent] = useState(value || '');

  const handleModelChange = (model) => {
    if (model === null) return;
    setEditorContent(model);
    if (onChange) {
      onChange(model);
    }
  };

  const config = {
    placeholderText: placeholder,
    heightMin: height,
    language: 'ko',
    toolbarSticky: true,
    toolbarStickyOffset: 50,
    toolbarButtons: [
      ['fontSize', 'textColor', 'insertImage', 'align'],
      ['undo', 'redo']
    ],
    fontSizeSelection: true,
    fontSizeDefaultSelection: '16',
    fontSize: ['8', '10', '12', '14', '16', '18', '20', '24', '30', '36', '48', '60', '72', '96'],
    imageUploadURL: null,
    imageUploadToS3: false,
    imageUploadMethod: 'POST',
    imageMaxSize: 5 * 1024 * 1024,
    imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    imageUploadParams: {
      ...imageUploadParams,
    },
    imageInsertButtons: ['imageUpload'],
    useClasses: false,
    htmlUseStyle: true,
    imageStyles: {
      'fr-fil': 'style="float: left; margin: 5px 20px 5px 0;"',
      'fr-fic': 'style="text-align: center; display: block; margin: 5px auto;"',
      'fr-fir': 'style="float: right; margin: 5px 0 5px 20px;"'
    },
    paragraphStyles: {
      'fr-text-left': 'text-align: left;',
      'fr-text-center': 'text-align: center;',
      'fr-text-right': 'text-align: right;',
      'fr-text-justify': 'text-align: justify;'
    },
    events: {
      'initialized': function() {
        if (events.initialized) events.initialized();
      },
      'focus': function() {
        if (events.focus) events.focus();
      },
      'blur': function() {
        if (events.blur) events.blur();
      },
      ...events
    },
    pluginsEnabled: ['colors', 'fontSize', 'image', 'align'],
    htmlAllowedEmptyTags: ['textarea', 'a', 'iframe', 'object', 'video', 'style', 'script'],
    htmlDoNotWrapTags: ['script', 'style'],
    htmlSimpleAmpersand: false,
    quickInsertButtons: ['image', 'table', 'ul', 'ol', 'hr'],
    theme: 'royal',
    zIndex: 9999,
    attribution: false,
    preview: false,
    codeView: false,
    licenseKey: 'X-XXXXXXXXXXX-XXXXXXXXX',
  };

  return (
    <div className="froala-editor-container" >
      <FroalaEditor
        tag='textarea'
        model={editorContent}
        onModelChange={handleModelChange}
        config={config}
      />
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
      `}</style>
    </div>
  );
};

export default FroalaEditorComponent; 