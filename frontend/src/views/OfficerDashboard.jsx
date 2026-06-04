import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, FileText, CheckCircle2, AlertTriangle, 
  Search, Download, Check, X, Layers, LogOut, ArrowRight
} from 'lucide-react';

// --- MOCK DATABASE SCHEMATICS (2026 Academic Cohort) ---
const initialStudents = [
  {
    id: 1,
    name: "Emmanuel Waswa",
    regNo: "INTE/MK/1274/09/23",
    cohort: "400 Level Finalist",
    pathway: "B.Sc. Information Technology",
    residence: "Off-Campus Non-Res",
    submissionDate: "May 27, 2026",
    status: "FLAGGED",
    remarks: "Asset Liability: Unreturned physical textbook asset item. Fine balance: KES 1,200.",
    disputeFiled: true,
    disputeStatement: "The textbook was physically returned to the main reserve circulation desk counter on Friday morning, May 26. Attached below is the scan copy image of the return tracking receipt slip signed by the desk attendant on duty.",
    evidenceFile: "return_slip_receipt_2026.pdf",
    hasExternalHold: true // Flagged in internal database system
  },
  {
    id: 2,
    name: "Mary Atieno",
    regNo: "COMP/M/0941/01/22",
    cohort: "400 Level Finalist",
    pathway: "B.Sc. Computer Science",
    residence: "Hostel Check-out Clean",
    submissionDate: "June 1, 2026",
    status: "PENDING",
    remarks: "",
    disputeFiled: false,
    hasExternalHold: false // Clean record: Eligible for Bulk Auto-Clearance
  },
  {
    id: 3,
    name: "David Kipronoh",
    regNo: "ELEC/B/2241/09/21",
    cohort: "500 Level Engineering",
    pathway: "B.Eng. Electrical & Electronics",
    residence: "Off-Campus Non-Res",
    submissionDate: "June 1, 2026",
    status: "PENDING",
    remarks: "",
    disputeFiled: false,
    hasExternalHold: false // Clean record: Eligible for Bulk Auto-Clearance
  },
  {
    id: 4,
    name: "Mercy Chepkorir",
    regNo: "BBAM/K/1102/05/23",
    cohort: "400 Level Finalist",
    pathway: "Bachelor of Business Administration",
    residence: "Eileen Manor Hostels",
    submissionDate: "June 2, 2026",
    status: "APPROVED",
    remarks: "Clearance authorized. All physical assets accounted for and system card deactivated.",
    disputeFiled: false,
    hasExternalHold: false
  }
];

