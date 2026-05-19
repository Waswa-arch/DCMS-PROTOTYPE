import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

/**
 * INSTITUTIONAL SECURE GATEWAY WORKSPACE:
 * Collects verified credentials, runs cryptographic web verification, 
 * handles state updates, and triggers contextual role-based routing.
 */
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const loginAttempt = await login(email, password);

    if (loginAttempt.success) {
      // Dynamic routing handshake based on the verified institutional role
      if (loginAttempt.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else if (loginAttempt.role === 'OFFICER') {
        navigate('/officer/dashboard');
      } else if (loginAttempt.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        setErrorMessage('Platform Error: Assigned profile role mapping is invalid.');
        setIsSubmitting(false);
      }
    } else {
      setErrorMessage(loginAttempt.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-kabarak-slate-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* BRAND BRANDING CONTAINER */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-16 w-16 bg-white rounded-2xl shadow-md border border-kabarak-slate-border flex items-center justify-center text-kabarak-purple">
          <ShieldCheck className="h-10 w-10 text-kabarak-teal" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-kabarak-slate-text tracking-tight">
          Kabarak University
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          Digital Clearance Management System (DCMS)
        </p>
      </div>

      {/* CORE INPUT PANEL CARD */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl border border-kabarak-slate-border sm:px-10">
          
          {/* SYSTEM ERROR NOTIFICATION BOX */}
          {errorMessage && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-sm text-red-700 animate-shake">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Authentication Refused:</span> {errorMessage}
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleFormSubmit}>
            {/* EMAIL PARAMETER FIELD */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 tracking-wide">
                Institutional Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-kabarak-purple focus:border-kabarak-purple disabled:opacity-60 transition-all"
                  placeholder="username@kabarak.ac.ke"
                />
              </div>
            </div>

            {/* PASSWORD PARAMETER FIELD */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 tracking-wide">
                Access Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-kabarak-purple focus:border-kabarak-purple disabled:opacity-60 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* INTERACTIVE FORM DESPATCH RUNNER BUTTON */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-kabarak-purple hover:bg-kabarak-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kabarak-purple disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying Identity Vault...
                  </>
                ) : (
                  'Authorize Secure Login'
                )}
              </button>
            </div>
          </form>

          {/* INTER-VIEW ALTERATION FOOTNOTE LINKS */}
          <div className="mt-6 border-t border-kabarak-slate-border pt-6 text-center">
            <p className="text-sm text-gray-600">
              New graduating student applicant?{' '}
              <Link 
                to="/register" 
                className="font-semibold text-kabarak-teal hover:text-kabarak-teal-dark transition-colors"
              >
                Create Account Profile
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;