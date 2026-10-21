import React, { useState } from 'react';
import { Laptop, CheckCircle, RefreshCw, Folder, Clock, ArrowUpRight } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  os: string;
  lastSynced: string;
  isSynced: boolean;
  type: 'laptop' | 'mac';
}

interface LocalFolder {
  id: string;
  name: string;
  itemCount: number;
  lastUpdated: string;
  size: string;
  color: string;
}

export const MyComputer: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'LAPTOP-3F3K2',
      os: 'Windows 11',
      lastSynced: '2 hours ago',
      isSynced: true,
      type: 'laptop',
    },
    {
      id: '2',
      name: 'My MacBook Pro',
      os: 'macOS Sonoma',
      lastSynced: '1 day ago',
      isSynced: false,
      type: 'mac',
    },
  ]);

  const localFolders: LocalFolder[] = [
    { id: 'f1', name: 'Desktop', itemCount: 245, lastUpdated: '2 hours ago', size: '1.4 GB', color: '#2563eb' },
    { id: 'f2', name: 'Documents', itemCount: 892, lastUpdated: '5 hours ago', size: '4.8 GB', color: '#8b5cf6' },
    { id: 'f3', name: 'Downloads', itemCount: 76, lastUpdated: '1 day ago', size: '850 MB', color: '#f59e0b' },
    { id: 'f4', name: 'Pictures', itemCount: 1204, lastUpdated: '2 days ago', size: '5.2 GB', color: '#ef4444' },
    { id: 'f5', name: 'Music', itemCount: 340, lastUpdated: '3 days ago', size: '10b981', color: '#10b981' },
  ];

  const handleTriggerSync = (deviceId: string) => {
    setIsSyncing(deviceId);
    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, isSynced: true, lastSynced: 'Just now' } : d))
      );
      setIsSyncing(null);
    }, 1500);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px 28px', gap: '24px', backgroundColor: '#f8fafc' }}>

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Laptop color="#2563eb" size={24} />
          My Computer
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: 0 }}>
          Back up and access files seamlessly across your registered devices.
        </p>
      </div>

      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>Connected Devices</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {devices.map((device) => (
            <div
              key={device.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Laptop size={22} color="#2563eb" />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{device.name}</h4>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{device.os} • Synced {device.lastSynced}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                {device.isSynced ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '16px' }}>
                    <CheckCircle size={14} />
                    <span style={{ fontWeight: 600 }}>Synced</span>
                  </div>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '5px 12px' }}
                    onClick={() => handleTriggerSync(device.id)}
                    disabled={isSyncing === device.id}
                  >
                    <RefreshCw size={13} className={isSyncing === device.id ? 'spin' : ''} style={{ animation: isSyncing === device.id ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{isSyncing === device.id ? 'Syncing...' : 'Sync'}</span>
                  </button>
                )}

                <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  Device Details <ArrowUpRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>Folders on this device</h3>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Folder Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Items Count</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Total Size</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {localFolders.map((f, idx) => (
                <tr
                  key={f.id}
                  style={{
                    borderBottom: idx === localFolders.length - 1 ? 'none' : '1px solid #f1f5f9',
                    color: '#334155',
                    transition: 'background 0.15s',
                  }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, color: '#0f172a' }}>
                    <Folder size={18} color={f.color} />
                    <span>{f.name}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{f.itemCount} items</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{f.size}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} color="#94a3b8" />
                    <span>Last updated {f.lastUpdated}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
