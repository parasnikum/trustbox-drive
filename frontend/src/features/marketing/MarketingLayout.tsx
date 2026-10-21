import React, { useState, useEffect } from 'react';
import { TrustBoxLogo } from './TrustBoxLogo';
import { ArrowRight, Menu, X, ChevronRight, Github, Twitter, Youtube, Linkedin, Shield, HardDrive, Check, Sparkles } from 'lucide-react';

interface MarketingLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  onNavigate: (path: string) => void;
  isAuthenticated?: boolean;
  onOpenDrive?: () => void;
  onSignIn?: () => void;
  onGetStarted?: () => void;
  hideCTA?: boolean;
}

export const MarketingLayout: React.FC<MarketingLayoutProps> = ({
  children,
  activePath = '/',
  onNavigate,
  isAuthenticated = false,
  onOpenDrive,
  onSignIn,
  onGetStarted,
  hideCTA = false,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', path: '/features' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Security', path: '/security' },
    { label: 'Docs', path: '/docs' },
    { label: 'About', path: '/about' },
  ];

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    onNavigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleActionClick = (action: 'drive' | 'signin' | 'signup') => {
    setMobileMenuOpen(false);
    if (action === 'drive' && onOpenDrive) {
      onOpenDrive();
    } else if (action === 'signin' && onSignIn) {
      onSignIn();
    } else if (action === 'signup' && onGetStarted) {
      onGetStarted();
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#FF643D]/20 selection:text-[#FF643D]">

      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'
            : 'bg-white/70 backdrop-blur-sm border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          <div
            onClick={() => handleNavClick('/')}
            className="cursor-pointer transition-opacity hover:opacity-90 flex items-center"
          >
            <TrustBoxLogo size="md" />
          </div>

          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((item) => {
              const isActive = activePath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'text-slate-900 font-semibold bg-slate-100/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={() => handleActionClick('drive')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F172A] text-white text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow active:scale-95"
              >
                <HardDrive size={16} className="text-[#FF643D]" />
                Go to My Drive →
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleActionClick('signin')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleActionClick('signup')}
                  className="px-5 py-2.5 rounded-full bg-[#0F172A] text-white text-sm font-semibold hover:bg-slate-800 transition-all shadow-[0_2px_10px_rgba(15,23,42,0.15)] hover:shadow-lg active:scale-95"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-xl">
            <div className="space-y-1">
              {navLinks.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium flex items-center justify-between ${
                    activePath === item.path
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              {isAuthenticated ? (
                <button
                  onClick={() => handleActionClick('drive')}
                  className="w-full py-3 rounded-full bg-[#0F172A] text-white text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <HardDrive size={16} className="text-[#FF643D]" />
                  Go to My Drive
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleActionClick('signin')}
                    className="w-full py-3 rounded-full border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-50"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleActionClick('signup')}
                    className="w-full py-3 rounded-full bg-[#0F172A] text-white text-sm font-semibold hover:bg-slate-800 shadow-md"
                  >
                    Get Started Free →
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="w-full">{children}</main>

      {!hideCTA && (
        <section className="relative overflow-hidden bg-[#0A0F1D] text-white py-24 sm:py-32">

          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 1440 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <path
                d="M0 240C240 180 480 300 720 220C960 140 1200 260 1440 200V400H0V240Z"
                fill="url(#cta_gradient_1)"
              />
              <path
                d="M0 280C300 220 600 340 900 260C1200 180 1350 300 1440 250V400H0V280Z"
                fill="url(#cta_gradient_2)"
                opacity="0.5"
              />
              <defs>
                <linearGradient id="cta_gradient_1" x1="0" y1="0" x2="1440" y2="400" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1E293B" />
                  <stop offset="1" stopColor="#0F172A" />
                </linearGradient>
                <linearGradient id="cta_gradient_2" x1="0" y1="0" x2="1440" y2="400" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38BDF8" stopOpacity="0.4" />
                  <stop offset="1" stopColor="#818CF8" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-sky-400">
              <Sparkles size={14} className="text-[#FF643D]" />
              Start storing smarter in 30 seconds
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Take control of your files today.
            </h2>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              Store, organize, share, and protect everything that matters with TrustBox.
              Join thousands of individuals and teams worldwide.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => handleActionClick(isAuthenticated ? 'drive' : 'signup')}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-base hover:bg-slate-100 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{isAuthenticated ? 'Open TrustBox Drive' : 'Create Your Free Account'}</span>
                <ArrowRight size={18} className="text-[#FF643D]" />
              </button>
              <button
                onClick={() => handleNavClick('/pricing')}
                className="w-full sm:w-auto px-7 py-4 rounded-full bg-slate-800/70 border border-slate-700 text-slate-200 font-semibold text-base hover:bg-slate-800 hover:text-white transition-all"
              >
                View Plans & Pricing
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" /> Free 10 GB storage
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" /> Cancel anytime
              </span>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-[#060913] text-slate-400 py-16 sm:py-20 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 pb-16 border-b border-slate-800/80">

            <div className="md:col-span-4 space-y-4">
              <div onClick={() => handleNavClick('/')} className="cursor-pointer">
                <TrustBoxLogo size="md" variant="white" />
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Secure cloud storage built for people and teams. Store, manage, sync, and collaborate with complete peace of mind.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                  aria-label="GitHub"
                >
                  <Github size={16} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                  aria-label="Twitter / X"
                >
                  <Twitter size={16} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={16} />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube size={16} />
                </a>
              </div>
            </div>

            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Product</h4>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <button
                      onClick={() => handleNavClick('/features')}
                      className="hover:text-white transition-colors"
                    >
                      Features
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavClick('/pricing')}
                      className="hover:text-white transition-colors"
                    >
                      Pricing
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavClick('/security')}
                      className="hover:text-white transition-colors"
                    >
                      Security
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavClick('/docs')}
                      className="hover:text-white transition-colors"
                    >
                      Docs & API
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleActionClick('drive')}
                      className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                    >
                      Web Drive Demo →
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Company</h4>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <button
                      onClick={() => handleNavClick('/about')}
                      className="hover:text-white transition-colors"
                    >
                      About Us
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavClick('/about')}
                      className="hover:text-white transition-colors"
                    >
                      Our Story
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavClick('/about')}
                      className="hover:text-white transition-colors"
                    >
                      Careers
                    </button>
                  </li>
                  <li>
                    <a
                      href="mailto:support@trustbox.io"
                      className="hover:text-white transition-colors"
                    >
                      Contact Support
                    </a>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Legal</h4>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <button
                      onClick={() => handleNavClick('/security')}
                      className="hover:text-white transition-colors"
                    >
                      Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavClick('/security')}
                      className="hover:text-white transition-colors"
                    >
                      Terms of Service
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavClick('/security')}
                      className="hover:text-white transition-colors"
                    >
                      Security & Compliance
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavClick('/security')}
                      className="hover:text-white transition-colors"
                    >
                      GDPR & Privacy
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© 2026 TrustBox Inc. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <span>Crafted for uncompromising speed, privacy, and control.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
