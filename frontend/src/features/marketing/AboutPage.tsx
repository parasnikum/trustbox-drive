import React from 'react';
import { MarketingLayout } from './MarketingLayout';
import {
  Sparkles,
  Heart,
  Shield,
  Zap,
  Target,
  Users,
  ArrowRight,
  Globe,
  Mail,
  Award,
  Check,
} from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
  isAuthenticated?: boolean;
  onOpenDrive?: () => void;
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onNavigate,
  isAuthenticated = false,
  onOpenDrive,
  onSignIn,
  onGetStarted,
}) => {
  const values = [
    {
      title: 'Privacy as a Fundamental Right',
      desc: 'We never treat your private files as training data or monetization targets. Your files belong exclusively to you.',
      icon: Shield,
    },
    {
      title: 'Uncompromising Simplicity',
      desc: 'Powerful storage does not need to be bloated or complex. We design minimal, blisteringly fast interfaces that get out of your way.',
      icon: Zap,
    },
    {
      title: 'Built for Longevity',
      desc: 'Digital files represent your life’s memories, creative work, and business operations. We build infrastructure meant to endure decades.',
      icon: Target,
    },
    {
      title: 'Radical Reliability',
      desc: 'Uptime, checksum integrity, and cross-region redundancy are not marketing bullet points; they are our foundational engineering requirement.',
      icon: Award,
    },
  ];

  return (
    <MarketingLayout
      activePath="/about"
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
            Our Mission & Philosophy
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Building a simpler way to manage your digital world.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            TrustBox was founded on the belief that cloud storage should be fast, private,
            and delightfully simple — giving control back to individuals and teams.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Why We Started
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              The problem with legacy cloud drives.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              For too long, cloud storage has been monopolized by advertising giants that scan your files,
              clutter your workspace with unnecessary apps, and trap your data behind convoluted pricing tiers.
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              We built TrustBox to be the alternative: an independent, laser-focused platform that does
              one thing exceptionally well — securely store, organize, and share your files with total peace of mind.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-6 shadow-2xl">
            <div className="space-y-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Our Pledge</span>
              <h3 className="text-2xl font-bold">The TrustBox Promise</h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <Check size={16} className="text-emerald-400 shrink-0" />
                <span>Zero advertising, tracking, or telemetry mining</span>
              </li>
              <li className="flex items-center gap-3">
                <Check size={16} className="text-emerald-400 shrink-0" />
                <span>Full resolution files with zero lossy compression</span>
              </li>
              <li className="flex items-center gap-3">
                <Check size={16} className="text-emerald-400 shrink-0" />
                <span>Open export anytime with one-click zip download</span>
              </li>
              <li className="flex items-center gap-3">
                <Check size={16} className="text-emerald-400 shrink-0" />
                <span>End-to-end encrypted link sharing</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50/70 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900">Our Core Principles</h2>
            <p className="text-sm text-slate-600">The values that guide every product decision we make.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <div
                  key={idx}
                  className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all space-y-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{v.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};
