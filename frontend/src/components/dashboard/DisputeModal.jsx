import React, { useState } from 'react';
import { X } from 'lucide-react';

const DisputeModal = ({ user, selectedDisputeDept, setSelectedDisputeDept, setMasterClearanceRecords, triggerToast }) => {
  const [disputeText, setDisputeText] = useState('');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-rose-900 text-white flex justify-between items-center">
          <h3 className="font-black text-sm tracking-wide uppercase">File Resolution Matrix</h3>
          <button onClick={() => setSelectedDisputeDept(null)} className="p-1 text-rose-200 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmitDispute} className="p-5 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border text-xs">
            <span className="font-black uppercase text-slate-400 block mb-1">Active Fine Infraction Argument:</span>
            <p className="text-slate-700 font-medium">{selectedDisputeDept.notes}</p>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Provide Verification/Dispute Justification</label>
            <textarea 
              required 
              rows={3} 
              value={disputeText} 
              onChange={(e) => setDisputeText(e.target.value)} 
              placeholder="Type specific details, invoice references, or returned dates here..." 
              className="w-full border rounded-xl p-3 text-xs outline-none focus:border-rose-500 bg-white" 
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setSelectedDisputeDept(null)} 
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors"
            >
              Dismiss
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 text-white uppercase cursor-pointer hover:bg-rose-700 transition-colors"
            >
              Dispatch Case Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeModal;