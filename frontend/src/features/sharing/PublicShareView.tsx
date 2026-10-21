import React, { useEffect, useState } from 'react';
import { Download, Eye, Lock, AlertTriangle, FileText, CheckCircle2, Loader2, HardDrive } from 'lucide-react';
import { ShareLink, FileItem } from '../../types';
import { apiClient } from '../../services/apiClient';

export const PublicShareView: React.FC = () => {
  const [share, setShare] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  const pathParts = window.location.pathname.split('/');
  const token = pathParts[pathParts.length - 1];

  const searchParams = new URLSearchParams(window.location.search);
  const dlParam = searchParams.get('dl');

  const fetchShareData = async (pwd?: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = pwd ? `?password=${encodeURIComponent(pwd)}` : '';
      const res = await apiClient.get(`/shares/token/${token}${query}`);
      const shareData: ShareLink = res.data.share;
      setShare(shareData);
      setPasswordRequired(false);

      if (dlParam === '1' && shareData.file && !downloadTriggered) {
        setDownloadTriggered(true);
        triggerDownload(shareData.file);
      }
    } catch (err: any) {
      if (err.response?.status === 410) {
        setIsExpired(true);
      } else if (err.response?.status === 401 && err.response?.data?.passwordRequired) {
        setPasswordRequired(true);
      } else {
        setError(err.response?.data?.error || 'Failed to load shared file.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchShareData();
    }
  }, [token]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;
    fetchShareData(passwordInput);
  };

  const triggerDownload = (file: FileItem) => {
    const downloadUrl = `/api/files/${file.id}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return '';
    const bytes = Number(bytesStr);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d1117', color: '#f0f6fc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
        <HardDrive size={28} color="#58a6ff" />
        <h1 style={{ fontSize: '22px', fontWeight: 800, background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          TrustBox Secure Share
        </h1>
      </div>

      <div style={{ width: '100%', maxWidth: '520px', background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '24px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', gap: '12px', color: '#8b949e' }}>
            <Loader2 size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Verifying secure share link...</span>
          </div>
        ) : isExpired ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '10px 0' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255, 123, 114, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff7b72' }}>
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ff7b72' }}>Share Link Expired</h2>
            <p style={{ fontSize: '13px', color: '#8b949e', maxWidth: '380px' }}>
              This shared link has reached its expiration time limit and is no longer active. Please contact the owner for a new link.
            </p>
          </div>
        ) : passwordRequired ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e3b341' }}>
              <Lock size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Password Protected Link</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#8b949e' }}>
              This link requires a password to view or download.
            </p>
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="password"
                className="input-field"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                Unlock Access
              </button>
            </form>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#ff7b72' }}>
            <AlertTriangle size={32} style={{ marginBottom: '10px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Access Error</h3>
            <p style={{ fontSize: '13px', color: '#8b949e', marginTop: '6px' }}>{error}</p>
          </div>
        ) : share && share.file ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {dlParam === '1' && (
              <div style={{ background: 'rgba(86, 211, 100, 0.12)', border: '1px solid rgba(86, 211, 100, 0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#56d364', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>Auto-download triggered (`?dl=1`). Check your downloads bar!</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: '#0d1117', borderRadius: '10px', border: '1px solid #21262d' }}>
              <FileText size={36} color="#58a6ff" />
              <div style={{ overflow: 'hidden' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f0f6fc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {share.file.name}
                </h3>
                <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>
                  <span>{formatSize(share.file.size)}</span>
                  <span>•</span>
                  <span>{share.file.mimeType}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  const previewUrl = `/api/files/${share.file!.id}/download?inline=true`;
                  window.open(previewUrl, '_blank');
                }}
                style={{ justifyContent: 'center' }}
              >
                <Eye size={16} color="#58a6ff" />
                <span>Preview</span>
              </button>
              <button
                className="btn-primary"
                onClick={() => triggerDownload(share.file!)}
                style={{ justifyContent: 'center' }}
              >
                <Download size={16} />
                <span>Download</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
