import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import DashboardLayout from '../../layouts/DashboardLayout';

const ProfilePage = () => {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setFeedback({ type: 'success', message: data.message || 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update password. Please try again.';
      setFeedback({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Profile Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            View your account information and update your password.
          </p>
        </div>

        {/* READ-ONLY INFO — pulled directly from AuthContext, no new endpoint needed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Your Information
            </h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</div>
              <div className="text-sm text-slate-800 mt-0.5">{user?.name || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</div>
              <div className="text-sm text-slate-800 mt-0.5">{user?.email || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</div>
              <div className="text-sm text-slate-800 mt-0.5">{user?.role || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID Number</div>
              <div className="text-sm text-slate-800 mt-0.5 font-mono">{user?.id_number || '—'}</div>
            </div>
          </div>
        </div>

        {/* CHANGE PASSWORD */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Change Password
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {feedback && (
              <div
                className={`text-xs px-3 py-2 rounded-lg border ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={submitting}
                className="mt-1 w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-slate-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                disabled={submitting}
                className="mt-1 w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-slate-400 transition-colors"
              />
              <p className="text-[10px] text-slate-400 mt-1">Minimum 8 characters.</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={submitting}
                className="mt-1 w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-slate-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;