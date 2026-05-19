import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  User, 
  ShieldCheck, 
  FileText, 
  Building2, 
  Bell, 
  Clock 
} from 'lucide-react';

/**
 * INSTITUTIONAL WORKSPACE PLATFORM WRAPPER:
 * Houses global application navigation, responsive layout breakpoints, 
 * user account contextual details, and standard page shell headers.
 */
const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  // Helper logic to return appropriate role badges
  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OFFICER': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen flex bg-kabarak-slate-bg">
      
      {/* SIDEBAR NAVIGATION UNIT */}
      <aside className="w-64 bg-kabarak-purple-dark text-white flex flex-col justify-between shadow-xl hidden md:flex">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-kabarak-purple/20 bg-kabarak-purple flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-kabarak-teal-light" />
            <div>
              <h1 className="font-bold text-lg tracking-wide leading-tight">Kabarak Univ</h1>
              <p className="text-xs text-kabarak-purple-light font-medium">Digital Clearance System</p>
            </div>
          </div>

          {/* Contextualized Sidebar Menus */}
          <nav className="p-4 space-y-1">
            <div className="text-xs font-semibold text-kabarak-purple-light uppercase px-3 mb-2 tracking-wider">
              Workspace Core
            </div>

            {user?.role === 'STUDENT' && (
              <>
                <button 
                  onClick={() => navigate('/student/dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/student/dashboard' ? 'bg-kabarak-teal text-white' : 'text-gray-200 hover:bg-kabarak-purple hover:text-white'}`}
                >
                  <FileText className="h-4 w-4" /> Clearance Tracker
                </button>
              </>
            )}

            {user?.role === 'OFFICER' && (
              <>
                <button 
                  onClick={() => navigate('/officer/dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/officer/dashboard' ? 'bg-kabarak-teal text-white' : 'text-gray-200 hover:bg-kabarak-purple hover:text-white'}`}
                >
                  <Building2 className="h-4 w-4" /> Department Queue
                </button>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <>
                <button 
                  onClick={() => navigate('/admin/dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/admin/dashboard' ? 'bg-kabarak-teal text-white' : 'text-gray-200 hover:bg-kabarak-purple hover:text-white'}`}
                >
                  <ShieldCheck className="h-4 w-4" /> System Control Panel
                </button>
              </>
            )}
          </nav>
        </div>

        {/* User Footprint Profile Box */}
        <div className="p-4 border-t border-kabarak-purple/20 bg-kabarak-purple/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-kabarak-teal flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold truncate text-white">{user?.name}</h4>
              <p className="text-xs text-gray-300 truncate">{user?.idNumber}</p>
            </div>
          </div>
          <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign Out Session
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE VIEW PANEL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* GLOBAL APPLICATION HEADER BAR */}
        <header className="h-16 bg-white border-b border-kabarak-slate-border flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user?.role)}`}>
              {user?.role} PANEL
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-kabarak-teal-light"></span>
            </button>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4 text-kabarak-purple" />
              <span className="hidden sm:inline">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* RUNTIME PAGE INJECTION TARGET AREA */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;