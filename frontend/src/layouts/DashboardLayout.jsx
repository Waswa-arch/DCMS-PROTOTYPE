import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import {
  LogOut, User, ShieldCheck, FileText, Building2, LayoutDashboard, Bell, CheckCheck
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const bellRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await api.get('/notifications/me');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      // Silent failure here is intentional — a broken bell shouldn't block
      // the rest of the dashboard from rendering. Errors would already
      // have surfaced from the primary page's own data fetch.
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  // Close the dropdown on an outside click, standard pattern so it doesn't
  // stay open forever once the user clicks elsewhere on the page.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleBell = () => {
    const opening = !bellOpen;
    setBellOpen(opening);
    if (opening) fetchNotifications();
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // Same reasoning as fetch: a failed read-mark shouldn't crash the UI.
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts.replace(' ', 'T')).toLocaleString();
    } catch {
      return ts;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200 text-center max-w-sm">
          <p className="text-sm font-bold text-slate-700 mb-4">No active session found.</p>
          <a href="/login" className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg uppercase">
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  const isActive = (path) => location.pathname === path;

  const getNavItems = () => {
    if (user.role === 'STUDENT') {
      return (
        <React.Fragment>
          <button
            onClick={() => navigate('/dashboard/clearance')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              isActive('/dashboard/clearance')
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" /> Student Tracker
          </button>
          <button
            onClick={() => navigate('/dashboard/profile')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              isActive('/dashboard/profile')
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" /> Profile Settings
          </button>
        </React.Fragment>
      );
    }

    if (user.role === 'OFFICER') {
      return (
        <React.Fragment>
          <button
            onClick={() => navigate('/dashboard/queue')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              isActive('/dashboard/queue')
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4" /> Administrative Console
          </button>
          <button
            onClick={() => navigate('/dashboard/profile')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              isActive('/dashboard/profile')
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" /> Officer Profile Page
          </button>
        </React.Fragment>
      );
    }

    if (user.role === 'ADMIN') {
      return (
        <React.Fragment>
          <button
            onClick={() => navigate('/dashboard/admin')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              isActive('/dashboard/admin')
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" /> Admin Console
          </button>
          <button
            onClick={() => navigate('/dashboard/profile')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              isActive('/dashboard/profile')
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" /> Profile Settings
          </button>
        </React.Fragment>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">

      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shadow-xl hidden md:flex flex-shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
            <div>
              <h1 className="font-extrabold text-base tracking-wide text-white uppercase">DCMS</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Digital Clearance</p>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase px-3 mb-3 tracking-wider">
              Core Operations
            </div>
            {getNavItems()}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 font-black">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold truncate text-white">{user.name}</h4>
              <p className="text-[10px] font-mono text-slate-400 truncate">
                {user.id_number}{user.department_name ? ` · ${user.department_name}` : ` · ${user.role}`}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> Close Session
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase tracking-widest">
              {user.role} INTERFACE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={bellRef}>
              <button
                onClick={handleToggleBell}
                className="relative p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-40 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold text-rose-500">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-6 text-center text-xs text-slate-400">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => !n.is_read && handleMarkRead(n.id)}
                            className={`w-full text-left p-3 flex items-start gap-2 transition-colors hover:bg-slate-50 ${
                              n.is_read ? '' : 'bg-emerald-50/40'
                            }`}
                          >
                            {!n.is_read && (
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            )}
                            <div className={`min-w-0 ${n.is_read ? 'pl-3.5' : ''}`}>
                              <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                {formatTimestamp(n.created_at)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <CheckCheck className="h-3 w-3" />
                      Click a notification to mark it read
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <User className="h-4 w-4 text-slate-400" />
              <span className="font-mono text-slate-600">{user.email}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;