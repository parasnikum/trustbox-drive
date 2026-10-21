import React, { useState } from 'react';
import { X, Share2, Copy, Check, Lock, Users, Mail, Plus, Clock, Download, Eye, Calendar } from 'lucide-react';
import { FileItem, FolderItem, ShareLink } from '../../types';
import { apiClient } from '../../services/apiClient';
import { useAuthStore } from '../../stores/authStore';

interface ShareModalProps {
  item: { type: 'file' | 'folder'; item: FileItem | FolderItem } | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ item, onClose }) => {
  const { user } = useAuthStore();
  const [permission, setPermission] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'RESTRICTED'>('PUBLIC');
  const [password, setPassword] = useState('');
  const [expirationOption, setExpirationOption] = useState<'never' | '1h' | '24h' | '7d' | '30d' | 'custom'>('never');
  const [customExpiresAt, setCustomExpiresAt] = useState('');
  const [createdShare, setCreatedShare] = useState<ShareLink | null>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [copiedDownload, setCopiedDownload] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  if (!item) return null;

  const nowFormatted = new Date().toISOString().slice(0, 16);

  const calculateExpiresAt = (): string | undefined => {
    if (expirationOption === 'custom' && customExpiresAt) {
      return new Date(customExpiresAt).toISOString();
    }
    const now = Date.now();
    if (expirationOption === '1h') return new Date(now + 3600 * 1000).toISOString();
    if (expirationOption === '24h') return new Date(now + 24 * 3600 * 1000).toISOString();
    if (expirationOption === '7d') return new Date(now + 7 * 24 * 3600 * 1000).toISOString();
    if (expirationOption === '30d') return new Date(now + 30 * 24 * 3600 * 1000).toISOString();
    return undefined;
  };

  const handleCreateShare = async () => {
    setIsGenerating(true);
    try {
      const expiresAt = calculateExpiresAt();
      const res = await apiClient.post('/shares', {
        fileId: item.type === 'file' ? item.item.id : undefined,
        folderId: item.type === 'folder' ? item.item.id : undefined,
        permission,
        visibility,
        password: password.trim() !== '' ? password : undefined,
        expiresAt,
      });

      const share: ShareLink = res.data.share;
      setCreatedShare(share);

      if (visibility === 'RESTRICTED' && members.length > 0) {
        for (const email of members) {
          await apiClient.post(`/shares/${share.id}/members`, { email, permission: 'VIEWER' });
        }
      }
    } catch (err) {
      console.error('Failed to generate share link:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const previewShareUrl = createdShare ? `${window.location.origin}/s/${createdShare.token}?dl=0` : '';
  const downloadShareUrl = createdShare ? `${window.location.origin}/s/${createdShare.token}?dl=1` : '';

  const handleCopyPreview = () => {
    if (!previewShareUrl) return;
    navigator.clipboard.writeText(previewShareUrl);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  const handleCopyDownload = () => {
    if (!downloadShareUrl) return;
    navigator.clipboard.writeText(downloadShareUrl);
    setCopiedDownload(true);
    setTimeout(() => setCopiedDownload(false), 2000);
  };

  const handleAddEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (user?.email && trimmed === user.email.toLowerCase()) {
      setEmailError('You cannot share items with your own account email.');
      return;
    }
    setEmailError(null);
    if (!members.includes(trimmed)) {
      setMembers([...members, trimmed]);
      setEmailInput('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '90%',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: 'var(--modal-shadow)',
          padding: '24px',
          color: 'var(--text-main)',
        }}
      >

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', flexShrink: 0 }}>
              <Share2 size={20} />
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={item.item.name}
            >
              Share "{item.item.name}"
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {!createdShare ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Access Scope
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setVisibility('PUBLIC')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: visibility === 'PUBLIC' ? 'var(--primary)' : 'var(--border-color)',
                    background: visibility === 'PUBLIC' ? 'var(--primary-light)' : 'var(--bg-surface-subtle)',
                    color: visibility === 'PUBLIC' ? 'var(--primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Share2 size={16} color={visibility === 'PUBLIC' ? 'var(--primary)' : 'var(--text-muted)'} />
                  <span>Public Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('RESTRICTED')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: visibility === 'RESTRICTED' ? 'var(--primary)' : 'var(--border-color)',
                    background: visibility === 'RESTRICTED' ? 'var(--primary-light)' : 'var(--bg-surface-subtle)',
                    color: visibility === 'RESTRICTED' ? 'var(--primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Users size={16} color={visibility === 'RESTRICTED' ? 'var(--primary)' : 'var(--text-muted)'} />
                  <span>Restricted Email</span>
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Recipient Permission
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPermission('VIEWER')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: permission === 'VIEWER' ? 'var(--primary)' : 'var(--border-color)',
                    background: permission === 'VIEWER' ? 'var(--primary-light)' : 'var(--bg-surface-subtle)',
                    color: permission === 'VIEWER' ? 'var(--primary)' : 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Can View / Download
                </button>
                <button
                  type="button"
                  onClick={() => setPermission('EDITOR')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: permission === 'EDITOR' ? 'var(--accent-emerald)' : 'var(--border-color)',
                    background: permission === 'EDITOR' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-subtle)',
                    color: permission === 'EDITOR' ? 'var(--accent-emerald)' : 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Can Edit / Manage
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Link Expiration Time
              </label>
              <div style={{ position: 'relative', marginBottom: expirationOption === 'custom' ? '8px' : '0' }}>
                <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <select
                  className="input-field"
                  value={expirationOption}
                  onChange={(e) => setExpirationOption(e.target.value as any)}
                  style={{ paddingLeft: '38px', cursor: 'pointer' }}
                >
                  <option value="never">Never expire</option>
                  <option value="1h">Expires in 1 hour</option>
                  <option value="24h">Expires in 24 hours</option>
                  <option value="7d">Expires in 7 days</option>
                  <option value="30d">Expires in 30 days</option>
                  <option value="custom">📅 Custom Date & Time Calendar</option>
                </select>
              </div>

              {expirationOption === 'custom' && (
                <div style={{ position: 'relative', marginTop: '8px' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', pointerEvents: 'none' }} />
                  <input
                    type="datetime-local"
                    className="input-field"
                    min={nowFormatted}
                    value={customExpiresAt}
                    onChange={(e) => setCustomExpiresAt(e.target.value)}
                    style={{ paddingLeft: '38px', color: 'var(--text-main)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                    * Only future dates and times allowed. Past dates are blocked.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Password Protection (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="input-field"
                  placeholder="Set secret password (optional)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            {visibility === 'RESTRICTED' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Allowed Email Recipients
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="user@example.com"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setEmailError(null);
                    }}
                  />
                  <button type="button" className="btn-secondary" onClick={handleAddEmail}>
                    <Plus size={16} /> Add
                  </button>
                </div>

                {emailError && (
                  <div style={{ fontSize: '11px', color: 'var(--accent-rose)', marginBottom: '8px', fontWeight: 500 }}>
                    ⚠️ {emailError}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {members.map((m) => (
                    <span key={m} className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={12} /> {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-primary" onClick={handleCreateShare} disabled={isGenerating} style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}>
              {isGenerating ? 'Generating Link...' : 'Create Share Link'}
            </button>
          </div>
        ) : (

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '12px', fontSize: '13px', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} color="var(--accent-emerald)" />
              <span>Share link generated! Use parameters for view vs auto-download.</span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Eye size={14} color="var(--primary)" />
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Preview / View Link (?dl=0)
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" readOnly className="input-field" value={previewShareUrl} style={{ fontSize: '12px', color: 'var(--primary)' }} />
                <button className="btn-primary" onClick={handleCopyPreview}>
                  {copiedPreview ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copiedPreview ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {item.type === 'file' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Download size={14} color="var(--accent-emerald)" />
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                    Direct Auto-Download Link (?dl=1)
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" readOnly className="input-field" value={downloadShareUrl} style={{ fontSize: '12px', color: 'var(--accent-emerald)' }} />
                  <button className="btn-secondary" onClick={handleCopyDownload} style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    {copiedDownload ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} color="var(--accent-emerald)" />}
                    <span>{copiedDownload ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {createdShare.expiresAt && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface-subtle)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <Clock size={14} color="var(--accent-amber)" />
                <span>Link expires: {new Date(createdShare.expiresAt).toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button className="btn-secondary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
