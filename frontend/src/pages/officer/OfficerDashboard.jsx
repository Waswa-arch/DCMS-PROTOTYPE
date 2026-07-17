import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import DashboardLayout from '../../layouts/DashboardLayout';

const STAT_CARDS = [
  { status: 'PENDING', label: 'Pending', activeClasses: 'border-amber-400 ring-1 ring-amber-200', valueClasses: 'text-amber-600' },
  { status: 'APPROVED', label: 'Approved', activeClasses: 'border-emerald-400 ring-1 ring-emerald-200', valueClasses: 'text-emerald-600' },
  { status: 'FLAGGED', label: 'Flagged', activeClasses: 'border-rose-400 ring-1 ring-rose-200', valueClasses: 'text-rose-600' },
];

const OfficerDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ PENDING: 0, APPROVED: 0, FLAGGED: 0 });
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [actioning, setActioning] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/clearance/officer/stats');
      setStats(data.stats || { PENDING: 0, APPROVED: 0, FLAGGED: 0 });
    } catch (err) {
      // Non-fatal: cards just show stale/zero values, queue still works
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/clearance/officer/history');
      setHistory(data.history || []);
    } catch (err) {
      // Non-fatal: section just shows empty/stale if this fails
    }
  };

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/clearance/officer/queue?status=${statusFilter}`);
      setQueue(data.queue || []);
    } catch (err) {
      setError('Failed to fetch clearance queue. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchStats(), fetchQueue(), fetchHistory()]);
  };

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, []);

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

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
      await refreshAll();
    } catch (err) {
      alert('Action failed. Please try again.');
    } finally {
      setActioning(null);
    }
  };

  const handleRemarksChange = (id, value) => {
    setRemarks((prev) => ({ ...prev, [id]: value }));
  };

  const queueLabel = statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase();

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
            onClick={refreshAll}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Refresh
          </button>
        </div>

        {/* STAT CARDS — real data from GET /clearance/officer/stats.
            Each card is also a filter: clicking it sets statusFilter, which
            re-fetches the queue below scoped to that status. This is what
            makes "Flagged" an actionable number instead of a dead end —
            previously getOfficerQueue only ever returned PENDING items, so
            a flagged item had no UI path back into view once flagged. */}
        <div className="grid grid-cols-3 gap-4">
          {STAT_CARDS.map((card) => {
            const isActive = statusFilter === card.status;
            return (
              <button
                key={card.status}
                onClick={() => setStatusFilter(card.status)}
                className={`bg-white p-4 rounded-xl border shadow-sm text-left transition-colors ${
                  isActive ? card.activeClasses : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {card.label}
                </div>
                <div className={`text-2xl font-black mt-1 ${card.valueClasses}`}>
                  {stats[card.status]}
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {queueLabel} Items — {queue.length} {queue.length === 1 ? 'request' : 'requests'}
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Loading {queueLabel.toLowerCase()} items...
            </div>
          ) : queue.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-500">
                No {queueLabel.toLowerCase()} clearance items in your department.
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
                    {item.status !== 'PENDING' && (item.remarks || item.actioned_at) && (
                      <div className="text-xs text-slate-500 mt-1">
                        {item.remarks && (
                          <>
                            <span className="font-semibold">Remarks:</span> {item.remarks}
                          </>
                        )}
                        {item.actioned_at && (
                          <span className="text-slate-400 ml-2">
                            · {new Date(item.actioned_at.replace(' ', 'T')).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action controls are gated by the item's OWN status, not
                      the current filter — so a FLAGGED item always shows a
                      "reverse to Approved" action, and an already-APPROVED
                      item shows no confusing "Approve" button. */}
                  {item.status === 'PENDING' && (
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
                  )}

                  {item.status === 'FLAGGED' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(item.item_id, 'APPROVED')}
                        disabled={actioning !== null}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
                      >
                        {actioning === item.item_id ? '...' : 'Reverse to Approved'}
                      </button>
                    </div>
                  )}

                  {item.status === 'APPROVED' && (
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider self-center">
                      Approved
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MY RECENT ACTIONS — officer's own approve/flag history, from
            GET /clearance/officer/history. Scoped server-side to actor_id,
            so this can never show another officer's decisions. Collapsed
            by default to keep the main queue the primary focus. */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setHistoryOpen((prev) => !prev)}
            className="w-full bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
          >
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              My Recent Actions
            </h2>
            <span className="text-xs text-slate-400">
              {historyOpen ? 'Hide ▲' : 'Show ▼'}
            </span>
          </button>

          {historyOpen && (
            history.length === 0 ? (
              <div className="px-6 py-8 text-center text-xs text-slate-400">
                No actions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((entry) => (
                  <div key={entry.id} className="px-4 py-3">
                    <p className="text-xs text-slate-600">{entry.details}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {new Date(entry.created_at.replace(' ', 'T')).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OfficerDashboard;