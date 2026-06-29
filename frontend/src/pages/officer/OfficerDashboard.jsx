import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle, AlertTriangle, Users, Clock, 
  Bell, FileText, Check, MessageSquare 
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tracker');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Real API Data States
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, cleared: 0 });
  const [notifications, setNotifications] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [actioningId, setActioningId] = useState(null);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // --- API INTERFACE LAYER ---
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      // 1. Fetch Real Department Queue
      const queueRes = await fetch('http://localhost:5001/api/clearance/officer/queue', { headers });
      const queueData = await queueRes.json();
      
      // 2. Fetch Notifications
      const notifyRes = await fetch('http://localhost:5001/api/notifications', { headers });
      const notifyData = await notifyRes.json();

      if (queueData.success) {
        const activeQueue = queueData.queue || [];
        setQueue(activeQueue);
        
        // Calculate dynamic real stats metrics based on current department queue parameters
        const pendingCount = activeQueue.filter(item => item.status === 'PENDING').length;
        const approvedCount = activeQueue.filter(item => item.status === 'APPROVED').length;
        setStats({
          total: activeQueue.length,
          pending: pendingCount,
          cleared: approvedCount
        });
      }
      
      if (notifyData.success) {
        setNotifications(notifyData.notifications || []);
      }
    } catch (err) {
      console.error("Dashboard synchronization error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  // Handle Approve or Flag Form Submissions
  const handleAction = async (itemId, targetStatus) => {
    try {
      setActioningId(itemId);
      const token = localStorage.getItem('token');
      const itemRemarks = remarks[itemId] || '';

      const response = await fetch(`http://localhost:5000/api/clearance/item/${itemId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus, remarks: itemRemarks })
      });

      const data = await response.json();
      if (data.success) {
        triggerToast(`Item successfully updated to ${targetStatus}`);
        setRemarks(prev => ({ ...prev, [itemId]: '' }));
        fetchDashboardData(); // Refresh datasets live
      } else {
        alert(`Action rejected: ${data.message}`);
      }
    } catch (err) {
      alert('Network transmission failed while processing administrative decision.');
    } finally {
      setActioningId(null);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-bold text-slate-500 animate-pulse">Syncing Department Clearance Registers...</p>
      </div>
    );
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab} toast={toast} setToast={setToast}>
      
      {/* 📊 GLOBAL STATS HERO SECTION (SCOPED) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] uppercase text-slate-400 font-black tracking-wider">Total Requests</p>
            <h3 className="text-xl font-black text-slate-800">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] uppercase text-slate-400 font-black tracking-wider">Pending Action</p>
            <h3 className="text-xl font-black text-slate-800">{stats.pending}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] uppercase text-slate-400 font-black tracking-wider">Cleared Rows</p>
            <h3 className="text-xl font-black text-slate-800">{stats.cleared}</h3>
          </div>
        </div>
      </div>

      {/* CONDITIONAL SUB-VIEW MANAGER */}
      {activeTab === 'tracker' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">💼 Departmental Clearance Ledger</h2>
              <p className="text-xs text-slate-400">Authorized processing queue bound to your administrative token signature.</p>
            </div>
            <span className="text-[10px] bg-slate-200 text-slate-700 font-black px-2.5 py-1 rounded-full uppercase">
              Dept ID: {user?.department_id || 'System'}
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-bold">
              🎉 No pending clearance requests found for your department.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="p-4">Student Context</th>
                    <th className="p-4">Registration Keys</th>
                    <th className="p-4">Status Token</th>
                    <th className="p-4 w-1/3">Administrative Remarks</th>
                    <th className="p-4 text-center">Action Deck</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {queue.map((req) => (
                    <tr key={req.item_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{req.student_name}</td>
                      <td className="p-4 font-mono text-slate-500">
                        {req.student_id_number}
                        <span className="block font-sans text-[10px] text-slate-400 mt-0.5">{req.student_email}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-amber-50 border border-amber-200 text-amber-700 uppercase">
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                          <MessageSquare className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <input 
                            type="text"
                            placeholder="Add hold remarks or resolution parameters..."
                            value={remarks[req.item_id] || ''}
                            onChange={(e) => setRemarks(prev => ({ ...prev, [req.item_id]: e.target.value }))}
                            className="w-full bg-transparent text-xs text-slate-700 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            disabled={actioningId !== null}
                            onClick={() => handleAction(req.item_id, 'APPROVED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2 rounded-xl transition disabled:opacity-50"
                            title="Grant Department Clearance"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </button>
                          <button
                            disabled={actioningId !== null}
                            onClick={() => handleAction(req.item_id, 'FLAGGED')}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold p-2 rounded-xl transition disabled:opacity-50"
                            title="Flag Request Hold"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* 🔔 NOTIFICATIONS ACCESSIBILITY BOARD */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">🔔 Administrative Alerts Panel</h2>
            <p className="text-xs text-slate-400">Real-time action logs generated by institutional core triggers.</p>
          </div>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Your inbox stream is completely clear.</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-start gap-4">
                  <div className="flex gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mt-0.5"><Bell className="h-4 w-4" /></div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => markNotificationRead(n.id)}
                    className="text-[10px] text-indigo-600 hover:bg-indigo-50 font-bold px-2.5 py-1 rounded-lg transition"
                  >
                    Dismiss
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}