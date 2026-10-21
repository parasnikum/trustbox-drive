import React, { useState, useEffect } from 'react';
import { X, Edit3 } from 'lucide-react';
import { FileItem, FolderItem } from '../../types';

interface RenameModalProps {
  item: { type: 'file' | 'folder'; item: FileItem | FolderItem } | null;
  onClose: () => void;
  onRename: (type: 'file' | 'folder', id: string, newName: string) => Promise<void>;
}

export const RenameModal: React.FC<RenameModalProps> = ({ item, onClose, onRename }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.item.name);
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onRename(item.type, item.item.id, name.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={18} color="#58a6ff" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f6fc' }}>
              Rename {item.type === 'file' ? 'File' : 'Folder'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={{ marginBottom: '16px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
