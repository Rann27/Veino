import React, { useRef, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Subscript,
  Superscript,
  Essentials,
  Paragraph,
  Heading,
  List,
  Link,
  BlockQuote,
  ImageBlock,
  ImageInsert,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Alignment,
  RemoveFormat,
  SourceEditing,
  GeneralHtmlSupport,
  PasteFromOffice,
  type EditorConfig
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

// Custom Upload Adapter for Laravel Storage
class MyUploadAdapter {
  loader: any;
  xhr?: XMLHttpRequest;
  uploadUrl: string;

  constructor(loader: any, uploadUrl: string) {
    this.loader = loader;
    this.uploadUrl = uploadUrl;
  }

  upload() {
    return this.loader.file.then((file: File) => new Promise((resolve, reject) => {
      this.xhr = new XMLHttpRequest();
      
      this.xhr.open('POST', this.uploadUrl, true);
      
      // Add CSRF token
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (token) {
        this.xhr.setRequestHeader('X-CSRF-TOKEN', token);
      }
      
      this.xhr.responseType = 'json';
      
      this.xhr.addEventListener('load', () => {
        const response = this.xhr!.response;
        
        if (!response || response.error) {
          return reject(response && response.error ? response.error.message : 'Upload failed');
        }
        
        resolve({
          default: response.url
        });
      });
      
      this.xhr.addEventListener('error', () => reject('Upload failed'));
      this.xhr.addEventListener('abort', () => reject('Upload aborted'));
      
      const data = new FormData();
      data.append('upload', file);
      
      this.xhr.send(data);
    }));
  }

  abort() {
    if (this.xhr) {
      this.xhr.abort();
    }
  }
}

function makeUploadAdapterPlugin(uploadUrl: string) {
  return function MyCustomUploadAdapterPlugin(editor: any) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
      return new MyUploadAdapter(loader, uploadUrl);
    };
  };
}

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  uploadUrl?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter content here...",
  height = 400,
  uploadUrl = '/admin/chapters/upload-image',
}: RichTextEditorProps) {
  const editorRef = useRef<ClassicEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  const editorConfig: EditorConfig = {
    // Free GPL license key - untuk development dan open source
    licenseKey: 'GPL',
    plugins: [
      Essentials,
      Bold,
      Italic,
      Underline,
      Strikethrough,
      Code,
      Subscript,
      Superscript,
      Paragraph,
      Heading,
      List,
      Link,
      BlockQuote,
      ImageBlock,
      ImageInsert,
      ImageCaption,
      ImageStyle,
      ImageToolbar,
      ImageUpload,
      Indent,
      IndentBlock,
      Alignment,
      RemoveFormat,
      SourceEditing,
      GeneralHtmlSupport,
      PasteFromOffice,
    ],
    extraPlugins: [makeUploadAdapterPlugin(uploadUrl)],
    toolbar: {
      items: [
        'undo', 'redo',
        '|',
        'heading',
        '|',
        'bold', 'italic', 'underline', 'strikethrough',
        '|',
        'link', 'insertImage', 'blockQuote',
        '|',
        'bulletedList', 'numberedList',
        '|',
        'outdent', 'indent',
        '|',
        'alignment',
        '|',
        'subscript', 'superscript', 'code',
        '|',
        'removeFormat',
        '|',
        'sourceEditing'
      ],
      shouldNotGroupWhenFull: true
    },
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
      ]
    },
    image: {
      toolbar: [
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side',
        '|',
        'imageTextAlternative'
      ]
    },
    link: {
      decorators: {
        openInNewTab: {
          mode: 'manual',
          label: 'Open in a new tab',
          attributes: {
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        }
      }
    },
    placeholder: placeholder,
    htmlSupport: {
      allow: [
        {
          name: /.*/,
          attributes: true,
          classes: true,
          styles: true
        }
      ]
    },
  };

  return (
    <div className="rich-text-editor-wrapper">
      <style>{`
        .ck-editor__editable {
          min-height: ${height}px;
          max-height: ${height * 1.5}px;
          overflow-y: auto;
        }
        
        .ck.ck-editor__main > .ck-editor__editable {
          background-color: white;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
        }
        
        .ck.ck-editor__main > .ck-editor__editable:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .ck-content p,
        .ck-content h1,
        .ck-content h2,
        .ck-content h3,
        .ck-content h4 {
          margin-bottom: 0.75em;
        }

        .ck-content ul,
        .ck-content ol {
          margin-left: 1.5em;
          margin-bottom: 0.75em;
        }

        .ck-content img {
          max-width: 100%;
          height: auto;
        }

        .ck-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin-left: 0;
          font-style: italic;
          color: #6b7280;
        }

        /* Ensure text formatting is visible in CKEditor - More specific selectors */
        .ck.ck-content strong,
        .ck.ck-content b,
        .ck-editor__editable strong,
        .ck-editor__editable b {
          font-weight: bold !important;
        }

        .ck.ck-content em,
        .ck.ck-content i,
        .ck-editor__editable em,
        .ck-editor__editable i,
        .ck-editor__editable_inline em,
        .ck-editor__editable_inline i {
          font-style: italic !important;
        }

        .ck.ck-content u,
        .ck-editor__editable u {
          text-decoration: underline !important;
        }

        .ck.ck-content s,
        .ck.ck-content strike,
        .ck.ck-content del,
        .ck-editor__editable s,
        .ck-editor__editable strike,
        .ck-editor__editable del {
          text-decoration: line-through !important;
        }

        .ck.ck-content sup,
        .ck-editor__editable sup {
          vertical-align: super !important;
          font-size: smaller !important;
        }

        .ck.ck-content sub,
        .ck-editor__editable sub {
          vertical-align: sub !important;
          font-size: smaller !important;
        }

        .ck.ck-content code,
        .ck-editor__editable code {
          background-color: #f3f4f6 !important;
          padding: 0.125em 0.25em !important;
          border-radius: 0.25em !important;
          font-family: 'Courier New', Courier, monospace !important;
        }
        
        /* Override any font-style reset */
        .ck-editor__editable * {
          font-style: inherit;
        }
        
        .ck-editor__editable em *,
        .ck-editor__editable i * {
          font-style: italic !important;
        }

        .rich-text-editor-loading {
          min-height: ${height}px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          color: #6b7280;
        }
      `}</style>
      
      {!isEditorReady && !hasError && (
        <div className="rich-text-editor-loading">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Loading editor...</p>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="border border-red-300 bg-red-50 rounded-md p-4">
          <p className="text-red-700 mb-2">Editor failed to load. Using fallback textarea.</p>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            style={{ minHeight: height }}
            rows={Math.floor(height / 20)}
          />
        </div>
      )}
      
      {!hasError && (
        <div style={{ display: isEditorReady ? 'block' : 'none' }}>
          <CKEditor
            editor={ClassicEditor}
            config={editorConfig}
            data={value}
            onChange={(event, editor) => {
              const data = editor.getData();
              onChange(data);
            }}
            onReady={(editor) => {
              editorRef.current = editor;
              setIsEditorReady(true);
            }}
            onError={(error) => {
              console.error('CKEditor error:', error);
              setHasError(true);
              setIsEditorReady(false);
            }}
          />
        </div>
      )}
      
      <div className="mt-2 text-sm text-gray-500">
        💡 Tips: Paste langsung dari MS Word dengan format, atau gunakan toolbar untuk formatting.
      </div>
    </div>
  );
}
