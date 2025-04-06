import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import DocumentService from '../services/DocumentService';

interface FileUploadProps {
  onUploadSuccess: (uploadedDocument: any) => void; // Callback after successful upload
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0); // Optional progress state

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    const file = acceptedFiles[0]; // Handle only the first file for now
    if (!file) {
      setUploading(false);
      return;
    }

    // Basic validation (can be enhanced)
    if (!['application/pdf', 'application/epub+zip'].includes(file.type)) {
      setError('Invalid file type. Only PDF and EPUB are allowed.');
      setUploading(false);
      return;
    }

    try {
      // Note: DocumentService.uploadDocument already logs progress to console
      // We could pass a state setter to DocumentService if needed for UI updates
      const uploadedDoc = await DocumentService.uploadDocument(file);
      onUploadSuccess(uploadedDoc); // Notify parent component
      setError(null);
    } catch (err: any) { // Consider more specific error typing
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'File upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub']
    },
    multiple: false, // Allow only single file upload
  });

  // Basic styling (can be moved to CSS)
  const style: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    borderWidth: 2,
    borderRadius: 2,
    borderColor: isDragActive ? '#2196f3' : '#eeeeee',
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out',
    cursor: 'pointer',
    minHeight: '100px',
    justifyContent: 'center'
  };

  return (
    <div {...getRootProps({ style })}>
      <input {...getInputProps()} />
      {uploading ? (
        <p>Uploading... {uploadProgress > 0 && `${uploadProgress}%`}</p> // Show progress if available
      ) : isDragActive ? (
        <p>Drop the file here ...</p>
      ) : (
        <p>Drag 'n' drop PDF or EPUB file here, or click to select file</p>
      )}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default FileUpload; 