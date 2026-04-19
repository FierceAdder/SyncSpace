import { useState, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './ArticleEditor.css';

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    [{ color: [] }, { background: [] }],
    ['clean'],
  ],
};

const formats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'blockquote', 'code-block',
  'link', 'image', 'color', 'background',
];

export default function ArticleEditor({ value, onChange, placeholder = 'Start writing your article...' }) {
  const [isPreview, setIsPreview] = useState(false);
  const quillRef = useRef(null);

  const wordCount = (value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;

  const charCount = (value || '').replace(/<[^>]*>/g, '').length;

  return (
    <div className="article-editor">
      <div className="article-editor-toolbar-top">
        <div className="article-editor-tabs">
          <button
            type="button"
            className={`article-tab ${!isPreview ? 'active' : ''}`}
            onClick={() => setIsPreview(false)}
          >
            ✏️ Write
          </button>
          <button
            type="button"
            className={`article-tab ${isPreview ? 'active' : ''}`}
            onClick={() => setIsPreview(true)}
          >
            👁 Preview
          </button>
        </div>
        <div className="article-editor-stats">
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
        </div>
      </div>

      {isPreview ? (
        <div
          className="article-preview ql-editor"
          dangerouslySetInnerHTML={{ __html: value || '<p style="opacity:0.5">Nothing to preview yet...</p>' }}
        />
      ) : (
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value || ''}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
