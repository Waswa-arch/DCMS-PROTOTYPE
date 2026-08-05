import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Building2, CheckCircle, Clock, Flag, ChevronDown, ChevronUp, Send, Download } from 'lucide-react';

// Counts up from 0 to `value` on mount/change — small, purposeful motion
// on the stat cards rather than numbers just appearing.
const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value || 0;
    if (from === to) return;
    const duration = 500;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else prevValue.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
};

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [expandedItemId, setExpandedItemId] = useState(null);
  const [resubmitText, setResubmitText] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [resubmitFeedback, setResubmitFeedback] = useState({});

  const [downloadingCert, setDownloadingCert] = useState(false);
  const [certError, setCertError] = useState(null);

  const fetchClearance = async () => {
    try {
      setLoading(true);
      const { data: response } = await api.get('/clearance/me');
      setData(response);
    } catch (err) {
      setError('Unable to load your clearance data. Please refresh or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (requestId) => {
    setDownloadingCert(true);
    setCertError(null);
    try {
      const res = await api.get(`/clearance/certificate/${requestId}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url);
    } catch (err) {
      setCertError('Certificate not yet available. Contact the Academic Registrar if you believe this is an error.');
    } finally {
      setDownloadingCert(false);
    }
  };

  useEffect(() => {
    fetchClearance();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: 'bg-blue-50 text-blue-700 border border-blue-200',
      APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      FLAGGED: 'bg-rose-50 text-rose-700 border border-rose-200',
      PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    };
    return `inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 ${
      styles[status] || 'bg-slate-100 text-slate-600'
    }`;
  };

  const handleToggleExpand = (itemId) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
  };

  const handleResubmit = async (itemId) => {
    setSubmitting(itemId);
    setResubmitFeedback((prev) => ({ ...prev, [itemId]: null }));

    try {
      const note = resubmitText[itemId] || '';
      await api.post(`/clearance/item/${itemId}/resubmit`, { remarks: note });
      setResubmitFeedback((prev) => ({
        ...prev,
        [itemId]: { type: 'success', message: 'Resubmitted for re-review.' },
      }));
      setResubmitText((prev) => ({ ...prev, [itemId]: '' }));
      await fetchClearance();
    } catch (err) {
      setResubmitFeedback((prev) => ({
        ...prev,
        [itemId]: {
          type: 'error',
          message: err.response?.data?.message || 'Resubmission failed.',
        },
      }));
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-16 dcms-skeleton rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 dcms-skeleton rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
          <div className="h-48 dcms-skeleton rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="dcms-enter p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  if (!data?.clearance_request) {
    return (
      <DashboardLayout>
        <div className="dcms-enter p-8 text-center text-slate-400 text-sm">
          No clearance record found. Contact the registrar's office.
        </div>
      </DashboardLayout>
    );
  }

  const { clearance_request, departmental_status } = data;
  const items = departmental_status || [];

  const flaggedItems = items.filter((item) => item.status === 'FLAGGED');
  const otherItems = items.filter((item) => item.status !== 'FLAGGED');

  const stats = {
    departments: items.length,
    cleared: items.filter((item) => item.status === 'APPROVED').length,
    pending: items.filter((item) => item.status === 'PENDING').length,
    flagged: flaggedItems.length,
  };

  const progressPct = stats.departments > 0 ? Math.round((stats.cleared / stats.departments) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 dcms-enter">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              My Clearance
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track your departmental clearance progress across all university nodes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {clearance_request.overall_status === 'APPROVED' && (
              <button
                onClick={() => handleDownloadCertificate(clearance_request.id)}
                disabled={downloadingCert}
                className="dcms-press flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                {downloadingCert ? 'Loading...' : 'Download Certificate'}
              </button>
            )}
            <span className={getStatusBadge(clearance_request.overall_status)}>
              {clearance_request.overall_status}
            </span>
          </div>
        </div>
        {certError && (
          <div className="dcms-enter p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {certError}
          </div>
        )}

        {/* SIGNATURE ELEMENT: clearance progress bar. The fill width is
            tied directly to cleared/departments, and the width transition
            in index.css (.dcms-progress-fill) is what makes it visibly
            animate in on load and grow when a department clears you —
            motion that means something, not decoration. */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm dcms-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Overall Progress
            </span>
            <span className="text-xs font-black text-slate-700">
              {stats.cleared}/{stats.departments} departments · {progressPct}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`dcms-progress-fill h-full rounded-full ${
                stats.flagged > 0
                  ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                  : progressPct === 100
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : 'bg-gradient-to-r from-indigo-400 to-indigo-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 dcms-stagger">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm dcms-card">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tracking ID
            </div>
            <div className="text-sm font-mono font-bold text-slate-700 mt-1">
              DCMS-REQ-{clearance_request.id}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm dcms-card">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Last Updated
            </div>
            <div className="text-sm font-bold text-slate-700 mt-1">
              {clearance_request.updated_at
                ? new Date(clearance_request.updated_at).toLocaleString()
                : 'Not yet actioned'}
            </div>
          </div>
        </div>

        {/* STATS CARDS — computed from the same departmental_status data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 dcms-stagger">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm dcms-card">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Departments
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-500" />
              <AnimatedNumber value={stats.departments} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm dcms-card">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Cleared
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <AnimatedNumber value={stats.cleared} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm dcms-card">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pending
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <AnimatedNumber value={stats.pending} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm dcms-card">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Flagged
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-2">
              <Flag className={`h-5 w-5 text-rose-500 ${stats.flagged > 0 ? 'dcms-pop' : ''}`} />
              <AnimatedNumber value={stats.flagged} />
            </div>
          </div>
        </div>

        {/* FLAGGED ITEMS — separate section, expandable, resubmit inline */}
        {flaggedItems.length > 0 && (
          <div className="dcms-enter bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
            <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 flex items-center gap-2">
              <Flag className="h-3.5 w-3.5 text-rose-500" />
              <h2 className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                Flagged Items — Action Needed
              </h2>
            </div>
            <div className="divide-y divide-rose-100">
              {flaggedItems.map((item) => {
                const isExpanded = expandedItemId === item.item_id;
                const feedback = resubmitFeedback[item.item_id];
                return (
                  <div key={item.item_id} className="px-4 py-3">
                    <button
                      onClick={() => handleToggleExpand(item.item_id)}
                      className="w-full flex items-center justify-between gap-3 text-left group"
                    >
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {item.department_name}
                      </div>
                      <div className="text-slate-400 flex-shrink-0 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <ChevronDown className="h-4 w-4 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </button>

                    <div className={`dcms-collapse ${isExpanded ? 'dcms-collapse-open' : ''}`}>
                      <div>
                        <div className="mt-3 space-y-3">
                          <div className="bg-rose-50/60 border border-rose-100 rounded-lg p-3">
                            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">
                              Reason for flag
                            </p>
                            <p className="text-xs text-slate-700">
                              {item.remarks || 'No reason provided.'}
                            </p>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Note for the officer (optional)
                            </label>
                            <textarea
                              value={resubmitText[item.item_id] || ''}
                              onChange={(e) =>
                                setResubmitText((prev) => ({
                                  ...prev,
                                  [item.item_id]: e.target.value,
                                }))
                              }
                              placeholder="Describe what you've done to resolve this, e.g. paid the outstanding balance or corrected the missing document."
                              rows={2}
                              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all resize-none"
                            />
                          </div>

                          {feedback && (
                            <p
                              className={`dcms-enter text-[11px] font-medium ${
                                feedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {feedback.message}
                            </p>
                          )}

                          <button
                            onClick={() => handleResubmit(item.item_id)}
                            disabled={submitting === item.item_id}
                            className="dcms-press flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {submitting === item.item_id ? 'Resubmitting...' : 'Resubmit for re-review'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="dcms-enter bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Departmental Progress
            </h2>
          </div>

          {!otherItems.length ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-500">
                {items.length === 0
                  ? 'Department items are being provisioned.'
                  : 'All remaining items are shown in Flagged Items above.'}
              </p>
              {items.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">Refresh the page in a moment.</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dcms-stagger">
              {otherItems.map((item) => (
                <div
                  key={item.item_id}
                  className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors duration-200"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {item.department_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.remarks || 'Awaiting review.'}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className={getStatusBadge(item.status)}>
                      {item.status}
                    </span>
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

export default StudentDashboard;