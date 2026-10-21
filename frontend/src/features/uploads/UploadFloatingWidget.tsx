import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, FileText, X } from 'lucide-react';
import { useUploadStore } from '../../stores/uploadStore';

export const UploadFloatingWidget: React.FC = () => {
  const { queue, cancelUpload, clearCompleted } = useUploadStore();
  const [isMinimized, setIsMinimized] = useState(false);

  const activeUploads = queue.filter((q) => q.status === 'UPLOADING' || q.status === 'PENDING');
  const completedUploads = queue.filter((q) => q.status === 'COMPLETED');
  const isAllCompleted = queue.length > 0 && activeUploads.length === 0;

  useEffect(() => {
    if (isAllCompleted) {
      const timer = setTimeout(() => {
        clearCompleted();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isAllCompleted, clearCompleted]);

  if (queue.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '360px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: isAllCompleted ? '#f0fdf4' : '#f8fafc',
          borderBottom: isMinimized ? 'none' : '1px solid #e2e8f0',
          cursor: 'pointer',
        }}
        onClick={() => setIsMinimized((prev) => !prev)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAllCompleted ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <UploadCloud size={18} color="#2563eb" style={{ animation: 'spin 2s linear infinite' }} />
          )}
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
            {isAllCompleted
              ? `${completedUploads.length} uploads completed`
              : `Uploading ${activeUploads.length} file${activeUploads.length > 1 ? 's' : ''}...`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized((prev) => !prev);
            }}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
          >
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearCompleted();
            }}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
            title="Close panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {queue.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                  <FileText size={15} color="#2563eb" />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={item.file.name}
                  >
                    {item.file.name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {item.status === 'COMPLETED' ? (
                    <CheckCircle2 size={16} color="#10b981" />
                  ) : item.status === 'ERROR' ? (
                    <AlertCircle size={16} color="#ef4444" />
                  ) : (
                    <button
                      onClick={() => cancelUpload(item.id)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                      title="Cancel upload"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                <span>{formatSize(item.file.size)}</span>
                <span>{item.status === 'COMPLETED' ? 'Completed' : item.status === 'ERROR' ? 'Failed' : `${item.progress}%`}</span>
              </div>

              <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${item.progress}%`,
                    height: '100%',
                    background: item.status === 'ERROR' ? '#ef4444' : item.status === 'COMPLETED' ? '#10b981' : '#2563eb',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
