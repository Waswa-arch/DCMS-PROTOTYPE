import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, User, ShieldCheck, FileText, Building2, Check 
} from 'lucide-react';

// The layout frame accepts 'children' (the pages), along with active tab tracking props from the pages
const DashboardLayout = ({ children, activeTab, setActiveTab, toast, setToast }) => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200 text-center max-w-sm">
          <p className="text-sm font-bold text-slate-700 mb-4">No active verification token session discovered.</p>
          <a href="/login" className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg uppercase">Return to Login Gateway</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans relative antialiased">
      
      {/* 🔔 FLOATING ALERT TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700">
          <div className="p-1 rounded-full bg-emerald-500 text-slate-900">
            <Check className="h-4 w-4 stroke-[3]" />
          </div>
          <p className="text-xs font-bold tracking-wide">{toast}</p>
        </div>
      )}

      {/* 🛠️ NAVIGATION SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shadow-xl hidden md:flex flex-shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
            <div>
              <h1 className="font-extrabold text-base tracking-wide text-white uppercase">Kabarak Univ</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Digital Clearance</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase px-3 mb-3 tracking-wider">Core Operations</div>
            
            {user.role !== 'OFFICER' ? (
              <>
                <button 
                  onClick={() => setActiveTab('tracker')} 
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${activeTab === 'tracker' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <FileText className="h-4 w-4" /> Student Tracker
                </button>
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <User className="h-4 w-4" /> Profile Settings
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setActiveTab('tracker')} 
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${activeTab === 'tracker' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Building2 className="h-4 w-4" /> Administrative Console
                </button>
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${activeTab === 'profile' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <User className="h-4 w-4" /> Officer Profile Page
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 font-black">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold truncate text-white">{user.name}</h4>
              <p className="text-[10px] font-mono text-slate-400 truncate">{user.role}</p>
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

      {/* 💻 MAIN ACTION DISPLAY CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase tracking-widest">
              {user.role} INTERFACE
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <User className="h-4 w-4 text-slate-400" />
            <span className="font-mono text-slate-600">{user.email}</span>
          </div>
        </header>

        {/* This injection slot renders whatever content the specific dashboard page drops inside */}
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