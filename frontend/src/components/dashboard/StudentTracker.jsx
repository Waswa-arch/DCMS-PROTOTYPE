import React from 'react';
import { Rocket } from 'lucide-react';

const StudentTracker = ({ user, masterClearanceRecords, setMasterClearanceRecords, triggerToast, setSelectedDisputeDept }) => {
  // Compute logged-in student data strings
  const studentTasks = masterClearanceRecords.filter(r => r.studentEmail === user?.email);
  const isInitiated = studentTasks.length > 0;
  
  const approvedCount = studentTasks.filter(t => t.status === 'Approved').length;
  const progressPercentage = studentTasks.length > 0 && approvedCount > 0 
    ? Math.round((approvedCount / studentTasks.length) * 100) 
    : 0;

  // Dynamically generate student profile tracks
  const handleApproveClearanceInitiation = () => {
    if (!user) return;

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

    setMasterClearanceRecords(personalizedTracks);
    triggerToast("Clearance sequence deployed successfully to all departments!");
  };

  if (!isInitiated) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto overflow-hidden my-6">
        <div className="p-8 bg-slate-900 text-white text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <Rocket className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Clearance Document Pipeline Gateway</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">No digital tracking session currently maps to your student profile details.</p>
        </div>
        <div className="p-8 text-center bg-white">
          <button onClick={handleApproveClearanceInitiation} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wide rounded-xl shadow-md uppercase cursor-pointer">
            Initiate My Clearance File Records
          </button>
        </div>
      </div>
    );
  }

  return (
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
          <div 
            key={task.id} 
            onClick={() => task.status === 'Flagged' && setSelectedDisputeDept(task)} 
            className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all ${
              task.status === 'Flagged' ? 'border-rose-300 shadow-sm hover:shadow-md cursor-pointer' : 'border-slate-200'
            }`}
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-black text-sm text-slate-900">{task.department}</h4>
                <span className={`px-2 py-0.5 text-[9px] font-black rounded border uppercase ${
                  task.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                  task.status === 'Flagged' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>{task.status}</span>
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
  );
};

export default StudentTracker;