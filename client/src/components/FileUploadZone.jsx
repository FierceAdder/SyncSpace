import { useState, useRef } from 'react';
import { Upload, File, X, Check, ShieldCheck } from 'lucide-react';
import api from '../api/api';
import './FileUploadZone.css';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/zip',
];

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileUploadZone({ groupId, onUploadComplete, onError }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const inputRef = useRef(null);

  const validateFile = (f) => {
    if (f.size > MAX_SIZE) {
      onError?.('File size exceeds 10MB limit.');
      return false;
    }
    // Allow all types but warn
    return true;
  };

  const handleFile = async (f) => {
    if (!acceptedTerms) {
      onError?.('You must accept the terms before uploading.');
      return;
    }
    if (!validateFile(f)) return;
    setFile(f);
    setUploading(true);
    setProgress(0);
    setUploaded(false);

    try {
      // Step 1: Get presigned upload URL
      const { uploadUrl, key } = await api.getPresignedUploadUrl(f.name, f.type, groupId);

      // Step 2: Upload directly to S3
      await api.uploadToS3(uploadUrl, f, f.type, (pct) => setProgress(pct));

      setUploaded(true);
      setUploadResult({ key, fileName: f.name, fileSize: f.size });
      onUploadComplete?.({ File_Key: key, File_Name: f.name, File_Size: f.size });
    } catch (err) {
      onError?.('File upload failed. Please try again.');
      setFile(null);
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleInputChange = (e) => {
    const f = e.target.files[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setFile(null);
    setUploading(false);
    setProgress(0);
    setUploaded(false);
    setUploadResult(null);
    setAcceptedTerms(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className={`file-upload-zone ${dragOver ? 'drag-over' : ''} ${uploaded ? 'uploaded' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="file-upload-input"
        onChange={handleInputChange}
        accept={ALLOWED_TYPES.join(',')}
      />

      {!file ? (
        <div className="file-upload-placeholder">
          <div className="file-upload-icon-wrapper">
            <Upload size={28} />
          </div>
          <p className="file-upload-text">
            <strong>Drop a file here</strong> or click to browse
          </p>
          <p className="file-upload-hint">PDF, Docs, Images, ZIP — up to 10MB</p>
          <label className="file-upload-terms" onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
            />
            <span>
              I confirm this file does not violate any copyright or intellectual property rights. I have the right to distribute this content.
            </span>
          </label>
          {!acceptedTerms && (
            <p className="file-upload-terms-warning">
              <ShieldCheck size={12} /> Accept terms to enable upload
            </p>
          )}
        </div>
      ) : (
        <div className="file-upload-info" onClick={e => e.stopPropagation()}>
          <div className="file-upload-file-icon">
            {uploaded ? <Check size={20} /> : <File size={20} />}
          </div>
          <div className="file-upload-details">
            <span className="file-upload-name">{file.name}</span>
            <span className="file-upload-size">{formatFileSize(file.size)}</span>
          </div>
          {uploading && !uploaded && (
            <div className="file-upload-progress-bar">
              <div className="file-upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
          {uploaded && (
            <button className="file-upload-remove" onClick={reset} title="Remove">
              <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
