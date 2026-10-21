import React, { useState } from 'react';
import { MarketingLayout } from './MarketingLayout';
import {
  BookOpen,
  Search,
  Code,
  Key,
  Folder,
  Share2,
  Lock,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Shield,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface DocsPageProps {
  onNavigate: (path: string) => void;
  isAuthenticated?: boolean;
  onOpenDrive?: () => void;
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export const DocsPage: React.FC<DocsPageProps> = ({
  onNavigate,
  isAuthenticated = false,
  onOpenDrive,
  onSignIn,
  onGetStarted,
}) => {
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');

  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const navCategories = [
    { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
    { id: 'account', title: 'Account & Sessions', icon: Key },
    { id: 'file-management', title: 'File Management', icon: Folder },
    { id: 'sharing', title: 'Sharing & Links', icon: Share2 },
    { id: 'api-reference', title: 'REST API Reference', icon: Terminal },
    { id: 'webhooks', title: 'Webhooks & Events', icon: Code },
    { id: 'security', title: 'Security & Auth', icon: Shield },
    { id: 'faq', title: 'FAQ & Troubleshooting', icon: HelpCircle },
  ];

  const codeSnippets: Record<string, Record<string, string>> = {
    upload: {
      curl: `curl -X POST https://api.trustbox.io/v1/files/upload \\
  -H "Authorization: Bearer tb_sec_9x821..." \\
  -F "file=@presentation.pdf" \\
  -F "folderId=fld_design_123"`,
      javascript: `import { TrustBoxClient } from '@trustbox/sdk';

const client = new TrustBoxClient({ apiKey: 'tb_sec_9x821...' });

const file = await client.files.upload({
  file: document.getElementById('uploader').files[0],
  folderId: 'fld_design_123',
});
console.log('Uploaded File ID:', file.id);`,
      python: `from trustbox import TrustBox

client = TrustBox(api_key="tb_sec_9x821...")

with open("presentation.pdf", "rb") as f:
    file = client.files.upload(
        file=f,
        folder_id="fld_design_123"
    )
print(f"File uploaded successfully: {file.id}")`,
    },
    share: {
      curl: `curl -X POST https://api.trustbox.io/v1/files/fil_8829/shares \\
  -H "Authorization: Bearer tb_sec_9x821..." \\
  -H "Content-Type: application/json" \\
  -d '{"permission":"VIEW","expiresInDays":7,"password":"secretPassword123"}'`,
      javascript: `const shareLink = await client.shares.create({
  fileId: 'fil_8829',
  permission: 'VIEW',
  expiresInDays: 7,
  password: 'secretPassword123',
});
console.log('Share URL:', shareLink.url);`,
      python: `share_link = client.shares.create(
    file_id="fil_8829",
    permission="VIEW",
    expires_in_days=7,
    password="secretPassword123"
)
print(f"Share link created: {share_link.url}")`,
    },
  };

  return (
    <MarketingLayout
      activePath="/docs"
      onNavigate={onNavigate}
      isAuthenticated={isAuthenticated}
      onOpenDrive={onOpenDrive}
      onSignIn={onSignIn}
      onGetStarted={onGetStarted}
      hideCTA={true}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          <aside className="lg:col-span-3 space-y-6">

            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <nav className="space-y-1">
              {navCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeSection === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveSection(cat.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                      <span>{cat.title}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-blue-600" />}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <span className="font-bold text-slate-900 block">Developer Support</span>
              <p className="text-slate-500 leading-relaxed">
                Need enterprise SLA or custom webhooks? Our solutions team is available 24/7.
              </p>
              <a
                href="mailto:dev@trustbox.io"
                className="text-blue-600 font-semibold hover:underline block pt-1"
              >
                Contact Dev Team →
              </a>
            </div>
          </aside>

          <div className="lg:col-span-9 space-y-12">

            {activeSection === 'getting-started' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Quickstart Guide
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
                    Getting Started with TrustBox
                  </h1>
                  <p className="text-base text-slate-600 mt-2 leading-relaxed">
                    Learn how to set up your account, organize your first directory, configure 2FA,
                    and automate file uploads via API or web client.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                      1
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Create an Account</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Register with email or Single Sign-On (SSO) to get your initial free 10 GB cloud storage.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center">
                      2
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Upload & Organize</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Drag-and-drop folders directly into the web interface or use our CLI sync engine.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center">
                      3
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Share Securely</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Generate protected links with custom expiry timers and invite team members to collaborate.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-lg font-bold text-slate-900">Upload File via REST API</h3>
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs">
                      {(['curl', 'javascript', 'python'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setCodeLanguage(lang)}
                          className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                            codeLanguage === lang
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative rounded-2xl bg-[#0B1221] text-slate-200 p-5 font-mono text-xs overflow-x-auto shadow-xl border border-slate-800">
                    <button
                      onClick={() => copySnippet(codeSnippets.upload[codeLanguage], 'upload-code')}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Copy code"
                    >
                      {copiedCode === 'upload-code' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <pre className="pr-12 leading-relaxed">
                      <code>{codeSnippets.upload[codeLanguage]}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'api-reference' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    API Reference
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
                    TrustBox REST API v1
                  </h1>
                  <p className="text-base text-slate-600 mt-2 leading-relaxed">
                    Use our developer API to programmatic upload, download, share, and manage cloud assets.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-100 text-blue-700">POST</span>
                      <span className="font-mono text-sm text-slate-800">/v1/files/upload</span>
                    </div>
                    <span className="text-xs text-slate-500">Multipart chunked upload</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-100 text-emerald-700">GET</span>
                      <span className="font-mono text-sm text-slate-800">/v1/files/:id/download</span>
                    </div>
                    <span className="text-xs text-slate-500">Stream or inline render</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-purple-100 text-purple-700">POST</span>
                      <span className="font-mono text-sm text-slate-800">/v1/files/:id/shares</span>
                    </div>
                    <span className="text-xs text-slate-500">Create password link</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection !== 'getting-started' && activeSection !== 'api-reference' && (
              <div className="space-y-6 animate-fade-in">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Documentation
                </span>
                <h1 className="text-3xl font-extrabold text-slate-900 capitalize">
                  {activeSection.replace('-', ' ')}
                </h1>
                <p className="text-base text-slate-600 leading-relaxed">
                  Detailed guides, best practices, and integration examples for {activeSection.replace('-', ' ')} on TrustBox.
                </p>

                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  <BookOpen size={32} className="mx-auto text-blue-600" />
                  <h3 className="font-bold text-slate-900">Comprehensive Docs Ready</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Full architectural and implementation documentation is maintained continuously with our open SDKs.
                  </p>
                  <button
                    onClick={() => setActiveSection('getting-started')}
                    className="px-4 py-2 rounded-full bg-[#0F172A] text-white text-xs font-semibold"
                  >
                    Back to Quickstart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
};
