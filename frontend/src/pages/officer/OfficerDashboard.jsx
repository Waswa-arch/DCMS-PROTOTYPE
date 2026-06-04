import React, { useState, useEffect } from 'react';
import { Users, FileText, AlertTriangle, Download, ArrowRight, Layers, Check } from 'lucide-react';

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
    hasExternalHold: true
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
    hasExternalHold: false
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
    hasExternalHold: false
  }
];

export default function OfficerDashboard() {
  const [students, setStudents] = useState(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeQueue, setActiveQueue] = useState('ALL');
  const [toast, setToast] = useState(null);
  const [inputRemark, setInputRemark] = useState('');
  const [inputStatus, setInputStatus] = useState('');

  useEffect(() => {
    if (selectedStudent) {
      setInputRemark(selectedStudent.remarks);
      setInputStatus(selectedStudent.status);
    }
  }, [selectedStudent]);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleBulkBatchApproval = () => {
    const eligible = students.filter(s => s.status === 'PENDING' && !s.hasExternalHold);
    if (eligible.length === 0) {
      alert("No eligible pending student profiles with zero institutional liabilities found.");
      return;
    }
    if (window.confirm(`Mass-approve all (${eligible.length}) pending clean candidate records?`)) {
      setStudents(students.map(s => s.status === 'PENDING' && !s.hasExternalHold ? { ...s, status: 'APPROVED', remarks: 'Automated Batch Sign-off: Cleared via Bulk Protocol.' } : s));
      triggerToast(`Successfully batch-cleared ${eligible.length} records!`);
    }
  };

  const handleSaveEvaluation = (e) => {
    e.preventDefault();
    setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, status: inputStatus, remarks: inputRemark } : s));
    setSelectedStudent({ ...selectedStudent, status: inputStatus, remarks: inputRemark });
    triggerToast(`Dossier tracking updates logged securely.`);
  };

  const filteredStudents = students.filter(s => activeQueue === 'ALL' || s.status === activeQueue);

  return (
    <div className="w-full space-y-6 text-slate-200">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-2xl font-bold flex items-center gap-2 text-xs">
          <Check className="h-4 w-4 stroke-[3]" /> {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'FLAGGED'].map(q => (
            <button key={q} onClick={() => setActiveQueue(q)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeQueue === q ? 'bg-teal-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>{q} QUEUE</button>
          ))}
        </div>
        <button onClick={handleBulkBatchApproval} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto transition-all"><Layers className="h-4 w-4" /> Bulk Auto-Approve</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 h-[500px] flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2"><Users className="h-4 w-4"/> Verification Queue</h3>
          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {filteredStudents.map(st => (
              <div key={st.id} onClick={() => setSelectedStudent(st)} className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex justify-between items-center ${selectedStudent?.id === st.id ? 'bg-teal-950/20 border-teal-500' : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'}`}>
                <div>
                  <p className="font-bold text-sm text-slate-200">{st.name}</p>
                  <p className="text-xs font-mono text-slate-400">{st.regNo}</p>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${st.status === 'FLAGGED' ? 'bg-rose-950 text-rose-400 border-rose-900' : 'bg-amber-950 text-amber-400 border-amber-900'}`}>{st.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-slate-800/60 border border-slate-700/60 rounded-2xl h-[500px] overflow-hidden flex flex-col">
          {selectedStudent ? (
            <form onSubmit={handleSaveEvaluation} className="p-4 flex flex-col h-full justify-between">
              <div className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <h4 className="font-bold text-base text-white">{selectedStudent.name}</h4>
                  <p className="text-xs font-mono text-slate-400">{selectedStudent.regNo} — {selectedStudent.pathway}</p>
                </div>

                {selectedStudent.disputeFiled && (
                  <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-2">
                    <p className="text-xs text-slate-300 italic">"{selectedStudent.disputeStatement}"</p>
                    <span className="text-[10px] font-mono text-indigo-400 block flex items-center gap-1 cursor-pointer hover:underline" onClick={() => alert('Downloading asset validation hash...')}><Download className="h-3 w-3" /> {selectedStudent.evidenceFile}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[10px] font-black tracking-wider uppercase text-slate-400">Ledger Modification</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['FLAGGED', 'APPROVED'].map(statusOption => (
                      <label key={statusOption} className={`border rounded-xl p-2.5 flex items-center gap-2 cursor-pointer transition-all ${inputStatus === statusOption ? 'bg-slate-900 border-teal-500' : 'border-slate-800 bg-slate-900/30'}`}>
                        <input type="radio" name="status" value={statusOption} checked={inputStatus === statusOption} onChange={e => setInputStatus(e.target.value)} />
                        <span className="text-xs font-bold">{statusOption}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black tracking-wider uppercase text-slate-400">Audit Remarks Log</label>
                  <textarea value={inputRemark} onChange={e => setInputRemark(e.target.value)} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500" placeholder="Enter ledger justifications..." />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/50 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedStudent(null)} className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-700 text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-black bg-teal-600 text-white uppercase tracking-wider flex items-center gap-1">Commit Write <ArrowRight className="h-3 w-3" /></button>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <FileText className="h-8 w-8 mb-2 text-slate-600" />
              <p className="text-xs font-bold text-slate-400">No Target Profile Selected</p>
              <p className="text-[11px] text-slate-500 max-w-xs mt-1">Select an incoming final-year verification record from the pipeline list layout queue to load operations matrix.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}