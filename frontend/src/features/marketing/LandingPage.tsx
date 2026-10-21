import React, { useState } from 'react';
import { MarketingLayout } from './MarketingLayout';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Check,
  ArrowRight,
  Play,
  Cloud,
  Share2,
  RefreshCw,
  Shield,
  Zap,
  Lock,
  Globe,
  Users,
  Sparkles,
  Upload,
  HardDrive,
  Search,
  Plus,
  Bell,
  SlidersHorizontal,
  X,
  Heart,
  ChevronDown,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onOpenDrive?: () => void;
  isAuthenticated?: boolean;
  onNavigate?: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn,
  onOpenDrive,
  isAuthenticated = false,
  onNavigate = () => {},
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [activeMockupTab, setActiveMockupTab] = useState<'home' | 'files' | 'shared' | 'recent' | 'starred'>('home');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handlePricingAction = (plan: 'free' | 'pro' | 'team') => {
    if (isAuthenticated && onOpenDrive) {
      onOpenDrive();
    } else {
      onGetStarted();
    }
  };

  const faqs = [
    {
      q: 'How does TrustBox protect my files?',
      a: 'TrustBox utilizes enterprise-grade AES-256 bit encryption at rest and TLS 1.3 in transit. Files are chunked and encrypted before touching disk, ensuring zero unauthorized access.',
    },
    {
      q: 'Can I upgrade or downgrade my plan at any time?',
      a: 'Yes! You can switch between Free, Pro, and Team at any time. When upgrading, proration is automatic, and downgrading retains your access until the end of your billing cycle.',
    },
    {
      q: 'Does TrustBox support team folder permissions?',
      a: 'Absolutely. With Team workspaces, you can create granular roles (Viewer, Contributor, Admin), password-protect links, set expiry dates, and review audit logs.',
    },
    {
      q: 'Is there a limit on single file upload size?',
      a: 'Free accounts support files up to 2 GB each, while Pro and Team accounts support files up to 50 GB per file with instant chunked resume.',
    },
  ];

  return (
    <MarketingLayout
      activePath="/"
      onNavigate={onNavigate}
      isAuthenticated={isAuthenticated}
      onOpenDrive={onOpenDrive}
      onSignIn={onSignIn}
      onGetStarted={onGetStarted}
    >

      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-36 bg-white">

        <div className="absolute top-12 right-4 lg:right-24 w-[380px] sm:w-[540px] h-[380px] sm:h-[540px] bg-gradient-to-br from-sky-200/50 via-indigo-200/30 to-purple-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 right-1/4 w-[280px] h-[280px] bg-emerald-100/40 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-600 shadow-sm">
                <span>Your files. Your control.</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Store, share, and protect your files —{' '}
                <span className="text-[#3B82F6]">all in one place.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
                TrustBox gives individuals and teams a secure, fast, and simple way to store,
                organize, sync, and share files from anywhere.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onGetStarted}
                  className="px-7 py-3.5 rounded-full bg-[#0F172A] text-white text-base font-semibold hover:bg-slate-800 transition-all shadow-[0_4px_16px_rgba(15,23,42,0.18)] hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight size={18} className="text-[#FF643D]" />
                </button>

                <button
                  onClick={() => setShowDemoModal(true)}
                  className="px-6 py-3.5 rounded-full border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-base font-semibold transition-all hover:border-slate-300 shadow-sm flex items-center gap-2.5"
                >
                  <Play size={16} className="text-[#3B82F6] fill-[#3B82F6]" />
                  <span>Watch Demo</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-5 sm:gap-7 pt-4 text-xs sm:text-sm font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span>No hidden fees</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span>Secure & private</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span>Access anywhere</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative mt-8 lg:mt-0">

              <div className="absolute -left-6 sm:-left-8 top-1/3 z-20 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border border-sky-100 flex items-center justify-center text-sky-500 hover:scale-110 transition-transform">
                <Cloud size={28} className="animate-pulse" />
              </div>

              <div className="absolute -bottom-5 sm:-bottom-6 right-2 sm:right-6 z-20 px-4 sm:px-5 py-2.5 rounded-full bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/80 flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 hover:scale-105 transition-transform">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <Upload size={13} />
                </div>
                <span>Upload • Store • Share</span>
              </div>

              <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] overflow-hidden transition-all duration-300 hover:shadow-2xl">

                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-bold text-slate-700">TrustBox Drive</span>
                  </div>

                  <div className="flex-1 max-w-xs mx-auto">
                    <div className="relative flex items-center">
                      <Search size={13} className="absolute left-2.5 text-slate-400" />
                      <input
                        type="text"
                        readOnly
                        placeholder="Search files, folders..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none cursor-default"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Plus size={14} />
                    </div>
                    <div className="w-7 h-7 rounded-lg text-slate-400 flex items-center justify-center">
                      <Bell size={14} />
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#FF643D] text-white text-xs font-bold flex items-center justify-center">
                      P
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 min-h-[360px] text-xs">

                  <div className="col-span-4 sm:col-span-3 border-r border-slate-100 p-3 bg-slate-50/40 flex flex-col justify-between">
                    <div className="space-y-1">
                      <button
                        onClick={() => setActiveMockupTab('home')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 font-medium ${
                          activeMockupTab === 'home'
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <HardDrive size={13} />
                        <span>Home</span>
                      </button>

                      <button
                        onClick={() => setActiveMockupTab('files')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 font-medium ${
                          activeMockupTab === 'files'
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Folder size={13} />
                        <span>My Files</span>
                      </button>

                      <button
                        onClick={() => setActiveMockupTab('shared')}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 font-medium text-slate-600 hover:bg-slate-100"
                      >
                        <Share2 size={13} />
                        <span>Shared</span>
                      </button>

                      <button
                        onClick={() => setActiveMockupTab('recent')}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 font-medium text-slate-600 hover:bg-slate-100"
                      >
                        <RefreshCw size={13} />
                        <span>Recent</span>
                      </button>

                      <button
                        onClick={() => setActiveMockupTab('starred')}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 font-medium text-slate-600 hover:bg-slate-100"
                      >
                        <Sparkles size={13} />
                        <span>Starred</span>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>Storage</span>
                        <span>12.4 / 100 GB</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full w-[12%]" />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-8 sm:col-span-9 p-4 bg-white">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-800 text-sm">My Files</span>
                      <span className="text-[11px] text-slate-400">7 items</span>
                    </div>

                    <div className="space-y-1">

                      <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                            <Folder size={15} />
                          </div>
                          <span className="font-semibold text-slate-800 truncate">Documents</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">2 days ago</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500">
                            <Folder size={15} />
                          </div>
                          <span className="font-semibold text-slate-800 truncate">Photos</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">3 days ago</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                            <Folder size={15} />
                          </div>
                          <span className="font-semibold text-slate-800 truncate">Projects</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">5 days ago</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer bg-slate-50/60">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                            <FileText size={15} />
                          </div>
                          <span className="font-semibold text-slate-800 truncate">Design System.pdf</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">1 week ago</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                            <FileText size={15} />
                          </div>
                          <span className="font-semibold text-slate-800 truncate">Invoice_2025.pdf</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">1 week ago</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                            <FileText size={15} />
                          </div>
                          <span className="font-semibold text-slate-800 truncate">Notes.txt</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">2 weeks ago</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                            <ImageIcon size={15} />
                          </div>
                          <span className="font-semibold text-slate-800 truncate">Screenshot.png</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">2 weeks ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Everything you need, in one place.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Simple tools for storing, managing, sharing, and protecting your files.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">

            <div className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 mb-5 group-hover:scale-110 transition-transform">
                <Cloud size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">File Storage</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Keep your documents, photos, videos, and projects safely stored in the cloud.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-5 group-hover:scale-110 transition-transform">
                <Share2 size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Easy Sharing</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Share files and folders with simple links, permissions, and access controls.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 mb-5 group-hover:scale-110 transition-transform">
                <RefreshCw size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Sync Across Devices</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Keep your files available across your desktop, laptop, tablet, and mobile devices.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-5 group-hover:scale-110 transition-transform">
                <Shield size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Privacy & Security</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Protect your data with encryption, secure access, and privacy-focused infrastructure.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center sm:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-5 group-hover:scale-110 transition-transform">
                <Zap size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Fast & Reliable</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Upload, download, and access your files quickly whenever you need them.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-gradient-to-b from-blue-50/40 via-sky-50/20 to-white relative overflow-hidden">

        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            <div className="lg:col-span-6 space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/70 border border-blue-200/60 text-xs font-semibold text-blue-700">
                Built for individuals & teams
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Work smarter, <span className="text-[#3B82F6]">together.</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                Whether you are managing personal files or collaborating with a growing team,
                TrustBox keeps everything organized and accessible.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-3 text-sm sm:text-base font-medium text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span>Create shared folders for your team</span>
                </div>

                <div className="flex items-center gap-3 text-sm sm:text-base font-medium text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span>Manage access and permissions</span>
                </div>

                <div className="flex items-center gap-3 text-sm sm:text-base font-medium text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span>Secure sharing links with password & expiry</span>
                </div>

                <div className="flex items-center gap-3 text-sm sm:text-base font-medium text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span>Real-time synchronization across devices</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onGetStarted}
                  className="px-7 py-3.5 rounded-full bg-[#0F172A] text-white text-base font-semibold hover:bg-slate-800 transition-all shadow-[0_4px_16px_rgba(15,23,42,0.18)] hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Start Free Today</span>
                  <ArrowRight size={18} className="text-[#FF643D]" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 relative">

              <div className="rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-6">

                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">Team Workspace</h4>
                      <p className="text-xs text-slate-400">5 members active</p>
                    </div>
                  </div>

                  <div className="flex items-center -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                      S
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                      J
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                      M
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                      +2
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <Folder size={18} className="text-blue-500 fill-blue-500/20" />
                      <span className="text-sm font-semibold text-slate-800">Design</span>
                    </div>
                    <span className="text-xs text-slate-400">2 days ago</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <Folder size={18} className="text-blue-500 fill-blue-500/20" />
                      <span className="text-sm font-semibold text-slate-800">Development</span>
                    </div>
                    <span className="text-xs text-slate-400">3 days ago</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <Folder size={18} className="text-blue-500 fill-blue-500/20" />
                      <span className="text-sm font-semibold text-slate-800">Marketing</span>
                    </div>
                    <span className="text-xs text-slate-400">6 days ago</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <Folder size={18} className="text-blue-500 fill-blue-500/20" />
                      <span className="text-sm font-semibold text-slate-800">Product</span>
                    </div>
                    <span className="text-xs text-slate-400">1 week ago</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recent Activity</div>

                  <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                      S
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="font-semibold text-slate-900">Sarah</span>{' '}
                      <span className="text-slate-500">shared a file</span>
                    </div>
                    <span className="text-[10px] text-slate-400">2 hours ago</span>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                      J
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="font-semibold text-slate-900">James</span>{' '}
                      <span className="text-slate-500">updated a folder</span>
                    </div>
                    <span className="text-[10px] text-slate-400">5 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Your files deserve trust.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Built with privacy, security, and control at the core.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">

            <div className="p-7 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6">
                  <Lock size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Private by Design</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your files remain under your control. We never scan, monetize, or train models on your private data.
                </p>
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
                  <Shield size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Encrypted Storage</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Protect important data with AES-256 bit encryption at rest and TLS 1.3 encryption in transit.
                </p>
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-6">
                  <SlidersHorizontal size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Access Controls</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Control exactly who can view or edit your files with link expiration, passwords, and custom permissions.
                </p>
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-6">
                  <HardDrive size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Reliable Infrastructure</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Keep your data available when you need it with multi-region backup and 99.99% uptime SLA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-slate-50/60 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why TrustBox?
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Powerful cloud storage without unnecessary complexity.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 text-center">

            <div className="space-y-3 p-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100/60 text-blue-600 flex items-center justify-center">
                <Lock size={22} />
              </div>
              <h4 className="font-bold text-slate-900 text-base">100% Data Control</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your files, your rules. No unwanted data mining.
              </p>
            </div>

            <div className="space-y-3 p-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100/60 text-purple-600 flex items-center justify-center">
                <Zap size={22} />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Fast Performance</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Fast uploads and downloads, anytime, anywhere.
              </p>
            </div>

            <div className="space-y-3 p-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100/60 text-emerald-600 flex items-center justify-center">
                <Shield size={22} />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Simple Pricing</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Great features without the high cost.
              </p>
            </div>

            <div className="space-y-3 p-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100/60 text-amber-600 flex items-center justify-center">
                <Globe size={22} />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Anywhere Access</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Work from anywhere in the world on any device.
              </p>
            </div>

            <div className="space-y-3 p-4 col-span-2 sm:col-span-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100/60 text-rose-600 flex items-center justify-center">
                <Heart size={22} />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Built for Teams</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Simple, fast, and reliable collaboration.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 sm:py-28 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Simple plans. No surprises.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Choose the storage and collaboration features that fit your needs.
            </p>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly billing
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  billingPeriod === 'yearly'
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Yearly billing</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 text-[10px] font-bold">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">

            <div className="p-8 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-xl transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">FREE</h3>
                  <p className="text-xs text-slate-500 mt-1">For personal use</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">$0</span>
                  <span className="text-xs text-slate-500 font-medium">/ month</span>
                </div>

                <div className="space-y-3 pt-2 text-sm text-slate-600 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>10 GB storage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>File sharing with public links</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Cross-device sync</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Basic file management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Standard community support</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handlePricingAction('free')}
                  className="w-full py-3.5 rounded-full border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Get Started Free
                </button>
              </div>
            </div>

            <div className="relative p-8 sm:p-9 rounded-3xl bg-slate-900 text-white border-2 border-blue-500 shadow-2xl flex flex-col justify-between lg:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-md">
                Most Popular
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">PRO</h3>
                  <p className="text-xs text-slate-400 mt-1">For power users</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">
                    ${billingPeriod === 'monthly' ? '5' : '4'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ month</span>
                </div>

                <div className="space-y-3 pt-2 text-sm text-slate-300 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-sky-400 shrink-0" />
                    <span>500 GB secure cloud storage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-sky-400 shrink-0" />
                    <span>Advanced sharing & password protection</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-sky-400 shrink-0" />
                    <span>Unlimited file version history</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-sky-400 shrink-0" />
                    <span>Priority 24/7 customer support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-sky-400 shrink-0" />
                    <span>Advanced security & 2FA controls</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-sky-400 shrink-0" />
                    <span>Large 50 GB single file uploads</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handlePricingAction('pro')}
                  className="w-full py-3.5 rounded-full bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                  Start Pro →
                </button>
              </div>
            </div>

            <div className="p-8 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-xl transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">TEAM</h3>
                  <p className="text-xs text-slate-500 mt-1">For teams and businesses</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">
                    ${billingPeriod === 'monthly' ? '12' : '10'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ user / month</span>
                </div>

                <div className="space-y-3 pt-2 text-sm text-slate-600 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>2 TB storage per team member</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Shared team workspace & folders</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Granular team permissions & roles</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Centralized admin dashboard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Detailed team activity tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Dedicated priority account manager</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handlePricingAction('team')}
                  className="w-full py-3.5 rounded-full border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Start Team
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-500 font-medium">
            Cancel anytime. No hidden fees. 14-day money-back guarantee on all paid plans.
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600">
              Everything you need to know about TrustBox cloud storage.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-semibold text-slate-800 hover:text-slate-950"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${
                      activeFaq === idx ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>

                {activeFaq === idx && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-2 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {showDemoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
          onClick={() => setShowDemoModal(false)}
        >
          <div
            className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-sm text-slate-900">TrustBox Product Walkthrough</span>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 sm:p-10 space-y-6 text-center bg-slate-50/50">
              <div className="relative aspect-video rounded-2xl bg-slate-900 text-white overflow-hidden flex flex-col items-center justify-center p-6 shadow-inner">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                  <Play size={24} className="fill-white translate-x-0.5" />
                </div>
                <h4 className="mt-4 font-bold text-lg text-white">TrustBox in 90 Seconds</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Discover how high-speed chunked uploads, real-time sync, and team permissions make file management effortless.
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setShowDemoModal(false);
                    onGetStarted();
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#0F172A] text-white text-sm font-semibold hover:bg-slate-800"
                >
                  Try TrustBox Free →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MarketingLayout>
  );
};
