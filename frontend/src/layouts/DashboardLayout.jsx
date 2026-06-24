import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, User, ShieldCheck, FileText, Building2, Check, Award
} from 'lucide-react';

// Import our clean modular sub-components from your new dashboard directory
import StudentTracker from '../components/dashboard/StudentTracker';
import AdminConsole from '../components/dashboard/AdminConsole';
import DisputeModal from '../components/dashboard/DisputeModal';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  
  // --- STATE LAYER COORDINATOR ---
  const [activeTab, setActiveTab] = useState('tracker'); 
  const [toast, setToast] = useState(null);
  const [selectedDisputeDept, setSelectedDisputeDept] = useState(null);
  
  // Dynamic officer department desk simulator switch
  const [simulatedOfficerDept, setSimulatedOfficerDept] = useState(user?.department || 'University Library');

  // Unified shared data storage layer (Global Ledger)
  const [masterClearanceRecords, setMasterClearanceRecords] = useState(() => {
    const saved = localStorage.getItem('global_clearance_ledger');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('global_clearance_ledger', JSON.stringify(masterClearanceRecords));
  }, [masterClearanceRecords]);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

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
          <div className="p-1 rounded-full bg-emerald-500 text-slate-900"><Check className="h-4 w-4 stroke-[3]" /></div>
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
                <button onClick={() => setActiveTab('tracker')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${activeTab === 'tracker' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <FileText className="h-4 w-4" /> Student Tracker
                </button>
                <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <User className="h-4 w-4" /> Profile Settings
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveTab('tracker')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${activeTab === 'tracker' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <Building2 className="h-4 w-4" /> Administrative Console
                </button>
                <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${activeTab === 'profile' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <User className="h-4 w-4" /> Officer Profile Page
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 font-black">{user.name ? user.name.charAt(0) : 'U'}</div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold truncate text-white">{user.name}</h4>
              <p className="text-[10px] font-mono text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer">
            <LogOut className="h-3.5 w-3.5" /> Close Session
          </button>
        </div>
      </aside>

      {/* 💻 MAIN ACTION CONTENT DISPLAY CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase tracking-widest">{user.role} INTERFACE</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <User className="h-4 w-4 text-slate-400" />
            <span className="font-mono text-slate-600">{user.email}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* VIEW A: MODULAR STUDENT TRACKER */}
            {user.role !== 'OFFICER' && activeTab === 'tracker' && (
              <StudentTracker 
                user={user}
                masterClearanceRecords={masterClearanceRecords}
                setMasterClearanceRecords={setMasterClearanceRecords}
                triggerToast={triggerToast}
                setSelectedDisputeDept={setSelectedDisputeDept}
              />
            )}

            {/* VIEW B: STUDENT PROFILE DATA TAB */}
            {user.role !== 'OFFICER' && activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Academic Schema Mapping</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                  <div><span className="font-bold text-slate-400 block mb-0.5">Full Registered Student Name</span> <span className="font-bold text-slate-800">{user.name}</span></div>
                  <div><span className="font-bold text-slate-400 block mb-0.5">Registration Code Key</span> <span className="font-mono font-bold text-slate-800">{user.regNumber || 'N/A'}</span></div>
                  <div><span className="font-bold text-slate-400 block mb-0.5">Primary Session Email Identifier</span> <span className="font-mono font-bold text-slate-800">{user.email}</span></div>
                </div>
              </div>
            )}

            {/* VIEW C: MODULAR SECURE ADMINISTRATIVE PANEL */}
            {user.role === 'OFFICER' && activeTab === 'tracker' && (
              <AdminConsole 
                masterClearanceRecords={masterClearanceRecords}
                setMasterClearanceRecords={setMasterClearanceRecords}
                simulatedOfficerDept={simulatedOfficerDept}
                setSimulatedOfficerDept={setSimulatedOfficerDept}
                triggerToast={triggerToast}
              />
            )}

            {/* VIEW D: SECURE OFFICER PROFILE PAGE */}
            {user.role === 'OFFICER' && activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-black">Officer Authorization Vector Profile</h2>
                    <p className="text-xs text-slate-400">Institutional workplace metadata and signing permissions mapping.</p>
                  </div>
                  <Award className="h-8 w-8 text-teal-400" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                    <div><span className="font-bold text-slate-400 block mb-0.5">Signatory Account Username</span> <span className="font-bold text-slate-800">{user.name}</span></div>
                    <div><span className="font-bold text-slate-400 block mb-0.5">Assigned Target Division</span> <span className="font-bold text-slate-800">{simulatedOfficerDept}</span></div>
                    <div><span className="font-bold text-slate-400 block mb-0.5">Authorization Email Endpoint</span> <span className="font-mono font-bold text-slate-700">{user.email}</span></div>
                    <div><span className="font-bold text-slate-400 block mb-0.5">Security Context Hierarchy</span> <span className="font-mono font-bold text-teal-600 uppercase">{user.role} CODE LEVEL</span></div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* 🎯 MODULAR SYSTEM INTERACTIVE SUBMISSION DIALOG */}
      {selectedDisputeDept && (
        <DisputeModal 
          user={user}
          selectedDisputeDept={selectedDisputeDept}
          setSelectedDisputeDept={setSelectedDisputeDept}
          setMasterClearanceRecords={setMasterClearanceRecords}
          triggerToast={triggerToast}
        />
      )}

    </div>
  );
};

export default DashboardLayout;