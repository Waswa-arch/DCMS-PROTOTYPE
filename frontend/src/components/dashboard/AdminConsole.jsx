import React from 'react';

const AdminConsole = ({ masterClearanceRecords, setMasterClearanceRecords, simulatedOfficerDept, setSimulatedOfficerDept, triggerToast }) => {
  const isolatedDepartmentalRequests = masterClearanceRecords.filter(r => r.department === simulatedOfficerDept);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Administrative clearance console</h2>
          <p className="text-xs text-slate-500 font-semibold pt-1">
            Current Department Focus Node: <span className="text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-mono">{simulatedOfficerDept}</span>
          </p>
        </div>

        <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase">Simulate Desk View:</span>
          <select 
            className="bg-slate-800 border border-slate-700 rounded text-xs font-bold p-1 text-teal-400 outline-none cursor-pointer" 
            value={simulatedOfficerDept} 
            onChange={(e) => setSimulatedOfficerDept(e.target.value)}
          >
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
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded border uppercase ${
                      task.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      task.status === 'Flagged' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{task.status}</span>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button 
                      onClick={() => {
                        setMasterClearanceRecords(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Approved', notes: 'Verification complete. Ledger balance cleared.' } : t));
                        triggerToast("Student file approved successfully.");
                      }} 
                      className="px-2.5 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded cursor-pointer hover:bg-emerald-700 transition-colors"
                    >
                      Approve Signoff
                    </button>
                    <button 
                      onClick={() => {
                        setMasterClearanceRecords(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Flagged', notes: 'Asset liability violation hold recorded.' } : t));
                        triggerToast("Student hold registered.");
                      }} 
                      className="px-2.5 py-1 text-[10px] font-bold bg-rose-600 text-white rounded cursor-pointer hover:bg-rose-700 transition-colors"
                    >
                      Place Flag Hold
                    </button>
                  </td>
                </tr>
              ))}
              {isolatedDepartmentalRequests.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 font-medium italic">
                    No active requests currently submitted to this departmental workspace registry pipeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminConsole;