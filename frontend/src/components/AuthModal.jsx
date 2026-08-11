import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  User, 
  Briefcase, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles 
} from 'lucide-react';

export default function AuthModal({ open, onClose }) {
  const { login, register, loginWithGoogle, authError, setAuthError } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Executive'
  });

  const googleBtnRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '436553075988-f4p9pbpikuf8kkp891qtn2591lh55esc.apps.googleusercontent.com';

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
              if (response.credential) {
                setLoading(true);
                try {
                  await loginWithGoogle(response.credential, null);
                  onClose();
                } catch (err) {
                  // Handled in AuthContext
                } finally {
                  setLoading(false);
                }
              }
            }
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              width: 380,
              text: tab === 'login' ? 'signin_with' : 'signup_with',
              shape: 'pill'
            });
          }
        } catch (e) {
          console.warn('Google GIS Init Warning:', e);
        }
      }
    };

    initGoogle();
    const timer = setTimeout(initGoogle, 500);
    return () => clearTimeout(timer);
  }, [open, tab]);

  if (!open) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '436553075988-f4p9pbpikuf8kkp891qtn2591lh55esc.apps.googleusercontent.com';
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              await loginWithGoogle(response.credential, null);
              onClose();
            }
          }
        });
        window.google.accounts.id.prompt(async (notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const mockGoogleUser = {
              email: 'ashwini.google@codigix.com',
              name: 'Ashwini Khedekar (Google)',
              picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
            };
            await loginWithGoogle(null, mockGoogleUser);
            onClose();
          }
        });
      } else {
        const mockGoogleUser = {
          email: 'ashwini.google@codigix.com',
          name: 'Ashwini Khedekar (Google)',
          picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
        };
        await loginWithGoogle(null, mockGoogleUser);
        onClose();
      }
    } catch (err) {
      // Handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.password, form.fullName, form.role);
      }
      onClose();
    } catch (err) {
      // Handled by AuthContext authError
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = (demoEmail, demoRole, demoName) => {
    setForm({
      fullName: demoName,
      email: demoEmail,
      password: 'password123',
      role: demoRole
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Banner */}
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-black tracking-widest uppercase opacity-90">CODIGIX Executive OS</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {tab === 'login' ? 'Welcome Back' : 'Create Executive Account'}
          </h2>
          <p className="text-xs text-white/80 mt-1 font-medium">
            {tab === 'login' ? 'Sign in to access your dashboard, plans, and workspace.' : 'Join your team and track daily executive operations.'}
          </p>

          {/* Mode Tabs */}
          <div className="flex bg-black/20 p-1 rounded-2xl mt-5 text-xs font-bold">
            <button
              onClick={() => { setTab('login'); setAuthError(''); }}
              className={`flex-1 py-2 rounded-xl transition-all ${tab === 'login' ? 'bg-white text-slate-900 shadow-md font-extrabold' : 'text-white/80 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setAuthError(''); }}
              className={`flex-1 py-2 rounded-xl transition-all ${tab === 'register' ? 'bg-white text-slate-900 shadow-md font-extrabold' : 'text-white/80 hover:text-white'}`}
            >
              Register Account
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Error Alert */}
          {authError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Google Sign In / Sign Up Button & Official GIS Widget */}
          <div className="space-y-2">
            <div ref={googleBtnRef} className="flex justify-center w-full min-h-[40px] border-none overflow-hidden rounded-xl"></div>
            
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.13C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.63H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.37l3.99-3.13z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.99 3.13c.95-2.85 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>{tab === 'login' ? 'Continue with Google Account' : 'Sign up with Google Account'}</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-2 text-[10px] uppercase font-bold text-slate-400 shrink-0">or continue with email</span>
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          </div>

          {/* Registration Full Name */}
          {tab === 'register' && (
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={e => setField('fullName', e.target.value)}
                  placeholder="e.g. Ashwini Kumar"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="exec@codigix.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={e => setField('password', e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Executive Role Selection (Register Mode) */}
          {tab === 'register' && (
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Role / Designation</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={form.role}
                  onChange={e => setField('role', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="Executive">Executive</option>
                  <option value="CEO / Founder">CEO / Founder</option>
                  <option value="Sales Director">Sales Director</option>
                  <option value="Project Lead">Project Lead</option>
                  <option value="Operations Manager">Operations Manager</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{tab === 'login' ? 'Sign In to OS' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Credentials */}
          {tab === 'login' && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">⚡ Quick Fill Demo Users</span>
              <div className="flex justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fillDemoCreds('ashwini@codigix.com', 'CEO / Founder', 'Ashwini K.')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                >
                  Ashwini (CEO)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCreds('priya@codigix.com', 'Sales Director', 'Priya M.')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                >
                  Priya (Sales)
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
