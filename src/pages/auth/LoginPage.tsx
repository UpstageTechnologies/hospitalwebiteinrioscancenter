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
  const { loginWithEmail, registerHospitalOwner, signInQuickStaff, isAuthLoading } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      let msg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Use quick staff sign-in or check credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please wait a moment before trying again.';
      }
      setErrorMessage(msg);
      toastError('Authentication Failed', msg);
    } finally {
      setIsSubmitting(false);
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

  const handleQuickLogin = async (roleKey: string) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signInQuickStaff(roleKey);
      success('Staff Signed In', `Authenticated as ${roleKey.replace('_', ' ').toUpperCase()} via Firebase.`);
    } catch (err: any) {
      console.error('Quick Sign In Error:', err);
      setErrorMessage(`Authentication error for ${roleKey}: ${err.message || 'Firebase Auth error'}`);
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

              {/* Quick Real Firebase Auth Sign In Shortcuts */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <span>Quick Staff Sign In (Firebase Auth)</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'owner', label: 'Owner', color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' },
                    { key: 'admin', label: 'Admin', color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
                    { key: 'hr_manager', label: 'HR Manager', color: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100' },
                    { key: 'doctor', label: 'Doctor', color: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100' },
                    { key: 'receptionist', label: 'Receptionist', color: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' },
                    { key: 'billing_staff', label: 'Billing Staff', color: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100' }
                  ].map(btn => (
                    <button
                      key={btn.key}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleQuickLogin(btn.key)}
                      className={`p-2 rounded-xl border text-[11px] font-bold transition-all truncate text-center ${btn.color} disabled:opacity-50`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
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
