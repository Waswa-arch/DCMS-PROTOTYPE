import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import DashboardLayout from '../../layouts/DashboardLayout';

const OfficerDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [actioning, setActioning] = useState(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/clearance/officer/queue');
      setQueue(data.queue || []);
    } catch (err) {
      setError('Failed to fetch clearance queue. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (id, status) => {
    const itemRemarks = remarks[id]?.trim() || '';

    if (status === 'FLAGGED' && !itemRemarks) {
      alert('You must provide a remark when flagging an item. The student needs to know why.');
      return;
    }

    try {
      setActioning(id);
      await api.post(`/clearance/item/${id}/action`, {
        status,
        remarks: itemRemarks,
      });
      setRemarks((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      await fetchQueue();
    } catch (err) {
      alert('Action failed. Please try again.');
    } finally {
      setActioning(null);
    }
  };

  const handleRemarksChange = (id, value) => {
    setRemarks((prev) => ({ ...prev, [id]: value }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-400 text-sm">
          Loading department queue...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Department Clearance Queue
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review and action pending student clearance requests for your department.
            </p>
          </div>
          <button
            onClick={fetchQueue}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pending Items — {queue.length} {queue.length === 1 ? 'request' : 'requests'}
            </h2>
          </div>

          {queue.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-500">
                No pending clearance requests in your department.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Check back later or refresh the page.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {queue.map((item) => (
                <div
                  key={item.item_id}
                  className="p-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800">
                      {item.student_name}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {item.student_id_number}
                      </span>
                      <span>{item.student_email}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto lg:max-w-xl">
                    <input
                      type="text"
                      placeholder="Add remarks (required when flagging)..."
                      className="bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-slate-400 w-full lg:w-72 transition-colors"
                      value={remarks[item.item_id] || ''}
                      onChange={(e) => handleRemarksChange(item.item_id, e.target.value)}
                      disabled={actioning === item.item_id}
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(item.item_id, 'APPROVED')}
                        disabled={actioning !== null}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
                      >
                        {actioning === item.item_id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(item.item_id, 'FLAGGED')}
                        disabled={actioning !== null}
                        className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
                      >
                        {actioning === item.item_id ? '...' : 'Flag'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OfficerDashboard;