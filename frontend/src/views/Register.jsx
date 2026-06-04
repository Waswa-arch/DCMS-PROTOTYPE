import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Mail, Lock, BookOpen, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

const Register = ({ onNavigate }) => {
  const { register } = useAuth();
  
  // --- APPLICATION STATE HOOKS ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [regNumber, setRegNumber] = useState('');
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // --- SUBMISSION ENTRY DISPATCHER ---
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (role === 'STUDENT' && !regNumber.trim()) {
      setError("Student accounts require a valid University Registration Number.");
      return;
    }

    try {
      // Writes new user data directly into our Context Ledger
      register(name.trim(), email.trim(), password, role, regNumber.trim());
      setSuccess(true);
      
      // Smoothly push back into the login screen after a brief success notice pause
      setTimeout(() => {
        if (onNavigate) onNavigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || "An account authorization pipeline conflict happened.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      
      {/* BRAND HEADER SECTION */}
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

      {/* CORE INTERACTION PROFILE CONTAINER CARD */}
      <div className="mt-8 sm:mx-auto w-full max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-200/50 space-y-5">
          
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-900">Create Account Profile</h3>
            <p className="text-xs font-medium text-slate-400">Register credentials for sandbox system tracking</p>
          </div>

          {/* DYNAMIC FEEDBACK ALERTS */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-rose-800 leading-tight">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-emerald-800 leading-tight">Account successfully registered! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* FULL NAME FORM LINE */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" /> Full User Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs focus:border-emerald-500 outline-none text-slate-800 bg-slate-50/50"
              />
            </div>

            {/* SECURE EMAIL CHANNEL */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> Security Email Address
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

            {/* PASSWORD ENTRY FIELD */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400" /> Create Access Password
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

            {/* ROLE PROFILE dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                System Profile Authorization Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs focus:border-emerald-500 outline-none text-slate-700 bg-slate-50/50 font-bold"
              >
                <option value="STUDENT">STUDENT SUBMITTER</option>
                <option value="OFFICER">DEPARTMENT SIGNATORY OFFICER</option>
              </select>
            </div>

            {/* CONDITIONAL COMPONENT: RENDERS REGISTRATION BOX ONLY FOR STUDENT USERS */}
            {role === 'STUDENT' && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" /> Institutional Registration Code
                </label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="e.g. COMP/M/1234/05/24"
                  className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-mono focus:border-emerald-500 outline-none text-slate-800 bg-slate-50/50"
                />
              </div>
                )}

            {/* REGISTRATION EXECUTION ACTION BUTTON */}
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wide shadow transition-all cursor-pointer mt-2"
            >
              Commit System Account Profile
            </button>
          </form>

          {/* BACKLINK ANCHOR LINE */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Already have an account? Sign In
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;