import React from 'react';
import { MarketingLayout } from './MarketingLayout';
import {
  Shield,
  Lock,
  Key,
  Server,
  EyeOff,
  CheckCircle2,
  FileCheck,
  Cpu,
  RefreshCw,
  HardDrive,
  Users,
  Check,
  AlertCircle,
  Globe,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SecurityPageProps {
  onNavigate: (path: string) => void;
  isAuthenticated?: boolean;
  onOpenDrive?: () => void;
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({
  onNavigate,
  isAuthenticated = false,
  onOpenDrive,
  onSignIn,
  onGetStarted,
}) => {
  const securityPillars = [
    {
      title: 'Data Encryption',
      desc: 'All stored assets are encrypted using industry-standard AES-256 GCM encryption. In transit, data is safeguarded with TLS 1.3 cryptographic protocols with perfect forward secrecy.',
      icon: Lock,
      stats: '256-bit AES GCM',
    },
    {
      title: 'Account Security & 2FA',
      desc: 'Protect logins with hardware security keys (FIDO2/WebAuthn), standard TOTP authenticators (Google Authenticator, 1Password), and cryptographic session verification.',
      icon: Key,
      stats: 'TOTP & FIDO2',
    },
    {
      title: 'Access Controls & Roles',
      desc: 'Fine-grained permissions allow you to designate Viewers, Commenters, Editors, and Admins. Set custom password requirements and auto-revoking guest passes.',
      icon: Users,
      stats: 'Role-Based RBAC',
    },
    {
      title: 'Privacy & Zero Mining',
      desc: 'We operate under a strict privacy-first charter: your data is never read, analyzed, or indexed for advertisements, and never supplied to external AI training pipelines.',
      icon: EyeOff,
      stats: 'Zero-Telemetry',
    },
    {
      title: 'Secure Sharing',
      desc: 'Generate public links with expiration timers, view counters, password challenges, and download suppression to prevent unauthorized distribution.',
      icon: Shield,
      stats: 'Self-Destruct Links',
    },
    {
      title: 'Infrastructure Reliability',
      desc: 'Hosted in ISO 27001 and SOC 2 Type II certified data centers. Multi-region automated replication and automatic failover provide guaranteed 99.99% availability.',
      icon: Server,
      stats: '99.99% SLA Uptime',
    },
  ];

  return (
    <MarketingLayout
      activePath="/security"
      onNavigate={onNavigate}
      isAuthenticated={isAuthenticated}
      onOpenDrive={onOpenDrive}
      onSignIn={onSignIn}
      onGetStarted={onGetStarted}
    >

      <section className="pt-16 pb-16 sm:pt-20 sm:pb-24 text-center bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold">
            <Shield size={14} className="text-[#FF643D]" />
            Enterprise-Grade Trust & Compliance
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
            Security you can trust.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Built from day one with privacy, security, and strict control at the core.
            Here is how TrustBox protects your most valuable digital assets.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0B1221] text-white border border-slate-800 shadow-2xl relative overflow-hidden">

          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

          <div className="relative space-y-8">
            <div className="max-w-2xl">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Cryptographic Pipeline
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Zero-Trust Storage Architecture
              </h2>
              <p className="text-sm text-slate-300 mt-2">
                Every byte uploaded to TrustBox undergoes rigorous multi-layer validation and encryption before being persisted across replicated clusters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">1</div>
                <h4 className="font-bold text-white text-sm">Client Edge</h4>
                <p className="text-slate-400 text-xs">
                  Files are split into discrete chunks and encrypted on transit via TLS 1.3.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">2</div>
                <h4 className="font-bold text-white text-sm">Auth Gateway</h4>
                <p className="text-slate-400 text-xs">
                  Cryptographic session verification checks database revoke states and active IP rules.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">3</div>
                <h4 className="font-bold text-white text-sm">At-Rest Vault</h4>
                <p className="text-slate-400 text-xs">
                  AES-256 GCM key rotation encrypts objects with unique per-file key hashes.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">4</div>
                <h4 className="font-bold text-white text-sm">Multi-Region S3</h4>
                <p className="text-slate-400 text-xs">
                  Encrypted blobs are mirrored across 3 geographically isolated storage zones.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {securityPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Icon size={22} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {pillar.stats}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">{pillar.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{pillar.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <Check size={14} strokeWidth={3} />
                  <span>Verified Security Standard</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </MarketingLayout>
  );
};
