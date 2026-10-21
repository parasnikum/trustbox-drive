import React, { useState } from 'react';
import { X, Folder, ArrowRight, Copy } from 'lucide-react';
import { FileItem, FolderItem } from '../../types';
import { useFileStore } from '../../stores/fileStore';

interface MoveCopyModalProps {
  action: { mode: 'move' | 'copy'; type: 'file' | 'folder'; item: FileItem | FolderItem } | null;
  onClose: () => void;
  onConfirm: (mode: 'move' | 'copy', type: 'file' | 'folder', id: string, targetParentId: string | null) => Promise<void>;
}

export const MoveCopyModal: React.FC<MoveCopyModalProps> = ({ action, onClose, onConfirm }) => {
  const { folders } = useFileStore();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!action) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(action.mode, action.type, action.item.id, selectedFolderId);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {action.mode === 'move' ? <ArrowRight size={18} color="#58a6ff" /> : <Copy size={18} color="#56d364" />}
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f6fc' }}>
              {action.mode === 'move' ? 'Move' : 'Copy'} "{action.item.name}"
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '12px' }}>
          Select destination folder:
        </p>

        <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
          <div
            onClick={() => setSelectedFolderId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '6px',
              background: selectedFolderId === null ? '#21262d' : 'transparent',
              color: selectedFolderId === null ? '#58a6ff' : '#c9d1d9',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Folder size={16} color={selectedFolderId === null ? '#58a6ff' : '#8b949e'} />
            <span>My Drive (Root)</span>
          </div>

          {folders.filter(f => f.id !== action.item.id).map((f) => (
            <div
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '6px',
                background: selectedFolderId === f.id ? '#21262d' : 'transparent',
                color: selectedFolderId === f.id ? '#58a6ff' : '#c9d1d9',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <Folder size={16} color={selectedFolderId === f.id ? '#58a6ff' : '#8b949e'} />
              <span>{f.name}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleConfirm} disabled={isSubmitting}>
            {action.mode === 'move' ? 'Move Here' : 'Copy Here'}
          </button>
        </div>
      </div>
    </div>
  );
};
