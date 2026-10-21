import React, { useState } from 'react';
import { MarketingLayout } from './MarketingLayout';
import {
  Cloud,
  Share2,
  RefreshCw,
  Users,
  FolderTree,
  History,
  Shield,
  Key,
  Check,
  ArrowRight,
  HardDrive,
  Upload,
  Lock,
  Search,
  Eye,
  SlidersHorizontal,
  FileText,
  FileCode,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

interface FeaturesPageProps {
  onNavigate: (path: string) => void;
  isAuthenticated?: boolean;
  onOpenDrive?: () => void;
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({
  onNavigate,
  isAuthenticated = false,
  onOpenDrive,
  onSignIn,
  onGetStarted,
}) => {
  const [activeDemoTab, setActiveDemoTab] = useState<'upload' | 'share' | 'sync' | 'team'>('upload');

  const featureSections = [
    {
      id: 'storage',
      title: 'File Storage',
      subtitle: 'Unlimited space for your files, photos, videos, and archives.',
      desc: 'TrustBox gives you reliable, lightning-fast cloud storage designed to preserve original resolution and metadata without forced compression.',
      points: [
        'Zero file compression on images and RAW formats',
        'Automatic deduplication and integrity checksums',
        'Direct browser streaming for 4K video & lossless audio',
        'High-speed parallel chunked upload with pause & resume',
      ],
      icon: Cloud,
      badgeColor: 'bg-blue-50 text-blue-600 border-blue-100',
      mockup: (
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-sm">Storage Health & Quota</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">Optimal</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Used Space</span>
              <span className="font-bold text-slate-800">142.8 GB / 500 GB (28%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
              <div className="h-full bg-blue-500 w-[14%]" title="Photos & Media" />
              <div className="h-full bg-emerald-500 w-[8%]" title="Documents" />
              <div className="h-full bg-purple-500 w-[6%]" title="Code & Projects" />
            </div>
            <div className="flex items-center gap-4 pt-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Photos (70 GB)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Documents (42 GB)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Code (30.8 GB)</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'sharing',
      title: 'File Sharing',
      subtitle: 'Share any file or folder with anyone, in a single click.',
      desc: 'Send high-res files without email size limits. Secure public links with passwords, download restrictions, and self-destructing expiry dates.',
      points: [
        'Instant public link generation',
        'Password protection & custom expirations',
        'View-only mode (disable downloads)',
        'Link download counters & access analytics',
      ],
      icon: Share2,
      badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      mockup: (
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-sm">Share: "Q3_Report.pdf"</span>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Link Active</span>
          </div>
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="text-slate-600 truncate font-mono text-[11px]">https://trustbox.dev/s/Q3_Report</span>
              <button className="px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold text-[10px]">Copy</button>
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-700">
                <span className="flex items-center gap-1.5"><Lock size={12} className="text-slate-400" /> Password Protection</span>
                <span className="font-bold text-emerald-600">Enabled (••••••••)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-700">
                <span className="flex items-center gap-1.5"><History size={12} className="text-slate-400" /> Link Expires In</span>
                <span className="font-bold text-slate-800">7 Days</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'sync',
      title: 'Synchronization',
      subtitle: 'Real-time multi-device sync with zero latency.',
      desc: 'Edit a document on your desktop and have it instantly refreshed on your laptop, tablet, or phone without manual refreshes.',
      points: [
        'WebSocket real-time delta sync',
        'Automatic conflict resolution',
        'Offline caching with automatic upload queue',
        'Selective folder synchronization to save local drive space',
      ],
      icon: RefreshCw,
      badgeColor: 'bg-purple-50 text-purple-600 border-purple-100',
      mockup: (
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-800 text-sm">Sync Status: Up to date</span>
            </div>
            <span className="text-slate-400 text-[10px]">Just now</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-700 font-medium">MacBook Pro (16-inch)</span>
              <span className="text-emerald-600 font-bold text-[10px]">Connected</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-700 font-medium">Windows Workstation</span>
              <span className="text-emerald-600 font-bold text-[10px]">Connected</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-700 font-medium">iPhone 16 Pro (Mobile)</span>
              <span className="text-slate-400 text-[10px]">Active 5m ago</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'collaboration',
      title: 'Team Collaboration',
      subtitle: 'Build workspaces that empower your entire team.',
      desc: 'Shared team workspaces, real-time activity feeds, and co-working folders make collaboration seamless across remote and hybrid teams.',
      points: [
        'Centralized workspace folders',
        'Live activity timeline and member updates',
        'Team-wide search across documents and media',
        'Shared tags and asset management',
      ],
      icon: Users,
      badgeColor: 'bg-rose-50 text-rose-600 border-rose-100',
      mockup: (
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-sm">Workspace Members (8)</span>
            <button className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[10px]">+ Invite</button>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[10px]">A</div>
                <span className="font-medium text-slate-800">Alex Morgan (You)</span>
              </div>
              <span className="text-blue-600 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded-full">Owner</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px]">S</div>
                <span className="font-medium text-slate-800">Sarah Connor</span>
              </div>
              <span className="text-slate-600 font-semibold text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">Editor</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px]">M</div>
                <span className="font-medium text-slate-800">Michael Scott</span>
              </div>
              <span className="text-slate-600 font-semibold text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">Viewer</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'organization',
      title: 'File Organization',
      subtitle: 'Smart sorting, tags, and AI-assisted search.',
      desc: 'Find any file in seconds. Search inside documents, filter by type, color-code folders, and pin frequently used directories.',
      points: [
        'Instant multi-filter (Images, Videos, PDFs, Code, Archives)',
        'Nested hierarchical folder structures',
        'Color-coded folders & starred bookmarks',
        'Full-text search inside PDFs, Markdown, and TXT files',
      ],
      icon: FolderTree,
      badgeColor: 'bg-amber-50 text-amber-600 border-amber-100',
      mockup: (
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xl p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <Search size={14} className="text-slate-400" />
            <span className="text-slate-700 font-medium">type:pdf modified:last-7-days</span>
          </div>
          <div className="space-y-1.5">
            <div className="p-2 rounded-lg bg-blue-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-rose-500" />
                <span className="font-semibold text-slate-800">Product_Brief_v2.pdf</span>
              </div>
              <span className="text-[10px] text-slate-400">Match in text</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-rose-500" />
                <span className="font-semibold text-slate-800">Brand_Guidelines.pdf</span>
              </div>
              <span className="text-[10px] text-slate-400">Match in title</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'versioning',
      title: 'Version History',
      subtitle: 'Accidentally overwrite a file? Restore it instantly.',
      desc: 'TrustBox automatically preserves file revisions whenever updates occur. Compare previous versions, inspect timestamps, and revert with zero data loss.',
      points: [
        'Automatic background version snapshotting',
        'Side-by-side diff previews for text and code',
        '30-day to unlimited history retention',
        'Independent trash bin recovery window',
      ],
      icon: History,
      badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      mockup: (
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xl p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-sm">Version History: "app.tsx"</span>
            <span className="text-slate-400 text-[10px]">3 Versions</span>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/70 flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-900 block">Version 3 (Current)</span>
                <span className="text-[10px] text-slate-500">Modified today at 11:24 AM by You</span>
              </div>
              <span className="text-blue-600 font-bold text-[10px]">Active</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Version 2</span>
                <span className="text-[10px] text-slate-500">Yesterday at 4:15 PM</span>
              </div>
              <button className="text-blue-600 font-bold text-[10px] hover:underline">Restore</button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      title: 'Security',
      subtitle: 'Military-grade encryption and zero-knowledge storage.',
      desc: 'Your files are guarded with enterprise-grade AES-256 bit encryption at rest and TLS 1.3 in transit. TrustBox was engineered from the ground up for strict privacy.',
      points: [
        'AES-256 GCM encryption at rest',
        'TLS 1.3 encrypted secure transport',
        'Zero-knowledge access model option',
        'Automated vulnerability & penetration audits',
      ],
      icon: Shield,
      badgeColor: 'bg-sky-50 text-sky-600 border-sky-100',
      mockup: (
        <div className="rounded-2xl bg-slate-900 text-white p-5 space-y-4 text-xs shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-sky-400" />
              <span className="font-bold text-sm">Cryptographic Verification</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">Passed</span>
          </div>
          <div className="space-y-1.5 font-mono text-[10px] text-slate-400">
            <div>&gt; CIPHER: AES-256-GCM</div>
            <div>&gt; KEY_EXCHANGE: ECDHE-RSA-AES128-GCM-SHA256</div>
            <div>&gt; AT_REST_CHECKSUM: SHA-256 Verified (OK)</div>
            <div>&gt; PRIVACY_POLICY: Zero Data Mining Enforced</div>
          </div>
        </div>
      ),
    },
    {
      id: 'access',
      title: 'Access Management',
      subtitle: 'Precision controls for every user, folder, and device.',
      desc: 'Set granular permissions, enforce Two-Factor Authentication (2FA), track active sessions, and remotely revoke access with a single click.',
      points: [
        'Two-factor authentication (TOTP & Security Keys)',
        'Active device & browser session management',
        'Remote logout and session revocation',
        'Role-based permissions (Admin, Editor, Viewer)',
      ],
      icon: Key,
      badgeColor: 'bg-teal-50 text-teal-600 border-teal-100',
      mockup: (
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xl p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-sm">Security & Sessions</span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">2FA Active</span>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Chrome on macOS (Current)</span>
                <span className="text-[10px] text-slate-400">IP: 198.51.100.4 • San Francisco, CA</span>
              </div>
              <span className="text-emerald-600 text-[10px] font-bold">This device</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Firefox on Windows 11</span>
                <span className="text-[10px] text-slate-400">IP: 203.0.113.19 • Austin, TX</span>
              </div>
              <button className="text-rose-600 text-[10px] font-bold hover:underline">Revoke</button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <MarketingLayout
      activePath="/features"
      onNavigate={onNavigate}
      isAuthenticated={isAuthenticated}
      onOpenDrive={onOpenDrive}
      onSignIn={onSignIn}
      onGetStarted={onGetStarted}
    >

      <section className="pt-16 pb-16 sm:pt-20 sm:pb-24 text-center bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold">
            <Sparkles size={14} className="text-[#FF643D]" />
            Complete Feature Directory
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
            Everything your files need.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From lightning-fast uploads to military-grade encryption, TrustBox delivers
            a full suite of cloud storage and collaboration tools built for precision.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="px-7 py-3.5 rounded-full bg-[#0F172A] text-white text-sm font-semibold hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight size={16} className="text-[#FF643D]" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {featureSections.map((feat, idx) => {
          const isEven = idx % 2 === 0;
          const Icon = feat.icon;

          return (
            <div
              key={feat.id}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center ${!isEven ? 'lg:flex-row-reverse' : ''
                }`}
            >

              <div className={`lg:col-span-6 space-y-6 ${!isEven ? 'lg:order-2' : ''}`}>
                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${feat.badgeColor}`}>
                  <Icon size={14} />
                  <span>{feat.title}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {feat.subtitle}
                </h2>

                <p className="text-base text-slate-600 leading-relaxed font-normal">
                  {feat.desc}
                </p>

                <div className="space-y-3 pt-2">
                  {feat.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`lg:col-span-6 ${!isEven ? 'lg:order-1' : ''}`}>
                <div className="p-3 sm:p-5 rounded-3xl bg-slate-50/80 border border-slate-200/80 shadow-inner">
                  {feat.mockup}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </MarketingLayout>
  );
};
