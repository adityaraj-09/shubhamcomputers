import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiFile, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import API from '../api/axios';
import toast from 'react-hot-toast';
import './FileUpload.css';

const MAX_FILES = 15;
const MAX_SIZE_MB = 50;
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

const FileUpload = ({ onFilesUploaded }) => {
  const [files, setFiles] = useState([]); // selected but not yet uploaded
  const [uploadedFiles, setUploadedFiles] = useState([]); // successfully uploaded to Drive
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const getFileIcon = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    const icons = { pdf: '📄', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', webp: '🖼️', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📽️', pptx: '📽️' };
    return icons[ext] || '📁';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const totalCount = files.length + uploadedFiles.length + selected.length;

    if (totalCount > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const valid = [];
    for (const file of selected) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(`${file.name}: Unsupported file type`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name}: Exceeds ${MAX_SIZE_MB}MB limit`);
        continue;
      }
      valid.push(file);
    }

    setFiles(prev => [...prev, ...valid]);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploaded = (index) => {
    setUploadedFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      onFilesUploaded?.(updated);
      return updated;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newUploaded = [...uploadedFiles, ...data.files];
      setUploadedFiles(newUploaded);
      setFiles([]);
      onFilesUploaded?.(newUploaded);
      toast.success(`${data.files.length} file(s) uploaded!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      {/* Drop zone */}
      <div
        className="fu-dropzone"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <FiUploadCloud className="fu-dropzone-icon" />
        <p className="fu-dropzone-title">Upload your files</p>
        <p className="fu-dropzone-desc">PDF, JPG, PNG, DOCX, XLSX, PPTX</p>
        <p className="fu-dropzone-limits">Max {MAX_SIZE_MB}MB per file • Max {MAX_FILES} files</p>
      </div>

      {/* Uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="fu-file-list">
          <div className="fu-list-header">
            <span>✅ Uploaded ({uploadedFiles.length})</span>
          </div>
          {uploadedFiles.map((f, i) => (
            <div className="fu-file-item uploaded" key={`up-${i}`}>
              <span className="fu-file-icon">{getFileIcon(f.originalName)}</span>
              <div className="fu-file-info">
                <span className="fu-file-name">{f.originalName}</span>
                <span className="fu-file-size">
                  <FiCheck size={12} color="var(--accent)" /> Uploaded to Drive
                </span>
              </div>
              <button className="fu-remove" onClick={() => removeUploaded(i)}>
                <FiX size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending files */}
      {files.length > 0 && (
        <div className="fu-file-list">
          <div className="fu-list-header">
            <span>Selected ({files.length})</span>
          </div>
          {files.map((file, i) => (
            <div className="fu-file-item" key={`p-${i}`}>
              <span className="fu-file-icon">{getFileIcon(file.name)}</span>
              <div className="fu-file-info">
                <span className="fu-file-name">{file.name}</span>
                <span className="fu-file-size">{formatSize(file.size)}</span>
              </div>
              <button className="fu-remove" onClick={() => removeFile(i)} disabled={uploading}>
                <FiX size={14} />
              </button>
            </div>
          ))}

          <button
            className="fu-upload-btn"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <><FiLoader className="fu-spin" /> Uploading...</>
            ) : (
              <><FiUploadCloud /> Upload {files.length} file(s)</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
