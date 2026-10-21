import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Lock, CheckCircle2, AlertCircle, HardDrive } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, changePassword, logout } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user?.name, user?.email]);

  if (!isOpen || !user) return null;

  const storageUsedMB = (Number(user.storageUsed || 0) / (1024 * 1024)).toFixed(1);
  const storageQuotaGB = (Number(user.storageQuota || 10737418240) / (1024 * 1024 * 1024)).toFixed(0);
  const percentage = Math.min(100, Math.round((Number(user.storageUsed || 0) / Number(user.storageQuota || 10737418240)) * 100));

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProfileSuccess(false);
    try {
      await updateProfile(name, email);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordSuccess(false);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <UserIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>User Profile & Settings</h3>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{user.email}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="glass-card" style={{ padding: '14px', borderRadius: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={14} color="#818cf8" /> Storage Usage
            </span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{storageUsedMB} MB / {storageQuotaGB} GB ({percentage}%)</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${percentage}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}></div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Information</h4>
          <div>
            <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Display Name</label>
            <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Email Address</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {profileSuccess && (
              <span style={{ fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Profile updated!
              </span>
            )}
            <button type="submit" className="btn-secondary" style={{ marginLeft: 'auto', fontSize: '13px' }}>
              Save Profile
            </button>
          </div>
        </form>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Change Password</h4>
          <div>
            <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Current Password</label>
            <input type="password" className="input-field" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>New Password</label>
            <input type="password" className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {passwordSuccess && (
              <span style={{ fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Password changed!
              </span>
            )}
            <button type="submit" className="btn-secondary" style={{ marginLeft: 'auto', fontSize: '13px' }}>
              <Lock size={14} /> Change Password
            </button>
          </div>
        </form>

        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-danger" onClick={() => { logout(); onClose(); }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
