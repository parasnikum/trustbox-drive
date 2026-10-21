import React, { useState } from 'react';
import { MarketingLayout } from './MarketingLayout';
import { Check, Minus, Sparkles, HelpCircle, ArrowRight, Shield, Zap, Users } from 'lucide-react';

interface PricingPageProps {
  onNavigate: (path: string) => void;
  isAuthenticated?: boolean;
  onOpenDrive?: () => void;
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onNavigate,
  isAuthenticated = false,
  onOpenDrive,
  onSignIn,
  onGetStarted,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handlePlanSelect = (plan: 'free' | 'pro' | 'team') => {
    if (isAuthenticated && onOpenDrive) {
      onOpenDrive();
    } else if (onGetStarted) {
      onGetStarted();
    }
  };

  const comparisonRows = [
    {
      category: 'Storage & Capacity',
      features: [
        { name: 'Cloud Storage Capacity', free: '10 GB', pro: '500 GB', team: '2 TB / user' },
        { name: 'Max Single File Upload Size', free: '2 GB', pro: '50 GB', team: '100 GB' },
        { name: 'Unlimited Daily Bandwidth', free: true, pro: true, team: true },
      ],
    },
    {
      category: 'File Sharing & Links',
      features: [
        { name: 'Public Sharing Links', free: true, pro: true, team: true },
        { name: 'Password Protected Links', free: false, pro: true, team: true },
        { name: 'Link Expiration Dates', free: false, pro: true, team: true },
        { name: 'Download Disable Mode (View Only)', free: false, pro: true, team: true },
      ],
    },
    {
      category: 'Sync & Devices',
      features: [
        { name: 'Cross-Device Web Sync', free: true, pro: true, team: true },
        { name: 'Desktop Client Sync (Windows / Mac)', free: true, pro: true, team: true },
        { name: 'Mobile Web & Tablet Access', free: true, pro: true, team: true },
        { name: 'Concurrent Connected Devices', free: '3 devices', pro: 'Unlimited', team: 'Unlimited' },
      ],
    },
    {
      category: 'Version History & Recovery',
      features: [
        { name: 'File Version History', free: '7 days', pro: '30 days', team: 'Unlimited' },
        { name: 'Trash Recovery Window', free: '30 days', pro: '90 days', team: 'Unlimited' },
        { name: 'One-Click Version Restore', free: true, pro: true, team: true },
      ],
    },
    {
      category: 'Team Workspaces & Collaboration',
      features: [
        { name: 'Shared Team Folders', free: false, pro: false, team: true },
        { name: 'Team Member Management', free: false, pro: false, team: true },
        { name: 'Centralized Billing for Teams', free: false, pro: false, team: true },
        { name: 'Real-time Co-presence & Lock', free: false, pro: true, team: true },
      ],
    },
    {
      category: 'Permissions & Roles',
      features: [
        { name: 'Granular Folder Permissions', free: 'Basic', pro: 'Advanced', team: 'Custom Role-Based' },
        { name: 'Viewer / Editor / Owner Roles', free: true, pro: true, team: true },
        { name: 'Workspace Admin Delegation', free: false, pro: false, team: true },
      ],
    },
    {
      category: 'Admin Controls & Audit',
      features: [
        { name: 'Admin Console Dashboard', free: false, pro: false, team: true },
        { name: 'Organization Activity & Audit Logs', free: false, pro: false, team: true },
        { name: 'Centralized Storage Allocation', free: false, pro: false, team: true },
      ],
    },
    {
      category: 'Security & Compliance',
      features: [
        { name: 'AES-256 Bit Encryption at Rest', free: true, pro: true, team: true },
        { name: 'TLS 1.3 Encryption in Transit', free: true, pro: true, team: true },
        { name: 'Two-Factor Authentication (2FA)', free: true, pro: true, team: true },
        { name: 'HIPAA & GDPR Compliance Pack', free: false, pro: false, team: true },
      ],
    },
    {
      category: 'Customer Support',
      features: [
        { name: 'Community & Docs Support', free: true, pro: true, team: true },
        { name: 'Priority Email Response (< 4h)', free: false, pro: true, team: true },
        { name: 'Dedicated Account Manager & Phone', free: false, pro: false, team: true },
      ],
    },
  ];

