import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, AlertTriangle, ArrowRight, UserPlus } from 'lucide-react';

const Login = ({ onNavigate }) => {
  const { login } = useAuth();
  
  // --- FORM STATE INPUT FIELDS ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- SUBMISSION REACTION PROCESSOR ---
  const handleFormSubmit = async (e) => {
    e.preventDefault(); // Blocks browser redirection freezes
    setError(null);
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Please fill out all credential authentication fields.");
      setIsLoading(false);
      return;
    }

    try {
      // 🔐 Fires credential lookups against the local database context
      await login(email.trim(), password);
      
      // FIX 1: Uses dynamic state pipeline navigation rather than forcing browser location reloads
      if (onNavigate) {
        onNavigate('/dashboard');
      }
    } catch (err) {
      console.error("Login verification hook exception caught: ", err);
      setError(err.message || "Invalid system email mapping or incorrect password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      
      <div className="sm:mx-auto w-full max-w-md">
        <div className="flex justify-center items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wide leading-none">Kabarak Univ</h2>
            <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mt-1">Digital Clearance</p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-200/50 space-y-6">
          
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-900">Sign In to Session</h3>
            <p className="text-xs font-medium text-slate-400">Access your clearance tracking records ledger</p>
          </div>

          {/* ERROR RENDER MESSAGE PANEL */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-rose-800 leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* EMAIL SOURCE CHANNEL */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> Account Security Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@kabarak.ac.ke"
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-mono focus:border-emerald-500 outline-none text-slate-800 bg-slate-50/50"
              />
            </div>

            {/* PASSWORD SECURITY CHANNEL */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400" /> Access Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-mono focus:border-emerald-500 outline-none text-slate-800 bg-slate-50/50"
              />
            </div>

            {/* CORE EXECUTIVE SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-black uppercase tracking-wide shadow transitions-all cursor-pointer"
            >
              {isLoading ? 'Verifying Tokens...' : 'Authenticate Sign In'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* FIX 2: INTERACTIVE REGISTER LINK DESK */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Don't have an account? Register Profile
            </button>
          </div>

          {/* SANDBOX BACKDOOR HINT DETAILS */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 text-[11px] space-y-1">
            <span className="font-black text-slate-500 uppercase tracking-wider block">Sandbox System Accounts:</span>
            <p className="text-slate-600 font-medium">
              💡 Out-of-the-box Officer Profile Sign-In Details: <br />
              Email: <span className="font-mono font-bold text-teal-700">officer@kabarak.ac.ke</span> <br />
              Password: <span className="font-mono font-bold text-teal-700">officer123</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;