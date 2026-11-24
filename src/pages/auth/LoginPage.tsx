import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  HeartPulse,
  Lock,
  Mail,
  Building,
  User,
  Phone,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Shield
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, registerHospitalOwner, resetPassword, isAuthLoading } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Register Hospital State
  const [regHospitalName, setRegHospitalName] = useState('');
  const [regCity, setRegCity] = useState('New Delhi');
  const [regPhone, setRegPhone] = useState('+91 11 4050 9900');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
      success('Authentication Successful', 'Welcome to Upstage Hospital ERP.');
    } catch (err: any) {
      console.error('Sign In Error:', err);
      let msg = err.message || 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please verify your registered staff credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please wait a moment before trying again.';
      }
      setErrorMessage(msg);
      toastError('Authentication Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setErrorMessage('Please enter your registered staff email address.');
      return;
    }

    setIsResetting(true);
    setErrorMessage(null);
    try {
      await resetPassword(resetEmail.trim());
      setResetSuccess(true);
      info('Password Reset Sent', 'Check your email inbox for password reset instructions.');
    } catch (err: any) {
      console.error('Password Reset Error:', err);
      setErrorMessage(err.message || 'Failed to send password reset email. Please verify the email address.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleRegisterHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!regHospitalName.trim() || !regOwnerName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage('Please fill in all required registration fields.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerHospitalOwner({
        hospitalName: regHospitalName,
        ownerName: regOwnerName,
        email: regEmail,
        pass: regPassword,
        phone: regPhone,
        city: regCity
      });
      success('Hospital Created', `${regHospitalName} registered with Owner account.`);
    } catch (err: any) {
      console.error('Registration Error:', err);
      let msg = 'Could not register hospital. Please check details.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'The password is too weak. Please use at least 6 characters.';
      }
      setErrorMessage(msg);
      toastError('Registration Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 flex items-center justify-center p-4 select-none font-sans">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20 font-bold">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">UPSTAGE</h1>
            <span className="text-emerald-700 font-extrabold text-xs bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
              ERP
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Enterprise Healthcare Management & Clinical Operating System
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register Hospital
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@upstagehospital.org"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isAuthLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in via Firebase...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Hospital Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(!showForgotPassword);
                    setResetEmail(email);
                    setResetSuccess(false);
                    setErrorMessage(null);
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                >
                  {showForgotPassword ? 'Back to sign in' : 'Forgot Password?'}
                </button>
                <span className="text-[11px] text-slate-400">Production Auth</span>
              </div>

              {showForgotPassword && (
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2.5 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Hospital Staff Password Recovery</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Enter your registered employee email to receive a secure Firebase password reset link.
                  </p>
                  {resetSuccess ? (
                    <div className="p-2.5 bg-emerald-100/80 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span>Password reset link sent! Please check your email inbox.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="staff.email@hospital.org"
                        className="w-full sm:flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        disabled={isResetting}
                        onClick={handleResetPassword}
                        className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {isResetting ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}

          {/* TAB 2: REGISTER NEW HOSPITAL */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterHospital} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Clinic Name *</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regHospitalName}
                    onChange={(e) => setRegHospitalName(e.target.value)}
                    placeholder="e.g. City Multi-Speciality Hospital"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="e.g. New Delhi"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 11 4050 9900"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Owner Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    placeholder="e.g. Dr. Rajeshwar Sharma, MD"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="owner@cityhospital.org"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isAuthLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Hospital Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Register Hospital & Initialize Tenant</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Isolation Note */}
        <div className="text-center text-[11px] text-slate-400">
          <span>Multi-Tenant Architecture with Independent Hospital Isolation • Powered by Firebase Firestore</span>
        </div>
      </div>
    </div>
  );
};