  return (
    <MarketingLayout
      activePath="/pricing"
      onNavigate={onNavigate}
      isAuthenticated={isAuthenticated}
      onOpenDrive={onOpenDrive}
      onSignIn={onSignIn}
      onGetStarted={onGetStarted}
    >

      <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 text-center bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold">
            <Sparkles size={14} className="text-[#FF643D]" />
            Predictable & Transparent Pricing
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
            Plans that scale with you.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Choose the right storage, sharing, and team collaboration features.
            No hidden fees, no lock-in. Cancel anytime.
          </p>

          <div className="pt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Yearly billing</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

          <div className="p-8 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all">
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
                  <span>Standard support</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => handlePlanSelect('free')}
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
                  <span>500 GB storage</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-sky-400 shrink-0" />
                  <span>Advanced sharing controls</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-sky-400 shrink-0" />
                  <span>Unlimited file versions</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-sky-400 shrink-0" />
                  <span>Priority support</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-sky-400 shrink-0" />
                  <span>Advanced security</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-sky-400 shrink-0" />
                  <span>Larger file uploads</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => handlePlanSelect('pro')}
                className="w-full py-3.5 rounded-full bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                Start Pro →
              </button>
            </div>
          </div>

          <div className="p-8 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all">
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
                  <span>2 TB storage per user</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Shared team workspace</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Team permissions</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Admin controls</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Activity tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Priority support</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => handlePlanSelect('team')}
                className="w-full py-3.5 rounded-full border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Start Team
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 font-medium mt-6">
          Cancel anytime. No hidden fees. 14-day money-back guarantee on all plans.
        </p>
      </section>

      <section className="py-20 bg-slate-50/70 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Compare All Features
            </h2>
            <p className="text-sm text-slate-600">
              A comprehensive breakdown of all features across Free, Pro, and Team tiers.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">

            <div className="grid grid-cols-12 p-5 bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-800">
              <div className="col-span-6 sm:col-span-6">Feature</div>
              <div className="col-span-2 text-center text-slate-700">Free</div>
              <div className="col-span-2 text-center text-blue-600">Pro</div>
              <div className="col-span-2 text-center text-slate-900">Team</div>
            </div>

            {comparisonRows.map((cat, idx) => (
              <div key={idx} className="border-b border-slate-100 last:border-b-0">
                <div className="px-5 py-3 bg-slate-100/60 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {cat.category}
                </div>

                {cat.features.map((feat, fIdx) => (
                  <div
                    key={fIdx}
                    className="grid grid-cols-12 px-5 py-3.5 text-xs sm:text-sm border-b border-slate-50 hover:bg-slate-50/50 transition-colors items-center"
                  >
                    <div className="col-span-6 text-slate-700 font-medium">{feat.name}</div>

                    <div className="col-span-2 text-center">
                      {typeof feat.free === 'boolean' ? (
                        feat.free ? (
                          <Check size={16} className="text-emerald-500 mx-auto" />
                        ) : (
                          <Minus size={16} className="text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="font-semibold text-slate-600">{feat.free}</span>
                      )}
                    </div>

                    <div className="col-span-2 text-center">
                      {typeof feat.pro === 'boolean' ? (
                        feat.pro ? (
                          <Check size={16} className="text-sky-500 mx-auto" />
                        ) : (
                          <Minus size={16} className="text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="font-bold text-blue-600">{feat.pro}</span>
                      )}
                    </div>

                    <div className="col-span-2 text-center">
                      {typeof feat.team === 'boolean' ? (
                        feat.team ? (
                          <Check size={16} className="text-emerald-500 mx-auto" />
                        ) : (
                          <Minus size={16} className="text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="font-bold text-slate-900">{feat.team}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};
