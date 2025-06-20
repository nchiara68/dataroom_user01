// DataRoom.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { uploadData, list, remove } from 'aws-amplify/storage';

interface FileItem {
  path: string;
  size?: number;
  lastModified?: Date;
  eTag?: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  isUploading: boolean;
}

export const DataRoom: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  // Load user's files on component mount
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await list({
        path: ({ identityId }) => {
          if (!identityId) {
            throw new Error('User not authenticated');
          }
          return `user-files/${identityId}/${selectedFolder}`;
        },
        options: {
          listAll: true
        }
      });

      setFiles(result.items || []);
    } catch (err) {
      setError('Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedFolder]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    
    // Initialize upload progress for all files
    const initialProgress = fileArray.map(file => ({
      fileName: file.name,
      progress: 0,
      isUploading: true
    }));
    setUploadProgress(initialProgress);

    // Upload files concurrently
    const uploadPromises = fileArray.map(async (file, index) => {
      try {
        const fileName = `${Date.now()}-${file.name}`; // Add timestamp to prevent conflicts
        const folderPath = selectedFolder ? `${selectedFolder}/` : '';
        
        const result = await uploadData({
          path: ({ identityId }) => {
            if (!identityId) {
              throw new Error('User not authenticated');
            }
            return `user-files/${identityId}/${folderPath}${fileName}`;
          },
          data: file,
          options: {
            onProgress: ({ transferredBytes, totalBytes }) => {
              if (totalBytes) {
                const progress = Math.round((transferredBytes / totalBytes) * 100);
                setUploadProgress(prev => 
                  prev.map((item, i) => 
                    i === index ? { ...item, progress } : item
                  )
                );
              }
            },
          },
        }).result;

        console.log('Upload successful:', result.path);
        
        // Mark this file as completed
        setUploadProgress(prev => 
          prev.map((item, i) => 
            i === index ? { ...item, isUploading: false, progress: 100 } : item
          )
        );

        return result;
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        setUploadProgress(prev => 
          prev.map((item, i) => 
            i === index ? { ...item, isUploading: false, progress: 0 } : item
          )
        );
        throw err;
      }
    });

    try {
      await Promise.all(uploadPromises);
      setError(null);
      
      // Clear upload progress after a delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 2000);
      
      // Reload the file list
      await loadFiles();
      
      // Clear the file input
      event.target.value = '';
    } catch (err) {
      setError('Some files failed to upload');
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await remove({
        path: filePath
      });
      
      // Reload the file list
      await loadFiles();
      setError(null);
    } catch (err) {
      setError('Failed to delete file');
      console.error('Error deleting file:', err);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileName = (path: string): string => {
    return path.split('/').pop() || path;
  };

  const createFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      setSelectedFolder(folderName.trim());
    }
  };

  return (
    <div className="data-room">
      <div className="data-room-header">
        <h2>My Data Room</h2>
        <div className="folder-controls">
          <button onClick={() => setSelectedFolder('')} className="folder-btn">
            📁 Root Folder
          </button>
          <button onClick={createFolder} className="folder-btn">
            ➕ Create Folder
          </button>
          {selectedFolder && (
            <span className="current-folder">
              Current: {selectedFolder}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <div className="upload-section">
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="file-input"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="upload-button">
          📤 Choose Files to Upload
        </label>
      </div>

      {uploadProgress.length > 0 && (
        <div className="upload-progress-section">
          <h3>Upload Progress</h3>
          {uploadProgress.map((item, index) => (
            <div key={index} className="upload-progress-item">
              <div className="progress-info">
                <span className="file-name">{item.fileName}</span>
                <span className="progress-percent">{item.progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              {!item.isUploading && item.progress === 100 && (
                <span className="upload-complete">✅ Complete</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="files-section">
        <div className="files-header">
          <h3>Your Files {selectedFolder && `in ${selectedFolder}`}</h3>
          <button onClick={loadFiles} className="refresh-btn" disabled={loading}>
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {loading && files.length === 0 ? (
          <div className="loading">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="no-files">
            No files found. Upload some files to get started!
          </div>
        ) : (
          <div className="files-list">
            {files.map((file) => (
              <div key={file.path} className="file-item">
                <div className="file-info">
                  <div className="file-name">📄 {getFileName(file.path)}</div>
                  <div className="file-details">
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    {file.lastModified && (
                      <span className="file-date">
                        {file.lastModified.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.path)}
                  className="delete-btn"
                  title="Delete file"
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .data-room {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .data-room-header {
          margin-bottom: 30px;
          border-bottom: 2px solid #e1e5e9;
          padding-bottom: 20px;
        }

        .data-room-header h2 {
          margin: 0 0 15px 0;
          color: #1a202c;
        }

        .folder-controls {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .folder-btn {
          padding: 8px 16px;
          background: #4299e1;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .folder-btn:hover {
          background: #3182ce;
        }

        .current-folder {
          padding: 8px 12px;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          color: #4a5568;
        }

        .error-message {
          background: #fed7d7;
          color: #c53030;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          border: 1px solid #feb2b2;
        }

        .upload-section {
          margin-bottom: 30px;
          padding: 20px;
          border: 2px dashed #cbd5e0;
          border-radius: 8px;
          text-align: center;
          background: #f7fafc;
        }

        .file-input {
          display: none;
        }

        .upload-button {
          display: inline-block;
          padding: 12px 24px;
          background: #48bb78;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
        }

        .upload-button:hover {
          background: #38a169;
        }

        .upload-progress-section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .upload-progress-section h3 {
          margin: 0 0 15px 0;
          color: #2d3748;
        }

        .upload-progress-item {
          margin-bottom: 15px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 14px;
        }

        .file-name {
          color: #4a5568;
        }

        .progress-percent {
          color: #2d3748;
          font-weight: 500;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #48bb78;
          transition: width 0.3s ease;
        }

        .upload-complete {
          font-size: 12px;
          color: #38a169;
          margin-top: 5px;
          display: block;
        }

        .files-section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
        }

        .files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .files-header h3 {
          margin: 0;
          color: #2d3748;
        }

        .refresh-btn {
          padding: 8px 16px;
          background: #edf2f7;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #4a5568;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading, .no-files {
          text-align: center;
          padding: 40px;
          color: #718096;
          font-style: italic;
        }

        .files-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }

        .file-item:hover {
          background: #edf2f7;
        }

        .file-info {
          flex: 1;
        }

        .file-name {
          font-weight: 500;
          color: #2d3748;
          margin-bottom: 5px;
        }

        .file-details {
          display: flex;
          gap: 15px;
          font-size: 14px;
          color: #718096;
        }

        .delete-btn {
          padding: 8px 12px;
          background: #fed7d7;
          color: #c53030;
          border: 1px solid #feb2b2;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .delete-btn:hover {
          background: #feb2b2;
        }

        @media (max-width: 600px) {
          .data-room {
            padding: 15px;
          }
          
          .folder-controls {
            flex-direction: column;
            align-items: stretch;
          }
          
          .files-header {
            flex-direction: column;
            gap: 10px;
            align-items: stretch;
          }
          
          .file-item {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          
          .file-details {
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
};