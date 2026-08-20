import React from 'react';
import { Upload as UploadIcon } from 'lucide-react';

/**
 * Reusable File Upload Component
 */
export function Upload({
  accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg',
  onFileSelect,
  selectedFile = null,
  label = 'Upload Document or Moodboard',
  compact = false
}) {
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file && typeof onFileSelect === 'function') {
      onFileSelect(file);
    }
  };

  return (
    <label className={`upload-dropzone ${compact ? 'compact-dropzone' : ''}`}>
      <UploadIcon size={24} className="accent-icon" />
      <span>{selectedFile ? selectedFile.name : label}</span>
      <input
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </label>
  );
}
