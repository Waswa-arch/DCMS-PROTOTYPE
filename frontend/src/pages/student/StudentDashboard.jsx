import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import DashboardLayout from '../../layouts/DashboardLayout';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
    fetchClearance();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: 'bg-blue-50 text-blue-700 border border-blue-200',
      APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      FLAGGED: 'bg-rose-50 text-rose-700 border border-rose-200',
      PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    };
    return `inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
      styles[status] || 'bg-slate-100 text-slate-600'
    }`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-400 text-sm">
          Loading your clearance status...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  if (!data?.clearance_request) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-400 text-sm">
          No clearance record found. Contact the registrar's office.
        </div>
      </DashboardLayout>
    );
  }

  const { clearance_request, departmental_status } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              My Clearance
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track your departmental clearance progress across all university nodes.
            </p>
          </div>
          <span className={getStatusBadge(clearance_request.overall_status)}>
            {clearance_request.overall_status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tracking ID
            </div>
            <div className="text-sm font-mono font-bold text-slate-700 mt-1">
              DCMS-REQ-{clearance_request.id}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
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

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Departmental Progress
            </h2>
          </div>

          {!departmental_status?.length ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-500">
                Department items are being provisioned.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Refresh the page in a moment.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {departmental_status.map((item) => (
                <div
                  key={item.item_id}
                  className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
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