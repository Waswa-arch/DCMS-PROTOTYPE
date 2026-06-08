import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, User, ShieldCheck, FileText, Building2, 
  Bell, CheckCircle2, Clock, AlertTriangle, Settings, 
  Users, Download, Check, X, RefreshCw, BarChart3,
  Upload, Trash2, Mail, Phone, MapPin, ChevronRight, Rocket, Lock, Award
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  
  // --- STATE LAYER BOUND TO LOCALSTORAGE ---
  const [activeTab, setActiveTab] = useState('tracker'); 
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedDisputeDept, setSelectedDisputeDept] = useState(null);
  const [disputeText, setDisputeText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  
  // Dynamic officer department desk simulator switch
  const [simulatedOfficerDept, setSimulatedOfficerDept] = useState(user?.department || 'University Library');

  // Unified shared data storage layer
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

  // --- COMPUTE LOGGED IN STUDENT DATA STRINGS ---
  const studentTasks = masterClearanceRecords.filter(r => r.studentEmail === user?.email);
  const isInitiated = studentTasks.length > 0;
  
  const approvedCount = studentTasks.filter(t => t.status === 'Approved').length;
  const progressPercentage = studentTasks.length > 0 && approvedCount > 0 
    ? Math.round((approvedCount / studentTasks.length) * 100) 
    : 0;

  // --- DYNAMICALLY GENERATE STUDENT PROFILE TRACKS ---
  const handleApproveClearanceInitiation = () => {
    if (!user) return;

    // Fixed: All nodes now correctly start as 'Pending' with neutral tracking descriptions
    const validationNodes = [
      { dept: 'University Library', official: 'Dr. C. Cheruiyot', notes: 'No unreturned library asset liabilities discovered. Pending sign-off validation.', initialStatus: 'Pending' },
      { dept: 'Finance & Accounts', official: 'Finance Registrar Office', notes: 'Reviewing current semester registration ledger balances.', initialStatus: 'Pending' },
      { dept: 'Hostel & Residence Dept', official: 'Housekeeping Coordinator', notes: 'Awaiting room key submission validation inventory.', initialStatus: 'Pending' },
      { dept: 'Academic Affairs', official: 'Registry Exam Section', notes: 'Dossier evaluation locked pending final semester marks integration.', initialStatus: 'Pending' },
      { dept: 'ICT Infrastructure', official: 'Automated Core Gate', notes: 'Structural pipeline network profile evaluation pending.', initialStatus: 'Pending' },
      { dept: 'Sports & Athletics', official: 'Sports Office Coordinator', notes: 'Awaiting athletic equipment return audit evaluation.', initialStatus: 'Pending' }
    ];

    const personalizedTracks = validationNodes.map((node, index) => ({
      id: `clearance-${user.email}-${index}-${Date.now()}`,
      studentEmail: user.email,
      studentName: user.name || 'Anonymous Student',
      regNumber: user.regNumber || 'INTE/NOT-SET/2026',
      department: node.dept,
      status: node.initialStatus,
      notes: node.notes,
      official: node.official,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }));

    setMasterClearanceRecords(prev => [...prev, ...personalizedTracks]);
    triggerToast("Clearance sequence deployed successfully to all departments!");
  };

  // --- DISPUTE HANDLERS ---
  const handleSubmitDispute = (e) => {
    e.preventDefault();
    if (!disputeText.trim()) return;
    
    setMasterClearanceRecords(prev => prev.map(t => 
      (t.studentEmail === user.email && t.department === selectedDisputeDept.department)
        ? { ...t, notes: `Dispute Logged: "${disputeText}"` } 
        : t
    ));

    triggerToast(`Dispute message routed to ${selectedDisputeDept.department}`);
    setDisputeText('');
    setSelectedDisputeDept(null);
  };

  // --- ISOLATED OFFICER INCHARGE FILTER ---
  const activeDepartmentScope = simulatedOfficerDept;
  const isolatedDepartmentalRequests = masterClearanceRecords.filter(r => r.department === activeDepartmentScope);

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

            {/* ==========================================
                VIEW A: STUDENT DATA MONITOR TRACKER 
               ========================================== */}
            {user.role !== 'OFFICER' && activeTab === 'tracker' && (
              <div className="space-y-6">
                {!isInitiated ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto overflow-hidden my-6">
                    <div className="p-8 bg-slate-900 text-white text-center space-y-3">
                      <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2"><Rocket className="h-8 w-8" /></div>
                      <h2 className="text-2xl font-black tracking-tight">Clearance Document Pipeline Gateway</h2>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">No digital tracking session currently maps to your student profile details.</p>
                    </div>
                    <div className="p-8 text-center bg-white">
                      <button onClick={handleApproveClearanceInitiation} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wide rounded-xl shadow-md uppercase cursor-pointer">
                        Initiate My Clearance File Records
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="space-y-1.5 text-center md:text-left">
                        <h2 className="text-2xl font-black text-slate-900">Your Active File Node Status</h2>
                        <p className="text-xs text-slate-500">Your tracking pipeline has been published to the administration index.</p>
                      </div>
                      <div className="w-full md:w-64 space-y-2 flex-shrink-0">
                        <div className="flex justify-between items-end text-xs font-extrabold text-slate-800">
                          <span>PROGRESS INDEX</span>
                          <span className="font-mono text-sm text-emerald-600">{progressPercentage}% Done</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full border overflow-hidden p-0.5">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {studentTasks.map((task) => (
                        <div key={task.id} onClick={() => task.status === 'Flagged' && setSelectedDisputeDept(task)} className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all ${task.status === 'Flagged' ? 'border-rose-300 shadow-sm hover:shadow-md cursor-pointer' : 'border-slate-200'}`}>
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-black text-sm text-slate-900">{task.department}</h4>
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded border uppercase ${task.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : task.status === 'Flagged' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{task.status}</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">{task.notes}</p>
                          </div>
                          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                            <span>Auth: <span className="font-mono text-slate-600">{task.official}</span></span>
                            {task.status === 'Flagged' && <span className="text-rose-600 font-extrabold">Click to Resolve →</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==========================================
                VIEW B: STUDENT PROFILE DATA TAB
               ========================================== */}
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

            {/* ==========================================
                VIEW C: SECURE ADMINISTRATIVE PANEL 
               ========================================== */}
            {user.role === 'OFFICER' && activeTab === 'tracker' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Administrative clearance console</h2>
                    <p className="text-xs text-slate-500 font-semibold pt-1">
                      Current Department Focus Node: <span className="text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-mono">{activeDepartmentScope}</span>
                    </p>
                  </div>

                  <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Simulate Desk View:</span>
                    <select className="bg-slate-800 border border-slate-700 rounded text-xs font-bold p-1 text-teal-400 outline-none" value={simulatedOfficerDept} onChange={(e) => setSimulatedOfficerDept(e.target.value)}>
                      <option value="University Library">University Library</option>
                      <option value="Finance & Accounts">Finance & Accounts</option>
                      <option value="Hostel & Residence Dept">Hostel & Residence Dept</option>
                      <option value="Academic Affairs">Academic Affairs</option>
                      <option value="ICT Infrastructure">ICT Infrastructure</option>
                      <option value="Sports & Athletics">Sports & Athletics</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b font-bold text-xs text-slate-500 uppercase tracking-wider">
                    Dossier Processing Queue
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                          <th className="p-4">Student Submitter Name</th>
                          <th className="p-4">Registration Ident</th>
                          <th className="p-4">Dossier Notes / Live Arguments</th>
                          <th className="p-4">Pipeline Tag</th>
                          <th className="p-4 text-right">Verification Commands</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {isolatedDepartmentalRequests.map((task) => (
                          <tr key={task.id} className="bg-teal-50/5">
                            <td className="p-4 font-bold text-slate-900">{task.studentName}</td>
                            <td className="p-4 font-mono text-slate-500">{task.regNumber}</td>
                            <td className="p-4 text-slate-600 font-medium">{task.notes}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded border uppercase ${task.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : task.status === 'Flagged' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{task.status}</span>
                            </td>
                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                              <button onClick={() => {
                                setMasterClearanceRecords(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Approved', notes: 'Verification complete. Ledger balance cleared.' } : t));
                                triggerToast("Student file approved successfully.");
                              }} className="px-2.5 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded cursor-pointer">Approve Signoff</button>
                              <button onClick={() => {
                                setMasterClearanceRecords(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Flagged', notes: 'Asset liability violation hold recorded.' } : t));
                                triggerToast("Student hold registered.");
                              }} className="px-2.5 py-1 text-[10px] font-bold bg-rose-600 text-white rounded cursor-pointer">Place Flag Hold</button>
                            </td>
                          </tr>
                        ))}
                        {isolatedDepartmentalRequests.length === 0 && (
                          <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-medium italic">No active requests currently submitted to this departmental workspace registry pipeline.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                VIEW D: SECURE OFFICER PROFILE PAGE
               ========================================== */}
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
                    <div><span className="font-bold text-slate-400 block mb-0.5">Assigned Target Division</span> <span className="font-bold text-slate-800">{activeDepartmentScope}</span></div>
                    <div><span className="font-bold text-slate-400 block mb-0.5">Authorization Email Endpoint</span> <span className="font-mono font-bold text-slate-700">{user.email}</span></div>
                    <div><span className="font-bold text-slate-400 block mb-0.5">Security Context Hierarchy</span> <span className="font-mono font-bold text-teal-600 uppercase">{user.role} CODE LEVEL</span></div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ==========================================
          🎯 SYSTEM INTERACTIVE SUBMISSION DIALOG 
         ========================================== */}
      {selectedDisputeDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-rose-900 text-white flex justify-between items-center">
              <h3 className="font-black text-sm tracking-wide uppercase">File Resolution Matrix</h3>
              <button onClick={() => setSelectedDisputeDept(null)} className="p-1 text-rose-200 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmitDispute} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border text-xs">
                <span className="font-black uppercase text-slate-400 block mb-1">Active Fine Infraction Argument:</span>
                <p className="text-slate-700 font-medium">{selectedDisputeDept.notes}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Provide Verification/Dispute Justification</label>
                <textarea required rows={3} value={disputeText} onChange={(e) => setDisputeText(e.target.value)} placeholder="Type specific details, invoice references, or returned dates here..." className="w-full border rounded-xl p-3 text-xs outline-none focus:border-rose-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSelectedDisputeDept(null)} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600">Dismiss</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 text-white uppercase">Dispatch Case Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardLayout;