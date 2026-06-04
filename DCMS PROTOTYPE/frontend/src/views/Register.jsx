import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ShieldCheck, User, Lock, Mail, CreditCard, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * INSTITUTIONAL USER SELF-REGISTRATION MANAGEMENT INTERFACE:
 * Captures user identity parameters, enforces client-side structural invariants,
 * dispatches creation payloads to the server, and handles routing setup.
 */
const Register = () => {
  const { apiUrl } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Baseline password parity match verification
    if (password !== confirmPassword) {
      return setErrorMessage('Client Validation Error: Entered passwords do not match.');
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${apiUrl}/auth/register`, {
        name,
        email,
        idNumber,
        password,
        role: 'STUDENT' // Force consumer layout declaration to standard student identity scope
      });

      if (response.data.success) {
        setSuccessMessage('Profile compilation successful! Redirecting to secure login station...');
        setIsSubmitting(false);
        
        // Hold screen for 2 seconds to let the user review success context before bouncing
        setTimeout(() => {
          navigate('/login');
        }, 2200);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Server transactional refusal. Unable to compile profile logs.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-kabarak-slate-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* INSTITUTIONAL BRAND LOGO WRAPPER */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-16 w-16 bg-white rounded-2xl shadow-md border border-kabarak-slate-border flex items-center justify-center text-kabarak-purple">
          <ShieldCheck className="h-10 w-10 text-kabarak-teal" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-kabarak-slate-text tracking-tight">
          Applicant Provision Station
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          Create an official clearance profile link below
        </p>
      </div>

      {/* REGISTRATION CORE CONTROLLER CARD */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl border border-kabarak-slate-border sm:px-10">
          
          {/* STATE HANDLING ALERT DIALOGUE INJECTIONS */}
          {errorMessage && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-sm text-red-700 animate-shake">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Registration Halted:</span> {errorMessage}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-lg bg-teal-50 border border-teal-200 p-4 flex items-start gap-3 text-sm text-teal-800">
              <CheckCircle2 className="h-5 w-5 text-kabarak-teal-light shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Account Created:</span> {successMessage}
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleFormSubmit}>
            
            {/* FULL OFFICIAL NAME FIELD */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 tracking-wide">Official Full Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-kabarak-purple focus:border-kabarak-purple disabled:opacity-60 transition-all"
                  placeholder="e.g., John Doe"
                />
              </div>
            </div>

            {/* REGISTER NUMBER / STAFF ID FIELD */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 tracking-wide">Student Admission Number</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-kabarak-purple focus:border-kabarak-purple disabled:opacity-60 transition-all"
                  placeholder="e.g., CS/M/1234/09/22"
                />
              </div>
            </div>

            {/* EMAIL ADRESS FIELD */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 tracking-wide">University Email Address</label>
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

            {/* PASSWORD SECURITY BOXES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 tracking-wide">Password</label>
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 tracking-wide">Confirm Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-kabarak-purple focus:border-kabarak-purple disabled:opacity-60 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* TRANSACTION ACTION TERMINAL TRACKER RUNNER BOX */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-kabarak-teal hover:bg-kabarak-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kabarak-teal disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Compiling Profile Cryptography...
                  </>
                ) : (
                  'Submit Registration Log'
                )}
              </button>
            </div>
          </form>

          {/* VIEW SWITCH BAR CHANNELS */}
          <div className="mt-6 border-t border-kabarak-slate-border pt-6 text-center">
            <p className="text-sm text-gray-600">
              Already possess an tracking profile?{' '}
              <Link 
                to="/login" 
                className="font-semibold text-kabarak-purple hover:text-kabarak-purple-light transition-colors"
              >
                Sign In Securely
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Register;