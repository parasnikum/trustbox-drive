import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthStore } from '../../stores/authStore';
import { TrustBoxLogo } from '../marketing/TrustBoxLogo';
import {
  Folder,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Loader2,
  AlertCircle,
  Key,
  CheckCircle2,
  Smartphone,
  ArrowLeft,
} from 'lucide-react';

interface AuthScreenProps {
  onBackToLanding?: () => void;
  initialRegister?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onBackToLanding, initialRegister = false }) => {
  const { loginWithRedirect, user: auth0User, isAuthenticated: isAuth0Authenticated, isLoading: isAuth0Loading } = useAuth0();
  const { login, register, forgotPassword, resetPassword, isLoading, error } = useAuthStore();

  const [isRegister, setIsRegister] = useState(initialRegister);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const [mode, setMode] = useState<'auth' | 'forgot' | 'reset'>('auth');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuth0Authenticated && auth0User) {
      const userEmail = auth0User.email || `${auth0User.nickname || 'user'}@auth0.user`;
      const userName = auth0User.name || auth0User.nickname || 'Auth0 User';

      register(userEmail, 'auth0_session_token_123!', userName).catch(() => {
        login(userEmail, 'auth0_session_token_123!').catch((err) => {
          console.error('Auth0 local sync error:', err);
        });
      });
    }
  }, [isAuth0Authenticated, auth0User]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'auth') {
        if (isRegister) {
          if (!name.trim()) {
            setLocalError('Please enter your name');
            return;
          }
          await register(email, password, name);
        } else {
          await login(email, password);
        }
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setLocalError('Please enter your email');
          return;
        }
        const token = await forgotPassword(email);
        setResetToken(token);
        setMode('reset');
        setSuccessMessage('Reset token generated. Enter your new password below.');
      } else if (mode === 'reset') {
        if (!newPassword.trim()) {
          setLocalError('Please enter a new password');
          return;
        }
        await resetPassword(resetToken, newPassword);
        setSuccessMessage('Password reset successfully! Please log in.');
        setMode('auth');
        setPassword('');
      }
    } catch (err: any) {
      setLocalError(err.message || err.response?.data?.error || 'Authentication action failed');
    }
  };

  const handleDemoLogin = async () => {
    setLocalError(null);
    try {
      await login('demo@cloudnest.io', 'demo123456');
    } catch (err) {
      try {
        await register('demo@cloudnest.io', 'demo123456', 'Demo User');
      } catch (regErr: any) {
        setLocalError(regErr.message || 'Demo login failed');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans relative overflow-hidden transition-colors">

      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>
        )}

        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <TrustBoxLogo size="lg" />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Secure cloud storage built for people and teams</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">

          {mode === 'auth' && (
            <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-2xl mb-6 border border-slate-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setLocalError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  !isRegister
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setLocalError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isRegister
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {(error || localError) && (
            <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{localError || error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3.5 bg-brand-mint-light border border-brand-mint/30 rounded-2xl flex items-start gap-2.5 text-brand-mint text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'auth' && isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-xs transition-all"
                  />
                </div>
              </div>
            )}

            {(mode === 'auth' || mode === 'forgot') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@workspace.io"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-xs transition-all"
                  />
                </div>
              </div>
            )}

            {mode === 'auth' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Password
                  </label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setLocalError(null);
                      }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-xs transition-all"
                  />
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-xs transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isAuth0Loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.99] disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isLoading || isAuth0Loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'auth'
                      ? isRegister
                        ? 'Create Account'
                        : 'Sign In to Workspace'
                      : mode === 'forgot'
                        ? 'Send Reset Token'
                        : 'Reset Password'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode === 'auth' && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2.5 px-4 bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Quick Sign-In with Demo Account</span>
              </button>
            </div>
          )}

          {mode !== 'auth' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('auth');
                  setLocalError(null);
                }}
                className="text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
