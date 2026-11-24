import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  HeartPulse,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building2,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { normalizeLoginId, isValidLoginIdFormat } from '../../utils/employeeIdGenerator';

interface StaffLoginPageProps {
  onSwitchToOwner?: () => void;
}

export const StaffLoginPage: React.FC<StaffLoginPageProps> = ({ onSwitchToOwner }) => {
  const { loginWithStaffId, isAuthLoading } = useAuth();
  const { success, error: toastError } = useToast();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = normalizeLoginId(userId);
    if (!cleanId) {
      setErrorMessage('Please enter your Employee User ID.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithStaffId(cleanId, password);
      success('Staff Authentication Successful', `Logged in with ID ${cleanId}. Redirecting to your dashboard...`);
    } catch (err: any) {
      console.error('Staff Login Error:', err);
      const msg = err.message || 'Authentication failed. Please verify your Employee User ID and Password.';
      setErrorMessage(msg);
      toastError('Login Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4 select-none font-sans">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 font-black">
            <HeartPulse className="w-9 h-9" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <h1 className="text-2xl font-black text-white tracking-tight">UPSTAGE HOSPITAL</h1>
            <span className="text-emerald-300 font-extrabold text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/40">
              STAFF PORTAL
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Unified Clinical & Healthcare Staff Login System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Staff Sign In</h2>
            <p className="text-xs text-slate-500">
              Sign in with your assigned Employee Login ID (e.g. <span className="font-mono font-bold text-emerald-700">RIO@2026DO001</span> or <span className="font-mono font-bold text-emerald-700">UPS@2026NU001</span>)
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleStaffLogin} className="space-y-4 text-xs">
            {/* Employee User ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee User ID *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. RIO@2026DO001 or UPS@2026NU001"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 font-mono font-bold uppercase tracking-wider text-slate-900 outline-none transition-all placeholder:font-normal placeholder:normal-case placeholder:text-slate-400"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Case-insensitive. No email address required.
              </p>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password *</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 font-mono text-slate-900 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isAuthLoading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Staff Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Staff Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Executive / Owner Portal */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Hospital Owner or Executive?</span>
            <button
              type="button"
              onClick={() => {
                if (onSwitchToOwner) {
                  onSwitchToOwner();
                } else if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/');
                  window.location.reload();
                }
              }}
              className="font-bold text-slate-800 hover:text-emerald-700 hover:underline flex items-center gap-1"
            >
              <Building2 className="w-3.5 h-3.5" />
              Owner Portal Sign In
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Multi-Tenant Isolated Authentication & Automated Role Redirection</span>
        </div>
      </div>

      {/* Forgot Password Guidance Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hospital Staff Password Assistance</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                For patient data privacy and hospital security, staff passwords cannot be reset automatically without administrator verification.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="font-semibold text-slate-900">How to reset your password:</div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                <li>Contact your <strong>Hospital Admin</strong> or <strong>HR Manager</strong>.</li>
                <li>Provide your Employee User ID (<span className="font-mono font-bold">e.g. {userId || 'RIO@2026DO001'}</span>).</li>
                <li>The Administrator will issue a new secure temporary password for your account.</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Understood, Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