export default function OfficerDashboard() {
  const [students, setStudents] = useState(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeQueue, setActiveQueue] = useState('ALL'); // ALL, PENDING, FLAGGED, APPROVED
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Form Management Staging States
  const [inputRemark, setInputRemark] = useState('');
  const [inputStatus, setInputStatus] = useState('');

  // Synchronize staging values whenever a user focuses a new student card
  useEffect(() => {
    if (selectedStudent) {
      setInputRemark(selectedStudent.remarks);
      setInputStatus(selectedStudent.status);
    }
  }, [selectedStudent]);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // --- ⚡ PRIVILEGE FEATURE: AUTOMATED BATCH AUTO-APPROVALS ---
  const handleBulkBatchApproval = () => {
    // Select pending students who do NOT have active library or asset holds
    const eligibleStudents = students.filter(s => s.status === 'PENDING' && !s.hasExternalHold);

    if (eligibleStudents.length === 0) {
      alert("No eligible pending student profiles with zero institutional liabilities were found in the current batch queue.");
      return;
    }

    const verificationPrompt = window.confirm(
      `🔒 Administrative Action Re-Verification Required:\n\nAre you sure you want to mass-approve all (${eligibleStudents.length}) pending candidates verified clean by internal database structures?\n\nThis executes an immutable digital sign-off across these profiles.`
    );

    if (verificationPrompt) {
      const updatedStudents = students.map(s => {
        if (s.status === 'PENDING' && !s.hasExternalHold) {
          return {
            ...s,
            status: 'APPROVED',
            remarks: 'Automated Batch Sign-off: Profile analyzed and cleared via Department Bulk Approval Protocol.'
          };
        }
        return s;
      });

      setStudents(updatedStudents);
      
      // Update the active split pane if the student was inside the auto-cleared set
      if (selectedStudent && selectedStudent.status === 'PENDING' && !selectedStudent.hasExternalHold) {
        setSelectedStudent(prev => ({
          ...prev,
          status: 'APPROVED',
          remarks: 'Automated Batch Sign-off: Profile analyzed and cleared via Department Bulk Approval Protocol.'
        }));
      }

      triggerToast(`Successfully batch-cleared ${eligibleStudents.length} candidate profiles!`);
    }
  };

  // --- 🛠️ PRIVILEGE FEATURE: INDIVIDUAL EVALUATION MANUAL WRITE ---
  const handleSaveEvaluation = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const updatedStudents = students.map(s => {
      if (s.id === selectedStudent.id) {
        return { ...s, status: inputStatus, remarks: inputRemark };
      }
      return s;
    });

    setStudents(updatedStudents);
    setSelectedStudent({ ...selectedStudent, status: inputStatus, remarks: inputRemark });
    triggerToast(`Dossier tracking changes logged securely for ${selectedStudent.name}.`);
  };

  // Computed Dashboard Metrics Counters
  const countPending = students.filter(s => s.status === 'PENDING').length;
  const countFlagged = students.filter(s => s.status === 'FLAGGED').length;
  const countApproved = students.filter(s => s.status === 'APPROVED').length;

  // Search Query Mapping Logic
  const filteredStudents = students.filter(s => {
    const matchesQueue = activeQueue === 'ALL' || s.status === activeQueue;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.regNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesQueue && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased font-sans p-6 relative">
      
      {/* 🔔 STATUS NOTIFICATION TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-emerald-500 text-slate-950 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold border border-emerald-400 transition-all">
          <Check className="h-4 w-4 stroke-[3]" />
          <p className="text-xs tracking-wide">{toast}</p>
        </div>
      )}

      {/* 🏛️ TOP ADMINISTRATIVE CONSOLE HEADER */}
      <header className="mb-6 bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center shadow-xl gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hidden sm:block">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kabarak University DCMS Node</h1>
            </div>
            <p className="text-xl font-black text-white mt-0.5">University Library Administrative Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-900 border border-slate-700/60 px-3 py-1.5 rounded-xl text-left hidden lg:block">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Officer</span>
            <span className="text-xs font-mono font-bold text-slate-300">Dr. C. Cheruiyot (KU/LIB/2012)</span>
          </div>
          {/* ⚡ BATCH ACTION TRIGGER BUTTON */}
          <button 
            onClick={handleBulkBatchApproval}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Layers className="h-4 w-4" /> Bulk Auto-Approve Clean Records
          </button>
        </div>
      </header>

      {/* 📊 INTERACTIVE FILTER STATS ROW */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Pipeline Register', value: students.length, color: 'text-indigo-400', type: 'ALL' },
          { label: 'Pending Evaluations', value: countPending, color: 'text-amber-400', type: 'PENDING' },
          { label: 'Accounts Flagged Hold', value: countFlagged, color: 'text-rose-400', type: 'FLAGGED' },
          { label: 'Authorized Sign-Offs', value: countApproved, color: 'text-emerald-400', type: 'APPROVED' }
        ].map((card, idx) => (
          <div 
            key={idx} 
            onClick={() => setActiveQueue(card.type)}
            className={`bg-slate-800 p-4 border rounded-xl shadow-md cursor-pointer transition-all select-none ${
              activeQueue === card.type ? 'border-indigo-500 bg-slate-800/80 ring-1 ring-indigo-500/30' : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </section>

      {/* 💻 SPLIT-WORKSPACE INTERACTION MATRIX */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COMPONENT: LIVE RECORD SELECTION PIPELINE QUEUE */}
        <div className="lg:col-span-5 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl flex flex-col h-[640px]">
          <div className="mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="h-4 w-4" /> Incoming Submissions Queue
              </h2>
              <span className="text-[10px] font-mono font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">Filter: {activeQueue}</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search candidates by name or reg number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Student Dossier Cards Scroll Stack */}
          <div className="overflow-y-auto flex-1 space-y-2 pr-1 scrollbar-thin">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs font-medium">No candidate validation records found.</div>
            ) : (
              filteredStudents.map((student) => (
                <div 
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex justify-between items-center ${
                    selectedStudent?.id === student.id 
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-inner' 
                      : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-bold text-slate-200 truncate text-sm">{student.name}</p>
                    <p className="text-xs font-mono text-slate-400">{student.regNo}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Routed: {student.submissionDate}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 font-black rounded border ${
                      student.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                      student.status === 'FLAGGED' ? 'bg-rose-950 text-rose-400 border-rose-800' : 'bg-amber-950 text-amber-400 border-amber-800'
                    }`}>
                      {student.status}
                    </span>
                    {student.disputeFiled && (
                      <span className="text-[9px] font-black tracking-wide bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase animate-pulse">
                        Claim Filed
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COMPONENT: DEEP-AUDIT WORKSPACE EXECUTION FRAME */}
        <div className="lg:col-span-7 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl flex flex-col h-[640px] overflow-hidden">
          {selectedStudent ? (
            <div className="flex flex-col h-full overflow-y-auto">
              
              {/* Active Profile Header Banner */}
              <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-base text-white">{selectedStudent.name}</h3>
                  <p className="text-xs font-mono text-indigo-400">{selectedStudent.regNo} — {selectedStudent.pathway}</p>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Immutable Registration Metadata Details Container */}
              <div className="p-4 bg-slate-900/30 border-b border-slate-700/50 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[9px] tracking-wider">Cohort Grouping Level</span>
                  <span className="text-slate-300 font-semibold">{selectedStudent.cohort}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[9px] tracking-wider">Campus Housing Profile</span>
                  <span className="text-slate-300 font-semibold">{selectedStudent.residence}</span>
                </div>
              </div>

              {/* RE-AUDIT COMPLIANCE CLAIMS LAYER (Rendered if dynamic dispute filed) */}
              {selectedStudent.disputeFiled && (
                <div className="p-4 m-4 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-3">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" /> Student Verification Claim Statement Under Evaluation
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    "{selectedStudent.disputeStatement}"
                  </p>
                  <div className="pt-2 border-t border-amber-500/10 flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                      📁 Document: <span className="text-indigo-400 font-bold">{selectedStudent.evidenceFile}</span>
                    </span>
                    <button 
                      type="button"
                      onClick={() => alert(`Extracting asset signature file vault package for encryption keys...`)}
                      className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" /> Download File Reference
                    </button>
                  </div>
                </div>
              )}

              {/* PRIMARY LEDGER OPERATION WRITE-FORM */}
              <form onSubmit={handleSaveEvaluation} className="p-4 space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Ledger State Management Matrix
                  </h4>
                  
                  {/* Radio State Selector Options */}
                  <div className="space-y-2">
                    <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">1. Select Clearance Status Entry</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { key: 'PENDING', label: 'KEEP PENDING', color: 'border-amber-600/30 text-amber-400' },
                        { key: 'FLAGGED', label: 'FLAG HOLD', color: 'border-rose-600/30 text-rose-400' },
                        { key: 'APPROVED', label: 'EXECUTE SIGN-OFF', color: 'border-emerald-600/30 text-emerald-400' }
                      ].map((radio) => (
                        <label 
                          key={radio.key}
                          className={`border rounded-xl p-3 flex items-center gap-3 cursor-pointer select-none transition-all ${
                            inputStatus === radio.key 
                              ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/20' 
                              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="workflowGroup" 
                            value={radio.key}
                            checked={inputStatus === radio.key}
                            onChange={(e) => setInputStatus(e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                          />
                          <span className={`text-xs font-extrabold ${radio.color}`}>{radio.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Audit Remarks Log Field */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">2. Enforced Audit Trail Remarks & Remarks Remarks</label>
                    <textarea 
                      value={inputRemark}
                      onChange={(e) => setInputRemark(e.target.value)}
                      rows={4}
                      placeholder="Input systematic hold triggers, text asset fine values, or clearance reconciliation confirmations directly into the student registry sequence map ledger..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium leading-relaxed"
                    />
                  </div>
                </div>

                {/* Submit Workspace Buttons Box */}
                <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="bg-slate-900/60 px-3 py-2 rounded-xl text-slate-500 font-bold text-[10px] uppercase border border-slate-800 max-w-xs leading-tight hidden sm:block">
                    🔒 Department Scope Silo Enforced
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button 
                      type="button" 
                      onClick={() => setSelectedStudent(null)}
                      className="px-4 py-2.5 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer"
                    >
                      Close Dossier
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2.5 rounded-xl font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-2 cursor-pointer uppercase tracking-wider text-[11px]"
                    >
                      Authorize Action <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </form>

            </div>
          ) : (
            /* Fallback Staging Context Canvas Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <div className="p-4 rounded-full bg-slate-900/60 text-slate-700 border border-slate-800 mb-3">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <p className="font-extrabold text-slate-400 text-sm">Administrative Clearance Matrix Workspace</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                Select a final-year student's active request file from the list left-hand pane to evaluate missing assets, handle filed receipts, and execute authorization sign-offs.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}